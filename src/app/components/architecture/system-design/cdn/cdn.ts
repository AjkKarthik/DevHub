import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'PoP',                    type: 'keyword', desc: 'Point of Presence — edge server colocated near users. Reduces latency from 150ms to <10ms.' },
  { name: 'Origin pull',            type: 'keyword', desc: 'CDN fetches from origin on cache miss, caches for next requests. Default CDN mode.' },
  { name: 'Origin push',            type: 'keyword', desc: 'You proactively upload content to CDN. Best for known-large or time-sensitive assets.' },
  { name: 'Cache-Control: s-maxage',type: 'keyword', desc: 'CDN cache TTL. Separate from browser max-age. Higher = fewer origin fetches.' },
  { name: 'Origin shield',          type: 'keyword', desc: 'One CDN PoP acts as origin proxy for all others — shields origin from spike traffic.' },
  { name: 'Cache purge / bust',     type: 'keyword', desc: 'Invalidate CDN cache instantly via API. Or version the filename: app.v42.js.' },
  { name: 'stale-while-revalidate', type: 'keyword', desc: 'Serve stale content while fetching fresh in background. Prevents user-visible latency on refresh.' },
  { name: 'Dynamic acceleration',   type: 'keyword', desc: 'CDN routes dynamic requests via optimised backbone. Faster even for uncacheable responses.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Why CDNs matter',
    points: [
      'Cross-continent latency: London to Sydney = ~250ms RTT. CDN edge in Sydney: ~5ms RTT.',
      'Origin offload: 90% cache hit rate means 90% fewer requests reach your servers.',
      'DDoS absorption: CDN edge has massively more bandwidth than any single origin.',
      'CDNs are mandatory for global apps — without one, users on other continents suffer.',
    ],
  },
  {
    heading: 'Origin pull vs push',
    points: [
      'Pull (default): first request to each PoP is a cache miss, fetches from origin. Simple to configure — just set Cache-Control headers.',
      'Push: upload assets to CDN proactively via API. Ideal for software releases, large video files, or content that must be globally available immediately.',
      'Most CDN deployments start with pull (zero config changes to origin) and add push only for specific use cases.',
    ],
  },
  {
    heading: 'Cache-Control header strategy',
    points: [
      'public, max-age=31536000, immutable — versioned static assets (hash in filename). Cached forever.',
      'public, s-maxage=3600, stale-while-revalidate=60 — dynamic content served from CDN but refreshed hourly.',
      'private — user-specific content (auth responses, personalised pages). Never cached by CDN.',
      'no-store — sensitive data (payment confirmations, health records). No caching anywhere.',
    ],
  },
  {
    heading: 'Cache invalidation',
    points: [
      'Versioned filenames: app.abc123.js. Never need to purge — each deploy gets new filename.',
      'API purge: CDN APIs (Cloudflare, Fastly) let you invalidate specific URLs or tags instantly.',
      'Cache tags (surrogate keys): tag cached responses with entity IDs; invalidate all pages containing user:42.',
      'Short TTL + stale-while-revalidate: avoid purging altogether by keeping TTL short and background-revalidating.',
    ],
  },
  {
    heading: 'Cache Invalidation Strategies at the Edge',
    points: [
      'Purge-based invalidation explicitly tells the CDN to evict specific cached objects immediately (via an API call after a content update) — necessary for content that must reflect changes instantly, but purge requests take time to propagate across all global edge locations.',
      'TTL-based expiry (a simple time-to-live on each cached object) is far cheaper operationally than active purging — appropriate for content where brief staleness (seconds to minutes) after an update is acceptable, which covers the vast majority of cacheable web content.',
      'Cache-Control and surrogate-key headers let origin servers express fine-grained invalidation rules — a surrogate key groups related cached objects (all pages referencing a specific product) so a single purge-by-key call invalidates every related cached object at once, rather than purging each URL individually.',
      'Stale-while-revalidate at the edge serves a cached response immediately while asynchronously fetching a fresh copy in the background — giving instant response times even during cache refresh, at the cost of occasionally serving very slightly stale content.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Cache-Control Headers',
    language: 'typescript',
    code: `// Express.js — setting optimal Cache-Control headers

// 1. Static assets with content hash (e.g., built by Webpack/Vite)
app.use('/static', express.static('public', {
  setHeaders: (res, path) => {
    if (path.match(/\\.(?:js|css|woff2|png|jpg)$/)) {
      // Hash in filename → cache forever; versioning via filename
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// 2. HTML pages (contain links to hashed assets)
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=60');
  // Browser: always revalidate (max-age=0)
  // CDN: cache for 1 hour (s-maxage=3600)
  // On CDN cache miss: serve stale for 60s while fetching fresh
  res.sendFile('index.html');
});

// 3. API responses (product data)
app.get('/api/products', (req, res) => {
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=30');
  // CDN caches for 5 minutes; stale ok for 30s more during revalidation
  res.json(products);
});

// 4. User-specific API responses
app.get('/api/me', authenticate, (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  // Never cache — personalised, auth-protected
  res.json(req.user);
});`,
  },
  {
    label: 'CDN Cache Purge (Cloudflare)',
    language: 'bash',
    code: `# Purge specific URLs after a content update

# Purge by URL
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \\
  -H "Authorization: Bearer CF_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  --data '{"files": ["https://example.com/api/products/123", "https://example.com/products"]}'

# Purge by cache tag (requires Cloudflare Enterprise)
# First, set Surrogate-Key header on response:
# Surrogate-Key: product:123 category:electronics
# Then purge all pages tagged with product:123:
curl -X POST ".../purge_cache" \\
  --data '{"tags": ["product:123"]}'

# Purge everything (last resort)
curl -X POST ".../purge_cache" --data '{"purge_everything": true}'

# Better approach: versioned filenames (no purging needed)
# app.abc123def.js → app.xyz789abc.js on new deploy`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Not setting s-maxage separately from max-age',
    wrong: `Cache-Control: max-age=3600
// CDN may respect browser TTL or default to 0 — unpredictable`,
    right: `Cache-Control: public, max-age=60, s-maxage=3600
// Browser caches 60s; CDN caches 3600s independently`,
    explanation: 's-maxage overrides max-age for shared caches (CDNs). Without it, CDN behaviour depends on the vendor\'s default — often not what you intend.',
  },
  {
    title: 'Caching API responses that contain user data',
    wrong: `Cache-Control: public, s-maxage=300
// /api/dashboard returns personalised user data — now cached globally`,
    right: `Cache-Control: private, no-store
// For any response containing user-specific data`,
    explanation: 'Public CDN caching of personalised content causes data leakage — user A sees user B\'s data. Always use "private" for authenticated/personalised responses.',
  },
  {
    title: 'Deploying without cache busting strategy',
    wrong: `// app.js (same filename every deploy)
// Old version cached for 1 year at CDN — users see stale JS`,
    right: `// Use content hash in filename: app.abc123.js
// Or version: app.v42.js
// Or query param: app.js?v=42 (less reliable — some proxies ignore)`,
    explanation: 'If you cache static assets with a long TTL but don\'t change the filename, users get stale JS/CSS after deploy. Content-hashed filenames make this a non-issue.',
  },
  {
    title: 'Forgetting origin shield for high-traffic events',
    wrong: `// CDN configured but no origin shield
// 100 PoPs × 1000 simultaneous cache misses → 100,000 origin requests during event spike`,
    right: `// Enable origin shield: all PoPs funnel cache misses through one shield PoP
// 100 PoPs → 1 shield PoP → origin
// Origin sees 1 request instead of 100,000`,
    explanation: 'Without origin shield, a cache miss storm from a viral event or scheduled broadcast can overwhelm the origin. Shield coalesces misses to a single origin request per cache key.',
  },
];

const challenge: Challenge = {
  title: 'Design CDN strategy for a global SaaS product',
  language: 'typescript',
  description: `Design the CDN architecture for a B2B SaaS dashboard serving 2M users across 6 continents.

Assets to handle:
1. React SPA bundle (10 MB, deployed monthly)
2. Product logos and images (varies by tenant, updated infrequently)
3. Dashboard API (/api/dashboard — personalised, auth-required)
4. Public pricing page (/pricing — same for all users)
5. PDF exports (generated on-demand, 5-50 MB, unique per user)

For each asset type, specify:
- Cache-Control headers
- Cache invalidation strategy
- Origin pull vs push`,
  hints: [
    'SPA bundle: hash in filename → max-age=1y immutable',
    'Tenant logos: moderate TTL + purge on update via CDN API',
    'Dashboard API: private — never cache at CDN',
    'Pricing page: public, long TTL; purge when pricing changes',
    'PDF exports: do not cache at CDN (too large, too unique)',
  ],
  starterCode: `interface CDNConfig {
  asset: string;
  cacheControl: string;
  invalidationStrategy: string;
  pullOrPush: 'pull' | 'push' | 'none';
}

const configs: CDNConfig[] = [];`,
  solution: `const configs: CDNConfig[] = [
  {
    asset: 'React SPA bundle (app.abc123.js)',
    cacheControl: 'public, max-age=31536000, immutable',
    invalidationStrategy: 'Content-hashed filename — no purge needed; new deploy = new filename',
    pullOrPush: 'pull',
  },
  {
    asset: 'Tenant logos/images',
    cacheControl: 'public, s-maxage=86400, stale-while-revalidate=3600',
    invalidationStrategy: 'CDN API purge on upload; optionally tag with tenant:ID for bulk purge',
    pullOrPush: 'pull',
  },
  {
    asset: 'Dashboard API (/api/dashboard)',
    cacheControl: 'private, no-store',
    invalidationStrategy: 'N/A — never cached at CDN (user-specific, auth-required)',
    pullOrPush: 'none',
  },
  {
    asset: 'Public pricing page',
    cacheControl: 'public, s-maxage=3600, stale-while-revalidate=300',
    invalidationStrategy: 'API purge when pricing changes (rare); stale-while-revalidate handles gradual refresh',
    pullOrPush: 'pull',
  },
  {
    asset: 'PDF exports (user-generated)',
    cacheControl: 'private, no-store',
    invalidationStrategy: 'N/A — unique per user+timestamp, do not cache at CDN. Serve from S3 signed URL directly.',
    pullOrPush: 'none',
  },
];`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which Cache-Control directive sets a different TTL for CDN vs browser?',
    options: ['max-age', 'stale-while-revalidate', 's-maxage', 'no-cache'],
    answer: 2,
    explanation: 's-maxage applies to "shared caches" (CDNs, proxies) and overrides max-age for them. The browser uses max-age; the CDN uses s-maxage. This lets you cache longer at the CDN while keeping browser cache short.',
  },
  {
    q: 'What is an origin shield in a CDN architecture?',
    options: ['A firewall protecting the origin server', 'A CDN PoP that acts as a single proxy for all other PoPs to the origin', 'A backup origin server', 'SSL certificate pinning'],
    answer: 1,
    explanation: 'Origin shield coalesces cache-miss requests from multiple edge PoPs into one request to the origin. This reduces origin load by a factor equal to the number of active PoPs.',
  },
  {
    q: 'What is the best cache invalidation strategy for static JS/CSS assets?',
    options: ['Short TTL (60s)', 'CDN API purge on deploy', 'Content-hashed filenames with immutable long TTL', 'stale-while-revalidate'],
    answer: 2,
    explanation: 'Content-hashed filenames (app.abc123.js) mean the URL changes on every deploy — no purging needed. Set max-age=31536000, immutable. This is the most reliable strategy.',
  },
  { q: 'What is the difference between CDN pull and push zones?', options: ['Pull CDN serves static files only; push CDN serves dynamic content', 'Pull CDN fetches content from origin on first request and caches it; push CDN requires you to proactively upload content to edge nodes', 'Pull CDN is faster than push CDN for all content types', 'Push CDN is only available for video streaming use cases'], answer: 1, explanation: 'Pull CDN: the edge node fetches content from your origin server the first time a user requests it, then caches it for future requests. Simple to set up but first-request latency equals origin latency. Good for content with unknown access patterns. Push CDN: you proactively upload content to edge nodes before users request it. First-request latency is low because content is pre-distributed. Good for large static assets like software releases or video files where you know content will be heavily accessed before you publish it.' },
  { q: 'How does a CDN handle cache invalidation for updated content?', options: ['CDNs poll the origin for changes every second to detect updates', 'Cache is invalidated via TTL expiry, origin Cache-Control headers, or explicit purge API calls to edge nodes', 'CDN content is permanent and cannot be invalidated once cached', 'CDNs use ETags to automatically detect changes and re-fetch updated content in real time'], answer: 1, explanation: 'CDN cache invalidation works through: (1) TTL expiry: content is automatically evicted after the Cache-Control max-age value. Short TTLs allow rapid updates but increase origin load. (2) Versioned URLs: append a content hash to filenames like app.abc123.js; when content changes, the URL changes and the old cached version becomes irrelevant automatically. (3) Purge API: CDN providers offer APIs to explicitly invalidate specific URLs or URL patterns immediately. Versioned URLs are preferred for static assets because they avoid the need for active purging and enable infinite TTLs.' },
  { q: 'What is anycast routing and how do CDNs use it?', options: ['Anycast assigns a unique IP to each CDN edge node for direct routing', 'Anycast advertises the same IP prefix from multiple geographic locations; users are routed to the nearest one automatically', 'Anycast is a CDN feature for routing around congested network paths', 'Anycast requires the client to know the IP address of the nearest edge node'], answer: 1, explanation: 'Anycast routing allows multiple geographically distributed CDN edge nodes to advertise the same IP address block. Internet routing protocols like BGP automatically route client traffic to the nearest advertiser based on hop count and network topology. The client resolves the CDN domain to the anycast IP, and network routers direct the request to the closest edge node without the client needing any awareness of the distribution. Anycast provides both low latency via geographic proximity and high availability via automatic failover to the next-nearest edge if one goes down.' },
];

const qna: QnaItem[] = [
  {
    q: 'Should dynamic API responses ever be cached at the CDN?',
    a: 'Yes, when the data is public and changes infrequently — product catalogs, public pricing, blog posts. Use s-maxage + stale-while-revalidate with short enough TTL to bound staleness. Never cache authenticated or user-specific responses at the CDN.',
  },
  {
    q: 'How does a CDN help with DDoS attacks?',
    a: 'CDN PoPs have massive aggregate bandwidth (Cloudflare: 100+ Tbps). They absorb volumetric attacks at the edge before packets reach your origin. They also provide IP reputation filtering, rate limiting, and WAF (Web Application Firewall) that can block application-layer attacks.',
  },
  { q: 'How do you serve personalized content via a CDN that normally caches identical responses?', a: 'Several patterns allow CDN caching of personalized content: edge-side includes split the page into cacheable layout fragments and a small non-cacheable personalized section fetched separately from the origin. Vary headers tell the CDN to cache separate versions of a response per header value like Accept-Language or a user segment cookie, enabling geo- or segment-specific caching. Stale-while-revalidate serves cached content immediately while fetching a fresh version in the background, allowing short TTLs without latency cost. For highly personalized content that cannot be cached at all, use the CDN only for TLS termination and TCP optimization while passing requests to origin, reducing latency through network proximity even without caching.' },
  { q: 'What is CDN origin shield and when is it useful?', a: 'Origin shield is an intermediate caching layer placed between CDN edge nodes and your origin server. Without origin shield, each of dozens of edge nodes independently fetches from origin on a cache miss, multiplying origin load. With origin shield, all edge nodes that miss the cache forward requests to a single regional shield node rather than directly to origin. The shield node aggregates these requests and makes far fewer requests to origin. This significantly reduces origin load for popular content and improves cache fill efficiency. Use it when your origin has limited capacity, when cache-miss traffic patterns cause origin overload, or when you want to minimize egress costs from your data center.' },
  { q: 'How do you handle geographic content restrictions via CDN?', a: 'CDN geo-restriction (geoblocking) allows serving different content or blocking access based on the user IP address geographic location. The CDN uses IP geolocation databases to determine the country and applies rules to redirect, block, or serve alternative content. Use cases: serve different video catalogs per country due to licensing restrictions, block access from sanctioned countries, show region-appropriate pricing or language without a redirect. Implement geo-targeting by returning a redirect to a country-specific subdomain, or by passing the detected country as a header to the origin so it can serve region-specific content. Be aware that VPN users can circumvent IP-based geolocation.' },
  { q: 'What are core metrics to monitor for CDN performance?', a: 'Key CDN metrics: cache hit ratio is the fraction of requests served from cache versus forwarded to origin; target 90%+ for static assets. Origin offload percentage measures how much traffic the CDN absorbed versus your origin. Edge latency measures time-to-first-byte at the edge for cache hits. Origin fetch latency measures how long cache misses wait for origin. Error rate by status code identifies configuration problems or origin outages. Bandwidth served from edge versus from origin drives cost analysis. Top uncached URLs help identify content that should be cached but is not, due to response headers or URL variability that defeats cache key matching.' },
];

const revision: RevisionSummary = {
  oneLiner: 'CDN = edge cache near users. s-maxage for CDN TTL; content-hashed filenames for zero-purge static assets; private for user-specific data.',
  mustKnow: [
    'PoP: edge server near users; reduces latency from 150ms to <10ms',
    'Cache-Control: public, s-maxage=N for CDN; private for user data',
    'Origin pull (default) vs origin push (large/pre-known content)',
    'Origin shield: all PoPs funnel misses through one proxy',
    'Cache busting: content-hashed filenames (no purge) vs API purge',
    'stale-while-revalidate: serve stale while fetching fresh — no user latency',
  ],
  interviewFocus: [
    'State cache-control strategy for each asset type in your design',
    'Distinguish s-maxage (CDN) from max-age (browser)',
    'Mention origin shield for high-traffic events',
    'Explain why personalised/auth responses must use private, no-store',
  ],
};

@Component({
  selector: 'app-sysdesign-cdn',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './cdn.html',
  styleUrl: './cdn.scss',
})
export class SysdesignCdn {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
