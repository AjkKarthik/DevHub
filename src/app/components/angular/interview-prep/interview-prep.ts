import { Component, signal, computed } from '@angular/core';

export interface InterviewQuestion {
  q: string;
  a: string;
  topic: string;
  level: 'junior' | 'mid' | 'senior';
}

const QUESTIONS: InterviewQuestion[] = [
  // ── Signals ──────────────────────────────────────────────────────────────
  {
    q: 'What is a signal in Angular and how does it differ from a plain variable?',
    a: 'A signal is a reactive wrapper around a value that notifies consumers when the value changes. Reading it with the call syntax (count()) registers a dependency, so templates and computed values update automatically when you call set() or update(). Unlike a plain variable, Angular can track exactly where a signal is read and re-render only those parts of the view.',
    topic: 'Signals',
    level: 'junior',
  },
  {
    q: 'When would you choose signals over RxJS observables?',
    a: 'Signals are ideal for synchronous state that the template renders: component state, derived values via computed(), and inputs. RxJS still shines for asynchronous event streams, racing, debouncing, retries, and complex operator pipelines. A common modern pattern is RxJS at the edges (HTTP, websockets, user event streams) converted to signals with toSignal() for template consumption.',
    topic: 'Signals',
    level: 'mid',
  },
  {
    q: 'What does computed() do and what guarantees does it give?',
    a: 'computed() creates a read-only derived signal whose value is recalculated lazily when any signal it reads changes. It is memoized — repeated reads without dependency changes return the cached value — and it tracks dependencies dynamically, so only signals read on the last execution path are tracked. Computeds must be pure; writing to signals inside one is not allowed.',
    topic: 'Signals',
    level: 'mid',
  },
  {
    q: 'Explain effect() and a situation where you should avoid it.',
    a: 'effect() runs a side-effecting function whenever signals it reads change, e.g. logging, syncing to localStorage, or imperatively driving a chart library. You should avoid using effects to propagate state into other signals — that creates implicit data flow that is hard to reason about; prefer computed() or linkedSignal() for derived state. Effects run during change detection scheduling and require an injection context (or a passed Injector).',
    topic: 'Signals',
    level: 'senior',
  },
  {
    q: 'What are signal inputs, model(), and signal queries?',
    a: 'input() declares a component input as a read-only signal (with input.required<T>() for mandatory ones), replacing @Input. model() creates a writable signal supporting two-way binding with [(value)] syntax. viewChild()/contentChild() and their plural forms return signal-based queries that replace @ViewChild/@ContentChild decorators and update reactively.',
    topic: 'Signals',
    level: 'mid',
  },
  {
    q: 'What is linkedSignal() and when is it useful?',
    a: 'linkedSignal() creates a writable signal whose value resets based on a source computation but can also be locally overwritten. The classic case is a selected-item signal that resets when the underlying options list changes, while still allowing the user to pick an item. It removes the need for an effect that writes to a signal.',
    topic: 'Signals',
    level: 'senior',
  },
  {
    q: 'How do toSignal() and toObservable() bridge signals and RxJS?',
    a: 'toSignal() subscribes to an observable and exposes the latest emission as a signal, requiring either an initialValue or accepting undefined until the first emission; it unsubscribes automatically when the injection context is destroyed. toObservable() wraps a signal in an observable that emits on changes (coalesced via effect timing). Together they let you keep RxJS pipelines while rendering with signals.',
    topic: 'Signals',
    level: 'mid',
  },

  // ── Change Detection ─────────────────────────────────────────────────────
  {
    q: 'How does Angular change detection work at a high level?',
    a: 'Angular keeps a tree of views and, when triggered, walks the tree checking template bindings against their previous values, updating the DOM where they differ. With Zone.js, any async event (click, timer, XHR) triggers a top-down check; in zoneless mode, signals, AsyncPipe, and explicit markForCheck notifications schedule checks on exactly the views that need them.',
    topic: 'Change Detection',
    level: 'junior',
  },
  {
    q: 'What does ChangeDetectionStrategy.OnPush change?',
    a: 'OnPush makes a component skip checking unless an input reference changed, an event originated inside it, an AsyncPipe emitted, a signal it reads changed, or markForCheck() was called. It dramatically cuts the work per change detection cycle and forces an immutable-data or signal-driven style. In the signals era OnPush is effectively the baseline, since signal reads mark the component dirty automatically.',
    topic: 'Change Detection',
    level: 'mid',
  },
  {
    q: 'What is zoneless change detection and how do you enable it?',
    a: 'Zoneless removes Zone.js entirely; Angular relies on signals, AsyncPipe, host/template event listeners, and markForCheck() to know when to refresh views. You enable it with provideZonelessChangeDetection() in your providers and drop zone.js from polyfills. The benefits are smaller bundles, cleaner stack traces, no patched browser APIs, and change detection that only runs where notified.',
    topic: 'Change Detection',
    level: 'senior',
  },
  {
    q: 'Explain the ExpressionChangedAfterItHasBeenCheckedError.',
    a: 'In dev mode Angular runs a second verification pass after change detection; if a binding value differs between the two passes, it throws this error because it means your model mutated during rendering. Typical causes are changing parent state in a child lifecycle hook (e.g. ngAfterViewInit) or impure getters. Fixes include moving the mutation to a proper place, using signals, or deferring with queueMicrotask — not blindly calling detectChanges().',
    topic: 'Change Detection',
    level: 'mid',
  },
  {
    q: 'Difference between markForCheck() and detectChanges()?',
    a: 'markForCheck() marks the component and its ancestors as dirty so they are checked on the next change detection cycle — it schedules, it does not run anything. detectChanges() synchronously runs change detection on that component subtree right now. Prefer markForCheck (or just signals) because synchronous detectChanges can cause re-entrancy issues and hides design problems.',
    topic: 'Change Detection',
    level: 'senior',
  },

  // ── Dependency Injection ─────────────────────────────────────────────────
  {
    q: 'What is dependency injection in Angular and why is it used?',
    a: 'DI is a pattern where a class declares its dependencies (services) and the framework supplies instances rather than the class constructing them. It enables loose coupling, easy testing via mock providers, and shared singletons. In modern Angular the inject() function is the preferred way to obtain dependencies, working in constructors, field initializers, and factory functions.',
    topic: 'DI',
    level: 'junior',
  },
  {
    q: "Explain Angular's injector hierarchy.",
    a: 'There are two parallel hierarchies: the environment injector tree (root, plus injectors created by lazy routes or createEnvironmentInjector) and the element injector tree (providers declared on components/directives). Resolution starts at the element injector of the requesting component, walks up the DOM hierarchy, then falls back to the environment chain. providedIn: "root" registers a tree-shakable singleton in the root environment injector.',
    topic: 'DI',
    level: 'senior',
  },
  {
    q: 'What do the @Optional, @Self, @SkipSelf, and @Host modifiers (or their inject() options) do?',
    a: 'optional: true returns null instead of throwing when no provider is found. self: true restricts the lookup to the current element injector only, while skipSelf: true starts the search at the parent — handy for hierarchical services like a nested form group finding its parent. host: true stops the search at the host component boundary.',
    topic: 'DI',
    level: 'senior',
  },
  {
    q: 'What is an InjectionToken and when do you need one?',
    a: 'An InjectionToken is a typed key for providing values that have no runtime class: configuration objects, primitives, interfaces, or multi-provider collections. You provide it with { provide: TOKEN, useValue/useFactory } and consume it via inject(TOKEN). Tokens can also carry a providedIn factory so they remain tree-shakable.',
    topic: 'DI',
    level: 'mid',
  },
  {
    q: 'What happens if you provide the same service at both root and component level?',
    a: 'The component-level provider shadows the root one for that component and its subtree — each instance of that component gets its own service instance, created and destroyed with the component. This is useful for per-component state (e.g. a form scratchpad) but can surprise developers expecting a singleton, so it should be deliberate.',
    topic: 'DI',
    level: 'mid',
  },

  // ── Components ───────────────────────────────────────────────────────────
  {
    q: 'What are standalone components and why did Angular move to them?',
    a: 'Standalone components declare their own template dependencies via the imports array instead of belonging to an NgModule. They simplify the mental model, enable finer-grained lazy loading and tree shaking, and remove boilerplate. Since Angular 19, standalone: true is the default and NgModules are optional legacy.',
    topic: 'Components',
    level: 'junior',
  },
  {
    q: 'Explain content projection and multi-slot projection.',
    a: 'Content projection lets a parent pass markup into a child via <ng-content>. Multi-slot projection uses select attributes (<ng-content select="[header]">) to route different projected nodes to different slots, with an unselected <ng-content> catching the rest. Projected content keeps the parent as its logical context — bindings and DI resolve against where it was authored.',
    topic: 'Components',
    level: 'mid',
  },
  {
    q: 'How do component inputs and outputs work in modern Angular?',
    a: 'Inputs are declared with the input() signal function — input<T>(defaultValue) or input.required<T>() — and read like signals in the template and class. Outputs use the output() function returning an OutputEmitterRef that you .emit() on; it replaces @Output/EventEmitter and integrates with outputToObservable. Two-way binding combines a model() signal with banana-in-a-box syntax.',
    topic: 'Components',
    level: 'junior',
  },
  {
    q: 'What is ViewEncapsulation and what are its modes?',
    a: 'ViewEncapsulation controls how component styles are scoped. Emulated (default) rewrites selectors with generated attributes so styles only hit the component’s own template; ShadowDom uses real shadow roots for true isolation; None makes styles global. :host, :host-context, and ::ng-deep interact with emulated encapsulation to style the host or pierce boundaries.',
    topic: 'Components',
    level: 'mid',
  },
  {
    q: 'What are host bindings/listeners and the host metadata property?',
    a: 'The host property in the @Component/@Directive decorator declaratively binds attributes, classes, styles, and event listeners on the host element, e.g. host: { "[class.active]": "isActive()", "(click)": "onClick($event)" }. The Angular style guide now prefers host metadata over the @HostBinding/@HostListener decorators. Host bindings participate in change detection like template bindings.',
    topic: 'Components',
    level: 'mid',
  },

  // ── Lifecycle ────────────────────────────────────────────────────────────
  {
    q: 'List the main lifecycle hooks in execution order.',
    a: 'ngOnChanges (when decorator-based inputs change), ngOnInit (once after first input binding), ngDoCheck, ngAfterContentInit / ngAfterContentChecked (projected content ready), ngAfterViewInit / ngAfterViewChecked (view and view children ready), and ngOnDestroy on teardown. With signal inputs, many ngOnChanges use cases move to computed() or effect(). afterNextRender/afterEveryRender are the modern, SSR-safe hooks for DOM-dependent work.',
    topic: 'Lifecycle',
    level: 'junior',
  },
  {
    q: 'Why prefer constructor + inject() for DI but ngOnInit for initialization logic?',
    a: 'The constructor (and field initializers) run before inputs are set, so any logic depending on inputs belongs in ngOnInit or, better, in computed values reacting to signal inputs. Keeping the constructor limited to dependency acquisition also makes components easier to instantiate in tests. inject() additionally works in field initializers, eliminating constructor parameter lists.',
    topic: 'Lifecycle',
    level: 'junior',
  },
  {
    q: 'What is DestroyRef and takeUntilDestroyed()?',
    a: 'DestroyRef is an injectable that lets you register teardown callbacks via onDestroy() without implementing ngOnDestroy, and it works in services and functional contexts too. takeUntilDestroyed() is an RxJS operator that completes a stream when the current injection context is destroyed, replacing the manual Subject + takeUntil pattern. Outside a constructor you must pass a DestroyRef explicitly.',
    topic: 'Lifecycle',
    level: 'mid',
  },
  {
    q: 'When do afterNextRender and afterEveryRender run, and why use them over ngAfterViewInit?',
    a: 'They run after the browser has actually rendered, only in the browser — never during SSR — making them the safe place for DOM measurement, third-party widget init, or canvas drawing. afterNextRender fires once; afterEveryRender fires after each render cycle with phases (earlyRead, write, mixedReadWrite, read) to avoid layout thrashing. ngAfterViewInit runs during change detection and also executes on the server, so it can break SSR.',
    topic: 'Lifecycle',
    level: 'senior',
  },

  // ── Templates ────────────────────────────────────────────────────────────
  {
    q: 'Describe the built-in control flow syntax (@if, @for, @switch).',
    a: '@if/@else, @for with a mandatory track expression, and @switch/@case are template syntax built into the compiler, replacing *ngIf/*ngFor/*ngSwitch. They need no imports, produce better generated code, and @for supports an @empty block plus implicit variables like $index and $count. The required track expression prevents the accidental full-list re-renders that untracked *ngFor allowed.',
    topic: 'Templates',
    level: 'junior',
  },
  {
    q: 'What does the track expression in @for actually do?',
    a: 'It gives Angular a stable identity for each row so the differ can move, keep, or minimally update DOM nodes instead of destroying and recreating them when the array reference changes. Tracking by a unique id preserves component state, focus, and animations within rows. Tracking by $index is acceptable only for static lists; tracking by object identity breaks when you map to new objects.',
    topic: 'Templates',
    level: 'mid',
  },
  {
    q: 'What is ng-template vs ng-container vs ng-content?',
    a: 'ng-template defines a chunk of template that is not rendered until something (a structural directive, NgTemplateOutlet, or @defer placeholder) instantiates it. ng-container groups nodes for directives or control flow without emitting a wrapper element. ng-content marks projection slots where a parent’s markup is inserted into the component’s view.',
    topic: 'Templates',
    level: 'junior',
  },
  {
    q: 'How do pure and impure pipes differ, and why are impure pipes risky?',
    a: 'A pure pipe re-executes only when its input reference or arguments change, so it is cheap. An impure pipe (pure: false) runs on every change detection cycle regardless of inputs, which can wreck performance on large views — the classic example being a filter pipe over an array. Prefer computed signals or precomputed properties over impure pipes.',
    topic: 'Templates',
    level: 'mid',
  },

  // ── Forms ────────────────────────────────────────────────────────────────
  {
    q: 'Compare reactive forms and template-driven forms.',
    a: 'Reactive forms build the FormGroup/FormControl model in the class, giving synchronous access, typed controls, explicit validators, and easy unit testing — the choice for complex or dynamic forms. Template-driven forms use ngModel and directives to build the model implicitly, which is quicker for simple forms but harder to test and compose. Since Angular 14 reactive forms are strictly typed, catching value/control mismatches at compile time.',
    topic: 'Forms',
    level: 'junior',
  },
  {
    q: 'What is a ControlValueAccessor and when do you implement one?',
    a: 'CVA is the bridge between a custom form control component and the forms API: you implement writeValue (model → view), registerOnChange and registerOnTouched (view → model), and optionally setDisabledState, then provide NG_VALUE_ACCESSOR. You implement it whenever a custom widget — rating stars, rich-text editor, chip selector — should work with formControlName or ngModel like a native input.',
    topic: 'Forms',
    level: 'senior',
  },
  {
    q: 'How do you create custom and async validators?',
    a: 'A custom validator is a function (control: AbstractControl) => ValidationErrors | null, usually produced by a factory so it can take parameters; you attach it in the control’s validators array. Async validators return an Observable or Promise of ValidationErrors | null, run only after sync validators pass, and put the control in a pending state — typical for server-side uniqueness checks, often debounced.',
    topic: 'Forms',
    level: 'mid',
  },
  {
    q: 'What is FormArray and when do you use it?',
    a: 'FormArray manages an ordered, dynamic collection of controls or groups — line items on an invoice, phone numbers, survey answers — where the count is unknown at compile time. You push/removeAt controls at runtime and iterate its controls in the template with @for. Its value and validity aggregate from all children just like FormGroup.',
    topic: 'Forms',
    level: 'mid',
  },
  {
    q: 'How do updateOn options affect form validation behavior?',
    a: 'updateOn: "change" (default) recalculates value and validity on every keystroke; "blur" defers until the control loses focus; "submit" defers until form submission. Blur/submit reduce validator churn — especially with async validators hitting an API — and avoid flashing errors while the user is still typing. It can be set per control or for a whole group.',
    topic: 'Forms',
    level: 'mid',
  },

  // ── Router ───────────────────────────────────────────────────────────────
  {
    q: 'How does lazy loading work with standalone components?',
    a: 'A route uses loadComponent: () => import("./admin/admin").then(m => m.AdminComponent) for a single component, or loadChildren pointing at a child routes array, so the code is split into a separate chunk fetched on first navigation. With standalone components no NgModule is needed. Combined with a preloading strategy you can fetch chunks in idle time after initial load.',
    topic: 'Router',
    level: 'junior',
  },
  {
    q: 'Explain functional route guards and the main guard types.',
    a: 'Guards are now plain functions — CanActivateFn, CanMatchFn, CanDeactivateFn — that run in an injection context, so they can inject services with inject(). canActivate gates entering a route; canMatch decides whether the route definition even matches (preventing the lazy chunk download); canDeactivate guards leaving, e.g. unsaved-changes prompts. Guards return boolean, UrlTree (redirect), or an Observable/Promise of these.',
    topic: 'Router',
    level: 'mid',
  },
  {
    q: 'What are resolvers and what is a downside of using them?',
    a: 'A ResolveFn fetches data before the route activates, exposing it via the ActivatedRoute data (or as a component input with withComponentInputBinding). The downside is navigation blocks until the resolver completes, so a slow API freezes the UI with no feedback. Many teams prefer navigating immediately and showing skeletons, fetching in the component with the resource API or a store.',
    topic: 'Router',
    level: 'mid',
  },
  {
    q: 'What does withComponentInputBinding() do?',
    a: 'Added via provideRouter(routes, withComponentInputBinding()), it binds route params, query params, resolved data, and static route data directly to component inputs of the same name. This removes most ActivatedRoute boilerplate — a path param :id simply arrives as an id = input<string>() signal input. It also makes routed components easier to test since they are driven by plain inputs.',
    topic: 'Router',
    level: 'mid',
  },
  {
    q: 'Difference between canActivate and canMatch for protecting lazy routes?',
    a: 'canActivate runs after the route has matched, which means the lazy chunk may already have been fetched before the guard rejects. canMatch runs during route matching, so a rejection makes the router skip the route entirely — the JavaScript is never downloaded, and a later sibling route with the same path can match instead. canMatch is therefore the right tool for role-based route variants and for keeping admin code off unauthorized clients.',
    topic: 'Router',
    level: 'senior',
  },

  // ── HTTP ─────────────────────────────────────────────────────────────────
  {
    q: 'What are functional HTTP interceptors and what are common use cases?',
    a: 'An HttpInterceptorFn is a function (req, next) => next(req.clone(...)) registered with provideHttpClient(withInterceptors([...])). Because HttpRequest is immutable you clone it to modify headers or URLs. Common uses: attaching auth tokens, global error handling and retry, logging/timing, caching, and toggling loading indicators.',
    topic: 'HTTP',
    level: 'mid',
  },
  {
    q: 'Why does an HttpClient GET observable not fire until subscribed, and what does that imply?',
    a: 'HttpClient returns cold observables: the request is created per subscription, so no subscribe means no network call, and two subscribes mean two requests. This implies you should use shareReplay or a caching layer when multiple consumers need one response, and that the AsyncPipe or toSignal handles subscription/unsubscription for you. The observable completes after the response, so manual unsubscription is rarely a leak concern for single requests.',
    topic: 'HTTP',
    level: 'junior',
  },
  {
    q: 'How would you implement retry with exponential backoff for HTTP calls?',
    a: 'Use the RxJS retry operator with a delay function: retry({ count: 3, delay: (err, retryCount) => timer(1000 * Math.pow(2, retryCount)) }), typically inside an interceptor so it applies globally. You should only retry idempotent requests (GET) and transient failures (5xx, network errors), passing 4xx errors straight through. Adding jitter avoids thundering-herd retries.',
    topic: 'HTTP',
    level: 'senior',
  },
  {
    q: 'What is the resource API (resource / httpResource)?',
    a: 'The resource API models async data as signals: you give it a reactive params function and a loader, and it exposes value, status, error, and isLoading signals, re-fetching automatically when params change and cancelling stale requests via AbortSignal. httpResource() is the HttpClient-backed flavor that takes a reactive URL/request function. It replaces hand-rolled switchMap + loading-flag patterns for read operations.',
    topic: 'HTTP',
    level: 'senior',
  },

  // ── Performance ──────────────────────────────────────────────────────────
  {
    q: 'What is @defer and what triggers does it support?',
    a: '@defer lazily loads the components, directives, and pipes used inside its block, splitting them into separate chunks. Triggers include on idle (default), on viewport, on interaction, on hover, on timer(...), and when <condition>, with prefetch variants to download earlier than render. Companion blocks @placeholder, @loading (with minimum/after timing), and @error manage the UX during loading.',
    topic: 'Performance',
    level: 'mid',
  },
  {
    q: 'Explain SSR and hydration in modern Angular.',
    a: 'With Angular SSR the server renders HTML for the requested route so users see content immediately and crawlers get full markup. provideClientHydration() then makes the client reuse the server-rendered DOM instead of destroying and re-rendering it, attaching listeners and restoring state — drastically improving LCP and avoiding flicker. Incremental hydration (hydrate on viewport/interaction via @defer) and event replay let parts of the page stay dormant until needed.',
    topic: 'Performance',
    level: 'senior',
  },
  {
    q: 'Name the most impactful techniques for improving runtime performance of a large Angular app.',
    a: 'OnPush/signal-driven change detection (or zoneless) to limit checking; proper track expressions and virtual scrolling (CDK) for big lists; @defer and route-level lazy loading to shrink initial bundles; NgOptimizedImage for images; and moving heavy computation off the main thread with web workers. Profiling with Angular DevTools should drive which of these you apply.',
    topic: 'Performance',
    level: 'senior',
  },
  {
    q: 'What does NgOptimizedImage do?',
    a: 'The ngSrc directive enforces image best practices: required width/height (or fill) to prevent layout shift, automatic priority preconnect/preload hints for the LCP image, lazy loading for the rest, and generated srcset for responsive sizes. It also integrates with image CDNs through loaders. It turns common Core Web Vitals mistakes into build-time/runtime errors.',
    topic: 'Performance',
    level: 'mid',
  },

  // ── Testing ──────────────────────────────────────────────────────────────
  {
    q: 'What is TestBed and what does it do?',
    a: 'TestBed creates a testing module/environment where you configure providers and imports, then create component fixtures with TestBed.createComponent(). The fixture gives you the component instance, the native element, and detectChanges() to drive rendering. Standalone components import their own dependencies, so configuration is usually just overriding providers with mocks.',
    topic: 'Testing',
    level: 'junior',
  },
  {
    q: 'How do you test code that uses HttpClient?',
    a: 'Use provideHttpClientTesting() alongside provideHttpClient(), then inject HttpTestingController to expectOne() requests, assert their method/headers, and flush() mock responses or error them. After each test call verify() to ensure no unexpected or unhandled requests remain. This tests your service logic without any real network.',
    topic: 'Testing',
    level: 'mid',
  },
  {
    q: 'What are component harnesses and why use them?',
    a: 'A ComponentHarness (from @angular/cdk/testing) is a page-object-style API for interacting with a component in tests — Material ships harnesses for all its components. Tests written against harnesses survive internal DOM refactors because they use the component’s public interaction contract, and the same harness works in unit tests and e2e environments via different harness environments.',
    topic: 'Testing',
    level: 'senior',
  },
  {
    q: 'How do fakeAsync, tick, and flush help test asynchronous code?',
    a: 'fakeAsync runs the test body in a zone where timers and microtasks are virtualized; tick(ms) advances virtual time to fire pending timers, and flush() drains all of them. This makes setTimeout/debounce logic deterministic and synchronous to assert. For promise-only code, await fixture.whenStable() or plain async/await tests are often simpler.',
    topic: 'Testing',
    level: 'mid',
  },
  {
    q: 'How do you test a component that uses signals and OnPush?',
    a: 'Set signal inputs via fixture.componentRef.setInput("name", value) rather than assigning fields, then call fixture.detectChanges() to render. Because signals mark views dirty themselves, assertions about computed values can be made directly on the signals without rendering. Effects run on change detection/flush, so trigger detectChanges (or TestBed.tick in zoneless tests) before asserting their side effects.',
    topic: 'Testing',
    level: 'senior',
  },
];

@Component({
  selector: 'app-interview-prep',
  standalone: true,
  imports: [],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
})
export class InterviewPrepComponent {
  readonly levels = ['all', 'junior', 'mid', 'senior'];

  readonly questions = QUESTIONS;
  readonly topics: string[] = ['all', ...Array.from(new Set(QUESTIONS.map(q => q.topic)))];

  activeLevel = signal<string>('all');
  activeTopic = signal<string>('all');
  expanded = signal<Set<number>>(new Set());

  filtered = computed(() => {
    const level = this.activeLevel();
    const topic = this.activeTopic();
    return this.questions
      .map((item, index) => ({ item, index }))
      .filter(({ item }) =>
        (level === 'all' || item.level === level) &&
        (topic === 'all' || item.topic === topic)
      );
  });

  allOpen = computed(() => {
    const open = this.expanded();
    const visible = this.filtered();
    return visible.length > 0 && visible.every(({ index }) => open.has(index));
  });

  isOpen(index: number): boolean {
    return this.expanded().has(index);
  }

  toggle(index: number): void {
    this.expanded.update(set => {
      const next = new Set(set);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  toggleAll(): void {
    if (this.allOpen()) {
      this.expanded.set(new Set());
    } else {
      this.expanded.set(new Set(this.filtered().map(({ index }) => index)));
    }
  }

  setLevel(level: string): void {
    this.activeLevel.set(level);
  }

  setTopic(topic: string): void {
    this.activeTopic.set(topic);
  }
}
