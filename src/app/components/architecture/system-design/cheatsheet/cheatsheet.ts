import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';

interface LatencyRow { operation: string; latency: string; note: string; }
interface ComponentRow { need: string; solution: string; examples: string; }
interface NumberRow { metric: string; value: string; context: string; }

@Component({
  selector: 'app-sysdesign-cheatsheet',
  standalone: true,
  imports: [CommonModule, PageMetaComponent],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class SysdesignCheatsheet {
  latencyTable: LatencyRow[] = [
    { operation: 'L1 cache reference',        latency: '0.5 ns',    note: '1 CPU cycle' },
    { operation: 'L2 cache reference',        latency: '7 ns',      note: '14× L1' },
    { operation: 'Main memory (RAM) access',  latency: '100 ns',    note: '200× L1' },
    { operation: 'SSD sequential read',       latency: '150 µs',    note: '150,000 ns' },
    { operation: 'HDD seek',                  latency: '10 ms',     note: '10,000,000 ns' },
    { operation: 'Redis GET (local)',         latency: '< 1 ms',    note: 'In-memory, same AZ' },
    { operation: 'DB query (indexed, local)', latency: '1–5 ms',    note: 'PostgreSQL, PK lookup' },
    { operation: 'DB query (non-indexed)',    latency: '10–100 ms', note: 'Full table scan' },
    { operation: 'Same-region HTTP call',     latency: '1–5 ms',    note: 'Internal service call' },
    { operation: 'Cross-region HTTP call',    latency: '50–150 ms', note: 'US East → EU West' },
    { operation: 'DNS lookup',               latency: '20–120 ms', note: 'Varies by TTL/cache' },
    { operation: 'TCP handshake',            latency: '≈ RTT',     note: '1 round-trip time' },
    { operation: 'TLS handshake',            latency: '1–2× RTT',  note: 'TLS 1.3: 1-RTT' },
    { operation: 'HDD random read 1 MB',     latency: '20 ms',     note: 'Seek + transfer' },
    { operation: 'SSD random read 1 MB',     latency: '1 ms',      note: 'NVMe SSD' },
    { operation: 'Network send 1 MB (1Gbps)',  latency: '10 ms',    note: 'Bandwidth limited' },
  ];

  componentTable: ComponentRow[] = [
    { need: 'Session storage, rate limiting, leaderboards', solution: 'Redis',              examples: 'Redis Sorted Set, INCR, EXPIRE' },
    { need: 'Full-text search, facets',                    solution: 'Elasticsearch',       examples: 'BM25, aggregations, suggest' },
    { need: 'Async decoupling, event streaming',           solution: 'Kafka',               examples: 'Topics, partitions, consumer groups' },
    { need: 'Real-time pub/sub, cross-server routing',    solution: 'Redis Pub/Sub',        examples: 'PUBLISH, SUBSCRIBE channels' },
    { need: 'Task queues, background jobs',               solution: 'SQS / RabbitMQ',      examples: 'Dead-letter queues, visibility timeout' },
    { need: 'ACID transactions, complex queries',         solution: 'PostgreSQL / MySQL',   examples: 'MVCC, JOINs, window functions' },
    { need: 'Time-series, high write rate',               solution: 'Cassandra / InfluxDB', examples: 'Partition by device+day, TTL' },
    { need: 'Object / blob storage',                     solution: 'S3 / GCS',            examples: 'Pre-signed URLs, lifecycle policies' },
    { need: 'CDN, global static file delivery',          solution: 'CloudFront / Fastly',  examples: 'Cache-Control, origin shield' },
    { need: 'Service-to-service communication',          solution: 'gRPC / REST',          examples: 'Protobuf, HTTP/2 multiplexing' },
    { need: 'Semantic vector search',                    solution: 'Pinecone / pgvector',  examples: 'HNSW ANN, metadata filters' },
    { need: 'Graph traversal, relationship queries',     solution: 'Neo4j / Neptune',      examples: 'Cypher MATCH -[:REL]-> queries' },
    { need: 'Write-heavy time-series analytics',        solution: 'ClickHouse',           examples: 'Columnar storage, ZSTD compression' },
    { need: 'Geospatial proximity search',              solution: 'Redis GEO / PostGIS',  examples: 'GEORADIUS, ST_DWithin' },
  ];

  numberTable: NumberRow[] = [
    { metric: 'Seconds per day',           value: '86,400',          context: '1 day = 86.4k seconds' },
    { metric: 'Seconds per month',         value: '2,592,000',       context: '30 days' },
    { metric: '1 billion = 10^9',          value: '1,000,000,000',   context: 'Useful for QPS × storage calc' },
    { metric: '1 million QPS',             value: '~11,574 req/s',   context: 'million/day ÷ 86,400' },
    { metric: '1 TB in bytes',             value: '10^12 bytes',     context: '1024 GB = 1 TB' },
    { metric: 'ASCII char',                value: '1 byte',          context: 'UTF-8: 1–4 bytes' },
    { metric: 'UUID / GUID',               value: '16 bytes',        context: '36 chars as string = 36 bytes' },
    { metric: 'Avg tweet / short post',    value: '140–280 bytes',   context: 'Text only' },
    { metric: 'Image thumbnail (JPEG)',    value: '20–100 KB',       context: '200×200 px' },
    { metric: 'HD image (JPEG)',           value: '500 KB – 3 MB',   context: '1920×1080' },
    { metric: '1 min of audio (128 kbps)',  value: '~1 MB',          context: 'MP3 compressed' },
    { metric: '1 min of HD video (1080p)', value: '~100–300 MB',     context: 'H.264 encoded' },
    { metric: '1 min of 4K video',        value: '~500 MB – 1 GB',  context: 'H.265 encoded' },
    { metric: 'Typical web page',         value: '~2 MB',           context: 'HTML + JS + images' },
  ];

  interviewTemplate = [
    { step: '1 — Clarify (5 min)',     points: ['Functional requirements: what the system must DO', 'Non-functional: scale, latency, availability, consistency', 'Out of scope: what NOT to design', 'Estimate: DAU, QPS, storage, bandwidth'] },
    { step: '2 — Estimate (3 min)',    points: ['Write QPS = creates/day ÷ 86,400', 'Read QPS = reads/day ÷ 86,400', 'Storage = entities × bytes_per_entity × retention_years', 'Bandwidth = QPS × avg_response_size'] },
    { step: '3 — High-level design (10 min)', points: ['Draw: client → LB → app servers → cache → DB', 'Identify core APIs: 2–3 endpoints max', 'Data model: 2–3 main tables/collections', 'Choose DB type from requirements'] },
    { step: '4 — Deep dive (15 min)', points: ['Pick the hardest component (usually data + scale)', 'Sharding / partitioning strategy', 'Caching layer (what, where, TTL, invalidation)', 'Handle hot spots and bottlenecks'] },
    { step: '5 — Reliability (5 min)', points: ['Single points of failure → redundancy', 'Data loss → replication + backups', 'Cascade failures → circuit breaker, bulkhead', 'Monitoring: key metrics to alert on'] },
  ];

  scalingRules = [
    { trigger: 'CPU bottleneck',          solution: 'Horizontal scale (more instances) + load balancer' },
    { trigger: 'DB write bottleneck',     solution: 'Sharding by user_id / entity_id' },
    { trigger: 'DB read bottleneck',      solution: 'Read replicas + Redis cache (cache-aside)' },
    { trigger: 'Hot key in cache',        solution: 'Replicate hot key to N shards, random read' },
    { trigger: '10K QPS on single node', solution: 'Add CDN (static), cache layer (dynamic), horizontal app scaling' },
    { trigger: '100K QPS',               solution: 'DB sharding, Kafka for async writes, Redis cluster' },
    { trigger: '1M+ QPS',                solution: 'Multi-region active-active, geo-routing, CDN everywhere' },
    { trigger: 'Data > 10 TB',           solution: 'Shard or move to distributed DB (Cassandra, Spanner)' },
  ];
}
