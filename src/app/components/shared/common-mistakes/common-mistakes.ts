import { Component, input, signal } from '@angular/core';

export interface CommonMistake {
  title: string;
  wrong: string;
  right: string;
  explanation: string;
}

@Component({
  selector: 'app-common-mistakes',
  standalone: true,
  template: `
    <div class="cm-wrap">
      <button type="button" class="cm-toggle" (click)="open.update(v => !v)">
        <span>⚠️</span>
        <span>Common Mistakes</span>
        <span class="cm-count">{{ items().length }}</span>
        <span class="cm-chevron" [class.open]="open()">›</span>
      </button>
      @if (open()) {
        <div class="cm-body">
          @for (m of items(); track m.title; let i = $index) {
            <div class="cm-item">
              <div class="cm-item-header">
                <span class="cm-num">{{ i + 1 }}</span>
                <span class="cm-title">{{ m.title }}</span>
              </div>
              <div class="cm-split">
                <div class="cm-panel cm-panel--wrong">
                  <div class="cm-label">❌ Wrong</div>
                  <pre class="cm-code"><code>{{ m.wrong }}</code></pre>
                </div>
                <div class="cm-panel cm-panel--right">
                  <div class="cm-label">✅ Right</div>
                  <pre class="cm-code"><code>{{ m.right }}</code></pre>
                </div>
              </div>
              <p class="cm-explanation">{{ m.explanation }}</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .cm-wrap {
      border: 1px solid var(--border, #e5e7eb);
      border-radius: 12px; overflow: hidden; margin-bottom: 1.5rem;
    }
    .cm-toggle {
      width: 100%; display: flex; align-items: center; gap: .5rem;
      padding: .75rem 1rem; background: #fff7ed;
      border: none; cursor: pointer; font-size: .9rem; font-weight: 700;
      color: #92400e; text-align: left;
      &:hover { filter: brightness(.97); }
    }
    :host-context(body.dark) .cm-toggle { background: #2d1f00; color: #fcd34d; }
    .cm-count {
      background: #f59e0b; color: #fff;
      font-size: .72rem; font-weight: 700; padding: 1px 8px;
      border-radius: 20px; margin-left: auto;
    }
    .cm-chevron {
      font-size: 1.1rem; transform: rotate(90deg); transition: transform .2s;
      &.open { transform: rotate(-90deg); }
    }
    .cm-body {
      padding: 1rem; display: flex; flex-direction: column; gap: 1.25rem;
      border-top: 1px solid var(--border, #e5e7eb);
      background: var(--surface, #fff);
    }
    .cm-item { display: flex; flex-direction: column; gap: .5rem; }
    .cm-item-header { display: flex; align-items: center; gap: .5rem; }
    .cm-num {
      width: 22px; height: 22px; border-radius: 50%; background: #f59e0b;
      color: #fff; font-size: .75rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .cm-title { font-size: .9rem; font-weight: 700; color: var(--text, #1a1a1a); }
    .cm-split {
      display: grid; grid-template-columns: 1fr 1fr; gap: .75rem;
      @media (max-width: 640px) { grid-template-columns: 1fr; }
    }
    .cm-panel {
      border-radius: 8px; overflow: hidden;
      &--wrong { border: 1px solid #fecaca; }
      &--right  { border: 1px solid #bbf7d0; }
    }
    .cm-label {
      padding: .3rem .75rem; font-size: .75rem; font-weight: 700;
      .cm-panel--wrong & { background: #fee2e2; color: #991b1b; }
      .cm-panel--right & { background: #dcfce7; color: #166534; }
    }
    .cm-code {
      margin: 0; padding: .75rem;
      font-size: .78rem; font-family: 'Cascadia Code', 'Fira Code', monospace;
      line-height: 1.6; overflow-x: auto; white-space: pre;
      .cm-panel--wrong & { background: #fff7f7; color: #7f1d1d; }
      .cm-panel--right & { background: #f0fdf4; color: #052e16; }
    }
    :host-context(body.dark) .cm-panel--wrong .cm-code { background: #2d0000; color: #fca5a5; }
    :host-context(body.dark) .cm-panel--right .cm-code { background: #052e16; color: #86efac; }
    .cm-explanation {
      font-size: .84rem; color: var(--text2, #4b5563); line-height: 1.55;
      padding: .5rem .75rem;
      background: var(--surface2, #f9fafb);
      border-radius: 6px; margin: 0;
    }
  `],
})
export class CommonMistakesComponent {
  items = input.required<CommonMistake[]>();
  open  = signal(false);
}
