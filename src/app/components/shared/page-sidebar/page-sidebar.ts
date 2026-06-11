import { Component, computed, inject } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

export interface DocLink    { label: string; url: string; }
export interface Resource   { label: string; url: string; badge: 'docs' | 'video' | 'blog' | 'tool' | 'code'; }
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
    { label: 'Signals & State',  route: '/angular/counter' },
    { label: 'HTTP Client',      route: '/angular/http' },
    { label: 'Testing',          route: '/angular/testing' },
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
      { label: 'linkedSignal()',   route: '/angular/linked-signal' },
      { label: 'resource() API',  route: '/angular/resource-api'  },
      { label: 'Signal Store',    route: '/angular/store'         },
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
      { label: 'Directives',  route: '/angular/directives' },
      { label: 'Pipes',       route: '/angular/pipes'      },
      { label: 'Lifecycle',   route: '/angular/lifecycle'  },
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
      { label: 'Template Syntax',      route: '/angular/templates'           },
      { label: 'Content Projection',   route: '/angular/content-projection'  },
      { label: 'Angular CDK',          route: '/angular/cdk'                 },
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
      { label: 'DestroyRef',        route: '/angular/destroy-ref'   },
      { label: 'Signals & State',   route: '/angular/counter'       },
      { label: 'Input / Output',    route: '/angular/parent-child'  },
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
      { label: 'Template Syntax',  route: '/angular/templates' },
      { label: 'RxJS Operators',   route: '/angular/rxjs'      },
      { label: 'i18n',             route: '/angular/i18n'      },
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
      { label: 'Content Projection',  route: '/angular/content-projection' },
      { label: 'Dependency Injection',route: '/angular/di'                 },
      { label: 'Routing',             route: '/angular/routing'            },
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
      { label: 'Input / Output',    route: '/angular/parent-child' },
      { label: 'Angular CDK',       route: '/angular/cdk'          },
      { label: 'Angular Material',  route: '/angular/material'     },
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
      { label: 'Signal Store',  route: '/angular/store'   },
      { label: 'HTTP Client',   route: '/angular/http'    },
      { label: 'Lifecycle',     route: '/angular/lifecycle'},
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
      { label: 'Signals & State',  route: '/angular/counter'       },
      { label: 'NgRx Signals',     route: '/angular/ngrx-signals'  },
      { label: 'RxJS Operators',   route: '/angular/rxjs'          },
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
      { label: 'Route Resolvers',  route: '/angular/route-resolvers' },
      { label: 'Preloading',       route: '/angular/preloading'      },
      { label: 'Todo (guarded)',   route: '/angular/todo'            },
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
      { label: 'FormArray',            route: '/angular/form-array'         },
      { label: 'Custom Validators',    route: '/angular/custom-validators'  },
      { label: 'Control Value Accessor', route: '/angular/cva'             },
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
      { label: 'Template vs Reactive', route: '/angular/forms'         },
      { label: 'Wizard Form',          route: '/angular/wizard-form'   },
      { label: 'Dynamic Forms',        route: '/angular/dynamic-forms' },
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
      { label: 'Routing',              route: '/angular/routing' },
      { label: 'Template vs Reactive', route: '/angular/forms'   },
      { label: 'Dependency Injection', route: '/angular/di'      },
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
      { label: 'Custom Validators',  route: '/angular/custom-validators' },
      { label: 'HTTP Client',        route: '/angular/http'              },
      { label: 'Template vs Reactive', route: '/angular/forms'          },
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
      { label: 'Zod Validation',        route: '/angular/zod-forms' },
      { label: 'Control Value Accessor',route: '/angular/cva'        },
      { label: 'Template vs Reactive',  route: '/angular/forms'      },
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
      { label: 'Custom Validators',  route: '/angular/custom-validators' },
      { label: 'Angular Material',   route: '/angular/material'          },
      { label: 'Template vs Reactive', route: '/angular/forms'          },
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
      { label: 'RxJS Operators',   route: '/angular/rxjs'          },
      { label: 'resource() API',   route: '/angular/resource-api'  },
      { label: 'TanStack Query',   route: '/angular/tanstack-query' },
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
      { label: 'HTTP Client',    route: '/angular/http'         },
      { label: 'DestroyRef',     route: '/angular/destroy-ref'  },
      { label: 'Signal Store',   route: '/angular/store'        },
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
      { label: 'Change Detection',  route: '/angular/change-detection' },
      { label: 'Preloading',        route: '/angular/preloading'       },
      { label: 'NgOptimizedImage',  route: '/angular/ng-image'         },
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
      { label: 'Zoneless Angular',  route: '/angular/zoneless' },
      { label: '@defer Blocks',     route: '/angular/defer'    },
      { label: 'Signals & State',   route: '/angular/counter'  },
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
      { label: 'Angular CDK',   route: '/angular/cdk'        },
      { label: 'Animations',    route: '/angular/animations' },
      { label: 'Template vs Reactive', route: '/angular/forms' },
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
      { label: 'Angular Material',  route: '/angular/material'   },
      { label: 'Animations',        route: '/angular/animations' },
      { label: 'Web Workers',       route: '/angular/web-workers'},
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
      { label: 'Angular Material',  route: '/angular/material'  },
      { label: 'Angular CDK',       route: '/angular/cdk'       },
      { label: '@defer Blocks',     route: '/angular/defer'     },
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
      { label: 'Web Workers',       route: '/angular/web-workers' },
      { label: 'NgOptimizedImage',  route: '/angular/ng-image'   },
      { label: 'Angular Material',  route: '/angular/material'   },
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
      { label: 'TanStack Query',    route: '/angular/tanstack-query' },
      { label: 'HTTP Client',       route: '/angular/http'           },
      { label: 'Angular Material',  route: '/angular/material'       },
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
      { label: 'HTTP Client',      route: '/angular/http'         },
      { label: 'RxJS Operators',   route: '/angular/rxjs'         },
      { label: 'resource() API',   route: '/angular/resource-api' },
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
      { label: 'Pipes',  route: '/angular/pipes' },
      { label: 'i18n',   route: '/angular/i18n'  },
      { label: 'Template Syntax', route: '/angular/templates' },
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
      { label: 'Angular Material',  route: '/angular/material'   },
      { label: 'Angular CDK',       route: '/angular/cdk'        },
      { label: 'Animations',        route: '/angular/animations' },
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
      { label: 'E2E (Playwright)',  route: '/angular/e2e'       },
      { label: 'Harnesses',        route: '/angular/harnesses' },
      { label: 'HTTP Client',      route: '/angular/http'      },
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
      { label: 'Routing',     route: '/angular/routing'    },
      { label: 'HTTP Client', route: '/angular/http'       },
      { label: 'Preloading',  route: '/angular/preloading' },
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
      { label: 'Routing',       route: '/angular/routing'  },
      { label: '@defer Blocks', route: '/angular/defer'    },
      { label: 'SSR + Hydration', route: '/angular/ssr'   },
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
      { label: 'HTTP Client',    route: '/angular/http'          },
      { label: 'RxJS Operators', route: '/angular/rxjs'          },
      { label: 'TanStack Query', route: '/angular/tanstack-query' },
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
      { label: 'Signal Store',    route: '/angular/store'        },
      { label: 'RxJS Operators',  route: '/angular/rxjs'         },
      { label: 'DestroyRef',      route: '/angular/destroy-ref'  },
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
      { label: 'Lifecycle Hooks',   route: '/angular/lifecycle' },
      { label: 'RxJS Operators',    route: '/angular/rxjs'      },
      { label: 'Signals & State',   route: '/angular/counter'   },
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
      { label: 'Signals & State',  route: '/angular/counter'       },
      { label: 'resource() API',   route: '/angular/resource-api'  },
      { label: 'Dynamic Forms',    route: '/angular/dynamic-forms' },
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
      { label: 'Change Detection',  route: '/angular/change-detection' },
      { label: 'Signals & State',   route: '/angular/counter'          },
      { label: 'SSR + Hydration',   route: '/angular/ssr'              },
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
      { label: 'Template vs Reactive', route: '/angular/forms'         },
      { label: 'FormArray',            route: '/angular/form-array'    },
      { label: 'Wizard Form',          route: '/angular/wizard-form'   },
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
      { label: 'Template vs Reactive', route: '/angular/forms'         },
      { label: 'Dynamic Forms',        route: '/angular/dynamic-forms' },
      { label: 'Routing',              route: '/angular/routing'       },
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
      { label: 'Testing',     route: '/angular/testing'   },
      { label: 'Harnesses',   route: '/angular/harnesses' },
      { label: 'HTTP Client', route: '/angular/http'      },
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
      { label: 'Testing',           route: '/angular/testing'  },
      { label: 'Angular Material',  route: '/angular/material' },
      { label: 'Angular CDK',       route: '/angular/cdk'      },
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
      { label: 'PWA / Service Worker', route: '/angular/pwa' },
      { label: 'SSR + Hydration',      route: '/angular/ssr' },
      { label: '@defer Blocks',        route: '/angular/defer'},
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
      { label: 'PWA / Service Worker',  route: '/angular/pwa'              },
      { label: 'NgOptimizedImage',      route: '/angular/ng-image'         },
      { label: 'Change Detection',      route: '/angular/change-detection' },
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
      { label: 'SSR + Hydration',  route: '/angular/ssr'         },
      { label: 'Web Workers',      route: '/angular/web-workers' },
      { label: 'NgOptimizedImage', route: '/angular/ng-image'    },
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
      { label: 'Pipes',            route: '/angular/pipes'     },
      { label: 'Template Syntax',  route: '/angular/templates' },
      { label: 'HTTP Client',      route: '/angular/http'      },
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

  // ════════════════════════════════════════════════════════════════════════════
  // C# PAGES
  // ════════════════════════════════════════════════════════════════════════════

  basics: {
    apis: ['int', 'string', 'var', 'const', 'switch', 'for/foreach'],
    related: [
      { label: 'OOP & Classes',    route: '/csharp/oop'       },
      { label: 'Collections',      route: '/csharp/collections'},
      { label: 'Pattern Matching', route: '/csharp/pattern-matching' },
    ],
    tip: 'Prefer var for local variables when the type is obvious from the right-hand side — it reduces noise without losing clarity.',
    docs: [
      { label: 'C# Types & Variables',   url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/built-in-types' },
      { label: 'C# Control Flow',        url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/selection-statements' },
      { label: 'String Interpolation',   url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/tokens/interpolated' },
    ],
    resources: [
      { label: 'C# Language Reference', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/', badge: 'docs' },
      { label: 'C# Tour (MS Docs)',     url: 'https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/',        badge: 'blog' },
    ],
    gotchas: [
      'string is an alias for System.String — they are identical, but lowercase string is preferred by convention.',
      'Integer division truncates: 7/2 = 3, not 3.5 — cast to double first if you need a decimal result.',
    ],
  },

  oop: {
    apis: ['class', 'interface', 'abstract', 'sealed', 'override', 'virtual'],
    related: [
      { label: 'Records & Structs', route: '/csharp/records'   },
      { label: 'Generics',          route: '/csharp/generics'  },
      { label: 'Delegates & Events',route: '/csharp/delegates' },
    ],
    tip: 'Favour composition over inheritance — interfaces + small focused classes are easier to test and extend.',
    docs: [
      { label: 'Classes (MS Docs)',        url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/classes' },
      { label: 'Interfaces',               url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/interfaces' },
      { label: 'Abstract & Virtual',       url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/abstract' },
    ],
    resources: [
      { label: 'C# OOP Fundamentals', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/', badge: 'docs' },
    ],
    gotchas: [
      'Calling a virtual method in a constructor uses the derived override — the object may not be fully initialised yet.',
      'sealed prevents inheritance but does not prevent the class from being used as a field type.',
    ],
  },

  records: {
    apis: ['record', 'record struct', 'with', 'init', 'EqualityContract'],
    related: [
      { label: 'OOP & Classes',    route: '/csharp/oop'         },
      { label: 'Pattern Matching', route: '/csharp/pattern-matching' },
      { label: 'Collections',      route: '/csharp/collections' },
    ],
    tip: 'Use record for DTOs and value objects — you get value equality, ToString, and deconstruction for free.',
    docs: [
      { label: 'Records (MS Docs)',       url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record' },
      { label: 'with expressions',        url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/with-expression' },
      { label: 'init-only setters',       url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/init' },
    ],
    resources: [
      { label: 'C# 9 Records Blog', url: 'https://devblogs.microsoft.com/dotnet/c-9-0-on-the-record/', badge: 'blog' },
    ],
    gotchas: [
      'record class uses reference identity for ==, but value equality for Equals() — they are not the same.',
      'with creates a shallow copy — nested mutable objects are still shared between the original and the copy.',
    ],
  },

  generics: {
    apis: ['where T :', 'IComparable<T>', 'in/out', 'default(T)', 'typeof(T)'],
    related: [
      { label: 'Collections', route: '/csharp/collections' },
      { label: 'LINQ',        route: '/csharp/linq'        },
      { label: 'OOP',         route: '/csharp/oop'         },
    ],
    tip: 'Constrain generics with where T : IInterface rather than reflecting at runtime — you get compile-time safety and better performance.',
    docs: [
      { label: 'Generics (MS Docs)',    url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/generics' },
      { label: 'Type Constraints',      url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/generics/constraints-on-type-parameters' },
      { label: 'Covariance (in/out)',   url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/covariance-contravariance/' },
    ],
    resources: [
      { label: 'Generic Collections',  url: 'https://learn.microsoft.com/en-us/dotnet/standard/generics/collections', badge: 'docs' },
    ],
    gotchas: [
      'You cannot use arithmetic operators on generic T unless you constrain to INumber<T> (.NET 7+).',
      'default(T) returns null for reference types and zero-equivalent for value types — always check before use.',
    ],
  },

  collections: {
    apis: ['List<T>', 'Dictionary<K,V>', 'HashSet<T>', 'IEnumerable<T>', 'Span<T>'],
    related: [
      { label: 'LINQ',     route: '/csharp/linq'     },
      { label: 'Generics', route: '/csharp/generics' },
      { label: 'async/await', route: '/csharp/async' },
    ],
    tip: 'Return IEnumerable<T> from methods — callers can materialise to List/Array when they need indexing or multiple passes.',
    docs: [
      { label: 'Collections (MS Docs)',   url: 'https://learn.microsoft.com/en-us/dotnet/standard/collections/' },
      { label: 'Span<T> Guide',           url: 'https://learn.microsoft.com/en-us/dotnet/standard/memory-and-spans/' },
      { label: 'ImmutableCollections',    url: 'https://learn.microsoft.com/en-us/dotnet/standard/collections/thread-safe/' },
    ],
    resources: [
      { label: 'Collection Guidelines', url: 'https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/guidelines-for-collections', badge: 'docs' },
    ],
    gotchas: [
      'List<T>.Remove() removes only the first matching element — use RemoveAll() to remove all occurrences.',
      'Iterating a Dictionary does not guarantee insertion order — use SortedDictionary or a List of tuples if order matters.',
    ],
  },

  linq: {
    apis: ['Where()', 'Select()', 'GroupBy()', 'OrderBy()', 'FirstOrDefault()', 'ToList()'],
    related: [
      { label: 'Collections', route: '/csharp/collections' },
      { label: 'Generics',    route: '/csharp/generics'   },
      { label: 'async/await', route: '/csharp/async'      },
    ],
    tip: 'LINQ is lazy — chain Where/Select without materialising; only call ToList()/ToArray() once at the end when you need the results.',
    docs: [
      { label: 'LINQ Overview',         url: 'https://learn.microsoft.com/en-us/dotnet/csharp/linq/' },
      { label: 'Standard Operators',    url: 'https://learn.microsoft.com/en-us/dotnet/csharp/linq/standard-query-operators/' },
      { label: 'Query vs Method Syntax',url: 'https://learn.microsoft.com/en-us/dotnet/csharp/linq/get-started/write-linq-queries' },
    ],
    resources: [
      { label: '101 LINQ Samples', url: 'https://learn.microsoft.com/en-us/samples/dotnet/try-samples/101-linq-samples/', badge: 'tool' },
    ],
    gotchas: [
      'First() throws if the sequence is empty — use FirstOrDefault() and check for null unless you are certain an element exists.',
      'Calling Count() on an IEnumerable iterates the whole sequence — use the Count property on a List instead.',
    ],
  },

  async: {
    apis: ['async', 'await', 'Task<T>', 'CancellationToken', 'ConfigureAwait(false)'],
    related: [
      { label: 'Collections',  route: '/csharp/collections' },
      { label: 'Exceptions',   route: '/csharp/exceptions'  },
      { label: 'Null Safety',  route: '/csharp/null-safety' },
    ],
    tip: 'Use ConfigureAwait(false) in library code to avoid deadlocks in synchronisation-context-bound environments like ASP.NET Framework.',
    docs: [
      { label: 'Async / Await Guide',  url: 'https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/' },
      { label: 'Task Parallel Library',url: 'https://learn.microsoft.com/en-us/dotnet/standard/parallel-programming/task-parallel-library-tpl' },
      { label: 'CancellationToken',    url: 'https://learn.microsoft.com/en-us/dotnet/standard/threading/cancellation-in-managed-threads' },
    ],
    resources: [
      { label: 'Async Best Practices', url: 'https://learn.microsoft.com/en-us/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming', badge: 'blog' },
    ],
    gotchas: [
      'async void is a fire-and-forget trap — exceptions are unobserved. Only use it for event handlers, never for library methods.',
      'await inside a lock throws — use SemaphoreSlim.WaitAsync() as an async-safe mutex instead.',
    ],
  },

  'null-safety': {
    apis: ['?.', '??', '??=', '!', 'ArgumentNullException.ThrowIfNull', '#nullable enable'],
    related: [
      { label: 'Pattern Matching', route: '/csharp/pattern-matching' },
      { label: 'Exceptions',       route: '/csharp/exceptions'       },
      { label: 'OOP & Classes',    route: '/csharp/oop'              },
    ],
    tip: 'Enable nullable reference types project-wide in .csproj — fix the warnings top-to-bottom to build a null-safe codebase incrementally.',
    docs: [
      { label: 'Nullable Reference Types', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/nullable-references' },
      { label: '?? and ??= Operators',     url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/null-coalescing-operator' },
      { label: 'Null-Conditional ?.',      url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/member-access-operators#null-conditional-operators--and-' },
    ],
    resources: [
      { label: 'Null Safety Migration',   url: 'https://learn.microsoft.com/en-us/dotnet/csharp/nullable-migration-strategies', badge: 'docs' },
    ],
    gotchas: [
      'The null-forgiving operator ! suppresses warnings but does not prevent NullReferenceException at runtime — only use it when you have proven the value is not null.',
      'Nullable value types (int?) and nullable reference types (#nullable enable) are completely different mechanisms.',
    ],
  },

  'pattern-matching': {
    apis: ['is', 'switch', 'when', 'and/or/not', 'property pattern', 'list pattern'],
    related: [
      { label: 'OOP & Classes',  route: '/csharp/oop'         },
      { label: 'Records',        route: '/csharp/records'     },
      { label: 'Null Safety',    route: '/csharp/null-safety' },
    ],
    tip: 'Use exhaustive switch expressions on sealed hierarchies or enums — the compiler warns when a case is missing.',
    docs: [
      { label: 'Pattern Matching',     url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/functional/pattern-matching' },
      { label: 'Switch Expression',    url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/switch-expression' },
      { label: 'All Patterns',         url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/patterns' },
    ],
    resources: [
      { label: 'C# Pattern Blog', url: 'https://devblogs.microsoft.com/dotnet/pattern-matching-updates-in-c-9/', badge: 'blog' },
    ],
    gotchas: [
      'Property patterns only match the listed properties — unlisted ones are ignored; they cannot verify the object has no other state.',
      'The _ discard pattern in a switch expression matches everything — place it last or all subsequent arms are unreachable.',
    ],
  },

  exceptions: {
    apis: ['try/catch/finally', 'when', 'throw', 'Exception', 'AggregateException'],
    related: [
      { label: 'async/await',  route: '/csharp/async'       },
      { label: 'Null Safety',  route: '/csharp/null-safety' },
      { label: 'OOP & Classes',route: '/csharp/oop'         },
    ],
    tip: 'Catch the most specific exception type first — catching Exception at the top swallows every error including OutOfMemoryException.',
    docs: [
      { label: 'Exception Handling',     url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/' },
      { label: 'Creating Custom Exceptions', url: 'https://learn.microsoft.com/en-us/dotnet/standard/exceptions/how-to-create-user-defined-exceptions' },
      { label: 'Exception Filters (when)',   url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/when' },
    ],
    resources: [
      { label: 'Exception Design Guidelines', url: 'https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/exceptions', badge: 'docs' },
    ],
    gotchas: [
      'throw; (bare) preserves the stack trace; throw ex; resets it — always use bare throw when re-throwing.',
      'finally runs even when an exception is thrown — but not when Environment.FailFast() is called.',
    ],
  },

  delegates: {
    apis: ['delegate', 'Action<>', 'Func<>', 'Predicate<>', 'event', 'EventHandler<T>'],
    related: [
      { label: 'OOP & Classes', route: '/csharp/oop'      },
      { label: 'LINQ',          route: '/csharp/linq'     },
      { label: 'async/await',   route: '/csharp/async'    },
    ],
    tip: 'Prefer Func<> and Action<> over custom delegate types — they are already defined in the framework and are universally understood.',
    docs: [
      { label: 'Delegates (MS Docs)',  url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/delegates/' },
      { label: 'Events Guide',         url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/events/' },
      { label: 'Lambda Expressions',   url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/lambda-expressions' },
    ],
    resources: [
      { label: 'Func vs Action vs Predicate', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.func-2', badge: 'docs' },
    ],
    gotchas: [
      'Multicast delegates invoke all subscribers — if one throws, the rest are not called. Invoke each subscriber inside a try/catch.',
      'Capturing a loop variable in a lambda closes over the variable, not its value — copy to a local variable inside the loop first.',
    ],
  },

  // ── C# New Topics ──────────────────────────────────────────────────────────

  fields: {
    apis: ['readonly', 'const', 'static', 'volatile', 'field keyword (C#14)'],
    related: [{ label: 'Variables & Types', route: '/csharp/basics' }, { label: 'Properties & Indexers', route: '/csharp/properties-indexers' }, { label: 'OOP & Classes', route: '/csharp/oop' }],
    tip: 'Prefer properties over public fields — they allow validation, computed values, and future changes without breaking callers.',
    docs: [{ label: 'Fields (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/fields' }, { label: 'Constants', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/constants' }],
    resources: [{ label: 'C# Language Reference', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/', badge: 'docs' }],
    gotchas: ['const is a compile-time constant; readonly is set at construction time — use readonly for dependency-injected values.', 'static fields are shared across all instances — mutations are visible everywhere.'],
  },

  methods: {
    apis: ['params', 'ref', 'out', 'in', 'default params', 'expression-bodied'],
    related: [{ label: 'Fields & Constants', route: '/csharp/fields' }, { label: 'Constructors', route: '/csharp/constructors' }, { label: 'Delegates & Events', route: '/csharp/delegates' }],
    tip: 'Use expression-bodied members (=>) for single-expression methods and properties — they reduce boilerplate without sacrificing readability.',
    docs: [{ label: 'Methods (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/methods' }, { label: 'Named/Optional Args', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/named-and-optional-arguments' }],
    resources: [{ label: 'C# Language Reference', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/', badge: 'docs' }],
    gotchas: ['ref and out parameters pass by reference — changes inside the method affect the caller\'s variable.', 'params must be the last parameter and only one params parameter is allowed per method.'],
  },

  'type-conversion': {
    apis: ['(T)cast', 'as', 'is', 'Convert', 'TryParse', 'implicit/explicit operator'],
    related: [{ label: 'Variables & Types', route: '/csharp/basics' }, { label: 'OOP & Classes', route: '/csharp/oop' }, { label: 'Pattern Matching', route: '/csharp/pattern-matching' }],
    tip: 'Prefer TryParse over Parse — Parse throws on invalid input while TryParse returns false, making error handling explicit.',
    docs: [{ label: 'Type Conversion (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/types/casting-and-type-conversions' }, { label: 'Convert Class', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.convert' }],
    resources: [{ label: 'C# Type System', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/', badge: 'docs' }],
    gotchas: ['(T)cast throws InvalidCastException on failure; as returns null — choose based on whether failure is exceptional.', 'Numeric conversions can silently lose data (double→int truncates); use checked{} to catch overflow.'],
  },

  constructors: {
    apis: ['this()', 'base()', 'static ctor', 'primary ctor (C#12)', 'required'],
    related: [{ label: 'OOP & Classes', route: '/csharp/oop' }, { label: 'Fields & Constants', route: '/csharp/fields' }, { label: 'Records & Structs', route: '/csharp/records' }],
    tip: 'Chain constructors with this() to avoid duplicating initialisation logic — keep one "main" constructor that does all the work.',
    docs: [{ label: 'Constructors (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/constructors' }, { label: 'Primary Constructors', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-12#primary-constructors' }],
    resources: [{ label: 'C# 12 Features', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-12', badge: 'docs' }],
    gotchas: ['Static constructors run once per type, not per instance — exceptions in static constructors make the type permanently unavailable.', 'Primary constructor parameters are in scope for the entire class body — capture to a field if you need them stored.'],
  },

  'properties-indexers': {
    apis: ['get; set;', 'get; init;', 'auto-prop', 'expression-bodied', 'this[T]'],
    related: [{ label: 'Fields & Constants', route: '/csharp/fields' }, { label: 'Records & Structs', route: '/csharp/records' }, { label: 'OOP & Classes', route: '/csharp/oop' }],
    tip: 'Use init-only setters for properties that should only be set at construction time — cleaner than private set with an object initializer.',
    docs: [{ label: 'Properties (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/properties' }, { label: 'Indexers', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/indexers/' }],
    resources: [{ label: 'Auto-Implemented Properties', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/auto-implemented-properties', badge: 'docs' }],
    gotchas: ['Auto-properties with private set can still be mutated inside the class — use init or readonly field if you want true immutability.', 'Indexers can be overloaded by parameter type — useful for DSL-style APIs.'],
  },

  namespaces: {
    apis: ['namespace', 'using', 'global using', 'file-scoped namespace', 'alias'],
    related: [{ label: 'Variables & Types', route: '/csharp/basics' }, { label: 'OOP & Classes', route: '/csharp/oop' }, { label: 'Static, Partial & Enums', route: '/csharp/static-enums' }],
    tip: 'Use file-scoped namespace declarations (C# 10+) to reduce indentation by one level across every file.',
    docs: [{ label: 'Namespaces (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/namespaces' }, { label: 'Global Usings', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-10#global-using-directives' }],
    resources: [{ label: 'C# 10 Features', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-10', badge: 'docs' }],
    gotchas: ['Global usings affect all files in the project — only use them for universally needed namespaces (System, System.Collections.Generic).', 'Aliasing a namespace (using Alias = Long.Namespace) only applies to the current file.'],
  },

  inheritance: {
    apis: [':', 'base', 'virtual', 'override', 'new (hiding)', 'sealed override'],
    related: [{ label: 'OOP & Classes', route: '/csharp/oop' }, { label: 'Abstract & Interfaces', route: '/csharp/abstract-interfaces' }, { label: 'System.Object', route: '/csharp/system-object' }],
    tip: 'Use new keyword to hide (not override) a base member — but always ask if hiding is really what you want; it breaks polymorphism.',
    docs: [{ label: 'Inheritance (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/inheritance' }, { label: 'Polymorphism', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/polymorphism' }],
    resources: [{ label: 'OOP Fundamentals', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/', badge: 'docs' }],
    gotchas: ['new hides the base method but does not participate in polymorphism — a base reference still calls the base version.', 'Calling virtual methods in a constructor uses the most-derived override — dangerous when the derived class is not yet initialized.'],
  },

  'abstract-interfaces': {
    apis: ['abstract', 'interface', 'default interface method', 'explicit impl', 'IComparable<T>'],
    related: [{ label: 'OOP & Classes', route: '/csharp/oop' }, { label: 'Inheritance & Overriding', route: '/csharp/inheritance' }, { label: 'Generics', route: '/csharp/generics' }],
    tip: 'Interfaces define contracts; abstract classes share implementation. If you find yourself duplicating logic across implementations, reach for an abstract class.',
    docs: [{ label: 'Interfaces (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/interfaces' }, { label: 'Abstract Classes', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/abstract-and-sealed-classes-and-class-members' }],
    resources: [{ label: 'Default Interface Methods', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-8#default-interface-methods', badge: 'docs' }],
    gotchas: ['A class can implement multiple interfaces but inherit only one class — design for this constraint early.', 'Default interface methods are not inherited by implementing classes — they are only callable through the interface type.'],
  },

  'static-enums': {
    apis: ['static class', 'partial class', 'enum', 'Flags', '[EnumMember]', 'Enum.Parse'],
    related: [{ label: 'OOP & Classes', route: '/csharp/oop' }, { label: 'Extension Methods', route: '/csharp/extension-methods' }, { label: 'Pattern Matching', route: '/csharp/pattern-matching' }],
    tip: 'Use [Flags] enums with powers of two for bitmask combinations — and always include a None = 0 member.',
    docs: [{ label: 'Enumerations (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/enum' }, { label: 'Static Classes', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/static-classes-and-static-class-members' }, { label: 'Partial Classes', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/partial-classes-and-methods' }],
    resources: [{ label: 'Flags Attribute', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.flagsattribute', badge: 'docs' }],
    gotchas: ['Enum.Parse throws on unknown values — use Enum.TryParse for user input.', 'Partial classes must be in the same assembly — they are merged at compile time, not at runtime.'],
  },

  structures: {
    apis: ['struct', 'ref struct', 'readonly struct', 'record struct', 'Span<T>'],
    related: [{ label: 'Records & Structs', route: '/csharp/records' }, { label: 'GC & IDisposable', route: '/csharp/gc-disposable' }, { label: 'Collections', route: '/csharp/collections' }],
    tip: 'Keep structs small (< 16 bytes) — large structs copied frequently can be slower than classes despite avoiding GC pressure.',
    docs: [{ label: 'Structure Types (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/struct' }, { label: 'ref struct', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/ref-struct' }],
    resources: [{ label: 'Choosing Struct vs Class', url: 'https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/choosing-between-class-and-struct', badge: 'docs' }],
    gotchas: ['Structs are copied on assignment — mutating a local copy does not affect the original.', 'ref struct cannot be boxed, stored in arrays, or used as generic type arguments.'],
  },

  'system-object': {
    apis: ['ToString()', 'Equals()', 'GetHashCode()', 'GetType()', 'MemberwiseClone()'],
    related: [{ label: 'OOP & Classes', route: '/csharp/oop' }, { label: 'Records & Structs', route: '/csharp/records' }, { label: 'Collections', route: '/csharp/collections' }],
    tip: 'When overriding Equals(), always override GetHashCode() — objects that are Equal must have the same hash code.',
    docs: [{ label: 'Object Class (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.object' }, { label: 'Object.Equals', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.object.equals' }],
    resources: [{ label: 'Equality Guidelines', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/statements-expressions-operators/how-to-define-value-equality-for-a-type', badge: 'docs' }],
    gotchas: ['Boxing a value type wraps it in a heap object — frequent boxing causes GC pressure.', 'object.ReferenceEquals() always checks reference identity — override Equals() for value equality.'],
  },

  'extension-methods': {
    apis: ['this T param', 'static class', 'LINQ extensions', 'fluent API', 'IEnumerable<T>'],
    related: [{ label: 'LINQ', route: '/csharp/linq' }, { label: 'Static, Partial & Enums', route: '/csharp/static-enums' }, { label: 'Delegates & Events', route: '/csharp/delegates' }],
    tip: 'Extension methods are perfect for adding functionality to types you don\'t own (BCL types, third-party types) — but don\'t abuse them on your own types.',
    docs: [{ label: 'Extension Methods (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/extension-methods' }],
    resources: [{ label: 'Fluent API Pattern', url: 'https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/extension-methods', badge: 'docs' }],
    gotchas: ['Extension methods cannot access private members — they are syntactic sugar for static method calls.', 'If a type gains an instance method with the same name, it takes precedence over the extension method.'],
  },

  tuples: {
    apis: ['(T1, T2)', 'ValueTuple', 'anonymous type', 'named fields', 'deconstruction'],
    related: [{ label: 'Pattern Matching', route: '/csharp/pattern-matching' }, { label: 'Records & Structs', route: '/csharp/records' }, { label: 'LINQ', route: '/csharp/linq' }],
    tip: 'Use named tuple fields for clarity — (string Name, int Age) instead of (string, int) makes code self-documenting.',
    docs: [{ label: 'Tuple Types (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/value-tuples' }, { label: 'Anonymous Types', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/anonymous-types' }],
    resources: [{ label: 'ValueTuple vs Tuple', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.valuetuple', badge: 'docs' }],
    gotchas: ['Tuple field names are compile-time only — at runtime they are Item1, Item2, etc.', 'Anonymous types are reference types limited to their declaring scope — use records for cross-method data transfer.'],
  },

  arrays: {
    apis: ['T[]', 'T[,]', 'T[][]', 'Array.Sort', 'ArraySegment<T>', 'array expressions []'],
    related: [{ label: 'Collections', route: '/csharp/collections' }, { label: 'Span & Memory', route: '/csharp/collections' }, { label: 'LINQ', route: '/csharp/linq' }],
    tip: 'Arrays have fixed size — if you need to add/remove elements, use List<T> instead. Use arrays only when size is known upfront.',
    docs: [{ label: 'Arrays (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/arrays/' }, { label: 'Multi-dimensional Arrays', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/arrays/multidimensional-arrays' }],
    resources: [{ label: 'Array Class API', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.array', badge: 'docs' }],
    gotchas: ['Array covariance lets string[] be assigned to object[] — but writing an int to that reference throws at runtime.', 'Jagged arrays (T[][]) have different syntax and behavior than multi-dimensional arrays (T[,]).'],
  },

  'strings-datetime': {
    apis: ['string.Format', 'StringBuilder', 'DateOnly', 'TimeOnly', 'TimeSpan', 'Math'],
    related: [{ label: 'Variables & Types', route: '/csharp/basics' }, { label: 'LINQ', route: '/csharp/linq' }, { label: 'I/O & Serialization', route: '/csharp/io-serialization' }],
    tip: 'Use DateOnly and TimeOnly (.NET 6+) instead of DateTime when you only need the date or time part — avoids timezone confusion.',
    docs: [{ label: 'String Class (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.string' }, { label: 'DateTime', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.datetime' }, { label: 'Math Class', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.math' }],
    resources: [{ label: 'DateOnly/TimeOnly', url: 'https://learn.microsoft.com/en-us/dotnet/standard/datetime/how-to-use-dateonly-timeonly', badge: 'docs' }],
    gotchas: ['string concatenation in a loop creates O(n²) allocations — use StringBuilder for building strings iteratively.', 'DateTime.Now is local time; DateTime.UtcNow is UTC — always store and compare in UTC.'],
  },

  'io-serialization': {
    apis: ['File', 'StreamReader', 'JsonSerializer', 'BinaryWriter', 'Encoding.UTF8'],
    related: [{ label: 'async / await', route: '/csharp/async' }, { label: 'Exceptions', route: '/csharp/exceptions' }, { label: 'GC & IDisposable', route: '/csharp/gc-disposable' }],
    tip: 'Always use async file I/O (File.ReadAllTextAsync) in ASP.NET apps — blocking I/O on a thread-pool thread reduces server throughput.',
    docs: [{ label: 'File I/O (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/standard/io/' }, { label: 'System.Text.Json', url: 'https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/overview' }],
    resources: [{ label: 'JSON Serialization Guide', url: 'https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/', badge: 'docs' }],
    gotchas: ['JsonSerializer is case-insensitive by default for deserialization but case-sensitive for serialization — use JsonSerializerOptions to control.', 'Streams must be disposed — always wrap in using or use File.ReadAllText for simple reads.'],
  },

  'gc-disposable': {
    apis: ['IDisposable', 'Dispose()', '~Finalizer', 'using', 'GC.SuppressFinalize', 'WeakReference'],
    related: [{ label: 'async / await', route: '/csharp/async' }, { label: 'I/O & Serialization', route: '/csharp/io-serialization' }, { label: 'Threading', route: '/csharp/threading' }],
    tip: 'Call GC.SuppressFinalize(this) inside Dispose() — once you\'ve cleaned up manually, there\'s no need for the finalizer to run.',
    docs: [{ label: 'Dispose Pattern (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/implementing-dispose' }, { label: 'Garbage Collection', url: 'https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/' }],
    resources: [{ label: 'IAsyncDisposable', url: 'https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/implementing-disposeasync', badge: 'docs' }],
    gotchas: ['Finalizers run on the GC thread — never acquire locks or throw exceptions inside them.', 'using() calls Dispose on exit even if an exception is thrown — prefer using declarations over explicit try/finally.'],
  },

  threading: {
    apis: ['Thread', 'ThreadPool', 'lock', 'Monitor', 'Interlocked', 'volatile'],
    related: [{ label: 'Tasks', route: '/csharp/tasks' }, { label: 'async / await', route: '/csharp/async' }, { label: 'Delegates & Events', route: '/csharp/delegates' }],
    tip: 'Prefer higher-level abstractions (Task, async/await, Parallel) over raw Thread — Thread is rarely the right tool in modern .NET.',
    docs: [{ label: 'Threading (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/standard/threading/' }, { label: 'Synchronization Primitives', url: 'https://learn.microsoft.com/en-us/dotnet/standard/threading/overview-of-synchronization-primitives' }],
    resources: [{ label: 'Thread Safety Guidelines', url: 'https://learn.microsoft.com/en-us/dotnet/standard/threading/managed-threading-best-practices', badge: 'docs' }],
    gotchas: ['lock() prevents concurrent access but can cause deadlocks if two threads lock in different orders.', 'volatile ensures visibility across threads but does not prevent race conditions on compound operations (read-modify-write).'],
  },

  tasks: {
    apis: ['Task.Run()', 'Task.WhenAll()', 'Parallel.ForEach()', 'TaskCompletionSource', 'ContinueWith()'],
    related: [{ label: 'async / await', route: '/csharp/async' }, { label: 'Threading', route: '/csharp/threading' }, { label: 'Exceptions', route: '/csharp/exceptions' }],
    tip: 'Use Task.Run only for CPU-bound work that would block the thread pool — I/O-bound work should use async/await without Task.Run.',
    docs: [{ label: 'Task Parallel Library (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/standard/parallel-programming/task-parallel-library-tpl' }, { label: 'Parallel Class', url: 'https://learn.microsoft.com/en-us/dotnet/standard/parallel-programming/data-parallelism-task-parallel-library' }],
    resources: [{ label: 'Async/Await Best Practices', url: 'https://learn.microsoft.com/en-us/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming', badge: 'blog' }],
    gotchas: ['ContinueWith captures the current synchronization context by default — use TaskScheduler.Default to avoid UI thread marshaling.', 'Parallel.ForEach uses thread-pool threads — don\'t use it for I/O-bound work; use async LINQ or PLINQ instead.'],
  },

  'whats-new-9-10': {
    apis: ['record', 'init', 'with', 'global using', 'file-scoped namespace', 'record struct'],
    related: [{ label: 'Records & Structs', route: '/csharp/records' }, { label: 'Pattern Matching', route: '/csharp/pattern-matching' }, { label: 'What\'s New 11 & 12', route: '/csharp/whats-new-11-12' }],
    tip: 'Enable C# 10 file-scoped namespaces project-wide via Editorconfig to eliminate one level of indentation across your entire codebase.',
    docs: [{ label: 'C# 9 What\'s New', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-9' }, { label: 'C# 10 What\'s New', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-10' }],
    resources: [{ label: '.NET 6 Release Notes', url: 'https://devblogs.microsoft.com/dotnet/announcing-net-6/', badge: 'blog' }],
    gotchas: ['Top-level programs (C# 9) only work in one file per project — the entry point file.', 'Pattern matching improvements in C# 9 (and, or, not) are only available with the C# 9 or higher language version.'],
  },

  'whats-new-11-12': {
    apis: ['required', 'raw strings', 'INumber<T>', 'primary ctor', 'collection expressions []', 'default lambda'],
    related: [{ label: 'What\'s New 9 & 10', route: '/csharp/whats-new-9-10' }, { label: 'What\'s New Latest', route: '/csharp/whats-new-latest' }, { label: 'Generics', route: '/csharp/generics' }],
    tip: 'C# 12 primary constructors capture parameters as fields — if you reference them in multiple methods, they are stored automatically.',
    docs: [{ label: 'C# 11 What\'s New', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-11' }, { label: 'C# 12 What\'s New', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-12' }],
    resources: [{ label: '.NET 8 Release Notes', url: 'https://devblogs.microsoft.com/dotnet/announcing-dotnet-8/', badge: 'blog' }],
    gotchas: ['required members must be set in an object initializer — they cannot be set after construction.', 'Raw string literals (""") must start and end with the same number of quotes (minimum 3).'],
  },

  'whats-new-latest': {
    apis: ['params span', 'lock object', 'field keyword', 'partial property', 'extensions (C#14)', 'LINQ CountBy'],
    related: [{ label: 'What\'s New 11 & 12', route: '/csharp/whats-new-11-12' }, { label: 'async / await', route: '/csharp/async' }, { label: 'Collections', route: '/csharp/collections' }],
    tip: 'Track the official C# Language Design repo (github.com/dotnet/csharplang) to see what features are planned before they ship.',
    docs: [{ label: 'C# 13 What\'s New', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-13' }, { label: '.NET 10 Blog', url: 'https://devblogs.microsoft.com/dotnet/announcing-dotnet-10/' }, { label: 'C# Language Design', url: 'https://github.com/dotnet/csharplang' }],
    resources: [{ label: '.NET Release Notes', url: 'https://github.com/dotnet/core/tree/main/release-notes', badge: 'docs' }],
    gotchas: ['New language features require updating <LangVersion> in .csproj — they don\'t activate automatically.', 'Some .NET 10/11 APIs are marked [Experimental] — check the docs before using in production.'],
  },

  // ── C# Cheat Sheet ─────────────────────────────────────────────────────────
  'csharp/cheatsheet': {
    apis: ['var', 'record', 'LINQ', 'async/await', 'pattern matching', 'generics'],
    related: [
      { label: 'LINQ',             route: '/csharp/linq'            },
      { label: 'async / await',    route: '/csharp/async'           },
      { label: 'Pattern Matching', route: '/csharp/pattern-matching'},
      { label: 'Generics',         route: '/csharp/generics'        },
    ],
    tip: 'Use the search bar to filter entries across all sections at once — great for looking up a specific keyword quickly.',
    docs: [
      { label: 'C# Language Reference',  url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/' },
      { label: 'C# Programming Guide',   url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/' },
      { label: 'LINQ Overview',          url: 'https://learn.microsoft.com/en-us/dotnet/csharp/linq/'              },
      { label: 'Async / Await Guide',    url: 'https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/' },
    ],
    resources: [
      { label: '.NET API Browser',       url: 'https://learn.microsoft.com/en-us/dotnet/api/',                      badge: 'docs'  },
      { label: 'C# Interactive (Try)',   url: 'https://dotnetfiddle.net',                                            badge: 'tool'  },
      { label: 'dotnet/runtime',         url: 'https://github.com/dotnet/runtime',                                   badge: 'code'  },
      { label: 'dotnet/csharplang (specs)', url: 'https://github.com/dotnet/csharplang',                             badge: 'code'  },
    ],
    gotchas: [
      'LINQ is lazy by default — always call ToList() or ToArray() when you need the results more than once.',
      'async void swallows exceptions — only use it for event handlers and always use async Task everywhere else.',
    ],
  },

  // ── C# Common Errors ───────────────────────────────────────────────────────
  'csharp/errors': {
    apis: ['NullReferenceException', 'InvalidCastException', 'ArgumentNullException', 'FormatException'],
    related: [
      { label: 'Null Safety',    route: '/csharp/null-safety' },
      { label: 'Exceptions',     route: '/csharp/exceptions'  },
      { label: 'async / await',  route: '/csharp/async'       },
      { label: 'LINQ',           route: '/csharp/linq'        },
    ],
    tip: 'Enable #nullable in your .csproj (<Nullable>enable</Nullable>) to catch NullReferenceExceptions at compile time.',
    docs: [
      { label: 'Exception Handling',        url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/'             },
      { label: 'Nullable Reference Types',  url: 'https://learn.microsoft.com/en-us/dotnet/csharp/nullable-references'                  },
      { label: 'C# Compiler Errors',        url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/compiler-messages/'},
      { label: 'Async Best Practices',      url: 'https://learn.microsoft.com/en-us/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming' },
    ],
    resources: [
      { label: '.NET API Browser',          url: 'https://learn.microsoft.com/en-us/dotnet/api/',          badge: 'docs'  },
      { label: 'Exception Design Guidelines', url: 'https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/exceptions', badge: 'docs' },
    ],
    gotchas: [
      'throw; (bare) preserves the original stack trace; throw ex; resets it — always use bare throw when re-throwing.',
      'Blocking on async with .Result or .Wait() can deadlock in sync-context environments — async all the way is the safest rule.',
    ],
  },

  // ── C# Practice & Reference pages ───────────────────────────────────────────
  'csharp/mini-projects': {
    apis: ['List<T>', 'JsonSerializer', 'HttpClient', 'Task.WhenAll', 'SemaphoreSlim'],
    related: [
      { label: 'Collections',       route: '/csharp/collections'      },
      { label: 'I/O & Serialization', route: '/csharp/io-serialization' },
      { label: 'async / await',     route: '/csharp/async'            },
      { label: 'Tasks & Parallel',  route: '/csharp/tasks'            },
    ],
    tip: 'Build the projects in order — each one layers new concepts on top of the previous one.',
    docs: [
      { label: '.NET Console Apps',     url: 'https://learn.microsoft.com/en-us/dotnet/core/tutorials/with-visual-studio-code' },
      { label: 'System.Text.Json',      url: 'https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/overview' },
      { label: 'HttpClient Guidelines', url: 'https://learn.microsoft.com/en-us/dotnet/fundamentals/networking/http/httpclient-guidelines' },
    ],
    resources: [
      { label: '.NET Fiddle',           url: 'https://dotnetfiddle.net', badge: 'tool' },
      { label: 'dotnet CLI docs',       url: 'https://learn.microsoft.com/en-us/dotnet/core/tools/', badge: 'docs' },
    ],
    gotchas: [
      'Create one HttpClient and reuse it — instantiating per request exhausts sockets.',
      'Always pass CancellationToken through async call chains so the whole pipeline can be cancelled.',
    ],
  },

  'csharp/learning-paths': {
    apis: ['Foundations', 'OOP', 'LINQ', 'async/await', 'Threading'],
    related: [
      { label: 'Variables & Types', route: '/csharp/basics'        },
      { label: 'Classes & OOP',     route: '/csharp/oop'           },
      { label: 'Quiz Practice',     route: '/csharp/quiz-practice' },
      { label: 'Interview Prep',    route: '/csharp/interview-prep'},
    ],
    tip: 'Stick to one path at a time — finishing a track beats sampling all of them.',
    docs: [
      { label: 'C# Documentation',  url: 'https://learn.microsoft.com/en-us/dotnet/csharp/' },
      { label: 'C# for Beginners',  url: 'https://dotnet.microsoft.com/en-us/learn/csharp'  },
    ],
    resources: [
      { label: 'Microsoft Learn paths', url: 'https://learn.microsoft.com/en-us/training/browse/?languages=csharp', badge: 'docs' },
    ],
    gotchas: [
      'Skipping fundamentals to reach async/LINQ faster usually costs more time than it saves.',
    ],
  },

  'csharp/interview-prep': {
    apis: ['boxing', 'variance', 'ConfigureAwait', 'GC generations', 'Span<T>'],
    related: [
      { label: 'Quiz Practice',     route: '/csharp/quiz-practice'   },
      { label: 'System.Object',     route: '/csharp/system-object'   },
      { label: 'async / await',     route: '/csharp/async'           },
      { label: 'GC & IDisposable',  route: '/csharp/gc-disposable'   },
    ],
    tip: 'Answer out loud before expanding — interviews test recall under pressure, not recognition.',
    docs: [
      { label: 'C# Language Reference', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/' },
      { label: '.NET Memory & GC',      url: 'https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/' },
    ],
    resources: [
      { label: 'SharpLab (inspect IL)', url: 'https://sharplab.io', badge: 'tool' },
    ],
    gotchas: [
      'Senior questions probe trade-offs ("when would you NOT use X") — memorised definitions are not enough.',
    ],
  },

  'csharp/quiz-practice': {
    apis: ['Types', 'OOP', 'Generics', 'LINQ', 'Async', 'Memory'],
    related: [
      { label: 'Interview Prep',  route: '/csharp/interview-prep' },
      { label: 'C# Cheat Sheet',  route: '/csharp/cheatsheet'     },
      { label: 'Common C# Errors', route: '/csharp/errors'        },
    ],
    tip: 'Re-run the topics you score lowest on — the per-topic breakdown at the end shows exactly where to focus.',
    docs: [
      { label: 'C# Documentation', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/' },
    ],
    resources: [
      { label: '.NET Fiddle',      url: 'https://dotnetfiddle.net', badge: 'tool' },
    ],
    gotchas: [
      'Read the explanation even when you answer correctly — guessing right teaches nothing.',
    ],
  },

  'csharp/design-patterns': {
    apis: ['Singleton', 'Factory', 'Builder', 'Repository', 'Strategy', 'Mediator'],
    related: [
      { label: 'Abstract & Interfaces', route: '/csharp/abstract-interfaces' },
      { label: 'Delegates & Events',    route: '/csharp/delegates'           },
      { label: 'Generics',              route: '/csharp/generics'            },
      { label: 'Decision Guides',       route: '/csharp/decision-guides'     },
    ],
    tip: 'In modern .NET the DI container replaces most hand-rolled Singletons and Factories — check "when NOT to use" first.',
    docs: [
      { label: 'DI in .NET',            url: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection' },
      { label: 'Architecture guides',   url: 'https://learn.microsoft.com/en-us/dotnet/architecture/' },
    ],
    resources: [
      { label: 'Refactoring.Guru patterns', url: 'https://refactoring.guru/design-patterns/csharp', badge: 'blog' },
      { label: 'dotnet/aspnetcore',         url: 'https://github.com/dotnet/aspnetcore',            badge: 'code' },
      { label: 'eShop reference app',       url: 'https://github.com/dotnet/eShop',                 badge: 'code' },
    ],
    gotchas: [
      'Patterns are vocabulary, not goals — forcing a pattern onto simple code is the most common misuse.',
    ],
  },

  'csharp/decision-guides': {
    apis: ['List vs Span', 'class vs record', 'Task vs ValueTask', 'lock vs Interlocked'],
    related: [
      { label: 'Structures',       route: '/csharp/structures'      },
      { label: 'Records & Structs', route: '/csharp/records'        },
      { label: 'Collections',      route: '/csharp/collections'     },
      { label: 'Design Patterns',  route: '/csharp/design-patterns' },
    ],
    tip: 'When two options tie on the table, pick the simpler one — you can upgrade later when a real constraint appears.',
    docs: [
      { label: 'Choosing collections', url: 'https://learn.microsoft.com/en-us/dotnet/standard/collections/selecting-a-collection-class' },
      { label: 'Performance best practices', url: 'https://learn.microsoft.com/en-us/dotnet/framework/performance/performance-tips' },
    ],
    resources: [
      { label: 'SharpLab (inspect IL)', url: 'https://sharplab.io', badge: 'tool' },
    ],
    gotchas: [
      'Micro-benchmarks lie without BenchmarkDotNet — never decide struct-vs-class on a Stopwatch loop.',
    ],
  },

  'csharp/glossary': {
    apis: ['CLR', 'JIT', 'boxing', 'covariance', 'closure', 'GC'],
    related: [
      { label: 'C# Cheat Sheet',  route: '/csharp/cheatsheet'    },
      { label: 'System.Object',   route: '/csharp/system-object' },
      { label: 'GC & IDisposable', route: '/csharp/gc-disposable'},
    ],
    tip: 'Use the letter quick-nav or search — every term links onward to the full topic page where one exists.',
    docs: [
      { label: '.NET Glossary',   url: 'https://learn.microsoft.com/en-us/dotnet/standard/glossary' },
    ],
    resources: [
      { label: '.NET API Browser', url: 'https://learn.microsoft.com/en-us/dotnet/api/', badge: 'docs' },
    ],
    gotchas: [
      'Terms like "managed" and "boxed" have precise CLR meanings — interviewers notice loose usage.',
    ],
  },

  // ── Angular Practice & Reference pages ──────────────────────────────────────
  'interview-prep': {
    apis: ['signals', 'change detection', 'DI', 'zoneless', 'hydration'],
    related: [
      { label: 'Quiz Practice',    route: '/angular/quiz-practice'    },
      { label: 'Change Detection', route: '/angular/change-detection' },
      { label: 'Signals & State',  route: '/angular/counter'          },
      { label: 'Dependency Injection', route: '/angular/di'           },
    ],
    tip: 'Answer out loud before expanding — interviews test recall under pressure, not recognition.',
    docs: [
      { label: 'angular.dev Guides', url: 'https://angular.dev/overview' },
      { label: 'Signals Overview',   url: 'https://angular.dev/guide/signals' },
    ],
    resources: [
      { label: 'Angular Blog', url: 'https://blog.angular.dev', badge: 'blog' },
    ],
    gotchas: [
      'Senior questions probe trade-offs ("when would you NOT use X") — memorised definitions are not enough.',
    ],
  },

  'quiz-practice': {
    apis: ['Signals', 'DI', 'Router', 'Forms', 'RxJS', 'Testing'],
    related: [
      { label: 'Interview Prep',   route: '/angular/interview-prep' },
      { label: 'Cheat Sheet',      route: '/angular/cheatsheet'     },
      { label: 'Common Errors',    route: '/angular/errors'         },
    ],
    tip: 'Re-run the topics you score lowest on — the per-topic breakdown at the end shows exactly where to focus.',
    docs: [
      { label: 'angular.dev Guides', url: 'https://angular.dev/overview' },
    ],
    resources: [
      { label: 'Angular Tutorials', url: 'https://angular.dev/tutorials', badge: 'docs' },
    ],
    gotchas: [
      'Read the explanation even when you answer correctly — guessing right teaches nothing.',
    ],
  },

  'design-patterns': {
    apis: ['Signal Store', 'Facade', 'InjectionToken', 'host directives', 'OnPush'],
    related: [
      { label: 'Signal Store',       route: '/angular/store'           },
      { label: 'Dependency Injection', route: '/angular/di'            },
      { label: 'Content Projection', route: '/angular/content-projection' },
      { label: 'Decision Guides',    route: '/angular/decision-guides' },
    ],
    tip: 'Most Angular patterns are DI + signals combinations — master those two primitives first.',
    docs: [
      { label: 'DI Guide',          url: 'https://angular.dev/guide/di' },
      { label: 'Signals Overview',  url: 'https://angular.dev/guide/signals' },
    ],
    resources: [
      { label: 'Angular Blog',      url: 'https://blog.angular.dev',                badge: 'blog' },
      { label: 'angular/angular',   url: 'https://github.com/angular/angular',      badge: 'code' },
      { label: 'angular/components', url: 'https://github.com/angular/components',  badge: 'code' },
    ],
    gotchas: [
      'Patterns are vocabulary, not goals — forcing a pattern onto simple code is the most common misuse.',
    ],
  },

  'decision-guides': {
    apis: ['signal vs observable', 'reactive vs template', '@defer vs lazy route'],
    related: [
      { label: 'Signals & State',  route: '/angular/counter'         },
      { label: 'RxJS Operators',   route: '/angular/rxjs'            },
      { label: '@defer Blocks',    route: '/angular/defer'           },
      { label: 'Design Patterns',  route: '/angular/design-patterns' },
    ],
    tip: 'When two options tie on the table, pick the simpler one — you can upgrade later when a real constraint appears.',
    docs: [
      { label: 'Signals vs RxJS interop', url: 'https://angular.dev/guide/rxjs-interop' },
      { label: 'Deferred loading',        url: 'https://angular.dev/guide/templates/defer' },
    ],
    resources: [
      { label: 'Angular Blog', url: 'https://blog.angular.dev', badge: 'blog' },
    ],
    gotchas: [
      'Defaults shifted in the signals era — advice older than v17 often recommends RxJS where a signal now suffices.',
    ],
  },

  'glossary': {
    apis: ['hydration', 'zoneless', 'injector', 'linkedSignal', 'CVA'],
    related: [
      { label: 'Cheat Sheet',      route: '/angular/cheatsheet'       },
      { label: 'Change Detection', route: '/angular/change-detection' },
      { label: 'SSR + Hydration',  route: '/angular/ssr'              },
    ],
    tip: 'Use the letter quick-nav or search — every term links onward to the full topic page where one exists.',
    docs: [
      { label: 'angular.dev Glossary-ish API docs', url: 'https://angular.dev/api' },
    ],
    resources: [
      { label: 'angular.dev Guides', url: 'https://angular.dev/overview', badge: 'docs' },
    ],
    gotchas: [
      'Terms like "hydration" and "zoneless" have precise meanings in Angular — loose usage causes confusion in reviews.',
    ],
  },

  // ── SSR + Hydration ─────────────────────────────────────────────────────────
  ssr: {
    apis: ['provideClientHydration()', 'withEventReplay()', 'isPlatformBrowser()', 'PLATFORM_ID', 'TransferState'],
    related: [
      { label: 'PWA / Service Worker', route: '/angular/pwa'        },
      { label: 'Preloading',           route: '/angular/preloading' },
      { label: 'NgOptimizedImage',     route: '/angular/ng-image'   },
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
  host: {
    '[class.section-angular]': 'section() === "angular"',
    '[class.section-csharp]':  'section() === "csharp"',
    '[class.section-aspnet]':  'section() === "aspnet"',
  },
})
export class PageSidebarComponent {
  private router = inject(Router);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  private routeKey = computed(() =>
    this.currentUrl().replace(/^\//, '').split('?')[0]
  );

  section = computed<'angular' | 'csharp' | 'aspnet'>(() =>
    this.currentUrl().startsWith('/csharp') ? 'csharp'
    : this.currentUrl().startsWith('/aspnet') ? 'aspnet'
    : 'angular'
  );

  data = computed<SidebarData>(() =>
    SIDEBAR_MAP[this.routeKey()] ??
    SIDEBAR_MAP[this.routeKey().replace(/^(angular|csharp)\//, '')] ??
    DEFAULT
  );

  badgeLabel: Record<string, string> = {
    docs: 'docs', video: 'video', blog: 'blog', tool: 'tool', code: 'code',
  };
}
