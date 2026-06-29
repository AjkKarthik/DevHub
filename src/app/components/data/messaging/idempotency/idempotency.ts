import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  selector: 'app-idempotency',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './idempotency.html',
  styleUrl: './idempotency.scss'
})
export class Idempotency {
  readonly quickRef: QuickRefItem[] = [
    { name: 'Idempotent', type: 'keyword', desc: 'Operation that produces the same result when applied multiple times' },
    { name: 'Idempotency key', type: 'keyword', desc: 'Unique ID per operation used to detect and deduplicate replays' },
    { name: 'At-least-once', type: 'keyword', desc: 'Delivery guarantee: message delivered one or more times; duplicates possible' },
    { name: 'Exactly-once', type: 'keyword', desc: 'Delivery guarantee: each message processed exactly once; hardest to achieve' },
    { name: 'Deduplication table', type: 'keyword', desc: 'DB table storing processed idempotency keys to block replays' },
    { name: 'Natural idempotency', type: 'keyword', desc: 'Operations like SET or UPSERT are idempotent by nature' },
    { name: 'Semantic idempotency', type: 'keyword', desc: 'Checking state before acting so replays have no additional effect' },
    { name: 'Optimistic locking', type: 'keyword', desc: 'Version/ETag check to detect concurrent updates and prevent double-processing' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'Why Idempotency Matters in Messaging',
      points: [
        'All popular message brokers (Kafka, SQS, RabbitMQ) provide at-least-once delivery — duplicates can occur on retry or rebalance.',
        'Without idempotent consumers, duplicate messages cause double charges, duplicate emails, or double inventory deductions.',
        'Achieving exactly-once end-to-end requires idempotent consumers even when the broker offers exactly-once delivery.',
        'Design for at-least-once; implement idempotency; reach exactly-once semantics by composition.',
      ]
    },
    {
      heading: 'Idempotency Strategies',
      points: [
        'Natural idempotency: use SET/UPDATE rather than INCREMENT; the same value applied twice has no extra effect.',
        'Idempotency key table: store each processed key in a database; skip if key already exists (ON CONFLICT DO NOTHING).',
        'Conditional write (optimistic lock): check a version/ETag before updating; fail concurrent duplicates.',
        'Semantic check: check current state before acting (only ship an "unshipped" order; skip if already shipped).',
      ]
    },
    {
      heading: 'Kafka Idempotent Producer',
      points: [
        'Setting idempotent: true assigns a producer ID and sequence number to each record.',
        'The broker deduplicates retried records with the same producer ID and sequence number.',
        'This provides exactly-once at the producer-to-broker level; the consumer must still be idempotent end-to-end.',
        'Transactional producers extend this to atomic multi-topic writes (read-process-write without duplicates).',
      ]
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'Idempotency Key Table (PostgreSQL)',
      language: 'typescript',
      code: `import { Pool } from 'pg';

const db = new Pool({ connectionString: process.env.DATABASE_URL });

// Schema
// CREATE TABLE processed_events (
//   idempotency_key TEXT PRIMARY KEY,
//   processed_at    TIMESTAMPTZ DEFAULT now()
// );

async function processMessageIdempotently(
  messageId: string,
  payload: { orderId: string; amount: number }
) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Try to insert the idempotency key atomically
    const { rowCount } = await client.query(
      \`INSERT INTO processed_events (idempotency_key)
       VALUES ($1)
       ON CONFLICT (idempotency_key) DO NOTHING\`,
      [messageId]
    );

    if (rowCount === 0) {
      // Key already exists — this is a duplicate
      console.log('Duplicate message, skipping:', messageId);
      await client.query('ROLLBACK');
      return;
    }

    // Process the message (inside the same transaction)
    await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
      [payload.amount, payload.orderId]
    );

    await client.query('COMMIT');
    console.log('Processed:', messageId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}`,
    },
    {
      label: 'Semantic Idempotency (State Check)',
      language: 'typescript',
      code: `// Semantic check: only process if in the expected prior state

async function shipOrder(orderId: string, messageId: string) {
  const order = await db.orders.findById(orderId);

  // Guard: only ship orders that are in 'payment_accepted' state
  if (order.status !== 'payment_accepted') {
    console.log(\`Skipping shipment for \${orderId} — status: \${order.status}\`);
    return; // duplicate or out-of-order message
  }

  // Update to shipped (idempotent if retried at 'shipped' state — guard above handles it)
  await db.orders.update(orderId, {
    status:   'shipped',
    shippedAt: new Date().toISOString(),
  });

  console.log('Order shipped:', orderId);
}

// Natural idempotency example — SET vs INCREMENT
async function applyDiscount(orderId: string, discountPct: number) {
  // Idempotent: SET the discount to a fixed value
  await db.query(
    'UPDATE orders SET discount_pct = $1 WHERE id = $2',
    [discountPct, orderId]
  );
  // NOT idempotent: this would apply the discount twice on replay:
  // UPDATE orders SET total = total * (1 - $1) WHERE id = $2
}`,
    },
    {
      label: 'Kafka Idempotent & Transactional Producer',
      language: 'typescript',
      code: `import { Kafka } from 'kafkajs';

const kafka = new Kafka({ brokers: ['localhost:9092'] });

// --- Idempotent producer (exactly-once per partition) ---
const idempotentProducer = kafka.producer({
  idempotent: true,               // assigns producerId + sequence numbers
  maxInFlightRequests: 5,         // required with idempotent
});
await idempotentProducer.connect();

await idempotentProducer.send({
  topic: 'orders',
  acks:  -1,   // required with idempotent
  messages: [{ key: 'ORD-001', value: JSON.stringify({ id: 'ORD-001' }) }],
});

// --- Transactional producer (atomic multi-topic write) ---
const txProducer = kafka.producer({
  idempotent: true,
  transactionalId: 'order-processor-1', // unique per producer instance
  maxInFlightRequests: 5,
});
await txProducer.connect();

const transaction = await txProducer.transaction();
try {
  await transaction.send({
    topic: 'orders.confirmed',
    messages: [{ key: 'ORD-001', value: '{"status":"confirmed"}' }],
  });
  await transaction.send({
    topic: 'inventory.reserved',
    messages: [{ key: 'SKU-A', value: '{"qty":1}' }],
  });
  await transaction.commit(); // both topics written atomically
  console.log('Transaction committed');
} catch {
  await transaction.abort();  // both writes rolled back
}`,
    },
  ];

  readonly mistakes: CommonMistake[] = [
    {
      title: 'Using non-idempotent operations in a consumer (e.g., INCREMENT)',
      wrong: `consumer.run({ eachMessage: async ({ message }) => {
  const { userId, points } = JSON.parse(message.value!.toString());
  // Replay sends points twice → double loyalty points!
  await db.query('UPDATE users SET points = points + $1 WHERE id = $2', [points, userId]);
}});`,
      right: `consumer.run({ eachMessage: async ({ message }) => {
  const { userId, points, eventId } = JSON.parse(message.value!.toString());
  await db.query(
    \`INSERT INTO processed_events (id) VALUES ($1) ON CONFLICT DO NOTHING\`,
    [eventId]
  );
  // Only runs if eventId was not already processed
  await db.query('UPDATE users SET points = points + $1 WHERE id = $2', [points, userId]);
}});`,
      explanation: 'Increment operations applied twice double the effect. Protect with an idempotency key table — skip the increment if the event ID was already processed.'
    },
    {
      title: 'Generating idempotency keys that are not unique enough',
      wrong: `// Using timestamp as idempotency key — two messages in the same millisecond collide
const key = Date.now().toString();`,
      right: `// Use a UUID or composite key unique to the business event
import { randomUUID } from 'crypto';
const key = randomUUID(); // or: \`payment-\${orderId}-\${attemptNumber}\``,
      explanation: 'Timestamps are not unique enough for idempotency keys. Use UUID v4 or a domain-specific composite key (e.g., orderId+eventType) that uniquely identifies each business operation.'
    },
    {
      title: 'Checking idempotency key OUTSIDE the database transaction',
      wrong: `// Check and act in separate operations — race condition!
const exists = await db.processedEvents.findById(messageId);
if (!exists) {
  // Another thread/process may insert between here and the INSERT below
  await doWork();
  await db.processedEvents.insert(messageId);
}`,
      right: `// Check + insert + work in one atomic transaction
await db.transaction(async (tx) => {
  const { rowCount } = await tx.query(
    'INSERT INTO processed_events (id) VALUES ($1) ON CONFLICT DO NOTHING', [messageId]
  );
  if (rowCount === 0) return; // duplicate
  await doWork(tx);
});`,
      explanation: 'A check-then-insert outside a transaction has a race condition: two concurrent replays can both pass the check. The INSERT ON CONFLICT must be inside the same transaction as the business work.'
    },
    {
      title: 'Not pruning the idempotency key table',
      wrong: `// Keys accumulate forever — table grows unbounded → slow lookups
CREATE TABLE processed_events (id TEXT PRIMARY KEY, processed_at TIMESTAMPTZ);`,
      right: `// Add expiry column and prune old entries periodically
CREATE TABLE processed_events (
  id           TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ DEFAULT now()
);
-- Prune keys older than 30 days (outside retention window)
DELETE FROM processed_events WHERE processed_at < now() - INTERVAL '30 days';`,
      explanation: 'Idempotency key tables grow without bounds. Define a retention window (e.g., 30 days) that exceeds your broker\'s retention period, then prune expired keys with a background job.'
    },
  ];

  readonly challenge: Challenge = {
    title: 'Idempotent Payment Processor',
    language: 'typescript',
    description: 'Build a payment processor that consumes Kafka messages (each with a paymentId and amount). Use an in-memory Set as a processed-keys store (simulate a DB). The processor should: skip duplicates, apply the payment exactly once, and log whether each message was "processed" or "skipped (duplicate)".',
    hints: [
      'Use a Set<string> to store processed paymentIds',
      'Check Set before processing; add to Set after processing',
      'Simulate duplicate by publishing the same paymentId twice',
    ],
    starterCode: `import { Kafka } from 'kafkajs';

const processedIds = new Set<string>();

async function startPaymentProcessor() {
  const kafka    = new Kafka({ brokers: ['localhost:9092'] });
  const consumer = kafka.consumer({ groupId: 'payment-processor' });
  // TODO: idempotent consume from 'payments' topic
}`,
    solution: `import { Kafka } from 'kafkajs';

const processedIds = new Set<string>();

async function startPaymentProcessor() {
  const kafka    = new Kafka({ brokers: ['localhost:9092'] });
  const consumer = kafka.consumer({ groupId: 'payment-processor' });
  const producer = kafka.producer();

  await consumer.connect();
  await producer.connect();
  await consumer.subscribe({ topic: 'payments' });

  // Publish two payments, one duplicate
  await producer.send({
    topic: 'payments',
    messages: [
      { value: JSON.stringify({ paymentId: 'PAY-001', amount: 99.99 }) },
      { value: JSON.stringify({ paymentId: 'PAY-002', amount: 49.99 }) },
      { value: JSON.stringify({ paymentId: 'PAY-001', amount: 99.99 }) }, // duplicate
    ],
    acks: -1,
  });
  await producer.disconnect();

  await consumer.run({
    eachMessage: async ({ message }) => {
      const { paymentId, amount } = JSON.parse(message.value!.toString());

      if (processedIds.has(paymentId)) {
        console.log(\`Skipped (duplicate): \${paymentId}\`);
        return;
      }

      // Process
      console.log(\`Processed: \${paymentId} — $\${amount}\`);
      processedIds.add(paymentId);
    },
  });
}`,
  };

  readonly quiz: QuizQuestion[] = [
    { q: 'Why must consumers be idempotent even when the broker offers at-least-once delivery?', options: ['Brokers always drop duplicates', 'At-least-once means duplicates can occur; idempotency prevents double processing', 'Consumers determine delivery semantics', 'Idempotency is optional when using SQS FIFO'], answer: 1, explanation: 'At-least-once guarantees delivery but allows duplicates on retry. Only idempotent consumers prevent double charges, emails, or writes.' },
    { q: 'Which SQL operation is naturally idempotent for updating a value?', options: ['INSERT', 'INCREMENT (UPDATE x = x + 1)', 'SET (UPDATE x = 5)', 'DELETE then INSERT'], answer: 2, explanation: 'SET assigns an absolute value. Applied twice, the result is identical. INCREMENT applies a delta each time — not idempotent.' },
    { q: 'What does the Kafka idempotent producer prevent?', options: ['Duplicate consumption by consumers', 'Out-of-order messages across partitions', 'Duplicate records from producer retries on the same partition', 'Consumer group rebalances'], answer: 2, explanation: 'Idempotent producers get a PID and per-partition sequence number. The broker deduplicates records with the same PID+sequence on retry.' },
    { q: 'Why must the idempotency key check and business write be in the same transaction?', options: ['For performance', 'To prevent race conditions where two concurrent replays both pass the check', 'Because Kafka requires it', 'For audit logging'], answer: 1, explanation: 'Check-then-insert outside a transaction has a time-of-check/time-of-use race. A concurrent duplicate can slip through between the check and the insert.' },
    { q: 'What is an idempotency key and where should it come from?', options: ['Generated by the broker', 'Generated by the producer and unique per logical operation', 'Generated by the consumer', 'A hash of the message body'], answer: 1, explanation: 'Idempotency keys must be generated by the producer and unique per logical business operation (e.g. orderId + operationType). Broker-generated IDs change on retry; body hashes do not capture intent.' },
    { q: 'What is a natural idempotency key?', options: ['An auto-incremented database ID', 'A business identifier that uniquely identifies an operation (orderId, transactionId)', 'A timestamp', 'A UUID generated on each retry'], answer: 1, explanation: 'A natural idempotency key is derived from the business domain — orderId, transactionId, userId+date. These are stable across retries unlike UUIDs generated fresh each attempt.' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'Can I rely on Kafka FIFO exactly-once for end-to-end exactly-once?', a: 'No. Kafka exactly-once (transactional producers + read-committed isolation) prevents duplicate writes to Kafka. But your sink (database, API) is outside Kafka\'s transaction scope. The consumer must be idempotent to prevent duplicate side effects in the sink.' },
    { q: 'How long should I keep idempotency keys?', a: 'At least as long as the broker\'s message retention period, plus a safety margin. If Kafka retains messages for 7 days, keep keys for 30 days. This ensures any message that could be replayed is still covered by the deduplication window.' },
    { q: 'What is the difference between idempotent and transactional in Kafka?', a: 'Idempotent producer: deduplicates retried records to the same partition (exactly-once producer-to-broker). Transactional producer: atomically writes to multiple partitions/topics as one logical unit — all or nothing. Transactions build on idempotency.' },
    { q: 'How do you implement server-side idempotency with Redis?', a: 'Pattern: before processing, SET the idempotency key in Redis with NX (SET key result EX ttl NX). If SET returns null, the key exists — return the stored result. If SET succeeds, process the request, then SET key to the result. Redis atomic SET NX prevents race conditions. TTL matches your retry window (e.g., 24h).' },
    { q: 'What is the difference between idempotency and at-least-once delivery?', a: '<strong>At-least-once delivery</strong>: the messaging system guarantees delivery but may duplicate messages. <strong>Idempotency</strong>: the consumer handles duplicates safely — processing the same message twice has the same effect as once. They are complementary: at-least-once delivery requires idempotent consumers to avoid double-processing side effects.' },
    { q: 'How do you make a database INSERT idempotent?', a: 'Strategies: (1) <strong>INSERT ... ON CONFLICT DO NOTHING</strong> (PostgreSQL) / <strong>INSERT IGNORE</strong> (MySQL) with a unique constraint on the idempotency key column; (2) <strong>Upsert</strong>: INSERT ... ON CONFLICT DO UPDATE SET ... (safe if updates are idempotent); (3) Check-and-insert in a transaction with a unique index. Always pair with the idempotency key as the unique column.' },
  ];

  readonly revision: RevisionSummary = {
    oneLiner: 'Idempotency prevents duplicate effects when messages are replayed; always pair at-least-once delivery with idempotent consumers.',
    mustKnow: [
      'At-least-once = duplicates possible; idempotent consumers = safe to replay',
      'Natural idempotency: SET over INCREMENT; UPSERT over INSERT',
      'Idempotency key table: INSERT ON CONFLICT DO NOTHING inside same DB transaction as work',
      'Semantic check: guard on prior state (only ship "unshipped" orders)',
      'Kafka idempotent producer: deduplicates retried records per partition via PID+seq',
      'Prune idempotency key table — retain longer than broker retention period',
    ],
    interviewFocus: [
      'Why at-least-once delivery requires idempotent consumers',
      'Idempotency key patterns: UUID, composite key, natural key',
      'Transactional idempotency check: why the check must be inside the DB transaction',
      'Kafka idempotent vs transactional producer: scope and use cases',
    ],
  };
}
