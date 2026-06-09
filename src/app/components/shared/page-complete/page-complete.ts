import { Component, input, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProgressService } from '../../../services/progress.service';

@Component({
  selector: 'app-page-complete',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="pc-wrap">
      <div class="pc-left">
        <button type="button" class="pc-btn" [class.done]="isDone()" (click)="toggle()">
          @if (isDone()) {
            <span class="pc-check">✓</span> Completed
          } @else {
            <span class="pc-circle"></span> Mark as Complete
          }
        </button>
        @if (isDone()) {
          <p class="pc-msg">Great work! Keep going 🚀</p>
        }
      </div>
      @if (nextRoute()) {
        <a class="pc-next" [routerLink]="nextRoute()">
          Next: <strong>{{ nextLabel() || 'Next Page' }}</strong> →
        </a>
      }
    </div>
  `,
  styles: [`
    .pc-wrap {
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
      margin: 2rem 0 1rem;
      padding: 1.1rem 1.25rem;
      border: 2px solid var(--border, #e5e7eb);
      border-radius: 12px;
      background: var(--surface2, #f9fafb);
    }
    .pc-left { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
    .pc-btn {
      display: flex; align-items: center; gap: .5rem;
      padding: .55rem 1.25rem;
      border: 2px solid var(--border, #d1d5db);
      border-radius: 8px;
      background: var(--surface, #fff);
      font-size: .9rem; font-weight: 700;
      color: var(--text2, #374151);
      cursor: pointer;
      transition: all .15s;

      &:hover { border-color: #4f46e5; color: #4f46e5; }

      &.done {
        background: #4f46e5; color: #fff; border-color: #4f46e5;
        .pc-check { font-weight: 900; }
        &:hover { background: #4338ca; border-color: #4338ca; }
      }
    }
    .pc-circle {
      width: 16px; height: 16px; border-radius: 50%;
      border: 2px solid currentColor; display: inline-block; flex-shrink: 0;
    }
    .pc-msg { margin: 0; font-size: .84rem; color: #4f46e5; font-weight: 600; }
    .pc-next {
      display: flex; align-items: center; gap: .3rem;
      padding: .55rem 1.25rem;
      background: var(--accent, #4f46e5); color: #fff;
      border-radius: 8px; text-decoration: none;
      font-size: .9rem; font-weight: 600;
      transition: background .15s;
      &:hover { background: var(--accent-h, #4338ca); }
    }
  `],
})
export class PageCompleteComponent {
  route     = input.required<string>();
  nextRoute = input<string>('');
  nextLabel = input<string>('');

  private progress = inject(ProgressService);
  isDone = computed(() => this.progress.isDone(this.route()));

  toggle() { this.progress.toggle(this.route()); }
}
