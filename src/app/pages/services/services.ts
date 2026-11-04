import { Component } from '@angular/core';
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
        <ul class="list">
          @for (s of services; track s.slug) {
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
