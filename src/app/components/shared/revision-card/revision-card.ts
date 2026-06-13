import { Component, input } from '@angular/core';

export interface RevisionSummary {
  oneLiner: string;
  mustKnow: string[];
  interviewFocus: string[];
}

@Component({
  selector: 'app-revision-card',
  standalone: true,
  template: `
    <div class="rv-wrap">
      <div class="rv-header">
        <span class="rv-icon">⚡</span>
        <span class="rv-title">Quick Revision</span>
        <span class="rv-badge">interview prep</span>
      </div>
      <p class="rv-summary" [innerHTML]="summary().oneLiner"></p>
      <div class="rv-grid">
        <div class="rv-col">
          <h4 class="rv-col-head">Must know</h4>
          <ul class="rv-list">
            @for (item of summary().mustKnow; track item) {
              <li [innerHTML]="item"></li>
            }
          </ul>
        </div>
        <div class="rv-col">
          <h4 class="rv-col-head">Interview focus</h4>
          <ul class="rv-list rv-list--focus">
            @for (point of summary().interviewFocus; track point) {
              <li [innerHTML]="point"></li>
            }
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rv-wrap {
      border: 1px solid var(--border, #e5e7eb);
      border-left: 4px solid var(--accent, #4f46e5);
      border-radius: 10px;
      overflow: hidden;
      margin: 1.5rem 0;
      background: var(--surface, #fff);
    }
    .rv-header {
      display: flex; align-items: center; gap: .5rem;
      background: var(--surface2, #f8fafc);
      padding: .65rem 1rem;
      border-bottom: 1px solid var(--border, #e5e7eb);
    }
    .rv-icon { font-size: 1rem; }
    .rv-title {
      font-weight: 700; font-size: .88rem;
      color: var(--text, #1a1a1a);
    }
    .rv-badge {
      margin-left: auto;
      font-size: .65rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .04em;
      background: var(--accent, #4f46e5);
      color: #fff;
      padding: 2px 8px; border-radius: 20px;
    }
    .rv-summary {
      padding: .85rem 1rem .75rem;
      font-size: .9rem; font-weight: 500;
      color: var(--text, #1a1a1a);
      line-height: 1.6; margin: 0;
      border-bottom: 1px solid var(--border, #e5e7eb);
    }
    .rv-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    @media (max-width: 600px) {
      .rv-grid { grid-template-columns: 1fr; }
    }
    .rv-col {
      padding: .85rem 1rem;
      &:first-child { border-right: 1px solid var(--border, #e5e7eb); }
    }
    .rv-col-head {
      font-size: .72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .06em; color: var(--text3, #6b7280);
      margin: 0 0 .5rem;
    }
    .rv-list {
      margin: 0; padding: 0 0 0 1.1rem;
      li {
        font-size: .83rem; color: var(--text2, #4b5563);
        line-height: 1.55; margin-bottom: .35rem;
        &:last-child { margin-bottom: 0; }
      }
    }
    .rv-list--focus li::marker { color: var(--accent, #4f46e5); }

    :host-context(body.dark) {
      .rv-wrap {
        background: #1e2028;
        border-color: #374151;
        border-left-color: var(--accent, #818cf8);
      }
      .rv-header { background: #16181f; border-bottom-color: #374151; }
      .rv-title { color: #f3f4f6; }
      .rv-summary { color: #e5e7eb; border-bottom-color: #374151; }
      .rv-col:first-child { border-right-color: #374151; }
      .rv-col-head { color: #9ca3af; }
      .rv-list li { color: #d1d5db; }
    }
  `]
})
export class RevisionCardComponent {
  summary = input.required<RevisionSummary>();
}
