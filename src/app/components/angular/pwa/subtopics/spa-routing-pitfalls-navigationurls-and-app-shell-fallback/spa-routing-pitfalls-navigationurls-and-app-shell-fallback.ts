import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-spa-routing-pitfalls-navigationurls-and-app-shell-fallback-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './spa-routing-pitfalls-navigationurls-and-app-shell-fallback.html',
  styleUrl: './spa-routing-pitfalls-navigationurls-and-app-shell-fallback.scss',
})
export class SpaRoutingPitfallsNavigationurlsAndAppShellFallbackSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A pitfall the main topic\'s ngsw-config.json example doesn\'t mention',
      points: [
        'The main PWA page shows <code>assetGroups</code> and <code>dataGroups</code> but not the third top-level <code>ngsw-config.json</code> concept: <code>"index"</code> and the implicit <code>navigationUrls</code> mechanism. Angular\'s service worker serves <code>index.html</code> for ANY navigation request that matches the app\'s routes — this is what makes deep links like <code>/products/42</code> work when the SW is intercepting all traffic offline, instead of returning a 404 because no literal file at that path exists.',
        'Without understanding this fallback, a common production bug appears: certain routes (often ones with file-extension-like segments, e.g. <code>/users/report.v2</code>) get served the WRONG content — either a raw 404, or unexpectedly falling through to a non-Angular resource — because they were excluded from the navigation-fallback matching by default heuristics.',
      ],
    },
    {
      heading: 'How navigationUrls decides what gets the index.html fallback',
      points: [
        'By default, Angular\'s service worker treats a request as a "navigation" (and serves <code>index.html</code>) when it is a GET request with <code>Accept: text/html</code> AND does NOT match a set of DEFAULT EXCLUSION patterns — critically, any URL segment containing a DOT is assumed to be a file request (e.g. <code>/assets/logo.png</code>, or accidentally <code>/orders/invoice.pdf</code>-shaped Angular routes) and is excluded from the fallback by default.',
        'If your Angular ROUTES legitimately contain a dot-like segment (a route param that looks like a filename, a version string such as <code>/report.v2</code>), the default exclusion silently breaks deep-linking and offline access to that route — the service worker treats it as "must be a real file" and does not serve the app shell.',
        'Override this in <code>ngsw-config.json</code> with an explicit <code>navigationUrls</code> array: entries starting with <code>!</code> EXCLUDE a pattern, everything else INCLUDES it. To re-include a dot-containing route the default logic wrongly excludes, add its specific pattern back in: <code>&#123; "navigationUrls": ["/**", "!/**/*.*", "/report.v2"] &#125;</code> (the exact syntax mirrors — but is layered ON TOP of — Angular\'s built-in defaults, not a full replacement of them).',
      ],
    },
    {
      heading: 'Verifying this in practice — and the specific symptom to watch for',
      points: [
        'The concrete symptom: hard-refreshing (or opening a NEW tab to) a deep-linked URL like <code>/report.v2</code> while online works fine (the real server\'s catch-all/history-API-fallback handles it) — but the SAME URL fails once the service worker has taken control and the site goes offline, or in some setups even while online once the SW is active, because the SW intercepts the request BEFORE it reaches the real server\'s own fallback.',
        'Reproduce and confirm locally: <code>ng build</code>, serve with a static server, load the app once (to install the SW), then in DevTools\' Application → Service Workers panel check "Offline", and directly navigate to the affected deep link. A working app-shell fallback loads the Angular app and its router takes over; a broken one shows the static server\'s raw 404.',
        'This is DISTINCT from a Web Server misconfiguration (the classic "SPA 404 on refresh" issue solved by server-side history-API-fallback) — that server-side fix only helps while ONLINE and reachable. The service worker\'s OWN <code>navigationUrls</code> config is what determines behavior once the SW is actively intercepting requests, including fully offline.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'ngsw-config.json',
      content: `{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app-shell",
      "installMode": "prefetch",
      "resources": { "files": ["/favicon.ico", "/index.html", "/*.css", "/*.js"] }
    }
  ],
  "navigationUrls": [
    "/**",
    "!/**/*.*",
    "!/**/*__*",
    "!/**/*__*/**",

    "/report.v2",
    "/users/*.export"
  ]
}
`,
    },
    {
      path: 'src/app/app.routes.ts',
      content: `import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./home').then(m => m.Home) },

  // These two routes have dot-containing segments — Angular's SW default
  // exclusion pattern ("!/**/*.*") treats anything with a dot as a file
  // request and will NOT serve index.html for them offline unless the
  // ngsw-config.json navigationUrls override above explicitly re-includes them.
  { path: 'report.v2', loadComponent: () => import('./report').then(m => m.Report) },
  { path: 'users/:exportName.export', loadComponent: () => import('./export').then(m => m.ExportView) },
];
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: \`
    <h3>SPA routing pitfalls: navigationUrls and the app-shell fallback</h3>
    <p>
      In a real deployment: build with "ng build", serve the "dist/.../browser" folder
      with a static server, load the app once to install the service worker, then in
      DevTools' Application panel check "Offline" and navigate directly to /report.v2.
      Without the navigationUrls override in ngsw-config.json, that deep link would 404
      once the service worker is controlling the page — even though it works fine online.
    </p>
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
  <head><title>SPA Routing Pitfalls: navigationUrls</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a THIRD dot-containing route, <code>/settings/v1.2-beta</code>, to <code>app.routes.ts</code>, and add the corresponding <code>navigationUrls</code> entry in <code>ngsw-config.json</code> so it also gets the offline app-shell fallback.',
    hint: 'Add the route to app.routes.ts the same way as report.v2 and users/:exportName.export. In ngsw-config.json\'s navigationUrls array, add "/settings/v1.2-beta" as a new include-pattern entry (no leading "!") alongside the existing two overrides.',
    solution: `// app.routes.ts — add alongside the existing routes:
{ path: 'settings/v1.2-beta', loadComponent: () => import('./settings').then(m => m.Settings) },

// ngsw-config.json — add to the navigationUrls array:
{
  "navigationUrls": [
    "/**",
    "!/**/*.*",
    "!/**/*__*",
    "!/**/*__*/**",

    "/report.v2",
    "/users/*.export",
    "/settings/v1.2-beta"
  ]
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'once a server-side history-API-fallback is configured (the classic "SPA 404 on refresh" fix), Angular PWA deep links are safe from 404s in every scenario.',
      reality: 'that server-side fix only helps while online and the real server is reachable — once the service worker is actively intercepting requests (including fully offline), the SW\'s OWN navigationUrls config determines whether a deep link gets the index.html fallback, completely independent of the server.',
    },
    {
      thought: 'a route param or path segment containing a dot (like a version string or filename-shaped param) works the same as any other Angular route under the service worker.',
      reality: 'Angular\'s default navigationUrls exclusion pattern treats any URL segment with a dot as a file request and excludes it from the app-shell fallback by default — a legitimate route with a dot needs to be explicitly re-included in ngsw-config.json\'s navigationUrls array.',
    },
    {
      thought: '<code>ngsw-config.json</code> only controls WHAT gets cached (assetGroups/dataGroups) — routing is entirely the Angular Router\'s concern.',
      reality: 'the top-level "index" and "navigationUrls" settings in ngsw-config.json determine which incoming NETWORK REQUESTS the service worker treats as app navigations (serving index.html) versus real file lookups — this happens before the Angular Router ever runs, since the SW intercepts the request first.',
    },
  ];
}
