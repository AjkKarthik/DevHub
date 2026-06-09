import { Component, signal } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../../shared/version-badge/version-badge';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';

@Component({
  selector: 'app-pwa',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './pwa.html',
  styleUrl: './pwa.scss',
})
export class PwaDemo {
  qna: QnaItem[] = [
    { q: 'What does ng add @angular/pwa do?', a: 'It installs <code>@angular/service-worker</code>, generates <code>ngsw-config.json</code> (caching rules), creates <code>src/manifest.webmanifest</code> (app name, icons, colours), and adds <code>provideServiceWorker()</code> to <code>app.config.ts</code>.' },
    { q: 'Why does the service worker only work on HTTPS?', a: 'Service workers can intercept all network requests — a huge security surface. Browsers restrict them to HTTPS (and localhost) to prevent man-in-the-middle attacks. Always deploy on HTTPS to use SW features.' },
    { q: 'What is the difference between freshness and performance caching strategies?', a: '<code>freshness</code> — always tries the network first, uses cache only on failure. Best for frequently-updated data. <code>performance</code> — serves from cache immediately, revalidates in background. Best for static assets and stable content.' },
    { q: 'How do you detect and apply a new app version?', a: 'Subscribe to <code>inject(SwUpdate).versionUpdates</code> and filter for <code>VersionReadyEvent</code>. Show a "New version available — refresh?" prompt. On confirm: <code>document.location.reload()</code>.' },
    { q: 'How do you unregister a service worker?', a: '<code>navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))</code>. Useful when debugging or deploying a hotfix — the old SW might serve stale cached responses.' },
    { q: 'What happens to the Angular app when the user is offline?', a: 'The service worker serves cached files from ngsw-config.json. The app shell (HTML, CSS, JS) loads from cache. API calls configured with <code>freshness</code> fail gracefully; those with <code>performance</code> strategy serve stale cached responses.' },
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
        'A Progressive Web App (PWA) is a web app that can be installed, works offline, and sends push notifications.',
        'PWAs use a Service Worker — a background script that intercepts network requests and manages a cache.',
        'Angular\'s @angular/pwa package sets up the service worker, manifest, and icons with one command.',
        'Installed PWAs appear on the home screen and app drawer — no app store required.',
      ],
    },
    {
      heading: 'Angular Service Worker',
      points: [
        'ng add @angular/pwa installs the service worker, adds ngsw-config.json, and updates angular.json.',
        'ngsw-config.json defines what to cache: app shell (always), asset groups, data groups (API).',
        'The service worker serves cached assets offline and shows a stale-while-revalidate strategy for APIs.',
        'SwUpdate service from @angular/service-worker lets you detect and apply app updates programmatically.',
      ],
    },
    {
      heading: 'Caching strategies',
      points: [
        'freshness — always fetch from network, fall back to cache on failure. Best for frequently-updated data.',
        'performance — serve from cache first, revalidate in background. Best for assets and stable content.',
        'Asset groups cache app files (HTML, JS, CSS) — configured under assetGroups in ngsw-config.json.',
        'Data groups cache API responses — configure urls, cacheConfig.maxAge, and cacheConfig.maxSize.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'Service workers only run on HTTPS (and localhost) — no HTTP deployment.',
        'SwUpdate.versionUpdates lets you show "New version available — refresh?" prompts.',
        'Unregister a broken service worker: navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister())).',
        'Use Chrome DevTools → Application → Service Workers to inspect, skip waiting, and simulate offline.',
      ],
    },
  ];

  tabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'bash',
      code: `# Add @angular/pwa — sets up SW, manifest, and icons automatically
ng add @angular/pwa

# Produces:
# - src/manifest.webmanifest        (app name, icons, theme colour)
# - ngsw-config.json               (caching rules)
# - src/app/app.config.ts updated  (isDevMode(), provideServiceWorker())`,
    },
    {
      label: 'ngsw-config.json',
      language: 'typescript',
      code: `{
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app-shell",
      "installMode": "prefetch",   // cache immediately on SW install
      "resources": { "files": ["/favicon.ico", "/index.html", "/*.css", "/*.js"] }
    },
    {
      "name": "assets",
      "installMode": "lazy",       // cache on first request
      "resources": { "files": ["/assets/**"] }
    }
  ],
  "dataGroups": [
    {
      "name": "api-posts",
      "urls": ["https://jsonplaceholder.typicode.com/posts"],
      "cacheConfig": { "strategy": "freshness", "maxSize": 100, "maxAge": "1h" }
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
    // Listen for new version available
    this.swUpdate.versionUpdates.pipe(
      filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'),
    ).subscribe(() => {
      if (confirm('New version available. Reload?')) {
        document.location.reload();
      }
    });
  }
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'Which command sets up the Angular service worker, manifest, and ngsw-config.json all at once?', options: ['npm install @angular/service-worker', 'ng generate service-worker', 'ng add @angular/pwa', 'ng build --service-worker'], answer: 2, explanation: 'ng add @angular/pwa is the schematic that installs @angular/service-worker, generates ngsw-config.json, creates src/manifest.webmanifest, and registers provideServiceWorker() in app.config.ts — all in one step.' },
    { q: 'In ngsw-config.json, what is the difference between \'freshness\' and \'performance\' caching strategies for data groups?', options: ['\'freshness\' always serves from cache; \'performance\' always fetches from network', '\'freshness\' tries the network first and falls back to cache on failure; \'performance\' serves from cache immediately and revalidates in the background', '\'freshness\' deletes cache on every request; \'performance\' caches for a fixed duration', 'Both strategies are identical — the names are aliases'], answer: 1, explanation: 'The \'freshness\' strategy prioritises up-to-date data by hitting the network first and only falling back to cache when offline. \'performance\' prioritises speed by returning the cached response immediately while revalidating in the background.' },
    { q: 'Why do service workers only work on HTTPS (and localhost)?', options: ['HTTPS provides faster download speeds for service worker scripts', 'HTTP servers cannot serve JavaScript files larger than 50 KB', 'Service workers can intercept all network requests, so browsers restrict them to HTTPS to prevent man-in-the-middle attacks', 'The Cache Storage API is only available when TLS certificates are present'], answer: 2, explanation: 'Because service workers act as a network proxy — intercepting every request — browsers enforce an HTTPS-only policy to prevent a malicious script on a plain HTTP page from hijacking traffic.' },
    { q: 'Which Angular service and event type would you use to detect that a new version of your app is ready to be applied?', options: ['SwRegistration and ServiceWorkerReadyEvent', 'SwPush and PushSubscriptionChangeEvent', 'SwUpdate and VersionReadyEvent', 'ServiceWorkerModule and ActivationEvent'], answer: 2, explanation: 'SwUpdate (from @angular/service-worker) exposes the versionUpdates observable. You filter it for events where e.type === \'VERSION_READY\' (typed as VersionReadyEvent) to know a new build is cached and ready.' },
    { q: 'In the ngsw-config.json assetGroups section, what is the difference between installMode: \'prefetch\' and installMode: \'lazy\'?', options: ['\'prefetch\' caches files only after the user first visits them; \'lazy\' pre-downloads everything at install time', '\'prefetch\' downloads and caches all listed files immediately when the service worker installs; \'lazy\' caches files only when they are first requested', '\'prefetch\' is for JavaScript bundles only; \'lazy\' works for all asset types', 'There is no functional difference — they are both eager-loading strategies'], answer: 1, explanation: 'installMode: \'prefetch\' causes the service worker to download and cache all matched resources during its install phase, ensuring they are available offline immediately. installMode: \'lazy\' defers caching until each file is actually requested at runtime.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'provideServiceWorker()', type: 'function', desc: 'Registers the Angular service worker and configures its behaviour in app.config.ts.' , since: '12'},
    { name: 'SwUpdate', type: 'class', desc: 'Injectable service that exposes versionUpdates observable for detecting and applying new app versions.' , since: '5'},
    { name: 'VersionReadyEvent', type: 'interface', desc: 'Event emitted by SwUpdate.versionUpdates when a new build is fully cached and ready to activate.' , since: '13'},
    { name: 'SwPush', type: 'class', desc: 'Injectable service for subscribing to and receiving Web Push notifications via the service worker.' , since: '5'},
    { name: 'navigator.serviceWorker.getRegistration()', type: 'function', desc: 'Browser API that returns a Promise resolving to the active ServiceWorkerRegistration or undefined.' , since: '2'},
    { name: 'ngsw-config.json assetGroups', type: 'interface', desc: 'Configuration block that defines which app-shell and static asset files the service worker should cache and with what install mode.' , since: '5'},
    { name: 'ngsw-config.json dataGroups', type: 'interface', desc: 'Configuration block that defines API URL patterns to cache along with strategy, maxAge, and maxSize settings.' , since: '5'},
    { name: 'SwUpdate.versionUpdates', type: 'function', desc: 'Observable stream of service worker lifecycle events including VERSION_READY, VERSION_INSTALLATION_FAILED, and VERSION_DETECTED.' , since: '13'},
    { name: 'ng add @angular/pwa', type: 'function', desc: 'Angular schematic that installs @angular/service-worker, generates ngsw-config.json and manifest.webmanifest, and registers provideServiceWorker().' , since: '6'},
    { name: 'document.location.reload()', type: 'function', desc: 'Browser API used to force a full page reload so the newly activated service worker version is served to the user.' , since: '2'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Providing the service worker: old NgModule vs new standalone', before: '// app.module.ts (NgModule era)\nimport { ServiceWorkerModule } from \'@angular/service-worker\';\n@NgModule({\n  imports: [\n    ServiceWorkerModule.register(\'ngsw-worker.js\', { enabled: !isDevMode() })\n  ]\n})\nexport class AppModule {}', after: '// app.config.ts (standalone / Angular 19+)\nimport { provideServiceWorker } from \'@angular/service-worker\';\nexport const appConfig: ApplicationConfig = {\n  providers: [\n    provideServiceWorker(\'ngsw-worker.js\', { enabled: !isDevMode() })\n  ]\n};',
      note: 'provideServiceWorker() replaces ServiceWorkerModule.register() in standalone apps.' },
    { title: 'Detecting updates: manual polling vs versionUpdates observable', before: '// Old pattern — manually checking for updates\nswUpdate.checkForUpdate().then(available => {\n  if (available) { document.location.reload(); }\n});', after: '// New pattern — reactive observable with typed event filter\nswUpdate.versionUpdates.pipe(\n  filter((e): e is VersionReadyEvent => e.type === \'VERSION_READY\')\n).subscribe(() => {\n  if (confirm(\'New version available. Reload?\')) document.location.reload();\n});',
      note: 'versionUpdates (Angular 13+) replaces the deprecated available and activated observables.' },
    { title: 'Injecting SwUpdate: constructor injection vs inject()', before: '// Constructor injection\nconstructor(private swUpdate: SwUpdate) {\n  this.swUpdate.versionUpdates.subscribe(...);\n}', after: '// inject() — works in constructor body or field initialiser\nprivate swUpdate = inject(SwUpdate);\nconstructor() {\n  this.swUpdate.versionUpdates.subscribe(...);\n}',
      note: 'inject() is preferred in modern Angular; it avoids the constructor parameter boilerplate.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Testing the service worker with ng serve', wrong: '// Running ng serve and expecting SW to cache files\nng serve\n// Service worker is silently disabled in development mode', right: '// Build for production and serve with a static server\nng build\nnpx serve dist/my-app/browser', explanation: 'Angular disables the service worker when isDevMode() is true. You must build with ng build and serve the production output to test SW caching and update behaviour.'  },
    { title: 'Forgetting HTTPS requirement in production', wrong: '// Deploying to plain HTTP and wondering why SW never registers\nhttp://my-app.example.com  // SW registration silently fails', right: '// Deploy to HTTPS; SW works on HTTPS + localhost only\nhttps://my-app.example.com', explanation: 'Browsers enforce HTTPS for service workers because they intercept all network traffic. Plain HTTP deployments will never register a service worker.'  },
    { title: 'Using \'performance\' strategy for frequently-updated API data', wrong: '// ngsw-config.json — wrong strategy for live API\n{ "name": "live-prices", "urls": ["/api/prices"],\n  "cacheConfig": { "strategy": "performance" } }', right: '// Use \'freshness\' so the network is always tried first\n{ "name": "live-prices", "urls": ["/api/prices"],\n  "cacheConfig": { "strategy": "freshness", "maxAge": "1m" } }', explanation: 'The \'performance\' strategy serves stale cached responses until they expire, which is wrong for live data. Use \'freshness\' to always attempt a network request and fall back to cache only when offline.'  },
    { title: 'Not unregistering a broken service worker during debugging', wrong: '// Deploying a hotfix but the old SW keeps serving cached 404s\n// without unregistering first — users stay stuck on broken version', right: '// Unregister all service workers programmatically\nnavigator.serviceWorker.getRegistrations()\n  .then(regs => regs.forEach(r => r.unregister()));', explanation: 'If you deploy a broken service worker or need to force a fresh install, you must unregister existing workers. Chrome DevTools > Application > Service Workers also lets you skip waiting and unregister manually.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: '13', label: 'SwUpdate modernised', features: ['versionUpdates observable replaces deprecated available and activated observables', 'VersionReadyEvent, VersionDetectedEvent, and VersionInstallationFailedEvent provide typed events', 'SwUpdate.isEnabled lets you guard SW-only code paths safely'] },
    { version: '12', label: 'Standalone-ready service worker', features: ['provideServiceWorker() function introduced for standalone app configs (app.config.ts)', 'ServiceWorkerModule.register() still works in NgModule apps but is no longer the only option'] },
  ];

  challenge: Challenge = {
    title: 'Build an Offline Status Banner with Service Worker Detection',
    description: 'Create a standalone Angular component called OfflineStatusComponent that: (1) displays a green \'Online\' badge when the browser has network access and a red \'Offline — cached content\' banner when it does not, (2) uses Angular signals (signal, computed) to track online/offline state by listening to window \'online\' and \'offline\' events, and (3) shows the service worker registration scope if a service worker is registered, or \'No service worker registered\' otherwise. Both pieces of state must update reactively without requiring a page reload.',
    language: 'typescript',
    hints: [
      'Use signal(navigator.onLine) to initialise your online state, then call window.addEventListener(\'online\', ...) and window.addEventListener(\'offline\', ...) in the constructor to keep it current.',
      'Use navigator.serviceWorker.getRegistration() — it returns a Promise that resolves to a ServiceWorkerRegistration or undefined. Store the result in a signal<string>.',
      'Use computed() to derive a badge label like \'Online\' or \'Offline — cached content\' from your online signal so the template stays clean.',
      'In the template, bind [class.online] and [class.offline] on the badge element to switch CSS classes reactively using the signal value.',
    ],
    starterCode: `import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-offline-status',
  standalone: true,
  imports: [CommonModule],
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
  // TODO: declare isOnline signal using navigator.onLine
  // TODO: declare swScope signal<string> initialised to 'Checking…'
  // TODO: declare a computed label that returns 'Online' or 'Offline — cached content'

  constructor() {
    // TODO: listen for window online/offline events and update isOnline
    // TODO: call navigator.serviceWorker.getRegistration() and update swScope
  }
}`,
    solution: `import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-offline-status',
  standalone: true,
  imports: [CommonModule],
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
  isOnline  = signal(navigator.onLine);
  swScope   = signal('Checking…');
  statusLabel = computed(() => this.isOnline() ? 'Online' : 'Offline — cached content');

  constructor() {
    window.addEventListener('online',  () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        this.swScope.set(reg ? 'Registered — scope: ' + reg.scope : 'No service worker registered');
      });
    } else {
      this.swScope.set('Service workers not supported in this browser');
    }
  }
}`,
  };
}
