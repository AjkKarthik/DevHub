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
