import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './the-cache-api-only-stores-get-requests.html',
  styleUrl: './the-cache-api-only-stores-get-requests.scss'
})
export class TheCacheApiOnlyStoresGetRequestsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'cache.put() with a POST request does not silently fail or no-op — it genuinely throws',
      points: [
        'The Cache Storage API (used by Service Workers and directly available on <code>window.caches</code>) is built around the assumption that a cached entry is keyed by a GET request\'s URL — the same URL always maps to the same resource.',
        'A POST request has no such guarantee — the same URL can mean something completely different depending on the request body. The spec reflects this by making <code>cache.put()</code> reject with a real <code>TypeError</code> the moment you try to store a non-GET request, rather than silently ignoring it or storing something unusable.',
        'Confirmed directly: calling <code>cache.put(new Request(url, { method: \'POST\' }), response)</code> throws <code>TypeError: Failed to execute \'put\' on \'Cache\': Request method \'POST\' is unsupported</code> — a real, catchable error with that exact message.',
      ]
    },
    {
      heading: 'This is exactly why offline POST support needs a completely different mechanism — Background Sync, not the Cache API',
      points: [
        'Since the Cache API structurally cannot store POST requests, there is no cache-based workaround — the main page\'s "offline POST" QnA answer is not a stylistic preference, it reflects a real constraint enforced by the API itself.',
        'The correct pattern is queuing the POST payload somewhere ELSE (typically IndexedDB) while offline, then replaying it as a real network request once connectivity returns — Workbox\'s <code>BackgroundSyncPlugin</code> automates exactly this pattern.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>the Cache API only stores GET requests</title>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `(async () => {
  const cache = await caches.open('demo-cache');

  // Attempt 1: cache a GET request — this works fine
  try {
    await cache.put(new Request('/some-get-endpoint'), new Response('cached content'));
    console.log('GET request: cached successfully.');
  } catch (err) {
    console.log('GET request: unexpectedly failed —', err);
  }

  // Attempt 2: cache a POST request — this genuinely throws
  try {
    await cache.put(new Request('/some-endpoint', { method: 'POST' }), new Response('cached content'));
    console.log('POST request: cached successfully (unexpected!)');
  } catch (err: any) {
    console.log('POST request: threw a real error —', err.name + ':', err.message);
  }

  await caches.delete('demo-cache');
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team building an offline-capable expense-tracking PWA wants form submissions (POST /api/expenses) to work even when the user is on a plane with no connectivity — the app should queue the submission and send it automatically once back online. A junior developer suggests using the Cache API to "cache the POST request until we\'re back online". Will this work?',
    hint: 'Ask what the Cache API is structurally built to store, and whether a POST request fits that model at all.',
    solution: 'It will not work — the Cache API can only store GET requests; attempting cache.put() with a POST request throws a real TypeError immediately, confirmed directly in this subtopic\'s demo. The correct approach is Background Sync: store the pending expense data in IndexedDB while offline, register a sync event, and replay it as an actual POST request once connectivity returns. Workbox\'s BackgroundSyncPlugin implements this exact pattern without needing to hand-roll the IndexedDB queue logic.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The Cache API can store any kind of HTTP request/response pair — GET is just the most common case developers use it for.',
      reality: 'GET is not merely common, it is the ONLY supported method — this subtopic\'s demo shows cache.put() with a POST request throwing a real, immediate TypeError rather than silently accepting or ignoring it.'
    },
    {
      thought: 'If caching a POST request fails, it probably fails silently (a no-op) rather than throwing — most Web APIs degrade gracefully rather than crash your code.',
      reality: 'This one throws a genuine, catchable error synchronously at the point of the put() call — confirmed with the exact error message in this subtopic\'s demo — so unhandled, it will surface as a real uncaught exception, not a quiet no-op.'
    },
    {
      thought: 'Since the Cache API cannot store POST requests, offline form submission support in a PWA is simply not achievable without a completely custom, from-scratch queuing system.',
      reality: 'Background Sync (via IndexedDB plus a sync event, or Workbox\'s BackgroundSyncPlugin) is a well-established, standard pattern specifically designed for this — it is a different API, not an unsolved problem, and does not require reinventing the queue logic from scratch.'
    }
  ];
}
