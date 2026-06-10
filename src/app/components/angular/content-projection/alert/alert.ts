import { Component, input } from '@angular/core';

@Component({
  selector: 'app-cp-alert',
  template: `
    <div class="cp-alert" [attr.data-type]="type()">
      <span class="cp-alert-icon">{{ icons[type()] }}</span>
      <div class="cp-alert-content"><ng-content /></div>
    </div>
  `,
  styles: [`
    .cp-alert { display:flex; gap:.75rem; align-items:flex-start; padding:.85rem 1rem; border-radius:8px; border:1px solid; }
    .cp-alert[data-type="info"]    { background:#eff6ff; border-color:#93c5fd; color:#1e40af; }
    .cp-alert[data-type="success"] { background:#f0fdf4; border-color:#86efac; color:#166534; }
    .cp-alert[data-type="warning"] { background:#fffbeb; border-color:#fcd34d; color:#92400e; }
    .cp-alert[data-type="danger"]  { background:#fef2f2; border-color:#fca5a5; color:#991b1b; }
    .cp-alert-icon { font-size:1.1rem; flex-shrink:0; }
    .cp-alert-content { font-size:.9rem; }
  `],
})
export class AlertComponent {
  type = input<'info'|'success'|'warning'|'danger'>('info');
  icons: Record<string, string> = { info: 'ℹ️', success: '✅', warning: '⚠️', danger: '❌' };
}
