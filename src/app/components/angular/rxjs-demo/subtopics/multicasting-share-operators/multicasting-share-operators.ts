import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-multicasting-share-operators-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './multicasting-share-operators.html',
  styleUrl: './multicasting-share-operators.scss',
})
export class MulticastingShareOperatorsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The cold-observable-per-subscriber trap',
      points: [
        'A COLD observable (like <code>http.get()</code>) re-executes its ENTIRE producer logic for every new subscriber — two <code>| async</code> pipes reading the same <code>http.get()</code>-returning method fire TWO separate HTTP requests, not one shared response, unless something makes the stream hot first.',
        'This is an easy-to-miss real-world bug: a template that reads the same Observable-returning method twice (directly, or via two components each injecting a service method) silently doubles network calls — no error, no warning, just twice the traffic.',
      ],
    },
    {
      heading: 'share() and shareReplay() — turning cold into hot',
      points: [
        '<code>source$.pipe(share())</code> makes the observable MULTICAST — all subscribers share ONE underlying execution instead of each triggering their own. By default, when the LAST subscriber unsubscribes, the shared execution is torn down; a later new subscriber restarts it from scratch.',
        '<code>shareReplay({ bufferSize: 1, refCount: true })</code> additionally REPLAYS the last N emissions to any NEW subscriber that arrives after the source already emitted — essential for a "fetch once, share everywhere" HTTP caching pattern where late subscribers still need the already-arrived value, not a fresh request.',
        '<code>refCount: true</code> (the modern recommended default) ties the shared execution\'s lifetime to actual subscriber count — it starts on the first subscribe and tears down when the last unsubscribes, preventing indefinite background execution after everyone has left. Omitting it (or setting <code>refCount: false</code>) keeps the source running forever once started, a common source of leaked HTTP polling or WebSocket connections.',
      ],
    },
    {
      heading: 'A practical caching service pattern',
      points: [
        'The standard "cache an HTTP call and share it across the whole app" pattern: <code>private cache$ = this.http.get(url).pipe(shareReplay({ bufferSize: 1, refCount: true }));</code> — the first caller triggers the real request; every subsequent caller (even much later) gets the cached value instantly with NO additional network call, as long as at least one subscriber has remained subscribed since (or the buffer still holds it under refCount semantics).',
        'This differs from simply storing the resolved value in a plain class field, because it correctly handles the IN-FLIGHT case too — if two callers subscribe while the request is still pending, both correctly receive the single eventual response rather than one triggering a second redundant request.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, tap, shareReplay } from 'rxjs/operators';

let callCount = 0;

// Simulates an HTTP call — logs each time the PRODUCER actually executes
function fetchData(): Observable<string> {
  return of('server response').pipe(
    delay(500),
    tap(() => { callCount++; console.log('Producer executed — call #' + callCount); }),
  );
}

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>❌ Cold — subscribing twice triggers the producer twice</h3>
    <button (click)="subscribeColdTwice()">Subscribe twice (check console + call count)</button>
    <p>Cold call count: {{ coldCalls() }}</p>

    <h3>✅ shareReplay — subscribing twice triggers the producer ONCE</h3>
    <button (click)="subscribeSharedTwice()">Subscribe twice (shared)</button>
    <p>Shared call count: {{ sharedCalls() }}</p>
  \`,
})
export class App {
  coldCalls = signal(0);
  sharedCalls = signal(0);

  private shared$ = fetchData().pipe(shareReplay({ bufferSize: 1, refCount: true }));

  subscribeColdTwice() {
    const cold$ = fetchData(); // a NEW cold observable each time this method runs
    cold$.subscribe(() => this.coldCalls.update(n => n + 1));
    cold$.subscribe(() => this.coldCalls.update(n => n + 1));
  }

  subscribeSharedTwice() {
    this.shared$.subscribe(() => this.sharedCalls.update(n => n + 1));
    this.shared$.subscribe(() => this.sharedCalls.update(n => n + 1));
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
  <head><title>Multicasting and share operators</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Subscribe twice (check console + call count)" a few times, then click "Subscribe twice (shared)" — compare the console log pattern between the two, and explain the difference in producer execution count.',
    hint: 'Each click of the cold button creates a brand-new cold$ observable and produces two independent executions (two console logs, two call count increments). Each click of the shared button reuses the SAME this.shared$ that was already subscribed/completed once at component construction, so the producer only ever ran once total — later subscribes just replay the cached value.',
    solution: `// Cold: fetchData() called fresh every time subscribeColdTwice() runs
// -> 2 new executions logged per click, N clicks = 2N producer runs

// Shared: this.shared$ was created ONCE as a class field
// -> the producer only executes on the very first subscription ever
// -> every later subscribe() call (even across many clicks) just
//    replays the single cached emission, with NO new producer run`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'two components independently subscribing to the same service method that returns an Observable automatically share one HTTP request.',
      reality: 'unless that Observable is made hot with share()/shareReplay(), each subscription re-executes the COLD producer from scratch — two subscribers to a plain http.get()-returning method genuinely trigger two separate network requests.',
    },
    {
      thought: 'shareReplay() without refCount keeps working correctly and is just a slightly different flavor of shareReplay({ refCount: true }).',
      reality: 'without refCount: true, the shared execution keeps running indefinitely even after every subscriber has unsubscribed — a real source of leaked polling/WebSocket connections that never tear down.',
    },
    {
      thought: 'storing a resolved value in a plain class field after the first HTTP call achieves the same result as shareReplay caching.',
      reality: 'a plain field only helps AFTER the first response arrives — if two callers subscribe while the request is still in flight, a plain-field approach can still trigger a second redundant request, while shareReplay correctly shares even the in-flight execution.',
    },
  ];
}
