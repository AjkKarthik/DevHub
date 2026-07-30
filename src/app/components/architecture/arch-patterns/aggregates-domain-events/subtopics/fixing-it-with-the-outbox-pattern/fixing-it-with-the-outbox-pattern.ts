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
  templateUrl: './fixing-it-with-the-outbox-pattern.html',
  styleUrl: './fixing-it-with-the-outbox-pattern.scss'
})
export class FixingItWithTheOutboxPatternSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Turning two operations into one atomic one',
      points: [
        'The previous subtopic traced exactly where <code>PlaceOrderHandler</code> loses its event: the order save and the event publish are two independent operations, against two independent systems, with a real gap between them.',
        'This hub\'s own Inbox & Outbox Pattern topic already covers the fix in general: write the event INTO the same database, in the SAME transaction as the state change, instead of publishing it directly. A separate relay process then reads unpublished outbox rows and delivers them to the broker.',
        'Applied here specifically: instead of <code>orders.save(order)</code> followed by a separate <code>events.publishAll(...)</code>, a single database transaction inserts BOTH the order row and an outbox row containing the serialized <code>OrderPlacedEvent</code>. Either both happen, or neither does — there is no window where one succeeded and the other did not.',
      ]
    },
    {
      heading: 'What changes, and what does not',
      points: [
        'The relay process (already described in the Inbox & Outbox topic) takes over the actual broker publish, on its own schedule, with its own retry logic — the request-handling code path (<code>PlaceOrderHandler.handle()</code>) no longer talks to the broker at all, and no longer has any failure mode related to the broker being briefly unreachable.',
        'The event is no longer "lost" if a publish attempt fails — it just stays in the outbox table, unpublished, until the relay successfully delivers it. A crash of the application process at ANY point after the transaction commits cannot lose the event, because its existence is now a committed database row, not something held only in memory.',
        'The tradeoff: events are no longer published synchronously as part of the request — there is a small, bounded delay between the order committing and the relay actually delivering the event (typically milliseconds to low seconds, depending on the relay\'s polling interval). For domain events feeding eventually-consistent downstream processes, this is exactly the tradeoff the "Domain Events for Cross-Aggregate Consistency" section of the main page already expects.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'PlaceOrderHandler rewritten around a transactional outbox',
      language: 'typescript',
      code: `class PlaceOrderHandler {
  constructor(
    private db: Database,
    private catalogService: ICatalogService,
  ) {}

  async handle(cmd: PlaceOrderCommand): Promise<string> {
    const order = new Order(generateId(), cmd.customerId);
    for (const line of cmd.lines) {
      const price = await this.catalogService.getPrice(line.productId);
      order.addLine(line.productId, line.qty, price);
    }
    order.place(); // raises OrderPlacedEvent internally, still only in memory

    // SINGLE transaction: order row + outbox row(s), or neither.
    await this.db.transaction(async (tx) => {
      await tx.query(
        'INSERT INTO orders (id, customer_id, status, total) VALUES ($1, $2, $3, $4)',
        [order.id, order.customerId, 'placed', order.total.amount],
      );

      for (const event of order.domainEvents) {
        await tx.query(
          'INSERT INTO outbox (topic, payload) VALUES ($1, $2)',
          ['order.placed', JSON.stringify(event)],
        );
      }
    });

    // No direct broker call here at all -- nothing left in this method
    // that can fail because the message broker is briefly unreachable.
    order.clearDomainEvents();
    return order.id;
  }
}

// The relay process that actually delivers events to the broker is the
// SAME one already shown in this hub's Inbox & Outbox Pattern topic --
// it polls the outbox table, publishes unpublished rows, and marks them
// published on success. Nothing about it needs to change per-handler;
// every handler that inserts into the SAME outbox table is covered by
// the SAME relay.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate asks: "If we use the outbox pattern here, do we still need the ordering rule from the original codeTab — publish AFTER the transaction commits, never before?"',
    hint: 'With the outbox approach, is there a separate "publish" step in the request-handling code path at all anymore?',
    solution: 'The ordering RULE still holds in spirit, but there is no longer a separate step it needs to be applied to inside the request-handling code -- the outbox row is inserted as PART of the same transaction as the order itself, so there is no "before commit" moment to accidentally publish from. The rule effectively gets enforced structurally: the relay process only ever reads rows from a table that only ever contains COMMITTED data (since the whole point of a transaction is that partial writes are never visible to other readers), so by construction the relay can never publish an event whose underlying order was rolled back. The original ordering rule (publish after commit) and the outbox pattern are solving the same underlying concern -- the outbox pattern just closes the durability gap the original approach left open while doing it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The outbox pattern adds an extra step to the happy path, making a successful order placement slower for the caller.',
      reality: 'Per this subtopic\'s theory, the caller only waits for the single transaction (order row + outbox row) to commit, which replaces the original two sequential operations — it does not add a wait for the actual broker delivery, which now happens asynchronously via the relay.'
    },
    {
      thought: 'Once you switch to the outbox pattern, you still need to handle broker-unavailability errors inside PlaceOrderHandler, just with better retry logic.',
      reality: 'Per this subtopic\'s theory, PlaceOrderHandler no longer talks to the broker at all — that responsibility (and its own retry logic) moves entirely to the relay process, which is a separate, dedicated concern from placing the order.'
    },
    {
      thought: 'The outbox pattern requires a fundamentally different domain model than the one shown earlier on this page — the Order aggregate itself has to change.',
      reality: 'Per this subtopic\'s theory, the Order aggregate and its <code>place()</code> method raising <code>OrderPlacedEvent</code> are unchanged — only the APPLICATION SERVICE\'s persistence step changes, from two separate operations to one transaction covering both the order and its outbox row.'
    }
  ];
}
