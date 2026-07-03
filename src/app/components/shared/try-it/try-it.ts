import { Component, input, signal } from '@angular/core';

export interface TryItExercise {
  prompt: string;
  hint?: string;
  solution: string;
}

/**
 * "Try it yourself" micro-exercise for Phase 10 subtopic pages — a small,
 * single-concept task with a hidden/reveal-on-click solution. Distinct from
 * app-challenge-block (which stays on the parent topic page): this is
 * deliberately smaller and faster, not a full production-style challenge.
 */
@Component({
  selector: 'app-try-it',
  standalone: true,
  template: `
    <div class="ti-wrap">
      <div class="ti-header">
        <span class="ti-icon">✏️</span>
        <span class="ti-label">Try it yourself</span>
      </div>
      <p class="ti-prompt" [innerHTML]="exercise().prompt"></p>
      @if (exercise().hint) {
        <p class="ti-hint"><strong>Hint:</strong> <span [innerHTML]="exercise().hint"></span></p>
      }
      @if (!revealed()) {
        <button type="button" class="ti-reveal" (click)="revealed.set(true)">
          Show solution
        </button>
      } @else {
        <pre class="ti-solution"><code>{{ exercise().solution }}</code></pre>
        <button type="button" class="ti-hide" (click)="revealed.set(false)">
          ▴ Hide solution
        </button>
      }
    </div>
  `,
  styles: [`
    .ti-wrap {
      border: 1px solid var(--border, #e5e7eb);
      border-left: 3px solid #4f46e5;
      border-radius: 8px;
      padding: 1rem 1.1rem;
      margin: 1.25rem 0;
      background: var(--surface, #fff);
    }
    .ti-header {
      display: flex; align-items: center; gap: .5rem;
      margin-bottom: .5rem;
    }
    .ti-icon { font-size: 1rem; }
    .ti-label { font-size: .82rem; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: .04em; }
    .ti-prompt { font-size: .92rem; color: var(--text, #1a1a1a); line-height: 1.55; margin: 0 0 .5rem; }
    .ti-hint { font-size: .84rem; color: var(--text3, #6b7280); margin: 0 0 .75rem; line-height: 1.5; }
    .ti-reveal, .ti-hide {
      padding: .4rem .9rem;
      border-radius: 6px;
      font-size: .8rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid #4f46e5;
      background: transparent;
      color: #4f46e5;
      transition: background .15s, color .15s;
      &:hover { background: #4f46e5; color: #fff; }
    }
    .ti-hide {
      border-color: var(--border, #e5e7eb);
      color: var(--text3, #6b7280);
      &:hover { background: var(--surface2, #f3f4f6); color: var(--text, #1a1a1a); }
    }
    .ti-solution {
      margin: 0 0 .75rem;
      padding: .75rem;
      border-radius: 8px;
      background: var(--surface2, #f9fafb);
      font-size: .8rem;
      font-family: 'Cascadia Code', 'Fira Code', monospace;
      line-height: 1.6;
      overflow-x: auto;
      white-space: pre;
      color: var(--text2, #1f2937);
    }

    :host-context(body.dark) {
      .ti-wrap { background: #1e293b; border-color: #334155; }
      .ti-solution { background: #0f172a; color: #e2e8f0; }
      .ti-hide { border-color: #334155; color: #94a3b8; &:hover { background: #334155; color: #e2e8f0; } }
    }
  `],
})
export class TryItComponent {
  exercise = input.required<TryItExercise>();
  revealed = signal(false);
}
