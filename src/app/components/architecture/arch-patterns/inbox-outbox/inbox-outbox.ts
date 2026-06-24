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
  selector: 'app-arch-inbox-outbox',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './inbox-outbox.html',
  styleUrl: './inbox-outbox.scss',
})
export class ArchInboxOutbox {

  quickRef: QuickRefItem[] = [
    { name: 'Outbox Pattern', type: 'keyword', desc: 'Write event to DB in same transaction as state change; relay process publishes to broker' },
    { name: 'Inbox Pattern', type: 'keyword', desc: 'Consumer records received message ID in DB before processing; prevents duplicate processing' },
    { name: 'Dual-Write Problem', type: 'keyword', desc: 'Writing to DB and publishing to broker in two separate operations — one can fail while the other succeeds' },
    { name: 'Relay Process', type: 'keyword', desc: 'Background worker that reads the Outbox table and publishes unpublished events to the broker' },
    { name: 'Transactional Outbox', type: 'keyword', desc: 'Outbox write and state change in a single ACID transaction — guarantees both happen or neither does' },
    { name: 'At-Least-Once', type: 'keyword', desc: 'Delivery guarantee: message is delivered at least once; duplicates possible; consumers must be idempotent' },
    { name: 'Change Data Capture', type: 'keyword', desc: 'Debezium-style: monitor DB transaction log to capture Outbox inserts and relay to broker automatically' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The Dual-Write Problem',
      points: [
        'A common pattern: save to database, then publish an event to the message broker. Two separate operations.',
        'Failure scenario A: DB succeeds, broker publish fails → state changed but no event published → consumers never know.',
        'Failure scenario B: broker publish succeeds, DB save fails → event published for a state change that never happened.',
        'This is the dual-write race — it is impossible to make two separate systems atomic without a distributed transaction.',
        'The Outbox Pattern solves this by reducing two operations to one: write the event INTO the database alongside the state change.',
      ],
    },
    {
      heading: 'The Outbox Pattern',
      points: [
        'The Outbox is a table in the same database as the service\'s domain data.',
        'In a single ACID transaction: INSERT the domain state change AND INSERT the event into the Outbox table.',
        'A relay process (background worker or Debezium CDC) reads unprocessed rows from the Outbox and publishes them to the broker.',
        'After successful publish, the relay marks the Outbox row as published (or deletes it).',
        'If the relay crashes before publishing, it retries — events are published at least once, so consumers must be idempotent.',
      ],
    },
    {
      heading: 'The Inbox Pattern',
      points: [
        'The Inbox solves the consumer side: what if the consumer processes a message, then crashes before acknowledging?',
        'The broker redelivers — consumer processes the same message twice without the Inbox.',
        'Inbox: before processing, INSERT the message ID into an inbox table inside the same DB transaction as the processing.',
        'On duplicate delivery, the INSERT fails (unique constraint on message ID) — consumer knows it already processed this message.',
        'Together: Outbox guarantees publishing; Inbox guarantees exactly-once processing on the consumer side.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Outbox Pattern',
      language: 'typescript',
      code: `// OUTBOX TABLE (in the same DB as domain data)
// CREATE TABLE outbox (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   topic TEXT NOT NULL,
//   payload JSONB NOT NULL,
//   created_at TIMESTAMPTZ DEFAULT NOW(),
//   published_at TIMESTAMPTZ
// );

// Single ACID transaction: state change + outbox insert
async function placeOrder(cmd: PlaceOrderCommand): Promise<string> {
  return db.transaction(async (tx) => {
    // 1. Insert domain state
    const orderId = await tx.query(
      'INSERT INTO orders (customer_id, status, total) VALUES ($1, $2, $3) RETURNING id',
      [cmd.customerId, 'pending', cmd.totalAmount]
    ).then(r => r.rows[0].id);

    // 2. Insert event into Outbox (same transaction — atomic!)
    await tx.query(
      'INSERT INTO outbox (topic, payload) VALUES ($1, $2)',
      ['orders.placed', JSON.stringify({
        eventId: generateUUID(),
        orderId,
        customerId: cmd.customerId,
        totalAmount: cmd.totalAmount,
        occurredAt: new Date().toISOString(),
      })]
    );

    return orderId;
    // If either INSERT fails → whole transaction rolls back → no inconsistency
  });
}`
    },
    {
      label: 'Relay Process',
      language: 'typescript',
      code: `// Relay process — polls Outbox and publishes to broker
// Runs as a separate process/job; can be a cron, long-running worker, or Debezium

async function runOutboxRelay(): Promise<void> {
  while (true) {
    // Fetch unpublished events (lock to prevent duplicate relay workers)
    const rows = await db.query(\`
      SELECT id, topic, payload
      FROM outbox
      WHERE published_at IS NULL
      ORDER BY created_at
      LIMIT 100
      FOR UPDATE SKIP LOCKED
    \`);

    for (const row of rows.rows) {
      try {
        // Publish to message broker
        await broker.publish(row.topic, row.payload);

        // Mark as published
        await db.query(
          'UPDATE outbox SET published_at = NOW() WHERE id = $1',
          [row.id]
        );
      } catch (err) {
        console.error('Failed to publish outbox event:', row.id, err);
        // Leave row as unpublished — next poll will retry
      }
    }

    // Poll every 100ms; Debezium CDC is near-real-time without polling
    await sleep(100);
  }
}

// Debezium alternative — zero polling latency, reads from DB transaction log
// Monitors the outbox table via change data capture (CDC)
// Publishes inserts to Kafka automatically as they happen`
    },
    {
      label: 'Inbox Pattern (Consumer)',
      language: 'typescript',
      code: `// INBOX TABLE (in consumer's own DB)
// CREATE TABLE inbox (
//   event_id UUID PRIMARY KEY,    -- unique per event
//   processed_at TIMESTAMPTZ DEFAULT NOW()
// );

// Consumer — idempotent processing via Inbox
async function processOrderPlaced(event: OrderPlacedEvent): Promise<void> {
  return db.transaction(async (tx) => {
    // 1. Try to record the event ID (unique constraint catches duplicates)
    try {
      await tx.query(
        'INSERT INTO inbox (event_id) VALUES ($1)',
        [event.eventId]
      );
    } catch (err: any) {
      if (err.code === '23505') { // PostgreSQL unique violation
        console.log(\`Skipping duplicate event: \${event.eventId}\`);
        return; // already processed — idempotent exit
      }
      throw err;
    }

    // 2. Process the event (same transaction as inbox insert)
    await tx.query(
      'INSERT INTO loyalty_points (customer_id, points) VALUES ($1, $2) ON CONFLICT DO UPDATE ...',
      [event.customerId, Math.floor(event.totalAmount)]
    );

    // Both the inbox record and the business logic commit atomically
    // Duplicate delivery: inbox INSERT fails uniquely → no double points awarded
  });
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Publishing to broker before the DB transaction commits',
      wrong: `await broker.publish(event); await db.save(order); // event out before state exists`,
      right: `// Save to outbox IN the transaction; relay publishes AFTER commit`,
      explanation: 'Publishing before commit means consumers may process an event for a state change that never persisted (if the DB rolls back).',
    },
    {
      title: 'Growing the Outbox table indefinitely',
      wrong: `// Outbox rows never deleted — table grows to millions of rows`,
      right: `// Delete or archive rows after successful publish; run a periodic cleanup job`,
      explanation: 'Unpruned Outbox tables degrade relay performance as queries scan more rows. Delete published rows or move them to an archive table after a retention period.',
    },
    {
      title: 'Running multiple relay workers without row-level locking',
      wrong: `// Two relay workers both pick up the same unpublished row → double publish`,
      right: `// Use SELECT ... FOR UPDATE SKIP LOCKED to claim rows exclusively`,
      explanation: 'Without exclusive locking, multiple relay instances publish the same event multiple times. FOR UPDATE SKIP LOCKED ensures each row is processed by exactly one worker.',
    },
    {
      title: 'Not making consumers idempotent even with an Inbox',
      wrong: `// Consumer uses Inbox only sometimes; other paths still process duplicates`,
      right: `// Apply Inbox pattern consistently for ALL message processing paths`,
      explanation: 'The Inbox only helps if you actually check it before every processing step. Inconsistent use leaves windows for duplicate effects.',
    },
  ];

  challenge: Challenge = {
    title: 'Implement a Simplified Outbox with In-Memory DB',
    language: 'typescript',
    description: `Implement the Outbox Pattern using an in-memory store:
1. A placeOrder function that atomically inserts into orders and outbox tables.
2. A relay function that reads unpublished outbox rows and "publishes" them (console.log).
3. After publishing, mark the row as published.
4. Call placeOrder twice, then run the relay and verify both events are published.`,
    hints: [
      'Use a single object mutation as your "transaction" (in-memory is already atomic)',
      'Outbox row: { id, topic, payload, publishedAt: null }',
      'Relay: filter rows where publishedAt === null',
      'After publish: set publishedAt = new Date().toISOString()',
    ],
    starterCode: `const ordersTable: Array<{ id: string; customerId: string; total: number }> = [];
const outboxTable: Array<{ id: string; topic: string; payload: object; publishedAt: string | null }> = [];
let seq = 0;

function placeOrder(customerId: string, total: number): string {
  // TODO: insert into ordersTable and outboxTable atomically
  return '';
}

async function runRelay(): Promise<void> {
  // TODO: publish unpublished rows
}`,
    solution: `const ordersTable: Array<{ id: string; customerId: string; total: number }> = [];
const outboxTable: Array<{ id: string; topic: string; payload: object; publishedAt: string | null }> = [];
let seq = 0;

function placeOrder(customerId: string, total: number): string {
  const orderId = 'ord-' + (++seq);
  const eventId = 'evt-' + seq;

  // Atomic in-memory "transaction"
  ordersTable.push({ id: orderId, customerId, total });
  outboxTable.push({
    id: eventId,
    topic: 'orders.placed',
    payload: { eventId, orderId, customerId, totalAmount: total, occurredAt: new Date().toISOString() },
    publishedAt: null,
  });

  return orderId;
}

async function runRelay(): Promise<void> {
  const unpublished = outboxTable.filter(r => r.publishedAt === null);
  for (const row of unpublished) {
    console.log(\`Publishing to \${row.topic}:\`, row.payload);
    row.publishedAt = new Date().toISOString(); // mark as published
  }
  console.log(\`Relay published \${unpublished.length} events\`);
}

// Demo
placeOrder('cust-1', 49.99);
placeOrder('cust-2', 129.00);
console.log('Outbox rows:', outboxTable.length);
await runRelay();
console.log('Published rows:', outboxTable.filter(r => r.publishedAt).length);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What problem does the Outbox Pattern solve?',
      options: [
        'Slow database queries',
        'The dual-write race — ensuring a domain state change and its event are always consistent',
        'Too many microservices',
        'Database connection pooling',
      ],
      answer: 1,
      explanation: 'The Outbox Pattern ensures that the domain state change and the outgoing event are written atomically in one DB transaction, eliminating the dual-write race condition.',
    },
    {
      q: 'Why must the Outbox write happen in the same transaction as the domain state change?',
      options: [
        'To improve write performance',
        'To ensure both succeed or both fail atomically — no inconsistency',
        'To reduce the number of database tables',
        'To enable schema-less events',
      ],
      answer: 1,
      explanation: 'A single ACID transaction guarantees both writes commit together. If the domain save fails, the outbox row is also rolled back — no orphaned events.',
    },
    {
      q: 'What does the Inbox Pattern prevent?',
      options: [
        'Slow event consumption',
        'Duplicate event processing on the consumer side',
        'Lost events in the broker',
        'Schema validation errors',
      ],
      answer: 1,
      explanation: 'The Inbox table records processed event IDs. On duplicate delivery, the unique constraint prevents re-processing — exactly-once semantics at the consumer.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is Debezium and how does it relate to the Outbox Pattern?',
      a: 'Debezium is a Change Data Capture (CDC) tool that monitors a database\'s transaction log (WAL in PostgreSQL, binlog in MySQL). For the Outbox Pattern: instead of polling the Outbox table, Debezium captures INSERT events from the log in near-real-time and publishes them to Kafka. Zero polling overhead, sub-second latency.',
    },
    {
      q: 'Can I implement the Outbox Pattern without polling?',
      a: 'Yes — use CDC (Debezium). CDC reads the database transaction log, so it captures Outbox inserts as they happen without any polling. This reduces latency to milliseconds and eliminates the polling infrastructure. Requires a DB that supports CDC (PostgreSQL, MySQL, SQL Server).',
    },
    {
      q: 'Do I need both Outbox and Inbox?',
      a: 'They solve different sides. Outbox: guarantees the producer publishes the event at least once. Inbox: guarantees the consumer processes it exactly once. You may use Outbox without Inbox if consumers are already naturally idempotent. Using Inbox alone without Outbox still leaves the producer open to dual-write races.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Outbox writes events into the DB in the same transaction as state changes; a relay publishes them to the broker — eliminating the dual-write race.',
    mustKnow: [
      'Dual-write problem: DB save + broker publish are two operations — either can fail independently',
      'Outbox: one ACID transaction writes state + event; relay publishes asynchronously',
      'Relay: polls Outbox for unpublished rows using FOR UPDATE SKIP LOCKED; or use Debezium CDC',
      'Inbox: consumer inserts event ID into inbox table before processing; unique constraint blocks duplicates',
      'Together: Outbox = at-least-once publish; Inbox = exactly-once consume',
    ],
    interviewFocus: [
      'Explain the dual-write problem and how Outbox solves it',
      'How does Debezium (CDC) improve on polling-based relay?',
      'What does the Inbox Pattern add that idempotency alone does not?',
    ],
  };
}
