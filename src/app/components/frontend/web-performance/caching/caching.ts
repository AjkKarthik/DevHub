import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickRefComponent, QuickRefItem }         from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint }       from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab }             from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake }  from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge }      from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion }        from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem }              from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary }  from '../../../shared/revision-card/revision-card';
import { PageMetaComponent }                       from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent }                   from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-perf-caching',
  standalone: true,
  imports: [CommonModule, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './caching.html',
  styleUrl: './caching.scss',
})
export class PerfCaching {

  quickRef: QuickRefItem[] = [
    { name: 'Cache-Control: max-age',       type: 'keyword', desc: 'Seconds the response is fresh — no network request while fresh' },
    { name: 'immutable',                    type: 'keyword', desc: 'Cache-Control directive: resource will NEVER change — skip revalidation checks entirely' },
    { name: 'no-cache',                     type: 'keyword', desc: 'Cache the resource but revalidate with server before EVERY use (ETag / Last-Modified)' },
    { name: 'no-store',                     type: 'keyword', desc: 'Never cache — store nothing; use only for sensitive data' },
    { name: 'stale-while-revalidate',       type: 'keyword', desc: 'Serve stale from cache immediately; revalidate in background — best UX for semi-dynamic content' },
    { name: 'ETag',                         type: 'syntax',  desc: 'Hash of resource content — server returns 304 Not Modified if hash matches client\'s If-None-Match' },
    { name: 'Service Worker',               type: 'syntax',  desc: 'JS proxy between page and network — enables programmatic caching, offline support, push notifications' },
    { name: 'Workbox',                      type: 'keyword', desc: 'Google\'s library wrapping the Service Worker Cache API with pre-built strategies (cache-first, SWR, network-first)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Cache-Control header strategies',
      points: [
        'max-age=31536000, immutable: for versioned assets (bundle.abc123.js) — cache forever, never revalidate.',
        'no-cache: always revalidate with server before using cached copy — for HTML entry points.',
        'no-store: never cache — for sensitive authenticated responses (bank statements, tokens).',
        'stale-while-revalidate=86400: serve immediately from cache; fetch fresh copy in background — good for API responses.',
        'public: allow CDN to cache; private: only browser cache (not CDN) — default for authenticated responses.',
      ],
    },
    {
      heading: 'Content hashing — the key to long caching',
      points: [
        'Versioned filenames (main.a3f9c2b1.js) allow max-age=31536000, immutable safely — URL changes on every deploy.',
        'Build tools (Vite, webpack, Angular CLI) add content hashes by default to output filenames.',
        'HTML entry point (index.html): must use no-cache — it references the hashed asset URLs and must always be fresh.',
        'Pattern: long cache for assets + no-cache for HTML = fast repeat visits + instant updates on deploy.',
        'Cache busting via query string (?v=2) is less reliable — some CDNs ignore query strings in cache keys.',
      ],
    },
    {
      heading: 'ETags and conditional requests',
      points: [
        'Server returns ETag: "abc123" with the response — a hash of the content.',
        'Client sends If-None-Match: "abc123" on revalidation — server returns 304 Not Modified (no body) if unchanged.',
        'Last-Modified / If-Modified-Since: date-based revalidation — less precise than ETags.',
        '304 saves bandwidth but still requires a network round-trip — not as fast as a cache HIT (no network).',
        'ETags are generated automatically by nginx, Apache, and most CDNs — no extra configuration needed.',
      ],
    },
    {
      heading: 'Service Workers — programmable network proxy',
      points: [
        'A Service Worker is a JS file that intercepts all fetch events between the page and the network.',
        'Runs in a separate thread with no DOM access; persists across page loads; requires HTTPS (or localhost).',
        'Lifecycle: install → activate → fetch interception. Old SW stays active until all tabs close.',
        'Enables: offline support, background sync, push notifications, and fine-grained caching strategies.',
        'Must be registered from the page: navigator.serviceWorker.register(\'/sw.js\').',
      ],
    },
    {
      heading: 'Workbox caching strategies',
      points: [
        'Cache First: check cache → return if found; otherwise fetch + cache. Best for versioned assets.',
        'Network First: try network → return; if fails return cache. Best for API data that must be fresh.',
        'Stale While Revalidate: return cache immediately + fetch in background to update cache. Best for non-critical data.',
        'Cache Only: return from cache or fail — for fully offline-first resources preloaded at install.',
        'Network Only: always fetch — no caching. For POST requests, analytics, sensitive data.',
      ],
    },
    {
      heading: 'CDN caching and cache invalidation',
      points: [
        'CDNs cache responses at edge nodes — subsequent requests served from edge without hitting origin.',
        'Cache-Control: public, max-age=3600 lets CDN cache for 1 hour; s-maxage overrides for CDN-only TTL.',
        'Surrogates-Key / Cache-Tag headers (Fastly, Cloudflare): tag responses and purge by tag on deploy.',
        'Instant purge on deploy: Vercel, Cloudflare Pages, Netlify auto-purge CDN on each deploy.',
        'Vary: Accept-Encoding — ensures CDN stores separate copies for gzip/brotli/no-compression.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Cache-Control headers',
      language: 'bash',
      code: `# Versioned static assets — cache forever, immutable
Cache-Control: public, max-age=31536000, immutable
# Use for: /js/main.a3f9c2b1.js, /css/styles.d8e1f23a.css, /fonts/inter.woff2

# HTML entry point — always revalidate
Cache-Control: no-cache
# Use for: /index.html, /404.html — must be fresh to pick up new asset hashes

# API responses — serve stale immediately, refresh in background
Cache-Control: public, max-age=60, stale-while-revalidate=600
# Use for: /api/products, /api/blog-posts (non-sensitive)

# User-specific data — browser cache only, short TTL
Cache-Control: private, no-cache
# Use for: /api/user/profile, /api/cart

# Never cache (sensitive data)
Cache-Control: no-store
# Use for: /api/token, /api/payment

# Nginx config example
location ~* \.(js|css|woff2|png|avif|webp)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
}
location = /index.html {
    add_header Cache-Control "no-cache";
}`,
    },
    {
      label: 'Service Worker (Workbox)',
      language: 'typescript',
      code: `// sw.ts — compiled to sw.js by Vite or Angular build
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute }     from 'workbox-precaching';
import { registerRoute }        from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin }     from 'workbox-expiration';

// Immediately take control (skip waiting)
clientsClaim();

// Precache build output (Vite/Angular injects __WB_MANIFEST)
precacheAndRoute(self.__WB_MANIFEST ?? []);

// Cache-first for images (CDN-served, versioned URLs)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// Network-first for API calls — fresh data with offline fallback
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 }),
    ],
  })
);

// Stale-while-revalidate for Google Fonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' })
);`,
    },
    {
      label: 'Register SW + update flow',
      language: 'typescript',
      code: `// Register Service Worker in main.ts / app bootstrap
async function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Check for updates on every page load
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing!;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New SW installed but waiting — prompt user to refresh
          showUpdateBanner();
        }
      });
    });

    console.log('SW registered, scope:', reg.scope);
  } catch (err) {
    console.error('SW registration failed:', err);
  }
}

function showUpdateBanner() {
  const banner = document.createElement('div');
  banner.innerHTML = 'Update available! <button id="refresh">Refresh</button>';
  document.body.prepend(banner);
  document.getElementById('refresh')!.onclick = () => window.location.reload();
}

registerSW();`,
    },
    {
      label: 'Verify caching in DevTools',
      language: 'typescript',
      code: `// Programmatically inspect what's in the SW cache
async function inspectCache() {
  const cacheNames = await caches.keys();
  console.log('Cache names:', cacheNames);

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys  = await cache.keys();
    console.log(\`\\n\${name} (\${keys.length} entries):\`);
    keys.forEach(r => console.log(' ', r.url));
  }
}

// Delete a specific cache (e.g. during SW update)
async function clearOldCaches(currentCaches: string[]) {
  const all = await caches.keys();
  return Promise.all(
    all.filter(name => !currentCaches.includes(name)).map(name => caches.delete(name))
  );
}

// DevTools path:
// Application → Cache Storage → select a cache → view entries
// Application → Service Workers → status, update, unregister
// Network panel → filter "from ServiceWorker" to see SW-served responses`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using long cache on index.html',
      wrong: `# index.html with 1-year cache — users get stale JS/CSS references
Cache-Control: public, max-age=31536000`,
      right: `# index.html must always revalidate — it references hashed asset URLs
Cache-Control: no-cache

# Versioned assets use long cache
# main.abc123.js → Cache-Control: public, max-age=31536000, immutable`,
      explanation: 'index.html contains the links to your versioned assets (main.abc123.js). If it\'s cached for a year, users get the OLD hash references and load stale JS/CSS even after a deploy. Always use no-cache (revalidate) for HTML.',
    },
    {
      title: 'Forgetting the immutable directive on versioned assets',
      wrong: `# Versioned asset — browser still makes conditional requests every time
Cache-Control: public, max-age=31536000`,
      right: `# immutable tells browser to NEVER revalidate — content hash guarantees it won't change
Cache-Control: public, max-age=31536000, immutable`,
      explanation: 'Without immutable, browsers may send a conditional request (If-None-Match) even within the max-age window when the user force-refreshes. immutable prevents that extra round-trip.',
    },
    {
      title: 'Registering the Service Worker before content loads',
      wrong: `// Registering SW immediately — SW install competes with page resources
navigator.serviceWorker.register('/sw.js');`,
      right: `// Wait for load event — SW registration doesn't compete with page resources
window.addEventListener('load', () => {
  navigator.serviceWorker.register('/sw.js');
});`,
      explanation: 'During SW installation, the browser downloads and processes sw.js. If registered before load, this competes with critical page resources for bandwidth and main-thread time, potentially delaying LCP.',
    },
    {
      title: 'Cache-first strategy for HTML or API responses',
      wrong: `// Cache-first for API — returns stale data indefinitely
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new CacheFirst({ cacheName: 'api' })
);`,
      right: `// Network-first for API — fresh data when online, fallback when offline
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({ cacheName: 'api', plugins: [new ExpirationPlugin({ maxAgeSeconds: 300 })] })
);`,
      explanation: 'Cache-first for API responses returns stale data silently — users see old content until the cache expires. Use network-first (try network, fall back to cache on failure) for data that must be reasonably fresh.',
    },
    {
      title: 'Not handling SW updates gracefully',
      wrong: `// New SW activates immediately — can break open tabs mid-session
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));`,
      right: `// Only skip waiting after user refreshes — controlled update UX
// In sw.ts: do NOT call skipWaiting() automatically
// In main.ts: show "Update available" banner, reload on user confirmation
reg.addEventListener('updatefound', () => {
  // prompt user; on confirm: newWorker.postMessage({ type: 'SKIP_WAITING' })
});`,
      explanation: 'Calling skipWaiting() in the install handler makes the new SW take over all open tabs immediately — mid-session requests can fail if the new SW has a different cache key structure. Show a "refresh to update" banner instead.',
    },
    {
      title: 'Using no-store for non-sensitive assets to "force fresh"',
      wrong: `# Trying to "always get fresh" — actually prevents any caching including CDN
Cache-Control: no-store`,
      right: `# Use no-cache (revalidate) not no-store (prevent caching entirely)
Cache-Control: no-cache
# Or with ETag support: server returns 304 if unchanged — no body re-download`,
      explanation: 'no-store prevents any caching entirely — every request downloads the full resource. no-cache allows caching but requires revalidation — the server can return 304 Not Modified (no body), saving bandwidth. Reserve no-store for genuinely sensitive data (tokens, payment info).',
    },
  ];

  challenge: Challenge = {
    title: 'Write a Workbox Service Worker',
    language: 'typescript',
    description: `Write a complete Service Worker using Workbox that implements:

1. Cache-first strategy for static image assets (/images/*)
2. Network-first for API calls (/api/*) with a 5-minute cache fallback
3. Stale-while-revalidate for Google Fonts stylesheets
4. Cache expiration: max 50 images, max 30 days

Also write the registration code that waits for the load event.`,
    hints: [
      'Import CacheFirst, NetworkFirst, StaleWhileRevalidate from workbox-strategies',
      'Use ExpirationPlugin for maxEntries and maxAgeSeconds',
      'Use CacheableResponsePlugin to cache opaque responses (status 0) from CDNs',
      'Register with window.addEventListener("load", ...) not immediately',
    ],
    starterCode: `// sw.ts — implement the four caching rules above
import { registerRoute } from 'workbox-routing';
// Add your imports and route registrations here

// main.ts — register the SW safely
// Add registration code here`,
    solution: `// sw.ts
import { clientsClaim }          from 'workbox-core';
import { precacheAndRoute }      from 'workbox-precaching';
import { registerRoute }         from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin }      from 'workbox-expiration';

clientsClaim();
precacheAndRoute(self.__WB_MANIFEST ?? []);

// 1. Cache-first for static images
registerRoute(
  ({ url }) => url.pathname.startsWith('/images/'),
  new CacheFirst({
    cacheName: 'images-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 50,                    // 4. max 50 entries
        maxAgeSeconds: 30 * 24 * 60 * 60, // 4. max 30 days
      }),
    ],
  })
);

// 2. Network-first for API calls
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-v1',
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 5 * 60 }),  // 5-min fallback
    ],
  })
);

// 3. Stale-while-revalidate for Google Fonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts' })
);

// main.ts — wait for load event before registering
window.addEventListener('load', () => {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('SW ready:', reg.scope))
    .catch(err => console.error('SW failed:', err));
});`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What Cache-Control value should you use for a versioned JavaScript bundle (main.abc123.js)?',
      options: [
        'Cache-Control: no-cache',
        'Cache-Control: no-store',
        'Cache-Control: public, max-age=31536000, immutable',
        'Cache-Control: private, max-age=3600',
      ],
      answer: 2,
      explanation: 'Versioned assets (content-hashed filenames) never change — if the content changes, the URL changes. Cache them forever with max-age=31536000 and immutable to skip even conditional revalidation requests.',
    },
    {
      q: 'What is the difference between Cache-Control: no-cache and no-store?',
      options: [
        'no-cache means don\'t cache; no-store means cache but don\'t store to disk',
        'no-cache revalidates before use; no-store never stores anything — not even in memory',
        'They are identical directives',
        'no-store is for CDNs; no-cache is for browsers',
      ],
      answer: 1,
      explanation: 'no-cache allows caching but requires revalidation with the server before each use (server can return 304). no-store prevents any storage — every request downloads the full resource. Use no-cache for HTML; no-store only for sensitive data.',
    },
    {
      q: 'Which Workbox strategy is best for an API that should show fresh data when online but work offline?',
      options: [
        'Cache First',
        'Cache Only',
        'Network First',
        'Stale While Revalidate',
      ],
      answer: 2,
      explanation: 'Network First tries the network and returns fresh data; if the network fails it falls back to the cached version. This gives the best of both: real-time data when online, offline resilience when not.',
    },
    {
      q: 'When does a Service Worker become active after installation?',
      options: [
        'Immediately after sw.js downloads',
        'After the install event resolves',
        'Only after all existing controlled tabs are closed (unless skipWaiting() is called)',
        'On the next server deployment',
      ],
      answer: 2,
      explanation: 'A new SW waits in the "waiting" state until all tabs using the previous SW are closed. This prevents mid-session inconsistencies. skipWaiting() overrides this but should only be called after user consent to avoid breaking open sessions.',
    },
    {
      q: 'Why should you register a Service Worker inside a "load" event listener rather than at top level?',
      options: [
        'Service Workers cannot be registered before DOMContentLoaded',
        'To avoid the SW installation competing with critical page resources for bandwidth',
        'Because navigator.serviceWorker is not available before the load event',
        'To ensure the SW only activates on the second page visit',
      ],
      answer: 1,
      explanation: 'SW installation downloads sw.js and runs the install handler, which may fetch assets to precache. Doing this before the page\'s own critical resources load competes for bandwidth and can delay LCP. Waiting for the load event ensures the page renders first.',
    },
    {
      q: 'Which Cache-Control directive tells intermediate proxies not to cache the response but allows the browser to cache it?',
      options: ['no-store', 'no-cache', 'private', 'must-revalidate'],
      answer: 2,
      explanation: 'private restricts caching to the end-user\'s browser only — CDNs and shared proxies must not store it. no-cache allows caching but requires revalidation with the server before each use. no-store prevents caching entirely. Use private for user-specific data (profile pages, cart) and public for shared resources (CSS, JS bundles).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does content hashing (cache busting) work with build tools?',
      a: 'Build tools (Vite, webpack, Angular CLI) hash the content of each output file and include the hash in the filename (e.g. main.a3f9c2b1.js). If the file content changes, the hash changes, and the new URL is referenced in index.html. Browsers see a new URL and fetch it fresh, bypassing the old cached file entirely.',
    },
    {
      q: 'Can a Service Worker cache POST requests?',
      a: 'The Cache API only stores GET requests. POST requests cannot be cached directly. For offline POST support, use Background Sync: queue the request in IndexedDB when offline and replay it when connectivity returns. Workbox\'s BackgroundSyncPlugin automates this pattern.',
    },
    {
      q: 'What is the difference between the HTTP cache and the Service Worker cache?',
      a: 'The HTTP cache (browser cache) is managed by Cache-Control headers — the browser decides when to use it. The Service Worker Cache API is a programmatic store you control explicitly via JavaScript — you decide what goes in, when it expires, and which strategy to use. SW cache responses can override HTTP cache behavior.',
    },
    {
      q: 'How do I clear a user\'s Service Worker cache after a bad deploy?',
      a: 'Deploy a new sw.js that in its activate handler calls caches.delete() for the old cache name, then caches.keys() to remove any unrecognised caches. The new SW takes over after existing tabs close. You can also use self.skipWaiting() and clients.claim() in the new SW for immediate takeover, but show users a refresh prompt first.',
    },
    {
      q: 'What is stale-while-revalidate and when should you use it?',
      a: 'stale-while-revalidate is a Cache-Control directive (and Workbox strategy) that serves the cached (possibly stale) response immediately while fetching a fresh copy in the background. Use it for content where a brief period of staleness is acceptable — e.g. product listings, blog posts, font stylesheets. Not suitable for prices, stock levels, or authenticated session data.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Cache versioned assets forever (immutable) + always revalidate HTML (no-cache) + use Service Workers for offline strategies — the three rules of web caching.',
    mustKnow: [
      'Versioned assets: Cache-Control: public, max-age=31536000, immutable',
      'HTML entry point: Cache-Control: no-cache (revalidate, not prevent caching)',
      'no-store = never cache; no-cache = cache but always revalidate',
      'ETag + 304 saves bandwidth but not round-trips — a cache HIT is always faster',
      'SW strategies: Cache First (assets), Network First (APIs), SWR (semi-static data)',
      'Register SW on window load — avoid competing with LCP resources',
    ],
    interviewFocus: [
      'What Cache-Control headers would you set for index.html vs main.abc.js?',
      'What is the difference between no-cache and no-store?',
      'Explain the Service Worker lifecycle: install → activate → fetch',
      'What is stale-while-revalidate and when would you use it?',
    ],
  };
}
