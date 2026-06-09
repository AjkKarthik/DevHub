import { Component, input, signal } from '@angular/core';

export interface QnaItem {
  q: string;
  a: string;
}

@Component({
  selector: 'app-qna-block',
  standalone: true,
  template: `
    <div class="qna-wrap">
      <button type="button" class="qna-toggle" (click)="visible.set(!visible())">
        <span class="icon">❓</span>
        <span>Interview Q&amp;A</span>
        <span class="badge-count">{{ items().length }} questions</span>
        <span class="chevron" [class.open]="visible()">›</span>
      </button>
      @if (visible()) {
        <div class="qna-body">
          @for (item of items(); track item.q; let i = $index) {
            <div class="qna-item" [class.open]="openIndex() === i">
              <button type="button" class="q-row" (click)="toggle(i)">
                <span class="q-num">Q{{ i + 1 }}</span>
                <span class="q-text">{{ item.q }}</span>
                <span class="q-chevron">{{ openIndex() === i ? '▲' : '▼' }}</span>
              </button>
              @if (openIndex() === i) {
                <div class="a-row" [innerHTML]="item.a"></div>
              }
            </div>
          }
        </div>
      }
    </div>`,
  styles: [`
    .qna-wrap {
      margin-bottom: 1.5rem;
      border: 1px solid var(--border, #e0e0e0);
      border-radius: 10px;
      overflow: hidden;
    }

    .qna-toggle {
      width: 100%; display: flex; align-items: center; gap: .5rem;
      padding: .75rem 1rem;
      background: var(--surface2, #f9f9f9);
      border: none; cursor: pointer;
      font-size: .9rem; font-weight: 600;
      color: var(--text2, #374151);
      text-align: left;
      transition: background .15s;
      .icon { font-size: 1rem; }
      .badge-count {
        margin-left: .25rem; background: #6366f1; color: #fff;
        padding: 1px 7px; border-radius: 999px; font-size: .72rem; font-weight: 700;
      }
      .chevron { margin-left: auto; font-size: 1.1rem; display: inline-block; transform: rotate(90deg); transition: transform .2s; }
      .chevron.open { transform: rotate(-90deg); }
      &:hover { background: var(--surface2, #f0f4ff); }
    }

    .qna-body {
      border-top: 1px solid var(--border, #e0e0e0);
      background: var(--surface, #fff);
    }

    .qna-item {
      border-bottom: 1px solid var(--border, #f3f4f6);
      &:last-child { border-bottom: none; }
      &.open { background: var(--surface2, #fafafa); }
    }

    .q-row {
      width: 100%; display: flex; align-items: flex-start; gap: .6rem;
      padding: .75rem 1rem; background: none; border: none; cursor: pointer;
      text-align: left; transition: background .15s;
      .q-num {
        min-width: 2rem; font-size: .72rem; font-weight: 800; color: #6366f1;
        background: #ede9fe; padding: 2px 6px; border-radius: 4px; margin-top: 1px;
      }
      .q-text { flex: 1; font-size: .88rem; font-weight: 600; color: var(--text, #1f2937); line-height: 1.4; }
      .q-chevron { font-size: .75rem; color: var(--text3, #9ca3af); margin-top: 2px; }
      &:hover { background: var(--surface2, #f5f3ff); }
    }

    .a-row {
      padding: .6rem 1rem .75rem 3.6rem;
      font-size: .85rem; color: var(--text2, #4b5563); line-height: 1.65;
    }

    :host ::ng-deep .a-row code {
      background: var(--surface2, #f3f4f6);
      color: var(--text, #1a1a1a);
      padding: 0 .3rem; border-radius: 4px;
      font-size: .82rem; font-family: monospace;
    }
    :host ::ng-deep .a-row strong { color: var(--text, #111827); }
  `],
})
export class QnaBlockComponent {
  items     = input.required<QnaItem[]>();
  visible   = signal(false);
  openIndex = signal<number | null>(null);

  toggle(i: number) {
    this.openIndex.update(cur => cur === i ? null : i);
  }
}
