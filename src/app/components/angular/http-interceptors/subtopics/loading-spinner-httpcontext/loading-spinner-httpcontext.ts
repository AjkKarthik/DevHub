import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-loading-spinner-httpcontext-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './loading-spinner-httpcontext.html',
  styleUrl: './loading-spinner-httpcontext.scss',
})
export class LoadingSpinnerHttpcontextSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A pending-request counter, driven from the interceptor',
      points: [
        'Track in-flight requests with a signal counter: increment it when a request STARTS, decrement it when the request ENDS — whether it succeeded, failed, or was unsubscribed early. RxJS\'s <code>finalize()</code> operator is the right tool for the "ends no matter what" part, since it runs on completion, error, AND unsubscription alike — unlike putting decrement logic only in a <code>next</code>/<code>error</code> callback pair, which misses the unsubscribed-before-completing case.',
        'Doing this in ONE interceptor (rather than every component manually toggling its own loading flag) means the global spinner reflects EVERY in-flight request in the app automatically, with zero per-component boilerplate.',
      ],
    },
    {
      heading: 'HttpContext — a typed, per-request bag of metadata',
      points: [
        '<code>HttpContext</code> lets a caller attach typed metadata to ONE SPECIFIC request that interceptors can read. Define a token once: <code>export const SKIP_LOADING = new HttpContextToken&lt;boolean&gt;(() =&gt; false);</code> — the function passed is the DEFAULT value used when a request does not set it explicitly.',
        'Pass it at the call site: <code>http.get(url, { context: new HttpContext().set(SKIP_LOADING, true) })</code>. The interceptor reads it: <code>if (!req.context.get(SKIP_LOADING)) pendingCount.update(n =&gt; n + 1)</code>.',
      ],
    },
    {
      heading: 'Which requests should opt out',
      points: [
        'Background polling requests (checking for new notifications every 30 seconds), silent token-refresh calls, and analytics/telemetry pings should all set <code>SKIP_LOADING: true</code> — a full-page spinner flickering on every silent background poll is a real, visible UX bug, not a cosmetic nitpick.',
        'HttpContext data is scoped to exactly ONE request — it is not a global variable. Each call site that wants to opt out has to set it explicitly on that specific request; there is no way to "opt out by default" from inside the interceptor itself (though the interceptor could of course choose a different default if genuinely needed).',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/loading.service.ts',
      content: `import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private count = signal(0);
  readonly isLoading = () => this.count() > 0;

  increment() { this.count.update(n => n + 1); }
  decrement() { this.count.update(n => Math.max(0, n - 1)); }
}
`,
    },
    {
      path: 'src/app/loading.interceptor.ts',
      content: `import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpContextToken } from '@angular/common/http';
import { finalize } from 'rxjs';
import { LoadingService } from './loading.service';

export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  const skip = req.context.get(SKIP_LOADING);

  if (!skip) loading.increment();

  return next(req).pipe(
    // finalize() runs on success, error, OR early unsubscribe — always decrements correctly
    finalize(() => { if (!skip) loading.decrement(); }),
  );
};
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { App } from './app/app';
import { loadingInterceptor } from './app/loading.interceptor';

bootstrapApplication(App, {
  providers: [provideHttpClient(withInterceptors([loadingInterceptor]))],
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { LoadingService } from './loading.service';
import { SKIP_LOADING } from './loading.interceptor';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    @if (loading.isLoading()) {
      <p>⏳ Loading… (global spinner would show here)</p>
    }
    <button (click)="normalRequest()">Normal request (shows spinner)</button>
    <button (click)="backgroundPoll()">Background poll (SKIP_LOADING — no spinner)</button>
  \`,
})
export class App {
  private http = inject(HttpClient);
  loading = inject(LoadingService);

  normalRequest() {
    this.http.get('https://jsonplaceholder.typicode.com/posts/1').subscribe();
  }

  backgroundPoll() {
    this.http
      .get('https://jsonplaceholder.typicode.com/posts/1', {
        context: new HttpContext().set(SKIP_LOADING, true),
      })
      .subscribe(() => console.log('Background poll completed silently — no spinner shown.'));
  }
}
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Loading spinner and HttpContext</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a second HttpContextToken, REQUEST_LABEL, that lets a call site attach a string label (e.g. "posts-list"), and have loadingInterceptor log that label when the request starts, defaulting to "unlabeled" if not set.',
    hint: 'export const REQUEST_LABEL = new HttpContextToken<string>(() => \'unlabeled\'); then inside the interceptor: const label = req.context.get(REQUEST_LABEL); console.log(\'Starting:\', label); — call sites that care can pass context: new HttpContext().set(REQUEST_LABEL, \'posts-list\').',
    solution: `export const REQUEST_LABEL = new HttpContextToken<string>(() => 'unlabeled');

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  const skip = req.context.get(SKIP_LOADING);
  const label = req.context.get(REQUEST_LABEL);

  console.log('Starting:', label);
  if (!skip) loading.increment();

  return next(req).pipe(
    finalize(() => { if (!skip) loading.decrement(); }),
  );
};

// Call site:
// http.get(url, { context: new HttpContext().set(REQUEST_LABEL, 'posts-list') })`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'incrementing in next and decrementing in error/complete callbacks is equivalent to using finalize().',
      reality: 'finalize() runs in EVERY case — success, error, AND early unsubscription — while separate next/error callbacks miss the unsubscribed-before-completing case entirely, which can leave the pending counter permanently stuck above zero.',
    },
    {
      thought: 'every HTTP request in the app should trigger the global loading spinner — that is the whole point of centralizing it.',
      reality: 'background polling, silent token refresh, and analytics pings are exactly the requests that should NOT trigger a visible spinner — HttpContext\'s SKIP_LOADING token exists specifically so these can opt out per-request.',
    },
    {
      thought: 'HttpContext data persists across multiple requests, like a shared global variable set once.',
      reality: 'HttpContext is scoped to exactly ONE request — each call site that wants a non-default value must set it explicitly on that specific request object; it is not shared or remembered between separate calls.',
    },
  ];
}
