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
  selector: 'app-perf-critical-rendering-path',
  standalone: true,
  imports: [CommonModule, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './critical-rendering-path.html',
  styleUrl: './critical-rendering-path.scss',
})
export class PerfCriticalRenderingPath {

  quickRef: QuickRefItem[] = [
    { name: 'Render-blocking CSS',   type: 'syntax',   desc: '<link rel="stylesheet"> in <head> blocks paint until fully downloaded and parsed' },
    { name: 'Render-blocking JS',    type: 'syntax',   desc: 'Parser-blocking <script> halts HTML parsing; download + execute before browser continues' },
    { name: 'defer',                 type: 'keyword',  desc: 'Script downloads in parallel; executes after HTML parsed, before DOMContentLoaded' },
    { name: 'async',                 type: 'keyword',  desc: 'Script downloads in parallel; executes immediately when ready — may block parser' },
    { name: 'type="module"',         type: 'keyword',  desc: 'Module scripts are deferred by default; also enables top-level await and strict mode' },
    { name: 'Critical CSS',          type: 'syntax',   desc: 'Above-the-fold styles inlined in <style> tag to unblock first paint without a network round-trip' },
    { name: 'preload',               type: 'keyword',  desc: '<link rel="preload"> fetches a resource at high priority before the parser discovers it' },
    { name: 'FCP',                   type: 'keyword',  desc: 'First Contentful Paint — time to first text or image; CRP optimisation directly reduces FCP' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The Critical Rendering Path — six stages',
      points: [
        'Stage 1 — HTML parse → DOM: browser parses HTML bytes into a DOM tree. Parser stops when it hits a parser-blocking script.',
        'Stage 2 — CSS parse → CSSOM: all linked stylesheets downloaded and parsed into a CSSOM tree. CSSOM blocks rendering (not parsing).',
        'Stage 3 — Render Tree: DOM + CSSOM merged into a tree of only visible nodes (display:none excluded).',
        'Stage 4 — Layout: browser calculates size and position of each render-tree node.',
        'Stage 5 — Paint: pixels are drawn for each node (text, images, backgrounds, borders).',
        'Stage 6 — Composite: painted layers are composited on the GPU and displayed.',
      ],
    },
    {
      heading: 'Render-blocking resources — CSS',
      points: [
        'Every <link rel="stylesheet"> in <head> is render-blocking: the browser cannot paint until the CSS is downloaded AND parsed.',
        'Solution 1 — inline critical CSS: copy above-the-fold styles into a <style> tag in <head>; load the full stylesheet asynchronously.',
        'Solution 2 — media queries: <link rel="stylesheet" media="print"> is still downloaded but NOT render-blocking (low priority).',
        'Solution 3 — HTTP/2 server push or preload: <link rel="preload" as="style"> fetches the CSS at high priority while HTML parses.',
        'Avoid @import inside CSS files — it creates serial requests (import is discovered only after parent CSS downloads).',
      ],
    },
    {
      heading: 'Render-blocking resources — JavaScript',
      points: [
        'A bare <script src="..."> stops HTML parsing: browser downloads + executes the script before continuing.',
        'defer: script downloads in parallel with HTML parsing; executes in order after DOMContentLoaded — safe for most scripts.',
        'async: script downloads in parallel; executes ASAP (may interrupt parsing) — use only for independent scripts (analytics).',
        'type="module": implicitly deferred; also supports top-level await and isolates scope.',
        'Place render-critical inline scripts before </body>, or defer them — never block the parser with third-party scripts.',
      ],
    },
    {
      heading: 'Inlining critical CSS for instant first paint',
      points: [
        'Critical CSS = styles needed to render above-the-fold content without a network round-trip.',
        'Tools: critical (npm), Penthouse, or Critters (webpack plugin) extract critical CSS automatically.',
        'Inline extracted CSS in <style> in <head>; load full stylesheet with <link rel="preload" as="style" onload="this.rel=\'stylesheet\'">.',
        'Keep inlined CSS small (< 14 KB) — larger inline blocks delay the HTML response itself.',
        'Fallback for browsers without JS: <noscript><link rel="stylesheet" href="styles.css"></noscript>.',
      ],
    },
    {
      heading: 'preload, prefetch, and modulepreload',
      points: [
        'preload: <link rel="preload" as="…"> — fetch at high priority NOW; use for fonts, hero images, critical scripts.',
        'prefetch: <link rel="prefetch"> — fetch at low priority for NEXT navigation; does not affect current page speed.',
        'modulepreload: <link rel="modulepreload"> — like preload but also parses and compiles the JS module.',
        'as= attribute is mandatory for preload: as="image", as="font", as="script", as="style" — omitting it fetches at wrong priority.',
        'Preloading too many resources competes for bandwidth and can hurt LCP — preload only 2–3 truly critical resources.',
      ],
    },
    {
      heading: 'Measuring the Critical Rendering Path',
      points: [
        'Chrome DevTools Network panel: "Waterfall" view shows which resources block rendering (thicker left bar = blocked).',
        '"Coverage" tab (DevTools → More Tools → Coverage): shows % of CSS/JS unused on initial load — good for finding critical CSS candidates.',
        'Lighthouse: "Eliminate render-blocking resources" audit lists blocking CSS and JS with estimated savings.',
        'performance.timing (deprecated) or PerformanceNavigationTiming API for programmatic measurement.',
        'DOMContentLoaded fires after HTML + deferred scripts; load fires after all resources — target: DCL < 1 s on fast connections.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Optimised <head>',
      language: 'html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <!-- 1. Inline critical CSS — instant first paint, no network round-trip -->
  <style>
    /* Above-the-fold styles only — keep < 14 KB */
    body { margin: 0; font-family: system-ui, sans-serif; }
    .hero { height: 100vh; display: grid; place-items: center; }
    .hero h1 { font-size: clamp(2rem, 5vw, 4rem); }
  </style>

  <!-- 2. Preload LCP hero image at highest priority -->
  <link rel="preload" as="image" href="hero.avif"
        imagesrcset="hero-400.avif 400w, hero-800.avif 800w, hero-1200.avif 1200w"
        imagesizes="100vw" fetchpriority="high" />

  <!-- 3. Preconnect to critical third-party origins -->
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />

  <!-- 4. Non-critical CSS loaded asynchronously (preload trick) -->
  <link rel="preload" as="style" href="styles.css"
        onload="this.rel='stylesheet'" />
  <noscript><link rel="stylesheet" href="styles.css" /></noscript>

  <!-- 5. Critical script deferred — no parser blocking -->
  <script defer src="app.js"></script>
</head>
<body>
  <!-- content -->
</body>
</html>`,
    },
    {
      label: 'Script loading strategies',
      language: 'html',
      code: `<!-- BLOCKS parser — do not use for non-critical scripts -->
<script src="heavy-library.js"></script>

<!-- defer: parallel download, executes AFTER HTML parsed, in order -->
<!-- Safe for most scripts; replaces the old "put JS at end of body" trick -->
<script defer src="app.js"></script>
<script defer src="analytics.js"></script>  <!-- executes after app.js -->

<!-- async: parallel download, executes IMMEDIATELY when ready -->
<!-- Order is NOT guaranteed; use only for independent scripts -->
<script async src="analytics.js"></script>

<!-- type="module": implicitly deferred + ES module scope -->
<script type="module" src="app.mjs"></script>

<!-- Inline modules are also deferred -->
<script type="module">
  import { init } from './app.mjs';
  init();
</script>

<!-- Legacy fallback for no-module browsers -->
<script nomodule src="app-legacy.js"></script>`,
    },
    {
      label: 'Async CSS loading',
      language: 'html',
      code: `<!-- Pattern: preload as style, flip rel on load -->
<link rel="preload" as="style" href="styles.css"
      onload="this.onload=null;this.rel='stylesheet'" />
<noscript><link rel="stylesheet" href="styles.css" /></noscript>

<!--
  How it works:
  1. rel="preload" → browser fetches at high priority but does NOT apply styles
  2. onload fires when CSS is ready → flip rel to "stylesheet" → styles applied
  3. this.onload=null prevents the handler firing again if the browser re-fires
  4. <noscript> fallback for browsers with JS disabled
-->

<!-- Alternative: loadCSS (Filament Group's polyfill) for older browsers -->
<script>
  function loadCSS(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = href; link.media = 'print';
    link.onload = () => link.media = 'all';
    document.head.appendChild(link);
  }
  loadCSS('/styles.css');
</script>`,
    },
    {
      label: 'Measure with PerformanceObserver',
      language: 'typescript',
      code: `// Observe navigation timing — CRP milestones
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'navigation') {
      const nav = entry as PerformanceNavigationTiming;
      console.log('DNS lookup:',      nav.domainLookupEnd - nav.domainLookupStart, 'ms');
      console.log('TCP connect:',     nav.connectEnd - nav.connectStart, 'ms');
      console.log('TTFB:',            nav.responseStart - nav.requestStart, 'ms');
      console.log('HTML download:',   nav.responseEnd - nav.responseStart, 'ms');
      console.log('DOM parse:',       nav.domInteractive - nav.responseEnd, 'ms');
      console.log('DOMContentLoaded:', nav.domContentLoadedEventEnd - nav.fetchStart, 'ms');
      console.log('Load event:',      nav.loadEventEnd - nav.fetchStart, 'ms');
    }
  }
});
observer.observe({ type: 'navigation', buffered: true });

// Observe resource timing — find render-blocking culprits
const resObs = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    const r = entry as PerformanceResourceTiming;
    if (r.renderBlockingStatus === 'blocking') {
      console.log('RENDER BLOCKING:', r.name, Math.round(r.duration), 'ms');
    }
  }
});
resObs.observe({ type: 'resource', buffered: true });`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Loading third-party scripts without defer or async',
      wrong: `<head>
  <script src="https://cdn.analytics.com/tracker.js"></script>
</head>`,
      right: `<head>
  <script defer src="https://cdn.analytics.com/tracker.js"></script>
</head>`,
      explanation: 'A bare <script> in <head> halts HTML parsing until the script downloads AND executes. A 300 ms analytics script delays the entire page render by 300 ms. Always use defer or async for third-party scripts.',
    },
    {
      title: 'Using @import in CSS files',
      wrong: `/* styles.css */
@import url('fonts.css');    /* discovered only AFTER styles.css downloads */
@import url('theme.css');    /* serial — each waits for the previous */`,
      right: `<!-- Link them directly in HTML — parallel downloads -->
<link rel="stylesheet" href="styles.css" />
<link rel="stylesheet" href="fonts.css" />
<link rel="stylesheet" href="theme.css" />`,
      explanation: '@import creates serial stylesheet downloads: the browser cannot discover fonts.css until styles.css is fully downloaded. Linking all stylesheets in HTML allows parallel downloads.',
    },
    {
      title: 'Preloading too many resources',
      wrong: `<!-- Preloading 8 images, 3 fonts, 5 scripts — all at high priority -->
<link rel="preload" as="image" href="hero.webp" />
<link rel="preload" as="image" href="slide1.webp" />
<link rel="preload" as="image" href="slide2.webp" />
<!-- ... 5 more preloads -->`,
      right: `<!-- Only preload the 1-2 resources that affect LCP/FCP -->
<link rel="preload" as="image" href="hero.webp" fetchpriority="high" />
<!-- Everything else: browser discovers and prioritises naturally -->`,
      explanation: 'Every preloaded resource competes at high priority. Over-preloading delays LCP by starving the actual LCP resource of bandwidth.',
    },
    {
      title: 'Not providing a <noscript> fallback for async CSS',
      wrong: `<!-- Async CSS with no JS fallback — site is unstyled without JS -->
<link rel="preload" as="style" href="styles.css"
      onload="this.rel='stylesheet'" />`,
      right: `<link rel="preload" as="style" href="styles.css"
      onload="this.rel='stylesheet'" />
<noscript><link rel="stylesheet" href="styles.css" /></noscript>`,
      explanation: 'The preload-flip trick relies on the onload JS handler. Without a <noscript> fallback, browsers with JS disabled (or blocked by CSP) never apply the stylesheet.',
    },
    {
      title: 'Inlining too much critical CSS',
      wrong: `<style>
  /* Entire 80 KB stylesheet inlined — delays HTML response */
  /* ... 80KB of CSS ... */
</style>`,
      right: `<style>
  /* Only above-the-fold styles — keep inline CSS < 14 KB */
  body { margin: 0; font-family: system-ui; }
  .hero { min-height: 100vh; }
</style>
<link rel="preload" as="style" href="styles.css" onload="this.rel='stylesheet'" />`,
      explanation: 'Inlining the full stylesheet embeds it in every HTML response, inflating TTFB. Keep inline CSS to < 14 KB (one TCP congestion window) — only the styles needed for above-the-fold content.',
    },
    {
      title: 'Forgetting as= on preload links',
      wrong: `<!-- Missing as= — browser fetches at lowest priority and warns in DevTools -->
<link rel="preload" href="hero.webp" />`,
      right: `<!-- as= tells the browser the resource type for correct priority and caching -->
<link rel="preload" as="image" href="hero.webp" fetchpriority="high" />`,
      explanation: 'Without as=, the browser cannot determine the correct request priority and may fetch the resource twice (once for the preload, once when the img tag is parsed). as= also ensures correct Cache-Control headers are matched.',
    },
  ];

  challenge: Challenge = {
    title: 'Optimise a render-blocking <head>',
    language: 'html',
    description: `The <head> below has five performance issues that block or delay first paint.
Identify and fix all five:

1. A render-blocking third-party analytics script
2. CSS loaded via @import (serial download)
3. Non-critical stylesheet blocking render
4. LCP image not preloaded
5. Missing preconnect to the font origin`,
    hints: [
      'Add defer to the analytics script — it does not need to run before DOM is ready',
      'Remove @import from CSS and link stylesheets directly in HTML for parallel downloads',
      'Load the non-critical print stylesheet with media="print" to prevent render-blocking',
      'Add <link rel="preload" as="image" href="hero.avif" fetchpriority="high"> for the hero image',
      'Add <link rel="preconnect" href="https://fonts.googleapis.com"> before the font link',
    ],
    starterCode: `<head>
  <meta charset="UTF-8" />
  <!-- Issue 1: render-blocking analytics -->
  <script src="https://cdn.analytics.com/a.js"></script>

  <!-- Issue 2: @import causes serial CSS load -->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter');
    @import url('/theme.css');
  </style>

  <!-- Issue 3: non-critical stylesheet blocks render -->
  <link rel="stylesheet" href="/print-styles.css" />

  <!-- Issue 4: LCP image not preloaded -->
  <!-- hero.avif is the LCP element but nothing hints the browser -->

  <!-- Issue 5: no preconnect to font origin -->
  <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700" />
</head>`,
    solution: `<head>
  <meta charset="UTF-8" />

  <!-- Fix 1: defer analytics — no longer parser-blocking -->
  <script defer src="https://cdn.analytics.com/a.js"></script>

  <!-- Fix 5: preconnect to font origin before the font link -->
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

  <!-- Fix 2: link stylesheets directly — parallel downloads, no @import -->
  <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700" />
  <link rel="stylesheet" href="/theme.css" />

  <!-- Fix 3: print stylesheet — non-blocking (low download priority) -->
  <link rel="stylesheet" href="/print-styles.css" media="print" />

  <!-- Fix 4: preload LCP hero image at high priority -->
  <link rel="preload" as="image" href="hero.avif" fetchpriority="high" />
</head>`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which stage of the Critical Rendering Path merges the DOM and CSSOM?',
      options: ['Layout', 'Paint', 'Render Tree construction', 'Composite'],
      answer: 2,
      explanation: 'The Render Tree is built by combining the DOM (structure) and CSSOM (styles). Only visible nodes are included — elements with display:none are excluded.',
    },
    {
      q: 'What is the difference between defer and async script attributes?',
      options: [
        'defer downloads in parallel and executes after HTML parsed; async executes immediately when ready',
        'async downloads in parallel and executes after HTML parsed; defer executes immediately when ready',
        'Both are identical — just aliases for each other',
        'defer only works for external scripts; async works for inline scripts too',
      ],
      answer: 0,
      explanation: 'defer: parallel download, ordered execution after HTML is fully parsed. async: parallel download, immediate execution when ready (may interrupt parsing). Neither blocks the parser during download.',
    },
    {
      q: 'Why should you avoid @import inside CSS files?',
      options: [
        'It is deprecated in all modern browsers',
        'It causes serial (sequential) stylesheet downloads instead of parallel',
        'It prevents GZIP compression of the CSS file',
        'It disables the browser\'s style recalculation optimisation',
      ],
      answer: 1,
      explanation: '@import is discovered only after the parent CSS file downloads. This creates a chain of serial requests. Linking stylesheets in HTML lets the browser fetch them in parallel.',
    },
    {
      q: 'What does <link rel="preload" as="style"> do differently from <link rel="stylesheet">?',
      options: [
        'It fetches the CSS and applies it immediately',
        'It fetches the CSS at high priority but does NOT apply it as a stylesheet until rel is changed',
        'It only works in Chrome and Safari',
        'It defers stylesheet application until after DOMContentLoaded',
      ],
      answer: 1,
      explanation: 'preload fetches at high priority but the resource is not used until referenced. To apply the CSS you must flip rel to "stylesheet" (usually via the onload handler). This allows async non-blocking CSS loading.',
    },
    {
      q: 'What is the recommended maximum size for inlined critical CSS?',
      options: ['4 KB', '14 KB', '50 KB', '100 KB'],
      answer: 1,
      explanation: '14 KB (roughly) fits within the initial TCP congestion window — meaning it can be delivered in the first network round-trip along with the HTML. Larger inline CSS pushes the HTML response itself into a second round-trip.',
    },
    {
      q: 'Which attribute allows the browser to continue parsing HTML while a script downloads, then executes it in order?',
      options: ['async', 'defer', 'type="module"', 'loading="lazy"'],
      answer: 1,
      explanation: 'defer downloads the script in parallel with HTML parsing and executes it after parsing completes, in document order. async downloads in parallel and executes immediately when downloaded — which can interrupt parsing. Both defer and type="module" maintain execution order; async does not. Use defer for app scripts, async for independent analytics.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Does CSS always block rendering, or only under certain conditions?',
      a: 'CSS in <head> always blocks rendering — the browser cannot construct the Render Tree without a complete CSSOM. However, stylesheets with media="print" or media="(min-width: 999999px)" are still downloaded but NOT render-blocking (they apply to conditions that don\'t match the current view). The download still happens; only the render block is skipped.',
    },
    {
      q: 'What is the difference between DOMContentLoaded and the load event?',
      a: 'DOMContentLoaded fires when HTML is fully parsed and deferred scripts have executed. The load event fires after ALL resources (images, stylesheets, iframes) have loaded. For CRP optimisation, target a fast DOMContentLoaded — load event timing is dominated by image downloads, not parsing.',
    },
    {
      q: 'How does type="module" affect script loading?',
      a: 'Module scripts are deferred by default — they download in parallel with HTML parsing and execute after the DOM is ready, in source order. They also enable top-level await, strict mode, and module scope isolation. Browsers that don\'t support modules ignore them; use <script nomodule> as a fallback.',
    },
    {
      q: 'Why is <link rel="prefetch"> not useful for the current page?',
      a: 'prefetch requests are sent at the lowest priority, after all higher-priority resources. They are designed for resources needed on the NEXT navigation, not the current page. Using prefetch for current-page critical resources wastes it — use preload instead.',
    },
    {
      q: 'What does the renderBlockingStatus property in Resource Timing API tell you?',
      a: 'It indicates whether a resource was render-blocking ("blocking"), potentially render-blocking ("potentially-blocking" — e.g. CSS in <head> that wasn\'t needed for above-the-fold render), or non-blocking ("non-blocking"). Available in Chrome 107+ and useful for programmatic CRP auditing.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'The CRP is HTML → DOM + CSS → CSSOM → Render Tree → Layout → Paint → Composite — optimise by eliminating render-blocking CSS/JS and inlining critical styles.',
    mustKnow: [
      'Six CRP stages: HTML parse, CSS parse, Render Tree, Layout, Paint, Composite',
      'CSS in <head> is render-blocking; JS without defer/async is parser-blocking',
      'defer: parallel download + ordered post-parse execution; async: immediate execution when ready',
      'Critical CSS: inline above-the-fold styles (< 14 KB) to unblock first paint',
      'Avoid @import in CSS — creates serial downloads; link stylesheets in HTML instead',
      'preload fetches at high priority; prefetch fetches at low priority for the next page',
    ],
    interviewFocus: [
      'Walk through all six stages of the Critical Rendering Path',
      'What is the difference between render-blocking and parser-blocking?',
      'Explain defer vs async — when would you use each?',
      'How does inlining critical CSS improve FCP and LCP?',
    ],
  };
}
