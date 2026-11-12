import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SERVICES } from '../../data/site.data';
import { SERVICE_PRICING, MAX_QUOTE_SAMPLES, formatUsd, quoteSampleCount } from '../../data/service-pricing';

@Component({
  selector: 'app-service-order',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="container order-page">
      <a class="text-link" routerLink="/services">← All services</a>
      @if (service(); as entry) {
        <span class="eyebrow">Laboratory service order</span>
        <h1>{{ entry.title }}</h1>
        @if (price(); as rate) {
          @if (rate.startingUsd === null) {
            <p>This preparation is included with eligible SEM work and cannot be ordered separately.</p>
            <a class="btn btn-primary" routerLink="/services/sem">View SEM services ↗</a>
          } @else if (receipt(); as order) {
            <div class="card receipt" role="status">
              <h2>Order request received</h2><p>{{ order.status }} · {{ money(order.subtotal_cents / 100) }} USD estimated</p>
              <p class="mono">{{ order.id }}</p><p>The lab will review your samples, confirm pricing and arrange payment. No payment was collected.</p>
              <a class="btn btn-primary" routerLink="/portal">View my orders ↗</a>
            </div>
          } @else {
            <div class="layout">
              <div class="card summary">
                <h2>Order summary</h2>
                <p>{{ entry.summary }}</p>
                <dl><div><dt>Reference rate</dt><dd>{{ money(rate.startingUsd) }} USD / {{ rate.unit }}</dd></div>
                <div><dt>Quantity</dt><dd>{{ quantity() }} {{ rate.unit }}{{ quantity() === 1 ? '' : 's' }}</dd></div>
                <div class="total"><dt>Estimated starting total</dt><dd>{{ money(rate.startingUsd * quantity()) }} USD</dd></div></dl>
                <p class="note">The lab confirms scope, sample preparation, shipping and final pricing before work begins. No online payment is collected.</p>
                <a class="text-link" [routerLink]="['/services', entry.slug]">Review service details ↗</a>
              </div>
              <div class="card">
                @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
                @if (loading()) { <p role="status">Preparing your checkout…</p> }
                @else if (!signedIn()) {
                  <h2>Continue to checkout</h2><p>Try again as a guest or sign in with an existing account.</p>
                  <button type="button" class="btn btn-outline" (click)="prepareCheckout()">Continue as guest</button>
                  <a routerLink="/portal" [queryParams]="{ orderService: entry.slug, samples: quantity() }" class="btn btn-primary">Sign in to Client Portal ↗</a>
                } @else {
                  <form #orderForm="ngForm" (ngSubmit)="submit()">
                    <h2>Tell us about your samples</h2>
                    @if (guest()) { <p class="note">Checking out as a guest. Use this browser to view your order in the Client Portal.</p> }
                    <label>Contact email<input type="email" email name="email" autocomplete="email" maxlength="254" required [(ngModel)]="email" [disabled]="busy()"></label>
                    <label>Sample and testing details<textarea name="notes" rows="5" minlength="10" maxlength="1500" required [(ngModel)]="notes" [disabled]="busy()" placeholder="Material, areas of interest, testing goals, and deadline"></textarea></label>
                    <button class="btn btn-primary" type="submit" [disabled]="busy() || orderForm.invalid || notes.trim().length < 10">{{ busy() ? 'Submitting…' : 'Submit service order' }} ↗</button>
                  </form>
                }
              </div>
            </div>
          }
        }
      } @else { <h1>Service not found</h1><p>Choose a service from the catalog.</p> }
    </section>
  `,
  styles: `
    .order-page{padding-block:3rem 6rem;display:grid;gap:1.1rem}.order-page>.text-link{width:fit-content}.order-page h1{font-size:clamp(2rem,5vw,3.5rem)}.layout{display:grid;gap:1rem;align-items:start;margin-top:.75rem}.summary,.receipt{background:#edf3ef}.card h2{font-size:1.35rem}.card p{font-size:.9rem}.receipt .mono{overflow-wrap:anywhere}.card .btn{width:fit-content}.summary dl{margin:0}.summary dl>div{display:flex;justify-content:space-between;gap:.75rem;padding:.65rem 0;border-top:1px solid var(--line);font-size:.87rem}.summary dd{margin:0;text-align:right}.total{font-weight:650}.note{color:var(--muted)}form{display:grid;gap:1rem}label{display:grid;gap:.3rem;font-size:.85rem;font-weight:550}input,textarea{width:100%;border:1px solid var(--line);border-radius:var(--radius);padding:.65rem;background:white;color:var(--ink);font:inherit}textarea{resize:vertical}.error{color:#8a3326}button:disabled{opacity:.55;cursor:default}@media(min-width:800px){.layout{grid-template-columns:minmax(0,1fr) minmax(0,1.2fr)}}
  `,
})
export class ServiceOrderPage {
  readonly slug = input.required<string>();
  private readonly route = inject(ActivatedRoute);
  protected readonly service = computed(() => SERVICES.find(entry => entry.slug === this.slug()));
  protected readonly price = computed(() => this.service() && SERVICE_PRICING[this.slug()]);
  protected readonly quantity = computed(() => this.price()?.unit === 'sample' ? quoteSampleCount(this.route.snapshot.queryParamMap.get('samples')) : 1);
  protected readonly loading = signal(true);
  protected readonly signedIn = signal(false);
  protected readonly guest = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly receipt = signal<{id:string;status:string;subtotal_cents:number} | null>(null);
  protected readonly money = formatUsd;
  protected email = '';
  protected notes = '';
  private request: { signature: string; id: string } | undefined;

  ngOnInit() {
    if (this.price()?.startingUsd != null) void this.prepareCheckout();
  }

  protected async prepareCheckout() {
    this.loading.set(true);
    this.error.set('');
    try {
      const response = await fetch('/api/guest-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to prepare checkout.');
      this.guest.set(result.customer.guest);
      if (!result.customer.guest && !this.email && result.customer.email.includes('@')) this.email = result.customer.email;
      this.signedIn.set(true);
    } catch (error) { this.error.set(error instanceof Error ? error.message : 'Unable to prepare checkout.'); }
    finally { this.loading.set(false); }
  }

  protected async submit() {
    if (this.busy() || !this.signedIn() || !this.price()?.startingUsd || this.receipt()) return;
    const details = { service: this.slug(), quantity: this.quantity(), email: this.email.trim(), notes: this.notes.trim() };
    if (details.notes.length < 10 || details.notes.length > 1500 || details.quantity > MAX_QUOTE_SAMPLES) return;
    const signature = JSON.stringify(details);
    if (this.request?.signature !== signature) this.request = { signature, id: crypto.randomUUID() };
    this.busy.set(true);
    this.error.set('');
    try {
      const response = await fetch('/api/service-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...details, requestId: this.request.id }) });
      if (response.status === 401) this.signedIn.set(false);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to submit the order.');
      this.receipt.set(result.order);
    } catch (error) { this.error.set(error instanceof Error ? error.message : 'Unable to submit the order.'); }
    finally { this.busy.set(false); }
  }
}
