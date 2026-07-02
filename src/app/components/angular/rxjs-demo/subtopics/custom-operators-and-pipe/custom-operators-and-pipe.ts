import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-custom-operators-and-pipe-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './custom-operators-and-pipe.html',
  styleUrl: './custom-operators-and-pipe.scss',
})
export class CustomOperatorsAndPipeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A pipeable operator is a function that returns a function',
      points: [
        'Every operator you already use (<code>map</code>, <code>filter</code>, <code>debounceTime</code>) has the SAME shape: a function that takes configuration and RETURNS a function <code>(source: Observable&lt;T&gt;) =&gt; Observable&lt;R&gt;</code>. Writing your own custom operator means writing exactly that shape — nothing more exotic is involved.',
        'The simplest custom operators COMPOSE existing operators: <code>function logAndFilter&lt;T&gt;(label: string) { return (source: Observable&lt;T&gt;) =&gt; source.pipe(tap(v =&gt; console.log(label, v)), filter(v =&gt; v != null)); }</code> — this is often all you need, and it is fully type-safe and testable in isolation.',
        'A composed operator like this is used exactly like a built-in one: <code>source$.pipe(logAndFilter(\'debug\'), map(...))</code> — it slots directly into any existing pipe chain.',
      ],
    },
    {
      heading: 'Writing a genuinely new operator with the Observable constructor',
      points: [
        'When no combination of existing operators expresses the logic, drop to the raw <code>new Observable(subscriber =&gt; {...})</code> constructor inside your operator function — call <code>subscriber.next(value)</code>, <code>subscriber.error(err)</code>, and <code>subscriber.complete()</code> to drive the stream directly, and RETURN A TEARDOWN FUNCTION that cleans up (clearing a timer, removing a listener) when unsubscribed.',
        'The teardown function is not optional cleanup — it is how RxJS knows to release resources when the pipeline is unsubscribed (e.g. via <code>takeUntilDestroyed()</code>). Forgetting it in a custom operator that opens a subscription, timer, or listener creates a genuine resource leak identical in nature to forgetting <code>clearInterval</code>.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { map, tap, filter } from 'rxjs/operators';

// Composed custom operator — built entirely from existing operators
function logAndFilter<T>(label: string, predicate: (v: T) => boolean) {
  return (source: Observable<T>) =>
    source.pipe(
      tap(v => console.log(label, v)),
      filter(predicate),
    );
}

// Genuinely new operator — built from the raw Observable constructor
function delayedDouble(ms: number) {
  return (source: Observable<number>) =>
    new Observable<number>(subscriber => {
      const sub = source.subscribe({
        next: (value) => {
          const timeoutId = setTimeout(() => subscriber.next(value * 2), ms);
          // Note: a production version would track and clear all pending timeouts here
        },
        error: (err) => subscriber.error(err),
        complete: () => subscriber.complete(),
      });
      // Teardown — runs on unsubscribe, releasing the inner subscription
      return () => sub.unsubscribe();
    });
}

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Custom operators — composed vs raw Observable constructor</h3>
    <p>Even ticks (filtered + logged, check console): {{ evenTicks() }}</p>
    <p>Delayed-doubled values: {{ doubled() }}</p>
  \`,
})
export class App {
  evenTicks = signal<number[]>([]);
  doubled = signal<number[]>([]);

  constructor() {
    interval(1000).pipe(
      logAndFilter('tick', (n: number) => n % 2 === 0),
    ).subscribe(n => this.evenTicks.update(arr => [...arr, n].slice(-5)));

    interval(1500).pipe(
      delayedDouble(300),
    ).subscribe(n => this.doubled.update(arr => [...arr, n].slice(-5)));
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
  <head><title>Custom operators and pipe</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change logAndFilter\'s predicate call site to filter for multiples of 3 instead of even numbers, and verify the console log + displayed list only ever shows multiples of 3.',
    hint: 'Change the predicate argument from (n: number) => n % 2 === 0 to (n: number) => n % 3 === 0 in the interval(1000).pipe(logAndFilter(...)) call.',
    solution: `interval(1000).pipe(
  logAndFilter('tick', (n: number) => n % 3 === 0),
).subscribe(n => this.evenTicks.update(arr => [...arr, n].slice(-5)));`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'writing a custom RxJS operator requires deep knowledge of RxJS internals or subclassing Observable.',
      reality: 'the vast majority of custom operators are just a function returning source.pipe(existingOperators) — the same composition technique used throughout any RxJS codebase, requiring no internals knowledge.',
    },
    {
      thought: 'the teardown function returned from new Observable(subscriber => {...}) is optional cleanup, similar to a nice-to-have.',
      reality: 'it is how RxJS releases resources on unsubscribe — omitting it in an operator that opens a timer, listener, or subscription creates a genuine resource leak, the same category of bug as forgetting clearInterval.',
    },
    {
      thought: 'a custom operator needs a special RxJS-provided helper function to be created correctly.',
      reality: 'a custom operator is simply a plain function matching the shape (source: Observable<T>) => Observable<R> — no special creation helper is required, though libraries like rxjs\'s own operators are all built this exact same way.',
    },
  ];
}
