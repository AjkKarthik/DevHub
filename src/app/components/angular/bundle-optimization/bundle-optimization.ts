import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';

@Component({
  selector: 'app-bundle-optimization',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, PrerequisitesComponent, BeforeAfterComponent,
  ],
  templateUrl: './bundle-optimization.html',
  styleUrl: './bundle-optimization.scss',
})
export class BundleOptimizationDemo {

  prerequisites: Prerequisite[] = [
    { label: '@defer Blocks',  route: '/angular/defer' },
    { label: 'Preloading',     route: '/angular/preloading' },
    { label: 'Routing',        route: '/angular/routing' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'source-map-explorer',     type: 'keyword',  desc: 'Visualise bundle composition from source maps — shows which packages take up the most space', since: 'Any builder' },
    { name: '@defer',                  type: 'syntax',   desc: 'Template-level lazy loading — defers a component\'s chunk until a trigger condition is met', since: 'Angular 17' },
    { name: 'loadComponent()',         type: 'function', desc: 'Route-level lazy loading — splits a component and its deps into a separate chunk loaded on navigation', since: 'Angular 14' },
    { name: 'loadChildren()',          type: 'function', desc: 'Route-level lazy loading for a set of child routes and all their components', since: 'Angular 2' },
    { name: 'budgets (angular.json)',  type: 'keyword',  desc: 'Build-time size limits — warnings and errors when initial or lazy chunks exceed thresholds', since: 'Angular 7' },
    { name: 'esbuild builder',        type: 'keyword',  desc: 'Angular 17+ default builder — significantly faster builds and smaller output than Webpack', since: 'Angular 17' },
    { name: 'providedIn: "root"',     type: 'keyword',  desc: 'Tree-shakeable service registration — unused services are excluded from the bundle automatically', since: 'Angular 6' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Understanding what is in your bundle',
      points: [
        'Before optimising, measure. Run <code>ng build --configuration=production --source-map</code> then <code>npx source-map-explorer dist/**/*.js</code> to see an interactive treemap of every byte in your bundle — which package, which file, and how much space it takes.',
        'The most common large contributors: <strong>moment.js</strong> (~67KB gzipped — switch to date-fns or the native Intl API), <strong>lodash</strong> (import per function, not the full library), large icon libraries (import only used icons), and accidental inclusion of server-only libraries in the browser bundle.',
        'Angular\'s own framework code is usually not the problem — tree-shaking eliminates unused Angular APIs effectively. The culprit is almost always third-party dependencies or entire feature modules being eagerly imported.',
        'Build budgets in <code>angular.json</code> give you a safety net: set a <code>maximumWarning</code> (e.g. 500KB) and a <code>maximumError</code> (e.g. 1MB) for the initial chunk. CI fails if the budget is exceeded, preventing accidental regressions.',
      ],
    },
    {
      heading: 'Route-level lazy loading',
      points: [
        'Route-level lazy loading splits each route\'s component (and its transitive imports) into a separate chunk. The browser only downloads a chunk when the user navigates to that route. This is the highest-impact optimisation for most Angular apps.',
        'With standalone components: use <code>loadComponent: () => import(\'./feature/feature\').then(m => m.FeatureComponent)</code>. Angular\'s router splits the component and all its unique imports into a separate chunk automatically.',
        'For a group of related routes: <code>loadChildren: () => import(\'./feature/feature.routes\').then(m => m.FEATURE_ROUTES)</code>. All routes in the array share one chunk — good for features where the user will visit multiple routes in sequence.',
        'Check chunk sizes after each major feature addition: <code>ng build --stats-json</code> produces a Webpack stats file; <code>ng build</code> with the esbuild builder logs chunk sizes in the terminal. A lazy chunk over 200KB (gzipped) often has optimisation potential.',
      ],
    },
    {
      heading: '@defer for template-level splitting',
      points: [
        '<code>@defer</code> (Angular 17+) is route-level lazy loading at the template level — it splits a component\'s chunk and only downloads it when a trigger fires: <code>on viewport</code>, <code>on interaction</code>, <code>on idle</code>, or <code>when condition</code>.',
        'Use <code>@defer (on viewport)</code> for content below the fold — charts, comment sections, recommendation panels. The initial bundle shrinks immediately; the component downloads only when the user scrolls to it.',
        '<code>@defer (prefetch on idle)</code> prefetches the chunk during browser idle time — the user perceives instant load when they reach the component, but the initial load is not blocked.',
        '<code>@defer</code> also provides <code>@placeholder</code> (shown before trigger fires), <code>@loading</code> (shown during download), and <code>@error</code> (shown if download fails) — giving you full control over the progressive loading UX.',
      ],
    },
    {
      heading: 'Tree shaking and dead code elimination',
      points: [
        'Tree shaking removes unused exports from the bundle. It works only on ES modules with static <code>import</code>/<code>export</code> — CommonJS modules (<code>require()</code>) are not tree-shaken.',
        'Angular services use <code>providedIn: "root"</code> for automatic tree-shaking — a service not injected anywhere is excluded from the bundle. Services registered in <code>providers: []</code> in a module are NOT tree-shaken even if unused.',
        'Pipes, directives, and components in standalone mode are tree-shaken when not imported. NgModule-based libraries often import entire modules (including unused components) — standalone APIs enable granular imports.',
        'Check for CommonJS dependencies in your build output: Angular warns <code>"... depends on ... (CommonJS or AMD module)"</code>. Find an ESM alternative or use a bundler alias to replace it.',
      ],
    },
    {
      heading: 'esbuild, preconnect, and runtime optimisations',
      points: [
        'Angular 17+ defaults to the esbuild builder (<code>@angular-devkit/build-angular:application</code>). It produces smaller bundles than Webpack due to better tree-shaking and built-in minification. If you are on an older project still using the Webpack builder, migrate: <code>ng update @angular/cli</code>.',
        'The esbuild builder supports <code>outputHashing: "all"</code> (content-based file hashes for long-term caching), <code>namedChunks: false</code> (shorter chunk names in prod), and <code>optimization: { scripts: true, styles: true, fonts: true }</code>.',
        'For fonts and third-party scripts: add <code>&lt;link rel="preconnect"&gt;</code> to <code>index.html</code> for origins you connect to at startup. For Google Fonts, use Angular\'s font inlining (<code>"inlineStyleLanguage": "css"</code> + <code>"optimization.fonts.inline": true</code>).',
        'Runtime performance: <code>NgOptimizedImage</code> for images (lazy loading, preconnect, srcset), <code>@defer (on viewport)</code> for off-screen components, and <code>trackBy</code> / <code>track</code> in <code>@for</code> to prevent unnecessary DOM recreation.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Analysing with source-map-explorer',
      language: 'typescript',
      code: `// Step 1: build with source maps
ng build --configuration=production --source-map

// Step 2: analyse the bundle
npx source-map-explorer dist/my-app/browser/*.js

// Or install globally:
npm install -g source-map-explorer
source-map-explorer 'dist/my-app/browser/*.js' --html report.html
// Opens an interactive treemap in the browser

// angular.json — always generate source maps for analysis
// (turn off for real prod to not expose source)
"configurations": {
  "production": {
    "sourceMap": true,    // ← add for analysis, remove for real prod deploy
    "optimization": true,
    "outputHashing": "all",
    "namedChunks": false,
    "aot": true
  }
}

// Check chunk sizes directly from the build output:
// esbuild builder prints: Initial chunk files | Names | Raw size | Estimated transfer size
// Look for: main.js (should be < 200KB gzipped), named lazy chunks`,
    },
    {
      label: 'Route-level lazy loading',
      language: 'typescript',
      code: `// app.routes.ts — all feature routes lazy loaded
export const routes: Routes = [
  // Eagerly loaded — shell only, keep minimal
  { path: '', loadComponent: () => import('./home/home').then(m => m.HomeComponent) },

  // Single component lazy load
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent),
  },

  // Route group — all admin routes share one chunk
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },

  // Preload strategy: PreloadAllModules preloads lazy chunks after initial load
  // Better: use QuicklinkModule (only preloads routes visible in the viewport)
];

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes,
      withPreloading(PreloadAllModules),  // or QuicklinkStrategy
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
    ),
  ],
};

// admin.routes.ts — co-located route file
export const ADMIN_ROUTES: Routes = [
  { path: '',        component: AdminDashboardComponent },
  { path: 'users',   component: AdminUsersComponent },
  { path: 'reports', component: AdminReportsComponent },
];`,
    },
    {
      label: '@defer for template splitting',
      language: 'html',
      code: `<!-- Defer heavy components until needed -->

<!-- On viewport: loads when scrolled into view -->
@defer (on viewport; prefetch on idle) {
  <app-analytics-chart [data]="chartData()" />
} @placeholder {
  <div class="chart-placeholder" style="height: 300px;">Loading chart…</div>
} @loading (minimum 200ms) {
  <app-skeleton [rows]="5" />
} @error {
  <p>Chart failed to load. <button (click)="retryChart()">Retry</button></p>
}

<!-- On interaction: loads only when user clicks -->
@defer (on interaction(commentsBtn)) {
  <app-comment-section [postId]="postId()" />
} @placeholder {
  <button #commentsBtn>Show Comments ({{ commentCount() }})</button>
}

<!-- When condition: loads after data is ready -->
@defer (when dataLoaded()) {
  <app-data-table [rows]="rows()" />
} @loading {
  <app-table-skeleton />
}

<!-- Immediate defer: splits chunk but loads ASAP (after initial paint) -->
@defer (on idle) {
  <app-recommendation-panel />
}`,
    },
    {
      label: 'Build budgets & tree shaking',
      language: 'typescript',
      code: `// angular.json — configure size budgets
{
  "configurations": {
    "production": {
      "budgets": [
        {
          "type": "initial",
          "maximumWarning": "500kb",
          "maximumError": "1mb"
        },
        {
          "type": "anyComponentStyle",
          "maximumWarning": "4kb",
          "maximumError": "8kb"
        },
        {
          // Warn if any lazy chunk exceeds 300KB
          "type": "anyScript",
          "maximumWarning": "300kb"
        }
      ]
    }
  }
}

// ── Tree-shaking best practices ──────────────────────────────────────

// ✓ Tree-shakeable service — excluded from bundle if never injected
@Injectable({ providedIn: 'root' })
export class AnalyticsService {}

// ✗ NOT tree-shakeable — included even if AnalyticsService is never used
@NgModule({ providers: [AnalyticsService] })
export class AppModule {}

// ✓ Named exports only — unused exports tree-shaken
export { formatDate } from 'date-fns';  // only formatDate bundled if only it's used

// ✗ Barrel import pulls everything in even if only one is used
import * as _ from 'lodash';  // entire lodash (~70KB) included
// ✓ Per-function import
import { debounce } from 'lodash-es';  // only debounce (~2KB)`,
    },
    {
      label: 'Import optimisation patterns',
      language: 'typescript',
      code: `// ── Replace large libraries with smaller alternatives ──────────────

// ✗ moment.js — 230KB minified, not tree-shakeable
import moment from 'moment';
const formatted = moment().format('YYYY-MM-DD');

// ✓ date-fns — tree-shakeable ES modules (~2KB per function)
import { format } from 'date-fns';
const formatted = format(new Date(), 'yyyy-MM-dd');

// ✓ Native Intl API — zero bundle cost
const formatted = new Intl.DateTimeFormat('en-US', {
  year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

// ── Icon library — import only used icons ──────────────────────────

// ✗ Entire icon set (~500KB)
import { MatIconModule } from '@angular/material/icon';

// ✓ Specific SVG icons via @ng-icons — only bundled icons shipped
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroTrash, heroPencil } from '@ng-icons/heroicons/outline';
providers: [provideIcons({ heroTrash, heroPencil })]

// ── Detect CommonJS modules — switch to ESM ────────────────────────

// Angular warns: "... depends on 'uuid' (CommonJS or AMD module)"
// ✗ CommonJS uuid
import { v4 as uuidv4 } from 'uuid';

// ✓ Native crypto — no import, no bundle cost
const id = crypto.randomUUID();

// ── Code splitting via dynamic import ─────────────────────────────

// Heavy operation only needed on user action
async onExportClick() {
  // xlsx only downloaded when user clicks Export
  const { utils, writeFile } = await import('xlsx');
  const ws = utils.json_to_sheet(this.data());
  writeFile(utils.book_new(), 'export.xlsx');
}`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Eager imports vs lazy loading + @defer',
      before: `// app.module.ts — everything imported eagerly, all in initial bundle
@NgModule({
  imports: [
    DashboardModule,    // 80KB — user may never visit
    AdminModule,        // 150KB — only admins use this
    ChartsModule,       // 120KB — only on one page, below the fold
    ReportsModule,      // 90KB — rarely used
  ],
})
export class AppModule {}
// Initial bundle: 440KB of features loaded even for anonymous visitors`,
      after: `// app.routes.ts — lazy loaded routes + @defer in template
export const routes: Routes = [
  { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.routes').then(m => m.ROUTES) },
  { path: 'admin',     loadChildren: () => import('./admin/admin.routes').then(m => m.ROUTES) },
  { path: 'reports',   loadChildren: () => import('./reports/reports.routes').then(m => m.ROUTES) },
];
// In dashboard template — chart is below the fold
@defer (on viewport; prefetch on idle) { <app-chart /> }
// Initial bundle: only shell + home → ~60KB; features load on demand`,
      note: 'Combining route-level lazy loading with @defer for below-fold components can reduce initial bundle by 60–80% on content-heavy apps.',
      language: 'typescript',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Importing a whole library to use one function',
      wrong: `import * as _ from 'lodash';          // entire lodash: ~70KB
import moment from 'moment';            // entire moment: ~230KB
const sorted = _.sortBy(items, 'name');
const date   = moment().format('YYYY-MM-DD');`,
      right: `import { sortBy } from 'lodash-es';   // only sortBy: ~2KB
import { format } from 'date-fns';      // only format: ~1KB
const sorted = sortBy(items, 'name');
const date   = format(new Date(), 'yyyy-MM-dd');`,
      explanation: 'Named imports from non-tree-shakeable libraries still pull in the entire package. Use ESM alternatives (lodash-es, date-fns) with named imports, or native APIs (Intl, crypto). source-map-explorer reveals these culprits immediately.',
    },
    {
      title: 'Registering services in NgModule providers instead of providedIn: "root"',
      wrong: `// Service included in bundle even if nothing ever injects it
@NgModule({
  providers: [HeavyAnalyticsService, LegacyReportingService],
})
export class AppModule {}`,
      right: `// Tree-shakeable — excluded from bundle if never injected
@Injectable({ providedIn: 'root' })
export class HeavyAnalyticsService {}

@Injectable({ providedIn: 'root' })
export class LegacyReportingService {}`,
      explanation: 'NgModule providers are included in the bundle unconditionally. providedIn: "root" lets the bundler tree-shake the service away if it has zero injection sites. For Angular 14+ standalone apps, there are no NgModules to worry about.',
    },
    {
      title: 'Using @defer on components that must render above the fold',
      wrong: `<!-- Navigation and hero are critical — must load immediately -->
@defer (on idle) {
  <app-navigation />   <!-- User sees blank nav for 2–3 seconds -->
  <app-hero-banner />  <!-- LCP element deferred — crushes Core Web Vitals -->
}`,
      right: `<!-- Critical above-fold content: eagerly imported, always rendered -->
<app-navigation />
<app-hero-banner />

<!-- Below-fold content: safely deferred -->
@defer (on viewport) {
  <app-testimonials />
  <app-footer-links />
}`,
      explanation: '@defer is for non-critical below-fold content. Deferring navigation or Largest Contentful Paint elements delays their render, hurting LCP and UX. Always load critical above-fold content eagerly.',
    },
    {
      title: 'Setting budgets too high and forgetting to reduce them',
      wrong: `// Budget set to 2MB — never trips, provides no protection
{
  "type": "initial",
  "maximumWarning": "2mb",
  "maximumError": "5mb"
}
// 3 months later: initial bundle is 800KB and nobody noticed`,
      right: `// Set budgets close to current size — tighten as you optimise
{
  "type": "initial",
  "maximumWarning": "400kb",  // warns when bundle grows unexpectedly
  "maximumError": "600kb"     // CI fails hard if this is exceeded
}
// Review and tighten after each optimisation sprint`,
      explanation: 'Generous budgets don\'t catch regressions. Set the warning threshold ~10% above your current size so any large new dependency trips the alarm before it reaches production.',
    },
  ];

  challenge: Challenge = {
    title: 'Audit and optimise a bloated Angular app',
    language: 'typescript',
    description: `Given an Angular app with a 1.2MB initial bundle, complete the optimisation tasks:
1. Configure angular.json budgets: warn at 400KB, error at 600KB for initial chunk
2. Convert the three eager feature routes (dashboard, admin, reports) to lazy loadChildren
3. Add @defer (on viewport) with @placeholder and @loading to the AnalyticsChartComponent (below the fold)
4. Replace "import * as _ from 'lodash'" with a tree-shakeable import of only the used function (groupBy)`,
    hints: [
      'angular.json budgets: type "initial", maximumWarning, maximumError',
      'loadChildren: () => import("./feature/feature.routes").then(m => m.FEATURE_ROUTES)',
      '@defer (on viewport; prefetch on idle) { <app-chart /> } @placeholder { <div>Loading…</div> }',
      'import { groupBy } from "lodash-es" — not import * as _ from "lodash"',
      'Run: ng build --source-map then npx source-map-explorer to verify before/after',
    ],
    starterCode: `// angular.json (budgets section)
"budgets": [
  // TODO: add initial budget warning at 400kb, error at 600kb
]

// app.routes.ts — currently eager
import { DashboardComponent } from './dashboard/dashboard';
import { AdminComponent } from './admin/admin';
import { ReportsComponent } from './reports/reports';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'admin',     component: AdminComponent },
  { path: 'reports',   component: ReportsComponent },
];

// app.html — chart is below the fold
<app-analytics-chart [data]="chartData()" />

// data.service.ts — uses lodash
import * as _ from 'lodash';
groupedData = _.groupBy(this.items, 'category');`,
    solution: `// angular.json
"budgets": [
  {
    "type": "initial",
    "maximumWarning": "400kb",
    "maximumError": "600kb"
  },
  {
    "type": "anyComponentStyle",
    "maximumWarning": "4kb",
    "maximumError": "8kb"
  }
]

// app.routes.ts — all lazy
export const routes: Routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  {
    path: 'reports',
    loadChildren: () => import('./reports/reports.routes').then(m => m.REPORTS_ROUTES),
  },
];

// app.html — chart deferred
@defer (on viewport; prefetch on idle) {
  <app-analytics-chart [data]="chartData()" />
} @placeholder {
  <div class="chart-placeholder" style="height:300px; background:#f3f4f6; border-radius:8px;"></div>
} @loading (minimum 300ms) {
  <app-skeleton [rows]="6" />
}

// data.service.ts — tree-shakeable import
import { groupBy } from 'lodash-es';
groupedData = groupBy(this.items, 'category');`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does source-map-explorer show you?',
      options: [
        'A timeline of which modules were loaded during the user\'s session',
        'An interactive treemap of every byte in your bundle by file and package',
        'The Angular change detection cycle breakdown for each component',
        'Network waterfall of resource loading during page load',
      ],
      answer: 1,
      explanation: 'source-map-explorer reads the source maps produced by the build and generates a treemap where each block\'s area is proportional to its size in the bundle. It\'s the fastest way to find which package is bloating the initial bundle.',
    },
    {
      q: 'Which @defer trigger is best for content below the fold that should load ASAP after initial paint?',
      options: [
        'on interaction — waits for user click',
        'on idle — loads during browser idle time after initial render',
        'when false — never loads automatically',
        'on timer(5000) — waits 5 seconds',
      ],
      answer: 1,
      explanation: '"on idle" fires when the browser is idle after completing the initial render. Combined with "prefetch on idle", it downloads the chunk as soon as the browser has spare cycles — the user typically perceives instant load when they reach the component.',
    },
    {
      q: 'Why does "import * as _ from \'lodash\'" prevent tree-shaking?',
      options: [
        'Because lodash is not compatible with TypeScript',
        'Because the wildcard import includes the entire module and most bundlers cannot statically analyse which exports are used',
        'Because lodash uses CommonJS exports, not ES module named exports',
        'Because Angular\'s build system ignores the lodash package entirely',
      ],
      answer: 2,
      explanation: 'Standard lodash uses CommonJS (require), which bundlers cannot statically analyse for tree-shaking. Use lodash-es (ESM version) with named imports instead: import { groupBy } from "lodash-es" — only groupBy is bundled.',
    },
    {
      q: 'What is the difference between loadComponent() and loadChildren() in Angular routes?',
      options: [
        'loadComponent is for Angular 14+; loadChildren is for Angular 2+',
        'loadComponent lazy-loads a single component; loadChildren lazy-loads a set of child routes all sharing one chunk',
        'loadChildren is faster than loadComponent because it preloads automatically',
        'They are identical — loadComponent is just shorthand for loadChildren with one route',
      ],
      answer: 1,
      explanation: 'loadComponent splits one component into its own chunk. loadChildren splits an entire route array (and all their components) into a shared chunk — useful for feature areas where the user will visit multiple sub-routes in sequence.',
    },
    {
      q: 'What happens if you defer a component that is the Largest Contentful Paint (LCP) element?',
      options: [
        'Nothing — @defer has no effect on Core Web Vitals metrics',
        'LCP is delayed until the defer trigger fires, significantly harming the LCP score',
        'Angular automatically detects LCP elements and skips defer for them',
        'The @placeholder renders instead and becomes the LCP element',
      ],
      answer: 1,
      explanation: 'LCP measures when the largest visible element becomes visible. Deferring it delays render — the browser cannot paint it until the chunk downloads. This directly hurts your LCP score. Never defer above-fold or LCP elements.',
    },
    {
      q: 'What does the Angular compiler\'s "common chunk" configuration do for lazy routes?',
      options: [
        'It merges all lazy chunks into one file for easier caching',
        'It extracts shared code used by multiple lazy chunks into a separate common chunk, reducing total download size when the user visits multiple lazy routes',
        'It inlines shared code into every lazy chunk to avoid extra HTTP requests',
        'It prevents lazy chunks from sharing any code to ensure complete isolation',
      ],
      answer: 1,
      explanation: 'When two lazy chunks both use the same library (e.g., @angular/forms), the build creates a "common" chunk with the shared code. Without it, each lazy chunk would bundle its own copy — wasting bytes on the second chunk the user downloads.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How much can I realistically reduce my initial bundle?',
      a: 'For a typical Angular app with no optimisation, moving all feature routes to lazy loading alone often cuts the initial bundle by 50–70%. Adding @defer for below-fold components can cut another 10–20%. Replacing moment.js with date-fns saves ~200KB. A realistically well-optimised Angular app should have an initial bundle under 150KB gzipped for the framework + shell, with features loading on demand.',
    },
    {
      q: 'When should I use @defer vs loadComponent on a route?',
      a: 'Use loadComponent/loadChildren for content that maps to a route — the user navigates to it. Use @defer for content within a page that is conditionally visible, below the fold, or triggered by user interaction. They are complementary: lazy-load the route, then within that route @defer the heavy sub-components that are off-screen or non-critical.',
    },
    {
      q: 'How do I detect if a library is CommonJS and replace it?',
      a: 'Angular prints a warning during build: "... depends on \'library-name\' (CommonJS or AMD module). This can result in slower builds and a larger bundle." When you see this, check if an ESM version exists (look for a "module" field in the library\'s package.json, or search for "library-name-es"). If no ESM version exists, consider: native Web APIs, a smaller alternative, or a Vite/esbuild alias to polyfill just the used functions.',
    },
    {
      q: 'Does Angular\'s esbuild builder automatically tree-shake CommonJS dependencies?',
      a: 'No — esbuild can tree-shake ESM (ES module) dependencies via static import/export analysis. CommonJS uses dynamic require() which cannot be statically analysed, so the entire module is bundled. The Angular esbuild builder does apply some CommonJS annotations (/*#__PURE__*/) to help, but it cannot fully tree-shake CommonJS. Switching to ESM alternatives is the reliable fix.',
    },
    {
      q: 'How do I use source-map-explorer to find what is bloating my Angular bundle?',
      a: 'Run: ng build --source-map then npx source-map-explorer dist/my-app/browser/main*.js. It opens an interactive treemap where each rectangle represents a module — larger rectangles are bigger contributors. Look for unexpected duplicates (the same library appearing twice under different import paths) and oversized dependencies (e.g. moment.js taking 60% of a utility chunk). The explore command also accepts a glob: source-map-explorer "dist/**/*.js" to analyse all chunks.',
    },
    {
      q: 'What are Angular build budgets and how do I set them?',
      a: 'Build budgets are size limits in angular.json that cause the Angular CLI to warn or error when a bundle exceeds a threshold. In angular.json, under configurations.production.budgets, set: { "type": "initial", "maximumWarning": "500kb", "maximumError": "1mb" }. This gates bundle size in CI — a PR that balloons the bundle will fail the build. Set warning at your current size and error 20% above it. Use type: "anyComponentStyle" for SCSS-heavy apps to catch style regressions.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Optimise Angular bundles by measuring first (source-map-explorer), then applying: route lazy loading (<code>loadComponent/loadChildren</code>), template splitting (<code>@defer on viewport</code>), tree-shakeable imports (<code>lodash-es</code>, <code>providedIn: "root"</code>), and enforcing size with <code>budgets</code> in angular.json.',
    mustKnow: [
      '<code>ng build --source-map</code> + <code>source-map-explorer</code> — find the culprit before optimising',
      '<code>loadComponent/loadChildren</code> — split every feature route; initial bundle = shell only',
      '<code>@defer (on viewport)</code> for below-fold components; <code>on idle</code> for background prefetch',
      '<code>providedIn: "root"</code> for tree-shakeable services; NgModule providers are always included',
      'Named imports from ESM libraries (<code>lodash-es</code>, <code>date-fns</code>); never <code>import *</code> from CommonJS',
      'Build budgets in <code>angular.json</code> — warn at target size, error if exceeded (CI enforcement)',
    ],
    interviewFocus: [
      '<strong>First step to optimise bundle?</strong> — measure with source-map-explorer; never guess',
      '<strong>loadComponent vs loadChildren?</strong> — single component chunk vs shared route-group chunk',
      '<strong>@defer best triggers?</strong> — on viewport for below-fold; on idle for background; never defer LCP',
      '<strong>Why tree-shaking fails?</strong> — CommonJS require() vs ESM import; NgModule providers vs providedIn: "root"',
    ],
  };
}
