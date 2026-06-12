import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  title: string;
  description: string;
  route: string;
  badge: string;
  available: boolean;
  keyPoints: string[];
}

const ALL_TOPICS: Topic[] = [
  // ── Core ──────────────────────────────────────────────────────────────────
  { title: 'Signals & State',             route: '/angular/counter',            badge: 'Core',      available: true,
    description: 'signal(), computed(), effect(), @if/@for control flow. The foundation of modern Angular.',
    keyPoints: ['signal() is lazy — only recomputes when read', 'computed() memoises automatically', 'effect() re-runs when any signal it reads changes'] },
  { title: 'Template Syntax',             route: '/angular/templates',          badge: 'Core',      available: true,
    description: 'Interpolation, property/event/two-way binding, template refs, safe navigation, pipes, and async.',
    keyPoints: ['[prop] binds DOM properties, not HTML attributes', '@if/@for are built-in — no import needed', 'async pipe auto-unsubscribes on destroy'] },
  { title: 'Directives',                  route: '/angular/directives',         badge: 'Core',      available: true,
    description: 'NgClass, NgStyle, custom attribute directive (tooltip), and custom structural directive (repeat).',
    keyPoints: ['Attribute directives style/modify — no DOM change', 'Structural directives add/remove DOM nodes', 'Use Renderer2, never direct DOM manipulation'] },
  { title: 'Lifecycle Hooks',             route: '/angular/lifecycle',          badge: 'Core',      available: true,
    description: 'ngOnInit, ngOnChanges, ngOnDestroy, ViewChild, and afterNextRender — with a live log of each call.',
    keyPoints: ['ngOnChanges fires before ngOnInit', 'viewChild() returns a signal — no ngAfterViewInit needed', 'afterNextRender() is ideal for third-party DOM libraries'] },
  { title: 'Pipes',                       route: '/angular/pipes',              badge: 'Core',      available: true,
    description: 'date, currency, number, percent, case, slice, JSON, async, and the custom truncate pipe — all interactive.',
    keyPoints: ['Pure pipes only rerun when input reference changes', 'async pipe subscribes and auto-unsubscribes', 'Custom pipe: implement PipeTransform.transform()'] },
  { title: 'Input / Output Signals',      route: '/angular/parent-child',       badge: 'Core',      available: true,
    description: 'input() and output() — the modern replacement for @Input()/@Output(). Parent-child data flow.',
    keyPoints: ['input() is a read-only signal in the child', 'output() replaces EventEmitter — no Subject needed', 'model() = two-way signal binding shorthand'] },
  { title: 'Content Projection',          route: '/angular/content-projection', badge: 'Core',      available: true,
    description: 'ng-content, multi-slot projection with selectors, ngProjectAs, and ng-container/ng-template patterns.',
    keyPoints: ['select= targets specific children via CSS selector', 'Projected content belongs to the parent\'s CD context', 'ng-container adds zero DOM nodes'] },
  { title: 'resource() API',              route: '/angular/resource-api',       badge: 'Core',      available: true,
    description: 'Angular\'s built-in reactive async primitive — signal-aware data fetching with loading, error, and status signals.',
    keyPoints: ['request() re-runs loader when signals change', 'isLoading(), value(), error() are all signals', 'httpResource() integrates with HttpClient + interceptors'] },
  { title: 'DestroyRef',                  route: '/angular/destroy-ref',        badge: 'Core',      available: true,
    description: 'Modern RxJS cleanup — auto-unsubscribe without ngOnDestroy or Subject destroy$ patterns.',
    keyPoints: ['takeUntilDestroyed() auto-injects DestroyRef in constructor', 'DestroyRef.onDestroy() registers cleanup callbacks', 'Works in services, directives, and functional guards'] },
  { title: 'linkedSignal()',              route: '/angular/linked-signal',       badge: 'Core',      available: true,
    description: 'A writable signal that resets to a computed default when its source changes — perfect for dependent dropdowns.',
    keyPoints: ['Writable unlike computed() — user can override the value', 'Auto-resets when source signal changes', 'Available from Angular 19+'] },
  { title: 'Zoneless Angular',            route: '/angular/zoneless',           badge: 'Core',      available: true,
    description: 'Remove Zone.js for smaller bundles and faster rendering — signals drive all change detection.',
    keyPoints: ['provideExperimentalZonelessChangeDetection() in app.config.ts', 'Signals notify Angular scheduler directly', 'Remove zone.js from polyfills for bundle size reduction'] },
  { title: 'i18n / Transloco',            route: '/angular/i18n',               badge: 'Core',      available: true,
    description: 'Runtime language switching without rebuilding — Transloco for multi-locale Angular apps.',
    keyPoints: ['provideTransloco() with availableLangs and defaultLang', 'Translation files are JSON — lazy-loaded per locale', 'TranslocoService.setActiveLang() switches at runtime'] },
  { title: 'SSR + Hydration',             route: '/angular/ssr',                badge: 'Core',      available: true,
    description: 'Server-side rendering for faster first paint and better SEO — with hydration to avoid layout flash.',
    keyPoints: ['ng add @angular/ssr sets up Express server output', 'provideClientHydration() reuses server HTML', 'isPlatformBrowser() guards localStorage/window access'] },
  { title: 'Host Directives',             route: '/angular',                    badge: 'Core',      available: false,
    description: 'Compose existing directives onto a host element with @hostDirectives — share behaviour without inheritance.',
    keyPoints: ['@hostDirectives([CdkDrag]) adds drag to any component', 'Expose host directive inputs/outputs via inputs/outputs arrays', 'Access the host directive instance with inject()'] },
  { title: '@let Template Variables',     route: '/angular',                    badge: 'Core',      available: false,
    description: 'Angular 18+ @let declarations — block-scoped template variables for cleaner complex expressions.',
    keyPoints: ['@let total = items().length * price; avoids repeated calls', 'Scoped to the block — not accessible outside @if/@for', 'Replaces *ngLet directive community workarounds'] },
  { title: 'Signal Effects Deep-Dive',    route: '/angular',                    badge: 'Core',      available: false,
    description: 'Advanced effect() patterns — allowSignalWrites, untracked(), cleanup callbacks, and error handling.',
    keyPoints: ['effect() tracks reads during synchronous execution only', 'untracked() reads a signal without creating a dependency', 'onCleanup() callback runs before the next effect execution'] },
  { title: 'Standalone Migration',        route: '/angular',                    badge: 'Core',      available: false,
    description: 'Migrate NgModule-based apps to standalone with the official Angular schematic — step-by-step guide.',
    keyPoints: ['ng generate @angular/core:standalone runs in three passes', 'Converts components, then removes module imports, then bootstrapApplication', 'CommonModule should be removed after migration'] },

  // ── DI ────────────────────────────────────────────────────────────────────
  { title: 'Dependency Injection',        route: '/angular/di',                 badge: 'DI',        available: true,
    description: 'Root singleton vs scoped service, InjectionToken with factory, and hierarchical DI resolution.',
    keyPoints: ['providedIn: "root" = tree-shakeable singleton', 'providers: [] in @Component = per-instance scope', 'Use InjectionToken for non-class values'] },

  // ── State ──────────────────────────────────────────────────────────────────
  { title: 'Signal Store Pattern',        route: '/angular/store',              badge: 'State',     available: true,
    description: 'A shopping cart built with a plain injectable signal store. No NgRx required.',
    keyPoints: ['@Injectable service + signals = lightweight store', 'computed() derives state (totals, counts)', 'No NgRx needed for most apps'] },
  { title: 'NgRx Signals Store',          route: '/angular/ngrx-signals',       badge: 'State',     available: true,
    description: 'Signal-based state management — signalStore(), withState(), withComputed(), withMethods(), withEntities().',
    keyPoints: ['signalStore() composes features declaratively', 'patchState() merges partial state updates', 'withEntities() adds normalised entity collections'] },

  // ── Router ─────────────────────────────────────────────────────────────────
  { title: 'Routing',                     route: '/angular/routing',            badge: 'Router',    available: true,
    description: 'Route params, query params, programmatic navigation, canActivate guard, lazy loading, and routerLink.',
    keyPoints: ['loadComponent() lazy-loads on navigation', 'CanActivateFn returns boolean or UrlTree to redirect', 'withComponentInputBinding() maps params to input()'] },
  { title: 'Route Resolvers',             route: '/angular/route-resolvers',    badge: 'Router',    available: true,
    description: 'Pre-fetch data before a component renders using ResolveFn — component always has data on init.',
    keyPoints: ['ResolveFn returns T, Promise<T>, or Observable<T>', 'Component activates only after resolver completes', 'withComponentInputBinding() maps resolved data to input()'] },
  { title: 'Preloading Strategies',       route: '/angular/preloading',         badge: 'Router',    available: true,
    description: 'Silently prefetch lazy-loaded route bundles after initial load — eliminating navigation delay.',
    keyPoints: ['withPreloading(PreloadAllModules) in provideRouter()', 'Custom PreloadingStrategy for selective preloading', 'QuicklinkStrategy preloads visible routerLink routes'] },
  { title: 'Route Guards',                route: '/angular',                    badge: 'Router',    available: false,
    description: 'canActivate, canDeactivate, canMatch, and canActivateChild — functional guard patterns and UrlTree redirects.',
    keyPoints: ['CanActivateFn returns boolean, UrlTree, or Observable<boolean>', 'canDeactivate prompts on unsaved changes', 'canMatch enables feature flags on lazy routes without loading the module'] },

  // ── Forms ─────────────────────────────────────────────────────────────────
  { title: 'Forms: Template vs Reactive', route: '/angular/forms',              badge: 'Forms',     available: true,
    description: 'Both form approaches side-by-side. See their trade-offs on the same form.',
    keyPoints: ['Template forms: simple, less boilerplate', 'Reactive forms: explicit, testable, type-safe', 'FormGroup tracks validity of all child controls'] },
  { title: 'FormArray — Dynamic Fields',  route: '/angular/form-array',         badge: 'Forms',     available: true,
    description: 'Add/remove form fields at runtime. FormArray of FormControls and FormGroups.',
    keyPoints: ['FormArray.push() / removeAt() update the form tree', 'fb.array([]) creates a typed array of controls', 'Iterate with formArray.controls in the template'] },
  { title: 'Reactive Forms + Service',    route: '/angular/todo',               badge: 'Forms',     available: true,
    description: 'FormBuilder, Validators, inject(). A real todo app wired to a signal-based service.',
    keyPoints: ['inject() replaces constructor injection', 'form.value is typed when using typed FormGroup', 'Route guard returns false to block navigation'] },
  { title: 'Zod + Reactive Forms',        route: '/angular/zod-forms',          badge: 'Forms',     available: true,
    description: 'Schema-first validation with Zod — live field checks, form-level validation, API response parsing.',
    keyPoints: ['z.infer<typeof schema> gives the TS type for free', 'safeParse returns {success, data, error} — no try/catch', 'Validate API responses at runtime to catch contract drift'] },
  { title: 'Custom Validators',           route: '/angular/custom-validators',  badge: 'Forms',     available: true,
    description: 'Sync, async, and cross-field (password match) validators — plus a debounced async uniqueness check.',
    keyPoints: ['Return null = valid, return object = invalid', 'Async validators show status: PENDING while running', 'Group validators receive the FormGroup — access all fields'] },
  { title: 'Control Value Accessor',      route: '/angular/cva',                badge: 'Forms',     available: true,
    description: 'Build a custom form control (star rating widget) that plugs into formControlName natively.',
    keyPoints: ['Implement 4 methods: writeValue, registerOnChange, registerOnTouched, setDisabledState', 'Register via NG_VALUE_ACCESSOR provider token', 'Never call onChange inside writeValue — infinite loop'] },
  { title: 'Dynamic / Schema Forms',      route: '/angular/dynamic-forms',      badge: 'Forms',     available: true,
    description: 'Build a complete form from a JSON schema at runtime — one template loop handles every field type.',
    keyPoints: ['FieldConfig schema drives both FormGroup and template', '@switch renders correct input type per field', 'Backend can control the form shape at runtime'] },
  { title: 'Multi-step Wizard Form',      route: '/angular/wizard-form',        badge: 'Forms',     available: true,
    description: 'Split complex forms into validated steps — each step independently validated before advancing.',
    keyPoints: ['One FormGroup per step — partial validation on Next', 'Back navigation never validates — free movement', 'Final submit merges all step FormGroup values'] },
  { title: 'Typed Forms Deep-Dive',       route: '/angular',                    badge: 'Forms',     available: false,
    description: 'FormGroup<T>, NonNullableFormBuilder, AbstractControl type narrowing, and FormRecord<T> — fully typed forms.',
    keyPoints: ['FormGroup<{email: FormControl<string>}> is fully typed', 'NonNullableFormBuilder avoids null in control values', 'FormRecord<T> handles dynamic key-value form structures'] },

  // ── HTTP ──────────────────────────────────────────────────────────────────
  { title: 'HTTP Client',                 route: '/angular/http',               badge: 'HTTP',      available: true,
    description: 'HttpClient, toSignal(), a logging interceptor that adds auth headers, GET + POST.',
    keyPoints: ['provideHttpClient() replaces HttpClientModule', 'Interceptors are plain functions in Angular 15+', 'toSignal(http.get<T>()) bridges Observable to signal'] },
  { title: 'HTTP Interceptors',           route: '/angular',                    badge: 'HTTP',      available: false,
    description: 'Functional HttpInterceptorFn — auth headers, request cloning, response transformation, retry on 401.',
    keyPoints: ['withInterceptors([authFn, loggingFn]) in provideHttpClient()', 'Clone the request: req.clone({ headers: ... })', 'Retry with catchError + timer + switchMap — handle token refresh'] },
  { title: 'Error Handling Patterns',     route: '/angular',                    badge: 'HTTP',      available: false,
    description: 'Global ErrorHandler, HttpErrorResponse parsing, user-facing error messages, and retry strategies.',
    keyPoints: ['Provide ErrorHandler in app.config.ts to catch all unhandled errors', 'catchError in interceptor for HTTP-specific handling', 'Retry with exponential backoff using retryWhen + delayWhen'] },

  // ── RxJS ──────────────────────────────────────────────────────────────────
  { title: 'RxJS Operators',              route: '/angular/rxjs',               badge: 'RxJS',      available: true,
    description: 'switchMap, debounceTime, BehaviorSubject, combineLatest, scan — all bridged to signals with toSignal().',
    keyPoints: ['switchMap cancels previous inner observable on new emit', 'BehaviorSubject replays latest value to new subscribers', 'toSignal() auto-unsubscribes when component is destroyed'] },

  // ── Perf ──────────────────────────────────────────────────────────────────
  { title: '@defer Blocks',               route: '/angular/defer',              badge: 'Perf',      available: true,
    description: 'Lazy-load heavy components on viewport, interaction, or a signal trigger. Three real demos.',
    keyPoints: ['@defer on viewport — loads when element scrolls into view', '@defer on interaction — loads on first click/focus', '@placeholder shows content while deferred chunk loads'] },
  { title: 'Change Detection (OnPush)',   route: '/angular/change-detection',   badge: 'Perf',      available: true,
    description: 'Default vs OnPush strategies side-by-side — see exactly which component re-renders and why.',
    keyPoints: ['Mutation (push/set property) is invisible to OnPush', 'Replace — not mutate — objects/arrays to trigger re-render', 'Signals + OnPush = zero manual markForCheck() needed'] },
  { title: 'NgOptimizedImage',            route: '/angular/ng-image',           badge: 'Perf',      available: true,
    description: 'Built-in directive that auto-adds lazy loading, prevents layout shift, and integrates with CDN loaders.',
    keyPoints: ['ngSrc replaces src — enforces width and height', 'priority sets fetchpriority="high" for LCP images', 'fill mode fills the container — no fixed dimensions needed'] },
  { title: 'Web Workers',                 route: '/angular/web-workers',        badge: 'Perf',      available: true,
    description: 'Offload CPU-intensive work to a background thread — keep the UI responsive during heavy computation.',
    keyPoints: ['Workers have no DOM access — communicate via postMessage()', 'ng generate web-worker scaffolds the worker + tsconfig', 'Comlink wraps workers with a Proxy RPC-style API'] },
  { title: 'PWA / Service Worker',        route: '/angular/pwa',                badge: 'Perf',      available: true,
    description: 'Make your app installable and offline-capable with @angular/pwa — one command sets up everything.',
    keyPoints: ['ng add @angular/pwa installs SW, manifest, icons', 'ngsw-config.json defines asset and data caching rules', 'SwUpdate.versionUpdates for "new version" prompts'] },
  { title: 'Angular DevTools',            route: '/angular',                    badge: 'Perf',      available: false,
    description: 'Profiler, Component Explorer, change detection flame charts — find and fix unnecessary re-renders.',
    keyPoints: ['Record a CD cycle to see which components checked and why', 'Components tree shows signals, inputs, and injectors', 'Flame chart width = time spent — wide bars are bottlenecks'] },
  { title: 'Bundle Optimization',         route: '/angular',                    badge: 'Perf',      available: false,
    description: 'Angular build config, budgets, source maps, esbuild, differential loading, and lazy chunk naming.',
    keyPoints: ['ng build --stats-json + webpack-bundle-analyzer reveals bloat', 'Budget exceeded warnings → split routes or defer imports', 'esbuild (default in Angular 17+) is 10× faster than webpack'] },
  { title: 'Micro-frontends',             route: '/angular',                    badge: 'Perf',      available: false,
    description: 'Native Federation with @angular-architects/native-federation — host/remote shell wiring and shared singletons.',
    keyPoints: ['Native Federation uses native ESM — no webpack required', 'Share Angular and RxJS as singletons to avoid duplicate instances', 'loadRemoteModule() loads a remote component lazily at runtime'] },

  // ── UI ────────────────────────────────────────────────────────────────────
  { title: 'Angular Material',            route: '/angular/material',           badge: 'UI',        available: true,
    description: 'Buttons, cards, tables, form fields, chips, slide toggles — real Material components.',
    keyPoints: ['All Material components are standalone — import individually', 'provideAnimationsAsync() enables animation support', 'MatFormField wraps inputs with label, hint, error slots'] },
  { title: 'Angular CDK',                 route: '/angular/cdk',                badge: 'UI',        available: true,
    description: 'Drag & drop, virtual scroll (10 000 rows), clipboard API, and BreakpointObserver.',
    keyPoints: ['cdkDrag + cdkDropList = sortable lists in minutes', 'CdkVirtualScrollViewport renders only visible rows', 'BreakpointObserver wraps matchMedia as an Observable'] },
  { title: 'Angular Animations',          route: '/angular/animations',         badge: 'UI',        available: true,
    description: 'trigger, state, transition, animate, keyframes, and stagger — all driven by signals.',
    keyPoints: [':enter/:leave trigger on @if/@for DOM changes', 'stagger() staggers list items by a delay offset', 'Angular keeps leaving elements in DOM until animation ends'] },

  // ── 3rd Party ─────────────────────────────────────────────────────────────
  { title: 'Charts (Chart.js)',           route: '/angular/charts',             badge: '3rd Party', available: true,
    description: 'Bar, line, and doughnut charts integrated with Angular using viewChild + afterNextRender.',
    keyPoints: ['afterNextRender() waits for browser paint — safe for canvas', 'Mutate chart.data then call chart.update() — never recreate', 'chart.destroy() in ngOnDestroy prevents memory leaks'] },
  { title: 'AG Grid',                     route: '/angular/ag-grid',            badge: '3rd Party', available: true,
    description: 'Enterprise data grid — sorting, filtering, custom cell renderers, row selection, CSV export.',
    keyPoints: ['columnDefs: ColDef[] configures all columns', 'GridApi obtained from (gridReady) event', 'Always pass a new array reference to trigger grid refresh'] },
  { title: 'TanStack Query',              route: '/angular/tanstack-query',     badge: '3rd Party', available: true,
    description: 'Server-state management — injectQuery, injectMutation, cache invalidation, reactive query keys.',
    keyPoints: ['Same queryKey = shared cache across components', 'enabled: false pauses a query until a condition is met', 'invalidateQueries() refetches after a successful mutation'] },
  { title: 'date-fns',                    route: '/angular/date-fns',           badge: '3rd Party', available: true,
    description: 'Tree-shakeable date utilities — format, parse, date math, formatDistance, and a mini calendar.',
    keyPoints: ['All functions are pure — inputs are never mutated', 'Always check isValid() after parsing user input', 'eachDayOfInterval() builds calendar grids in one line'] },
  { title: 'Tailwind CSS',               route: '/angular/tailwind',            badge: '3rd Party', available: true,
    description: 'Utility-first styling — class binding, responsive, dark mode, @apply, and a live component gallery.',
    keyPoints: ['Never build class names dynamically — Tailwind can\'t purge them', 'sm: md: lg: prefixes are mobile-first breakpoints', '@apply extracts repeated utilities into named classes'] },

  // ── Testing ───────────────────────────────────────────────────────────────
  { title: 'Testing',                     route: '/angular/testing',            badge: 'Testing',   available: true,
    description: 'TestBed basics, @testing-library/angular user-centric tests, HttpTestingController, signal assertions.',
    keyPoints: ['Query by role — not CSS selector — for resilient tests', 'Signal reads are synchronous — no detectChanges between assertions', 'http.verify() in afterEach catches uncaught HTTP requests'] },
  { title: 'E2E with Playwright',         route: '/angular/e2e',                badge: 'Testing',   available: true,
    description: 'Automated browser testing — real browsers, semantic locators, auto-waiting, and API mocking.',
    keyPoints: ['getByRole() is the most resilient locator type', 'Playwright auto-waits — no manual sleep() needed', 'page.route() intercepts API calls with fixture data'] },
  { title: 'Component Harnesses',         route: '/angular/harnesses',          badge: 'Testing',   available: true,
    description: 'Test components through a stable semantic API — no querySelector, no Material DOM knowledge needed.',
    keyPoints: ['Harnesses hide internal DOM structure from tests', 'MatButtonHarness, MatInputHarness ship with Material', 'Custom harnesses extend ComponentHarness'] },
  { title: 'Mock Service Worker (MSW)',   route: '/angular',                    badge: 'Testing',   available: false,
    description: 'Intercept API requests in both tests and the browser with service-worker-based mocking.',
    keyPoints: ['http.get/post handlers run in the actual service worker — no library mocking', 'Same handlers work in Jest (setupServer) and the dev browser (setupWorker)', 'passthrough() forwards specific requests to the real server'] },

  // ── Reference ─────────────────────────────────────────────────────────────
  { title: 'Angular Cheat Sheet',         route: '/angular/cheatsheet',         badge: 'Reference', available: true,
    description: 'Quick-reference for Signals API, Router, built-in Pipes, Decorators, CLI commands, and RxJS operators.',
    keyPoints: ['All signal primitives: signal, computed, effect, model', 'Router: routes, guards, resolvers, navigation', 'Most-used RxJS operators with descriptions'] },
  { title: 'Common Angular Errors',       route: '/angular/errors',             badge: 'Reference', available: true,
    description: 'Root causes and fixes for NG0100, NullInjectorError, NG0203, circular DI, hydration mismatches, and more.',
    keyPoints: ['NG0100: ExpressionChangedAfterItHasBeenChecked — use signals', 'NG0203: inject() outside injection context', 'NG0201: NullInjectorError — missing provider'] },
  { title: "What's New in Angular",       route: '/angular/whats-new',          badge: 'Reference', available: true,
    description: 'Feature timeline from v14 through v22 — standalone, signals, control flow, zoneless, resource() API.',
    keyPoints: ['v17: @if/@for/@switch + @defer blocks + signals preview', 'v19: linkedSignal(), effect() stable, input()/output() stable', 'v22: resource() GA, Incremental Hydration GA, Zoneless stable'] },
  { title: 'Mini Projects',               route: '/angular/mini-projects',      badge: 'Reference', available: true,
    description: 'Four end-to-end walkthroughs: Todo App, Weather Dashboard, Shopping Cart, and REST CRUD Dashboard.',
    keyPoints: ['Todo: signals + computed + localStorage persistence', 'Weather: resource() API + status-driven template', 'Cart: Signal Store (signalStore, withMethods, patchState)'] },
  { title: 'Learning Paths',              route: '/angular/learning-paths',     badge: 'Reference', available: true,
    description: 'Structured curriculums for Beginner, Intermediate, Advanced, and UI Engineering skill levels.',
    keyPoints: ['Beginner: signals → templates → forms → routing', 'Intermediate: OnPush → RxJS → @defer → testing', 'Advanced: Signal Store → resource() → SSR → E2E'] },
  { title: 'Interview Prep',              route: '/angular/interview-prep',     badge: 'Reference', available: true,
    description: '50+ real Angular interview questions with answers — filterable by difficulty (Junior/Mid/Senior) and topic.',
    keyPoints: ['Signals vs RxJS, change detection, zoneless', 'DI hierarchy, standalone, control flow', 'Modern signals-era Angular (v17+)'] },
  { title: 'Quiz Practice',               route: '/angular/quiz-practice',      badge: 'Reference', available: true,
    description: 'Random quiz sessions from a 50+ question bank — pick a topic and length, get instant feedback.',
    keyPoints: ['Topics: Signals, DI, Router, Forms, RxJS, Perf, Testing', 'Instant right/wrong feedback with explanations', 'Per-topic score breakdown at the end'] },
  { title: 'Design Patterns',             route: '/angular/design-patterns',    badge: 'Reference', available: true,
    description: '12 patterns for signals-era Angular — smart/presentational, signal stores, facades, DI tokens, host directives.',
    keyPoints: ['When to use AND when not to use each pattern', 'Real modern code: inject(), input(), signals', 'Common pitfalls per pattern'] },
  { title: 'Decision Guides',             route: '/angular/decision-guides',    badge: 'Reference', available: true,
    description: 'Side-by-side comparisons: Signal vs Observable, Reactive vs Template forms, @defer vs lazy routes.',
    keyPoints: ['Criteria tables with clear ✓/✗ verdicts', 'Rule-of-thumb callout per guide', '8 of the most common Angular decisions'] },
  { title: 'Glossary',                    route: '/angular/glossary',           badge: 'Reference', available: true,
    description: 'A–Z glossary of 50+ Angular terms — hydration, zoneless, injector hierarchy, linkedSignal.',
    keyPoints: ['Searchable with letter quick-nav', 'Plain-English 1-3 sentence definitions', 'See-also links into the relevant topic page'] },
];

const BADGE_GROUPS = ['All', 'Core', 'Forms', 'UI', '3rd Party', 'DI', 'State', 'Router', 'HTTP', 'RxJS', 'Perf', 'Testing', 'Reference'] as const;

const BADGE_CSS: Record<string, string> = {
  'Core': 'core', 'Forms': 'forms', 'UI': 'ui', 'DI': 'di',
  'State': 'state', 'Router': 'router', 'HTTP': 'http', 'RxJS': 'rxjs',
  'Perf': 'perf', '3rd Party': 'third', 'Testing': 'testing', 'Reference': 'ref',
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  activeFilter = signal<string>('All');
  expandedCard = signal<string | null>(null);

  topics = computed(() => {
    const f = this.activeFilter();
    return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f);
  });

  filters = BADGE_GROUPS;

  counts = computed(() => {
    const map: Record<string, number> = { All: ALL_TOPICS.length };
    for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1;
    return map;
  });

  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount     = ALL_TOPICS.length;

  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'core'); }
  toggleCard(key: string, event: Event) {
    event.preventDefault();
    this.expandedCard.update(c => c === key ? null : key);
  }
}
