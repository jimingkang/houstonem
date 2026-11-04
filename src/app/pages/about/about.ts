import { Component } from '@angular/core';
import { IMAGES } from '../../data/site.data';
import { PageHeader } from '../../shared/page-header';
import { SemFrame } from '../../shared/sem-frame';
import { CtaBand } from '../../shared/cta-band';

@Component({
  selector: 'app-about-page',
  imports: [PageHeader, SemFrame, CtaBand],
  template: `
    <app-page-header
      eyebrow="About us · Since August 2011"
      title="A SEM/EDS analysis laboratory"
      crumb="About"
      lead="Helping engineers, consultants, and researchers find answers to their materials problems with information that may only be found at the microscopic level."
    />

    <section class="section">
      <div class="container split">
        <div class="stack">
          <h2 class="h2">Your outsourced “SEM/EDS department”</h2>
          <div class="prose">
            <p>
              Houston Electron Microscopy opened its doors in August 2011. With over 30 years of experience in
              metallurgy, engineering, and electron microscopy at its founding, our concept is to be the
              <strong>“SEM/EDS department”</strong> for companies who find it difficult to justify the expense of
              purchasing, maintaining, and staffing this very technical system.
            </p>
            <p>
              The Scanning Electron Microscope observes microscopic features in any solid material at extremely high
              magnifications. Particles and features in the nanometer range can be observed and photographed, while the
              integrated Energy Dispersive Spectrometer analyzes the elemental composition of any feature in real time.
            </p>
            <p>
              We have successfully served many clients across many fields, and we continue to grow. Our many repeat
              clients are a testament to great, expedient, and professional service.
            </p>
          </div>
        </div>
        <app-sem-frame [image]="lab" ratio="3 / 2" [compact]="true" [priority]="true" />
      </div>
    </section>

    <section class="section mission">
      <div class="container mission-grid">
        <div class="stack">
          <span class="eyebrow">Our mission</span>
          <p class="statement">
            Deliver efficient, cost-effective SEM/EDS services and micro FT-IR analysis — with same day or next day
            service generally available.
          </p>
        </div>
        <div class="card">
          <h3>Who we help</h3>
          <ul class="checklist">
            <li>Metallurgists</li>
            <li>Manufacturers</li>
            <li>Engineers</li>
            <li>Quality assurance managers</li>
            <li>Attorneys</li>
            <li>Designers</li>
          </ul>
        </div>
      </div>
    </section>

    <app-cta-band />
  `,
  styles: `
    .mission {
      background: var(--surface);
      border-block: 1px solid var(--line);
    }
    .mission-grid {
      display: grid;
      gap: 2.5rem;
    }
    @media (min-width: 900px) {
      .mission-grid {
        grid-template-columns: 1.6fr 1fr;
        align-items: center;
      }
    }
    .statement {
      font-size: clamp(1.5rem, 3vw, 2.25rem);
      font-weight: 500;
      line-height: 1.3;
      letter-spacing: -0.015em;
      text-wrap: balance;
    }
    .card {
      background: var(--background);
    }
    h3 {
      font-size: 1.125rem;
    }
  `,
})
export class AboutPage {
  protected readonly lab = IMAGES.lab;
}
