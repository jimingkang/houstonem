import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { Tile } from '../data/site.data';

@Component({
  selector: 'app-tile-grid',
  imports: [RouterLink, NgOptimizedImage],
  template: `
    <ul class="grid">
      @for (tile of tiles(); track tile.label) {
        <li>
          <a [routerLink]="tile.link" class="tile">
            <span class="image">
              <img [ngSrc]="tile.image.src" alt="" fill sizes="(min-width: 1024px) 16vw, 50vw" />
            </span>
            <span class="label">
              <span>{{ tile.label }}</span>
              <span class="mono mag" aria-hidden="true">{{ tile.image.mag }}</span>
            </span>
          </a>
        </li>
      }
    </ul>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    @media (min-width: 768px) {
      .grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    @media (min-width: 1100px) {
      .grid {
        grid-template-columns: repeat(6, minmax(0, 1fr));
      }
    }
    .tile {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--ink);
      color: var(--on-ink);
      border-radius: var(--radius);
      overflow: hidden;
      text-decoration: none;
    }
    .image {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
    }
    img {
      object-fit: cover;
      filter: grayscale(0.25);
      transition: transform 400ms ease, filter 400ms ease;
    }
    .tile:hover img,
    .tile:focus-visible img {
      transform: scale(1.06);
      filter: grayscale(0);
    }
    .label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.625rem 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 1.3;
      border-top: 2px solid var(--primary);
    }
    .tile:hover .label {
      border-top-color: var(--accent);
    }
    .mag {
      font-size: 0.625rem;
      font-weight: 400;
      color: color-mix(in srgb, var(--on-ink) 60%, var(--ink));
      white-space: nowrap;
    }
  `,
})
export class TileGrid {
  readonly tiles = input.required<Tile[]>();
}
