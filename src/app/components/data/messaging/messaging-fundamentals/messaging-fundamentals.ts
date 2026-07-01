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
  selector: 'app-messaging-fundamentals',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './messaging-fundamentals.html',
  styleUrl: './messaging-fundamentals.scss',
})
export class MessagingFundamentals {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: 'Producer', desc: 'Sends messages to the broker' },
    { type: 'keyword', name: 'Consumer', desc: 'Reads messages from broker queues/topics' },
    { type: 'keyword', name: 'Broker', desc: 'Middleware that routes and stores messages' },
    { type: 'keyword', name: 'Queue', desc: 'Point-to-point channel — one consumer per message' },
    { type: 'keyword', name: 'Topic', desc: 'Pub/sub channel — many consumers can receive the same message' },
    { type: 'keyword', name: 'At-least-once', desc: 'Guaranteed delivery but duplicates possible' },
    { type: 'keyword', name: 'Exactly-once', desc: 'No loss, no duplicates — expensive to guarantee' },
    { type: 'keyword', name: 'Dead Letter Queue', desc: 'Holds messages that cannot be processed after N retries' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Asynchronous Messaging?',
      points: [
        'Decoupling: producer and consumer do not need to be running simultaneously',
        'Buffering: broker absorbs traffic spikes without overwhelming downstream services',
        'Fan-out: one message can trigger multiple independent consumers',
        'Resilience: messages survive consumer crashes — retried when the service recovers',
        'Ordering: brokers can preserve message order within a queue/partition',
      ],
    },
    {
      heading: 'Synchronous vs Asynchronous',
      points: [
        'Synchronous (HTTP/gRPC): caller blocks until the callee responds — tight coupling',
        'Asynchronous (messaging): producer fire-and-forgets; consumer processes independently',
        'Async improves availability: a downstream outage does not propagate to the producer',
        'Trade-off: eventual consistency — the system is not instantly up-to-date everywhere',
        'Choose sync for real-time queries (read APIs); async for commands and events',
      ],
    },
    {
      heading: 'Delivery Semantics',
      points: [
        'At-most-once: fire and forget — message may be lost, never duplicated',
        'At-least-once: broker retries until acknowledged — duplicates must be handled',
        'Exactly-once: no loss, no duplicates — requires idempotent consumers or transactions',
        'Most brokers default to at-least-once; design consumers to be idempotent',
        'Kafka transactional API and SQS FIFO offer exactly-once at extra cost',
      ],
    },
    {
      heading: 'Core Components',
      points: [
        'Message: payload + headers/metadata (correlation ID, timestamp, content-type)',
        'Producer: publishes messages; may choose queue, topic, or routing key',
        'Broker: stores, routes, and delivers messages (RabbitMQ, Kafka, SQS)',
        'Consumer: subscribes or polls; acknowledges after successful processing',
        'DLQ (Dead Letter Queue): destination for unprocessable messages — always configure one',
      ],
    },
    {
      heading: 'Why Asynchronous Messaging Decouples Services',
      points: [
        'Synchronous request-response coupling means the caller blocks until the callee responds, and the caller directly experiences the callee\'s latency and availability problems — a slow or down downstream service directly degrades the calling service.',
        'Asynchronous messaging inserts a durable broker between producer and consumer, meaning the producer can continue even if the consumer is temporarily slow or unavailable — the broker buffers messages until the consumer catches up.',
        'This decoupling extends to deployment and scaling independence — a producer and consumer connected via a message broker can be deployed, scaled, and even rewritten independently, as long as the message contract between them stays stable.',
        'The tradeoff for this decoupling is added complexity (eventual consistency instead of immediate confirmation, and the need for monitoring/observability across an asynchronous boundary) — not every interaction benefits from asynchronous messaging, and synchronous calls remain appropriate when an immediate response is genuinely required.',
      ],
    },
  ];

   codeTabs: CodeTab[] = [
    {
      label: 'Node.js — amqplib (RabbitMQ)',
      language: 'typescript',
      code: `import amqp from 'amqplib';

// Producer
async function publish(msg: string) {
  const conn = await amqp.connect('amqp://localhost');
  const ch   = await conn.createChannel();
  await ch.assertQueue('orders', { durable: true });
  ch.sendToQueue('orders', Buffer.from(msg), { persistent: true });
  await ch.close();
  await conn.close();
}

// Consumer
async function consume() {
  const conn = await amqp.connect('amqp://localhost');
  const ch   = await conn.createChannel();
  await ch.assertQueue('orders', { durable: true });
  ch.prefetch(1); // process one at a time

  ch.consume('orders', async (msg) => {
    if (!msg) return;
    try {
      await processOrder(JSON.parse(msg.content.toString()));
      ch.ack(msg);        // success — remove from queue
    } catch {
      ch.nack(msg, false, false); // failed — send to DLQ
    }
  });
}`,
    },
    {
      label: 'Node.js — kafkajs (Kafka)',
      language: 'typescript',
      code: `import { Kafka } from 'kafkajs';

const kafka = new Kafka({ brokers: ['localhost:9092'] });

// Producer
const producer = kafka.producer();
await producer.connect();
await producer.send({
  topic: 'orders',
  messages: [
    { key: 'order-123', value: JSON.stringify({ id: 123, amount: 99.99 }) },
  ],
});

// Consumer
const consumer = kafka.consumer({ groupId: 'order-service' });
await consumer.connect();
await consumer.subscribe({ topic: 'orders', fromBeginning: false });

await consumer.run({
  eachMessage: async ({ message }) => {
    const order = JSON.parse(message.value!.toString());
    await processOrder(order);
    // Kafka offsets auto-committed — or use manual commit
  },
});`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not acknowledging messages',
      wrong: `ch.consume('q', (msg) => { processMsg(msg); }); // no ack`,
      right: `ch.consume('q', (msg) => { processMsg(msg); ch.ack(msg); });`,
      explanation: 'Without ack, RabbitMQ re-queues the message when the channel closes — causing infinite redelivery.',
    },
    {
      title: 'Missing DLQ configuration',
      wrong: `await ch.assertQueue('orders', { durable: true });`,
      right: `await ch.assertQueue('orders', { durable: true, arguments: { 'x-dead-letter-exchange': 'dlx' } });`,
      explanation: 'Without a DLQ, poison messages block the queue forever after exhausting retries.',
    },
    {
      title: 'Non-idempotent consumer',
      wrong: `await db.insert(order); // fails on duplicate — causes retry loop`,
      right: `await db.upsert(order, { conflictOn: ['id'] }); // safe to replay`,
      explanation: 'At-least-once delivery means any consumer can receive duplicates; always design for idempotency.',
    },
    {
      title: 'Synchronous call inside consumer',
      wrong: `await consumer.run({ eachMessage: async ({ msg }) => { await slowHttpCall(msg); } });`,
      right: `// Use retries, circuit breakers, or move slow work to a separate queue`,
      explanation: 'Slow synchronous calls inside a consumer hold up the entire partition/channel — back-pressure builds.',
    },
    {
      title: 'No correlation ID in messages',
      wrong: `producer.send({ topic: 'orders', messages: [{ value: JSON.stringify(order) }] });`,
      right: `producer.send({ topic: 'orders', messages: [{ headers: { correlationId: uuid() }, value: JSON.stringify(order) }] });`,
      explanation: 'Without a correlation ID, tracing message flows across services in logs/APM is nearly impossible.',
    },
  ];

  challenge: Challenge = {
    title: 'Reliable Order Processor',
    language: 'typescript',
    description: 'Implement a message consumer that processes orders idempotently. It should ack on success, nack (without requeue) on permanent failure, and use a deduplication set to skip already-processed message IDs.',
    hints: [
      'Track processed IDs in a Set<string>',
      'Parse the message JSON and extract an id field',
      'Use ch.ack(msg) for success and ch.nack(msg, false, false) for failure',
    ],
    starterCode: `const processed = new Set<string>();

async function handleMessage(ch: Channel, msg: Message | null) {
  if (!msg) return;
  // TODO: parse JSON, check idempotency, process, ack/nack
}`,
    solution: `const processed = new Set<string>();

async function handleMessage(ch: Channel, msg: Message | null) {
  if (!msg) return;
  try {
    const order = JSON.parse(msg.content.toString()) as { id: string };
    if (processed.has(order.id)) {
      ch.ack(msg); // already done — skip silently
      return;
    }
    await processOrder(order);
    processed.add(order.id);
    ch.ack(msg);
  } catch {
    ch.nack(msg, false, false); // send to DLQ
  }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which delivery semantic is cheapest to implement and may lose messages?',
      options: ['At-most-once', 'At-least-once', 'Exactly-once', 'Best-effort-ordered'],
      answer: 0,
      explanation: 'At-most-once is fire-and-forget — no retries, no acknowledgement, possible message loss.',
    },
    {
      q: 'What is the primary purpose of a Dead Letter Queue?',
      options: ['Speed up consumers', 'Store unprocessable messages for inspection', 'Encrypt messages at rest', 'Reduce broker memory usage'],
      answer: 1,
      explanation: 'A DLQ captures messages that failed processing after N retries so they can be inspected and replayed manually.',
    },
    {
      q: 'Why must consumers be idempotent in at-least-once systems?',
      options: ['To improve throughput', 'To handle duplicate message deliveries safely', 'To reduce network latency', 'To support fan-out'],
      answer: 1,
      explanation: 'At-least-once guarantees delivery but may send duplicates on retry — idempotent consumers produce the same result regardless of how many times a message is processed.',
    },
    {
      q: 'Which pattern allows one message to reach multiple independent consumers?',
      options: ['Point-to-point queue', 'Pub/Sub topic', 'Round-robin worker', 'Request-reply'],
      answer: 1,
      explanation: 'Pub/Sub topics fan-out one message to all subscribers, whereas queues deliver each message to exactly one consumer.',
    },
    {
      q: 'What is the difference between synchronous and asynchronous messaging?',
      options: ['Synchronous messages are faster', 'Synchronous: caller blocks waiting for response; asynchronous: caller sends and continues without waiting', 'Asynchronous requires a broker', 'Synchronous scales better'],
      answer: 1,
      explanation: 'Synchronous (HTTP, RPC): tight coupling, caller blocks. Asynchronous (queues, events): decoupled, caller continues after send. Async improves resilience and throughput at the cost of complexity.',
    },
    {
      q: 'What is the at-most-once, at-least-once, exactly-once delivery spectrum?',
      options: ['All are equivalent with correct implementation', 'At-most-once: may lose messages; at-least-once: may duplicate; exactly-once: no loss, no duplicate', 'Exactly-once is always the correct choice', 'At-most-once is the most reliable'],
      answer: 1,
      explanation: 'At-most-once: fire-and-forget (may lose). At-least-once: retry on failure (may duplicate — idempotent consumers required). Exactly-once: hardest to achieve, requires coordination between producer, broker, and consumer.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I choose messaging over direct HTTP calls?',
      a: 'Use messaging when the producer and consumer should be decoupled in time (fire-and-forget), when you need buffering for traffic spikes, when multiple services must react to the same event (fan-out), or when you need reliable retry on consumer failure.',
    },
    {
      q: 'What is the difference between a queue and a topic?',
      a: 'A queue delivers each message to exactly one consumer (work queue / competing consumers pattern). A topic delivers each message to all subscribers — suitable for event broadcasting. Kafka uses "consumer groups" to blend both: within a group only one consumer gets each message; across groups all get it.',
    },
    {
      q: 'How do I achieve exactly-once processing?',
      a: 'True exactly-once requires either: (1) a broker with transactional support (Kafka EOS, SQS FIFO deduplication), or (2) idempotent consumers that check a deduplication store before processing. The latter is simpler and more portable.',
    },
    {
      q: 'What is message fanout and how is it implemented?',
      a: 'Fanout delivers one message to multiple subscribers simultaneously. In Kafka: multiple consumer groups each read all messages. In SNS: publishes to all subscribed endpoints. In RabbitMQ: fanout exchange routes to all bound queues. Fanout decouples publishers from subscribers — add a new subscriber without changing the publisher.',
    },
    {
      q: 'What is a poison pill message and how do you handle it?',
      a: 'A poison pill is a message that always causes consumer processing failures (invalid format, missing data, unhandled edge case). Without handling, it blocks the queue. Solutions: dead-letter queue after N retries, exponential backoff, validation before processing. Always alert on DLQ growth to catch stuck messages early.',
    },
    {
      q: 'What is the difference between push and pull message delivery?',
      a: 'Push (SNS, EventBridge, webhooks): broker sends to subscriber endpoint — low latency but subscriber must handle burst load. Pull (SQS, Kafka, RabbitMQ poll): consumer fetches at its own pace — easier backpressure but higher latency. Long-polling bridges both: consumer waits up to N seconds for a message before returning empty.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Asynchronous messaging decouples producers from consumers via a broker, trading immediate consistency for resilience, scalability, and fan-out.',
    mustKnow: [
      'Producer → Broker → Consumer flow and component roles',
      'Queue (point-to-point) vs Topic (pub/sub) semantics',
      'At-most-once / At-least-once / Exactly-once delivery guarantees',
      'Idempotent consumers handle duplicate at-least-once delivery',
      'DLQ captures unprocessable messages for inspection',
      'Async messaging introduces eventual consistency',
    ],
    interviewFocus: [
      'Why async over HTTP? — decoupling, buffering, fan-out, resilience',
      'Explain at-least-once and why idempotency is required',
      'Trade-offs of exactly-once — performance vs correctness',
      'When to use a DLQ and how to monitor it',
    ],
  };
}
