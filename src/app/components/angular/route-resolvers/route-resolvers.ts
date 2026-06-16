import { Component, signal } from '@angular/core';
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
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';

interface Post { id: number; title: string; author: string; body: string; }

const MOCK_POSTS: Post[] = [
  { id: 1, title: 'Getting Started with Angular Signals', author: 'Alice', body: 'Signals are reactive primitives that Angular uses for fine-grained change detection without Zone.js.' },
  { id: 2, title: 'Route Resolvers Deep Dive', author: 'Bob', body: 'Route resolvers pre-fetch data before the component activates, eliminating the need for in-component loading spinners.' },
  { id: 3, title: 'Building Real-time Apps', author: 'Carol', body: 'WebSockets combined with Angular signals make building real-time dashboards straightforward and efficient.' },
];

@Component({
  selector: 'app-route-resolvers',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent, PrerequisitesComponent, RevisionCardComponent],
  templateUrl: './route-resolvers.html',
  styleUrl: './route-resolvers.scss',
})
export class RouteResolversDemo {

  prerequisites: Prerequisite[] = [
    { label: 'Routing', route: '/angular/routing-demo' },
    { label: 'Preloading Strategies', route: '/angular/preloading' },
  ];

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

  // ── Content ────────────────────────────────────────────────────────────────
  theory: TheoryPoint[] = [
    {
      heading: 'What are route resolvers?',
      points: [
        'A resolver is a function Angular runs before activating a route\'s component — it pre-fetches data so the component always renders with data already present, eliminating in-component loading spinners.',
        'Without a resolver, the component activates immediately and must manage its own loading state (<code>loading = signal(true)</code>), then show skeleton UI while the data arrives.',
        'With a resolver, Angular holds navigation in the shell (the URL changes, a global progress bar can show) and only activates the component once every resolver for that route has resolved.',
        'The trade-off: resolvers make the UX seamless once the component renders, but navigation can appear "frozen" if the resolver is slow. Use a shell-level loading indicator to give feedback during resolution.',
        'Resolvers are ideal for fast, guaranteed data (IDs → database lookups under 500ms). For slow or optional data, load inside the component with a skeleton state instead.',
      ],
    },
    {
      heading: 'Functional ResolveFn syntax and return types',
      points: [
        '<code>ResolveFn&lt;T&gt;</code> is a plain function type: <code>(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =&gt; MaybeAsync&lt;T | UrlTree&gt;</code> where <code>MaybeAsync&lt;T&gt;</code> is <code>T | Promise&lt;T&gt; | Observable&lt;T&gt;</code>.',
        'You can use <code>inject()</code> directly inside the function body — no class or constructor needed: <code>export const postResolver: ResolveFn&lt;Post&gt; = route =&gt; inject(PostService).getById(route.paramMap.get(\'id\')!)</code>.',
        'Synchronous returns are valid: return a plain value for data computed from route params without hitting the network.',
        'When returning an Observable, Angular subscribes and waits for the <strong>first emission</strong>, then unsubscribes. Pass a hot Observable (like a BehaviorSubject) through <code>first()</code> or <code>take(1)</code> to be explicit about this.',
        'Returning a <code>UrlTree</code> (e.g. <code>inject(Router).parseUrl(\'/not-found\')</code>) causes the router to redirect instead of activating the route — the resolver doubles as a guard when the resource is missing.',
      ],
    },
    {
      heading: 'Accessing resolved data in components',
      points: [
        'Option 1 — <code>ActivatedRoute.data</code>: inject <code>ActivatedRoute</code> and subscribe to <code>route.data</code> as a signal: <code>toSignal(inject(ActivatedRoute).data.pipe(map(d =&gt; d[\'post\'] as Post)))</code>.',
        'Option 2 (Angular 16+) — <code>withComponentInputBinding()</code>: add this feature to <code>provideRouter()</code> and Angular automatically maps resolved data keys and route params to <code>input()</code> declarations with matching names.',
        'With <code>withComponentInputBinding()</code>, resolved data named <code>post</code> from <code>resolve: { post: postResolver }</code> maps directly to <code>post = input&lt;Post&gt;()</code> — zero boilerplate.',
        'The <code>input()</code> approach also maps route parameters: <code>id = input&lt;string&gt;()</code> receives the <code>:id</code> param value automatically, replacing <code>inject(ActivatedRoute).snapshot.paramMap.get(\'id\')</code>.',
        'Static route <code>data</code> (e.g. <code>{ path: \'…\', data: { title: \'Posts\' } }</code>) is also available via <code>route.data</code> alongside resolved values — they are merged into the same Observable stream.',
      ],
    },
    {
      heading: 'Multiple resolvers and execution order',
      points: [
        'When a route has multiple entries in its <code>resolve</code> object (e.g. <code>resolve: { user: userResolver, perms: permResolver }</code>), Angular <strong>starts all resolvers simultaneously in parallel</strong> — they do NOT execute sequentially.',
        'The route activates only after ALL resolvers have completed, regardless of which finishes first. The total wait time is determined by the slowest resolver, not the sum.',
        'If resolver B depends on resolver A\'s result (e.g. fetch user, then fetch user\'s permissions), you cannot rely on execution order — combine both fetches into a single resolver using <code>async/await</code> or RxJS <code>switchMap</code>.',
        'Each resolver\'s result is stored in <code>route.data</code> under its key. If multiple resolvers return data under the same key, later resolvers overwrite earlier ones — use unique keys.',
        'To run two independent resolvers sequentially for a reason (e.g. breadcrumb vs main content with different timing needs), use a single resolver that returns an object containing both results via <code>Promise.all([...])</code>.',
      ],
    },
    {
      heading: 'Named outlets — parallel router views',
      points: [
        'Angular supports multiple <code>&lt;router-outlet&gt;</code> elements on the same page by giving them unique <code>name</code> attributes: <code>&lt;router-outlet name="sidebar" /&gt;</code>.',
        'Named outlet routes are defined with an <code>outlet</code> property: <code>{ path: \'detail/:id\', outlet: \'sidebar\', loadComponent: () =&gt; import(\'./detail\') }</code>.',
        'Navigate to a named outlet: <code>router.navigate([{ outlets: { sidebar: [\'detail\', id] } }])</code>. Both the primary outlet and the named outlet URLs are encoded in the URL.',
        'Close/clear a named outlet: <code>router.navigate([{ outlets: { sidebar: null } }])</code> — the component is destroyed and the outlet renders nothing.',
        'Named outlets are powerful for side panels, detail drawers, or multi-pane dashboards where different panels can navigate independently and the state is shareable via URL.',
      ],
    },
    {
      heading: 'Error handling and redirects in resolvers',
      points: [
        'If a resolver throws or its Observable errors, Angular cancels navigation. The <code>NavigationCancel</code> / <code>NavigationError</code> router events fire and the URL does not change.',
        'To redirect when data is not found, return a <code>UrlTree</code>: <code>return post ?? inject(Router).parseUrl(\'/not-found\')</code>. This is cleaner than throwing — it uses the router\'s normal redirect mechanism.',
        'Catch HTTP errors inside the resolver with <code>catchError</code>: <code>inject(PostService).getById(id).pipe(catchError(() =&gt; inject(Router).parseUrl(\'/error\')))</code>.',
        'For non-critical data (e.g. sidebar recommendations) that should not block navigation on failure, use <code>catchError(() =&gt; of(null))</code> inside the resolver and handle null inside the component.',
        'Set a timeout on resolvers using RxJS <code>timeout()</code> operator or <code>Promise.race()</code> with a fallback to prevent resolvers from blocking navigation indefinitely on a slow API.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ResolveFn',
      language: 'typescript',
      code: `import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';

export interface Post { id: number; title: string; body: string; }

// Functional resolver — no class, no @Injectable needed
export const postResolver: ResolveFn<Post> = (route: ActivatedRouteSnapshot) => {
  const id = route.paramMap.get('id')!;
  return inject(PostsService).getById(+id);
  // Returns: T | Promise<T> | Observable<T> | UrlTree
};

// Route definition
const routes: Routes = [
  {
    path: 'posts/:id',
    resolve: { post: postResolver },             // key → ResolveFn
    loadComponent: () => import('./post-detail').then(m => m.PostDetail),
  },
];`,
    },
    {
      label: 'Access resolved data',
      language: 'typescript',
      code: `import { Component, inject, input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

// Option A — ActivatedRoute.data (always works)
export class PostDetail {
  private route = inject(ActivatedRoute);
  post = toSignal(
    this.route.data.pipe(map(d => d['post'] as Post))
  );
}

// Option B — withComponentInputBinding() (Angular 16+)
// Requires: provideRouter(routes, withComponentInputBinding())
export class PostDetail {
  post = input<Post>();    // auto-mapped from resolve: { post: postResolver }
  id   = input<string>(); // auto-mapped from :id route param
}

// app.config.ts — enable both resolved-data and param binding:
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
  ],
};`,
    },
    {
      label: 'Error handling',
      language: 'typescript',
      code: `import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { catchError, of, timeout } from 'rxjs';

export const postResolver: ResolveFn<Post | null> = (route) => {
  const id = route.paramMap.get('id')!;

  return inject(PostsService).getById(+id).pipe(
    // Set a 5-second ceiling so a slow API can't block navigation forever
    timeout(5000),

    // Redirect when post not found (server returns 404)
    catchError((err) => {
      if (err.status === 404) {
        return [inject(Router).parseUrl('/not-found')]; // UrlTree redirect
      }
      // For non-critical data: return null and let the component handle it
      return of(null);
    }),
  );
};`,
    },
    {
      label: 'Named outlets',
      language: 'typescript',
      code: `// Template — define a named outlet alongside the primary one
// <router-outlet />                   ← primary (unnamed)
// <router-outlet name="sidebar" />    ← named outlet

// Route definition for named outlet:
const routes: Routes = [
  {
    path: 'detail/:id',
    outlet: 'sidebar',
    loadComponent: () => import('./detail/detail').then(m => m.DetailComponent),
  },
];

// Navigate to named outlet — both outlets update their content:
inject(Router).navigate([{ outlets: { sidebar: ['detail', 5] } }]);

// Close named outlet — destroy the outlet's component:
inject(Router).navigate([{ outlets: { sidebar: null } }]);

// Navigate primary and named outlet simultaneously:
inject(Router).navigate(['/posts', { outlets: { sidebar: ['detail', 5] } }]);`,
    },
    {
      label: 'Parallel resolvers',
      language: 'typescript',
      code: `// All resolvers start simultaneously — route activates when ALL complete
const routes: Routes = [
  {
    path: 'profile/:id',
    resolve: {
      user:     userResolver,     // starts at t=0, finishes at ~900ms
      perms:    permResolver,     // starts at t=0, finishes at ~600ms
      settings: settingsResolver, // starts at t=0, finishes at ~1200ms
    },                            // route activates at ~1200ms (slowest)
    loadComponent: () => import('./profile/profile'),
  },
];

// If resolver B needs resolver A's result, combine them:
export const userAndPermsResolver: ResolveFn<{user: User; perms: Perm[]}> =
  async (route) => {
    const user  = await inject(UserService).getUser(route.paramMap.get('id')!);
    const perms = await inject(PermService).getForUser(user.id);
    return { user, perms };
  };`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary benefit of using a ResolveFn over fetching data inside a component\'s constructor or ngOnInit?',
      options: ['It reduces bundle size by lazy-loading the service', 'The component activates only after data is ready, eliminating in-component loading spinners', 'It allows the component to fetch data from multiple APIs simultaneously', 'It caches the resolved data across all route navigations automatically'],
      answer: 1,
      explanation: 'A resolver pre-fetches data before the route component activates. Angular waits for the resolver to complete, so the component always renders with data already available — no loading spinner inside the component is needed.',
    },
    {
      q: 'Which return type is NOT valid for a ResolveFn<T>?',
      options: ['T (synchronous value)', 'Promise<T>', 'Observable<T>', 'EventEmitter<T>'],
      answer: 3,
      explanation: 'ResolveFn accepts T, Promise<T>, Observable<T>, or UrlTree. EventEmitter extends Subject which extends Observable, but it is designed for component output events — passing it to a resolver is semantically wrong and the first-emission-only behavior could cause subtle bugs.',
    },
    {
      q: 'When multiple resolvers are configured on a single route, how does Angular execute them?',
      options: ['Sequentially — each waits for the previous to finish', 'In parallel — all start simultaneously, route activates when ALL complete', 'In parallel — route activates as soon as the fastest resolver completes', 'Only the first resolver in the resolve object runs'],
      answer: 1,
      explanation: 'Angular starts all resolvers for a route simultaneously. The route only activates after every resolver has resolved. The total wait is the slowest single resolver, not the sum. If resolver B depends on resolver A\'s result, combine them into one resolver.',
    },
    {
      q: 'With withComponentInputBinding() in provideRouter(), how does a component access resolved data named \'post\'?',
      options: ['By injecting ActivatedRoute and subscribing to route.params', 'By declaring post = input<Post>() — the framework maps the resolve key directly to the input', 'By calling this.router.getCurrentNavigation().extras.state', 'By subscribing to a shared BehaviorSubject inside PostsService'],
      answer: 1,
      explanation: 'When withComponentInputBinding() is enabled, Angular automatically maps resolved data keys and route params to component inputs with matching names. Declaring post = input<Post>() is sufficient — no manual ActivatedRoute injection required.',
    },
    {
      q: 'A ResolveFn returns an Observable<Post> that emits three values over time. What does Angular do?',
      options: ['Re-renders the component each time a new value is emitted', 'Stores all emissions and passes them as an array to the component', 'Waits for the Observable to complete (all 3 values) before activating the route', 'Takes only the FIRST emission and unsubscribes from the Observable'],
      answer: 3,
      explanation: 'When a resolver returns an Observable, Angular subscribes and waits for the first emission. Once the first value arrives, Angular unsubscribes and uses that value as the resolved data. Subsequent emissions are ignored — use first() or take(1) to make this explicit.',
    },
    {
      q: 'How should a resolver redirect the user to /not-found when the requested resource doesn\'t exist?',
      options: [
        'Throw a NavigationError with the target URL',
        'Call inject(Router).navigate([\'/not-found\']) inside the resolver function',
        'Return inject(Router).parseUrl(\'/not-found\') — a UrlTree triggers a redirect',
        'Return null — Angular automatically redirects on null',
      ],
      answer: 2,
      explanation: 'Returning a UrlTree from a resolver instructs the router to redirect instead of activating the route. inject(Router).parseUrl(\'/not-found\') creates a UrlTree. Calling router.navigate() directly inside a resolver is a side effect and an anti-pattern.',
    },
    {
      q: 'How do you close (clear) a named router outlet so its component is destroyed?',
      options: [
        'router.navigate([\'/\', { outlet: \'sidebar\', action: \'close\' }])',
        'router.navigate([{ outlets: { sidebar: null } }])',
        'router.resetNamedOutlet(\'sidebar\')',
        'Remove the <router-outlet name="sidebar" /> element from the template',
      ],
      answer: 1,
      explanation: 'Navigating with { outlets: { sidebar: null } } tells the router to clear that named outlet — the currently active component is destroyed and the outlet renders nothing. The primary outlet is unaffected.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is a route resolver and why use it?', a: 'A resolver pre-fetches data before a component activates. The component renders with data already available — no loading spinner needed inside the component. Angular holds navigation until the resolver completes, then activates the route.' },
    { q: 'What can a ResolveFn return?', a: 'It can return <code>T</code> (synchronous), <code>Promise&lt;T&gt;</code>, <code>Observable&lt;T&gt;</code>, or a <code>UrlTree</code> (to redirect). Angular waits for async values to resolve before activating the route. For Observables, only the first emission is used.' },
    { q: 'How do you access resolved data in a component?', a: 'Two ways: (1) <code>inject(ActivatedRoute).data</code> Observable — subscribe or use <code>toSignal()</code> with a <code>map(d =&gt; d[\'post\'])</code>. (2) With <code>withComponentInputBinding()</code> in <code>provideRouter()</code>, the resolved data maps directly to an <code>input()</code> with the same key as the resolve property name.' },
    { q: 'Do multiple resolvers on the same route run in parallel?', a: 'Yes — Angular starts all resolvers simultaneously. They do NOT run sequentially. The route activates when <strong>all</strong> resolvers complete. The total wait is the slowest resolver. If resolver B needs resolver A\'s result, combine them into a single resolver.' },
    { q: 'What is a named outlet?', a: 'A second <code>&lt;router-outlet name="sidebar"&gt;</code> element in the page. Navigate to it with <code>router.navigate([{ outlets: { sidebar: [\'detail\', id] } }])</code>. Useful for side panels, drawers, or dashboards where multiple outlet sections navigate independently.' },
    { q: 'How do you close a named outlet?', a: '<code>router.navigate([{ outlets: { sidebar: null } }])</code> clears the named outlet — the component is destroyed and the outlet shows nothing. The primary outlet is unaffected. Both the null navigation and the outlet\'s cleanup are synchronous.' },
    { q: 'What happens if a resolver throws an error or its Observable errors?', a: 'Angular cancels navigation — the <code>NavigationError</code> router event fires and the URL does not change. To handle errors gracefully, catch them inside the resolver: use <code>catchError(() =&gt; of(null))</code> for non-critical data (and handle null in the component), or <code>catchError(() =&gt; [inject(Router).parseUrl(\'/error\')])</code> to redirect.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'ResolveFn', type: 'interface', desc: 'Functional type for a route resolver — (route, state) => T | Promise<T> | Observable<T> | UrlTree.' , since: '14'},
    { name: 'resolve', type: 'keyword', desc: 'Route configuration property mapping string keys to ResolveFn functions; all resolvers start in parallel.' },
    { name: 'ActivatedRoute.data', type: 'class', desc: 'Observable of resolved data merged with static route data; consume via toSignal(route.data.pipe(map(d => d[\'key\']))).' },
    { name: 'withComponentInputBinding', type: 'function', desc: 'Router feature that auto-maps resolved data keys and route params to matching component input() declarations.' , since: '16'},
    { name: 'ActivatedRouteSnapshot', type: 'class', desc: 'Immutable snapshot passed as the first argument to ResolveFn, exposing paramMap, queryParamMap, and data.' },
    { name: 'toSignal', type: 'function', desc: 'Converts Observable (like ActivatedRoute.data) into an Angular signal for use in signal-based components.' , since: '16'},
    { name: 'router-outlet', type: 'directive', desc: 'Marks where a routed component renders; name attribute enables named (auxiliary) outlets for multi-panel layouts.' },
    { name: 'UrlTree', type: 'class', desc: 'Returned from a resolver to trigger a redirect — inject(Router).parseUrl(\'/not-found\') redirects on missing resources.' },
    { name: 'withComponentInputBinding', type: 'function', desc: 'Enables mapping of route params and resolved data keys to component input() declarations by name.' , since: '16'},
    { name: 'catchError', type: 'function', desc: 'RxJS operator used inside a resolver to handle Observable errors gracefully without cancelling navigation.' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Class-based resolver vs functional ResolveFn',
      before: `// Angular pre-14: class with Resolve interface
@Injectable({ providedIn: 'root' })
export class PostResolver implements Resolve<Post> {
  resolve(route: ActivatedRouteSnapshot): Observable<Post> {
    return inject(PostsService).getById(+route.paramMap.get('id')!);
  }
}`,
      after: `// Angular 14+: plain function, no class needed
export const postResolver: ResolveFn<Post> =
  (route: ActivatedRouteSnapshot) =>
    inject(PostsService).getById(+route.paramMap.get('id')!);`,
      note: 'ResolveFn replaced the class-based Resolve interface in Angular 14. No decorator or @Injectable required.',
    },
    {
      title: 'Consuming resolved data: ActivatedRoute vs input()',
      before: `// Without withComponentInputBinding — manual subscription
export class PostDetail {
  private route = inject(ActivatedRoute);
  post = toSignal(
    this.route.data.pipe(map(d => d['post'] as Post))
  );
}`,
      after: `// With withComponentInputBinding() in provideRouter()
export class PostDetail {
  post = input<Post>(); // auto-mapped from resolve: { post: postResolver }
  id   = input<string>(); // auto-mapped from :id route param
}`,
      note: 'withComponentInputBinding() maps both resolved data and route params to inputs by matching key names.',
    },
    {
      title: 'Loading data inside ngOnInit vs route resolver',
      before: `// Without resolver: component manages loading state
export class PostDetail implements OnInit {
  post = signal<Post | null>(null);
  loading = signal(true);
  ngOnInit() {
    this.svc.getById(this.id).subscribe(p => {
      this.post.set(p); this.loading.set(false);
    });
  }
}`,
      after: `// With resolver: component always has data on activation
export class PostDetail {
  post = input.required<Post>(); // resolved before render
  // no loading state needed — Angular waited for resolver
}`,
      note: 'Resolvers eliminate in-component loading spinners by ensuring data is ready before the component renders.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Returning a non-first-emitting Observable from a resolver',
      wrong: `export const postResolver: ResolveFn<Post[]> = () =>
  inject(PostsService).posts$; // BehaviorSubject — emits immediately, but still confusing`,
      right: `export const postResolver: ResolveFn<Post[]> = () =>
  inject(PostsService).posts$.pipe(first()); // explicit: take first emission`,
      explanation: 'Angular takes only the first emission from an Observable resolver. While BehaviorSubject works because it emits on subscribe, using first() or take(1) documents the intent and prevents confusion when the source emits more values later.',
    },
    {
      title: 'Expecting multiple resolvers to run sequentially',
      wrong: `// permResolver incorrectly assumes userResolver has already run
export const permResolver: ResolveFn<Perm[]> = () => {
  const user = inject(UserService).currentUser; // may be stale
  return inject(PermService).getFor(user.id);
};`,
      right: `// Combine dependent fetches in one resolver
export const userAndPermResolver: ResolveFn<{user: User; perms: Perm[]}> =
  async () => {
    const user  = await inject(UserService).getUser();
    const perms = await inject(PermService).getFor(user.id);
    return { user, perms };
  };`,
      explanation: 'All resolvers on a route start simultaneously. If resolver B depends on resolver A\'s result, combine them into one resolver using async/await or RxJS switchMap.',
    },
    {
      title: 'Forgetting withComponentInputBinding() when using input() for resolved data',
      wrong: `// provideRouter(routes) — no withComponentInputBinding
export class PostDetail {
  post = input<Post>(); // always undefined — never mapped
}`,
      right: `// provideRouter(routes, withComponentInputBinding())
export class PostDetail {
  post = input<Post>(); // mapped from resolve: { post: postResolver }
}`,
      explanation: 'The input() shortcut for resolved data only works when withComponentInputBinding() is added to provideRouter(). Without it, the input is never populated and the component silently receives undefined.',
    },
    {
      title: 'Not redirecting on resolver failure — returning null instead of UrlTree',
      wrong: `export const postResolver: ResolveFn<Post | null> =
  (route) => inject(PostsService).getById(+route.paramMap.get('id')!);
// Component activates with null — must handle null everywhere`,
      right: `export const postResolver: ResolveFn<Post> = (route) => {
  const svc = inject(PostsService);
  return svc.getById(+route.paramMap.get('id')!).pipe(
    catchError(() => [inject(Router).parseUrl('/not-found')])
  );
};`,
      explanation: 'Returning a UrlTree from a resolver redirects the user before the component activates, keeping the component free of null-checking and centralising the not-found logic in the resolver.',
    },
    {
      title: 'Using a resolver for slow API calls without any shell-level loading feedback',
      wrong: `// Resolver takes 4 seconds — user sees nothing, no feedback
export const slowResolver: ResolveFn<Data> = () =>
  inject(SlowService).getLargeDataset(); // blocks navigation for 4s`,
      right: `// For slow fetches: skip the resolver, load inside the component
// Subscribe to router events in app shell to show a progress bar:
router.events.pipe(
  filter(e => e instanceof NavigationStart)
).subscribe(() => showProgressBar());`,
      explanation: 'Resolvers freeze the visible page while they run. For slow fetches (>500ms), load data inside the component with a skeleton/spinner instead — or pair resolvers with a shell-level NavigationStart progress bar so users know something is happening.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Product Detail Resolver',
    description: 'Implement a ResolveFn that fetches a product by ID from a route parameter, redirects to /not-found if the product doesn\'t exist, and wire up the route definition and component using both ActivatedRoute.data (Option A) and the input() binding approach (Option B).',
    language: 'typescript',
    hints: [
      'The route snapshot is passed as the first argument to your ResolveFn — use route.paramMap.get(\'id\') to read the param',
      'Convert the string ID to a number with the + prefix: +route.paramMap.get(\'id\')!',
      'Returning inject(Router).parseUrl(\'/not-found\') from the resolver triggers a redirect instead of activating the component',
      'To use the input() shortcut you must add withComponentInputBinding() to your provideRouter() call; the input name must exactly match the resolve key',
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
  getById(id: number): Product | undefined {
    return this.products.find(p => p.id === id);
  }
}

// TODO 1: Create productResolver: ResolveFn<Product>
// - Read the 'id' param from the route snapshot
// - Use inject(ProductService).getById(+id) to fetch the product
// - Return the product, or redirect to '/not-found' if undefined
export const productResolver: ResolveFn<Product> = (route: ActivatedRouteSnapshot) => {
  // your code here
};

// TODO 2: Write the route config for path 'products/:id' using productResolver
export const productRoute = {
  // your code here
};

// TODO 3: Complete the component — read 'product' via both options
import { Component, inject, input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

export class ProductDetailComponent {
  // Option A — ActivatedRoute.data
  private route = inject(ActivatedRoute);
  productFromRoute = /* toSignal(...) */;

  // Option B — withComponentInputBinding
  product = /* input<...>() */;
}
`,
    solution: `import { ResolveFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';

export interface Product { id: number; name: string; price: number; }

export class ProductService {
  private products: Product[] = [
    { id: 1, name: 'Angular Mug', price: 12 },
    { id: 2, name: 'TypeScript Hoodie', price: 45 },
    { id: 3, name: 'RxJS Sticker Pack', price: 8 },
  ];
  getById(id: number): Product | undefined {
    return this.products.find(p => p.id === id);
  }
}

// TODO 1 SOLUTION
export const productResolver: ResolveFn<Product> = (route: ActivatedRouteSnapshot) => {
  const id = route.paramMap.get('id')!;
  const product = inject(ProductService).getById(+id);
  return product ?? inject(Router).parseUrl('/not-found');
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
  // Option A — ActivatedRoute.data (always works)
  private route = inject(ActivatedRoute);
  productFromRoute = toSignal(
    this.route.data.pipe(map(d => d['product'] as Product))
  );

  // Option B — withComponentInputBinding (requires feature in provideRouter())
  product = input<Product>();
}

// app.config.ts:
// provideRouter(routes, withComponentInputBinding())
`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Route resolvers pre-fetch data before a component activates so it always renders with data ready — they also double as guards when returning a UrlTree to redirect on missing resources.',
    mustKnow: [
      '<code>ResolveFn&lt;T&gt;</code> (Angular 14+): a plain function using <code>inject()</code> — returns <code>T | Promise&lt;T&gt; | Observable&lt;T&gt; | UrlTree</code>',
      'Angular waits for all route resolvers before activating the component; they run <strong>in parallel</strong> — the slowest one determines the total wait',
      'Observable resolvers: Angular takes only the <strong>first emission</strong> then unsubscribes — use <code>first()</code> or <code>take(1)</code> to be explicit',
      '<code>withComponentInputBinding()</code> in <code>provideRouter()</code>: resolved data keys and route params auto-map to matching <code>input()</code> declarations — zero boilerplate',
      'Return <code>inject(Router).parseUrl(\'/not-found\')</code> (a <code>UrlTree</code>) to redirect instead of activating the component when a resource is missing',
      'Named outlets: <code>&lt;router-outlet name="sidebar" /&gt;</code> + <code>{ outlet: \'sidebar\', path: \'…\' }</code> + navigate with <code>{ outlets: { sidebar: [\'detail\', id] } }</code>',
      'For resolvers that depend on each other\'s results, combine them into one resolver — sequential execution is not possible across separate resolve entries',
    ],
    interviewFocus: [
      'What is the difference between fetching data in a resolver vs ngOnInit?',
      'Do multiple resolvers on a route run sequentially or in parallel? What if one depends on another?',
      'What must a ResolveFn return to redirect the user when data is not found?',
      'How does withComponentInputBinding() simplify consuming resolved data?',
      'When should you NOT use a resolver (i.e. load data inside the component instead)?',
    ],
  };
}

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}
