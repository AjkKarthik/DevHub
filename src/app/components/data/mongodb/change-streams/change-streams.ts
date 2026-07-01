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
  selector: 'app-mongo-change-streams',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './change-streams.html',
  styleUrl: './change-streams.scss',
})
export class MongoChangeStreams {
  quickRef: QuickRefItem[] = [
    { type: 'method',  name: 'collection.watch()',         desc: 'Open a change stream on a collection. Returns a ChangeStream cursor.' },
    { type: 'method',  name: 'db.watch()',                 desc: 'Watch all collections in a database for changes.' },
    { type: 'method',  name: 'client.watch()',             desc: 'Watch all collections across all databases (deployment-level).' },
    { type: 'method',  name: 'changeStream.next()',        desc: 'Await the next change event. Resolves when the next event arrives.' },
    { type: 'method',  name: 'changeStream.close()',       desc: 'Close the change stream and release resources. Call on shutdown.' },
    { type: 'keyword', name: 'resumeToken',                desc: '_resumeAfter token stored in each event — use to resume after disconnect.' },
    { type: 'keyword', name: 'resumeAfter',                desc: 'Open change stream from a specific resume token (not from the start).' },
    { type: 'keyword', name: 'startAfter',                 desc: 'Like resumeAfter but works even after an invalidate event.' },
    { type: 'keyword', name: 'startAtOperationTime',       desc: 'Open change stream starting at a specific cluster time.' },
    { type: 'keyword', name: 'fullDocument',               desc: '"updateLookup" — include the full post-update document in update events.' },
    { type: 'keyword', name: 'operationType',              desc: 'Event field: insert | update | replace | delete | drop | rename | invalidate.' },
    { type: 'keyword', name: 'Replica Set Required',       desc: 'Change streams require a replica set (or sharded cluster) — uses the oplog.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What Are Change Streams?',
      points: [
        'Change streams allow applications to <strong>subscribe to real-time changes</strong> in MongoDB collections, databases, or an entire deployment. They are the recommended alternative to polling and provide an event-driven programming model.',
        'Change streams are built on MongoDB\'s <strong>oplog (operations log)</strong> — the same mechanism used for replica set replication. They require a replica set or sharded cluster (MongoDB 3.6+).',
        'Every change event has an <strong>operationType</strong>: <code>insert</code> (new document), <code>update</code> (field-level changes), <code>replace</code> (full document replacement), <code>delete</code>, <code>drop</code> (collection dropped), <code>rename</code> (collection renamed), <code>dropDatabase</code>, and <code>invalidate</code> (stream no longer valid, e.g., collection was dropped).',
        'Change streams are <strong>resumable</strong> — each event contains a <code>_id</code> resume token. Store the latest token and pass it as <code>resumeAfter</code> when reopening the stream after a disconnect. MongoDB automatically resumes from where you left off.',
        'Change streams respect <strong>majority read concern</strong> — they only emit changes that have been committed to the majority of replica set members, preventing you from seeing changes that could be rolled back.',
      ],
    },
    {
      heading: 'Event Structure & Aggregation Pipeline Filters',
      points: [
        'Each change event document has: <code>_id</code> (resume token), <code>operationType</code>, <code>fullDocument</code> (for insert/replace; for update, only with <code>fullDocument: "updateLookup"</code>), <code>ns</code> (namespace: db + collection), <code>documentKey</code> (_id of the changed document), <code>updateDescription</code> (for update events: updatedFields, removedFields).',
        'Pass an <strong>aggregation pipeline</strong> to <code>collection.watch([pipeline])</code> to filter or transform events before they reach your application. Supported stages: <code>$match</code>, <code>$project</code>, <code>$addFields</code>, <code>$replaceRoot</code>, <code>$redact</code>, <code>$set</code>, <code>$unset</code>. Push filters into the pipeline for efficiency — don\'t filter in application code.',
        'By default, <strong>update events do NOT include the full document</strong> — they only include the <code>updateDescription</code> (which fields changed). To get the full post-update document, pass <code>{ fullDocument: "updateLookup" }</code> as the option. This triggers an extra lookup on the collection, so it has a cost.',
        '<code>fullDocumentBeforeChange</code> (MongoDB 6.0+) — captures the pre-update state of the document. Requires enabling <code>changeStreamPreAndPostImages</code> on the collection: <code>db.runCommand({ collMod: "orders", changeStreamPreAndPostImages: { enabled: true } })</code>.',
        'The aggregation pipeline filter runs on the server — only matching events are sent to the client. This is critical for performance in high-write workloads: filter for specific document IDs, operation types, or field values in the pipeline rather than receiving all events and filtering in code.',
      ],
    },
    {
      heading: 'Resumability & Error Handling',
      points: [
        'Always persist the latest <strong>resume token</strong> (the <code>_id</code> field of each event) to durable storage (e.g., another MongoDB collection, Redis, or a file). On reconnect, pass it as <code>resumeAfter</code>. MongoDB\'s oplog retains events for a configurable period (default 24 hours, minimum 1 hour) — if your app is down longer than the oplog window, you cannot resume from the stored token.',
        'Handle the <code>invalidate</code> event: emitted when the watched collection/database is dropped or renamed. After an invalidate event, the stream closes automatically. Your handler should detect this and decide whether to reopen the stream on a new collection.',
        'When a network error or primary election occurs, the Node.js driver automatically retries opening the change stream using the last resume token — you don\'t need to manually handle reconnect. However, if the resume token\'s oplog entry has been deleted (oplog rolled over), the resume fails.',
        'Use <code>startAfter</code> instead of <code>resumeAfter</code> when you want to resume even if the previous token was from an invalidate event (e.g., collection was dropped and recreated).',
        'Change streams consume server resources (cursor, oplog reading). Close streams when no longer needed: <code>changeStream.close()</code>. Handle process shutdown signals (SIGTERM/SIGINT) to close streams gracefully.',
      ],
    },
    {
      heading: 'Resume Tokens and Fault-Tolerant Streaming',
      points: [
        'Every change event includes a resume token — an opaque value that uniquely identifies the change\'s position in the underlying oplog — allowing a change stream consumer to resume exactly where it left off after a disconnect, rather than missing events or reprocessing from the beginning.',
        'Persisting the resume token durably (to a database or durable storage, not just in-memory) is essential for production change stream consumers — an in-memory-only resume token is lost on a consumer restart, forcing either data loss (skipping missed events) or a full resync.',
        'Change streams are backed by the oplog, which has a finite retention window — if a consumer is disconnected for longer than the oplog retention period, the resume token becomes invalid and the consumer must either accept data loss or perform a full resync from a fresh snapshot.',
        'Change streams can be opened on a single collection, an entire database, or an entire deployment — broader scopes are convenient for building generic downstream sync/audit systems, but require the consumer to filter and route change events by namespace itself.',
      ],
    },
    {
      heading: 'Change Stream Use Cases Beyond Simple Sync',
      points: [
        'Cache invalidation is a common change stream use case — a change stream watching a collection can automatically invalidate or update a Redis cache entry the moment the underlying document changes, keeping the cache consistent without relying on the application to remember to invalidate manually on every write path.',
        'Materialized view maintenance uses change streams to keep a denormalized read-optimized collection in sync with changes to the normalized source collection — the change stream consumer applies the corresponding transformation to the materialized view whenever a relevant source document changes.',
        'Full document lookup (via fullDocument: "updateLookup" or "whenAvailable") retrieves the complete current document state alongside an update change event, since the default change event for updates only includes the specific fields that changed, not the full resulting document.',
        'Change streams require a replica set or sharded cluster (not a standalone MongoDB instance) since they depend on the oplog, which only exists in replicated deployments — a design constraint worth knowing before architecting a system around change streams for local development.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Change Stream',
      language: 'typescript',
      code: `import { MongoClient, ChangeStreamDocument } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
await client.connect();

const collection = client.db('shop').collection('orders');

// Open a change stream — watch for all changes to the orders collection
const changeStream = collection.watch();

// Process events
changeStream.on('change', (event: ChangeStreamDocument) => {
  console.log('Operation:', event.operationType);

  if (event.operationType === 'insert') {
    console.log('New order:', event.fullDocument);
  }

  if (event.operationType === 'update') {
    console.log('Updated fields:', event.updateDescription?.updatedFields);
    console.log('Document ID:', event.documentKey._id);
    // Note: fullDocument is not available by default for update events
  }

  if (event.operationType === 'delete') {
    console.log('Deleted document ID:', event.documentKey._id);
  }
});

changeStream.on('error', (err) => {
  console.error('Change stream error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await changeStream.close();
  await client.close();
  process.exit(0);
});`,
    },
    {
      label: 'Filter Pipeline & Full Document',
      language: 'typescript',
      code: `// Filter change stream with an aggregation pipeline
// Only receive insert/update events where status === 'shipped'
const pipeline = [
  {
    $match: {
      operationType: { $in: ['insert', 'update', 'replace'] },
      // Match on fullDocument fields (for insert/replace)
      // or use $match on updateDescription for update events
    }
  },
  {
    // Project only the fields we care about
    $project: {
      operationType: 1,
      documentKey: 1,
      'fullDocument.orderId': 1,
      'fullDocument.status': 1,
      'updateDescription.updatedFields.status': 1,
    }
  }
];

const changeStream = collection.watch(pipeline, {
  fullDocument: 'updateLookup', // Include full post-update doc in update events
});

for await (const event of changeStream) {
  // Using async iteration — cleaner than event emitter
  if (event.operationType === 'update') {
    const newStatus = event.fullDocument?.status;
    if (newStatus === 'shipped') {
      await sendShippingNotification(event.documentKey._id);
    }
  }
}`,
    },
    {
      label: 'Resumable Change Stream',
      language: 'typescript',
      code: `import { MongoClient, ResumeToken } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
const db = client.db('shop');
const orders = db.collection('orders');
const tokens = db.collection('resume_tokens');

// Load last resume token from persistent storage
async function getLastResumeToken(): Promise<ResumeToken | null> {
  const doc = await tokens.findOne({ _id: 'orders-stream' });
  return doc?.token ?? null;
}

// Save resume token after each event
async function saveResumeToken(token: ResumeToken) {
  await tokens.updateOne(
    { _id: 'orders-stream' },
    { $set: { token, updatedAt: new Date() } },
    { upsert: true }
  );
}

async function startOrderStream() {
  const lastToken = await getLastResumeToken();

  const options = lastToken
    ? { resumeAfter: lastToken }  // Resume from where we left off
    : {};                          // Start from now

  const changeStream = orders.watch([], options);

  for await (const event of changeStream) {
    // Process the event first
    await processOrderEvent(event);

    // Then save the resume token (after processing — at-least-once delivery)
    await saveResumeToken(event._id as ResumeToken);
  }
}

async function processOrderEvent(event: any) {
  switch (event.operationType) {
    case 'insert': await handleNewOrder(event.fullDocument); break;
    case 'update': await handleOrderUpdate(event.documentKey._id, event.updateDescription); break;
    case 'delete': await handleOrderDelete(event.documentKey._id); break;
    case 'invalidate': console.warn('Change stream invalidated — collection dropped?'); break;
  }
}

startOrderStream().catch(console.error);`,
    },
    {
      label: 'Database-Level & Scoped Watch',
      language: 'typescript',
      code: `// Watch ALL changes in a database
const dbChangeStream = client.db('shop').watch([
  { $match: { 'ns.coll': { $in: ['orders', 'inventory'] } } }
]);

for await (const event of dbChangeStream) {
  const collection = event.ns.coll;
  console.log(\`Change in \${collection}:\`, event.operationType);
}

// Watch deployment-level (all databases, all collections)
const globalStream = client.watch([
  {
    $match: {
      operationType: { $in: ['insert', 'update'] },
      'ns.db': { $in: ['shop', 'analytics'] },
    }
  }
]);

// Pre- and post-images (MongoDB 6.0+)
// First, enable on the collection:
await client.db('shop').command({
  collMod: 'orders',
  changeStreamPreAndPostImages: { enabled: true }
});

// Then open a stream with both pre and post images:
const fullStream = orders.watch([], {
  fullDocument: 'required',           // always include post-update document
  fullDocumentBeforeChange: 'required', // include pre-update document
});

for await (const event of fullStream) {
  if (event.operationType === 'update') {
    const before = event.fullDocumentBeforeChange;
    const after  = event.fullDocument;
    console.log('Before:', before?.status, '→ After:', after?.status);
  }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not persisting the resume token — losing events on restart',
      wrong: `const changeStream = collection.watch();
changeStream.on('change', async (event) => {
  await processEvent(event);
  // Never save the resume token!
});
// App restarts → opens stream at current time → misses all events during downtime`,
      right: `changeStream.on('change', async (event) => {
  await processEvent(event);
  await saveToken(event._id); // persist resume token after each event
});
// On restart: pass { resumeAfter: await loadToken() } to collection.watch()`,
      explanation: 'Without persisting the resume token, every restart loses all events that occurred during downtime. Always save the event._id (resume token) to durable storage after processing each event, and pass it as resumeAfter when reopening the stream.',
    },
    {
      title: 'Expecting fullDocument on update events (not configured)',
      wrong: `const changeStream = collection.watch();
changeStream.on('change', (event) => {
  if (event.operationType === 'update') {
    console.log(event.fullDocument.status); // undefined! fullDocument not included by default
  }
});`,
      right: `// Option A: use fullDocument: 'updateLookup'
const changeStream = collection.watch([], { fullDocument: 'updateLookup' });
changeStream.on('change', (event) => {
  if (event.operationType === 'update') {
    console.log(event.fullDocument?.status); // now populated
  }
});

// Option B: use updateDescription if you only need the changed fields
changeStream.on('change', (event) => {
  if (event.operationType === 'update') {
    const changed = event.updateDescription?.updatedFields;
    console.log('Changed fields:', changed);
  }
});`,
      explanation: 'By default, update events only include updateDescription (which fields changed) — NOT the full document. Pass { fullDocument: "updateLookup" } to get the post-update document in update events. This does an extra lookup, so use updateDescription when you only need to know what changed.',
    },
    {
      title: 'Filtering events in application code instead of the pipeline',
      wrong: `const changeStream = collection.watch(); // receives ALL events
changeStream.on('change', (event) => {
  if (event.operationType !== 'insert') return; // client-side filter
  if (event.fullDocument.status !== 'shipped') return; // client-side filter
  await sendNotification(event.fullDocument);
  // All events are sent from server to client — most are discarded. Wasteful.
});`,
      right: `// Filter at the server via pipeline — only matching events are sent
const changeStream = collection.watch([
  { $match: {
    operationType: 'insert',
    'fullDocument.status': 'shipped',
  }}
]);
changeStream.on('change', async (event) => {
  await sendNotification(event.fullDocument); // all events here match
});`,
      explanation: 'Server-side pipeline filtering is far more efficient. Client-side filtering still requires transmitting all events from MongoDB to your application — wasting bandwidth and CPU. Push $match stages into the pipeline to filter at the source.',
    },
    {
      title: 'Not handling the invalidate event',
      wrong: `const changeStream = collection.watch();
changeStream.on('change', (event) => {
  // Handles insert/update/delete but ignores 'invalidate'
  processEvent(event);
});
// If collection is dropped: stream emits invalidate, then closes — no handler`,
      right: `const changeStream = collection.watch();
changeStream.on('change', (event) => {
  if (event.operationType === 'invalidate') {
    console.warn('Collection dropped or renamed — stream invalidated');
    // Reopen on new collection, or alert ops
    return;
  }
  processEvent(event);
});`,
      explanation: 'When a watched collection is dropped or renamed, MongoDB emits an invalidate event and then closes the stream. Without handling this, your application loses the stream silently. Always check for operationType === "invalidate" and handle it (reopen the stream, alert, or shut down gracefully).',
    },
  ];

  challenge: Challenge = {
    title: 'Real-time Inventory Alert System',
    language: 'typescript',
    description: 'Build a change stream that monitors a products collection and sends an alert when any product\'s stock drops below 10. The system must: (1) Use a server-side pipeline to filter update events, (2) Use fullDocument: "updateLookup" to get the full document after update, (3) Persist the resume token so the system can resume after restart, (4) Handle the invalidate event gracefully.',
    hints: [
      'Use $match in the pipeline to filter for operationType "update" and updatedFields containing stock.',
      'fullDocument.stock < 10 cannot be filtered in the pipeline (computed) — filter in code after receiving the event.',
      'Save the resume token (event._id) to a tokens collection after processing each event.',
      'On startup, load the last token and pass as resumeAfter if it exists.',
    ],
    starterCode: `import { MongoClient, ResumeToken } from 'mongodb';
const client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
const db = client.db('inventory');

async function startStockMonitor() {
  // TODO: load resume token, open change stream with pipeline,
  // check stock level in handler, save resume token, handle invalidate
}

async function sendLowStockAlert(product: any) {
  console.log(\`LOW STOCK ALERT: \${product.name} has only \${product.stock} units\`);
}`,
    solution: `import { MongoClient, ResumeToken } from 'mongodb';
const client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
const db = client.db('inventory');
const products = db.collection('products');
const tokens   = db.collection('resume_tokens');

async function loadToken(): Promise<ResumeToken | null> {
  const doc = await tokens.findOne({ _id: 'stock-monitor' });
  return doc?.token ?? null;
}

async function saveToken(token: ResumeToken) {
  await tokens.updateOne(
    { _id: 'stock-monitor' },
    { $set: { token } },
    { upsert: true }
  );
}

async function startStockMonitor() {
  const lastToken = await loadToken();

  const pipeline = [
    { $match: {
      operationType: 'update',
      'updateDescription.updatedFields.stock': { $exists: true },
    }}
  ];

  const options: any = { fullDocument: 'updateLookup' };
  if (lastToken) options.resumeAfter = lastToken;

  const changeStream = products.watch(pipeline, options);

  for await (const event of changeStream) {
    if (event.operationType === 'invalidate') {
      console.warn('Products collection invalidated — stream closed');
      break;
    }

    const product = event.fullDocument;
    if (product && product.stock < 10) {
      await sendLowStockAlert(product);
    }

    await saveToken(event._id as ResumeToken);
  }
}

async function sendLowStockAlert(product: any) {
  console.log(\`LOW STOCK ALERT: \${product.name} has only \${product.stock} units\`);
}

startStockMonitor().catch(console.error);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which infrastructure is required for MongoDB change streams?',
      options: [
        'A standalone mongod instance',
        'A replica set or sharded cluster',
        'MongoDB Atlas only',
        'A minimum of 3 nodes in the replica set',
      ],
      answer: 1,
      explanation: 'Change streams require a replica set or sharded cluster — they are built on the oplog, which only exists in replica sets. A standalone mongod (no replica set) does not have an oplog and cannot support change streams.',
    },
    {
      q: 'How do you receive the full document in an update change event?',
      options: [
        'The full document is always included in update events by default',
        'Pass { fullDocument: "updateLookup" } to collection.watch()',
        'Use db.watch() instead of collection.watch()',
        'Add { $project: { fullDocument: 1 } } to the pipeline',
      ],
      answer: 1,
      explanation: 'By default, update events only include updateDescription (which fields changed). Pass { fullDocument: "updateLookup" } as an option to collection.watch() to get the full post-update document. This triggers an extra lookup on the collection for each update event.',
    },
    {
      q: 'What is the purpose of the resume token in change streams?',
      options: [
        'It authenticates the change stream connection to the server',
        'It is stored and used to reopen the stream from the last processed event after a disconnect',
        'It limits which operations the change stream can watch',
        'It determines the change stream\'s expiration time',
      ],
      answer: 1,
      explanation: 'Each change event contains a resume token (the event._id). If you persist the latest token and pass it as resumeAfter when reopening the stream, MongoDB resumes from where you left off — you won\'t miss events that occurred while disconnected (as long as the oplog window hasn\'t expired).',
    },
    {
      q: 'What happens when you watch a collection that is then dropped?',
      options: [
        'The change stream silently reconnects to the new collection',
        'An invalidate event is emitted and the stream closes automatically',
        'The change stream throws a MongoError',
        'The stream continues watching and emits a drop event only',
      ],
      answer: 1,
      explanation: 'When a watched collection is dropped, MongoDB emits an invalidate event and then automatically closes the change stream. Your application should handle the invalidate event to reopen on a new collection, alert operators, or shut down gracefully.',
    },
    {
      q: 'When should you filter change events in the aggregation pipeline vs in application code?',
      options: [
        'Always filter in application code — the pipeline adds latency',
        'Always filter in the pipeline — it prevents events from being sent to the client',
        'Use the pipeline for operationType filters; use application code for document field filters',
        'It doesn\'t matter — MongoDB sends all events regardless of the pipeline',
      ],
      answer: 1,
      explanation: 'Server-side pipeline filters prevent matching events from being sent to the client at all, saving bandwidth and CPU. Application-side filtering still receives all events from MongoDB. Always push as much filtering as possible into the pipeline passed to collection.watch().',
    },
    { q: 'What is a change stream and what are the main use cases?', options: ['A change stream is a MongoDB write-ahead log (oplog) that can be read directly by application code for disaster recovery', 'A change stream is a real-time stream of data change events (inserts, updates, deletes, replacements) that applications can subscribe to for event-driven architectures, cache invalidation, audit logging, and data synchronization', 'A change stream is a read-only replica that streams data to analytics systems via Kafka connectors', 'Change streams are only available on sharded clusters; they are not supported on standalone replica sets'], answer: 1, explanation: 'Change streams use the MongoDB oplog (operation log) and present change events as a resumable, filtered cursor. Key use cases: real-time notifications — notify downstream systems when data changes without polling. Cache invalidation — invalidate a cache entry exactly when the backing document changes. Audit logs — capture all modifications to sensitive collections with full before/after document state. Event sourcing — build an event log from document changes. Data synchronization — sync MongoDB changes to Elasticsearch, Redis, or another data store. ETL pipelines — stream changes to a data warehouse incrementally. Available on: replica sets (required — standalone deployments do not support change streams) and sharded clusters. Change streams require MongoDB 3.6+ and replica set or sharded cluster deployment.' },
    { q: 'What is the resumeAfter option and why is it important for reliability?', options: ['resumeAfter allows a change stream to skip the first N events and start from a later position', 'resumeAfter takes a resume token from a previously received change event and restarts the change stream from exactly that position, enabling reliable exactly-once or at-least-once processing after application restarts', 'resumeAfter is used to filter change events by timestamp, resuming only changes after a specified time', 'resumeAfter is only supported in MongoDB Atlas; self-hosted change streams cannot resume from a specific position'], answer: 1, explanation: 'Resume token: every change event includes an _id field that is the resume token — a unique opaque identifier for that event in the oplog. Persistence: store the last successfully processed resume token to durable storage (database, Redis, disk) after processing each event. On restart: open the change stream with resumeAfter: lastToken. MongoDB replays events from after that token. Guarantees: MongoDB guarantees the oplog window for resume — typically hours of changes are retained. If the token is older than the oplog retention window, resume fails. startAfter vs resumeAfter: both accept a resume token. startAfter can resume after an invalidate event (collection drop, rename) which resumeAfter cannot. startAtOperationTime: resume from a specific timestamp using a Timestamp object. Use when you do not have a prior token (e.g., on first startup). MongoDB 4.0+ supports cross-shard change streams for sharded clusters with consistent resume tokens.' },
    { q: 'What change event operation types are available and what fields do they provide?', options: ['Change streams emit only insert and delete events; update events require a separate polling mechanism', 'Change streams emit insert, update, replace, delete, drop, rename, dropDatabase, and invalidate events, each with an operationType field and relevant payload fields', 'Change streams emit only document-level events (insert, update, delete) — collection and database events are not included in change streams', 'All change event types provide the full document before and after the change in every event by default'], answer: 1, explanation: 'Operation types and their key fields: insert: operationType: "insert". fullDocument: the complete inserted document. update: operationType: "update". updateDescription: { updatedFields: {...}, removedFields: [...] } — only changed fields, not the full document. fullDocument: only included if fullDocument option is "updateLookup" or "whenAvailable". replace: operationType: "replace". fullDocument: the new document after replacement. delete: operationType: "delete". documentKey: { _id: ... }. fullDocument: null (the document no longer exists). drop: the collection was dropped. rename: the collection was renamed. dropDatabase: the database was dropped. invalidate: the change stream is no longer valid (e.g., collection dropped). After invalidate, the change stream cursor is closed. Open a new one. clusterTime: the oplog timestamp for each event, useful for ordering across streams.' },
    { q: 'What is fullDocumentBeforeChange and when should you request it?', options: ['fullDocumentBeforeChange is a MongoDB 7.0 feature that returns the document state as it was one version before the triggering change event', 'fullDocumentBeforeChange returns the complete document as it existed before an update or delete, enabling before/after comparison, audit logging, and undo functionality in change stream consumers', 'fullDocumentBeforeChange is the previous oplog entry and is available on all change stream events by default without configuration', 'fullDocumentBeforeChange is only available in Atlas triggers; it cannot be accessed via driver-level change streams'], answer: 1, explanation: 'fullDocumentBeforeChange: requires pre-image configuration. Step 1: enable pre-images on the collection: db.runCommand({ collMod: "orders", changeStreamPreAndPostImages: { enabled: true } }). Step 2: open change stream with: { fullDocumentBeforeChange: "whenAvailable" } or "required". Events then include the fullDocumentBeforeChange field containing the complete document BEFORE the modification. Storage cost: pre-images are stored in a system collection (config.system.preimages) with configurable TTL. Disk overhead: significant for high-write collections — pre-images can consume as much space as the collection itself. Use cases: audit logging with before/after state. Diff computation (what exactly changed?). Undo/rollback functionality. Compliance requirements where change history must be retained. whenAvailable vs required: "required" fails the change stream if a pre-image is not available. "whenAvailable" returns null for missing pre-images. MongoDB 6.0+ fully supports this feature.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How long does MongoDB retain oplog events for resume?',
      a: 'The oplog is a capped collection with a configurable size. MongoDB ensures a minimum retention period of <strong>1 hour</strong> by default (configurable with <code>oplogMinRetentionHours</code>). In practice, most deployments retain 24–72 hours. If your application is down longer than the oplog window, the resume token expires and you cannot resume — you\'ll need to resync from the current state. Set <code>oplogMinRetentionHours</code> to match your expected maximum downtime.',
    },
    {
      q: 'Can I watch changes from multiple collections in one stream?',
      a: 'Yes. Use <code>db.watch()</code> to watch all collections in a database, or <code>client.watch()</code> to watch all collections in all databases. Filter with <code>$match: { "ns.coll": { $in: ["orders", "inventory"] } }</code> to watch specific collections. Each event\'s <code>ns</code> field tells you which database and collection the change came from.',
    },
    {
      q: 'Are change streams guaranteed to deliver every event exactly once?',
      a: 'Change streams provide <strong>at-least-once delivery</strong>, not exactly-once. The driver retries on transient errors — if you process an event but crash before saving the resume token, the event will be reprocessed on restart. Design your event handlers to be idempotent (safe to process the same event multiple times). Common patterns: use upsert + document versioning, check if the action was already taken before acting, or use a separate "processed events" tracking collection.',
    },
    {
      q: 'What is fullDocumentBeforeChange and when should I use it?',
      a: '<code>fullDocumentBeforeChange</code> (MongoDB 6.0+) captures the document\'s state <em>before</em> the change was applied. Enable it on a collection: <code>collMod: "orders", changeStreamPreAndPostImages: { enabled: true }</code>. Then open the stream with <code>{ fullDocumentBeforeChange: "required" }</code>. Use cases: audit trails ("what was the previous value?"), undo systems, debounce comparisons (was the status actually different?). There is a storage overhead — pre-images are stored temporarily in the config.system.preimages collection.',
    },
    {
      q: 'How do I use change streams in a NestJS or Express application?',
      a: 'Start the change stream in a service that is initialized on application startup (e.g., <code>OnApplicationBootstrap</code> in NestJS, or in the <code>listen</code> callback in Express). Store a reference to the change stream and close it on application shutdown (NestJS\'s <code>OnApplicationShutdown</code>, or a SIGTERM handler). Use async iteration (<code>for await (const event of stream)</code>) in a long-running async function, or use event emitter style (<code>stream.on("change", handler)</code>). Avoid blocking the main request thread — the change stream processing should run independently.',
    },
    { q: 'How do you filter change stream events at the server side?', a: 'You can apply an aggregation pipeline to the change stream to filter events on the MongoDB server rather than receiving all events and filtering in the application. Supported stages in change stream pipelines: $match — filter events by operationType, namespace, or any field in the change event. $project — reshape the change event document. $addFields — add computed fields. $replaceRoot — replace the event document. $redact — conditionally include/exclude fields. Example: watch only insert events on a specific collection. const pipeline = [{ $match: { operationType: "insert", "ns.coll": "orders" } }]. const stream = db.watch(pipeline). Server-side filtering reduces network bandwidth: if you watch a high-volume collection but only need delete events, server filtering prevents sending irrelevant events to the application. Not supported: $lookup, $out, $merge, $unionWith, $facet. The pipeline is applied to the change event document structure, not to the underlying collection.' },
    { q: 'How do change streams work across sharded clusters?', a: 'Sharded cluster change streams: you can open a change stream on a sharded cluster at three levels: database level (db.watch()), collection level (db.collection.watch()), or deployment level (client.watch()). Routing: when opened on a mongos (the sharded cluster router), MongoDB merges change event streams from all shards and presents them in a consistent order based on cluster time. Resume tokens: on a sharded cluster, resume tokens include information about the shard and oplog position. They are more complex than single-node tokens but are handled transparently by the driver. Ordering guarantee: events from the same shard are ordered. Cross-shard ordering is ordered by cluster time (logical clock), which is consistent within a snapshot but may interleave events from different shards. Gotcha: if a chunk migrates between shards during a change stream session, some events may be re-delivered. Design consumers to be idempotent. Performance: a deployment-level change stream on a large sharded cluster can be expensive as it monitors all shards simultaneously. Scope to a specific namespace when possible.' },
    { q: 'How do you implement reliable exactly-once change stream processing?', a: 'Exactly-once processing is hard to guarantee but can be approached with at-least-once + idempotent processing. At-least-once pattern: process the event. Persist the result AND the resume token atomically (in the same database transaction if possible). On restart, resume from the last persisted token. If the application crashes between processing and persisting the token, the event is reprocessed on restart — hence at-least-once. Making it effectively exactly-once: idempotent processing — applying the same event twice produces the same result as applying it once. Use the change event _id (resume token) as a deduplication key. Store processed event IDs in a processed_events collection and check before processing. Transactional processing: if your processing and token persistence are in the same MongoDB database, wrap both in a multi-document transaction: begin transaction, process and write result, write resume token, commit. If the transaction commits, both the result and the token are saved. If the transaction aborts, both are rolled back and the event is reprocessed.' },
    { q: 'What are Atlas triggers and how do they relate to change streams?', a: 'Atlas Triggers are a managed, serverless abstraction over change streams built into MongoDB Atlas. Instead of writing and operating a long-running change stream consumer, you define a trigger that automatically calls a JavaScript function (Atlas Function) when a change event matches your criteria. Trigger types: database trigger — fires on collection change events (insert, update, delete, replace). Authentication trigger — fires on user login/creation/deletion events. Scheduled trigger — fires on a cron schedule (not change stream based). Configuration: source: select collection, operation types, and whether you need full document. Function: write a JavaScript function that receives the change event. The function runs in Atlas infrastructure — no servers to manage. Error handling: Atlas retries failed trigger executions with configurable retry policy. Failed events can be sent to a dead letter queue. vs raw change streams: triggers are simpler to deploy and operate. Raw change streams give more control (language choice, processing logic, batching). Use triggers for simple event-driven workflows. Use raw change streams for high-throughput pipelines, custom languages, or complex processing logic.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Change streams subscribe to real-time MongoDB changes via the oplog; use pipeline filters server-side, persist resume tokens, and handle the invalidate event.',
    mustKnow: [
      'Requires replica set (or sharded cluster) — built on the oplog',
      'collection.watch([pipeline], options) — pipeline filters run server-side',
      'fullDocument: "updateLookup" needed to get full doc on update events',
      'Resume token (event._id) must be persisted for reliable resume-after-restart',
      'invalidate event — stream closes; handle to reopen or alert',
      'At-least-once delivery — make handlers idempotent',
      'Close the stream on shutdown: changeStream.close()',
    ],
    interviewFocus: [
      'Change streams vs polling — why change streams are better',
      'Resume token and at-least-once delivery semantics',
      'fullDocument: "updateLookup" — when and why',
      'Pipeline filter vs application-code filter',
      'Invalidate event handling',
    ],
  };
}
