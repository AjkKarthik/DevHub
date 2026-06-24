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
  selector: 'app-mongo-query-operators',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './query-operators.html',
  styleUrl: './query-operators.scss',
})
export class MongoQueryOperators {
  quickRef: QuickRefItem[] = [
    { type: 'operator', name: '$eq / $ne',    desc: 'Equal / not equal. $eq is implicit: { age: 25 } = { age: { $eq: 25 } }.' },
    { type: 'operator', name: '$gt / $gte',   desc: 'Greater than / greater than or equal.' },
    { type: 'operator', name: '$lt / $lte',   desc: 'Less than / less than or equal.' },
    { type: 'operator', name: '$in',          desc: 'Match any value in array: { status: { $in: ["active","trial"] } }.' },
    { type: 'operator', name: '$nin',         desc: 'Not in array — inverse of $in.' },
    { type: 'operator', name: '$and',         desc: 'All conditions must be true. Implicit when multiple fields are specified.' },
    { type: 'operator', name: '$or',          desc: 'At least one condition must be true.' },
    { type: 'operator', name: '$nor',         desc: 'None of the conditions must be true (NOT OR).' },
    { type: 'operator', name: '$not',         desc: 'Inverts a single field operator: { age: { $not: { $gt: 18 } } }.' },
    { type: 'operator', name: '$exists',      desc: 'Match documents where a field exists (true) or is missing (false).' },
    { type: 'operator', name: '$type',        desc: 'Match by BSON type: { field: { $type: "string" } } or type number.' },
    { type: 'operator', name: '$regex',       desc: 'Regular expression match: { name: { $regex: /^alice/i } }.' },
    { type: 'operator', name: '$text',        desc: 'Full-text search (requires text index): { $text: { $search: "mongodb" } }.' },
    { type: 'operator', name: '$where',       desc: 'JavaScript expression — AVOID: slow, bypasses indexes, security risk.' },
    { type: 'operator', name: '$expr',        desc: 'Compare fields within a document: { $expr: { $gt: ["$revenue", "$cost"] } }.' },
    { type: 'operator', name: '$size',        desc: 'Match array by exact element count: { tags: { $size: 3 } }.' },
    { type: 'operator', name: '$elemMatch',   desc: 'Match documents where at least one array element matches ALL conditions.' },
    { type: 'operator', name: '$mod',         desc: 'Modulo: { qty: { $mod: [4, 0] } } matches qty divisible by 4.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Comparison Operators',
      points: [
        'Equality is implicit: <code>{ age: 25 }</code> is shorthand for <code>{ age: { $eq: 25 } }</code>. Use the explicit <code>$eq</code> form in <code>$expr</code> context or when building queries programmatically.',
        'Range queries: <code>{ price: { $gte: 10, $lte: 50 } }</code> matches documents where price is between 10 and 50 inclusive. MongoDB evaluates both conditions against the same field.',
        '<code>$in</code> is highly optimised when the field has an index — MongoDB performs a multi-key lookup in one pass: <code>{ status: { $in: ["active", "trial", "premium"] } }</code>. Prefer $in over multiple $or conditions on the same field.',
        '<code>$ne</code> (not equal) often requires a full collection scan because "not equal to X" is satisfied by almost all documents — MongoDB cannot use a standard B-tree index efficiently. Consider restructuring queries to avoid $ne on large collections.',
        'BSON type comparison order: null < numbers < symbol < string < object < array < binary < ObjectId < boolean < Date < timestamp < regular expression. This matters for range queries on mixed-type fields.',
      ],
    },
    {
      heading: 'Logical Operators',
      points: [
        'Implicit <code>$and</code>: specifying multiple fields in a filter is automatically AND: <code>{ age: { $gte: 18 }, country: "UK" }</code>. Use explicit <code>$and</code> only when you need multiple conditions on the SAME field that can\'t be combined: <code>{ $and: [{ price: { $gt: 10 } }, { price: { $lt: 50 } }] }</code>.',
        '<code>$or</code> evaluates each condition independently. Performance tip: if any branch can use an index, MongoDB will use it. Place the most selective condition first in the $or array for better cache locality.',
        '<code>$nor</code> is the negation of $or — returns documents that match NONE of the conditions. Rarely used but useful for exclusion lists: <code>{ $nor: [{ status: "banned" }, { age: { $lt: 18 } }] }</code>.',
        '<code>$not</code> negates a single field expression: <code>{ price: { $not: { $gt: 100 } } }</code>. Note that <code>$not</code> also matches documents where the field does not exist (since "not greater than 100" includes "field missing"). Add <code>$exists: true</code> if you only want documents with the field.',
        'Nesting logical operators: <code>{ $or: [{ $and: [cond1, cond2] }, cond3] }</code>. Complex logical trees indicate the query may benefit from restructuring the schema or using aggregation.',
      ],
    },
    {
      heading: 'Element & Evaluation Operators',
      points: [
        '<code>$exists: true</code> matches documents where the field is present (even if null). <code>$exists: false</code> matches documents where the field is absent. Use to find documents with missing optional fields: <code>{ profilePic: { $exists: false } }</code>.',
        '<code>$type</code> matches by BSON type. Common type names: "string", "int", "long", "double", "decimal", "bool", "date", "null", "objectId", "array", "object", "binData". Useful for finding documents with incorrect field types during data quality checks.',
        '<code>$regex</code> matches strings with a regex pattern. Case-insensitive with <code>i</code> flag. <strong>Caution</strong>: anchored patterns (<code>^prefix</code>) can use an index; unanchored patterns cause full collection scans. For full-text search, use a text index + $text instead.',
        '<code>$expr</code> enables aggregation expressions in match queries. Use it to compare two fields within the same document: <code>{ $expr: { $gt: ["$endDate", "$startDate"] } }</code>. Also useful for comparing a field to a computed value.',
        '<code>$where</code>: NEVER use in production. It executes arbitrary JavaScript on the server, bypasses all indexes, and is a security risk (MongoDB injection). Use $expr with aggregation operators instead.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Comparison',
      language: 'typescript',
      code: `const products = db.collection('products');

// Range query
const midRange = await products.find({ price: { $gte: 10, $lte: 100 } }).toArray();

// $in — match any of
const filtered = await products.find({
  status: { $in: ['active', 'featured'] },
  category: { $nin: ['discontinued', 'archived'] },
}).toArray();

// Nested field comparison (dot notation)
const londonUsers = await db.collection('users').find({
  'address.city': 'London',
  'address.country': 'UK',
}).toArray();

// Null handling — matches both null AND missing field
const noImage = await products.find({ image: null }).toArray();

// Match ONLY null (not missing)
const explicitNull = await products.find({
  image: { $exists: true, $eq: null }
}).toArray();

// Match ONLY missing field
const missingField = await products.find({ image: { $exists: false } }).toArray();`,
    },
    {
      label: 'Logical',
      language: 'typescript',
      code: `// Implicit AND (multiple fields)
const result1 = await col.find({ age: { $gte: 18 }, country: 'UK' }).toArray();

// Explicit $and — needed when two conditions target the SAME field differently
const result2 = await col.find({
  $and: [
    { name: { $regex: /^A/, $options: 'i' } },
    { name: { $ne: 'Admin' } },
  ],
}).toArray();

// $or — at least one condition true
const result3 = await col.find({
  $or: [
    { role: 'admin' },
    { permissions: { $in: ['edit', 'delete'] } },
  ],
}).toArray();

// $nor — none of the conditions true
const notBannedOrExpired = await col.find({
  $nor: [{ status: 'banned' }, { expiresAt: { $lt: new Date() } }],
}).toArray();

// $not — negate a condition
const notExpensive = await col.find({ price: { $not: { $gt: 500 } } }).toArray();

// Complex: ($or within $and)
const complex = await col.find({
  active: true,
  $or: [{ premium: true }, { credits: { $gt: 100 } }],
}).toArray();`,
    },
    {
      label: 'Evaluation & Regex',
      language: 'typescript',
      code: `// $regex — pattern matching (prefix anchored = uses index)
const names = await col.find({ name: { $regex: /^alice/i } }).toArray();
// Or string form:
const names2 = await col.find({ name: { $regex: '^alice', $options: 'i' } }).toArray();

// $text — full-text search (requires text index)
// First: db.collection('articles').createIndex({ title: 'text', body: 'text' })
const articles = await col.find({
  $text: { $search: 'mongodb aggregation' }
}, {
  score: { $meta: 'textScore' }   // include relevance score
}).sort({ score: { $meta: 'textScore' } }).toArray();

// $exists
const withPhone = await col.find({ phone: { $exists: true } }).toArray();
const withoutPhoto = await col.find({ photo: { $exists: false } }).toArray();

// $type — find fields with wrong type
const stringPrices = await col.find({ price: { $type: 'string' } }).toArray();

// $expr — compare fields within same document
const profitable = await col.find({
  $expr: { $gt: ['$revenue', '$cost'] }
}).toArray();

// $mod — divisibility
const evenQty = await col.find({ qty: { $mod: [2, 0] } }).toArray();

// $size — array has exact count
const exactlyThreeTags = await col.find({ tags: { $size: 3 } }).toArray();`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using $or for multiple values on the same field instead of $in',
      wrong: `// Verbose and potentially slower — each $or branch scanned separately
col.find({ $or: [{ status: 'active' }, { status: 'trial' }, { status: 'premium' }] })`,
      right: `// $in is optimised — single index scan with multiple lookup keys
col.find({ status: { $in: ['active', 'trial', 'premium'] } })`,
      explanation: '$in performs a multi-key index lookup in a single scan. Multiple $or conditions on the same field may result in separate index scans. Always use $in for matching any of a list of values on one field.',
    },
    {
      title: 'Expecting $not on a missing field to behave like $ne',
      wrong: `// Looking for documents where age is NOT greater than 18
// But { $not: { $gt: 18 } } also matches documents where age field is MISSING
col.find({ age: { $not: { $gt: 18 } } })`,
      right: `// Add $exists: true to exclude documents where age is missing
col.find({ age: { $exists: true, $not: { $gt: 18 } } })
// Or use $lte which doesn't match missing:
col.find({ age: { $lte: 18 } })`,
      explanation: '$not inverts the operator, which also causes it to match documents where the field doesn\'t exist (absence satisfies "not greater than"). $lt/$lte/$gt/$gte do NOT match missing fields, so they\'re often cleaner.',
    },
    {
      title: 'Using $where for field-to-field comparisons',
      wrong: `// Slow (full scan), no index use, JS execution overhead, security risk
col.find({ $where: 'this.endDate > this.startDate' })`,
      right: `// $expr with aggregation operators — fast, can use indexes, safe
col.find({ $expr: { $gt: ['$endDate', '$startDate'] } })`,
      explanation: '$where runs JavaScript on the server, bypasses indexes, and is a security risk (injection attacks). Use $expr with aggregation operators for field-to-field comparisons. $expr can leverage compound indexes.',
    },
    {
      title: 'Unanchored $regex causing full collection scans',
      wrong: `// /mongodb/ has no prefix anchor — scans every document
col.find({ name: { $regex: /mongodb/ } })`,
      right: `// Anchored with ^ — can use an index prefix scan
col.find({ name: { $regex: /^mongodb/i } })
// For full-text search, use a text index:
// createIndex({ description: 'text' })
// col.find({ $text: { $search: 'mongodb' } })`,
      explanation: 'Regex patterns without a start anchor (^) cannot use a B-tree index and require scanning every document. Anchored patterns (^prefix) use index prefix scanning efficiently. For contains/anywhere matching, use a text index instead.',
    },
    {
      title: 'Confusing implicit AND with explicit $and',
      wrong: `// Both conditions on "name" — only the LAST one applies!
// JavaScript object keys are unique — second "name" overwrites first
col.find({ name: { $gt: 'A' }, name: { $lt: 'Z' } })`,
      right: `// Use explicit $and when two conditions target the same field:
col.find({ $and: [{ name: { $gt: 'A' } }, { name: { $lt: 'Z' } }] })
// Or combine in one expression when possible:
col.find({ name: { $gt: 'A', $lt: 'Z' } })`,
      explanation: 'JavaScript object literals cannot have duplicate keys — the second { name: ... } silently overwrites the first. When you need two separate conditions on the same field, use explicit $and or combine them in a single object expression.',
    },
  ];

  challenge: Challenge = {
    title: 'Product Search Filter',
    language: 'typescript',
    description: 'Build a product search function that accepts: minPrice, maxPrice (optional range), categories (string[] — $in), searchTerm (string — regex prefix match), inStockOnly (boolean), and sortBy ("price" | "name" | "newest"). Build the filter object dynamically based on which parameters are provided.',
    hints: [
      'Build the filter object incrementally — only add each condition if the parameter is provided.',
      'For searchTerm, use $regex with ^ prefix anchor and i flag for case-insensitive.',
      'sortBy "newest" maps to { createdAt: -1 }.',
      'inStockOnly: true → add { stock: { $gt: 0 } } to the filter.',
    ],
    starterCode: `import { Collection, Filter, Sort } from 'mongodb';

interface Product { name: string; price: number; category: string; stock: number; createdAt: Date; }

interface SearchOptions {
  minPrice?: number;
  maxPrice?: number;
  categories?: string[];
  searchTerm?: string;
  inStockOnly?: boolean;
  sortBy?: 'price' | 'name' | 'newest';
}

async function searchProducts(col: Collection<Product>, opts: SearchOptions) {
  // TODO: build filter and sort dynamically
  const filter: Filter<Product> = {};
  const sort: Sort = {};

  // apply opts...

  return col.find(filter).sort(sort).limit(50).toArray();
}`,
    solution: `import { Collection, Filter, Sort } from 'mongodb';

interface Product { name: string; price: number; category: string; stock: number; createdAt: Date; }

interface SearchOptions {
  minPrice?: number;
  maxPrice?: number;
  categories?: string[];
  searchTerm?: string;
  inStockOnly?: boolean;
  sortBy?: 'price' | 'name' | 'newest';
}

async function searchProducts(col: Collection<Product>, opts: SearchOptions) {
  const filter: Filter<Product> = {};

  if (opts.minPrice !== undefined || opts.maxPrice !== undefined) {
    filter.price = {};
    if (opts.minPrice !== undefined) (filter.price as any).$gte = opts.minPrice;
    if (opts.maxPrice !== undefined) (filter.price as any).$lte = opts.maxPrice;
  }
  if (opts.categories?.length) filter.category = { $in: opts.categories } as any;
  if (opts.searchTerm) filter.name = { $regex: new RegExp('^' + opts.searchTerm, 'i') } as any;
  if (opts.inStockOnly) filter.stock = { $gt: 0 } as any;

  const sortMap: Record<string, Sort> = {
    price:   { price: 1 },
    name:    { name: 1 },
    newest:  { createdAt: -1 },
  };
  const sort: Sort = sortMap[opts.sortBy ?? 'newest'] ?? { createdAt: -1 };

  return col.find(filter).sort(sort).limit(50).toArray();
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which operator should you prefer over multiple $or conditions on the same field?',
      options: ['$and', '$in', '$eq', '$regex'],
      answer: 1,
      explanation: '$in performs a multi-key index lookup efficiently. Multiple $or conditions on the same field may result in separate scans. Use $in: { status: { $in: ["a","b","c"] } } instead of $or: [{status:"a"},{status:"b"},{status:"c"}].',
    },
    {
      q: 'Which query matches documents where the "phone" field is absent from the document?',
      options: [
        '{ phone: null }',
        '{ phone: { $exists: false } }',
        '{ phone: { $eq: undefined } }',
        '{ phone: { $type: "null" } }',
      ],
      answer: 1,
      explanation: '{ phone: { $exists: false } } matches only documents where the "phone" field is completely absent. { phone: null } matches both null AND missing fields.',
    },
    {
      q: 'What does { $expr: { $gt: ["$revenue", "$cost"] } } do?',
      options: [
        'Compares the literal strings "$revenue" and "$cost"',
        'Compares the values of the revenue and cost fields within the same document',
        'Requires revenue and cost to be array fields',
        'Is invalid — $expr cannot use $gt',
      ],
      answer: 1,
      explanation: '$expr allows aggregation expressions in query filters. "$revenue" and "$cost" (with $ prefix inside $expr) reference field values within each document. This finds documents where revenue > cost.',
    },
    {
      q: 'Why should you avoid $where in production?',
      options: [
        'It only works with string values',
        'It runs JavaScript on the server — bypasses indexes, slow, security risk',
        'It was removed in MongoDB 5.0',
        'It requires a special license',
      ],
      answer: 1,
      explanation: '$where executes arbitrary JavaScript on the server, cannot use indexes (causing full collection scans), introduces JavaScript execution overhead, and is vulnerable to injection attacks. Use $expr with aggregation operators instead.',
    },
    {
      q: 'What does { tags: { $size: 3 } } match?',
      options: [
        'Documents where the tags array has at least 3 elements',
        'Documents where the tags array has exactly 3 elements',
        'Documents where the tags field is a string of length 3',
        'The first 3 elements of the tags array',
      ],
      answer: 1,
      explanation: '$size matches arrays with an exact element count. It cannot be combined with range operators — to match "at least 3 elements", use a workaround like { "tags.2": { $exists: true } } (checks if index 2 exists).',
    },
    {
      q: 'Which regex pattern can efficiently use a MongoDB index?',
      options: ['/mongodb/', '/.+mongodb/', '/^mongodb/i', '/mongodb$/'],
      answer: 2,
      explanation: 'Patterns anchored with ^ (start of string) can use an index prefix scan, similar to SQL LIKE \'prefix%\'. Unanchored patterns (/mongodb/, /.+mongodb/) require a full collection scan. The $ end anchor also cannot use an index.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between $or and multiple fields in an implicit $and?',
      a: 'Implicit <code>$and</code> (multiple fields in a filter object) requires ALL conditions to be true — equivalent to SQL\'s AND. <code>$or</code> requires at least ONE condition to be true — equivalent to SQL\'s OR. Example: <code>{ age: 18, country: "UK" }</code> finds adults in UK (AND); <code>{ $or: [{ age: { $gte: 18 } }, { guardian: { $exists: true } }] }</code> finds anyone who is adult OR has a guardian (OR).',
    },
    {
      q: 'How do I query documents where a field value is within the last 7 days?',
      a: 'Use a date range query: <code>const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); collection.find({ createdAt: { $gte: sevenDaysAgo } })</code>. This works because MongoDB dates are stored as UTC milliseconds and $gte performs numeric comparison. Ensure <code>createdAt</code> is stored as a <code>Date</code> object (not a string) for this to work correctly.',
    },
    {
      q: 'Can I use $in with an empty array?',
      a: 'Yes, but <code>{ field: { $in: [] } }</code> matches ZERO documents — an empty $in is a contradiction (the field can\'t equal any value in an empty set). This is correct and safe; it doesn\'t throw an error. Useful when building dynamic filters: if the $in array is empty, the filter returns no results instead of all results. Always validate that your $in array is non-empty before querying if you expect results.',
    },
    {
      q: 'What is the $elemMatch query operator and when do I need it?',
      a: '<code>$elemMatch</code> matches documents where at least one array element satisfies ALL the specified conditions simultaneously. Without $elemMatch, a query like <code>{ scores: { $gt: 80, $lt: 100 } }</code> matches documents where one score is > 80 AND a (possibly different) score is < 100. With <code>{ scores: { $elemMatch: { $gt: 80, $lt: 100 } } }</code>, it matches only if a single score element satisfies both conditions. Always use $elemMatch when applying multiple conditions to the same array element.',
    },
    {
      q: 'How does $text search work and when should I use it?',
      a: '<code>$text</code> performs full-text search using a text index. Create one with: <code>createIndex({ title: "text", content: "text" })</code>. Query with: <code>{ $text: { $search: "word1 word2" } }</code> — matches documents containing any of the words. Phrase search: <code>"exact phrase"</code>. Negate a term: <code>-unwanted</code>. Use $text for: blog search, product search, article search. For more advanced search (faceted search, autocomplete, fuzzy matching), use Atlas Search (Lucene-based) instead.',
    },
    {
      q: 'What is the difference between $elemMatch in queries vs projections?',
      a: 'In <strong>queries</strong>, <code>$elemMatch</code> filters documents — a document is included in results only if at least one array element matches all conditions. In <strong>projections</strong>, <code>$elemMatch</code> filters which array elements are returned — the document is still returned, but only the first matching array element is included. Example: <code>find({}, { scores: { $elemMatch: { $gt: 90 } } })</code> returns all documents but only includes scores > 90 in each document\'s scores array.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'MongoDB query operators filter documents: comparison ($gt/$in), logical ($or/$and), element ($exists/$type), and evaluation ($regex/$expr).',
    mustKnow: [
      'Implicit AND (multiple fields); use explicit $and for two conditions on the same field',
      '$in over $or for multiple values on one field (faster index scan)',
      '$exists: false matches missing fields; { field: null } matches null AND missing',
      '$not also matches missing fields — pair with $exists when needed',
      '$regex with ^ prefix uses index; unanchored regex = full scan',
      '$expr for field-to-field comparisons; $where = never use',
      '$elemMatch for multi-condition array element matching',
    ],
    interviewFocus: [
      '$in vs multiple $or conditions (performance — single index scan)',
      'null vs $exists: false (null matches missing; $exists: false matches only absent)',
      '$expr for field-field comparisons (instead of $where)',
      'When to use $elemMatch in queries vs projections',
      '$regex anchor (^) for index use; $text for full-text search',
    ],
  };
}
