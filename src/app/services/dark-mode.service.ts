import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class DarkModeService {
  private platform = inject(PLATFORM_ID);

  dark = signal(
    isPlatformBrowser(this.platform)
      ? localStorage.getItem('ng-dark') === '1'
      : false
  );

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platform)) return;
      const d = this.dark();
      document.body.classList.toggle('dark', d);
      try { localStorage.setItem('ng-dark', d ? '1' : '0'); } catch { /* noop */ }
    });
  }

  toggle() { this.dark.update(v => !v); }
}
