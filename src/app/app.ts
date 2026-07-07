import { Component, computed, inject, signal, HostListener, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './services/auth.service';
import { ProgressService } from './services/progress.service';
import { DarkModeService } from './services/dark-mode.service';
import { SearchService, SEARCH_INDEX } from './services/search.service';
import { BreadcrumbComponent } from './components/shared/breadcrumb/breadcrumb';
import { PageSidebarComponent } from './components/shared/page-sidebar/page-sidebar';
import { SearchComponent } from './components/shared/search/search';
import { BackToTopComponent } from './components/shared/back-to-top/back-to-top';
import { GoNavComponent } from './components/shared/go-nav/go-nav';
import { DevopsNavComponent } from './components/shared/devops-nav/devops-nav';
import { ContainersNavComponent } from './components/shared/containers-nav/containers-nav';
import { AwsNavComponent } from './components/shared/aws-nav/aws-nav';
import { AzureNavComponent } from './components/shared/azure-nav/azure-nav';
import { LinuxNavComponent } from './components/shared/linux-nav/linux-nav';
import { TerraformNavComponent } from './components/shared/terraform-nav/terraform-nav';
import { MeshNavComponent } from './components/shared/mesh-nav/mesh-nav';
import { SysdesignNavComponent } from './components/shared/sysdesign-nav/sysdesign-nav';
import { ArchNavComponent } from './components/shared/arch-nav/arch-nav';
import { DpNavComponent } from './components/shared/dp-nav/dp-nav';
import { SecurityNavComponent } from './components/shared/security-nav/security-nav';
import { ApiDesignNavComponent } from './components/shared/api-design-nav/api-design-nav';
import { ObsNavComponent } from './components/shared/obs-nav/obs-nav';
import { MongoNavComponent } from './components/shared/mongo-nav/mongo-nav';
import { RedisNavComponent } from './components/shared/redis-nav/redis-nav';
import { GqlNavComponent } from './components/shared/gql-nav/gql-nav';
import { MessagingNavComponent } from './components/shared/messaging-nav/messaging-nav';
import { TestingNavComponent } from './components/shared/testing-nav/testing-nav';
import { DsaNavComponent } from './components/shared/dsa-nav/dsa-nav';
import { AiNavComponent } from './components/shared/ai-nav/ai-nav';

// Difficulty metadata for nav badges
const DIFF: Record<string, string> = Object.fromEntries(
  SEARCH_INDEX.map(e => [e.route, e.difficulty])
);

// Phase 10 — subtopic pages, keyed by parent topic route slug (e.g. 'counter').
// Populated incrementally as subtopic pages are built; topics without an
// entry here simply render no nested list (no forced empty expand arrow).
interface SubtopicNavEntry { label: string; route: string; }
const SUBTOPICS: Record<string, SubtopicNavEntry[]> = {
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
};

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BreadcrumbComponent,
            PageSidebarComponent, SearchComponent, BackToTopComponent, GoNavComponent, DevopsNavComponent, ContainersNavComponent, AwsNavComponent, AzureNavComponent, LinuxNavComponent, TerraformNavComponent, MeshNavComponent, SysdesignNavComponent, ArchNavComponent, DpNavComponent, SecurityNavComponent, ApiDesignNavComponent, ObsNavComponent, MongoNavComponent, RedisNavComponent, GqlNavComponent, MessagingNavComponent, TestingNavComponent, DsaNavComponent, AiNavComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  auth     = inject(AuthService);
  progress = inject(ProgressService);
  darkMode = inject(DarkModeService);
  search   = inject(SearchService);

  private platform = inject(PLATFORM_ID);
  navOpen = signal(
    isPlatformBrowser(this.platform) ? window.innerWidth >= 769 : true
  );

  private router = inject(Router);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  // Current route key for progress dot
  currentRoute = computed(() =>
    this.currentUrl().replace(/\?.*/, '').split('/').filter(Boolean)[0] ?? ''
  );

  showLeftNav = computed(() => this.currentUrl() !== '/');
  showSidebar = computed(() => {
    const url = this.currentUrl();
    return !['/','','/angular','/csharp','/aspnet','/sql',
      '/html','/css','/javascript','/typescript','/react','/blazor','/performance',
      '/node','/python','/go',
      '/mongodb','/redis','/graphql','/messaging',
      '/design-patterns','/arch-patterns','/api-design','/system-design','/security','/observability',
      '/devops','/linux','/containers','/terraform','/azure','/aws','/service-mesh',
      '/dsa','/testing-hub','/ai',
    ].includes(url);
  });

  currentSection = computed<'angular' | 'csharp' | 'aspnet' | 'sql' | 'typescript' | 'react' | 'javascript' | 'html' | 'css' | 'performance' | 'blazor' | 'node' | 'python' | 'go' | 'devops' | 'containers' | 'aws' | 'azure' | 'linux' | 'terraform' | 'mesh' | 'system-design' | 'arch-patterns' | 'design-patterns' | 'security' | 'api-design' | 'observability' | 'mongodb' | 'redis' | 'graphql' | 'messaging' | 'testing-hub' | 'dsa' | 'ai' | 'hub'>(() => {
    const url = this.currentUrl();
    if (url.startsWith('/angular'))    return 'angular';
    if (url.startsWith('/csharp'))     return 'csharp';
    if (url.startsWith('/aspnet'))     return 'aspnet';
    if (url.startsWith('/sql'))        return 'sql';
    if (url.startsWith('/typescript')) return 'typescript';
    if (url.startsWith('/react'))      return 'react';
    if (url.startsWith('/javascript')) return 'javascript';
    if (url.startsWith('/html'))       return 'html';
    if (url.startsWith('/css'))        return 'css';
    if (url.startsWith('/performance')) return 'performance';
    if (url.startsWith('/blazor'))     return 'blazor';
    if (url.startsWith('/node'))       return 'node';
    if (url.startsWith('/python'))     return 'python';
    if (url.startsWith('/go'))         return 'go';
    if (url.startsWith('/devops'))     return 'devops';
    if (url.startsWith('/containers')) return 'containers';
    if (url.startsWith('/aws'))        return 'aws';
    if (url.startsWith('/azure'))      return 'azure';
    if (url.startsWith('/linux'))      return 'linux';
    if (url.startsWith('/terraform'))    return 'terraform';
    if (url.startsWith('/service-mesh')) return 'mesh';
    if (url.startsWith('/system-design')) return 'system-design';
    if (url.startsWith('/arch-patterns')) return 'arch-patterns';
    if (url.startsWith('/design-patterns')) return 'design-patterns';
    if (url.startsWith('/security'))      return 'security';
    if (url.startsWith('/api-design'))    return 'api-design';
    if (url.startsWith('/observability')) return 'observability';
    if (url.startsWith('/mongodb'))       return 'mongodb';
    if (url.startsWith('/redis'))         return 'redis';
    if (url.startsWith('/graphql'))       return 'graphql';
    if (url.startsWith('/messaging'))     return 'messaging';
    if (url.startsWith('/testing-hub'))  return 'testing-hub';
    if (url.startsWith('/dsa'))          return 'dsa';
    if (url.startsWith('/ai'))           return 'ai';
    return 'hub';
  });

  toggleNav()  { this.navOpen.update(v => !v); }
  closeNav()   { this.navOpen.set(false); }

  diff(route: string) { return DIFF[route] ?? null; }

  subtopicsOf(routeSlug: string): SubtopicNavEntry[] | null {
    return SUBTOPICS[routeSlug] ?? null;
  }

  // Phase 10 — subtopics list per topic collapses by default; expand state
  // does not persist across reloads (a fresh page load always starts collapsed).
  private expandedTopics = signal<Set<string>>(new Set());

  isSubtopicsExpanded(routeSlug: string): boolean {
    return this.expandedTopics().has(routeSlug);
  }

  toggleSubtopics(routeSlug: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const next = new Set(this.expandedTopics());
    next.has(routeSlug) ? next.delete(routeSlug) : next.add(routeSlug);
    this.expandedTopics.set(next);
  }

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        if (isPlatformBrowser(this.platform) && window.innerWidth < 769) {
          this.navOpen.set(false);
        }
        this.autoExpandForCurrentUrl();
      });
    this.autoExpandForCurrentUrl();
  }

  // Auto-expand a topic's subtopics accordion when landing directly on one of
  // its subtopic pages (bookmark, prev/next pager, refresh) — otherwise the
  // active link would be hidden inside a collapsed accordion with no clue
  // where in the nav tree the reader actually is.
  private autoExpandForCurrentUrl(): void {
    const url = this.router.url.split('?')[0];
    for (const [topicSlug, subs] of Object.entries(SUBTOPICS)) {
      if (subs.some(s => s.route === url)) {
        this.expandedTopics.update(set => new Set(set).add(topicSlug));
        break;
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (isPlatformBrowser(this.platform) && window.innerWidth < 769) {
      this.navOpen.set(false);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(e: UIEvent) {
    const w = (e.target as Window).innerWidth;
    if (w >= 769 && !this.navOpen()) this.navOpen.set(true);
    if (w < 769  &&  this.navOpen()) this.navOpen.set(false);
  }
}
