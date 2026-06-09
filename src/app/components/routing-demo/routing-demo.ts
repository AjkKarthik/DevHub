import { Component, signal, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CodeBlockComponent, CodeTab } from '../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../shared/version-badge/version-badge';
import { PageMetaComponent } from '../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../shared/page-complete/page-complete';

@Component({
  selector: 'app-routing-demo',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './routing-demo.html',
  styleUrl: './routing-demo.scss',
})
export class RoutingDemo {
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  // Query param demo
  currentPage   = signal(1);
  currentFilter = signal('all');

  // Simulated route params
  selectedProduct = signal<{ id: string; name: string } | null>(null);
  products = [
    { id: 'p1', name: 'Angular Pro Course' },
    { id: 'p2', name: 'TypeScript Mastery' },
    { id: 'p3', name: 'RxJS Deep Dive' },
  ];

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  navigateWithQuery() {
    this.router.navigate(['/routing'], {
      queryParams: { page: this.currentPage(), filter: this.currentFilter() },
      queryParamsHandling: 'merge',
    });
  }

  openProduct(id: string) {
    this.selectedProduct.set(this.products.find(p => p.id === id) ?? null);
  }

  appRoutes = [
    { path: '/',           desc: 'Home page',            guard: false, lazy: true },
    { path: '/counter',    desc: 'Signals & Computed',   guard: false, lazy: true },
    { path: '/http',       desc: 'HTTP Client + toSignal', guard: false, lazy: true },
    { path: '/parent-child', desc: 'input() / output() signals', guard: false, lazy: true },
    { path: '/todo',       desc: 'Todo (AuthGuard protected)', guard: true, lazy: true },
    { path: '/forms',      desc: 'Reactive & Template forms', guard: false, lazy: true },
    { path: '/form-array', desc: 'FormArray dynamic fields', guard: false, lazy: true },
    { path: '/defer',      desc: '@defer lazy rendering',  guard: false, lazy: true },
    { path: '/store',      desc: 'Signal Store pattern',  guard: false, lazy: true },
    { path: '/material',   desc: 'Angular Material',      guard: false, lazy: true },
    { path: '/templates',  desc: 'Template Syntax',       guard: false, lazy: true },
    { path: '/directives', desc: 'NgClass/NgStyle/Custom', guard: false, lazy: true },
    { path: '/lifecycle',  desc: 'Lifecycle Hooks',       guard: false, lazy: true },
    { path: '/pipes',      desc: 'Built-in & custom pipes', guard: false, lazy: true },
    { path: '/di',         desc: 'Dependency Injection',  guard: false, lazy: true },
    { path: '/routing',    desc: 'This page — Routing',   guard: false, lazy: true },
    { path: '/charts',     desc: 'Chart.js visualizations', guard: false, lazy: true },
    { path: '/zod-forms',  desc: 'Zod schema validation + forms', guard: false, lazy: true },
  ];

  theory: TheoryPoint[] = [
  {
    heading: 'Router fundamentals',
    points: [
      'The router matches the current URL to the <code>routes</code> array in order — first match wins.',
      '<code>loadComponent: () => import(\'...\').then(m => m.MyComponent)</code>: lazy-loads the component chunk on navigation.',
      '<code>&lt;router-outlet /&gt;</code>: the placeholder where the matched component is rendered.',
      '<code>routerLink</code>: generates an <code>href</code> and intercepts the click to navigate without a full page reload.',
    ],
  },
  {
    heading: 'Route parameters',
    points: [
      'Define path params with a colon: <code>{ path: \'users/:id\', ... }</code>.',
      'Read with <code>inject(ActivatedRoute).snapshot.paramMap.get(\'id\')</code> or reactively with <code>paramMap</code> observable.',
      'Query params (<code>?sort=asc&page=2</code>): read via <code>snapshot.queryParamMap</code> or the <code>queryParamMap</code> observable.',
      'Navigate with params: <code>router.navigate([\'/users\', id], { queryParams: { tab: \'profile\' } })</code>.',
    ],
  },
  {
    heading: 'Guards & resolvers',
    points: [
      '<code>CanActivateFn</code>: a function returning <code>boolean | UrlTree</code>. Return a <code>UrlTree</code> to redirect.',
      'Functional guards with <code>inject()</code> are simpler than class-based guards and are tree-shakeable.',
      'Resolvers pre-fetch data before the route activates — inject the resolved data via <code>ActivatedRoute.data</code>.',
      '<code>CanDeactivateFn</code>: prompt the user before navigating away from a dirty form.',
    ],
  },
  {
    heading: 'Key points to remember',
    points: [
      'Put the wildcard route <code>{ path: \'**\', redirectTo: \'\' }</code> last — it matches everything.',
      '<code>RouterLinkActive</code> adds a CSS class when the linked route is active. Use <code>[routerLinkActiveOptions]="{ exact: true }"</code> for the home route.',
      'Child routes share the parent\'s <code>&lt;router-outlet /&gt;</code> — nest outlets for complex layouts.',
      'Use <code>withComponentInputBinding()</code> in <code>provideRouter(routes, ...)</code> to bind route params directly to component <code>input()</code>.',
    ],
  },
];

  qna: QnaItem[] = [
    { q: 'What is the difference between routerLink and router.navigate()?', a: '<code>routerLink</code> is declarative — use it in templates. <code>router.navigate()</code> is imperative — use it in component logic (after form submit, redirect after auth). Both support relative and absolute paths.' },
    { q: 'How do you access route params in a component?', a: 'Three ways: (1) <code>inject(ActivatedRoute).snapshot.paramMap.get(\'id\')</code> — one-time read. (2) <code>inject(ActivatedRoute).paramMap.pipe(map(p => p.get(\'id\')))</code> — reactive. (3) <code>input()</code> with <code>withComponentInputBinding()</code> — cleanest.' },
    { q: 'What is a CanActivateFn?', a: 'A plain function that returns <code>boolean | UrlTree | Observable&lt;boolean&gt;</code>. Return <code>false</code> to block navigation, a <code>UrlTree</code> to redirect. Registered with <code>canActivate: [myGuard]</code> in the route definition.' },
    { q: 'How does lazy loading work?', a: '<code>loadComponent: () => import(\'./my/component\').then(m => m.MyComponent)</code> — Angular code-splits the component into a separate JS chunk that only downloads when the route is first visited.' },
    { q: 'What is the difference between params and queryParams?', a: 'Route params (<code>/users/:id</code>) are part of the path — required. Query params (<code>/users?sort=asc</code>) are optional key-value pairs. Access query params with <code>ActivatedRoute.queryParamMap</code> or as an input with <code>withComponentInputBinding()</code>.' },
    { q: 'How do you navigate and pass query params programmatically?', a: '<code>router.navigate([\'/users\'], { queryParams: { sort: \'asc\', page: 2 } })</code>. To preserve existing params add <code>queryParamsHandling: \'merge\'</code>.' },
  ];

  tabs: CodeTab[] = [
    {
      label: 'Routes setup',
      language: 'typescript',
      code: `// app.routes.ts
export const routes: Routes = [
  // Static route
  { path: '', component: HomeComponent },

  // Route with parameter
  { path: 'products/:id', component: ProductDetailComponent },

  // Lazy loaded (code split at build time)
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard').then(m => m.DashboardComponent),
  },

  // Route guard
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./admin/admin').then(m => m.AdminComponent),
  },

  // Child routes
  {
    path: 'shop',
    component: ShopComponent,
    children: [
      { path: '', component: ShopListComponent },
      { path: ':id', component: ShopDetailComponent },
    ],
  },

  // Wildcard / 404
  { path: '**', component: NotFoundComponent },
];`,
    },
    {
      label: 'Router navigation',
      language: 'typescript',
      code: `import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

export class MyComponent {
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  // Programmatic navigation
  goHome()          { this.router.navigate(['/']); }
  goToProduct(id: string) { this.router.navigate(['/products', id]); }

  // Navigate with query params
  search(q: string) {
    this.router.navigate(['/search'], {
      queryParams: { q, page: 1 },
      queryParamsHandling: 'merge',  // keep existing params
    });
  }

  // Read route param reactively (signal)
  productId = toSignal(this.route.paramMap.pipe(
    map(p => p.get('id') ?? '')
  ));

  // Read query param reactively
  pageNum = toSignal(this.route.queryParamMap.pipe(
    map(p => Number(p.get('page') ?? 1))
  ));
}`,
    },
    {
      label: 'Route guard (functional)',
      language: 'typescript',
      code: `// src/app/guards/auth.guard.ts
import { inject }         from '@angular/core';
import { Router }         from '@angular/router';
import { CanActivateFn }  from '@angular/router';
import { AuthService }    from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;                   // allow access
  }

  // Preserve the intended URL so you can redirect back after login
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

// In routes:
// { path: 'dashboard', canActivate: [authGuard], loadComponent: ... }`,
    },
    {
      label: 'withComponentInputBinding',
      language: 'typescript',
      code: `// withComponentInputBinding() — route params flow directly into input() signals
// No need to inject ActivatedRoute at all!

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
  ],
};

// app.routes.ts
{
  path: 'products/:id',
  component: ProductDetailComponent,
  resolve: { product: productResolver },
}

// product-detail.component.ts
export class ProductDetailComponent {
  // Route param ':id' maps directly to this input
  id = input.required<string>();

  // Resolved data from productResolver maps to 'product' input
  product = input<Product>();

  // Query param '?tab=reviews' maps to 'tab' input
  tab = input<string>();
}

// Before withComponentInputBinding(), you had to:
// this.route.paramMap.pipe(map(p => p.get('id'))).subscribe(...)`,
    },
    {
      label: 'RouterLink (template)',
      language: 'html',
      code: `<!-- Static link -->
<a routerLink="/products">All Products</a>

<!-- Dynamic link with param -->
<a [routerLink]="['/products', product.id]">{{ product.name }}</a>

<!-- With query params -->
<a [routerLink]="['/search']" [queryParams]="{ q: 'angular', page: 1 }">
  Search Angular
</a>

<!-- Active class — highlighted when route matches -->
<a routerLink="/home" routerLinkActive="active-link">Home</a>

<!-- Exact match — only active on exactly this path, not children -->
<a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
  Home
</a>

<!-- router-outlet — where child components render -->
<router-outlet />`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What does loadComponent() do in Angular routes?', options: ['Preloads all routes eagerly', 'Lazy loads a component only when its route is activated', 'Registers a component globally', 'Creates a new module'], answer: 1, explanation: 'loadComponent() uses dynamic import() so the component bundle is only downloaded when the user navigates to that route — reducing initial bundle size.' },
    { q: 'Which hook does Angular Router call before activating a route?', options: ['canLoad', 'canActivate', 'resolve', 'canMatch'], answer: 1, explanation: 'canActivate guards run before a route is activated. They return true/false or a UrlTree to redirect.' },
    { q: 'How do you read a route param as a signal?', options: ['inject(ActivatedRoute).params', 'inject(ActivatedRoute).snapshot.paramMap.get()', 'toSignal(inject(ActivatedRoute).paramMap.pipe(map(p => p.get(\'id\'))))', 'All of the above'], answer: 2, explanation: 'The cleanest signal approach: toSignal(route.paramMap.pipe(map(p => p.get(\'id\')))) — reacts to param changes without subscribing manually.' },
    { q: 'What does queryParamsHandling: \'merge\' do?', options: ['Replaces all existing query params', 'Merges new params with existing ones', 'Encodes query params', 'Strips query params on navigation'], answer: 1, explanation: 'merge keeps existing query params and adds/overwrites only the ones you specify. Use preserve to keep all params unchanged.' },
    { q: 'Where does the active route component render?', options: ['<ng-content>', '<app-root>', '<router-outlet>', '<ng-template>'], answer: 2, explanation: '<router-outlet> is the placeholder Angular replaces with the component matched by the current route.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'Router', type: 'class', desc: 'The main service for imperative navigation; inject it and call navigate() or navigateByUrl().' , since: '2'},
    { name: 'ActivatedRoute', type: 'class', desc: 'Provides access to the current route\'s params, query params, data, and URL segments as observables or snapshot.' , since: '2'},
    { name: 'routerLink', type: 'directive', desc: 'Declarative navigation directive for anchor and button elements; generates an href and intercepts clicks for SPA navigation.' , since: '2'},
    { name: 'RouterLinkActive', type: 'directive', desc: 'Adds a CSS class to the host element when the linked route is active; supports exact matching via routerLinkActiveOptions.' , since: '2'},
    { name: 'router-outlet', type: 'directive', desc: 'Placeholder element where the matched route component is rendered by the Angular router.' , since: '2'},
    { name: 'CanActivateFn', type: 'interface', desc: 'Functional guard type — a plain function returning boolean | UrlTree | Observable<boolean> that runs before a route activates.' , since: '14'},
    { name: 'loadComponent', type: 'function', desc: 'Route property that accepts a dynamic import() returning a standalone component, enabling lazy loading with automatic code splitting.' , since: '14'},
    { name: 'withComponentInputBinding', type: 'function', desc: 'Router feature that automatically binds route params, query params, and resolved data directly to component input() signals.' , since: '16'},
    { name: 'provideRouter', type: 'function', desc: 'Standalone API to configure the Angular router with routes and optional feature functions instead of RouterModule.forRoot().' , since: '14'},
    { name: 'toSignal', type: 'function', desc: 'Converts an Observable (e.g. route.paramMap) into a readonly signal so route params integrate cleanly with signal-based components.' , since: '16'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Reading route params: ActivatedRoute subscription vs input() with withComponentInputBinding()', before: '// Old: inject ActivatedRoute and subscribe manually\nexport class ProductDetailComponent implements OnInit {\n  id: string = \'\';\n  ngOnInit() {\n    inject(ActivatedRoute).paramMap\n      .pipe(map(p => p.get(\'id\') ?? \'\'))\n      .subscribe(id => (this.id = id));\n  }\n}', after: '// New: route param flows directly into an input() signal\nexport class ProductDetailComponent {\n  id = input.required<string>();  // populated by withComponentInputBinding()\n}',
      note: 'Requires provideRouter(routes, withComponentInputBinding()) in app.config.ts' },
    { title: 'Route guards: class-based CanActivate vs functional CanActivateFn', before: '// Old: class-based guard with implements CanActivate\n@Injectable({ providedIn: \'root\' })\nexport class AuthGuard implements CanActivate {\n  canActivate(): boolean {\n    return inject(AuthService).isLoggedIn();\n  }\n}', after: '// New: plain function guard — no class, no decorator\nexport const authGuard: CanActivateFn = () => {\n  const auth   = inject(AuthService);\n  const router = inject(Router);\n  return auth.isLoggedIn() || router.createUrlTree([\'/login\']);\n};',
      note: 'Functional guards are tree-shakeable and can use inject() directly' },
    { title: 'Router setup: RouterModule.forRoot() vs provideRouter()', before: '// Old: NgModule-based setup\n@NgModule({\n  imports: [RouterModule.forRoot(routes)],\n  exports: [RouterModule],\n})\nexport class AppRoutingModule {}', after: '// New: standalone app.config.ts\nexport const appConfig: ApplicationConfig = {\n  providers: [\n    provideRouter(routes, withComponentInputBinding()),\n  ],\n};',
      note: 'provideRouter() is the modern standalone API; no NgModule required' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Wildcard route placed before specific routes', wrong: 'export const routes: Routes = [\n  { path: \'**\', redirectTo: \'\' },\n  { path: \'products/:id\', component: ProductDetailComponent },\n];', right: 'export const routes: Routes = [\n  { path: \'products/:id\', component: ProductDetailComponent },\n  { path: \'**\', redirectTo: \'\' },  // always last\n];', explanation: 'The router matches routes top-to-bottom; a wildcard placed first swallows every URL before specific routes are ever evaluated.'  },
    { title: 'Using routerLinkActiveOptions without exact:true on the home route', wrong: '<!-- Active on \'/\' AND \'/products\', \'/admin\', etc. -->\n<a routerLink=\'/\' routerLinkActive=\'active\'>Home</a>', right: '<a routerLink=\'/\'\n   routerLinkActive=\'active\'\n   [routerLinkActiveOptions]=\'{ exact: true }\'>Home</a>', explanation: 'Without exact:true, RouterLinkActive marks the home route as active for every URL because every path starts with \'/\'.'  },
    { title: 'Forgetting queryParamsHandling: \'merge\' and wiping existing params', wrong: '// Navigates to /search?q=angular — drops \'page\' param\nthis.router.navigate([\'/search\'], {\n  queryParams: { q: \'angular\' },\n});', right: '// Keeps \'page\' and other existing params\nthis.router.navigate([\'/search\'], {\n  queryParams: { q: \'angular\' },\n  queryParamsHandling: \'merge\',\n});', explanation: 'Without \'merge\', every navigation replaces all query params, losing any params not explicitly re-specified.'  },
    { title: 'Using snapshot.paramMap inside a reused route without a reactive subscription', wrong: '// Only reads once — misses changes when navigating p1 -> p2\nconst id = inject(ActivatedRoute).snapshot.paramMap.get(\'id\');', right: '// Reacts to every param change\nproductId = toSignal(\n  inject(ActivatedRoute).paramMap.pipe(map(p => p.get(\'id\') ?? \'\'))\n);', explanation: 'snapshot is a one-time read; when Angular reuses the same component instance for different param values, snapshot does not update.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: 'Angular 14', label: 'Standalone routing & functional guards', features: ['provideRouter() replaces RouterModule.forRoot() for standalone apps', 'loadComponent() enables component-level lazy loading without NgModules', 'CanActivateFn and other functional guard types introduced'] },
    { version: 'Angular 16', label: 'withComponentInputBinding & signal interop', features: ['withComponentInputBinding() maps route/query params directly to input() signals', 'toSignal() in @angular/core/rxjs-interop makes reactive route params signal-friendly', 'Resolver data also flows into inputs automatically when binding is enabled'] },
  ];

  challenge: Challenge = {
    title: 'Lazy Route with Guard',
    description: 'Write an Angular route configuration with a lazy-loaded ProductDetailComponent and a canActivate guard that checks if the user is authenticated.',
    language: 'typescript',
    hints: [
      'Use loadComponent: () => import(...).then(m => m.ProductDetailComponent)',
      'A guard is a function that returns boolean | UrlTree',
      'Use inject(AuthService) inside the guard function',
      'Return router.createUrlTree([\'/login\']) to redirect'
    ],
    starterCode: `import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

function authGuard() {
  // TODO: check auth and redirect to /login if not authenticated
}

export const routes: Routes = [
  {
    path: 'products/:id',
    // TODO: lazy load ProductDetailComponent
    // TODO: add authGuard
  },
];`,
    solution: `import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

function authGuard() {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() || router.createUrlTree(['/login']);
}

export const routes: Routes = [
  {
    path: 'products/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./product-detail/product-detail')
        .then(m => m.ProductDetailComponent),
  },
];`,
  };
}
