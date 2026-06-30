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
  selector: 'app-mongo-replication-sharding',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './replication-sharding.html',
  styleUrl: './replication-sharding.scss',
})
export class MongoReplicationSharding {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: 'Replica Set',        desc: 'Group of mongod instances that maintain the same data. One PRIMARY, 1+ SECONDARY, optional ARBITER.' },
    { type: 'method',  name: 'rs.initiate()',       desc: 'Initialize a replica set from a mongosh session on the primary.' },
    { type: 'method',  name: 'rs.status()',         desc: 'Show replica set health: member states, optime lag, replication progress.' },
    { type: 'method',  name: 'rs.add("host:port")', desc: 'Add a new secondary member to the replica set.' },
    { type: 'keyword', name: 'Oplog',               desc: 'Capped collection (local.oplog.rs) — operations log that secondaries replay to stay in sync.' },
    { type: 'keyword', name: 'Read Preference',     desc: 'primary | primaryPreferred | secondary | secondaryPreferred | nearest — where reads are routed.' },
    { type: 'keyword', name: 'Write Concern',       desc: '{ w: "majority" } — wait for majority of nodes to acknowledge a write before returning.' },
    { type: 'keyword', name: 'Sharding',            desc: 'Horizontal scaling — data is split across shards by a shard key. Each shard is a replica set.' },
    { type: 'keyword', name: 'Shard Key',           desc: 'The field(s) MongoDB uses to distribute documents across shards. Chosen at collection creation — immutable.' },
    { type: 'keyword', name: 'mongos',              desc: 'Router process for sharded clusters — clients connect to mongos, which routes queries to shards.' },
    { type: 'keyword', name: 'Config Servers',      desc: 'Replica set storing cluster metadata: shard locations, chunk ranges, balancer state.' },
    { type: 'keyword', name: 'Chunk',               desc: 'A contiguous range of shard key values. MongoDB balances chunks across shards automatically.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Replica Sets — High Availability',
      points: [
        'A <strong>replica set</strong> is a group of mongod instances that maintain identical data copies. It provides high availability through automatic failover: if the PRIMARY goes down, the remaining members elect a new PRIMARY within ~10 seconds.',
        'Replica set members: <strong>PRIMARY</strong> — receives all writes; <strong>SECONDARY</strong> — replicates from PRIMARY via the oplog, can serve reads; <strong>ARBITER</strong> — participates in elections but holds no data (used to achieve odd-number voting for tie-breaking, avoid in production).',
        'The <strong>oplog</strong> (operations log) is a capped collection (<code>local.oplog.rs</code>) on every member. The PRIMARY writes every operation to its oplog; secondaries continuously tail the PRIMARY\'s oplog and replay operations to stay in sync. Replication lag = how far behind a secondary\'s optime is from the primary\'s.',
        '<strong>Automatic failover</strong>: if the primary is unreachable for <code>electionTimeoutMillis</code> (default 10 seconds), the remaining members hold an election. A member wins if it gets votes from a majority. The new primary resumes writes; drivers auto-reconnect. Typical failover time: 10–30 seconds.',
        'Minimum recommended replica set: <strong>3 members</strong> (one primary + two secondaries, or two + one arbiter). A 2-member set cannot elect a new primary when one fails (no majority). Never run a single-node replica set in production.',
      ],
    },
    {
      heading: 'Read Preferences & Write Concern',
      points: [
        '<strong>Write concern</strong> controls durability: <code>{ w: 1 }</code> (default) — acknowledged by primary only; <code>{ w: "majority" }</code> — acknowledged by majority of voting members (data survives primary failure); <code>{ w: 0 }</code> — fire-and-forget (no acknowledgement). Always use <code>w: "majority"</code> for critical writes.',
        '<strong>Read preference</strong> controls where reads are routed: <code>primary</code> (default) — always reads from primary (strongly consistent); <code>secondary</code> — reads from a secondary (may see stale data due to replication lag); <code>nearest</code> — routes to geographically closest node (lowest latency). Use <code>secondary</code> or <code>nearest</code> only when eventual consistency is acceptable.',
        '<strong>Read concern</strong>: <code>"local"</code> (default) — reads data that may not be majority-committed; <code>"majority"</code> — reads only majority-committed data (won\'t see rolled-back writes); <code>"linearizable"</code> — strictest: waits for the most up-to-date majority-committed data (slowest). Use <code>"majority"</code> for financial or critical reads.',
        'Combine write concern + read concern for strong consistency: <code>{ writeConcern: { w: "majority" } }</code> on writes, <code>{ readConcern: { level: "majority" } }</code> on reads — this gives a linearizable monotonic read guarantee.',
      ],
    },
    {
      heading: 'Sharding — Horizontal Scaling',
      points: [
        '<strong>Sharding</strong> partitions a collection\'s data across multiple <strong>shards</strong> (each shard is itself a replica set). It scales both storage and throughput horizontally — each shard only holds a subset of the data.',
        'A sharded cluster has three components: <strong>shards</strong> (replica sets holding data), <strong>config servers</strong> (a replica set storing cluster metadata: which chunks are on which shard, chunk boundaries), and <strong>mongos</strong> (router process — clients connect here; mongos routes queries to the correct shards).',
        'The <strong>shard key</strong> determines how data is distributed. MongoDB splits data into <strong>chunks</strong> (ranges of shard key values) and distributes chunks across shards. A good shard key has: high cardinality (many distinct values), even distribution (no "hot" values), and query isolation (most queries include the shard key so they target one shard).',
        'Two sharding strategies: <strong>range-based</strong> — documents with similar shard key values end up on the same shard (good for range queries; bad for monotonically increasing keys like timestamps — all writes go to one shard "hot spot"); <strong>hashed</strong> — MongoDB hashes the shard key value for even distribution (good for write throughput; bad for range queries — scatter-gather).',
        '<strong>Scatter-gather queries</strong> — queries that don\'t include the shard key must be broadcast to ALL shards and results merged by mongos. Very expensive at scale. Always include the shard key in your most common query patterns.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Replica Set Setup',
      language: 'typescript',
      code: `// Initialize a 3-member replica set (run in mongosh on each node)
/*
  Node 1 (future primary): mongod --replSet rs0 --port 27017 --dbpath /data/db1
  Node 2: mongod --replSet rs0 --port 27018 --dbpath /data/db2
  Node 3: mongod --replSet rs0 --port 27019 --dbpath /data/db3
*/

// Connect to node 1 in mongosh, then:
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'localhost:27017', priority: 2 }, // preferred primary
    { _id: 1, host: 'localhost:27018', priority: 1 },
    { _id: 2, host: 'localhost:27019', priority: 1 },
  ]
});

rs.status();   // check all members are PRIMARY/SECONDARY
rs.conf();     // view current replica set config

// Connect from Node.js — include all members in the connection string
import { MongoClient } from 'mongodb';
const client = new MongoClient(
  'mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0'
);

// Write with majority concern (survives primary failover)
const db = client.db('shop');
await db.collection('orders').insertOne(
  { item: 'Widget', qty: 5 },
  { writeConcern: { w: 'majority', wtimeout: 5000 } }
);`,
    },
    {
      label: 'Read Preference',
      language: 'typescript',
      code: `import { MongoClient, ReadPreference } from 'mongodb';

const client = new MongoClient(uri);
const db = client.db('analytics');

// 1. Secondary reads for analytics (eventual consistency OK)
const reports = db.collection('events').withReadPreference(
  ReadPreference.SECONDARY_PREFERRED
);
const count = await reports.countDocuments({ date: '2025-01-01' });

// 2. Primary reads for checkout (must be up-to-date)
const orders = db.collection('orders').withReadPreference(
  ReadPreference.PRIMARY
);
const order = await orders.findOne({ _id: orderId });

// 3. Nearest for low-latency geo-distributed deployments
const products = db.collection('products').withReadPreference(
  ReadPreference.NEAREST
);

// 4. In the connection string
const clientNearest = new MongoClient(
  uri + '?readPreference=nearest'
);

// 5. Tag sets — route reads to specific data centers
const clientTagged = new MongoClient(uri, {
  readPreference: new ReadPreference('secondary', [{ datacenter: 'eu-west' }])
});`,
    },
    {
      label: 'Sharding Setup & Shard Key',
      language: 'typescript',
      code: `// Sharded cluster setup (mongosh on mongos)
/*
  1. Start config servers (3-member replica set on ports 27019-27021)
  2. Start shard1 (replica set on ports 27017-27018)
  3. Start shard2 (replica set on ports 27022-27023)
  4. Start mongos: mongos --configdb configRS/host:27019,host:27020,host:27021
*/

// Connect to mongos and configure:
sh.addShard('shard1RS/localhost:27017,localhost:27018');
sh.addShard('shard2RS/localhost:27022,localhost:27023');

sh.enableSharding('shop');

// Hashed sharding — even distribution for high write throughput
sh.shardCollection('shop.orders', { customerId: 'hashed' });

// Range-based sharding — good for range queries on date
sh.shardCollection('shop.events', { date: 1, userId: 1 });

sh.status(); // view chunk distribution across shards

// From Node.js — connect to mongos (same API as connecting to primary)
const client = new MongoClient('mongodb://mongos-host:27017/shop');

// Query with shard key — targets single shard (fast)
const orders = await client.db('shop').collection('orders')
  .find({ customerId: 'user-123' })  // shard key in query
  .toArray();

// Query WITHOUT shard key — scatter-gather (hits all shards)
const allPending = await client.db('shop').collection('orders')
  .find({ status: 'pending' })  // no shard key — expensive!
  .toArray();`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using w:1 write concern for critical data',
      wrong: `// Default write concern: w:1 — only primary acknowledges
await db.collection('payments').insertOne(payment);
// If primary crashes before replicating → payment is lost!`,
      right: `await db.collection('payments').insertOne(payment, {
  writeConcern: { w: 'majority', wtimeout: 5000 }
});
// Waits for majority to acknowledge — survives primary failover`,
      explanation: 'w:1 (primary-only acknowledgement) means a write is confirmed before it replicates to secondaries. If the primary crashes at that moment, the write is lost — rolled back when the new primary syncs. Always use w:"majority" for financial or critical data. wtimeout prevents blocking forever if nodes are slow.',
    },
    {
      title: 'Choosing a monotonically increasing shard key (hot spot)',
      wrong: `// Auto-increment _id or timestamp as shard key
sh.shardCollection('shop.events', { createdAt: 1 });
// All new inserts always go to the SAME (last) shard
// Other shards are idle — defeats the purpose of sharding`,
      right: `// Hashed shard key — evenly distributes inserts
sh.shardCollection('shop.events', { createdAt: 'hashed' });
// Or use a compound key: high-cardinality field + date
sh.shardCollection('shop.events', { userId: 1, createdAt: 1 });`,
      explanation: 'Monotonically increasing shard keys (auto-increment IDs, timestamps) cause all writes to target the latest chunk on a single shard — a "hot spot." The other shards sit idle while one is overwhelmed. Use hashed sharding or a compound key with a high-cardinality leading field for write-heavy collections.',
    },
    {
      title: 'Running queries without the shard key',
      wrong: `// Query on non-shard-key field — scatter-gather
const results = await db.collection('orders')
  .find({ status: 'pending' })  // no shard key!
  .toArray();
// mongos broadcasts to ALL shards, merges results — O(shards) cost`,
      right: `// Include the shard key in your most frequent queries
const results = await db.collection('orders')
  .find({ customerId: 'user-123', status: 'pending' }) // shard key: customerId
  .toArray();
// mongos routes to ONE shard — O(1) cost`,
      explanation: 'Queries without the shard key must be broadcast to all shards (scatter-gather). As you scale to more shards, these queries get proportionally slower and add load to every shard. Design your shard key to match your most frequent query patterns — the shard key should appear in most queries.',
    },
    {
      title: 'Reading from secondaries when data consistency matters',
      wrong: `// Reading from secondary for checkout flow
const cart = await db.collection('carts')
  .withReadPreference(ReadPreference.SECONDARY)
  .findOne({ userId });
// Secondary may be 1-2 seconds behind — user sees stale cart!`,
      right: `// Read from primary for consistency-critical reads
const cart = await db.collection('carts')
  .withReadPreference(ReadPreference.PRIMARY)
  .findOne({ userId });
// Or use secondary reads only for non-critical analytics`,
      explanation: 'Secondaries can lag behind the primary by seconds. For user-facing reads that depend on fresh data (cart contents, inventory levels, account balances), always read from the primary. Secondary reads are appropriate for analytics, reporting, and read-heavy workloads that can tolerate stale data.',
    },
  ];

  challenge: Challenge = {
    title: 'Write-Heavy Collection Sharding Design',
    language: 'typescript',
    description: 'You have an IoT sensor readings collection that receives 100,000 inserts/second. Each reading has: { sensorId: string, timestamp: Date, value: number, location: string }. Your queries are: (A) "last 1000 readings for sensor X", (B) "all readings from location Y in the last hour". Design the optimal sharding strategy: choose a shard key, justify hashed vs range, and write the shardCollection command for both query patterns.',
    hints: [
      'Pattern A needs sensorId in the shard key for single-shard routing.',
      'A compound key { sensorId: 1, timestamp: -1 } supports both A and B if location is indexed separately.',
      'Hashed on sensorId alone is good for writes but makes range queries on timestamp scatter-gather.',
      'Range on timestamp alone is a hot-spot — all writes go to the newest chunk.',
    ],
    starterCode: `// Design the sharding strategy for the IoT sensor collection
// Collection: db.sensorReadings
// Insert rate: 100k/sec
// Query A: db.sensorReadings.find({ sensorId: X }).sort({ timestamp: -1 }).limit(1000)
// Query B: db.sensorReadings.find({ location: Y, timestamp: { $gte: oneHourAgo } })

// TODO: choose shard key and write sh.shardCollection() calls
// TODO: add supporting indexes for the secondary query pattern`,
    solution: `// Optimal approach: compound shard key { sensorId: 1, timestamp: 1 }
// - sensorId provides cardinality (many sensors = even distribution)
// - timestamp within sensorId gives range query support for query A
// - Prevents hot-spotting (writes spread across many sensorId values)

sh.enableSharding('iot');

// Compound range shard key: sensorId + timestamp
sh.shardCollection('iot.sensorReadings', { sensorId: 1, timestamp: 1 });

// Query A: { sensorId: X } — includes shard key prefix → targets 1 shard ✓
// Query B: { location: Y, timestamp: ... } — scatter-gather (no shard key)
//   → Add an index to make scatter-gather as fast as possible:
db.sensorReadings.createIndex({ location: 1, timestamp: -1 });

// Alternative: two collections for two query patterns
// (CQRS approach for extreme scale)
sh.shardCollection('iot.readingsByDevice',   { sensorId: 1, timestamp: 1 });
sh.shardCollection('iot.readingsByLocation', { location: 1, timestamp: 1 });
// Write to both atomically (or use a change stream to fan out)

// Why NOT hashed on timestamp:
// sh.shardCollection('iot.sensorReadings', { timestamp: 'hashed' });
// → Even distribution ✓ but range queries always scatter-gather ✗

// Why NOT range on timestamp alone:
// sh.shardCollection('iot.sensorReadings', { timestamp: 1 });
// → Hot spot: all inserts go to newest chunk ✗`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the minimum number of replica set members needed for automatic failover?',
      options: ['1 (standalone)', '2 (primary + secondary)', '3 (primary + 2 secondaries or arbiter)', '5 members'],
      answer: 2,
      explanation: 'A minimum of 3 voting members is needed for automatic failover. With 2 members, if the primary fails, the remaining secondary cannot achieve a majority (2/2 = 100% required, but only 1 node remains) and cannot elect itself primary. Three members allow a majority vote with 2 of 3 nodes.',
    },
    {
      q: 'What is a "scatter-gather" query in a sharded cluster?',
      options: [
        'A query that runs on all shards in parallel and merges results',
        'A query that targets only one shard',
        'A balancer operation that moves chunks between shards',
        'A query that uses the aggregation pipeline across shards',
      ],
      answer: 0,
      explanation: 'A scatter-gather query is one that doesn\'t include the shard key, so mongos must broadcast it to ALL shards, collect results from each, and merge them. This becomes proportionally more expensive as you add shards. Include the shard key in frequent queries to avoid scatter-gather.',
    },
    {
      q: 'Why is a monotonically increasing field (like a timestamp) a poor shard key for write-heavy collections?',
      options: [
        'Timestamps have low cardinality',
        'All new writes go to the same (latest) chunk, creating a hot spot on one shard',
        'MongoDB cannot index timestamp fields in a sharded collection',
        'Timestamps cause the oplog to fill up faster',
      ],
      answer: 1,
      explanation: 'With a monotonically increasing shard key, all inserts always have the highest value and go to the last chunk. That chunk always lives on one shard, making it a hot spot while other shards sit idle. Use a hashed shard key or a compound key with a high-cardinality leading field to distribute writes evenly.',
    },
    {
      q: 'What does write concern { w: "majority" } guarantee?',
      options: [
        'The write is acknowledged only by the primary',
        'The write is acknowledged by all replica set members',
        'The write is acknowledged by the majority of voting members — survives primary failover',
        'The write is committed to disk on the primary',
      ],
      answer: 2,
      explanation: 'w:"majority" waits for a majority of voting replica set members to acknowledge the write before returning. This means the write is durable: even if the primary fails immediately after the write, the majority already have it and the new primary will preserve it. w:1 (primary only) can lose writes if the primary crashes before replication.',
    },
    {
      q: 'What is the role of mongos in a sharded cluster?',
      options: [
        'Stores cluster metadata (chunk ranges, shard locations)',
        'Acts as a router — clients connect to it and it routes queries to the correct shards',
        'Holds a copy of all data for backup purposes',
        'Manages replica set elections within each shard',
      ],
      answer: 1,
      explanation: 'mongos is the router process. Application clients connect to mongos as if it were a regular mongod. mongos consults the config servers to determine which shard(s) contain the relevant chunks and routes queries accordingly. It merges results from multiple shards for scatter-gather queries.',
    },
    { q: 'What are the roles of primary, secondary, and arbiter nodes in a MongoDB replica set?', options: ['All nodes in a replica set are identical — any can accept writes at any time; the primary label is just for monitoring', 'The primary is the only node that accepts writes; secondaries replicate the primary oplog and can serve reads; arbiters participate in elections but store no data and cannot become primary', 'Secondaries accept writes for local collections while the primary handles all cross-collection writes for consistency', 'Arbiters store a compressed copy of the full dataset and exist purely for disaster recovery without serving reads'], answer: 1, explanation: 'Replica set roles: Primary: the single writable node. All write operations go to the primary. Writes are journaled and added to the oplog. Secondary: replicates the primary oplog asynchronously. By default reads go to primary, but secondaryPreferred / secondary readPreference can route reads to secondaries. Secondaries cannot accept writes. Arbiter: a lightweight node with no data. Votes in elections to break ties. Used to achieve an odd number of voting members without the cost of a full data copy. Should not be used in replica sets with 2 data-bearing nodes — adds no durability. Oplog: a special capped collection (local.oplog.rs) that records every write in a format secondaries can replay. Size is configurable. Default: 5% of disk space or 50GB, whichever is smaller. Secondaries tail the oplog continuously and apply operations to their local copy.' },
    { q: 'How does the MongoDB primary election process work after a primary failure?', options: ['A static standby node called the backup-primary automatically takes over without any election, ensuring zero-downtime failover', 'When a primary becomes unreachable, remaining members hold an election where nodes vote for the candidate with the highest priority and most up-to-date oplog; the first candidate to win majority votes becomes the new primary', 'Elections are managed by a separate election service deployed alongside mongod; replica set members only vote if they hold a special election token', 'Any secondary that detects the primary is down can immediately declare itself primary without an election to minimize failover time'], answer: 1, explanation: 'Election process: trigger: a secondary detects the primary is unreachable via heartbeat timeout (default 10 seconds). The secondary calls an election. Candidacy: a node declares itself a candidate if it has priority > 0 and its oplog is not too far behind. Voting: each voting member casts one vote. A candidate wins if it receives a majority of votes (more than half of all voting members). Priority: nodes with higher priority are preferred as candidates. Priority 0 nodes cannot become primary. Election term: each election increments the election term. This prevents stale primaries from being accepted. Oplog freshness: a candidate with an older oplog than another candidate will yield in the election. Write concern during election: writes with w: majority block until the new primary is elected and replication catches up. Availability window: a replica set is unavailable for writes during the election period (typically 10-30 seconds).' },
    { q: 'What is horizontal sharding in MongoDB and what is a shard key?', options: ['Sharding in MongoDB means running multiple mongod instances on different CPU cores of the same server to maximize parallelism', 'Sharding distributes data across multiple servers (shards) by partitioning the collection using a shard key — each document is routed to exactly one shard based on its shard key value', 'Sharding is a backup strategy where data is replicated across three independent data centers for disaster recovery', 'Sharding splits large BSON documents across multiple shards when documents exceed the 16MB size limit'], answer: 1, explanation: 'Sharding architecture: mongos: the query router. Clients connect to mongos, not directly to shards. Config servers (CSRS): a replica set storing cluster metadata (chunk ranges, shard locations). Shards: replica sets that store subsets of the data. Shard key: a field or compound field used to partition data. Each document is assigned to a shard based on its shard key value. Chunk: a contiguous range of shard key values. Default chunk size: 128MB. Chunks are migrated between shards by the balancer. Routing: for queries that include the shard key, mongos routes to the correct shard (targeted query). For queries without the shard key, mongos broadcasts to all shards and merges results (scatter-gather — expensive). Sharding is irreversible: you cannot unshard a collection. Choose the shard key carefully before sharding.' },
    { q: 'What is the difference between range-based and hashed sharding strategies in MongoDB?', options: ['Range-based sharding is for numeric fields only; hashed sharding supports all BSON types including strings and ObjectIds', 'Range-based sharding partitions data into contiguous value ranges enabling efficient range queries but risking hotspots on monotonically increasing keys; hashed sharding distributes data evenly using a hash of the key, preventing hotspots but making range queries scatter-gather', 'Hashed sharding is the default for all new collections; range-based sharding must be enabled per-shard by the DBA', 'Range-based sharding requires a unique shard key; hashed sharding allows duplicate shard key values and is the only strategy for non-unique fields'], answer: 1, explanation: 'Range-based sharding: data is divided into contiguous ranges of shard key values. Chunk { _id: MinKey } to { _id: 100 } on shard A, { _id: 100 } to { _id: 200 } on shard B. Pro: efficient range queries (query a single shard). Con: hotspot risk — if the shard key is monotonically increasing (e.g., ObjectId, timestamp), new writes always go to the last chunk. The last shard handles all writes. Hashed sharding: MongoDB hashes the shard key value before assigning to a chunk. Pros: uniform write distribution — monotonically increasing keys become scattered. No write hotspot. Cons: range queries are now scatter-gather (hash destroys locality). Creating: sh.shardCollection("db.col", { userId: "hashed" }) for hashed. sh.shardCollection("db.col", { region: 1, createdAt: 1 }) for range. Zone sharding: a hybrid — assign shard key ranges to specific geographic shards. E.g., US users on US shard, EU users on EU shard.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I monitor replication lag in a replica set?',
      a: 'Run <code>rs.status()</code> in mongosh — each secondary shows <code>optimeDate</code> vs the primary\'s <code>optimeDate</code>; the difference is the replication lag. Also use <code>db.adminCommand({ replSetGetStatus: 1 })</code> programmatically. In Atlas, the Replication Lag metric is on the Metrics tab. A healthy replica set has lag under 10 seconds. Causes of high lag: network latency between nodes, secondary under heavy read load (competing with replication), oplog too small (secondary falls behind and must resync from scratch), or a slow disk on the secondary.',
    },
    {
      q: 'When should I use sharding vs vertical scaling?',
      a: 'Start with a replica set and vertical scaling (more CPU/RAM/storage on the primary). Sharding adds significant operational complexity. Consider sharding when: your working set no longer fits in RAM on the largest available instance; single-node write throughput is a bottleneck; you need geo-distributed data (zone sharding). Most applications reach hundreds of GB on a single instance before needing sharding. Atlas makes sharding easier but it still requires careful shard key design — a bad shard key is very hard to change.',
    },
    {
      q: 'Can I change the shard key after collection creation?',
      a: 'MongoDB 5.0+ allows <strong>resharding</strong>: <code>db.adminCommand({ reshardCollection: "db.coll", key: { newKey: 1 } })</code>. This creates a new sharded collection with a different key by copying all documents — it runs in the background without downtime but uses significant I/O and CPU. Before 5.0, the shard key was truly immutable. Even with resharding available, choose carefully upfront — resharding a large collection takes hours or days.',
    },
    {
      q: 'What is zone sharding and when is it useful?',
      a: 'Zone sharding (formerly tag-aware sharding) lets you pin specific shard key ranges to specific shards. Use cases: (1) <strong>geo-distributed data</strong> — EU customer data stays on EU shards for GDPR compliance; (2) <strong>hot/cold tiering</strong> — recent data on fast SSD shards, old data on cheaper HDD shards; (3) <strong>workload isolation</strong> — separate analytics from transactional workloads. Configure with <code>sh.addShardToZone("shard1", "EU")</code> and <code>sh.updateZoneKeyRange("db.coll", { region: "EU" }, { region: "EU~" }, "EU")</code>.',
    },
    {
      q: 'What is a hidden replica set member and when should I use one?',
      a: 'A hidden member (<code>hidden: true, priority: 0</code> in rs config) replicates from the primary but is never eligible to become primary and is invisible to drivers (never receives read traffic). Use cases: (1) <strong>dedicated reporting/analytics</strong> — run expensive queries without impacting the primary or regular secondaries; (2) <strong>backup node</strong> — take snapshots without locking the primary; (3) <strong>delayed replica</strong> (set <code>secondaryDelaySecs</code>) — lags behind intentionally as a time-travel backup against accidental deletes or corruption.',
    },
    { q: 'How do you monitor replication lag in a MongoDB replica set?', a: 'Replication lag: the time difference between when a write is applied on the primary and when it appears on a secondary. Monitoring methods: rs.printSecondaryReplicationInfo(): shows the lag for each secondary in human-readable form. db.adminCommand({ replSetGetStatus: 1 }): returns full replica set status including optimeDate (time of last oplog entry applied) and lastHeartbeatMessage for each member. Lag formula: primary optimeDate minus secondary optimeDate = replication lag. Automated monitoring: set up alerts in Atlas or use a Prometheus exporter with the mongodb_replication_lag_seconds metric. Acceptable lag: depends on the use case. For read-your-own-writes with secondaries, lag > 1 second may cause visible inconsistency. For analytics replicas, minutes of lag may be acceptable. Causes of high lag: sustained high write rate exceeding secondary apply throughput. Secondary under load (slow disk, competing queries). Network congestion between primary and secondary. Long-running operations on secondary blocking oplog application (before parallel oplog apply, removed in MongoDB 4.4+). Delayed replicas: intentionally configured to lag by hours for accidental write recovery. Monitored separately.' },
    { q: 'What are delayed replicas in MongoDB and what are they used for?', a: 'Delayed replica: a secondary configured with a slaveDelay (replication delay) that intentionally applies the oplog N hours behind the primary. Configuration: in the replica set config, set members[x].secondaryDelaySecs: 3600 (1 hour delay). Also set priority: 0 (cannot become primary) and hidden: true (not returned by db.isMaster() — clients cannot accidentally read from it). Purpose: accidental write recovery. If a developer accidentally drops a collection or runs a bad update, the delayed replica has the state from before the mistake. You can stop the delayed replica, dump the collection, and restore it to the primary. Recovery procedure: rs.freeze(1000000) on the delayed replica to prevent it from syncing further. Use mongoexport or mongodump to extract the data. Apply the recovered data to the primary. Resume replication on the delayed replica. Trade-off: the delay means the delayed replica is only useful for recovering mistakes made more than delay-time ago. Disk cost: the delayed replica stores a full copy of the data. Delayed replicas do NOT protect against disk corruption or datacenter failure — that is what geo-distributed replicas are for.' },
    { q: 'How does zone sharding work for geographic data distribution in MongoDB?', a: 'Zone sharding: assigns specific shard key value ranges to specific shards (zones). Used for geographic data isolation — route EU user data to EU shards, US data to US shards. Setup: sh.addShardTag("shard0001", "EU"): assigns shard0001 to zone EU. sh.addTagRange("db.users", { region: "EU" }, { region: "EU" + "" }, "EU"): assigns the EU region range to the EU zone. Note: the "" trick creates the upper bound that is lexicographically after all EU strings. Repeat for US zone on different shards. Chunk placement: the balancer migrates chunks to satisfy zone assignments. Once configured, new EU documents automatically land on EU-zoned shards. Use cases: GDPR compliance (EU data must stay in EU). Data sovereignty requirements. Reduced latency (route requests to geographically close shards). Combining with replica sets: each shard is a replica set. EU shards can be replica sets hosted in EU data centers. Zone sharding does not prevent cross-shard queries if the shard key is omitted from the query — scatter-gather still queries all shards.' },
    { q: 'How does chunk balancing work in a MongoDB sharded cluster?', a: 'Chunks: the unit of data distribution in sharding. A chunk is a contiguous range of shard key values. Default size: 128MB. When a chunk grows beyond the maximum size, MongoDB automatically splits it. Balancer: a background process (runs on config server primary) that monitors chunk counts per shard. When the difference between the shard with the most chunks and the shard with fewest exceeds a threshold (default: 8), the balancer moves chunks to rebalance. Chunk migration: the source shard copies the chunk documents to the destination shard. During migration, writes to the chunk go to the source shard and are also forwarded to the destination. Once migration completes, config servers update the chunk map and the destination shard owns the chunk. Performance impact of migration: migration causes additional I/O and network traffic. Migrations are throttled by default. In MongoDB 6.0+, the balancer is more aggressive and supports concurrent migrations. Preventing migration during peak hours: sh.setBalancerState(false) disables the balancer. Schedule downtime: use time windows for balancing: sh.setBalancerWindow({ start: "02:00", stop: "06:00" }). Monitoring: sh.status() shows chunk distribution across shards.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Replica sets provide HA via automatic failover using the oplog; sharding scales horizontally by splitting data across shards using a carefully chosen shard key.',
    mustKnow: [
      'Replica set: 1 primary + N secondaries; minimum 3 members for failover',
      'Oplog is the replication mechanism — capped collection on every member',
      'w:"majority" write concern — survives primary failover',
      'Read preference: primary (consistent) vs secondary (stale, high-throughput)',
      'Sharding: shards (data) + config servers (metadata) + mongos (router)',
      'Shard key must have high cardinality + even distribution — avoid hot spots',
      'Scatter-gather: queries without shard key hit ALL shards — expensive',
    ],
    interviewFocus: [
      'When to use sharding vs vertical scaling',
      'How to choose a good shard key — hot spot avoidance',
      'w:"majority" vs w:1 — durability trade-offs',
      'Scatter-gather queries and how to avoid them',
      'Replication lag — causes and monitoring',
    ],
  };
}
