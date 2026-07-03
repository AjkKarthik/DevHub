import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-route-guards-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './route-guards.html',
  styleUrl: './route-guards.scss',
})
export class RouteGuardsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'CanActivateFn — a plain function, not a class',
      points: [
        'A functional guard is just a function with this signature: <code>(route, state) =&gt; boolean | UrlTree | Observable&lt;boolean&gt;</code>. There is no class to implement, no <code>CanActivate</code> interface — <code>inject()</code> is how it reaches any services it needs, since there is no constructor to inject into.',
        'Return <code>true</code> to allow navigation, <code>false</code> to silently block it, or a <code>UrlTree</code> to redirect somewhere else entirely.',
      ],
    },
    {
      heading: 'Redirect with a UrlTree, not router.navigate()',
      points: [
        '<code>router.parseUrl(\'/login\')</code> returns a <code>UrlTree</code> — returning it from the guard tells Angular\'s router to navigate there INSTEAD of the originally requested route, as one atomic operation with correct browser history.',
        'Calling <code>router.navigate([\'/login\'])</code> manually inside a guard and then returning <code>false</code> is a common mistake — it can trigger two competing navigations and cause history/URL bugs. Always prefer returning the <code>UrlTree</code> directly.',
      ],
    },
    {
      heading: 'Registering a guard on a route',
      points: [
        '<code>{ path: \'admin\', component: AdminComponent, canActivate: [authGuard] }</code> — <code>canActivate</code> takes an array, so multiple guards can run for one route; ALL of them must return <code>true</code> (or none redirect) for navigation to proceed.',
        'Angular 15+ also allows an inline guard function directly in the route config: <code>canActivate: [() =&gt; inject(AuthService).isLoggedIn()]</code> — useful for a one-off check that is not reused anywhere else.',
      ],
    },
    {
      heading: 'CanDeactivateFn — intercepting navigation AWAY from a page',
      points: [
        '<code>CanDeactivateFn&lt;T&gt;</code> runs when the user tries to LEAVE a route — its first parameter is the component INSTANCE itself, so the guard can inspect any of its state (e.g. <code>component.form.pristine</code>) to decide whether to allow leaving.',
        'The classic use: warn about unsaved changes. <code>(component) =&gt; component.form.pristine ? true : confirm(\'Leave? Changes will be lost.\')</code> — if the form is untouched, leave freely; otherwise ask.',
      ],
    },
    {
      heading: 'Guards that return an Observable must complete',
      points: [
        'If a guard returns an <code>Observable&lt;boolean&gt;</code>, Angular waits for its FIRST emission and then moves on — but only if the Observable actually emits and completes. An Observable that never emits (a stalled HTTP call, a Subject nobody ever calls <code>.next()</code> on) leaves navigation hanging forever with no error.',
        'Pipe with <code>take(1)</code> (or use an Observable that completes naturally, like an HTTP call) to guarantee the guard resolves one way or the other.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/auth.service.ts',
      content: `import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn = signal(false);
  readonly isLoggedIn = this.loggedIn.asReadonly();

  login()  { this.loggedIn.set(true); }
  logout() { this.loggedIn.set(false); }
}
`,
    },
    {
      path: 'src/app/auth.guard.ts',
      content: `import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // Return true to allow, or a UrlTree to redirect — never router.navigate() here
  return auth.isLoggedIn() ? true : router.parseUrl('/');
};
`,
    },
    {
      path: 'src/app/admin.ts',
      content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-admin',
  standalone: true,
  template: \`<h2>🔒 Admin area</h2><p>You only see this because authGuard let you in.</p>\`,
})
export class Admin {}
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
    <p>Logged in: {{ auth.isLoggedIn() }}</p>
    <button (click)="auth.login()">Log in</button>
    <button (click)="auth.logout()">Log out</button>
    <nav>
      <a routerLink="/">Home</a> |
      <a routerLink="/admin">Admin (guarded)</a>
    </nav>
    <router-outlet />
  \`,
})
export class App {
  auth = inject(AuthService);
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { App } from './app/app';
import { Admin } from './app/admin';
import { authGuard } from './app/auth.guard';
import { Component } from '@angular/core';

@Component({ selector: 'app-home', standalone: true, template: '<p>Home page — try Admin without logging in first.</p>' })
class Home {}

const routes: Routes = [
  { path: '', component: Home },
  { path: 'admin', component: Admin, canActivate: [authGuard] },
];

bootstrapApplication(App, { providers: [provideRouter(routes)] });
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Route guards</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a CanDeactivateFn guard on the Admin route that asks "Leave admin area?" via confirm() before allowing navigation away — for this exercise, just assume it always needs confirmation (no form to check).',
    hint: 'export const confirmLeaveGuard: CanDeactivateFn&lt;Admin&gt; = () => confirm(\'Leave admin area?\'); then add canDeactivate: [confirmLeaveGuard] to the admin route alongside canActivate.',
    solution: `// admin-leave.guard.ts
import { CanDeactivateFn } from '@angular/router';
import { Admin } from './admin';

export const confirmLeaveGuard: CanDeactivateFn<Admin> = () =>
  confirm('Leave admin area?');

// In the route config:
{ path: 'admin', component: Admin, canActivate: [authGuard], canDeactivate: [confirmLeaveGuard] }`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'inside a guard, the right way to redirect is to call router.navigate() and then return false.',
      reality: 'the correct pattern is to return a <code>UrlTree</code> directly (from <code>router.parseUrl(...)</code>) — Angular treats it as one atomic navigation. Calling <code>router.navigate()</code> manually inside a guard and then returning <code>false</code> can trigger competing navigations and inconsistent browser history.',
    },
    {
      thought: 'CanDeactivateFn guards run on the route you are navigating TO, same as CanActivateFn.',
      reality: 'CanDeactivateFn runs on the route you are navigating AWAY FROM — it receives that outgoing component\'s instance as its first argument, so it can inspect that component\'s own state (like an unsaved form) before allowing the user to leave.',
    },
    {
      thought: 'a guard returning an Observable is safe by default — Angular will time out and proceed eventually if it never emits.',
      reality: 'there is no built-in timeout — an Observable that never emits or completes leaves navigation hanging indefinitely with no error shown to the user. Always ensure the Observable emits and completes (e.g. pipe with take(1)).',
    },
  ];
}
