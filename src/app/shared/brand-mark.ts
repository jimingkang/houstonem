import { Component } from '@angular/core';

@Component({
  selector: 'app-brand-mark',
  template: `<span class="mark" aria-hidden="true">e<sup>−</sup>m</span>`,
  styles: `
    .mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      border: 2px solid var(--primary);
      flex: none;
      color: inherit;
      font: 600 0.9375rem/1 var(--font-mono);
      letter-spacing: -0.04em;
      box-shadow: inset 0 0 0 3px var(--surface), inset 0 0 0 4px var(--accent);
    }
    sup {
      font-size: 0.625rem;
      color: var(--primary);
      margin-inline: 1px;
    }
  `,
})
export class BrandMark {}
