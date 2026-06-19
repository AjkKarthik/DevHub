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
  selector: 'app-perf-http2-http3',
  standalone: true,
  imports: [CommonModule, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './http2-http3.html',
  styleUrl: './http2-http3.scss',
})
export class PerfHttp2Http3 {

  quickRef: QuickRefItem[] = [
    { name: 'Multiplexing',         type: 'keyword', desc: 'HTTP/2: multiple requests/responses over ONE TCP connection simultaneously — no head-of-line blocking per stream' },
    { name: 'HPACK compression',    type: 'keyword', desc: 'HTTP/2 header compression — eliminates repeated headers (Cookie, User-Agent) across requests on the same connection' },
    { name: 'Server Push',          type: 'keyword', desc: 'HTTP/2: server proactively sends resources before the client requests them — largely superseded by preload + Early Hints' },
    { name: 'QUIC',                 type: 'keyword', desc: 'HTTP/3 transport: UDP-based, 0-RTT reconnect, no TCP head-of-line blocking, built-in encryption (TLS 1.3)' },
    { name: '0-RTT',                type: 'keyword', desc: 'HTTP/3 feature: subsequent connections reuse session keys — first request sent immediately, saving one round-trip' },
    { name: 'Early Hints (103)',     type: 'keyword', desc: 'Server sends preload Link headers before the 200 response — browser starts fetching assets while server processes the request' },
    { name: 'Connection coalescing',type: 'keyword', desc: 'HTTP/2: multiple hostnames on the same IP + TLS cert share one connection — eliminates CDN sharding overhead' },
    { name: 'Domain sharding',      type: 'keyword', desc: 'HTTP/1.1 hack: split resources across subdomains to bypass 6-connection limit — HARMFUL on HTTP/2 (defeats coalescing)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'HTTP/1.1 limitations that HTTP/2 solves',
      points: [
        'HTTP/1.1 limit: browsers open max 6 TCP connections per origin to work around one-request-at-a-time per connection.',
        'Head-of-line blocking: a slow response on one connection stalls all queued requests behind it.',
        'HTTP/1.1 headers are sent as plain text on every request — repeated Cookie/User-Agent waste bandwidth.',
        'Workarounds (now harmful on HTTP/2): domain sharding, file concatenation, CSS sprites, image data URIs.',
        'HTTP/2 solves all of these at the protocol level — the workarounds actively hurt HTTP/2 performance.',
      ],
    },
    {
      heading: 'HTTP/2 — multiplexing and streams',
      points: [
        'HTTP/2 uses a single TCP connection with multiple logical streams — each request/response is a stream.',
        'Streams are interleaved: a large response on stream 1 does not block stream 2 (unlike HTTP/1.1 pipelining).',
        'HPACK header compression removes repeated headers — saves ~500 bytes per request on typical pages.',
        'Stream prioritisation: clients can signal which responses matter most (though rarely used in practice).',
        'Requires HTTPS — all major browser implementations only support HTTP/2 over TLS.',
      ],
    },
    {
      heading: 'HTTP/3 and QUIC — TCP head-of-line blocking eliminated',
      points: [
        'HTTP/2 still has TCP head-of-line blocking: packet loss stalls ALL streams on the single connection.',
        'HTTP/3 runs on QUIC (UDP-based) — each stream is independent; packet loss only affects one stream.',
        '0-RTT connection resumption: returning visitors send data in the first packet — saves one full round-trip.',
        'QUIC has TLS 1.3 built in — connection + encryption handshake in 1 RTT vs 3 RTT for TCP + TLS 1.2.',
        'Best gains on high-latency or lossy networks (mobile, satellite); desktop broadband gains are smaller.',
      ],
    },
    {
      heading: 'Early Hints (HTTP 103) — the new Server Push',
      points: [
        '103 Early Hints lets the server send Link: <url>; rel=preload headers before the 200 response is ready.',
        'Browser starts fetching critical assets (CSS, fonts, LCP image) while the server is still generating the HTML.',
        'Supported by Cloudflare, Fastly, and major CDNs; Chrome 103+, Firefox 102+, Safari 17.2+.',
        'More reliable than HTTP/2 Server Push — browser respects its own cache (Push ignores the cache).',
        'Typical gain: 200–400 ms on pages where TTFB is high and CSS/LCP image is render-blocking.',
      ],
    },
    {
      heading: 'Bundling strategy with HTTP/2',
      points: [
        'HTTP/1.1: bundle everything — fewer requests outweigh the larger files because 6-connection limit.',
        'HTTP/2: fine-grained splitting is fine — multiplexing handles many small files without penalty.',
        'In practice: moderate splitting is still best — very many tiny files (> 100) have per-request overhead.',
        'Optimal: split by route (code splitting) into chunks of 50–200 KB rather than one monolithic bundle.',
        'CSS: separate critical above-fold CSS from main bundle; JS: split vendor from app code.',
      ],
    },
    {
      heading: 'Verifying HTTP version in use',
      points: [
        'Chrome DevTools → Network → right-click column header → enable "Protocol" column — shows h2, h3, http/1.1.',
        'curl --http2 -I https://example.com — check response headers for HTTP/2 support.',
        'HTTP/3: look for alt-svc: h3=":443" header in HTTP/2 responses — signals H3 availability for next visit.',
        'Tools: web.dev/measure, WebPageTest, and Pingdom all show protocol version in waterfall views.',
        'Server configuration: nginx (http2 on; in listen directive), Caddy (automatic), Node.js (http2.createSecureServer).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Early Hints (103) — Nginx config',
      language: 'bash',
      code: `# Nginx: send 103 Early Hints before the 200 response
server {
    listen 443 ssl http2;
    server_name example.com;

    location / {
        # Send preload hints immediately while proxying to app server
        add_header Link "</css/styles.css>; rel=preload; as=style" always;
        add_header Link "</fonts/inter.woff2>; rel=preload; as=font; crossorigin" always;
        add_header Link "</img/hero.avif>; rel=preload; as=image" always;

        # Early Hints requires Nginx 1.25.1+ with ngx_http_v2_module
        # header_filter: the 103 is sent before the proxy upstream responds
        proxy_pass http://app_server;
    }
}

# Verify HTTP/2 is enabled
# curl --http2 -I https://example.com | grep -i "HTTP/"
# Should show: HTTP/2 200

# Check for HTTP/3 advertisement
# curl -I https://example.com | grep alt-svc
# Should show: alt-svc: h3=":443"; ma=86400`,
    },
    {
      label: 'Node.js HTTP/2 server',
      language: 'typescript',
      code: `import http2 from 'node:http2';
import fs from 'node:fs';

const server = http2.createSecureServer({
  key:  fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt'),
});

server.on('stream', (stream, headers) => {
  const path = headers[':path'];

  if (path === '/') {
    // Send Early Hints (103) before pushing the HTML
    stream.additionalHeaders({
      ':status': 103,
      'link': [
        '</styles.css>; rel=preload; as=style',
        '</hero.avif>; rel=preload; as=image',
      ],
    });

    // Then send the actual response
    stream.respond({
      ':status': 200,
      'content-type': 'text/html',
    });
    stream.end('<html>...</html>');
  }

  if (path === '/styles.css') {
    stream.respond({ ':status': 200, 'content-type': 'text/css' });
    stream.end(fs.readFileSync('./styles.css'));
  }
});

server.listen(443, () => console.log('HTTP/2 server on :443'));`,
    },
    {
      label: 'Detect protocol with Performance API',
      language: 'typescript',
      code: `// Check which HTTP version is being used for each resource
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    const r = entry as PerformanceResourceTiming;
    if (r.nextHopProtocol) {
      console.log(r.name.split('/').pop(), '→', r.nextHopProtocol);
      // "h2" | "h3" | "http/1.1" | "h2-push" (HTTP/2 Server Push)
    }
  }
});
observer.observe({ type: 'resource', buffered: true });

// Check main document protocol
const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
if (navEntries.length) {
  console.log('Document protocol:', navEntries[0].nextHopProtocol);
}

// Log resources NOT on HTTP/2 (may need upgrading)
observer.observe({ type: 'resource', buffered: true });
// Then filter:
// list.getEntries().filter(e => (e as any).nextHopProtocol === 'http/1.1')`,
    },
    {
      label: 'HTTP/2 bundling strategy (Vite)',
      language: 'typescript',
      code: `// vite.config.ts — code splitting for HTTP/2
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Split vendor libraries into separate chunks
        // HTTP/2 multiplexing handles many small files efficiently
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Heavy libs get their own chunk (cached independently)
            if (id.includes('react') || id.includes('react-dom')) return 'react';
            if (id.includes('lodash'))  return 'lodash';
            if (id.includes('chart'))   return 'charts';
            return 'vendor';   // everything else in shared vendor chunk
          }
        },
      },
    },
    // Target chunk size: 50-200 KB — don't go below 20 KB per chunk
    // (too many tiny chunks have per-request overhead even on H2)
    chunkSizeWarningLimit: 200,
  },
});`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using domain sharding on an HTTP/2 server',
      wrong: `<!-- HTTP/1.1 hack — harmful on HTTP/2 -->
<img src="https://img1.cdn.com/a.jpg" />
<img src="https://img2.cdn.com/b.jpg" />
<img src="https://img3.cdn.com/c.jpg" />`,
      right: `<!-- HTTP/2: single origin, multiplexed — no sharding needed -->
<img src="https://cdn.com/a.jpg" />
<img src="https://cdn.com/b.jpg" />
<img src="https://cdn.com/c.jpg" />`,
      explanation: 'Domain sharding on HTTP/1.1 bypasses the 6-connection limit. On HTTP/2 it breaks connection coalescing — instead of one multiplexed connection you get multiple connections with separate TLS handshakes, which is slower.',
    },
    {
      title: 'Concatenating all JS into one bundle on HTTP/2',
      wrong: `// Everything in one 2 MB bundle — slow initial parse, no caching granularity
// bundle.js: vendor (1MB) + app code (500KB) + page-specific code (500KB)`,
      right: `// Split by route and vendor — each chunk cached independently
// vendor.js (stable, long cache) + app.js + route-specific chunks
// HTTP/2 multiplexing handles the multiple requests without penalty`,
      explanation: 'HTTP/1.1 incentivised concatenation to reduce requests. HTTP/2 multiplexing removes that penalty. Splitting by route means the 500 KB vendor chunk is cached and reused; only the small changed app chunk re-downloads on deploy.',
    },
    {
      title: 'Relying on HTTP/2 Server Push instead of Early Hints',
      wrong: `# nginx: push CSS and font with every HTML response
http2_push /css/styles.css;
http2_push /fonts/inter.woff2;`,
      right: `# Use 103 Early Hints instead — browser-cache-aware
add_header Link "</css/styles.css>; rel=preload; as=style";
add_header Link "</fonts/inter.woff2>; rel=preload; as=font; crossorigin";`,
      explanation: 'HTTP/2 Server Push ignores the browser cache — it pushes resources even if the client already has them cached, wasting bandwidth. 103 Early Hints sends preload hints; the browser decides whether to fetch based on its cache.',
    },
    {
      title: 'Not checking if HTTP/2 is actually enabled',
      wrong: `// Assuming HTTP/2 is active because the server "supports" it
// Meanwhile the site still runs HTTP/1.1 due to misconfigured load balancer`,
      right: `// Verify in DevTools → Network → Protocol column
// Or: curl --http2 -I https://yoursite.com | head -1
// Should show: HTTP/2 200`,
      explanation: 'HTTP/2 support requires HTTPS, correct server config, and load balancer pass-through. A misconfigured reverse proxy (e.g. nginx terminating TLS but proxying HTTP/1.1 to origin) leaves the client on HTTP/1.1 for all but the edge hop.',
    },
    {
      title: 'Creating too many tiny JS chunks',
      wrong: `// 300 chunks of 5 KB each — per-chunk overhead adds up even on H2
// Every import() creates a separate network request`,
      right: `// Aim for 20-50 chunks of 50-200 KB
// Use rollup manualChunks to prevent excessive fragmentation
// minChunkSize: 20_000 in Vite / webpack splitChunks.minSize`,
      explanation: 'HTTP/2 handles many parallel requests, but each request still has metadata overhead. 300 tiny chunks each requiring a round-trip will be slower than 20 reasonably-sized chunks. Find a balance around 50–200 KB per chunk.',
    },
    {
      title: 'Ignoring HTTP/3 for high-latency audiences',
      wrong: `# No HTTP/3 configuration — all traffic on HTTP/2 TCP
# Mobile users on lossy networks experience TCP HoL blocking`,
      right: `# Enable HTTP/3 (QUIC) — Nginx 1.25+ with quic module
listen 443 quic reuseport;
listen 443 ssl;
add_header Alt-Svc 'h3=":443"; ma=86400';

# Cloudflare/Vercel/Fastly: enable HTTP/3 in dashboard settings`,
      explanation: 'HTTP/3\'s QUIC transport eliminates TCP head-of-line blocking — packet loss only affects one stream instead of all streams. For mobile users on lossy networks, HTTP/3 can reduce median load time by 10–15%.',
    },
  ];

  challenge: Challenge = {
    title: 'Diagnose the HTTP version issues',
    language: 'typescript',
    description: `A performance audit reveals the following issues on a production site.
For each issue, identify the root cause and write the fix:

1. The site uses domain sharding (img1.cdn.com, img2.cdn.com) — is this correct?
2. All JS is in one 3 MB bundle — should this change on HTTP/2?
3. CSS loads 400ms after HTML despite being in <head> — what hint fixes this?
4. Returning mobile visitors still experience slow first bytes — which HTTP/3 feature helps?

Write the corrected HTML head and a brief explanation for each fix.`,
    hints: [
      'Domain sharding hurts HTTP/2 — consolidate to one origin',
      'Split the bundle by vendor/app/route for independent caching',
      '103 Early Hints or <link rel="preload"> sends CSS hint before HTML arrives',
      'HTTP/3 0-RTT resumes sessions instantly on repeat visits',
    ],
    starterCode: `<!-- Current (problematic) setup -->
<head>
  <!-- Issue 3: CSS discovered only when parser reaches this line -->
  <link rel="stylesheet" href="/css/styles.css" />
  <script src="/js/everything.bundle.js"></script>  <!-- 3MB -->
</head>
<body>
  <!-- Issue 1: domain sharding on HTTP/2 server -->
  <img src="https://img1.cdn.com/hero.avif" />
  <img src="https://img2.cdn.com/bg.avif" />
  <img src="https://img3.cdn.com/logo.svg" />
</body>`,
    solution: `<!-- Fixed setup -->
<head>
  <!-- Fix 3: preload CSS at high priority — fetched before parser reaches link tag -->
  <link rel="preload" as="style" href="/css/styles.css"
        onload="this.rel='stylesheet'" />
  <noscript><link rel="stylesheet" href="/css/styles.css" /></noscript>

  <!-- Fix 2: code-split bundles — vendor cached separately from app code -->
  <script type="module" src="/js/vendor.mjs"></script>
  <script type="module" src="/js/app.mjs"></script>
  <!-- Route-specific chunks loaded via dynamic import() on navigation -->
</head>
<body>
  <!-- Fix 1: single CDN origin — HTTP/2 multiplexing handles all images -->
  <img src="https://cdn.com/hero.avif" />
  <img src="https://cdn.com/bg.avif" />
  <img src="https://cdn.com/logo.svg" />
</body>

<!--
  Fix 4 (server-side): enable HTTP/3 so returning visitors use 0-RTT
  Nginx: listen 443 quic reuseport; add_header Alt-Svc 'h3=":443"; ma=86400';
  Or: use Cloudflare/Vercel which enable HTTP/3 by default
-->`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What HTTP/1.1 optimisation becomes HARMFUL on HTTP/2?',
      options: [
        'Gzip compression',
        'Domain sharding',
        'Browser caching with Cache-Control',
        'Using HTTPS',
      ],
      answer: 1,
      explanation: 'Domain sharding (splitting resources across multiple subdomains) worked on HTTP/1.1 to bypass the 6-connection-per-origin limit. On HTTP/2 it breaks connection coalescing and forces extra TLS handshakes — making performance WORSE.',
    },
    {
      q: 'What is the main advantage of HTTP/3 over HTTP/2?',
      options: [
        'HTTP/3 supports more simultaneous streams',
        'HTTP/3 eliminates TCP head-of-line blocking by using QUIC (UDP-based)',
        'HTTP/3 has better header compression',
        'HTTP/3 works without HTTPS',
      ],
      answer: 1,
      explanation: 'HTTP/2 still uses TCP — a lost packet stalls ALL streams until it is retransmitted. HTTP/3 uses QUIC over UDP where streams are independent — packet loss only affects the one stream it belongs to.',
    },
    {
      q: 'What does 0-RTT mean in the context of HTTP/3?',
      options: [
        'The page loads in zero milliseconds',
        'No round-trips are needed to establish the initial connection',
        'Returning clients can send data in the very first packet by reusing a cached session key',
        'HTTP/3 uses zero TCP round-trips',
      ],
      answer: 2,
      explanation: '0-RTT (zero round-trip time resumption): when a client revisits a site, it reuses TLS session parameters from the previous visit and sends data immediately in the first packet — saving one full network round-trip.',
    },
    {
      q: 'Why is HTTP/2 Server Push largely superseded by Early Hints?',
      options: [
        'Server Push is only supported in Chrome',
        'Server Push ignores the browser cache — it pushes resources even if already cached',
        'Server Push requires HTTP/3',
        'Server Push only works for CSS, not JS or images',
      ],
      answer: 1,
      explanation: 'HTTP/2 Server Push proactively sends resources but cannot know whether the client already has them cached. This wastes bandwidth pushing resources the browser doesn\'t need. 103 Early Hints sends preload hints — the browser checks its cache and only fetches what it is missing.',
    },
    {
      q: 'Which tool shows the HTTP version being used for each resource in Chrome?',
      options: [
        'Elements panel → Computed tab',
        'Network panel → Protocol column (right-click to enable)',
        'Application panel → Storage',
        'Sources panel → Snippets',
      ],
      answer: 1,
      explanation: 'DevTools → Network panel → right-click any column header → enable "Protocol". Each resource shows h2, h3, or http/1.1. h2-push indicates the resource was delivered via HTTP/2 Server Push.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Does HTTP/2 mean I should stop bundling JavaScript altogether?',
      a: 'No — moderate bundling is still beneficial. HTTP/2 multiplexing removes the hard penalty for multiple requests, but per-request overhead (header processing, stream bookkeeping) is still real. The optimal strategy is code splitting by route into chunks of 50–200 KB — not one monolith, but not 500 individual files either.',
    },
    {
      q: 'How do I enable HTTP/3 on my server?',
      a: 'Nginx 1.25.1+ with ngx_http_v3_module: add listen 443 quic reuseport; and add_header Alt-Svc \'h3=":443"; ma=86400\'. Caddy enables HTTP/3 automatically. On managed platforms: Cloudflare, Vercel, and Netlify enable HTTP/3 by default in dashboard settings. Verify with curl --http3 -I https://yoursite.com.',
    },
    {
      q: 'What is connection coalescing in HTTP/2?',
      a: 'If two different hostnames resolve to the same IP address AND share the same TLS certificate, HTTP/2 can reuse a single connection for both — this is coalescing. CDNs use it so requests to cdn.example.com and assets.example.com share one connection. Domain sharding defeats this by forcing separate TLS handshakes.',
    },
    {
      q: 'Is Early Hints (103) widely supported?',
      a: 'As of 2024: Chrome 103+, Firefox 102+, Safari 17.2+. Server support: Cloudflare (all plans), Fastly, AWS CloudFront, and Nginx 1.25.1+. The CDN/proxy must support it — a 103 sent from origin but terminated by a proxy that doesn\'t forward it has no effect.',
    },
    {
      q: 'How much does HTTP/3 actually improve performance in practice?',
      a: 'On fast, stable connections (broadband): 0–5% improvement — TCP HoL blocking rarely manifests. On mobile/lossy connections: 10–20% reduction in median LCP. The 0-RTT feature consistently saves ~150 ms per return visit. Google\'s research showed HTTP/3 reduced tail latency (P95) by 30% for users on poor networks.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'HTTP/2 multiplexes many requests on one TCP connection; HTTP/3 (QUIC) eliminates TCP head-of-line blocking — both make domain sharding and full bundling counterproductive.',
    mustKnow: [
      'HTTP/2: multiplexing, HPACK headers, one TCP connection — no more domain sharding',
      'HTTP/2: domain sharding and over-bundling are now anti-patterns',
      'HTTP/3: QUIC over UDP — packet loss affects only one stream, not all',
      '0-RTT: returning visitors send data in the first packet — saves one round-trip',
      '103 Early Hints: server sends preload headers before 200 — browser fetches assets while server generates HTML',
      'Verify: DevTools Network → Protocol column; curl --http2 / --http3',
    ],
    interviewFocus: [
      'What problems does HTTP/2 solve compared to HTTP/1.1?',
      'Why does domain sharding hurt HTTP/2 performance?',
      'What is 0-RTT and which HTTP version supports it?',
      'Why is Early Hints (103) preferred over HTTP/2 Server Push?',
    ],
  };
}
