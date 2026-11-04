import { Component } from '@angular/core';
import { ANALYSES, MATERIALS } from '../../data/site.data';
import { TileGrid } from '../../shared/tile-grid';
import { CtaBand } from '../../shared/cta-band';
import { HomeHero } from './home-hero';
import { HomeTechniques } from './home-techniques';
import { HomeSpecialties } from './home-specialties';

@Component({
  selector: 'app-home-page',
  imports: [HomeHero, HomeTechniques, HomeSpecialties, TileGrid, CtaBand],
  template: `
    <app-home-hero />

    <section class="signal-strip" aria-label="Laboratory capabilities">
      <div class="container signal-inner">
        <span><b>01</b> Same-day turnaround</span>
        <span><b>02</b> Live remote viewing</span>
        <span><b>03</b> Ph.D. interpretation</span>
        <span><b>04</b> Houston, Texas</span>
      </div>
    </section>

    <section class="section" aria-labelledby="materials-title">
      <div class="container">
        <div class="head">
          <div>
            <span class="eyebrow">What we examine</span>
            <h2 id="materials-title">Organic and inorganic materials at the micron level</h2>
          </div>
          <p>
            We provide materials analysis to manufacturing facilities, laboratories, consultants, engineers and
            researchers.
          </p>
        </div>
        <app-tile-grid [tiles]="materials" />
      </div>
    </section>

    <section class="section analyses" aria-labelledby="analyses-title">
      <div class="container">
        <div class="head">
          <div>
            <span class="eyebrow">How we find answers</span>
            <h2 id="analyses-title">Types of analysis</h2>
          </div>
          <p>
            From fractography to deposit chemistry — each analysis combines imaging with elemental or molecular
            identification.
          </p>
        </div>
        <app-tile-grid [tiles]="analyses" />
      </div>
    </section>

    <app-home-specialties />
    <app-home-techniques />
    <app-cta-band />
  `,
  styles: `
    .signal-strip {
      background: var(--deep);
      color: #f7f3ea;
      border-bottom: 1px solid rgba(255,255,255,0.12);
    }
    .signal-inner {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0;
    }
    .signal-inner span {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      min-height: 3.25rem;
      border-right: 1px solid rgba(255,255,255,0.12);
      font-size: 0.75rem;
      letter-spacing: 0.01em;
    }
    .signal-inner span:nth-child(even) { padding-left: 1rem; border-right: 0; }
    .signal-inner b {
      color: var(--accent);
      font: 0.6875rem var(--font-mono);
    }
    @media (min-width: 768px) {
      .signal-inner { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .signal-inner span { padding-left: 1.25rem; }
      .signal-inner span:nth-child(even) { padding-left: 1.25rem; border-right: 1px solid rgba(255,255,255,0.12); }
      .signal-inner span:first-child { padding-left: 0; }
      .signal-inner span:last-child { border-right: 0; }
    }
    .analyses {
      padding-top: 0;
      background: var(--surface);
    }
    .head {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .head > div {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    @media (min-width: 900px) {
      .head {
        flex-direction: row;
        align-items: flex-end;
        justify-content: space-between;
        gap: 3rem;
      }
    }
    h2 {
      font-size: clamp(1.5rem, 3vw, 2.125rem);
      max-width: 24ch;
    }
    .head p {
      max-width: 40ch;
      color: var(--muted);
    }
  `,
})
export class HomePage {
  protected readonly materials = MATERIALS;
  protected readonly analyses = ANALYSES;
}
