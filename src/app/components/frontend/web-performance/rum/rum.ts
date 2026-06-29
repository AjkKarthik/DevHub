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
  selector: 'app-perf-rum',
  standalone: true,
  imports: [CommonModule, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './rum.html',
  styleUrl: './rum.scss',
})
export class PerfRum {

  quickRef: QuickRefItem[] = [
    { name: 'web-vitals',          type: 'keyword', desc: 'Google\'s official npm package — onLCP, onINP, onCLS, onFCP, onTTFB callbacks with attribution data' },
    { name: 'onLCP()',             type: 'function', desc: 'Fires once after LCP is finalised (after visibilitychange or user interaction) — use this, not PerformanceObserver directly' },
    { name: 'onINP()',             type: 'function', desc: 'Fires with the worst interaction of the session on page hide — includes element, event type, and timing breakdown' },
    { name: 'visibilitychange',    type: 'keyword', desc: 'The right event to send metrics on — fires before page is unloaded, more reliable than beforeunload' },
    { name: 'sendBeacon()',        type: 'method',  desc: 'navigator.sendBeacon(url, data) — non-blocking POST that survives page unload; ideal for metric beacons' },
    { name: 'Attribution',        type: 'keyword', desc: 'web-vitals attribution data — LCP element, INP event type, CLS shifted elements — pinpoints the cause' },
    { name: 'P75 / percentiles',  type: 'keyword', desc: 'Always report 75th percentile of your RUM data — matches how Google scores CWV in field data' },
    { name: 'Segment by device',  type: 'keyword', desc: 'Mobile and desktop CWV often differ by 3–5×; always segment metrics by connection type and device class' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why RUM matters more than Lighthouse',
      points: [
        'Lighthouse runs on a simulated mid-tier device with throttled 4G — your users have real devices on real networks.',
        'RUM captures actual LCP, INP, and CLS values from every real user visit across all device types and locations.',
        'Google\'s search ranking uses CrUX field data — equivalent to your RUM data — not Lighthouse scores.',
        'RUM reveals segments: desktop users may have LCP 1.2s, mobile users 3.8s — Lighthouse shows you neither.',
        'Without RUM you\'re flying blind: performance regressions introduced by new code can go undetected for weeks.',
      ],
    },
    {
      heading: 'web-vitals library — the correct way to measure',
      points: [
        'npm install web-vitals — Google\'s official library, handles all edge cases correctly.',
        'onLCP() reports the final LCP value (LCP can update as more content loads — the library handles this).',
        'onINP() reports the worst interaction of the session — fires on visibilitychange/pagehide, not each interaction.',
        'onCLS() accumulates all layout shifts per session group and reports the worst window.',
        'onFCP() and onTTFB() fire once, early in page load — useful for server speed monitoring.',
      ],
    },
    {
      heading: 'Sending metrics to your analytics backend',
      points: [
        'Use navigator.sendBeacon() on visibilitychange — it sends a POST that survives page navigation and close.',
        'Fallback to fetch() with keepalive: true if sendBeacon() is unavailable.',
        'Batch metrics: collect all values in an array, send once on visibilitychange instead of per-metric.',
        'Include: metric name, value, rating (good/needs-improvement/poor), page URL, session ID, device type.',
        'GA4 custom events: event_name="web_vitals", params: {metric_name, metric_value, metric_rating}.',
      ],
    },
    {
      heading: 'Attribution data — finding the root cause',
      points: [
        'web-vitals attribution provides context: which element caused LCP, which interaction caused the worst INP.',
        'LCP attribution: element tag, URL (for images), loadStart, renderTime, resourceLoadDuration.',
        'INP attribution: eventType (pointerdown/keydown/click), eventTarget, inputDelay, processingDuration, presentationDelay.',
        'CLS attribution: sources[] — each shifted element, its impact fraction, and which animation/insertion caused it.',
        'Log attribution separately for debugging; only send metric value + rating to GA4 (to stay within GA4 event limits).',
      ],
    },
    {
      heading: 'Segmenting and interpreting RUM data',
      points: [
        'Always segment by device type (mobile/desktop/tablet) — mobile is usually 3–5× worse.',
        'Segment by connection: 4G vs 3G vs WiFi dramatically affects LCP and TTFB.',
        'Segment by geography: users in different countries see different CDN PoPs — can reveal CDN misconfiguration.',
        'P75 threshold: good if 75% of sessions are in the "good" range — matches how Google scores CWV.',
        'Alert on: P75 LCP > 2.5s, P75 INP > 200ms, P75 CLS > 0.1, compared to your prior 28-day baseline.',
      ],
    },
    {
      heading: 'RUM tools — build vs buy',
      points: [
        'DIY (web-vitals + GA4): free, sufficient for most sites, limited to event-level data without custom dashboards.',
        'Vercel Speed Insights: automatic, works with Next.js and any site via script tag, 2500 free events/month.',
        'Sentry Performance: integrates with error monitoring, shows performance alongside JS errors.',
        'SpeedCurve / Calibre: premium, continuous monitoring with alerting, competitor benchmarking.',
        'New Relic / Datadog Browser: enterprise, full session replay, distributed tracing from browser to backend.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'web-vitals + sendBeacon',
      language: 'typescript',
      code: `// npm install web-vitals
import { onLCP, onINP, onCLS, onFCP, onTTFB, Metric } from 'web-vitals';

// Batch all metrics, send once on page hide
const metrics: Record<string, number> = {};

function sendMetrics() {
  if (!Object.keys(metrics).length) return;
  const body = JSON.stringify({
    url: location.href,
    metrics,
    userAgent: navigator.userAgent,
    connectionType: (navigator as any).connection?.effectiveType ?? 'unknown',
  });

  // sendBeacon survives navigation — the correct transport for page-hide events
  if (!navigator.sendBeacon('/api/rum', body)) {
    // Fallback: keepalive fetch
    fetch('/api/rum', { method: 'POST', body, keepalive: true,
      headers: { 'Content-Type': 'application/json' } });
  }
}

function collect({ name, value, rating }: Metric) {
  metrics[name] = Math.round(name === 'CLS' ? value * 1000 : value);
  metrics[\`\${name}_rating\`] = rating === 'good' ? 1 : rating === 'needs-improvement' ? 2 : 3;
}

onLCP(collect);
onINP(collect);
onCLS(collect);
onFCP(collect);
onTTFB(collect);

// Send on page hide (tab close, navigate away)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) sendMetrics();
});`,
    },
    {
      label: 'Attribution — find root cause',
      language: 'typescript',
      code: `import { onLCP, onINP, onCLS, LCPMetricWithAttribution, INPMetricWithAttribution } from 'web-vitals/attribution';

// LCP attribution — what element caused it?
onLCP((metric) => {
  const { element, url, loadStart, renderTime, resourceLoadDuration } = metric.attribution;
  console.group('LCP Debug');
  console.log('Element:', element);
  console.log('Image URL:', url ?? '(text/inline)');
  console.log('Image load duration:', Math.round(resourceLoadDuration ?? 0), 'ms');
  console.log('Render time (from load):', Math.round(renderTime - loadStart), 'ms');
  console.log('Rating:', metric.rating);
  console.groupEnd();

  // Log to Sentry / Datadog for debugging (not GA4 — too verbose)
  logDebugEvent('lcp_attribution', {
    element: element?.tagName,
    src: url,
    loadMs: resourceLoadDuration,
    rating: metric.rating,
  });
});

// INP attribution — what interaction caused it?
onINP((metric) => {
  const { eventType, eventTarget, inputDelay, processingDuration, presentationDelay } = metric.attribution;
  console.group('INP Debug');
  console.log('Worst interaction:', eventType, 'on', eventTarget);
  console.log('Input delay:', Math.round(inputDelay), 'ms');
  console.log('Processing time:', Math.round(processingDuration), 'ms');
  console.log('Presentation delay:', Math.round(presentationDelay), 'ms');
  console.log('Total INP:', Math.round(metric.value), 'ms', '— Rating:', metric.rating);
  console.groupEnd();
});`,
    },
    {
      label: 'Send to GA4',
      language: 'typescript',
      code: `import { onLCP, onINP, onCLS, onFCP, onTTFB, Metric } from 'web-vitals';

// GA4 custom events for Core Web Vitals
// Requires gtag to be loaded (window.gtag)
declare const gtag: (...args: unknown[]) => void;

function sendToGA4({ name, value, rating, id }: Metric) {
  gtag('event', name, {
    // GA4 accepts string event names
    value: Math.round(name === 'CLS' ? value * 1000 : value),
    metric_rating: rating,
    metric_id: id,           // unique per page load — use for deduplication
    non_interaction: true,   // don't inflate bounce rate
  });
}

onLCP(sendToGA4);
onINP(sendToGA4);
onCLS(sendToGA4);
onFCP(sendToGA4);
onTTFB(sendToGA4);

// In GA4: Explore → Free form → Dimension: Event name → filter by LCP/INP/CLS
// Metric: Event value → aggregation: Percentile 75 → this is your RUM P75

// Custom report: segment by metric_rating
// Good (1) vs Needs Improvement (2) vs Poor (3) → pie chart per metric`,
    },
    {
      label: 'RUM dashboard query (BigQuery/CrUX)',
      language: 'typescript',
      code: `// TypeScript client for the CrUX History API — track trends over time
// https://developer.chrome.com/docs/crux/api/
async function getCruxHistory(origin: string, apiKey: string) {
  const res = await fetch(
    'https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord'
    + \`?key=\${apiKey}\`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin,
        metrics: [
          'largest_contentful_paint',
          'interaction_to_next_paint',
          'cumulative_layout_shift',
          'first_contentful_paint',
          'experimental_time_to_first_byte',
        ],
      }),
    }
  );
  const data = await res.json();

  // Each metric has collectionPeriods (week-by-week) + histogram buckets
  const record = data.record;
  for (const [metric, value] of Object.entries(record.metrics)) {
    const m = value as any;
    const p75 = m.percentiles?.p75;
    console.log(\`\${metric}: P75 = \${p75}\`);
    // histogram: [{start, end, density}] — bucket densities sum to 1
    // good/needs-improvement/poor thresholds are in the histogram
  }

  return data;
}

// getCruxHistory('https://example.com', 'YOUR_API_KEY')`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Sending metrics on beforeunload instead of visibilitychange',
      wrong: `window.addEventListener('beforeunload', () => {
  fetch('/api/rum', { method: 'POST', body: JSON.stringify(metrics) });
  // fetch is cancelled before completing on page close
});`,
      right: `document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    navigator.sendBeacon('/api/rum', JSON.stringify(metrics));
  }
});`,
      explanation: 'beforeunload fires too late — fetch requests are cancelled by the browser before they complete on page close. visibilitychange + sendBeacon is the correct pattern: sendBeacon is guaranteed to complete even after the page is hidden.',
    },
    {
      title: 'Using performance.now() to measure LCP instead of web-vitals',
      wrong: `// DIY LCP measurement — misses updates, wrong timing baseline
const start = performance.now();
document.addEventListener('DOMContentLoaded', () => {
  const lcp = performance.now() - start;  // not actually LCP
  sendMetric('lcp', lcp);
});`,
      right: `import { onLCP } from 'web-vitals';
// web-vitals handles: multiple LCP candidates, final value after interaction,
// correct startTime baseline, and buffered entries
onLCP(({ value, rating }) => console.log('LCP:', value, rating));`,
      explanation: 'LCP is complex — it can update multiple times as more content loads, and only finalises after a user interaction or page hide. web-vitals handles all these edge cases correctly. DIY PerformanceObserver implementations almost always get the value wrong.',
    },
    {
      title: 'Reporting average instead of 75th percentile',
      wrong: `// Average hides the slow tail — users with poor connections are invisible
const avgLCP = lcpValues.reduce((a, b) => a + b, 0) / lcpValues.length;
console.log('Average LCP:', avgLCP);`,
      right: `// P75 matches how Google measures CWV — 75% of users must be in "good" range
function percentile(arr: number[], p: number) {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * p / 100)];
}
console.log('P75 LCP:', percentile(lcpValues, 75), 'ms');`,
      explanation: 'Google\'s CWV rating uses the 75th percentile — meaning 75% of real user visits must be "good." Reporting averages hides the slow tail (your worst 25% of users) and gives a misleadingly optimistic picture of real user experience.',
    },
    {
      title: 'Not segmenting by device type',
      wrong: `// Single P75 across all devices — desktop pulls the average down
SELECT APPROX_QUANTILES(lcp_ms, 100)[OFFSET(75)] AS p75_lcp
FROM rum_events`,
      right: `-- Segment by device_type — mobile and desktop often differ by 3-5x
SELECT
  device_type,
  APPROX_QUANTILES(lcp_ms, 100)[OFFSET(75)] AS p75_lcp,
  COUNTIF(lcp_rating = 'good') / COUNT(*) AS pct_good
FROM rum_events
GROUP BY device_type
ORDER BY p75_lcp DESC`,
      explanation: 'Desktop users on WiFi may have LCP 1.2s while mobile users on 3G have LCP 4.5s — averaging these masks the poor mobile experience. Google\'s search ranking measures mobile and desktop separately. Always segment by device type in your RUM dashboards.',
    },
    {
      title: 'Sending RUM data on every metric callback instead of batching',
      wrong: `// 5 separate network requests per page visit
onLCP(metric => fetch('/api/rum', { method: 'POST', body: JSON.stringify(metric) }));
onINP(metric => fetch('/api/rum', { method: 'POST', body: JSON.stringify(metric) }));
onCLS(metric => fetch('/api/rum', { method: 'POST', body: JSON.stringify(metric) }));
onFCP(metric => fetch('/api/rum', { method: 'POST', body: JSON.stringify(metric) }));
onTTFB(metric => fetch('/api/rum', { method: 'POST', body: JSON.stringify(metric) }));`,
      right: `// One beacon per page visit — batch all metrics
const batch: Record<string, number> = {};
const collect = ({ name, value }: Metric) => { batch[name] = Math.round(value); };
onLCP(collect); onINP(collect); onCLS(collect); onFCP(collect); onTTFB(collect);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) navigator.sendBeacon('/api/rum', JSON.stringify(batch));
});`,
      explanation: 'Five separate fetch requests per page visit create unnecessary network overhead and can themselves slightly affect performance measurements. Batch all metrics into a single sendBeacon call on visibilitychange — one request per page visit.',
    },
    {
      title: 'Ignoring the metric.id field for deduplication',
      wrong: `// If the user restores a bfcache page, onLCP fires again
// Result: duplicate LCP events in GA4 for the same page visit
onLCP(({ name, value }) => gtag('event', name, { value }));`,
      right: `// metric.id is unique per page load — use it to deduplicate in your backend
onLCP(({ name, value, id }) => gtag('event', name, { value, metric_id: id }));
// In GA4/BigQuery: dedup by metric_id before aggregating`,
      explanation: 'The web-vitals library can fire callbacks multiple times (e.g. after bfcache restore). The metric.id field is a unique identifier per page load — include it in your analytics events to deduplicate when querying your data warehouse.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a lightweight RUM beacon',
    language: 'typescript',
    description: `Build a self-contained RUM module that:
1. Collects LCP, INP, CLS, FCP, TTFB using web-vitals
2. Captures device type (mobile/desktop), connection type, and page URL
3. Batches all metrics into a single payload
4. Sends on visibilitychange using sendBeacon with fetch fallback
5. Includes each metric's rating (good/needs-improvement/poor)`,
    hints: [
      'Use the web-vitals npm package — onLCP, onINP, onCLS, onFCP, onTTFB',
      'navigator.connection?.effectiveType gives connection type (4g/3g/2g)',
      'window.innerWidth < 768 is a simple mobile/desktop detector',
      'document.addEventListener("visibilitychange", ...) fires when tab is hidden',
      'navigator.sendBeacon(url, JSON.stringify(payload)) returns a boolean',
    ],
    starterCode: `// rum-beacon.ts — complete this module
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

const BEACON_URL = '/api/rum';

interface RumPayload {
  url: string;
  device: 'mobile' | 'desktop';
  connection: string;
  metrics: Record<string, number>;
  ratings: Record<string, string>;
}

// TODO: collect metrics
// TODO: build payload
// TODO: send on visibilitychange`,
    solution: `// rum-beacon.ts — complete RUM beacon
import { onLCP, onINP, onCLS, onFCP, onTTFB, Metric } from 'web-vitals';

const BEACON_URL = '/api/rum';
const metrics: Record<string, number> = {};
const ratings: Record<string, string> = {};

function collect({ name, value, rating }: Metric) {
  // CLS is unitless (0.1) — multiply by 1000 for integer storage
  metrics[name] = Math.round(name === 'CLS' ? value * 1000 : value);
  ratings[name] = rating;
}

onLCP(collect);
onINP(collect);
onCLS(collect);
onFCP(collect);
onTTFB(collect);

function buildPayload() {
  const nav = navigator as any;
  return {
    url: location.href,
    device: window.innerWidth < 768 ? 'mobile' : 'desktop',
    connection: nav.connection?.effectiveType ?? 'unknown',
    metrics,
    ratings,
    ts: Date.now(),
  };
}

function send() {
  if (!Object.keys(metrics).length) return;
  const body = JSON.stringify(buildPayload());
  if (!navigator.sendBeacon(BEACON_URL, body)) {
    fetch(BEACON_URL, {
      method: 'POST',
      body,
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) send();
});`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why is navigator.sendBeacon() preferred over fetch() for sending RUM data on page unload?',
      options: [
        'sendBeacon() compresses the payload automatically',
        'sendBeacon() is guaranteed to complete even after the page is hidden or closed',
        'sendBeacon() bypasses CORS restrictions for analytics endpoints',
        'sendBeacon() batches multiple calls automatically',
      ],
      answer: 1,
      explanation: 'fetch() requests are cancelled by the browser when the page is unloaded. sendBeacon() uses a fire-and-forget mechanism that queues the request to complete even after the page closes. It returns a boolean indicating whether the beacon was queued (not whether it succeeded).',
    },
    {
      q: 'When does onLCP() from web-vitals fire its final value?',
      options: [
        'Immediately when the largest element is rendered',
        'After the first user interaction or when the page is hidden — LCP updates until then',
        'After the DOMContentLoaded event',
        'After all images have finished loading',
      ],
      answer: 1,
      explanation: 'LCP can update multiple times as more content loads (a larger image may appear after the initial render). The browser stops updating LCP on the first user interaction or when the page is hidden. web-vitals\' onLCP fires the final confirmed value at that point.',
    },
    {
      q: 'What does the metric.id field in web-vitals allow you to do?',
      options: [
        'Identify which DOM element triggered the metric',
        'Deduplicate metric events in your analytics backend when bfcache causes callbacks to re-fire',
        'Sort metrics by their importance for search ranking',
        'Match metric events to specific network requests',
      ],
      answer: 1,
      explanation: 'metric.id is a unique identifier per page load generated by web-vitals. When bfcache (back-forward cache) restores a page, metric callbacks can fire again with updated values. Using metric.id lets you deduplicate or update (not double-count) events in your analytics queries.',
    },
    {
      q: 'Which aggregation should you use when reporting Core Web Vitals from RUM data?',
      options: [
        'Mean (average) — most statistically reliable',
        '75th percentile (P75) — matches how Google measures and reports CWV',
        'Median (P50) — represents the typical user',
        '95th percentile (P95) — catches the worst user experiences',
      ],
      answer: 1,
      explanation: 'Google measures CWV at the 75th percentile — a URL is rated "good" if 75% of real user visits meet the threshold. Using P75 in your RUM dashboards lets you directly compare against CrUX data and predict your search ranking impact.',
    },
    {
      q: 'Which web-vitals function gives you data about WHAT interaction caused a slow INP?',
      options: [
        'onINP() from \'web-vitals\' (standard)',
        'onINP() from \'web-vitals/attribution\' — includes eventType, eventTarget, and timing breakdown',
        'PerformanceObserver with type "interaction"',
        'The Long Tasks API with initiator information',
      ],
      answer: 1,
      explanation: 'The /attribution import of web-vitals adds attribution data to each metric. For INP, this includes the eventType (click/keydown/pointerdown), the eventTarget (which element was interacted with), and the three phases: inputDelay, processingDuration, and presentationDelay.',
    },
    {
      q: 'What is the delta property on web-vitals metric objects and why does it matter for analytics?',
      options: ['The difference from the previous page\'s score', 'The incremental change since the last time the callback fired — allows summing partial updates', 'The margin of error in the measurement', 'The gap between lab and field data'],
      answer: 1,
      explanation: 'CLS fires multiple times during page lifetime as shifts accumulate. Each callback fires with the current cumulative value (value) and the change since the last callback (delta). When sending to analytics, send delta instead of value to avoid double-counting — your server can sum all deltas for the session to get the final score. For LCP and INP, late callbacks may also update the value.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How is RUM different from CrUX?',
      a: 'CrUX (Chrome User Experience Report) is Google\'s anonymised dataset from opted-in Chrome users — available with a 28-day lag via PageSpeed Insights and the CrUX API. RUM is your own first-party data collected via web-vitals + your analytics backend — available immediately, queryable by any dimension you instrument (user ID, A/B test variant, page template), and includes 100% of your traffic (not just Chrome users who opted in).',
    },
    {
      q: 'My Lighthouse score is 90 but my CrUX LCP is poor. Why?',
      a: 'Lighthouse emulates a mid-tier Android device on throttled 4G in a controlled environment. Your real users may be on older devices, slower connections, in regions with higher CDN latency, or have extensions that slow the page. Additionally, if your LCP element requires JavaScript to render (SPA client-side rendering), Lighthouse may score it better than real users experience because it waits for the full render.',
    },
    {
      q: 'Should I use GA4 or a dedicated RUM tool?',
      a: 'GA4 is free and sufficient for basic CWV trending (store LCP/INP/CLS as custom events). Limitations: 28-day data retention by default, limited to 500 events/session, no session replay. For deeper debugging (session replay, full traces, JS error correlation), consider Sentry Performance, Vercel Speed Insights, or Datadog Browser. For very high-traffic sites needing BigQuery analysis, GA4 with BigQuery export is a good middle ground.',
    },
    {
      q: 'How do I debug an INP regression I can only reproduce on mobile?',
      a: 'Use web-vitals/attribution to log INP attribution (eventType, eventTarget, processingDuration breakdown) to your RUM backend. Filter your RUM data for mobile + INP > 200ms — the eventTarget and eventType fields will tell you which interaction is slow. Then use Chrome Remote Debugging (chrome://inspect) to profile the actual interaction on a connected Android device — you\'ll see the call stack in the Performance panel.',
    },
    {
      q: 'How do I measure web vitals in a Single Page Application (SPA)?',
      a: 'web-vitals handles SPA navigation via the "soft navigation" heuristic in newer versions. Install web-vitals@^4 — it includes reportAllChanges option. Pass { reportAllChanges: true } to onLCP/onCLS to get updated values after each route change. For accurate SPA measurement, also send metrics on each route change (listen to popstate/pushState) rather than only on page hide. Note that CrUX currently only measures hard navigations.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'RUM is your ground truth — use web-vitals + sendBeacon, report P75 by device type, and include attribution data to pinpoint the element or interaction causing poor metrics.',
    mustKnow: [
      'web-vitals npm package is the correct way to measure CWV — handles all edge cases',
      'Send on visibilitychange with sendBeacon — fetch is cancelled on page unload',
      'Report P75, not average — matches Google\'s CWV scoring methodology',
      'Always segment by device type — mobile is 3–5× slower than desktop',
      'metric.id deduplicates events when bfcache causes callbacks to re-fire',
      'web-vitals/attribution gives element/event context for debugging root causes',
    ],
    interviewFocus: [
      'How does RUM differ from Lighthouse / lab performance testing?',
      'Why use sendBeacon() instead of fetch() for analytics beacons?',
      'What is the correct percentile to use when reporting Core Web Vitals?',
      'How do you find WHAT interaction caused a slow INP using web-vitals?',
    ],
  };
}
