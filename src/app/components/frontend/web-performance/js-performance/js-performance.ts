import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuickRefComponent, QuickRefItem }         from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint }       from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab }             from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake }  from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge }      from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion }        from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem }              from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary }  from '../../../shared/revision-card/revision-card';
import { PageMetaComponent }                       from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent }                   from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-perf-js-performance',
  standalone: true,
  imports: [CommonModule, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './js-performance.html',
  styleUrl: './js-performance.scss',
})
export class PerfJsPerformance {

  quickRef: QuickRefItem[] = [
    { name: 'Tree shaking',          type: 'keyword', desc: 'Dead-code elimination at build time — unused exports removed from the final bundle' },
    { name: 'Code splitting',        type: 'keyword', desc: 'Split bundle into chunks loaded on demand — routes load only what they need' },
    { name: 'import()',              type: 'function', desc: 'Dynamic import — returns a Promise<module>; triggers code splitting at the call site' },
    { name: 'Long task',             type: 'keyword', desc: 'Any main-thread task > 50 ms — blocks input, causes high INP and poor responsiveness' },
    { name: 'TBT',                   type: 'keyword', desc: 'Total Blocking Time — sum of (task duration - 50ms) for all long tasks; lab proxy for INP' },
    { name: 'Bundle analyser',       type: 'keyword', desc: 'rollup-plugin-visualizer / webpack-bundle-analyzer — treemap of what\'s inside your bundle' },
    { name: 'requestIdleCallback',   type: 'function', desc: 'Run non-urgent work when the browser is idle — safe for analytics, prefetching' },
    { name: 'Memoisation',           type: 'keyword', desc: 'Cache function results for the same inputs — avoid recomputing expensive pure functions' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Bundle size — find it and fix it',
      points: [
        'Use rollup-plugin-visualizer (Vite) or webpack-bundle-analyzer to see a treemap of what\'s in your bundle.',
        'Common culprits: moment.js (~300 KB), lodash (~70 KB un-treeshaken), large icon sets, polyfills for supported browsers.',
        'Replace moment.js with date-fns or Day.js (~2 KB gzipped). Import individual lodash functions (lodash-es for tree shaking).',
        'Use bundlephobia.com to check a package\'s size and its dependencies before adding it.',
        'Target: < 100 KB gzipped JS for the initial page; each route chunk < 50 KB gzipped.',
      ],
    },
    {
      heading: 'Tree shaking — remove dead code automatically',
      points: [
        'Tree shaking relies on ES Modules (import/export) — CommonJS (require) is NOT tree-shakeable.',
        'Named exports shake better than default exports for large modules — {Button} from \'ui\' vs {default} from \'ui\'.',
        'Side effects: if a module has side effects, the bundler cannot remove it even if unused. Mark side-effect-free packages in package.json: "sideEffects": false.',
        'Check tree shaking worked: bundle analyser should show only the imported parts of large libraries.',
        'pitfall: re-exporting from barrel files (index.ts) can defeat tree shaking — prefer direct imports.',
      ],
    },
    {
      heading: 'Code splitting — load only what\'s needed',
      points: [
        'Route-based splitting: each route is a separate chunk loaded only when navigated to.',
        'import(\'./HeavyComponent\') creates a split point — the chunk loads on demand.',
        'Vendor splitting: separate node_modules from app code — vendors change rarely and stay cached longer.',
        'Preload likely-next-route chunks on hover/focus: <link rel="prefetch"> or dynamic import() with {prefetch: true}.',
        'Angular CLI and Vite do route splitting automatically via lazy loadComponent() and dynamic import().',
      ],
    },
    {
      heading: 'Long tasks — breaking the main thread',
      points: [
        'Any task > 50 ms on the main thread is a "long task" — the browser cannot process input until it finishes.',
        'Detect with PerformanceObserver type "longtask" or Chrome DevTools → Performance panel (red task bars).',
        'Break loops with scheduler.yield() (Chrome 115+) or await new Promise(r => setTimeout(r, 0)).',
        'Move CPU-heavy work (JSON parsing, image processing, crypto) to Web Workers off the main thread.',
        'Total Blocking Time (TBT): sum of (duration - 50ms) for each long task — Lighthouse lab proxy for INP.',
      ],
    },
    {
      heading: 'Parse and execution cost — JavaScript is expensive',
      points: [
        'JS has three costs: download, parse/compile, and execution — a 500 KB JS file costs more than a 500 KB image.',
        'V8 byte-code cache: subsequent page loads use cached compiled code — first load is always the most expensive.',
        'Reduce parse cost: ship less JS, use code splitting, defer non-critical scripts.',
        'Avoid eval() and new Function() — they trigger re-parse and disable V8 optimisations.',
        'Top-level await in ES modules delays module evaluation — use sparingly for truly async initialization only.',
      ],
    },
    {
      heading: 'Runtime performance — efficient patterns',
      points: [
        'Avoid frequent DOM queries in loops — cache the result: const el = document.getElementById(\'id\').',
        'Debounce scroll/resize handlers — they fire dozens of times per second; process at most every 100ms.',
        'Memoize expensive pure functions — useMemo (React), computed signals (Angular/Solid) cache results by input.',
        'Virtual scrolling — render only visible rows; libraries: @tanstack/virtual, @angular/cdk virtualScroll.',
        'Avoid deep object cloning in hot paths — structuredClone is 10x slower than spread for simple objects.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Bundle analysis (Vite)',
      language: 'typescript',
      code: `// vite.config.ts — add bundle analyser
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';  // npm i -D rollup-plugin-visualizer

export default defineConfig({
  plugins: [
    visualizer({
      filename: 'dist/stats.html',
      open: true,         // auto-open in browser after build
      gzipSize: true,     // show gzipped sizes
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separate heavy deps into their own chunks
          if (id.includes('node_modules/lodash-es')) return 'lodash';
          if (id.includes('node_modules/chart.js'))  return 'charts';
          if (id.includes('node_modules/'))          return 'vendor';
        },
      },
    },
  },
});

// Run: npx vite build → opens dist/stats.html
// Look for: unexpectedly large deps, duplicated modules, unused polyfills`,
    },
    {
      label: 'Code splitting with dynamic import',
      language: 'typescript',
      code: `// Route-based splitting — Angular lazy routes (already built-in)
// app.routes.ts
const routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent),
  },
  {
    path: 'reports',
    loadComponent: () => import('./reports/reports').then(m => m.ReportsComponent),
  },
];

// On-demand component splitting — load heavy component only when needed
class FeatureComponent {
  async openChart() {
    // ChartComponent is NOT in the initial bundle
    const { ChartComponent } = await import('./chart/chart');
    this.showChart(new ChartComponent());
  }
}

// Prefetch the next likely route on hover
function prefetchOnHover(routePath: string) {
  return () => import(\`./\${routePath}/\${routePath}\`);
}

document.querySelector('#reports-link')?.addEventListener('mouseenter', () => {
  prefetchOnHover('reports')();  // starts download while user hovers
}, { once: true });`,
    },
    {
      label: 'Break long tasks',
      language: 'typescript',
      code: `// Detect long tasks in production
const longTaskObs = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 100) {
      console.warn('Long task:', Math.round(entry.duration), 'ms');
    }
  }
});
longTaskObs.observe({ type: 'longtask', buffered: true });

// Break an expensive loop with yielding
const yieldToMain = () =>
  'scheduler' in globalThis
    ? (globalThis as any).scheduler.yield()
    : new Promise<void>(resolve => setTimeout(resolve, 0));

async function processLargeDataset(data: unknown[]) {
  const results: unknown[] = [];
  for (let i = 0; i < data.length; i++) {
    results.push(expensiveTransform(data[i]));
    // Yield every 50 items — keeps each chunk < ~50ms
    if (i % 50 === 0) await yieldToMain();
  }
  return results;
}

// Run non-urgent work when browser is idle
function scheduleIdleWork(fn: () => void) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(fn, { timeout: 2000 });
  } else {
    setTimeout(fn, 1);  // fallback for Safari
  }
}

scheduleIdleWork(() => {
  // prefetch data, send analytics, warm caches
  prefetchNextRouteData();
});`,
    },
    {
      label: 'Efficient patterns',
      language: 'typescript',
      code: `// 1. Memoize expensive computations
function memoize<T>(fn: (...args: unknown[]) => T) {
  const cache = new Map<string, T>();
  return (...args: unknown[]): T => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

const expensiveCalc = memoize((n: number) => {
  let result = 0;
  for (let i = 0; i < n; i++) result += Math.sqrt(i);
  return result;
});

// 2. Debounce high-frequency events
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

const handleResize = debounce(() => recalculateLayout(), 150);
window.addEventListener('resize', handleResize);

// 3. Cache DOM queries outside loops
const items = document.querySelectorAll('.item');  // once
items.forEach(item => item.classList.add('processed'));  // use cached NodeList

// 4. Avoid deep clones in hot paths
// structuredClone is thorough but slow (~10x slower for simple objects)
const cheapCopy = { ...original };       // spread: O(n) where n = key count
const deepCopy = structuredClone(large); // only when deep clone truly needed`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Importing entire lodash instead of individual functions',
      wrong: `import _ from 'lodash';           // entire 70 KB library
const result = _.groupBy(items, 'type');`,
      right: `import groupBy from 'lodash-es/groupBy';  // ~2 KB, tree-shakeable
const result = groupBy(items, 'type');`,
      explanation: 'Importing the default lodash export pulls in the entire library (~70 KB min+gzip). lodash-es uses named ES module exports — each function can be tree-shaken, reducing the cost to only what you use.',
    },
    {
      title: 'Using CommonJS requires instead of ES module imports',
      wrong: `const { format } = require('date-fns');  // CommonJS — not tree-shakeable`,
      right: `import { format } from 'date-fns';        // ES module — tree-shakeable`,
      explanation: 'Bundlers can only tree-shake ES Modules (import/export). CommonJS require() is dynamic — the bundler cannot know at build time what is actually used, so the entire module is included.',
    },
    {
      title: 'Not splitting heavy routes into separate chunks',
      wrong: `// All routes in one bundle — 2 MB downloaded on first visit
import { DashboardComponent } from './dashboard/dashboard';
import { ReportsComponent }   from './reports/reports';
import { AdminComponent }     from './admin/admin';`,
      right: `// Each route is a separate chunk — only loaded when navigated to
{ path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) }
{ path: 'reports',   loadComponent: () => import('./reports/reports').then(m => m.ReportsComponent) }`,
      explanation: 'Static imports pull all components into the initial bundle. Lazy loadComponent() creates separate chunks for each route — the dashboard chunk is downloaded only when the user navigates to /dashboard.',
    },
    {
      title: 'Running expensive work synchronously on the main thread',
      wrong: `// 5000-item sort blocks the main thread for ~200ms
button.addEventListener('click', () => {
  const sorted = hugArray.sort(complexComparator);  // long task
  render(sorted);
});`,
      right: `// Break the work or move to a Worker
button.addEventListener('click', async () => {
  const worker = new Worker('./sort-worker.js');
  worker.postMessage(hugArray);
  worker.onmessage = ({ data }) => render(data);
  // OR: use scheduler.yield() to break the sort loop
});`,
      explanation: 'A 200ms synchronous task blocks the main thread and prevents input processing — directly inflating INP. Move heavy computation to a Web Worker or break it into yielding chunks.',
    },
    {
      title: 'Re-running expensive calculations on every render',
      wrong: `// Recalculates on every render cycle regardless of input changes
function Component({ items }) {
  const stats = computeExpensiveStats(items);  // runs on every re-render
  return <div>{stats.total}</div>;
}`,
      right: `// Memoize — only recalculates when items changes
const stats = useMemo(() => computeExpensiveStats(items), [items]);
// Angular: use computed signal
// readonly stats = computed(() => computeExpensiveStats(this.items()));`,
      explanation: 'Without memoization, every state change triggers a full recalculation even if the input data hasn\'t changed. useMemo (React) and computed signals (Angular) cache the result and only recalculate when dependencies change.',
    },
    {
      title: 'Adding event listeners inside loops without cleanup',
      wrong: `// Memory leak: listeners accumulate on each re-render
items.forEach(item => {
  item.addEventListener('click', handleClick);  // added N times
});`,
      right: `// Event delegation: one listener on the parent
list.addEventListener('click', (e) => {
  const item = (e.target as Element).closest('.item');
  if (item) handleClick(e, item);
});`,
      explanation: 'Adding event listeners inside loops or on each render creates duplicate listeners and memory leaks. Event delegation attaches one listener to the parent and uses event bubbling — cleaner and more performant for large lists.',
    },
  ];

  challenge: Challenge = {
    title: 'Reduce a 3 MB JavaScript bundle',
    language: 'typescript',
    description: `A Vite application has a 3 MB initial JS bundle. The bundle analyser reveals:
- moment.js: 300 KB (only \`format()\` is used)
- lodash: 70 KB (only \`groupBy\` and \`debounce\` are used)
- ChartComponent: 500 KB (only shown on /reports route)
- All routes are statically imported

Fix all four issues by:
1. Replacing moment.js with date-fns
2. Switching to lodash-es named imports
3. Lazy-loading ChartComponent with dynamic import
4. Code-splitting the /reports route`,
    hints: [
      'date-fns/format is the equivalent of moment().format()',
      'import { groupBy, debounce } from "lodash-es" for tree-shaken lodash',
      'Use dynamic import() inside the method that shows the chart',
      'Use loadComponent with a dynamic import for the reports route',
    ],
    starterCode: `// BEFORE — 3 MB bundle

// Bad import 1: entire moment.js
import moment from 'moment';
const formatted = moment(date).format('YYYY-MM-DD');

// Bad import 2: entire lodash (CommonJS)
const { groupBy, debounce } = require('lodash');

// Bad import 3: static import of heavy chart
import { ChartComponent } from './chart/chart';

// Bad import 4: static route imports
import { ReportsComponent } from './reports/reports';
const routes = [{ path: 'reports', component: ReportsComponent }];`,
    solution: `// AFTER — ~400 KB bundle (87% reduction)

// Fix 1: date-fns named import — tree-shakeable, ~2 KB for format()
import { format } from 'date-fns';
const formatted = format(date, 'yyyy-MM-dd');

// Fix 2: lodash-es named imports — tree-shakeable, ~4 KB total
import { groupBy, debounce } from 'lodash-es';

// Fix 3: dynamic import for heavy chart — loaded only when needed
class DashboardComponent {
  async showChart() {
    const { ChartComponent } = await import('./chart/chart');
    this.mountChart(new ChartComponent());
  }
}

// Fix 4: lazy route — ReportsComponent chunk downloaded only on /reports
const routes = [
  {
    path: 'reports',
    loadComponent: () => import('./reports/reports').then(m => m.ReportsComponent),
  },
];`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why is CommonJS require() NOT tree-shakeable?',
      options: [
        'CommonJS modules are always compressed — bundlers cannot inspect them',
        'require() is dynamic — bundlers cannot statically analyse which exports are used at build time',
        'CommonJS is deprecated and bundlers ignore it entirely',
        'require() loads modules asynchronously, defeating static analysis',
      ],
      answer: 1,
      explanation: 'require() can have dynamic arguments (require(someVar)) — the bundler cannot know at build time which exports will be used. ES module import is static and deterministic, allowing the bundler to mark unused exports as dead code.',
    },
    {
      q: 'What is Total Blocking Time (TBT)?',
      options: [
        'The total time a page spends waiting for network responses',
        'The sum of (long task duration - 50ms) for all long tasks between FCP and TTI',
        'The time between first click and first server response',
        'The total time JavaScript blocks CSS parsing',
      ],
      answer: 1,
      explanation: 'TBT = sum of the "blocking portion" (duration - 50ms) of every long task between First Contentful Paint and Time to Interactive. It is Lighthouse\'s lab proxy for INP — a page with high TBT will likely have poor INP in the field.',
    },
    {
      q: 'Which Vite/Rollup plugin shows a treemap of your bundle contents?',
      options: [
        'vite-plugin-inspect',
        'rollup-plugin-visualizer',
        'vite-plugin-compression',
        'rollup-plugin-terser',
      ],
      answer: 1,
      explanation: 'rollup-plugin-visualizer generates an interactive HTML treemap (stats.html) showing every module\'s contribution to bundle size — essential for finding unexpected large dependencies.',
    },
    {
      q: 'What is event delegation and why is it more performant than per-element listeners?',
      options: [
        'Delegating event handling to a Web Worker thread',
        'Attaching one listener to the parent element and using event bubbling to handle child events',
        'Using passive: true on all event listeners',
        'Removing event listeners after first use with { once: true }',
      ],
      answer: 1,
      explanation: 'Event delegation uses one listener on a parent container. Events from child elements bubble up and are handled there. This avoids attaching N listeners to N items, reducing memory usage and preventing listener accumulation on re-renders.',
    },
    {
      q: 'What does "sideEffects": false in package.json tell the bundler?',
      options: [
        'The package has no dependencies',
        'Every module in the package can be safely removed if its exports are unused',
        'The package disables all side effects of its dependencies',
        'The bundler should not minify this package',
      ],
      answer: 1,
      explanation: '"sideEffects": false marks a package as side-effect-free — meaning if a module\'s exports are unused, the bundler can remove the entire module without breaking anything. This is a prerequisite for effective tree shaking.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I find what is making my bundle large?',
      a: 'Use rollup-plugin-visualizer (Vite) or webpack-bundle-analyzer: both generate an interactive treemap showing every module\'s size. Also check bundlephobia.com before adding a new package — it shows install size, bundle size, and the size of transitive dependencies.',
    },
    {
      q: 'What is the difference between TBT and INP?',
      a: 'TBT is a lab metric (Lighthouse) measuring the total blocking time of long tasks between FCP and TTI — it correlates with INP but doesn\'t measure actual user interactions. INP is a field metric from real user interaction events. Reducing TBT (breaking long tasks) generally also reduces INP, but they can diverge if long tasks don\'t coincide with actual user interactions.',
    },
    {
      q: 'Is it worth replacing moment.js with date-fns?',
      a: 'Almost always yes. moment.js is ~300 KB minified (non-tree-shakeable). date-fns provides the same functionality as named ES module exports — only the functions you import are bundled. Using format() and addDays() from date-fns costs ~4 KB vs 300 KB for the equivalent moment.js functionality.',
    },
    {
      q: 'When should I use requestIdleCallback vs setTimeout for deferred work?',
      a: 'requestIdleCallback runs work in idle periods — the browser passes a deadline object telling you how much time is available before the next frame. Use it for non-urgent background work (analytics, cache warming, prefetching). setTimeout(fn, 0) yields once then runs immediately at the next task opportunity — use it when you need the work to run soon but yield to pending input first.',
    },
    {
      q: 'How does V8\'s bytecode cache help with repeat visits?',
      a: 'On the first visit V8 parses and compiles JS to bytecode. On subsequent visits, if the script hasn\'t changed, V8 uses the cached bytecode — skipping the parse/compile step entirely. This is another reason long-cached versioned bundles improve performance on repeat visits: the bytecode cache remains valid as long as the file hash matches.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Ship less JS: tree-shake ES modules, code-split routes, break long tasks with yield, and profile with bundle analyser before each major release.',
    mustKnow: [
      'Tree shaking requires ES Modules (import/export) — CommonJS require() is opaque to bundlers',
      'Long task > 50 ms blocks input; TBT = sum of blocking portions; reduce with yield/workers',
      'Code split by route with loadComponent + dynamic import() — load only what\'s needed',
      'Memoize expensive pure functions (computed, useMemo) to avoid repeat calculation',
      'Bundle analyser (rollup-plugin-visualizer) is mandatory before shipping a large app',
      'Event delegation: one parent listener > N child listeners',
    ],
    interviewFocus: [
      'What is tree shaking and what makes a module tree-shakeable?',
      'What is Total Blocking Time? How does it relate to INP?',
      'How does dynamic import() enable code splitting?',
      'What is the performance cost of JavaScript beyond its file size?',
    ],
  };
}
