import { Component, inject, InjectionToken, signal } from '@angular/core';
import { QnaBlockComponent, QnaItem } from '../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../shared/challenge-block/challenge-block';
import { SharedCounterService } from './shared-counter.service';
import { CodeBlockComponent, CodeTab } from '../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../shared/theory-block/theory-block';
import { QuickRefComponent, QuickRefItem } from '../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../shared/version-badge/version-badge';
import { PageMetaComponent } from '../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../shared/page-complete/page-complete';

// InjectionToken — typed, tree-shakeable alternative to string tokens
export interface AppConfig { apiUrl: string; maxRetries: number; theme: string; }

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config', {
  providedIn: 'root',
  factory: () => ({ apiUrl: 'https://api.example.com', maxRetries: 3, theme: 'light' }),
});

// Component that injects the SCOPED service (not root singleton)
import { ScopedCounterService } from './scoped-counter.service';

@Component({
  selector: 'app-di-demo',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './di-demo.html',
  styleUrl: './di-demo.scss',
  // Provide scoped service here — each instance of THIS component gets its own
  providers: [ScopedCounterService],
})
export class DiDemo {
  // Shared singleton (providedIn:'root') — same instance app-wide
  shared  = inject(SharedCounterService);
  // Scoped service (providers:[]) — new instance per component
  scoped  = inject(ScopedCounterService);
  // InjectionToken
  config  = inject(APP_CONFIG);

  theory: TheoryPoint[] = [
  {
    heading: 'How Angular DI works',
    points: [
      'The DI system maps a token (a class, string, or <code>InjectionToken</code>) to a value or factory.',
      '<code>inject(MyService)</code> looks up the token in the current injector hierarchy and returns the instance.',
      'Angular has a tree of injectors: root → environment (lazy module) → component. Each level can override a token.',
      '<code>providedIn: \'root\'</code>: a single singleton shared across the whole app. Tree-shakeable — only included if used.',
    ],
  },
  {
    heading: 'Scoped providers',
    points: [
      '<code>providers: [MyService]</code> in a <code>@Component</code> creates a new instance scoped to that component subtree.',
      'Child components that inject the same service get the component-scoped instance, not the root singleton.',
      'When the component is destroyed, its scoped services are also destroyed — good for per-route state.',
      'Route-level scope: provide in <code>loadComponent</code>\'s <code>providers</code> or in a lazy module\'s <code>providers</code>.',
    ],
  },
  {
    heading: 'InjectionToken',
    points: [
      'Use <code>new InjectionToken&lt;T&gt;(\'description\')</code> for non-class values (primitives, configs, interfaces).',
      'Provide with <code>{ provide: MY_TOKEN, useValue: ... }</code> or <code>useFactory: () => ...</code>.',
      'Inject with <code>inject(MY_TOKEN)</code> — TypeScript infers the type from the token\'s generic.',
      'Common pattern: <code>{ provide: MY_TOKEN, useFactory: () => ..., deps: [OtherService] }</code>.',
    ],
  },
  {
    heading: 'Key points to remember',
    points: [
      'Constructor injection is the old way. Modern Angular uses <code>inject()</code> at the field level — works in constructors, factory functions, and <code>runInInjectionContext</code>.',
      '<code>@Optional()</code> → <code>inject(Token, { optional: true })</code>: returns null if the token is not registered.',
      '<code>@Self()</code> / <code>@SkipSelf()</code>: control which injector level to start searching from.',
      'Circular dependencies between services cause a runtime error — break cycles with a third shared service or lazy injection.',
    ],
  },
];

  qna: QnaItem[] = [
    { q: 'What is the difference between providedIn root and component-level providers?', a: '<code>providedIn: \'root\'</code> creates a single instance shared across the whole app (singleton). <code>providers: [MyService]</code> in a component creates a new instance for that component and its descendants — destroyed with the component.' },
    { q: 'What is an InjectionToken and when do you use it?', a: '<code>InjectionToken</code> creates a DI token for non-class values (strings, configs, functions). Example: <code>const API_URL = new InjectionToken&lt;string&gt;(\'api-url\')</code>. Provide with <code>{ provide: API_URL, useValue: \'https://api.example.com\' }</code>.' },
    { q: 'How does inject() differ from constructor injection?', a: '<code>inject(Service)</code> works anywhere in an injection context — field initialisers, standalone functions, guards. Constructor injection only works in class constructors. <code>inject()</code> is the modern pattern.' },
    { q: 'What happens if a service is not provided?', a: 'Angular throws <code>NullInjectorError: No provider for MyService</code> at runtime. Fix by adding it to providers, setting <code>providedIn: \'root\'</code>, or importing the module/config that provides it.' },
    { q: 'Can you have multiple instances of a providedIn root service?', a: 'No — that\'s the point of <code>providedIn: \'root\'</code>. If you need per-component instances, use <code>providers: [MyService]</code> in the component decorator. Each instance gets its own state.' },
    { q: 'What is useFactory in a provider?', a: '<code>{ provide: TOKEN, useFactory: (dep) => new MyService(dep), deps: [OtherService] }</code> — factory runs during injection, receives deps, and returns the value. Useful for conditional or config-driven instantiation.' },
  ];

  tabs: CodeTab[] = [
    {
      label: 'providedIn: root (singleton)',
      language: 'typescript',
      code: `// Singleton service — one instance for the whole app
@Injectable({ providedIn: 'root' })
export class SharedCounterService {
  count = signal(0);
  increment() { this.count.update(n => n + 1); }
}

// Any component that injects this gets the SAME instance
export class ComponentA { counter = inject(SharedCounterService); }
export class ComponentB { counter = inject(SharedCounterService); }
// counter.count() in A and B are ALWAYS in sync`,
    },
    {
      label: 'Component-scoped service',
      language: 'typescript',
      code: `// Scoped service — no providedIn, must be explicitly provided
@Injectable()   // <-- no providedIn
export class ScopedCounterService {
  count = signal(0);
  increment() { this.count.update(n => n + 1); }
}

// Component provides it — creates a NEW instance per component
@Component({
  providers: [ScopedCounterService],  // <-- new instance here
})
export class MyComponent {
  scoped = inject(ScopedCounterService);
}

// Two instances of MyComponent = two independent counters
// Destroyed when the component is destroyed (automatic cleanup)`,
    },
    {
      label: 'InjectionToken',
      language: 'typescript',
      code: `import { InjectionToken } from '@angular/core';

// Define a typed token (avoids magic strings)
export interface AppConfig { apiUrl: string; maxRetries: number; }

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config', {
  providedIn: 'root',
  factory: () => ({
    apiUrl: 'https://api.example.com',
    maxRetries: 3,
  }),
});

// Inject with the token — fully typed!
export class MyService {
  private config = inject(APP_CONFIG);
  // this.config.apiUrl, this.config.maxRetries — typed
}

// Override in tests or specific modules:
// providers: [{ provide: APP_CONFIG, useValue: { apiUrl: '/mock', maxRetries: 0 } }]`,
    },
    {
      label: 'Hierarchical DI',
      language: 'typescript',
      code: `// DI resolves from the injector closest to the component,
// walking UP the component tree until it finds a provider.

// Root level (global singleton)
@Injectable({ providedIn: 'root' })
export class LogService { log(msg: string) { console.log('[ROOT]', msg); } }

// Feature level (overrides root for this subtree)
@Component({
  providers: [
    {
      provide: LogService,
      useValue: { log: (msg: string) => console.log('[FEATURE]', msg) },
    },
  ],
})
export class FeatureRoot {}

// Child of FeatureRoot gets the FEATURE version, not root
export class ChildComponent {
  log = inject(LogService); // resolves to FEATURE logger
}

// Sibling of FeatureRoot gets the ROOT version
export class SiblingComponent {
  log = inject(LogService); // resolves to ROOT logger
}`,
    },
    {
      label: 'useValue / useFactory / useExisting',
      language: 'typescript',
      code: `// providers array — multiple ways to provide a value:

providers: [
  // useValue — provide a static value directly
  { provide: API_URL, useValue: 'https://api.example.com' },

  // useFactory — call a function to create the value
  {
    provide: LogService,
    useFactory: (env: Environment) => new LogService(env.isDev),
    deps: [Environment],
  },

  // useExisting — alias one token to another
  { provide: OldService, useExisting: NewService },

  // useClass — provide a different class for the token
  { provide: AuthService, useClass: MockAuthService },
]`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What does providedIn: \'root\' do?', options: ['Creates a new instance per component', 'Creates a single app-wide singleton, tree-shakeable if unused', 'Provides the service in the nearest module', 'Makes the service available only in lazy routes'], answer: 1, explanation: 'providedIn: \'root\' registers the service in the root injector. Angular tree-shakes it if no component injects it.' },
    { q: 'What is an InjectionToken used for?', options: ['Replacing class-based services with primitives', 'A typed, tree-shakeable token for non-class values like config objects', 'Injecting DOM elements', 'Defining route guards'], answer: 1, explanation: 'InjectionToken<T> is the go-to for providing strings, numbers, config objects, or interfaces — not classes that can serve as their own tokens.' },
    { q: 'If a component provides a service in its providers array, what happens?', options: ['It replaces the root singleton for all components', 'Each component instance gets its own service instance, destroyed with the component', 'The service becomes available app-wide', 'The root singleton is ignored'], answer: 1, explanation: 'Component-level providers create a new instance scoped to that component\'s injector subtree. Child components get this instance, not the root one.' },
    { q: 'What is inject() replacing?', options: ['@Input()', 'Constructor injection with type annotations', '@Output()', 'ngOnInit()'], answer: 1, explanation: 'inject(Token) is the modern alternative to constructor(private svc: Service). It works in injection context: constructors, field initializers, and factory functions.' },
    { q: 'What does useExisting do in a provider?', options: ['Creates a new instance of the class', 'Aliases one token to an already-registered token (same instance)', 'Replaces one class with another', 'Marks a service as optional'], answer: 1, explanation: 'useExisting creates an alias — both tokens resolve to the same instance. Useful for providing an interface token backed by a concrete class.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'inject()', type: 'function', desc: 'Modern functional API to retrieve a dependency from the current injector context, replacing constructor injection.' , since: '14'},
    { name: 'InjectionToken', type: 'class', desc: 'Creates a typed, tree-shakeable DI token for non-class values such as config objects, strings, or interfaces.' , since: '2'},
    { name: '@Injectable()', type: 'decorator', desc: 'Marks a class as available to be provided and injected as a dependency.' , since: '2'},
    { name: 'providedIn: \'root\'', type: 'token', desc: 'Registers a service in the root injector as an app-wide singleton; tree-shaken if never injected.' , since: '6'},
    { name: 'providers: []', type: 'token', desc: 'Component or route-level array that creates a new service instance scoped to that component subtree.' , since: '2'},
    { name: 'useValue', type: 'token', desc: 'Provider recipe that supplies a static value directly for a given DI token.' , since: '2'},
    { name: 'useFactory', type: 'token', desc: 'Provider recipe that calls a factory function (with optional deps) to create the value at injection time.' , since: '2'},
    { name: 'useExisting', type: 'token', desc: 'Provider recipe that aliases one token to another already-registered token, sharing the same instance.' , since: '2'},
    { name: 'inject(Token, { optional: true })', type: 'function', desc: 'Injects a dependency and returns null instead of throwing if no provider is found, replacing @Optional().' , since: '14'},
    { name: 'runInInjectionContext()', type: 'function', desc: 'Executes a callback inside a given injector context so inject() calls inside it are valid.' , since: '16'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Service injection: constructor vs inject()', before: '// Old: constructor injection\n@Component({ ... })\nexport class MyComponent {\n  constructor(private auth: AuthService,\n              private log: LogService) {}\n}', after: '// New: functional inject() at field level\n@Component({ ... })\nexport class MyComponent {\n  private auth = inject(AuthService);\n  private log  = inject(LogService);\n}',
      note: 'inject() works in constructors, field initialisers, and factory functions — no constructor boilerplate needed.' },
    { title: 'Optional dependency: @Optional() vs inject() options', before: '// Old: decorator-based optional\nimport { Optional } from \'@angular/core\';\nconstructor(@Optional() private svc: MyService) {\n  if (svc) { svc.init(); }\n}', after: '// New: inject with options object\nconst svc = inject(MyService, { optional: true });\nif (svc) { svc.init(); }',
      note: 'The options object also accepts { self: true } and { skipSelf: true } replacing @Self() and @SkipSelf().' },
    { title: 'Non-class values: string token vs InjectionToken', before: '// Old: magic string token (no type safety)\nproviders: [{ provide: \'API_URL\', useValue: \'https://api.example.com\' }]\n// Inject:\nconstructor(@Inject(\'API_URL\') private url: string) {}', after: '// New: typed InjectionToken\nexport const API_URL = new InjectionToken<string>(\'api.url\');\nproviders: [{ provide: API_URL, useValue: \'https://api.example.com\' }]\n// Inject:\nreadonly url = inject(API_URL); // fully typed string',
      note: 'InjectionToken is tree-shakeable and provides compile-time type safety; string tokens are neither.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Calling inject() outside an injection context', wrong: '// Called inside a setTimeout or event handler\nngOnInit() {\n  setTimeout(() => {\n    const svc = inject(MyService); // throws!\n  });\n}', right: '// Inject at field level or in constructor\nprivate svc = inject(MyService); // always safe', explanation: 'inject() is only valid during class instantiation (field init or constructor). Calling it later throws \'inject() must be called from an injection context\'.'  },
    { title: 'Forgetting providers:[] causes root singleton to leak', wrong: '// Intending per-component state but omitting providers\n@Component({ selector: \'app-counter\' })\nexport class CounterComponent {\n  svc = inject(CounterService); // resolves root singleton!\n}', right: '@Component({\n  selector: \'app-counter\',\n  providers: [CounterService], // new instance per component\n})\nexport class CounterComponent {\n  svc = inject(CounterService);\n}', explanation: 'Without providers:[] on the component, Angular walks up to the root injector and returns the shared singleton, so all instances share state.'  },
    { title: 'Using a plain interface as a DI token', wrong: 'interface Config { apiUrl: string; }\n// Cannot use interface as token — erased at runtime\nproviders: [{ provide: Config, useValue: { apiUrl: \'/\' } }]', right: 'export const CONFIG = new InjectionToken<Config>(\'config\', {\n  factory: () => ({ apiUrl: \'/\' }),\n});\nconst cfg = inject(CONFIG);', explanation: 'TypeScript interfaces are compile-time only. Use InjectionToken<T> as the runtime token to provide and inject non-class values.'  },
    { title: 'Circular service dependencies', wrong: '// ServiceA injects ServiceB, ServiceB injects ServiceA\n@Injectable({ providedIn: \'root\' })\nexport class ServiceA { b = inject(ServiceB); }\n@Injectable({ providedIn: \'root\' })\nexport class ServiceB { a = inject(ServiceA); } // circular!', right: '// Break the cycle with a shared third service\n@Injectable({ providedIn: \'root\' })\nexport class SharedState { value = signal(0); }\n// Both A and B inject SharedState instead', explanation: 'Circular DI dependencies cause a runtime error. Refactor shared state into a third service, or use lazy injection via a factory.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: '14', label: 'Angular 14 — inject() goes public', features: ['inject() became a stable public API usable outside of constructors', 'Enables dependency injection in standalone functions, guards, and resolvers', 'Replaces constructor injection and @Inject()/@Optional()/@Self() decorator combinations'] },
    { version: '6', label: 'Angular 6 — providedIn and tree-shakeable providers', features: ['providedIn: \'root\' introduced so services no longer need to be listed in NgModule providers', 'Tree-shaking removes services that are never injected, reducing bundle size', 'InjectionToken gained optional { providedIn, factory } second argument for the same benefit'] },
  ];

  challenge: Challenge = {
    title: 'Typed Config InjectionToken',
    description: 'Create an InjectionToken<AppConfig> for a config object with apiUrl and featureFlags. Provide it in app.config.ts and inject it in a component.',
    language: 'typescript',
    hints: [
      'Use new InjectionToken<AppConfig>(\'app.config\', { providedIn: \'root\', factory: () => ({...}) })',
      'The factory function returns the default value',
      'Inject it with inject(APP_CONFIG) in a component',
      'Export the token so it can be imported anywhere'
    ],
    starterCode: `import { InjectionToken, inject, Component } from '@angular/core';

interface AppConfig {
  apiUrl: string;
  featureFlags: { darkMode: boolean; beta: boolean };
}

// TODO: create APP_CONFIG InjectionToken with a default factory

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
  config = inject(APP_CONFIG);
}`,
  };
}
