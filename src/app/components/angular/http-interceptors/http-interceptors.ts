import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-http-interceptors',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, BeforeAfterComponent, PrerequisitesComponent,
  ],
  templateUrl: './http-interceptors.html',
  styleUrl: './http-interceptors.scss',
})
export class HttpInterceptorsDemo {

  prerequisites: Prerequisite[] = [
    { label: 'HTTP Client', route: '/angular/http' },
    { label: 'Dependency Injection', route: '/angular/di' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'HttpInterceptorFn',         type: 'type',     desc: '(req, next) => Observable<HttpEvent<unknown>> — the functional interceptor signature', since: 'Angular 15' },
    { name: 'HttpHandlerFn',             type: 'type',     desc: 'The next function — call next(req) or next(clonedReq) to continue the chain', since: 'Angular 15' },
    { name: 'withInterceptors([fn, …])', type: 'function', desc: 'Register functional interceptors on provideHttpClient(). Order = request order', since: 'Angular 15' },
    { name: 'req.clone({…})',            type: 'method',   desc: 'Create a modified copy of the request — ALWAYS clone before mutating', since: 'Angular 2' },
    { name: 'req.headers.set(k, v)',     type: 'method',   desc: 'Return a new Headers object with the key added — headers are immutable', since: 'Angular 2' },
    { name: 'HttpContext',               type: 'class',    desc: 'Per-request key-value store for signalling interceptors (e.g. skip auth)', since: 'Angular 12' },
    { name: 'new HttpContextToken<T>()', type: 'function', desc: 'Define a typed token for use in HttpContext — default value in the factory', since: 'Angular 12' },
    { name: 'catchError',               type: 'operator', desc: 'Handle HTTP errors in the response stream (401 → refresh, 500 → error page)', since: 'RxJS 6' },
    { name: 'retry(n)',                  type: 'operator', desc: 'Retry failed requests up to n times — use retryWhen for exponential backoff', since: 'RxJS 6' },
    { name: 'tap()',                     type: 'operator', desc: 'Observe response without modifying — used for logging, timing, and caching side effects', since: 'RxJS 6' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What interceptors are and why you need them',
      points: [
        'An HTTP interceptor is a function that sits in the request/response pipeline — it runs for every <code>HttpClient</code> call in the app. Think of it as middleware for HTTP: modify requests going out, transform or observe responses coming back.',
        'The request pipeline runs interceptors in the order they are registered. The response pipeline runs them in reverse order. If you register <code>[authInterceptor, loggingInterceptor]</code>, auth sees the request first but loggingInterceptor sees the response first.',
        'Common uses: attaching auth tokens to every outbound request, logging all HTTP calls for debugging, showing a global loading spinner, retrying on transient 401s after a token refresh, mapping error responses to friendly messages.',
        'Since Angular 15, interceptors are plain functions (<code>HttpInterceptorFn</code>) that use <code>inject()</code> to access services — no <code>@Injectable</code> class needed.',
      ],
    },
    {
      heading: 'The functional interceptor signature and request cloning',
      points: [
        'Signature: <code>(req: HttpRequest&lt;unknown&gt;, next: HttpHandlerFn) =&gt; Observable&lt;HttpEvent&lt;unknown&gt;&gt;</code>. You receive the current request, modify it (if needed), and call <code>next(modifiedReq)</code> to pass it down the chain.',
        '<strong>Never mutate the request directly</strong> — HttpRequest is immutable by design. Always call <code>req.clone({ headers: req.headers.set(\'Authorization\', token) })</code> to produce a new request with your changes.',
        'Headers are also immutable: <code>req.headers.set(key, value)</code> returns a <em>new</em> Headers object. The shorthand <code>req.clone({ setHeaders: { Authorization: token } })</code> does both steps in one.',
        'Calling <code>next(req)</code> without any modification is a valid pass-through — used in conditional interceptors that only act in certain cases.',
      ],
    },
    {
      heading: 'Auth token injection pattern',
      points: [
        'Inject <code>AuthService</code> with <code>inject(AuthService)</code> inside the interceptor function body. Read the token synchronously: <code>const token = auth.getToken()</code>.',
        'If the token is null (user not logged in), call <code>next(req)</code> without modification — don\'t add an empty "Bearer null" header.',
        'For OAuth flows, tokens expire. The standard approach on a 401 response: call the refresh endpoint, store the new token, then retry the original request with <code>switchMap</code>. Only refresh once even if multiple requests 401 simultaneously — use a shared Observable and <code>shareReplay(1)</code>.',
        'Use <code>HttpContext</code> with a <code>SKIP_AUTH</code> token on public endpoints so the auth interceptor can opt out: <code>if (req.context.get(SKIP_AUTH)) return next(req);</code>.',
      ],
    },
    {
      heading: 'Error handling and retry strategies',
      points: [
        'Catch errors in the interceptor with <code>pipe(catchError(err =&gt; { ... }))</code>. A <code>HttpErrorResponse</code> carries <code>status</code>, <code>error</code> (the body), and <code>url</code>.',
        'Common status mappings: 401 → attempt token refresh; 403 → navigate to /forbidden; 0 (offline/CORS) → show connectivity error; 5xx → show "service unavailable" banner.',
        '<code>retry(3)</code> retries immediately. For exponential backoff, use <code>retryWhen(errors =&gt; errors.pipe(delayWhen((_, i) =&gt; timer(1000 * Math.pow(2, i)))))</code>. Only retry on network errors and 5xx — never on 4xx client errors.',
        'Interceptors are the right place for global error handling, but component-level errors (404 on a specific resource) are better handled locally so the component can show contextual UI.',
      ],
    },
    {
      heading: 'Loading spinner and HttpContext for opt-out',
      points: [
        'Track pending requests with a counter signal: increment on each request start (tap on the outbound side), decrement on response or error (finalize).',
        '<code>HttpContext</code> lets you pass per-request metadata that interceptors can read. Define a token: <code>export const SKIP_LOADING = new HttpContextToken&lt;boolean&gt;(() =&gt; false)</code>. Pass it: <code>http.get(url, { context: new HttpContext().set(SKIP_LOADING, true) })</code>.',
        'The interceptor reads it: <code>if (!req.context.get(SKIP_LOADING)) pendingCount.update(n =&gt; n + 1)</code>. Background polling requests, silent refresh calls, and analytics pings should set <code>SKIP_LOADING: true</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Auth interceptor',
      language: 'typescript',
      code: `// auth.interceptor.ts
import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpContextToken, HttpContext } from '@angular/common/http';

// Token to skip auth on public endpoints
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  // Skip auth for public endpoints
  if (req.context.get(SKIP_AUTH)) return next(req);

  const token = auth.getToken();
  if (!token) return next(req);

  // Clone the request — never mutate directly
  const authReq = req.clone({
    setHeaders: { Authorization: \`Bearer \${token}\` },
  });

  return next(authReq);
};

// Registration in app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor, loggingInterceptor, errorInterceptor])
    ),
    provideRouter(appRoutes),
  ],
};

// Usage — skip auth on a specific request
http.post('/auth/login', credentials, {
  context: new HttpContext().set(SKIP_AUTH, true),
})`,
    },
    {
      label: 'Logging interceptor',
      language: 'typescript',
      code: `// logging.interceptor.ts — logs method, URL, status, and timing
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap, finalize } from 'rxjs/operators';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const start = performance.now();
  const label = \`\${req.method} \${req.urlWithParams}\`;

  console.group(\`→ \${label}\`);
  console.log('Headers:', req.headers.keys());

  return next(req).pipe(
    tap({
      next: event => {
        if (event instanceof HttpResponse) {
          const ms = (performance.now() - start).toFixed(0);
          console.log(\`← \${event.status} in \${ms}ms\`);
        }
      },
      error: err => {
        const ms = (performance.now() - start).toFixed(0);
        console.error(\`✗ \${err.status} in \${ms}ms\`, err.message);
      },
    }),
    finalize(() => console.groupEnd()),
  );
};`,
    },
    {
      label: 'Error interceptor + 401 refresh',
      language: 'typescript',
      code: `// error.interceptor.ts — handles 401 token refresh and global errors
import {
  HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/refresh')) {
        // Attempt token refresh then replay the original request
        return auth.refreshToken().pipe(
          switchMap(newToken => {
            const retried = req.clone({
              setHeaders: { Authorization: \`Bearer \${newToken}\` },
            });
            return next(retried);
          }),
          catchError(refreshErr => {
            // Refresh failed — log out and redirect
            auth.logout();
            router.navigate(['/login']);
            return throwError(() => refreshErr);
          }),
        );
      }

      if (err.status === 403) {
        router.navigate(['/forbidden']);
      }

      if (err.status === 0) {
        console.error('Network error or CORS — no response received');
      }

      return throwError(() => err);
    }),
  );
};`,
    },
    {
      label: 'Loading spinner + HttpContext',
      language: 'typescript',
      code: `// loading.interceptor.ts — global pending-request counter with opt-out
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpContextToken, HttpContext } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { LoadingService } from './loading.service';

export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_LOADING)) return next(req);

  const loading = inject(LoadingService);
  loading.increment();

  return next(req).pipe(
    finalize(() => loading.decrement()),
  );
};

// loading.service.ts — signal-based counter
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private count = signal(0);
  readonly isLoading = computed(() => this.count() > 0);

  increment() { this.count.update(n => n + 1); }
  decrement() { this.count.update(n => Math.max(0, n - 1)); }
}

// app.html — global spinner
@if (loading.isLoading()) {
  <div class="global-spinner">Loading…</div>
}

// Usage — skip the spinner for background polling
http.get('/api/metrics', {
  context: new HttpContext().set(SKIP_LOADING, true),
})`,
    },
    {
      label: 'Class → functional migration',
      language: 'typescript',
      code: `// BEFORE: class-based interceptor (Angular < 15, still works but deprecated)
@Injectable()
export class OldAuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.auth.getToken();
    if (!token) return next.handle(req);
    return next.handle(req.clone({
      setHeaders: { Authorization: \`Bearer \${token}\` },
    }));
  }
}
// Registered in providers: { provide: HTTP_INTERCEPTORS, useClass: OldAuthInterceptor, multi: true }

// AFTER: functional interceptor (Angular 15+)
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (!token) return next(req);
  return next(req.clone({
    setHeaders: { Authorization: \`Bearer \${token}\` },
  }));
};
// Registered in provideHttpClient(withInterceptors([authInterceptor]))

// MIGRATION NOTE:
// - HTTP_INTERCEPTORS provider array → withInterceptors([...])
// - HttpInterceptor interface → HttpInterceptorFn type
// - constructor injection → inject()
// - next.handle(req) → next(req)
// - Multi-interceptor ordering is now explicit in the array order`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Class-based vs functional interceptor',
      language: 'typescript',
      before: `@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler) {
    const token = this.auth.getToken();
    return next.handle(
      token ? req.clone({ setHeaders: { Authorization: \`Bearer \${token}\` } }) : req
    );
  }
}
// providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }]`,
      after: `export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  return next(
    token ? req.clone({ setHeaders: { Authorization: \`Bearer \${token}\` } }) : req
  );
};
// provideHttpClient(withInterceptors([authInterceptor]))`,
      note: 'Functional interceptors need no class, no @Injectable, no multi:true. inject() replaces constructor injection. next() replaces next.handle().',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Mutating the request directly instead of cloning',
      wrong: `export const badInterceptor: HttpInterceptorFn = (req, next) => {
  req.headers.set('Authorization', token);  // no-op — headers are immutable!
  return next(req);  // request goes out without the header
};`,
      right: `export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({
    setHeaders: { Authorization: \`Bearer \${token}\` },
  }));
};`,
      explanation: 'HttpRequest and its headers are immutable. req.headers.set() returns a new object — it does not modify in place. Use req.clone({ setHeaders: {...} }) to produce a new request with your changes.',
    },
    {
      title: 'Forgetting to call next() — the request never goes out',
      wrong: `export const brokenInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('Intercepted:', req.url);
  // FORGOT to return next(req) — all HTTP requests hang forever!
};`,
      right: `export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('Intercepted:', req.url);
  return next(req);  // always return next() to continue the chain
};`,
      explanation: 'The interceptor chain is an Observable pipeline. Returning nothing (undefined) or an empty Observable means the request never reaches the server. Always return next(req) or next(clonedReq).',
    },
    {
      title: 'Retrying on 4xx client errors',
      wrong: `// Retrying a 400 Bad Request or 404 Not Found is pointless — the response will not change
return next(req).pipe(
  retry(3),  // retries ALL errors including 4xx
);`,
      right: `return next(req).pipe(
  retry({
    count: 3,
    // Only retry on network errors (status 0) or 5xx server errors
    delay: (err: HttpErrorResponse) => {
      if (err.status === 0 || err.status >= 500) return timer(1000);
      throw err;  // 4xx: don't retry, propagate immediately
    },
  }),
);`,
      explanation: 'Retrying 400, 401, 403, or 404 wastes bandwidth and delays error reporting. Only retry transient failures: network errors (status 0) and server errors (5xx). 4xx errors are client-side bugs — retrying will not fix them.',
    },
    {
      title: 'Not sharing the token refresh Observable — concurrent 401s cause multiple refreshes',
      wrong: `// If 3 requests all 401 simultaneously, this fires 3 separate refresh calls
catchError(err => err.status === 401
  ? auth.refreshToken().pipe(switchMap(token => next(retried)))
  : throwError(() => err)
)`,
      right: `// Share the refresh Observable so concurrent 401s only trigger one refresh
let refresh$: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(catchError(err => {
    if (err.status !== 401) return throwError(() => err);
    if (!refresh$) {
      refresh$ = inject(AuthService).refreshToken().pipe(
        shareReplay(1),
        finalize(() => refresh$ = null),
      );
    }
    return refresh$.pipe(switchMap(token => next(req.clone({ setHeaders: { Authorization: \`Bearer \${token}\` } }))));
  }));
};`,
      explanation: 'Without sharing, concurrent requests that all get 401 will each trigger a token refresh. The second and third refreshes fail (old token already revoked) or produce race conditions. Share the refresh Observable to deduplicate.',
    },
    {
      title: 'Using class-based interceptors with the new functional API',
      wrong: `// Mixing old and new APIs breaks — HTTP_INTERCEPTORS and withInterceptors don't stack cleanly
providers: [
  provideHttpClient(withInterceptors([functionalInterceptor])),
  { provide: HTTP_INTERCEPTORS, useClass: OldClassInterceptor, multi: true },  // silently ignored or conflicts
]`,
      right: `// Migrate all interceptors to functional style
providers: [
  provideHttpClient(
    withInterceptors([authInterceptor, loggingInterceptor, errorInterceptor])
  ),
]
// For legacy class-based interceptors during gradual migration, use:
// withInterceptorsFromDi() alongside withInterceptors()`,
      explanation: 'withInterceptors() and HTTP_INTERCEPTORS can coexist via withInterceptorsFromDi(), but mixing them is a migration smell. Convert all interceptors to functional style for a consistent, type-safe setup.',
    },
  ];

  challenge: Challenge = {
    title: 'Build an auth interceptor with 401 retry',
    language: 'typescript',
    description: `Implement a functional auth interceptor that:
1. Adds a Bearer token from AuthService to every request
2. Skips auth for requests with SKIP_AUTH context token set to true
3. On a 401 response: calls auth.refreshToken(), then retries the original request once with the new token
4. On a refresh failure: calls auth.logout() and navigates to /login

Also implement a loading interceptor that increments/decrements a shared LoadingService counter, with a SKIP_LOADING context token to opt out.`,
    hints: [
      'Use req.clone({ setHeaders: { Authorization: "Bearer " + token } }) to attach the token',
      'SKIP_AUTH = new HttpContextToken<boolean>(() => false) — check req.context.get(SKIP_AUTH)',
      'For 401 retry: catchError → check err.status === 401 → refreshToken() → switchMap → next(retried)',
      'For loading: inject(LoadingService) then finalize(() => loading.decrement()) in pipe()',
      'Use shareReplay(1) on the refresh$ observable to prevent duplicate refresh calls',
    ],
    starterCode: `import { HttpContextToken, HttpInterceptorFn, HttpErrorResponse, HttpContext } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, finalize } from 'rxjs';

export const SKIP_AUTH    = new HttpContextToken<boolean>(() => false);
export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);

// TODO: implement authInterceptor
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  throw new Error('not implemented');
};

// TODO: implement loadingInterceptor
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  throw new Error('not implemented');
};`,
    solution: `import {
  HttpContextToken, HttpInterceptorFn, HttpErrorResponse,
  HttpContext, HttpRequest
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, finalize, shareReplay } from 'rxjs';
import { signal, computed } from '@angular/core';
import { Injectable } from '@angular/core';

export const SKIP_AUTH    = new HttpContextToken<boolean>(() => false);
export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private count = signal(0);
  readonly isLoading = computed(() => this.count() > 0);
  increment() { this.count.update(n => n + 1); }
  decrement() { this.count.update(n => Math.max(0, n - 1)); }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (req.context.get(SKIP_AUTH)) return next(req);

  const token = auth.getToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: \`Bearer \${token}\` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) return throwError(() => err);
      return auth.refreshToken().pipe(
        switchMap(newToken => next(req.clone({
          setHeaders: { Authorization: \`Bearer \${newToken}\` },
        }))),
        catchError(refreshErr => {
          auth.logout();
          router.navigate(['/login']);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_LOADING)) return next(req);
  const loading = inject(LoadingService);
  loading.increment();
  return next(req).pipe(finalize(() => loading.decrement()));
};`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'How do you register functional interceptors in Angular 15+?',
      options: [
        '{ provide: HTTP_INTERCEPTORS, useValue: myFn, multi: true }',
        'provideHttpClient(withInterceptors([myFn]))',
        'HttpClientModule.forRoot({ interceptors: [myFn] })',
        'Annotate the function with @Interceptor()',
      ],
      answer: 1,
      explanation: 'Functional interceptors are registered via withInterceptors() inside provideHttpClient(). The old HTTP_INTERCEPTORS multi-provider is for class-based interceptors and can coexist via withInterceptorsFromDi().',
    },
    {
      q: 'Why must you call req.clone() instead of modifying req directly?',
      options: [
        'HttpRequest extends a sealed class that throws on direct mutation',
        'HttpRequest is immutable — req.headers.set() returns a new object, it does not mutate',
        'clone() is required by the TypeScript compiler due to readonly fields',
        'Direct mutation works but clone() is the convention',
      ],
      answer: 1,
      explanation: 'HttpRequest and HttpHeaders are immutable by design. Methods like headers.set() return a new instance rather than mutating. req.clone({ setHeaders: {...} }) creates a new request with your changes applied.',
    },
    {
      q: 'In what order does Angular execute multiple registered interceptors for a response?',
      options: [
        'Same order as registered — first to last for both request and response',
        'Request phase: first to last. Response phase: last to first (reverse)',
        'Alphabetical order by function name',
        'Parallel — all interceptors receive the response simultaneously',
      ],
      answer: 1,
      explanation: 'The request pipeline flows through interceptors in registration order (first to last). The response Observable unwinds in reverse, so the last registered interceptor sees the response first. This mirrors middleware stacks in Express and ASP.NET Core.',
    },
    {
      q: 'What is HttpContext used for?',
      options: [
        'Passing authentication credentials to the server',
        'Storing per-request metadata that interceptors can read',
        'Setting CORS headers on outbound requests',
        'Controlling HTTP/2 multiplexing behaviour',
      ],
      answer: 1,
      explanation: 'HttpContext is a per-request key-value store. You define tokens with HttpContextToken and set them on a request. Interceptors read the context to make per-request decisions — e.g. skipping auth or loading on specific calls.',
    },
    {
      q: 'What happens if an interceptor function returns without calling next()?',
      options: [
        'The request is sent without going through further interceptors',
        'The request never reaches the server — the Observable never emits',
        'Angular throws a runtime error immediately',
        'The request is cancelled and an error is thrown to the caller',
      ],
      answer: 1,
      explanation: 'The interceptor chain is an Observable pipeline. If you return undefined or an Observable that never emits, the request never reaches the server and the caller\'s subscription never completes. Always return next(req) or next(clonedReq).',
    },
    {
      q: 'Why should you NOT retry a 400 Bad Request in an error interceptor?',
      options: [
        'Angular prohibits retrying 4xx status codes',
        '400 is a client error — the response will be identical on retry; it is a waste of bandwidth',
        'retry() only works on network errors, not HTTP status codes',
        'Retrying a 400 crashes the HttpClient',
      ],
      answer: 1,
      explanation: '4xx errors are client errors — bad input, invalid auth, resource not found. The server will return the same response on retry. Only retry transient failures: network errors (status 0) and 5xx server errors which may resolve on their own.',
    },
    {
      q: 'What is the correct way to add a single header to an existing request?',
      options: [
        "req.headers['Authorization'] = 'Bearer ' + token",
        "req.clone({ setHeaders: { Authorization: 'Bearer ' + token } })",
        "req.setHeader('Authorization', 'Bearer ' + token)",
        "new HttpRequest(req.method, req.url, { headers: { Authorization: token } })",
      ],
      answer: 1,
      explanation: 'req.clone({ setHeaders: {...} }) is the idiomatic way. It creates a new HttpRequest with the specified headers merged into the existing headers. setHeaders merges; headers replaces the entire HttpHeaders object.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I migrate a class-based interceptor to functional?',
      a: 'Three mechanical changes: (1) Remove @Injectable and implements HttpInterceptor; make it an exported const of type HttpInterceptorFn. (2) Replace constructor(private service: Service) with inject(Service) inside the function body. (3) Replace next.handle(req) with next(req). Then in app.config.ts, remove the HTTP_INTERCEPTORS provider and add the function to withInterceptors([...]) inside provideHttpClient().',
    },
    {
      q: 'How do I handle a 401 token refresh without triggering multiple refreshes for concurrent requests?',
      a: 'Keep a module-level refresh$ variable. On 401: if refresh$ is null, call auth.refreshToken().pipe(shareReplay(1), finalize(() => refresh$ = null)) and assign it. All concurrent 401s reuse the same refresh$. After it emits, each caller uses the new token to retry their original request. The finalize resets refresh$ to null so the next session starts fresh.',
    },
    {
      q: 'Can I use signals inside interceptors?',
      a: 'Yes — signals are synchronous and inject() works inside interceptor functions because Angular runs them in an injection context. You can inject(AuthService) where isLoggedIn is a signal and call auth.isLoggedIn() directly. For async signal updates triggered by interceptor results, use effect() in a service rather than inside the interceptor itself.',
    },
    {
      q: 'What is the difference between setHeaders and headers in req.clone()?',
      a: 'setHeaders merges the provided key-value pairs into the existing headers — existing headers are preserved. headers replaces the entire HttpHeaders object — all previous headers are discarded. Use setHeaders when you only want to add or overwrite specific headers. Use headers only when you need full control over the headers sent.',
    },
    {
      q: 'How do I skip an interceptor for a specific request?',
      a: 'Define an HttpContextToken: const SKIP_AUTH = new HttpContextToken(() => false). In the interceptor: if (req.context.get(SKIP_AUTH)) return next(req). When making the request: http.get(url, { context: new HttpContext().set(SKIP_AUTH, true) }). Context tokens are scoped to the request — they do not persist across interceptors or requests.',
    },
    {
      q: 'Should I put error handling in interceptors or in components?',
      a: 'Use interceptors for cross-cutting concerns: 401 refresh, 403 redirect, network-offline banner, logging. Use component-level error handling for contextual errors where the UI response depends on which operation failed — a 404 on "load user profile" should show an inline "user not found" message, not a global redirect. Interceptors handle "what to do when any request fails"; components handle "what to show when THIS request fails".',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'HTTP interceptors are <strong>functions in the request/response pipeline</strong> — use them for auth tokens, logging, error handling, and loading indicators without touching individual HTTP calls.',
    mustKnow: [
      'Signature: <code>(req, next) => Observable&lt;HttpEvent&gt;</code> — always <strong>return next(clonedReq)</strong> to continue the chain',
      '<code>req.clone({ setHeaders: {...} })</code> — requests are immutable; always clone before modifying',
      'Request order = registration order; response order = reverse of registration order',
      '<code>HttpContextToken</code> + <code>HttpContext</code> — per-request opt-out flags (SKIP_AUTH, SKIP_LOADING)',
      '401 refresh: <code>catchError → refreshToken() → switchMap → retry</code>; share with <code>shareReplay(1)</code> to avoid duplicate refreshes',
      'Only retry on status 0 and 5xx — never on 4xx client errors',
    ],
    interviewFocus: [
      '<strong>Why clone?</strong> — HttpRequest is immutable; headers.set() returns a new object; clone merges changes atomically',
      '<strong>Interceptor order for responses?</strong> — reverse of registration order (last interceptor sees response first)',
      '<strong>How to skip an interceptor?</strong> — HttpContextToken + req.context.get(TOKEN) in the interceptor',
      '<strong>Handling concurrent 401s?</strong> — share a single refresh Observable with shareReplay(1) at module scope',
    ],
  };
}
