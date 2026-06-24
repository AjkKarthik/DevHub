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
  selector: 'app-mongo-array-queries',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './array-queries.html',
  styleUrl: './array-queries.scss',
})
export class MongoArrayQueries {
  quickRef: QuickRefItem[] = [
    { type: 'operator', name: '{ tags: "sale" }',      desc: 'Match docs where "sale" is in the tags array (element match, no operator needed).' },
    { type: 'operator', name: '$all',                   desc: 'Array contains ALL specified values: { tags: { $all: ["a","b"] } }.' },
    { type: 'operator', name: '$size',                  desc: 'Array has exact element count: { tags: { $size: 3 } }.' },
    { type: 'operator', name: '$elemMatch (query)',     desc: 'At least one element satisfies ALL conditions: { scores: { $elemMatch: { $gt:80, $lt:100 } } }.' },
    { type: 'operator', name: '$elemMatch (projection)', desc: 'Return only the first array element matching the condition.' },
    { type: 'operator', name: 'Dot notation index',    desc: 'Access element by index: { "scores.0": { $gt: 90 } } — first element > 90.' },
    { type: 'operator', name: '$slice (projection)',   desc: 'Return first/last N array elements: { scores: { $slice: -3 } } → last 3.' },
    { type: 'operator', name: 'Multikey index',        desc: 'Indexes on array fields — MongoDB creates one entry per array element automatically.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Querying Array Fields',
      points: [
        'MongoDB treats arrays as <strong>first-class</strong> query targets. <code>{ tags: "sale" }</code> matches any document where the <code>tags</code> array contains the value "sale" — you don\'t need a special operator for simple element membership tests.',
        'This "implicit element match" works for exact values and for subdocuments: <code>{ grades: { subject: "Math", score: 95 } }</code> matches if the grades array contains that exact embedded document (all fields, exact order). For partial subdocument matching, you need $elemMatch.',
        '<code>$all</code> matches documents where the array contains ALL specified values (in any order, possibly among others): <code>{ tags: { $all: ["nodejs", "mongodb"] } }</code>. Equivalent to multiple $and conditions on the same array field.',
        'Access specific array elements by index using dot notation: <code>{ "scores.0": { $gt: 90 } }</code> matches documents where the first element of scores is > 90. This is rarely used in production (array element positions are fragile), but useful for fixed-position data.',
        'Count-based filtering with <code>$size</code> requires an exact count. To match "at least N elements", use the existence of element at index N-1: <code>{ "items.2": { $exists: true } }</code> matches arrays with at least 3 elements.',
      ],
    },
    {
      heading: '$elemMatch — When You Need It',
      points: [
        'The critical distinction: <code>{ scores: { $gt: 80, $lt: 100 } }</code> vs <code>{ scores: { $elemMatch: { $gt: 80, $lt: 100 } } }</code>. The first matches if scores has ANY element > 80 AND ANY element < 100 (could be different elements). The second matches only if scores has a SINGLE element that is BOTH > 80 AND < 100.',
        'Without $elemMatch, range conditions on arrays are OR-like across elements. This causes false positives: a scores array of [60, 95] satisfies <code>$gt: 80 AND $lt: 100</code> (60 < 100, 95 > 80) even though no single score is between 80 and 100.',
        'For arrays of embedded documents, $elemMatch is almost always required for multi-condition matching: <code>{ items: { $elemMatch: { productId: "x", qty: { $gt: 2 } } } }</code> finds documents where a single item has both that productId AND qty > 2.',
        'Use $elemMatch in projections to return only the first matching array element in query results. This reduces payload size when you only need one element: <code>find({}, { grades: { $elemMatch: { subject: "Math" } } })</code>.',
        '$elemMatch cannot be used with the <code>$</code> projection (they are alternatives). Use the positional <code>$</code> in projections when the filter already identifies the matching element; use $elemMatch in projections when the projection condition differs from the query.',
      ],
    },
    {
      heading: 'Multikey Indexes',
      points: [
        'When you create an index on an array field, MongoDB automatically creates a <strong>multikey index</strong> — one index entry per array element. <code>createIndex({ tags: 1 })</code> on a document with tags: ["a", "b", "c"] creates three index entries.',
        'Multikey indexes power efficient array element queries: <code>{ tags: "sale" }</code> uses the tags multikey index to find matching documents in O(log n) without scanning all documents.',
        'Restriction: a compound index cannot have TWO multikey fields from arrays of different sizes. <code>createIndex({ tags: 1, scores: 1 })</code> fails if any document has both tags and scores as arrays (Cartesian product would produce too many entries).',
        'Index size consideration: an array with 100 elements creates 100 index entries per document. High-cardinality arrays (unbounded growth) make indexes large and write-heavy. Keep arrays bounded or index only low-cardinality arrays.',
        'You can create a multikey index on an array of embedded documents and query specific sub-fields: <code>createIndex({ "items.productId": 1 })</code> indexes the productId field of each element in the items array.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Array Queries',
      language: 'typescript',
      code: `const posts = db.collection('posts');

// Match any document where tags array contains "sale"
const onSale = await posts.find({ tags: 'sale' }).toArray();

// Match documents where tags contains ALL of these values
const both = await posts.find({ tags: { $all: ['nodejs', 'mongodb'] } }).toArray();

// Match arrays with EXACTLY 3 elements
const exactlyThree = await posts.find({ tags: { $size: 3 } }).toArray();

// "At least 3 elements" workaround (no $size with $gt):
const atLeastThree = await posts.find({ 'tags.2': { $exists: true } }).toArray();

// Query by array index (dot notation)
const highFirst = await posts.find({ 'scores.0': { $gt: 90 } }).toArray();

// $in on array field — docs where tags contains ANY of these values
const anyTag = await posts.find({ tags: { $in: ['sale', 'featured', 'new'] } }).toArray();
// Note: { tags: "sale" } is shorthand for the single-value case

// Match exact array value and order (rarely what you want)
const exactArray = await posts.find({ tags: ['a', 'b', 'c'] }).toArray(); // exact match`,
    },
    {
      label: '$elemMatch',
      language: 'typescript',
      code: `const orders = db.collection('orders');

// WITHOUT $elemMatch: checks across different elements (incorrect for multi-condition)
// Matches if ANY item has qty > 5, AND ANY item has price < 10 (could be different items!)
const wrong = await orders.find({
  items: { $gt: 5 },  // don't do this without $elemMatch
}).toArray();

// WITH $elemMatch: ALL conditions must be true for the SAME element
const correct = await orders.find({
  items: {
    $elemMatch: {
      qty: { $gt: 5 },
      price: { $lt: 10 },
    },
  },
}).toArray();

// $elemMatch for array of embedded documents
const hasRedLargeItem = await orders.find({
  items: {
    $elemMatch: {
      color: 'red',
      size: 'L',
      qty: { $gte: 1 },
    },
  },
}).toArray();

// $elemMatch in PROJECTION — return only first matching element
const projectedOrders = await orders.find(
  { 'items.color': 'red' },
  { items: { $elemMatch: { color: 'red' } } }  // return only red items
).toArray();
// Each order will have only the first red item in its items array`,
    },
    {
      label: 'Multikey Indexes',
      language: 'typescript',
      code: `// Create multikey index on array field
await db.collection('products').createIndex({ tags: 1 });
// MongoDB creates one entry per tag value per document

// Create index on nested field within array elements
await db.collection('orders').createIndex({ 'items.productId': 1 });

// Compound multikey: OK if only ONE array field
await db.collection('products').createIndex({ category: 1, tags: 1 });
// ^ Works if 'category' is a string and 'tags' is an array

// Compound multikey: FAILS if BOTH fields are arrays in the same document
// await db.collection('orders').createIndex({ 'items.productId': 1, 'items.tags': 1 });
// Error: cannot create compound multikey index on two array fields

// Verify an index is multikey:
// db.products.getIndexes()  — look for "multikey": true in explain output

// Aggregation $unwind + group to query array elements efficiently
const tagCounts = await db.collection('products').aggregate([
  { $unwind: '$tags' },
  { $group: { _id: '$tags', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]).toArray();`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Multi-condition array queries without $elemMatch',
      wrong: `// Intended: find orders with an item having qty > 5 AND price < 10
orders.find({ 'items.qty': { $gt: 5 }, 'items.price': { $lt: 10 } })
// WRONG: matches if ANY item has qty>5 AND ANY item (possibly different) has price<10`,
      right: `orders.find({
  items: { $elemMatch: { qty: { $gt: 5 }, price: { $lt: 10 } } }
})
// Correct: single item must satisfy BOTH conditions`,
      explanation: 'Multi-condition queries on array fields without $elemMatch apply conditions across different array elements. MongoDB finds documents where one element satisfies condition A AND a (possibly different) element satisfies condition B. Use $elemMatch to require all conditions on the same element.',
    },
    {
      title: 'Exact subdocument match without $elemMatch',
      wrong: `// Finds docs where grades array contains { subject: "Math" } EXACTLY (all fields, same order!)
orders.find({ grades: { subject: 'Math', score: 95 } })
// Fails if the element also has other fields like { subject: "Math", score: 95, grade: "A" }`,
      right: `// $elemMatch allows partial subdocument matching (field subset)
orders.find({ grades: { $elemMatch: { subject: 'Math', score: 95 } } })
// Matches even if the element has additional fields`,
      explanation: 'Without $elemMatch, an embedded document query requires an exact full match including field order. $elemMatch enables partial matching — the array element just needs to contain at least the specified fields.',
    },
    {
      title: 'Using $size with range operators',
      wrong: `// Invalid — $size doesn't accept $gte/$gt/$lte/$lt
orders.find({ items: { $size: { $gte: 3 } } })`,
      right: `// Check existence of element at index N-1 to test "at least N elements"
orders.find({ 'items.2': { $exists: true } })  // at least 3 items
// Or use aggregation with $filter and $size expression for complex counts`,
      explanation: '$size only accepts an exact integer — it cannot be combined with comparison operators. To match arrays with at least N elements, check that the element at index N-1 exists using dot-notation + $exists.',
    },
    {
      title: 'Creating compound indexes on two array fields in the same document',
      wrong: `// This throws: 'cannot index parallel arrays'
col.createIndex({ 'items.productId': 1, 'items.tags': 1 })
// Both fields are arrays — would create a Cartesian product of entries`,
      right: `// Only ONE array field per compound index
col.createIndex({ category: 1, 'items.productId': 1 })
// Or create separate indexes for each array field
col.createIndex({ 'items.productId': 1 })
col.createIndex({ 'items.tags': 1 })`,
      explanation: 'A compound multikey index cannot have two fields that are both arrays in the same document — the number of index entries would be the Cartesian product of the two array lengths. Decompose into separate indexes or restructure the document.',
    },
  ];

  challenge: Challenge = {
    title: 'Tag-Based Article Finder',
    language: 'typescript',
    description: 'Build a function to find articles matching a complex tag criteria: mustHave (all these tags must be present), anyOf (at least one of these tags), noneOf (none of these tags). Also support a minimum view count on any single view entry from the views array (use $elemMatch). The views array contains { date: Date, count: number }.',
    hints: [
      '$all for mustHave, $in for anyOf, $nin for noneOf on the tags array.',
      'Combine all conditions in one filter object (implicit AND).',
      'For views with minimum count on a single entry, use $elemMatch: { count: { $gte: minViews } }.',
      'Test edge cases: empty mustHave/anyOf/noneOf arrays should not add filter conditions.',
    ],
    starterCode: `async function findArticles(
  col: any,
  opts: {
    mustHave?: string[];
    anyOf?: string[];
    noneOf?: string[];
    minViewCount?: number;
  }
) {
  const filter: any = {};
  // TODO: build filter from opts
  return col.find(filter).toArray();
}`,
    solution: `async function findArticles(
  col: any,
  opts: {
    mustHave?: string[];
    anyOf?: string[];
    noneOf?: string[];
    minViewCount?: number;
  }
) {
  const filter: any = {};

  if (opts.mustHave?.length) filter.tags = { ...filter.tags, $all: opts.mustHave };
  if (opts.anyOf?.length)    filter.tags = { ...filter.tags, $in: opts.anyOf };
  if (opts.noneOf?.length)   filter.tags = { ...filter.tags, $nin: opts.noneOf };

  if (opts.minViewCount !== undefined) {
    filter.views = { $elemMatch: { count: { $gte: opts.minViewCount } } };
  }

  return col.find(filter).toArray();
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does { tags: "mongodb" } match in MongoDB?',
      options: [
        'Documents where tags is exactly the string "mongodb"',
        'Documents where the tags array contains "mongodb" as one of its elements',
        'Documents where tags starts with "mongodb"',
        'Documents where tags is an array of length 1 containing "mongodb"',
      ],
      answer: 1,
      explanation: 'When querying an array field with a scalar value, MongoDB matches documents where the array contains that value as any element. { tags: "mongodb" } is shorthand for element membership testing.',
    },
    {
      q: 'What does { scores: { $gt: 80, $lt: 100 } } match on an array field?',
      options: [
        'Documents where the SAME score element is > 80 AND < 100',
        'Documents where ANY score is > 80 AND ANY score (possibly different) is < 100',
        'Documents where ALL scores are between 80 and 100',
        'Documents where the FIRST score is between 80 and 100',
      ],
      answer: 1,
      explanation: 'Without $elemMatch, multi-condition queries on arrays check each condition independently across any array element. A score of 60 satisfies $lt: 100 and a score of 90 satisfies $gt: 80 — the document matches even though no single score is between 80 and 100.',
    },
    {
      q: 'What does $all guarantee?',
      options: [
        'The array contains ONLY the specified values',
        'The array contains ALL of the specified values (and possibly others)',
        'All documents in the collection have the specified values',
        'The array has no duplicate values',
      ],
      answer: 1,
      explanation: '$all matches if the array contains all specified values in any order, possibly among other elements. { tags: { $all: ["a","b"] } } matches ["a","b","c"] but not ["a","c"].',
    },
    {
      q: 'How do you find documents where an array has AT LEAST 5 elements?',
      options: [
        '{ arr: { $size: { $gte: 5 } } }',
        '{ arr: { $minLength: 5 } }',
        '{ "arr.4": { $exists: true } }',
        '{ arr: { $length: { $gte: 5 } } }',
      ],
      answer: 2,
      explanation: '$size only accepts exact integers, not range operators. The workaround is checking that the element at index N-1 exists: { "arr.4": { $exists: true } } checks that index 4 (the 5th element) exists.',
    },
    {
      q: 'What type of index does MongoDB automatically create when you index an array field?',
      options: ['Unique index', 'Multikey index', 'Sparse index', 'Text index'],
      answer: 1,
      explanation: 'MongoDB automatically creates a multikey index when the indexed field contains an array. One index entry is created per array element, enabling efficient queries for individual array values.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between { arr: "x" } and { arr: { $in: ["x"] } }?',
      a: 'They produce the same result — both match documents where the <code>arr</code> array contains "x". However, <code>$in</code> is more expressive for multiple values: <code>{ arr: { $in: ["x","y","z"] } }</code> matches documents where arr contains any of those values. Use the implicit form for single-value membership tests and <code>$in</code> for multiple values.',
    },
    {
      q: 'Can I query nested arrays (arrays within arrays)?',
      a: 'Yes, but with limitations. Dot notation traverses one level: <code>{ "matrix.0.0": 5 }</code> accesses the first element of the first sub-array. For deeper nesting or multi-condition matching on nested arrays, use aggregation with <code>$unwind</code> (multiple times for multiple levels) followed by a <code>$match</code> stage. The <code>$[]</code> (all positional) and <code>$[id]</code> (filtered positional) update operators handle nested arrays better than queries do.',
    },
    {
      q: 'When should I use $elemMatch in a projection vs a query?',
      a: '<strong>In a query</strong>: use $elemMatch in the filter to narrow which documents are returned. The document is only included if at least one array element satisfies all conditions. <strong>In a projection</strong>: use $elemMatch in the second argument to limit which array elements are included in the returned document. The document is always returned (based on the filter), but only the first matching array element is included in the specified field.',
    },
    {
      q: 'How do I sort by an array field in MongoDB?',
      a: 'When you sort by an array field, MongoDB uses the minimum value (ascending sort) or maximum value (descending sort) from each document\'s array for comparison. <code>.sort({ scores: 1 })</code> sorts documents by their lowest score; <code>.sort({ scores: -1 })</code> by their highest score. For sorting by an aggregated array value (e.g., average score), use aggregation: <code>$addFields</code> to compute the average, then <code>$sort</code>.',
    },
    {
      q: 'What is $unwind in aggregation and when should I use it for array queries?',
      a: '<code>$unwind</code> deconstructs an array field, outputting one document per array element with the element\'s value substituted for the array. Use it when you need to: (1) group by individual array values, (2) apply complex filtering on array elements, (3) perform per-element calculations. After $unwind, each "document" represents one array element — you can then $match, $group, $sort, etc. Remember to $group back if you need results per original document.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'MongoDB queries arrays by element membership, $all, $size, and $elemMatch for multi-condition element matching.',
    mustKnow: [
      '{ arr: "x" } matches if "x" is any element in arr — no operator needed',
      '$all: all specified values must be present; $in: any one value must be present',
      '$size requires exact count; use "arr.N": { $exists: true } for "at least N" check',
      'Multi-condition array queries need $elemMatch — without it, conditions can match across different elements',
      'Multikey index: one entry per array element; compound multikey cannot have two array fields',
      '$elemMatch in projections returns only the first matching array element',
    ],
    interviewFocus: [
      '$elemMatch requirement for multi-condition array element matching',
      'Multikey index creation and compound index restrictions',
      '$all vs $in on array fields',
      '$size limitation and "at least N" workaround',
      '$unwind in aggregation for per-element operations',
    ],
  };
}
