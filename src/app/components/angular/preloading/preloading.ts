import { Component, signal, computed } from '@angular/core';
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
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './preloading.html',
  styleUrl: './preloading.scss',
})
export class PreloadingDemo {

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

  // ── QnA / Theory ──────────────────────────────────────────────────────────
  qna: QnaItem[] = [
    { q: 'What is the default preloading strategy in Angular?', a: '<code>NoPreloading</code> — lazy-loaded bundles only download when the user first navigates to that route. No background loading occurs. The user waits for the download on first visit.' },
    { q: 'How do you enable PreloadAllModules?', a: '<code>provideRouter(routes, withPreloading(PreloadAllModules))</code> in <code>app.config.ts</code>. Angular loads all lazy bundles in the background after the initial page load — first navigations feel instant.' },
    { q: 'What is a custom PreloadingStrategy?', a: 'Implement <code>PreloadingStrategy</code>: <code>preload(route, load) { return route.data?.[\'preload\'] ? load() : of(null); }</code>. Register with <code>withPreloading(MyStrategy)</code>. Only routes marked <code>data: { preload: true }</code> are preloaded.' },
    { q: 'What is QuicklinkStrategy?', a: '<code>ngx-quicklink</code>\'s strategy preloads routes whose <code>routerLink</code> is currently visible in the viewport — like Google\'s Quicklink library. Installs with <code>npm install ngx-quicklink</code> and requires no route annotations.' },
    { q: 'How do you verify preloading is working?', a: 'Open Chrome DevTools → Network tab → filter by JS. After the initial load, you should see additional chunk files downloading in the background with status 200. The file names match your lazy route chunk names.' },
    { q: 'Should you preload all routes on a large app?', a: 'Not necessarily. <code>PreloadAllModules</code> wastes bandwidth for routes the user may never visit. Use selective preloading (custom strategy or Quicklink) to preload only likely-to-be-visited routes — balancing performance and bandwidth.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is route preloading?',
      points: [
        'Preloading fetches lazy-loaded route bundles in the background after the initial page loads — no user wait time.',
        'Without preloading: bundle loads on first navigation to the route (user waits).',
        'With preloading: bundle is already cached when the user navigates — feels instant.',
        'Angular ships two built-in strategies: NoPreloading (default) and PreloadAllModules.',
      ],
    },
    {
      heading: 'Built-in strategies',
      points: [
        'NoPreloading — lazy bundles load only on demand. Best for apps with many infrequently-visited routes.',
        'PreloadAllModules — all lazy bundles preload after initial load. Simple but wastes bandwidth on unvisited routes.',
        'withPreloading(PreloadAllModules) is registered in provideRouter() — one import, no configuration.',
        'Both strategies respect network conditions on fast connections — they run during idle time.',
      ],
    },
    {
      heading: 'Custom preloading strategy',
      points: [
        'Implement PreloadingStrategy: preload(route, fn) — return fn() to preload, of(null) to skip.',
        'Use route.data.preload = true to selectively mark routes for preloading.',
        'QuicklinkStrategy from ngx-quicklink preloads routes whose links are visible in the viewport.',
        'Provide custom strategy with withPreloading(MyStrategy) inside provideRouter().',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'Preloading only applies to lazy-loaded routes (loadComponent / loadChildren) — eager routes are already bundled.',
        'Check the Network tab in DevTools: preloaded chunks appear as background fetches with status 200.',
        'Combine with withRouterConfig({ onSameUrlNavigation: \'reload\' }) for refresh-on-same-route.',
        'On slow networks or Save-Data header, skip preloading — check navigator.connection in a custom strategy.',
      ],
    },
  ];

  tabs: CodeTab[] = [
    {
      label: 'PreloadAllModules',
      language: 'typescript',
      code: `// app.config.ts
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),  // preloads all lazy bundles after initial load
    ),
  ],
};`,
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
    return route.data?.['preload'] === true ? load() : of(null);
  }
}

// Route definition:
{ path: 'dashboard', data: { preload: true }, loadComponent: () => import('./dashboard') }

// app.config.ts:
withPreloading(SelectivePreload)`,
    },
    {
      label: 'QuicklinkStrategy',
      language: 'typescript',
      code: `// npm install ngx-quicklink
import { QuicklinkStrategy } from 'ngx-quicklink';

provideRouter(routes, withPreloading(QuicklinkStrategy))
// Routes whose <a routerLink="..."> is in the viewport are automatically preloaded.`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'Which function call in provideRouter() enables PreloadAllModules?', options: ['withLazyLoading(PreloadAllModules)', 'withPreloading(PreloadAllModules)', 'enablePreloading(PreloadAllModules)', 'usePreloadingStrategy(PreloadAllModules)'], answer: 1, explanation: 'withPreloading(PreloadAllModules) is passed as a feature to provideRouter() in app.config.ts. Angular will then background-fetch all lazy route bundles after the initial page load.' },
    { q: 'What does a custom PreloadingStrategy\'s preload() method return to SKIP preloading a route?', options: ['null', 'false', 'of(null)', 'NEVER'], answer: 2, explanation: 'The preload(route, load) method must return an Observable. Returning of(null) signals Angular to skip that route. Returning load() triggers the preload. Returning null or false would break the contract.' },
    { q: 'QuicklinkStrategy from ngx-quicklink decides which routes to preload based on what signal?', options: ['Routes marked with data: { preload: true }', 'Routes the user has visited before', 'routerLink elements that are visible in the viewport', 'Routes ranked by bundle size (smallest first)'], answer: 2, explanation: 'QuicklinkStrategy mirrors Google\'s Quicklink library — it observes which <a routerLink> anchors are currently in the viewport via IntersectionObserver and preloads only those routes, requiring no manual route annotations.' },
    { q: 'Which of the following is true about the NoPreloading strategy (Angular\'s default)?', options: ['It preloads bundles on a delay after the initial load', 'Lazy bundles are only fetched when the user first navigates to that route', 'It preloads routes based on the router\'s priority queue', 'It is deprecated in Angular 17+ in favor of PreloadAllModules'], answer: 1, explanation: 'NoPreloading is the default. Lazy-loaded route bundles are only downloaded at the moment the user navigates to that route, causing a visible delay on first visit. No background loading occurs.' },
    { q: 'In a custom preloading strategy, how should routes be marked so only selected ones are preloaded?', options: ['Add a preload: true property directly on the Route object at the top level', 'Set data: { preload: true } on the route definition and check route.data?.[\'preload\'] in preload()', 'Annotate the lazy component class with @Preload()', 'Pass a preloadRoutes array to withPreloading()'], answer: 1, explanation: 'Route definitions support a data property for arbitrary metadata. Setting data: { preload: true } and then reading route.data?.[\'preload\'] inside the strategy\'s preload() method is the idiomatic pattern. The strategy returns load() for marked routes and of(null) for the rest.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'PreloadAllModules', type: 'class', desc: 'Built-in preloading strategy that background-fetches all lazy route bundles after the initial page load.' , since: '2'},
    { name: 'NoPreloading', type: 'class', desc: 'Default Angular preloading strategy where lazy bundles are only fetched on first navigation to that route.' , since: '2'},
    { name: 'withPreloading', type: 'function', desc: 'Router feature passed to provideRouter() that registers a preloading strategy for lazy routes.' , since: '14'},
    { name: 'PreloadingStrategy', type: 'interface', desc: 'Interface to implement for a custom preloading strategy; requires a single preload(route, load) method returning an Observable.' , since: '2'},
    { name: 'provideRouter', type: 'function', desc: 'Standalone API to configure the Angular router with features such as preloading, router config options, and more.' , since: '14'},
    { name: 'QuicklinkStrategy', type: 'class', desc: 'Third-party strategy from ngx-quicklink that preloads routes whose routerLink anchors are visible in the viewport via IntersectionObserver.' , since: '2'},
    { name: 'loadComponent', type: 'function', desc: 'Route property accepting a dynamic import factory that enables code-splitting; required for preloading to have any effect.' , since: '14'},
    { name: 'loadChildren', type: 'function', desc: 'Route property that lazily loads a child route config module or array; also eligible for preloading strategies.' , since: '2'},
    { name: 'Route.data', type: 'interface', desc: 'Static data map on a route definition; used by custom strategies to flag routes for selective preloading (e.g. data: { preload: true }).' , since: '2'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Registering a preloading strategy: NgModule vs standalone', before: `// app-routing.module.ts (NgModule era)
@NgModule({
  imports: [RouterModule.forRoot(routes, {
    preloadingStrategy: PreloadAllModules
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {}`, after: `// app.config.ts (standalone / Angular 14+)
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
    ),
  ],
};`,
      note: 'Standalone apps use provideRouter() with withPreloading() instead of RouterModule.forRoot options.' },
    { title: 'Custom selective strategy: class-based service injection vs inject()', before: `// Angular < 14 style — constructor injection
@Injectable({ providedIn: 'root' })
export class SelectivePreload implements PreloadingStrategy {
  constructor(private router: Router) {}
  preload(route: Route, load: () => Observable<unknown>) {
    return route.data?.['preload'] ? load() : of(null);
  }
}`, after: `// Modern style — inject() function, no constructor needed
@Injectable({ providedIn: 'root' })
export class SelectivePreload implements PreloadingStrategy {
  private router = inject(Router);
  preload(route: Route, load: () => Observable<unknown>) {
    return route.data?.['preload'] ? load() : of(null);
  }
}`,
      note: 'inject() can replace constructor injection in any injectable class since Angular 14.' },
    { title: 'Loading state inside component: manual vs resolver', before: `// Without resolver — component manages its own loading flag
export class PostComponent {
  post = signal<Post | null>(null);
  loading = signal(true);
  ngOnInit() {
    this.api.getPost(this.id).subscribe(p => {
      this.post.set(p); this.loading.set(false);
    });
  }
}`, after: `// With resolve: { post: PostResolver } on the route
export class PostComponent {
  // data is already present before component renders
  post = input.required<Post>();
  // no loading state needed
}`,
      note: 'Route resolvers prefetch data before navigation completes, eliminating per-component loading spinners.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Using PreloadAllModules without considering bandwidth', wrong: `// Preloads every lazy bundle — even routes the user will never visit
provideRouter(routes, withPreloading(PreloadAllModules))`, right: `// Selective strategy or QuicklinkStrategy targets only likely routes
provideRouter(routes, withPreloading(SelectivePreload))
// Route: { path: 'dashboard', data: { preload: true }, loadComponent: ... }`, explanation: 'PreloadAllModules wastes bandwidth on large apps. Selective or viewport-based strategies reduce unnecessary network usage.'  },
    { title: 'Returning null instead of of(null) from preload()', wrong: `preload(route: Route, load: () => Observable<unknown>) {
  if (!route.data?.['preload']) return null; // breaks the contract
  return load();
}`, right: `preload(route: Route, load: () => Observable<unknown>) {
  if (!route.data?.['preload']) return of(null); // valid Observable
  return load();
}`, explanation: 'The PreloadingStrategy interface requires an Observable return. Returning null causes a runtime error because Angular subscribes to the result.'  },
    { title: 'Applying preloading to eager-loaded routes', wrong: `// Eager route — no loadComponent/loadChildren
{ path: 'home', component: HomeComponent, data: { preload: true } }`, right: `// Preloading only matters for lazy routes
{ path: 'dashboard', data: { preload: true },
  loadComponent: () => import('./dashboard/dashboard') }`, explanation: 'Preloading strategies only affect routes using loadComponent or loadChildren. Eager routes are already in the main bundle.'  },
    { title: 'Forgetting to handle missing Network Information API in network-aware strategies', wrong: `const slow = ['2g', 'slow-2g'];
// Crashes if navigator.connection is undefined
if (slow.includes(navigator.connection.effectiveType)) return of(null);`, right: `const connection = (navigator as any).connection;
if (connection && ['2g', 'slow-2g'].includes(connection.effectiveType)) {
  return of(null);
}
return load(); // API absent — assume fast network`, explanation: 'The Network Information API is not universally supported. Always guard with an existence check and provide a safe fallback.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: 'Angular 14', label: 'Standalone router configuration', features: ['provideRouter() replaces RouterModule.forRoot() for standalone apps', 'withPreloading() is a composable router feature function', 'loadComponent enables lazy-loading individual standalone components'] },
    { version: 'Angular 2+', label: 'Core preloading primitives', features: ['PreloadingStrategy interface and PreloadAllModules available since the start', 'NoPreloading is the default strategy out of the box', 'Custom strategies via PreloadingStrategy work across all Angular versions'] },
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

// Example route config (for reference — no need to change):
// [
//   { path: 'dashboard', data: { preload: true }, loadComponent: () => import('./dashboard') },
//   { path: 'settings',  data: { preload: false }, loadComponent: () => import('./settings') },
// ]

// TODO: Show how to register NetworkAwarePreload in provideRouter()
`,
    solution: `import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';
import { provideRouter, withPreloading } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class NetworkAwarePreload implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    // Check if the route is flagged for preloading
    if (route.data?.['preload'] !== true) {
      return of(null);
    }

    // Check network speed via Network Information API
    const connection = (navigator as any).connection;
    if (connection) {
      const slowTypes = ['2g', 'slow-2g'];
      if (slowTypes.includes(connection.effectiveType)) {
        // On a slow connection — skip preloading to save bandwidth
        return of(null);
      }
    }
    // Network API unsupported or fast connection — preload the route
    return load();
  }
}

// Registration in app.config.ts:
// export const appConfig: ApplicationConfig = {
//   providers: [
//     provideRouter(
//       routes,
//       withPreloading(NetworkAwarePreload),
//     ),
//   ],
// };

// Example routes:
// [
//   { path: 'dashboard', data: { preload: true }, loadComponent: () => import('./dashboard') },
//   { path: 'settings',  data: { preload: false }, loadComponent: () => import('./settings') },
// ]
`,
  };
}

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}
