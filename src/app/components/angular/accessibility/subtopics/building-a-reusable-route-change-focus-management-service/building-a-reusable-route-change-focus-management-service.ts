import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-building-a-reusable-route-change-focus-management-service-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './building-a-reusable-route-change-focus-management-service.html',
  styleUrl: './building-a-reusable-route-change-focus-management-service.scss',
})
export class BuildingAReusableRouteChangeFocusManagementServiceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The one-line snippet has three real gaps',
      points: [
        'The main topic\'s <code>document.querySelector(\'h1\')?.focus()</code> after every <code>NavigationEnd</code> works for the simple case but has gaps a production app hits quickly: (1) it fires on EVERY navigation including same-page hash-fragment jumps (<code>/docs#section-2</code>), where stealing focus back to the <code>h1</code> actively fights the user\'s intended in-page scroll; (2) some pages genuinely have no <code>h1</code> (a full-bleed hero layout, an error page using a different heading level), leaving the querySelector silently return <code>null</code> and focus goes nowhere; (3) it does not distinguish a NEW navigation from a browser back/forward that is restoring scroll position, where re-focusing the heading can fight the browser\'s own scroll restoration.',
      ],
    },
    {
      heading: 'A reusable service — skip same-page fragment navigation',
      points: [
        'Compare the navigation\'s URL segments (ignoring the fragment) between the previous and current <code>NavigationEnd</code> events — if only the FRAGMENT changed (same path, same query params, different <code>#hash</code>), skip the focus move entirely; the browser\'s own anchor-jump behavior already handles that case correctly, and Angular\'s focus management should not interfere with it.',
        'Track the previous URL in a private field updated on every <code>NavigationEnd</code>, and compute the comparison using <code>UrlTree</code> equality on everything EXCEPT the fragment — Angular\'s <code>Router.parseUrl()</code> and manual fragment-stripping give you a reliable way to do this comparison without brittle string manipulation.',
      ],
    },
    {
      heading: 'A landmark fallback when no h1 exists — and the page-load exemption',
      points: [
        'Fall back gracefully: try <code>document.querySelector(\'h1\')</code> first; if null, try <code>document.querySelector(\'[role="main"], main\')</code> (the main landmark, which every page SHOULD have even without an <code>h1</code>); if THAT is also null, do nothing rather than throwing or focusing something arbitrary and confusing.',
        'Skip focus management entirely on the VERY FIRST navigation (the initial page load) — a user who just landed on the page via a direct URL or link click already has their focus wherever the browser naturally placed it (often the address bar or the document body), and immediately stealing it to the heading on first load is disorienting rather than helpful; only move focus on SUBSEQUENT navigations, which represent the user\'s own in-app navigation action.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/focus-management.service.ts',
      content: `import { Injectable, inject, DestroyRef } from '@angular/core';
import { Router, NavigationEnd, UrlTree } from '@angular/router';
import { filter, pairwise, startWith } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class FocusManagementService {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private isFirstNavigation = true;

  start(): void {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        startWith(null),
        pairwise(),
      )
      .subscribe(([prev, curr]) => {
        if (!curr) return;

        // Skip the very first real navigation after page load
        if (this.isFirstNavigation) {
          this.isFirstNavigation = false;
          return;
        }

        if (prev && this.isSameFragmentOnlyChange(prev.urlAfterRedirects, curr.urlAfterRedirects)) {
          return; // same-page anchor jump — let the browser handle it
        }

        this.moveFocusToHeading();
      });
  }

  private isSameFragmentOnlyChange(prevUrl: string, currUrl: string): boolean {
    const prevTree = this.router.parseUrl(prevUrl);
    const currTree = this.router.parseUrl(currUrl);
    const stripFragment = (t: UrlTree) => { const clone = t; clone.fragment = null; return clone.toString(); };
    return stripFragment(prevTree) === stripFragment(currTree);
  }

  private moveFocusToHeading(): void {
    const target =
      document.querySelector<HTMLElement>('h1') ??
      document.querySelector<HTMLElement>('[role="main"], main');

    if (!target) return; // no reasonable target — do nothing rather than guess

    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1'); // make it programmatically focusable
    }
    target.focus();
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { FocusManagementService } from './focus-management.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: \`
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <nav>
      <a routerLink="/page-a">Page A</a> |
      <a routerLink="/page-b">Page B (no h1)</a> |
      <a routerLink="/page-a#section-2" fragment="section-2">Page A, section 2 (same page)</a>
    </nav>
    <main id="main-content">
      <router-outlet />
    </main>
  \`,
})
export class App implements OnInit {
  private focusManager = inject(FocusManagementService);

  ngOnInit() {
    this.focusManager.start();
  }
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { App } from './app/app';

bootstrapApplication(App, {
  providers: [
    provideRouter([
      { path: 'page-a', loadComponent: () => import('./app/page-a').then(m => m.PageAComponent) },
      { path: 'page-b', loadComponent: () => import('./app/page-b').then(m => m.PageBComponent) },
    ]),
  ],
});
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Building a reusable route-change focus management service</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add PageAComponent and PageBComponent — PageAComponent has an <h1>, PageBComponent has only a <main role="main"> and no <h1>, to exercise the fallback path.',
    hint: 'PageBComponent\'s template should have no h1 element at all, just a <div role="main"> wrapping its content, so moveFocusToHeading() falls through to the landmark fallback.',
    solution: `// page-a.ts
@Component({ standalone: true, template: '<h1 tabindex="-1">Page A</h1><p id="section-2">Section 2 content</p>' })
export class PageAComponent {}

// page-b.ts — NO h1 at all, exercises the landmark fallback
@Component({ standalone: true, template: '<div role="main"><p>Page B content, no heading</p></div>' })
export class PageBComponent {}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a route-change focus management snippet should move focus to the heading on every NavigationEnd event unconditionally.',
      reality: 'a same-page fragment-only navigation (an anchor jump) should be skipped entirely — stealing focus back to the heading actively fights the user\'s intended in-page scroll to that anchor.',
    },
    {
      thought: 'if a page has no h1 element, focus management should just do nothing for that page.',
      reality: 'a graceful fallback to the main landmark (role="main" or <main>) still gives keyboard/screen-reader users a sensible focus target — silently doing nothing is worse than a reasonable fallback.',
    },
    {
      thought: 'focus should move to the heading on the very first page load, same as any other navigation.',
      reality: 'a user who just landed via a direct URL or link click already has their focus placed naturally by the browser — stealing it to the heading on first load is disorienting; only subsequent in-app navigations should trigger the focus move.',
    },
  ];
}
