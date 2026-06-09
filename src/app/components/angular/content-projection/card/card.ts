import { Component } from '@angular/core';

@Component({
  selector: 'app-cp-card',
  template: `
    <div class="cp-card">
      <div class="cp-card-header"><ng-content select="[card-header]" /></div>
      <div class="cp-card-body"><ng-content select="[card-body]" /></div>
      <div class="cp-card-footer"><ng-content select="[card-footer]" /></div>
    </div>
  `,
  styles: [`
    .cp-card { border:1px solid #e0e0e0; border-radius:12px; overflow:hidden; background:#fff; }
    .cp-card-header { padding:.75rem 1rem; background:#6366f1; color:#fff; font-weight:600; }
    .cp-card-body { padding:1rem; }
    .cp-card-footer { padding:.6rem 1rem; background:#f9f9f9; border-top:1px solid #eee; display:flex; gap:.5rem; justify-content:flex-end; }
  `],
})
export class CardComponent {}
