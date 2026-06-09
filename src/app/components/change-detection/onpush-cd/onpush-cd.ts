import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-onpush-cd',
  template: `
    <div class="cd-box onpush">
      <span class="cd-label">OnPush CD</span>
      <p>obj.value: <strong>{{ obj.value }}</strong></p>
      <p>Render count: <strong class="render-count">{{ renderCount }}</strong></p>
    </div>
  `,
  styles: [`
    .cd-box { padding:1rem; border-radius:8px; border:2px solid; }
    .onpush { border-color:#22c55e; background:#f0fdf4; }
    .cd-label { font-size:.72rem; font-weight:700; text-transform:uppercase; color:#166534; display:block; margin-bottom:.5rem; }
    .render-count { color:#16a34a; font-size:1.2rem; }
    p { margin:.25rem 0; font-size:.9rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnpushCdComponent {
  @Input() obj = { value: 0 };
  renderCount = 0;
  ngDoCheck() { this.renderCount++; }
}
