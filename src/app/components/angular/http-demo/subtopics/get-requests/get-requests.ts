import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-get-requests-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './get-requests.html',
  styleUrl: './get-requests.scss',
})
export class GetRequestsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'toSignal() — the direct bridge, for one-time GETs',
      points: [
        '<code>toSignal(http.get&lt;T&gt;(url))</code> subscribes for you and keeps a signal updated with the latest emission — the signal reads <code>undefined</code> until the first response arrives, unless you pass <code>{ initialValue: [] }</code> to give it a synchronous starting value.',
        'ALWAYS pipe <code>catchError(() =&gt; of(fallback))</code> BEFORE passing the Observable to <code>toSignal()</code>. Without it, an HTTP error propagates through and TERMINATES the Observable — the signal is left permanently stuck at its last value, with no way to recover or retry.',
      ],
    },
    {
      heading: 'httpResource() — the modern alternative for reactive data',
      points: [
        '<code>httpResource&lt;T&gt;(() =&gt; \`/api/items/\${this.id()}\`)</code> (Angular 19+) takes a signal-based URL FACTORY — it automatically re-fetches whenever any signal read inside that factory function changes, and cancels an in-flight request automatically when a newer one starts.',
        'It exposes ready-made <code>value()</code>, <code>isLoading()</code>, <code>error()</code>, and <code>status()</code> signals — no manual loading/error signal pair, no manual <code>catchError()</code> boilerplate needed for the common case.',
      ],
    },
    {
      heading: 'Choosing between them',
      points: [
        'For a single ONE-TIME GET request (data that never needs to be re-fetched based on some other reactive input), <code>toSignal()</code> is simple and sufficient.',
        'For data that depends on a REACTIVE input — a selected id, a search query, a pagination page — prefer <code>httpResource()</code>. It re-runs automatically whenever the URL factory\'s signal dependencies change, with automatic request cancellation built in; recreating the same behavior manually with <code>toSignal()</code> would require a hand-rolled <code>switchMap</code> pipeline.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app/app';

bootstrapApplication(App, {
  providers: [provideHttpClient()],
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

interface Todo { id: number; title: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>toSignal() — fixed URL, fetched once</h3>
    <ul>
      @for (t of todos(); track t.id) {
        <li>{{ t.title }}</li>
      }
    </ul>

    <h3>Reactive: pick an id</h3>
    <button (click)="selectedId.set(1)">Todo #1</button>
    <button (click)="selectedId.set(2)">Todo #2</button>
    <p>Selected id: {{ selectedId() }} — see console for the (simulated) refetch on each click</p>
  \`,
})
export class App {
  private http = inject(HttpClient);

  // toSignal() — one-time GET with a safe fallback on error
  todos = toSignal(
    this.http.get<Todo[]>('https://jsonplaceholder.typicode.com/todos?_limit=5').pipe(
      catchError(() => of([] as Todo[])),
    ),
    { initialValue: [] as Todo[] },
  );

  // A reactive input signal — in a real app, httpResource(() => \`/todos/\${this.selectedId()}\`)
  // would automatically refetch and cancel in-flight requests whenever this changes.
  selectedId = signal(1);

  constructor() {
    console.log('This is where httpResource() would auto-refetch as selectedId() changes.');
  }
}
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>GET requests — toSignal and httpResource</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The todos signal currently has no error UI — add an errorOccurred signal that catchError sets to true, and show a "Could not load todos" message in the template when it is true.',
    hint: 'errorOccurred = signal(false); then inside catchError: catchError(() => { this.errorOccurred.set(true); return of([] as Todo[]); }) — and in the template, @if (errorOccurred()) { <p>Could not load todos.</p> }.',
    solution: `errorOccurred = signal(false);

todos = toSignal(
  this.http.get<Todo[]>('https://jsonplaceholder.typicode.com/todos?_limit=5').pipe(
    catchError(() => {
      this.errorOccurred.set(true);
      return of([] as Todo[]);
    }),
  ),
  { initialValue: [] as Todo[] },
);

// Template:
// @if (errorOccurred()) { <p>Could not load todos.</p> }`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'toSignal() automatically handles HTTP errors and keeps working if the request fails.',
      reality: 'without catchError() piped BEFORE toSignal(), an HTTP error terminates the Observable entirely — the resulting signal gets stuck at its last value forever, with no built-in recovery. catchError() must be added explicitly.',
    },
    {
      thought: 'httpResource() and toSignal() are just two different syntaxes for the exact same thing.',
      reality: 'httpResource() automatically RE-FETCHES when its URL factory\'s signal dependencies change, and cancels in-flight requests — toSignal() fetches once and does not react to anything afterward. Recreating httpResource()\'s auto-refetch/cancel behavior with toSignal() requires manually building a switchMap-based pipeline.',
    },
    {
      thought: 'httpResource() replaces toSignal() entirely — there is no reason to still use toSignal() for HTTP.',
      reality: 'for a genuinely one-time GET with no reactive re-fetch requirement, toSignal() is simpler and perfectly appropriate — httpResource() is the better fit specifically when the request depends on a signal that can change over the component\'s lifetime.',
    },
  ];
}
