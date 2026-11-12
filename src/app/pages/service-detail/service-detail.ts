import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SERVICES } from '../../data/site.data';
import { SERVICE_PRICING, MAX_QUOTE_SAMPLES, formatUsd, quoteSampleCount } from '../../data/service-pricing';
import { PageHeader } from '../../shared/page-header';
import { SemFrame } from '../../shared/sem-frame';
import { CtaBand } from '../../shared/cta-band';
import { NotFoundPage } from '../not-found/not-found';

@Component({
  selector: 'app-service-detail-page',
  imports: [RouterLink, PageHeader, SemFrame, CtaBand, NotFoundPage],
  template: `
    @if (service(); as s) {
      <app-page-header
        [eyebrow]="'Service · ' + s.short"
        [title]="s.title"
        [lead]="s.summary"
        [parent]="{ label: 'Services', link: '/services' }"
      />

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

      <app-cta-band />
    } @else {
      <app-not-found-page />
    }
  `,
  styles: `
    .detail-layout{display:grid;gap:2rem;align-items:start}
    @media(min-width:900px){.detail-layout{grid-template-columns:minmax(0,1fr) minmax(17rem,22rem);gap:3rem}.quote-card{position:sticky;top:1.5rem}}
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

  protected readonly service = computed(() => SERVICES.find((s) => s.slug === this.slug()));
  protected readonly pricing = computed(() => SERVICE_PRICING[this.slug()]);
  protected readonly samples = signal('1');
  protected readonly maxSamples = MAX_QUOTE_SAMPLES;
  protected readonly money = formatUsd;
  protected readonly validSamples = computed(() => /^\d+$/.test(this.samples()) && Number(this.samples()) >= 1 && Number(this.samples()) <= MAX_QUOTE_SAMPLES);
  protected readonly quantity = computed(() => this.pricing()?.unit === 'sample' ? quoteSampleCount(this.samples()) : 1);
  protected readonly related = computed(() => {
    const index = SERVICES.findIndex((s) => s.slug === this.slug());
    return [1, 2, 3].map((offset) => SERVICES[(index + offset) % SERVICES.length]);
  });

  constructor() {
    const title = inject(Title);
    effect(() => {
      this.slug();
      this.samples.set('1');
    });
    effect(() => {
      const s = this.service();
      title.setTitle(`${s ? s.title : 'Service not found'} | Houston Electron Microscopy`);
    });
  }
}
