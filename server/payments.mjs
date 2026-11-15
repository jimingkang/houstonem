import { transaction } from './transactions.mjs';
import { customerOrders, orderItems } from './orders.mjs';

export const AWAITING_PAYMENT = 'Confirmed - awaiting payment';
const checkoutPath = /^\/api\/orders\/([a-zA-Z0-9_-]{1,100})\/checkout$/;
const refreshPath = /^\/api\/orders\/([a-zA-Z0-9_-]{1,100})\/payment\/refresh$/;
export const paypalWebhookPath = '/api/payments/paypal/webhook';
const MAX_WEBHOOK_BYTES = 256 * 1024;

class ProviderError extends Error { provider = true; }
class WebhookError extends Error {}

const toValue = cents => (cents / 100).toFixed(2);
const toCents = value => Math.round(Number(value) * 100);

// PayPal Orders v2 through its REST API (no SDK). The buyer approves on paypal.com; this server
// then captures the order. Card and PayPal account details never reach this server.
export function createPayPalProvider({ clientId, clientSecret, webhookId, environment = 'sandbox', fetchImpl = fetch, apiBase }) {
  if (!clientId || !clientSecret) throw new Error('PayPal client ID and secret are required.');
  const base = apiBase || (environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');
  let token = null;
  const accessToken = async () => {
    if (token && token.expires > Date.now()) return token.value;
    const response = await fetchImpl(base + '/v1/oauth2/token', {
      method: 'POST', body: 'grant_type=client_credentials', signal: AbortSignal.timeout(15000),
      headers: { Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.access_token) throw new ProviderError('PayPal authentication failed: ' + response.status);
    token = { value: body.access_token, expires: Date.now() + Math.max(60, Number(body.expires_in) - 120) * 1000 };
    return token.value;
  };
  const call = async (method, path, payload, requestId) => {
    const headers = { Authorization: 'Bearer ' + await accessToken(), 'Content-Type': 'application/json', Prefer: 'return=representation' };
    if (requestId) headers['PayPal-Request-Id'] = requestId;
    const response = await fetchImpl(base + path, { method, headers, body: payload === undefined ? undefined : JSON.stringify(payload), signal: AbortSignal.timeout(15000) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new ProviderError('PayPal request failed: ' + (body?.details?.[0]?.issue || body?.name || response.status));
      error.issue = body?.details?.[0]?.issue;
      throw error;
    }
    return body;
  };
  // Normalized checkout: open (awaiting the buyer), approved (ready to capture), paid (captured).
  const checkout = order => {
    const unit = order.purchase_units?.[0] || {};
    const capture = unit.payments?.captures?.find(entry => entry.status === 'COMPLETED');
    const amount = capture?.amount || unit.amount || {};
    return {
      id: order.id, status: order.status,
      open: ['CREATED', 'SAVED', 'PAYER_ACTION_REQUIRED'].includes(order.status),
      approved: order.status === 'APPROVED', paid: order.status === 'COMPLETED' && Boolean(capture),
      url: order.links?.find(link => link.rel === 'payer-action' || link.rel === 'approve')?.href || null,
      orderId: unit.custom_id || unit.reference_id || null,
      amountCents: amount.value === undefined ? null : toCents(amount.value), currency: amount.currency_code || null,
      reference: capture?.id || null,
    };
  };
  const retrieveCheckout = async id => checkout(await call('GET', '/v2/checkout/orders/' + encodeURIComponent(id)));
  return {
    name: 'paypal',
    async createCheckout({ orderId, amountCents, currency, description, successUrl, cancelUrl, requestId }) {
      return checkout(await call('POST', '/v2/checkout/orders', {
        intent: 'CAPTURE',
        purchase_units: [{ reference_id: orderId, custom_id: orderId, description: description.slice(0, 127), amount: { currency_code: currency, value: toValue(amountCents) } }],
        payment_source: { paypal: { experience_context: { brand_name: 'Houston Electron Microscopy', user_action: 'PAY_NOW', shipping_preference: 'NO_SHIPPING', return_url: successUrl, cancel_url: cancelUrl } } },
      }, requestId));
    },
    retrieveCheckout,
    // Captures an approved order; safe to call repeatedly.
    async completeCheckout(id) {
      const current = await retrieveCheckout(id);
      if (!current.approved) return current;
      try { return checkout(await call('POST', `/v2/checkout/orders/${encodeURIComponent(id)}/capture`, {}, 'capture-' + id)); }
      catch (error) { if (error.issue === 'ORDER_ALREADY_CAPTURED') return retrieveCheckout(id); throw error; }
    },
    // Verifies the event with PayPal, then returns the PayPal order ID it concerns (or null).
    // The caller re-reads that order from the API rather than trusting the event body.
    async verifyWebhook(raw, headers) {
      if (!webhookId) throw new WebhookError('Webhook ID is not configured.');
      let event;
      try { event = JSON.parse(raw); } catch { throw new WebhookError('Invalid JSON.'); }
      const header = name => headers['paypal-' + name];
      if (!['auth-algo', 'cert-url', 'transmission-id', 'transmission-sig', 'transmission-time'].every(header)) throw new WebhookError('Missing signature headers.');
      const verified = await call('POST', '/v1/notifications/verify-webhook-signature', {
        auth_algo: header('auth-algo'), cert_url: header('cert-url'), transmission_id: header('transmission-id'),
        transmission_sig: header('transmission-sig'), transmission_time: header('transmission-time'), webhook_id: webhookId, webhook_event: event,
      });
      if (verified.verification_status !== 'SUCCESS') throw new WebhookError('Invalid signature.');
      if (event.event_type === 'CHECKOUT.ORDER.APPROVED' || event.event_type === 'CHECKOUT.ORDER.COMPLETED') return event.resource?.id || null;
      if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') return event.resource?.supplementary_data?.related_ids?.order_id || null;
      return null;
    },
  };
}

export function paymentsFromEnvironment(env = process.env) {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) return null;
  return createPayPalProvider({ clientId: env.PAYPAL_CLIENT_ID, clientSecret: env.PAYPAL_CLIENT_SECRET, webhookId: env.PAYPAL_WEBHOOK_ID, environment: env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox' });
}

async function paymentDue(tx, orderId) {
  return tx.prepare('SELECT amount_cents,currency,status,checkout_session_id FROM order_payments WHERE order_id=?').get(orderId);
}

// Records a provider-confirmed payment once. Amount and currency must match what the lab confirmed.
// Unknown (for example deleted) orders are logged and ignored.
export async function markOrderPaid(db, { orderId, amountCents, currency, reference, sessionId, provider }) {
  return transaction(db, async tx => {
    const lock = tx.dialect === 'postgres' ? ' FOR UPDATE' : '';
    const order = await tx.prepare('SELECT status FROM orders WHERE id=?' + lock).get(orderId);
    const due = order && await paymentDue(tx, orderId);
    if (!order || !due) { console.error('Payment received for an unknown order:', orderId, reference); return 'unknown'; }
    if (due.status === 'paid') return 'already-paid';
    if (Number(due.amount_cents) !== Number(amountCents) || due.currency !== currency) {
      console.error('Payment amount mismatch for order', orderId, reference);
      return 'mismatch';
    }
    const now = new Date().toISOString();
    await tx.prepare('UPDATE order_payments SET status=?,provider=?,payment_reference=?,checkout_session_id=?,paid_at=?,updated_at=? WHERE order_id=?')
      .run('paid', provider, reference, sessionId, now, now, orderId);
    if (order.status === AWAITING_PAYMENT) {
      await tx.prepare('UPDATE orders SET status=? WHERE id=?').run('Paid', orderId);
      return 'paid';
    }
    // For example a cancelled order that was paid anyway: keep the record so staff can refund it.
    console.error('Payment recorded for order', orderId, 'in status', order.status, '- review for refund.');
    return 'paid-needs-review';
  });
}

async function ownedPayableOrder(db, user, orderId) {
  const order = await db.prepare('SELECT id,status,subtotal_cents,currency FROM orders WHERE id=? AND customer_id=?').get(orderId, user.id);
  if (!order) return { error: [404, 'Order not found.'] };
  let due = await paymentDue(db, orderId);
  if (!due && order.status === AWAITING_PAYMENT && Number(order.subtotal_cents) > 0) {
    // Orders confirmed before online payment existed: the catalog estimate is the amount due.
    await db.prepare(`INSERT INTO order_payments(order_id,amount_cents,currency,status,updated_at) VALUES(?,?,?,'due',?) ON CONFLICT(order_id) DO NOTHING`)
      .run(orderId, Number(order.subtotal_cents), order.currency, new Date().toISOString());
    due = await paymentDue(db, orderId);
  }
  if (due?.status === 'paid' || order.status === 'Paid') return { error: [409, 'This order has already been paid.'] };
  if (order.status !== AWAITING_PAYMENT || !due) return { error: [409, 'This order is not ready for payment yet.'] };
  return { order, due };
}

// Captures if approved, then records the payment. Only a checkout created for this order counts.
async function settle(db, provider, checkoutId, expectedOrderId = null) {
  const result = await provider.completeCheckout(checkoutId);
  if (!result.paid || !result.orderId || (expectedOrderId && result.orderId !== expectedOrderId)) return result;
  await markOrderPaid(db, { orderId: result.orderId, amountCents: result.amountCents, currency: result.currency, reference: result.reference, sessionId: result.id, provider: provider.name });
  return result;
}

export async function servePayments(req, json, db, user, provider, path) {
  if (path === paypalWebhookPath && req.method === 'POST') {
    if (!provider) return json(503, { error: 'Online payment is not configured.' });
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (Buffer.byteLength(raw) > MAX_WEBHOOK_BYTES) return json(413, { error: 'Payload too large.' });
    }
    try {
      const checkoutId = await provider.verifyWebhook(raw, req.headers);
      if (checkoutId) await settle(db, provider, checkoutId);
    } catch (error) {
      if (error instanceof WebhookError) return json(400, { error: 'Invalid webhook.' });
      if (error.provider) { console.error(error.message); return json(502, { error: 'Payment provider unavailable.' }); } // PayPal retries.
      throw error;
    }
    return json(200, { received: true });
  }

  const checkout = checkoutPath.exec(path);
  const refresh = refreshPath.exec(path);
  if (!(checkout || refresh) || req.method !== 'POST') return false;
  if (!user) return json(401, { error: 'Please sign in to your client account.' });
  const orderId = (checkout || refresh)[1];

  if (refresh) {
    // The buyer is back from PayPal: capture the checkout this server created (never one named in the URL).
    const owned = await db.prepare('SELECT 1 FROM orders WHERE id=? AND customer_id=?').get(orderId, user.id);
    if (!owned) return json(404, { error: 'Order not found.' });
    const due = await paymentDue(db, orderId);
    if (provider && due?.checkout_session_id && due.status !== 'paid') {
      try { await settle(db, provider, due.checkout_session_id, orderId); }
      catch (error) { if (!error.provider) throw error; console.error(error.message); }
    }
    return json(200, { order: (await customerOrders(db, user.id, orderId))[0] });
  }

  if (!provider) return json(503, { error: 'Online payment is not available yet. Please contact the lab to arrange payment.' });
  const { due, error } = await ownedPayableOrder(db, user, orderId);
  if (error) return json(error[0], { error: error[1] });
  try {
    // Reuse the open checkout so a second click cannot create a second payment.
    if (due.checkout_session_id) {
      let existing = null;
      try { existing = await settle(db, provider, due.checkout_session_id, orderId); }
      catch (error) { if (!error.provider) throw error; console.error(error.message); } // Expired or unknown: start a new one.
      if (existing?.paid) return json(409, { error: 'This order has already been paid.' });
      if (existing?.open && existing.url && existing.amountCents === Number(due.amount_cents)) return json(200, { url: existing.url });
    }
    const origin = process.env.APP_ORIGIN || req.headers.origin || `http://${req.headers.host}`;
    const back = status => `${origin}/portal?payment=${status}&order=${encodeURIComponent(orderId)}`;
    const items = await orderItems(db, orderId);
    const description = `${items.map(item => item.name).join(', ').slice(0, 80) || 'Laboratory services'} · ${orderId}`;
    const created = await provider.createCheckout({
      orderId, amountCents: Number(due.amount_cents), currency: due.currency, description,
      successUrl: back('success'), cancelUrl: back('cancelled'),
      requestId: `checkout-${orderId}-${due.checkout_session_id || 'first'}`,
    });
    if (!created.url) throw new ProviderError('PayPal returned no approval link.');
    await db.prepare('UPDATE order_payments SET checkout_session_id=?,provider=?,updated_at=? WHERE order_id=?').run(created.id, provider.name, new Date().toISOString(), orderId);
    return json(200, { url: created.url });
  } catch (failure) {
    if (!failure.provider) throw failure;
    console.error(failure.message);
    return json(502, { error: 'Unable to start payment right now. Please try again shortly.' });
  }
}
