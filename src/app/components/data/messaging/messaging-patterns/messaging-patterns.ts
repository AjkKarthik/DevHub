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
  selector: 'app-messaging-patterns',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './messaging-patterns.html',
  styleUrl: './messaging-patterns.scss'
})
export class MessagingPatterns {
  readonly quickRef: QuickRefItem[] = [
    { name: 'Pub/Sub', type: 'keyword', desc: 'Publisher sends to topic; all subscribers receive independently' },
    { name: 'Event-Driven', type: 'keyword', desc: 'Services react to events rather than making synchronous calls' },
    { name: 'Competing Consumers', type: 'keyword', desc: 'Multiple workers share a queue to scale throughput horizontally' },
    { name: 'Scatter-Gather', type: 'keyword', desc: 'Fan out to N workers, aggregate all replies before responding' },
    { name: 'Claim Check', type: 'keyword', desc: 'Store large payload in object store; send only reference in message' },
    { name: 'Content-Based Router', type: 'keyword', desc: 'Route messages to different queues based on message content' },
    { name: 'Message Filter', type: 'keyword', desc: 'Consumer discards messages that do not match its criteria' },
    { name: 'Aggregator', type: 'keyword', desc: 'Collects related messages and combines into one result' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'Event-Driven Architecture Patterns',
      points: [
        'Pub/Sub decouples producers from consumers — publishers emit events without knowing who listens.',
        'Event Notification: services notify others of a state change; receivers decide whether to act.',
        'Event-Carried State Transfer: events include enough data for consumers to act without querying back.',
        'Event Sourcing: the event log is the source of truth; current state is derived by replaying events.',
      ]
    },
    {
      heading: 'Message Routing Patterns',
      points: [
        'Content-Based Router inspects message fields and routes to different destinations.',
        'Message Filter: consumers apply a predicate and skip irrelevant messages.',
        'Splitter: splits one message with a collection into multiple individual messages.',
        'Aggregator: waits for N correlated messages and emits a combined result.',
      ]
    },
    {
      heading: 'Reliability and Scalability Patterns',
      points: [
        'Competing Consumers: scale throughput by adding workers to a shared queue.',
        'Claim Check: large payloads stored in S3/Blob; message carries only a URL reference to avoid broker size limits.',
        'Scatter-Gather: fan-out one request to multiple workers, then merge their responses.',
        'Dead Letter Channel: redirect unprocessable messages for inspection and manual replay.',
      ]
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'Content-Based Router',
      language: 'typescript',
      code: `import amqplib from 'amqplib';

const conn = await amqplib.connect('amqp://localhost');
const ch   = await conn.createChannel();

await ch.assertExchange('orders', 'direct', { durable: true });
await ch.assertQueue('priority-orders',  { durable: true });
await ch.assertQueue('standard-orders',  { durable: true });
await ch.bindQueue('priority-orders', 'orders', 'priority');
await ch.bindQueue('standard-orders', 'orders', 'standard');

// Router: inspect content and choose routing key
function routeOrder(order: { id: string; total: number; vip: boolean }) {
  const key = order.vip || order.total > 500 ? 'priority' : 'standard';
  ch.publish('orders', key,
    Buffer.from(JSON.stringify(order)),
    { persistent: true }
  );
  console.log(\`Routed order \${order.id} to \${key}\`);
}

routeOrder({ id: 'ORD-1', total: 999, vip: false }); // → priority
routeOrder({ id: 'ORD-2', total: 20,  vip: false }); // → standard`,
    },
    {
      label: 'Claim Check (Large Payload)',
      language: 'typescript',
      code: `import { Kafka } from 'kafkajs';
// In production, use AWS S3 SDK / Azure Blob SDK for storage

const kafka    = new Kafka({ brokers: ['localhost:9092'] });
const producer = kafka.producer();
await producer.connect();

// Claim Check Pattern: store large payload, send only reference
async function publishWithClaimCheck(payload: object) {
  const json = JSON.stringify(payload);
  const isTooLarge = json.length > 900_000; // Kafka default max 1MB

  if (isTooLarge) {
    // Store in object storage (pseudo-code)
    const ref = await storeInObjectStorage(json);
    await producer.send({
      topic: 'orders',
      messages: [{ value: JSON.stringify({ type: 'claim-check', ref }) }],
      acks: -1,
    });
    console.log('Sent claim check reference:', ref);
  } else {
    await producer.send({
      topic: 'orders',
      messages: [{ value: JSON.stringify({ type: 'inline', data: payload }) }],
      acks: -1,
    });
  }
}

async function storeInObjectStorage(data: string): Promise<string> {
  // AWS S3 / Azure Blob Store pseudocode
  const key = \`payloads/\${Date.now()}.json\`;
  console.log('Stored payload at', key);
  return key;
}

await publishWithClaimCheck({ items: new Array(10000).fill({ sku: 'A1' }) });`,
    },
    {
      label: 'Scatter-Gather',
      language: 'typescript',
      code: `import amqplib from 'amqplib';
import { randomUUID } from 'crypto';

// Scatter: fan-out query to multiple price services
// Gather: collect all replies and return the cheapest

async function getBestPrice(productId: string, vendors = ['v1', 'v2', 'v3']) {
  const conn   = await amqplib.connect('amqp://localhost');
  const ch     = await conn.createChannel();
  const corrId = randomUUID();

  const { queue: replyQ } = await ch.assertQueue('', { exclusive: true });
  const replies: { vendor: string; price: number }[] = [];

  return new Promise<{ vendor: string; price: number }>((resolve) => {
    // Collect replies until we have them all
    ch.consume(replyQ, (msg) => {
      if (!msg || msg.properties.correlationId !== corrId) return;
      const reply = JSON.parse(msg.content.toString());
      replies.push(reply);
      if (replies.length === vendors.length) {
        const best = replies.reduce((a, b) => a.price < b.price ? a : b);
        conn.close();
        resolve(best);
      }
    }, { noAck: true });

    // Scatter: send to each vendor queue
    for (const vendor of vendors) {
      ch.sendToQueue(
        \`price-\${vendor}\`,
        Buffer.from(JSON.stringify({ productId })),
        { correlationId: corrId, replyTo: replyQ }
      );
    }
  });
}

const best = await getBestPrice('SKU-123');
console.log('Best price:', best);`,
    },
  ];

  readonly mistakes: CommonMistake[] = [
    {
      title: 'Using synchronous calls in an event-driven system (defeating the purpose)',
      wrong: `// Event-driven system that still queries synchronously on every event
eventBus.on('order.placed', async (order) => {
  const user = await userService.getUser(order.userId); // sync HTTP call
  sendConfirmation(user.email, order);
});`,
      right: `// Use Event-Carried State Transfer: include required data in the event
eventBus.on('order.placed', async (order) => {
  // order includes userEmail — no sync call needed
  sendConfirmation(order.userEmail, order);
});`,
      explanation: 'Synchronous service calls inside event handlers reintroduce coupling. Use Event-Carried State Transfer: include all required data in the event payload.'
    },
    {
      title: 'Scatter-Gather without a timeout (waiting forever)',
      wrong: `// Waits forever if one vendor never replies
return new Promise((resolve) => {
  ch.consume(replyQ, (msg) => {
    replies.push(JSON.parse(msg.content.toString()));
    if (replies.length === vendors.length) resolve(best(replies));
  }, { noAck: true });
  for (const v of vendors) ch.sendToQueue(\`price-\${v}\`, ...);
});`,
      right: `// Add a timeout — resolve with partial results after 2s
const timeout = setTimeout(() => {
  if (replies.length) resolve(best(replies));
  else reject(new Error('No price replies within timeout'));
}, 2000);
// Clear timeout when all replies received`,
      explanation: 'Scatter-Gather must have a deadline. Waiting indefinitely blocks the caller if any worker is slow or offline. Resolve with best available results after timeout.'
    },
    {
      title: 'Sending large payloads directly through a message broker',
      wrong: `// Message > 1MB will be rejected or cause broker issues
await producer.send({ topic: 'orders',
  messages: [{ value: JSON.stringify(hugePayload) }] }); // 5MB payload`,
      right: `// Store large payload in object storage, send only a reference
const ref = await s3.upload(hugePayload);
await producer.send({ topic: 'orders',
  messages: [{ value: JSON.stringify({ type: 'claim-check', ref }) }] });`,
      explanation: 'Kafka and RabbitMQ have message size limits (default 1MB). Use the Claim Check pattern: store large data externally and publish only a reference.'
    },
    {
      title: 'Not correlating aggregated messages, mixing results from different requests',
      wrong: `// No correlationId — aggregator mixes results from concurrent requests
ch.consume(replyQ, (msg) => {
  replies.push(JSON.parse(msg.content.toString()));
  if (replies.length === total) resolve(merge(replies)); // wrong mix
});`,
      right: `// Filter by correlationId to only aggregate your request's replies
ch.consume(replyQ, (msg) => {
  if (msg?.properties.correlationId !== corrId) return;
  replies.push(JSON.parse(msg.content.toString()));
  if (replies.length === total) resolve(merge(replies));
});`,
      explanation: 'In concurrent systems, multiple scatter-gather requests share the same reply queue. Always filter by correlationId to prevent mixing responses across requests.'
    },
  ];

  readonly challenge: Challenge = {
    title: 'Message Aggregator',
    language: 'typescript',
    description: 'Implement a message aggregator: consume messages from "order-items" Kafka topic where each message has an orderId and an item. Collect all items with the same orderId. After 5 seconds of inactivity for an orderId (no new items), emit the aggregated order to "completed-orders" topic.',
    hints: [
      'Use a Map<string, {items, lastSeen}> to track partial orders',
      'Run a setInterval to check for timed-out orders',
      'Publish to completed-orders when an orderId has been inactive for 5s',
    ],
    starterCode: `import { Kafka } from 'kafkajs';

const pending = new Map<string, { items: unknown[]; lastSeen: number }>();

async function startAggregator() {
  const kafka = new Kafka({ brokers: ['localhost:9092'] });
  // TODO: consume order-items, aggregate by orderId, emit when idle 5s
}`,
    solution: `import { Kafka } from 'kafkajs';

const pending = new Map<string, { items: unknown[]; lastSeen: number }>();
const IDLE_MS = 5000;

async function startAggregator() {
  const kafka    = new Kafka({ brokers: ['localhost:9092'] });
  const consumer = kafka.consumer({ groupId: 'aggregator' });
  const producer = kafka.producer({ idempotent: true });

  await consumer.connect();
  await producer.connect();
  await consumer.subscribe({ topic: 'order-items' });

  // Flush idle orders every second
  setInterval(async () => {
    const now = Date.now();
    for (const [orderId, state] of pending.entries()) {
      if (now - state.lastSeen >= IDLE_MS) {
        pending.delete(orderId);
        await producer.send({
          topic: 'completed-orders',
          messages: [{
            key:   orderId,
            value: JSON.stringify({ orderId, items: state.items }),
          }],
          acks: -1,
        });
        console.log(\`Emitted order \${orderId} with \${state.items.length} items\`);
      }
    }
  }, 1000);

  await consumer.run({
    eachMessage: async ({ message }) => {
      const { orderId, item } = JSON.parse(message.value!.toString());
      const state = pending.get(orderId) ?? { items: [], lastSeen: 0 };
      state.items.push(item);
      state.lastSeen = Date.now();
      pending.set(orderId, state);
    },
  });
}`,
  };

  readonly quiz: QuizQuestion[] = [
    { q: 'What is the Claim Check pattern used for?', options: ['Routing messages by content', 'Storing large payloads externally and sending only a reference', 'Aggregating replies from multiple services', 'Dead-lettering failed messages'], answer: 1, explanation: 'Claim Check avoids broker size limits by storing large payloads in object storage and sending only a reference URL in the message.' },
    { q: 'Which pattern collects responses from multiple services before returning?', options: ['Content-Based Router', 'Pub/Sub', 'Scatter-Gather', 'Message Filter'], answer: 2, explanation: 'Scatter-Gather fans out to N workers and aggregates all replies into one result before responding to the caller.' },
    { q: 'What does Event-Carried State Transfer avoid?', options: ['Message ordering issues', 'Synchronous queries back to the source service', 'Schema evolution', 'Large payload problems'], answer: 1, explanation: 'By including all necessary data in the event, consumers do not need to call back to the originating service synchronously.' },
    { q: 'How do Competing Consumers scale throughput?', options: ['By increasing partition count', 'By adding multiple workers to the same queue', 'By using a fanout exchange', 'By compressing messages'], answer: 1, explanation: 'Multiple workers consume from the same queue; each message is processed by exactly one worker, distributing the load.' },
    { q: 'What is the competing consumers pattern?', options: ['Multiple producers sending to the same queue', 'Multiple consumers on the same queue, each processing different messages for parallel throughput', 'Consumers that check each other for duplicates', 'A pattern for fan-out delivery'], answer: 1, explanation: 'Competing consumers: multiple consumers read from the same queue; each message is processed by exactly one consumer. Enables parallel processing and horizontal scaling — add more consumers to increase throughput.' },
    { q: 'What is the claim-check pattern in messaging?', options: ['A consumer acknowledging a message', 'Storing large payloads in blob storage and passing only a reference (claim check) in the message', 'Verifying message integrity with a hash', 'A pattern for ordering messages'], answer: 1, explanation: 'Large messages are stored in external storage (S3, Azure Blob) and the message contains only a reference. Consumers fetch the payload using the reference. Keeps message size small, avoids broker size limits.' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'What is the difference between Event Notification and Event-Carried State Transfer?', a: 'Event Notification tells subscribers something happened (e.g., "order placed: order-id-123") — subscribers must query back for details. Event-Carried State Transfer includes all needed data in the event — no callback query required.' },
    { q: 'When should I use a Message Filter vs a Content-Based Router?', a: 'Use a Content-Based Router at the producer/broker level to route messages to the right queue. Use a Message Filter at the consumer level when you receive from a shared topic and only want to process a subset of messages.' },
    { q: 'What is the Aggregator pattern and when is it needed?', a: 'The Aggregator collects related messages (same correlation ID) and combines them into a single result. Use it after a Scatter step or when a business process involves multiple partial events that must be combined (e.g., line items for an order).' },
    { q: 'What is the scatter-gather messaging pattern?', a: 'Scatter-Gather: a requester fans out one message to multiple recipients, collects partial responses, and aggregates them into a final response. Useful for price comparison (query multiple suppliers), search federation, or parallel computation. Requires: a correlation ID to match responses, an aggregator that knows how many responses to wait for, and a timeout for partial results.' },
    { q: 'How does the request-reply pattern work in messaging systems?', a: 'Request-reply over messaging: (1) Sender publishes to a request queue with a <strong>correlationId</strong> and a <strong>replyTo</strong> queue address; (2) Processor reads request, processes, publishes response to the replyTo queue with matching correlationId; (3) Sender reads from its private reply queue, matches by correlationId. Use temporary/exclusive queues for replyTo. Adds async RPC over the message bus.' },
    { q: 'What is the message filter pattern?', a: 'A message filter discards messages that do not meet criteria, allowing only relevant messages through to the next step. Implemented as a consumer that reads all messages but only forwards matching ones. In Kafka: use Kafka Streams filter() operator. In RabbitMQ: routing keys or header exchanges. In SNS/EventBridge: subscription filter policies. Reduces downstream processing load.' },
  ];

  readonly revision: RevisionSummary = {
    oneLiner: 'Enterprise messaging patterns: route by content, claim-check large data, scatter-gather parallel work, aggregate correlated messages.',
    mustKnow: [
      'Pub/Sub: decouple via topics; Event-Driven: react to events instead of sync calls',
      'Event-Carried State Transfer: embed required data in events; avoid callback queries',
      'Content-Based Router: inspect message, route to different queue by content',
      'Claim Check: large payloads in object store; message carries only the reference',
      'Scatter-Gather: fan-out to N workers, aggregate with timeout for resilience',
      'Aggregator: collect correlated messages by correlationId, emit combined result',
    ],
    interviewFocus: [
      'Event Notification vs Event-Carried State Transfer: coupling implications',
      'Claim Check: why brokers have size limits and how to work around them',
      'Scatter-Gather: timeout handling and partial result strategies',
      'Competing Consumers: how adding workers scales throughput linearly',
    ],
  };
}
