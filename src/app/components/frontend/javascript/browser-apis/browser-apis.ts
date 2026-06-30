import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-js-browser-apis',
  standalone: true,
  imports: [CommonModule, TheoryBlockComponent, CodeBlockComponent, QuickRefComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageMetaComponent,
    PageCompleteComponent, CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './browser-apis.html',
  styleUrl: './browser-apis.scss',
})
export class JsBrowserApis {
  theory: TheoryPoint[] = [
    {
      heading: 'Fetch API & Streams',
      points: [
        '<code>fetch(url, options)</code> returns a Promise that resolves to a <code>Response</code> object. The Promise resolves as long as the server responds — even for 4xx/5xx. Always check <code>response.ok</code>.',
        '<code>response.json()</code>, <code>response.text()</code>, <code>response.blob()</code>, <code>response.arrayBuffer()</code> — each returns a Promise for the body, consumed once.',
        'For large payloads, use <code>response.body</code> (a <code>ReadableStream</code>) to process data chunk by chunk without buffering the whole response in memory.',
        'The second argument to <code>fetch</code> accepts: <code>method</code>, <code>headers</code>, <code>body</code>, <code>signal</code> (AbortController), <code>credentials</code>, <code>cache</code>.',
        'Use <code>AbortController</code> + <code>signal</code> to cancel in-flight requests — on timeout, navigation away, or component unmount.',
      ]
    },
    {
      heading: 'Storage APIs',
      points: [
        '<code>localStorage</code>: persistent, synchronous, string-only, ~5 MB, shared across tabs of same origin. Use for user preferences, tokens (but consider httpOnly cookies for auth).',
        '<code>sessionStorage</code>: same API as localStorage but cleared when the tab is closed. Isolated per tab.',
        '<code>IndexedDB</code>: async, transactional, supports any serializable type, much larger quota. Use for large datasets, offline apps. Works in Workers.',
        '<code>CacheStorage</code> (part of Service Worker API): stores HTTP Response objects keyed by Request. Core of offline-first PWA patterns.',
        'Always call <code>JSON.stringify/parse</code> for objects in localStorage/sessionStorage since they only store strings.',
      ]
    },
    {
      heading: 'URL & History',
      points: [
        '<code>new URL(str)</code> parses a URL into structured parts: <code>pathname</code>, <code>search</code>, <code>hash</code>, <code>hostname</code>, <code>searchParams</code>.',
        '<code>url.searchParams</code> is a <code>URLSearchParams</code> object with <code>get/set/append/delete/has/toString</code> — the right way to build query strings.',
        '<code>history.pushState(state, title, url)</code> adds a history entry without a page reload. <code>history.replaceState</code> modifies the current entry. Listen to <code>popstate</code> on window to handle back/forward.',
        'Hash-based routing (<code>location.hash</code>) is simpler but pollutes the URL. Use the History API for clean paths in SPAs.',
      ]
    },
    {
      heading: 'Clipboard, Notifications & Geolocation',
      points: [
        '<code>navigator.clipboard.writeText(text)</code> / <code>readText()</code> — async, requires user gesture, and in modern browsers requires <code>clipboard-read/write</code> permissions.',
        '<code>Notification.requestPermission()</code> — async, browser prompts the user. <code>new Notification(title, { body, icon })</code> shows a system notification. Requires permission first.',
        '<code>navigator.geolocation.getCurrentPosition(success, error, opts)</code> — one-shot. <code>watchPosition</code> streams updates. Always handle the error callback (user can deny).',
        'These APIs all require HTTPS in production (except localhost). Check <code>navigator.permissions.query</code> for current permission state before calling.',
      ]
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'fetch(url, opts)',                       type: 'function',  desc: 'HTTP request → Promise<Response>' },
    { name: 'response.ok',                            type: 'accessor',  desc: 'true if status 200–299' },
    { name: 'AbortController / signal',               type: 'class',     desc: 'Cancel fetch requests' },
    { name: 'localStorage.setItem/getItem',           type: 'method',    desc: 'Synchronous string storage, persistent' },
    { name: 'sessionStorage',                         type: 'keyword',   desc: 'Same as localStorage, tab-scoped' },
    { name: 'new URL(str)',                            type: 'syntax',    desc: 'Parse URL into structured parts' },
    { name: 'url.searchParams',                       type: 'accessor',  desc: 'URLSearchParams for query string manipulation' },
    { name: 'history.pushState(state, \'\', url)',    type: 'method',    desc: 'SPA navigation without reload' },
    { name: 'navigator.clipboard.writeText(text)',    type: 'method',    desc: 'Copy to clipboard (async, needs gesture)' },
    { name: 'navigator.geolocation.getCurrentPosition', type: 'method', desc: 'Get GPS coordinates' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Fetch & AbortController',
      language: 'typescript',
      code: `// ── Basic fetch with error handling ─────────────────────────────────
async function getUser(id) {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);
  return res.json();
}

// ── With options ──────────────────────────────────────────────────────
async function createPost(data) {
  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',   // send cookies
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Request failed');
  }
  return res.json();
}

// ── AbortController — cancel on timeout ──────────────────────────────
async function fetchWithTimeout(url, ms = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// ── Cancel on component unmount (e.g. React/Angular cleanup) ─────────
let currentController;
function loadData() {
  currentController?.abort();   // cancel previous in-flight request
  currentController = new AbortController();
  return fetch('/api/data', { signal: currentController.signal })
    .then(r => r.json())
    .catch(e => { if (e.name !== 'AbortError') throw e; });
}

// ── Streaming large responses ─────────────────────────────────────────
async function streamDownload(url) {
  const res = await fetch(url);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
    updateProgress(result.length);
  }
  return result;
}`,
    },
    {
      label: 'Storage APIs',
      language: 'typescript',
      code: `// ── localStorage — typed wrapper ─────────────────────────────────────
const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.warn('Storage full:', e); }
  },
  remove(key) { localStorage.removeItem(key); },
  clear() { localStorage.clear(); },
};

// Usage
storage.set('prefs', { theme: 'dark', lang: 'en' });
const prefs = storage.get('prefs', { theme: 'light', lang: 'en' });

// ── sessionStorage — same API, tab-scoped ────────────────────────────
sessionStorage.setItem('draft', JSON.stringify(formData));

// ── Listen for changes from other tabs ───────────────────────────────
window.addEventListener('storage', e => {
  if (e.key === 'prefs' && e.newValue) {
    applyPreferences(JSON.parse(e.newValue));
  }
});

// ── IndexedDB via idb wrapper pattern ────────────────────────────────
// (raw IndexedDB is verbose; this shows the pattern without a library)
function openDB(name, version, onUpgrade) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = e => onUpgrade(e.target.result);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

async function setupDB() {
  const db = await openDB('myApp', 1, db => {
    db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
  });
  return db;
}`,
    },
    {
      label: 'URL & History API',
      language: 'typescript',
      code: `// ── URL parsing ──────────────────────────────────────────────────────
const url = new URL('https://example.com/search?q=js&page=2#results');
console.log(url.pathname);   // "/search"
console.log(url.hostname);   // "example.com"
console.log(url.hash);       // "#results"
console.log(url.searchParams.get('q'));    // "js"
console.log(url.searchParams.get('page')); // "2"

// ── Build query strings safely ────────────────────────────────────────
function buildSearchUrl(base, params) {
  const url = new URL(base, location.origin);
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined) url.searchParams.set(k, v);
  }
  return url.toString();
}

buildSearchUrl('/search', { q: 'hello world', page: 1, lang: 'en' });
// "/search?q=hello+world&page=1&lang=en"  — properly encoded

// ── History API for SPA routing ───────────────────────────────────────
function navigate(path, state = {}) {
  history.pushState(state, '', path);
  renderPage(path);
}

function renderPage(path) {
  // match path → render component
  const routes = {
    '/': HomePage,
    '/about': AboutPage,
  };
  const Page = routes[path] ?? NotFoundPage;
  document.querySelector('#app').innerHTML = '';
  new Page(document.querySelector('#app'));
}

// Handle browser back/forward buttons
window.addEventListener('popstate', e => {
  renderPage(location.pathname);
});

// ── Read params from current URL ──────────────────────────────────────
const params = new URLSearchParams(location.search);
const query = params.get('q') ?? '';
const page  = Number(params.get('page') ?? 1);`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not checking response.ok — fetch doesn\'t throw on HTTP errors',
      wrong: `const data = await fetch('/api/user').then(r => r.json());
// Works even on 404 / 500 — data may be an error object!`,
      right: `const res = await fetch('/api/user');
if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
const data = await res.json();`,
      explanation: 'fetch() only rejects on network failure (no connection, DNS failure). HTTP 4xx/5xx responses resolve successfully. Always check response.ok before parsing the body.',
    },
    {
      title: 'Reading response body twice',
      wrong: `const res = await fetch('/api/data');
await res.text();     // body consumed
await res.json();     // TypeError: body already read`,
      right: `const res = await fetch('/api/data');
const text = await res.text();
const data = JSON.parse(text);   // parse manually after one read`,
      explanation: 'Response bodies are streams — they can only be consumed once. Choose one method (json, text, blob, arrayBuffer) and stick to it. To inspect both: clone with res.clone() before reading.',
    },
    {
      title: 'Storing objects in localStorage without JSON serialization',
      wrong: `localStorage.setItem('user', { name: 'Alice' });
localStorage.getItem('user');  // "[object Object]" — toString was called`,
      right: `localStorage.setItem('user', JSON.stringify({ name: 'Alice' }));
const user = JSON.parse(localStorage.getItem('user'));`,
      explanation: 'localStorage values are always strings. Objects are coerced via .toString(), producing "[object Object]". Always JSON.stringify before writing and JSON.parse when reading.',
    },
    {
      title: 'Forgetting to handle geolocation / clipboard permission denial',
      wrong: `const pos = await navigator.geolocation.getCurrentPosition(showMap);
// If user denies, error callback never fires with no handler`,
      right: `navigator.geolocation.getCurrentPosition(
  pos => showMap(pos.coords),
  err => showError('Location access denied: ' + err.message),
  { timeout: 5000 }
);`,
      explanation: 'Geolocation, Clipboard, Notifications etc. require explicit user permission. Always provide an error callback — users frequently deny these prompts and your app must degrade gracefully.',
    },
    {
      title: 'Building query strings by manual string concatenation',
      wrong: `const url = '/search?q=' + query + '&page=' + page;
// Breaks if query contains & % = or special characters`,
      right: `const url = new URL('/search', location.origin);
url.searchParams.set('q', query);
url.searchParams.set('page', page);
// url.toString() — properly encoded`,
      explanation: 'Manual string concatenation doesn\'t encode special characters. URLSearchParams handles encoding automatically and is more readable.',
    },
  ];

  challenge: Challenge = {
    title: 'Resilient Fetch with Retry',
    language: 'typescript',
    description: 'Build a `fetchWithRetry(url, options)` function that:\n- Retries up to 3 times on network errors or 5xx responses\n- Waits `2^attempt * 100ms` (exponential backoff) between retries\n- Respects an AbortController signal — aborts ALL retries immediately\n- Returns the parsed JSON on success, throws on final failure',
    hints: [
      'Pass the signal into every fetch call',
      'Check e.name === "AbortError" to stop retrying',
      'response.ok is false for 5xx — that also counts as a retry case',
      'Use await new Promise(r => setTimeout(r, delay)) for the wait',
    ],
    starterCode: `async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  // your implementation
}

// Test
const ctrl = new AbortController();
fetchWithRetry('/api/data', { signal: ctrl.signal })
  .then(data => console.log(data))
  .catch(err => console.error(err.message));`,
    solution: `async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok && res.status >= 500 && attempt < maxRetries) {
        lastError = new Error(\`HTTP \${res.status}\`);
        await new Promise(r => setTimeout(r, 2 ** attempt * 100));
        continue;
      }
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
      return await res.json();
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      lastError = e;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 2 ** attempt * 100));
      }
    }
  }
  throw lastError;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'When does fetch() reject its returned Promise?',
      options: [
        'On any HTTP error status (4xx, 5xx)',
        'Only on network failures (no connection, DNS failure)',
        'When response.ok is false',
        'When the response body is empty',
      ],
      answer: 1,
      explanation: 'fetch() only rejects on network-level failures. HTTP 4xx/5xx responses resolve successfully — you must check response.ok (or response.status) to detect those.',
    },
    {
      q: 'What is the correct way to cancel a fetch request?',
      options: [
        'response.cancel()',
        'fetch.abort()',
        'AbortController + signal passed to fetch options',
        'Set a timeout with setTimeout',
      ],
      answer: 2,
      explanation: 'Create an AbortController, pass its .signal to fetch\'s options object, then call controller.abort() to cancel. The fetch Promise rejects with an AbortError.',
    },
    {
      q: 'What does the storage event fire on?',
      options: [
        'The same tab that wrote to localStorage',
        'Other tabs of the same origin when localStorage changes',
        'All tabs including the writing tab',
        'Any tab that has called localStorage.getItem',
      ],
      answer: 1,
      explanation: 'The storage event fires on OTHER tabs (same origin) when localStorage changes. It does NOT fire on the tab that made the change — useful for cross-tab synchronization.',
    },
    {
      q: 'What does history.pushState() do?',
      options: [
        'Reloads the page with the new URL',
        'Redirects to the given URL',
        'Adds a history entry and updates the URL without a page reload',
        'Replaces the current history entry',
      ],
      answer: 2,
      explanation: 'pushState adds a new entry to the browser history and updates the URL bar without triggering a page reload. Essential for SPA client-side routing. replaceState modifies the current entry instead.',
    },
    {
      q: 'What is the main difference between the Fetch API and XMLHttpRequest?',
      options: ['Fetch is synchronous, XHR is async', 'Fetch returns Promises and is cleaner; XHR uses callbacks and events', 'XHR supports streaming; Fetch does not', 'Fetch does not support CORS'],
      answer: 1,
      explanation: 'Fetch uses Promises (composable, async/await compatible) while XHR uses callbacks and event listeners. Fetch also integrates with Service Workers. Fetch does support streaming via Response.body (a ReadableStream).',
    },
    {
      q: 'What does the Web Storage API store and what are its limits?',
      options: ['Binary data, up to 50 MB', 'Serialized strings only, ~5 MB per origin', 'JSON objects, unlimited', 'Files and Blobs, ~10 MB'],
      answer: 1,
      explanation: 'localStorage and sessionStorage store strings only (values are automatically coerced). The limit is typically 5–10 MB per origin, enforced by the browser. Use JSON.stringify/parse for objects. For binary or large data use IndexedDB.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between localStorage and sessionStorage?',
      a: 'Both share the same API and are string-only. <code>localStorage</code> is persistent — survives tab closes and browser restarts, shared across all tabs of the same origin. <code>sessionStorage</code> is tab-scoped and cleared when the tab is closed — not shared with other tabs even from the same origin.',
    },
    {
      q: 'When should I use IndexedDB instead of localStorage?',
      a: 'Use IndexedDB when you need: (1) large data (localStorage limit ~5 MB; IndexedDB can be GBs), (2) structured data with indexes and queries, (3) binary data (Blobs, ArrayBuffers), (4) async operations (IndexedDB doesn\'t block the main thread), or (5) access from Web Workers. For simple key-value preferences, localStorage is fine.',
    },
    {
      q: 'How do I read current query params from the URL in a SPA?',
      a: '<code>new URLSearchParams(location.search)</code> gives you a <code>URLSearchParams</code> object. Call <code>.get("key")</code> for a single param, <code>.getAll("key")</code> for multi-value params, or spread <code>Object.fromEntries(params)</code> to get all params as an object.',
    },
    {
      q: 'What is the Web Workers API and what problem does it solve?',
      a: 'Web Workers run JavaScript on a background thread, separate from the main thread. This prevents CPU-heavy tasks (parsing large files, cryptography, complex calculations) from blocking the UI. Workers communicate with the main thread via <code>postMessage()</code> — passing structured-clone-capable data (no functions, no DOM). Shared Workers and Service Workers are specialised variants for shared state and offline caching respectively.',
    },
    {
      q: 'How does the Geolocation API work and what permissions does it require?',
      a: '<code>navigator.geolocation.getCurrentPosition(success, error, options)</code> requests the device\'s current location. The browser prompts for permission on first call — once granted, future calls succeed silently. Use <code>watchPosition</code> for continuous updates. Options include <code>enableHighAccuracy</code>, <code>timeout</code>, and <code>maximumAge</code>. Always handle the error callback — users can deny permission or the device may not have GPS.',
    },
    {
      q: 'What is the Broadcast Channel API and when would you use it?',
      a: '<code>new BroadcastChannel("channel-name")</code> creates a message bus between same-origin pages (tabs, iframes, workers). Post with <code>channel.postMessage(data)</code>; listen with <code>channel.onmessage</code>. Use it to sync logout, cart state, or theme changes across multiple open tabs without a server round-trip — a lightweight alternative to SharedWorker for simple cross-tab communication.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'fetch resolves even on 4xx/5xx — always check response.ok; use AbortController to cancel; localStorage is string-only (always JSON.stringify); URLSearchParams builds safe query strings; history.pushState enables SPA routing without reload.',
    mustKnow: [
      'fetch only rejects on network failure — check response.ok for HTTP errors',
      'Response body can only be consumed once — clone() if you need it twice',
      'AbortController.signal cancels fetch; catch AbortError separately',
      'localStorage/sessionStorage are string-only — always JSON.stringify/parse',
      'storage event fires on OTHER tabs, not the writing tab',
      'URLSearchParams handles encoding — never build query strings by concatenation',
      'history.pushState adds entry without reload; popstate fires on back/forward',
    ],
    interviewFocus: [
      'Why doesn\'t fetch throw on 404? How do you handle HTTP errors?',
      'How do you cancel a fetch request mid-flight?',
      'localStorage vs sessionStorage vs IndexedDB — when to use each?',
      'How does SPA routing work with the History API?',
    ],
  };
}
