import { Component } from '@angular/core';
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

@Component({
  selector: 'app-redis-caching-patterns',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './caching-patterns.html',
  styleUrl: './caching-patterns.scss',
})
export class RedisCachingPatterns {
  quickRef: QuickRefItem[] = [
    { name: 'Cache-Aside (Lazy)', type: 'syntax', desc: 'App checks cache → miss → load DB → write to cache' },
    { name: 'Write-Through', type: 'syntax', desc: 'Write to cache and DB synchronously on every update' },
    { name: 'Write-Behind (Write-Back)', type: 'syntax', desc: 'Write to cache only; async flush to DB in background' },
    { name: 'Read-Through', type: 'syntax', desc: 'Cache auto-loads from DB on miss (cache library handles it)' },
    { name: 'Cache Stampede / Dog-pile', type: 'syntax', desc: 'Multiple requests hitting DB simultaneously on cache miss' },
    { name: 'Probabilistic early revalidation', type: 'syntax', desc: 'Refresh cache before TTL expires to prevent stampede' },
    { name: 'Mutex lock (SETNX + EXPIRE)', type: 'syntax', desc: 'Only one request fills the cache; others wait or serve stale' },
    { name: 'Cache-aside + version tag', type: 'syntax', desc: 'Invalidate by incrementing a version key, not by deleting' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Cache-Aside (Lazy Loading)',
      points: [
        'The most common pattern. On a cache miss the application fetches from the database and writes to Redis. Only requested data is cached.',
        'Pros: resilient — if Redis is unavailable, requests fall back to the database. Only populates cache with actually-used data.',
        'Cons: first request always misses (cache warm-up needed). Cache can be stale if data is updated in the DB without invalidating the cache.',
        'Implement with SET key value EX ttl after fetching to avoid stale data accumulating. Pair with explicit invalidation on DB writes.',
      ],
    },
    {
      heading: 'Cache Stampede Prevention',
      points: [
        'Cache stampede (dog-pile effect): when a popular cache key expires, many concurrent requests simultaneously miss the cache and all query the database at once, overwhelming it.',
        'Mutex lock approach: the first request acquires a lock (SET lock:key 1 NX EX 5), fetches from DB, populates cache, releases lock. Other requests wait or serve stale data.',
        'Probabilistic early revalidation: recompute the cache before TTL expires with probability proportional to how close to expiry the key is. No lock required, smoother traffic.',
        'Background refresh: a background job proactively refreshes keys before they expire based on access patterns. Works well for known high-traffic keys.',
        'Stale-while-revalidate: serve the stale cached value immediately, trigger an async refresh. Eliminates latency spikes at the cost of briefly serving outdated data.',
      ],
    },
    {
      heading: 'Write-Through vs Write-Behind',
      points: [
        'Write-Through: every DB write simultaneously updates the cache. Cache is always consistent with the DB. Cons: write latency increases (two writes per operation); unused keys are cached.',
        'Write-Behind (Write-Back): writes go to cache first; a background process asynchronously flushes to the DB. Very low write latency. Cons: data can be lost if Redis crashes before flush; complexity in failure handling.',
        'Write-Behind is rarely implemented in pure Redis setups — it requires a reliable queue (e.g. Redis Streams) to batch and durably flush writes to the DB.',
        'For most web apps, Cache-Aside + explicit invalidation on write is the right trade-off: simple, resilient, and consistent enough.',
      ],
    },
    {
      heading: 'Cache Key Design',
      points: [
        'Keys should be hierarchical and include the version/namespace: `v1:user:42:profile`. Prefix with version to allow bulk invalidation by changing the version prefix.',
        'Avoid caching large objects that change frequently. Cache derived/computed values (e.g. formatted output, aggregates) that are expensive to recompute.',
        'Tag-based invalidation: store a set of keys per tag (e.g. `tag:user:42 → [key1, key2, ...]`) and UNLINK all keys in the set on data change. Expensive to maintain but flexible.',
        'Use HSET for structured cache entries rather than JSON strings when you need to access individual fields without deserialising the whole object.',
      ],
    },
    {
      heading: 'Cache Stampede Prevention',
      points: [
        'A cache stampede occurs when a popular cache key expires and many concurrent requests simultaneously miss the cache and hammer the origin database at once — under high traffic this can overwhelm the database with a sudden burst of duplicate, redundant queries all computing the same result.',
        'A distributed lock (SET key value NX EX ttl) lets only the first request that detects a cache miss actually recompute and repopulate the cache, while other concurrent requests either wait briefly and retry, or serve slightly stale data instead of all independently hitting the database simultaneously.',
        'Probabilistic early expiration (recomputing the cache slightly before its actual TTL expires, with a randomized probability that increases as expiry approaches) spreads out cache regeneration over time rather than having many keys expire in a synchronized burst.',
        'For extremely hot keys, combining a short server-side in-memory cache in front of Redis with the above stampede-prevention techniques provides an additional layer of protection, reducing Redis load itself in addition to protecting the origin database.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Cache-Aside',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

async function getUser(userId: string): Promise<object> {
  const cacheKey = \`v1:user:\${userId}:profile\`;

  // 1. Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // 2. Miss — fetch from DB
  const user = await db.users.findById(userId);
  if (!user) throw new Error('User not found');

  // 3. Populate cache (TTL 5 minutes)
  await redis.set(cacheKey, JSON.stringify(user), 'EX', 300);
  return user;
}

// Invalidate on write
async function updateUser(userId: string, data: object) {
  await db.users.update(userId, data);
  await redis.unlink(\`v1:user:\${userId}:profile\`);
}`,
    },
    {
      label: 'Stampede Prevention',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// Mutex lock to prevent cache stampede
async function getUserWithLock(userId: string): Promise<object> {
  const cacheKey = \`v1:user:\${userId}\`;
  const lockKey = \`lock:\${cacheKey}\`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Try to acquire lock (5s TTL in case of crash)
  const acquired = await redis.set(lockKey, '1', 'NX', 'EX', 5);

  if (acquired) {
    try {
      const user = await db.users.findById(userId);
      await redis.set(cacheKey, JSON.stringify(user), 'EX', 300);
      return user;
    } finally {
      await redis.unlink(lockKey);
    }
  }

  // Another request is filling the cache — wait and retry
  await new Promise(r => setTimeout(r, 50));
  return getUserWithLock(userId); // retry
}

// Stale-while-revalidate pattern
const STALE_TTL = 60;  // serve stale for up to 60s after expiry
const FRESH_TTL = 300; // fresh for 5 min

async function getWithSWR(key: string, fetcher: () => Promise<object>) {
  const raw = await redis.get(key);
  if (raw) {
    const { data, freshUntil } = JSON.parse(raw);
    if (Date.now() < freshUntil) return data; // fresh
    // Stale — trigger background refresh, return stale now
    refreshInBackground(key, fetcher);
    return data;
  }
  const data = await fetcher();
  await redis.set(key, JSON.stringify({ data, freshUntil: Date.now() + FRESH_TTL * 1000 }), 'EX', FRESH_TTL + STALE_TTL);
  return data;
}

async function refreshInBackground(key: string, fetcher: () => Promise<object>) {
  const data = await fetcher();
  await redis.set(key, JSON.stringify({ data, freshUntil: Date.now() + FRESH_TTL * 1000 }), 'EX', FRESH_TTL + STALE_TTL);
}

declare const db: any;`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not setting TTL on cached values',
      wrong: 'await redis.set(`user:${userId}`, JSON.stringify(user));',
      right: 'await redis.set(`user:${userId}`, JSON.stringify(user), "EX", 300);',
      explanation: 'Without TTL, cached values live forever, consuming memory and returning stale data indefinitely. Always set a TTL appropriate for your data freshness requirements.',
    },
    {
      title: 'Caching null/empty results',
      wrong: `const user = await db.users.findById(id);
await redis.set(key, JSON.stringify(user), 'EX', 300);
// user is null — you just cached null`,
      right: `const user = await db.users.findById(id);
if (user) await redis.set(key, JSON.stringify(user), 'EX', 300);
else await redis.set(key, '"__NOT_FOUND__"', 'EX', 30); // short TTL for negative cache`,
      explanation: 'Cache null results with a short TTL ("negative caching") to prevent repeated DB queries for non-existent keys. Without this, "user not found" hammers the DB on every request.',
    },
    {
      title: 'Using KEYS for cache invalidation',
      wrong: 'const keys = await redis.keys("user:42:*"); await redis.del(...keys);',
      right: `// Pattern 1: use SCAN
const toDelete: string[] = [];
let cursor = '0';
do {
  const [c, batch] = await redis.scan(cursor, 'MATCH', 'user:42:*', 'COUNT', 100);
  toDelete.push(...batch); cursor = c;
} while (cursor !== '0');
if (toDelete.length) await redis.unlink(...toDelete);`,
      explanation: 'KEYS blocks Redis. Use SCAN + UNLINK for pattern-based invalidation. Better: design keys to avoid pattern scans — store a set of keys per entity and delete by set membership.',
    },
  ];

  challenge: Challenge = {
    title: 'Cache-Aside with Stampede Lock',
    language: 'typescript',
    description: 'Write a generic `cachedFetch<T>(redis, key, ttlSec, fetcher)` function implementing cache-aside with mutex lock to prevent stampede. If locked, retry after 50ms up to 5 times before calling the fetcher directly as fallback.',
    hints: [
      'SET lockKey 1 NX EX 5 — NX = only if not exists',
      'On lock miss, retry with setTimeout; after 5 retries call fetcher directly',
    ],
    starterCode: `import Redis from 'ioredis';

async function cachedFetch<T>(
  redis: Redis,
  key: string,
  ttlSec: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  // implement
}`,
    solution: `import Redis from 'ioredis';

async function cachedFetch<T>(redis: Redis, key: string, ttlSec: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;

  const lockKey = 'lock:' + key;
  for (let attempt = 0; attempt < 5; attempt++) {
    const acquired = await redis.set(lockKey, '1', 'NX', 'EX', 5);
    if (acquired) {
      try {
        const data = await fetcher();
        await redis.set(key, JSON.stringify(data), 'EX', ttlSec);
        return data;
      } finally {
        await redis.unlink(lockKey);
      }
    }
    await new Promise(r => setTimeout(r, 50));
    const retry = await redis.get(key);
    if (retry) return JSON.parse(retry) as T;
  }
  return fetcher(); // fallback: skip cache
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is a cache stampede?',
      options: [
        'Redis running out of memory',
        'Multiple requests simultaneously hitting the DB when a popular cache key expires',
        'A Redis Cluster rebalancing event',
        'AOF file growing too large',
      ],
      answer: 1,
      explanation: 'Cache stampede (dog-pile effect): when a hot cache key expires, many concurrent requests simultaneously miss the cache and query the database at once, causing a spike in DB load.',
    },
    {
      q: 'In Cache-Aside pattern, who is responsible for loading data into the cache on a miss?',
      options: ['The cache layer automatically', 'The database', 'The application code', 'A background worker'],
      answer: 2,
      explanation: 'In Cache-Aside (Lazy Loading), the application code checks the cache, and on a miss, it fetches from the DB and writes to the cache. The cache itself is passive — it never self-populates.',
    },
    {
      q: 'What is the cache-aside (lazy loading) pattern?',
      options: ['Cache is populated on write; reads bypass the cache', 'The application checks the cache first; on miss it loads from DB and populates the cache', 'The cache automatically syncs with the DB in the background', 'Data is written to cache only, never to DB directly'],
      answer: 1,
      explanation: 'Cache-aside: app checks cache first. On hit, return value. On miss, load from DB, store in cache, return to caller. Simple and resilient — if cache fails, app still works from DB.',
    },
    {
      q: 'How does a "probabilistic early expiration" strategy prevent cache stampedes without requiring an explicit lock?',
      options: ['It disables expiration entirely for hot keys so they never trigger a stampede', 'Each read checks remaining TTL and randomly decides to refresh the cache slightly BEFORE actual expiry, with the probability increasing as expiry approaches — so refreshes get naturally spread across many earlier requests instead of all requests hitting a hard expiry wall at once', 'It requires every client to acquire a distributed lock before any cache read', 'It increases the TTL of all keys uniformly to reduce expiration frequency'], answer: 1,
      explanation: 'Instead of a hard cliff where a key is valid until exactly time T and then every subsequent request misses simultaneously, probabilistic early expiration has each read compute a small random chance of treating the key as "expired early" — that chance rises the closer the real TTL gets to zero. This spreads refreshes probabilistically across many earlier requests rather than concentrating them all at the exact expiry instant, achieving a similar de-stampeding effect to an explicit mutex/lock but without any actual locking coordination between clients.',
    },
    {
      q: 'What is the write-through caching pattern?',
      options: ['Data is written to DB first, then asynchronously to cache', 'Data is written to both cache and DB synchronously on every write', 'Writes only go to cache; DB sync happens later', 'Only reads update the cache'],
      answer: 1,
      explanation: 'Write-through writes to cache and DB synchronously. Cache is always consistent with DB. Downside: write latency doubles. Benefit: no cache miss on subsequent reads.',
    },
    {
      q: 'What is the write-behind (write-back) caching pattern?',
      options: ['Write to DB first, then update cache', 'Write to cache immediately; asynchronously persist to DB later', 'Invalidate cache on every write', 'Write to cache only for read-heavy workloads'],
      answer: 1,
      explanation: 'Write-behind writes to cache first and asynchronously flushes to the DB. Lower write latency but risk of data loss if cache fails before flush. Suitable for high-write, loss-tolerant workloads.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I cache database query results or computed values?',
      a: 'Cache the most expensive-to-produce value — which is often the computed/serialised output rather than raw DB rows. Caching processed API responses (already serialised to JSON) saves both DB query time AND serialisation cost on each request. Cache raw DB results when multiple code paths need the same data with different computations.',
    },
    {
      q: 'What is the read-through cache pattern?',
      a: 'The cache sits in front of the DB and handles misses automatically — when the app requests data not in cache, the cache fetches from DB and stores it. The app always reads from cache. Redis does not natively implement read-through; you need a caching library or proxy layer.',
    },
    {
      q: 'How do you implement cache invalidation when source data changes?',
      a: 'Strategies: (1) <strong>TTL expiration</strong> — set TTL, accept stale reads; (2) <strong>Active invalidation</strong> — on DB change, DEL the cache key; (3) <strong>Event-driven</strong> — DB change triggers cache DEL via CDC (Change Data Capture). Active invalidation is most consistent but requires coupling.',
    },
    {
      q: 'What is cache warming and when do you use it?',
      a: 'Cache warming pre-populates the cache before traffic arrives — prevents cold start where all requests miss and hammer the DB. Strategies: on deploy load top-N records; replay recent traffic; use a standby Redis instance. Essential for services with predictable hot keys or after Redis restart.',
    },
    {
      q: 'How do you prevent the thundering herd (cache stampede)?',
      a: 'Solutions: (1) <strong>Mutex/lock</strong> — only one request rebuilds cache; others wait or return stale (SET NX EX); (2) <strong>Probabilistic early expiry</strong> — some requests refresh before TTL expires; (3) <strong>Background refresh</strong> — a job refreshes proactively; (4) <strong>Stale-while-revalidate</strong> — serve stale while asynchronously refreshing.',
    },
    {
      q: 'What is a write-around caching strategy?',
      a: 'Write-around bypasses the cache on writes — data goes directly to DB and is only cached on a subsequent read (cache-aside style). Avoids polluting the cache with data that may never be re-read. Good for infrequently-accessed data or large objects. Tradeoff: first read after write always misses.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Cache-Aside: app checks → miss → DB → write cache; prevent stampede with mutex locks or stale-while-revalidate; always set TTL; negative-cache null results.',
    mustKnow: [
      'Cache-Aside: app fetches on miss, writes to cache — most common pattern',
      'Write-Through: DB + cache updated together — always consistent, higher write latency',
      'Cache stampede: hot key expiry → concurrent DB hits; prevent with mutex or SWR',
      'Always set TTL — unbounded cache causes memory exhaustion and stale data',
      'Negative caching: cache null results with short TTL to protect DB from repeated misses',
      'Key versioning (v1:entity:id) enables bulk invalidation by version bump',
    ],
    interviewFocus: [
      'Explain cache-aside vs write-through — trade-offs?',
      'What is a cache stampede and how do you prevent it?',
      'What is stale-while-revalidate and when is it useful?',
      'How do you handle cache invalidation at scale?',
    ],
  };
}
