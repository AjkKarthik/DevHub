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
