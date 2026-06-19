import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  title: string; description: string; route: string; badge: string; available: boolean; keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  'Core Web Vitals': 'cwv', 'Loading': 'loading', 'Rendering': 'rendering',
  'Assets': 'assets', 'JavaScript': 'javascript', 'Measurement': 'measurement', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Core Web Vitals', 'Loading', 'Rendering', 'Assets', 'JavaScript', 'Measurement', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'Core Web Vitals Overview',   route: '/performance/core-web-vitals', badge: 'Core Web Vitals', available: true,
    description: 'LCP, INP, and CLS — Google\'s user-centric performance metrics that directly affect search rankings.',
    keyPoints: ['LCP: Largest Contentful Paint — loading; good < 2.5s', 'INP: Interaction to Next Paint — responsiveness; good < 200ms', 'CLS: Cumulative Layout Shift — visual stability; good < 0.1'] },
  { title: 'Largest Contentful Paint',   route: '/performance/lcp', badge: 'Core Web Vitals', available: true,
    description: 'What counts as the LCP element, common causes of poor LCP, and optimisation strategies.',
    keyPoints: ['LCP elements: img, video poster, background-image, block text', 'Biggest wins: preload LCP image, avoid lazy-loading it, serve from CDN', 'Resource hints: <link rel="preload" as="image" href="hero.webp">'] },
  { title: 'Interaction to Next Paint',  route: '/performance/inp', badge: 'Core Web Vitals', available: true,
    description: 'INP replaced FID in March 2024 — measuring responsiveness to all user interactions.',
    keyPoints: ['INP measures the worst interaction delay (not just first)', 'Long tasks block the main thread — break up with scheduler.yield()', 'Input delay + processing time + presentation delay = full INP breakdown'] },
  { title: 'Cumulative Layout Shift',    route: '/performance/cls', badge: 'Core Web Vitals', available: true,
    description: 'What causes unexpected layout shifts and how to prevent them with size reservations.',
    keyPoints: ['Always set width + height on img and video elements', 'min-height on dynamic content areas prevents shift on load', 'Ads and embeds: reserve space with aspect-ratio or fixed height container'] },
  { title: 'Critical Rendering Path',   route: '/performance/critical-rendering-path', badge: 'Rendering', available: true,
    description: 'HTML parse → DOM → CSSOM → Render Tree → Layout → Paint → Composite — optimising each stage.',
    keyPoints: ['Render-blocking resources: CSS in <head> blocks paint; JS blocks HTML parsing', 'defer and async attributes defer JS execution past first render', 'Inline critical CSS: paste above-the-fold styles in <style> to unblock paint'] },
  { title: 'Browser Rendering Pipeline', route: '/performance/browser-rendering', badge: 'Rendering', available: true,
    description: 'Layout, paint, and composite layers — which CSS properties are cheap (composite-only) vs expensive (layout).',
    keyPoints: ['Cheap: transform and opacity — compositor-only, no layout/paint', 'Expensive: width, height, top, left — trigger layout on every change', 'contain: strict or content isolates subtree from global layout calculations'] },
  { title: 'Resource Hints',             route: '/performance/resource-hints', badge: 'Loading', available: true,
    description: 'preload, prefetch, preconnect, dns-prefetch, modulepreload — and when each helps (or hurts).',
    keyPoints: ['preload: high priority for current page critical resources', 'prefetch: low priority for next page resources', 'preconnect: open TCP/TLS to third-party origin before needed (fonts, CDN)'] },
  { title: 'HTTP/2 & HTTP/3',            route: '/performance/http2-http3', badge: 'Loading', available: true,
    description: 'Multiplexing, header compression, server push (HTTP/2), QUIC (HTTP/3), and implications for bundling strategy.',
    keyPoints: ['HTTP/2 multiplexing: many requests on one connection — domain sharding is counter-productive', 'HTTP/3: QUIC over UDP — 0-RTT reconnect, no head-of-line blocking', 'HTTP/2: less need to concatenate files; HTTP/1.1: still benefits from bundles'] },
  { title: 'Caching & Service Workers',  route: '/performance/caching', badge: 'Loading', available: true,
    description: 'Cache-Control, ETags, immutable assets, and Service Worker caching strategies for offline and fast loads.',
    keyPoints: ['Versioned assets (bundle.abc123.js): Cache-Control: max-age=31536000, immutable', 'index.html: Cache-Control: no-cache — always revalidate entry point', 'Workbox: stale-while-revalidate, cache-first, network-first strategies'] },
  { title: 'Image Optimisation',         route: '/performance/image-optimisation', badge: 'Assets', available: true,
    description: 'WebP/AVIF, responsive images, srcset, lazy loading, and the new image rendering APIs.',
    keyPoints: ['AVIF: 50% smaller than JPEG; WebP: 30% smaller — serve via <picture> with fallback', 'srcset + sizes: browser picks the right image for device resolution and viewport', 'loading="lazy" for below-the-fold; fetchpriority="high" for LCP image'] },
  { title: 'Font Performance',           route: '/performance/font-performance', badge: 'Assets', available: true,
    description: 'Font loading strategies, font-display, FOUT vs FOIT, subsetting, and variable fonts.',
    keyPoints: ['font-display: swap: text shown immediately with fallback font', 'Subset fonts: remove unused characters — 40KB → 8KB for Latin subset', 'Variable font: one file replaces multiple weight files; smaller total size'] },
  { title: 'JavaScript Performance',     route: '/performance/js-performance', badge: 'JavaScript', available: true,
    description: 'Bundle size analysis, tree shaking, code splitting, and long task avoidance.',
    keyPoints: ['webpack-bundle-analyzer / rollup-plugin-visualizer: find what\'s big', 'Tree shaking: named exports required; CommonJS (require) is not tree-shakeable', 'Long tasks > 50ms: break with requestIdleCallback or scheduler.yield()'] },
  { title: 'Third-Party Scripts',        route: '/performance/third-party-scripts', badge: 'JavaScript', available: true,
    description: 'The performance cost of analytics, ads, and chat widgets — loading strategies and facade patterns.',
    keyPoints: ['Third-party scripts block main thread and inflate INP', 'Facade pattern: load YouTube/Stripe only on interaction, not on page load', 'Partytown: run third-party scripts in a Web Worker, off main thread'] },
  { title: 'Performance Measurement',    route: '/performance/measurement', badge: 'Measurement', available: true,
    description: 'Chrome DevTools Performance panel, Lighthouse, WebPageTest, and the Performance Observer API.',
    keyPoints: ['performance.measure() for custom marks between user interactions', 'Lighthouse: lab data; CrUX (Field Data): real user data — both matter', 'WebPageTest: filmstrip view, waterfall, and multi-location testing'] },
  { title: 'Real User Monitoring (RUM)', route: '/performance/rum', badge: 'Measurement', available: true,
    description: 'Collecting Web Vitals from real users with the web-vitals library and sending to analytics.',
    keyPoints: ['web-vitals.js: onLCP, onINP, onCLS, onFCP, onTTFB callbacks', 'Send metrics to analytics on visibilitychange for accurate LCP', 'Segment by device type: mobile vs desktop CWV often differ dramatically'] },
  { title: 'Server-Side Rendering & Streaming', route: '/performance/ssr-streaming', badge: 'Rendering', available: true,
    description: 'SSR, SSG, ISR, and streaming HTML — when server rendering improves performance vs adds complexity.',
    keyPoints: ['SSR: faster LCP when client JS is heavy', 'SSG: pre-rendered HTML at build time — fastest possible TTFB', 'Streaming HTML: flush early with React/Node.js ReadableStream', 'Partial hydration: hydrate only interactive components', 'Edge rendering: deploy SSR close to users (Vercel, Cloudflare)'] },
  { title: 'CSS Performance',             route: '/performance/css-performance', badge: 'Assets', available: true,
    description: 'Reduce CSS selector complexity, contain, content-visibility, and removing unused styles.',
    keyPoints: ['content-visibility: auto: browser skips off-screen rendering', 'PurgeCSS / UnCSS: remove unused class selectors in production', 'Critical CSS: inline above-the-fold, async-load the rest', 'contain: layout strict: isolates element from triggering global layout', 'Avoid @import in CSS — causes serial network requests'] },
  { title: 'Web Workers & Off-Main-Thread', route: '/performance/web-workers', badge: 'JavaScript', available: false,
    description: 'Move CPU-intensive work off the main thread with Web Workers and Comlink for clean APIs.',
    keyPoints: ['Web Worker: runs JS in background thread', 'Comlink: wraps Worker with Proxy for RPC-style calls', 'Use for image processing, encryption, JSON parsing at scale', 'SharedArrayBuffer: shared memory with cross-origin isolation', 'Atomics: synchronise threads via atomic operations'] },
  { title: 'Performance Budgets & CI',    route: '/performance/performance-budgets', badge: 'Measurement', available: false,
    description: 'Set performance budgets, automate Lighthouse in CI, and fail builds when budgets are exceeded.',
    keyPoints: ['Lighthouse CI (LHCI): run Lighthouse on every PR', 'Budget types: file size, Lighthouse score, CWV thresholds', 'Performance regression in CI: assert score >= baseline', 'Bundlesize: enforce JS budget per chunk in CI', 'SpeedCurve / Calibre: continuous field data monitoring'] },
  { title: 'Speculation Rules API',       route: '/performance/speculation-rules', badge: 'Loading', available: false,
    description: 'Instant page navigations with the new Speculation Rules API — prefetch and prerender rules.',
    keyPoints: ['<script type="speculationrules"> JSON config', 'prefetch: early resource fetch for next page', 'prerender: full background render before navigation', 'URL patterns: list, selector-based, or eager on hover', 'Currently Chrome 109+ only; feature-detect first'] },
  { title: 'Performance Cheat Sheet',    route: '/performance/cheatsheet', badge: 'Reference', available: false,
    description: 'Core Web Vitals thresholds, quick wins checklist, resource hint guide, and caching strategy matrix.',
    keyPoints: ['CWV thresholds: LCP < 2.5s, INP < 200ms, CLS < 0.1', 'Quick wins: preload LCP image, lazy-load below-fold, eliminate render-blocking CSS', 'Cache strategy: immutable assets forever, HTML no-cache, API short TTL'] },
  { title: 'Performance Interview Prep', route: '/performance/interview-prep', badge: 'Reference', available: false,
    description: '30+ web performance interview questions — Core Web Vitals, rendering, caching, and optimisation strategies.',
    keyPoints: ['Explain the Critical Rendering Path', 'What is the difference between LCP, FCP, and TTFB?', 'How would you optimise a page scoring poorly on INP?'] },
];

@Component({
  selector: 'app-web-performance-home',
  standalone: true, imports: [RouterLink],
  templateUrl: './home.html', styleUrl: './home.scss',
})
export class WebPerformanceHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'cwv'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
