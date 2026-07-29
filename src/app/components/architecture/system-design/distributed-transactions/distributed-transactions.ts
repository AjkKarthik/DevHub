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

const quickRef: QuickRefItem[] = [
  { name: '2PC',             type: 'keyword', desc: 'Two-Phase Commit: Prepare phase → all nodes vote; Commit phase → coordinator commits or aborts.' },
  { name: 'Saga',            type: 'keyword', desc: 'Long-lived transaction split into local steps, each with a compensating transaction on failure.' },
  { name: 'Outbox pattern',  type: 'keyword', desc: 'Write event to outbox table in same DB transaction; relay polls and publishes atomically.' },
  { name: 'TCC',             type: 'keyword', desc: 'Try-Confirm-Cancel: reserve resources (Try), confirm on success, cancel on failure.' },
  { name: 'Idempotency key', type: 'keyword', desc: 'Unique key per operation; ensures retrying a request produces the same result once.' },
  { name: 'Compensating tx', type: 'keyword', desc: 'Undo a committed step in a Saga — e.g. refund payment if inventory reservation fails.' },
  { name: 'CDC',             type: 'keyword', desc: 'Change Data Capture: reads WAL to produce reliable event stream from DB changes.' },
  { name: 'Exactly-once',    type: 'keyword', desc: 'Guarantee that a message is processed exactly once — requires idempotency on consumer side.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Two-Phase Commit (2PC)',
    points: [
      'Phase 1 (Prepare): coordinator asks all participants "can you commit?" Each votes YES or NO.',
      'Phase 2 (Commit): if all YES → coordinator sends Commit; any NO → sends Abort.',
      'Pros: strong ACID across multiple databases; widely supported (XA protocol).',
      'Cons: blocking — if coordinator crashes between phases, participants are stuck. Not suitable for microservices across the internet.',
    ],
  },
  {
    heading: 'Saga pattern',
    points: [
      'Break a distributed transaction into a sequence of local transactions, each publishing an event.',
      'On failure: execute compensating transactions in reverse order to undo completed steps.',
      'Choreography Saga: each service listens for events and publishes next event (no central coordinator).',
      'Orchestration Saga: a Saga Orchestrator sends commands to each service and handles failures centrally.',
      'Trade-off: eventual consistency between steps; compensations can be complex.',
    ],
  },
  {
    heading: 'Outbox pattern',
    points: [
      'Problem: writing to DB and publishing to message queue are two separate operations — one can fail.',
      'Solution: write event to an outbox table in the same DB transaction as the business data.',
      'A relay (Debezium/CDC or a polling job) reads the outbox table and publishes to Kafka/SQS.',
      'Guarantees at-least-once delivery with no dual-write. Consumer must be idempotent.',
    ],
  },
  {
    heading: 'Idempotency and exactly-once semantics',
    points: [
      'Networks are unreliable — retries are mandatory. Without idempotency, retries cause duplicate effects.',
      'Idempotency key: client sends a unique ID; server stores the result keyed by ID; duplicates return cached result.',
      'Exactly-once processing: idempotent consumer + at-least-once delivery = effectively-exactly-once.',
      'Kafka transactions: for a plain producer, atomically writes records across multiple partitions/topics as one all-or-nothing unit. For the consume-transform-produce pattern specifically, sendOffsetsToTransaction() additionally commits the CONSUMER\'S input offset in the same atomic unit as the produced output — that offset-commit behavior is specific to stream processing, not a feature of every Kafka transaction.',
    ],
  },
  {
    heading: 'Two-Phase Commit vs Saga Pattern',
    points: [
      'Two-Phase Commit (2PC) coordinates a transaction across multiple databases with strong consistency guarantees — a coordinator asks all participants to "prepare" (lock resources, verify the operation can succeed), then commits only if every participant confirms readiness; if any participant fails, all roll back.',
      '2PC provides strong ACID guarantees but at a real cost: it is blocking (participants hold locks until the coordinator decides), and a coordinator failure mid-protocol can leave participants indefinitely stuck holding locks — making it a poor fit for high-throughput, loosely-coupled microservices.',
      'The Saga pattern instead breaks a distributed transaction into a sequence of local transactions, each with a corresponding compensating action to undo it if a later step fails — trading strong consistency for eventual consistency and availability, better suited to microservices that should not share locks across service boundaries.',
      'Choreography-based sagas (each service listens for events and reacts independently) avoid a central coordinator but make the overall transaction flow harder to trace; orchestration-based sagas (a central saga coordinator explicitly calls each step) are easier to reason about but reintroduce a degree of central coordination.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Saga Orchestration',
    language: 'typescript',
    code: `// Order Saga — orchestration pattern
// Saga orchestrator coordinates: Order → Payment → Inventory → Fulfillment

type SagaStep = {
  name: string;
  execute: () => Promise<void>;
  compensate: () => Promise<void>;
};

class OrderSaga {
  private completed: SagaStep[] = [];

  async run(steps: SagaStep[]): Promise<void> {
    for (const step of steps) {
      try {
        await step.execute();
        this.completed.push(step);
      } catch (err) {
        console.error(\`Step \${step.name} failed — rolling back\`);
        await this.rollback();
        throw err;
      }
    }
  }

  private async rollback(): Promise<void> {
    for (const step of [...this.completed].reverse()) {
      try {
        await step.compensate();
      } catch (err) {
        // Log and alert — compensation failure needs manual intervention
        console.error(\`Compensation failed for \${step.name}\`, err);
      }
    }
  }
}

// Usage:
const saga = new OrderSaga();
await saga.run([
  {
    name: 'CreateOrder',
    execute: () => orderService.create(order),
    compensate: () => orderService.cancel(order.id),
  },
  {
    name: 'ChargePayment',
    execute: () => paymentService.charge(order.total),
    compensate: () => paymentService.refund(order.total),  // compensating tx
  },
  {
    name: 'ReserveInventory',
    execute: () => inventoryService.reserve(order.items),
    compensate: () => inventoryService.release(order.items),
  },
]);`,
  },
  {
    label: 'Outbox Pattern',
    language: 'typescript',
    code: `// Outbox pattern: atomic write to DB + event publishing

// Step 1: write business data AND outbox event in same transaction
async function placeOrder(order: Order, db: Transaction): Promise<void> {
  await db.run('BEGIN');
  try {
    // Business write
    await db.run('INSERT INTO orders (id, user_id, total) VALUES (?, ?, ?)',
      [order.id, order.userId, order.total]);

    // Outbox event — same transaction, same DB
    await db.run(
      'INSERT INTO outbox (id, aggregate_id, event_type, payload, published) VALUES (?, ?, ?, ?, false)',
      [uuid(), order.id, 'OrderCreated', JSON.stringify(order)]
    );
    await db.run('COMMIT');
  } catch (e) {
    await db.run('ROLLBACK');
    throw e;
  }
}

// Step 2: relay polls unpublished outbox events and publishes to Kafka
// (runs as a background job every 100ms OR via Debezium CDC reading WAL)
async function relayOutboxEvents(db: DB, kafka: KafkaProducer): Promise<void> {
  const events = await db.query(
    'SELECT * FROM outbox WHERE published = false ORDER BY created_at LIMIT 100'
  );
  for (const event of events) {
    await kafka.produce('domain-events', { key: event.aggregate_id, value: event.payload });
    await db.run('UPDATE outbox SET published = true WHERE id = ?', [event.id]);
  }
}`,
  },
  {
    label: 'Idempotency Key',
    language: 'typescript',
    code: `// Idempotency key pattern for payment endpoint

// Client generates ONE key per logical operation and REUSES it
// for every retry of that same operation -- generate it once and
// store it client-side before the first attempt. Do NOT derive it
// from the current time (e.g. Date.now()): a retry re-running this
// line would produce a DIFFERENT key on every attempt, defeating
// idempotency entirely -- the server would treat each retry as a
// brand-new request and could double-charge the customer.
const idempotencyKey = crypto.randomUUID(); // generated once, stored client-side

// Server: check if already processed
async function processPayment(req: PaymentRequest): Promise<PaymentResult> {
  const { idempotencyKey, amount, userId } = req;

  // Check idempotency store (Redis or DB table)
  const existing = await redis.get(\`idem:\${idempotencyKey}\`);
  if (existing) {
    return JSON.parse(existing);  // Return cached result — do NOT charge again
  }

  // Process payment
  const result = await chargeCard(userId, amount);

  // Store result with TTL (24h is common for payments)
  await redis.setEx(\`idem:\${idempotencyKey}\`, 86400, JSON.stringify(result));

  return result;
}

// Client retries on network error — SAME key on the retry as
// the original attempt, since it was generated once and reused
// POST /payments  { idempotencyKey: "8f14e45f-ceea-467e-..." }
//  → network timeout
// POST /payments  { idempotencyKey: "8f14e45f-ceea-467e-..." }  (retry)
//  → server returns cached result — no double charge`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using 2PC across microservices over the internet',
    wrong: `// 2PC across Payment Service, Inventory Service, Order Service
// Coordinator crashes after Phase 1 → all 3 services blocked indefinitely`,
    right: `// Use Saga pattern instead of 2PC for microservices:
// Each service does a local transaction + publishes event
// On failure: compensating transactions undo completed steps
// No blocking — each step completes independently`,
    explanation: '2PC requires participants to hold locks while waiting for the coordinator. If the coordinator crashes mid-protocol, all participants block until recovery. Saga avoids this with local transactions and compensations.',
  },
  {
    title: 'Dual write without outbox',
    wrong: `// Write to DB, then publish event
await db.insert('orders', order);
await kafka.produce('order-created', order);  // Can fail independently
// If Kafka fails: DB has order, no event → inventory never updated`,
    right: `// Use outbox: write event to DB in same transaction as business data
await db.transaction(async tx => {
  await tx.insert('orders', order);
  await tx.insert('outbox', { event: 'OrderCreated', payload: order });
});
// Relay reads outbox and publishes — atomic, no dual-write`,
    explanation: 'Dual write (DB write + event publish separately) creates a window where one can fail while the other succeeds. This leads to phantom orders or missing events. The outbox pattern eliminates this.',
  },
  {
    title: 'Forgetting compensating transactions',
    wrong: `// Saga steps:
// 1. Create order ✓
// 2. Charge payment ✓
// 3. Reserve inventory ✗ (out of stock)
// → payment charged but no compensating refund defined`,
    right: `// Every Saga step MUST define a compensating transaction:
// step 3 fails → run compensation for step 2:
//   paymentService.refund(order.total)
// then compensation for step 1:
//   orderService.cancel(order.id)`,
    explanation: 'Sagas without compensating transactions leave the system in an inconsistent state on failure. Every step that has a side effect (charge, reserve, notify) must have a corresponding undo operation.',
  },
  {
    title: 'Non-idempotent message consumers',
    wrong: `// Consumer receives "OrderCreated" event → reserves inventory
// Kafka redelivers after consumer crash → inventory reserved twice`,
    right: `// Check idempotency before processing:
const alreadyProcessed = await db.query(
  'SELECT 1 FROM processed_events WHERE event_id = ?', [eventId]);
if (alreadyProcessed) return;
// Process + mark as processed in same transaction`,
    explanation: 'Message queues guarantee at-least-once delivery — consumers will see duplicates on restart. Without idempotency checks, retries cause double-charges, double-reservations, or duplicate emails.',
  },
];

const challenge: Challenge = {
  title: 'Design a reliable order checkout flow',
  language: 'typescript',
  description: `An e-commerce checkout must:
1. Deduct stock from inventory service
2. Charge the customer via payment service
3. Create the order record in order service
4. Send confirmation email

All must succeed together, or all must be rolled back.
Services are separate microservices with separate databases.

Design:
- Which pattern (2PC, Saga, TCC)?
- Choreography or orchestration?
- How to handle payment charged but inventory fails?
- How to prevent double charges on retry?`,
  hints: [
    'Saga orchestration gives a single place to handle all failure cases',
    'Charge payment LAST — it is hardest to undo',
    'Idempotency key on payment prevents double charge on retry',
    'Email is fire-and-forget — no compensation needed',
  ],
  starterCode: `// Current broken implementation (dual writes, no compensation):
async function checkout(cart: Cart): Promise<Order> {
  await inventoryService.reserve(cart.items);  // Step 1
  const charge = await paymentService.charge(cart.total);  // Step 2
  const order = await orderService.create(cart, charge);  // Step 3
  await emailService.sendConfirmation(order);  // Step 4
  return order;
  // Problem: if step 3 fails, money was taken but no order exists!
}`,
  solution: `class CheckoutSaga {
  async run(cart: Cart, idempotencyKey: string): Promise<Order> {
    let reservationId: string | null = null;
    let chargeId: string | null = null;

    try {
      // Step 1: Reserve inventory (compensate: release)
      reservationId = await inventoryService.reserve(cart.items);

      // Step 2: Charge payment (compensate: refund)
      // Idempotency key prevents double charge on retry
      chargeId = await paymentService.charge(cart.total, { idempotencyKey });

      // Step 3: Create order (compensate: cancel)
      const order = await orderService.create({ cart, chargeId, reservationId });

      // Step 4: Send email (fire-and-forget — no compensation)
      emailService.sendConfirmation(order).catch(err =>
        console.error('Email failed — will retry via outbox', err)
      );

      return order;
    } catch (err) {
      // Compensate in reverse order:
      if (chargeId) await paymentService.refund(chargeId);
      if (reservationId) await inventoryService.release(reservationId);
      throw err;
    }
  }
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the main drawback of Two-Phase Commit (2PC) in microservices?',
    options: [
      'It only supports two services',
      'It requires synchronous HTTP',
      'Coordinator crash leaves participants blocked holding locks',
      'It does not support rollback',
    ],
    answer: 2,
    explanation: '2PC participants hold locks and wait for the coordinator after Phase 1. If the coordinator crashes, participants are stuck until recovery — a blocking protocol. This makes 2PC unsuitable for distributed microservices that must remain available.',
  },
  {
    q: 'The outbox pattern solves which problem?',
    options: [
      'Slow database writes',
      'Dual-write inconsistency between DB and message queue',
      'High message queue latency',
      'Database schema migration',
    ],
    answer: 1,
    explanation: 'Without the outbox, writing to a DB and publishing an event are two separate operations — one can fail while the other succeeds. The outbox writes the event to the DB in the same transaction, ensuring atomic delivery to the message queue.',
  },
  {
    q: 'In a Saga, what is the purpose of a compensating transaction?',
    options: [
      'To speed up the forward transaction',
      'To undo the effect of a completed Saga step on failure',
      'To lock resources during the Saga',
      'To validate input before each step',
    ],
    answer: 1,
    explanation: 'Since each Saga step commits independently, failure in a later step cannot roll back earlier steps. Compensating transactions are business-level undos — e.g. refund a charge, release a reservation — executed in reverse order on failure.',
  },
  { q: 'What is the two-phase commit protocol (2PC) and what is its main weakness?', options: ['A protocol that commits database transactions in two separate SQL statements', 'A distributed consensus protocol where a coordinator asks participants to prepare then commits only if all agree, but a coordinator crash can leave the system in an uncertain state', 'A replication protocol that writes to two database replicas simultaneously', 'A protocol requiring two different administrators to approve each transaction'], answer: 1, explanation: 'In 2PC, a coordinator first sends Prepare to all participants and waits for votes. If all vote Yes, it sends Commit; if any votes No or times out, it sends Rollback. Main weakness: if the coordinator crashes after sending Commit to some but not all participants, those that received Commit have committed while others are blocked waiting. They cannot proceed or rollback until the coordinator recovers, creating a blocking protocol. The coordinator is a single point of failure that can block the entire distributed transaction indefinitely.' },
  { q: 'What is the Saga pattern and how does it handle failures?', options: ['Saga is a synchronous distributed transaction using distributed locks', 'Saga breaks a distributed transaction into a sequence of local transactions each with a compensating transaction that undoes it on failure', 'Saga queues all operations and applies them in a single atomic batch', 'Saga uses the two-phase commit protocol with an optimized coordinator'], answer: 1, explanation: 'Saga replaces a distributed transaction with a sequence of local transactions, each of which publishes events or messages to trigger the next step. If a step fails, compensating transactions are executed in reverse order to undo previously completed steps. Example: booking a flight and hotel: Book flight (step 1), Book hotel (step 2). If hotel booking fails, a compensation cancels the flight. Sagas are not isolated (intermediate states are visible), but they avoid distributed locks and work well with eventual consistency in microservices.' },
  { q: 'What is the difference between choreography and orchestration in the Saga pattern?', options: ['Choreography uses a central coordinator; orchestration is event-driven without a coordinator', 'Choreography uses events where services react to each other without a central coordinator; orchestration uses a central saga orchestrator that calls each service in sequence', 'Choreography is for synchronous sagas; orchestration is for asynchronous sagas', 'The terms choreography and orchestration are interchangeable in the context of sagas'], answer: 1, explanation: 'Saga choreography: each service publishes domain events after completing its local transaction. Other services subscribe to these events and perform their steps. No central coordinator. Simpler for small numbers of steps but harder to track the overall workflow state. Saga orchestration: a central saga orchestrator service sends commands to each participant and listens for their responses. The orchestrator holds the workflow state and drives the sequence. Easier to monitor and debug but adds a central coordinator component. Orchestration is typically preferred for complex workflows with many steps or complex compensation logic.' },
];

const qna: QnaItem[] = [
  {
    q: 'A team starts a Saga with choreography for a simple 2-service flow, and it works well. Over 18 months, they keep adding services that react to the same events, growing to 8 participating services. What specific failure mode emerges as choreography scales up that orchestration would not have?',
    a: 'The workflow\'s overall logic becomes fully implicit and scattered — with 8 services each independently subscribing to and reacting to events, there is no single place in the codebase that shows "this is the full sequence of steps for this business process," so understanding, modifying, or debugging the end-to-end flow requires mentally reconstructing it by reading through 8 separate services\' event handlers. A common concrete failure this produces: a NEW event type gets added by one service, and it is easy to overlook that a downstream service now needs to also react to it (since there\'s no central definition enforcing completeness), leading to a step silently being skipped in some percentage of workflow executions — a bug class orchestration structurally prevents, since the orchestrator explicitly enumerates and drives every step, making an omitted step a visible gap in the orchestrator\'s own code rather than an invisible gap distributed across independently-evolving services.',
  },
  {
    q: 'What is TCC (Try-Confirm-Cancel)?',
    a: 'TCC is a three-phase variant used when you need to lock resources across services before committing. Try: reserve the resource (e.g. block $50 from account). Confirm: finalise the reservation. Cancel: release the reservation. TCC is stricter than Saga — all participants must be reachable in Try phase. Used in financial systems that need reservation semantics.',
  },
  { q: 'What is eventual consistency and how does it differ from strong consistency in distributed transactions?', a: 'Strong consistency means all nodes see the same data at all times: a read immediately after a write always returns the new value regardless of which node is queried. Requires coordination between nodes (locks or consensus) before completing writes, adding latency and reducing availability. Eventual consistency means updates will propagate to all nodes eventually, but reads immediately after a write may return stale data from a replica that has not yet received the update. No coordination is required before completing writes, enabling much lower write latency and higher availability. The choice depends on the use case: financial balances require strong consistency; social media likes can tolerate eventual consistency.' },
  { q: 'How do you implement idempotency in distributed systems to handle retries safely?', a: 'Idempotency ensures that performing the same operation multiple times produces the same result as performing it once. Implementation: assign each request a unique idempotency key generated by the client. The server stores the idempotency key and result in a database before returning. On retry, the server checks for an existing result with that key and returns it without re-executing the operation. This pattern is critical for payment processing, email sending, and any operation with side effects. Redis with TTL or a relational database transaction table are common storage options. The idempotency key check and result storage must happen atomically to prevent race conditions between concurrent retries.' },
  { q: 'What is the outbox pattern and how does it solve the dual-write problem?', a: 'The dual-write problem: a service that needs to update a database and publish an event cannot do both atomically, so a crash between the two leaves them inconsistent. The outbox pattern solves this by writing the event to an outbox table in the same database transaction as the business data update. A separate message relay process reads the outbox and publishes events to the message broker, then marks them as published. If the relay crashes, it replays unpublished events from the outbox on restart. This guarantees at-least-once delivery. Tools like Debezium use change data capture on the outbox table as an alternative to polling, providing efficient event publishing without constant database polling.' },
  { q: 'How does TCC (Try-Confirm-Cancel) differ from the Saga pattern?', a: 'TCC is a distributed transaction pattern that follows three phases for each participant service. Try: reserves or holds resources without committing them, similar to the Prepare phase in 2PC. Confirm: finalizes and commits the reserved resources. Cancel: releases the reservation if any participant fails. Unlike Saga, TCC does provide isolation because resources are held in the Try phase, preventing other transactions from using them until Confirm or Cancel completes. Unlike 2PC, TCC does not block if a coordinator fails because each participant can handle Cancel autonomously after a timeout. TCC is more complex to implement because each service must expose three endpoints and manage reservation state, but it provides stronger isolation guarantees than Saga.' },
];

const revision: RevisionSummary = {
  oneLiner: '2PC blocks on coordinator crash; Saga uses compensating transactions; outbox atomically publishes events; idempotency key prevents duplicate effects.',
  mustKnow: [
    '2PC: atomic across nodes but blocking — avoid in microservices',
    'Saga: local transactions + compensating transactions on failure',
    'Orchestration Saga: central coordinator; Choreography: event-driven',
    'Outbox pattern: event in same DB transaction → relay publishes atomically',
    'Idempotency key: retry-safe operations — store result, return on duplicate',
    'Compensating transactions must be defined for every Saga step with side effects',
  ],
  interviewFocus: [
    'Explain why 2PC fails in microservices (blocking on coordinator crash)',
    'Walk through an Order Saga: steps + what gets compensated on payment failure',
    'Outbox pattern: why dual-write is dangerous and how outbox fixes it',
    'Idempotency: how to prevent double charges on payment retry',
  ],
};

@Component({
  selector: 'app-sysdesign-distributed-transactions',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './distributed-transactions.html',
  styleUrl: './distributed-transactions.scss',
})
export class SysdesignDistributedTransactions {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
