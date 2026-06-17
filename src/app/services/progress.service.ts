import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly KEY = 'ng-learn-done';
  private _done = signal<Set<string>>(new Set(this.load()));

  readonly done  = this._done.asReadonly();
  readonly count = computed(() => this._done().size);
  readonly total = 58;
  readonly pct   = computed(() => Math.round((this._done().size / this.total) * 100));

  // ── Per-section progress (C# keys are prefixed 'csharp-') ──────────────────
  readonly csharpTotal  = 50;
  readonly csharpCount  = computed(() => [...this._done()].filter(r => r.startsWith('csharp-')).length);
  readonly csharpPct    = computed(() => Math.round((this.csharpCount() / this.csharpTotal) * 100));
  readonly angularCount = computed(() => [...this._done()].filter(r => !r.startsWith('csharp-') && !r.startsWith('aspnet-') && !r.startsWith('sql-') && !r.startsWith('ts-')).length);
  readonly angularPct   = computed(() => Math.round((this.angularCount() / this.total) * 100));

  // ── ASP.NET Core (keys prefixed 'aspnet-') ─────────────────────────────────
  readonly aspnetTotal  = 45;
  readonly aspnetCount  = computed(() => [...this._done()].filter(r => r.startsWith('aspnet-')).length);
  readonly aspnetPct    = computed(() => Math.round((this.aspnetCount() / this.aspnetTotal) * 100));

  // ── SQL (keys prefixed 'sql-') ─────────────────────────────────────────────
  readonly sqlTotal  = 44;
  readonly sqlCount  = computed(() => [...this._done()].filter(r => r.startsWith('sql-')).length);
  readonly sqlPct    = computed(() => Math.round((this.sqlCount() / this.sqlTotal) * 100));

  // ── TypeScript (keys prefixed 'ts-') ───────────────────────────────────────
  readonly tsTotal  = 20;
  readonly tsCount  = computed(() => [...this._done()].filter(r => r.startsWith('ts-')).length);
  readonly tsPct    = computed(() => Math.round((this.tsCount() / this.tsTotal) * 100));

  // ── React (keys prefixed 'react-') ─────────────────────────────────────────
  readonly reactTotal  = 17;
  readonly reactCount  = computed(() => [...this._done()].filter(r => r.startsWith('react-')).length);
  readonly reactPct    = computed(() => Math.round((this.reactCount() / this.reactTotal) * 100));

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
