import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-resource-reload-and-polling-patterns-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './resource-reload-and-polling-patterns.html',
  styleUrl: './resource-reload-and-polling-patterns.scss',
})
export class ResourceReloadAndPollingPatternsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'resource.reload() — re-running the loader with the SAME params',
      points: [
        '<code>resource.reload()</code> re-invokes the loader using the CURRENT params value, without requiring any params signal to actually change — this is the correct API for a manual "Refresh" button, where the user wants fresh data for the exact same query.',
        'During a <code>reload()</code>, the resource\'s status becomes <code>reloading</code> (not <code>loading</code>) — a genuinely different status value specifically so the template can distinguish "first-ever fetch" (show a full skeleton) from "refreshing existing data" (show a subtle spinner while keeping the stale data visible), reading <code>resource.value()</code> which remains available throughout a reload.',
      ],
    },
    {
      heading: 'Building a polling resource with a ticking signal',
      points: [
        'Since <code>params()</code> only re-runs the loader when its signal READS change, the standard polling pattern is a signal that TICKS on an interval: <code>tick = signal(0); constructor() { setInterval(() =&gt; this.tick.update(n =&gt; n + 1), 5000); }</code> then <code>params: () =&gt; ({ id: this.id(), _tick: this.tick() })</code> — including <code>_tick</code> in the params object forces a re-fetch every interval even though the actual query (<code>id</code>) hasn\'t changed.',
        'Always clear the interval in <code>DestroyRef.onDestroy()</code> (or use <code>takeUntilDestroyed()</code> if built on an RxJS timer) — an uncleared <code>setInterval</code> keeps calling <code>tick.update()</code> after the component is destroyed, which is both a memory leak and (in zoneless apps) entirely wasted work since nothing is listening anymore.',
      ],
    },
    {
      heading: 'Combining polling with visibility — pausing when the tab is hidden',
      points: [
        'A polling resource that keeps fetching every few seconds even when the browser tab is in the BACKGROUND wastes bandwidth and server load for no visible benefit — check <code>document.visibilityState === \'visible\'</code> inside the interval callback (or listen to the <code>visibilitychange</code> event) and skip incrementing <code>tick</code> when the tab is hidden, resuming polling when it becomes visible again.',
        'This is a genuinely common production requirement for dashboards and live-status pages — the resource() primitive itself has no built-in visibility awareness, so this coordination logic is something you write explicitly, same as the interval-based polling itself.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal, resource, inject, DestroyRef } from '@angular/core';

interface Status { serverTime: string; requestCount: number; }

let callCount = 0;
function fetchStatus(): Promise<Status> {
  callCount++;
  return new Promise(resolve =>
    setTimeout(() => resolve({ serverTime: new Date().toLocaleTimeString(), requestCount: callCount }), 300),
  );
}

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Manual reload() — a "Refresh" button, same params</h3>
    <button (click)="statusResource.reload()" [disabled]="statusResource.status() === 'reloading'">
      {{ statusResource.status() === 'reloading' ? 'Refreshing...' : 'Refresh' }}
    </button>
    <p>Server time: {{ statusResource.value()?.serverTime }}</p>
    <p>Total fetches: {{ statusResource.value()?.requestCount }}</p>

    <h3>Auto-polling via a ticking signal in params (every 3s)</h3>
    <p>Poll tick: {{ tick() }}</p>
    <p>Polled resource status: {{ statusResource.status() }}</p>
  \`,
})
export class App {
  private destroyRef = inject(DestroyRef);
  tick = signal(0);

  statusResource = resource({
    params: () => ({ _tick: this.tick() }), // including _tick forces a refetch each poll
    loader: () => fetchStatus(),
  });

  constructor() {
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.tick.update(n => n + 1);
      }
    }, 3000);
    this.destroyRef.onDestroy(() => clearInterval(intervalId));
  }
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Resource reload and polling patterns</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change the polling interval from 3000ms to 1000ms, and confirm the tick and fetch count climb noticeably faster.',
    hint: 'Change setInterval(() => { ... }, 3000) to setInterval(() => { ... }, 1000) inside the constructor.',
    solution: `const intervalId = setInterval(() => {
  if (document.visibilityState === 'visible') {
    this.tick.update(n => n + 1);
  }
}, 1000);`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'resource.reload() sets the status back to loading, identical to the very first fetch.',
      reality: 'a reload sets the status to reloading, a genuinely distinct value specifically so the template can show a subtle "refreshing" indicator while keeping the previous value() visible, rather than a full loading skeleton.',
    },
    {
      thought: 'polling with resource() requires some special built-in polling option or interval parameter.',
      reality: 'resource() has no built-in polling — the standard pattern is a signal that ticks on a setInterval, included in the params object so its change forces a re-fetch even when the actual query itself hasn\'t changed.',
    },
    {
      thought: 'a polling resource is fine to leave running even when the browser tab is in the background.',
      reality: 'continuing to poll a hidden tab wastes bandwidth and server load for no visible benefit — checking document.visibilityState and pausing the tick when hidden is a genuinely common production requirement, not an edge case.',
    },
  ];
}
