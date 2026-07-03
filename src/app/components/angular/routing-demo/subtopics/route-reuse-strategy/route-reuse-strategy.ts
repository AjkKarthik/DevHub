import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-route-reuse-strategy-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './route-reuse-strategy.html',
  styleUrl: './route-reuse-strategy.scss',
})
export class RouteReuseStrategySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The default behavior — reuse within a route, destroy across routes',
      points: [
        'By default, Angular REUSES the same component instance when only route PARAMS change on the SAME route config (e.g. <code>/products/1</code> → <code>/products/2</code>) — this is exactly why a param must be read reactively (<code>paramMap</code> as a signal), not just once in the constructor.',
        'When navigating between DIFFERENT routes (even ones rendering similar-looking content), Angular DESTROYS the outgoing component and CREATES a fresh instance of the incoming one — all local state, scroll position, and form input is lost by default.',
      ],
    },
    {
      heading: 'RouteReuseStrategy — overriding the default',
      points: [
        'Implement <code>RouteReuseStrategy</code> (5 methods: <code>shouldDetach</code>, <code>store</code>, <code>shouldAttach</code>, <code>retrieve</code>, <code>shouldReuseRoute</code>) and register it via <code>{ provide: RouteReuseStrategy, useClass: MyReuseStrategy }</code> in your root providers to change WHEN Angular tears down vs. caches a route\'s component tree.',
        '<code>shouldDetach(route)</code> returning <code>true</code> tells Angular to DETACH (not destroy) the component tree instead of destroying it when navigating away — you then cache it yourself in <code>store(route, handle)</code>. Later, <code>shouldAttach(route)</code> returning <code>true</code> plus <code>retrieve(route)</code> returning the cached handle lets Angular RE-ATTACH the exact same component instance instead of creating a new one.',
        'This is the mechanism behind tab-like navigation UIs that preserve scroll position, unsaved filter state, or expensive-to-recompute view state across navigating away and back — without manually serializing that state into a service.',
      ],
    },
    {
      heading: 'Practical scope and gotchas',
      points: [
        'A custom reuse strategy should be SELECTIVE — typically keyed off a route\'s <code>data</code> flag (e.g. <code>data: { reuse: true }</code>) rather than caching every route indefinitely. Caching everything grows memory usage over a long session and can surface stale data if the underlying data changes while detached.',
        'Cached component trees are NOT automatically evicted — you own the cache\'s lifetime. A common pattern caps the cache size or clears specific entries on an explicit event (e.g., logging out, or a manual "close tab" action in a tab-strip UI).',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: \`
    <h3>Custom RouteReuseStrategy — type in the input, switch tabs, switch back</h3>
    <nav>
      <a routerLink="/tab-a">Tab A</a> | <a routerLink="/tab-b">Tab B</a>
    </nav>
    <router-outlet />
  \`,
})
export class App {}
`,
    },
    {
      path: 'src/app/tab-a.ts',
      content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-tab-a',
  standalone: true,
  template: \`
    <p>Tab A — type below, then switch to Tab B and back:</p>
    <input placeholder="unsaved draft text..." />
  \`,
})
export class TabAComponent {}
`,
    },
    {
      path: 'src/app/tab-b.ts',
      content: `import { Component } from '@angular/core';

@Component({ selector: 'app-tab-b', standalone: true, template: \`<p>Tab B content</p>\` })
export class TabBComponent {}
`,
    },
    {
      path: 'src/app/reuse-strategy.ts',
      content: `import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';

// Caches ONLY routes explicitly opted in via data: { reuse: true }
export class TabReuseStrategy implements RouteReuseStrategy {
  private cache = new Map<string, DetachedRouteHandle>();

  private key(route: ActivatedRouteSnapshot): string {
    return route.routeConfig?.path ?? '';
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return !!route.data['reuse'];
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    if (handle) this.cache.set(this.key(route), handle);
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return this.cache.has(this.key(route));
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return this.cache.get(this.key(route)) ?? null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }
}
`,
    },
    {
      path: 'src/app/app.routes.ts',
      content: `import { Routes } from '@angular/router';
import { TabAComponent } from './tab-a';
import { TabBComponent } from './tab-b';

export const routes: Routes = [
  // reuse: true opts this route into caching via TabReuseStrategy
  { path: 'tab-a', component: TabAComponent, data: { reuse: true } },
  { path: 'tab-b', component: TabBComponent },
];
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouteReuseStrategy } from '@angular/router';
import { App } from './app/app';
import { routes } from './app/app.routes';
import { TabReuseStrategy } from './app/reuse-strategy';

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    { provide: RouteReuseStrategy, useClass: TabReuseStrategy },
  ],
});
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Route reuse strategy</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add data: { reuse: true } to the tab-b route as well, so both tabs preserve their state when switching away and back.',
    hint: 'In app.routes.ts, add data: { reuse: true } to the { path: \'tab-b\', component: TabBComponent } entry, matching the tab-a route.',
    solution: `export const routes: Routes = [
  { path: 'tab-a', component: TabAComponent, data: { reuse: true } },
  { path: 'tab-b', component: TabBComponent, data: { reuse: true } },
];`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Angular reuses component instances by default when navigating between two DIFFERENT routes, not just param changes on the same route.',
      reality: 'the default behavior only reuses across param changes on the SAME route config — navigating between different routes destroys and recreates the component tree unless a custom RouteReuseStrategy says otherwise.',
    },
    {
      thought: 'a custom RouteReuseStrategy should cache every route to maximize the performance benefit.',
      reality: 'caching everything indefinitely grows memory usage over a long session and risks showing stale cached data — the standard pattern selectively opts in specific routes (e.g. via a data: { reuse: true } flag) rather than caching globally.',
    },
    {
      thought: 'detached/cached component trees are automatically cleaned up by Angular when memory pressure is high.',
      reality: 'you own the cache\'s lifetime entirely — Angular does not evict entries on its own; the reuse strategy implementation must decide when to clear cached handles.',
    },
  ];
}
