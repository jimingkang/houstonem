import { Component } from '@angular/core';
import { IMAGES } from '../../data/site.data';
import { PageHeader } from '../../shared/page-header';
import { SemFrame } from '../../shared/sem-frame';
import { CtaBand } from '../../shared/cta-band';

@Component({
  selector: 'app-sem-edx-page',
  imports: [PageHeader, SemFrame, CtaBand],
  template: `
    <app-page-header
      eyebrow="SEM/EDS · ColorSEM with ChemiSEM"
      title="Scanning Electron Microscope & Energy Dispersive Spectrometer"
      crumb="SEM/EDX"
      lead="Analyze inorganic materials on a macro and micro scale — with elements displayed in color, in real time."
    />

    <section class="section">
      <div class="container split">
        <div class="stack">
          <div class="prose">
            <p>
              Houston Electron Microscopy has a state-of-the-art SEM/EDS system. Our <strong>ColorSEM</strong> features
              ChemiSEM Technology, which provides a visual representation of the elements present — a new way of viewing
              specimens that displays elements in color and in real time. This is called elemental mapping, and it is used
              in failure analysis, coating analysis, particle analysis and more.
            </p>
            <p>This sophisticated system answers questions such as:</p>
          </div>
          <ul class="questions">
            @for (q of questions; track q) {
              <li>{{ q }}</li>
            }
          </ul>
        </div>
        <div class="stack">
          <app-sem-frame [image]="hero" ratio="1 / 1" [priority]="true" sizes="(min-width: 1024px) 40vw, 100vw" />
          <p class="note">
            ColorSEM imaging highlights oxides surrounding a defect, leading to answers for the cause of failure.
          </p>
        </div>
      </div>
    </section>

    <section class="section signals">
      <div class="container stack">
        <span class="eyebrow">SEM/EDS analysis</span>
        <h2 class="h2">Three signals. One answer.</h2>
        <p class="lead intro">
          With SEM/EDS analysis, it is possible to identify microscopic particles or contamination causing process
          problems from a variety of signals.
        </p>
        <ol class="signal-list">
          @for (s of signals; track s.name) {
            <li class="card">
              <span class="mono code">{{ s.code }}</span>
              <h3>{{ s.name }}</h3>
              <p>{{ s.use }}</p>
            </li>
          }
        </ol>
      </div>
    </section>

    <section class="section">
      <div class="container split">
        <div class="stack">
          <h2 class="h2">How results are reported</h2>
          <ul class="checklist">
            <li>Elemental spectrums to identify the elements present</li>
            <li>Quantitative atomic and weight percent calculations</li>
            <li>X-ray mapping that combines the image with its chemical composition</li>
          </ul>
          <p class="muted">
            Curious how the SEM or Energy Dispersive X-Ray Spectroscopy works? We invite you to tour our lab and see the
            system in action.
          </p>
        </div>
        <div class="card">
          <h3>Advantages</h3>
          <ul class="checklist">
            <li>Experience — 40+ years in metallurgy and failure analysis</li>
            <li>Modern SEM/EDS system with ColorSEM</li>
            <li>No hidden charges or operator fees</li>
            <li>Easy and quick availability</li>
            <li>Conveniently located in Southwest Houston</li>
          </ul>
        </div>
      </div>
    </section>

    <app-cta-band />
  `,
  styles: `
    .questions {
      display: grid;
      gap: 0.5rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .questions li {
      padding: 0.75rem 1rem;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      font-weight: 500;
    }
    .note,
    .muted {
      font-size: 0.875rem;
      color: var(--muted);
    }
    .signals {
      background: var(--surface);
      border-block: 1px solid var(--line);
    }
    .intro {
      max-width: 60ch;
    }
    .signal-list {
      display: grid;
      gap: 1rem;
      margin: 1rem 0 0;
      padding: 0;
      list-style: none;
    }
    @media (min-width: 900px) {
      .signal-list {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    .signal-list .card {
      background: var(--background);
    }
    .code {
      align-self: flex-start;
      padding: 0.25rem 0.5rem;
      background: var(--ink);
      color: var(--accent);
      font-size: 0.75rem;
      border-radius: 2px;
    }
    h3 {
      font-size: 1.125rem;
    }
    .signal-list p {
      color: var(--muted);
    }
  `,
})
export class SemEdxPage {
  protected readonly hero = IMAGES.hero;
  protected readonly questions = [
    'What is this material, and what is it composed of?',
    'Which elements are found in this material? What type of steel is this?',
    'What caused this material to corrode, and which corrosion elements are present?',
    'Was corrosion the cause for this material to break or fail?',
  ];
  protected readonly signals = [
    { code: 'SE', name: 'Secondary Electrons', use: 'Topographical imaging of the sample surface.' },
    { code: 'BSE', name: 'Backscattered Electrons', use: 'Atomic number contrast imaging to separate phases.' },
    { code: 'EDS', name: 'Characteristic X-rays', use: 'Chemical analysis by Energy Dispersive Spectrometry.' },
  ];
}
