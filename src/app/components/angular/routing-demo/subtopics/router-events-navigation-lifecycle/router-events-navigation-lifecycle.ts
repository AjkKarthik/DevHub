import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-router-events-navigation-lifecycle-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './router-events-navigation-lifecycle.html',
  styleUrl: './router-events-navigation-lifecycle.scss',
})
export class RouterEventsNavigationLifecycleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The full navigation event pipeline',
      points: [
        'A single navigation fires a SEQUENCE of events on <code>router.events</code>, in order: <code>NavigationStart</code> → <code>RoutesRecognized</code> → <code>GuardsCheckStart</code> → <code>GuardsCheckEnd</code> → <code>ResolveStart</code> → <code>ResolveEnd</code> → <code>NavigationEnd</code>. A failed or blocked navigation emits <code>NavigationCancel</code> or <code>NavigationError</code> instead of <code>NavigationEnd</code>.',
        'Every event carries the SAME <code>id</code> number for a given navigation — useful for correlating "this GuardsCheckStart belongs to the same navigation as that NavigationEnd" when multiple navigations can overlap (e.g., the user clicks a second link before the first finishes).',
      ],
    },
    {
      heading: 'Building a loading-progress indicator from events',
      points: [
        'A realistic progress bar shows itself between <code>NavigationStart</code> and the terminal event (<code>NavigationEnd</code>, <code>NavigationCancel</code>, or <code>NavigationError</code>) — showing it only on <code>NavigationStart</code>/<code>NavigationEnd</code> misses the cancel/error paths and leaves the bar stuck visible.',
        '<code>router.events.pipe(filter(e =&gt; e instanceof NavigationEnd))</code> is the standard pattern for "run this after every successful navigation" — analytics page-view tracking, scroll-to-top, or closing a mobile nav drawer.',
      ],
    },
    {
      heading: 'RouterState — the resolved route tree',
      points: [
        '<code>router.routerState.root</code> is the top of the RESOLVED route tree — distinct from a single <code>ActivatedRoute</code>, which only represents one level. Walk it with <code>.firstChild</code> repeatedly to reach the deepest currently-activated route, which is the standard way to build a breadcrumb trail from each level\'s <code>data</code>.',
        'Each <code>ActivatedRouteSnapshot</code> in that tree exposes its own <code>data</code>, <code>params</code>, and <code>url</code> — a breadcrumb service typically walks from root to the deepest child, collecting each level\'s <code>data[\'breadcrumb\']</code> string along the way.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, Event } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: \`
    <h3>Router event pipeline — check the console, and watch the bar below</h3>
    <nav>
      <a routerLink="/a">Route A</a> | <a routerLink="/b">Route B</a>
    </nav>
    @if (loading()) {
      <div style="height: 4px; background: #dd0031; transition: width 0.2s;"></div>
    }
    <p>Loading: {{ loading() }}</p>
    <router-outlet />
  \`,
})
export class App {
  private router = inject(Router);
  loading = signal(false);

  constructor() {
    this.router.events.subscribe((e: Event) => {
      console.log(e.constructor.name, ('id' in e) ? (e as any).id : '');

      if (e instanceof NavigationStart) this.loading.set(true);
      if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) {
        this.loading.set(false);
      }
    });

    // Standard "run after every successful navigation" pattern
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => console.log('✅ Navigation completed:', e.urlAfterRedirects));
  }
}
`,
    },
    {
      path: 'src/app/route-a.ts',
      content: `import { Component } from '@angular/core';

@Component({ selector: 'app-route-a', standalone: true, template: \`<p>Route A content</p>\` })
export class RouteAComponent {}
`,
    },
    {
      path: 'src/app/route-b.ts',
      content: `import { Component } from '@angular/core';

@Component({ selector: 'app-route-b', standalone: true, template: \`<p>Route B content</p>\` })
export class RouteBComponent {}
`,
    },
    {
      path: 'src/app/app.routes.ts',
      content: `import { Routes } from '@angular/router';
import { RouteAComponent } from './route-a';
import { RouteBComponent } from './route-b';

export const routes: Routes = [
  { path: 'a', component: RouteAComponent },
  { path: 'b', component: RouteBComponent },
];
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { App } from './app/app';
import { routes } from './app/app.routes';

bootstrapApplication(App, { providers: [provideRouter(routes)] });
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Router events and navigation lifecycle</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a console.log that fires specifically on GuardsCheckStart and GuardsCheckEnd (import both from @angular/router) inside the existing router.events.subscribe callback, using instanceof checks.',
    hint: 'Import GuardsCheckStart and GuardsCheckEnd from @angular/router, then add: if (e instanceof GuardsCheckStart) console.log(\'guards starting\'); if (e instanceof GuardsCheckEnd) console.log(\'guards finished\', e.shouldActivate);',
    solution: `import { GuardsCheckStart, GuardsCheckEnd } from '@angular/router';

this.router.events.subscribe((e: Event) => {
  if (e instanceof GuardsCheckStart) console.log('guards starting');
  if (e instanceof GuardsCheckEnd) console.log('guards finished, shouldActivate:', e.shouldActivate);
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a loading indicator only needs to listen for NavigationStart and NavigationEnd.',
      reality: 'a navigation can also terminate via NavigationCancel (e.g. a guard returned false) or NavigationError — listening only for NavigationEnd leaves the loading indicator stuck visible when navigation is cancelled or errors.',
    },
    {
      thought: 'ActivatedRoute and router.routerState.root represent the same thing at different levels of detail.',
      reality: 'router.routerState.root is the root of the ENTIRE resolved route tree for the current navigation, while a single ActivatedRoute represents just one level of it — walking .firstChild from the root is how you traverse the whole tree.',
    },
    {
      thought: 'router.events emits events in an unpredictable order depending on how many guards/resolvers a route has.',
      reality: 'the pipeline order is fixed and well-defined (NavigationStart → RoutesRecognized → GuardsCheckStart/End → ResolveStart/End → NavigationEnd) — the CONTENT of each phase varies, but the sequence of event types does not.',
    },
  ];
}
