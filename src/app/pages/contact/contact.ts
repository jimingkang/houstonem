import { AfterViewInit, Component, inject, viewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { quoteSampleCount } from '../../data/service-pricing';
import { CONTACT } from '../../data/site.data';
import { PageHeader } from '../../shared/page-header';
import { QuoteForm } from '../../shared/quote-form';

@Component({
  selector: 'app-contact-page',
  imports: [PageHeader, QuoteForm],
  template: `
    <app-page-header
      eyebrow="Contact"
      title="Send us a sample. Get answers."
      crumb="Contact"
      lead="Call today for a free consultation about your unique materials project. Same day or next day service is available in most cases."
    />

    <section class="section">
      <div class="container split">
        <div class="card form">
          <app-quote-form #quoteForm titleId="contact-quote-title" />
          <p class="muted alt">Prefer email? Write to <a [href]="'mailto:' + contact.email">{{ contact.email }}</a> or call {{ contact.phone }}.</p>
        </div>

        <div class="stack">
          <div class="card">
            <span class="eyebrow">Lab</span>
            <dl class="info">
              <div>
                <dt>Phone</dt>
                <dd><a [href]="contact.phoneHref">{{ contact.phone }}</a></dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd><a [href]="'mailto:' + contact.email">{{ contact.email }}</a></dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{{ contact.address }}<br />{{ contact.city }}</dd>
              </div>
            </dl>
          </div>

          @for (person of contact.team; track person.email) {
            <div class="card person">
              <h3>{{ person.name }}</h3>
              <p class="muted">{{ person.role }}</p>
              <p>
                <a [href]="person.phoneHref">{{ person.phone }}</a><br />
                <a [href]="'mailto:' + person.email">{{ person.email }}</a>
              </p>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="map-wrap container" aria-label="Map">
      <iframe
        [src]="mapUrl"
        title="Map showing Houston Electron Microscopy at 12919 Southwest Fwy, Suite 140"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
      ></iframe>
    </section>
  `,
  styles: `
    .alt { margin-top: 18px; font-size: 13px; }
    .form {
      gap: 1.25rem;
    }
    .muted {
      color: var(--muted);
      font-size: 0.9375rem;
    }
    .row {
      display: grid;
      gap: 1.25rem;
    }
    @media (min-width: 640px) {
      .row {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
    }
    input,
    select,
    textarea {
      width: 100%;
      min-height: 2.75rem;
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--background);
      color: var(--ink);
      font: 400 1rem/1.5 var(--font-sans);
    }
    input:focus,
    select:focus,
    textarea:focus {
      outline: 2px solid var(--primary);
      outline-offset: 0;
      border-color: transparent;
    }
    [aria-invalid='true'] {
      border-color: var(--ink);
      background: color-mix(in srgb, var(--accent) 12%, var(--surface));
    }
    .error {
      font-weight: 400;
      color: var(--ink);
    }
    .error::before {
      content: '! ';
      font-family: var(--font-mono);
      color: var(--primary);
    }
    .form .btn {
      align-self: flex-start;
    }
    .success {
      padding: 0.75rem 1rem;
      background: var(--primary-soft);
      border-radius: var(--radius);
      font-size: 0.9375rem;
    }
    .info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin: 0;
    }
    dt {
      font: 400 0.6875rem/1 var(--font-mono);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 0.375rem;
    }
    dd {
      margin: 0;
      font-weight: 500;
    }
    a {
      text-decoration: none;
      color: var(--primary);
    }
    a:hover {
      text-decoration: underline;
    }
    .person {
      gap: 0.375rem;
    }
    .person h3 {
      font-size: 1.125rem;
    }
    .map-wrap {
      padding-bottom: 4rem;
    }
    iframe {
      display: block;
      width: 100%;
      height: 24rem;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      filter: grayscale(0.4);
    }
  `,
})
export class ContactPage implements AfterViewInit {
  protected readonly contact = CONTACT;
  private readonly route = inject(ActivatedRoute);
  private readonly quoteForm = viewChild.required(QuoteForm);
  protected readonly mapUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(
    `https://maps.google.com/maps?q=${encodeURIComponent(CONTACT.mapQuery)}&z=15&output=embed`,
  );

  /** Service pages link here with ?service=<slug>&samples=<n>; carry those into the form. */
  ngAfterViewInit() {
    const params = this.route.snapshot.queryParamMap;
    const service = params.get('service') ?? undefined;
    if (service) this.quoteForm().prefill({ service, samples: quoteSampleCount(params.get('samples')) });
  }
}
