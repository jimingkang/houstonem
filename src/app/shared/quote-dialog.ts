import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SERVICES } from '../data/site.data';
import { MAX_QUOTE_SAMPLES, SERVICE_PRICING } from '../data/service-pricing';

/** Services a quote can be requested for (preparation-only services are excluded). */
const QUOTABLE = SERVICES.filter(service => SERVICE_PRICING[service.slug]?.startingUsd != null);

/** Picks the service whose name best matches what the visitor typed; SEM when nothing matches. */
function guessService(text: string): string {
  const words = text.toLowerCase().match(/[a-z0-9-]{3,}/g) ?? [];
  let best = { slug: 'sem', score: 0 };
  for (const service of QUOTABLE) {
    const haystack = `${service.slug} ${service.title} ${service.short}`.toLowerCase();
    const score = words.filter(word => haystack.includes(word)).length;
    if (score > best.score) best = { slug: service.slug, score };
  }
  return best.slug;
}

/**
 * Quote request in a modal dialog. Visitors without an account also choose a
 * password, which creates their Client Portal account with the request.
 */
@Component({
  selector: 'app-quote-dialog',
  imports: [FormsModule, RouterLink],
  template: `
    <dialog #dialog class="quote-dialog" aria-labelledby="quote-title" (close)="onClose()">
      <button type="button" class="close" aria-label="Close" (click)="close()">×</button>
      @if (receipt(); as order) {
        <div role="status">
          <span class="eyebrow">QUOTE REQUEST</span>
          <h2 id="quote-title">Request received</h2>
          <p class="mono ref">{{ order.id }}</p>
          @if (account(); as created) {
            <p>Your Client Portal account is ready. Sign in any time with <strong>{{ created.email }}</strong> and the password you chose.</p>
          }
          <p>The lab will review your samples and email you a quote. Once it's confirmed, sign in to the Client Portal to order the service.</p>
          <a class="btn btn-primary" routerLink="/portal" (click)="close()">View my quotes ↗</a>
        </div>
      } @else {
        <form #quoteForm="ngForm" (ngSubmit)="submit()">
          <span class="eyebrow">GET A QUOTE</span>
          <h2 id="quote-title">Tell us what you need</h2>
          @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
          <div class="row">
            <label class="grow">Service
              <select name="service" required [ngModel]="service()" (ngModelChange)="service.set($event)" [disabled]="busy()">
                @for (entry of services; track entry.slug) { <option [value]="entry.slug">{{ entry.title }}</option> }
              </select>
            </label>
            @if (unit() === 'sample') {
              <label class="qty">Samples<input type="number" name="quantity" min="1" [max]="maxSamples" step="1" required [ngModel]="quantity()" (ngModelChange)="quantity.set($event)" [disabled]="busy()"></label>
            }
          </div>
          <label>Sample and testing details<textarea name="notes" rows="4" minlength="10" maxlength="1500" required [ngModel]="notes()" (ngModelChange)="notes.set($event)" [disabled]="busy()" placeholder="Material, areas of interest, testing goals and deadline"></textarea></label>
          @if (newVisitor()) {
            <div class="row">
              <label class="grow">Your name<input name="name" autocomplete="name" maxlength="120" required [(ngModel)]="name" [disabled]="busy()"></label>
              <label class="grow">Company (optional)<input name="company" autocomplete="organization" maxlength="160" [(ngModel)]="company" [disabled]="busy()"></label>
            </div>
          }
          <label>Email<input type="email" email name="email" autocomplete="email" maxlength="254" required [ngModel]="email()" (ngModelChange)="email.set($event)" [disabled]="busy()"></label>
          @if (newVisitor()) {
            <label>Create a password<input type="password" name="password" autocomplete="new-password" minlength="8" maxlength="256" required [(ngModel)]="password" [disabled]="busy()"></label>
            <p class="note">This creates your Client Portal account, where you'll follow the request and order the service once we've quoted it. Already a client? <a routerLink="/portal" (click)="close()">Sign in first</a>.</p>
          }
          <button class="btn btn-primary" type="submit" [disabled]="busy() || quoteForm.invalid || notes().trim().length < 10">{{ busy() ? 'Sending…' : 'Request a quote' }} ↗</button>
        </form>
      }
    </dialog>
  `,
  styles: `
    .quote-dialog { width: min(560px, calc(100vw - 32px)); max-height: calc(100vh - 32px); border: 0; border-radius: var(--radius, 4px); padding: 32px; color: var(--ink); background: var(--surface, #fff); box-shadow: 0 30px 80px rgba(0, 0, 0, .25); }
    .quote-dialog::backdrop { background: rgba(10, 25, 28, .55); }
    .close { position: absolute; top: 12px; right: 14px; border: 0; background: none; font-size: 26px; line-height: 1; cursor: pointer; color: var(--muted); }
    h2 { font-size: 26px; font-weight: 500; margin: 10px 0 18px; }
    form { display: grid; gap: 14px; }
    label { display: grid; gap: 6px; font-size: 12px; font-weight: 600; }
    input, select, textarea { font: inherit; font-weight: 400; font-size: 14px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 3px; background: #fff; width: 100%; box-sizing: border-box; }
    textarea { resize: vertical; }
    .row { display: flex; gap: 12px; }
    .grow { flex: 1; min-width: 0; }
    .qty { width: 110px; }
    .note { font-size: 12px; color: var(--muted); margin: 0; }
    .error { color: #b3261e; font-size: 13px; margin: 0; }
    .ref { font-size: 12px; margin-bottom: 14px; overflow-wrap: anywhere; }
    p { line-height: 1.7; margin-bottom: 12px; }
    button[type=submit] { justify-self: start; }
    @media (max-width: 560px) { .quote-dialog { padding: 24px 18px; } .row { flex-direction: column; } .qty { width: 100%; } }
  `,
})
export class QuoteDialog {
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  protected readonly services = QUOTABLE;
  protected readonly maxSamples = MAX_QUOTE_SAMPLES;
  protected readonly newVisitor = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly receipt = signal<{ id: string; status: string } | null>(null);
  protected readonly account = signal<{ email: string } | null>(null);
  protected readonly service = signal('sem');
  protected readonly quantity = signal(1);
  protected readonly notes = signal('');
  protected readonly email = signal('');
  protected name = '';
  protected company = '';
  protected password = '';
  private request: { signature: string; id: string } | undefined;

  protected unit() { return SERVICE_PRICING[this.service()]?.unit; }

  /** Opens the dialog, carrying over whatever the visitor typed on the page. */
  async open(text = '') {
    const typed = text.trim();
    if (this.receipt()) { this.receipt.set(null); this.notes.set(''); this.request = undefined; }
    if (typed) { this.notes.set(typed); this.service.set(guessService(typed)); }
    this.error.set('');
    this.dialog().nativeElement.showModal();
    try {
      const response = await fetch('/api/portal');
      if (response.ok) {
        const { customer } = await response.json();
        this.newVisitor.set(false);
        if (!this.email()) this.email.set(customer.email);
      } else this.newVisitor.set(true);
    } catch { this.newVisitor.set(true); }
  }

  protected close() { this.dialog().nativeElement.close(); }
  protected onClose() { this.password = ''; }

  protected async submit() {
    if (this.busy()) return;
    const quantity = this.unit() === 'sample' ? Math.min(Math.max(Math.trunc(Number(this.quantity())) || 1, 1), MAX_QUOTE_SAMPLES) : 1;
    const details = { service: this.service(), quantity, email: this.email().trim(), notes: this.notes().trim() };
    if (details.notes.length < 10) return;
    const account = this.newVisitor() ? { name: this.name.trim(), company: this.company.trim(), password: this.password } : {};
    const signature = JSON.stringify(details);
    if (this.request?.signature !== signature) this.request = { signature, id: crypto.randomUUID() };
    this.busy.set(true);
    this.error.set('');
    try {
      const response = await fetch('/api/service-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...details, ...account, requestId: this.request.id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to send your request.');
      this.receipt.set(result.order);
      this.account.set(result.account ?? null);
      if (result.account) { this.newVisitor.set(false); this.password = ''; }
    } catch (error) { this.error.set(error instanceof Error ? error.message : 'Unable to send your request.'); }
    finally { this.busy.set(false); }
  }
}
