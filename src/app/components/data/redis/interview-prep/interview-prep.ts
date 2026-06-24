import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';

interface InterviewQ {
  q: string;
  a: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

@Component({
  selector: 'app-redis-interview-prep',
  standalone: true,
  imports: [CommonModule, PageMetaComponent],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
})
export class RedisInterviewPrep {
  activeTag = signal('all');
  activeDiff = signal('all');
  openIndex = signal<number | null>(null);

  tags = ['all', 'fundamentals', 'data-types', 'performance', 'persistence', 'ha', 'caching', 'security', 'patterns'];
  difficulties = ['all', 'easy', 'medium', 'hard'];

  questions: InterviewQ[] = [
    {
      q: 'What is Redis and what makes it different from a traditional database?',
      a: 'Redis (Remote Dictionary Server) is an in-memory data structure store — it keeps its entire dataset in RAM, making reads and writes typically sub-millisecond. Unlike traditional databases that write to disk on every operation, Redis works primarily from memory and optionally persists to disk via RDB snapshots or AOF log. It also differs by supporting rich data types (strings, hashes, lists, sets, sorted sets, streams) rather than just rows/columns.',
      tags: ['fundamentals'],
      difficulty: 'easy',
    },
    {
      q: 'Why is Redis single-threaded and how does it achieve high throughput?',
      a: 'Redis uses a single-threaded event loop for command processing — there is no concurrency within command execution, which eliminates locking complexity and context-switch overhead. High throughput comes from: (1) all data in memory — no disk I/O on the hot path; (2) the event loop processes thousands of short commands per millisecond; (3) clients can pipeline commands, sending many in one TCP packet. Redis 6+ added multi-threading for I/O (reading/writing network data) while keeping command execution single-threaded.',
      tags: ['fundamentals', 'performance'],
      difficulty: 'medium',
    },
    {
      q: 'Explain the difference between Redis persistence modes: RDB, AOF, and Hybrid.',
      a: 'RDB (Redis Database): periodic binary snapshots of the dataset. Fast to load on restart, compact file, but data since the last snapshot can be lost on crash. Triggered by BGSAVE (async fork). AOF (Append-Only File): logs every write command. More durable (appendfsync everysec = max 1s loss), but larger files and slower restarts since all commands must be replayed. Hybrid (aof-use-rdb-preamble yes, default in Redis 7+): the AOF file starts with an RDB snapshot followed by incremental AOF commands. Combines fast restart (binary RDB preamble) with durability (short AOF tail). Recommended for production.',
      tags: ['persistence'],
      difficulty: 'medium',
    },
    {
      q: 'What is a cache stampede and how do you prevent it with Redis?',
      a: 'Cache stampede (dog-pile effect): when a hot cache key expires, many concurrent requests simultaneously miss the cache and all query the database at once, causing a spike in DB load. Prevention strategies: (1) Mutex lock — first request acquires SET lockKey 1 NX EX 5, fetches from DB, populates cache; others wait. (2) Stale-while-revalidate — serve stale data immediately while refreshing in the background. (3) Probabilistic early revalidation — refresh before TTL expires with increasing probability as expiry approaches. (4) Background refresh jobs proactively renew hot keys before expiry.',
      tags: ['caching', 'patterns', 'performance'],
      difficulty: 'medium',
    },
    {
      q: 'What is the difference between KEYS and SCAN? When should you use each?',
      a: 'KEYS pattern is O(N) and blocks the Redis event loop for the entire scan — on a 10M-key instance, KEYS * can block Redis for seconds, causing client timeouts. Never use in production. SCAN cursor [MATCH p] [COUNT n] iterates in batches without blocking. Each call returns a cursor; iterate until cursor returns to "0". COUNT is a hint, not a limit. SCAN may return duplicates during rehashing — deduplicate results in application code. Use SCAN always in production. KEYS is only acceptable in development/debugging on non-production instances.',
      tags: ['performance', 'fundamentals'],
      difficulty: 'easy',
    },
    {
      q: 'What are Redis eviction policies and when would you use each?',
      a: 'When maxmemory is reached, Redis uses the eviction policy to decide which key to remove: noeviction (default) — reject writes with OOM error; allkeys-lru — evict least recently used key from entire keyspace (best for pure cache); volatile-lru — LRU among keys with TTL set (good for mixed persistent + cache); allkeys-lfu — evict least frequently used (best when some keys are always hot); volatile-lfu — LFU among TTL keys; allkeys-random — random key; volatile-ttl — key closest to expiry. For a pure cache, allkeys-lru or allkeys-lfu. For mixed persistent + cache data, volatile-lru. Never use noeviction for a cache role.',
      tags: ['performance', 'caching'],
      difficulty: 'medium',
    },
    {
      q: 'Explain MULTI/EXEC transactions in Redis. Does Redis support rollback?',
      a: 'MULTI begins a transaction block — all subsequent commands are queued (Redis replies QUEUED). EXEC executes all queued commands atomically with no other client interleaving. DISCARD empties the queue. Redis does NOT support rollback on runtime errors: if command 3 of 5 fails (e.g. INCR on a non-integer key), commands 4 and 5 still execute. Only syntax errors at queue time abort the whole transaction. For rollback semantics, use Lua scripts (EVAL) which can check conditions and return errors without side effects.',
      tags: ['fundamentals', 'patterns'],
      difficulty: 'medium',
    },
    {
      q: 'What is optimistic locking in Redis and how does WATCH implement it?',
      a: 'Optimistic locking assumes conflicts are rare — you read a value, compute a new value, and write it back, but only if no one else changed the value in between. WATCH key sets an optimistic lock. If any watched key is modified by another client between WATCH and EXEC, EXEC returns nil (transaction aborted). Pattern: WATCH key → GET key → MULTI → SET key newval → EXEC. If nil returned, retry the cycle. Use UNWATCH to cancel manually. Watch is per-connection — use a dedicated connection per optimistic-lock operation to avoid interference in concurrent request handling.',
      tags: ['patterns', 'fundamentals'],
      difficulty: 'hard',
    },
    {
      q: 'What are Redis Streams and how do they differ from Pub/Sub and Lists?',
      a: 'Redis Streams are a persistent, ordered, append-only log. Unlike Pub/Sub: messages are stored (can be replayed); consumers have named groups with acknowledgement. Unlike Lists: entries have auto-generated time-based IDs; multiple independent consumer groups each see all messages. Streams support consumer groups (XREADGROUP): a group distributes messages across workers (each message delivered to one consumer), tracks delivery in the PEL (Pending Entry List), and supports XACK for at-least-once delivery. Use Pub/Sub for ephemeral real-time fanout (loss acceptable). Use Streams for reliable job queues and event logs.',
      tags: ['data-types', 'patterns'],
      difficulty: 'hard',
    },
    {
      q: 'How does Redis Sentinel provide high availability?',
      a: 'Sentinel is a separate process that monitors Redis masters and replicas. Failover process: (1) Sentinel detects master is unreachable (SDOWN — subjectively down). (2) A quorum of Sentinels agree it is down (ODOWN — objectively down). (3) A Sentinel leader is elected. (4) Best replica selected (by replica-priority, replication offset, run ID). (5) Replica promoted to master; other replicas repointed. (6) Clients notified via Pub/Sub. Clients connect via Sentinel — Sentinel returns the current master address. Always deploy 3+ Sentinels (odd number) across different AZs. With 3 Sentinels, quorum=2 tolerates one Sentinel failure.',
      tags: ['ha'],
      difficulty: 'medium',
    },
    {
      q: 'Explain Redis Cluster data distribution and hash slots.',
      a: 'Redis Cluster divides the keyspace into 16384 hash slots. Each key maps to a slot via CRC16(key) % 16384. Each master node owns a range of slots (e.g. 3 masters: 0–5460, 5461–10922, 10923–16383). When a client sends a command to the wrong node, the node replies with MOVED slot host:port — the client retries on the correct node. Smart clients (ioredis.Cluster) maintain a slot map and route automatically. Hash tags {tag}: only the content inside {} is hashed, forcing multiple keys to the same slot — required for multi-key commands (MGET, MSET, Lua scripts) across the same entity.',
      tags: ['ha', 'performance'],
      difficulty: 'hard',
    },
    {
      q: 'What are common Redis caching patterns?',
      a: 'Cache-Aside (Lazy Loading): app checks cache → miss → fetch from DB → write to cache. Most common; cache only populated with accessed data; simple fallback if Redis unavailable. Write-Through: write to cache AND DB synchronously on every update — always consistent, higher write latency, caches all written data even if rarely read. Write-Behind (Write-Back): write to cache only; async flush to DB — lowest write latency, risk of data loss if Redis crashes before flush. Read-Through: cache auto-loads on miss (requires cache library support). Negative caching: cache null results with short TTL to prevent repeated DB misses for non-existent keys.',
      tags: ['caching', 'patterns'],
      difficulty: 'medium',
    },
    {
      q: 'How do you implement a rate limiter with Redis?',
      a: 'Fixed Window: INCR key; EXPIRE on count==1; reject if count > limit. Simple, O(1), but allows 2× burst at window boundary. Sliding Window Log: ZADD timestamp, ZREMRANGEBYSCORE old entries, ZCARD. Accurate but O(log N), stores all request timestamps. Sliding Window Counter (two-bucket): maintain current + previous window counters; estimate = current + prev × ((window - elapsed) / window). O(1) memory, good accuracy — used by Cloudflare. Token Bucket: refill tokens based on elapsed time, deduct 1 per request — allows bursting up to capacity. Must be Lua script for atomicity. Always return X-RateLimit-Remaining and Retry-After headers.',
      tags: ['patterns', 'performance'],
      difficulty: 'hard',
    },
    {
      q: 'What is the difference between DEL and UNLINK?',
      a: 'DEL key removes the key and frees its memory synchronously — the Redis event loop blocks during memory deallocation. For large values (a hash with 100k fields, a list with millions of entries), DEL can block Redis for milliseconds or longer. UNLINK key removes the key from the keyspace atomically (making it invisible to other commands) but defers the actual memory deallocation to a background thread, returning immediately. Always prefer UNLINK for large data structures. DEL is fine for small values (strings, small hashes) where deallocation is negligible.',
      tags: ['performance', 'fundamentals'],
      difficulty: 'easy',
    },
    {
      q: 'How does Redis handle memory when it runs out?',
      a: 'When Redis hits the maxmemory limit, it applies the configured eviction policy before each write command: noeviction returns OOM error (default — wrong for caches); allkeys-lru evicts the least recently used key from the full keyspace; volatile-lru evicts LRU among keys with TTL; allkeys-lfu evicts the least frequently used. Redis uses a probabilistic LRU/LFU approximation: it samples maxmemory-samples (default 5) random keys and evicts the worst candidate — not a true LRU list. Without maxmemory set, Redis grows until the OS OOM-killer terminates it. Always set maxmemory + eviction policy in production.',
      tags: ['performance', 'caching'],
      difficulty: 'medium',
    },
    {
      q: 'What Redis security measures should you apply in production?',
      a: 'Network: bind to private/loopback IPs only (never 0.0.0.0 without a password); use security groups to restrict port 6379 access. Authentication: use ACL (Redis 6+) for per-user access control with passwords, key patterns (~session:*), and command restrictions (-@dangerous). TLS: enable tls-port with cert/key files for encrypted connections. Disable dangerous commands: use ACL -@dangerous or rename-command FLUSHALL "" for legacy setups. No data-at-rest encryption: rely on OS filesystem encryption (dm-crypt, encrypted EBS). Never log the full Redis error object — it may contain connection URLs with credentials.',
      tags: ['security'],
      difficulty: 'medium',
    },
    {
      q: 'What are Lua scripts in Redis and when should you use them over MULTI/EXEC?',
      a: 'EVAL runs a Lua script atomically on the Redis server — no other command can execute between any Redis calls inside the script. Unlike MULTI/EXEC, Lua supports conditional logic: you can read a value and branch within the same atomic operation. Use Lua when: (1) you need conditional logic (if value > threshold, set X else set Y); (2) you need multiple reads and writes that depend on each other; (3) you want fewer roundtrips. Use MULTI/EXEC when: you need simple atomic batching without conditions. Caveat: Lua scripts are cached by SHA1 — reload with SCRIPT LOAD after server restart. Always pass key names via KEYS[] (not hardcoded) for Redis Cluster compatibility.',
      tags: ['patterns', 'fundamentals'],
      difficulty: 'hard',
    },
    {
      q: 'What is pipeline in Redis and how does it differ from a transaction?',
      a: 'Pipelining sends multiple commands in a single TCP packet and reads all replies at once, eliminating per-command round-trip latency. Commands are independent — they execute in order but are NOT atomic (another client can interleave between them). MULTI/EXEC is atomic — commands are queued and executed without interruption, but replies return as an array from EXEC. Pipeline ≠ transaction. Use pipelining for batching many independent commands for throughput. Use MULTI/EXEC when you need atomicity. Use pipelining + MULTI/EXEC together — ioredis sends the entire MULTI...EXEC block in a single network write automatically.',
      tags: ['performance', 'patterns'],
      difficulty: 'medium',
    },
    {
      q: 'How do you handle Redis connection failures gracefully in Node.js?',
      a: 'Always attach an error event listener — unhandled EventEmitter errors crash Node.js. Use exponential backoff for reconnection (ioredis retryStrategy, node-redis reconnectStrategy). ioredis queues commands during reconnection and replays them after reconnect by default. For Pub/Sub, re-subscribe on reconnect (ioredis does this automatically). Use separate connections for publishing vs subscribing — subscribed connections cannot run regular commands. For Sentinel setups, connect via the Sentinel API and let the client discover the new master after failover. Circuit-break Redis calls if repeated failures would cascade to your database.',
      tags: ['fundamentals', 'ha'],
      difficulty: 'medium',
    },
    {
      q: 'Explain how sorted sets work internally and their time complexity.',
      a: 'Redis sorted sets use a hybrid internal encoding: listpack (formerly ziplist) for small sets (≤128 members, values ≤64 bytes) — compact, cache-friendly, O(N) for range operations. skiplist + hashtable for larger sets — the skip list provides O(log N) range queries (ZRANGEBYSCORE) and ordered traversal; the hashtable provides O(1) score lookups by member (ZSCORE, ZINCRBY). ZADD is O(log N); ZCARD is O(1); ZRANGE is O(log N + M) where M is the number of returned elements; ZRANGEBYSCORE is O(log N + M). Sorted sets are ideal for leaderboards, sliding-window rate limiting with timestamps as scores, and priority queues.',
      tags: ['data-types', 'performance'],
      difficulty: 'hard',
    },
  ];

  filtered = computed(() => {
    const tag = this.activeTag();
    const diff = this.activeDiff();
    return this.questions.filter(q =>
      (tag === 'all' || q.tags.includes(tag)) &&
      (diff === 'all' || q.difficulty === diff)
    );
  });

  toggle(i: number) {
    this.openIndex.set(this.openIndex() === i ? null : i);
  }

  diffLabel(d: string) {
    return d === 'easy' ? 'Easy' : d === 'medium' ? 'Medium' : 'Hard';
  }
}
