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

@Component({
  selector: 'app-azure-redis',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './redis.html',
  styleUrl: './redis.scss'
})
export class AzureRedis {

  quickRef: QuickRefItem[] = [
    { name: 'Cache-Aside', type: 'type', desc: 'Application checks cache first; on miss, reads from DB, writes to cache with TTL, returns data. Most common Redis caching pattern.' },
    { name: 'Basic Tier', type: 'type', desc: 'Single node, no SLA, no replication. Development and testing only. Up to 53 GB cache size.' },
    { name: 'Standard Tier', type: 'type', desc: 'Two nodes (primary + replica), 99.9% SLA, automatic failover. Production workloads. Up to 53 GB.' },
    { name: 'Premium Tier', type: 'type', desc: 'Cluster mode (up to 10 shards), VNet injection, data persistence (RDB/AOF), geo-replication, up to 1.2 TB. Enterprise features.' },
    { name: 'TTL', type: 'type', desc: 'Time-To-Live — expiry in seconds set on a Redis key. After TTL expires, Redis automatically deletes the key. Critical for cache freshness.' },
    { name: 'Pub/Sub', type: 'type', desc: 'Redis publish/subscribe messaging. Publishers send messages to channels; subscribers receive. Not persistent — missed messages cannot be replayed.' },
    { name: 'Geo-Replication', type: 'type', desc: 'Premium tier: links two Redis instances across regions as primary/secondary. Reads can be served from secondary; writes go to primary. Manual failover.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Cache Patterns & TTL Strategy',
      points: [
        'Cache-Aside (lazy loading): application checks cache first. On a cache hit, return data from cache. On a miss, load from the source (DB/API), store in cache with TTL, return to caller. Data enters cache only when requested — no wasted memory for unused data.',
        'Write-Through: on every write to the database, also write to cache. Cache is always up to date but every write is slower (dual write). Low cache miss rate but higher write latency. Combine with read cache-aside for full coverage.',
        'Write-Behind (write-back): write to cache first, return to caller, then asynchronously flush to the database. Lowest write latency but risk of data loss if the cache crashes before flush. Rarely used with Redis unless persistence is enabled.',
        'TTL selection is a trade-off: short TTL = fresher data, more cache misses, higher DB load. Long TTL = stale data risk, fewer misses, lower DB load. Use shorter TTLs for volatile data (user sessions, prices) and longer TTLs for stable reference data (product categories, config).',
        'Cache stampede (thundering herd): when a high-traffic key expires, many concurrent requests simultaneously miss the cache and all load from the DB. Mitigation: probabilistic early expiry (PER), mutex/lock on first miss (only one request loads from DB while others wait), or staggered TTLs with small random jitter.',
      ]
    },
    {
      heading: 'Azure Cache for Redis Tiers',
      points: [
        'Basic: single node, no replication, no SLA. Use only for development and testing — data loss on failover, no HA guarantee. Sizes C0 (250 MB) to C6 (53 GB).',
        'Standard: two nodes (primary + replica) with automatic failover. 99.9% SLA. Replicated writes. If the primary node fails, the replica is promoted automatically and the DNS endpoint updates. Sizes C0–C6 (up to 53 GB).',
        'Premium: cluster mode (horizontal sharding across up to 10 shards → up to 1.2 TB total), VNet injection (private network), persistence (RDB snapshots or AOF — append-only file), geo-replication to a secondary region, and Redis modules (RedisSearch, RedisJSON). 99.9% SLA.',
        'Enterprise tier (Redis Enterprise): uses Redis Labs software directly. Supports active-active geo-replication (multi-write), RediSearch, RedisJSON, RedisTimeSeries. Higher cost, highest performance and feature set.',
        'Cluster mode: data is sharded across multiple nodes by key hash slot. Applications using the StackExchange.Redis client connect to the cluster endpoint — the client handles slot routing. Not all Redis commands work in cluster mode (multi-key operations must be on the same slot).',
      ]
    },
    {
      heading: 'Data Structures & Use Cases',
      points: [
        'Strings: simple key-value. Use for: session tokens, counters (INCR/DECR are atomic), feature flags, rate limit counters. SET key value EX 3600 sets a string with 1-hour TTL.',
        'Hashes: field-value pairs under one key. Use for: user profile objects, product details, settings. HSET user:123 name "Alice" email "alice@example.com". More memory-efficient than one key per field.',
        'Lists: ordered sequence (head/tail insert/pop). Use for: job queues (LPUSH + BRPOP for blocking pop), recent activity feeds, message pipelines. LRANGE key 0 9 for last 10 items.',
        'Sets: unordered unique elements. Use for: unique visitors, tags, union/intersection of user groups (SUNION, SINTER). Sorted Sets: elements with scores, ordered by score. Use for: leaderboards (ZADD, ZRANGE by rank), time-series events (score = timestamp).',
        'Pub/Sub: PUBLISH channel message / SUBSCRIBE channel. Transient messaging — subscribers must be connected to receive. Use for: real-time notifications, live dashboards, broadcasting. For reliable delivery use Redis Streams (persistent log with consumer groups, similar to Kafka).',
      ]
    },
    {
      heading: 'Security & Access',
      points: [
        'Connection string contains the hostname, port (6380 for TLS), and access key. Always use TLS (port 6380, not 6379) in production — non-TLS transmits data in plaintext over the network.',
        'Entra ID authentication (preview → GA): use Managed Identity to authenticate to Redis instead of access keys. The MI must be assigned the Redis Contributor data access role. Applications use DefaultAzureCredential — no keys in config.',
        'Access keys: two keys (primary and secondary) for zero-downtime rotation — update app to secondary key, regenerate primary, update app back to primary. Keys grant full Redis access — treat like passwords.',
        'VNet injection (Premium): deploy Redis inside your VNet. All traffic stays on the private network. Combined with Private Endpoints for non-Premium tiers. Disable public access for security-sensitive workloads.',
        'Redis ACLs (Enterprise tier): fine-grained command and key pattern restrictions per user. Standard/Premium tiers only support the single auth password model. For multi-tenant scenarios requiring access isolation, deploy separate Redis instances.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Create Redis & Connect',
      language: 'bash',
      code: `# Create Premium Redis cache with persistence and cluster
az redis create \\
  --name my-redis --resource-group my-rg \\
  --location eastus \\
  --sku Premium --vm-size p1 \\
  --enable-non-ssl-port false \\
  --minimum-tls-version 1.2

# Enable RDB persistence (snapshot every 60 minutes)
az redis update \\
  --name my-redis --resource-group my-rg \\
  --set redisConfiguration.rdb-backup-enabled=true \\
  --set redisConfiguration.rdb-backup-frequency=60 \\
  --set redisConfiguration.rdb-backup-max-snapshot-count=1 \\
  --set redisConfiguration.rdb-storage-connection-string="<storage-conn>"

# Get connection string
az redis list-keys --name my-redis --resource-group my-rg

# Cluster mode: enable sharding with 2 shards
az redis create \\
  --name my-redis-cluster --resource-group my-rg \\
  --sku Premium --vm-size p1 \\
  --shard-count 2`
    },
    {
      label: 'Cache-Aside Pattern (TypeScript)',
      language: 'typescript',
      code: `import { createClient } from 'redis';

const redis = createClient({
  socket: { host: process.env['REDIS_HOST'], port: 6380, tls: true },
  password: process.env['REDIS_KEY'],
});
await redis.connect();

const CACHE_TTL = 3600; // 1 hour in seconds

async function getUserById(userId: string): Promise<User | null> {
  const cacheKey = \`user:\${userId}\`;

  // 1. Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached) as User;
  }

  // 2. Cache miss — load from DB
  const user = await db.users.findById(userId);
  if (!user) return null;

  // 3. Store in cache with TTL
  await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(user));
  return user;
}

// Invalidate cache on update
async function updateUser(userId: string, data: Partial<User>): Promise<User> {
  const updated = await db.users.update(userId, data);
  await redis.del(\`user:\${userId}\`);  // invalidate stale cache entry
  return updated;
}

// Atomic rate limiter using INCR + EXPIRE
async function isRateLimited(clientIp: string, limit = 100): Promise<boolean> {
  const key = \`rate:\${clientIp}:\${Math.floor(Date.now() / 60000)}\`; // per minute
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60); // set TTL on first increment
  return count > limit;
}`
    },
    {
      label: 'Pub/Sub & Sorted Sets',
      language: 'typescript',
      code: `import { createClient } from 'redis';

// Pub/Sub — publisher
const publisher = createClient({ /* connection options */ });
await publisher.connect();

async function notifyOrderShipped(orderId: string) {
  await publisher.publish('order-events', JSON.stringify({
    event: 'shipped', orderId, timestamp: Date.now()
  }));
}

// Pub/Sub — subscriber (separate client connection)
const subscriber = publisher.duplicate();
await subscriber.connect();

await subscriber.subscribe('order-events', (message) => {
  const event = JSON.parse(message);
  console.log('Received:', event);
});

// Sorted Set leaderboard
const redis = createClient({ /* connection options */ });

// Add/update user score
async function recordScore(userId: string, score: number) {
  await redis.zAdd('leaderboard', { score, value: userId });
}

// Get top 10 with scores (descending)
async function getTopPlayers(limit = 10) {
  return redis.zRangeWithScores('leaderboard', 0, limit - 1, { REV: true });
}

// Get user rank (0-indexed)
async function getUserRank(userId: string) {
  return redis.zRevRank('leaderboard', userId);
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not setting TTL on cache entries (cache grows indefinitely)',
      wrong: `await redis.set('user:123', JSON.stringify(user));  // No TTL — entry never expires`,
      right: `await redis.setEx('user:123', 3600, JSON.stringify(user));  // Expires after 1 hour`,
      explanation: 'Redis entries without TTL persist forever (until manually deleted or Redis is restarted). Over time, stale data accumulates and Redis consumes all available memory. Azure Redis has a maxmemory-policy that evicts keys when memory is full — without TTLs, eviction is random and unpredictable. Always set TTL on cache entries appropriate to the data\'s freshness requirements.'
    },
    {
      title: 'Using Basic or Standard SKU for production workloads requiring persistence',
      wrong: `az redis create --sku Standard  # Standard has replication but no persistence`,
      right: `az redis create --sku Premium --set redisConfiguration.rdb-backup-enabled=true`,
      explanation: 'Basic and Standard tiers have no persistence — all data is lost on node restart or failure. Standard provides replication (primary → replica) for HA but the replica is in-memory only. Premium tier adds RDB (snapshot) and AOF (append-only file) persistence so data survives restarts. Use Premium for any data that must survive cache restarts (sessions, long-lived tokens).'
    },
    {
      title: 'Using non-TLS port 6379 in production',
      wrong: `redis.createClient({ socket: { port: 6379 } })  // Plaintext — data sent unencrypted`,
      right: `redis.createClient({ socket: { port: 6380, tls: true } })  // TLS encrypted`,
      explanation: 'Port 6379 is the plaintext Redis port. All data (including secrets, session tokens, PII) transmitted over port 6379 is visible in plaintext on the network. Azure Cache for Redis disables non-SSL by default in newer instances, but some older configs or self-managed Redis may still accept 6379. Always use port 6380 with TLS in any non-local environment.'
    },
    {
      title: 'Invalidating cache by key prefix instead of using a cache key per entity',
      wrong: `// On any product update, scan KEYS product:* and delete all — O(n) scan blocks Redis`,
      right: `// On specific product update: redis.del('product:' + productId)  — O(1) targeted delete`,
      explanation: 'KEYS pattern scanning is O(n) over the entire keyspace and blocks the Redis server for the duration of the scan — catastrophic in production with millions of keys. Use targeted invalidation (delete by specific key) or SCAN with cursor-based iteration. For group invalidation, use Redis Sets to track related cache keys, or use a version/hash suffix in cache keys and increment a generation counter to "invalidate" all keys of that generation.'
    },
  ];

  challenge: Challenge = {
    title: 'LRU cache implementation',
    language: 'typescript',
    description: 'Implement a simple LRU (Least Recently Used) cache — the eviction strategy Redis uses under maxmemory-policy allkeys-lru.\n\nImplement LRUCache<K, V> with:\n- constructor(capacity: number)\n- get(key: K): V | undefined — returns value and marks as recently used\n- set(key: K, value: V): void — adds entry; if at capacity, evicts least recently used',
    hints: [
      'Use a Map — JavaScript Maps maintain insertion order',
      'On get: delete and re-insert the key to move it to the "end" (most recently used)',
      'On set: if over capacity, delete the first key (Map.keys().next().value)',
      'Map size tracks current count',
    ],
    starterCode: `export class LRUCache<K, V> {
  private capacity: number;
  private map = new Map<K, V>();

  constructor(capacity: number) { this.capacity = capacity; }
  get(key: K): V | undefined { return undefined; }
  set(key: K, value: V): void {}
}`,
    solution: `export class LRUCache<K, V> {
  private map = new Map<K, V>();
  constructor(private capacity: number) {}

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const val = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, val); // move to end (most recent)
    return val;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.capacity) {
      this.map.delete(this.map.keys().next().value!); // evict LRU (first entry)
    }
    this.map.set(key, value);
  }
}

const cache = new LRUCache<string, number>(3);
cache.set('a', 1); cache.set('b', 2); cache.set('c', 3);
cache.get('a');       // 'a' is now most recently used
cache.set('d', 4);   // evicts 'b' (LRU)
console.log(cache.get('b')); // undefined — evicted
console.log(cache.get('a')); // 1 — still present`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the cache-aside pattern?',
      options: [
        'Write to cache first, then async write to database',
        'Application checks cache; on miss, loads from DB and stores in cache with TTL',
        'Cache is updated on every DB write automatically',
        'Cache entries are pre-warmed at application startup'
      ],
      answer: 1,
      explanation: 'Cache-aside (lazy loading): check cache first. Hit → return cached data. Miss → load from DB, store in cache with TTL, return to caller. Data only enters cache when actually requested — no wasted memory. The trade-off is a cache miss on the first request for any new data (cold start latency).'
    },
    {
      q: 'Which Azure Redis tier supports data persistence (RDB/AOF)?',
      options: ['Basic', 'Standard', 'Premium', 'Both Standard and Premium'],
      answer: 2,
      explanation: 'Only the Premium tier supports RDB (Redis Database snapshot — periodic backup) and AOF (Append-Only File — logs every write for point-in-time recovery) persistence. Basic and Standard tiers are in-memory only — data is lost if the node restarts or fails. Use Premium for any workload where cache data must survive restarts.'
    },
    {
      q: 'What is a cache stampede (thundering herd) and how do you prevent it?',
      options: [
        'A Redis cluster failure when too many shards go offline simultaneously',
        'Many concurrent requests missing the same expired cache key and all loading from the DB at once',
        'A Redis client timeout caused by large values exceeding the maximum key size',
        'An eviction wave when maxmemory is reached and Redis evicts thousands of keys simultaneously'
      ],
      answer: 1,
      explanation: 'When a hot cache key expires, all concurrent requests that needed it simultaneously miss the cache and all try to load from the database — causing a spike in DB load that can overwhelm it. Prevention: (1) probabilistic early re-computation before expiry, (2) mutex/lock — first miss acquires a lock and loads from DB, other misses wait and read from cache after the lock is released, (3) staggered TTLs with random jitter.'
    },
    {
      q: 'Why should you never use KEYS pattern in production Redis?',
      options: [
        'KEYS is deprecated and will be removed in Redis 8',
        'KEYS is O(n) over the entire keyspace and blocks the server during the scan',
        'KEYS only works with string type keys',
        'KEYS requires admin access that is not available in Azure Redis'
      ],
      answer: 1,
      explanation: 'The KEYS command scans the entire keyspace and blocks Redis for the duration of the scan (Redis is single-threaded for commands). With millions of keys, this can block Redis for seconds — causing timeouts across all connections. Use SCAN instead: cursor-based iteration that returns results in batches without blocking, at the cost of multiple round-trips.'
    },
    {
      q: 'What Redis data structure is best for a real-time leaderboard?',
      options: ['List', 'Hash', 'Sorted Set (ZSet)', 'Pub/Sub channel'],
      answer: 2,
      explanation: 'Sorted Sets (ZSet) store members with a floating-point score, automatically kept in sorted order. ZADD updates scores atomically. ZRANGE/ZREVRANGE retrieves members by rank. ZRANK/ZREVRANK gets a member\'s position. All these operations are O(log N) — efficient at scale. Leaderboard queries like "top 10 players" or "player rank" map directly to ZREVRANGE and ZREVRANK commands.'
    },
    {
      q: 'Which Azure Cache for Redis tier supports clustering, geo-replication, and zone redundancy?',
      options: [
        'Basic',
        'Standard',
        'Premium',
        'Basic and Standard equally',
      ],
      answer: 2,
      explanation: 'The Premium tier supports Redis Cluster, active geo-replication, zone redundancy, and VNet injection. Basic offers a single node; Standard adds replication.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use Redis Pub/Sub vs Redis Streams vs Azure Service Bus?',
      a: '<strong>Redis Pub/Sub</strong>: fire-and-forget broadcasting to connected subscribers. Messages are not stored — if a subscriber disconnects, it misses messages. Use for: live notifications, real-time dashboards where missing a message is acceptable. <strong>Redis Streams</strong>: persistent log with consumer groups (like Kafka). Messages are stored, consumers can replay from a position, support acknowledgement and retry. Use for: reliable event processing where message delivery must be guaranteed. <strong>Azure Service Bus</strong>: enterprise messaging with dead-letter, sessions, ordering, transactions, and guaranteed delivery. Use for: business-critical message flows, order processing, workflow triggers. Prefer Service Bus over Redis for reliable inter-service messaging.'
    },
    {
      q: 'How do you handle Redis key naming to avoid collisions across services?',
      a: 'Use a structured namespace convention: <strong>service:entity:identifier</strong>. Examples: user-service:user:123, order-service:cart:456, rate-limit:ip:192.168.1.1. Benefits: (1) Visual clarity — what created this key. (2) Pattern-based management — scan user-service:* to find all user service keys. (3) Prevents accidental overwrites when multiple services share one Redis instance. For multi-tenant apps, add tenant prefix: tenant:tenantId:service:entity:id. Consider separate Redis instances (or databases 0–15) to isolate services entirely.'
    },
    {
      q: 'What is the difference between RDB and AOF persistence in Redis?',
      a: '<strong>RDB (Redis Database)</strong>: periodic snapshot of the in-memory dataset to a binary file. Compact, fast to restore on startup. But: data written since the last snapshot is lost on crash. Snapshots can be taken every 15 minutes, 1 hour, etc. <strong>AOF (Append-Only File)</strong>: logs every write operation. Configurable fsync: always (every write, most durable), everysec (every 1 second, good balance), no (OS decides). Slower to restore (replays all operations) but can lose at most 1 second of data. For maximum durability, use both: RDB for fast restarts, AOF for minimising data loss.'
    },
    {
      q: 'How does Redis cluster mode work and what are its limitations?',
      a: 'Redis cluster splits the keyspace into 16,384 hash slots. Each shard (primary + replicas) owns a subset of slots. A key\'s slot is computed as CRC16(key) % 16384. The client connects to any node and is redirected to the correct shard if needed. Azure Premium tier supports up to 10 shards → up to 1.2 TB. Limitations: (1) <strong>Multi-key operations</strong> (MGET, MSET, transactions, Lua scripts) only work if all keys hash to the same slot — use hash tags ({user:123}) to force keys to the same slot. (2) Database selection (SELECT) is not supported — cluster only has db 0. (3) More complex client configuration required.'
    },
    {
      q: 'What happens when Redis runs out of memory (maxmemory reached)?',
      a: 'Azure Redis sets a maxmemory limit based on the cache size. When reached, Redis applies the configured <strong>maxmemory-policy</strong>: <code>noeviction</code> (return errors on write — default for session workloads), <code>allkeys-lru</code> (evict least recently used across all keys — good for general caching), <code>volatile-lru</code> (evict LRU among keys with TTL set — preserves keys without TTL), <code>allkeys-lfu</code> (evict least frequently used — better for access-pattern-aware caching). Monitor the used_memory metric and set alerts at 80% — add more memory before hitting the limit to avoid eviction-driven data loss.'
    },
    {
      q: 'What eviction policies does Azure Cache for Redis support and when do you choose each?',
      a: '<strong>volatile-lru</strong>: evict LRU keys with TTL set (default for caches where some keys have expiry). <strong>allkeys-lru</strong>: evict any LRU key (pure cache use case). <strong>noeviction</strong>: return errors when memory full (for queues/pub-sub where data loss is unacceptable). Set via <code>maxmemory-policy</code> in Redis config.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Azure Cache for Redis provides in-memory caching with cache-aside pattern, multiple data structures, pub/sub messaging, and tiers from Basic (dev) through Premium (persistence, clustering, geo-replication).',
    mustKnow: [
      'Cache-aside: check cache → miss → load from DB → store with TTL → return. Always set TTL.',
      'Basic = single node, no SLA; Standard = replicated 99.9% SLA; Premium = cluster + persistence + VNet',
      'Never use KEYS in production (O(n) blocking scan) — use SCAN with cursor instead',
      'Cache stampede: many concurrent misses on expired hot key — use mutex or probabilistic early expiry',
      'Data structures: Strings (counters), Hashes (objects), Lists (queues), Sorted Sets (leaderboards), Pub/Sub (live notifications)',
      'Always use TLS port 6380 — port 6379 is plaintext',
    ],
    interviewFocus: [
      'Explain the cache-aside pattern and when you would invalidate a cache entry',
      'What is a cache stampede and how do you prevent it?',
      'When would you use Redis Pub/Sub vs Redis Streams vs Service Bus?',
      'What Redis tier is needed for data persistence and why?',
    ],
  };
}
