import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './how-the-outbox-pattern-actually-works.html',
  styleUrl: './how-the-outbox-pattern-actually-works.scss'
})
export class HowTheOutboxPatternActuallyWorksSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The page names the fix but not the mechanism',
      points: [
        'The "Not handling message broker unavailability" mistake block says: "Use Outbox Pattern: write event to DB in same transaction; relay process publishes to broker" — accurate, but compressed into one line with no explanation of how "write to DB" and "eventually reaches the broker" actually connect.',
        'The core problem the pattern solves: a service can\'t atomically do two DIFFERENT things — commit a database write AND publish to a message broker — as one all-or-nothing operation, because they\'re two separate systems with no shared transaction. If the DB commit succeeds but the broker publish fails (network blip, broker down), the event is silently lost even though the underlying data change is safely saved.',
        'The Outbox Pattern\'s fix: instead of publishing to the broker directly, the service writes the event into an "outbox" TABLE in the SAME database, as part of the SAME transaction as the actual business data change. Since it\'s one transaction against one database, this part IS atomic — either both the business row and the outbox row are saved, or neither is.',
      ]
    },
    {
      heading: 'How the event actually gets from the outbox table to the broker',
      points: [
        'A separate RELAY process — a poller reading the outbox table, or (in more advanced setups) a Change Data Capture tool like Debezium reading the database\'s own transaction log — continuously checks for new, unpublished outbox rows and publishes each one to the real message broker.',
        'After a successful publish, the relay marks the outbox row as sent (or deletes it). If the relay itself crashes mid-publish, it simply retries the same row on restart — since the row is still marked unpublished, nothing is lost, though the SAME event might get published twice.',
        'That "might get published twice" is not a flaw to fix — it\'s exactly why this page\'s OTHER mistake block ("Fire-and-forget without idempotency on the consumer") exists. The Outbox Pattern guarantees AT-LEAST-ONCE delivery, never exactly-once — the two mistakes blocks on this page are solving complementary halves of the same reliability problem, not two unrelated issues.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Outbox write (atomic) and relay (separate process)',
      language: 'typescript',
      code: `// STEP 1 -- inside the service, ONE transaction covers both writes
async function placeOrder(cmd: PlaceOrderCommand): Promise<string> {
  return db.transaction(async (tx) => {
    const order = Order.create(cmd);
    await tx.orders.insert(order);                 // the real business data

    await tx.outbox.insert({                        // the event, SAME transaction
      id: crypto.randomUUID(),
      topic: 'orders.placed',
      payload: JSON.stringify({ orderId: order.id, customerId: order.customerId }),
      publishedAt: null,                             // not yet sent to the broker
    });

    return order.id;
  });
  // Either BOTH rows commit, or NEITHER does -- no window where the order
  // exists but the event was silently dropped.
}

// STEP 2 -- a SEPARATE relay process, polling continuously
async function relayLoop() {
  while (true) {
    const pending = await db.outbox.findMany({ where: { publishedAt: null }, limit: 50 });

    for (const row of pending) {
      await messageBus.publish(row.topic, JSON.parse(row.payload));
      await db.outbox.update(row.id, { publishedAt: new Date() });
      // if the process crashes right here, this row gets published AGAIN
      // on the next loop -- at-least-once, not exactly-once
    }

    await sleep(500);
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate proposes simplifying the Outbox Pattern by skipping the relay process entirely: write the business data to the DB, then immediately try to publish to the broker in the SAME request. If the publish fails, retry it three times before giving up. Does this achieve the same guarantee as the real Outbox Pattern?',
    hint: 'What happens if the SERVICE PROCESS ITSELF crashes between the DB commit and the third retry attempt — not the broker, the calling service?',
    solution: 'No. The proposal still has the exact gap the Outbox Pattern exists to close: the DB write and the broker publish remain two separate operations with no shared transaction between them. If the service process crashes (not just a failed publish, but the whole process dying) after the DB commit but before any retry succeeds, the event is lost -- with no outbox row recording that it was ever supposed to be sent. The real Outbox Pattern avoids this because the event\'s EXISTENCE is captured durably, in the same transaction as the business data, before any network call to a broker is even attempted -- the relay process publishing it later is a completely separate concern from whether the event is safely recorded at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The Outbox Pattern guarantees an event is published exactly once.',
      reality: 'Per this subtopic\'s theory, it guarantees AT-LEAST-ONCE delivery — a relay crash after publishing but before marking the row sent causes a duplicate publish, which is why this page\'s own "consumer idempotency" mistake block is a required companion, not an optional extra.'
    },
    {
      thought: 'Retrying a failed broker publish a few times inside the original request achieves the same safety as the Outbox Pattern.',
      reality: 'Per this subtopic\'s theory, retries inside the original request don\'t protect against the calling PROCESS itself crashing before the retries finish — the Outbox Pattern\'s actual guarantee comes from durably recording the event in the SAME database transaction as the business data, before any network call happens at all.'
    },
    {
      thought: 'The relay process that reads the outbox table and the message broker itself are basically the same component with two names.',
      reality: 'Per this subtopic\'s theory, they\'re two genuinely separate pieces of infrastructure — the outbox table lives in the SERVICE\'s own database and is what makes the write atomic; the relay is a separate process (a poller or a CDC tool like Debezium) whose only job is moving already-safely-recorded rows to the real broker.'
    }
  ];
}
