import { Component, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';

@Component({
  selector: 'app-ssr',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent, PrerequisitesComponent, RevisionCardComponent],
  templateUrl: './ssr.html',
  styleUrl: './ssr.scss',
})
export class SsrDemo {
  prerequisites: Prerequisite[] = [
    { label: 'Routing', route: '/angular/routing-demo' },
    { label: 'Change Detection', route: '/angular/change-detection' },
  ];

  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);
  platform  = signal(this.isBrowser ? 'Browser' : 'Server');

  theory: TheoryPoint[] = [
    {
      heading: 'What is SSR in Angular?',
      points: [
        'Server-Side Rendering (SSR) renders the Angular app on a Node.js server and sends fully-formed HTML to the browser — the user sees content immediately, with no blank white screen while JS loads.',
        'The Angular CLI integrates SSR via <code>ng add @angular/ssr</code>, which scaffolds an Express server entry, an <code>app.config.server.ts</code>, and updates <code>angular.json</code> with a server build target.',
        'SSR improves Core Web Vitals: <strong>Largest Contentful Paint (LCP)</strong> and <strong>First Contentful Paint (FCP)</strong> are dramatically lower because meaningful HTML arrives immediately instead of waiting for JS to evaluate.',
        'SSR also enables better SEO — search engine crawlers that do not execute JavaScript see the full rendered page content rather than an empty <code>&lt;app-root&gt;</code> shell.',
        'Angular 17+ enables SSR by default for new projects (<code>ng new</code>) and includes an App Shell / partial pre-rendering setup out of the box.',
      ],
    },
    {
      heading: 'Hydration — reusing server-rendered HTML',
      points: [
        'Without hydration, Angular <strong>destroys</strong> the server-rendered HTML and rebuilds the DOM from scratch on the client — causing a visible layout flash and doubling DOM work.',
        '<code>provideClientHydration()</code> in <code>app.config.ts</code> tells Angular to reuse the server HTML: it walks the existing DOM and attaches event listeners without creating new elements.',
        'The hydration process is non-destructive: Angular reconciles the server DOM with the component tree. Any mismatches (e.g. the server and client rendering different content) trigger a warning in development mode.',
        '<strong>Incremental hydration</strong> (Angular 19+): <code>@defer</code> blocks can stay dehydrated until they enter the viewport, reducing the JS needed to hydrate the initial viewport even further.',
        'Common hydration mismatch causes: Date/time rendered differently on server vs client, random values, browser-only CSS classes applied on init. All template-rendered content must be deterministic across environments.',
      ],
    },
    {
      heading: 'Platform guards — writing SSR-safe code',
      points: [
        '<code>inject(PLATFORM_ID)</code> returns the string <code>\'browser\'</code> or <code>\'server\'</code>. Pass it to <code>isPlatformBrowser()</code> from <code>@angular/common</code> to gate browser-only code.',
        '<code>localStorage</code>, <code>window</code>, <code>document</code>, <code>navigator</code>, and <code>sessionStorage</code> do not exist in Node.js — any unguarded access throws a <code>ReferenceError</code> during SSR.',
        '<code>afterNextRender()</code> (Angular 16+) runs a callback only in the browser, after the first render — the correct place for DOM manipulation, canvas setup, and third-party library initialisation.',
        '<code>HttpClient</code> with <code>withFetch()</code> works on both server and browser. Without <code>withFetch()</code>, Angular uses <code>XMLHttpRequest</code> which does not exist in Node.js, breaking server-side HTTP calls.',
        'Third-party libraries that reference <code>window</code> or <code>document</code> in their module scope (not just in methods) will break SSR even when used inside <code>isPlatformBrowser()</code> — import them dynamically inside an <code>afterNextRender()</code> or use a lazy import guard.',
      ],
    },
    {
      heading: 'Static site generation (SSG) and pre-rendering',
      points: [
        '<strong>SSG / pre-rendering</strong> renders Angular pages at <strong>build time</strong> and outputs static HTML files — no server process needed. Pages are served instantly from a CDN.',
        'Configure pre-rendering in <code>angular.json</code> under the <code>prerender</code> build option. Specify <code>routesFile</code> to list the URL paths to pre-render, or <code>discoverRoutes: true</code> to auto-discover static routes.',
        'SSG is ideal for marketing pages, blog posts, documentation — content that changes infrequently. SSR is better for pages with user-specific or frequently updated data (dashboards, search results).',
        'Hybrid apps use both: pre-render the public marketing shell at build time, then switch to SSR or CSR for authenticated routes. Angular\'s <code>RenderMode</code> enum (<code>Prerender</code>, <code>Server</code>, <code>Client</code>) controls this per-route in Angular 19.',
        'Pre-rendered pages also serve as an <strong>App Shell</strong> — the minimal HTML skeleton is cached by the service worker and shown instantly on subsequent visits even if the network is slow.',
      ],
    },
    {
      heading: 'TransferState and the HTTP transfer cache',
      points: [
        '<code>TransferState</code> serialises data fetched on the server into a JSON blob embedded in the HTML (<code>&lt;script type="application/json"&gt;</code>) that the browser reads during hydration.',
        'Without TransferState (or its automatic equivalent), the browser fires a duplicate HTTP request for data already fetched on the server — wasting bandwidth and adding time to Time-to-Interactive.',
        'Angular 18+ <strong>automatically caches GET requests</strong> made via <code>HttpClient</code> during SSR and replays them on the client — no manual <code>TransferState</code> code needed for HTTP calls when <code>provideClientHydration()</code> is active.',
        'For non-HTTP data (computed values, third-party API results stored in services), use the <code>TransferState</code> service manually: <code>state.set(makeStateKey(\'key\'), value)</code> on the server and <code>state.get(makeStateKey(\'key\'), defaultValue)</code> on the client.',
        'The transfer state payload is embedded directly in the server-rendered HTML, so it is already in the browser\'s memory when Angular boots — no additional network roundtrip required.',
      ],
    },
    {
      heading: 'Event replay and incremental hydration (Angular 18–19)',
      points: [
        '<code>withEventReplay()</code> used with <code>provideClientHydration(withEventReplay())</code> captures clicks, form inputs, and other DOM events that fire before Angular has finished hydrating.',
        'Once hydration completes, Angular replays those buffered events in order — the user\'s early clicks are not lost even on slow 3G connections where JS takes several seconds to load.',
        '<strong>Incremental hydration</strong> (Angular 19, developer preview): annotate <code>@defer (hydrate on viewport)</code> — Angular renders server HTML for that block but defers attaching event listeners until the block enters the viewport.',
        'Incremental hydration works together with <code>withEventReplay()</code>: events on dehydrated blocks are captured and replayed when that block is eventually hydrated.',
        'These features together eliminate the "Time-to-Interactive gap" — the window where the page looks interactive but isn\'t — which has historically been SSR\'s main UX downside versus CSR.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'bash',
      code: `# Add SSR to an existing Angular app
ng add @angular/ssr

# New app with SSR (default in Angular 17+)
ng new my-app --ssr

# Build — outputs both browser and server bundles
ng build

# Serve SSR (Express by default)
node dist/my-app/server/server.mjs

# Pre-render all discoverable static routes at build time
# (configure in angular.json build > prerender)`,
    },
    {
      label: 'app.config.ts',
      language: 'typescript',
      code: `// app.config.ts — client configuration
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),              // Fetch API — works on server + browser
    provideClientHydration(withEventReplay()),   // hydration + capture pre-hydration events
  ],
};

// app.config.server.ts — server configuration (extends client config)
import { mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';

export const serverConfig = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering()],  // adds server-specific providers
});`,
    },
    {
      label: 'Platform guards',
      language: 'typescript',
      code: `import { Component, afterNextRender, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({ ... })
export class MyComponent {
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);

  ngOnInit() {
    if (this.isBrowser) {
      // Safe — only runs in the browser
      const theme = localStorage.getItem('theme');
    }
    // HttpClient and signals are safe on both server and browser
  }
}

// afterNextRender — guaranteed browser-only, runs after first paint
export class ChartComponent {
  private canvas = viewChild<ElementRef>('canvas');

  constructor() {
    afterNextRender(() => {
      // DOM is guaranteed available here — safe for chart.js, D3, etc.
      new Chart(this.canvas()!.nativeElement, { ... });
    });
  }
}`,
    },
    {
      label: 'TransferState',
      language: 'typescript',
      code: `// Manual TransferState — for non-HttpClient data
import { inject } from '@angular/core';
import { TransferState, makeStateKey, isPlatformServer } from '@angular/platform-browser';
import { PLATFORM_ID } from '@angular/core';

const PRODUCTS_KEY = makeStateKey<Product[]>('products');

@Component({ ... })
export class ProductsComponent {
  private state = inject(TransferState);
  private platformId = inject(PLATFORM_ID);

  products = signal<Product[]>([]);

  ngOnInit() {
    const cached = this.state.get(PRODUCTS_KEY, null);
    if (cached) {
      this.products.set(cached); // browser reads from embedded JSON — no HTTP call
    } else {
      // Runs on the server: fetch and store in transfer state
      this.svc.getProducts().subscribe(products => {
        this.products.set(products);
        this.state.set(PRODUCTS_KEY, products); // serialized into HTML
      });
    }
  }
}

// Angular 18+ NOTE: HttpClient GET requests are cached automatically
// when provideClientHydration() is active — no manual TransferState needed
// for ordinary HttpClient calls.`,
    },
    {
      label: 'SSG config',
      language: 'typescript',
      code: `// angular.json — configure pre-rendering (SSG)
{
  "architect": {
    "build": {
      "configurations": {
        "production": {
          "prerender": {
            "discoverRoutes": true,
            "routesFile": "routes.txt"
          },
          "server": "src/main.server.ts",
          "serverTarget": "my-app:server"
        }
      }
    }
  }
}

// routes.txt — static routes to pre-render
// /
// /about
// /blog/angular-ssr
// /blog/angular-signals`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Which function enables Angular hydration in the client app config?',
      options: ['provideServerRendering()', 'provideClientHydration()', 'enableHydration()', 'mergeApplicationConfig()'],
      answer: 1,
      explanation: 'provideClientHydration() is added to the providers array in app.config.ts (client config). It tells Angular to reuse server-rendered HTML and attach event listeners in place rather than destroying and rebuilding the DOM.',
    },
    {
      q: 'What is the purpose of withEventReplay() alongside provideClientHydration()?',
      options: ['It replays HTTP requests that failed during SSR so the browser can retry them.', 'It serialises server-fetched data into the HTML so the browser avoids a second HTTP call.', 'It captures user events fired before hydration completes and replays them once Angular is ready.', 'It replays the last server-side render when the browser detects a stale cache.'],
      answer: 2,
      explanation: 'withEventReplay() captures clicks, keystrokes, and other DOM events that fire before Angular finishes hydrating. Once hydration completes, those events are replayed in order, preventing missed interactions on slow networks.',
    },
    {
      q: 'Which is the Angular-idiomatic way to guard localStorage access in an SSR-compatible component?',
      options: ['if (typeof window !== \'undefined\') { localStorage.getItem(\'theme\'); }', 'if (isPlatformBrowser(inject(PLATFORM_ID))) { localStorage.getItem(\'theme\'); }', 'if (!isServer) { localStorage.getItem(\'theme\'); }', 'afterRender(() => { localStorage.getItem(\'theme\'); });'],
      answer: 1,
      explanation: 'Injecting PLATFORM_ID and passing it to isPlatformBrowser() is the Angular-idiomatic approach. It integrates with Angular\'s DI context and works reliably across all execution environments. afterNextRender() is also safe but is lifecycle-based, not a general conditional guard.',
    },
    {
      q: 'What does TransferState do in an Angular SSR application?',
      options: ['It transfers component tree state from one route to another during client-side navigation.', 'It serialises data fetched on the server into the HTML payload so the browser reads it during hydration without a second HTTP request.', 'It moves zone.js state from the server process into the browser bundle.', 'It transfers Angular animation state across server renders to keep animations in sync.'],
      answer: 1,
      explanation: 'TransferState embeds a JSON blob into the server-rendered HTML. During hydration the browser reads that blob instead of issuing a duplicate API call, cutting time-to-interactive. In Angular 18+, HttpClient GET requests are cached automatically when provideClientHydration() is active.',
    },
    {
      q: 'Which Angular CLI command adds SSR support to an existing Angular application?',
      options: ['ng generate ssr', 'ng build --ssr', 'ng add @angular/ssr', 'ng serve --universal'],
      answer: 2,
      explanation: 'ng add @angular/ssr adds the server entry point, configures an Express server, and updates angular.json with server build targets. For new projects, SSR is included by default in Angular 17+.',
    },
    {
      q: 'Why must provideHttpClient() include withFetch() in an Angular SSR app?',
      options: ['withFetch() enables streaming responses which are required for server rendering.', 'Angular\'s default XMLHttpRequest-based HttpClient does not exist in Node.js, so withFetch() switches to the Fetch API which works on both server and browser.', 'withFetch() enables HTTP/2 which is required for SSR performance.', 'Without withFetch(), HttpClient uses WebSockets on the server.'],
      answer: 1,
      explanation: 'XMLHttpRequest is a browser API — it does not exist in Node.js. Without withFetch(), any HTTP call made during SSR will fail. withFetch() switches Angular\'s HttpClient to use the Fetch API, which is available in Node.js 18+ and all modern browsers.',
    },
    {
      q: 'What is the main difference between SSR and SSG (pre-rendering) in Angular?',
      options: ['SSR works with signals, SSG does not', 'SSR renders each request on the server at request time; SSG renders all routes at build time and serves static HTML from a CDN', 'SSG requires zone.js, SSR does not', 'SSR is only for public pages, SSG is for authenticated pages'],
      answer: 1,
      explanation: 'SSR renders on the server at request time — data is always fresh but a server process is required. SSG renders at build time — pages are static HTML served from a CDN instantly, ideal for content that rarely changes. Angular 19 introduces per-route RenderMode to mix both strategies.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between SSR and SSG in Angular?', a: '<strong>SSR</strong> renders each request on the server — data is always fresh but requires a running Node.js server. <strong>SSG</strong> (pre-rendering) renders all routes at build time — HTML is static, served from a CDN instantly with no server needed. Use SSG for content that rarely changes; SSR for dynamic per-user data.' },
    { q: 'How does hydration prevent layout flash?', a: 'Without hydration, Angular destroys the server HTML and re-renders — causing a visible flash and double DOM work. With <code>provideClientHydration()</code>, Angular walks the existing server DOM and attaches event listeners in place — no re-render, no flash.' },
    { q: 'What is withEventReplay()?', a: '<code>provideClientHydration(withEventReplay())</code> captures user events (clicks, keystrokes) that fire before Angular hydration completes, and replays them once hydration is done. This prevents missed interactions on slow networks where JS takes several seconds to load.' },
    { q: 'How do you avoid breaking SSR with browser-only APIs?', a: 'Guard with <code>isPlatformBrowser(inject(PLATFORM_ID))</code>. Or use <code>afterNextRender()</code> which runs only in the browser. Any code using <code>window</code>, <code>document</code>, <code>localStorage</code>, or <code>navigator</code> needs this guard — these do not exist in Node.js.' },
    { q: 'What is TransferState and when do you use it?', a: '<code>TransferState</code> serialises server-fetched data into the HTML sent to the browser. The browser reads it on hydration — no second HTTP request for the same data. In Angular 18+, <code>HttpClient</code> GET requests are cached automatically when <code>provideClientHydration()</code> is active; use manual <code>TransferState</code> for non-HTTP data.' },
    { q: 'How do you set up SSR in an existing Angular app?', a: '<code>ng add @angular/ssr</code> adds the server entry, configures Express, and updates <code>angular.json</code>. Build with <code>ng build</code> (produces both browser and server output). Serve with <code>node dist/app/server/server.mjs</code>. Add <code>provideClientHydration()</code> and <code>provideHttpClient(withFetch())</code> to <code>app.config.ts</code>.' },
    { q: 'What causes a hydration mismatch and how do you fix it?', a: 'A mismatch occurs when the server-rendered HTML differs from what the client would render — e.g. <code>new Date()</code> rendered differently in different time zones, random values, or browser-only CSS classes applied in <code>ngOnInit</code>. Fix by making all template-rendered content deterministic across server and browser: use UTC for dates, avoid browser-only data in initial renders, and move unpredictable side effects into <code>afterNextRender()</code>.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'provideClientHydration', type: 'function', desc: 'Enables hydration so Angular reuses server-rendered HTML instead of destroying and rebuilding the DOM on the client.' , since: '16'},
    { name: 'withEventReplay', type: 'function', desc: 'Feature for provideClientHydration() that captures pre-hydration user events and replays them once Angular is ready.' , since: '18'},
    { name: 'provideServerRendering', type: 'function', desc: 'Registers server-side rendering providers in app.config.server.ts.' , since: '17'},
    { name: 'isPlatformBrowser', type: 'function', desc: 'Returns true when PLATFORM_ID indicates a browser environment — use to guard localStorage, window, document.' , since: '2'},
    { name: 'PLATFORM_ID', type: 'token', desc: 'Injection token resolving to \'browser\' or \'server\', used with isPlatformBrowser() to gate platform-specific code.' , since: '2'},
    { name: 'afterNextRender', type: 'function', desc: 'Schedules a browser-only callback after the first render — safe for DOM, canvas, and third-party library initialisation.' , since: '16'},
    { name: 'TransferState', type: 'class', desc: 'Serialises server-fetched data into the HTML payload; browser reads it during hydration to avoid duplicate HTTP calls.' , since: '4'},
    { name: 'mergeApplicationConfig', type: 'function', desc: 'Merges the base app config with server-specific config so both sets of providers are active during SSR.' , since: '15'},
    { name: 'withFetch', type: 'function', desc: 'Configures HttpClient to use the Fetch API instead of XHR — required for SSR as XHR does not exist in Node.js.' , since: '17'},
    { name: 'makeStateKey', type: 'function', desc: 'Creates a typed key for TransferState — use with state.set(key, value) on the server and state.get(key, default) on the client.' , since: '4'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Enabling hydration',
      before: `// Angular 15 and earlier — no hydration, server HTML is discarded
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(), // XHR — broken on server
  ],
};`,
      after: `// Angular 16+ — hydration reuses server HTML, no layout flash
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),           // Fetch — works on server + browser
    provideClientHydration(withEventReplay()), // reuse server HTML + capture events
  ],
};`,
      note: 'provideClientHydration() prevents layout flash. withFetch() is required for SSR-compatible HTTP calls.',
    },
    {
      title: 'Guarding browser-only code',
      before: `// Unsafe — crashes on the server (localStorage is undefined in Node.js)
ngOnInit() {
  const theme = localStorage.getItem('theme');
  document.title = 'My App';
}`,
      after: `// Safe — guarded with PLATFORM_ID
private platformId = inject(PLATFORM_ID);
isBrowser = isPlatformBrowser(this.platformId);

ngOnInit() {
  if (this.isBrowser) {
    const theme = localStorage.getItem('theme');
  }
}
// Or use afterNextRender() for DOM operations:
constructor() {
  afterNextRender(() => { document.title = 'My App'; });
}`,
      note: 'Any access to localStorage, window, document, or navigator must be guarded — these do not exist in Node.js.',
    },
    {
      title: 'SSR server config merging',
      before: `// Pre-Angular 17 — separate bootstrap files that could drift out of sync
bootstrapApplication(AppComponent, {
  providers: [provideServerRendering()]
});`,
      after: `// Angular 17+ — mergeApplicationConfig keeps both configs in sync
import { mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';

export const serverConfig = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering()],
});`,
      note: 'mergeApplicationConfig ensures the server config inherits all client providers and only adds server-specific ones on top.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Accessing browser globals without a platform guard',
      wrong: `ngOnInit() {
  // Crashes on the server — ReferenceError: localStorage is not defined
  const user = localStorage.getItem('user');
}`,
      right: `ngOnInit() {
  if (isPlatformBrowser(inject(PLATFORM_ID))) {
    const user = localStorage.getItem('user');
  }
}`,
      explanation: 'The server process has no window, document, or localStorage. Any unguarded access throws a ReferenceError during SSR. Always wrap browser globals with isPlatformBrowser() or move them inside afterNextRender().',
    },
    {
      title: 'Using XMLHttpRequest-based HttpClient on the server',
      wrong: `providers: [
  provideHttpClient(), // Uses XHR — not available in Node.js
]`,
      right: `providers: [
  provideHttpClient(withFetch()), // Fetch API works on both server and browser
]`,
      explanation: 'XHR is a browser API and does not exist in Node.js. Without withFetch(), HTTP calls made during SSR fail silently or throw, breaking server-side data fetching.',
    },
    {
      title: 'Omitting provideClientHydration() causing layout flash',
      wrong: `// Hydration omitted — Angular destroys server HTML and re-renders
providers: [
  provideRouter(routes),
  provideHttpClient(withFetch()),
]`,
      right: `providers: [
  provideRouter(routes),
  provideHttpClient(withFetch()),
  provideClientHydration(withEventReplay()), // reuse server HTML — no flash
]`,
      explanation: 'Without provideClientHydration(), Angular destroys the server-rendered HTML on the client and rebuilds the DOM from scratch — visible white flash and doubled DOM work.',
    },
    {
      title: 'Double HTTP requests because the HTTP transfer cache is not enabled',
      wrong: `// HttpClient fetches data on the server, then the browser fetches it again
// because provideClientHydration() is missing from the config
ngOnInit() {
  this.http.get('/api/items').subscribe(...);
}`,
      right: `// With provideClientHydration() active, Angular 18+ automatically
// caches GET requests made during SSR and replays them on the client
providers: [
  provideHttpClient(withFetch()),
  provideClientHydration(withEventReplay()),
]`,
      explanation: 'Without provideClientHydration(), data fetched on the server is fetched again on the client, wasting bandwidth and adding latency. Angular 18+ automatically caches HttpClient GET results when hydration is enabled.',
    },
    {
      title: 'Importing third-party browser libraries at module scope',
      wrong: `// chart.js references window at import time — crashes the server
import { Chart } from 'chart.js';

@Component({ ... })
export class ChartComponent { ... }`,
      right: `// Lazy-import inside afterNextRender() — never runs on the server
@Component({ ... })
export class ChartComponent {
  constructor() {
    afterNextRender(async () => {
      const { Chart } = await import('chart.js');
      new Chart(this.canvas()!.nativeElement, { ... });
    });
  }
}`,
      explanation: 'Some third-party libraries reference window or document at import time, not just when used. A static import at the top of the file runs both on the server and the browser, crashing SSR. Use dynamic import() inside afterNextRender() instead.',
    },
  ];

  challenge: Challenge = {
    title: 'Platform-Aware Greeting Component',
    description: 'Create an Angular component called PlatformGreeting that detects whether it is running on the server or the browser using PLATFORM_ID and isPlatformBrowser, then displays an appropriate greeting and a list of safe APIs for that platform. On the browser, show a signal-based click counter. On the server, display a static message saying "Interactive features load after hydration." Guard all browser-only code so the component is SSR-safe.',
    language: 'typescript',
    hints: [
      'Inject PLATFORM_ID with private platformId = inject(PLATFORM_ID) and check the platform with isPlatformBrowser(this.platformId)',
      'Use signal(0) from @angular/core for the click counter and increment it with this.count.update(v => v + 1)',
      'In the template, use @if (isBrowser) { ... } to conditionally render the counter button so it never renders during SSR',
      'All state initialised in the constructor runs on both server and browser — only DOM access (localStorage, document) needs guarding',
    ],
    starterCode: `import { Component, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-platform-greeting',
  standalone: true,
  imports: [],
  template: \`
    <div class="greeting">
      <!-- TODO: Display "Running on: Browser" or "Running on: Server" -->

      <!-- TODO: Show a list of safe APIs for the current platform.
           Browser: ['localStorage', 'window', 'document']
           Server:  ['HttpClient', 'signals', 'TransferState'] -->

      <!-- TODO: If on the browser, render a click counter with a button.
           If on the server, show: 'Interactive features load after hydration.' -->
    </div>
  \`,
})
export class PlatformGreeting {
  // TODO: inject PLATFORM_ID
  // TODO: create isBrowser boolean
  // TODO: create platform signal ('Browser' or 'Server')
  // TODO: create availableApis string[] based on platform
  // TODO: create count signal initialized to 0
  // TODO: create increment() method
}`,
    solution: `import { Component, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-platform-greeting',
  standalone: true,
  imports: [],
  template: \`
    <div class="greeting">
      <h2>Running on: <strong>{{ platform() }}</strong></h2>

      <ul>
        @for (api of availableApis; track api) {
          <li>{{ api }}</li>
        }
      </ul>

      @if (isBrowser) {
        <button (click)="increment()">Clicked {{ count() }} times</button>
      } @else {
        <p>Interactive features load after hydration.</p>
      }
    </div>
  \`,
})
export class PlatformGreeting {
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);
  platform = signal(this.isBrowser ? 'Browser' : 'Server');
  availableApis = this.isBrowser
    ? ['localStorage', 'window', 'document']
    : ['HttpClient', 'signals', 'TransferState'];
  count = signal(0);

  increment() {
    this.count.update(v => v + 1);
  }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Angular SSR renders the app on the server for faster first paint and SEO — hydration then reuses that HTML without re-rendering, preventing layout flash and eliminating the blank-screen wait.',
    mustKnow: [
      '<code>ng add @angular/ssr</code> scaffolds the server entry, Express config, and <code>angular.json</code> updates — SSR is the default for new apps since Angular 17',
      '<code>provideClientHydration(withEventReplay())</code> in <code>app.config.ts</code>: reuses server HTML (no flash) + captures pre-hydration user events for replay',
      '<code>provideHttpClient(withFetch())</code> is required — XHR does not exist in Node.js; Fetch works on both environments',
      'Guard browser-only APIs with <code>isPlatformBrowser(inject(PLATFORM_ID))</code> — <code>window</code>, <code>localStorage</code>, <code>document</code> throw in Node.js',
      'Use <code>afterNextRender()</code> for DOM operations, canvas, and third-party library initialisation — it only runs in the browser',
      'Angular 18+: <code>HttpClient</code> GET results are automatically cached via the HTTP transfer cache when <code>provideClientHydration()</code> is active — no manual TransferState for HTTP calls',
      'SSG vs SSR: SSG renders at build time (static HTML from CDN, fastest), SSR renders per request (always fresh, requires server)',
    ],
    interviewFocus: [
      'What is the difference between SSR and SSG, and when do you choose each?',
      'How does Angular hydration work, and what problem does it solve?',
      'How do you guard browser-only APIs in an SSR Angular app?',
      'What does withFetch() do and why is it required for SSR?',
      'What causes a hydration mismatch and how do you debug and fix it?',
    ],
  };
}
