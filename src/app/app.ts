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
