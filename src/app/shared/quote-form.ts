import { Component, effect, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CONTACT, SERVICES } from '../data/site.data';

let nextId = 0;

/**
 * Structured quote request: contact details, then the testing need, sample material,
 * sample count and whether the need is recurring. Composes an email to the lab.
 */
@Component({
  selector: 'app-quote-form',
  imports: [ReactiveFormsModule],
  template: `
    <form class="card form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="intro">
        <h2 class="h2" [id]="headingId">{{ heading() }}</h2>
        <p class="muted">We usually reply within one business day. The form opens your email app, addressed to {{ contact.email }}.</p>
      </div>

      <fieldset>
        <legend class="mono">01 · Your details</legend>
        <div class="row">
          <label class="field">
            <span>Name *</span>
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
            <span>Work email *</span>
            <input type="email" formControlName="email" autocomplete="email" [attr.aria-invalid]="invalid('email')" />
            @if (invalid('email')) {
              <small class="error">Please enter a valid email address.</small>
            }
          </label>
          <label class="field">
            <span>Phone</span>
            <input type="tel" formControlName="phone" autocomplete="tel" placeholder="+1 …" />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend class="mono">02 · Your samples</legend>
        <label class="field">
          <span>Service of interest</span>
          <select formControlName="service">
            <option value="">Not sure yet — please advise</option>
            @for (s of services; track s.slug) {
              <option [value]="s.title">{{ s.title }}</option>
            }
            <option value="Micro FT-IR Analysis">Micro FT-IR Analysis</option>
          </select>
        </label>
        <label class="field">
          <span>What do you need to find out? *</span>
          <textarea
            rows="4"
            formControlName="message"
            [attr.aria-invalid]="invalid('message')"
            placeholder="Describe the problem, the objective of the analysis and any deadline."
          ></textarea>
          @if (invalid('message')) {
            <small class="error">Please describe your project (at least 10 characters).</small>
          }
        </label>
        <div class="row">
          <label class="field">
            <span>Sample material</span>
            <input type="text" formControlName="material" placeholder="E.g. 316 stainless steel, PVC film, oil" />
          </label>
          <label class="field">
            <span>Number of samples</span>
            <input type="text" formControlName="count" inputmode="numeric" placeholder="E.g. 3" />
          </label>
        </div>
        <div class="field">
          <span id="{{ headingId }}-recurring">Is this a recurring need?</span>
          <div class="toggle" role="radiogroup" [attr.aria-labelledby]="headingId + '-recurring'">
            <label><input type="radio" formControlName="recurring" value="no" /> One-off</label>
            <label><input type="radio" formControlName="recurring" value="yes" /> Recurring</label>
          </div>
        </div>
        @if (form.controls.recurring.value === 'yes') {
          <label class="field">
            <span>How often, and roughly how many samples?</span>
            <input type="text" formControlName="frequency" placeholder="E.g. 10 samples per month" />
          </label>
        }
      </fieldset>

      <ul class="tips">
        <li>Helpful to mention: is cross-sectioning needed? Is the sample dry or wet?</li>
        <li>Not sure which technique fits? Leave the service blank and we will recommend one.</li>
      </ul>

      <div class="submit">
        <button type="submit" class="btn btn-primary">Send request <span aria-hidden="true">↗</span></button>
        <span class="muted">Or call <a [href]="contact.phoneHref">{{ contact.phone }}</a></span>
      </div>
      @if (sent()) {
        <p class="success" role="status">Your email app should now be open. You can also call {{ contact.phone }}.</p>
      }
    </form>
  `,
  styles: `
    .form { gap: 1.5rem; }
    .intro { display: flex; flex-direction: column; gap: 0.5rem; }
    .muted { color: var(--muted); font-size: 0.9375rem; }
    fieldset { display: flex; flex-direction: column; gap: 1.125rem; margin: 0; padding: 0; border: 0; }
    legend { margin-bottom: 1rem; font-size: 0.6875rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--primary); }
    .row { display: grid; gap: 1.125rem; }
    @media (min-width: 640px) { .row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    .field { display: flex; flex-direction: column; gap: 0.375rem; font-size: 0.875rem; font-weight: 500; }
    input:not([type='radio']), select, textarea {
      width: 100%; min-height: 2.75rem; padding: 0.625rem 0.75rem;
      border: 1px solid var(--line); border-radius: var(--radius);
      background: var(--background); color: var(--ink); font: 400 1rem/1.5 var(--font-sans);
    }
    input:focus, select:focus, textarea:focus { outline: 2px solid var(--primary); outline-offset: 0; border-color: transparent; }
    [aria-invalid='true'] { border-color: var(--ink); background: color-mix(in srgb, var(--accent) 12%, var(--surface)); }
    .error { font-weight: 400; color: var(--ink); }
    .error::before { content: '! '; font-family: var(--font-mono); color: var(--primary); }
    .toggle { display: flex; gap: 0.5rem; }
    .toggle label {
      display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.875rem;
      border: 1px solid var(--line); border-radius: 999px; font-weight: 400; cursor: pointer;
    }
    .toggle label:has(input:checked) { border-color: var(--primary); background: var(--primary-soft); color: var(--primary); }
    .toggle input { accent-color: var(--primary); }
    .tips { margin: 0; padding: 1rem 1.125rem 1rem 2.25rem; background: var(--primary-soft); border-radius: var(--radius); font-size: 0.875rem; color: var(--muted); }
    .submit { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }
    .submit a { color: var(--primary); }
    .success { padding: 0.75rem 1rem; background: var(--primary-soft); border-radius: var(--radius); font-size: 0.9375rem; }
  `,
})
export class QuoteForm {
  readonly heading = input('Ask for an offer');
  readonly service = input('');
  readonly need = input('');

  protected readonly contact = CONTACT;
  protected readonly services = SERVICES;
  protected readonly sent = signal(false);
  protected readonly headingId = `quote-${nextId++}`;

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', Validators.required],
    company: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    service: [''],
    message: ['', [Validators.required, Validators.minLength(10)]],
    material: [''],
    count: [''],
    recurring: ['no'],
    frequency: [''],
  });

  constructor() {
    effect(() => {
      if (this.service()) this.form.controls.service.setValue(this.service());
    });
    effect(() => {
      if (this.need() && !this.form.controls.message.value) this.form.controls.message.setValue(this.need());
    });
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
      v.material ? `Sample material: ${v.material}` : null,
      v.count ? `Number of samples: ${v.count}` : null,
      `Recurring need: ${v.recurring === 'yes' ? `yes${v.frequency ? ` (${v.frequency})` : ''}` : 'no'}`,
      '',
      v.message,
    ]
      .filter((line) => line !== null)
      .join('\n');
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    this.sent.set(true);
  }
}
