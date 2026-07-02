import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-canactivatechild-for-nested-admin-sections-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './canactivatechild-for-nested-admin-sections.html',
  styleUrl: './canactivatechild-for-nested-admin-sections.scss',
})
export class CanactivatechildForNestedAdminSectionsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'One guard, an entire section — not one guard per child route',
      points: [
        'The main topic mentions <code>canActivateChild</code> in passing — this subtopic builds it out fully. Placed on a PARENT route, a single <code>canActivateChild</code> guard runs for EVERY navigation to any of that parent\'s children, at any nesting depth, without adding <code>canActivate</code> to each child individually.',
        'This matters for admin sections with many routes (<code>/admin/users</code>, <code>/admin/billing</code>, <code>/admin/settings/roles</code>) — one guard declaration on <code>/admin</code> protects the whole subtree, and adding a new child route later automatically inherits the protection with zero extra guard wiring.',
      ],
    },
    {
      heading: 'canActivateChild runs even when the parent is already active',
      points: [
        'Unlike <code>canActivate</code> on the parent (which only runs when NAVIGATING TO the parent itself), <code>canActivateChild</code> re-runs on every child-to-child navigation within the section — moving from <code>/admin/users</code> to <code>/admin/billing</code> re-triggers it, even though <code>/admin</code> itself was never re-entered.',
        'This is important for role checks that can change mid-session (e.g. a role downgrade via a websocket push) — a guard that only ran once on entering <code>/admin</code> would miss a role change until the user left and re-entered the section; <code>canActivateChild</code> catches it on the very next in-section navigation.',
      ],
    },
    {
      heading: 'The SAME function type works for both canActivate and canActivateChild',
      points: [
        'A <code>CanActivateFn</code> can be registered under either <code>canActivate</code> or <code>canActivateChild</code> — there is no separate <code>CanActivateChildFn</code> type distinct in shape from <code>CanActivateFn</code> (Angular type-aliases <code>CanActivateChildFn</code> to the same signature). This means a single <code>roleGuard(\'admin\')</code> factory guard, already built for <code>canActivate</code> on individual routes elsewhere in the app, can be reused verbatim as the section-wide <code>canActivateChild</code> guard.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/role.guard.ts',
      content: `import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export function roleGuard(requiredRole: string): CanActivateFn {
  return (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const user = auth.currentUser();
    if (!user) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }
    return user.roles.includes(requiredRole)
      ? true
      : router.createUrlTree(['/forbidden']);
  };
}
`,
    },
    {
      path: 'src/app/auth.service.ts',
      content: `import { Injectable, signal } from '@angular/core';

interface User { name: string; roles: string[]; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Pre-seeded as an admin for this demo — flip roles to see canActivateChild block access
  private _user = signal<User | null>({ name: 'Alice', roles: ['admin'] });
  readonly currentUser = this._user.asReadonly();

  setRoles(roles: string[]) {
    this._user.set({ name: 'Alice', roles });
  }
}
`,
    },
    {
      path: 'src/app/admin.routes.ts',
      content: `import { Routes } from '@angular/router';
import { roleGuard } from './role.guard';

// A single canActivateChild guard protects EVERY child below /admin —
// users, billing, and settings/roles all inherit it with zero extra wiring.
export const adminRoutes: Routes = [
  {
    path: '',
    canActivateChild: [roleGuard('admin')],
    children: [
      { path: 'users',           loadComponent: () => import('./pages/admin-users').then(m => m.AdminUsersComponent) },
      { path: 'billing',         loadComponent: () => import('./pages/admin-billing').then(m => m.AdminBillingComponent) },
      { path: 'settings/roles',  loadComponent: () => import('./pages/admin-roles').then(m => m.AdminRolesComponent) },
    ],
  },
];
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: \`
    <nav>
      <a routerLink="/admin/users">Users</a> |
      <a routerLink="/admin/billing">Billing</a> |
      <a routerLink="/admin/settings/roles">Roles</a>
      <button (click)="downgrade()">Downgrade to non-admin</button>
    </nav>
    <p>Try navigating between admin child routes, then click "Downgrade" and navigate
    again — canActivateChild re-runs on the very next in-section navigation and blocks it,
    without ever leaving /admin.</p>
    <router-outlet />
  \`,
})
export class App {
  private auth = inject(AuthService);

  downgrade() {
    this.auth.setRoles(['user']);
  }
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { App } from './app/app';
import { adminRoutes } from './app/admin.routes';

bootstrapApplication(App, {
  providers: [
    provideRouter([
      { path: 'admin', children: adminRoutes },
      { path: 'login', loadComponent: () => import('./app/pages/login').then(m => m.LoginComponent) },
      { path: 'forbidden', loadComponent: () => import('./app/pages/forbidden').then(m => m.ForbiddenComponent) },
    ]),
  ],
});
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>canActivateChild for nested admin sections</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a fourth admin child route, "audit-log", and confirm it is protected by the existing canActivateChild guard without any new guard registration.',
    hint: 'Just add { path: \'audit-log\', loadComponent: ... } to the children array inside adminRoutes — the canActivateChild guard on the parent already covers it.',
    solution: `export const adminRoutes: Routes = [
  {
    path: '',
    canActivateChild: [roleGuard('admin')],
    children: [
      { path: 'users',           loadComponent: () => import('./pages/admin-users').then(m => m.AdminUsersComponent) },
      { path: 'billing',         loadComponent: () => import('./pages/admin-billing').then(m => m.AdminBillingComponent) },
      { path: 'settings/roles',  loadComponent: () => import('./pages/admin-roles').then(m => m.AdminRolesComponent) },
      { path: 'audit-log',       loadComponent: () => import('./pages/admin-audit-log').then(m => m.AdminAuditLogComponent) },
    ],
  },
];`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'canActivateChild only runs once, when the user first enters the parent section.',
      reality: 'canActivateChild re-runs on EVERY navigation between children within the section — moving from one child route to another re-triggers it, even without leaving and re-entering the parent.',
    },
    {
      thought: 'canActivateChild needs its own dedicated function type, different in shape from CanActivateFn.',
      reality: 'a CanActivateFn can be registered directly under canActivateChild — the same guard function (like a reusable roleGuard factory) works for both without any adaptation.',
    },
    {
      thought: 'to protect a whole admin section, you must add canActivate individually to every child route.',
      reality: 'a single canActivateChild guard on the PARENT route protects every current and future child automatically — no per-child guard registration needed.',
    },
  ];
}
