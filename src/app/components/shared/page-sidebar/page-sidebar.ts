import { Component, computed, inject } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

export interface DocLink    { label: string; url: string; }
export interface Resource   { label: string; url: string; badge: 'docs' | 'video' | 'blog' | 'tool'; }
export interface SidebarData {
  apis:      string[];
  related:   { label: string; route: string }[];
  tip:       string;
  docs:      DocLink[];
  resources: Resource[];
  gotchas:   string[];
}

const DEFAULT: SidebarData = {
  apis: ['signal()', 'computed()', 'inject()', 'input()'],
  related: [
    { label: 'Signals & State',  route: '/counter' },
    { label: 'HTTP Client',      route: '/http' },
    { label: 'Testing',          route: '/testing' },
  ],
  tip: 'Every Angular concept here is standalone — no NgModules needed. Explore freely.',
  docs: [
    { label: 'Angular Docs Home',   url: 'https://angular.dev' },
    { label: 'angular.dev Guides',  url: 'https://angular.dev/overview' },
    { label: 'API Reference',       url: 'https://angular.dev/api' },
  ],
  resources: [
    { label: 'Angular Blog',         url: 'https://blog.angular.dev',         badge: 'blog'  },
    { label: 'Angular YouTube',      url: 'https://www.youtube.com/@Angular',  badge: 'video' },
  ],
  gotchas: [
    'Standalone components need every import declared in their imports[] array — no shared NgModule to inherit from.',
    'signal() reads must happen inside a reactive context (template, computed, effect) for Angular to track dependencies.',
  ],
};

export const SIDEBAR_MAP: Record<string, SidebarData> = {

  // ── Signals & State ────────────────────────────────────────────────────────
  counter: {
    apis: ['signal()', 'computed()', 'effect()', '@if', '@for'],
    related: [
      { label: 'linkedSignal()',   route: '/linked-signal' },
      { label: 'resource() API',  route: '/resource-api'  },
      { label: 'Signal Store',    route: '/store'         },
    ],
    tip: 'Convert a BehaviorSubject to signal() in a real project — computed() will replace most of your subscriptions.',
    docs: [
      { label: 'Signals Overview',      url: 'https://angular.dev/guide/signals'         },
      { label: 'signal() API',          url: 'https://angular.dev/api/core/signal'       },
      { label: 'computed() API',        url: 'https://angular.dev/api/core/computed'     },
      { label: 'effect() API',          url: 'https://angular.dev/api/core/effect'       },
    ],
    resources: [
      { label: 'RxJS Interop Guide',    url: 'https://angular.dev/guide/rxjs-interop',   badge: 'docs'  },
      { label: 'Angular — YouTube',     url: 'https://www.youtube.com/@Angular',          badge: 'video' },
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',             badge: 'blog'  },
    ],
    gotchas: [
      'Writing to signals inside effect() causes an infinite loop — pass { allowSignalWrites: true } only as a last resort.',
      'computed() is lazy — it runs only when first read, not immediately when dependencies change.',
      'effect() must be created in an injection context (constructor / field initialiser) — not inside a method.',
    ],
  },

  // ── Template Syntax ────────────────────────────────────────────────────────
  templates: {
    apis: ['[property]', '(event)', '@if', '@for', 'async |', '?.'],
    related: [
      { label: 'Directives',  route: '/directives' },
      { label: 'Pipes',       route: '/pipes'      },
      { label: 'Lifecycle',   route: '/lifecycle'  },
    ],
    tip: 'Prefer @if / @for over *ngIf / *ngFor for all new code — no CommonModule import needed.',
    docs: [
      { label: 'Template Overview',    url: 'https://angular.dev/guide/templates'           },
      { label: 'Control Flow (@if)',   url: 'https://angular.dev/guide/templates/control-flow' },
      { label: 'Property Binding',     url: 'https://angular.dev/guide/templates/property-binding' },
      { label: 'Event Binding',        url: 'https://angular.dev/guide/templates/event-binding'    },
    ],
    resources: [
      { label: 'Template Reference',   url: 'https://angular.dev/guide/templates',          badge: 'docs'  },
      { label: 'angular.dev Tutorials',url: 'https://angular.dev/tutorials',                badge: 'blog'  },
    ],
    gotchas: [
      '@for requires a track expression — without it Angular re-creates the entire DOM list on every change.',
      'Safe navigation ?. only short-circuits in templates — it does not guard inside TypeScript expressions.',
      'Two-way [(ngModel)] requires FormsModule imported in the component — it is not available globally.',
    ],
  },

  // ── Directives ─────────────────────────────────────────────────────────────
  directives: {
    apis: ['@Directive', 'HostBinding', 'HostListener', 'Renderer2', 'inject()'],
    related: [
      { label: 'Template Syntax',      route: '/templates'           },
      { label: 'Content Projection',   route: '/content-projection'  },
      { label: 'Angular CDK',          route: '/cdk'                 },
    ],
    tip: 'Use Renderer2 instead of direct DOM access — keeps directives SSR-safe and platform-agnostic.',
    docs: [
      { label: 'Attribute Directives',   url: 'https://angular.dev/guide/directives/attribute-directives' },
      { label: 'Structural Directives',  url: 'https://angular.dev/guide/directives/structural-directives'},
      { label: 'Directive Composition',  url: 'https://angular.dev/guide/directives/directive-composition-api' },
    ],
    resources: [
      { label: 'Renderer2 API',          url: 'https://angular.dev/api/core/Renderer2',     badge: 'docs'  },
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',              badge: 'blog'  },
    ],
    gotchas: [
      'Structural directives cannot be on the same element as another structural directive — use <ng-container> to nest them.',
      'HostListener events fire on the host element, not the component inside it — be specific with event targets.',
    ],
  },

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────
  lifecycle: {
    apis: ['ngOnInit', 'ngOnDestroy', 'afterNextRender()', 'DestroyRef', 'viewChild()'],
    related: [
      { label: 'DestroyRef',        route: '/destroy-ref'   },
      { label: 'Signals & State',   route: '/counter'       },
      { label: 'Input / Output',    route: '/parent-child'  },
    ],
    tip: 'Replace ngOnDestroy + Subject takeUntil with takeUntilDestroyed() — less code and never forgets cleanup.',
    docs: [
      { label: 'Lifecycle Hooks Guide',  url: 'https://angular.dev/guide/components/lifecycle'              },
      { label: 'afterNextRender API',    url: 'https://angular.dev/api/core/afterNextRender'                },
      { label: 'DestroyRef API',         url: 'https://angular.dev/api/core/DestroyRef'                     },
    ],
    resources: [
      { label: 'takeUntilDestroyed',     url: 'https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed', badge: 'docs' },
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                              badge: 'blog' },
    ],
    gotchas: [
      'viewChild() signal is undefined during ngOnInit — read it inside effect() or afterViewInit, never in ngOnInit.',
      'ngAfterViewInit is NOT SSR-safe — use afterNextRender() for DOM operations that need the browser.',
      'ngOnChanges fires BEFORE ngOnInit on the first render — both receive the initial input values.',
    ],
  },

  // ── Pipes ──────────────────────────────────────────────────────────────────
  pipes: {
    apis: ['DatePipe', 'CurrencyPipe', 'AsyncPipe', 'PipeTransform', 'pure: false'],
    related: [
      { label: 'Template Syntax',  route: '/templates' },
      { label: 'RxJS Operators',   route: '/rxjs'      },
      { label: 'i18n',             route: '/i18n'      },
    ],
    tip: 'Keep custom pipes pure (default) — Angular memoises the result and only re-runs when the input reference changes.',
    docs: [
      { label: 'Pipes Overview',        url: 'https://angular.dev/guide/pipes'                       },
      { label: 'Custom Pipes',          url: 'https://angular.dev/guide/pipes/custom-pipes'          },
      { label: 'Async Pipe',            url: 'https://angular.dev/api/common/AsyncPipe'              },
      { label: 'DatePipe API',          url: 'https://angular.dev/api/common/DatePipe'               },
    ],
    resources: [
      { label: 'CurrencyPipe API',      url: 'https://angular.dev/api/common/CurrencyPipe',          badge: 'docs'  },
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                        badge: 'blog'  },
    ],
    gotchas: [
      'Impure pipes (pure: false) run on every change detection cycle — use them only when the output depends on mutable state.',
      'The async pipe auto-unsubscribes but only when the component is destroyed — if the template re-renders the subscription resets.',
    ],
  },

  // ── Input / Output ─────────────────────────────────────────────────────────
  'parent-child': {
    apis: ['input()', 'output()', 'model()', 'viewChild()', 'withComponentInputBinding()'],
    related: [
      { label: 'Content Projection',  route: '/content-projection' },
      { label: 'Dependency Injection',route: '/di'                 },
      { label: 'Routing',             route: '/routing'            },
    ],
    tip: 'Use model() for two-way bindings — one line instead of @Input + @Output(\'xChange\').',
    docs: [
      { label: 'Component Inputs',         url: 'https://angular.dev/guide/components/inputs'              },
      { label: 'Component Outputs',        url: 'https://angular.dev/guide/components/outputs'             },
      { label: 'model() Signal',           url: 'https://angular.dev/api/core/model'                       },
      { label: 'input() API',              url: 'https://angular.dev/api/core/input'                       },
    ],
    resources: [
      { label: 'viewChild() API',          url: 'https://angular.dev/api/core/viewChild',                  badge: 'docs'  },
      { label: 'angular.dev Tutorials',    url: 'https://angular.dev/tutorials',                           badge: 'blog'  },
    ],
    gotchas: [
      'input.required() has no default — if the parent forgets to bind it, you get a compile error, not a runtime one.',
      'output() events do not cross router boundaries — use a shared service or signal store for sibling communication.',
      'viewChild() returns undefined until the view initialises — always read inside effect() or afterViewInit.',
    ],
  },

  // ── Content Projection ─────────────────────────────────────────────────────
  'content-projection': {
    apis: ['ng-content', 'select=""', 'contentChild()', 'NgTemplateOutlet', 'ngProjectAs'],
    related: [
      { label: 'Input / Output',    route: '/parent-child' },
      { label: 'Angular CDK',       route: '/cdk'          },
      { label: 'Angular Material',  route: '/material'     },
    ],
    tip: 'Projected content belongs to the host change detection — OnPush on the child does not skip it.',
    docs: [
      { label: 'Content Projection Guide', url: 'https://angular.dev/guide/components/content-projection' },
      { label: 'ng-content Reference',     url: 'https://angular.dev/guide/components/content-projection' },
      { label: 'NgTemplateOutlet API',     url: 'https://angular.dev/api/common/NgTemplateOutlet'         },
    ],
    resources: [
      { label: 'contentChild() API',       url: 'https://angular.dev/api/core/contentChild',               badge: 'docs'  },
      { label: 'angular.dev Tutorials',    url: 'https://angular.dev/tutorials',                           badge: 'blog'  },
    ],
    gotchas: [
      'You cannot project content conditionally with @if inside ng-content itself — gate it in the parent.',
      'contentChild() is undefined until ngAfterContentInit — read it in effect() to be safe.',
    ],
  },

  // ── Dependency Injection ───────────────────────────────────────────────────
  di: {
    apis: ['inject()', 'providedIn: root', 'InjectionToken', 'useFactory', 'useValue'],
    related: [
      { label: 'Signal Store',  route: '/store'   },
      { label: 'HTTP Client',   route: '/http'    },
      { label: 'Lifecycle',     route: '/lifecycle'},
    ],
    tip: 'Prefer inject() over constructor injection — works in field initialisers, guards, and standalone functions.',
    docs: [
      { label: 'DI Overview',             url: 'https://angular.dev/guide/di'                               },
      { label: 'DI in Practice',          url: 'https://angular.dev/guide/di/dependency-injection-in-action'},
      { label: 'InjectionToken API',      url: 'https://angular.dev/api/core/InjectionToken'               },
      { label: 'inject() API',            url: 'https://angular.dev/api/core/inject'                       },
    ],
    resources: [
      { label: 'angular.dev Tutorials',   url: 'https://angular.dev/tutorials',                            badge: 'blog'  },
      { label: 'Angular YouTube',         url: 'https://www.youtube.com/@Angular',                         badge: 'video' },
    ],
    gotchas: [
      'NullInjectorError means the service is not provided anywhere — check providedIn, providers array, or the feature module.',
      'Services with providedIn: root are tree-shaken if never injected — they do not increase bundle size if unused.',
    ],
  },

  // ── Signal Store ───────────────────────────────────────────────────────────
  store: {
    apis: ['signal()', 'computed()', 'asReadonly()', 'Injectable', 'providedIn'],
    related: [
      { label: 'Signals & State',  route: '/counter'       },
      { label: 'NgRx Signals',     route: '/ngrx-signals'  },
      { label: 'RxJS Operators',   route: '/rxjs'          },
    ],
    tip: 'Expose state only via asReadonly() — force mutation through store methods to keep state changes predictable.',
    docs: [
      { label: 'Signals Guide',          url: 'https://angular.dev/guide/signals'         },
      { label: 'Injectable API',         url: 'https://angular.dev/api/core/Injectable'   },
      { label: 'DI Overview',            url: 'https://angular.dev/guide/di'              },
    ],
    resources: [
      { label: 'NgRx Official Docs',     url: 'https://ngrx.io/docs',                     badge: 'docs'  },
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',             badge: 'blog'  },
    ],
    gotchas: [
      'A root-scoped service stores state for the entire app lifetime — reset state on logout to avoid data leaks between users.',
      'Multiple components reading the same signal re-render independently — each component subscribes to only what it reads.',
    ],
  },

  // ── Routing ────────────────────────────────────────────────────────────────
  routing: {
    apis: ['RouterLink', 'ActivatedRoute', 'CanActivateFn', 'loadComponent()', 'withComponentInputBinding()'],
    related: [
      { label: 'Route Resolvers',  route: '/route-resolvers' },
      { label: 'Preloading',       route: '/preloading'      },
      { label: 'Todo (guarded)',   route: '/todo'            },
    ],
    tip: 'withComponentInputBinding() lets route params and resolved data flow directly into input() signals — no ActivatedRoute injection.',
    docs: [
      { label: 'Routing Overview',          url: 'https://angular.dev/guide/routing'                           },
      { label: 'Route Guards',              url: 'https://angular.dev/guide/routing/route-guards'              },
      { label: 'Lazy Loading',              url: 'https://angular.dev/guide/routing/lazy-loading'              },
      { label: 'Router API',                url: 'https://angular.dev/api/router/Router'                       },
    ],
    resources: [
      { label: 'CanActivateFn API',         url: 'https://angular.dev/api/router/CanActivateFn',               badge: 'docs'  },
      { label: 'angular.dev Tutorials',     url: 'https://angular.dev/tutorials',                              badge: 'blog'  },
    ],
    gotchas: [
      'loadComponent() requires a default export or .then(m => m.MyComponent) — forgetting the property name causes a blank page.',
      'CanActivateFn returning false blocks navigation but leaves the URL unchanged — return a UrlTree to redirect instead.',
    ],
  },

  // ── Forms ──────────────────────────────────────────────────────────────────
  forms: {
    apis: ['FormControl', 'FormGroup', 'Validators', 'form.value', 'markAllAsTouched()'],
    related: [
      { label: 'FormArray',            route: '/form-array'         },
      { label: 'Custom Validators',    route: '/custom-validators'  },
      { label: 'Control Value Accessor', route: '/cva'             },
    ],
    tip: 'Call form.markAllAsTouched() on submit to reveal all validation errors at once.',
    docs: [
      { label: 'Reactive Forms',         url: 'https://angular.dev/guide/forms/reactive-forms'      },
      { label: 'Template-driven Forms',  url: 'https://angular.dev/guide/forms/template-driven-forms'},
      { label: 'Form Validation',        url: 'https://angular.dev/guide/forms/form-validation'     },
      { label: 'FormBuilder API',        url: 'https://angular.dev/api/forms/FormBuilder'           },
    ],
    resources: [
      { label: 'ReactiveFormsModule',    url: 'https://angular.dev/api/forms/ReactiveFormsModule',   badge: 'docs'  },
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                      badge: 'blog'  },
    ],
    gotchas: [
      'form.value omits disabled controls — use form.getRawValue() when you need all field values including disabled ones.',
      'Template-driven forms are async — values are not available synchronously in ngOnInit.',
    ],
  },

  // ── FormArray ──────────────────────────────────────────────────────────────
  'form-array': {
    apis: ['FormArray', 'fb.array()', 'push()', 'removeAt()', 'getRawValue()'],
    related: [
      { label: 'Template vs Reactive', route: '/forms'         },
      { label: 'Wizard Form',          route: '/wizard-form'   },
      { label: 'Dynamic Forms',        route: '/dynamic-forms' },
    ],
    tip: 'Always use getRawValue() when submitting if any field might be disabled — form.value silently drops them.',
    docs: [
      { label: 'FormArray Guide',       url: 'https://angular.dev/guide/forms/reactive-forms'       },
      { label: 'FormArray API',         url: 'https://angular.dev/api/forms/FormArray'              },
      { label: 'Form Validation',       url: 'https://angular.dev/guide/forms/form-validation'      },
    ],
    resources: [
      { label: 'FormBuilder API',       url: 'https://angular.dev/api/forms/FormBuilder',            badge: 'docs'  },
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                        badge: 'blog'  },
    ],
    gotchas: [
      'Removing items shifts all subsequent indices — avoid caching the index in event handlers; read from the event directly.',
      'FormArray validation requires a custom validator on the array itself, not on the group controls.',
    ],
  },

  // ── Todo (guarded) ─────────────────────────────────────────────────────────
  todo: {
    apis: ['inject()', 'CanActivateFn', 'CanDeactivateFn', 'Router', 'FormGroup'],
    related: [
      { label: 'Routing',              route: '/routing' },
      { label: 'Template vs Reactive', route: '/forms'   },
      { label: 'Dependency Injection', route: '/di'      },
    ],
    tip: 'Implement CanDeactivateFn to warn users before leaving with unsaved changes.',
    docs: [
      { label: 'Route Guards',          url: 'https://angular.dev/guide/routing/route-guards'   },
      { label: 'CanActivateFn API',     url: 'https://angular.dev/api/router/CanActivateFn'     },
      { label: 'CanDeactivateFn API',   url: 'https://angular.dev/api/router/CanDeactivateFn'   },
    ],
    resources: [
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                   badge: 'blog'  },
      { label: 'Angular YouTube',        url: 'https://www.youtube.com/@Angular',               badge: 'video' },
    ],
    gotchas: [
      'Guards returning false block navigation silently — always redirect to a meaningful route with a UrlTree.',
      'CanDeactivate is not called on browser back/forward — handle popstate separately if you need full coverage.',
    ],
  },

  // ── Zod Validation ─────────────────────────────────────────────────────────
  'zod-forms': {
    apis: ['z.object()', 'z.infer<>', 'safeParse()', 'z.refine()', '.superRefine()'],
    related: [
      { label: 'Custom Validators',  route: '/custom-validators' },
      { label: 'HTTP Client',        route: '/http'              },
      { label: 'Template vs Reactive', route: '/forms'          },
    ],
    tip: 'z.infer<typeof schema> derives the TypeScript type automatically — one source of truth for both compile and runtime.',
    docs: [
      { label: 'Zod Official Docs',    url: 'https://zod.dev'                              },
      { label: 'Zod — Objects',        url: 'https://zod.dev/?id=objects'                  },
      { label: 'Zod — Validation',     url: 'https://zod.dev/?id=refine'                   },
      { label: 'Form Validation Guide',url: 'https://angular.dev/guide/forms/form-validation'},
    ],
    resources: [
      { label: 'TypeScript Handbook',  url: 'https://www.typescriptlang.org/docs',          badge: 'docs'  },
      { label: 'angular.dev Tutorials',url: 'https://angular.dev/tutorials',                badge: 'blog'  },
    ],
    gotchas: [
      'Always use safeParse() for user input — parse() throws and will crash unhandled in an event handler.',
      'Zod errors nest when schemas are nested — call flatten() on ZodError to get a flat error map for forms.',
    ],
  },

  // ── Custom Validators ──────────────────────────────────────────────────────
  'custom-validators': {
    apis: ['ValidatorFn', 'AsyncValidatorFn', 'ValidationErrors', 'AbstractControl', 'updateOn'],
    related: [
      { label: 'Zod Validation',        route: '/zod-forms' },
      { label: 'Control Value Accessor',route: '/cva'        },
      { label: 'Template vs Reactive',  route: '/forms'      },
    ],
    tip: 'Apply cross-field validators to the FormGroup — the validator receives the group and can access all controls.',
    docs: [
      { label: 'Custom Validators Guide', url: 'https://angular.dev/guide/forms/form-validation#custom-validators' },
      { label: 'Async Validators',        url: 'https://angular.dev/guide/forms/form-validation#async-validation'  },
      { label: 'AbstractControl API',     url: 'https://angular.dev/api/forms/AbstractControl'                     },
      { label: 'ValidatorFn API',         url: 'https://angular.dev/api/forms/ValidatorFn'                         },
    ],
    resources: [
      { label: 'angular.dev Tutorials',   url: 'https://angular.dev/tutorials',                                    badge: 'blog'  },
    ],
    gotchas: [
      'Return null (not undefined) for valid — Angular checks for null specifically.',
      'Async validators show PENDING status while running — always show a spinner to avoid confusing users.',
    ],
  },

  // ── Control Value Accessor ─────────────────────────────────────────────────
  cva: {
    apis: ['ControlValueAccessor', 'NG_VALUE_ACCESSOR', 'writeValue()', 'registerOnChange()', 'registerOnTouched()'],
    related: [
      { label: 'Custom Validators',  route: '/custom-validators' },
      { label: 'Angular Material',   route: '/material'          },
      { label: 'Template vs Reactive', route: '/forms'          },
    ],
    tip: 'Never call onChange() inside writeValue() — Angular sets the value programmatically there and looping it back causes an infinite cycle.',
    docs: [
      { label: 'CVA Guide',              url: 'https://angular.dev/guide/forms/control-status-styling'                },
      { label: 'ControlValueAccessor',   url: 'https://angular.dev/api/forms/ControlValueAccessor'                   },
      { label: 'NG_VALUE_ACCESSOR',      url: 'https://angular.dev/api/forms/NG_VALUE_ACCESSOR'                      },
    ],
    resources: [
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                                       badge: 'blog'  },
      { label: 'Angular Blog',           url: 'https://blog.angular.dev',                                            badge: 'blog'  },
    ],
    gotchas: [
      'forwardRef() is needed in NG_VALUE_ACCESSOR because the class is referenced before it is fully defined.',
      'setDisabledState() is optional in the interface but Angular WILL call it — implement it to avoid errors.',
    ],
  },

  // ── HTTP Client ────────────────────────────────────────────────────────────
  http: {
    apis: ['HttpClient', 'provideHttpClient()', 'withInterceptors()', 'catchError()', 'toSignal()'],
    related: [
      { label: 'RxJS Operators',   route: '/rxjs'          },
      { label: 'resource() API',   route: '/resource-api'  },
      { label: 'TanStack Query',   route: '/tanstack-query' },
    ],
    tip: 'httpResource() is the modern alternative — signals, auto-cancellation, and no manual subscription.',
    docs: [
      { label: 'HTTP Client Guide',    url: 'https://angular.dev/guide/http'                      },
      { label: 'HTTP Interceptors',    url: 'https://angular.dev/guide/http/interceptors'         },
      { label: 'provideHttpClient()',  url: 'https://angular.dev/api/common/http/provideHttpClient'},
      { label: 'HttpClient API',       url: 'https://angular.dev/api/common/http/HttpClient'      },
    ],
    resources: [
      { label: 'httpResource() API',   url: 'https://angular.dev/api/common/http/httpResource',   badge: 'docs'  },
      { label: 'angular.dev Tutorials',url: 'https://angular.dev/tutorials',                      badge: 'blog'  },
    ],
    gotchas: [
      'HttpClient returns cold Observables — nothing happens until you subscribe (or use async pipe / toSignal).',
      'Interceptors added with withInterceptors([fn]) run in order — auth interceptor should be first to attach the token.',
    ],
  },

  // ── RxJS Operators ─────────────────────────────────────────────────────────
  rxjs: {
    apis: ['switchMap', 'combineLatest', 'BehaviorSubject', 'toSignal()', 'debounceTime'],
    related: [
      { label: 'HTTP Client',    route: '/http'         },
      { label: 'DestroyRef',     route: '/destroy-ref'  },
      { label: 'Signal Store',   route: '/store'        },
    ],
    tip: 'switchMap cancels the previous inner Observable — perfect for search where only the latest query matters.',
    docs: [
      { label: 'RxJS Official Docs',     url: 'https://rxjs.dev'                              },
      { label: 'RxJS Operators A–Z',     url: 'https://rxjs.dev/api'                          },
      { label: 'toSignal() API',         url: 'https://angular.dev/api/core/rxjs-interop/toSignal' },
      { label: 'RxJS Interop Guide',     url: 'https://angular.dev/guide/rxjs-interop'        },
    ],
    resources: [
      { label: 'learnrxjs.io',           url: 'https://www.learnrxjs.io',                     badge: 'docs'  },
      { label: 'RxJS Marbles (Visual)',  url: 'https://rxmarbles.com',                         badge: 'tool'  },
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                badge: 'blog'  },
    ],
    gotchas: [
      'mergeMap starts all inner Observables concurrently — use concatMap if order matters and switchMap if only the latest matters.',
      'BehaviorSubject requires an initial value — use ReplaySubject(1) if you cannot provide one at construction time.',
    ],
  },

  // ── @defer Blocks ──────────────────────────────────────────────────────────
  defer: {
    apis: ['@defer', '@placeholder', '@loading', '@error', 'on viewport', 'when'],
    related: [
      { label: 'Change Detection',  route: '/change-detection' },
      { label: 'Preloading',        route: '/preloading'       },
      { label: 'NgOptimizedImage',  route: '/ng-image'         },
    ],
    tip: '@defer only works with standalone components — migrate NgModule-based components before deferring.',
    docs: [
      { label: '@defer Overview',       url: 'https://angular.dev/guide/defer'                  },
      { label: 'Deferred Loading API',  url: 'https://angular.dev/guide/defer'                  },
    ],
    resources: [
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                   badge: 'blog'  },
      { label: 'Angular Blog',          url: 'https://blog.angular.dev',                        badge: 'blog'  },
      { label: 'Angular YouTube',       url: 'https://www.youtube.com/@Angular',               badge: 'video' },
    ],
    gotchas: [
      '@defer does not work with NgModule-based components — the component must be standalone.',
      'The @placeholder block stays visible until the chunk loads — keep it lightweight to avoid layout shift.',
    ],
  },

  // ── Change Detection ───────────────────────────────────────────────────────
  'change-detection': {
    apis: ['OnPush', 'ChangeDetectorRef', 'markForCheck()', 'detach()', 'signal()'],
    related: [
      { label: 'Zoneless Angular',  route: '/zoneless' },
      { label: '@defer Blocks',     route: '/defer'    },
      { label: 'Signals & State',   route: '/counter'  },
    ],
    tip: 'Signals + OnPush is the sweet spot — signals notify only the components that read them; OnPush skips everything else.',
    docs: [
      { label: 'Change Detection Guide',  url: 'https://angular.dev/guide/change-detection'                    },
      { label: 'Zoneless Guide',          url: 'https://angular.dev/guide/experimental/zoneless'               },
      { label: 'ChangeDetectorRef API',   url: 'https://angular.dev/api/core/ChangeDetectorRef'                },
    ],
    resources: [
      { label: 'angular.dev Tutorials',   url: 'https://angular.dev/tutorials',                                badge: 'blog'  },
      { label: 'Angular Blog',            url: 'https://blog.angular.dev',                                     badge: 'blog'  },
    ],
    gotchas: [
      'Mutating an array/object does not trigger OnPush — always replace the reference: items = [...items, newItem].',
      'markForCheck() schedules a check for the next cycle — changes are not applied synchronously.',
    ],
  },

  // ── Angular Material ───────────────────────────────────────────────────────
  material: {
    apis: ['MatDialog', 'MatSnackBar', 'MAT_DIALOG_DATA', 'MatTableDataSource', 'provideAnimationsAsync()'],
    related: [
      { label: 'Angular CDK',   route: '/cdk'        },
      { label: 'Animations',    route: '/animations' },
      { label: 'Template vs Reactive', route: '/forms' },
    ],
    tip: 'Use NoopAnimationsModule in unit tests to prevent async animation timing from breaking assertions.',
    docs: [
      { label: 'Angular Material Docs',   url: 'https://material.angular.io'                                },
      { label: 'Material Components',     url: 'https://material.angular.io/components/categories'          },
      { label: 'Theming Guide',           url: 'https://material.angular.io/guide/theming'                  },
      { label: 'provideAnimationsAsync',  url: 'https://angular.dev/api/platform-browser/animations/provideAnimationsAsync' },
    ],
    resources: [
      { label: 'Material Icons',          url: 'https://fonts.google.com/icons',                            badge: 'tool'  },
      { label: 'angular.dev Tutorials',   url: 'https://angular.dev/tutorials',                             badge: 'blog'  },
    ],
    gotchas: [
      'Material components require provideAnimationsAsync() in app.config.ts — forgetting it causes them to render incorrectly.',
      'MatDialog.open() returns a MatDialogRef — always subscribe to afterClosed() to receive the result.',
    ],
  },

  // ── Angular CDK ────────────────────────────────────────────────────────────
  cdk: {
    apis: ['DragDropModule', 'CdkVirtualScrollViewport', 'BreakpointObserver', 'Clipboard', 'Overlay'],
    related: [
      { label: 'Angular Material',  route: '/material'   },
      { label: 'Animations',        route: '/animations' },
      { label: 'Web Workers',       route: '/web-workers'},
    ],
    tip: 'CdkVirtualScrollViewport renders only visible rows — use it for lists with 500+ items to avoid DOM bloat.',
    docs: [
      { label: 'Angular CDK Docs',       url: 'https://material.angular.io/cdk/categories'                },
      { label: 'Drag & Drop',            url: 'https://material.angular.io/cdk/drag-drop/overview'        },
      { label: 'Virtual Scrolling',      url: 'https://material.angular.io/cdk/scrolling/overview'        },
      { label: 'BreakpointObserver',     url: 'https://material.angular.io/cdk/layout/overview'           },
    ],
    resources: [
      { label: 'Clipboard API (CDK)',    url: 'https://material.angular.io/cdk/clipboard/overview',        badge: 'docs'  },
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                             badge: 'blog'  },
    ],
    gotchas: [
      'moveItemInArray mutates the original array — if the component is OnPush, manually call markForCheck() or spread the array after.',
      'CdkVirtualScrollViewport requires a fixed itemSize — dynamic row heights need a custom size function.',
    ],
  },

  // ── Animations ─────────────────────────────────────────────────────────────
  animations: {
    apis: ['trigger()', 'state()', 'transition()', 'animate()', 'stagger()', ':enter / :leave'],
    related: [
      { label: 'Angular Material',  route: '/material'  },
      { label: 'Angular CDK',       route: '/cdk'       },
      { label: '@defer Blocks',     route: '/defer'     },
    ],
    tip: 'Bind triggers to signals: [@anim]="isOpen() ? \'open\' : \'closed\'" — reactive animations with no extra code.',
    docs: [
      { label: 'Animations Overview',    url: 'https://angular.dev/guide/animations'                       },
      { label: 'Transition & Triggers',  url: 'https://angular.dev/guide/animations/transition-and-triggers'},
      { label: 'Reusable Animations',    url: 'https://angular.dev/guide/animations/reusable-animations'   },
    ],
    resources: [
      { label: 'Web Animations API',     url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API', badge: 'docs' },
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                             badge: 'blog'  },
    ],
    gotchas: [
      ':leave holds the element in the DOM during the animation — account for this if other components detect its absence.',
      'Animations require provideAnimations() or provideAnimationsAsync() — they silently no-op without it.',
    ],
  },

  // ── Charts ─────────────────────────────────────────────────────────────────
  charts: {
    apis: ['afterNextRender()', 'viewChild()', 'ElementRef', 'chart.update()', 'chart.destroy()'],
    related: [
      { label: 'Web Workers',       route: '/web-workers' },
      { label: 'NgOptimizedImage',  route: '/ng-image'   },
      { label: 'Angular Material',  route: '/material'   },
    ],
    tip: 'Always call chart.destroy() via DestroyRef.onDestroy() — browsers warn about too many active Chart.js contexts.',
    docs: [
      { label: 'Chart.js Official Docs',  url: 'https://www.chartjs.org/docs/latest'                      },
      { label: 'Chart.js — Chart Types',  url: 'https://www.chartjs.org/docs/latest/charts'               },
      { label: 'afterNextRender() API',   url: 'https://angular.dev/api/core/afterNextRender'              },
    ],
    resources: [
      { label: 'ng2-charts Library',      url: 'https://valor-software.com/ng2-charts',                    badge: 'tool'  },
      { label: 'D3.js Docs',              url: 'https://d3js.org',                                         badge: 'docs'  },
      { label: 'angular.dev Tutorials',   url: 'https://angular.dev/tutorials',                            badge: 'blog'  },
    ],
    gotchas: [
      'Initialise Chart.js only inside afterNextRender() — the canvas element does not exist in SSR or before first paint.',
      'chart.update() is incremental — call it after data changes; never destroy + recreate as it causes a visible flash.',
    ],
  },

  // ── AG Grid ────────────────────────────────────────────────────────────────
  'ag-grid': {
    apis: ['AgGridAngular', 'ColDef', 'GridReadyEvent', 'GridApi', 'themeQuartz'],
    related: [
      { label: 'TanStack Query',    route: '/tanstack-query' },
      { label: 'HTTP Client',       route: '/http'           },
      { label: 'Angular Material',  route: '/material'       },
    ],
    tip: 'Always replace the rowData array reference to trigger a re-render — pushing to the same array does nothing.',
    docs: [
      { label: 'AG Grid Angular Docs',  url: 'https://www.ag-grid.com/angular-data-grid'              },
      { label: 'AG Grid Theming',       url: 'https://www.ag-grid.com/angular-data-grid/theming'      },
      { label: 'Column Definitions',    url: 'https://www.ag-grid.com/angular-data-grid/column-defs'  },
    ],
    resources: [
      { label: 'AG Grid Examples',      url: 'https://www.ag-grid.com/example',                       badge: 'tool'  },
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                         badge: 'blog'  },
    ],
    gotchas: [
      'Store the GridApi from the GridReady event — calling grid methods before GridReady fires will throw.',
      'themeQuartz is the new CSS-in-JS theme (AG Grid 31+) — the old CSS class themes still work but are deprecated.',
    ],
  },

  // ── TanStack Query ─────────────────────────────────────────────────────────
  'tanstack-query': {
    apis: ['injectQuery()', 'queryKey', 'injectMutation()', 'invalidateQueries()', 'enabled'],
    related: [
      { label: 'HTTP Client',      route: '/http'         },
      { label: 'RxJS Operators',   route: '/rxjs'         },
      { label: 'resource() API',   route: '/resource-api' },
    ],
    tip: 'Set enabled: !!id() to pause a query until a value is ready — no empty fetch, no conditional workaround.',
    docs: [
      { label: 'TanStack Query Angular', url: 'https://tanstack.com/query/latest/docs/angular/overview'   },
      { label: 'Query Keys',             url: 'https://tanstack.com/query/latest/docs/angular/guides/query-keys' },
      { label: 'Mutations',              url: 'https://tanstack.com/query/latest/docs/angular/guides/mutations'  },
    ],
    resources: [
      { label: 'TanStack Query Devtools',url: 'https://tanstack.com/query/latest/docs/angular/devtools',   badge: 'tool'  },
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                             badge: 'blog'  },
    ],
    gotchas: [
      'queryKey changes trigger a new fetch — include every variable the queryFn uses inside the key array.',
      'invalidateQueries marks data stale but does not immediately refetch — refetch happens when a consumer mounts.',
    ],
  },

  // ── date-fns ───────────────────────────────────────────────────────────────
  'date-fns': {
    apis: ['format()', 'parseISO()', 'formatDistance()', 'addDays()', 'isValid()'],
    related: [
      { label: 'Pipes',  route: '/pipes' },
      { label: 'i18n',   route: '/i18n'  },
      { label: 'Template Syntax', route: '/templates' },
    ],
    tip: 'Always check isValid(parsed) after parse() — it returns Invalid Date silently for bad strings.',
    docs: [
      { label: 'date-fns Official Docs',  url: 'https://date-fns.org'                                      },
      { label: 'date-fns API Reference',  url: 'https://date-fns.org/docs/Getting-Started'                 },
      { label: 'date-fns-tz (timezones)', url: 'https://www.npmjs.com/package/date-fns-tz'                 },
    ],
    resources: [
      { label: 'MDN — Date Reference',   url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date', badge: 'docs' },
      { label: 'Intl API (MDN)',          url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl', badge: 'docs' },
    ],
    gotchas: [
      'new Date("2024-01-01") is UTC midnight but new Date("01/01/2024") is local time — always use parseISO() for ISO strings.',
      'date-fns functions are immutable — they never modify the Date you pass in, always returning a new instance.',
    ],
  },

  // ── Tailwind CSS ───────────────────────────────────────────────────────────
  tailwind: {
    apis: ['@apply', 'dark:', 'sm: md: lg:', 'arbitrary values []', 'clamp()'],
    related: [
      { label: 'Angular Material',  route: '/material'   },
      { label: 'Angular CDK',       route: '/cdk'        },
      { label: 'Animations',        route: '/animations' },
    ],
    tip: 'Never build class names dynamically ("text-" + color) — Tailwind cannot detect incomplete strings at build time.',
    docs: [
      { label: 'Tailwind CSS Docs',      url: 'https://tailwindcss.com/docs'                             },
      { label: 'Tailwind with Angular',  url: 'https://tailwindcss.com/docs/installation/framework-guides/angular' },
      { label: 'Responsive Design',      url: 'https://tailwindcss.com/docs/responsive-design'           },
      { label: 'Dark Mode',              url: 'https://tailwindcss.com/docs/dark-mode'                   },
    ],
    resources: [
      { label: 'Tailwind UI (Components)',url: 'https://tailwindui.com',                                  badge: 'tool'  },
      { label: 'Headless UI',             url: 'https://headlessui.com',                                  badge: 'tool'  },
    ],
    gotchas: [
      'Tailwind scans files as plain text — class names must appear as complete strings, not built with concatenation.',
      'The dark: variant requires the .dark class on <html> by default — configure darkMode: "media" for OS-level preference.',
    ],
  },

  // ── Testing ────────────────────────────────────────────────────────────────
  testing: {
    apis: ['TestBed', 'ComponentFixture', 'HttpTestingController', 'getByRole()', 'signal()'],
    related: [
      { label: 'E2E (Playwright)',  route: '/e2e'       },
      { label: 'Harnesses',        route: '/harnesses' },
      { label: 'HTTP Client',      route: '/http'      },
    ],
    tip: 'Query by accessible role (getByRole) — these queries survive DOM refactors and double as accessibility checks.',
    docs: [
      { label: 'Angular Testing Guide',     url: 'https://angular.dev/guide/testing'                             },
      { label: 'Component Testing',         url: 'https://angular.dev/guide/testing/components-basics'           },
      { label: 'Http Testing',              url: 'https://angular.dev/guide/http/testing'                        },
    ],
    resources: [
      { label: '@testing-library/angular',  url: 'https://testing-library.com/docs/angular-testing-library/intro', badge: 'docs' },
      { label: 'Jest Docs',                 url: 'https://jestjs.io/docs/getting-started',                        badge: 'docs' },
      { label: 'angular.dev Tutorials',     url: 'https://angular.dev/tutorials',                                 badge: 'blog' },
    ],
    gotchas: [
      'fixture.detectChanges() must be called after component creation and after every state change in tests.',
      'Async operations in tests need fakeAsync + tick() or async + waitForAsync to avoid flaky assertions.',
    ],
  },

  // ── Route Resolvers ────────────────────────────────────────────────────────
  'route-resolvers': {
    apis: ['ResolveFn<T>', 'ActivatedRoute.data', 'withComponentInputBinding()', 'router-outlet name'],
    related: [
      { label: 'Routing',     route: '/routing'    },
      { label: 'HTTP Client', route: '/http'       },
      { label: 'Preloading',  route: '/preloading' },
    ],
    tip: 'All resolvers on a route run in parallel — combine results in one resolver if you need cross-dependencies.',
    docs: [
      { label: 'Route Resolvers Guide',  url: 'https://angular.dev/guide/routing/resolve'                       },
      { label: 'Named Outlets',          url: 'https://angular.dev/guide/routing/router-outlet'                  },
      { label: 'ResolveFn API',          url: 'https://angular.dev/api/router/ResolveFn'                         },
    ],
    resources: [
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                                   badge: 'blog'  },
      { label: 'Angular YouTube',        url: 'https://www.youtube.com/@Angular',                               badge: 'video' },
    ],
    gotchas: [
      'Angular only takes the first emission from a resolver Observable — if it never completes, navigation is blocked forever.',
      'Resolver errors block navigation — catch errors inside the resolver and return a fallback value or redirect.',
    ],
  },

  // ── Preloading ─────────────────────────────────────────────────────────────
  preloading: {
    apis: ['PreloadAllModules', 'PreloadingStrategy', 'QuicklinkStrategy', 'loadComponent()'],
    related: [
      { label: 'Routing',       route: '/routing'  },
      { label: '@defer Blocks', route: '/defer'    },
      { label: 'SSR + Hydration', route: '/ssr'   },
    ],
    tip: 'QuicklinkStrategy (ngx-quicklink) only preloads routes whose links are visible in the viewport — best balance.',
    docs: [
      { label: 'Preloading Guide',      url: 'https://angular.dev/guide/routing/lazy-loading'                   },
      { label: 'Lazy Loading Routes',   url: 'https://angular.dev/guide/routing/lazy-loading'                   },
    ],
    resources: [
      { label: 'ngx-quicklink (npm)',   url: 'https://www.npmjs.com/package/ngx-quicklink',                     badge: 'tool'  },
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                                   badge: 'blog'  },
    ],
    gotchas: [
      'PreloadAllModules downloads all lazy chunks in the background — can waste mobile data for routes users never visit.',
      'Preloading only affects the initial page load; subsequent navigations still use already-downloaded cached chunks.',
    ],
  },

  // ── resource() API ─────────────────────────────────────────────────────────
  'resource-api': {
    apis: ['resource()', 'httpResource()', 'params()', 'loader()', 'abortSignal'],
    related: [
      { label: 'HTTP Client',    route: '/http'          },
      { label: 'RxJS Operators', route: '/rxjs'          },
      { label: 'TanStack Query', route: '/tanstack-query' },
    ],
    tip: 'resource() has no cache layer — for shared caching across components, combine with TanStack Query or a signal store.',
    docs: [
      { label: 'resource() Guide',       url: 'https://angular.dev/guide/signals/resource'        },
      { label: 'resource() API',         url: 'https://angular.dev/api/core/resource'             },
      { label: 'httpResource() API',     url: 'https://angular.dev/api/common/http/httpResource'  },
    ],
    resources: [
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                    badge: 'blog'  },
      { label: 'Angular Blog',           url: 'https://blog.angular.dev',                         badge: 'blog'  },
    ],
    gotchas: [
      'params() must be synchronous — never call async operations inside it; put async work in loader().',
      'Changing params always cancels the in-flight request — pass the abortSignal to fetch() to clean up network requests.',
    ],
  },

  // ── NgRx Signals ───────────────────────────────────────────────────────────
  'ngrx-signals': {
    apis: ['signalStore()', 'withState()', 'withComputed()', 'withMethods()', 'patchState()', 'withEntities()'],
    related: [
      { label: 'Signal Store',    route: '/store'        },
      { label: 'RxJS Operators',  route: '/rxjs'         },
      { label: 'DestroyRef',      route: '/destroy-ref'  },
    ],
    tip: 'Use rxMethod() for HTTP inside NgRx signal stores — it handles Observable lifecycle and integrates automatically.',
    docs: [
      { label: 'NgRx Signals Docs',     url: 'https://ngrx.io/guide/signals'                           },
      { label: 'signalStore() API',     url: 'https://ngrx.io/guide/signals/signal-store'              },
      { label: 'withEntities()',        url: 'https://ngrx.io/guide/signals/signal-store-entities'     },
      { label: 'NgRx DevTools',         url: 'https://ngrx.io/guide/store-devtools'                    },
    ],
    resources: [
      { label: 'NgRx Official Docs',    url: 'https://ngrx.io/docs',                                  badge: 'docs'  },
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                         badge: 'blog'  },
    ],
    gotchas: [
      'patchState() does a shallow merge — nested objects must be spread manually: patchState(store, { nested: { ...store.nested(), key: val } }).',
      'withEntities() uses the entity id field — specify { idKey: "uuid" } if your entity does not have an "id" property.',
    ],
  },

  // ── DestroyRef ─────────────────────────────────────────────────────────────
  'destroy-ref': {
    apis: ['DestroyRef', 'takeUntilDestroyed()', 'onDestroy()', 'inject(DestroyRef)'],
    related: [
      { label: 'Lifecycle Hooks',   route: '/lifecycle' },
      { label: 'RxJS Operators',    route: '/rxjs'      },
      { label: 'Signals & State',   route: '/counter'   },
    ],
    tip: 'DestroyRef.onDestroy() returns a cancel function — call it if you need to remove the cleanup callback early.',
    docs: [
      { label: 'DestroyRef API',              url: 'https://angular.dev/api/core/DestroyRef'                              },
      { label: 'takeUntilDestroyed() API',    url: 'https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed'         },
      { label: 'Component Lifecycle',         url: 'https://angular.dev/guide/components/lifecycle'                       },
    ],
    resources: [
      { label: 'angular.dev Tutorials',       url: 'https://angular.dev/tutorials',                                       badge: 'blog'  },
      { label: 'Angular Blog',                url: 'https://blog.angular.dev',                                            badge: 'blog'  },
    ],
    gotchas: [
      'takeUntilDestroyed() called outside injection context needs the destroyRef argument — store inject(DestroyRef) in a field first.',
      'DestroyRef fires even if the component errors during init — make your cleanup callbacks error-safe.',
    ],
  },

  // ── linkedSignal() ─────────────────────────────────────────────────────────
  'linked-signal': {
    apis: ['linkedSignal()', 'WritableSignal', 'source', 'computation', 'previous?.value'],
    related: [
      { label: 'Signals & State',  route: '/counter'       },
      { label: 'resource() API',   route: '/resource-api'  },
      { label: 'Dynamic Forms',    route: '/dynamic-forms' },
    ],
    tip: 'linkedSignal resets only when the source changes — manual .set() calls persist until the next source emission.',
    docs: [
      { label: 'linkedSignal() Guide',   url: 'https://angular.dev/guide/signals#linked-signals'  },
      { label: 'linkedSignal() API',     url: 'https://angular.dev/api/core/linkedSignal'         },
      { label: 'Signals Overview',       url: 'https://angular.dev/guide/signals'                 },
    ],
    resources: [
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                    badge: 'blog'  },
      { label: 'Angular Blog',           url: 'https://blog.angular.dev',                         badge: 'blog'  },
    ],
    gotchas: [
      'linkedSignal is available from Angular 19+ — verify your version before using it in older projects.',
      'The short form linkedSignal(() => src()) is equivalent to computed() but writable — use computed() if you never need to override.',
    ],
  },

  // ── Zoneless Angular ───────────────────────────────────────────────────────
  zoneless: {
    apis: ['provideExperimentalZonelessChangeDetection()', 'signal()', 'NgZone', 'markForCheck()'],
    related: [
      { label: 'Change Detection',  route: '/change-detection' },
      { label: 'Signals & State',   route: '/counter'          },
      { label: 'SSR + Hydration',   route: '/ssr'              },
    ],
    tip: 'Remove zone.js from polyfills in angular.json after enabling zoneless — do not leave both active.',
    docs: [
      { label: 'Zoneless Guide',         url: 'https://angular.dev/guide/experimental/zoneless'                  },
      { label: 'Change Detection Guide', url: 'https://angular.dev/guide/change-detection'                       },
    ],
    resources: [
      { label: 'Angular Blog',           url: 'https://blog.angular.dev',                                        badge: 'blog'  },
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                                   badge: 'blog'  },
    ],
    gotchas: [
      'Third-party libraries that rely on Zone.js patching will not trigger change detection in zoneless mode — wrap their callbacks with NgZone.run().',
      'setTimeout / setInterval mutations need signal() to notify Angular — plain variable updates are invisible to the scheduler.',
    ],
  },

  // ── Dynamic Forms ──────────────────────────────────────────────────────────
  'dynamic-forms': {
    apis: ['FormBuilder', 'FieldConfig', 'Validators.compose()', '@switch', 'form.get(key)'],
    related: [
      { label: 'Template vs Reactive', route: '/forms'         },
      { label: 'FormArray',            route: '/form-array'    },
      { label: 'Wizard Form',          route: '/wizard-form'   },
    ],
    tip: 'For production schema-driven forms, evaluate @ngx-formly/core — conditional fields, wrappers, and nested groups out of the box.',
    docs: [
      { label: 'Reactive Forms Guide',  url: 'https://angular.dev/guide/forms/reactive-forms'     },
      { label: 'FormBuilder API',       url: 'https://angular.dev/api/forms/FormBuilder'          },
      { label: 'Form Validation',       url: 'https://angular.dev/guide/forms/form-validation'    },
    ],
    resources: [
      { label: 'ngx-formly Library',    url: 'https://formly.dev',                                badge: 'tool'  },
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                     badge: 'blog'  },
    ],
    gotchas: [
      'Generate the FormGroup from the schema before rendering — trying to bind to a non-existent control throws an error.',
      'form.get(key)?.errors is null when valid — always check hasError() instead of comparing errors directly.',
    ],
  },

  // ── Wizard Form ────────────────────────────────────────────────────────────
  'wizard-form': {
    apis: ['FormGroup', 'markAllAsTouched()', 'patchValue()', 'step signal', 'fb.group()'],
    related: [
      { label: 'Template vs Reactive', route: '/forms'         },
      { label: 'Dynamic Forms',        route: '/dynamic-forms' },
      { label: 'Routing',              route: '/routing'       },
    ],
    tip: 'Only validate on Next / Submit — back navigation should always succeed so users can freely correct earlier steps.',
    docs: [
      { label: 'Reactive Forms Guide',  url: 'https://angular.dev/guide/forms/reactive-forms'   },
      { label: 'Form Validation',       url: 'https://angular.dev/guide/forms/form-validation'  },
      { label: 'FormGroup API',         url: 'https://angular.dev/api/forms/FormGroup'          },
    ],
    resources: [
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                   badge: 'blog'  },
      { label: 'Angular Blog',          url: 'https://blog.angular.dev',                        badge: 'blog'  },
    ],
    gotchas: [
      'Each step FormGroup is independent — the final payload is the spread of all step values, not one root form.',
      'Saving wizard progress to localStorage on valueChanges requires debounceTime(300) to avoid flooding storage writes.',
    ],
  },

  // ── E2E (Playwright) ───────────────────────────────────────────────────────
  e2e: {
    apis: ['getByRole()', 'page.route()', 'expect(locator)', 'page.fill()', 'trace: on'],
    related: [
      { label: 'Testing',     route: '/testing'   },
      { label: 'Harnesses',   route: '/harnesses' },
      { label: 'HTTP Client', route: '/http'      },
    ],
    tip: 'Run Playwright in --ui mode during development — step through tests frame-by-frame with full DOM inspection.',
    docs: [
      { label: 'Playwright Docs',         url: 'https://playwright.dev/docs/intro'                          },
      { label: 'Playwright Locators',     url: 'https://playwright.dev/docs/locators'                       },
      { label: 'Network Interception',    url: 'https://playwright.dev/docs/network'                        },
      { label: 'Trace Viewer',            url: 'https://playwright.dev/docs/trace-viewer-intro'             },
    ],
    resources: [
      { label: 'Angular Testing Guide',   url: 'https://angular.dev/guide/testing',                         badge: 'docs'  },
      { label: 'testing-library/angular', url: 'https://testing-library.com/docs/angular-testing-library/intro', badge: 'docs' },
    ],
    gotchas: [
      'Playwright auto-waits — never add manual sleeps; if you find yourself adding them, the selector is likely wrong.',
      'page.route() interceptions persist across tests — call page.unroute() or use it inside a beforeEach/afterEach.',
    ],
  },

  // ── Component Harnesses ────────────────────────────────────────────────────
  harnesses: {
    apis: ['ComponentHarness', 'TestbedHarnessEnvironment', 'locatorFor()', 'MatButtonHarness', '.with()'],
    related: [
      { label: 'Testing',           route: '/testing'  },
      { label: 'Angular Material',  route: '/material' },
      { label: 'Angular CDK',       route: '/cdk'      },
    ],
    tip: 'Write harnesses for shared/library components — application-specific components rarely need them.',
    docs: [
      { label: 'Component Harnesses Guide',  url: 'https://material.angular.io/cdk/test-harnesses/overview'         },
      { label: 'ComponentHarness API',       url: 'https://material.angular.io/cdk/test-harnesses/api'              },
      { label: 'Angular Testing Guide',      url: 'https://angular.dev/guide/testing'                               },
    ],
    resources: [
      { label: 'testing-library/angular',    url: 'https://testing-library.com/docs/angular-testing-library/intro',  badge: 'docs'  },
      { label: 'angular.dev Tutorials',      url: 'https://angular.dev/tutorials',                                   badge: 'blog'  },
    ],
    gotchas: [
      'Harness queries are async — always await locator() calls even if they look synchronous.',
      'Playwright harness environment requires @angular/cdk/testing/playwright — a separate install from the test harness package.',
    ],
  },

  // ── NgOptimizedImage ───────────────────────────────────────────────────────
  'ng-image': {
    apis: ['NgOptimizedImage', 'ngSrc', 'priority', 'fill', 'ngSrcset', 'loaderParams'],
    related: [
      { label: 'PWA / Service Worker', route: '/pwa' },
      { label: 'SSR + Hydration',      route: '/ssr' },
      { label: '@defer Blocks',        route: '/defer'},
    ],
    tip: 'Only add priority to the LCP image — adding it to everything defeats the purpose and wastes fetch priority budget.',
    docs: [
      { label: 'Image Optimization Guide', url: 'https://angular.dev/guide/image-optimization'          },
      { label: 'NgOptimizedImage API',     url: 'https://angular.dev/api/common/NgOptimizedImage'       },
      { label: 'LCP Explained (web.dev)',  url: 'https://web.dev/articles/lcp'                          },
    ],
    resources: [
      { label: 'web.dev Image Guide',      url: 'https://web.dev/learn/images',                         badge: 'blog'  },
      { label: 'PageSpeed Insights',        url: 'https://pagespeed.web.dev',                            badge: 'tool'  },
    ],
    gotchas: [
      'NgOptimizedImage requires explicit width and height attributes — missing them causes a runtime error.',
      'fill mode needs position: relative on the containing element with a defined height — without it the image collapses.',
    ],
  },

  // ── Web Workers ────────────────────────────────────────────────────────────
  'web-workers': {
    apis: ['Worker', 'postMessage()', 'onmessage', 'Transferable', 'Comlink'],
    related: [
      { label: 'PWA / Service Worker',  route: '/pwa'              },
      { label: 'NgOptimizedImage',      route: '/ng-image'         },
      { label: 'Change Detection',      route: '/change-detection' },
    ],
    tip: 'Always call worker.terminate() after getting the result — leaving workers running wastes CPU even after the component is destroyed.',
    docs: [
      { label: 'Web Workers Guide (Angular)', url: 'https://angular.dev/guide/web-worker'                           },
      { label: 'MDN — Web Workers',           url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API'},
      { label: 'Transferable Objects (MDN)',   url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects' },
    ],
    resources: [
      { label: 'Comlink (npm)',          url: 'https://www.npmjs.com/package/comlink',                              badge: 'tool'  },
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                                      badge: 'blog'  },
    ],
    gotchas: [
      'Workers cannot access the DOM or window — any data they need must be passed via postMessage().',
      'Structured clone (postMessage default) copies data — for large ArrayBuffers use transfer to avoid the copy cost.',
    ],
  },

  // ── PWA / Service Worker ───────────────────────────────────────────────────
  pwa: {
    apis: ['SwUpdate', 'versionUpdates', 'ngsw-config.json', 'provideServiceWorker()', 'navigator.serviceWorker'],
    related: [
      { label: 'SSR + Hydration',  route: '/ssr'         },
      { label: 'Web Workers',      route: '/web-workers' },
      { label: 'NgOptimizedImage', route: '/ng-image'    },
    ],
    tip: 'Service workers only activate on HTTPS — use --ssl flag locally or deploy to Netlify/Vercel for PWA testing.',
    docs: [
      { label: 'Service Worker Guide',     url: 'https://angular.dev/ecosystem/service-workers'            },
      { label: 'SwUpdate API',             url: 'https://angular.dev/api/service-worker/SwUpdate'          },
      { label: 'ngsw-config Reference',    url: 'https://angular.dev/ecosystem/service-workers/config'     },
    ],
    resources: [
      { label: 'web.dev — PWA Guide',      url: 'https://web.dev/progressive-web-apps',                    badge: 'blog'  },
      { label: 'Lighthouse (DevTools)',     url: 'https://developer.chrome.com/docs/lighthouse',             badge: 'tool'  },
    ],
    gotchas: [
      'Cached resources are served even after deployment until the user reloads twice — prompt users to refresh via SwUpdate.versionUpdates.',
      'ngsw-config.json caching rules are merged with the service worker binary on build — always rebuild after changing the config.',
    ],
  },

  // ── i18n ───────────────────────────────────────────────────────────────────
  i18n: {
    apis: ['Transloco', 'LOCALE_ID', 'Intl.NumberFormat', 'Intl.DateTimeFormat', 'ng extract-i18n'],
    related: [
      { label: 'Pipes',            route: '/pipes'     },
      { label: 'Template Syntax',  route: '/templates' },
      { label: 'HTTP Client',      route: '/http'      },
    ],
    tip: 'Use Intl.NumberFormat / Intl.DateTimeFormat for numbers and dates — native APIs, zero bundle cost.',
    docs: [
      { label: 'Angular i18n Guide',   url: 'https://angular.dev/guide/i18n'                                      },
      { label: 'Transloco Docs',       url: 'https://jsverse.github.io/transloco'                                 },
      { label: 'MDN — Intl API',       url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl' },
    ],
    resources: [
      { label: 'angular.dev Tutorials',url: 'https://angular.dev/tutorials',                                      badge: 'blog'  },
      { label: 'i18next (alternative)',  url: 'https://www.i18next.com',                                           badge: 'tool'  },
    ],
    gotchas: [
      'Built-in Angular i18n (--localize) produces one build per locale — runtime language switching requires a library like Transloco.',
      'Extracted message IDs change when the surrounding text changes — always re-extract after template edits.',
    ],
  },

  // ── SSR + Hydration ─────────────────────────────────────────────────────────
  ssr: {
    apis: ['provideClientHydration()', 'withEventReplay()', 'isPlatformBrowser()', 'PLATFORM_ID', 'TransferState'],
    related: [
      { label: 'PWA / Service Worker', route: '/pwa'        },
      { label: 'Preloading',           route: '/preloading' },
      { label: 'NgOptimizedImage',     route: '/ng-image'   },
    ],
    tip: 'Guard every browser-only API (window, localStorage, navigator) with isPlatformBrowser() — SSR runs in Node.js.',
    docs: [
      { label: 'SSR Guide',              url: 'https://angular.dev/guide/ssr'                             },
      { label: 'Client-side Hydration',  url: 'https://angular.dev/guide/hydration'                      },
      { label: 'TransferState API',      url: 'https://angular.dev/api/core/TransferState'               },
      { label: 'isPlatformBrowser API',  url: 'https://angular.dev/api/common/isPlatformBrowser'         },
    ],
    resources: [
      { label: 'web.dev — SSR Guide',    url: 'https://web.dev/articles/rendering-on-the-web',            badge: 'blog'  },
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                            badge: 'blog'  },
    ],
    gotchas: [
      'Without hydration, Angular destroys server HTML on bootstrap — causing a flash of unstyled/blank content.',
      'TransferState keys must match exactly on server and client — a mismatch causes a second HTTP request on the client.',
    ],
  },
};

@Component({
  selector: 'app-page-sidebar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page-sidebar.html',
  styleUrl: './page-sidebar.scss',
})
export class PageSidebarComponent {
  private router = inject(Router);

  private routeKey = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url.replace(/^\//, '').split('?')[0]),
      startWith(this.router.url.replace(/^\//, '').split('?')[0])
    ),
    { initialValue: this.router.url.replace(/^\//, '').split('?')[0] }
  );

  data = computed<SidebarData>(() => SIDEBAR_MAP[this.routeKey()] ?? DEFAULT);

  badgeLabel: Record<string, string> = {
    docs: 'docs', video: 'video', blog: 'blog', tool: 'tool',
  };
}
