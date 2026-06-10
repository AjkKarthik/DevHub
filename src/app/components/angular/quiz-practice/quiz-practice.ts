import { Component, signal, computed } from '@angular/core';

interface PracticeQuestion { q: string; options: string[]; answer: number; explanation: string; topic: string; }

type QuizPhase = 'setup' | 'quiz' | 'result';

const QUESTIONS: PracticeQuestion[] = [
  // ── Signals ──────────────────────────────────────────────────────────
  {
    q: 'How do you update a writable signal based on its current value?',
    options: ['count.set(count() + 1)', 'count.update(v => v + 1)', 'count.mutate(v => v + 1)', 'count.next(count() + 1)'],
    answer: 1,
    explanation: 'update() receives the current value and returns the new one. set() works too but requires reading the signal yourself; mutate() was removed before Angular 17 stable, and next() belongs to RxJS Subjects.',
    topic: 'Signals',
  },
  {
    q: 'What does computed() return?',
    options: ['A writable signal', 'A read-only signal that recalculates when its dependencies change', 'An observable', 'A memoized plain function'],
    answer: 1,
    explanation: 'computed() creates a read-only Signal whose value is lazily recalculated and cached. It tracks whichever signals were read during the last computation.',
    topic: 'Signals',
  },
  {
    q: 'When does an effect() run for the first time?',
    options: ['Immediately and synchronously when created', 'At least once, scheduled after creation (during change detection)', 'Only when a dependency changes', 'On ngOnInit'],
    answer: 1,
    explanation: 'Effects always run at least once. The first run is scheduled (not synchronous at creation), and subsequent runs happen when any signal read in the effect changes.',
    topic: 'Signals',
  },
  {
    q: 'How does a signal decide whether to notify consumers after set()?',
    options: ['It always notifies', 'It uses JSON.stringify comparison', 'It uses an equality function, Object.is by default', 'It deep-compares the values'],
    answer: 2,
    explanation: 'Signals use Object.is by default to skip notifications when the value is unchanged. You can pass a custom { equal } function to signal() or computed().',
    topic: 'Signals',
  },
  {
    q: 'What is linkedSignal() for?',
    options: ['Linking two components together', 'A writable signal that resets based on a source signal but can be locally overridden', 'Two-way binding between signals', 'Synchronizing a signal with localStorage'],
    answer: 1,
    explanation: 'linkedSignal() creates a writable signal whose value is derived from a source. When the source changes the value resets from the computation, but in between you can write to it directly — ideal for "selected item resets when list changes".',
    topic: 'Signals',
  },
  {
    q: 'Why is reading a signal inside untracked() useful in an effect?',
    options: ['It makes the read faster', 'It prevents that signal from becoming a dependency of the effect', 'It reads the previous value instead of the current one', 'It is required for writable signals'],
    answer: 1,
    explanation: 'untracked(() => sig()) reads the current value without registering a dependency, so the effect will not re-run when that particular signal changes.',
    topic: 'Signals',
  },
  {
    q: 'What does toSignal(obs$) do when the observable has not emitted yet?',
    options: ['Throws an error', 'Blocks until first emission', 'Returns the initialValue you provided (or undefined)', 'Returns null always'],
    answer: 2,
    explanation: 'toSignal subscribes immediately and exposes the latest value. Before the first emission it returns the configured initialValue, or undefined if none was provided (unless requireSync: true is used with a synchronous source).',
    topic: 'Signals',
  },

  // ── Components ───────────────────────────────────────────────────────
  {
    q: 'Which is the signal-based way to declare a required input?',
    options: ['@Input({ required: true }) name!: string;', 'name = input.required<string>();', 'name = signal.required<string>();', '@RequiredInput() name: string;'],
    answer: 1,
    explanation: 'input.required<T>() creates a required signal input. The decorator form @Input({ required: true }) also exists, but the signal-based API is input.required.',
    topic: 'Components',
  },
  {
    q: 'How does a child emit events to a parent using the modern API?',
    options: ['emitter = new EventEmitter<string>()', 'changed = output<string>(); then this.changed.emit(value)', 'changed = signal<string>()', 'this.parent.notify(value)'],
    answer: 1,
    explanation: 'output<T>() replaces @Output() + EventEmitter. You call .emit(value) on it, and the parent binds with (changed)="..." exactly as before.',
    topic: 'Components',
  },
  {
    q: 'What does the model() API create?',
    options: ['A reactive form model', 'A writable signal usable for two-way binding with [(prop)]', 'A read-only input', 'An NgRx store slice'],
    answer: 1,
    explanation: 'model() creates a writable signal input that supports banana-in-a-box two-way binding: [(value)]="parentSignal". Writing to it inside the child propagates to the parent.',
    topic: 'Components',
  },
  {
    q: 'Which control-flow syntax replaced *ngFor in modern templates?',
    options: ['@loop (...)', '@for (item of items; track item.id) { ... }', '<for [items]="items">', '@each (item in items)'],
    answer: 1,
    explanation: 'The built-in @for block replaces *ngFor and makes track mandatory, which avoids the classic missing-trackBy performance pitfall. It also supports @empty.',
    topic: 'Components',
  },
  {
    q: 'What does <ng-content select="[header]"> do?',
    options: ['Renders a header element', 'Projects only the projected content matching the [header] attribute selector', 'Selects the first child', 'Imports a header component'],
    answer: 1,
    explanation: 'Multi-slot content projection: ng-content with a select attribute only renders projected nodes that match that CSS selector; a selector-less ng-content catches the rest.',
    topic: 'Components',
  },
  {
    q: 'In which lifecycle hook is it safe to access a @ViewChild that is NOT static?',
    options: ['constructor', 'ngOnInit', 'ngAfterViewInit', 'ngOnChanges'],
    answer: 2,
    explanation: 'View queries resolve after the view is created, so ngAfterViewInit is the first hook where a non-static @ViewChild is guaranteed to be set. The signal-based viewChild() avoids this by being reactive.',
    topic: 'Components',
  },
  {
    q: 'What is true about standalone components?',
    options: ['They cannot use other components', 'They declare their own dependencies via the imports array instead of an NgModule', 'They cannot be lazy loaded', 'They must be declared in AppModule'],
    answer: 1,
    explanation: 'Standalone components are self-contained: anything they use in the template (components, directives, pipes) goes in their own imports array. They are also directly lazy-loadable with loadComponent.',
    topic: 'Components',
  },

  // ── DI ───────────────────────────────────────────────────────────────
  {
    q: 'What does providedIn: "root" on @Injectable do?',
    options: ['Registers the service per component', 'Registers a tree-shakable app-wide singleton', 'Makes the service available only in AppComponent', 'Creates a new instance on every injection'],
    answer: 1,
    explanation: 'providedIn: "root" registers the service in the root injector as a singleton, and it is tree-shakable: if nothing injects it, it is dropped from the bundle.',
    topic: 'DI',
  },
  {
    q: 'Where can the inject() function be called?',
    options: ['Anywhere in any method', 'Only in constructors', 'In an injection context: field initializers, constructors, factory functions, or inside runInInjectionContext', 'Only in services'],
    answer: 2,
    explanation: 'inject() works only inside an injection context. Calling it later (e.g. in a click handler) throws NG0203. runInInjectionContext lets you create one manually.',
    topic: 'DI',
  },
  {
    q: 'What happens when a component lists a service in its own providers array?',
    options: ['Nothing different from root provision', 'Each component instance gets its own service instance, destroyed with the component', 'The service becomes global', 'It throws a duplicate-provider error'],
    answer: 1,
    explanation: 'Component-level providers create a new instance per component instance (per element injector). The instance is destroyed together with the component — useful for per-widget state.',
    topic: 'DI',
  },
  {
    q: 'Which is the correct way to provide a value for an InjectionToken?',
    options: ['{ provide: API_URL, useValue: "https://api.example.com" }', '{ token: API_URL, value: "..." }', 'API_URL.provide("...")', '@Provide(API_URL) url = "..."'],
    answer: 0,
    explanation: 'InjectionTokens are provided with { provide: TOKEN, useValue | useFactory | useClass | useExisting }. useValue is the simplest for configuration constants.',
    topic: 'DI',
  },
  {
    q: 'What does the @Optional() decorator (or inject(X, { optional: true })) do?',
    options: ['Lazily creates the dependency', 'Returns null instead of throwing when no provider is found', 'Makes the provider tree-shakable', 'Defers injection until first use'],
    answer: 1,
    explanation: 'Optional injection suppresses the NullInjectorError; you receive null when no provider exists, so you must handle the missing-dependency case yourself.',
    topic: 'DI',
  },
  {
    q: 'What is the difference between useClass and useExisting?',
    options: ['No difference', 'useClass creates a new instance for the token; useExisting aliases the token to another token\'s existing instance', 'useExisting is deprecated', 'useClass only works with abstract classes'],
    answer: 1,
    explanation: 'useClass instantiates a (possibly different) class for the token. useExisting points the token to another provider, so both tokens resolve to the same single instance.',
    topic: 'DI',
  },

  // ── Router ───────────────────────────────────────────────────────────
  {
    q: 'How do you lazy-load a standalone component in routes?',
    options: ['{ path: "admin", component: () => AdminComponent }', '{ path: "admin", loadComponent: () => import("./admin/admin").then(m => m.AdminComponent) }', '{ path: "admin", lazy: AdminComponent }', '{ path: "admin", loadChildren: AdminComponent }'],
    answer: 1,
    explanation: 'loadComponent with a dynamic import() lazy-loads a single standalone component. loadChildren is for child route arrays / route files.',
    topic: 'Router',
  },
  {
    q: 'What does withComponentInputBinding() enable?',
    options: ['Two-way binding in templates', 'Route params, query params and data are bound directly to component inputs of the same name', 'Binding router-outlet to a form', 'Input sanitization'],
    answer: 1,
    explanation: 'Added via provideRouter(routes, withComponentInputBinding()), it maps route path params, query params, resolved data and static data onto matching component inputs — no ActivatedRoute needed.',
    topic: 'Router',
  },
  {
    q: 'What is the modern functional guard signature for protecting a route?',
    options: ['class AuthGuard implements CanActivate (only option)', 'const authGuard: CanActivateFn = (route, state) => inject(AuthService).isLoggedIn();', 'function guard() { return router.allow(); }', '@Guard() decorator on the component'],
    answer: 1,
    explanation: 'Functional guards (CanActivateFn) are plain functions that can call inject() because the router runs them in an injection context. They can return boolean, UrlTree, Promise or Observable.',
    topic: 'Router',
  },
  {
    q: 'A guard wants to block navigation AND redirect to /login. Best return value?',
    options: ['false, then call router.navigate separately', 'inject(Router).createUrlTree(["/login"])', 'throw new Error("redirect")', 'null'],
    answer: 1,
    explanation: 'Returning a UrlTree both cancels the current navigation and triggers the redirect atomically, avoiding the race conditions of returning false plus a manual navigate call.',
    topic: 'Router',
  },
  {
    q: 'How do you read the :id param reactively in a component (classic API)?',
    options: ['route.snapshot.paramMap.get("id") updates automatically', 'route.paramMap observable (e.g. route.paramMap.pipe(map(p => p.get("id"))))', 'window.location.pathname', 'inject(Params).id'],
    answer: 1,
    explanation: 'snapshot is read once and goes stale when the router reuses the component for a different id. The paramMap observable emits on every param change of the active route.',
    topic: 'Router',
  },
  {
    q: 'What does pathMatch: "full" mean on a route with path: ""?',
    options: ['Match any URL', 'The route matches only when the entire remaining URL is empty', 'Match the path prefix', 'Enable wildcard matching'],
    answer: 1,
    explanation: 'With the default prefix matching, path: "" matches every URL (empty string is a prefix of everything). pathMatch: "full" restricts it to the case where nothing is left to consume — required for default redirects.',
    topic: 'Router',
  },
  {
    q: 'What does a resolver (ResolveFn) accomplish?',
    options: ['Resolves DI tokens', 'Fetches data before the route activates, exposing it via route data', 'Resolves merge conflicts in routes', 'Preloads lazy bundles'],
    answer: 1,
    explanation: 'Resolvers run during navigation and delay component activation until the data resolves, available afterwards through ActivatedRoute.data (or directly as an input with component input binding).',
    topic: 'Router',
  },

  // ── Forms ────────────────────────────────────────────────────────────
  {
    q: 'What is the key difference between template-driven and reactive forms?',
    options: ['Template-driven forms are faster', 'Reactive forms define the form model explicitly in the class; template-driven forms derive it from directives in the template', 'Reactive forms cannot be validated', 'Template-driven forms do not support ngModel'],
    answer: 1,
    explanation: 'Reactive forms build an explicit, synchronous FormGroup/FormControl model in TypeScript (easy to test and compose). Template-driven forms create the model implicitly from ngModel directives, asynchronously.',
    topic: 'Forms',
  },
  {
    q: 'What does NonNullableFormBuilder change compared to FormBuilder?',
    options: ['Controls can never be disabled', 'reset() returns controls to their initial value instead of null, and value types exclude null', 'It removes all validators', 'It only works with strings'],
    answer: 1,
    explanation: 'Non-nullable controls keep their initial value as the reset value, so control.value is typed T rather than T | null — a big win with strictly typed forms.',
    topic: 'Forms',
  },
  {
    q: 'How do you write a custom synchronous validator?',
    options: ['A class extending Validator only', 'A function (control: AbstractControl) => ValidationErrors | null', 'A pipe that returns boolean', 'A directive with @HostListener'],
    answer: 1,
    explanation: 'A ValidatorFn takes the control and returns null when valid, or an errors object like { forbiddenName: { value } } when invalid. Directive-based validators wrap such functions for template-driven forms.',
    topic: 'Forms',
  },
  {
    q: 'What is a FormArray used for?',
    options: ['Storing arrays in a single FormControl', 'Managing a dynamic, variable-length list of controls or groups (e.g. multiple phone numbers)', 'Submitting multiple forms at once', 'Multi-step wizards only'],
    answer: 1,
    explanation: 'FormArray holds an ordered, growable list of AbstractControls. push() and removeAt() let you add and remove rows at runtime — something a fixed FormGroup cannot do.',
    topic: 'Forms',
  },
  {
    q: 'updateOn: "blur" on a control does what?',
    options: ['Disables the control on blur', 'Defers value/validity updates until the input loses focus', 'Triggers submit on blur', 'Resets the control on blur'],
    answer: 1,
    explanation: 'By default controls update on every keystroke ("change"). updateOn: "blur" (or "submit") batches updates, reducing validation noise and expensive async validator calls.',
    topic: 'Forms',
  },
  {
    q: 'Which interface must a custom form control component implement to work with formControlName?',
    options: ['OnChanges', 'ControlValueAccessor', 'Validator', 'FormControlDirective'],
    answer: 1,
    explanation: 'ControlValueAccessor (writeValue, registerOnChange, registerOnTouched, optionally setDisabledState) bridges your component and the forms API. You register it via the NG_VALUE_ACCESSOR token.',
    topic: 'Forms',
  },

  // ── RxJS ─────────────────────────────────────────────────────────────
  {
    q: 'Which operator should back a typeahead search to cancel stale requests?',
    options: ['mergeMap', 'concatMap', 'switchMap', 'exhaustMap'],
    answer: 2,
    explanation: 'switchMap unsubscribes from the previous inner observable when a new value arrives, cancelling the in-flight HTTP request so only the latest search term wins.',
    topic: 'RxJS',
  },
  {
    q: 'What is the difference between mergeMap and concatMap?',
    options: ['They are aliases', 'mergeMap runs inner observables concurrently; concatMap queues them and preserves order', 'concatMap is faster', 'mergeMap only works with promises'],
    answer: 1,
    explanation: 'mergeMap subscribes to every inner observable immediately (results can interleave). concatMap waits for each inner observable to complete before starting the next, guaranteeing order.',
    topic: 'RxJS',
  },
  {
    q: 'How does BehaviorSubject differ from Subject?',
    options: ['BehaviorSubject is multicast, Subject is not', 'BehaviorSubject requires an initial value and replays the latest value to new subscribers', 'Subject stores all past values', 'BehaviorSubject cannot emit errors'],
    answer: 1,
    explanation: 'A BehaviorSubject always holds a current value: new subscribers immediately receive the latest one. A plain Subject gives new subscribers only future emissions.',
    topic: 'RxJS',
  },
  {
    q: 'What does shareReplay(1) typically solve in a service?',
    options: ['Memory leaks', 'Multiple subscribers each triggering a separate HTTP request', 'Slow change detection', 'Type errors'],
    answer: 1,
    explanation: 'shareReplay(1) multicasts the source and replays the last emission, so several async-pipe subscribers share one HTTP call instead of each firing their own (cold observables re-execute per subscriber).',
    topic: 'RxJS',
  },
  {
    q: 'Where should catchError be placed to keep a stream alive after an inner HTTP error?',
    options: ['On the outer source observable', 'Inside the inner observable passed to switchMap/mergeMap', 'After subscribe()', 'It does not matter'],
    answer: 1,
    explanation: 'If catchError sits on the outer stream, an error completes the whole chain. Placing it inside the flattening operator (e.g. switchMap(id => http.get(...).pipe(catchError(...)))) recovers only that inner request.',
    topic: 'RxJS',
  },
  {
    q: 'debounceTime(300) does what?',
    options: ['Delays every value by 300ms', 'Emits a value only after 300ms of silence, discarding earlier rapid values', 'Emits at most one value every 300ms (first one)', 'Buffers values for 300ms then emits an array'],
    answer: 1,
    explanation: 'debounceTime waits for a quiet window: each new emission resets the timer, and only the last value before 300ms of inactivity gets through. Emitting the first value per window is throttleTime.',
    topic: 'RxJS',
  },
  {
    q: 'Which is a built-in way to auto-unsubscribe when a component is destroyed?',
    options: ['takeUntilDestroyed() from @angular/core/rxjs-interop', 'autoUnsubscribe() operator from rxjs', 'unsubscribeOnDestroy: true in @Component', 'Subscriptions auto-clean themselves'],
    answer: 0,
    explanation: 'takeUntilDestroyed() ties the subscription to the DestroyRef of the current injection context (or one passed explicitly), completing the stream when the component is destroyed. The async pipe is the other built-in option.',
    topic: 'RxJS',
  },

  // ── Performance ──────────────────────────────────────────────────────
  {
    q: 'What does ChangeDetectionStrategy.OnPush change?',
    options: ['It disables change detection entirely', 'The component is checked only on input reference change, events from it, async pipe emissions, or signal changes — not on every app-wide CD cycle', 'It makes bindings update twice', 'It only works with NgZone disabled'],
    answer: 1,
    explanation: 'OnPush skips the component during change detection unless something marked it dirty: a new input reference, a DOM event inside it, an async-pipe emission, markForCheck(), or a signal it reads changing.',
    topic: 'Performance',
  },
  {
    q: 'Why does mutating an array passed to an OnPush child not update its view?',
    options: ['Arrays are not supported as inputs', 'OnPush compares input references; mutation keeps the same reference so the child is not marked dirty', 'Change detection is asynchronous', 'The async pipe is missing'],
    answer: 1,
    explanation: 'OnPush uses reference equality on inputs. items.push(x) keeps the same array reference. Create a new reference instead: items = [...items, x].',
    topic: 'Performance',
  },
  {
    q: 'What does @defer (on viewport) do?',
    options: ['Hides content below the fold', 'Splits the block into a lazy chunk loaded when the placeholder scrolls into view', 'Defers change detection', 'Renders on the server only'],
    answer: 1,
    explanation: '@defer creates a separate lazy-loaded bundle for the block\'s dependencies and loads it when the trigger fires — on viewport uses an IntersectionObserver on the @placeholder content.',
    topic: 'Performance',
  },
  {
    q: 'What is the main benefit of zoneless change detection?',
    options: ['Smaller templates', 'No zone.js patching — CD is scheduled by signals/explicit notifications, avoiding over-triggering from every async event', 'It removes the need for OnPush', 'It enables two-way binding'],
    answer: 1,
    explanation: 'With provideZonelessChangeDetection(), Angular drops zone.js. Updates are driven by signals, async pipe, and explicit APIs instead of patching every setTimeout/promise/event, reducing wasted CD cycles and bundle size.',
    topic: 'Performance',
  },
  {
    q: 'Why is the track expression in @for important for large lists?',
    options: ['It sorts the list', 'It lets Angular reuse DOM nodes for unchanged items instead of destroying and recreating them', 'It enables virtual scrolling', 'It deduplicates items'],
    answer: 1,
    explanation: 'With a stable identity key (e.g. track item.id), Angular diffs by key and moves/reuses existing DOM. Tracking by object identity or index causes mass re-renders when data is replaced or reordered.',
    topic: 'Performance',
  },
  {
    q: 'What does NgOptimizedImage (ngSrc) provide?',
    options: ['Automatic image compression on the server', 'Lazy loading by default, srcset generation, priority hints, and LCP warnings', 'WebP conversion in the browser', 'A CSS image gallery'],
    answer: 1,
    explanation: 'NgOptimizedImage enforces best practices: lazy loads non-priority images, generates srcset via loaders, requires width/height to prevent layout shift, and warns when the LCP image lacks priority.',
    topic: 'Performance',
  },

  // ── Testing ──────────────────────────────────────────────────────────
  {
    q: 'What is TestBed used for?',
    options: ['Performance benchmarking', 'Configuring a testing module/injector and creating component fixtures', 'E2E browser automation', 'Linting templates'],
    answer: 1,
    explanation: 'TestBed.configureTestingModule sets up providers/imports for the test, and TestBed.createComponent returns a ComponentFixture wrapping the component instance and its DOM.',
    topic: 'Testing',
  },
  {
    q: 'Why call fixture.detectChanges() in a component test?',
    options: ['To compile the component', 'To run change detection so the template reflects current component state', 'To destroy the fixture', 'To flush HTTP requests'],
    answer: 1,
    explanation: 'Tests control change detection manually. After changing state (or initially, to trigger ngOnInit and first render), detectChanges() syncs the DOM with the component.',
    topic: 'Testing',
  },
  {
    q: 'How do you test code using HttpClient without hitting a real server?',
    options: ['Mock window.fetch', 'provideHttpClientTesting() + HttpTestingController expectOne/flush', 'Use a real dev API', 'Stub XMLHttpRequest manually'],
    answer: 1,
    explanation: 'provideHttpClient() with provideHttpClientTesting() swaps the backend. HttpTestingController lets you assert requests (expectOne), respond (flush), and verify() no requests are outstanding.',
    topic: 'Testing',
  },
  {
    q: 'What does fakeAsync + tick() allow?',
    options: ['Running tests in parallel', 'Simulating the passage of time synchronously for timers and promises', 'Skipping change detection', 'Mocking HTTP automatically'],
    answer: 1,
    explanation: 'In a fakeAsync zone, asynchronous timers are virtualized. tick(300) synchronously advances virtual time by 300ms so debounce/setTimeout-based logic can be tested deterministically.',
    topic: 'Testing',
  },
  {
    q: 'What is the main advantage of component harnesses (@angular/cdk/testing)?',
    options: ['They make tests run faster', 'They interact with components through a stable API instead of fragile DOM selectors, working in both unit and e2e environments', 'They replace TestBed', 'They auto-generate tests'],
    answer: 1,
    explanation: 'Harnesses (e.g. MatButtonHarness) encapsulate a component\'s DOM. Tests survive internal markup changes, and the same harness works with TestbedHarnessEnvironment and e2e environments.',
    topic: 'Testing',
  },
  {
    q: 'How do you override a service with a fake in a component test?',
    options: ['Reassign the property on the instance', 'TestBed.configureTestingModule({ providers: [{ provide: DataService, useValue: fakeService }] })', 'Delete the service file', 'Use jasmine.createSpy on the class itself'],
    answer: 1,
    explanation: 'Providing { provide: RealService, useValue: fake } in the testing module makes DI hand your fake to the component under test — the standard seam for isolating units.',
    topic: 'Testing',
  },
];

@Component({
  selector: 'app-quiz-practice',
  standalone: true,
  imports: [],
  templateUrl: './quiz-practice.html',
  styleUrl: './quiz-practice.scss',
})
export class QuizPracticeComponent {
  readonly counts = [5, 10, 20];
  readonly topics: string[] = ['All', ...Array.from(new Set(QUESTIONS.map(q => q.topic)))];

  phase = signal<QuizPhase>('setup');
  selectedTopic = signal('All');
  selectedCount = signal(10);

  questions = signal<PracticeQuestion[]>([]);
  index = signal(0);
  answers = signal<Record<number, number>>({});

  current = computed(() => this.questions()[this.index()]);
  picked = computed<number | null>(() => {
    const a = this.answers()[this.index()];
    return a === undefined ? null : a;
  });
  answered = computed(() => this.picked() !== null);
  isLast = computed(() => this.index() === this.questions().length - 1);

  score = computed(() =>
    this.questions().reduce((sum, q, i) => sum + (this.answers()[i] === q.answer ? 1 : 0), 0)
  );
  percentage = computed(() => {
    const total = this.questions().length;
    return total ? Math.round((this.score() / total) * 100) : 0;
  });
  breakdown = computed(() => {
    const map = new Map<string, { topic: string; correct: number; total: number }>();
    this.questions().forEach((q, i) => {
      const row = map.get(q.topic) ?? { topic: q.topic, correct: 0, total: 0 };
      row.total++;
      if (this.answers()[i] === q.answer) row.correct++;
      map.set(q.topic, row);
    });
    return Array.from(map.values());
  });
  resultMessage = computed(() => {
    const p = this.percentage();
    if (p >= 90) return 'Outstanding — you really know Angular!';
    if (p >= 70) return 'Great job — solid Angular knowledge.';
    if (p >= 50) return 'Good effort — review the explanations and try again.';
    return 'Keep practicing — the explanations below each question are your friend.';
  });

  poolSize(topic: string): number {
    return topic === 'All' ? QUESTIONS.length : QUESTIONS.filter(q => q.topic === topic).length;
  }

  start(): void {
    const topic = this.selectedTopic();
    const pool = topic === 'All' ? [...QUESTIONS] : QUESTIONS.filter(q => q.topic === topic);
    // Fisher–Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    this.questions.set(pool.slice(0, Math.min(this.selectedCount(), pool.length)));
    this.index.set(0);
    this.answers.set({});
    this.phase.set('quiz');
  }

  pick(optionIndex: number): void {
    if (this.answered()) return;
    this.answers.update(a => ({ ...a, [this.index()]: optionIndex }));
  }

  next(): void {
    if (this.isLast()) {
      this.phase.set('result');
    } else {
      this.index.update(i => i + 1);
    }
  }

  tryAgain(): void {
    this.start();
  }

  newSettings(): void {
    this.phase.set('setup');
  }
}
