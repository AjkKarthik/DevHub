import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-debouncing-effects-for-expensive-side-effects-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './debouncing-effects-for-expensive-side-effects.html',
  styleUrl: './debouncing-effects-for-expensive-side-effects.scss',
})
export class DebouncingEffectsForExpensiveSideEffectsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Microtask batching helps, but is not the same as debouncing',
      points: [
        'The main topic notes that "rapid successive writes to a signal trigger only one re-run" — but this only coalesces writes that happen SYNCHRONOUSLY in the same script execution (e.g. three <code>.set()</code> calls in a row in one function). Signal writes spread across separate user keystrokes, each its own event handler and microtask cycle, each trigger their OWN effect re-run — microtask batching does not help here at all.',
        'An effect syncing every keystroke of a search box to an expensive backend "auto-save" endpoint will fire on EVERY keystroke without additional debouncing — the fix needs an actual time-based debounce, not reliance on Angular\'s microtask coalescing.',
      ],
    },
    {
      heading: 'Approach 1: onCleanup() as a manual debounce timer',
      points: [
        'Use <code>onCleanup</code> for its OTHER purpose beyond resource cleanup — cancelling a scheduled timer: <code>effect((onCleanup) =&gt; { const value = this.query(); const id = setTimeout(() =&gt; doExpensiveSync(value), 500); onCleanup(() =&gt; clearTimeout(id)); });</code>. Every re-run (each keystroke) cancels the PREVIOUS pending timeout via onCleanup before scheduling a new one — the expensive sync only actually fires once the signal has been stable for 500ms.',
        'This pattern reads a signal SYNCHRONOUSLY (tracked, so the effect knows to re-run) but performs the expensive work inside the async <code>setTimeout</code> callback (untracked by definition, since it is async) — this is intentional and correct: you WANT every keystroke to cancel-and-reschedule, not to be tracked as a separate dependency.',
      ],
    },
    {
      heading: 'Approach 2: toObservable().pipe(debounceTime()) then toSignal() — RxJS-native debouncing',
      points: [
        'For teams already comfortable with RxJS, bridging through <code>toObservable(this.query).pipe(debounceTime(500), switchMap(q =&gt; expensiveSync(q)))</code> then <code>toSignal(...)</code> reuses RxJS\'s well-tested debounce operator instead of hand-rolling one with <code>setTimeout</code>. This also gets <code>switchMap</code>\'s built-in cancellation of in-flight requests for free — if the user types again before the previous sync\'s HTTP call resolves, <code>switchMap</code> cancels it automatically, something the manual <code>onCleanup</code> + <code>setTimeout</code> approach does NOT handle without extra work (it debounces the SCHEDULING, not an in-flight async operation).',
        'Choose the manual <code>onCleanup</code> approach for simple debounced side effects with no async request to cancel (e.g. debouncing a `console.log` or a synchronous localStorage write). Choose the RxJS bridge when the debounced action is itself an async operation (HTTP call) that should be cancellable mid-flight.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/search-box.ts',
      content: `import { Component, signal, effect } from '@angular/core';

async function expensiveAutoSave(query: string): Promise<void> {
  console.log(\`[expensiveAutoSave] syncing "\${query}" to backend…\`);
  await new Promise(r => setTimeout(r, 100));
  console.log(\`[expensiveAutoSave] done syncing "\${query}"\`);
}

@Component({
  selector: 'app-search-box',
  standalone: true,
  template: \`
    <input
      [value]="query()"
      (input)="query.set($any($event.target).value)"
      placeholder="Type quickly — watch the console" />
    <p>Current query: {{ query() }}</p>
    <p>Open the console — expensiveAutoSave only fires 500ms after you STOP typing,
    not on every keystroke.</p>
  \`,
})
export class SearchBoxComponent {
  query = signal('');

  constructor() {
    effect((onCleanup) => {
      const q = this.query(); // tracked — re-runs on every keystroke

      const timeoutId = setTimeout(() => {
        expensiveAutoSave(q);
      }, 500);

      // Cancels the PREVIOUS pending timeout on every re-run —
      // only the last keystroke within a 500ms window actually fires the sync.
      onCleanup(() => clearTimeout(timeoutId));
    });
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { SearchBoxComponent } from './search-box';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SearchBoxComponent],
  template: \`
    <h3>Debouncing effects for expensive side effects</h3>
    <p>Type into the box quickly, then pause — expensiveAutoSave fires once, 500ms after
    your last keystroke, not on every single character.</p>
    <app-search-box />
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
  <head><title>Debouncing effects for expensive side effects</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Rewrite the debounce using toObservable() + debounceTime() + toSignal() instead of the manual setTimeout/onCleanup approach.',
    hint: 'Import toObservable/toSignal from @angular/core/rxjs-interop and debounceTime/switchMap from rxjs/operators; pipe toObservable(this.query) through debounceTime(500) and switchMap(q => expensiveAutoSave(q).then(() => q)).',
    solution: `import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, switchMap } from 'rxjs/operators';

export class SearchBoxComponent {
  query = signal('');

  private synced = toSignal(
    toObservable(this.query).pipe(
      debounceTime(500),
      switchMap(q => expensiveAutoSave(q).then(() => q)),
    ),
    { initialValue: '' },
  );
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Angular\'s microtask batching of rapid signal writes is a form of debouncing that handles the search-box-auto-save case automatically.',
      reality: 'microtask batching only coalesces writes that happen SYNCHRONOUSLY in the same script execution — separate keystrokes across separate event handlers each trigger their own effect re-run regardless.',
    },
    {
      thought: 'onCleanup() is only for releasing resources like sockets and subscriptions.',
      reality: 'it is equally valid to use onCleanup() to cancel a scheduled setTimeout on every re-run — this is exactly how a manual debounce is built without any RxJS dependency.',
    },
    {
      thought: 'a manual onCleanup + setTimeout debounce and a toObservable().pipe(debounceTime()) approach are functionally identical.',
      reality: 'the RxJS approach additionally gets switchMap\'s automatic cancellation of an IN-FLIGHT async request if the user types again before it resolves — the manual approach only debounces the scheduling, not an already-started async operation.',
    },
  ];
}
