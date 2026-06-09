import { Component, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CodeBlockComponent, CodeTab } from '../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../shared/version-badge/version-badge';
import { PageMetaComponent } from '../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../shared/page-complete/page-complete';

@Component({
  selector: 'app-ssr',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './ssr.html',
  styleUrl: './ssr.scss',
})
export class SsrDemo {
  qna: QnaItem[] = [
    { q: 'What is the difference between SSR and SSG in Angular?', a: '<strong>SSR</strong> renders each request on the server — data is always fresh. <strong>SSG</strong> (pre-rendering) renders at build time — HTML is static and served from CDN instantly. Use SSG for content that rarely changes; SSR for dynamic per-user data.' },
    { q: 'How does hydration prevent layout flash?', a: 'Without hydration, Angular destroys the server HTML and re-renders — causing a visible flash. With <code>provideClientHydration()</code>, Angular reuses the server HTML and just attaches event listeners — no re-render, no flash.' },
    { q: 'What is withEventReplay()?', a: '<code>provideClientHydration(withEventReplay())</code> captures user events (clicks, keystrokes) that fire before Angular hydration completes, and replays them once hydration is done — preventing missed interactions on slow networks.' },
    { q: 'How do you avoid breaking SSR with browser-only APIs?', a: 'Guard with <code>isPlatformBrowser(inject(PLATFORM_ID))</code>. Or use <code>afterNextRender()</code> which runs only in the browser. Any code using <code>window</code>, <code>document</code>, <code>localStorage</code>, or <code>navigator</code> needs this guard.' },
    { q: 'What is TransferState and when do you use it?', a: '<code>TransferState</code> serialises server-fetched data into the HTML sent to the browser. The browser picks it up on hydration — no second HTTP request for the same data. Use it for data fetched in resolvers or ngOnInit during SSR.' },
    { q: 'How do you set up SSR in an existing Angular app?', a: '<code>ng add @angular/ssr</code> adds the server entry, configures Express, and updates <code>angular.json</code>. Build with <code>ng build</code> (produces both browser and server output). Serve with <code>node dist/app/server/server.mjs</code>.' },
  ];

  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);
  platform  = signal(this.isBrowser ? 'Browser' : 'Server');

  theory: TheoryPoint[] = [
    {
      heading: 'What is SSR in Angular?',
      points: [
        'Server-Side Rendering (SSR) renders the app on the server and sends HTML to the browser — no white flash.',
        'Angular Universal is the SSR engine — now integrated directly into the Angular CLI.',
        'ng add @angular/ssr adds a server entry point and configures express/node server output.',
        'SSR improves Largest Contentful Paint (LCP) and First Contentful Paint (FCP) metrics — better Core Web Vitals.',
      ],
    },
    {
      heading: 'Hydration',
      points: [
        'Hydration makes Angular reuse the server-rendered HTML instead of re-rendering it on the client.',
        'Without hydration, Angular destroys server HTML and re-renders — causes a layout flash.',
        'provideClientHydration() in app.config.ts enables hydration — supported from Angular 16+.',
        'Incremental hydration (Angular 19+) defers hydration of specific subtrees with @defer.',
      ],
    },
    {
      heading: 'Platform guards',
      points: [
        'inject(PLATFORM_ID) returns "browser" or "server" — use isPlatformBrowser() to guard browser-only code.',
        'localStorage, window, document do NOT exist on the server — wrap all accesses with isPlatformBrowser().',
        'afterNextRender() and afterRender() only execute in the browser — safe for DOM/canvas operations.',
        'Use TransferState to pass data fetched on the server to the client — avoids double HTTP calls.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'SSR + hydration is now the default in new Angular apps (ng new uses --ssr by default in Angular 17+).',
        'Third-party libraries that use document/window will break SSR — wrap with isPlatformBrowser() or use afterNextRender().',
        'Static site generation (SSG / pre-rendering) renders at build time — even faster for content that rarely changes.',
        'Use withEventReplay() alongside hydration to capture user events before hydration completes.',
      ],
    },
  ];

  tabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'bash',
      code: `# Add SSR to an existing app
ng add @angular/ssr

# New app with SSR (default in Angular 17+)
ng new my-app --ssr

# Build for SSR
ng build

# Serve SSR (uses Express by default)
node dist/my-app/server/server.mjs`,
    },
    {
      label: 'app.config.ts',
      language: 'typescript',
      code: `// app.config.ts — client config
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),        // use fetch API (works on server too)
    provideClientHydration(withEventReplay()),  // ← enable hydration
  ],
};

// app.config.server.ts — server config (merges with above)
import { mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';

export const serverConfig = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering()],
});`,
    },
    {
      label: 'Platform guards',
      language: 'typescript',
      code: `import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export class MyComponent {
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Safe — only runs in browser
      const stored = localStorage.getItem('theme');
    }
    // Runs on both server and browser:
    // fetch, HttpClient, signals — all work on the server
  }
}

// afterNextRender — browser only, runs after first paint
afterNextRender(() => {
  // Safe to access DOM, canvas, third-party libraries
  this.chart = new Chart(this.canvas());
});`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'Which function do you call to enable hydration in Angular\'s client app config?', options: ['provideServerRendering()', 'provideClientHydration()', 'enableHydration()', 'mergeApplicationConfig()'], answer: 1, explanation: 'provideClientHydration() is added to the providers array in app.config.ts (client config) to enable hydration. It makes Angular reuse server-rendered HTML instead of re-rendering it, preventing a layout flash.' },
    { q: 'What is the purpose of withEventReplay() when used alongside provideClientHydration()?', options: ['It replays HTTP requests that failed during SSR so the browser can retry them.', 'It serialises server-fetched data into the HTML so the browser avoids a second HTTP call.', 'It captures user events that fire before hydration completes and replays them once Angular is ready.', 'It replays the last server-side render when the browser detects a stale cache.'], answer: 2, explanation: 'withEventReplay() captures clicks, keystrokes, and other user interactions that occur before Angular has finished hydrating. Once hydration is complete, those captured events are replayed, preventing missed interactions on slow networks.' },
    { q: 'In an Angular SSR component, which of the following is the correct way to guard code that accesses localStorage?', options: ['if (typeof window !== \'undefined\') { localStorage.getItem(\'theme\'); }', 'if (isPlatformBrowser(inject(PLATFORM_ID))) { localStorage.getItem(\'theme\'); }', 'if (!isServer) { localStorage.getItem(\'theme\'); }', 'afterRender(() => { localStorage.getItem(\'theme\'); });'], answer: 1, explanation: 'The Angular-idiomatic approach is to inject PLATFORM_ID and pass it to isPlatformBrowser(). This reliably distinguishes browser from server inside Angular\'s DI context. afterNextRender() is also safe but is lifecycle-based, not a general guard.' },
    { q: 'What does TransferState do in an Angular SSR application?', options: ['It transfers the component tree state from one route to another during client-side navigation.', 'It serialises data fetched on the server into the HTML payload so the browser can read it during hydration without making a second HTTP request.', 'It moves zone.js state from the server process into the browser bundle.', 'It transfers the Angular animation state across server renders to keep animations in sync.'], answer: 1, explanation: 'TransferState serialises server-fetched data (e.g. API results) directly into the HTML sent to the browser. During hydration the browser reads that data instead of issuing a duplicate HTTP request, cutting initial load time.' },
    { q: 'Which Angular CLI command adds SSR support to an existing Angular application?', options: ['ng generate ssr', 'ng build --ssr', 'ng add @angular/ssr', 'ng serve --universal'], answer: 2, explanation: 'ng add @angular/ssr adds the server entry point, configures an Express server, and updates angular.json. For new projects, SSR is included by default when using ng new in Angular 17+.' },
  ];

  challenge: Challenge = {
    title: 'Platform-Aware Greeting Component',
    description: 'Create an Angular component called PlatformGreeting that detects whether it is running on the server or the browser using PLATFORM_ID and isPlatformBrowser, then displays an appropriate greeting message and a list of safe-to-use APIs for that platform. On the browser, show a signal-based click counter that increments on button press. On the server (SSR), display a static message saying \'Interactive features load after hydration.\' Guard all browser-only code with isPlatformBrowser so the component is SSR-safe.',
    language: 'typescript',
    hints: [
      'Inject PLATFORM_ID with \'private platformId = inject(PLATFORM_ID)\' and check the platform with \'isPlatformBrowser(this.platformId)\'.',
      'Use \'signal(0)\' from @angular/core for the click counter and increment it inside a method with \'this.count.update(v => v + 1)\'.',
      'In the template, use @if (isBrowser) { ... } to conditionally render the counter button so it never renders during SSR.',
      'Remember to import CommonModule or isPlatformBrowser from @angular/common, and add PLATFORM_ID to your imports/inject calls — no providers needed as PLATFORM_ID is a built-in token.',
    ],
    starterCode: `import { Component, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-platform-greeting',
  standalone: true,
  imports: [],
  template: \`
    <div class="greeting">
      <!-- TODO: Display a heading that says 'Running on: Browser' or 'Running on: Server' -->

      <!-- TODO: Show a list of APIs available on the current platform.
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
  // TODO: create a platform signal ('Browser' or 'Server')
  // TODO: create availableApis string[] based on platform
  // TODO: create a count signal initialized to 0
  // TODO: create an increment() method
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

  quickRef: QuickRefItem[] = [
    { name: 'provideClientHydration', type: 'function', desc: 'Enables Angular hydration so the framework reuses server-rendered HTML instead of re-rendering it on the client.' , since: '16'},
    { name: 'withEventReplay', type: 'function', desc: 'Feature flag for provideClientHydration() that captures user events fired before hydration completes and replays them once Angular is ready.' , since: '18'},
    { name: 'provideServerRendering', type: 'function', desc: 'Registers the server-side rendering providers in the server application config (app.config.server.ts).' , since: '17'},
    { name: 'isPlatformBrowser', type: 'function', desc: 'Returns true when the injected PLATFORM_ID token indicates the app is running in a browser environment.' , since: '2'},
    { name: 'PLATFORM_ID', type: 'token', desc: 'Built-in injection token that resolves to the string \'browser\' or \'server\', used to guard platform-specific code.' , since: '2'},
    { name: 'afterNextRender', type: 'function', desc: 'Schedules a callback that runs once after the first browser render — safe for DOM, canvas, and third-party library access.' , since: '16'},
    { name: 'TransferState', type: 'class', desc: 'Serialises data fetched on the server into the HTML payload so the browser can read it during hydration without issuing a duplicate HTTP request.' , since: '4'},
    { name: 'mergeApplicationConfig', type: 'function', desc: 'Merges the base app config with the server-specific config so providers from both are active during SSR.' , since: '15'},
    { name: 'withFetch', type: 'function', desc: 'Configures HttpClient to use the Fetch API instead of XMLHttpRequest, which is required for SSR compatibility.' , since: '17'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Enabling hydration', before: `// Angular 15 — no hydration, server HTML is discarded
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
  ],
};`, after: `// Angular 16+ — hydration reuses server HTML
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay()),
  ],
};`,
      note: 'provideClientHydration() prevents a visible layout flash by reusing server-rendered HTML. withFetch() is required for SSR-compatible HTTP calls.' },
    { title: 'Guarding browser-only code', before: `// Unsafe — crashes on the server (no window/document)
ngOnInit() {
  const theme = localStorage.getItem('theme');
  document.title = 'My App';
}`, after: `// Safe — guarded with PLATFORM_ID
private platformId = inject(PLATFORM_ID);
isBrowser = isPlatformBrowser(this.platformId);

ngOnInit() {
  if (this.isBrowser) {
    const theme = localStorage.getItem('theme');
  }
}`,
      note: 'Any access to localStorage, window, document, or navigator must be guarded. Alternatively, use afterNextRender() for DOM operations.' },
    { title: 'SSR server config merging', before: `// Pre-Angular 17 — separate bootstrap files, easy to drift out of sync
bootstrapApplication(AppComponent, {
  providers: [provideServerRendering()]
});`, after: `// Angular 17+ — mergeApplicationConfig keeps configs in sync
import { mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';

export const serverConfig = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering()],
});`,
      note: 'mergeApplicationConfig ensures the server config inherits all client providers and only adds server-specific ones on top.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Accessing browser globals without a platform guard', wrong: `ngOnInit() {
  // Crashes on the server — localStorage is undefined
  const user = localStorage.getItem('user');
}`, right: `ngOnInit() {
  if (isPlatformBrowser(inject(PLATFORM_ID))) {
    const user = localStorage.getItem('user');
  }
}`, explanation: 'The server process has no window, document, or localStorage. Any unguarded access throws a ReferenceError during SSR. Always wrap browser globals with isPlatformBrowser() or move them inside afterNextRender().'  },
    { title: 'Using XMLHttpRequest-based HttpClient on the server', wrong: `providers: [
  provideHttpClient(), // Uses XHR — not available on Node.js
]`, right: `providers: [
  provideHttpClient(withFetch()), // Fetch works on both server and browser
]`, explanation: 'XHR is a browser API and does not exist in Node.js. Without withFetch(), HTTP calls made during SSR will fail silently or throw, breaking data fetching on the server.'  },
    { title: 'Forgetting provideClientHydration() causes layout flash', wrong: `// Hydration omitted — Angular tears down server HTML and re-renders
providers: [
  provideRouter(routes),
]`, right: `providers: [
  provideRouter(routes),
  provideClientHydration(withEventReplay()),
]`, explanation: 'Without provideClientHydration(), Angular destroys the server-rendered HTML on the client and rebuilds the DOM from scratch, causing a visible white flash and doubling DOM work.'  },
    { title: 'Double HTTP requests because TransferState is not used', wrong: `// Server fetches data, then browser fetches it again
ngOnInit() {
  this.http.get('/api/items').subscribe(...);
}`, right: `// Use the built-in httpClient transfer cache (Angular 18+)
// or TransferState manually to pass server data to browser
provideClientHydration(withEventReplay()),
// HttpClient automatically caches GET requests during SSR`, explanation: 'Without TransferState (or the automatic HTTP transfer cache in Angular 18+), data fetched on the server is fetched a second time on the client, wasting bandwidth and increasing time-to-interactive.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: '16', label: 'Hydration GA', features: ['provideClientHydration() became stable — Angular reuses server HTML instead of destroying and re-rendering it', 'afterNextRender() and afterRender() introduced as browser-only lifecycle hooks', 'SSR performance significantly improved with non-destructive hydration'] },
    { version: '19', label: 'Incremental Hydration', features: ['Incremental hydration lets specific @defer blocks stay dehydrated until they enter the viewport', 'withEventReplay() became stable for capturing pre-hydration user interactions', 'HTTP transfer cache became automatic for GET requests — no manual TransferState needed for HttpClient'] },
  ];
}
