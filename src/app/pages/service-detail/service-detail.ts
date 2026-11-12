import { afterNextRender, Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { CONTACT, FAQS, SERVICES } from '../../data/site.data';
import { SERVICE_PRICING, MAX_QUOTE_SAMPLES, formatUsd, quoteSampleCount } from '../../data/service-pricing';
import { PageHeader } from '../../shared/page-header';
import { SemFrame } from '../../shared/sem-frame';
import { FaqList } from '../../shared/faq-list';
import { QuoteForm } from '../../shared/quote-form';
import { NotFoundPage } from '../not-found/not-found';

@Component({
  selector: 'app-service-detail-page',
  imports: [RouterLink, PageHeader, SemFrame, FaqList, QuoteForm, NotFoundPage],
  template: `
    @if (service(); as s) {
      <app-page-header
        [eyebrow]="'Service · ' + s.short"
        [title]="s.title"
        [lead]="s.summary"
        [parent]="{ label: 'Services', link: '/services' }"
      >
        <div class="hero-actions" id="hero-cta">
          <a class="btn btn-primary" href="#quote" (click)="scrollTo($event, 'quote')">Ask for an offer <span aria-hidden="true">↗</span></a>
          <a class="btn btn-outline" routerLink="/services">See all services</a>
        </div>
      </app-page-header>

      <section class="section">
        <div class="container detail-layout">
          <div class="stack">
            <div class="prose">
              @for (p of s.body; track $index) {
                <p>{{ p }}</p>
              }
            </div>
            <ul class="chips">
              @for (h of s.highlights; track h) {
                <li class="mono">{{ h }}</li>
              }
            </ul>
            @if (pricing(); as price) {
              <dl class="specs">
                <div><dt>Suitable samples</dt><dd>{{ price.sample }}</dd></div>
                <div><dt>What you receive</dt><dd>{{ price.deliverable }}</dd></div>
                <div><dt>Turnaround</dt><dd>Confirmed by the lab once the sample and scope are reviewed.</dd></div>
              </dl>
            }
            <app-sem-frame [image]="s.image" [priority]="true" sizes="(min-width: 1024px) 60vw, 100vw" />
          </div>
          @if (pricing(); as price) {
            <aside class="quote-card" aria-label="Service price estimate">
              <span class="eyebrow">{{ price.category }}</span>
              <h2>Pricing &amp; quote</h2>
              @if (price.startingUsd !== null) {
                <p class="quote-price">{{ money(price.startingUsd) }} <small>USD / {{ price.unit }}</small></p>
                <p class="muted">Illustrative starting rate</p>
                @if (price.unit === 'sample') {
                  <label class="quantity">Number of samples
                    <input type="number" min="1" [max]="maxSamples" step="1" [value]="samples()" (input)="samples.set($event.target.value)">
                  </label>
                  @if (!validSamples()) { <p class="muted" role="status">Enter a whole number between 1 and {{ maxSamples }}.</p> }
                }
                @if (price.unit === 'project' || validSamples()) {
                  <div class="estimate" aria-live="polite"><span>Starting estimate</span><strong>{{ money(price.startingUsd * quantity()) }} USD</strong></div>
                }
              } @else {
                <p class="quote-price">Included if needed</p>
                <p class="muted">Optional preparation for eligible SEM work. The laboratory confirms suitability.</p>
              }
              <p class="muted">Final pricing depends on sample preparation and scope. Shipping and applicable taxes are excluded.</p>
              @if (price.unit === 'project' || price.startingUsd === null || validSamples()) {
                @if (price.startingUsd !== null) {
                  <a [routerLink]="['/services', s.slug, 'order']" [queryParams]="{ samples: quantity() }" class="btn btn-primary">Order this service ↗</a>
                }
                <a routerLink="/contact" [queryParams]="{ service: s.slug, samples: quantity() }" class="text-link">Ask for a formal quote ↗</a>
                <a routerLink="/sample-submission" class="text-link">How to send samples →</a>
              }
            </aside>
          }
        </div>
      </section>

      <section class="section related" aria-labelledby="related-title">
        <div class="container stack">
          <h2 id="related-title" class="h2">Related services</h2>
          <ul class="related-list">
            @for (r of related(); track r.slug) {
              <li>
                <a [routerLink]="['/services', r.slug]" class="card">
                  <span class="mono code">{{ r.short }}</span>
                  <span class="title">{{ r.title }}</span>
                  <span class="summary">{{ r.summary }}</span>
                </a>
              </li>
            }
          </ul>
        </div>
      </section>

      <section class="section" aria-labelledby="faq-title">
        <div class="container faq-wrap">
          <h2 id="faq-title" class="h2">Frequently asked questions</h2>
          <app-faq-list [items]="faqs" [openFirst]="false" />
        </div>
      </section>

      <section class="section quote" id="quote">
        <div class="container quote-grid">
          <div class="stack">
            <span class="eyebrow">Need an analysis?</span>
            <h2 class="h2">Tell us about your {{ s.short }} project</h2>
            <p class="lead">Describe your samples and what you need to find out. Our Ph.D. expert will recommend the right approach and confirm your quote.</p>
            @for (person of contact.team; track person.email) {
              <div class="person">
                <strong>{{ person.name }}</strong>
                <span>{{ person.role }}</span>
                <a [href]="'mailto:' + person.email">{{ person.email }}</a>
              </div>
            }
          </div>
          <app-quote-form [service]="s.title" [samples]="quantity()" />
        </div>
      </section>

      @if (!quoteInView()) {
        <div class="mobile-cta" role="region" aria-label="Quick quote">
          <div>
            <strong>{{ s.short }}</strong>
            <span>{{ priceLabel() }}</span>
          </div>
          <a class="btn btn-primary" href="#quote" (click)="scrollTo($event, 'quote')">Ask for an offer</a>
        </div>
      }
    } @else {
      <app-not-found-page />
    }
  `,
  styles: `
    .hero-actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:.75rem}
    .mobile-cta{position:fixed;z-index:90;left:12px;right:12px;bottom:76px;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.6rem .6rem .6rem 1rem;background:var(--surface);border:1px solid var(--line);border-radius:.6rem;box-shadow:var(--shadow)}
    .mobile-cta div{display:flex;flex-direction:column;line-height:1.3;min-width:0}.mobile-cta strong{font-size:.9rem}.mobile-cta span{font-size:.78rem;color:var(--muted)}.mobile-cta .btn{white-space:nowrap;padding:.55rem .9rem;font-size:.85rem}
    @media(min-width:900px){.mobile-cta{display:none}}
    .faq-wrap{display:grid;gap:2rem;max-width:56rem}
    .quote{background:#edf3f0;border-top:1px solid var(--line);scroll-margin-top:6rem}
    .quote-grid{display:grid;gap:2.5rem}
    @media(min-width:1024px){.quote-grid{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:4rem;align-items:start}}
    .person{display:flex;flex-direction:column;gap:.125rem;padding-top:1rem;border-top:1px solid var(--line);font-size:.875rem}.person span{color:var(--muted)}.person a{color:var(--primary);text-decoration:none}
    .detail-layout{display:grid;gap:2rem;align-items:start}
    @media(min-width:900px){.detail-layout{grid-template-columns:minmax(0,1fr) minmax(17rem,22rem);gap:3rem}.quote-card{position:sticky;top:7rem}}
    .specs{margin:0;border-top:1px solid var(--line)}.specs>div{padding:.9rem 0;border-bottom:1px solid var(--line)}.specs dt{font-weight:600;font-size:.9rem}.specs dd{margin:.2rem 0 0;color:var(--muted);font-size:.88rem}
    .quote-card{display:grid;gap:.8rem;padding:1.5rem;background:#edf3ef;border:1px solid var(--line);border-radius:var(--radius)}.quote-card h2{font-size:1.55rem}.quote-price{font-size:1.75rem;font-weight:650;line-height:1.2}.quote-price small{font-size:.76rem;font-weight:400;color:var(--muted)}.muted{font-size:.8rem;color:var(--muted)}.quantity{display:grid;gap:.35rem;font-size:.85rem}.quantity input{width:100%;min-height:2.6rem;padding:.5rem;border:1px solid var(--line);background:var(--surface);color:var(--ink);font:inherit}.estimate{display:flex;justify-content:space-between;gap:.75rem;border-block:1px solid var(--line);padding:.75rem 0;font-size:.9rem}.quote-card .btn{margin-top:.3rem}
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .chips li {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 999px;
    }
    .related {
      background: var(--surface);
      border-block: 1px solid var(--line);
    }
    .related-list {
      display: grid;
      gap: 1rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    @media (min-width: 768px) {
      .related-list {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    .related .card {
      height: 100%;
      gap: 0.5rem;
      background: var(--background);
      text-decoration: none;
      transition: border-color 150ms ease;
    }
    .related .card:hover {
      border-color: var(--primary);
    }
    .code {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--primary);
    }
    .title {
      font-weight: 600;
      font-size: 1.0625rem;
    }
    .summary {
      font-size: 0.9375rem;
      color: var(--muted);
    }
  `,
})
export class ServiceDetailPage {
  readonly slug = input.required<string>();
  protected readonly contact = CONTACT;
  protected readonly faqs = FAQS;

  protected readonly service = computed(() => SERVICES.find((s) => s.slug === this.slug()));
  protected readonly pricing = computed(() => SERVICE_PRICING[this.slug()]);
  protected readonly samples = signal('1');
  protected readonly maxSamples = MAX_QUOTE_SAMPLES;
  protected readonly money = formatUsd;
  protected readonly validSamples = computed(() => /^\d+$/.test(this.samples()) && Number(this.samples()) >= 1 && Number(this.samples()) <= MAX_QUOTE_SAMPLES);
  protected readonly quantity = computed(() => this.pricing()?.unit === 'sample' ? quoteSampleCount(this.samples()) : 1);
  /** Hides the floating mobile quote bar while the header buttons or the quote form are on screen. */
  protected readonly quoteInView = signal(true);
  protected readonly priceLabel = computed(() => {
    const p = this.pricing();
    if (!p) return 'Quote on request';
    return p.startingUsd === null ? 'Included when needed' : `From ${formatUsd(p.startingUsd)} / ${p.unit}`;
  });
  protected readonly related = computed(() => {
    const index = SERVICES.findIndex((s) => s.slug === this.slug());
    return [1, 2, 3].map((offset) => SERVICES[(index + offset) % SERVICES.length]);
  });

  constructor() {
    const title = inject(Title);
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') return;
      const visible = new Set<Element>();
      const observer = new IntersectionObserver((entries) => {
        for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
        this.quoteInView.set(visible.size > 0);
      });
      for (const id of ['hero-cta', 'quote']) {
        const target = document.getElementById(id);
        if (target) observer.observe(target);
      }
      destroyRef.onDestroy(() => observer.disconnect());
    });
    effect(() => {
      this.slug();
      this.samples.set('1');
    });
    effect(() => {
      const s = this.service();
      title.setTitle(`${s ? s.title : 'Service not found'} | Houston Electron Microscopy`);
    });
  }

  protected scrollTo(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
