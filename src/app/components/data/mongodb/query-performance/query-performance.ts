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
  selector: 'app-mongo-query-performance',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './query-performance.html',
  styleUrl: './query-performance.scss',
})
export class MongoQueryPerformance {
  quickRef: QuickRefItem[] = [
    { type: 'method',  name: '.explain("executionStats")', desc: 'Return query plan + execution stats. Check stage, nReturned, totalDocsExamined.' },
    { type: 'keyword', name: 'COLLSCAN',           desc: 'Full collection scan — no index used. Always investigate and add an index.' },
    { type: 'keyword', name: 'IXSCAN',             desc: 'Index scan — good. Check totalDocsExamined vs nReturned ratio.' },
    { type: 'keyword', name: 'totalDocsExamined',  desc: 'Documents read from disk/cache. Should ≈ nReturned for efficient queries.' },
    { type: 'keyword', name: 'Profiler',           desc: 'db.setProfilingLevel(1, {slowms: 100}) logs queries above threshold.' },
    { type: 'keyword', name: 'system.profile',     desc: 'Collection where profiler stores slow operation records.' },
    { type: 'keyword', name: '$indexStats',        desc: 'Aggregation stage returning usage counts per index since last restart.' },
    { type: 'keyword', name: 'WiredTiger Cache',   desc: 'Default 50% of RAM – 1GB. Working set must fit in cache for good perf.' },
    { type: 'keyword', name: 'Connection Pool',    desc: 'MongoClient pool size (maxPoolSize: 100). Tune for concurrent workload.' },
    { type: 'keyword', name: 'Read Preference',    desc: 'primaryPreferred/secondary/nearest — route reads to replicas to spread load.' },
    { type: 'keyword', name: 'maxTimeMS',          desc: 'Kill queries that exceed a time limit. Prevents runaway queries from impacting cluster.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Diagnosing Slow Queries',
      points: [
        'The first step for any slow query: run <code>.explain("executionStats")</code>. Key metrics: <code>winningPlan.stage</code> (IXSCAN good, COLLSCAN bad), <code>totalDocsExamined</code> (should ≈ <code>nReturned</code>), <code>executionTimeMillis</code>, and <code>keysExamined</code>.',
        'The ratio <strong>totalDocsExamined / nReturned</strong> measures index efficiency. A ratio of 1:1 means every examined document was returned (perfect). A ratio of 1000:1 means scanning 1000 documents to return 1 — a selective index could help. A ratio of 0:0 means a covered query (excellent).',
        'Enable the <strong>MongoDB Profiler</strong> to capture slow operations automatically: <code>db.setProfilingLevel(1, { slowms: 100 })</code> (1 = profile slow ops; 2 = profile all). Read from <code>db.system.profile</code>. Disable in production if overhead is a concern; enable only when investigating.',
        '<strong>currentOp()</strong> shows currently running operations: <code>db.currentOp({ active: true, secs_running: { $gt: 5 } })</code>. Kill a stuck operation with <code>db.killOp(opId)</code>. Use this to diagnose active performance issues.',
        'Atlas Performance Advisor automatically analyses query patterns and recommends indexes. It also shows "slow queries" with their plans in the Atlas UI — use this before manually profiling for Atlas-hosted clusters.',
      ],
    },
    {
      heading: 'Common Performance Anti-Patterns',
      points: [
        '<strong>COLLSCAN on large collections</strong>: the most common issue. Always add an index for fields used in query filters. Check explain() for every new query pattern before deploying to production.',
        '<strong>Fetch-then-filter in application code</strong>: <code>collection.find({}).toArray().then(docs => docs.filter(...))</code> — loads the entire collection into memory. Use MongoDB query operators to filter on the server, never in application code.',
        '<strong>Poor selectivity</strong>: an index on a boolean field (true/false) has only 2 distinct values — half the collection matches "active: true". MongoDB may choose a COLLSCAN because the index isn\'t selective enough. Add more fields to the compound index to increase selectivity.',
        '<strong>Large skip()</strong>: <code>.skip(100000).limit(10)</code> scans and discards 100,000 documents. Replace with cursor-based pagination using a range filter on an indexed field.',
        '<strong>Unguarded find({})</strong>: no filter + no limit = load entire collection. Always add query filters and a limit() on collection.find() calls in production code.',
      ],
    },
    {
      heading: 'Cache & Memory',
      points: [
        'WiredTiger maintains an in-memory cache (default: 50% of RAM - 1 GB). Data pages and index pages must be in the cache for fast access. If the working set (hot data + hot indexes) exceeds the cache, MongoDB must read from disk on cache misses (~1 ms per page vs ~50 ns from cache).',
        'Monitor cache health: <code>db.serverStatus().wiredTiger.cache</code>. Key metrics: "pages read into cache" (should be low relative to "pages read from cache" — few disk reads is good), "cache hit ratio" (aim for > 99%).',
        'Index sizes matter: all active indexes should fit in the WiredTiger cache. <code>db.collection.stats().indexSizes</code> shows each index\'s memory footprint. Remove unused indexes to free cache space.',
        'Projection reduces the data fetched from cache/disk. Even if the working set fits in cache, projecting away large array fields or text content reduces bytes transferred over the MongoDB wire — improving throughput.',
        'Compression: WiredTiger uses snappy compression by default. A 100 MB raw collection may only use 20 MB on disk and in cache. This effectively increases the "working set" that fits in RAM.',
      ],
    },
    {
      heading: 'Connection & Write Performance',
      points: [
        'Connection pool sizing: <code>maxPoolSize</code> defaults to 100. Set it based on your application\'s actual concurrency. Too small = queued requests when all connections are busy. Too large = connection overhead on the server. A good starting point: set maxPoolSize = max concurrent requests your service handles.',
        'Write concern affects write latency: <code>{ w: 1 }</code> (default) — primary acknowledges write. <code>{ w: "majority" }</code> — majority of replica set acknowledges (slower but durable). <code>{ w: 0 }</code> — fire-and-forget (fastest, no acknowledgement). Choose based on durability requirements.',
        '<strong>Bulk writes</strong>: replace loops of single insertOne/updateOne with <code>bulkWrite()</code>. Sends all operations in one network round-trip. 10× faster for large batches.',
        '<strong>Read preference</strong>: route reads to secondaries with <code>readPreference: "secondary"</code> or "secondaryPreferred" to distribute read load. Note: secondary reads may be slightly stale (replication lag). Use only for analytics, reporting, and other latency-tolerant reads.',
        '<strong>maxTimeMS</strong>: set a time limit on queries to prevent runaway operations from degrading the cluster. <code>find({}).maxTimeMS(5000)</code> — throws MongoExecutionTimeoutError if the query takes > 5 seconds.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Explain & Diagnose',
      language: 'typescript',
      code: `const users = db.collection('users');

// Run explain to analyse a query
const result = await users
  .find({ status: 'active', createdAt: { $gte: new Date('2024-01-01') } })
  .sort({ score: -1 })
  .limit(10)
  .explain('executionStats');

// Check the winning plan
const plan  = result.queryPlanner.winningPlan;
const stats = result.executionStats;
console.log('Stage:', plan.stage);                     // IXSCAN or COLLSCAN
console.log('Index:', plan.inputStage?.indexName);
console.log('Docs returned:', stats.nReturned);
console.log('Docs examined:', stats.totalDocsExamined);  // ideal: ≈ nReturned
console.log('Keys examined:', stats.totalKeysExamined);
console.log('Exec time ms:', stats.executionTimeMillis);

// Check in-memory sort (bad for large result sets)
function hasSortStage(plan: any): boolean {
  if (plan.stage === 'SORT') return true;
  if (plan.inputStage) return hasSortStage(plan.inputStage);
  return false;
}
if (hasSortStage(plan)) console.warn('In-memory sort detected — add index for sort field');

// Profiler: log queries > 100ms
await db.command({ profile: 1, slowms: 100 });
// Read recent slow queries:
const slowOps = await db.collection('system.profile')
  .find({}).sort({ ts: -1 }).limit(10).toArray();
slowOps.forEach(op => {
  console.log(op.op, op.ns, op.millis, 'ms', JSON.stringify(op.query ?? op.command));
});`,
    },
    {
      label: 'Anti-Patterns Fixed',
      language: 'typescript',
      code: `// ❌ BAD: Fetch-then-filter in application code
const allUsers = await db.collection('users').find({}).toArray();
const activeUK = allUsers.filter(u => u.status === 'active' && u.country === 'UK');

// ✅ GOOD: Filter on server with index
const activeUK2 = await db.collection('users')
  .find({ status: 'active', country: 'UK' })
  .sort({ createdAt: -1 })
  .limit(50)
  .toArray();

// ❌ BAD: Large skip for pagination
const page100 = await db.collection('products')
  .find({ category: 'tech' }).sort({ price: 1 }).skip(10000).limit(10).toArray();

// ✅ GOOD: Cursor-based pagination
const page100good = await db.collection('products').find({
  category: 'tech',
  price: { $gt: lastSeenPrice }, // cursor from previous page
}).sort({ price: 1 }).limit(10).toArray();

// ❌ BAD: Multiple single-document writes in a loop
for (const item of items) {
  await db.collection('inventory').updateOne({ sku: item.sku }, { $inc: { qty: -item.qty } });
}

// ✅ GOOD: bulkWrite — one round-trip
await db.collection('inventory').bulkWrite(
  items.map(item => ({
    updateOne: { filter: { sku: item.sku }, update: { $inc: { qty: -item.qty } } },
  }))
);`,
    },
    {
      label: 'Timeouts & Limits',
      language: 'typescript',
      code: `// maxTimeMS — kill slow queries before they impact the cluster
const results = await db.collection('reports')
  .find({ dateRange: { $gte: new Date('2020-01-01') } })
  .maxTimeMS(5000) // throw if query exceeds 5 seconds
  .toArray();

// Set cluster-wide maxTimeMS default (mongosh):
// db.adminCommand({ setParameter: 1, defaultMaxTimeMS: 10000 })

// Read from secondary replicas to spread read load
const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(uri, {
  readPreference: 'secondaryPreferred', // prefer secondary, fallback to primary
  maxPoolSize: 50,
  serverSelectionTimeoutMS: 5000,
});

// Per-query read preference
const analyticsResults = await db.collection('orders')
  .find({ status: 'completed' })
  .withReadPreference('secondary') // use secondary for this analytics query
  .toArray();

// Monitor connection pool
const serverStatus = await db.command({ serverStatus: 1 });
console.log('Current connections:', serverStatus.connections.current);
console.log('Available connections:', serverStatus.connections.available);

// Index stats — find unused indexes
const indexStats = await db.collection('users').aggregate([
  { $indexStats: {} },
]).toArray();
indexStats.forEach(idx => {
  console.log(idx.name, 'ops:', idx.accesses.ops);
  if (idx.accesses.ops === 0) console.warn('Unused index:', idx.name);
});`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not checking explain() before deploying a new query to production',
      wrong: `// Deployed without checking — causes COLLSCAN on 10M document collection
const users = await db.collection('users').find({ lastLogin: { $lt: thirtyDaysAgo } }).toArray();
// After deploy: API response time went from 10ms to 15 seconds`,
      right: `// Always explain() new queries before deploying
const explanation = await db.collection('users')
  .find({ lastLogin: { $lt: thirtyDaysAgo } })
  .explain('executionStats');
console.log('Stage:', explanation.queryPlanner.winningPlan.stage); // Must be IXSCAN

// If COLLSCAN:
await db.collection('users').createIndex({ lastLogin: 1 });`,
      explanation: 'A query that runs fine on a 1000-document dev database becomes a seconds-long COLLSCAN on a production database with millions of documents. Always run .explain("executionStats") on new query patterns before deploying them.',
    },
    {
      title: 'Filtering in application code after fetching all documents',
      wrong: `const allProducts = await db.collection('products').find({}).toArray(); // loads ALL products
const cheap = allProducts.filter(p => p.price < 50 && p.inStock); // filter in JS
// If collection has 1M products: loads 1M docs, transfers all over wire`,
      right: `// Filter on the MongoDB server using query operators
const cheap = await db.collection('products')
  .find({ price: { $lt: 50 }, inStock: true })
  .limit(100)
  .toArray();`,
      explanation: 'MongoDB can filter, sort, and aggregate millions of documents server-side with indexes. Fetching everything into application memory then filtering negates all of MongoDB\'s performance capabilities and creates massive memory and network overhead.',
    },
    {
      title: 'Not setting maxTimeMS on potentially slow queries',
      wrong: `// No time limit — if someone queries 5 years of data, it runs indefinitely
const report = await db.collection('transactions').find({ userId }).toArray();
// A bad query can tie up connections for minutes`,
      right: `const report = await db.collection('transactions')
  .find({ userId, createdAt: { $gte: thirtyDaysAgo } })  // narrow the range
  .limit(1000)
  .maxTimeMS(10_000) // kill if over 10 seconds
  .toArray();`,
      explanation: 'Without maxTimeMS, a slow query holds a connection (consuming from the pool) and MongoDB resources for its entire duration. Set maxTimeMS on all user-facing queries. Return 408 (Request Timeout) and ask the user to narrow their search.',
    },
    {
      title: 'Ignoring totalDocsExamined in explain output',
      wrong: `// explain shows: nReturned: 5, totalDocsExamined: 500000
// "It uses an IXSCAN so it's fine!"
// Not fine — index is not selective enough; scanning 500K docs for 5 results`,
      right: `// Check the ratio: totalDocsExamined / nReturned
// > 100:1 means the index is not selective
// Fix: improve index selectivity with compound index + more equality conditions
await col.createIndex({ status: 1, category: 1, createdAt: -1 });
// Re-run: nReturned: 5, totalDocsExamined: 5 (1:1 ratio — excellent)`,
      explanation: 'IXSCAN doesn\'t mean the query is efficient. If totalDocsExamined is 100× nReturned, the index is scanning many unneeded documents. A high-selectivity compound index reduces this ratio toward 1:1.',
    },
  ];

  challenge: Challenge = {
    title: 'Performance Audit',
    language: 'typescript',
    description: 'Given an e-commerce orders collection with 1 million documents, identify and fix these performance issues: (1) A COLLSCAN on find({ status, createdAt: {$gte} }).sort({ total: -1 }).limit(10). (2) A fetch-all-then-filter pattern getting orders for one user. (3) A loop doing 1000 individual insertOne calls instead of bulk. Write the fixed versions with proper indexes.',
    hints: [
      'For (1): ESR compound index — status=E, total=S, createdAt=R.',
      'For (2): index on userId + createdAt; use find({ userId }) directly.',
      'For (3): collect all docs first, then one insertMany or bulkWrite.',
    ],
    starterCode: `const orders = db.collection('orders');

// PROBLEM 1: COLLSCAN + in-memory sort
const slowQ1 = await orders.find({ status: 'completed', createdAt: { $gte: d } })
  .sort({ total: -1 }).limit(10).toArray();

// PROBLEM 2: Fetch all then filter
const allOrders = await orders.find({}).toArray();
const userOrders = allOrders.filter(o => o.userId.equals(userId));

// PROBLEM 3: Loop of individual inserts
for (const order of newOrders) {
  await orders.insertOne(order);
}

// TODO: Fix all three problems with proper indexes and queries`,
    solution: `const orders = db.collection('orders');

// FIX 1: ESR compound index → IXSCAN with index-ordered sort
await orders.createIndex({ status: 1, total: -1, createdAt: 1 });
const fastQ1 = await orders
  .find({ status: 'completed', createdAt: { $gte: d } })
  .sort({ total: -1 }).limit(10)
  .explain('executionStats');
console.log('Stage:', fastQ1.queryPlanner.winningPlan.inputStage?.stage); // IXSCAN

// FIX 2: Index on userId, filter on server
await orders.createIndex({ userId: 1, createdAt: -1 });
const userOrders = await orders
  .find({ userId })
  .sort({ createdAt: -1 })
  .limit(50)
  .toArray();

// FIX 3: bulkWrite — one round-trip
await orders.insertMany(newOrders);
// Or with mixed operations:
await orders.bulkWrite(newOrders.map(o => ({ insertOne: { document: o } })));`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does COLLSCAN in .explain() output indicate?',
      options: [
        'The query used a covered index',
        'A full collection scan — no index was used',
        'The query ran on a secondary replica',
        'The collection is capped',
      ],
      answer: 1,
      explanation: 'COLLSCAN means MongoDB read every document in the collection to find matches — O(n) time. IXSCAN means an index was used — O(log n). COLLSCAN on any collection with more than ~10,000 documents should be investigated and fixed with an index.',
    },
    {
      q: 'What does a totalDocsExamined / nReturned ratio of 10000:1 indicate?',
      options: [
        'An efficient covered query',
        'The query examined 10,000 documents to return 1 — poor index selectivity',
        'The index is corrupted',
        'The query is using a text index',
      ],
      answer: 1,
      explanation: 'The ideal ratio is 1:1 — every examined document is returned. A 10000:1 ratio means the index isn\'t selective enough. The query scans 10,000 documents to find 1 match. Add more specific filter conditions to a compound index to improve selectivity.',
    },
    {
      q: 'What does maxTimeMS(5000) do on a find() query?',
      options: [
        'Caches the result for 5000ms',
        'Throws MongoExecutionTimeoutError if the query takes longer than 5 seconds',
        'Retries the query for up to 5 seconds',
        'Sets the cursor expiry to 5 seconds',
      ],
      answer: 1,
      explanation: 'maxTimeMS sets a server-side time limit. If the operation exceeds this limit, MongoDB throws MongoExecutionTimeoutError. This prevents slow queries from monopolising connections and degrading the cluster for other users.',
    },
    {
      q: 'Which approach is more efficient for inserting 10,000 documents?',
      options: [
        'A for loop with 10,000 insertOne() calls',
        'insertMany() or bulkWrite() with all 10,000 documents',
        'Wrapping 10,000 insertOne() calls in a transaction',
        'Using $push to append all documents to one array',
      ],
      answer: 1,
      explanation: 'insertMany() and bulkWrite() send all documents in one or a few network round-trips. A loop of insertOne() makes 10,000 individual network calls. Network latency alone (even at 1ms per call) means 10 seconds for 10,000 inserts vs milliseconds for insertMany().',
    },
    {
      q: 'What is the purpose of the $indexStats aggregation stage?',
      options: [
        'Creates new indexes',
        'Returns usage statistics for each index, including access count since last restart',
        'Analyzes index fragmentation',
        'Returns the size of each index in bytes',
      ],
      answer: 1,
      explanation: '$indexStats returns access counts per index since the mongod process last started. An index with 0 accesses has never been used and is a candidate for removal — saving write overhead and cache space.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I identify which queries are slow in production?',
      a: '<strong>MongoDB Atlas</strong>: Performance Advisor automatically flags slow queries and recommends indexes. Query Profiler in the Atlas UI shows recent slow operations with their plans. <strong>Self-hosted</strong>: enable the database profiler (<code>db.setProfilingLevel(1, { slowms: 100 })</code>) to log queries > 100ms to <code>db.system.profile</code>. Query the profiler: <code>db.system.profile.find().sort({ millis: -1 }).limit(20)</code>. Check <code>op</code>, <code>ns</code>, <code>millis</code>, and <code>planSummary</code> fields.',
    },
    {
      q: 'How do I optimise an aggregation pipeline?',
      a: 'Key optimisation steps: (1) <strong>$match first</strong> — filter documents with index support before expensive stages. (2) <strong>$project early</strong> — reduce document size before stages that process all fields. (3) <strong>$sort + $limit together</strong> — MongoDB optimises these into a "top-N sort" that doesn\'t materialise all results. (4) <strong>Avoid $unwind + $group</strong> where possible — combine into single $group with array accumulator operators. (5) Run <code>pipeline.explain("executionStats")</code> to see each stage\'s cost. (6) Consider <code>allowDiskUse: true</code> for large in-memory sort stages.',
    },
    {
      q: 'What is the WiredTiger cache and how does it affect performance?',
      a: 'WiredTiger maintains an in-memory cache of "pages" (data and index). The cache defaults to 50% of RAM - 1 GB. When a query needs a page not in cache, it reads from disk (~0.5–5ms latency). When the working set (frequently accessed data + indexes) fits in the WiredTiger cache, queries are served entirely from memory (~50µs latency). Monitor: <code>db.serverStatus().wiredTiger.cache</code>. If "pages read into cache" is consistently high relative to "pages read from cache", your working set doesn\'t fit in RAM — add RAM or reduce index sizes.',
    },
    {
      q: 'When should I use secondary reads?',
      a: 'Route reads to secondaries (<code>readPreference: "secondary"</code>) for: analytics queries, reporting, data exports, and background jobs. Secondary reads have a small replication lag (typically <1s) so they may return slightly stale data — acceptable for analytics but not for user-facing queries that need the latest data. Spreading reads to secondaries reduces primary load, which is critical when the primary is also handling all writes. Atlas Analytics Nodes are dedicated read-only secondaries that don\'t participate in elections, optimised for analytical workloads.',
    },
    {
      q: 'How do I handle a "query planner chose the wrong index" situation?',
      a: 'First, check <code>.explain("allPlansExecution")</code> to see all candidate plans and why the planner chose its winner (cached plan from previous trial). Clear the cached plan: <code>db.adminCommand({ planCacheClear: "collectionName" })</code>. To force a specific index (testing only): <code>.find(filter).hint({ field: 1 })</code>. Longer term: if the planner consistently makes a wrong choice, your index design may be suboptimal — consider restructuring the compound index or using partial indexes for specific query patterns.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Diagnose with .explain("executionStats"): IXSCAN good, COLLSCAN bad; totalDocsExamined ≈ nReturned is the goal.',
    mustKnow: [
      '.explain("executionStats"): check stage, nReturned, totalDocsExamined, executionTimeMillis',
      'totalDocsExamined / nReturned ratio — ideal 1:1; high ratio = poor selectivity',
      'COLLSCAN = always investigate; IXSCAN = good but check ratio',
      'Profiler: setProfilingLevel(1, {slowms}) → query system.profile for slow ops',
      '$indexStats: ops count per index; 0 ops = candidate for removal',
      'maxTimeMS: kill slow queries before they impact the cluster',
      'bulkWrite/insertMany: one round-trip for N ops; never loop individual writes',
    ],
    interviewFocus: [
      'How to diagnose a slow query (explain, profiler, Atlas)',
      'totalDocsExamined vs nReturned and what it means',
      'Optimising aggregation pipelines ($match first, sort+limit top-N)',
      'WiredTiger cache and working set',
      'When to use secondary reads',
    ],
  };
}
