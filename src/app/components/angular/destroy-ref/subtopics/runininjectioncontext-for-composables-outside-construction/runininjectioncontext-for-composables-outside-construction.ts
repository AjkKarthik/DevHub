import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-runininjectioncontext-for-composables-outside-construction-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './runininjectioncontext-for-composables-outside-construction.html',
  styleUrl: './runininjectioncontext-for-composables-outside-construction.scss',
})
export class RunininjectioncontextForComposablesOutsideConstructionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The real problem: a composable needed in response to a LATER event',
      points: [
        'The main topic\'s composable pattern (<code>usePolling()</code> called during construction) covers the common case. The harder case: what if you only want to start polling AFTER a button click, or in response to data that only arrives asynchronously — a point in time with no active injection context? Calling <code>inject(DestroyRef)</code> (directly or transitively, inside the composable) at that point throws <code>NG0203</code>.',
        'The fix is <strong>NOT</strong> to avoid the composable — it is to manually re-establish an injection context around the call using <code>runInInjectionContext(injector, () =&gt; composableFn())</code>, where <code>injector</code> was captured earlier (during construction, when <code>inject(Injector)</code> IS valid) and stored for later use.',
      ],
    },
    {
      heading: 'Capture the Injector during construction, use it whenever',
      points: [
        'Pattern: <code>private injector = inject(Injector);</code> as a field (valid — construction time). Later, inside a click handler: <code>runInInjectionContext(this.injector, () =&gt; usePolling(url))</code>. Everything inside the arrow function now runs WITH a valid injection context, so any <code>inject()</code> calls inside <code>usePolling</code> (including its own <code>inject(DestroyRef)</code>) succeed.',
        'The <code>DestroyRef</code> obtained this way is still tied to the ORIGINAL component/directive that owned the captured <code>injector</code> — not to some new scope. So the composable\'s cleanup still fires when that original host is destroyed, exactly as if it had been called during construction.',
      ],
    },
    {
      heading: 'assertInInjectionContext — defensive guard-checking for library authors',
      points: [
        'If you are writing a composable meant for OTHER developers to use, wrap the top of the function with <code>assertInInjectionContext(myComposableFn)</code> — this throws a clear, actionable error immediately ("myComposableFn() can only be used within an injection context") if the caller forgot to wrap a late call in <code>runInInjectionContext</code>, instead of the caller hitting a confusing generic <code>NG0203</code> deep inside your library\'s internals.',
        'This is purely a developer-experience improvement — it does not change WHETHER the function works, only how clearly it fails when misused. Add it to composables you intend to publish or share across a team; skip it for one-off internal helpers where the stack trace is already clear enough.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/use-polling.ts',
      content: `import { inject, DestroyRef, signal, assertInInjectionContext } from '@angular/core';

// A composable meant to be reusable by other developers —
// assertInInjectionContext gives a clear error if called incorrectly.
export function usePolling(url: string) {
  assertInInjectionContext(usePolling);

  const destroyRef = inject(DestroyRef);
  const data = signal<unknown>(null);

  const id = setInterval(() => {
    fetch(url).then(r => r.json()).then(d => data.set(d));
  }, 3000);

  destroyRef.onDestroy(() => clearInterval(id));

  return data;
}
`,
    },
    {
      path: 'src/app/dashboard.ts',
      content: `import { Component, Injector, inject, runInInjectionContext, signal, WritableSignal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { usePolling } from './use-polling';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [JsonPipe],
  template: \`
    <button (click)="startPollingOnDemand()">Start polling (deferred, on click)</button>
    <p>Deferred data: {{ deferredData() | json }}</p>
  \`,
})
export class DashboardComponent {
  // Captured during construction — valid injection context at this point
  private injector = inject(Injector);

  deferredData: WritableSignal<unknown> = signal(null);

  startPollingOnDemand() {
    // We are inside a click handler — NO active injection context here.
    // Calling usePolling(url) directly would throw NG0203.
    const data = runInInjectionContext(this.injector, () => usePolling('/api/live-data'));

    // Bridge the composable's own signal into this component's field
    // (a simple pattern; a real app might just expose 'data' directly to the template)
    this.deferredData = data as WritableSignal<unknown>;
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { DashboardComponent } from './dashboard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DashboardComponent],
  template: \`
    <h3>Deferred composable via runInInjectionContext</h3>
    <p>Click the button — usePolling() is called from a click handler, well outside
    construction, but succeeds because the captured Injector re-establishes context.</p>
    <app-dashboard />
  \`,
})
export class App {}
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
  <head><title>runInInjectionContext for composables outside construction</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Remove the runInInjectionContext wrapper and confirm (via the console error) that calling usePolling() directly inside the click handler throws NG0203.',
    hint: 'Change `runInInjectionContext(this.injector, () => usePolling(url))` to a direct `usePolling(url)` call and click the button — the console should show an injection context error, proving the wrapper was necessary.',
    solution: `startPollingOnDemand() {
  // Without runInInjectionContext, this throws:
  // NG0203: usePolling() can only be used within an injection context
  const data = usePolling('/api/live-data');
  this.deferredData = data;
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a composable that needs inject() can only ever be called during a component\'s construction phase — no exceptions.',
      reality: 'capturing an Injector during construction and later wrapping the deferred call in runInInjectionContext(injector, fn) lets the same composable be called at any later point, like inside a click handler.',
    },
    {
      thought: 'the DestroyRef obtained inside a runInInjectionContext-wrapped call is tied to some new, temporary scope created by the wrapper.',
      reality: 'it is tied to the ORIGINAL component/directive that owned the captured Injector — cleanup still fires when that original host is destroyed, identical to calling the composable during construction.',
    },
    {
      thought: 'assertInInjectionContext changes whether a composable works outside an injection context.',
      reality: 'it only improves the ERROR MESSAGE when misused — inject() calls inside the composable would throw NG0203 either way; assertInInjectionContext just makes the failure immediate and clearly attributed to the composable\'s name.',
    },
  ];
}
