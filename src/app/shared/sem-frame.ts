import { Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Micrograph } from '../data/site.data';

/** Micrograph framed with the instrument data bar printed under real SEM captures. */
@Component({
  selector: 'app-sem-frame',
  imports: [NgOptimizedImage],
  template: `
    <figure class="frame" [class.compact]="compact()">
      <div class="image" [style.aspect-ratio]="ratio()">
        <img
          [ngSrc]="image().src"
          [alt]="image().alt"
          fill
          [priority]="priority()"
          [sizes]="sizes()"
        />
      </div>
      <figcaption class="bar mono">
        <span class="cell logo" aria-hidden="true">HEM</span>
        @if (!compact()) {
          <span class="cell"><b>HV</b>{{ image().hv }}</span>
          <span class="cell"><b>det</b>{{ image().det }}</span>
          <span class="cell wd"><b>WD</b>{{ image().wd }}</span>
        }
        <span class="cell"><b>mag</b>{{ image().mag }}</span>
        <span class="scale" aria-hidden="true"></span>
        <span class="sr-only">{{ image().alt }}</span>
      </figcaption>
    </figure>
  `,
  styles: `
    :host {
      display: block;
    }
    .frame {
      margin: 0;
      background: var(--ink);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .image {
      position: relative;
      background: var(--ink);
    }
    img {
      object-fit: cover;
    }
    .bar {
      display: flex;
      align-items: stretch;
      color: var(--on-ink);
      font-size: 0.6875rem;
      line-height: 1;
      border-top: 1px solid color-mix(in srgb, var(--on-ink) 25%, transparent);
    }
    .cell {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.25rem;
      padding: 0.4rem 0.625rem;
      border-right: 1px solid color-mix(in srgb, var(--on-ink) 25%, transparent);
      white-space: nowrap;
    }
    .cell b {
      font-weight: 400;
      font-size: 0.5625rem;
      color: color-mix(in srgb, var(--on-ink) 60%, var(--ink));
    }
    .logo {
      color: var(--accent);
      font-weight: 500;
    }
    .wd {
      display: none;
    }
    @media (min-width: 640px) {
      .wd {
        display: flex;
      }
    }
    .scale {
      flex: 1;
      position: relative;
      min-width: 3rem;
    }
    .scale::after {
      content: '';
      position: absolute;
      right: 0.625rem;
      top: 50%;
      width: 2.5rem;
      height: 6px;
      transform: translateY(-50%);
      border: 1px solid var(--on-ink);
      border-top: 0;
    }
  `,
})
export class SemFrame {
  readonly image = input.required<Micrograph>();
  readonly ratio = input('4 / 3');
  readonly priority = input(false);
  readonly compact = input(false);
  readonly sizes = input('(min-width: 1024px) 33vw, 100vw');
}
