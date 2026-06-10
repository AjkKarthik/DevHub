import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly KEY = 'ng-learn-done';
  private _done = signal<Set<string>>(new Set(this.load()));

  readonly done  = this._done.asReadonly();
  readonly count = computed(() => this._done().size);
  readonly total = 45;
  readonly pct   = computed(() => Math.round((this._done().size / this.total) * 100));

  // ── Per-section progress (C# keys are prefixed 'csharp-') ──────────────────
  readonly csharpTotal  = 33;
  readonly csharpCount  = computed(() => [...this._done()].filter(r => r.startsWith('csharp-')).length);
  readonly csharpPct    = computed(() => Math.round((this.csharpCount() / this.csharpTotal) * 100));
  readonly angularCount = computed(() => [...this._done()].filter(r => !r.startsWith('csharp-')).length);
  readonly angularPct   = computed(() => Math.round((this.angularCount() / this.total) * 100));

  toggle(route: string) {
    this._done.update(s => {
      const next = new Set(s);
      if (next.has(route)) next.delete(route); else next.add(route);
      try { localStorage.setItem(this.KEY, JSON.stringify([...next])); } catch { /* noop */ }
      return next;
    });
  }

  isDone(route: string) { return this._done().has(route); }

  private load(): string[] {
    try { return JSON.parse(localStorage.getItem(this.KEY) ?? '[]') as string[]; }
    catch { return []; }
  }
}
