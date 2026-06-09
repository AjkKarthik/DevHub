import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-back-button',
  standalone: true,
  template: `
    <button class="back-btn" (click)="back()" type="button">
      ← Back
    </button>`,
  styles: [`
    .back-btn {
      display: inline-flex; align-items: center; gap: .3rem;
      padding: .35rem .85rem;
      background: #fff;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: .85rem;
      color: #374151;
      cursor: pointer;
      margin-bottom: .75rem;
      transition: background .15s, border-color .15s;
    }
    .back-btn:hover { background: #f9fafb; border-color: #9ca3af; }
  `],
})
export class BackButtonComponent {
  private location = inject(Location);
  back() { this.location.back(); }
}
