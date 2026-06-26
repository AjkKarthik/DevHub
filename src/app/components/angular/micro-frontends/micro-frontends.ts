import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';

@Component({
  selector: 'app-micro-frontends',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, PrerequisitesComponent, BeforeAfterComponent,
  ],
  templateUrl: './micro-frontends.html',
  styleUrl: './micro-frontends.scss',
})
export class MicroFrontendsDemo {

  prerequisites: Prerequisite[] = [
    { label: 'Routing',         route: '/angular/routing' },
    { label: 'Lazy Loading',    route: '/angular/preloading' },
    { label: 'SSR + Hydration', route: '/angular/ssr' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'Native Federation',        type: 'token',    desc: '@angular-architects/native-federation — Module Federation without Webpack; works with esbuild/Vite', since: 'Angular 17+' },
    { name: 'Module Federation',        type: 'token',    desc: 'Webpack 5 plugin: share code across separately deployed builds at runtime via a remote entry manifest', since: 'Webpack 5' },
    { name: 'loadRemoteModule()',        type: 'function', desc: 'Native Federation helper to dynamically import a module from a remote at the given URL', since: 'NF 17' },
    { name: 'remoteEntry.json',         type: 'token',    desc: 'Native Federation manifest file — lists the remote\'s exposed modules and their chunk paths', since: 'NF 17' },
    { name: 'setRemoteDefinitions()',   type: 'function', desc: 'Register remote URLs at runtime before lazy routes resolve — enables dynamic remote discovery', since: 'NF 17' },
    { name: 'shareAll()',               type: 'function', desc: 'Share all dependencies between host and remote — prevents duplicate Angular instances', since: 'NF 17' },
    { name: 'Web Components',           type: 'class',    desc: 'Framework-agnostic micro-frontend alternative: @angular/elements wraps Angular components as custom elements', since: 'Angular 6' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What are micro-frontends and when to use them?',
      points: [
        'A micro-frontend (MFE) architecture splits a large frontend application into independently deployable pieces — each owned by a separate team, built and deployed on its own schedule. The shell (host) application composes them at runtime.',
        'MFEs solve organisational problems: when multiple teams working on a monorepo create merge conflicts, slow CI, and release coupling, splitting into separate deployable units gives each team full autonomy. This is an architectural decision driven by team topology, not technology.',
        'The trade-offs are real: increased complexity (shared dependencies, version conflicts, cross-app communication), potential for duplicated Angular runtimes (high bundle cost), and harder debugging across app boundaries. MFEs are not the default — they are appropriate for large orgs with many teams on a single product.',
        'For Angular, two main approaches: <strong>Module Federation</strong> (Webpack 5, mature but tied to Webpack) and <strong>Native Federation</strong> (esbuild/Vite compatible, uses importmaps, recommended for Angular 17+ projects).',
      ],
    },
    {
      heading: 'Native Federation vs Module Federation',
      points: [
        '<strong>Module Federation</strong> (Webpack 5) is the original approach — it patches the Webpack runtime to load remote modules. It works but requires every app to use Webpack, which conflicts with Angular 17\'s default esbuild builder.',
        '<strong>Native Federation</strong> (<code>@angular-architects/native-federation</code>) reimplements federation using browser-native import maps instead of Webpack runtime patches. This makes it builder-agnostic — it works with Angular\'s default esbuild builder and Vite.',
        'Native Federation\'s <code>remoteEntry.json</code> is a manifest (not a JS file) listing exposed modules and shared library chunk paths. The host fetches this JSON, registers import map entries, then <code>loadRemoteModule()</code> imports the exposed module dynamically.',
        'For new Angular 17+ projects, prefer Native Federation. For existing Webpack-based projects, Module Federation with <code>@angular-architects/module-federation</code> remains the pragmatic choice.',
      ],
    },
    {
      heading: 'Shell and remote architecture',
      points: [
        'The <strong>shell (host)</strong> is the app the user navigates to. It owns routing, the shared UI chrome (nav, footer), and authentication. It composes remotes by lazy-loading them via routes.',
        '<strong>Remotes</strong> are separately deployed Angular apps. They expose one or more Angular modules or standalone routes via their federation config. They can run standalone (useful for team development) or be consumed by the shell.',
        'The shell registers remote URLs with <code>setRemoteDefinitions()</code> at startup — often by fetching a config file from a backend, enabling zero-downtime remote deployments without redeploying the shell.',
        'Lazy routes in the shell use <code>loadRemoteModule()</code> as the <code>loadComponent</code> or <code>loadChildren</code> value — the router fetches and activates the remote module exactly like a local lazy route, but the code comes from a different origin.',
      ],
    },
    {
      heading: 'Sharing dependencies — the version conflict problem',
      points: [
        'The most critical MFE configuration decision: shared dependencies. If the shell and remote each bundle their own Angular, users download Angular twice and get two separate Angular runtimes — components from one app cannot interact with the other.',
        '<code>shareAll()</code> shares all dependencies using their installed versions. <code>share({ "@angular/core": { singleton: true, strictVersion: true } })</code> gives fine-grained control. <code>singleton: true</code> ensures only one instance loads; <code>strictVersion: true</code> throws if versions are incompatible.',
        'The recommended pattern: shell and all remotes should share the same Angular version range. Use a monorepo or lock file synchronisation to keep versions aligned. Version mismatches cause runtime errors that are hard to diagnose.',
        'Not all libraries should be shared — only those that require singletons (Angular itself, Angular Router, RxJS) or are large. Utility libraries with no singleton requirement can be safely duplicated.',
      ],
    },
    {
      heading: 'Cross-MFE communication',
      points: [
        'MFEs must communicate without tight coupling. Three patterns: <strong>shared service</strong> (works only within the same Angular runtime — singleton via shell), <strong>custom events</strong> (browser CustomEvent dispatched on <code>window</code> — framework-agnostic), and <strong>shared state store</strong> (NgRx/signal store in a shared library).',
        'For navigation: use the shell\'s Router. Remotes should not import Router from their own bundle if they share it with the shell — they get the shell\'s router singleton via shared deps, so <code>inject(Router)</code> gives them the shell router.',
        'For typed cross-app events, define a shared events package both shell and remotes depend on: <code>window.dispatchEvent(new CustomEvent("cart:updated", { detail: { count: 3 } }))</code>. The other app listens via <code>window.addEventListener</code>.',
        'Avoid storing MFE communication state in sessionStorage/localStorage as a message bus — it creates hard-to-debug coupling and requires polling. Use events or a shared reactive store.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Native Federation setup',
      language: 'typescript',
      code: `// Terminal — scaffold shell and remote
ng new shell-app
ng new remote-mfe
cd shell-app && ng add @angular-architects/native-federation --project shell-app --port 4200 --type host
cd ../remote-mfe && ng add @angular-architects/native-federation --project remote-mfe --port 4201 --type remote

// federation.config.js (remote-mfe)
const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'mfe1',
  exposes: {
    // Expose a standalone route set — consumed by the shell's router
    './routes': './src/app/remote.routes.ts',
  },
  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    }),
  },
  // Do NOT share everything — only singletons that break if duplicated
  skip: ['rxjs/ajax', 'rxjs/fetch', 'rxjs/webSocket', 'rxjs/testing'],
});`,
    },
    {
      label: 'Shell routing with loadRemoteModule',
      language: 'typescript',
      code: `// shell-app/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home').then(m => m.HomeComponent) },

  // Lazy-load an entire route set from the remote
  {
    path: 'products',
    loadChildren: () =>
      loadRemoteModule('mfe1', './routes').then(m => m.PRODUCT_ROUTES),
  },

  // Or lazy-load a single component from the remote
  {
    path: 'cart',
    loadComponent: () =>
      loadRemoteModule('mfe1', './routes').then(m => m.CartComponent),
  },
];

// shell-app/src/main.ts — register remote URLs at startup
import { initFederation } from '@angular-architects/native-federation';

initFederation({
  // Map remote name → remoteEntry.json URL
  // In production, fetch this from a config API instead
  mfe1: 'http://localhost:4201/remoteEntry.json',
})
  .catch(console.error)
  .then(() => import('./bootstrap'))
  .catch(console.error);`,
    },
    {
      label: 'Dynamic remote discovery',
      language: 'typescript',
      code: `// Fetch remote URLs from a config API at startup — zero-downtime remote deploys
// shell-app/src/main.ts
import { initFederation } from '@angular-architects/native-federation';

fetch('/api/mfe-config')
  .then(res => res.json())
  .then((config: Record<string, string>) => {
    // config = { "mfe1": "https://products.example.com/remoteEntry.json",
    //            "mfe2": "https://checkout.example.com/remoteEntry.json" }
    return initFederation(config);
  })
  .then(() => import('./bootstrap'))
  .catch(console.error);

// When a new version of mfe1 is deployed, only the config API changes.
// The shell does NOT need to be redeployed — it picks up the new URL on next load.

// remote-mfe/src/app/remote.routes.ts (exposed module)
import { Routes } from '@angular/router';
import { ProductListComponent } from './product-list/product-list';
import { ProductDetailComponent } from './product-detail/product-detail';

export const PRODUCT_ROUTES: Routes = [
  { path: '',     component: ProductListComponent },
  { path: ':id',  component: ProductDetailComponent },
];`,
    },
    {
      label: 'Cross-MFE communication',
      language: 'typescript',
      code: `// shared-events/src/index.ts (shared npm package or nx library)
export interface CartUpdatedEvent extends CustomEvent {
  detail: { itemCount: number; total: number };
}

export const CART_UPDATED = 'mfe:cart:updated';

// In the cart remote — dispatch a typed event
@Injectable({ providedIn: 'root' })
export class CartEventService {
  notifyCartUpdated(itemCount: number, total: number): void {
    window.dispatchEvent(
      new CustomEvent(CART_UPDATED, { detail: { itemCount, total }, bubbles: true })
    );
  }
}

// In the shell header — listen for cart updates
@Component({ selector: 'app-header', standalone: true, template: '...' })
export class HeaderComponent implements OnInit, OnDestroy {
  cartCount = signal(0);
  private listener = (e: Event) => {
    const ev = e as CartUpdatedEvent;
    this.cartCount.set(ev.detail.itemCount);
  };

  ngOnInit()    { window.addEventListener(CART_UPDATED, this.listener); }
  ngOnDestroy() { window.removeEventListener(CART_UPDATED, this.listener); }
}`,
    },
    {
      label: 'Angular Elements (Web Components)',
      language: 'typescript',
      code: `// Angular Elements — wrap Angular component as a framework-agnostic custom element
// Useful when remotes need to be embedded in non-Angular shells (React, Vue, legacy)
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { ProductWidgetComponent } from './product-widget/product-widget';

// main.ts for elements bundle
(async () => {
  const app = await createApplication({
    providers: [provideHttpClient()],
  });

  const ProductWidgetElement = createCustomElement(ProductWidgetComponent, {
    injector: app.injector,
  });

  // Register the custom element — usable from any HTML/framework
  customElements.define('app-product-widget', ProductWidgetElement);
})();

// Consumed in any HTML page or React/Vue component:
// <app-product-widget product-id="123" />
// Inputs become attributes; outputs become DOM events

// product-widget.component.ts
@Component({
  selector: 'app-product-widget',
  standalone: true,
  template: \`<div>{{ productId() }}: {{ product()?.name }}</div>\`,
})
export class ProductWidgetComponent {
  // Input becomes HTML attribute product-id (kebab-case auto-mapping)
  productId = input.required<string>();
  product   = signal<Product | null>(null);
}`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Module Federation (Webpack) vs Native Federation (esbuild)',
      before: `// Module Federation — requires Webpack, breaks with Angular 17+ esbuild default
// webpack.config.js in every app
new ModuleFederationPlugin({
  name: 'shell',
  remotes: { mfe1: 'mfe1@http://localhost:4201/remoteEntry.js' },
  shared: share({ '@angular/core': { singleton: true } }),
})
// Must configure angular.json to use custom Webpack builder:
// "builder": "@angular-builders/custom-webpack:browser"`,
      after: `// Native Federation — works with Angular's default esbuild builder
// federation.config.js
module.exports = withNativeFederation({
  name: 'shell',
  remotes: { mfe1: 'http://localhost:4201/remoteEntry.json' },
  shared: shareAll({ singleton: true, strictVersion: true }),
});
// Keep angular.json default builder — no Webpack dependency`,
      note: 'Native Federation uses browser import maps instead of Webpack runtime patches, making it compatible with esbuild and Vite.',
      language: 'typescript',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not sharing Angular as a singleton — duplicate runtime',
      wrong: `// Remote bundles its own Angular instead of sharing the shell's
module.exports = withNativeFederation({
  name: 'mfe1',
  exposes: { './routes': './src/app/remote.routes.ts' },
  shared: {},  // Nothing shared — Angular bundled twice
});
// Result: two Angular runtimes, ~500KB extra, cross-app DI breaks`,
      right: `module.exports = withNativeFederation({
  name: 'mfe1',
  exposes: { './routes': './src/app/remote.routes.ts' },
  shared: shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
});
// One Angular runtime — shell's version used by all remotes`,
      explanation: 'Without sharing Angular, each remote bundles its own copy. The browser downloads Angular multiple times and two separate Angular DI containers exist — components from different runtimes cannot inject shared services or use the same Router.',
    },
    {
      title: 'Hardcoding remote URLs in the shell build',
      wrong: `// URL baked into the bundle — redeploying the remote at a new URL
// requires rebuilding and redeploying the shell too
initFederation({
  mfe1: 'https://v1.products.example.com/remoteEntry.json',
})`,
      right: `// Fetch config at runtime — redeploy remote without touching shell
fetch('/api/mfe-config')
  .then(res => res.json())
  .then(config => initFederation(config))
  .then(() => import('./bootstrap'));
// Config API returns: { "mfe1": "https://v2.products.example.com/remoteEntry.json" }`,
      explanation: 'Hardcoded URLs mean every remote deployment potentially requires a shell rebuild. Fetching remote URLs from a config endpoint at startup decouples the shell from remote deployments — the shell never needs to know a remote\'s URL at build time.',
    },
    {
      title: 'Using strict version mismatch between shell and remote',
      wrong: `// Shell has @angular/core 17.3, remote has 17.1
// With strictVersion: true — throws at runtime
// With singleton: true, no strictVersion — silently uses wrong version`,
      right: `// Keep all apps on the same Angular minor version
// Use a monorepo or shared package.json to synchronise versions
// Check with: nx show project shell --web (or ng version in each app)

// federation.config.js — let Native Federation resolve automatically
shared: shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' })
// "auto" reads the installed version from package.json at build time`,
      explanation: 'Version mismatches between shared singletons cause hard-to-diagnose runtime errors: "Cannot read properties of undefined", broken change detection, or invisible components. Keep all MFE apps on the same Angular version range.',
    },
    {
      title: 'Importing between remote modules at build time',
      wrong: `// shell imports directly from remote at build time — tight coupling
import { CartService } from 'remote-mfe/cart';  // compile-time dependency
// Now shell MUST build after mfe — defeats independent deployment`,
      right: `// Share via a workspace library (nx library / npm package)
import { CartEvent } from '@my-org/shared-events';  // shared lib, not remote
// Remote and shell both depend on the shared lib — no direct coupling
// Communication at runtime via events or shared service from the shared lib`,
      explanation: 'Direct compile-time imports from remote apps create build-time coupling — you must build in dependency order and cannot deploy independently. Shared code must live in a workspace library that both apps depend on.',
    },
  ];

  challenge: Challenge = {
    title: 'Configure a Native Federation shell and remote',
    language: 'typescript',
    description: `Design the configuration for a two-app Native Federation setup:
1. Write the federation.config.js for a remote called "dashboard" that exposes its routes at './routes', sharing all deps as singletons
2. Write the shell's main.ts that fetches remote URLs from /api/remotes then initialises federation and bootstraps
3. Add a lazy route in the shell that loads the dashboard's DASHBOARD_ROUTES from the remote
4. Write a shared event helper for a "data:refresh" custom event that both apps can dispatch/listen to`,
    hints: [
      'Remote config: withNativeFederation({ name, exposes, shared: shareAll(...) })',
      'Shell main.ts: fetch() → initFederation(config) → import("./bootstrap")',
      'Lazy route: loadChildren: () => loadRemoteModule("dashboard", "./routes").then(m => m.DASHBOARD_ROUTES)',
      'Custom event: new CustomEvent("data:refresh", { detail: { source: "dashboard" } })',
      'window.addEventListener / window.removeEventListener in ngOnInit/ngOnDestroy',
    ],
    starterCode: `// remote dashboard/federation.config.js
const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');
module.exports = withNativeFederation({
  // TODO: name, exposes, shared
});

// shell main.ts
// TODO: fetch /api/remotes → initFederation → import('./bootstrap')

// shell app.routes.ts
export const routes: Routes = [
  // TODO: lazy route for /dashboard using loadRemoteModule
];

// shared-events/index.ts
// TODO: DATA_REFRESH constant and dispatch/listen helpers`,
    solution: `// remote dashboard/federation.config.js
const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');
module.exports = withNativeFederation({
  name: 'dashboard',
  exposes: {
    './routes': './src/app/dashboard.routes.ts',
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
});

// shell main.ts
import { initFederation } from '@angular-architects/native-federation';

fetch('/api/remotes')
  .then(res => res.json())
  .then((remotes: Record<string, string>) => initFederation(remotes))
  .then(() => import('./bootstrap'))
  .catch(console.error);

// shell app.routes.ts
import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home/home').then(m => m.HomeComponent) },
  {
    path: 'dashboard',
    loadChildren: () =>
      loadRemoteModule('dashboard', './routes').then(m => m.DASHBOARD_ROUTES),
  },
];

// shared-events/index.ts
export const DATA_REFRESH = 'data:refresh';

export function dispatchDataRefresh(source: string): void {
  window.dispatchEvent(new CustomEvent(DATA_REFRESH, { detail: { source }, bubbles: true }));
}

export function onDataRefresh(handler: (source: string) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent).detail.source);
  window.addEventListener(DATA_REFRESH, listener);
  return () => window.removeEventListener(DATA_REFRESH, listener);  // returns cleanup fn
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the main advantage of Native Federation over Module Federation for Angular 17+ projects?',
      options: [
        'Native Federation supports TypeScript; Module Federation does not',
        'Native Federation works with Angular\'s default esbuild builder; Module Federation requires Webpack',
        'Native Federation shares more code automatically than Module Federation',
        'Native Federation uses Service Workers; Module Federation uses iframes',
      ],
      answer: 1,
      explanation: 'Angular 17+ defaults to the esbuild builder which is incompatible with Module Federation\'s Webpack plugin. Native Federation uses browser-native import maps and works with any bundler, including esbuild and Vite.',
    },
    {
      q: 'Why must Angular be shared as a singleton across all micro-frontends?',
      options: [
        'For tree-shaking to work correctly across all bundles',
        'Because multiple Angular runtimes break DI and cross-app component interaction, and doubles the bundle cost',
        'Because Angular\'s change detection only works with one NgZone per page',
        'To comply with Angular\'s license — only one copy per page is allowed',
      ],
      answer: 1,
      explanation: 'Two Angular runtimes mean two separate DI containers. Services injected in one runtime are invisible to the other. Change detection, Router, and form APIs all break across the boundary. It also downloads Angular twice.',
    },
    {
      q: 'What does setRemoteDefinitions() / initFederation() called in main.ts enable?',
      options: [
        'Compile-time inclusion of remote modules into the shell bundle',
        'Runtime registration of remote URLs — enables dynamic remote discovery without rebuilding the shell',
        'Validation that all remote apps are online before the shell loads',
        'Automatic version synchronisation between shell and remote dependencies',
      ],
      answer: 1,
      explanation: 'initFederation() registers the remote name → remoteEntry.json URL mapping at runtime. If you fetch these URLs from a config API, you can deploy new versions of remotes without redeploying the shell — the shell picks up the new URL on next load.',
    },
    {
      q: 'What is the correct way to share data between micro-frontends without tight coupling?',
      options: [
        'Direct TypeScript imports between remote apps at build time',
        'Custom DOM events on window, or a shared signal/NgRx store in a workspace library',
        'SessionStorage as a shared message bus between apps',
        'Injecting services from one Angular app into another via the DI system',
      ],
      answer: 1,
      explanation: 'Direct build-time imports create coupling (must build in order, can\'t deploy independently). Custom events on window are framework-agnostic and decoupled. A shared library for typed events or a shared signal store are the clean Angular patterns.',
    },
    {
      q: 'When are Angular Elements the right micro-frontend approach?',
      options: [
        'When all micro-frontends are Angular apps and share the same version',
        'When Angular components need to be embedded in non-Angular shells (React, Vue, plain HTML)',
        'When micro-frontends need to share the same Angular Router instance',
        'When you want faster build times than Native Federation provides',
      ],
      answer: 1,
      explanation: 'Angular Elements wraps Angular components as standard Web Components (custom elements). This makes them consumable from any framework or plain HTML. Use it when the shell is not Angular or when framework-agnostic distribution is needed.',
    },
    {
      q: 'How do you handle CSS style isolation between micro-frontends on the same page?',
      options: [
        'CSS classes never conflict because micro-frontends run in iframes',
        'Use Angular\'s component ViewEncapsulation (Emulated or ShadowDom), a unique CSS prefix per MFE, or CSS Modules to prevent class name collisions',
        'Global styles.scss is shared automatically between all micro-frontends',
        'Style conflicts are handled by Native Federation\'s style registry',
      ],
      answer: 1,
      explanation: 'Multiple Angular apps on the same page share the same DOM, so global CSS classes collide. Solutions: Angular\'s Emulated encapsulation scopes component styles with _ngcontent attributes; ShadowDom uses true browser shadow roots. For global resets, assign a unique BEM namespace per MFE (e.g., .mfe-shell-*, .mfe-cart-*).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use micro-frontends for my Angular project?',
      a: 'Probably not unless you have multiple independent teams working on a single user-facing product and the coordination overhead has become a real problem. MFEs add significant complexity: shared dependency management, cross-app communication, deployment coordination, and debugging across bundle boundaries. For a single team or small org, a well-structured monorepo with lazy loading gives most of the benefits without the MFE operational cost.',
    },
    {
      q: 'How do I handle authentication across micro-frontends?',
      a: 'Authentication should live in the shell. The shell handles login, stores the token (HTTP-only cookie or secure storage), and adds auth headers via an HTTP interceptor registered once in the shell. Since Angular and the Router are shared singletons, remotes get the same interceptor automatically. If remotes can run standalone (without the shell), they need their own auth flow for development, but in production they rely on the shell.',
    },
    {
      q: 'Can I mix Angular versions across micro-frontends?',
      a: 'Not safely. Sharing Angular as a singleton means all apps must use a compatible Angular version. With strictVersion: true, version mismatches throw at runtime. With singleton: true but no strictVersion, the first-loaded version wins silently — the other app may get an incompatible version. The practical requirement is: all MFEs on the same Angular major version, ideally the same minor. Use a monorepo or lock file sync to enforce this.',
    },
    {
      q: 'How do I test micro-frontend integration locally?',
      a: 'Run each app on its own port (shell on 4200, remotes on 4201, 4202...). The shell\'s initFederation points to localhost URLs for development. For CI, use concurrently or a tool like @nx/web:dev-server to start all apps, then run e2e tests against the shell URL. Each remote should also have its own e2e suite so it can be tested standalone. Consider mocking remote entries in shell unit tests so they don\'t require live remote servers.',
    },
    {
      q: 'What is the key difference between Module Federation and Native Federation?',
      a: 'Module Federation (from Webpack) was the original Angular MFE solution — it requires Webpack, works with Webpack-specific plugins, and injects federation runtime into bundles. Native Federation (@angular-architects/native-federation) is the modern replacement — it uses esbuild (the Angular 17+ default builder), ES import maps, and native ESM. Native Federation is significantly faster to build and does not require Webpack, making it the recommended choice for new Angular 17+ MFE projects.',
    },
    {
      q: 'What are Angular Elements and when should I use them?',
      a: 'Angular Elements (createCustomElement from @angular/elements) wraps an Angular component as a custom HTML element (Web Component) — usable in any framework or plain HTML without Angular on the page. Use them when embedding an Angular component into a non-Angular shell (React, Vue, plain HTML), or when distributing a widget to teams who may not use Angular. They are heavier than Native Federation for full Angular remotes because they bundle Angular itself. For Angular-to-Angular MFEs, use Native Federation instead.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Micro-frontends split a large Angular app into independently deployable pieces. Use <strong>Native Federation</strong> (<code>@angular-architects/native-federation</code>) with Angular 17+ esbuild — share Angular as a singleton, fetch remote URLs at runtime, and communicate via shared events or a workspace library.',
    mustKnow: [
      'Native Federation uses import maps + esbuild (Angular 17+ default); Module Federation needs Webpack',
      '<code>shareAll({ singleton: true, strictVersion: true })</code> — one Angular runtime across all remotes',
      '<code>initFederation(config)</code> in <code>main.ts</code> before bootstrap — fetch config from API for dynamic remotes',
      '<code>loadRemoteModule("name", "./routes")</code> in lazy route\'s <code>loadChildren</code>',
      'Cross-MFE comms: custom events on <code>window</code>, or shared workspace library with typed events',
      'Angular Elements (<code>createCustomElement</code>) for embedding in non-Angular shells',
    ],
    interviewFocus: [
      '<strong>MFE trade-offs?</strong> — independent deployment + team autonomy vs shared dep complexity, duplicate runtime risk, harder debugging',
      '<strong>Native vs Module Federation?</strong> — Native = esbuild/Vite, import maps; Module = Webpack only',
      '<strong>Why singleton: true for Angular?</strong> — two Angular runtimes break DI, Router, and double the bundle',
      '<strong>Cross-MFE communication?</strong> — custom DOM events or shared workspace library; never direct build-time imports',
    ],
  };
}
