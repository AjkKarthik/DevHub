import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, Subject, debounceTime, distinctUntilChanged, switchMap, tap, startWith } from 'rxjs';
import { TruncatePipe } from '../../pipes/truncate.pipe';
import { HighlightDirective } from '../../directives/highlight.directive';
import { CodeBlockComponent, CodeTab } from '../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../shared/version-badge/version-badge';
import { PageMetaComponent } from '../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../shared/page-complete/page-complete';

interface ApiTodo {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
}

@Component({
  selector: 'app-http-demo',
  imports: [TruncatePipe, HighlightDirective, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
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

  // ── Search demo ──────────────────────────────────────────────────────────
  searchQuery   = signal('');
  searchLoading = signal(false);
  searchError   = signal<string | null>(null);
  searchResults = signal<{ name: string; url: string }[]>([]);

  private search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      tap(()  => { this.searchLoading.set(true); this.searchError.set(null); }),
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

  qna: QnaItem[] = [
    { q: 'How do you provide HttpClient in Angular 15+ without HttpClientModule?', a: '<code>provideHttpClient()</code> in <code>app.config.ts</code> replaces <code>HttpClientModule</code>. Add interceptors with <code>provideHttpClient(withInterceptors([myFn]))</code>.' },
    { q: 'How does an interceptor work?', a: 'An interceptor is a function: <code>(req: HttpRequest, next: HttpHandlerFn) => Observable&lt;HttpEvent&gt;</code>. Clone and modify the request with <code>req.clone({ headers: ... })</code>, then call <code>next(clonedReq)</code>.' },
    { q: 'Why must you clone an HttpRequest in an interceptor?', a: '<code>HttpRequest</code> is immutable — you cannot modify it in place. <code>req.clone({ setHeaders: { Authorization: \'Bearer \' + token } })</code> creates a modified copy. The original is discarded.' },
    { q: 'How do you convert an Observable response to a signal?', a: '<code>const data = toSignal(this.http.get&lt;T[]&gt;(\'/api/items\'), { initialValue: [] })</code>. <code>toSignal()</code> subscribes once and auto-unsubscribes on destroy. The signal always has the latest value.' },
    { q: 'How do you handle HTTP errors gracefully?', a: '<code>http.get(...).pipe(catchError(err => of(defaultValue)))</code> returns a fallback. For component-level handling: <code>catchError(err => { this.error.set(err.message); return EMPTY; })</code>.' },
    { q: 'What is the difference between httpResource() and http.get() + toSignal()?', a: '<code>httpResource()</code> (Angular 19+) combines both into one signal with <code>isLoading()</code>, <code>error()</code>, and <code>value()</code>. It cancels in-flight requests automatically. Use it for new code; <code>http.get() + toSignal()</code> still works fine.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'HttpClient basics',
      points: [
        'provideHttpClient() replaces the old HttpClientModule — add it in app.config.ts providers.',
        'inject(HttpClient) gives you a typed HTTP service anywhere in Angular\'s DI tree.',
        'http.get<T>(url) returns a cold Observable — nothing executes until you subscribe or use async pipe.',
        'Use toSignal(http.get<T>(url)) to convert an Observable to a signal with automatic unsubscription.',
      ],
    },
    {
      heading: 'Interceptors',
      points: [
        'HttpInterceptorFn is a plain function: (req, next) => next(req.clone({ ... })).',
        'Register with withInterceptors([myFn]) inside provideHttpClient() in app.config.ts.',
        'Interceptors run in order — set auth headers, log, or retry inside them.',
        'req.clone() is required — HttpRequest is immutable; always create a modified copy.',
      ],
    },
    {
      heading: 'Error handling',
      points: [
        'catchError(err => of(fallback)) in a pipe prevents the Observable from completing with an error.',
        'Use throwError(() => new Error()) to propagate errors up for component-level handling.',
        'HttpErrorResponse has status (e.g. 404, 500) and error (parsed body) properties.',
        'retry(3) or retryWhen() automatically re-attempts failed requests before propagating the error.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'Always provide a type parameter: http.get<User[]>(url) — prevents unsafe any.',
        'Use HttpParams for query strings — do not manually concatenate URL strings.',
        'Observables from HttpClient complete after one emission — no need to unsubscribe.',
        'httpResource() (Angular 19+) wraps HttpClient with a signal interface — no toSignal() needed.',
      ],
    },
  ];

  httpTabs: CodeTab[] = [
    {
      label: 'httpResource() — modern (v19+)',
      language: 'typescript',
      code: `// httpResource() — signals-native HTTP: no subscribe, no toSignal()
import { httpResource } from '@angular/common/http';
import { signal, computed } from '@angular/core';

export class ProductsComponent {
  selectedId = signal(1);

  // Reactive: re-fetches automatically when selectedId() changes
  product = httpResource<Product>(() => \`/api/products/\${this.selectedId()}\`);

  // Built-in status signals:
  // product.isLoading()  → boolean
  // product.value()      → Product | undefined
  // product.error()      → unknown
  // product.status()     → 'idle' | 'loading' | 'resolved' | 'error'

  // Use in template:
  // @if (product.isLoading()) { <spinner /> }
  // @if (product.value()) { <p>{{ product.value()!.name }}</p> }
  // @if (product.error()) { <p>Failed to load</p> }
}

// POST/PUT/DELETE still use http.post().subscribe() — httpResource is GET-only`,
    },
    {
      label: 'Search with loading state',
      language: 'typescript',
      code: `// Pattern: typed search with debounce, loading flag, error recovery
export class UserSearchComponent {
  private http = inject(HttpClient);

  query   = signal('');
  loading = signal(false);
  error   = signal<string | null>(null);
  results = signal<User[]>([]);

  private search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      tap(() => { this.loading.set(true); this.error.set(null); }),
      switchMap(q => this.http.get<User[]>('/api/users?q=' + q).pipe(
        catchError(err => { this.error.set(err.message); return of([]); })
      )),
      takeUntilDestroyed(),
    ).subscribe(users => {
      this.results.set(users);
      this.loading.set(false);
    });
  }

  onInput(val: string) {
    this.query.set(val);
    this.search$.next(val);
  }
}`,
    },
    {
      label: 'HttpClient + toSignal()',
      language: 'typescript',
      code: `
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

export class HttpDemo {
  private http = inject(HttpClient);

  // toSignal() wraps an Observable into a signal.
  // Angular auto-unsubscribes when the component is destroyed.
  todos = toSignal(
    this.http
      .get<Todo[]>('https://jsonplaceholder.typicode.com/todos?_limit=10')
      .pipe(catchError(() => of(null))),
    { initialValue: undefined } // undefined = loading, null = error
  );

  // Manual subscribe for one-off mutations (POST/PUT/DELETE)
  createTodo() {
    this.http
      .post<Todo>('/api/todos', { title: 'New', completed: false })
      .subscribe(res => console.log('Created:', res));
  }
}`,
    },
    {
      label: 'Interceptor (add header + log)',
      language: 'typescript',
      code: `
// src/app/interceptors/logging.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  // Clone request — requests are immutable
  const authReq = req.clone({
    setHeaders: { Authorization: 'Bearer my-token' },
  });

  const started = Date.now();
  return next(authReq).pipe(
    tap(() => console.log(\`\${req.method} \${req.url} — \${Date.now() - started}ms\`))
  );
};

// Register in app.config.ts:
// provideHttpClient(withInterceptors([loggingInterceptor]))`,
    },
    {
      label: 'Custom pipe (truncate)',
      language: 'typescript',
      code: `
// src/app/pipes/truncate.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate' })
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 40, trail = '…'): string {
    return value.length > limit
      ? value.slice(0, limit) + trail
      : value;
  }
}

// Usage in template:
// {{ longText | truncate:45 }}
// {{ longText | truncate:20:'...' }}`,
    },
    {
      label: 'Highlight directive',
      language: 'typescript',
      code: `
// src/app/directives/highlight.directive.ts
import { Directive, ElementRef, HostListener, input } from '@angular/core';

@Directive({ selector: '[appHighlight]' })
export class HighlightDirective {
  appHighlight = input('#fff3cd'); // input signal with default

  constructor(private el: ElementRef<HTMLElement>) {}

  @HostListener('mouseenter') onEnter() {
    this.el.nativeElement.style.backgroundColor = this.appHighlight();
  }
  @HostListener('mouseleave') onLeave() {
    this.el.nativeElement.style.backgroundColor = '';
  }
}

// Usage in template:
// <li appHighlight="#fff9c4">Hover over me</li>`,
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
        ? of([])                // don't fetch for empty/short queries
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

<!-- Status panel — great for debugging signal values -->
<p>Loading: {{ searchLoading() }} | Results: {{ searchResults().length }}</p>`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'How do you provide HttpClient in Angular 22?', options: ['Import HttpClientModule in AppModule', 'provideHttpClient() in app.config.ts providers', 'Add HttpClient to @Component imports', 'It\'s available by default'], answer: 1, explanation: 'Angular 22 uses standalone config. Add provideHttpClient() (optionally with withInterceptors([...])) to the providers array in app.config.ts.' },
    { q: 'What does toSignal() do?', options: ['Converts a signal to an Observable', 'Wraps an Observable to return a signal that updates reactively', 'Makes a signal async', 'Delays signal updates'], answer: 1, explanation: 'toSignal(obs$) subscribes to the Observable and returns a Signal<T>. It auto-unsubscribes when the component is destroyed via DestroyRef.' },
    { q: 'Which RxJS operator prevents a new HTTP request on every keystroke?', options: ['mergeMap', 'concatMap', 'debounceTime + switchMap', 'exhaustMap'], answer: 2, explanation: 'debounceTime waits for typing to pause, then switchMap cancels the previous request and fires a new one — the standard type-ahead pattern.' },
    { q: 'What does catchError return to prevent the stream from dying?', options: ['null', 'EMPTY or of(fallbackValue)', 'throwError()', 'undefined'], answer: 1, explanation: 'catchError must return a new Observable. EMPTY completes silently; of(fallback) emits a default value — both keep the outer stream alive.' },
    { q: 'What is takeUntilDestroyed() used for?', options: ['Cancelling HTTP requests', 'Auto-unsubscribing when the component is destroyed', 'Limiting the number of emissions', 'Preventing multiple subscriptions'], answer: 1, explanation: 'takeUntilDestroyed(destroyRef) completes an Observable when the component\'s DestroyRef notifies — cleaner than Subject-based manual unsubscription.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'HttpClient', type: 'class', desc: 'Angular\'s built-in HTTP service for making typed GET, POST, PUT, DELETE requests that return Observables.', since: '2' },
    { name: 'provideHttpClient', type: 'function', desc: 'Standalone function added to app.config.ts providers that replaces the old HttpClientModule.', since: '15' },
    { name: 'toSignal', type: 'function', desc: 'Converts an Observable into a Signal that auto-unsubscribes when the component is destroyed.', since: '16' },
    { name: 'takeUntilDestroyed', type: 'function', desc: 'RxJS operator that completes an Observable when the component\'s DestroyRef notifies, avoiding manual unsubscription.', since: '16' },
    { name: 'HttpInterceptorFn', type: 'interface', desc: 'Functional interceptor type — a plain function (req, next) => Observable<HttpEvent> registered via withInterceptors().', since: '15' },
    { name: 'withInterceptors', type: 'function', desc: 'Registers an array of HttpInterceptorFn functions inside provideHttpClient() in app.config.ts.', since: '15' },
    { name: 'catchError', type: 'operator', desc: 'RxJS operator that intercepts an errored Observable and returns a fallback Observable to keep the stream alive.', since: '2' },
    { name: 'switchMap', type: 'operator', desc: 'RxJS operator that cancels the previous inner Observable and subscribes to the new one — essential for type-ahead search.', since: '2' },
    { name: 'httpResource', type: 'function', desc: 'Angular 19+ signals-native HTTP wrapper that exposes value(), isLoading(), error(), and status() signals with automatic re-fetching.', since: '19' },
    { name: 'HttpErrorResponse', type: 'class', desc: 'Typed error object thrown by HttpClient containing status code, statusText, and parsed error body.', since: '2' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Providing HttpClient: HttpClientModule vs provideHttpClient()',
      before: `// app.module.ts (old NgModule approach)
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
      note: 'HttpClientModule is deprecated in Angular 15+. Use provideHttpClient() in app.config.ts.',
    },
    {
      title: 'Consuming HTTP data: subscribe + property vs toSignal()',
      before: `// Old: manual subscribe + ngOnDestroy cleanup
ngOnInit() {
  this.http.get<User[]>('/api/users')
    .subscribe(data => this.users = data);
}`,
      after: `// New: toSignal() — no subscribe, no unsubscribe needed
users = toSignal(
  this.http.get<User[]>('/api/users').pipe(
    catchError(() => of([]))
  ),
  { initialValue: [] }
);`,
      note: 'toSignal() auto-unsubscribes on destroy and integrates with Angular\'s signal reactivity.',
    },
    {
      title: 'Interceptors: class-based vs functional HttpInterceptorFn',
      before: `// Old: class implementing HttpInterceptor
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req.clone({ setHeaders: { Authorization: 'Bearer x' } }));
  }
}`,
      after: `// New: plain function — HttpInterceptorFn
export const authInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { Authorization: 'Bearer x' } }));
// Register: provideHttpClient(withInterceptors([authInterceptor]))`,
      note: 'Functional interceptors are tree-shakeable and require no @Injectable decorator.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting to handle errors — stream dies silently',
      wrong: `todos = toSignal(
  this.http.get<Todo[]>('/api/todos')
);`,
      right: `todos = toSignal(
  this.http.get<Todo[]>('/api/todos').pipe(
    catchError(() => of(null))
  ),
  { initialValue: undefined }
);`,
      explanation: 'Without catchError, any HTTP error propagates and kills the Observable. toSignal() cannot recover, leaving the signal stuck. Always pipe catchError to return a fallback value.',
    },
    {
      title: 'Using mergeMap instead of switchMap for search — stale results',
      wrong: `search$.pipe(
  mergeMap(q => this.http.get('/api?q=' + q))
).subscribe(res => this.results.set(res));`,
      right: `search$.pipe(
  debounceTime(350),
  switchMap(q => this.http.get('/api?q=' + q))
).subscribe(res => this.results.set(res));`,
      explanation: 'mergeMap keeps all in-flight requests alive, so older responses can overwrite newer ones. switchMap cancels the previous request when a new value arrives, preventing race conditions.',
    },
    {
      title: 'Mutating HttpRequest directly in an interceptor',
      wrong: `const authInterceptor: HttpInterceptorFn = (req, next) => {
  req.headers.set('Authorization', 'Bearer token'); // no-op!
  return next(req);
};`,
      right: `const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authReq = req.clone({ setHeaders: { Authorization: 'Bearer token' } });
  return next(authReq);
};`,
      explanation: 'HttpRequest is immutable. Calling req.headers.set() returns a new Headers object but does not modify req. Always use req.clone() to produce a modified copy.',
    },
    {
      title: 'Not using takeUntilDestroyed() — memory leak from long-lived streams',
      wrong: `constructor() {
  this.search$.pipe(
    switchMap(q => this.http.get('/api?q=' + q))
  ).subscribe(res => this.results.set(res));
}`,
      right: `constructor() {
  this.search$.pipe(
    switchMap(q => this.http.get('/api?q=' + q)),
    takeUntilDestroyed()
  ).subscribe(res => this.results.set(res));
}`,
      explanation: 'Unlike single HttpClient.get() calls, a Subject-based stream never completes on its own. Without takeUntilDestroyed(), the subscription leaks after the component is destroyed.',
    },
  ];

  versionItems: VersionInfo[] = [
    {
      version: 'Angular 15',
      label: 'Standalone HttpClient + Functional Interceptors',
      features: [
        'provideHttpClient() replaces HttpClientModule for standalone apps',
        'HttpInterceptorFn — interceptors are now plain functions, not @Injectable classes',
        'withInterceptors([fn]) registers functional interceptors inside provideHttpClient()',
      ],
    },
    {
      version: 'Angular 19',
      label: 'httpResource() — Signals-native HTTP',
      features: [
        'httpResource() combines HttpClient + toSignal() into one reactive primitive',
        'Exposes value(), isLoading(), error(), and status() signals out of the box',
        'Automatically re-fetches when signal dependencies used in the URL factory change',
        'Cancels in-flight requests when dependencies change or component is destroyed',
      ],
    },
  ];

  challenge: Challenge = {
    title: 'Fetch with Error Handling',
    description: 'Write an Angular component that fetches a list of posts from JSONPlaceholder, converts to a signal with toSignal(), and handles errors gracefully with catchError.',
    language: 'typescript',
    hints: [
      'inject(HttpClient).get<Post[]>(url)',
      'Pipe with catchError(() => of([]))',
      'Wrap with toSignal(obs$, { initialValue: [] })',
      'Use takeUntilDestroyed() for cleanup'
    ],
    starterCode: `import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

interface Post { id: number; title: string; }

@Component({ selector: 'app-posts', standalone: true, template: \`
  @for (p of posts(); track p.id) { <p>{{ p.title }}</p> }
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
  @for (p of posts(); track p.id) { <p>{{ p.title }}</p> }
\` })
export class PostsComponent {
  private http = inject(HttpClient);

  posts = toSignal(
    this.http.get<Post[]>('https://jsonplaceholder.typicode.com/posts?_limit=5').pipe(
      catchError(() => of([] as Post[]))
    ),
    { initialValue: [] as Post[] }
  );
}`,
  };
}
