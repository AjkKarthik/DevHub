import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-html-pwa',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './pwa-service-workers.html',
  styleUrl: './pwa-service-workers.scss',
})
export class HtmlPwaServiceWorkers {
  quickRef: QuickRefItem[] = [
    { name: "navigator.serviceWorker.register", type: "function", desc: "Registers a service worker script with the browser" },
    { name: "self.addEventListener('install'", type: "hook", desc: "Lifecycle event triggered when the service worker is first installed" },
    { name: "self.addEventListener('activate'", type: "hook", desc: "Lifecycle event triggered when the service worker becomes active" },
    { name: "self.addEventListener('fetch'", type: "hook", desc: "Intercepts network requests made by the page" },
    { name: "caches.open", type: "function", desc: "Opens a named cache storage for reading and writing" },
    { name: "cache.put", type: "method", desc: "Stores a response in the cache associated with a request" },
    { name: "cache.match", type: "method", desc: "Retrieves a cached response matching the given request" },
    { name: "clients.claim", type: "function", desc: "Makes the new service worker take control of all open pages immediately" },
    { name: "skipWaiting", type: "function", desc: "Forces the waiting service worker to become active immediately" },
    { name: "BackgroundSync", type: "interface", desc: "API for deferring actions until network connectivity is available" }
  ];

  theory: TheoryPoint[] = [
    {
      heading: "What is a PWA and Web App Manifest",
      points: [
        "Progressive Web Apps combine web and native app features using standard web technologies",
        "The Web App Manifest is a JSON file that provides metadata like name, icons, and display mode",
        "Manifest enables 'Add to Home Screen' functionality on mobile devices",
        "PWA must be served over HTTPS to ensure security and enable service worker registration",
        "Manifest links are added via <link rel='manifest' href='/manifest.json'> in the HTML head"
      ]
    },
    {
      heading: "Service Worker Lifecycle: Install/Activate/Fetch",
      points: [
        "The install event is used to cache essential assets for offline use",
        "The activate event handles cleanup of old caches and claiming clients",
        "The fetch event intercepts network requests to serve cached content or fetch from network",
        "Service workers run in a separate thread and cannot access the DOM directly",
        "A service worker must be fully installed before it can become active and control pages"
      ]
    },
    {
      heading: "Cache Strategies: Cache-First/Network-First/Stale-While-Revalidate",
      points: [
        "Cache-first serves the cached version immediately and updates the cache in the background",
        "Network-first tries the network first and falls back to cache if the request fails",
        "Stale-while-revalidate serves the old cached version while fetching a new one in the background",
        "Cache-first is ideal for static assets like CSS, JS, and images that rarely change",
        "Network-first is better for dynamic content that needs to be up-to-date"
      ]
    },
    {
      heading: "Background Sync and Push Notifications",
      points: [
        "BackgroundSync API allows deferring network requests until connectivity is restored",
        "PushManager enables sending notifications to users even when the app is closed",
        "Push notifications require user permission via Notification.requestPermission()",
        "Service workers handle push events in the background without UI interaction",
        "Background sync is useful for syncing data when the device comes back online"
      ]
    },
    {
      heading: "Offline Fallback and Update Flow",
      points: [
        "An offline fallback page should be cached during install to handle no-network scenarios",
        "Service workers update automatically when the script file changes on the server",
        "The skipWaiting() function allows new service workers to activate without page reload",
        "clients.claim() ensures the new service worker controls existing pages immediately",
        "Versioning cache names helps in cleaning up old caches during the activate event"
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: "Manifest and HTML Link",
      language: "html",
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PWA Example</title>
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#ffffff">
</head>
<body>
  <h1>Welcome to PWA</h1>
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('SW registered:', reg))
          .catch(err => console.error('SW registration failed:', err));
      });
    }
  </script>
</body>
</html>`
    },
    {
      label: "Service Worker Install/Activate/Fetch",
      language: "typescript",
      code: `const CACHE_NAME = 'pwa-cache-v1';
const ASSETS = ['/index.html', '/style.css', '/app.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});`
    },
    {
      label: "Cache-First Strategy with Network Fallback",
      language: "typescript",
      code: `self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open('dynamic-cache-v1').then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    }).catch(() => caches.match('/offline.html'))
  );
});`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: "Registering SW from Wrong Scope",
      wrong: "navigator.serviceWorker.register('/subdir/sw.js')",
      right: "navigator.serviceWorker.register('/sw.js')",
      explanation: "The service worker can only control pages within its scope and subdirectories"
    },
    {
      title: "Caching Everything Indefinitely",
      wrong: "cache.addAll(allUrls)",
      right: "Version cache names and delete old caches in activate event",
      explanation: "Unlimited caching consumes storage and serves stale content indefinitely"
    },
    {
      title: "Forgetting skipWaiting/clients.claim",
      wrong: "No activation logic in activate event",
      right: "Use self.skipWaiting() and clients.claim() in activate event",
      explanation: "Without these, the new service worker waits for all tabs to close before activating"
    },
    {
      title: "Not Versioning Cache Name",
      wrong: "const CACHE_NAME = 'my-cache'",
      right: "const CACHE_NAME = 'my-cache-v1'",
      explanation: "Versioning allows cleaning up old caches when the app updates"
    },
    {
      title: "Using Push Without User Permission",
      wrong: "pushManager.subscribe() without permission check",
      right: "Check Notification.permission before subscribing to push",
      explanation: "Push notifications require explicit user consent via the Notification API"
    }
  ];

  challenge: Challenge = {
    title: "Cache App Shell Offline",
    language: "typescript",
    description: "Create a service worker that caches index.html, style.css, and app.js on install. On fetch, serve these files from cache if available, otherwise fall back to network.",
    hints: [
      "Use self.addEventListener('install') to cache the three files",
      "Use caches.open() to create a named cache",
      "Use self.addEventListener('fetch') to intercept requests",
      "Return cached response if found, else fetch from network"
    ],
    starterCode: `const CACHE_NAME = 'app-shell-v1';
const FILES_TO_CACHE = ['index.html', 'style.css', 'app.js'];

self.addEventListener('install', (event) => {
  // TODO: Cache the files
});

self.addEventListener('fetch', (event) => {
  // TODO: Serve from cache or network
});`,
    solution: `const CACHE_NAME = 'app-shell-v1';
const FILES_TO_CACHE = ['index.html', 'style.css', 'app.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});`
  };

  quiz: QuizQuestion[] = [
    {
      q: "Which event is used to cache assets during service worker installation?",
      options: ["fetch", "install", "activate", "message"],
      answer: 1,
      explanation: "The install event is specifically designed for caching initial assets"
    },
    {
      q: "What does the Web App Manifest provide?",
      options: ["Service worker logic", "App metadata like name and icons", "Database schema", "API endpoints"],
      answer: 1,
      explanation: "The manifest provides metadata for PWA configuration"
    },
    {
      q: "Which cache strategy serves the cached version immediately and updates in background?",
      options: ["Network-first", "Cache-only", "Stale-while-revalidate", "Cache-first"],
      answer: 3,
      explanation: "Cache-first prioritizes speed by serving from cache immediately"
    },
    {
      q: "How do you force a new service worker to take control of pages immediately?",
      options: ["location.reload()", "clients.claim()", "skipWaiting()", "Both B and C"],
      answer: 3,
      explanation: "Both skipWaiting() and clients.claim() help in immediate activation"
    },
    {
      q: "What is required to use Push Notifications?",
      options: ["Service worker only", "User permission via Notification API", "Web App Manifest only", "HTTPS certificate"],
      answer: 1,
      explanation: "User permission is mandatory for push notifications"
    },
    {
      q: "What is the service worker lifecycle: install → ? → activate?",
      options: ["fetch", "waiting", "register", "cache"],
      answer: 1,
      explanation: "After install completes, a new service worker enters the waiting state — it cannot activate until all pages using the old worker are closed. Call self.skipWaiting() inside install to bypass waiting. The activate event fires when the worker takes control and is the right place to clean up old caches.",
    }
  ];

  qna: QnaItem[] = [
    {
      q: "What determines the scope of a service worker?",
      a: "The location of the service worker script file determines its scope. It can only control pages within its directory and subdirectories."
    },
    {
      q: "Explain the stale-while-revalidate cache strategy.",
      a: "It serves the cached version immediately for speed, while simultaneously fetching a fresh version from the network to update the cache for future requests."
    },
    {
      q: "How does a service worker update itself?",
      a: "The browser checks for changes in the service worker script file. If the file content differs, it downloads the new version and triggers the install event."
    },
    {
      q: "What is the difference between cache-first and network-first strategies?",
      a: "Cache-first serves cached content immediately and falls back to the network if not cached — best for offline availability. Network-first always tries the network and falls back to the cache if offline — best for frequently updated content."
    },
    {
      q: "What is the stale-while-revalidate caching strategy?",
      a: "Stale-while-revalidate serves a cached response immediately (stale) while simultaneously fetching a fresh version from the network to update the cache for next time. The user gets instant response; the next visit sees updated content. This is the best strategy for assets where some staleness is acceptable (CSS, JS chunks) but a guaranteed offline fallback is needed. Workbox implements this as a one-line strategy.",
    },
    {
      q: "What are the Core PWA requirements?",
      a: "A Progressive Web App requires: (1) HTTPS — service workers only register on secure origins, (2) a Web App Manifest with name, icons, start_url, and display fields, (3) a Service Worker that handles the fetch event for offline capability. These three unlock the browser's install prompt. Beyond the minimum, PWAs benefit from responsive design, push notifications, background sync, and core web vital optimisation.",
    },
  ];

  revision: RevisionSummary = {
    oneLiner: "PWAs use a Web App Manifest for installability and a Service Worker for offline caching, background sync, and push notifications.",
    mustKnow: [
      "Service workers run in a separate thread — they cannot access the DOM directly",
      "Lifecycle: install (cache shell assets) → activate (delete old caches) → fetch (intercept requests)",
      "skipWaiting() + clients.claim() makes a new SW take control immediately without waiting for old tabs to close",
      "Cache-first: serve from cache, fallback to network (offline-first); Network-first: try network, fallback to cache (freshness-first)",
      "Stale-while-revalidate: serve cached response instantly, update the cache in the background",
      "Push notifications require Notification.requestPermission() approval before subscribing via PushManager"
    ],
    interviewFocus: [
      "Explain the service worker lifecycle: install, activate, and fetch events",
      "When would you choose cache-first vs network-first vs stale-while-revalidate?",
      "How does skipWaiting() differ from clients.claim(), and when do you need both?",
      "What is the Web App Manifest and which fields are required for installability?"
    ]
  };
}
