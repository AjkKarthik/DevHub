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

const SQL_DEFAULT: SidebarData = {
  apis: ['SELECT', 'JOIN', 'WHERE', 'GROUP BY', 'ORDER BY', 'WITH (CTE)'],
  related: [
    { label: 'SQL Basics',    route: '/sql/basics'       },
    { label: 'Joins',         route: '/sql/joins'        },
    { label: 'Aggregations',  route: '/sql/aggregations' },
  ],
  tip: 'Write the SELECT last mentally — start with FROM, then JOIN, WHERE, GROUP BY, HAVING, then SELECT. This matches the engine\'s execution order.',
  docs: [
    { label: 'SQL Server T-SQL Reference',  url: 'https://learn.microsoft.com/en-us/sql/t-sql/language-reference' },
    { label: 'PostgreSQL Documentation',    url: 'https://www.postgresql.org/docs/current/' },
    { label: 'DB Fiddle (run SQL online)',  url: 'https://dbfiddle.uk/' },
  ],
  resources: [
    { label: 'SQL Server Samples', url: 'https://github.com/microsoft/sql-server-samples', badge: 'code' },
  ],
  gotchas: [
    'NULL is not equal to anything — NULL = NULL is false. Use IS NULL / IS NOT NULL.',
    'DISTINCT applies to the entire row, not just one column — can kill index usage on large tables.',
  ],
};

const TS_DEFAULT: SidebarData = {
  apis: ['type', 'interface', 'generic <T>', 'keyof', 'typeof', 'infer', 'satisfies'],
  related: [
    { label: 'TS Fundamentals',      route: '/typescript/basics'         },
    { label: 'Utility Types',        route: '/typescript/utility-types'  },
    { label: 'Type Guards',          route: '/typescript/narrowing'      },
  ],
  tip: 'Read the TypeScript Handbook sequentially at least once — it\'s short and every section builds on the last.',
  docs: [
    { label: 'TypeScript Handbook',    url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
    { label: 'TSConfig Reference',     url: 'https://www.typescriptlang.org/tsconfig'                 },
    { label: 'TypeScript Playground',  url: 'https://www.typescriptlang.org/play'                     },
  ],
  resources: [
    { label: 'microsoft/TypeScript',   url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
  ],
  gotchas: [
    'TypeScript is structural, not nominal — two unrelated classes with the same shape are assignable to each other.',
    'any silently disables all type checking — prefer unknown and narrow it before use.',
  ],
};

const REACT_DEFAULT: SidebarData = {
  apis: ['useState()', 'useEffect()', 'useRef()', 'useMemo()', 'useCallback()', 'createContext()'],
  related: [
    { label: 'React Fundamentals',  route: '/react/basics'         },
    { label: 'Core Hooks',          route: '/react/hooks-core'     },
    { label: 'State Management',    route: '/react/state-management'},
  ],
  tip: 'React re-renders are cheap — profile before optimising. Most performance issues are caused by missing keys, unnecessary context updates, or large unmemoised lists.',
  docs: [
    { label: 'React.dev Docs',       url: 'https://react.dev/learn'                                  },
    { label: 'React API Reference',  url: 'https://react.dev/reference/react'                        },
    { label: 'React Blog',           url: 'https://react.dev/blog'                                   },
  ],
  resources: [
    { label: 'facebook/react',       url: 'https://github.com/facebook/react',   badge: 'code' },
    { label: 'React YouTube',        url: 'https://www.youtube.com/@reactjs',     badge: 'video' },
  ],
  gotchas: [
    'Never mutate state directly — always return a new object/array from setState or a reducer.',
    'Keys must be stable IDs — using array index causes wrong reconciliation on reorder.',
  ],
};

const JS_DEFAULT: SidebarData = {
  apis: ['Promise', 'async/await', 'Array.prototype', 'Object.*', 'Proxy', 'WeakMap'],
  related: [
    { label: 'JS Fundamentals',  route: '/javascript/fundamentals' },
    { label: 'Closures',         route: '/javascript/closures'     },
    { label: 'Promises',         route: '/javascript/promises'     },
  ],
  tip: 'JavaScript\'s single thread is never blocked — async/await and Promises schedule work around the event loop without freezing the UI.',
  docs: [
    { label: 'MDN JavaScript Docs',  url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
    { label: 'ECMAScript Spec',      url: 'https://tc39.es/ecma262/' },
    { label: 'Node.js Docs',         url: 'https://nodejs.org/en/docs/' },
  ],
  resources: [
    { label: 'tc39/proposals', url: 'https://github.com/tc39/proposals', badge: 'code' },
    { label: 'You Don\'t Know JS', url: 'https://github.com/getify/You-Dont-Know-JS', badge: 'blog' },
  ],
  gotchas: [
    'typeof null === "object" is a historical bug — always check for null explicitly with === null.',
    'Closures capture variable references, not values — use let in loops or IIFE to capture the value.',
  ],
};

const HTML_DEFAULT: SidebarData = {
  apis: ['<a href>', '<img srcset>', '<form>', '<table>', '<video>', '<picture>'],
  related: [
    { label: 'Document Structure',  route: '/html/document-structure' },
    { label: 'Semantic Elements',   route: '/html/semantic-elements'  },
    { label: 'HTML Forms',          route: '/html/forms'              },
  ],
  tip: 'Always validate your HTML at validator.w3.org — invalid markup causes subtle rendering and accessibility bugs that browsers silently paper over.',
  docs: [
    { label: 'MDN HTML Reference',     url: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },
    { label: 'HTML Living Standard',   url: 'https://html.spec.whatwg.org/'                     },
    { label: 'W3C Markup Validator',   url: 'https://validator.w3.org/'                         },
  ],
  resources: [
    { label: 'Can I Use',  url: 'https://caniuse.com/', badge: 'tool' },
    { label: 'MDN HTML Guides', url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML', badge: 'docs' },
  ],
  gotchas: [
    'Placeholder is not a label — it disappears on input and fails contrast requirements. Always use <label>.',
    'loading="lazy" on the LCP hero image delays the largest contentful paint — use it only below the fold.',
  ],
};

const CSS_DEFAULT: SidebarData = {
  apis: ['box-sizing', 'margin', 'padding', 'border', 'display', 'overflow', 'width/height'],
  related: [
    { label: 'Box Model',    route: '/css/box-model' },
    { label: 'Flexbox',      route: '/css/flexbox'   },
    { label: 'CSS Grid',     route: '/css/grid'      },
  ],
  tip: 'Always set * { box-sizing: border-box } as your first rule — it makes width predictable and eliminates the most common CSS sizing bugs.',
  docs: [
    { label: 'MDN CSS Reference',     url: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
    { label: 'CSS Tricks Guides',     url: 'https://css-tricks.com/guides/'                   },
    { label: 'web.dev — Learn CSS',   url: 'https://web.dev/learn/css'                        },
  ],
  resources: [
    { label: 'CSS Tricks — Flexbox Guide', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', badge: 'blog' },
    { label: 'Can I Use',                  url: 'https://caniuse.com/',                                     badge: 'tool' },
  ],
  gotchas: [
    'Without border-box, adding padding or border increases an element\'s total size — breaking pixel-perfect layouts.',
    'Margin collapse only happens vertically between block elements in normal flow — it does not apply in flex or grid containers.',
  ],
};

const ASPNET_DEFAULT: SidebarData = {
  apis: ['WebApplication', 'IServiceCollection', 'IApplicationBuilder', 'IConfiguration', 'ILogger<T>'],
  related: [
    { label: 'Hosting & Startup',    route: '/aspnet/hosting-startup' },
    { label: 'Middleware Pipeline',  route: '/aspnet/middleware' },
    { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
  ],
  tip: 'ASP.NET Core is modular — every feature is middleware or a service. Understand the request pipeline and DI container first.',
  docs: [
    { label: 'ASP.NET Core Docs',    url: 'https://learn.microsoft.com/en-us/aspnet/core/' },
    { label: 'ASP.NET Core API Ref', url: 'https://learn.microsoft.com/en-us/dotnet/api/?view=aspnetcore-9.0' },
    { label: '.NET Release schedule',url: 'https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core' },
  ],
  resources: [
    { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop',   badge: 'code' },
  ],
  gotchas: [
    'Middleware order matters — UseAuthentication must precede UseAuthorization, and both must precede endpoint middleware.',
    'Scoped services cannot be consumed by Singleton services — captive dependency causes incorrect shared state across requests.',
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
      { label: '101 LINQ Samples',        url: 'https://learn.microsoft.com/en-us/samples/dotnet/try-samples/101-linq-samples/', badge: 'tool'  },
      { label: 'LINQ source (dotnet/runtime)', url: 'https://github.com/dotnet/runtime/tree/main/src/libraries/System.Linq/src/System/Linq', badge: 'code' },
      { label: 'LINQ & IEnumerable — .NET channel', url: 'https://www.youtube.com/watch?v=4ro5UCqU0P4', badge: 'video' },
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

  // ════════════════════════════════════════════════════════════════════════════
  // TYPESCRIPT PAGES
  // ════════════════════════════════════════════════════════════════════════════

  'typescript/basics': {
    apis: ['tsc', 'tsconfig.json', '--noEmit', 'strict', 'any', 'unknown', 'never'],
    related: [
      { label: 'Primitive & Literal Types', route: '/typescript/primitive-types'  },
      { label: 'Strict Mode & Migration',   route: '/typescript/strict-migration' },
      { label: 'tsconfig Deep Dive',        route: '/typescript/tsconfig'         },
    ],
    tip: 'Run tsc --noEmit in CI to type-check without generating output files — faster and keeps your build pipeline clean.',
    docs: [
      { label: 'TypeScript Handbook',    url: 'https://www.typescriptlang.org/docs/handbook/intro.html'      },
      { label: 'TSConfig Reference',     url: 'https://www.typescriptlang.org/tsconfig'                      },
      { label: 'TypeScript Playground',  url: 'https://www.typescriptlang.org/play'                          },
      { label: 'tsc CLI Reference',      url: 'https://www.typescriptlang.org/docs/handbook/compiler-options.html' },
    ],
    resources: [
      { label: 'microsoft/TypeScript',   url: 'https://github.com/microsoft/TypeScript',       badge: 'code' },
      { label: 'TypeScript Deep Dive',   url: 'https://basarat.gitbook.io/typescript',          badge: 'blog' },
    ],
    gotchas: [
      'any disables type checking silently — a single any in a call chain can erase types across the whole expression.',
      'unknown requires narrowing before use — it is the type-safe alternative to any for external/untyped data.',
      'TypeScript is erased at runtime — there are no types in the JavaScript output; runtime checks must use typeof/instanceof.',
    ],
  },

  'typescript/primitive-types': {
    apis: ['string', 'number', 'boolean', 'null', 'undefined', 'void', 'never', 'unknown', 'any', 'bigint', 'symbol'],
    related: [
      { label: 'TS Fundamentals',           route: '/typescript/basics'           },
      { label: 'Interfaces & Type Aliases', route: '/typescript/interfaces-types' },
      { label: 'Type Guards & Narrowing',   route: '/typescript/narrowing'        },
    ],
    tip: 'Prefer unknown over any for values from external sources — it forces you to narrow before use, preserving type safety.',
    docs: [
      { label: 'Everyday Types',        url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html'   },
      { label: 'Narrowing',             url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html'        },
      { label: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play'                                  },
    ],
    resources: [
      { label: 'microsoft/TypeScript',  url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'void and undefined are subtly different — void means "I don\'t care about the return value"; undefined means it literally returns undefined.',
      'never is the bottom type — functions that always throw or loop infinitely have return type never; a union with never collapses.',
      'Literal types are inferred from const: const x = "admin" has type "admin", not string; let x = "admin" has type string.',
    ],
  },

  'typescript/interfaces-types': {
    apis: ['interface', 'type', 'extends', 'implements', 'readonly', '[key: string]: T', 'declaration merging', '&'],
    related: [
      { label: 'Primitive & Literal Types', route: '/typescript/primitive-types' },
      { label: 'Union & Intersection',       route: '/typescript/unions'          },
      { label: 'Mapped Types',               route: '/typescript/mapped-types'    },
    ],
    tip: 'Use interface for object shapes that may be extended or merged; use type for unions, intersections, and computed types.',
    docs: [
      { label: 'Object Types (Handbook)',   url: 'https://www.typescriptlang.org/docs/handbook/2/objects.html'           },
      { label: 'Type Aliases (Handbook)',   url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases' },
      { label: 'TypeScript Playground',    url: 'https://www.typescriptlang.org/play'                                     },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'Declaration merging only works with interface — two type aliases for the same name is a compile error.',
      'Index signatures ([key: string]: T) require all named properties to be assignable to T — common source of unexpected errors.',
      'type aliases cannot be reopened after definition; interface can always be extended by another interface declaration.',
    ],
  },

  'typescript/unions': {
    apis: ['|', '&', 'discriminated union', 'in operator', 'typeof', 'instanceof', 'satisfies'],
    related: [
      { label: 'Type Guards & Narrowing', route: '/typescript/narrowing'          },
      { label: 'Enums & Tuples',          route: '/typescript/enums-tuples'       },
      { label: 'Conditional Types',       route: '/typescript/conditional-types'  },
    ],
    tip: 'Add a literal discriminant property (kind: "circle" | "square") to union members — exhaustive narrowing becomes trivial.',
    docs: [
      { label: 'Union Types (Handbook)',        url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types' },
      { label: 'Narrowing (Handbook)',          url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html'                  },
      { label: 'TypeScript Playground',        url: 'https://www.typescriptlang.org/play'                                             },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'Intersection (&) on primitive types gives never — string & number = never; it is only meaningful on object types.',
      'Spreading a union into a function: fn(...args: A | B) does not work — you need overloads or a conditional type.',
      'The exhaustiveness check (default: const _: never = x) fails silently if the variable is unused and noUnusedLocals is off.',
    ],
  },

  'typescript/narrowing': {
    apis: ['typeof', 'instanceof', 'in', 'x is T (type predicate)', 'asserts x is T', 'satisfies never', 'Array.isArray()'],
    related: [
      { label: 'Union & Intersection',       route: '/typescript/unions'         },
      { label: 'Conditional Types',          route: '/typescript/conditional-types' },
      { label: 'Enums & Tuples',             route: '/typescript/enums-tuples'   },
    ],
    tip: 'Use asserts x is T for assertion functions — TypeScript narrows the type after the call site without requiring a conditional.',
    docs: [
      { label: 'Narrowing (Handbook)',    url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html' },
      { label: 'TypeScript Playground',  url: 'https://www.typescriptlang.org/play'                          },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'Type predicates (x is T) are unsafe — TypeScript trusts your return value; returning true on the wrong branch corrupts the type.',
      'typeof null === "object" — always check null separately before checking for an object type.',
      'The in operator narrows to the intersection that contains the key — not just the branch that definitely has it.',
    ],
  },

  'typescript/enums-tuples': {
    apis: ['enum', 'const enum', 'string enum', 'numeric enum', 'tuple', 'labeled tuple', 'rest in tuple'],
    related: [
      { label: 'Union & Intersection', route: '/typescript/unions'           },
      { label: 'Primitive & Literal',  route: '/typescript/primitive-types'  },
      { label: 'Conditional Types',    route: '/typescript/conditional-types' },
    ],
    tip: 'Prefer const enum (for inlining) or a string literal union over numeric enums in new code — unions are tree-shakable and readable in logs.',
    docs: [
      { label: 'Enums (Handbook)',      url: 'https://www.typescriptlang.org/docs/handbook/enums.html'                                     },
      { label: 'Tuple Types',           url: 'https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types'                     },
      { label: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play'                                                          },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'const enum are erased at compile time — they cannot be used from outside the module with isolatedModules: true (required by esbuild/Babel).',
      'Numeric enums generate a reverse-mapping object — Direction[0] === "Up" — which can be surprising and increases bundle size.',
      'Tuples are assignable to arrays but not vice versa — [string, number] is stricter than (string | number)[].',
    ],
  },

  'typescript/generics': {
    apis: ['<T>', '<T extends U>', 'default type parameter', 'keyof T', 'T[K]', 'generic function', 'generic interface'],
    related: [
      { label: 'Generic Patterns',     route: '/typescript/generic-patterns' },
      { label: 'Utility Types',        route: '/typescript/utility-types'    },
      { label: 'Conditional Types',    route: '/typescript/conditional-types' },
    ],
    tip: 'Name type parameters by role in non-trivial generics — <TInput, TOutput> is clearer than <T, U> when both parameters matter.',
    docs: [
      { label: 'Generics (Handbook)',   url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html' },
      { label: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play'                         },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
      { label: 'TypeScript Deep Dive', url: 'https://basarat.gitbook.io/typescript',   badge: 'blog' },
    ],
    gotchas: [
      'T extends string means T could be a string literal subtype, not just string — be careful in conditional types.',
      'Generic defaults (T = unknown) kick in only when T cannot be inferred — explicit default does not prevent inference.',
      'Using typeof param inside a generic function gives the generic type T, not the concrete type at the call site.',
    ],
  },

  'typescript/generic-patterns': {
    apis: ['Result<T,E>', 'Option<T>', 'generic factory (new() => T)', 'fluent builder', 'phantom type', 'branded type'],
    related: [
      { label: 'Generics Fundamentals', route: '/typescript/generics'          },
      { label: 'Utility Types',         route: '/typescript/utility-types'     },
      { label: 'Conditional Types',     route: '/typescript/conditional-types' },
    ],
    tip: 'Model fallible operations as Result<T, E> = { ok: true; value: T } | { ok: false; error: E } — explicit errors, no unexpected throws.',
    docs: [
      { label: 'Generics (Handbook)',   url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html'    },
      { label: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play'                             },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
      { label: 'ts-results (npm)',      url: 'https://www.npmjs.com/package/ts-results', badge: 'tool' },
    ],
    gotchas: [
      'Phantom types exist only at compile time — a branded { _brand: "UserId" } adds zero runtime overhead.',
      'TypeScript does not support true higher-kinded types (HKT) — workarounds exist via interface merging but are verbose.',
      'Generic factories (new() => T) only work for classes with public constructors — abstract classes are excluded.',
    ],
  },

  'typescript/utility-types': {
    apis: ['Partial<T>', 'Required<T>', 'Readonly<T>', 'Pick<T,K>', 'Omit<T,K>', 'Record<K,V>', 'Extract<T,U>', 'Exclude<T,U>', 'NonNullable<T>', 'ReturnType<F>', 'Parameters<F>'],
    related: [
      { label: 'Mapped Types',      route: '/typescript/mapped-types'      },
      { label: 'Conditional Types', route: '/typescript/conditional-types'  },
      { label: 'Generics',          route: '/typescript/generics'           },
    ],
    tip: 'Chain utility types for precise shapes: Pick<Readonly<User>, "id" | "name"> produces a readonly subset in one expression.',
    docs: [
      { label: 'Utility Types Reference', url: 'https://www.typescriptlang.org/docs/handbook/utility-types.html' },
      { label: 'TypeScript Playground',   url: 'https://www.typescriptlang.org/play'                             },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
      { label: 'type-fest (npm)',       url: 'https://www.npmjs.com/package/type-fest', badge: 'tool' },
    ],
    gotchas: [
      'Partial and Required are shallow — nested objects are unaffected; write a DeepPartial recursive type for full depth.',
      'Omit<T, K> on a union type may not work as expected — each union member is processed independently.',
      'Record<K, V> with a union K creates a required entry for every member — use Partial<Record<K, V>> for optional entries.',
    ],
  },

  'typescript/mapped-types': {
    apis: ['{ [K in keyof T]: T[K] }', '-?', '-readonly', 'as (key remap)', 'PropertyKey', 'template literal key'],
    related: [
      { label: 'Utility Types',          route: '/typescript/utility-types'         },
      { label: 'Conditional Types',      route: '/typescript/conditional-types'     },
      { label: 'Template Literal Types', route: '/typescript/template-literal-types'},
    ],
    tip: 'Use the as clause for key remapping: { [K in keyof T as Capitalize<string & K>]: T[K] } to rename keys at the type level.',
    docs: [
      { label: 'Mapped Types (Handbook)',   url: 'https://www.typescriptlang.org/docs/handbook/2/mapped-types.html' },
      { label: 'TypeScript Playground',    url: 'https://www.typescriptlang.org/play'                              },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'Mapped types on union types distribute over the union — each member is mapped independently, which may not be what you want.',
      'Add -readonly and -? to actively remove modifiers; just omitting them keeps the original modifier.',
      'Key remapping with as never filters out that key — useful for removing keys conditionally: as K extends "id" ? never : K.',
    ],
  },

  'typescript/conditional-types': {
    apis: ['T extends U ? X : Y', 'infer P', 'distributive conditional', 'NonNullable<T>', 'Awaited<T>', 'ReturnType<F>'],
    related: [
      { label: 'Mapped Types',           route: '/typescript/mapped-types'          },
      { label: 'Utility Types',          route: '/typescript/utility-types'         },
      { label: 'Template Literal Types', route: '/typescript/template-literal-types'},
    ],
    tip: 'Wrap T in a tuple ([T] extends [U]) to prevent distributive behaviour when you need the whole union evaluated together.',
    docs: [
      { label: 'Conditional Types (Handbook)', url: 'https://www.typescriptlang.org/docs/handbook/2/conditional-types.html' },
      { label: 'TypeScript Playground',       url: 'https://www.typescriptlang.org/play'                                    },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'Conditional types with a still-generic T are deferred — the type stays unevaluated until T is resolved at the call site.',
      'Distributive types apply to each union member independently — T extends U ? X : Y with T = A | B gives (A extends U ? X : Y) | (B extends U ? X : Y).',
      'infer can only appear in the extends clause of a conditional type — not in the true/false branches.',
    ],
  },

  'typescript/template-literal-types': {
    apis: ['`${T}${U}`', 'Uppercase<S>', 'Lowercase<S>', 'Capitalize<S>', 'Uncapitalize<S>', 'infer in template'],
    related: [
      { label: 'Conditional Types', route: '/typescript/conditional-types' },
      { label: 'Mapped Types',      route: '/typescript/mapped-types'      },
      { label: 'Utility Types',     route: '/typescript/utility-types'     },
    ],
    tip: 'Combine with mapped types to derive event handler names: { [K in EventName as `on${Capitalize<K>}`]: Handler<K> }',
    docs: [
      { label: 'Template Literal Types (Handbook)', url: 'https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html' },
      { label: 'TypeScript Playground',            url: 'https://www.typescriptlang.org/play'                                       },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'Large string unions in template literals create exponentially large union types — can significantly slow compilation.',
      'infer in template literal types cannot match across arbitrary word boundaries — use a chained conditional to extract parts.',
      'Intrinsic string manipulation (Uppercase, Capitalize) only works on string literal types, not runtime strings.',
    ],
  },

  'typescript/classes': {
    apis: ['class', 'private / protected / public', '#private (ECMAScript)', 'readonly', 'abstract class', 'override', 'parameter property'],
    related: [
      { label: 'Decorators',              route: '/typescript/decorators'        },
      { label: 'Interfaces & Type Aliases', route: '/typescript/interfaces-types'},
      { label: 'Generics',                route: '/typescript/generics'          },
    ],
    tip: 'Use ECMAScript #private for genuine runtime privacy — TypeScript private is compile-time only and is accessible in emitted JS.',
    docs: [
      { label: 'Classes (Handbook)',    url: 'https://www.typescriptlang.org/docs/handbook/2/classes.html' },
      { label: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play'                        },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'abstract class cannot be instantiated — trying to new it is a compile error; always create a concrete subclass.',
      'override keyword (TS 4.3+) enforces the method exists in the superclass — but it is NOT required by default; enable noImplicitOverride.',
      'Parameter properties (constructor(private x: T)) only work in TypeScript classes, not in plain ES class declarations.',
    ],
  },

  'typescript/decorators': {
    apis: ['@decorator', 'ClassDecorator', 'MethodDecorator', 'PropertyDecorator', 'ParameterDecorator', 'DecoratorContext (TS 5)', 'experimentalDecorators'],
    related: [
      { label: 'Classes & Visibility', route: '/typescript/classes'   },
      { label: 'tsconfig Deep Dive',   route: '/typescript/tsconfig'  },
      { label: 'TypeScript with Frameworks', route: '/typescript/frameworks' },
    ],
    tip: 'TS 5.0 decorators (TC39 Stage 3) are the standard — use experimentalDecorators: true only for legacy code or frameworks that require it.',
    docs: [
      { label: 'Decorators (Handbook)', url: 'https://www.typescriptlang.org/docs/handbook/decorators.html'                  },
      { label: 'TC39 Decorators Proposal', url: 'https://github.com/tc39/proposal-decorators'                               },
      { label: 'TypeScript 5.0 Blog',   url: 'https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/'        },
      { label: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play'                                          },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'TS 5.0 decorators and experimentalDecorators are INCOMPATIBLE — you cannot mix them in the same file.',
      'Angular still uses experimental decorators internally — enable experimentalDecorators in Angular projects.',
      'Class decorators receive the class constructor; method decorators receive the method and its descriptor — the APIs differ between experimental and TC39 Stage 3.',
    ],
  },

  'typescript/tsconfig': {
    apis: ['target', 'lib', 'module', 'moduleResolution', 'strict', 'paths', 'baseUrl', 'composite', 'references', 'skipLibCheck'],
    related: [
      { label: 'Module System',       route: '/typescript/modules'      },
      { label: 'Declaration Files',   route: '/typescript/declarations' },
      { label: 'TS Performance',      route: '/typescript/ts-performance'},
    ],
    tip: 'Use extends in tsconfig to share a base: tsconfig.base.json sets strict + target, per-package configs extend it and add paths.',
    docs: [
      { label: 'TSConfig Reference',    url: 'https://www.typescriptlang.org/tsconfig'                                          },
      { label: 'Project References',    url: 'https://www.typescriptlang.org/docs/handbook/project-references.html'              },
      { label: 'tsc CLI Reference',     url: 'https://www.typescriptlang.org/docs/handbook/compiler-options.html'                },
      { label: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play'                                               },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'target (JS output version) and lib (available types) are independent — you can target ES5 while using Promise types from lib ES2017.',
      'moduleResolution: bundler (TS 5.0+) is required for Vite/esbuild — do not use node16/nodenext with plain bundlers.',
      'paths aliases must also be configured in the bundler (Vite/Webpack) — tsc resolves them for type-checking but bundlers do their own resolution.',
    ],
  },

  'typescript/modules': {
    apis: ['import', 'export', 'export default', 'import type', 'require()', 'namespace', 'declare module', 'module resolution'],
    related: [
      { label: 'tsconfig Deep Dive',    route: '/typescript/tsconfig'    },
      { label: 'Declaration Files',     route: '/typescript/declarations'},
      { label: 'TypeScript Frameworks', route: '/typescript/frameworks'  },
    ],
    tip: 'Use import type for type-only imports — it is erased at compile time and prevents accidental circular dependencies at runtime.',
    docs: [
      { label: 'Modules (Handbook)',    url: 'https://www.typescriptlang.org/docs/handbook/2/modules.html'   },
      { label: 'Module Resolution',    url: 'https://www.typescriptlang.org/docs/handbook/module-resolution.html' },
      { label: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play'                          },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'A file with no import/export is a script — its declarations are global; add export {} to make it a module.',
      'namespace (internal modules) is legacy — use ES modules and import/export in all new code.',
      'esModuleInterop: true allows default imports from CommonJS modules — without it you need import * as React from "react".',
    ],
  },

  'typescript/declarations': {
    apis: ['declare', '.d.ts', 'declare module', 'declare global', '@types/xxx', 'DefinitelyTyped', 'module augmentation'],
    related: [
      { label: 'Module System',     route: '/typescript/modules'    },
      { label: 'TypeScript Frameworks', route: '/typescript/frameworks'},
      { label: 'tsconfig Deep Dive', route: '/typescript/tsconfig'   },
    ],
    tip: 'Use module augmentation to extend third-party types: declare module "express" { interface Request { user?: User } }',
    docs: [
      { label: 'Declaration Files (Handbook)', url: 'https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html' },
      { label: 'Publishing (Handbook)',        url: 'https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html'   },
      { label: 'TypeScript Playground',       url: 'https://www.typescriptlang.org/play'                                              },
    ],
    resources: [
      { label: 'DefinitelyTyped',      url: 'https://github.com/DefinitelyTyped/DefinitelyTyped', badge: 'code' },
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript',            badge: 'code' },
    ],
    gotchas: [
      'A .d.ts without any exports is an ambient global declaration — add export {} if you only want to augment an existing module.',
      '@types packages belong in devDependencies — they are erased at runtime and should not appear in your production bundle.',
      'declare module "lib" {} creates a completely new shape — use import type and interface merging to augment without clobbering existing types.',
    ],
  },

  'typescript/frameworks': {
    apis: ['React.FC<Props>', 'JSX.Element', 'z.infer<T>', 'Zod', 'Request augmentation', 'Next.js types', '@types/node'],
    related: [
      { label: 'Declaration Files', route: '/typescript/declarations' },
      { label: 'Generics',          route: '/typescript/generics'     },
      { label: 'Modules',           route: '/typescript/modules'      },
    ],
    tip: 'Prefer (props: Props) => JSX.Element over React.FC<Props> — no implicit children, better generic components, and simpler types.',
    docs: [
      { label: 'React TypeScript Cheatsheet', url: 'https://react-typescript-cheatsheet.netlify.app'                    },
      { label: 'Zod Documentation',           url: 'https://zod.dev'                                                    },
      { label: 'TypeScript Handbook',         url: 'https://www.typescriptlang.org/docs/handbook/intro.html'            },
      { label: 'TypeScript Playground',       url: 'https://www.typescriptlang.org/play'                                },
    ],
    resources: [
      { label: '@types/react',         url: 'https://www.npmjs.com/package/@types/react',  badge: 'tool' },
      { label: '@types/node',          url: 'https://www.npmjs.com/package/@types/node',   badge: 'tool' },
      { label: 'DefinitelyTyped',      url: 'https://github.com/DefinitelyTyped/DefinitelyTyped', badge: 'code' },
    ],
    gotchas: [
      'React.FC removed implicit children in React 18 — old tutorials showing children without explicit typing are incorrect.',
      'Zod z.infer<typeof schema> gives the TypeScript type from a runtime schema — one source of truth for validation + types.',
      'Augmenting Express Request types requires the exact module path: "express-serve-static-core" not "express".',
    ],
  },

  'typescript/strict-migration': {
    apis: ['strict', 'noImplicitAny', 'strictNullChecks', 'allowJs', 'checkJs', '--noEmit', 'ts-migrate'],
    related: [
      { label: 'TS Fundamentals',  route: '/typescript/basics'    },
      { label: 'tsconfig',         route: '/typescript/tsconfig'  },
      { label: 'Declarations',     route: '/typescript/declarations'},
    ],
    tip: 'Add // @ts-check to JS files for incremental type-checking before full migration — zero-cost first step for large codebases.',
    docs: [
      { label: 'Migrating from JS (Handbook)', url: 'https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html' },
      { label: 'Strict mode flags',            url: 'https://www.typescriptlang.org/tsconfig#strict'                              },
      { label: 'TypeScript Playground',        url: 'https://www.typescriptlang.org/play'                                         },
    ],
    resources: [
      { label: 'microsoft/TypeScript',  url: 'https://github.com/microsoft/TypeScript',              badge: 'code' },
      { label: 'ts-migrate (npm)',       url: 'https://www.npmjs.com/package/ts-migrate',             badge: 'tool' },
    ],
    gotchas: [
      'noImplicitAny errors flood first in a large JS migration — suppress with // @ts-expect-error and fix gradually by file.',
      'strictNullChecks reveals the most bugs but is the hardest flag to retrofit — enable it last, after noImplicitAny is clean.',
      'allowJs + checkJs type-check JS files as-is; allowJs without checkJs compiles them but does not type-check.',
    ],
  },

  'typescript/ts-performance': {
    apis: ['composite: true', 'incremental: true', 'isolatedModules: true', 'skipLibCheck: true', '--listFiles', '--diagnostics', 'project references'],
    related: [
      { label: 'tsconfig Deep Dive',  route: '/typescript/tsconfig'    },
      { label: 'Modules',             route: '/typescript/modules'     },
      { label: 'Declaration Files',   route: '/typescript/declarations'},
    ],
    tip: 'Run tsc --diagnostics to see which files consume the most type-checking time — target those for simplification or project-reference isolation.',
    docs: [
      { label: 'Performance Wiki',      url: 'https://github.com/microsoft/TypeScript/wiki/Performance'           },
      { label: 'Project References',    url: 'https://www.typescriptlang.org/docs/handbook/project-references.html'},
      { label: 'TSConfig Reference',    url: 'https://www.typescriptlang.org/tsconfig'                            },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'isolatedModules: true requires each file to be transpilable in isolation — const enum and ambient type-only re-exports fail.',
      'skipLibCheck skips type errors in .d.ts files — it speeds up compilation but may hide real errors from dependencies.',
      'Deeply recursive conditional types and mapped types on large unions are the most common causes of slow compilation.',
    ],
  },

  'typescript/cheatsheet': {
    apis: ['Partial<T>', 'Record<K,V>', 'ReturnType<F>', 'keyof', 'typeof', 'infer', 'satisfies', 'as const'],
    related: [
      { label: 'Utility Types',    route: '/typescript/utility-types'  },
      { label: 'Mapped Types',     route: '/typescript/mapped-types'   },
      { label: 'Conditional Types',route: '/typescript/conditional-types'},
    ],
    tip: 'Use as const on object literals for narrow literal types on all values — { role: "admin" } as const narrows to "admin", not string.',
    docs: [
      { label: 'Utility Types Reference', url: 'https://www.typescriptlang.org/docs/handbook/utility-types.html' },
      { label: 'TypeScript Handbook',     url: 'https://www.typescriptlang.org/docs/handbook/intro.html'         },
      { label: 'TypeScript Playground',   url: 'https://www.typescriptlang.org/play'                             },
    ],
    resources: [
      { label: 'microsoft/TypeScript',  url: 'https://github.com/microsoft/TypeScript',   badge: 'code' },
      { label: 'type-challenges (GitHub)', url: 'https://github.com/type-challenges/type-challenges', badge: 'code' },
    ],
    gotchas: [
      'keyof on a class type includes all public property and method names — including inherited ones from the prototype chain.',
      'as const on an array creates a readonly tuple — useful but means you cannot push() or sort() without casting.',
      'satisfies operator checks a value against a type without widening the variable\'s inferred type — different from a type annotation.',
    ],
  },

  'typescript/interview-prep': {
    apis: ['type vs interface', 'generic constraints', 'conditional types', 'infer', 'discriminated union', 'structural typing'],
    related: [
      { label: 'TS Fundamentals',    route: '/typescript/basics'        },
      { label: 'Utility Types',      route: '/typescript/utility-types' },
      { label: 'Type Guards',        route: '/typescript/narrowing'     },
    ],
    tip: 'Answer with examples — explaining infer by writing T extends Promise<infer U> ? U : never beats any definition-only answer in an interview.',
    docs: [
      { label: 'TypeScript Handbook',   url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
      { label: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play'                     },
    ],
    resources: [
      { label: 'microsoft/TypeScript',  url: 'https://github.com/microsoft/TypeScript',              badge: 'code' },
      { label: 'type-challenges',       url: 'https://github.com/type-challenges/type-challenges',   badge: 'code' },
    ],
    gotchas: [
      'Senior questions probe trade-offs ("when would you use type over interface") — one-line definitions are not enough.',
      'Structural typing questions trip up candidates from Java/C# backgrounds — two unrelated classes with the same shape are assignable to each other.',
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

  // ════════════════════════════════════════════════════════════════════════════
  // REACT PAGES
  // ════════════════════════════════════════════════════════════════════════════

  'react/basics': {
    apis: ['JSX', 'createElement()', 'Fragment', 'key', 'ReactDOM.createRoot()'],
    related: [
      { label: 'Core Hooks',       route: '/react/hooks-core'     },
      { label: 'TypeScript & React', route: '/react/typescript'   },
      { label: 'React Patterns',   route: '/react/patterns'       },
    ],
    tip: 'JSX is syntactic sugar — every <Tag> compiles to React.createElement(). Understanding this makes the virtual DOM click.',
    docs: [
      { label: 'React Docs — Describing the UI',   url: 'https://react.dev/learn/describing-the-ui'         },
      { label: 'React.dev Quick Start',            url: 'https://react.dev/learn'                           },
      { label: 'Reconciliation (legacy docs)',     url: 'https://legacy.reactjs.org/docs/reconciliation.html'},
    ],
    resources: [
      { label: 'facebook/react',   url: 'https://github.com/facebook/react', badge: 'code' },
      { label: 'React Blog',       url: 'https://react.dev/blog',             badge: 'blog' },
    ],
    gotchas: [
      'Keys must be stable data IDs — using array index causes incorrect reconciliation on reorder or filter.',
      'JSX expressions must return a single root — wrap siblings in a Fragment <> </> or a div.',
      'Component names must start with uppercase — lowercase tags are treated as HTML elements.',
    ],
  },

  'react/hooks-core': {
    apis: ['useState()', 'useEffect()', 'useRef()', 'useContext()', 'Rules of Hooks'],
    related: [
      { label: 'Advanced Hooks',    route: '/react/hooks-advanced' },
      { label: 'Context API',       route: '/react/context'        },
      { label: 'React Patterns',    route: '/react/patterns'       },
    ],
    tip: 'useEffect cleanup is mandatory for subscriptions, timers, and fetch abort controllers — a missing cleanup causes memory leaks.',
    docs: [
      { label: 'useState Reference',  url: 'https://react.dev/reference/react/useState'  },
      { label: 'useEffect Reference', url: 'https://react.dev/reference/react/useEffect' },
      { label: 'useRef Reference',    url: 'https://react.dev/reference/react/useRef'    },
      { label: 'Rules of Hooks',      url: 'https://react.dev/reference/rules/rules-of-hooks' },
    ],
    resources: [
      { label: 'A Complete Guide to useEffect', url: 'https://overreacted.io/a-complete-guide-to-useeffect/', badge: 'blog' },
      { label: 'facebook/react',               url: 'https://github.com/facebook/react',                      badge: 'code' },
    ],
    gotchas: [
      'Never call hooks conditionally or inside loops — hooks must run in the same order on every render.',
      'Stale closure: useEffect captures props/state at the time it ran. Use the functional updater setState(prev => ...) to avoid staleness.',
      'useEffect with an empty [] dep array runs once — but its cleanup still runs on unmount.',
    ],
  },

  'react/hooks-advanced': {
    apis: ['useReducer()', 'useMemo()', 'useCallback()', 'useTransition()', 'useDeferredValue()', 'useId()'],
    related: [
      { label: 'Core Hooks',        route: '/react/hooks-core'      },
      { label: 'React Performance', route: '/react/performance'     },
      { label: 'State Management',  route: '/react/state-management'},
    ],
    tip: 'useReducer shines when the next state depends on the previous state across multiple sub-values — prefer it over multiple useState.',
    docs: [
      { label: 'useReducer Reference',       url: 'https://react.dev/reference/react/useReducer'       },
      { label: 'useMemo Reference',          url: 'https://react.dev/reference/react/useMemo'          },
      { label: 'useCallback Reference',      url: 'https://react.dev/reference/react/useCallback'      },
      { label: 'useTransition Reference',    url: 'https://react.dev/reference/react/useTransition'    },
    ],
    resources: [
      { label: 'React Blog — React 18',  url: 'https://react.dev/blog/2022/03/29/react-v18',  badge: 'blog' },
      { label: 'facebook/react',         url: 'https://github.com/facebook/react',             badge: 'code' },
    ],
    gotchas: [
      'useMemo and useCallback have their own overhead — only add them after profiling shows a real performance problem.',
      'useId() generates a stable ID per component instance — safe for SSR. Never use Math.random() for element IDs.',
    ],
  },

  'react/forms': {
    apis: ['controlled input', 'useRef for uncontrolled', 'React Hook Form', 'zodResolver', 'useFieldArray'],
    related: [
      { label: 'Core Hooks',        route: '/react/hooks-core'  },
      { label: 'TypeScript & React', route: '/react/typescript' },
      { label: 'Testing React',     route: '/react/testing'     },
    ],
    tip: 'React Hook Form uses uncontrolled inputs by default — the form only re-renders on submission and on validation errors, not on every keystroke.',
    docs: [
      { label: 'RHF Docs',          url: 'https://react-hook-form.com/docs'                              },
      { label: 'Zod Docs',          url: 'https://zod.dev'                                               },
      { label: 'React Forms Guide',  url: 'https://react.dev/reference/react-dom/components/input'       },
    ],
    resources: [
      { label: 'react-hook-form/react-hook-form', url: 'https://github.com/react-hook-form/react-hook-form', badge: 'code' },
      { label: 'colinhacks/zod',                  url: 'https://github.com/colinhacks/zod',                   badge: 'code' },
    ],
    gotchas: [
      'Controller wraps controlled third-party inputs (Radix, MUI) — register() only works on native HTML inputs.',
      'Zod refinements run after field validation — put cross-field checks (password confirm) in .superRefine() not per-field.',
    ],
  },

  'react/context': {
    apis: ['createContext()', 'useContext()', 'Context.Provider', 'useReducer + Context'],
    related: [
      { label: 'State Management',  route: '/react/state-management' },
      { label: 'React Patterns',    route: '/react/patterns'         },
      { label: 'Advanced Hooks',    route: '/react/hooks-advanced'   },
    ],
    tip: 'Split context into a StateContext and a DispatchContext — consumers that only dispatch never re-render when state changes.',
    docs: [
      { label: 'createContext Reference',  url: 'https://react.dev/reference/react/createContext'  },
      { label: 'useContext Reference',     url: 'https://react.dev/reference/react/useContext'     },
      { label: 'Scaling with Reducer + Context', url: 'https://react.dev/learn/scaling-up-with-reducer-and-context' },
    ],
    resources: [
      { label: 'facebook/react', url: 'https://github.com/facebook/react', badge: 'code' },
    ],
    gotchas: [
      'Every context consumer re-renders when the Provider\'s value reference changes — memoize the value object.',
      'Context is not a state manager — it is a dependency injector. Pair with useReducer for complex state.',
    ],
  },

  'react/state-management': {
    apis: ['useState', 'useReducer', 'Zustand create()', 'Jotai atom()', 'RTK createSlice'],
    related: [
      { label: 'Context API',        route: '/react/context'        },
      { label: 'Advanced Hooks',     route: '/react/hooks-advanced' },
      { label: 'TanStack Query',     route: '/react/tanstack-query' },
    ],
    tip: 'TanStack Query for server state + Zustand for client state covers 90% of React apps — RTK is rarely needed.',
    docs: [
      { label: 'Zustand Docs',        url: 'https://zustand-demo.pmnd.rs/'         },
      { label: 'Jotai Docs',          url: 'https://jotai.org/docs/introduction'   },
      { label: 'Redux Toolkit Docs',  url: 'https://redux-toolkit.js.org/'         },
      { label: 'React — State Guide', url: 'https://react.dev/learn/managing-state'},
    ],
    resources: [
      { label: 'pmndrs/zustand', url: 'https://github.com/pmndrs/zustand', badge: 'code' },
      { label: 'pmndrs/jotai',   url: 'https://github.com/pmndrs/jotai',   badge: 'code' },
    ],
    gotchas: [
      'Zustand subscriptions are fine-grained — use selector functions to avoid re-renders from unrelated state slices.',
      'Redux DevTools work with Zustand via devtools middleware — add it in development for time-travel debugging.',
    ],
  },

  'react/router': {
    apis: ['createBrowserRouter()', 'loader', 'action', '<Outlet />', 'useFetcher()', 'useNavigate()'],
    related: [
      { label: 'TanStack Query',    route: '/react/tanstack-query' },
      { label: 'Next.js App Router', route: '/react/nextjs'       },
      { label: 'React Forms',       route: '/react/forms'         },
    ],
    tip: 'loader() runs before the component renders — no loading state, no useEffect. Use it for all route-level data fetching.',
    docs: [
      { label: 'React Router v6 Docs',    url: 'https://reactrouter.com/en/main'                        },
      { label: 'loader Reference',        url: 'https://reactrouter.com/en/main/route/loader'           },
      { label: 'action Reference',        url: 'https://reactrouter.com/en/main/route/action'           },
      { label: 'useFetcher Reference',    url: 'https://reactrouter.com/en/main/hooks/use-fetcher'      },
    ],
    resources: [
      { label: 'remix-run/react-router', url: 'https://github.com/remix-run/react-router', badge: 'code' },
    ],
    gotchas: [
      'loader errors bubble to the nearest errorElement — always add one to prevent blank screens.',
      'navigate() in a loader/action is not the same as redirect() — use redirect() from react-router-dom for server-like redirects.',
    ],
  },

  'react/tanstack-query': {
    apis: ['useQuery()', 'useMutation()', 'queryClient.invalidateQueries()', 'useInfiniteQuery()', 'QueryClient'],
    related: [
      { label: 'State Management',   route: '/react/state-management' },
      { label: 'React Router',       route: '/react/router'           },
      { label: 'Core Hooks',         route: '/react/hooks-core'       },
    ],
    tip: 'stale-while-revalidate is on by default — data is shown immediately from cache while a background fetch updates it. Use staleTime to control how long data stays fresh.',
    docs: [
      { label: 'TanStack Query Docs',        url: 'https://tanstack.com/query/latest/docs/framework/react/overview' },
      { label: 'Query Keys Guide',           url: 'https://tanstack.com/query/latest/docs/framework/react/guides/query-keys'      },
      { label: 'Mutations Guide',            url: 'https://tanstack.com/query/latest/docs/framework/react/guides/mutations'       },
      { label: 'Optimistic Updates Guide',   url: 'https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates' },
    ],
    resources: [
      { label: 'TanStack/query', url: 'https://github.com/TanStack/query', badge: 'code' },
      { label: 'TanStack Blog',  url: 'https://tanstack.com/blog',          badge: 'blog' },
    ],
    gotchas: [
      'Query keys are serialised — objects with the same properties in different orders are the same key.',
      'onSuccess/onError callbacks in useMutation run once; use queryClient.invalidateQueries in onSuccess for cache consistency.',
    ],
  },

  'react/performance': {
    apis: ['React.memo()', 'useMemo()', 'useCallback()', 'lazy()', '<Suspense>', 'FixedSizeList', 'useTransition()'],
    related: [
      { label: 'Advanced Hooks',    route: '/react/hooks-advanced' },
      { label: 'React Patterns',    route: '/react/patterns'       },
      { label: 'Testing React',     route: '/react/testing'        },
    ],
    tip: 'Profile in React DevTools first — the "Why did this render?" panel pinpoints the prop or hook that triggered a re-render.',
    docs: [
      { label: 'React.memo Reference',    url: 'https://react.dev/reference/react/memo'                        },
      { label: 'useMemo Reference',       url: 'https://react.dev/reference/react/useMemo'                     },
      { label: 'lazy Reference',          url: 'https://react.dev/reference/react/lazy'                        },
      { label: 'useTransition Reference', url: 'https://react.dev/reference/react/useTransition'               },
    ],
    resources: [
      { label: 'react-window Docs',    url: 'https://react-window.vercel.app/',                         badge: 'docs' },
      { label: 'bvaughn/react-window', url: 'https://github.com/bvaughn/react-window',                  badge: 'code' },
      { label: 'web-vitals Library',   url: 'https://github.com/GoogleChrome/web-vitals',               badge: 'code' },
    ],
    gotchas: [
      'React.memo with unstable prop references (inline objects/functions) never skips re-renders — memoising is pointless without stable refs.',
      'Virtualisation only helps when the list is long enough to fill more than the viewport — short lists need no windowing.',
    ],
  },

  'react/patterns': {
    apis: ['createContext()', 'React.memo()', 'forwardRef()', 'React.Children', 'render prop', 'HOC'],
    related: [
      { label: 'Core Hooks',         route: '/react/hooks-core'     },
      { label: 'React Performance',  route: '/react/performance'    },
      { label: 'Context API',        route: '/react/context'        },
    ],
    tip: 'Custom hooks replaced render props for most cases — only reach for render props when a library needs to inject both behavior and rendering context.',
    docs: [
      { label: 'Reusing Logic with Custom Hooks', url: 'https://react.dev/learn/reusing-logic-with-custom-hooks' },
      { label: 'Passing Data with Context',       url: 'https://react.dev/learn/passing-data-deeply-with-context'},
      { label: 'forwardRef Reference',            url: 'https://react.dev/reference/react/forwardRef'            },
    ],
    resources: [
      { label: 'Radix UI Primitives (headless)',  url: 'https://www.radix-ui.com/',                         badge: 'docs' },
      { label: 'radix-ui/primitives',             url: 'https://github.com/radix-ui/primitives',            badge: 'code' },
    ],
    gotchas: [
      'Compound components via cloneElement only work for direct children — Context-based compound components work at any depth.',
      'HOC display names must be set manually — omitting them makes DevTools show "Unknown" or the wrong name.',
    ],
  },

  'react/typescript': {
    apis: ['React.ReactNode', 'React.FC', 'React.ChangeEvent<T>', 'forwardRef<RefType,Props>', 'ComponentPropsWithoutRef<T>'],
    related: [
      { label: 'React Patterns',     route: '/react/patterns'       },
      { label: 'React Forms',        route: '/react/forms'          },
      { label: 'Testing React',      route: '/react/testing'        },
    ],
    tip: 'Prefer (props: Props) => JSX.Element over React.FC<Props> — no implicit children, better inference, and simpler generic components.',
    docs: [
      { label: 'React TypeScript Cheatsheet', url: 'https://react-typescript-cheatsheet.netlify.app'      },
      { label: 'TypeScript Handbook',         url: 'https://www.typescriptlang.org/docs/handbook/intro.html'},
      { label: 'forwardRef Reference',        url: 'https://react.dev/reference/react/forwardRef'          },
    ],
    resources: [
      { label: '@types/react',        url: 'https://www.npmjs.com/package/@types/react',  badge: 'tool' },
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript',    badge: 'code' },
    ],
    gotchas: [
      'forwardRef<RefType, PropsType> — RefType comes first. Swapping them silently assigns wrong types.',
      'Generic arrow functions in TSX need a trailing comma <T,> to avoid JSX-tag ambiguity.',
      'ComponentPropsWithoutRef<"button"> is equivalent to React.ButtonHTMLAttributes<HTMLButtonElement> — use either consistently.',
    ],
  },

  'react/testing': {
    apis: ['render()', 'screen.getByRole()', 'userEvent.setup()', 'renderHook()', 'act()', 'setupServer()'],
    related: [
      { label: 'React Forms',        route: '/react/forms'          },
      { label: 'Core Hooks',         route: '/react/hooks-core'     },
      { label: 'TypeScript & React', route: '/react/typescript'     },
    ],
    tip: 'getByRole is the default query — it tests accessible behaviour and doubles as an a11y audit. Only fall back to getByTestId when no role exists.',
    docs: [
      { label: 'RTL Docs',           url: 'https://testing-library.com/docs/react-testing-library/intro/' },
      { label: 'MSW Docs',           url: 'https://mswjs.io/docs/'                                        },
      { label: 'Vitest Docs',        url: 'https://vitest.dev/'                                           },
      { label: 'userEvent Docs',     url: 'https://testing-library.com/docs/user-event/intro'             },
    ],
    resources: [
      { label: 'testing-library/react',   url: 'https://github.com/testing-library/react-testing-library', badge: 'code' },
      { label: 'mswjs/msw',               url: 'https://github.com/mswjs/msw',                              badge: 'code' },
      { label: 'vitest-dev/vitest',        url: 'https://github.com/vitest-dev/vitest',                      badge: 'code' },
    ],
    gotchas: [
      'userEvent methods return Promises — always await them or assertions run on stale DOM.',
      'getBy throws on missing element (good for asserting presence); queryBy returns null (use for absence assertions).',
      'server.resetHandlers() in afterEach prevents per-test MSW overrides from bleeding into subsequent tests.',
    ],
  },

  'react/nextjs': {
    apis: ['"use client"', '"use server"', 'layout.tsx', 'loading.tsx', 'revalidatePath()', 'generateStaticParams()'],
    related: [
      { label: 'TanStack Query',    route: '/react/tanstack-query' },
      { label: 'React Patterns',    route: '/react/patterns'       },
      { label: 'React Performance', route: '/react/performance'    },
    ],
    tip: 'Start every component as a Server Component — only add "use client" when you need interactivity, hooks, or browser APIs.',
    docs: [
      { label: 'Next.js App Router Docs',    url: 'https://nextjs.org/docs/app'                            },
      { label: 'Server Components',          url: 'https://nextjs.org/docs/app/building-your-application/rendering/server-components' },
      { label: 'Server Actions',             url: 'https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations' },
      { label: 'Data Fetching',              url: 'https://nextjs.org/docs/app/building-your-application/data-fetching' },
    ],
    resources: [
      { label: 'vercel/next.js',   url: 'https://github.com/vercel/next.js',       badge: 'code' },
      { label: 'Next.js Blog',     url: 'https://nextjs.org/blog',                  badge: 'blog' },
    ],
    gotchas: [
      '"use client" propagates — all imports from a "use client" file are also client code.',
      'Cannot import a Server Component into a Client Component — pass it as children from a Server parent.',
      'useSearchParams() requires a Suspense boundary wrapper — omitting it causes a build warning.',
    ],
  },

  'react/native': {
    apis: ['<View>', '<Text>', '<FlatList>', 'StyleSheet.create()', 'useNavigation()', 'Platform.OS'],
    related: [
      { label: 'React Patterns',   route: '/react/patterns'    },
      { label: 'TypeScript & React', route: '/react/typescript' },
      { label: 'React Testing',    route: '/react/testing'     },
    ],
    tip: 'flexDirection defaults to "column" in React Native (opposite of CSS). All text must be inside <Text> — raw strings in <View> crash in production builds.',
    docs: [
      { label: 'React Native Docs',      url: 'https://reactnative.dev/docs/getting-started'                },
      { label: 'Expo Documentation',     url: 'https://docs.expo.dev/'                                      },
      { label: 'React Navigation Docs',  url: 'https://reactnavigation.org/docs/getting-started'            },
      { label: 'New Architecture',       url: 'https://reactnative.dev/docs/the-new-architecture/landing-page' },
    ],
    resources: [
      { label: 'facebook/react-native',        url: 'https://github.com/facebook/react-native',  badge: 'code' },
      { label: 'expo/expo',                    url: 'https://github.com/expo/expo',               badge: 'code' },
      { label: 'react-navigation/navigation',  url: 'https://github.com/react-navigation/react-navigation', badge: 'code' },
      { label: 'Expo Snack (playground)',      url: 'https://snack.expo.dev/',                   badge: 'tool' },
    ],
    gotchas: [
      'All text strings must be wrapped in <Text> — placing raw text in <View> crashes production builds.',
      'AsyncStorage is plain text on disk — always use expo-secure-store for tokens and passwords.',
      'FlatList needs keyExtractor returning a stable unique string — index keys cause incorrect reconciliation.',
    ],
  },

  'react/interview-prep': {
    apis: ['useState', 'useEffect', 'useReducer', 'React.memo', 'Suspense', 'Fiber', 'Server Components'],
    related: [
      { label: 'React Cheat Sheet',  route: '/react/cheatsheet'   },
      { label: 'React Patterns',     route: '/react/patterns'     },
      { label: 'React Performance',  route: '/react/performance'  },
    ],
    tip: 'Filter by topic to focus your prep session. For each question, form your own answer first — then expand to compare. Cover all 3 difficulty levels before an interview.',
    docs: [
      { label: 'React Docs',               url: 'https://react.dev/'                             },
      { label: 'React 19 Changelog',       url: 'https://react.dev/blog/2024/04/25/react-19'     },
      { label: 'Reconciliation & Fiber',   url: 'https://react.dev/learn/preserving-and-resetting-state' },
    ],
    resources: [
      { label: 'React Docs — Reference',  url: 'https://react.dev/reference/react',  badge: 'docs' },
    ],
    gotchas: [
      'Interviewers often ask follow-up: "how would you prove it?" — always mention DevTools Profiler.',
      'Virtual DOM ≠ Shadow DOM — they are completely different concepts; be precise.',
      'React.memo skips re-renders but adds a comparison cost — profile before adding it everywhere.',
    ],
  },

  'react/cheatsheet': {
    apis: ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useReducer'],
    related: [
      { label: 'Core Hooks',         route: '/react/hooks-core'     },
      { label: 'Advanced Hooks',     route: '/react/hooks-advanced' },
      { label: 'React Patterns',     route: '/react/patterns'       },
    ],
    tip: 'The cheat sheet is filterable by tab and tag. Use it to quickly cross-reference hooks, event types, or TypeScript patterns while coding.',
    docs: [
      { label: 'React API Reference',       url: 'https://react.dev/reference/react'     },
      { label: 'Hooks Reference',           url: 'https://react.dev/reference/react/hooks' },
      { label: 'React Router v6 API',       url: 'https://reactrouter.com/en/main/route/route' },
    ],
    resources: [
      { label: 'React Docs',         url: 'https://react.dev/',                    badge: 'docs' },
      { label: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/', badge: 'docs' },
    ],
    gotchas: [
      'useCallback and useMemo only help when consumers are memoised with React.memo or also use those hooks.',
      'Empty dep array [] runs once; omitting deps runs after every render.',
      'Number inputs always return strings — use valueAsNumber or coerce manually.',
    ],
  },

  'react/security': {
    apis: ['dangerouslySetInnerHTML', 'DOMPurify.sanitize()', 'SameSite=Strict', 'httpOnly', 'Content-Security-Policy'],
    related: [
      { label: 'Next.js App Router',  route: '/react/nextjs'    },
      { label: 'React Hook Form',     route: '/react/hook-form' },
      { label: 'Testing React',       route: '/react/testing'   },
    ],
    tip: 'React escapes JSX by default — {userInput} is always safe. The three common mistakes: dangerouslySetInnerHTML without DOMPurify, tokens in localStorage, and open redirects from query params.',
    docs: [
      { label: 'React Security Docs',       url: 'https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html' },
      { label: 'OWASP Top 10',              url: 'https://owasp.org/www-project-top-ten/'                                                      },
      { label: 'MDN CSP Guide',             url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP'                                       },
      { label: 'Next.js Security Headers',  url: 'https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy'    },
    ],
    resources: [
      { label: 'cure53/DOMPurify',  url: 'https://github.com/cure53/DOMPurify',  badge: 'code' },
      { label: 'OWASP XSS Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html', badge: 'docs' },
    ],
    gotchas: [
      'dangerouslySetInnerHTML with unsanitized HTML = XSS. Always DOMPurify.sanitize() first.',
      'localStorage tokens are readable by XSS. Use httpOnly; SameSite=Strict cookies instead.',
      'rel="noopener noreferrer" is required on every target="_blank" link to prevent tab-napping.',
    ],
  },

  'react/animations': {
    apis: ['motion.div', 'animate', 'variants', '<AnimatePresence>', 'layout', 'layoutId', 'useMotionValue()'],
    related: [
      { label: 'React Performance',  route: '/react/performance'   },
      { label: 'React Patterns',     route: '/react/patterns'      },
      { label: 'React Native',       route: '/react/native'        },
    ],
    tip: 'Animate transform and opacity — not layout properties (width, height, margin). Transform/opacity run on the GPU compositor at 60fps. Layout properties trigger recalculation on every frame.',
    docs: [
      { label: 'Framer Motion Docs',       url: 'https://www.framer.com/motion/'                           },
      { label: 'Animation Guide',          url: 'https://www.framer.com/motion/animation/'                  },
      { label: 'Gestures',                 url: 'https://www.framer.com/motion/gestures/'                   },
      { label: 'Layout Animations',        url: 'https://www.framer.com/motion/layout-animations/'          },
    ],
    resources: [
      { label: 'framer/motion',             url: 'https://github.com/framer/motion',        badge: 'code' },
      { label: 'Framer Motion Examples',    url: 'https://www.framer.com/motion/examples/',  badge: 'blog' },
    ],
    gotchas: [
      'exit prop requires AnimatePresence parent — without it, components are removed from DOM instantly.',
      'AnimatePresence list children need unique stable keys — not array index.',
      'initial={false} on motion.div or AnimatePresence prevents flash-of-invisible-content in SSR apps.',
    ],
  },

  'react/hook-form': {
    apis: ['useForm()', 'register()', 'handleSubmit()', '<Controller>', 'useFieldArray()', 'zodResolver()'],
    related: [
      { label: 'Forms & Validation',  route: '/react/forms'            },
      { label: 'TypeScript & React',  route: '/react/typescript'       },
      { label: 'Testing React',       route: '/react/testing'          },
    ],
    tip: 'register() uses refs — no re-renders while typing. Only add watch() when you need to display a live computed value. For one-shot reads, use getValues() inside event handlers.',
    docs: [
      { label: 'React Hook Form Docs',  url: 'https://react-hook-form.com/get-started'    },
      { label: 'API Reference',         url: 'https://react-hook-form.com/docs/useform'   },
      { label: 'Zod Documentation',     url: 'https://zod.dev'                             },
      { label: '@hookform/resolvers',   url: 'https://github.com/react-hook-form/resolvers' },
    ],
    resources: [
      { label: 'react-hook-form/react-hook-form', url: 'https://github.com/react-hook-form/react-hook-form', badge: 'code' },
      { label: 'colinhacks/zod',                  url: 'https://github.com/colinhacks/zod',                  badge: 'code' },
    ],
    gotchas: [
      'Add noValidate to <form> — without it, browser native validation fires before RHF and shows unstyled popups.',
      'Number inputs return strings — add { valueAsNumber: true } to register() or use z.coerce.number() in Zod.',
      'In useFieldArray, use field.id as the React key — never the array index.',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // ASP.NET CORE PAGES
  // ════════════════════════════════════════════════════════════════════════════

  'aspnet/hosting-startup': {
    apis: ['WebApplication.CreateBuilder()', 'IWebHostEnvironment', 'IHostApplicationLifetime', 'ConfigureServices', 'WebApplicationBuilder'],
    related: [
      { label: 'Middleware Pipeline',  route: '/aspnet/middleware' },
      { label: 'Configuration',        route: '/aspnet/configuration' },
      { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
    ],
    tip: 'Use IHostApplicationLifetime for graceful shutdown — the Stopping event lets you drain in-flight requests before the process exits.',
    docs: [
      { label: 'WebApplication & Minimal Hosting', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/webapplication' },
      { label: 'Host and Deploy',                  url: 'https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    ],
    gotchas: [
      'All AddX() calls must come before builder.Build() — services registered after Build() are not in the container.',
      'ASPNETCORE_ENVIRONMENT defaults to "Production" when unset — never rely on dev behaviour unless you set it explicitly.',
    ],
  },

  'aspnet/middleware': {
    apis: ['IMiddleware', 'RequestDelegate', 'Use()', 'Run()', 'Map()', 'IApplicationBuilder'],
    related: [
      { label: 'Hosting & Startup', route: '/aspnet/hosting-startup' },
      { label: 'Routing',           route: '/aspnet/routing' },
      { label: 'Error Handling',    route: '/aspnet/error-handling' },
    ],
    tip: 'Prefer middleware classes over inline delegates for anything you reuse — they are DI-friendly and independently testable.',
    docs: [
      { label: 'Middleware Overview',     url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/' },
      { label: 'Write Custom Middleware', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/write' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    ],
    gotchas: [
      'Middleware runs in registration order — reversing UseAuthentication and UseAuthorization silently breaks auth.',
      'app.Run() is terminal — no middleware registered after it will ever execute.',
    ],
  },

  'aspnet/routing': {
    apis: ['MapGet()', 'MapControllers()', '[Route]', 'IRouteConstraint', 'LinkGenerator'],
    related: [
      { label: 'Controllers & Actions', route: '/aspnet/controllers' },
      { label: 'Minimal APIs',          route: '/aspnet/minimal-apis' },
      { label: 'Middleware Pipeline',   route: '/aspnet/middleware' },
    ],
    tip: 'Use route constraints (:int, :guid, :alpha, :length) to reject bad values at routing — before model binding runs.',
    docs: [
      { label: 'Routing in ASP.NET Core', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/routing' },
      { label: 'Route Constraints',       url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/routing#route-constraints' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    ],
    gotchas: [
      'Conflicting routes throw AmbiguousMatchException at runtime — more specific templates do NOT automatically win.',
      'Route templates are case-insensitive but URL generation preserves the case of supplied route values.',
    ],
  },

  'aspnet/configuration': {
    apis: ['IConfiguration', 'IOptions<T>', 'IOptionsSnapshot<T>', 'IOptionsMonitor<T>', 'ValidateOnStart()'],
    related: [
      { label: 'Hosting & Startup',    route: '/aspnet/hosting-startup' },
      { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
      { label: 'Logging & Diagnostics',route: '/aspnet/logging' },
    ],
    tip: 'Always use typed options over IConfiguration["key"] — you get compile-time safety, validation support, and change notifications.',
    docs: [
      { label: 'Configuration in .NET', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/' },
      { label: 'Options Pattern',        url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/options' },
      { label: 'Safe storage of secrets',url: 'https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop',   badge: 'code' },
    ],
    gotchas: [
      'IOptions<T> is a singleton — it does not see config changes after startup. Use IOptionsSnapshot<T> for per-request fresh values.',
      'User secrets are unencrypted on disk — they just stay out of source control. Use Key Vault in production.',
    ],
  },

  'aspnet/dependency-injection': {
    apis: ['AddSingleton()', 'AddScoped()', 'AddTransient()', 'IServiceProvider', 'ActivatorUtilities'],
    related: [
      { label: 'Hosting & Startup',  route: '/aspnet/hosting-startup' },
      { label: 'Middleware Pipeline',route: '/aspnet/middleware' },
      { label: 'Configuration',      route: '/aspnet/configuration' },
    ],
    tip: 'Default to scoped for services that touch EF Core or HTTP — this matches request lifetime and avoids thread-safety bugs.',
    docs: [
      { label: 'DI in ASP.NET Core', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection' },
      { label: 'Service lifetimes',  url: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection#service-lifetimes' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop',   badge: 'code' },
    ],
    gotchas: [
      'Injecting a Scoped service into a Singleton creates a captive dependency — the scoped service lives as long as the singleton.',
      'IServiceProvider.GetService<T>() returns null for unregistered types — use GetRequiredService<T>() to throw instead.',
    ],
  },

  'aspnet/logging': {
    apis: ['ILogger<T>', 'ILoggerFactory', 'LogLevel', '[LoggerMessage]', 'BeginScope()'],
    related: [
      { label: 'Hosting & Startup', route: '/aspnet/hosting-startup' },
      { label: 'Configuration',     route: '/aspnet/configuration' },
      { label: 'Error Handling',    route: '/aspnet/error-handling' },
    ],
    tip: 'Use the [LoggerMessage] source generator or LoggerMessage.Define() for high-frequency log calls — avoids boxing and string allocations.',
    docs: [
      { label: 'Logging in .NET',          url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/logging/' },
      { label: 'High-performance logging', url: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/high-performance-logging' },
    ],
    resources: [
      { label: 'Serilog',           url: 'https://serilog.net',                      badge: 'tool' },
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore',    badge: 'code' },
    ],
    gotchas: [
      'String interpolation in log messages defeats structured logging — use message templates: Log.Information("User {Id}", userId).',
      'The console provider is synchronous by default — in high-throughput scenarios it can become a bottleneck.',
    ],
  },

  'aspnet/static-files': {
    apis: ['UseStaticFiles()', 'StaticFileOptions', 'IFormFile', 'IWebHostEnvironment', 'FileStreamResult'],
    related: [
      { label: 'Middleware Pipeline',  route: '/aspnet/middleware' },
      { label: 'Routing',             route: '/aspnet/routing' },
      { label: 'Controllers & Actions',route: '/aspnet/controllers' },
    ],
    tip: 'Stream large file uploads via Request.Body directly — IFormFile buffers to disk/memory and is unsuitable for files over ~50 MB.',
    docs: [
      { label: 'Static Files',  url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/static-files' },
      { label: 'Upload files',  url: 'https://learn.microsoft.com/en-us/aspnet/core/mvc/models/file-uploads' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    ],
    gotchas: [
      'UseStaticFiles() must be called before UseRouting() — otherwise the router claims the path first.',
      'IFormFile.FileName is untrusted user input — never use it as a filesystem path without sanitization.',
    ],
  },

  'aspnet/controllers': {
    apis: ['ControllerBase', '[ApiController]', 'ActionResult<T>', 'IActionResult', '[Route]', 'Problem()'],
    related: [
      { label: 'Minimal APIs',             route: '/aspnet/minimal-apis' },
      { label: 'Model Binding & Validation',route: '/aspnet/model-binding' },
      { label: 'Filters & Endpoint Filters',route: '/aspnet/filters' },
    ],
    tip: 'Prefer ActionResult<T> over IActionResult — the compiler and OpenAPI generators infer the response shape without [ProducesResponseType] attributes.',
    docs: [
      { label: 'Controller actions',           url: 'https://learn.microsoft.com/en-us/aspnet/core/mvc/controllers/actions' },
      { label: 'Routing to controller actions',url: 'https://learn.microsoft.com/en-us/aspnet/core/mvc/controllers/routing' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop',   badge: 'code' },
    ],
    gotchas: [
      '[ApiController] changes binding defaults (complex types from body) — remove it if you need explicit [FromQuery] on complex parameters.',
      'Ok(null) returns 200 with a null body, not 204 — use NoContent() explicitly for empty success responses.',
    ],
  },

  'aspnet/minimal-apis': {
    apis: ['app.MapGet()', 'TypedResults', 'Results<T1,T2>', 'IEndpointFilter', 'RouteGroupBuilder'],
    related: [
      { label: 'Controllers & Actions',     route: '/aspnet/controllers' },
      { label: 'Model Binding & Validation',route: '/aspnet/model-binding' },
      { label: 'Filters & Endpoint Filters',route: '/aspnet/filters' },
    ],
    tip: 'Use TypedResults over Results — the compiler enforces all code paths return a declared type, and OpenAPI generators see the response schema.',
    docs: [
      { label: 'Minimal APIs overview',       url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/overview' },
      { label: 'Minimal APIs quick reference',url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop',   badge: 'code' },
    ],
    gotchas: [
      'DataAnnotations on DTOs are NOT validated automatically — add an IEndpointFilter or use .NET 9 AddValidation().',
      'Lambda handlers prevent Native AOT — use static method groups or named delegates for AOT-compatible apps.',
    ],
  },

  'aspnet/model-binding': {
    apis: ['[FromBody]', '[FromQuery]', '[FromRoute]', '[FromHeader]', '[AsParameters]', 'IParsable<T>'],
    related: [
      { label: 'Controllers & Actions',      route: '/aspnet/controllers' },
      { label: 'Minimal APIs',               route: '/aspnet/minimal-apis' },
      { label: 'Filters & Endpoint Filters', route: '/aspnet/filters' },
    ],
    tip: 'Implement IParsable<T> on custom value types for automatic query/route binding in .NET 7+ — no custom IModelBinder needed.',
    docs: [
      { label: 'Model Binding',  url: 'https://learn.microsoft.com/en-us/aspnet/core/mvc/models/model-binding' },
      { label: 'Model Validation',url: 'https://learn.microsoft.com/en-us/aspnet/core/mvc/models/validation' },
      { label: 'FluentValidation',url: 'https://docs.fluentvalidation.net/en/latest/aspnet.html' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore',  url: 'https://github.com/dotnet/aspnetcore',             badge: 'code' },
      { label: 'FluentValidation',   url: 'https://github.com/FluentValidation/FluentValidation', badge: 'code' },
    ],
    gotchas: [
      'The request body is a non-seekable stream — only one [FromBody] parameter per action is allowed.',
      '[ApiController] auto-400 runs before your action — override via ApiBehaviorOptions.InvalidModelStateResponseFactory.',
    ],
  },

  'aspnet/filters': {
    apis: ['IActionFilter', 'IAsyncActionFilter', 'IExceptionFilter', 'IEndpointFilter', 'ServiceFilterAttribute'],
    related: [
      { label: 'Controllers & Actions', route: '/aspnet/controllers' },
      { label: 'Minimal APIs',          route: '/aspnet/minimal-apis' },
      { label: 'Error Handling',        route: '/aspnet/error-handling' },
    ],
    tip: 'Use IExceptionHandler middleware (.NET 8+) for app-wide exception mapping. Reserve exception filters for controller-specific handling.',
    docs: [
      { label: 'Filters in ASP.NET Core', url: 'https://learn.microsoft.com/en-us/aspnet/core/mvc/controllers/filters' },
      { label: 'Endpoint filters',        url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/min-api-filters' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop',   badge: 'code' },
    ],
    gotchas: [
      'Exception filters only catch exceptions from actions and MVC filters — NOT from middleware. Use UseExceptionHandler() for full coverage.',
      '[ServiceFilter] filters must be registered in DI — forgetting causes InvalidOperationException at runtime.',
    ],
  },

  'aspnet/error-handling': {
    apis: ['UseExceptionHandler()', 'IExceptionHandler', 'ProblemDetails', 'AddProblemDetails()', 'IProblemDetailsService'],
    related: [
      { label: 'Middleware Pipeline',  route: '/aspnet/middleware' },
      { label: 'Filters & Endpoint Filters', route: '/aspnet/filters' },
      { label: 'Logging & Diagnostics',route: '/aspnet/logging' },
    ],
    tip: 'Call AddProblemDetails() before builder.Build() — this makes UseExceptionHandler() automatically format all 500s as RFC 9457 JSON.',
    docs: [
      { label: 'Error handling',    url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/error-handling' },
      { label: 'Problem details',   url: 'https://learn.microsoft.com/en-us/aspnet/core/web-api/handle-errors#problem-details-service' },
      { label: 'RFC 9457',          url: 'https://www.rfc-editor.org/rfc/rfc9457' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop',   badge: 'code' },
    ],
    gotchas: [
      'UseExceptionHandler() must be the FIRST middleware — exceptions from any later middleware are caught. Register it before UseHttpsRedirection.',
      'UseDeveloperExceptionPage() exposes the full stack trace — never use it in production. Guard strictly with IsDevelopment().',
    ],
  },

  'aspnet/openapi-swagger': {
    apis: ['AddOpenApi()', 'MapOpenApi()', '.WithSummary()', '.WithDescription()', 'TypedResults', 'IOpenApiOperationTransformer'],
    related: [
      { label: 'Controllers & Actions', route: '/aspnet/controllers' },
      { label: 'Minimal APIs',          route: '/aspnet/minimal-apis' },
      { label: 'API Versioning',        route: '/aspnet/api-versioning' },
    ],
    tip: 'Use TypedResults (not IResult) in minimal APIs — the built-in OpenAPI generator reads the return type at build time to populate response schemas automatically.',
    docs: [
      { label: 'OpenAPI in ASP.NET Core (.NET 9)', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/overview' },
      { label: 'Swashbuckle getting started',      url: 'https://github.com/domaindrivendev/Swashbuckle.AspNetCore' },
      { label: 'NSwag documentation',             url: 'https://github.com/RicoSuter/NSwag' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore',  url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
      { label: 'scalar/scalar',      url: 'https://github.com/scalar/scalar',     badge: 'code' },
    ],
    gotchas: [
      'Built-in AddOpenApi() (≥ .NET 9) and Swashbuckle are separate packages — do not install both unless intentional; they generate competing /openapi/*.json endpoints.',
      'Controller XML doc comments require <GenerateDocumentationFile>true</GenerateDocumentationFile> in the .csproj and IncludeXmlComments() in the Swashbuckle config.',
    ],
  },

  'aspnet/api-versioning': {
    apis: ['AddApiVersioning()', '[ApiVersion]', '[MapToApiVersion]', '[Deprecated]', 'ApiVersioningOptions', 'ReportApiVersions'],
    related: [
      { label: 'Controllers & Actions', route: '/aspnet/controllers' },
      { label: 'Minimal APIs',          route: '/aspnet/minimal-apis' },
      { label: 'OpenAPI & Swagger',     route: '/aspnet/openapi-swagger' },
    ],
    tip: 'URL-segment versioning (/v1/products) is the most discoverable strategy — clients can see the version in logs, network traces, and browser URLs without reading docs.',
    docs: [
      { label: 'Asp.Versioning NuGet',         url: 'https://www.nuget.org/packages/Asp.Versioning.Mvc' },
      { label: 'API versioning wiki',          url: 'https://github.com/dotnet/aspnet-api-versioning/wiki' },
      { label: 'Versioning with minimal APIs', url: 'https://github.com/dotnet/aspnet-api-versioning/wiki/Minimal-APIs' },
    ],
    resources: [
      { label: 'dotnet/aspnet-api-versioning', url: 'https://github.com/dotnet/aspnet-api-versioning', badge: 'code' },
      { label: 'dotnet/aspnetcore',            url: 'https://github.com/dotnet/aspnetcore',            badge: 'code' },
    ],
    gotchas: [
      'Mark old versions [Deprecated] for at least one release cycle before removal — clients need time to migrate. Deprecated versions still respond; sunset date goes in headers.',
      'Route prefix (/v{version:apiVersion}/) must match all versioned groups exactly — a mismatch returns 404, not a 400 Bad ApiVersion.',
    ],
  },

  'aspnet/http-clients': {
    apis: ['IHttpClientFactory', 'AddHttpClient<T>()', 'AddStandardResilienceHandler()', 'DelegatingHandler', 'ResiliencePipeline', 'HttpClientHandler'],
    related: [
      { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
      { label: 'gRPC Services',        route: '/aspnet/grpc' },
      { label: 'Configuration',        route: '/aspnet/configuration' },
    ],
    tip: 'Pair each typed client with exactly one downstream API — the client class owns base address, headers, serialization, and error handling so callers see a clean domain method.',
    docs: [
      { label: 'IHttpClientFactory in .NET',      url: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/httpclient-factory' },
      { label: 'Resilience in .NET',              url: 'https://learn.microsoft.com/en-us/dotnet/core/resilience/' },
      { label: 'Make HTTP requests with HttpClient', url: 'https://learn.microsoft.com/en-us/dotnet/fundamentals/networking/http/httpclient' },
    ],
    resources: [
      { label: 'dotnet/extensions',  url: 'https://github.com/dotnet/extensions', badge: 'code' },
      { label: 'App-vNext/Polly',    url: 'https://github.com/App-vNext/Polly',   badge: 'code' },
    ],
    gotchas: [
      'Never inject a typed client (Transient) into a Singleton service — the handler pool is fine, but any per-request state on the typed client will be shared. Use IServiceScopeFactory for background services.',
      'HttpClient.BaseAddress must end with "/" — relative paths without a trailing slash on the base are silently dropped, resulting in 404s.',
    ],
  },

  'aspnet/grpc': {
    apis: ['MapGrpcService<T>()', 'ServerCallContext', 'IServerStreamWriter<T>', 'IAsyncStreamReader<T>', 'RpcException', 'GrpcChannel'],
    related: [
      { label: 'HttpClient & Resilience', route: '/aspnet/http-clients' },
      { label: 'Dependency Injection',    route: '/aspnet/dependency-injection' },
      { label: 'Error Handling',          route: '/aspnet/error-handling' },
    ],
    tip: 'Always pass ServerCallContext.CancellationToken to every async call — gRPC cancels the token when the client deadline expires or disconnects, so unchecked tokens waste server resources.',
    docs: [
      { label: 'gRPC for .NET overview', url: 'https://learn.microsoft.com/en-us/aspnet/core/grpc/' },
      { label: 'gRPC services with C#',  url: 'https://learn.microsoft.com/en-us/aspnet/core/grpc/basics' },
      { label: 'gRPC-Web in ASP.NET',   url: 'https://learn.microsoft.com/en-us/aspnet/core/grpc/grpcweb' },
    ],
    resources: [
      { label: 'grpc/grpc-dotnet', url: 'https://github.com/grpc/grpc-dotnet', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop',  badge: 'code' },
    ],
    gotchas: [
      'Never reuse or change Protobuf field numbers — they are the binary wire identity. Removed fields must be marked reserved to prevent accidental reuse in future schema versions.',
      'gRPC requires HTTP/2. If hosting behind a reverse proxy (nginx, IIS), ensure HTTP/2 pass-through is configured — HTTP/1.1 proxies silently break the connection.',
    ],
  },

  'aspnet/ef-core-basics': {
    apis: ['DbContext', 'DbSet<T>', 'SaveChangesAsync()', 'FindAsync()', 'AsNoTracking()', 'OnModelCreating()'],
    related: [
      { label: 'EF Relationships',  route: '/aspnet/ef-relationships' },
      { label: 'EF Performance',    route: '/aspnet/ef-performance' },
      { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
    ],
    tip: 'Always call async EF Core methods (ToListAsync, SaveChangesAsync) and pass the CancellationToken — this lets ASP.NET Core cancel the DB query when the client disconnects.',
    docs: [
      { label: 'EF Core overview',       url: 'https://learn.microsoft.com/en-us/ef/core/' },
      { label: 'Getting started',        url: 'https://learn.microsoft.com/en-us/ef/core/get-started/overview/first-app' },
      { label: 'Migrations overview',    url: 'https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/' },
    ],
    resources: [
      { label: 'dotnet/efcore', url: 'https://github.com/dotnet/efcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop', badge: 'code' },
    ],
    gotchas: [
      'Never register DbContext as Singleton — it is not thread-safe and tracks entity state per instance. Use Scoped (default) or AddDbContextPool for high throughput.',
      'Running Database.MigrateAsync() at startup can cause table locks on large tables in production. Use dotnet ef migrations script --idempotent and run migrations out-of-band.',
    ],
  },

  'aspnet/ef-relationships': {
    apis: ['HasMany()', 'HasOne()', 'WithMany()', 'WithOne()', 'Include()', 'ThenInclude()', 'OwnsOne()', 'OnDelete()'],
    related: [
      { label: 'EF Core Basics',    route: '/aspnet/ef-core-basics' },
      { label: 'EF Performance',    route: '/aspnet/ef-performance' },
    ],
    tip: 'Always initialize collection navigations to an empty list: public List<T> Items { get; set; } = []. Un-initialized collections throw NullReferenceException when accessed before Include() loads them.',
    docs: [
      { label: 'Relationships',          url: 'https://learn.microsoft.com/en-us/ef/core/modeling/relationships' },
      { label: 'Loading related data',   url: 'https://learn.microsoft.com/en-us/ef/core/querying/related-data/' },
      { label: 'Owned entity types',     url: 'https://learn.microsoft.com/en-us/ef/core/modeling/owned-entities' },
    ],
    resources: [
      { label: 'dotnet/efcore', url: 'https://github.com/dotnet/efcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop', badge: 'code' },
    ],
    gotchas: [
      'context.Update(entity) marks ALL properties Modified — it overwrites every column including ones you did not change. Load-then-mutate is safer for partial updates.',
      'Cascade delete is the default for required relationships — deleting a parent silently deletes all children. Set OnDelete(DeleteBehavior.Restrict) explicitly for important data.',
    ],
  },

  'aspnet/ef-performance': {
    apis: ['AsNoTracking()', 'AsSplitQuery()', 'EF.CompileQuery()', 'ExecuteDeleteAsync()', 'ExecuteUpdateAsync()', 'FromSqlRaw()'],
    related: [
      { label: 'EF Core Basics',    route: '/aspnet/ef-core-basics' },
      { label: 'EF Relationships',  route: '/aspnet/ef-relationships' },
      { label: 'Caching',           route: '/aspnet/caching' },
    ],
    tip: 'Use Select() to project only the columns you need — EF Core generates SELECT col1, col2 instead of SELECT *. This reduces network I/O, memory, and deserialization cost in one change.',
    docs: [
      { label: 'Performance overview',   url: 'https://learn.microsoft.com/en-us/ef/core/performance/' },
      { label: 'Bulk operations',        url: 'https://learn.microsoft.com/en-us/ef/core/saving/execute-insert-update-delete' },
      { label: 'Compiled queries',       url: 'https://learn.microsoft.com/en-us/ef/core/performance/advanced-performance-topics#compiled-queries' },
    ],
    resources: [
      { label: 'dotnet/efcore', url: 'https://github.com/dotnet/efcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop', badge: 'code' },
    ],
    gotchas: [
      'ExecuteDeleteAsync/ExecuteUpdateAsync bypass the change tracker — entity events, interceptors, and audit hooks tied to SaveChanges do NOT fire. Handle side-effects manually.',
      'FromSqlRaw() with user input without parameterisation is a SQL injection vulnerability. Always use FromSqlInterpolated() or explicit SqlParameter objects.',
    ],
  },

  'aspnet/caching': {
    apis: ['IMemoryCache', 'GetOrCreateAsync()', 'IDistributedCache', 'AddOutputCache()', 'IOutputCacheStore', 'EvictByTagAsync()'],
    related: [
      { label: 'EF Performance',        route: '/aspnet/ef-performance' },
      { label: 'Configuration & Options', route: '/aspnet/configuration' },
      { label: 'Dependency Injection',  route: '/aspnet/dependency-injection' },
    ],
    tip: 'Use GetOrCreateAsync() rather than a get-then-set pattern — it prevents cache stampede by serializing factory execution for the same key under concurrent cache misses.',
    docs: [
      { label: 'Caching in .NET',             url: 'https://learn.microsoft.com/en-us/aspnet/core/performance/caching/overview' },
      { label: 'Output caching middleware',    url: 'https://learn.microsoft.com/en-us/aspnet/core/performance/caching/output' },
      { label: 'Distributed caching',         url: 'https://learn.microsoft.com/en-us/aspnet/core/performance/caching/distributed' },
    ],
    resources: [
      { label: 'StackExchange.Redis', url: 'https://github.com/StackExchange/StackExchange.Redis', badge: 'code' },
      { label: 'dotnet/aspnetcore',   url: 'https://github.com/dotnet/aspnetcore',                 badge: 'code' },
    ],
    gotchas: [
      'IMemoryCache is per-process — in a multi-server deployment each pod has its own cache, so a write on server A is invisible to server B until TTL expires. Use IDistributedCache (Redis) for shared state.',
      'Never cache user-specific data without including the user ID in the cache key — omitting it means one user sees another user\'s data.',
    ],
  },

  // ── ASP.NET Security ────────────────────────────────────────────────────────
  'aspnet/authentication': {
    apis: ['AddAuthentication()', 'AddJwtBearer()', 'AddCookie()', 'UseAuthentication()', 'UseAuthorization()', 'ClaimsPrincipal', 'AddIdentity<T>()', 'AddOpenIdConnect()'],
    related: [
      { label: 'Authorization',         route: '/aspnet/authorization' },
      { label: 'Secrets & Data Prot.',  route: '/aspnet/secrets' },
      { label: 'Web Security',          route: '/aspnet/web-security' },
    ],
    tip: 'Always call UseAuthentication() before UseAuthorization() in middleware order — swapping them means authorization runs without a populated HttpContext.User.',
    docs: [
      { label: 'Authentication overview', url: 'https://learn.microsoft.com/en-us/aspnet/core/security/authentication/' },
      { label: 'JWT bearer auth',         url: 'https://learn.microsoft.com/en-us/aspnet/core/security/authentication/jwt-authn' },
      { label: 'ASP.NET Core Identity',   url: 'https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop', badge: 'code' },
    ],
    gotchas: [
      'JWT tokens cannot be revoked before expiry unless you maintain a token blocklist. Keep access token lifetimes short (5–15 min) and use refresh tokens for long sessions.',
      'Cookie auth SameSite=Strict blocks the cookie on cross-origin navigations including OAuth redirects. Use SameSite=Lax for OIDC callback flows.',
    ],
  },

  'aspnet/authorization': {
    apis: ['[Authorize]', '[AllowAnonymous]', 'AddAuthorization()', 'RequireAuthenticatedUser()', 'RequireRole()', 'RequireClaim()', 'IAuthorizationRequirement', 'IAuthorizationService'],
    related: [
      { label: 'Authentication',    route: '/aspnet/authentication' },
      { label: 'Web Security',      route: '/aspnet/web-security' },
      { label: 'Secrets & Data Prot.', route: '/aspnet/secrets' },
    ],
    tip: 'Prefer policy-based authorization over role checks — policies are testable, composable, and decouple claim names from business rules.',
    docs: [
      { label: 'Authorization overview',     url: 'https://learn.microsoft.com/en-us/aspnet/core/security/authorization/introduction' },
      { label: 'Policy-based authorization', url: 'https://learn.microsoft.com/en-us/aspnet/core/security/authorization/policies' },
      { label: 'Resource-based auth',        url: 'https://learn.microsoft.com/en-us/aspnet/core/security/authorization/resourcebased' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    ],
    gotchas: [
      'IAuthorizationHandler is registered as a service — inject your handler in AddScoped/AddTransient, not AddSingleton, if it needs per-request state.',
      'FallbackPolicy applies to ALL endpoints. If you have public health-check endpoints, mark them with [AllowAnonymous] or MapHealthChecks().AllowAnonymous() explicitly.',
    ],
  },

  'aspnet/cors': {
    apis: ['AddCors()', 'UseCors()', 'WithOrigins()', 'AllowAnyOrigin()', 'AllowCredentials()', 'UseHsts()', 'UseHttpsRedirection()', 'RequireCors()'],
    related: [
      { label: 'Authentication',       route: '/aspnet/authentication' },
      { label: 'Web Security',         route: '/aspnet/web-security' },
      { label: 'Middleware',           route: '/aspnet/middleware' },
    ],
    tip: 'AllowAnyOrigin() and AllowCredentials() cannot be combined — the browser blocks credentialed cross-origin requests to wildcard origins. Use WithOrigins() with specific domains.',
    docs: [
      { label: 'Enable CORS in ASP.NET', url: 'https://learn.microsoft.com/en-us/aspnet/core/security/cors' },
      { label: 'HTTPS & HSTS',           url: 'https://learn.microsoft.com/en-us/aspnet/core/security/enforcing-ssl' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    ],
    gotchas: [
      'CORS is a browser security feature — server-to-server calls are not restricted by CORS. A malicious server can still call your API without a browser.',
      'UseCors() must come after UseRouting() but before UseAuthentication() and UseAuthorization() to apply correctly.',
    ],
  },

  'aspnet/rate-limiting': {
    apis: ['AddRateLimiter()', 'UseRateLimiter()', 'AddFixedWindowLimiter()', 'AddSlidingWindowLimiter()', 'AddTokenBucketLimiter()', 'AddConcurrencyLimiter()', 'RequireRateLimiting()', 'OnRejected'],
    related: [
      { label: 'Authentication',    route: '/aspnet/authentication' },
      { label: 'Web Security',      route: '/aspnet/web-security' },
      { label: 'Middleware',        route: '/aspnet/middleware' },
    ],
    tip: 'Partition limiters by user ID or API key rather than globally — a global limit lets one heavy user exhaust the quota for everyone else.',
    docs: [
      { label: 'Rate limiting middleware', url: 'https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit' },
      { label: 'System.Threading.RateLimiting', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.threading.ratelimiting' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    ],
    gotchas: [
      'Rate limiting state is in-memory and per-process. In a multi-replica deployment each pod has independent counters — use a distributed store (Redis) for global limits.',
      'OnRejected fires synchronously on the limiter thread. Keep it lightweight — just set StatusCode 429 and write a short response; avoid slow I/O there.',
    ],
  },

  'aspnet/web-security': {
    apis: ['FromSqlInterpolated()', 'HtmlEncoder.Encode()', 'AddAntiforgery()', '[ValidateAntiForgeryToken]', 'IAntiforgery', 'LocalRedirect()', 'Content-Security-Policy', 'Path.GetFullPath()'],
    related: [
      { label: 'Authentication',    route: '/aspnet/authentication' },
      { label: 'Authorization',     route: '/aspnet/authorization' },
      { label: 'CORS & Security Headers', route: '/aspnet/cors' },
    ],
    tip: 'The single highest-value habit: never build SQL strings by concatenation. EF Core parameterises LINQ queries automatically; use FromSqlInterpolated() for raw SQL to keep the same safety guarantee.',
    docs: [
      { label: 'Prevent XSS in ASP.NET',   url: 'https://learn.microsoft.com/en-us/aspnet/core/security/cross-site-scripting' },
      { label: 'Antiforgery in ASP.NET',    url: 'https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery' },
      { label: 'OWASP Top 10',              url: 'https://owasp.org/www-project-top-ten/' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    ],
    gotchas: [
      'Razor pages auto-generate antiforgery tokens. Minimal API endpoints do NOT — call ValidateAntiforgeryToken() explicitly or use the IAntiforgery service middleware.',
      'Path.Combine(root, userInput) does NOT prevent traversal if userInput starts with / or \\ — it just replaces root. Always call Path.GetFullPath and verify the result starts with root.',
    ],
  },

  'aspnet/secrets': {
    apis: ['dotnet user-secrets', 'AddUserSecrets<T>()', 'AddEnvironmentVariables()', 'AddAzureKeyVault()', 'IDataProtector', 'AddDataProtection()', 'PersistKeysToStackExchangeRedis()', 'ProtectCookies()'],
    related: [
      { label: 'Authentication',       route: '/aspnet/authentication' },
      { label: 'Configuration',        route: '/aspnet/configuration' },
      { label: 'Web Security',         route: '/aspnet/web-security' },
    ],
    tip: 'Use `__` (double underscore) as the hierarchy separator in environment variable names — it maps to `:` in configuration keys across all platforms including Linux containers.',
    docs: [
      { label: 'Safe storage of app secrets', url: 'https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets' },
      { label: 'Azure Key Vault provider',     url: 'https://learn.microsoft.com/en-us/aspnet/core/security/key-vault-configuration' },
      { label: 'Data Protection API',          url: 'https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/introduction' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore',   url: 'https://github.com/dotnet/aspnetcore',   badge: 'code' },
      { label: 'Azure/azure-sdk-for-net', url: 'https://github.com/Azure/azure-sdk-for-net', badge: 'code' },
    ],
    gotchas: [
      'Data Protection keys are ephemeral by default — on restart all protected data (cookies, tokens, antiforgery) becomes invalid. Always configure persistent key storage in production.',
      'User secrets are tied to the project by UserSecretsId in the .csproj. Changing that GUID silently breaks secret lookups without any error at startup.',
    ],
  },

  // ── ASP.NET Quality ─────────────────────────────────────────────────────────
  'aspnet/testing': {
    apis: ['WebApplicationFactory<T>', 'CreateClient()', '[Fact]', '[Theory]', 'Substitute.For<T>()', 'ConfigureTestServices()', 'UseInMemoryDatabase()', 'UseSqlite(":memory:")'],
    related: [
      { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
      { label: 'EF Core Basics',       route: '/aspnet/ef-core-basics' },
      { label: 'Authentication',       route: '/aspnet/authentication' },
    ],
    tip: 'Use IClassFixture<WebApplicationFactory<T>> to share the in-memory server across all tests in a class — starting it once per class is much faster than once per test method.',
    docs: [
      { label: 'Integration tests in ASP.NET', url: 'https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests' },
      { label: 'Unit testing in .NET',         url: 'https://learn.microsoft.com/en-us/dotnet/core/testing/' },
    ],
    resources: [
      { label: 'xunit/xunit',        url: 'https://github.com/xunit/xunit',        badge: 'code' },
      { label: 'nsubstitute/NSubstitute', url: 'https://github.com/nsubstitute/NSubstitute', badge: 'code' },
    ],
    gotchas: [
      'SQLite :memory: databases are connection-scoped — close the connection and the data is gone. Keep SqliteConnection open for the test lifetime and pass it to DbContextOptions.',
      'ConfigureTestServices runs AFTER the real DI registrations. Use services.RemoveAll<T>() before re-registering to avoid duplicate registration exceptions.',
    ],
  },

  'aspnet/background-services': {
    apis: ['IHostedService', 'BackgroundService', 'ExecuteAsync()', 'IServiceScopeFactory', 'PeriodicTimer', 'Channel<T>', 'AddHostedService<T>()', 'stoppingToken'],
    related: [
      { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
      { label: 'Caching',              route: '/aspnet/caching' },
      { label: 'SignalR',              route: '/aspnet/signalr' },
    ],
    tip: 'Use PeriodicTimer instead of Task.Delay in a loop — it ticks on schedule without drifting when the work takes variable time, and cleans up without a try/catch on OperationCanceledException.',
    docs: [
      { label: 'Background tasks in ASP.NET', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services' },
      { label: 'System.Threading.Channels',   url: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/channels' },
    ],
    resources: [
      { label: 'dotnet/runtime (Channels)',  url: 'https://github.com/dotnet/runtime', badge: 'code' },
    ],
    gotchas: [
      'Never inject a scoped service (DbContext, your repositories) directly into BackgroundService — it is a singleton. Always create a scope via IServiceScopeFactory.CreateAsyncScope().',
      'If ExecuteAsync throws an unhandled exception, the hosted service stops silently. Wrap the main loop in try/catch and log — or use IHostApplicationLifetime.StopApplication() to bring the whole process down on fatal errors.',
    ],
  },

  'aspnet/signalr': {
    apis: ['AddSignalR()', 'MapHub<T>()', 'Hub', 'IHubContext<T>', 'Clients.All', 'Clients.Caller', 'Groups.AddToGroupAsync()', 'AddStackExchangeRedis()'],
    related: [
      { label: 'Background Services', route: '/aspnet/background-services' },
      { label: 'Authentication',      route: '/aspnet/authentication' },
      { label: 'Rate Limiting',       route: '/aspnet/rate-limiting' },
    ],
    tip: 'Group membership is in-memory per server instance and lost on reconnect. Always have clients re-join their groups in the connection.onreconnected() callback on the client side.',
    docs: [
      { label: 'ASP.NET Core SignalR',     url: 'https://learn.microsoft.com/en-us/aspnet/core/signalr/introduction' },
      { label: 'JavaScript client',        url: 'https://learn.microsoft.com/en-us/aspnet/core/signalr/javascript-client' },
      { label: 'Scale out with Redis',     url: 'https://learn.microsoft.com/en-us/aspnet/core/signalr/redis-backplane' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore',       url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
      { label: 'SignalR samples',         url: 'https://github.com/dotnet/AspNetCore.Docs.Samples', badge: 'code' },
    ],
    gotchas: [
      'Hub instances are transient — created per invocation. Do not store client state in Hub fields. Use an external store (IMemoryCache, Redis, database) for connection-level state.',
      'Hub methods invoked from JavaScript are matched by string name (case-insensitive by default). A rename on the server without updating the client silently breaks the call.',
    ],
  },

  'aspnet/health-checks': {
    apis: ['AddHealthChecks()', 'MapHealthChecks()', 'IHealthCheck', 'HealthCheckResult', 'AddDbContextCheck<T>()', 'AddUrlGroup()', 'UIResponseWriter', 'AddOpenTelemetry()'],
    related: [
      { label: 'Deployment',           route: '/aspnet/deployment' },
      { label: 'Performance',          route: '/aspnet/performance' },
      { label: 'Configuration',        route: '/aspnet/configuration' },
    ],
    tip: 'Split liveness and readiness into separate endpoints. Liveness (/health/live) should never check external dependencies — if your DB is down, liveness should still pass (don\'t let k8s restart your pod over a DB outage).',
    docs: [
      { label: 'Health checks in ASP.NET',  url: 'https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks' },
      { label: 'OpenTelemetry .NET',        url: 'https://learn.microsoft.com/en-us/dotnet/core/diagnostics/observability-with-otel' },
    ],
    resources: [
      { label: 'Xabaril/AspNetCore.Diagnostics.HealthChecks', url: 'https://github.com/Xabaril/AspNetCore.Diagnostics.HealthChecks', badge: 'code' },
      { label: 'open-telemetry/opentelemetry-dotnet',         url: 'https://github.com/open-telemetry/opentelemetry-dotnet',         badge: 'code' },
    ],
    gotchas: [
      'The default HealthCheckOptions.ResponseWriter returns a plain "Healthy"/"Unhealthy" string. Production monitoring tools expect JSON — always provide a custom ResponseWriter or use UIResponseWriter.',
      'Health check evaluation is sequential by default. Slow external checks (URL group, DNS) block the response. Set a per-check timeout via AddUrlGroup(..., timeout: TimeSpan.FromSeconds(3)).',
    ],
  },

  'aspnet/deployment': {
    apis: ['dotnet publish', '--self-contained', 'Dockerfile', 'ForwardedHeaders', 'UseForwardedHeaders()', 'ASPNETCORE_ENVIRONMENT', 'appsettings.{Env}.json', 'PublishAot'],
    related: [
      { label: 'Configuration',    route: '/aspnet/configuration' },
      { label: 'Health Checks',    route: '/aspnet/health-checks' },
      { label: 'Secrets',          route: '/aspnet/secrets' },
    ],
    tip: 'Copy only the *.csproj files before dotnet restore in your Dockerfile — this creates a separate layer for restored packages that is cached unless dependencies change, making rebuilds much faster.',
    docs: [
      { label: 'Host and deploy ASP.NET',   url: 'https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/' },
      { label: 'Docker with .NET',          url: 'https://learn.microsoft.com/en-us/dotnet/core/docker/build-container' },
      { label: 'Native AOT overview',       url: 'https://learn.microsoft.com/en-us/dotnet/core/deploying/native-aot/' },
    ],
    resources: [
      { label: 'dotnet/dotnet-docker',  url: 'https://github.com/dotnet/dotnet-docker', badge: 'code' },
      { label: 'eShop reference app',   url: 'https://github.com/dotnet/eShop',         badge: 'code' },
    ],
    gotchas: [
      'UseForwardedHeaders() must come before UseAuthentication(). If reversed, auth redirects use the wrong scheme (http instead of https) and OAuth/OIDC flows break.',
      'Never set KnownNetworks.Clear() + KnownProxies.Clear() without trusting only your internal network. Without restriction, any caller can spoof X-Forwarded-For to impersonate any IP.',
    ],
  },

  'aspnet/performance': {
    apis: ['AddResponseCompression()', 'UseResponseCompression()', 'dotnet-counters', 'dotnet-trace', 'dotnet-dump', '[Benchmark]', 'ObjectPool<T>', 'ArrayPool<T>'],
    related: [
      { label: 'Caching',          route: '/aspnet/caching' },
      { label: 'EF Performance',   route: '/aspnet/ef-performance' },
      { label: 'Health Checks',    route: '/aspnet/health-checks' },
    ],
    tip: 'Run BenchmarkDotNet in Release mode (dotnet run -c Release) — Debug mode disables JIT optimisations that are active in production and makes results meaningless.',
    docs: [
      { label: 'Performance best practices',   url: 'https://learn.microsoft.com/en-us/aspnet/core/performance/performance-best-practices' },
      { label: 'Response compression',         url: 'https://learn.microsoft.com/en-us/aspnet/core/performance/response-compression' },
      { label: '.NET diagnostic tools',        url: 'https://learn.microsoft.com/en-us/dotnet/core/diagnostics/' },
    ],
    resources: [
      { label: 'dotnet/BenchmarkDotNet', url: 'https://github.com/dotnet/BenchmarkDotNet', badge: 'code' },
      { label: 'dotnet/aspnetcore',      url: 'https://github.com/dotnet/aspnetcore',      badge: 'code' },
    ],
    gotchas: [
      'Response compression over HTTPS can be vulnerable to BREACH attacks when responses contain secrets that reflect user-controlled input. EnableForHttps = true is safe for pure API JSON payloads but dangerous for HTML pages with CSRF tokens.',
      'ObjectPool<StringBuilder> calls sb.Clear() on Return — it does NOT reset the capacity. A StringBuilder that grew to 10 MB stays at 10 MB in the pool. Set a maximum capacity check before returning.',
    ],
  },

  'aspnet/aspire': {
    apis: ['AddProject<T>()', 'AddRedis()', 'AddPostgres()', 'WithReference()', 'AddServiceDefaults()', 'WithExternalHttpEndpoints()', 'ServiceDiscovery', 'azd up'],
    related: [
      { label: 'Health Checks',        route: '/aspnet/health-checks' },
      { label: 'Background Services',  route: '/aspnet/background-services' },
      { label: 'Deployment',           route: '/aspnet/deployment' },
    ],
    tip: 'The service name in AddProject("name") is your service discovery key. Use "https+http://name" as the HttpClient base address — Aspire resolves it to the actual port, so you never hardcode port numbers.',
    docs: [
      { label: '.NET Aspire overview',         url: 'https://learn.microsoft.com/en-us/dotnet/aspire/get-started/aspire-overview' },
      { label: 'Service discovery in Aspire',  url: 'https://learn.microsoft.com/en-us/dotnet/aspire/service-discovery/overview' },
      { label: 'Deploy with azd',              url: 'https://learn.microsoft.com/en-us/dotnet/aspire/deployment/azure/aca-deployment' },
    ],
    resources: [
      { label: 'dotnet/aspire',        url: 'https://github.com/dotnet/aspire',        badge: 'code' },
      { label: 'dotnet/aspire-samples', url: 'https://github.com/dotnet/aspire-samples', badge: 'code' },
    ],
    gotchas: [
      'AddServiceDefaults() must be called in each service project — not just the AppHost. Forgetting it in a service means that service has no OTel, health checks, or resilience handlers.',
      'Aspire containers (Redis, Postgres) use random host ports each run. Never hardcode ports in your service config — always rely on service discovery or the injected connection strings.',
    ],
  },

  // ── ASP.NET Core Reference ───────────────────────────────────────────────────
  'aspnet/cheatsheet': {
    apis: ['app.Use()', 'app.MapGet()', 'builder.Services.Add*()', 'AddAuthentication()', 'DbContextOptions', 'IHttpClientFactory'],
    related: [
      { label: 'Middleware Pipeline',  route: '/aspnet/middleware' },
      { label: 'Minimal APIs',         route: '/aspnet/minimal-apis' },
      { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
    ],
    tip: 'Use the search bar to filter entries across all sections at once — great for looking up a specific method or CLI command quickly.',
    docs: [
      { label: 'ASP.NET Core fundamentals',  url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/' },
      { label: 'dotnet CLI reference',       url: 'https://learn.microsoft.com/en-us/dotnet/core/tools/' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore',  url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    ],
    gotchas: [
      'The CLI section covers the most common commands — check the official dotnet CLI docs for the full flag reference.',
    ],
  },

  'aspnet/errors': {
    apis: ['IExceptionHandler', 'UseExceptionHandler()', 'ProblemDetails', 'ModelStateDictionary'],
    related: [
      { label: 'Error Handling',  route: '/aspnet/error-handling' },
      { label: 'Middleware',      route: '/aspnet/middleware'      },
      { label: 'Authentication',  route: '/aspnet/authentication'  },
    ],
    tip: 'Most startup errors have a root cause in the console output — check the inner exception before searching Stack Overflow.',
    docs: [
      { label: 'Handle errors in ASP.NET Core',  url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/error-handling' },
      { label: 'Troubleshoot ASP.NET Core',      url: 'https://learn.microsoft.com/en-us/aspnet/core/test/troubleshoot' },
    ],
    resources: [],
    gotchas: [
      'Always read the full stack trace — the innermost exception is almost always the real cause, not the outer wrapper.',
    ],
  },

  'aspnet/quiz-practice': {
    apis: ['Middleware', 'DI', 'Routing', 'Auth', 'EF Core', 'Performance', 'SignalR'],
    related: [
      { label: 'Interview Prep',  route: '/aspnet/interview-prep' },
      { label: 'Cheat Sheet',     route: '/aspnet/cheatsheet'     },
      { label: 'Common Errors',   route: '/aspnet/errors'         },
    ],
    tip: 'Re-run the topics you score lowest on — focus beats breadth when preparing for an interview.',
    docs: [
      { label: 'ASP.NET Core docs',  url: 'https://learn.microsoft.com/en-us/aspnet/core/' },
    ],
    resources: [],
    gotchas: [
      'Read the explanation even for questions you got right — the why matters more than the what.',
    ],
  },

  'aspnet/interview-prep': {
    apis: ['IMiddleware', 'IServiceCollection', 'IEndpointRouteBuilder', 'DbContext', 'IAuthorizationHandler'],
    related: [
      { label: 'Quiz Practice',   route: '/aspnet/quiz-practice' },
      { label: 'Design Patterns', route: '/aspnet/design-patterns' },
      { label: 'Cheat Sheet',     route: '/aspnet/cheatsheet' },
    ],
    tip: 'Senior questions probe trade-offs ("when would you NOT use minimal APIs") — practised answers beat memorised definitions.',
    docs: [
      { label: 'ASP.NET Core fundamentals',  url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/' },
      { label: 'Performance best practices', url: 'https://learn.microsoft.com/en-us/aspnet/core/performance/performance-best-practices' },
    ],
    resources: [],
    gotchas: [
      'Interviewers at senior level expect you to name trade-offs, not just features — practise the "it depends" framing.',
    ],
  },

  'aspnet/design-patterns': {
    apis: ['IRepository<T>', 'IMediator', 'IPipelineBehavior', 'ISpecification<T>', 'IResultPattern', 'IOutboxMessage'],
    related: [
      { label: 'Dependency Injection',  route: '/aspnet/dependency-injection' },
      { label: 'EF Core Basics',        route: '/aspnet/ef-core-basics'       },
      { label: 'Testing',               route: '/aspnet/testing'               },
    ],
    tip: 'Start with Repository + Options — they give most of the benefit with minimal complexity. Add CQRS/MediatR only when your command handlers grow past ~5.',
    docs: [
      { label: 'Architecture patterns (.NET)',  url: 'https://learn.microsoft.com/en-us/dotnet/architecture/' },
      { label: 'MediatR docs',                 url: 'https://github.com/jbogard/MediatR/wiki' },
    ],
    resources: [
      { label: 'dotnet/eShop (reference app)',  url: 'https://github.com/dotnet/eShop', badge: 'code' },
    ],
    gotchas: [
      'Patterns add indirection — only adopt one when the problem it solves is actually present in your codebase.',
    ],
  },

  'aspnet/decision-guides': {
    apis: ['MapControllers()', 'MapGet()', 'AddJwtBearer()', 'AddCookie()', 'IMemoryCache', 'IDistributedCache'],
    related: [
      { label: 'Minimal APIs',    route: '/aspnet/minimal-apis'    },
      { label: 'Authentication',  route: '/aspnet/authentication'  },
      { label: 'Caching',         route: '/aspnet/caching'         },
    ],
    tip: 'Use the comparison tables as a starting checklist — the "rule of thumb" row gives the 80% answer; check the detail rows for your edge case.',
    docs: [
      { label: 'Choose between controller-based and minimal APIs',  url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/apis' },
      { label: 'Caching overview',  url: 'https://learn.microsoft.com/en-us/aspnet/core/performance/caching/overview' },
    ],
    resources: [],
    gotchas: [
      'These guides cover the common 80% — always validate the recommendation against your team\'s skills and existing stack.',
    ],
  },

  'aspnet/glossary': {
    apis: ['Middleware', 'Kestrel', 'DI/IoC', 'DbContext', 'IActionResult', 'ClaimsPrincipal'],
    related: [
      { label: 'Cheat Sheet',     route: '/aspnet/cheatsheet'   },
      { label: 'Learning Paths',  route: '/aspnet/learning-paths' },
    ],
    tip: 'Use the letter quick-nav or search — every term that has a matching topic page includes a direct link.',
    docs: [
      { label: 'ASP.NET Core fundamentals glossary',  url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/' },
      { label: '.NET glossary',                       url: 'https://learn.microsoft.com/en-us/dotnet/standard/glossary' },
    ],
    resources: [],
    gotchas: [
      'Terms like "middleware" and "pipeline" have precise ASP.NET Core meanings — don\'t conflate them with general HTTP proxy concepts.',
    ],
  },

  'aspnet/mini-projects': {
    apis: ['MapGet/Post/Put/Delete()', 'AddAuthentication()', 'MapHub<T>()', 'IHostedService', 'Channel<T>'],
    related: [
      { label: 'Minimal APIs',        route: '/aspnet/minimal-apis'        },
      { label: 'Authentication',      route: '/aspnet/authentication'       },
      { label: 'SignalR',             route: '/aspnet/signalr'              },
      { label: 'Background Services', route: '/aspnet/background-services'  },
    ],
    tip: 'Build projects 1 → 2 → 3 in order — each adds a layer on top of the previous, so the progression is natural.',
    docs: [
      { label: 'Tutorial: Create a minimal API',  url: 'https://learn.microsoft.com/en-us/aspnet/core/tutorials/min-web-api' },
      { label: 'Use SignalR with ASP.NET Core',   url: 'https://learn.microsoft.com/en-us/aspnet/core/signalr/introduction' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore samples',  url: 'https://github.com/dotnet/aspnetcore/tree/main/src/Samples', badge: 'code' },
    ],
    gotchas: [
      'These walkthroughs are intentionally minimal — real projects will need validation, logging, and error handling on top.',
    ],
  },

  'aspnet/learning-paths': {
    apis: ['Hosting & Startup', 'Middleware', 'DI', 'EF Core', 'Auth', 'Minimal APIs', 'Deployment'],
    related: [
      { label: 'Quiz Practice',   route: '/aspnet/quiz-practice'  },
      { label: 'Interview Prep',  route: '/aspnet/interview-prep' },
      { label: 'Mini Projects',   route: '/aspnet/mini-projects'  },
    ],
    tip: 'Stick to one path at a time — finishing a track beats sampling all four.',
    docs: [
      { label: 'ASP.NET Core docs',       url: 'https://learn.microsoft.com/en-us/aspnet/core/' },
      { label: '.NET learning resources', url: 'https://dotnet.microsoft.com/en-us/learn'       },
    ],
    resources: [
      { label: 'dotnet/eShop (reference app)',  url: 'https://github.com/dotnet/eShop', badge: 'code' },
    ],
    gotchas: [
      'The Senior/Architect path assumes you\'ve already shipped a few APIs — don\'t skip the Backend Developer path unless you have solid fundamentals.',
    ],
  },

  // ── SQL ─────────────────────────────────────────────────────────────────────
  'sql/rdbms-concepts': {
    apis: ['PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'NOT NULL', 'CHECK', 'REFERENCES', 'ON DELETE CASCADE'],
    related: [{ label: 'Data Modeling', route: '/sql/data-modeling' }, { label: 'Normalization', route: '/sql/normalization' }, { label: 'SQL Basics', route: '/sql/basics' }],
    tip: 'Every table should have a surrogate primary key (IDENTITY / SERIAL). Natural keys are fragile — emails and phone numbers change.',
    docs: [{ label: 'T-SQL Constraints', url: 'https://learn.microsoft.com/en-us/sql/relational-databases/tables/unique-constraints-and-check-constraints' }, { label: 'PostgreSQL Constraints', url: 'https://www.postgresql.org/docs/current/ddl-constraints.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['Circular FK references require deferrable constraints in PostgreSQL or careful insert ordering in MSSQL.', 'ON DELETE CASCADE can silently wipe child rows — prefer explicit deletes in application code for critical data.'],
  },
  'sql/data-modeling': {
    apis: ['CREATE TABLE', 'FOREIGN KEY', 'REFERENCES', 'JOIN TABLE', 'ER Diagram'],
    related: [{ label: 'RDBMS Concepts', route: '/sql/rdbms-concepts' }, { label: 'Normalization', route: '/sql/normalization' }, { label: 'Schema Design', route: '/sql/schema-design' }],
    tip: 'Model for queries first. A perfectly normalised schema that requires 8 joins for every read is often the wrong design.',
    docs: [{ label: 'PostgreSQL DDL', url: 'https://www.postgresql.org/docs/current/ddl.html' }, { label: 'T-SQL DDL', url: 'https://learn.microsoft.com/en-us/sql/t-sql/statements/create-table-transact-sql' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['A Many-to-Many relationship always needs a junction table — you cannot store it in two columns.', 'Avoid storing comma-separated values in a single column — that breaks 1NF and makes queries painful.'],
  },
  'sql/normalization': {
    apis: ['1NF', '2NF', '3NF', 'BCNF', 'Functional Dependency', 'Partial Dependency', 'Transitive Dependency'],
    related: [{ label: 'Data Modeling', route: '/sql/data-modeling' }, { label: 'RDBMS Concepts', route: '/sql/rdbms-concepts' }, { label: 'Schema Design', route: '/sql/schema-design' }],
    tip: 'Normalise to 3NF by default, then denormalise only where profiling shows a measurable performance gain.',
    docs: [{ label: 'PostgreSQL DDL Best Practices', url: 'https://www.postgresql.org/docs/current/ddl.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['2NF only matters for composite primary keys — a single-column PK table is automatically in 2NF.', 'Denormalisation with triggers adds write overhead and complexity — document it and own it.'],
  },
  'sql/db-architecture': {
    apis: ['Buffer Pool', 'WAL / Transaction Log', 'MVCC', 'VACUUM', 'ANALYZE', 'sys.dm_os_buffer_descriptors', 'pg_stat_bgwriter'],
    related: [{ label: 'Transactions', route: '/sql/transactions' }, { label: 'Indexes', route: '/sql/indexes' }, { label: 'Performance', route: '/sql/performance' }],
    tip: 'PostgreSQL MVCC never blocks readers with writers. MSSQL achieves the same with RCSI — enable it for OLTP databases.',
    docs: [{ label: 'MSSQL Buffer Pool', url: 'https://learn.microsoft.com/en-us/sql/relational-databases/memory-management-architecture-guide' }, { label: 'PostgreSQL MVCC', url: 'https://www.postgresql.org/docs/current/mvcc.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['PostgreSQL VACUUM does not reclaim disk space to the OS — use VACUUM FULL for that (takes an exclusive lock).', 'Stale statistics cause the planner to choose bad plans — run ANALYZE after large bulk loads.'],
  },
  'sql/data-types': {
    apis: ['INT', 'BIGINT', 'DECIMAL', 'VARCHAR', 'NVARCHAR', 'DATETIME2', 'TIMESTAMPTZ', 'UUID', 'BOOLEAN', 'CAST', 'CONVERT', 'TRY_CAST'],
    related: [{ label: 'SQL Basics', route: '/sql/basics' }, { label: 'RDBMS Concepts', route: '/sql/rdbms-concepts' }, { label: 'Schema Design', route: '/sql/schema-design' }],
    tip: 'Always store timestamps as UTC. Use DATETIME2 (MSSQL) or TIMESTAMPTZ (PostgreSQL) — never DATETIME or TIMESTAMP WITHOUT TIME ZONE.',
    docs: [{ label: 'T-SQL Data Types', url: 'https://learn.microsoft.com/en-us/sql/t-sql/data-types/data-types-transact-sql' }, { label: 'PostgreSQL Data Types', url: 'https://www.postgresql.org/docs/current/datatype.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['Never use FLOAT for money — floating-point rounding causes penny errors. Use DECIMAL(19,4).', 'MSSQL VARCHAR is single-byte; use NVARCHAR for Unicode. PostgreSQL VARCHAR is always UTF-8 — the N prefix makes no difference.'],
  },
  'sql/basics': {
    apis: ['SELECT', 'FROM', 'WHERE', 'ORDER BY', 'DISTINCT', 'LIMIT / TOP', 'IS NULL', 'LIKE', 'BETWEEN', 'IN'],
    related: [{ label: 'Joins', route: '/sql/joins' }, { label: 'Aggregations', route: '/sql/aggregations' }, { label: 'Subqueries', route: '/sql/subqueries' }],
    tip: 'NULL comparisons always use IS NULL / IS NOT NULL — never = NULL. Any comparison with NULL returns UNKNOWN, not FALSE.',
    docs: [{ label: 'T-SQL SELECT', url: 'https://learn.microsoft.com/en-us/sql/t-sql/queries/select-transact-sql' }, { label: 'PostgreSQL SELECT', url: 'https://www.postgresql.org/docs/current/sql-select.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['SELECT * in production kills index coverage — always name your columns.', 'LIMIT without ORDER BY returns non-deterministic rows — always pair them.'],
  },
  'sql/joins': {
    apis: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN', 'CROSS JOIN', 'ON', 'USING', 'self-join'],
    related: [{ label: 'SQL Basics', route: '/sql/basics' }, { label: 'Subqueries', route: '/sql/subqueries' }, { label: 'Aggregations', route: '/sql/aggregations' }],
    tip: 'LEFT JOIN is right 80% of the time — use INNER JOIN only when you are certain every row has a match on both sides.',
    docs: [{ label: 'T-SQL JOIN', url: 'https://learn.microsoft.com/en-us/sql/t-sql/queries/from-transact-sql' }, { label: 'PostgreSQL JOIN', url: 'https://www.postgresql.org/docs/current/queries-table-expressions.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['Joining on nullable columns: NULL != NULL so rows where the key is NULL are always excluded from INNER JOIN.', 'CROSS JOIN on large tables is O(n×m) — easy to accidentally produce millions of rows.'],
  },
  'sql/aggregations': {
    apis: ['GROUP BY', 'HAVING', 'COUNT()', 'SUM()', 'AVG()', 'MIN()', 'MAX()', 'COUNT(*)', 'ROLLUP', 'GROUPING SETS'],
    related: [{ label: 'SQL Basics', route: '/sql/basics' }, { label: 'Window Functions', route: '/sql/window-functions' }, { label: 'CTEs', route: '/sql/ctes' }],
    tip: 'Every column in SELECT that is not inside an aggregate function must appear in GROUP BY — this is the fundamental rule of aggregation.',
    docs: [{ label: 'T-SQL GROUP BY', url: 'https://learn.microsoft.com/en-us/sql/t-sql/queries/select-group-by-transact-sql' }, { label: 'PostgreSQL Aggregates', url: 'https://www.postgresql.org/docs/current/functions-aggregate.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['HAVING filters after aggregation; WHERE filters before — you cannot use aggregate aliases in WHERE.', 'COUNT(*) counts rows including NULLs; COUNT(column) counts non-NULL values only.'],
  },
  'sql/subqueries': {
    apis: ['IN (subquery)', 'EXISTS', 'NOT EXISTS', 'ANY / ALL', 'scalar subquery', 'derived table', 'correlated subquery'],
    related: [{ label: 'CTEs', route: '/sql/ctes' }, { label: 'Joins', route: '/sql/joins' }, { label: 'Window Functions', route: '/sql/window-functions' }],
    tip: 'Prefer EXISTS over IN for subqueries against large tables — EXISTS short-circuits on first match; IN materialises the full result set.',
    docs: [{ label: 'T-SQL Subqueries', url: 'https://learn.microsoft.com/en-us/sql/relational-databases/performance/subqueries' }, { label: 'PostgreSQL Subqueries', url: 'https://www.postgresql.org/docs/current/functions-subquery.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['A correlated subquery re-runs for every outer row — if it is slow, rewrite as a JOIN or CTE.', 'NOT IN with a NULL in the subquery returns no rows at all — use NOT EXISTS instead.'],
  },
  'sql/ctes': {
    apis: ['WITH name AS (...)', 'multiple CTEs', 'RECURSIVE', 'anchor member', 'recursive member', 'UNION ALL'],
    related: [{ label: 'Subqueries', route: '/sql/subqueries' }, { label: 'Window Functions', route: '/sql/window-functions' }, { label: 'Stored Procedures', route: '/sql/stored-procedures' }],
    tip: 'Recursive CTEs are the cleanest way to walk a parent-child hierarchy — but always include a depth/cycle guard to prevent infinite loops.',
    docs: [{ label: 'T-SQL WITH / CTE', url: 'https://learn.microsoft.com/en-us/sql/t-sql/queries/with-common-table-expression-transact-sql' }, { label: 'PostgreSQL WITH', url: 'https://www.postgresql.org/docs/current/queries-with.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['CTEs in SQL Server are not always materialised — the optimiser can inline them and run the CTE body multiple times.', 'In PostgreSQL, CTEs are materialised by default (fence) — add NOT MATERIALIZED for optimiser visibility.'],
  },
  'sql/window-functions': {
    apis: ['ROW_NUMBER()', 'RANK()', 'DENSE_RANK()', 'NTILE()', 'LAG()', 'LEAD()', 'FIRST_VALUE()', 'LAST_VALUE()', 'OVER()', 'PARTITION BY', 'ROWS BETWEEN'],
    related: [{ label: 'Aggregations', route: '/sql/aggregations' }, { label: 'CTEs', route: '/sql/ctes' }, { label: 'Performance', route: '/sql/performance' }],
    tip: 'Window functions never reduce row count — unlike GROUP BY, every input row has a corresponding output row, so you can mix detail and summary in the same query.',
    docs: [{ label: 'T-SQL Window Functions', url: 'https://learn.microsoft.com/en-us/sql/t-sql/functions/ranking-functions-transact-sql' }, { label: 'PostgreSQL Window Functions', url: 'https://www.postgresql.org/docs/current/tutorial-window.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['LAST_VALUE needs ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING — the default frame stops at the current row.', 'Window functions run after WHERE and GROUP BY — you cannot filter on them in the same query; wrap in a CTE.'],
  },
  'sql/indexes': {
    apis: ['CREATE INDEX', 'CREATE CLUSTERED INDEX', 'INCLUDE', 'CREATE UNIQUE INDEX', 'DROP INDEX', 'sys.dm_db_missing_index_details', 'EXPLAIN', 'EXPLAIN ANALYZE'],
    related: [{ label: 'Performance', route: '/sql/performance' }, { label: 'Transactions', route: '/sql/transactions' }, { label: 'Schema Design', route: '/sql/schema-design' }],
    tip: 'The most impactful index is often a covering index — add the SELECT columns to INCLUDE so the engine never touches the base table.',
    docs: [{ label: 'SQL Server Indexes', url: 'https://learn.microsoft.com/en-us/sql/relational-databases/indexes/indexes' }, { label: 'PostgreSQL Indexes', url: 'https://www.postgresql.org/docs/current/indexes.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['Too many indexes slow down INSERT/UPDATE/DELETE — every write must update all indexes on the table.', 'SQL Server only uses one clustered index per table — choose the column most used in range queries (usually a sequential key).'],
  },
  'sql/transactions': {
    apis: ['BEGIN TRANSACTION', 'COMMIT', 'ROLLBACK', 'SAVEPOINT', 'SET TRANSACTION ISOLATION LEVEL', 'READ COMMITTED', 'SERIALIZABLE', 'SNAPSHOT', 'SELECT ... FOR UPDATE', 'WITH (NOLOCK)'],
    related: [{ label: 'Performance', route: '/sql/performance' }, { label: 'Stored Procedures', route: '/sql/stored-procedures' }, { label: 'Indexes', route: '/sql/indexes' }],
    tip: 'Keep transactions as short as possible — a long-running transaction holds locks and causes blocking for every other query that needs those rows.',
    docs: [{ label: 'T-SQL Transactions', url: 'https://learn.microsoft.com/en-us/sql/t-sql/language-elements/transactions-transact-sql' }, { label: 'PostgreSQL Transactions', url: 'https://www.postgresql.org/docs/current/tutorial-transactions.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['WITH (NOLOCK) / READ UNCOMMITTED reads dirty data — it avoids locks by reading uncommitted, potentially rolled-back rows.', 'Deadlocks are circular lock waits — SQL Server picks one transaction as the victim; always retry on deadlock error 1205.'],
  },
  'sql/schema-design': {
    apis: ['CREATE TABLE', 'PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK', 'NOT NULL', 'DEFAULT', 'IDENTITY / SERIAL', 'ON DELETE CASCADE', 'ALTER TABLE'],
    related: [{ label: 'Indexes', route: '/sql/indexes' }, { label: 'Transactions', route: '/sql/transactions' }, { label: 'JSON Features', route: '/sql/json-features' }],
    tip: 'Normalise to 3NF by default; only denormalise for a measured performance problem. Premature denormalisation creates data anomalies that are hard to fix later.',
    docs: [{ label: 'T-SQL CREATE TABLE', url: 'https://learn.microsoft.com/en-us/sql/t-sql/statements/create-table-transact-sql' }, { label: 'PostgreSQL CREATE TABLE', url: 'https://www.postgresql.org/docs/current/sql-createtable.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['Using VARCHAR(MAX) / TEXT for every string column hurts performance — choose appropriate lengths and use indexes.', 'Cascading deletes can surprise you in production — prefer explicit application-level deletes for critical data.'],
  },
  'sql/stored-procedures': {
    apis: ['CREATE PROCEDURE', 'EXEC / CALL', '@param IN/OUT', 'RETURN', 'TRY/CATCH', 'RAISERROR / RAISE', 'CREATE FUNCTION', 'TABLE-VALUED FUNCTION', 'DECLARE', 'SET'],
    related: [{ label: 'Transactions', route: '/sql/transactions' }, { label: 'Performance', route: '/sql/performance' }, { label: 'Schema Design', route: '/sql/schema-design' }],
    tip: 'Wrap multi-step procedures in TRY/CATCH with explicit ROLLBACK in the CATCH — otherwise a partially-committed proc leaves data in an inconsistent state.',
    docs: [{ label: 'T-SQL Stored Procedures', url: 'https://learn.microsoft.com/en-us/sql/relational-databases/stored-procedures/stored-procedures-database-engine' }, { label: 'PostgreSQL PL/pgSQL', url: 'https://www.postgresql.org/docs/current/plpgsql.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['Scalar UDFs in SQL Server are row-by-row — they kill query parallelism. Use inline TVFs or rewrite as set-based logic.', 'Procedure plan caching can cause parameter sniffing — OPTION (RECOMPILE) forces a fresh plan per execution.'],
  },
  'sql/performance': {
    apis: ['EXPLAIN ANALYZE', 'SET STATISTICS IO ON', 'sys.dm_exec_query_stats', 'Index Seek vs Scan', 'Hash Join vs Nested Loop', 'OPTION (RECOMPILE)', 'Query Store'],
    related: [{ label: 'Indexes', route: '/sql/indexes' }, { label: 'Transactions', route: '/sql/transactions' }, { label: 'Window Functions', route: '/sql/window-functions' }],
    tip: 'Read the execution plan right-to-left — the rightmost operations run first. The fattest arrow or the highest cost node is where to focus.',
    docs: [{ label: 'SQL Server Query Tuning', url: 'https://learn.microsoft.com/en-us/sql/relational-databases/performance/performance-center-for-sql-server-database-engine-and-azure-sql-database' }, { label: 'PostgreSQL EXPLAIN', url: 'https://www.postgresql.org/docs/current/sql-explain.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['Functions on indexed columns prevent index seeks: WHERE YEAR(created_at)=2024 scans everything; WHERE created_at >= … uses the index.', 'Implicit type conversions in WHERE (comparing INT column to a VARCHAR parameter) cause full scans.'],
  },
  'sql/json-features': {
    apis: ['JSON_VALUE()', 'JSON_QUERY()', 'OPENJSON()', 'FOR JSON PATH', 'FOR JSON AUTO', 'jsonb', 'jsonb_extract_path()', '->', '->>', '@>', '?'],
    related: [{ label: 'Schema Design', route: '/sql/schema-design' }, { label: 'Performance', route: '/sql/performance' }, { label: 'Stored Procedures', route: '/sql/stored-procedures' }],
    tip: 'In PostgreSQL, use jsonb (binary) not json (text) for stored JSON — jsonb supports indexing with GIN and all operators; json just stores the text.',
    docs: [{ label: 'T-SQL JSON Functions', url: 'https://learn.microsoft.com/en-us/sql/t-sql/functions/json-functions-transact-sql' }, { label: 'PostgreSQL JSON', url: 'https://www.postgresql.org/docs/current/functions-json.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['JSON columns cannot be indexed like normal columns without computed columns (SQL Server) or GIN indexes (PostgreSQL).', 'SQL Server stores JSON as NVARCHAR — there is no native JSON type, so validation is at function-call time, not insert time.'],
  },
  'sql/cheatsheet': {
    apis: ['SELECT', 'JOIN', 'GROUP BY', 'WINDOW', 'CTE', 'DDL', 'DML', 'DCL'],
    related: [{ label: 'SQL Basics', route: '/sql/basics' }, { label: 'Joins', route: '/sql/joins' }, { label: 'Window Functions', route: '/sql/window-functions' }],
    tip: 'Use the tab filters to jump to a section and the search box to find a specific function or keyword across all sections.',
    docs: [{ label: 'T-SQL Reference', url: 'https://learn.microsoft.com/en-us/sql/t-sql/language-reference' }, { label: 'PostgreSQL Reference', url: 'https://www.postgresql.org/docs/current/sql-commands.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['Syntax differences between SQL Server and PostgreSQL are noted in the tabs — check both dialects for client-facing queries.'],
  },
  'sql/errors': {
    apis: ['TRY/CATCH', 'RAISERROR', 'THROW', 'ERROR_MESSAGE()', 'ERROR_NUMBER()', 'RAISE', '@@ERROR'],
    related: [{ label: 'Transactions', route: '/sql/transactions' }, { label: 'Stored Procedures', route: '/sql/stored-procedures' }, { label: 'Performance', route: '/sql/performance' }],
    tip: 'Most SQL errors have a root cause in the error message itself — read the full error including the state/severity before searching.',
    docs: [{ label: 'T-SQL Error Handling', url: 'https://learn.microsoft.com/en-us/sql/t-sql/language-elements/try-catch-transact-sql' }, { label: 'PostgreSQL Error Codes', url: 'https://www.postgresql.org/docs/current/errcodes-appendix.html' }],
    resources: [],
    gotchas: ['Division by zero raises an error in SQL Server and PostgreSQL — use NULLIF(denominator, 0) to return NULL instead.'],
  },
  'sql/quiz-practice': {
    apis: ['SELECT', 'JOIN', 'GROUP BY', 'WINDOW', 'INDEX', 'TRANSACTION'],
    related: [{ label: 'Interview Prep', route: '/sql/interview-prep' }, { label: 'Cheat Sheet', route: '/sql/cheatsheet' }, { label: 'Common Errors', route: '/sql/errors' }],
    tip: 'Re-run the topics where you scored lowest — targeted practice beats breadth.',
    docs: [{ label: 'T-SQL Reference', url: 'https://learn.microsoft.com/en-us/sql/t-sql/language-reference' }],
    resources: [],
    gotchas: ['Read the explanation for every question, even correct ones — the reasoning matters more than the answer.'],
  },
  'sql/interview-prep': {
    apis: ['JOIN types', 'GROUP BY / HAVING', 'Window Functions', 'Indexes', 'Transactions', 'Normalisation'],
    related: [{ label: 'Quiz Practice', route: '/sql/quiz-practice' }, { label: 'Design Patterns', route: '/sql/design-patterns' }, { label: 'Cheat Sheet', route: '/sql/cheatsheet' }],
    tip: 'Senior SQL questions probe "why" — be ready to explain when NOT to use a subquery, why an index might not be used, and what isolation level trade-offs exist.',
    docs: [{ label: 'T-SQL Reference', url: 'https://learn.microsoft.com/en-us/sql/t-sql/language-reference' }, { label: 'PostgreSQL Docs', url: 'https://www.postgresql.org/docs/current/' }],
    resources: [],
    gotchas: ['Interviewers at senior level expect execution-plan reasoning, not just syntax recall — practise reading query plans.'],
  },
  'sql/design-patterns': {
    apis: ['soft delete', 'audit log', 'temporal tables', 'lookup/reference tables', 'adjacency list', 'nested sets', 'many-to-many junction'],
    related: [{ label: 'Schema Design', route: '/sql/schema-design' }, { label: 'Transactions', route: '/sql/transactions' }, { label: 'JSON Features', route: '/sql/json-features' }],
    tip: 'Start with the simplest pattern (adjacency list for trees, junction table for M:N) — only add complexity when you have a measured query problem.',
    docs: [{ label: 'T-SQL Temporal Tables', url: 'https://learn.microsoft.com/en-us/sql/relational-databases/tables/temporal-tables' }, { label: 'PostgreSQL Inheritance', url: 'https://www.postgresql.org/docs/current/ddl-inherit.html' }],
    resources: [],
    gotchas: ['Soft delete adds a filter to every query — use row-level security or a view to avoid accidentally including deleted rows.'],
  },
  'sql/decision-guides': {
    apis: ['clustered vs non-clustered', 'stored proc vs view', 'CTE vs subquery', 'ORM vs raw SQL', 'MSSQL vs PostgreSQL'],
    related: [{ label: 'Indexes', route: '/sql/indexes' }, { label: 'Performance', route: '/sql/performance' }, { label: 'Schema Design', route: '/sql/schema-design' }],
    tip: 'Decision tables give the 80% answer — always validate against your specific data distribution and query patterns.',
    docs: [{ label: 'SQL Server vs PostgreSQL comparison', url: 'https://learn.microsoft.com/en-us/sql/sql-server/' }],
    resources: [],
    gotchas: ['Platform choice (MSSQL vs PostgreSQL) is often driven by team skill and cloud cost, not raw features — both are excellent for most workloads.'],
  },
  'sql/glossary': {
    apis: ['DDL', 'DML', 'DCL', 'ACID', 'Normalisation', 'Cardinality', 'Index', 'Cursor'],
    related: [{ label: 'Cheat Sheet', route: '/sql/cheatsheet' }, { label: 'Learning Paths', route: '/sql/learning-paths' }],
    tip: 'Use the letter filter or search box — every term with a matching topic page links directly to it.',
    docs: [{ label: 'SQL Server Glossary', url: 'https://learn.microsoft.com/en-us/sql/sql-server/' }, { label: 'PostgreSQL Glossary', url: 'https://www.postgresql.org/docs/current/glossary.html' }],
    resources: [],
    gotchas: ['SQL terminology overlaps with relational algebra terms — "relation" = table, "tuple" = row, "attribute" = column in academic writing.'],
  },
  'sql/mini-projects': {
    apis: ['CREATE TABLE', 'INSERT', 'SELECT', 'JOIN', 'GROUP BY', 'INDEX', 'PROCEDURE'],
    related: [{ label: 'Schema Design', route: '/sql/schema-design' }, { label: 'Stored Procedures', route: '/sql/stored-procedures' }, { label: 'Performance', route: '/sql/performance' }],
    tip: 'Build all 4 schemas in the same database so you can practice cross-schema joins.',
    docs: [{ label: 'T-SQL Reference', url: 'https://learn.microsoft.com/en-us/sql/t-sql/language-reference' }, { label: 'PostgreSQL Reference', url: 'https://www.postgresql.org/docs/current/sql-commands.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['These schemas are intentionally simplified — production schemas will need audit columns, soft-delete, and partitioning for large tables.'],
  },
  'sql/learning-paths': {
    apis: ['SELECT', 'JOIN', 'GROUP BY', 'Window Functions', 'Indexes', 'Transactions'],
    related: [{ label: 'Quiz Practice', route: '/sql/quiz-practice' }, { label: 'Interview Prep', route: '/sql/interview-prep' }, { label: 'Mini Projects', route: '/sql/mini-projects' }],
    tip: 'Follow one path at a time — the beginner path is prerequisite for all others.',
    docs: [{ label: 'SQL Server Learning', url: 'https://learn.microsoft.com/en-us/sql/sql-server/' }, { label: 'PostgreSQL Tutorial', url: 'https://www.postgresql.org/docs/current/tutorial.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['The DBA path requires understanding execution plans — read the Indexes and Performance pages before tackling it.'],
  },

  // ── CSS: Box Model ────────────────────────────────────────────────────────
  'css/box-model': {
    apis: ['box-sizing', 'margin', 'padding', 'border', 'width', 'height', 'overflow', 'display'],
    related: [
      { label: 'Flexbox',               route: '/css/flexbox'    },
      { label: 'CSS Grid',              route: '/css/grid'       },
      { label: 'Positioning & Stacking', route: '/css/positioning' },
    ],
    tip: '* { box-sizing: border-box } should be line 1 of every stylesheet — it makes width mean what you expect and eliminates 80% of sizing bugs.',
    docs: [
      { label: 'MDN — box-sizing',    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing'    },
      { label: 'MDN — margin collapse', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model/Mastering_margin_collapsing' },
      { label: 'web.dev — Box Model', url: 'https://web.dev/learn/css/box-model'                            },
    ],
    resources: [
      { label: 'CSS Tricks — Box Model', url: 'https://css-tricks.com/the-css-box-model/', badge: 'blog' },
    ],
    gotchas: [
      'Margin collapse only happens in normal block flow — margins do not collapse inside flex or grid containers.',
      'overflow: hidden on a parent creates a BFC, which is a common trick to contain floats and prevent margin collapse.',
    ],
  },

  // ── CSS: Backgrounds & Borders ────────────────────────────────────────────
  'css/backgrounds-borders': {
    apis: ['background-size', 'background-image', 'linear-gradient()', 'radial-gradient()', 'border-radius', 'box-shadow', 'object-fit', 'aspect-ratio', 'outline'],
    related: [
      { label: 'Colors & Theming',  route: '/css/colors-theming' },
      { label: 'Responsive Design', route: '/css/responsive'     },
      { label: 'CSS Transitions',   route: '/css/transitions'    },
    ],
    tip: 'Layer 3 box-shadows (small/medium/large blur with low opacity) for realistic depth — a single large shadow looks flat.',
    docs: [
      { label: 'MDN — background',      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/background'     },
      { label: 'MDN — box-shadow',      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow'     },
      { label: 'MDN — aspect-ratio',    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio'   },
    ],
    resources: [
      { label: 'CSS Gradient Generator', url: 'https://www.css-gradient.com/', badge: 'tool' },
      { label: 'Shadow Palette Generator', url: 'https://www.joshwcomeau.com/shadow-palette/', badge: 'tool' },
    ],
    gotchas: [
      'background shorthand resets all sub-properties — use slash notation (position / size) inside it to set background-size.',
      'object-fit has no effect without explicit width and height on the img/video element.',
    ],
  },

  'css/css-nesting': {
    apis: ['& (parent selector)', 'nested @media', 'nested @container', 'nested @supports'],
    related: [
      { label: 'CSS Layers (@layer)', route: '/css/css-layers'        },
      { label: 'Selectors Deep Dive', route: '/css/selectors'         },
      { label: 'Logical Properties',  route: '/css/logical-properties' },
    ],
    tip: 'Always use & before pseudo-classes (&:hover) and pseudo-elements (&::before). Without &, the rule is a descendant selector.',
    docs: [
      { label: 'MDN — CSS Nesting',     url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting'        },
      { label: 'MDN — & selector',      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Nesting_selector'   },
      { label: 'Can I Use — Nesting',   url: 'https://caniuse.com/css-nesting'                                     },
    ],
    resources: [
      { label: 'CSS Nesting Playground', url: 'https://codepen.io/web-dot-dev/pen/OJoKJeK', badge: 'tool' },
    ],
    gotchas: [
      '.card { :hover { } } targets any hovered descendant — use &:hover to target .card itself.',
      'Native nesting does NOT concatenate strings — .block { &__element { } } is NOT .block__element.',
    ],
  },

  'css/css-layers': {
    apis: ['@layer', 'revert-layer', 'layer() in @import'],
    related: [
      { label: 'CSS Custom Properties', route: '/css/custom-properties' },
      { label: 'Selectors Deep Dive',   route: '/css/selectors'         },
      { label: 'CSS Nesting',           route: '/css/css-nesting'       },
    ],
    tip: 'Declare @layer order as the very first line in your stylesheet — the first @layer the browser sees establishes priority.',
    docs: [
      { label: 'MDN — @layer',        url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@layer'       },
      { label: 'MDN — revert-layer',  url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/revert-layer' },
      { label: 'Can I Use — @layer',  url: 'https://caniuse.com/css-cascade-5'                             },
    ],
    resources: [
      { label: 'CSS Cascade Layers Explainer', url: 'https://css.oddbird.net/layers/', badge: 'docs' },
    ],
    gotchas: [
      'Unlayered styles always beat layered ones — existing code outside @layer continues to win.',
      '!important reverses layer priority — !important in a lower-priority layer wins over !important in a higher one.',
    ],
  },

  'css/container-queries': {
    apis: ['container-type', 'container-name', 'container', '@container', 'cqw', 'cqh', 'cqi', 'cqb'],
    related: [
      { label: 'Responsive Design', route: '/css/responsive'          },
      { label: 'CSS Grid',          route: '/css/grid'                },
      { label: 'Flexbox',           route: '/css/flexbox'             },
    ],
    tip: 'Use container-type: inline-size (not size) for most cases — size containment can collapse element height.',
    docs: [
      { label: 'MDN — container-type',  url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/container-type'  },
      { label: 'MDN — @container',      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@container'      },
      { label: 'Can I Use — Container Queries', url: 'https://caniuse.com/css-container-queries'               },
    ],
    resources: [
      { label: 'Container Query Playground', url: 'https://codepen.io/una/pen/LYbvKpK', badge: 'tool' },
    ],
    gotchas: [
      'A container cannot query itself — only descendants respond to @container rules on that container.',
      'cqw / cqh only work when there is a container-type ancestor in scope — without one, they resolve to 0.',
    ],
  },

  // ── CSS: Colors & Theming ─────────────────────────────────────────────────
  'css/colors-theming': {
    apis: ['oklch()', 'color-mix()', 'prefers-color-scheme', 'forced-colors', 'color-scheme', 'var(--token)', 'contrast-color()'],
    related: [
      { label: 'Custom Properties', route: '/css/custom-properties' },
      { label: 'Responsive Design', route: '/css/responsive'        },
      { label: 'Typography',        route: '/css/typography'        },
    ],
    tip: 'Define 6 tokens: --bg, --surface, --border, --text, --muted, --accent. Every component reads these — dark mode is a single :root override.',
    docs: [
      { label: 'MDN — oklch',           url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch'   },
      { label: 'MDN — color-mix()',     url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix' },
      { label: 'oklch.com — color tool', url: 'https://oklch.com/' },
    ],
    resources: [
      { label: 'oklch.com palette tool', url: 'https://oklch.com/',     badge: 'tool' },
      { label: 'Radix Colors',           url: 'https://www.radix-ui.com/colors', badge: 'tool' },
    ],
    gotchas: [
      'Never use color alone to convey meaning (error/success) — pair with an icon or text label (WCAG 1.4.1).',
      'color-scheme: light dark must be on :root so native form controls adopt the correct mode.',
    ],
  },

  // ── CSS: Transitions ──────────────────────────────────────────────────────
  'css/transitions': {
    apis: ['transition', 'transition-duration', 'transition-timing-function', 'transition-delay', 'cubic-bezier()', 'prefers-reduced-motion'],
    related: [
      { label: 'CSS Animations', route: '/css/animations'      },
      { label: 'Flexbox',        route: '/css/flexbox'         },
      { label: 'Custom Properties', route: '/css/custom-properties' },
    ],
    tip: 'Define transition on the base state, not on :hover — otherwise the reverse transition snaps instead of animating.',
    docs: [
      { label: 'MDN — CSS Transitions', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transitions/Using_CSS_transitions' },
      { label: 'cubic-bezier.com',      url: 'https://cubic-bezier.com/' },
      { label: 'Easing functions reference', url: 'https://easings.net/' },
    ],
    resources: [
      { label: 'Easing Cheat Sheet', url: 'https://easings.net/', badge: 'tool' },
    ],
    gotchas: [
      'transition: all watches every property — always list specific properties to avoid wasted recalculations.',
      'transition on :hover only = one-way animation. Put it on the base element for both-way transitions.',
    ],
  },

  // ── CSS: Animations ───────────────────────────────────────────────────────
  'css/animations': {
    apis: ['@keyframes', 'animation-duration', 'animation-timing-function', 'animation-fill-mode', 'animation-delay', 'will-change', 'animation-play-state'],
    related: [
      { label: 'CSS Transitions',  route: '/css/transitions'  },
      { label: 'Responsive Design', route: '/css/responsive'  },
      { label: 'Custom Properties', route: '/css/custom-properties' },
    ],
    tip: 'Only animate transform and opacity for 60fps — everything else triggers layout or paint and will cause jank.',
    docs: [
      { label: 'MDN — CSS Animations', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations' },
      { label: 'cubic-bezier visualiser', url: 'https://cubic-bezier.com/' },
      { label: 'web.dev — Animations guide', url: 'https://web.dev/articles/animations-guide' },
    ],
    resources: [
      { label: 'Animate.css', url: 'https://animate.style/', badge: 'tool' },
    ],
    gotchas: [
      'will-change creates a GPU layer per element — applying it to everything wastes memory. Remove after animation ends.',
      'animation-fill-mode: none (default) resets element to original state on completion — usually set to "both".',
    ],
  },

  // ── CSS: Responsive Design ────────────────────────────────────────────────
  'css/responsive': {
    apis: ['@media (min-width)', '@container', 'container-type', 'clamp()', 'min()', 'max()', 'auto-fit', 'minmax()', 'prefers-reduced-motion'],
    related: [
      { label: 'CSS Grid',        route: '/css/grid'             },
      { label: 'Flexbox',         route: '/css/flexbox'          },
      { label: 'Custom Properties', route: '/css/custom-properties' },
    ],
    tip: 'Replace max-width + width: 100% with min(100%, 600px) — one property, zero override needed.',
    docs: [
      { label: 'MDN — @media',              url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media'            },
      { label: 'MDN — Container queries',   url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries' },
      { label: 'web.dev — Responsive design', url: 'https://web.dev/learn/design'                                     },
    ],
    resources: [
      { label: 'Utopia fluid type & space', url: 'https://utopia.fyi/', badge: 'tool' },
    ],
    gotchas: [
      'Without <meta name="viewport" content="width=device-width, initial-scale=1">, media queries won\'t behave on mobile.',
      'prefers-reduced-motion: reduce must disable or simplify animations — WCAG requires this for accessibility.',
    ],
  },

  // ── CSS: Typography ───────────────────────────────────────────────────────
  'css/typography': {
    apis: ['@font-face', 'font-display', 'clamp()', 'line-height', 'text-wrap', 'font-variation-settings', 'font-optical-sizing'],
    related: [
      { label: 'Custom Properties', route: '/css/custom-properties' },
      { label: 'Responsive Design', route: '/css/responsive'        },
      { label: 'Colors & Theming',  route: '/css/colors-theming'    },
    ],
    tip: 'Start every project with clamp() type tokens on :root and max-width: 65ch on .prose — these two rules eliminate most typography media queries.',
    docs: [
      { label: 'MDN — @font-face',      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face'    },
      { label: 'web.dev — Font best practices', url: 'https://web.dev/articles/font-best-practices'           },
      { label: 'Variable Fonts Guide',  url: 'https://web.dev/articles/variable-fonts'                        },
    ],
    resources: [
      { label: 'Fluid Type Scale', url: 'https://www.fluid-type-scale.com/', badge: 'tool' },
      { label: 'Font Squirrel',    url: 'https://www.fontsquirrel.com/',     badge: 'tool' },
    ],
    gotchas: [
      'Font preloads need crossorigin even for same-origin fonts — missing it causes a double download.',
      'em compounds in nested elements for font-size. Use rem to always be relative to the root.',
    ],
  },

  // ── CSS: Selectors ────────────────────────────────────────────────────────
  'css/selectors': {
    apis: [':is()', ':where()', ':has()', ':not()', ':nth-child()', '::before', '::after', '[attr^=]'],
    related: [
      { label: 'Custom Properties', route: '/css/custom-properties' },
      { label: 'Box Model',         route: '/css/box-model'         },
      { label: 'Flexbox',           route: '/css/flexbox'           },
    ],
    tip: 'Use :where() for base/reset styles so components can override without specificity fights. Use :is() when you need the selector\'s specificity to apply.',
    docs: [
      { label: 'MDN — :is()',  url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:is'   },
      { label: 'MDN — :has()', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:has'  },
      { label: 'MDN — Specificity', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity' },
    ],
    resources: [
      { label: 'CSS Specificity Calculator', url: 'https://specificity.keegan.st/', badge: 'tool' },
    ],
    gotchas: [
      ':is() takes the specificity of its most specific argument — :is(#id, .class) has ID-level specificity.',
      '::before/::after require content: "" even when empty — without it they don\'t render.',
    ],
  },

  // ── CSS: Custom Properties ────────────────────────────────────────────────
  'css/custom-properties': {
    apis: ['var()', '--custom-prop', ':root', '@property', 'color-mix()', 'calc() with var()'],
    related: [
      { label: 'Colors & Theming', route: '/css/colors-theming' },
      { label: 'CSS Animations',   route: '/css/animations'     },
      { label: 'Box Model',        route: '/css/box-model'      },
    ],
    tip: 'Name your tokens semantically (--color-surface, not --white) so they stay meaningful when the color changes in dark mode.',
    docs: [
      { label: 'MDN — CSS Custom Properties', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties' },
      { label: 'MDN — @property',             url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@property'                   },
      { label: 'web.dev — CSS Variables',     url: 'https://web.dev/learn/css/custom-properties'                                  },
    ],
    resources: [
      { label: 'Open Props (token library)', url: 'https://open-props.style/', badge: 'tool' },
    ],
    gotchas: [
      'var() fallback fires on undefined variables, not on invalid values — invalid triggers inherited/initial value instead.',
      'Sass variables are compile-time; CSS custom properties are runtime. Use CSS variables for anything that needs to change dynamically.',
    ],
  },

  // ── CSS: Positioning ──────────────────────────────────────────────────────
  'css/positioning': {
    apis: ['position: relative', 'position: absolute', 'position: fixed', 'position: sticky', 'z-index', 'inset', 'isolation: isolate'],
    related: [
      { label: 'CSS Grid',    route: '/css/grid'    },
      { label: 'Flexbox',     route: '/css/flexbox' },
      { label: 'Box Model',   route: '/css/box-model' },
    ],
    tip: 'Debugging z-index? Open DevTools, select the element, and look at the Layers panel — it shows every stacking context and lets you see what\'s layering on top.',
    docs: [
      { label: 'MDN — position',           url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/position'         },
      { label: 'MDN — z-index',            url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/z-index'          },
      { label: 'MDN — Stacking context',   url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context' },
    ],
    resources: [
      { label: 'CSS Tricks — z-index', url: 'https://css-tricks.com/almanac/properties/z/z-index/', badge: 'blog' },
    ],
    gotchas: [
      'z-index has no effect on position: static elements — add position: relative.',
      'overflow: hidden on a parent breaks sticky — the parent becomes the scroll container.',
    ],
  },

  // ── CSS: Grid ─────────────────────────────────────────────────────────────
  'css/grid': {
    apis: ['display: grid', 'grid-template-columns', 'grid-template-areas', 'repeat()', 'minmax()', 'fr', 'gap', 'grid-area'],
    related: [
      { label: 'Flexbox',               route: '/css/flexbox'    },
      { label: 'Box Model',             route: '/css/box-model'  },
      { label: 'Positioning & Stacking', route: '/css/positioning' },
    ],
    tip: 'repeat(auto-fit, minmax(200px, 1fr)) is the single most useful CSS Grid pattern — responsive columns with zero media queries.',
    docs: [
      { label: 'MDN — CSS Grid Layout', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout' },
      { label: 'MDN — grid-template-areas', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-areas' },
      { label: 'web.dev — Learn CSS Grid', url: 'https://web.dev/learn/css/grid' },
    ],
    resources: [
      { label: 'CSS Tricks — Grid Guide', url: 'https://css-tricks.com/snippets/css/complete-guide-grid/', badge: 'blog' },
      { label: 'Grid Garden (game)',      url: 'https://cssgridgarden.com/',                                  badge: 'tool' },
    ],
    gotchas: [
      'Grid items have min-width: auto — add min-width: 0 to allow them to shrink below content size.',
      'auto-fit collapses empty tracks; auto-fill keeps them — use auto-fit for card grids.',
    ],
  },

  // ── CSS: Flexbox ──────────────────────────────────────────────────────────
  'css/flexbox': {
    apis: ['display: flex', 'justify-content', 'align-items', 'flex-wrap', 'gap', 'flex', 'align-self', 'order'],
    related: [
      { label: 'Box Model',              route: '/css/box-model'    },
      { label: 'CSS Grid',               route: '/css/grid'         },
      { label: 'Positioning & Stacking', route: '/css/positioning'  },
    ],
    tip: 'Remember: justify-content = main axis (row → horizontal), align-items = cross axis (row → vertical). They swap when flex-direction is column.',
    docs: [
      { label: 'MDN — Flexbox',          url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox' },
      { label: 'MDN — flex shorthand',   url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/flex' },
      { label: 'web.dev — Learn CSS Flexbox', url: 'https://web.dev/learn/css/flexbox' },
    ],
    resources: [
      { label: 'CSS Tricks — Flexbox Guide', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', badge: 'blog' },
      { label: 'Flexbox Froggy (game)',      url: 'https://flexboxfroggy.com/',                              badge: 'tool' },
    ],
    gotchas: [
      'flex items have min-width: auto by default — add min-width: 0 to allow shrinking below content size.',
      'align-content only takes effect when flex-wrap: wrap is set and there are multiple rows.',
    ],
  },

  // ── HTML: Head & Metadata ──────────────────────────────────────────────────
  'html/head-metadata': {
    apis: ['<meta charset>', '<meta name="viewport">', 'og:image', '<link rel="preload">', '<link rel="canonical">'],
    related: [
      { label: 'Document Structure', route: '/html/document-structure' },
      { label: 'SEO & Meta Tags',    route: '/html/seo'                },
      { label: 'Performance',        route: '/html/performance'        },
    ],
    tip: 'Order matters in <head>: charset first, viewport second, then title and meta — any stylesheet or script before charset can cause encoding bugs.',
    docs: [
      { label: 'MDN — <head> element',     url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head' },
      { label: 'Open Graph Protocol',      url: 'https://ogp.me/' },
      { label: 'Google — Resource Hints',  url: 'https://web.dev/articles/preload-critical-assets' },
    ],
    resources: [
      { label: 'Metatags.io preview tool', url: 'https://metatags.io/',         badge: 'tool' },
      { label: 'Open Graph Debugger',      url: 'https://developers.facebook.com/tools/debug/', badge: 'tool' },
    ],
    gotchas: [
      'Font preloads need crossorigin even for same-origin fonts — omitting it causes the font to download twice.',
      'rel="canonical" must use an absolute URL; a relative path resolves differently across mirrors and defeats the duplicate-content fix.',
    ],
  },

  // ── HTML: iFrames & Embeds ─────────────────────────────────────────────────
  'html/iframes-embeds': {
    apis: ['sandbox', 'allow', 'srcdoc', 'loading="lazy"', 'X-Frame-Options', 'frame-ancestors'],
    related: [
      { label: 'Head & Metadata',    route: '/html/head-metadata'    },
      { label: 'HTML Performance',   route: '/html/performance'      },
      { label: 'Web Components',     route: '/html/custom-elements'  },
    ],
    tip: 'Always set an explicit width and height on iframes to prevent CLS, and always add a title attribute for screen reader accessibility.',
    docs: [
      { label: 'MDN — <iframe>',           url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe'   },
      { label: 'CSP frame-ancestors',      url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors' },
      { label: 'Permissions Policy',       url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Permissions_Policy' },
    ],
    resources: [
      { label: 'OWASP Clickjacking Guide', url: 'https://owasp.org/www-community/attacks/Clickjacking',  badge: 'docs' },
      { label: 'web.dev — Permissions Policy', url: 'https://web.dev/articles/permissions-policy',        badge: 'blog' },
    ],
    gotchas: [
      'sandbox allow attribute uses semicolons as separators — commas silently break the entire attribute.',
      'Combining allow-scripts + allow-same-origin in sandbox defeats it — a script can remove its own sandbox attribute.',
    ],
  },

  'html/cheatsheet': {
    apis: ['<!DOCTYPE html>', '<meta charset>', '<link rel>', 'defer/async', 'aria-*', 'data-*', 'loading="lazy"', 'fetchpriority'],
    related: [
      { label: 'HTML Interview Prep',   route: '/html/interview-prep'   },
      { label: 'Accessibility & ARIA',  route: '/html/accessibility'    },
      { label: 'HTML Performance',      route: '/html/performance'      },
    ],
    tip: 'Use the category filter to focus on one area at a time — Forms and A11y are the most common gaps in HTML interviews.',
    docs: [
      { label: 'MDN — HTML elements reference', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element'            },
      { label: 'MDN — Global attributes',       url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes'  },
      { label: 'HTML spec (WHATWG)',             url: 'https://html.spec.whatwg.org/multipage/'                             },
    ],
    resources: [
      { label: 'web.dev — Learn HTML',  url: 'https://web.dev/learn/html',  badge: 'blog' },
    ],
    gotchas: [],
  },

  'html/interview-prep': {
    apis: ['defer/async', 'ARIA', 'Critical Rendering Path', 'service worker', 'Shadow DOM', 'canonical', 'hreflang', 'JSON-LD'],
    related: [
      { label: 'HTML Cheat Sheet',      route: '/html/cheatsheet'       },
      { label: 'Accessibility & ARIA',  route: '/html/accessibility'    },
      { label: 'HTML SEO',              route: '/html/seo'              },
    ],
    tip: 'Interviewers love "why" answers — for every HTML feature, know the fallback, the performance impact, and the accessibility consequence.',
    docs: [
      { label: 'MDN — HTML',                   url: 'https://developer.mozilla.org/en-US/docs/Web/HTML'        },
      { label: 'web.dev — Core Web Vitals',    url: 'https://web.dev/articles/vitals'                         },
      { label: 'WHATWG HTML Living Standard',  url: 'https://html.spec.whatwg.org/multipage/'                 },
    ],
    resources: [
      { label: 'web.dev — Learn HTML', url: 'https://web.dev/learn/html',  badge: 'blog' },
    ],
    gotchas: [],
  },

  'html/apis': {
    apis: ['navigator.geolocation.getCurrentPosition()', 'navigator.geolocation.watchPosition()', 'Notification.requestPermission()', 'new Notification()', 'FileReader', 'DataTransfer', 'navigator.clipboard.writeText()', 'navigator.clipboard.readText()', 'navigator.share()', 'event.dataTransfer'],
    related: [
      { label: 'PWA & Service Workers', route: '/html/pwa-service-workers' },
      { label: 'HTML Performance',      route: '/html/performance'         },
      { label: 'Canvas & SVG',          route: '/html/canvas-svg'          },
    ],
    tip: 'Always feature-detect browser APIs before calling them — wrap calls in if ("share" in navigator) or if ("geolocation" in navigator) to avoid runtime errors on unsupported browsers.',
    docs: [
      { label: 'MDN — Geolocation API',  url: 'https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API'  },
      { label: 'MDN — Notifications API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API' },
      { label: 'MDN — File API',         url: 'https://developer.mozilla.org/en-US/docs/Web/API/File_API'          },
      { label: 'MDN — Clipboard API',    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API'     },
    ],
    resources: [
      { label: 'MDN — Web Share API',    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API',    badge: 'docs' },
      { label: 'web.dev — Capabilities', url: 'https://web.dev/explore/capabilities',                              badge: 'blog' },
    ],
    gotchas: [
      'Geolocation, Notifications, and Clipboard readText() all require HTTPS — they silently fail or throw on HTTP origins.',
      'dragover must call event.preventDefault() — without it the drop event never fires.',
      'Notification permission once set to "denied" cannot be re-requested from JavaScript — the user must change it in browser settings.',
    ],
  },

  'html/seo': {
    apis: ['<title>', '<meta name="description">', '<link rel="canonical">', '<meta name="robots">', 'JSON-LD <script>', 'og:title / og:image', 'twitter:card', 'hreflang', 'sitemap.xml', 'Core Web Vitals'],
    related: [
      { label: 'Head & Metadata',       route: '/html/head-metadata'        },
      { label: 'HTML Performance',      route: '/html/performance'          },
      { label: 'PWA & Service Workers', route: '/html/pwa-service-workers'  },
    ],
    tip: 'Test structured data with Google\'s Rich Results Test before deploying — invalid JSON-LD silently fails to produce rich snippets.',
    docs: [
      { label: 'Google — Search Central',       url: 'https://developers.google.com/search/docs'                              },
      { label: 'Schema.org',                    url: 'https://schema.org'                                                      },
      { label: 'Google — Core Web Vitals',      url: 'https://web.dev/articles/vitals'                                        },
    ],
    resources: [
      { label: 'Open Graph Protocol',           url: 'https://ogp.me/',                                          badge: 'docs' },
      { label: 'Google Rich Results Test',      url: 'https://search.google.com/test/rich-results',              badge: 'tool' },
    ],
    gotchas: [
      'Canonical and noindex together: if a page has both, Google will likely drop it from the index — pick one signal.',
      'og:image must be an absolute URL, not a relative path — social crawlers do not resolve relative paths.',
      'hreflang must be reciprocal — every page in the set must link back to all others, or Google ignores the tags.',
    ],
  },

  'html/pwa-service-workers': {
    apis: ['navigator.serviceWorker.register()', 'self.addEventListener("install")', 'self.addEventListener("fetch")', 'caches.open()', 'cache.put()', 'cache.match()', 'skipWaiting()', 'clients.claim()', 'PushManager', 'BackgroundSync'],
    related: [
      { label: 'HTML Performance',  route: '/html/performance'     },
      { label: 'HTML APIs',         route: '/html/apis'            },
      { label: 'HTML SEO',          route: '/html/seo'             },
    ],
    tip: 'Version your cache name (e.g. "app-shell-v2") so the activate event can cleanly delete old caches — unversioned caches grow forever and serve stale assets.',
    docs: [
      { label: 'MDN — Service Worker API',  url: 'https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API'    },
      { label: 'MDN — Cache API',           url: 'https://developer.mozilla.org/en-US/docs/Web/API/Cache'                 },
      { label: 'web.dev — PWA',             url: 'https://web.dev/progressive-web-apps/'                                  },
    ],
    resources: [
      { label: 'Workbox (Google)',          url: 'https://developer.chrome.com/docs/workbox/',                badge: 'tool' },
      { label: 'web.dev — Offline cookbook', url: 'https://web.dev/articles/offline-cookbook',               badge: 'blog' },
    ],
    gotchas: [
      'Service workers only work on HTTPS (or localhost) — HTTP origins will silently fail to register.',
      'The service worker scope is limited to its file location — a SW in /js/ cannot intercept requests from /.',
      'skipWaiting() alone does not take control of open clients — pair it with clients.claim() in the activate event.',
    ],
  },

  'html/performance': {
    apis: ['loading="lazy"', 'fetchpriority="high"', 'rel="preload"', 'rel="prefetch"', 'rel="preconnect"', 'rel="dns-prefetch"', 'defer', 'async', 'rel="modulepreload"', 'content-visibility'],
    related: [
      { label: 'Head & Metadata',  route: '/html/head-metadata'   },
      { label: 'Canvas & SVG',     route: '/html/canvas-svg'      },
      { label: 'PWA & Service Workers', route: '/html/pwa-service-workers' },
    ],
    tip: 'Always add fetchpriority="high" to your above-the-fold hero/LCP image — it is a one-line change that can move LCP by hundreds of milliseconds.',
    docs: [
      { label: 'MDN — Resource hints',      url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload'   },
      { label: 'web.dev — Optimize LCP',    url: 'https://web.dev/articles/optimize-lcp'                                       },
      { label: 'web.dev — fetchpriority',   url: 'https://web.dev/articles/fetch-priority'                                     },
    ],
    resources: [
      { label: 'web.dev — Critical Rendering Path', url: 'https://web.dev/articles/critical-rendering-path', badge: 'blog' },
      { label: 'MDN — content-visibility',          url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility', badge: 'docs' },
    ],
    gotchas: [
      'Preloading too many resources defeats the purpose — only preload the 1-3 resources the browser would not discover early enough on its own.',
      'Font preloads need both as="font" and crossorigin attributes — missing crossorigin causes a double fetch.',
      'async on a script that depends on another async script causes race conditions — use defer or modules instead.',
    ],
  },

  'html/canvas-svg': {
    apis: ['getContext("2d")', 'fillRect()', 'beginPath()', 'arc()', 'fillText()', 'drawImage()', 'requestAnimationFrame()', 'save()/restore()', 'SVG viewBox', '<path d="">'],
    related: [
      { label: 'iFrames & Embeds',   route: '/html/iframes-embeds'  },
      { label: 'HTML Performance',   route: '/html/performance'     },
      { label: 'HTML APIs',          route: '/html/apis'            },
    ],
    tip: 'Set canvas width/height via HTML attributes for pixel resolution — CSS only scales the existing buffer and will cause blur on HiDPI screens.',
    docs: [
      { label: 'MDN — Canvas API',           url: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API'        },
      { label: 'MDN — SVG',                  url: 'https://developer.mozilla.org/en-US/docs/Web/SVG'                   },
      { label: 'MDN — requestAnimationFrame', url: 'https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame' },
    ],
    resources: [
      { label: 'web.dev — Canvas tutorial',  url: 'https://web.dev/articles/canvas-performance', badge: 'blog' },
      { label: 'SVG Tutorial — MDN',         url: 'https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial',        badge: 'docs' },
    ],
    gotchas: [
      'Missing beginPath() causes shapes to share state — the second shape inherits the first\'s path and styles.',
      'Canvas pixel density: multiply canvas.width/height by devicePixelRatio and scale the context to avoid blur on retina screens.',
      'SVG elements created with document.createElement (not createElementNS) will render as unknown HTML, not SVG shapes.',
    ],
  },

  // ── HTML: Web Components ───────────────────────────────────────────────────
  'html/custom-elements': {
    apis: ['customElements.define()', 'attachShadow()', '<template>', '<slot>', 'connectedCallback()', 'observedAttributes'],
    related: [
      { label: 'Document Structure', route: '/html/document-structure' },
      { label: 'HTML APIs',          route: '/html/apis'               },
      { label: 'JavaScript DOM',     route: '/javascript/dom'          },
    ],
    tip: 'Start with autonomous custom elements (extend HTMLElement) — customized built-ins (extend HTMLButtonElement) have poor Safari support and rarely worth the complexity.',
    docs: [
      { label: 'MDN — Web Components',       url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_components' },
      { label: 'Custom Elements Spec',        url: 'https://html.spec.whatwg.org/multipage/custom-elements.html'    },
      { label: 'Shadow DOM Spec',             url: 'https://www.w3.org/TR/shadow-dom/'                             },
    ],
    resources: [
      { label: 'webcomponents.org',   url: 'https://www.webcomponents.org/',                       badge: 'blog' },
      { label: 'Open Web Components', url: 'https://open-wc.org/',                                 badge: 'tool' },
    ],
    gotchas: [
      'super() must be the very first statement in the constructor — any this access before it throws ReferenceError.',
      'template.content.cloneNode(true) is required — appending template.content directly moves the nodes and leaves the template empty for all future instances.',
    ],
  },

  // ── HTML: Accessibility & ARIA ─────────────────────────────────────────────
  'html/accessibility': {
    apis: ['role', 'aria-label', 'aria-labelledby', 'aria-live', 'aria-hidden', 'tabindex'],
    related: [
      { label: 'Semantic Elements',  route: '/html/semantic-elements'  },
      { label: 'HTML Forms',         route: '/html/forms'              },
      { label: 'Document Structure', route: '/html/document-structure' },
    ],
    tip: 'Rule 1 of ARIA: if you can use a native HTML element or attribute with the right semantics, do that instead of adding an ARIA role.',
    docs: [
      { label: 'MDN ARIA Reference',        url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA' },
      { label: 'WCAG 2.1 Guidelines',       url: 'https://www.w3.org/WAI/WCAG21/quickref/' },
      { label: 'WebAIM Contrast Checker',   url: 'https://webaim.org/resources/contrastchecker/' },
    ],
    resources: [
      { label: 'web.dev — Accessibility',   url: 'https://web.dev/accessibility/',                           badge: 'blog' },
      { label: 'a11yproject.com',           url: 'https://www.a11yproject.com/',                             badge: 'blog' },
      { label: 'Axe DevTools (extension)',  url: 'https://www.deque.com/axe/devtools/',                     badge: 'tool' },
    ],
    gotchas: [
      'aria-hidden="true" on a focusable element creates an invisible keyboard trap — screen reader skips it but keyboard does not.',
      'Live regions (aria-live) must already exist in the DOM before content is injected — injecting the region and content simultaneously does not announce.',
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
    '[class.section-angular]':     'section() === "angular"',
    '[class.section-csharp]':      'section() === "csharp"',
    '[class.section-aspnet]':      'section() === "aspnet"',
    '[class.section-sql]':         'section() === "sql"',
    '[class.section-typescript]':  'section() === "typescript"',
    '[class.section-react]':       'section() === "react"',
    '[class.section-javascript]':  'section() === "javascript"',
    '[class.section-html]':        'section() === "html"',
    '[class.section-css]':         'section() === "css"',
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

  section = computed<'angular' | 'csharp' | 'aspnet' | 'sql' | 'typescript' | 'react' | 'javascript' | 'html' | 'css'>(() =>
    this.currentUrl().startsWith('/csharp')       ? 'csharp'
    : this.currentUrl().startsWith('/aspnet')     ? 'aspnet'
    : this.currentUrl().startsWith('/sql')        ? 'sql'
    : this.currentUrl().startsWith('/typescript') ? 'typescript'
    : this.currentUrl().startsWith('/react')      ? 'react'
    : this.currentUrl().startsWith('/javascript') ? 'javascript'
    : this.currentUrl().startsWith('/html')       ? 'html'
    : this.currentUrl().startsWith('/css')        ? 'css'
    : 'angular'
  );

  data = computed<SidebarData>(() => {
    const key = this.routeKey();
    return SIDEBAR_MAP[key] ??
           SIDEBAR_MAP[key.replace(/^(angular|csharp)\//, '')] ??
           (this.section() === 'aspnet'      ? ASPNET_DEFAULT
           : this.section() === 'sql'        ? SQL_DEFAULT
           : this.section() === 'typescript' ? TS_DEFAULT
           : this.section() === 'react'      ? REACT_DEFAULT
           : this.section() === 'javascript' ? JS_DEFAULT
           : this.section() === 'html'       ? HTML_DEFAULT
           : this.section() === 'css'        ? CSS_DEFAULT
           : DEFAULT);
  });

  docsHeading = computed(() => {
    switch (this.section()) {
      case 'csharp':      return '📖 C# Docs';
      case 'aspnet':      return '📖 ASP.NET Core Docs';
      case 'sql':         return '📖 SQL Docs';
      case 'typescript':  return '📖 TypeScript Docs';
      case 'react':       return '📖 React Docs';
      case 'javascript':  return '📖 MDN JS Docs';
      case 'html':        return '📖 MDN HTML Docs';
      case 'css':         return '📖 MDN CSS Docs';
      default:            return '📖 Angular Docs';
    }
  });

  badgeLabel: Record<string, string> = {
    docs: 'docs', video: 'video', blog: 'blog', tool: 'tool', code: 'code',
  };
}
