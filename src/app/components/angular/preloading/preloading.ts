import { Component, signal, computed } from '@angular/core';
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

type Strategy = 'none' | 'all' | 'selective' | 'quicklink';
type RouteStatus = 'eager' | 'lazy' | 'preloading' | 'loaded';

interface SimRoute {
  path: string;
  label: string;
  eager: boolean;
  preloadFlag: boolean;
  visibleInViewport: boolean;
  status: RouteStatus;
}

@Component({
  selector: 'app-preloading',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent, PrerequisitesComponent, RevisionCardComponent],
  templateUrl: './preloading.html',
  styleUrl: './preloading.scss',
})
export class PreloadingDemo {

  prerequisites: Prerequisite[] = [
    { label: 'Routing', route: '/angular/routing-demo' },
  ];

  // ── Strategy simulator ─────────────────────────────────────────────────────
  strategy = signal<Strategy>('none');
  simulating = signal(false);

  strategyOptions: { value: Strategy; label: string }[] = [
    { value: 'none',      label: 'NoPreloading' },
    { value: 'all',       label: 'PreloadAllModules' },
    { value: 'selective', label: 'Custom (data.preload)' },
    { value: 'quicklink', label: 'QuicklinkStrategy' },
  ];

  routes = signal<SimRoute[]>([
    { path: '/',          label: 'Home',          eager: true,  preloadFlag: false, visibleInViewport: true,  status: 'eager' },
    { path: '/dashboard', label: 'Dashboard',     eager: false, preloadFlag: true,  visibleInViewport: true,  status: 'lazy' },
    { path: '/profile',   label: 'Profile',       eager: false, preloadFlag: true,  visibleInViewport: false, status: 'lazy' },
    { path: '/settings',  label: 'Settings',      eager: false, preloadFlag: false, visibleInViewport: false, status: 'lazy' },
    { path: '/reports',   label: 'Reports',       eager: false, preloadFlag: false, visibleInViewport: false, status: 'lazy' },
    { path: '/admin',     label: 'Admin (heavy)',  eager: false, preloadFlag: false, visibleInViewport: false, status: 'lazy' },
  ]);

  strategyLabel = computed(() => ({
    none:       'NoPreloading — bundles load only when navigated to',
    all:        'PreloadAllModules — all lazy bundles preload in background',
    selective:  'Custom Strategy — only routes with data.preload=true preload',
    quicklink:  'QuicklinkStrategy — routes visible in viewport preload',
  }[this.strategy()]));

  setStrategy(s: Strategy) {
    this.strategy.set(s);
    this.resetRoutes();
  }

  resetRoutes() {
    this.routes.update(rs =>
      rs.map(r => ({ ...r, status: r.eager ? 'eager' : 'lazy' }))
    );
    this.simulating.set(false);
  }

  async simulate() {
    this.resetRoutes();
    this.simulating.set(true);

    const strategy = this.strategy();
    const lazy = this.routes().filter(r => !r.eager);

    let toPreload: SimRoute[] = [];
    if (strategy === 'all')        toPreload = lazy;
    if (strategy === 'selective')  toPreload = lazy.filter(r => r.preloadFlag);
    if (strategy === 'quicklink')  toPreload = lazy.filter(r => r.visibleInViewport);

    for (const route of toPreload) {
      await delay(600);
      this.routes.update(rs =>
        rs.map(r => r.path === route.path ? { ...r, status: 'preloading' } : r)
      );
      await delay(800);
      this.routes.update(rs =>
        rs.map(r => r.path === route.path ? { ...r, status: 'loaded' } : r)
      );
    }
    this.simulating.set(false);
  }

  // ── Resolver simulator ─────────────────────────────────────────────────────
  resolverMode = signal<'with' | 'without'>('with');
  resolverState = signal<'idle' | 'resolving' | 'done'>('idle');
  resolvedPost  = signal<{ id: number; title: string; body: string } | null>(null);
  noResolverPost = signal<{ id: number; title: string; body: string } | null>(null);
  noResolverLoading = signal(false);

  async navigateWithResolver() {
    this.resolverState.set('resolving');
    this.resolvedPost.set(null);
    await delay(1800);
    this.resolvedPost.set({
      id: 42,
      title: 'Angular Preloading Strategies',
      body: 'Data was fetched BEFORE the component rendered — no loading state needed inside the component.',
    });
    this.resolverState.set('done');
  }

  resetResolver() {
    this.resolverState.set('idle');
    this.resolvedPost.set(null);
  }

  async navigateWithoutResolver() {
    this.noResolverPost.set(null);
    this.noResolverLoading.set(true);
    await delay(1800);
    this.noResolverPost.set({
      id: 42,
      title: 'Angular Preloading Strategies',
      body: 'Data arrived AFTER component rendered — the component had to show a loading spinner first.',
    });
    this.noResolverLoading.set(false);
  }

  resetNoResolver() {
    this.noResolverPost.set(null);
    this.noResolverLoading.set(false);
  }

  // ── Content ────────────────────────────────────────────────────────────────
  theory: TheoryPoint[] = [
    {
      heading: 'What is route preloading?',
      points: [
        'Code splitting breaks your Angular app into separate JS chunk files — one per lazy route. Without preloading, each chunk downloads only when the user first navigates to that route, causing a visible delay.',
        'Preloading solves this by downloading lazy chunks in the <strong>background</strong> after the initial page load is complete — the browser is idle, so the download doesn\'t compete with rendering.',
        'When the user then navigates to a preloaded route, the chunk is already in the browser cache and activates instantly — zero network wait.',
        'Preloading is configured via <code>withPreloading(strategy)</code> passed to <code>provideRouter()</code> in <code>app.config.ts</code>. Only routes using <code>loadComponent</code> or <code>loadChildren</code> are eligible — eager routes are already in the main bundle.',
        'The correct mental model: preloading trades idle bandwidth for perceived navigation speed. Choose the strategy that matches your traffic patterns — not every app needs all routes preloaded.',
      ],
    },
    {
      heading: 'Built-in strategies — NoPreloading and PreloadAllModules',
      points: [
        '<code>NoPreloading</code> is Angular\'s default. Lazy bundles download only on first navigation — best for apps with many routes that users rarely visit, where preloading all would waste bandwidth.',
        '<code>PreloadAllModules</code> downloads every lazy bundle in the background after the initial load completes. Zero configuration beyond the single <code>withPreloading(PreloadAllModules)</code> call.',
        'Both strategies run preloading sequentially using idle browser time — they do not hammer the network with parallel downloads that would compete with user interactions.',
        'Import <code>PreloadAllModules</code> from <code>\'@angular/router\'</code> — it is a built-in Angular export, no third-party package needed.',
        'A subtle caveat with <code>PreloadAllModules</code>: on a large app with 50+ lazy routes, it downloads all of them — even the rarely-visited admin panel and settings pages. This may waste significant bandwidth on mobile users with data caps.',
      ],
    },
    {
      heading: 'Custom PreloadingStrategy — selective preloading',
      points: [
        'Implement the <code>PreloadingStrategy</code> interface — it requires a single <code>preload(route: Route, load: () => Observable&lt;unknown&gt;): Observable&lt;unknown&gt;</code> method.',
        'Return <code>load()</code> from the method to trigger preloading for that route. Return <code>of(null)</code> (imported from <code>\'rxjs\'</code>) to skip it. <strong>Never return null directly</strong> — Angular subscribes to the return value and null breaks the contract.',
        'Mark routes intended for preloading with <code>data: { preload: true }</code> in the route definition, then read <code>route.data?.[\'preload\']</code> inside the strategy.',
        'Register the strategy: <code>provideRouter(routes, withPreloading(SelectivePreload))</code>. Providing it with <code>@Injectable({ providedIn: \'root\' })</code> makes it tree-shakeable.',
        'Custom strategies receive the full <code>Route</code> object — you can read any property including <code>path</code>, <code>data</code>, and <code>title</code> to make fine-grained decisions per route.',
      ],
    },
    {
      heading: 'QuicklinkStrategy — viewport-based preloading',
      points: [
        '<code>QuicklinkStrategy</code> from the <code>ngx-quicklink</code> package uses the browser\'s <code>IntersectionObserver</code> API to detect which <code>&lt;a routerLink="..."&gt;</code> anchors are currently visible in the viewport.',
        'Routes whose links are in the viewport are preloaded — the assumption being that if the user can see a link, they are more likely to click it. No manual <code>data: { preload: true }</code> annotations are needed.',
        'Install with <code>npm install ngx-quicklink</code>, then <code>provideRouter(routes, withPreloading(QuicklinkStrategy))</code>. Works identically to any other strategy from the router\'s perspective.',
        'Quicklink is particularly effective for content-heavy sites with many links visible at once (dashboards, sitemaps, nav menus) — it predicts intent from what the user sees, not what the developer guesses upfront.',
        'A downside: IntersectionObserver fires continuously as the user scrolls, potentially triggering many preloads. For apps with long scrollable lists of links, combine with a bandwidth guard (see network-aware pattern).',
      ],
    },
    {
      heading: 'Network-aware preloading',
      points: [
        'The <code>Network Information API</code> (<code>navigator.connection</code>) exposes <code>effectiveType</code> (\'4g\', \'3g\', \'2g\', \'slow-2g\') and <code>saveData</code> (user requested reduced data usage).',
        'A network-aware strategy reads these properties and returns <code>of(null)</code> for slow connections or when <code>saveData</code> is true — preventing preloading from wasting precious mobile bandwidth.',
        '<code>navigator.connection</code> is not universally supported (notably missing in Safari). Always guard with an existence check: <code>const conn = (navigator as any).connection</code> — fall back to preloading as if the network is fast when the API is absent.',
        'You can also listen to the <code>\'change\'</code> event on <code>navigator.connection</code> to re-evaluate preloading as network conditions change during a session (not common but possible in a custom strategy class).',
        'Combining with selective flagging is best practice: network-aware + selective = preload only flagged routes AND only on fast networks. Both conditions must be true for a preload to proceed.',
      ],
    },
    {
      heading: 'Route resolvers — prefetching data before navigation',
      points: [
        'A route resolver runs before Angular activates the target component — it fetches data and injects it into the route via <code>ActivatedRoute.data</code> or as a signal-compatible input. The component renders with data already present.',
        'Functional resolvers (Angular 14+) are plain functions using <code>inject()</code>: <code>export const postResolver: ResolveFn&lt;Post&gt; = route =&gt; inject(PostService).getPost(route.paramMap.get(\'id\')!)</code>.',
        'Wire a resolver on a route: <code>{ path: \'posts/:id\', resolve: { post: postResolver }, loadComponent: () => import(\'./post\') }</code>. Access data via <code>route.data.post</code> or as a routed input with <code>withComponentInputBinding()</code>.',
        'The downside: navigation appears to "hang" while the resolver runs. If the resolver is slow, users see a frozen router outlet. Use a loading indicator in the shell, set a timeout, or prefer the resource API with its built-in loading state for long requests.',
        'Use resolvers for data that is small and fast to fetch (IDs → entities) or when the component has no meaningful state to show without the data. Avoid resolvers for long-running fetches — a loading skeleton in the component is better UX for slow data.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'PreloadAllModules',
      language: 'typescript',
      code: `// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),  // all lazy bundles preload after initial load
    ),
  ],
};

// app.routes.ts — any loadComponent route is eligible for preloading
export const routes: Routes = [
  { path: '',         component: HomeComponent },            // eager — always bundled
  { path: 'dashboard', loadComponent: () =>
      import('./dashboard/dashboard').then(m => m.DashboardComponent) },
  { path: 'settings',  loadComponent: () =>
      import('./settings/settings').then(m => m.SettingsComponent) },
  { path: 'admin',     loadChildren: () =>
      import('./admin/admin.routes').then(m => m.adminRoutes) },
];`,
    },
    {
      label: 'Custom strategy',
      language: 'typescript',
      code: `import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SelectivePreload implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    // Only preload routes explicitly flagged with data: { preload: true }
    return route.data?.['preload'] === true ? load() : of(null);
    //                                                   ^^ must be Observable, not null
  }
}

// Route definitions — only dashboard and profile are flagged:
const routes: Routes = [
  { path: 'dashboard', data: { preload: true },  loadComponent: () => import('./dashboard') },
  { path: 'profile',   data: { preload: true },  loadComponent: () => import('./profile')   },
  { path: 'settings',  data: { preload: false }, loadComponent: () => import('./settings')  },
  { path: 'admin',                               loadComponent: () => import('./admin')      },
];

// Register:
provideRouter(routes, withPreloading(SelectivePreload))`,
    },
    {
      label: 'QuicklinkStrategy',
      language: 'typescript',
      code: `// npm install ngx-quicklink
import { QuicklinkStrategy, QuicklinkModule } from 'ngx-quicklink';

// app.config.ts:
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(QuicklinkStrategy)),
  ],
};

// No route annotations needed — QuicklinkStrategy uses IntersectionObserver
// to preload routes whose <a routerLink> is visible in the viewport.

// In templates — these work as normal routerLinks:
// <nav>
//   <a routerLink="/dashboard">Dashboard</a>   ← in viewport → preloaded
//   <a routerLink="/settings">Settings</a>     ← in viewport → preloaded
// </nav>
// <a routerLink="/reports">Reports</a>         ← scrolled off → NOT preloaded

// QuicklinkModule is needed for standalone component imports if using
// the ngx-quicklink QuicklinkModule directive variant; for pure strategy
// registration the module import is not required.`,
    },
    {
      label: 'Network-aware strategy',
      language: 'typescript',
      code: `import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NetworkAwarePreload implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    // Skip if route is not explicitly flagged
    if (route.data?.['preload'] !== true) return of(null);

    // Check Network Information API (not supported in all browsers)
    const connection = (navigator as any).connection;
    if (connection) {
      // Skip on slow connections or when user requested reduced data
      const slowTypes = ['2g', 'slow-2g'];
      if (slowTypes.includes(connection.effectiveType) || connection.saveData) {
        return of(null);
      }
    }

    // API not supported (e.g. Safari) → assume fast network, proceed with preloading
    return load();
  }
}

// Usage:
provideRouter(routes, withPreloading(NetworkAwarePreload))`,
    },
    {
      label: 'Functional resolver',
      language: 'typescript',
      code: `// Functional resolver — Angular 14+
import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';

export interface Post { id: number; title: string; body: string; }

// A plain function — no class, no @Injectable needed
export const postResolver: ResolveFn<Post> = (route) =>
  inject(PostService).getPost(route.paramMap.get('id')!);

// Wire on the route:
const routes: Routes = [
  {
    path: 'posts/:id',
    resolve: { post: postResolver },
    loadComponent: () => import('./post/post').then(m => m.PostComponent),
  },
];

// Access in the component via withComponentInputBinding():
// app.config.ts:  provideRouter(routes, withComponentInputBinding())

@Component({ ... })
export class PostComponent {
  // Automatically bound from route.data.post via withComponentInputBinding
  post = input.required<Post>();
}

// Or manually via ActivatedRoute:
export class PostComponent {
  private route = inject(ActivatedRoute);
  post = toSignal(this.route.data.pipe(map(d => d['post'] as Post)));
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Which function call in provideRouter() enables PreloadAllModules?',
      options: ['withLazyLoading(PreloadAllModules)', 'withPreloading(PreloadAllModules)', 'enablePreloading(PreloadAllModules)', 'usePreloadingStrategy(PreloadAllModules)'],
      answer: 1,
      explanation: 'withPreloading(PreloadAllModules) is passed as a feature to provideRouter() in app.config.ts. Angular will then background-fetch all lazy route bundles after the initial page load completes.',
    },
    {
      q: 'What must a custom PreloadingStrategy\'s preload() method return to SKIP preloading a route?',
      options: ['null', 'false', 'of(null)', 'NEVER'],
      answer: 2,
      explanation: 'The preload() method must return an Observable — Angular subscribes to it. Returning of(null) (from rxjs) signals Angular to skip that route. Returning null or false directly throws a runtime error because Angular calls .subscribe() on the return value.',
    },
    {
      q: 'QuicklinkStrategy from ngx-quicklink decides which routes to preload based on what signal?',
      options: ['Routes marked with data: { preload: true }', 'Routes the user has visited before', 'routerLink elements currently visible in the viewport', 'Routes ranked by bundle size (smallest first)'],
      answer: 2,
      explanation: 'QuicklinkStrategy uses IntersectionObserver to observe which <a routerLink> anchors are visible in the viewport. Those routes are preloaded without any per-route annotation, mirroring Google\'s Quicklink library approach.',
    },
    {
      q: 'Which of the following is true about the NoPreloading strategy (Angular\'s default)?',
      options: ['It preloads bundles on a delay after the initial load', 'Lazy bundles are only fetched when the user first navigates to that route', 'It preloads routes based on a router priority queue', 'It is deprecated in Angular 17+ in favor of PreloadAllModules'],
      answer: 1,
      explanation: 'NoPreloading is the default. Lazy-loaded route bundles are only downloaded at the moment the user navigates to that route, causing a visible delay on first visit. No background loading occurs at any point.',
    },
    {
      q: 'How should routes be marked so only selected ones are preloaded by a custom strategy?',
      options: ['Add a preload: true property directly on the Route object at the top level', 'Set data: { preload: true } and check route.data?.[\'preload\'] inside preload()', 'Annotate the lazy component class with @Preload()', 'Pass a preloadRoutes array to withPreloading()'],
      answer: 1,
      explanation: 'Route definitions support a data property for arbitrary metadata. Setting data: { preload: true } and checking route.data?.[\'preload\'] inside the strategy\'s preload() method is the idiomatic pattern — return load() for marked routes and of(null) for the rest.',
    },
    {
      q: 'Which browser API does a network-aware preloading strategy typically use to detect slow connections?',
      options: ['navigator.bandwidth', 'window.networkStatus', 'navigator.connection.effectiveType', 'performance.getEntriesByType(\'network\')'],
      answer: 2,
      explanation: 'The Network Information API exposes navigator.connection.effectiveType with values like \'4g\', \'3g\', \'2g\', and \'slow-2g\'. Always guard with an existence check (navigator as any).connection since Safari does not support this API — fall back to preloading when the API is absent.',
    },
    {
      q: 'What is the main downside of using a route resolver for slow API calls?',
      options: [
        'Resolvers block the component from using signals',
        'Navigation appears to hang while the resolver runs — the user sees nothing until the data is fetched',
        'Resolvers prevent withPreloading() from working',
        'Functional resolvers do not work with withComponentInputBinding()',
      ],
      answer: 1,
      explanation: 'Angular holds navigation until the resolver completes. If the resolver takes 3+ seconds, the user sees the old page frozen with no feedback. For slow fetches, prefer loading the data inside the component with a skeleton/spinner, or set a resolver timeout with a catchError fallback.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is the default preloading strategy in Angular?', a: '<code>NoPreloading</code> — lazy-loaded bundles only download when the user first navigates to that route. No background loading occurs at any point. The user waits for the download on first visit to each lazy route.' },
    { q: 'How do you enable PreloadAllModules?', a: '<code>provideRouter(routes, withPreloading(PreloadAllModules))</code> in <code>app.config.ts</code>. After the initial page load, Angular downloads all lazy bundles in the background during idle time. First navigations to those routes feel instant because the chunk is already cached.' },
    { q: 'What is a custom PreloadingStrategy?', a: 'Implement the <code>PreloadingStrategy</code> interface: <code>preload(route, load) { return route.data?.[\'preload\'] ? load() : of(null); }</code>. Register with <code>withPreloading(MyStrategy)</code>. Only routes marked <code>data: { preload: true }</code> are preloaded — everything else is skipped.' },
    { q: 'What is QuicklinkStrategy?', a: '<code>ngx-quicklink</code>\'s strategy uses <code>IntersectionObserver</code> to detect which <code>routerLink</code> anchors are in the viewport, and preloads those routes automatically. No route annotations needed. Install with <code>npm install ngx-quicklink</code>, then <code>withPreloading(QuicklinkStrategy)</code>.' },
    { q: 'How do you verify preloading is working?', a: 'Open Chrome DevTools → Network tab → filter by <strong>JS</strong>. After the initial page loads, watch for additional chunk files downloading in the background with status 200. The file names match your lazy route chunk names (e.g. <code>dashboard-HASH.js</code>).' },
    { q: 'Should you preload all routes on a large app?', a: '<code>PreloadAllModules</code> wastes bandwidth on routes the user may never visit. On an app with 50+ lazy routes, this could mean downloading megabytes of JS the user never uses. Use selective preloading (<code>data: { preload: true }</code>) or <code>QuicklinkStrategy</code> to target only likely-to-be-visited routes.' },
    { q: 'When should you use a route resolver vs loading data inside the component?', a: 'Use a <strong>resolver</strong> when the component has no meaningful state to show without the data and the fetch is fast (&lt;500ms). Use <strong>in-component loading</strong> (with a skeleton or spinner) when the fetch might be slow — it gives immediate visual feedback and better UX. Resolvers that block for several seconds frustrate users.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'PreloadAllModules', type: 'class', desc: 'Built-in strategy that background-fetches all lazy route bundles after the initial page load.' , since: '2'},
    { name: 'NoPreloading', type: 'class', desc: 'Default strategy — lazy bundles only download when the user navigates to that route.' , since: '2'},
    { name: 'withPreloading', type: 'function', desc: 'Router feature passed to provideRouter() that registers a preloading strategy for lazy routes.' , since: '14'},
    { name: 'PreloadingStrategy', type: 'interface', desc: 'Interface for a custom strategy; requires preload(route, load): Observable — return load() to preload, of(null) to skip.' , since: '2'},
    { name: 'provideRouter', type: 'function', desc: 'Standalone API to configure the Angular router with composable feature functions.' , since: '14'},
    { name: 'QuicklinkStrategy', type: 'class', desc: 'Third-party strategy (ngx-quicklink) that preloads routes whose routerLink anchors are visible in the viewport.' , since: '2'},
    { name: 'loadComponent', type: 'function', desc: 'Route property accepting a dynamic import factory that enables code-splitting; required for preloading to have any effect.' , since: '14'},
    { name: 'loadChildren', type: 'function', desc: 'Route property that lazily loads a child route config array; also eligible for preloading strategies.' , since: '2'},
    { name: 'ResolveFn<T>', type: 'type', desc: 'Type for a functional route resolver — (route, state) => T | Observable<T>. Registered with route: resolve: { key: fn }.' , since: '14'},
    { name: 'Route.data', type: 'interface', desc: 'Static data map on a route definition; used by custom strategies to flag routes (e.g. data: { preload: true }).' , since: '2'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Registering a preloading strategy: NgModule vs standalone',
      before: `// app-routing.module.ts (NgModule era)
@NgModule({
  imports: [RouterModule.forRoot(routes, {
    preloadingStrategy: PreloadAllModules
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {}`,
      after: `// app.config.ts (standalone / Angular 14+)
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
    ),
  ],
};`,
      note: 'Standalone apps use provideRouter() with withPreloading() instead of RouterModule.forRoot options.',
    },
    {
      title: 'Custom selective strategy: constructor injection vs inject()',
      before: `// Angular < 14 style — constructor injection
@Injectable({ providedIn: 'root' })
export class SelectivePreload implements PreloadingStrategy {
  constructor(private router: Router) {}
  preload(route: Route, load: () => Observable<unknown>) {
    return route.data?.['preload'] ? load() : of(null);
  }
}`,
      after: `// Modern style — inject() function, no constructor needed
@Injectable({ providedIn: 'root' })
export class SelectivePreload implements PreloadingStrategy {
  private router = inject(Router);
  preload(route: Route, load: () => Observable<unknown>) {
    return route.data?.['preload'] ? load() : of(null);
  }
}`,
      note: 'inject() can replace constructor injection in any @Injectable class since Angular 14.',
    },
    {
      title: 'Loading data: in-component spinner vs route resolver',
      before: `// Without resolver — component manages its own loading flag
export class PostComponent {
  post = signal<Post | null>(null);
  loading = signal(true);
  ngOnInit() {
    this.api.getPost(this.id).subscribe(p => {
      this.post.set(p); this.loading.set(false);
    });
  }
}`,
      after: `// With resolve: { post: postResolver } on the route
// + withComponentInputBinding() in provideRouter()
export class PostComponent {
  post = input.required<Post>(); // injected before component renders
  // no loading state needed — data is always present
}`,
      note: 'Route resolvers prefetch data before navigation completes, eliminating per-component loading spinners for fast fetches.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using PreloadAllModules without considering bandwidth',
      wrong: `// Preloads every lazy bundle — even routes the user will never visit
provideRouter(routes, withPreloading(PreloadAllModules))`,
      right: `// Selective strategy targets only likely-to-be-visited routes
provideRouter(routes, withPreloading(SelectivePreload))
// Route: { path: 'dashboard', data: { preload: true }, loadComponent: ... }`,
      explanation: 'PreloadAllModules wastes bandwidth on large apps. Selective or viewport-based strategies reduce unnecessary network usage, which matters especially for mobile users on metered connections.',
    },
    {
      title: 'Returning null instead of of(null) from preload()',
      wrong: `preload(route: Route, load: () => Observable<unknown>) {
  if (!route.data?.['preload']) return null; // breaks the contract
  return load();
}`,
      right: `preload(route: Route, load: () => Observable<unknown>) {
  if (!route.data?.['preload']) return of(null); // valid Observable
  return load();
}`,
      explanation: 'The PreloadingStrategy interface requires an Observable return type. Returning null causes a runtime error because Angular calls .subscribe() on the return value immediately — of(null) is the correct "skip" signal.',
    },
    {
      title: 'Applying preloading annotations to eager-loaded routes',
      wrong: `// Eager route — no loadComponent/loadChildren, data.preload has no effect
{ path: 'home', component: HomeComponent, data: { preload: true } }`,
      right: `// Preloading only matters for lazy routes
{ path: 'dashboard', data: { preload: true },
  loadComponent: () => import('./dashboard/dashboard') }`,
      explanation: 'Preloading strategies only affect routes using loadComponent or loadChildren. Eager routes are already part of the main bundle — they load on initial page load regardless of any preloading configuration.',
    },
    {
      title: 'Forgetting to guard against missing Network Information API',
      wrong: `// Crashes in Safari — navigator.connection is undefined
const slow = ['2g', 'slow-2g'];
if (slow.includes(navigator.connection.effectiveType)) return of(null);`,
      right: `const connection = (navigator as any).connection;
if (connection && ['2g', 'slow-2g'].includes(connection.effectiveType)) {
  return of(null); // slow network — skip
}
return load(); // API absent or fast — proceed`,
      explanation: 'The Network Information API is not universally supported (absent in Safari). Always guard with an existence check and fall back to preloading when the API is missing.',
    },
    {
      title: 'Using a resolver for slow API calls without any loading feedback',
      wrong: `// Resolver blocks navigation for 3+ seconds — user sees nothing
export const slowResolver: ResolveFn<Data> = () =>
  inject(SlowService).getLargeDataset(); // takes 4 seconds`,
      right: `// Load data inside the component with a skeleton instead
export class PageComponent {
  data = signal<Data | null>(null);
  loading = signal(true);
  ngOnInit() {
    inject(SlowService).getLargeDataset().subscribe(d => {
      this.data.set(d); this.loading.set(false);
    });
  }
}`,
      explanation: 'Resolvers freeze navigation until they complete — a 4-second resolver means 4 seconds of a frozen page. For slow fetches, load data inside the component with a loading skeleton so users get immediate visual feedback.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Network-Aware Preloading Strategy',
    description: 'Create a custom Angular PreloadingStrategy called NetworkAwarePreload that preloads a route only when BOTH conditions are met: (1) the route has data: { preload: true } set, AND (2) the user is NOT on a slow connection (navigator.connection.effectiveType must not be \'2g\' or \'slow-2g\'). If the browser does not support the Network Information API, fall back to always preloading flagged routes. Register the strategy in a provideRouter() call.',
    language: 'typescript',
    hints: [
      'Implement the PreloadingStrategy interface — its single method is preload(route: Route, load: () => Observable<unknown>): Observable<unknown>',
      'Access connection speed with (navigator as any).connection?.effectiveType — it may be undefined in some browsers',
      'Return load() to preload and of(null) (imported from \'rxjs\') to skip',
      'Register with provideRouter(routes, withPreloading(NetworkAwarePreload)) in app.config.ts',
    ],
    starterCode: `import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NetworkAwarePreload implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    // TODO: Return load() only when:
    //   1. route.data?.['preload'] === true
    //   2. The user is NOT on a 2g / slow-2g connection
    //      (use navigator.connection?.effectiveType — cast navigator as any)
    // If navigator.connection is unsupported, treat the network as fast.
    return of(null); // replace this
  }
}

// TODO: Show how to register NetworkAwarePreload in provideRouter()
`,
    solution: `import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NetworkAwarePreload implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (route.data?.['preload'] !== true) {
      return of(null);
    }

    const connection = (navigator as any).connection;
    if (connection) {
      const slowTypes = ['2g', 'slow-2g'];
      if (slowTypes.includes(connection.effectiveType) || connection.saveData) {
        return of(null);
      }
    }
    return load();
  }
}

// app.config.ts:
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      [
        { path: 'dashboard', data: { preload: true }, loadComponent: () => import('./dashboard') },
        { path: 'settings',  data: { preload: false }, loadComponent: () => import('./settings') },
      ],
      withPreloading(NetworkAwarePreload),
    ),
  ],
};
`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Preloading fetches lazy route bundles in the background after the initial load — choose the strategy that balances speed against bandwidth for your app\'s traffic patterns.',
    mustKnow: [
      '<code>NoPreloading</code> (default): lazy bundles download only when the user navigates — first visit to each route has a visible delay',
      '<code>PreloadAllModules</code>: all lazy bundles preload after initial load — one <code>withPreloading(PreloadAllModules)</code> call, no per-route config needed',
      'Custom <code>PreloadingStrategy</code>: implement <code>preload(route, load)</code> — return <code>load()</code> to preload, <code>of(null)</code> to skip; <strong>never return null directly</strong>',
      'Mark routes selectively with <code>data: { preload: true }</code> and check <code>route.data?.[\'preload\']</code> inside the strategy',
      '<code>QuicklinkStrategy</code> (ngx-quicklink) uses <code>IntersectionObserver</code> to preload routes whose <code>routerLink</code> anchors are visible in the viewport — no route annotations needed',
      'Network-aware: guard behind <code>(navigator as any).connection?.effectiveType</code> — skip on <code>2g/slow-2g</code> and fall back to preloading when the API is absent',
      'Verify in Chrome DevTools Network tab — preloaded chunks appear as background JS downloads shortly after the initial load',
    ],
    interviewFocus: [
      'What are the built-in preloading strategies and which is the default?',
      'How do you implement a custom PreloadingStrategy? What must preload() return to skip a route?',
      'What is QuicklinkStrategy and what problem does it solve that PreloadAllModules does not?',
      'How would you implement a network-aware preloading strategy that skips slow connections?',
      'When should you use a route resolver and when is in-component loading preferable?',
    ],
  };
}

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}
