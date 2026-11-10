import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { CONTACT } from '../../data/site.data';
import { QuoteForm } from '../../shared/quote-form';
import { PageHeader } from '../../shared/page-header';

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
        <app-quote-form heading="Request a quote" [need]="need()" [service]="service()" />

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
    .muted {
      color: var(--muted);
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
export class ContactPage {
  protected readonly contact = CONTACT;
  private readonly params = inject(ActivatedRoute).queryParamMap;
  protected readonly need = toSignal(this.params.pipe(map((p) => p.get('need') ?? '')), { initialValue: '' });
  protected readonly service = toSignal(this.params.pipe(map((p) => p.get('service') ?? '')), { initialValue: '' });
  protected readonly mapUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(
    `https://maps.google.com/maps?q=${encodeURIComponent(CONTACT.mapQuery)}&z=15&output=embed`,
  );
}
