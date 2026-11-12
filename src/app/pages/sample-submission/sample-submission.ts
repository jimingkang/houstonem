import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CONTACT } from '../../data/site.data';
import { PageHeader } from '../../shared/page-header';

/** Practical guide to preparing and sending samples, modeled on a lab "sample shipping" page. */
@Component({
  selector: 'app-sample-submission-page',
  imports: [RouterLink, PageHeader],
  template: `
    <app-page-header
      eyebrow="Before you ship"
      title="How to send samples"
      crumb="Sample submission"
      lead="A few minutes of preparation protects the evidence on your sample and gets you results faster. Here is what we need, and how to pack it."
    >
      <div class="hero-actions">
        <a class="btn btn-primary" routerLink="/contact">Contact the lab first <span aria-hidden="true">↗</span></a>
        <a class="btn btn-outline" routerLink="/services">Choose a service</a>
      </div>
    </app-page-header>

    <section class="section">
      <div class="container two-col">
        <div class="stack">
          <span class="eyebrow">Step by step</span>
          <h2 class="h2">From your bench to our microscope</h2>
          <ol class="steps">
            @for (step of steps; track step.title; let i = $index) {
              <li>
                <span class="num mono">{{ (i + 1).toString().padStart(2, '0') }}</span>
                <div><h3>{{ step.title }}</h3><p>{{ step.text }}</p></div>
              </li>
            }
          </ol>
        </div>
        <aside class="ship-card" aria-label="Shipping address">
          <span class="eyebrow">Ship or drop off to</span>
          <address>
            <strong>{{ contact.company }}</strong><br />
            {{ contact.address }}<br />{{ contact.city }}
          </address>
          <p class="muted">Please call or email before shipping so we can confirm the scope and expect your package.</p>
          <a class="text-link" [href]="contact.phoneHref">{{ contact.phone }}</a>
          <a class="text-link" [href]="'mailto:' + contact.email">{{ contact.email }}</a>
        </aside>
      </div>
    </section>

    <section class="section tinted" aria-labelledby="include-title">
      <div class="container stack">
        <h2 id="include-title" class="h2">What to include with your samples</h2>
        <ul class="checklist">
          @for (item of include; track item) {
            <li>{{ item }}</li>
          }
        </ul>
      </div>
    </section>

    <section class="section" aria-labelledby="pack-title">
      <div class="container stack">
        <h2 id="pack-title" class="h2">Packing by sample type</h2>
        <div class="pack-grid">
          @for (t of packing; track t.type) {
            <article class="card">
              <span class="mono code">{{ t.type }}</span>
              <p>{{ t.tip }}</p>
              <a class="text-link" [routerLink]="t.link">Related service →</a>
            </article>
          }
        </div>
        <p class="note">
          <strong>Hazardous or regulated material?</strong> Tell us before shipping and include any safety data sheet.
          We will confirm whether we can accept the sample and how it should be packed.
        </p>
      </div>
    </section>

    <section class="contact-band">
      <div class="container band">
        <div>
          <h2>Ready to send something?</h2>
          <p>Tell us about the sample first. We will confirm the right analysis and a quote before anything ships.</p>
        </div>
        <a class="btn btn-light" routerLink="/contact">Request a quote <span aria-hidden="true">↗</span></a>
      </div>
    </section>
  `,
  styles: `
    .hero-actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:.75rem}
    .two-col{display:grid;gap:2.5rem;align-items:start}
    @media(min-width:900px){.two-col{grid-template-columns:minmax(0,1fr) 22rem;gap:4rem}.ship-card{position:sticky;top:7rem}}
    .steps{list-style:none;margin:0;padding:0}
    .steps li{display:flex;gap:1.25rem;padding:1.1rem 0;border-top:1px solid var(--line)}
    .steps .num{color:var(--primary);font-size:.75rem;padding-top:.2rem}
    .steps h3{font-size:1.05rem}.steps p{color:var(--muted);font-size:.92rem;margin-top:.3rem}
    .ship-card{display:flex;flex-direction:column;gap:.75rem;padding:1.5rem;background:#edf3f0;border:1px solid var(--line);border-radius:var(--radius)}
    address{font-style:normal;line-height:1.7}.muted{font-size:.85rem;color:var(--muted)}
    .tinted{background:var(--surface);border-block:1px solid var(--line)}
    .checklist{list-style:none;margin:0;padding:0;display:grid;gap:.75rem}
    @media(min-width:768px){.checklist{grid-template-columns:1fr 1fr;column-gap:2.5rem}}
    .checklist li{position:relative;padding-left:1.75rem;font-size:.95rem}
    .checklist li::before{content:'';position:absolute;left:.2rem;top:.3rem;width:.45rem;height:.8rem;border:solid var(--primary);border-width:0 2px 2px 0;transform:rotate(45deg)}
    .pack-grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(min(100%,16rem),1fr))}
    .pack-grid .card{gap:.6rem}.pack-grid p{font-size:.9rem;color:var(--muted);flex:1}.pack-grid .text-link{font-size:.8rem}
    .code{font-size:.75rem;text-transform:uppercase;color:var(--primary)}
    .note{padding:1rem 1.25rem;border-left:3px solid var(--primary);background:var(--primary-soft);font-size:.92rem}
    .contact-band{background:#123e35;color:#fff;padding:3.5rem 0}
    .band{display:flex;flex-wrap:wrap;gap:1.5rem;align-items:center;justify-content:space-between}
    .band h2{font-size:clamp(1.6rem,3vw,2.2rem);font-weight:500}.band p{color:#c1d0ca;margin-top:.5rem;max-width:52ch}
    .btn-light{background:#d8e5c8;color:#173d33}
  `,
})
export class SampleSubmissionPage {
  protected readonly contact = CONTACT;

  protected readonly steps = [
    { title: 'Contact us before you ship', text: 'Describe the material and your question. We recommend the technique, confirm the sample size and preparation, and send a quote.' },
    { title: 'Label each sample', text: 'Give every sample a short, unique ID and write the same ID on your sample list. Mark the area of interest if there is one.' },
    { title: 'Pack to protect the evidence', text: 'Keep surfaces clean and dry, and stop parts from moving in the box. See the packing tips by sample type below.' },
    { title: 'Ship or drop off', text: 'Send the package to our Houston laboratory, or bring it in. Email us the tracking number so we can watch for it.' },
    { title: 'We confirm receipt', text: 'We check the samples against your list and confirm the scope and timeline before analysis starts.' },
  ];

  protected readonly include = [
    'Your name, company, phone and email',
    'The service you need, or the question you want answered',
    'A list of sample IDs that matches the labels',
    'Material type, alloy or grade, if known',
    'Service history, operating conditions or photos for failed parts',
    'Your deadline, and whether you want to join a live remote session',
    'Whether samples should be returned or can be discarded',
    'Any safety information for hazardous materials',
  ];

  protected readonly packing = [
    { type: 'Fracture surfaces', tip: 'Do not fit the broken halves back together, touch, or clean the fracture face. Wrap each piece separately and keep it dry.', link: '/services/failure-analysis' },
    { type: 'Corroded parts', tip: 'Leave corrosion products and deposits in place. Seal the part in a clean bag so nothing flakes off in transit.', link: '/services/corrosion' },
    { type: 'Liquids & oils', tip: 'Use a clean, leak-proof, sealed container inside a second bag. Tell us the volume and what the fluid is.', link: '/services/contamination' },
    { type: 'Powders & particles', tip: 'Use a sealed, labeled vial. Avoid tape or adhesives touching the material.', link: '/services/particle-analysis' },
    { type: 'Polymers & films', tip: 'Avoid touching the area of interest. Keep films flat and away from heat.', link: '/services/micro-ftir' },
    { type: 'Core samples', tip: 'Note the depth and orientation, and keep fragile pieces cushioned and separated.', link: '/services/core-samples' },
  ];
}
