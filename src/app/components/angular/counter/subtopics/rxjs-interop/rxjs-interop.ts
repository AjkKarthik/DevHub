import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-rxjs-interop-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './rxjs-interop.html',
  styleUrl: './rxjs-interop.scss',
})
export class RxjsInteropSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Why you still need RxJS interop, even in a signals-first app',
      points: [
        'Several core Angular APIs still hand you an <code>Observable</code>, not a signal: <code>HttpClient</code> requests, <code>ActivatedRoute.params</code>, and <code>FormControl.valueChanges</code> are the three you will meet constantly. Signals did not replace RxJS in Angular — they sit alongside it, and <code>&#64;angular/core/rxjs-interop</code> is the bridge between the two.',
        'The two functions that matter: <code>toSignal(observable$)</code> converts an Observable into a signal you can read in a template with no <code>| async</code> pipe and no manual subscribe/unsubscribe. <code>toObservable(signal)</code> goes the other way — turning a signal into an Observable so you can feed it into RxJS operators like <code>debounceTime</code> or <code>switchMap</code>.',
      ],
    },
    {
      heading: 'toSignal() — Observable in, signal out',
      points: [
        '<code>toSignal(this.http.get(\'/api/user\'))</code> subscribes to the Observable for you and keeps a signal updated with the latest emitted value — read it in the template like any other signal, no <code>| async</code> needed.',
        'Must be called in an injection context (field initialiser or constructor), same restriction as <code>effect()</code> — this is what lets Angular automatically unsubscribe when the component/service is destroyed, with zero manual cleanup code.',
        'Before the Observable emits its first value, the signal reads as <code>undefined</code> — unless you pass <code>{ initialValue: ... }</code>, in which case the signal starts with that value instead. For an HTTP call this usually means: <code>toSignal(this.http.get&lt;User[]&gt;(\'/api/users\'), { initialValue: [] })</code> so the template can safely assume an array from the very first render.',
      ],
    },
    {
      heading: 'toObservable() — signal in, Observable out',
      points: [
        'The classic use case is search-as-you-type: you have a signal holding the current input text, but you want RxJS\'s <code>debounceTime</code> + <code>distinctUntilChanged</code> + <code>switchMap</code> operators to turn keystrokes into a debounced, cancellable HTTP search. <code>toObservable(searchTerm)</code> gives you a stream you can pipe those operators onto — then <code>toSignal(...)</code> the result back into a signal for the template to read.',
        'Like <code>toSignal()</code>, this must be created in an injection context. The resulting Observable emits the signal\'s CURRENT value immediately on subscribe, then every future value as the signal changes — it is a live stream, not a one-time snapshot.',
      ],
    },
    {
      heading: 'When to reach for interop — and when not to',
      points: [
        'Use it at the BOUNDARY: right where your code first receives an Observable from an Angular/RxJS-based API (<code>toSignal</code>), or right where your signal-based state needs to flow into RxJS-only operators (<code>toObservable</code>). Do not sprinkle interop calls throughout ordinary component logic that never actually touches RxJS — plain <code>signal()</code>/<code>computed()</code>/<code>effect()</code> is simpler and is the right default everywhere else.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap, of, delay } from 'rxjs';

const FRUITS = ['apple', 'apricot', 'banana', 'blueberry', 'cherry', 'coconut'];

// Pretend HTTP call — returns matches after a fake network delay
function fakeSearch(term: string) {
  const matches = term
    ? FRUITS.filter(f => f.startsWith(term.toLowerCase()))
    : [];
  return of(matches).pipe(delay(300));
}

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h2>Search-as-you-type</h2>
    <input
      [value]="term()"
      (input)="term.set($any($event.target).value)"
      placeholder="Try: ap, b, cher..." />

    <ul>
      @for (fruit of results(); track fruit) {
        <li>{{ fruit }}</li>
      } @empty {
        <li><em>No matches</em></li>
      }
    </ul>
  \`,
})
export class App {
  // Plain signal — holds the input's current value
  term = signal('');

  // signal -> Observable, so RxJS operators can debounce/dedupe/switchMap it
  private term$ = toObservable(this.term);

  // Observable -> signal, so the template reads it with no async pipe
  results = toSignal(
    this.term$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(term => fakeSearch(term)),
    ),
    { initialValue: [] as string[] },
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
  <head><title>RxJS interop</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a searching signal that is true while a search is in flight, and show a "Searching…" message in the template while it is true. Hint: RxJS\'s tap operator can set it before switchMap runs.',
    hint: 'import { tap } from \'rxjs\', then add .pipe(debounceTime(250), distinctUntilChanged(), tap(() => this.searching.set(true)), switchMap(term => fakeSearch(term).pipe(tap(() => this.searching.set(false))))) — a plain signal() for searching, toggled from inside the RxJS pipeline via tap().',
    solution: `searching = signal(false);
private term$ = toObservable(this.term);

results = toSignal(
  this.term$.pipe(
    debounceTime(250),
    distinctUntilChanged(),
    tap(() => this.searching.set(true)),
    switchMap(term => fakeSearch(term).pipe(
      tap(() => this.searching.set(false))
    )),
  ),
  { initialValue: [] as string[] },
);`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'toSignal() still requires you to manually unsubscribe, same as a plain .subscribe() call.',
      reality: '<code>toSignal()</code> ties its subscription to the injection context it was created in — Angular automatically unsubscribes when that component or service is destroyed. No <code>ngOnDestroy</code>, no <code>Subscription</code> object to manage.',
    },
    {
      thought: 'toObservable(signal) emits the signal\'s value once, as a snapshot at the moment you called it.',
      reality: 'the returned Observable is a live stream — it emits the current value immediately on subscribe, and then emits again every time the signal changes afterward. It behaves like a <code>BehaviorSubject</code> wrapping the signal, not a one-shot snapshot.',
    },
    {
      thought: 'since interop exists, it\'s good practice to route all state through toSignal/toObservable so everything is "consistent".',
      reality: 'interop is a boundary tool for the specific places your code actually meets an Observable-based API (HTTP, forms, router) or needs RxJS operators. Plain <code>signal()</code>/<code>computed()</code> is simpler and is the correct default for ordinary component state — reaching for interop everywhere adds indirection with no benefit.',
    },
  ];
}
