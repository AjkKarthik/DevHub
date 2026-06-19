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
  selector: 'app-perf-third-party-scripts',
  standalone: true,
  imports: [CommonModule, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './third-party-scripts.html',
  styleUrl: './third-party-scripts.scss',
})
export class PerfThirdPartyScripts {

  quickRef: QuickRefItem[] = [
    { name: 'Facade pattern',         type: 'keyword', desc: 'Lightweight placeholder that loads the real third-party widget only on user interaction' },
    { name: 'Partytown',              type: 'keyword', desc: 'Relocates third-party scripts to a Web Worker — keeps analytics off the main thread' },
    { name: 'async attribute',        type: 'keyword', desc: 'Script downloads in parallel, executes as soon as ready — does NOT preserve order' },
    { name: 'defer attribute',        type: 'keyword', desc: 'Script downloads in parallel, executes after HTML parse — preserves order, safe default' },
    { name: 'Consent-gated loading',  type: 'keyword', desc: 'Load analytics/ads only after user accepts cookies — reduces waste and improves INP' },
    { name: 'Resource Timing API',    type: 'keyword', desc: 'PerformanceResourceTiming entries — measure third-party script download/execution time' },
    { name: 'subresource integrity',  type: 'keyword', desc: 'integrity="sha384-…" on <script> — verifies the resource hasn\'t been tampered with' },
    { name: 'preconnect',             type: 'keyword', desc: 'Open TCP+TLS to third-party origin early — reduces connection overhead for must-load scripts' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The cost of third-party scripts',
      points: [
        'Third-party scripts (analytics, ads, chat, A/B testing) run on your main thread and consume your INP budget.',
        'A single analytics SDK can add 50-300 KB of JavaScript and 100-300 ms of main-thread blocking time.',
        'Third-party scripts cannot be cached alongside your app — they live on external origins with their own TTLs.',
        'Some scripts load further sub-resources (more JS, fonts, pixels) creating a chain of performance-impacting requests.',
        'Third-party slowdowns affect your Core Web Vitals and your SEO — Google measures CWV from real user data.',
      ],
    },
    {
      heading: 'Loading strategies — from worst to best',
      points: [
        'WORST: <script src="..."> in <head> — render-blocking, loads synchronously before any HTML is visible.',
        'BETTER: <script src="..." async> — parallel download, executes immediately when ready, not render-blocking.',
        'BEST: <script src="..." defer> — parallel download, executes after full HTML parse, preserves order.',
        'EVEN BETTER: load programmatically after user interaction — use IntersectionObserver or event listeners.',
        'BEST FOR INP: Partytown (run in Web Worker) or server-side proxying (collect events server-side, no client JS).',
      ],
    },
    {
      heading: 'Facade pattern — load on interaction',
      points: [
        'A facade is a lightweight placeholder (screenshot, custom element, or CSS skeleton) that replaces a heavy widget.',
        'The real widget loads only when the user hovers, clicks, or scrolls into view — saving the initial-load cost entirely.',
        'YouTube embed facade: show a thumbnail + play button; load the iframe only when the user clicks play.',
        'Stripe.js facade: collect card details in a static form; inject Stripe only when the user reaches checkout.',
        'Intercom chat facade: show a custom "Chat" button; inject Intercom only when clicked.',
      ],
    },
    {
      heading: 'Partytown — move scripts to a Web Worker',
      points: [
        'Partytown proxies third-party scripts into a Web Worker via a service worker — no main-thread cost.',
        'Works by synchronously mirroring DOM access from the Worker using Atomics and SharedArrayBuffer.',
        'Requires cross-origin isolation headers: Cross-Origin-Opener-Policy: same-origin and Cross-Origin-Embedder-Policy: require-corp.',
        'Best for: Google Tag Manager, GA4, Facebook Pixel, Hotjar — scripts that read/write cookies and the DOM.',
        'Not suitable for: scripts that need synchronous DOM mutation during render (they may break).',
      ],
    },
    {
      heading: 'Auditing and monitoring third-party impact',
      points: [
        'Chrome DevTools → Performance → "Third-party badges" highlights which long tasks come from external origins.',
        'WebPageTest → "Third-Party Summary" tab shows requests, bytes, and blocking time per third-party domain.',
        'Lighthouse "Reduce the impact of third-party code" audit lists heavy third-party contributors.',
        'Use PerformanceResourceTiming to measure transfer size and duration of each external script in production.',
        'Set a third-party budget (e.g. < 100 KB combined, < 50 ms combined blocking) and enforce it in CI with custom Lighthouse assertions.',
      ],
    },
    {
      heading: 'Security — integrity and trust',
      points: [
        'Use Subresource Integrity (SRI): integrity="sha384-…" on <script> — browser rejects the file if the hash doesn\'t match.',
        'SRI only works for scripts served from a fixed URL — versioned CDN URLs (e.g. lodash@4.17.21/lodash.min.js) are safe.',
        'Avoid loading scripts via document.write() — it blocks HTML parsing and cannot be async/deferred.',
        'Content Security Policy (CSP) with script-src restricts which origins may execute JavaScript.',
        'Self-host critical third-party scripts when security and caching control outweigh the update convenience trade-off.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Facade: YouTube embed',
      language: 'html',
      code: `<!-- Facade: lightweight YouTube thumbnail, loads iframe on click -->
<style>
  .yt-facade {
    position: relative; cursor: pointer;
    aspect-ratio: 16/9; background: #000; border-radius: 8px; overflow: hidden;
  }
  .yt-facade img { width: 100%; height: 100%; object-fit: cover; }
  .yt-facade .play-btn {
    position: absolute; inset: 0; display: flex;
    align-items: center; justify-content: center;
    background: rgba(0,0,0,.35);
  }
  .yt-facade .play-btn svg { width: 68px; filter: drop-shadow(0 2px 4px #000); }
</style>

<div class="yt-facade" id="yt-facade" role="button" tabindex="0"
     aria-label="Play: Chrome DevTools Performance tips">
  <!-- thumbnail served from YouTube CDN — image only, no JS loaded -->
  <img src="https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg"
       alt="" loading="lazy" decoding="async" />
  <div class="play-btn">
    <svg viewBox="0 0 68 48" xmlns="http://www.w3.org/2000/svg">
      <rect width="68" height="48" rx="10" fill="#ff0000"/>
      <polygon points="27,16 27,32 44,24" fill="#fff"/>
    </svg>
  </div>
</div>

<script>
  const facade = document.getElementById('yt-facade');
  function loadYouTube() {
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/VIDEO_ID?autoplay=1';
    iframe.allow = 'autoplay; encrypted-media';
    iframe.allowFullscreen = true;
    iframe.style.cssText = 'width:100%;aspect-ratio:16/9;border:0;border-radius:8px';
    facade.replaceWith(iframe);  // replace facade — no iframe until click
  }
  facade.addEventListener('click', loadYouTube, { once: true });
  facade.addEventListener('keydown', e => e.key === 'Enter' && loadYouTube());
</script>`,
    },
    {
      label: 'Defer analytics load',
      language: 'typescript',
      code: `// Load GA4 only after user consents AND after page is interactive
// Avoids: 50ms main-thread block on every page load before consent

function loadAnalytics(measurementId: string) {
  const script = document.createElement('script');
  script.src = \`https://www.googletagmanager.com/gtag/js?id=\${measurementId}\`;
  script.async = true;
  document.head.appendChild(script);

  (window as any).dataLayer = (window as any).dataLayer ?? [];
  function gtag(...args: unknown[]) { (window as any).dataLayer.push(args); }
  gtag('js', new Date());
  gtag('config', measurementId);
}

// Pattern 1: load after consent (GDPR)
document.getElementById('accept-cookies')?.addEventListener('click', () => {
  localStorage.setItem('consent', 'granted');
  loadAnalytics('G-XXXXXXXX');
}, { once: true });

// Pattern 2: load after first interaction (anything = user is active)
function loadOnFirstInteraction() {
  loadAnalytics('G-XXXXXXXX');
  ['click', 'scroll', 'keydown', 'touchstart'].forEach(
    e => window.removeEventListener(e, loadOnFirstInteraction)
  );
}
['click', 'scroll', 'keydown', 'touchstart'].forEach(
  e => window.addEventListener(e, loadOnFirstInteraction, { passive: true, once: true })
);

// Pattern 3: load when idle (after LCP, safe for non-time-sensitive analytics)
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => loadAnalytics('G-XXXXXXXX'), { timeout: 5000 });
} else {
  setTimeout(() => loadAnalytics('G-XXXXXXXX'), 2000);
}`,
    },
    {
      label: 'Partytown setup (Vite)',
      language: 'typescript',
      code: `// npm install @builder.io/partytown
// vite.config.ts — copy Partytown lib files to /~partytown/
import { defineConfig } from 'vite';
import { partytownVite } from '@builder.io/partytown/utils';
import { join } from 'path';

export default defineConfig({
  plugins: [
    partytownVite({
      dest: join(__dirname, 'dist', '~partytown'),
    }),
  ],
});

// index.html — configure and bootstrap Partytown BEFORE any scripts
// The config must be inline to ensure it runs before Partytown lib loads`,

// In HTML (shown as a string since it can't be template tagged):
    },
    {
      label: 'Audit with Resource Timing API',
      language: 'typescript',
      code: `// Measure third-party script impact in production
function auditThirdParties() {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const ownOrigin = location.origin;

  const thirdParty = entries
    .filter(e => e.initiatorType === 'script' && !e.name.startsWith(ownOrigin))
    .map(e => ({
      url: new URL(e.name).hostname,
      transferSize: Math.round(e.transferSize / 1024),   // KB
      duration: Math.round(e.duration),                  // ms
      renderBlocking: e.renderBlockingStatus === 'blocking',
    }));

  // Group by hostname, sum up size + duration
  const byHost = thirdParty.reduce<Record<string, { kb: number; ms: number }>>((acc, e) => {
    acc[e.url] ??= { kb: 0, ms: 0 };
    acc[e.url].kb += e.transferSize;
    acc[e.url].ms += e.duration;
    return acc;
  }, {});

  console.table(
    Object.entries(byHost)
      .sort((a, b) => b[1].ms - a[1].ms)  // sort by most expensive
      .map(([host, { kb, ms }]) => ({ host, 'KB': kb, 'ms': ms }))
  );
}

// Run after page load to capture all scripts
window.addEventListener('load', () => setTimeout(auditThirdParties, 1000));`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Loading Google Tag Manager synchronously in <head>',
      wrong: `<head>
  <script src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXX"></script>
</head>`,
      right: `<!-- defer or load after interaction — GTM does NOT need to be synchronous -->
<script>
  window.addEventListener('load', () => {
    const s = document.createElement('script');
    s.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-XXXX';
    s.async = true;
    document.head.appendChild(s);
  });
</script>`,
      explanation: 'A synchronous <script> in <head> is render-blocking — the browser stops parsing HTML until the script is downloaded and executed. Loading GTM after the page loads eliminates this blocking entirely without affecting analytics data quality.',
    },
    {
      title: 'Loading a YouTube embed as an iframe on page load',
      wrong: `<!-- Loads 11 YouTube-owned resources, ~500 KB, before user interaction -->
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"
        width="560" height="315" allowfullscreen></iframe>`,
      right: `<!-- Facade: thumbnail only. Loads iframe on click (~0 KB until interaction) -->
<div class="yt-facade" data-videoid="dQw4w9WgXcQ" role="button" tabindex="0">
  <img src="https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg" alt="Video" />
  <div class="play-btn">▶</div>
</div>`,
      explanation: 'A YouTube iframe triggers 11+ network requests and loads ~400 KB of YouTube JS on page load, regardless of whether the user watches the video. A facade replaces this with a single thumbnail image until the user clicks play.',
    },
    {
      title: 'Using document.write() to inject third-party scripts',
      wrong: `document.write('<script src="https://cdn.example.com/widget.js"><\\/script>');`,
      right: `const script = document.createElement('script');
script.src = 'https://cdn.example.com/widget.js';
script.async = true;
document.head.appendChild(script);`,
      explanation: 'document.write() blocks HTML parsing entirely and cannot be async or deferred. Modern browsers actually ignore document.write() calls that happen after the page has loaded (showing a console warning). Always use dynamic script injection instead.',
    },
    {
      title: 'Loading all third-party scripts regardless of user consent',
      wrong: `// All analytics load immediately — GDPR violation and wasted bytes for users who decline
loadFacebookPixel();
loadHotjar();
loadGA4();
loadIntercom();`,
      right: `// Load only after consent is granted
consentManager.on('granted', (purposes) => {
  if (purposes.analytics) { loadGA4(); loadHotjar(); }
  if (purposes.marketing) { loadFacebookPixel(); }
  if (purposes.support)   { loadIntercom(); }
});`,
      explanation: 'Loading analytics before consent is a GDPR violation and wastes bytes and main-thread time for users who ultimately decline. Consent-gated loading both respects user privacy and measurably improves CWV for users who bounce before consenting.',
    },
    {
      title: 'No preconnect for critical third-party origins',
      wrong: `<!-- First request to fonts.googleapis.com includes DNS + TCP + TLS setup: ~200ms -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap">`,
      right: `<!-- Open the connection early — eliminates 200ms connection overhead -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap">`,
      explanation: 'preconnect tells the browser to open the TCP/TLS connection to a third-party origin before it\'s needed. For Google Fonts, this eliminates ~200ms of connection setup that would otherwise delay font loading and cause FOIT.',
    },
    {
      title: 'No subresource integrity on externally-hosted scripts',
      wrong: `<!-- No integrity check — attacker compromising the CDN can inject code -->
<script src="https://cdn.example.com/analytics/v2.3.1/analytics.min.js"></script>`,
      right: `<!-- SRI: browser rejects the file if hash doesn't match -->
<script
  src="https://cdn.example.com/analytics/v2.3.1/analytics.min.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"></script>`,
      explanation: 'Without SRI, if the CDN is compromised the attacker\'s code runs on your site with full access to your users\' data. SRI (integrity attribute) makes the browser cryptographically verify the file before executing it.',
    },
  ];

  challenge: Challenge = {
    title: 'Implement a Stripe.js facade',
    language: 'html',
    description: `Your checkout page currently loads Stripe.js (~200 KB) immediately on page load, adding 80ms of main-thread blocking time — even for users who never reach payment.

Implement a facade pattern:
1. Show a static payment form (card number/expiry/CVC fields as plain inputs)
2. Load Stripe.js ONLY when the user focuses the card number field
3. Once loaded, replace the plain inputs with real Stripe Elements
4. Show a loading indicator while Stripe initialises`,
    hints: [
      'Use focusin on the card-number input to detect user intent',
      'Create a <script> element dynamically and append to document.head',
      'Listen for the script.onload event before calling Stripe()',
      'Replace the static inputs with a stripe.elements().create("card") mount',
    ],
    starterCode: `<!-- Static facade form — no Stripe loaded yet -->
<form id="payment-form">
  <div id="card-facade">
    <input id="card-number" type="text" placeholder="Card number" autocomplete="cc-number">
    <input id="card-expiry" type="text" placeholder="MM/YY"  autocomplete="cc-exp">
    <input id="card-cvc"    type="text" placeholder="CVC"    autocomplete="cc-csc">
  </div>
  <div id="stripe-element" style="display:none"></div>
  <p id="stripe-status"></p>
  <button type="submit">Pay</button>
</form>

<script>
  const cardNumber = document.getElementById('card-number');
  // TODO: load Stripe.js on first focus of cardNumber
  // TODO: once loaded, mount Stripe Elements into #stripe-element
  // TODO: hide #card-facade, show #stripe-element
</script>`,
    solution: `<form id="payment-form">
  <div id="card-facade">
    <input id="card-number" type="text" placeholder="Card number" autocomplete="cc-number">
    <input id="card-expiry" type="text" placeholder="MM/YY"  autocomplete="cc-exp">
    <input id="card-cvc"    type="text" placeholder="CVC"    autocomplete="cc-csc">
  </div>
  <div id="stripe-element" style="display:none"></div>
  <p id="stripe-status">Loading secure payment form…</p>
  <button type="submit">Pay</button>
</form>

<script>
  const cardNumber = document.getElementById('card-number');
  const facade     = document.getElementById('card-facade');
  const container  = document.getElementById('stripe-element');
  const status     = document.getElementById('stripe-status');

  let stripeLoaded = false;

  function loadStripe() {
    if (stripeLoaded) return;
    stripeLoaded = true;

    status.textContent = 'Loading secure payment form…';
    container.style.display = 'block';

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => {
      const stripe   = window.Stripe('pk_test_YOUR_KEY');
      const elements = stripe.elements();
      const card     = elements.create('card');

      card.mount('#stripe-element');
      facade.style.display = 'none';  // hide static inputs
      status.textContent = '';

      card.addEventListener('change', (e) => {
        status.textContent = e.error ? e.error.message : '';
      });
    };
    document.head.appendChild(script);
  }

  cardNumber.addEventListener('focusin', loadStripe, { once: true });
</script>`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the facade pattern for third-party scripts?',
      options: [
        'A CSS animation that mimics the third-party widget appearance',
        'A lightweight placeholder that loads the real third-party widget only on user interaction',
        'A server-side proxy that pre-fetches third-party content',
        'A Service Worker that caches third-party scripts for offline use',
      ],
      answer: 1,
      explanation: 'The facade pattern shows a lightweight placeholder (thumbnail, static form, or skeleton) instead of the full third-party widget. The real widget loads only when the user interacts with the facade — saving the initial-load cost for users who never interact with it.',
    },
    {
      q: 'What headers are required for Partytown to work?',
      options: [
        'Access-Control-Allow-Origin: * and Vary: Origin',
        'Cross-Origin-Opener-Policy: same-origin and Cross-Origin-Embedder-Policy: require-corp',
        'Content-Security-Policy: sandbox and X-Frame-Options: SAMEORIGIN',
        'Strict-Transport-Security and X-Content-Type-Options: nosniff',
      ],
      answer: 1,
      explanation: 'Partytown uses SharedArrayBuffer and Atomics to synchronously mirror DOM access from the Web Worker. SharedArrayBuffer requires cross-origin isolation, which is enabled by setting COOP: same-origin and COEP: require-corp response headers.',
    },
    {
      q: 'Which attribute makes a <script> download in parallel and execute after HTML parsing completes?',
      options: [
        'async',
        'defer',
        'type="module"',
        'loading="lazy"',
      ],
      answer: 1,
      explanation: 'defer downloads the script in parallel with HTML parsing (non-blocking) and executes it after the full HTML document has been parsed, in source order. async also downloads in parallel but executes immediately when ready — potentially interrupting parsing and not preserving order.',
    },
    {
      q: 'What does Subresource Integrity (SRI) protect against?',
      options: [
        'SQL injection from scripts that call external APIs',
        'Third-party CDN compromise — the browser rejects the file if its hash doesn\'t match',
        'Cross-site scripting in inline scripts',
        'Unauthorised access to script source code',
      ],
      answer: 1,
      explanation: 'SRI adds an integrity attribute containing a cryptographic hash of the expected file content. If the CDN is compromised and the file is modified, the hash won\'t match and the browser will refuse to execute it — protecting users from supply-chain attacks.',
    },
    {
      q: 'Which Lighthouse audit identifies the heaviest third-party contributors?',
      options: [
        '"Ensure text remains visible during webfont load"',
        '"Reduce the impact of third-party code"',
        '"Avoid enormous network payloads"',
        '"Eliminate render-blocking resources"',
      ],
      answer: 1,
      explanation: '"Reduce the impact of third-party code" lists every third-party origin, its total transfer size, and its main-thread blocking time — giving you a prioritised list of which third parties to defer, facade, or remove.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I measure how much a specific third-party script costs?',
      a: 'Open Chrome DevTools → Performance → record a page load. In the bottom "Third-party badges" section, each task is colour-coded by origin. You can also use WebPageTest → "Third-Party Summary" for a tabular view of requests, bytes, and blocking time per domain. Programmatically, use PerformanceResourceTiming entries filtered by origin.',
    },
    {
      q: 'Is Partytown safe to use in production?',
      a: 'Partytown works well for read-heavy analytics scripts (GA4, GTM, Facebook Pixel, Hotjar). It requires cross-origin isolation headers (COOP/COEP) which may break some embedded iframes (payment widgets, social embeds). Test thoroughly — scripts that rely on synchronous DOM mutation during render may have timing issues. Builder.io uses it in production on their marketing site.',
    },
    {
      q: 'Should I self-host third-party scripts?',
      a: 'Self-hosting gives you control over caching headers, removes the external DNS lookup, and lets you use SRI. The downside: you\'re responsible for keeping the script up to date — stale analytics SDKs may lose features or break. A middle ground: self-host stable scripts (tracking pixels) and keep auto-updating scripts (Stripe.js) on the vendor CDN.',
    },
    {
      q: 'What is the difference between async and defer for script loading?',
      a: 'Both download scripts in parallel without blocking HTML parsing. async executes the script as soon as it downloads — order is not guaranteed, and it can interrupt parsing if the HTML isn\'t done yet. defer executes after the full HTML is parsed, in source order — it\'s the safe default for most scripts. type="module" implies defer by default.',
    },
    {
      q: 'Can I load Google Fonts without any JavaScript performance cost?',
      a: 'Yes. Google Fonts are CSS + font files, not JavaScript. The performance cost comes from: (1) extra DNS lookup + TCP/TLS for fonts.googleapis.com — mitigate with preconnect; (2) render-blocking stylesheet — mitigate by loading asynchronously with media="print" then switching to all; (3) FOUT — mitigate with font-display: swap. Alternatively, self-host with @font-face and woff2 files for maximum control.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Third-party scripts cost main-thread time and INP — load them deferred, behind facades, or in Workers; audit impact with Lighthouse and WebPageTest.',
    mustKnow: [
      'Third-party scripts run on your main thread and inflate your INP and TBT',
      'Facade pattern: show a placeholder, load the real widget only on interaction',
      'defer is the safe default; async runs immediately on download — order not guaranteed',
      'Partytown moves scripts to a Web Worker; requires COOP/COEP headers',
      'SRI (integrity attribute) prevents CDN-compromise supply chain attacks',
      'Lighthouse "Reduce impact of third-party code" audit lists heaviest offenders',
    ],
    interviewFocus: [
      'What is the facade pattern and when would you use it?',
      'What is the difference between async and defer on a <script> tag?',
      'How would you safely load analytics on a GDPR-compliant site?',
      'What is Subresource Integrity and what does it protect against?',
    ],
  };
}
