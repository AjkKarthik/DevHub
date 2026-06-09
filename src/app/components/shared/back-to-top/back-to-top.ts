import { Component, signal, HostListener } from '@angular/core';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  template: `
    @if (visible()) {
      <button type="button" class="btt" (click)="scrollTop()" aria-label="Back to top" title="Back to top">
        ↑
      </button>
    }
  `,
  styles: [`
    .btt {
      position: fixed; bottom: 1.5rem; right: 1.5rem;
      width: 40px; height: 40px; border-radius: 50%;
      background: #4f46e5; color: #fff; border: none;
      font-size: 1.1rem; font-weight: 700; cursor: pointer;
      box-shadow: 0 4px 12px rgba(79,70,229,.35);
      z-index: 150;
      transition: background .15s, scale .15s;
      &:hover { background: #4338ca; scale: 1.08; }
    }
  `],
})
export class BackToTopComponent {
  visible = signal(false);

  @HostListener('window:scroll')
  onScroll() { this.visible.set(window.scrollY > 300); }

  scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
}
