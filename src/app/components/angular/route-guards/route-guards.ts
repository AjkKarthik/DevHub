import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-route-guards',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, BeforeAfterComponent, PrerequisitesComponent,
  ],
  templateUrl: './route-guards.html',
  styleUrl: './route-guards.scss',
})
export class RouteGuardsDemo {

  prerequisites: Prerequisite[] = [
    { label: 'Routing',              route: '/angular/routing' },
    { label: 'Dependency Injection', route: '/angular/di' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'CanActivateFn',        type: 'type',      desc: 'Guard that decides if a route can be entered. Returns boolean or UrlTree for redirect', since: 'Angular 14' },
    { name: 'CanDeactivateFn<T>',   type: 'type',      desc: 'Guard that runs when leaving a route. Receives the component instance — use for dirty-state checks', since: 'Angular 14' },
    { name: 'CanActivateChildFn',   type: 'type',      desc: 'Like canActivate but protects all child routes of the parent automatically', since: 'Angular 14' },
    { name: 'CanMatchFn',           type: 'type',      desc: 'Decides if a route DEFINITION should match at all. Blocks lazy chunk download. Best for feature flags', since: 'Angular 15' },
    { name: 'inject()',             type: 'function',  desc: 'Access services inside functional guards — replaces constructor injection', since: 'Angular 14' },
    { name: 'router.createUrlTree', type: 'method',    desc: 'Create a redirect destination — return from guard instead of false to avoid URL flicker', since: 'Angular 2' },
    { name: 'canActivate: [fn]',    type: 'syntax',    desc: 'Register guard on a route definition. Multiple guards = all must pass', since: 'Angular 2' },
    { name: 'canMatch: [fn]',       type: 'syntax',    desc: 'Register match guard on a route. If false, route is skipped and next definition is tried', since: 'Angular 15' },
    { name: 'ActivatedRouteSnapshot', type: 'class',   desc: 'First param of CanActivateFn — read route params, data, and query params', since: 'Angular 2' },
    { name: 'RouterStateSnapshot',  type: 'class',     desc: 'Second param of CanActivateFn — read the full intended URL the user was navigating to', since: 'Angular 2' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The guard lifecycle — when each type fires',
      points: [
        'Angular runs guards in a specific order during navigation: <strong>canMatch → canActivateChild → canActivate → canDeactivate</strong> (of the outgoing route). Understanding this sequence prevents "why didn\'t my guard run?" bugs.',
        '<code>canMatch</code> fires earliest — before Angular even checks if the route definition should be considered. It prevents loading the lazy chunk entirely if it returns false. Angular moves to the next matching route definition.',
        '<code>canActivate</code> fires after route matching (and after the lazy chunk is downloaded). If it returns false or a UrlTree, the chunk was already loaded but the user is blocked/redirected.',
        '<code>canDeactivate</code> fires when the user attempts to LEAVE the current route — on navigation away or browser back. It receives the current component instance as its first argument.',
        '<code>canActivateChild</code> is applied to the parent route and runs for every navigation to any of its children — useful for role-checking an entire admin section without adding guards to each child route.',
      ],
    },
    {
      heading: 'CanActivateFn — auth and role-based access',
      points: [
        'A <code>CanActivateFn</code> is a plain function: <code>(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => boolean | UrlTree | Observable&lt;boolean | UrlTree&gt;</code>. Call <code>inject()</code> inside it to access services.',
        'Always return a <code>UrlTree</code> for redirects — not <code>false</code>. Returning <code>false</code> blocks navigation but leaves the URL bar showing the denied route for a brief moment (URL flicker). A UrlTree does an atomic redirect with no visible flicker.',
        '<code>state.url</code> is the URL the user was trying to reach. Store it and redirect back after login: <code>router.createUrlTree([\'/login\'], { queryParams: { returnUrl: state.url } })</code>.',
        'For signal-based auth: <code>inject(AuthService).currentUser()</code> is synchronous — no Observable needed. Guards can return a plain boolean when the auth state is available as a signal.',
        'Multiple guards in an array (<code>canActivate: [authGuard, roleGuard]</code>) run in series — if the first returns false, subsequent guards do NOT run. Order matters.',
      ],
    },
    {
      heading: 'CanDeactivateFn — protecting unsaved changes',
      points: [
        '<code>CanDeactivateFn&lt;T&gt;</code> receives the component instance as its first argument. Read component state directly — no shared service or event emitter needed.',
        'The classic pattern: the component exposes an <code>isDirty</code> signal or a <code>canDeactivate()</code> method; the guard calls it. This keeps the dirty-check logic in the component where it belongs.',
        'For a simple confirm dialog: <code>return component.isDirty() ? window.confirm(\'Leave without saving?\') : true</code>. For a custom modal, return an <code>Observable&lt;boolean&gt;</code> from the dialog result.',
        'The guard can also return a <code>UrlTree</code> to redirect instead of blocking — e.g. redirect to an auto-save endpoint before leaving.',
        'Be careful with browser back/forward: <code>canDeactivate</code> fires but the browser may override your decision on hard back-button presses in some browsers. The HTML5 <code>beforeunload</code> event is the fallback for tab/window close.',
      ],
    },
    {
      heading: 'CanMatchFn — feature flags and lazy route gating',
      points: [
        '<code>CanMatchFn</code> runs before Angular resolves the lazy chunk. If it returns false, Angular treats this route definition as if it does not exist and continues matching subsequent routes. The lazy bundle is never downloaded.',
        'This makes it ideal for <strong>feature flags</strong>: define two routes for the same path — one with the new feature component gated by a <code>featureFlagGuard</code>, and one with the old component as fallback. Users without the flag get the old route transparently.',
        'Unlike <code>canActivate</code>, returning false from <code>canMatch</code> does NOT automatically redirect — it just skips this route. Add a wildcard route or fallback route to handle the non-matched case.',
        'Also useful for role-based lazy loading: the admin module chunk is never downloaded for non-admin users, reducing attack surface and bundle size.',
      ],
    },
    {
      heading: 'Parameterized guards — the factory function pattern',
      points: [
        'Sometimes you want the same guard with different configuration: <code>roleGuard(\'admin\')</code> vs <code>roleGuard(\'editor\')</code>. The factory pattern solves this cleanly.',
        'Write a function that takes config and returns a <code>CanActivateFn</code>: <code>export function roleGuard(role: string): CanActivateFn { return (route, state) => { ... }; }</code>.',
        'Use it on routes: <code>canActivate: [roleGuard(\'admin\')]</code>. The inner function uses <code>inject()</code> normally — injection context is preserved inside the returned function.',
        'Alternatively, pass config via route\'s <code>data</code> property and read it via the <code>ActivatedRouteSnapshot</code> first parameter: <code>route.data[\'role\']</code>. This works well when you want the guard to be stateless and fully reusable without a factory.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'canActivate (auth guard)',
      language: 'typescript',
      code: `// auth.guard.ts — protect routes from unauthenticated access
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;  // ✅ allow navigation
  }

  // Redirect to /login, preserving intended URL for post-login redirect
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

// Register in route definition:
export const appRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
    canActivate: [authGuard],
    canActivateChild: [authGuard],  // protect all children too
  },
];

// Signal-based auth service (synchronous — no Observable needed in guard)
@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(null);
  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn  = computed(() => this._user() !== null);

  login(user: User)  { this._user.set(user); }
  logout()           { this._user.set(null); }
}`,
    },
    {
      label: 'canDeactivate (unsaved changes)',
      language: 'typescript',
      code: `// Interface the component implements — guard calls this method
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

// The guard — generic over the component type
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> =
  (component) => {
    if (!component.hasUnsavedChanges()) {
      return true;  // clean — let the user leave
    }
    return window.confirm(
      'You have unsaved changes. Leave without saving?'
    );
  };

// For a custom modal dialog (returns Observable<boolean>)
export const unsavedChangesGuardModal: CanDeactivateFn<HasUnsavedChanges> =
  (component) => {
    if (!component.hasUnsavedChanges()) return true;

    const dialog = inject(ConfirmDialogService);
    return dialog.open({
      title:   'Unsaved changes',
      message: 'Leave without saving?',
      confirm: 'Leave',
      cancel:  'Stay',
    }); // returns Observable<boolean>
  };

// Component implements the interface
@Component({ selector: 'app-edit-user', ... })
export class EditUserComponent implements HasUnsavedChanges {
  private originalData = signal<UserDto | null>(null);
  formValue            = signal<UserDto | null>(null);

  isDirty = computed(() =>
    JSON.stringify(this.formValue()) !== JSON.stringify(this.originalData())
  );

  hasUnsavedChanges(): boolean {
    return this.isDirty();
  }
}

// Route registration
{
  path: 'users/:id/edit',
  component: EditUserComponent,
  canDeactivate: [unsavedChangesGuard],
}`,
    },
    {
      label: 'canMatch (feature flags)',
      language: 'typescript',
      code: `// canMatch gates the route DEFINITION — if false, the route is skipped
// The lazy chunk is never downloaded for users without the flag

// feature-flag.guard.ts
export function featureFlagGuard(flag: string): CanMatchFn {
  return () => {
    const features = inject(FeatureFlagService);
    return features.isEnabled(flag);
  };
}

// Routes: two definitions for the same path
// Angular tries them in order — first canMatch that passes wins
export const appRoutes: Routes = [
  // New checkout — only for users in the beta flag
  {
    path: 'checkout',
    loadComponent: () => import('./checkout-v2/checkout-v2').then(m => m.CheckoutV2),
    canMatch: [featureFlagGuard('checkout-v2-beta')],
  },
  // Old checkout — fallback for everyone else
  {
    path: 'checkout',
    loadComponent: () => import('./checkout/checkout').then(m => m.CheckoutComponent),
  },
];

// canMatch for role-based lazy loading (admin module never downloads for non-admins)
{
  path: 'admin',
  loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
  canMatch: [roleMatchGuard('admin')],
},
{
  path: 'admin',
  redirectTo: '/forbidden',  // fallback if canMatch fails
}

export function roleMatchGuard(role: string): CanMatchFn {
  return () => {
    const auth = inject(AuthService);
    return auth.currentUser()?.roles.includes(role) ?? false;
  };
}`,
    },
    {
      label: 'Parameterized role guard',
      language: 'typescript',
      code: `// Factory pattern — returns a configured CanActivateFn
// Works for both canActivate and canActivateChild

export function roleGuard(requiredRole: string): CanActivateFn {
  return (route, state) => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    const user = auth.currentUser();
    if (!user) {
      // Not logged in at all → redirect to login
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    if (user.roles.includes(requiredRole)) {
      return true;  // ✅ has the required role
    }

    // Logged in but wrong role → redirect to forbidden page
    return router.createUrlTree(['/forbidden']);
  };
}

// Routes — clean, self-documenting declarations
const adminRoutes: Routes = [
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin').then(m => m.AdminComponent),
    canActivate: [roleGuard('admin')],
  },
  {
    path: 'reports',
    loadComponent: () => import('./reports/reports').then(m => m.ReportsComponent),
    canActivate: [roleGuard('admin'), roleGuard('analyst')],  // either role suffices?
    // CAUTION: both must pass — AND not OR. See common mistakes.
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings').then(m => m.SettingsComponent),
    canActivate: [roleGuard('admin')],
    canActivateChild: [roleGuard('admin')],  // protects all children automatically
    children: [
      { path: 'users',    loadComponent: () => import('./settings/users').then(m => m.UsersSettingsComponent) },
      { path: 'billing',  loadComponent: () => import('./settings/billing').then(m => m.BillingSettingsComponent) },
    ],
  },
];

// Reading role from route data (alternative — stateless guard)
export const routeDataRoleGuard: CanActivateFn = (route, state) => {
  const auth     = inject(AuthService);
  const router   = inject(Router);
  const required = route.data['role'] as string;  // from route definition

  if (auth.currentUser()?.roles.includes(required)) return true;
  return router.createUrlTree(['/forbidden']);
};

// Usage:
{ path: 'admin', component: AdminComponent, canActivate: [routeDataRoleGuard], data: { role: 'admin' } }`,
    },
    {
      label: 'Guard composition patterns',
      language: 'typescript',
      code: `// Composing multiple guards and testing them in isolation

// 1. Combine guards with a helper (OR logic — pass if any guard passes)
export function anyGuard(...guards: CanActivateFn[]): CanActivateFn {
  return (route, state) => {
    for (const guard of guards) {
      const result = guard(route, state);
      if (result === true || (result instanceof UrlTree)) return result;
    }
    return false;
  };
}

// 2. Redirect helper — used from multiple guards
function redirectToLogin(url: string): UrlTree {
  return inject(Router).createUrlTree(['/login'], {
    queryParams: { returnUrl: url },
  });
}

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() || redirectToLogin(state.url);
};

// 3. Async guard — waits for auth to initialise before deciding
export const authInitGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return auth.initialized$.pipe(
    filter(Boolean),
    take(1),
    map(() => auth.isLoggedIn() || router.createUrlTree(['/login']))
  );
};

// 4. Unit testing a functional guard — just call it like a function
describe('authGuard', () => {
  it('allows logged-in users', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isLoggedIn: () => true } },
      ],
    });
    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute, mockState)
    );
    expect(result).toBe(true);
  });

  it('redirects anonymous users to /login', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isLoggedIn: () => false } },
      ],
    });
    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute, { url: '/dashboard' } as RouterStateSnapshot)
    ) as UrlTree;
    expect(result.toString()).toContain('/login');
  });
});`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Class-based guard vs functional guard',
      language: 'typescript',
      before: `// Angular < 14 — class-based guards (deprecated)
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.authService.isLoggedIn()) return true;
    this.router.navigate(['/login']);
    return false;  // URL flicker!
  }
}

// Route
{ path: 'dashboard', canActivate: [AuthGuard] }`,
      after: `// Angular 14+ — functional guards (current standard)
export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return auth.isLoggedIn()
    || router.createUrlTree(['/login'], {  // no URL flicker
         queryParams: { returnUrl: state.url },
       });
};

// Route — identical usage
{ path: 'dashboard', canActivate: [authGuard] }`,
      note: 'Functional guards are simpler, testable in isolation with TestBed.runInInjectionContext(), and avoid the injectable boilerplate entirely.',
    },
    {
      title: 'Returning false vs UrlTree for redirects',
      language: 'typescript',
      before: `// Returning false — causes URL flicker in the browser address bar
export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);  // side-effect navigation
    return false;  // the browser briefly shows the blocked URL
  }
  return true;
};`,
      after: `// Returning UrlTree — atomic redirect, zero flicker
export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return auth.isLoggedIn()
    || router.createUrlTree(['/login'], {
         queryParams: { returnUrl: state.url },
       });
};
// Angular handles the UrlTree redirect atomically —
// the URL in the address bar goes straight to /login`,
      note: 'Always return a UrlTree for redirects. The dual router.navigate() + return false pattern is a well-known source of URL flicker bugs.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using class-based guards (deprecated since Angular 15)',
      wrong: `@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService) {}
  canActivate(): boolean { return this.auth.isLoggedIn(); }
}`,
      right: `export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn()
      || inject(Router).createUrlTree(['/login']);
};`,
      explanation: 'Class-based guards are deprecated since Angular 14 and generate warnings in Angular 15+. They will be removed in a future major version. Use functional guards with inject() instead.',
    },
    {
      title: 'Returning false instead of a UrlTree for redirects',
      wrong: `export const authGuard: CanActivateFn = (route, state) => {
  if (!inject(AuthService).isLoggedIn()) {
    inject(Router).navigate(['/login']);  // side effect
    return false;  // URL briefly shows /dashboard before redirecting
  }
  return true;
};`,
      right: `export const authGuard: CanActivateFn = (route, state) => {
  return inject(AuthService).isLoggedIn()
      || inject(Router).createUrlTree(['/login'], {
           queryParams: { returnUrl: state.url },
         });
};`,
      explanation: 'Calling router.navigate() then returning false triggers two separate navigation events, causing a visible URL flicker. Returning a UrlTree lets Angular handle the redirect atomically.',
    },
    {
      title: 'Using canActivate instead of canMatch for feature-flagging lazy routes',
      wrong: `// The lazy chunk is downloaded even for users without the flag!
{
  path: 'new-checkout',
  loadComponent: () => import('./checkout-v2').then(m => m.CheckoutV2),
  canActivate: [featureFlagGuard('checkout-v2')],  // chunk loads first
}`,
      right: `// canMatch prevents the chunk from downloading at all
{
  path: 'checkout',
  loadComponent: () => import('./checkout-v2').then(m => m.CheckoutV2),
  canMatch: [featureFlagGuard('checkout-v2-beta')],  // chunk never downloaded
},
{
  path: 'checkout',  // fallback — same path, tried if canMatch above fails
  loadComponent: () => import('./checkout').then(m => m.CheckoutComponent),
}`,
      explanation: 'canActivate fires after route matching — the lazy chunk has already been downloaded by the time the guard runs. canMatch prevents the chunk from loading for users who should not see the feature.',
    },
    {
      title: 'Multiple canActivate guards produce AND logic, not OR',
      wrong: `// Intention: allow users with EITHER admin OR editor role
{
  path: 'reports',
  canActivate: [roleGuard('admin'), roleGuard('editor')],  // WRONG
  // This requires BOTH roles — guard 1 AND guard 2 must pass
}`,
      right: `// For OR logic, compose inside a single guard
export function anyRoleGuard(roles: string[]): CanActivateFn {
  return (route, state) => {
    const auth = inject(AuthService);
    const user = auth.currentUser();
    if (user && roles.some(r => user.roles.includes(r))) return true;
    return inject(Router).createUrlTree(['/forbidden']);
  };
}
// Usage:
{ path: 'reports', canActivate: [anyRoleGuard(['admin', 'editor'])] }`,
      explanation: 'When multiple guards are in the array, ALL must return true — it is AND logic. Angular stops at the first failure. For OR logic, compose the conditions inside a single guard function.',
    },
    {
      title: 'Accessing canDeactivate state via a service instead of the component parameter',
      wrong: `// Leaking component state through a shared service — coupling and timing bugs
@Injectable({ providedIn: 'root' })
export class FormStateService { isDirty = signal(false); }

export const leakyGuard: CanDeactivateFn<unknown> = () => {
  const state = inject(FormStateService);
  return !state.isDirty() || confirm('Leave?');
};
// The component sets isDirty on the service — tight coupling, easy to forget to reset`,
      right: `// The component owns its dirty state; the guard reads it via the component parameter
export interface HasUnsavedChanges { hasUnsavedChanges(): boolean; }

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> =
  (component) => !component.hasUnsavedChanges() || confirm('Leave without saving?');

// Component — self-contained dirty tracking
export class EditUserComponent implements HasUnsavedChanges {
  isDirty = signal(false);
  hasUnsavedChanges() { return this.isDirty(); }
}`,
      explanation: 'The component parameter in CanDeactivateFn exists precisely to avoid shared-service coupling. The component owns its dirty state; the guard reads it. No service, no forgetting to reset, no timing bugs.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a role-based guard with return-URL redirect',
    language: 'typescript',
    description: `Implement two functional guards:
1. **authGuard** — redirects unauthenticated users to /login, preserving the intended URL as ?returnUrl=...
2. **roleGuard(role)** — factory guard that redirects users without the required role to /forbidden

Then wire them to a set of routes:
- /dashboard — requires authentication
- /admin — requires 'admin' role
- /reports — requires 'admin' OR 'analyst' role (use anyRoleGuard helper)

Bonus: implement the post-login redirect — after login, read the returnUrl query param and navigate there.`,
    hints: [
      'authGuard returns router.createUrlTree(["/login"], { queryParams: { returnUrl: state.url } })',
      'roleGuard is a factory: (role: string) => CanActivateFn returns a function that calls inject()',
      'For OR logic on reports, write anyRoleGuard(roles: string[]): CanActivateFn',
      'After login: inject(ActivatedRoute).snapshot.queryParams["returnUrl"] gets the saved URL',
      'Use router.navigateByUrl(returnUrl || "/dashboard") after successful login',
    ],
    starterCode: `import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot, Routes } from '@angular/router';
import { AuthService } from './auth.service';

// TODO: implement authGuard — redirect to /login with returnUrl
export const authGuard: CanActivateFn = (route, state) => {
  throw new Error('not implemented');
};

// TODO: implement roleGuard factory — redirect to /forbidden if role missing
export function roleGuard(role: string): CanActivateFn {
  throw new Error('not implemented');
}

// TODO: implement anyRoleGuard — pass if user has ANY of the given roles
export function anyRoleGuard(roles: string[]): CanActivateFn {
  throw new Error('not implemented');
}

// TODO: wire routes
export const appRoutes: Routes = [];

// Bonus: implement post-login redirect
// In LoginComponent.onLogin():
// const returnUrl = ...
// router.navigateByUrl(returnUrl || '/dashboard');`,
    solution: `import { inject } from '@angular/core';
import {
  ActivatedRoute, CanActivateFn, Router,
  RouterStateSnapshot, Routes
} from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn()
      || router.createUrlTree(['/login'], {
           queryParams: { returnUrl: state.url },
         });
};

export function roleGuard(requiredRole: string): CanActivateFn {
  return (route, state) => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    const user   = auth.currentUser();
    if (!user) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    return user.roles.includes(requiredRole)
        || router.createUrlTree(['/forbidden']);
  };
}

export function anyRoleGuard(roles: string[]): CanActivateFn {
  return (route, state) => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    const user   = auth.currentUser();
    if (!user) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    return roles.some(r => user.roles.includes(r))
        || router.createUrlTree(['/forbidden']);
  };
}

export const appRoutes: Routes = [
  { path: 'dashboard', loadComponent: () => import('./dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard] },
  { path: 'admin',     loadComponent: () => import('./admin').then(m => m.AdminComponent),
    canActivate: [roleGuard('admin')] },
  { path: 'reports',   loadComponent: () => import('./reports').then(m => m.ReportsComponent),
    canActivate: [anyRoleGuard(['admin', 'analyst'])] },
];

// LoginComponent.onLogin():
onLogin() {
  const returnUrl = inject(ActivatedRoute).snapshot.queryParams['returnUrl'] as string;
  // ... authenticate ...
  inject(Router).navigateByUrl(returnUrl || '/dashboard');
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the correct return type for a CanActivateFn to redirect the user?',
      options: [
        'Return false and call router.navigate() separately',
        'Return a UrlTree created with router.createUrlTree()',
        'Return a string containing the redirect URL',
        'Throw a RedirectException with the target URL',
      ],
      answer: 1,
      explanation: 'Returning a UrlTree is the correct way to redirect from a guard. Angular handles it atomically — no URL flicker, no separate navigation event. Calling router.navigate() + return false triggers two events and causes visible flicker.',
    },
    {
      q: 'What is the key difference between canActivate and canMatch for lazy routes?',
      options: [
        'canActivate runs before route matching; canMatch runs after',
        'canMatch prevents the lazy chunk from downloading; canActivate runs after the chunk loads',
        'They are identical — canMatch is just an alias for canActivate on lazy routes',
        'canMatch only works with loadChildren; canActivate works with both loadChildren and loadComponent',
      ],
      answer: 1,
      explanation: 'canMatch fires before Angular resolves the route definition. If it returns false, the lazy chunk is never requested and Angular tries the next route definition. canActivate fires after matching — the chunk is already loading by then.',
    },
    {
      q: 'How do you access services inside a functional CanActivateFn?',
      options: [
        'Pass them as extra parameters after RouterStateSnapshot',
        'Use inject() directly inside the function body',
        'Inject them in the route definition and pass as route.data',
        'Services cannot be used in functional guards',
      ],
      answer: 1,
      explanation: 'inject() works inside functional guards because Angular calls them within an injection context. This replaces constructor injection from class-based guards and produces the same result with much less code.',
    },
    {
      q: 'What does CanDeactivateFn receive as its first argument?',
      options: [
        'The ActivatedRouteSnapshot of the route being left',
        'The component instance currently rendered on the route',
        'The RouterStateSnapshot of the destination URL',
        'A boolean indicating if the user confirmed the navigation',
      ],
      answer: 1,
      explanation: 'The first parameter is the current component instance (type T in CanDeactivateFn<T>). This lets the guard read component state directly — isDirty, hasUnsavedChanges() — without needing a shared service.',
    },
    {
      q: 'You have canActivate: [guardA, guardB] on a route. What happens if guardA returns false?',
      options: [
        'guardB still runs — Angular collects all results and uses the first falsy one',
        'guardB is skipped — Angular stops at the first failing guard and blocks navigation',
        'Both guards run in parallel — Angular uses the slower result',
        'Angular throws an error because multiple guards are not allowed',
      ],
      answer: 1,
      explanation: 'Multiple guards in an array use AND logic and run in series. Angular stops at the first guard that returns false or a UrlTree. Subsequent guards in the array never execute. Order matters.',
    },
    {
      q: 'How do you test a functional guard in isolation?',
      options: [
        'You must mount a full router — functional guards cannot be tested in isolation',
        'Call the guard function directly inside TestBed.runInInjectionContext()',
        'Guards return promises — use async/await with TestBed.inject(GUARD_TOKEN)',
        'Use jasmine.createSpy() to mock the guard function directly',
      ],
      answer: 1,
      explanation: 'TestBed.runInInjectionContext(() => myGuard(mockRoute, mockState)) provides the injection context needed for inject() calls inside the guard. The guard is just a function — call it, check the return value.',
    },
    {
      q: 'Which guard type should you use to prevent downloading an admin lazy bundle for non-admin users?',
      options: [
        'canActivate — it runs before the route component renders',
        'canActivateChild — it runs for all children of the admin route',
        'canMatch — it prevents the route from matching entirely, so the chunk is never requested',
        'canDeactivate — it handles leaving the route cleanly',
      ],
      answer: 2,
      explanation: 'canMatch is the correct choice for security-sensitive lazy loading. canActivate fires after route matching which triggers the chunk download. canMatch fires before matching — if it returns false, Angular skips this route definition and the lazy chunk is never fetched.',
    },
    {
      q: 'A user navigates to /admin and your canActivate guard returns false. What happens to the browser URL?',
      options: [
        'Nothing — the URL stays on the previous page cleanly',
        'The URL briefly shows /admin then snaps back (URL flicker)',
        'The URL changes to /admin and stays there',
        'The browser back button is automatically triggered',
      ],
      answer: 1,
      explanation: 'Returning false from canActivate blocks navigation but the browser may briefly show the blocked URL before reverting — this is URL flicker. Returning a UrlTree instead of false performs an atomic redirect that avoids this.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use canMatch vs canActivate?',
      a: 'Use canMatch for feature flags and role-based lazy loading — it prevents the chunk from downloading entirely. Use canActivate for authentication and access control on already-matched routes. A practical rule: if you are gating a lazy route and want to fall through to a different route definition (or simply hide the feature), use canMatch. If you are guarding a route that should always exist but requires login or a specific role, use canActivate.',
    },
    {
      q: 'How do I preserve the return URL so the user goes back to their page after login?',
      a: 'In your auth guard, return router.createUrlTree([\'/login\'], { queryParams: { returnUrl: state.url } }). In your login component, after successful authentication, read the returnUrl: inject(ActivatedRoute).snapshot.queryParams[\'returnUrl\']. Then navigate: router.navigateByUrl(returnUrl || \'/dashboard\'). Be careful to validate the returnUrl before navigating — in a real app, check it starts with \'/\' to prevent open redirect attacks.',
    },
    {
      q: 'Can I use signals inside a guard?',
      a: 'Yes — signals are synchronous, and guards can return synchronous values. If inject(AuthService).isLoggedIn() returns a signal, call it: auth.isLoggedIn(). The result is a plain boolean, which the guard returns directly. This is actually cleaner than Observable-based guards since there is no need to pipe, map, or take(1).',
    },
    {
      q: 'What is the difference between canActivate and canActivateChild?',
      a: 'canActivate on a parent route runs only when the parent itself is navigated to. canActivateChild runs for every navigation to a child route of that parent — even if the parent is already active. Use canActivateChild when you want to protect an entire admin section: put the guard on the parent and it runs for /admin/users, /admin/settings, /admin/billing etc. without adding a guard to each child individually.',
    },
    {
      q: 'How do I implement a guard that waits for the auth state to initialise (e.g. on app startup)?',
      a: 'Return an Observable from the guard: auth.initialized$.pipe(filter(Boolean), take(1), map(() => auth.isLoggedIn() || router.createUrlTree([\'/login\']))). The filter(Boolean) waits for initialized$ to emit true (the auth check completed), take(1) completes after the first valid emission, and the map transforms it to the guard decision. Angular handles the observable subscription — the guard waits until the observable completes.',
    },
    {
      q: 'Can a canDeactivate guard show a custom dialog instead of window.confirm()?',
      a: 'Yes — return an Observable<boolean> from the guard. Inject a dialog service: inject(DialogService).open(config) and return the result observable directly. Angular subscribes to it and waits for the boolean emission. When the user clicks Confirm, the observable emits true and navigation proceeds. When they click Cancel, it emits false and navigation is blocked. The dialog component must emit a completion signal (complete() or take(1)) so the observable terminates.',
    },
    {
      q: 'Multiple guards are in my canActivate array — do they run in parallel or in series?',
      a: 'In series — Angular stops at the first guard that returns false or a UrlTree. Subsequent guards in the array do not run. This means order matters: put the cheapest check first (e.g. isLoggedIn()) before the more expensive role check, so unauthenticated requests short-circuit immediately. If you need OR logic (pass if any guard passes), compose inside a single guard function.',
    },
    {
      q: 'How do I unit test a functional guard?',
      a: 'Functional guards are just functions — call them in a TestBed injection context. Set up TestBed with provideRouter([]) and mock your services, then: const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState)). Check the return value: true means allowed, false means blocked, and a UrlTree means redirect (check result.toString() for the path). No component mounting, no Router testing utilities needed.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Route guards are <strong>plain functions</strong> registered on route definitions that return <code>boolean | UrlTree</code> to allow, block, or redirect navigation — with <code>inject()</code> replacing constructor injection.',
    mustKnow: [
      '<code>CanActivateFn</code> — enter guard. Return <strong>UrlTree</strong> (not false) for redirects to avoid URL flicker',
      '<code>CanDeactivateFn&lt;T&gt;</code> — leave guard. First param is the <strong>component instance</strong> — read isDirty directly',
      '<code>CanMatchFn</code> — fires before lazy chunk download. Returns false → route is skipped, chunk never loaded. Best for feature flags',
      '<code>canActivate: [guardA, guardB]</code> — AND logic, runs in series. First failure stops the chain',
      'Use <code>inject()</code> inside guard functions — provides the same DI as class constructors, with less code',
      'Preserve return URLs via <code>queryParams: { returnUrl: state.url }</code>; read in LoginComponent after auth',
    ],
    interviewFocus: [
      '<strong>canMatch vs canActivate?</strong> — canMatch fires before lazy chunk download (blocks the download); canActivate fires after matching (chunk may already be loading)',
      '<strong>Why UrlTree over false + navigate()?</strong> — UrlTree is atomic (no URL flicker); router.navigate() + false fires two navigation events',
      '<strong>canDeactivate first param?</strong> — the component instance. Read dirty state directly; no shared service needed',
      '<strong>Multiple guards AND or OR?</strong> — AND. All must return true. For OR logic, compose inside a single guard',
    ],
  };
}
