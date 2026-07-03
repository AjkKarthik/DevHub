import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-custom-url-matchers-route-config-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './custom-url-matchers-route-config.html',
  styleUrl: './custom-url-matchers-route-config.scss',
})
export class CustomUrlMatchersRouteConfigSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'UrlMatcher — when a path string can\'t express the pattern',
      points: [
        'A route can use <code>matcher: (segments, group, route) =&gt; UrlMatchResult | null</code> INSTEAD OF <code>path</code>. Angular calls the matcher function with the remaining URL segments and expects either <code>null</code> (no match — try the next route) or <code>{ consumed: Segment[], posParams: {...} }</code> (a match, with named params extracted).',
        'Use a matcher when a plain <code>path</code> string genuinely cannot express the rule — for example, matching ONLY numeric IDs (<code>/42</code> matches, <code>/abc</code> does not) versus a slug-based route at the SAME path depth, so both can coexist without one always winning by matching first.',
        'A route has EITHER <code>path</code> OR <code>matcher</code>, never both — <code>matcher</code> takes over the entire matching decision for that route entry.',
      ],
    },
    {
      heading: 'redirectTo — string vs function-based redirects',
      points: [
        'A static string redirect (<code>redirectTo: \'/login\'</code>) does not automatically forward the source route\'s params or query params to the target.',
        'A FUNCTION-BASED redirect (Angular 18+) — <code>redirectTo: (data) =&gt; \`/login?returnUrl=${data.url}\`</code> — receives a <code>RedirectFunction</code> argument with the matched route\'s params, query params, and URL, letting you build the target URL dynamically instead of losing that context on redirect.',
        '<code>pathMatch: \'full\'</code> is REQUIRED on an empty-path redirect (<code>{ path: \'\', redirectTo: \'/home\', pathMatch: \'full\' }</code>) — without it, the default <code>\'prefix\'</code> matching means the empty path matches EVERY URL (since every URL starts with the empty prefix), redirecting the entire app to <code>/home</code> regardless of the actual path.',
      ],
    },
    {
      heading: 'Static route data and per-route document titles',
      points: [
        '<code>data: { roles: [\'admin\'] }</code> attaches static, non-fetched metadata to a route — read it via <code>inject(ActivatedRoute).snapshot.data</code>, or as an <code>input()</code> when <code>withComponentInputBinding()</code> is active. Use it for access-level flags, layout hints, or breadcrumb labels that don\'t need a resolver round-trip.',
        'The <code>title</code> route property (<code>{ path: \'products/:id\', title: \'Product Details\' }</code>) automatically sets <code>document.title</code> on navigation — no manual <code>inject(Title).setTitle(...)</code> call needed. <code>title</code> can also be a <code>ResolveFn&lt;string&gt;</code> for dynamic, data-dependent titles.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, UrlMatchResult, UrlSegment } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: \`
    <h3>Custom UrlMatcher — numeric IDs vs slugs, same path depth</h3>
    <nav>
      <a routerLink="/items/42">/items/42 (numeric → NumericItemComponent)</a><br>
      <a routerLink="/items/angular-guide">/items/angular-guide (slug → SlugItemComponent)</a>
    </nav>
    <router-outlet />
  \`,
})
export class App {}

// The matcher — only matches when the segment is ALL DIGITS
export function numericIdMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments.length === 2 && segments[0].path === 'items' && /^\\d+$/.test(segments[1].path)) {
    return { consumed: segments, posParams: { id: segments[1] } };
  }
  return null;
}
`,
    },
    {
      path: 'src/app/numeric-item.ts',
      content: `import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-numeric-item',
  standalone: true,
  template: \`<p>✅ Matched by UrlMatcher — numeric id: {{ id }}</p>\`,
})
export class NumericItemComponent {
  id = inject(ActivatedRoute).snapshot.params['id'];
}
`,
    },
    {
      path: 'src/app/slug-item.ts',
      content: `import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-slug-item',
  standalone: true,
  template: \`<p>✅ Matched by plain path string — slug: {{ slug }}</p>\`,
})
export class SlugItemComponent {
  slug = inject(ActivatedRoute).snapshot.params['slug'];
}
`,
    },
    {
      path: 'src/app/app.routes.ts',
      content: `import { Routes } from '@angular/router';
import { numericIdMatcher } from './app';
import { NumericItemComponent } from './numeric-item';
import { SlugItemComponent } from './slug-item';

export const routes: Routes = [
  // Matcher-based route tried first — only claims all-digit ids
  { matcher: numericIdMatcher, component: NumericItemComponent },
  // Falls through here for anything the matcher rejected
  { path: 'items/:slug', component: SlugItemComponent },
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
  <head><title>Custom UrlMatchers and route config</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change numericIdMatcher so it only matches IDs with exactly 2 digits (e.g. /items/42 matches but /items/4 or /items/123 do not), and verify /items/4 falls through to the slug route instead.',
    hint: 'Change the regex from /^\\d+$/ to /^\\d{2}$/ — this requires exactly two digit characters, no more, no fewer.',
    solution: `export function numericIdMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments.length === 2 && segments[0].path === 'items' && /^\\d{2}$/.test(segments[1].path)) {
    return { consumed: segments, posParams: { id: segments[1] } };
  }
  return null;
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a route can define both path and matcher, and Angular uses whichever applies.',
      reality: 'a route has EITHER path OR matcher, never both — matcher fully takes over the matching decision for that route entry, and path is not used alongside it.',
    },
    {
      thought: 'redirectTo: \'/login\' automatically carries over the original route\'s query params, like returnUrl.',
      reality: 'a static string redirect does not forward params or query params automatically — use a function-based redirectTo (Angular 18+) to build the target URL from the matched route\'s data.',
    },
    {
      thought: 'pathMatch: \'full\' is just a stylistic default that rarely matters in practice.',
      reality: 'omitting it on an empty-path redirect causes the DEFAULT \'prefix\' matching to treat every URL as matching (since every URL starts with the empty prefix), redirecting the whole app to the target regardless of the actual path — a genuinely common routing bug.',
    },
  ];
}
