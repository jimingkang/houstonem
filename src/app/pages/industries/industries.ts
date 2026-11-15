import { Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { INDUSTRIES, SERVICES } from '../../data/site.data';
import { PageHeader } from '../../shared/page-header';
import { QuoteDialog } from '../../shared/quote-dialog';
import { CtaBand } from '../../shared/cta-band';

const SERVICE_NAMES = new Map(SERVICES.map(service => [service.slug, service.title]));

@Component({
  selector: 'app-industries-page',
  imports: [NgOptimizedImage, RouterLink, PageHeader, QuoteDialog, CtaBand],
  template: `
    <app-page-header
      eyebrow="Industries we serve"
      title="Materials analysis for every industry"
      crumb="Industries"
      lead="From drilling tools to medical implants, the questions are similar: what is this made of, what went wrong, and does it meet spec. Here is how our SEM/EDS, Micro FT-IR and related services answer them in each industry."
    />

    <nav class="container jump" aria-label="Industries on this page">
      @for (industry of industries; track industry.slug) {
        <a [href]="'#' + industry.slug" class="chip">{{ industry.name }}</a>
      }
    </nav>

    <section class="section">
      <div class="container list">
        @for (industry of industries; track industry.slug; let i = $index) {
          <article class="industry" [id]="industry.slug" [class.flip]="i % 2 === 1">
            <div class="photo">
              <img [ngSrc]="industry.image.src" [alt]="industry.image.alt" fill sizes="(min-width: 900px) 45vw, 100vw" [priority]="i === 0" />
            </div>
            <div class="text">
              <span class="mono num">{{ (i + 1).toString().padStart(2, '0') }}</span>
              <h2>{{ industry.name }}</h2>
              <p class="summary">{{ industry.summary }}</p>
              <h3>Typical applications</h3>
              <ul class="apps">
                @for (app of industry.applications; track app) { <li>{{ app }}</li> }
              </ul>
              <ul class="services" aria-label="Related services">
                @for (slug of industry.services; track slug) {
                  <li><a [routerLink]="['/services', slug]" class="mono">{{ serviceName(slug) }}</a></li>
                }
              </ul>
              <button type="button" class="btn btn-primary" (click)="quote.open()">Get a quote ↗</button>
            </div>
          </article>
        }
      </div>
    </section>

    <app-quote-dialog #quote />
    <app-cta-band />
  `,
  styles: `
    .jump { display: flex; flex-wrap: wrap; gap: .5rem; padding-block: 1.5rem 0; }
    .chip { padding: .45rem .85rem; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); color: var(--ink); font-size: .85rem; text-decoration: none; }
    .chip:hover { border-color: var(--primary); color: var(--primary); }
    .list { display: grid; gap: 4rem; }
    .industry { display: grid; gap: 1.5rem; align-items: center; scroll-margin-top: 6rem; }
    @media (min-width: 900px) {
      .industry { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 3rem; }
      .industry.flip .photo { order: 2; }
    }
    .photo { position: relative; aspect-ratio: 4 / 3; overflow: hidden; border-radius: var(--radius); background: var(--ink); }
    .photo img { object-fit: cover; }
    .text { display: grid; gap: .8rem; justify-items: start; }
    .num { font-size: .75rem; color: var(--primary); letter-spacing: .08em; }
    .text h2 { font-size: clamp(1.6rem, 3vw, 2.1rem); margin: 0; }
    .summary { color: var(--muted); margin: 0; }
    .text h3 { font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; margin: .4rem 0 0; }
    .apps { margin: 0; padding-left: 1.1rem; display: grid; gap: .35rem; }
    .services { display: flex; flex-wrap: wrap; gap: .4rem; margin: .3rem 0; padding: 0; list-style: none; }
    .services a { display: inline-block; padding: .3rem .65rem; border: 1px solid var(--line); border-radius: 999px; font-size: .75rem; color: var(--primary); text-decoration: none; background: var(--surface); }
    .services a:hover { border-color: var(--primary); }
  `,
})
export class IndustriesPage {
  protected readonly industries = INDUSTRIES;
  protected serviceName(slug: string) { return SERVICE_NAMES.get(slug) ?? slug; }
}
