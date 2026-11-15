// Order statuses as stored by the server (server/admin-orders.mjs ORDER_STATUSES), in lifecycle order.
export const ORDER_STATUSES = ['Awaiting lab confirmation', 'Confirmed - awaiting payment', 'Paid', 'Fulfilled', 'Cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderTone = 'review' | 'due' | 'paid' | 'done' | 'cancelled';

const STATUS: Record<OrderStatus, { customer: string; note: string; tone: OrderTone; step: number }> = {
  'Awaiting lab confirmation': { customer: 'Under review', note: 'We received your order. The lab is reviewing scope, pricing and delivery.', tone: 'review', step: 0 },
  'Confirmed - awaiting payment': { customer: 'Payment due', note: 'The lab confirmed your order. Payment is due before analysis starts.', tone: 'due', step: 1 },
  Paid: { customer: 'Paid · in progress', note: 'Payment received. Your samples are scheduled for analysis.', tone: 'paid', step: 2 },
  Fulfilled: { customer: 'Completed', note: 'This order is complete. Reports appear in your document library.', tone: 'done', step: 3 },
  Cancelled: { customer: 'Cancelled', note: 'This order was cancelled. Contact the lab if you have questions.', tone: 'cancelled', step: -1 },
};

/** Customer-facing progress steps; Cancelled orders show no tracker. */
export const ORDER_STEPS = ['Submitted', 'Confirmed', 'Paid', 'Completed'] as const;
const known = (status: string): status is OrderStatus => (ORDER_STATUSES as readonly string[]).includes(status);
export const customerStatusLabel = (status: string) => known(status) ? STATUS[status].customer : status;
export const customerStatusNote = (status: string) => known(status) ? STATUS[status].note : '';
export const orderStatusTone = (status: string): OrderTone => known(status) ? STATUS[status].tone : 'review';
export const orderStep = (status: string) => known(status) ? STATUS[status].step : 0;
