import { Component, input } from '@angular/core';
import { Faq } from '../data/site.data';

/** Accessible FAQ accordion built on native details/summary. */
@Component({
  selector: 'app-faq-list',
  template: `
    <div class="faq">
      @for (f of items(); track f.q; let first = $first) {
        <details [open]="first && openFirst()">
          <summary>
            <span>{{ f.q }}</span>
            <i aria-hidden="true"></i>
          </summary>
          <p>{{ f.a }}</p>
        </details>
      }
    </div>
  `,
  styles: `
    .faq { border-top: 1px solid var(--line); }
    details { border-bottom: 1px solid var(--line); }
    summary {
      display: flex; justify-content: space-between; align-items: center; gap: 1.5rem;
      padding: 1.25rem 0; cursor: pointer; list-style: none;
      font-weight: 500; font-size: 1.0625rem;
    }
    summary::-webkit-details-marker { display: none; }
    summary:hover span { color: var(--primary); }
    i {
      position: relative; flex: none; width: 1.75rem; height: 1.75rem;
      border: 1px solid var(--line); border-radius: 50%;
    }
    i::before, i::after {
      content: ''; position: absolute; left: 50%; top: 50%;
      width: 0.625rem; height: 1.5px; background: var(--primary);
      transform: translate(-50%, -50%); transition: transform 200ms ease;
    }
    i::after { transform: translate(-50%, -50%) rotate(90deg); }
    details[open] i::after { transform: translate(-50%, -50%) rotate(0deg); }
    p { padding: 0 3rem 1.375rem 0; color: var(--muted); max-width: 46rem; }
  `,
})
export class FaqList {
  readonly items = input.required<readonly Faq[]>();
  readonly openFirst = input(true);
}
