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
  selector: 'app-arch-event-driven',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './event-driven.html',
  styleUrl: './event-driven.scss',
})
export class ArchEventDriven {

  quickRef: QuickRefItem[] = [
    { name: 'Event', type: 'keyword', desc: 'An immutable fact that something happened — "OrderPlaced", "PaymentCharged"' },
    { name: 'Producer', type: 'keyword', desc: 'Service that publishes events after state changes' },
    { name: 'Consumer', type: 'keyword', desc: 'Service that subscribes to events and reacts independently' },
    { name: 'Event Broker', type: 'keyword', desc: 'Kafka, RabbitMQ, Azure Service Bus — persists and routes events to subscribers' },
    { name: 'Event Schema', type: 'keyword', desc: 'Defined shape of an event — use CloudEvents spec or a schema registry' },
    { name: 'Dead Letter Queue', type: 'keyword', desc: 'Events that failed processing repeatedly are moved here for inspection/replay' },
    { name: 'Consumer Group', type: 'keyword', desc: 'Multiple instances of the same consumer sharing a partition — scale-out pattern' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Core Concepts',
      points: [
        'Event-Driven Architecture (EDA): services communicate by publishing and consuming events asynchronously.',
        'An event is an immutable fact: "OrderPlaced at 14:32 UTC" — not a command ("PlaceOrder"), not a query.',
        'The producer publishes and moves on — it does not know who consumes the event or when.',
        'Consumers subscribe independently — adding a new consumer requires zero changes to the producer.',
        'This loose coupling means the system is extensible: new features subscribe to existing events without touching existing code.',
      ],
    },
    {
      heading: 'Event Topology Patterns',
      points: [
        'Simple fan-out: one event, multiple independent consumers (Notification, Analytics, Inventory all react to OrderPlaced).',
        'Event chain: Consumer A reacts to EventX and emits EventY; Consumer B reacts to EventY — a pipeline of reactions.',
        'Competing consumers: multiple instances of the same consumer subscribe as a group — each event processed by exactly one instance (scale-out).',
        'Event streaming (Kafka): events are stored as an ordered log, replayable — consumers can replay from any offset.',
      ],
    },
    {
      heading: 'Reliability Considerations',
      points: [
        'At-least-once delivery: the broker may deliver a message more than once (network retry). Consumers must be idempotent.',
        'Dead Letter Queue (DLQ): after N failed attempts, the event goes to a DLQ for human inspection and reprocessing.',
        'Ordering: Kafka guarantees ordering within a partition. Cross-partition ordering is not guaranteed.',
        'Schema evolution: events are consumed by multiple services — use additive-only changes and a schema registry (Confluent, Azure Schema Registry).',
      ],
    },
    {
      heading: 'Event Notification vs. Event-Carried State Transfer',
      points: [
        'A thin event notification (just "OrderPlaced" with an order ID) requires the consumer to call back to the source service for details — simple and small, but creates a runtime dependency on the source service being available when the consumer processes the event.',
        'Event-carried state transfer includes the relevant data directly in the event payload (the full order details, not just an ID) — the consumer can process the event fully self-sufficiently, at the cost of a larger payload and needing to handle potentially stale data if the source has since changed.',
        'Choosing between them is a real design tradeoff — event-carried state transfer better supports availability and decoupling (no runtime call-back needed) but risks data staleness and payload bloat, while notifications are lean but reintroduce a dependency the event-driven approach was partly meant to avoid.',
        'Many production systems use a hybrid — carrying enough data for common consumer needs directly in the event, while still providing an ID for consumers that need the full, current record via callback, balancing self-sufficiency against payload size.',
      ],
    },
    {
      heading: 'Event-Driven Architecture\'s Debugging and Observability Challenges',
      points: [
        'Tracing a business process across multiple asynchronous event handlers is fundamentally harder than tracing a synchronous call chain — there is no single call stack to follow, requiring distributed tracing with correlation IDs propagated through event metadata to reconstruct the full flow.',
        'Event ordering and timing become genuinely hard to reason about at scale — multiple consumers processing events at different rates, out of the order they were logically intended, is expected behavior that application logic must explicitly account for, not an edge case to special-case around.',
        'Testing event-driven flows end-to-end typically requires either a full integration test environment with real message infrastructure, or careful contract testing between producers and consumers — unit testing a single event handler in isolation does not verify the full asynchronous flow actually works correctly together.',
        'Observability tooling purpose-built for event-driven systems (event flow visualization, consumer lag dashboards) is often necessary beyond generic application logging, since the asynchronous, fan-out nature of event-driven architecture does not map cleanly onto traditional request-response observability tools.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Publishing Events',
      language: 'typescript',
      code: `// Event definition — immutable, past-tense name, versioned
interface OrderPlacedEvent {
  specversion: '1.0';         // CloudEvents spec field
  type: 'com.devhub.order.placed.v1';
  source: '/orders-service';
  id: string;                  // unique event ID (for idempotency)
  time: string;                // ISO-8601
  data: {
    orderId: string;
    customerId: string;
    totalAmount: number;
    currency: string;
    lines: Array<{ productId: string; qty: number; unitPrice: number }>;
  };
}

// Order Service — publish after persisting to DB (Outbox pattern for guarantee)
async function placeOrder(cmd: PlaceOrderCommand): Promise<string> {
  const order = Order.create(cmd);
  await orderRepo.save(order);  // DB commit first

  const event: OrderPlacedEvent = {
    specversion: '1.0',
    type: 'com.devhub.order.placed.v1',
    source: '/orders-service',
    id: generateUUID(),         // idempotency key for consumers
    time: new Date().toISOString(),
    data: { orderId: order.id, customerId: order.customerId, totalAmount: order.total, currency: 'USD', lines: order.lines },
  };

  await broker.publish('orders', event);  // topic name
  return order.id;
}`
    },
    {
      label: 'Consuming Events',
      language: 'typescript',
      code: `// Notification Service — independent consumer
// Processes OrderPlaced events to send confirmation emails

const processedEvents = new Set<string>(); // idempotency store (use Redis/DB in prod)

await broker.subscribe('orders', 'notification-consumer-group', async (event: OrderPlacedEvent) => {
  // Idempotency check — handle at-least-once delivery
  if (processedEvents.has(event.id)) {
    console.log(\`Skipping duplicate event \${event.id}\`);
    return;
  }

  try {
    await emailService.sendOrderConfirmation(
      event.data.customerId,
      event.data.orderId,
      event.data.totalAmount,
    );
    processedEvents.add(event.id);
    await broker.ack(event); // acknowledge — remove from queue
  } catch (err) {
    console.error('Failed to process event:', err);
    await broker.nack(event); // return to queue for retry
    // After N retries → broker moves to Dead Letter Queue
  }
});

// Analytics Service — completely independent consumer of the same events
await broker.subscribe('orders', 'analytics-consumer-group', async (event: OrderPlacedEvent) => {
  await analytics.track('order_placed', { revenue: event.data.totalAmount });
});`
    },
    {
      label: 'Dead Letter Queue Handling',
      language: 'typescript',
      code: `// Monitor DLQ for failed events — inspect, fix, replay
const DLQ_TOPIC = 'orders.dlq';

await broker.subscribe(DLQ_TOPIC, 'dlq-monitor', async (failedEvent) => {
  console.error('Failed event in DLQ:', {
    eventId: failedEvent.id,
    errorCount: failedEvent.metadata.retryCount,
    lastError: failedEvent.metadata.lastError,
    originalTopic: failedEvent.metadata.originalTopic,
  });

  // Option A: Fix the consumer code and replay from the original topic offset
  // Option B: Manually process this specific event
  // Option C: Discard if no longer relevant (with audit log)

  await alerting.sendSlack(\`Event \${failedEvent.id} in DLQ — needs attention\`);
});

// Replay mechanism — reprocess events from a specific offset
async function replayFrom(topic: string, fromOffset: number): Promise<void> {
  const events = await broker.readFromOffset(topic, fromOffset);
  for (const event of events) {
    await broker.republish(event.originalTopic, event);
  }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using commands disguised as events',
      wrong: `// "SendEmailCommand" published as an event — this is a command, not an event`,
      right: `// "OrderPlaced" — a fact that happened. Email service decides what to do with it.`,
      explanation: 'Events describe what happened (past tense, immutable). Commands tell a service what to do. If the producer cares who handles it or how, it\'s a command — use a queue, not a pub/sub topic.',
    },
    {
      title: 'Not handling duplicate event delivery',
      wrong: `// Consumer charges card every time it receives OrderPlaced — double charge on replay`,
      right: `// Check event.id against processed set before charging; mark as processed after success`,
      explanation: 'Message brokers guarantee at-least-once delivery. Without idempotency, replays, retries, and network glitches cause duplicate side effects.',
    },
    {
      title: 'Publishing events before the DB transaction commits',
      wrong: `await broker.publish(event); await orderRepo.save(order); // event published but DB fails → inconsistency`,
      right: `await orderRepo.save(order); await broker.publish(event); // or use Outbox Pattern`,
      explanation: 'Publishing before the DB commit can leave consumers processing an event for a state change that never persisted. Use Outbox Pattern for guaranteed consistency.',
    },
    {
      title: 'Embedding too much data in events (fat events)',
      wrong: `// Event contains entire customer record, full product catalogue, order history`,
      right: `// Event contains orderId and minimal context; consumers fetch full data if needed`,
      explanation: 'Fat events couple producers and consumers to the same data shape. Lean events (IDs + minimal context) keep consumers independent and reduce payload size.',
    },
  ];

  challenge: Challenge = {
    title: 'Wire an Event-Driven Loyalty Points System',
    language: 'typescript',
    description: `A LoyaltyService needs to award points whenever an order is placed.
It should NOT be called directly by the Order Service.
1. Define the OrderPlacedEvent with orderId, customerId, and totalAmount.
2. Write a publish function called after the order is saved.
3. Write the LoyaltyService consumer that awards 1 point per dollar spent.
4. Make the consumer idempotent.`,
    hints: [
      'Event: past-tense name, unique id, data payload',
      'Publish AFTER DB save — not before',
      'Consumer: check processed set, award points, mark done',
      'Points = Math.floor(totalAmount)',
    ],
    starterCode: `interface OrderPlacedEvent {
  id: string;
  data: { orderId: string; customerId: string; totalAmount: number };
}

const processedEvents = new Set<string>();
const loyaltyPoints = new Map<string, number>(); // customerId → points

// TODO: publish function
// TODO: loyalty consumer`,
    solution: `interface OrderPlacedEvent {
  id: string;
  data: { orderId: string; customerId: string; totalAmount: number };
}

const processedEvents = new Set<string>();
const loyaltyPoints = new Map<string, number>();

// Simple in-memory broker stub
const subscribers: Array<(e: OrderPlacedEvent) => Promise<void>> = [];
const broker = {
  publish: async (e: OrderPlacedEvent) => { for (const s of subscribers) await s(e); },
  subscribe: (fn: (e: OrderPlacedEvent) => Promise<void>) => { subscribers.push(fn); },
};

// Order Service — publish after save
async function placeOrder(customerId: string, total: number): Promise<string> {
  const orderId = 'ord-' + Date.now();
  // await orderRepo.save(order); // DB first
  await broker.publish({ id: 'evt-' + Date.now(), data: { orderId, customerId, totalAmount: total } });
  return orderId;
}

// Loyalty Consumer — idempotent
broker.subscribe(async (event: OrderPlacedEvent) => {
  if (processedEvents.has(event.id)) return; // idempotency
  const { customerId, totalAmount } = event.data;
  const points = Math.floor(totalAmount);
  loyaltyPoints.set(customerId, (loyaltyPoints.get(customerId) ?? 0) + points);
  processedEvents.add(event.id);
  console.log(\`Awarded \${points} points to \${customerId}. Total: \${loyaltyPoints.get(customerId)}\`);
});

placeOrder('cust-1', 49.99).then(id => console.log('Order placed:', id));`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What distinguishes an event from a command?',
      options: [
        'Events use REST; commands use Kafka',
        'An event is an immutable past-tense fact; a command is a request to do something',
        'Events are synchronous; commands are async',
        'Commands have a schema; events do not',
      ],
      answer: 1,
      explanation: 'Event: "OrderPlaced" — describes what happened, immutable. Command: "PlaceOrder" — tells a service to do something. Producers of events do not know or care who handles them.',
    },
    {
      q: 'Why must event consumers be idempotent?',
      options: [
        'Because events are delivered in random order',
        'Because brokers guarantee at-least-once delivery — duplicates are possible',
        'Because consumers share the same database',
        'Because events expire after 24 hours',
      ],
      answer: 1,
      explanation: 'At-least-once delivery means the same event may arrive multiple times. Idempotency ensures processing it twice has the same effect as processing it once.',
    },
    {
      q: 'What risk does a "poison pill" event pose if a topic has no Dead Letter Queue configured at all?',
      options: [
        'Nothing — the consumer simply skips events it cannot process',
        'A single malformed event that always fails processing can cause the consumer to retry it indefinitely, potentially blocking all events queued behind it on that partition/queue from ever being processed',
        'The broker automatically deletes malformed events after 24 hours',
        'Poison pills only affect the producer, never the consumer',
      ],
      answer: 1,
      explanation: 'Without a DLQ, a consumer\'s only options for a permanently-failing event are: retry forever (blocking all subsequent events on that partition/queue behind it — a full pipeline stall) or silently skip it (data loss with no record of what was lost). A DLQ gives a third option: after N attempts, move the poison pill aside for inspection while letting the rest of the queue continue processing — which is precisely why DLQs are considered a near-mandatory production safeguard, not an optional nicety.',
    },
    { q: 'What is the difference between event-driven architecture and request-response architecture?', options: ['Event-driven is synchronous; request-response is asynchronous', 'In request-response the sender waits for a reply; in event-driven the publisher fires an event without waiting and without knowing which consumers will react', 'Event-driven is used for read operations; request-response is used for writes', 'They are equivalent patterns with different naming conventions'], answer: 1, explanation: 'Request-response (synchronous): the caller sends a request and waits for the callee to respond before continuing. Creates temporal and spatial coupling: the callee must be available and running. Event-driven (asynchronous): the publisher emits an event representing something that happened, without waiting for any response and without knowing which services will consume the event. Consumers react independently. This decouples publishers from consumers in time (consumers can be down and catch up later) and in topology (add new consumers without changing the publisher).' },
    { q: 'What is the difference between an event-carried state transfer and a simple event notification?', options: ['Event-carried state transfer is for large payloads; notification events are for small ones', 'Event notification carries only the ID or minimal info that something happened; event-carried state transfer includes all data about the changed entity so consumers do not need to call back', 'Event-carried state transfer is synchronous; event notification is asynchronous', 'They are two names for the same concept in event-driven architecture'], answer: 1, explanation: 'Event notification: the event tells consumers that something happened and provides a reference (ID), but consumers must call back to the source to fetch full details. This keeps the event small but creates a dependency where consumers must be able to call the source. Event-carried state transfer: the event includes all the data that consumers may need, removing the need for a callback. This eliminates temporal coupling but produces larger event payloads. Use event-carried state transfer when consumers are in separate bounded contexts or when callback latency is unacceptable.' },
    { q: 'What is the choreography vs orchestration distinction in event-driven systems?', options: ['Choreography is for synchronous flows; orchestration is for asynchronous flows', 'In choreography each service reacts to events autonomously without a central coordinator; in orchestration a central component explicitly directs each step of the workflow', 'Orchestration uses events; choreography uses direct service calls', 'They are interchangeable terms for event-driven coordination patterns'], answer: 1, explanation: 'Choreography: services are decoupled. Each service listens for events it cares about and reacts by publishing its own events. No service knows the overall workflow. Adding a new step requires only a new subscriber without changing existing services. Drawback: the overall workflow logic is distributed and hard to visualize. Orchestration: a central orchestrator service sends commands to participants and listens for their responses, explicitly managing the workflow state. Easier to monitor and reason about but the orchestrator is a coupling point. Orchestration is better for complex workflows; choreography for simple reactive pipelines.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between thin and fat events?',
      a: 'Thin (notification) event: just the ID and type — "OrderId: 123 was placed". Consumers fetch full data if needed. Fat event: contains all relevant data inline. Fat events reduce round trips but couple consumers to the producer\'s data model. Prefer thin events for loose coupling; use fat events when consumers need the data immediately and the producer is stable.',
    },
    {
      q: 'How do you handle event ordering in Kafka?',
      a: 'Kafka guarantees ordering within a partition. Partition by a natural ordering key (customerId, orderId) — all events for the same entity go to the same partition and are processed in order. Cross-partition ordering is not guaranteed — design consumers to be order-independent where possible.',
    },
    {
      q: 'What is event schema evolution and why does it matter?',
      a: 'As requirements change, event shapes change. Consumers must not break when new optional fields are added. Use: additive-only changes (new optional fields), semantic versioning in the event type name (v1, v2), a schema registry (Confluent, Apicurio) to enforce compatibility, and consumer groups with explicit version subscriptions.',
    },
    { q: 'Why is renaming a field in an event schema considered a breaking change even if the field\'s TYPE and semantic meaning stay identical?', a: 'Most schema serialization formats (Avro, Protobuf, JSON Schema) and compatibility checkers key field matching primarily by NAME (or an explicit field-number tag in Protobuf) — a consumer expecting a field called customerId will not find any data if the producer starts calling the identical value clientId, even though nothing about the underlying meaning or type changed. This is why renames are typically handled as an ADD-then-DEPRECATE sequence: introduce the new field name alongside the old one (both populated by the producer) for a transition period, migrate all consumers to read the new name, then remove the old field only once no consumer depends on it — a direct rename in one step breaks every consumer still reading the old name.' },
    { q: 'How do you ensure exactly-once processing in event-driven systems?', a: 'Exactly-once delivery is very hard in distributed systems; most systems achieve at-least-once delivery with idempotent consumers. At-least-once delivery: the broker delivers the event and retries if the consumer does not acknowledge within a timeout. Consumers may receive duplicates on retries. Idempotency: the consumer checks whether it has already processed the event (by tracking the event ID in a processed events table or a deduplication cache) before executing the side effect. Kafka transactions and Kafka Streams provide exactly-once semantics within a Kafka-based pipeline but not for external side effects. For external side effects like database writes or API calls, implement idempotent handlers that check before acting.' },
    { q: 'What is dead letter queue (DLQ) and why is it important in event-driven systems?', a: 'A Dead Letter Queue receives events that could not be processed after all retry attempts. Without a DLQ, a poison message (an event that always causes processing errors) blocks the consumer from processing subsequent events. The DLQ removes the poison message from the main queue after max retries, allowing the consumer to continue. Operations teams can inspect DLQ messages to identify the root cause (malformed event, missing dependency, bug) and decide whether to replay, fix, or discard them. Configure DLQ routing at the consumer or broker level. Monitor DLQ depth as an operational alert: growing DLQ indicates systematic processing failures requiring investigation.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'EDA decouples services via immutable past-tense events — producers publish facts, consumers subscribe independently, enabling extensibility without touching existing code.',
    mustKnow: [
      'Events: immutable past-tense facts; producers publish and forget',
      'Consumers are independent — add a new consumer without changing the producer',
      'At-least-once delivery → consumers must be idempotent (check event.id)',
      'Publish events after DB commit, not before (or use Outbox Pattern)',
      'DLQ: events that exceed retry limit for human inspection and replay',
    ],
    interviewFocus: [
      'Event vs command — what is the difference?',
      'Why must EDA consumers be idempotent?',
      'How would you handle event schema evolution without breaking consumers?',
    ],
  };
}
