import { Component, input } from '@angular/core';

export interface Misconception {
  thought: string;
  reality: string;
}

/**
 * "Common beginner misconceptions" for Phase 10 subtopic pages — distinct
 * from app-common-mistakes (which targets production/interview-level
 * mistakes on the parent topic page). This targets first-time confusion
 * specifically: what a newcomer assumes vs what's actually true.
 */
@Component({
  selector: 'app-misconceptions',
  standalone: true,
  template: `
    <div class="mc-wrap">
      <div class="mc-header">
        <span class="mc-icon">💭</span>
        <span class="mc-label">Common beginner misconceptions</span>
      </div>
      @for (m of items(); track m.thought) {
        <div class="mc-item">
          <div class="mc-thought"><span class="mc-tag mc-tag--think">You might think</span> <span [innerHTML]="m.thought"></span></div>
          <div class="mc-reality"><span class="mc-tag mc-tag--real">Actually</span> <span [innerHTML]="m.reality"></span></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .mc-wrap {
      border: 1px solid var(--border, #e5e7eb);
      border-radius: 12px;
      padding: 1rem 1.1rem;
      margin: 1.25rem 0;
      background: var(--surface, #fff);
    }
    .mc-header { display: flex; align-items: center; gap: .5rem; margin-bottom: .85rem; }
    .mc-icon { font-size: 1rem; }
    .mc-label { font-size: .82rem; font-weight: 700; color: var(--text, #1a1a1a); }
    .mc-item {
      display: flex; flex-direction: column; gap: .35rem;
      padding: .75rem 0;
      border-top: 1px solid var(--border, #f0f0f0);
      &:first-of-type { border-top: none; padding-top: 0; }
    }
    .mc-thought, .mc-reality { font-size: .87rem; line-height: 1.55; }
    .mc-thought { color: var(--text3, #6b7280); }
    .mc-reality { color: var(--text, #1a1a1a); }
    .mc-tag {
      display: inline-block;
      font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .03em;
      padding: .1rem .5rem; border-radius: 20px; margin-right: .4rem;
    }
    .mc-tag--think { background: #fee2e2; color: #991b1b; }
    .mc-tag--real  { background: #dcfce7; color: #166534; }

    :host-context(body.dark) {
      .mc-wrap { background: #1e293b; border-color: #334155; }
      .mc-item { border-color: #334155; }
      .mc-tag--think { background: #450a0a; color: #fca5a5; }
      .mc-tag--real  { background: #052e16; color: #86efac; }
    }
  `],
})
export class MisconceptionsComponent {
  items = input.required<Misconception[]>();
}
