import { Component } from '@angular/core';
import { IMAGES } from '../../data/site.data';
import { PageHeader } from '../../shared/page-header';
import { SemFrame } from '../../shared/sem-frame';
import { CtaBand } from '../../shared/cta-band';

@Component({
  selector: 'app-micro-ftir-page',
  imports: [PageHeader, SemFrame, CtaBand],
  template: `
    <app-page-header
      eyebrow="Micro FT-IR · Organic analysis"
      title="When EDS says “carbon,” FT-IR says what it is"
      crumb="Micro FT-IR"
      lead="Fourier Transform Infrared spectroscopy identifies the chemical composition and structure of carbon-based materials in heterogeneous samples."
    />

    <section class="section">
      <div class="container split">
        <div class="stack">
          <div class="prose">
            <p>
              Occasionally, SEM/EDS analysis will result in a carbon element without much more information. For that
              reason, Houston Electron Microscopy acquired a <strong>micro FT-IR system</strong> to discover the chemical
              distribution of materials in heterogeneous samples.
            </p>
            <p>
              FT-IR analysis determines the sample&apos;s chemical composition and structure. The SEM with ChemiSEM
              technology and the micro FT-IR system together give us the ability to analyze a wide range of chemicals,
              materials, and organic and inorganic compounds.
            </p>
          </div>
          <h2 class="h2">Typical applications</h2>
          <ul class="checklist">
            @for (a of applications; track a) {
              <li>{{ a }}</li>
            }
          </ul>
        </div>
        <app-sem-frame [image]="ftir" ratio="4 / 3" [compact]="true" [priority]="true" />
      </div>
    </section>

    <section class="section workflow">
      <div class="container stack">
        <span class="eyebrow">Combined workflow</span>
        <h2 class="h2">SEM/EDS and micro FT-IR on the same sample</h2>
        <ol class="steps">
          @for (step of steps; track step.title) {
            <li class="card">
              <h3>{{ step.title }}</h3>
              <p>{{ step.body }}</p>
            </li>
          }
        </ol>
      </div>
    </section>

    <app-cta-band />
  `,
  styles: `
    .workflow {
      background: var(--surface);
      border-block: 1px solid var(--line);
    }
    .steps {
      display: grid;
      gap: 1rem;
      margin: 0;
      padding: 0;
      list-style: none;
      counter-reset: step;
    }
    @media (min-width: 900px) {
      .steps {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    .steps .card {
      background: var(--background);
      counter-increment: step;
    }
    .steps h3::before {
      content: counter(step) '. ';
      color: var(--primary);
      font-family: var(--font-mono);
    }
    h3 {
      font-size: 1.125rem;
    }
    .steps p {
      color: var(--muted);
    }
  `,
})
export class MicroFtirPage {
  protected readonly ftir = IMAGES.ftir;
  protected readonly applications = [
    'Polymer and plastic identification',
    'Organic contaminants, residues, and films',
    'Lubricants, oils, and greases',
    'Coatings, paints, and adhesives',
    'Carbon-rich deposits flagged by EDS',
  ];
  protected readonly steps = [
    { title: 'Image & map', body: 'SEM imaging with real-time ColorSEM element maps locates the features of interest.' },
    { title: 'Flag organics', body: 'Areas returning mainly carbon (and oxygen) are marked for molecular analysis.' },
    { title: 'Identify', body: 'Micro FT-IR spectra are matched to identify the compound and its structure.' },
  ];
}
