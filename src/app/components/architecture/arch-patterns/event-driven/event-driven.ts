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
      q: 'What is a Dead Letter Queue?',
      options: [
        'A backup database for failed orders',
        'A queue where events go after exceeding the retry limit — for human inspection and replay',
        'A priority queue for VIP customers',
        'A queue for deleted records',
      ],
      answer: 1,
      explanation: 'After N failed processing attempts, the broker routes the event to a DLQ. Operators inspect the cause, fix the consumer, and replay the events.',
    },
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
