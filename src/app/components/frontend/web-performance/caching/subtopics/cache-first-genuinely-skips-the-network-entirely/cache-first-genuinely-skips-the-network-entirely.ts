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
  templateUrl: './cache-first-genuinely-skips-the-network-entirely.html',
  styleUrl: './cache-first-genuinely-skips-the-network-entirely.scss'
})
export class CacheFirstGenuinelySkipsTheNetworkEntirelySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A cache-first strategy is a real conditional — the network branch simply never executes when the cache already has an entry',
      points: [
        'Workbox\'s <code>CacheFirst</code> strategy (and any hand-written equivalent) follows one rule: check <code>cache.match(request)</code> first; if it returns a response, return it immediately and never call <code>fetch()</code> at all.',
        'This is directly measurable, not just documented behaviour: wiring a counter around the network-fetching function and running a cache-first lookup for an already-cached URL shows the counter never increments — the network path is not merely deprioritised, it is not invoked at all.',
        'The SAME cache-first function, called for a URL that has NOT been cached yet, DOES invoke the network function exactly once — proving the branching is genuinely conditional on cache presence, not always-skip or always-fetch.',
      ]
    },
    {
      heading: 'This is why cache-first is dangerous for anything that legitimately changes — there is no freshness check at all',
      points: [
        'Because a cache hit short-circuits before any network call, a cache-first strategy has NO mechanism to notice the origin server\'s data has changed — it will happily keep returning the same cached response forever, until the cache entry is explicitly deleted or updated by other code.',
        'This is exactly why the main page recommends cache-first ONLY for versioned, content-hashed assets (where a content change always means a NEW url, so a cache-first hit is always guaranteed-correct) and never for API data or HTML that can change independently of its URL.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>cache-first genuinely skips the network entirely</title>
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
      content: `let networkFetchCount = 0;

async function fakeNetworkFetch(url: string): Promise<Response> {
  networkFetchCount++;
  console.log('  -> real network fetch called for', url, '(call #' + networkFetchCount + ')');
  return new Response('fresh content for ' + url);
}

async function cacheFirst(cache: Cache, url: string): Promise<Response> {
  const cached = await cache.match(url);
  if (cached) return cached;
  const fresh = await fakeNetworkFetch(url);
  await cache.put(url, fresh.clone());
  return fresh;
}

(async () => {
  const cache = await caches.open('demo-cache-first');
  await cache.put('/main.abc123.js', new Response('cached bundle content'));

  console.log('requesting an ALREADY-CACHED url...');
  const result1 = await cacheFirst(cache, '/main.abc123.js');
  console.log('  got:', await result1.text());
  console.log('  network fetch count so far:', networkFetchCount, '(should be 0)');

  console.log('requesting a NEVER-cached url...');
  const result2 = await cacheFirst(cache, '/vendor.def456.js');
  console.log('  got:', await result2.text());
  console.log('  network fetch count so far:', networkFetchCount, '(should be 1)');

  await caches.delete('demo-cache-first');
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team deploys a bug fix and updates their CSS file at the same URL, /styles.css (no content hash, no versioning), relying on a cache-first Service Worker strategy. After deployment, users report the bug is still visible even after a hard refresh. What is happening, and is cache-first the right strategy here?',
    hint: 'Ask what a cache-first strategy does the moment it finds an existing entry for that exact URL — does it have any way to know the origin\'s content changed?',
    solution: 'Cache-first has no freshness check whatsoever — the moment cache.match(\'/styles.css\') finds ANY existing entry, it returns it immediately and never calls fetch(), confirmed directly in this subtopic\'s demo (network fetch count stayed at 0 for a cached URL). Since the URL never changed, the Service Worker keeps serving the old cached CSS indefinitely, regardless of hard refreshes (those bypass the HTTP cache, but not a Service Worker\'s own Cache Storage). Cache-first is the wrong strategy here — the fix is either using a content-hashed filename (so any real change produces a new, never-before-cached URL) or switching to Network First / Stale-While-Revalidate for this specific resource.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A cache-first strategy still checks the network in the background even after returning the cached response — "cache-first" just means the cache wins the race, not that the network call is skipped.',
      reality: 'Cache-first genuinely never calls the network function at all when a cache entry exists — this subtopic\'s demo shows the network fetch counter staying at exactly 0 for a cache hit, proving the network branch is not executed, not merely deprioritised or backgrounded.'
    },
    {
      thought: 'Since cache-first can serve stale data forever, it must be a flawed or rarely-recommended strategy overall.',
      reality: 'It is the CORRECT strategy specifically for content-hashed, versioned assets — its "never rechecks the network" behaviour is exactly the desired property there, since a real content change always produces a brand-new URL that could not possibly already be in the cache. The danger only applies when a URL can represent genuinely different content over time.'
    },
    {
      thought: 'Cache-first and Stale-While-Revalidate are essentially the same strategy with different names — both "prefer the cache".',
      reality: 'They differ in exactly the mechanism this subtopic demonstrates — cache-first returns the cached response and does nothing else, while stale-while-revalidate returns the cached response AND triggers a real background network fetch to update the cache for the NEXT request. Cache-first alone would show zero network calls even on the second, third, and every subsequent request for the same cached URL.'
    }
  ];
}
