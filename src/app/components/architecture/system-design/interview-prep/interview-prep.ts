import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';

interface IPQuestion {
  id: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  question: string;
  keyPoints: string[];
  answer: string;
}

@Component({
  selector: 'app-sysdesign-interview-prep',
  standalone: true,
  imports: [CommonModule, PageMetaComponent],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
})
export class SysdesignInterviewPrep {
  questions: IPQuestion[] = [
    {
      id: 1, difficulty: 'Easy', topic: 'Caching',
      question: 'When would you choose Redis over a database for storing data?',
      keyPoints: ['In-memory = sub-ms latency', 'Volatile by default (RDB/AOF for persistence)', 'Use for: sessions, rate limiting, leaderboards, hot-path cache'],
      answer: 'Redis is ideal when read latency must be sub-millisecond and data fits in memory. Use it for session storage, rate limiting counters (INCR + EXPIRE), leaderboards (Sorted Sets), and caching hot database rows (cache-aside). It is not a primary database — data loss on crash unless RDB/AOF persistence is enabled. For durable, queryable, relational data use PostgreSQL.',
    },
    {
      id: 2, difficulty: 'Easy', topic: 'Scaling',
      question: 'What is the difference between vertical and horizontal scaling?',
      keyPoints: ['Vertical: bigger single machine — has a ceiling', 'Horizontal: more identical machines — near-unlimited', 'Horizontal requires stateless design + load balancer'],
      answer: 'Vertical scaling (scale-up): add more CPU/RAM/disk to a single machine. Simple but has a physical ceiling (largest EC2 instance) and creates a single point of failure. Horizontal scaling (scale-out): add more identical machines behind a load balancer. Near-unlimited capacity but requires stateless application design — sessions in Redis, files in S3, no local state.',
    },
    {
      id: 3, difficulty: 'Medium', topic: 'Database',
      question: 'How would you design a database schema to avoid N+1 query problems?',
      keyPoints: ['N+1: fetch N parents + N separate child queries', 'Fix: JOIN in one query, or batch-fetch by IDs', 'Denormalise frequently-joined data into parent table'],
      answer: 'N+1 occurs when you fetch a list of N items, then make N separate queries for related data. Fix by: (1) JOIN: combine in one SQL query. (2) Batch fetch: collect all child IDs, query WHERE id IN (...) once. (3) Denormalise: embed frequently-read child data in the parent row (e.g. author name/avatar in posts table). Choose denormalisation when the child data is read far more than updated.',
    },
    {
      id: 4, difficulty: 'Medium', topic: 'Availability',
      question: 'How do you calculate the combined availability of a system with multiple components?',
      keyPoints: ['Serial: multiply each availability', '99.9% × 99.9% = 99.8%', 'Parallel redundancy: 1 - (1-A)^N'],
      answer: 'For components in series (all must work): multiply availabilities. Three 99.9% components in series = 0.999³ = 99.7%. This is why every added dependency lowers availability. For parallel redundancy (any one must work): 1 - (1 - A)^N. Two 99% servers in parallel = 1 - (0.01)² = 99.99%. Design to minimise serial dependencies and add redundancy where possible.',
    },
    {
      id: 5, difficulty: 'Medium', topic: 'Consistency',
      question: 'Explain the difference between strong consistency and eventual consistency.',
      keyPoints: ['Strong: every read sees the latest write (single node or sync replication)', 'Eventual: reads may lag behind writes but will converge', 'Choose based on business requirement — payments need strong'],
      answer: 'Strong consistency: after a write completes, all subsequent reads from any node return that value. Requires synchronous replication — adds latency. Required for: financial balances, inventory, auth. Eventual consistency: after a write, reads may return stale data but will eventually converge. Faster, more available. Acceptable for: social likes/views, user preferences, caches. DNS is eventually consistent — changes propagate over minutes.',
    },
    {
      id: 6, difficulty: 'Medium', topic: 'Messaging',
      question: 'When would you use Kafka vs a simple task queue like SQS?',
      keyPoints: ['Kafka: ordered, replayable event log, multiple consumers', 'SQS: simple task dispatch, at-least-once, no replay', 'Kafka for event sourcing, CDC, analytics pipelines'],
      answer: 'Use SQS when: tasks can be retried independently, no ordering required, simple fan-out to workers. Use Kafka when: multiple independent consumer groups need the same events (e.g. analytics + email + notifications from one event); events must be replayed (reprocess historical data); strict ordering within a partition is needed; log compaction for CDC. Kafka has higher operational complexity — justify it with multi-consumer or replay requirements.',
    },
    {
      id: 7, difficulty: 'Medium', topic: 'API Design',
      question: 'How would you design an API for pagination of a large dataset?',
      keyPoints: ['Offset: simple but unstable (items shift on insert)', 'Cursor: stable, uses last-seen ID/timestamp as anchor', 'Keyset: most efficient — WHERE id > :cursor'],
      answer: 'Offset pagination (OFFSET N LIMIT 20) is simple but unstable — new items shift page boundaries causing duplicates. Cursor-based: return the last item\'s ID/timestamp as a cursor; next page is WHERE created_at < :cursor LIMIT 20. This is stable and O(log N) with an index. Keyset pagination is the most efficient form: WHERE (created_at, id) < (:ts, :id) ORDER BY created_at DESC, id DESC. Always return a nextCursor in the response; null means last page.',
    },
    {
      id: 8, difficulty: 'Hard', topic: 'Sharding',
      question: 'How do you choose a sharding key and what happens when you pick the wrong one?',
      keyPoints: ['Good key: high cardinality, even distribution, aligned with query pattern', 'Bad key: hot shard (celebrity effect), cross-shard queries', 'Rebalancing after wrong choice is expensive'],
      answer: 'A good sharding key has high cardinality (many distinct values), distributes writes evenly, and aligns with the most common query pattern. user_id is ideal for user-centric data. A bad key creates hot shards: sharding tweets by user_id means Elon Musk\'s shard is overwhelmed. Fix: use consistent hashing (virtual nodes) for even distribution; or shard by hash(user_id) not raw user_id. Cross-shard queries require scatter-gather — minimise by denormalising or co-locating related data on the same shard.',
    },
    {
      id: 9, difficulty: 'Hard', topic: 'Distributed Systems',
      question: 'How do you handle a network partition between two datacenters?',
      keyPoints: ['CAP theorem: partition forces choice between C and A', 'CP: reject writes to minority partition (banking)', 'AP: accept writes, resolve conflicts later (shopping cart)'],
      answer: 'Per CAP theorem, during a partition you must choose Consistency or Availability. CP systems: reject writes on the minority side (leader refuses without quorum). Data is always consistent; some requests fail. Used for: financial transactions, inventory. AP systems: accept writes on both sides, sync and resolve conflicts when partition heals. Last-write-wins or CRDTs. Used for: shopping carts, user preferences, social activity. The choice must match the business requirement — never sacrifice correctness for financial data.',
    },
    {
      id: 10, difficulty: 'Hard', topic: 'Real Systems',
      question: 'Design the data model for a global rate limiter that works across 10 datacenters.',
      keyPoints: ['Local Redis per DC: fast but allows 10× the intended limit', 'Centralized Redis: accurate but adds cross-DC latency', 'Hybrid: local budget + periodic sync to global counter'],
      answer: 'Option A (Local Redis per DC): each DC tracks its own counter. Simple, sub-ms, but a user can make 10× the limit if distributed across DCs. Acceptable for soft limits (spam prevention). Option B (Centralized Redis): single source of truth, accurate. Adds 50-150ms cross-DC latency on every request. Option C (Hybrid/token budget): allocate a fraction of the limit to each DC (10 DCs × 10% budget = 100%). Each DC tracks locally; when budget depletes, synchronise with global counter. Best of both: fast locally, accurate globally. Sync interval = rate limit window / 10.',
    },
    {
      id: 11, difficulty: 'Medium', topic: 'Storage',
      question: 'What is the difference between object storage, block storage, and file storage?',
      keyPoints: ['Object: key-value blobs (S3) — infinite scale, no hierarchy', 'Block: raw volumes (EBS) — low latency, filesystem on top', 'File: NFS/EFS — shared filesystem for multiple servers'],
      answer: 'Object storage (S3, GCS): stores arbitrary blobs addressed by key. No directory hierarchy. Infinite scale, cheap, HTTP API. Use for: media files, backups, static websites. Block storage (EBS, Azure Disk): raw byte-addressable volumes attached to one VM. Low latency, formatted as filesystem. Use for: database data files, OS volumes. File storage (EFS, Azure Files): NFS-compatible shared filesystem mounted by multiple servers. Use for: shared config files, content that many servers read/write simultaneously.',
    },
    {
      id: 12, difficulty: 'Hard', topic: 'Real Systems',
      question: 'How does Google Spanner achieve globally consistent transactions?',
      keyPoints: ['TrueTime API: atomic clocks + GPS = bounded clock uncertainty', 'Commit wait: transaction waits for TrueTime uncertainty to pass', 'Paxos replication across zones for strong consistency'],
      answer: 'Spanner uses Google\'s TrueTime API — atomic clocks and GPS receivers in each datacenter bound clock uncertainty to < 7ms. Transactions are assigned a commit timestamp. To ensure external consistency, Spanner waits for TrueTime\'s uncertainty interval to pass before making a commit visible (commit wait). This guarantees if tx1 commits before tx2 starts (in wall clock time), tx1\'s timestamp < tx2\'s timestamp globally. Paxos replication across multiple zones provides strong consistency and HA. The result: a globally distributed ACID database with serializable isolation.',
    },
    {
      id: 13, difficulty: 'Easy', topic: 'CDN',
      question: 'What types of content should and should not be served from a CDN?',
      keyPoints: ['Good CDN: static, rarely-changed, globally consumed', 'Bad CDN: personalised, real-time, auth-gated content', 'Cache-Control headers control CDN behaviour'],
      answer: 'Good CDN candidates: static assets (JS, CSS, images), video segments (immutable), public API responses with Cache-Control: public. Use immutable for content-addressed filenames. Not suitable for CDN: personalised content (user-specific data — cache key must include user ID or bypass cache), authenticated endpoints (CDN may serve one user\'s data to another), real-time data (live feeds, stock prices — stale is wrong). Set Cache-Control: private or no-store for user-specific responses.',
    },
    {
      id: 14, difficulty: 'Medium', topic: 'Reliability',
      question: 'What is the difference between a circuit breaker and a retry with back-off?',
      keyPoints: ['Retry handles transient failures', 'Circuit breaker handles sustained failures (service is down)', 'Use both together: retry within closed circuit; circuit opens after threshold'],
      answer: 'Retry handles transient failures — a brief network glitch or momentary overload. Exponential back-off + jitter prevents thundering herd. Circuit breaker handles sustained failures — the downstream service is down. After N failures, the circuit opens: all calls fail immediately without a network attempt. After a reset timeout, a probe request tests recovery (half-open state). Use both: retry within a closed circuit (transient); circuit opens after threshold (sustained). Without a circuit breaker, retries against a failed service exhaust threads.',
    },
    {
      id: 15, difficulty: 'Hard', topic: 'Distributed Transactions',
      question: 'Why is Two-Phase Commit (2PC) problematic in microservices and what do you use instead?',
      keyPoints: ['2PC blocks if coordinator crashes between phases', 'Participants hold locks during uncertainty window', 'Alternative: Saga pattern with compensating transactions + outbox'],
      answer: '2PC requires all participants to hold locks while waiting for the coordinator\'s Phase 2 decision. If the coordinator crashes between phases, participants are indefinitely blocked — a blocking protocol. In microservices across the internet, coordinator downtime causes cascading lock timeouts. Alternative: Saga pattern. Each service executes a local transaction and publishes an event. On failure: compensating transactions (undo) execute in reverse order. Use orchestration Saga (central coordinator like Temporal) for complex flows. Add the outbox pattern for reliable event publishing.',
    },
    {
      id: 16, difficulty: 'Medium', topic: 'Search',
      question: 'How would you implement autocomplete for a search box at scale?',
      keyPoints: ['Prefix trie: in-memory, O(prefix_len), but memory-heavy', 'ES completion suggester: FST-based, very fast', 'Cache in Redis: TTL=60s for popular prefixes'],
      answer: 'Two main approaches: (1) Prefix trie: in-memory sorted trie of popular queries. O(prefix_length) lookup. Rebuilt from query logs hourly. Memory: ~1 GB for top 10M queries. Served from a dedicated suggestion service. (2) Elasticsearch completion suggester: FST (Finite State Transducer) compiled from all indexed terms. Extremely fast, handles fuzzy matching. Add a separate suggest field with edge_ngram analyser. Both: cache results in Redis keyed by prefix (TTL=60s). Debounce client to 300ms. P99 target: < 50ms for suggestions.',
    },
    {
      id: 17, difficulty: 'Hard', topic: 'Real Systems',
      question: 'Design the notification system for a social network (like/comment/follow events).',
      keyPoints: ['Fan-out: one event → N user notifications', 'Storage: per-user notification list in Cassandra or Redis', 'Delivery: WebSocket (online), FCM/APNs (offline)'],
      answer: 'Pipeline: action event (like/comment) → Kafka "notifications" topic → Notification Service → fan-out to recipient. Storage: Cassandra table partitioned by recipient_user_id, clustered by created_at DESC — efficient per-user pagination. Delivery: if recipient is online (WebSocket connection to server), push directly. If offline: send FCM/APNs push notification. Aggregation: batch similar events ("Alice and 24 others liked your post") — aggregate within a 30-min window per (actor_type, object_id) using Redis sorted set. Unread count: Redis INCR counter per user, reset to 0 on notification open.',
    },
    {
      id: 18, difficulty: 'Medium', topic: 'Security',
      question: 'How do you prevent SQL injection in a web application?',
      keyPoints: ['Parameterised queries / prepared statements — always', 'ORMs use parameterised queries by default', 'Never concatenate user input into SQL strings'],
      answer: 'Always use parameterised queries (prepared statements). The DB driver separates query structure from data — user input can never alter the query logic. Example: db.query("SELECT * FROM users WHERE email = ?", [email]) — the ? is a placeholder. Never do: "SELECT * FROM users WHERE email = \'" + email + "\'". ORMs (Prisma, TypeORM, Django ORM) use parameterised queries by default but can be bypassed with raw query methods — audit those. Additional defences: input validation, least-privilege DB user, WAF rules. Parameterisation is the only reliable defence.',
    },
    {
      id: 19, difficulty: 'Hard', topic: 'Real Systems',
      question: 'How would you design Twitter\'s trending topics feature?',
      keyPoints: ['Count hashtag mentions in sliding window', 'Lambda architecture: real-time Kafka + batch recalculation', 'Top-K using min-heap or Count-Min Sketch for approximation'],
      answer: 'Count hashtag frequency in a sliding time window (last 1 hour). Two approaches: (1) Exact count: Kafka consumer increments Redis counters per hashtag, ZADD trending sorted set by count, ZREVRANGE for top 10. Problem: millions of hashtags → memory. (2) Count-Min Sketch: probabilistic data structure, O(1) update, bounded memory, approximate count. For top-K: maintain a min-heap of size K — add hashtag if count > heap minimum. Batch recalculation every 5 min (Spark/Flink) corrects drift. Geo-segmentation: trending per country by filtering by user location.',
    },
    {
      id: 20, difficulty: 'Hard', topic: 'Distributed Systems',
      question: 'How does consistent hashing work and why is it better than modulo hashing for distributed caches?',
      keyPoints: ['Modulo: adding node → almost all keys remap (cache stampede)', 'Consistent hashing: only K/N keys remap when adding 1 of N nodes', 'Virtual nodes: even distribution despite unequal physical nodes'],
      answer: 'Modulo hashing (key % N): adding one server changes N to N+1, remapping almost all keys. In a cache cluster, this causes a massive cache miss storm — every request hits the DB simultaneously. Consistent hashing: nodes and keys are placed on a circular ring by hash. A key is served by the next clockwise node. Adding a node: only the keys between the new node and its predecessor remap — approximately K/N out of K total keys. Virtual nodes: assign each physical node M positions on the ring for even distribution. Redis Cluster uses hash slots (16384) with a similar principle. Result: adding/removing nodes causes minimal disruption.',
    },
  ];

  difficultyClass(d: string): string {
    return d === 'Easy' ? 'easy' : d === 'Medium' ? 'medium' : 'hard';
  }
}
