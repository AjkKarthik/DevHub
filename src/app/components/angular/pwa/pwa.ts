import { Component, signal } from '@angular/core';
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
  selector: 'app-pwa',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent, PrerequisitesComponent, RevisionCardComponent],
  templateUrl: './pwa.html',
  styleUrl: './pwa.scss',
})
export class PwaDemo {
  prerequisites: Prerequisite[] = [
    { label: 'Bundle Optimization', route: '/angular/bundle-optimization' },
  ];

  swStatus   = signal('Checking…');
  isOnline   = signal(navigator.onLine);
  cacheItems = signal<string[]>([]);

  constructor() {
    this.isOnline.set(navigator.onLine);
    window.addEventListener('online',  () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        this.swStatus.set(reg ? 'Registered ✓ (' + reg.scope + ')' : 'Not registered (add @angular/pwa)');
      });
    } else {
      this.swStatus.set('Service Workers not supported in this browser');
    }
  }

  theory: TheoryPoint[] = [
    {
      heading: 'What is a PWA?',
      points: [
        'A Progressive Web App (PWA) is a web app that can be <strong>installed</strong> on the home screen, <strong>works offline</strong>, receives <strong>push notifications</strong>, and loads from cache — all without an app store.',
        'PWAs use a <strong>Service Worker</strong> — a background script that runs in a separate thread, intercepting network requests and managing a <code>Cache Storage</code> API to serve files offline.',
        '<code>ng add @angular/pwa</code> is the one-command setup: it installs <code>@angular/service-worker</code>, generates <code>ngsw-config.json</code> (caching rules), creates <code>src/manifest.webmanifest</code> (app metadata, icons), and wires <code>provideServiceWorker()</code> into <code>app.config.ts</code>.',
        'The service worker lifecycle: <strong>install</strong> (download and cache assets) → <strong>activate</strong> (take control of pages) → <strong>fetch</strong> (intercept network requests). New versions go through the same cycle.',
        'PWAs must be served over <strong>HTTPS</strong> (localhost is exempt for development) — browsers enforce this because service workers intercept all network traffic.',
      ],
    },
    {
      heading: 'Angular Service Worker and ngsw-config.json',
      points: [
        '<code>ngsw-config.json</code> is the central configuration file that tells the Angular service worker what to cache, how to cache it, and for how long.',
        '<code>assetGroups</code> defines caching for the app shell (HTML, JS, CSS, icons). Use <code>installMode: \'prefetch\'</code> to download everything at install time, or <code>\'lazy\'</code> to cache on first access.',
        '<code>dataGroups</code> defines caching for API responses. Specify URL patterns, caching strategy (<code>freshness</code> or <code>performance</code>), <code>maxAge</code> (how long entries live), and <code>maxSize</code> (max cached entries).',
        '<code>provideServiceWorker(\'ngsw-worker.js\', { enabled: !isDevMode() })</code> in <code>app.config.ts</code> registers the Angular-generated service worker script. <code>isDevMode()</code> disables it during <code>ng serve</code> so you always see fresh code.',
        'The service worker is only active in a production build. To test locally: <code>ng build</code> then <code>npx serve dist/my-app/browser</code> — never use <code>ng serve</code> to test SW behaviour.',
      ],
    },
    {
      heading: 'Caching strategies — freshness vs performance',
      points: [
        '<code>freshness</code> — always tries the network first. On network failure, falls back to the cached response. Best for frequently-updated API data (prices, news feeds, notifications).',
        '<code>performance</code> — serves the cached response immediately without waiting for the network, then revalidates in the background. Best for stable assets (user avatars, product images, config files).',
        'Set <code>maxAge</code> on data groups (e.g. <code>"1h"</code>, <code>"7d"</code>) to control how long cached entries are considered fresh before the service worker revalidates even in <code>performance</code> mode.',
        'Set <code>maxSize</code> (e.g. <code>100</code>) to cap how many cache entries are kept. When the limit is reached, the oldest entries are evicted first — a simple LRU policy.',
        'Asset groups also support <code>updateMode: \'prefetch\' | \'lazy\'</code> — controls whether updated assets are downloaded eagerly when a new service worker activates or lazily on first request after update.',
      ],
    },
    {
      heading: 'Web App Manifest and install prompts',
      points: [
        '<code>src/manifest.webmanifest</code> defines how the app appears when installed: <code>name</code>, <code>short_name</code>, <code>theme_color</code>, <code>background_color</code>, <code>display</code> mode (<code>standalone</code> removes the browser chrome), and <code>icons</code> (PNG at multiple sizes).',
        'The <code>&lt;link rel="manifest" href="manifest.webmanifest"&gt;</code> tag in <code>index.html</code> (auto-added by the schematic) tells the browser where to find the manifest and enables the "Add to Home Screen" prompt.',
        'The browser shows the install prompt (BeforeInstallPromptEvent) when: the site is on HTTPS, has a service worker, and the manifest has required fields. The timing varies by browser and user engagement heuristics.',
        'Capture <code>BeforeInstallPromptEvent</code> with <code>window.addEventListener(\'beforeinstallprompt\', ...)</code> to show a custom "Install App" button at a moment you control, rather than relying on the browser\'s automatic prompt.',
        'After install, the app runs in <code>standalone</code> display mode — no browser address bar. Use <code>window.matchMedia(\'(display-mode: standalone)\').matches</code> to detect this and conditionally hide redundant navigation.',
      ],
    },
    {
      heading: 'Push notifications with SwPush',
      points: [
        '<code>SwPush</code> from <code>@angular/service-worker</code> wraps the Web Push API. Call <code>swPush.requestSubscription({ serverPublicKey })</code> with your VAPID public key to request permission and get a <code>PushSubscription</code> object.',
        'Send the <code>PushSubscription</code> to your server — it contains the endpoint and keys needed to send push messages to this specific device.',
        'Your server sends push messages via a Web Push library (e.g. <code>web-push</code> in Node.js). The Angular service worker receives them even when the app tab is closed, because the SW runs in the background.',
        'Subscribe to <code>swPush.messages</code> in the Angular app to receive push payloads when the app IS open and the SW forwards the event. When the app is closed, the SW can show a native notification directly via <code>self.registration.showNotification()</code>.',
        'Handle notification clicks via <code>swPush.notificationClicks</code> — this Observable fires when the user taps a displayed notification, giving you the action and notification data to route the user appropriately.',
      ],
    },
    {
      heading: 'Version updates and debugging',
      points: [
        '<code>SwUpdate.versionUpdates</code> is an Observable emitting typed events: <code>VERSION_DETECTED</code> (new version found), <code>VERSION_READY</code> (new version fully cached), <code>VERSION_INSTALLATION_FAILED</code> (cache failed). Filter for <code>VERSION_READY</code> to prompt users.',
        'Show a non-blocking "New version available — update?" toast rather than auto-reloading, which would disrupt users mid-task. On confirm: <code>document.location.reload()</code> activates the new service worker.',
        'Debug service workers in Chrome DevTools → <strong>Application → Service Workers</strong>: inspect status, simulate offline, skip waiting, and force update. <strong>Cache Storage</strong> tab shows cached files per cache name.',
        'A stale or broken service worker can be unregistered programmatically: <code>navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))</code>. In DevTools you can also click "Unregister" per-worker.',
        '<code>SwUpdate.isEnabled</code> returns <code>false</code> in development mode or when the browser does not support service workers — always guard SW-specific code with this check to avoid runtime errors.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'bash',
      code: `# Add @angular/pwa — sets up SW, manifest, and icons automatically
ng add @angular/pwa

# Produces:
# - src/manifest.webmanifest        (app name, icons, theme colour)
# - ngsw-config.json               (caching rules)
# - src/app/app.config.ts updated  (isDevMode(), provideServiceWorker())

# Build for production — SW only activates in production builds
ng build

# Test locally with a static server (not ng serve!)
npx serve dist/my-app/browser`,
    },
    {
      label: 'ngsw-config.json',
      language: 'typescript',
      code: `{
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app-shell",
      "installMode": "prefetch",   // cache ALL listed files immediately on SW install
      "updateMode": "prefetch",    // eagerly update when a new SW version activates
      "resources": { "files": ["/favicon.ico", "/index.html", "/*.css", "/*.js"] }
    },
    {
      "name": "assets",
      "installMode": "lazy",       // cache on first access
      "resources": { "files": ["/assets/**", "/*.png", "/*.jpg"] }
    }
  ],
  "dataGroups": [
    {
      "name": "api-posts",
      "urls": ["https://api.example.com/posts"],
      "cacheConfig": {
        "strategy": "freshness",   // network first, fall back to cache
        "maxSize": 100,            // keep up to 100 cached responses
        "maxAge": "1h",            // treat entries as fresh for 1 hour
        "timeout": "10s"           // wait 10s for network before using cache
      }
    },
    {
      "name": "static-assets",
      "urls": ["https://cdn.example.com/images/**"],
      "cacheConfig": {
        "strategy": "performance", // cache first, revalidate in background
        "maxSize": 50,
        "maxAge": "7d"
      }
    }
  ]
}`,
    },
    {
      label: 'SwUpdate',
      language: 'typescript',
      code: `import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { inject } from '@angular/core';
import { filter } from 'rxjs';

export class AppComponent {
  private swUpdate = inject(SwUpdate);

  constructor() {
    if (!this.swUpdate.isEnabled) return; // guard: false in dev mode

    // Listen for a new version that is fully cached and ready
    this.swUpdate.versionUpdates.pipe(
      filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'),
    ).subscribe(() => {
      if (confirm('New version available. Reload to update?')) {
        document.location.reload();
      }
    });
  }
}

// app.config.ts
import { provideServiceWorker } from '@angular/service-worker';
import { isDevMode } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),          // disabled in development
      registrationStrategy: 'registerWhenStable:30000', // wait 30s after stability
    }),
  ],
};`,
    },
    {
      label: 'Install prompt',
      language: 'typescript',
      code: `// Capture and defer the browser's install prompt
@Component({ selector: 'app-install-banner', ... })
export class InstallBannerComponent {
  private deferredPrompt = signal<any>(null);
  showInstall = computed(() => !!this.deferredPrompt());

  constructor() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();               // stop automatic browser prompt
      this.deferredPrompt.set(e);       // store it for later
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt.set(null);    // hide the button after install
    });
  }

  async install() {
    const prompt = this.deferredPrompt();
    if (!prompt) return;
    await prompt.prompt();              // show the browser's install dialog
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      this.deferredPrompt.set(null);
    }
  }

  isInstalled = computed(() =>
    window.matchMedia('(display-mode: standalone)').matches
  );
}`,
    },
    {
      label: 'SwPush',
      language: 'typescript',
      code: `import { SwPush } from '@angular/service-worker';
import { inject } from '@angular/core';

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv...'; // from your server

@Component({ ... })
export class PushComponent {
  private swPush = inject(SwPush);

  async subscribe() {
    const sub = await this.swPush.requestSubscription({
      serverPublicKey: VAPID_PUBLIC_KEY,  // VAPID key pair from server
    });
    // Send sub to your server via HTTP — it stores the endpoint + keys
    await inject(ApiService).saveSubscription(sub).toPromise();
  }

  constructor() {
    // Receive push messages while the app is open
    this.swPush.messages.subscribe((msg: any) => {
      console.log('Push message received:', msg);
    });

    // Handle notification click — route the user to relevant content
    this.swPush.notificationClicks.subscribe(({ action, notification }) => {
      if (action === 'view') {
        window.open(notification.data.url);
      }
    });
  }
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Which command sets up the Angular service worker, manifest, and ngsw-config.json all at once?',
      options: ['npm install @angular/service-worker', 'ng generate service-worker', 'ng add @angular/pwa', 'ng build --service-worker'],
      answer: 2,
      explanation: 'ng add @angular/pwa is the schematic that installs @angular/service-worker, generates ngsw-config.json, creates src/manifest.webmanifest, and registers provideServiceWorker() in app.config.ts — all in one step.',
    },
    {
      q: 'In ngsw-config.json, what is the difference between \'freshness\' and \'performance\' caching strategies?',
      options: ['freshness always serves from cache; performance always fetches from network', 'freshness tries the network first and falls back to cache on failure; performance serves from cache immediately and revalidates in the background', 'freshness deletes cache on every request; performance caches for a fixed duration', 'Both strategies are identical — the names are aliases'],
      answer: 1,
      explanation: 'The freshness strategy prioritises up-to-date data by hitting the network first and only using cache when offline. performance prioritises speed by returning the cached response immediately while revalidating in the background.',
    },
    {
      q: 'Why do service workers only work on HTTPS (and localhost)?',
      options: ['HTTPS provides faster download speeds for service worker scripts', 'HTTP servers cannot serve JavaScript files larger than 50 KB', 'Service workers can intercept all network requests, so browsers restrict them to HTTPS to prevent man-in-the-middle attacks', 'The Cache Storage API is only available when TLS certificates are present'],
      answer: 2,
      explanation: 'Because service workers act as a network proxy — intercepting every request — browsers enforce an HTTPS-only policy to prevent a malicious script on a plain HTTP page from hijacking traffic.',
    },
    {
      q: 'Which Angular service and event type detect that a new app version is cached and ready to activate?',
      options: ['SwRegistration and ServiceWorkerReadyEvent', 'SwPush and PushSubscriptionChangeEvent', 'SwUpdate and VersionReadyEvent', 'ServiceWorkerModule and ActivationEvent'],
      answer: 2,
      explanation: 'SwUpdate (from @angular/service-worker) exposes the versionUpdates observable. Filter for e.type === \'VERSION_READY\' (typed as VersionReadyEvent) to know a new build is cached and ready to serve.',
    },
    {
      q: 'In ngsw-config.json assetGroups, what does installMode: \'prefetch\' do vs installMode: \'lazy\'?',
      options: ['prefetch caches files only after the user first visits them; lazy pre-downloads everything at install time', 'prefetch downloads and caches all listed files immediately when the service worker installs; lazy caches files only when they are first requested', 'prefetch is for JavaScript bundles only; lazy works for all asset types', 'There is no functional difference — they are both eager-loading strategies'],
      answer: 1,
      explanation: 'installMode: prefetch causes the service worker to download and cache all matched resources during its install phase, ensuring they are available offline immediately. installMode: lazy defers caching until each file is actually requested at runtime.',
    },
    {
      q: 'What browser event should you capture to implement a custom "Install App" button?',
      options: ['\'appready\'', '\'pwainstall\'', '\'beforeinstallprompt\'', '\'serviceWorkerInstalled\''],
      answer: 2,
      explanation: 'The \'beforeinstallprompt\' event fires when the browser is about to show its native install prompt. Call e.preventDefault() to suppress it, store the event, and trigger prompt() from your own install button at the right moment.',
    },
    {
      q: 'What does SwPush.requestSubscription({ serverPublicKey }) return?',
      options: ['A boolean indicating whether the user granted notification permission', 'A PushSubscription object containing the endpoint and keys needed to send push messages to this device', 'A JWT token for authenticating push notifications', 'A URL to the browser\'s native push notification settings'],
      answer: 1,
      explanation: 'requestSubscription() requests notification permission, subscribes the device to Web Push, and returns a PushSubscription containing the push endpoint URL and encryption keys. Send this to your server — it uses these to send push messages via a Web Push library like node\'s web-push.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'What does ng add @angular/pwa do?', a: 'It installs <code>@angular/service-worker</code>, generates <code>ngsw-config.json</code> (caching rules), creates <code>src/manifest.webmanifest</code> (app name, icons, colours), and adds <code>provideServiceWorker()</code> to <code>app.config.ts</code>.' },
    { q: 'Why does the service worker only work on HTTPS?', a: 'Service workers can intercept all network requests — a huge security surface. Browsers restrict them to HTTPS (and localhost) to prevent man-in-the-middle attacks. Always deploy on HTTPS to use SW features.' },
    { q: 'What is the difference between freshness and performance caching strategies?', a: '<code>freshness</code> — always tries the network first, uses cache only on failure. Best for frequently-updated data. <code>performance</code> — serves from cache immediately, revalidates in background. Best for static assets and stable content.' },
    { q: 'How do you detect and apply a new app version?', a: 'Subscribe to <code>inject(SwUpdate).versionUpdates</code> and filter for <code>VersionReadyEvent</code>. Show a non-blocking "New version available — refresh?" prompt. On confirm: <code>document.location.reload()</code>. Guard with <code>swUpdate.isEnabled</code> first.' },
    { q: 'How do you unregister a service worker?', a: '<code>navigator.serviceWorker.getRegistrations().then(regs =&gt; regs.forEach(r =&gt; r.unregister()))</code>. Useful when debugging or deploying a hotfix — the old SW might serve stale cached responses. Also available in Chrome DevTools → Application → Service Workers.' },
    { q: 'What happens to the Angular app when the user is offline?', a: 'The service worker serves cached files from ngsw-config.json. The app shell (HTML, CSS, JS) loads from cache. API calls configured with <code>freshness</code> fail gracefully if not cached; those with <code>performance</code> strategy serve stale cached responses until <code>maxAge</code> expires.' },
    { q: 'How do you implement push notifications in an Angular PWA?', a: 'Use <code>SwPush</code> from <code>@angular/service-worker</code>. Call <code>swPush.requestSubscription({ serverPublicKey: VAPID_KEY })</code> to get a <code>PushSubscription</code> — send this to your server. Your server sends push messages via a Web Push library (e.g. <code>web-push</code> in Node.js). Receive messages in the app via <code>swPush.messages</code> and handle notification clicks via <code>swPush.notificationClicks</code>.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'provideServiceWorker()', type: 'function', desc: 'Registers the Angular service worker and configures its behaviour in app.config.ts.', since: '12' },
    { name: 'SwUpdate', type: 'class', desc: 'Injectable service that exposes versionUpdates observable for detecting and applying new app versions.', since: '5' },
    { name: 'VersionReadyEvent', type: 'interface', desc: 'Event emitted by SwUpdate.versionUpdates when a new build is fully cached and ready to activate.', since: '13' },
    { name: 'SwPush', type: 'class', desc: 'Injectable service for subscribing to and receiving Web Push notifications via the service worker.', since: '5' },
    { name: 'SwUpdate.isEnabled', type: 'accessor', desc: 'Returns false in development mode or when the browser lacks SW support — guard SW-specific code with this.', since: '5' },
    { name: 'ngsw-config assetGroups', type: 'interface', desc: 'Config block defining which app-shell and static assets the SW caches with installMode prefetch or lazy.', since: '5' },
    { name: 'ngsw-config dataGroups', type: 'interface', desc: 'Config block for API URL caching — defines strategy (freshness/performance), maxAge, and maxSize.', since: '5' },
    { name: 'SwUpdate.versionUpdates', type: 'function', desc: 'Observable of SW lifecycle events: VERSION_DETECTED, VERSION_READY, VERSION_INSTALLATION_FAILED.', since: '13' },
    { name: 'beforeinstallprompt', type: 'hook', desc: 'Browser event to capture and defer the native PWA install prompt for a custom install button.', since: '2' },
    { name: 'ng add @angular/pwa', type: 'keyword', desc: 'Angular schematic that installs @angular/service-worker, ngsw-config.json, manifest.webmanifest, and provideServiceWorker().', since: '6' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Providing the service worker: NgModule vs standalone',
      before: `// app.module.ts (NgModule era)
import { ServiceWorkerModule } from '@angular/service-worker';
@NgModule({
  imports: [
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode()
    })
  ]
})
export class AppModule {}`,
      after: `// app.config.ts (standalone / Angular 14+)
import { provideServiceWorker } from '@angular/service-worker';
export const appConfig: ApplicationConfig = {
  providers: [
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    })
  ]
};`,
      note: 'provideServiceWorker() replaces ServiceWorkerModule.register() in standalone apps.',
    },
    {
      title: 'Detecting updates: deprecated observables vs versionUpdates',
      before: `// Angular < 13 — deprecated API
swUpdate.available.subscribe(event => {
  swUpdate.activateUpdate().then(() => document.location.reload());
});`,
      after: `// Angular 13+ — typed events, no deprecated API
swUpdate.versionUpdates.pipe(
  filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY')
).subscribe(() => {
  if (confirm('New version available. Reload?')) document.location.reload();
});`,
      note: 'versionUpdates (Angular 13+) replaces the deprecated available and activated observables with typed events.',
    },
    {
      title: 'Browser install prompt: automatic vs deferred custom button',
      before: `// No control — browser shows install prompt at its own timing
// (often dismissed because it appears at a bad moment)`,
      after: `// Capture and defer — show prompt on user intent
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();       // stop automatic prompt
  deferredPrompt.set(e);    // show your own "Install App" button
});

// In your button's click handler:
await deferredPrompt().prompt();
const { outcome } = await deferredPrompt().userChoice;`,
      note: 'Deferring the install prompt and triggering it from a contextual "Install App" button dramatically improves install rates.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Testing the service worker with ng serve',
      wrong: `// Running ng serve and expecting SW to cache files
ng serve
// Service worker is silently disabled in development mode`,
      right: `// Build for production and serve with a static server
ng build
npx serve dist/my-app/browser`,
      explanation: 'Angular disables the service worker when isDevMode() is true. You must build with ng build and serve the production output to test SW caching and update behaviour.',
    },
    {
      title: 'Forgetting HTTPS requirement in production',
      wrong: `// Deploying to plain HTTP — SW registration silently fails
http://my-app.example.com`,
      right: `// SW works on HTTPS + localhost only
https://my-app.example.com`,
      explanation: 'Browsers enforce HTTPS for service workers because they intercept all network traffic. Plain HTTP deployments silently fail to register a service worker.',
    },
    {
      title: 'Using \'performance\' strategy for frequently-updated API data',
      wrong: `// ngsw-config.json — wrong strategy for live prices
{ "name": "live-prices", "urls": ["/api/prices"],
  "cacheConfig": { "strategy": "performance" } }`,
      right: `// Use 'freshness' so the network is always tried first
{ "name": "live-prices", "urls": ["/api/prices"],
  "cacheConfig": { "strategy": "freshness", "maxAge": "1m" } }`,
      explanation: 'The performance strategy serves stale cached responses until they expire, which is wrong for live data. Use freshness to always attempt a network request and fall back to cache only when offline.',
    },
    {
      title: 'Not unregistering a broken service worker during debugging',
      wrong: `// Deploying a hotfix but the old SW keeps serving cached 404s
// users stay stuck on broken version until cache expires`,
      right: `// Unregister all service workers programmatically
navigator.serviceWorker.getRegistrations()
  .then(regs => regs.forEach(r => r.unregister()));
// Or: Chrome DevTools → Application → Service Workers → Unregister`,
      explanation: 'If you deploy a broken service worker, existing users may be stuck on the cached broken version. Unregistering clears it immediately.',
    },
    {
      title: 'Not setting maxAge on data groups — cache entries never expire',
      wrong: `{ "name": "api-users", "urls": ["/api/users"],
  "cacheConfig": { "strategy": "performance", "maxSize": 100 } }
// No maxAge — stale data served indefinitely`,
      right: `{ "name": "api-users", "urls": ["/api/users"],
  "cacheConfig": {
    "strategy": "performance",
    "maxSize": 100,
    "maxAge": "1d"   // revalidate after 1 day
  } }`,
      explanation: 'Without maxAge, the performance strategy serves cached responses forever until the cache is manually cleared. Always set a maxAge appropriate to how often your data changes.',
    },
  ];

  challenge: Challenge = {
    title: 'Build an Offline Status Banner with Service Worker Detection',
    description: 'Create a standalone Angular component called OfflineStatusComponent that: (1) displays a green "Online" badge or red "Offline — cached content" banner based on network state, using Angular signals updated by window online/offline events, (2) shows the service worker registration scope if a SW is registered or "No service worker registered" otherwise. Both pieces of state must update reactively without a page reload.',
    language: 'typescript',
    hints: [
      'Use signal(navigator.onLine) to initialise network state, then call window.addEventListener(\'online\', ...) and window.addEventListener(\'offline\', ...) in the constructor to keep it current',
      'Use navigator.serviceWorker.getRegistration() — it returns a Promise resolving to a ServiceWorkerRegistration or undefined — store the scope string in a signal',
      'Use computed() to derive the badge label (\'Online\' or \'Offline — cached content\') from the online signal',
      'Bind [class.online] and [class.offline] on the badge element to switch CSS classes reactively using signal values',
    ],
    starterCode: `import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-offline-status',
  standalone: true,
  template: \`
    <div class="status-wrapper">
      <!-- TODO: add a badge that shows Online or Offline -->
      <!-- TODO: add a paragraph showing the SW scope or 'No service worker registered' -->
    </div>
  \`,
  styles: [\`
    .status-wrapper { font-family: sans-serif; padding: 1rem; }
    .badge { padding: 4px 12px; border-radius: 12px; font-weight: bold; }
    .online  { background: #d4edda; color: #155724; }
    .offline { background: #f8d7da; color: #721c24; }
  \`]
})
export class OfflineStatusComponent {
  // TODO: isOnline signal using navigator.onLine
  // TODO: swScope signal<string> = signal('Checking…')
  // TODO: computed statusLabel

  constructor() {
    // TODO: listen for window online/offline events
    // TODO: call navigator.serviceWorker.getRegistration() and update swScope
  }
}`,
    solution: `import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-offline-status',
  standalone: true,
  template: \`
    <div class="status-wrapper">
      <span class="badge" [class.online]="isOnline()" [class.offline]="!isOnline()">
        {{ statusLabel() }}
      </span>
      <p style="margin-top:0.75rem">Service Worker: {{ swScope() }}</p>
    </div>
  \`,
  styles: [\`
    .status-wrapper { font-family: sans-serif; padding: 1rem; }
    .badge { padding: 4px 12px; border-radius: 12px; font-weight: bold; }
    .online  { background: #d4edda; color: #155724; }
    .offline { background: #f8d7da; color: #721c24; }
  \`]
})
export class OfflineStatusComponent {
  isOnline    = signal(navigator.onLine);
  swScope     = signal('Checking…');
  statusLabel = computed(() =>
    this.isOnline() ? 'Online' : 'Offline — cached content'
  );

  constructor() {
    window.addEventListener('online',  () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        this.swScope.set(
          reg ? 'Registered — scope: ' + reg.scope : 'No service worker registered'
        );
      });
    } else {
      this.swScope.set('Service workers not supported in this browser');
    }
  }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Angular PWAs use @angular/service-worker to cache assets and API responses offline, support installation, and push notifications — ng add @angular/pwa wires everything with one command.',
    mustKnow: [
      '<code>ng add @angular/pwa</code> installs service worker, generates <code>ngsw-config.json</code> and <code>manifest.webmanifest</code>, and wires <code>provideServiceWorker()</code>',
      'SW only activates in production builds — test with <code>ng build</code> + <code>npx serve dist/</code>, never with <code>ng serve</code>',
      '<code>assetGroups</code> caches the app shell; <code>dataGroups</code> caches API responses with <code>strategy</code>, <code>maxAge</code>, and <code>maxSize</code>',
      '<code>freshness</code> = network-first with cache fallback (live data); <code>performance</code> = cache-first with background revalidation (stable assets)',
      '<code>SwUpdate.versionUpdates</code> — filter for <code>VERSION_READY</code> to prompt users to reload for a new app version; guard with <code>SwUpdate.isEnabled</code>',
      'Install prompt: capture <code>beforeinstallprompt</code>, call <code>e.preventDefault()</code>, defer the prompt, trigger it from your own button',
      '<code>SwPush.requestSubscription({ serverPublicKey })</code> returns a <code>PushSubscription</code> to send to your server for delivering push messages',
    ],
    interviewFocus: [
      'What does ng add @angular/pwa set up, and what is ngsw-config.json?',
      'What is the difference between freshness and performance caching strategies?',
      'Why must PWAs be served over HTTPS, and how do you test service workers locally?',
      'How do you detect and prompt users to update to a new app version?',
      'How does the beforeinstallprompt event enable a custom install button?',
    ],
  };
}
