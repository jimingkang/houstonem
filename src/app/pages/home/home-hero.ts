import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CONTACT, IMAGES } from '../../data/site.data';
import { SemFrame } from '../../shared/sem-frame';

@Component({
  selector: 'app-home-hero',
  imports: [RouterLink, SemFrame],
  template: `
    <section class="hero">
      <div class="container inner">
        <div class="copy">
          <span class="eyebrow">Industrial forensics laboratory · Houston, TX</span>
          <h1>Scanning Electron Microscopy &amp; Element Analysis</h1>
          <p class="lead">
            Materials analysis for metals, alloys, composites, chemicals, polymers, and beyond. SEM/EDS with
            real-time ColorSEM element mapping and micro FT-IR — reported in language any audience understands.
          </p>
          <div class="actions">
            <a class="btn btn-primary" [href]="contact.phoneHref">Free consultation</a>
            <a class="btn btn-outline" routerLink="/services">Explore services</a>
          </div>
          <dl class="facts">
            <div>
              <dt class="mono">Turnaround</dt>
              <dd>Same or next day</dd>
            </div>
            <div>
              <dt class="mono">Viewing</dt>
              <dd>Live remote sessions</dd>
            </div>
            <div>
              <dt class="mono">Experience</dt>
              <dd>40+ years metallurgy</dd>
            </div>
          </dl>
        </div>

        <div class="visual">
          <app-sem-frame
            [image]="hero"
            ratio="5 / 4"
            [priority]="true"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
          <p class="caption">
            <span class="mono">ALWAYS-ON X-RAY MAPPING</span>
            Real-time element mapping reveals what might otherwise be missed — and focuses the analysis on the
            elements of interest.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .hero {
      position: relative;
      overflow: hidden;
      background: var(--background);
      border-bottom: 1px solid var(--line);
    }
    .hero::after {
      content: '';
      position: absolute;
      right: -12rem;
      bottom: -14rem;
      width: 34rem;
      height: 34rem;
      border: 1px solid color-mix(in srgb, var(--primary) 22%, transparent);
      border-radius: 50%;
      box-shadow: 0 0 0 3rem color-mix(in srgb, var(--primary) 4%, transparent), 0 0 0 7rem color-mix(in srgb, var(--primary) 3%, transparent);
      pointer-events: none;
    }
    .inner {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 3rem;
      padding-block: 3rem 4rem;
    }
    @media (min-width: 1024px) {
      .inner {
        grid-template-columns: 1fr 1.05fr;
        align-items: center;
        gap: 4rem;
        padding-block: 5rem 5.5rem;
      }
    }
    .copy {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 1.5rem;

    }
    h1 {
      max-width: 10ch;
      font-size: clamp(2.75rem, 6vw, 5.25rem);
      font-weight: 700;
      letter-spacing: -0.025em;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .facts {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1rem;
      width: 100%;
      margin: 1rem 0 0;
      padding-top: 1.5rem;
      border-top: 1px solid var(--line);
    }
    .facts div {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    dt {
      font-size: 0.6875rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--muted);
    }
    dd {
      margin: 0;
      font-weight: 600;
      font-size: 0.9375rem;
      line-height: 1.3;
    }
    .visual {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;

    }
    .caption {
      font-size: 0.875rem;
      color: var(--muted);
      max-width: 52ch;
    }
    .caption .mono {
      display: block;
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--primary);
      margin-bottom: 0.25rem;
    }
    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
    }
  `,
})
export class HomeHero {
  protected readonly contact = CONTACT;
  protected readonly hero = IMAGES.hero;
}
