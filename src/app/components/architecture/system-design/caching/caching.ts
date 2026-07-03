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
  { name: 'Cache-aside',     type: 'keyword', desc: 'App checks cache first; on miss, reads DB and populates cache. Most common pattern.' },
  { name: 'Read-through',    type: 'keyword', desc: 'Cache sits in front of DB; on miss, cache fetches from DB transparently.' },
  { name: 'Write-through',   type: 'keyword', desc: 'Write to cache + DB atomically. Always consistent; slower writes.' },
  { name: 'Write-behind',    type: 'keyword', desc: 'Write to cache; async flush to DB. Fast writes; risk of data loss on crash.' },
  { name: 'LRU',             type: 'keyword', desc: 'Least Recently Used — evict the item not accessed longest. Default Redis eviction.' },
  { name: 'TTL',             type: 'keyword', desc: 'Time To Live — auto-expiry after N seconds. Primary cache invalidation tool.' },
  { name: 'Cache stampede',  type: 'keyword', desc: 'Hot key expires → all requests hit DB simultaneously. Prevent with jitter or lock.' },
  { name: 'Cache warming',   type: 'keyword', desc: 'Pre-populate cache before traffic arrives (deploy, cron). Prevents cold-start miss storm.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Why caching matters',
    points: [
      'DB query: 5-50ms. Redis lookup: 0.1-1ms. Cache makes reads 10-500× faster.',
      'Reduces DB load: a 95% cache hit rate means the DB handles 5% of original traffic.',
      'Rule of thumb: cache everything that is read much more than written and where stale data is acceptable.',
    ],
  },
  {
    heading: 'Cache-aside (lazy loading)',
    points: [
      'Application checks cache → miss → reads from DB → stores in cache with TTL.',
      'Pros: only cache what is actually needed; DB is authoritative.',
      'Cons: first request always misses (cold cache); stale data until TTL expires.',
      'Used by: most web apps (Django ORM cache, Rails cache_fetch, Spring @Cacheable).',
    ],
  },
  {
    heading: 'Write strategies',
    points: [
      'Write-through: write to cache + DB in same operation. Cache always consistent. Good for write-less-read-more.',
      'Write-behind (write-back): write to cache immediately, flush to DB async. Very fast writes but data loss risk on crash.',
      'Write-around: skip cache on write; let reads warm it on demand. Good for infrequently-read data.',
    ],
  },
  {
    heading: 'Eviction policies',
    points: [
      'LRU (Least Recently Used): evict longest-unused item. Best for temporal locality.',
      'LFU (Least Frequently Used): evict least-accessed item. Better when access frequency matters (viral content).',
      'FIFO: evict oldest inserted item. Simple; poor for hot data that was inserted early.',
      'Random: evict random item. Surprisingly competitive for uniform access patterns.',
    ],
  },
  {
    heading: 'Cache invalidation strategies',
    points: [
      'TTL-based: simplest — expires after N seconds. Stale window is bounded.',
      'Event-driven: on write, publish a cache invalidation event (Kafka/SNS) that deletes the cached key.',
      'Version keys: append version number to cache key (user:42:v7). "Invalidate" by incrementing version.',
      '"Cache invalidation is one of the two hard things in CS" — Phil Karlton.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Cache-aside Pattern',
    language: 'typescript',
    code: `import { createClient } from 'redis';
const redis = createClient();

async function getUser(userId: string): Promise<User> {
  const cacheKey = \`user:\${userId}\`;

  // 1. Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // 2. Cache miss → read from DB
  const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) throw new Error('User not found');

  // 3. Populate cache with TTL
  await redis.setEx(cacheKey, 3600, JSON.stringify(user)); // 1 hour TTL
  return user;
}

async function updateUser(userId: string, data: Partial<User>): Promise<void> {
  await db.update('users', { id: userId }, data);
  // Invalidate cache — next read will re-fetch from DB
  await redis.del(\`user:\${userId}\`);
}`,
  },
  {
    label: 'Stampede Prevention',
    language: 'typescript',
    code: `// Cache stampede (thundering herd) prevention

// Problem: popular key expires; 1000 requests hit DB simultaneously
// Solution 1: Jitter TTL (randomise expiry ± 10%)
function jitteredTTL(baseTTL: number, jitterPct = 0.1): number {
  const jitter = baseTTL * jitterPct * (Math.random() * 2 - 1);
  return Math.round(baseTTL + jitter);
}
await redis.setEx(key, jitteredTTL(3600), value); // 3240-3960 seconds

// Solution 2: Probabilistic early expiration (PER)
async function getWithPER(key: string, computeFn: () => Promise<string>, ttl: number) {
  const raw = await redis.get(key + ':meta');
  if (raw) {
    const { value, expiry } = JSON.parse(raw);
    const timeLeft = expiry - Date.now() / 1000;
    // Recompute early with probability proportional to 1/timeLeft
    if (timeLeft > 0 && Math.random() > 1 - Math.exp(-timeLeft / ttl)) {
      return value;
    }
  }
  const value = await computeFn();
  await redis.setEx(key + ':meta', ttl, JSON.stringify({ value, expiry: Date.now() / 1000 + ttl }));
  return value;
}

// Solution 3: Distributed lock (only one request rebuilds)
async function getWithLock(key: string, computeFn: () => Promise<string>) {
  const cached = await redis.get(key);
  if (cached) return cached;

  const lockKey = key + ':lock';
  const acquired = await redis.set(lockKey, '1', { NX: true, EX: 30 });
  if (!acquired) {
    await new Promise(r => setTimeout(r, 100)); // wait and retry
    return redis.get(key);
  }
  try {
    const value = await computeFn();
    await redis.setEx(key, 3600, value);
    return value;
  } finally {
    await redis.del(lockKey);
  }
}`,
  },
  {
    label: 'Multi-Level Cache',
    language: 'typescript',
    code: `// Multi-level caching: L1 (in-process) → L2 (Redis) → DB

const l1Cache = new Map<string, { value: string; expiry: number }>();

async function get(key: string): Promise<string | null> {
  // L1: in-process memory (nanoseconds)
  const l1 = l1Cache.get(key);
  if (l1 && l1.expiry > Date.now()) return l1.value;

  // L2: Redis (sub-millisecond)
  const l2 = await redis.get(key);
  if (l2) {
    l1Cache.set(key, { value: l2, expiry: Date.now() + 30_000 }); // 30s L1 TTL
    return l2;
  }

  // L3: Database (5-50ms)
  const value = await db.get(key);
  if (value) {
    await redis.setEx(key, 3600, value);         // 1h L2 TTL
    l1Cache.set(key, { value, expiry: Date.now() + 30_000 });
  }
  return value;
}

// Typical latencies:
// L1 (in-process Map):  ~0.001ms (nanoseconds)
// L2 (Redis same DC):   ~0.5ms
// L3 (PostgreSQL):      ~5-50ms`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Caching user-specific data without key scoping',
    wrong: `await redis.set('dashboard', JSON.stringify(data));
// All users get the same dashboard!`,
    right: `await redis.setEx(\`dashboard:\${userId}\`, 300, JSON.stringify(data));
// Scoped per user; 5-minute TTL`,
    explanation: 'Cache keys must include all dimensions that make data unique (userId, tenantId, locale). Shared keys between users cause data leakage and incorrect data display.',
  },
  {
    title: 'No TTL on cache entries',
    wrong: `await redis.set('products', JSON.stringify(products));
// Stale forever — cache never expires`,
    right: `await redis.setEx('products', 300, JSON.stringify(products));
// Expires in 5 minutes; DB is consulted periodically`,
    explanation: 'Without TTL, stale data persists indefinitely. If the DB is updated, the cache never refreshes. Always set a TTL unless you explicitly manage invalidation on every write.',
  },
  {
    title: 'Caching highly dynamic data',
    wrong: `// Cache the live stock price with 1-hour TTL
await redis.setEx('AAPL:price', 3600, '185.42');`,
    right: `// Stock prices change every second — cache for max 1-2 seconds or skip:
await redis.setEx('AAPL:price', 2, price); // 2s TTL for near-real-time
// Or: don't cache; use WebSocket push from exchange feed`,
    explanation: 'Caching very dynamic data causes users to see incorrect values. The cost of a cache miss (going to DB) is often acceptable when data changes faster than the TTL.',
  },
  {
    title: 'Not handling cache miss gracefully',
    wrong: `const data = JSON.parse(await redis.get(key) as string);
// Throws if key doesn't exist (get returns null)`,
    right: `const raw = await redis.get(key);
const data = raw ? JSON.parse(raw) : await fetchFromDB(key);`,
    explanation: 'Cache misses are normal and expected. Always handle the null/undefined case from a cache get and fall back to the source of truth.',
  },
];

const challenge: Challenge = {
  title: 'Design the caching strategy for a news feed',
  language: 'typescript',
  description: `Design caching for a Twitter-style news feed. Users see the 20 most recent posts from people they follow.

Constraints:
- 50M DAU; 10:1 read:write ratio
- Feed generation is expensive (fan-out from followed users)
- Celebrities have 10M+ followers (high write fan-out cost)
- Trending posts change every 5 minutes
- Users expect new posts within 30 seconds

Design decisions:
1. What to cache (pre-generated feed vs individual posts)?
2. TTL strategy for regular users vs celebrity posts
3. Cache invalidation on new post
4. How to handle cache stampede on celebrity tweet`,
  hints: [
    'Pre-generate feeds for regular users (fan-out on write → cache)',
    'For celebrity posts: fan-out on read (too expensive to push to 10M caches)',
    'Trending: short TTL (5 min) with probabilistic refresh',
    'Cache individual posts separately from feed ordering',
  ],
  starterCode: `interface FeedCacheStrategy {
  regularUserFeed: { strategy: string; ttl: number; invalidation: string };
  celebrityPosts:  { strategy: string; ttl: number; invalidation: string };
  trendingFeed:    { strategy: string; ttl: number; invalidation: string };
  stampedePrevention: string;
}`,
  solution: `const strategy: FeedCacheStrategy = {
  regularUserFeed: {
    strategy: 'Cache-aside: pre-generate feed on write (fan-out on write). Key: feed:{userId}, value: [postId, ...] (last 200 posts).',
    ttl: 300, // 5 minutes — regenerate on next fetch if stale
    invalidation: 'On new post from followed user: append to cached feed via Redis LPUSH, trim to 200. No delete needed — incremental update.',
  },
  celebrityPosts: {
    strategy: 'Fan-out on read: do NOT push to 10M feeds. Cache post content individually: post:{postId}. Merge into feed at read time.',
    ttl: 60, // 1 minute — celebrity posts are frequently accessed
    invalidation: 'Post update: del post:{postId}. Next read repopulates from DB.',
  },
  trendingFeed: {
    strategy: 'Cache computed trending list (global, not per-user). Recompute every 5 min via background job.',
    ttl: 300, // 5 min TTL aligns with recompute frequency
    invalidation: 'Background job rewrites cache key on new computation. Stale-while-revalidate: serve stale during recompute.',
  },
  stampedePrevention: 'Jitter TTL ± 10% to spread expiry. Distributed lock (Redis SETNX) for feed recompute — only one worker rebuilds per user. Serve stale during rebuild.',
};`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which caching strategy ensures the cache is always consistent with the database, even after writes?',
    options: ['Cache-aside', 'Write-through', 'Write-behind', 'Read-through'],
    answer: 1,
    explanation: 'Write-through updates both cache and DB atomically on every write — cache is never stale. Trade-off: slower writes. Cache-aside requires explicit invalidation; write-behind risks data loss.',
  },
  {
    q: 'What causes a cache stampede?',
    options: ['Too many cache entries', 'A popular cached key expires and many requests hit the DB simultaneously', 'Running out of Redis memory', 'Incorrect cache keys'],
    answer: 1,
    explanation: 'Cache stampede: when a hot key expires, all in-flight requests miss the cache simultaneously and flood the database. Prevent with TTL jitter, probabilistic early expiration, or a distributed lock.',
  },
  {
    q: 'Which eviction policy is best when some data is accessed frequently but was inserted a long time ago?',
    options: ['LRU', 'FIFO', 'LFU', 'Random'],
    answer: 2,
    explanation: 'LFU (Least Frequently Used) evicts based on access frequency, not recency. For viral content that was inserted early but remains popular, LFU keeps it while FIFO or LRU would evict it.',
  },
  { q: 'A team implements request coalescing to prevent cache stampede — only one request fetches from the DB while others wait for the result. This works fine on a single cache server, but the app then scales to 5 cache-serving instances behind a load balancer. Does the coalescing still prevent a stampede?', options: ['Yes, coalescing is a global property that works regardless of instance count', 'No — coalescing implemented with an in-process lock/mutex only prevents duplicate DB fetches WITHIN one instance; if the popular key expires and 5 instances each independently see a cache miss at roughly the same time, each instance\'s local coalescing still lets exactly one request-per-instance through, producing 5 concurrent DB queries instead of 1 (better than uncoordinated stampede, but not the single query the design intended)', 'Coalescing automatically becomes distributed once behind a load balancer', 'The load balancer itself prevents duplicate DB queries'], answer: 1, explanation: 'In-process coalescing (a mutex or a "singleflight"-style in-memory dedup) only has visibility into requests hitting that ONE process — it has no way to know that four other instances are experiencing the identical cache miss at the same moment. To get true single-fetch behavior across a horizontally-scaled fleet, coalescing needs to be implemented with a distributed lock (e.g. a Redis SETNX-based lock) that all instances contend for, so only one instance across the whole fleet wins the right to query the database while the rest either wait or serve stale data. This is a common gap: coalescing logic that was correctly designed and tested on one instance silently degrades (but doesn\'t fully break) once the service scales horizontally.' },
  { q: 'What is the difference between LRU and LFU cache eviction policies?', options: ['LRU is for read-heavy workloads; LFU is for write-heavy workloads', 'LRU evicts the item least recently accessed; LFU evicts the item accessed least frequently over time', 'LRU is a hardware cache policy; LFU is a software cache policy', 'LFU is more memory-efficient than LRU in all scenarios'], answer: 1, explanation: 'LRU (Least Recently Used) evicts the item that has not been accessed for the longest time, assuming recently accessed items will be accessed again soon. LFU (Least Frequently Used) evicts the item with the lowest total access count, keeping hot items longer. LRU is simpler to implement and works well for most workloads. LFU handles repetitive access patterns better but is more complex and can be slow to adapt when access patterns change significantly.' },
  { q: 'What is a write-behind cache and when should you use it?', options: ['A cache that only stores data after it is written to the database first', 'A cache that buffers writes and asynchronously flushes them to the database later', 'A cache that rejects writes when the database is unreachable', 'A read-only cache that never accepts write operations'], answer: 1, explanation: 'Write-behind (write-back) caching buffers writes in the cache and asynchronously writes to the persistent store later. Benefits: write latency is reduced because the response is returned after the cache write without waiting for the database. The cache absorbs write bursts and batches database writes. Risk: if the cache fails before flushing, writes are lost. Use it for high write throughput workloads where occasional write loss is acceptable, or where the cache itself is durable (e.g., Redis AOF persistence).' },
];

const qna: QnaItem[] = [
  {
    q: 'How do you decide what NOT to cache?',
    a: 'Avoid caching: highly dynamic data (live prices, real-time inventory), personalised sensitive data (auth tokens, PII) unless encrypted, data that changes on every read (incrementing counters — use Redis INCR directly instead), and small datasets where a DB query is just as fast.',
  },
  {
    q: 'What is the difference between Redis and Memcached?',
    a: 'Redis supports richer data structures (lists, sets, sorted sets, hashes, streams), persistence (RDB/AOF), Lua scripting, pub/sub, and clustering. Memcached is simpler, multi-threaded, and uses slightly less memory per key for pure string caching. Most new projects choose Redis for its versatility.',
  },
  { q: 'How do you choose between Redis and Memcached for caching?', a: 'Choose Redis when you need: rich data structures like sorted sets, hashes, and lists for complex caching patterns; persistence via RDB snapshots or AOF logging to survive restarts; pub/sub messaging; server-side scripting with Lua; or clustering for horizontal scaling. Choose Memcached when you need: simplest possible cache with maximum throughput for plain string key-value pairs; multi-threaded architecture for high concurrency on large instances; consistent hashing for client-side sharding across nodes. Redis is the default choice for most applications because its flexibility covers use cases that Memcached cannot. Memcached is preferred when operations are purely get/set and you want to minimize overhead.' },
  { q: 'What is a CDN cache and how does it differ from an application cache?', a: 'A CDN cache stores copies of static and dynamic content at geographically distributed edge nodes close to users. Unlike an application cache that resides in your data center and reduces database load, a CDN cache reduces origin server load and network latency for geographically dispersed users. CDN caches are populated via pull caching (edge fetches from origin on first request and caches the response) or push caching (you proactively upload content to edge nodes). CDN caches are most effective for static assets, images, videos, and cacheable API responses. Application caches handle session data, computed results, and database query results that CDNs cannot serve.' },
  { q: 'How do you implement cache invalidation across a distributed system?', a: 'Cache invalidation strategies: TTL-based expiry lets entries age out naturally, suitable when stale data is acceptable for short periods. Event-driven invalidation publishes change events via a message bus and cache consumers evict or update affected entries; this is more complex but keeps caches fresher. Write-through invalidation updates the cache synchronously during writes, ensuring consistency but adding write latency. For distributed invalidation across multiple cache nodes, use a pub/sub channel or send DELETE commands to all relevant cache shards. The hardest part is fan-out: invalidating all cache entries that depend on a changed entity, which requires tracking dependencies or using versioned cache keys that change with the underlying data.' },
  { q: 'What is hot key sharding in Redis and why does it matter?', a: 'A hot key in Redis is a single key that receives a disproportionate share of traffic, causing one Redis shard to become a bottleneck while others are underutilized. This breaks horizontal scaling because Redis is single-threaded per shard. Solutions: local cache the hot key value in application memory with a very short TTL so most reads never reach Redis. Key splitting creates N copies of the hot key with a numeric suffix and randomly routes reads across them. Read replicas in Redis Cluster can serve reads for hot keys. Redesign the data model to avoid single-key hotspots, for example storing user-level data under user-keyed entries instead of a single global counter.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Cache-aside is the default pattern; TTL is the primary invalidation tool; prevent stampede with jitter or locks.',
  mustKnow: [
    'Cache-aside: app manages cache; miss → DB → populate',
    'Write-through: cache + DB written together — no stale cache',
    'Write-behind: cache first, async DB flush — risk data loss',
    'TTL: always set; stale window = TTL value',
    'Cache stampede: hot key expires → DB flood; fix with jitter + lock',
    'LRU default; LFU for frequency-based access patterns',
  ],
  interviewFocus: [
    'Always ask: "Is stale data acceptable?" before choosing write strategy',
    'Mention stampede prevention proactively — shows depth',
    'Scope cache keys: key = entity_type:id[:locale/:tenant]',
    'Cite Redis hit rate target: 90-99% for read-heavy systems',
  ],
};

@Component({
  selector: 'app-sysdesign-caching',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './caching.html',
  styleUrl: './caching.scss',
})
export class SysdesignCaching {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
