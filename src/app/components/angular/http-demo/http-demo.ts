import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, Subject, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';
import { TruncatePipe } from '../../../pipes/truncate.pipe';
import { HighlightDirective } from '../../../directives/highlight.directive';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';

interface ApiTodo {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
}

@Component({
  selector: 'app-http-demo',
  imports: [
    TruncatePipe, HighlightDirective,
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './http-demo.html',
  styleUrl: './http-demo.scss',
})
export class HttpDemo {
  private http = inject(HttpClient);

  todos = toSignal(
    this.http.get<ApiTodo[]>('https://jsonplaceholder.typicode.com/todos?_limit=10').pipe(
      catchError(() => of(null))
    ),
    { initialValue: undefined }
  );

  postResult = signal<string | null>(null);
  posting    = signal(false);

  searchQuery   = signal('');
  searchLoading = signal(false);
  searchError   = signal<string | null>(null);
  searchResults = signal<{ name: string; url: string }[]>([]);

  private search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      tap(() => { this.searchLoading.set(true); this.searchError.set(null); }),
      switchMap(q =>
        q.length < 2
          ? of({ results: [] as { name: string; url: string }[] })
          : this.http.get<{ results: { name: string; url: string }[] }>(
              `https://pokeapi.co/api/v2/pokemon?limit=8&offset=${Math.max(0, q.charCodeAt(0) - 97) * 8}`
            ).pipe(catchError(() => {
              this.searchError.set('Network error — try again.');
              return of({ results: [] as { name: string; url: string }[] });
            }))
      ),
      takeUntilDestroyed(),
    ).subscribe(res => {
      this.searchResults.set(res.results ?? []);
      this.searchLoading.set(false);
    });
  }

  onSearch(event: Event) {
    const q = (event.target as HTMLInputElement).value;
    this.searchQuery.set(q);
    this.search$.next(q);
    if (q.length < 2) { this.searchResults.set([]); this.searchLoading.set(false); }
  }

  createTodo() {
    this.posting.set(true);
    this.http
      .post<ApiTodo>('https://jsonplaceholder.typicode.com/todos', {
        title: 'New todo from Angular',
        completed: false,
        userId: 1,
      })
      .subscribe({
        next: res => { this.postResult.set(`Created todo with id: ${res.id}`); this.posting.set(false); },
        error: ()  => { this.postResult.set('POST failed.'); this.posting.set(false); },
      });
  }

  prerequisites: Prerequisite[] = [
    { label: 'Routing', route: '/angular/routing-demo' },
    { label: 'Signals & Reactivity', route: '/angular/signals' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'HttpClient', type: 'class', desc: 'Angular\'s built-in HTTP service for typed GET, POST, PUT, DELETE requests returning Observables.', since: '2' },
    { name: 'provideHttpClient', type: 'function', desc: 'Standalone function added to app.config.ts providers; replaces the deprecated HttpClientModule.', since: '15' },
    { name: 'withInterceptors', type: 'function', desc: 'Registers an array of HttpInterceptorFn functions inside provideHttpClient() in app.config.ts.', since: '15' },
    { name: 'toSignal', type: 'function', desc: 'Converts an Observable into a Signal that auto-unsubscribes when the component is destroyed.', since: '16' },
    { name: 'takeUntilDestroyed', type: 'function', desc: 'RxJS operator that completes an Observable when the component\'s DestroyRef notifies, avoiding manual unsubscription.', since: '16' },
    { name: 'HttpInterceptorFn', type: 'interface', desc: 'Functional interceptor type — a plain function (req, next) => Observable<HttpEvent> registered via withInterceptors().', since: '15' },
    { name: 'catchError', type: 'operator', desc: 'RxJS operator that intercepts an errored Observable and returns a fallback Observable to keep the stream alive.', since: '2' },
    { name: 'switchMap', type: 'operator', desc: 'Cancels the previous inner Observable and subscribes to a new one — essential for type-ahead search to prevent stale results.', since: '2' },
    { name: 'httpResource', type: 'function', desc: 'Angular 19+ signals-native HTTP wrapper exposing value(), isLoading(), error(), status() with automatic re-fetching.', since: '19' },
    { name: 'HttpErrorResponse', type: 'class', desc: 'Typed error object from HttpClient containing status code, statusText, and parsed error body.', since: '2' },
    { name: 'HttpParams', type: 'class', desc: 'Immutable helper for building URL query strings safely without manual string concatenation.', since: '2' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'HttpClient basics — providing and setup',
      points: [
        '<code>provideHttpClient()</code> in <code>app.config.ts</code> replaces the deprecated <code>HttpClientModule</code> for standalone Angular apps. Add interceptors inline: <code>provideHttpClient(withInterceptors([authFn, logFn]))</code>. Without this call, injecting <code>HttpClient</code> throws <code>NullInjectorError</code>.',
        'Inject <code>HttpClient</code> anywhere using <code>private http = inject(HttpClient)</code>. No constructor parameter list needed. It is a singleton service provided in the root injector by <code>provideHttpClient()</code>.',
        'All <code>HttpClient</code> methods (<code>get</code>, <code>post</code>, <code>put</code>, <code>delete</code>, <code>patch</code>) return <strong>cold Observables</strong> — nothing executes until you <code>.subscribe()</code> or consume via <code>async</code> pipe / <code>toSignal()</code>. Each subscription triggers a separate HTTP request.',
        'Always pass a type parameter: <code>http.get&lt;User[]&gt;(url)</code>. Without it, the return type is <code>Observable&lt;Object&gt;</code> — any downstream code loses type safety. Angular does not validate the response shape at runtime, so the generic is purely for TypeScript.',
        'Use <code>HttpParams</code> for query strings: <code>new HttpParams().set(\'page\', 1).set(\'sort\', \'asc\')</code>. Pass as <code>http.get(url, { params })</code>. Never concatenate query strings manually — encoding edge cases and URL injection risks make it error-prone.',
      ],
    },
    {
      heading: 'GET requests — toSignal() and httpResource()',
      points: [
        '<code>toSignal(http.get&lt;T&gt;(url))</code> subscribes to the Observable and returns a <code>Signal&lt;T | undefined&gt;</code>. The signal is <code>undefined</code> until the first emission. Provide <code>{ initialValue: [] }</code> to set a synchronous starting value and avoid the <code>undefined</code> state.',
        'Always pipe <code>catchError(() =&gt; of(fallback))</code> before passing to <code>toSignal()</code>. Without it, any HTTP error propagates through and terminates the Observable — the signal is left stuck in its last state, with no way to recover.',
        '<code>httpResource&lt;T&gt;(() =&gt; \`/api/items/\${this.id()}\`)</code> (Angular 19+) is the modern alternative. It accepts a signal-based URL factory, re-fetches automatically when any signal read inside it changes, and exposes <code>value()</code>, <code>isLoading()</code>, <code>error()</code>, and <code>status()</code> signals — no manual <code>toSignal()</code> or <code>catchError()</code> boilerplate.',
        'For single one-time GET requests, <code>toSignal()</code> is simple and clean. For data that depends on reactive inputs (selected ID, search query, pagination page), prefer <code>httpResource()</code> — it re-runs whenever the URL changes and cancels in-flight requests automatically.',
        'Read multiple signals from <code>httpResource</code> in the template: <code>@if (product.isLoading()) { &lt;spinner /&gt; } @else if (product.error()) { &lt;error /&gt; } @else { &lt;app-product [data]="product.value()!" /&gt; }</code>. This replaces the manual loading/error signal pattern entirely.',
      ],
    },
    {
      heading: 'POST, PUT, DELETE — mutation requests',
      points: [
        'Mutation requests (<code>POST</code>, <code>PUT</code>, <code>PATCH</code>, <code>DELETE</code>) are typically one-shot — fire and handle the response in a <code>subscribe()</code> call rather than converting to a signal. The subscribe approach is appropriate here because mutations are triggered by user actions, not reactive state.',
        'Pattern: <code>http.post&lt;T&gt;(url, body).subscribe({ next: res =&gt; ..., error: err =&gt; ... })</code>. Always handle both <code>next</code> and <code>error</code> in the observer object. Unhandled errors propagate to the global error handler and may crash the app in strict mode.',
        'Set request options with a third argument: <code>http.post(url, body, { headers: new HttpHeaders({ \'Content-Type\': \'application/json\' }), observe: \'response\' })</code>. The <code>observe: \'response\'</code> option returns the full <code>HttpResponse</code> including status code and headers, not just the parsed body.',
        'For optimistic UI updates: update the local signal immediately, then fire the POST. On error, revert: <code>this.items.update(list =&gt; list.filter(i =&gt; i.id !== tempId))</code>. This gives instant feedback while the network request is in flight.',
        'Combine with <code>takeUntilDestroyed()</code> for mutations that may still be pending when the component is destroyed: <code>http.post(url, body).pipe(takeUntilDestroyed()).subscribe()</code>. Without this, the subscription callback could call <code>signal.set()</code> on a destroyed component.',
      ],
    },
    {
      heading: 'Functional interceptors — request pipeline',
      points: [
        'An interceptor is a plain function: <code>const myFn: HttpInterceptorFn = (req, next) =&gt; next(req.clone({ ... }))</code>. It receives the outgoing request and a <code>next</code> handler. Call <code>next(req)</code> to forward; return its Observable to the caller.',
        '<code>HttpRequest</code> is <strong>immutable</strong>. <code>req.headers.set(\'X-Header\', \'val\')</code> returns a new <code>HttpHeaders</code> object but does not modify <code>req</code>. Always use <code>req.clone({ setHeaders: { ... } })</code> to produce a modified copy before forwarding.',
        'Common interceptors: <strong>auth</strong> (append <code>Authorization: Bearer token</code> to every request), <strong>logging</strong> (log method, URL, and duration), <strong>error handling</strong> (show a toast on 401/500), <strong>loading indicator</strong> (increment/decrement a global counter). Each runs in registration order.',
        'Interceptors can short-circuit by returning an Observable without calling <code>next()</code>: <code>return of(new HttpResponse({ body: cachedData }))</code>. This enables cache interceptors that return stored responses without hitting the network.',
        'Register multiple interceptors: <code>provideHttpClient(withInterceptors([authInterceptor, loggingInterceptor, retryInterceptor]))</code>. They run in order for the outgoing request and in reverse order for the response — like Express middleware. The last interceptor in the array actually sends the request to the network.',
      ],
    },
    {
      heading: 'Error handling and retry strategies',
      points: [
        '<code>catchError(err =&gt; of(fallback))</code> intercepts any error in the Observable pipeline and returns a fallback Observable. The outer stream continues as if no error occurred. Use <code>of(null)</code> to signal an error state, <code>of([])</code> to return empty data, or <code>EMPTY</code> to complete silently.',
        '<code>HttpErrorResponse</code> carries: <code>status</code> (HTTP code: 400, 401, 404, 500), <code>statusText</code> (human-readable), <code>error</code> (parsed response body), and <code>url</code>. Always narrow to <code>HttpErrorResponse</code> in the catch block: <code>if (err instanceof HttpErrorResponse && err.status === 401)</code>.',
        '<code>retry(3)</code> re-subscribes to the Observable (re-fires the request) up to 3 times before propagating the error. <code>retryWhen(errors =&gt; errors.pipe(delay(1000)))</code> adds a delay between retries. Angular 14+ provides <code>retry({ count: 3, delay: 1000 })</code> as a cleaner API.',
        'For granular error handling: pipe <code>catchError</code> inside the inner Observable (before <code>switchMap</code> or <code>mergeMap</code> flattens it) to recover per-request without killing the outer search stream: <code>switchMap(q =&gt; http.get(q).pipe(catchError(() =&gt; of([]))))</code>.',
        'Distinguish client vs server errors: <code>err.status === 0</code> means a network/CORS failure (no response from server). <code>err.status &gt;= 500</code> is a server error. <code>err.status &gt;= 400 && err.status &lt; 500</code> is a client error (bad request, unauthorized, not found). Handle them differently in your error interceptor.',
      ],
    },
    {
      heading: 'Reactive search patterns — debounce, switchMap, takeUntilDestroyed',
      points: [
        'The canonical type-ahead search pipeline: <code>input$ .pipe(debounceTime(350), distinctUntilChanged(), switchMap(q =&gt; http.get(q)), takeUntilDestroyed())</code>. Each operator has a distinct role: debounce waits for pauses, distinct skips repeated values, switchMap cancels old requests, takeUntilDestroyed cleans up on destroy.',
        '<code>debounceTime(350)</code> waits 350ms after the last keystroke before emitting. Without it, every character fires a request. The value depends on UX requirements — shorter means faster results but more requests; 250-400ms is the common range.',
        '<code>switchMap</code> is critical for search: it cancels the previous inner Observable (and its HTTP request) when a new value arrives. <code>mergeMap</code> would keep all requests alive, risking stale results overwriting newer ones. <code>exhaustMap</code> ignores new values while a request is in flight — good for submit buttons, wrong for search.',
        'Keep loading state in a signal, not as a class field, so the template reacts immediately: <code>tap(() =&gt; this.loading.set(true))</code> before <code>switchMap</code>, and reset in the subscribe callback. This prevents the loading indicator from persisting after the component re-renders.',
        'For cancellation with <code>httpResource()</code>: simply change the reactive input that feeds the URL factory — <code>httpResource()</code> cancels the previous request automatically when the factory re-evaluates. No Subject, no <code>switchMap</code>, no manual management needed.',
      ],
    },
  ];

  httpTabs: CodeTab[] = [
    {
      label: 'httpResource() — modern (v19+)',
      language: 'typescript',
      code: `// httpResource() — signals-native HTTP: no subscribe, no toSignal()
import { httpResource } from '@angular/common/http';
import { signal } from '@angular/core';

export class ProductsComponent {
  selectedId = signal(1);

  // Reactive: re-fetches automatically when selectedId() changes
  product = httpResource<Product>(() => \`/api/products/\${this.selectedId()}\`);

  // Built-in status signals:
  // product.isLoading()  → boolean
  // product.value()      → Product | undefined
  // product.error()      → unknown
  // product.status()     → 'idle' | 'loading' | 'resolved' | 'error'

  // Template:
  // @if (product.isLoading()) { <spinner /> }
  // @if (product.value()) { <p>{{ product.value()!.name }}</p> }
  // @if (product.error()) { <p>Failed to load</p> }
}

// POST/PUT/DELETE still use http.post().subscribe()
// httpResource() is GET-only`,
    },
    {
      label: 'GET + toSignal()',
      language: 'typescript',
      code: `import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

export class HttpDemo {
  private http = inject(HttpClient);

  // toSignal() — auto-subscribes, auto-unsubscribes on destroy
  todos = toSignal(
    this.http
      .get<Todo[]>('https://jsonplaceholder.typicode.com/todos?_limit=10')
      .pipe(catchError(() => of(null))),
    { initialValue: undefined } // undefined = loading, null = error
  );

  // Template:
  // @if (todos() === undefined) { Loading… }
  // @else if (todos() === null) { Error! }
  // @else { @for (t of todos()!; track t.id) { ... } }
}`,
    },
    {
      label: 'POST / mutation',
      language: 'typescript',
      code: `// Mutations use subscribe() — user-triggered, not reactive state
export class TodoComponent {
  private http = inject(HttpClient);
  result = signal<string | null>(null);
  saving = signal(false);

  createTodo() {
    this.saving.set(true);
    this.http
      .post<Todo>('/api/todos', { title: 'New todo', completed: false })
      .subscribe({
        next: res => {
          this.result.set(\`Created: \${res.id}\`);
          this.saving.set(false);
        },
        error: () => {
          this.result.set('Failed to create.');
          this.saving.set(false);
        },
      });
  }

  // Full CRUD:
  // http.get<T>(url)
  // http.post<T>(url, body)
  // http.put<T>(url, body)
  // http.patch<T>(url, partialBody)
  // http.delete<T>(url)
}`,
    },
    {
      label: 'Interceptor (auth + log)',
      language: 'typescript',
      code: `// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();

  // HttpRequest is immutable — must clone!
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: \`Bearer \${token}\` } })
    : req;

  const started = Date.now();
  return next(authReq).pipe(
    tap(() => console.log(\`\${req.method} \${req.url} — \${Date.now() - started}ms\`))
  );
};

// app.config.ts:
// provideHttpClient(withInterceptors([authInterceptor]))`,
    },
    {
      label: 'Search with debounce + switchMap',
      language: 'typescript',
      code: `export class SearchComponent {
  private http = inject(HttpClient);
  loading = signal(false);
  results = signal<Result[]>([]);
  error   = signal<string | null>(null);

  private search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(
      debounceTime(350),        // wait for typing pause
      distinctUntilChanged(),   // skip if value didn't change
      tap(() => { this.loading.set(true); this.error.set(null); }),
      switchMap(q =>            // cancel previous request on new value
        q.length < 2
          ? of([])
          : this.http.get<Result[]>('/api/search?q=' + q).pipe(
              catchError(err => {
                this.error.set(err.message);
                return of([]);   // keep stream alive on error
              })
            )
      ),
      takeUntilDestroyed(),     // auto-clean on component destroy
    ).subscribe(res => {
      this.results.set(res);
      this.loading.set(false);
    });
  }

  onInput(event: Event) {
    this.search$.next((event.target as HTMLInputElement).value);
  }
}`,
    },
    {
      label: 'Error handling',
      language: 'typescript',
      code: `import { HttpErrorResponse } from '@angular/common/http';
import { catchError, retry, throwError } from 'rxjs';

// Pattern 1: fallback value (stream continues)
todos = toSignal(
  http.get<Todo[]>('/api/todos').pipe(
    catchError(() => of([] as Todo[]))
  ),
  { initialValue: [] }
);

// Pattern 2: error state signal (component handles UI)
todos = toSignal(
  http.get<Todo[]>('/api/todos').pipe(
    catchError((err: HttpErrorResponse) => {
      this.errorMsg.set(
        err.status === 404 ? 'Not found' :
        err.status === 0   ? 'Network error' : 'Server error'
      );
      return of([] as Todo[]);
    })
  ),
  { initialValue: [] }
);

// Pattern 3: retry then error
http.get('/api/data').pipe(
  retry({ count: 3, delay: 1000 }), // retry 3× with 1s delay
  catchError(err => throwError(() => err))
).subscribe();`,
    },
  ];

  searchCodeTabs: CodeTab[] = [
    {
      label: 'debounce + switchMap',
      language: 'typescript',
      code: `// Pattern: search input → debounce → cancel old → fetch new
private search$ = new Subject<string>();
searchLoading = signal(false);
searchResults = signal<Result[]>([]);
searchError   = signal<string | null>(null);

constructor() {
  this.search$.pipe(
    debounceTime(400),          // wait 400ms after last keystroke
    distinctUntilChanged(),     // skip if query hasn't changed
    tap(() => this.searchLoading.set(true)),
    switchMap(q =>              // cancel previous HTTP call on each new q
      q.length < 2
        ? of([])                // don't fetch for short queries
        : this.http.get<Result[]>('/api/search?q=' + q).pipe(
            catchError(err => {
              this.searchError.set(err.message);
              return of([]);    // recover — stream stays alive
            })
          )
    ),
    takeUntilDestroyed(),       // auto-unsubscribe on component destroy
  ).subscribe(res => {
    this.searchResults.set(res);
    this.searchLoading.set(false);
  });
}

onInput(event: Event) {
  const q = (event.target as HTMLInputElement).value;
  this.search$.next(q);
}`,
    },
    {
      label: 'Template',
      language: 'html',
      code: `<input (input)="onInput($event)" placeholder="Search…" />

@if (searchLoading()) { <span>Loading…</span> }
@if (searchError())   { <p class="error">{{ searchError() }}</p> }

<div class="results">
  @for (item of searchResults(); track item.name) {
    <div class="result-item">{{ item.name }}</div>
  } @empty {
    <p>Type to search</p>
  }
</div>

<p>Loading: {{ searchLoading() }} | Results: {{ searchResults().length }}</p>`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'How do you provide HttpClient in Angular 22?',
      options: [
        'Import HttpClientModule in AppModule',
        'provideHttpClient() in app.config.ts providers',
        'Add HttpClient to @Component imports',
        'It\'s available by default without configuration',
      ],
      answer: 1,
      explanation: 'Angular 22 uses standalone config. Add provideHttpClient() (with optional withInterceptors([...])) to the providers array in app.config.ts. HttpClientModule is deprecated since Angular 15.',
    },
    {
      q: 'What does toSignal() do?',
      options: [
        'Converts a signal to an Observable',
        'Wraps an Observable into a signal that updates reactively and auto-unsubscribes on destroy',
        'Makes a signal asynchronous',
        'Delays signal updates until the next CD cycle',
      ],
      answer: 1,
      explanation: 'toSignal(obs$) subscribes to the Observable and returns a Signal<T>. It auto-unsubscribes when the component is destroyed via DestroyRef. Always pipe catchError before passing to toSignal().',
    },
    {
      q: 'Which RxJS operator combination prevents stale search results on rapid typing?',
      options: [
        'mergeMap + retry',
        'concatMap + delay',
        'debounceTime + switchMap',
        'exhaustMap + throttleTime',
      ],
      answer: 2,
      explanation: 'debounceTime waits for typing to pause before emitting. switchMap cancels the previous HTTP request and subscribes to the new one — ensuring only the latest result is used, not an older response that arrived late.',
    },
    {
      q: 'What does catchError return to keep the Observable stream alive after an error?',
      options: [
        'null',
        'EMPTY or of(fallbackValue)',
        'throwError(() => err)',
        'undefined',
      ],
      answer: 1,
      explanation: 'catchError must return a new Observable. EMPTY completes silently; of(fallback) emits a default value and completes. Both replace the errored Observable and keep the outer stream alive. throwError re-propagates the error.',
    },
    {
      q: 'What does takeUntilDestroyed() protect against?',
      options: [
        'Cancelling HTTP requests mid-flight',
        'Memory leaks from long-lived Observable subscriptions that outlive the component',
        'Limiting the number of HTTP emissions',
        'Preventing multiple simultaneous subscriptions',
      ],
      answer: 1,
      explanation: 'takeUntilDestroyed() completes the Observable when the component\'s DestroyRef notifies. Unlike single HttpClient.get() calls (which auto-complete), Subject-based streams and interval() never complete on their own — they leak without this operator.',
    },
    {
      q: 'What is the difference between switchMap and mergeMap for HTTP search?',
      options: [
        'They are identical for HTTP requests',
        'switchMap cancels the previous HTTP request on new input; mergeMap keeps all requests alive and may emit stale results',
        'mergeMap is faster but switchMap is more accurate',
        'switchMap only works with HttpClient, mergeMap works with any Observable',
      ],
      answer: 1,
      explanation: 'switchMap unsubscribes from (and cancels) the previous inner Observable when a new value arrives — perfect for search. mergeMap keeps all in-flight requests alive, so a slow older request can resolve after a faster newer one, overwriting the correct result with stale data.',
    },
    {
      q: 'What does httpResource() provide that http.get() + toSignal() does not?',
      options: [
        'Support for POST and DELETE requests',
        'Automatic re-fetching when signal dependencies in the URL factory change, plus built-in isLoading/error/status signals',
        'Better TypeScript type inference',
        'Integration with Angular Material loading indicators',
      ],
      answer: 1,
      explanation: 'httpResource() (Angular 19+) accepts a signal-based URL factory and re-fetches automatically when any signal read inside it changes. It also exposes isLoading(), error(), and status() signals out of the box — eliminating the boilerplate of separate loading/error state signals.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do you provide HttpClient in Angular 15+ without HttpClientModule?',
      a: '<code>provideHttpClient()</code> in <code>app.config.ts</code> replaces <code>HttpClientModule</code>. Add interceptors with <code>provideHttpClient(withInterceptors([myFn]))</code>. Without this, injecting <code>HttpClient</code> throws <code>NullInjectorError: No provider for HttpClient</code>.',
    },
    {
      q: 'How does an interceptor work?',
      a: 'An interceptor is a function: <code>(req: HttpRequest, next: HttpHandlerFn) =&gt; Observable&lt;HttpEvent&gt;</code>. Clone and modify the request with <code>req.clone({ setHeaders: { Authorization: \'Bearer \' + token } })</code>, then call <code>next(clonedReq)</code> to forward it. Interceptors run in order for requests and in reverse for responses.',
    },
    {
      q: 'Why must you clone an HttpRequest in an interceptor?',
      a: '<code>HttpRequest</code> is immutable — <code>req.headers.set(\'X\', \'y\')</code> returns a new object but does not modify <code>req</code>. Use <code>req.clone({ setHeaders: { ... } })</code> to produce a modified copy. The original is not sent; only the cloned version is forwarded with <code>next()</code>.',
    },
    {
      q: 'How do you convert an Observable response to a signal?',
      a: '<code>const data = toSignal(this.http.get&lt;T[]&gt;(\'/api/items\').pipe(catchError(() =&gt; of([]))), { initialValue: [] })</code>. <code>toSignal()</code> subscribes once and auto-unsubscribes on destroy. The signal always holds the latest value. Pass <code>catchError</code> before <code>toSignal</code> to prevent signal stalling on errors.',
    },
    {
      q: 'How do you handle HTTP errors gracefully?',
      a: '<code>http.get(...).pipe(catchError(err =&gt; of(defaultValue)))</code> returns a fallback and keeps the stream alive. For component-level handling: <code>catchError((err: HttpErrorResponse) =&gt; { this.error.set(err.status === 0 ? \'Network error\' : \'Server error\'); return of([]); })</code>. Use <code>retry({ count: 3, delay: 1000 })</code> before <code>catchError</code> to retry automatically.',
    },
    {
      q: 'What is the difference between httpResource() and http.get() + toSignal()?',
      a: '<code>httpResource()</code> (Angular 19+) combines both into one reactive primitive with <code>isLoading()</code>, <code>error()</code>, and <code>value()</code> signals. It automatically re-fetches when signal dependencies in the URL factory change, and cancels in-flight requests. Use it for new code; <code>http.get() + toSignal()</code> still works fine for simple one-shot fetches.',
    },
    {
      q: 'When should you use subscribe() directly vs toSignal()?',
      a: 'Use <code>toSignal()</code> for <strong>read operations</strong> (GET) where data drives the template reactively — it handles subscribe/unsubscribe automatically. Use <code>.subscribe()</code> for <strong>mutations</strong> (POST, PUT, DELETE) triggered by user actions, where you need to react to success/error explicitly in component logic. Mutations are one-shot, not reactive state.',
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Providing HttpClient: HttpClientModule vs provideHttpClient()',
      before: `// app.module.ts (deprecated NgModule approach)
import { HttpClientModule } from '@angular/common/http';
@NgModule({
  imports: [HttpClientModule]
})
export class AppModule {}`,
      after: `// app.config.ts (standalone, Angular 15+)
import { provideHttpClient, withInterceptors } from '@angular/common/http';
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([myInterceptorFn]))
  ]
};`,
      note: 'HttpClientModule is deprecated in Angular 15+. Use provideHttpClient() in app.config.ts with optional feature functions.',
    },
    {
      title: 'Consuming HTTP data: subscribe() vs toSignal()',
      before: `// Old: manual subscribe + property
ngOnInit() {
  this.http.get<User[]>('/api/users')
    .subscribe(data => this.users = data);
}
// Leaks if component is destroyed before response arrives`,
      after: `// New: toSignal() — no subscribe, no unsubscribe needed
users = toSignal(
  this.http.get<User[]>('/api/users').pipe(
    catchError(() => of([]))
  ),
  { initialValue: [] }
);`,
      note: 'toSignal() auto-unsubscribes on destroy and integrates with Angular\'s signal reactivity — no lifecycle hook needed.',
    },
    {
      title: 'Interceptors: class-based HttpInterceptor vs HttpInterceptorFn',
      before: `// Old: class implementing HttpInterceptor
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req.clone({
      setHeaders: { Authorization: 'Bearer x' }
    }));
  }
}`,
      after: `// New: plain function — HttpInterceptorFn
export const authInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { Authorization: 'Bearer x' } }));
// Register: provideHttpClient(withInterceptors([authInterceptor]))`,
      note: 'Functional interceptors are tree-shakeable and require no @Injectable decorator or class boilerplate.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not piping catchError before toSignal() — signal stalls on error',
      wrong: `// Any HTTP error kills the Observable — signal stays undefined forever
todos = toSignal(
  this.http.get<Todo[]>('/api/todos')
);`,
      right: `// Always add catchError so the signal has a recoverable value
todos = toSignal(
  this.http.get<Todo[]>('/api/todos').pipe(
    catchError(() => of(null))
  ),
  { initialValue: undefined }  // undefined=loading, null=error
);`,
      explanation: 'Without catchError, any HTTP error propagates and terminates the Observable permanently. toSignal() cannot recover — the signal stays in its last state. Always pipe catchError to return a fallback Observable.',
    },
    {
      title: 'Using mergeMap instead of switchMap for search — stale results',
      wrong: `search$.pipe(
  mergeMap(q => this.http.get('/api?q=' + q))
).subscribe(res => this.results.set(res));
// Older slow response can overwrite newer faster response`,
      right: `search$.pipe(
  debounceTime(350),
  switchMap(q => this.http.get('/api?q=' + q))
).subscribe(res => this.results.set(res));`,
      explanation: 'mergeMap keeps all in-flight requests alive — if an older, slower request resolves after a newer one, it overwrites the correct results. switchMap cancels the previous request when a new value arrives, preventing this race condition.',
    },
    {
      title: 'Mutating HttpRequest directly in an interceptor',
      wrong: `const interceptor: HttpInterceptorFn = (req, next) => {
  req.headers.set('Authorization', 'Bearer token'); // no-op! returns new obj
  return next(req); // original req sent — header NOT included
};`,
      right: `const interceptor: HttpInterceptorFn = (req, next) => {
  const authReq = req.clone({ setHeaders: { Authorization: 'Bearer token' } });
  return next(authReq); // cloned req with header sent
};`,
      explanation: 'HttpRequest is immutable. req.headers.set() returns a new HttpHeaders object but does not modify req. Always use req.clone() to produce a modified copy, then forward the clone with next().',
    },
    {
      title: 'Not using takeUntilDestroyed() — subscription leaks from long-lived streams',
      wrong: `constructor() {
  this.search$.pipe(
    switchMap(q => this.http.get('/api?q=' + q))
  ).subscribe(res => this.results.set(res));
  // subscription never completes — leaks after component destroy
}`,
      right: `constructor() {
  this.search$.pipe(
    switchMap(q => this.http.get('/api?q=' + q)),
    takeUntilDestroyed()  // completes when component is destroyed
  ).subscribe(res => this.results.set(res));
}`,
      explanation: 'Unlike a single HttpClient.get() (which completes after one emission), Subject-based streams never complete on their own. Without takeUntilDestroyed(), the subscription remains active after the component is destroyed, causing memory leaks.',
    },
    {
      title: 'Forgetting provideHttpClient() — NullInjectorError at runtime',
      wrong: `// app.config.ts — missing provideHttpClient()
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)]
};
// Error: NullInjectorError: No provider for HttpClient!`,
      right: `// app.config.ts — add provideHttpClient()
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ]
};`,
      explanation: 'HttpClient is not available by default. Without provideHttpClient() in app.config.ts, any component or service that injects HttpClient throws NullInjectorError at runtime. This is the most common HttpClient setup mistake in standalone Angular apps.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Angular\'s <code>HttpClient</code> returns cold Observables; convert to signals with <code>toSignal()</code> or the modern <code>httpResource()</code> (Angular 19+), add functional interceptors via <code>provideHttpClient(withInterceptors([...]))</code>, and use <code>switchMap + debounceTime + takeUntilDestroyed()</code> for reactive search.',
    mustKnow: [
      '<code>provideHttpClient()</code> is required in <code>app.config.ts</code> — omitting it causes <code>NullInjectorError</code>',
      'Always pipe <code>catchError(() =&gt; of(fallback))</code> before <code>toSignal()</code> — errors without it permanently stall the signal',
      '<code>HttpRequest</code> is immutable — always <code>req.clone({ setHeaders: ... })</code> in interceptors, never mutate directly',
      'Use <code>switchMap</code> for search (cancels old requests), not <code>mergeMap</code> (keeps all alive, risks stale results)',
      '<code>takeUntilDestroyed()</code> is required for long-lived streams (Subjects, intervals) — single <code>http.get()</code> calls auto-complete',
      '<code>httpResource(() =&gt; \`/api/\${this.id()}\`)</code> re-fetches automatically when signals in the URL factory change (Angular 19+)',
      'Use <code>subscribe()</code> for mutations (POST/PUT/DELETE); use <code>toSignal()</code> for reads (GET)',
    ],
    interviewFocus: [
      'What is the difference between switchMap and mergeMap, and why does it matter for HTTP search?',
      'Why must you clone an HttpRequest in an interceptor?',
      'What happens if you forget catchError before toSignal()?',
      'When would you use httpResource() vs http.get() + toSignal()?',
      'How does takeUntilDestroyed() differ from manual ngOnDestroy unsubscription?',
    ],
  };

  challenge: Challenge = {
    title: 'Fetch with Error Handling',
    description: 'Write an Angular component that fetches a list of posts from JSONPlaceholder, converts to a signal with toSignal(), and handles errors gracefully with catchError. Display a loading state, error state, and the post list.',
    language: 'typescript',
    hints: [
      'inject(HttpClient).get<Post[]>(url).pipe(catchError(() => of(null)))',
      'Wrap with toSignal(obs$, { initialValue: undefined })',
      'undefined = loading, null = error, Post[] = success',
      'Use takeUntilDestroyed() for any Subject-based streams',
    ],
    starterCode: `import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

interface Post { id: number; title: string; }

@Component({ selector: 'app-posts', standalone: true, template: \`
  @if (posts() === undefined) { <p>Loading…</p> }
  @else if (posts() === null) { <p class="error">Failed to load</p> }
  @else {
    @for (p of posts()!; track p.id) { <p>{{ p.title }}</p> }
  }
\` })
export class PostsComponent {
  private http = inject(HttpClient);

  // TODO: fetch posts with error handling, expose as a signal
  posts = /* ... */;
}`,
    solution: `import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

interface Post { id: number; title: string; }

@Component({ selector: 'app-posts', standalone: true, template: \`
  @if (posts() === undefined) { <p>Loading…</p> }
  @else if (posts() === null) { <p class="error">Failed to load</p> }
  @else {
    @for (p of posts()!; track p.id) { <p>{{ p.title }}</p> }
  }
\` })
export class PostsComponent {
  private http = inject(HttpClient);

  posts = toSignal(
    this.http
      .get<Post[]>('https://jsonplaceholder.typicode.com/posts?_limit=5')
      .pipe(catchError(() => of(null))),
    { initialValue: undefined }
  );
}`,
  };
}
