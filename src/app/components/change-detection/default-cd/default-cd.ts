import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-default-cd',
  template: `
    <div class="cd-box default">
      <span class="cd-label">Default CD</span>
      <p>obj.value: <strong>{{ obj.value }}</strong></p>
      <p>Render count: <strong class="render-count">{{ renderCount }}</strong></p>
    </div>
  `,
  styles: [`
    .cd-box { padding:1rem; border-radius:8px; border:2px solid; }
    .default { border-color:#f59e0b; background:#fffbeb; }
    .cd-label { font-size:.72rem; font-weight:700; text-transform:uppercase; color:#92400e; display:block; margin-bottom:.5rem; }
    .render-count { color:#dc2626; font-size:1.2rem; }
    p { margin:.25rem 0; font-size:.9rem; }
  `],
})
export class DefaultCdComponent {
  @Input() obj = { value: 0 };
  renderCount = 0;
  ngDoCheck() { this.renderCount++; }
}
