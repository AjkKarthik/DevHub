import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-node-mongoose',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './mongoose.html',
  styleUrl: './mongoose.scss'
})
export class NodeMongoose {
  quickRef: QuickRefItem[] = [
    { name: 'Schema', type: 'class', desc: 'Defines structure, types, validation, and defaults for a MongoDB collection.' },
    { name: 'model(name, schema)', type: 'function', desc: 'Creates a Model class bound to a collection. Export and reuse — never call twice.' },
    { name: 'Model.find(filter)', type: 'method', desc: 'Returns a Query object. Supports chaining: .select(), .populate(), .sort(), .limit(), .lean().' },
    { name: '.populate(path)', type: 'method', desc: 'Replaces ObjectId references with the actual referenced documents (like a SQL JOIN).' },
    { name: '.lean()', type: 'method', desc: 'Returns plain JS objects instead of Mongoose Documents. Faster reads — no virtuals, methods, or tracking.' },
    { name: 'Schema.virtual()', type: 'method', desc: 'Computed property not stored in DB. Must use { toJSON: { virtuals: true } } to include in responses.' },
    { name: 'Schema pre/post hooks', type: 'method', desc: 'Middleware that runs before (pre) or after (post) save, find, delete operations.' },
    { name: 'mongoose.startSession()', type: 'method', desc: 'Start a session for multi-document transactions (requires MongoDB replica set).' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Schemas, Models, and Validation',
      points: [
        'Mongoose brings structure to MongoDB\'s schema-less documents. A Schema defines field types (String, Number, Boolean, Date, ObjectId, Mixed, Buffer), required/default values, enum constraints, and custom validators.',
        'The Schema type system enforces types at the Mongoose layer (not MongoDB). MongoDB itself accepts any document shape. Mongoose validates before every save — invalid documents throw a ValidationError without hitting the database.',
        'Subdocuments embed a nested schema inside a parent. Arrays of subdocuments (blogPost.comments) are treated as embedded arrays with their own _id by default. Subdocuments support their own validators and middleware.',
        'Model.create() is a shorthand for new Model() + .save(). For bulk inserts, use Model.insertMany() — bypasses middleware (pre-save hooks do NOT run). Use it only for seed data where hooks are intentionally skipped.',
      ]
    },
    {
      heading: 'Querying — Populate, Lean, and Aggregation',
      points: [
        '.populate() loads referenced documents in a second query. Behind the scenes, Mongoose runs an $in query for all ObjectIds in the result set. Avoid populating deeply nested references — each level is another round trip.',
        '.lean() tells Mongoose to return plain JavaScript objects instead of Mongoose Documents. Documents carry change tracking, prototype methods, virtuals, and getters — all overhead for read-only API responses. .lean() can be 5x faster for large result sets.',
        'Aggregation pipeline: Model.aggregate([{ $match }, { $group }, { $project }, { $sort }]). MongoDB\'s most powerful query feature. Use for computed groupings, stats, and transformations that are impractical with Model.find().',
        'Indexes are critical for MongoDB performance. Schema.index({ field: 1 }) creates an ascending index. Compound indexes: { field1: 1, field2: -1 }. Use explain() in MongoDB shell to verify queries use indexes. Without indexes, MongoDB does full collection scans.',
      ]
    },
    {
      heading: 'Middleware, Virtuals, and Transactions',
      points: [
        'Schema pre/post middleware runs at defined points: pre("save") for hashing passwords before saving, pre("find") for soft-delete filters, post("save") for sending confirmation emails.',
        'pre("find") and pre("findOne") are chained from the Query context — use this.getFilter() to inspect/modify the query. Add { deletedAt: null } in pre("find") to implement soft delete across all find operations.',
        'Virtuals are computed properties not stored in MongoDB: fullName computed from firstName + lastName. They appear in JSON only when { toJSON: { virtuals: true } } is set on the schema (or { toObject: { virtuals: true } } for .toObject()).',
        'Transactions require a MongoDB replica set (or Atlas, which always uses replica sets). Use mongoose.startSession() + session.withTransaction(() => { ... }) for atomic multi-document operations. Pass { session } to every Mongoose operation inside the transaction.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Schema, Model, and Queries',
      language: 'typescript',
      code: `import mongoose, { Schema, model } from 'mongoose';

// Schema definition
const userSchema = new Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  age:      { type: Number, min: 0, max: 150 },
  profile:  {                     // embedded subdocument
    bio:    String,
    avatar: String,
  },
  posts:    [{ type: Schema.Types.ObjectId, ref: 'Post' }],  // reference
}, { timestamps: true });         // adds createdAt, updatedAt automatically

// Virtual property
userSchema.virtual('displayName').get(function () {
  return \`\${this.name} (\${this.email})\`;
});
userSchema.set('toJSON', { virtuals: true });

// Pre-save middleware: hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export const User = model('User', userSchema);

// Queries
const user = await User.findById(id).lean();              // plain JS object, faster
const users = await User.find({ role: 'admin' })
  .select('name email -_id')                             // include/exclude fields
  .sort({ createdAt: -1 })
  .limit(10)
  .populate('posts', 'title publishedAt')                // load post docs (2nd query)
  .lean();`
    },
    {
      label: 'Aggregation and Transactions',
      language: 'typescript',
      code: `// Aggregation pipeline — user post counts by role
const stats = await User.aggregate([
  { $match: { role: 'admin' } },
  { $lookup: {
      from: 'posts',            // collection name (lowercase plural)
      localField: '_id',
      foreignField: 'authorId',
      as: 'posts',
  }},
  { $addFields: { postCount: { $size: '$posts' } } },
  { $project: { name: 1, postCount: 1, _id: 0 } },
  { $sort: { postCount: -1 } },
]);

// Multi-document transaction (requires replica set)
const session = await mongoose.startSession();
await session.withTransaction(async () => {
  const order = await Order.create([{ userId, items, total }], { session });
  await Inventory.updateMany(
    { productId: { $in: items.map(i => i.productId) } },
    { $inc: { stock: -1 } },
    { session }
  );
  await User.updateOne(
    { _id: userId },
    { $push: { orders: order[0]._id } },
    { session }
  );
});
await session.endSession();

// Soft delete pattern with pre('find') middleware
orderSchema.pre(/^find/, function () {
  this.where({ deletedAt: null });  // auto-exclude deleted from all finds
});`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Calling model() multiple times (OverwriteModelError)',
      wrong: `// In a helper or test file called multiple times:
const User = mongoose.model('User', userSchema); // throws if already registered`,
      right: `const User = mongoose.models.User || mongoose.model('User', userSchema);
// OR: define Model in a dedicated file and import it everywhere`,
      explanation: 'Mongoose registers models globally. Calling mongoose.model("User", schema) a second time throws OverwriteModelError. Check mongoose.models first, or (better) define each model in its own file and import it — module caching ensures it runs once.'
    },
    {
      title: 'Not using .lean() for read-only API responses',
      wrong: `const users = await User.find({}); // returns Mongoose Documents with overhead`,
      right: `const users = await User.find({}).lean(); // plain JS objects — 5x faster for reads`,
      explanation: 'Mongoose Documents carry change-tracking, virtuals, prototype methods, and getters. For API responses you return immediately, this overhead is wasted. .lean() returns raw JS objects and significantly improves performance on large result sets.'
    },
    {
      title: 'Populating deeply nested references in a loop',
      wrong: `for (const post of posts) {
  await post.populate('author'); // separate DB query per post (N+1)
}`,
      right: `const posts = await Post.find({}).populate('author').lean(); // single $in query for all authors`,
      explanation: '.populate() on the query runs a single $in query for all ObjectIds in the result. Populating inside a loop runs one query per document. Always populate at the query level, not document level.'
    },
    {
      title: 'insertMany bypasses pre-save middleware',
      wrong: `await User.insertMany(usersWithPlaintextPasswords); // pre-save hash hook DOES NOT run`,
      right: `// For hooks: use Model.create() or save() individually
await Promise.all(users.map(u => new User(u).save()));
// OR hash passwords before calling insertMany()`,
      explanation: 'Model.insertMany() skips all document middleware (pre/post save hooks) for performance. If you use pre("save") to hash passwords, encode data, or set fields, those hooks are bypassed. Use create() or save() when middleware must run.'
    },
  ];

  challenge: Challenge = {
    title: 'Blog Schema with Virtuals and Middleware',
    language: 'typescript',
    description: 'Define a Mongoose schema for a Blog Post with: title (required, trimmed), content (required), slug (auto-generated from title in pre-save), tags (array of strings), author (ObjectId ref to User), viewCount (Number, default 0), and a virtual readingTime (computed: Math.ceil(wordCount / 200) minutes). Include timestamps. Export the model.',
    hints: [
      'Use pre("save") with this.isNew || this.isModified("title") to generate slug',
      'Slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-")',
      'Virtual: this.content.split(/\\s+/).length for word count',
    ],
    starterCode: `import mongoose, { Schema, model } from 'mongoose';

const postSchema = new Schema({
  // TODO: define fields
}, { timestamps: true });

// TODO: add readingTime virtual
// TODO: add pre-save hook for slug

export const Post = model('Post', postSchema);`,
    solution: `import mongoose, { Schema, model } from 'mongoose';

const postSchema = new Schema({
  title:      { type: String, required: true, trim: true },
  content:    { type: String, required: true },
  slug:       { type: String, unique: true },
  tags:       [{ type: String, lowercase: true, trim: true }],
  author:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  viewCount:  { type: Number, default: 0 },
}, { timestamps: true });

postSchema.virtual('readingTime').get(function () {
  const words = this.content.split(/\\s+/).length;
  return Math.ceil(words / 200); // minutes
});
postSchema.set('toJSON', { virtuals: true });

postSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('title')) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-\$/g, '');
  }
  next();
});

postSchema.index({ slug: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ author: 1, createdAt: -1 });

export const Post = model('Post', postSchema);`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does .lean() do in a Mongoose query?', options: ['Reduces the number of fields returned', 'Returns plain JavaScript objects instead of Mongoose Documents', 'Caches the query result', 'Enables lean (lazy) loading of relations'], answer: 1, explanation: '.lean() tells Mongoose to return raw JavaScript objects without Document overhead. No change tracking, virtuals, methods, or prototype chain. Significantly faster for read-only API responses.' },
    { q: 'When does Model.insertMany() NOT call pre-save middleware?', options: ['When the array has more than 100 items', 'Always — insertMany never calls pre-save hooks by default', 'Only when in a transaction', 'When using { ordered: false }'], answer: 1, explanation: 'insertMany() bypasses all document middleware (pre/post save) for performance. Use Model.create() or .save() individually when pre-save hooks (e.g. password hashing) must run.' },
    { q: 'Why must you set toJSON: { virtuals: true } on a Mongoose schema?', options: ['To enable schema validation', 'To include virtual properties when calling JSON.stringify or res.json()', 'To store virtuals in MongoDB', 'To enable populate() on virtuals'], answer: 1, explanation: 'Mongoose virtuals are computed at the Mongoose layer, not stored in MongoDB. By default, .toJSON() and res.json() exclude them. Setting toJSON: { virtuals: true } includes them in serialized output.' },
    { q: 'What is required to use Mongoose transactions?', options: ['Mongoose 5+', 'A MongoDB standalone instance', 'A MongoDB replica set (or Atlas)', 'Session middleware'], answer: 2, explanation: 'Multi-document transactions require MongoDB replica set transactions. A standalone MongoDB instance does not support transactions. MongoDB Atlas always uses replica sets and supports transactions out of the box.' },
    { q: 'What does Mongoose pre("save") middleware do?', options: ['Validates the document before saving', 'Runs an async function before save — commonly used for hashing passwords or updating timestamps', 'Caches the document for faster subsequent reads', 'Prevents duplicate saves'], answer: 1, explanation: 'schema.pre("save", async function(next) { ... }) runs before each document is saved. The keyword function (not arrow) is used so "this" refers to the document. Common uses: bcrypt.hash(this.password) before save, updating updatedAt timestamp, normalising email to lowercase. Call next() to proceed or next(err) to abort.' },
    { q: 'What is the difference between .lean() and the default Mongoose query result?', options: ['.lean() disables population of references', '.lean() returns plain JavaScript objects instead of Mongoose Document instances — significantly faster for read-only data', '.lean() skips validation on save', '.lean() converts ObjectIds to strings'], answer: 1, explanation: 'Default query results are Mongoose Document instances with methods (save(), toJSON(), virtual accessors) and change tracking. .lean() skips all that and returns plain JS objects — 3–5× faster and uses less memory. Use .lean() for read-only API responses where you do not need to modify and save the document.' },
  ];

  qna: QnaItem[] = [
    { q: 'Should I use Mongoose or the native MongoDB driver?', a: 'Mongoose for applications where you want schema validation, middleware hooks, virtuals, and a developer-friendly query API. Native driver for maximum performance and control — no schema layer overhead, direct access to MongoDB features like bulk operations and change streams. Large teams often use Mongoose for application code and the native driver for complex aggregations or batch jobs where every millisecond counts.' },
    { q: 'How do I implement soft delete in Mongoose?', a: 'Add deletedAt: { type: Date, default: null } to your schema. Add a pre find middleware: schema.pre(/^find/, function() { this.where({ deletedAt: null }); }). For delete operations, update deletedAt instead of calling .deleteOne(): Document.updateOne({ deletedAt: new Date() }). To query deleted records explicitly, bypass the middleware with .findOne({ deletedAt: { $ne: null } }).' },
    { q: 'What is the difference between embedded documents and references in Mongoose?', a: 'Embedded (subdocuments): data lives inside the parent document — one MongoDB read gets everything. Best when the data is always accessed together, not too large, and uniquely owned (post.comments). References (ObjectId + populate): data in a separate collection — requires a second query (populate). Best when the data is shared across parents (user referenced by many posts), frequently updated independently, or the embedded array would grow unboundedly.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Mongoose adds schema validation, middleware, and virtuals to MongoDB. Use .lean() for reads, .populate() at query level for relations, and replica sets for transactions.',
    mustKnow: [
      'Schema defines types, validation, and defaults — not stored in MongoDB.',
      '.lean() returns plain objects — faster for read-only responses.',
      '.populate() runs a $in query — always at query level, not in a loop.',
      'pre("save") hooks run on save() and create(), NOT insertMany().',
      'Virtuals need toJSON: { virtuals: true } to appear in serialized output.',
      'Transactions require a MongoDB replica set.',
      'Indexes are critical — without them, full collection scans on every query.',
    ],
    interviewFocus: [
      'When would you use embedded subdocuments vs references?',
      'What does .lean() do and when should you use it?',
      'How does Mongoose middleware (hooks) work?',
    ]
  };
}
