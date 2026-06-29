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
  selector: 'app-message-queues-vs-streams',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './message-queues-vs-streams.html',
  styleUrl: './message-queues-vs-streams.scss'
})
export class MessageQueuesVsStreams {
  readonly quickRef: QuickRefItem[] = [
    { name: 'Message Queue', type: 'keyword', desc: 'Point-to-point; each message consumed once by one consumer' },
    { name: 'Event Stream', type: 'keyword', desc: 'Log of ordered events; multiple consumers can replay independently' },
    { name: 'AMQP', type: 'syntax', desc: 'Protocol used by RabbitMQ; exchange-routing model' },
    { name: 'Kafka Topic', type: 'keyword', desc: 'Append-only partitioned log; retained for configurable period' },
    { name: 'Consumer Group', type: 'keyword', desc: 'Set of consumers sharing load over a topic partition set' },
    { name: 'Retention', type: 'keyword', desc: 'How long Kafka keeps messages regardless of consumption' },
    { name: 'Dead Letter Queue', type: 'keyword', desc: 'Queue for messages that fail repeated delivery attempts' },
    { name: 'Competing Consumers', type: 'syntax', desc: 'Multiple queue consumers racing to process messages' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'Message Queues: Work Distribution',
      points: [
        'A message queue holds messages until a consumer picks them up. Once consumed, the message is gone.',
        'Best for task distribution: send an email, resize an image, process a payment — each job done exactly by one worker.',
        'Broker tracks acknowledgements; unacknowledged messages are redelivered after a timeout.',
        'RabbitMQ, AWS SQS, and Azure Service Bus are classic queue systems.',
      ]
    },
    {
      heading: 'Event Streams: Ordered Replay Log',
      points: [
        'An event stream is an immutable, time-ordered log. Consumers track their own offset and can re-read history.',
        'Multiple independent consumers (analytics, audit, ML) each see every event — no competition for messages.',
        'Kafka, AWS Kinesis, and Azure Event Hubs are streaming platforms.',
        'Retention policy, not consumption, determines when data is deleted.',
      ]
    },
    {
      heading: 'When to Choose Which',
      points: [
        'Use a queue when you need guaranteed single-processing of a task (order fulfilment, payment processing).',
        'Use a stream when multiple systems need the same events or you need time-travel / replay.',
        'Queues are simpler; streams add operational complexity but enable event sourcing and CQRS patterns.',
        'Hybrid: use Kafka for the event backbone, project into per-service queues for task workers.',
      ]
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'Queue Pattern (RabbitMQ)',
      language: 'typescript',
      code: `import amqplib from 'amqplib';

async function sendTask(payload: object) {
  const conn = await amqplib.connect('amqp://localhost');
  const ch   = await conn.createChannel();
  const q    = 'task_queue';
  await ch.assertQueue(q, { durable: true });
  ch.sendToQueue(q, Buffer.from(JSON.stringify(payload)),
    { persistent: true });          // survive broker restart
  console.log('Task queued:', payload);
  await ch.close(); await conn.close();
}

async function worker() {
  const conn = await amqplib.connect('amqp://localhost');
  const ch   = await conn.createChannel();
  await ch.assertQueue('task_queue', { durable: true });
  ch.prefetch(1);                   // one message at a time
  ch.consume('task_queue', async (msg) => {
    if (!msg) return;
    const task = JSON.parse(msg.content.toString());
    await processTask(task);        // do the work
    ch.ack(msg);                    // remove from queue
  });
}`,
    },
    {
      label: 'Stream Pattern (Kafka)',
      language: 'typescript',
      code: `import { Kafka } from 'kafkajs';

const kafka = new Kafka({ brokers: ['localhost:9092'] });

// Producer — publish event once
async function publishEvent(event: object) {
  const producer = kafka.producer();
  await producer.connect();
  await producer.send({
    topic: 'order-events',
    messages: [{ value: JSON.stringify(event) }],
  });
  await producer.disconnect();
}

// Consumer A — analytics (reads all events, own offset)
async function analyticsConsumer() {
  const consumer = kafka.consumer({ groupId: 'analytics' });
  await consumer.connect();
  await consumer.subscribe({ topic: 'order-events', fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value!.toString());
      await recordMetric(event);
    },
  });
}

// Consumer B — fulfilment (different group, same events)
async function fulfilmentConsumer() {
  const consumer = kafka.consumer({ groupId: 'fulfilment' });
  await consumer.connect();
  await consumer.subscribe({ topic: 'order-events' });
  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value!.toString());
      await fulfillOrder(event);
    },
  });
}`,
    },
  ];

  readonly mistakes: CommonMistake[] = [
    {
      title: 'Using a queue when multiple consumers need the same event',
      wrong: `// Only ONE consumer gets this message
channel.sendToQueue('order-placed', msg);
// analytics team never sees it`,
      right: `// Publish to a topic — all subscribers receive it
await producer.send({ topic: 'order-placed', messages: [msg] });`,
      explanation: 'Queues compete; streams broadcast. If multiple systems need the same event, use a stream or fan-out exchange.'
    },
    {
      title: 'Forgetting acknowledgements in queue consumers',
      wrong: `ch.consume('tasks', (msg) => {
  processTask(msg);
  // never acks — message redelivered forever
});`,
      right: `ch.consume('tasks', async (msg) => {
  if (!msg) return;
  await processTask(msg);
  ch.ack(msg);   // only ack after successful processing
});`,
      explanation: 'Without ack, the broker re-queues the message after consumer timeout, causing duplicate processing.'
    },
    {
      title: 'Treating Kafka consumer offset as automatic',
      wrong: `// Assuming fromBeginning is always respected
await consumer.subscribe({ topic: 'events' });
// offset is already committed — won't replay`,
      right: `// Reset offset or use a new consumer group to replay
await consumer.subscribe({ topic: 'events', fromBeginning: true });
// AND use a fresh groupId never seen before`,
      explanation: 'Kafka tracks offset per consumer group. A new subscription with fromBeginning only works if the groupId has no committed offset.'
    },
    {
      title: 'Ignoring message ordering guarantees',
      wrong: `// Sending related messages with random partition keys
await producer.send({ topic: 'payments',
  messages: [{ value: JSON.stringify(payment) }] }); // no key`,
      right: `// Use account ID as key — same account → same partition → ordered
await producer.send({ topic: 'payments',
  messages: [{ key: payment.accountId, value: JSON.stringify(payment) }] });`,
      explanation: 'Kafka guarantees order within a partition. Without a key, messages may land on different partitions and arrive out of order.'
    },
    {
      title: 'Confusing stream retention with queue deletion',
      wrong: `// Expecting Kafka to delete messages after consumption
const consumer = kafka.consumer({ groupId: 'g1' });
// Message still there for groupId g2 to read`,
      right: `// Kafka deletes based on retention.ms or size, not consumption
// Configure: retention.ms=604800000 (7 days)
// Each consumer group tracks its own offset independently`,
      explanation: 'Unlike queues, Kafka messages persist until the retention period expires, regardless of how many consumers have read them.'
    },
  ];

  readonly challenge: Challenge = {
    title: 'Fan-out vs. Point-to-Point Router',
    language: 'typescript',
    description: 'Design a router: if eventType is "user.registered" it should fan out to both an analytics handler and a welcome-email handler. If eventType is "order.created" it should only go to the fulfilment handler (point-to-point). Show both approaches in a single TypeScript file.',
    hints: [
      'A topic per event type + multiple consumer groups handles fan-out naturally in Kafka',
      'A fanout exchange in RabbitMQ delivers to all bound queues',
      'For point-to-point, use a direct exchange or dedicated queue',
    ],
    starterCode: `interface Event { type: string; payload: unknown; }

function routeEvent(event: Event): void {
  // TODO: fan-out 'user.registered', point-to-point 'order.created'
}`,
    solution: `interface Event { type: string; payload: unknown; }

const handlers: Record<string, Array<(e: Event) => void>> = {
  'user.registered': [analyticsHandler, welcomeEmailHandler],
  'order.created':   [fulfilmentHandler],
};

function routeEvent(event: Event): void {
  const subs = handlers[event.type] ?? [];
  for (const handler of subs) handler(event);
}

function analyticsHandler(e: Event)    { console.log('analytics:', e); }
function welcomeEmailHandler(e: Event) { console.log('email:', e); }
function fulfilmentHandler(e: Event)   { console.log('fulfil:', e); }`,
  };

  readonly quiz: QuizQuestion[] = [
    { q: 'Which system allows multiple independent consumers to re-read all events?', options: ['RabbitMQ queue', 'AWS SQS', 'Kafka topic', 'Azure Service Bus queue'], answer: 2, explanation: 'Kafka stores events as a log; each consumer group tracks its own offset and can replay.' },
    { q: 'What happens to a RabbitMQ message after it is acknowledged?', options: ['Retained for 7 days', 'Moved to DLQ', 'Deleted from the queue', 'Replicated to another node'], answer: 2, explanation: 'Once acked, the broker removes the message from the queue.' },
    { q: 'Which Kafka feature enables ordered processing of messages from the same entity?', options: ['Consumer group', 'Partition key', 'Retention policy', 'Replication factor'], answer: 1, explanation: 'Messages with the same key land on the same partition, preserving order.' },
    { q: 'When should you prefer a message queue over an event stream?', options: ['Analytics fan-out', 'Audit logging', 'Single-worker task processing', 'Event replay'], answer: 2, explanation: 'Queues are ideal when exactly one consumer should process each task (work queues).' },
    { q: 'What is the key difference between a message queue and an event stream?', options: ['Message queues are slower', 'Queues deliver messages once then discard; streams retain messages for replay by multiple consumers', 'Streams only support one consumer', 'They are functionally identical'], answer: 1, explanation: 'Message queues: consumed and removed — task distribution model. Event streams: messages persisted and replayable — multiple independent consumer groups read at their own offset.' },
    { q: 'Which system supports replaying historical events from an arbitrary point?', options: ['RabbitMQ', 'SQS Standard', 'Kafka (by resetting consumer offsets)', 'SNS'], answer: 2, explanation: 'Kafka retains messages for a configurable retention period. Consumers can reset offsets (--to-earliest, --to-datetime, --to-offset) to replay historical events — critical for rebuilding state or onboarding new consumers.' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'Can I use both queues and streams in the same system?', a: 'Yes — this is common. Kafka acts as the event backbone; downstream services project events into SQS/RabbitMQ queues for task workers that need exactly-once processing semantics.' },
    { q: 'How does Kafka differ from RabbitMQ in terms of push vs pull?', a: 'Kafka is pull-based: consumers poll at their own pace. RabbitMQ pushes messages to consumers via a channel, which is why prefetch and ack management are important to avoid overwhelming slow consumers.' },
    { q: 'What is a dead-letter queue (DLQ) and when is it needed?', a: 'A DLQ receives messages that failed delivery after a configured number of retries. It prevents poison messages from blocking healthy queue processing and provides a place to inspect and replay failed events.' },
    { q: 'When should you choose a message queue over an event stream?', a: 'Choose a <strong>message queue</strong> (RabbitMQ, SQS) when: (1) each task must be processed by exactly one consumer (work queue); (2) you want messages deleted after consumption (no replay needed); (3) you need priority queuing or complex routing (RabbitMQ exchanges); (4) delivery semantics (acknowledgment, dead-lettering) are more important than throughput.' },
    { q: 'How do consumer groups differ between Kafka and RabbitMQ?', a: 'In <strong>Kafka</strong>, consumer groups partition messages — each partition assigned to one consumer in the group; different groups read all messages independently. In <strong>RabbitMQ</strong>, multiple consumers on the same queue compete for messages (round-robin) — there is no concept of independent groups reading the same messages. Add a new consumer group in Kafka = zero overhead on producers.' },
    { q: 'What is log retention in Kafka and how does it differ from queue TTL?', a: 'Kafka log retention is time-based (<code>retention.ms</code>) or size-based (<code>retention.bytes</code>) — messages are deleted after the retention period regardless of consumption. Queue TTL (SQS, RabbitMQ) expires individual unprocessed messages. Kafka retention enables replay; queue TTL prevents unbounded growth of unconsumed messages.' },
  ];

  readonly revision: RevisionSummary = {
    oneLiner: 'Queues distribute work; streams broadcast ordered events for replay by many consumers.',
    mustKnow: [
      'Message queue: one consumer processes each message, then it\'s gone',
      'Event stream: immutable log, multiple independent consumer groups, offset-tracked',
      'Use queues for task workers (email send, payment); streams for audit, analytics, event sourcing',
      'Kafka ordering: guaranteed within a partition, use key routing for per-entity order',
      'Dead-letter queues catch poison messages that fail repeated delivery',
      'Retention (Kafka) vs deletion on ack (queues) is a fundamental difference',
    ],
    interviewFocus: [
      'Queue vs stream: push-pop vs append-log with offset tracking',
      'Fan-out patterns: fanout exchange (AMQP) vs multiple consumer groups (Kafka)',
      'Offset management: how Kafka enables replay and independent consumption',
      'Poison message handling: DLQ, max retries, nack with requeue=false',
    ],
  };
}
