import { Component, model } from '@angular/core';

@Component({
  selector: 'app-model-counter',
  standalone: true,
  template: `
    <div class="mc-wrapper">
      <span class="mc-label">Child</span>
      <button class="mc-btn" (click)="decrement()">−</button>
      <span class="mc-val">{{ count() }}</span>
      <button class="mc-btn" (click)="increment()">+</button>
    </div>
  `,
  styles: [`
    .mc-wrapper { display:inline-flex; align-items:center; gap:.5rem; background:#eef2ff; padding:.6rem 1rem; border-radius:10px; border:2px solid #818cf8; }
    .mc-label { font-size:.72rem; font-weight:700; color:#6366f1; text-transform:uppercase; letter-spacing:.05em; }
    .mc-val { min-width:2.2rem; text-align:center; font-size:1.5rem; font-weight:800; color:#4338ca; }
    .mc-btn { width:30px; height:30px; border-radius:50%; border:2px solid #818cf8; background:#fff; color:#4338ca; font-size:1.1rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background .12s; &:hover { background:#e0e7ff; } }
  `],
})
export class ModelCounterComponent {
  count = model(0);
  increment() { this.count.update(v => v + 1); }
  decrement() { this.count.update(v => Math.max(0, v - 1)); }
}
