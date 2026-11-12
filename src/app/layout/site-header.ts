import { Component, ElementRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { CONTACT, NAV, SERVICES } from '../data/site.data';
import { SERVICE_CATEGORIES, SERVICE_PRICING, formatUsd } from '../data/service-pricing';
import { BrandMark } from '../shared/brand-mark';
import { SiteSearch } from '../shared/site-search';

@Component({
  selector: 'app-site-header',
  host: { '(document:keydown.escape)': 'servicesOpen.set(false)', '(document:click)': 'onDocClick($event)' },
  imports: [RouterLink, RouterLinkActive, BrandMark, SiteSearch],
  template: `
    <div class="utility">
      <div class="container utility-inner">
        <span class="mono">Independent expertise. Microscopic precision.</span>
        @if (!isHome()) {
          <app-site-search class="utility-search" [compact]="true" />
        }
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
              <li [class.has-menu]="item.link === '/services'" [class.no-hover]="item.link === '/services' && hoverSuppressed()" (mouseleave)="hoverSuppressed.set(false)">
                <a
                  [routerLink]="item.link"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: item.link === '/' }"
                  ariaCurrentWhenActive="page"
                  >{{ item.label }}</a
                >
                @if (item.link === '/services') {
                  <button
                    type="button"
                    class="menu-caret"
                    aria-controls="services-menu"
                    [attr.aria-expanded]="servicesOpen()"
                    (click)="servicesOpen.set(!servicesOpen())"
                  >
                    <span class="sr-only">Show service categories</span>
                    <svg aria-hidden="true" viewBox="0 0 12 12" width="10" height="10"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" /></svg>
                  </button>
                  <div id="services-menu" class="mega" [class.is-open]="servicesOpen()">
                    <div class="mega-inner">
                      @for (group of serviceGroups; track group.category) {
                        <div class="mega-col">
                          <a class="mega-head mono" routerLink="/services" [queryParams]="{ category: group.category }">{{ group.category }}</a>
                          <ul>
                            @for (s of group.services; track s.slug) {
                              <li>
                                <a [routerLink]="['/services', s.slug]">
                                  <span>{{ s.title }}</span>
                                  <small>{{ s.price }}</small>
                                </a>
                              </li>
                            }
                          </ul>
                        </div>
                      }
                      <div class="mega-aside">
                        <span class="mono">NOT SURE WHAT YOU NEED?</span>
                        <p>Describe the sample and the question. Our Ph.D. expert will recommend the right technique, free of charge.</p>
                        <a class="btn btn-primary" routerLink="/contact">Ask an expert <span aria-hidden="true">↗</span></a>
                        <a class="text-link" routerLink="/services">Browse the full catalog →</a>
                        <a class="text-link" routerLink="/sample-submission">How to send samples →</a>
                      </div>
                    </div>
                  </div>
                }
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
    .menu-caret, .mega { display: none; }
    @media (min-width: 1200px) {
      .has-menu { display: flex; align-items: center; }
      .menu-caret {
        display: inline-grid; place-items: center; width: 1.25rem; height: 1.5rem;
        margin-left: -0.25rem; padding: 0; border: 0; background: none; color: var(--muted); cursor: pointer;
      }
      .menu-caret[aria-expanded='true'] svg { transform: rotate(180deg); }
      .menu-caret svg { transition: transform 150ms ease; }
      .mega {
        position: absolute; left: 0; right: 0; top: 100%;
        background: var(--surface); border-block: 1px solid var(--line); box-shadow: var(--shadow);
      }
      .mega::before { content: ''; position: absolute; left: 0; right: 0; bottom: 100%; height: 1.6rem; }
      .has-menu:not(.no-hover):hover .mega, .mega.is-open { display: block; }
      .mega-inner {
        max-width: var(--container); margin-inline: auto; padding: 1.75rem 1.25rem 2rem;
        display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) 17rem; gap: 1.75rem 2rem;
      }
      .nav .mega-col ul { display: flex; flex-direction: column; gap: 0; margin: 0.5rem 0 0; padding: 0; list-style: none; }
      .nav .mega-head {
        display: block; padding: 0 0 0.5rem; font-size: 0.6875rem; letter-spacing: 0.08em; text-transform: uppercase;
        color: var(--primary); border-bottom: 1px solid var(--line);
      }
      .nav .mega-col ul a {
        display: flex; justify-content: space-between; gap: 1rem; padding: 0.45rem 0; font-size: 0.8125rem; color: var(--ink);
      }
      .nav .mega-col ul a::after { display: none; }
      .nav .mega-col ul a:hover span { color: var(--primary); text-decoration: underline; text-underline-offset: 3px; }
      .mega-col small { color: var(--muted); font-size: 0.75rem; white-space: nowrap; }
      .mega-aside {
        grid-column: 4; grid-row: 1 / span 2; display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start;
        padding: 1.25rem; background: #edf3f0; border-radius: var(--radius);
      }
      .mega-aside .mono { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--primary); }
      .mega-aside p { font-size: 0.8125rem; color: var(--muted); line-height: 1.6; }
      .nav .mega-aside .text-link { padding: 0; font-size: 0.8125rem; color: var(--ink); }
      .nav .mega-aside .btn { color: var(--on-primary); padding: 0.6rem 1rem; }
    }
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
  protected readonly servicesOpen = signal(false);
  /** After a navigation, keep the hover menu closed until the pointer leaves it. */
  protected readonly hoverSuppressed = signal(false);
  /** The home hero has its own large search box, so the header one is hidden there. */
  protected readonly isHome = signal(false);
  private readonly host = inject(ElementRef<HTMLElement>);

  /** Services grouped by catalog category, for the desktop mega menu. */
  protected readonly serviceGroups = SERVICE_CATEGORIES.map((category) => ({
    category,
    services: SERVICES.filter((s) => SERVICE_PRICING[s.slug]?.category === category).map((s) => {
      const price = SERVICE_PRICING[s.slug].startingUsd;
      return { slug: s.slug, title: s.title, price: price === null ? 'Included' : 'From ' + formatUsd(price) };
    }),
  })).filter((g) => g.services.length);

  protected onDocClick(event: Event): void {
    const menu = this.host.nativeElement.querySelector('li.has-menu');
    if (this.servicesOpen() && menu && !menu.contains(event.target as Node)) this.servicesOpen.set(false);
  }

  constructor() {
    const router = inject(Router);
    router.events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.open.set(false);
        this.servicesOpen.set(false);
        this.hoverSuppressed.set(!!this.host.nativeElement.querySelector('li.has-menu:hover'));
        this.isHome.set(router.url.split(/[?#]/)[0] === '/');
      });
  }
}
