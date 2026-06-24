import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic { title: string; route: string; badge: string; description: string; keyPoints: string[]; available: boolean; }

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'Data Structures': 'structures', 'Commands': 'commands',
  'Persistence': 'persistence', 'Pub/Sub': 'pubsub', 'Caching': 'caching',
  'Cluster': 'cluster', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'Data Structures', 'Commands', 'Persistence', 'Pub/Sub', 'Caching', 'Cluster', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'Redis Fundamentals', route: '/redis/fundamentals', badge: 'Foundations', description: 'In-memory key-value store — architecture, use cases, and how Redis differs from disk-based databases.', keyPoints: ['Single-threaded event loop', 'In-memory with optional persistence', 'Sub-millisecond latency', 'Data structure server', 'Redis vs Memcached'], available: true },
  { title: 'Installation & CLI', route: '/redis/installation-setup', badge: 'Foundations', description: 'Install Redis, configure redis.conf, connect with redis-cli, and understand basic key commands.', keyPoints: ['Redis server and cli', 'SET / GET / DEL', 'Key expiry with EXPIRE / TTL', 'Key naming conventions', 'Redis Insight GUI'], available: true },
  { title: 'Strings', route: '/redis/strings', badge: 'Data Structures', description: 'Binary-safe strings — the most fundamental Redis type. INCR, APPEND, GETSET, and bit operations.', keyPoints: ['SET with EX, NX, XX options', 'INCR/INCRBY counters', 'APPEND to build strings', 'GETDEL and GETEX', 'SETBIT / GETBIT / BITCOUNT'], available: true },
  { title: 'Hashes', route: '/redis/hashes', badge: 'Data Structures', description: 'Maps of field-value pairs stored under a single key — ideal for representing objects.', keyPoints: ['HSET, HGET, HMGET', 'HGETALL returns all fields', 'HINCRBY for numeric fields', 'HSCAN for large hashes', 'Memory efficiency with ziplist'], available: true },
  { title: 'Lists', route: '/redis/lists', badge: 'Data Structures', description: 'Doubly linked lists for queues, stacks, and message buffers — LPUSH, RPUSH, LPOP, LRANGE.', keyPoints: ['LPUSH / RPUSH / LPOP / RPOP', 'LRANGE for slices', 'LLEN and LINDEX', 'BLPOP/BRPOP blocking pop', 'Circular buffer with LTRIM'], available: true },
  { title: 'Sets', route: '/redis/sets', badge: 'Data Structures', description: 'Unordered collections of unique strings — SADD, SMEMBERS, SINTER, SUNION, SDIFF.', keyPoints: ['SADD, SREM, SMEMBERS', 'Set intersection SINTER', 'Set union SUNION', 'SISMEMBER lookup O(1)', 'Tracking unique visitors'], available: true },
  { title: 'Sorted Sets', route: '/redis/sorted-sets', badge: 'Data Structures', description: 'Sets ordered by a floating-point score — leaderboards, rate limiting, and range queries.', keyPoints: ['ZADD with score', 'ZRANGE by rank or score', 'ZRANK and ZSCORE', 'ZINCRBY for leaderboards', 'Lexicographic ranges ZRANGEBYLEX'], available: true },
  { title: 'Key Commands & Patterns', route: '/redis/key-commands', badge: 'Commands', description: 'Key lifecycle commands — KEYS, SCAN, DUMP/RESTORE, RENAME, TYPE, OBJECT ENCODING.', keyPoints: ['SCAN vs KEYS (production safe)', 'DUMP/RESTORE for migration', 'OBJECT ENCODING internals', 'RENAME atomicity', 'PERSIST to remove TTL'], available: true },
  { title: 'Transactions (MULTI/EXEC)', route: '/redis/transactions', badge: 'Commands', description: 'Atomic command batching with MULTI/EXEC, DISCARD, and optimistic locking with WATCH.', keyPoints: ['MULTI/EXEC batch', 'DISCARD to cancel', 'WATCH for optimistic locking', 'Error handling in pipeline', 'Lua scripting alternative'], available: true },
  { title: 'Lua Scripting', route: '/redis/lua-scripting', badge: 'Commands', description: 'Execute Lua scripts atomically with EVAL — combine multiple operations without race conditions.', keyPoints: ['EVAL script numkeys keys args', 'EVALSHA for cached scripts', 'SCRIPT LOAD/FLUSH', 'Atomic read-modify-write', 'redis.call vs pcall'], available: true },
  { title: 'Persistence: RDB & AOF', route: '/redis/persistence', badge: 'Persistence', description: 'RDB snapshots vs Append-Only File — durability trade-offs, configuration, and hybrid persistence.', keyPoints: ['RDB: periodic snapshot', 'AOF: every-write log', 'AOF rewrite (BGREWRITEAOF)', 'Hybrid RDB+AOF mode', 'No persistence for pure cache'], available: true },
  { title: 'Pub/Sub Messaging', route: '/redis/pub-sub', badge: 'Pub/Sub', description: 'Fire-and-forget publish/subscribe channels — SUBSCRIBE, PUBLISH, PSUBSCRIBE pattern matching.', keyPoints: ['SUBSCRIBE / PUBLISH', 'PSUBSCRIBE glob patterns', 'No message persistence', 'Client isolation', 'Use case: real-time notifications'], available: true },
  { title: 'Redis Streams', route: '/redis/streams', badge: 'Pub/Sub', description: 'Persistent, consumer-group message streams — XADD, XREAD, XGROUP for durable messaging.', keyPoints: ['XADD append to stream', 'XREAD and XREADGROUP', 'Consumer groups', 'XACK acknowledgement', 'Streams vs Pub/Sub'], available: true },
  { title: 'Caching Patterns', route: '/redis/caching-patterns', badge: 'Caching', description: 'Cache-aside, read-through, write-through, and write-behind caching strategies with Redis.', keyPoints: ['Cache-aside (lazy loading)', 'Read-through cache', 'Write-through and write-behind', 'TTL and eviction policies', 'Cache stampede prevention'], available: true },
  { title: 'Eviction Policies', route: '/redis/eviction-policies', badge: 'Caching', description: 'Configure maxmemory and eviction policies: LRU, LFU, random, and volatile-* variants.', keyPoints: ['noeviction: errors when full', 'allkeys-lru / volatile-lru', 'allkeys-lfu for frequency', 'volatile-ttl evicts soonest', 'maxmemory-samples tuning'], available: true },
  { title: 'Rate Limiting', route: '/redis/rate-limiting', badge: 'Caching', description: 'Implement fixed window, sliding window, and token bucket rate limiters using Redis primitives.', keyPoints: ['Fixed window with INCR+EXPIRE', 'Sliding window with sorted set', 'Token bucket with Lua', 'Redis cell module', 'Per-user API rate limits'], available: true },
  { title: 'Replication & Sentinel', route: '/redis/replication-sentinel', badge: 'Cluster', description: 'Primary-replica replication and Redis Sentinel for automatic failover and high availability.', keyPoints: ['Async replication', 'REPLICAOF command', 'Sentinel quorum voting', 'Automatic failover', 'Client redirection'], available: true },
  { title: 'Redis Cluster', route: '/redis/redis-cluster', badge: 'Cluster', description: 'Horizontal scaling via hash-slot-based sharding across multiple nodes.', keyPoints: ['16384 hash slots', 'CLUSTER INFO and NODES', 'Key hash tags {}', 'Cross-slot transactions', 'Resharding with redis-cli'], available: true },
  { title: 'Redis Stack & Modules', route: '/redis/redis-stack', badge: 'Data Structures', description: 'Redis Stack bundles RedisJSON, RediSearch, RedisTimeSeries, and RedisBloom for extended data capabilities.', keyPoints: ['RedisJSON: native JSON.SET/GET', 'RediSearch: full-text + vector search', 'Vector search: FT.SEARCH with KNN', 'RedisTimeSeries: time-series data', 'RedisBloom: probabilistic structures'], available: true },
  { title: 'Redis with Node.js', route: '/redis/redis-nodejs', badge: 'Reference', description: 'ioredis and node-redis clients — connection pooling, pipelines, and type-safe commands.', keyPoints: ['ioredis vs node-redis', 'Connection pool configuration', 'Pipeline for bulk commands', 'Cluster client mode', 'Error handling reconnect'], available: true },
  { title: 'Redis Security', route: '/redis/security', badge: 'Reference', description: 'Authentication with ACLs, TLS encryption, and binding to localhost in production.', keyPoints: ['requirepass legacy auth', 'ACL users and permissions', 'TLS for in-transit encryption', 'Bind to 127.0.0.1', 'Protected-mode default'], available: true },
  { title: 'Redis Cheat Sheet', route: '/redis/cheatsheet', badge: 'Reference', description: 'Quick-reference for all Redis commands, data types, and configuration options.', keyPoints: ['All data type commands', 'Persistence config', 'Cluster commands', 'ACL syntax', 'Connection options'], available: true },
  { title: 'Interview Prep', route: '/redis/interview-prep', badge: 'Reference', description: 'Junior to senior Redis interview questions covering architecture, caching, and production best practices.', keyPoints: ['Why Redis is single-threaded', 'When to use each data type', 'Persistence trade-offs', 'Cluster vs Sentinel', 'Cache invalidation strategies'], available: true },
];

@Component({ selector: 'app-redis-home', standalone: true, imports: [RouterLink], templateUrl: './home.html', styleUrl: './home.scss' })
export class RedisHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
