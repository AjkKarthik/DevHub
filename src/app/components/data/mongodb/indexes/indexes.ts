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
  selector: 'app-mongo-indexes',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './indexes.html',
  styleUrl: './indexes.scss',
})
export class MongoIndexes {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: 'Single Field',      desc: 'createIndex({ field: 1 }) — ascending; -1 descending. Either direction covers sort in both ways.' },
    { type: 'keyword', name: 'Compound Index',    desc: 'createIndex({ a: 1, b: -1 }) — covers queries on a, or (a, b). Order and direction matter.' },
    { type: 'keyword', name: 'Multikey Index',    desc: 'Auto-created when indexing an array field. One entry per array element.' },
    { type: 'keyword', name: 'Text Index',        desc: 'createIndex({ field: "text" }) — enables $text full-text search.' },
    { type: 'keyword', name: 'Geospatial Index',  desc: 'createIndex({ location: "2dsphere" }) — enables $near, $geoWithin queries.' },
    { type: 'keyword', name: 'Hashed Index',      desc: 'createIndex({ field: "hashed" }) — for shard key hashing; no range queries.' },
    { type: 'keyword', name: 'Unique Index',       desc: '{ unique: true } — enforces uniqueness. Allows one null unless sparse: true.' },
    { type: 'keyword', name: 'Sparse Index',      desc: '{ sparse: true } — only indexes documents where the field exists. Smaller index.' },
    { type: 'keyword', name: 'Partial Index',     desc: '{ partialFilterExpression: filter } — indexes only documents matching the filter.' },
    { type: 'keyword', name: 'TTL Index',         desc: '{ expireAfterSeconds: N } — auto-deletes expired documents.' },
    { type: 'keyword', name: 'Wildcard Index',    desc: 'createIndex({ "$**": 1 }) — indexes all fields. Useful for dynamic schemas.' },
    { type: 'keyword', name: 'ESR Rule',          desc: 'Compound index field order: Equality → Sort → Range.' },
    { type: 'keyword', name: 'Index Intersection', desc: 'MongoDB can sometimes combine two single-field indexes, but compound is more efficient.' },
    { type: 'keyword', name: 'Covered Query',     desc: 'Query satisfied entirely from the index — no document fetches. Fastest possible query.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Index Fundamentals',
      points: [
        'MongoDB indexes are <strong>B-tree data structures</strong> that maintain a sorted copy of one or more document fields. An indexed query jumps to the matching range in the B-tree — O(log n) — instead of scanning all n documents (O(n) COLLSCAN).',
        'Every collection has one index on <code>_id</code> by default — it\'s immutable and cannot be dropped. All other indexes are optional and must be created explicitly.',
        'Indexes speed up reads at the cost of write overhead: every insert, update, or delete must update all relevant indexes. A collection with 10 indexes has 10 index updates per write. Don\'t create indexes you don\'t need.',
        'Check if a query uses an index with <code>.explain("executionStats")</code>. Look for <code>winningPlan.stage</code>: <code>IXSCAN</code> (good — index scan) vs <code>COLLSCAN</code> (bad — full collection scan). Check <code>totalDocsExamined</code> vs <code>nReturned</code>.',
        'MongoDB\'s Query Planner selects the "winning plan" by running candidate plans in parallel for a short time ("plan trials"). The fastest plan wins and is cached. The cache is invalidated on index changes or after many writes.',
      ],
    },
    {
      heading: 'Compound Indexes & the ESR Rule',
      points: [
        'A compound index covers queries that filter on any <strong>prefix</strong> of the index fields. Index <code>{ a: 1, b: 1, c: 1 }</code> covers: <code>{ a }</code>, <code>{ a, b }</code>, <code>{ a, b, c }</code> — but NOT <code>{ b }</code> or <code>{ b, c }</code> alone (no prefix coverage).',
        'The <strong>ESR Rule</strong> for compound index field ordering: <strong>E</strong>quality fields first, then <strong>S</strong>ort fields, then <strong>R</strong>ange fields. Example for <code>find({ status: "active", createdAt: { $gte: d } }).sort({ score: -1 })</code>: optimal index is <code>{ status: 1, score: -1, createdAt: 1 }</code> (Equality=status, Sort=score, Range=createdAt).',
        'Index direction only matters for compound sort. <code>{ field: 1 }</code> and <code>{ field: -1 }</code> are equally efficient for single-field sorts and equality queries. For compound sorts, the index must match the sort direction or its exact inverse.',
        'A <strong>covered query</strong> is one where all fields in the filter and projection exist in the index — MongoDB satisfies it entirely from the index without reading any documents. This is the fastest possible query. To achieve: include all projected fields in the index.',
        'The <code>hint()</code> method forces MongoDB to use a specific index: <code>.find(filter).hint({ email: 1 })</code>. Use only for testing or when the query planner consistently chooses the wrong index. Don\'t hint in production code without profiling.',
      ],
    },
    {
      heading: 'Partial and Sparse Indexes',
      points: [
        'A <strong>partial index</strong> only indexes documents that match a filter expression: <code>createIndex({ email: 1 }, { partialFilterExpression: { email: { $exists: true } } })</code>. Smaller index, faster writes, but only useful to queries that would match the filter.',
        'Use case for partial indexes: index only active users <code>{ partialFilterExpression: { status: "active" } }</code>. 90% of your users may be inactive — indexing only active users makes the index smaller and your active-user queries faster.',
        'A <strong>sparse index</strong> only contains entries for documents that have the indexed field (equivalent to a partial index with <code>{ field: { $exists: true } }</code>). Useful for optional fields where most documents don\'t have the field.',
        '<strong>Unique + sparse</strong>: a sparse unique index allows multiple documents to be missing the field (they\'re not indexed), but enforces uniqueness among documents that do have it. Useful for optional unique identifiers (e.g., not all users have a phone number, but those who do must be unique).',
        'Partial indexes can use any query expression: <code>{ price: { $gt: 100 } }</code>, <code>{ status: "active" }</code>, <code>{ type: { $in: ["premium", "enterprise"] } }</code>. The filter expression limits which documents are indexed.',
      ],
    },
    {
      heading: 'Index Management',
      points: [
        '<code>collection.getIndexes()</code> lists all indexes with their definitions and sizes. <code>collection.stats()</code> shows index sizes in bytes.',
        'The <strong>MongoDB Profiler</strong> (<code>db.setProfilingLevel(1, { slowms: 100 })</code>) logs slow operations. Query the profiler: <code>db.system.profile.find().sort({ ts: -1 }).limit(10)</code>. This reveals which queries are slow and which indexes they use.',
        '<code>db.collection.dropIndex("index_name")</code> removes an index. The index name is the key specification joined by underscores: <code>email_1</code>, <code>status_1_createdAt_-1</code>. Get names with <code>getIndexes()</code>.',
        '<strong>Background index builds</strong> (MongoDB 4.2+): index builds no longer block reads/writes. The build runs in the background using a two-phase protocol. In MongoDB 4.4+, builds hold a lock only at the beginning and end — your application stays available during the build.',
        '<strong>Index size monitoring</strong>: large indexes that don\'t fit in RAM cause disk I/O on every index lookup — killing performance. Monitor with <code>db.collection.stats().indexSizes</code>. The WiredTiger cache should hold your hot index + working set data.',
      ],
    },
    {
      heading: 'Index Selectivity and the ESR Rule',
      points: [
        'Index selectivity measures how effectively an index narrows down the result set — a field like a boolean (isActive) has low selectivity (only two possible values), while a field like userId has high selectivity (each value typically matches very few documents), making high-selectivity fields more valuable as leading index keys.',
        'The ESR rule (Equality, Sort, Range) provides a practical guideline for ordering compound index fields: place equality-filtered fields first, then fields used for sorting, then range-filtered fields last — this ordering lets MongoDB use the index most efficiently for the common combination of filter + sort + range queries.',
        'An index that is never used by any query still incurs write overhead on every insert/update — regularly reviewing index usage statistics (via $indexStats) and removing genuinely unused indexes is a meaningful, low-risk performance optimization that is often overlooked.',
        'Index intersection (MongoDB combining two separate single-field indexes to satisfy a query) exists but is generally less efficient than a well-designed compound index covering the same query pattern directly — do not rely on index intersection as a substitute for proper compound index design.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Creating Indexes',
      language: 'typescript',
      code: `const users = db.collection('users');

// Single field index
await users.createIndex({ email: 1 }, { unique: true });
await users.createIndex({ createdAt: -1 });

// Compound index (ESR order: equality → sort → range)
// Query: find({ status: 'active', country: 'UK' }).sort({ score: -1 })
await users.createIndex({ status: 1, country: 1, score: -1 });

// Sparse index — only indexes docs that have the field
await users.createIndex({ phone: 1 }, { unique: true, sparse: true });

// Partial index — only indexes active users
await users.createIndex(
  { lastLogin: -1 },
  { partialFilterExpression: { status: 'active' } }
);

// Text index for full-text search
await db.collection('articles').createIndex(
  { title: 'text', content: 'text', tags: 'text' },
  { weights: { title: 10, tags: 5, content: 1 } } // title matches rank higher
);

// Geospatial index
await db.collection('places').createIndex({ location: '2dsphere' });

// TTL index
await db.collection('sessions').createIndex(
  { expireAt: 1 },
  { expireAfterSeconds: 0 }
);

// Wildcard index (dynamic schemas)
await db.collection('products').createIndex({ 'specs.$**': 1 });

// List all indexes
const indexes = await users.getIndexes();
console.log(indexes.map(i => i.name));`,
    },
    {
      label: 'Explain & Profiler',
      language: 'typescript',
      code: `// EXPLAIN — analyse query plan
const explanation = await db.collection('users')
  .find({ status: 'active', createdAt: { $gte: new Date('2024-01-01') } })
  .sort({ score: -1 })
  .explain('executionStats');

const winningPlan = explanation.queryPlanner.winningPlan;
console.log('Stage:', winningPlan.stage);       // IXSCAN or COLLSCAN
console.log('Index:', winningPlan.inputStage?.indexName);

const stats = explanation.executionStats;
console.log('Docs examined:', stats.totalDocsExamined);  // should ≈ nReturned
console.log('Docs returned:', stats.nReturned);
console.log('Exec time ms:', stats.executionTimeMillis);

// Covered query — all fields in index, none fetched from collection
// Index: { email: 1, name: 1, _id: 0 }
await users.createIndex({ email: 1, name: 1 });
const covered = await users
  .find({ email: 'alice@example.com' }, { projection: { email: 1, name: 1, _id: 0 } })
  .explain('executionStats');
// totalDocsExamined should be 0 for a true covered query

// MongoDB Profiler
// Enable for queries > 100ms:
await db.command({ profile: 1, slowms: 100 });
// Read slow query log:
// db.system.profile.find().sort({ ts: -1 }).limit(10)`,
    },
    {
      label: 'Compound & ESR',
      language: 'typescript',
      code: `// ESR Rule demonstration
// Query: find active users in UK, sorted by score descending
// Equality: status = 'active', country = 'UK'
// Sort: score DESC
// Range: (none in this query)
await users.createIndex({ status: 1, country: 1, score: -1 }); // ESR order

// With range: find active users with score > 80, sorted by createdAt
// Equality: status = 'active'
// Sort: createdAt DESC
// Range: score > 80
await users.createIndex({ status: 1, createdAt: -1, score: 1 }); // ESR

// Prefix coverage: { a: 1, b: 1, c: 1 } covers:
const prefixQueries = [
  users.find({ status: 'active' }),                     // uses index prefix
  users.find({ status: 'active', country: 'UK' }),      // uses prefix
  users.find({ status: 'active', country: 'UK', score: { $gt: 80 } }), // full
  // NOT COVERED: users.find({ country: 'UK' }) — no prefix match
];

// Force a specific index with hint()
const withHint = await users
  .find({ email: 'alice@example.com' })
  .hint({ email: 1 })  // force index use
  .explain('executionStats');

// Drop unused index
await users.dropIndex('old_index_name_1');
// Or drop by spec:
await users.dropIndex({ oldField: 1 });`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Creating too many indexes',
      wrong: `// One index per field "just in case"
await col.createIndex({ name: 1 });
await col.createIndex({ email: 1 });
await col.createIndex({ status: 1 });
await col.createIndex({ createdAt: -1 });
await col.createIndex({ updatedAt: -1 });
await col.createIndex({ role: 1 });
// 6 indexes + _id = 7 index updates per write!`,
      right: `// Only index fields you actually query on
// Combine into compound indexes based on query patterns
await col.createIndex({ email: 1 }, { unique: true });         // for login
await col.createIndex({ status: 1, createdAt: -1 });           // for user lists
// That's it — 2 indexes covers 90% of queries`,
      explanation: 'Each index adds overhead to every write operation. A collection with 10 indexes needs 10 index updates per insert. MongoDB caps at 64 indexes per collection. Profile your actual queries first, then create only the indexes they need.',
    },
    {
      title: 'Compound index field order ignoring ESR Rule',
      wrong: `// Query: find({ status: "active", score: { $gt: 80 } }).sort({ createdAt: -1 })
// Wrong order: Range before Sort
await col.createIndex({ status: 1, score: 1, createdAt: -1 });
// MongoDB may not be able to use the index for both the range filter AND sort`,
      right: `// ESR: Equality first, Sort second, Range last
await col.createIndex({ status: 1, createdAt: -1, score: 1 });
// status = Equality, createdAt = Sort, score = Range (last)`,
      explanation: 'The ESR Rule (Equality → Sort → Range) determines the optimal compound index field order. Putting range fields before sort fields prevents MongoDB from using the index for sorting, forcing an in-memory sort pass.',
    },
    {
      title: 'Using a field as a query filter without checking if it is indexed',
      wrong: `// No index on userId — every query scans the entire orders collection!
const userOrders = await db.collection('orders').find({ userId: userId }).toArray();
// On 1M orders: scans 1M documents per user lookup`,
      right: `// Index the reference field
await db.collection('orders').createIndex({ userId: 1, createdAt: -1 });
// Now find({ userId }) is O(log n) — milliseconds instead of seconds`,
      explanation: 'Always index fields used in query filters, especially foreign key reference fields. A COLLSCAN on a million-document collection takes seconds; an IXSCAN takes milliseconds. Use .explain("executionStats") to verify index usage.',
    },
    {
      title: 'Not using covered queries when they are possible',
      wrong: `// Index: { email: 1 }
// Projection: { email: 1, name: 1 }
// MongoDB does IXSCAN + fetch documents for 'name' field
const result = await users.find({ email: 'a@b.com' }, { projection: { email: 1, name: 1 } }).toArray();`,
      right: `// Extend the index to include 'name' → covered query (no doc fetch)
await users.createIndex({ email: 1, name: 1 });
const result = await users.find(
  { email: 'a@b.com' },
  { projection: { email: 1, name: 1, _id: 0 } } // _id: 0 required for covered
).toArray();
// totalDocsExamined: 0 in explain output`,
      explanation: 'A covered query is served entirely from the index — MongoDB never fetches the actual document. Covered queries are dramatically faster for high-throughput lookups. Include all projected fields in the index. Exclude _id from projection (or include it in the index) to achieve full coverage.',
    },
  ];

  challenge: Challenge = {
    title: 'Index a Blog Platform',
    language: 'typescript',
    description: 'Create optimal indexes for a blog platform with these queries: (1) Find published posts by category, sorted by publishedAt DESC, with limit. (2) Find all posts by a specific authorId. (3) Full-text search on title and content. (4) Find posts where tags contains "mongodb". (5) Verify all indexes work by running explain on each query.',
    hints: [
      'Query 1 uses status="published" (equality), category (equality), publishedAt (sort) → ESR compound index.',
      'Query 2 needs index on authorId.',
      'Query 3 needs a text index on title and content with weights.',
      'Query 4: tags is an array, needs a multikey index on tags.',
    ],
    starterCode: `const posts = db.collection('posts');
// posts: { title, content, authorId, category, status, tags[], publishedAt, createdAt }

// TODO: create all necessary indexes
// TODO: write each query and verify with .explain()`,
    solution: `const posts = db.collection('posts');

// 1. Published by category, sorted by date (ESR: status+category=E, publishedAt=S)
await posts.createIndex({ status: 1, category: 1, publishedAt: -1 });

// 2. By author
await posts.createIndex({ authorId: 1, publishedAt: -1 });

// 3. Full-text search with weights
await posts.createIndex(
  { title: 'text', content: 'text' },
  { weights: { title: 5, content: 1 } }
);

// 4. Array field (multikey — auto created when array)
await posts.createIndex({ tags: 1 });

// Verify each query
const q1 = await posts.find({ status: 'published', category: 'tech' })
  .sort({ publishedAt: -1 }).limit(10)
  .explain('executionStats');
console.log('Q1 stage:', q1.queryPlanner.winningPlan.inputStage?.stage); // IXSCAN

const q2 = await posts.find({ authorId: userId }).sort({ publishedAt: -1 })
  .explain('executionStats');
console.log('Q2 stage:', q2.queryPlanner.winningPlan.inputStage?.stage);

const q3 = await posts.find({ $text: { $search: 'mongodb aggregation' } })
  .explain('executionStats');
console.log('Q3 stage:', q3.queryPlanner.winningPlan.stage); // TEXT

const q4 = await posts.find({ tags: 'mongodb' }).explain('executionStats');
console.log('Q4 stage:', q4.queryPlanner.winningPlan.inputStage?.stage); // IXSCAN`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the ESR Rule for compound index field ordering?',
      options: [
        'Equality → Scan → Range',
        'Equality → Sort → Range',
        'Exclusion → Sort → Range',
        'Expression → Sort → Range',
      ],
      answer: 1,
      explanation: 'ESR: Equality fields first (exact match filters), then Sort fields (to avoid in-memory sort), then Range fields (inequality filters like $gt/$lt). Putting range fields before sort fields forces an in-memory sort that ignores the index order.',
    },
    {
      q: 'Compound index { a: 1, b: 1, c: 1 } — which query does NOT benefit from this index?',
      options: [
        'find({ a: 1 })',
        'find({ a: 1, b: 1 })',
        'find({ b: 1, c: 1 })',
        'find({ a: 1, b: 1, c: 1 })',
      ],
      answer: 2,
      explanation: 'Compound indexes support queries that match any left-most prefix: {a}, {a,b}, {a,b,c}. A query starting with b or c (skipping a) cannot use this index because it doesn\'t match any prefix. You\'d need a separate index starting with b.',
    },
    {
      q: 'If a covered query\'s projection accidentally includes a field NOT present in the index, what happens?',
      options: [
        'MongoDB throws an error rejecting the query',
        'MongoDB silently falls back to fetching the full document, losing the covered-query performance benefit entirely — the query still returns correct results, just slower',
        'The query returns null for the missing field but stays covered',
        'MongoDB automatically adds the missing field to the index on the fly',
      ],
      answer: 1,
      explanation: 'Coverage is all-or-nothing: if even one requested field (in the filter OR the projection) is not present in the index being used, MongoDB must fetch the full document from the collection to retrieve that field — this silently downgrades the query from an index-only scan to a full FETCH stage, with no error or warning. This is why explain() should always be checked after writing what you believe is a covered query: a seemingly small projection change (adding one extra field) can quietly undo the performance benefit without any visible symptom besides a slower query.',
    },
    {
      q: 'What does a COLLSCAN in explain output indicate?',
      options: [
        'The query used an index successfully',
        'A full collection scan — no index was used',
        'The collection is capped',
        'The query returned all documents',
      ],
      answer: 1,
      explanation: 'COLLSCAN (Collection Scan) means MongoDB read every document in the collection to find matches — O(n). IXSCAN (Index Scan) means it used a B-tree index — O(log n). COLLSCAN on large collections is the most common performance problem in MongoDB.',
    },
    {
      q: 'What does a partial index with { partialFilterExpression: { status: "active" } } do?',
      options: [
        'Only allows documents with status "active" to be inserted',
        'Only indexes documents where status equals "active"',
        'Returns documents where status is "active" from any query',
        'Deletes inactive documents automatically',
      ],
      answer: 1,
      explanation: 'A partial index only indexes documents that match the filter expression. Documents where status !== "active" are not in the index. This makes the index smaller and more cache-friendly, benefiting queries that already filter on status = "active".',
    },
    { q: 'What is a covered query in MongoDB and why is it desirable?', options: ['A covered query is one that retrieves all documents in a collection and is supported by an index on all fields', 'A covered query is satisfied entirely by reading the index — MongoDB does not need to fetch the actual documents because the index contains all fields needed for the query filter and projection', 'A covered query is one where all query conditions are equality matches (no range operators) making it the fastest query type', 'A covered query is automatically cached by MongoDB for 5 minutes after the first execution'], answer: 1, explanation: 'Covered query requirements: every field in the query filter must be in the index. Every field in the projection must be in the index. The _id field must be explicitly excluded from the projection (unless _id is in the index). Example: index on { category: 1, price: 1 }. Query: { category: "Electronics" }. Projection: { _id: 0, category: 1, price: 1 }. This is covered — MongoDB reads only the index, never the documents. Why desirable: index data is much smaller than document data and fits in the WiredTiger index cache. No document I/O means dramatically lower read amplification. Verify with explain: "indexOnly": true in the explain output (pre-4.0) or stage: PROJECTION_COVERED in queryPlanner. Common pitfall: adding _id: 1 to the projection (without the _id in the index) breaks coverage because MongoDB must fetch the document to get _id.' },
    { q: 'What is index intersection and when does MongoDB use it?', options: ['Index intersection combines two indexes on the same collection into a single more efficient compound index at query time', 'Index intersection allows MongoDB to use multiple single-field indexes simultaneously for a single query, combining their results via AND intersection, potentially avoiding the need for a compound index', 'Index intersection is an Atlas Search feature that combines text indexes with regular B-tree indexes', 'Index intersection is not supported in MongoDB — only one index can be used per query'], answer: 1, explanation: 'Index intersection: MongoDB can intersect two indexes for a query that would otherwise require a compound index. Example: index on { status: 1 } and separate index on { category: 1 }. Query: { status: "active", category: "Books" }. MongoDB might use both indexes, intersecting the result sets. When MongoDB uses it: when a suitable compound index does not exist. When the query planner determines intersection is cheaper than a collection scan. Reality: MongoDB rarely chooses intersection over compound indexes. Compound indexes are almost always more efficient. The query planner considers intersection as a candidate and picks the lowest-cost plan. Verify with explain — you will see AND_SORTED or AND_HASH stage for intersection. Best practice: create compound indexes for multi-field queries rather than relying on intersection. Intersection has additional overhead for merging result sets.' },
    { q: 'What is a sparse index and when should you use it?', options: ['A sparse index only includes the most recently inserted documents to keep the index size manageable', 'A sparse index only includes documents that contain the indexed field (excluding null or missing), making it smaller and more efficient for optional fields that appear in only a fraction of documents', 'A sparse index stores index keys in a compressed format to reduce memory usage compared to a standard index', 'A sparse index is a partial index that only covers documents created after a specific date'], answer: 1, explanation: 'Standard index: includes ALL documents in the collection. If the indexed field is null or missing in a document, the document is indexed with a null key. Sparse index: indexes only documents where the indexed field EXISTS (not null, not missing). Documents without the field are excluded from the index entirely. Use case: optional field present in only 10% of documents. A standard unique index on that field fails because multiple documents have the field missing (all indexed as null — violates uniqueness). A sparse unique index only enforces uniqueness among documents that have the field. Creation: db.collection.createIndex({ email: 1 }, { sparse: true }). Limitation: a sparse index cannot be used to satisfy queries that require all documents (e.g., { email: { $exists: false } }). Prefer partial indexes over sparse indexes in most cases — partial indexes are more expressive and have clearer semantics. Sparse is a special case of partial: { partialFilterExpression: { email: { $exists: true } } } is equivalent to sparse for non-null fields.' },
    { q: 'How do partial indexes work and what advantages do they have over full indexes?', options: ['A partial index indexes only a randomly sampled subset of documents for lower storage overhead', 'A partial index only includes documents satisfying a filter expression, creating a smaller index that is more selective, uses less RAM and disk, and can enforce conditional uniqueness constraints', 'A partial index is automatically maintained only during off-peak hours to reduce write overhead on high-traffic collections', 'Partial indexes are the same as sparse indexes but use a different syntax'], answer: 1, explanation: 'Partial index creation: db.orders.createIndex({ userId: 1 }, { partialFilterExpression: { status: "active" } }). This index only includes orders with status="active". Benefits: smaller index — if 10% of orders are active, the index is 10x smaller. Fits in cache — more likely to stay hot in WiredTiger index cache. Faster writes — index does not need to be updated for inactive orders. Lower storage cost. The query must include the filter expression: the query { userId: userId, status: "active" } uses the partial index. The query { userId: userId } alone does not (the planner cannot guarantee status="active" without checking). Conditional uniqueness: { unique: true, partialFilterExpression: { status: "pending" } } — enforces that pending orders have unique userId, but does not prevent multiple completed orders per user. MongoDB 3.2+. Limitation: partialFilterExpression cannot use expressions that cannot be evaluated per document (, , etc.).' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How many indexes should a collection have?',
      a: 'As few as necessary to cover your actual query patterns. MongoDB caps at 64 indexes per collection, but you should aim for far fewer. Each index adds ~1 write overhead per field per write operation. A good starting point: index fields used in query filters, sort fields on common queries, and all foreign key fields (reference fields). Start with no extra indexes, add them based on slow query profiler output, and remove indexes that haven\'t been used in 30+ days (check with <code>$indexStats</code>).',
    },
    {
      q: 'How do I find unused indexes?',
      a: 'Use <code>db.collection.aggregate([{ $indexStats: {} }])</code>. Each index shows its <code>accesses.ops</code> count since the mongod last started. An index with 0 accesses is unused and should be removed. Note: this count resets on each mongod restart. Run for at least 24 hours (ideally a full week to capture weekly patterns) before concluding an index is unused. Also check $indexStats on secondaries if your app routes reads there.',
    },
    {
      q: 'Why does adding an index sometimes make writes slower?',
      a: 'Every write (insert, update, delete) must update all indexes on the collection. Adding 10 indexes means 10 B-tree updates per write instead of 1 (for the _id index only). On a write-heavy collection (millions of inserts/second), each additional index measurably reduces write throughput. This is the core trade-off: more indexes = faster reads but slower writes. Profile both read and write performance when adding indexes to write-heavy collections.',
    },
    {
      q: 'How can you tell from explain() output whether MongoDB actually chose index intersection for a query, versus just using one index and filtering the rest in memory?',
      a: 'Look for an AND_SORTED or AND_HASH stage in the winningPlan of explain() output — these stage names specifically indicate two index scans being intersected. If instead you see a single IXSCAN stage followed by a FETCH with a filter, MongoDB picked ONE index to narrow the candidate set and then filtered the remaining condition against the fetched documents in memory, which is a different (and usually more common) execution path than true index intersection. Since MongoDB rarely favors intersection over a good compound index or single-index-plus-filter, seeing AND_SORTED/AND_HASH in production explain output is often itself a signal that a compound index covering the query is missing and should be added.',
    },
    {
      q: 'When should I use a wildcard index?',
      a: 'Wildcard indexes (<code>{ "$**": 1 }</code>) index all fields in a document (or a subtree with <code>{ "field.$**": 1 }</code>). Use them when: documents have dynamic schema with unpredictable field names (e.g., user-defined attributes, product specs), and queries filter on those dynamic fields. Wildcard indexes are NOT a substitute for targeted compound indexes on well-known fields — they\'re larger and have more write overhead. Create targeted indexes for known high-frequency queries; use wildcard indexes only for the truly dynamic parts of your schema.',
    },
    { q: 'If you build a compound index with range and sort fields in the WRONG order (range before sort), does the query still return correct results?', a: 'Yes — correctness is never at risk, only PERFORMANCE. MongoDB will still return the right documents, but it may be unable to use the index to satisfy the sort, falling back to an expensive in-memory sort stage (visible in explain() as a SORT stage with no index backing), or it may reject the index entirely for that query in favor of a different plan. This is precisely why ESR ordering issues are easy to miss in testing on small collections — the query "works" — and only surface as a real performance problem once the collection grows large enough for the in-memory sort or full scan to become slow.' },
    { q: 'How do you manage and monitor indexes in a production MongoDB deployment?', a: 'Index management tools: db.collection.getIndexes() — list all indexes on a collection. db.collection.stats() — includes indexSizes showing each index size on disk. db.collection.aggregate([{ $indexStats: {} }]) — shows access statistics for each index (ops count, since timestamp). Identify unused indexes: $indexStats op count of 0 over a representative period means the index is unused. Dropping unused indexes frees disk space and reduces write overhead. Index builds on live collections: MongoDB 4.4+ builds indexes in the background by default (foreground in older versions blocks all reads/writes). Use createIndex() normally — it is non-blocking in 4.4+. Atlas has a rolling index build feature that builds on each secondary first, then the primary. Monitoring slow index builds: db.currentOp({ "command.createIndexes": { $exists: true } }) — shows in-progress index builds. Hiding indexes (MongoDB 6.0): db.collection.hideIndex("indexName") — the index is maintained but not used by the query planner. Test the performance impact of removing an index before actually dropping it. Dropping an index: db.collection.dropIndex("indexName"). Cannot drop the _id index.' },
    { q: 'What is a TTL (Time-To-Live) index and how does it work?', a: 'TTL index: a special single-field index on a Date field that automatically deletes documents a specified number of seconds after the date value. Creation: db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 }). Documents where createdAt is more than 3600 seconds (1 hour) in the past are automatically deleted. How it works: a background thread (TTLMonitor) runs every 60 seconds (configurable), scans for expired documents, and deletes them in batches. Deletion is approximate — up to 60 seconds late in ideal conditions, potentially more under high load. Use cases: session management (expire inactive sessions). Temporary data (one-time tokens, verification codes). Cache documents with TTL. Notifications (auto-delete sent notifications after N days). Limitations: TTL index requires the field to be a Date (not a number). Does not work on capped collections. Only one TTL index per collection. For variable TTL (each document expires at different time), set the expireAt field to the exact expiry Date and use expireAfterSeconds: 0 — MongoDB deletes the document when the current time exceeds the expireAt date.' },
    { q: 'How do multikey indexes work and what are their limitations?', a: 'Multikey indexes: MongoDB automatically creates a multikey index when you index a field that contains an array. The index stores a separate entry for each element of the array, enabling efficient queries on array contents. Example: { tags: ["mongodb", "nosql", "database"] } with an index on tags generates 3 index entries for this one document. Queries: { tags: "mongodb" } uses the multikey index to find all documents containing "mongodb" in tags. Limitations: compound index restriction — at most ONE of the indexed fields can be an array in any given compound index. You cannot create a compound index where two indexed fields are both arrays (MongoDB throws an error at document insertion if multiple compound index fields would be multikey). $text and $2dsphere indexes cannot be multikey. Covered queries: a multikey index cannot be used to satisfy a covered query because the index stores individual array elements, not the full array. Index size: a document with a 1000-element array contributes 1000 entries to the multikey index — significant index bloat for large arrays. Prefer indexing on a scalar field within embedded documents (e.g., items.productId) over indexing a large array of full objects.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'MongoDB indexes are B-tree structures for O(log n) lookups; compound indexes use ESR ordering; covered queries eliminate document fetches.',
    mustKnow: [
      'IXSCAN = index used (good); COLLSCAN = full scan (bad) — check with .explain("executionStats")',
      'Compound index prefix coverage: { a, b, c } covers queries starting with a, (a,b), (a,b,c) — not b alone',
      'ESR Rule: Equality → Sort → Range in compound index field order',
      'Covered query: all filter + projection fields in index; totalDocsExamined = 0',
      'Each index = write overhead; only create indexes for actual query patterns',
      'Partial index: only indexes matching docs; sparse: only docs with the field',
      'Use $indexStats to find unused indexes; remove them',
    ],
    interviewFocus: [
      'ESR Rule for compound index ordering',
      'IXSCAN vs COLLSCAN and how to diagnose with explain()',
      'Covered query — what it is, how to achieve it',
      'Write overhead of indexes — when not to add them',
      'Partial vs sparse indexes — use cases',
    ],
  };
}
