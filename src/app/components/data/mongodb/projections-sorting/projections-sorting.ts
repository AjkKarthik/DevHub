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
  selector: 'app-mongo-projections-sorting',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './projections-sorting.html',
  styleUrl: './projections-sorting.scss',
})
export class MongoProjectionsSorting {
  quickRef: QuickRefItem[] = [
    { type: 'syntax',  name: '{ field: 1 }',          desc: 'Inclusion projection — return only specified fields (+ _id by default).' },
    { type: 'syntax',  name: '{ field: 0 }',          desc: 'Exclusion projection — return all fields EXCEPT specified ones.' },
    { type: 'syntax',  name: '{ _id: 0 }',            desc: 'Exclude _id from results (only exclusion allowed alongside inclusions).' },
    { type: 'operator', name: '$slice (projection)',  desc: '{ arr: { $slice: 5 } } — return first 5 elements. -5 = last 5. [skip, limit] = pagination.' },
    { type: 'operator', name: '$elemMatch (projection)', desc: 'Return only the first array element matching a condition.' },
    { type: 'operator', name: '$ (positional)',       desc: 'Return the first matching array element (element used in the query filter).' },
    { type: 'operator', name: '$meta',                desc: '{ score: { $meta: "textScore" } } — include computed text search score.' },
    { type: 'syntax',  name: 'sort({ field: 1 })',    desc: '1 = ascending, -1 = descending. Multiple fields: secondary sort.' },
    { type: 'syntax',  name: 'sort({ $natural: 1 })', desc: 'Natural order — insertion order on non-capped collections (unreliable).' },
    { type: 'syntax',  name: 'skip(N).limit(N)',       desc: 'Offset-based pagination. skip() is O(N) — prefer cursor-based pagination.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Projections — Inclusion vs Exclusion',
      points: [
        'Projections control which fields are returned in query results, reducing network payload and memory usage. The second argument to <code>find()</code> and <code>findOne()</code> is the projection document.',
        '<strong>Inclusion projection</strong> <code>{ name: 1, email: 1 }</code> — returns ONLY the specified fields plus <code>_id</code> (by default). All other fields are excluded. Use to send only the data the client needs.',
        '<strong>Exclusion projection</strong> <code>{ password: 0, secretKey: 0 }</code> — returns ALL fields EXCEPT the specified ones. Common use case: exclude sensitive fields (password hashes, tokens) from API responses.',
        '<strong>Critical rule</strong>: you cannot mix inclusion and exclusion in a single projection — except for <code>_id</code>. <code>{ name: 1, password: 0 }</code> throws an error. Either list what you want (inclusion) or list what to exclude (exclusion).',
        'Projections are executed on the server — MongoDB sends only the projected fields over the wire. This saves bandwidth and reduces deserialization time on the client. Always project to only the fields you need in production.',
      ],
    },
    {
      heading: 'Array Projections',
      points: [
        '<code>$slice</code> limits which array elements are returned. Positive: first N. Negative: last N. Two-element array [skip, limit]: <code>{ comments: { $slice: [10, 5] } }</code> skips 10, returns next 5.',
        'The <strong>positional <code>$</code> operator</strong> in a projection returns only the first array element that matched the query filter. The filter must have matched on the same array field: <code>find({ scores: { $gt: 80 } }, { "scores.$": 1 })</code>.',
        '<strong>$elemMatch in projection</strong> is similar to positional $, but the projection condition can differ from the query condition: <code>find({}, { items: { $elemMatch: { color: "red" } } })</code> returns all documents but only includes their first red item.',
        'Cannot combine positional $ projection with $elemMatch projection on the same field. Choose one based on whether your projection condition matches your query condition.',
        'Projected fields in aggregation use <code>$project</code> stage with the same syntax. Aggregation projections additionally support computed fields using expressions.',
      ],
    },
    {
      heading: 'Sorting',
      points: [
        'Sort by ascending: <code>sort({ price: 1 })</code>. Descending: <code>sort({ price: -1 })</code>. Multiple fields (compound sort): <code>sort({ category: 1, price: -1 })</code> — sort by category ascending, then price descending within each category.',
        'Sort on a field with an index is very fast (index already sorted). Sort without an index requires MongoDB to sort all results in memory. MongoDB limits in-memory sorts to <strong>32 MB</strong> by default — larger sorts fail with <code>QueryExceededMemoryLimitNoDiskUseAllowed</code>.',
        'Sort on an array field: for ascending sort, MongoDB uses the minimum value in the array; for descending, the maximum. Results may seem counterintuitive for array fields.',
        'For text search results, sort by relevance score: <code>sort({ score: { $meta: "textScore" } })</code> combined with a projection that includes the score: <code>{ score: { $meta: "textScore" } }</code>.',
        'Natural order (<code>$natural: 1</code>) returns documents in insertion order but is not stable — documents can be moved on disk. Never rely on natural order for production sort requirements. Always sort by a meaningful field.',
      ],
    },
    {
      heading: 'Pagination',
      points: [
        '<strong>Offset-based pagination</strong> (<code>skip/limit</code>): <code>skip(page * pageSize).limit(pageSize)</code>. Simple but expensive at high offsets — MongoDB must scan and discard all <code>skip</code> documents. Page 1 is fast; page 1,000 is slow on a large collection.',
        '<strong>Cursor-based pagination</strong> (recommended): use the last seen value as a bookmark. <code>find({ _id: { $gt: lastId } }).sort({ _id: 1 }).limit(pageSize)</code>. MongoDB uses an index range scan starting at <code>lastId</code> — O(log n + pageSize) regardless of page number.',
        'Cursor-based pagination requires a <strong>stable sort key</strong> — a field that monotonically increases (ObjectId, timestamp with tiebreaker). If items can be inserted between pages, use a compound cursor key: <code>{ createdAt, _id }</code> for pagination stability.',
        'Return the cursor key (e.g., <code>_id</code> of the last document) in API responses as a <code>nextCursor</code>. Clients pass it back as a query parameter on the next request.',
        'For "total count" in paginated APIs, avoid running <code>countDocuments()</code> on every request — it\'s a separate full-index scan. Instead, omit the total count (return <code>hasMore: true/false</code>) or cache the count with a TTL.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Projections',
      language: 'typescript',
      code: `const users = db.collection('users');

// Inclusion — only name and email (+ _id)
const userList = await users.find({}, { projection: { name: 1, email: 1 } }).toArray();

// Inclusion without _id
const publicList = await users.find({}, { projection: { name: 1, email: 1, _id: 0 } }).toArray();

// Exclusion — everything except sensitive fields
const safeUsers = await users.find({}, {
  projection: { password: 0, resetToken: 0, __v: 0 }
}).toArray();

// Nested field projection (dot notation)
const addresses = await users.find({}, {
  projection: { name: 1, 'address.city': 1, 'address.country': 1 }
}).toArray();

// $slice — return only first 3 comments
const postWithFewComments = await db.collection('posts').find({}, {
  projection: { title: 1, comments: { $slice: 3 } }
}).toArray();

// $slice [skip, limit] — return comments 11-15
const postComments = await db.collection('posts').find({}, {
  projection: { comments: { $slice: [10, 5] } }
}).toArray();

// Positional $ — return only matching score
const matching = await db.collection('students').find(
  { scores: { $gt: 85 } },
  { projection: { name: 1, 'scores.$': 1 } }
).toArray();`,
    },
    {
      label: 'Sorting',
      language: 'typescript',
      code: `const products = db.collection('products');

// Single field sort
const byPrice = await products.find({}).sort({ price: 1 }).toArray();     // cheap first
const byDate  = await products.find({}).sort({ createdAt: -1 }).toArray(); // newest first

// Multi-field sort (compound)
const compound = await products.find({}).sort({ category: 1, price: -1 }).toArray();
// Sort by category A→Z, then within each category by price high→low

// Chaining sort + limit + skip
const page = await products.find({ inStock: true })
  .sort({ price: 1 })
  .skip(20)  // skip first 20 (for page 3 with pageSize=10)
  .limit(10)
  .toArray();

// Text search sort by relevance
await db.collection('articles').createIndex({ title: 'text', content: 'text' });
const relevant = await db.collection('articles').find(
  { $text: { $search: 'mongodb performance' } },
  { projection: { score: { $meta: 'textScore' } } }
).sort({ score: { $meta: 'textScore' } }).toArray();

// Sort on array field (min for ascending)
const byMinScore = await db.collection('students').find({}).sort({ scores: 1 }).toArray();`,
    },
    {
      label: 'Cursor-Based Pagination',
      language: 'typescript',
      code: `const products = db.collection('products');

// Create index for pagination field
await products.createIndex({ createdAt: 1, _id: 1 });

interface PageResult<T> {
  items: T[];
  nextCursor: string | null;
}

async function getProductsPage(
  lastCursor?: string,    // JSON-encoded { createdAt, _id }
  pageSize = 10
): Promise<PageResult<any>> {
  const filter: any = {};

  if (lastCursor) {
    const { createdAt, _id } = JSON.parse(lastCursor);
    // Get items after this cursor (createdAt + _id compound key)
    filter.$or = [
      { createdAt: { $gt: new Date(createdAt) } },
      {
        createdAt: new Date(createdAt),
        _id: { $gt: new (require('mongodb').ObjectId)(_id) }
      },
    ];
  }

  const items = await products
    .find(filter)
    .sort({ createdAt: 1, _id: 1 }) // stable sort
    .limit(pageSize + 1)             // fetch one extra to detect hasMore
    .toArray();

  const hasMore = items.length > pageSize;
  if (hasMore) items.pop(); // remove the extra

  const last = items[items.length - 1];
  const nextCursor = hasMore && last
    ? JSON.stringify({ createdAt: last.createdAt, _id: last._id })
    : null;

  return { items, nextCursor };
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Mixing inclusion and exclusion in a projection',
      wrong: `// Throws: "Projection cannot have a mix of inclusion and exclusion"
col.find({}, { name: 1, password: 0 })`,
      right: `// Option 1: inclusion — list what you want (exclude password implicitly)
col.find({}, { name: 1, email: 1, role: 1, _id: 0 })

// Option 2: exclusion — list what to hide
col.find({}, { password: 0, secretToken: 0 })`,
      explanation: 'MongoDB projections cannot mix 1 (include) and 0 (exclude) in the same document — except for _id, which can be excluded alongside an inclusion projection. Decide on one approach: either list what to include, or list what to exclude.',
    },
    {
      title: 'Using offset-based pagination at high page numbers',
      wrong: `// Page 10,000 of 100 items: scans and discards 1,000,000 documents!
const items = await col.find({}).sort({ createdAt: -1 }).skip(1_000_000).limit(100).toArray();`,
      right: `// Cursor-based: starts scan at lastId — O(log n) always
const items = await col.find({ _id: { $lt: lastId } }).sort({ _id: -1 }).limit(100).toArray();`,
      explanation: 'skip(N) forces MongoDB to scan and discard N documents before returning results. At page 10,000 with pageSize 100, it scans 1M documents. Cursor-based pagination uses index range scans and scales to any page number.',
    },
    {
      title: 'Not projecting when returning data to the client',
      wrong: `// Returns every field including large nested arrays and binary data
const users = await col.find({ active: true }).toArray();
res.json(users.map(u => ({ id: u._id, name: u.name, email: u.email })));`,
      right: `// Project on the server — less data over the wire
const users = await col.find(
  { active: true },
  { projection: { name: 1, email: 1, _id: 1 } }
).toArray();
res.json(users);`,
      explanation: 'Transforming after fetching still transfers the full documents over the MongoDB wire and into memory. Project on the server to only fetch what you need — reduces network I/O, memory usage, and deserialization time.',
    },
    {
      title: 'Forgetting that sort order affects index usage',
      wrong: `// Has a compound index on { category: 1, price: 1 }
// This sort reverses the order — may require an in-memory sort pass
col.find({ category: 'Electronics' }).sort({ price: -1 })`,
      right: `// Create the index matching the sort direction
col.createIndex({ category: 1, price: -1 })
col.find({ category: 'Electronics' }).sort({ price: -1 })
// Now the index is traversed in order — no extra sort step`,
      explanation: 'A compound index on { price: 1 } cannot efficiently serve a sort({ price: -1 }) without reversing the traversal (which MongoDB can do efficiently), but mixed direction compound sorts (one ASC, one DESC) may require an in-memory sort if the index doesn\'t match.',
    },
  ];

  challenge: Challenge = {
    title: 'Safe User API Response',
    language: 'typescript',
    description: 'Build a getUserPage function that returns paginated users for an admin API. Requirements: (1) Never return password, resetToken, or __v fields. (2) Use cursor-based pagination with _id as cursor. (3) Support sorting by name or createdAt. (4) Return items and nextCursor.',
    hints: [
      'Use exclusion projection for sensitive fields.',
      'Cursor-based: filter by _id > lastCursor for ascending, _id < lastCursor for descending.',
      'Fetch limit + 1 items to detect hasMore without a separate count query.',
      'The sort direction determines whether to use $gt or $lt for the cursor.',
    ],
    starterCode: `import { Collection, ObjectId } from 'mongodb';

interface User { _id: ObjectId; name: string; email: string; password: string; createdAt: Date; }

async function getUserPage(
  col: Collection<User>,
  opts: { lastCursor?: string; sortBy?: 'name' | 'createdAt'; pageSize?: number }
) {
  // TODO: implement with exclusion projection + cursor pagination
}`,
    solution: `import { Collection, ObjectId, Sort } from 'mongodb';

interface User { _id: ObjectId; name: string; email: string; password: string; createdAt: Date; }

async function getUserPage(
  col: Collection<User>,
  opts: { lastCursor?: string; sortBy?: 'name' | 'createdAt'; pageSize?: number }
) {
  const { lastCursor, sortBy = 'createdAt', pageSize = 10 } = opts;
  const filter: any = {};
  if (lastCursor) filter._id = { $gt: new ObjectId(lastCursor) };

  const sortMap: Record<string, Sort> = {
    name:      { name: 1, _id: 1 },
    createdAt: { createdAt: -1, _id: -1 },
  };
  const sort: Sort = sortMap[sortBy];

  const items = await col.find(filter, {
    projection: { password: 0, resetToken: 0, __v: 0 },
  }).sort(sort).limit(pageSize + 1).toArray();

  const hasMore = items.length > pageSize;
  if (hasMore) items.pop();

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1]?._id?.toString() ?? null : null,
  };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which projection { name: 1, password: 0 } result in MongoDB?',
      options: [
        'Returns name field; excludes password',
        'Throws an error — cannot mix inclusion and exclusion',
        'Returns all fields except password',
        'Returns only name',
      ],
      answer: 1,
      explanation: 'MongoDB projections cannot mix inclusion (1) and exclusion (0) in the same document — except for _id. Mixing throws: "Projection cannot have a mix of inclusion and exclusion". Choose one approach.',
    },
    {
      q: 'What does { comments: { $slice: -3 } } return?',
      options: [
        'The first 3 comments',
        'The last 3 comments',
        'All comments except the last 3',
        'A random sample of 3 comments',
      ],
      answer: 1,
      explanation: '$slice with a negative number returns the last N elements of the array. $slice: 3 returns the first 3; $slice: -3 returns the last 3; $slice: [skip, count] returns count elements starting at skip.',
    },
    {
      q: 'Why is cursor-based pagination preferred over skip/limit?',
      options: [
        'It doesn\'t require an index',
        'skip() forces a full scan and discard of N documents — expensive at high page numbers',
        'limit() doesn\'t work at high page numbers',
        'Cursor-based returns results in random order',
      ],
      answer: 1,
      explanation: 'skip(N) requires MongoDB to scan through N documents before returning results. At page 1,000 with pageSize 100, it scans 100,000 documents. Cursor-based pagination uses an index range scan starting at the cursor value — O(log n) regardless of page number.',
    },
    {
      q: 'How do you sort by text search relevance?',
      options: [
        'sort({ relevance: -1 })',
        'sort({ score: { $meta: "textScore" } }) with projection: { score: { $meta: "textScore" } }',
        'sort({ $text: { $search: "desc" } })',
        'sort({ _id: -1 }) — text results are automatically ranked',
      ],
      answer: 1,
      explanation: 'To sort by text search relevance: (1) include { score: { $meta: "textScore" } } in your projection, then (2) sort({ score: { $meta: "textScore" } }). Both the projection and sort must use the $meta expression.',
    },
    {
      q: 'What is the default sort order in MongoDB?',
      options: [
        'Ascending by _id',
        'Insertion order',
        'Undefined — no guaranteed order without an explicit sort',
        'Ascending by document size',
      ],
      answer: 2,
      explanation: 'MongoDB makes no guarantee about document order in find() results without an explicit sort(). The actual order depends on the storage engine\'s internal B-tree traversal. Always specify sort() when order matters.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I include computed/derived fields in a projection?',
      a: 'Not in a <code>find()</code> projection — it only supports including/excluding stored fields (and a few special operators like $slice, $elemMatch). To include computed fields, use the <code>$addFields</code> or <code>$project</code> stage in an aggregation pipeline: <code>{ $project: { fullName: { $concat: ["$firstName", " ", "$lastName"] }, price: 1 } }</code>.',
    },
    {
      q: 'How do I implement "infinity scroll" pagination?',
      a: 'Use cursor-based pagination: (1) Initial load: <code>find({}).sort({ createdAt: -1, _id: -1 }).limit(pageSize + 1)</code>. Return <code>nextCursor</code> (the last item\'s _id or a composite cursor). (2) Subsequent loads: <code>find({ _id: { $lt: new ObjectId(nextCursor) } }).sort({ createdAt: -1, _id: -1 }).limit(pageSize + 1)</code>. When <code>nextCursor</code> is null, stop fetching. This pattern works correctly even as new items are added at the top of the feed.',
    },
    {
      q: 'How do I count total documents with pagination?',
      a: 'Two options: (1) <strong>Avoid the count</strong>: return only <code>hasMore</code> (fetch N+1 to detect). This is what most modern APIs (Twitter, Instagram) do. (2) <strong>Estimate the count</strong>: <code>estimatedDocumentCount()</code> is O(1) but includes all documents. <code>countDocuments(filter)</code> runs a full index scan — expensive for large collections. Cache the count with a TTL of 30–60 seconds for non-critical accuracy.',
    },
    {
      q: 'What is the 32 MB sort memory limit?',
      a: 'MongoDB\'s in-memory sort is capped at 32 MB per query by default. If the documents being sorted exceed 32 MB, the query fails with <code>QueryExceededMemoryLimitNoDiskUseAllowed</code>. Fix: (1) Create an index matching the sort — indexed sorts don\'t use memory. (2) Project to reduce document size before sorting. (3) Enable <code>allowDiskUse: true</code> in aggregation to spill to disk (slower but no limit).',
    },
    {
      q: 'What is the positional $ projection and when is it different from $elemMatch in projection?',
      a: 'The <strong>positional $ projection</strong> returns the first array element matched by the QUERY filter: <code>find({ scores: { $gt: 80 } }, { "scores.$": 1 })</code>. The query filter identifies the element. <strong>$elemMatch projection</strong> returns the first element matching a SEPARATE condition: <code>find({}, { scores: { $elemMatch: { $gt: 80 } } })</code>. Use $ when the projection condition is the same as the query; use $elemMatch when the projection condition differs from the query or when there\'s no filter on the array.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Projections reduce payload (inclusion vs exclusion, not mixed); sorting uses indexes; cursor-based pagination scales better than skip/limit.',
    mustKnow: [
      'Cannot mix inclusion (1) and exclusion (0) — except _id: 0 alongside inclusions',
      '$slice: N (first N), -N (last N), [skip, count] (pagination within array)',
      'Positional $ returns first element matched by query; $elemMatch returns first by separate condition',
      'sort({ field: 1 }) ascending, -1 descending; compound sorts for secondary order',
      'In-memory sort capped at 32 MB — create indexes matching sort fields',
      'skip/limit O(N) at high page numbers; cursor-based O(log n) always',
    ],
    interviewFocus: [
      'Cannot mix inclusion/exclusion in projection',
      'cursor-based vs offset-based pagination (performance and consistency)',
      'Sort on indexed field vs full in-memory sort (32 MB limit)',
      '$slice for bounded array returns',
      'Why not return all fields to the client (bandwidth, security)',
    ],
  };
}
