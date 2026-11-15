import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SERVICES } from '../data/site.data';
import { MAX_QUOTE_SAMPLES, SERVICE_PRICING } from '../data/service-pricing';

/** Services a quote can be requested for (preparation-only services are excluded). */
const QUOTABLE = SERVICES.filter(service => SERVICE_PRICING[service.slug]?.startingUsd != null);

/** Picks the service whose name best matches what the visitor wrote; SEM when nothing matches. */
export function guessService(text: string): string {
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
 * The one quote request form, used in the home page dialog and on the Contact page.
 * Visitors without an account can tick "create an account" and choose a password,
 * which creates their Client Portal account with the request. Quoted services are
 * ordered from the signed-in portal.
 */
@Component({
  selector: 'app-quote-form',
  imports: [FormsModule, RouterLink],
  template: `
    @if (receipt(); as order) {
      <div class="receipt" role="status">
        <span class="eyebrow">QUOTE REQUEST</span>
        <h2 [id]="titleId()">Request received</h2>
        <p class="mono ref">{{ order.id }}</p>
        @if (account(); as created) {
          <p>Your Client Portal account is ready. Sign in any time with <strong>{{ created.email }}</strong> and the password you chose.</p>
        }
        @if (signedIn()) {
          <p>The lab will review your samples and email you a quote. Once it's confirmed, sign in to the Client Portal to order the service.</p>
          <a class="btn btn-primary" routerLink="/portal" (click)="done.emit()">View my quotes ↗</a>
        } @else {
          <p>The lab will review your samples and email you a quote at {{ email() }}. To order the service after that, you'll need a Client Portal account: tick "Create a Client Portal account" on your next request, or ask the lab to set one up for you.</p>
        }
      </div>
    } @else {
      <form #quoteForm="ngForm" (ngSubmit)="submit()">
        <span class="eyebrow">GET A QUOTE</span>
        <h2 [id]="titleId()">Tell us what you need</h2>
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <div class="row">
          @if (newVisitor()) {
            <label class="grow">Your name<input name="name" autocomplete="name" maxlength="120" required [(ngModel)]="name" [disabled]="busy()"></label>
          }
          <label class="grow">Email<input type="email" email name="email" autocomplete="email" maxlength="254" required [ngModel]="email()" (ngModelChange)="email.set($event)" [disabled]="busy()"></label>
        </div>
        <div class="row">
          @if (newVisitor()) {
            <label class="grow"><span>Company <span class="optional">(optional)</span></span><input name="company" autocomplete="organization" maxlength="160" [(ngModel)]="company" [disabled]="busy()"></label>
          }
          <label class="grow"><span>Phone <span class="optional">(optional)</span></span><input type="tel" name="phone" autocomplete="tel" maxlength="40" [(ngModel)]="phone" [disabled]="busy()"></label>
        </div>
        <label>What material or product do you have?
          <input name="material" maxlength="200" required [ngModel]="material()" (ngModelChange)="material.set($event)" [disabled]="busy()" placeholder="Plastic sheet, metal powder, medical part, etc.">
        </label>
        <label>What analysis do you need?
          <input name="analysis" maxlength="200" required [ngModel]="analysis()" (ngModelChange)="pickAnalysis($event)" [disabled]="busy()" placeholder="SEM/EDS, failure analysis, FT-IR, not sure…">
        </label>
        <div class="row">
          <label class="grow">Closest service
            <select name="service" required [ngModel]="service()" (ngModelChange)="chooseService($event)" [disabled]="busy()">
              @for (entry of services; track entry.slug) { <option [value]="entry.slug">{{ entry.title }}</option> }
            </select>
          </label>
          @if (unit() === 'sample') {
            <label class="qty">Samples<input type="number" name="quantity" min="1" [max]="maxSamples" step="1" required [ngModel]="quantity()" (ngModelChange)="quantity.set($event)" [disabled]="busy()"></label>
          }
        </div>
        <label><span>Anything else? <span class="optional">(optional)</span></span>
          <textarea name="details" rows="3" maxlength="1000" [ngModel]="details()" (ngModelChange)="details.set($event)" [disabled]="busy()" placeholder="What you need to find out, deadline, sample size…"></textarea>
        </label>
        @if (newVisitor()) {
          <label class="check"><input type="checkbox" name="createAccount" [ngModel]="createAccount()" (ngModelChange)="createAccount.set($event)" [disabled]="busy()"><span>Create a Client Portal account to follow this request, order the service once it's quoted, and download reports</span></label>
          @if (createAccount()) {
            <label>Create a password<input type="password" name="password" autocomplete="new-password" minlength="8" maxlength="256" required [(ngModel)]="password" [disabled]="busy()"></label>
          }
          <p class="note">Already a client? <a routerLink="/portal" (click)="done.emit()">Sign in first</a>.</p>
        }
        <button class="btn btn-primary" type="submit" [disabled]="busy() || quoteForm.invalid">{{ busy() ? 'Sending…' : 'Get a quote' }} ↗</button>
      </form>
    }
  `,
  styles: `
    :host { display: block; }
    h2 { font-size: 26px; font-weight: 500; margin: 10px 0 18px; }
    form { display: grid; gap: 14px; }
    label { display: grid; gap: 6px; font-size: 12px; font-weight: 600; }
    .check { display: flex; gap: 10px; align-items: flex-start; font-weight: 500; line-height: 1.5; cursor: pointer; }
    .check input { width: auto; margin-top: 2px; }
    .optional { font-weight: 400; color: var(--muted); }
    input, select, textarea { font: inherit; font-weight: 400; font-size: 14px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 3px; background: #fff; width: 100%; box-sizing: border-box; color: var(--ink); }
    textarea { resize: vertical; }
    .row { display: flex; gap: 12px; }
    .grow { flex: 1; min-width: 0; }
    .qty { width: 110px; }
    .note { font-size: 12px; color: var(--muted); margin: 0; line-height: 1.6; }
    .error { color: #b3261e; font-size: 13px; margin: 0; }
    .ref { font-size: 12px; margin-bottom: 14px; overflow-wrap: anywhere; }
    .receipt p { line-height: 1.7; margin-bottom: 12px; }
    button[type=submit] { justify-self: start; }
    @media (max-width: 560px) { .row { flex-direction: column; } .qty { width: 100%; } }
  `,
})
export class QuoteForm {
  readonly titleId = input('quote-title');
  /** Emitted when the visitor follows a link out of the form (the dialog closes on it). */
  readonly done = output();
  protected readonly services = QUOTABLE;
  protected readonly maxSamples = MAX_QUOTE_SAMPLES;
  protected readonly newVisitor = signal(true);
  protected readonly createAccount = signal(false);
  /** True when the request belongs to a signed-in account (existing or just created). */
  protected readonly signedIn = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly receipt = signal<{ id: string; status: string } | null>(null);
  protected readonly account = signal<{ email: string } | null>(null);
  protected readonly material = signal('');
  protected readonly analysis = signal('');
  protected readonly service = signal('sem');
  protected readonly quantity = signal(1);
  protected readonly details = signal('');
  protected readonly email = signal('');
  protected name = '';
  protected company = '';
  protected phone = '';
  protected password = '';
  private serviceChosen = false;
  private request: { signature: string; id: string } | undefined;

  constructor() { void this.refreshSession(); }

  protected unit() { return SERVICE_PRICING[this.service()]?.unit; }

  /** Pre-fills the form, e.g. from the home page quote bar or a service page link. */
  prefill({ analysis, material, service, samples }: { analysis?: string; material?: string; service?: string; samples?: number }) {
    if (this.receipt()) { this.receipt.set(null); this.details.set(''); this.request = undefined; }
    this.error.set('');
    if (material !== undefined) this.material.set(material.trim());
    if (analysis !== undefined) this.pickAnalysis(analysis.trim());
    if (service && QUOTABLE.some(entry => entry.slug === service)) this.chooseService(service);
    if (samples) this.quantity.set(Math.min(Math.max(Math.trunc(samples), 1), MAX_QUOTE_SAMPLES));
    void this.refreshSession();
  }

  /** The service follows what the visitor types until they pick one themselves. */
  protected pickAnalysis(text: string) {
    this.analysis.set(text);
    if (!this.serviceChosen && text.trim()) this.service.set(guessService(`${text} ${this.material()}`));
  }
  protected chooseService(slug: string) { this.service.set(slug); this.serviceChosen = true; }

  private async refreshSession() {
    try {
      const response = await fetch('/api/portal');
      if (response.ok) {
        const { customer } = await response.json();
        this.newVisitor.set(false);
        this.signedIn.set(true);
        if (!this.email()) this.email.set(customer.email);
      } else { this.newVisitor.set(true); this.signedIn.set(false); }
    } catch { this.newVisitor.set(true); this.signedIn.set(false); }
  }

  clearSecret() { this.password = ''; }

  protected async submit() {
    if (this.busy()) return;
    const quantity = this.unit() === 'sample' ? Math.min(Math.max(Math.trunc(Number(this.quantity())) || 1, 1), MAX_QUOTE_SAMPLES) : 1;
    const notes = [
      `Material or product: ${this.material().trim()}`,
      `Analysis needed: ${this.analysis().trim()}`,
      this.phone.trim() && `Phone: ${this.phone.trim()}`,
      this.details().trim(),
    ].filter(Boolean).join('\n');
    const details = { service: this.service(), quantity, email: this.email().trim(), notes };
    const account = this.newVisitor() ? { name: this.name.trim(), company: this.company.trim(), createAccount: this.createAccount(), ...(this.createAccount() ? { password: this.password } : {}) } : {};
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
      if (result.account) { this.newVisitor.set(false); this.signedIn.set(true); }
      this.password = '';
    } catch (error) { this.error.set(error instanceof Error ? error.message : 'Unable to send your request.'); }
    finally { this.busy.set(false); }
  }
}
