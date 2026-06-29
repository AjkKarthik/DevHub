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
  templateUrl: './lcp.html',
  styleUrl: './lcp.scss',
})
export class PerfLcp {

  quickRef: QuickRefItem[] = [
    { name: 'LCP threshold',             type: 'operator', desc: 'Good: &lt; 2.5s · Needs Improvement: &lt; 4.0s · Poor: ≥ 4.0s' },
    { name: 'fetchpriority="high"',       type: 'keyword',  desc: 'Signals to the browser this resource is highest priority; apply to the LCP &lt;img&gt; and its &lt;link rel="preload"&gt;.' },
    { name: 'loading="lazy"',             type: 'keyword',  desc: 'NEVER use on the LCP image — defers loading until viewport proximity, directly worsening LCP.' },
    { name: '<link rel="preload">',       type: 'syntax',   desc: 'Moves the LCP image request to the top of the waterfall; must have as="image" and match the src/srcset.' },
    { name: 'TTFB',                       type: 'method',   desc: 'Time to First Byte — LCP cannot be faster than TTFB. Target &lt; 800ms. Fix: CDN, edge caching, server-side optimisation.' },
    { name: 'WebP / AVIF',               type: 'keyword',  desc: 'AVIF ≈ 50% smaller than JPEG; WebP ≈ 30% smaller. Serve via &lt;picture&gt; with JPEG fallback for maximum compatibility.' },
    { name: 'srcset + sizes',             type: 'syntax',   desc: 'Responsive image attributes; browser picks the best variant for device pixel ratio and viewport width.' },
    { name: 'background-image LCP',       type: 'syntax',   desc: 'CSS background-image can be LCP candidate but cannot be discovered early; use &lt;img&gt; for LCP images when possible.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What LCP measures and which elements qualify',
      points: [
        'LCP reports the render time of the largest <em>image or text block</em> visible within the viewport, from the moment the user navigates to the page.',
        'Elements eligible as LCP candidates: <code>&lt;img&gt;</code> elements, <code>&lt;image&gt;</code> inside an SVG, <code>&lt;video&gt;</code> poster images, elements with a CSS <code>background-image</code>, and block-level text nodes (e.g. <code>&lt;h1&gt;</code>, <code>&lt;p&gt;</code>, <code>&lt;div&gt;</code> containing text).',
        'The LCP candidate can <strong>change</strong> as the page loads. The browser continuously tracks the largest visible element and updates the LCP candidate until user interaction or page hide. The final value is reported at that point.',
        'Inline SVG, <code>&lt;canvas&gt;</code>, <code>&lt;iframe&gt;</code>, and CSS gradients do NOT qualify as LCP candidates.',
      ]
    },
    {
      heading: 'The four sub-parts of LCP',
      points: [
        '<strong>Time to First Byte (TTFB)</strong>: LCP cannot begin until the server responds. Every millisecond of TTFB adds directly to LCP. Target &lt; 800ms.',
        '<strong>Resource load delay</strong>: the gap between TTFB and when the browser starts loading the LCP resource. Caused by render-blocking CSS/JS that must parse before the image is discovered.',
        '<strong>Resource load time</strong>: the time to actually download the LCP image. Affected by image size, format, CDN proximity, and HTTP version.',
        '<strong>Element render delay</strong>: time between the image download completing and the browser painting it. Usually small but can be large if the main thread is busy with JS execution.',
        'Each sub-part must be optimised independently — fixing one while ignoring another will not get you to a "Good" LCP score.',
      ]
    },
    {
      heading: 'Preloading the LCP image',
      points: [
        'Without a preload hint, the browser discovers the LCP image only when the HTML parser reaches the <code>&lt;img&gt;</code> tag. If there are render-blocking stylesheets or scripts before it, the image is discovered late.',
        'A <code>&lt;link rel="preload" as="image" href="..."&gt;</code> in <code>&lt;head&gt;</code> tells the browser to start downloading the image at the highest priority before it parses any blocking resources.',
        'The preload href must <strong>exactly match</strong> what the browser will use: if the <code>&lt;img&gt;</code> has <code>srcset</code>, use <code>imagesrcset</code> and <code>imagesizes</code> attributes on the preload link.',
        'Always add <code>fetchpriority="high"</code> to both the <code>&lt;link rel="preload"&gt;</code> and the <code>&lt;img&gt;</code> tag. Without it, the browser may still deprioritise the image behind other resources.',
      ]
    },
    {
      heading: 'Image formats: JPEG vs WebP vs AVIF',
      points: [
        '<strong>AVIF</strong> (AV1 Image Format): typically 40–60% smaller than JPEG at equivalent quality. Excellent for photographs. Browser support: Chrome 85+, Firefox 93+, Safari 16+.',
        '<strong>WebP</strong>: typically 25–35% smaller than JPEG. Very wide support (Chrome 17+, Firefox 65+, Safari 14+). Good fallback when AVIF is not supported.',
        '<strong>JPEG</strong>: universal support. Use as the final fallback inside a <code>&lt;picture&gt;</code> element.',
        'The <code>&lt;picture&gt;</code> element lets you offer AVIF → WebP → JPEG in order of preference; the browser picks the first format it supports.',
        'For the LCP image, prefer serving it as AVIF via <code>&lt;picture&gt;</code> with a WebP or JPEG fallback, and use <code>&lt;img&gt;</code> as the last child (not <code>&lt;source&gt;</code>) so the preload link works correctly.',
      ]
    },
    {
      heading: 'Responsive LCP images with srcset and sizes',
      points: [
        '<code>srcset</code> provides a list of image variants at different widths. The browser picks the best one based on the device pixel ratio (DPR) and viewport width.',
        '<code>sizes</code> tells the browser how wide the image will be rendered in CSS pixels at different breakpoints (before CSS loads). Without <code>sizes</code>, the browser assumes 100vw and may download a much larger image than needed.',
        'Example: <code>sizes="(max-width: 640px) 100vw, 1200px"</code> tells the browser the image fills the full viewport on mobile and is 1200px wide on desktop.',
        'When preloading a responsive image, use <code>imagesrcset</code> and <code>imagesizes</code> on the <code>&lt;link&gt;</code> tag so the browser preloads the correct variant for the current viewport.',
      ]
    },
    {
      heading: 'Client-side rendering and LCP',
      points: [
        'Pages built entirely with client-side JavaScript (React SPA, Angular SPA without SSR) have a fundamentally disadvantaged LCP: the browser downloads the HTML, then downloads the JS bundle, then executes it, then renders content. LCP cannot happen until all three steps complete.',
        'In a purely client-side rendered app, the LCP element does not exist in the initial HTML. The server sends an empty <code>&lt;div id="root"&gt;</code> and the JS builds the DOM. The browser has nothing large to paint until JS finishes.',
        'Solutions: Server-Side Rendering (SSR) sends pre-rendered HTML so LCP content is in the first response; Static Site Generation (SSG) pre-renders at build time for the best possible TTFB.',
        'If full SSR is not feasible, prerendering just the above-the-fold content (partial SSR) can significantly improve LCP by delivering the hero image in the initial HTML.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Optimal LCP image HTML',
      language: 'html',
      code: `<!-- 1. Preload the LCP image early in <head> -->
<head>
  <link
    rel="preload"
    as="image"
    href="/hero.avif"
    imagesrcset="/hero-480.avif 480w, /hero-960.avif 960w, /hero-1920.avif 1920w"
    imagesizes="(max-width: 640px) 100vw, 1200px"
    fetchpriority="high"
  >
</head>

<!-- 2. LCP <img> in <body> — fetchpriority, no loading="lazy" -->
<picture>
  <source type="image/avif" srcset="/hero-480.avif 480w, /hero-960.avif 960w, /hero-1920.avif 1920w" sizes="(max-width: 640px) 100vw, 1200px">
  <source type="image/webp" srcset="/hero-480.webp 480w, /hero-960.webp 960w, /hero-1920.webp 1920w" sizes="(max-width: 640px) 100vw, 1200px">
  <img
    src="/hero-1920.jpg"
    alt="Hero image"
    width="1920"
    height="1080"
    fetchpriority="high"
    decoding="async"
  >
</picture>

<!-- ❌ NEVER do this for the LCP image -->
<!-- <img src="/hero.jpg" loading="lazy"> -->`
    },
    {
      label: 'Preload background-image',
      language: 'html',
      code: `<!-- If the LCP element uses CSS background-image, the browser can't
     discover it from CSS until after the stylesheet loads and parses.
     Preload it explicitly in <head>: -->
<link
  rel="preload"
  as="image"
  href="/hero-bg.webp"
  fetchpriority="high"
>

<style>
  .hero {
    background-image: url('/hero-bg.webp');
    background-size: cover;
    height: 600px;
  }
</style>

<!-- Better: convert CSS background LCP to an <img> with position: absolute
     so the preload mechanism works automatically and the element is visible
     to the LCP reporter. background-image is harder to optimise than <img>. -->`
    },
    {
      label: 'Measure LCP',
      language: 'typescript',
      code: `import { onLCP, type LCPMetric } from 'web-vitals/attribution';

onLCP((metric: LCPMetric) => {
  const { element, url, loadTime, renderTime } = metric.attribution.lcpEntry!;

  console.log('LCP value:', metric.value, 'ms');
  console.log('Rating:', metric.rating); // 'good' | 'needs-improvement' | 'poor'
  console.log('LCP element:', element);  // the actual DOM node
  console.log('Image URL:', url);        // URL of the image (if any)
  console.log('Load time:', loadTime);   // resource download duration
  console.log('Render time:', renderTime); // render delay after load

  // Send to analytics
  navigator.sendBeacon('/api/vitals', JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    element: element?.tagName,
  }));
});`
    },
    {
      label: 'Check LCP in DevTools',
      language: 'html',
      code: `<!-- Chrome DevTools method 1: Performance panel -->
<!-- 1. Open DevTools → Performance tab
     2. Click "⚙ More" → check "Web Vitals"
     3. Record page load
     4. Green LCP marker shows on the timeline
     5. Click it to see the LCP element, URL, and sub-part breakdown -->

<!-- Chrome DevTools method 2: Quick check with console -->
<script>
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];
  console.log('LCP candidate element:', lastEntry.element);
  console.log('LCP time:', lastEntry.startTime, 'ms');
}).observe({ type: 'largest-contentful-paint', buffered: true });
</script>

<!-- PageSpeed Insights: paste your URL at pagespeed.web.dev
     Shows both lab (Lighthouse) and field (CrUX) LCP data -->`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Lazy-loading the LCP image',
      wrong: '<img src="/hero.jpg" loading="lazy" alt="Hero">',
      right: '<img src="/hero.jpg" fetchpriority="high" alt="Hero" width="1200" height="630">',
      explanation: 'loading="lazy" tells the browser to defer the request until the image is near the viewport. For the hero image (which IS the LCP element and already above-the-fold), this delays the most important resource load. Remove it and add fetchpriority="high" instead.',
    },
    {
      title: 'Missing <link rel="preload"> for LCP image',
      wrong: '<!-- No preload → browser discovers image late after blocking resources -->',
      right: '<link rel="preload" as="image" href="/hero.avif" fetchpriority="high">',
      explanation: 'Without a preload hint, the browser finds the LCP image only when the HTML parser reaches the <img> tag. If there are render-blocking stylesheets or scripts above it, the image discovery is delayed. A preload in <head> starts the download immediately.',
    },
    {
      title: 'Preload href does not match the rendered src',
      wrong: '<link rel="preload" as="image" href="/hero-desktop.webp"> <!-- but img uses srcset -->',
      right: '<link rel="preload" as="image" imagesrcset="/hero-480.webp 480w, /hero-1920.webp 1920w" imagesizes="100vw">',
      explanation: 'If the <img> uses srcset, the preload must use imagesrcset and imagesizes to match the variant the browser will actually request. A mismatched preload downloads a resource that never gets used (wasted bandwidth) while the real LCP image still loads late.',
    },
    {
      title: 'Serving JPEG instead of WebP/AVIF',
      wrong: '<img src="/hero.jpg" ...>',
      right: '<picture><source type="image/avif" srcset="/hero.avif"><source type="image/webp" srcset="/hero.webp"><img src="/hero.jpg" ...></picture>',
      explanation: 'AVIF is typically 40–60% smaller than JPEG at the same visual quality. Even with the same connection speed, a smaller image loads faster, directly improving LCP. Use <picture> to serve AVIF → WebP → JPEG in order of browser support.',
    },
    {
      title: 'High TTFB ignored while tuning images',
      wrong: '// Optimised image to 30KB but TTFB is 2.1s — still getting Poor LCP',
      right: '// Add CDN, enable edge caching for HTML, move to a closer region',
      explanation: 'LCP cannot start until the browser receives the first byte. If TTFB is 2.1s and the LCP "Good" threshold is 2.5s, there is only 400ms left for everything else. CDNs, server-side caching, and HTTP/2 push can reduce TTFB from seconds to milliseconds.',
    },
    {
      title: 'Applying fetchpriority="high" to every image',
      wrong: '<img src="hero.jpg" fetchpriority="high"> <img src="logo.svg" fetchpriority="high"> <img src="card.jpg" fetchpriority="high">',
      right: '<img src="hero.jpg" fetchpriority="high"> <!-- only the LCP element -->',
      explanation: 'fetchpriority="high" works by de-prioritising other resources relatively. If multiple images are marked high priority, the browser has no useful signal and may fetch them all at lower bandwidth than intended. Only the LCP image should have fetchpriority="high".',
    },
  ];

  challenge: Challenge = {
    title: 'Optimise the LCP image markup',
    language: 'html',
    description: 'The page below has a hero image with four LCP anti-patterns. Fix all of them: add a preload hint in <head>, serve AVIF and WebP formats via <picture>, remove lazy loading, and add explicit dimensions and fetchpriority.',
    hints: [
      'Add <link rel="preload" as="image" fetchpriority="high"> in <head> before the closing </head>.',
      'Wrap <img> in a <picture> element with two <source> tags: one for AVIF and one for WebP.',
      'Replace loading="lazy" with fetchpriority="high" on the <img>.',
      'Add width and height attributes matching the image\'s natural dimensions (1200×630).',
    ],
    starterCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Product Landing</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- Hero image — LCP candidate (has 4 problems) -->
  <img src="/hero.jpg" alt="Product hero" loading="lazy">

  <main>
    <h1>Our Product</h1>
    <p>Fast, reliable, and beautiful.</p>
  </main>
</body>
</html>`,
    solution: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Product Landing</title>
  <!-- Fix 1: preload the LCP image so it starts downloading before CSS blocks -->
  <link
    rel="preload"
    as="image"
    href="/hero.avif"
    imagesrcset="/hero.avif"
    fetchpriority="high"
  >
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- Fix 2: serve AVIF/WebP via <picture>; Fix 3: remove loading="lazy" and
       add fetchpriority="high"; Fix 4: add explicit width and height -->
  <picture>
    <source type="image/avif" srcset="/hero.avif">
    <source type="image/webp" srcset="/hero.webp">
    <img
      src="/hero.jpg"
      alt="Product hero"
      width="1200"
      height="630"
      fetchpriority="high"
      decoding="async"
    >
  </picture>

  <main>
    <h1>Our Product</h1>
    <p>Fast, reliable, and beautiful.</p>
  </main>
</body>
</html>`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which of these elements can be the LCP candidate?',
      options: ['<canvas>', '<iframe>', '<img>', '<svg> (inline)'],
      answer: 2,
      explanation: '<img> is one of the valid LCP candidate types. <canvas>, <iframe>, and inline <svg> are explicitly excluded from the LCP candidate set. Background images via CSS also qualify, but only when they contain actual content (not gradients).',
    },
    {
      q: 'A preload hint is placed in <head>. The <img> uses srcset. What must the preload use?',
      options: [
        'href only — the browser figures out the rest',
        'imagesrcset and imagesizes to match the srcset/sizes on the img',
        'as="srcset" attribute',
        'data-href to hint the srcset URL',
      ],
      answer: 1,
      explanation: 'When the LCP image uses srcset, the preload link must use imagesrcset (and imagesizes if sizes is set) so the browser preloads the exact variant it will use. A preload with only href may preload the wrong image variant, wasting bandwidth without improving LCP.',
    },
    {
      q: 'TTFB is 2.2s. The "Good" LCP threshold is 2.5s. What is the best first action?',
      options: [
        'Compress the hero image to under 10KB',
        'Add loading="lazy" to all below-fold images',
        'Reduce TTFB: add a CDN, enable server-side caching, or use edge rendering',
        'Switch from JPEG to WebP',
      ],
      answer: 2,
      explanation: 'LCP starts after TTFB. With 2.2s TTFB, there is only 300ms left before LCP would reach "Needs Improvement". No amount of image compression helps if the HTML arrives 2.2 seconds after navigation. Reducing TTFB is the highest-leverage fix here.',
    },
    {
      q: 'Which format offers the best compression ratio for photographic LCP images in 2025?',
      options: ['JPEG', 'WebP', 'AVIF', 'PNG'],
      answer: 2,
      explanation: 'AVIF (based on the AV1 video codec) offers the best compression, typically 40–60% smaller than JPEG at the same perceptual quality. WebP is second-best (~25–35% over JPEG). PNG is lossless and generally the largest. JPEG is the universal fallback.',
    },
    {
      q: 'An Angular SPA (no SSR) has consistently poor LCP. Which statement best explains why?',
      options: [
        'Angular bundles are always too large',
        'LCP requires server-side rendering to work at all',
        'The LCP element is rendered by JS and does not exist in the initial HTML; the browser must download and execute JS before anything large is painted',
        'fetchpriority is not supported in Angular apps',
      ],
      answer: 2,
      explanation: 'Client-side rendering produces an empty HTML shell. LCP cannot fire until JS downloads, parses, and renders the DOM — which can be several seconds. SSR (or SSG) pre-renders the hero content into the HTML response so the browser can paint LCP as soon as it parses the first response.',
    },
    {
      q: 'Why should the LCP image never have loading="lazy"?',
      options: ['Lazy loading is not supported for images', 'Lazy loading delays the fetch until the image enters the viewport, which directly delays LCP', 'It prevents the image from being indexed by Google', 'Lazy loading disables preloading'],
      answer: 1,
      explanation: 'loading="lazy" tells the browser to defer fetching the image until it is near the viewport. For the LCP image (which is almost always in the initial viewport), this means the browser does NOT start fetching during HTML parsing — it waits until layout is done, adding hundreds of milliseconds. Always use loading="eager" (or omit the attribute) on the LCP element, and add fetchpriority="high".',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does the browser decide which element is the LCP candidate?',
      a: 'The browser tracks all eligible elements (img, video poster, background-image, block text) and computes a "size score" for each — roughly the visible area of the element intersected with the viewport. As the page loads and new elements become visible, the browser continuously updates the LCP candidate to whichever has the largest score. The final LCP value is committed when the user first interacts with the page (click/keypress/scroll) or when the page becomes hidden (tab switch, navigate away).',
    },
    {
      q: 'What is the difference between fetchpriority="high" and rel="preload"?',
      a: '<code>rel="preload"</code> moves the resource request earlier in the waterfall — the browser fetches it immediately when the <head> is parsed, before render-blocking stylesheets finish. <code>fetchpriority="high"</code> adjusts the relative priority of a resource within its scheduling queue — it does not start the download earlier but ensures it gets more bandwidth when competing with other resources. For the LCP image, you want both: preload to discover the resource early, and fetchpriority="high" to ensure it gets maximum bandwidth priority.',
    },
    {
      q: 'Can text be the LCP element? How does it affect optimisation strategy?',
      a: 'Yes — a large <code>&lt;h1&gt;</code> or block of paragraph text can be the LCP candidate if it is larger than any image on the page. When text is the LCP element, the optimisation strategy shifts: ensure the font is loaded before LCP by using <code>&lt;link rel="preload" as="font"&gt;</code> and <code>font-display: swap</code>. Also ensure there are no render-blocking stylesheets that delay text rendering. For system fonts (no web font), text LCP is naturally very fast since no additional network request is needed.',
    },
    {
      q: 'My Lighthouse LCP is 1.8s but PageSpeed Insights field data shows 3.5s. How is that possible?',
      a: 'Lighthouse simulates a mid-range Android device on 4G throttling in a clean browser (no extensions). Real users may have third-party browser extensions that run content scripts and block the main thread; slower devices with less CPU for JS execution; genuinely worse network conditions; third-party scripts loaded into the page that Lighthouse does not execute; and cached vs uncached differences (Lighthouse always starts cold). The field data in PageSpeed Insights uses the 75th percentile from CrUX, meaning 25% of your real users have LCP WORSE than 3.5s.',
    },
    {
      q: 'How do I verify my preload is actually working and not wasted?',
      a: 'In Chrome DevTools Network panel, filter by "Img". Look for the LCP image request — if the preload is working, its "Priority" column will show "High" and its waterfall bar will start very early (before or simultaneously with render-blocking CSS). If the priority is "Low" or the request starts late, the preload is not being matched correctly (check that the href exactly matches what the browser requests, and use imagesrcset/imagesizes for srcset images). Also check the "Initiator" column — a successful preload shows "Other" or "Parser" rather than "document.getElementById" or a specific script.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'LCP measures when the largest visible image or text block renders — the biggest wins are preloading the hero image, using modern formats (AVIF/WebP), avoiding lazy-loading the LCP element, and fixing TTFB.',
    mustKnow: [
      'LCP threshold: Good &lt; 2.5s, Needs Improvement &lt; 4.0s, Poor ≥ 4.0s',
      'Eligible elements: img, video poster, background-image, block-level text — NOT canvas, iframe, inline SVG',
      'Preload: &lt;link rel="preload" as="image" fetchpriority="high"&gt; in &lt;head&gt; — use imagesrcset/imagesizes for srcset images',
      'Never use loading="lazy" on the LCP image — add fetchpriority="high" instead',
      'AVIF ≈ 40–60% smaller than JPEG; WebP ≈ 25–35% smaller — serve via &lt;picture&gt; with fallback',
      'TTFB is a ceiling for LCP — fix slow server responses with CDN and edge caching before tuning images',
      'Client-side rendering hurts LCP because the LCP element does not exist in the initial HTML — use SSR or SSG',
    ],
    interviewFocus: [
      'Name the four sub-parts of LCP and what each one represents',
      'What is the correct way to preload an LCP image that uses srcset?',
      'Why does a high Lighthouse LCP score not guarantee good field LCP?',
      'How does client-side rendering affect LCP and how would you fix it?',
      'When would text rather than an image be the LCP candidate, and how do you optimise that case?',
    ],
  };
}
