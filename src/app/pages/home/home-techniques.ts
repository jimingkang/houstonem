import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-techniques',
  imports: [RouterLink],
  template: `
    <section class="section" aria-labelledby="techniques-title">
      <div class="container">
        <div class="head">
          <span class="eyebrow">Two complementary techniques</span>
          <h2 id="techniques-title">Inorganic answers from SEM/EDS. Organic answers from micro FT-IR.</h2>
        </div>

        <div class="cols">
          <article>
            <span class="tag mono">SEM / EDS</span>
            <h3>Scanning Electron Microscopy &amp; Energy Dispersive Spectrometry</h3>
            <div class="prose">
              <p>
                The <strong>Scanning Electron Microscope</strong> observes microscopic features in any solid material at
                extremely high magnifications — particles and features in the nanometer range can be observed and
                photographed. The integrated <strong>Energy Dispersive Spectrometer</strong> analyzes the elemental
                composition of any feature in real time.
              </p>
              <p>
                Liquid samples can be filtered, dried and analyzed. Results are reported as elemental spectrums,
                quantitative atomic and weight percent, and x-ray maps overlaid onto the SEM image.
              </p>
            </div>
            <aside class="callout">
              Our SEM/EDS laboratory features the first ColorSEM with ChemiSEM Technology — real-time elemental
              mapping for failure analysis, coatings, inclusions and voids, particles and more.
            </aside>
            <a routerLink="/sem-edx" class="text-link">About our SEM/EDX system <span aria-hidden="true">→</span></a>
          </article>

          <article>
            <span class="tag mono">Micro FT-IR</span>
            <h3>Fourier Transform Infrared Spectroscopy</h3>
            <div class="prose">
              <p>
                Occasionally, SEM/EDS analysis returns a carbon signal without much more information. That is why we
                acquired a <strong>micro FT-IR system</strong> — to discover the chemical distribution of materials in
                heterogeneous samples.
              </p>
              <p>
                FT-IR determines the sample&apos;s chemical composition and structure when the material is carbon
                based. Together with ChemiSEM, it lets us analyze a wide range of chemicals, materials, and organic and
                inorganic compounds.
              </p>
            </div>
            <a routerLink="/micro-ftir" class="text-link">About micro FT-IR <span aria-hidden="true">→</span></a>
          </article>
        </div>
      </div>
    </section>
  `,
  styles: `
    .head {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 48rem;
      margin-bottom: 3rem;
    }
    h2 {
      font-size: clamp(1.75rem, 3.5vw, 2.5rem);
    }
    .cols {
      display: grid;
      gap: 1.5rem;
    }
    @media (min-width: 900px) {
      .cols {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    article {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 1.25rem;
      padding: 2rem;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius);
    }
    .tag {
      padding: 0.25rem 0.5rem;
      font-size: 0.6875rem;
      letter-spacing: 0.06em;
      background: var(--ink);
      color: var(--on-ink);
      border-radius: 2px;
    }
    h3 {
      font-size: 1.375rem;
    }
    .callout {
      padding: 1rem 1.125rem;
      background: var(--primary-soft);
      border-radius: var(--radius);
      font-weight: 500;
      font-size: 0.9375rem;
    }
    .text-link {
      margin-top: auto;
    }
  `,
})
export class HomeTechniques {}
