import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuoteDialog } from '../../shared/quote-dialog';

@Component({
  selector: 'app-home-hero',
  imports: [RouterLink, QuoteDialog],
  template: `
    <section class="hero">
      <div class="container hero-grid">
        <div class="copy">
          <p class="motto hero-motto">Focus. See. Solve.</p>
          <h1>Small details.<br>Definitive <em>answers.</em></h1>
          <p>See beyond the surface. Expert electron microscopy and materials analysis that turn complex questions into clear, actionable insight.</p>
          <form class="quote-bar" (submit)="$event.preventDefault(); quote.open(analysis.value, material.value)"><label><span>What material or product do you have?</span><input #material type="text" name="material" maxlength="200" placeholder="Plastic sheet, metal powder, medical part, etc."></label><label><span>What analysis do you need?</span><input #analysis type="text" name="analysis" maxlength="200" placeholder="SEM/EDS, failure analysis, FT-IR, etc."></label><button class="btn btn-primary" type="submit">Get a quote <span>↗</span></button></form>
          <div class="actions"><a class="explore" routerLink="/services">Explore our capabilities <span>→</span></a></div>
        </div>
        <div class="visual">
          <img src="/images/hero-colorsem.jpg" alt="ColorSEM image with a real-time EDS element map, taken at Houston Electron Microscopy" fetchpriority="high">
          <span class="image-label"><i></i> A CLOSER LOOK CHANGES EVERYTHING</span>
          <div class="image-caption"><span>SEM / EDS<br><b>Clarity at the micron level.</b></span><a routerLink="/sem-edx" aria-label="Explore SEM and EDS analysis">↗</a></div>
          <span class="crosshair top">+</span><span class="crosshair bottom">+</span>
        </div>
      </div>
      <app-quote-dialog #quote />
      <div class="container hero-bottom"><span>PRECISION IN EVERY PARTICLE. CONFIDENCE IN EVERY DECISION.</span><a href="#capabilities">Discover what we do ↓</a></div>
    </section>
  `,
  styles: `
    .hero{background:#edf3f3;overflow:hidden}.hero-grid{display:grid;grid-template-columns:1.04fr 1fr;gap:4rem;padding-top:64px;padding-bottom:55px;align-items:center}.copy>.eyebrow{font-size:10px;letter-spacing:.12em}.copy>.hero-motto{max-width:none;margin-top:22px;font-size:clamp(30px,3vw,42px);line-height:1.1;background:linear-gradient(90deg,var(--primary),#14a9c9);-webkit-background-clip:text;background-clip:text;color:transparent}h1{font-size:clamp(48px,5.7vw,80px);line-height:1.06;letter-spacing:-.035em;margin:14px 0 25px;font-weight:500}h1 em{font-style:normal;color:var(--primary)}.copy>p{max-width:460px;color:var(--muted);font-size:17px;line-height:1.8}.quote-bar{display:grid;grid-template-columns:1fr 1fr;align-items:end;gap:12px;max-width:620px;margin-top:30px;background:#fff;border:1px solid var(--line);border-radius:4px;padding:14px;box-shadow:0 12px 30px #0f3c410d}.quote-bar label{display:grid;gap:6px;min-width:0}.quote-bar label span{font-size:11px;font-weight:600;color:var(--ink)}.quote-bar input{min-width:0;border:1px solid var(--line);border-radius:3px;font:inherit;font-size:14px;padding:10px 12px;background:#fff}.quote-bar input:focus-visible{outline:2px solid var(--primary);outline-offset:1px}.quote-bar .btn{gap:14px;white-space:nowrap;grid-column:1/-1;justify-self:start}@media(max-width:700px){.quote-bar{grid-template-columns:1fr}.quote-bar .btn{justify-self:stretch;justify-content:center}}.actions{display:flex;align-items:center;flex-wrap:wrap;gap:25px;margin-top:30px}.actions .btn{gap:30px}.explore{font-size:13px;font-weight:600;text-decoration:none}.explore span{margin-left:10px}.expert{display:flex;align-items:center;gap:13px;border-top:1px solid var(--line);margin-top:40px;padding-top:23px;font-size:12px;font-weight:600;max-width:440px}.expert small{display:block;font-size:11px;color:var(--muted);font-weight:400;margin-top:2px}.expert-icon{font-size:32px;color:var(--primary)}.visual{position:relative;height:490px;background:#152c2f;overflow:hidden;border-radius:3px}.visual>img{width:100%;height:100%;object-fit:cover}.visual:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.18),transparent 45%,rgba(0,20,18,.8));pointer-events:none}.image-label{position:absolute;z-index:1;top:25px;left:25px;color:white;font:9px var(--font-mono);letter-spacing:.09em;background:#163033cc;padding:9px 12px}.image-label i{display:inline-block;width:5px;height:5px;border-radius:50%;background:#a8d2d7;margin-right:7px}.image-caption{position:absolute;z-index:1;bottom:27px;left:28px;right:28px;display:flex;align-items:end;justify-content:space-between;color:white;font:10px var(--font-mono);letter-spacing:.1em}.image-caption b{font:500 22px var(--font-sans);letter-spacing:-.03em;display:block;margin-top:8px}.image-caption a{display:grid;place-items:center;width:42px;height:42px;border:1px solid #ffffff70;border-radius:50%;font-size:24px;text-decoration:none}.crosshair{position:absolute;z-index:1;color:#ffffffb0;font:25px monospace}.top{right:15px;top:12px}.bottom{left:12px;bottom:9px}.hero-bottom{border-top:1px solid var(--line);display:flex;justify-content:space-between;padding-block:18px;font:9px var(--font-mono);letter-spacing:.09em;color:var(--muted)}.hero-bottom a{text-decoration:none;color:var(--ink)}
    @media(max-width:850px){.hero-grid{grid-template-columns:1fr;gap:30px;padding-top:40px}.visual{height:400px}.hero-bottom>span{max-width:55%}h1{font-size:60px}}@media(max-width:450px){h1{font-size:49px}.visual{height:330px}.actions{gap:20px}.hero-bottom{font-size:8px;gap:15px}.image-label{font-size:8px}}
  `,
})
export class HomeHero {}
