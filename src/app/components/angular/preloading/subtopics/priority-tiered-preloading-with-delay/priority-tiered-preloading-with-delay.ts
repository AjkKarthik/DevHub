import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-priority-tiered-preloading-with-delay-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './priority-tiered-preloading-with-delay.html',
  styleUrl: './priority-tiered-preloading-with-delay.scss',
})
export class PriorityTieredPreloadingWithDelaySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Beyond binary preload/skip — a priority TIER per route',
      points: [
        'The main topic\'s selective strategy is BINARY — a route either has <code>data: { preload: true }</code> or it doesn\'t. A priority-tiered strategy reads a NUMERIC or enum value instead — <code>data: { preload: \'high\' | \'medium\' | \'low\' }</code> — and treats each tier DIFFERENTLY: high-priority routes preload immediately, medium after a short delay, low after a longer delay (or not at all on a slow connection).',
        'This matters for apps with MANY lazy routes where preloading everything at once (even selectively-flagged everything) still creates a burst of simultaneous downloads competing for bandwidth right after the initial page load — staggering by tier smooths that burst into a sequence.',
      ],
    },
    {
      heading: 'Implementing staggered delay with RxJS timer()',
      points: [
        'Inside <code>preload(route, load)</code>, map each tier to a delay: <code>const delayMs = { high: 0, medium: 2000, low: 8000 }[route.data?.[\'preload\'] as string] ?? undefined;</code> then <code>return delayMs === undefined ? of(null) : timer(delayMs).pipe(switchMap(() =&gt; load()))</code> — <code>timer(delayMs)</code> emits once after the delay, and <code>switchMap</code> then calls the actual <code>load()</code> function at that point.',
        'Because EACH route\'s <code>preload()</code> call is independent, the delays are NOT cumulative — a \'medium\' route at 2000ms and another \'medium\' route also start their own independent 2-second timers, both preloading around the same 2-second mark, not one after another sequentially.',
      ],
    },
    {
      heading: 'Combining tiers with a maximum concurrent preload limit',
      points: [
        'For an app with dozens of \'low\'-tier routes, firing ALL their delayed <code>load()</code> calls simultaneously once their shared delay elapses can STILL create a download burst — a more sophisticated strategy tracks an in-flight COUNT and uses RxJS\'s <code>mergeMap(fn, concurrency)</code> semantics (or a manual semaphore) to cap how many preloads run at once across the WHOLE strategy instance, not just per-route.',
        'This level of sophistication is genuinely only worth it for large apps (50+ lazy routes) — for smaller apps, simple tier-based delays without a concurrency cap are sufficient and much simpler to reason about.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/tiered-preload.strategy.ts',
      content: `import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

type Tier = 'high' | 'medium' | 'low';
const TIER_DELAYS: Record<Tier, number> = { high: 0, medium: 2000, low: 5000 };

@Injectable({ providedIn: 'root' })
export class TieredPreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    const tier = route.data?.['preload'] as Tier | undefined;
    if (!tier) {
      return of(null); // not flagged — never preload
    }

    const delayMs = TIER_DELAYS[tier];
    console.log(\`Scheduling preload for "\${route.path}" (tier: \${tier}) in \${delayMs}ms\`);

    return timer(delayMs).pipe(
      switchMap(() => {
        console.log(\`Preloading now: "\${route.path}"\`);
        return load();
      }),
    );
  }
}
`,
    },
    {
      path: 'src/app/app.routes.ts',
      content: `import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    data: { preload: 'high' },
    loadComponent: () => import('./pages/dashboard').then(m => m.DashboardComponent),
  },
  {
    path: 'reports',
    data: { preload: 'medium' },
    loadComponent: () => import('./pages/reports').then(m => m.ReportsComponent),
  },
  {
    path: 'admin',
    data: { preload: 'low' },
    loadComponent: () => import('./pages/admin').then(m => m.AdminComponent),
  },
  {
    path: 'rarely-visited',
    // No preload flag at all — loads only on first navigation
    loadComponent: () => import('./pages/rarely-visited').then(m => m.RarelyVisitedComponent),
  },
];
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Priority-tiered preloading — open the console to see the staggered schedule</h3>
    <p>high tier: 0ms, medium tier: 2000ms, low tier: 5000ms, unflagged: never preloaded</p>
    <p>This app.ts is illustrative — the real behavior is driven by TieredPreloadStrategy
    registered via provideRouter(routes, withPreloading(TieredPreloadStrategy)) in main.ts,
    running against the routes declared in app.routes.ts.</p>
  \`,
})
export class App {}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withPreloading } from '@angular/router';
import { App } from './app/app';
import { routes } from './app/app.routes';
import { TieredPreloadStrategy } from './app/tiered-preload.strategy';

bootstrapApplication(App, {
  providers: [provideRouter(routes, withPreloading(TieredPreloadStrategy))],
});
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Priority-tiered preloading with delay</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a fourth tier, "veryLow", with a 10000ms delay, and flag the "admin" route with it instead of "low".',
    hint: 'Add veryLow: 10000 to the TIER_DELAYS record, update the Tier type to include \'veryLow\', and change the admin route\'s data.preload value from \'low\' to \'veryLow\'.',
    solution: `type Tier = 'high' | 'medium' | 'low' | 'veryLow';
const TIER_DELAYS: Record<Tier, number> = { high: 0, medium: 2000, low: 5000, veryLow: 10000 };

// In app.routes.ts:
{
  path: 'admin',
  data: { preload: 'veryLow' },
  loadComponent: () => import('./pages/admin').then(m => m.AdminComponent),
},`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a custom PreloadingStrategy can only make one binary decision per route — preload now or never.',
      reality: 'the strategy has full control over WHEN to call load() — mapping a route\'s data flag to a delay via timer() lets you stagger preloading across priority tiers instead of an all-or-nothing binary decision.',
    },
    {
      thought: 'staggered delays for the same tier across multiple routes cause those routes to preload one after another sequentially.',
      reality: 'each route\'s preload() call runs independently — multiple \'medium\'-tier routes each start their own 2-second timer at roughly the same starting point, so they preload around the same time, not in a chained sequence.',
    },
    {
      thought: 'for a large app with many lazy routes, tier-based delays alone fully solve the "download burst" problem.',
      reality: 'if many routes share the same tier and delay, their preloads can still burst simultaneously once that delay elapses — a genuinely large app may need an additional concurrency cap across the whole strategy, not just per-tier staggering.',
    },
  ];
}
