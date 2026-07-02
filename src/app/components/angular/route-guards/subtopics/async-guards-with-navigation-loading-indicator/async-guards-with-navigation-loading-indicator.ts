import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-async-guards-with-navigation-loading-indicator-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './async-guards-with-navigation-loading-indicator.html',
  styleUrl: './async-guards-with-navigation-loading-indicator.scss',
})
export class AsyncGuardsWithNavigationLoadingIndicatorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'An async guard blocks navigation silently — the UI must say so',
      points: [
        'The main topic\'s <code>authInitGuard</code> example returns an <code>Observable&lt;boolean | UrlTree&gt;</code> that waits for <code>auth.initialized$</code>. From the ROUTER\'s perspective this works perfectly — but from the USER\'s perspective, clicking a link and having nothing visibly happen for a second or two (while the guard resolves) looks like a broken click, not a loading state.',
        'The fix is not inside the guard itself — it is a router-events-driven loading indicator that shows for the ENTIRE navigation (including all guard/resolver time), not just HTTP request time from an interceptor.',
      ],
    },
    {
      heading: 'Router.events is the correct signal — not the guard\'s own Observable',
      points: [
        'Subscribing to <code>Router.events</code> for <code>NavigationStart</code> (show loading) and <code>NavigationEnd</code> / <code>NavigationCancel</code> / <code>NavigationError</code> (hide loading) captures the FULL navigation lifecycle — <code>canMatch</code>, <code>canActivateChild</code>, <code>canActivate</code>, resolvers, and the actual component render — as a single loading window, regardless of which specific guard is slow.',
        'This is important because a real app usually has SEVERAL guards and resolvers on a route; a loading indicator wired to just one guard\'s Observable would flicker off before the others finish. Router-events-based loading is guard-count-agnostic — it does not need to know which or how many guards exist on a route.',
      ],
    },
    {
      heading: 'NavigationCancel must hide the indicator too — a guard returning false is not an error',
      points: [
        'A guard blocking navigation (returning <code>false</code>, or a redirecting <code>UrlTree</code> which becomes a new navigation) fires <code>NavigationCancel</code>, NOT <code>NavigationError</code>. A loading service that only listens for <code>NavigationEnd</code> to hide the spinner will leave it stuck on screen forever after a blocked navigation — <code>NavigationCancel</code> and <code>NavigationError</code> must both be treated as "navigation is over, hide the indicator" alongside <code>NavigationEnd</code>.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/nav-loading.service.ts',
      content: `import { Injectable, inject, signal } from '@angular/core';
import {
  Router, NavigationStart, NavigationEnd,
  NavigationCancel, NavigationError,
} from '@angular/router';

@Injectable({ providedIn: 'root' })
export class NavLoadingService {
  private router = inject(Router);
  private _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this._loading.set(true);
      }
      // All three of these mean "the navigation attempt is over" —
      // a blocked guard (NavigationCancel) is NOT an error and must
      // still hide the indicator, same as a successful NavigationEnd.
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this._loading.set(false);
      }
    });
  }
}
`,
    },
    {
      path: 'src/app/auth-init.guard.ts',
      content: `import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from './auth.service';

// Simulates a guard that waits ~1.5s for auth state to initialise on app startup —
// long enough to make an un-indicated navigation feel broken.
export const authInitGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.initialized$.pipe(
    filter(Boolean),
    take(1),
    map(() => auth.isLoggedIn() ? true : router.createUrlTree(['/login'])),
  );
};
`,
    },
    {
      path: 'src/app/auth.service.ts',
      content: `import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _loggedIn = signal(true);
  readonly initialized$ = new BehaviorSubject(false);

  constructor() {
    // Simulate a slow auth check (e.g. verifying a token with the server)
    setTimeout(() => this.initialized$.next(true), 1500);
  }

  isLoggedIn(): boolean {
    return this._loggedIn();
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { NavLoadingService } from './nav-loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: \`
    @if (navLoading.loading()) {
      <div class="top-loading-bar">Loading…</div>
    }
    <nav>
      <a routerLink="/dashboard">Dashboard (guarded by authInitGuard)</a>
    </nav>
    <p>Click Dashboard immediately after the page loads — authInitGuard takes ~1.5s to
    resolve. Without the loading bar, that click would look broken; with it, the delay
    reads as "loading," not "unresponsive."</p>
    <router-outlet />
  \`,
  styles: [\`
    .top-loading-bar {
      position: fixed; top: 0; left: 0; right: 0; height: 4px;
      background: #dd0031; animation: pulse 1s ease-in-out infinite;
    }
    @keyframes pulse { 50% { opacity: 0.4; } }
  \`],
})
export class App {
  navLoading = inject(NavLoadingService);
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { App } from './app/app';
import { authInitGuard } from './app/auth-init.guard';

bootstrapApplication(App, {
  providers: [
    provideRouter([
      {
        path: 'dashboard',
        canActivate: [authInitGuard],
        loadComponent: () => import('./app/pages/dashboard').then(m => m.DashboardComponent),
      },
      { path: 'login', loadComponent: () => import('./app/pages/login').then(m => m.LoginComponent) },
    ]),
  ],
});
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Async guards with a navigation loading indicator</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a route-level "blocked" flash message that appears briefly whenever NavigationCancel fires, distinct from the normal loading-hide behavior.',
    hint: 'Add a separate signal (e.g. wasBlocked) set to true inside the NavigationCancel branch, reset it after a short setTimeout, and render a conditional message in app.ts alongside the loading bar.',
    solution: `private _wasBlocked = signal(false);
readonly wasBlocked = this._wasBlocked.asReadonly();

// inside the router.events.subscribe callback:
if (event instanceof NavigationCancel) {
  this._wasBlocked.set(true);
  setTimeout(() => this._wasBlocked.set(false), 2000);
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'wiring a loading indicator to the async guard\'s own Observable is the natural place to show navigation loading state.',
      reality: 'a route can have MULTIPLE guards and resolvers — an indicator tied to one guard\'s Observable hides too early if others are still resolving; Router.events (NavigationStart through NavigationEnd/Cancel/Error) captures the full navigation regardless of guard count.',
    },
    {
      thought: 'NavigationCancel means something went wrong and should be handled like an error.',
      reality: 'NavigationCancel fires for entirely normal outcomes too — a guard returning false, or a redirecting UrlTree becoming a new navigation — and must still hide the loading indicator, same as a successful NavigationEnd.',
    },
    {
      thought: 'an HTTP-request-based loading interceptor is enough to cover navigation loading state.',
      reality: 'guard and resolver time is NOT necessarily backed by an HTTP call an interceptor can see (e.g. waiting on a BehaviorSubject or a cached signal) — Router.events is the only signal that reliably spans the entire navigation, guard time included.',
    },
  ];
}
