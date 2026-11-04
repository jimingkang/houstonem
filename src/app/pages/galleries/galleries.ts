import { Component, ElementRef, computed, signal, viewChild } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { GALLERY, GALLERY_CATEGORIES, GalleryItem } from '../../data/site.data';
import { PageHeader } from '../../shared/page-header';
import { SemFrame } from '../../shared/sem-frame';

@Component({
  selector: 'app-galleries-page',
  imports: [PageHeader, SemFrame, NgOptimizedImage],
  template: `
    <app-page-header
      eyebrow="SEM/EDS images"
      title="Galleries directory"
      crumb="Galleries"
      lead="Micrographs from real-world analyses and curiosities — fracture surfaces, non-metallics, phases, insects, Galveston sea water, and egg shell."
    />

    <section class="section">
      <div class="container stack">
        <div class="filters" role="group" aria-label="Filter galleries">
          @for (c of categories; track c) {
            <button
              type="button"
              class="chip"
              [class.active]="active() === c"
              [attr.aria-pressed]="active() === c"
              (click)="active.set(c)"
            >
              {{ c }}
              <span class="mono count">{{ countFor(c) }}</span>
            </button>
          }
        </div>

        <ul class="grid" aria-live="polite">
          @for (item of visible(); track item.title) {
            <li>
              <button type="button" class="item" (click)="open(item)">
                <span class="thumb">
                  <img [ngSrc]="item.image.src" [alt]="item.image.alt" fill sizes="(min-width: 900px) 33vw, 50vw" />
                </span>
                <span class="meta">
                  <span class="mono cat">{{ item.category }}</span>
                  <span class="title">{{ item.title }}</span>
                </span>
              </button>
            </li>
          }
        </ul>
      </div>
    </section>

    <dialog #dialog class="lightbox" (close)="selected.set(null)" (click)="onBackdrop($event)">
      @if (selected(); as s) {
        <div class="lightbox-inner">
          <app-sem-frame [image]="s.image" ratio="1 / 1" sizes="(min-width: 900px) 50vw, 100vw" />
          <div class="lightbox-text">
            <div>
              <span class="mono cat">{{ s.category }}</span>
              <h2>{{ s.title }}</h2>
              <p>{{ s.description }}</p>
            </div>
            <button type="button" class="btn btn-outline" (click)="dialog.close()">Close</button>
          </div>
        </div>
      }
    </dialog>
  `,
  styles: `
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      min-height: 2.5rem;
      padding: 0.5rem 0.875rem;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--surface);
      color: var(--ink);
      font: 500 0.875rem/1 var(--font-sans);
      cursor: pointer;
    }
    .chip:hover {
      border-color: var(--ink);
    }
    .chip.active {
      background: var(--ink);
      border-color: var(--ink);
      color: var(--on-ink);
    }
    .count {
      font-size: 0.6875rem;
      opacity: 0.7;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    @media (min-width: 900px) {
      .grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    .item {
      display: flex;
      flex-direction: column;
      width: 100%;
      padding: 0;
      border: 0;
      border-radius: var(--radius);
      overflow: hidden;
      background: var(--ink);
      color: var(--on-ink);
      text-align: left;
      cursor: zoom-in;
    }
    .thumb {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
    }
    .thumb img {
      object-fit: cover;
      transition: transform 400ms ease;
    }
    .item:hover img {
      transform: scale(1.05);
    }
    .meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.75rem 0.875rem;
      border-top: 2px solid var(--primary);
    }
    .cat {
      font-size: 0.6875rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--accent);
    }
    .title {
      font: 500 0.9375rem/1.3 var(--font-sans);
    }

    .lightbox {
      width: min(92vw, 60rem);
      max-height: 92vh;
      padding: 0;
      border: 0;
      border-radius: var(--radius);
      background: var(--surface);
      color: var(--ink);
    }
    .lightbox::backdrop {
      background: color-mix(in srgb, var(--ink) 80%, transparent);
    }
    .lightbox-inner {
      display: grid;
      gap: 1.5rem;
      padding: 1rem;
    }
    @media (min-width: 900px) {
      .lightbox-inner {
        grid-template-columns: 1.4fr 1fr;
        padding: 1.25rem;
      }
    }
    .lightbox-text {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
    }
    .lightbox-text .cat {
      color: var(--primary);
    }
    .lightbox-text h2 {
      font-size: 1.5rem;
      margin: 0.5rem 0;
    }
    .lightbox-text p {
      color: var(--muted);
    }
  `,
})
export class GalleriesPage {
  protected readonly categories = ['All', ...GALLERY_CATEGORIES] as const;
  protected readonly active = signal<string>('All');
  protected readonly selected = signal<GalleryItem | null>(null);
  protected readonly visible = computed(() =>
    this.active() === 'All' ? GALLERY : GALLERY.filter((g) => g.category === this.active()),
  );

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected countFor(category: string): number {
    return category === 'All' ? GALLERY.length : GALLERY.filter((g) => g.category === category).length;
  }

  protected open(item: GalleryItem): void {
    this.selected.set(item);
    this.dialog().nativeElement.showModal();
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.dialog().nativeElement.close();
    }
  }
}
