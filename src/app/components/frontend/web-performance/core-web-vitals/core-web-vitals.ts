import { Component } from '@angular/core';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';

@Component({
  standalone: true,
  imports: [TheoryBlockComponent, CodeBlockComponent, QuickRefComponent, ChallengeBlockComponent,
            QuizBlockComponent, QnaBlockComponent, PageMetaComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './core-web-vitals.html',
  styleUrl: './core-web-vitals.scss',
})
export class PerfCoreWebVitals {

  quickRef: QuickRefItem[] = [
    { name: 'LCP',        type: 'operator', desc: 'Largest Contentful Paint — loading speed. Good: &lt; 2.5s · Needs work: &lt; 4.0s · Poor: ≥ 4.0s' },
    { name: 'INP',        type: 'operator', desc: 'Interaction to Next Paint — responsiveness. Good: &lt; 200ms · Needs work: &lt; 500ms · Poor: ≥ 500ms' },
    { name: 'CLS',        type: 'operator', desc: 'Cumulative Layout Shift — visual stability. Good: &lt; 0.1 · Needs work: &lt; 0.25 · Poor: ≥ 0.25' },
    { name: 'FCP',        type: 'method',   desc: 'First Contentful Paint — first DOM paint. Diagnostic metric, not a CWV but tracked by Lighthouse.' },
    { name: 'TTFB',       type: 'method',   desc: 'Time to First Byte — server latency. Good: &lt; 800ms. Directly affects LCP.' },
    { name: 'Lab data',   type: 'keyword',  desc: 'Simulated measurements (Lighthouse, WebPageTest) — deterministic, dev-friendly but no real users.' },
    { name: 'Field data', type: 'keyword',  desc: 'Real user measurements from Chrome UX Report (CrUX). What Google Search ranking actually uses.' },
    { name: 'CrUX',       type: 'keyword',  desc: 'Chrome UX Report — 28-day rolling aggregation of CWV from real Chrome users.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Core Web Vitals matter',
      points: [
        'Google has incorporated CWV into its Search ranking algorithm since 2021. A page that passes all three CWVs may receive a ranking boost over a technically equivalent page that fails them.',
        'CWV are user-centric: they measure how a page <em>feels</em> to a human — how fast it loads, whether it responds quickly to clicks, and whether content jumps around unexpectedly.',
        'The three current CWVs are LCP (Largest Contentful Paint), INP (Interaction to Next Paint), and CLS (Cumulative Layout Shift). Google reviews and updates these metrics over time.',
        'INP replaced FID (First Input Delay) as an official CWV in March 2024. FID only measured the first interaction; INP measures the worst interaction across the entire page lifetime.',
      ]
    },
    {
      heading: 'LCP — Largest Contentful Paint',
      points: [
        'LCP marks the render time of the largest image or text block visible within the viewport. It is the closest CWV to a "page load" metric.',
        'Elements that qualify as the LCP candidate: <code>&lt;img&gt;</code>, <code>&lt;image&gt;</code> inside SVG, <code>&lt;video&gt;</code> poster images, elements with a CSS <code>background-image</code>, and block-level text nodes.',
        'The LCP candidate can change as the page loads — the browser picks the largest visible element at the moment of user interaction or when the page is hidden.',
        'Biggest LCP wins: preload the hero image with <code>&lt;link rel="preload" as="image"&gt;</code>, add <code>fetchpriority="high"</code> to the <code>&lt;img&gt;</code> tag, serve images from a CDN, and never <code>loading="lazy"</code> on the LCP image.',
        'LCP is degraded by: render-blocking resources, slow server TTFB, client-side rendering (the page is blank until JS runs), and unoptimised image formats (JPEG instead of WebP/AVIF).',
      ]
    },
    {
      heading: 'INP — Interaction to Next Paint',
      points: [
        'INP measures the latency of every click, tap, and keyboard interaction across the full page lifetime, then reports the worst one (with outlier filtering at high percentiles).',
        'An interaction is: input delay (time waiting for the main thread) + processing time (event handlers run) + presentation delay (time to commit to screen). INP = sum of all three.',
        'The main enemy of INP is long tasks on the main thread. Any task longer than 50ms can delay input processing. Break long tasks with <code>scheduler.yield()</code> (Chrome 115+) or <code>setTimeout(fn, 0)</code>.',
        'Third-party scripts are a leading cause of poor INP — they occupy the main thread with analytics, ads, and chat widgets. Load them lazily or move them to a Web Worker with Partytown.',
        'INP threshold: good &lt; 200ms, needs improvement &lt; 500ms, poor ≥ 500ms. Measure with Chrome DevTools Performance panel or the <code>web-vitals</code> library.',
      ]
    },
    {
      heading: 'CLS — Cumulative Layout Shift',
      points: [
        'CLS measures the sum of all unexpected layout shift scores during the page lifetime. A layout shift occurs when a visible element changes its position between two frames.',
        'The layout shift score = impact fraction × distance fraction. An element shifting by half the viewport height that takes up half the screen would score 0.25 × 0.5 = 0.125.',
        'Common CLS culprits: images without explicit <code>width</code> and <code>height</code> attributes, ads injected above content, web fonts causing FOIT/FOUT, and dynamically injected banners above existing content.',
        'Fix: always set <code>width</code> and <code>height</code> on images/videos, use <code>aspect-ratio</code> or <code>min-height</code> on ad slots, use <code>font-display: swap</code> with <code>size-adjust</code> to reduce font-shift impact.',
        'Animations that change <code>top</code>, <code>left</code>, <code>width</code>, or <code>height</code> cause CLS. Use <code>transform: translate()</code> instead — it runs on the compositor thread and does not trigger layout.',
      ]
    },
    {
      heading: 'Lab vs Field data',
      points: [
        '<strong>Lab data</strong> (Lighthouse, WebPageTest): runs in a simulated environment with fixed throttling. Fully reproducible, great for catching regressions in CI, but does not reflect real-world network diversity.',
        '<strong>Field data</strong> (CrUX): aggregated from real Chrome users on real devices over 28 days. This is what Google Search actually uses. A page can pass Lighthouse and still fail CrUX if real users have worse connections.',
        'Use both: Lighthouse in CI to catch new regressions fast, and PageSpeed Insights / Search Console Core Web Vitals report to understand your real-user baseline.',
        'The <code>web-vitals</code> npm library lets you collect field data from your own visitors and send it to any analytics endpoint. Use <code>onLCP</code>, <code>onINP</code>, <code>onCLS</code> callbacks.',
      ]
    },
    {
      heading: 'Tools for measuring CWVs',
      points: [
        '<strong>Chrome DevTools</strong>: Performance panel shows LCP and INP markers; Rendering panel has Layout Shift Regions overlay for CLS debugging.',
        '<strong>Lighthouse</strong>: Built into DevTools (Lighthouse tab) and available as a CLI. Gives a single score plus per-metric breakdowns and audit suggestions.',
        '<strong>PageSpeed Insights</strong>: Combines Lighthouse (lab) with CrUX (field) data in one report. Free, uses the same data Google Search uses.',
        '<strong>Web Vitals Extension</strong>: Chrome extension that shows CWV badges in real-time on any page during your own browsing session.',
        '<strong>Search Console Core Web Vitals report</strong>: Shows field data grouped by URL pattern, categorised as Good / Needs Improvement / Poor.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'web-vitals library',
      language: 'typescript',
      code: `import { onLCP, onINP, onCLS } from 'web-vitals';

// Send each metric to your analytics endpoint
function sendToAnalytics({ name, value, rating, id }: { name: string; value: number; rating: string; id: string }) {
  navigator.sendBeacon('/analytics', JSON.stringify({ name, value, rating, id }));
}

onLCP(sendToAnalytics);   // fires when LCP is determined (once per page)
onINP(sendToAnalytics);   // fires on visibilitychange or pagehide (worst INP so far)
onCLS(sendToAnalytics);   // fires on visibilitychange or pagehide (cumulative score)

// Rating values: 'good' | 'needs-improvement' | 'poor'`
    },
    {
      label: 'Preload LCP image',
      language: 'html',
      code: `<!-- In <head>: preload the hero image early in the request waterfall -->
<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">

<!-- On the <img> tag: hint to the browser this is the priority image -->
<img
  src="/hero.webp"
  alt="Hero banner"
  width="1200"
  height="630"
  fetchpriority="high"
  decoding="async"
>

<!-- NEVER lazy-load the LCP image — it defeats the purpose -->
<!-- BAD: <img src="/hero.webp" loading="lazy"> -->`
    },
    {
      label: 'Fix CLS — image dimensions',
      language: 'html',
      code: `<!-- BAD: no dimensions → browser allocates 0×0 then reflowed when image loads -->
<img src="/product.jpg" alt="Product">

<!-- GOOD: explicit dimensions → browser reserves space before image arrives -->
<img src="/product.jpg" alt="Product" width="400" height="300">

<!-- BETTER: use aspect-ratio in CSS for fluid responsive images -->
<style>
  img { aspect-ratio: 4/3; width: 100%; height: auto; }
</style>

<!-- For ad slots: reserve space upfront -->
<div style="min-height: 250px; contain: layout;">
  <!-- Ad script injected here won't shift other content -->
</div>`
    },
    {
      label: 'Break long tasks (INP)',
      language: 'typescript',
      code: `// BAD: one 200ms synchronous task blocks every interaction
function processLargeList(items: string[]) {
  for (const item of items) {
    heavyComputation(item); // main thread blocked
  }
}

// GOOD: yield to browser between chunks
async function processLargeListAsync(items: string[]) {
  for (let i = 0; i < items.length; i++) {
    heavyComputation(items[i]);
    // Yield every 50 items so the browser can handle interactions
    if (i % 50 === 0) await scheduler.yield(); // Chrome 115+
  }
}

// Fallback for browsers without scheduler.yield()
function yieldToMain() {
  return new Promise<void>(resolve => setTimeout(resolve, 0));
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Lazy-loading the LCP image',
      wrong: '<img src="/hero.webp" loading="lazy" alt="Hero">',
      right: '<img src="/hero.webp" fetchpriority="high" alt="Hero" width="1200" height="630">',
      explanation: 'loading="lazy" tells the browser to defer the image until it is near the viewport. For the hero image (which IS the LCP element), this actively delays LCP. Always use fetchpriority="high" on the LCP image instead.',
    },
    {
      title: 'Confusing lab scores with real-user CWV',
      wrong: '// Lighthouse score: 98. Ship it! CWV must be passing.',
      right: '// Check PageSpeed Insights Field Data tab + Search Console CWV report',
      explanation: 'Lighthouse runs under simulated throttling on a fast machine. Real users have slower phones, worse connections, and third-party scripts you can\'t control. A high lab score does NOT guarantee passing CrUX field data.',
    },
    {
      title: 'Using top/left animations instead of transform',
      wrong: '.slide { transition: left 0.3s; } .slide.open { left: 0; }',
      right: '.slide { transition: transform 0.3s; } .slide.open { transform: translateX(0); }',
      explanation: 'Animating top, left, width, or height triggers layout recalculation on every frame, which causes CLS and jank. transform and opacity run on the compositor thread — zero layout cost and zero CLS contribution.',
    },
    {
      title: 'Omitting width/height on images',
      wrong: '<img src="/product.jpg" alt="Product">',
      right: '<img src="/product.jpg" alt="Product" width="400" height="300">',
      explanation: 'Without explicit dimensions, the browser allocates 0×0 for the image. When the image loads and its real size is known, everything below shifts — directly causing CLS. Setting width and height (or using aspect-ratio in CSS) reserves space upfront.',
    },
    {
      title: 'Measuring only FCP and ignoring INP',
      wrong: '// onFCP fires fast, score looks good — page is responsive!',
      right: 'onINP(metric => sendToAnalytics(metric)); // measure actual interaction latency',
      explanation: 'FCP only shows when pixels first appear — it says nothing about interactivity. INP measures how long the user waits after clicking. Heavy event handlers, synchronous third-party scripts, and large JS bundles all tank INP while leaving FCP untouched.',
    },
    {
      title: 'Not preloading the LCP image',
      wrong: '<!-- No preload → image discovered late in the waterfall -->',
      right: '<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">',
      explanation: 'Without a preload hint, the browser only discovers the LCP image when the HTML parser reaches the <img> tag, which may be after render-blocking CSS and above-the-fold scripts. A preload in <head> moves the request to the highest priority immediately.',
    },
  ];

  challenge: Challenge = {
    title: 'Diagnose CWV issues on a sample page',
    language: 'html',
    description: 'The HTML below has three CWV problems. Identify each one and write the fix inline as a comment. Hints: look for missing image dimensions, a lazy-loaded hero, and an animation that causes layout shift.',
    hints: [
      'Which attribute prevents the hero image from loading eagerly?',
      'What is missing from the product images that would prevent CLS?',
      'The .banner animation changes a layout-triggering property — which compositor-friendly alternative should you use instead?',
    ],
    starterCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Product Page</title>
  <style>
    /* Problem 3: layout-shift animation */
    .banner { position: fixed; bottom: -80px; transition: bottom 0.4s; }
    .banner.show { bottom: 0; }
  </style>
</head>
<body>
  <!-- Problem 1: lazy-loaded hero (LCP element) -->
  <img src="/hero.webp" alt="Hero" loading="lazy">

  <!-- Problem 2: images without dimensions -->
  <img src="/product-1.jpg" alt="Product 1">
  <img src="/product-2.jpg" alt="Product 2">

  <div class="banner">Cookie consent</div>
</body>
</html>`,
    solution: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Product Page</title>
  <!-- Fix 1: preload the LCP image with high priority -->
  <link rel="preload" as="image" href="/hero.webp" fetchpriority="high">
  <style>
    /* Fix 3: use transform instead of bottom to avoid layout shift */
    .banner { position: fixed; bottom: 0; transform: translateY(100%); transition: transform 0.4s; }
    .banner.show { transform: translateY(0); }
  </style>
</head>
<body>
  <!-- Fix 1: remove loading="lazy" and add fetchpriority="high" -->
  <img src="/hero.webp" alt="Hero" fetchpriority="high" width="1200" height="630">

  <!-- Fix 2: add explicit width and height to prevent CLS -->
  <img src="/product-1.jpg" alt="Product 1" width="400" height="300">
  <img src="/product-2.jpg" alt="Product 2" width="400" height="300">

  <div class="banner">Cookie consent</div>
</body>
</html>`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which Core Web Vital measures how long the largest image or text block takes to render?',
      options: ['CLS', 'INP', 'LCP', 'FCP'],
      answer: 2,
      explanation: 'LCP (Largest Contentful Paint) measures render time of the largest visible element. FCP is the first paint of any DOM content, CLS is layout stability, and INP is interaction responsiveness.',
    },
    {
      q: 'INP replaced which older metric as an official Core Web Vital in March 2024?',
      options: ['FCP', 'TTFB', 'FID', 'TBT'],
      answer: 2,
      explanation: 'INP replaced FID (First Input Delay) in March 2024. FID only measured the delay before the first user interaction was processed; INP measures the worst interaction latency across the full page lifetime.',
    },
    {
      q: 'A page has a Lighthouse performance score of 95. Which statement is most accurate?',
      options: [
        'The page will definitely rank better in Google Search',
        'Real users are having a good experience on this page',
        'Lab performance is good but CrUX field data may still be poor',
        'CLS is under 0.1 on this page',
      ],
      answer: 2,
      explanation: 'Lighthouse is lab data — simulated on a fast machine under controlled throttling. CrUX field data reflects real users on real devices with real third-party scripts. These can differ significantly. Google ranking uses CrUX, not Lighthouse scores.',
    },
    {
      q: 'Which CSS property change does NOT cause a layout shift (CLS)?',
      options: ['top', 'left', 'transform: translateY()', 'height'],
      answer: 2,
      explanation: 'transform: translateY() runs on the compositor thread and does not trigger layout recalculation, so it causes zero CLS. Changing top, left, or height all trigger layout and can contribute to CLS.',
    },
    {
      q: 'What is the "Good" threshold for INP?',
      options: ['< 100ms', '< 200ms', '< 300ms', '< 500ms'],
      answer: 1,
      explanation: 'The INP "Good" threshold is under 200ms. "Needs improvement" is under 500ms. 500ms or more is "Poor". These thresholds are based on user perception research — delays above 200ms are noticeable as sluggish.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does Google actually use Core Web Vitals for ranking?',
      a: 'Google uses CrUX (Chrome UX Report) field data, not lab scores. For a URL to be eligible for a "page experience" signal boost, it needs 75% or more of its real-user visits to fall in the "Good" band for all three CWVs. The signal is one of many ranking factors — great content still outweighs a slightly poor CWV score.',
    },
    {
      q: 'Can a page pass Lighthouse but fail Google\'s CWV assessment?',
      a: 'Yes, and it happens often. Lighthouse simulates throttling on a controlled machine without third-party scripts installed in the browser. Real users bring slow 3G connections, mid-range Android phones, and browser extensions that inject scripts. A chat widget or analytics tool running on real devices can tank INP while being invisible in Lighthouse.',
    },
    {
      q: 'What is the difference between FCP and LCP?',
      a: 'FCP (First Contentful Paint) measures when the browser first renders any DOM content — even a spinner or a loading skeleton. LCP measures when the page\'s most significant content (the largest image or text block) is visible. A page can have great FCP (skeleton appears quickly) but terrible LCP (actual content loads slowly after the skeleton). Only LCP is a Core Web Vital.',
    },
    {
      q: 'My images have correct width/height but I still see CLS. What else could cause it?',
      a: 'Common non-image CLS causes: (1) Web fonts — text reflows when the web font loads and has different metrics than the fallback; fix with font-display: swap and size-adjust. (2) Dynamic banner injection — ads or cookie banners inserted above existing content push everything down. (3) Accordion/tab content that expands and pushes elements below. (4) Embeds (Twitter, YouTube) without reserved height. (5) CSS animations using top/left/height rather than transform.',
    },
    {
      q: 'How do I identify which specific interaction is causing poor INP?',
      a: 'Use Chrome DevTools: open the Performance panel, check "Web Vitals" in the toolbar, then click around the page. Each interaction appears as an INP marker in the timeline. Click the marker to see input delay, processing time (event handler duration), and presentation delay in the flame chart. The web-vitals library\'s onINP callback also returns an attribution object with the specific element and event type that triggered the worst INP.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Core Web Vitals (LCP, INP, CLS) are Google\'s user-centric metrics for loading, interactivity, and visual stability — they directly influence Search ranking.',
    mustKnow: [
      'LCP < 2.5s: preload hero image, add fetchpriority="high", never lazy-load LCP element, use CDN',
      'INP < 200ms: break long tasks with scheduler.yield(), load third-party scripts lazily, avoid blocking event handlers',
      'CLS < 0.1: set width/height on images, use transform not top/left for animations, reserve space for ads/fonts',
      'Field data (CrUX) is what Google uses — lab scores (Lighthouse) can look good while field data is poor',
      'INP replaced FID in March 2024 — FID only measured first interaction; INP measures the worst across page lifetime',
      'web-vitals library: onLCP, onINP, onCLS callbacks let you collect CWV from your own real users',
    ],
    interviewFocus: [
      'Explain what each CWV measures and its "Good" threshold — LCP 2.5s, INP 200ms, CLS 0.1',
      'What is the difference between lab data and field data, and which does Google rank with?',
      'A page has a 95 Lighthouse score but fails Google\'s CWV assessment — how is that possible?',
      'How would you fix poor CLS caused by web fonts? (font-display: swap + size-adjust)',
      'What replaced FID as a Core Web Vital and why is it a better metric?',
    ],
  };
}
