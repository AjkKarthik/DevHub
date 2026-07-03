import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-wrapping-a-non-observable-third-party-api-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './wrapping-a-non-observable-third-party-api.html',
  styleUrl: './wrapping-a-non-observable-third-party-api.scss',
})
export class WrappingANonObservableThirdPartyApiSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'takeUntilDestroyed() only helps for Observables — most JS libraries are not Observables',
      points: [
        'Charting libraries, map widgets, WebSocket wrappers, and most non-Angular JS libraries expose their OWN lifecycle: an <code>.on(event, cb)</code> / <code>.off(event, cb)</code> pair, or a <code>.destroy()</code> / <code>.dispose()</code> method — not an RxJS <code>Observable</code>. <code>takeUntilDestroyed()</code> has nothing to attach to here; <code>DestroyRef.onDestroy()</code> is the correct tool instead.',
        'The adapter pattern: create the third-party instance, wire up whatever event listeners your component needs, and register EXACTLY the library\'s own teardown method inside <code>destroyRef.onDestroy(() =&gt; thirdPartyInstance.destroy())</code> — this guarantees the library\'s cleanup runs even if you forget to call it manually, or if the component is destroyed by something other than a direct user action (e.g. a parent route being torn down).',
      ],
    },
    {
      heading: 'A WebSocket example — connect on init, disconnect via onDestroy',
      points: [
        'A raw <code>WebSocket</code> has <code>.close()</code>, not an Observable interface. Wrap it: create the socket in the constructor/field initializer, attach <code>.onmessage</code>/<code>.onerror</code> handlers, and register <code>destroyRef.onDestroy(() =&gt; socket.close())</code>. If you ALSO want to expose the incoming messages as an Observable for the rest of the app to consume with RxJS operators, wrap the raw <code>.onmessage</code> callback in a <code>Subject</code> and call <code>.complete()</code> on it inside the SAME <code>onDestroy</code> callback — bridging a non-Observable API into an Observable one at the exact boundary where DestroyRef already manages the lifecycle.',
      ],
    },
    {
      heading: 'Handling libraries whose destroy() itself can throw or is async',
      points: [
        'Some third-party <code>.destroy()</code> methods are asynchronous (return a Promise) or can throw if called in certain states (e.g. before the library finished initializing). Wrap the call defensively: <code>destroyRef.onDestroy(() =&gt; { try { instance?.destroy(); } catch { /* library already torn down itself */ } });</code> — Angular does not await promises returned from an <code>onDestroy</code> callback, so if truly async teardown matters (rare), you must trigger it fire-and-forget or restructure to close synchronously where possible.',
        'Guard against the instance not existing yet — if the third-party library initializes asynchronously (e.g. loaded via a dynamic <code>import()</code>) and the component is destroyed before it finishes loading, the <code>onDestroy</code> callback must null-check before calling <code>.destroy()</code> to avoid a "cannot read property of undefined" error during teardown.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/live-chart.ts',
      content: `// A minimal stand-in for a third-party charting library's API shape —
// .on()/.off() event pair and a .destroy() teardown method, NOT an Observable.
export class FakeChartLibrary {
  private handlers: Record<string, ((data: unknown) => void)[]> = {};
  private intervalId: ReturnType<typeof setInterval>;

  constructor(private container: HTMLElement) {
    this.intervalId = setInterval(() => {
      this.emit('data', { value: Math.round(Math.random() * 100) });
    }, 1000);
  }

  on(event: string, cb: (data: unknown) => void) {
    (this.handlers[event] ??= []).push(cb);
  }

  private emit(event: string, data: unknown) {
    this.handlers[event]?.forEach(cb => cb(data));
  }

  destroy() {
    clearInterval(this.intervalId);
    this.handlers = {};
  }
}
`,
    },
    {
      path: 'src/app/chart-widget.ts',
      content: `import { Component, ElementRef, DestroyRef, inject, signal, viewChild, afterNextRender } from '@angular/core';
import { Subject } from 'rxjs';
import { FakeChartLibrary } from './live-chart';

@Component({
  selector: 'app-chart-widget',
  standalone: true,
  template: \`
    <div #chartContainer style="height:100px; border:1px solid #ccc;"></div>
    <p>Latest value: {{ latestValue() }}</p>
  \`,
})
export class ChartWidgetComponent {
  private destroyRef = inject(DestroyRef);
  private container = viewChild.required<ElementRef<HTMLElement>>('chartContainer');

  latestValue = signal<number | null>(null);

  // Bridges the library's raw callback API into an Observable other code can consume
  private dataStream$ = new Subject<{ value: number }>();
  readonly data$ = this.dataStream$.asObservable();

  constructor() {
    afterNextRender(() => {
      const chart = new FakeChartLibrary(this.container().nativeElement);

      chart.on('data', (payload) => {
        const typed = payload as { value: number };
        this.latestValue.set(typed.value);
        this.dataStream$.next(typed);
      });

      // The library's OWN teardown, guaranteed to run on component destruction —
      // and the Subject bridge is completed in the same callback.
      this.destroyRef.onDestroy(() => {
        chart.destroy();
        this.dataStream$.complete();
      });
    });
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { ChartWidgetComponent } from './chart-widget';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChartWidgetComponent],
  template: \`
    <h3>Wrapping a non-Observable third-party API</h3>
    <p>FakeChartLibrary exposes .on()/.destroy() — not an Observable. DestroyRef.onDestroy()
    calls chart.destroy() directly, and also completes a bridging Subject so the rest of
    the app can still consume the data as an Observable.</p>
    <app-chart-widget />
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
  <head><title>Wrapping a non-Observable third-party API</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a defensive null-check so that if the component is destroyed before afterNextRender has run (chart is undefined), the onDestroy callback does not throw.',
    hint: 'Declare `let chart: FakeChartLibrary | undefined;` outside afterNextRender, assign it inside, and register a SEPARATE destroyRef.onDestroy at the constructor level that checks `chart?.destroy()`.',
    solution: `constructor() {
  let chart: FakeChartLibrary | undefined;

  this.destroyRef.onDestroy(() => {
    chart?.destroy();
    this.dataStream$.complete();
  });

  afterNextRender(() => {
    chart = new FakeChartLibrary(this.container().nativeElement);
    chart.on('data', (payload) => {
      const typed = payload as { value: number };
      this.latestValue.set(typed.value);
      this.dataStream$.next(typed);
    });
  });
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'takeUntilDestroyed() can be used to clean up any third-party library, not just RxJS Observables.',
      reality: 'takeUntilDestroyed() only works on Observables — a library with its own .on()/.destroy() API needs DestroyRef.onDestroy() calling the library\'s own teardown method directly.',
    },
    {
      thought: 'bridging a non-Observable API into an Observable (via a Subject) means you need two separate cleanup mechanisms — one for the library, one for the Subject.',
      reality: 'both the library\'s .destroy() call and the Subject\'s .complete() call belong in the SAME DestroyRef.onDestroy() callback — one registration, one guaranteed-to-run cleanup for both.',
    },
    {
      thought: 'a third-party library initialized asynchronously (e.g. inside afterNextRender) is guaranteed to exist by the time onDestroy fires.',
      reality: 'if the component is destroyed before the async initialization completes, the instance may still be undefined when onDestroy runs — the cleanup callback must null-check before calling .destroy() to avoid a runtime error during teardown.',
    },
  ];
}
