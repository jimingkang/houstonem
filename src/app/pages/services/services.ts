import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SERVICES } from '../../data/site.data';
import { PageHeader } from '../../shared/page-header';
import { CtaBand } from '../../shared/cta-band';

@Component({
  selector: 'app-services-page',
  imports: [RouterLink, PageHeader, CtaBand],
  template: `
    <app-page-header
      eyebrow="SEM & EDS services"
      title="Skilled SEM & EDX services"
      crumb="Services"
      lead="Complete SEM/EDS analysis of metallic and non-metallic components. No “operator” or “engineer” fees — just answers."
    />

    <section class="section">
      <div class="container">
        <div class="filter-bar">
          <label class="filter">
            <span class="sr-only">Filter services</span>
            <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="m13 13 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
            <input type="search" placeholder="Filter by technique, material or problem…" [value]="query()" (input)="query.set($any($event.target).value)" />
          </label>
          <span class="mono count" role="status">{{ filtered().length }} of {{ services.length }} analyses</span>
        </div>
        <ul class="list">
          @for (s of filtered(); track s.slug) {
            <li>
              <a [routerLink]="['/services', s.slug]" class="row">
                <span class="mono code">{{ s.short }}</span>
                <span class="text">
                  <span class="title">{{ s.title }}</span>
                  <span class="summary">{{ s.summary }}</span>
                </span>
                <span class="arrow" aria-hidden="true">→</span>
              </a>
            </li>
          } @empty {
            <li class="empty">
              No listed service matches “{{ query() }}”. We analyze far more than we list —
              <a routerLink="/contact" [queryParams]="{ need: query() }">ask our expert</a>.
            </li>
          }
        </ul>
      </div>
    </section>

    <section class="section expert">
      <div class="container split">
        <div class="stack">
          <span class="eyebrow">Your failure analysis engineer</span>
          <h2 class="h2">Dennis Manuel zeroes in on the problem quickly</h2>
          <div class="prose">
            <p>
              Dennis has a diverse background in materials processing, scanning electron microscopy and failure analysis
              across the oil tool, petrochemical, heavy equipment, metallurgy, corrosion, heat treating, and welding
              industries. He has been in the field of metallurgy for over 30 years, most of those analyzing failures and
              improving reliability.
            </p>
            <p>
              He earned a BS in Mechanical Engineering with a minor in Metallurgy from the University of Texas at El Paso
              (UTEP), graduating summa cum laude.
            </p>
          </div>
        </div>
        <div class="card">
          <h3>Services &amp; applications</h3>
          <ul class="checklist">
            @for (a of applications; track a) {
              <li>{{ a }}</li>
            }
          </ul>
        </div>
      </div>
    </section>

    <app-cta-band />
  `,
  styles: `
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .filter {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1 1 22rem;
      max-width: 32rem;
      min-height: 2.875rem;
      padding: 0 1rem;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 999px;
      color: var(--muted);
    }
    .filter:focus-within {
      border-color: var(--primary);
      color: var(--primary);
    }
    .filter input {
      flex: 1;
      min-width: 0;
      border: 0;
      background: none;
      outline: none;
      font: 400 0.9375rem/1.4 var(--font-sans);
      color: var(--ink);
    }
    .count {
      font-size: 0.75rem;
      color: var(--muted);
    }
    .empty {
      grid-column: 1 / -1;
      padding: 2rem 0;
      color: var(--muted);
    }
    .empty a {
      color: var(--primary);
    }
    .list {
      display: grid;
      margin: 0;
      padding: 0;
      list-style: none;
      border-top: 1px solid var(--line);
    }
    @media (min-width: 900px) {
      .list {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        column-gap: 3rem;
      }
    }
    .row {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      height: 100%;
      padding: 1.5rem 0;
      border-bottom: 1px solid var(--line);
      text-decoration: none;
    }
    .code {
      flex: none;
      width: 7.5rem;
      padding-top: 0.2rem;
      font-size: 0.75rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--primary);
    }
    .text {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      flex: 1;
    }
    .title {
      font-size: 1.125rem;
      font-weight: 600;
    }
    .summary {
      color: var(--muted);
      font-size: 0.9375rem;
    }
    .arrow {
      color: var(--muted);
      transition: transform 150ms ease, color 150ms ease;
    }
    .row:hover .title {
      color: var(--primary);
    }
    .row:hover .arrow {
      color: var(--primary);
      transform: translateX(4px);
    }
    .expert {
      background: var(--surface);
      border-block: 1px solid var(--line);
    }
    .expert .card {
      background: var(--background);
    }
    h3 {
      font-size: 1.125rem;
    }
  `,
})
export class ServicesPage {
  protected readonly services = SERVICES;
  protected readonly query = signal('');
  protected readonly filtered = computed(() => {
    const terms = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    return SERVICES.filter((s) => {
      const hay = [s.title, s.short, s.summary, ...s.highlights].join(' ').toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  });
  protected readonly applications = [
    'Failure analysis of metals',
    'Failure analysis of non-metals',
    'Metallography',
    'Geology',
    'Microstructural analysis',
    'Element analysis & element mapping',
    'PDC measurement and analysis',
    'Phase analysis and measurements',
    'Contamination debris in oil samples',
    'Coatings on plastics and metals',
  ];
}
