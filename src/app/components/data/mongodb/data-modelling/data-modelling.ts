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
  selector: 'app-mongo-data-modelling',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './data-modelling.html',
  styleUrl: './data-modelling.scss',
})
export class MongoDataModelling {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: 'One-to-One',        desc: 'Embed the related document inside the parent (same access pattern, same lifecycle).' },
    { type: 'keyword', name: 'One-to-Few',         desc: 'Embed as an array. Orders with 2-20 items, blog posts with tags.' },
    { type: 'keyword', name: 'One-to-Many',        desc: 'Reference: store ObjectId in the "many" side or use $lookup.' },
    { type: 'keyword', name: 'One-to-Squillions',  desc: 'Reference only: store parent ID on the "many" side. Never embed millions.' },
    { type: 'keyword', name: 'Many-to-Many',       desc: 'Array of references on one or both sides, or a junction collection.' },
    { type: 'keyword', name: 'Parent Reference',   desc: 'Each child stores its parent ID. Good for hierarchies with frequent parent changes.' },
    { type: 'keyword', name: 'Child Reference',    desc: 'Parent stores array of child IDs. Good when children list is bounded.' },
    { type: 'keyword', name: 'Materialised Path',  desc: 'Node stores full ancestor path as string. Fast subtree queries via $regex prefix.' },
    { type: 'keyword', name: 'Array of Ancestors', desc: 'Node stores an array of ALL ancestor IDs (not just its parent). Fast "find all descendants of X" range query.' },
    { type: 'keyword', name: 'Workload Matrix',    desc: 'Table of queries × frequency × read/write → drives schema decisions.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Relationship Cardinality',
      points: [
        '<strong>One-to-one</strong>: embed the related document inside the parent. Example: user and their single profile photo metadata — embed the photo info as a nested object. Only reference if the sub-document is rarely needed or very large.',
        '<strong>One-to-few</strong> (up to ~20): embed as an array. Blog post tags, order items, a student\'s grades — bounded, always accessed with the parent, owned by the parent.',
        '<strong>One-to-many</strong> (hundreds): place the reference on the "many" side. Comments reference the post they belong to; products reference their category. Fetch with $lookup or separate query filtered by the parent ID.',
        '<strong>One-to-squillions</strong> (millions+): place the reference on the "many" side and never embed. Twitter user→tweets: store userId on each tweet, never embed tweet IDs on the user.',
        '<strong>Many-to-many</strong>: depends on size. Tags on posts (both small): store tag IDs array on each post; store post IDs array on each tag. Students and courses (large both sides): use a junction collection (enrolments) with studentId and courseId.',
      ],
    },
    {
      heading: 'Workload-Driven Design',
      points: [
        'Before writing a single document, create a <strong>workload matrix</strong>: list your top 10 queries/operations, their frequency (reads/second, writes/second), and their latency requirement. Your schema must optimise for the high-frequency, low-latency operations.',
        'For each operation, ask: "How many documents does this touch? Does it require a join? Is it read-heavy or write-heavy?" A schema that makes the most frequent query O(1) with one indexed lookup is better than a schema that\'s theoretically pure.',
        'Read/write ratio matters enormously. An analytics workload (mostly reads) tolerates denormalisation and pre-computation. A write-heavy workload (e.g., sensor data ingestion) needs minimal write amplification — fewer fields to update per write.',
        'Access patterns change over time. Build in flexibility by separating high-churn data (frequently updated) from stable data (rarely changes). Stable data is safe to denormalise; high-churn data should be referenced to minimise update propagation.',
        'A good test: write out in plain English what data the most frequent API endpoint needs. That\'s your query. Design the schema so that query reads from one (or at most two) documents without aggregation.',
      ],
    },
    {
      heading: 'Hierarchical Data',
      points: [
        'Hierarchical (tree) data — categories, org charts, comment threads, menus — has multiple modelling options in MongoDB. The right choice depends on read vs write frequency and required traversal depth.',
        '<strong>Parent Reference (Adjacency List)</strong>: each node stores <code>parentId</code>. Simple to maintain (change parentId to reparent). Finding all descendants requires recursive queries or <code>$graphLookup</code>.',
        '<strong>Child Reference</strong>: parent stores an array of child IDs. Easy to get direct children; finding all descendants still requires multiple queries. Only use when the children list is bounded.',
        '<strong>Materialised Path</strong>: each node stores the full ancestor path as a string: <code>path: "/root/tech/laptops"</code>. Find all descendants with <code>{ path: { $regex: /^\/root\/tech/ } }</code> — one indexed query. Moving a subtree requires updating all descendant paths.',
        '<strong>Nested Sets</strong>: each node stores left/right boundary values that encode the subtree. Extremely fast to query a full subtree; expensive to maintain (all bounds change on insert/move). Only suitable for read-heavy, rarely-updated hierarchies.',
      ],
    },
    {
      heading: 'Data Lifecycle & Expiry',
      points: [
        'TTL (Time To Live) indexes automatically delete expired documents: <code>createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 })</code>. MongoDB checks TTL indexes every 60 seconds. Use for: session tokens, password reset tokens, ephemeral data.',
        'Capped collections automatically overwrite old documents when they reach a size/document limit. Useful for fixed-size circular buffers (recent activity logs, audit trails) where you always want the latest N items.',
        '<strong>Soft delete pattern</strong>: instead of deleting, set <code>deletedAt: Date</code> on documents. Query with <code>{ deletedAt: null }</code> for "active" data. Enables "undelete" and audit history. Create a partial index on <code>deletedAt: 1</code> with <code>partialFilterExpression: { deletedAt: { $exists: true } }</code> to keep the index small.',
        'For compliance data (financial records, medical records), you may be legally required to retain data for years. Design your schema to distinguish between "active" and "archived" states, using separate collections or a status field with different retention policies.',
        'Document versioning: store multiple versions of a document as an array (version history) or in a separate <code>versions</code> collection referenced by the current document. Useful for content management, contract management, and compliance audit trails.',
      ],
    },
    {
      heading: 'Schema Versioning and Migration Strategy',
      points: [
        'Unlike a relational database, MongoDB does not enforce a schema by default — this flexibility means schema changes do not require a blocking migration, but it also means old and new document shapes can coexist in the same collection simultaneously after a model change.',
        'A common pattern is to add a schemaVersion field to documents, letting application code detect and handle multiple document shapes gracefully during a transition period, rather than requiring every existing document to be migrated synchronously before the application can deploy.',
        'Lazy migration (updating a document to the new shape only when it is next read or written, rather than migrating the entire collection upfront) avoids a large blocking migration job, spreading the migration cost across normal application traffic over time.',
        'For genuinely large migrations affecting many documents, a background migration script processing documents in small batches (with appropriate rate limiting) avoids the sustained write load and potential replication lag that migrating an entire large collection at once could cause.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Relationship Models',
      language: 'typescript',
      code: `// ONE-TO-ONE: embed (user + address, always accessed together)
const user = {
  _id:   userId,
  name:  'Alice',
  email: 'alice@example.com',
  address: {           // embedded — never accessed alone
    street: '123 Main St',
    city:   'London',
    zip:    'SW1A 1AA',
  },
};

// ONE-TO-FEW: embed array (post + tags, bounded)
const post = {
  _id:   postId,
  title: 'MongoDB Tips',
  tags:  ['mongodb', 'nosql', 'database'],   // max ~10 tags
  author: { id: authorId, name: 'Alice' },   // extended reference
};

// ONE-TO-MANY: reference on the "many" side
const comment = {
  _id:       commentId,
  postId:    postId,   // reference to posts._id
  userId:    userId,
  text:      'Great post!',
  createdAt: new Date(),
};
// Index: createIndex({ postId: 1, createdAt: -1 })

// MANY-TO-MANY (bounded): arrays on both sides
const student = { _id, name: 'Bob', courseIds: [courseId1, courseId2] };
const course   = { _id, name: 'MongoDB 101', studentIds: [studentId1, studentId2] };

// MANY-TO-MANY (large scale): junction collection
const enrolment = {
  studentId:  studentId,
  courseId:   courseId,
  enrolledAt: new Date(),
  grade:      null,
};
// Indexes: { studentId: 1 } and { courseId: 1 }`,
    },
    {
      label: 'Tree Structures',
      language: 'typescript',
      code: `// PARENT REFERENCE (adjacency list)
const categories = [
  { _id: 'root',      name: 'All',         parentId: null },
  { _id: 'tech',      name: 'Technology',  parentId: 'root' },
  { _id: 'laptops',   name: 'Laptops',     parentId: 'tech' },
  { _id: 'gaming',    name: 'Gaming',      parentId: 'tech' },
  { _id: 'rog',       name: 'ASUS ROG',    parentId: 'gaming' },
];

// Find direct children
const techChildren = await col.find({ parentId: 'tech' }).toArray();

// Find ALL descendants using $graphLookup
const allDescendants = await col.aggregate([
  { $match: { _id: 'tech' } },
  { $graphLookup: {
    from:             'categories',
    startWith:        '$_id',
    connectFromField: '_id',
    connectToField:   'parentId',
    as:               'descendants',
  }},
]).toArray();

// MATERIALISED PATH — faster subtree reads
const categoriesMP = [
  { _id: 'root',    path: '/root' },
  { _id: 'tech',    path: '/root/tech' },
  { _id: 'laptops', path: '/root/tech/laptops' },
];
await col.createIndex({ path: 1 });
// Find all under 'tech':
const techSubtree = await col.find({ path: { $regex: /^\/root\/tech/ } }).toArray();`,
    },
    {
      label: 'TTL & Capped',
      language: 'typescript',
      code: `// TTL INDEX — auto-delete expired documents
const sessions = db.collection('sessions');
await sessions.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });

// Insert a session that expires in 1 hour
await sessions.insertOne({
  token:    'abc123',
  userId:   userId,
  expireAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
});
// MongoDB deletes this document automatically after expireAt passes
// (checked every ~60 seconds by the TTL monitor thread)

// Alternative: expireAfterSeconds on a fixed field (e.g., createdAt)
await sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // 1 hour

// CAPPED COLLECTION — fixed size, auto-overwrites oldest
await db.createCollection('recentActivity', {
  capped: true,
  size:   10_000_000,  // max 10 MB
  max:    1_000,       // max 1,000 documents
});
// Newest documents overwrite oldest when limit is reached

// SOFT DELETE PATTERN
await db.collection('users').updateOne(
  { _id: userId },
  { $set: { deletedAt: new Date() } }
);
// Active users query:
const activeUsers = await db.collection('users').find({ deletedAt: null }).toArray();
// Partial index for efficiency:
await db.collection('users').createIndex(
  { deletedAt: 1 },
  { partialFilterExpression: { deletedAt: { $exists: true } } }
);`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Designing schema before knowing the access patterns',
      wrong: `// Normalised like a SQL database — three joins per page load
const product = { _id, categoryId };
const category = { _id, name, parentId };
const productDetails = { productId, description, specs: [] };
// Every product page: 3 queries + join`,
      right: `// Start with the query: "What does the product page display?"
// Then design the schema to answer that query in one document:
const product = {
  _id, name, price,
  category: { id: categoryId, name: 'Electronics' }, // extended ref
  description, specs: [], images: [],
  reviewCount: 0, avgRating: 0,  // computed
};`,
      explanation: 'MongoDB schema design starts with "what queries will run most often?" not with normalisation theory. Design your documents so the most frequent queries hit one collection with an index — avoiding $lookup and multiple round-trips.',
    },
    {
      title: 'Creating a collection per entity type instead of using polymorphism',
      wrong: `// One collection per content type — hard to query across types
const videos = db.collection('videos');
const articles = db.collection('articles');
const podcasts = db.collection('podcasts');
// Finding recent content across ALL types: 3 queries + merge in code`,
      right: `// Polymorphic: one 'content' collection with a type field
const content = db.collection('content');
// { _id, type: 'video'|'article'|'podcast', title, publishedAt, authorId, ... }
// Index: { publishedAt: -1 } covers all types
// Query all recent: col.find({}).sort({ publishedAt: -1 }).limit(20)
// Query by type:    col.find({ type: 'video' }).sort({ publishedAt: -1 })`,
      explanation: 'When different entity types share common access patterns (show recent, filter by author, search), the polymorphic pattern in one collection is far simpler to query. Only split into separate collections when the types have nothing in common or have drastically different scale.',
    },
    {
      title: 'Using sequential integer IDs in sharded clusters',
      wrong: `// Auto-increment counter pattern for _id
const counter = await db.collection('counters').findOneAndUpdate(
  { _id: 'users' }, { $inc: { seq: 1 } }, { returnDocument: 'after', upsert: true }
);
const newUser = { _id: counter.seq, name: '...' }; // _id: 1, 2, 3...`,
      right: `// Use ObjectId (default) — monotonically increasing, distributed-safe
const newUser = { name: 'Alice', createdAt: new Date() };
await db.collection('users').insertOne(newUser);
// Or use UUID if you need a string ID:
import { v4 as uuidv4 } from 'uuid';
const newUser2 = { _id: uuidv4(), name: 'Alice' };`,
      explanation: 'Sequential integer IDs require a counter collection — a single-document write bottleneck. In sharded clusters, all inserts hit the shard holding the counter document. ObjectId encodes time and randomness, distributing writes across shards naturally.',
    },
    {
      title: 'Not indexing fields used for filtering when referencing',
      wrong: `// Comments reference their post, but postId has no index
const comment = { postId: postId, text: '...' };
// Getting post's comments: db.comments.find({ postId }) → FULL SCAN!`,
      right: `// Index the reference field — always
await db.collection('comments').createIndex({ postId: 1, createdAt: -1 });
// Now find({ postId, createdAt: { $gte: yesterday } }) is O(log n)`,
      explanation: 'When you reference documents (put the parent ID on the many side), you MUST index the reference field. Without an index, every "get all comments for this post" query scans the entire comments collection.',
    },
  ];

  challenge: Challenge = {
    title: 'Social Media Feed Schema',
    language: 'typescript',
    description: 'Model a social media feed where: users can follow other users, posts have likes and comments, and the home feed shows the 20 most recent posts from followed users. Design the collections and write: (1) follow(followerId, followeeId), (2) createPost(userId, content), (3) getFeed(userId, limit). Use appropriate patterns for scale.',
    hints: [
      'Store follows as a separate collection (userId, followingId) with indexes on both fields.',
      'Posts collection: userId, content, likeCount (computed), createdAt.',
      'For getFeed: first get followingIds, then find posts where userId $in followingIds, sorted by createdAt.',
      'Consider extended reference: store authorName on each post to avoid joining users on every feed fetch.',
    ],
    starterCode: `import { MongoClient, ObjectId } from 'mongodb';
const db = (new MongoClient('mongodb://localhost:27017')).db('social');

// TODO: create indexes
// TODO: implement follow(followerId, followeeId)
// TODO: implement createPost(userId, content, authorName)
// TODO: implement getFeed(userId, limit)`,
    solution: `import { MongoClient, ObjectId } from 'mongodb';
const db = (new MongoClient('mongodb://localhost:27017')).db('social');

await db.collection('follows').createIndex({ followerId: 1 });
await db.collection('follows').createIndex({ followeeId: 1 });
await db.collection('follows').createIndex({ followerId: 1, followeeId: 1 }, { unique: true });
await db.collection('posts').createIndex({ userId: 1, createdAt: -1 });
await db.collection('posts').createIndex({ createdAt: -1 });

async function follow(followerId: ObjectId, followeeId: ObjectId) {
  await db.collection('follows').updateOne(
    { followerId, followeeId },
    { $setOnInsert: { followerId, followeeId, followedAt: new Date() } },
    { upsert: true }
  );
}

async function createPost(userId: ObjectId, content: string, authorName: string) {
  return db.collection('posts').insertOne({
    userId,
    authorName,   // extended reference — avoid join on feed
    content,
    likeCount: 0, // computed pattern
    createdAt: new Date(),
  });
}

async function getFeed(userId: ObjectId, limit = 20) {
  // Get followed user IDs
  const follows = await db.collection('follows')
    .find({ followerId: userId }, { projection: { followeeId: 1 } })
    .toArray();
  const followingIds = follows.map(f => f['followeeId']);

  // Get recent posts from followed users
  return db.collection('posts')
    .find({ userId: { $in: followingIds } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the "one-to-squillions" relationship pattern?',
      options: [
        'Embed millions of documents in one array',
        'Store the parent ID on the "many" side — never embed millions of references',
        'Use a junction collection for millions of relationships',
        'Create a separate database for each entity',
      ],
      answer: 1,
      explanation: 'One-to-squillions (millions+) means always referencing — store the parent ID on the "many" side (e.g., userId on each log entry). Never embed an array of millions of child IDs on the parent; that exceeds the 16 MB document limit.',
    },
    {
      q: 'Which tree structure pattern enables finding all descendants with a single indexed query?',
      options: ['Parent Reference', 'Child Reference', 'Materialised Path', 'Nested Sets'],
      answer: 2,
      explanation: 'Materialised Path stores the full ancestor path string (e.g., "/root/tech/laptops"). A single $regex prefix query with an index finds all descendants: { path: { $regex: /^\/root\/tech/ } }. No recursive queries needed.',
    },
    {
      q: 'What does a TTL index do?',
      options: [
        'Limits the index size to a maximum value',
        'Automatically deletes documents after they expire',
        'Throttles query execution time',
        'Time-stamps document creation',
      ],
      answer: 1,
      explanation: 'A TTL (Time-To-Live) index on a Date field automatically deletes documents when their date value is in the past (with expireAfterSeconds: 0) or after a fixed duration (expireAfterSeconds: N). MongoDB checks every ~60 seconds.',
    },
    {
      q: 'What is the main advantage of the Soft Delete pattern?',
      options: [
        'Faster delete operations',
        'Lower storage usage',
        'Enables data recovery and maintains audit history',
        'Automatic document expiry',
      ],
      answer: 2,
      explanation: 'Soft delete sets a deletedAt field instead of physically removing documents. This enables: data recovery ("undelete"), audit history, compliance (retain deleted records for N years), and debugging (see what was deleted and when).',
    },
    {
      q: 'When is a junction (join) collection the right choice for many-to-many?',
      options: [
        'Always — it\'s the most normalised approach',
        'When the relationship itself has attributes (e.g., enrolment date, grade)',
        'Only when both sides have fewer than 100 documents',
        'Never — MongoDB doesn\'t support junction collections',
      ],
      answer: 1,
      explanation: 'A junction collection is appropriate when: (1) the relationship itself has attributes (grade, date enrolled, role in group) that don\'t belong on either side, or (2) both sides have large cardinality making embedded arrays unbounded. For small-scale many-to-many without relationship attributes, arrays of IDs on one side work fine.',
    },
    { q: 'What is the bucket pattern in MongoDB data modelling and what problem does it solve?', options: ['The bucket pattern divides a large collection into multiple smaller collections based on a range of field values', 'The bucket pattern groups time-series or sequential data into fixed-size documents (buckets) to reduce document count, decrease index size, and enable efficient range queries over a natural time or sequence dimension', 'The bucket pattern creates array fields to act as hash buckets for fast lookups by key', 'The bucket pattern is MongoDB Atlas-specific and automatically partitions data across shards'], answer: 1, explanation: 'Problem without bucket pattern: IoT sensor emitting one reading per second = 86,400 documents per device per day. Index size is enormous. Queries across time windows scan many small documents. Bucket pattern: group N readings into one document: { sensorId: "S1", date: ISODate("2024-01-15"), readings: [ { ts: ..., val: 23.4 }, { ts: ..., val: 23.5 }, ... ] }. Benefits: one document per bucket instead of N documents (reduces total document count by N). Index on sensorId + date covers entire bucket with one index entry. Range queries (last hour) hit far fewer documents. Schema considerations: bucket size — choose N based on query patterns. Time buckets (per minute or per hour) are common. Include an nMeasurements field to track how many readings are in the bucket. Handle bucket overflow — when a bucket fills up, start a new one. Commonly used with the computed pattern (pre-aggregate stats per bucket: min, max, avg).' },
    { q: 'What is the outlier pattern and why is it needed?', options: ['The outlier pattern uses a separate collection for documents that are statistical outliers to prevent them from skewing aggregation results', 'The outlier pattern handles documents that occasionally exceed the normal data size limits by adding a hasExtras flag and storing overflow data in linked documents, preventing the 16MB limit from forcing a schema redesign', 'The outlier pattern optimizes indexes by excluding outlier values from index coverage to reduce index fragmentation', 'The outlier pattern is a monitoring design that separates error events (outliers) from normal operational events in time-series data'], answer: 1, explanation: 'Problem: most users have 10-20 followers (stored as an array in the user document). A celebrity has 10 million followers — an array of 10 million ObjectIds exceeds 16MB. Changing the schema for all users to handle the celebrity case wastes space and slows down queries for normal users. Outlier pattern: normal user: { _id: userId, followers: [...], hasExtraFollowers: false }. Celebrity: { _id: userId, followers: [...first 1000...], hasExtraFollowers: true }. Extra followers stored in an overflow_followers collection: { userId: userId, followers: [...next 1000...] }. Application: check hasExtraFollowers flag. If true, issue additional queries. Benefit: 99.9% of users are served by the simple fast path. Only the outliers require special handling. The schema is optimized for the common case while still supporting the edge case.' },
    { q: 'What is the attribute pattern and when should you use it?', options: ['The attribute pattern defines a JSON Schema for MongoDB documents to enforce attribute types at the collection level', 'The attribute pattern replaces multiple sparse fields with an array of key-value pairs to enable a single index to cover searches across all attribute keys and values', 'The attribute pattern creates a separate attributes collection with foreign key references to the main collection for normalized storage of metadata', 'The attribute pattern groups related collections under a shared namespace prefix to improve organizational clarity in large databases'], answer: 1, explanation: 'Problem: products with varying attributes — shirt has size and color, laptop has RAM and CPU, bike has frame_size and gears. Creating top-level fields for every possible attribute results in many sparse fields (most are null for most products). Indexing each attribute field separately is not scalable. Attribute pattern: convert sparse fields to an array of key-value pairs. { name: "T-Shirt", attributes: [ { k: "color", v: "red" }, { k: "size", v: "M" } ] }. Single compound index on attributes.k and attributes.v covers all attribute searches: db.products.createIndex({ "attributes.k": 1, "attributes.v": 1 }). Query: { attributes: { $elemMatch: { k: "color", v: "red" } } }. Trade-off: less readable schema. Queries require $elemMatch. Loses type safety (all values become strings unless you add a vt type discriminator field). Best for: product catalogs, feature flags, extensible configuration where attributes vary widely across documents.' },
    { q: 'What is the polymorphic pattern and how does it work in MongoDB?', options: ['The polymorphic pattern stores different document types in separate collections and uses $lookup to join them for unified queries', 'The polymorphic pattern stores documents of different shapes in the same collection by including a type discriminator field, enabling mixed-type queries while allowing type-specific fields per document type', 'The polymorphic pattern uses MongoDB schema validation to enforce that each document conforms to one of several predefined JSON schemas', 'The polymorphic pattern is used only for inheritance hierarchies in object-oriented applications and is not applicable to non-OOP data models'], answer: 1, explanation: 'Polymorphic pattern: store different but related entity types in the same collection. Add a type field to discriminate. Example: vehicles collection with { type: "car", make, model, numDoors } and { type: "motorcycle", make, model, hasSidecar } and { type: "truck", make, model, payloadCapacity }. Benefits: query all vehicle types with a single query. Index covers all types. Join-free queries for polymorphic results. Type-specific indexes: { type: 1, make: 1 } covers queries filtered by type. Index hint to use type-specific covered queries. Application handling: after reading documents, branch on the type field to instantiate the appropriate class or handle differently. MongoDB 6.0 schema validation: use oneOf with multiple schemas per type for server-side validation. Common use cases: content management (article, image, video), notifications (email, push, SMS), events (click, purchase, view).' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I model a user following other users in MongoDB?',
      a: 'For large-scale social graphs, use a dedicated <code>follows</code> collection: <code>{ followerId, followeeId, followedAt }</code> with a unique compound index on <code>{ followerId: 1, followeeId: 1 }</code>. This enables: "who does user X follow?" (find { followerId: x }), "who follows user X?" (find { followeeId: x }), and "does user X follow user Y?" (findOne with both fields). Never embed follower/following arrays on the user document at scale — they become unbounded.',
    },
    {
      q: 'What is $graphLookup and when do I use it?',
      a: '<code>$graphLookup</code> performs recursive graph traversal in the aggregation pipeline. Starting from a set of documents, it repeatedly queries a collection for connected documents (following a specified field) until a depth limit is reached. Use for: finding all ancestors/descendants in a category tree, computing transitive graph paths, friend-of-friend social graph queries. It\'s more expensive than $lookup — only use it when the recursive pattern is genuinely required.',
    },
    {
      q: 'How do I model a product with variable attributes (e.g., electronics vs clothing)?',
      a: 'Use the <strong>Polymorphic Pattern</strong> with <strong>attribute value pairs</strong>: store a <code>type</code> field and a <code>specs</code> object (or array) for variable attributes. Example: electronics have wattage and voltage; clothing has size and color. Store common fields at the top level; type-specific fields in a <code>specs</code> embedded document. Use <code>$jsonSchema</code> with <code>oneOf</code> for per-type validation if needed. Alternatively, use a separate collection per product category if the schemas are fundamentally different.',
    },
    {
      q: 'What is a capped collection and when should I use it?',
      a: 'A capped collection has a fixed maximum size (in bytes) and optionally a maximum document count. When full, it automatically overwrites the oldest documents with new ones — a circular buffer. Insertions are O(1) (no deletions needed). Use for: rolling logs, recent activity feeds (fixed-size "last N events"), metrics buffers. Limitations: you cannot delete individual documents; TTL indexes don\'t work on capped collections; documents cannot grow after insertion. For most use cases, a regular collection with a TTL index and <code>deleteMany</code> batch cleanup is more flexible.',
    },
    {
      q: 'How do I handle the N+1 query problem in MongoDB?',
      a: 'The N+1 problem: you fetch N posts, then make N separate queries to get the author for each. Solutions: (1) <strong>$lookup</strong>: join in one aggregation pipeline (best for analytics). (2) <strong>Extended Reference Pattern</strong>: store the author\'s name inline on each post (best for read-heavy feeds). (3) <strong>Batch lookup</strong>: collect all unique authorIds, do one <code>find({ _id: { $in: authorIds } })</code>, then merge in application code (good balance for APIs). (4) <strong>DataLoader pattern</strong>: batch and deduplicate lookups within a single request (popular in GraphQL).',
    },
    { q: 'What is the computed pattern and how does it improve read performance?', a: 'The computed pattern pre-computes aggregated values at write time and stores them in the document, so reads can retrieve them directly without running expensive aggregations. Problem: a blog post has thousands of comments. Displaying the comment count requires counting embedded comments on every read. Solution: add a commentCount field to the post document. Increment it with every comment addition using $inc. Read performance: O(1) fetch of the pre-computed count vs O(n) count operation. Trade-off: write overhead — every comment insert must also update the parent document. Slight denormalization — the count could theoretically drift from reality (use transactions or periodic reconciliation). Also applies to: running totals (order total = pre-summed line items). Aggregate statistics (average rating stored alongside review array). Best seller list (pre-computed and cached as a list in the database). TTL-based refresh: for expensive aggregations that do not change per write, compute periodically on a schedule and store the result with a lastComputedAt timestamp. Reads check if the result is fresh enough before recomputing.' },
    { q: 'When should you embed vs reference in MongoDB relationships?', a: 'Embed when: the related data is always read with the parent (e.g., order line items are always displayed with the order). The related data has a bounded cardinality (max 100 items, not unbounded). The related data does not have an independent lifecycle (deleting the parent also removes the embedded data). The related data is updated infrequently or always updated together with the parent. Reference when: the related data is frequently accessed independently (retrieve user profile without needing all their orders). The relationship is many-to-many (products to categories — a product can be in multiple categories, a category has many products). The cardinality is unbounded or large (a user with millions of followers). The related data changes frequently and independently (updating product price should not require updating every order that referenced it). The related data is large and would push the document toward the 16MB limit. Rule of thumb: one-to-few and always-together-access → embed. One-to-many, independent access → reference. Many-to-many → reference with an array of IDs, or a junction collection.' },
    { q: 'What is the extended reference pattern and how does it reduce joins?', a: 'Extended reference pattern: instead of storing just a foreign key (ObjectId), store the ObjectId PLUS a subset of the most frequently accessed fields from the referenced document directly in the referencing document. Example: orders reference customers by customerId. Without extended reference: each order display requires a $lookup to get the customer name and email. With extended reference: { _id: orderId, customerId: ObjectId("..."), customer_name: "Jane Smith", customer_email: "jane@example.com", items: [...] }. Benefits: the most common read (display order with customer name) does not require a join. Fewer round trips. Trade-off: data duplication. When the customer name changes, you must update all orders referencing that customer. Mitigation: only duplicate fields that change infrequently (name, email — not address). Add a lastUpdated timestamp to detect stale denormalized data. Periodic reconciliation job to sync. The extended reference is best when read performance is critical, joins are expensive, and the duplicated fields are relatively stable.' },
    { q: 'How does the tree pattern work for hierarchical data in MongoDB?', a: 'Three common tree representation patterns in MongoDB: Parent Reference: each node stores the _id of its parent. { _id: nodeId, name: "Category", parentId: parentNodeId }. Easy to traverse up (find parent). Traversal down requires recursive queries or $graphLookup. Best for: simple parent-child relationships where you mostly navigate one level. Child References: each node stores an array of its children IDs. { _id: nodeId, name: "Category", childIds: [id1, id2] }. Easy to find all direct children. Hard to find all descendants. Ancestor Array: each node stores an array of ALL ancestor IDs from root to immediate parent. { _id: nodeId, name: "Category", ancestors: [rootId, level1Id, level2Id] }. Fast range queries for all descendants of any ancestor: { ancestors: ancestorId }. Updating when moving a node requires updating all descendants. Best for read-heavy, rarely restructured hierarchies. Materialized path: store the path as a string (e.g., "/root/electronics/laptops"). Pattern matching for descendants: { path: /^\/root\/electronics/ }. $graphLookup (MongoDB 3.4+): handles tree traversal in aggregation without embedding structure in documents — most flexible but slower.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Model MongoDB documents around query access patterns: embed for "one-to-few" always-together data; reference for unbounded or independently-updated relationships.',
    mustKnow: [
      'One-to-one/few: embed. One-to-many: reference on many side. One-to-squillions: never embed array of millions.',
      'Many-to-many: arrays of IDs (bounded) or junction collection (unbounded/with attributes)',
      'Tree structures: parent reference (adjacency) = flexible; materialised path = fast subtree queries',
      'TTL index: auto-deletes expired docs (checked every ~60s)',
      'Capped collection: fixed-size circular buffer; no individual deletes',
      'Soft delete: set deletedAt field; query { deletedAt: null } for active data',
      'Always index the foreign key field when using referencing',
    ],
    interviewFocus: [
      'One-to-squillions: always reference on the many side',
      'When to use a junction collection vs embedded array for many-to-many',
      'Materialised path for efficient subtree queries',
      'TTL indexes for session/token expiry',
      'N+1 problem solutions in MongoDB (extended reference, $lookup, batch)',
    ],
  };
}
