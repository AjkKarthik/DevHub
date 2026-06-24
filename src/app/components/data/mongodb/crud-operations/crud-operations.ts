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
  selector: 'app-mongo-crud-operations',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './crud-operations.html',
  styleUrl: './crud-operations.scss',
})
export class MongoCrudOperations {
  quickRef: QuickRefItem[] = [
    { type: 'method', name: 'insertOne(doc)',          desc: 'Insert one document. Returns { acknowledged, insertedId }.' },
    { type: 'method', name: 'insertMany(docs[])',       desc: 'Insert multiple documents. Returns { insertedCount, insertedIds }. Ordered by default.' },
    { type: 'method', name: 'findOne(filter)',          desc: 'Return first matching document or null.' },
    { type: 'method', name: 'find(filter)',             desc: 'Return a cursor over all matching documents. Call .toArray() or iterate.' },
    { type: 'method', name: 'updateOne(filter, update)', desc: 'Update first matching document. Returns { matchedCount, modifiedCount }.' },
    { type: 'method', name: 'updateMany(filter, update)', desc: 'Update all matching documents.' },
    { type: 'method', name: 'replaceOne(filter, doc)',  desc: 'Replace the entire document (except _id). Not the same as updateOne with $set.' },
    { type: 'method', name: 'deleteOne(filter)',        desc: 'Delete first matching document. Returns { deletedCount }.' },
    { type: 'method', name: 'deleteMany(filter)',       desc: 'Delete all matching documents.' },
    { type: 'method', name: 'findOneAndUpdate()',       desc: 'Atomic find + update. Returns old or new document. Use for counters and optimistic locking.' },
    { type: 'keyword', name: 'upsert: true',           desc: 'Insert if no match; update if match. Add to options: { upsert: true }.' },
    { type: 'keyword', name: 'returnDocument',         desc: 'findOneAndUpdate option: "before" returns old doc, "after" returns updated doc.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Insert Operations',
      points: [
        '<code>insertOne(document)</code> adds a single document to the collection and returns an object with <code>acknowledged: true</code> and <code>insertedId</code> (the ObjectId, or your custom _id). If the document has no _id, one is added automatically.',
        '<code>insertMany(documents[])</code> inserts multiple documents in one network round-trip. By default it is <em>ordered</em> — if one document fails (e.g., duplicate _id), remaining documents after the failure are NOT inserted. Pass <code>{ ordered: false }</code> to continue on failure and collect errors in the result.',
        'Duplicate key errors (error code 11000) occur when inserting a document that violates a unique index constraint (e.g., duplicate email). Catch these specifically: <code>if (err.code === 11000)</code>.',
        'For bulk loading large datasets, use <code>collection.bulkWrite()</code> or <code>insertMany()</code> in batches of 1,000–10,000 documents. A single insertMany can handle up to 100,000 documents but large batches increase memory usage.',
        'MongoDB does not support auto-increment integer IDs out of the box. Use ObjectId (default), UUID, or a dedicated sequence counter collection. Never use JavaScript array index as _id.',
      ],
    },
    {
      heading: 'Read Operations & Cursors',
      points: [
        '<code>findOne(filter)</code> returns the first document matching the filter, or <code>null</code> if none matches. Use for lookups by unique field. MongoDB short-circuits after the first match — no need to LIMIT 1 like SQL.',
        '<code>find(filter)</code> returns a <strong>cursor</strong> — a lazy iterator over matching documents. Data is not transferred until you iterate. Chain methods on the cursor: <code>.sort()</code>, <code>.limit()</code>, <code>.skip()</code>, <code>.project()</code>.',
        'To consume a cursor: <code>.toArray()</code> loads all results into memory (fine for small result sets); <code>for await (const doc of cursor)</code> streams documents one at a time (memory-safe for large result sets); <code>.forEach(fn)</code> applies a callback per document.',
        'Always call <code>.limit()</code> on cursors in production — an unguarded <code>find({}).toArray()</code> can pull millions of documents into memory. The MongoDB driver enforces no automatic limit.',
        'Projections control which fields are returned: <code>{ name: 1, email: 1, _id: 0 }</code> — 1 to include, 0 to exclude. You cannot mix include and exclude in one projection (except for _id which can be excluded alongside includes).',
      ],
    },
    {
      heading: 'Update Operations',
      points: [
        '<code>updateOne</code> and <code>updateMany</code> take a <em>filter</em> and an <em>update document</em>. The update document must use <strong>update operators</strong> like <code>$set</code>, <code>$inc</code>, <code>$push</code> — passing a plain object replaces the entire document (use <code>replaceOne</code> for that intent).',
        '<code>$set</code> adds or changes specific fields without affecting other fields: <code>{ $set: { name: "Bob", updatedAt: new Date() } }</code>. <code>$unset</code> removes a field: <code>{ $unset: { tempField: "" } }</code>.',
        '<code>$inc</code> atomically increments a numeric field: <code>{ $inc: { views: 1, likes: -1 } }</code>. Atomic — safe for concurrent updates without transactions. <code>$mul</code> multiplies a field.',
        'The <code>upsert: true</code> option inserts a new document if no match is found, using the filter fields as the new document\'s base. Useful for "create or update" patterns without an extra read.',
        '<code>findOneAndUpdate()</code> performs an atomic find+update and returns the document. <code>{ returnDocument: "after" }</code> returns the updated state (post-update). Essential for patterns like "get and increment a counter atomically".',
      ],
    },
    {
      heading: 'Delete Operations',
      points: [
        '<code>deleteOne(filter)</code> removes the first document matching the filter. <code>deleteMany(filter)</code> removes all matches. Both return <code>{ acknowledged: true, deletedCount: N }</code>.',
        'Always use a specific filter — <code>deleteMany({})</code> deletes every document in the collection (like SQL TRUNCATE, but logged per-document). If you want to clear the collection, <code>drop()</code> is faster.',
        'MongoDB has no <em>soft delete</em> built in. Common pattern: add <code>deletedAt: Date | null</code> field; set it instead of deleting; filter <code>{ deletedAt: null }</code> in all queries. This requires a partial index: <code>{ key: { deletedAt: 1 }, partialFilterExpression: { deletedAt: { $exists: true } } }</code>.',
        '<code>findOneAndDelete(filter)</code> atomically finds, returns, and deletes a document. Useful for implementing work queues: claim a task by atomically deleting it from the queue.',
        'Deleted documents are not gone from disk immediately — WiredTiger marks the space as free and reclaims it during compaction. For sensitive data, consider field-level encryption before deletion.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Insert',
      language: 'typescript',
      code: `const products = db.collection('products');

// insertOne
const result = await products.insertOne({
  name: 'Laptop',
  price: 999.99,
  tags: ['electronics', 'computers'],
  inStock: true,
  createdAt: new Date(),
});
console.log(result.insertedId); // ObjectId

// insertMany (ordered: false = continue past errors)
const bulkResult = await products.insertMany([
  { name: 'Mouse',    price: 29.99 },
  { name: 'Keyboard', price: 79.99 },
  { name: 'Monitor',  price: 349.99 },
], { ordered: false });
console.log(bulkResult.insertedCount); // 3

// Handle duplicate key error
try {
  await products.insertOne({ _id: 'existing-id', name: 'Dupe' });
} catch (err: any) {
  if (err.code === 11000) {
    console.log('Duplicate key — document already exists');
  } else {
    throw err;
  }
}`,
    },
    {
      label: 'Read',
      language: 'typescript',
      code: `const products = db.collection('products');

// findOne — returns document or null
const laptop = await products.findOne({ name: 'Laptop' });
console.log(laptop?.price); // 999.99

// find with filter + projection + sort + limit
const cheapItems = await products
  .find({ price: { $lt: 100 } })           // filter
  .project({ name: 1, price: 1, _id: 0 }) // fields only
  .sort({ price: 1 })                      // ascending price
  .limit(10)
  .toArray();

// Stream large results — memory-safe
const cursor = products.find({ inStock: true });
for await (const doc of cursor) {
  console.log(doc.name); // one at a time
}

// Count
const count = await products.countDocuments({ inStock: true });

// Distinct values
const allTags = await products.distinct('tags'); // ['computers', 'electronics', ...]

// Find by ObjectId
import { ObjectId } from 'mongodb';
const byId = await products.findOne({ _id: new ObjectId('...') });`,
    },
    {
      label: 'Update',
      language: 'typescript',
      code: `const products = db.collection('products');

// $set — change specific fields
await products.updateOne(
  { name: 'Laptop' },
  { $set: { price: 899.99, updatedAt: new Date() } }
);

// $inc — atomic increment
await products.updateOne(
  { name: 'Laptop' },
  { $inc: { views: 1, stock: -1 } }
);

// $push — append to array
await products.updateOne(
  { name: 'Laptop' },
  { $push: { tags: 'sale' } }
);

// updateMany
await products.updateMany(
  { inStock: false },
  { $set: { price: 0, clearance: true } }
);

// Upsert — insert if not found
await products.updateOne(
  { sku: 'LAPTOP-001' },
  { $set: { name: 'Laptop Pro', price: 1299 }, $setOnInsert: { createdAt: new Date() } },
  { upsert: true }
);

// findOneAndUpdate — atomic, returns new doc
const updated = await products.findOneAndUpdate(
  { name: 'Mouse' },
  { $inc: { stock: -1 } },
  { returnDocument: 'after' } // return updated document
);
console.log(updated?.stock); // decremented value`,
    },
    {
      label: 'Delete',
      language: 'typescript',
      code: `const products = db.collection('products');

// deleteOne — removes first match
const result = await products.deleteOne({ name: 'Old Product' });
console.log(result.deletedCount); // 1 or 0

// deleteMany
const bulkDelete = await products.deleteMany({ inStock: false, price: { $lt: 1 } });
console.log(bulkDelete.deletedCount);

// findOneAndDelete — atomic delete, returns the deleted doc
const deleted = await products.findOneAndDelete({ name: 'Keyboard' });
console.log(deleted?.name); // 'Keyboard' (or null if not found)

// Soft delete pattern
await products.updateOne(
  { _id: productId },
  { $set: { deletedAt: new Date() } }
);
// Then always query with:
const activeProducts = await products.find({ deletedAt: null }).toArray();

// DANGEROUS — deletes everything. Use with extreme care.
// await products.deleteMany({});
// Faster alternative for clearing a collection:
// await products.drop();`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Passing a plain object to updateOne instead of an update operator',
      wrong: `await products.updateOne({ name: 'Laptop' }, { price: 899 });
// This REPLACES the document with { price: 899 } — all other fields are lost!`,
      right: `await products.updateOne({ name: 'Laptop' }, { $set: { price: 899 } });
// $set modifies only the price field`,
      explanation: 'If the second argument to updateOne has no update operators (like $set), MongoDB treats it as a replacement document — overwriting the entire document with only the fields you provided. Always use $set (or other operators) to modify fields.',
    },
    {
      title: 'Using find().toArray() on an unbounded result set',
      wrong: `const allUsers = await db.collection('users').find({}).toArray();
// If there are 10 million users, this loads all into RAM`,
      right: `const cursor = db.collection('users').find({});
for await (const user of cursor) {
  // process one at a time — memory safe
}
// Or add a reasonable limit for paginated APIs:
const page = await db.collection('users').find({}).limit(50).skip(page * 50).toArray();`,
      explanation: 'find({}).toArray() loads all matching documents into memory at once. On a large collection, this causes out-of-memory crashes. Stream with for await or always apply .limit() in production code.',
    },
    {
      title: 'Not checking if findOne returned null',
      wrong: `const user = await users.findOne({ email: 'x@example.com' });
console.log(user.name); // TypeError: Cannot read property 'name' of null`,
      right: `const user = await users.findOne({ email: 'x@example.com' });
if (!user) return res.status(404).json({ error: 'User not found' });
console.log(user.name); // safe`,
      explanation: 'findOne() returns null when no document matches. TypeScript types the return as T | null — always check for null before accessing fields, or use optional chaining (user?.name) with a null-guard.',
    },
    {
      title: 'Using deleteMany({}) in production code',
      wrong: `// In a test cleanup function accidentally called in production
await db.collection('orders').deleteMany({});`,
      right: `// Use a specific filter always
await db.collection('orders').deleteMany({ status: 'test', environment: 'staging' });
// Or for clearing in tests, use a separate test database`,
      explanation: 'deleteMany({}) deletes every document in the collection with no confirmation prompt. A production code path that calls this accidentally is catastrophic. Use a specific filter or, for test cleanup, a dedicated test database that is safe to wipe.',
    },
    {
      title: 'Forgetting ordered: false on insertMany with partial failures',
      wrong: `// If document 3 has a duplicate key, documents 4-10 are silently skipped
await collection.insertMany(documents); // default: ordered: true`,
      right: `const result = await collection.insertMany(documents, { ordered: false });
// All non-failing documents insert; errors are collected
if (result.insertedCount < documents.length) {
  console.warn('Some documents failed to insert');
}`,
      explanation: 'With ordered: true (default), insertMany stops at the first error and does not insert subsequent documents. With ordered: false, MongoDB continues past errors and inserts all valid documents. Use ordered: false for bulk upsert-style loads.',
    },
  ];

  challenge: Challenge = {
    title: 'Shopping Cart CRUD',
    language: 'typescript',
    description: 'Build a shopping cart service with MongoDB. Implement: addItem(userId, item) using upsert, removeItem(userId, productId), updateQuantity(userId, productId, qty), and getCart(userId). The cart document should be: { _id: userId, items: [{ productId, name, price, qty }], updatedAt: Date }.',
    hints: [
      'Use $push to add items, $pull to remove by productId.',
      'Use findOneAndUpdate with upsert: true for addItem.',
      'Use positional $ operator to update quantity of a specific array element: { "items.$.qty": qty }.',
      'The filter for updating a specific array element: { _id: userId, "items.productId": productId }.',
    ],
    starterCode: `import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');
const db = client.db('shop');
const carts = db.collection('carts');

interface CartItem { productId: string; name: string; price: number; qty: number; }

async function addItem(userId: string, item: CartItem) {
  // TODO: upsert cart, push item
}

async function removeItem(userId: string, productId: string) {
  // TODO: $pull item from items array
}

async function updateQuantity(userId: string, productId: string, qty: number) {
  // TODO: update qty of specific item in array
}

async function getCart(userId: string) {
  // TODO: findOne by userId
}`,
    solution: `import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');
const db = client.db('shop');
const carts = db.collection('carts');

interface CartItem { productId: string; name: string; price: number; qty: number; }

async function addItem(userId: string, item: CartItem) {
  await carts.updateOne(
    { _id: userId as any },
    {
      $push: { items: item },
      $set: { updatedAt: new Date() },
    },
    { upsert: true }
  );
}

async function removeItem(userId: string, productId: string) {
  await carts.updateOne(
    { _id: userId as any },
    {
      $pull: { items: { productId } } as any,
      $set: { updatedAt: new Date() },
    }
  );
}

async function updateQuantity(userId: string, productId: string, qty: number) {
  await carts.updateOne(
    { _id: userId as any, 'items.productId': productId },
    {
      $set: { 'items.$.qty': qty, updatedAt: new Date() },
    }
  );
}

async function getCart(userId: string) {
  return carts.findOne({ _id: userId as any });
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does updateOne({ name: "X" }, { price: 100 }) do?',
      options: [
        'Sets the price field to 100 on the matching document',
        'Replaces the entire document with { price: 100 }, removing all other fields',
        'Throws an error — price is read-only',
        'Does nothing — you must use $set',
      ],
      answer: 1,
      explanation: 'Without update operators, the second argument is treated as a replacement document. The matched document is replaced with { price: 100 } — all other fields (name, _id) are lost except _id which is preserved.',
    },
    {
      q: 'What does { returnDocument: "after" } do in findOneAndUpdate?',
      options: [
        'Returns the document as it was before the update',
        'Returns the document as it looks after the update',
        'Runs the update after a 1-second delay',
        'Returns a timestamp of the update',
      ],
      answer: 1,
      explanation: 'returnDocument: "after" (formerly new: true) returns the updated version of the document. The default is "before", which returns the pre-update state.',
    },
    {
      q: 'Which update operator atomically increments a numeric field?',
      options: ['$add', '$inc', '$set', '$plus'],
      answer: 1,
      explanation: '$inc atomically increments (or decrements with negative values) a numeric field. It\'s safe for concurrent updates without transactions. $set replaces the field value entirely.',
    },
    {
      q: 'You call insertMany([docA, docB, docC]) with ordered: true and docB has a duplicate key. What happens?',
      options: [
        'All three documents are inserted; the error is ignored',
        'docA is inserted, docB fails, docC is NOT inserted',
        'docA is inserted, docB fails, docC IS inserted',
        'None of the documents are inserted (all-or-nothing)',
      ],
      answer: 1,
      explanation: 'With ordered: true (default), insertMany processes documents in order and stops at the first error. docA succeeds, docB fails, and docC is skipped. Use ordered: false to continue past errors.',
    },
    {
      q: 'What is the safest way to stream a large collection without running out of memory?',
      options: [
        'find({}).toArray() in a try/catch',
        'find({}).limit(Number.MAX_SAFE_INTEGER).toArray()',
        'for await (const doc of collection.find({})) { ... }',
        'find({}).batchSize(1).toArray()',
      ],
      answer: 2,
      explanation: 'Async iteration with for await streams documents from the cursor one batch at a time, keeping only the current batch in memory. toArray() loads everything into memory at once regardless of collection size.',
    },
    {
      q: 'Which method performs an atomic "find and delete" operation?',
      options: ['deleteAndFind()', 'findOneAndDelete()', 'findAndRemove()', 'atomicDelete()'],
      answer: 1,
      explanation: 'findOneAndDelete() atomically finds a document, removes it, and returns the deleted document. Useful for work queue patterns where you need to claim and process a task without race conditions.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between updateOne with $set and replaceOne?',
      a: '<code>updateOne</code> with <code>$set</code> modifies only the specified fields — all other fields remain unchanged. <code>replaceOne</code> replaces the entire document with the new document you provide (preserving only <code>_id</code>). Use <code>$set</code> when updating one or a few fields in an existing document. Use <code>replaceOne</code> when you want to store a completely new version of the document (e.g., after receiving a full payload from an API).',
    },
    {
      q: 'How do I do a "create or update" (upsert) in MongoDB?',
      a: 'Pass <code>{ upsert: true }</code> in the options to <code>updateOne</code>: if no document matches the filter, MongoDB creates a new document using the filter fields plus the update operations. Use <code>$setOnInsert</code> to set fields only when the document is being created (like <code>createdAt</code>): <code>{ $set: { name: "Alice" }, $setOnInsert: { createdAt: new Date() } }</code>. This avoids overwriting <code>createdAt</code> on subsequent updates.',
    },
    {
      q: 'Does MongoDB guarantee atomic writes for insertOne/updateOne?',
      a: 'Yes — single-document operations are <strong>atomic</strong> in MongoDB. <code>insertOne</code>, <code>updateOne</code>, <code>replaceOne</code>, <code>deleteOne</code>, and <code>findOneAndUpdate</code> are all atomic at the document level. No other operation can observe a partially completed single-document write. For atomicity <em>across multiple documents</em>, you need a multi-document transaction (MongoDB 4.0+).',
    },
    {
      q: 'How do I paginate results in MongoDB?',
      a: 'Two approaches: <strong>Skip/limit</strong> (simple but slow on large offsets): <code>.skip(page * pageSize).limit(pageSize)</code>. Expensive because MongoDB must scan and discard <code>skip</code> documents. <strong>Cursor-based pagination</strong> (production preferred): use the last document\'s <code>_id</code> or a sortable field as a cursor: <code>{ _id: { $gt: lastSeenId } }.limit(pageSize).sort({ _id: 1 })</code>. This uses index range scans and scales to millions of pages.',
    },
    {
      q: 'Can I insert a document with a custom _id instead of ObjectId?',
      a: 'Yes. Any unique value can be the _id: a string, number, UUID, or even an embedded object. Just include it in the document: <code>{ _id: "user-123", name: "Alice" }</code>. MongoDB will enforce uniqueness. Choose a custom _id when: you already have a natural unique key (email, product SKU), you want human-readable IDs, or you need a deterministic ID before the insert (e.g., for idempotent inserts). Avoid sequential integers — they create write contention in sharded clusters.',
    },
    {
      q: 'What is bulkWrite and when should I use it?',
      a: '<code>bulkWrite(operations[])</code> sends multiple CRUD operations to MongoDB in a single network round-trip. Operations can mix: <code>insertOne</code>, <code>updateOne</code>, <code>updateMany</code>, <code>deleteOne</code>, <code>deleteMany</code>, <code>replaceOne</code>. Use it for batch processing where you need to perform many different operations efficiently — e.g., syncing a CSV of product updates. For large imports of only inserts, <code>insertMany</code> is slightly simpler.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'MongoDB CRUD: insertOne/Many, findOne/find, updateOne/Many (with operators like $set/$inc), deleteOne/Many — all atomic at the document level.',
    mustKnow: [
      'insertOne returns { insertedId }; insertMany with ordered:false continues past errors',
      'find() returns a cursor — call .toArray() or iterate; always .limit() unbounded finds',
      'updateOne second arg MUST use operators ($set, $inc) — bare object = replacement',
      '$inc is atomic — safe for counters without transactions',
      'upsert: true creates document if filter matches nothing',
      'findOneAndUpdate with returnDocument:"after" returns the updated document atomically',
      'deleteMany({}) deletes everything — always use a specific filter',
    ],
    interviewFocus: [
      '$set vs replaceOne (field-level update vs full document replacement)',
      'Atomic guarantees for single-document operations',
      'Cursor streaming vs toArray() for large result sets',
      'Upsert with $setOnInsert for createdAt field',
      'findOneAndUpdate for work queue / counter patterns',
    ],
  };
}
