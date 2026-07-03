import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-error-handling-retry-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './error-handling-retry.html',
  styleUrl: './error-handling-retry.scss',
})
export class ErrorHandlingRetrySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'catchError — recover, don\'t just swallow',
      points: [
        '<code>catchError(err =&gt; of(fallback))</code> intercepts an error in the Observable pipeline and returns a FALLBACK Observable — the outer stream continues as if nothing failed. But "recover" does not have to mean "pretend it never happened": set an error-state signal INSIDE the catchError callback before returning the fallback, so the UI can still show something went wrong even though the stream itself continues cleanly.',
        'Common fallback choices: <code>of(null)</code> to signal an error state explicitly, <code>of([])</code> to fall back to empty data, or <code>EMPTY</code> to complete the stream silently with no further emissions at all.',
      ],
    },
    {
      heading: 'HttpErrorResponse — what you actually get in the catch block',
      points: [
        '<code>HttpErrorResponse</code> carries <code>status</code> (the HTTP code — 400, 401, 404, 500...), <code>statusText</code>, <code>error</code> (the parsed response body, if any), and <code>url</code>. Narrow to it explicitly: <code>if (err instanceof HttpErrorResponse && err.status === 401) { ... }</code> before branching on status-specific logic.',
      ],
    },
    {
      heading: 'retry() — a fixed number of attempts, not infinite',
      points: [
        '<code>retry(3)</code> re-subscribes to the Observable (re-fires the actual HTTP request) up to 3 times before finally propagating the error onward — it does NOT retry forever. Angular 14+\'s cleaner API, <code>retry({ count: 3, delay: 1000 })</code>, adds a fixed delay between attempts in one call instead of the older, more verbose <code>retryWhen()</code> pattern.',
      ],
    },
    {
      heading: 'Granular recovery — catchError inside the inner Observable',
      points: [
        'In a flattening pipeline (<code>switchMap</code>/<code>mergeMap</code>), piping <code>catchError</code> INSIDE the inner Observable recovers from a single failed request without killing the whole outer stream: <code>switchMap(q =&gt; http.get(q).pipe(catchError(() =&gt; of([]))))</code>. Putting <code>catchError</code> only on the OUTER stream instead would mean one failed request terminates the entire subscription — a search box that stops responding to further typing after a single failed request, for example.',
      ],
    },
    {
      heading: 'Client vs server vs network errors',
      points: [
        '<code>err.status === 0</code> means a NETWORK/CORS failure — no response was received from the server at all (offline, DNS failure, CORS block). <code>err.status &gt;= 500</code> is a server-side error. <code>err.status &gt;= 400 && err.status &lt; 500</code> is a client-side error (bad request, unauthorized, not found). These three categories usually deserve genuinely different handling — retrying a 401 is pointless without re-authenticating first, while retrying a 503 or a network blip is often worthwhile.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app/app';

bootstrapApplication(App, {
  providers: [provideHttpClient()],
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, of, retry } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <button (click)="load()">Load (this URL always 404s)</button>
    <p>Status: {{ status() }}</p>
  \`,
})
export class App {
  private http = inject(HttpClient);

  status = signal('Ready.');

  load() {
    this.status.set('Loading (will retry 2 times)...');

    this.http
      .get('https://jsonplaceholder.typicode.com/this-route-does-not-exist')
      .pipe(
        retry({ count: 2, delay: 500 }),   // retries twice, 500ms apart, then gives up
        catchError((err: HttpErrorResponse) => {
          if (err.status === 0) {
            this.status.set('Network error — check your connection.');
          } else if (err.status === 404) {
            this.status.set('Not found (404) — retrying would not help, this URL just does not exist.');
          } else if (err.status >= 500) {
            this.status.set('Server error (' + err.status + ') — may be worth retrying later.');
          } else {
            this.status.set('Request failed: ' + err.status);
          }
          return of(null); // recover — the stream completes cleanly instead of erroring out
        }),
      )
      .subscribe();
  }
}
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Error handling and retry</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change the retry to use exponential-style backoff by increasing the delay: retry 3 times with a 300ms delay for the first retry — RxJS\'s retry({ count, delay }) uses a fixed delay, so instead write your own resetOnSuccess:false config and note in a comment that true exponential backoff needs a custom delay function passed to retry().',
    hint: 'retry({ count: 3, delay: (error, retryCount) => timer(300 * retryCount) }) — the delay option accepts either a fixed number OR a function of (error, retryCount) that returns a new delay Observable each time, which is how you build increasing (exponential-style) backoff.',
    solution: `import { timer } from 'rxjs';

this.http.get(url).pipe(
  retry({
    count: 3,
    delay: (error, retryCount) => timer(300 * retryCount), // 300ms, 600ms, 900ms
  }),
  catchError((err: HttpErrorResponse) => {
    this.status.set('Failed after 3 retries: ' + err.status);
    return of(null);
  }),
).subscribe();`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'catchError() means the error is fully hidden from the user — the UI has no way to know it happened.',
      reality: 'you can set an error-state signal INSIDE the catchError callback before returning the fallback value — the stream recovers cleanly at the RxJS level while the UI still gets told something went wrong, entirely under your control.',
    },
    {
      thought: 'retry(3) keeps retrying forever until the request eventually succeeds.',
      reality: 'retry(3) attempts a FIXED number of retries (3) and then propagates the final error onward if all of them fail — it is not an infinite retry loop.',
    },
    {
      thought: 'an HTTP status of 0 means the server responded with an empty body.',
      reality: 'status 0 means NO response was received from the server at all — a network failure, the device being offline, or a CORS block. It is fundamentally different from a genuine (even empty) server response, which would carry a real status code like 200 or 204.',
    },
  ];
}
