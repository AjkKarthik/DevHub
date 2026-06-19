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
  selector: 'app-perf-performance-budgets',
  standalone: true,
  imports: [CommonModule, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './performance-budgets.html',
  styleUrl: './performance-budgets.scss',
})
export class PerfPerformanceBudgets {

  quickRef: QuickRefItem[] = [
    { name: 'Performance budget',  type: 'keyword', desc: 'A threshold for a metric (bundle size, Lighthouse score, LCP) — builds fail if exceeded' },
    { name: 'Lighthouse CI (LHCI)', type: 'keyword', desc: 'Official CLI to run Lighthouse audits in CI/CD — asserts scores, uploads reports to a server' },
    { name: 'lhci autorun',        type: 'keyword', desc: 'Single command: collect → assert → upload — runs Lighthouse, checks budgets, stores results' },
    { name: 'bundlesize',          type: 'keyword', desc: 'npm package that asserts gzipped file size limits per bundle chunk in CI' },
    { name: 'SpeedCurve',          type: 'keyword', desc: 'Continuous field + lab monitoring with alerting, competitor benchmarking, and budget dashboards' },
    { name: 'Calibre',             type: 'keyword', desc: 'Performance monitoring SaaS — tracks trends, diffs between deploys, Slack/GitHub alerts' },
    { name: 'PerformanceObserver', type: 'class',   desc: 'Browser API to collect CWV metrics from real users — feed results to your own analytics' },
    { name: 'angular.json budgets', type: 'keyword', desc: 'Angular CLI build budgets for bundle size — warn or error when initial/lazy chunks exceed limit' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why set performance budgets',
      points: [
        'Without budgets, performance degrades incrementally — each PR adds a small amount until the page is slow.',
        'A budget makes performance a first-class requirement: a PR that breaks the budget fails CI, just like a failing test.',
        'Budgets create team-wide accountability — no single team member can silently ship a 500 KB dependency.',
        'Types of budget: file size (< 150 KB gzipped JS), Lighthouse score (> 85), CWV threshold (LCP < 2.5s).',
        'Set budgets based on your current state minus 10% — ambitious enough to require care, not so tight that every PR fails.',
      ],
    },
    {
      heading: 'Lighthouse CI — automate audits in every PR',
      points: [
        'Install: npm install -g @lhci/cli — runs Lighthouse headlessly against a live or local server.',
        'lhci autorun = collect (run Lighthouse N times) + assert (check budgets) + upload (store reports).',
        'lighthouserc.js: configure URLs, number of runs, assertion thresholds, and upload target.',
        'GitHub Actions: free lhci/action@v0.9.0 adds a status check and links to the HTML report on every PR.',
        'Results: if any assertion fails, the CI step exits non-zero — the PR cannot merge without investigation.',
      ],
    },
    {
      heading: 'Bundle size budgets',
      points: [
        'Angular CLI: angular.json → budgets: [{type: "initial", maximumWarning: "500kb", maximumError: "1mb"}].',
        'bundlesize npm package: specify max gzipped size per file pattern — fails CI if exceeded.',
        'size-limit: similar to bundlesize — also measures import cost of library exports.',
        'Lighthouse CI: "resource-summary:script:size" assertion limits total script bytes.',
        'Keep initial bundle < 150 KB gzipped (JS) — each 100 KB costs ~1s on mid-tier mobile.',
      ],
    },
    {
      heading: 'Continuous field monitoring',
      points: [
        'Lab budgets (Lighthouse CI) catch regressions in code; field monitoring catches regressions in real user experience.',
        'SpeedCurve and Calibre: run synthetic tests on a schedule, alert when metrics cross thresholds.',
        'Self-hosted: web-vitals + sendBeacon → custom analytics → alert when P75 LCP > 2.5s for 2 consecutive hours.',
        'Search Console: Core Web Vitals report — shows field data per URL, flags pages failing CWV.',
        'DataStudio / Looker dashboards on BigQuery CrUX data: free, updated weekly, shows 28-day trends.',
      ],
    },
    {
      heading: 'Setting sensible thresholds',
      points: [
        'Initial JS budget: < 150 KB gzipped total; < 50 KB per route chunk.',
        'Total page weight: < 1 MB uncompressed for slow-3G users.',
        'Lighthouse scores: Performance > 80 (warning), > 70 (error) — adjust to your current baseline.',
        'Core Web Vitals lab proxies: LCP < 2500ms, TBT < 300ms, CLS < 0.1.',
        'Regression threshold: fail CI if any metric degrades more than 10% vs the last main-branch run.',
      ],
    },
    {
      heading: 'Fixing budget violations',
      points: [
        'Bundle over budget: run rollup-plugin-visualizer, find the largest unexpected dependency, replace or remove it.',
        'Lighthouse score regression: check which audit dropped — most regressions trace to one root cause (added render-blocking script, LCP image lost preload, new third-party added).',
        'CWV regression in field: check RUM data — segment by device/connection, find when the regression started using deploy timestamps.',
        'Temporary exemption: document in PR why the budget is exceeded and set a ticket to fix it — don\'t just raise the budget.',
        'Budget ratchet: after fixing, lower the budget slightly to prevent returning to the old level.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Lighthouse CI config',
      language: 'typescript',
      code: `// lighthouserc.js — project configuration for Lighthouse CI
module.exports = {
  ci: {
    collect: {
      // URLs to audit — use localhost for local server, staging URL for CI
      url: [
        'http://localhost:4200/',
        'http://localhost:4200/dashboard',
        'http://localhost:4200/product/123',
      ],
      numberOfRuns: 3,      // median of 3 runs — reduces variance
      startServerCommand: 'npx ng serve --port 4200',  // auto-start dev server
      startServerReadyPattern: 'Local:',               // wait for this output
    },
    assert: {
      preset: 'lighthouse:recommended',  // start with recommended, then customise
      assertions: {
        // CWV thresholds (lab proxies)
        'largest-contentful-paint':  ['error', { maxNumericValue: 2500 }],
        'total-blocking-time':        ['error', { maxNumericValue: 300 }],
        'cumulative-layout-shift':    ['error', { maxNumericValue: 0.1 }],
        'first-contentful-paint':     ['warn',  { maxNumericValue: 1800 }],
        // Lighthouse category scores
        'categories:performance':     ['warn',  { minScore: 0.8 }],
        'categories:accessibility':   ['error', { minScore: 0.9 }],
        // Resource size budgets
        'resource-summary:script:size':      ['error', { maxNumericValue: 200000 }],  // 200KB total JS
        'resource-summary:stylesheet:size':  ['warn',  { maxNumericValue: 50000 }],   // 50KB total CSS
        // Third-party blocking time
        'third-party-summary':        ['warn',  { maxLength: 5 }],  // max 5 third-party domains
      },
    },
    upload: {
      target: 'temporary-public-storage',  // free, no server required
      // Or self-host: target: 'lhci', serverBaseUrl: 'https://lhci.example.com'
    },
  },
};`,
    },
    {
      label: 'GitHub Actions workflow',
      language: 'bash',
      code: `# .github/workflows/lighthouse.yml
# Runs Lighthouse CI on every PR — fails if budgets are exceeded

name: Lighthouse CI

on: [push, pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Build production bundle
        run: npx ng build --configuration=production

      - name: Audit with Lighthouse CI
        uses: treosh/lighthouse-ci-action@v11
        with:
          configPath: ./lighthouserc.js
          uploadArtifacts: true          # save HTML reports as workflow artifact
          temporaryPublicStorage: true   # public link in PR comment

      # Bundle size check — separate step
      - name: Check bundle size
        run: npx bundlesize
        # Reads .bundlesizerc or "bundlesize" in package.json

# package.json — bundlesize config
# "bundlesize": [
#   { "path": "./dist/browser/main.*.js", "maxSize": "150 kB" },
#   { "path": "./dist/browser/styles.*.css", "maxSize": "30 kB" }
# ]`,
    },
    {
      label: 'Angular CLI budgets',
      language: 'typescript',
      code: `// angular.json — built-in bundle size budgets
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kB",  // warn in build output
                  "maximumError": "1MB"        // error — build exits non-zero
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "4kB",
                  "maximumError": "8kB"
                },
                {
                  "type": "anyScript",        // any individual JS chunk
                  "maximumWarning": "250kB",
                  "maximumError": "500kB"
                }
              ]
            }
          }
        }
      }
    }
  }
}

// Budget types:
// "initial"          — total initial bundle (downloaded before app boots)
// "anyScript"        — any single JS chunk (initial or lazy)
// "anyComponentStyle" — per-component SCSS output size
// "allScript"        — total JS across all chunks
// "any"              — any file type`,
    },
    {
      label: 'Custom CI budget assertion',
      language: 'typescript',
      code: `// scripts/check-budgets.ts — run after ng build
// Reads dist/ and asserts file sizes before deploy

import { readdirSync, statSync } from 'fs';
import { join } from 'path';

interface Budget {
  pattern: RegExp;
  maxKb: number;
  label: string;
}

const BUDGETS: Budget[] = [
  { pattern: /main\.[a-z0-9]+\.js$/,   maxKb: 120, label: 'main bundle' },
  { pattern: /styles\.[a-z0-9]+\.css$/, maxKb: 30,  label: 'styles' },
  { pattern: /chunk-[a-z0-9]+\.js$/,    maxKb: 50,  label: 'lazy chunk' },
];

function gzipSizeKb(filepath: string): number {
  // Use actual gzip for accuracy; approximation: file size × 0.3
  return Math.round(statSync(filepath).size * 0.3 / 1024);
}

const distFiles = readdirSync('dist/browser');
let failed = false;

for (const budget of BUDGETS) {
  const matches = distFiles.filter(f => budget.pattern.test(f));
  for (const file of matches) {
    const sizeKb = gzipSizeKb(join('dist/browser', file));
    const status = sizeKb <= budget.maxKb ? '✓' : '✗ BUDGET EXCEEDED';
    console.log(\`\${status} \${budget.label}: \${sizeKb}kB / \${budget.maxKb}kB (\${file})\`);
    if (sizeKb > budget.maxKb) failed = true;
  }
}

if (failed) process.exit(1);  // non-zero exit fails CI`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Setting budgets after performance has already degraded',
      wrong: `// Page currently has LCP = 4.2s, TBT = 800ms
// Setting "good" thresholds immediately
assertions: {
  'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
  'total-blocking-time':      ['error', { maxNumericValue: 300 }],
}
// Result: CI fails on EVERY commit — team ignores it`,
      right: `// Set budgets at current level + 10% buffer initially
// Then tighten incrementally as you fix performance issues
assertions: {
  'largest-contentful-paint': ['warn',  { maxNumericValue: 4500 }],  // current: 4.2s + buffer
  'total-blocking-time':      ['warn',  { maxNumericValue: 900 }],   // current: 800ms + buffer
}
// Next sprint: fix LCP → tighten budget to 3s. Repeat.`,
      explanation: 'Setting aspirational budgets immediately creates a CI that always fails — teams learn to ignore it. Start with your current metrics + 10% buffer to catch regressions, then tighten the budget as you improve. This makes budgets a ratchet, not a wall.',
    },
    {
      title: 'Only running Lighthouse once per CI run',
      wrong: `// Single run — Lighthouse scores vary by ±10 points due to system load
collect:
  numberOfRuns: 1
// A PR might show 78 vs the baseline 80 — is this a real regression?`,
      right: `// Run 3× — Lighthouse CI uses the median; variance drops to ±3 points
collect:
  numberOfRuns: 3
// Now a drop from 80 to 70 is reliable signal — not noise`,
      explanation: 'Lighthouse scores vary between runs due to CPU load, network jitter, and GC pauses. A single run can swing ±10 points, making it hard to know if a regression is real. Three runs with the median reduces variance to ±3 points — reliable enough for CI assertions.',
    },
    {
      title: 'Raising the budget instead of fixing the regression',
      wrong: `// PR adds moment.js (300KB) — bundle budget exceeded
// "Easy fix": just raise the budget
budgets: [{ type: 'initial', maximumError: '1.5MB' }]  // was 1MB
// Repeat every few months until the page is 5MB`,
      right: `// Investigate and fix the root cause
// 1. Run bundle analyser: npx vite build && open dist/stats.html
// 2. Replace moment.js with date-fns (2KB) or Temporal API
// 3. Keep the budget at 1MB — or lower it to 900KB as a ratchet`,
      explanation: 'Raising the budget is the path of least resistance but defeats its purpose. Every raised budget normalises the new higher baseline — repeat a few times and performance is back where it was. Investigate the root cause, fix it, and optionally lower the budget to prevent regressing to the old level.',
    },
    {
      title: 'Not measuring the pages users actually visit',
      wrong: `// Lighthouse CI only audits the homepage
urls: ['http://localhost:4200/']
// The /checkout page with Stripe + heavy React tree is 5× slower — never caught`,
      right: `// Audit every critical user journey page
urls: [
  'http://localhost:4200/',
  'http://localhost:4200/products',
  'http://localhost:4200/product/demo-id',
  'http://localhost:4200/checkout',
]`,
      explanation: 'The homepage is usually the most optimised page in any app. Product pages, checkout flows, and dashboards are often 3–5× slower but never tested. Budget your most revenue-critical pages, not just your marketing page.',
    },
    {
      title: 'Ignoring field data regressions while lab tests pass',
      wrong: `// Lab (Lighthouse CI): LCP 1.8s — budget passes ✓
// Field (CrUX): LCP 4.2s on mobile — failing CWV
// No field monitoring → regression undetected for 3 months`,
      right: `// Add field monitoring alongside lab tests
// Option 1: web-vitals + GA4 custom events → dashboard
// Option 2: SpeedCurve / Calibre for automated field alerting
// Alert when: P75 LCP > 2.5s, compared to prior 7-day baseline`,
      explanation: 'Lab tests run on a fast simulated device — they often miss real-user performance problems on slow devices and connections. Field monitoring (RUM or CrUX) is required to catch what lab tests miss. Run both: lab catches code regressions; field catches real-user degradations.',
    },
    {
      title: 'Setting a single global budget for all chunks',
      wrong: `// All chunks must be < 150KB — but vendor chunk with React is 200KB
budgets: [{ type: 'anyScript', maximumError: '150kB' }]
// Legitimate vendor chunk fails; only fix is to raise the budget globally`,
      right: `// Separate budgets by chunk type
budgets: [
  { type: 'initial',   maximumWarning: '300kB', maximumError: '500kB' },  // full initial
  { type: 'anyScript', maximumWarning: '100kB', maximumError: '200kB' },  // per chunk
]
// Or: use bundlesize with per-file patterns for fine-grained control`,
      explanation: 'A single anyScript budget applies to ALL chunks equally — vendor bundles (React, Angular framework) legitimately exceed per-chunk limits. Separate initial (total first load) from lazy chunk budgets, and use per-file patterns in bundlesize to set accurate limits per chunk type.',
    },
  ];

  challenge: Challenge = {
    title: 'Write a lighthouserc.js for a production Angular app',
    language: 'typescript',
    description: `Write a complete lighthouserc.js for an Angular e-commerce app with these requirements:
- Audit 3 pages: homepage, product listing (/products), and checkout (/checkout)
- Run 3 times per URL for reliable median scores
- Assert: LCP < 2.5s, TBT < 300ms, CLS < 0.1
- Warn if Lighthouse Performance score drops below 80
- Error if total script size exceeds 200 KB
- Upload results to temporary public storage (free, no server needed)
- Start the Angular dev server automatically before collecting`,
    hints: [
      'startServerCommand launches the server; startServerReadyPattern waits for it',
      'numberOfRuns: 3 → Lighthouse CI uses the median automatically',
      'maxNumericValue for LCP is in milliseconds (2500)',
      'resource-summary:script:size maxNumericValue is in bytes (200000)',
      'categories:performance minScore is 0-1 (0.8 = 80)',
    ],
    starterCode: `// lighthouserc.js — fill in the configuration
module.exports = {
  ci: {
    collect: {
      // TODO: add 3 URLs, 3 runs, server start command
    },
    assert: {
      assertions: {
        // TODO: LCP, TBT, CLS, performance score, script size
      },
    },
    upload: {
      // TODO: temporary public storage
    },
  },
};`,
    solution: `// lighthouserc.js — complete configuration
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:4200/',
        'http://localhost:4200/products',
        'http://localhost:4200/checkout',
      ],
      numberOfRuns: 3,
      startServerCommand: 'npx ng serve --port 4200 --configuration=production',
      startServerReadyPattern: 'Local:.*4200',
    },
    assert: {
      assertions: {
        // Core Web Vitals (lab proxies)
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'total-blocking-time':       ['error', { maxNumericValue: 300 }],
        'cumulative-layout-shift':   ['error', { maxNumericValue: 0.1 }],
        // Lighthouse score
        'categories:performance': ['warn', { minScore: 0.8 }],
        // Bundle size: 200KB total JS in bytes
        'resource-summary:script:size': ['error', { maxNumericValue: 200000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};

// Run with: lhci autorun
// GitHub Actions: use treosh/lighthouse-ci-action@v11`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why should you run Lighthouse 3 times in CI instead of once?',
      options: [
        'To get a higher average score by taking the best run',
        'To reduce variance — single runs swing ±10 points due to system load; 3-run median drops this to ±3',
        'Because Lighthouse CI requires a minimum of 3 runs to generate reports',
        'To test across three different network speeds automatically',
      ],
      answer: 1,
      explanation: 'Lighthouse scores vary between runs due to CPU load, GC pauses, and network jitter. A single run can swing ±10 points — making it impossible to know if a drop is a real regression or noise. Running 3 times and taking the median reduces variance to ±3 points, giving reliable signal.',
    },
    {
      q: 'What is a "budget ratchet" in performance engineering?',
      options: [
        'A Webpack plugin that automatically compresses files to meet budget',
        'The practice of tightening the budget slightly after each improvement to prevent reverting to the old baseline',
        'A CI tool that auto-fixes performance violations in pull requests',
        'A Lighthouse audit that measures budget adherence over time',
      ],
      answer: 1,
      explanation: 'A ratchet only moves in one direction — after fixing a performance issue, you lower the budget threshold to lock in the improvement. This prevents future PRs from reintroducing the same problem. For example: fix LCP from 4s to 2s → tighten budget from 4.5s to 2.5s.',
    },
    {
      q: 'What does lhci autorun do?',
      options: [
        'Automatically fixes performance issues detected by Lighthouse',
        'Runs three phases: collect (run Lighthouse), assert (check thresholds), and upload (store reports)',
        'Starts a local Lighthouse CI server and dashboard',
        'Monitors your production site on a schedule and sends alerts',
      ],
      answer: 1,
      explanation: 'lhci autorun is a single command that runs all three Lighthouse CI phases: collect (launch Lighthouse N times against your URLs), assert (compare results to your lighthouserc.js thresholds and exit non-zero if any fail), and upload (store HTML reports to your configured target).',
    },
    {
      q: 'Which Angular CLI budget type limits the TOTAL initial download size?',
      options: [
        'anyScript',
        'initial',
        'allScript',
        'anyComponentStyle',
      ],
      answer: 1,
      explanation: '"initial" covers the combined size of all JavaScript and CSS that must be downloaded before the app boots (the initial bundle). "anyScript" applies per individual JS chunk. "allScript" covers ALL JS chunks combined (initial + lazy). "anyComponentStyle" limits per-component SCSS output.',
    },
    {
      q: 'What is the correct first step when a Lighthouse CI budget fails?',
      options: [
        'Raise the budget threshold to unblock the PR',
        'Run the bundle analyser or check which Lighthouse audit dropped to find the root cause',
        'Disable the failing assertion temporarily and file a ticket',
        'Re-run CI — Lighthouse results are too variable to trust a single failure',
      ],
      answer: 1,
      explanation: 'Raising the budget defeats its purpose — it normalises the regression. The correct first step is diagnosis: run rollup-plugin-visualizer to find unexpected bundle size increases, or check which specific Lighthouse audit regressed (render-blocking resource added, LCP image preload removed, etc.) and fix that.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I get a free Lighthouse CI server for storing report history?',
      a: 'The easiest free option is target: "temporary-public-storage" — Lighthouse CI uploads reports to a Google-managed server and gives you a public URL valid for ~7 days. For persistent history, you can self-host the LHCI server (open-source, runs on any Node.js host — free tier on Render or Railway). GitHub Actions artifact uploads also preserve HTML reports for the duration of your artifact retention policy.',
    },
    {
      q: 'How do I enforce bundle size limits without Lighthouse CI?',
      a: 'Three options: (1) Angular CLI budgets in angular.json — built-in, fail the ng build command. (2) bundlesize npm package — runs after build, asserts gzipped file sizes per pattern. (3) size-limit — more nuanced, can measure the import cost of specific exports. All three exit non-zero on failure, making them composable with any CI system.',
    },
    {
      q: 'Should I block PRs on Lighthouse score or CWV thresholds?',
      a: 'Use CWV lab metrics (LCP, TBT, CLS) as hard errors — they directly correlate with real user experience and search ranking. Use Lighthouse category score as warnings — the score formula changes between Lighthouse versions and can drop without real regression. Never block PRs on the overall score number alone; always assert specific metric thresholds that you understand.',
    },
    {
      q: 'What is the difference between SpeedCurve, Calibre, and Lighthouse CI?',
      a: 'Lighthouse CI is open-source and developer-operated — you run it in your own CI pipeline for per-PR checks. SpeedCurve and Calibre are commercial SaaS tools that run synthetic tests continuously on a schedule (hourly/daily), track trends over weeks/months, compare against competitors, and send Slack/PagerDuty alerts when budgets are exceeded. Use Lighthouse CI for code-level regression prevention; use SpeedCurve/Calibre for continuous monitoring of production.',
    },
    {
      q: 'How do I set performance budgets for third-party scripts specifically?',
      a: 'In Lighthouse CI: "third-party-summary" assertion — maxLength limits the number of distinct third-party domains; "third-party-facades" audit checks that heavy third-party widgets use facades. In your angular.json budget there\'s no per-origin split, but bundlesize can pattern-match vendor chunks. Custom: use the Resource Timing API in RUM to measure each third-party origin\'s transfer size and block-time, then assert < your defined budget.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Performance budgets fail CI when metrics regress — use Lighthouse CI for per-PR score/CWV checks and Angular CLI budgets for bundle size; tighten budgets as a ratchet after each fix.',
    mustKnow: [
      'Budget types: file size, Lighthouse score, CWV threshold — use all three',
      'Lighthouse CI: collect (3 runs) → assert (check budgets) → upload (store reports)',
      'Angular CLI angular.json budgets: initial / anyScript / anyComponentStyle',
      'Always investigate budget failures — raising the threshold defeats the purpose',
      'Lab budgets (LHCI) catch code regressions; field monitoring (RUM/CrUX) catches real-user regressions',
      'Budget ratchet: tighten the budget after fixing to lock in the improvement',
    ],
    interviewFocus: [
      'What is a performance budget and why does it matter?',
      'How would you set up Lighthouse CI in a GitHub Actions pipeline?',
      'What should you do when a performance budget is exceeded in CI?',
      'What is the difference between lab and field performance monitoring?',
    ],
  };
}
