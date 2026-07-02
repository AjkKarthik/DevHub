import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-tracing-guard-execution-order-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './tracing-guard-execution-order.html',
  styleUrl: './tracing-guard-execution-order.scss',
})
export class TracingGuardExecutionOrderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic states the order — this subtopic proves it with console output',
      points: [
        'The stated order is <code>canMatch → canActivateChild → canActivate → (resolvers) → canDeactivate</code> (of the OUTGOING route). Reading that as prose is one thing; watching a real nested navigation print each guard\'s name to the console as it fires removes any doubt about edge cases like "does the outgoing route\'s canDeactivate run before or after the incoming route\'s canActivate?"',
        'Answer, confirmed by the demo: <code>canDeactivate</code> of the LEAVING route runs BEFORE <code>canActivate</code> of the ENTERING route — Angular fully resolves whether the user is allowed to leave before it starts evaluating whether they are allowed to arrive.',
      ],
    },
    {
      heading: 'canMatch fires per candidate route definition, not once per navigation',
      points: [
        'When TWO route definitions share the same path (the feature-flag fallback pattern from the main topic), <code>canMatch</code> can fire MULTIPLE times in a single navigation — once for each candidate definition, in declaration order, until one returns true or the list is exhausted.',
        'This is visible in the trace: navigating to <code>/checkout</code> with the feature flag OFF logs <code>canMatch: checkout-v2 → false</code> THEN <code>canMatch: checkout (fallback) → true</code> — two separate <code>canMatch</code> evaluations for the one navigation.',
      ],
    },
    {
      heading: 'A guard returning a UrlTree short-circuits everything after it',
      points: [
        'The trace also shows what happens when a guard redirects: if <code>canActivate</code> returns a <code>UrlTree</code>, no resolver on that route ever runs, and Angular starts a BRAND NEW navigation cycle to the redirect target — which has its OWN full guard sequence (its own <code>canMatch</code>, <code>canActivate</code>, etc.) starting from scratch.',
        'This means a redirecting guard is not a "skip to the end" — it is "abort this navigation, start over as a new one." Console tracing makes this two-navigation-cycle behavior visible in a way the prose description alone does not.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/tracing.guards.ts',
      content: `import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, CanDeactivateFn, CanMatchFn } from '@angular/router';

// Every guard below just logs its own name + phase, then allows navigation —
// the goal is to observe ORDER, not to actually block anything.

export const tracedCanMatch: CanMatchFn = (route) => {
  console.log(\`[canMatch] evaluating route definition for "\${route.path}"\`);
  return true;
};

export const tracedCanActivateChild: CanActivateChildFn = (route) => {
  console.log(\`[canActivateChild] fired for child under "\${route.parent?.url}"\`);
  return true;
};

export const tracedCanActivate: CanActivateFn = (route) => {
  console.log(\`[canActivate] entering "\${route.routeConfig?.path}"\`);
  return true;
};

export const tracedCanDeactivate: CanDeactivateFn<unknown> = () => {
  console.log('[canDeactivate] leaving current route');
  return true;
};
`,
    },
    {
      path: 'src/app/app.routes.ts',
      content: `import { Routes } from '@angular/router';
import { tracedCanMatch, tracedCanActivateChild, tracedCanActivate, tracedCanDeactivate } from './tracing.guards';

export const routes: Routes = [
  {
    path: 'section',
    canActivateChild: [tracedCanActivateChild],
    children: [
      {
        path: 'page-a',
        canMatch: [tracedCanMatch],
        canActivate: [tracedCanActivate],
        canDeactivate: [tracedCanDeactivate],
        loadComponent: () => import('./pages/page-a').then(m => m.PageAComponent),
      },
      {
        path: 'page-b',
        canMatch: [tracedCanMatch],
        canActivate: [tracedCanActivate],
        canDeactivate: [tracedCanDeactivate],
        loadComponent: () => import('./pages/page-b').then(m => m.PageBComponent),
      },
    ],
  },
];

// Expected console order when navigating page-a -> page-b:
// [canDeactivate] leaving current route          (page-a's own guard, fires FIRST)
// [canMatch] evaluating route definition for "page-b"
// [canActivateChild] fired for child under "/section"
// [canActivate] entering "page-b"
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: \`
    <nav>
      <a routerLink="/section/page-a">Page A</a> |
      <a routerLink="/section/page-b">Page B</a>
    </nav>
    <p>Open the console, then click between Page A and Page B — watch the exact order
    canDeactivate, canMatch, canActivateChild, and canActivate fire in.</p>
    <router-outlet />
  \`,
})
export class App {}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { App } from './app/app';
import { routes } from './app/app.routes';

bootstrapApplication(App, {
  providers: [provideRouter(routes)],
});
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Tracing guard execution order</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a second canMatch-gated route sharing the "page-a" path as a fallback, and confirm canMatch fires twice for a single navigation when the primary definition returns false.',
    hint: 'Add a route with the same path: \'page-a\' but a canMatch guard that always returns false, placed BEFORE the working page-a route — Angular tries route definitions in declaration order.',
    solution: `export const routes: Routes = [
  {
    path: 'section',
    canActivateChild: [tracedCanActivateChild],
    children: [
      {
        path: 'page-a',
        canMatch: [() => { console.log('[canMatch] page-a v2 -> false'); return false; }],
        loadComponent: () => import('./pages/page-a-v2').then(m => m.PageAV2Component),
      },
      {
        path: 'page-a',
        canMatch: [tracedCanMatch],
        canActivate: [tracedCanActivate],
        canDeactivate: [tracedCanDeactivate],
        loadComponent: () => import('./pages/page-a').then(m => m.PageAComponent),
      },
      // ...page-b unchanged
    ],
  },
];`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'canDeactivate of the route you are leaving runs AFTER canActivate of the route you are entering.',
      reality: 'Angular fully resolves canDeactivate for the outgoing route FIRST — only once leaving is confirmed does it move on to evaluating whether the incoming route can be entered.',
    },
    {
      thought: 'canMatch fires exactly once per navigation, just like canActivate.',
      reality: 'canMatch fires once PER CANDIDATE ROUTE DEFINITION sharing a path — if multiple route definitions share the same path (the feature-flag fallback pattern), canMatch can fire multiple times in a single navigation.',
    },
    {
      thought: 'a guard returning a UrlTree redirect is like a "goto" that jumps straight to the new route, skipping the rest of the current navigation\'s guard checks.',
      reality: 'a redirecting guard ABORTS the current navigation entirely and Angular starts a brand new navigation cycle to the redirect target — which runs its OWN full guard sequence from scratch, not a partial continuation of the old one.',
    },
  ];
}
