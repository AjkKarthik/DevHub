import { Component, inject, InjectionToken, signal } from '@angular/core';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { SharedCounterService } from './shared-counter.service';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';
import { ScopedCounterService } from './scoped-counter.service';

export interface AppConfig { apiUrl: string; maxRetries: number; theme: string; }

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config', {
  providedIn: 'root',
  factory: () => ({ apiUrl: 'https://api.example.com', maxRetries: 3, theme: 'light' }),
});

@Component({
  selector: 'app-di-demo',
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './di-demo.html',
  styleUrl: './di-demo.scss',
  providers: [ScopedCounterService],
})
export class DiDemo {
  shared  = inject(SharedCounterService);
  scoped  = inject(ScopedCounterService);
  config  = inject(APP_CONFIG);

  prerequisites: Prerequisite[] = [
    { label: 'Component Lifecycle', route: '/angular/lifecycle' },
    { label: 'Signals & Reactivity', route: '/angular/signals' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'inject()', type: 'function', desc: 'Modern functional API to retrieve a dependency from the current injector context, replacing constructor injection.', since: '14' },
    { name: 'InjectionToken', type: 'class', desc: 'Creates a typed, tree-shakeable DI token for non-class values such as config objects, strings, or interfaces.', since: '2' },
    { name: '@Injectable()', type: 'decorator', desc: 'Marks a class as available to be provided and injected as a dependency.', since: '2' },
    { name: 'providedIn: \'root\'', type: 'token', desc: 'Registers a service in the root injector as an app-wide singleton; tree-shaken if never injected.', since: '6' },
    { name: 'providers: []', type: 'token', desc: 'Component or route-level array that creates a new service instance scoped to that component subtree.', since: '2' },
    { name: 'useValue', type: 'token', desc: 'Provider recipe that supplies a static value directly for a given DI token.', since: '2' },
    { name: 'useFactory', type: 'token', desc: 'Provider recipe that calls a factory function (with optional deps) to create the value at injection time.', since: '2' },
    { name: 'useExisting', type: 'token', desc: 'Provider recipe that aliases one token to another already-registered token, sharing the same instance.', since: '2' },
    { name: 'inject(Token, { optional: true })', type: 'function', desc: 'Injects a dependency and returns null instead of throwing if no provider is found, replacing @Optional().', since: '14' },
    { name: 'runInInjectionContext()', type: 'function', desc: 'Executes a callback inside a given injector context so inject() calls inside it are valid.', since: '16' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The Angular DI system — injector hierarchy',
      points: [
        'Angular\'s DI system maintains a <strong>tree of injectors</strong> that mirrors the component tree. When a component calls <code>inject(Token)</code>, Angular starts at the component\'s own injector and walks <em>up</em> the tree until it finds a provider for that token, or throws <code>NullInjectorError</code> if none is found.',
        'The injector hierarchy has three levels: <strong>Root/Platform injector</strong> (app-wide singletons, <code>providedIn: \'root\'</code>), <strong>Environment injector</strong> (lazy-loaded routes and standalone bootstrap), and <strong>Component injector</strong> (<code>providers: [...]</code> on a component). Each level can shadow tokens from the level above.',
        'Tokens are the keys of the DI system. A token can be: a class (the most common — <code>inject(UserService)</code>), an <code>InjectionToken&lt;T&gt;</code> (for non-class values), or a string (legacy, avoid — no type safety). The token uniquely identifies what value to provide.',
        '<code>@Injectable({ providedIn: \'root\' })</code> registers the service directly in the root injector. It is <strong>tree-shakeable</strong> — if no component ever injects it, the bundler removes it from the final bundle. This is the default for all new services and replaces the old pattern of listing services in <code>NgModule.providers</code>.',
        'Services are <strong>lazy-initialised</strong> by default — Angular only creates the instance the first time someone injects the token. The instance is then cached in the injector for all subsequent requests at that level, making it a true singleton within its injector scope.',
      ],
    },
    {
      heading: 'Registering providers — providedIn and providers:[]',
      points: [
        '<code>providedIn: \'root\'</code> makes a service a true app-wide singleton. All components, directives, pipes, and services that inject it receive the <em>same instance</em>. This is what you want for shared state, HTTP clients, and cross-cutting concerns like logging and analytics.',
        '<code>providers: [MyService]</code> in a <code>@Component</code> or <code>@Directive</code> creates a <strong>new instance scoped to that component\'s injector</strong>. All descendants of the component get this instance (not the root one), and the instance is destroyed when the component is destroyed — perfect for per-wizard, per-modal, or per-route state.',
        'Route-level scope: provide a service in <code>{ path: \'feature\', loadComponent: () => import(...), providers: [FeatureService] }</code> in your route config. Every component within that route gets the scoped instance, and it is destroyed when the user navigates away.',
        'The same class can be provided at multiple levels simultaneously. A component that provides <code>LogService</code> shadows the root <code>LogService</code> for its subtree. Components outside that subtree still get the root version. This is intentional hierarchical overriding — useful for testing and multi-tenant UIs.',
        'For <strong>testing</strong>, providing a mock at the component level is the cleanest pattern: <code>providers: [{ provide: MyService, useClass: MockMyService }]</code> in <code>TestBed.configureTestingModule</code>. The mock is scoped to the test and does not affect other tests.',
      ],
    },
    {
      heading: 'InjectionToken — typed, tree-shakeable non-class tokens',
      points: [
        '<code>new InjectionToken&lt;T&gt;(\'description\')</code> creates a typed DI key for values that are not classes — config objects, primitives, functions, interfaces. The description is used in error messages and DevTools; the generic <code>&lt;T&gt;</code> gives compile-time type safety at the injection site.',
        'Provide with a factory for tree-shakeability: <code>new InjectionToken&lt;Config&gt;(\'config\', { providedIn: \'root\', factory: () => defaultConfig })</code>. Without the <code>{ providedIn, factory }</code> second argument, the token must be explicitly listed in a <code>providers</code> array.',
        'Override a token in a specific context: <code>providers: [{ provide: APP_CONFIG, useValue: { apiUrl: \'/mock\' } }]</code>. The override is visible only within the component subtree where it is provided — root components and other subtrees still get the original factory value.',
        'The <code>useFactory</code> recipe with <code>deps</code>: <code>{ provide: AuthHeaders, useFactory: (auth: AuthService) => ({ Authorization: auth.getToken() }), deps: [AuthService] }</code>. Angular resolves the <code>deps</code> through DI and passes them as arguments to the factory function.',
        'TypeScript <strong>interfaces are erased at runtime</strong> — they cannot be used as DI tokens. Always use <code>InjectionToken&lt;MyInterface&gt;</code> when you need to inject a value typed to an interface. This is also why <code>@Inject(\'string-token\')</code> was error-prone — no compile-time type checking.',
      ],
    },
    {
      heading: 'inject() — the modern functional API',
      points: [
        '<code>inject(Token)</code> is the preferred way to retrieve dependencies in Angular 14+. Use it at the class field level (<code>private svc = inject(UserService)</code>) or in the constructor body. It eliminates constructor parameter lists and works identically for all token types — class, <code>InjectionToken</code>, or string.',
        '<code>inject()</code> is only valid inside an <strong>injection context</strong>: a class constructor, a field initializer during class construction, or a function passed to <code>runInInjectionContext()</code>. Calling it in <code>ngOnInit</code>, an event handler, or a <code>setTimeout</code> callback throws <code>NG0203: inject() must be called from an injection context</code>.',
        'Modifier options replace the old decorator stack: <code>inject(Token, { optional: true })</code> replaces <code>@Optional()</code>, <code>inject(Token, { self: true })</code> replaces <code>@Self()</code>, and <code>inject(Token, { skipSelf: true })</code> replaces <code>@SkipSelf()</code>. Options can be combined: <code>{ self: true, optional: true }</code>.',
        '<code>runInInjectionContext(injector, () => inject(Token))</code> lets you call <code>inject()</code> outside a class (e.g., in a route guard written as a standalone function, or in a test). The injector is usually retrieved via <code>inject(Injector)</code> inside a component.',
        'Factory functions passed to <code>new InjectionToken(\'desc\', { factory: () => ... })</code> are also injection contexts — you can call <code>inject()</code> inside them to resolve other dependencies as part of the factory.',
      ],
    },
    {
      heading: 'Provider recipes — useValue, useFactory, useClass, useExisting',
      points: [
        '<code>useValue</code> provides a static, already-constructed value: <code>{ provide: API_URL, useValue: environment.apiUrl }</code>. Use it for constants, config objects, and mock values in tests. The value is provided as-is, with no factory call.',
        '<code>useFactory</code> calls a function at injection time: <code>{ provide: Token, useFactory: (dep) => new Thing(dep), deps: [OtherToken] }</code>. The <code>deps</code> array is resolved through DI and passed as positional arguments. Use it for conditional instantiation, lazy initialization, or values that depend on other services.',
        '<code>useClass</code> instantiates a different class for the token: <code>{ provide: AuthService, useClass: MockAuthService }</code>. Angular creates a new instance of <code>MockAuthService</code> and injects it wherever <code>AuthService</code> is requested. Common in testing and feature-flagged behaviour swaps.',
        '<code>useExisting</code> creates an alias — both tokens resolve to the <em>same instance</em>: <code>{ provide: OldService, useExisting: NewService }</code>. Useful for backwards compatibility (keeping an old token working), or for providing a service under an interface token backed by a concrete class.',
        'Multi-providers (<code>multi: true</code>) let multiple values be registered under the same token, collected as an array: <code>{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }</code>. Every provider with <code>multi: true</code> for the same token contributes to the array — Angular merges them in registration order.',
      ],
    },
    {
      heading: 'Testing DI and common patterns',
      points: [
        'In Angular tests, <code>TestBed.configureTestingModule({ providers: [{ provide: UserService, useValue: mockService }] })</code> replaces real services with mocks. The test module creates its own injector, so overrides are isolated to the test.',
        'For component-level providers, use <code>TestBed.overrideComponent(MyComp, { set: { providers: [{ provide: ScopedService, useClass: MockScopedService }] } })</code> to replace services in the component\'s own <code>providers</code> array without touching the root providers.',
        'The <strong>service locator anti-pattern</strong>: injecting <code>Injector</code> and calling <code>injector.get(Token)</code> at runtime. Avoid it — it hides dependencies, makes testing difficult, and bypasses Angular\'s static analysis. Only acceptable inside <code>runInInjectionContext()</code>.',
        'For lazy-loaded features, use environment injectors: <code>createEnvironmentInjector([providers], parentInjector)</code>. This creates an isolated injector for a feature with its own singleton scope, useful for micro-frontend architectures and dynamic component loading.',
        'When two services need each other (circular dependency), break the cycle by extracting shared state into a third service. Alternatively, use a factory with lazy injection: <code>useFactory: () => { const lazy = inject(ServiceB); return new ServiceA(lazy); }</code> — deferred instantiation breaks the cycle.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'providedIn: root (singleton)',
      language: 'typescript',
      code: `// Singleton service — one instance for the whole app
@Injectable({ providedIn: 'root' })
export class SharedCounterService {
  count = signal(0);
  increment() { this.count.update(n => n + 1); }
  decrement() { this.count.update(n => n - 1); }
  reset()     { this.count.set(0); }
}

// Any component that injects this gets the SAME instance
// counter.count() in ComponentA and ComponentB are always in sync
export class ComponentA { counter = inject(SharedCounterService); }
export class ComponentB { counter = inject(SharedCounterService); }`,
    },
    {
      label: 'Component-scoped service',
      language: 'typescript',
      code: `// Scoped service — no providedIn, explicitly provided
@Injectable()   // <-- no providedIn
export class ScopedCounterService {
  count = signal(0);
  increment() { this.count.update(n => n + 1); }
  reset()     { this.count.set(0); }
}

// Component provides it — creates a NEW instance per component
@Component({
  providers: [ScopedCounterService],  // scoped here
})
export class MyComponent {
  scoped = inject(ScopedCounterService); // gets this component's instance
}

// Two instances of MyComponent → two independent counters
// Destroyed automatically when the component is destroyed`,
    },
    {
      label: 'InjectionToken',
      language: 'typescript',
      code: `import { InjectionToken, inject } from '@angular/core';

export interface AppConfig { apiUrl: string; maxRetries: number; }

// Typed, tree-shakeable token with a default factory
export const APP_CONFIG = new InjectionToken<AppConfig>('app.config', {
  providedIn: 'root',
  factory: () => ({
    apiUrl: 'https://api.example.com',
    maxRetries: 3,
  }),
});

// Inject — fully typed, no casting
export class MyService {
  private config = inject(APP_CONFIG);
  // this.config.apiUrl     ← string ✓
  // this.config.maxRetries ← number ✓
}

// Override in tests or specific components:
// providers: [{ provide: APP_CONFIG, useValue: { apiUrl: '/mock', maxRetries: 0 } }]`,
    },
    {
      label: 'Hierarchical DI',
      language: 'typescript',
      code: `// DI resolves from the component's own injector, walking UP to root.

// Root level (global singleton)
@Injectable({ providedIn: 'root' })
export class LogService { log(msg: string) { console.log('[ROOT]', msg); } }

// Feature level — overrides root for this component and its subtree
@Component({
  providers: [{
    provide: LogService,
    useValue: { log: (m: string) => console.log('[FEATURE]', m) },
  }],
})
export class FeatureRoot {}

// Child gets the FEATURE version (closest injector wins)
export class ChildComponent {
  log = inject(LogService); // → '[FEATURE]' logger
}

// Sibling of FeatureRoot still gets ROOT version
export class SiblingComponent {
  log = inject(LogService); // → '[ROOT]' logger

  // Force parent injector: inject(LogService, { skipSelf: true })
}`,
    },
    {
      label: 'useValue / useFactory / useClass / useExisting',
      language: 'typescript',
      code: `providers: [
  // useValue — provide a static, pre-built value
  { provide: API_URL, useValue: 'https://api.example.com' },

  // useFactory — call a function; deps are resolved via DI
  {
    provide: LogService,
    useFactory: (env: Environment) => new LogService(env.isDev),
    deps: [Environment],
  },

  // useClass — replace one class with another (e.g. mocks in tests)
  { provide: AuthService, useClass: MockAuthService },

  // useExisting — alias: both tokens resolve to the SAME instance
  { provide: OldApiService, useExisting: NewApiService },

  // multi: true — collect multiple values into an array
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: LogInterceptor,  multi: true },
  // inject(HTTP_INTERCEPTORS) → [AuthInterceptor, LogInterceptor]
]`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What does providedIn: \'root\' do?',
      options: [
        'Creates a new instance per component',
        'Creates a single app-wide singleton, tree-shakeable if unused',
        'Provides the service only in lazy-loaded routes',
        'Makes the service available only in the AppModule',
      ],
      answer: 1,
      explanation: 'providedIn: \'root\' registers the service in the root injector. Angular tree-shakes it if nothing injects it, so unused services don\'t inflate the bundle.',
    },
    {
      q: 'What is an InjectionToken used for?',
      options: [
        'Replacing class-based services with primitive values',
        'A typed, tree-shakeable token for non-class values like config objects and interfaces',
        'Injecting DOM elements directly',
        'Defining route guards',
      ],
      answer: 1,
      explanation: 'InjectionToken<T> is the standard way to provide strings, numbers, config objects, or typed interfaces — not classes that can serve as their own tokens. TypeScript interfaces are erased at runtime, so they cannot be tokens; InjectionToken<Interface> bridges that gap.',
    },
    {
      q: 'If a component provides a service in its providers array, what happens?',
      options: [
        'It replaces the root singleton for all components app-wide',
        'Each component instance gets its own service instance, destroyed when the component is destroyed',
        'The service becomes available globally for all lazy routes',
        'All root-level singletons are destroyed and recreated',
      ],
      answer: 1,
      explanation: 'Component-level providers create a new instance scoped to that component\'s injector subtree. Child components get this instance, not the root one. It is destroyed automatically when the component is removed from the DOM.',
    },
    {
      q: 'What does inject() replace?',
      options: ['@Input()', 'Constructor injection with type annotations', '@Output()', 'ngOnInit()'],
      answer: 1,
      explanation: 'inject(Token) is the modern alternative to constructor(private svc: Service). It works in injection contexts: class field initializers and constructor bodies. inject() is cleaner, avoids parameter list bloat, and works the same for all token types.',
    },
    {
      q: 'What does useExisting do in a provider?',
      options: [
        'Creates a new instance of the target class',
        'Aliases one token to an already-registered token, resolving to the same instance',
        'Replaces one class with a different class (creates new instance)',
        'Marks a service as optional so NullInjectorError is suppressed',
      ],
      answer: 1,
      explanation: 'useExisting creates an alias — both tokens resolve to the same singleton. Useful for providing a concrete class under an interface token, or for backwards compatibility when renaming a service.',
    },
    {
      q: 'What happens when you call inject() inside ngOnInit?',
      options: [
        'It works fine — injection context is active throughout the component lifecycle',
        'It throws NG0203: inject() must be called from an injection context',
        'It returns undefined but does not throw',
        'It works in development mode but fails in production builds',
      ],
      answer: 1,
      explanation: 'inject() is only valid during class instantiation (field initializers and constructor body). By the time ngOnInit runs, the injection context is closed. Inject at the field level or in the constructor instead.',
    },
    {
      q: 'What does inject(AuthService, { optional: true }) return when AuthService is not provided?',
      options: [
        'Throws NullInjectorError',
        'Returns null',
        'Returns undefined',
        'Returns a default AuthService instance',
      ],
      answer: 1,
      explanation: 'The { optional: true } option tells Angular to return null (not throw) if the token has no provider. This replaces @Optional() from the old constructor injection pattern. The type becomes T | null so TypeScript enforces null checking.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between providedIn: root and component-level providers?',
      a: '<code>providedIn: \'root\'</code> creates a single instance shared across the whole app — a true singleton. <code>providers: [MyService]</code> in a component creates a new instance for that component and its descendants — it is destroyed when the component is destroyed, and each mount of the component gets its own fresh instance.',
    },
    {
      q: 'What is an InjectionToken and when do you use it?',
      a: '<code>InjectionToken&lt;T&gt;</code> creates a typed DI key for non-class values (strings, numbers, config objects, functions). TypeScript interfaces are erased at runtime, so they cannot be tokens. Example: <code>const API_URL = new InjectionToken&lt;string&gt;(\'api-url\')</code>. Inject with <code>inject(API_URL)</code> — fully typed as <code>string</code>.',
    },
    {
      q: 'How does inject() differ from constructor injection?',
      a: '<code>inject(Service)</code> works at field initializer level and in the constructor body — no parameter list needed. Constructor injection only works via constructor parameters with type annotations. <code>inject()</code> is the modern pattern, works for all token types identically, and supports modifier options (<code>{ optional, self, skipSelf }</code>) without decorator stacking.',
    },
    {
      q: 'What happens if a service is not provided?',
      a: 'Angular throws <code>NullInjectorError: No provider for MyService</code> at runtime when first accessed. Fix by: adding <code>providedIn: \'root\'</code> to the service, adding it to a <code>providers</code> array, or using <code>inject(Token, { optional: true })</code> (returns <code>null</code> instead of throwing).',
    },
    {
      q: 'Can you have multiple instances of a providedIn: root service?',
      a: 'Not within the same application runtime. That is the point of <code>providedIn: \'root\'</code>. If you need per-component instances, use <code>providers: [MyService]</code> on each component. For per-route instances, provide in the route\'s <code>providers</code> array in the route config.',
    },
    {
      q: 'What is useFactory in a provider?',
      a: '<code>{ provide: Token, useFactory: (dep) => new MyService(dep), deps: [OtherService] }</code> — the factory function runs at injection time, receives its <code>deps</code> resolved by DI, and returns the value. Use it for conditional instantiation (prod vs dev), values that depend on other services, or any case where a static value is insufficient.',
    },
    {
      q: 'What is runInInjectionContext() and when do you need it?',
      a: '<code>runInInjectionContext(injector, callback)</code> executes the callback inside a valid injection context, making <code>inject()</code> calls valid inside it. You need it when you want to call <code>inject()</code> outside a class — for example, in a standalone route guard function that receives a <code>EnvironmentInjector</code>, or in test utilities that set up services lazily.',
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Service injection: constructor vs inject()',
      before: `// Old: constructor injection
@Component({ ... })
export class MyComponent {
  constructor(
    private auth: AuthService,
    private log:  LogService
  ) {}
}`,
      after: `// New: functional inject() at field level
@Component({ ... })
export class MyComponent {
  private auth = inject(AuthService);
  private log  = inject(LogService);
}`,
      note: 'inject() works in constructors and field initializers. No constructor parameter list needed — cleaner for components with many dependencies.',
    },
    {
      title: 'Optional dependency: @Optional() vs inject() options',
      before: `// Old: decorator-based optional
import { Optional } from '@angular/core';
constructor(@Optional() private svc: MyService) {
  if (svc) { svc.init(); }
}`,
      after: `// New: inject with options object
const svc = inject(MyService, { optional: true });
if (svc) { svc.init(); }
// Also: { self: true } | { skipSelf: true } | { host: true }`,
      note: 'The options object replaces @Optional(), @Self(), @SkipSelf(), and @Host() — cleaner and combinable.',
    },
    {
      title: 'Non-class values: string token vs InjectionToken',
      before: `// Old: magic string token (no type safety)
providers: [{ provide: 'API_URL', useValue: 'https://api.example.com' }]
// Inject:
constructor(@Inject('API_URL') private url: string) {}`,
      after: `// New: typed InjectionToken
export const API_URL = new InjectionToken<string>('api.url');
providers: [{ provide: API_URL, useValue: 'https://api.example.com' }]
// Inject — fully typed string:
readonly url = inject(API_URL);`,
      note: 'InjectionToken is tree-shakeable and provides compile-time type safety. String tokens are stringly-typed and refactor-unfriendly.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Calling inject() outside an injection context',
      wrong: `ngOnInit() {
  setTimeout(() => {
    const svc = inject(MyService); // throws NG0203!
  });
}`,
      right: `// Inject at field level — always safe
private svc = inject(MyService);`,
      explanation: 'inject() is only valid during class construction (field initializers and constructor body). Calling it later — in lifecycle hooks, callbacks, or promises — throws NG0203. Inject at the field level or in the constructor, store the reference, and use it anywhere.',
    },
    {
      title: 'Forgetting providers:[] — root singleton leaks into scoped component',
      wrong: `// Intending per-component state but omitting providers
@Component({ selector: 'app-counter' })
export class CounterComponent {
  svc = inject(CounterService); // resolves ROOT singleton!
}
// Two instances of CounterComponent share state!`,
      right: `@Component({
  selector: 'app-counter',
  providers: [CounterService], // new instance per component
})
export class CounterComponent {
  svc = inject(CounterService); // this component's own instance
}`,
      explanation: 'Without providers:[] on the component, Angular walks up to the root injector and returns the shared singleton. All instances of the component share state, causing unexpected cross-component state bleed.',
    },
    {
      title: 'Using a plain interface as a DI token',
      wrong: `interface Config { apiUrl: string; }
// Cannot use interface as token — erased at runtime
providers: [{ provide: Config, useValue: { apiUrl: '/' } }]
// Error: 'Config' only refers to a type`,
      right: `export const CONFIG = new InjectionToken<Config>('config', {
  factory: () => ({ apiUrl: '/' }),
});
const cfg = inject(CONFIG); // typed as Config ✓`,
      explanation: 'TypeScript interfaces are compile-time only — they do not exist at runtime. InjectionToken<T> provides a real runtime object as the token while preserving the type for injection sites.',
    },
    {
      title: 'Circular service dependencies',
      wrong: `@Injectable({ providedIn: 'root' })
export class ServiceA { b = inject(ServiceB); }
@Injectable({ providedIn: 'root' })
export class ServiceB { a = inject(ServiceA); } // circular → runtime error`,
      right: `// Break the cycle with a shared third service
@Injectable({ providedIn: 'root' })
export class SharedState { value = signal(0); }

// Both A and B inject SharedState instead of each other`,
      explanation: 'Circular DI creates an infinite instantiation loop and throws at runtime. Extract shared state into a third service, or use a factory with lazy injection to defer one side of the dependency.',
    },
    {
      title: 'Providing a service in multiple components — expecting one instance',
      wrong: `// Placing providers:[] in both components thinking one instance is created
@Component({ providers: [CartService] }) class HeaderComponent {}
@Component({ providers: [CartService] }) class CartComponent {}
// These are TWO separate CartService instances — state is NOT shared!`,
      right: `// For shared state, use providedIn: 'root' on the service
@Injectable({ providedIn: 'root' })
export class CartService { items = signal<CartItem[]>([]); }

// OR provide once in the nearest common ancestor:
@Component({ providers: [CartService] }) class AppShellComponent {}
// Then inject in both Header and Cart — they share the shell's instance`,
      explanation: 'Every component that declares a service in its own providers:[] gets an independent instance. For shared state, use providedIn:\'root\' or provide once in the common ancestor component.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Angular\'s DI resolves tokens by walking up the injector hierarchy from the component to root; <code>inject()</code> is the modern functional API replacing constructor injection, and <code>InjectionToken&lt;T&gt;</code> provides typed tokens for non-class values.',
    mustKnow: [
      '<code>providedIn: \'root\'</code> → one app-wide singleton, tree-shakeable; <code>providers: [...]</code> on a component → new instance per component, destroyed with component',
      '<code>inject(Token)</code> only valid during class construction (field init / constructor body) — calling it in <code>ngOnInit</code> or callbacks throws <code>NG0203</code>',
      '<code>InjectionToken&lt;T&gt;</code> is required for non-class values — TypeScript interfaces are erased at runtime and cannot be tokens',
      'DI resolves from the nearest injector upward — a component-level provider shadows the root provider for its subtree',
      'Provider recipes: <code>useValue</code> (static), <code>useFactory</code> (function + deps), <code>useClass</code> (different class), <code>useExisting</code> (alias)',
      '<code>inject(Token, { optional: true })</code> → returns <code>null</code> instead of throwing; <code>{ self, skipSelf }</code> control injector-level search',
      'Circular dependencies throw at runtime — break cycles with a shared third service',
    ],
    interviewFocus: [
      'Explain the Angular injector hierarchy — how does DI resolution walk up the tree?',
      'When would you use component-level providers instead of providedIn:\'root\'?',
      'Why can\'t you use a TypeScript interface as a DI token, and what do you use instead?',
      'What is the difference between useClass and useExisting in a provider recipe?',
      'Where can you call inject() and where will it throw NG0203?',
    ],
  };

  challenge: Challenge = {
    title: 'Typed Config InjectionToken',
    description: 'Create an InjectionToken<AppConfig> for a config object with apiUrl and featureFlags. Provide it with a factory in the root injector and inject it in a component.',
    language: 'typescript',
    hints: [
      'new InjectionToken<AppConfig>(\'app.config\', { providedIn: \'root\', factory: () => ({...}) })',
      'Export the token so it can be imported anywhere in the app',
      'Inject with inject(APP_CONFIG) at the field level in the component',
      'Override in tests: providers: [{ provide: APP_CONFIG, useValue: { apiUrl: \'/mock\' } }]',
    ],
    starterCode: `import { InjectionToken, inject, Component } from '@angular/core';

interface AppConfig {
  apiUrl: string;
  featureFlags: { darkMode: boolean; beta: boolean };
}

// TODO: create APP_CONFIG InjectionToken with a root factory
// that returns the default config

@Component({ selector: 'app-demo', standalone: true, template: \`{{ config.apiUrl }}\` })
export class DemoComponent {
  // TODO: inject APP_CONFIG
}`,
    solution: `import { InjectionToken, inject, Component } from '@angular/core';

interface AppConfig {
  apiUrl: string;
  featureFlags: { darkMode: boolean; beta: boolean };
}

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config', {
  providedIn: 'root',
  factory: () => ({
    apiUrl: 'https://api.example.com',
    featureFlags: { darkMode: true, beta: false },
  }),
});

@Component({ selector: 'app-demo', standalone: true, template: \`{{ config.apiUrl }}\` })
export class DemoComponent {
  config = inject(APP_CONFIG); // typed as AppConfig ✓
}`,
  };
}
