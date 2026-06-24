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
