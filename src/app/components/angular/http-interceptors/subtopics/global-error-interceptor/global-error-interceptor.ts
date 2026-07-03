import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-global-error-interceptor-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './global-error-interceptor.html',
  styleUrl: './global-error-interceptor.scss',
})
export class GlobalErrorInterceptorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Why centralize error handling at all',
      points: [
        'Without a global error interceptor, every single place in the app that calls <code>HttpClient</code> has to remember to handle 403s, network failures, and 500s consistently — and inevitably some of them will not. An interceptor guarantees ONE place handles these cross-cutting cases for every request in the app, with no way to accidentally forget it in a new component.',
      ],
    },
    {
      heading: 'Common status-code mappings, centralized',
      points: [
        '<code>403</code> → navigate to a forbidden page (the user IS authenticated but lacks permission — different from a 401, which means not authenticated at all). <code>0</code> (offline/CORS) → show a connectivity banner. <code>5xx</code> → show a generic "service unavailable" banner, since the actual server error message is rarely meant for end users.',
        'This is a genuinely different concern from per-request retry logic — a global error interceptor is about presenting a CONSISTENT reaction to failure categories across the whole app, not about squeezing extra successful attempts out of a single flaky request.',
      ],
    },
    {
      heading: 'Global handling and local handling coexist — they are not either/or',
      points: [
        'A global interceptor is the right place for CROSS-CUTTING concerns that apply everywhere (offline banner, 403 redirect). Component-level error handling is still better for CONTEXTUAL cases — a 404 on one specific resource ("This post was not found") deserves a message the component itself is best placed to show, not a generic global banner.',
        'Give components an escape hatch: use <code>HttpContext</code> to let a SPECIFIC request opt out of the global error toast when the component wants to handle that error itself: <code>if (req.context.get(SKIP_ERROR_TOAST)) return next(req);</code> — skipping the interceptor\'s own handling entirely lets the calling component\'s own <code>catchError</code>/observer handle it instead.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/error.interceptor.ts',
      content: `import { HttpInterceptorFn, HttpErrorResponse, HttpContextToken } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (req.context.get(SKIP_ERROR_TOAST)) {
        return throwError(() => err); // caller opted out — let it handle its own error
      }

      if (err.status === 0) {
        console.log('[global] Connectivity error — check your network.');
      } else if (err.status === 403) {
        console.log('[global] Forbidden — navigating to /forbidden.');
      } else if (err.status >= 500) {
        console.log('[global] Service unavailable — try again shortly.');
      } else {
        console.log('[global] Request failed:', err.status);
      }

      return throwError(() => err); // still propagate — the caller may want to react too
    }),
  );
};
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { App } from './app/app';
import { errorInterceptor } from './app/error.interceptor';

bootstrapApplication(App, {
  providers: [provideHttpClient(withInterceptors([errorInterceptor]))],
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { SKIP_ERROR_TOAST } from './error.interceptor';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <button (click)="loadGlobal()">Fail with global handling (check console)</button>
    <button (click)="loadLocal()">Fail with LOCAL handling (opted out)</button>
    <p>{{ status() }}</p>
  \`,
})
export class App {
  private http = inject(HttpClient);
  status = signal('Ready.');

  loadGlobal() {
    this.http.get('https://jsonplaceholder.typicode.com/does-not-exist-403-ish')
      .subscribe({ error: () => this.status.set('Global interceptor logged this one.') });
  }

  loadLocal() {
    this.http
      .get('https://jsonplaceholder.typicode.com/does-not-exist-403-ish', {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true),
      })
      .subscribe({ error: () => this.status.set('Handled LOCALLY — global interceptor stayed silent.') });
  }
}
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Global error interceptor</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a 429 (rate limited) case to the interceptor\'s status branching, logging "[global] Rate limited — please slow down." for that specific status.',
    hint: 'Add another else-if branch: `else if (err.status === 429) { console.log(\'[global] Rate limited — please slow down.\'); }` — place it before the generic 5xx/else fallback so it takes priority for that specific status.',
    solution: `if (err.status === 0) {
  console.log('[global] Connectivity error — check your network.');
} else if (err.status === 403) {
  console.log('[global] Forbidden — navigating to /forbidden.');
} else if (err.status === 429) {
  console.log('[global] Rate limited — please slow down.');
} else if (err.status >= 500) {
  console.log('[global] Service unavailable — try again shortly.');
} else {
  console.log('[global] Request failed:', err.status);
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a global error interceptor means components never need their own catchError/error handling again.',
      reality: 'global and local handling coexist for different purposes — the interceptor handles cross-cutting concerns (offline, forbidden, service-down banners), while contextual errors specific to one request (a 404 on one particular resource) are still better shown by the component that knows what that resource actually is.',
    },
    {
      thought: 'once an interceptor handles an error, individual components have no way to also react to it.',
      reality: 'the interceptor can still re-throw the error after logging/handling its own global concern (throwError(() => err)) — the calling component\'s own subscribe error callback still fires afterward, unless the interceptor deliberately swallows it.',
    },
    {
      thought: 'there is no way to exclude a specific request from the global error interceptor\'s behavior.',
      reality: 'HttpContext gives exactly this escape hatch — a per-request token like SKIP_ERROR_TOAST, checked first thing in the interceptor, lets a specific call opt out and handle its own error locally instead.',
    },
  ];
}
