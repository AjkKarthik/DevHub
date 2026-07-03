import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-auth-interceptor-token-refresh-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './auth-interceptor-token-refresh.html',
  styleUrl: './auth-interceptor-token-refresh.scss',
})
export class AuthInterceptorTokenRefreshSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The basic pattern — attach a token, skip when there is none',
      points: [
        'Inject the auth service inside the interceptor function body: <code>const auth = inject(AuthService); const token = auth.getToken();</code>. If <code>token</code> is null (the user is not logged in), call <code>next(req)</code> UNMODIFIED — do not attach a header with a literal <code>"Bearer null"</code> value, which some backends will happily accept as a broken, confusing "authenticated as null" request.',
        'When a token exists: <code>return next(req.clone({ setHeaders: { Authorization: \`Bearer \${token}\` } }));</code>.',
      ],
    },
    {
      heading: 'The hard part — refreshing an expired token exactly once',
      points: [
        'On a <code>401</code> response, the standard flow is: call the refresh endpoint, store the new token, then RETRY the original request with the new token via <code>switchMap</code> — all inside the interceptor, transparently to whatever code originally made the call. The caller never sees the 401 at all if the refresh-and-retry succeeds.',
        'The genuinely tricky part: if SEVERAL requests all get a 401 at roughly the same moment (a common real scenario — several parallel API calls made when a page loads, all using the same now-expired token), you must NOT call the refresh endpoint once per failing request. That would send multiple simultaneous refresh calls, and depending on the backend, later ones might invalidate tokens issued by earlier ones.',
        'The fix: keep a single SHARED refresh Observable (e.g. a class field on the auth service), created only once and reused by every 401 handler in flight, via <code>shareReplay(1)</code>. Every concurrent 401 handler subscribes to the SAME in-flight refresh call instead of starting its own — the refresh genuinely happens exactly once no matter how many requests failed at the same time.',
      ],
    },
    {
      heading: 'Opting out — public endpoints should not carry a token at all',
      points: [
        'Some endpoints (a public status page, a login/register call) should never get an auth header, even when a token exists. <code>HttpContext</code> lets a specific request opt a specific interceptor out: define <code>export const SKIP_AUTH = new HttpContextToken&lt;boolean&gt;(() =&gt; false);</code>, pass it on the call site — <code>http.get(url, { context: new HttpContext().set(SKIP_AUTH, true) })</code> — and check it first thing in the interceptor: <code>if (req.context.get(SKIP_AUTH)) return next(req);</code>.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/auth.service.ts',
      content: `import { Injectable, signal } from '@angular/core';
import { Observable, of, shareReplay, delay, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private token = signal<string | null>('expired-token');

  // Shared, in-flight refresh call — reused by every concurrent 401 handler.
  // Cleared once the refresh completes, so the NEXT expiry starts a fresh one.
  private refreshInFlight$: Observable<string> | null = null;

  getToken() { return this.token(); }

  refreshToken(): Observable<string> {
    if (!this.refreshInFlight$) {
      console.log('Starting refresh — this should only ever log ONCE per expiry, no matter how many requests 401 at once');
      this.refreshInFlight$ = of('fresh-token-' + Date.now()).pipe(
        delay(500), // simulate a network round-trip
        tap(newToken => this.token.set(newToken)),
        shareReplay(1),
      );
      this.refreshInFlight$.subscribe(() => { this.refreshInFlight$ = null; });
    }
    return this.refreshInFlight$;
  }
}
`,
    },
    {
      path: 'src/app/auth.interceptor.ts',
      content: `import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const authedReq = token
    ? req.clone({ setHeaders: { Authorization: \`Bearer \${token}\` } })
    : req; // no token — pass through unmodified, no "Bearer null"

  return next(authedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) return throwError(() => err);

      // Refresh (or join an already-in-flight refresh), then retry the ORIGINAL request
      return auth.refreshToken().pipe(
        switchMap(newToken =>
          next(req.clone({ setHeaders: { Authorization: \`Bearer \${newToken}\` } })),
        ),
      );
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
import { authInterceptor } from './app/auth.interceptor';

bootstrapApplication(App, {
  providers: [provideHttpClient(withInterceptors([authInterceptor]))],
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <button (click)="fireThree()">Fire 3 parallel requests (simulated token is expired)</button>
    <p>Watch the console — the refresh should log exactly once, not three times.</p>
  \`,
})
export class App {
  private http = inject(HttpClient);

  fireThree() {
    for (let i = 0; i < 3; i++) {
      this.http.get('https://jsonplaceholder.typicode.com/posts/1').subscribe();
    }
  }
}
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Auth interceptor and token refresh</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add SKIP_AUTH HttpContext support to authInterceptor — a request passing { context: new HttpContext().set(SKIP_AUTH, true) } should bypass the Authorization header entirely, even if a token exists.',
    hint: 'export const SKIP_AUTH = new HttpContextToken<boolean>(() => false); at the top of auth.interceptor.ts, then add `if (req.context.get(SKIP_AUTH)) return next(req);` as the FIRST line inside the interceptor function, before the token-attaching logic.',
    solution: `import { HttpContextToken } from '@angular/common/http';

export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_AUTH)) {
    return next(req); // opted out — no Authorization header attached
  }

  const auth = inject(AuthService);
  // ...rest of the interceptor unchanged
};

// Call site:
// http.get(publicUrl, { context: new HttpContext().set(SKIP_AUTH, true) })`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'each request that gets a 401 should independently call the refresh endpoint in its own catchError handler.',
      reality: 'if several requests 401 at roughly the same time, calling refresh once per request sends MULTIPLE simultaneous refresh calls — the fix is a single SHARED in-flight refresh Observable (via shareReplay(1)) that every concurrent 401 handler subscribes to, so the refresh happens exactly once.',
    },
    {
      thought: 'when there is no token yet, you should still attach an Authorization header so the shape of the request is consistent.',
      reality: 'sending "Bearer null" (or "Bearer undefined") is a real bug some backends mishandle unpredictably — when there is no token, the correct behavior is to call next(req) completely unmodified.',
    },
    {
      thought: 'after a 401 triggers a token refresh, the ORIGINAL caller has to detect the failure and manually retry the request.',
      reality: 'the interceptor retries the original request itself, transparently, via switchMap inside the same pipe — the code that made the original call never even sees the 401 if the refresh-and-retry succeeds.',
    },
  ];
}
