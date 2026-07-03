import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-async-pipe-let-performance-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './async-pipe-let-performance.html',
  styleUrl: './async-pipe-let-performance.scss',
})
export class AsyncPipeLetPerformanceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The multiple-subscription trap',
      points: [
        'EACH <code>| async</code> expression creates its OWN SEPARATE subscription — placing <code>user$ | async</code> twice in the same template creates TWO independent subscriptions (two HTTP requests, if the source is an HTTP call), not one shared value. This is a genuinely common, easy-to-miss source of duplicate network requests.',
      ],
    },
    {
      heading: '@let as the fix — alias once, reuse everywhere',
      points: [
        '<code>&#64;let user = user$ | async;</code> (Angular 18+) resolves the Observable ONCE and gives the result a reusable name for the rest of the block — every subsequent reference to <code>user</code> reads the SAME resolved value, with no additional subscription created.',
        '<code>null</code> is returned until the first emission, so guard against it: <code>&#64;if (user$ | async; as u) { ... }</code> (the older pattern) or check <code>&#64;if (user) { ... }</code> after a <code>&#64;let</code> alias, to avoid template errors on the initial null.',
      ],
    },
    {
      heading: 'computed() vs impure pipes — the performance decision',
      points: [
        'Prefer a <code>computed()</code> signal over an IMPURE pipe (<code>pure: false</code>) for derived state — <code>computed()</code> memoizes automatically and integrates directly with the signal graph, while an impure pipe re-runs its <code>transform()</code> on EVERY change detection cycle regardless of whether its actual inputs changed.',
        'For genuinely heavy operations — filtering or sorting a large array — derive the result with <code>computed()</code> in the component rather than an impure pipe. Chained impure pipes in particular compound this cost: each one adds its own full re-run, every single cycle.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AsyncPipe],
  template: \`
    <h3>❌ Two subscriptions to the SAME source (watch the console tick twice as fast)</h3>
    <p>{{ tick$ | async }}</p>
    <p>{{ tick$ | async }}</p>

    <h3>✅ One subscription via @let, reused</h3>
    @let tick = tick$ | async;
    <p>{{ tick }}</p>
    <p>{{ tick }}</p>
  \`,
})
export class App {
  private counter = signal(0);

  tick$ = interval(1000).pipe(
    map(() => {
      this.counter.update(n => n + 1);
      console.log('source emitted — subscription fired, count:', this.counter());
      return this.counter();
    }),
  );
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
  <head><title>AsyncPipe, @let, and performance</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a guard using @if around the @let-based section so the two paragraphs only render once tick has actually resolved (is not null).',
    hint: '@let tick = tick$ | async; @if (tick !== null) { <p>{{ tick }}</p> <p>{{ tick }}</p> } — wrap the existing two <p> tags in an @if checking that the aliased value is not the initial null.',
    solution: `@let tick = tick$ | async;
@if (tick !== null) {
  <p>{{ tick }}</p>
  <p>{{ tick }}</p>
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'placing the same | async expression multiple times in a template is harmless, since it is reading the same source each time.',
      reality: 'each | async expression creates a genuinely SEPARATE subscription — for an HTTP-backed Observable, this means duplicate network requests, not a shared cached value. @let fixes this by resolving once and reusing the alias.',
    },
    {
      thought: 'an impure pipe (pure: false) is roughly as efficient as a computed() signal, just with different syntax.',
      reality: 'an impure pipe re-runs on EVERY change detection cycle regardless of whether its actual inputs changed, while computed() memoizes and only recalculates when a genuine signal dependency changes — these have meaningfully different performance characteristics, not just different syntax.',
    },
    {
      thought: '@let and the async pipe are two competing, mutually exclusive ways to handle Observables in a template.',
      reality: 'they compose together — @let is what lets you resolve an | async expression ONCE and reuse the result, rather than repeating the pipe (and its separate subscription) at every point the value is needed.',
    },
  ];
}
