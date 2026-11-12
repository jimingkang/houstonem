import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SERVICES } from '../../data/site.data';
import { SERVICE_CATEGORIES, SERVICE_PRICING, formatUsd } from '../../data/service-pricing';

@Component({
  selector: 'app-services-page',
  imports: [RouterLink],
  template: `
    <section class="catalog-hero">
      <div class="container hero-layout">
        <div>
          <span class="eyebrow">Houston Electron Microscopy / Laboratory services</span>
          <h1>Find the right analysis for your sample.</h1>
          <p>Browse testing by technique or material question. Compare what each service delivers and see starting estimates before requesting a quote.</p>
        </div>
        <a routerLink="/contact" class="btn btn-outline">Ask the lab for help <span aria-hidden="true">↗</span></a>
      </div>
    </section>
    <section class="container catalog" aria-label="Laboratory service catalog">
      <div class="filter-bar">
        <label class="search"><span class="sr-only">Search laboratory services</span><input type="search" placeholder="Search techniques, samples or testing needs…" [value]="query()" (input)="query.set($event.target.value)"></label>
        <label class="category-select"><span class="sr-only">Filter by category</span><select #categorySelect [value]="category()" (change)="category.set(categorySelect.value)">
          <option value="">All categories</option>
          @for (item of categories; track item) { <option [value]="item">{{ item }}</option> }
        </select></label>
      </div>
      <div class="catalog-layout">
        <aside aria-label="Service categories">
          <p class="mono">BROWSE BY CATEGORY</p>
          <button type="button" [attr.aria-pressed]="!category()" (click)="category.set('')">All services <span>{{ services.length }}</span></button>
          @for (item of categories; track item) {
            <button type="button" [attr.aria-pressed]="category() === item" (click)="category.set(item)">{{ item }} <span>{{ counts[item] }}</span></button>
          }
        </aside>
        <div>
          <div class="results-head"><h2>{{ category() || 'All services' }}</h2><p role="status">{{ filtered().length }} {{ filtered().length === 1 ? 'service' : 'services' }}</p></div>
          <p class="pricing-note">Illustrative starting estimates in USD. The lab confirms scope, sample preparation and final pricing before work begins.</p>
          <div class="cards">
            @for (service of filtered(); track service.slug) {
              <article class="service-card">
                <img [src]="service.image.src" [alt]="service.image.alt" loading="lazy" width="400" height="160">
                <div class="card-content">
                  <span class="mono method">{{ service.short }}</span>
                  <h3><a [routerLink]="['/services', service.slug]">{{ service.title }}</a></h3>
                  <p>{{ service.summary }}</p>
                  <div class="card-footer">
                    <span class="price">@if (service.pricing.startingUsd !== null) { <strong>From {{ money(service.pricing.startingUsd) }}</strong><small>USD / {{ service.pricing.unit }}</small> } @else { <strong>Included if needed</strong><small>With eligible SEM analysis</small> }</span>
                    <a [routerLink]="['/services', service.slug]" class="text-link" [attr.aria-label]="'View details and estimate for ' + service.title">View service ↗</a>
                  </div>
                </div>
              </article>
            } @empty {
              <div class="empty"><h3>No matching services</h3><p>Try a different search or browse the full catalog.</p><button class="btn btn-outline" type="button" (click)="query.set(''); category.set('')">Clear filters</button></div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .catalog-hero{background:#eaf1eb;border-bottom:1px solid var(--line);padding:clamp(2.5rem,6vw,5rem) 0}
    .hero-layout{display:flex;align-items:end;justify-content:space-between;gap:2rem;flex-wrap:wrap}
    h1{font-size:clamp(2.4rem,5.7vw,4.5rem);max-width:17ch;margin:1rem 0;line-height:1.05}
    .hero-layout p{max-width:58ch;color:var(--muted)}.hero-layout a{white-space:nowrap}
    .catalog{padding-block:2rem 5rem}.filter-bar{display:flex;gap:.75rem;margin-bottom:2rem}.search{flex:1}
    input,select{width:100%;min-height:3rem;padding:.6rem .85rem;background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);color:var(--ink);font:inherit}
    .catalog-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:2rem}aside{display:none}
    .results-head{display:flex;align-items:baseline;justify-content:space-between;gap:1rem}.results-head h2{font-size:clamp(1.4rem,3vw,2rem)}.results-head p{font-size:.8rem;white-space:nowrap;color:var(--muted)}
    .pricing-note{font-size:.85rem;color:var(--muted);margin:.6rem 0 1.25rem}
    .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,17rem),1fr));gap:1rem}
    .service-card{border:1px solid var(--line);background:var(--surface);display:flex;flex-direction:column;overflow:hidden;border-radius:var(--radius)}
    .service-card>img{width:100%;height:8rem;object-fit:cover;background:#dae5dc}.card-content{flex:1;display:flex;flex-direction:column;padding:1rem;gap:.55rem}
    .method{font-size:.7rem;text-transform:uppercase;color:var(--primary)}.card-content h3{font-size:1.2rem;text-wrap:initial}.card-content h3 a{text-decoration:none}.card-content h3 a:hover{text-decoration:underline}.card-content p{font-size:.85rem;color:var(--muted);margin-bottom:.6rem}
    .card-footer{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:.5rem;border-top:1px solid var(--line);padding-top:.75rem;margin-top:auto}.price small{display:block;color:var(--muted);font-size:.72rem}.card-footer a{font-size:.8rem;white-space:nowrap}
    .empty{grid-column:1/-1;padding:2rem;background:var(--surface);border:1px solid var(--line)}.empty p{margin:.6rem 0 1rem}
    @media(min-width:900px){.catalog-layout{grid-template-columns:15rem minmax(0,1fr)}.category-select{display:none}aside{display:block;align-self:start;border:1px solid var(--line);background:var(--surface);padding:.75rem}aside p{font-size:.72rem;color:var(--muted);padding:.5rem}aside button{border:0;background:none;color:var(--ink);font:inherit;font-size:.85rem;text-align:left;padding:.65rem .5rem;width:100%;display:flex;justify-content:space-between;gap:.5rem;cursor:pointer}aside button:hover,aside button[aria-pressed=true]{background:#eaf1eb}aside button span{color:var(--muted)}}
    @media(max-width:540px){.filter-bar{flex-direction:column}}
  `,
})
export class ServicesPage {
  protected readonly categories = SERVICE_CATEGORIES;
  protected readonly services = SERVICES.map(service => ({ ...service, pricing: SERVICE_PRICING[service.slug] }));
  protected readonly counts = Object.fromEntries(SERVICE_CATEGORIES.map(category => [category, this.services.filter(service => service.pricing.category === category).length]));
  protected readonly query = signal('');
  protected readonly category = signal('');
  protected readonly money = formatUsd;
  protected readonly filtered = computed(() => {
    const terms = this.query().toLowerCase().trim().split(/\s+/).filter(Boolean);
    return this.services.filter(service => {
      const text = [service.title, service.short, service.summary, service.pricing.category, service.pricing.sample, ...service.highlights].join(' ').toLowerCase();
      return (!this.category() || service.pricing.category === this.category()) && terms.every(term => text.includes(term));
    });
  });
}
