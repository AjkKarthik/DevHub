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
  selector: 'app-perf-css-performance',
  standalone: true,
  imports: [CommonModule, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './css-performance.html',
  styleUrl: './css-performance.scss',
})
export class PerfCssPerformance {

  quickRef: QuickRefItem[] = [
    { name: 'content-visibility: auto', type: 'keyword', desc: 'Browser skips rendering of off-screen elements entirely — largest single CSS win for long pages' },
    { name: 'contain: strict',          type: 'keyword', desc: 'Isolates an element\'s layout, style, size, and paint from the rest of the document' },
    { name: 'contain-intrinsic-size',   type: 'keyword', desc: 'Estimated size hint for content-visibility: auto elements — prevents scroll jump when rendered' },
    { name: 'PurgeCSS',                 type: 'keyword', desc: 'Build-time tool that removes unused CSS selectors — reduces stylesheet from 200 KB to < 10 KB' },
    { name: 'Critical CSS',             type: 'keyword', desc: 'Inline above-the-fold styles in <style> tag; async-load the rest — eliminates render-blocking CSS' },
    { name: 'will-change',              type: 'keyword', desc: 'Hints to compositor to promote element to its own layer — use sparingly, costs GPU memory' },
    { name: 'layer (cascade layers)',   type: 'keyword', desc: '@layer lets you control specificity without !important — keeps selectors flat and maintainable' },
    { name: '@import in CSS',           type: 'keyword', desc: 'Causes serial (not parallel) network requests — always use <link> tags or bundler imports instead' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'CSS as a render blocker',
      points: [
        'All CSS in <head> is render-blocking: the browser fetches and parses every stylesheet before drawing any pixel.',
        'A 200 KB CSS file (common with Tailwind/Bootstrap) adds 300–800ms to LCP on slow connections.',
        'Fix: inline critical CSS (above-the-fold styles) in a <style> tag; load the rest asynchronously.',
        'Async CSS trick: <link rel="stylesheet" media="print" onload="this.media=\'all\'"> loads CSS without blocking.',
        '@import inside CSS causes serial loading — each import must finish before the next starts; use <link> or bundler imports.',
      ],
    },
    {
      heading: 'content-visibility: auto — the biggest single win',
      points: [
        'content-visibility: auto tells the browser to skip layout, paint, and rendering of off-screen elements.',
        'Tested by Google: 7× rendering improvement on a news article with many sections.',
        'Use on long-page sections: <section style="content-visibility: auto"> — each section renders on demand as user scrolls.',
        'Pair with contain-intrinsic-size to give the browser a size estimate — prevents scroll jump when content renders.',
        'Browser support: Chrome 85+, Edge 85+, Firefox 125+, Safari 18+ — safe for progressive enhancement.',
      ],
    },
    {
      heading: 'CSS containment — isolate layout costs',
      points: [
        'contain: strict — applies layout, style, size, and paint containment. Changes inside don\'t trigger global layout.',
        'contain: content — layout + style + paint (no size). Safest for variable-size components.',
        'contain: layout — element\'s children don\'t affect external layout. Minimum for cards in a grid.',
        'Without containment, changing one element\'s height can trigger a full-page layout recalculation.',
        'Angular CDK virtualScroll implicitly uses containment — each item is isolated from adjacent items.',
      ],
    },
    {
      heading: 'Removing unused CSS',
      points: [
        'Tailwind CSS v3+ uses JIT (just-in-time) — only the classes used in your templates are in the output.',
        'PurgeCSS: scans HTML/JS/templates for class names; removes all CSS selectors not found.',
        'Bootstrap with PurgeCSS: 200 KB → 8 KB. Tailwind with JIT: configured correctly, ~10 KB for most apps.',
        'Keep list: strings assembled dynamically (e.g. "bg-" + color) — PurgeCSS can\'t see these; add to safelist.',
        'Run: npx tailwindcss build -o output.css --minify → smallest possible output.',
      ],
    },
    {
      heading: 'Selector complexity and specificity',
      points: [
        'CSS selector performance is rarely the bottleneck today (V8 is fast) — but deep selectors add maintenance cost.',
        'Avoid deep descendant selectors: .header .nav ul li a:hover — forces browser to walk the full DOM tree.',
        'BEM (.block__element--modifier) or utility classes keep selectors flat (one class) — easier to reason about.',
        'Cascade layers (@layer): define layer order once; all rules in lower-priority layers lose without !important gymnastics.',
        'High-specificity selectors (IDs, inline styles) make overriding difficult — keep specificity flat.',
      ],
    },
    {
      heading: 'Animations — keep on the compositor thread',
      points: [
        'Only transform and opacity can be composited — they run on the GPU thread without triggering layout or paint.',
        'Animating width, height, top, left, margin, padding triggers layout on every frame — causes jank.',
        'Use transform: translateX() instead of left: for movement; transform: scale() instead of width/height.',
        'will-change: transform hints to the browser to promote the element to a GPU layer before animation starts.',
        'Use will-change sparingly: each layer costs GPU memory; too many layers causes worse performance than no layers.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'content-visibility & contain',
      language: 'scss',
      code: `/* content-visibility: auto — skip off-screen rendering */
.page-section {
  content-visibility: auto;
  /* Estimated height — prevents scroll jump when section renders */
  contain-intrinsic-size: 0 600px;  /* width hint: 0 (auto), height: 600px */
}

/* CSS containment — isolate component layout cost */
.card {
  contain: content;   /* layout + style + paint — changes stay inside */
}

.card-grid-item {
  contain: layout;    /* minimum — children don't affect outer layout */
}

.fixed-size-widget {
  contain: strict;    /* layout + style + size + paint — fully isolated */
  width: 300px;
  height: 200px;
}

/* Practical example: long article with many sections */
article > section {
  content-visibility: auto;
  contain-intrinsic-size: 0 400px;  /* rough estimate per section */
  /* Browser now renders only the visible sections */
}`,
    },
    {
      label: 'Critical CSS pattern',
      language: 'html',
      code: `<!DOCTYPE html>
<html>
<head>
  <!-- Critical CSS: inline above-the-fold styles — no network request, no render block -->
  <style>
    /* Only what's needed for the first viewport */
    body { margin: 0; font-family: system-ui, sans-serif; }
    .header { background: #1e293b; color: #fff; padding: 1rem 2rem; }
    .hero   { display: grid; place-items: center; min-height: 60vh; }
    .hero h1 { font-size: clamp(2rem, 5vw, 4rem); font-weight: 700; }
  </style>

  <!-- Non-critical CSS: load asynchronously — does not block render -->
  <!-- media="print" trick: browser fetches at low priority; onload switches to screen -->
  <link rel="stylesheet"
        href="/styles.css"
        media="print"
        onload="this.media='all'">

  <!-- Fallback for JS-disabled browsers -->
  <noscript>
    <link rel="stylesheet" href="/styles.css">
  </noscript>
</head>
<body>
  <header class="header">...</header>
  <section class="hero"><h1>Page renders immediately</h1></section>
  <!-- Below-fold content — styles load async while user reads above fold -->
</body>
</html>`,
    },
    {
      label: 'PurgeCSS config (Vite)',
      language: 'typescript',
      code: `// vite.config.ts — PurgeCSS removes unused selectors at build time
import { defineConfig } from 'vite';
import purgecss from 'vite-plugin-purgecss';  // npm i -D vite-plugin-purgecss

export default defineConfig({
  plugins: [
    purgecss({
      content: [
        './index.html',
        './src/**/*.{ts,html,tsx,jsx}',  // scan all templates
      ],
      safelist: {
        // Classes assembled dynamically — PurgeCSS can't detect these statically
        standard: ['active', 'disabled', 'hidden'],
        // Regex: any class starting with bg-, text-, border-
        greedy: [/^bg-/, /^text-/, /^border-/],
      },
      // Keep keyframe names (Animate.css etc)
      keyframes: true,
    }),
  ],
});

// Tailwind CSS v3+ uses JIT — no PurgeCSS needed; it ONLY generates used classes
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{ts,html}'],
  theme: { extend: {} },
  plugins: [],
  // Output: only classes found in content files — typically 5-15 KB`,
    },
    {
      label: 'Performant animations',
      language: 'scss',
      code: `/* WRONG — triggers layout every frame */
.box-bad {
  transition: width 0.3s, left 0.3s, margin 0.3s;
  /* Animating these forces browser to recalculate layout 60x/sec */
}

/* RIGHT — compositor-only, runs on GPU thread */
.box-good {
  transition: transform 0.3s ease, opacity 0.3s ease;
  /* Only transform and opacity skip layout+paint entirely */
}

/* Slide in from left: use translateX, not left */
.slide-in {
  transform: translateX(-100%);
  transition: transform 0.3s ease-out;

  &.visible {
    transform: translateX(0);  /* GPU composited — no layout cost */
  }
}

/* Fade in: opacity is compositor-only */
.fade-in {
  opacity: 0;
  transition: opacity 0.4s ease;

  &.visible { opacity: 1; }
}

/* will-change: promote to GPU layer BEFORE animation starts */
.animated-card {
  will-change: transform;  /* tells GPU to prep a layer for this element */
  /* REMOVE will-change after animation ends — frees GPU memory */
}

/* Use sparingly — each promoted layer costs ~1MB GPU memory */
/* Too many will-change elements = worse performance than none */`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using @import inside CSS files',
      wrong: `/* styles.css — causes serial network requests */
@import url('reset.css');       /* fetches reset.css */
@import url('components.css');  /* waits for reset, then fetches components */
@import url('utilities.css');   /* waits for components, then fetches utilities */
/* 3 serial requests = 3× the latency of parallel loading */`,
      right: `<!-- index.html — parallel network requests -->
<link rel="stylesheet" href="reset.css">
<link rel="stylesheet" href="components.css">
<link rel="stylesheet" href="utilities.css">
<!-- All 3 downloaded in parallel -->

<!-- Or: use a bundler (Vite/webpack) to combine into one file -->`,
      explanation: '@import inside CSS creates a dependency chain — each import waits for the previous to finish before starting the next download. <link> tags in HTML load in parallel. In production, a bundler that inlines @imports into one file is best.',
    },
    {
      title: 'Animating layout-triggering CSS properties',
      wrong: `.menu {
  transition: height 0.3s, margin-top 0.3s, padding 0.3s;
  /* Browser recalculates layout of entire page on every animation frame */
}`,
      right: `.menu {
  /* Use transform for movement, opacity for visibility */
  transform: translateY(-100%);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;

  &.open {
    transform: translateY(0);
    opacity: 1;
  }
}`,
      explanation: 'Animating height, margin, padding, or top/left triggers a layout recalculation on every frame (60 times/second). transform and opacity are handled entirely by the compositor thread on the GPU — no layout or paint, smooth 60fps animation even on mobile.',
    },
    {
      title: 'Adding will-change to everything',
      wrong: `/* "Performance tip: add will-change to all animated elements" */
* { will-change: transform, opacity; }
/* Reality: each layer costs ~1 MB GPU memory; all elements promoted = GPU OOM */`,
      right: `/* Add will-change just before animation, remove after */
.card:hover {
  will-change: transform;  /* only on hover — promotes layer only when needed */
}

/* Or: add/remove with JS at the right moment */
element.addEventListener('mouseenter', () => {
  element.style.willChange = 'transform';
});
element.addEventListener('animationend', () => {
  element.style.willChange = 'auto';  // release GPU layer
});`,
      explanation: 'will-change promotes the element to a GPU compositing layer — costing roughly 1 MB of GPU memory per layer. Adding it globally or to too many elements exhausts GPU memory and actually causes worse performance. Apply it selectively just before an animation, then remove it.',
    },
    {
      title: 'Shipping 200 KB of unused Bootstrap CSS',
      wrong: `/* index.html — loads all 200KB of Bootstrap, uses 5KB */
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.min.css">
/* 195KB of unused grid, utility, and component CSS */`,
      right: `/* Option 1: Tailwind JIT — only generates classes you use (~10KB) */
/* tailwind.config.js: content: ['./src/**/*.{html,ts}'] */

/* Option 2: Bootstrap + PurgeCSS — strips unused selectors */
/* Build output: 200KB → 6KB */

/* Option 3: import only what you need */
@use 'bootstrap/scss/bootstrap-grid';   /* only grid */
@use 'bootstrap/scss/bootstrap-utilities'; /* only utilities */`,
      explanation: 'Shipping a full CSS framework when you use 3% of it adds 190+ KB of dead CSS — slowing the initial download and parse. Tailwind JIT, PurgeCSS, or selective Bootstrap SCSS imports solve this at build time with zero runtime cost.',
    },
    {
      title: 'Not using content-visibility on long pages',
      wrong: `/* 50-section article page — browser renders all 50 sections on load */
article > section {
  /* No containment — browser lays out all 50 sections immediately */
  /* Render time: ~800ms on mid-range mobile */
}`,
      right: `/* content-visibility: auto — render only visible sections */
article > section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;  /* estimated section height */
  /* Render time: ~120ms — browser defers off-screen sections */
}`,
      explanation: 'Without content-visibility, the browser lays out and paints every section on the page on load — even sections 10 scrolls away. content-visibility: auto defers off-screen sections entirely, dramatically reducing initial render time on long pages.',
    },
    {
      title: 'Using high-specificity selectors that are hard to override',
      wrong: `/* Specificity: 0,1,1,2 — requires equally specific or !important to override */
div#app .container ul li a.nav-link { color: blue; }`,
      right: `/* Flat BEM selector — specificity: 0,1,0,0 — easy to override */
.nav__link { color: blue; }

/* Or cascade layers — layer order, not specificity, determines winner */
@layer base { a { color: blue; } }
@layer components { .nav__link { color: inherit; } }
/* components layer always beats base, regardless of selector specificity */`,
      explanation: 'Deep, high-specificity selectors create a maintenance trap — every override needs equal or higher specificity or !important. BEM keeps selectors to a single class (0,1,0,0 specificity). @layer cascade layers let you control the override order structurally.',
    },
  ];

  challenge: Challenge = {
    title: 'Optimise a render-blocking CSS setup',
    language: 'scss',
    description: `A long-form article page has three performance problems:
1. A 180 KB stylesheet loaded via @import chain — blocking render for 900ms
2. A card animation that animates \`height\` and \`top\` — causing 60fps layout thrashing
3. No containment on the 40 article sections — full-page re-layout on every scroll

Fix all three issues:
- Replace the @import chain with a critical CSS inline block + async link
- Rewrite the animation to use only transform/opacity
- Add content-visibility: auto and contain-intrinsic-size to article sections`,
    hints: [
      'Critical CSS goes in a <style> tag in <head> — only above-the-fold rules',
      'Async CSS: <link rel="stylesheet" media="print" onload="this.media=\'all\'">',
      'Use transform: translateY() instead of top/height for slide animations',
      'opacity: 0 → 1 instead of visibility or display for fade',
      'contain-intrinsic-size: 0 400px gives the browser a height estimate',
    ],
    starterCode: `/* BEFORE — three performance problems */

/* Problem 1: @import chain in main.scss */
@import url('reset.scss');        /* serial: fetch reset first */
@import url('layout.scss');       /* then layout */
@import url('components.scss');   /* then components — 3 serial requests */

/* Problem 2: layout-triggering animation */
.card {
  height: 0;
  top: -20px;
  transition: height 0.3s, top 0.3s;

  &.visible {
    height: 200px;
    top: 0;
  }
}

/* Problem 3: no containment on article sections */
article > section {
  /* browser renders all 40 sections on load */
  padding: 2rem;
}`,
    solution: `<!-- AFTER — fix 1: critical CSS inline + async load -->
<head>
  <style>
    /* Only above-the-fold styles — layout, header, hero */
    body { margin: 0; font-family: system-ui; }
    .header { background: #1e293b; color: #fff; padding: 1rem; }
    article { max-width: 800px; margin: 0 auto; padding: 2rem; }
  </style>
  <!-- Non-critical CSS loads async — no render block -->
  <link rel="stylesheet" href="/styles.css"
        media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="/styles.css"></noscript>
</head>

/* Fix 2: compositor-only animation (transform + opacity) */
.card {
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity 0.3s ease, transform 0.3s ease;

  &.visible {
    opacity: 1;
    transform: translateY(0);
    /* GPU composited — no layout, no paint, smooth 60fps */
  }
}

/* Fix 3: content-visibility for off-screen sections */
article > section {
  content-visibility: auto;
  contain-intrinsic-size: 0 400px;  /* estimated height per section */
  padding: 2rem;
  /* Browser skips layout+paint for off-screen sections */
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does content-visibility: auto do?',
      options: [
        'Lazy-loads images inside the element until they scroll into view',
        'Skips layout, paint, and rendering of off-screen elements, rendering them only as they scroll into view',
        'Automatically adjusts font size based on viewport size',
        'Defers CSS parsing for the element until it is visible',
      ],
      answer: 1,
      explanation: 'content-visibility: auto tells the browser to entirely skip layout, painting, and rendering of an element while it is off-screen. When the user scrolls it into view, the browser renders it on demand. Tested by Google, this gave 7× rendering improvement on a long article page.',
    },
    {
      q: 'Why should you use transform instead of left/top for CSS animations?',
      options: [
        'transform supports more easing functions than positional properties',
        'transform and opacity are compositor-only — they run on the GPU without triggering layout or paint',
        'left and top animations are deprecated in modern browsers',
        'transform animations use less CSS specificity',
      ],
      answer: 1,
      explanation: 'Animating left, top, width, or height triggers a layout recalculation on every frame — 60 times per second. transform and opacity skip the layout and paint steps entirely, running on the GPU compositor thread. The result is smooth 60fps animation even on low-end devices.',
    },
    {
      q: 'What is the problem with @import inside CSS files?',
      options: [
        '@import doesn\'t support HTTPS URLs',
        '@import creates a dependency chain — each file must finish downloading before the next starts, unlike parallel <link> tags',
        '@import is not supported in Safari',
        '@import increases CSS specificity for the imported rules',
      ],
      answer: 1,
      explanation: '@import inside CSS is resolved sequentially — the browser must download and parse file A before it knows about file B\'s @import for file C. <link> tags in HTML are discovered in parallel. In production, a bundler that inlines all @imports into one file removes the serial latency entirely.',
    },
    {
      q: 'What is the correct way to load non-critical CSS without blocking rendering?',
      options: [
        '<link rel="stylesheet" defer href="/styles.css">',
        '<link rel="stylesheet" href="/styles.css" media="print" onload="this.media=\'all\'">',
        '<link rel="stylesheet" href="/styles.css" async>',
        '<link rel="preload" href="/styles.css">',
      ],
      answer: 1,
      explanation: 'The media="print" trick loads the stylesheet at low priority (print media = not needed for screen render). The onload handler switches it to all once downloaded, applying it. async and defer don\'t exist on <link rel="stylesheet">. preload alone doesn\'t apply the stylesheet.',
    },
    {
      q: 'What is the risk of adding will-change: transform to many elements?',
      options: [
        'will-change disables CSS transitions on the element',
        'Each promoted layer uses ~1MB of GPU memory — too many layers causes worse performance',
        'will-change is only supported in Chrome and Edge',
        'will-change forces the element to use hardware acceleration which breaks opacity animations',
      ],
      answer: 1,
      explanation: 'will-change promotes an element to a GPU compositing layer, consuming GPU memory (roughly 1MB per layer). Adding it to many elements simultaneously exhausts GPU memory and can cause the browser to de-promote layers — resulting in worse performance than without will-change.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How much does unused CSS actually affect performance?',
      a: 'More than most developers realise. A 200 KB Bootstrap CSS file on a 3G connection takes ~600ms to download + ~100ms to parse before any pixel is painted. Shipping 6 KB of only-used CSS reduces that to ~18ms download + ~5ms parse. Beyond loading, a browser with 10,000 CSS selectors takes longer to style-match every DOM element — though modern browsers are fast at this (< 10ms for most pages).',
    },
    {
      q: 'When should I use contain: strict vs contain: content vs contain: layout?',
      a: 'contain: strict applies all containment including size — the element must have explicit dimensions. Use for fixed-size widgets (ads, iframes, map tiles). contain: content applies layout + style + paint but not size — safe for variable-height components like cards or accordions. contain: layout is the minimum, preventing children from affecting outer layout. Start with contain: content for cards; use contain: strict only when you know the exact size.',
    },
    {
      q: 'Does CSS selector specificity affect rendering performance?',
      a: 'Modern browsers (V8, SpiderMonkey) are highly optimised for selector matching — the performance difference between .item and div.container > ul li a is negligible for most real pages. The real cost of deep selectors is maintainability: they\'re harder to override and more likely to cause specificity wars requiring !important. Keep selectors flat for code health, not primarily for render performance.',
    },
    {
      q: 'What is the difference between contain and @layer?',
      a: 'They solve completely different problems. contain is a rendering optimisation — it isolates an element\'s layout/paint/style impact to prevent unnecessary global recalculations. @layer is a cascade mechanism — it lets you define the priority order of CSS rule groups without relying on specificity. contain makes pages faster; @layer makes stylesheets more maintainable.',
    },
    {
      q: 'How do I generate critical CSS automatically?',
      a: 'Tools: critters (webpack/Vite plugin, used by Angular CLI) inlines critical CSS automatically. Critical (npm package) uses Puppeteer to compute above-the-fold styles. Penthouse does the same server-side. In Angular projects, critters is built into the Angular build pipeline — enable it in angular.json → "optimization": { "styles": { "inlineCritical": true } }.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Inline critical CSS, async-load the rest, use content-visibility for long pages, animate only transform/opacity, and remove unused selectors with PurgeCSS or Tailwind JIT.',
    mustKnow: [
      'All CSS in <head> is render-blocking — inline critical, async-load the rest',
      'content-visibility: auto skips off-screen sections — 7× render improvement on long pages',
      'Only transform and opacity are compositor-only — never animate width/height/top/left',
      'will-change: use sparingly — each layer costs ~1 MB GPU memory',
      '@import in CSS = serial requests — use <link> tags or bundler imports',
      'PurgeCSS / Tailwind JIT eliminates unused selectors — 200 KB → < 10 KB',
    ],
    interviewFocus: [
      'How does CSS block rendering and what can you do about it?',
      'What is content-visibility: auto and when would you use it?',
      'Which CSS properties can be animated without causing layout? Why?',
      'What is the problem with @import in production CSS?',
    ],
  };
}
