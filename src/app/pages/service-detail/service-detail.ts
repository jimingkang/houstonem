import { Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { CONTACT, FAQS, SERVICE_EXTRAS, SERVICES } from '../../data/site.data';
import { PageHeader } from '../../shared/page-header';
import { SemFrame } from '../../shared/sem-frame';
import { FaqList } from '../../shared/faq-list';
import { QuoteForm } from '../../shared/quote-form';
import { NotFoundPage } from '../not-found/not-found';

const DEFAULT_EXTRAS = {
  samples: ['Metals and alloys', 'Polymers and composites', 'Powders and particles', 'Coatings and deposits'],
  questions: ['What is this material made of?', 'Why did it behave the way it did?'],
};

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
        <div class="hero-actions">
          <a class="btn btn-primary" href="#quote" (click)="scrollTo($event, 'quote')">Ask for an offer <span aria-hidden="true">↗</span></a>
          <a class="btn btn-outline" routerLink="/services">See all services</a>
        </div>
      </app-page-header>

      <section class="section">
        <div class="container layout">
          <div class="stack main">
            <app-sem-frame [image]="s.image" [priority]="true" sizes="(min-width: 1024px) 60vw, 100vw" />

            <h2 class="h2">What our {{ s.title.toLowerCase() }} covers</h2>
            <div class="prose">
              @for (p of s.body; track $index) {
                <p>{{ p }}</p>
              }
            </div>

            <div class="lists">
              <div>
                <h3>Suitable samples</h3>
                <ul class="checklist">
                  @for (x of extras().samples; track x) {
                    <li>{{ x }}</li>
                  }
                </ul>
              </div>
              <div>
                <h3>Questions it answers</h3>
                <ul class="checklist">
                  @for (x of extras().questions; track x) {
                    <li>{{ x }}</li>
                  }
                </ul>
              </div>
            </div>
          </div>

          <aside class="card glance" aria-label="At a glance">
            <span class="eyebrow">At a glance</span>
            <dl>
              <div>
                <dt>Technique</dt>
                <dd>{{ s.short }}</dd>
              </div>
              <div>
                <dt>Turnaround</dt>
                <dd>Same or next day in most cases</dd>
              </div>
              <div>
                <dt>Remote viewing</dt>
                <dd>Live over Teams or Zoom</dd>
              </div>
              <div>
                <dt>Fees</dt>
                <dd>No operator or engineer fees</dd>
              </div>
            </dl>
            <ul class="chips">
              @for (h of s.highlights; track h) {
                <li class="mono">{{ h }}</li>
              }
            </ul>
            <a class="btn btn-primary" href="#quote" (click)="scrollTo($event, 'quote')">Ask for an offer</a>
            <a class="phone" [href]="contact.phoneHref">or call {{ contact.phone }}</a>
          </aside>
        </div>
      </section>

      <section class="section related" aria-labelledby="related-title">
        <div class="container stack">
          <div class="related-head">
            <h2 id="related-title" class="h2">Related services</h2>
            <a class="text-link" routerLink="/services">All services <span aria-hidden="true">→</span></a>
          </div>
          <ul class="related-list">
            @for (r of related(); track r.slug) {
              <li>
                <a [routerLink]="['/services', r.slug]" class="card">
                  <span class="mono code">{{ r.short }}</span>
                  <span class="title">{{ r.title }}</span>
                  <span class="summary">{{ r.summary }}</span>
                  <span class="more">Read more ›</span>
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
            <p class="lead">Describe your samples and what you need to find out. Our Ph.D. expert will recommend the right approach and send you a quote.</p>
            @for (person of contact.team; track person.email) {
              <div class="person">
                <strong>{{ person.name }}</strong>
                <span>{{ person.role }}</span>
                <a [href]="'mailto:' + person.email">{{ person.email }}</a>
              </div>
            }
          </div>
          <app-quote-form [heading]="'Ask for an offer'" [service]="s.title" />
        </div>
      </section>
    } @else {
      <app-not-found-page />
    }
  `,
  styles: `
    .hero-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem; }
    .layout { display: grid; gap: 2.5rem; }
    @media (min-width: 1024px) {
      .layout { grid-template-columns: minmax(0, 1fr) 20rem; gap: 4rem; align-items: start; }
      .glance { position: sticky; top: 7rem; }
    }
    .main h2 { margin-top: 1rem; }
    .lists { display: grid; gap: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--line); }
    @media (min-width: 640px) { .lists { grid-template-columns: 1fr 1fr; } }
    .lists h3 { font-size: 1.0625rem; margin-bottom: 1rem; }
    .glance { gap: 1.25rem; }
    dl { display: flex; flex-direction: column; gap: 0.875rem; margin: 0; }
    dl > div { padding-bottom: 0.875rem; border-bottom: 1px solid var(--line); }
    dt { font: 400 0.6875rem/1 var(--font-mono); letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); margin-bottom: 0.375rem; }
    dd { margin: 0; font-weight: 500; font-size: 0.9375rem; }
    .chips { display: flex; flex-wrap: wrap; gap: 0.375rem; margin: 0; padding: 0; list-style: none; }
    .chips li { padding: 0.25rem 0.625rem; font-size: 0.75rem; background: var(--background); border: 1px solid var(--line); border-radius: 999px; }
    .phone { align-self: center; font-size: 0.875rem; color: var(--primary); text-decoration: none; }
    .related { background: var(--surface); border-block: 1px solid var(--line); }
    .related-head { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; }
    .related-list { display: grid; gap: 1rem; margin: 0; padding: 0; list-style: none; }
    @media (min-width: 768px) { .related-list { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    .related .card { height: 100%; gap: 0.5rem; background: var(--background); text-decoration: none; box-shadow: none; transition: border-color 150ms ease; }
    .related .card:hover { border-color: var(--primary); }
    .code { font-size: 0.75rem; text-transform: uppercase; color: var(--primary); }
    .title { font-weight: 600; font-size: 1.0625rem; }
    .summary { flex: 1; font-size: 0.9375rem; color: var(--muted); }
    .more { font-size: 0.8125rem; font-weight: 600; color: var(--primary); }
    .faq-wrap { display: grid; gap: 2rem; max-width: 56rem; }
    .quote { background: #edf3f0; border-top: 1px solid var(--line); scroll-margin-top: 6rem; }
    .quote-grid { display: grid; gap: 2.5rem; }
    @media (min-width: 1024px) { .quote-grid { grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: 4rem; align-items: start; } }
    .person { display: flex; flex-direction: column; gap: 0.125rem; padding-top: 1rem; border-top: 1px solid var(--line); font-size: 0.875rem; }
    .person span { color: var(--muted); }
    .person a { color: var(--primary); text-decoration: none; }
  `,
})
export class ServiceDetailPage {
  readonly slug = input.required<string>();

  protected readonly contact = CONTACT;
  protected readonly faqs = FAQS;
  protected readonly service = computed(() => SERVICES.find((s) => s.slug === this.slug()));
  protected readonly extras = computed(() => SERVICE_EXTRAS[this.slug()] ?? DEFAULT_EXTRAS);
  protected readonly related = computed(() => {
    const index = SERVICES.findIndex((s) => s.slug === this.slug());
    return [1, 2, 3].map((offset) => SERVICES[(index + offset) % SERVICES.length]);
  });

  constructor() {
    const title = inject(Title);
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
