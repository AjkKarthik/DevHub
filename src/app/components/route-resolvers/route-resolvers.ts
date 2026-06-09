import { Component, signal } from '@angular/core';
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

interface Post { id: number; title: string; author: string; body: string; }

const MOCK_POSTS: Post[] = [
  { id: 1, title: 'Getting Started with Angular Signals', author: 'Alice', body: 'Signals are reactive primitives that Angular uses for fine-grained change detection without Zone.js.' },
  { id: 2, title: 'Route Resolvers Deep Dive', author: 'Bob', body: 'Route resolvers pre-fetch data before the component activates, eliminating the need for in-component loading spinners.' },
  { id: 3, title: 'Building Real-time Apps', author: 'Carol', body: 'WebSockets combined with Angular signals make building real-time dashboards straightforward and efficient.' },
];

@Component({
  selector: 'app-route-resolvers',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './route-resolvers.html',
  styleUrl: './route-resolvers.scss',
})
export class RouteResolversDemo {

  // ── Demo 1: Resolver vs No-Resolver comparison ─────────────────────────────
  resolverState  = signal<'idle' | 'resolving' | 'active'>('idle');
  resolvedPost   = signal<Post | null>(null);

  noResolverState = signal<'idle' | 'active-loading' | 'active-loaded'>('idle');
  noResolverPost  = signal<Post | null>(null);

  selectedPostId = signal(1);

  async navigateWithResolver() {
    this.resolverState.set('resolving');
    this.resolvedPost.set(null);
    await delay(1600);
    const post = MOCK_POSTS.find(p => p.id === this.selectedPostId()) ?? MOCK_POSTS[0];
    this.resolvedPost.set(post);
    this.resolverState.set('active');
  }

  resetResolver() {
    this.resolverState.set('idle');
    this.resolvedPost.set(null);
  }

  async navigateWithoutResolver() {
    this.noResolverState.set('active-loading');
    this.noResolverPost.set(null);
    await delay(1600);
    const post = MOCK_POSTS.find(p => p.id === this.selectedPostId()) ?? MOCK_POSTS[0];
    this.noResolverPost.set(post);
    this.noResolverState.set('active-loaded');
  }

  resetNoResolver() {
    this.noResolverState.set('idle');
    this.noResolverPost.set(null);
  }

  // ── Demo 2: Parallel resolvers ─────────────────────────────────────────────
  parallelState  = signal<'idle' | 'running' | 'done'>('idle');
  parallelLog    = signal<{ resolver: string; ms: number; done: boolean }[]>([]);

  async runParallelResolvers() {
    this.parallelState.set('running');
    this.parallelLog.set([
      { resolver: 'userResolver',    ms: 900,  done: false },
      { resolver: 'permResolver',    ms: 600,  done: false },
      { resolver: 'settingsResolver',ms: 1200, done: false },
    ]);

    const resolvers = this.parallelLog();
    await Promise.all(resolvers.map(async (r, i) => {
      await delay(r.ms);
      this.parallelLog.update(log =>
        log.map((l, j) => j === i ? { ...l, done: true } : l)
      );
    }));
    this.parallelState.set('done');
  }

  resetParallel() {
    this.parallelState.set('idle');
    this.parallelLog.set([]);
  }

  // ── QnA / Theory ──────────────────────────────────────────────────────────
  qna: QnaItem[] = [
    { q: 'What is a route resolver and why use it?', a: 'A resolver pre-fetches data before a component activates. The component renders with data already available — no loading spinner inside the component needed. Angular waits for the resolver before showing the route.' },
    { q: 'What can a ResolveFn return?', a: 'It can return <code>T</code> (synchronous), <code>Promise&lt;T&gt;</code>, <code>Observable&lt;T&gt;</code>, or a <code>UrlTree</code> (to redirect). Angular waits for async values to resolve before activating the route.' },
    { q: 'How do you access resolved data in a component?', a: 'Two ways: (1) <code>inject(ActivatedRoute).data</code> Observable — subscribe or use <code>toSignal()</code>. (2) With <code>withComponentInputBinding()</code> in <code>provideRouter()</code>, the resolved data maps directly to an <code>input()</code> with the same key as the resolve property name.' },
    { q: 'Do multiple resolvers on the same route run in parallel?', a: 'Yes — Angular starts all resolvers for a route simultaneously. They do NOT run sequentially. If you need one resolver\'s result in another, combine them in one resolver.' },
    { q: 'What is a named outlet?', a: 'A second (or more) <code>&lt;router-outlet name="sidebar"&gt;</code> element in the page. Navigate to it with <code>router.navigate([{ outlets: { sidebar: [\'detail\', id] } }])</code>. Useful for side panels, drawers, or modals with their own URL.' },
    { q: 'How do you close a named outlet?', a: '<code>router.navigate([{ outlets: { sidebar: null } }])</code> clears the named outlet — the component is destroyed and the outlet shows nothing. The primary outlet is unaffected.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What are route resolvers?',
      points: [
        'A resolver pre-fetches data BEFORE the route component activates — the component always has data on init.',
        'Defined as ResolveFn<T>: a function that returns T, Promise<T>, or Observable<T>.',
        'Angular waits for the resolver to complete before rendering the component — shows a blank/loading screen during.',
        'Access resolved data in the component via ActivatedRoute.data or via withComponentInputBinding().',
      ],
    },
    {
      heading: 'Named outlets',
      points: [
        'Angular supports multiple <router-outlet> on the same page with different names: <router-outlet name="sidebar" />.',
        'Navigate to a named outlet: router.navigate([{ outlets: { sidebar: [\'detail\', id] } }]).',
        'Named outlets are useful for side panels, modals, and dashboards with independent navigation.',
        'Each named outlet has its own route history — you can close it by navigating to null: { outlets: { sidebar: null } }.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'If a resolver returns Observable, Angular only waits for the FIRST emission then unsubscribes.',
        'A resolver can return a UrlTree to redirect — useful for auth-guarded data fetching.',
        'withComponentInputBinding() in provideRouter() maps route params AND resolved data directly to input().',
        'Resolvers run in parallel by default — multiple resolvers on one route all start simultaneously.',
      ],
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What is the primary benefit of using a route resolver (ResolveFn) over fetching data inside a component\'s ngOnInit or constructor?', options: ['It reduces bundle size by lazy-loading the service', 'The component activates only after data is ready, eliminating the need for in-component loading spinners', 'It allows the component to fetch data from multiple APIs simultaneously', 'It caches the resolved data across all route navigations automatically'], answer: 1, explanation: 'A resolver pre-fetches data before the route component activates. Angular waits for the resolver to complete, so the component always renders with data already available — no loading spinner inside the component is needed.' },
    { q: 'Which of the following return types is NOT valid for a ResolveFn<T>?', options: ['T (synchronous value)', 'Promise<T>', 'Observable<T>', 'Subject<T> (multicast subject)'], answer: 3, explanation: 'ResolveFn can return T, Promise<T>, Observable<T>, or a UrlTree for redirects. While Subject extends Observable, Angular only waits for the FIRST emission and then unsubscribes — a multicast Subject is not a distinct return type category and is not listed as a supported form.' },
    { q: 'When multiple resolvers are configured on a single route, how does Angular execute them?', options: ['Sequentially — each resolver waits for the previous one to finish', 'In parallel — all resolvers start simultaneously, and the route activates when ALL have completed', 'In parallel — the route activates as soon as the fastest resolver completes', 'Only the first resolver in the resolve object runs; the rest are ignored'], answer: 1, explanation: 'Angular starts all resolvers for a route simultaneously (in parallel). The route only activates after every resolver has resolved. If you need one resolver\'s result inside another, you must combine them into a single resolver.' },
    { q: 'With withComponentInputBinding() added to provideRouter(), how can a component access resolved data named \'post\' from resolve: { post: postResolver }?', options: ['By injecting ActivatedRoute and subscribing to route.params', 'By declaring post = input<Post>() — the framework maps the resolve key directly to the input', 'By calling this.router.getCurrentNavigation().extras.state', 'By subscribing to a shared BehaviorSubject inside PostsService'], answer: 1, explanation: 'When withComponentInputBinding() is enabled in provideRouter(), Angular automatically maps resolved data keys and route params to component inputs with matching names. Declaring post = input<Post>() is sufficient — no manual ActivatedRoute subscription required.' },
    { q: 'You have a ResolveFn that returns an Observable<Post>. The Observable emits three values over time. What does Angular do with the extra emissions?', options: ['Angular re-renders the component each time a new value is emitted', 'Angular stores all emissions and passes the full array as the resolved data', 'Angular waits for the Observable to complete before activating the route', 'Angular takes only the FIRST emission and then unsubscribes from the Observable'], answer: 3, explanation: 'When a resolver returns an Observable, Angular subscribes to it and waits for the first emission. Once the first value arrives, Angular unsubscribes and uses that value as the resolved data. Subsequent emissions are ignored.' },
  ];

  challenge: Challenge = {
    title: 'Build a Product Detail Resolver',
    description: 'Implement a ResolveFn that fetches a product by ID from a route parameter, then wire up the route definition and consume the resolved data in a component using both ActivatedRoute.data and the input() binding approach.',
    language: 'typescript',
    hints: [
      'Use inject(ActivatedRouteSnapshot) inside ResolveFn — the snapshot is passed as the first argument to your function.',
      'Route params are read with route.paramMap.get(\'id\') — remember to convert the string to a number with the + prefix.',
      'To use the input() shortcut you must add withComponentInputBinding() to your provideRouter() call; the input name must exactly match the resolve key.',
      'A resolver can return a UrlTree (e.g. router.parseUrl(\'/not-found\')) to redirect when the product is not found instead of returning null.',
    ],
    starterCode: `import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';

// --- Data model ---
export interface Product {
  id: number;
  name: string;
  price: number;
}

// --- Fake service (do not modify) ---
export class ProductService {
  private products: Product[] = [
    { id: 1, name: 'Angular Mug', price: 12 },
    { id: 2, name: 'TypeScript Hoodie', price: 45 },
    { id: 3, name: 'RxJS Sticker Pack', price: 8 },
  ];

  getById(id: number) {
    // Returns the product or undefined
    return this.products.find(p => p.id === id);
  }
}

// TODO 1: Create a ResolveFn<Product | undefined> called productResolver
// - Read the 'id' param from the route snapshot
// - Use inject(ProductService).getById(+id) to fetch the product
// - Return the product (or undefined if not found)
export const productResolver: ResolveFn<Product | undefined> = (route: ActivatedRouteSnapshot) => {
  // your code here
};

// TODO 2: Write the route configuration object that:
// - Matches path 'products/:id'
// - Resolves data using productResolver under the key 'product'
// - Lazy-loads a hypothetical ProductDetailComponent
export const productRoute = {
  // your code here
};

// TODO 3: Complete this component so it reads the resolved product
// via ActivatedRoute.data (Option A) AND via input() (Option B — requires withComponentInputBinding)
import { Component, inject, input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

export class ProductDetailComponent {
  // Option A — ActivatedRoute.data
  private route = inject(ActivatedRoute);
  // TODO: create a 'productFromRoute' signal derived from this.route.data
  productFromRoute = /* your code here */;

  // Option B — withComponentInputBinding
  // TODO: declare an input named 'product' of type Product | undefined
  product = /* your code here */;
}
`,
    solution: `import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';

// --- Data model ---
export interface Product {
  id: number;
  name: string;
  price: number;
}

// --- Fake service (do not modify) ---
export class ProductService {
  private products: Product[] = [
    { id: 1, name: 'Angular Mug', price: 12 },
    { id: 2, name: 'TypeScript Hoodie', price: 45 },
    { id: 3, name: 'RxJS Sticker Pack', price: 8 },
  ];

  getById(id: number) {
    return this.products.find(p => p.id === id);
  }
}

// TODO 1 SOLUTION
export const productResolver: ResolveFn<Product | undefined> = (route: ActivatedRouteSnapshot) => {
  const id = route.paramMap.get('id');
  return inject(ProductService).getById(+(id ?? ''));
};

// TODO 2 SOLUTION
export const productRoute = {
  path: 'products/:id',
  resolve: { product: productResolver },
  loadComponent: () => import('./product-detail').then(m => m.ProductDetailComponent),
};

// TODO 3 SOLUTION
import { Component, inject, input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

export class ProductDetailComponent {
  // Option A — ActivatedRoute.data
  private route = inject(ActivatedRoute);
  productFromRoute = toSignal(
    this.route.data.pipe(map(d => d['product'] as Product | undefined))
  );

  // Option B — withComponentInputBinding (requires provideRouter(routes, withComponentInputBinding()))
  product = input<Product | undefined>();
}
`,
  };

  quickRef: QuickRefItem[] = [
    { name: 'ResolveFn', type: 'interface', desc: 'Functional type for defining a route resolver that returns T, Promise<T>, Observable<T>, or UrlTree before a route activates.' , since: '14'},
    { name: 'resolve', type: 'function', desc: 'Route configuration property that maps resolver keys to ResolveFn functions, running all resolvers in parallel before the route activates.' },
    { name: 'ActivatedRoute.data', type: 'class', desc: 'Observable of resolved data and static route data merged together; subscribe or use toSignal() to consume resolved values in a component.' },
    { name: 'withComponentInputBinding', type: 'function', desc: 'Router feature that auto-maps route params and resolved data keys directly to matching component input() declarations, eliminating manual ActivatedRoute injection.' , since: '16'},
    { name: 'ActivatedRouteSnapshot', type: 'class', desc: 'Immutable snapshot of the activated route passed as the first argument to ResolveFn, providing paramMap, queryParamMap, and data at resolution time.' },
    { name: 'toSignal', type: 'function', desc: 'Converts an Observable (such as ActivatedRoute.data) into an Angular signal for use in signal-based component reactive patterns.' , since: '16'},
    { name: 'router-outlet', type: 'directive', desc: 'Angular directive that marks where a routed component renders; supports a name attribute for named (auxiliary) outlets alongside the primary outlet.' },
    { name: 'provideRouter', type: 'function', desc: 'Standalone router provider function that accepts feature functions like withComponentInputBinding() to configure router behavior.' , since: '14'},
    { name: 'loadComponent', type: 'function', desc: 'Lazy-loading route property that accepts a dynamic import returning a standalone component, commonly paired with resolve for data pre-fetching.' },
    { name: 'UrlTree', type: 'class', desc: 'A return value from ResolveFn that triggers a redirect instead of activating the route, useful for auth-guarded data fetching that should reroute on failure.' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Class-based resolver vs functional ResolveFn', before: '// Angular pre-14: class with Resolve interface\n@Injectable({ providedIn: \'root\' })\nexport class PostResolver implements Resolve<Post> {\n  resolve(route: ActivatedRouteSnapshot): Observable<Post> {\n    return inject(PostsService).getById(+route.paramMap.get(\'id\')!);\n  }\n}', after: '// Angular 14+: plain function, no class needed\nexport const postResolver: ResolveFn<Post> =\n  (route: ActivatedRouteSnapshot) =>\n    inject(PostsService).getById(+route.paramMap.get(\'id\')!);',
      note: 'ResolveFn replaced the class-based Resolve interface. No decorator or @Injectable required.' },
    { title: 'Consuming resolved data: ActivatedRoute vs input()', before: '// Without withComponentInputBinding — manual subscription\nexport class PostDetail {\n  private route = inject(ActivatedRoute);\n  post = toSignal(\n    this.route.data.pipe(map(d => d[\'post\'] as Post))\n  );\n}', after: '// With withComponentInputBinding() in provideRouter()\nexport class PostDetail {\n  post = input<Post>(); // auto-mapped from resolve: { post: postResolver }\n  id   = input<string>(); // auto-mapped from :id param\n}',
      note: 'withComponentInputBinding() maps both resolved data and route params to inputs by matching key names.' },
    { title: 'Loading data in ngOnInit vs using a resolver', before: '// Without resolver: component handles loading state\nexport class PostDetail implements OnInit {\n  post = signal<Post | null>(null);\n  loading = signal(true);\n  ngOnInit() {\n    this.svc.getById(this.id).subscribe(p => {\n      this.post.set(p); this.loading.set(false); });\n  }\n}', after: '// With resolver: component always has data on activation\nexport class PostDetail {\n  post = input.required<Post>(); // resolved before render\n  // no loading state needed — Angular waited for resolver\n}',
      note: 'Resolvers eliminate in-component loading spinners by ensuring data is ready before the component renders.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Returning a non-completing Observable from a resolver', wrong: 'export const postResolver: ResolveFn<Post[]> = () =>\n  inject(PostsService).posts$; // BehaviorSubject — never completes', right: 'export const postResolver: ResolveFn<Post[]> = () =>\n  inject(PostsService).posts$.pipe(first()); // take first emission', explanation: 'Angular only waits for the FIRST emission from an Observable resolver and then unsubscribes. Passing a BehaviorSubject or long-lived Observable directly works, but be aware subsequent emissions are ignored. Use first() or take(1) to be explicit and avoid confusion.'  },
    { title: 'Expecting resolvers to run sequentially', wrong: '// Assuming userResolver result is available in permResolver\nexport const permResolver: ResolveFn<Perm[]> = () => {\n  const user = inject(UserService).currentUser; // stale — resolver order not guaranteed\n  return inject(PermService).getFor(user.id);\n};', right: '// Combine both in a single resolver\nexport const userAndPermResolver: ResolveFn<{user: User; perms: Perm[]}> =\n  async () => {\n    const user = await inject(UserService).getUser();\n    const perms = await inject(PermService).getFor(user.id);\n    return { user, perms };\n  };', explanation: 'All resolvers on a route start simultaneously in parallel. If resolver B depends on resolver A\'s result, combine them into one resolver using async/await or RxJS.'  },
    { title: 'Forgetting withComponentInputBinding() when using input() for resolved data', wrong: '// provideRouter(routes) — no withComponentInputBinding\nexport class PostDetail {\n  post = input<Post>(); // always undefined — never mapped\n}', right: '// provideRouter(routes, withComponentInputBinding())\nexport class PostDetail {\n  post = input<Post>(); // mapped from resolve: { post: postResolver }\n}', explanation: 'The input() shortcut for resolved data only works when withComponentInputBinding() is added to provideRouter(). Without it, the input is never populated and the component silently receives undefined.'  },
    { title: 'Not redirecting on resolver failure — returning null instead of UrlTree', wrong: 'export const postResolver: ResolveFn<Post | null> =\n  (route) => inject(PostsService).getById(+route.paramMap.get(\'id\')!);\n// Component activates with null — must handle null everywhere', right: 'export const postResolver: ResolveFn<Post> = (route) => {\n  const post = inject(PostsService).getById(+route.paramMap.get(\'id\')!);\n  return post ?? inject(Router).parseUrl(\'/not-found\');\n};', explanation: 'Returning a UrlTree from a resolver redirects the user before the component activates, keeping the component free of null-checking and centralizing the not-found logic in the resolver.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: 'Angular 14', label: 'Functional ResolveFn replaces class-based Resolve', features: ['ResolveFn<T> type introduced — define resolvers as plain functions, no class or @Injectable required', 'Works with standalone components and provideRouter()', 'inject() can be used directly inside ResolveFn at the top level'] },
    { version: 'Angular 16', label: 'withComponentInputBinding() — zero-boilerplate data access', features: ['withComponentInputBinding() added to provideRouter() feature set', 'Resolved data keys and route params auto-map to matching input() declarations', 'Eliminates manual ActivatedRoute.data subscriptions for resolved values'] },
  ];

  tabs: CodeTab[] = [
    {
      label: 'ResolveFn',
      language: 'typescript',
      code: `import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';

// Functional resolver — no class needed
export const postResolver: ResolveFn<Post> = (route: ActivatedRouteSnapshot) => {
  const id = route.paramMap.get('id')!;
  return inject(PostsService).getById(+id);
  // Returns: T | Promise<T> | Observable<T> | UrlTree
};

// Route definition:
{
  path: 'posts/:id',
  resolve: { post: postResolver },
  loadComponent: () => import('./post-detail').then(m => m.PostDetail),
}`,
    },
    {
      label: 'Access resolved data',
      language: 'typescript',
      code: `// Option 1 — ActivatedRoute.data
export class PostDetail {
  private route = inject(ActivatedRoute);
  post = toSignal(this.route.data.pipe(map(d => d['post'] as Post)));
}

// Option 2 — withComponentInputBinding() (cleaner)
// provideRouter(routes, withComponentInputBinding())
export class PostDetail {
  post = input<Post>();   // auto-mapped from resolve: { post: postResolver }
  id   = input<string>(); // auto-mapped from :id route param
}`,
    },
    {
      label: 'Named outlets',
      language: 'typescript',
      code: `// Template — define a named outlet
// <router-outlet name="sidebar" />

// Route definition for named outlet
{ path: 'detail/:id', outlet: 'sidebar', loadComponent: () => import('./detail') }

// Navigate to named outlet
router.navigate([{ outlets: { sidebar: ['detail', 5] } }]);

// Close named outlet
router.navigate([{ outlets: { sidebar: null } }]);`,
    },
  ];
}

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}
