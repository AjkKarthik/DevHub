import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CheatSection {
  title: string;
  items: CheatItem[];
}

interface CheatItem {
  label: string;
  value: string;
  note?: string;
  good?: boolean;
  bad?: boolean;
}

@Component({
  selector: 'app-perf-cheatsheet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class PerfCheatsheet {

  sections: CheatSection[] = [
    {
      title: 'Core Web Vitals Thresholds',
      items: [
        { label: 'LCP — Good',               value: '< 2.5 s',   good: true,  note: 'Largest Contentful Paint — loading' },
        { label: 'LCP — Needs Improvement',  value: '2.5–4 s',               note: 'Investigate and fix' },
        { label: 'LCP — Poor',               value: '> 4 s',     bad: true,   note: 'Urgent — hurts rankings' },
        { label: 'INP — Good',               value: '< 200 ms',  good: true,  note: 'Interaction to Next Paint — responsiveness' },
        { label: 'INP — Needs Improvement',  value: '200–500 ms',             note: 'Break long tasks' },
        { label: 'INP — Poor',               value: '> 500 ms',  bad: true,   note: 'Pages feel broken' },
        { label: 'CLS — Good',               value: '< 0.1',     good: true,  note: 'Cumulative Layout Shift — stability' },
        { label: 'CLS — Needs Improvement',  value: '0.1–0.25',              note: 'Find shifting elements' },
        { label: 'CLS — Poor',               value: '> 0.25',    bad: true,   note: 'Content jumps unexpectedly' },
        { label: 'TTFB — Good',              value: '< 800 ms',  good: true,  note: 'Time to First Byte — server/CDN speed' },
        { label: 'FCP — Good',               value: '< 1.8 s',   good: true,  note: 'First Contentful Paint — any content' },
        { label: 'TBT — Good (lab)',          value: '< 300 ms',  good: true,  note: 'Lab proxy for INP — sum of long task blocking' },
      ],
    },
    {
      title: 'Quick Wins Checklist',
      items: [
        { label: 'Preload LCP image',              value: '<link rel="preload" as="image" href="hero.webp" fetchpriority="high">',  note: 'Single biggest LCP win on most sites' },
        { label: 'Never lazy-load the LCP image',  value: 'loading="eager" (default)',                                              note: 'loading="lazy" delays LCP' },
        { label: 'Set img width + height',          value: 'width="800" height="600"',                                              note: 'Prevents CLS from layout shift as image loads' },
        { label: 'Defer non-critical scripts',      value: '<script src="..." defer>',                                              note: 'Keeps scripts from blocking HTML parse' },
        { label: 'Inline critical CSS',             value: '<style>/* above-fold styles */</style>',                                note: 'Eliminates render-blocking stylesheet request' },
        { label: 'Serve next-gen images',           value: '<picture> with AVIF + WebP + JPEG fallback',                           note: 'AVIF: 50% smaller than JPEG; WebP: 30% smaller' },
        { label: 'Add font-display: swap',          value: 'font-display: swap (or fallback)',                                      note: 'Shows text immediately with fallback font' },
        { label: 'Preconnect to CDN/fonts',         value: '<link rel="preconnect" href="https://fonts.googleapis.com">',           note: 'Removes ~200ms connection setup cost' },
        { label: 'Add Cache-Control for assets',    value: 'Cache-Control: max-age=31536000, immutable',                           note: 'Versioned assets cached for 1 year' },
        { label: 'Use defer on GTM/analytics',      value: 'Load after page interactive',                                          note: 'Third-party scripts inflate INP and TBT' },
      ],
    },
    {
      title: 'Resource Hints Reference',
      items: [
        { label: 'preload',          value: '<link rel="preload" as="image|font|script|style">',        note: 'High priority: current page critical resource. font needs crossorigin.' },
        { label: 'prefetch',         value: '<link rel="prefetch" href="/next-page.js">',               note: 'Low priority: next page resource. Downloaded idle.' },
        { label: 'preconnect',       value: '<link rel="preconnect" href="https://origin.com">',        note: 'Open TCP+TLS early. Max 6 — use only for confirmed origins.' },
        { label: 'dns-prefetch',     value: '<link rel="dns-prefetch" href="https://origin.com">',      note: 'DNS only (fallback for preconnect). Cheaper, less effective.' },
        { label: 'modulepreload',    value: '<link rel="modulepreload" href="/module.js">',             note: 'Preload ES module + its static imports.' },
        { label: 'fetchpriority',    value: 'fetchpriority="high|low|auto"',                            note: 'On <img> or <link>. Use "high" on LCP image, "low" on below-fold.' },
        { label: 'speculation rules',value: '<script type="speculationrules">{"prerender":[...]}</script>', note: 'Fully prerender next page. Chrome 109+.' },
      ],
    },
    {
      title: 'Caching Strategy Matrix',
      items: [
        { label: 'Versioned JS/CSS (hashed)',    value: 'Cache-Control: max-age=31536000, immutable',         good: true,  note: 'bundle.abc123.js — never changes; cache forever' },
        { label: 'index.html (entry point)',      value: 'Cache-Control: no-cache',                           note: 'Always revalidate — is the only file with no hash' },
        { label: 'API responses (dynamic)',       value: 'Cache-Control: no-store',                           note: 'User-specific data — do not cache' },
        { label: 'API responses (shared)',        value: 'Cache-Control: public, max-age=60, s-maxage=3600',  note: 'CDN caches for 1h; browser for 1min' },
        { label: 'Images (static)',               value: 'Cache-Control: max-age=86400',                      note: '1-day cache; use hashed filenames for immutable' },
        { label: 'Fonts (from CDN)',              value: 'Cache-Control: max-age=31536000',                   good: true,  note: 'Fonts never change for a given URL' },
        { label: 'Service Worker strategy',       value: 'Stale-while-revalidate (Workbox)',                  note: 'Serve cached, update in background — good for most assets' },
      ],
    },
    {
      title: 'Image Optimisation Quick Reference',
      items: [
        { label: 'Format priority',        value: 'AVIF > WebP > JPEG/PNG',                                         note: 'Use <picture> with fallback' },
        { label: 'LCP image',              value: 'fetchpriority="high" loading="eager"',          good: true,        note: 'Never lazy-load the LCP element' },
        { label: 'Below-fold images',      value: 'loading="lazy" decoding="async"',               good: true,        note: 'Defers download until near viewport' },
        { label: 'Responsive images',      value: 'srcset="img-400.webp 400w, img-800.webp 800w" sizes="(max-width: 600px) 100vw, 50vw"',  note: 'Browser picks right size for screen' },
        { label: 'Aspect ratio',           value: 'aspect-ratio: 16/9  or  width + height attrs',                   note: 'Prevents CLS while image loads' },
        { label: 'Max dimension',          value: '< 1200px for hero images',                                        note: 'Retina max ~2× CSS pixel width' },
        { label: 'Sharp pipeline',         value: 'sharp.resize().webp({ quality: 80 }).avif({ quality: 65 })',      note: 'Build-time conversion and resizing' },
      ],
    },
    {
      title: 'JavaScript Performance Reference',
      items: [
        { label: 'Long task threshold',        value: '> 50 ms',                                    bad: true,   note: 'Any main-thread task > 50ms blocks input' },
        { label: 'Break long tasks',           value: 'await scheduler.yield() every 50 iterations', good: true,  note: 'Or: setTimeout(0) as fallback' },
        { label: 'Initial JS budget',          value: '< 150 KB gzipped',                           good: true,  note: 'Per 100KB ≈ +1s on mid-tier mobile' },
        { label: 'Tree shaking',               value: 'Use ES module import (not require)',           good: true,  note: 'CommonJS cannot be tree-shaken' },
        { label: 'Code splitting',             value: 'import() + loadComponent() lazy routes',      good: true,  note: 'Load only what the current route needs' },
        { label: 'Bundle analyser',            value: 'rollup-plugin-visualizer / webpack-bundle-analyzer',         note: 'Run after every major dependency change' },
        { label: 'Off-main-thread',            value: 'Web Worker for CPU tasks > 50ms',             good: true,  note: 'Comlink for clean RPC API' },
      ],
    },
    {
      title: 'Tools Quick Reference',
      items: [
        { label: 'PageSpeed Insights',  value: 'pagespeed.web.dev',           note: 'Lab (Lighthouse) + Field (CrUX) data on one page' },
        { label: 'Chrome DevTools',     value: 'F12 → Performance panel',     note: 'Record, inspect long tasks, LCP element, layout shifts' },
        { label: 'WebPageTest',         value: 'webpagetest.org',             note: 'Waterfall, filmstrip, real devices, multi-location' },
        { label: 'Lighthouse CLI',      value: 'npx lighthouse <url>',        note: 'Scriptable; use in CI with @lhci/cli' },
        { label: 'Bundlephobia',        value: 'bundlephobia.com',            note: 'Check npm package size before installing' },
        { label: 'web-vitals',          value: 'npm install web-vitals',      note: 'Correct CWV measurement from real users' },
        { label: 'CrUX API',            value: 'chromeuxreport.googleapis.com', note: 'Field data for any URL — free with API key' },
        { label: 'Workbox',             value: 'npm install workbox-*',       note: 'Service Worker caching strategies (Google)' },
      ],
    },
  ];
}
