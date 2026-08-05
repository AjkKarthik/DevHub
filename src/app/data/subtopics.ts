// Phase 10 — subtopic navigation data, shared between AppComponent (for hubs whose nav
// is rendered inline in app.html) and per-hub *NavComponent files (for hubs whose nav is
// extracted into a dedicated component, e.g. GoNavComponent) — moved out of app.ts to
// avoid a circular import (app.ts imports the *NavComponents; a *NavComponent needing
// this data cannot import it back from app.ts).

// Phase 10 — subtopic pages, keyed by parent topic route slug (e.g. 'counter').
// Populated incrementally as subtopic pages are built; topics without an
// entry here simply render no nested list (no forced empty expand arrow).
export interface SubtopicNavEntry { label: string; route: string; }
export const SUBTOPICS: Record<string, SubtopicNavEntry[]> = {
  counter: [
    { label: 'What Is a Signal?', route: '/angular/counter/what-is-a-signal' },
    { label: 'computed() — Derived State', route: '/angular/counter/computed' },
    { label: 'effect() — Reactive Side Effects', route: '/angular/counter/effects' },
    { label: '@if and @for — Control Flow', route: '/angular/counter/control-flow' },
    { label: 'Signals in Services', route: '/angular/counter/readonly-and-services' },
    { label: 'RxJS Interop', route: '/angular/counter/rxjs-interop' },
  ],
  todo: [
    { label: 'inject() — Modern Dependency Injection', route: '/angular/todo/inject-di' },
    { label: 'Reactive Forms Basics', route: '/angular/todo/reactive-forms-basics' },
    { label: 'Route Guards', route: '/angular/todo/route-guards' },
    { label: 'Signal-Based Services', route: '/angular/todo/signal-based-services' },
    { label: 'Custom & Async Validators', route: '/angular/todo/custom-validators' },
    { label: 'Form State — touched, dirty, status', route: '/angular/todo/form-state' },
  ],
  forms: [
    { label: 'Template-Driven vs Reactive', route: '/angular/forms/template-driven-vs-reactive' },
    { label: 'FormGroup, FormControl & FormArray', route: '/angular/forms/formgroup-formcontrol-formarray' },
    { label: 'Cross-Field Validators', route: '/angular/forms/cross-field-validators' },
    { label: 'Typed Forms', route: '/angular/forms/typed-forms' },
  ],
  http: [
    { label: 'HttpClient Setup', route: '/angular/http/httpclient-setup' },
    { label: 'GET Requests — toSignal() and httpResource()', route: '/angular/http/get-requests' },
    { label: 'Mutation Requests — POST, PUT, DELETE', route: '/angular/http/mutation-requests' },
    { label: 'Error Handling & Retry', route: '/angular/http/error-handling-retry' },
  ],
  'http-interceptors': [
    { label: 'What Are Interceptors?', route: '/angular/http-interceptors/what-are-interceptors' },
    { label: 'Auth Interceptor & Token Refresh', route: '/angular/http-interceptors/auth-interceptor-token-refresh' },
    { label: 'Global Error Interceptor', route: '/angular/http-interceptors/global-error-interceptor' },
    { label: 'Loading Spinner & HttpContext', route: '/angular/http-interceptors/loading-spinner-httpcontext' },
  ],
  'parent-child': [
    { label: 'input() — Modern @Input', route: '/angular/parent-child/input-signals' },
    { label: 'output() — Modern @Output', route: '/angular/parent-child/output-signals' },
    { label: 'model() — Two-Way Binding', route: '/angular/parent-child/model-two-way-binding' },
    { label: 'viewChild() and viewChildren()', route: '/angular/parent-child/viewchild-viewchildren' },
    { label: 'contentChild() & Migration', route: '/angular/parent-child/contentchild-migration' },
  ],
  'form-array': [
    { label: 'FormArray of FormGroups', route: '/angular/form-array/dynamic-formarray-of-groups' },
    { label: 'Typed FormArray', route: '/angular/form-array/typed-formarray' },
    { label: 'Add, Remove & Reorder', route: '/angular/form-array/formarray-crud-patterns' },
    { label: 'Validating the Array Itself', route: '/angular/form-array/formarray-level-validation' },
  ],
  defer: [
    { label: 'What Is @defer?', route: '/angular/defer/defer-basics' },
    { label: 'Trigger Conditions', route: '/angular/defer/defer-triggers' },
    { label: 'Placeholder, Loading & Error', route: '/angular/defer/placeholder-loading-error' },
    { label: 'Requirements & Nesting', route: '/angular/defer/defer-requirements-nesting' },
    { label: 'Performance & Prefetching', route: '/angular/defer/defer-performance-prefetch' },
  ],
  material: [
    { label: 'Setup & Theming', route: '/angular/material/material-setup-theming' },
    { label: 'Form Fields, Inputs & Validation', route: '/angular/material/material-form-fields' },
    { label: 'Buttons, Dialogs & Snackbars', route: '/angular/material/material-common-components' },
    { label: 'MatTable — Sorting & Pagination', route: '/angular/material/mattable-sorting-pagination' },
    { label: 'Testing, Accessibility & Performance', route: '/angular/material/material-testing-accessibility' },
  ],
  store: [
    { label: 'Async Store Operations', route: '/angular/store/async-store-operations' },
    { label: 'Signal Store vs NgRx', route: '/angular/store/signal-store-vs-ngrx' },
    { label: 'Testing & Composing Stores', route: '/angular/store/testing-composing-stores' },
  ],
  templates: [
    { label: 'Interpolation & Expressions', route: '/angular/templates/interpolation-expressions' },
    { label: 'Property, Event & Two-Way Binding', route: '/angular/templates/property-event-two-way-binding' },
    { label: 'Template Refs & @let', route: '/angular/templates/template-refs-and-let' },
    { label: 'Pipes — Built-in & Custom', route: '/angular/templates/pipes-built-in-custom' },
  ],
  directives: [
    { label: 'Attribute Directive Anatomy', route: '/angular/directives/attribute-directive-anatomy' },
    { label: 'Custom Structural Directives', route: '/angular/directives/custom-structural-directives' },
    { label: 'Directive Composition API', route: '/angular/directives/directive-composition-api' },
  ],
  lifecycle: [
    { label: 'The Hook Sequence', route: '/angular/lifecycle/lifecycle-hook-sequence' },
    { label: 'ngOnChanges & ngOnInit', route: '/angular/lifecycle/init-hooks-ngonchanges-ngoninit' },
    { label: 'View & Content Hooks', route: '/angular/lifecycle/view-content-hooks-afternextrender' },
    { label: 'Cleanup — DestroyRef & takeUntilDestroyed', route: '/angular/lifecycle/cleanup-destroyref-takeuntildestroyed' },
  ],
  pipes: [
    { label: 'Formatting Pipes & Locale', route: '/angular/pipes/formatting-pipes-locale' },
    { label: 'Collection & String Pipes', route: '/angular/pipes/collection-string-pipes' },
    { label: 'AsyncPipe, @let & Performance', route: '/angular/pipes/async-pipe-let-performance' },
  ],
  di: [
    { label: 'Injection Context Deep Dive', route: '/angular/di/injection-context-deep-dive' },
    { label: 'Multi-Providers & Extension Points', route: '/angular/di/multi-providers-extension-points' },
    { label: 'Environment Injectors & Standalone Bootstrap', route: '/angular/di/environment-injectors-standalone-bootstrap' },
  ],
  routing: [
    { label: 'Custom UrlMatchers & Route Config', route: '/angular/routing/custom-url-matchers-route-config' },
    { label: 'Router Events & Navigation Lifecycle', route: '/angular/routing/router-events-navigation-lifecycle' },
    { label: 'Route Reuse Strategy', route: '/angular/routing/route-reuse-strategy' },
    { label: 'View Transitions & Relative Navigation', route: '/angular/routing/view-transitions-relative-navigation' },
  ],
  charts: [
    { label: 'Custom Plugins & Click Interactions', route: '/angular/charts/custom-plugins-click-interactions' },
    { label: 'Mixed Charts & Annotations', route: '/angular/charts/mixed-charts-annotations' },
    { label: 'Time Scale & Large Datasets', route: '/angular/charts/time-scale-large-datasets' },
  ],
  'zod-forms': [
    { label: 'Discriminated Unions & Transforms', route: '/angular/zod-forms/discriminated-unions-and-transforms' },
    { label: 'Async Validation with Zod', route: '/angular/zod-forms/async-validation-with-zod' },
    { label: 'Nested Schemas & Error Formatting', route: '/angular/zod-forms/nested-schemas-error-formatting' },
  ],
  'content-projection': [
    { label: 'Programmatic Projection with createComponent', route: '/angular/content-projection/programmatic-projection-createcomponent' },
    { label: 'Compound Components with Content Queries', route: '/angular/content-projection/compound-components-content-queries' },
    { label: 'Recursive Templates with NgTemplateOutlet', route: '/angular/content-projection/recursive-templates-ngtemplateoutlet' },
  ],
  'change-detection': [
    { label: 'Embedded Views & Dynamic Component CD', route: '/angular/change-detection/embedded-views-dynamic-cd' },
    { label: 'Bridging External Libraries to OnPush', route: '/angular/change-detection/bridging-external-libraries-onpush' },
    { label: 'Testing OnPush Components', route: '/angular/change-detection/testing-onpush-components' },
  ],
  'custom-validators': [
    { label: 'Dynamic Validators at Runtime', route: '/angular/custom-validators/dynamic-validators-runtime' },
    { label: 'Validator Directives for Template Forms', route: '/angular/custom-validators/validator-directives-template-forms' },
    { label: 'Generic Reusable Validators', route: '/angular/custom-validators/generic-reusable-validators' },
  ],
  rxjs: [
    { label: 'Custom Operators & pipe()', route: '/angular/rxjs/custom-operators-and-pipe' },
    { label: 'Multicasting & share() Operators', route: '/angular/rxjs/multicasting-share-operators' },
    { label: 'Testing RxJS with Marble Diagrams', route: '/angular/rxjs/testing-rxjs-marble-diagrams' },
  ],
  cdk: [
    { label: 'CDK Menu & Keyboard Navigation', route: '/angular/cdk/cdk-menu-keyboard-navigation' },
    { label: 'CDK Table — Headless Data Table', route: '/angular/cdk/cdk-table-headless-data-table' },
    { label: 'Building a Custom Overlay Component', route: '/angular/cdk/building-custom-overlay-component' },
  ],
  'ag-grid': [
    { label: 'Custom Cell Renderers as Angular Components', route: '/angular/ag-grid/custom-cell-renderers-angular-components' },
    { label: 'Editable Cells & Value Setters', route: '/angular/ag-grid/editable-cells-value-setters' },
    { label: 'Master/Detail & Row Grouping', route: '/angular/ag-grid/master-detail-row-grouping' },
  ],
  'tanstack-query': [
    { label: 'Optimistic Updates & Rollback', route: '/angular/tanstack-query/optimistic-updates-rollback' },
    { label: 'Dependent & Parallel Queries', route: '/angular/tanstack-query/dependent-and-parallel-queries' },
    { label: 'Infinite Queries & Pagination', route: '/angular/tanstack-query/infinite-queries-pagination' },
  ],
  'date-fns': [
    { label: 'Intervals & Recurring Events', route: '/angular/date-fns/intervals-and-recurring-events' },
    { label: 'Timezone Handling with date-fns-tz', route: '/angular/date-fns/timezone-handling-date-fns-tz' },
    { label: 'Reactive Date Range Picker', route: '/angular/date-fns/reactive-date-range-picker' },
  ],
  animations: [
    { label: 'Animation Callbacks & Lifecycle Events', route: '/angular/animations/animation-callbacks-lifecycle-events' },
    { label: 'group() vs sequence() Orchestration', route: '/angular/animations/group-sequence-parallel-orchestration' },
    { label: 'CSS-Only & View Transitions Alternatives', route: '/angular/animations/css-only-and-view-transitions-alternatives' },
  ],
  cva: [
    { label: 'NgControl Self-Injection for Validation Display', route: '/angular/cva/ngcontrol-self-injection-validation-display' },
    { label: 'Composite Value CVA with FormGroup', route: '/angular/cva/composite-value-cva-with-formgroup' },
    { label: 'Testing CVA Components', route: '/angular/cva/testing-cva-components' },
  ],
  testing: [
    { label: 'Testing Directives with Host Components', route: '/angular/testing/testing-directives-with-host-components' },
    { label: 'Testing Routed Components & Guards', route: '/angular/testing/testing-routed-components-and-guards' },
    { label: 'Test Doubles & Mocking Strategies', route: '/angular/testing/test-doubles-and-mocking-strategies' },
  ],
  tailwind: [
    { label: 'Theme Tokens & Custom Variants', route: '/angular/tailwind/theme-tokens-and-custom-variants' },
    { label: 'Component Variant Patterns with cva', route: '/angular/tailwind/component-variant-patterns-with-cva' },
    { label: 'Tailwind Transitions & Animations', route: '/angular/tailwind/tailwind-transitions-and-animations' },
  ],
  'resource-api': [
    { label: 'rxResource & Observable Integration', route: '/angular/resource-api/rxresource-and-observable-integration' },
    { label: 'Resource Reload & Polling Patterns', route: '/angular/resource-api/resource-reload-and-polling-patterns' },
    { label: 'Testing resource()-Based Components', route: '/angular/resource-api/testing-resource-based-components' },
  ],
  'ngrx-signals': [
    { label: 'withEntities — Filtering, Pagination & Sorting', route: '/angular/ngrx-signals/withentities-filtering-pagination-sorting' },
    { label: 'Testing NgRx Signal Stores', route: '/angular/ngrx-signals/testing-ngrx-signal-stores' },
    { label: 'Signal Store DevTools & Hooks Cleanup', route: '/angular/ngrx-signals/signal-store-devtools-and-hooks-cleanup' },
  ],
  'dynamic-forms': [
    { label: 'Nested & Array Schema Fields', route: '/angular/dynamic-forms/nested-and-array-schema-fields' },
    { label: 'Schema-Driven Cross-Field & Async Validation', route: '/angular/dynamic-forms/schema-driven-cross-field-and-async-validation' },
    { label: 'Custom Field Renderer Registry Pattern', route: '/angular/dynamic-forms/custom-field-renderer-registry-pattern' },
  ],
  'route-resolvers': [
    { label: 'Testing Route Resolvers', route: '/angular/route-resolvers/testing-route-resolvers' },
    { label: 'runGuardsAndResolvers & Resolver Caching', route: '/angular/route-resolvers/run-guards-and-resolvers-caching' },
    { label: 'Named Outlet Lifecycle & Detail Drawer Pattern', route: '/angular/route-resolvers/named-outlet-lifecycle-and-detail-drawer-pattern' },
  ],
  'preloading': [
    { label: 'Priority-Tiered Preloading with Delay', route: '/angular/preloading/priority-tiered-preloading-with-delay' },
    { label: 'Testing Preloading Strategies', route: '/angular/preloading/testing-preloading-strategies' },
    { label: 'Measuring Preload Effectiveness', route: '/angular/preloading/measuring-preload-effectiveness' },
  ],
  'route-guards': [
    { label: 'canActivateChild for Nested Admin Sections', route: '/angular/route-guards/canactivatechild-for-nested-admin-sections' },
    { label: 'Tracing Guard Execution Order', route: '/angular/route-guards/tracing-guard-execution-order' },
    { label: 'Async Guards with a Navigation Loading Indicator', route: '/angular/route-guards/async-guards-with-navigation-loading-indicator' },
  ],
  'ng-image': [
    { label: 'Custom Loader with Blur-Up LQIP Placeholder', route: '/angular/ng-image/custom-loader-with-blur-up-lqip-placeholder' },
    { label: 'Testing Components That Use NgOptimizedImage', route: '/angular/ng-image/testing-components-that-use-ngoptimizedimage' },
    { label: 'Measuring LCP Impact with PerformanceObserver', route: '/angular/ng-image/measuring-lcp-impact-with-performanceobserver' },
  ],
  'destroy-ref': [
    { label: 'Testing DestroyRef Cleanup and takeUntilDestroyed', route: '/angular/destroy-ref/testing-destroyref-cleanup-and-takeuntildestroyed' },
    { label: 'runInInjectionContext for Composables Outside Construction', route: '/angular/destroy-ref/runininjectioncontext-for-composables-outside-construction' },
    { label: 'Wrapping a Non-Observable Third-Party API', route: '/angular/destroy-ref/wrapping-a-non-observable-third-party-api' },
  ],
  'linked-signal': [
    { label: 'Testing linkedSignal Reset Behavior', route: '/angular/linked-signal/testing-linkedsignal-reset-behavior' },
    { label: 'linkedSignal with resource() for Editable Drafts', route: '/angular/linked-signal/linkedsignal-with-resource-for-editable-drafts' },
    { label: 'Debugging Unexpected linkedSignal Resets', route: '/angular/linked-signal/debugging-unexpected-linkedsignal-resets' },
  ],
  'zoneless': [
    { label: 'Auditing a Codebase for Zoneless Readiness', route: '/angular/zoneless/auditing-a-codebase-for-zoneless-readiness' },
    { label: 'Zoneless SSR and Incremental Hydration', route: '/angular/zoneless/zoneless-ssr-and-incremental-hydration' },
    { label: 'When ngZone.run() Is Actually Unnecessary', route: '/angular/zoneless/when-ngzone-run-is-actually-unnecessary' },
  ],
  'signal-effects': [
    { label: 'Testing Signal Effects and Cleanup', route: '/angular/signal-effects/testing-signal-effects-and-cleanup' },
    { label: 'afterRenderEffect for DOM Measurements', route: '/angular/signal-effects/afterrendereffect-for-dom-measurements' },
    { label: 'Debouncing Effects for Expensive Side Effects', route: '/angular/signal-effects/debouncing-effects-for-expensive-side-effects' },
  ],
  'typed-forms': [
    { label: 'Testing Typed Reactive Forms', route: '/angular/typed-forms/testing-typed-reactive-forms' },
    { label: 'Writing Type-Safe Custom Validators', route: '/angular/typed-forms/writing-type-safe-custom-validators' },
    { label: 'Populating a Typed Form from resource()', route: '/angular/typed-forms/populating-a-typed-form-from-resource' },
  ],
  'host-directives': [
    { label: 'Testing Components That Use hostDirectives', route: '/angular/host-directives/testing-components-that-use-hostdirectives' },
    { label: 'Coordinating Multiple Stacked Host Directives', route: '/angular/host-directives/coordinating-multiple-stacked-host-directives' },
    { label: 'Optional Host Directive Injection for Shared Components', route: '/angular/host-directives/optional-host-directive-injection-for-shared-components' },
  ],
  'let-template-vars': [
    { label: 'Testing @let-Driven Templates', route: '/angular/let-template-vars/testing-let-driven-templates' },
    { label: 'Profiling @let Recompute Cost', route: '/angular/let-template-vars/profiling-let-recompute-cost' },
    { label: '@let Inside ng-template and Structural Directives', route: '/angular/let-template-vars/let-inside-ng-template-scope-closure' },
  ],
  'standalone-migration': [
    { label: 'Testing Hybrid Standalone and NgModule Components', route: '/angular/standalone-migration/testing-hybrid-standalone-and-ngmodule-components' },
    { label: 'SCAM Pattern — Incremental Migration Walkthrough', route: '/angular/standalone-migration/scam-pattern-incremental-migration-walkthrough' },
    { label: 'Debugging NullInjectorError After Migration', route: '/angular/standalone-migration/debugging-nullinjectorerror-after-migration' },
  ],
  'error-handling-patterns': [
    { label: 'Testing a Layered Error Handling System', route: '/angular/error-handling-patterns/testing-a-layered-error-handling-system' },
    { label: 'Retry with Exponential Backoff and a Give-Up State', route: '/angular/error-handling-patterns/retry-with-exponential-backoff-and-give-up' },
    { label: 'Recovering from Component Rendering Errors', route: '/angular/error-handling-patterns/recovering-from-component-rendering-errors' },
  ],
  'msw': [
    { label: 'Testing Auth Interceptor Flows with MSW', route: '/angular/msw/testing-auth-interceptor-flows-with-msw' },
    { label: 'Testing Loading States with MSW delay()', route: '/angular/msw/testing-loading-states-with-msw-delay' },
    { label: 'Debugging Unhandled Requests and Query-Param Matching', route: '/angular/msw/debugging-unhandled-requests-and-query-param-matching' },
  ],
  'accessibility': [
    { label: 'Automated Accessibility Testing with jest-axe', route: '/angular/accessibility/automated-accessibility-testing-with-jest-axe' },
    { label: 'Building a Reusable Route-Change Focus Management Service', route: '/angular/accessibility/building-a-reusable-route-change-focus-management-service' },
    { label: 'Testing Focus Trap and Restoration in Modals', route: '/angular/accessibility/testing-focus-trap-and-restoration-in-modals' },
  ],
  'micro-frontends': [
    { label: 'Testing Cross-MFE Communication with a Mocked Event Bus', route: '/angular/micro-frontends/testing-cross-mfe-communication-with-a-mocked-event-bus' },
    { label: 'Debugging Duplicate Angular Runtime Issues', route: '/angular/micro-frontends/debugging-duplicate-angular-runtime-issues' },
    { label: 'CSS Style Isolation with ShadowDom Encapsulation', route: '/angular/micro-frontends/css-style-isolation-with-shadowdom-encapsulation' },
  ],
  'angular-devtools': [
    { label: 'Building a "Why Did This Render?" Debug Helper', route: '/angular/angular-devtools/building-a-why-did-this-render-debug-helper' },
    { label: 'Safely Enabling DevTools on Staging', route: '/angular/angular-devtools/safely-enabling-devtools-on-staging' },
    { label: 'Turning a Profiler Finding into a Regression Test', route: '/angular/angular-devtools/turning-a-profiler-finding-into-a-regression-test' },
  ],
  'bundle-optimization': [
    { label: 'Testing @defer Blocks with DeferBlockFixture', route: '/angular/bundle-optimization/testing-defer-blocks-with-deferblockfixture' },
    { label: 'Detecting Duplicate Dependencies Across Lazy Chunks', route: '/angular/bundle-optimization/detecting-duplicate-dependencies-across-lazy-chunks' },
    { label: 'Automated Bundle Budget Enforcement in CI', route: '/angular/bundle-optimization/automated-bundle-budget-enforcement-in-ci' },
  ],
  'wizard-form': [
    { label: 'Deep-Linking Wizard Steps with Query Params', route: '/angular/wizard-form/deep-linking-wizard-steps-with-query-params' },
    { label: 'Angular CDK Stepper vs a Hand-Rolled Wizard', route: '/angular/wizard-form/cdk-stepper-vs-hand-rolled-wizard' },
    { label: 'Testing Wizard Steps in Isolation', route: '/angular/wizard-form/testing-wizard-steps-in-isolation' },
  ],
  'web-workers': [
    { label: 'Testing Components That Use Web Workers', route: '/angular/web-workers/testing-components-that-use-web-workers' },
    { label: 'Building a Worker Pool for Parallel Task Dispatch', route: '/angular/web-workers/building-a-worker-pool-for-parallel-task-dispatch' },
    { label: 'Debugging and Profiling Web Workers in DevTools', route: '/angular/web-workers/debugging-and-profiling-web-workers-in-devtools' },
  ],
  'pwa': [
    { label: 'Testing Update Prompts and Install Banners', route: '/angular/pwa/testing-update-prompts-and-install-banners' },
    { label: 'Handling Unrecoverable State and Manual Update Checks', route: '/angular/pwa/handling-unrecoverable-state-and-manual-update-checks' },
    { label: 'SPA Routing Pitfalls: navigationUrls and the App-Shell Fallback', route: '/angular/pwa/spa-routing-pitfalls-navigationurls-and-app-shell-fallback' },
  ],
  'i18n': [
    { label: 'Testing Components That Use Transloco and Signal-Based i18n', route: '/angular/i18n/testing-components-that-use-transloco-and-signal-i18n' },
    { label: 'Building RTL Layout Support with Logical CSS Properties', route: '/angular/i18n/building-rtl-layout-support-with-logical-css-properties' },
    { label: 'SSR Locale Detection and Avoiding Hydration Mismatches', route: '/angular/i18n/ssr-locale-detection-and-avoiding-hydration-mismatches' },
  ],
  'e2e': [
    { label: 'Reusing Authentication State Across Tests with storageState', route: '/angular/e2e/reusing-authentication-state-across-tests-with-storagestate' },
    { label: 'Visual Regression Testing with Screenshot Comparisons', route: '/angular/e2e/visual-regression-testing-with-screenshot-comparisons' },
    { label: 'Debugging Flaky Tests: Isolation, Retries, and Sharding', route: '/angular/e2e/debugging-flaky-tests-isolation-retries-and-sharding' },
  ],
  'harnesses': [
    { label: 'Composing Nested Harnesses with getChildLoader', route: '/angular/harnesses/composing-nested-harnesses-with-getchildloader' },
    { label: 'Publishing Harnesses as a Public Testing Entry Point', route: '/angular/harnesses/publishing-harnesses-as-a-librarys-public-testing-entry-point' },
    { label: 'Debugging Harness Failures: Common Causes and Diagnosis', route: '/angular/harnesses/debugging-harness-failures-common-causes-and-diagnosis' },
  ],
  'ssr': [
    { label: 'Debugging Hydration Mismatches Step by Step', route: '/angular/ssr/debugging-hydration-mismatches-step-by-step' },
    { label: 'Testing SSR-Safe Components Without a Real Server', route: '/angular/ssr/testing-ssr-safe-components-without-a-real-server' },
    { label: 'Incremental Hydration Triggers: Interaction, Viewport, and Timer', route: '/angular/ssr/incremental-hydration-triggers-interaction-viewport-and-timer' },
  ],
  'basics': [
    { label: 'Nullable Value Types: int?, HasValue, and Null-Coalescing', route: '/csharp/basics/nullable-value-types-hasvalue-and-null-coalescing-operators' },
    { label: 'Checked and Unchecked Arithmetic: Detecting Integer Overflow', route: '/csharp/basics/checked-and-unchecked-arithmetic-detecting-integer-overflow' },
    { label: 'Span<T> and stackalloc: Parsing Without Heap Allocations', route: '/csharp/basics/spant-and-stackalloc-parsing-without-heap-allocations' },
  ],
  'oop': [
    { label: 'Testing Polymorphic Code: Mocking Interfaces and Verifying Virtual Dispatch', route: '/csharp/oop/testing-polymorphic-code-mocking-interfaces-and-verifying-virtual-dispatch' },
    { label: 'Virtual Member Calls from Constructors: An Initialization-Order Footgun', route: '/csharp/oop/virtual-member-calls-from-constructors-an-initialization-order-footgun' },
    { label: 'Explicit Interface Implementation: Resolving Name Collisions', route: '/csharp/oop/explicit-interface-implementation-resolving-name-collisions' },
  ],
  'records': [
    { label: 'Polymorphic JSON Serialization of Record Hierarchies', route: '/csharp/records/polymorphic-json-serialization-of-record-hierarchies-with-jsonderivedtype' },
    { label: 'Positional Pattern Matching with Records', route: '/csharp/records/positional-pattern-matching-with-records-deconstruction-in-switch-expressions' },
    { label: 'Testing Records: Equality, Hash Codes, and Constructor Validation', route: '/csharp/records/testing-records-equality-hash-codes-and-constructor-validation' },
  ],
  'generics': [
    { label: 'Testing Generic Code Across Multiple Type Arguments', route: '/csharp/generics/testing-generic-code-parameterized-tests-across-multiple-type-arguments' },
    { label: 'Generic Attributes (C# 11): Type-Safe Custom Attributes', route: '/csharp/generics/generic-attributes-c-11-type-safe-custom-attributes' },
    { label: 'Writing Your Own Static Abstract Interface Members', route: '/csharp/generics/writing-your-own-static-abstract-interface-members' },
  ],
  'collections': [
    { label: 'Writing Custom IEqualityComparer and IComparer Implementations', route: '/csharp/collections/writing-custom-iequalitycomparer-and-icomparer-implementations' },
    { label: 'FrozenDictionary and FrozenSet: Optimizing for Read-Heavy Lookups', route: '/csharp/collections/frozendictionary-and-frozenset-optimizing-for-read-heavy-lookups' },
    { label: 'Testing Concurrent Collections: Catching Race Conditions', route: '/csharp/collections/testing-concurrent-collections-catching-race-conditions-in-getoradd' },
  ],
  'linq': [
    { label: 'Writing Custom Lazy LINQ Operators with yield return', route: '/csharp/linq/writing-custom-lazy-linq-operators-with-yield-return' },
    { label: 'Expression Trees: Why EF Core Needs Expression<Func<T,bool>>', route: '/csharp/linq/expression-trees-why-ef-core-needs-expression-func-t-bool-not-func-t-bool' },
    { label: 'Testing LINQ-Based Repository Methods with EF Core In-Memory', route: '/csharp/linq/testing-linq-based-repository-methods-with-ef-core-in-memory' },
  ],
  'async': [
    { label: 'Testing Async Code: Verifying Cancellation and Task Failure Behavior', route: '/csharp/async/testing-async-code-verifying-cancellation-and-task-failure-behavior' },
    { label: 'IAsyncDisposable and await using: Async Resource Cleanup', route: '/csharp/async/iasyncdisposable-and-await-using-async-resource-cleanup' },
    { label: 'Producer/Consumer Pipelines with System.Threading.Channels', route: '/csharp/async/producer-consumer-pipelines-with-system-threading-channels' },
  ],
  'null-safety': [
    { label: 'Enforcing Nullable Warnings as Build Errors', route: '/csharp/null-safety/enforcing-nullable-warnings-as-build-errors' },
    { label: 'Nullable Reference Types with Generic Type Parameters', route: '/csharp/null-safety/nullable-reference-types-with-generic-type-parameters' },
    { label: 'required Properties and System.Text.Json Deserialization', route: '/csharp/null-safety/required-properties-and-system-text-json-deserialization' },
  ],
  'pattern-matching': [
    { label: 'Testing Exhaustiveness with Reflection-Based Coverage Tests', route: '/csharp/pattern-matching/testing-exhaustiveness-catching-new-subtypes-with-reflection-based-coverage-tests' },
    { label: 'Pattern Matching in EF Core LINQ Queries', route: '/csharp/pattern-matching/pattern-matching-in-ef-core-linq-queries-what-translates-to-sql-and-what-throws' },
    { label: 'How the Compiler Lowers Property Patterns', route: '/csharp/pattern-matching/how-the-compiler-lowers-property-patterns-repeated-access-and-performance' },
  ],
  'exceptions': [
    { label: 'Testing Exception Filters', route: '/csharp/exceptions/testing-exception-filters-verifying-when-predicate-logic' },
    { label: 'AppDomain.UnhandledException and TaskScheduler.UnobservedTaskException', route: '/csharp/exceptions/appdomain-unhandledexception-and-taskscheduler-unobservedtaskexception' },
    { label: 'Why Exceptions Are Slow', route: '/csharp/exceptions/why-exceptions-are-slow-stack-walking-first-chance-exceptions' },
  ],
  'delegates': [
    { label: "Testing Events: Assert.Raises", route: '/csharp/delegates/testing-events-xunit-assert-raises-multicast-behavior' },
    { label: 'How Delegate Equality Actually Works', route: '/csharp/delegates/how-delegate-equality-actually-works-target-method-pairs' },
    { label: 'async void Event Handlers', route: '/csharp/delegates/async-void-event-handlers-why-exceptions-vanish' },
  ],
  'fields': [
    { label: 'Testing Field Thread-Safety', route: '/csharp/fields/testing-field-thread-safety-race-conditions-increment-vs-interlocked' },
    { label: 'Static Field Initialization Order', route: '/csharp/fields/static-field-initialization-order-beforefieldinit' },
    { label: 'AsyncLocal: Correct Alternative to Static Fields', route: '/csharp/fields/asynclocal-correct-alternative-to-static-fields-for-per-request-state' },
  ],
  'methods': [
    { label: 'Testing Logic Inside Local Functions', route: '/csharp/methods/testing-logic-inside-local-functions-when-to-promote' },
    { label: 'The in Parameter Defensive-Copy Trap', route: '/csharp/methods/in-parameter-defensive-copy-trap' },
    { label: 'Caller Info Attributes', route: '/csharp/methods/caller-info-attributes-callermembername-callerlinenumber' },
  ],
  'type-conversion': [
    { label: 'Testing Conversion Operators and Overflow Boundaries', route: '/csharp/type-conversion/testing-conversion-operators-and-overflow-boundaries' },
    { label: 'User-Defined Conversion Chaining', route: '/csharp/type-conversion/user-defined-conversion-chaining-one-operator-limit' },
    { label: 'Compile-Time Constant Overflow', route: '/csharp/type-conversion/compile-time-constant-overflow-always-checked' },
  ],
  'constructors': [
    { label: 'Testing Constructor Validation and Chaining', route: '/csharp/constructors/testing-constructor-validation-and-chaining' },
    { label: 'Primary Constructor Parameter Capture', route: '/csharp/constructors/primary-constructor-parameter-capture-field-vs-fixed' },
    { label: 'Diagnosing TypeInitializationException', route: '/csharp/constructors/diagnosing-typeinitializationexception-inner-exception' },
  ],
  'properties-indexers': [
    { label: 'Testing Computed Properties and Indexers', route: '/csharp/properties-indexers/testing-computed-properties-and-indexers' },
    { label: 'init Accessors and readonly Fields', route: '/csharp/properties-indexers/init-accessors-and-readonly-fields-assignment-window' },
    { label: 'Indexer Initializer Syntax', route: '/csharp/properties-indexers/indexer-initializer-syntax-without-add' },
  ],
  'namespaces': [
    { label: 'Detecting Unused using Directives', route: '/csharp/namespaces/detecting-unused-using-directives-ide0005' },
    { label: 'extern alias', route: '/csharp/namespaces/extern-alias-resolving-assembly-type-name-collisions' },
    { label: 'Resolving CS0104 Ambiguous Type References', route: '/csharp/namespaces/resolving-cs0104-ambiguous-using-directives' },
  ],
  'inheritance': [
    { label: 'Testing the Hiding Trap: new vs override', route: '/csharp/inheritance/testing-the-hiding-trap-new-vs-override' },
    { label: 'How sealed Enables Devirtualization', route: '/csharp/inheritance/how-sealed-enables-devirtualization' },
    { label: 'Covariant Return Types: The Hidden Bridge Method', route: '/csharp/inheritance/covariant-return-types-hidden-bridge-method' },
  ],
  'abstract-interfaces': [
    { label: 'Testing Default Interface Method Resolution', route: '/csharp/abstract-interfaces/testing-default-interface-method-resolution' },
    { label: 'Default Interface Method Diamond Problem', route: '/csharp/abstract-interfaces/default-interface-method-diamond-problem' },
    { label: 'static abstract Members and Generic Constraints', route: '/csharp/abstract-interfaces/static-abstract-members-generic-constraint-requirement' },
  ],
  'static-enums': [
    { label: 'Testing Flags Enums', route: '/csharp/static-enums/testing-flags-enums-reflection-based-power-of-two-guard' },
    { label: 'Modern Partial Methods (C# 9+)', route: '/csharp/static-enums/modern-partial-methods-return-types-mandatory-implementation' },
    { label: 'Enum Value Stability', route: '/csharp/static-enums/enum-value-stability-serialization-compatibility' },
  ],
  'structures': [
    { label: 'Testing the Struct-Copy Mutation Trap', route: '/csharp/structures/testing-the-struct-copy-mutation-trap' },
    { label: 'ref struct Interfaces (C# 13)', route: '/csharp/structures/ref-struct-interfaces-generic-constraint-dispatch' },
    { label: 'Array vs List vs foreach Struct Mutation', route: '/csharp/structures/array-vs-list-vs-foreach-struct-mutation' },
  ],
  'system-object': [
    { label: 'Testing the Equals/GetHashCode Contract', route: '/csharp/system-object/testing-the-equals-gethashcode-contract' },
    { label: 'Why GetHashCode Is Never Stable Across Runs', route: '/csharp/system-object/gethashcode-instability-across-process-runs' },
    { label: 'Record Equality and EqualityContract', route: '/csharp/system-object/record-equality-and-equalitycontract' },
  ],
  'extension-methods': [
    { label: 'Testing for Extension Method Shadowing', route: '/csharp/extension-methods/testing-for-extension-method-shadowing' },
    { label: 'Resolving Extension Method Ambiguity', route: '/csharp/extension-methods/resolving-extension-method-ambiguity-cs0121' },
    { label: 'Extension Methods on Structs: this in T', route: '/csharp/extension-methods/extension-methods-on-structs-this-in-t-receiver' },
  ],
  'tuples': [
    { label: 'Testing Tuple-Returning Methods', route: '/csharp/tuples/testing-tuple-returning-methods-deconstruction-assertions' },
    { label: '8-Element Limit and TRest Chaining', route: '/csharp/tuples/valuetuple-8-element-limit-trest-chaining-mechanism' },
    { label: 'Renaming a Tuple Field', route: '/csharp/tuples/renaming-tuple-field-breaks-some-callers-not-others' },
  ],
  'arrays': [
    { label: 'Testing Array Equality', route: '/csharp/arrays/testing-array-equality-sequenceequal-not-equals' },
    { label: 'The Real Cost of Array Covariance', route: '/csharp/arrays/real-cost-of-array-covariance-runtime-type-check-every-store' },
    { label: 'params Arrays Silently Allocate', route: '/csharp/arrays/params-array-hidden-allocation-every-call-span-fix' },
  ],
  'strings-datetime': [
    { label: 'Testing Culture-Sensitive Code', route: '/csharp/strings-datetime/testing-culture-sensitive-code-turkish-locale-ci-failures' },
    { label: 'The Interning Boundary', route: '/csharp/strings-datetime/interning-boundary-which-strings-interned-automatically' },
    { label: 'string.Create and Span<char>', route: '/csharp/strings-datetime/string-create-span-char-allocation-free-building' },
  ],
  'io-serialization': [
    { label: 'Testing File I/O', route: '/csharp/io-serialization/testing-file-io-without-touching-real-filesystem-abstraction' },
    { label: 'Where the JsonSerializerOptions Cache Lives', route: '/csharp/io-serialization/where-jsonserializeroptions-cache-lives-cold-cache-per-instance' },
    { label: 'Sync-over-Async File I/O Deadlocks', route: '/csharp/io-serialization/sync-over-async-file-io-deadlocks-result-hangs-forever' },
  ],
  'gc-disposable': [
    { label: 'Testing That Dispose() Was Called', route: '/csharp/gc-disposable/testing-dispose-actually-called-spy-wrapper-double-dispose' },
    { label: 'Pattern-Based Disposal on ref structs', route: '/csharp/gc-disposable/pattern-based-disposal-ref-structs-cannot-implement-idisposable' },
    { label: 'Disposed but Still Running', route: '/csharp/gc-disposable/disposed-but-still-running-event-handler-fire-and-forget-outlives-dispose' },
  ],
  'threading': [
    { label: 'Testing for Race Conditions', route: '/csharp/threading/testing-race-conditions-stress-testing-concurrent-code' },
    { label: 'The Old lock Codegen Bug', route: '/csharp/threading/old-lock-codegen-bug-monitor-enter-ref-bool-taken' },
    { label: 'Lazy Thread-Safety Modes', route: '/csharp/threading/lazy-hidden-thread-safety-modes-concurrentdictionary-fix-not-free' },
  ],
  'tasks': [
    { label: 'Testing Async Timing Deterministically', route: '/csharp/tasks/testing-async-timing-deterministic-controllable-taskcompletionsource' },
    { label: 'ValueTask: The One-Await Rule', route: '/csharp/tasks/valuetask-await-once-rule-when-worth-complexity' },
    { label: 'WhenAll Does Not Start Tasks in Parallel', route: '/csharp/tasks/whenall-doesnt-start-tasks-parallel-just-awaits-running' },
  ],
  'reflection': [
    { label: 'Testing Reflection-Based Code', route: '/csharp/reflection/testing-reflection-code-attribute-discovery-cache-behavior' },
    { label: 'Beyond Expression Trees', route: '/csharp/reflection/beyond-expression-trees-dynamicmethod-reflection-emit' },
    { label: 'Generic Type Reflection Traps', route: '/csharp/reflection/generic-type-reflection-traps-generictypedefinition' },
  ],
  'iterators': [
    { label: 'Testing That an Iterator Is Lazy', route: '/csharp/iterators/testing-iterator-actually-lazy-side-effects-not-run-before-enumeration' },
    { label: 'Why GetEnumerator Sometimes Returns Itself', route: '/csharp/iterators/why-getenumerator-sometimes-returns-itself-thread-id-check' },
    { label: 'Iterator Exceptions and Stack Traces', route: '/csharp/iterators/iterator-exceptions-stack-traces-movenext-not-call-site' },
  ],
  'functional-csharp': [
    { label: 'Testing Railway-Oriented Pipelines', route: '/csharp/functional-csharp/testing-railway-pipelines-asserting-which-step-failed' },
    { label: 'Proving Result Is a Genuine Monad', route: '/csharp/functional-csharp/proving-result-genuine-monad-three-monad-laws' },
    { label: 'Result Equality Traps', route: '/csharp/functional-csharp/result-equality-traps-never-equal-by-default' },
  ],
  'regex': [
    { label: 'Testing Regex Patterns for ReDoS', route: '/csharp/regex/testing-regex-redos-proving-matchtimeout-fires' },
    { label: 'Inside the Backtracking Engine', route: '/csharp/regex/inside-backtracking-engine-nested-quantifiers-traced-step-by-step' },
    { label: 'The Unicode Digit Trap', route: '/csharp/regex/unicode-digit-trap-d-matches-more-than-ascii' },
  ],
  'channels': [
    { label: 'Testing Channel-Based Pipelines', route: '/csharp/channels/testing-channel-pipelines-without-mocks-real-channel-test-double' },
    { label: 'How ReadAllAsync Detects Completion', route: '/csharp/channels/how-readallasync-detects-completion-waittoreadasync-tryread' },
    { label: 'The Rendezvous Channel', route: '/csharp/channels/rendezvous-channel-capacity-zero-writeasync-waits-for-reader' },
  ],
  'unit-testing': [
    { label: 'Testing Your Test Doubles', route: '/csharp/unit-testing/testing-your-test-doubles-mock-setup-matches-production-behavior' },
    { label: 'Why xUnit Creates a New Instance Per Test', route: '/csharp/unit-testing/why-xunit-creates-new-instance-per-test-classfixture' },
    { label: 'TimeProvider and FakeTimeProvider', route: '/csharp/unit-testing/timeprovider-faketimeprovider-deterministic-time-dependent-tests' },
  ],
  'expression-trees': [
    { label: 'Testing Dynamic Expression Trees', route: '/csharp/expression-trees/testing-dynamic-expression-trees-asserting-tree-shape-not-compiled-result' },
    { label: 'The ParameterExpression Identity Problem', route: '/csharp/expression-trees/parameterexpression-identity-problem-andalso-unusable-lambda' },
    { label: 'Captured Variables Are Not ConstantExpression', route: '/csharp/expression-trees/captured-variables-not-constantexpression-hidden-closure-class' },
  ],
  'dynamic': [
    { label: 'Testing DynamicObject Wrappers', route: '/csharp/dynamic/testing-dynamicobject-wrappers-trygetmember-fallback-fail-paths' },
    { label: 'Inside the DLR Call Site', route: '/csharp/dynamic/inside-dlr-call-site-rule-cache-slow-path-fallback' },
    { label: 'Anonymous Types as dynamic', route: '/csharp/dynamic/anonymous-types-as-dynamic-assembly-boundary-hidden-cost' },
  ],
  'source-generators': [
    { label: 'Testing Source Generators', route: '/csharp/source-generators/testing-source-generators-in-memory-pipeline-snapshotting-output' },
    { label: 'Why Symbols Defeat Incremental Caching', route: '/csharp/source-generators/why-symbols-defeat-incremental-caching-leak-compilation' },
    { label: 'Debugging a Source Generator', route: '/csharp/source-generators/debugging-source-generator-debugger-launch-technique' },
  ],
  'span-memory': [
    { label: 'Testing Methods That Accept Span<T>', route: '/csharp/span-memory/testing-methods-accepting-span-cannot-wrap-call-in-lambda' },
    { label: 'What Is Actually Inside a Span<T>', route: '/csharp/span-memory/whats-actually-inside-span-ref-field-fast-restricted' },
    { label: 'ArrayPool Rent Returns Dirty Memory', route: '/csharp/span-memory/arraypool-rent-returns-dirty-memory-stale-data-leak' },
  ],
  'di-dotnet': [
    { label: 'Testing Your DI Container Configuration', route: '/csharp/di-dotnet/testing-di-container-configuration-every-registration-resolves' },
    { label: 'How ValidateScopes Catches Captive Dependencies', route: '/csharp/di-dotnet/how-validatescopes-catches-captive-dependency-root-child-scope' },
    { label: 'Multiple Implementations, Single T Injection', route: '/csharp/di-dotnet/multiple-implementations-single-t-injection-returns-last' },
  ],
  'json-advanced': [
    { label: 'Testing Custom JsonConverter Round-Trips', route: '/csharp/json-advanced/testing-custom-jsonconverter-round-trips-exact-json-shape' },
    { label: 'Every Generic Instantiation Needs Its Own JsonSerializable', route: '/csharp/json-advanced/generic-instantiation-needs-own-jsonserializable-source-gen' },
    { label: 'Unknown Discriminator Values Throw at Deserialize', route: '/csharp/json-advanced/unknown-type-discriminator-throws-jsonexception-not-forward-compatible' },
  ],
  'unsafe-pointers': [
    { label: 'Testing the Safe Wrapper Pattern', route: '/csharp/unsafe-pointers/testing-safe-wrapper-dispose-idempotent-use-after-dispose-throws' },
    { label: 'Why a Pinned Object Fragments the Heap', route: '/csharp/unsafe-pointers/pinned-object-fragments-heap-blocks-gc-compaction-neighbors' },
    { label: 'stackalloc Inside a Loop Never Frees Between Iterations', route: '/csharp/unsafe-pointers/stackalloc-inside-loop-never-frees-between-iterations-stackoverflow' },
  ],
  'native-aot': [
    { label: 'Testing AOT Compatibility Fast', route: '/csharp/native-aot/testing-aot-compatibility-before-slow-publish-treat-trim-warnings-as-errors' },
    { label: 'DynamicallyAccessedMembers Must Be Re-Declared at Every Level', route: '/csharp/native-aot/dynamicallyaccessedmembers-redeclared-every-level-call-chain' },
    { label: 'Clean Trim Analysis Can Still Fail a Full AOT Publish', route: '/csharp/native-aot/clean-trim-analysis-still-fails-full-aot-publish-different-checks' },
  ],
  'benchmarkdotnet': [
    { label: 'Catching Regressions in CI', route: '/csharp/benchmarkdotnet/catching-performance-regression-ci-committed-baseline-not-eyeballing' },
    { label: 'Why BDN Runs Benchmarks in an Isolated Process', route: '/csharp/benchmarkdotnet/why-bdn-runs-benchmarks-isolated-process-not-in-process' },
    { label: 'When Mean Lies: Bimodal Distributions', route: '/csharp/benchmarkdotnet/when-mean-lies-bimodal-distribution-hides-two-performance-paths' },
  ],
  'pinvoke': [
    { label: 'Testing P/Invoke Code', route: '/csharp/pinvoke/testing-code-calling-pinvoke-wrapping-native-calls-behind-interface' },
    { label: 'Why Blittable Types Skip Marshalling Entirely', route: '/csharp/pinvoke/why-blittable-types-skip-marshalling-pinning-vs-full-marshal-cycle' },
    { label: 'SetLastError Can Be Silently Clobbered', route: '/csharp/pinvoke/setlasterror-silently-clobbered-by-pinvoke-call-in-between' },
  ],
  'dotnet-cli': [
    { label: 'Verifying True Reproducibility', route: '/csharp/dotnet-cli/verifying-build-reproducible-simulating-clean-machine-restore-lock-file' },
    { label: 'How rollForward Picks an SDK Version', route: '/csharp/dotnet-cli/how-rollforward-picks-sdk-version-feature-band-matching-algorithm' },
    { label: 'Local Builds Can Silently Drift From the Lock File', route: '/csharp/dotnet-cli/automatic-restore-doesnt-use-locked-mode-local-builds-drift-from-lock-file' },
  ],
  'whats-new-9-10': [
    { label: 'Testing Record Equality With Collections', route: '/csharp/whats-new-9-10/testing-record-equality-collection-properties-not-list-reference-trap' },
    { label: 'What the Compiler Actually Generates for Type-Sensitive Equality', route: '/csharp/whats-new-9-10/compiler-generates-equalitycontract-virtual-equals-chain-type-sensitive' },
    { label: 'Records as Dictionary Keys Can Silently Break', route: '/csharp/whats-new-9-10/records-as-dictionary-keys-break-when-reference-property-mutated' },
  ],
  'whats-new-11-12': [
    { label: 'Testing Generic Math Across Types', route: '/csharp/whats-new-11-12/testing-generic-math-across-numeric-types-one-suite-every-inumber-implementation' },
    { label: 'How static abstract Members Actually Dispatch', route: '/csharp/whats-new-11-12/how-static-abstract-interface-members-dispatch-compile-time-generic-specialization' },
    { label: 'Primary Constructor Parameters Captured for Object Lifetime', route: '/csharp/whats-new-11-12/primary-constructor-parameter-captured-as-field-object-entire-lifetime' },
  ],
  'whats-new-latest': [
    { label: 'Testing With FakeTimeProvider', route: '/csharp/whats-new-latest/testing-time-dependent-code-with-faketimeprovider-without-sleeping' },
    { label: 'How Dynamic PGO Actually Re-JITs a Method', route: '/csharp/whats-new-latest/how-dynamic-pgo-actually-rejits-tiered-compilation-on-stack-replacement' },
    { label: 'HybridCache Stampede Protection Is Per-Process', route: '/csharp/whats-new-latest/hybridcache-stampede-protection-only-coalesces-within-one-process' },
  ],
  'hosting-startup': [
    { label: 'Testing Environment Branching', route: '/aspnet/hosting-startup/testing-environment-branching-without-real-environment-variable' },
    { label: 'What builder.Build() Actually Seals', route: '/aspnet/hosting-startup/what-builder-build-actually-seals-servicecollection-vs-serviceprovider' },
    { label: 'ApplicationStopping Fires Before Requests Finish Draining', route: '/aspnet/hosting-startup/applicationstopping-fires-before-in-flight-requests-finish-draining' },
  ],
  'middleware': [
    { label: 'Testing Custom Middleware in Isolation', route: '/aspnet/middleware/testing-custom-middleware-isolation-applicationbuilder-no-kestrel' },
    { label: 'How the Middleware Pipeline Is Actually Built', route: '/aspnet/middleware/how-middleware-pipeline-built-requestdelegate-composition-nested-closures' },
    { label: 'OnStarting Callbacks Run in LIFO Order', route: '/aspnet/middleware/onstarting-callbacks-run-lifo-order-last-registered-fires-first' },
  ],
  // NOTE: keyed 'aspnet-routing', NOT bare 'routing' — the Angular hub
  // already owns the bare 'routing' key above (its own /angular/routing
  // subtopics). This is the shared flat SUBTOPICS map's documented
  // collision risk, hit for real here; resolved by hub-prefixing this
  // one entry rather than restructuring the whole map.
  'aspnet-routing': [
    { label: 'Testing Route Precedence', route: '/aspnet/routing/testing-route-precedence-catching-ambiguous-routes-before-production' },
    { label: 'How Route Precedence Is Actually Computed', route: '/aspnet/routing/how-route-precedence-actually-computed-segment-scoring-algorithm' },
    { label: 'A Renamed WithName() Silently Breaks LinkGenerator', route: '/aspnet/routing/typod-renamed-withname-silently-breaks-linkgenerator-no-compile-check' },
  ],
  'configuration': [
    { label: 'Testing Options Validation', route: '/aspnet/configuration/testing-options-validation-actually-rejects-bad-config-not-just-compiles' },
    { label: 'How IOptionsMonitor Actually Detects a File Change', route: '/aspnet/configuration/how-optionsmonitor-detects-file-change-changetoken-propagation' },
    { label: 'OnChange Returns an IDisposable That Must Be Disposed', route: '/aspnet/configuration/onchange-returns-idisposable-must-be-disposed-or-callback-leaks' },
  ],
  // NOTE: keyed 'aspnet-dependency-injection', NOT bare 'dependency-injection'
  // — the Blazor hub already owns a route at the same bare slug
  // ('/blazor/dependency-injection'). No Blazor subtopics exist for it yet,
  // but pre-emptively hub-prefixing avoids repeating the exact 'routing'
  // collision hit above the moment Blazor's own DI subtopics are added.
  'aspnet-dependency-injection': [
    { label: 'Testing a Fresh Scope Per BackgroundService Iteration', route: '/aspnet/dependency-injection/testing-servicescopefactory-backgroundservice-genuinely-fresh-scope' },
    { label: 'CreateAsyncScope() vs CreateScope() Internally', route: '/aspnet/dependency-injection/createasyncscope-vs-createscope' },
    { label: 'ActivatorUtilities Bypasses ValidateOnBuild', route: '/aspnet/dependency-injection/activatorutilities-bypasses-validateonbuild' },
  ],
  // NOTE: keyed 'aspnet-logging', NOT bare 'logging' — the Node.js hub
  // (/node/logging) and the DevOps hub (/devops/logging) already share
  // this exact bare route slug. Pre-emptively hub-prefixing avoids
  // repeating the 'routing' collision the moment either of those hubs
  // gets its own Phase 10 subtopics for logging.
  'aspnet-logging': [
    { label: 'Testing Structured Log Properties With a Fake ILogger', route: '/aspnet/logging/testing-structured-log-properties-with-fake-logger' },
    { label: 'How BeginScope Propagates Ambient Context via AsyncLocal', route: '/aspnet/logging/how-beginscope-propagates-ambient-context-asynclocal' },
    { label: 'Reusing an EventId Across LoggerMessage Methods', route: '/aspnet/logging/reusing-eventid-across-loggermessage-methods-compiles-cleanly' },
  ],
  'static-files': [
    { label: 'Testing Magic Number Validation With Fake Byte Streams', route: '/aspnet/static-files/testing-magic-number-validation-fake-byte-streams' },
    { label: 'How UseStaticFiles Computes ETag', route: '/aspnet/static-files/how-usestaticfiles-computes-etag-touching-file-busts-cache' },
    { label: 'StartsWith Path Traversal Guard Bypass', route: '/aspnet/static-files/startswith-path-traversal-guard-sibling-directory-bypass' },
  ],
  'controllers': [
    { label: 'Testing the Null-Return 200 OK Bug', route: '/aspnet/controllers/testing-actionresult-catches-null-returns-200-ok-bug' },
    { label: 'How Binding Source Inference Decides FromBody vs FromQuery', route: '/aspnet/controllers/how-binding-source-inference-decides-frombody-vs-fromquery' },
    { label: 'CreatedAtAction’s Runtime Failure Mode', route: '/aspnet/controllers/createdataction-throws-runtime-despite-nameof-safety' },
  ],
  'minimal-apis': [
    { label: 'Testing an Endpoint Filter in Isolation', route: '/aspnet/minimal-apis/testing-endpoint-filter-isolation-no-test-server' },
    { label: 'A Forgotten DI Registration Silently Falls Through', route: '/aspnet/minimal-apis/forgotten-di-registration-silently-falls-through-body-binding' },
    { label: 'LinkGenerator’s Silent Null Return', route: '/aspnet/minimal-apis/linkgenerator-getpathbyname-returns-null-instead-of-throwing' },
  ],
  'model-binding': [
    { label: 'Testing IParsable’s TryParse for Graceful Failure', route: '/aspnet/model-binding/testing-iparsable-tryparse-graceful-failure-daterange' },
    { label: 'How Recursive Nested Validation Walks the Object Graph', route: '/aspnet/model-binding/how-recursive-nested-validation-walks-object-graph-circular-reference' },
    { label: 'FluentValidation’s SetValidator DI Bypass', route: '/aspnet/model-binding/fluentvalidation-setvalidator-new-silently-bypasses-di' },
  ],
  'filters': [
    { label: 'Testing That Filters Execute in the Documented Order', route: '/aspnet/filters/testing-filters-execute-in-documented-pipeline-order' },
    { label: 'Why next() Runs the Action Even After Result Is Set', route: '/aspnet/filters/why-next-runs-action-even-after-context-result-is-set' },
    { label: 'IFilterFactory’s Captive Dependency Risk', route: '/aspnet/filters/ifilterfactory-isreusable-silently-recreates-captive-dependency' },
  ],
  // NOTE: keyed 'aspnet-error-handling', NOT bare 'error-handling' — the
  // JavaScript, Blazor, Node.js, Go, and GraphQL hubs ALL already own a
  // route at the same bare slug. Pre-emptively hub-prefixing avoids
  // repeating the exact 'routing' collision hit earlier the moment any
  // of those hubs get their own error-handling subtopics.
  'aspnet-error-handling': [
    { label: 'Testing the IExceptionHandler Chain Ordering', route: '/aspnet/error-handling/testing-exceptionhandler-chain-ordering-works-as-documented' },
    { label: 'Why the Re-Executed Error Endpoint Must Restore the Status Code', route: '/aspnet/error-handling/why-reexecuted-error-endpoint-must-explicitly-restore-status-code' },
    { label: 'A Handler That Writes Before Returning False Corrupts the Next', route: '/aspnet/error-handling/handler-writes-before-returning-false-corrupts-next-handler' },
  ],
  'openapi-swagger': [
    { label: 'Testing the Spec Catches a TypedResults Regression', route: '/aspnet/openapi-swagger/testing-openapi-spec-catches-typedresults-regression-to-iresult' },
    { label: 'Why the Generator Inspects the Signature, Not the Body', route: '/aspnet/openapi-swagger/why-generator-inspects-signature-not-method-body' },
    { label: 'Generating Clients Against a Live Server Undermines PR Diffs', route: '/aspnet/openapi-swagger/generating-clients-against-live-server-undermines-diffing-prs' },
  ],
  // NOTE: keyed 'aspnet-api-versioning', NOT bare 'api-versioning' — the
  // API Design hub already owns a route at the same bare slug
  // (/api-design/api-versioning). Pre-emptively hub-prefixing avoids
  // repeating the exact 'routing' collision hit earlier the moment that
  // hub gets its own api-versioning subtopics.
  'aspnet-api-versioning': [
    { label: 'Testing That Versioned Endpoints Return Different Shapes', route: '/aspnet/api-versioning/testing-versioned-endpoints-return-genuinely-different-shapes' },
    { label: 'Why Omitting apiVersion Causes an Ambiguous Match', route: '/aspnet/api-versioning/why-omitting-apiversion-constraint-causes-ambiguous-match' },
    { label: 'What Happens When Combined Version Readers Disagree', route: '/aspnet/api-versioning/what-happens-when-combined-version-readers-disagree' },
  ],
  'http-clients': [
    { label: 'Testing Retry Strategy Scope', route: '/aspnet/http-clients/testing-retry-strategy-fires-transient-not-deterministic-errors' },
    { label: 'Why Transient Handlers Are Shared Across a Pool Rotation', route: '/aspnet/http-clients/why-transient-delegatinghandlers-shared-across-pool-rotation' },
    { label: 'AddHedging’s Method-Blindness Risk', route: '/aspnet/http-clients/addhedging-shared-pipeline-can-hedge-non-idempotent-requests' },
  ],
  // NOTE: keyed 'aspnet-grpc', NOT bare 'grpc' — the Go hub already owns
  // a route at the same bare slug (/go/grpc). Pre-emptively hub-prefixing
  // avoids repeating the exact 'routing' collision hit earlier the
  // moment that hub gets its own gRPC subtopics.
  'aspnet-grpc': [
    { label: 'Testing Server-Streaming RPC Cancellation', route: '/aspnet/grpc/testing-server-streaming-rpc-cancellation-stops-mid-stream' },
    { label: 'How proto3 optional Tracks Field Presence', route: '/aspnet/grpc/how-proto3-optional-actually-tracks-field-presence' },
    { label: 'gRPC-Web CORS Needs Allowed Request Headers', route: '/aspnet/grpc/grpc-web-cors-needs-allowed-request-headers-not-exposed' },
  ],
  'ef-core-basics': [
    { label: 'Testing That AsNoTracking Queries Are Genuinely Untracked', route: '/aspnet/ef-core-basics/testing-asnotracking-queries-genuinely-arent-tracked-sqlite' },
    { label: 'How the Change Tracker Snapshot Produces a Minimal UPDATE', route: '/aspnet/ef-core-basics/how-change-tracker-snapshot-produces-minimal-update' },
    { label: 'Reload vs GetDatabaseValuesAsync for Concurrency Recovery', route: '/aspnet/ef-core-basics/reload-discards-edit-getdatabasevaluesasync-preserves-it' },
  ],
  'ef-relationships': [
    { label: 'Testing That DeleteBehavior.Restrict Genuinely Throws', route: '/aspnet/ef-relationships/testing-deletebehavior-restrict-genuinely-throws-sqlite' },
    { label: 'How Skip Navigations Determine Join-Table INSERT/DELETE', route: '/aspnet/ef-relationships/how-skip-navigations-determine-join-table-insert-delete' },
    { label: 'Replacing an OwnsMany Collection Deletes and Reinserts Everything', route: '/aspnet/ef-relationships/replacing-ownsmany-collection-deletes-reinserts-everything' },
  ],
  'ef-performance': [
    { label: 'Testing That ExecuteUpdateAsync Bypasses SaveChanges Interceptors', route: '/aspnet/ef-performance/testing-executeupdateasync-bypasses-savechanges-interceptors' },
    { label: 'What EF.CompileQuery Actually Eliminates', route: '/aspnet/ef-performance/what-ef-compilequery-actually-eliminates' },
    { label: 'A Captured Reference to a Pooled DbContext Leaks Across Requests', route: '/aspnet/ef-performance/captured-reference-pooled-dbcontext-leaks-across-requests' },
  ],
  // NOTE: keyed 'aspnet-caching', NOT bare 'caching' — the Web
  // Performance, Node.js, and System Design hubs all already own routes
  // at the same bare slug. Pre-emptively hub-prefixing avoids repeating
  // the exact 'routing' collision hit earlier the moment any of those
  // hubs get their own caching subtopics.
  'aspnet-caching': [
    { label: 'Testing GetOrCreateAsync Under Concurrent Misses', route: '/aspnet/caching/testing-getorcreateasync-concurrent-misses-factory-runs-twice' },
    { label: 'How IMemoryCache Expiry Is Actually Enforced', route: '/aspnet/caching/how-imemorycache-expiry-actually-enforced-lazy-not-timers' },
    { label: 'Write-Invalidate’s Stale-Repopulation Race', route: '/aspnet/caching/write-invalidate-stale-repopulation-race-ttl-backstop' },
  ],
  // NOTE: keyed 'aspnet-authentication', NOT bare 'authentication' — the
  // Blazor hub already owns a route at the same bare slug
  // (/blazor/authentication). Pre-emptively hub-prefixing avoids
  // repeating the exact 'routing' collision hit earlier.
  'aspnet-authentication': [
    { label: 'Testing JWT ClockSkew — Expired Tokens Still Validate', route: '/aspnet/authentication/testing-jwt-clockskew-expired-token-still-validates' },
    { label: 'Why SetApplicationName Matters With Shared Keys', route: '/aspnet/authentication/why-setapplicationname-matters-shared-dataprotection-keys' },
    { label: 'JWT Claim-Type Mapping — sub Becomes NameIdentifier', route: '/aspnet/authentication/jwt-claim-type-mapping-sub-becomes-nameidentifier' },
  ],
  // NOTE: keyed 'aspnet-authorization', NOT bare 'authorization' — the
  // Service Mesh hub already owns a route at the same bare slug
  // (/service-mesh/authorization).
  'aspnet-authorization': [
    { label: 'Testing Multi-Handler OR Semantics — the Fail() Veto', route: '/aspnet/authorization/testing-multi-handler-or-semantics-fail-veto' },
    { label: 'How Authorization Middleware Combines Default & Fallback Policies', route: '/aspnet/authorization/how-authorization-middleware-combines-default-fallback-policies' },
    { label: 'AllowAnonymous Anywhere Wins — Authorize Cannot Override It', route: '/aspnet/authorization/allowanonymous-anywhere-wins-authorize-cannot-override' },
  ],
  'cors': [
    { label: 'Testing That Preflight Terminates Before Auth Middleware Runs', route: '/aspnet/cors/testing-preflight-bypasses-auth-middleware-terminal-response' },
    { label: 'How the Browser Decides Simple vs Preflight Request', route: '/aspnet/cors/how-browser-decides-simple-vs-preflight-request' },
    { label: 'Misspelled RequireCors Policy Name Fails Silently', route: '/aspnet/cors/misspelled-requirecors-policy-name-fails-silently-no-headers' },
  ],
  // NOTE: keyed 'aspnet-rate-limiting', NOT bare 'rate-limiting' — the
  // Redis hub (/data/redis/rate-limiting) and API Design hub
  // (/architecture/api-design/rate-limiting) already own that bare slug.
  'aspnet-rate-limiting': [
    { label: 'Testing the Fixed-Window Boundary Burst With FakeTimeProvider', route: '/aspnet/rate-limiting/testing-fixed-window-boundary-burst-with-faketimeprovider' },
    { label: 'Concurrency Permit Held Until Response Fully Transmitted', route: '/aspnet/rate-limiting/concurrency-permit-held-until-response-fully-transmitted' },
    { label: 'Partition Factory Runs Once — Tier Upgrade Ignored Until Evicted', route: '/aspnet/rate-limiting/partition-factory-runs-once-tier-upgrade-ignored-until-evicted' },
  ],
  'web-security': [
    { label: 'Testing That Antiforgery Validation Actually Rejects Forged Requests', route: '/aspnet/web-security/testing-antiforgery-token-validation-with-webapplicationfactory' },
    { label: 'Contextual Encoding — HTML Encode Doesn\'t Protect Attributes or JS', route: '/aspnet/web-security/contextual-encoding-html-encode-doesnt-protect-attributes-or-js' },
    { label: 'Missing Separator in StartsWith Check — Sibling-Directory Bypass', route: '/aspnet/web-security/missing-separator-in-startswith-check-allows-sibling-directory-bypass' },
  ],
  'secrets': [
    { label: 'Testing That ValidateOnStart() Fails Fast Via Host StartAsync', route: '/aspnet/secrets/testing-validateonstart-only-fails-fast-via-host-startasync' },
    { label: 'IOptionsMonitor OnChange Never Fires for Env Vars or Key Vault', route: '/aspnet/secrets/ioptionsmonitor-onchange-never-fires-for-env-vars-or-key-vault' },
    { label: 'Pruning Data Protection Keys Invalidates Time-Limited Tokens', route: '/aspnet/secrets/pruning-data-protection-keys-invalidates-still-valid-time-limited-tokens' },
  ],
  // NOTE: keyed 'aspnet-testing', NOT bare 'testing' — Angular's own
  // /angular/testing topic (with its own subtopics), plus React,
  // Node.js, Go, GraphQL, and Terraform hubs, all already own that
  // bare slug.
  'aspnet-testing': [
    { label: 'Testing Role-Based Auth Per Test, Without a New Factory Subclass', route: '/aspnet/testing/testing-role-based-auth-per-test-without-new-factory-subclass' },
    { label: 'Collection Fixtures Silently Disable Parallelism for Grouped Classes', route: '/aspnet/testing/collection-fixtures-silently-disable-parallelism-for-grouped-classes' },
    { label: 'Singleton State in a Shared Factory Leaks Across Test Methods', route: '/aspnet/testing/singleton-state-in-shared-factory-leaks-across-test-methods' },
  ],
  'background-services': [
    { label: 'Testing Periodic Worker Loops With FakeTimeProvider Tick Control', route: '/aspnet/background-services/testing-periodic-worker-loops-with-faketimeprovider-tick-control' },
    { label: 'StartAsync Returns Before ExecuteAsync Actually Completes', route: '/aspnet/background-services/startasync-returns-before-executeasync-actually-completes' },
    { label: 'Channel Writer Never Completed Loses Items on Shutdown', route: '/aspnet/background-services/channel-writer-never-completed-loses-items-on-graceful-shutdown' },
  ],
  'signalr': [
    { label: 'Testing Hub Methods With Mocked Clients, Groups, and Context', route: '/aspnet/signalr/testing-hub-methods-with-mocked-clients-groups-and-context' },
    { label: 'How Groups and Context Persist Across Transient Hub Instances', route: '/aspnet/signalr/how-groups-and-context-persist-across-transient-hub-instances' },
    { label: 'Connection Identity Captured Once — Ignores Later Claim Changes', route: '/aspnet/signalr/connection-identity-captured-once-ignores-later-claim-changes' },
  ],
  'health-checks': [
    { label: 'Testing Boundary Logic and That Liveness Runs Zero Checks', route: '/aspnet/health-checks/testing-health-check-boundary-logic-and-liveness-runs-zero-checks' },
    { label: 'DB Check Connection Pool Contention Causes Cascading Failure', route: '/aspnet/health-checks/db-check-connection-pool-contention-causes-cascading-failure' },
    { label: 'Degraded Returns 200 by Default — Invisible to Load Balancers', route: '/aspnet/health-checks/degraded-returns-200-by-default-invisible-to-load-balancers' },
  ],
  // NOTE: keyed 'aspnet-deployment', NOT bare 'deployment' — the
  // Node.js hub (/node/deployment) already owns that bare slug.
  'aspnet-deployment': [
    { label: 'Testing ForwardedHeaders Trust Configuration Rejects Spoofed IPs', route: '/aspnet/deployment/testing-forwardedheaders-trust-configuration-rejects-spoofed-ips' },
    { label: 'How ForwardedHeaders Walks Multi-Hop Chains to Resolve Client IP', route: '/aspnet/deployment/how-forwardedheaders-walks-multi-hop-chains-to-resolve-client-ip' },
    { label: 'HEALTHCHECK curl Instruction Fails on the Minimal ASP.NET Runtime Image', route: '/aspnet/deployment/healthcheck-curl-instruction-fails-on-minimal-aspnet-runtime-image' },
  ],
  // NOTE: keyed 'aspnet-performance', NOT bare 'performance' — SQL,
  // HTML, React, Blazor, Node.js, GraphQL, and Service Mesh hubs (plus
  // an existing bare 'performance' entry at line ~1154) all already
  // own that bare slug.
  'aspnet-performance': [
    { label: 'Testing Allocation Regressions With GetAllocatedBytesForCurrentThread', route: '/aspnet/performance/testing-allocation-regressions-with-getallocatedbytesforthread' },
    { label: 'Server GC Heap Count Follows Perceived, Not Actual, CPU Limit', route: '/aspnet/performance/server-gc-heap-count-follows-perceived-not-actual-cpu-limit' },
    { label: 'Streaming Query Missing CancellationToken Runs After Disconnect', route: '/aspnet/performance/streaming-query-missing-cancellationtoken-runs-after-disconnect' },
  ],
  'aspire': [
    { label: 'Testing the AppHost Topology With DistributedApplicationTestingBuilder', route: '/aspnet/aspire/testing-apphost-topology-with-distributedapplicationtestingbuilder' },
    { label: 'AddProject Type Parameter Requires a Build, Not Just a Project Reference', route: '/aspnet/aspire/addproject-type-parameter-requires-build-not-just-project-reference' },
    { label: 'OTel Exporter Needs an Endpoint Guard Outside the AppHost', route: '/aspnet/aspire/otel-exporter-needs-endpoint-guard-when-running-outside-apphost' },
  ],
  'fluent-validation': [
    { label: 'Testing Async MustAsync Rules With FluentValidation.TestHelper', route: '/aspnet/fluent-validation/testing-async-mustasync-rules-with-fluentvalidation-testhelper' },
    { label: 'Inline When() Defaults to All Validators in the Same RuleFor Chain', route: '/aspnet/fluent-validation/inline-when-defaults-to-all-validators-in-the-same-rulefor-chain' },
    { label: 'Adding One MustAsync Rule Breaks Every Synchronous Validate Caller', route: '/aspnet/fluent-validation/adding-one-mustasync-rule-breaks-every-synchronous-validate-caller' },
  ],
  'minimal-api-advanced': [
    { label: 'Testing Endpoint Filters Without WebApplicationFactory', route: '/aspnet/minimal-api-advanced/testing-endpoint-filters-without-webapplicationfactory' },
    { label: 'ctx.Arguments.OfType() Is Fragile — Use GetArgument by Position', route: '/aspnet/minimal-api-advanced/ctx-arguments-oftype-is-fragile-use-getargument-by-position' },
    { label: 'Nested Group Filters Execute Outside-In Like Middleware', route: '/aspnet/minimal-api-advanced/nested-group-filters-execute-outside-in-like-middleware' },
  ],
  'output-caching-advanced': [
    { label: 'Testing Tag Eviction With a Fake IOutputCacheStore', route: '/aspnet/output-caching-advanced/testing-tag-eviction-with-fake-outputcachestore' },
    { label: 'How Cache Stampede Locking Survives Population Failures', route: '/aspnet/output-caching-advanced/how-cache-stampede-locking-survives-population-failures' },
    { label: 'Custom IOutputCachePolicy Skips Every Built-In Safety Check', route: '/aspnet/output-caching-advanced/custom-ioutputcachepolicy-skips-every-built-in-safety-check' },
  ],
  'dapper': [
    { label: 'Testing Dapper Repositories With In-Memory SQLite', route: '/aspnet/dapper/testing-dapper-repositories-with-in-memory-sqlite' },
    { label: 'How Dapper Decides Whether to Close the Connection It Used', route: '/aspnet/dapper/how-dapper-decides-whether-to-close-the-connection-it-used' },
    { label: 'TransferAsync Holds Its Connection Open Far Too Long', route: '/aspnet/dapper/transferasync-example-holds-its-connection-open-far-too-long' },
  ],
  'csrf': [
    { label: 'Testing GET Requests Cannot Reach State-Changing Endpoints', route: '/aspnet/csrf/testing-get-requests-cant-reach-state-changing-endpoints' },
    { label: 'Cookie Token and Request Token Are Not the Same String', route: '/aspnet/csrf/cookie-token-and-request-token-are-not-the-same-string' },
    { label: 'Manual Validation Middleware and UseAntiforgery() Are Redundant', route: '/aspnet/csrf/manual-validation-middleware-and-useantiforgery-are-redundant-not-layered' },
  ],
  'feature-flags': [
    { label: 'Testing Feature-Flagged Code: Mocking vs Config Override', route: '/aspnet/feature-flags/testing-feature-flagged-code-mocking-and-config-override' },
    { label: 'PercentageFilter Re-Rolls on Every Call — Not Sticky Per User', route: '/aspnet/feature-flags/percentagefilter-re-rolls-on-every-call-not-sticky-per-user' },
    { label: 'FeatureGate With Multiple Flags Defaults to RequirementType.All', route: '/aspnet/feature-flags/featuregate-multiple-flags-defaults-to-requirementtype-all' },
  ],
  'localization': [
    { label: 'Testing Localized Responses: Fixed Provider vs Accept-Language', route: '/aspnet/localization/testing-localized-responses-fixed-culture-provider-vs-accept-language' },
    { label: 'Resource Fallback Follows Culture Hierarchy, Not Just Missing Keys', route: '/aspnet/localization/resx-fallback-follows-culture-hierarchy-not-just-missing-keys' },
    { label: 'Culture Cookie Endpoint Silently Rejects Arabic', route: '/aspnet/localization/culture-cookie-endpoint-hardcoded-list-silently-rejects-arabic' },
  ],
  'masstransit': [
    { label: 'Testing MassTransit Consumers and Request-Reply With ITestHarness', route: '/aspnet/masstransit/testing-masstransit-consumers-and-request-reply-with-itestharness' },
    { label: 'UseMessageRetry and UseDelayedRedelivery Multiply, Not Add', route: '/aspnet/masstransit/usemessageretry-and-usedelayedredelivery-multiply-not-add' },
    { label: 'Send() Hardcoded Queue Name Can Silently Point at an Empty Queue', route: '/aspnet/masstransit/send-hardcoded-queue-name-can-silently-point-at-an-empty-queue' },
  ],
  'response-compression': [
    { label: 'Testing Minimum Size Threshold and Skip-If-Already-Encoded', route: '/aspnet/response-compression/testing-minimum-size-threshold-and-skip-if-already-encoded' },
    { label: 'Registration Order Only Breaks Ties Among Supported Encodings', route: '/aspnet/response-compression/registration-order-only-breaks-ties-among-client-supported-encodings' },
    { label: 'Diagnostic Middleware Must Wrap Compression, Not Nest Inside It', route: '/aspnet/response-compression/diagnostic-middleware-must-wrap-compression-not-nest-inside-it' },
  ],
  'aspnet-websockets': [
    { label: 'Testing WebSocket Endpoints With TestServer’s WebSocketClient', route: '/aspnet/websockets/testing-websocket-endpoints-with-testservers-websocketclient' },
    { label: 'Close Handshake Mechanics: What Actually Ends the Receive Loop', route: '/aspnet/websockets/close-handshake-mechanics-what-actually-ends-the-receive-loop' },
    { label: 'Receive-Loop Examples Silently Truncate Multi-Frame Messages', route: '/aspnet/websockets/receive-loop-examples-silently-truncate-multi-frame-messages' },
  ],
  'yarp': [
    { label: 'Testing YARP Routes and Transforms With LoadFromMemory', route: '/aspnet/yarp/testing-yarp-routes-and-transforms-with-loadfrommemory' },
    { label: 'Passive Health Checks Don’t Verify Recovery — Just Retry After a Timeout', route: '/aspnet/yarp/passive-health-checks-dont-verify-recovery-just-retry-after-timeout' },
    { label: 'Proxy Pipeline Order Is Not Arbitrary', route: '/aspnet/yarp/proxy-pipeline-order-is-not-arbitrary-affinity-before-load-balancing' },
  ],
  'aspnet-opentelemetry': [
    { label: 'Testing Custom Spans and Metrics With ActivityListener', route: '/aspnet/opentelemetry/testing-custom-spans-and-metrics-with-activitylistener-and-meterlistener' },
    { label: 'SetTag Guards Against Null, Not Against a Sampled-Out Span', route: '/aspnet/opentelemetry/settag-guards-against-null-not-against-a-sampled-out-span' },
    { label: 'Fire-and-Forget Work Inside a Span Outlives Its Parent', route: '/aspnet/opentelemetry/fire-and-forget-inside-a-span-creates-a-child-that-outlives-its-parent' },
  ],
  'rdbms-concepts': [
    { label: 'Testing Constraints With tSQLt and pgTAP', route: '/sql/rdbms-concepts/testing-constraints-with-tsqlt-and-pgtap' },
    { label: 'Plan Cache Pollution Is About Query Text, Not Structure', route: '/sql/rdbms-concepts/plan-cache-pollution-is-about-query-text-not-query-structure' },
    { label: 'Cascade Delete Demo Doesn’t Match the Page’s Own Schema', route: '/sql/rdbms-concepts/cascade-delete-demo-doesnt-match-the-pages-own-schema' },
  ],
  'data-modeling': [
    { label: 'Testing the Polymorphic CHECK Constraint', route: '/sql/data-modeling/testing-the-polymorphic-check-constraint-with-tsqlt-and-pgtap' },
    { label: 'Recursive CTE Has No Cycle Protection', route: '/sql/data-modeling/recursive-cte-has-no-cycle-protection-and-dialects-fail-differently' },
    { label: 'UUID Example Contradicts the Page’s Own Theory', route: '/sql/data-modeling/uuid-example-uses-the-exact-pattern-its-own-theory-warns-against' },
  ],
  'normalization': [
    { label: 'Testing That the OrderTotal Trigger Actually Stays in Sync', route: '/sql/normalization/testing-that-the-ordertotal-trigger-actually-stays-in-sync' },
    { label: 'Why a Computed Column Can’t Replace the OrderTotal Trigger', route: '/sql/normalization/why-a-computed-column-cant-replace-the-ordertotal-trigger' },
    { label: 'Challenge Solution Comment Contradicts Its Own FK', route: '/sql/normalization/challenge-solutions-comment-contradicts-its-own-fk-declaration' },
  ],
  'db-architecture': [
    { label: 'Testing idle_in_transaction_session_timeout Actually Works', route: '/sql/db-architecture/testing-idle-in-transaction-session-timeout-actually-works' },
    { label: 'Buffer Hit Ratio Query Reads a Meaningless Raw Counter', route: '/sql/db-architecture/buffer-hit-ratio-query-reads-a-meaningless-raw-counter' },
    { label: 'n_dead_tup Is an Estimate, Not a Live Count', route: '/sql/db-architecture/dead-tup-in-pg-stat-user-tables-is-an-estimate-not-live' },
  ],
  'data-types': [
    { label: 'Testing That Financial Columns Stay DECIMAL', route: '/sql/data-types/testing-that-financial-columns-stay-decimal-not-float' },
    { label: 'Implicit Conversion Direction, Corrected', route: '/sql/data-types/implicit-conversion-warning-has-the-risky-direction-backwards' },
    { label: 'jsonb_set() and NULL Targets', route: '/sql/data-types/jsonb-set-silently-no-ops-on-a-null-target' },
  ],
  'sql-basics': [
    { label: 'Testing the Tie-Break Gap', route: '/sql/basics/distinct-on-and-row-number-examples-have-no-tie-breaker' },
    { label: 'Confirming the Conversion Claim', route: '/sql/basics/confirming-not-trusting-the-implicit-conversion-claim' },
    { label: 'OFFSET Paging Under Concurrent Writes', route: '/sql/basics/offset-pagination-skips-or-duplicates-rows-when-data-changes-mid-pagination' },
  ],
  'joins': [
    { label: 'Testing the Row-Multiplication Fix', route: '/sql/joins/testing-that-the-row-multiplication-fix-actually-prevents-double-counting' },
    { label: 'A Second, Unfixed Sargability Problem', route: '/sql/joins/year-wrapped-date-filter-fix-still-isnt-sargable' },
    { label: 'The “Both” Label Isn’t Always True', route: '/sql/joins/anti-join-self-join-both-tab-has-a-postgresql-only-clause' },
  ],
  'aggregations': [
    { label: 'Testing the COUNT(DISTINCT) Alternative', route: '/sql/aggregations/testing-that-the-count-distinct-alternative-returns-identical-counts' },
    { label: 'The Legacy Pattern’s Hidden Corruption', route: '/sql/aggregations/legacy-stuff-for-xml-path-pattern-silently-xml-encodes-special-characters' },
    { label: 'A GROUPING() Gap the Theory Warns About', route: '/sql/aggregations/grouping-sets-omits-the-disambiguation-its-own-theory-warns-about' },
  ],
  'subqueries': [
    { label: 'Testing the Window Function Rewrite', route: '/sql/subqueries/testing-that-the-window-function-rewrite-matches-the-correlated-subquery' },
    { label: 'The “Avoid This” Example Doesn’t Run At All', route: '/sql/subqueries/the-avoid-this-window-function-in-having-example-doesnt-run-at-all' },
    { label: 'Row Subqueries and the MSSQL Rewrite', route: '/sql/subqueries/row-subqueries-and-the-mssql-rewrite-the-page-never-shows' },
  ],
  'ctes': [
    { label: 'Testing the Depth Guard Against a Cycle', route: '/sql/ctes/testing-that-the-depth-guard-actually-stops-a-cyclic-manager-chain' },
    { label: 'CategoryPath’s Missing Depth Guard', route: '/sql/ctes/categorypath-has-no-depth-guard-and-postgresql-wont-save-it' },
    { label: 'Confirming the Double-Execution Claim', route: '/sql/ctes/confirming-that-a-twice-referenced-cte-actually-executes-twice' },
  ],
  'window-functions': [
    { label: 'Testing the Islands-and-Gaps Pattern', route: '/sql/window-functions/testing-that-the-islands-and-gaps-pattern-actually-splits-on-a-real-gap' },
    { label: 'Why One Frame Fix Matters, the Other Doesn’t', route: '/sql/window-functions/why-first-values-explicit-frame-is-a-no-op-but-last-values-is-essential' },
    { label: 'Confirming the Shared-Sort Claim', route: '/sql/window-functions/confirming-that-identical-over-clauses-really-do-share-a-single-sort' },
  ],
  'indexes': [
    { label: 'Testing Filtered Index Usage', route: '/sql/indexes/testing-that-a-filtered-index-actually-gets-used-not-silently-skipped' },
    { label: 'Quantifying the Wide Key Cost', route: '/sql/indexes/quantifying-why-a-wide-clustered-key-multiplies-storage-across-indexes' },
    { label: 'A Claim That Breaks Its Own Rule', route: '/sql/indexes/the-no-sort-needed-claim-breaks-its-own-leftmost-prefix-rule' },
  ],
  'transactions': [
    { label: 'Testing the Bank Transfer Pattern', route: '/sql/transactions/testing-that-the-bank-transfer-example-is-already-safe-without-updlock' },
    { label: 'Demonstrating Write Skew', route: '/sql/transactions/demonstrating-write-skew-the-one-anomaly-left-without-code' },
    { label: 'An Unconditional Rollback Bug', route: '/sql/transactions/the-postgresql-savepoint-example-rolls-back-a-successful-insert' },
  ],
  'schema-design': [
    { label: 'Testing the Migration’s Step 1', route: '/sql/schema-design/testing-whether-step-1s-default-actually-backfills-existing-rows' },
    { label: 'The ENUM Alternative Is Harder to Evolve', route: '/sql/schema-design/the-postgresql-enum-alternative-is-harder-to-evolve-not-easier' },
    { label: 'The Lookup-Table Pattern Never Retires the Old CHECK', route: '/sql/schema-design/adding-the-lookup-table-pattern-never-retires-the-original-check' },
  ],
  'stored-procedures': [
    { label: 'Testing usp_PlaceOrder’s Concurrency', route: '/sql/stored-procedures/testing-that-usp-placeorder-can-oversell-stock-under-concurrent-calls' },
    { label: 'Confirming the Inline TVF Pushdown Claim', route: '/sql/stored-procedures/confirming-that-the-inline-tvfs-where-clause-actually-gets-pushed-down' },
    { label: 'Demonstrating the SCOPE_IDENTITY() Scoping Gap', route: '/sql/stored-procedures/demonstrating-that-scope-identity-is-scoped-to-the-dynamic-batch' },
  ],
  // NOTE: keyed 'sql-performance', NOT bare 'performance' — the bare
  // slug is contested across multiple hubs (see the aspnet-performance
  // note above); prefixing avoids a future collision.
  'sql-performance': [
    { label: 'Testing the OR-to-UNION-ALL Rewrite', route: '/sql/performance/testing-that-the-or-to-union-all-rewrite-doesnt-duplicate-overlapping-rows' },
    { label: 'A Missing Normalization Step', route: '/sql/performance/the-missing-index-impact-score-formula-is-missing-a-100' },
    { label: 'Building the Regression Test', route: '/sql/performance/demonstrating-the-execution-plan-regression-test-the-page-only-describes' },
  ],
  'json-features': [
    { label: 'Testing the Merge Operator’s Limits', route: '/sql/json-features/testing-that-merge-silently-wipes-out-nested-keys-instead-of-deep-merging' },
    { label: 'What Untyped OPENJSON Actually Returns', route: '/sql/json-features/demonstrating-what-openjsons-untyped-output-looks-like-for-object-arrays' },
    { label: 'A NULL-Handling Gap in a Partial Index', route: '/sql/json-features/the-partial-indexs-not-equal-predicate-silently-excludes-null-status-rows' },
  ],
  'set-operations': [
    { label: 'Testing the Schema Comparison Query', route: '/sql/set-operations/testing-that-the-schema-comparison-query-misses-type-only-drift' },
    { label: 'Making Precedence Concrete', route: '/sql/set-operations/demonstrating-that-intersects-tighter-binding-actually-changes-the-result' },
    { label: 'Confirming EXCEPT vs NOT EXISTS Execution', route: '/sql/set-operations/confirming-that-except-materialises-both-sets-not-exists-short-circuits' },
  ],
  'null-handling': [
    { label: 'Testing UNION vs JOIN NULL Equality', route: '/sql/null-handling/testing-that-union-treats-two-nulls-as-equal-while-join-doesnt' },
    { label: 'A Bigger Reason to Avoid ISNULL', route: '/sql/null-handling/isnull-can-silently-truncate-a-bigger-reason-than-portability' },
    { label: 'Demonstrating ANSI_NULLS OFF', route: '/sql/null-handling/demonstrating-what-ansi-nulls-off-actually-does-to-comparisons' },
  ],
  'merge': [
    { label: 'Proving the Duplicate-Source Bug', route: '/sql/merge/testing-that-the-mssql-merge-duplicate-source-bug-is-real' },
    { label: 'ON CONFLICT and Partial Indexes', route: '/sql/merge/on-conflict-is-atomic-once-the-partial-index-predicate-matches' },
    { label: 'MERGE Can Still Race Without HOLDLOCK', route: '/sql/merge/concurrent-merge-statements-can-still-race-without-holdlock' },
  ],
  'string-functions': [
    { label: 'Testing the Name Normaliser Against NULLs', route: '/sql/string-functions/testing-that-name-normaliser-returns-null-for-a-null-last-name' },
    { label: 'Prefix LIKE Needs Pattern Ops', route: '/sql/string-functions/demonstrating-that-prefix-like-needs-pattern-ops-under-default-locale' },
    { label: 'REPLACE Is Case-Insensitive by Default', route: '/sql/string-functions/replace-is-case-insensitive-by-default-contradicting-its-own-claim' },
  ],
  'date-functions': [
    { label: 'Testing the Monthly Revenue Report for Gaps', route: '/sql/date-functions/testing-that-the-monthly-revenue-report-drops-zero-order-months' },
    { label: 'GROUP BY DATE_TRUNC Needs an Expression Index', route: '/sql/date-functions/group-by-date-trunc-still-needs-an-expression-index-not-the-raw-column' },
    { label: 'AT TIME ZONE’s Automatic DST Adjustment', route: '/sql/date-functions/demonstrating-at-time-zones-automatic-dst-adjustment-across-march' },
  ],
  'conditional-expressions': [
    { label: 'Confirming CASE’s Guaranteed Evaluation Order', route: '/sql/conditional-expressions/case-when-order-is-standard-guaranteed-not-just-typical-behavior' },
    { label: 'Testing the Dead NULLIF(COUNT(*), 0) Guard', route: '/sql/conditional-expressions/testing-that-nullif-count-zero-can-never-actually-fire' },
    { label: 'The Nested IIF Contradiction', route: '/sql/conditional-expressions/nested-iif-where-example-contradicts-its-own-nesting-advice' },
  ],
  'math-functions': [
    { label: 'Correcting the Banker’s Rounding Claim', route: '/sql/math-functions/correcting-the-bankers-rounding-claim-for-postgresql-numeric' },
    { label: 'Testing AVG on Integers Across Dialects', route: '/sql/math-functions/testing-that-avg-on-integers-differs-between-postgresql-and-mssql' },
    { label: 'TABLESAMPLE Can Return Far Fewer Rows', route: '/sql/math-functions/mssql-tablesample-rows-can-return-far-fewer-rows-than-requested' },
  ],
  'pivoting': [
    { label: 'PIVOT’s Invisible Implicit GROUP BY', route: '/sql/pivoting/demonstrating-that-pivots-implicit-group-by-silently-multiplies-rows' },
    { label: 'Fixing the CROSS APPLY UNPIVOT Example', route: '/sql/pivoting/fixing-the-cross-apply-unpivot-examples-missing-month-column' },
    { label: 'Confirming crosstab()’s Safe Two-Argument Form', route: '/sql/pivoting/testing-that-crosstabs-two-argument-form-handles-a-missing-month' },
  ],
  'constraints': [
    { label: 'Testing ON DELETE RESTRICT in T-SQL', route: '/sql/constraints/testing-that-on-delete-restrict-is-invalid-t-sql-syntax' },
    { label: 'MSSQL UNIQUE Allows Only One NULL', route: '/sql/constraints/testing-that-mssql-unique-allows-only-one-null-not-multiple' },
    { label: 'NOT VALID Avoids the Full-Table Lock', route: '/sql/constraints/not-valid-plus-validate-constraint-avoids-the-full-table-lock' },
  ],
  'views': [
    { label: 'Testing the Challenge’s Cross-Tenant Leak', route: '/sql/views/testing-that-the-mssql-challenge-solution-is-missing-with-check-option' },
    { label: 'The Dead LEFT(ssn, 0) in the Masking Example', route: '/sql/views/demonstrating-that-left-ssn-0-in-the-masking-example-is-dead-code' },
    { label: 'An INSTEAD OF INSERT Trigger, Demonstrated', route: '/sql/views/demonstrating-an-instead-of-insert-trigger-for-a-multi-table-join-view' },
  ],
  'sequences': [
    { label: 'Correcting the ‘Peek Next Value’ Answer', route: '/sql/sequences/correcting-the-peek-next-value-answer-when-cache-is-greater-than-one' },
    { label: 'SCOPE_IDENTITY() vs @@IDENTITY, Demonstrated', route: '/sql/sequences/demonstrating-the-scope-identity-vs-identity-divergence-with-a-trigger' },
    { label: 'Testing Out-of-Order Sequence Commits', route: '/sql/sequences/testing-that-committed-sequence-ids-can-appear-out-of-order' },
  ],
  'temp-tables': [
    { label: 'Correcting the Nested-Proc Claim', route: '/sql/temp-tables/correcting-the-nested-proc-cannot-create-duplicate-temp-table-claim' },
    { label: 'Table Variables Survive ROLLBACK', route: '/sql/temp-tables/demonstrating-that-table-variables-are-not-rolled-back-by-rollback' },
    { label: 'Table Variables Support Inline Indexes', route: '/sql/temp-tables/demonstrating-that-table-variables-support-inline-non-unique-indexes' },
  ],
  'computed-columns': [
    { label: 'Testing MSSQL Computed Column Chaining', route: '/sql/computed-columns/testing-that-mssql-computed-columns-can-reference-each-other' },
    { label: 'CHECKSUM Is Not Version-Stable', route: '/sql/computed-columns/checksum-is-not-stable-across-sql-server-versions-or-patches' },
    { label: 'Adding a STORED Column Locks the Whole Table', route: '/sql/computed-columns/adding-a-stored-generated-column-locks-the-whole-table' },
  ],
  'stored-functions': [
    { label: 'Correcting the search_path Pin', route: '/sql/stored-functions/correcting-the-search-path-public-pin-in-the-security-definer-example' },
    { label: 'A Real CREATE AGGREGATE Example', route: '/sql/stored-functions/writing-an-actual-create-aggregate-example-the-quiz-only-describes' },
    { label: 'Business Days Depends on SET DATEFIRST', route: '/sql/stored-functions/demonstrating-that-business-days-depends-on-set-datefirst' },
  ],
  'cursors': [
    { label: 'Testing Local Cursor Auto-Deallocation', route: '/sql/cursors/testing-that-local-cursors-auto-deallocate-without-explicit-deallocate' },
    { label: 'fetch_customers Isn’t Really a REFCURSOR', route: '/sql/cursors/demonstrating-that-fetch-customers-is-not-really-a-refcursor-example' },
    { label: 'The “Discount” That’s Actually a Markup', route: '/sql/cursors/demonstrating-that-the-cursor-discount-example-is-actually-a-price-markup' },
  ],
  'triggers': [
    { label: 'Testing the Trigger Subquery Tautology', route: '/sql/triggers/testing-that-the-challenges-postgresql-trigger-subquery-is-a-tautology' },
    { label: 'ON CONFLICT DO NOTHING Is a No-Op Here', route: '/sql/triggers/testing-that-on-conflict-do-nothing-is-a-no-op-without-a-constraint' },
    { label: 'What Actually Stops Cross-Table Recursion', route: '/sql/triggers/correcting-which-setting-actually-stops-cross-table-trigger-recursion' },
  ],
  'dynamic-sql': [
    { label: 'search_table Is Injection-Safe, Not Access-Control-Safe', route: '/sql/dynamic-sql/search-table-is-injection-safe-but-not-access-control-safe' },
    { label: 'get_orders_by_status Doesn’t Need Dynamic SQL', route: '/sql/dynamic-sql/demonstrating-that-get-orders-by-status-does-not-need-dynamic-sql-at-all' },
    { label: 'Testing usp_SearchOrders for the Full-Scan Risk', route: '/sql/dynamic-sql/testing-that-usp-searchorders-has-no-guard-against-the-full-scan-risk' },
  ],
  'isolation-levels': [
    { label: 'Testing the SERIALIZABLE Retry Requirement', route: '/sql/isolation-levels/testing-that-the-challenges-serializable-solution-needs-a-retry-loop' },
    { label: 'What Actually Protects the Bank Transfer', route: '/sql/isolation-levels/snapshot-protects-via-conflict-detection-not-just-non-repeatable-reads' },
    { label: 'READ COMMITTED Blocking Depends on RCSI', route: '/sql/isolation-levels/demonstrating-that-read-committed-blocking-behavior-depends-on-rcsi' },
  ],
  'locking': [
    { label: 'Testing the Challenge’s PostgreSQL Solution', route: '/sql/locking/testing-that-the-challenges-postgresql-solution-is-not-valid-standalone-sql' },
    { label: 'DEADLOCK_PRIORITY Doesn’t Prevent the Deadlock', route: '/sql/locking/demonstrating-that-deadlock-priority-low-does-not-prevent-the-deadlock' },
    { label: 'ORDER BY on UPDATE Is Invalid Syntax', route: '/sql/locking/testing-that-order-by-on-update-is-invalid-syntax-not-a-lock-technique' },
  ],
  'execution-plans': [
    { label: 'Correcting the “Scan, Not Seek” Claim', route: '/sql/execution-plans/correcting-the-scan-not-seek-claim-for-int-vs-varchar-precedence' },
    { label: 'Index Scan Is Not the Desired MSSQL Outcome', route: '/sql/execution-plans/demonstrating-that-index-scan-is-not-the-desired-mssql-outcome' },
    { label: 'Small Tables Seq Scan Despite a Covering Index', route: '/sql/execution-plans/testing-that-small-tables-seq-scan-despite-a-covering-index' },
  ],
  'partitioning': [
    { label: 'Testing the SWITCH Statement’s Target Syntax', route: '/sql/partitioning/testing-that-switch-to-orders-archive-partition-1-is-invalid-syntax' },
    { label: 'TRUNCATE Discards the Just-Archived Data', route: '/sql/partitioning/testing-that-truncate-orders-archive-discards-the-data-just-switched-in' },
    { label: 'DETACH CONCURRENTLY in a Transaction Block', route: '/sql/partitioning/demonstrating-that-detach-concurrently-cannot-run-in-a-transaction-block' },
  ],
  'bulk-operations': [
    { label: 'The Batched UPDATE Example Never Finds a Row', route: '/sql/bulk-operations/testing-that-the-batched-update-example-never-finds-a-matching-row' },
    { label: 'Step 4 Is Missing the Duplicate Guard', route: '/sql/bulk-operations/testing-that-the-challenges-step-4-insert-is-missing-the-duplicate-guard' },
    { label: 'The BULK_LOGGED Advice’s Restore Gap', route: '/sql/bulk-operations/correcting-the-bulk-logged-advice-missing-the-point-in-time-restore-gap' },
  ],
  'query-store': [
    { label: 'The Historic Average Includes the Spike', route: '/sql/query-store/testing-that-the-historic-average-includes-the-regressed-interval' },
    { label: 'flush_db Does Not Purge Storage', route: '/sql/query-store/testing-that-flush-db-does-not-purge-or-reduce-query-store-storage' },
    { label: 'Multiple Plans Without Parameter Sniffing', route: '/sql/query-store/demonstrating-that-multiple-plans-can-appear-without-parameter-sniffing' },
  ],
  'statistics': [
    { label: 'The Challenge Never Flags What’s Overdue', route: '/sql/statistics/testing-that-the-challenges-solution-never-flags-which-stats-are-overdue' },
    { label: 'The Density Quiz’s Rows-Per-Value Claim', route: '/sql/statistics/correcting-the-density-quizs-rows-per-distinct-value-claim' },
    { label: 'The Stale Stats Query’s Outdated Signal', route: '/sql/statistics/testing-that-the-stale-stats-query-ranks-by-the-outdated-flat-percentage' },
  ],
  'full-text-search': [
    { label: 'The Challenge’s Search Vector Goes Stale', route: '/sql/full-text-search/testing-that-the-challenges-search-vector-goes-stale-for-new-rows' },
    { label: 'The ts_rank “0.0 to 1.0” Range Claim', route: '/sql/full-text-search/correcting-the-ts-ranks-fixed-0-to-1-range-claim' },
    { label: 'Stemming Doesn’t Reduce “ran” to “run”', route: '/sql/full-text-search/testing-that-stemming-does-not-reduce-ran-to-the-same-token-as-run' },
  ],
  'security': [
    { label: 'No Block Predicate for Writes', route: '/sql/security/testing-that-the-challenges-rls-solution-has-no-block-predicate-for-writes' },
    { label: 'The Audit Trigger Misclassifies MERGE Rows', route: '/sql/security/testing-that-the-audit-trigger-misclassifies-rows-during-a-merge-statement' },
    { label: 'An Unset Session Context Silently Returns Zero', route: '/sql/security/testing-that-an-unset-session-context-silently-returns-zero-rows' },
  ],
  'connection-pooling': [
    { label: 'The MSSQL Idle-in-Tx Proxy’s Wrong Timestamp', route: '/sql/connection-pooling/testing-that-the-idle-in-tx-proxy-uses-the-wrong-timestamp-column' },
    { label: 'SET LOCAL Doesn’t Require PgBouncer Session Mode', route: '/sql/connection-pooling/correcting-the-claim-that-set-local-requires-pgbouncer-session-mode' },
    { label: 'The Queries Miss the “Aborted” State', route: '/sql/connection-pooling/testing-that-the-idle-in-transaction-queries-miss-the-aborted-state' },
  ],
  'ts-basics': [
    { label: 'Excess Property Checking at Call Sites', route: '/typescript/basics/testing-that-excess-property-checking-applies-to-function-arguments-too' },
    { label: 'The Exhaustiveness Check’s Exact Error', route: '/typescript/basics/demonstrating-the-exact-compiler-error-when-a-new-shape-variant-is-added' },
    { label: 'The “Fixed” Example Still Uses as any', route: '/typescript/basics/testing-that-the-fixed-any-vs-unknown-example-still-uses-as-any' },
  ],
  'primitive-types': [
    { label: 'as const Is Compile-Time Only', route: '/typescript/primitive-types/testing-that-as-consts-readonly-is-compile-time-only-not-runtime' },
    { label: 'Narrowing to object Isn’t Enough', route: '/typescript/primitive-types/testing-that-narrowing-to-object-still-isnt-enough-to-access-cfg-port' },
    { label: 'throw fail(...) Isn’t an Expression', route: '/typescript/primitive-types/testing-that-throw-fail-cannot-appear-in-an-expression-position' },
  ],
  'interfaces-types': [
    { label: 'PluginRegistry’s Unverified Name/Key Assumption', route: '/typescript/interfaces-types/testing-that-pluginregistry-never-verifies-name-matches-its-key' },
    { label: 'Window Merging Needs declare global', route: '/typescript/interfaces-types/testing-that-window-merging-needs-declare-global-in-a-module-file' },
    { label: 'Conflicting Merges Are a Compile Error', route: '/typescript/interfaces-types/testing-that-conflicting-merged-properties-are-a-compile-error' },
  ],
  'unions': [
    { label: 'BigInt Zero Is Falsy Too', route: '/typescript/unions/testing-that-bigint-zero-is-falsy-and-skipped-by-truthiness-narrowing' },
    { label: 'The “Safe” isUser Fix Still Uses as any', route: '/typescript/unions/testing-that-the-safe-isuser-fix-still-uses-as-any-twice' },
    { label: 'The Assertion Function Example Doesn’t Run', route: '/typescript/unions/testing-that-the-assertion-function-example-never-actually-runs' },
  ],
  'narrowing': [
    { label: 'Narrowing Survives an Unrelated Call', route: '/typescript/narrowing/testing-that-narrowing-survives-an-unrelated-function-call' },
    { label: 'Array.isArray Narrows to any[]', route: '/typescript/narrowing/testing-that-array-isarray-narrows-to-any-and-loses-element-safety' },
    { label: 'greet(‘’) Doesn’t Say Hello, Stranger', route: '/typescript/narrowing/testing-that-greet-with-an-empty-string-does-not-say-hello-stranger' },
  ],
  'enums-tuples': [
    { label: 'Direction[42] Returns Undefined', route: '/typescript/enums-tuples/testing-that-direction-42-returns-undefined-not-a-name' },
    { label: 'const enum Doesn’t Actually Throw Here', route: '/typescript/enums-tuples/testing-that-const-enum-import-doesnt-throw-in-this-playground' },
    { label: 'minMax Without a Return Type', route: '/typescript/enums-tuples/testing-that-minmax-without-return-type-becomes-an-array' },
  ],
  'ts-generics': [
    { label: 'memoize Collapses NaN and null', route: '/typescript/generics/testing-that-memoize-collapses-nan-and-null-into-the-same-result' },
    { label: 'getInstance Returns the Same Object', route: '/typescript/generics/testing-that-getinstance-returns-the-same-object-across-different-t' },
    { label: 'getOrSet Avoids the Falsy-Value Trap', route: '/typescript/generics/testing-that-getorset-avoids-the-falsy-value-cache-trap' },
  ],
  'generic-patterns': [
    { label: 'Pipeline Skips pipe() Entirely', route: '/typescript/generic-patterns/testing-that-pipeline-skips-pipe-entirely-and-still-type-checks' },
    { label: 'FunctionKeys Drops Optional Methods', route: '/typescript/generic-patterns/testing-that-functionkeys-drops-optional-methods-from-the-result' },
    { label: 'QueryBuilder Builds With Zero Fields', route: '/typescript/generic-patterns/testing-that-querybuilder-builds-successfully-with-zero-fields-set' },
  ],
  'utility-types': [
    { label: 'Partial Record of Literal Keys Is Safe', route: '/typescript/utility-types/testing-that-partial-record-of-literal-keys-is-safely-optional' },
    { label: 'ViewDTO’s tags Array Can Still Be Pushed To', route: '/typescript/utility-types/testing-that-viewdtos-readonly-tags-array-can-still-be-pushed-to' },
    { label: 'DistributiveOmit Preserves Narrowing', route: '/typescript/utility-types/testing-that-distributiveomit-preserves-per-member-narrowing' },
  ],
  'mapped-types': [
    { label: 'EventHandlers Wrongly Includes online', route: '/typescript/mapped-types/testing-that-eventhandlers-wrongly-includes-online' },
    { label: 'StringKeys Excludes an Optional String', route: '/typescript/mapped-types/testing-that-stringkeys-excludes-an-optional-string-property' },
    { label: 'OptionalToNullable Detects Implicit undefined', route: '/typescript/mapped-types/testing-that-optionaltonullable-detects-implicit-undefined' },
  ],
  'conditional-types': [
    { label: 'Equals Can’t Distinguish any From unknown', route: '/typescript/conditional-types/testing-that-equals-cannot-distinguish-any-from-unknown' },
    { label: 'Head of an Empty Tuple Hides undefined', route: '/typescript/conditional-types/testing-that-head-of-an-empty-tuple-hides-undefined-behind-never' },
    { label: 'MyReturnType Rejects a Class Constructor', route: '/typescript/conditional-types/testing-that-myreturntype-rejects-a-class-constructor' },
  ],
  'template-literal-types': [
    { label: 'let Widens HandlerName to Plain string', route: '/typescript/template-literal-types/testing-that-a-let-variable-widens-handlername-to-plain-string' },
    { label: 'DotPath Hits Infinite Recursion on Self-Reference', route: '/typescript/template-literal-types/testing-that-dotpath-hits-infinite-recursion-on-self-reference' },
    { label: 'A Single as Cast Defeats CSSVarName', route: '/typescript/template-literal-types/testing-that-a-single-as-cast-defeats-the-cssvarname-cross-product' },
  ],
  'classes': [
    { label: 'private Still Leaks Via JSON.stringify', route: '/typescript/classes/testing-that-typescript-private-is-still-included-in-json-stringify' },
    { label: 'getState’s Object.freeze Doesn’t Stop Array Mutation', route: '/typescript/classes/testing-that-getstates-object-freeze-doesnt-stop-mutating-items' },
    { label: 'Object.create Bypasses the Private Constructor', route: '/typescript/classes/testing-that-object-create-bypasses-appconfigs-private-constructor' },
  ],
  'decorators': [
    { label: 'Field Decorator Only Validates Construction', route: '/typescript/decorators/testing-that-celsius-field-decorator-only-validates-construction' },
    { label: 'Singleton Silently Ignores the Second Call’s Args', route: '/typescript/decorators/testing-that-singleton-silently-ignores-second-calls-args' },
    { label: 'describe’s Class Decorator Returns an Unnamed Class', route: '/typescript/decorators/testing-that-describes-class-decorator-returns-an-unnamed-class' },
  ],
  'tsconfig': [
    { label: 'strictPropertyInitialization Misses a Private Helper', route: '/typescript/tsconfig/testing-that-strictpropertyinitialization-misses-a-private-helper' },
    { label: 'noUncheckedIndexedAccess Doesn’t Affect Tuples', route: '/typescript/tsconfig/testing-that-nouncheckedindexedaccess-doesnt-affect-tuple-access' },
    { label: 'strictFunctionTypes Doesn’t Apply to Methods', route: '/typescript/tsconfig/testing-that-strictfunctiontypes-doesnt-apply-to-method-syntax' },
  ],
  // TypeScript keeps the bare 'modules' key (claimed it first). Go's own
  // /go/modules claims subtopics too — hub-prefixed to 'go-modules' below.
  'modules': [
    { label: 'Circular Imports Work Fine for Functions', route: '/typescript/modules/testing-that-circular-imports-work-fine-for-functions-not-consts' },
    { label: 'A Barrel Import Runs Every File’s Side Effects', route: '/typescript/modules/testing-that-a-barrel-import-runs-every-files-side-effects' },
    { label: 'export type Strips the Value, Even for a Class', route: '/typescript/modules/testing-that-export-type-strips-the-value-even-for-a-class' },
  ],
  'go-modules': [
    { label: 'go:embed Excludes Dot and Underscore Files', route: '/go/modules/go-embed-excludes-dot-and-underscore-files' },
    { label: 'A go Line Alone Can Trigger a Toolchain Switch', route: '/go/modules/go-line-alone-can-trigger-a-toolchain-switch' },
    { label: 'Replace Directives Are Ignored Outside the Main Module', route: '/go/modules/replace-directives-are-ignored-outside-the-main-module' },
  ],
  'declarations': [
    { label: 'interface and type alias Conflict, Not Merge', route: '/typescript/declarations/testing-that-interface-and-type-alias-with-the-same-name-conflict' },
    { label: 'Merging Ignores Generic Parameter Names', route: '/typescript/declarations/testing-that-declaration-merging-ignores-generic-parameter-names' },
    { label: 'A Hand-Written .d.ts Doesn’t Verify the Real JS', route: '/typescript/declarations/testing-that-a-hand-written-d-ts-doesnt-verify-the-real-js' },
  ],
  'frameworks': [
    { label: 'counterReducer’s Return Type Catches Gaps', route: '/typescript/frameworks/testing-that-counterreducers-explicit-return-type-catches-gaps' },
    { label: 'ApiResponse Still Requires data on Error', route: '/typescript/frameworks/testing-that-apiresponse-still-requires-data-on-an-error-status' },
    { label: 'setTimeout’s Return Type Depends on Node Types', route: '/typescript/frameworks/testing-that-settimeouts-return-type-depends-on-node-types' },
  ],
  'strict-migration': [
    { label: '@ts-expect-error Doesn’t Check Which Error', route: '/typescript/strict-migration/testing-that-ts-expect-error-doesnt-check-which-error-it-suppresses' },
    { label: 'noImplicitAny Doesn’t Restrict Explicit any', route: '/typescript/strict-migration/testing-that-noimplicitany-doesnt-restrict-explicit-any' },
    { label: 'A Leaf Module’s Untyped Import Leaks any', route: '/typescript/strict-migration/testing-that-a-leaf-modules-untyped-import-leaks-any' },
  ],
  'ts-performance': [
    { label: 'DeepPartial’s Depth Counter Makes Deep Fields Required', route: '/typescript/ts-performance/testing-that-deeppartials-depth-counter-makes-deep-fields-required' },
    { label: 'Forgetting as const Collapses the Color Union', route: '/typescript/ts-performance/testing-that-forgetting-as-const-collapses-the-color-union-to-string' },
    { label: 'skipLibCheck Only Skips .d.ts, Not Content', route: '/typescript/ts-performance/testing-that-skiplibcheck-only-skips-d-ts-extension-not-content' },
  ],
  'react-basics': [
    { label: 'Batching Applies to Native Event Listeners', route: '/react/basics/testing-that-batching-applies-to-native-event-listeners-not-just-onclick' },
    { label: 'Index Keys Leave Stale Text After Prepend', route: '/react/basics/testing-that-index-keys-leave-stale-text-in-an-uncontrolled-input-after-prepend' },
    { label: 'React.memo Alone Doesn’t Stop a Fresh Object Prop', route: '/react/basics/testing-that-react-memo-alone-doesnt-stop-a-fresh-object-prop-re-render' },
  ],
  'hooks-core': [
    { label: 'StrictMode Double-Invokes the Lazy Initializer', route: '/react/hooks-core/testing-that-strictmode-double-invokes-the-lazy-initializer-not-just-effects' },
    { label: 'useContext’s defaultValue Is Skipped by an Explicit undefined Provider', route: '/react/hooks-core/testing-that-usecontexts-defaultvalue-is-skipped-by-a-provider-passing-undefined' },
    { label: 'Functional Update Fixes Stale State, Not a Stale Prop', route: '/react/hooks-core/testing-that-a-functional-update-fixes-stale-state-but-not-a-stale-prop' },
  ],
  'hooks-advanced': [
    { label: 'useReducer’s Lazy Init Is StrictMode Double-Invoked Too', route: '/react/hooks-advanced/testing-that-usereducers-lazy-init-is-strictmode-double-invoked-too' },
    { label: 'Memoizing a Context Selector Doesn’t Stop the Consumer Re-rendering', route: '/react/hooks-advanced/testing-that-memoizing-a-context-selector-doesnt-stop-the-consumer-rerendering' },
    { label: 'A Module-Level Variable Leaks State Across Custom Hook Instances', route: '/react/hooks-advanced/testing-that-a-module-level-variable-leaks-state-across-custom-hook-instances' },
  ],
  'react-forms': [
    { label: 'z.coerce.number() Converts an Empty String to Zero', route: '/react/forms/testing-that-z-coerce-number-converts-an-empty-string-to-zero-not-nan' },
    { label: 'refine()’s path Option Only Flags confirm, Not password Too', route: '/react/forms/testing-that-refines-path-option-only-flags-confirm-not-password-too' },
    { label: 'Real-Time Validation Mode Reintroduces Per-Keystroke Re-renders', route: '/react/forms/testing-that-real-time-validation-mode-reintroduces-per-keystroke-rerenders-in-rhf' },
  ],
  'context': [
    { label: 'createContext’s Numeric Default Works With Zero Providers', route: '/react/context/testing-that-createcontexts-numeric-default-works-with-zero-providers' },
    { label: 'A Mega-Context Re-renders Consumers of Unrelated Fields', route: '/react/context/testing-that-a-mega-context-re-renders-consumers-of-unrelated-fields' },
    { label: 'A Toast Container Outside the Provider Can’t Access Notifications', route: '/react/context/testing-that-a-toast-container-outside-the-provider-cant-access-notifications' },
  ],
  'state-management': [
    { label: 'A Zustand Computed Selector Re-renders on Every Store Update', route: '/react/state-management/testing-that-a-zustand-computed-selector-rerenders-on-every-store-update' },
    { label: 'Mutating a useSelector Value Directly Fails Silently', route: '/react/state-management/testing-that-mutating-a-useselector-value-directly-fails-silently' },
    { label: 'Jotai’s atomFamily Shares State for the Same ID', route: '/react/state-management/testing-that-jotais-atomfamily-shares-state-for-the-same-id' },
  ],
  'router': [
    { label: 'useFetcher Revalidates the Current Route’s Loader', route: '/react/router/testing-that-usefetcher-revalidates-the-current-routes-loader' },
    { label: 'A Child errorElement Bubbles Up and Replaces the Parent’s Whole Layout', route: '/react/router/testing-that-a-child-errorelement-bubbles-up-and-replaces-the-parents-whole-layout' },
    { label: 'NavLink’s end Prop Is Needed for Root, Would Break Nested Highlighting', route: '/react/router/testing-that-navlinks-end-prop-is-needed-for-root-but-would-break-nested-active-highlighting-elsewhere' },
  ],
  'react-tanstack-query': [
    { label: 'An Inline Object queryKey Does Not Actually Refetch on Re-render', route: '/react/tanstack-query/testing-that-an-inline-object-querykey-does-not-actually-refetch-on-rerender' },
    { label: 'The Abort Signal Must Be Wired Into fetch to Actually Cancel', route: '/react/tanstack-query/testing-that-the-abort-signal-must-be-explicitly-wired-into-fetch-to-actually-cancel-the-request' },
    { label: 'initialData Skips the Immediate Fetch, placeholderData Always Triggers One', route: '/react/tanstack-query/testing-that-initialdata-skips-the-immediate-fetch-but-placeholderdata-always-triggers-one' },
  ],
  // NOTE: keyed 'react-performance', NOT bare 'performance' — ASP.NET,
  // SQL, HTML, Blazor, Node.js, GraphQL, and Service Mesh hubs all
  // share that same route slug and could claim the bare key later.
  'react-performance': [
    { label: 'children Is a Fresh Reference Every Render', route: '/react/performance/testing-that-children-is-a-fresh-reference-every-render-defeating-memo-even-with-identical-jsx' },
    { label: 'useDeferredValue Needs memo on the Child', route: '/react/performance/testing-that-usedeferredvalue-needs-memo-on-the-child-or-it-rerenders-immediately-anyway' },
    { label: 'Duplicate Dynamic import() Calls Are Deduplicated, Not Refetched', route: '/react/performance/testing-that-duplicate-import-calls-are-deduplicated-not-double-fetched' },
  ],
  // React keeps the bare 'patterns' key (claimed it first). The JavaScript
  // hub's own /javascript/patterns topic is hub-prefixed to 'js-patterns'
  // below. Go's own /go/patterns claims subtopics too — hub-prefixed to
  // 'go-patterns' below, per this comment's own earlier note.
  'go-patterns': [
    { label: 'sync.Once.Do Treats a Panic as Already Run', route: '/go/patterns/sync-once-do-treats-a-panic-as-already-run' },
    { label: 'errgroup.WithContext Cancels Siblings on the First Error', route: '/go/patterns/errgroup-withcontext-cancels-siblings-on-error' },
    { label: 'Middleware Composition: First Wrap Runs Outermost', route: '/go/patterns/middleware-composition-first-wrap-runs-outermost' },
  ],
  // Angular keeps the bare 'testing' key (claimed it first, see the
  // unquoted "testing:" entry above). Go's own /go/testing claims
  // subtopics too — hub-prefixed to 'go-testing' below.
  'go-testing': [
    { label: 'Duplicate Subtest Names Get an Auto-Numbered Suffix', route: '/go/testing/duplicate-subtest-names-get-an-auto-numbered-suffix' },
    { label: 'go test Can Print (cached) Instead of Actually Running', route: '/go/testing/go-test-can-print-cached-instead-of-actually-running' },
    { label: 't.Cleanup Runs in LIFO Order, Not Registration Order', route: '/go/testing/t-cleanup-runs-in-lifo-order-not-registration-order' },
  ],
  'cli': [
    { label: 'bufio.Scanner Has a 64KB Default Token Limit', route: '/go/cli/bufio-scanner-has-a-64kb-default-token-limit' },
    { label: 'ldflags -X Only Sets Uninitialized or Constant Vars', route: '/go/cli/ldflags-x-only-sets-uninitialized-or-constant-vars' },
    { label: 'NotifyContext Swallows a Second Ctrl+C', route: '/go/cli/notifycontext-swallows-a-second-ctrl-c' },
  ],
  'profiling': [
    { label: 'runtime.GC() Before WriteHeapProfile Avoids Stale Data', route: '/go/profiling/runtime-gc-before-writeheapprofile-avoids-stale-data' },
    { label: 'The Heap Profile Samples One Allocation per 512KB', route: '/go/profiling/heap-profile-samples-one-allocation-per-512kb' },
    { label: 'Escape Analysis (-gcflags=-m) Shows Why a Var Heap-Allocates', route: '/go/profiling/escape-analysis-gcflags-m-shows-why-a-var-heap-allocates' },
  ],
  'build': [
    { label: 'ldflags -s Already Implies -w', route: '/go/build/ldflags-s-already-implies-w' },
    { label: 'go build Caches Compiled Packages in GOCACHE, Not GOMODCACHE', route: '/go/build/go-build-caches-compiled-packages-in-gocache-not-gomodcache' },
    { label: 'go vet’s Default Checks Don’t Include Shadow Detection', route: '/go/build/go-vets-default-checks-dont-include-shadow-detection' },
  ],
  'culture': [
    { label: 'DORA Metrics Evolved From Four Keys to Five', route: '/devops/culture/dora-metrics-evolved-from-four-keys-to-five' },
    { label: 'Project Aristotle Ranked Five Dynamics, Not Just Safety', route: '/devops/culture/project-aristotle-ranked-five-dynamics-not-just-safety' },
    { label: 'The SRE Book’s Own Definition Sharpens “Blameless”', route: '/devops/culture/sre-books-own-definition-sharpens-blameless' },
  ],
  'sdlc-agile': [
    { label: 'The Agile Manifesto Values the Right Side Too, Just Less', route: '/devops/sdlc-agile/agile-manifesto-values-the-right-side-too-just-less' },
    { label: 'Little’s Law Assumes a Steady State', route: '/devops/sdlc-agile/littles-law-assumes-a-steady-state' },
    { label: 'Cumulative Flow Diagrams Reveal the Bottleneck', route: '/devops/sdlc-agile/cumulative-flow-diagrams-reveal-the-bottleneck' },
  ],
  'environment-strategy': [
    { label: 'Terraform Workspaces Aren’t Meant for Environment Isolation', route: '/devops/environment-strategy/terraform-workspaces-arent-meant-for-environment-isolation' },
    { label: 'Kubernetes Secrets Are Base64, Not Encrypted, By Default', route: '/devops/environment-strategy/kubernetes-secrets-are-base64-not-encrypted-by-default' },
    { label: 'Kubernetes Has No Built-In Namespace TTL', route: '/devops/environment-strategy/kubernetes-has-no-built-in-namespace-ttl' },
  ],
  'platform-engineering': [
    { label: 'Platform Team Is Its Own Team Topologies Type', route: '/devops/platform-engineering/platform-team-is-its-own-team-topologies-type' },
    { label: 'The SPACE Framework Has Five Dimensions, Not One', route: '/devops/platform-engineering/the-space-framework-has-five-dimensions-not-one' },
    { label: 'Cognitive Load Has Three Types — Platforms Target One', route: '/devops/platform-engineering/cognitive-load-has-three-types-platforms-target-one' },
  ],
  'git-workflows': [
    { label: '--force-with-lease Isn’t Foolproof Without a Fresh Fetch', route: '/devops/git-workflows/force-with-lease-isnt-foolproof-without-a-fresh-fetch' },
    { label: 'BREAKING CHANGE and ! Are Independent Signals', route: '/devops/git-workflows/breaking-change-and-bang-are-independent-signals' },
    { label: 'The 400-Line PR Limit Has a Speed Limit Attached', route: '/devops/git-workflows/the-400-line-pr-limit-has-a-speed-limit-attached' },
  ],
  'github-actions': [
    { label: 'The Fork-PR Token Restriction, Not All PR Workflows', route: '/devops/github-actions/the-fork-pr-token-restriction-not-all-pr-workflows' },
    { label: 'workflow_run Grants Secrets the Trigger Didn’t Have', route: '/devops/github-actions/workflow-run-grants-secrets-the-trigger-didnt-have' },
    { label: 'paths-ignore Can Permanently Block a Required Check', route: '/devops/github-actions/paths-ignore-can-permanently-block-a-required-check' },
  ],
  'azure-pipelines': [
    { label: 'Compile-Time Expressions, Not Runtime', route: '/devops/azure-pipelines/curly-double-braces-are-compile-time-not-runtime' },
    { label: 'A Custom condition: Overwrites the Default', route: '/devops/azure-pipelines/custom-condition-overwrites-not-adds-to-the-default' },
    { label: 'Stages Depend on Whatever Came Right Before Them', route: '/devops/azure-pipelines/stages-depend-on-whatever-stage-came-right-before-them' },
  ],
  'jenkins': [
    { label: 'stash Is Scoped to the Current Build Only', route: '/devops/jenkins/stash-is-scoped-to-the-current-build-only' },
    { label: 'disableConcurrentBuilds Queues, Doesn’t Abort', route: '/devops/jenkins/disableconcurrentbuilds-queues-not-aborts-by-default' },
    { label: 'changed Fires Broader Than Break-or-Recovery', route: '/devops/jenkins/changed-fires-broader-than-break-or-recovery-alone' },
  ],
  'continuous-integration': [
    { label: 'fail-fast: false Lets Every Matrix Job Finish', route: '/devops/continuous-integration/fail-fast-false-lets-every-matrix-job-finish' },
    { label: 'New-Code Quality Gates vs. Global Coverage Thresholds', route: '/devops/continuous-integration/new-code-quality-gates-vs-global-coverage-thresholds' },
    { label: 'merge-multiple Flattens Artifact Subdirectories', route: '/devops/continuous-integration/merge-multiple-flattens-artifact-subdirectories' },
  ],
  'continuous-delivery': [
    { label: 'The Service Selector Switch Isn’t Actually Instant', route: '/devops/continuous-delivery/service-selector-switch-isnt-actually-instant' },
    { label: 'awk’s BEGIN-exit Idiom for Comparing Floats', route: '/devops/continuous-delivery/awk-begin-exit-is-how-bash-compares-floats' },
    { label: 'Phase 3’s Timing Is About References, Not Elapsed Time', route: '/devops/continuous-delivery/phase-3-timing-is-about-references-not-elapsed-time' },
  ],
  'gitops': [
    { label: 'Retry Backoff Is Exponential, Not Linear', route: '/devops/gitops/retry-backoff-is-exponential-not-linear' },
    { label: 'Flux’s Interval Is a Drift Fallback', route: '/devops/gitops/flux-interval-is-a-drift-fallback-not-a-git-trigger' },
    { label: 'Sync Waves Wait for Healthy, Not Just Applied', route: '/devops/gitops/sync-waves-wait-for-healthy-not-just-applied' },
  ],
  'artifact-management': [
    { label: 'imagetools create Never Pulls Image Data', route: '/devops/artifact-management/imagetools-create-never-pulls-image-data' },
    { label: 'RepoDigests Is Empty Until a Registry Round Trip', route: '/devops/artifact-management/repodigests-is-empty-until-a-registry-round-trip' },
    { label: 'Scoped Packages Are Private Unless access Is public', route: '/devops/artifact-management/scoped-packages-are-private-unless-access-is-public' },
  ],
  'docker-cicd': [
    { label: 'ignore-unfixed Excludes Unpatched, Not Minor, CVEs', route: '/devops/docker-cicd/ignore-unfixed-excludes-unpatched-not-minor-cves' },
    { label: 'type=semver Never Fires Without a Git Tag Push', route: '/devops/docker-cicd/type-semver-never-fires-without-a-git-tag-push' },
    { label: 'SBOM Lists Contents, Provenance Describes the Build', route: '/devops/docker-cicd/sbom-lists-contents-provenance-describes-the-build' },
  ],
  'kubernetes-deployments': [
    { label: 'atomic Already Implies wait in Helm Upgrade', route: '/devops/kubernetes-deployments/atomic-already-implies-wait-in-helm-upgrade' },
    { label: 'namePrefix Actually Renames the Live Resource', route: '/devops/kubernetes-deployments/nameprefix-actually-renames-the-live-resource' },
    { label: 'Pause With No Duration Waits Forever', route: '/devops/kubernetes-deployments/pause-with-no-duration-waits-forever-not-briefly' },
  ],
  'iac': [
    { label: 'pipefail Is Not the GitHub Actions Shell Default', route: '/devops/iac/pipefail-is-not-the-github-actions-shell-default' },
    { label: 'Incremental Mode Never Deletes Unmanaged Resources', route: '/devops/iac/incremental-mode-never-deletes-unmanaged-resources' },
    { label: 'check Filters What Runs, soft-fail-on Filters What Blocks', route: '/devops/iac/check-filters-what-runs-soft-fail-on-what-blocks' },
  ],
  'monitoring': [
    { label: 'The Short Window Is for Fast Reset, Not Confirmation', route: '/devops/monitoring/the-short-window-is-for-fast-reset-not-confirmation' },
    { label: 'group_wait, group_interval, repeat_interval Are Different Timers', route: '/devops/monitoring/group-wait-interval-repeat-interval-are-different-timers' },
    { label: 'histogram_quantile Accuracy Depends on Bucket Boundaries', route: '/devops/monitoring/histogram-quantile-accuracy-depends-on-bucket-boundaries' },
  ],
  // NOTE: 'logging' bare key already used by the Node.js hub (/node/logging) — hub-prefixed.
  'devops-logging': [
    { label: 'Merge_Log vs. K8S-Logging.Parser', route: '/devops/logging/merge-log-vs-k8s-logging-parser-are-different-mechanisms' },
    { label: 'Label_Keys traceId Is a Loki Cardinality Explosion', route: '/devops/logging/label-keys-traceid-is-a-loki-cardinality-explosion' },
    { label: 'ILM min_age Counts From Rollover, Not Creation', route: '/devops/logging/ilm-min-age-counts-from-rollover-not-creation' },
  ],
  'incident-response': [
    { label: 'continue: true Is What Lets a Second Route Also Fire', route: '/devops/incident-response/continue-true-is-what-lets-a-second-route-also-fire' },
    { label: 'PagerDuty’s severity Field Is Not the Alert’s Label', route: '/devops/incident-response/pagerdutys-severity-field-is-not-the-alert-label' },
    { label: 'Duration and MTTR Measure From Different Endpoints', route: '/devops/incident-response/duration-and-mttr-measure-from-different-endpoints' },
  ],
  'devsecops': [
    { label: 'Auto-Merge for Patch Updates Is a Workflow, Not a Setting', route: '/devops/devsecops/dependabot-auto-merge' },
    { label: 'Security Tab Findings Aren’t Automatically a Blocked Merge', route: '/devops/devsecops/codeql-merge-blocking' },
    { label: 'What fetch-depth: 0 Actually Buys Gitleaks on a Push', route: '/devops/devsecops/gitleaks-scan-scope' },
  ],
  'release-management': [
    { label: 'release-please Automates Everything Except the Actual Publish', route: '/devops/release-management/release-please-never-publishes' },
    { label: '@semantic-release/npm Updates package.json Only Locally', route: '/devops/release-management/semantic-release-npm-never-commits-back' },
    { label: '“Deploy to Production” Already Happened by the Time the Tag Was Pushed', route: '/devops/release-management/hotfix-step-4-already-happened-at-step-3' },
  ],
  'sre': [
    { label: 'A Dead Man’s Switch Always Fires — Silence Is the Signal', route: '/devops/sre/dead-mans-switch-mechanism' },
    { label: 'The Page’s Own Two Burn Rate Formulas Disagree About Elapsed Time', route: '/devops/sre/burn-rate-formula-elapsed-window-disagreement' },
    { label: 'The Burn-Rate Alerts Reference Recording Rules That Are Never Defined', route: '/devops/sre/alert-rules-reference-undefined-recording-rules' },
  ],
  // NOTE: keyed 'k8s-fundamentals', NOT bare 'fundamentals' — the JavaScript
  // hub already owns the bare 'fundamentals' key above (its own
  // /javascript/fundamentals topic). Hub-prefixed per the established
  // collision-resolution pattern — see DevopsNavComponent-style hubs' own
  // subtopicsOf('k8s-fundamentals') / isSubtopicsExpanded / toggleSubtopics
  // calls in containers-nav.ts, which must all use this same prefixed key.
  'k8s-fundamentals': [
    { label: 'PID 1 Silently Ignores SIGTERM Unless the App Handles It', route: '/containers/fundamentals/pid-1-ignores-sigterm-by-default' },
    { label: 'The “Rootless” UID Mapping Is Opt-In, Not the Default', route: '/containers/fundamentals/user-namespace-remapping-not-default' },
    { label: 'The OOM Killer Targets One Process, Not the Whole Container', route: '/containers/fundamentals/oom-killer-targets-a-process-not-the-container' },
  ],
  'docker-cli': [
    { label: 'docker kill -s SIGHUP Reloads — It Doesn’t Terminate', route: '/containers/docker-cli/kill-sighup-is-reload-not-termination' },
    { label: 'docker kill Doesn’t Suppress a Restart Policy Like docker stop Does', route: '/containers/docker-cli/kill-does-not-suppress-restart-policy-like-stop' },
    { label: 'docker stop $(docker ps -q) Errors When Nothing Is Running', route: '/containers/docker-cli/stop-with-empty-ps-q-errors-not-noop' },
  ],
  'docker-images': [
    { label: 'Stopped Containers Protect Their Images From docker image prune -a', route: '/containers/docker-images/prune-order-stopped-containers-protect-images' },
    { label: 'docker push --all-tags Uploads the Shared Layers Once', route: '/containers/docker-images/all-tags-push-uploads-shared-layers-once' },
    { label: 'A Registry Mirror Only Ever Intercepts Docker Hub Pulls', route: '/containers/docker-images/registry-mirror-only-intercepts-docker-hub' },
  ],
  'dockerfile': [
    { label: 'The Build Stage’s Own node_modules Is Discarded Entirely', route: '/containers/dockerfile/build-stage-node-modules-are-discarded' },
    { label: 'Sibling Stages Build in Parallel, Not Top to Bottom', route: '/containers/dockerfile/sibling-stages-build-in-parallel' },
    { label: 'The apt-get Cleanup Fix Is About Layer Size, Not Just Staleness', route: '/containers/dockerfile/same-layer-cleanup-is-required-for-size-not-just-staleness' },
  ],
  'multi-stage': [
    { label: 'test Runs After builder, in Parallel With runtime — Not With builder', route: '/containers/multi-stage/test-stage-is-sequential-with-builder-parallel-with-runtime' },
    { label: 'npm prune --production Is a Deprecated Flag on Current npm', route: '/containers/multi-stage/npm-prune-production-flag-is-deprecated' },
    { label: 'COPY --from=external-image Still Pulls the Whole Image', route: '/containers/multi-stage/external-image-copy-still-pulls-the-whole-image' },
  ],
  'compose': [
    { label: 'web’s depends_on Lacks a Condition Because api Has No Healthcheck', route: '/containers/compose/web-depends-on-api-lacks-condition-because-api-has-no-healthcheck' },
    { label: 'Why the Anonymous node_modules Volume Preserves the Image’s Content', route: '/containers/compose/anonymous-volume-shadows-bind-mount-and-restores-image-content' },
    { label: 'Anonymous Volumes Orphan on Every Container Recreation', route: '/containers/compose/anonymous-volumes-orphan-on-every-recreation' },
  ],
  'compose-profiles': [
    { label: '!override Replaces a Merged List Directly — No Workaround Needed', route: '/containers/compose-profiles/override-tag-replaces-lists-without-workarounds' },
    { label: 'The Merge Key Needs a Mapping Anchor, Not the List-Alias Syntax', route: '/containers/compose-profiles/merge-key-needs-mapping-not-list-alias-syntax' },
    { label: 'Map-Form environment: Merges by Key, Not by Concatenation', route: '/containers/compose-profiles/map-form-environment-merges-by-key-not-concatenation' },
  ],
  'k8s-architecture': [
    { label: 'NotReady Eviction Is Taint-Based, Not a Fixed Global Flag', route: '/containers/k8s-architecture/not-ready-eviction-is-taint-based-not-a-fixed-flag' },
    { label: 'The dockershim Removal Never Broke Docker-Built Images', route: '/containers/k8s-architecture/dockershim-removal-does-not-break-docker-built-images' },
    { label: 'kube-proxy Programs Rules — It Never Forwards Packets Itself', route: '/containers/k8s-architecture/kube-proxy-programs-rules-it-does-not-forward-packets' },
  ],
  'kubectl': [
    { label: 'apply Uses a Three-Way Merge via the last-applied-configuration Annotation', route: '/containers/kubectl/apply-uses-three-way-merge-via-last-applied-annotation' },
    { label: 'Force-Delete Only Removes the etcd Object, Not the Process', route: '/containers/kubectl/force-delete-only-removes-the-etcd-object-not-the-process' },
    { label: 'scale Against an HPA-Managed Deployment Gets Silently Reverted', route: '/containers/kubectl/scale-against-an-hpa-gets-silently-reverted' },
  ],
  'operators-crds': [
    { label: 'Two Update Calls in One Reconcile Risk a Stale resourceVersion Conflict', route: '/containers/operators-crds/update-then-status-update-risks-a-stale-resourceversion-conflict' },
    { label: 'A CRD and Its Own CR Applied Together Can Race the Established Condition', route: '/containers/operators-crds/crd-and-cr-in-the-same-apply-race-the-established-condition' },
    { label: 'The Requeue “Storm” Is Actually Rate-Limited Exponential Backoff', route: '/containers/operators-crds/requeue-storm-is-actually-rate-limited-exponential-backoff' },
  ],
  'pods-deployments': [
    { label: 'Terminating Pods Still Receive Traffic Without a preStop Delay', route: '/containers/pods-deployments/terminating-pods-still-receive-traffic-without-a-prestop-delay' },
    { label: 'minReadySeconds Throttles Rollout Pace, Not Just Pod Status', route: '/containers/pods-deployments/minreadyseconds-throttles-rollout-pace-not-just-pod-status' },
    { label: 'Generation vs. observedGeneration Tracks Controller Catch-Up', route: '/containers/pods-deployments/generation-vs-observedgeneration-tracks-controller-catch-up' },
  ],
  'services-ingress': [
    { label: 'sessionAffinity: ClientIP Pins the SNAT’d Source, Not the Real Client', route: '/containers/services-ingress/sessionaffinity-clientip-pins-the-snatted-source-not-the-real-client' },
    { label: 'ExternalName Bypasses kube-proxy — No Health Checks, No Port Mapping', route: '/containers/services-ingress/externalname-bypasses-kube-proxy-no-health-checks-no-port-mapping' },
    { label: 'pathType: Prefix Matches Path Elements, Not Raw String Prefixes', route: '/containers/services-ingress/pathtype-prefix-matches-path-elements-not-raw-string-prefixes' },
  ],
  'configmaps-secrets': [
    { label: 'subPath Volume Mounts Never Receive ConfigMap/Secret Updates At All', route: '/containers/configmaps-secrets/subpath-volume-mounts-never-receive-configmap-secret-updates' },
    { label: 'RBAC resourceNames Cannot Restrict list/watch — the Verb Itself Must Go', route: '/containers/configmaps-secrets/rbac-resourcenames-cannot-restrict-list-watch-the-verb-itself-must-go' },
    { label: 'Deleting an Immutable ConfigMap Breaks New Pods, Not Running Ones', route: '/containers/configmaps-secrets/deleting-an-immutable-configmap-breaks-new-pods-not-running-ones' },
  ],
  'storage': [
    { label: 'A Released PV Never Auto-Rebinds — claimRef Must Be Cleared Manually', route: '/containers/storage/released-pv-never-auto-rebinds-claimref-must-be-cleared-manually' },
    { label: 'A Zonal PVC Can Strand a Rescheduled StatefulSet Pod in Pending', route: '/containers/storage/a-zonal-pvc-can-strand-a-rescheduled-statefulset-pod-in-pending' },
    { label: 'RWOP Closes the Gap RWO Leaves — Same-Node Pods Can Still Double-Write', route: '/containers/storage/rwop-closes-the-gap-rwo-leaves-same-node-pods-can-still-double-write' },
  ],
  'helm': [
    { label: 'helm rollback Never Undoes a pre-upgrade Hook — Only pre-rollback Hooks Run', route: '/containers/helm/rollback-never-undoes-a-pre-upgrade-hook-only-pre-rollback-hooks-run' },
    { label: 'history-max Defaults to 10 — Old Revisions Are Pruned, Not Hidden', route: '/containers/helm/history-max-defaults-to-10-old-revisions-are-pruned-not-hidden' },
    { label: '--set Always Beats -f, Regardless of Command-Line Order', route: '/containers/helm/set-always-beats-f-regardless-of-command-line-order' },
  ],
  'container-security': [
    { label: 'fsGroup Makes Non-Root Volume Writes Actually Work', route: '/containers/container-security/fsgroup-makes-non-root-volume-writes-work-and-recursive-chown-can-be-slow' },
    { label: 'A NetworkPolicy Silently Does Nothing Without a CNI That Enforces It', route: '/containers/container-security/networkpolicy-silently-does-nothing-without-a-cni-that-enforces-it' },
    { label: 'PSA restricted Never Checks readOnlyRootFilesystem At All', route: '/containers/container-security/psa-restricted-never-checks-readonlyrootfilesystem-at-all' },
  ],
  'rbac': [
    { label: 'The bind Verb Gates Escalation — create on RoleBindings Alone Isn’t Enough', route: '/containers/rbac/bind-verb-gates-escalation-create-on-rolebindings-alone-is-not-enough' },
    { label: 'Aggregated ClusterRoles Retroactively Grant New Permissions to Old Bindings', route: '/containers/rbac/aggregated-clusterroles-retroactively-grant-new-permissions-to-old-bindings' },
    { label: 'Bound ServiceAccount Tokens Expire in 1 Hour — Legacy Tokens Never Did', route: '/containers/rbac/bound-serviceaccount-tokens-expire-in-1-hour-legacy-tokens-never-did' },
  ],
  'statefulsets': [
    { label: 'PDB Only Blocks Voluntary Disruptions — a Node Crash Ignores It Entirely', route: '/containers/statefulsets/pdb-only-blocks-voluntary-disruptions-a-node-crash-ignores-it-entirely' },
    { label: 'Scaling Back Up Reattaches the Old PVC With Its Old Data, Silently', route: '/containers/statefulsets/scaling-back-up-reattaches-the-old-pvc-with-its-old-data-silently' },
    { label: 'Init Containers Share the Pod’s Network Namespace, Not Just Its Volumes', route: '/containers/statefulsets/init-containers-share-the-pods-network-namespace-not-just-its-volumes' },
  ],
  'resource-limits': [
    { label: 'CPU Limit Throttling Triggers on a 100ms Burst, Not Average Usage', route: '/containers/resource-limits/cpu-limit-throttling-triggers-on-a-100ms-burst-not-average-usage' },
    { label: 'A ResourceQuota Rejects Pod Creation Outright — It Never Defaults to Zero', route: '/containers/resource-limits/resourcequota-rejects-pod-creation-outright-it-never-defaults-to-zero' },
    { label: 'HPA Scales Against Requests, Not Limits — a Low Request Is Hypersensitive', route: '/containers/resource-limits/hpa-scales-against-requests-not-limits-a-low-request-is-hypersensitive' },
  ],
  'hpa': [
    { label: 'Scale-Up and Scale-Down Stabilization Windows Aggregate Oppositely', route: '/containers/hpa/scale-up-and-scale-down-stabilization-windows-aggregate-oppositely' },
    { label: 'selectPolicy Defaults to Max — Multiple Policies Pick the Fastest, Not Safest', route: '/containers/hpa/selectpolicy-defaults-to-max-multiple-policies-pick-the-fastest-not-safest' },
    { label: 'Unready Pods Count as 0% Utilization, Diluting the Average', route: '/containers/hpa/unready-pods-count-as-0-percent-utilization-diluting-the-average' },
  ],
  'network-policies': [
    { label: 'NetworkPolicies Union Additively — a Second Policy Can Only Allow More', route: '/containers/network-policies/networkpolicies-union-additively-a-second-policy-can-only-allow-more' },
    { label: 'ipBlock Matches Raw IPs — a CIDR Overlapping the Cluster Network Can Leak', route: '/containers/network-policies/ipblock-matches-raw-ips-a-cidr-overlapping-the-cluster-network-can-leak' },
    { label: 'The “Always Allow DNS” Egress Rule Has No Destination — a Real Exfiltration Path', route: '/containers/network-policies/the-always-allow-dns-egress-rule-has-no-destination-a-real-exfiltration-path' },
  ],
  'troubleshooting': [
    { label: 'CrashLoop Backoff Resets After 10 Minutes of Stable Running, Not Every Restart', route: '/containers/troubleshooting/crashloop-backoff-resets-after-10-min-stable-running' },
    { label: 'Exit Code 137 Is SIGKILL, Not Always OOMKilled — Check the reason Field', route: '/containers/troubleshooting/exit-code-137-is-sigkill-not-always-oomkilled' },
    { label: 'kubectl logs --previous Only Reaches the Latest Crash', route: '/containers/troubleshooting/previous-logs-only-reach-the-latest-crash' },
  ],
  'patterns': [
    { label: 'getTogglerProps Overwrites a Consumer’s Own id', route: '/react/patterns/testing-that-gettogglerprops-silently-overwrites-a-consumers-own-id-unlike-its-onclick-composition' },
    { label: 'useProductSearch Shares localStorage Across Every Instance', route: '/react/patterns/testing-that-useproductsearch-shares-localstorage-across-every-component-instance-via-its-hardcoded-key' },
    { label: 'useCounter’s reset() Is Frozen to the Mount-Time initialCount', route: '/react/patterns/testing-that-usecounters-reset-is-frozen-to-the-mount-time-initialcount-ignoring-later-prop-changes' },
  ],
  // NOTE: keyed 'react-typescript', NOT bare 'typescript' — the entire
  // TypeScript hub's own top-level route slug is 'typescript', and any
  // other hub's own "X & TypeScript" topic could plausibly claim the
  // bare key too. Proactively hub-prefixed to avoid that collision.
  'react-typescript': [
    { label: 'Select’s Runtime Coercion Mishandles a Boolean-Typed T', route: '/react/typescript/testing-that-selects-runtime-coercion-silently-mishandles-a-boolean-typed-t' },
    { label: 'Discriminated Union Narrowing Gives Zero Runtime Protection', route: '/react/typescript/testing-that-discriminated-union-narrowing-gives-zero-runtime-protection-against-mismatched-data' },
    { label: 'SimpleInput’s Optional onChange Can Create a Read-Only Controlled Input', route: '/react/typescript/testing-that-simpleinputs-optional-onchange-can-silently-create-a-readonly-controlled-input' },
  ],
  // NOTE: keyed 'react-testing', NOT bare 'testing' — Angular's own
  // /angular/testing topic already claims the bare key with its own
  // subtopics.
  'react-testing': [
    { label: 'queryBy Returns null, getBy Throws — the Real Library', route: '/react/testing/testing-that-queryby-returns-null-and-getby-throws-using-the-real-testing-library' },
    { label: 'fireEvent.click Skips Focus, userEvent.click Doesn’t', route: '/react/testing/testing-that-fireevent-click-doesnt-trigger-focus-but-userevent-click-does' },
    { label: 'A Hook Setter Without act() Produces a Real Console Warning', route: '/react/testing/testing-that-calling-a-hooks-setter-without-act-produces-a-real-console-warning' },
  ],
  nextjs: [
    { label: 'use client Propagates to Every Import', route: '/react/nextjs/testing-that-use-client-propagates-to-every-plain-utility-import-not-just-components' },
    { label: 'revalidatePath Is Cache Invalidation, Not a Live Push', route: '/react/nextjs/testing-that-revalidatepath-only-refreshes-the-server-cache-not-already-rendered-client-state' },
    { label: 'useSearchParams Without Suspense Forces the Whole Page Dynamic', route: '/react/nextjs/testing-that-usesearchparams-without-suspense-forces-the-entire-page-dynamic-not-just-that-segment' },
  ],
  native: [
    { label: 'Text-in-View Crashes Only in Production Builds', route: '/react/native/testing-that-text-directly-in-view-crashes-only-in-production-builds-not-in-dev-or-expo-go' },
    { label: 'getItemLayout Assumes Every Row Is the Same Height', route: '/react/native/testing-that-getitemlayout-assumes-uniform-row-height-and-corrupts-scroll-position-if-rows-vary' },
    { label: 'StyleSheet.create() Doesn’t Replace React.memo', route: '/react/native/testing-that-stylesheetcreate-optimizes-native-layout-not-react-reconciliation-unlike-reactmemo' },
  ],
  'hook-form': [
    { label: 'watch() Re-renders the Whole Component', route: '/react/hook-form/testing-that-watch-rerenders-the-whole-component-on-every-keystroke-not-just-the-watched-field' },
    { label: 'Index Keys Show the Wrong Value After remove()', route: '/react/hook-form/testing-that-index-keys-show-the-wrong-typed-value-after-usefieldarray-remove' },
    { label: 'Missing valueAsNumber Breaks Arithmetic Silently', route: '/react/hook-form/testing-that-missing-valueasnumber-turns-submitted-numbers-into-concatenated-strings' },
  ],
  // NOTE: keyed 'react-animations', NOT bare 'animations' — Angular's
  // own /angular/animations topic already claims the bare key.
  'react-animations': [
    { label: 'Missing Key Breaks Exit for the Wrong List Item', route: '/react/animations/testing-that-a-missing-key-makes-animatepresence-exit-animate-the-wrong-list-item' },
    { label: 'Width Animation Reflows Siblings, transform Doesn’t', route: '/react/animations/testing-that-animating-width-reflows-sibling-elements-but-animating-transform-never-does' },
    { label: 'viewport.once Controls Repeat, Not Just the First Play', route: '/react/animations/testing-that-viewport-once-true-stops-the-whileinview-animation-from-repeating-on-every-scroll-reentry' },
  ],
  // NOTE: keyed 'react-security', NOT bare 'security' — the standalone
  // Security & Auth hub already claims the bare key with its own subtopics.
  'react-security': [
    { label: 'JSX Text Node vs Raw HTML — a Real DOM Check', route: '/react/security/testing-that-jsx-renders-a-real-text-node-while-unsanitized-dangerouslysetinnerhtml-creates-a-real-element' },
    { label: 'DOMPurify Strips Handlers, Keeps Allowed Tags', route: '/react/security/testing-that-dompurify-strips-event-handlers-and-javascript-urls-but-keeps-allowed-tags-intact' },
    { label: 'A Protocol-Relative URL Bypasses a Naive Redirect Check', route: '/react/security/testing-that-a-protocol-relative-url-bypasses-a-naive-starts-with-slash-open-redirect-check' },
  ],
  fundamentals: [
    { label: 'Number.isNaN() vs Global isNaN()', route: '/javascript/fundamentals/testing-that-numberisnan-and-global-isnan-disagree-on-empty-strings-whitespace-and-garbage-text' },
    { label: 'Nullish Assignment Keeps 0, OR Overwrites It', route: '/javascript/fundamentals/testing-that-nullish-assignment-keeps-zero-while-or-assignment-silently-overwrites-it' },
    { label: 'Object.freeze() Throws in Strict Mode', route: '/javascript/fundamentals/testing-that-mutating-a-frozen-object-throws-in-strict-mode-es-modules-not-silently-fails' },
  ],
  closures: [
    { label: 'var Shares One Binding, let Creates One Per Iteration', route: '/javascript/closures/testing-that-var-shares-one-binding-across-a-loop-while-let-creates-a-fresh-one-per-iteration' },
    { label: 'Two memoize() Wrappers Don’t Share a Cache', route: '/javascript/closures/testing-that-two-separate-memoize-wrappers-of-the-same-function-keep-genuinely-private-caches' },
    { label: 'Closure Over an Object Property vs a Destructured Primitive', route: '/javascript/closures/testing-that-a-closure-over-an-object-property-sees-later-mutations-while-a-destructured-primitive-copy-doesnt' },
  ],
  hoisting: [
    { label: 'typeof in the TDZ Throws ReferenceError', route: '/javascript/hoisting/testing-that-typeof-on-a-tdz-variable-throws-referenceerror-while-a-truly-undeclared-variable-stays-safe' },
    { label: 'Function Declaration Wins Hoisting, var Overwrites It After', route: '/javascript/hoisting/testing-that-a-function-declaration-wins-the-hoisting-race-but-a-same-named-var-assignment-overwrites-it-afterward' },
    { label: 'Duplicate let Across Switch Cases Throws a Real SyntaxError', route: '/javascript/hoisting/testing-that-declaring-the-same-let-name-in-two-switch-cases-without-their-own-blocks-throws-a-real-syntaxerror' },
  ],
  symbols: [
    { label: 'Which Operations Actually See Symbol Keys', route: '/javascript/symbols/testing-which-operations-actually-see-symbol-keyed-properties-and-which-silently-skip-them' },
    { label: 'Symbol.toPrimitive’s Hint Differs by Coercion Context', route: '/javascript/symbols/testing-that-symboltoprimitives-hint-parameter-differs-across-string-number-and-default-coercion-contexts' },
    { label: 'Symbol.hasInstance Overrides instanceof for Any Value', route: '/javascript/symbols/testing-that-symbolhasinstance-completely-overrides-instanceof-even-for-completely-unrelated-values' },
  ],
  functions: [
    { label: 'bind() Is Permanent — call/apply/bind Can’t Override It', route: '/javascript/functions/testing-that-bind-is-permanent-a-later-call-apply-or-second-bind-cant-override-it' },
    { label: 'Default Parameter Only Triggers on undefined', route: '/javascript/functions/testing-that-a-default-parameter-only-triggers-on-undefined-not-null-zero-false-or-empty-string' },
    { label: 'new Overrides Even an Explicitly Bound Function', route: '/javascript/functions/testing-that-calling-new-on-an-already-bound-function-creates-a-fresh-object-not-the-bound-target' },
  ],
  prototypes: [
    { label: 'Object.create(null) Has No Methods, Not Just Hidden', route: '/javascript/prototypes/testing-that-object-create-null-genuinely-has-no-methods-not-just-hidden-from-enumeration' },
    { label: 'Static Methods Don’t Exist on Instances at All', route: '/javascript/prototypes/testing-that-calling-a-static-method-on-an-instance-throws-a-real-typeerror-not-just-a-lint-warning' },
    { label: 'Prototype Pollution Contaminates Every Unrelated Object', route: '/javascript/prototypes/testing-that-a-naive-for-in-merge-lets-prototype-pollution-contaminate-a-completely-unrelated-freshly-created-object' },
  ],
  objects: [
    { label: 'Integer Keys Sort First, Regardless of Insertion Order', route: '/javascript/objects/testing-that-integer-like-keys-sort-first-in-every-enumeration-method-not-just-object-keys' },
    { label: 'Object.assign Invokes Setters, Spread Doesn’t', route: '/javascript/objects/testing-that-object-assign-invokes-a-target-setter-while-spread-creates-a-plain-property-instead' },
    { label: 'structuredClone Strips Class Prototype, Throws on Functions', route: '/javascript/objects/testing-that-structuredclone-strips-a-class-instances-prototype-and-throws-on-a-nested-function' },
  ],
  destructuring: [
    { label: 'A Destructured Method Loses Its this Context', route: '/javascript/destructuring/testing-exactly-where-a-destructured-method-loses-its-this-context-and-where-it-doesnt' },
    { label: 'Bare Destructuring Assignment Needs Parens — a Real SyntaxError', route: '/javascript/destructuring/testing-that-a-bare-destructuring-assignment-to-existing-variables-throws-a-real-syntaxerror-without-parens' },
    { label: 'One-Level Default Doesn’t Guard a Deeper Nested Property', route: '/javascript/destructuring/testing-that-a-default-value-at-one-nesting-level-doesnt-protect-a-property-two-levels-deeper' },
  ],
  // NOTE: keyed 'js-arrays', NOT bare 'arrays' — the C# hub's own
  // /csharp/arrays topic already claims the bare key.
  'js-arrays': [
    { label: 'forEach’s Async Callback Is Never Awaited', route: '/javascript/arrays/testing-that-foreach-never-awaits-an-async-callback-while-for-of-and-promise-all-map-genuinely-do' },
    { label: 'sort() Is Genuinely Stable — Ties Keep Insertion Order', route: '/javascript/arrays/testing-that-array-prototype-sort-is-genuinely-stable-elements-with-equal-comparator-results-keep-their-original-order' },
    { label: 'Mutating an Array During map() Really Does Skip Elements', route: '/javascript/arrays/testing-that-mutating-the-source-array-with-splice-inside-a-map-callback-actually-skips-real-elements' },
  ],
  promises: [
    { label: 'Promise.all Rejection Doesn’t Cancel Other Pending Promises', route: '/javascript/promises/promise-all-rejection-doesnt-cancel-other-pending-promises' },
    { label: 'Forgetting return in .then() Breaks the Chained Value', route: '/javascript/promises/forgetting-return-in-then-breaks-the-chained-value' },
    { label: 'async Functions Always Wrap Their Return Value', route: '/javascript/promises/async-function-always-wraps-return-value-in-a-promise' },
  ],
  'event-loop': [
    { label: 'A Microtask Loop Delays an Earlier setTimeout', route: '/javascript/event-loop/microtask-loop-delays-a-macrotask-scheduled-before-it' },
    { label: 'Promise Chains Interleave One Microtask at a Time', route: '/javascript/event-loop/independent-promise-chains-interleave-one-microtask-at-a-time' },
    { label: 'A Busy-Loop Blocks Every Pending setTimeout', route: '/javascript/event-loop/synchronous-busy-loop-blocks-every-pending-settimeout-until-it-ends' },
  ],
  'error-handling': [
    { label: 'finally’s return Overrides catch’s Return Value', route: '/javascript/error-handling/finally-return-silently-overrides-the-catch-blocks-return-value' },
    { label: 'try/catch Never Catches a setTimeout Error', route: '/javascript/error-handling/try-catch-never-catches-an-error-thrown-inside-settimeout' },
    { label: 'AggregateError Packages Every Rejection', route: '/javascript/error-handling/aggregateerror-from-promise-any-packages-every-rejection-not-just-the-first' },
  ],
  generators: [
    { label: 'Spread and for...of Ignore the Return Value', route: '/javascript/generators/spread-and-for-of-ignore-a-generators-return-value' },
    { label: 'break Triggers generator.return() and finally', route: '/javascript/generators/breaking-a-for-of-loop-triggers-generator-return-and-runs-finally' },
    { label: 'yield* Forwards next() Values and throw()', route: '/javascript/generators/yield-delegation-forwards-next-values-and-throw-into-the-inner-generator' },
  ],
  dom: [
    { label: 'A Hidden Write Still Causes Layout Thrashing', route: '/javascript/dom/hidden-write-inside-a-third-party-call-still-causes-layout-thrashing' },
    { label: 'innerHTML += Destroys Child Listeners', route: '/javascript/dom/innerhtml-plus-equals-reparses-the-whole-container-and-destroys-child-listeners' },
    { label: 'querySelectorAll Is Static, getElementsByClassName Is Live', route: '/javascript/dom/queryselectorall-is-a-static-nodelist-getelementsbyclassname-is-a-live-htmlcollection' },
  ],
  events: [
    { label: 'Capture Fires Before Bubble, Outside-In', route: '/javascript/events/capture-fires-before-bubble-in-strict-outside-in-order' },
    { label: 'Custom Events Don’t Bubble by Default', route: '/javascript/events/custom-events-dont-bubble-by-default' },
    { label: 'closest() Works Through Nested SVG Targets', route: '/javascript/events/closest-walks-up-through-nested-svg-targets-correctly' },
  ],
  'browser-apis': [
    { label: 'fetch() Resolves on 4xx/5xx — Never Rejects', route: '/javascript/browser-apis/fetch-resolves-on-4xx-5xx-never-rejects' },
    { label: 'A Response Body Can Only Be Consumed Once', route: '/javascript/browser-apis/response-body-can-only-be-consumed-once' },
    { label: 'AbortController Stops Every Pending Retry', route: '/javascript/browser-apis/abort-signal-stops-all-pending-retries-immediately' },
  ],
  // NOTE: keyed 'js-modules', NOT bare 'modules' — the TypeScript hub's own
  // /typescript/modules topic already claims the bare key.
  'js-modules': [
    { label: 'ESM Imports Are Live Bindings', route: '/javascript/modules/esm-imports-are-live-bindings-not-value-copies' },
    { label: 'Modules Are Singletons', route: '/javascript/modules/modules-are-singletons-shared-state-across-importers' },
    { label: 'Circular Import Binding Exists but Value Is Undefined', route: '/javascript/modules/circular-import-binding-exists-but-value-is-undefined' },
  ],
  bundlers: [
    { label: 'Tree-Shaking Only Works Reliably With ESM', route: '/javascript/bundlers/tree-shaking-only-works-reliably-with-esm-not-commonjs' },
    { label: 'sideEffects: false Needs an Explicit File List', route: '/javascript/bundlers/sideeffects-false-requires-explicitly-listing-real-side-effect-files' },
    { label: 'devDependencies Affects Production Install Size', route: '/javascript/bundlers/devdependencies-vs-dependencies-affects-production-install-size' },
  ],
  // NOTE: keyed 'js-patterns', NOT bare 'patterns' — the React hub's own
  // /react/patterns topic already claims the bare key.
  'js-patterns': [
    { label: 'Memoize With Objects Uses Reference Equality', route: '/javascript/patterns/memoize-uses-reference-equality-object-args-always-miss' },
    { label: 'Spreading a Prototype in a Mixin Breaks instanceof', route: '/javascript/patterns/spreading-a-prototype-in-a-mixin-breaks-instanceof' },
    { label: 'Middleware Short-Circuits Without next()', route: '/javascript/patterns/middleware-short-circuits-when-a-handler-never-calls-next' },
  ],
  functional: [
    { label: 'Object.freeze() Is Only Shallow', route: '/javascript/functional/object-freeze-is-only-shallow-nested-objects-stay-mutable' },
    { label: 'curry() Miscounts Default and Rest Parameters', route: '/javascript/functional/curry-fn-length-miscounts-default-and-rest-parameters' },
    { label: 'Missing return in pipe() Passes undefined Downstream', route: '/javascript/functional/missing-return-in-a-pipe-stage-passes-undefined-downstream' },
  ],
  proxy: [
    { label: 'set Trap Must Return true', route: '/javascript/proxy/set-trap-must-return-true-or-strict-mode-throws' },
    { label: 'New Proxy Per Nested get Breaks Equality', route: '/javascript/proxy/new-proxy-per-nested-get-breaks-referential-equality' },
    { label: 'Lying About a Frozen Property Throws', route: '/javascript/proxy/lying-about-a-frozen-propertys-value-throws-invariant-violation' },
  ],
  weakrefs: [
    { label: 'WeakMap Keys Must Be Objects', route: '/javascript/weakrefs/weakmap-keys-must-be-objects-primitives-throw-typeerror' },
    { label: 'WeakMap/WeakSet Are Non-Iterable', route: '/javascript/weakrefs/weakmap-and-weakset-are-non-iterable-by-design' },
    { label: 'register() Rejects heldValue === target', route: '/javascript/weakrefs/register-throws-if-held-value-is-the-same-as-target' },
  ],
  'document-structure': [
    { label: 'defer Runs in Order, async Runs Whenever Ready', route: '/html/document-structure/defer-runs-in-order-after-parse-async-runs-whenever-ready' },
    { label: 'A Missing DOCTYPE Triggers Quirks Mode', route: '/html/document-structure/missing-doctype-triggers-quirks-mode-compatmode-reveals-it' },
    { label: 'A Duplicate head Element’s Content Moves to body', route: '/html/document-structure/a-duplicate-head-elements-content-is-moved-into-body' },
  ],
  'semantic-elements': [
    { label: 'A Second main Is Silently Allowed', route: '/html/semantic-elements/a-second-main-is-silently-allowed-with-no-thrown-error' },
    { label: 'A Heading-Less section Is Valid HTML', route: '/html/semantic-elements/a-heading-less-section-is-valid-parseable-html' },
    { label: 'time’s datetime Can Diverge From Its Text', route: '/html/semantic-elements/times-datetime-property-can-diverge-from-its-own-text' },
  ],
  // NOTE: keyed 'html-forms', NOT bare 'forms' — the Angular hub's own
  // /angular/forms topic already claims the bare key.
  'html-forms': [
    { label: 'name, Not id, Determines the FormData Key', route: '/html/forms/name-not-id-determines-the-submitted-formdata-key' },
    { label: 'novalidate Disables Blocking, Not checkValidity()', route: '/html/forms/novalidate-disables-blocking-but-checkvalidity-still-works' },
    { label: 'enctype Only Affects Native Submission', route: '/html/forms/enctype-only-affects-native-submission-not-formdata-api' },
  ],
  media: [
    { label: 'loading="lazy" Defers the Fetch', route: '/html/media/lazy-loading-defers-fetch-until-viewport' },
    { label: 'sizes Picks the srcset Candidate', route: '/html/media/sizes-not-media-picks-srcset-candidate' },
    { label: 'Empty sandbox Blocks Scripts', route: '/html/media/empty-sandbox-blocks-script-execution' },
  ],
  tables: [
    { label: 'Leftover rowspan Cell Shifts Everything', route: '/html/tables/rowspan-covered-cells-shift-every-later-cell' },
    { label: 'table-layout: fixed Uses Row 1 Only', route: '/html/tables/table-layout-fixed-sizes-columns-from-first-row' },
    { label: 'col Only Supports 4 CSS Properties', route: '/html/tables/col-only-supports-background-border-visibility-width' },
  ],
  'links-navigation': [
    { label: 'noopener Genuinely Nulls window.opener', route: '/html/links-navigation/rel-noopener-genuinely-nulls-window-opener' },
    { label: 'href-less Anchor Skips Tab Navigation', route: '/html/links-navigation/href-less-anchor-is-skipped-by-tab-navigation' },
    { label: 'LVHFA Order Decides the Winner', route: '/html/links-navigation/lvhfa-source-order-decides-the-equal-specificity-winner' },
  ],
  // NOTE: keyed 'html-accessibility', NOT bare 'accessibility' — the Angular
  // hub's own /angular/accessibility topic already claims the bare key.
  'html-accessibility': [
    { label: 'aria-labelledby Order and Missing-id Skip', route: '/html/accessibility/aria-labelledby-concatenates-in-listed-order-skips-missing-ids' },
    { label: 'aria-hidden vs the Tab Order', route: '/html/accessibility/aria-hidden-removes-from-a11y-tree-not-tab-order' },
    { label: 'button vs div role=button Keyboard Activation', route: '/html/accessibility/native-button-translates-enter-space-div-role-button-does-not' },
  ],
  'head-metadata': [
    { label: 'Font preload Without crossorigin Fetches Twice', route: '/html/head-metadata/font-preload-without-crossorigin-fetches-twice' },
    { label: 'preload Without as= Is Ignored', route: '/html/head-metadata/preload-without-as-is-silently-ignored' },
    { label: 'Relative canonical Resolves Differently', route: '/html/head-metadata/relative-canonical-resolves-differently-per-page' },
  ],
  'custom-elements': [
    { label: 'cloneNode(true) Is Required', route: '/html/custom-elements/clonenode-required-appendchild-consumes-the-template' },
    { label: 'composed:true Crosses the Shadow Boundary', route: '/html/custom-elements/composed-true-required-to-cross-the-shadow-boundary' },
    { label: 'attributeChangedCallback Before connectedCallback', route: '/html/custom-elements/attributechangedcallback-fires-before-connectedcallback' },
  ],
  'iframes-embeds': [
    { label: 'allow-scripts + allow-same-origin Sandbox Escape', route: '/html/iframes-embeds/allow-scripts-plus-allow-same-origin-enables-sandbox-escape' },
    { label: 'Missing width/height Causes Layout Shift', route: '/html/iframes-embeds/missing-width-height-causes-measurable-layout-shift' },
    { label: 'srcdoc vs src Network Requests', route: '/html/iframes-embeds/srcdoc-makes-zero-network-requests-src-makes-a-real-one' },
  ],
  'canvas-svg': [
    { label: 'Canvas Resolution vs CSS Display Size', route: '/html/canvas-svg/canvas-html-attrs-set-resolution-css-only-stretches-pixels' },
    { label: 'Missing beginPath() Merges Paths', route: '/html/canvas-svg/missing-beginpath-merges-paths-provable-via-pixel-data' },
    { label: 'SVG Without viewBox Ignores CSS Resize', route: '/html/canvas-svg/svg-without-viewbox-ignores-css-resize-of-coordinates' },
  ],
  // NOTE: keyed 'html-performance', NOT bare 'performance' — that bare key
  // is already claimed elsewhere in this shared map.
  'html-performance': [
    { label: 'Too Many High-Priority Resources Dilutes It', route: '/html/performance/too-many-high-priority-resources-dilutes-the-signal' },
    { label: 'defer Guarantees Order + DOMContentLoaded Timing', route: '/html/performance/defer-guarantees-order-and-fires-before-domcontentloaded' },
    { label: 'content-visibility: auto Genuinely Skips Rendering', route: '/html/performance/content-visibility-auto-genuinely-skips-offscreen-rendering' },
  ],
  'pwa-service-workers': [
    { label: 'Registration Scope From Script Location', route: '/html/pwa-service-workers/registration-scope-is-set-by-the-script-file-location' },
    { label: 'No DOM Access Inside a Service Worker', route: '/html/pwa-service-workers/service-workers-genuinely-have-no-dom-access' },
    { label: 'New SW Waits Without skipWaiting()', route: '/html/pwa-service-workers/a-new-sw-sits-in-registration-waiting-without-skipwaiting' },
  ],
  seo: [
    { label: 'document.title Uses Only the First title', route: '/html/seo/document-title-deterministically-uses-only-the-first-title' },
    { label: 'Malformed JSON-LD Renders Fine, Fails to Parse', route: '/html/seo/malformed-json-ld-renders-fine-but-fails-to-parse' },
    { label: 'og:image Dimensions Checkable via Image API', route: '/html/seo/og-image-dimensions-are-checkable-live-via-the-image-api' },
  ],
  apis: [
    { label: 'FileReaderSync Only Exists in Workers', route: '/html/apis/filereadersync-only-exists-inside-a-real-web-worker' },
    { label: 'navigator.share Feature Detection', route: '/html/apis/navigator-share-feature-detection-prevents-a-real-typeerror' },
    { label: 'Notification.permission Never Throws', route: '/html/apis/notification-permission-is-readable-anytime-construction-never-throws' },
  ],
  // NOTE: keyed 'html-fundamentals', NOT bare 'fundamentals' — the
  // JavaScript hub's own /javascript/fundamentals topic already claims
  // the bare key.
  'html-fundamentals': [
    { label: 'Attribute vs Property Divergence', route: '/html/fundamentals/attribute-vs-property-input-value-genuinely-diverges' },
    { label: 'Unknown Elements Fall Back to Inline', route: '/html/fundamentals/unknown-elements-fall-back-to-anonymous-inline-rendering' },
    { label: 'Stray br End Tag Inserts a Second Break', route: '/html/fundamentals/a-stray-br-end-tag-inserts-a-second-line-break' },
  ],
  'headings-paragraphs': [
    { label: 'strong/b and em/i Are Visually Identical', route: '/html/headings-paragraphs/strong-b-and-em-i-are-visually-identical-by-default' },
    { label: 'Nesting strong Doesn’t Compound', route: '/html/headings-paragraphs/nesting-strong-doesnt-compound-weight-or-emphasis' },
    { label: 'Multiple h1s Never Auto-Demoted', route: '/html/headings-paragraphs/multiple-h1s-are-never-auto-demoted-by-sectioning-depth' },
  ],
  'input-types': [
    { label: 'Number Input’s Empty Value for Invalid Text', route: '/html/input-types/number-input-empty-value-for-invalid-text' },
    { label: 'Unsupported Types Fall Back to Text', route: '/html/input-types/unsupported-types-fallback-to-text' },
    { label: 'step Mismatch Is Checkable via Validity', route: '/html/input-types/step-mismatch-checkable-via-validity' },
  ],
  'landmark-elements': [
    { label: 'Multiple main Elements Don’t Error', route: '/html/landmark-elements/multiple-main-elements-dont-error' },
    { label: 'ariaLabel Distinguishes Multiple navs', route: '/html/landmark-elements/arialabel-distinguishes-multiple-navs' },
    { label: 'Nested header Loses Implicit Banner Role', route: '/html/landmark-elements/nested-header-loses-implicit-banner-role' },
  ],
  'aria-roles': [
    { label: 'div role=button Lacks Keyboard Activation', route: '/html/aria-roles/div-role-button-lacks-keyboard-activation' },
    { label: 'aria-hidden Does Not Block Focus', route: '/html/aria-roles/aria-hidden-does-not-block-focus' },
    { label: 'disabled vs aria-disabled Blocks Events', route: '/html/aria-roles/disabled-vs-aria-disabled-blocks-events' },
  ],
  'focus-management': [
    { label: 'Roving Tabindex Keeps Exactly One at Zero', route: '/html/focus-management/roving-tabindex-keeps-exactly-one-item-at-zero' },
    { label: 'Positive Tabindex Breaks Natural Tab Order', route: '/html/focus-management/positive-tabindex-breaks-natural-dom-tab-order' },
    { label: 'dialog close() Restores Last-Focused Element', route: '/html/focus-management/dialog-close-restores-last-focused-element' },
  ],
  'storage-apis': [
    { label: 'localStorage Only Stores Strings, Not Objects', route: '/html/storage-apis/localstorage-only-stores-strings-not-objects' },
    { label: 'storage Event Never Fires in the Writing Tab', route: '/html/storage-apis/storage-event-never-fires-in-the-writing-tab' },
    { label: 'QuotaExceededError Is a Real, Catchable Exception', route: '/html/storage-apis/quotaexceedederror-is-a-real-catchable-exception' },
  ],
  'drag-drop': [
    { label: 'getData Returns Empty String for a Missing Type', route: '/html/drag-drop/getdata-returns-empty-string-for-missing-type' },
    { label: 'clearData Selectively Removes One Type', route: '/html/drag-drop/cleardata-selectively-removes-one-type-not-all' },
    { label: 'No Native Keyboard-to-dragstart Mapping Exists', route: '/html/drag-drop/no-native-keyboard-to-dragstart-mapping-exists' },
  ],
  'box-model': [
    { label: 'Margin Collapse Uses the Larger Value', route: '/css/box-model/margin-collapse-uses-larger-value-not-the-sum' },
    { label: 'outline Never Affects Box Model Layout', route: '/css/box-model/outline-never-affects-box-model-layout' },
    { label: 'Parent-Child Collapse Moves the Parent’s Own Box', route: '/css/box-model/parent-child-collapse-moves-the-parents-own-box' },
  ],
  'flexbox': [
    { label: 'min-width: auto Lets Items Overflow', route: '/css/flexbox/min-width-auto-lets-items-overflow-container' },
    { label: 'flex-basis Wins Over width', route: '/css/flexbox/flex-basis-wins-over-width-when-both-are-set' },
    { label: 'order Changes Visual Position, Not DOM Order', route: '/css/flexbox/order-changes-visual-position-not-dom-order' },
  ],
  'grid': [
    { label: 'auto-fit Collapses Tracks, auto-fill Keeps Them', route: '/css/grid/auto-fit-collapses-tracks-auto-fill-keeps-them' },
    { label: 'grid-column: 1 / 3 Spans Two Columns, Not Three', route: '/css/grid/grid-column-1-to-3-spans-two-columns-not-three' },
    { label: 'Dense Packing Reorders Visually, Not in the DOM', route: '/css/grid/dense-packing-reorders-visually-not-in-dom' },
  ],
  'positioning': [
    { label: 'z-index Does Nothing Without position Set', route: '/css/positioning/z-index-does-nothing-without-position-set' },
    { label: 'Child z-index Can’t Escape Parent Stacking Context', route: '/css/positioning/child-z-index-cant-escape-parent-stacking-context' },
    { label: 'sticky Without an Offset Behaves Like static', route: '/css/positioning/sticky-without-an-offset-behaves-like-static' },
  ],
  'custom-properties': [
    { label: 'var() Fallback Only Fires When Undefined', route: '/css/custom-properties/var-fallback-only-fires-when-undefined-not-invalid' },
    { label: 'Circular References Resolve to the Initial Value', route: '/css/custom-properties/circular-references-resolve-to-the-initial-value' },
    { label: 'setProperty() Updates Everything Using the Variable', route: '/css/custom-properties/setproperty-updates-everything-using-the-variable' },
  ],
  'selectors': [
    { label: ':is() Takes Highest Specificity, :where() Stays Zero', route: '/css/selectors/is-takes-highest-specificity-where-stays-zero' },
    { label: 'before/after Need content to Exist at All', route: '/css/selectors/before-after-need-content-to-exist-at-all' },
    { label: ':has() Actually Selects the Parent', route: '/css/selectors/has-parent-selector-actually-selects-the-parent' },
  ],
  'typography': [
    { label: 'Unitless line-height Scales, Fixed px Does Not', route: '/css/typography/unitless-line-height-scales-fixed-px-does-not' },
    { label: 'em Compounds in Nested Elements, rem Does Not', route: '/css/typography/em-compounds-in-nested-elements-rem-does-not' },
    { label: 'ch Unit Scales With Font-Size, Not Fixed Pixels', route: '/css/typography/ch-unit-scales-with-font-size-not-fixed-pixels' },
  ],
  'responsive': [
    { label: 'min() Picks the Smaller Value, Not the Larger', route: '/css/responsive/min-picks-the-smaller-value-not-the-larger' },
    { label: 'Container Queries Respond to Container Width, Not Viewport', route: '/css/responsive/container-queries-respond-to-container-width-not-viewport' },
    { label: 'currentSrc Reveals Which srcset Candidate Was Picked', route: '/css/responsive/currentsrc-reveals-which-srcset-candidate-was-picked' },
  ],
  'transitions': [
    { label: 'Negative Delay Starts Mid-Cycle, Not After a Pause', route: '/css/transitions/negative-delay-starts-mid-cycle-not-after-a-pause' },
    { label: 'A Shorter Duration List Cycles, It Doesn’t Drop or Inherit the Last Value', route: '/css/transitions/shorter-duration-list-cycles-not-drops-or-inherits-last' },
    { label: 'A Hover-Only Transition Snaps Back Instead of Reversing', route: '/css/transitions/hover-only-transition-snaps-back-instead-of-reversing' },
  ],
  // NOTE: keyed 'css-animations', NOT bare 'animations' — Angular's
  // own /angular/animations topic already claims the bare key.
  'css-animations': [
    { label: 'fill-mode: both Retains the Final Keyframe State', route: '/css/animations/fill-mode-both-retains-the-final-keyframe-state' },
    { label: 'Negative Delay Starts the Animation Mid-Cycle', route: '/css/animations/negative-delay-starts-the-animation-mid-cycle' },
    { label: 'display Cannot Be Smoothly Interpolated, Only Flips', route: '/css/animations/display-cannot-be-smoothly-interpolated-only-flips' },
  ],
  'colors-theming': [
    { label: 'color-mix in oklch Preserves Vividness, sRGB Doesn’t', route: '/css/colors-theming/color-mix-in-oklch-preserves-vividness-srgb-doesnt' },
    { label: 'color-mix() Always Produces an Opaque Result', route: '/css/colors-theming/color-mix-always-produces-an-opaque-result' },
    { label: 'WCAG Contrast Ratio Is Directly Computable From RGB', route: '/css/colors-theming/wcag-contrast-ratio-is-directly-computable-from-rgb' },
  ],
  'backgrounds-borders': [
    { label: 'The background Shorthand Resets Unlisted Sub-Properties', route: '/css/backgrounds-borders/background-shorthand-resets-unlisted-sub-properties' },
    { label: 'object-fit Does Nothing Without Explicit Dimensions', route: '/css/backgrounds-borders/object-fit-does-nothing-without-explicit-dimensions' },
    { label: 'border-radius: 50% Is an Ellipse, Not a Circle', route: '/css/backgrounds-borders/border-radius-50pct-is-an-ellipse-not-a-circle' },
  ],
  'container-queries': [
    { label: 'Container Queries Silently Do Nothing Without container-type', route: '/css/container-queries/container-queries-silently-do-nothing-without-container-type' },
    { label: 'container-type: size Collapses Height Without Explicit Sizing', route: '/css/container-queries/container-type-size-collapses-height-without-explicit-sizing' },
    { label: 'A Container Cannot Query or Style Itself', route: '/css/container-queries/a-container-cannot-query-or-style-itself' },
  ],
  'css-layers': [
    { label: 'Unlayered Styles Always Beat Every Layer, Regardless of Specificity', route: '/css/css-layers/unlayered-styles-always-beat-every-layer-regardless-of-specificity' },
    { label: '!important Reverses Layer Priority — Lower Layers Win', route: '/css/css-layers/important-reverses-layer-priority-lower-layers-win' },
    { label: 'The First @layer Encountered Sets Its Position, Not Declaration Order', route: '/css/css-layers/first-encountered-layer-block-sets-its-position-not-declaration-order' },
  ],
  'css-nesting': [
    { label: 'Omitting & Before a Pseudo-Class Creates a Descendant Selector', route: '/css/css-nesting/omitting-ampersand-before-pseudo-class-creates-a-descendant-selector' },
    { label: '& Followed by a Bare Identifier Is Invalid and Silently Dropped', route: '/css/css-nesting/ampersand-followed-by-a-bare-identifier-is-invalid-and-silently-dropped' },
    { label: 'Nesting Adds Zero Specificity — Ties Are Broken by Source Order', route: '/css/css-nesting/nesting-adds-zero-specificity-ties-are-broken-by-source-order' },
  ],
  'logical-properties': [
    { label: 'margin-inline-start Flips With Direction, Not Writing Mode', route: '/css/logical-properties/margin-inline-start-flips-with-direction-not-writing-mode' },
    { label: 'inline-size Maps to Width or Height Depending on Writing Mode', route: '/css/logical-properties/inline-size-maps-to-width-or-height-depending-on-writing-mode' },
    { label: 'border-start-start-radius Flips Corners in RTL', route: '/css/logical-properties/border-start-start-radius-flips-corners-in-rtl' },
  ],
  'css-architecture': [
    { label: 'BEM Flat Elements Lose to Accidental Descendant Selectors', route: '/css/css-architecture/bem-flat-elements-lose-to-accidental-descendant-selectors' },
    { label: 'ITCSS Layer Order Works Because Class Selectors Beat Element Selectors', route: '/css/css-architecture/itcss-layer-order-works-because-class-selectors-beat-element-selectors' },
    { label: 'Composable Modifiers Merge by Source Order, Not Special Priority', route: '/css/css-architecture/composable-modifiers-merge-by-source-order-not-special-priority' },
  ],
  // NOTE: keyed 'css-tailwind', NOT bare 'tailwind' — the Angular
  // hub's own /angular/tailwind topic already claims the bare key.
  'css-tailwind': [
    { label: 'Dynamic Class Strings Are Invisible to the JIT Scanner', route: '/css/tailwind/dynamic-class-strings-are-invisible-to-the-jit-scanner' },
    { label: 'Missing File Extensions in the content Array Silently Drop Classes', route: '/css/tailwind/missing-file-extensions-in-the-content-array-silently-drop-classes' },
    { label: 'Responsive Variants Are Mobile-First, Not Breakpoint-Specific', route: '/css/tailwind/responsive-variants-are-mobile-first-not-breakpoint-specific' },
  ],
  'scroll-driven-animations': [
    { label: 'animation-duration Is Ignored — Scroll Timeline Progress Is Positional', route: '/css/scroll-driven-animations/animation-duration-is-ignored-scroll-timeline-progress-is-positional' },
    { label: 'Named Timelines Are Invisible to Siblings Without timeline-scope', route: '/css/scroll-driven-animations/named-timelines-are-invisible-to-siblings-without-timeline-scope' },
    { label: 'Bare scroll() Defaults to the Nearest Ancestor Scroll Container', route: '/css/scroll-driven-animations/bare-scroll-defaults-to-the-nearest-ancestor-scroll-container' },
  ],
  'css-transforms': [
    { label: 'Rotate Before Translate Changes the Direction of Movement', route: '/css/css-transforms/rotate-before-translate-changes-the-direction-of-movement' },
    { label: 'Transforms Never Affect Sibling Layout Positions', route: '/css/css-transforms/transforms-never-affect-sibling-layout-positions' },
    { label: 'Transform Creates a Stacking Context, Trapping Negative z-index Children', route: '/css/css-transforms/transform-creates-a-stacking-context-trapping-negative-z-index-children' },
  ],
  'css-filters': [
    { label: 'backdrop-filter Has Zero Effect Without a Transparent Background', route: '/css/css-filters/backdrop-filter-has-zero-effect-without-a-transparent-background' },
    { label: 'isolation: isolate Confines mix-blend-mode to Its Own Subtree', route: '/css/css-filters/isolation-isolate-confines-mix-blend-mode-to-its-own-subtree' },
    { label: 'filter Creates a Stacking Context, Trapping Negative z-index Children', route: '/css/css-filters/filter-creates-a-stacking-context-trapping-negative-z-index-children' },
  ],
  // NOTE: keyed 'css-fundamentals', NOT bare 'fundamentals' — the HTML
  // hub's own /html/fundamentals topic already claims the bare key
  // (see the 'html-fundamentals' NOTE above).
  'css-fundamentals': [
    { label: 'Specificity Is Not a Decimal — a Single ID Beats Any Number of Classes', route: '/css/fundamentals/specificity-is-not-a-decimal-a-single-id-beats-any-classes' },
    { label: 'Non-Inherited Properties Don’t Flow to Children Without Explicit inherit', route: '/css/fundamentals/non-inherited-properties-dont-flow-to-children-without-explicit-inherit' },
    { label: 'Percentage padding-top Resolves Against the Parent’s Width, Not Height', route: '/css/fundamentals/percentage-padding-top-resolves-against-the-parents-width-not-height' },
  ],
  'core-web-vitals': [
    { label: 'transform Avoids CLS While top and left Trigger It', route: '/performance/core-web-vitals/transform-avoids-cls-while-top-and-left-trigger-it' },
    { label: 'Missing Image Dimensions Cause a Real, Measurable Layout Shift', route: '/performance/core-web-vitals/missing-image-dimensions-cause-a-real-measurable-layout-shift' },
    { label: 'The LCP Candidate Changes as Larger Elements Appear', route: '/performance/core-web-vitals/the-lcp-candidate-changes-as-larger-elements-appear' },
  ],
  'lcp': [
    { label: 'Text Can Be the LCP Candidate — Not Only Images', route: '/performance/lcp/text-can-be-the-lcp-candidate' },
    { label: 'Preloading the LCP Image Beats a Blocking Resource', route: '/performance/lcp/preload-beats-a-blocking-resource-for-lcp' },
    { label: 'loading="lazy" Defers the Fetch Until Near the Viewport', route: '/performance/lcp/lazy-loading-defers-fetch-until-near-viewport' },
  ],
  'inp': [
    { label: 'Long Tasks Register as Real longtask Entries', route: '/performance/inp/long-tasks-register-as-real-longtask-entries' },
    { label: 'Layout Thrashing Is Dramatically Slower Than Batching', route: '/performance/inp/layout-thrashing-is-dramatically-slower-than-batching' },
    { label: 'scheduler.yield() Turns One longtask Into Zero', route: '/performance/inp/scheduler-yield-turns-one-longtask-into-zero' },
  ],
  'cls': [
    { label: 'hadRecentInput Excludes Click-Caused Shifts', route: '/performance/cls/hadrecentinput-excludes-click-caused-shifts' },
    { label: 'content-visibility Without contain-intrinsic-size Collapses Height', route: '/performance/cls/content-visibility-without-contain-intrinsic-size-collapses-height' },
    { label: 'Fixed Positioning Eliminates the Shift In-Flow Insertion Causes', route: '/performance/cls/fixed-positioning-eliminates-the-shift-in-flow-insertion-causes' },
  ],
  'critical-rendering-path': [
    { label: 'media="print" Downloads But Never Blocks Render', route: '/performance/critical-rendering-path/media-print-downloads-but-never-blocks-render' },
    { label: 'defer Genuinely Waits for Parsing to Finish', route: '/performance/critical-rendering-path/defer-genuinely-waits-for-parsing-to-finish' },
    { label: 'type="module" Is Deferred by Default', route: '/performance/critical-rendering-path/type-module-is-deferred-by-default' },
  ],
  'browser-rendering': [
    { label: 'Three Structurally Different Kinds of Invisible', route: '/performance/browser-rendering/three-structurally-different-kinds-of-invisible' },
    { label: 'content-visibility: auto Cuts Render Time Dramatically', route: '/performance/browser-rendering/content-visibility-auto-cuts-render-time-dramatically' },
    { label: 'content-visibility Defers Work, It Doesn’t Eliminate It', route: '/performance/browser-rendering/content-visibility-defers-work-it-doesnt-eliminate-it' },
  ],
  'resource-hints': [
    { label: 'Font Preload Without crossorigin Causes a Genuine Double-Fetch', route: '/performance/resource-hints/font-preload-without-crossorigin-causes-a-genuine-double-fetch' },
    { label: 'A Mismatched Preload URL Causes a Genuine Double-Fetch', route: '/performance/resource-hints/mismatched-preload-url-causes-a-genuine-double-fetch' },
    { label: 'Missing as= Silently Does Nothing — Not a Double-Fetch', route: '/performance/resource-hints/missing-as-silently-does-nothing-not-a-double-fetch' },
  ],
  'http2-http3': [
    { label: 'nextHopProtocol Reveals the Real HTTP Version Per Resource', route: '/performance/http2-http3/nexthopprotocol-reveals-the-real-http-version-per-resource' },
    { label: 'Domain Sharding Defeats HTTP/2 Connection Coalescing', route: '/performance/http2-http3/domain-sharding-defeats-http2-connection-coalescing' },
    { label: 'Early Hints Lets the Browser Fetch Before HTML Finishes', route: '/performance/http2-http3/early-hints-lets-the-browser-fetch-before-html-finishes' },
  ],
  // NOTE: keyed bare 'caching' — no collision found; ASP.NET already
  // resolved its own prior collision as 'aspnet-caching' (see that entry).
  'caching': [
    { label: 'The Cache API Only Stores GET Requests', route: '/performance/caching/the-cache-api-only-stores-get-requests' },
    { label: 'Cache-First Genuinely Skips the Network Entirely', route: '/performance/caching/cache-first-genuinely-skips-the-network-entirely' },
    { label: 'Selective Cache Deletion Keeps the Current Cache and Removes Stale Ones', route: '/performance/caching/selective-cache-deletion-keeps-the-current-cache-and-removes-stale-ones' },
  ],
  'image-optimisation': [
    { label: 'sizes Controls Which srcset Candidate Wins', route: '/performance/image-optimisation/sizes-controls-which-srcset-candidate-wins' },
    { label: 'picture Picks the First Matching source in Document Order', route: '/performance/image-optimisation/picture-picks-the-first-matching-source-in-document-order' },
    { label: 'image-set() Performs Real DPR-Aware Background Selection', route: '/performance/image-optimisation/image-set-performs-real-dpr-aware-background-selection' },
  ],
  'font-performance': [
    { label: 'unicode-range Skips Font Files for Unused Character Ranges', route: '/performance/font-performance/unicode-range-skips-font-files-for-unused-character-ranges' },
    { label: 'size-adjust Measurably Changes Rendered Text Width', route: '/performance/font-performance/size-adjust-measurably-changes-rendered-text-width' },
    { label: 'The Font Loading API Tracks Real Load State, Not a Guess', route: '/performance/font-performance/the-font-loading-api-tracks-real-load-state-not-a-guess' },
  ],
  'js-performance': [
    { label: 'structuredClone and spread Do Fundamentally Different Jobs', route: '/performance/js-performance/structuredclone-and-spread-do-fundamentally-different-jobs' },
    { label: 'Event Delegation Catches Dynamically Added Elements', route: '/performance/js-performance/event-delegation-catches-dynamically-added-elements' },
    { label: 'Memoization Genuinely Skips Recomputation for Repeated Inputs', route: '/performance/js-performance/memoization-genuinely-skips-recomputation-for-repeated-inputs' },
  ],
  'third-party-scripts': [
    { label: 'Subresource Integrity Genuinely Blocks a Mismatched Script', route: '/performance/third-party-scripts/subresource-integrity-genuinely-blocks-a-mismatched-script' },
    { label: 'A Facade Loads Zero Third-Party Bytes Until Interaction', route: '/performance/third-party-scripts/a-facade-loads-zero-third-party-bytes-until-interaction' },
    { label: 'Resource Timing Correctly Separates First-Party From Third-Party', route: '/performance/third-party-scripts/resource-timing-correctly-separates-first-party-from-third-party' },
  ],
  'measurement': [
    { label: 'performance.mark() Creates Real Timeline Entries — performance.now() Does Not', route: '/performance/measurement/performance-mark-creates-real-timeline-entries-performance-now-does-not' },
    { label: 'FCP and LCP Are Genuinely Different Real Timestamps', route: '/performance/measurement/fcp-and-lcp-are-genuinely-different-real-timestamps' },
    { label: 'Navigation Timing’s responseStart Genuinely Computes TTFB', route: '/performance/measurement/navigation-timings-responsestart-genuinely-computes-ttfb' },
  ],
  'rum': [
    { label: 'sendBeacon() Fires a Real Request With Its Own Initiator Type', route: '/performance/rum/sendbeacon-fires-a-real-request-with-its-own-initiator-type' },
    { label: 'P75 and Average Can Disagree on the Pass/Fail Rating Entirely', route: '/performance/rum/p75-and-average-can-disagree-on-the-pass-fail-rating-entirely' },
    { label: 'Batching Metrics Into One Beacon Genuinely Cuts Requests', route: '/performance/rum/batching-metrics-into-one-beacon-genuinely-cuts-requests' },
  ],
  'ssr-streaming': [
    { label: 'A ReadableStream Genuinely Delivers Chunks at Different Real Times', route: '/performance/ssr-streaming/a-readablestream-genuinely-delivers-chunks-at-different-real-times' },
    { label: 'Non-Deterministic Values Genuinely Differ Between Renders', route: '/performance/ssr-streaming/non-deterministic-values-genuinely-differ-between-renders' },
    { label: 'Reading Chunk-by-Chunk Beats Waiting for the Full Response', route: '/performance/ssr-streaming/reading-chunk-by-chunk-beats-waiting-for-the-full-response' },
  ],
  'css-performance': [
    { label: 'Selector Complexity Barely Moves Recalc-Style Time at Scale', route: '/performance/css-performance/selector-complexity-barely-moves-recalc-style-time-at-scale' },
    { label: 'Unused CSS Selectors Stay in the CSSOM Until You Remove Them', route: '/performance/css-performance/unused-css-selectors-stay-in-the-cssom-until-you-remove-them' },
    { label: 'contain: content Clips Overflow Like overflow: hidden', route: '/performance/css-performance/contain-content-clips-overflow-like-overflow-hidden' },
  ],
  'perf-web-workers': [
    { label: 'Transferred ArrayBuffers Become Genuinely Detached (Zero-Copy)', route: '/performance/web-workers/transferred-arraybuffers-become-genuinely-detached-zero-copy' },
    { label: 'A Worker Genuinely Keeps the Main Thread Responsive During Heavy Work', route: '/performance/web-workers/a-worker-genuinely-keeps-the-main-thread-responsive-during-heavy-work' },
    { label: 'Reusing a Worker Is Dramatically Faster Than Creating One Per Task', route: '/performance/web-workers/reusing-a-worker-is-dramatically-faster-than-creating-one-per-task' },
  ],
  'performance-budgets': [
    { label: 'The size × 0.3 Gzip Approximation Is Wildly Inaccurate', route: '/performance/performance-budgets/gzip-approximation-is-wildly-inaccurate' },
    { label: 'A Median of 3 Runs Genuinely Narrows Measurement Variance', route: '/performance/performance-budgets/a-median-of-3-runs-genuinely-narrows-measurement-variance' },
    { label: 'Initial vs anyScript Budgets Catch Genuinely Different Failure Modes', route: '/performance/performance-budgets/initial-vs-anyscript-budgets-catch-genuinely-different-failure-modes' },
  ],
  'speculation-rules': [
    { label: 'Feature Detection Genuinely Confirms Support Before You Speculate', route: '/performance/speculation-rules/feature-detection-genuinely-confirms-support-before-you-speculate' },
    { label: 'document.prerendering Genuinely Reports False on a Normal Page Load', route: '/performance/speculation-rules/document-prerendering-genuinely-reports-false-on-a-normal-page-load' },
    { label: 'Malformed Speculation Rules JSON Is Not Silently Ignored', route: '/performance/speculation-rules/malformed-speculation-rules-json-is-not-silently-ignored' },
  ],
  // NOTE: keyed 'blazor-fundamentals', NOT bare 'fundamentals' — the
  // JavaScript hub's own /javascript/fundamentals topic already claims
  // the bare key.
  'blazor-fundamentals': [
    { label: 'StateHasChanged() Is Automatic After Sync Handlers, Manual Elsewhere', route: '/blazor/fundamentals/statehaschanged-is-automatic-after-sync-handlers-manual-elsewhere' },
    { label: 'Scoped Services Are Per-Circuit, Not Per-Request, in Blazor Server', route: '/blazor/fundamentals/scoped-services-are-per-circuit-not-per-request-in-blazor-server' },
    { label: 'Static SSR Parents Cannot Make Children Interactive', route: '/blazor/fundamentals/static-ssr-parents-cannot-make-children-interactive' },
  ],
  'render-modes': [
    { label: 'InteractiveAuto Loses State When It Switches From Server to WebAssembly', route: '/blazor/render-modes/interactiveauto-loses-state-when-it-switches-from-server-to-webassembly' },
    { label: 'OnInitializedAsync Genuinely Runs Twice During Prerender-Then-Hydrate', route: '/blazor/render-modes/oninitializedasync-genuinely-runs-twice-during-prerender-then-hydrate' },
    { label: 'StreamRendering Flushes Placeholder HTML Before Async Data Resolves', route: '/blazor/render-modes/streamrendering-flushes-placeholder-html-before-async-data-resolves' },
  ],
  'razor-components': [
    { label: 'RenderFragment<T> Compiles to a Delegate the Framework Invokes Per Item', route: '/blazor/razor-components/renderfragment-t-compiles-to-a-delegate-the-framework-invokes-per-item' },
    { label: 'CascadingParameter Flows Through Any Depth Without Explicit Forwarding', route: '/blazor/razor-components/cascadingparameter-flows-through-any-depth-without-explicit-forwarding' },
    { label: 'ShouldRender Cannot Suppress a Component’s First Render', route: '/blazor/razor-components/shouldrender-cannot-suppress-a-components-first-render' },
  ],
  'component-communication': [
    { label: 'EventCallback’s Auto-StateHasChanged Targets the Receiver, Not the Invoker', route: '/blazor/component-communication/eventcallback-statehaschanged-targets-receiver-not-invoker' },
    { label: 'bind-Value Desugars Into Two Separate Parameters, Not Magic Binding', route: '/blazor/component-communication/bind-value-desugars-into-two-separate-parameters-not-magic-binding' },
    { label: 'IsFixed=true Permanently Freezes a Cascading Value’s Re-Traversal', route: '/blazor/component-communication/isfixed-true-permanently-freezes-a-cascading-values-re-traversal' },
  ],
  // NOTE: keyed 'blazor-forms', NOT bare 'forms' — the Angular hub's own
  // /angular/forms topic already claims the bare key.
  'blazor-forms': [
    { label: 'NotifyValidationStateChanged Is Required — EditContext Can’t See ValidationMessageStore Adds', route: '/blazor/forms/notifyvalidationstatechanged-is-required-editcontext-cant-see-msgstore-adds' },
    { label: 'DataAnnotationsValidator Skips Nested Objects Without ValidateComplexType', route: '/blazor/forms/dataannotationsvalidator-skips-nested-objects-without-validatecomplextype' },
    { label: 'SupplyParameterFromForm Only Binds on a Real POST, Not First Load', route: '/blazor/forms/supplyparameterfromform-only-binds-on-a-real-post-not-first-load' },
  ],
  'data-binding': [
    { label: '@key Prevents Blazor From Misattributing State When a List Reorders', route: '/blazor/data-binding/key-prevents-blazor-from-misattributing-state-when-a-list-reorders' },
    { label: 'Omitting bind:format on Dates Risks a Silent Locale Parse Mismatch', route: '/blazor/data-binding/omitting-bind-format-on-dates-risks-a-silent-locale-parse-mismatch' },
    { label: 'A Hand-Rolled Debounce Needs Cancellation, Not Just a Timer', route: '/blazor/data-binding/a-hand-rolled-debounce-needs-cancellation-not-just-a-timer' },
  ],
  // NOTE: keyed 'blazor-routing', NOT bare 'routing' — the Angular hub's
  // own /angular/routing topic already claims the bare key, and the
  // ASP.NET Core hub already resolved the same collision as 'aspnet-routing'.
  'blazor-routing': [
    { label: 'OnParametersSet Fires Without OnInitialized When Blazor Reuses a Component', route: '/blazor/routing/onparameterset-fires-without-oninitialized-when-blazor-reuses-a-component' },
    { label: 'NavigateTo(forceLoad: true) Schedules the Reload — Code After It Still Runs', route: '/blazor/routing/navigateto-forceload-schedules-the-reload-code-after-it-still-runs' },
    { label: 'Catch-All Routes Capture Everything After the Prefix as One String', route: '/blazor/routing/catch-all-routes-capture-everything-after-the-prefix-as-one-string' },
  ],
  // NOTE: keyed 'blazor-dependency-injection', NOT bare 'dependency-injection' —
  // already claimed elsewhere; ASP.NET Core resolved the same collision as
  // 'aspnet-dependency-injection'.
  'blazor-dependency-injection': [
    { label: 'OwningComponentBase Gives Each Instance Its Own Scoped Service', route: '/blazor/dependency-injection/owningcomponentbase-gives-each-instance-its-own-scoped-service' },
    { label: 'Captive Dependency Freezes the Scoped Instance at Singleton Construction', route: '/blazor/dependency-injection/captive-dependency-freezes-scoped-instance-at-singleton-construction' },
    { label: 'IServiceScopeFactory Must Dispose Its Scope Immediately After Use', route: '/blazor/dependency-injection/iservicescopefactory-must-dispose-its-scope-immediately-after-use' },
  ],
  // NOTE: keyed 'blazor-state-management', NOT bare 'state-management' —
  // the React hub's own /react/state-management topic already claims the
  // bare key.
  'blazor-state-management': [
    { label: 'ProtectedLocalStorage Encrypts at Rest, Not the Decrypted Value in Memory', route: '/blazor/state-management/protectedlocalstorage-encrypts-at-rest-not-the-decrypted-value-in-memory' },
    { label: 'Cross-Tab Sync Needs the Browser’s Own StorageEvent, Not Blazor', route: '/blazor/state-management/cross-tab-sync-needs-the-browsers-own-storage-event-not-blazor' },
    { label: 'A Forgotten Unsubscribe Throws on a Disposed Component’s Next Event', route: '/blazor/state-management/a-forgotten-unsubscribe-throws-on-a-disposed-components-next-event' },
  ],
  'js-interop': [
    { label: 'JSON.stringify Throws a Real TypeError on Circular References', route: '/blazor/js-interop/jsonstringify-throws-a-real-typeerror-on-circular-references' },
    { label: 'Dynamic import() Genuinely Scopes Exports, Never Touching window', route: '/blazor/js-interop/dynamic-import-genuinely-scopes-exports-never-touching-window' },
    { label: 'IJSInProcessRuntime Only Works in WASM — Same-Process Execution', route: '/blazor/js-interop/ijsinprocessruntime-only-works-in-wasm-same-process-execution' },
  ],
  'server-signalr': [
    { label: 'A Custom Hub and the Render Circuit Are Separate SignalR Mechanisms', route: '/blazor/server-signalr/a-custom-hub-and-the-render-circuit-are-separate-signalr-mechanisms' },
    { label: 'The Reconnection Window Only Preserves State for the Same Circuit', route: '/blazor/server-signalr/the-reconnection-window-only-preserves-state-for-the-same-circuit' },
    { label: 'Azure SignalR Service Routes Messages, It Doesn’t Replicate Circuit State', route: '/blazor/server-signalr/azure-signalr-service-routes-messages-it-doesnt-replicate-circuit-state' },
  ],
  'maui-hybrid': [
    { label: 'A Wrong HostPage Path Produces a Blank Screen With No Error', route: '/blazor/maui-hybrid/a-wrong-hostpage-path-produces-a-blank-screen-with-no-error' },
    { label: 'RootComponent’s Selector Must Match an Element in HostPage’s Own HTML', route: '/blazor/maui-hybrid/rootcomponent-selector-must-match-an-element-in-hostpages-own-html' },
    { label: 'Hybrid Has No Circuit — State Lives in the Native Process, Not a Connection', route: '/blazor/maui-hybrid/hybrid-has-no-circuit-state-lives-in-the-native-process-not-a-connection' },
  ],
  // Bare 'authentication' is free — the ASP.NET Core hub pre-emptively
  // hub-prefixed its own collision to 'aspnet-authentication' in
  // anticipation of the Blazor hub claiming this bare key.
  'authentication': [
    { label: 'NotifyAuthenticationStateChanged Is the Only Trigger for AuthorizeView', route: '/blazor/authentication/notifyauthenticationstatechanged-is-the-only-trigger-for-authorizeview' },
    { label: 'Pre-render and Post-Hydration Auth State Come From Different Sources', route: '/blazor/authentication/prerender-and-post-hydration-auth-state-come-from-different-sources' },
    { label: 'OIDC Roles Often Use a Different Claim Type Than Authorize Expects', route: '/blazor/authentication/oidc-roles-often-use-a-different-claim-type-than-authorize-expects' },
  ],
  // NOTE: keyed 'blazor-error-handling', NOT bare 'error-handling' — the
  // JavaScript hub's own /javascript/error-handling topic already claims
  // the bare key, and the ASP.NET Core hub already resolved the same
  // collision as 'aspnet-error-handling'.
  'blazor-error-handling': [
    { label: 'ErrorBoundary.Recover() Clears the Error, Not the Child’s Own State', route: '/blazor/error-handling/errorboundary-recover-clears-the-error-not-the-childs-own-state' },
    { label: 'Dispose Exceptions Are Fatal, Not Recoverable via ErrorBoundary', route: '/blazor/error-handling/dispose-exceptions-are-fatal-not-recoverable-via-errorboundary' },
    { label: 'Async void Event Handlers Bypass ErrorBoundary Entirely', route: '/blazor/error-handling/async-void-event-handlers-bypass-errorboundary-entirely' },
  ],
  'streaming-rendering': [
    { label: 'Enhanced Navigation Can Undo DOM Changes Unless Marked data-permanent', route: '/blazor/streaming-rendering/enhanced-navigation-can-undo-dom-changes-unless-marked-data-permanent' },
    { label: 'StreamRendering Is Redundant on Interactive Modes, Not Blocked', route: '/blazor/streaming-rendering/streamrendering-is-redundant-on-interactive-modes-not-blocked' },
    { label: 'Streamed Sections Patch in Resolution Order, Not Markup Order', route: '/blazor/streaming-rendering/streamed-sections-patch-in-resolution-order-not-markup-order' },
  ],
  'sections-layouts': [
    { label: 'Last SectionContent Wins Means Last Registered, Not Last Declared', route: '/blazor/sections-layouts/last-sectioncontent-wins-means-last-registered-not-last-declared' },
    { label: 'SectionOutlet Matching Is a Global Lookup, Not Ancestor-Scoped', route: '/blazor/sections-layouts/sectionoutlet-matching-is-a-global-lookup-not-ancestor-scoped' },
    { label: 'A SectionName Typo Fails Silently, With No Built-In Fallback', route: '/blazor/sections-layouts/a-sectionname-typo-fails-silently-with-no-built-in-fallback' },
  ],
  'seo-metadata': [
    { label: 'PageTitle and HeadContent Are Sections in Disguise', route: '/blazor/seo-metadata/pagetitle-and-headcontent-are-sections-in-disguise' },
    { label: 'JSON-LD Inside script Silently Corrupts, Not Throws', route: '/blazor/seo-metadata/json-ld-inside-script-silently-corrupts-not-throws' },
    { label: 'og:image and Other OG URLs Must Be Absolute, Not Relative', route: '/blazor/seo-metadata/og-image-and-other-og-urls-must-be-absolute-not-relative' },
  ],
  'virtualization': [
    { label: 'Virtualize Recreates Item DOM on Every Filter Without @key', route: '/blazor/virtualization/virtualize-recreates-item-dom-on-every-filter-without-key' },
    { label: 'Virtualize Discards Stale ItemsProvider Results Itself', route: '/blazor/virtualization/virtualize-discards-stale-itemsprovider-results-itself' },
    { label: 'OverscanCount Splits Evenly, With No Scroll-Direction Awareness', route: '/blazor/virtualization/overscancount-splits-evenly-with-no-scroll-direction-awareness' },
  ],
  'progressive-enhancement': [
    { label: 'Enhanced Forms Share Enhanced Navigation’s Fetch-and-Patch Pipeline', route: '/blazor/progressive-enhancement/enhanced-forms-share-enhanced-navigations-fetch-and-patch-pipeline' },
    { label: 'A Cross-Origin Redirect After Enhanced Form Submission Hard-Fails', route: '/blazor/progressive-enhancement/a-cross-origin-redirect-after-enhanced-form-submission-hard-fails' },
    { label: 'FormName Defaults to an Empty String, With No Ancestor Scoping', route: '/blazor/progressive-enhancement/formname-defaults-to-empty-string-with-no-ancestor-scoping' },
  ],
  // NOTE: keyed 'blazor-performance', NOT bare 'performance' — the Web
  // Performance hub already owns a route at the same bare slug, and
  // ASP.NET Core/SQL/React/HTML have all already resolved the same
  // collision the same way ('aspnet-performance', 'sql-performance', etc.).
  'blazor-performance': [
    { label: 'Blazor Already Skips SetParametersAsync for Unchanged Primitives', route: '/blazor/performance/blazor-already-skips-setparametersasync-for-unchanged-primitives' },
    { label: 'ShouldRender False Also Skips OnAfterRender, Not Just the Diff', route: '/blazor/performance/shouldrender-false-also-skips-onafterrender-not-just-the-diff' },
    { label: 'IMemoryCache.GetOrCreateAsync Can Run Its Factory Concurrently', route: '/blazor/performance/imemorycache-getorcreateasync-can-run-its-factory-concurrently' },
  ],
  'architecture': [
    { label: 'Recursive nextTick Starves I/O Forever', route: '/node/architecture/recursive-nexttick-starves-io-forever' },
    { label: 'UV_THREADPOOL_SIZE Must Be Set Before the First Thread-Pool Call', route: '/node/architecture/uv-threadpool-size-must-be-set-before-first-threadpool-call' },
    { label: 'dns.lookup() Uses the Thread Pool, dns.resolve() Never Does', route: '/node/architecture/dns-lookup-uses-threadpool-dns-resolve-never-does' },
  ],
  // NOTE: keyed 'node-modules', NOT bare 'modules' — already claimed
  // elsewhere in this map (grep confirmed).
  'node-modules': [
    { label: 'Circular Requires Share a Reference, Mutation Is Visible, Reassignment Isn’t', route: '/node/modules/circular-requires-share-a-reference-mutation-visible-reassignment-not' },
    { label: 'The Dual Package Hazard — require() and import() Never Share a Cache', route: '/node/modules/the-dual-package-hazard-require-and-import-never-share-a-cache' },
    { label: 'ESM Named Imports Are Live Bindings, CJS Destructuring Is a Snapshot', route: '/node/modules/esm-named-imports-are-live-bindings-cjs-destructuring-is-a-snapshot' },
  ],
  'core-modules': [
    { label: 'EventEmitter Warns After 10 Listeners — a Leak Heuristic, Not a Limit', route: '/node/core-modules/eventemitter-warns-after-10-listeners-a-leak-heuristic-not-a-limit' },
    { label: 'Buffer.allocUnsafe() Can Leak Previous Data via the Shared Pool', route: '/node/core-modules/buffer-allocunsafe-can-leak-previous-data-via-the-shared-pool' },
    { label: 'exec()’s Default maxBuffer Kills the Process, Not Truncates', route: '/node/core-modules/exec-default-maxbuffer-kills-the-process-not-truncates' },
  ],
  'env-config': [
    { label: 'An Unset NODE_ENV Silently Behaves Like Development in Production', route: '/node/env-config/unset-node-env-silently-behaves-like-development-in-production' },
    { label: 'z.coerce.number() Turns an Empty String Into 0, Not an Error', route: '/node/env-config/zod-coerce-number-turns-an-empty-string-into-zero-not-an-error' },
    { label: 'dotenv.config() Never Throws on a Missing .env File', route: '/node/env-config/dotenv-config-never-throws-on-a-missing-env-file' },
  ],
  'express': [
    { label: 'Express Catches Synchronous Throws Automatically, Not Async Rejections', route: '/node/express/express-catches-synchronous-throws-automatically-not-async-rejections' },
    { label: 'next(err) From an Error Handler Chains to the Next Error Handler', route: '/node/express/next-err-from-an-error-handler-chains-to-the-next-error-handler' },
    { label: 'app.use() Matches Path Segments, Not Raw String Prefix', route: '/node/express/app-use-matches-path-segments-not-raw-string-prefix' },
  ],
  'fastify': [
    { label: 'Response Schema Silently Strips Unlisted Fields — Forgotten Ones Too', route: '/node/fastify/response-schema-silently-strips-unlisted-fields-forgotten-ones-too' },
    { label: 'Sibling Plugins Never See Each Other’s Decorators', route: '/node/fastify/sibling-plugins-never-see-each-others-decorators' },
    { label: 'onError Hooks Run Before setErrorHandler, Not After', route: '/node/fastify/onerror-hooks-run-before-seterrorhandler-not-after' },
  ],
  'rest-api': [
    { label: 'JSON Merge Patch: null Means Delete, Omitted Means Unchanged', route: '/node/rest-api/json-merge-patch-null-vs-omitted-field-semantics' },
    { label: 'Why POST Retries Need an Idempotency-Key Header', route: '/node/rest-api/post-retry-duplicates-without-idempotency-key' },
    { label: 'ETag If-Match Mismatch Returns 412, Not 409', route: '/node/rest-api/etag-if-match-mismatch-returns-412-not-409' },
  ],
  'websockets': [
    { label: 'Redis Adapter Broadcasts to Every Instance, Not Just Matching Sockets', route: '/node/websockets/redis-adapter-broadcasts-to-every-instance' },
    { label: 'Socket.io’s Heartbeat Is Engine.IO’s Own Ping/Pong, Not WebSocket Frames', route: '/node/websockets/engineio-ping-pong-not-websocket-protocol-frames' },
    { label: 'Close Code 1006 Is Reserved — It Never Appears on the Wire', route: '/node/websockets/close-code-1006-is-reserved-never-sent-on-the-wire' },
  ],
  'graphql': [
    { label: 'GraphQL Returns 200 Even When the Response Contains Errors', route: '/node/graphql/graphql-returns-200-even-when-errors-is-present' },
    { label: 'A Non-Null Field Error Nulls the Nearest Nullable Ancestor', route: '/node/graphql/non-null-field-error-nulls-nearest-nullable-ancestor' },
    { label: 'APQ: a Hash Miss Triggers a Retry With the Full Query', route: '/node/graphql/apq-hash-miss-triggers-a-retry-with-the-full-query' },
  ],
  'nestjs': [
    { label: 'app.useGlobalPipes() Bypasses Nest’s DI Container', route: '/node/nestjs/useglobalpipes-bypasses-di-use-app-pipe-instead' },
    { label: 'Middleware Exceptions Bypass Exception Filters Entirely', route: '/node/nestjs/middleware-exceptions-bypass-exception-filters' },
    { label: 'An Interceptor That Never Calls next.handle() Skips the Handler', route: '/node/nestjs/interceptor-skipping-next-handle-skips-the-handler' },
  ],
  'promises-async': [
    { label: 'unhandledRejection Fires After a Turn, Not Instantly', route: '/node/promises-async/unhandledrejection-fires-after-a-turn-not-instantly' },
    { label: 'Top-Level await Delays the Import Chain, Not the Whole Graph', route: '/node/promises-async/top-level-await-delays-the-import-chain-not-the-graph' },
    { label: 'enterWith() Leaks Context — run() Restores It Automatically', route: '/node/promises-async/enterwith-leaks-context-run-restores-it-automatically' },
  ],
  'streams': [
    { label: 'Never Mix a data Listener With for await...of', route: '/node/streams/never-mix-data-listener-with-for-await-of' },
    { label: 'close, Not finish/end, Signals Resources Are Released', route: '/node/streams/close-not-finish-end-signals-resources-are-released' },
    { label: 'highWaterMark Counts Objects, Not Bytes, in Object Mode', route: '/node/streams/highwatermark-counts-objects-not-bytes-in-object-mode' },
  ],
  // NOTE: hub-prefixed — bare 'error-handling' is already claimed by the JavaScript hub's own topic.
  'node-error-handling': [
    { label: 'Error.cause Doesn’t Survive JSON.stringify()', route: '/node/error-handling/error-cause-does-not-survive-json-stringify' },
    { label: 'process.exit() Can Truncate Unflushed Output', route: '/node/error-handling/process-exit-can-truncate-unflushed-output' },
    { label: 'An uncaughtException Listener Disables the Default Crash', route: '/node/error-handling/uncaughtexception-listener-disables-default-crash' },
  ],
  'prisma': [
    { label: 'Interactive Transactions Have a 5-Second Timeout', route: '/node/prisma/interactive-transactions-have-a-default-5-second-timeout' },
    { label: '$queryRaw Can Return BigInt — JSON.stringify() Throws on It', route: '/node/prisma/queryraw-can-return-bigint-json-stringify-throws' },
    { label: 'PrismaClient Singleton Needs globalThis Caching in Dev', route: '/node/prisma/prismaclient-singleton-needs-globalthis-caching-in-dev' },
  ],
  'mongoose': [
    { label: 'Update Validators Are Off by Default', route: '/node/mongoose/update-validators-are-off-by-default-need-runvalidators' },
    { label: 'populate() Resolves a Dangling Reference to null', route: '/node/mongoose/populate-resolves-a-dangling-reference-to-null' },
    { label: 'Mixed Type Mutations Need markModified() to Persist', route: '/node/mongoose/mixed-type-mutations-need-markmodified-to-persist' },
  ],
  // NOTE: hub-prefixed — bare 'caching' is already claimed by the Web Performance hub's own topic.
  'node-caching': [
    { label: 'Lock TTL Can Expire While the Holder Is Still Working', route: '/node/caching/lock-ttl-can-expire-while-the-holder-is-still-working' },
    { label: 'SCAN Does Not Guarantee a Consistent Snapshot', route: '/node/caching/scan-does-not-guarantee-a-consistent-snapshot' },
    { label: 'The Simple SET NX Lock Isn’t Safe Across a Redis Failover', route: '/node/caching/set-nx-lock-is-not-safe-across-a-redis-failover' },
  ],
  'jwt-auth': [
    { label: 'RS256 Public Keys Can Be Forged as HS256 Secrets', route: '/node/jwt-auth/rs256-hs256-algorithm-confusion-needs-explicit-pinning' },
    { label: 'clockTolerance Handles Drift Between Distributed Servers', route: '/node/jwt-auth/clocktolerance-handles-drift-between-distributed-servers' },
    { label: 'Concurrent Refresh Requests Trigger a False Theft-Detection Positive', route: '/node/jwt-auth/concurrent-refresh-requests-trigger-false-theft-detection' },
  ],
  // NOTE: hub-prefixed — bare 'security' is already claimed by the SQL hub's own topic.
  'node-security': [
    { label: 'CSP Nonces Must Be Regenerated on Every Request', route: '/node/security/csp-nonces-must-be-regenerated-on-every-single-request' },
    { label: 'trust proxy Must Be Configured Behind a Reverse Proxy', route: '/node/security/trust-proxy-must-be-configured-behind-a-reverse-proxy' },
    { label: 'bcrypt Silently Truncates Passwords Longer Than 72 Bytes', route: '/node/security/bcrypt-silently-truncates-passwords-longer-than-72-bytes' },
  ],
  'performance': [
    { label: 'worker_threads postMessage() Copies Data by Default', route: '/node/performance/worker-threads-postmessage-copies-data-by-default' },
    { label: 'monitorEventLoopDelay() Is a Purpose-Built Alternative', route: '/node/performance/monitoreventloopdelay-is-a-purpose-built-lag-histogram' },
    { label: '--max-old-space-size Does Not Cap Total Process Memory', route: '/node/performance/max-old-space-size-does-not-cap-total-process-memory' },
  ],
  'logging': [
    { label: 'Pino Redact Paths Must Match the Exact Log Object Shape', route: '/node/logging/pino-redact-paths-must-match-the-exact-log-object-shape' },
    { label: 'base Option Replaces, Not Merges, pid and hostname', route: '/node/logging/pino-base-option-replaces-not-merges-pid-and-hostname' },
    { label: 'redact() Never Touches the Log Message String', route: '/node/logging/pino-redact-never-touches-the-log-message-string' },
  ],
  'worker-threads': [
    { label: 'Each Worker Gets Its Own process.env Snapshot', route: '/node/worker-threads/each-worker-gets-its-own-process-env-snapshot' },
    { label: 'terminate() Cannot Interrupt Synchronous CPU Work', route: '/node/worker-threads/worker-terminate-cannot-interrupt-synchronous-cpu-work' },
    { label: 'stdout: true Makes You Responsible for Draining the Stream', route: '/node/worker-threads/stdout-true-makes-you-responsible-for-draining-the-stream' },
  ],
  // NOTE: keyed 'node-testing', NOT bare 'testing' — the Angular hub
  // already owns the bare 'testing' key above (its own /angular/testing
  // subtopics). This is the shared flat SUBTOPICS map's documented
  // collision risk, hit for real here; resolved by hub-prefixing this
  // one entry rather than restructuring the whole map.
  'node-testing': [
    { label: 't.mock Auto-Restores; the Top-Level mock Import Does Not', route: '/node/testing/context-mock-auto-restores-top-level-mock-does-not' },
    { label: 'clearAllMocks() Does Not Reset Module-Level State', route: '/node/testing/clearallmocks-does-not-reset-module-level-state' },
    { label: 'Supertest Still Binds a Real Ephemeral Port', route: '/node/testing/supertest-still-binds-a-real-ephemeral-port' },
  ],
  'deployment': [
    { label: 'server.close() and Idle Keep-Alive Connections Since Node 19', route: '/node/deployment/server-close-and-idle-keep-alive-connections-since-node-19' },
    { label: 'Docker HEALTHCHECK Is Invisible to Kubernetes Probes', route: '/node/deployment/docker-healthcheck-is-invisible-to-kubernetes-probes' },
    { label: 'npm ci Deletes node_modules Before Installing', route: '/node/deployment/npm-ci-deletes-node-modules-before-installing' },
  ],
  // NOTE: keyed 'python-fundamentals', NOT bare 'fundamentals' — the
  // JavaScript hub already owns the bare 'fundamentals' key above (its
  // own /javascript/fundamentals subtopics). This is the shared flat
  // SUBTOPICS map's documented collision risk, hit for real here;
  // resolved by hub-prefixing this one entry rather than restructuring
  // the whole map.
  'python-fundamentals': [
    { label: 'Why is Sometimes Works for Small Ints and Strings', route: '/python/fundamentals/why-is-sometimes-works-for-small-ints-and-strings' },
    { label: 'for/else Runs on Empty Iterables Too', route: '/python/fundamentals/for-else-runs-on-empty-iterables-too' },
    { label: 'Comprehensions Get Their Own Scope in Python 3', route: '/python/fundamentals/comprehensions-get-their-own-scope-in-python-3' },
  ],
  'functions-closures': [
    { label: 'lru_cache on a Method Keeps the Instance Alive', route: '/python/functions-closures/lru-cache-on-a-method-keeps-the-instance-alive' },
    { label: 'Stacked Decorators Apply Bottom-Up but Run Top-Down', route: '/python/functions-closures/stacked-decorators-apply-bottom-up-but-run-top-down' },
    { label: 'wraps() Silently Skips Metadata Missing From a partial', route: '/python/functions-closures/wraps-silently-skips-metadata-missing-from-a-partial' },
  ],
  'comprehensions-generators': [
    { label: 'Generator Locals Stay Alive While the Generator Is Alive', route: '/python/comprehensions-generators/generator-locals-stay-alive-while-the-generator-is-alive' },
    { label: 'Abandoning a Generator Still Triggers Its finally Block', route: '/python/comprehensions-generators/abandoning-a-generator-still-triggers-its-finally-block' },
    { label: 'islice Does Not Support Negative start, stop, or step', route: '/python/comprehensions-generators/islice-does-not-support-negative-start-stop-or-step' },
  ],
  'file-io': [
    { label: 'mkdir(exist_ok=True) Still Raises If a File Blocks the Path', route: '/python/file-io/mkdir-exist-ok-still-raises-if-a-file-blocks-the-path' },
    { label: 'shutil.copy() Does Not Preserve Timestamps — copy2() Does', route: '/python/file-io/shutil-copy-does-not-preserve-timestamps-copy2-does' },
    { label: 'Path.glob() Matches Dotfiles, Unlike Shell Globbing', route: '/python/file-io/path-glob-matches-dotfiles-unlike-shell-globbing' },
  ],
  // NOTE: keyed 'python-oop', NOT bare 'oop' — the C# hub already owns
  // the bare 'oop' key above (its own /csharp/oop subtopics). This is
  // the shared flat SUBTOPICS map's documented collision risk, hit for
  // real here; resolved by hub-prefixing this one entry rather than
  // restructuring the whole map.
  'python-oop': [
    { label: '__slots__ and a Class-Level Default Value Conflict', route: '/python/oop/slots-and-a-class-level-default-value-conflict' },
    { label: 'Zero-Arg super() Breaks Inside a Nested Function', route: '/python/oop/zero-arg-super-breaks-inside-a-nested-function' },
    { label: 'A Mismatched Setter Name Creates a Second Attribute', route: '/python/oop/a-mismatched-setter-name-creates-a-second-attribute' },
  ],
  'dataclasses-pydantic': [
    { label: 'dataclass __eq__ Requires the Identical Class, Not Just Fields', route: '/python/dataclasses-pydantic/dataclass-eq-requires-the-identical-class-not-just-fields' },
    { label: 'model_validator(mode="before") Receives Unvalidated Raw Input', route: '/python/dataclasses-pydantic/model-validator-before-mode-receives-unvalidated-raw-input' },
    { label: 'Mutating a Frozen Dataclass List Field Corrupts Its Hash', route: '/python/dataclasses-pydantic/mutating-a-frozen-dataclass-list-field-corrupts-its-hash' },
  ],
  'decorators-context-managers': [
    { label: 'ExitStack.callback() Unwinds in the Same LIFO Order', route: '/python/decorators-context-managers/exitstack-callback-unwinds-in-the-same-lifo-order' },
    { label: 'A @contextmanager Generator Is Single-Use Only', route: '/python/decorators-context-managers/a-contextmanager-generator-is-single-use-only' },
    { label: 'ContextDecorator Discards the __enter__() Return Value', route: '/python/decorators-context-managers/contextdecorator-discards-the-enter-return-value' },
  ],
  'type-hints': [
    { label: '@overload Stubs Raise NotImplementedError If Called Directly', route: '/python/type-hints/overload-stubs-raise-notimplementederror-if-called-directly' },
    { label: 'Protocol Classes Cannot Be Instantiated Directly', route: '/python/type-hints/protocol-classes-cannot-be-instantiated-directly' },
    { label: 'TYPE_CHECKING-Only Names Need Quoting Before Python 3.14', route: '/python/type-hints/type-checking-only-names-need-quoting-before-python-314' },
  ],
  'collections-itertools': [
    { label: 'deque Indexed Access Is O(n), Not O(1)', route: '/python/collections-itertools/deque-indexed-access-is-o-n-not-o-1' },
    { label: 'groupby Sub-Iterators Share One Source and Vanish', route: '/python/collections-itertools/groupby-sub-iterators-share-one-source-and-vanish' },
    { label: 'heapq Tuples Need a Tie-Breaker for Equal Priorities', route: '/python/collections-itertools/heapq-tuples-need-a-tie-breaker-for-equal-priorities' },
  ],
  'asyncio': [
    { label: 'create_task() Needs a Saved Reference or It Vanishes', route: '/python/asyncio/create-task-needs-a-saved-reference-or-it-vanishes' },
    { label: 'gather() Does Not Cancel Siblings on Failure', route: '/python/asyncio/gather-does-not-cancel-siblings-on-failure' },
    { label: 'shield() Protects Inner Work, Not the Outer Awaiter', route: '/python/asyncio/shield-protects-inner-work-not-the-outer-awaiter' },
  ],
  'threading-multiprocessing': [
    { label: 'An Unread Future Exception Is Silently Swallowed', route: '/python/threading-multiprocessing/an-unread-future-exception-is-silently-swallowed' },
    { label: 'fork vs. spawn Changes What a Child Process Inherits', route: '/python/threading-multiprocessing/fork-vs-spawn-changes-what-a-child-process-inherits' },
    { label: 'A Crashed Worker Breaks the Whole Process Pool', route: '/python/threading-multiprocessing/a-crashed-worker-breaks-the-whole-process-pool' },
  ],
  'concurrency-patterns': [
    { label: 'TaskGroup Raises an ExceptionGroup, Not the First Exception', route: '/python/concurrency-patterns/taskgroup-raises-exceptiongroup' },
    { label: 'ProcessPoolExecutor Can’t Pickle Closures or Lambdas', route: '/python/concurrency-patterns/processpool-requires-picklable-closures' },
    { label: 'The Default Executor’s Thread Pool Size Isn’t Unlimited', route: '/python/concurrency-patterns/default-executor-thread-pool-sizing' },
  ],
  'fastapi': [
    { label: 'Dependency Cache Keys on the Callable Object', route: '/python/fastapi/dependency-cache-keys-on-the-callable-object' },
    { label: 'BackgroundTasks Merge Into One Sequential List', route: '/python/fastapi/background-tasks-merge-into-one-sequential-list' },
    { label: 'response_model Needs from_attributes for ORM Objects', route: '/python/fastapi/response-model-needs-from-attributes-for-orm-objects' },
  ],
  'django': [
    { label: 'QuerySet Caching Is Per-Object, Not Per-Query', route: '/python/django/queryset-caching-is-per-object-not-per-query' },
    { label: 'transaction.on_commit() Defers Signal Side Effects', route: '/python/django/transaction-on-commit-defers-signal-side-effects' },
    { label: 'has_object_permission() Skips List and Create', route: '/python/django/has-object-permission-skips-list-and-create' },
  ],
  'sqlalchemy': [
    { label: 'session.get() Hits the Identity Map — select() Does Not', route: '/python/sqlalchemy/session-get-hits-the-identity-map-select-does-not' },
    { label: 'Autobegin Starts a New Transaction After Commit', route: '/python/sqlalchemy/autobegin-starts-a-new-transaction-after-commit' },
    { label: 'delete-orphan Needs ORM-Tracked Disassociation', route: '/python/sqlalchemy/delete-orphan-needs-orm-tracked-disassociation' },
  ],
  'celery': [
    { label: 'PENDING Can’t Distinguish Unknown from Queued', route: '/python/celery/pending-state-cannot-distinguish-unknown-from-queued' },
    { label: 'chain() Prepends One Argument, Not an Unpacked Tuple', route: '/python/celery/chain-prepends-one-argument-not-unpacked-tuple' },
    { label: 'Redis visibility_timeout Can Redeliver Long Tasks', route: '/python/celery/redis-visibility-timeout-can-redeliver-long-tasks' },
  ],
  'numpy-pandas': [
    { label: 'Basic Slicing Is a View, Fancy Indexing Is a Copy', route: '/python/numpy-pandas/basic-slicing-is-a-view-fancy-indexing-is-a-copy' },
    { label: 'Broadcasting (3,) and (3,1) Silently Produces a (3,3)', route: '/python/numpy-pandas/broadcasting-3-and-3-1-silently-produces-a-3x3' },
    { label: 'groupby() Silently Drops NaN Keys by Default', route: '/python/numpy-pandas/groupby-silently-drops-nan-keys-by-default' },
  ],
  'scikit-learn': [
    { label: 'cv=Integer Auto-Selects StratifiedKFold for Classifiers', route: '/python/scikit-learn/cv-integer-auto-selects-stratifiedkfold' },
    { label: 'Feature Selection Before cross_val_score Still Leaks', route: '/python/scikit-learn/feature-selection-before-cv-still-leaks' },
    { label: 'Permutation Importance: Train vs. Test Data', route: '/python/scikit-learn/permutation-importance-train-vs-test-data' },
  ],
  'pytest': [
    { label: 'autouse Fixtures Run Without Being Requested', route: '/python/pytest/autouse-fixtures-run-without-being-requested' },
    { label: 'pytest.raises() Matches Subclasses Too', route: '/python/pytest/pytest-raises-matches-subclasses-too' },
    { label: 'A Test File’s Fixture Overrides conftest.py by Name', route: '/python/pytest/a-test-file-fixture-overrides-conftest-by-name' },
  ],
  'packaging': [
    { label: 'Poetry’s Caret Has a Special Case for 0.x Versions', route: '/python/packaging/poetry-caret-special-case-for-0-x-versions' },
    { label: 'pip’s Resolver Refuses Conflicting Requirements Since 20.3', route: '/python/packaging/pip-resolver-refuses-conflicting-requirements' },
    { label: 'pip freeze Outputs a Local Path for Editable Installs', route: '/python/packaging/pip-freeze-editable-installs-output-local-path' },
  ],
  'debugging-profiling': [
    { label: 'cProfile Overhead Distorts Tight Loops and Recursion', route: '/python/debugging-profiling/cprofile-overhead-distorts-tight-loops-and-recursion' },
    { label: 'tracemalloc Defaults to One Frame of Traceback', route: '/python/debugging-profiling/tracemalloc-defaults-to-one-frame-of-traceback' },
    { label: 'The gc Module Only Matters for Reference Cycles', route: '/python/debugging-profiling/gc-module-only-matters-for-reference-cycles' },
  ],
  // NOTE: keyed 'go-fundamentals', NOT bare 'fundamentals' — the JavaScript hub's
  // own /javascript/fundamentals topic already claims the bare key.
  'go-fundamentals': [
    { label: 'Go 1.22 Gives Each Loop Iteration Its Own Variable', route: '/go/fundamentals/go-122-gives-each-loop-iteration-its-own-variable' },
    { label: 'range Copies Each Element Into the Loop Variable', route: '/go/fundamentals/range-copies-each-element-into-the-loop-variable' },
    { label: 'Arrays Are Comparable, Slices Are Not', route: '/go/fundamentals/arrays-are-comparable-slices-are-not' },
  ],
  'structs-interfaces': [
    { label: 'Method Sets: T vs. *T', route: '/go/structs-interfaces/method-sets-t-vs-pointer-t' },
    { label: 'Embedded Methods Satisfy Interfaces Too', route: '/go/structs-interfaces/embedded-methods-satisfy-interfaces-too' },
    { label: 'Comparing Interfaces Can Panic at Runtime', route: '/go/structs-interfaces/comparing-interfaces-can-panic-at-runtime' },
  ],
  // NOTE: keyed 'go-error-handling', NOT bare 'error-handling' — the JavaScript hub's
  // own /javascript/error-handling topic already claims the bare key.
  'go-error-handling': [
    { label: 'errors.Join & Multi-Error Trees', route: '/go/error-handling/errors-join-multi-error-trees' },
    { label: 'Custom Is() and As() Methods', route: '/go/error-handling/custom-is-as-methods' },
    { label: 'panic/recover Is Goroutine-Scoped', route: '/go/error-handling/panic-recover-goroutine-scoped' },
  ],
  'slices-maps': [
    { label: 'append’s Real Growth Algorithm', route: '/go/slices-maps/append-growth-factor-shrinks-past-256' },
    { label: 'Map Deletes Don’t Shrink Memory', route: '/go/slices-maps/map-deletes-dont-shrink-memory' },
    { label: 'Struct Map Values Aren’t Addressable', route: '/go/slices-maps/struct-map-values-arent-addressable' },
  ],
  'goroutines': [
    { label: 'GOMAXPROCS Doesn’t Cap Blocked Threads', route: '/go/goroutines/gomaxprocs-doesnt-cap-blocked-threads' },
    { label: 'Unsynchronized Reads Have No Guarantee', route: '/go/goroutines/unsynchronized-reads-have-no-guarantee' },
    { label: 'WaitGroup Reuse: Add After Wait Returns', route: '/go/goroutines/waitgroup-reuse-add-after-wait-returns' },
  ],
  // NOTE: keyed 'go-channels', NOT bare 'channels' — the C# hub's own
  // /csharp/channels topic already claims the bare key.
  'go-channels': [
    { label: 'Closing a Closed Channel Panics Too', route: '/go/channels/closing-a-closed-channel-panics-too' },
    { label: 'Close Doesn’t Discard Buffered Values', route: '/go/channels/close-doesnt-discard-buffered-values' },
    { label: 'time.After’s Timer Leak — Fixed in Go 1.23', route: '/go/channels/time-after-timer-leak-fixed-in-go123' },
  ],
  'sync': [
    { label: 'sync.Pool’s Victim Cache (Go 1.13+)', route: '/go/sync/sync-pool-victim-cache-since-go113' },
    { label: 'sync.Cond: Wait Must Loop, Not If', route: '/go/sync/sync-cond-wait-must-loop-not-if' },
    { label: 'sync.Map.Range Has No Consistent Snapshot', route: '/go/sync/sync-map-range-no-consistent-snapshot' },
  ],
  // NOTE: keyed 'go-context', NOT bare 'context' — the React hub's
  // own /react/context topic already claims the bare key.
  'go-context': [
    { label: 'WithCancelCause and context.Cause()', route: '/go/context/withcancelcause-and-context-cause' },
    { label: 'Each WithValue Call Wraps a New Node', route: '/go/context/each-withvalue-call-wraps-a-new-node' },
    { label: 'A Child’s Deadline Is Clamped to Its Parent’s', route: '/go/context/child-deadline-clamped-to-parents' },
  ],
  'net-http': [
    { label: 'ServeMux Pattern Conflicts Panic at Registration', route: '/go/net-http/pattern-conflicts-panic-at-registration' },
    { label: 'The {$} Wildcard Matches an Exact Subtree Root', route: '/go/net-http/dollar-wildcard-matches-exact-subtree-root' },
    { label: 'The ... Wildcard Matches Remaining Segments', route: '/go/net-http/ellipsis-wildcard-matches-remaining-segments' },
  ],
  'gin': [
    { label: 'Context.Copy() Is Required for Goroutines', route: '/go/gin/context-copy-required-for-goroutines' },
    { label: 'ShouldBindBodyWith Caches the Body for Reuse', route: '/go/gin/shouldbindbodywith-caches-body-for-reuse' },
    { label: 'gin.Error’s Type: Public, Private, and Meta', route: '/go/gin/ginerror-type-classification-public-private' },
  ],
  'json-encoding': [
    { label: 'json.Marshal Sorts Map Keys Deterministically', route: '/go/json-encoding/marshal-sorts-map-keys' },
    { label: 'An Embedded Field’s json Tag Disables Promotion', route: '/go/json-encoding/embedded-json-tag-disables-promotion' },
    { label: 'Unmarshal Leaves Absent Fields Unchanged', route: '/go/json-encoding/unmarshal-leaves-absent-fields-unchanged' },
  ],
  'grpc': [
    { label: 'Bidi Streaming: The Two Directions Are Independent', route: '/go/grpc/bidi-streaming-directions-are-independent' },
    { label: 'NewClient Lazily Connects on First RPC', route: '/go/grpc/newclient-lazy-connects-on-first-rpc' },
    { label: 'ChainUnaryInterceptor: First Is Outermost', route: '/go/grpc/chain-interceptor-first-is-outermost' },
  ],
  'pgx': [
    { label: 'pgx.Batch Sends Queries in One Round-Trip', route: '/go/pgx/pgx-batch-sends-queries-in-one-round-trip' },
    { label: 'FOR UPDATE Lock Ordering Can Deadlock', route: '/go/pgx/for-update-lock-ordering-can-deadlock' },
    { label: 'Context Cancel Closes the Connection', route: '/go/pgx/context-cancel-closes-the-connection' },
  ],
  'gorm': [
    { label: 'FirstOrCreate Doesn’t Update on a Find', route: '/go/gorm/firstorcreate-doesnt-update-on-find' },
    { label: 'gorm.Expr Pushes Arithmetic to the Database', route: '/go/gorm/gormexpr-pushes-arithmetic-to-the-database' },
    { label: 'Association Mode Is Not Preload', route: '/go/gorm/association-mode-is-not-preload' },
  ],
  // NOTE: keyed 'go-generics', NOT bare 'generics' — the C# hub's own
  // /csharp/generics topic already claims the bare key.
  'go-generics': [
    { label: 'The Zero Value of a Type Parameter', route: '/go/generics/zero-value-of-a-type-parameter' },
    { label: 'A Constraint Can Combine a Union and a Method', route: '/go/generics/constraint-can-combine-union-and-method' },
    { label: 'comparable Can Panic Since Go 1.20', route: '/go/generics/comparable-can-panic-since-go120' },
  ],
  // NOTE: keyed 'aws-fundamentals', NOT bare 'fundamentals' — the JavaScript
  // hub's own /javascript/fundamentals topic already claims the bare key.
  // AwsNavComponent's own subtopicsOf('aws-fundamentals') /
  // isSubtopicsExpanded / toggleSubtopics calls use this same prefixed key.
  'aws-fundamentals': [
    { label: 'CLI Credential Chain Order', route: '/aws/fundamentals/cli-credential-chain-order-container-before-instance-profile' },
    { label: 'STS Role Chaining Caps Sessions at 1 Hour', route: '/aws/fundamentals/role-chaining-caps-sessions-at-1-hour-except-from-ec2' },
    { label: 'Local Zones Run Only a Subset of Services', route: '/aws/fundamentals/local-zones-run-a-subset-of-services-not-a-full-region' },
  ],
  ec2: [
    { label: 'T3 Launches Unlimited by Default', route: '/aws/ec2/t3-launches-unlimited-by-default-surplus-credits-can-surcharge' },
    { label: 'IMDS Hop Limit of 1 Breaks Containers', route: '/aws/ec2/imds-hop-limit-of-1-breaks-container-metadata-access' },
    { label: 'io1 Multi-Attach Lacks I/O Fencing', route: '/aws/ec2/io1-multi-attach-lacks-io-fencing-io2-supports-it' },
  ],
  'ecs-eks': [
    { label: 'How IRSA Actually Works', route: '/aws/ecs-eks/irsa-oidc-token-exchange-exact-service-account-match-required' },
    { label: 'VPC CNI IP Exhaustion', route: '/aws/ecs-eks/vpc-cni-ip-exhaustion-pods-pending-despite-free-cpu-memory' },
    { label: 'ECS Circuit Breaker Is Opt-In', route: '/aws/ecs-eks/circuit-breaker-disabled-by-default-needs-explicit-rollback-flag' },
  ],
  vpc: [
    { label: 'TGW Association vs Propagation', route: '/aws/vpc/tgw-route-tables-need-both-association-and-propagation-for-isolation' },
    { label: 'Cross-Region SG Reference Limit', route: '/aws/vpc/cross-region-vpc-peering-cant-reference-security-groups-use-cidr' },
    { label: "Flow Logs Aren't Real-Time", route: '/aws/vpc/flow-logs-arent-real-time-aggregation-interval-plus-delivery-lag' },
  ],
  'route53-cloudfront': [
    { label: "Weight 0 Isn't Truly Disabled", route: '/aws/route53-cloudfront/weight-zero-is-a-silent-standby-not-truly-disabled' },
    { label: 'EvaluateTargetHealth Scope', route: '/aws/route53-cloudfront/evaluatetargethealth-no-op-for-cloudfront-s3-alias-targets' },
    { label: 'Default Cache Key Scope', route: '/aws/route53-cloudfront/cloudfront-default-cache-key-excludes-query-strings-and-headers' },
  ],
  s3: [
    { label: '128 KB Transition Floor', route: '/aws/s3/objects-under-128kb-dont-transition-storage-class-by-default' },
    { label: 'SSE-KMS Replication Gap', route: '/aws/s3/sse-kms-encrypted-objects-not-replicated-by-default' },
    { label: 'Access Point Authorization', route: '/aws/s3/access-point-and-bucket-policy-must-both-allow-the-request' },
  ],
  'ebs-efs': [
    { label: 'ModifyVolume Rate Limit', route: '/aws/ebs-efs/modifyvolume-rate-limit-must-wait-for-completed-state' },
    { label: 'Access Point IAM Scoping', route: '/aws/ebs-efs/efs-access-point-iam-scoping-requires-accesspointarn-condition' },
    { label: 'AFTER_1_ACCESS Explained', route: '/aws/ebs-efs/efs-after-1-access-promotes-files-back-to-standard-immediately' },
  ],
  iam: [
    { label: 'Permission Boundary Exception', route: '/aws/iam/permission-boundary-doesnt-limit-role-session-resource-grants' },
    { label: 'AssumeRole Duration Behavior', route: '/aws/iam/assumerole-durationseconds-fails-not-truncates-past-max-session' },
    { label: 'ABAC Tag Protection', route: '/aws/iam/abac-tags-need-their-own-deny-untagresource-protection' },
  ],
  'iam-roles': [
    { label: "External ID Isn't a Secret", route: '/aws/iam-roles/external-id-is-not-actually-a-secret-per-aws-own-docs' },
    { label: "Pod Identity's Real Mechanism", route: '/aws/iam-roles/eks-pod-identity-uses-a-different-principal-and-needs-an-agent' },
    { label: 'GitHub OIDC Environment Claims', route: '/aws/iam-roles/github-oidc-environment-claims-restrict-beyond-branch-alone' },
  ],
  'rds-aurora': [
    { label: 'RDS Proxy Connection Pinning', route: '/aws/rds-aurora/rds-proxy-connection-pinning-defeats-pooling-silently' },
    { label: 'Switchover vs Unplanned Failover', route: '/aws/rds-aurora/switchover-guarantees-zero-data-loss-unplanned-failover-doesnt' },
    { label: 'Backtrack + Binlog Interaction', route: '/aws/rds-aurora/forcing-backtrack-with-binlog-enabled-breaks-read-replicas' },
  ],
  'dynamodb': [
    { label: 'GSI Silently Excludes Items', route: '/aws/dynamodb/gsi-silently-excludes-items-missing-the-indexed-sort-key' },
    { label: 'DAX Item vs Query Cache', route: '/aws/dynamodb/dax-item-cache-and-query-cache-are-fully-independent' },
    { label: 'Streams Poison Pill Blocking', route: '/aws/dynamodb/streams-poison-pill-blocks-a-shard-for-up-to-a-day' },
  ],
  'lambda': [
    { label: 'DLQ vs Destinations', route: '/aws/lambda/dlq-only-captures-the-event-not-why-it-failed' },
    { label: 'SnapStart Frozen Init State', route: '/aws/lambda/snapstart-freezes-init-state-crac-hooks-refresh-it' },
    { label: 'Reserved Concurrency Zero', route: '/aws/lambda/reserved-concurrency-zero-skips-async-retries-entirely' },
  ],
  'api-gateway': [
    { label: 'Authorizer Cache Scope', route: '/aws/api-gateway/authorizer-cache-applies-to-every-resource-not-just-one' },
    { label: 'Resource Policy Two Phases', route: '/aws/api-gateway/resource-policy-has-two-evaluation-phases-not-one' },
    { label: 'WebSocket $disconnect', route: '/aws/api-gateway/websocket-disconnect-is-best-effort-not-guaranteed' },
  ],
  'cloudwatch': [
    { label: 'Treat Missing Data', route: '/aws/cloudwatch/treat-missing-data-decides-insufficient-data-behavior' },
    { label: 'EMF Dimension Cardinality', route: '/aws/cloudwatch/emf-dimensions-with-high-cardinality-explode-metric-cost' },
    { label: 'ActionsSuppressor', route: '/aws/cloudwatch/actionssuppressor-natively-suppresses-composite-alarms' },
  ],
  'cloudformation-cdk': [
    { label: 'removalPolicy Covers Both Fields', route: '/aws/cloudformation-cdk/cdk-removal-policy-covers-updatereplacepolicy-too' },
    { label: 'Context Lookups Freeze', route: '/aws/cloudformation-cdk/cdk-context-lookups-freeze-until-manually-reset' },
    { label: 'Nested Stack Rollback Failure', route: '/aws/cloudformation-cdk/nested-stack-rollback-failure-blocks-the-whole-hierarchy' },
  ],
  // NOTE: hub-prefixed — bare 'security' is already claimed by the SQL hub's own /sql/security topic.
  'aws-security': [
    { label: 'EKS Runtime Monitoring Agent', route: '/aws/security/guardduty-eks-runtime-monitoring-needs-a-security-agent' },
    { label: 'KMS Rotation vs Data Keys', route: '/aws/security/kms-rotation-never-touches-already-generated-data-keys' },
    { label: 'Multi-Region Key Policies', route: '/aws/security/multi-region-key-policies-dont-sync-across-replicas' },
  ],
  'sqs-sns': [
    { label: 'FIFO Deduplication Silently Drops', route: '/aws/sqs-sns/fifo-deduplication-silently-drops-not-just-blocks' },
    { label: 'batchItemFailures Fails the Batch', route: '/aws/sqs-sns/malformed-batchitemfailures-fails-the-whole-batch' },
    { label: 'SNS FilterPolicyScope=MessageBody', route: '/aws/sqs-sns/sns-filterpolicyscope-messagebody-skips-duplicate-attrs' },
  ],
  'eventbridge': [
    { label: 'Archives Default to Indefinite Retention', route: '/aws/eventbridge/archives-default-to-indefinite-retention-not-free' },
    { label: 'InputTransformer Quoting Rules', route: '/aws/eventbridge/inputtransformer-quoting-differs-for-scalars-vs-objects' },
    { label: 'Duplicate Pattern Keys', route: '/aws/eventbridge/duplicate-event-pattern-keys-silently-use-the-last-one' },
  ],
  'step-functions': [
    { label: 'Distributed Map Lifts the Cap', route: '/aws/step-functions/distributed-map-lifts-classic-maps-40-concurrency-cap' },
    { label: 'HeartbeatSeconds Is a Separate Deadline', route: '/aws/step-functions/heartbeatseconds-is-a-separate-repeating-deadline' },
    { label: 'ResultSelector: the Missing Fifth Field', route: '/aws/step-functions/resultselector-filters-results-before-resultpath-applies' },
  ],
  'load-balancing': [
    { label: 'NLB Fail-Open vs. Per-AZ DNS Removal', route: '/aws/load-balancing/nlb-global-fail-open-vs-per-az-dns-removal' },
    { label: 'NLB UDP/QUIC Health Checks', route: '/aws/load-balancing/nlb-udp-quic-targets-use-non-udp-health-checks' },
    { label: 'ALB Reserved Cookie Names', route: '/aws/load-balancing/alb-reserved-cookie-names-and-4k-cookie-sharding' },
  ],
  'cost-optimization': [
    { label: 'Spot Rebalance vs. 2-Minute Notice', route: '/aws/cost-optimization/spot-rebalance-recommendations-arrive-before-the-2-minute-notice' },
    { label: 'Regional RI Size Flexibility', route: '/aws/cost-optimization/regional-ri-size-flexibility-uses-a-normalization-factor' },
    { label: 'Savings Plans Have No Exit', route: '/aws/cost-optimization/savings-plans-have-no-cancellation-or-resale-exit' },
  ],
  // NOTE: hub-prefixed — bare 'fundamentals' is already claimed by the JavaScript hub.
  'azure-fundamentals': [
    { label: 'ReadOnly Locks Block More Than Deletes', route: '/azure/fundamentals/readonly-locks-block-more-than-deletes-control-plane-only' },
    { label: 'az resource move Orphans Role Assignments', route: '/azure/fundamentals/az-resource-move-orphans-role-assignments-and-changes-the-id' },
    { label: 'Zonal vs. Zone-Redundant', route: '/azure/fundamentals/zonal-vs-zone-redundant-and-per-subscription-zone-mapping' },
  ],
  'arm': [
    { label: 'What-If Can\'t Resolve reference()', route: '/azure/arm/what-if-cant-resolve-reference-and-reports-noise-changes' },
    { label: 'Subscription Scope Needs Nested Templates', route: '/azure/arm/subscription-scope-deployments-need-nested-templates-for-normal-resources' },
    { label: 'Copy Defaults to Parallel & Child Promotion', route: '/azure/arm/copy-defaults-to-parallel-and-child-resources-need-promotion' },
  ],
  'virtual-machines': [
    { label: 'Standard SKU Public IPs Are Now Static', route: '/azure/virtual-machines/standard-sku-public-ips-are-now-always-static-not-dynamic' },
    { label: 'Scheduled Events Covers 5 Event Types', route: '/azure/virtual-machines/scheduled-events-covers-five-event-types-not-just-spot-eviction' },
    { label: 'VMSS Flexible: Real VMs, No Default Outbound', route: '/azure/virtual-machines/vmss-flexible-uses-real-vms-and-has-no-default-outbound-connectivity' },
  ],
  'app-service': [
    { label: 'Health Check: 10 Failures, Never All Removed', route: '/azure/app-service/health-check-defaults-to-10-failures-and-never-removes-all-instances' },
    { label: 'Auto-Heal: 4 Conditions, 3 Actions', route: '/azure/app-service/auto-heal-four-conditions-three-actions-main-page-never-mentions' },
    { label: 'SCM Basic Auth Is a Separate Attack Surface', route: '/azure/app-service/scm-basic-auth-is-a-separate-attack-surface-from-kudu' },
  ],
  // NOTE: hub-prefixed — bare 'functions' is already claimed by the JavaScript hub.
  'azure-functions': [
    { label: 'Queue/Service Bus Default to 16 Concurrent', route: '/azure/functions/queue-and-service-bus-triggers-default-to-16-concurrent-not-one' },
    { label: 'Service Bus Max Delivery Count Defaults to 10', route: '/azure/functions/service-bus-max-delivery-count-defaults-to-10-not-5' },
    { label: 'ContinueAsNew Resets History', route: '/azure/functions/continueasnew-resets-history-and-discards-incomplete-tasks' },
  ],
  'aks': [
    { label: 'Cluster Autoscaler\'s Exact Defaults', route: '/azure/aks/cluster-autoscaler-exact-default-timings-and-thresholds' },
    { label: 'max-surge Defaults to 1 Node', route: '/azure/aks/max-surge-defaults-to-1-node-not-a-percentage' },
    { label: 'Control Plane Can Be 3 Minor Versions Ahead', route: '/azure/aks/control-plane-can-be-up-to-3-minor-versions-ahead-of-nodes' },
  ],
  'virtual-network': [
    { label: 'NSG Default Rules Have Exact Priorities', route: '/azure/virtual-network/nsg-default-rules-have-exact-priorities-and-can-be-overridden' },
    { label: 'registration-enabled Only Works for VMs', route: '/azure/virtual-network/private-dns-registration-enabled-only-works-for-vms' },
    { label: 'Security Admin Rules Bypass NSG Evaluation', route: '/azure/virtual-network/security-admin-rules-can-bypass-nsg-evaluation-entirely' },
  ],
  'load-balancer': [
    { label: 'Default Outbound Access Retired', route: '/azure/load-balancer/default-outbound-access-was-retired-march-2026-need-explicit-method' },
    { label: 'Default SNAT Port Allocation Is Per-VM', route: '/azure/load-balancer/default-snat-port-allocation-is-per-vm-not-per-ip' },
    { label: 'Front Door Health Probe SampleSize Explained', route: '/azure/load-balancer/front-door-health-probe-samplesize-and-successfulsamples-explained' },
  ],
  // NOTE: hub-prefixed — bare 'storage' already used by the Containers/K8s hub's own /containers/storage topic.
  'azure-storage': [
    { label: 'User Delegation SAS Caps at 7 Days', route: '/azure/storage/user-delegation-sas-max-validity-is-7-days-not-your-expiry-param' },
    { label: 'Stored Access Policies Don’t Work With User Delegation SAS', route: '/azure/storage/stored-access-policies-dont-work-with-user-delegation-sas' },
    { label: 'Lifecycle baseBlob Actions Don’t Cover Versions', route: '/azure/storage/lifecycle-baseblob-actions-dont-cover-versions-or-snapshots' },
  ],
  'entra-id': [
    { label: 'Client Credentials Scope Must Be .default', route: '/azure/entra-id/client-credentials-scope-must-be-default-not-individual-permissions' },
    { label: 'SPA Refresh Tokens Cap at 24 Hours', route: '/azure/entra-id/spa-refresh-tokens-cap-at-24-hours-not-90-days-and-never-reset' },
    { label: 'PKCE Is Required for SPAs, Only Recommended for Native Apps', route: '/azure/entra-id/pkce-is-required-for-spas-but-only-recommended-for-native-apps' },
  ],
  // NOTE: hub-prefixed — bare 'rbac' already used by the Containers/K8s hub's own /containers/rbac topic.
  'azure-rbac': [
    { label: 'Propagation Isn’t One Number', route: '/azure/rbac/role-assignment-propagation-isnt-one-number-10-min-to-24-hours' },
    { label: 'Classic Co-Administrators Auto-Converted to Owner', route: '/azure/rbac/classic-co-administrators-auto-converted-to-owner-december-2025' },
    { label: 'IMDS Metadata:true and Unauthenticated Blast Radius', route: '/azure/rbac/imds-metadata-true-header-and-unauthenticated-blast-radius' },
  ],
  'sql-cosmos': [
    { label: 'Logical Partition Caps at 20 GB', route: '/azure/sql-cosmos/cosmos-logical-partition-caps-at-20gb-not-50gb' },
    { label: 'Change Feed Now Captures Deletes Natively', route: '/azure/sql-cosmos/change-feed-all-versions-and-deletes-mode-captures-deletes-natively' },
    { label: 'Long-Term Retention Goes to 10 Years', route: '/azure/sql-cosmos/azure-sql-long-term-retention-goes-to-10-years-beyond-pitr' },
  ],
  'monitor': [
    { label: 'Sampling Silently Skews count()', route: '/azure/monitor/sampling-silently-skews-count-use-sum-itemcount-instead' },
    { label: 'Basic Logs Supports Full KQL', route: '/azure/monitor/basic-logs-supports-full-kql-tradeoff-is-per-query-pricing' },
    { label: 'Daily Cap Stops All Ingestion', route: '/azure/monitor/daily-cap-stops-all-ingestion-not-just-the-excess' },
  ],
  'devops-pipelines': [
    { label: 'New Orgs Get Zero Free Parallel Jobs', route: '/azure/devops-pipelines/new-orgs-get-zero-free-parallel-jobs-must-request-a-grant' },
    { label: 'Unanswered Approvals Are Skipped, Not Rejected', route: '/azure/devops-pipelines/unanswered-approvals-are-skipped-not-rejected-at-timeout' },
    { label: 'Fork PR Builds on Self-Hosted Agents', route: '/azure/devops-pipelines/fork-pr-builds-on-self-hosted-agents-run-untrusted-code-on-prem' },
  ],
  'cost-management': [
    { label: 'Spot VM Eviction Is 30 Seconds, Not 2 Minutes', route: '/azure/cost-management/spot-vm-eviction-notice-is-30-seconds-not-2-minutes' },
    { label: 'Reservations Apply Before Savings Plans', route: '/azure/cost-management/reservations-apply-before-savings-plans-in-a-best-fit-model' },
    { label: 'Amortized Cost View Doesn’t Work for PAYG Reservations', route: '/azure/cost-management/amortized-cost-view-doesnt-work-for-payg-reservations' },
  ],
  'security-defender': [
    { label: 'MMA Is Fully Retired, Defender Now Agentless', route: '/azure/security-defender/mma-agent-fully-retired-defender-servers-now-agentless' },
    { label: 'Defender CSPM Is a Separate Paid Plan', route: '/azure/security-defender/defender-cspm-is-a-separate-paid-plan-beyond-foundational-cspm' },
    { label: 'JIT Quick-Enable Only Protects One Port', route: '/azure/security-defender/jit-quick-enable-only-protects-one-port-not-the-full-set' },
  ],
  'key-vault': [
    { label: 'Reference Refresh Is 24 Hours, Not Minutes', route: '/azure/key-vault/key-vault-reference-refresh-is-24-hours-not-minutes' },
    { label: 'Soft-Deleted Vaults Reserve Their Name', route: '/azure/key-vault/soft-deleted-vault-reserves-its-name-and-loses-rbac-bindings' },
    { label: 'New Vaults Now Default to RBAC', route: '/azure/key-vault/new-vaults-now-default-to-rbac-but-only-on-newer-api-versions' },
  ],
  'service-bus': [
    { label: 'Duplicate Detection Is Off by Default', route: '/azure/service-bus/duplicate-detection-is-off-by-default-10-minute-window-when-on' },
    { label: 'Auto-Forwarding Caps at 4 Hops', route: '/azure/service-bus/auto-forwarding-caps-at-4-hops-then-dead-letters' },
    { label: 'High Prefetch Count Expires Locks Early', route: '/azure/service-bus/high-prefetch-count-expires-locks-before-processing-even-starts' },
  ],
  'container-apps': [
    { label: 'Scale-to-Zero Has a Hidden 5-Minute Cooldown', route: '/azure/container-apps/scale-to-zero-has-a-hidden-5-minute-cooldown' },
    { label: 'No Scale Rule Means an Implicit HTTP Rule Applies', route: '/azure/container-apps/no-scale-rule-means-an-implicit-http-rule-applies' },
    { label: 'Secret Updates Don’t Auto-Restart Active Revisions', route: '/azure/container-apps/secret-updates-dont-auto-restart-active-revisions' },
  ],
  redis: [
    { label: 'There’s No “Redis Contributor” Data Role', route: '/azure/redis/theres-no-redis-contributor-data-role' },
    { label: 'The Real Default Eviction Policy Is volatile-lru', route: '/azure/redis/default-eviction-policy-is-volatile-lru-not-noeviction' },
    { label: 'Enabling Entra ID Auth Reboots Every Node', route: '/azure/redis/enabling-entra-id-auth-reboots-every-node-up-to-30-minutes' },
  ],
  'api-management': [
    { label: 'Cache Is Shared Per Region Only', route: '/azure/api-management/cache-is-shared-per-region-only-and-fails-silently' },
    { label: 'rate-limit-by-key Counts Per Gateway', route: '/azure/api-management/rate-limit-by-key-counts-per-gateway-not-per-instance' },
    { label: 'Self-Hosted Gateway Fails Static', route: '/azure/api-management/self-hosted-gateway-fails-static-but-needs-backup-to-restart' },
  ],
  bicep: [
    { label: 'Forgetting existing Turns a Reference Into a Redeploy', route: '/azure/bicep/forgetting-existing-turns-a-reference-into-a-redeploy' },
    { label: 'Modules Need Their Own scope Property', route: '/azure/bicep/modules-need-their-own-scope-property-for-a-different-target' },
    { label: 'A Module’s Static name Can Cause a Silent Collision', route: '/azure/bicep/a-modules-static-name-can-cause-a-silent-output-collision' },
  ],
  // NOTE: hub-prefixed — bare 'fundamentals' is already claimed by the JavaScript hub
  // (/javascript/fundamentals).
  'linux-fundamentals': [
    { label: 'systemd Targets Map to Runlevels, But Not One-to-One', route: '/linux/fundamentals/systemd-targets-map-to-runlevels-but-not-one-to-one' },
    { label: 'journald Logs Are Lost on Reboot by Default', route: '/linux/fundamentals/journald-logs-are-lost-on-reboot-unless-var-log-journal-exists' },
    { label: 'A sysctl Change Is Runtime-Only Until Persisted', route: '/linux/fundamentals/a-sysctl-change-is-runtime-only-until-persisted-to-a-file' },
  ],
  'file-system': [
    { label: '/tmp Cleared on Reboot Is Only Half the Story', route: '/linux/file-system/tmp-cleared-on-reboot-is-only-half-the-story' },
    { label: 'Skip nofail in fstab and Boot Hangs, Then Emergency Mode', route: '/linux/file-system/skip-nofail-in-fstab-and-boot-hangs-then-drops-to-emergency' },
    { label: '/usr/local vs /opt: Shared Tree vs One Subdirectory Per App', route: '/linux/file-system/usr-local-vs-opt-shared-tree-vs-one-subdirectory-per-app' },
  ],
  'essential-commands': [
    { label: 'xargs Without -print0 Breaks on Filenames With Spaces', route: '/linux/essential-commands/xargs-without-print0-breaks-on-filenames-with-spaces' },
    { label: 'awk’s Default Field Split Collapses Repeated Delimiters', route: '/linux/essential-commands/awk-default-field-split-collapses-repeated-delimiters' },
    { label: 'tar Already Strips Leading Slashes Unless -P Is Used', route: '/linux/essential-commands/tar-already-strips-leading-slashes-unless-p-is-used' },
  ],
  'file-permissions': [
    { label: 'setuid Is Ignored on Shell Scripts, Not Just Risky', route: '/linux/file-permissions/setuid-is-ignored-on-shell-scripts-not-just-risky' },
    { label: 'ACL Mask Caps Effective Permissions', route: '/linux/file-permissions/acl-mask-caps-effective-permissions-and-auto-recalculates' },
    { label: 'chmod 755 on a Directory Does NOT Clear setgid', route: '/linux/file-permissions/chmod-755-on-a-directory-does-not-clear-setgid' },
  ],
  'users-groups': [
    { label: 'userdel Without -r Leaves Orphaned Files for UID Reuse', route: '/linux/users-groups/userdel-without-r-leaves-orphaned-files-for-uid-reuse' },
    { label: 'A NOPASSWD Grant Can Be a Full Root Escalation', route: '/linux/users-groups/nopasswd-grant-to-a-safe-command-can-be-a-full-root-escalation' },
    { label: '/etc/skel Populates New Homes Once, Not Retroactively', route: '/linux/users-groups/etc-skel-populates-new-homes-once-not-retroactively' },
  ],
  'process-management': [
    { label: 'Orphans Reparent to PID 1, Which May Not Reap in a Container', route: '/linux/process-management/orphans-reparent-to-pid-1-which-may-not-reap-in-a-container' },
    { label: 'kill Signals One Process — Use a Negative PID for the Group', route: '/linux/process-management/kill-signals-one-process-use-negative-pid-for-the-group' },
    { label: 'renice Is a One-Way Ratchet for Non-Root Users', route: '/linux/process-management/renice-is-a-one-way-ratchet-for-non-root-users' },
  ],
  'system-monitoring': [
    { label: 'Load Average Has Blind Spots — PSI Is the Modern Replacement', route: '/linux/system-monitoring/load-average-has-blind-spots-psi-is-the-modern-replacement' },
    { label: 'oom_score_adj = -1000 Can Hang the Whole System', route: '/linux/system-monitoring/oom-score-adj-negative-1000-can-hang-the-whole-system' },
    { label: 'iostat’s %util Is Misleading on NVMe SSDs', route: '/linux/system-monitoring/iostats-percent-util-is-misleading-on-nvme-ssds' },
  ],
  'networking': [
    { label: 'TIME_WAIT Is Normal, Not a Bug — and It Can’t Be Tuned', route: '/linux/networking/time-wait-is-normal-not-a-bug-and-cant-be-tuned' },
    { label: 'Traceroute Defaults to UDP, Which Firewalls Often Block', route: '/linux/networking/traceroute-defaults-to-udp-which-firewalls-often-block' },
    { label: 'Jumbo Frames + MTU Mismatch Creates a Silent PMTUD Blackhole', route: '/linux/networking/jumbo-frames-mtu-mismatch-creates-a-silent-pmtud-blackhole' },
  ],
  'firewall': [
    { label: 'ufw limit Throttles One IP — Not Distributed Brute Force', route: '/linux/firewall/ufw-limit-throttles-one-ip-not-distributed-brute-force' },
    { label: 'iptables -F Doesn’t Reset the Default Policy — a DROP Policy Can Lock You Out', route: '/linux/firewall/iptables-flush-does-not-reset-policy-can-lock-you-out' },
    { label: 'ip_forward Alone Isn’t Enough for UFW Router Mode', route: '/linux/firewall/ip-forward-alone-is-not-enough-for-ufw-router-mode' },
  ],
  'ssh': [
    { label: 'Agent Forwarding Exposes Signing, Not Your Key — ProxyJump Avoids It', route: '/linux/ssh/agent-forwarding-exposes-signing-proxyjump-avoids-it' },
    { label: 'ssh -R Binds to Remote Loopback Only, Without GatewayPorts', route: '/linux/ssh/ssh-r-binds-to-remote-loopback-only-without-gatewayports' },
    { label: 'ControlMaster Multiplexing Can Hit the Server’s MaxSessions Limit', route: '/linux/ssh/controlmaster-multiplexing-hits-the-maxsessions-limit' },
  ],
  'bash-scripting': [
    { label: 'Exit Codes Wrap Around at 256 — return 256 Means Success', route: '/linux/bash-scripting/exit-codes-wrap-around-at-256-return-256-means-success' },
    { label: 'local Assignment Masks set -e Command Failures', route: '/linux/bash-scripting/local-assignment-masks-set-e-command-failures' },
    { label: 'trap EXIT Overwrites, It Doesn’t Chain Multiple Handlers', route: '/linux/bash-scripting/trap-exit-overwrites-not-chains-multiple-handlers' },
  ],
  'bash-advanced': [
    { label: 'mapfile Without -t Keeps the Trailing Newline in Every Element', route: '/linux/bash-advanced/mapfile-without-t-keeps-the-trailing-newline-in-every-element' },
    { label: 'exec + tee Process Substitution Can Race the Script’s Own Exit', route: '/linux/bash-advanced/exec-tee-redirect-races-script-exit-truncating-the-log' },
    { label: 'check_host Always Exits 0, Regardless of Up or Down', route: '/linux/bash-advanced/check-host-always-exits-0-regardless-of-up-or-down' },
  ],
  'package-management': [
    { label: 'apt-key Is Deprecated — signed-by Keyrings Is the Modern Replacement', route: '/linux/package-management/apt-key-is-deprecated-signed-by-keyrings-is-the-modern-replacement' },
    { label: 'apt-mark auto/manual Is What Actually Drives autoremove', route: '/linux/package-management/apt-mark-auto-manual-is-what-actually-drives-autoremove' },
    { label: 'dnf history undo Can Fail When the Old Version Left the Repo', route: '/linux/package-management/dnf-history-undo-can-fail-when-the-old-version-left-the-repo' },
  ],
  'systemd': [
    { label: 'ExecReload=kill -HUP $MAINPID Can Kill, Not Reload, a Node.js Service', route: '/linux/systemd/execreload-kill-hup-mainpid-can-kill-not-reload-a-nodejs-service' },
    { label: 'StartLimitBurst Locks a Service in Failed State Until reset-failed', route: '/linux/systemd/startlimitburst-locks-a-service-in-failed-state-until-reset-failed' },
    { label: 'systemctl edit Drop-Ins Need an Empty ExecStart= to Override It', route: '/linux/systemd/systemctl-edit-drop-ins-need-an-empty-execstart-to-override-it' },
  ],
  'disk-storage': [
    { label: 'Deleted-but-Open Files Hide Space — df and du Never Agree', route: '/linux/disk-storage/deleted-but-open-files-hide-space-df-and-du-never-agree' },
    { label: 'XFS Has No Shrink Command — Backup, Recreate, Restore Is the Only Path', route: '/linux/disk-storage/xfs-has-no-shrink-command-backup-recreate-restore-is-the-only-path' },
    { label: 'Growing a Cloud VM’s LVM Root Needs pvresize, Not Just growpart', route: '/linux/disk-storage/growing-a-cloud-vms-lvm-root-needs-pvresize-not-just-growpart' },
  ],
  'environment-variables': [
    { label: 'env $(cat .env | xargs) Breaks on Values Containing Spaces', route: '/linux/environment-variables/env-cat-env-xargs-breaks-on-values-containing-spaces' },
    { label: 'docker inspect Reveals Every -e Secret in Plaintext', route: '/linux/environment-variables/docker-inspect-reveals-every-e-secret-in-plaintext' },
    { label: 'unset Removes a Variable — VAR= Only Empties It', route: '/linux/environment-variables/unset-removes-a-variable-var-only-empties-it' },
  ],
  'log-analysis': [
    { label: 'The Slowest-Responses Sort Assumes request_time Is Already Logged', route: '/linux/log-analysis/sort-t-k3-rn-sorts-garbage-unless-request-time-is-in-the-log-format' },
    { label: 'journalctl Only Shows the Current Boot by Default', route: '/linux/log-analysis/journalctl-only-shows-the-current-boot-by-default' },
    { label: 'logrotate’s copytruncate Has a Real Data-Loss Race Window', route: '/linux/log-analysis/logrotates-copytruncate-has-a-real-data-loss-race-window' },
  ],
  'performance-tuning': [
    { label: 'I/O Scheduler Writes to /sys/block Are Not Persistent — Use a udev Rule', route: '/linux/performance-tuning/io-scheduler-writes-to-sys-block-are-not-persistent-use-a-udev-rule' },
    { label: 'discard in fstab Has a Real Penalty — fstrim.timer Is Preferred', route: '/linux/performance-tuning/discard-in-fstab-has-a-real-penalty-fstrim-timer-is-preferred' },
    { label: 'numactl --membind Is a Hard Constraint — --preferred Is the Safer Default', route: '/linux/performance-tuning/numactl-membind-is-a-hard-constraint-preferred-is-the-safer-default' },
  ],
  'vim': [
    { label: 'A Delete Silently Clobbers Your Yank — Paste From Register 0 Instead', route: '/linux/vim/a-delete-silently-clobbers-your-yank-use-0p-to-paste-it-back' },
    { label: 'smartcase Does Nothing Unless ignorecase Is Also Set', route: '/linux/vim/smartcase-does-nothing-unless-ignorecase-is-also-set' },
    { label: 'vim -d Diff Mode Has Its Own Commands the Main Page Never Shows', route: '/linux/vim/vim-d-diff-mode-has-its-own-commands-the-main-page-never-shows' },
  ],
  // NOTE: keyed 'tf-fundamentals', NOT bare 'fundamentals' — the JavaScript
  // hub already claims the bare key with its own subtopics.
  'tf-fundamentals': [
    { label: 'for_each Requires a Map or Set — Not a Bare List', route: '/terraform/fundamentals/for-each-requires-a-map-or-set-not-a-bare-list' },
    { label: 'depends_on Is for Dependencies Terraform Cannot See', route: '/terraform/fundamentals/depends-on-is-for-dependencies-terraform-cannot-see' },
    { label: 'moved Blocks, Not Manual Edits, Fix a Renamed Resource', route: '/terraform/fundamentals/moved-blocks-not-manual-edits-fix-a-renamed-resource' },
  ],
  providers: [
    { label: 'The ~> Constraint’s Upper Bound Depends on Segment Count', route: '/terraform/providers/pessimistic-constraint-upper-bound-depends-on-segment-count' },
    { label: 'Module Provider Alias Needs configuration_aliases Declared', route: '/terraform/providers/module-provider-alias-needs-configuration-aliases-declared' },
    { label: 'init -upgrade Upgrades Every Provider, Not Just One', route: '/terraform/providers/init-upgrade-upgrades-every-provider-not-just-one' },
  ],
  variables: [
    { label: 'nullable = false Substitutes the Default for an Explicit null', route: '/terraform/variables/nullable-false-substitutes-default-even-for-explicit-null' },
    { label: 'optional() Lets Object Variables Evolve Without Breaking Callers', route: '/terraform/variables/optional-lets-object-variables-evolve-without-breaking-callers' },
    { label: 'A Sensitive Output Needs Its Own sensitive = true', route: '/terraform/variables/sensitive-output-needs-its-own-sensitive-true-declaration' },
  ],
  outputs: [
    { label: 'precondition Blocks Catch a Bad Output Value Before Export', route: '/terraform/outputs/precondition-blocks-catch-a-bad-output-value-before-export' },
    { label: 'terraform_remote_state Grants Access to the Whole State File', route: '/terraform/outputs/remote-state-grants-access-to-the-entire-state-not-just-outputs' },
    { label: 'output -json Reveals Sensitive Values the Plain Command Redacts', route: '/terraform/outputs/output-json-reveals-sensitive-values-the-plain-command-redacts' },
  ],
  resources: [
    { label: 'prevent_destroy Is Bypassed by Removing the Whole Resource Block', route: '/terraform/resources/prevent-destroy-is-bypassed-by-removing-the-whole-resource-block' },
    { label: 'replace_triggered_by Forces Replacement From an Unrelated Resource', route: '/terraform/resources/replace-triggered-by-forces-replacement-from-an-unrelated-resource' },
    { label: 'A Timeout Doesn’t Mean the Resource Wasn’t Created', route: '/terraform/resources/a-timeout-does-not-mean-the-resource-was-not-created' },
  ],
  'data-sources': [
    { label: 'external Data Source: query and result Are Both String-Only Maps', route: '/terraform/data-sources/external-data-source-query-and-result-are-both-string-only-maps' },
    { label: 'for_each, Not count, for Iterating a Data Source’s Own Results', route: '/terraform/data-sources/for-each-not-count-for-iterating-a-data-sources-own-results' },
    { label: 'A Data Source Can Need depends_on Too', route: '/terraform/data-sources/a-data-source-can-need-depends-on-too-for-a-hidden-dependency' },
  ],
  expressions: [
    { label: 'can() Is for Variable Validation — try() Is the Real Fallback Tool', route: '/terraform/expressions/can-is-for-variable-validation-try-is-the-real-fallback-tool' },
    { label: 'Nested Dynamic Blocks Shadow the Outer Iterator by Default', route: '/terraform/expressions/nested-dynamic-blocks-shadow-the-outer-iterator-by-default' },
    { label: 'A for Expression Map Errors on Duplicate Keys Unless Grouped', route: '/terraform/expressions/a-for-expression-map-errors-on-duplicate-keys-unless-grouped' },
  ],
  // NOTE: keyed 'tf-functions', NOT bare 'functions' — the JavaScript
  // hub already claims the bare key with its own subtopics.
  'tf-functions': [
    { label: 'merge() null Overwrites, It Doesn’t Skip, an Earlier Value', route: '/terraform/functions/merge-null-overwrites-not-skips-an-earlier-non-null-value' },
    { label: 'flatten() Only Unwraps Nested Lists', route: '/terraform/functions/flatten-only-unwraps-nested-lists-not-lists-inside-maps' },
    { label: 'Mixing newbits in cidrsubnet() Can Overlap', route: '/terraform/functions/mixing-newbits-in-cidrsubnet-can-overlap-cidrsubnets-avoids-it' },
  ],
  state: [
    { label: 'force-unlock: Verify the Lock Holder Is Actually Stale First', route: '/terraform/state/force-unlock-verify-the-lock-holder-is-actually-stale-first' },
    { label: 'The State serial Number Detects a Stale state push', route: '/terraform/state/the-state-serial-number-is-what-detects-a-stale-state-push' },
    { label: 'Workspaces Share the Same Backend — Prefer Directories for Prod', route: '/terraform/state/workspaces-share-the-same-backend-prefer-directories-for-prod' },
  ],
  'remote-backends': [
    { label: 'S3 Backend No Longer Needs DynamoDB', route: '/terraform/remote-backends/s3-backend-no-longer-needs-dynamodb-use-lockfile-is-current' },
    { label: 'cloud and backend Blocks Are Mutually Exclusive', route: '/terraform/remote-backends/cloud-block-and-backend-block-are-mutually-exclusive' },
    { label: 'GCS Backend Supports a Customer-Managed KMS Key', route: '/terraform/remote-backends/gcs-backend-supports-a-customer-managed-kms-key' },
  ],
  workspaces: [
    { label: 'workspace delete -force Orphans Resources', route: '/terraform/workspaces/workspace-delete-force-orphans-resources-it-does-not-destroy' },
    { label: 'terraform.workspace Cannot Parameterize the backend Block', route: '/terraform/workspaces/terraform-workspace-cannot-parameterize-the-backend-block' },
    { label: 'The default Workspace’s State Path Is Asymmetric', route: '/terraform/workspaces/the-default-workspace-key-path-is-asymmetric-workspace-key-prefix' },
  ],
  // NOTE: keyed 'tf-modules', NOT bare 'modules' — TypeScript's own
  // /typescript/modules claimed the bare key first (Go uses 'go-modules').
  'tf-modules': [
    { label: 'version Is a Registry-Only Argument, Not a General Pin', route: '/terraform/modules/version-is-a-registry-only-argument-not-a-general-pin' },
    { label: 'Remote Modules Are Cached — a Changed ref Needs init -upgrade', route: '/terraform/modules/remote-modules-are-cached-a-changed-ref-needs-init-upgrade' },
    { label: 'The Double Slash Marks Where the Package Ends', route: '/terraform/modules/the-double-slash-marks-where-the-package-ends' },
  ],
  'module-patterns': [
    { label: 'count on a Module Changes How Every Output Is Accessed', route: '/terraform/module-patterns/count-on-a-module-changes-how-every-output-is-accessed' },
    { label: 'terraform test Defaults to apply, Not plan', route: '/terraform/module-patterns/terraform-test-defaults-to-apply-not-plan' },
    { label: 'Module depends_on Makes the Whole Module Conservative', route: '/terraform/module-patterns/module-depends-on-makes-the-whole-module-conservative' },
  ],
  provisioners: [
    { label: 'self Is Scoped to the Resource the Provisioner Is Attached To', route: '/terraform/provisioners/self-is-scoped-to-the-resource-the-provisioner-is-attached-to' },
    { label: 'Create-Time Failure Taints — Destroy-Time Failure Can Stick', route: '/terraform/provisioners/create-time-failure-taints-destroy-time-failure-can-stick' },
    { label: 'on_failure = continue Only Silences It', route: '/terraform/provisioners/on-failure-continue-only-silences-it-never-retries-or-fixes' },
  ],
  import: [
    { label: 'for_each Import Blocks Handle Bulk Import', route: '/terraform/import/for-each-import-blocks-handle-bulk-import-not-one-at-a-time' },
    { label: 'The Import ID Format Is Resource-Specific, Not Universal', route: '/terraform/import/the-import-id-format-is-resource-specific-not-universal' },
    { label: 'Import Never Pulls in Dependents or Sensitive Values', route: '/terraform/import/import-never-pulls-in-dependents-or-sensitive-values' },
  ],
  // NOTE: 'cicd' confirmed collision-free (quoted and unquoted) across the whole file.
  cicd: [
    { label: 'A Saved Plan File Needs the Same Version and Can Go Stale', route: '/terraform/cicd/a-saved-plan-file-needs-the-same-version-and-can-go-stale' },
    { label: 'The OIDC sub Claim Differs Between push and pull_request', route: '/terraform/cicd/the-oidc-sub-claim-differs-between-push-and-pull-request' },
    { label: 'A Saved Plan File Is Plaintext and Must Be Treated as a Secret', route: '/terraform/cicd/a-saved-plan-file-is-plaintext-and-must-be-treated-as-a-secret' },
  ],
  // Angular keeps the bare 'testing' key (claimed it first, see the
  // unquoted "testing:" entry above). Terraform's own /terraform/testing
  // claims subtopics too — hub-prefixed to 'tf-testing' below.
  'tf-testing': [
    { label: 'run.NAME.output Lets Later Blocks Reference Earlier Run Blocks', route: '/terraform/testing/run-name-output-lets-later-blocks-reference-earlier-run-blocks' },
    { label: 'mock_resource Values Apply to Every Instance, Not Per-Instance', route: '/terraform/testing/mock-resource-values-apply-to-every-instance-not-per-instance' },
    { label: 'Destroy Runs in Reverse Order — a Referenced Run’s State Is Already Gone', route: '/terraform/testing/destroy-runs-in-reverse-order-a-referenced-runs-state-is-already-gone' },
  ],
  // SQL keeps the bare 'security' key (claimed it first, see the
  // quoted 'security': entry above). Terraform's own /terraform/security
  // claims subtopics too — hub-prefixed to 'tf-security' below.
  'tf-security': [
    { label: 'Soft-Mandatory Overrides Need a Specific TFC Permission, Not Just Plan Access', route: '/terraform/security/soft-mandatory-overrides-need-a-specific-tfc-permission-not-just-plan-access' },
    { label: 'prevent_destroy Blocks terraform destroy Too — But Not a Removed Block', route: '/terraform/security/prevent-destroy-blocks-terraform-destroy-too-but-not-a-removed-block' },
    { label: 'OPA/conftest Enforcement Is a CI-Pipeline Responsibility, Not Native', route: '/terraform/security/opa-conftest-enforcement-is-a-ci-pipeline-responsibility-not-native' },
  ],
  // NOTE: 'drift' confirmed collision-free (quoted and unquoted) across the whole file.
  drift: [
    { label: '-refresh=false and -refresh-only Do Near-Opposite Things', route: '/terraform/drift/refresh-false-and-refresh-only-do-near-opposite-things' },
    { label: 'ignore_changes Does Not Refresh a Stale Value — It Just Stops Future Diffs', route: '/terraform/drift/ignore-changes-does-not-refresh-a-stale-value-it-just-stops-future-diffs' },
    { label: 'TFC Health Assessments Are Read-Only — They Never Write to State', route: '/terraform/drift/tfc-health-assessments-are-read-only-they-never-write-to-state' },
  ],
  // NOTE: 'refactoring' confirmed collision-free (quoted and unquoted) across the whole file.
  refactoring: [
    { label: 'moved Blocks Require the Same Resource Type on Both Sides', route: '/terraform/refactoring/moved-blocks-require-the-same-resource-type-on-both-sides' },
    { label: 'removed Defaults to Actually Destroying the Resource', route: '/terraform/refactoring/removed-defaults-to-actually-destroying-the-resource' },
    { label: '-target Pulls In Dependencies Automatically, But Never Dependents', route: '/terraform/refactoring/target-pulls-in-dependencies-automatically-but-never-dependents' },
  ],
  // NOTE: 'opentofu' confirmed collision-free (quoted and unquoted) across the whole file.
  opentofu: [
    { label: 'Key Rotation Needs the fallback Method, Not Just a Swapped Key', route: '/terraform/opentofu/key-rotation-needs-the-fallback-method-not-just-a-swapped-key' },
    { label: 'BSL Has a Four-Year Change Date That Converts to MPL Automatically', route: '/terraform/opentofu/bsl-has-a-four-year-change-date-that-converts-to-mpl-automatically' },
    { label: 'remote_state Data Source Needs Its Own Encryption Config Too', route: '/terraform/opentofu/remote-state-data-source-needs-its-own-encryption-config-too' },
  ],
  // JavaScript keeps the bare 'fundamentals' key (claimed it first). Service
  // Mesh's own /service-mesh/fundamentals claims subtopics too — hub-prefixed
  // to 'mesh-fundamentals' below.
  'mesh-fundamentals': [
    { label: 'Ambient Mode: ztunnel Is L4-Only — L7 Routing Needs a Waypoint', route: '/service-mesh/fundamentals/ambient-mode-ztunnel-is-l4-only-l7-routing-needs-a-waypoint' },
    { label: 'xDS Updates Need Make-Before-Break Ordering, or Traffic Black-Holes', route: '/service-mesh/fundamentals/xds-updates-need-make-before-break-ordering-or-traffic-black-holes' },
    { label: 'A VirtualService Subset Missing From DestinationRule Returns 503', route: '/service-mesh/fundamentals/a-virtualservice-subset-missing-from-destinationrule-returns-503' },
  ],
  // NOTE: 'istio-architecture' confirmed collision-free (quoted and unquoted) across the whole file.
  'istio-architecture': [
    { label: 'Cert Rotation Overlaps Old and New Certs to Avoid Handshake Failures', route: '/service-mesh/istio-architecture/cert-rotation-overlaps-old-and-new-certs-to-avoid-handshake-failures' },
    { label: 'Sidecar CRD Scoping Egress Does Not Block Unmatched Inbound Traffic', route: '/service-mesh/istio-architecture/sidecar-crd-scoping-egress-does-not-block-unmatched-inbound-traffic' },
    { label: 'Live Traffic Surviving an Istiod Outage Has a Cert TTL Time Limit', route: '/service-mesh/istio-architecture/live-traffic-surviving-an-istiod-outage-has-a-cert-ttl-time-limit' },
  ],
  // NOTE: 'istio-install' confirmed collision-free (quoted and unquoted) across the whole file.
  'istio-install': [
    { label: 'Both Injection Labels Present: istio-injection Silently Wins', route: '/service-mesh/istio-install/both-injection-labels-present-istio-injection-silently-wins' },
    { label: 'uninstall --purge Does Not Reliably Remove Every Webhook', route: '/service-mesh/istio-install/uninstall-purge-does-not-reliably-remove-every-webhook' },
    { label: 'Revision Uninstall Checks Active Proxies, Not Namespace Labels', route: '/service-mesh/istio-install/revision-uninstall-checks-active-proxies-not-namespace-labels' },
  ],
  // NOTE: 'envoy' confirmed collision-free (quoted and unquoted) across the whole file.
  envoy: [
    { label: 'WasmPlugin phase Determines Order Relative to Built-in Filters', route: '/service-mesh/envoy/wasmplugin-phase-determines-order-relative-to-built-in-filters' },
    { label: 'INSERT_AFTER Targeting router Means the Filter Never Runs', route: '/service-mesh/envoy/insert-after-targeting-router-means-the-filter-never-runs' },
    { label: 'Delta xDS Isolates a NACK’d Resource — SotW Blocks the Whole Type', route: '/service-mesh/envoy/delta-xds-isolates-a-nackd-resource-sotw-blocks-the-whole-type' },
  ],
  // NOTE: 'linkerd' confirmed collision-free (quoted and unquoted) across the whole file.
  linkerd: [
    { label: 'TrafficSplit Cannot Be Self-Referential — apex Needs Its Own Name', route: '/service-mesh/linkerd/trafficsplit-cannot-be-self-referential-apex-needs-its-own-name' },
    { label: 'Circuit Breaking Exists — It Needs an Explicit failure-accrual Annotation', route: '/service-mesh/linkerd/circuit-breaking-exists-but-needs-an-explicit-failure-accrual-annotation' },
    { label: 'external-issuer Alone Leaves the Self-Generated Trust Anchor in Place', route: '/service-mesh/linkerd/external-issuer-alone-leaves-the-self-generated-trust-anchor-in-place' },
  ],
  // NOTE: 'traffic-management' confirmed collision-free (quoted and unquoted) across the whole file.
  'traffic-management': [
    { label: 'Fault Injection and Retries Cannot Coexist on the Same Route', route: '/service-mesh/traffic-management/fault-injection-and-retries-cannot-coexist-on-the-same-route' },
    { label: 'retryOn: 5xx Can Amplify Load Into an Already-Overloaded Upstream', route: '/service-mesh/traffic-management/retryon-5xx-can-amplify-load-into-an-already-overloaded-upstream' },
    { label: 'Mirroring Is Fire-and-Forget — the Primary Response Never Waits', route: '/service-mesh/traffic-management/mirroring-is-fire-and-forget-the-primary-response-never-waits' },
  ],
  'resilience': [
    { label: 'consecutiveLocalOriginFailures Needs splitExternalLocalOriginErrors to Work', route: '/service-mesh/resilience/consecutivelocaloriginfailures-needs-splitexternallocaloriginerrors-to-work' },
    { label: 'minHealthPercent Defaults to 0% (Disabled), Not 50%', route: '/service-mesh/resilience/minhealthpercent-defaults-to-0-percent-disabled-not-50-percent' },
    { label: 'A Service With No DestinationRule Still Has a 1024-Connection Cap', route: '/service-mesh/resilience/a-service-with-no-destinationrule-still-has-a-1024-connection-cap' },
  ],
  // NOTE: 'load-balancing' bare key already taken by the AWS hub's own load-balancing topic
  'mesh-load-balancing': [
    { label: 'warmupDurationSecs Starts New Pods at 10% Traffic, Not 0%', route: '/service-mesh/load-balancing/warmupdurationsecs-starts-new-pods-at-10-percent-not-0-percent' },
    { label: 'consistentHash Defaults to Ring Hash With a 1024-Node Ring', route: '/service-mesh/load-balancing/consistenthash-defaults-to-ring-hash-with-a-1024-node-ring' },
    { label: 'Active Health Checks Have No Native DestinationRule Field', route: '/service-mesh/load-balancing/active-health-checks-have-no-native-destinationrule-field' },
  ],
  'mtls': [
    { label: 'Probe Traffic Is Rewritten to Port 15020, Not Simply Exempted', route: '/service-mesh/mtls/probe-traffic-is-rewritten-to-port-15020-not-simply-exempted' },
    { label: 'Mesh-Wide PeerAuthentication Must Be Named default in the Root Namespace', route: '/service-mesh/mtls/mesh-wide-peerauthentication-must-be-named-default-in-the-root-ns' },
    { label: 'The CA Secret Is Named cacerts, Not istio-ca-secret', route: '/service-mesh/mtls/the-ca-secret-is-named-cacerts-not-istio-ca-secret' },
  ],
  'authorization': [
    { label: 'Empty Rules Array vs. One Empty Rule Are Opposite Behaviors', route: '/service-mesh/authorization/empty-rules-array-vs-one-empty-rule-are-opposite-behaviors' },
    { label: 'AuthorizationPolicy Has No Naming Requirement, Unlike PeerAuthentication', route: '/service-mesh/authorization/authorizationpolicy-has-no-naming-requirement-unlike-peerauthentication' },
    { label: 'CUSTOM Is a Fourth Action, Evaluated Before DENY and ALLOW', route: '/service-mesh/authorization/custom-is-a-fourth-action-evaluated-before-deny-and-allow' },
  ],
  'metrics': [
    { label: 'Grafana Dashboard IDs Were Mismatched With Their Actual Names', route: '/service-mesh/metrics/grafana-dashboard-ids-were-mismatched-with-their-actual-names' },
    { label: 'Telemetry API Scope Override Is Full Field Replacement, Not a Merge', route: '/service-mesh/metrics/telemetry-api-scope-override-is-full-field-replacement-not-merge' },
    { label: 'Histogram Bucket Boundaries Are Fixed and Cannot Be Customized', route: '/service-mesh/metrics/histogram-bucket-boundaries-are-fixed-and-cannot-be-customized' },
  ],
  'tracing': [
    { label: 'Telemetry API Sampling Wins Over meshConfig When Both Are Set', route: '/service-mesh/tracing/telemetry-api-sampling-wins-over-meshconfig-when-both-are-set' },
    { label: 'OpenTelemetry Provider Needs Istio 1.22+, Not 1.16+', route: '/service-mesh/tracing/opentelemetry-provider-needs-istio-1-22-not-1-16' },
    { label: 'Exemplars Are Defined by OpenMetrics, Not an IETF RFC', route: '/service-mesh/tracing/exemplars-are-defined-by-openmetrics-not-an-ietf-rfc' },
  ],
  'kiali': [
    { label: 'Envoy Config Viewer Queries Istiod, Not Prometheus', route: '/service-mesh/kiali/envoy-config-viewer-queries-istiod-not-prometheus' },
    { label: 'KIA0201 Is Duplicate DestinationRules, Not a Missing Subset', route: '/service-mesh/kiali/kia0201-is-duplicate-destinationrules-not-missing-subset' },
    { label: 'Animation Dot Speed Is Response Time, Density Is RPS', route: '/service-mesh/kiali/animation-dot-speed-is-response-time-density-is-rps' },
  ],
  'gateway-api': [
    { label: 'Specificity Beats Timestamp in HTTPRoute Conflict Resolution', route: '/service-mesh/gateway-api/specificity-beats-timestamp-in-httproute-conflict-resolution' },
    { label: 'ReferenceGrant Graduated to v1 — the Main Page Used the Older v1beta1', route: '/service-mesh/gateway-api/referencegrant-graduated-to-v1-main-page-uses-the-older-v1beta1' },
    { label: 'Check the Gateway’s Own Programmed Condition, Not Just the Route', route: '/service-mesh/gateway-api/check-the-gateways-own-programmed-condition-not-just-the-route' },
  ],
  'ingress-gateway': [
    { label: 'TLS Secret Must Match the Gateway’s Own Namespace, Not Always istio-system', route: '/service-mesh/ingress-gateway/tls-secret-must-match-the-gateways-own-namespace-not-always-istio-system' },
    { label: 'SNI Filter Chain Matching Is What Actually Selects the Right Cert', route: '/service-mesh/ingress-gateway/sni-filter-chain-matching-is-what-actually-selects-the-right-cert' },
    { label: 'REGISTRY_ONLY Blocks Traffic via a BlackHoleCluster 502, Not by Removing Routes', route: '/service-mesh/ingress-gateway/registry-only-blocks-traffic-via-a-blackholecluster-502-not-by-removing-routes' },
  ],
  // NOTE: 'performance' bare key already taken by the Node.js hub's own performance topic
  'mesh-performance': [
    { label: 'useRemoteAddress Is About Client IP Trust, Not HTTP/2 Performance', route: '/service-mesh/performance/useremoteaddress-is-about-client-ip-trust-not-http2-performance' },
    { label: 'Envoy Has No JIT Warmup — Only Optional WASM Filters Do', route: '/service-mesh/performance/envoy-has-no-jit-warmup-only-optional-wasm-filters-do' },
    { label: 'Memory Overhead Scales Per Service, Not Per 1000 Services', route: '/service-mesh/performance/memory-overhead-scales-per-service-not-per-1000-services' },
  ],
  'ambient-mesh': [
    { label: 'Ambient Mesh Reached GA at Istio 1.24, Not 1.22', route: '/service-mesh/ambient-mesh/ambient-mesh-reached-ga-at-istio-1-24-not-1-22' },
    { label: 'Default Redirection Is iptables+GENEVE, Not eBPF', route: '/service-mesh/ambient-mesh/default-redirection-is-iptables-geneve-not-ebpf' },
    { label: 'HBONE Identity Comes From the mTLS Handshake, Not HTTP Headers', route: '/service-mesh/ambient-mesh/hbone-identity-comes-from-the-mtls-handshake-not-http-headers' },
  ],
  'multi-cluster': [
    { label: 'Multi-Primary Discovery Is Independent API Watching, Not a Peer Protocol', route: '/service-mesh/multi-cluster/multi-primary-discovery-is-independent-api-watching-not-a-peer-protocol' },
    { label: 'remotePilotAddress Belongs to Primary-Remote, Not Multi-Primary', route: '/service-mesh/multi-cluster/remotepilotaddress-belongs-to-primary-remote-not-multi-primary' },
    { label: 'Kiali Multi-Cluster Support Predates 1.73 by Years', route: '/service-mesh/multi-cluster/kiali-multi-cluster-support-predates-1-73-by-years' },
  ],
  'consul': [
    { label: 'Consul Certs Are Genuinely SPIFFE-Format, Not a Separate Identity Model', route: '/service-mesh/consul/consul-certs-are-genuinely-spiffe-format-not-a-separate-identity-model' },
    { label: 'Leaf Cert Rotation Is a 60–90% Window, Not a Fixed 60%', route: '/service-mesh/consul/leaf-cert-rotation-is-a-60-90-percent-window-not-a-fixed-60-percent' },
    { label: 'Peered Service DNS Names Include the Peer’s Own Name as a Segment', route: '/service-mesh/consul/peered-service-dns-names-include-the-peers-own-name-as-a-segment' },
  ],
  'framework': [
    { label: 'SSD Random Read Is 150 Microseconds, Not 100', route: '/system-design/framework/ssd-random-read-is-150-microseconds-not-100' },
    { label: 'Size for Peak QPS, Not Average QPS', route: '/system-design/framework/size-for-peak-qps-not-average-qps' },
    { label: 'Little’s Law Turns QPS Into Concurrent Connections Needed', route: '/system-design/framework/littles-law-turns-qps-into-concurrent-connections-needed' },
  ],
  'capacity-estimation': [
    { label: 'SSD Is ~65x Faster Than HDD Seek, Not 1,000x', route: '/system-design/capacity-estimation/ssd-is-65x-faster-than-hdd-seek-not-1000x' },
    { label: 'Redis GET Latency Is Network RTT, Not an Extra 1ms', route: '/system-design/capacity-estimation/redis-get-latency-is-network-rtt-not-an-extra-1ms' },
    { label: 'Decimal Vendor GB vs. Binary OS GiB Diverge by ~7%', route: '/system-design/capacity-estimation/decimal-vendor-gb-vs-binary-os-gib-diverge-by-7-percent' },
  ],
  'cap-theorem': [
    { label: 'The Quorum Quiz Had a Second Technically-Correct Answer', route: '/system-design/cap-theorem/the-quorum-quiz-had-a-second-technically-correct-answer' },
    { label: 'Sequential Consistency Orders ALL Operations, Not Just Writes', route: '/system-design/cap-theorem/sequential-consistency-orders-all-ops-not-just-writes' },
    { label: 'Brewer Conjectured CAP in 2000 — Gilbert & Lynch Proved It in 2002', route: '/system-design/cap-theorem/brewer-conjectured-cap-in-2000-gilbert-lynch-proved-it-in-2002' },
  ],
  // NOTE: bare 'networking' key already taken by the Linux hub's own networking topic
  'sysdesign-networking': [
    { label: 'EDNS0 Raises the DNS UDP Limit Past the Legacy 512 Bytes', route: '/system-design/networking/ednso-raises-dns-udp-limit-past-the-legacy-512-bytes' },
    { label: 'TCP Teardown: TIME_WAIT Can Exhaust Ephemeral Ports', route: '/system-design/networking/tcp-teardown-time-wait-can-exhaust-ephemeral-ports' },
    { label: 'Stale-While-Revalidate Exists to Stop Cache Stampedes', route: '/system-design/networking/stale-while-revalidate-exists-to-stop-cache-stampedes' },
  ],
  'scaling': [
    { label: 'The Largest AWS Instance Figure Was Stale — u7in-32tb Is Current', route: '/system-design/scaling/the-largest-aws-instance-figure-was-stale-u7in-32tb-is-current' },
    { label: 'Gustafson’s Law Is Amdahl’s Optimistic Counterpart', route: '/system-design/scaling/gustafsons-law-is-amdahls-optimistic-counterpart' },
    { label: 'Firecracker MicroVMs Boot in ~125ms, Not Minutes', route: '/system-design/scaling/firecracker-microvms-boot-in-125ms-not-minutes' },
  ],
  // NOTE: bare 'load-balancing' key already taken by the AWS hub's own load-balancing topic
  'sysdesign-load-balancing': [
    { label: 'ALB’s Default Deregistration Delay Is 300 Seconds, Not 60', route: '/system-design/load-balancing/albs-default-deregistration-delay-is-300-seconds-not-60' },
    { label: 'VRRP Failover Takes About 3 Seconds by Default, Not Under 2', route: '/system-design/load-balancing/vrrp-failover-takes-about-3-seconds-by-default-not-under-2' },
    { label: 'Why Power of Two Choices Beats Picking One Random Server', route: '/system-design/load-balancing/why-power-of-two-choices-beats-picking-one-random-server' },
  ],
  // NOTE: bare 'caching' key already taken by the Web Performance hub's own topic
  'sysdesign-caching': [
    { label: 'Redis Defaults to noeviction, Not LRU', route: '/system-design/caching/redis-defaults-to-noeviction-not-lru' },
    { label: 'The Multi-Level Cache Example Never Invalidates L1', route: '/system-design/caching/the-multi-level-cache-example-never-invalidates-l1' },
    { label: 'The PER Code Is Missing XFetch’s Recompute-Cost Signal', route: '/system-design/caching/the-per-code-is-missing-xfetchs-recompute-cost-signal' },
  ],
  'cdn': [
    { label: 'Cloudflare’s 100+ Tbps Figure Was Stale, Now 500+', route: '/system-design/cdn/cloudflares-100-tbps-figure-is-stale-network-passed-500' },
    { label: 'Anycast Failover Takes BGP Convergence Time, Not Instant', route: '/system-design/cdn/anycast-failover-takes-bgp-convergence-time-not-instant' },
    { label: 'Raw Vary: Cookie Fragments the Cache — Normalize It Instead', route: '/system-design/cdn/raw-vary-cookie-fragments-the-cache-normalize-it-instead' },
  ],
  'sharding': [
    { label: 'The 64 TB / 100k TPS Figures Are RDS Limits, Not PostgreSQL Itself', route: '/system-design/sharding/the-64tb-100k-tps-figures-are-rds-limits-not-postgresql-itself' },
    { label: 'Naive Double-Write Resharding Is Risky — Vitess Uses CDC Instead', route: '/system-design/sharding/naive-double-write-resharding-is-risky-vitess-uses-cdc-instead' },
    { label: 'Why Basic Consistent Hashing Still Needs Virtual Nodes', route: '/system-design/sharding/why-basic-consistent-hashing-still-needs-virtual-nodes' },
  ],
  'sql-vs-nosql': [
    { label: 'Isolation as Taught Describes Serializable, Not the Default', route: '/system-design/sql-vs-nosql/isolation-as-taught-describes-serializable-not-the-default' },
    { label: 'MongoDB Sharded-Cluster Transactions Arrived in 4.2, Not 4.0', route: '/system-design/sql-vs-nosql/mongodb-sharded-cluster-transactions-arrived-in-42-not-40' },
    { label: 'DynamoDB Scales Automatically, But One Partition Still Has a Ceiling', route: '/system-design/sql-vs-nosql/dynamodb-scales-automatically-but-one-partition-still-has-a-ceiling' },
  ],
  'replication': [
    { label: 'PostgreSQL’s synchronous_standby_names Needs a Quoted Name', route: '/system-design/replication/postgresqls-synchronous-standby-names-needs-a-quoted-name' },
    { label: 'Quorum (W+R greater than N) Guarantees Overlap, Not True Linearizability', route: '/system-design/replication/quorum-w-plus-r-over-n-guarantees-overlap-not-linearizability' },
    { label: 'DynamoDB Isn’t Tunable Like Cassandra — It’s a Binary Choice', route: '/system-design/replication/dynamodb-isnt-tunable-like-cassandra-its-a-binary-choice' },
  ],
  // NOTE: bare 'indexes' key already taken by the SQL hub's own indexes topic
  'sysdesign-indexes': [
    { label: 'MySQL InnoDB Auto-Creates the FK Index — It Doesn’t Just Warn', route: '/system-design/indexes/mysql-innodb-auto-creates-the-fk-index-it-doesnt-just-warn' },
    { label: 'REINDEX CONCURRENTLY Avoids Write Locks, But Isn’t Fully Lock-Free', route: '/system-design/indexes/reindex-concurrently-avoids-write-locks-but-isnt-fully-lock-free' },
    { label: 'The Full Rule Is Equality-Sort-Range, Not Just Equality-Then-Range', route: '/system-design/indexes/the-full-rule-is-equality-sort-range-not-just-equality-then-range' },
  ],
  'distributed-transactions': [
    { label: 'The Idempotency Key Example Used Date.now(), Defeating Retries', route: '/system-design/distributed-transactions/the-idempotency-key-example-used-date-now-defeating-retries' },
    { label: 'Kafka Offset-Committing Is Specific to Consume-Transform-Produce', route: '/system-design/distributed-transactions/kafka-offset-committing-is-specific-to-consume-transform-produce' },
    { label: 'TCC’s Timeout Recovery Still Needs a Transaction Manager', route: '/system-design/distributed-transactions/tccs-timeout-recovery-still-needs-a-transaction-manager' },
  ],
  'high-availability': [
    { label: 'RDS Multi-AZ DB Clusters Fail Over in Under 35 Seconds', route: '/system-design/high-availability/rds-multi-az-db-clusters-fail-over-in-under-35-seconds-not-just-60-120' },
    { label: 'Request-Based and Time-Based Error Budgets Aren’t the Same Thing', route: '/system-design/high-availability/request-based-and-time-based-error-budgets-arent-the-same-thing' },
    { label: 'Active-Active’s Instant Failover Still Waits on Health-Check Detection', route: '/system-design/high-availability/active-actives-instant-failover-still-waits-on-health-check-detection' },
  ],
  'fault-tolerance': [
    { label: 'The Rate Limiter Was Configured for 600/min, Not 10/min', route: '/system-design/fault-tolerance/rate-limiter-unit-bug-per-second-not-per-minute' },
    { label: 'The Fraud-Check Timeout Breaks the Page’s Own 2-3x Rule', route: '/system-design/fault-tolerance/fraud-timeout-breaks-the-pages-own-2-3x-rule' },
    { label: 'PUT Is Idempotent by Definition — It Doesn’t Need a Key', route: '/system-design/fault-tolerance/put-is-idempotent-by-definition-no-key-needed' },
  ],
  'distributed-tracing': [
    { label: 'The Tail-Based Sampling Example Was Actually Head-Based', route: '/system-design/distributed-tracing/tail-sampling-example-was-actually-head-based' },
    { label: 'Jaeger No Longer Needs the OTel Collector for Basic Setups', route: '/system-design/distributed-tracing/jaeger-no-longer-needs-the-otel-collector' },
    { label: 'Tempo’s No-Indexing Claim Needs a TraceQL Caveat', route: '/system-design/distributed-tracing/tempos-no-indexing-claim-needs-a-traceql-caveat' },
  ],
  'disaster-recovery': [
    { label: 'RDS PITR’s 5-Minute Window Claim Confuses Granularity With Recency', route: '/system-design/disaster-recovery/pitr-5-min-window-confuses-granularity-with-recency-lag' },
    { label: 'RDS Multi-AZ DB Clusters Apply Here Too', route: '/system-design/disaster-recovery/rds-multi-az-db-clusters-apply-here-too' },
    { label: 'Why Aurora Global Beats a Plain Cross-Region Replica', route: '/system-design/disaster-recovery/why-aurora-global-beats-a-plain-cross-region-replica' },
  ],
  'url-shortener': [
    { label: 'The Collision-Probability Formula Is Near-Certain, Not Negligible', route: '/system-design/url-shortener/collision-probability-is-near-certain-not-negligible' },
    { label: 'The Quiz Answer Was the Mistakes Block’s Own Anti-Pattern', route: '/system-design/url-shortener/quiz-answer-was-the-mistakes-blocks-own-anti-pattern' },
    { label: 'The Read-QPS Comment Didn’t Match Its Own Formula', route: '/system-design/url-shortener/read-qps-comment-didnt-match-its-own-formula' },
  ],
  'social-feed': [
    { label: 'The Redis ZSET Memory Estimate Ignored Skiplist Overhead', route: '/system-design/social-feed/redis-zset-memory-estimate-ignored-skiplist-overhead' },
    { label: 'Active-User Count Mismatch: 500M vs. 100M DAU', route: '/system-design/social-feed/active-user-count-mismatch-500m-vs-100m-dau' },
    { label: 'Feed Read Code Still Joined What Denormalization Was For', route: '/system-design/social-feed/feed-read-code-still-joined-what-denorm-was-for' },
  ],
  'chat-application': [
    { label: 'WebSocket Map Silently Drops First Device on Multi-Login', route: '/system-design/chat-application/websocket-map-silently-drops-first-device-on-multi-login' },
    { label: '‘Exactly-Once Delivery’ Contradicts the Page’s Own At-Least-Once Theory', route: '/system-design/chat-application/exactly-once-contradicts-at-least-once-theory' },
    { label: 'E2E Encryption Hint Skipped the Double Ratchet', route: '/system-design/chat-application/e2e-encryption-hint-skipped-the-double-ratchet' },
  ],
  'search-engine': [
    { label: '30 Shards Doesn’t Divide to 33M Docs Per Shard', route: '/system-design/search-engine/shard-doc-count-mismatch' },
    { label: 'Elasticsearch’s Default Shard Count Has Been 1, Not 5, Since 7.0', route: '/system-design/search-engine/es-default-shard-count-stale' },
    { label: 'The Split API Resizes Shards Without a Full Reindex', route: '/system-design/search-engine/split-api-faster-than-reindex' },
  ],
  'payment-system': [
    { label: 'Ledger Worked Example’s Fee Split Contradicted the Code Sample', route: '/system-design/payment-system/ledger-example-fee-mismatch' },
    { label: 'Sorting IDs Doesn’t Guarantee Lock Order Without ORDER BY', route: '/system-design/payment-system/for-update-needs-order-by' },
    { label: 'The Transfer Solution Used the Race Condition Its Own Quiz Warns About', route: '/system-design/payment-system/transfer-idempotency-check-then-act' },
  ],
  'video-streaming': [
    { label: 'Stale CDN Capacity Figure, Already Corrected on a Sibling Page', route: '/system-design/video-streaming/stale-cdn-capacity-figure' },
    { label: 'A “300 PB/Month” Figure That Was Actually Per Day', route: '/system-design/video-streaming/pb-per-month-was-actually-per-day' },
    { label: 'Compute Formula Used 4 Resolutions, Ladder Lists 6', route: '/system-design/video-streaming/resolution-count-mismatch' },
  ],
  'ai-ml-system-design': [
    { label: 'RAG Pipeline Used the OpenAI SDK With a Claude Model Name', route: '/system-design/ai-ml-system-design/openai-sdk-with-claude-model' },
    { label: 'Challenge Hint Said “LLM 2-4s”, Solution’s Own P50 Was 1.5s', route: '/system-design/ai-ml-system-design/latency-hint-vs-actual-p50' },
    { label: 'Naive Serving: “1 Request/Sec” vs “15 Tokens/Sec” Don’t Reconcile', route: '/system-design/ai-ml-system-design/naive-serving-units-mismatch' },
  ],
  'monolith-vs-modular': [
    { label: 'Team-Size Thresholds Disagreed by 5-10 Engineers', route: '/arch-patterns/monolith-vs-modular/team-size-threshold-contradiction' },
    { label: 'SharedKernel’s Own ProductId Type Was Never Actually Used', route: '/arch-patterns/monolith-vs-modular/sharedkernel-productid-never-used' },
    { label: 'The Modular Monolith’s Unstated Tradeoff: One Process, One Failure Domain', route: '/arch-patterns/monolith-vs-modular/shared-process-shared-failure-domain' },
  ],
  'layered-architecture': [
    { label: 'Three Sections Said DIP, One Section Said N-Tier', route: '/arch-patterns/layered-architecture/dip-vs-ntier-contradiction' },
    { label: 'The Solution’s PlaceOrderHandler Never Declared Its Own repo Field', route: '/arch-patterns/layered-architecture/handler-repo-field-never-declared' },
    { label: 'Why “Read-Only” Is the Safe Case for Skipping a Layer', route: '/arch-patterns/layered-architecture/why-reads-are-the-safe-skip-case' },
  ],
  // NOTE: hub-prefixed even though no CURRENT collision exists in this map --
  // the Design Patterns hub has its own /design-patterns/clean-architecture
  // topic using the identical bare slug 'clean-architecture'; DpNavComponent
  // doesn't call subtopicsOf() yet (no Phase 10 rollout there), but a bare
  // key here would leak these Architecture-Patterns subtopics into that
  // hub's own clean-architecture page the moment it gets its own accordion.
  'arch-clean-architecture': [
    { label: 'The mustKnow Ring Order Was Labeled Backwards', route: '/arch-patterns/clean-architecture/mustknow-ring-order-mislabeled' },
    { label: 'The Controller Skipped Its Own Presenter', route: '/arch-patterns/clean-architecture/controller-skipped-the-presenter' },
    { label: 'The OutputPort Pattern: One Use Case, Multiple Presenters', route: '/arch-patterns/clean-architecture/one-usecase-multiple-presenters' },
  ],
  'hexagonal-architecture': [
    { label: 'The Challenge Referenced Two Types It Never Defined', route: '/arch-patterns/hexagonal-architecture/challenge-referenced-undefined-types' },
    { label: 'The Hexagon-Shape Explanation Was Half the Story', route: '/arch-patterns/hexagonal-architecture/hexagon-shape-explanation-incomplete' },
    { label: 'The Solution Named a Real Adapter It Never Actually Used', route: '/arch-patterns/hexagonal-architecture/challenge-solution-missing-real-adapter' },
  ],
  'vertical-slice': [
    { label: 'MediatR Went Commercial in July 2025', route: '/arch-patterns/vertical-slice/mediatr-went-commercial-2025' },
    { label: 'Source-Generator Mediators: A Different Technical Tradeoff', route: '/arch-patterns/vertical-slice/source-generator-mediator-alternatives' },
    { label: 'The Rule of Three for Cross-Slice Duplication', route: '/arch-patterns/vertical-slice/rule-of-three-for-slice-duplication' },
  ],
  // 'service-oriented' confirmed collision-free via app.routes.ts grep before adding
  'service-oriented': [
    { label: 'Smart Endpoints, Dumb Pipes Was Reversed', route: '/arch-patterns/service-oriented/smart-endpoints-dumb-pipes-was-reversed' },
    { label: 'The SOA Done Right Quote Has No Real Source', route: '/arch-patterns/service-oriented/soa-done-right-quote-unattributable' },
    { label: 'The Tolerant Reader Pattern', route: '/arch-patterns/service-oriented/tolerant-reader-pattern-for-contracts' },
  ],
  // 'microservices-principles' confirmed collision-free via app.routes.ts grep before adding
  'microservices-principles': [
    { label: 'The Decentralised-Data Example Referenced an Undefined Type', route: '/arch-patterns/microservices-principles/decentralised-data-example-undefined-type' },
    { label: 'Why Chatty Nanoservices Actually Get Slow', route: '/arch-patterns/microservices-principles/why-chatty-nanoservices-actually-get-slow' },
    { label: 'Consumer-Driven Contract Testing in Practice', route: '/arch-patterns/microservices-principles/consumer-driven-contract-testing-in-practice' },
  ],
  // 'service-communication' confirmed collision-free via app.routes.ts grep before adding
  'service-communication': [
    { label: 'The gRPC Size Claim Was Overprecise', route: '/arch-patterns/service-communication/grpc-size-claim-was-overprecise' },
    { label: 'How the Outbox Pattern Actually Works', route: '/arch-patterns/service-communication/how-the-outbox-pattern-actually-works' },
    { label: 'Why Browsers Cannot Call gRPC Directly', route: '/arch-patterns/service-communication/why-browsers-cannot-call-grpc-directly' },
  ],
  // 'api-gateway-pattern' confirmed collision-free via app.routes.ts grep before adding
  'api-gateway-pattern': [
    { label: 'Promise.all Hid an Accidental Fail-Fast Choice', route: '/arch-patterns/api-gateway-pattern/promise-all-hid-an-accidental-fail-fast-choice' },
    { label: 'The Boundary Burst Problem in Fixed-Window Rate Limiting', route: '/arch-patterns/api-gateway-pattern/fixed-window-rate-limiting-boundary-burst' },
    { label: 'How mTLS Makes the Forwarded-Identity Header Trustworthy', route: '/arch-patterns/api-gateway-pattern/mtls-makes-forwarded-identity-trustworthy' },
  ],
  // 'service-discovery' confirmed collision-free via app.routes.ts grep before adding
  'service-discovery': [
    { label: 'The Registry\'s register() Was Not Idempotent', route: '/arch-patterns/service-discovery/registry-register-was-not-idempotent' },
    { label: 'The Cache Never Actually Refreshed in the Background', route: '/arch-patterns/service-discovery/cache-never-refreshed-in-background' },
    { label: 'Why Long-Lived Connections Can Outlive a Dead Pod', route: '/arch-patterns/service-discovery/long-lived-connections-outlive-dead-pods' },
  ],
  // 'circuit-breaker' confirmed collision-free via app.routes.ts grep before adding
  'circuit-breaker': [
    { label: 'halfOpenMaxCalls Was Never Actually Used', route: '/arch-patterns/circuit-breaker/half-open-max-calls-was-never-used' },
    { label: 'The Polly Example Had the Strategy Order Backwards', route: '/arch-patterns/circuit-breaker/polly-strategy-order-was-backwards' },
    { label: 'Making the Bulkhead Pattern Concrete', route: '/arch-patterns/circuit-breaker/bulkhead-pattern-made-concrete' },
  ],
  // 'sidecar-service-mesh' confirmed collision-free via app.routes.ts grep before adding
  'sidecar-service-mesh': [
    { label: 'Three Different Latency Figures, Reconciled', route: '/arch-patterns/sidecar-service-mesh/three-different-latency-figures-reconciled' },
    { label: 'Ambient Mesh\'s GA Version Was Off By One Release', route: '/arch-patterns/sidecar-service-mesh/ambient-mesh-ga-version-was-off-by-one-release' },
    { label: 'The Retry Latency Math Undercounted By One Try', route: '/arch-patterns/sidecar-service-mesh/retry-latency-math-undercounted-by-one-try' },
  ],
  // 'event-driven' confirmed collision-free via app.routes.ts grep before adding
  'event-driven': [
    { label: 'The Broker Stub Was Secretly Blocking', route: '/arch-patterns/event-driven/broker-stub-was-secretly-blocking' },
    { label: 'The DB Save Was Commented Out', route: '/arch-patterns/event-driven/db-save-was-commented-out' },
    { label: 'The Fat-Events Staleness Risk, Made Concrete', route: '/arch-patterns/event-driven/fat-events-staleness-risk-made-concrete' },
  ],
  // 'cqrs-event-sourcing' confirmed collision-free via app.routes.ts grep before adding
  'cqrs-event-sourcing': [
    { label: 'Snapshots Referenced Six Undefined Methods', route: '/arch-patterns/cqrs-event-sourcing/snapshots-referenced-six-undefined-methods' },
    { label: 'Optimistic UI Updates, Made Concrete', route: '/arch-patterns/cqrs-event-sourcing/optimistic-ui-updates-made-concrete' },
    { label: 'What an Upcaster Actually Looks Like', route: '/arch-patterns/cqrs-event-sourcing/what-an-upcaster-actually-looks-like' },
  ],
  // 'saga-choreography' confirmed collision-free via app.routes.ts grep before adding
  'saga-choreography': [
    { label: 'Choreography Never Handled Stock Failure', route: '/arch-patterns/saga-choreography/choreography-never-handled-stock-failure' },
    { label: 'The Durable Saga Dropped Its Own Compensation', route: '/arch-patterns/saga-choreography/durable-saga-dropped-compensation-logic' },
    { label: 'The Semantic Lock Counter-Measure, Made Concrete', route: '/arch-patterns/saga-choreography/semantic-lock-countermeasure-made-concrete' },
  ],
  // 'inbox-outbox' confirmed collision-free via app.routes.ts grep before adding
  'inbox-outbox': [
    { label: 'The Relay Lock Was Released Before Publishing', route: '/arch-patterns/inbox-outbox/relay-lock-was-released-before-publishing' },
    { label: 'The Inbox Upsert Was Invalid SQL', route: '/arch-patterns/inbox-outbox/inbox-upsert-was-invalid-sql' },
    { label: 'The Inbox Table Needs Cleanup Too', route: '/arch-patterns/inbox-outbox/inbox-table-needs-cleanup-too' },
  ],
  // 'ddd-core' confirmed collision-free via app.routes.ts grep before adding
  'ddd-core': [
    { label: 'TransferFunds Never Handled Partial Save Failure', route: '/arch-patterns/ddd-core/transfer-funds-never-handled-partial-save-failure' },
    { label: 'What a DDD Factory Actually Looks Like', route: '/arch-patterns/ddd-core/what-a-ddd-factory-actually-looks-like' },
    { label: 'What a DDD Repository Actually Looks Like', route: '/arch-patterns/ddd-core/what-a-ddd-repository-actually-looks-like' },
  ],
  'bounded-contexts': [
    { label: 'Order-Catalog Is ACL, Not Customer/Supplier', route: '/arch-patterns/bounded-contexts/order-catalog-is-acl-not-customer-supplier' },
    { label: 'Event Publisher: Mechanism vs. Relationship', route: '/arch-patterns/bounded-contexts/event-publisher-mechanism-vs-relationship' },
    { label: 'Published Language Prevents ACL Sprawl', route: '/arch-patterns/bounded-contexts/published-language-prevents-acl-sprawl' },
  ],
  'aggregates-domain-events': [
    { label: 'PlaceOrderHandler Referenced an Undeclared catalogService', route: '/arch-patterns/aggregates-domain-events/place-order-handler-referenced-undeclared-catalog-service' },
    { label: 'The Save-Then-Publish CodeTab Has a Dual-Write Bug', route: '/arch-patterns/aggregates-domain-events/save-then-publish-has-a-dual-write-bug' },
    { label: 'Fixing It With the Outbox Pattern', route: '/arch-patterns/aggregates-domain-events/fixing-it-with-the-outbox-pattern' },
  ],
  'anti-corruption-layer': [
    { label: 'LegacyErpAdapter Referenced an Undeclared erpClient', route: '/arch-patterns/anti-corruption-layer/legacy-erp-adapter-referenced-undeclared-erp-client' },
    { label: 'The Missing IPaymentGateway Interface', route: '/arch-patterns/anti-corruption-layer/the-missing-ipaymentgateway-interface' },
    { label: 'Splitting Call and Translate Lets Stripe Leak Back In', route: '/arch-patterns/anti-corruption-layer/splitting-call-and-translate-lets-stripe-leak-back-in' },
  ],
  'strangler-fig': [
    { label: 'Feature-Flag Comment Named the Wrong Migrated Feature', route: '/arch-patterns/strangler-fig/feature-flag-comment-named-the-wrong-migrated-feature' },
    { label: 'Parallel Run Skipped Its Own Discrepancy Check', route: '/arch-patterns/strangler-fig/parallel-run-skipped-its-own-discrepancy-check' },
    { label: 'The Split-Brain Risk Made Concrete', route: '/arch-patterns/strangler-fig/the-split-brain-risk-made-concrete' },
  ],
  'backend-for-frontend': [
    { label: 'GraphQL BFF’s N+1 Problem, Made Concrete', route: '/arch-patterns/backend-for-frontend/graphql-bff-n-plus-one-problem-made-concrete' },
    { label: 'Is hasBreakingNews Business Logic in the BFF?', route: '/arch-patterns/backend-for-frontend/is-has-breaking-news-business-logic-in-the-bff' },
    { label: 'What the v2 Migration Actually Looks Like', route: '/arch-patterns/backend-for-frontend/what-the-v2-migration-actually-looks-like' },
  ],
  'singleton': [
    { label: 'Sealed Does Not Fix What the Mistake Said It Fixes', route: '/design-patterns/singleton/sealed-does-not-fix-what-the-mistake-said-it-fixes' },
    { label: 'Double-Checked Locking, Actually Written Out', route: '/design-patterns/singleton/double-checked-locking-actually-written-out' },
    { label: 'What Monostate Actually Looks Like in Code', route: '/design-patterns/singleton/what-monostate-actually-looks-like-in-code' },
  ],
  'factory-method': [
    { label: 'DI Approach Referenced an Undefined PushNotification Class', route: '/design-patterns/factory-method/di-approach-referenced-an-undefined-push-notification-class' },
    { label: 'Backticks Are Not C#', route: '/design-patterns/factory-method/backticks-are-not-c-sharp' },
    { label: 'Does the channel Switch Really Decouple Which Factory?', route: '/design-patterns/factory-method/does-the-channel-switch-really-decouple-which-factory' },
  ],
  'abstract-factory': [
    { label: 'What Versioning the Factory Interface Actually Looks Like', route: '/design-patterns/abstract-factory/what-versioning-the-factory-interface-actually-looks-like' },
    { label: 'A Registry-Based Factory Selector, Made Concrete', route: '/design-patterns/abstract-factory/a-registry-based-factory-selector-made-concrete' },
    { label: 'Using Abstract Factory for Test Doubles', route: '/design-patterns/abstract-factory/using-abstract-factory-for-test-doubles' },
  ],
  'builder': [
    { label: 'The Director Used Backticks Instead of C# Interpolation', route: '/design-patterns/builder/the-director-used-backticks-instead-of-c-sharp-interpolation' },
    { label: 'The Wrong Example Was a Compile Error, Not a Design Smell', route: '/design-patterns/builder/the-wrong-example-was-a-compile-error-not-a-design-smell' },
    { label: 'What a Test Data Builder Actually Looks Like', route: '/design-patterns/builder/what-a-test-data-builder-actually-looks-like' },
  ],
  'prototype': [
    { label: 'Polymorphic Cloning via IPrototype', route: '/design-patterns/prototype/polymorphic-cloning-via-iprototype' },
    { label: 'Why Immutable Sub-Objects Make Shallow Copy Safe', route: '/design-patterns/prototype/why-immutable-sub-objects-make-shallow-copy-safe' },
    { label: 'Is with Prototype, or an Alternative to It?', route: '/design-patterns/prototype/is-with-prototype-or-an-alternative-to-it' },
  ],
  'object-pool': [
    { label: 'The Count-Check Race Condition', route: '/design-patterns/object-pool/count-check-race-condition' },
    { label: 'Implementing Idle-Object Eviction', route: '/design-patterns/object-pool/idle-object-eviction' },
    { label: 'ConcurrentBag vs. ConcurrentQueue for Pool Storage', route: '/design-patterns/object-pool/concurrentbag-vs-concurrentqueue' },
  ],
  'adapter': [
    { label: 'The ProcessPayment One-Liner Doesn’t Compile', route: '/design-patterns/adapter/processpayment-void-compile-error' },
    { label: 'The Missing LogLevel Mappings', route: '/design-patterns/adapter/missing-loglevel-mappings' },
    { label: 'IObservable vs. IQueryable: Which One Really Needs an Adapter', route: '/design-patterns/adapter/iobservable-vs-iqueryable-real-adapter-need' },
  ],
  'bridge': [
    { label: 'Does ILogger Really Fit the Bridge Shape?', route: '/design-patterns/bridge/does-ilogger-really-fit-the-bridge-shape' },
    { label: 'Bridge vs. Strategy: Which Side Actually Grows?', route: '/design-patterns/bridge/bridge-vs-strategy-which-side-grows' },
    { label: 'Bridge Wrapping an Adapter: A ConcreteImplementor for a Legacy System', route: '/design-patterns/bridge/bridge-wrapping-an-adapter' },
  ],
  'composite': [
    { label: 'Does System.IO’s FileSystemInfo Really Give You Composite?', route: '/design-patterns/composite/does-filesysteminfo-really-give-you-composite' },
    { label: 'What the Transparency Design Actually Looks Like', route: '/design-patterns/composite/the-transparency-design-made-concrete' },
    { label: 'Composite Plus Visitor, Made Concrete', route: '/design-patterns/composite/composite-plus-visitor-made-concrete' },
  ],
  'decorator': [
    { label: 'Castle DynamicProxy vs. PostSharp: Which One Is Actually Decorator?', route: '/design-patterns/decorator/castle-dynamicproxy-vs-postsharp' },
    { label: 'When Decorator Breaks Object Identity', route: '/design-patterns/decorator/when-decorator-breaks-object-identity' },
    { label: 'Removing One Decorator from the Middle of the Stack', route: '/design-patterns/decorator/removing-one-decorator-from-the-middle' },
  ],
  'facade': [
    { label: 'The Missing Rollback on Partial Checkout Failure', route: '/design-patterns/facade/the-missing-rollback-on-partial-checkout-failure' },
    { label: 'Facade vs. Mediator, Made Concrete', route: '/design-patterns/facade/facade-vs-mediator-made-concrete' },
    { label: 'The API Gateway: A Network-Boundary Facade', route: '/design-patterns/facade/api-gateway-a-network-boundary-facade' },
  ],
  'flyweight': [
    { label: 'Why .NET Has No Small-Integer Boxing Cache', route: '/design-patterns/flyweight/no-small-integer-boxing-cache-in-dotnet' },
    { label: 'The Race in ParticleFactory.Get() Under Concurrent Access', route: '/design-patterns/flyweight/the-race-in-particlefactory-get' },
    { label: 'When Flyweight Identity Silently Merges Logically Distinct Objects', route: '/design-patterns/flyweight/when-flyweight-identity-merges-distinct-objects' },
  ],
  // NOTE: hub-prefixed — bare 'proxy' is already claimed by the JavaScript hub's own /javascript/proxy topic
  'dp-proxy': [
    { label: 'LoggingOrderProxy Isn’t a Proxy — It’s a Decorator', route: '/design-patterns/proxy/loggingorderproxy-isnt-a-proxy-its-a-decorator' },
    { label: 'GetOrCreateAsync Silently Caches null', route: '/design-patterns/proxy/getorcreateasync-silently-caches-null' },
    { label: 'Smart Reference: GoF’s Actual Fourth Proxy Type', route: '/design-patterns/proxy/smart-reference-gofs-actual-fourth-type' },
  ],
  'chain-of-responsibility': [
    { label: 'The Auth Middleware’s Operator-Precedence Bug', route: '/design-patterns/chain-of-responsibility/auth-middleware-operator-precedence-bug' },
    { label: 'The Pass-Through-With-Side-Effect Handler, Made Concrete', route: '/design-patterns/chain-of-responsibility/pass-through-with-side-effect-handler' },
    { label: 'Making “No Handler Accepted This” a Real Signal', route: '/design-patterns/chain-of-responsibility/making-unhandled-a-real-signal' },
  ],
  'command': [
    { label: 'Redo() Silently Wipes the Rest of the Redo Stack', route: '/design-patterns/command/redo-silently-wipes-the-redo-stack' },
    { label: 'A Real MacroCommand, Undone in Reverse Order', route: '/design-patterns/command/a-real-macrocommand-undone-in-reverse' },
    { label: 'When a Lambda Command Stops Being Enough', route: '/design-patterns/command/when-a-lambda-command-stops-being-enough' },
  ],
  'iterator': [
    { label: 'The Recursive-Yield Tree Traversal Is Secretly O(n²)', route: '/design-patterns/iterator/recursive-yield-tree-traversal-is-on-squared' },
    { label: 'Merging Two External Iterators, Made Concrete', route: '/design-patterns/iterator/merging-two-external-iterators' },
    { label: 'What Happens When Range’s step Is Negative', route: '/design-patterns/iterator/what-happens-when-range-step-is-negative' },
  ],
  'mediator': [
    { label: 'MediatR’s 2025 Commercial License Change', route: '/design-patterns/mediator/mediatr-2025-license-change' },
    { label: 'Publish() Stops on the First Handler Exception', route: '/design-patterns/mediator/publish-exception-halts-later-handlers' },
    { label: 'Pipeline Behavior Execution Order', route: '/design-patterns/mediator/pipeline-behavior-order' },
  ],
  'memento': [
    { label: 'AsReadOnly() Is a View, Not a Copy', route: '/design-patterns/memento/asreadonly-is-a-view-not-a-copy' },
    { label: 'A Real Nested-Class Memento', route: '/design-patterns/memento/nested-class-memento-narrow-interface' },
    { label: 'Delta Mementos: Storing Only What Changed', route: '/design-patterns/memento/delta-mementos-storing-only-what-changed' },
  ],
  'observer': [
    { label: 'Field-Like Events Are Already Thread-Safe', route: '/design-patterns/observer/field-like-events-are-already-thread-safe' },
    { label: 'A Real IObservable<T> Implementation', route: '/design-patterns/observer/a-real-iobservable-implementation' },
    { label: 'What a WeakReference-Based Observer Looks Like', route: '/design-patterns/observer/weakreference-based-observer-implementation' },
  ],
  // NOTE: keyed 'dp-state', NOT bare 'state' — the Terraform hub
  // already claims the bare key with its own subtopics.
  'dp-state': [
    { label: 'Singleton States: Making Them Actually Stateless', route: '/design-patterns/state/singleton-states-making-them-actually-stateless' },
    { label: 'A Data-Driven State Transition Table', route: '/design-patterns/state/data-driven-state-transition-table' },
    { label: 'Reconstructing State From Persisted Data', route: '/design-patterns/state/reconstructing-state-from-persisted-data' },
  ],
};
