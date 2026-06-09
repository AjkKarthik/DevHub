import { Component, input, signal } from '@angular/core';

export interface TheoryPoint {
  heading: string;
  points: string[];
}

@Component({
  selector: 'app-theory-block',
  standalone: true,
  template: `
    <div class="theory-wrap">
      <button type="button" class="theory-toggle" (click)="visible.set(!visible())">
        <span class="icon">📖</span>
        <span>Theory &amp; Key Points</span>
        <span class="chevron" [class.open]="visible()">›</span>
      </button>
      @if (visible()) {
        <div class="theory-body">
          @for (section of sections(); track section.heading) {
            <div class="theory-section">
              <h4>{{ section.heading }}</h4>
              <ul>
                @for (p of section.points; track p) {
                  <li [innerHTML]="p"></li>
                }
              </ul>
            </div>
          }
        </div>
      }
    </div>`,
  styles: [`
    .theory-wrap {
      margin-bottom: 1.5rem;
      border: 1px solid var(--border, #e0e0e0);
      border-radius: 10px;
      overflow: hidden;
    }

    .theory-toggle {
      width: 100%; display: flex; align-items: center; gap: .5rem;
      padding: .75rem 1rem;
      background: var(--surface2, #f9f9f9);
      border: none; cursor: pointer;
      font-size: .9rem; font-weight: 600;
      color: var(--text2, #374151);
      text-align: left;
      transition: background .15s;
      .icon { font-size: 1rem; }
      .chevron { margin-left: auto; font-size: 1.1rem; display: inline-block; transform: rotate(90deg); transition: transform .2s; }
      .chevron.open { transform: rotate(-90deg); }
      &:hover { background: var(--surface2, #f0f4ff); }
    }

    .theory-body {
      padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 1.1rem;
      border-top: 1px solid var(--border, #e0e0e0);
      background: var(--surface, #fff);
    }

    .theory-section {
      h4 { margin: 0 0 .45rem; font-size: .88rem; font-weight: 700; color: #4f46e5; }
      ul { margin: 0; padding-left: 1.3rem; display: flex; flex-direction: column; gap: .3rem; }
      li { font-size: .85rem; color: var(--text2, #444); line-height: 1.55; }
    }

    :host ::ng-deep li code {
      background: var(--surface2, #f3f4f6);
      color: var(--text, #1a1a1a);
      padding: 0 .3rem; border-radius: 4px;
      font-size: .82rem; font-family: monospace;
    }
  `],
})
export class TheoryBlockComponent {
  sections = input.required<TheoryPoint[]>();
  visible  = signal(false);
}
