import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-fetch-resolves-on-4xx-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './fetch-resolves-on-4xx-5xx-never-rejects.html',
  styleUrl: './fetch-resolves-on-4xx-5xx-never-rejects.scss',
})
export class FetchResolvesOn4xx5xxNeverRejectsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #1, Proven by Actually Fetching a 404',
      points: [
        'The main page states directly: "<code>fetch()</code> only rejects on network-level failures. HTTP 4xx/5xx responses resolve successfully — you must check <code>response.ok</code>." This subtopic actually fetches a genuinely-nonexistent URL, catches NO exception, and inspects the resolved <code>Response</code> object\'s <code>ok</code> and <code>status</code> fields directly, proving the promise resolved rather than rejected.',
        'This is a fundamentally different failure model from most HTTP client libraries in other ecosystems (and from Axios, in the JS ecosystem itself), which typically DO throw/reject on a non-2xx status by default — <code>fetch</code>\'s behavior here is a common, genuine surprise for developers coming from those backgrounds.',
      ],
    },
    {
      heading: 'What Actually DOES Make fetch() Reject',
      points: [
        '<code>fetch()</code>\'s promise only rejects for true NETWORK-level failures: no internet connection, a DNS lookup failure, a CORS policy block, or an aborted request (via <code>AbortController</code>) — none of these situations produce an HTTP response AT ALL, so there is no <code>Response</code> object to resolve with.',
        'Getting ANY response back from the server — even an error response like <code>404 Not Found</code> or <code>500 Internal Server Error</code> — counts as SUCCESS from <code>fetch()</code>\'s own perspective. The server successfully told you it couldn\'t fulfill the request; that is still a completed HTTP transaction, which is exactly why the promise resolves.',
        'This is why the main page\'s fix pattern is unconditional: ALWAYS check <code>response.ok</code> (a boolean shorthand for <code>status >= 200 && status < 300</code>) immediately after every <code>fetch()</code> call, before ever trying to parse the response body — treating a resolved promise as automatic success is the root cause of this entire class of bug.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>fetch resolves on 4xx/5xx demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `console.log('--- Fetching a genuinely nonexistent URL (should 404) ---');
try {
  const res = await fetch('https://httpbin.org/status/404');
  console.log('fetch() resolved successfully! No exception was thrown.');
  console.log('res.ok:', res.ok, '<-- false, the request was NOT successful');
  console.log('res.status:', res.status, '<-- 404, exactly as expected');
  console.log('typeof res:', typeof res, '(a real Response object, not an error)');
} catch (e) {
  console.log('This catch block did NOT run for the 404 -- fetch never throws for HTTP error statuses.');
}

console.log('--- The WRONG pattern: treating "no exception" as success ---');
async function getUserWrong(id: number) {
  const res = await fetch('https://httpbin.org/status/404');
  return res.json(); // no check! this will throw a DIFFERENT, confusing error trying to parse an error page as JSON
}
try {
  await getUserWrong(999);
} catch (e) {
  console.log('getUserWrong() eventually threw, but only because .json() failed to parse the body -- not because fetch caught the 404:', (e as Error).message.slice(0, 60));
}

console.log('--- The RIGHT pattern: always check response.ok first ---');
async function getUserRight(id: number) {
  const res = await fetch('https://httpbin.org/status/404');
  if (!res.ok) {
    throw new Error('HTTP ' + res.status + ': request failed for user ' + id);
  }
  return res.json();
}
try {
  await getUserRight(999);
} catch (e) {
  console.log('getUserRight() threw a clear, deliberate error:', (e as Error).message);
}

console.log('--- Contrast: fetching a URL with a genuine network failure ---');
try {
  await fetch('https://this-domain-genuinely-does-not-exist-anywhere.invalid');
} catch (e) {
  console.log('THIS is when fetch actually rejects -- a real network/DNS failure:', (e as Error).name);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The first fetch call gets back a genuine <code>404 Not Found</code> response. Does the <code>try</code> block\'s <code>catch</code> run for it? Compare this to the final fetch, against a domain that genuinely does not exist.',
    hint: 'Ask specifically whether an HTTP response was received AT ALL in each case -- a 404 IS a completed response from a real server, while a DNS failure never gets that far.',
    solution: `The catch block does NOT run for the 404 fetch -- the promise
resolves successfully with a real Response object (res.ok is false,
res.status is 404, but no exception was thrown at all).

The final fetch against a genuinely nonexistent domain DOES throw --
this is a real network-level failure (DNS resolution fails, so no
HTTP response could ever be received), which is exactly the kind of
failure fetch() actually rejects for.

The "WRONG pattern" example shows a real consequence of missing the
response.ok check: getUserWrong() doesn't check res.ok, so it tries
to call .json() directly on a 404 error page's body -- which throws
a confusing SyntaxError about invalid JSON, NOT a clear "404 Not
Found" error. This is a classic debugging trap: the eventual error
message has nothing to do with the actual root cause (a missing
resource), making it much harder to diagnose than if response.ok
had been checked immediately.

The "RIGHT pattern" example shows the fix: checking response.ok
immediately after the fetch call and throwing a deliberate, clear
error with the actual HTTP status -- this is the unconditional rule
the main page's Mistake #1 establishes: never assume "no exception
thrown" means "the request succeeded."`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'fetch() behaves like most other HTTP client libraries (Axios, most non-JS languages\' HTTP clients) — it throws or rejects automatically whenever the server responds with a non-2xx status code.',
      reality: 'fetch() has the OPPOSITE default behavior — it only rejects for genuine network-level failures (no connection, DNS failure, CORS block); a 404 or 500 response is still a "successful" fetch from the Promise\'s perspective, and must be checked manually via response.ok.',
    },
    {
      thought: 'if a fetch() call doesn\'t throw an exception, it\'s safe to assume the request succeeded and the response body contains the expected data.',
      reality: 'the absence of an exception only means an HTTP response was received — it says nothing about whether that response represents success (2xx) or failure (4xx/5xx); response.ok (or response.status) must be checked explicitly before trusting the body.',
    },
    {
      thought: 'skipping the response.ok check is a relatively harmless simplification — even without it, you\'ll still get a clear error when something goes wrong, just slightly later in the code.',
      reality: 'skipping the check often produces a MISLEADING error instead of a missing one — calling .json() on an error page\'s HTML or plain-text body throws a confusing parse error that obscures the real root cause (an HTTP error status), making the bug significantly harder to diagnose.',
    },
  ];
}
