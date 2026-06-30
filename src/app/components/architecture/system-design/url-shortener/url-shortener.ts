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
  { name: 'Base62',         type: 'keyword', desc: '[a-zA-Z0-9] — 62 chars. 7-char code = 62^7 = 3.5 trillion unique URLs.' },
  { name: '301 vs 302',     type: 'keyword', desc: '301 Permanent (browser caches, no analytics). 302 Temporary (every redirect tracked).' },
  { name: 'Collision',      type: 'keyword', desc: 'Two long URLs map to same short code. Detect via DB unique constraint + retry.' },
  { name: 'Custom alias',   type: 'keyword', desc: 'User-chosen short code (e.g. /promo2024). Stored alongside auto-generated codes.' },
  { name: 'Expiry',         type: 'keyword', desc: 'TTL on shortened URL. Expired codes return 404 or 410 Gone.' },
  { name: 'Analytics',      type: 'keyword', desc: 'Click tracking: IP, user-agent, referer, timestamp written async to event store.' },
  { name: 'Bloom filter',   type: 'keyword', desc: 'Check if code is definitely unused before DB lookup — reduces DB reads on write path.' },
  { name: 'Rate limiting',  type: 'keyword', desc: 'Limit URL creation per IP/user to prevent spam and abuse.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Core requirements and scale',
    points: [
      'Write: shorten a long URL → return short code. Read: resolve short code → redirect to long URL.',
      'Scale: 100M URLs created/day = ~1,200 writes/s; 10B redirects/day = ~115,000 reads/s.',
      'Read:write ratio is ~100:1 — heavily read-optimised system.',
      'Storage: 100M URLs/day × 365 days × 5 years × 500 bytes = ~90 TB total over 5 years.',
    ],
  },
  {
    heading: 'Short code generation',
    points: [
      'MD5 hash long URL → take first 7 chars of Base62-encoded hash. Risk: collisions.',
      'Auto-increment ID → Base62 encode. Simple, no collisions, but predictable (enumerable).',
      'Random 7-char Base62: 62^7 = 3.5 trillion codes, negligible collision at 100M/day scale.',
      'Pre-generate codes: background job writes codes to a "codes" table; pop one per creation request.',
    ],
  },
  {
    heading: 'Redirect and caching',
    points: [
      '302 (Temporary Redirect): browser does not cache — every click hits your server for analytics.',
      '301 (Permanent Redirect): browser caches — server never sees repeat clicks — analytics blind.',
      'Use 302 for analytics; use 301 only for static links where you never need click data.',
      'Cache hot URLs in Redis: GET short-code → long-URL; TTL=1h. 80% of traffic = top 20% of URLs.',
    ],
  },
  {
    heading: 'Analytics pipeline',
    points: [
      'Synchronous analytics kills redirect latency. Write analytics events async via Kafka.',
      'Click event: short_code, timestamp, ip, user_agent, referer, country (GeoIP lookup).',
      'Consumer aggregates: clicks/hour, unique visitors, top referrers — written to ClickHouse or BigQuery.',
      'Dashboard queries ClickHouse — never the operational DB.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Core Design',
    language: 'typescript',
    code: `// URL Shortener — core components

const BASE62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// Encode a numeric ID to Base62
function toBase62(id: number): string {
  if (id === 0) return BASE62[0];
  let result = '';
  while (id > 0) {
    result = BASE62[id % 62] + result;
    id = Math.floor(id / 62);
  }
  return result.padStart(7, BASE62[0]);  // 7 chars = 3.5T unique codes
}

// CREATE short URL
async function shorten(longUrl: string, customAlias?: string): Promise<string> {
  // 1. Validate URL
  new URL(longUrl);  // throws if invalid

  // 2. Rate limit (10 creations/min per IP)
  await rateLimiter.check(getClientIp());

  // 3. Check if long URL already shortened (idempotent)
  const existing = await db.query('SELECT code FROM urls WHERE long_url = ?', [longUrl]);
  if (existing) return \`https://sho.rt/\${existing.code}\`;

  // 4. Generate code
  const code = customAlias ?? toBase62(await nextId());

  // 5. Insert with unique constraint — retry on collision
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await db.run('INSERT INTO urls (code, long_url, created_at) VALUES (?, ?, NOW())',
        [code, longUrl]);
      return \`https://sho.rt/\${code}\`;
    } catch (e: any) {
      if (e.code !== 'ER_DUP_ENTRY') throw e;
      // collision — try a different code
    }
  }
  throw new Error('Failed to generate unique code');
}

// RESOLVE redirect
async function resolve(code: string): Promise<string> {
  // 1. Check Redis cache first
  const cached = await redis.get(\`url:\${code}\`);
  if (cached) {
    publishClickEvent(code);  // async, non-blocking
    return cached;
  }

  // 2. DB lookup
  const row = await db.query('SELECT long_url, expires_at FROM urls WHERE code = ?', [code]);
  if (!row) throw new NotFoundError();
  if (row.expires_at && row.expires_at < new Date()) throw new GoneError();

  // 3. Cache result
  await redis.setEx(\`url:\${code}\`, 3600, row.long_url);
  publishClickEvent(code);
  return row.long_url;
}`,
  },
  {
    label: 'Analytics Pipeline',
    language: 'typescript',
    code: `// Async click analytics — does not block redirect latency

// Producer (in redirect handler):
function publishClickEvent(code: string): void {
  // Fire-and-forget — never await on the redirect path
  kafka.produce('url-clicks', {
    key: code,
    value: JSON.stringify({
      code,
      timestamp: Date.now(),
      ip: getClientIp(),
      userAgent: getHeader('user-agent'),
      referer: getHeader('referer'),
    }),
  }).catch(err => logger.error('Click event failed', err));
}

// Consumer (separate service):
kafka.consume('url-clicks', async (event) => {
  const click = JSON.parse(event.value);
  const country = await geoIp.lookup(click.ip);  // MaxMind or ip-api

  // Batch insert to ClickHouse (columnar — fast aggregations)
  await clickhouse.insert('clicks', {
    code: click.code,
    ts: click.timestamp,
    country,
    ua_category: parseUserAgent(click.userAgent),  // desktop/mobile/bot
    referer_domain: extractDomain(click.referer),
  });
});

// Analytics query (ClickHouse — sub-second on billions of rows):
// SELECT
//   toStartOfHour(ts) AS hour,
//   count() AS clicks,
//   uniq(ip) AS unique_visitors
// FROM clicks
// WHERE code = 'abc1234' AND ts >= now() - INTERVAL 7 DAY
// GROUP BY hour ORDER BY hour`,
  },
  {
    label: 'System Architecture',
    language: 'bash',
    code: `# URL Shortener — full system architecture

# Tier 1: API Layer
# 2 endpoints:
#   POST /shorten  { url, customAlias?, expiresAt? }  → { shortUrl }
#   GET  /:code                                        → 302 redirect

# Tier 2: Storage
# PostgreSQL (primary):
#   urls (code VARCHAR(10) PK, long_url TEXT, created_at, expires_at, user_id)
#   CREATE UNIQUE INDEX idx_long_url ON urls (MD5(long_url));  -- dedup
#
# Redis:
#   Key: url:<code>  Value: long_url  TTL: 3600s
#   Key: rate:<ip>:<minute>  Value: count  TTL: 60s

# Tier 3: Analytics
# Kafka topic: url-clicks (partitioned by code for ordering)
# ClickHouse: clicks table, partitioned by day
# Grafana dashboard: connects to ClickHouse

# Scale numbers at 115k redirect/s:
# Redis: single node handles 500k ops/s — redirect path fits in memory cache
# DB: only cache misses hit DB; ~2-5% miss rate = 2,300–5,750 DB reads/s → 5 read replicas

# Sharding (at extreme scale):
# Shard URLs table by hash(code) across 8 shards
# Redis cluster: 6 nodes (3 primary + 3 replica), hash slot sharding`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using 301 redirect (losing analytics)',
    wrong: `// 301 Permanent Redirect — browser caches it
res.redirect(301, longUrl);
// After first click: browser never hits server again
// Analytics: 0 repeat clicks recorded — data is blind`,
    right: `// 302 Temporary Redirect — server sees every click
res.redirect(302, longUrl);
// Every click tracked: timestamp, IP, referer, user-agent
// Use 301 only for permanent aliases where analytics are not needed`,
    explanation: 'Once a browser receives a 301, it caches the redirect permanently and never calls your server for repeat visits. You lose all analytics for returning visitors. Use 302 for trackable short links.',
  },
  {
    title: 'Synchronous analytics blocking redirect',
    wrong: `// Analytics written synchronously on redirect path
const redirect = async (code: string) => {
  const url = await db.query('SELECT long_url ...');
  await analyticsDb.insert({ code, timestamp, ip });  // 50ms
  await geoIp.lookup(ip);  // 80ms
  res.redirect(302, url);  // total: 150ms latency
};`,
    right: `// Analytics async — redirect is instant
const redirect = async (code: string) => {
  const url = await redis.get(\`url:\${code}\`);  // 1ms
  kafka.produce('url-clicks', event).catch(log);  // fire-and-forget
  res.redirect(302, url);  // total: ~2ms latency
};`,
    explanation: 'Writing analytics synchronously on the redirect path adds 100-200ms latency for every click. Redirect latency is user-visible. Fire-and-forget to Kafka makes redirect sub-5ms; analytics consumers process asynchronously.',
  },
  {
    title: 'Not deduplicating the same long URL',
    wrong: `// Same URL shortened twice → two different codes
// POST /shorten { url: "https://example.com" } → abc1234
// POST /shorten { url: "https://example.com" } → xyz9876
// Analytics split between two codes — confusing`,
    right: `// Check if long URL already exists before inserting:
const existing = await db.query(
  'SELECT code FROM urls WHERE MD5(long_url) = MD5(?)', [longUrl]
);
if (existing) return \`https://sho.rt/\${existing.code}\`;
// Same long URL always returns same short code`,
    explanation: 'Without deduplication, the same long URL gets multiple short codes — analytics are fragmented. Index on MD5(long_url) for efficient lookup without indexing a potentially huge TEXT column.',
  },
  {
    title: 'Predictable sequential codes (security)',
    wrong: `// Auto-increment: URL #1000 → "0000G8" → URL #1001 → "0000G9"
// Attacker enumerates: curl https://sho.rt/0000G{0..Z}
// Exposes all shortened URLs including private/sensitive ones`,
    right: `// Random Base62 code: no pattern, not enumerable
const code = randomBytes(6).toString('base64url').slice(0, 7);
// Or: hash(longUrl + salt) → Base62(first 7 chars)
// Collision probability at 100M URLs: 1 - e^(-100M^2 / 2 × 62^7) ≈ negligible`,
    explanation: 'Sequential codes are enumerable — anyone can iterate through all codes and harvest the long URLs. Use random codes or hash-based codes to prevent enumeration attacks.',
  },
];

const challenge: Challenge = {
  title: 'Estimate URL shortener capacity',
  language: 'typescript',
  description: `Capacity estimation for a URL shortener at Twitter scale.

Given:
- 500M tweets/day, 10% contain links = 50M shortened URLs/day
- Each short link clicked average 100 times over its lifetime
- 5-year data retention

Calculate:
1. Write QPS (URL creation)
2. Read QPS (redirects)
3. Storage for 5 years
4. Redis memory for hot URLs (80/20 rule)
5. DB read replica count needed`,
  hints: [
    '50M/day = 50M / 86400 = ~578 writes/s',
    '50M URLs × 100 clicks each = 5B clicks/day → ~57,870 reads/s',
    'Each URL row: ~500 bytes (code + long URL + metadata)',
    'Hot 20% of URLs = 10M URLs; each 500 bytes in Redis = 5 GB',
  ],
  starterCode: `// Fill in the calculations:
const URLS_PER_DAY = 50_000_000;
const CLICKS_PER_URL = 100;
const RETENTION_YEARS = 5;
const BYTES_PER_URL = 500;

const writeQps = /* ? */;
const readQps = /* ? */;
const totalUrls = /* ? */;
const storageBytes = /* ? */;
const redisMemoryBytes = /* ? */;`,
  solution: `const URLS_PER_DAY = 50_000_000;
const CLICKS_PER_URL = 100;
const RETENTION_YEARS = 5;
const BYTES_PER_URL = 500;
const SECONDS_PER_DAY = 86_400;

const writeQps = URLS_PER_DAY / SECONDS_PER_DAY;
// = 578 writes/second → round to 600 with headroom

const totalClicksPerDay = URLS_PER_DAY * CLICKS_PER_URL / RETENTION_YEARS / 365;
// Spread over lifetime; peak day = 50M × 100 / 365 = 13.7M clicks/day
const readQps = 13_700_000 / SECONDS_PER_DAY;
// = ~158 reads/s average; peak 10× = ~1,580 reads/s — Redis handles easily

const totalUrls = URLS_PER_DAY * 365 * RETENTION_YEARS;
// = 50M × 1825 = 91.25 billion URLs (extreme!) — would need sharding

const storageBytes = totalUrls * BYTES_PER_URL;
// = 91.25B × 500 = 45.6 TB — distributed DB needed at this scale

// Hot URLs (80/20: top 20% of URLs get 80% of traffic):
const hotUrls = totalUrls * 0.20;  // 18.25B — too many for Redis
// In practice: cache top daily URLs only = 50M × 0.20 = 10M URLs
const redisMemoryBytes = 10_000_000 * BYTES_PER_URL;
// = 5 GB — fits in a single Redis node easily

// DB reads: ~80% served from Redis cache → 20% hit DB
// DB reads/s = 158 × 0.20 = 31.6 reads/s → 1-2 read replicas sufficient`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Why use 302 (not 301) for a URL shortener?',
    options: [
      '302 is faster than 301',
      '301 causes browsers to cache the redirect permanently, losing analytics data',
      '302 supports longer URLs',
      '301 is deprecated in HTTP/2',
    ],
    answer: 1,
    explanation: 'A 301 tells browsers to cache the redirect permanently — repeat visitors never call your server, so you lose all click tracking. 302 (Temporary) ensures every click hits your server for analytics recording.',
  },
  {
    q: 'A 7-character Base62 code provides how many unique values?',
    options: ['62 million', '3.5 trillion', '26 billion', '1 billion'],
    answer: 1,
    explanation: '62^7 = 3,521,614,606,208 ≈ 3.5 trillion. At 50M URLs/day, this lasts 192 years before exhaustion. Practical URL shorteners at scale use 6-8 chars depending on volume.',
  },
  {
    q: 'Which caching strategy best suits the URL redirect read path?',
    options: [
      'Write-through (update cache on every write)',
      'Cache-aside (read from cache, fallback to DB on miss, populate cache)',
      'Write-behind (async DB update after cache write)',
      'No cache — DB handles the load',
    ],
    answer: 1,
    explanation: 'Cache-aside is ideal: check Redis first (1ms), fallback to DB on miss (few % of requests), write result to Redis for future reads. This pattern handles the 100:1 read:write ratio with minimal DB load.',
  },
  { q: 'What HTTP status code should a URL shortener return and why?', options: ['200 OK with the long URL in the response body', '301 Moved Permanently so browsers cache the redirect permanently', '302 Found so analytics can track every click via the shortener server', '404 Not Found for expired or unknown short codes'], answer: 2, explanation: '301 (Moved Permanently) tells browsers and caches to permanently remember the redirect; the browser will go directly to the long URL on subsequent clicks without contacting the shortener, reducing load. 302 (Found) is a temporary redirect that the browser does not cache; every click goes through the shortener, enabling analytics. 307 (Temporary Redirect) is similar to 302 but preserves the HTTP method. For analytics-enabled shorteners, 302 is preferred. For performance-first shorteners with no analytics, 301 reduces server load.' },
  { q: 'What data structure would you use to generate unique short codes at scale?', options: ['Auto-incrementing integers converted to base 62 for a short alphanumeric code', 'A random UUID truncated to 7 characters', 'MD5 hash of the long URL, truncated to 7 characters', 'Sequential alphabetical codes starting from aaaaaaa'], answer: 0, explanation: 'A counter-based approach: maintain a global counter. Convert each counter value to base 62 (a-z, A-Z, 0-9). A 7-character base-62 code gives 62^7 = 3.5 trillion unique URLs, sufficient for virtually any scale. Problem: a single global counter is a bottleneck. Solutions: pre-allocate ranges to each application server (range-based ID generation). Alternative: random codes with collision checking are simpler to implement but require a uniqueness check on every insert. Another option: Snowflake-style IDs that encode timestamp and machine ID, guaranteeing uniqueness without coordination.' },
  { q: 'How do you handle custom aliases and expiration in a URL shortener?', options: ['Custom aliases are not possible in a production URL shortener', 'Store custom aliases in the same table as auto-generated codes and check for uniqueness at creation time; add an expires_at column and filter or delete expired entries', 'Custom aliases require a separate database table to avoid conflicts with generated codes', 'Expiration is handled by returning 404 for all URLs older than 30 days'], answer: 1, explanation: 'Custom aliases: allow users to specify the desired short code instead of an auto-generated one. Check for uniqueness in the URL mapping table before inserting. Rate limit custom alias creation to prevent abuse. Expiration: add an expires_at column to the URL table. At redirect time, check if the URL has expired and return 410 (Gone) if so. Use a background job to delete expired entries periodically rather than checking on every request. For analytics, consider soft-deleting to preserve click count history even after expiration.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do you handle custom aliases that conflict with auto-generated codes?',
    a: 'Store both custom and generated codes in the same urls table with a unique constraint on code. When a user requests a custom alias, attempt the INSERT — if it conflicts with an existing code, return an error "alias already taken." Reserve a namespace for system codes (e.g. always prefix custom aliases with a user-visible pattern, or restrict custom alias characters to avoid clashing with Base62 auto-codes).',
  },
  {
    q: 'How do you expire URLs and reclaim short codes?',
    a: 'Store expires_at on each URL row. On redirect, check expiry and return 410 Gone if expired. A background job runs nightly: DELETE FROM urls WHERE expires_at < NOW() AND created_at < NOW() - INTERVAL 30 DAY (grace period). Deleted codes are returned to an available pool. For Redis, set TTL equal to expires_at — expired entries evict automatically.',
  },
  { q: 'How do you design the database schema for a URL shortener?', a: 'Minimal schema: a URL table with short_code (varchar, primary key), long_url (varchar), created_at, expires_at (nullable), created_by (user_id, nullable for anonymous), click_count (integer). Index short_code for O(1) redirect lookups. For analytics: a separate Clicks table with click_id, short_code (FK), clicked_at, ip_address, user_agent, referrer. This denormalization allows the URL table to remain small and fast for redirects while analytics queries hit the Clicks table without slowing redirects. At high scale, the Clicks table grows very large; consider partitioning by month or streaming clicks to a data warehouse like BigQuery rather than storing in the primary database.' },
  { q: 'How do you cache redirects for high read performance?', a: 'URL shorteners are extremely read-heavy: each short URL may be clicked millions of times. Cache the short_code to long_url mapping in Redis with a TTL matching the URL expiration. On redirect request: check Redis first (cache hit = serve redirect immediately). On cache miss, query the database and populate the cache. For permanent URLs (no expiration), cache with a long TTL of 24-48 hours. For expiring URLs, set the cache TTL to the remaining time until expiration. For a CDN-fronted shortener, enable HTTP caching headers for 301 redirects so clients and CDN edge nodes cache the redirect without contacting your servers at all, achieving near-zero latency for repeat clicks.' },
  { q: 'How do you prevent abuse and rate limiting in a URL shortener?', a: 'Common abuse patterns: creating millions of short URLs to use as spam redirect chains, using short URLs to obfuscate malicious destinations, and scraping the redirect database by trying sequential codes. Prevention: rate limit URL creation by IP and user account using a token bucket (Redis-based). Require authentication for bulk creation. Scan destination URLs against malware and phishing blocklists (Google Safe Browsing API). Validate that the long URL is a real reachable URL before creating the short link. For sequential code enumeration, use random codes rather than sequential ones, and add CAPTCHA on anonymous creation. Monitor click patterns for suspicious activity like coordinated click fraud from bot IPs.' },
  { q: 'How do you implement analytics for a URL shortener at scale?', a: 'Tracking every click in the primary database does not scale: millions of clicks per second would overload a relational database. Architecture: when a redirect occurs, write the click event asynchronously to a Kafka topic containing short_code, timestamp, IP, user_agent, and referrer. Do not block the redirect response on analytics writes. A stream processor like Flink or Spark Streaming consumes the Kafka topic and aggregates click counts per short_code per time window, writing results to a time-series store or data warehouse. Pre-aggregate hourly, daily, and cumulative counts. The analytics dashboard queries these aggregates, not raw click records. For raw click access, store in a columnar warehouse like BigQuery or Redshift for efficient analytical queries.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Base62(7 chars) = 3.5T codes; 302 for analytics; cache-aside in Redis; async Kafka analytics; deduplicate long URLs.',
  mustKnow: [
    'Base62 encoding: 7 chars = 62^7 = 3.5 trillion unique codes',
    '302 Temporary Redirect: every click tracked; 301 permanent: browser caches, analytics lost',
    'Cache-aside: Redis first → DB fallback → populate Redis; handles 100:1 read ratio',
    'Async analytics: Kafka publish on redirect path (fire-and-forget) → consumer aggregates',
    'Dedup: check if long URL already shortened before creating new code',
    'Random codes: not sequential — prevents enumeration attacks',
  ],
  interviewFocus: [
    'Walk through the shorten + redirect flow with Redis cache',
    'Explain why 302 and why async analytics matter for performance',
    'Capacity estimate: 50M URLs/day → write QPS, storage, Redis memory',
    'How to scale reads: Redis + read replicas + CDN edge caching',
  ],
};

@Component({
  selector: 'app-sysdesign-url-shortener',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './url-shortener.html',
  styleUrl: './url-shortener.scss',
})
export class SysdesignUrlShortener {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
