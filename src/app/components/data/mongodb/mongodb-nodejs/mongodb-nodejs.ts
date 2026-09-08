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
  selector: 'app-mongo-mongodb-nodejs',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './mongodb-nodejs.html',
  styleUrl: './mongodb-nodejs.scss',
})
export class MongoMongodbNodejs {
  quickRef: QuickRefItem[] = [
    { type: 'method',  name: 'new MongoClient(uri)',        desc: 'Create a client. Does not connect immediately — call connect() or let the driver auto-connect on first operation.' },
    { type: 'method',  name: 'client.db(name)',             desc: 'Get a Db object. Does not create the database — it is created on first write.' },
    { type: 'method',  name: 'db.collection(name)',         desc: 'Get a Collection object. Chainable with all CRUD methods.' },
    { type: 'method',  name: 'collection.findOne(filter)',  desc: 'Return one matching document or null.' },
    { type: 'method',  name: 'collection.find(filter)',     desc: 'Return a cursor. Call .toArray(), .forEach(), or async iterate.' },
    { type: 'method',  name: 'collection.insertOne(doc)',   desc: 'Insert a document. Returns { insertedId }.' },
    { type: 'method',  name: 'collection.updateOne(f, u)',  desc: 'Update first matching document. Returns { matchedCount, modifiedCount }.' },
    { type: 'method',  name: 'collection.deleteOne(f)',     desc: 'Delete first matching document. Returns { deletedCount }.' },
    { type: 'method',  name: 'collection.aggregate(pipe)',  desc: 'Run an aggregation pipeline. Returns a cursor.' },
    { type: 'keyword', name: 'ObjectId',                   desc: 'BSON type for MongoDB _id. Import from "mongodb". Use new ObjectId(idStr) to convert string IDs.' },
    { type: 'keyword', name: 'MongoServerError',           desc: 'Thrown for server-side errors (duplicate key, validation failure). Check err.code.' },
    { type: 'keyword', name: 'maxPoolSize',                desc: 'Connection pool size option. Default 100. Tune based on your workload.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Driver Setup & Connection Pooling',
      points: [
        'Install: <code>npm install mongodb</code>. The official MongoDB Node.js driver is the foundation for all MongoDB access in Node.js — Mongoose is built on top of it. For TypeScript, types are included in the package.',
        'Create a single <code>MongoClient</code> instance and reuse it throughout your application. Each client maintains a <strong>connection pool</strong> (default: up to 100 connections). Creating a new MongoClient per request is a severe anti-pattern — it exhausts connections and is very slow.',
        'Connection string formats: <code>mongodb://host:27017/dbname</code> (standalone), <code>mongodb://host1,host2,host3/?replicaSet=rs0</code> (replica set), <code>mongodb+srv://cluster.mongodb.net/dbname</code> (Atlas SRV — auto-discovers replica set members).',
        'The driver automatically handles: connection pooling, reconnection after network errors, server discovery (SDAM), primary re-election detection, and load balancing in sharded clusters. You do not need to implement retry logic for transient errors.',
        'In Express/NestJS: connect once at startup, export the client, and use it in route handlers/services. In serverless (AWS Lambda, Vercel Functions): reuse the client across invocations using a module-level singleton (the driver caches the connection between Lambda invocations if the execution environment is reused).',
      ],
    },
    {
      heading: 'TypeScript Integration',
      points: [
        'The MongoDB driver has <strong>full TypeScript generics support</strong>. Type your collections with <code>Collection&lt;DocumentType&gt;</code>: <code>db.collection&lt;User&gt;("users")</code>. All CRUD methods return correctly typed results.',
        'Use an interface (not a class) for document types. Include <code>_id?: ObjectId</code> — it is optional because MongoDB inserts it automatically if omitted. Using it allows TypeScript to know the shape of returned documents.',
        '<code>WithId&lt;T&gt;</code> is the return type of findOne — it is <code>T & { _id: ObjectId }</code>. <code>OptionalId&lt;T&gt;</code> is the type for insertOne arguments where _id is optional. Use these utility types for correct typing.',
        'Use <code>Filter&lt;T&gt;</code> for query filters (not raw objects) to get autocomplete and type checking on field names and operator values. Use <code>UpdateFilter&lt;T&gt;</code> for update operations.',
        'The BSON <code>ObjectId</code> is a class, not a primitive. Compare ObjectIds with <code>.equals()</code> or convert to string: <code>doc._id.toString() === idStr</code>. Never use <code>===</code> to compare two ObjectId instances directly — they are different object references even if the values are equal.',
      ],
    },
    {
      heading: 'Mongoose vs Native Driver',
      points: [
        '<strong>Mongoose</strong> is an ODM (Object Document Mapper) built on top of the native driver. It adds: Schema definitions (with validation), virtual properties, middleware (pre/post hooks), model classes with static and instance methods, and populate (reference resolution).',
        'Use the <strong>native driver</strong> when: you need maximum performance and control; you are building an application with a flexible schema that doesn\'t benefit from rigid models; you are working with a data pipeline or aggregation-heavy application.',
        'Use <strong>Mongoose</strong> when: you want schema enforcement and validation close to the model; you benefit from the middleware system (e.g., hashing passwords pre-save); you use populate() for simple reference resolution; your team is more comfortable with an ORM-like API.',
        'Mongoose has a gotcha with TypeScript: Schema types and TypeScript interface types must be kept in sync manually (or use <code>InferSchemaType</code>). The native driver\'s TypeScript support is tighter.',
        'In production, both work well. Mongoose\'s middleware and validation are conveniences, but they add a layer of complexity. The native driver is lower-level and requires more explicit code but is more predictable.',
      ],
    },
    {
      heading: 'TypeScript Type Safety with the Node.js Driver',
      points: [
        'The official MongoDB Node.js driver supports generic collection typing (db.collection<UserDocument>("users")) that gives compile-time type checking on query filters, update operations, and returned document shapes — catching field name typos and type mismatches before runtime rather than discovering them from a production error.',
        'The MongoDB _id field is typed as ObjectId by the driver, not a plain string — a common TypeScript integration bug is comparing an _id field to a raw string without first converting it to an ObjectId, which silently fails to match since the types are structurally different, not just differently formatted.',
        'Mongoose (a popular ODM layered on top of the native driver) adds schema validation and a more object-oriented API at the cost of some flexibility and an additional abstraction layer — many production Node.js applications use the native driver directly for full control, while others prefer Mongoose for its schema enforcement and middleware hooks.',
        'Connection management in a serverless environment (AWS Lambda, Vercel functions) requires special care — creating a new MongoClient per invocation exhausts connection limits quickly; the recommended pattern caches and reuses a MongoClient instance across warm invocations of the same function.',
      ],
    },
    {
      heading: 'Error Handling for Common Driver Exceptions',
      points: [
        'Duplicate key errors (code 11000) occur when inserting a document that violates a unique index — catching this specific error code lets the application respond gracefully (a friendly "email already registered" message) rather than surfacing a generic, confusing database error to the end user.',
        'Connection timeout errors distinguish between a genuinely unreachable database and a slow query exceeding a configured timeout — configuring appropriate serverSelectionTimeoutMS and socketTimeoutMS values, and handling each timeout type distinctly, prevents an application from hanging indefinitely on a database issue.',
        'Write concern errors (when a write cannot be acknowledged by the configured number of replica set members) indicate a durability guarantee could not be met — these should generally be surfaced as failures to the caller rather than silently ignored, since the write may not have been durably persisted as required.',
        'Retryable writes (enabled by default in modern driver versions) automatically retry certain transient network errors for write operations — understanding which error types are automatically retried versus which require explicit application-level handling avoids both unnecessary manual retry logic and silently swallowed genuine failures.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Client Singleton Pattern',
      language: 'typescript',
      code: `// db.ts — single client for the entire app
import { MongoClient, Db } from 'mongodb';

let client: MongoClient;
let db: Db;

export async function connectDb(): Promise<Db> {
  if (db) return db; // reuse existing connection

  client = new MongoClient(process.env['MONGO_URI']!, {
    maxPoolSize: 10,         // tune for your workload
    minPoolSize: 2,          // keep warm connections
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    writeConcern: { w: 'majority' },
  });

  await client.connect();
  db = client.db(process.env['MONGO_DB_NAME'] ?? 'myapp');
  console.log('MongoDB connected');
  return db;
}

export function getDb(): Db {
  if (!db) throw new Error('Database not initialized. Call connectDb() first.');
  return db;
}

export async function closeDb(): Promise<void> {
  await client?.close();
}

// In Express:
// app.ts
import { connectDb } from './db';
app.listen(3000, async () => {
  await connectDb();
  console.log('Server running on port 3000');
});
process.on('SIGINT', async () => {
  await closeDb();
  process.exit(0);
});`,
    },
    {
      label: 'TypeScript Typed Collections',
      language: 'typescript',
      code: `import { ObjectId, Collection, Filter, UpdateFilter, WithId } from 'mongodb';
import { getDb } from './db';

// Define the document interface
interface User {
  _id?: ObjectId;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: Date;
  lastLogin?: Date;
}

// Typed collection — all methods return User-shaped results
function usersCollection(): Collection<User> {
  return getDb().collection<User>('users');
}

// Find by ID — convert string to ObjectId
async function getUserById(id: string): Promise<WithId<User> | null> {
  return usersCollection().findOne({ _id: new ObjectId(id) });
}

// Typed filter — TypeScript catches invalid field names
async function getUsersByRole(role: User['role']): Promise<WithId<User>[]> {
  const filter: Filter<User> = { role }; // autocomplete on User fields
  return usersCollection().find(filter).toArray();
}

// Typed update
async function updateUserRole(id: string, role: User['role']): Promise<boolean> {
  const update: UpdateFilter<User> = { $set: { role } };
  const result = await usersCollection().updateOne(
    { _id: new ObjectId(id) },
    update
  );
  return result.modifiedCount === 1;
}

// Insert with auto-generated _id
async function createUser(userData: Omit<User, '_id' | 'createdAt'>): Promise<ObjectId> {
  const result = await usersCollection().insertOne({
    ...userData,
    createdAt: new Date(),
  });
  return result.insertedId;
}`,
    },
    {
      label: 'Error Handling & Cursor Iteration',
      language: 'typescript',
      code: `import { MongoServerError } from 'mongodb';

// Handle duplicate key error (error code 11000)
async function createUserSafe(email: string, name: string) {
  try {
    const result = await usersCollection().insertOne({
      email, name, role: 'user', createdAt: new Date()
    });
    return result.insertedId;
  } catch (err) {
    if (err instanceof MongoServerError && err.code === 11000) {
      throw new Error(\`User with email \${email} already exists\`);
    }
    throw err; // rethrow unexpected errors
  }
}

// Cursor iteration — don't load all docs into memory at once
async function processAllUsers(processor: (user: any) => Promise<void>) {
  const cursor = usersCollection().find({});
  // Option 1: forEach (sequential, handles backpressure)
  await cursor.forEach(async (user) => {
    await processor(user);
  });

  // Option 2: async iteration (more control)
  const cursor2 = usersCollection().find({});
  for await (const user of cursor2) {
    await processor(user);
  }

  // Option 3: toArray — only for small result sets!
  const allUsers = await usersCollection().find({}).toArray(); // loads ALL into memory
}

// Pagination with skip/limit (small datasets only)
async function getPage(page: number, pageSize: number) {
  return usersCollection()
    .find({})
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();
}

// Cursor-based pagination (scalable)
async function getNextPage(lastId: string | null, pageSize: number) {
  const filter = lastId ? { _id: { $lt: new ObjectId(lastId) } } : {};
  return usersCollection()
    .find(filter)
    .sort({ _id: -1 })
    .limit(pageSize)
    .toArray();
}`,
    },
    {
      label: 'Mongoose Schema (for comparison)',
      language: 'typescript',
      code: `import mongoose, { Schema, InferSchemaType, model } from 'mongoose';
import bcrypt from 'bcrypt';

// Mongoose schema definition
const userSchema = new Schema({
  email:     { type: String, required: true, unique: true, lowercase: true },
  name:      { type: String, required: true, minlength: 2 },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['admin', 'user', 'viewer'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
}, {
  timestamps: true, // auto-manages createdAt and updatedAt
});

// Middleware (hooks) — hash password before save (see the Security &
// Authentication topic's own subtopic on why bcrypt, not plain SHA-256)
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this['password'] = await bcrypt.hash(this['password'], 12);
  }
  next();
});

// Infer TypeScript type from schema (avoids manual sync)
type UserType = InferSchemaType<typeof userSchema>;

const User = model<UserType>('User', userSchema);

// Mongoose CRUD — similar API to native driver
const user = await User.findOne({ email: 'test@example.com' });
const newUser = await User.create({ email: 'new@example.com', name: 'New User' });
await User.findByIdAndUpdate(userId, { role: 'admin' });

// Mongoose connect
await mongoose.connect(process.env['MONGO_URI']!);`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Creating a new MongoClient per request',
      wrong: `app.get('/users', async (req, res) => {
  const client = new MongoClient(uri); // new client EVERY request!
  await client.connect();
  const users = await client.db('app').collection('users').find().toArray();
  await client.close();
  res.json(users);
  // Creates a new connection pool on every request → exhausts server connections
});`,
      right: `// db.ts — singleton client
const client = new MongoClient(uri, { maxPoolSize: 10 });
await client.connect();
export const db = client.db('app');

// Route handler — reuse the existing client
app.get('/users', async (req, res) => {
  const users = await db.collection('users').find().toArray();
  res.json(users);
});`,
      explanation: 'Creating a MongoClient per request is the #1 MongoDB Node.js anti-pattern. Each client creates a new connection pool, takes 100-500ms to connect, and leaves abandoned connections. A single client with a connection pool (typically 10-100 connections) efficiently serves hundreds of concurrent requests.',
    },
    {
      title: 'Using .toArray() on large cursors',
      wrong: `// 10 million documents → loads them ALL into RAM at once
const allOrders = await db.collection('orders').find({}).toArray();
for (const order of allOrders) { await process(order); }
// → Memory exhausted, Node.js crashes`,
      right: `// Stream documents one at a time — constant memory usage
for await (const order of db.collection('orders').find({})) {
  await process(order);
}`,
      explanation: 'find().toArray() loads every matching document into a JavaScript array in memory. On large collections, this causes heap exhaustion and crashes. Use async iteration (for await...of) or cursor.forEach() to process documents one at a time without loading the full result set into memory.',
    },
    {
      title: 'Comparing ObjectId with ===',
      wrong: `const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
if (user._id === new ObjectId(id)) {  // ALWAYS false!
  console.log('found it');
}`,
      right: `const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
// Option 1: use .equals()
if (user._id.equals(new ObjectId(id))) { ... }

// Option 2: compare string representations
if (user._id.toString() === id) { ... }`,
      explanation: 'ObjectId is a class, and two ObjectId instances with the same value are different object references. JavaScript\'s === checks reference equality, so two ObjectIds with the same 12-byte value will never be === equal. Use .equals() method or compare .toString() representations.',
    },
    {
      title: 'Not awaiting async driver methods',
      wrong: `async function createOrder(order: any) {
  db.collection('orders').insertOne(order); // missing await!
  return { success: true }; // returns before insert completes
  // If insert fails, the error is unhandled — silent failure
}`,
      right: `async function createOrder(order: any) {
  const result = await db.collection('orders').insertOne(order);
  return { success: true, id: result.insertedId };
}`,
      explanation: 'All MongoDB driver methods return Promises. Not awaiting them means: (1) the operation may not complete before your function returns; (2) errors are swallowed as unhandled promise rejections. Always await every CRUD operation, especially writes — otherwise you\'ll have phantom inserts that "succeed" in your code but never actually committed.',
    },
  ];

  challenge: Challenge = {
    title: 'Type-Safe Repository Pattern',
    language: 'typescript',
    description: 'Build a generic TypeScript repository class for MongoDB that works with any document type. It should provide: findById(id), findAll(filter, pagination), create(data), updateById(id, update), deleteById(id). Use MongoClient generics so all methods return correctly typed results. Handle the duplicate key error (code 11000) in create().',
    hints: [
      'Use class Repository<T extends { _id?: ObjectId }> with a Collection<T> field.',
      'Return WithId<T> from find methods and ObjectId from create.',
      'Accept Filter<T> in findAll for type-safe filtering.',
      'Catch MongoServerError with code 11000 in create() and throw a meaningful error.',
    ],
    starterCode: `import { MongoClient, ObjectId, Filter, UpdateFilter, WithId } from 'mongodb';

// TODO: implement a generic Repository<T> class
// that wraps a MongoDB collection and provides type-safe CRUD

interface PaginationOptions {
  page: number;
  pageSize: number;
}`,
    solution: `import { MongoClient, ObjectId, Filter, UpdateFilter, WithId, Collection, MongoServerError } from 'mongodb';

interface PaginationOptions {
  page: number;
  pageSize: number;
}

class Repository<T extends { _id?: ObjectId }> {
  private collection: Collection<T>;

  constructor(collection: Collection<T>) {
    this.collection = collection;
  }

  async findById(id: string): Promise<WithId<T> | null> {
    return this.collection.findOne({ _id: new ObjectId(id) } as Filter<T>);
  }

  async findAll(filter: Filter<T> = {}, pagination?: PaginationOptions): Promise<WithId<T>[]> {
    let cursor = this.collection.find(filter);
    if (pagination) {
      cursor = cursor
        .skip((pagination.page - 1) * pagination.pageSize)
        .limit(pagination.pageSize);
    }
    return cursor.toArray();
  }

  async create(data: Omit<T, '_id'>): Promise<ObjectId> {
    try {
      const result = await this.collection.insertOne(data as any);
      return result.insertedId;
    } catch (err) {
      if (err instanceof MongoServerError && err.code === 11000) {
        throw new Error('Duplicate key: document already exists');
      }
      throw err;
    }
  }

  async updateById(id: string, update: UpdateFilter<T>): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(id) } as Filter<T>,
      update
    );
    return result.modifiedCount === 1;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne(
      { _id: new ObjectId(id) } as Filter<T>
    );
    return result.deletedCount === 1;
  }
}

// Usage
interface Product { _id?: ObjectId; name: string; price: number; stock: number; }
const productRepo = new Repository<Product>(db.collection<Product>('products'));
const id = await productRepo.create({ name: 'Widget', price: 9.99, stock: 100 });
const product = await productRepo.findById(id.toString());`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the most common MongoDB Node.js performance anti-pattern?',
      options: [
        'Using async/await instead of callbacks',
        'Creating a new MongoClient per request instead of reusing a singleton',
        'Using ObjectId for document IDs',
        'Not using Mongoose',
      ],
      answer: 1,
      explanation: 'Creating a new MongoClient per request creates a new connection pool on every request, takes 100-500ms to establish a connection, and leaves abandoned connections on the server. Always create ONE MongoClient at application startup and reuse it for all operations.',
    },
    {
      q: 'How do you correctly compare two ObjectId values in TypeScript?',
      options: [
        'id1 === id2 (reference equality)',
        'id1 == id2 (loose equality)',
        'id1.equals(id2) or id1.toString() === id2.toString()',
        'ObjectId.compare(id1, id2)',
      ],
      answer: 2,
      explanation: 'ObjectId is a class — two instances with the same value are different object references. JavaScript === checks reference equality, so they will never be ===. Use .equals() method for ObjectId-to-ObjectId comparison, or .toString() to compare as strings.',
    },
    {
      q: 'When should you avoid calling .toArray() on a cursor?',
      options: [
        'When the collection has indexes',
        'When the result set could be large and exceed available memory',
        'When using aggregation pipelines',
        '.toArray() is always safe — MongoDB pages results automatically',
      ],
      answer: 1,
      explanation: '.toArray() loads ALL matching documents into a JavaScript array in memory. On large collections (thousands+ documents), this can exhaust Node.js heap memory and crash the process. Use async iteration (for await...of cursor) or cursor.forEach() to process documents one at a time.',
    },
    {
      q: 'What does MongoServerError code 11000 indicate?',
      options: [
        'Network connection timeout',
        'Duplicate key violation — a document with that unique index value already exists',
        'Write concern timeout — majority not acknowledged in time',
        'Schema validation failure',
      ],
      answer: 1,
      explanation: 'Error code 11000 is a duplicate key error — you tried to insert a document with a value that already exists in a unique index (e.g., email field with a unique index). Catch MongoServerError and check err.code === 11000 to return a user-friendly "already exists" message instead of a 500 error.',
    },
    {
      q: 'What is the main advantage of using TypeScript generics with MongoDB collections?',
      options: [
        'TypeScript generics make MongoDB queries run faster',
        'Type-safe CRUD — TypeScript autocompletes field names and catches invalid filter/update shapes at compile time',
        'Generics automatically create MongoDB indexes for typed fields',
        'Mongoose requires TypeScript generics to function',
      ],
      answer: 1,
      explanation: 'db.collection<User>("users") tells TypeScript the shape of documents in the collection. All CRUD methods (findOne, find, updateOne) then return User-shaped results and accept Filter<User>/UpdateFilter<User> parameters — TypeScript catches invalid field names and wrong types at compile time, before runtime.',
    },
    { q: 'What is the correct way to use the MongoClient in a Node.js application to avoid connection issues?', options: ['Create a new MongoClient for each request and close it when the request is complete to prevent connection leaks', 'Create a single MongoClient instance at application startup, call connect() once, reuse the client across all requests, and close it only on application shutdown', 'Call MongoClient.connect() inside a try-catch on every database operation to handle connection errors gracefully', 'Use connection pooling by calling new MongoClient() in each module that needs database access and maintaining one pool per module'], answer: 1, explanation: 'Single MongoClient pattern: const client = new MongoClient(uri). await client.connect(). Export and reuse this client. The MongoClient internally manages a connection pool (default maxPoolSize: 100). Creating a new MongoClient per request: establishes a new connection pool per request. Connection setup overhead (TCP handshake, TLS, authentication) on every request. Exhausts server connections rapidly under load. Anti-pattern that causes serious production issues. Correct pattern (module-level singleton): export the client from a db.js module. Import it wherever needed. Call client.close() only in the graceful shutdown handler (process.on("SIGTERM", ...)). Note: in serverless environments (AWS Lambda, Vercel), reuse the client across invocations by assigning it to a global variable and checking if it exists before creating a new one.' },
    { q: 'How does async/await error handling work for MongoDB operations in Node.js?', options: ['MongoDB driver operations automatically retry on error and never throw; error handling is only needed for network failures', 'Wrap MongoDB async operations in try-catch blocks to handle MongoError, MongoNetworkError (connection issues), and MongoServerError (query/write errors) — or use .catch() on the returned Promise', 'Use the callback pattern with err as the first argument — async/await is not supported by the official MongoDB Node.js driver', 'MongoDB errors are always returned as the first element of the result array, never thrown as exceptions'], answer: 1, explanation: 'MongoDB Node.js driver async error handling: all modern driver methods return Promises. Use async/await with try-catch: try { const result = await collection.insertOne(doc); } catch (error) { if (error instanceof MongoServerError && error.code === 11000) { // duplicate key } }. Error types: MongoError: base class for all MongoDB errors. MongoNetworkError: connection/network failures. MongoServerError: errors returned from the MongoDB server (e.g., write concern failures, duplicate key, validation errors). MongoExpiredSessionError: session expired (transactions). Retry logic: enable retryWrites: true in the connection string (default in modern drivers). The driver automatically retries transient network errors once. For application-level retry (e.g., write conflicts in transactions), implement manual retry with backoff. Error properties: code (MongoDB error code), codeName, message. Code 11000 = duplicate key violation.' },
    { q: 'How do you use MongoDB transactions in Node.js with the official driver?', options: ['MongoDB transactions are initiated automatically when using insertMany() or updateMany() and do not require explicit session management', 'Use client.startSession(), then session.withTransaction() or manually call session.startTransaction(), perform operations with the session option, then commit or abort', 'Transactions in the Node.js driver require the legacy callback API; async/await is not supported inside transactions', 'Only Atlas clusters support transactions; self-hosted MongoDB requires the Enterprise driver for transaction support'], answer: 1, explanation: 'Node.js transaction pattern with withTransaction (recommended): const session = client.startSession(); try { await session.withTransaction(async () => { await ordersCollection.insertOne(order, { session }); await inventoryCollection.updateOne({ _id: itemId }, { $inc: { qty: -1 } }, { session }); }); } finally { await session.endSession(); }. withTransaction() handles commit and retry automatically. Retries on transient errors (e.g., write conflict from concurrent transactions). Manual transaction pattern: session.startTransaction(); try { // operations await session.commitTransaction(); } catch { await session.abortTransaction(); } finally { session.endSession(); }. Rules: every operation within a transaction must pass the { session } option. Transactions can span collections and databases. Maximum transaction duration: 60 seconds by default (transactionLifetimeLimitSeconds). Transactions have higher write latency than non-transactional writes — use only when atomicity across multiple operations is required.' },
    { q: 'What are MongoDB change streams and how do you use them in Node.js?', options: ['Change streams in Node.js require polling the database every second to check for new changes', 'Use collection.watch() or db.watch() to open a change stream cursor, then iterate with for await to receive real-time change events as they occur on the collection', 'Change streams are push-based via WebSocket and require the MongoDB Realtime driver (a separate npm package)', 'Change streams are only available in Atlas; use oplog tailing directly for self-hosted change notifications'], answer: 1, explanation: 'Change stream in Node.js: const stream = collection.watch([{ $match: { operationType: "insert" } }]); for await (const change of stream) { console.log(change); }. The for-await loop blocks until a new event arrives, then processes it and waits for the next. Stream types: collection.watch() — changes to one collection. db.watch() — changes to all collections in a database. client.watch() — changes across all databases. Resume on disconnect: const stream = collection.watch(pipeline, { resumeAfter: lastToken }); store the change._id (resume token) after each processed event. Restart the stream with resumeAfter to avoid losing events. Error handling: wrap the for-await in try-catch. On MongoNetworkError, sleep briefly and restart the stream with the last resume token. Close the stream: await stream.close() on graceful shutdown. Serverless/Lambda: change streams require a long-lived process. Not suitable for short-lived serverless functions — use Atlas Triggers instead.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use Mongoose or the native MongoDB driver?',
      a: 'Depends on your use case. Use the <strong>native driver</strong> when: you need maximum performance; you\'re building aggregation-heavy data pipelines; you have flexible/polymorphic schemas; or you want to avoid the ODM abstraction layer. Use <strong>Mongoose</strong> when: you want model-level schema validation and middleware (pre/post hooks); you benefit from the populate() API for reference resolution; your team prefers an ORM-like pattern. For new projects, the native driver with TypeScript generics often provides Mongoose-like type safety without the extra abstraction.',
    },
    {
      q: 'How does the MongoDB driver handle reconnection automatically?',
      a: 'The driver implements <strong>Server Discovery and Monitoring (SDAM)</strong> and retries operations transparently on transient errors. When a primary is unreachable (e.g., replica set failover), the driver detects the topology change, waits for a new primary to be elected, and retries the operation — all without your code needing to handle it. Retryable writes (<code>retryWrites: true</code> — default in Atlas URIs) automatically retry once on transient network errors or primary election. You only need to handle non-transient errors (duplicate key, validation failure, etc.).',
    },
    {
      q: 'How do I handle MongoDB in AWS Lambda or serverless functions?',
      a: 'The challenge is that Lambda may reuse execution environments between invocations. Exploit this: declare the MongoClient at module level (outside the handler), and only connect if not already connected. Use a small <code>maxPoolSize</code> (1-5) per Lambda instance to avoid overwhelming MongoDB with too many pools across many concurrent Lambda instances. Set <code>serverSelectionTimeoutMS</code> low (3000ms) so cold starts fail fast rather than hanging. Use MongoDB Atlas with VPC peering or PrivateLink for secure low-latency connections from Lambda.',
    },
    {
      q: 'What is the difference between findOne() and find().limit(1)?',
      a: '<code>findOne()</code> returns a document (or null) directly — it is equivalent to <code>find().limit(1).next()</code> internally. <code>find().limit(1)</code> returns a cursor that you must then iterate (call <code>.next()</code>, <code>.toArray()</code>, or iterate with for await). Prefer <code>findOne()</code> when you expect one result — it\'s simpler and signals intent clearly. Use <code>find()</code> when you need cursor options like projection chaining, or when you might return more than one document.',
    },
    {
      q: 'How do I run a bulk operation efficiently in Node.js?',
      a: 'Use <code>collection.bulkWrite(operations)</code> to send multiple writes in one network round trip. Batch operations as an array of <code>insertOne</code>, <code>updateOne</code>, <code>deleteOne</code> etc. objects. By default, bulk operations are <strong>ordered</strong> (stop on first error). Pass <code>{ ordered: false }</code> for unordered bulk (continue on errors, processes all operations, returns combined error list at end — much faster for bulk imports). For very large datasets, chunk into batches of 500-1000 operations to avoid exceeding the BSON max message size (48MB).',
    },
    { q: 'How do you implement pagination with the MongoDB Node.js driver?', a: 'Cursor-based pagination (recommended for production): rather than skip/limit, use the last seen document field to query the next page. Example: first page: const docs = await collection.find({ status: "active" }).sort({ createdAt: -1 }).limit(pageSize).toArray(). Next page: record the createdAt of the last document. const nextPage = await collection.find({ status: "active", createdAt: { $lt: lastSeen } }).sort({ createdAt: -1 }).limit(pageSize).toArray(). Why: $skip is O(n) — MongoDB scans and discards the skipped documents. Page 100 of 1000-item pages means skipping 99,000 documents. Cursor pagination is O(1) because it uses the sort field index. Offset pagination (simple but slow for high page numbers): const page = await collection.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * pageSize).limit(pageSize).toArray(). Acceptable for small collections or when jump-to-page is needed. Total count: use collection.countDocuments(filter) separately or use $facet in an aggregation to get both page and count in one round trip.' },
    { q: 'How do you use the aggregation framework from the Node.js driver?', a: 'Aggregation pipeline in Node.js: const pipeline = [ { $match: { status: "completed" } }, { $group: { _id: "$customerId", totalSpent: { $sum: "$total" }, orderCount: { $sum: 1 } } }, { $sort: { totalSpent: -1 } }, { $limit: 10 } ]; const cursor = collection.aggregate(pipeline); const results = await cursor.toArray(). Cursor vs toArray: use cursor for streaming large result sets to avoid loading everything into memory. Use for await (const doc of cursor) { process(doc) } for streaming. toArray() loads all results into memory. Options: const cursor = collection.aggregate(pipeline, { allowDiskUse: true, maxTimeMS: 30000 }). allowDiskUse: enables spilling to disk for large aggregations. maxTimeMS: kills the aggregation if it runs longer than the timeout. Type safety with TypeScript: const pipeline: Document[] = [...]. Use the Document type from mongodb package. Define result types and cast: const cursor = collection.aggregate<MyResultType>(pipeline). This gives TypeScript type inference on the cursor.' },
    { q: 'How do you handle MongoDB connection management in a serverless Node.js environment?', a: 'Serverless challenge: serverless functions (AWS Lambda, Vercel, Netlify) are stateless — each invocation may start a new process. Creating a new MongoClient per invocation is expensive and exhausts MongoDB connections at scale. Solution: module-level caching with reuse. Define a module-level variable: let client: MongoClient | null = null. On each invocation, check if client is connected before creating a new one: if (!client) { client = new MongoClient(uri); await client.connect(); }. How it works: if the Lambda container is warm (reused), client persists in memory and the existing connection pool is reused. If the container is cold (new process), a new connection is established. Connection limits: a Lambda function at 100 concurrent invocations may create up to 100 separate connection pools. Set maxPoolSize to 1-5 for serverless to limit per-function pool size. Atlas serverless tier: MongoDB Atlas Serverless pricing is per-operation, not per-connection. Still cache the client to avoid reconnect overhead. Close the connection: do NOT close the client at the end of each invocation — the Lambda container may be reused and will need the connection again immediately.' },
    { q: 'What are the most common MongoDB Node.js driver errors and how do you handle them?', a: 'Error code 11000 (duplicate key): thrown when inserting a document that violates a unique index. Handling: try the insert, catch MongoServerError with code 11000, return a conflict response. Example: if (err instanceof MongoServerError && err.code === 11000) { return res.status(409).json({ error: "Already exists" }); }. MongoNetworkError: connection lost, server unreachable. The driver retries once automatically (if retryWrites is enabled). If retry also fails, this error is thrown. Handle by returning a 503 and letting the client retry. TransientTransactionError: thrown during transactions. The whole transaction must be retried. Use session.withTransaction() which handles this automatically. WriteConflict (code 112): thrown when a transaction tries to write a document being modified by another transaction. Handled by withTransaction retry. MongoServerError with timeout: operation exceeded maxTimeMS. Return 504 Gateway Timeout. MongoExpiredSessionError: session used after its expiry. Recreate the session. BulkWriteError: contains a writeErrors array with details on each failed operation. Parse writeErrors to determine which operations failed. Common debugging: error.message, error.code, error.codeName are the key properties. Enable command monitoring in the driver for detailed query-level debugging.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Use a singleton MongoClient with connection pooling, type collections with generics, await all operations, and use cursor iteration (not toArray) for large datasets.',
    mustKnow: [
      'One MongoClient singleton per app — never create per-request',
      'db.collection<T>("name") for type-safe CRUD with autocomplete',
      'Await all driver methods — async/await throughout',
      'for await...of cursor — don\'t toArray() large result sets',
      'ObjectId comparison: .equals() or .toString(), never ===',
      'MongoServerError code 11000 = duplicate key violation',
      'Retryable writes (default in Atlas) handle transient network errors automatically',
    ],
    interviewFocus: [
      'Connection pooling — why singleton pattern is critical',
      'TypeScript generics with MongoDB — Filter<T>, UpdateFilter<T>',
      'Cursor iteration vs toArray() — memory implications',
      'Error handling — 11000 duplicate key, MongoServerError',
      'Mongoose vs native driver — trade-offs',
    ],
  };
}
