import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <section class="section">
      <div class="container inner">
        <span class="eyebrow">Error 404 · No signal</span>
        <h1>Nothing at this magnification.</h1>
        <p class="lead">The page you are looking for has moved or never existed.</p>
        <div class="actions">
          <a routerLink="/" class="btn btn-primary">Back to home</a>
          <a routerLink="/services" class="btn btn-outline">View services</a>
        </div>
      </div>
    </section>
  `,
  styles: `
    .inner {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 1.25rem;
      min-height: 50vh;
      justify-content: center;
    }
    h1 {
      font-size: clamp(2rem, 5vw, 3.25rem);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  `,
})
export class NotFoundPage {}
