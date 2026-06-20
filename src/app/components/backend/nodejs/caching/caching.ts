import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-node-caching',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './caching.html',
  styleUrl: './caching.scss'
})
export class NodeCaching {
  quickRef: QuickRefItem[] = [
    { name: 'redis.set(key, value, { EX })', type: 'method', desc: 'Store a value with TTL in seconds. EX sets expiry time.' },
    { name: 'redis.get(key)', type: 'method', desc: 'Retrieve cached value. Returns null if missing or expired.' },
    { name: 'redis.del(key)', type: 'method', desc: 'Invalidate one cache entry. Use pattern scan + del for bulk invalidation.' },
    { name: 'Cache-aside', type: 'keyword', desc: 'Check cache first; on miss, load from DB, store in cache, return. Most common pattern.' },
    { name: 'Write-through', type: 'keyword', desc: 'Write to cache and DB simultaneously on every update. Cache always consistent.' },
    { name: 'TTL (Time To Live)', type: 'keyword', desc: 'Expiry time for cached data. Balance freshness vs DB load.' },
    { name: 'Cache stampede', type: 'keyword', desc: 'Many concurrent misses all hit DB simultaneously. Fix: probabilistic early expiry or locking.' },
    { name: 'node-cache', type: 'keyword', desc: 'In-memory cache library for single-process Node.js apps. No external dependency.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Caching Patterns',
      points: [
        'Cache-aside (lazy loading): check cache first → on miss, fetch from DB → store in cache → return. The cache is populated on demand. Data can be stale for the TTL duration. Most flexible: cache only what is actually requested.',
        'Write-through: on every DB write, also write the cache. Cache is always consistent with the DB — no stale data after writes. More DB write overhead, but reads are always fresh. Use when read freshness is critical.',
        'Write-behind (write-back): write to cache first, persist to DB asynchronously. Lower write latency, but risk of data loss if the cache dies before persisting. Used for high-throughput write scenarios where some loss is acceptable.',
        'Read-through: cache layer sits in front of DB and loads data automatically on miss. Application talks only to cache. Works well with purpose-built cache layers (Varnish for HTTP, Redis with Redis Stack). Less common in Node.js application code.',
      ]
    },
    {
      heading: 'Redis as a Caching Layer',
      points: [
        'Redis is an in-memory data structure store. Sub-millisecond reads make it ideal for caching. Key features: TTL (automatic expiry), atomic operations, pub/sub, Lua scripting, persistence options (RDB snapshots, AOF append-only log).',
        'Serialize complex objects to JSON: redis.set("user:123", JSON.stringify(user), { EX: 300 }). Deserialize on get: JSON.parse(await redis.get("user:123")). For numeric values, use redis.incr/decr for atomic counter operations.',
        'Key naming: use structured keys like entity:id:field (user:123:profile) for easy pattern scanning. redis.scan("0", { MATCH: "user:123:*" }) returns all keys for a user. Avoid unbounded KEYS command in production — it blocks Redis.',
        'Redis Cluster shards data across nodes. Data for one key always goes to the same shard (deterministic hashing). Use hash tags {user}.profile to co-locate related keys on the same shard when atomic multi-key operations are needed.',
      ]
    },
    {
      heading: 'Cache Invalidation and Stampede Prevention',
      points: [
        'Cache invalidation is the hardest part of caching ("There are only two hard things in computer science..."). Strategies: TTL-based expiry (simple, may serve stale data), event-driven invalidation (delete on write — consistent), versioned keys (append a version number — old keys expire naturally).',
        'Cache stampede (thundering herd): many concurrent requests all miss the cache simultaneously (e.g. after a cache flush or TTL expiry), all hit the DB at once, overwhelming it. Prevention: probabilistic early expiry (XFetch algorithm), mutex lock (only one process rebuilds), or stale-while-revalidate (serve stale, refresh in background).',
        'Mutex lock pattern: when cache miss occurs, try to acquire a distributed lock (redis.set(lock, 1, { NX: true, EX: 10 })). Only the winner fetches from DB and populates cache. Losers wait and retry until cache is populated.',
        'HTTP caching headers (Cache-Control, ETag, Last-Modified) work at the HTTP layer and are supported by CDNs. For public API responses that rarely change, add Cache-Control: public, max-age=60 to cache at the CDN edge — zero DB load.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Cache-aside with Redis',
      language: 'typescript',
      code: `import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

// Cache-aside pattern with typed helper
async function withCache(key, ttlSeconds, fetchFn) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const data = await fetchFn();
  await redis.set(key, JSON.stringify(data), { EX: ttlSeconds });
  return data;
}

// Usage: cache user for 5 minutes
app.get('/users/:id', async (req, res) => {
  const key = \`user:\${req.params.id}\`;
  const user = await withCache(key, 300, () => db.users.findById(req.params.id));
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

// Invalidate on update
app.put('/users/:id', async (req, res) => {
  const user = await db.users.update(req.params.id, req.body);
  await redis.del(\`user:\${req.params.id}\`);   // invalidate cache
  res.json(user);
});

// Cache a list with tags for batch invalidation
app.get('/products', async (req, res) => {
  const key = \`products:list:\${JSON.stringify(req.query)}\`;
  const products = await withCache(key, 60, () => db.products.findMany(req.query));
  res.json(products);
});
// On product update: invalidate all list caches
async function invalidateProductLists() {
  let cursor = 0;
  do {
    const { cursor: next, keys } = await redis.scan(cursor, { MATCH: 'products:list:*', COUNT: 100 });
    if (keys.length) await redis.del(keys);
    cursor = next;
  } while (cursor !== 0);
}`
    },
    {
      label: 'Stampede prevention + HTTP caching',
      language: 'typescript',
      code: `// Mutex lock to prevent cache stampede
async function withMutexCache(key, ttl, fetchFn) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const lockKey   = \`lock:\${key}\`;
  const acquired  = await redis.set(lockKey, '1', { NX: true, EX: 10 }); // 10s lock TTL

  if (acquired) {
    // We won the lock — fetch and populate
    try {
      const data = await fetchFn();
      await redis.set(key, JSON.stringify(data), { EX: ttl });
      return data;
    } finally {
      await redis.del(lockKey);
    }
  } else {
    // Lost the lock — poll until cache is populated
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 100));
      const result = await redis.get(key);
      if (result) return JSON.parse(result);
    }
    // Fallback: fetch directly
    return fetchFn();
  }
}

// HTTP caching headers for public API responses
app.get('/public/stats', async (req, res) => {
  const stats = await withCache('public:stats', 60, () => db.computeStats());

  res.set({
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
    'ETag': \`"\${hashObject(stats)}"\`,
    'Last-Modified': new Date().toUTCString(),
  });

  // Conditional request — return 304 if unchanged
  if (req.headers['if-none-match'] === \`"\${hashObject(stats)}"\`) {
    return res.status(304).end();
  }
  res.json(stats);
});`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Caching user-specific data without a user key',
      wrong: `await redis.set('user-profile', JSON.stringify(profile), { EX: 300 });
// User B gets User A's profile!`,
      right: `await redis.set(\`user:\${userId}:profile\`, JSON.stringify(profile), { EX: 300 });`,
      explanation: 'Cache keys must uniquely identify the data they represent. Without the userId, all users share one cache entry — user B sees user A\'s profile. Always include all parameters that affect the result (userId, filters, pagination) in the key.'
    },
    {
      title: 'Using KEYS command in production',
      wrong: `const keys = await redis.keys('user:*'); // blocks Redis — all operations pause`,
      right: `let cursor = 0;
do {
  const { cursor: next, keys } = await redis.scan(cursor, { MATCH: 'user:*', COUNT: 100 });
  // process keys batch
  cursor = next;
} while (cursor !== 0); // non-blocking iteration`,
      explanation: 'KEYS is O(N) and blocks the entire Redis event loop while scanning. On a large keyspace, this can freeze Redis for seconds. SCAN is non-blocking, iterates in batches, and is safe in production.'
    },
    {
      title: 'Not handling cache failures gracefully',
      wrong: `const cached = await redis.get(key); // throws if Redis is down — crashes request
const data = cached ? JSON.parse(cached) : await db.fetch();`,
      right: `let cached = null;
try { cached = await redis.get(key); } catch { /* Redis down — fall through to DB */ }
const data = cached ? JSON.parse(cached) : await db.fetch();`,
      explanation: 'The cache is an optimization layer, not a critical dependency. If Redis goes down, the app should degrade gracefully to fetching from the DB. Wrap Redis calls in try/catch and treat failures as cache misses.'
    },
    {
      title: 'Setting TTL too long for frequently updated data',
      wrong: `await redis.set('product:123', JSON.stringify(product), { EX: 86400 }); // 24h TTL`,
      right: `// Short TTL for frequently updated data
await redis.set('product:123', JSON.stringify(product), { EX: 60 }); // 60s
// OR: write-through — invalidate on update
await redis.del('product:123');`,
      explanation: 'A 24-hour TTL for product data means price changes and inventory updates are stale for up to 24 hours. Either use a short TTL matching your acceptable staleness, or implement event-driven invalidation (delete cache when the underlying data changes).'
    },
  ];

  challenge: Challenge = {
    title: 'Caching Service with Stampede Protection',
    language: 'typescript',
    description: 'Build a CacheService class wrapping Redis with: get(key), set(key, value, ttl), del(key), and getOrSet(key, ttl, fetchFn) that implements cache-aside with stampede protection using a distributed mutex lock. The getOrSet method should only call fetchFn once even under concurrent misses.',
    hints: [
      'Mutex: redis.set(lockKey, "1", { NX: true, EX: 10 }) returns "OK" if acquired, null if not',
      'Losers: poll with short delay until cache is populated or lock is released',
      'Always release lock in finally block to avoid deadlock',
    ],
    starterCode: `import { createClient } from 'redis';

class CacheService {
  constructor(private redis) {}

  async get(key) { /* ... */ }
  async set(key, value, ttl) { /* ... */ }
  async del(key) { /* ... */ }
  async getOrSet(key, ttl, fetchFn) {
    // TODO: cache-aside with mutex lock for stampede prevention
  }
}

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();
export const cache = new CacheService(redis);`,
    solution: `import { createClient } from 'redis';

class CacheService {
  constructor(redis) { this.redis = redis; }

  async get(key) {
    const val = await this.redis.get(key);
    return val ? JSON.parse(val) : null;
  }

  async set(key, value, ttl) {
    await this.redis.set(key, JSON.stringify(value), { EX: ttl });
  }

  async del(key) { await this.redis.del(key); }

  async getOrSet(key, ttl, fetchFn) {
    const cached = await this.get(key);
    if (cached !== null) return cached;

    const lockKey  = \`lock:\${key}\`;
    const acquired = await this.redis.set(lockKey, '1', { NX: true, EX: 10 });

    if (acquired) {
      try {
        const data = await fetchFn();
        await this.set(key, data, ttl);
        return data;
      } finally {
        await this.redis.del(lockKey);
      }
    }

    // Wait for the winner to populate cache
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 100));
      const result = await this.get(key);
      if (result !== null) return result;
    }
    return fetchFn(); // fallback after 3s timeout
  }
}

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();
export const cache = new CacheService(redis);`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the cache-aside (lazy loading) pattern?', options: ['Caching the entire database on startup', 'Check cache → on miss, fetch from DB, store in cache, return result', 'Caching responses at the CDN level', 'Writing to cache and database simultaneously'], answer: 1, explanation: 'Cache-aside checks the cache first. On a hit, return immediately. On a miss, load from the database, store the result in the cache with a TTL, then return. The cache is populated lazily — only items actually requested are cached.' },
    { q: 'What is a cache stampede and how do you prevent it?', options: ['Cache running out of memory', 'Many concurrent requests all miss and hit the DB simultaneously after cache expiry — prevented by mutex locking or probabilistic early expiry', 'A cache that returns wrong data', 'Redis crashing under high load'], answer: 1, explanation: 'When a popular cache entry expires, multiple concurrent requests all miss simultaneously and all try to rebuild the cache from the DB, causing a spike in DB load. Prevention: mutex lock (only one rebuilds, others wait), stale-while-revalidate, or XFetch algorithm (probabilistic early refresh before expiry).' },
    { q: 'Why should you never use KEYS in production Redis?', options: ['KEYS is deprecated in Redis 6', 'KEYS is O(N) and blocks the Redis event loop while scanning — freezes all other operations', 'KEYS does not support glob patterns', 'KEYS requires cluster mode'], answer: 1, explanation: 'Redis is single-threaded. KEYS scans all keys sequentially and blocks the event loop during the scan. On a keyspace with millions of keys, this can freeze Redis for seconds. Use SCAN instead — it iterates in batches and returns control between each batch.' },
    { q: 'What is the difference between write-through and cache-aside caching?', options: ['Write-through is faster for reads', 'Cache-aside populates on read; write-through updates cache and DB on every write', 'Write-through only works with SQL databases', 'Cache-aside requires a cache server'], answer: 1, explanation: 'Cache-aside (lazy): cache populated only when data is first requested. Can serve stale data between TTL refresh. Write-through: cache updated synchronously on every write — always consistent with DB. Write-through has higher write overhead but eliminates staleness after updates.' },
  ];

  qna: QnaItem[] = [
    { q: 'When should I use in-memory caching (node-cache) vs Redis?', a: 'node-cache: single-process apps, per-request memoization, development. Fast (no network), zero setup, no persistence. Cleared on restart, not shared across processes — if you run 4 Node.js instances, each has its own cache and 4x the DB load. Redis: multi-process or multi-server apps where cache must be shared. Persistent across restarts (with AOF). Supports cache invalidation from any server. Added network latency (~0.5ms) but enables true shared caching at scale.' },
    { q: 'How do I handle cache invalidation for lists and searches?', a: 'Lists are hardest to invalidate because a single item change can affect many list queries. Strategies: (1) Short TTL and accept brief staleness (simple). (2) Cache tags — associate each cache entry with tags (product:123, product-list) and invalidate by tag on update. (3) Event-driven: publish a "product.updated" event and have a cache subscriber invalidate affected keys. (4) Versioned cache keys — append a "version" counter to all list keys; increment the version on updates; old keys expire naturally.' },
    { q: 'How do I cache responses at the HTTP level in Node.js?', a: 'Set Cache-Control headers on responses: Cache-Control: public, max-age=60 allows CDNs and browsers to cache for 60 seconds. For conditional requests, implement ETags: hash the response body, set ETag: "<hash>", check If-None-Match in subsequent requests and return 304 Not Modified if unchanged. Cache-Control: private restricts to browser only (not CDN). Cache-Control: no-store disables all caching. HTTP-level caching is free — the CDN serves requests without hitting your server at all.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Caching reduces DB load. Cache-aside pattern: check Redis → miss → fetch DB → store → return. Invalidate on write. Prevent stampede with mutex locks.',
    mustKnow: [
      'Cache-aside: check cache → miss → DB → store → return.',
      'Write-through: update cache AND DB on every write — always consistent.',
      'TTL balances freshness vs DB load; event-driven invalidation for consistency.',
      'Cache stampede: concurrent misses hit DB simultaneously — prevent with mutex or stale-while-revalidate.',
      'SCAN (not KEYS) for pattern-based iteration in production Redis.',
      'Per-user data needs userId in the cache key — shared key = data leak.',
      'Wrap Redis calls in try/catch — degrade to DB if cache is unavailable.',
    ],
    interviewFocus: [
      'What is cache stampede and how do you prevent it?',
      'When would you use write-through vs cache-aside?',
      'How do you invalidate cache when underlying data changes?',
    ]
  };
}
