import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface IQ {
  q: string;
  a: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

@Component({
  selector: 'app-perf-interview-prep',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
})
export class PerfInterviewPrep {
  activeTopic = signal('All');
  activeDiff  = signal('All');
  expanded    = signal<number | null>(null);

  topics = ['All', 'Core Web Vitals', 'Loading', 'Rendering', 'JavaScript', 'Measurement', 'Assets'];
  diffs  = ['All', 'Easy', 'Medium', 'Hard'];

  questions: IQ[] = [
    // Core Web Vitals
    { topic: 'Core Web Vitals', difficulty: 'easy', q: 'What are the three Core Web Vitals and what does each measure?',
      a: 'LCP (Largest Contentful Paint) — loading: measures when the largest image or text block in the viewport renders. Good < 2.5s. INP (Interaction to Next Paint) — responsiveness: measures the worst interaction delay of the session (input delay + processing + presentation). Good < 200ms. CLS (Cumulative Layout Shift) — visual stability: measures the cumulative score of unexpected layout shifts. Good < 0.1. Google uses CWV for search ranking using CrUX field data at the 75th percentile.' },
    { topic: 'Core Web Vitals', difficulty: 'easy', q: 'What is the difference between FCP and LCP?',
      a: 'FCP (First Contentful Paint) fires when ANY content renders — including loading spinners and skeleton screens. LCP fires when the LARGEST content element in the viewport renders — typically the hero image or main heading. FCP tells you when the page "started" rendering; LCP tells you when the main content is actually visible. Google uses LCP for ranking, not FCP. A low FCP with a high LCP usually means a spinner appeared early but real content loaded late.' },
    { topic: 'Core Web Vitals', difficulty: 'medium', q: 'How does INP differ from the old FID metric?',
      a: 'FID (First Input Delay) measured only the input delay of the FIRST user interaction — how long before the browser started processing the first click. INP (replaced FID in March 2024) measures the worst interaction of the ENTIRE session, including input delay, processing time, and presentation delay. INP is harder to score well on because it captures all interactions, not just the first one, and includes processing time and frame delay that FID ignored.' },
    { topic: 'Core Web Vitals', difficulty: 'medium', q: 'What causes a high CLS score and how do you fix it?',
      a: 'Common causes: images/video without width+height attributes (browser allocates no space until loaded), ads and embeds without reserved space, dynamically injected content above existing content, web fonts causing FOUT (text reflow on font swap). Fixes: always set width and height on img/video, use aspect-ratio CSS to reserve space, set min-height on ad containers, use font-display: optional or size-adjust to reduce font-swap CLS, inject dynamic content below existing content or use transform instead of layout-shifting properties.' },
    { topic: 'Core Web Vitals', difficulty: 'hard', q: 'Walk me through the three phases of INP and how you would optimise each.',
      a: 'INP = input delay + processing duration + presentation delay. Input delay: time from event trigger to when the browser starts the event callback — caused by other tasks blocking the main thread. Fix: break long tasks with scheduler.yield(), reduce third-party script blocking. Processing duration: time spent in the event handler — caused by expensive DOM updates, synchronous layout-triggering code. Fix: batch DOM reads/writes, defer non-critical work to rAF or rIC. Presentation delay: time from handler end to next frame painted — caused by large style recalculation or layout from the changes made in the handler. Fix: use contain: strict to scope layout, avoid forced synchronous layout.' },

    // Loading
    { topic: 'Loading', difficulty: 'easy', q: 'What is TTFB and what causes it to be slow?',
      a: 'Time to First Byte is the time from navigation start to the first byte of the HTTP response body. A slow TTFB is caused by: slow server-side processing (DB queries, template rendering), geographic distance from server to user, no CDN caching for static resources, missing HTTP keep-alive, or TLS handshake overhead. Good TTFB is < 800ms total. Fix: cache at the CDN edge, use server-side caching (Redis), optimise DB queries, use edge SSR for personalised pages.' },
    { topic: 'Loading', difficulty: 'easy', q: 'What is the difference between defer and async on a <script> tag?',
      a: 'Both download the script in parallel with HTML parsing (non-render-blocking). async executes immediately when downloaded — order not guaranteed, may interrupt HTML parsing. defer executes after the full HTML document is parsed — order preserved, safe for scripts that depend on the DOM or on each other. type="module" implies defer by default. Use defer as the safe default; use async only for independent scripts (analytics, tracking) that don\'t depend on DOM or other scripts.' },
    { topic: 'Loading', difficulty: 'medium', q: 'Explain the difference between preload, prefetch, and preconnect.',
      a: 'preload: high-priority fetch for a resource needed on the CURRENT page (LCP image, critical font, above-fold script). Syntax: <link rel="preload" as="image" href="hero.webp">. Must include fetchpriority="high" for LCP images. prefetch: low-priority fetch for a resource needed on the NEXT page — downloaded in idle time. preconnect: opens TCP+TLS connection to a third-party origin early — reduces connection overhead (typically 100–300ms). Use for: Google Fonts, CDN, analytics endpoints. Limit to 6 connections — excess are ignored.' },
    { topic: 'Loading', difficulty: 'medium', q: 'How does HTTP/2 change front-end performance best practices compared to HTTP/1.1?',
      a: 'HTTP/1.1 limitations led to workarounds: domain sharding (multiple domains to bypass connection limit), CSS/JS concatenation (fewer files = fewer requests), image sprites (bundle images into one). HTTP/2 fixes the root problems: multiplexing (many requests on one TCP connection, no head-of-line blocking), HPACK header compression. HTTP/2 makes domain sharding counter-productive (forces new connections). File concatenation is less important — many smaller files can load efficiently. However, bundling still helps for initial parse time and gzip compression ratio.' },
    { topic: 'Loading', difficulty: 'hard', q: 'How would you make navigations between pages feel instant?',
      a: 'Multiple techniques in layers: (1) Speculation Rules API: prerender the most likely next page with <script type="speculationrules"> — navigation appears in < 200ms because the page is fully rendered in a hidden tab. (2) Prefetch: <link rel="prefetch"> fetches HTML early — TTFB on navigation drops to near 0. (3) SPA client-side routing: Angular/React router handles navigation as DOM updates (no full page load). (4) View Transitions API: animate between page states with document.startViewTransition(). (5) bfcache: browser restores previous pages from memory on back/forward — nothing to load.' },

    // Rendering
    { topic: 'Rendering', difficulty: 'easy', q: 'What is the Critical Rendering Path?',
      a: 'The Critical Rendering Path is the sequence of steps the browser takes to render the first pixel: (1) Parse HTML → build DOM. (2) Parse CSS → build CSSOM. (3) Combine → Render Tree (visible nodes + computed styles). (4) Layout — calculate position and size of each node. (5) Paint — draw pixels to layers. (6) Composite — GPU assembles layers into final screen image. Optimising the CRP means: minimising render-blocking resources, reducing critical bytes (inline critical CSS), and unblocking paint as early as possible.' },
    { topic: 'Rendering', difficulty: 'medium', q: 'Which CSS properties can be animated without causing layout or paint?',
      a: 'Only transform and opacity are compositor-only — they run on the GPU thread without triggering layout or paint recalculation. transform includes: translate, scale, rotate, skew. opacity changes element visibility without repainting. Everything else (width, height, top, left, margin, padding, background-color, box-shadow) triggers layout and/or paint on every animation frame — causing 60× per second layout recalculation. Use transform: translateX() instead of left:, opacity instead of visibility: for all animations.' },
    { topic: 'Rendering', difficulty: 'medium', q: 'What is layout thrashing and how do you prevent it?',
      a: 'Layout thrashing (forced synchronous layout) occurs when JS reads a layout property (offsetHeight, clientWidth, getBoundingClientRect) immediately after writing to the DOM — forcing the browser to recalculate layout synchronously rather than batching it to the next frame. Example: loop that sets element.style.width then reads element.offsetWidth triggers layout N times. Fix: batch all reads first, then all writes. Use requestAnimationFrame to ensure reads and writes happen in separate animation frame phases. Libraries like FastDOM formalise this pattern.' },
    { topic: 'Rendering', difficulty: 'hard', q: 'Explain the difference between SSR, SSG, and ISR and when you would use each.',
      a: 'SSR (Server-Side Rendering): HTML generated on the server per request — fast LCP, requires server compute, TTFB ~100–300ms. Use for: authenticated pages, real-time data, personalised content. SSG (Static Site Generation): HTML pre-built at deploy time, served from CDN — fastest TTFB (~10ms), no server compute, content can be stale. Use for: blogs, marketing pages, docs, product catalogues. ISR (Incremental Static Regeneration, Next.js): SSG with TTL-based background revalidation — CDN speed + eventual freshness. Use for: e-commerce product pages, news articles — fresh enough with revalidate: 60, served fast from CDN.' },

    // JavaScript
    { topic: 'JavaScript', difficulty: 'easy', q: 'What is a long task and why does it matter?',
      a: 'A long task is any main-thread task that takes longer than 50ms. During a long task the browser cannot process user input (clicks, keystrokes) or render new frames. Long tasks directly inflate INP — if a user clicks during a 200ms long task, that 200ms is their input delay. Measure with PerformanceObserver type "longtask". Fix with: scheduler.yield() to break tasks into chunks, Web Workers for CPU-heavy computation, deferring non-critical work to requestIdleCallback.' },
    { topic: 'JavaScript', difficulty: 'easy', q: 'What is tree shaking and what does a module need to support it?',
      a: 'Tree shaking is dead-code elimination at build time — the bundler removes exported functions/classes that are never imported by the app. Requirements: (1) ES Modules (import/export syntax) — CommonJS require() is dynamic and cannot be tree-shaken. (2) Named exports shake better than default exports from large modules. (3) "sideEffects": false in package.json — tells the bundler modules can be safely removed if their exports are unused. CommonJS libraries (lodash) pull in the entire module; ES module equivalents (lodash-es) are tree-shakeable.' },
    { topic: 'JavaScript', difficulty: 'medium', q: 'How would you move CPU-intensive JSON parsing off the main thread?',
      a: 'Use a Web Worker. Create a worker file that calls JSON.parse(e.data) inside self.onmessage, then self.postMessage(parsed). For large JSON (> 1MB), transfer the string\'s underlying ArrayBuffer as a Transferable to avoid the ~100ms clone cost. For a cleaner API, wrap with Comlink: expose({ parse: (s) => JSON.parse(s) }) in the worker, and call await workerApi.parse(json) from the main thread — looks like a regular async function but runs in a background thread.' },
    { topic: 'JavaScript', difficulty: 'hard', q: 'How would you diagnose and fix a slow INP caused by a click handler?',
      a: 'Step 1: use web-vitals/attribution onINP() to get eventType, eventTarget, inputDelay, processingDuration, presentationDelay for the worst interaction. Step 2: if processingDuration is high, record a Chrome DevTools Performance trace of the interaction — identify the expensive function in the call tree. Step 3: break up the handler: move non-critical work after the critical state update using scheduler.yield() or setTimeout. Step 4: if a third-party script is causing the input delay, defer it or move to Partytown. Step 5: for framework-heavy handlers (Angular change detection, React re-renders), use ChangeDetectionStrategy.OnPush or React.memo to scope updates.' },

    // Assets
    { topic: 'Assets', difficulty: 'easy', q: 'What is the best image format to use on the web today?',
      a: 'AVIF is the best modern format — 50% smaller than JPEG at equivalent quality. WebP is the safe fallback — 30% smaller than JPEG, supported in all modern browsers. Use <picture> to serve AVIF with WebP fallback and JPEG/PNG for old browsers. Build pipeline: use sharp.resize().avif({ quality: 65 }).webp({ quality: 80 }) to generate both formats at build time or via an image CDN (Cloudinary, Imgix). Never use GIF for animations — use video/webm (100× smaller) or CSS animations.' },
    { topic: 'Assets', difficulty: 'medium', q: 'What is font-display and which value should you use?',
      a: 'font-display controls font loading behavior: auto (browser default, usually block). block: invisible text for up to 3s, then fallback — causes FOIT. swap: fallback shown immediately, swapped when loaded — may cause FOUT (layout shift on swap). fallback: fallback for 100ms, then 3s window to load before permanent fallback — balanced. optional: 100ms block then abandoned if not loaded — best for performance, no FOUT, may not load on slow connections. Use swap for branding fonts where text content matters; use fallback or optional for body text to minimise CLS.' },
    { topic: 'Assets', difficulty: 'medium', q: 'How does srcset work and when should you use it?',
      a: 'srcset provides a list of image sources at different widths: srcset="img-400.webp 400w, img-800.webp 800w". The browser calculates the best source based on device pixel ratio and CSS layout width (from the sizes attribute): sizes="(max-width: 600px) 100vw, 50vw". Without sizes, the browser assumes 100vw — may download 2× larger image than needed. Use srcset + sizes for: hero images, product photos, article images — any image where file size varies meaningfully by viewport. Not needed for: icons, logos (use SVG), fixed-size thumbnails.' },
    { topic: 'Assets', difficulty: 'hard', q: 'How would you implement an optimal caching strategy for a production Angular app?',
      a: 'Three layers: (1) Versioned assets (hashed filenames — e.g. main.abc123.js, styles.def456.css): Cache-Control: max-age=31536000, immutable — cached for 1 year, never revalidated. New deploys produce new hashes. (2) index.html (no hash, cannot be fingerprinted): Cache-Control: no-cache — browser always revalidates, but 304 Not Modified means no re-download. (3) API responses: depends on data freshness. Shared, infrequently changing: s-maxage=3600. User-specific: no-store. Optional: add a Workbox Service Worker for stale-while-revalidate on assets and offline support.' },

    // Measurement
    { topic: 'Measurement', difficulty: 'easy', q: 'What is the difference between lab performance data and field data?',
      a: 'Lab data (Lighthouse, WebPageTest) is synthetic — fixed device emulation, throttled network, controlled environment. Reproducible but not representative of real users. Field data (CrUX, RUM) comes from real Chrome users on real devices with real network conditions. Noisy but truthful. Google uses field data (CrUX at P75) for search ranking — not Lighthouse scores. Use lab for: debugging, CI regression detection, comparing before/after a fix. Use field for: understanding real user experience, confirming fixes worked in production.' },
    { topic: 'Measurement', difficulty: 'medium', q: 'How would you set up Real User Monitoring (RUM) for Core Web Vitals?',
      a: 'Install web-vitals npm package. Call onLCP, onINP, onCLS, onFCP, onTTFB with a callback that stores each value. On visibilitychange (document.hidden === true), send the batch to your analytics endpoint via navigator.sendBeacon() — which survives page close. Include: URL, device type, connection type, metric values, ratings (good/needs-improvement/poor), metric.id for deduplication. Report at P75 by device type. For root-cause data, use the /attribution import for element/event context. GA4 accepts these as custom events.' },
    { topic: 'Measurement', difficulty: 'hard', q: 'How would you set up performance budgets in a CI/CD pipeline?',
      a: 'Three layers: (1) Angular CLI budgets in angular.json: type: "initial" with maximumError for bundle size — fails ng build if exceeded. (2) Lighthouse CI (@lhci/cli): lighthouserc.js with URL list, numberOfRuns: 3, assertions for LCP < 2500ms, TBT < 300ms, CLS < 0.1, performance score > 0.8. Run in GitHub Actions with treosh/lighthouse-ci-action — fails the PR check if any assertion fails. (3) bundlesize: asserts gzipped file sizes per chunk after build. Tighten budgets as a ratchet after each improvement. Add field monitoring (SpeedCurve/Calibre) for production regressions that lab tests miss.' },
  ];

  get filtered(): IQ[] {
    return this.questions.filter(q =>
      (this.activeTopic() === 'All' || q.topic === this.activeTopic()) &&
      (this.activeDiff() === 'All'  || q.difficulty === this.activeDiff().toLowerCase())
    );
  }

  toggle(i: number) { this.expanded.update(v => v === i ? null : i); }
  setTopic(t: string) { this.activeTopic.set(t); this.expanded.set(null); }
  setDiff(d: string)  { this.activeDiff.set(d);  this.expanded.set(null); }
  diffClass(d: string) { return `diff-${d}`; }
}
