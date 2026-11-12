import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CONTACT, NAV, SERVICES } from '../data/site.data';
import { BrandMark } from '../shared/brand-mark';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink, BrandMark],
  template: `
    <footer>
      <div class="container grid">
        <div class="about">
          <div class="brand">
            <app-brand-mark />
            <strong>{{ contact.company }}</strong>
          </div>
          <p>{{ contact.tagline }}</p>
          <address>
            {{ contact.address }}<br />{{ contact.city }}<br />
            <a [href]="contact.phoneHref">{{ contact.phone }}</a><br />
            <a [href]="'mailto:' + contact.email">{{ contact.email }}</a>
          </address>
          <div class="footer-cta">
            <a class="btn btn-light" routerLink="/contact">Request a quote</a>
            <a class="btn btn-ghost" routerLink="/portal">Client portal ↗</a>
          </div>
        </div>

        <nav aria-label="Site">
          <h2>Site</h2>
          <ul>
            @for (item of nav; track item.link) {
              <li><a [routerLink]="item.link">{{ item.label }}</a></li>
            }
          </ul>
          <h2 class="sub">For clients</h2>
          <ul>
            <li><a routerLink="/sample-submission">How to send samples</a></li>
            <li><a routerLink="/services">Service catalog &amp; prices</a></li>
            <li><a routerLink="/portal">Client portal</a></li>
          </ul>
        </nav>

        <nav aria-label="Services" class="services">
          <h2>Services</h2>
          <ul>
            @for (s of services; track s.slug) {
              <li><a [routerLink]="['/services', s.slug]">{{ s.title }}</a></li>
            }
          </ul>
        </nav>
      </div>

      <div class="container legal">
        <span>&copy; {{ year }} {{ contact.company }} · All rights reserved</span>
        <ul>
          @for (s of contact.social; track s.label) {
            <li><a [href]="s.href" target="_blank" rel="noopener noreferrer">{{ s.label }}</a></li>
          }
        </ul>
      </div>
    </footer>
  `,
  styles: `
    footer {
      background: var(--ink);
      color: color-mix(in srgb, var(--on-ink) 72%, var(--ink));
      font-size: 0.9375rem;
      padding-top: 4rem;
    }
    a {
      color: var(--on-ink);
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    .grid {
      display: grid;
      gap: 2.5rem;
      grid-template-columns: 1fr;
    }
    @media (min-width: 768px) {
      .grid {
        grid-template-columns: 1.2fr 0.6fr 1.4fr;
      }
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--on-ink);
      margin-bottom: 1rem;
    }
    .about {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .footer-cta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.625rem;
      margin-top: 0.75rem;
    }
    .footer-cta .btn {
      min-height: 2.5rem;
      font-size: 0.8125rem;
      text-decoration: none;
    }
    .btn-light {
      background: var(--accent);
      color: var(--ink);
    }
    .btn-light:hover {
      background: color-mix(in srgb, var(--accent) 80%, white);
    }
    .btn-ghost {
      border-color: color-mix(in srgb, var(--on-ink) 30%, transparent);
      color: var(--on-ink);
    }
    .btn-ghost:hover {
      border-color: var(--on-ink);
    }
    h2.sub {
      margin-top: 2rem;
    }
    address {
      font-style: normal;
      line-height: 1.7;
    }
    h2 {
      font: 500 0.75rem/1 var(--font-mono);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 1rem;
    }
    ul {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .services ul {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.5rem 1.5rem;
    }
    .legal {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-top: 3.5rem;
      padding-block: 1.5rem;
      border-top: 1px solid color-mix(in srgb, var(--on-ink) 14%, transparent);
      font-size: 0.8125rem;
    }
    .legal ul {
      flex-direction: row;
      gap: 1.25rem;
    }
  `,
})
export class SiteFooter {
  protected readonly contact = CONTACT;
  protected readonly nav = NAV;
  protected readonly services = SERVICES;
  protected readonly year = new Date().getFullYear();
}
