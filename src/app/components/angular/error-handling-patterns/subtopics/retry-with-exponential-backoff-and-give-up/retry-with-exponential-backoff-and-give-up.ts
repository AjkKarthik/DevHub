import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-retry-with-exponential-backoff-and-give-up-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './retry-with-exponential-backoff-and-give-up.html',
  styleUrl: './retry-with-exponential-backoff-and-give-up.scss',
})
export class RetryWithExponentialBackoffAndGiveUpSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A flat retry count is often the wrong tool',
      points: [
        'The main topic\'s QnA mentions <code>retry({ count: 3, delay: 1000 })</code> as "a simple delay between retries" — fine for a quick transient blip, but retrying every 1 second for 3 attempts against a server that is genuinely STRUGGLING (not just having one bad millisecond) adds load to an already-overloaded backend at exactly the wrong moment. Exponential backoff — doubling the delay each attempt (1s, 2s, 4s...) — gives a struggling server increasing breathing room instead of a rapid-fire retry burst.',
        'RxJS\'s <code>retry()</code> accepts a <code>delay</code> option that can be a FUNCTION of the error and the retry count, not just a fixed number: <code>retry({ count: 5, delay: (error, retryCount) =&gt; timer(Math.min(1000 * 2 ** retryCount, 30000)) })</code> — this computes an exponentially growing delay, capped at 30 seconds so it never grows unboundedly.',
      ],
    },
    {
      heading: 'Not every error deserves a retry — selective retry by status code',
      points: [
        'A <code>401 Unauthorized</code> or <code>404 Not Found</code> will not magically succeed on a second attempt — retrying them wastes time and can produce confusing UI (a spinner that stays up for the full backoff duration before eventually showing the SAME error it would have shown immediately). Only retry errors that are plausibly TRANSIENT: <code>0</code> (network unreachable), <code>408</code> (timeout), <code>429</code> (rate limited — respect a <code>Retry-After</code> header if present), and <code>5xx</code> (server error).',
        'Implement this by throwing immediately (via <code>throwError</code> INSIDE the delay function, not via the retry\'s own count) for non-retryable statuses: <code>delay: (error, retryCount) =&gt; { if (!isRetryable(error.status)) return throwError(() =&gt; error); return timer(backoffMs(retryCount)); }</code> — the delay function itself decides whether to actually wait (retry) or immediately re-throw (give up early).',
      ],
    },
    {
      heading: 'A give-up state distinct from a regular error state',
      points: [
        'After the retry budget is EXHAUSTED (not just after any single failure), surface a DIFFERENT UI message than a normal error — something like "We tried several times but couldn\'t reach the server" communicates persistence was attempted, versus a first-attempt failure which might just say "Failed to load." This distinction matters to users: it changes whether "just try again" (click retry) is a reasonable next action, or whether something more serious (a genuine outage) is more likely.',
        'Track attempt count in the component\'s own error state type: <code>{ status: \'error\'; message: string; attemptsExhausted: boolean }</code> — the retry operator handles retries internally within ONE subscription, but the component still benefits from knowing whether it observed a quick single failure or the full retry-then-give-up sequence, to tailor its message and potentially DISABLE the manual retry button for a cooldown period after an exhausted automatic retry.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/resilient-fetch.ts',
      content: `import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, retry, throwError, timer } from 'rxjs';

const RETRYABLE_STATUSES = new Set([0, 408, 429, 500, 502, 503, 504]);

function backoffDelayMs(retryCount: number): number {
  return Math.min(1000 * 2 ** retryCount, 30000); // 1s, 2s, 4s, 8s... capped at 30s
}

export function resilientGet<T>(http: HttpClient, url: string) {
  return http.get<T>(url).pipe(
    retry({
      count: 4,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        if (!RETRYABLE_STATUSES.has(error.status)) {
          // Non-transient error — give up immediately, no point waiting
          return throwError(() => error);
        }
        console.log(\`Retrying in \${backoffDelayMs(retryCount)}ms (attempt \${retryCount})\`);
        return timer(backoffDelayMs(retryCount));
      },
    }),
    catchError((error: HttpErrorResponse) => {
      // Reached here only after all retries are exhausted OR a non-retryable error
      return throwError(() => error);
    }),
  );
}
`,
    },
    {
      path: 'src/app/dashboard.ts',
      content: `import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { resilientGet } from './resilient-fetch';

type LoadState =
  | { status: 'loading' }
  | { status: 'success'; data: unknown }
  | { status: 'error'; message: string; attemptsExhausted: boolean };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: \`
    @if (state().status === 'loading') { <p>Loading (with automatic retry)...</p> }
    @if (state().status === 'error') {
      <p>{{ errorMessage() }}</p>
      <button (click)="load()">Try again</button>
    }
    @if (state().status === 'success') { <p>Loaded!</p> }
  \`,
})
export class DashboardComponent {
  private http = inject(HttpClient);
  state = signal<LoadState>({ status: 'loading' });

  errorMessage = () => {
    const s = this.state();
    if (s.status !== 'error') return '';
    return s.attemptsExhausted
      ? 'We tried several times but could not reach the server. Please try again shortly.'
      : s.message;
  };

  constructor() {
    this.load();
  }

  load() {
    this.state.set({ status: 'loading' });
    resilientGet(this.http, '/api/dashboard').subscribe({
      next: data => this.state.set({ status: 'success', data }),
      error: (err: HttpErrorResponse) => {
        const nonRetryable = ![0, 408, 429, 500, 502, 503, 504].includes(err.status);
        this.state.set({
          status: 'error',
          message: err.status === 404 ? 'Dashboard not found.' : 'Failed to load dashboard.',
          attemptsExhausted: !nonRetryable, // if it WAS retryable, we exhausted attempts
        });
      },
    });
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { DashboardComponent } from './dashboard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DashboardComponent],
  template: \`
    <h3>Retry with exponential backoff and a give-up state</h3>
    <p>Open the console — a failing /api/dashboard request retries with growing delays
    (1s, 2s, 4s, 8s), then shows a distinct "we tried several times" message once
    the retry budget is exhausted.</p>
    <app-dashboard />
  \`,
})
export class App {}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app/app';

bootstrapApplication(App, { providers: [provideHttpClient()] });
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Retry with exponential backoff and a give-up state</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change the retry cap from 30000ms to 10000ms, and reduce the max retry count from 4 to 2.',
    hint: 'In backoffDelayMs, change 30000 to 10000; in resilientGet\'s retry() call, change count: 4 to count: 2.',
    solution: `function backoffDelayMs(retryCount: number): number {
  return Math.min(1000 * 2 ** retryCount, 10000); // capped at 10s instead of 30s
}

export function resilientGet<T>(http: HttpClient, url: string) {
  return http.get<T>(url).pipe(
    retry({
      count: 2, // was 4
      delay: (error, retryCount) => { /* unchanged */ },
    }),
    // ...
  );
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a flat retry delay (e.g. always wait 1 second) is functionally equivalent to exponential backoff for handling server overload.',
      reality: 'a flat delay retries at a constant rate that can add MORE load to an already-struggling server at the worst moment — exponential backoff gives increasing breathing room with each successive failure.',
    },
    {
      thought: 'every HTTP error should be retried the same number of times before giving up.',
      reality: 'non-transient errors like 401 or 404 will not succeed on a retry — retrying them wastes time and delays showing the (unavoidable) error to the user; only genuinely transient statuses (0, 408, 429, 5xx) are worth retrying.',
    },
    {
      thought: 'a give-up-after-retries error state should look identical to a normal first-attempt error state.',
      reality: 'distinguishing them lets the UI communicate that persistence was already attempted ("we tried several times") versus a first failure ("failed to load") — a meaningfully different signal for whether the user should expect a manual retry to help.',
    },
  ];
}
