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
  selector: 'app-mongo-lookup-joins',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './lookup-joins.html',
  styleUrl: './lookup-joins.scss',
})
export class MongoLookupJoins {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: '$lookup',          desc: 'Left outer join with another collection. Returns matching documents as an embedded array.' },
    { type: 'syntax',  name: 'from',             desc: 'Name of the collection to join with.' },
    { type: 'syntax',  name: 'localField',       desc: 'Field from the input documents.' },
    { type: 'syntax',  name: 'foreignField',     desc: 'Field in the "from" collection to match against localField.' },
    { type: 'syntax',  name: 'as',               desc: 'Name of the new array field containing matched documents.' },
    { type: 'syntax',  name: 'pipeline (in $lookup)', desc: 'Advanced: run a sub-pipeline on the joined collection.' },
    { type: 'keyword', name: '$unwind',          desc: 'Deconstruct the joined array — one doc per match (like INNER JOIN).' },
    { type: 'keyword', name: '$replaceRoot',     desc: 'Promote a nested doc to top level: { newRoot: { $mergeObjects: ["$$ROOT", "$joined"] } }.' },
    { type: 'operator', name: '$$ROOT',          desc: 'References the entire current pipeline document.' },
    { type: 'operator', name: '$$CURRENT',       desc: 'References the current document in the pipeline.' },
    { type: 'keyword', name: '$mergeObjects',    desc: 'Merge multiple objects into one: { $mergeObjects: ["$obj1", "$obj2"] }.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: '$lookup — Left Outer Join',
      points: [
        '<code>$lookup</code> is MongoDB\'s aggregation stage for joining documents from another collection. It performs a <strong>left outer join</strong>: every document from the source collection is included, with matched documents from the foreign collection embedded in an array field.',
        'Basic syntax: <code>{ $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } }</code>. The <code>as</code> field will contain an array of matching documents. If no documents match, the array is empty (<code>[]</code>) — not null.',
        'A $lookup that matches on a field with a unique index (like <code>_id</code>) returns at most one document per source document. The result is still an array of one element — use <code>$unwind</code> or <code>$arrayElemAt</code> to extract it.',
        '<code>$lookup</code> works within a single MongoDB database — you cannot join across databases in standard $lookup. Use the pipeline form for more complex conditions (non-equality joins, filtering the joined collection).',
        'Performance: $lookup is expensive compared to embedding. For high-throughput queries, denormalise frequently accessed data. Use $lookup for reporting, analytics, and admin queries where performance is secondary to correctness.',
      ],
    },
    {
      heading: 'INNER JOIN vs LEFT JOIN pattern',
      points: [
        '<code>$lookup</code> alone is always a LEFT OUTER JOIN — source documents with no matches are included with an empty array. To simulate an <strong>INNER JOIN</strong> (exclude non-matching documents), add <code>{ $match: { joinedField: { $ne: [] } } }</code> after $lookup, or use <code>$unwind</code> without <code>preserveNullAndEmpty</code> (default drops empty arrays).',
        'Pattern for INNER JOIN: <code>$lookup → $unwind (without preserveNullAndEmpty)</code>. Documents with no matches are dropped by $unwind since it drops empty arrays by default.',
        'To flatten a one-to-one lookup result: use <code>{ $unwind: { path: "$user", preserveNullAndEmpty: false } }</code> for INNER JOIN, or merge the fields: <code>{ $addFields: { userName: { $arrayElemAt: ["$user.name", 0] } } }</code> for LEFT JOIN.',
        '<code>$mergeObjects</code> with <code>$replaceRoot</code> flattens joined fields to the top level: <code>{ $replaceRoot: { newRoot: { $mergeObjects: ["$$ROOT", { $arrayElemAt: ["$user", 0] }] } } }</code>.',
        'Many-to-many joins: if the local document has an array of foreign IDs (e.g., <code>tagIds: [id1, id2]</code>), $lookup matches all of them at once — <code>localField: "tagIds", foreignField: "_id"</code> returns all matching tags in the <code>as</code> array.',
      ],
    },
    {
      heading: 'Pipeline-based $lookup',
      points: [
        'The <strong>pipeline form</strong> of $lookup is more powerful: instead of a simple equality join, you run a sub-pipeline on the foreign collection. This enables: inequality joins, filtering the foreign documents before joining, computed join conditions.',
        '<code>let</code> binds local variables from the source document for use in the sub-pipeline. Reference them with <code>$$varName</code> (double dollar). These are read-only within the sub-pipeline.',
        'Example: join orders to products but only include products whose price is less than the order\'s budget — this is an inequality join that\'s impossible with basic $lookup.',
        'Pipeline $lookup is also useful for filtering the joined collection before embedding (reducing the size of the embedded array) or for running aggregation on the joined collection (e.g., join users and embed only their order count, not all orders).',
        'Cannot use pipeline $lookup across different databases. For cross-database reporting, export data to a common database, use Atlas Data Federation, or perform the join in application code.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic $lookup',
      language: 'typescript',
      code: `const orders = db.collection('orders');

// Join orders → users (LEFT OUTER JOIN)
const ordersWithUsers = await orders.aggregate([
  { $lookup: {
    from:         'users',
    localField:   'userId',      // orders.userId
    foreignField: '_id',         // users._id
    as:           'user',        // embedded as orders.user (array)
  }},
  { $addFields: {
    user: { $arrayElemAt: ['$user', 0] }, // extract single match from array
  }},
  { $project: { 'user.password': 0 } },  // exclude sensitive field from join
]).toArray();

// INNER JOIN: drop orders with no matching user
const innerJoin = await orders.aggregate([
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
  { $unwind: '$user' }, // drops orders with empty user array
]).toArray();

// Many-to-many: posts with their tag objects (post.tagIds = [ObjectId, ...])
const postsWithTags = await db.collection('posts').aggregate([
  { $lookup: {
    from:         'tags',
    localField:   'tagIds',
    foreignField: '_id',
    as:           'tags',
  }},
]).toArray();
// Each post has a tags array with full tag documents`,
    },
    {
      label: 'Pipeline $lookup',
      language: 'typescript',
      code: `// Pipeline $lookup — filter and compute on the joined collection
const departments = db.collection('departments');

const deptWithEmployeeStats = await departments.aggregate([
  { $lookup: {
    from: 'employees',
    let:  { deptId: '$_id', budget: '$budget' },   // bind local vars
    pipeline: [
      { $match: {
        $expr: {
          $and: [
            { $eq: ['$departmentId', '$$deptId'] }, // equality join
            { $lte: ['$salary', '$$budget'] },       // inequality condition
          ],
        },
      }},
      { $project: { name: 1, salary: 1, role: 1 } }, // only these fields
      { $sort: { salary: -1 } },
      { $limit: 5 },  // top 5 earners per department
    ],
    as: 'topEarners',
  }},
  { $addFields: {
    avgTopSalary: { $avg: '$topEarners.salary' },
    teamSize:     { $size: '$topEarners' },
  }},
]).toArray();

// Join and compute aggregate in sub-pipeline
const usersWithOrderCount = await db.collection('users').aggregate([
  { $lookup: {
    from: 'orders',
    let:  { uid: '$_id' },
    pipeline: [
      { $match: { $expr: { $eq: ['$userId', '$$uid'] } } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ],
    as: 'orderStats',
  }},
  { $addFields: {
    orderCount: { $ifNull: [{ $arrayElemAt: ['$orderStats.count', 0] }, 0] },
    totalSpent: { $ifNull: [{ $arrayElemAt: ['$orderStats.total', 0] }, 0] },
  }},
  { $project: { orderStats: 0, password: 0 } },
]).toArray();`,
    },
    {
      label: 'Flatten Join Results',
      language: 'typescript',
      code: `// Merge joined fields to top level (flatten one-to-one join)
const merged = await db.collection('orders').aggregate([
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
  { $replaceRoot: {
    newRoot: {
      $mergeObjects: [
        '$$ROOT',                           // original order fields
        { $arrayElemAt: ['$user', 0] },    // user fields (last wins on conflict)
      ],
    },
  }},
  { $project: { user: 0, password: 0, __v: 0 } }, // clean up duplicates
]).toArray();
// Result: order fields + user.name, user.email merged at top level

// GraphQL-style nested result: keep structure
const nested = await db.collection('orders').aggregate([
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
  { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'products' } },
  { $addFields: {
    user:     { $arrayElemAt: ['$user', 0] },
    // products stays as array (many per order)
  }},
  { $project: {
    orderNumber: 1, amount: 1, status: 1,
    'user.name': 1, 'user.email': 1,
    'products.name': 1, 'products.price': 1,
  }},
]).toArray();`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Expecting $lookup to return a single document, not an array',
      wrong: `// result.user is an array, not a document!
const result = await col.aggregate([
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
]).toArray();
console.log(result[0].user.name); // TypeError: Cannot read property 'name' of undefined`,
      right: `// Extract the first element from the array
col.aggregate([
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
  { $addFields: { user: { $arrayElemAt: ['$user', 0] } } },
])
// Now result[0].user.name works`,
      explanation: '$lookup always produces an array in the "as" field — even for one-to-one joins. Use $arrayElemAt: ["$field", 0] to extract the single element, or $unwind to flatten it.',
    },
    {
      title: 'Joining inside a $lookup without preserveNullAndEmpty turning LEFT into INNER',
      wrong: `// Intended: show ALL orders with optional user info (LEFT JOIN)
// Actual: drops orders with no matching user (INNER JOIN behavior)
col.aggregate([
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
  { $unwind: '$user' }, // ← this makes it INNER JOIN!
])`,
      right: `// LEFT JOIN: keep orders even with no matching user
col.aggregate([
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
  { $unwind: { path: '$user', preserveNullAndEmpty: true } }, // keep if empty
  // or: don't unwind — access via $arrayElemAt
])`,
      explanation: '$unwind without preserveNullAndEmpty drops documents where the unwound array is empty — converting a LEFT JOIN into an INNER JOIN. Use preserveNullAndEmpty: true to maintain LEFT JOIN semantics.',
    },
    {
      title: 'Using $lookup without an index on the foreignField',
      wrong: `// foreignField 'userId' has no index — full scan of orders per user
users.aggregate([
  { $lookup: { from: 'orders', localField: '_id', foreignField: 'userId', as: 'orders' } },
])
// On 100k users × 1M orders = 100 billion comparisons`,
      right: `// First: create index on the join field
await db.collection('orders').createIndex({ userId: 1 });

// Now the $lookup uses the index for each join
users.aggregate([
  { $lookup: { from: 'orders', localField: '_id', foreignField: 'userId', as: 'orders' } },
])`,
      explanation: '$lookup performs a lookup in the foreign collection for each input document. Without an index on the foreignField, this is an O(n × m) full scan. Always index the foreignField (and if possible localField) before using $lookup in production.',
    },
    {
      title: 'Referencing local variables with $ instead of $$ in pipeline $lookup',
      wrong: `// $ means "field in the current pipeline document" — not the let binding!
{ $lookup: {
  from: 'orders', let: { uid: '$_id' },
  pipeline: [{ $match: { $expr: { $eq: ['$userId', '$uid'] } } }], // $uid is wrong
  as: 'orders'
}}`,
      right: `// $$ references let bindings; $ references fields in the pipeline docs
{ $lookup: {
  from: 'orders', let: { uid: '$_id' },
  pipeline: [{ $match: { $expr: { $eq: ['$userId', '$$uid'] } } }], // $$uid correct
  as: 'orders'
}}`,
      explanation: 'In pipeline $lookup, let variables are referenced with $$ (double dollar). Single $ refers to fields in the foreign collection\'s documents being processed in the sub-pipeline. Mixing them up causes the join condition to always match or always fail.',
    },
  ];

  challenge: Challenge = {
    title: 'Order Details Report',
    language: 'typescript',
    description: 'Write an aggregation that returns orders enriched with user and product data. Each result should have: orderId, amount, status, createdAt, customerName (from users collection), customerEmail, and an items array where each item includes productName and productPrice (from products collection). INNER JOIN semantics — skip orders with missing users.',
    hints: [
      '$lookup orders → users on userId → _id.',
      '$unwind user (INNER JOIN — drops orders without a user).',
      '$lookup on items.productId → products._id (array field lookup).',
      'Project only the fields you need from each joined collection.',
    ],
    starterCode: `const orders = db.collection('orders');
// orders: { _id, userId, amount, status, createdAt, items: [{ productId, qty }] }
// users: { _id, name, email }
// products: { _id, name, price }

const report = await orders.aggregate([
  // TODO: join users (INNER JOIN)
  // TODO: join products for items
  // TODO: project final shape
]).toArray();`,
    solution: `const orders = db.collection('orders');

const report = await orders.aggregate([
  { $match: { status: { $in: ['completed', 'shipped'] } } },

  // Join user (INNER JOIN: $unwind drops orders without user)
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
  { $unwind: '$user' },

  // Join products for each item
  { $lookup: {
    from: 'products',
    localField: 'items.productId',
    foreignField: '_id',
    as: 'productDocs',
  }},

  { $addFields: {
    items: {
      $map: {
        input: '$items',
        as: 'item',
        in: {
          productId: '$$item.productId',
          qty: '$$item.qty',
          product: {
            $first: {
              $filter: {
                input: '$productDocs',
                cond: { $eq: ['$$this._id', '$$item.productId'] },
              },
            },
          },
        },
      },
    },
  }},

  { $project: {
    orderId:       '$_id',
    amount:        1,
    status:        1,
    createdAt:     1,
    customerName:  '$user.name',
    customerEmail: '$user.email',
    items: {
      $map: {
        input: '$items',
        as: 'i',
        in: { productName: '$$i.product.name', productPrice: '$$i.product.price', qty: '$$i.qty' },
      },
    },
    _id: 0,
  }},
]).toArray();`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What type of join does $lookup perform by default?',
      options: ['INNER JOIN', 'RIGHT OUTER JOIN', 'LEFT OUTER JOIN', 'CROSS JOIN'],
      answer: 2,
      explanation: '$lookup performs a LEFT OUTER JOIN — every document from the source collection is included in results. Documents with no matches in the foreign collection have an empty array in the "as" field.',
    },
    {
      q: 'What does the "as" field in $lookup contain?',
      options: [
        'A single matched document',
        'An array of matched documents (or empty array if no match)',
        'The foreign collection name',
        'The join condition result (true/false)',
      ],
      answer: 1,
      explanation: 'The "as" field always contains an array of matching documents from the foreign collection. Even for one-to-one joins (on _id), the result is a single-element array. Use $arrayElemAt or $unwind to extract a single document.',
    },
    {
      q: 'How do you reference a "let" variable inside a pipeline $lookup\'s sub-pipeline?',
      options: ['$varName', '$$varName', '#varName', '@varName'],
      answer: 1,
      explanation: 'Let variables in pipeline $lookup are referenced with double dollar ($$varName). Single $ refers to fields in the foreign collection\'s documents being processed in the sub-pipeline. Confusing $ and $$ causes join conditions to always match or fail.',
    },
    {
      q: 'To simulate an INNER JOIN with $lookup, which stage do you add after it?',
      options: [
        '{ $filter: { as: "joined", as: [] } }',
        '{ $match: { joined: { $ne: [] } } } or $unwind (without preserveNullAndEmpty)',
        '{ $innerJoin: true }',
        '{ $project: { joined: 1 } }',
      ],
      answer: 1,
      explanation: 'After $lookup, add either $unwind (which drops empty arrays by default) or { $match: { joinedField: { $ne: [] } } } to filter out source documents with no matches — converting LEFT OUTER JOIN to INNER JOIN.',
    },
    {
      q: 'What critical performance step is needed before using $lookup in production?',
      options: [
        'Enable sharding on the foreign collection',
        'Create an index on the foreignField in the joined collection',
        'Set writeConcern to majority',
        'Enable transactions',
      ],
      answer: 1,
      explanation: 'Without an index on the foreignField, $lookup performs a full collection scan for every input document — O(n × m) complexity. Always create an index on the foreignField before using $lookup in production queries.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use $lookup or embed related data in the document?',
      a: '<strong>Embed when</strong>: the related data is always accessed with the parent (e.g., order items with the order), the relationship is one-to-few, and the embedded data doesn\'t change independently. <strong>Reference ($lookup) when</strong>: the related data is large or unbounded, is shared across many documents, or is updated independently. For reporting/analytics queries, $lookup is fine. For real-time user-facing queries, prefer embedding hot data.',
    },
    {
      q: 'Can I join more than two collections in one aggregation pipeline?',
      a: 'Yes — chain multiple $lookup stages. Each $lookup adds an array field to the documents; subsequent $lookups can reference the original document fields or use pipeline form to join based on conditions involving any field. There\'s no theoretical limit on the number of $lookups, but each one adds latency. For complex multi-join reporting, consider denormalising critical data or using materialized views via $out/$merge.',
    },
    {
      q: 'What is the difference between $lookup and $graphLookup?',
      a: '<code>$lookup</code> performs a simple (one-level) join. <code>$graphLookup</code> performs a recursive graph traversal — it repeatedly looks up connected documents until a depth limit is reached. Use <code>$graphLookup</code> for: org charts (manager → employee → sub-employees), category hierarchies (parent → child → grandchild), friend-of-friend social graphs. <code>$graphLookup</code> is more expensive but enables queries impossible with basic $lookup.',
    },
    {
      q: 'How do I do a $lookup on an array field (e.g., an array of foreign IDs)?',
      a: 'Basic $lookup supports array fields in <code>localField</code> natively — if <code>tagIds</code> is an array of ObjectIds, <code>{ $lookup: { from: "tags", localField: "tagIds", foreignField: "_id", as: "tags" } }</code> returns all matching tag documents in the <code>tags</code> array. MongoDB automatically handles the array expansion. No $unwind needed before the $lookup.',
    },
    {
      q: 'What is $mergeObjects and when is it useful after $lookup?',
      a: '<code>$mergeObjects</code> merges multiple objects into one, with later objects\' fields overwriting earlier ones on conflict. After a $lookup (with $unwind), you often want to "flatten" the joined document to the top level: <code>{ $replaceRoot: { newRoot: { $mergeObjects: ["$$ROOT", "$joinedField"] } } }</code>. This removes the nesting and puts all fields at the document root level. Useful when the joined document\'s fields should be first-class fields in the result.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: '$lookup performs left outer joins in aggregation; always index the foreignField; result is an array in the "as" field.',
    mustKnow: [
      '$lookup = LEFT OUTER JOIN; "as" field is always an array',
      'Extract single match: { $arrayElemAt: ["$field", 0] } or $unwind',
      'INNER JOIN: $unwind (drops empty arrays) or $match: { joined: { $ne: [] } }',
      'Pipeline $lookup: use let/pipeline for inequality joins and filtering',
      'let vars referenced with $$ inside sub-pipeline; $ = foreign collection fields',
      'Index the foreignField before production use; $lookup without index = full scan per doc',
      '$mergeObjects + $replaceRoot to flatten joined fields to top level',
    ],
    interviewFocus: [
      '$lookup left outer join semantics; simulate inner join with $unwind',
      'When to embed vs reference ($lookup)',
      'Pipeline $lookup for complex join conditions',
      '$$var vs $var in pipeline $lookup sub-pipeline',
      'Index requirement for performant $lookup',
    ],
  };
}
