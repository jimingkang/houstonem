import { Component, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { SERVICE_PRICING, formatUsd, quoteSampleCount } from '../../data/service-pricing';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { CONTACT, SERVICES } from '../../data/site.data';
import { PageHeader } from '../../shared/page-header';

@Component({
  selector: 'app-contact-page',
  imports: [PageHeader, ReactiveFormsModule],
  template: `
    <app-page-header
      eyebrow="Contact"
      title="Send us a sample. Get answers."
      crumb="Contact"
      lead="Call today for a free consultation about your unique materials project. Same day or next day service is available in most cases."
    />

    <section class="section">
      <div class="container split">
        <form class="card form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <h2 class="h2">Request a quote</h2>
          <p class="muted">Opens your email app with the details pre-filled, addressed to {{ contact.email }}.</p>

          <div class="row">
            <label class="field">
              <span>Name</span>
              <input type="text" formControlName="name" autocomplete="name" [attr.aria-invalid]="invalid('name')" />
              @if (invalid('name')) {
                <small class="error">Please enter your name.</small>
              }
            </label>
            <label class="field">
              <span>Company</span>
              <input type="text" formControlName="company" autocomplete="organization" />
            </label>
          </div>

          <div class="row">
            <label class="field">
              <span>Email</span>
              <input type="email" formControlName="email" autocomplete="email" [attr.aria-invalid]="invalid('email')" />
              @if (invalid('email')) {
                <small class="error">Please enter a valid email address.</small>
              }
            </label>
            <label class="field">
              <span>Phone</span>
              <input type="tel" formControlName="phone" autocomplete="tel" />
            </label>
          </div>

          <label class="field">
            <span>Service of interest</span>
            <select #serviceSelect formControlName="service" (change)="selectedService.set(serviceSelect.value)">
              <option value="">Not sure yet</option>
              @for (s of services; track s.slug) {
                <option [value]="s.title">{{ s.title }}</option>
              }
            </select>
          </label>

          @if (estimateText(); as estimate) {
            <p class="muted estimate-note" role="status">{{ estimate }} Final pricing is subject to laboratory review.</p>
          }

          <label class="field">
            <span>Tell us about your sample</span>
            <textarea
              rows="5"
              formControlName="message"
              [attr.aria-invalid]="invalid('message')"
              placeholder="Material, quantity, what you need to find out, deadline…"
            ></textarea>
            @if (invalid('message')) {
              <small class="error">Please describe your project (at least 10 characters).</small>
            }
          </label>

          <button type="submit" class="btn btn-primary">Compose email</button>
          @if (sent()) {
            <p class="success" role="status">Your email app should now be open. You can also call {{ contact.phone }}.</p>
          }
        </form>

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
export class ContactPage {
  protected readonly contact = CONTACT;
  protected readonly services = SERVICES;
  protected readonly sent = signal(false);
  private readonly route = inject(ActivatedRoute);
  private readonly quotedService = SERVICES.find(service => service.slug === this.route.snapshot.queryParamMap.get('service'));
  private readonly requestedSamples = quoteSampleCount(this.route.snapshot.queryParamMap.get('samples'));
  protected readonly selectedService = signal(this.quotedService?.title ?? '');
  protected readonly mapUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(
    `https://maps.google.com/maps?q=${encodeURIComponent(CONTACT.mapQuery)}&z=15&output=embed`,
  );

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', Validators.required],
    company: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    service: [this.selectedService()],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected estimateText(): string | null {
    if (!this.quotedService || this.quotedService.title !== this.selectedService()) return null;
    const price = SERVICE_PRICING[this.quotedService.slug];
    if (price.startingUsd === null) return null;
    const quantity = price.unit === 'sample' ? this.requestedSamples : 1;
    const scope = price.unit === 'sample' ? `${quantity} ${quantity === 1 ? 'sample' : 'samples'}` : '1 project';
    return `Illustrative starting estimate for ${scope}: ${formatUsd(price.startingUsd * quantity)} USD.`;
  }

  protected invalid(name: 'name' | 'email' | 'message'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const subject = `Quote request${v.service ? ` — ${v.service}` : ''}`;
    const body = [
      `Name: ${v.name}`,
      v.company ? `Company: ${v.company}` : null,
      `Email: ${v.email}`,
      v.phone ? `Phone: ${v.phone}` : null,
      v.service ? `Service: ${v.service}` : null,
      this.estimateText(),
      '',
      v.message,
    ]
      .filter((line) => line !== null)
      .join('\n');
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    this.sent.set(true);
  }
}
