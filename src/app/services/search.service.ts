import { Injectable, signal, computed } from '@angular/core';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export interface SearchEntry {
  route: string;
  title: string;
  section: string;
  difficulty: Difficulty;
  keywords: string;
}

export const SEARCH_INDEX: SearchEntry[] = [
  { route: 'counter',            title: 'Signals & State',          section: 'Core',        difficulty: 'beginner',     keywords: 'signal computed effect toSignal writableSignal reactive state management counter cart model' },
  { route: 'templates',          title: 'Template Syntax',          section: 'Core',        difficulty: 'beginner',     keywords: 'interpolation binding ngModel event two-way property template syntax' },
  { route: 'directives',         title: 'Directives',               section: 'Core',        difficulty: 'beginner',     keywords: 'ngClass ngStyle attribute structural directive hostListener hostBinding custom' },
  { route: 'lifecycle',          title: 'Lifecycle Hooks',          section: 'Core',        difficulty: 'beginner',     keywords: 'ngOnInit ngOnDestroy ngOnChanges ngAfterViewInit afterNextRender effect destroyRef' },
  { route: 'pipes',              title: 'Pipes',                    section: 'Core',        difficulty: 'beginner',     keywords: 'date currency number percent uppercase lowercase async custom pipe transform' },
  { route: 'di',                 title: 'Dependency Injection',     section: 'Core',        difficulty: 'intermediate', keywords: 'inject providedIn inject token InjectionToken service provider factory' },
  { route: 'parent-child',       title: 'Input / Output',           section: 'Core',        difficulty: 'beginner',     keywords: 'input output model viewChild viewChildren EventEmitter emit parent child component communication' },
  { route: 'content-projection', title: 'Content Projection',       section: 'Core',        difficulty: 'intermediate', keywords: 'ng-content contentChild select slot projected' },
  { route: 'change-detection',   title: 'Change Detection',         section: 'Core',        difficulty: 'intermediate', keywords: 'OnPush Default zone zoneless ChangeDetectorRef markForCheck detectChanges' },
  { route: 'animations',         title: 'Animations',               section: 'Core',        difficulty: 'intermediate', keywords: 'trigger state transition animate keyframes style query stagger BrowserAnimationsModule' },
  { route: 'forms',              title: 'Template vs Reactive Forms', section: 'Forms',     difficulty: 'beginner',     keywords: 'forms reactive template FormBuilder FormControl FormGroup ngModel validators' },
  { route: 'form-array',         title: 'FormArray',                section: 'Forms',       difficulty: 'intermediate', keywords: 'FormArray dynamic fields add remove array nested group' },
  { route: 'todo',               title: 'Todo App (guarded)',        section: 'Forms',       difficulty: 'beginner',     keywords: 'todo guard canActivate authGuard list filter complete remove' },
  { route: 'zod-forms',          title: 'Zod Validation',           section: 'Forms',       difficulty: 'advanced',     keywords: 'zod schema validation parse safeParse union discriminated' },
  { route: 'custom-validators',  title: 'Custom Validators',        section: 'Forms',       difficulty: 'intermediate', keywords: 'validator ValidatorFn AsyncValidator cross-field password match' },
  { route: 'cva',                title: 'Control Value Accessor',   section: 'Forms',       difficulty: 'advanced',     keywords: 'ControlValueAccessor writeValue registerOnChange registerOnTouched NG_VALUE_ACCESSOR' },
  { route: 'dynamic-forms',      title: 'Dynamic Forms',            section: 'Forms',       difficulty: 'advanced',     keywords: 'schema driven dynamic form config fields runtime generated' },
  { route: 'wizard-form',        title: 'Wizard / Multi-step Form', section: 'Forms',       difficulty: 'intermediate', keywords: 'wizard stepper multi-step form step validation back next submit' },
  { route: 'http',               title: 'HTTP Client',              section: 'Advanced',    difficulty: 'intermediate', keywords: 'HttpClient GET POST PUT DELETE interceptor retry catchError pipe operator' },
  { route: 'routing',            title: 'Routing',                  section: 'Advanced',    difficulty: 'intermediate', keywords: 'router route navigate RouterLink lazy loading guards resolver params query fragment' },
  { route: 'defer',              title: '@defer Blocks',            section: 'Advanced',    difficulty: 'intermediate', keywords: 'defer lazy load bundle viewport interaction idle when prefetch placeholder loading error' },
  { route: 'store',              title: 'Signal Store',             section: 'Advanced',    difficulty: 'advanced',     keywords: 'signalStore patchState withState withComputed withMethods EntityState ngrx' },
  { route: 'rxjs',               title: 'RxJS Operators',           section: 'Advanced',    difficulty: 'intermediate', keywords: 'switchMap mergeMap concatMap exhaustMap debounceTime distinctUntilChanged combineLatest forkJoin Subject BehaviorSubject' },
  { route: 'testing',            title: 'Unit Testing',             section: 'Advanced',    difficulty: 'intermediate', keywords: 'TestBed spec jasmine jest karma fixture component testing service mock spy' },
  { route: 'route-resolvers',    title: 'Route Resolvers',          section: 'Advanced',    difficulty: 'intermediate', keywords: 'resolver ResolveFn data preload named outlet withComponentInputBinding' },
  { route: 'preloading',         title: 'Preloading Strategies',    section: 'Advanced',    difficulty: 'intermediate', keywords: 'PreloadAllModules NoPreloading QuicklinkStrategy preload strategy lazy bundle' },
  { route: 'material',           title: 'Angular Material',         section: 'UI',          difficulty: 'beginner',     keywords: 'material mat button card dialog snackbar table paginator form field chip autocomplete' },
  { route: 'charts',             title: 'Charts (Chart.js)',        section: 'UI',          difficulty: 'intermediate', keywords: 'chart bar line pie doughnut scatter canvas chartjs ngx-charts' },
  { route: 'cdk',                title: 'Angular CDK',              section: 'UI',          difficulty: 'intermediate', keywords: 'cdk drag drop virtual scroll overlay portal clipboard focus trap' },
  { route: 'ag-grid',            title: 'AG Grid',                  section: 'UI',          difficulty: 'intermediate', keywords: 'grid table ag-grid column filter sort paginate row cell' },
  { route: 'tanstack-query',     title: 'TanStack Query',           section: 'UI',          difficulty: 'intermediate', keywords: 'query cache refetch stale mutation tanstack angular-query' },
  { route: 'date-fns',           title: 'date-fns',                 section: 'UI',          difficulty: 'beginner',     keywords: 'date format parse add subtract compare date-fns calendar locale' },
  { route: 'tailwind',           title: 'Tailwind CSS',             section: 'UI',          difficulty: 'beginner',     keywords: 'tailwind utility class responsive dark mode flex grid' },
  { route: 'resource-api',       title: 'resource() API',           section: 'Modern APIs', difficulty: 'advanced',     keywords: 'resource rxResource signal async http reactive linked computed' },
  { route: 'ngrx-signals',       title: 'NgRx Signals',             section: 'Modern APIs', difficulty: 'advanced',     keywords: 'ngrx signals store entity collection selectEntity patchEntity addEntity' },
  { route: 'destroy-ref',        title: 'DestroyRef',               section: 'Modern APIs', difficulty: 'intermediate', keywords: 'DestroyRef inject onDestroy takeUntilDestroyed cleanup' },
  { route: 'linked-signal',      title: 'linkedSignal()',           section: 'Modern APIs', difficulty: 'advanced',     keywords: 'linkedSignal derived writable computed source update' },
  { route: 'zoneless',           title: 'Zoneless Angular',         section: 'Modern APIs', difficulty: 'advanced',     keywords: 'zoneless zone.js provideExperimentalZonelessChangeDetection signal coalescing' },
  { route: 'e2e',                title: 'E2E Testing (Playwright)',  section: 'Testing',     difficulty: 'advanced',     keywords: 'playwright e2e end-to-end browser automation test page selector' },
  { route: 'harnesses',          title: 'Component Harnesses',      section: 'Testing',     difficulty: 'advanced',     keywords: 'TestHarness HarnessLoader getHarness MatButtonHarness component testing' },
  { route: 'ng-image',           title: 'NgOptimizedImage',         section: 'Platform',    difficulty: 'beginner',     keywords: 'NgOptimizedImage image LCP priority srcset width height' },
  { route: 'web-workers',        title: 'Web Workers',              section: 'Platform',    difficulty: 'advanced',     keywords: 'worker thread parallel background computation postMessage' },
  { route: 'pwa',                title: 'PWA / Service Worker',     section: 'Platform',    difficulty: 'advanced',     keywords: 'PWA service worker cache offline install manifest ngsw' },
  { route: 'i18n',               title: 'i18n / Localization',      section: 'Platform',    difficulty: 'intermediate', keywords: 'i18n l10n locale translate pipe LOCALE_ID angular i18n' },
  { route: 'ssr',                title: 'SSR + Hydration',          section: 'Platform',    difficulty: 'advanced',     keywords: 'SSR server side rendering hydration universal transferState isPlatformBrowser' },
  // New pages
  { route: 'cheatsheet',         title: 'Angular Cheat Sheet',      section: 'Reference',   difficulty: 'beginner',     keywords: 'cheat sheet quick reference signals router forms pipes directives' },
  { route: 'errors',             title: 'Common Errors Guide',      section: 'Reference',   difficulty: 'beginner',     keywords: 'errors NG0100 ExpressionChanged NullInjector NG0203 circular dependency debug' },
  { route: 'whats-new',          title: "What's New in Angular",    section: 'Reference',   difficulty: 'beginner',     keywords: 'changelog new features v14 v15 v16 v17 v18 v19 v20 signals standalone control flow' },
  { route: 'mini-projects',      title: 'Mini Projects',            section: 'Projects',    difficulty: 'intermediate', keywords: 'project todo weather shopping cart CRUD Angular full app build' },
  { route: 'learning-paths',     title: 'Learning Paths',           section: 'Projects',    difficulty: 'beginner',     keywords: 'path roadmap beginner intermediate advanced curriculum sequence' },
  // ── C# ──────────────────────────────────────────────────────────────────────
  { route: 'csharp-basics',               title: 'Variables & Types',           section: 'C# Fundamentals', difficulty: 'beginner',     keywords: 'csharp variables types var const string int bool operator control flow if switch for foreach while' },
  { route: 'csharp-fields',               title: 'Fields & Constants',          section: 'C# Fundamentals', difficulty: 'beginner',     keywords: 'csharp fields readonly static const backing field instance' },
  { route: 'csharp-methods',              title: 'Methods',                     section: 'C# Fundamentals', difficulty: 'beginner',     keywords: 'csharp methods overloading ref out in optional named args expression body local function' },
  { route: 'csharp-type-conversion',      title: 'Type Conversion',             section: 'C# Fundamentals', difficulty: 'intermediate', keywords: 'csharp cast as is checked unchecked Convert TryParse implicit explicit operator' },
  { route: 'csharp-constructors',         title: 'Constructors',                section: 'C# Fundamentals', difficulty: 'beginner',     keywords: 'csharp constructor this base chaining static primary C#12' },
  { route: 'csharp-properties-indexers',  title: 'Properties & Indexers',       section: 'C# Fundamentals', difficulty: 'beginner',     keywords: 'csharp property auto-property init required indexer get set expression-bodied' },
  { route: 'csharp-namespaces',           title: 'Namespaces & Usings',         section: 'C# Fundamentals', difficulty: 'beginner',     keywords: 'csharp namespace using global file-scoped alias static using C#10' },
  { route: 'csharp-oop',                  title: 'Classes & OOP',               section: 'C# OOP',          difficulty: 'beginner',     keywords: 'csharp class object encapsulation inheritance polymorphism abstract interface access modifier' },
  { route: 'csharp-inheritance',          title: 'Inheritance & Overriding',    section: 'C# OOP',          difficulty: 'intermediate', keywords: 'csharp inherit virtual override sealed base new hiding polymorphism' },
  { route: 'csharp-abstract-interfaces',  title: 'Abstract & Interfaces',       section: 'C# OOP',          difficulty: 'intermediate', keywords: 'csharp abstract interface default implementation explicit contract multiple' },
  { route: 'csharp-static-enums',         title: 'Static, Partial & Enums',     section: 'C# OOP',          difficulty: 'beginner',     keywords: 'csharp static partial enum Flags TryParse utility class' },
  { route: 'csharp-structures',           title: 'Structures',                  section: 'C# OOP',          difficulty: 'intermediate', keywords: 'csharp struct value type readonly ref struct Span record struct stack allocation' },
  { route: 'csharp-system-object',        title: 'System.Object',               section: 'C# OOP',          difficulty: 'intermediate', keywords: 'csharp object ToString Equals GetHashCode GetType ReferenceEquals boxing' },
  { route: 'csharp-records',              title: 'Records & Structs',           section: 'C# Modern',       difficulty: 'intermediate', keywords: 'csharp record immutable with expression value equality init record struct' },
  { route: 'csharp-generics',             title: 'Generics',                    section: 'C# Modern',       difficulty: 'intermediate', keywords: 'csharp generic type parameter constraint where covariance contravariance INumber<T>' },
  { route: 'csharp-null-safety',          title: 'Null Safety',                 section: 'C# Safety',       difficulty: 'intermediate', keywords: 'csharp nullable reference type ?. ?? ??= ThrowIfNull NRT nullable value type' },
  { route: 'csharp-pattern-matching',     title: 'Pattern Matching',            section: 'C# Modern',       difficulty: 'intermediate', keywords: 'csharp pattern switch expression is property positional list when and or not guard' },
  { route: 'csharp-extension-methods',    title: 'Extension Methods',           section: 'C# Modern',       difficulty: 'intermediate', keywords: 'csharp extension method static this fluent LINQ custom type' },
  { route: 'csharp-tuples',               title: 'Tuples & Anonymous Types',    section: 'C# Modern',       difficulty: 'beginner',     keywords: 'csharp tuple ValueTuple named fields deconstruction discard anonymous type LINQ' },
  { route: 'csharp-arrays',               title: 'Arrays',                      section: 'C# Data',         difficulty: 'beginner',     keywords: 'csharp array jagged multidimensional Sort Reverse Span slice' },
  { route: 'csharp-collections',          title: 'Collections',                 section: 'C# Data',         difficulty: 'intermediate', keywords: 'csharp List Dictionary HashSet Queue Stack IEnumerable Span ImmutableList' },
  { route: 'csharp-linq',                 title: 'LINQ',                        section: 'C# Data',         difficulty: 'intermediate', keywords: 'csharp linq Where Select GroupBy OrderBy Join deferred execution aggregate FirstOrDefault' },
  { route: 'csharp-strings-datetime',     title: 'Strings, DateTime & Math',    section: 'C# Data',         difficulty: 'beginner',     keywords: 'csharp string StringBuilder raw string DateOnly TimeOnly DateTime Math interpolation' },
  { route: 'csharp-io-serialization',     title: 'I/O & Serialization',         section: 'C# Data',         difficulty: 'intermediate', keywords: 'csharp File stream async IO System.Text.Json JsonSerializer serialize deserialize' },
  { route: 'csharp-gc-disposable',        title: 'GC & IDisposable',            section: 'C# Advanced',     difficulty: 'advanced',     keywords: 'csharp GC IDisposable using dispose finalizer WeakReference IAsyncDisposable memory' },
  { route: 'csharp-threading',            title: 'Threading',                   section: 'C# Advanced',     difficulty: 'advanced',     keywords: 'csharp Thread ThreadPool lock Monitor Interlocked volatile concurrent ConcurrentDictionary' },
  { route: 'csharp-delegates',            title: 'Delegates & Events',          section: 'C# Async',        difficulty: 'intermediate', keywords: 'csharp delegate Func Action Predicate event EventHandler multicast lambda closure' },
  { route: 'csharp-tasks',                title: 'Tasks & Parallel',            section: 'C# Async',        difficulty: 'intermediate', keywords: 'csharp Task WhenAll WhenAny Parallel PLINQ TaskCompletionSource CancellationToken' },
  { route: 'csharp-async',                title: 'async / await',               section: 'C# Async',        difficulty: 'intermediate', keywords: 'csharp async await Task ValueTask ConfigureAwait IAsyncEnumerable CancellationToken' },
  { route: 'csharp-exceptions',           title: 'Exceptions',                  section: 'C# Safety',       difficulty: 'intermediate', keywords: 'csharp try catch finally throw exception filter when AggregateException custom exception' },
  { route: 'csharp-whats-new-9-10',       title: "What's New in C# 9 & 10",    section: "C# What's New",   difficulty: 'intermediate', keywords: 'csharp 9 10 records init top-level programs pattern global using file-scoped namespace' },
  { route: 'csharp-whats-new-11-12',      title: "What's New in C# 11 & 12",   section: "C# What's New",   difficulty: 'intermediate', keywords: 'csharp 11 12 required raw string generic math INumber primary constructors collection expressions' },
  { route: 'csharp-whats-new-latest',     title: "What's New in C# 13+",       section: "C# What's New",   difficulty: 'advanced',     keywords: 'csharp 13 14 dotnet 10 11 params span CountBy AggregateBy extension blocks TimeProvider' },
];

@Injectable({ providedIn: 'root' })
export class SearchService {
  query  = signal('');
  open   = signal(false);

  results = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (q.length < 2) return [];
    return SEARCH_INDEX.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.keywords.toLowerCase().includes(q) ||
      e.section.toLowerCase().includes(q)
    ).slice(0, 12);
  });

  openSearch()  { this.open.set(true); this.query.set(''); }
  closeSearch() { this.open.set(false); this.query.set(''); }
}
