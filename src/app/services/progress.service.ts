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
  readonly angularCount = computed(() => [...this._done()].filter(r => !r.startsWith('csharp-') && !r.startsWith('aspnet-') && !r.startsWith('sql-') && !r.startsWith('ts-') && !r.startsWith('react-') && !r.startsWith('js-') && !r.startsWith('html-') && !r.startsWith('css-') && !r.startsWith('perf-') && !r.startsWith('linux-')).length);
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

  // ── Python (keys prefixed 'py-') ─────────────────────────────────────────
  readonly pyTotal  = 21;
  readonly pyCount  = computed(() => [...this._done()].filter(r => r.startsWith('py-')).length);
  readonly pyPct    = computed(() => Math.round((this.pyCount() / this.pyTotal) * 100));

  // ── Go (keys prefixed 'go-') ─────────────────────────────────────────────
  readonly goTotal  = 21;
  readonly goCount  = computed(() => [...this._done()].filter(r => r.startsWith('go-')).length);
  readonly goPct    = computed(() => Math.round((this.goCount() / this.goTotal) * 100));

  // ── DevOps (keys prefixed 'devops-') ─────────────────────────────────────
  readonly devopsTotal  = 21;
  readonly devopsCount  = computed(() => [...this._done()].filter(r => r.startsWith('devops-')).length);
  readonly devopsPct    = computed(() => Math.round((this.devopsCount() / this.devopsTotal) * 100));

  // ── Containers/K8s (keys prefixed 'k8s-') ────────────────────────────────
  readonly k8sTotal  = 22;
  readonly k8sCount  = computed(() => [...this._done()].filter(r => r.startsWith('k8s-')).length);
  readonly k8sPct    = computed(() => Math.round((this.k8sCount() / this.k8sTotal) * 100));

  // ── AWS (keys prefixed 'aws-') ───────────────────────────────────────────
  readonly awsTotal  = 21;
  readonly awsCount  = computed(() => [...this._done()].filter(r => r.startsWith('aws-')).length);
  readonly awsPct    = computed(() => Math.round((this.awsCount() / this.awsTotal) * 100));

  // ── Azure (keys prefixed 'azure-') ──────────────────────────────────────
  readonly azureTotal  = 22;
  readonly azureCount  = computed(() => [...this._done()].filter(r => r.startsWith('azure-')).length);
  readonly azurePct    = computed(() => Math.round((this.azureCount() / this.azureTotal) * 100));

  // ── Linux (keys prefixed 'linux-') ──────────────────────────────────────
  readonly linuxTotal  = 19;
  readonly linuxCount  = computed(() => [...this._done()].filter(r => r.startsWith('linux-')).length);
  readonly linuxPct    = computed(() => Math.round((this.linuxCount() / this.linuxTotal) * 100));

  // ── Observability (keys prefixed 'obs-') ─────────────────────────────────
  readonly obsTotal  = 20;
  readonly obsCount  = computed(() => [...this._done()].filter(r => r.startsWith('obs-')).length);
  readonly obsPct    = computed(() => Math.round((this.obsCount() / this.obsTotal) * 100));

  // ── MongoDB (keys prefixed 'mongo-') ─────────────────────────────────────
  readonly mongoTotal  = 21;
  readonly mongoCount  = computed(() => [...this._done()].filter(r => r.startsWith('mongo-')).length);
  readonly mongoPct    = computed(() => Math.round((this.mongoCount() / this.mongoTotal) * 100));

  // ── Redis (keys prefixed 'redis-') ───────────────────────────────────────
  readonly redisTotal  = 21;
  readonly redisCount  = computed(() => [...this._done()].filter(r => r.startsWith('redis-')).length);
  readonly redisPct    = computed(() => Math.round((this.redisCount() / this.redisTotal) * 100));

  // ── GraphQL (keys prefixed 'gql-') ───────────────────────────────────────
  readonly gqlTotal  = 20;
  readonly gqlCount  = computed(() => [...this._done()].filter(r => r.startsWith('gql-')).length);
  readonly gqlPct    = computed(() => Math.round((this.gqlCount() / this.gqlTotal) * 100));

  // ── Messaging/Kafka (keys prefixed 'kafka-') ─────────────────────────────
  readonly kafkaTotal  = 20;
  readonly kafkaCount  = computed(() => [...this._done()].filter(r => r.startsWith('kafka-')).length);
  readonly kafkaPct    = computed(() => Math.round((this.kafkaCount() / this.kafkaTotal) * 100));

  // ── Testing (keys prefixed 'test-') ──────────────────────────────────────
  readonly testTotal   = 19;
  readonly testCount   = computed(() => [...this._done()].filter(r => r.startsWith('test-')).length);
  readonly testPct     = computed(() => Math.round((this.testCount() / this.testTotal) * 100));

  // ── Terraform (keys prefixed 'tf-') ──────────────────────────────────────
  readonly tfTotal  = 21;
  readonly tfCount  = computed(() => [...this._done()].filter(r => r.startsWith('tf-')).length);
  readonly tfPct    = computed(() => Math.round((this.tfCount() / this.tfTotal) * 100));

  // ── Service Mesh (keys prefixed 'mesh-') ─────────────────────────────────
  readonly meshTotal  = 19;
  readonly meshCount  = computed(() => [...this._done()].filter(r => r.startsWith('mesh-')).length);
  readonly meshPct    = computed(() => Math.round((this.meshCount() / this.meshTotal) * 100));

  // ── System Design (keys prefixed 'sysdesign-') ───────────────────────────
  readonly sysdesignTotal  = 24;
  readonly sysdesignCount  = computed(() => [...this._done()].filter(r => r.startsWith('sysdesign-')).length);
  readonly sysdesignPct    = computed(() => Math.round((this.sysdesignCount() / this.sysdesignTotal) * 100));

  // ── Architecture Patterns (keys prefixed 'arch-') ────────────────────────
  readonly archTotal  = 22;
  readonly archCount  = computed(() => [...this._done()].filter(r => r.startsWith('arch-')).length);
  readonly archPct    = computed(() => Math.round((this.archCount() / this.archTotal) * 100));

  // ── Design Patterns (keys prefixed 'dp-') ────────────────────────────────
  readonly dpTotal  = 36;
  readonly dpCount  = computed(() => [...this._done()].filter(r => r.startsWith('dp-')).length);
  readonly dpPct    = computed(() => Math.round((this.dpCount() / this.dpTotal) * 100));

  // ── Security (keys prefixed 'sec-') ──────────────────────────────────────
  readonly secTotal  = 23;
  readonly secCount  = computed(() => [...this._done()].filter(r => r.startsWith('sec-')).length);
  readonly secPct    = computed(() => Math.round((this.secCount() / this.secTotal) * 100));

  // ── API Design (keys prefixed 'api-') ────────────────────────────────────
  readonly apiTotal  = 19;
  readonly apiCount  = computed(() => [...this._done()].filter(r => r.startsWith('api-')).length);
  readonly apiPct    = computed(() => Math.round((this.apiCount() / this.apiTotal) * 100));

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
