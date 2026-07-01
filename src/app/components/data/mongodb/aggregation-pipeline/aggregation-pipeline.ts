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
  selector: 'app-mongo-aggregation-pipeline',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './aggregation-pipeline.html',
  styleUrl: './aggregation-pipeline.scss',
})
export class MongoAggregationPipeline {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: '$match',       desc: 'Filter documents. Place early to reduce dataset. Equivalent to find() filter.' },
    { type: 'keyword', name: '$group',       desc: 'Group by _id field; apply accumulators ($sum, $avg, $min, $max, $push, $addToSet).' },
    { type: 'keyword', name: '$project',     desc: 'Include/exclude/reshape fields. Supports computed expressions.' },
    { type: 'keyword', name: '$sort',        desc: 'Sort documents: { field: 1 } ascending, -1 descending.' },
    { type: 'keyword', name: '$limit',       desc: 'Limit result count.' },
    { type: 'keyword', name: '$skip',        desc: 'Skip N documents (use after $sort).' },
    { type: 'keyword', name: '$unwind',      desc: 'Deconstruct array — one doc per element.' },
    { type: 'keyword', name: '$lookup',      desc: 'Join with another collection (left outer join).' },
    { type: 'keyword', name: '$addFields',   desc: 'Add or overwrite fields without excluding others. Simpler than $project for additions.' },
    { type: 'keyword', name: '$replaceRoot', desc: 'Replace document with a subdocument: { $replaceRoot: { newRoot: "$embedded" } }.' },
    { type: 'keyword', name: '$facet',       desc: 'Multiple sub-pipelines in parallel — for faceted search results.' },
    { type: 'keyword', name: '$bucket',      desc: 'Group into ranges (price ranges, age bands).' },
    { type: 'keyword', name: '$out',         desc: 'Write pipeline result to a new collection (replaces it entirely).' },
    { type: 'keyword', name: '$merge',       desc: 'Write pipeline result into an existing collection (merge/upsert).' },
    { type: 'keyword', name: '$count',       desc: 'Count pipeline documents: { $count: "total" }.' },
    { type: 'keyword', name: '$sample',      desc: 'Return N random documents: { $sample: { size: 5 } }.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Pipeline Concept',
      points: [
        'An aggregation pipeline is an <strong>ordered sequence of stages</strong>. Documents pass through each stage; the output of one stage becomes the input of the next. Each stage transforms the document stream.',
        'The core insight: unlike SQL\'s fixed SELECT/FROM/WHERE/GROUP BY structure, MongoDB\'s pipeline stages can be composed freely — you can $match before $group, $group multiple times, $unwind and re-$group, or run parallel sub-pipelines with $facet.',
        'MongoDB pushes <code>$match</code> stages as early as possible (query predicate pushdown) and optimises consecutive <code>$sort</code> + <code>$limit</code> into a "top-N sort" that doesn\'t materialise all results.',
        'The pipeline runs on the <strong>server</strong> — data processing happens in MongoDB, not in your application. This is far more efficient than fetching all documents and processing in JavaScript.',
        'Aggregation results can be streamed via a cursor (like find()), written to a new collection (<code>$out</code>), or merged into an existing one (<code>$merge</code>). Large pipelines can spill to disk with <code>allowDiskUse: true</code>.',
      ],
    },
    {
      heading: '$match and $group',
      points: [
        '<code>$match</code> uses the same query syntax as <code>find()</code>. Place it first (or as early as possible) to reduce the number of documents processed by downstream stages. A $match immediately after $group cannot use the original collection\'s indexes — only $match before the first stage can use indexes.',
        '<code>$group</code> groups documents by an <code>_id</code> expression. Set <code>_id: null</code> to aggregate across all documents (like a SQL aggregate without GROUP BY). Set <code>_id: "$fieldName"</code> to group by a field value.',
        'Accumulator operators in $group: <code>$sum</code> (total or count), <code>$avg</code> (average), <code>$min</code>/<code>$max</code> (minimum/maximum), <code>$push</code> (collect into array), <code>$addToSet</code> (collect unique values), <code>$first</code>/<code>$last</code> (first/last value in group).',
        'Counting documents: <code>{ $sum: 1 }</code> counts one per document. <code>{ $sum: "$quantity" }</code> sums the quantity field. <code>{ $avg: "$price" }</code> computes the average price.',
        'You can group by expressions, not just field values: <code>{ $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } } } }</code> groups by year and month.',
      ],
    },
    {
      heading: '$project and $addFields',
      points: [
        '<code>$project</code> reshapes documents: include/exclude fields AND add computed fields. Computed fields use aggregation expressions: <code>{ fullName: { $concat: ["$firstName", " ", "$lastName"] } }</code>.',
        '<code>$addFields</code> (alias: <code>$set</code>) adds or overwrites fields without needing to explicitly include all existing fields. Simpler when you want to add computed fields without listing everything to keep.',
        'Aggregation expressions for field computation: arithmetic (<code>$add, $subtract, $multiply, $divide</code>), string (<code>$concat, $toLower, $toUpper, $substr</code>), date (<code>$year, $month, $dayOfMonth, $dateToString</code>), conditional (<code>$cond, $ifNull, $switch</code>).',
        '<code>$cond</code> is an if/then/else: <code>{ $cond: { if: { $gte: ["$score", 90] }, then: "A", else: "B" } }</code>. <code>$ifNull</code> provides a default for null/missing fields.',
        '<code>$replaceRoot</code> promotes a nested document to the top level. After a $lookup that embeds matched documents in an array, $unwind + $replaceRoot can "flatten" the result.',
      ],
    },
    {
      heading: '$unwind',
      points: [
        '<code>$unwind</code> deconstructs an array field, outputting one document per array element. A document with tags: ["a","b","c"] becomes three documents, each with a single tags value.',
        'After $unwind, you can $group back by the original document\'s _id to perform per-element operations and then reassemble. Common pattern: unwind → match/compute per element → group back.',
        '<code>{ $unwind: { path: "$arr", preserveNullAndEmpty: true } }</code> — without this option, documents where the array is null, missing, or empty are dropped from the pipeline. Set <code>preserveNullAndEmpty: true</code> to keep them.',
        '<code>includeArrayIndex</code> option adds a field with the element\'s original array index: <code>{ $unwind: { path: "$items", includeArrayIndex: "itemIdx" } }</code>.',
        'Performance: $unwind before $match is usually wrong — let $match filter documents first, then unwind. $unwind on a large array multiplies document count significantly.',
      ],
    },
    {
      heading: 'Pipeline Performance and Stage Ordering',
      points: [
        'Stage order matters significantly for performance — placing <code>$match</code> and <code>$limit</code> as early as possible in the pipeline reduces the number of documents flowing through every subsequent stage, since MongoDB does not always reorder stages automatically for you.',
        'A <code>$match</code> stage placed immediately after the pipeline start can use an existing index the same way a regular query would — a <code>$match</code> placed after several transformation stages (like <code>$project</code> or <code>$unwind</code>) usually cannot use an index, since the documents no longer match their original indexed shape.',
        'Use <code>.explain("executionStats")</code> on an aggregation to see whether early stages are using an index (IXSCAN) or falling back to a full collection scan (COLLSCAN) — this is the definitive way to verify pipeline performance rather than guessing from the pipeline structure alone.',
        '<code>$facet</code> lets you run multiple independent sub-pipelines against the same input documents in a single aggregation call (useful for computing several different aggregates like a count and a paginated result set together), but each sub-pipeline receives the full input, so it does not reduce overall document processing.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Match & Group',
      language: 'typescript',
      code: `const orders = db.collection('orders');

// Count orders per status
const statusCounts = await orders.aggregate([
  { $group: { _id: '$status', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]).toArray();
// [{ _id: 'completed', count: 1200 }, { _id: 'pending', count: 340 }]

// Revenue by category — match, group, project
const revenue = await orders.aggregate([
  { $match: { status: 'completed', createdAt: { $gte: new Date('2024-01-01') } } },
  { $group: {
    _id: '$category',
    totalRevenue: { $sum: '$amount' },
    avgOrder:     { $avg: '$amount' },
    orderCount:   { $sum: 1 },
    maxOrder:     { $max: '$amount' },
  }},
  { $sort: { totalRevenue: -1 } },
  { $limit: 10 },
]).toArray();

// Group by multiple fields (compound _id)
const byMonthStatus = await orders.aggregate([
  { $group: {
    _id: {
      year:  { $year: '$createdAt' },
      month: { $month: '$createdAt' },
      status: '$status',
    },
    count: { $sum: 1 },
  }},
  { $sort: { '_id.year': -1, '_id.month': -1 } },
]).toArray();

// Count all (no group key)
const total = await orders.aggregate([
  { $match: { status: 'completed' } },
  { $count: 'total' },
]).toArray();`,
    },
    {
      label: '$project & $addFields',
      language: 'typescript',
      code: `const users = db.collection('users');

// $project with computed fields
const displayUsers = await users.aggregate([
  { $project: {
    _id: 1,
    fullName: { $concat: ['$firstName', ' ', '$lastName'] },
    email:    { $toLower: '$email' },
    age: {
      $dateDiff: { startDate: '$birthDate', endDate: '$$NOW', unit: 'year' }
    },
    isAdult: { $cond: { if: { $gte: ['$age', 18] }, then: true, else: false } },
    // Exclude: leave out fields (0) or just don't include them
    password: 0,
  }},
]).toArray();

// $addFields — add without needing to list all fields
const enriched = await users.aggregate([
  { $addFields: {
    fullName: { $concat: ['$firstName', ' ', '$lastName'] },
    scoreGrade: { $switch: {
      branches: [
        { case: { $gte: ['$score', 90] }, then: 'A' },
        { case: { $gte: ['$score', 80] }, then: 'B' },
        { case: { $gte: ['$score', 70] }, then: 'C' },
      ],
      default: 'F',
    }},
  }},
  { $project: { password: 0 } }, // exclude only sensitive fields
]).toArray();

// $ifNull — default for missing fields
const withDefaults = await users.aggregate([
  { $addFields: {
    role:    { $ifNull: ['$role', 'user'] },
    credits: { $ifNull: ['$credits', 0] },
  }},
]).toArray();`,
    },
    {
      label: '$unwind',
      language: 'typescript',
      code: `const orders = db.collection('orders');

// Unwind items array to analyse per-item
const itemRevenue = await orders.aggregate([
  { $match: { status: 'completed' } },
  { $unwind: '$items' },          // one doc per item
  { $group: {
    _id: '$items.productId',
    totalSold:    { $sum: '$items.qty' },
    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
  }},
  { $sort: { totalRevenue: -1 } },
  { $limit: 10 },
]).toArray();

// preserveNullAndEmpty — keep docs with empty/missing arrays
const allPosts = await db.collection('posts').aggregate([
  { $unwind: { path: '$tags', preserveNullAndEmpty: true } },
  { $group: { _id: '$_id', title: { $first: '$title' }, tagCount: { $sum: 1 } } },
]).toArray();

// includeArrayIndex
const withIndex = await orders.aggregate([
  { $unwind: { path: '$items', includeArrayIndex: 'itemPosition' } },
  { $match: { itemPosition: 0 } },  // only first item of each order
]).toArray();`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Placing $match after $group instead of before',
      wrong: `// Processes ALL documents, then filters — wastes CPU/memory
col.aggregate([
  { $group: { _id: '$status', count: { $sum: 1 } } },
  { $match: { status: 'active' } }, // too late — group already ran on everything
])`,
      right: `// Filter FIRST — reduce documents before expensive $group
col.aggregate([
  { $match: { status: 'active', createdAt: { $gte: lastMonth } } },
  { $group: { _id: '$category', count: { $sum: 1 } } },
])`,
      explanation: 'A $match before the first $group uses a collection index. $match after $group is a pipeline filter — it can\'t use the original collection\'s indexes and runs on the already-grouped result set. Always $match as early as possible.',
    },
    {
      title: '$unwind dropping documents with missing or empty arrays',
      wrong: `// Docs where tags is null, missing, or [] are silently dropped!
col.aggregate([{ $unwind: '$tags' }])`,
      right: `// Keep docs with empty/null arrays using preserveNullAndEmpty
col.aggregate([{ $unwind: { path: '$tags', preserveNullAndEmpty: true } }])`,
      explanation: 'By default, $unwind removes documents where the array field is null, missing, or empty. Use preserveNullAndEmpty: true to keep them — they appear with the array field set to null.',
    },
    {
      title: 'Using $project when $addFields is simpler',
      wrong: `// Must list every field you want to keep
col.aggregate([{ $project: {
  _id: 1, name: 1, email: 1, role: 1, createdAt: 1, // ... every other field
  fullName: { $concat: ['$first', ' ', '$last'] }
}}])`,
      right: `// $addFields keeps all existing fields; only adds/overwrites specified ones
col.aggregate([
  { $addFields: { fullName: { $concat: ['$first', ' ', '$last'] } } },
  { $project: { password: 0 } },  // then exclude sensitive
])`,
      explanation: '$project requires you to explicitly list every field you want to keep when adding computed fields. $addFields (or its alias $set) adds fields while keeping everything else unchanged, then a $project can selectively exclude sensitive fields.',
    },
    {
      title: 'Grouping without $sort before $limit (wrong top-N)',
      wrong: `// Without sort, $limit returns arbitrary N documents
col.aggregate([
  { $group: { _id: '$category', total: { $sum: '$amount' } } },
  { $limit: 5 }, // not top-5 — just first-5 encountered
])`,
      right: `col.aggregate([
  { $group: { _id: '$category', total: { $sum: '$amount' } } },
  { $sort: { total: -1 } }, // highest total first
  { $limit: 5 },            // now: top-5 by total
])`,
      explanation: '$group produces documents in no guaranteed order. Without $sort before $limit, you get an arbitrary subset. Always $sort first when you need top-N results from a $group.',
    },
  ];

  challenge: Challenge = {
    title: 'Monthly Sales Dashboard',
    language: 'typescript',
    description: 'Write an aggregation pipeline to produce a monthly sales report. Each result should have: year, month, totalRevenue (sum of order.amount), orderCount, avgOrderValue, topCategory (the category with highest revenue that month). Orders collection has: { amount, category, status, createdAt }.',
    hints: [
      'First $match to include only completed orders.',
      'Use $group with $year/$month from $createdAt for monthly grouping.',
      'Getting topCategory requires a two-pass group or $push + sort within group.',
      'Consider using $facet or a sub-pipeline approach for topCategory.',
    ],
    starterCode: `const orders = db.collection('orders');

const report = await orders.aggregate([
  // TODO: filter completed orders
  // TODO: group by year + month
  // TODO: compute totalRevenue, orderCount, avgOrderValue
  // TODO: sort by year desc, month desc
]).toArray();

console.log(report[0]);
// { year: 2024, month: 12, totalRevenue: 45000, orderCount: 120, avgOrderValue: 375 }`,
    solution: `const orders = db.collection('orders');

const report = await orders.aggregate([
  { $match: { status: 'completed' } },
  { $group: {
    _id: {
      year:     { $year: '$createdAt' },
      month:    { $month: '$createdAt' },
      category: '$category',
    },
    categoryRevenue: { $sum: '$amount' },
    count:           { $sum: 1 },
  }},
  { $sort: { categoryRevenue: -1 } },
  { $group: {
    _id: { year: '$_id.year', month: '$_id.month' },
    totalRevenue:  { $sum: '$categoryRevenue' },
    orderCount:    { $sum: '$count' },
    topCategory:   { $first: '$_id.category' }, // highest revenue first after sort
    categories:    { $push: { category: '$_id.category', revenue: '$categoryRevenue' } },
  }},
  { $addFields: {
    year:          '$_id.year',
    month:         '$_id.month',
    avgOrderValue: { $divide: ['$totalRevenue', '$orderCount'] },
  }},
  { $project: { _id: 0 } },
  { $sort: { year: -1, month: -1 } },
]).toArray();`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which aggregation stage should be placed first in a pipeline for best performance?',
      options: ['$group', '$project', '$match', '$sort'],
      answer: 2,
      explanation: '$match filters documents using indexes (just like find()). Placing it first reduces the number of documents processed by subsequent stages. A $match immediately before $group can use the collection\'s indexes; $match after $group cannot.',
    },
    {
      q: 'What does { $group: { _id: null, total: { $sum: "$amount" } } } do?',
      options: [
        'Groups documents where amount is null',
        'Groups ALL documents into one result with the sum of all amounts',
        'Throws an error — _id cannot be null',
        'Returns null for total if any amount is null',
      ],
      answer: 1,
      explanation: '_id: null in $group means "no grouping key" — all documents are aggregated into a single output document. This is equivalent to a SQL aggregate function without GROUP BY: SELECT SUM(amount) FROM orders.',
    },
    {
      q: 'What does $unwind do to a document with { tags: ["a", "b", "c"] }?',
      options: [
        'Returns one document with tags as a comma-separated string',
        'Returns three documents, each with tags as a single value ("a", "b", "c")',
        'Removes the tags field from the document',
        'Groups documents by each tag value',
      ],
      answer: 1,
      explanation: '$unwind deconstructs an array, outputting one document per array element. { tags: ["a","b","c"] } becomes three separate documents: one with tags: "a", one with tags: "b", one with tags: "c".',
    },
    {
      q: 'Which stage adds new computed fields without removing existing fields?',
      options: ['$project', '$addFields', '$group', '$replaceRoot'],
      answer: 1,
      explanation: '$addFields (alias $set) adds or overwrites fields while keeping all existing fields intact. $project requires you to explicitly list every field you want to keep; if you only add a computed field without listing others, they are dropped.',
    },
    {
      q: 'What is the purpose of $facet in aggregation?',
      options: [
        'Joins two collections',
        'Runs multiple sub-pipelines in parallel on the same documents',
        'Splits one document into multiple',
        'Creates faceted indexes for faster queries',
      ],
      answer: 1,
      explanation: '$facet runs multiple aggregation sub-pipelines simultaneously on the same input documents and returns a single document with the results of each sub-pipeline in separate fields. Ideal for faceted search results (total count + category counts + price ranges) in one query.',
    },
    {
      q: 'How do you write aggregation results to a new collection?',
      options: ['$save', '$export', '$out', '$write'],
      answer: 2,
      explanation: '$out writes pipeline results to a named collection, replacing it entirely. $merge (MongoDB 4.2+) is more flexible — it can merge into an existing collection with insert, replace, update, or fail-on-conflict strategies.',
    },
    { q: 'What is the $facet stage and when should you use it?', options: ['$facet splits a single collection into multiple sub-collections based on a field value', '$facet runs multiple independent aggregation sub-pipelines on the same input documents within a single pipeline stage, returning results of all sub-pipelines in a single document', '$facet is used for faceted search similar to Elasticsearch $terms aggregation but for full-text search only', '$facet is a MongoDB Atlas-only feature not available in self-hosted deployments'], answer: 1, explanation: '$facet syntax: { $facet: { pipelineA: [stage1, stage2], pipelineB: [stage1, stage2] } }. Each sub-pipeline receives the same input documents and runs independently. Output: a single document where each key is a sub-pipeline name and the value is its result array. Use case: e-commerce search results page — run one sub-pipeline for the paginated product list ($skip + $limit) and another for facet counts (category counts, price range counts) in a single database round-trip. Performance: each sub-pipeline processes the full input set independently. Use $match before $facet to reduce the input documents before fanning out. Note: $facet cannot contain $out, $merge, $geoNear, or $facet stages within its sub-pipelines.' },
    { q: 'What is $unwind and what is the includeArrayIndex option for?', options: ['$unwind converts an array field into multiple documents, one per element; includeArrayIndex adds the original array index as a new field in each output document', '$unwind removes an array field from a document and replaces it with a scalar value; includeArrayIndex specifies which element to extract', '$unwind is used to flatten nested documents (not arrays); includeArrayIndex adds a counter field for deduplication', '$unwind is deprecated since MongoDB 5.0; use $reduce instead to iterate over array elements'], answer: 0, explanation: '$unwind: given a document { _id: 1, tags: ["a", "b", "c"] }, $unwind on tags produces 3 documents: { _id: 1, tags: "a" }, { _id: 1, tags: "b" }, { _id: 1, tags: "c" }. Options: preserveNullAndEmpty: true — includes documents where the array field is null or missing (otherwise they are dropped). includeArrayIndex: "tagIndex" — adds a field tagIndex with the 0-based array position: { _id: 1, tags: "a", tagIndex: 0 }. Common pattern: $unwind followed by $group to aggregate per array element. Example: count how many documents each tag appears in. Watch out: $unwind can dramatically increase document count — a collection of 100K documents each with 10 tags becomes 1M documents after $unwind.' },
    { q: 'How does $lookup work with a pipeline sub-expression (extended syntax)?', options: ['The pipeline sub-expression runs a JavaScript function on the local collection before joining', '$lookup with a pipeline sub-expression lets you filter the joined (from) collection with arbitrary conditions including ranges and expressions, not just equality matches on a single field', '$lookup with pipeline is only supported in Atlas, not in self-hosted MongoDB', '$lookup with pipeline replaces the from field — you cannot specify a from collection with the pipeline option'], answer: 1, explanation: 'Standard $lookup (equality join): { $lookup: { from: "orders", localField: "userId", foreignField: "userId", as: "orders" } }. Limited to equality match on one field. Pipeline $lookup: { $lookup: { from: "orders", let: { uid: "$userId" }, pipeline: [ { $match: { $expr: { $and: [{ $eq: ["$userId", "$$uid"] }, { $gt: ["$total", 100] }] } } }, { $sort: { createdAt: -1 } }, { $limit: 5 } ], as: "recentHighValueOrders" } }. The let clause binds local document fields to variables ($$ prefix in pipeline). The pipeline sub-expression can have any stages, including $match with $expr, $sort, $limit, $project. Joins do not use indexes on the local collection — ensure the from collection has an index on the joined fields.' },
    { q: 'What is the allowDiskUse option and when is it necessary?', options: ['allowDiskUse enables storing aggregation results to disk permanently instead of in memory', 'allowDiskUse allows aggregation pipeline stages to spill temporary data to disk when the 100 MB per-stage memory limit is exceeded, enabling processing of large datasets at the cost of performance', 'allowDiskUse is required for any aggregation that touches more than 1 GB of data', 'allowDiskUse is deprecated — MongoDB 6.0+ automatically uses disk when needed without requiring the option'], answer: 1, explanation: 'MongoDB aggregation pipeline has a 100 MB memory limit per stage. If a $sort or $group stage needs to hold more than 100 MB in memory, MongoDB throws an error: ExceededMemoryLimit. Solution: set allowDiskUse: true in the aggregation options. With this option, MongoDB spills the excess to a temporary disk location (similar to a SQL ORDER BY using tempdb). Performance impact: disk I/O is orders of magnitude slower than RAM. allowDiskUse is a correctness escape hatch, not a performance feature. If you need it often, consider: adding an index to avoid the in-memory sort, partitioning the query to process smaller result sets, or increasing MongoDB server RAM. MongoDB 4.4+: disk spill location configurable via $tmpPath. The 100MB limit applies per stage, not to the total pipeline.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use aggregation vs find()?',
      a: 'Use <code>find()</code> for: simple CRUD reads, filtering and projecting documents with minor transformations, paginated lists. Use aggregation for: grouping and summarising (counts, sums, averages), computing fields that don\'t exist in the document, joining collections ($lookup), reshaping documents substantially, any analysis that would require multiple find() calls and in-memory processing. As a rule of thumb: if you need GROUP BY, JOIN, or window functions (SQL analogy) — use aggregation.',
    },
    {
      q: 'What is the $bucket stage used for?',
      a: '<code>$bucket</code> groups documents into ranges (buckets) based on a field value. Example: price buckets — under $10, $10-50, $50-100, over $100. You define the boundaries and MongoDB assigns each document to the appropriate bucket, counting and accumulating as it goes. <code>$bucketAuto</code> automatically determines the boundaries to distribute documents evenly across N buckets.',
    },
    {
      q: 'Can aggregation pipelines be interrupted or paused?',
      a: 'Pipeline stages run to completion — you can\'t pause them mid-execution. However, the result is a cursor that is lazily consumed. If you\'re streaming results with <code>for await (const doc of cursor)</code>, MongoDB processes one batch at a time. For very long-running pipelines (ETL jobs, analytics), consider: (1) breaking into smaller pipelines, (2) using <code>$out</code> to materialise intermediate results into a collection, (3) setting a <code>maxTimeMS</code> to kill overrunning pipelines.',
    },
    {
      q: 'What is the difference between $project and $replaceRoot?',
      a: '<code>$project</code> reshapes the current document — you specify which fields to include, exclude, or compute. <code>$replaceRoot</code> completely replaces the current document with a subdocument or expression. Common use case: after a $lookup that adds an array of matched documents, $unwind + $replaceRoot can "flatten" the joined document to the top level: <code>{ $replaceRoot: { newRoot: { $mergeObjects: ["$$ROOT", "$joinedDoc"] } } }</code>.',
    },
    {
      q: 'How do I count documents in an aggregation pipeline?',
      a: 'Three ways: (1) <code>{ $count: "total" }</code> stage — outputs a single document <code>{ total: N }</code>. (2) <code>{ $group: { _id: null, count: { $sum: 1 } } }</code> — same result, more verbose. (3) <code>collection.countDocuments(filter)</code> outside aggregation — uses index, fast, but separate from the pipeline. Use <code>$count</code> inside pipelines when you need the count mid-pipeline or as part of a $facet result.',
    },
    { q: 'How do you use $bucket and $bucketAuto for data distribution analysis?', a: '$bucket: groups documents into explicitly defined ranges. Syntax: { $bucket: { groupBy: "$price", boundaries: [0, 10, 50, 100, Infinity], default: "other", output: { count: { $sum: 1 }, avgPrice: { $avg: "$price" } } } }. boundaries defines the bucket edges — must be in ascending order. Each bucket contains values from boundaries[i] up to but not including boundaries[i+1]. The default bucket captures values outside the defined ranges (below the first or above the last boundary). $bucketAuto: automatically determines N evenly distributed buckets. Syntax: { $bucketAuto: { groupBy: "$price", buckets: 5, output: { count: { $sum: 1 } } } }. MongoDB chooses boundaries to distribute documents evenly. Output includes a _id field with min and max for each bucket. Use $bucket when you have meaningful category boundaries (price ranges, age groups). Use $bucketAuto for exploratory data analysis when you do not know the distribution.' },
    { q: 'What is the $graphLookup stage used for?', a: '$graphLookup performs a recursive lookup — traversing a graph-like structure (parent-child relationships) in a single pipeline stage. Use case: organizational hierarchy (employees with managerId), category trees, social network friend-of-friend queries. Syntax: { $graphLookup: { from: "employees", startWith: "$managerId", connectFromField: "managerId", connectToField: "_id", as: "reportingChain", maxDepth: 5, depthField: "depth" } }. startWith: the initial value(s) to search for. connectFromField: the field in each found document to use as the next search value. connectToField: the field to match against. maxDepth: limits recursion depth (prevent infinite loops in cycles). depthField: adds the traversal depth to each result document. Result: the as field contains an array of all documents found during recursive traversal, in unspecified order. Performance: $graphLookup does not use indexes during the recursive phase — keep the from collection small or use maxDepth.' },
    { q: 'How do you paginate aggregation results efficiently?', a: 'Offset-based pagination: use $skip + $limit. { $sort: { createdAt: -1 } }, { $skip: (page - 1) * pageSize }, { $limit: pageSize }. Problem: $skip is O(n) — skipping 10,000 documents scans and discards 10,000 results. Slow for high page numbers. Cursor-based pagination (keyset pagination): record the last document seen on each page. The next page query filters from that point: { $match: { createdAt: { $lt: lastSeenCreatedAt } } }, { $sort: { createdAt: -1 } }, { $limit: pageSize }. Advantages: O(1) regardless of page number — uses the sort field index. Disadvantages: cannot jump to an arbitrary page (no page 50 of 100). Getting total count alongside results: use $facet to run both the paginated result and the count in a single query: { $facet: { data: [$skip, $limit], totalCount: [{ $count: "count" }] } }. In Atlas, use the Search $searchMeta stage for faceted counts.' },
    { q: 'What is the $merge stage and how does it differ from $out?', a: '$out: writes all pipeline results to a named collection, completely replacing the collection. The old collection is dropped and replaced atomically. No merge or update semantics — always a full replace. Requires the target collection to not exist or to be replaced entirely. $merge: writes pipeline results to a target collection with configurable merge behavior. Syntax: { $merge: { into: "target", on: "_id", whenMatched: "merge", whenNotMatched: "insert" } }. on: specifies the unique field(s) to match on. whenMatched options: merge (default — merge fields), replace, keepExisting, fail, or a custom pipeline. whenNotMatched: insert (default) or discard. Use cases for $merge: incrementally updating a materialized view (recalculate aggregations for new data only, merge into existing results). Upserting computed results. $merge is MongoDB 4.2+. Key difference: $out requires no concurrent readers during write and replaces entirely. $merge can write to an existing live collection with partial updates.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Aggregation pipeline: ordered stages transform documents server-side — $match first, then $group/$project/$sort/$unwind for analytics.',
    mustKnow: [
      'Pipeline: each stage\'s output is the next stage\'s input; runs on server',
      '$match first — reduces documents using indexes before expensive stages',
      '$group with _id: null aggregates all; _id: "$field" groups by field; accumulators: $sum, $avg, $push, $first',
      '$addFields/$set: add computed fields without dropping existing; $project: full reshape',
      '$unwind: one doc per array element; preserveNullAndEmpty to keep empty arrays',
      '$sort before $limit for top-N results',
      '$facet: parallel sub-pipelines; $out/$merge: write results to collection',
    ],
    interviewFocus: [
      '$match early for index use; late $match cannot use collection indexes',
      'Difference between $project and $addFields',
      '$unwind use cases and preserveNullAndEmpty',
      '$group _id: null for total aggregate; compound _id for multi-field grouping',
      'When to use aggregation vs find() (GROUP BY, JOIN, computed fields)',
    ],
  };
}
