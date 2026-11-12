import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { formatUsd } from '../../data/service-pricing';

type Customer = { id: number; name: string; email: string; company: string; guest: boolean; isAdmin: boolean; order_count: number };
type Order = {
  id: string; customer_id: number; customer_name: string; status: string; created_at: string; subtotal_cents: number;
  shipping_name: string; shipping_email: string; shipping_address: string; notes: string;
  items: { sku: string; name: string; quantity: number; unit: string | null; price_cents: number }[];
};

@Component({
  selector: 'app-admin-page',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="container admin">
      <a class="text-link" routerLink="/portal">← Client Portal</a>
      <span class="eyebrow">Staff only</span>
      <h1>Laboratory administration</h1>
      @if (access() === 'anonymous') {
        <div class="card"><h2>Sign in required</h2><p>Sign in with a laboratory administrator account.</p><a class="btn btn-primary" routerLink="/portal">Go to sign in ↗</a></div>
      } @else if (access() === 'forbidden') {
        <div class="card"><h2>Administrator access required</h2><p>Your current account does not have access to this dashboard.</p></div>
      } @else {
        <nav aria-label="Administration sections" class="switcher">
          <button type="button" [attr.aria-pressed]="view() === 'customers'" (click)="switchTo('customers')">Customers</button>
          <button type="button" [attr.aria-pressed]="view() === 'orders'" (click)="switchTo('orders')">Orders</button>
        </nav>
        <form class="search" (ngSubmit)="search()">
          <label><span class="sr-only">Search {{ view() }}</span><input name="query" type="search" [(ngModel)]="query" maxlength="120" [placeholder]="view() === 'customers' ? 'Search by name, email or company' : 'Search by order ID, contact or status'"></label>
          <button type="submit" class="btn btn-primary">Search</button>
        </form>
        @if (customerFilter(); as customer) {
          <p class="filter">Orders for {{ customer.name }} (#{{ customer.id }}) <button type="button" class="text-link" (click)="switchTo('orders')">Clear customer filter</button></p>
        }
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        @else if (loading()) { <p role="status">Loading {{ view() }}…</p> }
        @else {
          <p class="meta" role="status">{{ total() }} {{ view() }} found</p>
          @if (view() === 'customers') {
            <div class="table-scroll"><table>
              <thead><tr><th scope="col">Customer</th><th scope="col">Account email</th><th scope="col">Company</th><th scope="col">Type</th><th scope="col">Orders</th></tr></thead>
              <tbody>@for (customer of customers(); track customer.id) {
                <tr><td><strong>{{ customer.name }}</strong><small>#{{ customer.id }}</small></td><td>{{ customer.guest ? 'Guest account' : customer.email }}</td><td>{{ customer.company || '—' }}</td><td>{{ customer.isAdmin ? 'Administrator' : customer.guest ? 'Guest' : 'Client' }}</td><td><button class="text-link" type="button" (click)="showOrders(customer)">{{ customer.order_count }} <span class="sr-only">orders for {{ customer.name }}</span>↗</button></td></tr>
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
                </div>
              </details>
            } @empty { <p>No matching orders.</p> }
          }
          @if (pages() > 1) {
            <div class="pagination"><button type="button" class="btn btn-outline" [disabled]="page() <= 1" (click)="load(page() - 1)">Previous</button><span>Page {{ page() }} of {{ pages() }}</span><button type="button" class="btn btn-outline" [disabled]="page() >= pages()" (click)="load(page() + 1)">Next</button></div>
          }
        }
      }
    </section>
  `,
  styles: `
    .admin{padding-block:3rem 6rem;display:grid;gap:1rem}.admin>.text-link,.card .btn{width:fit-content}.admin h1{font-size:clamp(2rem,5vw,3.5rem)}
    .switcher,.search,.pagination{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap}.switcher button{padding:.6rem 1rem;background:var(--surface);border:1px solid var(--line);font:inherit;color:var(--ink);cursor:pointer}.switcher button[aria-pressed=true]{background:var(--primary);color:white}
    .search label{flex:1;min-width:12rem}.search input{width:100%;padding:.6rem;border:1px solid var(--line);background:white;color:var(--ink);font:inherit}.meta,.filter{font-size:.85rem;color:var(--muted)}
    .table-scroll{overflow:auto;border:1px solid var(--line)}table{border-collapse:collapse;text-align:left;width:100%;background:white;font-size:.86rem}th,td{padding:.8rem;border-bottom:1px solid var(--line)}th{white-space:nowrap;background:#edf3ef}small{display:block;color:var(--muted);font-size:.75rem}button.text-link{border:0;background:none;font:inherit;cursor:pointer;padding:0;text-decoration:underline}
    .order{border:1px solid var(--line);background:white}.order summary{display:grid;grid-template-columns:1fr 1fr;gap:1rem;padding:1rem;cursor:pointer;overflow-wrap:anywhere}.order summary::marker{content:''}.order summary strong::before{content:'＋ '}.order[open] summary strong::before{content:'− '}.order summary>span:last-child{text-align:right}.details{border-top:1px solid var(--line);padding:1rem;overflow-wrap:anywhere}.details dl{margin:0 0 1rem}.details dl>div{margin-bottom:.55rem}.details dt{font-weight:600}.details dd{margin:0;white-space:pre-wrap}.details h2{font-size:1.1rem}.details ul{padding-inline-start:1.2rem;margin-bottom:0}.pagination{justify-content:center}.error{color:#8a3326}
  `,
})
export class AdminPage implements OnInit {
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
    this.view.set(view);
    this.customerFilter.set(null);
    this.query = this.appliedQuery = '';
    void this.load(1);
  }

  protected showOrders(customer: Customer) {
    this.view.set('orders');
    this.customerFilter.set(customer);
    this.query = this.appliedQuery = '';
    void this.load(1);
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
    try {
      const response = await fetch('/api/admin/' + this.view() + '?' + params, { signal: request.signal });
      if (request.signal.aborted) return;
      if (response.status === 401 || response.status === 403) {
        this.access.set(response.status === 401 ? 'anonymous' : 'forbidden');
        return;
      }
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (request.signal.aborted) return;
      this.access.set('allowed');
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
