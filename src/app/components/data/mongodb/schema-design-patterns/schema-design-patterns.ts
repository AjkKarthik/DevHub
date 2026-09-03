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
  selector: 'app-mongo-schema-design-patterns',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './schema-design-patterns.html',
  styleUrl: './schema-design-patterns.scss',
})
export class MongoSchemaDesignPatterns {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: 'Embedding',            desc: 'Store related data inside the same document. Best for "one-to-few" and read-heavy access.' },
    { type: 'keyword', name: 'Referencing',          desc: 'Store ObjectId references to other collections. Best for "one-to-many" with independent lifecycle.' },
    { type: 'keyword', name: 'Subset Pattern',       desc: 'Embed a bounded subset of related data (e.g., last 5 reviews) + keep full data in separate collection.' },
    { type: 'keyword', name: 'Computed Pattern',     desc: 'Pre-compute and store aggregated values (totals, averages) to avoid expensive queries on read.' },
    { type: 'keyword', name: 'Bucket Pattern',       desc: 'Group related time-series data into "bucket" documents instead of one document per reading.' },
    { type: 'keyword', name: 'Outlier Pattern',      desc: 'Handle rare extra-large documents: flag them and store overflow in a separate collection.' },
    { type: 'keyword', name: 'Extended Reference',   desc: 'Store frequently-read fields from a referenced document inline (denormalise key fields).' },
    { type: 'keyword', name: 'Polymorphic Pattern',  desc: 'Different document shapes in the same collection. Use a "type" field to discriminate.' },
    { type: 'keyword', name: 'Version Pattern',      desc: 'Store schema version in each document; migrate lazily on read.' },
    { type: 'keyword', name: 'Tree Structures',      desc: 'Parent reference, child reference, materialised path, or nested sets for hierarchical data.' },
    { type: 'keyword', name: '$jsonSchema',          desc: 'MongoDB validator to enforce field types and required fields at the DB level.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Embedding vs Referencing',
      points: [
        'The most fundamental design decision in MongoDB is <strong>embed vs reference</strong>. Embedding stores related data inside the parent document (denormalised). Referencing stores only an ID and fetches the related document separately via $lookup or application code (normalised).',
        '<strong>Embed when</strong>: the related data is always accessed together with the parent (e.g., order items with the order), the related data is bounded (< ~100 elements), the "many" side belongs to only one parent, and the embedded documents don\'t need their own independent lifecycle.',
        '<strong>Reference when</strong>: the related data is unbounded (e.g., all tweets by a user), the "many" side is shared across multiple parents, the related documents have their own lifecycle (created/deleted independently), or the related data would make the parent document exceed 16 MB.',
        'A hybrid approach is often best: embed the hot path (data always queried together), reference the cold path (data rarely needed or potentially unbounded). Example: embed the latest 5 comments on a post, reference the full comment collection for paginated comment history.',
        'Design for your access patterns, not for theoretical normalisation. The right schema is the one that makes your most frequent queries fast and simple, with acceptable complexity for rarer operations.',
      ],
    },
    {
      heading: 'Subset Pattern',
      points: [
        'The subset pattern solves the "I only need part of the array" problem. Instead of embedding ALL related items (unbounded), embed a <em>bounded subset</em> — typically the most recent or most important items — in the parent document.',
        'Example: a product document embeds its 5 most recent reviews for fast display on the product page. The full review history lives in a separate reviews collection for paginated browsing.',
        'Maintain the subset with bounded array updates: <code>{ $push: { recentReviews: { $each: [newReview], $slice: -5, $sort: { date: -1 } } } }</code> keeps only the 5 most recent reviews embedded.',
        'The trade-off: writes to the reviews collection must also update the parent document\'s subset — two writes instead of one. Use transactions if consistency between the two is critical.',
        'Common subset pattern applications: recent activity feed (embed last 10), top comments (embed 3 highest-voted), recent orders on user profile (embed last 5).',
      ],
    },
    {
      heading: 'Computed Pattern',
      points: [
        'The computed pattern pre-stores the result of expensive computations (aggregations) at write time, so reads are fast. Instead of computing COUNT(*), SUM(), AVG() at read time, update a stored counter/total when the underlying data changes.',
        'Example: instead of querying <code>db.reviews.countDocuments({ productId: x })</code> for every product page load, store <code>reviewCount</code> on the product document and increment it with each new review: <code>{ $inc: { reviewCount: 1, totalRating: rating } }</code>.',
        'The average rating then becomes <code>totalRating / reviewCount</code> — computable without aggregation. Adding one review is an atomic <code>updateOne</code> on both the reviews collection and the product document.',
        'This trades write complexity for read performance — each write updates both the data and the pre-computed value. For high-read, occasional-write scenarios, this is a major win.',
        'The computed pattern is widely used in e-commerce (product stats), social media (follower counts, like counts), and dashboards where aggregation queries would be too slow at the required read throughput.',
      ],
    },
    {
      heading: 'Bucket Pattern',
      points: [
        'The bucket pattern groups a series of related data points into a single "bucket" document instead of storing one document per data point. Common for time-series and IoT data.',
        'Without bucketing: 1 million sensor readings = 1 million documents. High index overhead, small documents. With bucketing: group 60 readings per hour into one document — 16,667 documents instead of 1 million, 60x less index overhead.',
        'A bucket document has: device_id, hour (the bucket key), measurements: [array of readings], count, min, max, sum (pre-computed aggregates). To add a reading, <code>$push</code> to measurements and <code>$inc</code> the stats atomically.',
        'Buckets naturally align with query patterns: "show me the last 24 hours" fetches at most 24 documents rather than thousands of individual readings.',
        'MongoDB Time Series collections (MongoDB 5.0+) are a built-in implementation of this pattern with automatic bucketing, compression, and optimised range queries — prefer them for new time-series workloads over manual bucketing.',
      ],
    },
    {
      heading: 'Extended Reference & Polymorphic',
      points: [
        'The <strong>extended reference pattern</strong> stores a copy of frequently-accessed fields from a referenced document alongside the reference ID. Example: instead of only storing <code>userId: ObjectId</code>, also store <code>userName</code> and <code>userEmail</code> inline. Eliminates $lookup for the common case; accept stale risk if the user changes their name.',
        'Use extended reference for: data that rarely changes (user name, product SKU, category name) and that is displayed in list views where you don\'t want to join per row. Refresh the extended data when the source changes.',
        'The <strong>polymorphic pattern</strong> stores documents of different types (shapes) in the same collection. A <code>type</code> field discriminates between them. Useful for: content management (articles, videos, podcasts in one feed), payment methods (card, PayPal, bank transfer), notifications.',
        'Design JSON Schema validators to be flexible enough for polymorphism: use <code>oneOf</code> or <code>anyOf</code> in $jsonSchema, or validate type-specific required fields in application code.',
        'The <strong>version pattern</strong> adds a <code>schemaVersion: 1</code> field to each document. As your schema evolves, increment the version. On read, check the version and migrate the document to the latest shape before using it (lazy migration) — no bulk migration needed.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Embed vs Reference',
      language: 'typescript',
      code: `// ── EMBEDDING (one-to-few, always read together) ─────────────
// Order always needs its items — embed them
const orderEmbedded = {
  _id:      orderId,
  userId:   userId,
  status:   'pending',
  items: [                        // embedded items (bounded per order)
    { productId, name: 'Laptop', price: 999, qty: 1 },
    { productId, name: 'Mouse',  price: 29,  qty: 2 },
  ],
  total: 1057,
  createdAt: new Date(),
};

// ── REFERENCING (one-to-many, independent lifecycle) ───────────
// User can have thousands of orders — reference them
const userReferenced = {
  _id:   userId,
  name:  'Alice',
  email: 'alice@example.com',
  // No orders array here — orders collection references the user
};

const orderReferenced = {
  _id:    orderId,
  userId: userId,    // reference to users._id
  total:  1057,
};

// Fetch user with their orders: use $lookup or two queries
const userOrders = await db.collection('orders')
  .find({ userId })
  .sort({ createdAt: -1 })
  .limit(10)
  .toArray();`,
    },
    {
      label: 'Computed Pattern',
      language: 'typescript',
      code: `// Products store computed review stats to avoid aggregation on reads
const product = {
  _id:          productId,
  name:         'Laptop Pro',
  reviewCount:  248,           // pre-computed
  ratingTotal:  992,           // sum of all ratings
  avgRating:    4.0,           // ratingTotal / reviewCount
};

// When a new review is submitted, update BOTH collections:
async function addReview(productId: any, userId: any, rating: number, text: string) {
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      // 1. Insert the review
      await db.collection('reviews').insertOne(
        { productId, userId, rating, text, createdAt: new Date() },
        { session }
      );

      // 2. Update product stats atomically
      await db.collection('products').updateOne(
        { _id: productId },
        {
          $inc: { reviewCount: 1, ratingTotal: rating },
          $set: { avgRating: 0 }, // will recompute below
        },
        { session }
      );

      // Recompute average (or do it server-side in a separate pass)
      const product = await db.collection('products')
        .findOne({ _id: productId }, { projection: { reviewCount: 1, ratingTotal: 1 }, session });
      if (product) {
        await db.collection('products').updateOne(
          { _id: productId },
          { $set: { avgRating: product.ratingTotal / product.reviewCount } },
          { session }
        );
      }
    });
  } finally {
    await session.endSession();
  }
}`,
    },
    {
      label: 'Subset & Extended Ref',
      language: 'typescript',
      code: `// ── SUBSET PATTERN ──────────────────────────────────────────
// Product embeds 5 most recent reviews; full reviews in reviews collection
const productWithSubset = {
  _id:  productId,
  name: 'Laptop Pro',
  recentReviews: [   // max 5 — bounded subset
    { reviewer: 'Alice', rating: 5, text: 'Great!', date: new Date() },
    { reviewer: 'Bob',   rating: 4, text: 'Good.',  date: new Date() },
  ],
  reviewCount: 248,
};

// Add a review and maintain subset:
await db.collection('products').updateOne(
  { _id: productId },
  {
    $push: {
      recentReviews: {
        $each: [{ reviewer, rating, text, date: new Date() }],
        $slice: -5,       // keep only last 5
        $sort: { date: -1 },
      },
    },
    $inc: { reviewCount: 1 },
  }
);

// ── EXTENDED REFERENCE PATTERN ────────────────────────────
// Order stores user's display name inline to avoid join on list view
const orderWithExtRef = {
  _id:           orderId,
  userId:        userId,
  // Extended reference fields (denormalised from user document)
  userName:      'Alice',           // copied from users.name
  userEmail:     'alice@example.com', // copied from users.email
  total:         1057,
};
// When user.name changes, bulk update orders: updateMany({ userId }, { $set: { userName: newName } })`,
    },
    {
      label: 'JSON Schema Validation',
      language: 'typescript',
      code: `// Create collection with schema validation
await db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'price', 'category', 'createdAt'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 200,
          description: 'Product name — required string',
        },
        price: {
          bsonType: 'decimal',
          minimum: 0,
          description: 'Price in USD — required positive decimal',
        },
        category: {
          bsonType: 'string',
          enum: ['electronics', 'books', 'clothing', 'food'],
        },
        tags: {
          bsonType: 'array',
          items: { bsonType: 'string' },
          maxItems: 10,
        },
        createdAt: {
          bsonType: 'date',
        },
      },
    },
  },
  validationLevel: 'strict',   // 'strict' = validate all writes; 'moderate' = only valid docs
  validationAction: 'error',   // 'error' = reject invalid; 'warn' = log but accept
});

// Add or modify validation on existing collection
await db.command({
  collMod: 'products',
  validator: { $jsonSchema: { /* updated schema */ } },
  validationLevel: 'strict',
});`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Embedding unbounded arrays in a document',
      wrong: `// A popular post could have millions of comments — exceeds 16 MB!
const post = {
  _id: postId,
  title: 'My Post',
  comments: [    // can grow to millions of entries
    { user: 'Alice', text: '...' },
    // ... millions more
  ],
};`,
      right: `// Keep comments in a separate collection, reference the post
const comment = { postId: postId, user: 'Alice', text: '...', createdAt: new Date() };
await db.collection('comments').insertOne(comment);
// Index: createIndex({ postId: 1, createdAt: -1 })
// In post: embed only recentComments (subset pattern — last 5)`,
      explanation: 'MongoDB documents have a 16 MB size limit. Embedding an unbounded array (comments, events, messages) will eventually hit this limit. Use referencing for unbounded relationships, with the subset pattern for fast reads of the most recent items.',
    },
    {
      title: 'Designing schema for normalisation instead of for queries',
      wrong: `// Perfectly normalised — but requires 3 joins to render a product page
const product = { _id, categoryId, brandId };  // just IDs, no names
// Every page load: $lookup category, $lookup brand, $lookup reviews...`,
      right: `// Denormalise for the read path — embed category name and brand name
const product = {
  _id, price, name,
  category: { id: categoryId, name: 'Electronics' },  // extended reference
  brand:    { id: brandId, name: 'Acme Corp' },
  recentReviews: [...],  // subset
  reviewCount: 248,       // computed
};`,
      explanation: 'MongoDB schema design is query-driven. Normalisation is a relational database principle that minimises redundancy but creates JOIN overhead. In MongoDB, strategically denormalise for your hot read paths. Redundancy is acceptable when it eliminates expensive queries.',
    },
    {
      title: 'Not enforcing schema with $jsonSchema validation',
      wrong: `// No validation — any document shape can be inserted
await db.collection('products').insertOne({ price: 'free', name: 123 });
// "price" is a string instead of number — silent corruption`,
      right: `// Enforce schema at the database level
await db.createCollection('products', {
  validator: { $jsonSchema: {
    required: ['name', 'price'],
    properties: {
      name:  { bsonType: 'string' },
      price: { bsonType: 'decimal', minimum: 0 },
    }
  }},
  validationAction: 'error',
});`,
      explanation: 'MongoDB\'s flexible schema is a feature, but without validation, wrong types and missing fields silently corrupt your data. Use $jsonSchema validator to enforce field types and required fields at the database level, complementing application-layer validation.',
    },
    {
      title: 'Storing a one-to-many relationship as an array on the "many" side',
      wrong: `// Array of all user IDs who liked a post — could be millions
const post = { _id, title, likedBy: [userId1, userId2, ...] };
// Checking if currentUser liked: { _id: postId, likedBy: currentUserId }
// Works but array grows unboundedly`,
      right: `// Use a separate "likes" collection for true many-to-many at scale
// likes: { postId, userId, createdAt }
// Unique compound index: { postId: 1, userId: 1 }
// Check: col.findOne({ postId, userId: currentUserId })
// Count: col.countDocuments({ postId }) + store in post.likeCount (computed pattern)`,
      explanation: 'Storing large arrays of IDs (likes, followers, viewers) in a document creates unbounded growth. For many-to-many relationships at scale, use a separate junction collection with compound indexes — it\'s fast, scalable, and avoids the 16 MB document limit.',
    },
  ];

  challenge: Challenge = {
    title: 'E-Commerce Product Schema',
    language: 'typescript',
    description: 'Design a MongoDB schema for an e-commerce product. Apply: (1) Computed pattern for avgRating and reviewCount. (2) Subset pattern for recentReviews (last 3). (3) Extended reference for category name alongside categoryId. (4) Write the addReview function that atomically updates both the reviews collection and the product stats.',
    hints: [
      'Product document should have: name, price, categoryId, categoryName (extended ref), reviewCount, ratingSum, avgRating (computed), recentReviews (subset, max 3).',
      'addReview does two writes: insertOne to reviews, updateOne on product.',
      'Use $push with $each/$slice/-3 for the subset.',
      'avgRating = ratingSum / reviewCount — compute after incrementing both.',
    ],
    starterCode: `import { MongoClient, ObjectId } from 'mongodb';
const db = (new MongoClient('mongodb://localhost:27017')).db('shop');

// TODO: Define the product document shape
// TODO: Write addReview(productId, userId, rating, text) that:
//   1. Inserts into reviews collection
//   2. Updates product: $inc reviewCount+1 and ratingSum+rating
//   3. Updates recentReviews subset (last 3)
//   4. Updates avgRating`,
    solution: `import { MongoClient, ObjectId, Decimal128 } from 'mongodb';
const client = new MongoClient('mongodb://localhost:27017');
const db = client.db('shop');

// Product schema with patterns applied
const sampleProduct = {
  name:          'Laptop Pro 15',
  price:         Decimal128.fromString('999.99'),
  categoryId:    new ObjectId(),
  categoryName:  'Electronics',       // extended reference
  reviewCount:   0,                   // computed
  ratingSum:     0,                   // computed (for average)
  avgRating:     0,                   // computed
  recentReviews: [],                  // subset (max 3)
};

async function addReview(productId: ObjectId, userId: ObjectId, rating: number, text: string) {
  const review = { productId, userId, rating, text, createdAt: new Date() };

  // Insert review
  await db.collection('reviews').insertOne(review);

  // Update product stats + subset + avgRating in ONE atomic call, using
  // an update-with-aggregation-pipeline (an array of $set stages) rather
  // than a separate findOneAndUpdate + updateOne. A LATER $set stage in
  // this array CAN reference a field set by an earlier stage in the SAME
  // array (unlike a single $addFields stage's sibling fields) -- so
  // avgRating is computed from the freshly-incremented reviewCount/
  // ratingSum, atomically, with no separate write that could read a
  // stale snapshot if another addReview() runs concurrently in between.
  await db.collection('products').updateOne(
    { _id: productId },
    [
      { $set: {
        reviewCount: { $add: ['$reviewCount', 1] },
        ratingSum:   { $add: ['$ratingSum', rating] },
        recentReviews: {
          $slice: [
            { $sortArray: {
              input: { $concatArrays: ['$recentReviews', [{ userId, rating, text, createdAt: new Date() }]] },
              sortBy: { createdAt: -1 },
            }},
            3,
          ],
        },
      }},
      { $set: {
        avgRating: { $round: [{ $divide: ['$ratingSum', '$reviewCount'] }, 1] },
      }},
    ]
  );
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary criterion for choosing embedding over referencing?',
      options: [
        'The data is large and changes frequently',
        'The related data is always accessed together and is bounded in size',
        'The related data needs its own independent lifecycle',
        'The data needs to be shared across many parent documents',
      ],
      answer: 1,
      explanation: 'Embed when: the data is always read with the parent, the relationship is one-to-few (bounded), and the data belongs only to this parent. Reference when: the data is unbounded, shared across parents, or needs an independent lifecycle.',
    },
    {
      q: 'Which pattern pre-computes and stores aggregated values (like review counts) at write time?',
      options: ['Subset Pattern', 'Computed Pattern', 'Bucket Pattern', 'Extended Reference Pattern'],
      answer: 1,
      explanation: 'The Computed Pattern pre-stores aggregated values (counts, averages, totals) in the parent document, updating them atomically each time the underlying data changes. This makes reads fast by eliminating aggregation queries.',
    },
    {
      q: 'What problem does the Bucket Pattern solve?',
      options: [
        'Large numbers of small documents in time-series data',
        'Documents exceeding the 16 MB limit',
        'Many-to-many relationship modeling',
        'Schema version migrations',
      ],
      answer: 0,
      explanation: 'The Bucket Pattern groups many small time-series data points (sensor readings, logs) into "bucket" documents. This reduces document count, index size, and improves time-range query performance by reading fewer documents.',
    },
    {
      q: 'What does the Extended Reference Pattern do?',
      options: [
        'Extends the MongoDB document size limit beyond 16 MB',
        'Stores copies of frequently-accessed fields from a referenced document inline',
        'Adds version fields to all documents',
        'References documents across multiple databases',
      ],
      answer: 1,
      explanation: 'The Extended Reference Pattern copies key fields from a referenced document into the parent document to avoid $lookup on reads. Example: storing the user\'s name alongside their userId in each order to avoid joining the users collection on every order list view.',
    },
    {
      q: 'What does the Polymorphic Pattern require?',
      options: [
        'Separate collections for each document type',
        'A "type" discriminator field within a shared collection',
        'Multiple databases for different schemas',
        'GridFS for handling different file types',
      ],
      answer: 1,
      explanation: 'The Polymorphic Pattern stores documents of different types (shapes) in one collection, using a "type" field to discriminate between them. This enables querying across all types with a single query while handling type-specific logic in the application.',
    },
    { q: 'When the customer\'s name embedded via the Extended Reference Pattern changes, what are the two main strategies to propagate that change to every order document that embedded it?', options: ['MongoDB automatically propagates the change to all documents referencing that customerId', 'Either accept staleness deliberately (historical orders keep the OLD name, which is often correct behavior for point-in-time records), or run an explicit background update (a change-stream-triggered job that finds and updates all documents embedding that customer\'s data) to actively sync the copies', 'The only option is to switch back to a pure reference with $lookup', 'Extended Reference Pattern fields must be immutable and can never actually change'], answer: 1, explanation: 'Because the embedded copy is denormalized, MongoDB has no built-in mechanism to keep it in sync with the source document — that responsibility falls entirely on the application. Two legitimate strategies: (1) treat staleness as CORRECT, not a bug — an order\'s shipping address should reflect what it was at order time, not the customer\'s current address, so no sync is needed; or (2) for fields that should stay current, listen to change streams on the customer collection and run a background job that updates(or replaces) the embedded copy across all referencing documents whenever the source changes — an eventual-consistency propagation, not an atomic one.' },
    { q: 'What is the Subset Pattern and what problem does it solve in MongoDB?', options: ['The Subset Pattern creates a separate collection containing only a subset of fields from a large collection, essentially acting as a view for performance', 'The Subset Pattern stores the most-accessed portion of a large document in the main collection and moves the less-frequently-accessed data to a separate overflow collection', 'The Subset Pattern partitions a large collection into subsets based on a field value (e.g., by year) to improve query performance on recent data', 'The Subset Pattern is a sharding strategy that assigns document subsets to specific shards based on a deterministic hash'], answer: 1, explanation: 'Problem: a product document has thousands of reviews. Loading the full product with all reviews is slow and memory-intensive, but most UI only shows the latest 10 reviews. Working set: MongoDB performs best when the working set (frequently accessed data) fits in RAM. A large reviews array for every product bloats document size and the working set. Subset Pattern solution: main products collection: { _id: 1, name: "Widget", price: 9.99, reviews: [ /* latest 10 reviews only */ ] }. Separate reviews collection: { _id: 1, productId: 1, rating: 5, text: "Great product", createdAt: ... }. Benefits: product documents are small and fast to load. The working set for common product page loads fits in RAM. Full review history is available via a separate query when needed. Implementation: on insert of a new review, insert to reviews collection and use $push with $slice: -10 to keep only the last 10 in the product subdocument. When to use: when a document has a large array where only a subset is needed on most reads.' },
    { q: 'Why does the manual Bucket Pattern require you to choose a bucket size (e.g. 1 hour or 200 readings) upfront, and what happens if that choice turns out to be wrong for a device\'s actual data rate?', options: ['The bucket size can be changed retroactively with a single MongoDB command', 'The bucket boundary is baked into each document as it\'s written — if a device\'s actual reading frequency is much higher or lower than assumed, buckets end up far too full (risking the 16MB document limit) or far too sparse (losing the compression/indexing benefit), and fixing this requires migrating already-written data to a new bucket scheme', 'Bucket size only affects query performance, never storage correctness', 'MongoDB automatically resizes buckets based on observed data rates'], answer: 1, explanation: 'A manually-implemented Bucket Pattern hardcodes its bucketing logic (e.g. "one bucket per hour per device") into application write code — if a device that was expected to send 1 reading/second suddenly sends 100/second (a firmware bug, a burst mode), its hourly buckets can approach or exceed the 16MB document size limit, causing write failures; conversely a device sending far fewer readings than expected wastes the pattern\'s main benefit (many small documents merged into few larger ones). This inflexibility is exactly why MongoDB 5.0+ native time series collections are usually preferred over hand-rolling the Bucket Pattern — the database handles bucket sizing and boundaries adaptively instead of the application guessing upfront.' },
    { q: 'What is the Attribute Pattern in MongoDB schema design and when is it useful?', options: ['The Attribute Pattern adds metadata attributes (like "createdAt" and "updatedAt") to every document automatically using a schema middleware', 'The Attribute Pattern converts a set of fields that share similar characteristics into an array of key-value pairs, enabling a single index to cover searches across all those fields', 'The Attribute Pattern is an inheritance pattern where child document types add additional attributes to a base schema defined in a parent schema', 'The Attribute Pattern stores document attributes as separate single-field documents in an attribute collection, similar to the EAV (Entity-Attribute-Value) model in SQL'], answer: 1, explanation: 'Problem: a product catalog has products with different searchable attributes — movies have director, language, subtitles; books have author, isbn, genre; electronics have voltage, wattage. Putting all possible attributes as top-level fields creates many sparse fields (most fields are null for any given product). Creating an index per attribute is expensive and hits the 64-index limit. Attribute Pattern solution: instead of { director: "Nolan", language: "English", author: null, isbn: null }, use: { specs: [ { k: "director", v: "Nolan" }, { k: "language", v: "English" } ] }. Create one compound index: { "specs.k": 1, "specs.v": 1 }. Query: { specs: { $elemMatch: { k: "director", v: "Nolan" } } }. Benefits: one index covers all attribute searches regardless of attribute name. Sparse fields problem is eliminated. Adding new attribute types requires no schema change. Tradeoffs: queries are less readable. Cannot enforce types per attribute without validation rules.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the "rule of three" for schema design in MongoDB?',
      a: 'The informal rule: if you embed data in three or fewer distinct parent documents, embedding is fine. If the same data would need to be embedded in many (unbounded) documents, or if it\'s updated independently of its parents, use referencing. More precisely: consider the relationship cardinality (one-to-one, one-to-few, one-to-many, one-to-squillions) and the access pattern (always read together? updated separately?).',
    },
    {
      q: 'When should I use $jsonSchema validation vs Mongoose schema?',
      a: '<strong>$jsonSchema in MongoDB</strong>: enforces basic type/field constraints at the database level, before reaching the application. Protects against bugs from multiple client types or direct database writes. Simpler constraints only (types, required fields, enums). <strong>Mongoose schema</strong>: enforces complex application-level validation (custom validators, cross-field rules, pre/post hooks). Works only when data comes through Mongoose. Use both: $jsonSchema for basic data integrity, Mongoose for complex business rules.',
    },
    {
      q: 'How do I handle a schema migration in MongoDB?',
      a: 'Three strategies: (1) <strong>Big-bang migration</strong>: update all documents at once with <code>updateMany</code>. Simple but risky (blocking, potential downtime). (2) <strong>Lazy migration (Version Pattern)</strong>: add a <code>schemaVersion</code> field; on each read, migrate old-version documents to the new shape and save back. Zero downtime but requires application code to handle all schema versions. (3) <strong>Dual-write</strong>: write data in both old and new format simultaneously during a transition period. Then backfill, switch reads, and retire the old format.',
    },
    {
      q: 'What is the maximum document size and how do I work around it?',
      a: 'MongoDB\'s maximum document size is <strong>16 MB</strong>. For documents that would exceed this: (1) <strong>Referencing</strong>: move large arrays to a separate collection. (2) <strong>Subset Pattern</strong>: embed only the most relevant subset. (3) <strong>GridFS</strong>: for large binary files (images, PDFs, videos) — GridFS splits them into 255 KB chunks stored in <code>fs.chunks</code>. (4) <strong>Bucket Pattern</strong>: accumulate data points into bounded bucket documents.',
    },
    {
      q: 'What are the different tree structure patterns in MongoDB?',
      a: '<strong>Parent Reference</strong>: each node stores its parent\'s ID. Simple; easy to update the hierarchy. Finding descendants requires multiple queries. <strong>Child Reference</strong>: each node stores an array of children IDs. Easy to find direct children; hard to find all descendants. <strong>Materialised Path</strong>: each node stores the full path string (e.g., "/root/child/grandchild"). Easy to find all ancestors/descendants with $regex. <strong>Nested Sets</strong>: stores left/right boundary values. Very fast reads for subtrees; expensive writes (must recompute boundaries). Choose based on read vs write frequency.',
    },
    { q: 'What is the Computed Pattern in MongoDB and when should it be used?', a: 'Computed Pattern: pre-compute and store the result of a calculation in the document to avoid recalculating it on every read. Problem: a blog post has thousands of comments. Every page load runs db.comments.countDocuments({ postId: id }) to show the comment count. Under heavy read traffic, this aggregation runs thousands of times per second. Computed Pattern solution: store the count directly in the post document: { _id: 1, title: "My Post", commentCount: 342 }. On each comment insert, use $inc to increment commentCount: db.posts.updateOne({ _id: postId }, { $inc: { commentCount: 1 } }). Read: commentCount is always available instantly, no aggregation needed. Applicability: ratios, totals, averages, rankings, sums — any value that is derived from data and read frequently. Tradeoffs: data can be slightly stale if updates are batched. Adds complexity to write path. Extended use case: store daily/weekly aggregations in a separate summary document that is recalculated nightly. The main collection is not modified. Pattern is effective when: reads greatly outnumber writes, recalculation is expensive, and perfect real-time accuracy is not required.' },
    { q: 'What is the Outlier Pattern in MongoDB schema design?', a: 'Outlier Pattern: a specialization of the Subset Pattern designed for data with extreme variation in array or sub-document size. Problem: most blog posts have under 100 comments, but viral posts have 50,000. The Bucket or Subset Pattern helps most posts. But viral posts overflow the bucket. Outlier Pattern solution: for normal posts, keep comments inline. For posts with comment counts exceeding a threshold, set a flag and store the overflow in a separate collection. { _id: 1, comments: [ /* first 100 */ ], hasMore: true }. Overflow: separate overflow_comments collection with { postId: 1, comments: [ /* remaining */ ] }. Application logic: read comments for postId. If hasMore, also query overflow_comments. For 99.9% of posts, no overflow query is needed. Benefits: normal documents stay small and efficient. Outliers are handled without bloating the collection for everyone. Tradeoffs: application code must handle the hasMore flag. Outlier documents are split across collections, complicating atomic updates. When outlier count exceeds a threshold, split into a new overflow document. Use case: social media likes/shares (most posts: 10 likes; viral posts: 10 million), document collaborators (most: 1-2, some: hundreds).' },
    { q: 'What is the Schema Versioning Pattern in MongoDB?', a: 'Schema Versioning Pattern: maintain a schema_version field in every document to identify its schema shape, enabling gradual migration without downtime. Problem: schema changes are common (adding fields, renaming, restructuring). In SQL, you run a migration that alters all rows. In MongoDB, a lazy migration is possible — update documents one at a time as they are accessed. Implementation: add schema_version: 1 to all existing documents. New schema: schema_version: 2. Application code handles both versions: if (doc.schema_version === 1) { // handle old shape } else { // handle new shape }. Lazy migration: when a document is read and found to be version 1, update it to version 2 in the same request. Eventually all documents are migrated. Forced migration: run a background job to migrate all version 1 documents during low-traffic periods. Benefits: zero-downtime schema evolution. No single massive migration operation. Tradeoffs: application code must support multiple schema versions simultaneously. Complicates queries that need to cover both shapes. Version 1 query: { $or: [{ oldField: value }, { newField: value }] } is less clean than { newField: value }. When to skip: simple field additions (new optional fields are automatically supported with null checks). Use Schema Versioning only for breaking changes (renames, type changes, structural reorganization).' },
    { q: 'When is the Approximation Pattern useful in MongoDB?', a: 'Approximation Pattern: accept slightly inaccurate values to dramatically reduce write load for high-frequency counter updates. Problem: a website counter increments for every page view. A popular page has 10,000 views per second. Updating viewCount on every view means 10,000 writes per second to a single document — a write hotspot. The exact count is not important for display purposes. Approximation Pattern solution: instead of incrementing on every view, increment by a random amount only occasionally. Option 1: threshold-based: track views in application memory. When the in-memory count reaches 100, write $inc: { viewCount: 100 } to MongoDB. Result: 1 write per 100 views instead of 1 write per view. Option 2: random sampling: increment only when Math.random() < 0.01 (1% of views), but increment by 100 each time. Expected value stays correct. Result: probabilistically accurate count with 99% fewer writes. Benefits: massively reduced write load. Eliminates write hotspot on popular documents. Acceptable for use cases where exact counts are not required. Tradeoffs: count is not exact — may be slightly under or over. If the application restarts before flushing the in-memory count, those views are lost. Not suitable for billing, inventory, or any scenario requiring exact counts. Works well for: page views, video play counts, social media engagement counts.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'MongoDB schema design is query-driven: embed for "one-to-few" always-read-together data; reference for unbounded or independently-updated data; apply patterns for specific problems.',
    mustKnow: [
      'Embed: bounded, always read together, owned by one parent',
      'Reference: unbounded, shared across many parents, independent lifecycle',
      'Subset: embed a bounded N most-recent/important items; full data in separate collection',
      'Computed: pre-store aggregates (counts, averages) updated atomically at write time',
      'Bucket: group time-series data points into bounded bucket documents',
      'Extended Reference: copy key fields from referenced doc to avoid $lookup on reads',
      '$jsonSchema: enforce types and required fields at the database level',
    ],
    interviewFocus: [
      'Embed vs reference decision criteria',
      'Computed pattern for high-read aggregates (rating counts, follower counts)',
      'Subset pattern for bounded embedded arrays',
      'Why normalisation isn\'t always the right choice in MongoDB',
      'Schema versioning strategies for migrations',
    ],
  };
}
