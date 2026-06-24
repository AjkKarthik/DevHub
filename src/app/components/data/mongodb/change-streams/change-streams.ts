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
