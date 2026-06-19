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
  selector: 'app-perf-cls',
  standalone: true,
  imports: [CommonModule, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './cls.html',
  styleUrl: './cls.scss',
})
export class PerfCls {

  quickRef: QuickRefItem[] = [
    { name: 'CLS good threshold',     type: 'keyword', desc: '< 0.1 — visual stability is excellent; users rarely notice unexpected shifts' },
    { name: 'CLS needs improvement',  type: 'keyword', desc: '0.1–0.25 — noticeable shifts that may disrupt reading or cause mis-clicks' },
    { name: 'CLS poor',               type: 'keyword', desc: '> 0.25 — major layout instability; content jumps while the user is reading or clicking' },
    { name: 'Impact fraction',         type: 'syntax',  desc: 'Proportion of viewport affected by the shift (0–1); multiplied by distance fraction for CLS score' },
    { name: 'Distance fraction',       type: 'syntax',  desc: 'Farthest distance an unstable element moved relative to viewport size (0–1)' },
    { name: 'aspect-ratio',            type: 'syntax',  desc: 'CSS property to reserve space for images/video without fixed dimensions; eliminates layout shift on load' },
    { name: 'content-visibility',      type: 'keyword', desc: 'content-visibility: auto — browser skips off-screen rendering; set contain-intrinsic-size to prevent CLS' },
    { name: 'font-display: optional',  type: 'keyword', desc: 'Strictest font swap strategy — uses fallback permanently if font not ready within 100ms; zero FOUT' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What CLS measures and how it is calculated',
      points: [
        'CLS (Cumulative Layout Shift) measures unexpected movement of visible elements during the page lifetime.',
        'Each layout shift = impact fraction × distance fraction. CLS is the sum of all shift scores where shifts are grouped within 1-second windows (max 5-second session gap).',
        'Impact fraction: proportion of the viewport area that shifted. Distance fraction: largest distance any element moved ÷ viewport dimension.',
        'Thresholds — good: < 0.1; needs improvement: 0.1–0.25; poor: > 0.25.',
        'User-initiated shifts (within 500 ms of a tap/click/keyboard input) are excluded from CLS — only unexpected shifts count.',
      ],
    },
    {
      heading: 'Images and media without explicit dimensions',
      points: [
        'The most common CLS cause: images without width/height attributes. When the image loads the browser must resize, pushing content down.',
        'Fix: always set width and height on <img> and <video> elements — the browser uses them to reserve space before the resource loads.',
        'Modern CSS solution: use aspect-ratio instead of explicit px values for responsive images (aspect-ratio: 16/9).',
        'Background images loaded via CSS are also a source — reserve the container height or use aspect-ratio on the container.',
      ],
    },
    {
      heading: 'Ads, embeds, and iframes',
      points: [
        'Ad slots that expand after initial render are the second-most common CLS cause.',
        'Fix: reserve a min-height equal to the largest ad size expected; use position: sticky or fixed for ads that float.',
        'For iframes (YouTube, Tweets, maps): wrap in an aspect-ratio container so the iframe space is reserved before the embed renders.',
        'Prefer lazy-loading below-fold embeds — the space is reserved but the embed does not cause a shift when lazy-loaded on scroll.',
      ],
    },
    {
      heading: 'Dynamic content injected above existing content',
      points: [
        'Inserting banners, consent notices, or notification bars at the top of the page after load is a CLS trigger.',
        'Fix: reserve the space for banners in the initial layout (min-height or skeleton UI) before content arrives.',
        'Alternatively, use fixed/sticky positioning so injected UI overlays content rather than pushing it.',
        'Cookie consent: reserve space with a placeholder; or use a fixed bottom bar that does not shift page content.',
      ],
    },
    {
      heading: 'Web fonts and FOUT / FOIT',
      points: [
        'FOUT (Flash of Unstyled Text): fallback font renders, then swaps to webfont — if font metrics differ, text reflows and causes CLS.',
        'FOIT (Flash of Invisible Text): text hidden until webfont loads — no CLS but delayed readability.',
        'font-display: swap has the lowest TTFB impact but most CLS risk if font metrics differ significantly from fallback.',
        'font-display: optional gives the browser only 100 ms to load; if not ready, fallback is used forever — zero CLS but possible mismatch.',
        'Best fix: use size-adjust, ascent-override, descent-override on @font-face to match fallback metrics, or use a variable font subset.',
      ],
    },
    {
      heading: 'Measuring and debugging CLS',
      points: [
        'Chrome DevTools → Performance panel → "Layout Shifts" track (pink bars) — hover each bar to see which element caused it.',
        'web-vitals onCLS() — set reportAllChanges: true to receive updates as new shifts are detected.',
        'Attribution: attribution.largestShiftTarget gives the CSS selector of the shifting element.',
        'Lighthouse CLS audit: run in mobile throttled mode — desktop scores often miss mobile-specific shifts.',
        'Chrome DevTools Rendering tab → "Layout Shift Regions" (green flashes) highlights shifting elements in real time.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reserve image space (HTML)',
      language: 'html',
      code: `<!-- BAD: no dimensions — browser reflows when image loads -->
<img src="hero.webp" alt="Hero" />

<!-- GOOD: explicit width/height — browser reserves space immediately -->
<img src="hero.webp" alt="Hero" width="1200" height="630" />

<!-- GOOD: responsive with aspect-ratio -->
<style>
  .hero-img { width: 100%; aspect-ratio: 16/9; object-fit: cover; }
</style>
<img class="hero-img" src="hero.webp" alt="Hero" width="1200" height="630" />

<!-- GOOD: responsive picture element with preserved aspect-ratio -->
<picture>
  <source srcset="hero.avif" type="image/avif" />
  <source srcset="hero.webp" type="image/webp" />
  <img src="hero.jpg" alt="Hero" width="1200" height="630"
       style="width:100%;height:auto" />
</picture>`,
    },
    {
      label: 'Reserve ad / embed space',
      language: 'css',
      code: `/* Reserve ad slot to prevent shift when ad loads */
.ad-slot {
  min-height: 250px;          /* Match the largest ad unit you serve */
  width: 300px;
  display: flex;
  align-items: flex-start;
}

/* Aspect-ratio container for iframe embeds (YouTube, maps) */
.embed-container {
  position: relative;
  aspect-ratio: 16 / 9;
  width: 100%;
  overflow: hidden;
}
.embed-container iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
}

/* Cookie banner: use fixed bottom bar — never pushes content */
.cookie-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 1rem;
  background: #fff;
}`,
    },
    {
      label: 'Match font metrics (CSS)',
      language: 'css',
      code: `/* Reduce font-swap CLS by matching fallback metrics to webfont */
@font-face {
  font-family: 'Inter';
  src: url('inter.woff2') format('woff2');
  font-display: swap;             /* show fallback immediately */
  /* Override fallback metrics to minimise reflow on swap */
  size-adjust: 100.06%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}

/* Fallback font declaration for matching */
@font-face {
  font-family: 'Inter Fallback';  /* must match exact system font name */
  src: local('Arial');
  size-adjust: 100.06%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}

body {
  /* Use fallback-first; Inter replaces it with minimal reflow */
  font-family: 'Inter', 'Inter Fallback', Arial, sans-serif;
}`,
    },
    {
      label: 'Measure CLS (web-vitals)',
      language: 'typescript',
      code: `import { onCLS } from 'web-vitals/attribution';

onCLS(({ value, rating, attribution }) => {
  const { largestShiftTarget, largestShiftTime, loadState, largestShiftEntry } = attribution;

  console.log('CLS:', value.toFixed(4), '(', rating, ')');
  console.log('Worst shifting element:', largestShiftTarget);  // CSS selector
  console.log('Shifted at:', largestShiftTime, 'ms after navigation');
  console.log('Load state:', loadState);  // 'loading' | 'dom-interactive' | 'complete'

  if (largestShiftEntry) {
    const { impactFraction, sources } = largestShiftEntry as any;
    console.log('Impact fraction:', impactFraction);
    sources?.forEach((s: any) =>
      console.log('  Moved:', s.node, 'from', s.previousRect, 'to', s.currentRect)
    );
  }

  // Send on page hide (CLS can grow throughout visit)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      navigator.sendBeacon('/analytics', JSON.stringify({ metric: 'CLS', value, rating }));
    }
  }, { once: true });
}, { reportAllChanges: true });`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Images without width and height attributes',
      wrong: '<img src="hero.jpg" alt="Hero image" />',
      right: '<img src="hero.jpg" alt="Hero image" width="1200" height="630" />',
      explanation: 'Without dimensions the browser cannot reserve space before the image loads. When the image arrives, the page reflows — the biggest single cause of high CLS.',
    },
    {
      title: 'Injecting a banner above existing content after load',
      wrong: `// Dynamically prepend a notification bar 2 s after load
setTimeout(() => {
  document.body.insertAdjacentHTML('afterbegin', '<div class="banner">New update!</div>');
}, 2000);`,
      right: `// Reserve space for the banner in the initial HTML
// OR use fixed/sticky positioning so it overlays rather than pushes content
document.querySelector('.banner-placeholder').innerHTML = 'New update!';`,
      explanation: 'Inserting content above existing elements pushes them down — that\'s a layout shift. Reserve space in the initial render or overlay with position: fixed.',
    },
    {
      title: 'Ad slot with no reserved height',
      wrong: `.ad-slot { width: 300px; }   /* no height = 0px until ad loads → reflow */`,
      right: `.ad-slot { width: 300px; min-height: 250px; }  /* space reserved before ad renders */`,
      explanation: 'Ad networks inject content asynchronously. Without reserved space the slot collapses to zero height initially, then expands when the ad loads, causing a shift.',
    },
    {
      title: 'Using font-display: swap without metric overrides',
      wrong: `@font-face {
  font-family: 'Roboto';
  src: url('roboto.woff2') format('woff2');
  font-display: swap;   /* shifts text when Roboto swaps in if metrics differ */
}`,
      right: `@font-face {
  font-family: 'Roboto';
  src: url('roboto.woff2') format('woff2');
  font-display: swap;
  size-adjust: 100.3%;    /* match fallback metrics to minimise reflow on swap */
  ascent-override: 92.7%;
}`,
      explanation: 'font-display: swap prevents FOIT but can cause CLS if the webfont has different metrics (cap height, line height) from the fallback. Use size-adjust and ascent/descent overrides to match.',
    },
    {
      title: 'Forgetting contain-intrinsic-size with content-visibility',
      wrong: `.offscreen-section { content-visibility: auto; }  /* height collapses to 0 → shift on scroll */`,
      right: `.offscreen-section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;  /* estimate the section height to prevent shift */
}`,
      explanation: 'content-visibility: auto skips rendering of off-screen sections, setting their height to 0 until scrolled into view. contain-intrinsic-size gives the browser an estimated height to use, preventing layout shifts as the user scrolls.',
    },
    {
      title: 'Measuring CLS too early',
      wrong: `// Fires once after DOMContentLoaded — misses post-load shifts
window.addEventListener('DOMContentLoaded', () => {
  sendCLSToAnalytics(currentCLSValue);
});`,
      right: `// CLS accumulates throughout the session — report on page hide
onCLS(({ value }) => {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sendCLSToAnalytics(value);
  }, { once: true });
});`,
      explanation: 'CLS can accumulate from shifts after user interactions, lazy-loaded content, or deferred JS. Measuring at DOMContentLoaded only captures early shifts; the final value is only reliable on page hide.',
    },
  ];

  challenge: Challenge = {
    title: 'Eliminate layout shifts on this product page',
    language: 'html',
    description: `The HTML below causes a CLS score of ~0.45 due to four separate issues.
Find and fix all of them:

1. Hero image shifts content down when it loads
2. Ad slot has no reserved space
3. The cookie banner is injected into the content flow
4. Font swap causes a reflow with no metric correction

Write the corrected HTML/CSS.`,
    hints: [
      'Add width and height attributes to the <img> tag',
      'Give the .ad-slot a min-height of at least 90px (leaderboard size)',
      'Move the cookie banner to position: fixed bottom: 0 so it overlays content',
      'Add size-adjust and ascent-override to the @font-face rule to match Arial metrics',
    ],
    starterCode: `<!-- CLS Issues -->
<style>
  @font-face {
    font-family: 'Poppins';
    src: url('poppins.woff2') format('woff2');
    font-display: swap;   /* no metric overrides */
  }
  body { font-family: 'Poppins', Arial, sans-serif; }
  .ad-slot { width: 728px; }         /* no height reserved */
  .cookie-bar { margin-bottom: 1rem; } /* inline — pushes content */
</style>

<!-- 1. Missing dimensions -->
<img src="product-hero.webp" alt="Product hero" />

<!-- 2. Ad with no reserved space -->
<div class="ad-slot" id="leaderboard-ad"></div>

<!-- 3. Cookie banner injected into flow -->
<div class="cookie-bar">We use cookies. <button>Accept</button></div>

<p>Main product content that gets pushed around...</p>`,
    solution: `<style>
  @font-face {
    font-family: 'Poppins';
    src: url('poppins.woff2') format('woff2');
    font-display: swap;
    /* Match Arial fallback metrics to reduce reflow on swap */
    size-adjust: 105%;
    ascent-override: 88%;
    descent-override: 22%;
  }
  body { font-family: 'Poppins', Arial, sans-serif; }

  /* Reserved space — leaderboard ad is 728×90 */
  .ad-slot { width: 728px; min-height: 90px; }

  /* Cookie bar overlays content — zero layout shift */
  .cookie-bar {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 9999;
    padding: 0.75rem 1rem;
    background: #fff;
    border-top: 1px solid #e5e7eb;
  }
</style>

<!-- Fix 1: explicit dimensions so browser reserves space -->
<img src="product-hero.webp" alt="Product hero"
     width="1200" height="630"
     style="width:100%;height:auto" />

<!-- Fix 2: reserved ad height prevents shift when ad loads -->
<div class="ad-slot" id="leaderboard-ad"></div>

<!-- Fix 3: fixed positioning — no longer in document flow -->
<div class="cookie-bar">We use cookies. <button>Accept</button></div>

<p>Main product content — no longer shifts!</p>`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the "good" CLS threshold?',
      options: ['< 0.01', '< 0.1', '< 0.5', '< 1.0'],
      answer: 1,
      explanation: 'CLS < 0.1 is "good". 0.1–0.25 is "needs improvement". > 0.25 is "poor".',
    },
    {
      q: 'How is a single layout shift score calculated?',
      options: [
        'Number of elements shifted × viewport height',
        'Impact fraction × distance fraction',
        'Total pixels moved ÷ page height',
        'Shift count × time in seconds',
      ],
      answer: 1,
      explanation: 'Each layout shift score = impact fraction (proportion of viewport affected) × distance fraction (largest distance any element moved ÷ viewport size).',
    },
    {
      q: 'Which CSS property eliminates CLS for an image while keeping it responsive?',
      options: [
        'width: 100%; height: auto',
        'object-fit: cover',
        'aspect-ratio: 16/9 (with width + height attributes on the img)',
        'max-width: 100%',
      ],
      answer: 2,
      explanation: 'Setting width and height attributes on the img lets the browser compute the aspect-ratio and reserve space. Modern CSS can also use aspect-ratio directly on the element for the same effect.',
    },
    {
      q: 'Which font-display value completely eliminates FOUT and associated CLS?',
      options: ['swap', 'fallback', 'block', 'optional'],
      answer: 3,
      explanation: 'font-display: optional gives the browser 100 ms; if the font is not ready it uses the fallback permanently — no swap, no FOUT, no CLS. The downside is the webfont may never appear for users on slow connections.',
    },
    {
      q: 'Layout shifts caused within 500 ms of a user gesture:',
      options: [
        'Are included in the CLS score at double weight',
        'Are excluded from the CLS score',
        'Are included but capped at 0.05 per shift',
        'Are reported separately as "expected CLS"',
      ],
      answer: 1,
      explanation: 'Shifts caused by user interactions (click, tap, key press) within 500 ms are excluded from CLS — they are considered expected. Only unexpected shifts count toward the score.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why do I have high CLS on mobile but not desktop?',
      a: 'Mobile viewports are narrower, making relative distances larger; mobile networks are slower so assets load later causing more post-paint shifts; and mobile ads are different sizes. Always test CLS in throttled mobile mode in Lighthouse.',
    },
    {
      q: 'Does lazy-loading images cause CLS?',
      a: 'Only if the images lack width/height attributes. With dimensions set, the browser reserves space even for lazy-loaded images — no shift occurs when they load. Without dimensions, lazy-loading below-fold images is safe for CLS because they shift content below the viewport. LCP images should never be lazy-loaded.',
    },
    {
      q: 'How do I find which element caused the highest CLS in the field?',
      a: 'Use the web-vitals library with attribution: the attribution.largestShiftTarget property returns the CSS selector of the element that moved the most. Log this alongside the CLS value to your analytics to identify problematic elements across real users.',
    },
    {
      q: 'Can animations cause CLS?',
      a: 'CSS transitions on layout-triggering properties (top, left, width, height, margin) trigger layout and register as layout shifts. Use transform: translate() instead — it runs on the compositor thread and is excluded from CLS measurement.',
    },
    {
      q: 'What is the session window rule for CLS?',
      a: 'Layout shifts within 1 second of each other are grouped into a "session". A session ends after 5 seconds of no shifts. CLS uses the worst session score, not the lifetime sum — this prevents a single burst of shifts from being unfairly spread across a long visit.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'CLS measures unexpected visual instability — target < 0.1 by reserving space for images, ads, and dynamic content before they load.',
    mustKnow: [
      'CLS = sum of (impact fraction × distance fraction) per shift, worst 5-second session window',
      'Good: < 0.1; needs improvement: 0.1–0.25; poor: > 0.25',
      'Always set width + height on img/video — biggest single CLS win',
      'Ads, embeds, banners: reserve space with min-height or aspect-ratio container',
      'Dynamic content: overlay with position: fixed/sticky rather than injecting into the flow',
      'Font swap CLS: use size-adjust + ascent/descent overrides to match fallback metrics',
    ],
    interviewFocus: [
      'How is CLS calculated? Explain impact fraction and distance fraction.',
      'What are the top 3 causes of high CLS and how do you fix each?',
      'Why should you not rely on Lighthouse alone to catch all CLS issues?',
      'How does font-display: optional differ from font-display: swap for CLS?',
    ],
  };
}
