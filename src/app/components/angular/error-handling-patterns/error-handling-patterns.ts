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
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-error-handling-patterns',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, PrerequisitesComponent,
  ],
  templateUrl: './error-handling-patterns.html',
  styleUrl: './error-handling-patterns.scss',
})
export class ErrorHandlingPatternsDemo {

  prerequisites: Prerequisite[] = [
    { label: 'HTTP Client',        route: '/angular/http' },
    { label: 'HTTP Interceptors',  route: '/angular/http-interceptors' },
    { label: 'RxJS Operators',     route: '/angular/rxjs' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'ErrorHandler',              type: 'class',    desc: 'Angular\'s global error handler — override handleError(err) to log uncaught errors', since: 'Angular 2' },
    { name: 'catchError(fn)',            type: 'operator', desc: 'RxJS operator — catch a stream error, return a fallback observable or rethrow', since: 'RxJS 6' },
    { name: 'EMPTY',                     type: 'token',    desc: 'An Observable that completes immediately — use as catchError fallback to swallow errors gracefully', since: 'RxJS 6' },
    { name: 'retry(n) / retryWhen',      type: 'operator', desc: 'Retry a failed observable n times before propagating the error', since: 'RxJS 6' },
    { name: 'HttpErrorResponse',         type: 'class',    desc: 'Typed HTTP error from HttpClient — has status, statusText, error, url properties', since: 'Angular 4' },
    { name: '@defer { @error { } }',     type: 'syntax',   desc: 'Template-level error boundary — shows @error block if the deferred component throws on load', since: 'Angular 17' },
    { name: 'inject(ErrorHandler)',      type: 'function', desc: 'Access the global error handler from any service to manually log errors', since: 'Angular 14' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Error handling layers in Angular',
      points: [
        'Angular applications have three distinct error handling layers: <strong>global</strong> (catches uncaught errors from anywhere), <strong>HTTP</strong> (centralises API error handling via interceptors), and <strong>local</strong> (component/template-level handling for specific scenarios).',
        'Each layer has a different scope and purpose. Global handles the last resort — if nothing else caught an error, it lands here. HTTP handles all server communication errors in one place. Local handles specific user-facing error states with appropriate UI feedback.',
        'A well-structured Angular app uses all three: global for logging/alerting, HTTP for auth redirects and toast notifications, local for inline form/component error states. They are complementary, not alternatives.',
      ],
    },
    {
      heading: 'Global ErrorHandler — the last resort',
      points: [
        'Angular\'s <code>ErrorHandler</code> is called for any error that is not caught elsewhere in the app — including errors thrown in change detection, errors in component constructors, and uncaught Promise rejections (in some configurations).',
        'Override it by implementing <code>ErrorHandler</code> and providing it: <code>{ provide: ErrorHandler, useClass: GlobalErrorHandler }</code>. The <code>handleError(error)</code> method receives the raw Error object.',
        'The primary use of a custom ErrorHandler is to forward errors to a logging service (Sentry, Datadog, a backend endpoint). It should NOT attempt to recover the application state — by the time an error reaches the global handler, the application is likely in an inconsistent state.',
        'Always call the original behavior (logging to console) in addition to your custom logic, especially during development. Without it, errors are silently swallowed and very hard to debug.',
      ],
    },
    {
      heading: 'HTTP error handling via interceptors',
      points: [
        'The HTTP interceptor is the right place for cross-cutting HTTP error handling: automatic 401 → login redirect, 429 → retry with backoff, 5xx → toast notification, network errors → offline banner.',
        'Use <code>catchError</code> in the interceptor to intercept errors from <code>next(req)</code>. The error is an <code>HttpErrorResponse</code> with <code>.status</code> (HTTP code), <code>.error</code> (parsed response body), and <code>.url</code>.',
        'For per-request error handling that differs from the global policy (e.g., a 404 on an optional resource should not show an error toast), use <code>HttpContext</code> with an <code>HttpContextToken</code> to opt specific requests out of global error handling.',
        'Return <code>throwError(() => err)</code> from <code>catchError</code> to re-propagate the error to the caller after handling it (e.g., after showing a toast). Return <code>EMPTY</code> to swallow it.',
      ],
    },
    {
      heading: '@defer error boundaries and local signals',
      points: [
        'Angular 17+ <code>@defer</code> blocks have a built-in error boundary: <code>@error { &lt;app-error-placeholder /&gt; }</code>. If the lazily-loaded component fails to load or throws during initialization, the <code>@error</code> block renders instead. No try/catch needed.',
        'For component-level error state, a simple signal pattern works well: <code>error = signal&lt;string | null&gt;(null)</code>. Set it on failure, clear it on retry. The template shows the error state reactively.',
        'For async operations (HTTP calls), the resource() API provides <code>resource.error()</code> — a signal that holds the error thrown by the loader. No manual error state management needed.',
        'Avoid <code>try/catch</code> in templates — Angular templates cannot throw; template expressions that throw cause the whole component to fail to render. Keep error handling in the class.',
      ],
    },
    {
      heading: 'Typed error states — beyond console.error',
      points: [
        'Define an error state type per operation: <code>type LoadState = { status: "loading" } | { status: "success"; data: T } | { status: "error"; message: string; code: number }</code>. This makes all states explicit in the type system.',
        'With signals: <code>state = signal&lt;LoadState&gt;({ status: "loading" })</code>. Template uses <code>@switch</code> on <code>state().status</code>. Every state has a named UI.',
        'For HTTP APIs that follow RFC 7807 / ProblemDetails (<code>{ type, title, status, detail }</code>), parse the error response body from <code>err.error</code> and surface the <code>detail</code> string directly — it\'s designed for user display.',
        'Never display raw error.message to users — it can contain stack traces, internal file paths, or sensitive data. Map known error codes to user-friendly messages; have a generic fallback.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Global ErrorHandler',
      language: 'typescript',
      code: `import { ErrorHandler, Injectable, inject } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private logger = inject(LoggingService);
  private notifier = inject(NotificationService);

  handleError(error: unknown): void {
    // Always log to console in dev
    console.error('[GlobalErrorHandler]', error);

    // Forward to monitoring service (Sentry, Datadog, etc.)
    this.logger.captureException(error);

    // Show a generic user notification
    this.notifier.showError('An unexpected error occurred. Please refresh.');
  }
}

// app.config.ts — register the custom handler
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideRouter(routes),
    provideHttpClient(),
  ],
};

// Using the error handler to log manually from any service
@Injectable({ providedIn: 'root' })
export class DataService {
  private errorHandler = inject(ErrorHandler);

  loadData() {
    // Manually forward non-HTTP errors to the global handler
    this.somePromise().catch(err => this.errorHandler.handleError(err));
  }
}`,
    },
    {
      label: 'HTTP error interceptor',
      language: 'typescript',
      code: `import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router    = inject(Router);
  const notifier  = inject(NotificationService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      switch (err.status) {
        case 401:
          // Token expired → redirect to login with return URL
          router.navigate(['/login'], {
            queryParams: { returnUrl: router.url },
          });
          break;

        case 403:
          notifier.showError('You do not have permission for this action.');
          break;

        case 404:
          // Let the caller handle 404 — don't show a global toast
          break;

        case 429:
          notifier.showWarning('Too many requests. Please wait a moment.');
          break;

        default:
          if (err.status >= 500) {
            // Show ProblemDetails detail if available (RFC 7807)
            const detail = err.error?.detail ?? 'Server error. Please try again.';
            notifier.showError(detail);
          }
      }

      return throwError(() => err);  // re-propagate for local handlers
    }),
  );
};

// app.config.ts
provideHttpClient(withInterceptors([errorInterceptor, authInterceptor]))`,
    },
    {
      label: 'Per-request opt-out with HttpContext',
      language: 'typescript',
      code: `import { HttpContextToken, HttpContext } from '@angular/common/http';

// Token to opt a specific request out of global error toasts
export const SILENT_ERROR = new HttpContextToken<boolean>(() => false);

// Interceptor — check the context token
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const silent = req.context.get(SILENT_ERROR);
  const notifier = inject(NotificationService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (!silent && err.status >= 500) {
        notifier.showError('Server error. Please try again.');
      }
      return throwError(() => err);
    }),
  );
};

// In a component — opt out for this specific call
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);

  // 404 on avatar is expected — don't show error toast
  getAvatar(userId: string) {
    return this.http.get(\`/api/avatars/\${userId}\`, {
      context: new HttpContext().set(SILENT_ERROR, true),
    }).pipe(
      catchError(() => of(DEFAULT_AVATAR)),  // handle locally
    );
  }
}`,
    },
    {
      label: 'Component error state with signals',
      language: 'typescript',
      code: `type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [AsyncPipe],
  template: \`
    @switch (state().status) {
      @case ('loading') { <app-skeleton /> }
      @case ('error')   { <app-error-card [message]="state().message" (retry)="load()" /> }
      @case ('success') { <app-profile-view [user]="state().data" /> }
    }
  \`,
})
export class UserProfileComponent {
  state = signal<LoadState<User>>({ status: 'idle' });

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
  ) {
    effect(() => {
      const id = this.route.snapshot.paramMap.get('id')!;
      this.load(id);
    });
  }

  load(id?: string) {
    this.state.set({ status: 'loading' });
    this.userService.getUser(id ?? this.currentId).subscribe({
      next: data  => this.state.set({ status: 'success', data }),
      error: err  => this.state.set({
        status: 'error',
        message: this.toUserMessage(err),
      }),
    });
  }

  private toUserMessage(err: HttpErrorResponse): string {
    if (err.status === 404) return 'User not found.';
    if (err.status === 0)   return 'Cannot connect. Check your network.';
    return err.error?.detail ?? 'Something went wrong. Please retry.';
  }
}`,
    },
    {
      label: '@defer error boundary',
      language: 'html',
      code: `<!-- Template-level error boundary with @defer -->
@defer (when isVisible()) {
  <!-- If this component fails to load or throws, @error renders -->
  <app-heavy-dashboard />
} @loading {
  <app-skeleton [rows]="5" />
} @error {
  <!-- Error boundary — renders when the deferred block fails -->
  <div class="error-boundary">
    <p>Failed to load the dashboard.</p>
    <button (click)="retryDashboard()">Retry</button>
  </div>
} @placeholder {
  <div class="placeholder">Dashboard loading soon...</div>
}

<!-- resource() API — built-in error signal -->
@if (userResource.isLoading()) {
  <app-spinner />
} @else if (userResource.error()) {
  <p class="error">{{ friendlyError(userResource.error()) }}</p>
} @else {
  <app-user-view [user]="userResource.value()!" />
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Swallowing errors silently in catchError',
      wrong: `// catchError must return an Observable — but EMPTY swallows the error
this.http.get('/api/data').pipe(
  catchError(() => EMPTY)  // caller never knows about the failure
).subscribe(data => this.data.set(data));`,
      right: `// Option A: handle + rethrow so the caller can also react
catchError((err: HttpErrorResponse) => {
  this.notifier.showError('Load failed');
  return throwError(() => err);  // caller's error callback fires
})

// Option B: return a safe fallback value
catchError(() => of(defaultValue))  // caller gets a value, not an error`,
      explanation: 'EMPTY completes the stream immediately with no value and no error. The subscriber\'s next and error callbacks never fire. Use it only when the error is fully handled and no downstream reaction is needed.',
    },
    {
      title: 'Showing raw error.message to users',
      wrong: `error: (err) => this.errorMessage.set(err.message)
// Could display: "Http failure response for /api/users: 500 Internal Server Error"
// Or: "Cannot read properties of undefined (reading 'name')"`,
      right: `error: (err: HttpErrorResponse) => {
  if (err.status === 0)   { this.errorMessage.set('Network error. Check your connection.'); return; }
  if (err.status === 404) { this.errorMessage.set('Item not found.'); return; }
  this.errorMessage.set(err.error?.detail ?? 'Something went wrong. Please try again.');
}`,
      explanation: 'Raw error messages contain internal details (stack paths, server internals) that confuse users and can expose sensitive info. Map known HTTP status codes to friendly messages; use err.error?.detail for RFC 7807 APIs.',
    },
    {
      title: 'Putting error handling only in the global ErrorHandler',
      wrong: `// Global handler catches everything — but the UI shows a blank page
// because the component never rendered an error state
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(err: unknown) { console.error(err); }
}
// No local error state → user sees empty UI with no explanation`,
      right: `// Global handler: logs + generic notification (last resort)
// HTTP interceptor: status-specific handling (401 redirect, toast)
// Component: specific inline error state with retry button
// All three layers work together — global is the safety net, not the only net`,
      explanation: 'The global ErrorHandler is a last resort — it cannot update component state after a rendering failure. Use it for logging. Use HTTP interceptors for API errors. Use component-level error signals for user-facing feedback.',
    },
    {
      title: 'Not re-throwing from the HTTP interceptor',
      wrong: `export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      this.notifier.showError('Failed');
      return EMPTY;  // Swallows the error — component's error() callback never fires
    }),
  );`,
      right: `export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      this.notifier.showError('Failed');
      return throwError(() => err);  // Component can still react to the error
    }),
  );`,
      explanation: 'If the interceptor swallows the error (returns EMPTY), the component\'s subscribe error callback never fires. The component thinks the request is still pending. Always rethrow from interceptors unless you have a specific reason to suppress.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a layered error handling system',
    language: 'typescript',
    description: `Implement a complete error handling system:
1. A GlobalErrorHandler that logs to console and shows a toast for non-HTTP errors
2. An HTTP error interceptor that handles: 401 (redirect to /login), 5xx (show toast with detail), other errors (rethrow)
3. A ProductListComponent with a typed LoadState signal that shows loading/error/success states with a retry button`,
    hints: [
      'GlobalErrorHandler: implement ErrorHandler, provide as { provide: ErrorHandler, useClass: ... }',
      'HttpErrorResponse has .status, .error (response body), .url',
      'For the component: define type LoadState<T> with idle/loading/success/error variants',
      'In catchError: return throwError(() => err) to rethrow after handling',
      'Component error message: map status codes to strings; use err.error?.detail for ProblemDetails',
    ],
    starterCode: `import { ErrorHandler, Injectable, inject, signal } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { catchError, throwError } from 'rxjs';

// TODO: GlobalErrorHandler
// - log to console
// - show toast for non-HttpErrorResponse errors

// TODO: errorInterceptor: HttpInterceptorFn
// - 401 → router.navigate(['/login'])
// - 5xx → toast with err.error?.detail ?? 'Server error'
// - all: throwError to rethrow

// TODO: ProductListComponent
// - state = signal<LoadState<Product[]>>({ status: 'idle' })
// - load() method
// - template: @switch on state().status`,
    solution: `import { ErrorHandler, Injectable, inject, signal } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

interface Product { id: number; name: string; price: number; }

// 1. Global error handler
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private notifier = inject(NotificationService);
  handleError(error: unknown) {
    console.error('[GlobalErrorHandler]', error);
    if (!(error instanceof HttpErrorResponse)) {
      this.notifier.showError('An unexpected error occurred.');
    }
  }
}

// 2. HTTP interceptor
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router    = inject(Router);
  const notifier  = inject(NotificationService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) router.navigate(['/login']);
      else if (err.status >= 500) {
        notifier.showError(err.error?.detail ?? 'Server error. Please retry.');
      }
      return throwError(() => err);
    }),
  );
};

// 3. Component with typed state
@Component({
  selector: 'app-product-list',
  standalone: true,
  template: \`
    @switch (state().status) {
      @case ('loading') { <p>Loading...</p> }
      @case ('error') {
        <p>{{ state().message }}</p>
        <button (click)="load()">Retry</button>
      }
      @case ('success') {
        @for (p of state().data; track p.id) {
          <div>{{ p.name }} — {{ p.price | currency }}</div>
        }
      }
    }
  \`,
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  state = signal<LoadState<Product[]>>({ status: 'idle' });

  ngOnInit() { this.load(); }

  load() {
    this.state.set({ status: 'loading' });
    this.productService.getProducts().subscribe({
      next: data  => this.state.set({ status: 'success', data }),
      error: (err: HttpErrorResponse) => this.state.set({
        status: 'error',
        message: err.status === 404 ? 'No products found.'
               : err.status === 0   ? 'Network error.'
               : err.error?.detail  ?? 'Failed to load products.',
      }),
    });
  }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary purpose of a custom Angular ErrorHandler?',
      options: [
        'Replacing Angular\'s change detection on error',
        'Catching uncaught errors from anywhere in the app for logging/alerting',
        'Handling HTTP 4xx/5xx errors from HttpClient',
        'Preventing the Angular app from crashing on any error',
      ],
      answer: 1,
      explanation: 'ErrorHandler is the global last-resort for uncaught errors — components not rendering, lifecycle errors, etc. Its primary job is to forward errors to a monitoring service. It cannot fix the app state after an error.',
    },
    {
      q: 'In catchError, what should you return to let the downstream subscriber\'s error callback still fire?',
      options: [
        'EMPTY — completes the stream',
        'throwError(() => err) — re-propagates the error',
        'of(null) — signals a null value',
        'NEVER — blocks the stream indefinitely',
      ],
      answer: 1,
      explanation: 'throwError(() => err) re-propagates the error after you have handled it (e.g., showed a toast). The subscriber\'s error callback fires and can update component state. EMPTY swallows the error and the subscriber gets nothing.',
    },
    {
      q: 'How do you make a single HTTP request skip the global error interceptor toast?',
      options: [
        'Pass { observe: \'events\' } to the HttpClient method',
        'Use HttpContext with an HttpContextToken set on the specific request',
        'Wrap the call in try/catch in the component',
        'Use a different injected HttpClient instance',
      ],
      answer: 1,
      explanation: 'HttpContextToken + HttpContext lets you attach request-specific metadata. The interceptor reads the token and conditionally skips the toast. This is the clean way to have per-request behavior without duplicating interceptor logic.',
    },
    {
      q: 'What does @defer\'s @error block do?',
      options: [
        'Catches JavaScript runtime errors from any component in the template',
        'Renders when the deferred component fails to load or throws during initialization',
        'Displays validation errors for form fields inside the @defer block',
        'It is a shorthand for an NgIf on an error signal',
      ],
      answer: 1,
      explanation: '@error is the @defer error boundary — it renders when the lazy-loaded component chunk fails to download or throws during its first render. It is template-level error isolation, not a general try/catch.',
    },
    {
      q: 'When mapping HTTP errors to user messages, what is the best source for 5xx error text?',
      options: [
        'err.message — Angular\'s built-in user-friendly message',
        'err.error?.detail — the RFC 7807 ProblemDetails field designed for user display',
        'err.statusText — the HTTP status reason phrase',
        'err.stack — the server stack trace',
      ],
      answer: 1,
      explanation: 'RFC 7807 ProblemDetails responses include a "detail" field meant for human consumption. err.error is the parsed response body, so err.error?.detail gives you that message. statusText is often generic ("Internal Server Error"); stack is never user-safe.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use try/catch or catchError for async Angular operations?',
      a: 'Use catchError for RxJS Observable streams (HttpClient calls). Use try/catch for async/await in service methods. In components, avoid both in templates — Angular templates cannot throw; errors in template expressions surface as component rendering failures that bypass your error handling. Keep all error handling in service methods and component class methods.',
    },
    {
      q: 'How do I test my custom ErrorHandler?',
      a: 'Provide the custom handler in TestBed: TestBed.configureTestingModule({ providers: [{ provide: ErrorHandler, useClass: GlobalErrorHandler }] }). Then throw an error and verify via the injected logging/notification service mock. For HTTP error interceptor testing, use HttpClientTestingModule and trigger error responses via HttpTestingController.expectOne().flush(body, { status: 500, statusText: "Server Error" }).',
    },
    {
      q: 'Is it safe to show err.error?.detail from the server directly in the UI?',
      a: 'For APIs you control that follow RFC 7807, yes — the detail field is designed for user display. For third-party APIs or legacy backends, be cautious: the response body might contain stack traces, SQL errors, or internal paths. Sanitize or whitelist the message before rendering. Angular\'s template rendering HTML-escapes interpolated strings, so XSS from a plain string is not a concern, but confusing technical messages are.',
    },
    {
      q: 'What is the difference between retry() and retryWhen() in RxJS?',
      a: 'retry(n) retries the source observable immediately up to n times before propagating the error — good for transient network failures. retryWhen(fn) / retryWhen with delayWhen gives you control over the retry timing: exponential backoff, waiting for online events, limiting retries by error type. In modern RxJS 7+, use retry({ count: 3, delay: 1000 }) for a simple delay between retries without custom operators.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Angular error handling has three complementary layers: <code>ErrorHandler</code> (global last resort for logging), HTTP interceptor (centralized API error handling), and component-level signals (inline user-facing error states with retry).',
    mustKnow: [
      'Override <code>ErrorHandler</code> for logging uncaught errors — not for recovery; always console.error too',
      'HTTP interceptor: <code>catchError</code> → handle → <code>throwError(() => err)</code> to rethrow so components can also react',
      '<code>HttpContextToken</code> — per-request opt-out from global error handling',
      '<code>@defer { @error { } }</code> — template-level error boundary for lazy-loaded components',
      'Never show <code>err.message</code> to users — map status codes to friendly strings; use <code>err.error?.detail</code> for RFC 7807 APIs',
      'Typed <code>LoadState&lt;T&gt;</code> signal — makes all async states (idle/loading/success/error) explicit in the UI',
    ],
    interviewFocus: [
      '<strong>Three layers?</strong> — global ErrorHandler (logging), HTTP interceptor (API errors), component signal (UI feedback)',
      '<strong>catchError return values?</strong> — throwError() to rethrow; EMPTY to swallow; of(fallback) for graceful default',
      '<strong>HttpContext use?</strong> — per-request metadata to opt out of global interceptor behavior',
      '<strong>What not to show users?</strong> — never raw err.message; map status codes; use ProblemDetails detail field',
    ],
  };
}
