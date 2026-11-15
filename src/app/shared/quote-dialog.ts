import { Component, ElementRef, viewChild } from '@angular/core';
import { QuoteForm } from './quote-form';

/** The shared quote request form in a modal dialog, opened from the home page quote bar. */
@Component({
  selector: 'app-quote-dialog',
  imports: [QuoteForm],
  template: `
    <dialog #dialog class="quote-dialog" aria-labelledby="quote-dialog-title" (close)="form.clearSecret()">
      <button type="button" class="close" aria-label="Close" (click)="close()">×</button>
      <app-quote-form #form titleId="quote-dialog-title" (done)="close()" />
    </dialog>
  `,
  styles: `
    .quote-dialog { width: min(600px, calc(100vw - 32px)); max-height: calc(100vh - 32px); border: 0; border-radius: var(--radius, 4px); padding: 32px; color: var(--ink); background: var(--surface, #fff); box-shadow: 0 30px 80px rgba(0, 0, 0, .25); }
    .quote-dialog::backdrop { background: rgba(10, 25, 28, .55); }
    .close { position: absolute; top: 12px; right: 14px; border: 0; background: none; font-size: 26px; line-height: 1; cursor: pointer; color: var(--muted); }
    @media (max-width: 560px) { .quote-dialog { padding: 24px 18px; } }
  `,
})
export class QuoteDialog {
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly form = viewChild.required(QuoteForm);

  /** Opens the dialog with whatever the visitor typed in the quote bar as their analysis need. */
  open(analysis = '') {
    this.form().prefill({ analysis });
    this.dialog().nativeElement.showModal();
  }

  protected close() { this.dialog().nativeElement.close(); }
}
