import { Component, OnInit, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { formatUsd } from '../../data/service-pricing';

type Customer = { id: number; name: string; email: string; company: string; guest: boolean; isAdmin: boolean; order_count: number };
type Order = {
  id: string; customer_id: number; customer_name: string; status: string; created_at: string; subtotal_cents: number;
  shipping_name: string; shipping_email: string; shipping_address: string; notes: string;
  items: { sku: string; name: string; quantity: number; unit: string | null; price_cents: number }[];
};

type CustomerProfile = {
  customer: Customer;
  subscriptions: { id:number; service:string; plan:string; status:string; renewal_date:string|null }[];
  reports: { id:number; title:string; sample_id:string; analysis:string; status:string; issued_at:string|null; has_file:number }[];
  orders: Pick<Order, 'id'|'status'|'created_at'|'subtotal_cents'|'items'>[];
};

@Component({
  selector: 'app-admin-page',
  imports: [FormsModule, RouterLink, NgTemplateOutlet],
  template: `
    <section class="container admin">
      <a class="text-link" routerLink="/">← Laboratory website</a>
      <span class="eyebrow">Staff only</span>
      <div class="admin-head"><h1>Laboratory administration</h1>@if (access() === 'allowed') { <button class="btn btn-outline" type="button" [disabled]="signingOut()" (click)="signOut()">Sign out</button> }</div>
      @if (access() === 'anonymous') {
        <div class="card"><h2>Sign in required</h2><p>Sign in with a laboratory administrator account.</p><a class="btn btn-primary" routerLink="/portal">Go to sign in ↗</a></div>
      } @else if (access() === 'forbidden') {
        <div class="card"><h2>Administrator access required</h2><p>Your current account does not have access to this dashboard.</p></div>
      } @else {
        <nav aria-label="Administration sections" class="switcher">
          <button type="button" [attr.aria-pressed]="view() === 'customers'" (click)="switchTo('customers')">Customers</button>
          <button type="button" [attr.aria-pressed]="view() === 'orders'" (click)="switchTo('orders')">Orders</button>
        </nav>
        @if (!profileCustomer()) { <form class="search" (ngSubmit)="search()">
          <label><span class="sr-only">Search {{ view() }}</span><input name="query" type="search" [(ngModel)]="query" maxlength="120" [placeholder]="view() === 'customers' ? 'Search by name, email or company' : 'Search by order ID, contact or status'"></label>
          <button type="submit" class="btn btn-primary">Search</button>
        </form> }
        @if (customerFilter(); as customer) {
          <p class="filter">Orders for {{ customer.name }} (#{{ customer.id }}) <button type="button" class="text-link" (click)="switchTo('orders')">Clear customer filter</button></p>
        }
        @if (notice()) { <p class="notice" role="status">{{ notice() }}</p> }
        @if (actionError()) { <p class="error" role="alert">{{ actionError() }}</p> }
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        @else if (loading()) { <p role="status">Loading {{ view() }}…</p> }
        @else if (profile(); as record) {
          <button class="text-link" type="button" (click)="switchTo('customers')">← All customers</button>
          <div class="card"><span class="eyebrow">Customer record · #{{ record.customer.id }}</span><h2>{{ record.customer.name }}</h2>
            <p>{{ record.customer.guest ? 'Guest account' : record.customer.email }} @if (record.customer.company) { · {{ record.customer.company }} }</p>
          </div>
          <div class="record-grid">
            <section class="card"><h2>Subscriptions ({{ record.subscriptions.length }})</h2>
              <details class="manage"><summary>Add subscription</summary>
                <form #subscriptionForm="ngForm" (ngSubmit)="addSubscription(record.customer.id, subscriptionForm)">
                  <label>Service<input name="service" ngModel required maxlength="120"></label>
                  <label>Plan<input name="plan" ngModel required maxlength="120"></label>
                  <label>Renewal date (optional)<input name="renewal_date" type="date" ngModel></label>
                  <button type="submit" class="btn btn-primary" [disabled]="subscriptionForm.invalid || saving()">Add subscription</button>
                </form>
              </details>
              @for (subscription of record.subscriptions; track subscription.id) {
                <article class="record-row"><strong>{{ subscription.service }}</strong><p>{{ subscription.plan }} · {{ subscription.status }}</p><small>Renewal: {{ subscription.renewal_date || '—' }}</small></article>
              } @empty { <p>No subscriptions.</p> }
            </section>
            <section class="card"><h2>Reports ({{ record.reports.length }})</h2>
              <details class="manage"><summary>Upload report</summary>
                <form #reportForm="ngForm" (ngSubmit)="uploadReport(record.customer.id, reportForm, reportFile)">
                  <label>Report title<input name="title" ngModel required maxlength="150"></label>
                  <label>Sample ID<input name="sample_id" ngModel required maxlength="100"></label>
                  <label>Analysis type<input name="analysis" ngModel required maxlength="120"></label>
                  <label>PDF report (up to 25 MB)<input #reportFile type="file" accept=".pdf,application/pdf" (change)="fileChosen.set(!!reportFile.files?.length)"></label>
                  <button type="submit" class="btn btn-primary" [disabled]="reportForm.invalid || !fileChosen() || saving()">Upload report</button>
                  <small>The report becomes visible to this customer when the upload completes.</small>
                </form>
              </details>
              @for (report of record.reports; track report.id) {
                <article class="record-row"><strong>{{ report.title }}</strong><p>{{ report.sample_id }} · {{ report.analysis }} · {{ report.status }}</p><small>{{ report.issued_at || 'No issue date' }}</small>
                  @if (report.has_file) { <a class="text-link" [href]="'/api/admin/reports/' + report.id + '/download'">Download report ↓</a> }
                </article>
              } @empty { <p>No reports.</p> }
            </section>
            <section class="card"><h2>Orders ({{ record.orders.length }})</h2>
              @for (order of record.orders; track order.id) {
                <article class="record-row"><strong>{{ order.status }} · {{ money(order.subtotal_cents / 100) }} USD</strong><small>{{ order.id }} · {{ order.created_at.slice(0, 10) }}</small>
                  <ul>@for (item of order.items; track $index) { <li>{{ item.name }} × {{ item.quantity }}</li> }</ul>
                  <ng-container [ngTemplateOutlet]="orderStatus" [ngTemplateOutletContext]="{ $implicit: order }"></ng-container>
                </article>
              } @empty { <p>No orders.</p> }
              @if (record.orders.length) { <button type="button" class="text-link" (click)="showOrders(record.customer)">View order details ↗</button> }
            </section>
          </div>
        } @else {
          <p class="meta" role="status">{{ total() }} {{ view() }} found</p>
          @if (view() === 'customers') {
            <div class="table-scroll"><table>
              <thead><tr><th scope="col">Customer</th><th scope="col">Account email</th><th scope="col">Company</th><th scope="col">Type</th><th scope="col">Orders</th></tr></thead>
              <tbody>@for (customer of customers(); track customer.id) {
                <tr><td><button type="button" class="text-link" (click)="openCustomer(customer)" [attr.aria-label]="'View customer record for ' + customer.name">{{ customer.name }}</button><small>#{{ customer.id }}</small></td><td>{{ customer.guest ? 'Guest account' : customer.email }}</td><td>{{ customer.company || '—' }}</td><td>{{ customer.isAdmin ? 'Administrator' : customer.guest ? 'Guest' : 'Client' }}</td><td><button class="text-link" type="button" (click)="showOrders(customer)">{{ customer.order_count }} <span class="sr-only">orders for {{ customer.name }}</span>↗</button></td></tr>
              } @empty { <tr><td colspan="5">No matching customers.</td></tr> }</tbody>
            </table></div>
          } @else {
            @for (order of orders(); track order.id) {
              <details class="order">
                <summary><span><strong>{{ order.customer_name }}</strong><small>{{ order.id }}</small></span><span>{{ order.status }}<small>{{ order.created_at.slice(0, 10) }} · {{ money(order.subtotal_cents / 100) }} USD estimated</small></span></summary>
                <div class="details">
                  <dl><div><dt>Customer ID</dt><dd>#{{ order.customer_id }}</dd></div><div><dt>Order contact</dt><dd>{{ order.shipping_name }} · <a [href]="'mailto:' + order.shipping_email">{{ order.shipping_email }}</a></dd></div>
                  @if (order.shipping_address) { <div><dt>Shipping address</dt><dd>{{ order.shipping_address }}</dd></div> }
                  @if (order.notes) { <div><dt>Sample and order notes</dt><dd>{{ order.notes }}</dd></div> }</dl>
                  <h2>Items</h2><ul>@for (item of order.items; track $index) { <li>{{ item.name }} × {{ item.quantity }} @if (item.unit) { ({{ item.unit }}) } · {{ money(item.price_cents / 100) }} USD each</li> }</ul>
                  <ng-container [ngTemplateOutlet]="orderStatus" [ngTemplateOutletContext]="{ $implicit: order }"></ng-container>
                </div>
              </details>
            } @empty { <p>No matching orders.</p> }
          }
          @if (pages() > 1) {
            <div class="pagination"><button type="button" class="btn btn-outline" [disabled]="page() <= 1" (click)="load(page() - 1)">Previous</button><span>Page {{ page() }} of {{ pages() }}</span><button type="button" class="btn btn-outline" [disabled]="page() >= pages()" (click)="load(page() + 1)">Next</button></div>
          }
        }
      }
      <ng-template #orderStatus let-order>
        @if (nextStatuses(order.status).length) {
          <form class="status-form" (submit)="$event.preventDefault(); changeStatus(order.id, nextStatus.value)">
            <label>Update order status<select #nextStatus required>
              <option value="">Choose a status</option>
              @for (status of nextStatuses(order.status); track status) { <option [value]="status">{{ status }}</option> }
            </select></label>
            <button type="submit" class="btn btn-outline" [disabled]="saving()">Save status</button>
          </form>
        }
      </ng-template>
    </section>
  `,
  styles: `
    .manage{border:1px solid var(--line);padding:.6rem;background:#f6f9f6}.manage summary{cursor:pointer;font-weight:600;font-size:.85rem}.manage form,.status-form{display:grid;gap:.55rem;margin-top:.65rem}.manage label,.status-form label{display:grid;gap:.2rem;font-size:.8rem}.manage input,.status-form select{width:100%;padding:.5rem;border:1px solid var(--line);background:white;color:var(--ink);font:inherit}.manage .btn,.status-form .btn{justify-self:start}.notice{color:var(--primary)}
    .admin-head{display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap}.record-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr));gap:1rem;align-items:start}.record-row{border-top:1px solid var(--line);padding-top:.75rem;overflow-wrap:anywhere;font-size:.9rem}.record-row ul{padding-inline-start:1.25rem}.record-row a{font-size:.8rem}
    .admin{padding-block:3rem 6rem;display:grid;gap:1rem}.admin>.text-link,.card .btn{width:fit-content}.admin h1{font-size:clamp(2rem,5vw,3.5rem)}
    .switcher,.search,.pagination{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap}.switcher button{padding:.6rem 1rem;background:var(--surface);border:1px solid var(--line);font:inherit;color:var(--ink);cursor:pointer}.switcher button[aria-pressed=true]{background:var(--primary);color:white}
    .search label{flex:1;min-width:12rem}.search input{width:100%;padding:.6rem;border:1px solid var(--line);background:white;color:var(--ink);font:inherit}.meta,.filter{font-size:.85rem;color:var(--muted)}
    .table-scroll{overflow:auto;border:1px solid var(--line)}table{border-collapse:collapse;text-align:left;width:100%;background:white;font-size:.86rem}th,td{padding:.8rem;border-bottom:1px solid var(--line)}th{white-space:nowrap;background:#edf3ef}small{display:block;color:var(--muted);font-size:.75rem}button.text-link{border:0;background:none;font:inherit;cursor:pointer;padding:0;text-decoration:underline}
    .order{border:1px solid var(--line);background:white}.order summary{display:grid;grid-template-columns:1fr 1fr;gap:1rem;padding:1rem;cursor:pointer;overflow-wrap:anywhere}.order summary::marker{content:''}.order summary strong::before{content:'＋ '}.order[open] summary strong::before{content:'− '}.order summary>span:last-child{text-align:right}.details{border-top:1px solid var(--line);padding:1rem;overflow-wrap:anywhere}.details dl{margin:0 0 1rem}.details dl>div{margin-bottom:.55rem}.details dt{font-weight:600}.details dd{margin:0;white-space:pre-wrap}.details h2{font-size:1.1rem}.details ul{padding-inline-start:1.2rem;margin-bottom:0}.pagination{justify-content:center}.error{color:#8a3326}
  `,
})
export class AdminPage implements OnInit {
  private readonly router = inject(Router);
  protected readonly saving = signal(false);
  protected readonly notice = signal('');
  protected readonly actionError = signal('');
  protected readonly fileChosen = signal(false);
  protected readonly signingOut = signal(false);
  protected readonly profileCustomer = signal<Customer | null>(null);
  protected readonly profile = signal<CustomerProfile | null>(null);
  protected readonly view = signal<'customers' | 'orders'>('customers');
  protected readonly access = signal<'pending' | 'allowed' | 'anonymous' | 'forbidden'>('pending');
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly customers = signal<Customer[]>([]);
  protected readonly orders = signal<Order[]>([]);
  protected readonly customerFilter = signal<Customer | null>(null);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly pages = signal(1);
  protected readonly money = formatUsd;
  protected query = '';
  private appliedQuery = '';
  private request?: AbortController;

  ngOnInit() { void this.load(1); }

  protected switchTo(view: 'customers' | 'orders') {
    this.profileCustomer.set(null);
    this.profile.set(null);
    this.actionError.set('');
    this.notice.set('');
    this.view.set(view);
    this.customerFilter.set(null);
    this.query = this.appliedQuery = '';
    void this.load(1);
  }

  protected openCustomer(customer: Customer) {
    this.fileChosen.set(false);
    this.actionError.set('');
    this.notice.set('');
    this.profileCustomer.set(customer);
    this.profile.set(null);
    void this.load(1);
  }

  protected async signOut() {
    if (this.signingOut()) return;
    this.signingOut.set(true);
    try {
      const result = await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!result.ok && result.status !== 401) throw new Error();
      this.request?.abort();
      this.customers.set([]);
      this.orders.set([]);
      this.profile.set(null);
      this.access.set('anonymous');
      await this.router.navigateByUrl('/portal', { replaceUrl: true });
    } catch { this.error.set('Unable to sign out. Please try again.'); }
    finally { this.signingOut.set(false); }
  }

  protected showOrders(customer: Customer) {
    this.profileCustomer.set(null);
    this.profile.set(null);
    this.view.set('orders');
    this.customerFilter.set(customer);
    this.query = this.appliedQuery = '';
    void this.load(1);
  }

  protected nextStatuses(status: string): readonly string[] {
    if (status === 'Awaiting lab confirmation') return ['Confirmed - awaiting payment', 'Cancelled'];
    if (status === 'Confirmed - awaiting payment') return ['Fulfilled', 'Cancelled'];
    return [];
  }

  protected async addSubscription(customerId: number, form: NgForm) {
    if (form.invalid) return;
    if (await this.save('customers/' + customerId + '/subscriptions', form.value, 'Subscription added.')) form.resetForm();
  }

  protected async uploadReport(customerId: number, form: NgForm, input: HTMLInputElement) {
    const file = input.files?.[0];
    if (form.invalid || !file) return;
    if (file.size > 25 * 1024 * 1024) {
      this.notice.set('');
      this.actionError.set('The PDF must be no larger than 25 MB.');
      return;
    }
    const body = new FormData();
    for (const key of ['title','sample_id','analysis']) body.set(key, form.value[key]);
    body.set('file', file);
    if (await this.save('customers/' + customerId + '/reports', body, 'Report uploaded.')) {
      form.resetForm();
      input.value = '';
      this.fileChosen.set(false);
    }
  }

  protected async changeStatus(orderId: string, status: string) {
    if (!status) return;
    await this.save('orders/' + encodeURIComponent(orderId) + '/status', { status }, 'Order status updated.');
  }

  private async save(path: string, body: FormData | object, success: string): Promise<boolean> {
    if (this.saving()) return false;
    this.saving.set(true);
    this.actionError.set('');
    this.notice.set('');
    try {
      const upload = body instanceof FormData;
      const response = await fetch('/api/admin/' + path, {
        method: 'POST',
        headers: upload ? undefined : { 'Content-Type': 'application/json' },
        body: upload ? body : JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) await this.load(1);
      if (!response.ok) throw new Error(result.error || 'Unable to save this change.');
      this.notice.set(success);
      await this.load(this.page());
      return true;
    } catch (error) { this.actionError.set(error instanceof Error ? error.message : 'Unable to save this change.'); return false; }
    finally { this.saving.set(false); }
  }

  protected search() {
    this.appliedQuery = this.query.trim();
    void this.load(1);
  }

  protected async load(page: number) {
    this.request?.abort();
    const request = this.request = new AbortController();
    const params = new URLSearchParams({ page: String(page), q: this.appliedQuery });
    const customer = this.customerFilter();
    if (customer) params.set('customerId', String(customer.id));
    this.loading.set(true);
    this.error.set('');
    this.customers.set([]);
    this.orders.set([]);
    this.profile.set(null);
    this.fileChosen.set(false);
    try {
      const profileCustomer = this.profileCustomer();
      const path = profileCustomer ? 'customers/' + profileCustomer.id : this.view() + '?' + params;
      const response = await fetch('/api/admin/' + path, { signal: request.signal });
      if (request.signal.aborted) return;
      if (response.status === 401 || response.status === 403) {
        this.access.set(response.status === 401 ? 'anonymous' : 'forbidden');
        return;
      }
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (request.signal.aborted) return;
      this.access.set('allowed');
      if (profileCustomer) { this.profile.set(result); return; }
      this.customers.set(result.customers || []);
      this.orders.set(result.orders || []);
      this.total.set(result.total);
      this.page.set(result.page);
      this.pages.set(Math.max(1, Math.ceil(result.total / result.pageSize)));
    } catch {
      if (!request.signal.aborted) this.error.set('Unable to load administration data. Please try again.');
    } finally { if (!request.signal.aborted) this.loading.set(false); }
  }
}
