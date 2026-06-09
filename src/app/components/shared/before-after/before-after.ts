import { Component, input, signal } from '@angular/core';

export interface BeforeAfterExample {
  title: string;
  before: string;
  after: string;
  note?: string;
  language?: 'typescript' | 'html' | 'scss';
}

@Component({
  selector: 'app-before-after',
  standalone: true,
  template: `
    <div class="ba-wrap">
      <button type="button" class="ba-toggle" (click)="open.update(v => !v)">
        <span>🔄</span>
        <span>Before / After</span>
        <span class="ba-count">{{ items().length }} examples</span>
        <span class="ba-chevron" [class.open]="open()">›</span>
      </button>
      @if (open()) {
        <div class="ba-body">
          @for (ex of items(); track ex.title) {
            <div class="ba-example">
              <h4 class="ba-title">{{ ex.title }}</h4>
              <div class="ba-split">
                <div class="ba-panel ba-panel--before">
                  <div class="ba-label">❌ Before</div>
                  <pre class="ba-code"><code>{{ ex.before }}</code></pre>
                </div>
                <div class="ba-panel ba-panel--after">
                  <div class="ba-label">✅ After (Angular 17+)</div>
                  <pre class="ba-code"><code>{{ ex.after }}</code></pre>
                </div>
              </div>
              @if (ex.note) {
                <p class="ba-note">💡 {{ ex.note }}</p>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .ba-wrap {
      border: 1px solid var(--border, #e5e7eb);
      border-radius: 12px; overflow: hidden; margin-bottom: 1.5rem;
    }
    .ba-toggle {
      width: 100%; display: flex; align-items: center; gap: .5rem;
      padding: .75rem 1rem; background: var(--surface2, #f0fdf4);
      border: none; cursor: pointer; font-size: .9rem; font-weight: 700;
      color: var(--text, #1a1a1a); text-align: left;
      border-bottom: 1px solid transparent;
      &:hover { filter: brightness(.97); }
    }
    .ba-count {
      margin-left: auto; font-size: .72rem; font-weight: 600; color: var(--text3, #6b7280);
      background: var(--surface, #fff); border: 1px solid var(--border, #e5e7eb);
      padding: 1px 8px; border-radius: 20px;
    }
    .ba-chevron {
      font-size: 1.1rem; transform: rotate(90deg); transition: transform .2s;
      &.open { transform: rotate(-90deg); }
    }
    .ba-body {
      padding: 1rem; display: flex; flex-direction: column; gap: 1.25rem;
      border-top: 1px solid var(--border, #e5e7eb);
      background: var(--surface, #fff);
    }
    .ba-example { display: flex; flex-direction: column; gap: .5rem; }
    .ba-title {
      margin: 0; font-size: .9rem; font-weight: 700; color: var(--text, #1a1a1a);
    }
    .ba-split {
      display: grid; grid-template-columns: 1fr 1fr; gap: .75rem;
      @media (max-width: 640px) { grid-template-columns: 1fr; }
    }
    .ba-panel {
      border-radius: 8px; overflow: hidden;
      &--before { border: 1px solid #fecaca; }
      &--after  { border: 1px solid #bbf7d0; }
    }
    .ba-label {
      padding: .3rem .75rem; font-size: .75rem; font-weight: 700;
      .ba-panel--before & { background: #fee2e2; color: #991b1b; }
      .ba-panel--after  & { background: #dcfce7; color: #166534; }
    }
    .ba-code {
      margin: 0; padding: .75rem;
      font-size: .78rem; font-family: 'Cascadia Code', 'Fira Code', monospace;
      line-height: 1.6; overflow-x: auto; white-space: pre;
      .ba-panel--before & { background: #fff7f7; color: #7f1d1d; }
      .ba-panel--after  & { background: #f0fdf4; color: #052e16; }
    }
    :host-context(body.dark) .ba-panel--before .ba-code { background: #2d0000; color: #fca5a5; }
    :host-context(body.dark) .ba-panel--after  .ba-code { background: #052e16; color: #86efac; }
    :host-context(body.dark) .ba-toggle { background: #1a2e1a; }
    .ba-note {
      font-size: .83rem; color: var(--text2, #374151); line-height: 1.5;
      padding: .5rem .75rem; background: #fffbeb;
      border-left: 3px solid #f59e0b; border-radius: 0 6px 6px 0; margin: 0;
    }
    :host-context(body.dark) .ba-note { background: #2d1f00; border-color: #d97706; }
  `],
})
export class BeforeAfterComponent {
  items = input.required<BeforeAfterExample[]>();
  open  = signal(false);
}
