import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';

interface CheatEntry {
  category: string;
  term: string;
  desc: string;
  example?: string;
}

@Component({
  selector: 'app-mongo-cheatsheet',
  standalone: true,
  imports: [PageMetaComponent, FormsModule],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class MongoCheatsheet {
  search = signal('');
  activeCategory = signal('All');

  readonly entries: CheatEntry[] = [
    // Connection
    { category: 'Connection', term: 'new MongoClient(uri)', desc: 'Create a client. Reuse one singleton — never create per-request.', example: 'const client = new MongoClient(process.env.MONGO_URI);' },
    { category: 'Connection', term: 'mongodb+srv://... (Atlas)', desc: 'SRV URI auto-discovers replica set members.', example: 'mongodb+srv://user:pass@cluster.mongodb.net/shop' },
    { category: 'Connection', term: 'client.db("name")', desc: 'Get a Db handle. DB is created on first write.', example: 'const db = client.db("shop");' },
    { category: 'Connection', term: 'db.collection<T>("name")', desc: 'Get a typed Collection handle for all CRUD ops.', example: 'const orders = db.collection<Order>("orders");' },

    // CRUD — Insert
    { category: 'Insert', term: 'insertOne(doc)', desc: 'Insert one document. Returns { insertedId }.', example: 'const { insertedId } = await col.insertOne({ item: "Widget", qty: 5 });' },
    { category: 'Insert', term: 'insertMany([...])', desc: 'Insert multiple documents. Returns { insertedCount, insertedIds }.', example: 'await col.insertMany([{ item: "A" }, { item: "B" }]);' },
    { category: 'Insert', term: 'upsert: true', desc: 'Insert if not found, update if found.', example: 'await col.updateOne({ email }, { $setOnInsert: { role: "user" } }, { upsert: true });' },

    // CRUD — Find
    { category: 'Find', term: 'findOne(filter)', desc: 'Return first matching doc or null.', example: 'const doc = await col.findOne({ _id: new ObjectId(id) });' },
    { category: 'Find', term: 'find(filter).toArray()', desc: 'Return all matches as an array. Small result sets only.', example: 'const docs = await col.find({ status: "active" }).toArray();' },
    { category: 'Find', term: 'for await (const doc of cursor)', desc: 'Stream results without loading all into memory.', example: 'for await (const doc of col.find({})) { await process(doc); }' },
    { category: 'Find', term: '.sort({ field: 1 | -1 })', desc: '1 = ascending, -1 = descending.', example: 'col.find({}).sort({ createdAt: -1 }).limit(20)' },
    { category: 'Find', term: '.project({ field: 1 })', desc: 'Include (1) or exclude (0) fields. Cannot mix except _id.', example: 'col.find({}).project({ _id: 0, name: 1, price: 1 })' },
    { category: 'Find', term: 'countDocuments(filter)', desc: 'Count documents matching a filter.', example: 'const n = await col.countDocuments({ status: "pending" });' },
    { category: 'Find', term: 'cursor-based pagination', desc: 'Use last _id instead of skip for scalable pages.', example: 'col.find({ _id: { $lt: lastId } }).sort({ _id: -1 }).limit(20)' },

    // CRUD — Update
    { category: 'Update', term: 'updateOne(filter, update)', desc: 'Update first matching document.', example: 'await col.updateOne({ _id: id }, { $set: { status: "shipped" } });' },
    { category: 'Update', term: 'updateMany(filter, update)', desc: 'Update all matching documents.', example: 'await col.updateMany({ status: "pending" }, { $set: { flagged: true } });' },
    { category: 'Update', term: 'findOneAndUpdate(...)', desc: 'Atomic find + update. Returns doc before or after.', example: 'const doc = await col.findOneAndUpdate(f, u, { returnDocument: "after" });' },
    { category: 'Update', term: 'replaceOne(filter, newDoc)', desc: 'Replace entire document (keeps _id).', example: 'await col.replaceOne({ _id: id }, { ...newData });' },

    // CRUD — Delete
    { category: 'Delete', term: 'deleteOne(filter)', desc: 'Delete first matching document.', example: 'const { deletedCount } = await col.deleteOne({ _id: id });' },
    { category: 'Delete', term: 'deleteMany(filter)', desc: 'Delete all matching documents.', example: 'await col.deleteMany({ status: "cancelled" });' },
    { category: 'Delete', term: 'findOneAndDelete(filter)', desc: 'Atomic find + delete. Returns deleted doc.', example: 'const item = await queue.findOneAndDelete({}, { sort: { priority: -1 } });' },

    // Query Operators
    { category: 'Query Ops', term: '$eq $ne $gt $gte $lt $lte', desc: 'Comparison operators.', example: 'find({ price: { $gte: 10, $lte: 100 } })' },
    { category: 'Query Ops', term: '$in $nin', desc: 'Match against an array of values.', example: 'find({ status: { $in: ["active", "pending"] } })' },
    { category: 'Query Ops', term: '$and $or $nor $not', desc: 'Logical operators.', example: 'find({ $or: [{ stock: { $lt: 5 } }, { status: "low" }] })' },
    { category: 'Query Ops', term: '$exists $type', desc: 'Element operators — field existence and BSON type.', example: 'find({ email: { $exists: true }, age: { $type: "int" } })' },
    { category: 'Query Ops', term: '$all $size $elemMatch', desc: 'Array operators.', example: 'find({ tags: { $all: ["a","b"] }, scores: { $elemMatch: { $gt: 90 } } })' },
    { category: 'Query Ops', term: '$regex', desc: 'Regular expression match on string fields.', example: 'find({ name: { $regex: /^mongo/i } })' },
    { category: 'Query Ops', term: '$expr', desc: 'Compare two fields in the same document.', example: 'find({ $expr: { $gt: ["$spent", "$budget"] } })' },

    // Update Operators
    { category: 'Update Ops', term: '$set $unset $rename', desc: 'Set / remove / rename fields.', example: 'updateOne(f, { $set: { name: "x" }, $unset: { old: "" }, $rename: { tmp: "perm" } })' },
    { category: 'Update Ops', term: '$inc $mul $min $max', desc: 'Numeric field operators.', example: 'updateOne(f, { $inc: { views: 1 }, $min: { score: 50 } })' },
    { category: 'Update Ops', term: '$push $pull $addToSet $pop', desc: 'Array update operators.', example: 'updateOne(f, { $push: { tags: "new" }, $pull: { tags: "old" } })' },
    { category: 'Update Ops', term: '$each $slice', desc: 'Array modifiers for $push.', example: 'updateOne(f, { $push: { tags: { $each: ["a","b"], $slice: -10 } } })' },
    { category: 'Update Ops', term: 'array.$', desc: 'Positional — update first matched array element.', example: 'updateOne({ "items.id": 1 }, { $set: { "items.$.qty": 5 } })' },
    { category: 'Update Ops', term: 'array.$[]', desc: 'All positional — update ALL array elements.', example: 'updateOne(f, { $inc: { "scores.$[]": 10 } })' },
    { category: 'Update Ops', term: 'array.$[id] + arrayFilters', desc: 'Filtered positional — update elements matching a condition.', example: 'updateOne(f, { $set: { "items.$[el].status": "sold" } }, { arrayFilters: [{ "el.qty": { $gt: 0 } }] })' },

    // Aggregation
    { category: 'Aggregation', term: '$match', desc: 'Filter documents (like find).', example: '{ $match: { status: "active", date: { $gte: start } } }' },
    { category: 'Aggregation', term: '$group', desc: 'Group and aggregate by _id.', example: '{ $group: { _id: "$category", count: { $sum: 1 }, avg: { $avg: "$price" } } }' },
    { category: 'Aggregation', term: '$project', desc: 'Include/exclude fields; compute new fields.', example: '{ $project: { name: 1, total: { $multiply: ["$price", "$qty"] } } }' },
    { category: 'Aggregation', term: '$sort $limit $skip', desc: 'Sort, paginate results.', example: '{ $sort: { date: -1 } }, { $skip: 20 }, { $limit: 10 }' },
    { category: 'Aggregation', term: '$unwind', desc: 'Flatten array — one output doc per element.', example: '{ $unwind: "$items" }' },
    { category: 'Aggregation', term: '$lookup', desc: 'Left outer join from another collection.', example: '{ $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } }' },
    { category: 'Aggregation', term: '$addFields', desc: 'Add or overwrite fields without removing others.', example: '{ $addFields: { fullName: { $concat: ["$first", " ", "$last"] } } }' },
    { category: 'Aggregation', term: '$facet', desc: 'Run multiple sub-pipelines and merge results.', example: '{ $facet: { byStatus: [{$group:{_id:"$status"}}], total: [{$count:"n"}] } }' },
    { category: 'Aggregation', term: '$setWindowFields', desc: 'Window functions (running totals, rank, lead/lag).', example: '{ $setWindowFields: { partitionBy: "$dept", sortBy: { salary: -1 }, output: { rank: { $rank: {} } } } }' },

    // Indexes
    { category: 'Indexes', term: 'createIndex({ field: 1|-1 })', desc: 'Create an ascending (1) or descending (-1) B-tree index.', example: 'await col.createIndex({ email: 1 }, { unique: true });' },
    { category: 'Indexes', term: 'Compound index', desc: 'Multi-field index. Follow ESR rule: Equality, Sort, Range.', example: 'await col.createIndex({ userId: 1, createdAt: -1 });' },
    { category: 'Indexes', term: 'Partial index', desc: 'Index only documents matching a filter — smaller and faster.', example: 'col.createIndex({ email: 1 }, { unique: true, partialFilterExpression: { email: { $exists: true } } });' },
    { category: 'Indexes', term: 'TTL index', desc: 'Auto-delete documents after a time period.', example: 'col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });' },
    { category: 'Indexes', term: 'Text index', desc: 'Full-text search on string fields (self-hosted).', example: 'col.createIndex({ title: "text", body: "text" });' },
    { category: 'Indexes', term: '.explain("executionStats")', desc: 'View query plan — check for COLLSCAN vs IXSCAN.', example: 'await col.find({ userId: id }).explain("executionStats");' },

    // Transactions
    { category: 'Transactions', term: 'session.withTransaction(fn)', desc: 'Auto retry + commit/abort. Recommended API. Requires replica set.', example: 'const s = client.startSession(); await s.withTransaction(async () => { await col.updateOne(f, u, { session: s }); }); await s.endSession();' },
    { category: 'Transactions', term: 'Pass { session } to every op', desc: 'Without session, operations run outside the transaction.', example: 'await col.insertOne(doc, { session }); await col2.updateOne(f, u, { session });' },

    // Change Streams
    { category: 'Change Streams', term: 'collection.watch([pipeline])', desc: 'Open a change stream. Requires replica set.', example: 'const stream = col.watch([], { fullDocument: "updateLookup" });' },
    { category: 'Change Streams', term: 'resumeAfter: token', desc: 'Resume stream from last processed event after restart.', example: 'col.watch([], { resumeAfter: event._id })' },
    { category: 'Change Streams', term: 'operationType', desc: 'Event field: insert | update | replace | delete | invalidate', example: 'for await (const e of stream) { if (e.operationType === "insert") { ... } }' },

    // Schema Validation
    { category: 'Validation', term: '$jsonSchema validator', desc: 'Enforce document structure at the collection level.', example: 'db.createCollection("orders", { validator: { $jsonSchema: { required: ["status"] } }, validationAction: "error" });' },
    { category: 'Validation', term: 'collMod + validator', desc: 'Add/update validator on existing collection.', example: 'await db.command({ collMod: "orders", validator: { $jsonSchema: {...} }, validationAction: "error" });' },

    // Atlas Search
    { category: 'Atlas Search', term: '$search (first stage only)', desc: 'Atlas-only full-text search via Lucene. Must be pipeline stage 1.', example: '{ $search: { index: "default", text: { query: "laptop", path: "name", fuzzy: { maxEdits: 1 } } } }' },
    { category: 'Atlas Search', term: 'compound { must, should, filter }', desc: 'Combine operators: must=required, should=boost, filter=no-score.', example: '{ $search: { compound: { must: [{ text: {...} }], filter: [{ range: { path: "price", gte: 10 } }] } } }' },
    { category: 'Atlas Search', term: 'autocomplete', desc: 'Prefix search for search-as-you-type. Needs edgeGram index mapping.', example: '{ $search: { autocomplete: { query: "headph", path: "name" } } }' },
    { category: 'Atlas Search', term: '$searchMeta + facets', desc: 'Get facet counts (by category/range) without returning documents.', example: '{ $searchMeta: { facet: { operator: {...}, facets: { cat: { type: "string", path: "category" } } } } }' },
  ];

  get categories(): string[] {
    return ['All', ...new Set(this.entries.map(e => e.category))];
  }

  readonly filtered = computed(() => {
    const q = this.search().toLowerCase();
    const cat = this.activeCategory();
    return this.entries.filter(e => {
      const matchesCat = cat === 'All' || e.category === cat;
      const matchesSearch = !q ||
        e.term.toLowerCase().includes(q) ||
        e.desc.toLowerCase().includes(q) ||
        (e.example ?? '').toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  });
}
