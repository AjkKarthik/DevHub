import { Component, signal, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-routing-demo',
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './routing-demo.html',
  styleUrl: './routing-demo.scss',
})
export class RoutingDemo {
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  currentPage   = signal(1);
  currentFilter = signal('all');
  selectedProduct = signal<{ id: string; name: string } | null>(null);

  products = [
    { id: 'p1', name: 'Angular Pro Course' },
    { id: 'p2', name: 'TypeScript Mastery' },
    { id: 'p3', name: 'RxJS Deep Dive' },
  ];

  navigateTo(path: string) { this.router.navigate([path]); }

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
    { path: '/',             desc: 'Home page',                 guard: false, lazy: true },
    { path: '/counter',      desc: 'Signals & Computed',        guard: false, lazy: true },
    { path: '/http',         desc: 'HTTP Client + toSignal',    guard: false, lazy: true },
    { path: '/parent-child', desc: 'input() / output() signals', guard: false, lazy: true },
    { path: '/todo',         desc: 'Todo (AuthGuard protected)', guard: true,  lazy: true },
    { path: '/forms',        desc: 'Reactive & Template forms', guard: false, lazy: true },
    { path: '/form-array',   desc: 'FormArray dynamic fields',  guard: false, lazy: true },
    { path: '/store',        desc: 'Signal Store pattern',      guard: false, lazy: true },
    { path: '/templates',    desc: 'Template Syntax',           guard: false, lazy: true },
    { path: '/directives',   desc: 'NgClass/NgStyle/Custom',    guard: false, lazy: true },
    { path: '/lifecycle',    desc: 'Lifecycle Hooks',           guard: false, lazy: true },
    { path: '/pipes',        desc: 'Built-in & custom pipes',   guard: false, lazy: true },
    { path: '/di',           desc: 'Dependency Injection',      guard: false, lazy: true },
    { path: '/routing',      desc: 'This page — Routing',       guard: false, lazy: true },
    { path: '/charts',       desc: 'Chart.js visualizations',   guard: false, lazy: true },
  ];

  prerequisites: Prerequisite[] = [
    { label: 'Dependency Injection', route: '/angular/di-demo' },
    { label: 'Component Lifecycle', route: '/angular/lifecycle' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'Router', type: 'class', desc: 'Main service for imperative navigation; inject it and call navigate() or navigateByUrl().', since: '2' },
    { name: 'ActivatedRoute', type: 'class', desc: 'Provides access to the current route\'s params, query params, data, and URL segments as observables or snapshot.', since: '2' },
    { name: 'routerLink', type: 'directive', desc: 'Declarative navigation directive for anchor elements; generates an href and intercepts clicks for SPA navigation.', since: '2' },
    { name: 'RouterLinkActive', type: 'directive', desc: 'Adds a CSS class when the linked route is active; supports exact matching via routerLinkActiveOptions.', since: '2' },
    { name: 'router-outlet', type: 'directive', desc: 'Placeholder element where the matched route component is inserted by the router.', since: '2' },
    { name: 'CanActivateFn', type: 'interface', desc: 'Functional guard type — a plain function returning boolean | UrlTree | Observable<boolean> before a route activates.', since: '14' },
    { name: 'CanDeactivateFn', type: 'interface', desc: 'Guard that runs when navigating away; return false or prompt the user to prevent leaving a dirty form.', since: '14' },
    { name: 'CanMatchFn', type: 'interface', desc: 'Guard that prevents a route from even being matched (unlike canActivate which allows matching but blocks activation).', since: '15' },
    { name: 'loadComponent', type: 'function', desc: 'Route property accepting a dynamic import() returning a standalone component — enables lazy loading with code splitting.', since: '14' },
    { name: 'withComponentInputBinding', type: 'function', desc: 'Router feature that automatically binds route params, query params, and resolved data to component input() signals.', since: '16' },
    { name: 'provideRouter', type: 'function', desc: 'Standalone API to configure the Angular router with routes and optional feature functions instead of RouterModule.forRoot().', since: '14' },
    { name: 'toSignal', type: 'function', desc: 'Converts an Observable (e.g. route.paramMap) into a readonly signal so route params integrate with signal-based components.', since: '16' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Router fundamentals — routes, outlets, and navigation',
      points: [
        'The router matches the current URL against a <code>routes: Routes</code> array in <strong>order — first match wins</strong>. Each route maps a path pattern to a component, a redirect, or a lazy-loaded chunk. Angular compares path segments left-to-right, stopping at the first route whose pattern satisfies the current URL.',
        '<code>&lt;router-outlet /&gt;</code> is the placeholder element in the template where the matched component is rendered. A top-level outlet renders the primary route; nested outlets render child routes. Adding a second unnamed outlet creates an auxiliary (named) outlet for side panels or modals.',
        '<code>routerLink</code> turns any element into a navigation link without triggering a full page reload. Use <code>[routerLink]="[\'/products\', id]"</code> for dynamic paths. For programmatic navigation, inject <code>Router</code> and call <code>router.navigate([\'/path\'])</code> or <code>router.navigateByUrl(\'/path\')</code>.',
        '<code>provideRouter(routes)</code> replaces the old <code>RouterModule.forRoot(routes)</code> for standalone applications. Pass feature functions as additional arguments: <code>provideRouter(routes, withComponentInputBinding(), withPreloading(PreloadAllModules))</code>. This is tree-shakeable — only the features you use are included.',
        'The wildcard route <code>{ path: \'**\', component: NotFoundComponent }</code> (or <code>redirectTo</code>) must always be the <strong>last entry</strong> in the routes array. Because matching is first-match, placing the wildcard earlier would prevent all subsequent routes from ever matching.',
      ],
    },
    {
      heading: 'Route parameters, query params, and input binding',
      points: [
        'Define path parameters with a colon: <code>{ path: \'products/:id\', ... }</code>. The <code>:id</code> segment matches any non-slash string in that position. Multiple params are allowed: <code>\'orders/:orderId/items/:itemId\'</code>. Use <code>:id?</code> syntax for optional segments (Angular 16.2+).',
        'Read route params reactively: <code>toSignal(inject(ActivatedRoute).paramMap.pipe(map(p => p.get(\'id\') ?? \'\')))</code>. The <code>paramMap</code> Observable emits when the user navigates from one param value to another while the route stays the same component (e.g., product 1 → product 2). <code>snapshot.paramMap.get(\'id\')</code> only reads once and misses re-navigation.',
        'Query parameters live after the <code>?</code> and are optional: <code>/search?q=angular&page=2</code>. Read with <code>ActivatedRoute.queryParamMap</code>. Navigate with: <code>router.navigate([\'/search\'], { queryParams: { q: \'angular\' }, queryParamsHandling: \'merge\' })</code>. Use <code>\'merge\'</code> to preserve existing params; use <code>\'preserve\'</code> to keep all params unchanged.',
        '<code>withComponentInputBinding()</code> (Angular 16+) is the cleanest approach: route params, query params, and resolver data flow directly into the component\'s <code>input()</code> signals by matching name. A route param named <code>:id</code> maps to <code>id = input.required&lt;string&gt;()</code>. No <code>ActivatedRoute</code> injection needed in the component at all.',
        'Resolved route data from <code>resolve</code> is also available as component inputs when <code>withComponentInputBinding()</code> is active: <code>{ path: \'products/:id\', resolve: { product: productResolver } }</code> → <code>product = input&lt;Product&gt;()</code>. The resolver runs before the component is instantiated, so data is always available on first render.',
      ],
    },
    {
      heading: 'Lazy loading and code splitting',
      points: [
        '<code>loadComponent: () => import(\'./feature/feature\').then(m => m.FeatureComponent)</code> tells the Angular build to split <code>FeatureComponent</code> and all its non-shared dependencies into a separate JavaScript chunk. The chunk is only downloaded when the user first navigates to that route — reducing initial Time to Interactive.',
        'For a group of related routes, use <code>loadChildren: () => import(\'./feature/routes\').then(m => m.featureRoutes)</code> to lazy-load an entire route subtree from a separate file. The routes file exports a <code>Routes</code> array; Angular loads the entire subtree\'s components lazily.',
        'Preloading strategies control which lazy chunks load in the background after the initial page. <code>withPreloading(PreloadAllModules)</code> preloads all lazy chunks after the initial render. <code>withPreloading(NoPreloading)</code> (default) loads on demand. Custom strategies implement <code>PreloadingStrategy</code> for selective preloading.',
        'Route-level <code>providers</code> scope services to the lazy route: <code>{ path: \'cart\', loadComponent: ..., providers: [CartService] }</code>. The service is created when the route loads and destroyed when the user navigates away — perfect for checkout flows or wizard state.',
        'The Angular build automatically creates a separate bundle file per <code>loadComponent</code>/<code>loadChildren</code> call. You can inspect them in the build output: each appears as a named chunk. Ensure lazy components are not inadvertently imported statically by their parent, which would include them in the main bundle.',
      ],
    },
    {
      heading: 'Guards and resolvers',
      points: [
        '<code>CanActivateFn</code> is a plain function returning <code>boolean | UrlTree | Observable&lt;boolean | UrlTree&gt;</code>. Return <code>true</code> to allow, <code>false</code> to block, or a <code>UrlTree</code> (via <code>router.createUrlTree([\'/login\'])</code>) to redirect. Functional guards replaced class-based <code>CanActivate</code> in Angular 14 and are tree-shakeable.',
        '<code>CanDeactivateFn&lt;T&gt;</code> runs when the user tries to navigate <em>away</em> from the current route. It receives the component instance as the first argument: <code>canDeactivate: [(comp: FormComponent) => comp.isDirty ? confirm(\'Leave?\') : true]</code>. Use it to prompt users before abandoning unsaved form data.',
        '<code>CanMatchFn</code> (Angular 15+) prevents a route from even being matched — not just activated. This is stronger than <code>canActivate</code>: if it returns false, Angular continues checking subsequent routes in the array, useful for A/B testing, feature flags, or role-based route variations that overlap in path.',
        'Resolvers pre-fetch data before the route activates, ensuring the component renders with data immediately — no loading state needed. Define as: <code>{ path: \'users/:id\', resolve: { user: userResolver } }</code> where <code>userResolver</code> is a function returning an Observable or Promise. The route only activates after the Observable completes.',
        'Guards and resolvers all support <code>inject()</code> inside them, making them true injection contexts. Compose multiple guards in the array: <code>canActivate: [authGuard, featureGuard]</code> — Angular runs them in order and stops at the first falsy return.',
      ],
    },
    {
      heading: 'Child routes and named outlets',
      points: [
        'Child routes share their parent component\'s template. The parent must include a <code>&lt;router-outlet /&gt;</code> to render children. URL: <code>/shop/products</code> renders <code>ShopComponent</code> with <code>ProductListComponent</code> inside its outlet. Navigating to <code>/shop/products/42</code> replaces the child outlet content with <code>ProductDetailComponent</code>.',
        'An empty child route <code>{ path: \'\', component: DefaultChildComponent }</code> renders when the parent path is matched exactly (e.g., <code>/shop</code> shows <code>DefaultChildComponent</code>; <code>/shop/details</code> shows the details child). Use <code>pathMatch: \'full\'</code> on redirect routes to prevent partial matches.',
        'Named (auxiliary) outlets let you render multiple independent router views simultaneously: <code>&lt;router-outlet name="sidebar" /&gt;</code>. Navigate to them with: <code>router.navigate([{ outlets: { primary: \'main\', sidebar: \'chat\' } }])</code>. Useful for sidebars, modals, and secondary panels that need their own route history.',
        '<code>routerLinkActive="active-class"</code> adds the class when the link\'s route (or any of its children) is active. Add <code>[routerLinkActiveOptions]="{ exact: true }"</code> on the root route (<code>/</code>) to prevent it matching every URL. The directive can apply classes to a parent element, not just the anchor itself.',
        '<code>RouterEvent</code> stream: subscribe to <code>router.events.pipe(filter(e => e instanceof NavigationEnd))</code> for analytics, progress bars, or scroll-to-top on navigation. Common events: <code>NavigationStart</code>, <code>NavigationEnd</code>, <code>NavigationError</code>, <code>RoutesRecognized</code>, <code>GuardsCheckStart</code>.',
      ],
    },
    {
      heading: 'Signal integration and modern patterns',
      points: [
        '<code>toSignal(route.paramMap.pipe(map(p => p.get(\'id\'))))</code> converts route params to signals. The signal is <code>undefined</code> on first emission if <code>{ initialValue: \'\' }</code> is not set. Pass <code>{ requireSync: true }</code> if the Observable always emits synchronously (snapshot-based), which makes the signal\'s type <code>string</code> instead of <code>string | undefined</code>.',
        'The router itself exposes signals in Angular 17.2+: <code>router.url</code> is still a string, but <code>toSignal(router.events.pipe(...filter..., map(e => e.urlAfterRedirects)))</code> provides a reactive URL signal. Libraries like <code>ngx-router-store</code> wrap this into a cleaner API.',
        'Combine <code>withComponentInputBinding()</code> with Angular 17\'s <code>input.required()</code> for compile-time route param safety: the TypeScript compiler enforces that the param exists. If the route doesn\'t provide it, the component doesn\'t compile — a contract enforced at build time.',
        'For scroll behavior on route change, add <code>withInMemoryScrolling({ scrollPositionRestoration: \'top\', anchorScrolling: \'enabled\' })</code> to <code>provideRouter()</code>. This replaces the old <code>ExtraOptions</code> object and scrolls to the top of the page on every route transition.',
        'Debugging routes: <code>withDebugTracing()</code> logs all router events to the console. Enable it temporarily during development: <code>provideRouter(routes, withDebugTracing())</code>. Remove it before production — it adds significant console noise.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Routes setup',
      language: 'typescript',
      code: `// app.routes.ts
export const routes: Routes = [
  // Static route
  { path: '', component: HomeComponent },

  // Route with parameter
  { path: 'products/:id', component: ProductDetailComponent },

  // Lazy loaded component (code split)
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard').then(m => m.DashboardComponent),
  },

  // Lazy route group
  {
    path: 'shop',
    loadChildren: () =>
      import('./shop/shop.routes').then(m => m.shopRoutes),
  },

  // Route guard + lazy
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./admin/admin').then(m => m.AdminComponent),
  },

  // Child routes (parent must have <router-outlet>)
  {
    path: 'account',
    component: AccountComponent,
    children: [
      { path: '', component: AccountOverviewComponent },
      { path: 'settings', component: AccountSettingsComponent },
    ],
  },

  // Wildcard MUST be last
  { path: '**', component: NotFoundComponent },
];`,
    },
    {
      label: 'Navigation + params',
      language: 'typescript',
      code: `import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

export class MyComponent {
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  // Programmatic navigation
  goHome()               { this.router.navigate(['/']); }
  goToProduct(id: string){ this.router.navigate(['/products', id]); }

  // Navigate with query params (merge keeps existing params)
  search(q: string) {
    this.router.navigate(['/search'], {
      queryParams: { q, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  // Route param as signal — reacts to param changes
  productId = toSignal(
    this.route.paramMap.pipe(map(p => p.get('id') ?? ''))
  );

  // Query param as signal
  pageNum = toSignal(
    this.route.queryParamMap.pipe(map(p => Number(p.get('page') ?? 1)))
  );
}`,
    },
    {
      label: 'Functional guard',
      language: 'typescript',
      code: `// auth.guard.ts — no class, no decorator, just a function
import { inject }        from '@angular/core';
import { Router }        from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService }   from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  // Preserve intended URL for post-login redirect
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

// CanDeactivate — prevent leaving a dirty form
export const unsavedChangesGuard: CanDeactivateFn<FormComponent> =
  (component) =>
    component.isDirty()
      ? confirm('Leave without saving?')
      : true;

// Register in routes:
// { path: 'admin', canActivate: [authGuard], loadComponent: ... }
// { path: 'form',  canDeactivate: [unsavedChangesGuard], ... }`,
    },
    {
      label: 'withComponentInputBinding',
      language: 'typescript',
      code: `// app.config.ts — enable input binding for route params
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

// product-detail.ts — no ActivatedRoute needed!
export class ProductDetailComponent {
  // :id route param → this input (matched by name)
  id = input.required<string>();

  // resolver data → this input (matched by resolver key)
  product = input<Product>();

  // ?tab=reviews query param → this input
  tab = input<string>('overview');
}

// Resolver function:
export const productResolver: ResolveFn<Product> = (route) => {
  return inject(ProductService).getById(route.paramMap.get('id')!);
};`,
    },
    {
      label: 'RouterLink (template)',
      language: 'html',
      code: `<!-- Static link -->
<a routerLink="/products">All Products</a>

<!-- Dynamic link with params -->
<a [routerLink]="['/products', product.id]">{{ product.name }}</a>

<!-- With query params -->
<a [routerLink]="['/search']"
   [queryParams]="{ q: 'angular', page: 1 }">
  Search Angular
</a>

<!-- Active class — exact match for home route -->
<a routerLink="/"
   routerLinkActive="active"
   [routerLinkActiveOptions]="{ exact: true }">Home</a>

<!-- Active class — matches route and all child routes -->
<a routerLink="/products" routerLinkActive="active">Products</a>

<!-- Router outlet — where matched component renders -->
<router-outlet />

<!-- Named outlet for secondary panel -->
<router-outlet name="sidebar" />`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What does loadComponent() do in Angular routes?',
      options: [
        'Preloads all routes eagerly at startup',
        'Lazy-loads a component — its JS chunk is only downloaded when its route is activated',
        'Registers a component globally in the root injector',
        'Creates a new NgModule for the component',
      ],
      answer: 1,
      explanation: 'loadComponent() uses dynamic import() so the component bundle is only downloaded when the user first navigates to that route — reducing initial bundle size and Time to Interactive.',
    },
    {
      q: 'Which guard runs before the route component is instantiated?',
      options: ['CanDeactivateFn', 'CanActivateFn', 'CanMatchFn', 'Both B and C'],
      answer: 3,
      explanation: 'Both CanActivateFn and CanMatchFn run before the route activates. CanMatchFn is stronger — it prevents the route from even being matched (Angular continues checking other routes). CanActivateFn runs after route matching but before component instantiation. CanDeactivateFn runs when navigating away.',
    },
    {
      q: 'How do you read a route param reactively as a signal?',
      options: [
        'inject(ActivatedRoute).params',
        'inject(ActivatedRoute).snapshot.paramMap.get(\'id\')',
        'toSignal(inject(ActivatedRoute).paramMap.pipe(map(p => p.get(\'id\'))))',
        'routerParam(\'id\')',
      ],
      answer: 2,
      explanation: 'toSignal converts the paramMap Observable into a signal. This correctly reacts when the user navigates between different param values on the same route (e.g., product/1 → product/2). snapshot is a one-time read and misses re-navigation.',
    },
    {
      q: 'What does queryParamsHandling: \'merge\' do?',
      options: [
        'Replaces all existing query params with the new ones',
        'Merges new params with existing ones — only specified params are added/updated',
        'Encodes query params to avoid special-character issues',
        'Strips all query params on every navigation',
      ],
      answer: 1,
      explanation: '\'merge\' keeps all existing query params and adds/overwrites only the ones you specify in queryParams. Use \'preserve\' to keep all params completely unchanged.',
    },
    {
      q: 'Where does the matched route component render?',
      options: ['<ng-content>', '<app-root>', '<router-outlet>', '<ng-template>'],
      answer: 2,
      explanation: '<router-outlet> is the placeholder Angular replaces with the component matched by the current route. Child routes use the outlet inside the parent component\'s template.',
    },
    {
      q: 'What is CanDeactivateFn used for?',
      options: [
        'Preventing a route from being matched at all',
        'Pre-fetching data before a route activates',
        'Prompting the user or blocking navigation when leaving a route (e.g., unsaved form data)',
        'Redirecting to a login page before activation',
      ],
      answer: 2,
      explanation: 'CanDeactivateFn runs when the user navigates away from the current route. It receives the component instance, so you can check isDirty() or hasUnsavedChanges() and return false (or a confirm() call) to block navigation.',
    },
    {
      q: 'What does withComponentInputBinding() enable?',
      options: [
        'Two-way binding between parent and child components',
        'Route params, query params, and resolver data flow directly into component input() signals by name',
        'Automatic form field binding to route state',
        'Signal-based RouterLink directives',
      ],
      answer: 1,
      explanation: 'withComponentInputBinding() (added to provideRouter()) makes the router populate input() signals whose names match route params, query params, or resolver keys — eliminating the need to inject ActivatedRoute in routed components.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between routerLink and router.navigate()?',
      a: '<code>routerLink</code> is declarative — use it in templates for anchor elements. It generates an <code>href</code> and intercepts clicks for SPA navigation. <code>router.navigate()</code> is imperative — use it in component logic: after a form submit, after API success, after auth. Both support relative paths, query params, and named outlets.',
    },
    {
      q: 'How do you access route params in a component?',
      a: 'Three approaches, cleanest to oldest: (1) <code>input()</code> with <code>withComponentInputBinding()</code> — zero boilerplate, param flows directly into the input. (2) <code>toSignal(inject(ActivatedRoute).paramMap.pipe(map(p => p.get(\'id\'))))</code> — reactive signal. (3) <code>inject(ActivatedRoute).snapshot.paramMap.get(\'id\')</code> — one-time read only, misses re-navigation on the same route.',
    },
    {
      q: 'What is a CanActivateFn?',
      a: 'A plain function returning <code>boolean | UrlTree | Observable&lt;boolean&gt;</code>. Return <code>true</code> to allow, <code>false</code> to block, or a <code>UrlTree</code> (from <code>router.createUrlTree([\'/login\'])</code>) to redirect. Registered in the route: <code>canActivate: [authGuard]</code>. Functional guards replaced class-based <code>CanActivate</code> in Angular 14 and are tree-shakeable.',
    },
    {
      q: 'How does lazy loading work?',
      a: '<code>loadComponent: () => import(\'./my/component\').then(m => m.MyComponent)</code> — Angular\'s build tool (esbuild/webpack) code-splits this component into a separate JS chunk. The chunk is not in the initial bundle; it downloads on demand when the user first navigates to that route. For multiple related routes, use <code>loadChildren</code> with a routes file.',
    },
    {
      q: 'What is the difference between params and queryParams?',
      a: 'Route params (<code>/users/:id</code>) are part of the URL path — required for the route to match. Query params (<code>/users?sort=asc&page=2</code>) are optional key-value pairs after the <code>?</code>. Route params change the matched route; query params do not affect which route is matched. Access with <code>ActivatedRoute.queryParamMap</code> or as <code>input()</code> with <code>withComponentInputBinding()</code>.',
    },
    {
      q: 'How do you navigate and pass query params programmatically?',
      a: '<code>router.navigate([\'/users\'], { queryParams: { sort: \'asc\', page: 2 } })</code>. To preserve existing params, add <code>queryParamsHandling: \'merge\'</code>. To completely replace all params, omit <code>queryParamsHandling</code> (default replaces). To keep all params exactly as-is, use <code>queryParamsHandling: \'preserve\'</code>.',
    },
    {
      q: 'What is the difference between CanActivateFn and CanMatchFn?',
      a: '<code>CanActivateFn</code> runs after the route is matched but before the component is created. If it returns false, the route is blocked and navigation fails. <code>CanMatchFn</code> runs during route matching — if it returns false, Angular continues checking subsequent routes in the array as if this route didn\'t exist. Use <code>CanMatchFn</code> when you have multiple routes at the same path for different roles (A/B testing, feature flags).',
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Reading route params: ActivatedRoute vs input() with withComponentInputBinding()',
      before: `// Old: inject ActivatedRoute and subscribe manually
export class ProductDetailComponent implements OnInit {
  id = '';
  ngOnInit() {
    inject(ActivatedRoute).paramMap
      .pipe(map(p => p.get('id') ?? ''))
      .subscribe(id => (this.id = id));
  }
}`,
      after: `// New: route param flows directly into input() signal
export class ProductDetailComponent {
  id = input.required<string>();
  // withComponentInputBinding() in provideRouter() does the wiring
}`,
      note: 'Requires provideRouter(routes, withComponentInputBinding()) in app.config.ts. Resolver data and query params also flow into inputs by name.',
    },
    {
      title: 'Route guards: class-based CanActivate vs functional CanActivateFn',
      before: `// Old: class-based guard with implements CanActivate
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  canActivate(): boolean {
    return inject(AuthService).isLoggedIn();
  }
}`,
      after: `// New: plain function — no class, no decorator
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() || router.createUrlTree(['/login']);
};`,
      note: 'Functional guards are tree-shakeable and can use inject() directly. The type system ensures the return type matches.',
    },
    {
      title: 'Router setup: RouterModule.forRoot() vs provideRouter()',
      before: `// Old: NgModule-based setup
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}`,
      after: `// New: standalone app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes,
      withComponentInputBinding(),
      withPreloading(PreloadAllModules),
    ),
  ],
};`,
      note: 'provideRouter() is the modern standalone API. Feature functions are tree-shakeable — only included in the bundle if used.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Wildcard route placed before specific routes',
      wrong: `export const routes: Routes = [
  { path: '**', redirectTo: '' },          // swallows everything!
  { path: 'products/:id', component: ... }, // never reached
];`,
      right: `export const routes: Routes = [
  { path: 'products/:id', component: ... },
  { path: '**', redirectTo: '' },           // always last
];`,
      explanation: 'The router matches routes top-to-bottom; first match wins. A wildcard placed first swallows every URL before specific routes are ever evaluated.',
    },
    {
      title: 'Missing routerLinkActiveOptions exact:true on the home route',
      wrong: `<!-- Active on '/' AND '/products', '/admin', etc. — always active! -->
<a routerLink='/' routerLinkActive='active'>Home</a>`,
      right: `<a routerLink="/"
   routerLinkActive="active"
   [routerLinkActiveOptions]="{ exact: true }">Home</a>`,
      explanation: 'Without exact:true, RouterLinkActive marks the home route as active for every URL because every path starts with \'/\'.',
    },
    {
      title: 'Forgetting queryParamsHandling: \'merge\' and wiping existing params',
      wrong: `// Navigates to /search?q=angular — silently drops the 'page' param
this.router.navigate(['/search'], {
  queryParams: { q: 'angular' },
});`,
      right: `// Keeps 'page' and all other existing params
this.router.navigate(['/search'], {
  queryParams: { q: 'angular' },
  queryParamsHandling: 'merge',
});`,
      explanation: 'Without \'merge\', every navigation replaces all query params with only what you specify. Any params not explicitly re-included are silently dropped.',
    },
    {
      title: 'Using snapshot.paramMap when the component is reused across param values',
      wrong: `// Only reads once — misses changes when navigating product/1 → product/2
const id = inject(ActivatedRoute).snapshot.paramMap.get('id');`,
      right: `// Reacts to every param change with a signal
productId = toSignal(
  inject(ActivatedRoute).paramMap.pipe(map(p => p.get('id') ?? ''))
);`,
      explanation: 'snapshot is a one-time read taken at component creation. When Angular reuses the same component for different param values, snapshot stays at the original value. Use paramMap Observable (or input() with withComponentInputBinding()).',
    },
    {
      title: 'Forgetting to import RouterLink / RouterOutlet in standalone component',
      wrong: `@Component({
  imports: [],  // RouterLink and RouterOutlet missing!
  template: '<a routerLink="/home">Home</a><router-outlet />'
})
export class AppComponent {}
// Error: 'routerLink' is not a known attribute of 'a'`,
      right: `import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterLink, RouterOutlet],
  template: '<a routerLink="/home">Home</a><router-outlet />'
})
export class AppComponent {}`,
      explanation: 'In standalone components, router directives (RouterLink, RouterOutlet, RouterLinkActive) must be explicitly imported. Unlike NgModule apps where RouterModule.forRoot() provided them globally, standalone components declare only what they use.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'The Angular router matches URLs to components by first-match order, lazy-loads chunks via <code>loadComponent()</code>, controls access with functional guards, and (with <code>withComponentInputBinding()</code>) wires route params directly to <code>input()</code> signals.',
    mustKnow: [
      'Routes match top-to-bottom — first match wins; wildcard <code>path: \'**\'</code> must always be last',
      '<code>loadComponent()</code> code-splits the component; the chunk only downloads when the route is first visited',
      '<code>withComponentInputBinding()</code> maps route params, query params, and resolver data directly to <code>input()</code> signals by name',
      '<code>snapshot.paramMap.get(\'id\')</code> is a one-time read — use <code>toSignal(route.paramMap.pipe(...))</code> for reactive updates when the route is reused',
      'Functional guards (<code>CanActivateFn</code>) replace class-based guards; return <code>router.createUrlTree([\'/login\'])</code> to redirect',
      '<code>CanMatchFn</code> prevents route matching entirely; <code>CanActivateFn</code> allows matching but blocks activation',
      'Standalone components must import <code>RouterLink</code>, <code>RouterOutlet</code>, <code>RouterLinkActive</code> explicitly',
    ],
    interviewFocus: [
      'How does Angular route matching work — what does "first match wins" mean in practice?',
      'What is the difference between loadComponent() and loadChildren() for lazy loading?',
      'What does withComponentInputBinding() do and how does it simplify routed components?',
      'What is the difference between CanActivateFn and CanMatchFn?',
      'Why does snapshot.paramMap fail when navigating between param values, and what should you use instead?',
    ],
  };

  challenge: Challenge = {
    title: 'Lazy Route with Guard',
    description: 'Write an Angular route configuration with a lazy-loaded ProductDetailComponent and a canActivate guard that redirects unauthenticated users to /login, preserving the intended URL as a returnUrl query param.',
    language: 'typescript',
    hints: [
      'Use loadComponent: () => import(...).then(m => m.ProductDetailComponent)',
      'A guard is a function returning boolean | UrlTree',
      'Use inject(AuthService) and inject(Router) inside the guard',
      'Return router.createUrlTree([\'/login\'], { queryParams: { returnUrl: state.url } }) to redirect',
    ],
    starterCode: `import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

function authGuard(route: any, state: any) {
  // TODO: check auth, redirect to /login with returnUrl if not logged in
}

export const routes: Routes = [
  {
    path: 'products/:id',
    // TODO: lazy load ProductDetailComponent
    // TODO: add authGuard
  },
];`,
    solution: `import { Routes, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn()
    || router.createUrlTree(['/login'], {
         queryParams: { returnUrl: state.url },
       });
};

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
