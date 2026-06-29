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
  selector: 'app-perf-resource-hints',
  standalone: true,
  imports: [CommonModule, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './resource-hints.html',
  styleUrl: './resource-hints.scss',
})
export class PerfResourceHints {

  quickRef: QuickRefItem[] = [
    { name: 'preload',        type: 'keyword', desc: 'Fetch a resource at high priority for the CURRENT page — discovered late by the parser' },
    { name: 'prefetch',       type: 'keyword', desc: 'Fetch at low priority for the NEXT navigation — cached for later; no current-page benefit' },
    { name: 'preconnect',     type: 'keyword', desc: 'Warm TCP/TLS connection to a third-party origin before it\'s needed — saves ~150ms per round-trip' },
    { name: 'dns-prefetch',   type: 'keyword', desc: 'Resolve DNS for an origin — subset of preconnect; use when preconnect is too many origins' },
    { name: 'modulepreload',  type: 'keyword', desc: 'Like preload but also parses and compiles the ES module — ideal for entry JS chunks' },
    { name: 'as=',            type: 'syntax',  desc: 'Required on preload — tells browser resource type for priority (as="image", "script", "font", "style")' },
    { name: 'crossorigin',    type: 'syntax',  desc: 'Required on preload for fonts and CORS resources — must match how the resource is consumed' },
    { name: 'fetchpriority',  type: 'syntax',  desc: 'fetchpriority="high|low|auto" — fine-tunes browser priority within a type; set "high" on LCP image preload' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'preload — high-priority fetch for the current page',
      points: [
        'preload tells the browser "I will definitely need this resource soon" — fetch it NOW at high priority, even before the parser discovers it.',
        'Best for: LCP hero images, critical fonts, late-discovered render-blocking scripts, CSS files loaded via JS.',
        'The as= attribute is MANDATORY — it sets the correct request priority and allows cache matching.',
        'Font preloads require crossorigin even for same-origin fonts — fonts always use CORS mode.',
        'Limit preloads to 2–3 truly critical resources; more preloads compete for bandwidth and can hurt LCP.',
      ],
    },
    {
      heading: 'prefetch — low-priority fetch for the next page',
      points: [
        'prefetch fetches resources at the LOWEST priority after the current page loads — not useful for current-page performance.',
        'Ideal for: JS chunks for a route the user is likely to navigate to next (e.g. after login → dashboard).',
        'The browser can ignore prefetch under data-saver mode or poor connectivity.',
        'prefetched resources are cached with their normal Cache-Control headers — reused when the next page loads.',
        'Modern: Speculation Rules API (Chrome 108+) is a more powerful successor that can also PRERENDER full pages.',
      ],
    },
    {
      heading: 'preconnect — warm the connection to a third-party origin',
      points: [
        'preconnect performs DNS lookup + TCP handshake + TLS negotiation upfront for a third-party origin.',
        'Saves ~150–400 ms per origin on first request — significant for fonts, CDNs, and API servers.',
        'Use for origins you WILL definitely use on the current page — idle connections are closed after ~10 s.',
        'Add crossorigin for CORS origins (fonts, APIs with credentials): <link rel="preconnect" href="…" crossorigin>.',
        'Limit to 2–4 origins; every preconnect holds open a TCP socket and uses system resources.',
      ],
    },
    {
      heading: 'dns-prefetch — lightweight DNS-only warm-up',
      points: [
        'dns-prefetch resolves only the DNS for an origin — cheaper than preconnect (no TCP/TLS).',
        'Use for origins you might use but are not certain about (e.g. A/B tested third-party analytics).',
        'Supported in all browsers including IE11; preconnect is not supported in older browsers.',
        'Combining both is safe — browsers that support preconnect use it; others fall back to dns-prefetch.',
        'Pattern: <link rel="preconnect" href="https://cdn.example.com"> <link rel="dns-prefetch" href="https://cdn.example.com">',
      ],
    },
    {
      heading: 'modulepreload — preload + parse + compile ES modules',
      points: [
        'modulepreload goes further than preload: it fetches, parses, AND compiles the JS module in the background.',
        'Critical for SPAs where the main JS bundle is split — preloading chunks that the router will need next.',
        'Transitively preloads static imports of the preloaded module in browsers that support it.',
        'Use for entry-point JS and top-level lazy chunks (the ones loaded on first interaction or route change).',
        'Does not require the as= attribute — the browser knows it\'s a module.',
      ],
    },
    {
      heading: 'fetchpriority — fine-tune browser priority signals',
      points: [
        'fetchpriority="high" boosts a resource above its type-default priority — key for the LCP image preload.',
        'fetchpriority="low" demotes a resource — useful for below-fold images you don\'t want competing with LCP.',
        'fetchpriority="auto" (default) — browser uses its own heuristics.',
        'Adding fetchpriority="high" to every image defeats the purpose — only one resource should be "highest".',
        'Works on <img>, <link rel="preload">, <script>, and <iframe>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Complete resource hints setup',
      language: 'html',
      code: `<head>
  <!-- 1. preconnect: warm TCP/TLS to critical origins -->
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
  <link rel="preconnect" href="https://fonts.gstatic.com"   crossorigin />
  <link rel="preconnect" href="https://cdn.example.com" />

  <!-- dns-prefetch fallback for browsers without preconnect support -->
  <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
  <link rel="dns-prefetch" href="https://cdn.example.com" />

  <!-- 2. preload: high-priority fetch for current-page critical resources -->

  <!-- LCP hero image — fetchpriority="high" boosts above other images -->
  <link rel="preload" as="image" href="/hero.avif"
        imagesrcset="/hero-400.avif 400w, /hero-800.avif 800w, /hero-1200.avif 1200w"
        imagesizes="(max-width: 768px) 100vw, 50vw"
        fetchpriority="high" />

  <!-- Critical web font — crossorigin required even for same-origin fonts -->
  <link rel="preload" as="font" type="font/woff2"
        href="/fonts/inter.woff2" crossorigin />

  <!-- Late-discovered stylesheet (loaded by JS or async) -->
  <link rel="preload" as="style" href="/above-fold.css"
        onload="this.rel='stylesheet'" />
  <noscript><link rel="stylesheet" href="/above-fold.css" /></noscript>

  <!-- 3. modulepreload: fetch + parse + compile JS entry chunk -->
  <link rel="modulepreload" href="/js/main.mjs" />
  <link rel="modulepreload" href="/js/vendor.mjs" />

  <!-- 4. prefetch: low-priority fetch for likely NEXT navigation -->
  <link rel="prefetch" href="/js/dashboard.chunk.mjs" />
</head>`,
    },
    {
      label: 'Dynamic resource hints (JS)',
      language: 'typescript',
      code: `// Programmatically inject resource hints at runtime

function preload(href: string, as: string, options?: { crossorigin?: boolean; type?: string }) {
  const link = document.createElement('link');
  link.rel  = 'preload';
  link.href = href;
  link.as   = as;
  if (options?.type)       link.type = options.type;
  if (options?.crossorigin) link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

function prefetch(href: string) {
  const link = document.createElement('link');
  link.rel  = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

function preconnect(origin: string, crossorigin = false) {
  const link = document.createElement('link');
  link.rel  = 'preconnect';
  link.href = origin;
  if (crossorigin) link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

// Warm the connection when user hovers a link (likely next page)
document.querySelectorAll('nav a').forEach(anchor => {
  anchor.addEventListener('mouseenter', () => {
    const url = (anchor as HTMLAnchorElement).href;
    prefetch(url);   // prefetch the likely next page resource
  }, { once: true });
});`,
    },
    {
      label: 'preload fonts correctly',
      language: 'html',
      code: `<!-- WRONG: missing crossorigin — browser fetches twice (once for preload, once for @font-face) -->
<link rel="preload" as="font" href="/fonts/inter.woff2" />

<!-- WRONG: missing as= — browser warns and fetches at wrong priority -->
<link rel="preload" href="/fonts/inter.woff2" crossorigin />

<!-- CORRECT: as="font" + crossorigin + type is best practice -->
<link rel="preload" as="font" type="font/woff2"
      href="/fonts/inter.woff2" crossorigin />

<!-- The @font-face declaration that uses the preloaded font -->
<style>
  @font-face {
    font-family: 'Inter';
    src: url('/fonts/inter.woff2') format('woff2');
    /* href must EXACTLY match preload href or browser fetches twice */
    font-display: swap;
  }
</style>

<!-- For Google Fonts: preconnect reduces the connection time, not the font itself -->
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700" />
<!-- To preload the actual woff2: inspect the CSS response for the exact URL first -->`,
    },
    {
      label: 'Verify hints in DevTools',
      language: 'typescript',
      code: `// Check if a resource was preloaded (no double-fetch)
// Open DevTools → Network → filter by the resource name
// If preloaded correctly: one request with Initiator = "link rel=preload"
// If preloaded incorrectly: TWO requests — preload + normal fetch

// Programmatically verify preload worked
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    const r = entry as PerformanceResourceTiming;
    // initiatorType === 'link' for preloaded resources
    if (r.initiatorType === 'link' && r.name.includes('hero')) {
      console.log('Hero image preloaded in:', r.duration.toFixed(0), 'ms');
      console.log('Fetch start:', r.fetchStart.toFixed(0), 'ms after navigation');
    }
  }
});
observer.observe({ type: 'resource', buffered: true });

// Check for unused preloads (browser warns in console after 3s)
// "The resource ... was preloaded using link preload but not used"
// This means the as= or href doesn't match consumption — double-fetch risk`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Preloading fonts without crossorigin',
      wrong: `<link rel="preload" as="font" href="/fonts/inter.woff2" />
<!-- Browser fetches the font TWICE: once for preload, once for @font-face -->`,
      right: `<link rel="preload" as="font" type="font/woff2"
      href="/fonts/inter.woff2" crossorigin />`,
      explanation: 'Fonts always use CORS mode regardless of origin. Without crossorigin on the preload, the preloaded response is not matched to the @font-face request — the font is fetched twice, wasting bandwidth.',
    },
    {
      title: 'Confusing preload and prefetch',
      wrong: `<!-- Using prefetch for the current page's LCP image — fetched at lowest priority -->
<link rel="prefetch" href="/hero.avif" />`,
      right: `<!-- preload for current page; prefetch for next navigation -->
<link rel="preload" as="image" href="/hero.avif" fetchpriority="high" />
<link rel="prefetch" href="/js/next-page.chunk.mjs" />`,
      explanation: 'prefetch is for resources needed on the NEXT page — it fetches at the lowest possible priority and may be delayed indefinitely on slow connections. It does nothing to improve the current page\'s LCP.',
    },
    {
      title: 'Omitting as= on preload links',
      wrong: `<!-- as= missing — browser fetches at lowest priority and may double-fetch -->
<link rel="preload" href="/fonts/inter.woff2" crossorigin />`,
      right: `<link rel="preload" as="font" href="/fonts/inter.woff2" crossorigin />`,
      explanation: 'Without as=, the browser cannot determine the correct priority for the resource and may fetch it at the wrong priority. It also cannot match the preload to the actual consumption request, causing a double-fetch.',
    },
    {
      title: 'Over-preconnecting to too many origins',
      wrong: `<!-- Preconnecting to 8 origins — opens 8 TCP/TLS connections that may never be used -->
<link rel="preconnect" href="https://a.cdn.com" />
<link rel="preconnect" href="https://b.cdn.com" />
<link rel="preconnect" href="https://c.analytics.com" />
<!-- ... 5 more -->`,
      right: `<!-- Only the 2-3 origins critical to the current page -->
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preconnect" href="https://cdn.example.com" />
<!-- Others: use dns-prefetch as a lighter alternative -->
<link rel="dns-prefetch" href="https://c.analytics.com" />`,
      explanation: 'Each preconnect holds a TCP socket open for ~10 seconds. Preconnecting to many origins ties up OS resources and can actually slow down the truly critical connections by competing for bandwidth.',
    },
    {
      title: 'Preloading the wrong resource URL',
      wrong: `<!-- Preload points to /hero.webp but img src uses /hero.avif — double-fetch -->
<link rel="preload" as="image" href="/hero.webp" />
<img src="/hero.avif" alt="Hero" />`,
      right: `<!-- URLs must match exactly for the preload cache to be used -->
<link rel="preload" as="image" href="/hero.avif" fetchpriority="high" />
<img src="/hero.avif" alt="Hero" />`,
      explanation: 'The browser matches the preload to the resource by URL. A mismatch causes the resource to be fetched twice — once for the (unused) preload and once normally when the element is parsed.',
    },
    {
      title: 'Using preload for below-fold images',
      wrong: `<!-- Preloading carousel images 2-5 — compete with LCP image for bandwidth -->
<link rel="preload" as="image" href="/slide1.avif" />
<link rel="preload" as="image" href="/slide2.avif" />
<link rel="preload" as="image" href="/slide3.avif" />`,
      right: `<!-- Only preload the LCP image; lazy-load the rest -->
<link rel="preload" as="image" href="/slide1.avif" fetchpriority="high" />
<img src="/slide2.avif" loading="lazy" alt="Slide 2" />
<img src="/slide3.avif" loading="lazy" alt="Slide 3" />`,
      explanation: 'Preloading multiple large images saturates bandwidth and delays the LCP image. Preload only the LCP element; use loading="lazy" for everything below the fold.',
    },
  ];

  challenge: Challenge = {
    title: 'Add resource hints to a slow <head>',
    language: 'html',
    description: `The page below has four missing resource hint opportunities that are causing
slow LCP and first-paint times. Add the correct hints:

1. Hero image is discovered late — preload it
2. Google Fonts connection is cold — warm it
3. Dashboard JS chunk loads on every login — prefetch it when user lands on login page
4. Inter font woff2 is fetched twice — fix the font preload`,
    hints: [
      'Use <link rel="preload" as="image" fetchpriority="high"> for the hero',
      'Preconnect to both fonts.googleapis.com AND fonts.gstatic.com with crossorigin',
      'Use <link rel="prefetch"> for the dashboard chunk — it\'s the likely next page',
      'Font preloads require crossorigin and the type attribute',
    ],
    starterCode: `<head>
  <meta charset="UTF-8" />
  <!-- No resource hints — browser discovers everything late -->

  <link rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700" />

  <style>
    @font-face {
      font-family: 'Inter';
      src: url('/fonts/inter.woff2') format('woff2');
      font-display: swap;
    }
  </style>
  <!-- Missing preload for /fonts/inter.woff2 — fetched twice -->

  <script defer src="/js/app.mjs"></script>
  <!-- Dashboard bundle not prefetched on login page -->
</head>
<body>
  <!-- Hero image is deep in the HTML — parser discovers it late -->
  <div style="padding: 200px 0">
    <img src="/hero.avif" alt="Welcome" width="1200" height="630" />
  </div>
</body>`,
    solution: `<head>
  <meta charset="UTF-8" />

  <!-- Fix 2: preconnect to warm Google Fonts connections -->
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

  <!-- Fix 1: preload hero image at high priority before parser finds it -->
  <link rel="preload" as="image" href="/hero.avif" fetchpriority="high" />

  <!-- Fix 4: preload font with correct as, type, and crossorigin -->
  <link rel="preload" as="font" type="font/woff2"
        href="/fonts/inter.woff2" crossorigin />

  <link rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700" />

  <style>
    @font-face {
      font-family: 'Inter';
      src: url('/fonts/inter.woff2') format('woff2'); /* matches preload href */
      font-display: swap;
    }
  </style>

  <script defer src="/js/app.mjs"></script>

  <!-- Fix 3: prefetch likely next page resources -->
  <link rel="prefetch" href="/js/dashboard.chunk.mjs" />
</head>
<body>
  <div style="padding: 200px 0">
    <img src="/hero.avif" alt="Welcome" width="1200" height="630" />
  </div>
</body>`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which resource hint should you use for a resource needed on the NEXT page navigation?',
      options: ['preload', 'preconnect', 'prefetch', 'modulepreload'],
      answer: 2,
      explanation: 'prefetch fetches resources at the lowest priority after the current page finishes loading, caching them for the next navigation. preload is for the current page, preconnect warms connections, modulepreload is for JS modules.',
    },
    {
      q: 'Why does a font preload require the crossorigin attribute?',
      options: [
        'Fonts are always served from a different origin',
        'Fonts always use CORS mode regardless of origin — without crossorigin the preload does not match the @font-face request',
        'crossorigin enables gzip compression for font files',
        'It is only required for woff2 format, not woff',
      ],
      answer: 1,
      explanation: 'Font requests always use CORS mode. Without crossorigin on the preload, the browser creates a non-CORS preload request that cannot be matched to the CORS @font-face request — causing a double-fetch.',
    },
    {
      q: 'What does modulepreload do that preload does not?',
      options: [
        'Fetches at a higher priority than preload',
        'Works for CSS files as well as JS',
        'Fetches AND parses/compiles the ES module in the background',
        'Only works in Firefox and Safari',
      ],
      answer: 2,
      explanation: 'modulepreload fetches, parses, AND compiles the JS module, so when it is actually needed the module is immediately available. Regular preload only fetches — the parse/compile still happens when the script executes.',
    },
    {
      q: 'What is the correct as= value for preloading a web font?',
      options: ['as="font"', 'as="resource"', 'as="style"', 'as="text"'],
      answer: 0,
      explanation: 'as="font" is required for font preloads. It sets the correct request priority and allows the preloaded response to be matched when @font-face fetches the same URL.',
    },
    {
      q: 'When should you avoid using preconnect?',
      options: [
        'When the origin uses HTTPS',
        'When the origin is the same as your own page',
        'When you are not certain the connection will be used on the current page',
        'When the origin serves fonts',
      ],
      answer: 2,
      explanation: 'preconnect opens a TCP/TLS connection and holds it for ~10 seconds. If the connection is never used, you\'ve wasted system resources and bandwidth. Use dns-prefetch for uncertain origins instead.',
    },
    {
      q: 'What is the Fetch Priority API (fetchpriority attribute) and what is its primary use case?',
      options: ['It sets the HTTP priority header', 'It signals to the browser the relative importance of a resource for scheduling its download', 'It forces synchronous fetching', 'It bypasses the HTTP cache'],
      answer: 1,
      explanation: 'fetchpriority="high" on the LCP image tells the browser to download it with higher priority than other images, even above below-the-fold images that might otherwise compete for bandwidth. fetchpriority="low" is useful for non-critical images loaded in the initial HTML. This is different from preload — it doesn\'t change when the resource is discovered, only its priority in the fetch queue.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I know if my preload is working or causing a double-fetch?',
      a: 'Open DevTools → Network tab → filter by the resource URL. If you see TWO requests — one with initiator "link rel=preload" and one from the element — the preload is not matching. Common causes: mismatched URL, missing crossorigin on font preload, or missing as= attribute. Chrome also logs "was preloaded but not used" warnings in the Console after 3 seconds.',
    },
    {
      q: 'Should I preload my main JavaScript bundle?',
      a: 'Usually not — script tags with defer or type="module" already download in parallel with HTML parsing, and the browser\'s preload scanner discovers them early. Use modulepreload for lazy-loaded chunks that are critical for the first interaction. Over-preloading JS competes with the LCP image for bandwidth.',
    },
    {
      q: 'What is the difference between preconnect and dns-prefetch in practice?',
      a: 'preconnect performs DNS + TCP + TLS — saving 3 network round-trips (~150–400 ms total). dns-prefetch only resolves DNS — saving 1 round-trip (~20–120 ms). Use preconnect for origins you are certain will be used; dns-prefetch for origins you might use. Combine both for maximum browser compatibility.',
    },
    {
      q: 'Can I add resource hints dynamically with JavaScript?',
      a: 'Yes — create a <link> element and append it to document.head at runtime. This is useful for prefetching the next-page bundle when a user hovers a navigation link, or preconnecting to an origin that\'s only needed after a user action. Dynamic hints are processed the same way as static HTML hints.',
    },
    {
      q: 'Is prefetch affected by the user\'s data-saver (Lite Mode) setting?',
      a: 'Yes. Browsers may ignore prefetch hints when the user has enabled data-saver mode, has a metered connection, or when Chrome\'s "Lite Mode" is active. preload is respected regardless — it\'s for resources needed now, not speculatively. This is one reason Speculation Rules API is preferred for next-page prerendering.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Resource hints tell the browser what to fetch before it discovers it naturally — preload for now, prefetch for next, preconnect for origins, dns-prefetch as a lightweight fallback.',
    mustKnow: [
      'preload: high-priority fetch for current page; as= required; crossorigin required for fonts',
      'prefetch: lowest-priority fetch for next navigation; browser may ignore under data-saver',
      'preconnect: TCP/TLS warm-up for critical origins; save 150–400 ms; limit to 2–4 origins',
      'dns-prefetch: DNS-only warm-up; lighter than preconnect; IE11 compatible',
      'modulepreload: fetch + parse + compile ES module; ideal for JS entry chunks',
      'fetchpriority="high": boost one preload above others; use on LCP image only',
    ],
    interviewFocus: [
      'What is the difference between preload and prefetch?',
      'Why do font preloads require the crossorigin attribute?',
      'When would you choose dns-prefetch over preconnect?',
      'How do you detect that a preload is causing a double-fetch?',
    ],
  };
}
