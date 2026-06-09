import { Component, input } from '@angular/core';

export interface QuickRefItem {
  name: string;
  type: 'function' | 'decorator' | 'directive' | 'pipe' | 'class' | 'interface' | 'token' | 'operator' | 'hook';
  desc: string;
  since?: string;
}

@Component({
  selector: 'app-quick-ref',
  standalone: true,
  template: `
    <div class="qr-wrap">
      <div class="qr-header">
        <span class="qr-icon">⚡</span>
        <span>Quick Reference</span>
        <span class="qr-count">{{ items().length }} APIs</span>
      </div>
      <div class="qr-grid">
        @for (item of items(); track item.name) {
          <div class="qr-item">
            <div class="qr-top">
              <code class="qr-name">{{ item.name }}</code>
              <span class="qr-badge qr-badge--{{ item.type }}">{{ item.type }}</span>
              @if (item.since) {
                <span class="qr-since">v{{ item.since }}+</span>
              }
            </div>
            <p class="qr-desc">{{ item.desc }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .qr-wrap {
      border: 1px solid var(--border, #e5e7eb);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 1.5rem;
    }
    .qr-header {
      display: flex; align-items: center; gap: .5rem;
      background: var(--surface2, #f8fafc);
      padding: .7rem 1rem;
      border-bottom: 1px solid var(--border, #e5e7eb);
      font-weight: 700; font-size: .88rem; color: var(--text, #1a1a1a);
    }
    .qr-icon { font-size: 1rem; }
    .qr-count {
      margin-left: auto;
      font-size: .72rem; font-weight: 600; color: var(--text3, #6b7280);
      background: var(--surface, #fff);
      border: 1px solid var(--border, #e5e7eb);
      padding: 1px 8px; border-radius: 20px;
    }
    .qr-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 0;
    }
    .qr-item {
      padding: .75rem 1rem;
      border-right: 1px solid var(--border, #f3f4f6);
      border-bottom: 1px solid var(--border, #f3f4f6);
      &:last-child { border-right: none; }
    }
    .qr-top {
      display: flex; align-items: center; gap: .4rem; flex-wrap: wrap; margin-bottom: .25rem;
    }
    .qr-name {
      font-family: 'Cascadia Code', 'Fira Code', monospace;
      font-size: .82rem; font-weight: 700;
      color: var(--accent, #4f46e5);
      background: none; padding: 0;
    }
    .qr-badge {
      font-size: .62rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .04em; padding: 1px 6px; border-radius: 4px; flex-shrink: 0;
      &--function  { background: #dbeafe; color: #1d4ed8; }
      &--decorator { background: #ede9fe; color: #5b21b6; }
      &--directive { background: #d1fae5; color: #065f46; }
      &--pipe      { background: #fce7f3; color: #be185d; }
      &--class     { background: #fef3c7; color: #92400e; }
      &--interface { background: #e0f2fe; color: #0369a1; }
      &--token     { background: #fee2e2; color: #991b1b; }
      &--operator  { background: #f3e8ff; color: #6d28d9; }
      &--hook      { background: #ecfdf5; color: #065f46; }
    }
    .qr-since {
      font-size: .63rem; font-weight: 700; color: #fff;
      background: #10b981; padding: 1px 5px; border-radius: 4px; margin-left: auto;
    }
    .qr-desc {
      font-size: .81rem; color: var(--text2, #4b5563);
      line-height: 1.5; margin: 0;
    }
  `],
})
export class QuickRefComponent {
  items = input.required<QuickRefItem[]>();
}
