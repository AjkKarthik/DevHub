import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-recovering-from-component-rendering-errors-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './recovering-from-component-rendering-errors.html',
  styleUrl: './recovering-from-component-rendering-errors.scss',
})
export class RecoveringFromComponentRenderingErrorsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The gap the main topic\'s quiz names but does not solve',
      points: [
        'The main topic\'s own quiz states the uncomfortable truth directly: "Angular has no automatic error recovery lifecycle hook for components. When a component throws during rendering, the component is destroyed and left empty." <code>@defer</code>\'s <code>@error</code> block solves this ONLY for content that happens to be inside a <code>@defer</code> block. A component rendered normally (not deferred) that throws during <code>ngOnInit</code>, a template expression, or a child\'s constructor has NO built-in recovery path — this subtopic builds one.',
      ],
    },
    {
      heading: 'The re-mount pattern — forcing a fresh component instance with @if + a key-like signal',
      points: [
        'Since Angular gives no way to "retry rendering the same instance," the practical fix is to DESTROY the failed instance entirely and create a brand NEW one — wrap the risky component in an <code>@if</code> block gated by a boolean signal, and toggle that signal off-then-on to force Angular to tear down and recreate the component from scratch: <code>@if (mounted()) { &lt;app-risky-widget /&gt; }</code>, with <code>remount() { this.mounted.set(false); setTimeout(() =&gt; this.mounted.set(true)); }</code> (the microtask/macrotask gap between the two <code>.set()</code> calls is necessary so Angular actually processes the destroy before the re-create).',
        'This works because the FAILURE state lived inside the destroyed component instance\'s own fields — a fresh instance starts with clean state, effectively "retrying" whatever caused the original crash. It does NOT work if the crash is caused by consistently bad input data (e.g. a malformed API response) rather than transient timing — in that case, the new instance will throw again immediately, and the retry loop needs a MAX ATTEMPTS guard to avoid an infinite crash loop.',
      ],
    },
    {
      heading: 'A parent-level error boundary component — catching WHICH child crashed',
      points: [
        'Since a rendering error destroys the FAILED component but does not necessarily crash its PARENT, a reusable wrapper component pattern isolates the blast radius: an <code>ErrorBoundaryComponent</code> that projects content via <code>&lt;ng-content /&gt;</code>, listens for a signal set by the global <code>ErrorHandler</code> (correlated to whether the error originated from within its own subtree — a simplification, since Angular does not give a clean per-subtree error correlation API out of the box), and swaps to a fallback UI + retry button when triggered.',
        'A practical correlation technique: the global <code>ErrorHandler</code> increments a shared signal (e.g. <code>errorCount</code>) on EVERY uncaught error; each <code>ErrorBoundaryComponent</code> instance snapshots that count when it renders successfully, and — combined with knowing WHICH specific widget it wraps — assumes (imperfectly, but usefully in practice) that an error occurring while ITS content is the only thing currently rendering belongs to it. This is a pragmatic workaround, not a guaranteed-correct isolation mechanism — Angular does not currently expose a true per-component-subtree error boundary API the way some other frameworks do.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/risky-widget.ts',
      content: `import { Component, input } from '@angular/core';

@Component({
  selector: 'app-risky-widget',
  standalone: true,
  template: \`<p>Revenue: {{ formatted() }}</p>\`,
})
export class RiskyWidgetComponent {
  // Simulates a malformed API response causing a render-time crash —
  // calling .toFixed() on undefined throws inside the template expression.
  data = input<{ revenue: number } | null>(null);

  formatted() {
    return this.data()!.revenue.toFixed(2); // throws if data() is null
  }
}
`,
    },
    {
      path: 'src/app/remountable-panel.ts',
      content: `import { Component, signal } from '@angular/core';
import { RiskyWidgetComponent } from './risky-widget';

@Component({
  selector: 'app-remountable-panel',
  standalone: true,
  imports: [RiskyWidgetComponent],
  template: \`
    @if (mounted()) {
      <app-risky-widget [data]="widgetData()" />
    } @else {
      <p>Widget crashed — recovering...</p>
    }
    <button (click)="fixDataAndRemount()">Fix data and remount</button>
  \`,
})
export class RemountablePanelComponent {
  mounted = signal(true);
  widgetData = signal<{ revenue: number } | null>(null); // starts null — will crash

  // Called by the global ErrorHandler (in a real app) or, here, manually
  // to simulate recovering: fix the underlying data, then remount.
  fixDataAndRemount() {
    this.mounted.set(false);
    this.widgetData.set({ revenue: 4200 }); // the actual "fix"
    setTimeout(() => this.mounted.set(true)); // remount on a fresh instance
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { RemountablePanelComponent } from './remountable-panel';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RemountablePanelComponent],
  template: \`
    <h3>Recovering from component rendering errors</h3>
    <p>RiskyWidgetComponent crashes immediately (data() is null). Click "Fix data and
    remount" — this destroys the crashed instance and creates a fresh one with valid
    data, since Angular gives no built-in way to "retry" a failed render in place.</p>
    <app-remountable-panel />
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
  <head><title>Recovering from component rendering errors</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a max-attempts guard so remounting with STILL-bad data does not loop forever — cap at 3 remount attempts before showing a permanent failure message.',
    hint: 'Add an attemptCount field, increment it each time fixDataAndRemount runs, and check it in the template — after 3 attempts, show a permanent error message instead of the button.',
    solution: `attemptCount = 0;
maxAttempts = 3;
permanentlyFailed = signal(false);

fixDataAndRemount() {
  this.attemptCount++;
  if (this.attemptCount > this.maxAttempts) {
    this.permanentlyFailed.set(true);
    return;
  }
  this.mounted.set(false);
  this.widgetData.set({ revenue: 4200 });
  setTimeout(() => this.mounted.set(true));
}

// Template:
// @if (permanentlyFailed()) {
//   <p>This widget could not be recovered after multiple attempts.</p>
// } @else {
//   <button (click)="fixDataAndRemount()">Fix data and remount</button>
// }`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a component that throws during rendering can be "retried" by simply calling a method on the same instance again.',
      reality: 'Angular destroys the failed component instance entirely with no built-in recovery hook — the only practical fix is destroying and creating a genuinely NEW instance (the re-mount pattern), not retrying the old one.',
    },
    {
      thought: 'the re-mount pattern (toggling an @if signal off then on) always fixes the underlying problem.',
      reality: 'it only helps for TRANSIENT causes — if the crash is caused by consistently bad input data, the new instance crashes again immediately, so a max-attempts guard is needed to avoid an infinite crash loop.',
    },
    {
      thought: 'Angular provides a built-in per-component-subtree error boundary API, similar to some other frameworks.',
      reality: 'it does not — a wrapper "error boundary" component is a pragmatic, hand-built workaround correlating the global ErrorHandler\'s signal with a specific subtree, not a guaranteed-correct built-in isolation mechanism.',
    },
  ];
}
