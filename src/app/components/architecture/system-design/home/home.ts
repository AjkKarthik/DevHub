import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  title: string; description: string; route: string; badge: string; available: boolean; keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  'Fundamentals': 'fundamentals', 'Scalability': 'scalability', 'Data': 'data',
  'Reliability': 'reliability', 'Real Systems': 'systems', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Fundamentals', 'Scalability', 'Data', 'Reliability', 'Real Systems', 'Reference'];

const ALL_TOPICS: Topic[] = [
  // Fundamentals
  { title: 'System Design Framework',   route: '/system-design/framework', badge: 'Fundamentals', available: true,
    description: 'A repeatable 4-step framework for any system design interview: clarify requirements, estimate scale, design high level, deep dive.',
    keyPoints: ['Step 1: Clarify functional and non-functional requirements', 'Step 2: Capacity estimation — QPS, storage, bandwidth', 'Step 3: High-level design + component selection'] },
  { title: 'Capacity Estimation',       route: '/system-design/capacity-estimation', badge: 'Fundamentals', available: true,
    description: 'Back-of-envelope calculations — QPS, storage, memory, bandwidth — the numbers every senior engineer must know.',
    keyPoints: ['1M DAU × 10 req/day = ~116 QPS', 'Storage estimate: entities × avg size × retention period', 'Always estimate read:write ratio first — it drives the design'] },
  { title: 'CAP & PACELC Theorems',     route: '/system-design/cap-theorem', badge: 'Fundamentals', available: true,
    description: 'Consistency, Availability, Partition Tolerance — you can have two out of three. PACELC extends this to latency.',
    keyPoints: ['CP systems: HBase, ZooKeeper, etcd', 'AP systems: Cassandra, DynamoDB, CouchDB', 'PACELC: even without partition, trade latency vs consistency'] },
  { title: 'Networking Fundamentals',   route: '/system-design/networking', badge: 'Fundamentals', available: true,
    description: 'TCP vs UDP, DNS, CDN, load balancers — the networking building blocks of every distributed system.',
    keyPoints: ['TCP: reliable ordered delivery; UDP: low-latency, best-effort', 'DNS: A record, CNAME, TTL, anycast routing', 'CDN: edge caching, origin pull vs push, cache invalidation'] },

  // Scalability
  { title: 'Horizontal vs Vertical Scaling', route: '/system-design/scaling', badge: 'Scalability', available: true,
    description: 'When to scale up (bigger machine) vs scale out (more machines) — and how stateless services enable scale-out.',
    keyPoints: ['Vertical has a ceiling; horizontal is theoretically unbounded', 'Stateless services scale out trivially — move state to shared cache/DB', 'Autoscaling groups: scale on CPU, memory, or custom metrics'] },
  { title: 'Load Balancing',            route: '/system-design/load-balancing', badge: 'Scalability', available: true,
    description: 'L4 vs L7 load balancers, algorithms (round-robin, least-connections, consistent hashing), and health checks.',
    keyPoints: ['L4: route by IP/TCP port; L7: route by HTTP headers, path, body', 'Consistent hashing minimises remapping when nodes are added/removed', 'Sticky sessions: use cautiously — prefer stateless servers'] },
  { title: 'Caching Strategies',        route: '/system-design/caching', badge: 'Scalability', available: true,
    description: 'Cache-aside, read-through, write-through, write-behind — plus cache eviction policies and stampede prevention.',
    keyPoints: ['Cache-aside: application manages the cache explicitly', 'Write-through: write to cache + DB atomically — safe but slower writes', 'Thundering herd: jitter TTLs, use probabilistic early expiration'] },
  { title: 'Content Delivery Networks', route: '/system-design/cdn', badge: 'Scalability', available: true,
    description: 'Edge nodes, cache-control headers, origin shield, dynamic vs static content acceleration.',
    keyPoints: ['PoP (Point of Presence): geographically distributed edge servers', 'Cache-Control: max-age, s-maxage, stale-while-revalidate', 'Origin shield: coalesces requests to origin during cache miss storms'] },
  { title: 'Database Sharding',         route: '/system-design/sharding', badge: 'Scalability', available: true,
    description: 'Horizontal partitioning by range, hash, or directory — hotspot issues and cross-shard joins.',
    keyPoints: ['Range sharding: easy range queries, hotspot risk', 'Hash sharding: even distribution, complex range queries', 'Consistent hashing with virtual nodes minimises rebalancing'] },

  // Data
  { title: 'SQL vs NoSQL',              route: '/system-design/sql-vs-nosql', badge: 'Data', available: true,
    description: 'When to choose relational (ACID, joins, transactions) vs NoSQL (scale, flexible schema, specific access patterns).',
    keyPoints: ['SQL: complex queries, strong consistency, normalised schema', 'Key-value: ultra-low latency, simple lookups (Redis, DynamoDB)', 'Document: nested data, flexible schema (MongoDB); Column: analytics (Cassandra)'] },
  { title: 'Replication Strategies',    route: '/system-design/replication', badge: 'Data', available: true,
    description: 'Leader-follower, multi-leader, and leaderless replication — consistency, failover, and conflict resolution.',
    keyPoints: ['Single-leader: strong consistency, write bottleneck', 'Multi-leader: geo-distributed writes, conflict resolution complexity', 'Quorum writes/reads in leaderless (Cassandra): W + R > N'] },
  { title: 'Indexes & Query Optimisation', route: '/system-design/indexes', badge: 'Data', available: true,
    description: 'B-tree vs LSM-tree vs hash indexes — when each is fast, when to add composite indexes.',
    keyPoints: ['B-tree: optimal for range queries and sorted order', 'LSM-tree: write-optimised (RocksDB, Cassandra)', 'Index selectivity: high-cardinality columns benefit most'] },
  { title: 'Distributed Transactions',  route: '/system-design/distributed-transactions', badge: 'Data', available: true,
    description: '2PC, Saga, and Try-Confirm-Cancel — managing atomicity across multiple services.',
    keyPoints: ['2PC: strong consistency but blocking; coordinator is a SPOF', 'Saga: eventual consistency with compensating transactions', 'TCC: try (reserve) → confirm (commit) → cancel (rollback)'] },

  // Reliability
  { title: 'High Availability Design',  route: '/system-design/high-availability', badge: 'Reliability', available: true,
    description: 'Active-passive vs active-active, failover automation, and calculating nines of availability.',
    keyPoints: ['99.9% = 8.7 h downtime/year; 99.99% = 52 min; 99.999% = 5 min', 'Active-passive: simpler, failover lag; Active-active: zero downtime', 'Health checks + automatic failover: Route 53, HAProxy, AWS ALB'] },
  { title: 'Fault Tolerance Patterns',  route: '/system-design/fault-tolerance', badge: 'Reliability', available: true,
    description: 'Circuit breaker, bulkhead, timeout, retry with back-off — preventing one service failure from cascading.',
    keyPoints: ['Timeout: always set; prevents thread pool exhaustion', 'Retry with jitter: avoid thundering herd on recovery', 'Bulkhead: separate thread pools per dependency; circuit breaker short-circuits'] },
  { title: 'Distributed Tracing',       route: '/system-design/distributed-tracing', badge: 'Reliability', available: true,
    description: 'Trace IDs, span hierarchy, OpenTelemetry, and correlating logs/metrics/traces.',
    keyPoints: ['Trace ID propagated via W3C TraceContext header', 'Span: one operation in one service; traces = tree of spans', 'Jaeger, Zipkin, AWS X-Ray, Grafana Tempo'] },
  { title: 'Disaster Recovery',         route: '/system-design/disaster-recovery', badge: 'Reliability', available: true,
    description: 'RTO, RPO, backup strategies, multi-region replication, and the cost trade-offs of each DR tier.',
    keyPoints: ['RTO: Recovery Time Objective — max acceptable downtime', 'RPO: Recovery Point Objective — max acceptable data loss', 'Warm standby > pilot light > cold backup (cost vs recovery time)'] },

  // Real Systems
  { title: 'Design a URL Shortener',    route: '/system-design/url-shortener', badge: 'Real Systems', available: true,
    description: 'The canonical system design interview problem — base62 encoding, redirect latency, analytics, abuse prevention.',
    keyPoints: ['Base62 ID generation: ~3.5 trillion 6-char codes', 'Read-heavy: cache popular redirects aggressively', 'Analytics: async event stream → Kafka → data warehouse'] },
  { title: 'Design a Social Feed',      route: '/system-design/social-feed', badge: 'Real Systems', available: true,
    description: 'Fan-out on write vs fan-out on read — the core trade-off in building Twitter/Instagram-style feeds.',
    keyPoints: ['Fan-out on write: precompute feed on publish (fast read, slow write)', 'Fan-out on read: compute feed at read time (fast write, slow read)', 'Hybrid: fan-out on write for regular users, on read for celebrities'] },
  { title: 'Design a Chat Application', route: '/system-design/chat-application', badge: 'Real Systems', available: true,
    description: 'WebSocket connections, message ordering, presence, delivery receipts, and offline message queuing.',
    keyPoints: ['WebSocket server: connection layer; message service: persistence', 'Snowflake IDs for message ordering across servers', 'Presence: heartbeat + TTL in Redis; offline: push notification'] },
  { title: 'Design a Search Engine',    route: '/system-design/search-engine', badge: 'Real Systems', available: true,
    description: 'Web crawler, inverted index, ranking, and serving 100k QPS at sub-100ms latency.',
    keyPoints: ['Crawler: politeness delay, robots.txt, dedup via URL canonicalisation', 'Inverted index: term → posting list (docID, frequency, positions)', 'BM25 ranking; learned-to-rank for personalisation'] },
  { title: 'Design a Payment System',   route: '/system-design/payment-system', badge: 'Real Systems', available: true,
    description: 'Idempotency keys, double-entry ledger, reconciliation, and Stripe-style webhook reliability.',
    keyPoints: ['Idempotency key on every payment request prevents double-charge', 'Double-entry ledger: debit one account, credit another — always balanced', 'Outbox pattern for reliable webhook delivery after commit'] },
  { title: 'Design Netflix / YouTube',  route: '/system-design/video-streaming', badge: 'Real Systems', available: true,
    description: 'Video ingestion pipeline, adaptive bitrate streaming, CDN strategy, and handling 1B+ concurrent streams.',
    keyPoints: ['Transcoding pipeline: raw upload → queue → worker farm → multiple bitrates', 'DASH/HLS: client picks bitrate based on bandwidth', 'Choke points: encode farm throughput, CDN origin shield'] },

  // Reference
  { title: 'AI/ML System Design',        route: '/system-design/ai-ml-system-design', badge: 'Real Systems', available: true,
    description: 'Design LLM-powered systems at scale — RAG pipelines, vector databases, model serving, and embedding infrastructure.',
    keyPoints: ['RAG architecture: embed → store in vector DB → retrieve k-NN → augment prompt', 'Vector DB trade-offs: pgvector vs Pinecone vs Weaviate vs Chroma for different scales', 'Model serving: vLLM, Triton Inference Server, batching strategies for throughput', 'Embedding pipeline: chunking strategy, overlap, re-ranking with cross-encoders', 'LLM API cost vs latency: caching identical prompts; semantic caching with similarity threshold'] },
  { title: 'System Design Cheat Sheet', route: '/system-design/cheatsheet', badge: 'Reference', available: true,
    description: 'Numbers you must know, component decision guide, and a blank design template for interviews.',
    keyPoints: ['Latency numbers: L1 cache 1ns, RAM 100ns, SSD 100µs, network 1ms+', 'Component shortlist per problem type', 'Interview template: req → estimate → design → deep dive'] },
  { title: 'System Design Interview Guide', route: '/system-design/interview-prep', badge: 'Reference', available: true,
    description: '20 common system design interview problems with full walk-throughs and scoring rubrics.',
    keyPoints: ['Communication tips: always clarify before diving in', 'Scoring: correctness, communication, trade-off awareness, depth', 'Common mistakes: jumping to solution, ignoring non-functional reqs'] },
];

@Component({
  selector: 'app-system-design-home',
  standalone: true, imports: [RouterLink],
  templateUrl: './home.html', styleUrl: './home.scss',
})
export class SystemDesignHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'fundamentals'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
