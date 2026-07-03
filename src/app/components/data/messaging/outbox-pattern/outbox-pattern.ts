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
  selector: 'app-outbox-pattern',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './outbox-pattern.html',
  styleUrl: './outbox-pattern.scss'
})
export class OutboxPattern {
  readonly quickRef: QuickRefItem[] = [
    { name: 'Outbox table', type: 'keyword', desc: 'DB table storing pending events written atomically with business data' },
    { name: 'Message relay', type: 'keyword', desc: 'Background process that reads outbox and publishes to message broker' },
    { name: 'Polling relay', type: 'keyword', desc: 'Relay queries outbox table periodically for unpublished events' },
    { name: 'CDC relay', type: 'keyword', desc: 'Relay reads DB WAL changes (Debezium) instead of polling' },
    { name: 'Dual write', type: 'keyword', desc: 'Anti-pattern: writing to DB and broker in separate operations (not atomic)' },
    { name: 'Idempotency key', type: 'keyword', desc: 'Unique event ID allowing consumers to deduplicate replayed events' },
    { name: 'published_at', type: 'keyword', desc: 'Outbox column set when event is successfully relayed to broker' },
    { name: 'at-least-once', type: 'keyword', desc: 'Relay may publish duplicates on crash; consumers must be idempotent' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'The Dual-Write Problem',
      points: [
        'Services often need to update a database AND publish a message — two separate operations that are not atomic.',
        'If the DB write succeeds but the broker publish fails (or vice versa), data becomes inconsistent across services.',
        'Retrying the publish can cause duplicates; not retrying loses the event. Neither is acceptable in production.',
        'The Outbox Pattern solves this by making both operations part of a single database transaction.',
      ]
    },
    {
      heading: 'Outbox Pattern: How It Works',
      points: [
        'Within the same local transaction, write the business record AND an event row to an "outbox" table.',
        'A separate message relay process reads unprocessed outbox rows and publishes them to the broker.',
        'Once published, mark the outbox row as done (or delete it).',
        'Even if the relay crashes mid-publish, it can restart and replay from the last unprocessed row.',
      ]
    },
    {
      heading: 'Polling vs CDC Relay',
      points: [
        'Polling relay: runs a SELECT on the outbox table every N seconds. Simple but adds DB load and has latency.',
        'CDC relay (Debezium): reads the database WAL and captures outbox inserts in near-real-time. No polling overhead.',
        'CDC relay is the production standard for low-latency, high-volume event publishing.',
        'Both approaches deliver at-least-once semantics — consumers must handle duplicate events idempotently.',
      ]
    },
    {
      heading: 'The Dual-Write Problem the Outbox Pattern Solves',
      points: [
        'Writing to a database AND publishing a message as two separate operations creates a dual-write problem — if the service crashes between the database commit and the message publish, the database change happens but the message is never sent, leaving the two systems inconsistent.',
        'The outbox pattern writes both the business data change AND the outgoing message (into an "outbox" table) within the SAME database transaction, guaranteeing atomicity — either both happen or neither does, eliminating the window where they could diverge.',
        'A separate relay process (polling the outbox table, or using change data capture) then reads unpublished outbox rows and actually publishes them to the message broker, decoupling the atomic local write from the actual broker publish.',
        'This pattern trades some latency (the message is published slightly after the transaction commits, not atomically with it) for a strong consistency guarantee that avoids the dual-write problem entirely — a worthwhile tradeoff whenever the consistency between the database and the published event genuinely matters.',
      ],
    },
    {
      heading: 'Outbox Relay Implementation Approaches',
      points: [
        'Polling-based relays periodically query the outbox table for unpublished rows and publish them — simple to implement, but introduces latency proportional to the polling interval and adds continuous read load on the database.',
        'CDC-based relays (using a tool like Debezium to tail the database\'s transaction log) publish outbox rows near-instantly as they are written, with lower latency and database load than polling, at the cost of additional CDC infrastructure to operate.',
        'Marking outbox rows as "published" (rather than deleting them immediately) after successful publish allows for auditing and recovery if the relay itself fails partway through a batch, at the cost of requiring a separate cleanup process to eventually purge old published rows.',
        'The relay itself must handle publish failures with retry logic, since a message published from the outbox can still fail to reach the broker — the outbox pattern solves the dual-write problem at the database layer, but publish reliability from outbox to broker still needs its own handling.',
      ],
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'DB Schema',
      language: 'typescript',
      code: `-- Business table
CREATE TABLE orders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  total      NUMERIC(10,2),
  status     TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Outbox table — events written atomically with business data
CREATE TABLE outbox (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id UUID        NOT NULL,    -- e.g., order ID
  event_type   TEXT        NOT NULL,    -- e.g., 'order.placed'
  payload      JSONB       NOT NULL,
  published_at TIMESTAMPTZ,             -- NULL = pending; set when relayed
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_outbox_pending ON outbox (created_at)
  WHERE published_at IS NULL;           -- fast scan for unpublished events`,
    },
    {
      label: 'Transactional Write',
      language: 'typescript',
      code: `import { Pool } from 'pg';

const db = new Pool({ connectionString: process.env.DATABASE_URL });

async function placeOrder(userId: string, total: number) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert business record
    const { rows } = await client.query(
      'INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING id',
      [userId, total]
    );
    const orderId = rows[0].id;

    // 2. Write event to outbox IN THE SAME TRANSACTION
    await client.query(
      \`INSERT INTO outbox (aggregate_id, event_type, payload)
       VALUES ($1, $2, $3)\`,
      [
        orderId,
        'order.placed',
        JSON.stringify({ orderId, userId, total, status: 'pending' }),
      ]
    );

    await client.query('COMMIT');
    return orderId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}`,
    },
    {
      label: 'Polling Relay',
      language: 'typescript',
      code: `import { Pool } from 'pg';
import { Kafka } from 'kafkajs';

const db       = new Pool({ connectionString: process.env.DATABASE_URL });
const kafka    = new Kafka({ brokers: ['localhost:9092'] });
const producer = kafka.producer({ idempotent: true });

async function startRelay(intervalMs = 1000) {
  await producer.connect();
  console.log('Outbox relay started');

  setInterval(async () => {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Lock and read unprocessed rows (SKIP LOCKED for parallel relays)
      const { rows } = await client.query<{
        id: string; event_type: string; payload: unknown;
      }>(
        \`SELECT id, event_type, payload
         FROM outbox
         WHERE published_at IS NULL
         ORDER BY created_at
         LIMIT 100
         FOR UPDATE SKIP LOCKED\`
      );

      if (rows.length === 0) { await client.query('ROLLBACK'); return; }

      // Publish each event
      for (const row of rows) {
        await producer.send({
          topic:    row.event_type.replace('.', '-'), // e.g., 'order-placed'
          messages: [{ key: (row.payload as any).orderId, value: JSON.stringify(row.payload) }],
          acks: -1,
        });
        await client.query(
          'UPDATE outbox SET published_at = now() WHERE id = $1',
          [row.id]
        );
      }

      await client.query('COMMIT');
      console.log(\`Relayed \${rows.length} events\`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Relay error:', err);
    } finally {
      client.release();
    }
  }, intervalMs);
}

startRelay(500);`,
    },
  ];

  readonly mistakes: CommonMistake[] = [
    {
      title: 'Dual write: publishing to broker before DB commit',
      wrong: `async function placeOrder(order: Order) {
  await db.orders.insert(order);          // step 1: DB write
  await kafka.producer.send({ ... });     // step 2: broker publish
  // If step 2 fails — DB written but no event published
}`,
      right: `async function placeOrder(order: Order) {
  await db.transaction(async (tx) => {
    await tx.orders.insert(order);
    await tx.outbox.insert({ eventType: 'order.placed', payload: order });
  });
  // Relay publishes separately — atomically safe
}`,
      explanation: 'Two-operation dual write is not atomic. If the broker publish fails, data is committed but no event is emitted — silent data loss. Always use the outbox table within a single DB transaction.'
    },
    {
      title: 'Not using SKIP LOCKED in the polling relay',
      wrong: `// Two relay instances race to process the same outbox rows
SELECT * FROM outbox WHERE published_at IS NULL LIMIT 100;
// Both read the same rows → duplicate publishes`,
      right: `// SKIP LOCKED prevents two instances from reading the same rows
SELECT * FROM outbox WHERE published_at IS NULL
LIMIT 100 FOR UPDATE SKIP LOCKED;`,
      explanation: 'SKIP LOCKED makes rows already locked by another relay instance invisible to this query, enabling safe parallel relay workers without duplicates.'
    },
    {
      title: 'Not making consumers idempotent for at-least-once delivery',
      wrong: `// Consumer that inserts on every message
consumer.run({ eachMessage: async ({ message }) => {
  const order = JSON.parse(message.value!.toString());
  await db.orders.insert(order); // fails on duplicate relay
}});`,
      right: `consumer.run({ eachMessage: async ({ message }) => {
  const order = JSON.parse(message.value!.toString());
  await db.query(
    \`INSERT INTO processed_orders (order_id, ...) VALUES ($1, ...)
     ON CONFLICT (order_id) DO NOTHING\`,
    [order.orderId]
  );
}});`,
      explanation: 'The relay provides at-least-once semantics — events can be published more than once on crash/retry. Consumers must deduplicate using an idempotency key (e.g., ON CONFLICT DO NOTHING).'
    },
    {
      title: 'Letting the outbox table grow unbounded',
      wrong: `// Relay marks rows as published but never deletes them
UPDATE outbox SET published_at = now() WHERE id = $1;
// Table grows forever → index bloat, slower scans`,
      right: `// Periodically delete old published rows
DELETE FROM outbox
WHERE published_at IS NOT NULL
  AND published_at < now() - INTERVAL '7 days';`,
      explanation: 'Published rows accumulate over time. A background job should prune old published outbox rows to prevent table bloat and index degradation.'
    },
  ];

  readonly challenge: Challenge = {
    title: 'Outbox Relay with Retry Count',
    language: 'typescript',
    description: 'Extend the outbox table with a retry_count column (default 0). Modify the polling relay to increment retry_count on publish failure. After 5 retries, move the row to an "outbox_dlq" table instead of retrying forever. Implement the relay loop in TypeScript with pg.',
    hints: [
      'Add retry_count INT DEFAULT 0 and last_error TEXT to outbox',
      'On catch: UPDATE outbox SET retry_count = retry_count + 1, last_error = $err WHERE id = $id',
      'Before retrying, check retry_count >= 5 → move to outbox_dlq',
    ],
    starterCode: `async function processRow(client: any, row: { id: string; event_type: string; payload: unknown; retry_count: number }) {
  // TODO: publish to Kafka; on error increment retry_count or move to DLQ
}`,
    solution: `async function processRow(
  client: any,
  producer: any,
  row: { id: string; event_type: string; payload: any; retry_count: number }
) {
  try {
    await producer.send({
      topic: row.event_type.replace('.', '-'),
      messages: [{ value: JSON.stringify(row.payload) }],
      acks: -1,
    });
    await client.query(
      'UPDATE outbox SET published_at = now() WHERE id = $1',
      [row.id]
    );
  } catch (err: any) {
    if (row.retry_count >= 4) {
      // Move to DLQ
      await client.query(
        \`INSERT INTO outbox_dlq (id, event_type, payload, last_error, created_at)
         VALUES ($1, $2, $3, $4, now())\`,
        [row.id, row.event_type, JSON.stringify(row.payload), err.message]
      );
      await client.query('DELETE FROM outbox WHERE id = $1', [row.id]);
      console.error(\`Moved \${row.id} to DLQ after 5 attempts\`);
    } else {
      await client.query(
        'UPDATE outbox SET retry_count = retry_count + 1, last_error = $1 WHERE id = $2',
        [err.message, row.id]
      );
      console.warn(\`Retry \${row.retry_count + 1} for \${row.id}:\`, err.message);
    }
  }
}`,
  };

  readonly quiz: QuizQuestion[] = [
    { q: 'What problem does the Outbox Pattern solve?', options: ['Message ordering across partitions', 'Atomicity between DB write and message publish', 'Consumer offset management', 'Schema evolution'], answer: 1, explanation: 'The Outbox Pattern makes the DB write and the event publish atomic by using a single DB transaction that includes an outbox row.' },
    { q: 'What delivery guarantee does the outbox relay provide?', options: ['Exactly-once', 'At-most-once', 'At-least-once', 'Best-effort'], answer: 2, explanation: 'If the relay crashes after publishing but before marking the row done, it will republish on restart — at-least-once delivery.' },
    { q: 'What does FOR UPDATE SKIP LOCKED do in the relay query?', options: ['Prevents other transactions from reading unlocked rows', 'Makes locked rows invisible so parallel relays don\'t double-process', 'Locks the entire table', 'Skips rows with NULL published_at'], answer: 1, explanation: 'SKIP LOCKED causes locked rows (being processed by another relay) to be excluded from the result set, enabling safe parallel relays.' },
    { q: 'Why is a CDC relay preferred over a polling relay in production?', options: ['Polling is less reliable', 'CDC reads WAL changes in near-real-time without polling overhead', 'CDC supports message ordering', 'Polling requires schema changes'], answer: 1, explanation: 'CDC (Debezium) reads the WAL directly, providing low-latency event capture without periodic query load on the database.' },
    { q: 'Why does the Outbox pattern still guarantee at-least-once (not exactly-once) delivery to the broker, even though the database write is atomic?', options: ['It does guarantee exactly-once — the pattern eliminates all duplicates', 'The relay process reading the outbox table and publishing to the broker can crash AFTER publishing but BEFORE marking the outbox row as processed, causing that row to be re-published on relay restart', 'The database write itself can silently duplicate rows', 'Exactly-once is impossible with any pattern, so the question is moot'], answer: 1, explanation: 'The outbox table\'s atomic write with the business transaction solves the DUAL-WRITE problem (DB commit vs broker publish disagreeing), but the relay step — reading unprocessed outbox rows and publishing them — is itself a separate operation that can partially fail: if the relay publishes successfully but crashes before updating the outbox row\'s status, the next relay run will see that row as still "unprocessed" and publish it again, causing a duplicate on the broker side. This is why outbox-pattern consumers still need to be idempotent, same as any at-least-once messaging system.' },
    { q: 'What is the relay component in the Outbox pattern?', options: ['The API endpoint that receives requests', 'A process that reads the outbox table and publishes pending messages to the broker', 'The message broker itself', 'A scheduled database cleanup job'], answer: 1, explanation: 'The relay (poller or CDC-based) reads unpublished rows from the outbox table and publishes them to the message broker. After successful publish, it marks rows as sent or deletes them. CDC-based relay (Debezium) reacts to log changes instead of polling.' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'Can I use the Outbox Pattern with any database?', a: 'Yes — any database that supports transactions and can write to an outbox table works. The CDC relay approach (Debezium) requires WAL access (PostgreSQL logical replication, MySQL binlog, etc.). Polling works with any transactional database.' },
    { q: 'How do I handle very high-volume event publishing with the outbox?', a: 'Use a CDC relay (Debezium) instead of polling to minimise database overhead. Run multiple relay workers with SKIP LOCKED for parallel processing. Partition the outbox table by aggregate type or time range for very high volumes. Archive or delete processed rows regularly.' },
    { q: 'What is the Inbox pattern?', a: 'The Inbox pattern is the consumer-side counterpart to the Outbox. Instead of processing an event directly, the consumer writes it to a local "inbox" table (transactionally with its side effects), ensuring exactly-once processing even under at-least-once delivery.' },
    { q: 'How does Debezium implement the Outbox pattern?', a: 'Debezium is a CDC (Change Data Capture) connector that reads the database transaction log (WAL for PostgreSQL, binlog for MySQL). It monitors the outbox table and publishes each INSERT as a Kafka event in near real-time — no polling lag, no added DB load. The Debezium Outbox Event Router SMT transforms outbox rows into domain-specific Kafka topics automatically.' },
    { q: 'What is the difference between polling-based and CDC-based outbox relay?', a: '<strong>Polling relay</strong>: queries <code>SELECT * FROM outbox WHERE sent = false ORDER BY created_at LIMIT 100</code> on a schedule. Simple, portable, but adds DB load and has polling delay. <strong>CDC relay</strong> (Debezium): reads transaction log — near-real-time, no polling overhead, but requires CDC infrastructure. CDC is preferred for high-volume or low-latency requirements.' },
    { q: 'How does the Inbox pattern complement the Outbox pattern?', a: 'The <strong>Inbox pattern</strong> handles idempotent message consumption: before processing, record the messageId in an inbox table within the same transaction as the business operation. If a duplicate arrives, the INSERT fails (unique constraint) and the message is discarded. Inbox + Outbox together provide reliable exactly-once semantics end-to-end without distributed transactions.' },
  ];

  readonly revision: RevisionSummary = {
    oneLiner: 'Outbox pattern: write event to outbox table atomically with business data; relay publishes to broker separately.',
    mustKnow: [
      'Dual write is an anti-pattern — DB write + broker publish are not atomic',
      'Outbox table written in same DB transaction as business record (atomic)',
      'Relay reads pending outbox rows and publishes to broker; marks published_at on success',
      'Polling relay: simple but adds DB load; CDC relay (Debezium): near-real-time, low overhead',
      'Relay provides at-least-once delivery — consumers must be idempotent',
      'SKIP LOCKED enables parallel relay workers without duplicate processing',
    ],
    interviewFocus: [
      'Why dual write fails and how outbox fixes it atomically',
      'Polling vs CDC relay: trade-offs in latency and DB load',
      'At-least-once semantics: how consumers handle relay duplicates',
      'Outbox + inbox: full exactly-once pipeline across services',
    ],
  };
}
