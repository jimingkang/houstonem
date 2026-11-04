import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  template: `
    <section class="header">
      <div class="container inner">
        <nav aria-label="Breadcrumb">
          <ol class="mono">
            <li><a routerLink="/">Home</a></li>
            @if (parent(); as p) {
              <li><a [routerLink]="p.link">{{ p.label }}</a></li>
            }
            <li aria-current="page">{{ crumb() || title() }}</li>
          </ol>
        </nav>
        <span class="eyebrow">{{ eyebrow() }}</span>
        <h1>{{ title() }}</h1>
        @if (lead()) {
          <p class="lead">{{ lead() }}</p>
        }
      </div>
    </section>
  `,
  styles: `
    .header {
      border-bottom: 1px solid var(--line);
      background: var(--surface);
    }
    .inner {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
      padding-block: 3rem 3.5rem;
    }
    @media (min-width: 768px) {
      .inner {
        padding-block: 4rem 4.5rem;
      }
    }
    ol {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 0 0 1rem;
      padding: 0;
      list-style: none;
      font-size: 0.75rem;
      color: var(--muted);
    }
    li + li::before {
      content: '/';
      margin-right: 0.5rem;
      color: var(--line);
    }
    a {
      text-decoration: none;
    }
    a:hover {
      color: var(--primary);
    }
    h1 {
      font-size: clamp(2rem, 4.5vw, 3.25rem);
      max-width: 22ch;
    }
    .lead {
      max-width: 62ch;
    }
  `,
})
export class PageHeader {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly lead = input('');
  readonly crumb = input('');
  readonly parent = input<{ label: string; link: string } | null>(null);
}
