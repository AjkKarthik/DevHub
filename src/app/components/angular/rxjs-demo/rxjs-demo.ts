import { Component, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, JsonPipe } from '@angular/common';
import {
  Subject, BehaviorSubject, combineLatest, fromEvent, interval, of
} from 'rxjs';
import {
  switchMap, mergeMap, debounceTime, distinctUntilChanged,
  map, catchError, take, startWith, scan, tap
} from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../../shared/version-badge/version-badge';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';

@Component({
  selector: 'app-rxjs-demo',
  imports: [FormsModule, AsyncPipe, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './rxjs-demo.html',
  styleUrl: './rxjs-demo.scss',
})
export class RxjsDemo {
  private http = inject(HttpClient);

  // ── switchMap demo — search with cancel ──────────────────────────────────
  searchInput$ = new Subject<string>();
  searchQuery  = signal('');

  searchResults$ = this.searchInput$.pipe(
    debounceTime(400),
    distinctUntilChanged(),
    switchMap(q =>
      q.length < 2 ? of([]) :
      this.http.get<{name:string;url:string}[]>(
        `https://pokeapi.co/api/v2/pokemon?limit=5&offset=${q.length * 3}`
      ).pipe(
        map((r: any) => r.results as {name:string;url:string}[]),
        catchError(() => of([]))
      )
    ),
    startWith([] as {name:string;url:string}[])
  );

  onSearch(val: string) {
    this.searchQuery.set(val);
    this.searchInput$.next(val);
  }

  // ── BehaviorSubject demo ─────────────────────────────────────────────────
  private themeSubject = new BehaviorSubject<'light' | 'dark'>('light');
  theme$ = this.themeSubject.asObservable();
  theme  = toSignal(this.theme$, { initialValue: 'light' as 'light' | 'dark' });

  toggleTheme() {
    this.themeSubject.next(this.theme() === 'light' ? 'dark' : 'light');
  }

  // ── combineLatest demo ───────────────────────────────────────────────────
  private qty$    = new BehaviorSubject(1);
  private price$  = new BehaviorSubject(29.99);

  qty   = toSignal(this.qty$,   { initialValue: 1 });
  price = toSignal(this.price$, { initialValue: 29.99 });

  total$ = combineLatest([this.qty$, this.price$]).pipe(
    map(([q, p]) => (q * p).toFixed(2))
  );
  total = toSignal(this.total$, { initialValue: '29.99' });

  setQty(n: number)   { this.qty$.next(Math.max(1, n)); }
  setPrice(p: number) { this.price$.next(Math.max(0, p)); }

  // ── scan demo — running total ────────────────────────────────────────────
  private click$ = new Subject<void>();
  clickCount$ = this.click$.pipe(scan(n => n + 1, 0), startWith(0));
  clickCount  = toSignal(this.clickCount$, { initialValue: 0 });

  doClick() { this.click$.next(); }

  qna: QnaItem[] = [
    { q: 'What is the difference between switchMap, mergeMap, and concatMap?', a: '<code>switchMap</code> cancels the previous inner observable on each new emission — best for search. <code>mergeMap</code> runs all inner observables concurrently. <code>concatMap</code> queues them sequentially. Choose based on cancellation and ordering needs.' },
    { q: 'What is a BehaviorSubject and how does it differ from Subject?', a: '<code>BehaviorSubject</code> requires an initial value and replays the <strong>latest</strong> value to new subscribers. <code>Subject</code> emits nothing to late subscribers — they miss past values. Use <code>BehaviorSubject</code> for state.' },
    { q: 'How does toSignal() handle an Observable in Angular?', a: '<code>toSignal(obs$)</code> subscribes to the observable and returns a signal with the latest emitted value. It automatically unsubscribes when the component is destroyed. Set <code>initialValue</code> to avoid <code>undefined</code> on first read.' },
    { q: 'What does debounceTime() do and when would you use it?', a: '<code>debounceTime(300)</code> waits 300ms after the last emission before forwarding the value. Use it on search inputs to avoid firing an API call on every keystroke — only fire after the user stops typing.' },
    { q: 'What is combineLatest and when should you use it?', a: '<code>combineLatest([a$, b$])</code> emits an array of the latest values from each source whenever any source emits. Use it to combine multiple independent state streams — e.g. filter + sort + page signals for a data table.' },
    { q: 'What is the scan operator?', a: '<code>scan((acc, curr) => acc + curr, 0)</code> is like Array.reduce but for streams — it accumulates state across emissions. Useful for running totals, undo history, or accumulating items into an array.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Observable fundamentals',
      points: [
        'An <code>Observable</code> is a lazy push stream — nothing happens until you <code>subscribe()</code>.',
        '<code>Subject</code>: multicast, hot — emits to all current subscribers. New subscribers miss past values.',
        '<code>BehaviorSubject(initial)</code>: replays the latest value to new subscribers — great for current-state streams.',
        '<code>ReplaySubject(n)</code>: replays the last n values. <code>AsyncSubject</code>: emits only the final value on complete.',
      ],
    },
    {
      heading: 'Essential operators',
      points: [
        '<code>switchMap</code>: cancels the previous inner observable when a new outer value arrives — ideal for searches.',
        '<code>mergeMap</code>: keeps all inner observables alive concurrently — use for parallel HTTP calls.',
        '<code>concatMap</code>: queues inner observables one after another — preserves order.',
        '<code>debounceTime(ms)</code>: waits ms of silence before passing the value — combines well with distinctUntilChanged.',
        '<code>combineLatest([a$, b$])</code>: emits when ALL source observables have emitted at least once, then on every subsequent emit.',
        '<code>scan(accumulator, seed)</code>: like Array.reduce but for streams — running total, state accumulation.',
      ],
    },
    {
      heading: 'Bridging RxJS → Signals',
      points: [
        '<code>toSignal(obs$)</code> subscribes inside the current injection context and exposes the latest value as a signal.',
        'Provide <code>{ initialValue: ... }</code> to avoid the initial <code>undefined</code> before the first emission.',
        '<code>toSignal</code> auto-unsubscribes when the component is destroyed — no manual cleanup needed.',
        'Going the other way: <code>toObservable(mySignal)</code> turns a signal into an observable.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'Always unsubscribe — use <code>takeUntilDestroyed()</code>, the <code>async</code> pipe, or <code>toSignal()</code>.',
        '<code>switchMap</code> does NOT cancel HTTP requests already in flight at the browser level — it just ignores the response.',
        'Prefer <code>toSignal()</code> over <code>async</code> pipe for new code — it is more composable and type-safe.',
        'Use <code>catchError(err => of(fallback))</code> inside pipe to prevent the stream from dying on errors.',
      ],
    },
  ];

  tabs: CodeTab[] = [
    {
      label: 'switchMap',
      language: 'typescript',
      code: `// switchMap — cancels previous inner Observable when outer emits.
// Perfect for search: only the LAST request matters.

searchResults$ = this.searchInput$.pipe(
  debounceTime(400),          // wait 400ms after last keystroke
  distinctUntilChanged(),     // ignore if value didn't change
  switchMap(query =>          // cancel previous HTTP call
    this.http.get('/api/search?q=' + query).pipe(
      catchError(() => of([]))  // never let errors kill the stream
    )
  )
);

// vs mergeMap: runs ALL inner observables concurrently (use for parallel uploads)
// vs concatMap: queues inner observables in order (use for sequential operations)
// vs exhaustMap: ignores new values while inner is running (use for form submit)`,
    },
    {
      label: 'debounceTime + distinctUntilChanged',
      language: 'typescript',
      code: `// debounceTime(ms) — emit only after N ms of silence
// distinctUntilChanged() — skip if value is same as last emit

const search$ = fromEvent(inputEl, 'input').pipe(
  map(e => (e.target as HTMLInputElement).value),
  debounceTime(400),          // don't fire while user is typing
  distinctUntilChanged(),     // don't fire if they typed then deleted same text
  switchMap(q => http.get('/api?q=' + q))
);

// Without these: each keystroke fires an HTTP request
// With these: only fires once user pauses, and only if value changed`,
    },
    {
      label: 'combineLatest',
      language: 'typescript',
      code: `// combineLatest — emits whenever ANY source emits (with latest from all)
// Use for: derived values from multiple streams

const qty$   = new BehaviorSubject(1);
const price$ = new BehaviorSubject(9.99);

const total$ = combineLatest([qty$, price$]).pipe(
  map(([qty, price]) => qty * price)
);

// Emits: 9.99 initially
// qty$.next(3) → emits: 29.97
// price$.next(14.99) → emits: 44.97

// Convert to signal for templates:
total = toSignal(total$, { initialValue: 0 });`,
    },
    {
      label: 'Subject / BehaviorSubject',
      language: 'typescript',
      code: `// Subject — multicast Observable you push to manually
const events$ = new Subject<string>();
events$.next('click');   // push a value
events$.subscribe(console.log);  // subscribe

// BehaviorSubject — Subject with a current value (replay 1)
const theme$ = new BehaviorSubject<'light'|'dark'>('light');
theme$.getValue()     // → 'light' (synchronous read)
theme$.next('dark')   // push new value
theme$.asObservable() // expose as read-only Observable

// Common pattern: service exposes Observable, keeps Subject private
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _theme = new BehaviorSubject<'light'|'dark'>('light');
  readonly theme$ = this._theme.asObservable();
  setTheme(t: 'light'|'dark') { this._theme.next(t); }
}`,
    },
    {
      label: 'exhaustMap — prevent duplicate submits',
      language: 'typescript',
      code: `// exhaustMap — ignores new outer values while inner is still running
// Perfect for form submit: ignores extra clicks until the request completes

const submit$ = fromEvent(submitBtn, 'click');

const result$ = submit$.pipe(
  exhaustMap(() =>
    http.post('/api/order', cartData).pipe(
      catchError(err => { toastService.error(err.message); return EMPTY; })
    )
  )
);

// vs switchMap: would cancel the first request if user clicks again
// vs mergeMap:  would fire a new request on every click (duplicates!)
// vs exhaustMap: IGNORES extra clicks while request is in flight ✅

// Common pattern in Angular:
export class OrderFormComponent {
  private submit$ = new Subject<void>();

  order = toSignal(
    this.submit$.pipe(
      exhaustMap(() => this.http.post('/api/orders', this.form.value)),
      catchError(() => of(null)),
      startWith(null),
    ), { initialValue: null }
  );

  submit() { if (this.form.valid) this.submit$.next(); }
}`,
    },
    {
      label: 'retry + retryWhen',
      language: 'typescript',
      code: `// retry() — re-subscribe automatically on error
import { retry, timer, switchMap, throwError } from 'rxjs';

// Simple: retry up to 3 times immediately
http.get('/api/data').pipe(
  retry(3),
  catchError(err => { console.error('Failed after 3 tries'); return of(null); })
);

// With delay between retries:
http.get('/api/data').pipe(
  retry({ count: 3, delay: 1000 }),   // wait 1s between attempts
  catchError(err => of(null))
);

// Advanced: exponential backoff
http.get('/api/data').pipe(
  retry({
    count: 4,
    delay: (err, attempt) => {
      if (err.status === 404) return throwError(() => err); // don't retry 404
      return timer(Math.pow(2, attempt) * 500);  // 0.5s, 1s, 2s, 4s
    },
  }),
  catchError(err => of(null))
);`,
    },
    {
      label: 'scan',
      language: 'typescript',
      code: `// scan — like Array.reduce but for streams
// Accumulates state across emissions

const clicks$ = fromEvent(btn, 'click');

// Running count
const count$ = clicks$.pipe(scan(n => n + 1, 0));

// Accumulate into array
const log$ = events$.pipe(
  scan((acc, event) => [...acc, event], [] as string[])
);

// Shopping cart total
const cart$ = actions$.pipe(
  scan((total, action) =>
    action.type === 'ADD' ? total + action.price : total - action.price,
  0)
);`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What does switchMap do that mergeMap does not?',
      options: [
        'Flattens inner observables',
        'Cancels the previous inner observable when a new one arrives',
        'Queues emissions and processes them in order',
        'Ignores new emissions while one is in flight',
      ],
      answer: 1,
      explanation: 'switchMap unsubscribes from the previous inner observable when the source emits again — ideal for search-as-you-type.',
    },
    {
      q: 'Which operator prevents duplicate consecutive values from passing through?',
      options: ['filter()', 'debounceTime()', 'distinctUntilChanged()', 'take(1)'],
      answer: 2,
      explanation: 'distinctUntilChanged() drops a value if it equals the previous emission — useful on search inputs to avoid redundant API calls.',
    },
    {
      q: 'What does catchError need to return to keep the stream alive?',
      options: ['throw the error again', 'null', 'An Observable (e.g. of(fallback))', 'false'],
      answer: 2,
      explanation: 'catchError must return a new Observable. Returning of(fallback) emits a safe value and completes normally.',
    },
    {
      q: 'Which Subject type replays its latest value to new subscribers?',
      options: ['Subject', 'ReplaySubject(1)', 'BehaviorSubject', 'Both B and C'],
      answer: 3,
      explanation: 'Both BehaviorSubject (requires initial value) and ReplaySubject(1) replay the latest emission to late subscribers.',
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'switchMap', type: 'operator', desc: 'Cancels the previous inner observable and subscribes to the new one when the source emits — ideal for search-as-you-type.' , since: '2'},
    { name: 'mergeMap', type: 'operator', desc: 'Subscribes to every inner observable concurrently without cancellation — use for parallel HTTP calls.' , since: '2'},
    { name: 'debounceTime', type: 'operator', desc: 'Emits a value only after a specified millisecond silence period, suppressing rapid bursts like keystrokes.' , since: '2'},
    { name: 'distinctUntilChanged', type: 'operator', desc: 'Drops an emission if it is strictly equal to the previous value, preventing redundant downstream work.' , since: '2'},
    { name: 'combineLatest', type: 'function', desc: 'Emits an array of the latest values from all source observables whenever any one of them emits.' , since: '2'},
    { name: 'scan', type: 'operator', desc: 'Applies an accumulator function over the stream like Array.reduce, emitting the running result on each emission.' , since: '2'},
    { name: 'BehaviorSubject', type: 'class', desc: 'A Subject that requires an initial value and synchronously replays the latest emitted value to any new subscriber.' , since: '2'},
    { name: 'Subject', type: 'class', desc: 'A multicast hot observable you push values into manually; late subscribers miss past emissions.' , since: '2'},
    { name: 'toSignal', type: 'function', desc: 'Wraps an observable into a signal, auto-subscribing in the current injection context and auto-unsubscribing on destroy.' , since: '16'},
    { name: 'catchError', type: 'operator', desc: 'Intercepts an error in the pipeline and must return a replacement observable, keeping the stream alive.' , since: '2'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Subscribing manually vs toSignal()', before: '// Old: manual subscribe + cleanup\nresults: string[] = [];\nngOnInit() {\n  this.results$.subscribe(r => this.results = r);\n}\nngOnDestroy() { this.sub.unsubscribe(); }', after: '// New: toSignal handles subscribe + cleanup\nresults = toSignal(this.results$, { initialValue: [] });\n// Use results() in template — no ngOnDestroy needed',
      note: 'toSignal() was introduced in Angular 16 via @angular/core/rxjs-interop' },
    { title: 'async pipe in template vs toSignal()', before: '// Old: async pipe — requires NgIf/async and handles null\n// template: *ngIf=\'total$ | async as total\'\n// component:\ntotal$ = combineLatest([qty$, price$]).pipe(\n  map(([q, p]) => q * p)\n);', after: '// New: toSignal — synchronous read in template\ntotal$ = combineLatest([qty$, price$]).pipe(\n  map(([q, p]) => q * p)\n);\ntotal = toSignal(this.total$, { initialValue: 0 });\n// template: {{ total() }}',
      note: 'toSignal avoids nullable async pipe boilerplate and works with @if/@for control flow' },
    { title: 'Unsubscription: takeUntil vs takeUntilDestroyed()', before: '// Old: manual destroy subject\nprivate destroy$ = new Subject<void>();\nngOnInit() {\n  this.data$.pipe(takeUntil(this.destroy$)).subscribe(...);\n}\nngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }', after: '// New: takeUntilDestroyed (Angular 16+)\nimport { takeUntilDestroyed } from \'@angular/core/rxjs-interop\';\nngOnInit() {\n  this.data$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(...);\n}',
      note: 'takeUntilDestroyed() integrates with DestroyRef, eliminating the boilerplate destroy subject pattern' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Using switchMap for actions that must not be cancelled', wrong: '// Form submit — switchMap cancels in-flight request!\nsubmit$.pipe(\n  switchMap(() => http.post(\'/api/order\', data))\n);', right: '// Use exhaustMap to ignore extra clicks while in-flight\nsubmit$.pipe(\n  exhaustMap(() => http.post(\'/api/order\', data))\n);', explanation: 'switchMap cancels the previous inner observable on each new emission. For form submits you want exhaustMap (ignore) or concatMap (queue), never switchMap.'  },
    { title: 'Letting catchError kill the stream by rethrowing', wrong: 'search$.pipe(\n  switchMap(q => http.get(\'/api?q=\' + q)),\n  catchError(err => { throw err; }) // stream dies!\n);', right: 'search$.pipe(\n  switchMap(q => http.get(\'/api?q=\' + q).pipe(\n    catchError(() => of([]))  // inner catch keeps outer alive\n  ))\n);', explanation: 'catchError must return an observable. Rethrowing or returning nothing terminates the stream. Place catchError inside the inner pipe so only that request fails, not the whole search stream.'  },
    { title: 'Forgetting initialValue in toSignal()', wrong: '// Type is Signal<string[] | undefined> — causes runtime errors\nresults = toSignal(this.results$);', right: '// Type is Signal<string[]> — safe from first render\nresults = toSignal(this.results$, { initialValue: [] as string[] });', explanation: 'Without initialValue, toSignal returns undefined until the first emission, causing template errors and requiring extra null checks everywhere.'  },
    { title: 'Using BehaviorSubject as a public property', wrong: '// External code can call next() freely — breaks encapsulation\nexport class ThemeService {\n  theme$ = new BehaviorSubject(\'light\');\n}', right: 'export class ThemeService {\n  private _theme = new BehaviorSubject(\'light\');\n  readonly theme$ = this._theme.asObservable();\n  setTheme(t: string) { this._theme.next(t); }\n}', explanation: 'Exposing a BehaviorSubject publicly lets any consumer push values, bypassing validation logic. Always keep the Subject private and expose only the observable via asObservable().'  },
  ];

  versionItems: VersionInfo[] = [
    { version: '16', label: 'rxjs-interop: toSignal and toObservable', features: ['toSignal(obs$) bridges RxJS observables into Angular signals with automatic subscription management', 'toObservable(signal) converts a signal into an observable for use in RxJS pipelines', 'takeUntilDestroyed() eliminates the destroy-subject boilerplate pattern', 'All three live in @angular/core/rxjs-interop'] },
    { version: '2', label: 'RxJS core operators and classes', features: ['Observable, Subject, BehaviorSubject, ReplaySubject available from rxjs', 'Pipeable operators (switchMap, mergeMap, debounceTime, etc.) available from rxjs/operators', 'AsyncPipe in @angular/common provides template-level subscription management'] },
  ];

  challenge: Challenge = {
    title: 'Type-ahead Search with debounce',
    description: 'Build a search pipeline that waits 300ms after the user stops typing, skips duplicate terms, and cancels in-flight requests when a new search starts.',
    language: 'typescript',
    hints: [
      'Use debounceTime(300) to wait for the user to pause',
      'Use distinctUntilChanged() to skip if the value did not change',
      'Use switchMap() to cancel the previous HTTP request',
    ],
    starterCode: `import { Component, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({ template: '...' })
export class SearchComponent {
  private http = inject(HttpClient);
  query = new FormControl('');

  // TODO: build a results$ observable that:
  // 1. Starts from query.valueChanges
  // 2. Waits 300ms after typing stops
  // 3. Skips if value didn't change
  // 4. Cancels previous search on new keystroke
  // 5. Fetches: GET /api/search?q=term
  results$ = /* ... */;
}`,
    solution: `import { Component, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';

@Component({ template: '...' })
export class SearchComponent {
  private http = inject(HttpClient);
  query = new FormControl('');

  results$ = this.query.valueChanges.pipe(
    startWith(''),
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(term =>
      this.http.get<string[]>('/api/search', { params: { q: term ?? '' } })
    ),
  );
}`,
  };
}
