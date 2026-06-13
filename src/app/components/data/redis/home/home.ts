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
  { title: 'Redis Fundamentals', route: '/redis', badge: 'Foundations', description: 'In-memory key-value store — architecture, use cases, and how Redis differs from disk-based databases.', keyPoints: ['Single-threaded event loop', 'In-memory with optional persistence', 'Sub-millisecond latency', 'Data structure server', 'Redis vs Memcached'], available: false },
  { title: 'Installation & CLI', route: '/redis', badge: 'Foundations', description: 'Install Redis, configure redis.conf, connect with redis-cli, and understand basic key commands.', keyPoints: ['Redis server and cli', 'SET / GET / DEL', 'Key expiry with EXPIRE / TTL', 'Key naming conventions', 'Redis Insight GUI'], available: false },
  { title: 'Strings', route: '/redis', badge: 'Data Structures', description: 'Binary-safe strings — the most fundamental Redis type. INCR, APPEND, GETSET, and bit operations.', keyPoints: ['SET with EX, NX, XX options', 'INCR/INCRBY counters', 'APPEND to build strings', 'GETDEL and GETEX', 'SETBIT / GETBIT / BITCOUNT'], available: false },
  { title: 'Hashes', route: '/redis', badge: 'Data Structures', description: 'Maps of field-value pairs stored under a single key — ideal for representing objects.', keyPoints: ['HSET, HGET, HMGET', 'HGETALL returns all fields', 'HINCRBY for numeric fields', 'HSCAN for large hashes', 'Memory efficiency with ziplist'], available: false },
  { title: 'Lists', route: '/redis', badge: 'Data Structures', description: 'Doubly linked lists for queues, stacks, and message buffers — LPUSH, RPUSH, LPOP, LRANGE.', keyPoints: ['LPUSH / RPUSH / LPOP / RPOP', 'LRANGE for slices', 'LLEN and LINDEX', 'BLPOP/BRPOP blocking pop', 'Circular buffer with LTRIM'], available: false },
  { title: 'Sets', route: '/redis', badge: 'Data Structures', description: 'Unordered collections of unique strings — SADD, SMEMBERS, SINTER, SUNION, SDIFF.', keyPoints: ['SADD, SREM, SMEMBERS', 'Set intersection SINTER', 'Set union SUNION', 'SISMEMBER lookup O(1)', 'Tracking unique visitors'], available: false },
  { title: 'Sorted Sets', route: '/redis', badge: 'Data Structures', description: 'Sets ordered by a floating-point score — leaderboards, rate limiting, and range queries.', keyPoints: ['ZADD with score', 'ZRANGE by rank or score', 'ZRANK and ZSCORE', 'ZINCRBY for leaderboards', 'Lexicographic ranges ZRANGEBYLEX'], available: false },
  { title: 'Key Commands & Patterns', route: '/redis', badge: 'Commands', description: 'Key lifecycle commands — KEYS, SCAN, DUMP/RESTORE, RENAME, TYPE, OBJECT ENCODING.', keyPoints: ['SCAN vs KEYS (production safe)', 'DUMP/RESTORE for migration', 'OBJECT ENCODING internals', 'RENAME atomicity', 'PERSIST to remove TTL'], available: false },
  { title: 'Transactions (MULTI/EXEC)', route: '/redis', badge: 'Commands', description: 'Atomic command batching with MULTI/EXEC, DISCARD, and optimistic locking with WATCH.', keyPoints: ['MULTI/EXEC batch', 'DISCARD to cancel', 'WATCH for optimistic locking', 'Error handling in pipeline', 'Lua scripting alternative'], available: false },
  { title: 'Lua Scripting', route: '/redis', badge: 'Commands', description: 'Execute Lua scripts atomically with EVAL — combine multiple operations without race conditions.', keyPoints: ['EVAL script numkeys keys args', 'EVALSHA for cached scripts', 'SCRIPT LOAD/FLUSH', 'Atomic read-modify-write', 'redis.call vs pcall'], available: false },
  { title: 'Persistence: RDB & AOF', route: '/redis', badge: 'Persistence', description: 'RDB snapshots vs Append-Only File — durability trade-offs, configuration, and hybrid persistence.', keyPoints: ['RDB: periodic snapshot', 'AOF: every-write log', 'AOF rewrite (BGREWRITEAOF)', 'Hybrid RDB+AOF mode', 'No persistence for pure cache'], available: false },
  { title: 'Pub/Sub Messaging', route: '/redis', badge: 'Pub/Sub', description: 'Fire-and-forget publish/subscribe channels — SUBSCRIBE, PUBLISH, PSUBSCRIBE pattern matching.', keyPoints: ['SUBSCRIBE / PUBLISH', 'PSUBSCRIBE glob patterns', 'No message persistence', 'Client isolation', 'Use case: real-time notifications'], available: false },
  { title: 'Redis Streams', route: '/redis', badge: 'Pub/Sub', description: 'Persistent, consumer-group message streams — XADD, XREAD, XGROUP for durable messaging.', keyPoints: ['XADD append to stream', 'XREAD and XREADGROUP', 'Consumer groups', 'XACK acknowledgement', 'Streams vs Pub/Sub'], available: false },
  { title: 'Caching Patterns', route: '/redis', badge: 'Caching', description: 'Cache-aside, read-through, write-through, and write-behind caching strategies with Redis.', keyPoints: ['Cache-aside (lazy loading)', 'Read-through cache', 'Write-through and write-behind', 'TTL and eviction policies', 'Cache stampede prevention'], available: false },
  { title: 'Eviction Policies', route: '/redis', badge: 'Caching', description: 'Configure maxmemory and eviction policies: LRU, LFU, random, and volatile-* variants.', keyPoints: ['noeviction: errors when full', 'allkeys-lru / volatile-lru', 'allkeys-lfu for frequency', 'volatile-ttl evicts soonest', 'maxmemory-samples tuning'], available: false },
  { title: 'Rate Limiting', route: '/redis', badge: 'Caching', description: 'Implement fixed window, sliding window, and token bucket rate limiters using Redis primitives.', keyPoints: ['Fixed window with INCR+EXPIRE', 'Sliding window with sorted set', 'Token bucket with Lua', 'Redis cell module', 'Per-user API rate limits'], available: false },
  { title: 'Replication & Sentinel', route: '/redis', badge: 'Cluster', description: 'Primary-replica replication and Redis Sentinel for automatic failover and high availability.', keyPoints: ['Async replication', 'REPLICAOF command', 'Sentinel quorum voting', 'Automatic failover', 'Client redirection'], available: false },
  { title: 'Redis Cluster', route: '/redis', badge: 'Cluster', description: 'Horizontal scaling via hash-slot-based sharding across multiple nodes.', keyPoints: ['16384 hash slots', 'CLUSTER INFO and NODES', 'Key hash tags {}', 'Cross-slot transactions', 'Resharding with redis-cli'], available: false },
  { title: 'Redis with Node.js', route: '/redis', badge: 'Reference', description: 'ioredis and node-redis clients — connection pooling, pipelines, and type-safe commands.', keyPoints: ['ioredis vs node-redis', 'Connection pool configuration', 'Pipeline for bulk commands', 'Cluster client mode', 'Error handling reconnect'], available: false },
  { title: 'Redis Security', route: '/redis', badge: 'Reference', description: 'Authentication with ACLs, TLS encryption, and binding to localhost in production.', keyPoints: ['requirepass legacy auth', 'ACL users and permissions', 'TLS for in-transit encryption', 'Bind to 127.0.0.1', 'Protected-mode default'], available: false },
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
