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
  selector: 'app-mongo-fundamentals',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './fundamentals.html',
  styleUrl: './fundamentals.scss',
})
export class MongoFundamentals {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: 'Document',     desc: 'JSON-like record stored in a collection; MongoDB\'s unit of data (analogous to a row).' },
    { type: 'keyword', name: 'Collection',   desc: 'Group of documents (analogous to a table); schema-flexible by default.' },
    { type: 'keyword', name: 'Database',     desc: 'Container for collections; one MongoDB server hosts many databases.' },
    { type: 'keyword', name: 'BSON',         desc: 'Binary JSON — MongoDB\'s wire format; supports extra types: Date, ObjectId, Binary, Decimal128.' },
    { type: 'keyword', name: 'ObjectId',     desc: '12-byte unique identifier auto-generated for _id; encodes timestamp, machine, and counter.' },
    { type: 'keyword', name: '_id',          desc: 'Required primary key field on every document; immutable once set; auto-assigned as ObjectId.' },
    { type: 'keyword', name: 'Atlas',        desc: 'MongoDB\'s managed cloud offering on AWS/Azure/GCP; includes free M0 tier for development.' },
    { type: 'keyword', name: 'mongosh',      desc: 'MongoDB Shell — the modern REPL for interacting with MongoDB; replaces legacy mongo.' },
    { type: 'keyword', name: 'Compass',      desc: 'MongoDB\'s GUI tool for exploring data, running queries, and visualising aggregations.' },
    { type: 'keyword', name: 'Replica Set',  desc: 'A group of mongod instances that maintain the same data; provides high availability.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Document Model vs Relational',
      points: [
        'MongoDB stores data as <code>BSON documents</code> — self-describing, hierarchical structures that map naturally to objects in code. A relational row is flat; a MongoDB document can embed arrays and nested sub-documents in a single record.',
        'There is <strong>no fixed schema</strong> at the database level. Different documents in the same collection can have different fields. This enables rapid iteration but requires schema discipline at the application layer.',
        'The document model eliminates most JOIN operations by embedding related data inside one document. A blog post can embed its comments array instead of maintaining a separate comments table with foreign keys.',
        'When to consider relational instead: when data relationships are genuinely many-to-many with unbounded growth on both sides, when strong ACID guarantees across many entities are critical, or when your team already has deep SQL expertise.',
        'MongoDB is not "schema-less by default" in practice — production systems use Mongoose schemas, JSON Schema validation, or application-layer validation to enforce data contracts.',
      ],
    },
    {
      heading: 'BSON Data Types',
      points: [
        '<code>String</code> — UTF-8 encoded. <code>Number</code> — Int32, Int64, Double, or Decimal128 (use Decimal128 for financial data to avoid floating-point errors). <code>Boolean</code> — true/false.',
        '<code>Date</code> — stored as milliseconds since Unix epoch (UTC). Always store dates as Date objects, never as strings, so range queries and date arithmetic work correctly.',
        '<code>ObjectId</code> — 12 bytes: 4-byte timestamp, 5-byte random value, 3-byte incrementing counter. Sortable by insertion order and encodes creation time (extractable with <code>objectId.getTimestamp()</code>).',
        '<code>Array</code> — ordered list of values of any type. Arrays are first-class in MongoDB; you can index and query individual array elements without unwinding.',
        '<code>Embedded Document (Object)</code> — nested BSON document. Queried with dot notation: <code>{ "address.city": "London" }</code>. <code>Binary</code> — raw bytes for images, PDFs; avoid storing large blobs (use GridFS or S3 instead).',
        '<code>Null</code>, <code>Undefined</code> (deprecated — use null), <code>RegExp</code>, <code>Timestamp</code> (internal replication use), <code>Symbol</code> (deprecated). Understanding types matters because MongoDB\'s <code>$type</code> operator filters by BSON type code.',
      ],
    },
    {
      heading: 'MongoDB Architecture',
      points: [
        'A <strong>mongod</strong> process is the primary daemon. It manages data files, handles connections, executes queries, and manages the storage engine. The default storage engine since MongoDB 3.2 is <strong>WiredTiger</strong>, which provides document-level concurrency and compression.',
        '<strong>Replica sets</strong> consist of one primary node and one or more secondary nodes. All writes go to the primary; secondaries replicate asynchronously. If the primary fails, secondaries elect a new primary automatically within ~10 seconds.',
        '<strong>Sharding</strong> enables horizontal scaling by distributing data across shards based on a shard key. Each shard is itself a replica set. A <strong>mongos</strong> router sits in front and routes queries to the correct shard(s).',
        'MongoDB Atlas handles replica set setup, automated backups, monitoring, and upgrades. For local development, a single mongod instance suffices. For production, always use a replica set (even if just one node) because transactions require a replica set.',
        'The <strong>WiredTiger cache</strong> defaults to 50% of RAM minus 1 GB. Working set (hot data) must fit in cache for good performance. Use <code>db.serverStatus().wiredTiger.cache</code> to monitor cache hit rates.',
      ],
    },
    {
      heading: 'MongoDB vs SQL Terminology',
      points: [
        'SQL <strong>Table</strong> → MongoDB <strong>Collection</strong>. SQL <strong>Row</strong> → MongoDB <strong>Document</strong>. SQL <strong>Column</strong> → MongoDB <strong>Field</strong>. SQL <strong>Primary Key</strong> → MongoDB <strong>_id</strong>.',
        'SQL <strong>JOIN</strong> → MongoDB <strong>$lookup</strong> (aggregation) or embedding. SQL <strong>Index</strong> → MongoDB <strong>Index</strong>. SQL <strong>Transaction</strong> → MongoDB <strong>Multi-document Transaction</strong> (since MongoDB 4.0).',
        'SQL <strong>Schema Migration</strong> → MongoDB uses a schema versioning pattern or application-side migration; no ALTER TABLE equivalent is needed because the schema is document-level.',
        'SQL <strong>View</strong> → MongoDB <strong>View</strong> (created with <code>db.createView()</code>) or <strong>$lookup</strong> pipeline alias. SQL <strong>Stored Procedure</strong> → MongoDB Atlas Functions or application-layer logic (no stored procedures in classic MongoDB).',
        'The mapping is conceptual, not exact. MongoDB encourages denormalisation for read performance; SQL encourages normalisation to reduce redundancy. Neither is universally better — choose based on query patterns.',
      ],
    },
    {
      heading: 'Atlas Free Tier & Compass',
      points: [
        'MongoDB Atlas M0 cluster is <strong>permanently free</strong> — 512 MB storage, shared CPU/RAM, available on AWS, Azure, and GCP. Perfect for development, prototyping, and small applications.',
        'Connecting to Atlas: create a cluster → add a database user → whitelist your IP → copy the connection string (e.g. <code>mongodb+srv://user:pass@cluster.mongodb.net/mydb</code>). The <code>+srv</code> format uses DNS SRV records for automatic failover.',
        'MongoDB Compass is a free GUI: browse collections, build queries visually, create indexes, run aggregation pipelines with explain, and monitor real-time server stats. Essential for development and debugging.',
        'Atlas also includes: built-in monitoring dashboards, automated backups (paid tiers), Atlas Search (full-text), Atlas Vector Search, Data API, GraphQL API, Charts, and Atlas Device Sync for mobile.',
        'Use Atlas for cloud deployments. For local development, install MongoDB Community Edition or use the <code>mongodb/mongodb-community</code> Docker image. Always pin the MongoDB driver version to match your server version.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'First Steps',
      language: 'typescript',
      code: `// Install MongoDB driver for Node.js
// npm install mongodb

import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017';
// Atlas: 'mongodb+srv://user:pass@cluster.mongodb.net'

const client = new MongoClient(uri);

async function main() {
  await client.connect();

  // Get reference to database (created lazily on first write)
  const db = client.db('devhub');

  // Get reference to collection (created lazily on first write)
  const users = db.collection('users');

  // Insert a document
  const result = await users.insertOne({
    name: 'Alice',
    email: 'alice@example.com',
    role: 'admin',
    createdAt: new Date(),
    scores: [95, 87, 92],           // array field
    address: {                       // embedded document
      city: 'London',
      country: 'UK'
    }
  });
  console.log('Inserted _id:', result.insertedId); // ObjectId

  // Find the document back
  const user = await users.findOne({ email: 'alice@example.com' });
  console.log(user?.name);          // 'Alice'
  console.log(user?.address?.city); // 'London' — dot notation in code

  await client.close();
}

main();`,
    },
    {
      label: 'BSON Types',
      language: 'typescript',
      code: `import { MongoClient, ObjectId, Decimal128 } from 'mongodb';

// BSON type examples
const document = {
  _id:       new ObjectId(),                  // auto-generated if omitted
  name:      'Product A',                     // String (UTF-8)
  price:     Decimal128.fromString('19.99'),  // Decimal128 for money!
  inStock:   true,                            // Boolean
  qty:       42,                              // Int32 (JS number < 2^31)
  views:     BigInt(9_000_000_000),           // use Long for large ints
  createdAt: new Date(),                      // Date (UTC milliseconds)
  tags:      ['electronics', 'sale'],         // Array
  metadata:  { color: 'red', weight: 0.5 },  // Embedded document
  image:     null,                            // Null — field exists with null value
  // note: omitting a field ≠ setting it to null
};

// ObjectId encodes timestamp — extract it:
const oid = new ObjectId();
console.log(oid.getTimestamp()); // Date of creation

// Query by ObjectId (must pass ObjectId, not string):
const db = client.db('shop');
const product = await db.collection('products').findOne({
  _id: new ObjectId('507f1f77bcf86cd799439011') // correct
  // _id: '507f1f77bcf86cd799439011'            // WRONG — string ≠ ObjectId
});`,
    },
    {
      label: 'mongosh REPL',
      language: 'typescript',
      code: `// mongosh commands (run in terminal after: mongosh)

// ── Database & collection navigation ──────────────────────
// show dbs                 → list all databases
// use devhub               → switch to 'devhub' database (creates on first write)
// show collections         → list collections in current db
// db.stats()               → database statistics
// db.users.stats()         → collection statistics (size, indexes, count)

// ── Document count ─────────────────────────────────────────
// db.users.countDocuments()
// db.users.countDocuments({ role: 'admin' })

// ── Quick CRUD in mongosh ──────────────────────────────────
// db.users.insertOne({ name: 'Bob', age: 30 })
// db.users.find({ age: { $gt: 25 } }).pretty()
// db.users.updateOne({ name: 'Bob' }, { $set: { age: 31 } })
// db.users.deleteOne({ name: 'Bob' })

// ── Index management ──────────────────────────────────────
// db.users.createIndex({ email: 1 }, { unique: true })
// db.users.getIndexes()
// db.users.dropIndex('email_1')

// ── Explain a query ───────────────────────────────────────
// db.users.find({ email: 'alice@example.com' }).explain('executionStats')

// ── Admin commands ────────────────────────────────────────
// db.serverStatus()          → server info, connections, memory
// db.currentOp()             → currently running operations
// db.killOp(<opId>)          → kill a slow running operation`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Querying _id with a plain string',
      wrong: `db.collection('users').findOne({ _id: '507f1f77bcf86cd799439011' })`,
      right: `db.collection('users').findOne({ _id: new ObjectId('507f1f77bcf86cd799439011') })`,
      explanation: '_id is stored as an ObjectId BSON type, not a string. A string query never matches — findOne() returns null silently. Always construct an ObjectId when filtering by _id.',
    },
    {
      title: 'Storing money as a floating-point Double',
      wrong: `{ price: 19.99 }  // stored as IEEE 754 Double`,
      right: `{ price: Decimal128.fromString('19.99') }  // exact decimal`,
      explanation: 'JavaScript numbers are 64-bit floats. 19.99 in binary float is 19.990000000000001... After arithmetic, rounding errors accumulate. Always use Decimal128 for monetary values.',
    },
    {
      title: 'Treating missing field and null as equivalent',
      wrong: `// Assumes { $eq: null } only matches null values
db.collection.find({ image: null })`,
      right: `// $eq: null matches BOTH null AND missing field
// Use $exists to distinguish:
db.collection.find({ image: { $exists: true, $eq: null } })`,
      explanation: 'In MongoDB, { field: null } matches documents where the field is null OR where the field does not exist at all. Use $exists: true alongside $eq: null to match only explicit null values.',
    },
    {
      title: 'Not closing the MongoClient',
      wrong: `const client = new MongoClient(uri);
await client.connect();
// ... use database ...
// forgot: await client.close()`,
      right: `try {
  await client.connect();
  // ... use database ...
} finally {
  await client.close();
}`,
      explanation: 'Each MongoClient maintains its own connection pool, capped by maxPoolSize — which defaults to 100. That 100 is the DRIVER\'s own per-client cap, not "the server\'s connection limit": the mongod server\'s own default ceiling (net.maxIncomingConnections) is 65536, a very different number. The real risk of leaking clients is that each one opens its own pool of up to 100 connections — leak enough clients and their combined total can still climb toward the server\'s own much larger ceiling. Always close in a finally block or use a connection manager.',
    },
    {
      title: 'Creating a new MongoClient per request',
      wrong: `app.get('/users', async (req, res) => {
  const client = new MongoClient(uri);
  await client.connect(); // new connection pool every request!
  const users = await client.db('app').collection('users').find().toArray();
  await client.close();
  res.json(users);
});`,
      right: `// Create ONE client at startup, reuse across requests
const client = new MongoClient(uri);
await client.connect();
const db = client.db('app');

app.get('/users', async (req, res) => {
  const users = await db.collection('users').find().toArray();
  res.json(users);
});`,
      explanation: 'Creating a new MongoClient per request creates a new TCP connection pool each time — extremely expensive (hundreds of milliseconds per request). Create one client on application startup and share it.',
    },
  ];

  challenge: Challenge = {
    title: 'Design a Library Document',
    language: 'typescript',
    description: 'Model a public library\'s Book collection. Each book has a title, author(s) (array), ISBN, publication year, genres (array), availability status, and the last 5 borrower records (borrower name + borrow date). Write insertOne() and a findOne() by ISBN. Consider: what to embed vs reference?',
    hints: [
      'Borrow history is bounded (last 5) — safe to embed as an array.',
      'Authors are likely read together with the book — embed as an array of strings.',
      'ISBN is a natural unique identifier — create a unique index on it.',
      'Use a Date object (not string) for borrow dates so date range queries work.',
    ],
    starterCode: `import { MongoClient, Decimal128 } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');

async function main() {
  await client.connect();
  const books = client.db('library').collection('books');

  // TODO: insertOne a book document with:
  // title, authors[], isbn, year, genres[], available: bool,
  // borrowHistory: [{ borrower: string, date: Date }] (max 5)

  // TODO: findOne by ISBN
  // TODO: create a unique index on isbn

  await client.close();
}

main();`,
    solution: `import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');

async function main() {
  await client.connect();
  const books = client.db('library').collection('books');

  // Unique index on ISBN first (idempotent)
  await books.createIndex({ isbn: 1 }, { unique: true });

  await books.insertOne({
    title: 'The Pragmatic Programmer',
    authors: ['David Thomas', 'Andrew Hunt'],
    isbn: '978-0135957059',
    year: 2019,
    genres: ['Software Engineering', 'Best Practices'],
    available: true,
    borrowHistory: [
      { borrower: 'Alice', date: new Date('2024-01-10') },
      { borrower: 'Bob',   date: new Date('2024-03-22') },
    ],
  });

  const book = await books.findOne({ isbn: '978-0135957059' });
  console.log(book?.title);           // The Pragmatic Programmer
  console.log(book?.authors[0]);      // David Thomas
  console.log(book?.borrowHistory.length); // 2

  await client.close();
}

main();`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What BSON type should you use to store a monetary value like $19.99?',
      options: ['Double', 'Int32', 'Decimal128', 'String'],
      answer: 2,
      explanation: 'Decimal128 stores exact decimal fractions, avoiding the floating-point rounding errors inherent in Double (IEEE 754). Always use Decimal128 for financial data.',
    },
    {
      q: 'A MongoDB _id of type ObjectId encodes which piece of information?',
      options: ['A random UUID', 'The document\'s creation timestamp', 'The collection name', 'The shard key value'],
      answer: 1,
      explanation: 'ObjectId is 12 bytes: 4-byte Unix timestamp + 5-byte random value + 3-byte incrementing counter. You can extract the creation time with objectId.getTimestamp().',
    },
    {
      q: 'Which query matches documents where the field "image" is explicitly set to null?',
      options: [
        '{ image: null }',
        '{ image: { $exists: false } }',
        '{ image: { $exists: true, $eq: null } }',
        '{ image: { $type: "null" } }',
      ],
      answer: 2,
      explanation: '{ image: null } matches both null values AND missing fields. To match only explicit nulls, combine $exists: true with $eq: null.',
    },
    {
      q: 'What is the default storage engine in MongoDB since version 3.2?',
      options: ['MMAPv1', 'WiredTiger', 'RocksDB', 'InMemory'],
      answer: 1,
      explanation: 'WiredTiger is the default since MongoDB 3.2. It provides document-level concurrency control (not collection-level locking like MMAPv1) and supports snappy/zlib/zstd compression.',
    },
    {
      q: 'How many mongod instances does a replica set require at minimum for automatic failover?',
      options: ['1', '2', '3', '4'],
      answer: 2,
      explanation: 'A minimum of 3 members: 1 primary + 2 secondaries (or 1 secondary + 1 arbiter). Elections require a majority vote. With only 2 members, a primary failure cannot achieve a majority to elect a new primary.',
    },
    {
      q: 'What does the +srv in a MongoDB Atlas connection string (mongodb+srv://...) do?',
      options: [
        'Enables SSL/TLS encryption',
        'Uses DNS SRV records to discover the replica set hosts automatically',
        'Connects to a sharded cluster',
        'Enables Atlas Search',
      ],
      answer: 1,
      explanation: 'The +srv URI scheme looks up DNS SRV records to automatically discover all hosts in the replica set, eliminating the need to hardcode individual server addresses. It also enables TLS by default.',
    },
    {
      q: 'Which statement about MongoDB collections is TRUE?',
      options: [
        'A collection must have a schema defined before inserting documents',
        'All documents in a collection must have the same fields',
        'Collections are created automatically on the first insert',
        'A collection can only hold 1 million documents',
      ],
      answer: 2,
      explanation: 'Collections in MongoDB are created automatically (lazily) when you first insert a document. There is no CREATE COLLECTION DDL required (though you can create them explicitly for time series or capped collections).',
    },
    {
      q: 'You call db.collection("users").findOne({ _id: "abc123" }) but get null even though that document exists. Why?',
      options: [
        'The collection name is wrong',
        'findOne() only returns the first document in the collection',
        'The _id is stored as an ObjectId, not a string — type mismatch causes no match',
        'findOne() requires a sort parameter',
      ],
      answer: 2,
      explanation: 'MongoDB does strict type matching. If _id is stored as ObjectId("abc..."), querying with the string "abc123" finds nothing because String !== ObjectId. Use new ObjectId("abc123") in the filter.',
    },
    { q: 'What is BSON and how does it extend JSON?', options: ['BSON is a binary-encoded version of JSON that is smaller and faster but supports only the same data types as JSON', 'BSON (Binary JSON) is a binary serialization format that extends JSON with additional types including Date, ObjectId, Decimal128, Int32/Int64, Binary, and Regular Expression, enabling richer data representation than JSON', 'BSON is only used internally by MongoDB and is automatically converted to JSON for all driver operations', 'BSON supports fewer data types than JSON — it trades expressiveness for binary encoding efficiency'], answer: 1, explanation: 'BSON types not in JSON: ObjectId — 12-byte unique identifier with embedded timestamp. Date — stored as milliseconds since epoch (not as a string). Int32 and Int64 — distinct integer types (JSON has only Number). Decimal128 — 128-bit decimal for financial precision (JSON Number is double precision). Binary — raw binary data. Regular Expression — stored as a compiled pattern. Timestamp — internal MongoDB replication timestamp (distinct from Date). Undefined (deprecated). MinKey and MaxKey — special comparison values. Practical implications: { createdAt: new Date() } stores a BSON Date, not a string. Querying by date requires Date objects in the filter, not strings. Decimal128 round-trips without precision loss. ObjectId encodes creation time — ObjectId.getTimestamp() returns the Date.' },
    { q: 'What is a capped collection and when is it appropriate?', options: ['A capped collection enforces a maximum document size rather than a maximum collection size', 'A capped collection has a fixed maximum size or document count and automatically overwrites the oldest documents when full, operating like a circular buffer for append-only use cases like logs and event streams', 'A capped collection prevents updates and deletions — documents can only be inserted or read', 'A capped collection automatically indexes the most recently inserted documents and evicts old indexes to maintain performance'], answer: 1, explanation: 'Capped collections: created with a maximum size in bytes and optionally a maximum document count. db.createCollection("audit_log", { capped: true, size: 104857600, max: 100000 }). 100MB cap, 100K document limit — whichever is reached first triggers overwriting. Behaviour: inserts are always at the end. When full, oldest documents are overwritten automatically. Natural order: documents are returned in insertion order by default. No index on _id by default (can be added). Restrictions: documents cannot be deleted individually (only TTL-like automatic removal by the cap mechanism). Documents can be updated but cannot grow in size (size changes require deletion). No $out or $merge targets. Use cases: rolling logs (keep last N events). Audit trails with a maximum storage budget. Tailable cursors (allows consuming new documents as they are inserted, like tail -f).' },
    { q: 'What is the WiredTiger storage engine and what key features does it provide?', options: ['WiredTiger is an optional third-party plugin for MongoDB that provides encryption at rest', 'WiredTiger is the default MongoDB storage engine providing document-level concurrency via MVCC, compression (snappy by default), encryption at rest, and a configurable memory cache', 'WiredTiger is the storage engine used only by MongoDB Atlas; self-hosted MongoDB uses MMAPv1', 'WiredTiger handles query planning and index selection in MongoDB while the kernel handles actual data storage'], answer: 1, explanation: 'WiredTiger (default since MongoDB 3.2, required since 4.0): Document-level concurrency: uses optimistic concurrency with MVCC (Multi-Version Concurrency Control). Multiple readers and writers can access different documents in the same collection simultaneously. Writes to the SAME document are serialised. Cache: configurable WiredTiger internal cache (default: larger of 50% of RAM minus 1GB, or 256MB). Data is modified in cache and written to disk via checkpoints and journal. Compression: snappy compression by default on both data and indexes. Can configure zlib (higher compression) or zstd. Compression is transparent to the application. Journal: write-ahead log ensures durability. All writes go to the journal before the in-memory cache, protecting against crashes. Encryption: MongoDB Enterprise provides encryption at rest at the storage engine level (WiredTiger encrypted). Performance: significantly faster than the deprecated MMAPv1 engine, especially for concurrent workloads.' },
    { q: 'How does MongoDB replica set election work?', options: ['Replica set elections are managed by a central election coordinator service running in MongoDB Atlas', 'When the primary becomes unavailable, the remaining replica set members hold an election using the Raft consensus algorithm where the member with the most up-to-date oplog and sufficient votes becomes the new primary', 'Replica set elections require a manual administrator intervention to select the new primary', 'The first secondary to detect primary failure automatically becomes the new primary without an election'], answer: 1, explanation: 'Election trigger: primary fails health check (heartbeat missed for 10 seconds by default). Any secondary can call an election. Election process (Raft-based): a candidate secondary requests votes from other members. A member votes only for a candidate that has an oplog at least as recent as its own. To win, a candidate must receive a majority of votes from the configured replica set (not just the online members). arbiter: a replica set member that votes but holds no data. Used to provide odd-member voting without the storage cost of a full replica. Priority: replica set members can have a priority setting (0-1000). Higher priority members prefer to become primary. A member with priority 0 can never become primary. Election duration: typically 10-30 seconds. During election, the replica set is read-only from secondaries (if secondaryOk) and write-unavailable. Write concern majority: a write with { w: "majority" } is acknowledged only when the majority of data-bearing nodes have persisted the write — survives failover.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I choose MongoDB over a relational database?',
      a: 'Choose MongoDB when: (1) your data has a natural document structure (nested objects, arrays) that maps poorly to flat tables; (2) your schema evolves rapidly during development; (3) you need horizontal write scaling via sharding; (4) you\'re storing semi-structured or variable-structure data (user profiles, product catalogs with varying attributes). Stick with relational databases for: strong referential integrity across many entities, complex many-to-many relationships, and when ACID guarantees across multiple collections are critical.',
    },
    {
      q: 'What is the _id field and can I supply my own?',
      a: '<strong>Yes, you can supply your own _id</strong>. The _id field must be unique within the collection and is immutable once set. If you omit it, MongoDB generates an ObjectId automatically. Common custom _id values: a meaningful unique string like a username or product SKU (saves a separate unique index), a UUID, or a composite value. Avoid auto-increment integers — they require a sequence counter collection, which becomes a write bottleneck in distributed environments.',
    },
    {
      q: 'What is the difference between a WiredTiger cache miss and a full collection scan?',
      a: '<strong>Cache miss</strong>: the requested data page is not in WiredTiger\'s in-memory cache and must be read from disk (slow, ~1–10 ms per page). <strong>Collection scan (COLLSCAN)</strong>: a query that reads every document in the collection because no index exists (or was not used). A COLLSCAN is O(n) in collection size and reads all pages from cache or disk. Both are performance issues, but a COLLSCAN on a large collection can take seconds; a cache miss on an indexed query is milliseconds.',
    },
    {
      q: 'Can MongoDB store the same data types as JSON?',
      a: 'MongoDB extends JSON with BSON — it supports all JSON types (string, number, boolean, null, array, object) plus: <strong>ObjectId</strong>, <strong>Date</strong> (as milliseconds, not string), <strong>Binary</strong>, <strong>Decimal128</strong>, <strong>Int32/Int64</strong> (distinct from Double), <strong>Regular Expression</strong>, and <strong>Timestamp</strong>. This means a MongoDB document round-trips through JSON with potential precision loss (Decimal128 → string, Date → ISO string). The MongoDB Extended JSON (EJSON) format preserves type information.',
    },
    {
      q: 'What is the document size limit and why?',
      a: 'MongoDB limits BSON documents to <strong>16 MB</strong>. This is a design choice to prevent individual documents from dominating memory and network bandwidth. For files larger than 16 MB, use <strong>GridFS</strong> (splits files into 255 KB chunks stored in a fs.files / fs.chunks collection pair) or store files in S3/Azure Blob and store only the URL in MongoDB. In practice, keeping documents under 1 MB leads to better cache utilisation and query performance.',
    },
    {
      q: 'How does MongoDB handle concurrent writes to the same document?',
      a: 'WiredTiger uses <strong>document-level locking</strong> (optimistic concurrency with MVCC). Multiple writers can write to different documents in the same collection simultaneously. Writes to the <em>same</em> document are serialised. MongoDB does not have a row-level SELECT FOR UPDATE. For optimistic concurrency control, use the <code>findOneAndUpdate</code> with a version field filter pattern: read the document\'s version, update only if the version matches, increment the version in the update.',
    },
    {
      q: 'What is the difference between db.collection.drop() and removing all documents?',
      a: '<strong>drop()</strong> removes the collection itself — the collection metadata, all documents, and all indexes are deleted. The operation is fast (O(1) at the filesystem level). <strong>deleteMany({})</strong> removes all documents but keeps the collection and its indexes; it\'s O(n) because each document deletion is logged in the oplog for replication. Use drop() when you want to clear everything; use deleteMany({}) when you want to preserve indexes and the collection structure.',
    },
    {
      q: 'How do I model a one-to-many relationship in MongoDB?',
      a: 'Two main patterns: <strong>Embedding</strong> — store the "many" side as an array inside the "one" document. Best when: the "many" side is bounded (e.g., max 100 items), always read with the parent, and not updated independently. Example: blog post with its comments embedded. <strong>Referencing</strong> — store an ObjectId (or array of ObjectIds) in one collection pointing to documents in another. Best when: the "many" side is unbounded, has independent lifecycle, or is large. Example: a user\'s order history (use $lookup to join). The MongoDB "schema design patterns" page covers this in depth.',
    },
    { q: 'What is the oplog and why is it important for replica sets and change streams?', a: 'The oplog (operations log) is a special capped collection (local.oplog.rs) on each replica set member that records all data-modifying operations (inserts, updates, deletes) in the order they occur on the primary. Replication: secondaries continuously read the primary oplog and apply the same operations to their copy of the data, staying synchronized. The oplog is the source of truth for replication. Change streams: change streams are built on the oplog. The change stream cursor reads oplog entries and transforms them into user-friendly change events. Size and retention: the oplog is a capped collection. Its size determines how far back secondaries can lag before they become too stale to sync. A larger oplog gives secondaries more time to recover from downtime. MongoDB 5.0+: minimum oplog retention period can be set in hours regardless of oplog size. Oplog entries are idempotent: applying the same oplog entry multiple times produces the same result as applying it once — essential for reliable replication after network partitions.' },
    { q: 'How does MongoDB handle schema validation?', a: 'MongoDB supports optional schema validation using JSON Schema (BSON variant). Validation is set per collection. db.createCollection("products", { validator: { $jsonSchema: { bsonType: "object", required: ["name", "price"], properties: { name: { bsonType: "string" }, price: { bsonType: "double", minimum: 0 } } } } }). Or add to an existing collection with collMod. Validation levels: strict (default) — validates all inserts and updates. moderate — validates inserts and updates to documents that already match the schema; skips documents that were non-conformant before validation was added. Validation action: error (default) — reject the operation. warn — allow the operation but log a warning. Array and nested object validation: supported via items and properties in JSON Schema. New in MongoDB 5.0: $jsonSchema supports enum, not, anyOf, allOf, oneOf for complex validation. When to use: enforce required fields at the database level. Prevent invalid data types from being inserted. Add gradually — use moderate level when adding validation to an existing collection with existing data.' },
    { q: 'What is the difference between a MongoDB collection scan and an index scan?', a: 'Collection scan (COLLSCAN): MongoDB reads every document in the collection to evaluate the query filter. O(n) where n is the total document count. Performance degrades linearly as the collection grows. Necessary when: no suitable index exists, the query planner determines a full scan is faster (very small collections), or the index would not be selective enough. Index scan (IXSCAN): MongoDB uses a B-tree index to locate matching documents directly. O(log n) or better for equality queries. Reads only documents that match the index criteria. Much faster for selective queries on large collections. Explain plan: use explain("executionStats") to see which plan was chosen. Look for: stage: "COLLSCAN" (no index used) vs stage: "IXSCAN" (index used). totalDocsExamined: how many documents were read. totalKeysExamined: how many index entries were scanned. A good index has totalDocsExamined close to nReturned. A bad query plan has totalDocsExamined much larger than nReturned — indicates a missing index or poor query selectivity.' },
    { q: 'How do you monitor MongoDB performance and what key metrics should you watch?', a: 'Key MongoDB performance metrics: operations per second: insert, update, delete, query rates from db.serverStatus().opcounters. Should be stable; sudden spikes indicate unexpected load. Connection count: current vs available connections. Connection pool exhaustion causes application-level queuing. Queue length: globalLock.currentQueue.total in serverStatus — non-zero queue indicates the server is overwhelmed. Replication lag: db.adminCommand({ replSetGetStatus: 1 }) — optimeDate difference between primary and secondaries. High lag risks stale reads and slow failover. WiredTiger cache utilisation: wiredTiger.cache pages read into cache vs evictions. High eviction rate means the cache is too small for the working set — add RAM. Index cache hit rate: high COLLSCAN count from the query planner (db.collection.aggregate([{ $indexStats: {} }])). Slow query log: operations taking more than slowOpThresholdMs (default 100ms) are logged. Review and add missing indexes. Tools: MongoDB Compass (GUI), Atlas monitoring dashboard, mongostat (command-line real-time stats), mongotop (per-collection time), Prometheus with the MongoDB exporter.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'MongoDB stores JSON-like BSON documents in schema-flexible collections — unit of data is the document, not the row.',
    mustKnow: [
      'Document = JSON-like record; Collection = table; _id = primary key (auto ObjectId if omitted)',
      'BSON extends JSON: Date, ObjectId, Decimal128, Int32/Int64, Binary',
      'Use Decimal128 for money; Date objects for timestamps (never strings)',
      'ObjectId encodes creation timestamp (getTimestamp())',
      '{ field: null } matches null AND missing — use $exists: true to distinguish',
      'Create ONE MongoClient at startup; never create per-request',
      'Replica set = HA; Sharding = horizontal scale; WiredTiger = default storage engine',
    ],
    interviewFocus: [
      'Why document model over relational? (natural object mapping, schema flexibility, embed related data)',
      'What is BSON and how does it differ from JSON? (extra types: Date, ObjectId, Decimal128)',
      '_id immutability and ObjectId timestamp encoding',
      'MongoClient per-request anti-pattern and connection pooling',
      'When to use MongoDB vs PostgreSQL? (document structure, evolving schema, vs ACID, relational integrity)',
    ],
  };
}
