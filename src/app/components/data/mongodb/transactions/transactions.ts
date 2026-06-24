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
      a: 'Read concern <code>"snapshot"</code> (the default for transactions) means all reads in the transaction see a consistent snapshot of the data as of the transaction start time — other writers\' committed changes during the transaction are NOT visible to this transaction. This provides strong consistency: you can read the same document multiple times and get the same result, and your reads and writes are consistent with each other. Without snapshot isolation, you might read stale data or see data that was committed by a concurrent writer between your reads.',
    },
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
