import { Component, input } from '@angular/core';

export interface VersionInfo {
  version: string;
  label?: string;
  features: string[];
}

@Component({
  selector: 'app-version-badge',
  standalone: true,
  template: `
    <div class="vb-wrap">
      @for (v of items(); track v.version) {
        <div class="vb-item">
          <div class="vb-header">
            <span class="vb-badge">🆕 New in Angular {{ v.version }}</span>
            @if (v.label) { <span class="vb-label">{{ v.label }}</span> }
          </div>
          <ul class="vb-list">
            @for (f of v.features; track f) {
              <li>{{ f }}</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
  styles: [`
    .vb-wrap { display: flex; flex-direction: column; gap: .6rem; margin-bottom: 1.5rem; }
    .vb-item {
      border: 1px solid #a5f3fc;
      background: #ecfeff;
      border-radius: 10px;
      padding: .7rem 1rem;
    }
    :host-context(body.dark) .vb-item {
      background: #0a2a2e; border-color: #164e63;
    }
    .vb-header { display: flex; align-items: center; gap: .6rem; margin-bottom: .4rem; }
    .vb-badge {
      font-size: .78rem; font-weight: 700;
      background: #0ea5e9; color: #fff;
      padding: 2px 10px; border-radius: 20px;
    }
    .vb-label { font-size: .8rem; color: #0369a1; font-weight: 500; }
    :host-context(body.dark) .vb-label { color: #7dd3fc; }
    .vb-list {
      margin: 0; padding-left: 1.25rem;
      display: flex; flex-direction: column; gap: .2rem;
      li { font-size: .84rem; color: #0c4a6e; line-height: 1.5; }
    }
    :host-context(body.dark) .vb-list li { color: #bae6fd; }
  `],
})
export class VersionBadgeComponent {
  items = input.required<VersionInfo[]>();
}
