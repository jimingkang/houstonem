import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SERVICES } from '../../data/site.data';
import { SemFrame } from '../../shared/sem-frame';

const FEATURED = ['failure-analysis', 'corrosion', 'coatings'];

@Component({
  selector: 'app-home-specialties',
  imports: [RouterLink, SemFrame],
  template: `
    <section class="section specialties" aria-labelledby="specialties-title">
      <div class="container">
        <div class="head">
          <span class="eyebrow">Our specialty</span>
          <h2 id="specialties-title">Failure, corrosion &amp; coatings analysis</h2>
          <p class="lead">
            Whether it is a quality problem, a reliability problem, fractography, R&amp;D, or plain curiosity — we deliver
            the information that leads to answers.
          </p>
        </div>

        <div class="list">
          @for (s of featured; track s.slug) {
            <article>
              <app-sem-frame [image]="s.image" sizes="(min-width: 900px) 33vw, 100vw" />
              <div class="body">
                <h3>{{ s.title }}</h3>
                <p>{{ s.summary }}</p>
                <a [routerLink]="['/services', s.slug]" class="text-link"
                  >More information <span aria-hidden="true">→</span><span class="sr-only"> about {{ s.title }}</span></a
                >
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .specialties {
      background: var(--surface);
      border-block: 1px solid var(--line);
    }
    .head {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 44rem;
      margin-bottom: 3rem;
    }
    h2 {
      font-size: clamp(1.75rem, 3.5vw, 2.5rem);
    }
    .list {
      display: grid;
      gap: 2rem;
    }
    @media (min-width: 900px) {
      .list {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    article {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .body {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.625rem;
    }
    h3 {
      font-size: 1.25rem;
    }
    p {
      color: var(--muted);
    }
  `,
})
export class HomeSpecialties {
  protected readonly featured = SERVICES.filter((s) => FEATURED.includes(s.slug));
}
