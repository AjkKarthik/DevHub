import { Component, signal, computed } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';

interface InterviewQuestion {
  q: string;
  a: string;
  difficulty: 'junior' | 'mid' | 'senior';
  topic: string;
}

@Component({
  selector: 'app-mongo-interview-prep',
  standalone: true,
  imports: [PageMetaComponent],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
})
export class MongoInterviewPrep {
  readonly difficulties = ['all', 'junior', 'mid', 'senior'];
  activeDiff = signal<string>('all');
  activeTopic = signal('All');

  readonly questions: InterviewQuestion[] = [
    // Junior
    {
      difficulty: 'junior', topic: 'Fundamentals',
      q: 'What is the difference between MongoDB and a relational database?',
      a: 'MongoDB is a document database — it stores data as BSON documents (similar to JSON objects) in collections, while relational databases store data in tables with rows and columns. Key differences: (1) <strong>Schema</strong>: MongoDB is schema-flexible — documents in the same collection can have different fields; SQL tables have a fixed schema. (2) <strong>Joins</strong>: SQL uses JOINs to combine tables; MongoDB avoids joins by embedding related data or using the $lookup aggregation stage. (3) <strong>Normalization</strong>: SQL normalizes data to avoid duplication; MongoDB often denormalizes (embeds) for read performance. (4) <strong>Transactions</strong>: both support ACID transactions; MongoDB added multi-document transactions in v4.0.',
    },
    {
      difficulty: 'junior', topic: 'Fundamentals',
      q: 'What is an ObjectId and why does MongoDB use it instead of auto-increment integers?',
      a: 'An ObjectId is a 12-byte BSON type used as the default _id. Structure: 4-byte Unix timestamp + 5-byte random value + 3-byte incrementing counter. Benefits: (1) Generated <strong>client-side</strong> without a round-trip to the database; (2) <strong>Globally unique</strong> across distributed systems — no coordination needed; (3) <strong>Contains creation timestamp</strong> (extractable with <code>new ObjectId(id).getTimestamp()</code>); (4) <strong>No sequential enumeration</strong> vulnerability. Downside: 24-char hex strings are less readable than integers.',
    },
    {
      difficulty: 'junior', topic: 'CRUD',
      q: 'What is the difference between updateOne with $set vs replaceOne?',
      a: '<strong>updateOne with $set</strong>: updates only the specified fields, leaving all other fields unchanged. <code>updateOne({ _id: id }, { $set: { status: "shipped" } })</code> — only "status" changes. <strong>replaceOne</strong>: replaces the entire document with a new one (preserving only _id). <code>replaceOne({ _id: id }, { status: "shipped" })</code> — the result ONLY has _id and status. Use $set for partial updates (common); use replaceOne when you want to completely replace the document.',
    },
    {
      difficulty: 'junior', topic: 'Indexes',
      q: 'What is a MongoDB index and why does it matter?',
      a: 'An index is a B-tree data structure that stores sorted field values, allowing MongoDB to find matching documents without scanning the entire collection. Without an index, MongoDB performs a <strong>COLLSCAN</strong> — reads every document. With an index, it performs an <strong>IXSCAN</strong> — reads only matching entries. On a 10M-document collection, an indexed query might examine 1 document vs 10M without an index. Trade-off: indexes use disk space and slow down writes (every write updates indexes). Create indexes only on frequently queried or sorted fields.',
    },
    {
      difficulty: 'junior', topic: 'Schema',
      q: 'When should you embed documents vs use references in MongoDB?',
      a: '<strong>Embed</strong> when: data is always read together (order + its items); the child entity doesn\'t exist independently; one-to-few relationship; reading is the primary operation. <strong>Reference</strong> when: the same data is shared by multiple parents (a product referenced by many orders); the child entity is frequently accessed independently; one-to-many with large arrays (risk of 16MB document limit); write-heavy workloads. Rule of thumb: embed for "has-a" ownership, reference for "shared" or "large" relationships.',
    },

    // Mid
    {
      difficulty: 'mid', topic: 'Aggregation',
      q: 'Explain the aggregation pipeline and give a real-world example.',
      a: 'The aggregation pipeline is a series of stages that transform documents. Each stage\'s output is the next stage\'s input. Common stages: $match (filter), $group (aggregate), $project (shape), $sort, $limit, $unwind (flatten arrays), $lookup (join). Example — monthly revenue by category: <code>[{ $match: { date: { $gte: startDate } } }, { $group: { _id: { month: { $month: "$date" }, category: "$category" }, revenue: { $sum: { $multiply: ["$price", "$qty"] } } } }, { $sort: { "_id.month": 1 } }]</code>. The pipeline runs server-side and MongoDB optimizes stage ordering automatically.',
    },
    {
      difficulty: 'mid', topic: 'Indexes',
      q: 'What is the ESR rule for compound indexes?',
      a: 'ESR stands for <strong>Equality → Sort → Range</strong> — the recommended field order in compound indexes. (E) Equality fields first: fields with exact-value queries (<code>{ status: "active" }</code>); (S) Sort fields next: fields used in .sort(); (R) Range fields last: fields with $gt/$lt/$in. Example query: <code>find({ status: "active", age: { $gte: 18 } }).sort({ createdAt: -1 })</code> → optimal index: <code>{ status: 1, createdAt: -1, age: 1 }</code>. Equality first makes the index maximally selective; sort next avoids in-memory sort; range last because ranges only partially constrain the index.',
    },
    {
      difficulty: 'mid', topic: 'Performance',
      q: 'How do you diagnose a slow query in MongoDB?',
      a: '(1) <code>.explain("executionStats")</code> — look for COLLSCAN vs IXSCAN; check <code>totalDocsExamined / nReturned</code> ratio (high = inefficient). (2) Enable the <strong>Database Profiler</strong>: <code>db.setProfilingLevel(1, { slowms: 100 })</code> — logs slow queries to system.profile. (3) <code>db.currentOp()</code> — view currently running slow operations. (4) <code>db.collection.aggregate([{ $indexStats: {} }])</code> — see index usage. Common fixes: add an index following the ESR rule; add a projection to reduce data; check for missing compound index prefix in the query.',
    },
    {
      difficulty: 'mid', topic: 'Transactions',
      q: 'When should you use a MongoDB transaction, and what is the overhead?',
      a: 'Use a transaction when you need atomicity across <strong>multiple documents or collections</strong> — e.g., bank transfer (debit + credit), order + inventory update, cascading delete. Do NOT use for single-document operations (already atomic). Transaction overhead: replica set coordination; lock acquisition; 60-second timeout; ~10-30ms per transaction vs individual writes. Prefer schema redesign to eliminate transactions: embed related data, use $inc atomic counters, or use findOneAndUpdate for atomic compare-and-swap. <code>withTransaction()</code> auto-retries on TransientTransactionError.',
    },
    {
      difficulty: 'mid', topic: 'Change Streams',
      q: 'What are change streams and how do they differ from polling?',
      a: 'Change streams subscribe to real-time data changes via <code>collection.watch()</code>. Differences from polling: (1) <strong>Efficiency</strong>: polling queries MongoDB on a schedule (most polls find nothing); change streams push events only when data changes. (2) <strong>Latency</strong>: polling has up-to-interval latency; change streams deliver within milliseconds. (3) <strong>Reliability</strong>: persist the resume token, reconnect with <code>resumeAfter</code> — no missed events; polling must track timestamps manually. Require a replica set (built on the oplog).',
    },

    // Senior
    {
      difficulty: 'senior', topic: 'Schema',
      q: 'How do you design a schema for a social media app with posts and millions of comments?',
      a: 'Naive embedding (all comments in the post) fails: viral threads hit the 16MB document limit; every like/comment requires rewriting the parent. Better: <strong>Bucket pattern for comments</strong> — store comments in separate bucket documents (50 comments each), linked to post _id. When a bucket is full, create a new one. Bounds document size and enables efficient pagination. <strong>Computed pattern for counts</strong> — store like/comment counts on the post as $inc-updated integers (atomic). <strong>Extended reference pattern</strong> — keep the latest 3 comments on the post document (fast preview), load more from bucket documents on demand.',
    },
    {
      difficulty: 'senior', topic: 'Performance',
      q: 'What is the WiredTiger cache and how does it affect MongoDB performance?',
      a: 'WiredTiger is MongoDB\'s default storage engine (since v3.2). It maintains an in-memory <strong>cache</strong> (default: 50% of RAM - 1GB) of hot data and index pages. Cache hit (data in memory) → fast. Cache miss (disk read) → 100-1000× slower. Keys to performance: (1) Keep the <strong>working set</strong> (hot data + indexes) in RAM; (2) <strong>Covered queries</strong> (fully answered from index, no document fetch) are fastest; (3) Projections reduce data size but may still need document pages unless covered; (4) Shard to distribute working set across multiple nodes\' caches if a single node can\'t hold it.',
    },
    {
      difficulty: 'senior', topic: 'Replication',
      q: 'Explain the MongoDB oplog and how it enables replica set replication.',
      a: 'The <strong>oplog</strong> (operations log) is a capped collection (<code>local.oplog.rs</code>) on every replica set member. When the PRIMARY executes a write, it appends an idempotent log entry. Secondaries continuously tail the primary\'s oplog and replay operations to stay in sync. The oplog is capped — oldest entries are overwritten when full. If a secondary falls too far behind (its oplog position is overwritten), it must resync from scratch. <strong>Set oplog size</strong> larger than your expected maximum downtime × write rate. Change streams are built on the oplog — they expose a filtered, resumable view of oplog events to application code.',
    },
    {
      difficulty: 'senior', topic: 'Sharding',
      q: 'How do you choose an optimal shard key for a high-write IoT application?',
      a: 'Good shard key requirements: (1) <strong>High cardinality</strong> — many distinct values; (2) <strong>Even write distribution</strong> — no hot shard; (3) <strong>Query isolation</strong> — frequent queries include the shard key. For IoT: <strong>Bad</strong>: timestamp alone → monotonically increasing → all writes to last chunk (hot spot). <strong>Good</strong>: compound <code>{ deviceId: 1, timestamp: 1 }</code> — deviceId provides cardinality (many devices spread writes); timestamp within deviceId supports per-device range queries. Consider hashed on deviceId for maximum write throughput if range queries are not needed. Test shard key candidates with your actual cardinality before committing — resharding is expensive.',
    },
    {
      difficulty: 'senior', topic: 'Performance',
      q: 'What is the difference between read concern "local", "majority", and "linearizable"?',
      a: '<strong>local</strong> (default): reads data that may not have been replicated to majority yet. Can read data that gets rolled back after a primary failover. Fast. <strong>majority</strong>: reads only majority-committed data. Prevents reading rolled-back data. Slightly slower. Use for financial or consistency-critical reads. <strong>linearizable</strong>: the strongest guarantee — reads the most up-to-date majority-committed data, verifying the node is still primary. Prevents stale-primary reads. Much slower. Pair <code>w:"majority"</code> writes with <code>readConcern:"majority"</code> reads for a strong, practical consistency model without full linearizable cost.',
    },
  ];

  get topics(): string[] {
    return ['All', ...new Set(this.questions.map(q => q.topic))];
  }

  readonly filtered = computed(() => {
    const diff = this.activeDiff();
    const topic = this.activeTopic();
    return this.questions.filter(q => {
      const matchesDiff = diff === 'all' || q.difficulty === diff;
      const matchesTopic = topic === 'All' || q.topic === topic;
      return matchesDiff && matchesTopic;
    });
  });
}
