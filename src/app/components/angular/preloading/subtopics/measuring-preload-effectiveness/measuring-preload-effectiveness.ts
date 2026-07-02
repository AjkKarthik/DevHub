import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-measuring-preload-effectiveness-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './measuring-preload-effectiveness.html',
  styleUrl: './measuring-preload-effectiveness.scss',
})
export class MeasuringPreloadEffectivenessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Preloading is a bet — measure it instead of assuming it pays off',
      points: [
        'Preloading trades bandwidth spent NOW (right after initial load, when the user might not even navigate there) for latency saved LATER (if they do). A strategy that preloads too aggressively can slow down the initial page\'s own network activity; measuring is the only way to know if the tradeoff is actually paying off for real users.',
        'The signal to measure is NAVIGATION latency specifically — how long the router spends resolving a lazy route\'s chunk when the user actually clicks a link — not initial page load time, which preloading does not target.',
      ],
    },
    {
      heading: 'Navigation Timing + Resource Timing via PerformanceObserver',
      points: [
        'The Resource Timing API records every network fetch, including the chunk downloads triggered by preloading — <code>performance.getEntriesByType(\'resource\')</code> filtered to <code>.js</code> chunk URLs shows WHEN each chunk was fetched relative to page load, confirming preloading actually ran (not just that the strategy\'s code executed).',
        'To measure the win, time the gap between a <code>Router</code> <code>NavigationStart</code> event and the component actually rendering (e.g. via <code>NavigationEnd</code> minus <code>NavigationStart</code> on the <code>Router.events</code> stream) for a PRELOADED route versus a NON-preloaded route — a preloaded route\'s navigation should show a MUCH smaller gap because the chunk is already in the browser\'s cache.',
      ],
    },
    {
      heading: 'Preloading the chunk doesn\'t preload the DATA — combine with HTTP prefetch',
      points: [
        'Route preloading only fetches the JavaScript chunk — if the destination route ALSO fires an HTTP request for data (e.g. via a resolver or an <code>ngOnInit</code> call), that request still only starts once the user actually navigates. A more complete "instant navigation" strategy combines chunk preloading with a SEPARATE, best-effort HTTP prefetch of the likely API response, using a low-priority <code>fetch()</code> (or an Angular <code>HttpClient</code> call fired from the SAME <code>PreloadingStrategy</code>) that populates a cache the real resolver/service can check first.',
        'This combination must stay OPTIONAL and best-effort — if the prefetch fails or is still in flight when the user navigates, the normal resolver/service call must still work as a fallback, never block on the prefetch succeeding.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/measured-preload.strategy.ts',
      content: `import { Injectable, inject } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

export const prefetchCache = new Map<string, unknown>();

@Injectable({ providedIn: 'root' })
export class MeasuredPreloadStrategy implements PreloadingStrategy {
  private http = inject(HttpClient);

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (!route.data?.['preload']) {
      return of(null);
    }

    const start = performance.now();
    const path = route.path ?? 'unknown';

    // Best-effort data prefetch — never blocks the chunk preload, failures are swallowed
    const apiUrl = route.data?.['prefetchUrl'] as string | undefined;
    if (apiUrl) {
      this.http.get(apiUrl).subscribe({
        next: data => prefetchCache.set(apiUrl, data),
        error: () => {}, // best-effort — the real resolver still runs normally on navigation
      });
    }

    return load().pipe(
      tap(() => {
        const durationMs = performance.now() - start;
        console.log(\`Preloaded chunk for "\${path}" in \${durationMs.toFixed(1)}ms\`);
      }),
    );
  }
}
`,
    },
    {
      path: 'src/app/nav-timing.service.ts',
      content: `import { Injectable, inject } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { filter, pairwise } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NavTimingService {
  private router = inject(Router);
  private navStartedAt = 0;

  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.navStartedAt = performance.now();
      }
      if (event instanceof NavigationEnd) {
        const durationMs = performance.now() - this.navStartedAt;
        console.log(\`Navigation to "\${event.urlAfterRedirects}" took \${durationMs.toFixed(1)}ms\`);
      }
    });
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { NavTimingService } from './nav-timing.service';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Measuring preload effectiveness</h3>
    <p>Open the console — MeasuredPreloadStrategy logs each chunk's preload duration, and
    NavTimingService logs total navigation duration for every route change. Compare a
    preloaded route's navigation time against a non-preloaded one.</p>
  \`,
})
export class App {
  private navTiming = inject(NavTimingService); // instantiate eagerly to start listening
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withPreloading } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app/app';
import { routes } from './app/app.routes';
import { MeasuredPreloadStrategy } from './app/measured-preload.strategy';

bootstrapApplication(App, {
  providers: [
    provideHttpClient(),
    provideRouter(routes, withPreloading(MeasuredPreloadStrategy)),
  ],
});
`,
    },
    {
      path: 'src/app/app.routes.ts',
      content: `import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    data: { preload: true, prefetchUrl: '/api/dashboard-summary' },
    loadComponent: () => import('./pages/dashboard').then(m => m.DashboardComponent),
  },
  {
    path: 'settings',
    // Not flagged — loads only on navigation, useful as a comparison baseline
    loadComponent: () => import('./pages/settings').then(m => m.SettingsComponent),
  },
];
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Measuring preload effectiveness</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add resource-timing verification: log every .js chunk fetch recorded by the Resource Timing API on app startup.',
    hint: 'Use performance.getEntriesByType(\'resource\') filtered to entries whose name ends in .js, and log each entry\'s name and duration.',
    solution: `const jsChunks = performance
  .getEntriesByType('resource')
  .filter((entry): entry is PerformanceResourceTiming => entry.name.endsWith('.js'));

for (const chunk of jsChunks) {
  console.log(\`Chunk "\${chunk.name}" loaded in \${chunk.duration.toFixed(1)}ms\`);
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a PreloadingStrategy\'s code runs without errors, preloading must be working and helping.',
      reality: 'the strategy code running proves it was INVOKED, not that it measurably improved navigation latency — only comparing navigation timing for preloaded vs non-preloaded routes proves the actual benefit.',
    },
    {
      thought: 'preloading a route\'s JavaScript chunk means the whole route — including its data — is ready instantly.',
      reality: 'route preloading only fetches the JS chunk; any HTTP data request the route makes (via a resolver or ngOnInit) still only starts on actual navigation unless a SEPARATE best-effort data prefetch is added alongside the chunk preload.',
    },
    {
      thought: 'a data-prefetch added to a PreloadingStrategy should block the chunk preload until the data arrives, to guarantee both are ready together.',
      reality: 'a data prefetch must stay best-effort and non-blocking — if it fails or is still in flight, the real resolver/service call on navigation must still work as the fallback path, not be blocked waiting on the prefetch.',
    },
  ];
}
