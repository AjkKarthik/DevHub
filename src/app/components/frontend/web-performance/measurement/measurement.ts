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
  selector: 'app-perf-measurement',
  standalone: true,
  imports: [CommonModule, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './measurement.html',
  styleUrl: './measurement.scss',
})
export class PerfMeasurement {

  quickRef: QuickRefItem[] = [
    { name: 'Lighthouse',            type: 'keyword', desc: 'Lab tool built into Chrome DevTools — scores LCP, INP, CLS, TBT, SI on a simulated connection' },
    { name: 'WebPageTest',           type: 'keyword', desc: 'Online lab tool — waterfall, filmstrip, multi-step scripting, and multi-location testing' },
    { name: 'CrUX',                  type: 'keyword', desc: 'Chrome User Experience Report — Google\'s anonymised field data on real user Core Web Vitals' },
    { name: 'PerformanceObserver',   type: 'class',   desc: 'Browser API — observe paint, longtask, layout-shift, resource, and navigation timing entries' },
    { name: 'performance.mark()',    type: 'method',  desc: 'Add a named timestamp to the performance timeline — use for custom user-journey markers' },
    { name: 'performance.measure()', type: 'method',  desc: 'Record a named duration between two marks — shows in DevTools Performance panel' },
    { name: 'TTFB',                  type: 'keyword', desc: 'Time to First Byte — time from navigation start to first response byte; measures server/CDN speed' },
    { name: 'FCP',                   type: 'keyword', desc: 'First Contentful Paint — first text or image pixel rendered; good < 1.8 s' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Lab vs field data — two different realities',
      points: [
        'Lab data (Lighthouse, WebPageTest) is synthetic: fixed device, throttled network, empty cache — reproducible but artificial.',
        'Field data (CrUX, RUM) is real: actual users on actual devices, real network conditions — noisy but truthful.',
        'Google uses field data (CrUX) for search ranking — lab score does NOT directly affect SEO.',
        'Use lab data for debugging and regression detection; use field data to confirm real user experience.',
        'A page can score 90 on Lighthouse but fail Core Web Vitals in the field on low-end phones — always check both.',
      ],
    },
    {
      heading: 'Lighthouse — what each metric means',
      points: [
        'Performance score: weighted average — LCP (25%), TBT (30%), SI (10%), FCP (10%), CLS (25%).',
        'TBT (Total Blocking Time): lab proxy for INP — correlates but is not identical.',
        'Speed Index (SI): how quickly visual progress fills in — measured by visual diffs per frame.',
        'Run Lighthouse in Incognito to avoid extension interference; run 3× and average (results vary by ±10 points).',
        'CLI: npx lighthouse https://example.com --output html --view — scriptable, CI-friendly.',
      ],
    },
    {
      heading: 'Chrome DevTools Performance panel',
      points: [
        'Record: F12 → Performance → circle button → interact → stop. Shows every main-thread task, frame, and paint.',
        'Long task bars (red) show tasks > 50ms — click to see the call stack and identify the expensive function.',
        'Frames per second lane: drops below 60 fps appear as red bars — indicates jank.',
        'Bottom-up / call tree tabs: find which function consumed the most exclusive/total time.',
        'Screenshots timeline: visually confirms when content first appears vs when it was visually complete.',
      ],
    },
    {
      heading: 'WebPageTest — advanced lab testing',
      points: [
        'Multi-step scripting: simulate login flows, navigate to cart, add item, measure checkout performance.',
        'Filmstrip view: frame-by-frame screenshots every 500ms — see exactly when each element appears.',
        'Waterfall chart: shows every request, its timing phases (DNS, TCP, TLS, TTFB, download), and blocking.',
        'Comparison mode: run A/B test between two URLs or two configurations — side-by-side filmstrip.',
        'WebPageTest API: automate tests from CI via REST API — get JSON results for assertions.',
      ],
    },
    {
      heading: 'Performance Observer API — custom timing',
      points: [
        'PerformanceObserver observes paint, longtask, resource, layout-shift, element, and navigation entries.',
        'performance.mark(name) stamps a named point on the timeline — visible in DevTools.',
        'performance.measure(name, start, end) calculates duration between two marks.',
        'Custom marks let you measure user-journey steps: time-to-interactive-search, checkout-to-confirmation.',
        'Entries are accessible via performance.getEntriesByType() or the observer callback.',
      ],
    },
    {
      heading: 'CrUX — field data from real users',
      points: [
        'CrUX (Chrome User Experience Report) collects anonymised performance data from opted-in Chrome users.',
        'Available via: PageSpeed Insights, Search Console → Core Web Vitals report, CrUX API, BigQuery.',
        'CrUX shows the 75th percentile — if 75% of users have LCP < 2.5s, the metric is "good".',
        'CrUX data has a 28-day rolling window — fixes take up to a month to fully propagate in the report.',
        'A URL needs enough traffic to appear in CrUX — low-traffic pages fall back to origin-level data.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'PerformanceObserver',
      language: 'typescript',
      code: `// Observe Core Web Vitals with the PerformanceObserver API

// 1. LCP — Largest Contentful Paint
const lcpObs = new PerformanceObserver((list) => {
  // LCP can update — last entry is the final reported value
  const entries = list.getEntries();
  const lcp = entries[entries.length - 1] as PerformancePaintTiming;
  console.log('LCP:', Math.round(lcp.startTime), 'ms', 'element:', (lcp as any).element);
});
lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });

// 2. CLS — Cumulative Layout Shift
let clsValue = 0;
let clsEntries: PerformanceEntry[] = [];
const clsObs = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    const ls = entry as any;
    // Only count unexpected shifts (hadRecentInput = false)
    if (!ls.hadRecentInput) {
      clsValue += ls.value;
      clsEntries.push(entry);
    }
  }
  console.log('CLS so far:', clsValue.toFixed(4));
});
clsObs.observe({ type: 'layout-shift', buffered: true });

// 3. Long tasks — detect main-thread blocking
const ltObs = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.warn(\`Long task \${Math.round(entry.duration)}ms @ \${Math.round(entry.startTime)}ms\`);
  }
});
ltObs.observe({ type: 'longtask', buffered: true });

// Disconnect observers when done (e.g. on page hide)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { lcpObs.disconnect(); clsObs.disconnect(); ltObs.disconnect(); }
});`,
    },
    {
      label: 'Custom marks & measures',
      language: 'typescript',
      code: `// Custom performance marks for user journeys
// Visible in: DevTools Performance panel → Timings lane

// Mark the start of a user action
function onSearchStart() {
  performance.mark('search-start');
  // ... trigger search request
}

// Mark when results are rendered
function onResultsRendered() {
  performance.mark('search-results-painted');
  performance.measure(
    'search-to-results',     // measure name
    'search-start',          // start mark
    'search-results-painted' // end mark
  );

  const [measure] = performance.getEntriesByName('search-to-results');
  console.log('Search latency:', Math.round(measure.duration), 'ms');
  // Send to analytics
  sendToRUM({ name: 'search-latency', value: measure.duration });
}

// Navigation timing — measure TTFB server response speed
window.addEventListener('load', () => {
  const [navEntry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  const ttfb = navEntry.responseStart - navEntry.requestStart;
  const domInteractive = navEntry.domInteractive - navEntry.fetchStart;
  const pageLoad = navEntry.loadEventEnd - navEntry.fetchStart;

  console.table({
    'TTFB (ms)':           Math.round(ttfb),
    'DOM Interactive (ms)': Math.round(domInteractive),
    'Page Load (ms)':       Math.round(pageLoad),
  });
});`,
    },
    {
      label: 'Lighthouse CLI in CI',
      language: 'bash',
      code: `# Install Lighthouse CI
npm install -g @lhci/cli

# lhci.config.js — project configuration
cat > lighthouserc.js << 'EOF'
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4200', 'http://localhost:4200/dashboard'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',  // or your own LHCI server
    },
  },
};
EOF

# Run in CI (after build + serve)
npx ng build && npx ng serve &
lhci autorun

# Or run against a deployed URL
lhci collect --url=https://staging.example.com
lhci assert
lhci upload`,
    },
    {
      label: 'PageSpeed Insights API',
      language: 'typescript',
      code: `// Query CrUX field data via PageSpeed Insights API (free, no auth needed)
async function getFieldData(url: string) {
  const apiUrl = \`https://www.googleapis.com/pagespeedonline/v5/runPagespeed\`
    + \`?url=\${encodeURIComponent(url)}&strategy=mobile\`
    + \`&category=PERFORMANCE&key=YOUR_API_KEY\`;

  const res = await fetch(apiUrl);
  const data = await res.json();

  // Lab data (Lighthouse)
  const lab = data.lighthouseResult.categories.performance;
  console.log('Lighthouse score:', lab.score * 100);

  // Field data (CrUX — 75th percentile of real users)
  const field = data.loadingExperience.metrics;
  if (field) {
    console.table({
      'LCP (ms)':  field.LARGEST_CONTENTFUL_PAINT_MS?.percentile,
      'INP (ms)':  field.INTERACTION_TO_NEXT_PAINT?.percentile,
      'CLS':       field.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile / 100,
      'FCP (ms)':  field.FIRST_CONTENTFUL_PAINT_MS?.percentile,
      'TTFB (ms)': field.EXPERIMENTAL_TIME_TO_FIRST_BYTE?.percentile,
    });

    const lcpCategory = field.LARGEST_CONTENTFUL_PAINT_MS?.category;
    // 'FAST' | 'AVERAGE' | 'SLOW' → maps to Good / Needs Improvement / Poor
    console.log('LCP field rating:', lcpCategory);
  } else {
    console.log('Insufficient CrUX data for this URL');
  }
}

getFieldData('https://www.example.com');`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Treating Lighthouse score as equivalent to real user experience',
      wrong: `// "We scored 95 on Lighthouse, performance is fine!"
// But CrUX shows 40% of mobile users have LCP > 4s`,
      right: `// Check BOTH lab and field data
// PageSpeed Insights shows both Lighthouse (lab) + CrUX (field) on the same page
// Lighthouse 95 + CrUX poor = the lab test doesn't represent your real users`,
      explanation: 'Lighthouse runs in a controlled environment (throttled 4G, mid-tier device emulation). Your users may be on slower connections, older devices, or use extensions that slow the page. Always cross-reference Lighthouse with CrUX field data from PageSpeed Insights.',
    },
    {
      title: 'Running Lighthouse while Chrome extensions are active',
      wrong: `// Lighthouse run in normal Chrome window
// Extension injected 400ms of JS before page load
// Score: 62 — but real users don\'t have this extension`,
      right: `// Always run Lighthouse in Incognito (no extensions)
// OR use the CLI: npx lighthouse https://example.com
// Run 3x and take the median — scores vary by ±10 points`,
      explanation: 'Chrome extensions (ad blockers, password managers, screen readers) can inject scripts that inflate timing measurements. Incognito mode disables extensions by default. The CLI runs headless with no extensions and produces the most reproducible scores.',
    },
    {
      title: 'Only measuring the home page',
      wrong: `// Budget assertion only on /
lhci collect --url=https://example.com

// Meanwhile /checkout is 8 seconds and killing conversions`,
      right: `// Measure every critical user journey step
lhci collect --url=https://example.com
             --url=https://example.com/products
             --url=https://example.com/checkout
             --url=https://example.com/product/123`,
      explanation: 'The home page is often the most optimised. Product pages with dynamic carousels, checkout pages with payment SDKs, and search results with heavy JS are frequently much slower. Lighthouse CI should cover every page that is critical to user journeys.',
    },
    {
      title: 'Confusing FCP with LCP',
      wrong: `// "Our FCP is 1.2s, so we have good loading performance"
// But LCP (the actual content) is 4.8s — a hero image loads late`,
      right: `// FCP = first pixel (often a loading spinner)
// LCP = biggest meaningful content (hero image, main heading)
// Google ranks on LCP, not FCP — check LCP specifically`,
      explanation: 'FCP fires when ANY content renders — including a loading spinner or skeleton. LCP measures the largest meaningful content element. A spinner appearing at 1.2s with the real content at 4.8s gives a misleadingly good FCP but a terrible LCP and real user experience.',
    },
    {
      title: 'Not measuring after each deploy',
      wrong: `// Measure once at launch → forget about it
// 6 months later: third-party script added → LCP went from 2.1s to 3.8s
// Nobody noticed until users started complaining`,
      right: `// Lighthouse CI in every PR — catch regressions immediately
// SpeedCurve / Calibre for continuous field monitoring
// Alert when CWV metrics cross thresholds`,
      explanation: 'Performance degrades incrementally — a new analytics script here, a heavier image there. Without continuous measurement you only discover regressions after they\'ve already affected users and rankings. Lighthouse CI in every PR catches regressions immediately.',
    },
    {
      title: 'Using performance.now() instead of marks for user timing',
      wrong: `const start = performance.now();
doWork();
const end = performance.now();
console.log(end - start);  // not visible in DevTools timeline`,
      right: `performance.mark('work-start');
doWork();
performance.mark('work-end');
performance.measure('work', 'work-start', 'work-end');
// Now visible in DevTools Performance panel → User Timings lane`,
      explanation: 'performance.now() gives you a number in the console but doesn\'t appear in the DevTools Performance panel timeline. performance.mark() and performance.measure() create entries that show up in the "Timings" lane — much easier to correlate with other timeline events.',
    },
  ];

  challenge: Challenge = {
    title: 'Add performance instrumentation to a search feature',
    language: 'typescript',
    description: `Add performance instrumentation to a search feature so you can measure:
1. Time from user typing to search results appearing in the DOM (user-perceived latency)
2. Whether any long tasks occur during the search
3. Whether the results update causes a layout shift

Use performance.mark(), performance.measure(), and PerformanceObserver to capture all three.
Send the measurements to the console in a structured format.`,
    hints: [
      'Mark "search-start" on keydown in the search input',
      'Mark "search-results-shown" after results are injected into the DOM',
      'Use performance.measure() between the two marks',
      'Observe "longtask" entries during the search window',
      'Observe "layout-shift" entries that occur after "search-start"',
    ],
    starterCode: `// search.ts — add instrumentation to this search function
function performSearch(query: string): void {
  // TODO: mark search start

  fetch(\`/api/search?q=\${encodeURIComponent(query)}\`)
    .then(r => r.json())
    .then((results: unknown[]) => {
      renderResults(results);
      // TODO: mark results shown
      // TODO: measure duration
      // TODO: log structured result
    });
}

function renderResults(results: unknown[]): void {
  const container = document.getElementById('results')!;
  container.innerHTML = results.map(r => \`<div class="result">\${r}</div>\`).join('');
}

document.getElementById('search')?.addEventListener('input', (e) => {
  performSearch((e.target as HTMLInputElement).value);
});`,
    solution: `// search.ts — with full performance instrumentation

// Observe long tasks during search
const longTasksThisSearch: number[] = [];
const ltObs = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    longTasksThisSearch.push(Math.round(entry.duration));
  }
});
ltObs.observe({ type: 'longtask', buffered: false });

// Observe layout shifts caused by search results
let searchShiftTotal = 0;
let searchActive = false;
const clsObs = new PerformanceObserver((list) => {
  if (!searchActive) return;
  for (const entry of list.getEntries()) {
    const ls = entry as any;
    if (!ls.hadRecentInput) searchShiftTotal += ls.value;
  }
});
clsObs.observe({ type: 'layout-shift', buffered: false });

function performSearch(query: string): void {
  // Reset per-search tracking
  longTasksThisSearch.length = 0;
  searchShiftTotal = 0;
  searchActive = true;

  performance.mark('search-start');

  fetch(\`/api/search?q=\${encodeURIComponent(query)}\`)
    .then(r => r.json())
    .then((results: unknown[]) => {
      renderResults(results);

      performance.mark('search-results-shown');
      performance.measure('search-to-results', 'search-start', 'search-results-shown');
      searchActive = false;

      const [measure] = performance.getEntriesByName('search-to-results');
      console.table({
        'Search latency (ms)': Math.round(measure.duration),
        'Long tasks':          longTasksThisSearch.length,
        'Worst task (ms)':     Math.max(0, ...longTasksThisSearch),
        'Layout shift (CLS)':  searchShiftTotal.toFixed(4),
      });
    });
}

function renderResults(results: unknown[]): void {
  const container = document.getElementById('results')!;
  container.innerHTML = results.map(r => \`<div class="result">\${r}</div>\`).join('');
}

document.getElementById('search')?.addEventListener('input', (e) => {
  performSearch((e.target as HTMLInputElement).value);
});`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which metric does Google use for search ranking — Lighthouse score or CrUX field data?',
      options: [
        'Lighthouse score — it\'s the most precise lab measurement',
        'CrUX field data — real user Core Web Vitals at the 75th percentile',
        'An average of both lab and field data',
        'PageSpeed Insights overall score',
      ],
      answer: 1,
      explanation: 'Google\'s Page Experience signal uses Core Web Vitals from CrUX field data — anonymised measurements from real Chrome users. The Lighthouse score in PageSpeed Insights is a lab simulation and does not directly affect search ranking.',
    },
    {
      q: 'What does the 75th percentile mean in the context of Core Web Vitals?',
      options: [
        '75% of your JavaScript executes within the metric threshold',
        '75% of real user sessions must meet the "good" threshold for the URL to be rated "good"',
        'The metric is measured after 75% of the page has loaded',
        '75% of the Lighthouse score must come from performance metrics',
      ],
      answer: 1,
      explanation: 'CWV ratings are based on the 75th percentile of field data — meaning 75% of real user visits must fall within the "good" threshold for the URL to be rated "good". This intentionally focuses on the slower end of your user distribution, not the median.',
    },
    {
      q: 'What is the difference between FCP and LCP?',
      options: [
        'FCP measures text; LCP measures images only',
        'FCP is when ANY content first renders; LCP is when the largest content element renders',
        'FCP is a lab metric; LCP is a field metric only',
        'FCP is deprecated; LCP replaced it',
      ],
      answer: 1,
      explanation: 'First Contentful Paint (FCP) fires when any content renders — including loading spinners. Largest Contentful Paint (LCP) measures when the largest image or text block in the viewport has rendered — a better proxy for when the page is meaningfully loaded.',
    },
    {
      q: 'How do you make performance.measure() results visible in the Chrome DevTools Performance panel?',
      options: [
        'Call performance.visualize() after measure()',
        'The measure is automatically visible in the "User Timings" lane — no extra step needed',
        'Add a console.timeStamp() call alongside the measure',
        'Enable "User timing API" in DevTools → Experiments',
      ],
      answer: 1,
      explanation: 'Calls to performance.mark() and performance.measure() automatically create entries in the browser\'s performance timeline. They appear in the "Timings" (User Timings) lane of the Chrome DevTools Performance panel recording without any additional setup.',
    },
    {
      q: 'Why should Lighthouse always be run in Incognito mode?',
      options: [
        'Incognito disables HTTPS certificate warnings',
        'Extensions active in normal mode can inject JS that inflates timing measurements',
        'Incognito enables hardware acceleration for more accurate emulation',
        'Normal mode caches resources that make Lighthouse results unreliable',
      ],
      answer: 1,
      explanation: 'Chrome extensions (ad blockers, password managers, screen readers) can inject scripts or intercept network requests, artificially inflating timing measurements. Incognito mode disables extensions by default, producing measurements representative of what users without those extensions experience.',
    },
    {
      q: 'What does the Navigation Timing API\'s responseStart mark, and what metric is it related to?',
      options: ['When the user clicked a link', 'The time the server sent the first byte of the response — used to compute TTFB', 'When the page is fully interactive', 'The time CSS is applied to the DOM'],
      answer: 1,
      explanation: 'TTFB (Time to First Byte) = responseStart - requestStart. It measures server processing time + network latency for the first byte to arrive. High TTFB (>800ms) usually indicates slow server-side rendering, database queries, or CDN misconfiguration. Access it via performance.getEntriesByType("navigation")[0].responseStart.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How long does it take for a performance fix to appear in CrUX / Search Console?',
      a: 'CrUX uses a 28-day rolling window. A fix deployed today will start displacing old slow data immediately, but the full effect isn\'t visible for 28 days. Search Console typically reflects CrUX data with an additional lag of a few days. For faster feedback, use PageSpeed Insights (which can show CrUX data at the URL level) and check it a few days after deploying a fix.',
    },
    {
      q: 'What is WebPageTest good for that Lighthouse is not?',
      a: 'WebPageTest excels at multi-step scripting (simulate a logged-in flow), real device testing (actual Android/iOS hardware in the test agents), detailed waterfall analysis, filmstrip frame-by-frame comparison, and comparing two URLs or configurations side by side. Lighthouse is faster and easier but runs against a single page load on emulated hardware.',
    },
    {
      q: 'Can I measure INP with the Performance Observer API directly?',
      a: 'Yes — observe type "event" and filter for pointerdown, keydown, and click events with duration > 200ms. The web-vitals library abstracts this correctly (handling edge cases like multiple overlapping interactions) and is recommended over rolling your own. In DevTools, the Performance panel shows "Interactions" in the timeline when recording with "Web Vitals" enabled.',
    },
    {
      q: 'What does TTFB measure and what causes it to be slow?',
      a: 'Time to First Byte measures the time from the navigation request to the first byte of the HTTP response. Causes of slow TTFB: slow server-side rendering, slow database queries, geographic distance from user to server, misconfigured CDN, or missing caching headers. Good TTFB < 800ms. Fix with: edge caching, CDN, server-side caching, and database query optimisation.',
    },
    {
      q: 'How do I know if my performance improvements are actually helping real users?',
      a: 'Check CrUX data via PageSpeed Insights 28 days after deploying the fix — look for the metric moving from "Poor" to "Needs Improvement" or "Good" at the 75th percentile. For faster feedback, use a RUM (Real User Monitoring) tool like web-vitals.js sending to GA4 or a custom endpoint — you\'ll see field data within hours of deploying. Search Console Core Web Vitals report shows the same CrUX data on a per-URL basis over time.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Measure in both lab (Lighthouse, WebPageTest) and field (CrUX, RUM) — Google ranks on field data; lab tools identify root causes.',
    mustKnow: [
      'Lab data = synthetic, reproducible; field data = real users, what Google uses for ranking',
      'CrUX uses a 28-day rolling window at the 75th percentile — fixes take up to a month to reflect',
      'FCP = first any content; LCP = largest content element — Google cares about LCP',
      'Run Lighthouse in Incognito (no extensions); run 3× and take median',
      'performance.mark() and measure() create entries in DevTools "User Timings" lane',
      'Lighthouse CI in every PR catches regressions before they reach users',
    ],
    interviewFocus: [
      'What is the difference between lab and field performance data?',
      'How does Google use Core Web Vitals for search ranking?',
      'What is the 75th percentile rule for CWV ratings?',
      'How would you set up continuous performance monitoring in CI?',
    ],
  };
}
