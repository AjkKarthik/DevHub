import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-view-transitions-relative-navigation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './view-transitions-relative-navigation.html',
  styleUrl: './view-transitions-relative-navigation.scss',
})
export class ViewTransitionsRelativeNavigationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'withViewTransitions() — free animated route changes',
      points: [
        '<code>provideRouter(routes, withViewTransitions())</code> (Angular 17+) wraps every navigation in the browser\'s native View Transitions API (<code>document.startViewTransition()</code>) — outgoing and incoming DOM states cross-fade by default, with ZERO manual Angular animation setup.',
        'This is a PROGRESSIVE ENHANCEMENT — browsers without View Transitions API support simply navigate normally, with no animation and no error. There is no fallback code to write yourself.',
        'The <code>onViewTransitionCreated</code> callback receives the <code>ViewTransitionInfo</code> (including the <code>ViewTransition</code> object and the navigation itself) — use it to skip the transition for specific navigations (e.g. the very first page load) by checking <code>info.transition.skipTransition()</code>.',
      ],
    },
    {
      heading: 'Customizing which elements morph',
      points: [
        'Add <code>style="view-transition-name: hero-image"</code> (or via a CSS class) to an element that appears on BOTH the outgoing and incoming view — the browser automatically morphs/animates that specific element between its two positions/sizes, instead of the whole page just cross-fading.',
        'Every <code>view-transition-name</code> value must be UNIQUE on the page at any given time — reusing the same name for two simultaneously-visible elements throws a runtime error from the browser\'s View Transitions implementation, not Angular.',
      ],
    },
    {
      heading: 'Relative navigation — relativeTo and ../',
      points: [
        '<code>router.navigate([\'../sibling\'], { relativeTo: this.route })</code> navigates relative to the CURRENT activated route rather than the absolute root — <code>this.route</code> is the injected <code>ActivatedRoute</code>. This avoids hardcoding full paths inside deeply nested feature areas, which would break if the feature were ever remounted under a different parent path.',
        '<code>\'./\'</code> stays at the current route\'s level, <code>\'../\'</code> goes up one level (stackable: <code>\'../../\'</code> goes up two) — the same segment semantics as relative filesystem paths, resolved against <code>relativeTo</code> rather than the browser URL.',
      ],
    },
    {
      heading: 'UrlTree utilities — parsing and serializing outside navigate()',
      points: [
        '<code>router.parseUrl(\'/products/42?tab=reviews\')</code> converts a raw URL STRING into a structured <code>UrlTree</code> object you can inspect (segments, query params, fragment) WITHOUT triggering a navigation — useful for validating or transforming a URL before deciding whether to navigate at all.',
        '<code>router.serializeUrl(urlTree)</code> does the reverse — turns a <code>UrlTree</code> (e.g. one built with <code>router.createUrlTree([...])</code>) back into a plain string, which is exactly how you build a shareable "copy link" URL without actually navigating there.',
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
    <h3>withViewTransitions() — click between routes (best seen in Chrome)</h3>
    <nav>
      <a routerLink="/list">List</a> | <a routerLink="/list/detail">Detail (relative nav inside)</a>
    </nav>
    <router-outlet />
  \`,
})
export class App {}
`,
    },
    {
      path: 'src/app/list.ts',
      content: `import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [RouterLink],
  template: \`
    <div style="view-transition-name: page-title;"><h2>Product List</h2></div>
    <a routerLink="detail">Go to detail (relative)</a>
  \`,
})
export class ListComponent {}
`,
    },
    {
      path: 'src/app/detail.ts',
      content: `import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-detail',
  standalone: true,
  template: \`
    <div style="view-transition-name: page-title;"><h2>Product Detail</h2></div>
    <button (click)="goBack()">Back to list (relative ../)</button>
  \`,
})
export class DetailComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  goBack() {
    // Relative navigation — up one level from this route, not an absolute path
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
`,
    },
    {
      path: 'src/app/app.routes.ts',
      content: `import { Routes } from '@angular/router';
import { ListComponent } from './list';
import { DetailComponent } from './detail';

export const routes: Routes = [
  {
    path: 'list',
    component: ListComponent,
    children: [{ path: 'detail', component: DetailComponent }],
  },
];
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withViewTransitions } from '@angular/router';
import { App } from './app/app';
import { routes } from './app/app.routes';

bootstrapApplication(App, {
  providers: [provideRouter(routes, withViewTransitions())],
});
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>View transitions and relative navigation</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In detail.ts, change the "Back to list" button to navigate up TWO levels with [\'../../\'] instead of one, and predict (before running) whether it still lands on a valid route given this app\'s route tree.',
    hint: 'The route tree is list -> detail (2 levels deep from root). Going up two levels from detail would land above list, at the app root — which has no matching route here, so this specific change would fail to navigate anywhere meaningful. Try it and check the console/URL.',
    solution: `// Going up two levels from 'list/detail' passes above the 'list' route
// entirely, landing at the app root — which has no route defined in
// this demo's app.routes.ts, so the navigation has nowhere valid to
// land. relativeTo segments must be reasoned about against the ACTUAL
// route tree depth, not just guessed.
this.router.navigate(['../../'], { relativeTo: this.route });`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'withViewTransitions() requires writing custom Angular animations or CSS keyframes to define the transition.',
      reality: 'it wraps navigation in the browser\'s native View Transitions API, which cross-fades by default with zero animation code — you only add CSS/view-transition-name when you want to customize which specific elements morph.',
    },
    {
      thought: 'relativeTo navigation resolves relative to the current BROWSER URL.',
      reality: 'it resolves relative to the ActivatedRoute you pass as relativeTo — an injected ActivatedRoute in a deeply nested component, not the URL bar — which is what makes it independent of the feature\'s mount path.',
    },
    {
      thought: 'router.parseUrl() triggers a navigation to the URL it parses.',
      reality: 'it only converts a URL string into a structured UrlTree object for inspection — no navigation happens unless you separately pass that tree to router.navigateByUrl().',
    },
  ];
}
