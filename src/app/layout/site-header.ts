import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { CONTACT, NAV } from '../data/site.data';
import { BrandMark } from '../shared/brand-mark';
import { SiteSearch } from '../shared/site-search';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, BrandMark, SiteSearch],
  template: `
    <div class="utility">
      <div class="container utility-inner">
        <span class="mono">Independent expertise. Microscopic precision.</span>
        <app-site-search class="utility-search" [compact]="true" />
        <div class="utility-links">
          <a [href]="contact.phoneHref">{{ contact.phone }}</a>
          <a [href]="'mailto:' + contact.email">{{ contact.email }}</a>
        </div>
      </div>
    </div>

    <header class="bar">
      <div class="container bar-inner">
        <a routerLink="/" class="brand" aria-label="Houston Electron Microscopy home">
          <app-brand-mark />
          <span class="brand-text">
            <strong>Houston Electron Microscopy</strong>
            <span class="mono">SEM/EDS · Micro FT-IR Lab</span>
          </span>
        </a>

        <button
          type="button"
          class="menu-toggle"
          [attr.aria-expanded]="open()"
          aria-controls="primary-nav"
          (click)="open.set(!open())"
        >
          <span class="sr-only">{{ open() ? 'Close menu' : 'Open menu' }}</span>
          <span class="bars" [class.is-open]="open()" aria-hidden="true"><i></i><i></i><i></i></span>
        </button>

        <nav id="primary-nav" class="nav" [class.is-open]="open()" aria-label="Primary">
          <app-site-search class="nav-search" />
          <ul>
            @for (item of nav; track item.link) {
              <li>
                <a
                  [routerLink]="item.link"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: item.link === '/' }"
                  ariaCurrentWhenActive="page"
                  >{{ item.label }}</a
                >
              </li>
            }
          </ul>
          <a class="portal-link" routerLink="/portal" routerLinkActive="active">Client Portal ↗</a>
          <a class="btn btn-primary nav-cta" [href]="contact.phoneHref">Let’s talk <span aria-hidden="true">↗</span></a>
        </nav>
      </div>
    </header>
  `,
  styles: `
    .portal-link { font-size: 12px; font-weight: 600; text-decoration: none; white-space: nowrap; }
    .utility {
      background: var(--ink);
      color: color-mix(in srgb, var(--on-ink) 78%, var(--ink));
      font-size: 0.8125rem;
    }
    .utility-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      min-height: 2.25rem;
    }
    .utility-search {
      display: none;
      flex: 0 1 24rem;
    }
    @media (min-width: 900px) {
      .utility-inner {
        min-height: 3.25rem;
      }
      .utility-search {
        display: block;
      }
      .nav-search {
        display: none;
      }
    }
    .utility-inner > .mono {
      display: none;
      font-size: 0.75rem;
      letter-spacing: 0.04em;
    }
    .utility-links {
      display: flex;
      gap: 1.25rem;
      margin-inline: auto;
    }
    .utility a {
      color: var(--on-ink);
      text-decoration: none;
    }
    .utility a:hover {
      text-decoration: underline;
    }
    @media (min-width: 640px) {
      .utility-inner > .mono {
        display: inline;
      }
      .utility-links {
        margin-inline: 0;
      }
    }

    .bar {
      position: sticky;
      top: 0;
      z-index: 40;
      background: color-mix(in srgb, var(--surface) 92%, transparent);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--line);
    }
    .bar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      min-height: 5.5rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
    }
    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .brand-text strong {
      font-size: 0.9375rem;
      font-weight: 600;
      max-width: 210px;
    }
    .brand-text .mono {
      font-size: 0.6875rem;
      color: var(--muted);
      letter-spacing: 0.04em;
    }

    .menu-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.75rem;
      height: 2.75rem;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--surface);
      cursor: pointer;
    }
    .bars {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 18px;
    }
    .bars i {
      display: block;
      height: 2px;
      background: var(--ink);
      transition: transform 200ms ease, opacity 200ms ease;
    }
    .bars.is-open i:nth-child(1) {
      transform: translateY(6px) rotate(45deg);
    }
    .bars.is-open i:nth-child(2) {
      opacity: 0;
    }
    .bars.is-open i:nth-child(3) {
      transform: translateY(-6px) rotate(-45deg);
    }

    .nav {
      display: none;
      position: absolute;
      inset: 100% 0 auto 0;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem 1.25rem 1.5rem;
      background: var(--surface);
      border-bottom: 1px solid var(--line);
    }
    .nav.is-open {
      display: flex;
    }
    .nav ul {
      display: flex;
      flex-direction: column;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .nav ul a {
      display: block;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--line);
      font-weight: 500;
      text-decoration: none;
    }
    .nav ul a.active {
      color: var(--primary);
    }

    @media (min-width: 1200px) {
      .nav-search {
        display: none;
      }
      .menu-toggle {
        display: none;
      }
      .nav,
      .nav.is-open {
        position: static;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 1rem;
        padding: 0;
        background: none;
        border: 0;
      }
      .nav ul {
        flex-direction: row;
        gap: 0.25rem;
      }
      .nav ul a {
        position: relative;
        padding: 0.5rem 0.4rem;
        border: 0;
        font-size: 0.8125rem;
        color: var(--muted);
      }
      .nav ul a:hover {
        color: var(--ink);
      }
      .nav ul a.active {
        color: var(--ink);
      }
      .nav ul a.active::after {
        content: '';
        position: absolute;
        left: 0.625rem;
        right: 0.625rem;
        bottom: -0.875rem;
        height: 2px;
        background: var(--primary);
      }
    }
  `,
})
export class SiteHeader {
  protected readonly nav = NAV;
  protected readonly contact = CONTACT;
  protected readonly open = signal(false);

  constructor() {
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.open.set(false));
  }
}
