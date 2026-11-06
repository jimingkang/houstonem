import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeader } from './layout/site-header';
import { SiteFooter } from './layout/site-footer';
import { Chatbot } from './shared/chatbot';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeader, SiteFooter, Chatbot],
  template: `
    <a class="skip" href="#main">Skip to content</a>
    <app-site-header />
    <main id="main">
      <router-outlet />
    </main>
    <app-site-footer />
    <app-chatbot />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
    }
    main {
      flex: 1;
    }
    .skip {
      position: absolute;
      left: 1rem;
      top: -4rem;
      z-index: 100;
      padding: 0.5rem 1rem;
      background: var(--ink);
      color: var(--on-ink);
      border-radius: var(--radius);
    }
    .skip:focus {
      top: 1rem;
    }
  `,
})
export class App {}
