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
  readonly angularCount = computed(() => [...this._done()].filter(r => !r.startsWith('csharp-') && !r.startsWith('aspnet-') && !r.startsWith('sql-') && !r.startsWith('ts-') && !r.startsWith('react-') && !r.startsWith('js-') && !r.startsWith('html-') && !r.startsWith('css-') && !r.startsWith('perf-')).length);
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

  // ── JavaScript (keys prefixed 'js-') ───────────────────────────────────────
  readonly jsTotal  = 22;
  readonly jsCount  = computed(() => [...this._done()].filter(r => r.startsWith('js-')).length);
  readonly jsPct    = computed(() => Math.round((this.jsCount() / this.jsTotal) * 100));

  // ── HTML (keys prefixed 'html-') ───────────────────────────────────────────
  readonly htmlTotal  = 23;
  readonly htmlCount  = computed(() => [...this._done()].filter(r => r.startsWith('html-')).length);
  readonly htmlPct    = computed(() => Math.round((this.htmlCount() / this.htmlTotal) * 100));

  // ── CSS (keys prefixed 'css-') ────────────────────────────────────────────
  readonly cssTotal  = 22;
  readonly cssCount  = computed(() => [...this._done()].filter(r => r.startsWith('css-')).length);
  readonly cssPct    = computed(() => Math.round((this.cssCount() / this.cssTotal) * 100));

  // ── Web Performance (keys prefixed 'perf-') ───────────────────────────────
  readonly perfTotal  = 20;
  readonly perfCount  = computed(() => [...this._done()].filter(r => r.startsWith('perf-')).length);
  readonly perfPct    = computed(() => Math.round((this.perfCount() / this.perfTotal) * 100));

  // ── Blazor (keys prefixed 'blazor-') ─────────────────────────────────────
  readonly blazorTotal  = 20;
  readonly blazorCount  = computed(() => [...this._done()].filter(r => r.startsWith('blazor-')).length);
  readonly blazorPct    = computed(() => Math.round((this.blazorCount() / this.blazorTotal) * 100));

  // ── Node.js (keys prefixed 'node-') ──────────────────────────────────────
  readonly nodeTotal  = 23;
  readonly nodeCount  = computed(() => [...this._done()].filter(r => r.startsWith('node-')).length);
  readonly nodePct    = computed(() => Math.round((this.nodeCount() / this.nodeTotal) * 100));

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
