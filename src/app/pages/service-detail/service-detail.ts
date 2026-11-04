import { Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { SERVICES } from '../../data/site.data';
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
        <div class="container split">
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
          </div>
          <app-sem-frame [image]="s.image" [priority]="true" sizes="(min-width: 1024px) 40vw, 100vw" />
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
}
