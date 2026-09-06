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
  selector: 'app-mongo-transactions',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
})
export class MongoTransactions {
  quickRef: QuickRefItem[] = [
    { type: 'method',  name: 'client.startSession()',      desc: 'Create a ClientSession. Required for transactions.' },
    { type: 'method',  name: 'session.withTransaction(fn)', desc: 'Run a transaction with automatic retry and commit/abort. Preferred API.' },
    { type: 'method',  name: 'session.startTransaction()', desc: 'Manually start a transaction. Requires manual commit/abort.' },
    { type: 'method',  name: 'session.commitTransaction()', desc: 'Commit all operations in the current transaction.' },
    { type: 'method',  name: 'session.abortTransaction()', desc: 'Roll back all operations in the current transaction.' },
    { type: 'method',  name: 'session.endSession()',       desc: 'Always call in a finally block to release session resources.' },
    { type: 'keyword', name: '{ session }',                desc: 'Pass session object in options of every CRUD operation inside a transaction.' },
    { type: 'keyword', name: 'Replica Set Required',       desc: 'Transactions require a replica set or sharded cluster. Single mongod does not support transactions.' },
    { type: 'keyword', name: 'ACID',                       desc: 'Atomicity, Consistency, Isolation, Durability — guaranteed by multi-document transactions.' },
    { type: 'keyword', name: 'maxCommitTimeMS',            desc: 'Maximum time to wait for transaction commit to propagate to the majority.' },
    { type: 'keyword', name: 'TransientTransactionError',  desc: 'Transient errors that should be retried. withTransaction() handles this automatically.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Multi-Document Transactions',
      points: [
        'MongoDB has supported <strong>multi-document ACID transactions</strong> since version 4.0 (replica sets) and 4.2 (sharded clusters). Before this, only single-document operations were atomic.',
        'A single-document write is <strong>always atomic</strong> in MongoDB — you don\'t need a transaction for it. Transactions are only needed when you need atomicity across multiple documents or collections.',
        'Transactions require a <strong>replica set</strong> — even for local development with a single node. Start a single-node replica set: <code>rs.initiate()</code> in mongosh after starting mongod with <code>--replSet rs0</code>. Or use MongoDB Atlas (always a replica set).',
        'The <code>withTransaction()</code> method is the recommended API. It handles: starting the transaction, retrying on transient errors (<code>TransientTransactionError</code>), committing on success, and aborting on error.',
        'Transactions in MongoDB are <strong>snapshot isolation</strong> by default — all reads within a transaction see a consistent snapshot of the data as of the transaction start time, even if other writers commit changes during the transaction.',
      ],
    },
    {
      heading: 'When to Use Transactions',
      points: [
        'Use transactions when you need <strong>atomicity across multiple documents</strong>. Classic use cases: bank account transfers (debit one account, credit another — must be atomic), inventory + order creation (decrement stock, create order), and cascading deletes (delete a post and all its comments atomically).',
        'Do NOT use transactions as a default pattern for every operation. Transactions have overhead (locking, coordination across replica set members) and a 60-second timeout. They should be the exception, not the rule.',
        'Prefer schema design to avoid transactions. The computed pattern (update stats atomically with $inc in one document), embedding (order + items in one document), and the bucket pattern eliminate many situations where transactions would otherwise be needed.',
        'Transactions <strong>time out after 60 seconds</strong>. If your transaction needs longer than 60 seconds, it will be aborted. Break long operations into smaller atomic units or use an application-level saga pattern.',
        'In sharded clusters, cross-shard transactions add significant coordination overhead. Design your shard key so related documents (those you\'d transaction together) live on the same shard, enabling single-shard transactions.',
      ],
    },
    {
      heading: 'Error Handling & Retry',
      points: [
        'Two categories of transaction errors: <strong>TransientTransactionError</strong> — transient failures (network hiccup, primary election) that should be retried. <strong>UnknownTransactionCommitResult</strong> — the commit may or may not have succeeded; retry the commit (not the whole transaction).',
        '<code>withTransaction()</code> automatically handles both error types, retrying the entire transaction on TransientTransactionError and retrying only the commit on UnknownTransactionCommitResult.',
        'The callback passed to <code>withTransaction()</code> must be <strong>idempotent</strong> — it may be called multiple times on retry. Avoid side effects (sending emails, HTTP calls) inside the callback.',
        'Always pass the session object to every CRUD operation inside the transaction: <code>collection.insertOne(doc, { session })</code>. If you forget to pass the session, that operation runs outside the transaction and is NOT rolled back on abort.',
        'Always call <code>session.endSession()</code> in a <code>finally</code> block to release session resources back to the connection pool, even if the transaction failed.',
      ],
    },
    {
      heading: 'When Multi-Document Transactions Are Actually Necessary',
      points: [
        'A large portion of use cases that seem to need multi-document transactions can actually be modeled with a single atomic document update instead — MongoDB single-document operations are always atomic by default, and restructuring data to keep related fields in one document often eliminates the need for transactions entirely.',
        'Genuine transaction use cases involve operations across multiple documents (or collections) that must succeed or fail together as a unit — a classic example is transferring funds between two separate account documents, where debiting one and crediting the other must be atomic to prevent an inconsistent intermediate state.',
        'Transactions carry real performance overhead compared to single-document atomic operations — they require additional coordination (especially in a sharded cluster, where a transaction spanning multiple shards is meaningfully more expensive than one confined to a single shard) and should be reserved for cases that genuinely require cross-document atomicity.',
        'Transaction retry logic is necessary in production code — transient errors (like a transient transaction error or a write conflict from concurrent access) are expected and should trigger an automatic retry of the entire transaction, not be treated as a permanent failure requiring manual intervention.',
      ],
    },
    {
      heading: 'Transaction Isolation and Read/Write Concerns',
      points: [
        'MongoDB transactions provide snapshot isolation — all reads within a transaction see a consistent snapshot of data as of the transaction start, and writes are only visible to other operations after the transaction commits, preventing the transaction from seeing partial updates from concurrent operations.',
        'Read concern "snapshot" combined with write concern "majority" inside a transaction provides the strongest consistency guarantee MongoDB offers — ensuring both that reads see a consistent point-in-time view and that committed writes are durably replicated to a majority of the replica set before the transaction is considered complete.',
        'Long-running transactions hold locks and resources for their entire duration, increasing the likelihood of conflicts with concurrent operations and potentially impacting overall cluster performance — transactions should be kept as short as possible, ideally completing within the default 60-second transaction timeout with significant margin.',
        'Transactions should never wrap operations with external side effects (sending an email, calling a third-party API) inside the transaction body — if the transaction later aborts and retries, that external side effect would incorrectly execute multiple times, since only the database operations themselves are rolled back on abort.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'withTransaction (Recommended)',
      language: 'typescript',
      code: `import { MongoClient, ClientSession } from 'mongodb';

const client = new MongoClient(uri);
await client.connect();

async function transferFunds(fromId: string, toId: string, amount: number) {
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const accounts = client.db('bank').collection('accounts');

      // Check balance (reads inside transaction = snapshot isolation)
      const from = await accounts.findOne({ _id: fromId }, { session });
      if (!from || from.balance < amount) {
        throw new Error('Insufficient funds');
      }

      // Debit source account
      await accounts.updateOne(
        { _id: fromId },
        { $inc: { balance: -amount } },
        { session }  // ← must pass session on every operation!
      );

      // Credit destination account
      await accounts.updateOne(
        { _id: toId },
        { $inc: { balance: amount } },
        { session }
      );

      // Log the transfer
      await client.db('bank').collection('transfers').insertOne({
        fromId, toId, amount, createdAt: new Date(),
      }, { session });

      // If anything throws → transaction aborts → all changes rolled back
    });
    console.log('Transfer committed');
  } catch (err) {
    console.error('Transfer failed and rolled back:', err);
    throw err;
  } finally {
    await session.endSession(); // always release session
  }
}`,
    },
    {
      label: 'Manual Transaction',
      language: 'typescript',
      code: `// Manual transaction API — more control, more boilerplate
async function placeOrder(userId: string, items: any[], total: number) {
  const session = client.startSession();
  session.startTransaction({
    readConcern:  { level: 'snapshot' },
    writeConcern: { w: 'majority' },
    maxCommitTimeMS: 5000,
  });

  try {
    const db = client.db('shop');

    // 1. Check stock for each item
    for (const item of items) {
      const product = await db.collection('products').findOne(
        { _id: item.productId, stock: { $gte: item.qty } },
        { session }
      );
      if (!product) throw new Error(\`Insufficient stock for \${item.productId}\`);
    }

    // 2. Decrement stock for each item
    for (const item of items) {
      await db.collection('products').updateOne(
        { _id: item.productId },
        { $inc: { stock: -item.qty } },
        { session }
      );
    }

    // 3. Create the order
    await db.collection('orders').insertOne(
      { userId, items, total, status: 'pending', createdAt: new Date() },
      { session }
    );

    // 4. Commit — all changes become visible atomically
    await session.commitTransaction();
    console.log('Order placed successfully');
  } catch (err) {
    // 5. Abort — all changes rolled back
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
}`,
    },
    {
      label: 'Setup Single-Node Replica Set',
      language: 'typescript',
      code: `// For LOCAL DEVELOPMENT: transactions need a replica set
// Option 1: Docker (easiest)
/*
docker run -d -p 27017:27017 --name mongo-rs \\
  mongo:7 --replSet rs0

# Then initialize the replica set:
docker exec -it mongo-rs mongosh --eval "rs.initiate()"
*/

// Option 2: Local mongod
/*
# Start mongod with replica set name
mongod --replSet rs0 --dbpath /data/db

# In mongosh:
rs.initiate()
rs.status()  # should show PRIMARY
*/

// Option 3: MongoDB Atlas (always a replica set, always ready)
// Connect with SRV URI: mongodb+srv://user:pass@cluster.mongodb.net

// Verify transactions work:
const client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
await client.connect();

const session = client.startSession();
try {
  await session.withTransaction(async () => {
    await client.db('test').collection('test').insertOne({ x: 1 }, { session });
    console.log('Transaction works!');
  });
} finally {
  await session.endSession();
  await client.close();
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting to pass { session } to CRUD operations inside a transaction',
      wrong: `await session.withTransaction(async () => {
  await accounts.updateOne({ _id: fromId }, { $inc: { balance: -amount } }); // no session!
  await accounts.updateOne({ _id: toId },   { $inc: { balance: amount } }, { session });
  // First update runs OUTSIDE the transaction — not rolled back if abort!
});`,
      right: `await session.withTransaction(async () => {
  await accounts.updateOne({ _id: fromId }, { $inc: { balance: -amount } }, { session });
  await accounts.updateOne({ _id: toId },   { $inc: { balance: amount } }, { session });
  // Both operations are in the transaction — rolled back together on failure
});`,
      explanation: 'Every CRUD operation inside a transaction must include { session } in its options. Without it, the operation runs outside the transaction and will NOT be rolled back if the transaction aborts — breaking atomicity silently.',
    },
    {
      title: 'Using transactions for single-document operations',
      wrong: `// Single-document writes are already atomic — no transaction needed!
const session = client.startSession();
await session.withTransaction(async () => {
  await orders.updateOne({ _id: orderId }, { $set: { status: 'shipped' } }, { session });
});
// Unnecessary overhead; slower than just calling updateOne directly`,
      right: `// Single-document write — atomic without a transaction
await orders.updateOne({ _id: orderId }, { $set: { status: 'shipped' } });`,
      explanation: 'MongoDB guarantees that single-document operations are atomic. Wrapping them in a transaction adds overhead (replica set coordination, lock acquisition) for no benefit. Only use transactions when you need atomicity across multiple documents or collections.',
    },
    {
      title: 'Side effects inside withTransaction callbacks',
      wrong: `await session.withTransaction(async () => {
  const order = await orders.insertOne(doc, { session });
  await emailService.send('confirmation', user.email); // SIDE EFFECT!
  // withTransaction may retry this callback — user gets duplicate emails!
});`,
      right: `let orderId;
await session.withTransaction(async () => {
  const result = await orders.insertOne(doc, { session });
  orderId = result.insertedId;
  // No side effects inside the callback
});
// Send email AFTER the transaction commits successfully
await emailService.send('confirmation', user.email, orderId);`,
      explanation: 'withTransaction() may retry the callback on TransientTransactionError. Any side effects (emails, HTTP calls, external service calls) inside the callback will be repeated on each retry. Keep callbacks pure — only database operations. Execute side effects after successful commit.',
    },
    {
      title: 'Not calling session.endSession() in a finally block',
      wrong: `const session = client.startSession();
await session.withTransaction(async () => { /* ... */ });
// If withTransaction throws, endSession() is never called!
// Session leaks, connection not returned to pool`,
      right: `const session = client.startSession();
try {
  await session.withTransaction(async () => { /* ... */ });
} finally {
  await session.endSession(); // always runs — even on error
}`,
      explanation: 'Sessions hold a connection from the pool. Not calling endSession() in a finally block leaks the connection when withTransaction throws. Over time, leaked sessions exhaust the connection pool and hang all database operations.',
    },
  ];

  challenge: Challenge = {
    title: 'Inventory Order System',
    language: 'typescript',
    description: 'Implement placeOrder(userId, items: [{productId, qty}]) with full ACID guarantees. The function must: (1) Verify stock for ALL items before any changes, (2) Atomically decrement stock for each item, (3) Create an order document with total price, (4) If any product is out of stock, roll back ALL changes. Use withTransaction().',
    hints: [
      'Use withTransaction() — it handles retry on TransientTransactionError.',
      'Read products inside the transaction to get snapshot-consistent stock levels.',
      'Filter by { _id: productId, stock: { $gte: qty } } to check stock in one operation.',
      'Compute total price from the product docs fetched inside the transaction.',
    ],
    starterCode: `import { MongoClient, ObjectId } from 'mongodb';
const client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
const db = client.db('shop');

async function placeOrder(
  userId: ObjectId,
  items: Array<{ productId: ObjectId; qty: number }>
) {
  // TODO: implement with withTransaction()
  // Must verify stock, decrement stock, create order — all atomically
}`,
    solution: `import { MongoClient, ObjectId } from 'mongodb';
const client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
const db = client.db('shop');

async function placeOrder(
  userId: ObjectId,
  items: Array<{ productId: ObjectId; qty: number }>
) {
  const session = client.startSession();
  let orderId: ObjectId | undefined;

  try {
    await session.withTransaction(async () => {
      const products = db.collection('products');
      const orders   = db.collection('orders');

      // 1. Verify stock for all items (snapshot read inside transaction)
      const productDocs = await Promise.all(
        items.map(item =>
          products.findOne({ _id: item.productId, stock: { $gte: item.qty } }, { session })
        )
      );

      const outOfStock = items.filter((_, i) => !productDocs[i]);
      if (outOfStock.length > 0) {
        throw new Error(\`Out of stock: \${outOfStock.map(i => i.productId).join(', ')}\`);
      }

      // 2. Compute total
      const total = items.reduce((sum, item, i) =>
        sum + (productDocs[i]!['price'] * item.qty), 0
      );

      // 3. Decrement stock for each item
      for (const item of items) {
        await products.updateOne(
          { _id: item.productId },
          { $inc: { stock: -item.qty } },
          { session }
        );
      }

      // 4. Create order
      const result = await orders.insertOne({
        userId, items, total, status: 'pending', createdAt: new Date(),
      }, { session });
      orderId = result.insertedId;
    });

    return orderId;
  } finally {
    await session.endSession();
  }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What infrastructure requirement must be met to use MongoDB transactions?',
      options: [
        'A standalone mongod instance',
        'A replica set (or sharded cluster)',
        'MongoDB Atlas only',
        'A WiredTiger storage engine configured with 16 GB RAM',
      ],
      answer: 1,
      explanation: 'Multi-document transactions require a replica set (since MongoDB 4.0) or a sharded cluster (since MongoDB 4.2). A standalone mongod (no replica set) does not support transactions. For local development, initialize a single-node replica set with rs.initiate().',
    },
    {
      q: 'What happens if you forget to pass { session } to an operation inside withTransaction?',
      options: [
        'MongoDB throws an error',
        'The operation runs outside the transaction and won\'t be rolled back on abort',
        'The session is automatically inferred',
        'The operation is queued until the session commits',
      ],
      answer: 1,
      explanation: 'Operations without { session } run outside the transaction. If the transaction aborts, these operations are NOT rolled back — they remain committed. This silently breaks the atomicity guarantee. Always pass { session } to every CRUD operation inside a transaction.',
    },
    {
      q: 'Why should you avoid side effects (like sending emails) inside a withTransaction callback?',
      options: [
        'MongoDB blocks network calls inside transactions',
        'withTransaction may retry the callback on TransientTransactionError, causing duplicate side effects',
        'Side effects slow down the transaction commit',
        'Email services don\'t support MongoDB sessions',
      ],
      answer: 1,
      explanation: 'withTransaction() retries the callback on TransientTransactionError. If you send an email inside the callback, the user receives duplicate emails on each retry. Keep callbacks pure (only database operations) and execute side effects after the transaction commits successfully.',
    },
    {
      q: 'When is a MongoDB transaction NOT needed?',
      options: [
        'When updating two documents in different collections',
        'When transferring money between two accounts',
        'When updating a single document with $set',
        'When creating an order and decrementing inventory simultaneously',
      ],
      answer: 2,
      explanation: 'Single-document writes are always atomic in MongoDB — no transaction needed. $set on one document is atomic. Transactions are only needed for atomicity across multiple documents or collections.',
    },
    {
      q: 'What is the default transaction timeout in MongoDB?',
      options: ['5 seconds', '30 seconds', '60 seconds', '300 seconds'],
      answer: 2,
      explanation: 'MongoDB transactions have a 60-second timeout by default. If a transaction runs for more than 60 seconds without committing, it is automatically aborted. Design transactions to complete in well under 60 seconds; break long operations into smaller units.',
    },
    { q: 'What ACID properties do MongoDB multi-document transactions provide?', options: ['MongoDB transactions provide only Atomicity and Consistency but not Isolation — concurrent transactions can see each others uncommitted writes', 'MongoDB transactions provide full ACID guarantees: Atomicity (all operations commit or all roll back), Consistency (constraints are maintained), Isolation (snapshot isolation guaranteed for every transaction regardless of read concern level, though the read concern level itself defaults to local, not snapshot), and Durability (committed data persists)', 'MongoDB transactions provide ACID guarantees only on standalone instances — replica sets use eventual consistency and cannot provide true Isolation', 'MongoDB transactions provide Atomicity per document by default; Consistency and Isolation require the Enterprise edition'], answer: 1, explanation: 'ACID in MongoDB transactions: Atomicity: all operations within a transaction either all succeed (commit) or all fail (abort). No partial updates. If any operation in the transaction errors, all prior operations are rolled back. Consistency: after a transaction commits, all reads reflect the committed state. Invariants and schema validation rules are enforced. Isolation: Snapshot isolation (read concern snapshot): each transaction sees a consistent snapshot of the data as of the transaction start time. Other concurrent transactions do not see each others uncommitted writes. The read concern LEVEL defaults to local (inherited from the session, then the client, if unspecified) — not snapshot. Even under local read concern, the transaction still gets snapshot isolation as a behavior; explicitly requesting read concern snapshot adds a stronger guarantee on top (the snapshot is majority-committed data, not just locally-available data). Durability: committed transactions are durable as per the write concern. With w: majority, data survives the loss of a minority of replica set members. Snapshot isolation: set at the transaction level: session.startTransaction({ readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } }). Snapshot isolation prevents: dirty reads, non-repeatable reads, and phantom reads. MongoDBs transaction isolation model is similar to PostgreSQL serializable snapshot isolation.' },
    { q: 'What is the difference between single-document atomicity and multi-document transactions in MongoDB?', options: ['Single-document operations are non-atomic in MongoDB — they can be interrupted mid-write, making multi-document transactions required for all data integrity needs', 'MongoDB guarantees atomicity for all operations on a single document (including complex nested updates) without needing a transaction; multi-document transactions are needed only when atomicity is required across multiple documents or collections', 'Multi-document transactions in MongoDB are only available for insert operations — updates and deletes across documents must use atomic single-document operations', 'Single-document atomicity is only guaranteed in standalone deployments — replica sets require explicit transactions for all atomic operations'], answer: 1, explanation: 'Single-document atomicity: every MongoDB write operation on a single document is atomic, including: { $set: { a: 1, b: 2 } } — both fields update atomically. { $push: { array: item }, $inc: { count: 1 } } — push and increment happen atomically. Nested updates: { "address.city": "NYC", "address.zip": "10001" } — both sub-fields update atomically. This means many use cases that require a transaction in SQL do not need one in MongoDB, IF the related data is embedded in one document. When to use transactions: transfer money between two account documents (debit one, credit another). Create an order and decrement inventory (two collections). Mark a task complete and update a counter in a separate summary document. Transactions are expensive: they add latency (especially in distributed/sharded clusters). Use embedding to avoid them where possible. Schema design that embeds related data into one document can eliminate 90% of transaction needs. Rule of thumb: if you find yourself needing transactions frequently, revisit the schema design first.' },
    { q: 'How should you implement retry logic for MongoDB transactions?', options: ['MongoDB transactions never need retry logic because the driver automatically retries all failed transactions indefinitely until they succeed', 'Transactions can fail with transient errors (write conflicts, primary elections) that are safe to retry — use withTransaction() for automatic retry, or implement manual retry with exponential backoff for TransientTransactionError and UnknownTransactionCommitResult labels', 'Retry logic should only be implemented for the commit step — if any operation within the transaction fails, the entire transaction must be abandoned and not retried', 'MongoDB transactions use optimistic locking by default, so conflicting transactions automatically merge their changes without failing'], answer: 1, explanation: 'Error labels for transactions: TransientTransactionError: a transient error occurred (e.g., write conflict, primary election, network hiccup). The entire transaction can be retried. UnknownTransactionCommitResult: the commit operation was sent but the result is unknown (network error after commit). You should retry the commit only (the transaction logic has already executed). Using withTransaction() (recommended): session.withTransaction(async () => { /* operations */ }). withTransaction handles both error types automatically with retry. Manual retry pattern: const MAX_RETRIES = 3; for (let i = 0; i < MAX_RETRIES; i++) { try { session.startTransaction(); /* operations */ await session.commitTransaction(); break; } catch (err) { await session.abortTransaction(); if (!err.hasErrorLabel("TransientTransactionError") || i === MAX_RETRIES - 1) throw err; } }. Write conflicts: occur when two transactions try to write the same document simultaneously. One succeeds, the other gets TransientTransactionError and should retry. The retry is safe because the transaction has not committed. Idempotency: ensure retried transactions are idempotent — check for existing records before inserting to avoid duplicates on retry.' },
    { q: 'What is the performance overhead of MongoDB transactions and how can you minimize it?', options: ['Transactions in MongoDB have zero overhead compared to non-transactional operations because the MVCC storage engine handles all concurrency transparently', 'Transactions add overhead due to acquiring document-level locks, maintaining a transaction record, potential write conflicts, and the additional round trips for commit — they should be used only when atomicity is truly required', 'Transactions are faster than non-transactional writes because they batch multiple operations into a single network round trip, reducing total latency', 'Transaction overhead only applies to read operations — write operations within transactions have the same performance as standalone write operations'], answer: 1, explanation: 'Transaction overhead sources: lock acquisition: MongoDB uses document-level locks within a transaction. Other transactions modifying the same documents must wait. Long-running transactions increase lock contention. Snapshot maintenance: WiredTiger maintains a consistent view of data for the duration of the transaction. Long transactions pin old data versions in memory, increasing cache pressure. Commit round trip: commitTransaction() requires a network round trip plus journal flush on the primary and majority acknowledgment from secondaries. Transaction record: each transaction creates bookkeeping overhead in the oplog. Distributed transaction overhead (sharded clusters): coordinator writes to the config server. Cross-shard locking. Two-phase commit protocol. Significantly higher latency than single-shard transactions. Minimizing overhead: keep transactions short — complete within milliseconds, not seconds. Minimize the number of documents touched per transaction. Use embedding to avoid cross-collection transactions. Avoid transactions for read-only operations (use snapshot read concern instead). Use transactions only when truly needed — most MongoDB schema designs avoid them through careful embedding. 60-second limit: transactions have a 60-second lifetime limit (transactionLifetimeLimitSeconds). Operations running longer abort automatically.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use a transaction vs redesigning my schema?',
      a: 'Schema design should be your first tool. If you find yourself needing a transaction, ask: "Can I embed this data to make it one document?" (e.g., embed order items in the order). "Can I use the computed pattern to avoid the multi-document update?" (e.g., $inc a counter atomically). "Can I use findOneAndUpdate for an atomic compare-and-swap?" Use transactions only when schema redesign is impractical or the atomicity requirement genuinely spans independently-lifed collections (e.g., bank accounts are always separate documents by design).',
    },
    {
      q: 'What is the TransientTransactionError and how is it handled?',
      a: '<strong>TransientTransactionError</strong> is thrown when a transaction fails due to a transient condition — network hiccup, primary election, lock contention. The transaction can safely be retried from the beginning. <code>withTransaction()</code> automatically detects and retries on this error. If using the manual API, check <code>err.errorLabels?.includes("TransientTransactionError")</code> in your catch block and retry.',
    },
    {
      q: 'Do transactions work across different collections?',
      a: 'Yes — transactions can span multiple collections within the same database, and in sharded clusters, across multiple shards (since MongoDB 4.2). Cross-collection transactions work transparently: just pass the same session to operations on different collections. However, cross-database transactions are not supported — all collections in a transaction must be in the same database.',
    },
    {
      q: 'How do I handle a transaction that keeps failing?',
      a: '<code>withTransaction()</code> retries on TransientTransactionError up to a default number of times, then throws. Handle it: (1) Implement exponential backoff in a retry wrapper around <code>withTransaction()</code>. (2) Set a reasonable maxTimeMS to prevent hanging. (3) Check for deadlocks (two transactions each waiting for the other\'s lock) — restructure the operations to always acquire locks in the same order. (4) Reduce transaction scope — long transactions have higher chance of conflict; commit sooner, do less.',
    },
    {
      q: 'What is read concern "snapshot" in a transaction?',
      a: 'Read concern <code>"snapshot"</code> — despite the name overlap, this is NOT the default read concern for a transaction. If unspecified, a transaction inherits the session-level (then client-level) read concern, which is typically <code>"local"</code>. Explicitly setting <code>"snapshot"</code> adds a stronger guarantee: it ensures the transaction\'s snapshot is majority-committed data, not just locally-available data. Separately — and this applies regardless of which read concern level is set — every MongoDB transaction already provides <strong>snapshot isolation</strong> as a behavior: all reads within the SAME transaction see one consistent view of the data as of the transaction\'s start, with no other writer\'s changes appearing mid-transaction. Read concern <code>"snapshot"</code> and snapshot isolation are related but distinct: one is an explicit, non-default read concern LEVEL; the other is a guarantee every transaction already has.',
    },
    { q: 'How do distributed transactions work across a sharded MongoDB cluster?', a: 'Distributed transactions (MongoDB 4.2+): allow a single transaction to span multiple shards. Architecture: coordinator shard: one shard is chosen as the transaction coordinator. Responsible for the two-phase commit (2PC) protocol. Participant shards: all shards that receive write operations within the transaction. Two-phase commit: Phase 1 (Prepare): coordinator sends "prepare" to all participant shards. Each shard reserves resources and votes "ready" or "abort". Phase 2 (Commit): if all shards voted "ready", coordinator sends "commit" to all. If any shard voted "abort", coordinator sends "abort" to all. Performance impact: distributed transactions are significantly more expensive than single-shard transactions. Each phase requires network round trips between coordinator and all participants. Latency depends on the number of shards involved. Optimization: design the shard key so that most transactions touch only one shard (co-locate related data). A transaction that touches only one shard avoids 2PC entirely. Multi-document transaction within one shard: same performance as a replica set transaction. Recovery: if the coordinator crashes after Phase 1, the transaction is in doubt. MongoDB has a recovery mechanism using a transaction record in the config server. Participant shards hold their prepared state until the coordinator recovers and sends a decision.' },
    { q: 'What is the transactionLifetimeLimitSeconds parameter and when should you change it?', a: 'transactionLifetimeLimitSeconds: controls the maximum duration a transaction can run before MongoDB automatically aborts it. Default: 60 seconds. Applies to: all multi-document transactions (local and distributed). Monitored by: a background periodic cleanup job that scans for transactions exceeding the limit. When the limit is exceeded: MongoDB aborts the transaction and any in-progress operations fail with TransactionExceededLifetimeLimitSeconds. The client receives a TransientTransactionError (safe to retry). Changing the limit: db.adminCommand({ setParameter: 1, transactionLifetimeLimitSeconds: 300 }). Or in mongod.conf: setParameter: transactionLifetimeLimitSeconds: 300. When to change: only increase the limit if you have legitimate long-running transactions that cannot be refactored (e.g., batch data migrations within a transaction). Never increase to work around a design problem — instead, redesign the transaction to be shorter. Decreasing: set a lower limit to catch runaway transactions early and free locks faster. Recommended value for most applications: 30 seconds (tighter than the default, catches issues sooner). Best practice: application logic should commit transactions within seconds, not minutes. If a transaction regularly approaches 60 seconds, it is a design problem.' },
    { q: 'What MongoDB operations cannot be used inside a multi-document transaction?', a: 'Operations NOT supported in transactions: DDL operations: createCollection, createIndex, dropCollection, dropDatabase, renameCollection — schema changes cannot occur inside a transaction. Create collection implicitly: inserting into a non-existent collection inside a transaction will fail (the collection must already exist). Exception: MongoDB 4.4+ allows creating a collection inside a transaction IF the collection does not exist, but only in certain conditions. count() command: use countDocuments() instead. Some aggregation stages: $out (writes to a collection) is not supported in transactions. $merge may have restrictions. Time series collections: operations on time series collections cannot participate in transactions. Capped collections: writes to capped collections inside transactions are not supported. System collections: operations on system.* collections (user management, etc.) cannot be used in transactions. Read concern linearizable: not supported inside transactions. Text indexes and $text: not supported in transactions. Administrative commands: creating users, setting parameters, etc. Within-transaction limits: "maximum 1000 write operations per transaction" is a widely-repeated PERFORMANCE RECOMMENDATION (from MongoDB\'s own best-practices guidance), not a hard, technically-enforced cap — MongoDB\'s own Production Considerations page names no such fixed operation count. The REAL hard limits are: each individual oplog entry a transaction generates must fit within the 16MB BSON document size limit (MongoDB automatically splits a transaction across as many oplog entries as needed, so the overall transaction is NOT capped at 16MB total), and — the limit most guides omit entirely — a transaction that cannot fit in the WiredTiger cache at all aborts outright with a TransactionTooLargeForCache error, regardless of how many operations it contains. Practical guideline: keep transactions to simple read-then-write patterns on regular collections with existing schema. Avoid any DDL or administrative operations.' },
    { q: 'How does causal consistency relate to transaction isolation in MongoDB?', a: 'Causal consistency: a guarantee that if operation A causes operation B, then anyone who sees B must also see A. In other words, the order of causally related operations is preserved. MongoDB causal consistency: enabled per session: const session = client.startSession({ causalConsistency: true }). Within a causally consistent session, reads always see the results of prior writes in the same session, even when reading from secondaries. Without causal consistency: you write to the primary, then immediately read from a secondary. The secondary may not have replicated the write yet — you see stale data. With causal consistency: the read on the secondary is held until the secondary has applied the write you just made on the primary. Relation to transactions: transactions use snapshot isolation — each transaction sees a consistent snapshot as of the transaction start. Within a transaction, causal consistency is implicit (you see your own writes). Across transactions in the same session: causal consistency ensures the second transaction sees the commits of the first. afterClusterTime: MongoDB uses a logical clock (cluster time) to implement causal consistency. Each operation returns a clusterTime. Subsequent reads include afterClusterTime to ensure they see data as of at least that point. Use cases: read-your-own-writes on a secondary. Secondary reads in a distributed application where the write happened moments before on a different server. Causal consistency has a latency cost — secondaries must confirm they are up to date before serving the read.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'MongoDB multi-document ACID transactions require a replica set; use withTransaction() for automatic retry; always pass { session } to every operation.',
    mustKnow: [
      'Transactions require replica set — not supported on standalone mongod',
      'withTransaction(): auto retry on TransientTransactionError; preferred API',
      'Pass { session } to EVERY CRUD operation inside the transaction',
      'Always call session.endSession() in a finally block',
      'Transactions time out after 60 seconds — design for speed',
      'Single-document writes are always atomic — no transaction needed',
      'Side effects in callbacks are repeated on retry — do them after commit',
    ],
    interviewFocus: [
      'When to use a transaction vs schema redesign',
      'TransientTransactionError and withTransaction() retry behavior',
      'Forgetting { session } — the silent atomicity bug',
      'Snapshot isolation within a transaction',
      'Replica set requirement for transactions',
    ],
  };
}
