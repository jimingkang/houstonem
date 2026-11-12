import { Component, computed, ElementRef, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SEARCH_INDEX, SearchEntry } from '../data/site.data';

let nextId = 0;

/** Type-ahead search over techniques, services and pages, with keyboard navigation. */
@Component({
  selector: 'app-site-search',
  host: { '(document:click)': 'onDocClick($event)', '[class.compact]': 'compact()' },
  template: `
    <div class="box" role="combobox" [attr.aria-expanded]="showList()" aria-haspopup="listbox" [attr.aria-owns]="listId">
      <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16">
        <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8" />
        <path d="m13 13 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      </svg>
      <label class="sr-only" [for]="inputId">Search analyses and services</label>
      <input
        [id]="inputId"
        type="search"
        autocomplete="off"
        [placeholder]="placeholder()"
        [value]="query()"
        aria-autocomplete="list"
        [attr.aria-controls]="listId"
        [attr.aria-activedescendant]="showList() && results().length ? listId + '-' + active() : null"
        (input)="onInput($event)"
        (focus)="open.set(true)"
        (keydown)="onKey($event)"
      />
    </div>
    @if (showList()) {
      <ul class="results" role="listbox" [id]="listId">
        @for (r of results(); track r.link; let i = $index) {
          <li
            role="option"
            [id]="listId + '-' + i"
            [attr.aria-selected]="i === active()"
            [class.active]="i === active()"
            (mouseenter)="active.set(i)"
            (mousedown)="$event.preventDefault()"
            (click)="go(r)"
          >
            <span class="label">{{ r.label }}</span>
            <span class="hint mono">{{ r.hint }}</span>
          </li>
        } @empty {
          <li class="empty">
            No match. <a href="/contact" (click)="$event.preventDefault(); goContact()">Ask our expert</a> — we analyze far more than we list.
          </li>
        }
      </ul>
    }
  `,
  styles: `
    :host { position: relative; display: block; }
    .box {
      display: flex; align-items: center; gap: 0.5rem;
      min-height: 2.75rem; padding: 0 0.875rem;
      background: var(--surface); border: 1px solid var(--line); border-radius: 999px;
      color: var(--muted);
      transition: border-color 150ms ease;
    }
    .box:focus-within { border-color: var(--primary); color: var(--primary); }
    :host.compact .box { min-height: 2.375rem; }
    input {
      flex: 1; min-width: 0; border: 0; background: none; outline: none;
      font: 400 0.875rem/1.4 var(--font-sans); color: var(--ink);
    }
    input::placeholder { color: var(--muted); }
    input::-webkit-search-cancel-button { cursor: pointer; }
    .results {
      position: absolute; z-index: 60; top: calc(100% + 0.375rem); left: 0; right: 0;
      min-width: 18rem; max-height: 22rem; overflow: auto;
      margin: 0; padding: 0.375rem; list-style: none;
      background: var(--surface); border: 1px solid var(--line); border-radius: 0.5rem;
      box-shadow: var(--shadow);
    }
    li[role='option'] {
      display: flex; justify-content: space-between; align-items: baseline; gap: 1rem;
      padding: 0.625rem 0.75rem; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;
    }
    li.active { background: var(--primary-soft); color: var(--primary); }
    .hint { flex: none; font-size: 0.6875rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .empty { padding: 0.75rem; font-size: 0.875rem; color: var(--muted); }
    .empty a { color: var(--primary); }
  `,
})
export class SiteSearch {
  readonly placeholder = input('E.g. SEM, corrosion, FT-IR, coating thickness…');
  readonly compact = input(false);

  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly inputId = `site-search-${nextId}`;
  protected readonly listId = `site-search-list-${nextId++}`;
  protected readonly query = signal('');
  protected readonly open = signal(false);
  protected readonly active = signal(0);

  protected readonly results = computed(() => {
    const terms = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return SEARCH_INDEX.map((e) => {
      const label = e.label.toLowerCase();
      const hay = `${label} ${e.keywords}`;
      if (!terms.every((t) => hay.includes(t))) return null;
      const score = terms.reduce((n, t) => n + (label.startsWith(t) ? 3 : label.includes(t) ? 2 : 1), 0);
      return { e, score };
    })
      .filter((x): x is { e: SearchEntry; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 7)
      .map((x) => x.e);
  });

  protected readonly showList = computed(() => this.open() && this.query().trim().length > 0);

  protected onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.active.set(0);
    this.open.set(true);
  }

  protected onKey(event: KeyboardEvent): void {
    const count = this.results().length;
    if (event.key === 'ArrowDown' && count) {
      event.preventDefault();
      this.open.set(true);
      this.active.set((this.active() + 1) % count);
    } else if (event.key === 'ArrowUp' && count) {
      event.preventDefault();
      this.active.set((this.active() - 1 + count) % count);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const hit = this.results()[this.active()];
      if (hit) this.go(hit);
      else if (this.query().trim()) this.goContact();
    } else if (event.key === 'Escape') {
      this.open.set(false);
    }
  }

  protected go(entry: SearchEntry): void {
    this.reset();
    this.router.navigateByUrl(entry.link);
  }

  protected goContact(): void {
    const q = this.query().trim();
    this.reset();
    this.router.navigate(['/contact'], { queryParams: q ? { need: q } : {} });
  }

  protected onDocClick(event: Event): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  private reset(): void {
    this.query.set('');
    this.open.set(false);
    this.active.set(0);
  }
}
