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
  { name: 'Shard',              type: 'keyword', desc: 'Horizontal partition — a subset of rows stored on a separate DB node.' },
  { name: 'Shard key',          type: 'keyword', desc: 'The column used to determine which shard receives a row. Critical design decision.' },
  { name: 'Range sharding',     type: 'keyword', desc: 'Partition by value range (A-M → shard 1). Easy range queries; hotspot risk.' },
  { name: 'Hash sharding',      type: 'keyword', desc: 'hash(key) % N → shard. Even distribution; hard range queries.' },
  { name: 'Directory sharding', type: 'keyword', desc: 'Lookup table maps key → shard. Flexible; lookup table is a SPOF.' },
  { name: 'Virtual nodes',      type: 'keyword', desc: 'One physical node = multiple virtual ring positions. Better load distribution.' },
  { name: 'Hotspot',            type: 'keyword', desc: 'One shard receives disproportionate traffic. Bad shard key choice.' },
  { name: 'Cross-shard join',   type: 'keyword', desc: 'Joining data across shards requires scatter-gather. Avoid in hot paths.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Why shard?',
    points: [
      'Vertical scaling has a practical ceiling, though the commonly-quoted numbers here are often misattributed: ~100k TPS is a reasonable rule of thumb for a real mixed-read/write OLTP workload on a single node, not a hard software limit — single-node Postgres has been benchmarked past 3 million TPS on read-heavy, in-memory workloads. Likewise, "64 TB" is AWS RDS\'s managed-storage ceiling for PostgreSQL, not a PostgreSQL software limit — self-hosted Postgres has no such cap (the actual PG-specific limit is 32 TB per single TABLE, not per instance).',
      'Sharding splits data horizontally — each shard handles a fraction of total load.',
      'When to shard: when read replicas are at capacity, vertical scaling is cost-prohibitive, or dataset exceeds single-node storage.',
    ],
  },
  {
    heading: 'Range sharding',
    points: [
      'Partition by value range: users A-M → shard 1, N-Z → shard 2.',
      'Pros: efficient range scans (get all orders from Jan-Mar goes to one shard).',
      'Cons: uneven distribution (more users with common last names hit certain shards); hotspot risk for time-series data where "recent" rows concentrate on last shard.',
    ],
  },
  {
    heading: 'Hash sharding',
    points: [
      'hash(user_id) % num_shards → shard index.',
      'Pros: statistically even distribution; no hotspots if keys are uniformly distributed.',
      'Cons: range queries scatter across all shards (scatter-gather); resharding requires remapping most keys.',
      'Consistent hashing minimises resharding cost when adding/removing shards.',
    ],
  },
  {
    heading: 'Cross-shard problems',
    points: [
      'Joins: rows from different shards cannot be joined in SQL — application must merge in memory.',
      'Transactions: ACID across shards requires distributed transactions (2PC) — expensive.',
      'Aggregations: COUNT(*) across all users requires querying all shards and summing.',
      'Solution: design shard key so related data collocates on the same shard (e.g. shard by tenant_id for SaaS).',
    ],
  },
  {
    heading: 'Resharding',
    points: [
      'Adding shards requires moving data. Consistent hashing minimises to K/N keys moved.',
      'Zero-downtime reshard: double-write to old + new shard, backfill, verify, cutover.',
      'Managed sharding: Vitess (MySQL), Citus (PostgreSQL), DynamoDB, Cassandra — handle resharding automatically.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Shard Router',
    language: 'typescript',
    code: `// Simple hash-based shard router

class ShardRouter {
  private shards: string[]; // connection strings

  constructor(shards: string[]) {
    this.shards = shards;
  }

  private hash(key: string): number {
    let h = 5381;
    for (const c of key) h = ((h << 5) + h) ^ c.charCodeAt(0);
    return (h >>> 0) % this.shards.length;
  }

  getShardForKey(shardKey: string): string {
    const idx = this.hash(shardKey);
    return this.shards[idx];
  }
}

const router = new ShardRouter([
  'postgres://shard-0:5432/db',
  'postgres://shard-1:5432/db',
  'postgres://shard-2:5432/db',
  'postgres://shard-3:5432/db',
]);

// Route writes by user_id
async function insertOrder(order: Order) {
  const connStr = router.getShardForKey(order.userId);
  const db = getConnection(connStr);
  await db.query('INSERT INTO orders ...', order);
}

// Cross-shard query — scatter-gather
async function getTotalRevenue(): Promise<number> {
  const results = await Promise.all(
    router['shards'].map(shard => {
      const db = getConnection(shard);
      return db.query('SELECT SUM(amount) FROM orders');
    })
  );
  return results.reduce((sum, r) => sum + r.rows[0].sum, 0);
}`,
  },
  {
    label: 'Good vs Bad Shard Keys',
    language: 'typescript',
    code: `// Shard key selection guide

// BAD: Low cardinality → too few distinct shard destinations
// e.g. shard by country (only 200 countries)
// or shard by status (active/inactive → 2 values)
const bad1 = { shardKey: 'country', problem: 'Low cardinality; some shards overloaded' };

// BAD: Monotonically increasing → all new writes go to last shard
// e.g. shard by created_at or auto-increment ID
const bad2 = { shardKey: 'created_at', problem: 'Hotspot on current shard; old shards idle' };

// GOOD: High cardinality + even distribution
const good1 = { shardKey: 'user_id (UUID)', benefit: 'UUID is random → even distribution' };
const good2 = { shardKey: 'tenant_id (SaaS)', benefit: 'Collocates all tenant data → no cross-shard joins' };
const good3 = { shardKey: 'hash(user_id)', benefit: 'Even distribution even if user IDs are sequential' };

// For time-series (IoT, logs): composite key
// shard by (device_id, time_bucket) — keeps device data colocated
// while distributing across shards by device`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Choosing a monotonically increasing shard key',
    wrong: `// Shard by auto-increment ID or created_at
// All new rows go to the "last" shard → hotspot`,
    right: `// Shard by UUID or hash(id):
// UUIDs are random → rows distribute evenly across shards
// Or prepend random prefix: shard_prefix + sequential_id`,
    explanation: 'Monotonically increasing keys create a "hot" shard that receives all new writes. Old shards sit idle. Use random/hashed keys to distribute writes evenly.',
  },
  {
    title: 'Performing frequent cross-shard joins',
    wrong: `// SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id
// users and orders on different shards → full scatter-gather`,
    right: `// Collocate related data by sharding BOTH tables on user_id:
// users: shard by user_id
// orders: shard by user_id (same key)
// → both tables for a user land on the same shard`,
    explanation: 'Cross-shard joins require querying all shards and merging in the application. Design shard keys so related data is colocated — the primary mitigation for cross-shard query cost.',
  },
  {
    title: 'Sharding before exhausting simpler options',
    wrong: `// Adding sharding at 5k QPS because "we might need it"`,
    right: `// Checklist before sharding:
// 1. Connection pooling configured?
// 2. Read replicas added?
// 3. Indexes optimised?
// 4. Vertical scaling headroom exhausted?
// 5. Caching applied?
// Shard only after these are done.`,
    explanation: 'Sharding adds enormous operational complexity — routing logic, cross-shard queries, distributed transactions. Exhaust all other options first. Many systems operate at hundreds of thousands of TPS without sharding.',
  },
  {
    title: 'Not planning for resharding',
    wrong: `// Choosing 4 shards; never planning beyond that
// When 4 shards fill up, need emergency migration`,
    right: `// Use consistent hashing with virtual nodes (e.g. 512 virtual nodes / 4 physical)
// Adding a 5th physical node only moves 512/5 ≈ 102 virtual nodes
// Pre-plan for 2× growth at design time`,
    explanation: 'Resharding data while serving live traffic is extremely dangerous. Plan for growth: use consistent hashing so adding nodes moves minimal data, or use managed sharding (Vitess, Citus, DynamoDB).',
  },
];

const challenge: Challenge = {
  title: 'Design the sharding strategy for a multi-tenant SaaS database',
  language: 'typescript',
  description: `A B2B SaaS product manages data for 10,000 tenants. The largest tenant (Enterprise) has 1M users; most tenants have < 100 users. Total data: 10 TB across all tenants.

Key tables: tenants, users, projects, tasks, audit_logs

Queries:
- Most queries filter by tenant_id
- Some queries join users ↔ tasks (same tenant)
- Global analytics: total task count across all tenants (hourly cron)

Design:
1. Shard key and strategy
2. How to handle the large Enterprise tenant (1M users)
3. How to run global analytics efficiently
4. What to do with audit_logs (high write volume, large data)`,
  hints: [
    'Shard by tenant_id → all tenant data colocated, no cross-shard joins',
    'Large tenant → dedicated shard or shard its own subtables by user_id',
    'Analytics → async aggregation job or pre-aggregated summary table',
    'Audit logs → separate time-partitioned archive store (ClickHouse, S3 Parquet)',
  ],
  starterCode: `interface ShardingDesign {
  shardKey: string;
  strategy: string;
  largeTenantHandling: string;
  analyticsApproach: string;
  auditLogApproach: string;
}

const design: ShardingDesign = {
  shardKey: '',
  strategy: '',
  largeTenantHandling: '',
  analyticsApproach: '',
  auditLogApproach: '',
};`,
  solution: `const design: ShardingDesign = {
  shardKey: 'tenant_id',
  strategy: 'Hash sharding on tenant_id → 16 shards. All tables (users, projects, tasks) sharded by tenant_id. Most queries stay on one shard (no cross-shard joins for tenant operations).',
  largeTenantHandling: 'Enterprise tenant gets its own dedicated shard (shard 0 = Enterprise only). Sub-shard large tables by user_id within that shard using table partitioning. Directory mapping: tenant_id → shard_id via lookup table.',
  analyticsApproach: 'Hourly cron: scatter-gather across 16 shards, sum in application. Pre-aggregate to summary_stats table (total_tasks per tenant per day). Analytics reads from summary, not raw tables.',
  auditLogApproach: 'Archive audit_logs to ClickHouse or S3 Parquet files (columnar). Write via Kafka → consumer appends to time-partitioned files. Removes high-write, large-data audit burden from OLTP shards.',
};`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the main disadvantage of hash sharding compared to range sharding?',
    options: ['Uneven data distribution', 'Range queries must scatter across all shards', 'Higher storage overhead', 'Cannot handle high write volume'],
    answer: 1,
    explanation: 'Hash sharding distributes data evenly but makes range queries (e.g., orders from Jan-Mar) scan all shards — a scatter-gather operation. Range sharding keeps ordered data colocated for efficient range scans.',
  },
  {
    q: 'Why is "created_at" a poor shard key for an orders table?',
    options: ['Too many distinct values', 'Low cardinality', 'Monotonically increasing — all new orders go to the current time shard', 'It cannot be hashed'],
    answer: 2,
    explanation: 'Monotonically increasing shard keys (timestamps, auto-increment IDs) create a "hot" shard that receives all new writes. Historical shards sit idle. Use random/UUID keys or hash of an entity ID instead.',
  },
  {
    q: 'Consistent hashing minimises resharding cost because?',
    options: ['It avoids any data movement', 'Only K/N keys need to move when adding a node', 'It uses more virtual nodes', 'It requires no shard key'],
    answer: 1,
    explanation: 'With consistent hashing, adding one node to an N-node ring only moves K/N keys from the new node\'s clockwise neighbour. Modulo hashing would remap most keys when N changes.',
  },
  { q: 'What is consistent hashing and why is it used for sharding?', options: ['A hashing algorithm that always produces the same output for the same input', 'A hashing scheme that maps both keys and nodes to a ring so adding or removing a node only remaps a fraction of keys rather than rehashing all keys', 'A technique for distributing writes evenly across a fixed number of shards', 'A method for consistent replication across geographically distributed shards'], answer: 1, explanation: 'In naive modulo sharding (key % N shards), changing N requires remapping almost all keys. Consistent hashing places both keys and nodes on a conceptual ring. Each key is served by the first node clockwise from it on the ring. Adding a node only steals keys from the next node on the ring; removing a node transfers its keys to the next node. Only a fraction (1/N) of keys are remapped on topology changes. Virtual nodes further smooth distribution by placing each physical node at multiple positions on the ring. Used by Cassandra, DynamoDB, and Memcached.' },
  { q: 'What are the main challenges of cross-shard transactions and joins?', options: ['Cross-shard operations are only a problem when using asynchronous replication', 'Cross-shard transactions require distributed coordination (2PC or Saga) because data spans multiple independent databases; joins require either denormalization or an expensive scatter-gather across shards', 'Cross-shard joins are handled automatically by the database query optimizer', 'Cross-shard transactions are simply serialized by a central coordinator with no performance impact'], answer: 1, explanation: 'Sharding splits data across independent database instances that cannot coordinate natively. Cross-shard transactions: either use 2PC (slow, blocking) or the Saga pattern (eventual consistency). Cross-shard joins: the database cannot join tables on different shards. Solutions: denormalize data by duplicating related data into the same shard so joins happen locally, use an application-level scatter-gather (query all shards, merge results in the app), or accept that some query patterns are not supported. Sharding is worth this complexity only when single-node capacity is genuinely insufficient.' },
  { q: 'What is shard rebalancing and when does it become necessary?', options: ['Rebalancing adds more indexes to each shard to improve query performance', 'Rebalancing redistributes data across shards when the initial distribution becomes uneven due to data growth or hot shards', 'Rebalancing removes shards that have become empty due to data deletion', 'Rebalancing is an automated background operation that requires no downtime or intervention'], answer: 1, explanation: 'Over time, shards may become unbalanced: data grows faster in some shards, hot key patterns concentrate traffic on specific shards, or the initial shard count is too low for current scale. Rebalancing migrates data from overloaded shards to underloaded ones or adds new shards. It requires: migrating data while the system remains live (double-writing to old and new shard location during migration), updating routing logic to redirect traffic after migration, and verifying data integrity before cutting over. Consistent hashing minimizes the data movement needed when adding shards. Manual rebalancing in production is risky and should be carefully tested.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between partitioning and sharding?',
    a: 'Partitioning divides a table into sub-tables on the same database node (e.g., PostgreSQL table partitioning by month). Sharding distributes partitions across multiple nodes/servers. Partitioning helps query performance and maintenance; sharding helps horizontal scaling of storage and throughput.',
  },
  {
    q: 'How do managed databases (DynamoDB, Cassandra, Vitess) make sharding easier?',
    a: 'They handle the shard router, key mapping, and resharding automatically. DynamoDB transparently splits hot partitions. Cassandra uses consistent hashing with vnodes. Vitess adds a routing layer on top of MySQL. You just choose a primary key/partition key and the system handles distribution — no application-level routing code needed.',
  },
  { q: 'How do you choose a good shard key?', a: 'A good shard key has high cardinality (many distinct values) to distribute data evenly. It should distribute both storage and query traffic evenly to avoid hot shards. It should be part of most query predicates so queries can be routed to a single shard without scatter-gather. It should be immutable or rarely changed because changing a shard key requires migrating the row to a different shard. Bad choices: using a monotonically increasing value like a created_at timestamp concentrates all writes on the latest shard. Using a low-cardinality value like status (active/inactive) results in two massive unbalanced shards. Good choices: user_id for user-centric systems, a hash of a natural key for even distribution.' },
  { q: 'What is directory-based sharding and how does it differ from hash-based sharding?', a: 'Hash-based sharding applies a hash function to the shard key to determine the target shard. Simple and even distribution but no locality: related keys with similar values may go to different shards, and range queries require scatter-gather. Directory-based sharding maintains a lookup table mapping each key range or specific key to a shard. This allows explicit control over data placement: put a high-traffic tenant on a dedicated shard, route range queries to a single shard. The directory lookup adds latency and the directory itself must be highly available (often cached in memory). Directory-based sharding is more flexible but operationally more complex than hash-based.' },
  { q: 'How does Vitess enable MySQL sharding without application changes?', a: 'Vitess is a database clustering system that adds sharding, connection pooling, and query routing in front of MySQL instances. The VTGate component acts as a MySQL proxy: applications connect to VTGate using standard MySQL protocol with no driver changes. VTGate parses each query, applies the sharding logic based on the configured shard key, and routes the query to the correct VTTablet (per-shard MySQL proxy). For queries that require scatter-gather across shards, VTGate fans out the query, collects results, and merges them. Vitess is used by YouTube, GitHub, and Slack to shard MySQL at massive scale while keeping the application relatively unchanged.' },
  { q: 'What is a hot shard and how do you detect and mitigate it?', a: 'A hot shard receives significantly more traffic than other shards, becoming a bottleneck while other shards are underutilized. Detection: monitor per-shard CPU, QPS, and latency. Significant deviation from the mean indicates a hot shard. Causes: a popular user or entity whose data is on one shard (hot key), a poor shard key with low cardinality, or sequential key assignment putting all new data on the latest shard. Mitigation: split the hot shard into multiple shards by subdividing its key range. Add a random suffix to hot keys to spread them across multiple sub-keys, then aggregate reads. Use application-layer caching to absorb hot reads before they reach the shard. For write hot spots, use write buffering and batching.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Shard by a high-cardinality, evenly-distributed key. Collocate related data. Use consistent hashing to minimise resharding cost.',
  mustKnow: [
    'Range sharding: easy range queries, hotspot risk with sequential data',
    'Hash sharding: even distribution, hard range queries',
    'Consistent hashing: K/N keys remapped when adding a node (not O(K))',
    'Collocate related data on same shard to avoid cross-shard joins',
    'Bad shard keys: monotonic (created_at, auto-ID), low-cardinality (country)',
    'Managed sharding (DynamoDB, Cassandra, Vitess) preferred over hand-rolled',
  ],
  interviewFocus: [
    'Justify shard key choice — cardinality, distribution, query patterns',
    'Mention resharding complexity and consistent hashing solution',
    'Address cross-shard join problem and collocation strategy',
    'Shard AFTER exhausting replicas + caching + vertical scaling',
  ],
};

@Component({
  selector: 'app-sysdesign-sharding',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './sharding.html',
  styleUrl: './sharding.scss',
})
export class SysdesignSharding {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
