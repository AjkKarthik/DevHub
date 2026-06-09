import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  title: string;
  description: string;
  route: string;
  badge: string;
  keyPoints: string[];
}

const ALL_TOPICS: Topic[] = [
  // Core
  {
    title: 'Signals & State', route: '/angular/counter', badge: 'Core',
    description: 'signal(), computed(), effect(), @if/@for control flow. The foundation of modern Angular.',
    keyPoints: ['signal() is lazy — only recomputes when read', 'computed() memoises automatically', 'effect() re-runs when any signal it reads changes'],
  },
  {
    title: 'Template Syntax', route: '/angular/templates', badge: 'Core',
    description: 'Interpolation, property/event/two-way binding, template refs, safe navigation, pipes, and async.',
    keyPoints: ['[prop] binds DOM properties, not HTML attributes', '@if/@for are built-in — no import needed', 'async pipe auto-unsubscribes on destroy'],
  },
  {
    title: 'Directives', route: '/angular/directives', badge: 'Core',
    description: 'NgClass, NgStyle, custom attribute directive (tooltip), and custom structural directive (repeat).',
    keyPoints: ['Attribute directives style/modify — no DOM change', 'Structural directives add/remove DOM nodes', 'Use Renderer2, never direct DOM manipulation'],
  },
  {
    title: 'Lifecycle Hooks', route: '/angular/lifecycle', badge: 'Core',
    description: 'ngOnInit, ngOnChanges, ngOnDestroy, ViewChild, and afterNextRender — with a live log of each call.',
    keyPoints: ['ngOnChanges fires before ngOnInit', 'viewChild() returns a signal — no ngAfterViewInit needed', 'afterNextRender() is ideal for third-party DOM libraries'],
  },
  {
    title: 'Pipes', route: '/angular/pipes', badge: 'Core',
    description: 'date, currency, number, percent, case, slice, JSON, async, and the custom truncate pipe — all interactive.',
    keyPoints: ['Pure pipes only rerun when input reference changes', 'async pipe subscribes and auto-unsubscribes', 'Custom pipe: implement PipeTransform.transform()'],
  },
  {
    title: 'Input / Output Signals', route: '/angular/parent-child', badge: 'Core',
    description: 'input() and output() — the modern replacement for @Input()/@Output(). Parent-child data flow.',
    keyPoints: ['input() is a read-only signal in the child', 'output() replaces EventEmitter — no Subject needed', 'model() = two-way signal binding shorthand'],
  },
  {
    title: 'Content Projection', route: '/angular/content-projection', badge: 'Core',
    description: 'ng-content, multi-slot projection with selectors, ngProjectAs, and ng-container/ng-template patterns.',
    keyPoints: ['select= targets specific children via CSS selector', 'Projected content belongs to the parent\'s CD context', 'ng-container adds zero DOM nodes'],
  },
  // DI & Architecture
  {
    title: 'Dependency Injection', route: '/angular/di', badge: 'DI',
    description: 'Root singleton vs scoped service, InjectionToken with factory, and hierarchical DI resolution.',
    keyPoints: ['providedIn: "root" = tree-shakeable singleton', 'providers: [] in @Component = per-instance scope', 'Use InjectionToken for non-class values'],
  },
  {
    title: 'Signal Store Pattern', route: '/angular/store', badge: 'State',
    description: 'A shopping cart built with a plain injectable signal store. No NgRx required.',
    keyPoints: ['@Injectable service + signals = lightweight store', 'computed() derives state (totals, counts)', 'No NgRx needed for most apps'],
  },
  // Router
  {
    title: 'Routing', route: '/angular/routing', badge: 'Router',
    description: 'Route params, query params, programmatic navigation, canActivate guard, lazy loading, and routerLink.',
    keyPoints: ['loadComponent() lazy-loads on navigation', 'CanActivateFn returns boolean or UrlTree to redirect', 'withComponentInputBinding() maps params to input()'],
  },
  // Forms
  {
    title: 'Forms: Template vs Reactive', route: '/angular/forms', badge: 'Forms',
    description: 'Both form approaches side-by-side. See their trade-offs on the same form.',
    keyPoints: ['Template forms: simple, less boilerplate', 'Reactive forms: explicit, testable, type-safe', 'FormGroup tracks validity of all child controls'],
  },
  {
    title: 'FormArray — Dynamic Fields', route: '/angular/form-array', badge: 'Forms',
    description: 'Add/remove form fields at runtime. FormArray of FormControls and FormGroups.',
    keyPoints: ['FormArray.push() / removeAt() update the form tree', 'fb.array([]) creates a typed array of controls', 'Iterate with formArray.controls in the template'],
  },
  {
    title: 'Reactive Forms + Service', route: '/angular/todo', badge: 'Forms',
    description: 'FormBuilder, Validators, inject(). A real todo app wired to a signal-based service. Protected by a route guard.',
    keyPoints: ['inject() replaces constructor injection', 'form.value is typed when using typed FormGroup', 'Route guard returns false to block navigation'],
  },
  {
    title: 'Zod + Reactive Forms', route: '/angular/zod-forms', badge: 'Forms',
    description: 'Schema-first validation with Zod — live field checks, form-level validation, API response parsing.',
    keyPoints: ['z.infer<typeof schema> gives the TS type for free', 'safeParse returns {success, data, error} — no try/catch', 'Validate API responses at runtime to catch contract drift'],
  },
  {
    title: 'Custom Validators', route: '/angular/custom-validators', badge: 'Forms',
    description: 'Sync, async, and cross-field (password match) validators — plus a debounced async uniqueness check.',
    keyPoints: ['Return null = valid, return object = invalid', 'Async validators show status: PENDING while running', 'Group validators receive the FormGroup — access all fields'],
  },
  {
    title: 'Control Value Accessor', route: '/angular/cva', badge: 'Forms',
    description: 'Build a custom form control (star rating widget) that plugs into formControlName natively.',
    keyPoints: ['Implement 4 methods: writeValue, registerOnChange, registerOnTouched, setDisabledState', 'Register via NG_VALUE_ACCESSOR provider token', 'Never call onChange inside writeValue — infinite loop'],
  },
  // HTTP & Async
  {
    title: 'HTTP Client', route: '/angular/http', badge: 'HTTP',
    description: 'HttpClient, toSignal(), a logging interceptor that adds auth headers, GET + POST.',
    keyPoints: ['provideHttpClient() replaces HttpClientModule', 'Interceptors are plain functions in Angular 15+', 'toSignal(http.get<T>()) bridges Observable to signal'],
  },
  {
    title: 'RxJS Operators', route: '/angular/rxjs', badge: 'RxJS',
    description: 'switchMap, debounceTime, BehaviorSubject, combineLatest, scan — all bridged to signals with toSignal().',
    keyPoints: ['switchMap cancels previous inner observable on new emit', 'BehaviorSubject replays latest value to new subscribers', 'toSignal() auto-unsubscribes when component is destroyed'],
  },
  // Performance
  {
    title: '@defer Blocks', route: '/angular/defer', badge: 'Perf',
    description: 'Lazy-load heavy components on viewport, interaction, or a signal trigger. Three real demos.',
    keyPoints: ['@defer on viewport — loads when element scrolls into view', '@defer on interaction — loads on first click/focus', '@placeholder shows content while deferred chunk loads'],
  },
  {
    title: 'Change Detection (OnPush)', route: '/angular/change-detection', badge: 'Perf',
    description: 'Default vs OnPush strategies side-by-side — see exactly which component re-renders and why.',
    keyPoints: ['Mutation (push/set property) is invisible to OnPush', 'Replace — not mutate — objects/arrays to trigger re-render', 'Signals + OnPush = zero manual markForCheck() needed'],
  },
  // UI
  {
    title: 'Angular Material', route: '/angular/material', badge: 'UI',
    description: 'Buttons, cards, tables, form fields, chips, slide toggles — real Material components.',
    keyPoints: ['All Material components are standalone — import individually', 'provideAnimationsAsync() enables animation support', 'MatFormField wraps inputs with label, hint, error slots'],
  },
  {
    title: 'Angular CDK', route: '/angular/cdk', badge: 'UI',
    description: 'Drag & drop, virtual scroll (10 000 rows), clipboard API, and BreakpointObserver.',
    keyPoints: ['cdkDrag + cdkDropList = sortable lists in minutes', 'CdkVirtualScrollViewport renders only visible rows', 'BreakpointObserver wraps matchMedia as an Observable'],
  },
  {
    title: 'Angular Animations', route: '/angular/animations', badge: 'UI',
    description: 'trigger, state, transition, animate, keyframes, and stagger — all driven by signals.',
    keyPoints: [':enter/:leave trigger on @if/@for DOM changes', 'stagger() staggers list items by a delay offset', 'Angular keeps leaving elements in DOM until animation ends'],
  },
  // 3rd Party
  {
    title: 'Charts (Chart.js)', route: '/angular/charts', badge: '3rd Party',
    description: 'Bar, line, and doughnut charts integrated with Angular using viewChild + afterNextRender.',
    keyPoints: ['afterNextRender() waits for browser paint — safe for canvas', 'Mutate chart.data then call chart.update() — never recreate', 'chart.destroy() in ngOnDestroy prevents memory leaks'],
  },
  {
    title: 'AG Grid', route: '/angular/ag-grid', badge: '3rd Party',
    description: 'Enterprise data grid — sorting, filtering, custom cell renderers, row selection, CSV export.',
    keyPoints: ['columnDefs: ColDef[] configures all columns', 'GridApi obtained from (gridReady) event', 'Always pass a new array reference to trigger grid refresh'],
  },
  {
    title: 'TanStack Query', route: '/angular/tanstack-query', badge: '3rd Party',
    description: 'Server-state management — injectQuery, injectMutation, cache invalidation, reactive query keys.',
    keyPoints: ['Same queryKey = shared cache across components', 'enabled: false pauses a query until a condition is met', 'invalidateQueries() refetches after a successful mutation'],
  },
  {
    title: 'date-fns', route: '/angular/date-fns', badge: '3rd Party',
    description: 'Tree-shakeable date utilities — format, parse, date math, formatDistance, and a mini calendar.',
    keyPoints: ['All functions are pure — inputs are never mutated', 'Always check isValid() after parsing user input', 'eachDayOfInterval() builds calendar grids in one line'],
  },
  {
    title: 'Tailwind CSS', route: '/angular/tailwind', badge: '3rd Party',
    description: 'Utility-first styling — class binding, responsive, dark mode, @apply, and a live component gallery.',
    keyPoints: ['Never build class names dynamically — Tailwind can\'t purge them', 'sm: md: lg: prefixes are mobile-first breakpoints', '@apply extracts repeated utilities into named classes'],
  },
  // Testing
  {
    title: 'Testing', route: '/angular/testing', badge: 'Testing',
    description: 'TestBed basics, @testing-library/angular user-centric tests, HttpTestingController, signal assertions.',
    keyPoints: ['Query by role — not CSS selector — for resilient tests', 'Signal reads are synchronous — no detectChanges between assertions', 'http.verify() in afterEach catches uncaught HTTP requests'],
  },
  // Modern APIs
  {
    title: 'resource() API', route: '/angular/resource-api', badge: 'Core',
    description: 'Angular\'s built-in reactive async primitive — signal-aware data fetching with loading, error, and status signals.',
    keyPoints: ['request() re-runs loader when signals change', 'isLoading(), value(), error() are all signals', 'httpResource() integrates with HttpClient + interceptors', 'resource.reload() forces a fresh fetch without changing request'],
  },
  {
    title: 'NgRx Signals Store', route: '/angular/ngrx-signals', badge: 'State',
    description: 'Signal-based state management — signalStore(), withState(), withComputed(), withMethods(), withEntities().',
    keyPoints: ['signalStore() composes features declaratively', 'patchState() merges partial state updates', 'withEntities() adds normalised entity collections', 'rxMethod() bridges RxJS async flows into the store'],
  },
  {
    title: 'DestroyRef + takeUntilDestroyed', route: '/angular/destroy-ref', badge: 'Core',
    description: 'Modern RxJS cleanup — auto-unsubscribe without ngOnDestroy or Subject destroy$ patterns.',
    keyPoints: ['takeUntilDestroyed() auto-injects DestroyRef in constructor', 'Pass destroyRef explicitly for use inside methods', 'DestroyRef.onDestroy() registers cleanup callbacks', 'Works in services, directives, and functional guards'],
  },
  {
    title: 'linkedSignal()', route: '/angular/linked-signal', badge: 'Core',
    description: 'A writable signal that resets to a computed default when its source changes — perfect for dependent dropdowns.',
    keyPoints: ['Writable unlike computed() — user can override the value', 'Auto-resets when source signal changes', 'Short form or long form with source + computation', 'Available from Angular 19+'],
  },
  {
    title: 'Zoneless Angular', route: '/angular/zoneless', badge: 'Perf',
    description: 'Remove Zone.js for smaller bundles and faster rendering — signals drive all change detection.',
    keyPoints: ['provideExperimentalZonelessChangeDetection() in app.config.ts', 'Signals notify Angular scheduler directly — no Zone.js needed', 'Remove zone.js from polyfills for bundle size reduction', 'All third-party DOM libs must be wrapped with ngZone.run()'],
  },
  // Forms
  {
    title: 'Dynamic / Schema Forms', route: '/angular/dynamic-forms', badge: 'Forms',
    description: 'Build a complete form from a JSON schema at runtime — one template loop handles every field type.',
    keyPoints: ['FieldConfig schema drives both FormGroup and template', '@switch renders correct input type per field', 'Validators applied programmatically from schema', 'Backend can control the form shape at runtime'],
  },
  {
    title: 'Multi-step Wizard Form', route: '/angular/wizard-form', badge: 'Forms',
    description: 'Split complex forms into validated steps — each step independently validated before advancing.',
    keyPoints: ['One FormGroup per step — partial validation on Next', 'Back navigation never validates — free movement', 'Final submit merges all step FormGroup values', 'Save to localStorage for refresh resilience'],
  },
  // Router
  {
    title: 'Route Resolvers', route: '/angular/route-resolvers', badge: 'Router',
    description: 'Pre-fetch data before a component renders using ResolveFn — component always has data on init.',
    keyPoints: ['ResolveFn returns T, Promise<T>, or Observable<T>', 'Component activates only after resolver completes', 'withComponentInputBinding() maps resolved data to input()', 'Multiple resolvers on one route run in parallel'],
  },
  {
    title: 'Preloading Strategies', route: '/angular/preloading', badge: 'Perf',
    description: 'Silently prefetch lazy-loaded route bundles after initial load — eliminating navigation delay.',
    keyPoints: ['withPreloading(PreloadAllModules) in provideRouter()', 'Custom PreloadingStrategy for selective preloading', 'QuicklinkStrategy preloads visible routerLink routes', 'Check Network tab to see background chunk fetches'],
  },
  // Testing
  {
    title: 'E2E with Playwright', route: '/angular/e2e', badge: 'Testing',
    description: 'Automated browser testing — real browsers, semantic locators, auto-waiting, and API mocking.',
    keyPoints: ['getByRole() is the most resilient locator type', 'Playwright auto-waits — no manual sleep() needed', 'page.route() intercepts API calls with fixture data', 'Traces record screenshots + network for CI debugging'],
  },
  {
    title: 'Component Harnesses', route: '/angular/harnesses', badge: 'Testing',
    description: 'Test components through a stable semantic API — no querySelector, no Material DOM knowledge needed.',
    keyPoints: ['Harnesses hide internal DOM structure from tests', 'MatButtonHarness, MatInputHarness ship with Material', 'Custom harnesses extend ComponentHarness', 'Works with TestBed (unit) and Playwright (E2E)'],
  },
  // Platform
  {
    title: 'NgOptimizedImage', route: '/angular/ng-image', badge: 'Perf',
    description: 'Built-in directive that auto-adds lazy loading, prevents layout shift, and integrates with CDN loaders.',
    keyPoints: ['ngSrc replaces src — enforces width and height', 'priority sets fetchpriority="high" for LCP images', 'fill mode fills the container — no fixed dimensions needed', 'provideCloudinaryLoader() / provideImgixLoader() for CDN'],
  },
  {
    title: 'Web Workers', route: '/angular/web-workers', badge: 'Perf',
    description: 'Offload CPU-intensive work to a background thread — keep the UI responsive during heavy computation.',
    keyPoints: ['Workers have no DOM access — communicate via postMessage()', 'ng generate web-worker scaffolds the worker + tsconfig', 'Transferable objects (ArrayBuffer) transfer zero-copy', 'Comlink wraps workers with a Proxy RPC-style API'],
  },
  {
    title: 'PWA / Service Worker', route: '/angular/pwa', badge: 'Perf',
    description: 'Make your app installable and offline-capable with @angular/pwa — one command sets up everything.',
    keyPoints: ['ng add @angular/pwa installs SW, manifest, icons', 'ngsw-config.json defines asset and data caching rules', 'SwUpdate.versionUpdates for "new version" prompts', 'HTTPS required — use localhost for local development'],
  },
  {
    title: 'i18n / Transloco', route: '/angular/i18n', badge: 'Core',
    description: 'Runtime language switching without rebuilding — Transloco for multi-locale Angular apps.',
    keyPoints: ['provideTransloco() with availableLangs and defaultLang', 'Translation files are JSON — lazy-loaded per locale', 'TranslocoService.setActiveLang() switches at runtime', 'Intl.DateTimeFormat for locale-aware date/number formatting'],
  },
  {
    title: 'SSR + Hydration', route: '/angular/ssr', badge: 'Perf',
    description: 'Server-side rendering for faster first paint and better SEO — with hydration to avoid layout flash.',
    keyPoints: ['ng add @angular/ssr sets up Express server output', 'provideClientHydration() reuses server HTML — no flash', 'isPlatformBrowser() guards localStorage/window access', 'withEventReplay() captures events before hydration completes'],
  },
  // Reference
  {
    title: 'Angular Cheat Sheet', route: '/angular/cheatsheet', badge: 'Reference',
    description: 'Quick-reference for Signals API, Router, built-in Pipes, Decorators, CLI commands, and RxJS operators.',
    keyPoints: ['All signal primitives: signal, computed, effect, model', 'Router: routes, guards, resolvers, navigation', 'Most-used RxJS operators with descriptions', 'CLI commands for generate, build, test, update'],
  },
  {
    title: 'Common Angular Errors', route: '/angular/errors', badge: 'Reference',
    description: 'Root causes and fixes for NG0100, NullInjectorError, NG0203, circular DI, hydration mismatches, and more.',
    keyPoints: ['NG0100: ExpressionChangedAfterItHasBeenChecked — use signals', 'NG0203: inject() outside injection context', 'NG0201: NullInjectorError — missing provider', 'Each error shows Bad code vs Fix side-by-side'],
  },
  {
    title: "What's New in Angular", route: '/angular/whats-new', badge: 'Reference',
    description: 'Feature timeline from v14 through v22 — standalone, signals, control flow, zoneless, resource() API, and more.',
    keyPoints: ['v17: @if/@for/@switch + @defer blocks + signals preview', 'v16: Required inputs, DestroyRef, afterNextRender', 'v19: linkedSignal(), effect() stable, input()/output() stable', 'v22: resource() GA, Incremental Hydration GA, Zoneless stable'],
  },
  {
    title: 'Mini Projects', route: '/angular/mini-projects', badge: 'Reference',
    description: 'Four end-to-end walkthroughs: Todo App, Weather Dashboard, Shopping Cart, and REST CRUD Dashboard.',
    keyPoints: ['Todo: signals + computed + localStorage persistence', 'Weather: resource() API + status-driven template', 'Cart: Signal Store (signalStore, withMethods, patchState)', 'CRUD: HttpClient + interceptors + Reactive Forms'],
  },
  {
    title: 'Learning Paths', route: '/angular/learning-paths', badge: 'Reference',
    description: 'Structured curriculums for Beginner, Intermediate, Advanced, and UI Engineering skill levels.',
    keyPoints: ['Beginner: signals → templates → forms → routing', 'Intermediate: OnPush → RxJS → @defer → testing', 'Advanced: Signal Store → resource() → SSR → E2E', 'UI: Material → CDK → Tailwind → animations'],
  },
];

const BADGE_GROUPS = ['All', 'Core', 'Forms', 'UI', '3rd Party', 'DI', 'State', 'Router', 'HTTP', 'RxJS', 'Perf', 'Testing', 'Reference'] as const;

const BADGE_CSS: Record<string, string> = {
  'Core': 'core', 'Forms': 'forms', 'UI': 'ui', 'DI': 'di',
  'State': 'state', 'Router': 'router', 'HTTP': 'http', 'RxJS': 'rxjs',
  'Perf': 'perf', '3rd Party': 'third', 'Testing': 'testing', 'Reference': 'ref',
};

@Component({
  selector: 'app-home',
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

  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'core'); }
  toggleCard(route: string, event: Event) {
    event.preventDefault();
    this.expandedCard.update(c => c === route ? null : route);
  }
}
