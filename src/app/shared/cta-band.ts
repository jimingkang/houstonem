import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CONTACT } from '../data/site.data';

@Component({
  selector: 'app-cta-band',
  imports: [RouterLink],
  template: `
    <section class="container" aria-labelledby="cta-title">
      <div class="band">
        <div class="copy">
          <span class="eyebrow">Same day or next day service</span>
          <h2 id="cta-title">Talk to our Ph.D. expert about your unique materials project.</h2>
          <p>
            Ship us the sample and watch the SEM/EDS session live over Microsoft Teams or Zoom — just as if
            you were in our lab.
          </p>
        </div>
        <div class="actions">
          <a class="btn btn-primary" [href]="contact.phoneHref">Call {{ contact.phone }}</a>
          <a class="btn btn-outline" routerLink="/contact">Request a quote</a>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      padding-block: 4rem;
    }
    .band {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      padding: 2rem;
      border-radius: var(--radius);
      background: var(--primary-soft);
      border: 1px solid color-mix(in srgb, var(--primary) 22%, transparent);
    }
    @media (min-width: 900px) {
      .band {
        flex-direction: row;
        align-items: flex-end;
        justify-content: space-between;
        padding: 3rem;
      }
    }
    .copy {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      max-width: 40rem;
    }
    h2 {
      font-size: clamp(1.5rem, 3vw, 2.125rem);
    }
    p {
      color: var(--muted);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  `,
})
export class CtaBand {
  protected readonly contact = CONTACT;
}
