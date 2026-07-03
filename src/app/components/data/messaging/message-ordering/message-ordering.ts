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
  selector: 'app-message-ordering',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './message-ordering.html',
  styleUrl: './message-ordering.scss'
})
export class MessageOrdering {
  readonly quickRef: QuickRefItem[] = [
    { name: 'Partition key', type: 'keyword', desc: 'Kafka: same key → same partition → ordering guaranteed per key' },
    { name: 'Causal ordering', type: 'keyword', desc: 'Events that causally relate must be ordered; unrelated events may not be' },
    { name: 'Sequence number', type: 'keyword', desc: 'Monotonically increasing integer in event payload for ordering checks' },
    { name: 'SQS FIFO', type: 'keyword', desc: 'Strict FIFO ordering within a MessageGroupId' },
    { name: 'RabbitMQ session', type: 'keyword', desc: 'Single-channel, single-consumer setup for ordered queue processing' },
    { name: 'Vector clock', type: 'keyword', desc: 'Causality tracking mechanism for distributed systems' },
    { name: 'Reordering buffer', type: 'keyword', desc: 'Consumer holds out-of-order messages until gap is filled' },
    { name: 'Total order', type: 'keyword', desc: 'All consumers see events in the same global sequence (rare, expensive)' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'Where Ordering is Guaranteed',
      points: [
        'Kafka: ordering guaranteed within a partition. Messages with the same key land on the same partition — use entity ID as key for per-entity ordering.',
        'SQS FIFO: ordering guaranteed within a MessageGroupId. Standard queues provide best-effort ordering only.',
        'RabbitMQ: a single consumer on a single-channel queue processes messages in FIFO order. Multiple consumers break ordering.',
        'Total global ordering across all partitions or queues is rarely achievable and extremely expensive at scale.',
      ]
    },
    {
      heading: 'Partial Ordering: The Practical Standard',
      points: [
        'Most systems need per-entity ordering, not global ordering: all events for order-123 arrive in sequence, regardless of other orders.',
        'Kafka achieves per-entity ordering via partition keys. Route all events for the same entity to the same partition.',
        'SQS FIFO achieves per-entity ordering via MessageGroupId. Each entity is its own group.',
        'Causal ordering: event B depends on event A — only A and B must be ordered relative to each other, not the entire stream.',
      ]
    },
    {
      heading: 'Handling Out-of-Order Arrival',
      points: [
        'In practice, messages can arrive out of order due to network jitter, retry delays, or multiple producer threads.',
        'Include a sequence number or timestamp in the event payload. Consumers detect gaps and apply reordering logic.',
        'Reordering buffer: hold out-of-order events in memory until the expected sequence arrives, then process in order.',
        'For delayed or missing events, apply a grace period (e.g., 5 seconds) before processing with incomplete ordering.',
      ]
    },
    {
      heading: 'Total Order vs. Partial Order Guarantees',
      points: [
        'Total ordering (a single global sequence across all messages) is expensive to guarantee at scale, since it requires funneling all messages through a single ordered channel, eliminating the parallelism that makes distributed messaging systems scale.',
        'Partial ordering (messages ordered only within a partition, shard, or key) is the practical compromise most systems (Kafka partitions, SQS FIFO message groups) adopt — strict order is preserved only for messages that are causally or logically related.',
        'Choosing the right partition/ordering key is the critical design decision — partitioning by entity ID (like customer ID or order ID) preserves ordering for events that matter to be ordered relative to each other, while allowing full parallelism across different entities.',
        'A system that claims global ordering but is actually only partition-ordered can produce subtle bugs if consumers assume stronger guarantees than the system actually provides — the ordering scope must be clearly understood and documented, not assumed.',
      ],
    },
    {
      heading: 'Reordering Risks During Retries and Rebalancing',
      points: [
        'Producer-side retries (a failed send being automatically retried) can reorder messages relative to a subsequent successful send if retries are not carefully sequenced — max.in.flight.requests.per.connection=1 (at some throughput cost) prevents this specific reordering in Kafka.',
        'Consumer group rebalancing (partitions reassigned to different consumer instances) does not itself reorder messages within a partition, but can cause a brief processing pause and requires careful offset-commit handling to avoid reprocessing or skipping messages around the rebalance boundary.',
        'Out-of-order delivery from a queue with multiple concurrent consumers (even within a single logical stream) is expected behavior for most queue systems unless a specific ordering mechanism (FIFO queues, single-partition consumption) is explicitly used.',
        'Applications requiring strict ordering must design specifically for it (single consumer per ordering key, idempotent and order-tolerant processing where full ordering cannot be guaranteed) rather than assuming a messaging system provides ordering it does not actually guarantee.',
      ],
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'Kafka Per-Entity Ordering',
      language: 'typescript',
      code: `import { Kafka } from 'kafkajs';

const kafka    = new Kafka({ brokers: ['localhost:9092'] });
const producer = kafka.producer({ idempotent: true });
await producer.connect();

// Per-entity ordering: all events for the same orderId → same partition
async function publishOrderEvent(orderId: string, event: object) {
  await producer.send({
    topic:    'order-events',
    messages: [{ key: orderId, value: JSON.stringify(event) }], // key = orderId
    acks: -1,
  });
}

// These 3 events are guaranteed to be in order within their partition
await publishOrderEvent('ORD-001', { type: 'created',   total: 99 });
await publishOrderEvent('ORD-001', { type: 'paid',       total: 99 });
await publishOrderEvent('ORD-001', { type: 'shipped',    total: 99 });

// ORD-002 events land on a different partition (or same, doesn't matter)
// — ordering between ORD-001 and ORD-002 events is NOT guaranteed

const consumer = kafka.consumer({ groupId: 'order-processor' });
await consumer.connect();
await consumer.subscribe({ topic: 'order-events' });

await consumer.run({
  eachMessage: async ({ message }) => {
    const event = JSON.parse(message.value!.toString());
    // All events for the same orderId arrive in publish order
    console.log(\`[\${message.key?.toString()}] \${event.type}\`);
  },
});`,
    },
    {
      label: 'Sequence Number Check',
      language: 'typescript',
      code: `// Consumer-side sequence number validation and reordering buffer

const expectedSeq = new Map<string, number>(); // entityId → next expected seq
const buffer       = new Map<string, Map<number, unknown>>(); // entityId → seq→event

async function handleEvent(entityId: string, seq: number, event: unknown) {
  const expected = expectedSeq.get(entityId) ?? 0;

  if (seq < expected) {
    console.log(\`Duplicate seq \${seq} for \${entityId} (expected \${expected}), skipping\`);
    return;
  }

  if (seq > expected) {
    // Buffer out-of-order event
    const buf = buffer.get(entityId) ?? new Map();
    buf.set(seq, event);
    buffer.set(entityId, buf);
    console.log(\`Buffering out-of-order seq \${seq} for \${entityId}\`);
    return;
  }

  // Process this event
  await processEvent(entityId, seq, event);
  expectedSeq.set(entityId, seq + 1);

  // Drain any buffered events now in order
  const buf = buffer.get(entityId);
  if (buf) {
    let next = seq + 1;
    while (buf.has(next)) {
      await processEvent(entityId, next, buf.get(next)!);
      buf.delete(next);
      expectedSeq.set(entityId, ++next);
    }
  }
}

async function processEvent(entityId: string, seq: number, event: unknown) {
  console.log(\`Processing \${entityId} seq=\${seq}:\`, event);
}`,
    },
    {
      label: 'SQS FIFO Ordering',
      language: 'typescript',
      code: `import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { randomUUID } from 'crypto';

const sqs      = new SQSClient({ region: 'us-east-1' });
const FIFO_URL = process.env.SQS_FIFO_URL!;  // must end in .fifo

// Publish 3 events for the same order — guaranteed FIFO per MessageGroupId
async function publishOrderEvents(orderId: string) {
  const events = ['created', 'paid', 'shipped'];

  for (const eventType of events) {
    await sqs.send(new SendMessageCommand({
      QueueUrl:               FIFO_URL,
      MessageBody:            JSON.stringify({ orderId, eventType }),
      MessageGroupId:         orderId,         // FIFO within this group
      MessageDeduplicationId: randomUUID(),    // prevent broker duplicates
    }));
    console.log(\`Sent: \${orderId} → \${eventType}\`);
  }
}

// Consumer receives in order: created → paid → shipped for ORD-001
async function consume() {
  const response = await sqs.send(new ReceiveMessageCommand({
    QueueUrl:            FIFO_URL,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds:     20,
  }));

  for (const msg of response.Messages ?? []) {
    const { orderId, eventType } = JSON.parse(msg.Body!);
    console.log(\`Received: \${orderId} → \${eventType}\`);
    await sqs.send(new DeleteMessageCommand({
      QueueUrl: FIFO_URL, ReceiptHandle: msg.ReceiptHandle!,
    }));
  }
}

await publishOrderEvents('ORD-001');
await consume();`,
    },
  ];

  readonly mistakes: CommonMistake[] = [
    {
      title: 'Using different partition keys for the same entity',
      wrong: `// Inconsistent keys — same order lands on different partitions
await producer.send({ topic: 'orders',
  messages: [{ key: order.id,       value: JSON.stringify({ type: 'created' }) }] });
await producer.send({ topic: 'orders',
  messages: [{ key: order.customerId, value: JSON.stringify({ type: 'paid' }) }] });
// created and paid events land on different partitions — no ordering`,
      right: `// Always use the same key for all events of the same entity
const key = order.id;  // consistent entity key
await producer.send({ topic: 'orders', messages: [{ key, value: JSON.stringify({ type: 'created' }) }] });
await producer.send({ topic: 'orders', messages: [{ key, value: JSON.stringify({ type: 'paid' }) }] });`,
      explanation: 'Kafka assigns partitions by hashing the key. Mixing keys for the same entity (orderId vs customerId) routes events to different partitions, destroying per-entity ordering.'
    },
    {
      title: 'Adding consumers beyond partition count for ordered processing',
      wrong: `// 4 partitions, 6 consumers in the same group
// 2 consumers are idle; but during rebalance, ordering may be disrupted`,
      right: `// Max active consumers = partition count
// For ordered processing, set consumer count = partition count`,
      explanation: 'With more consumers than partitions, some consumers are idle. More importantly, rebalances can temporarily reassign partitions mid-processing, causing apparent out-of-order delivery.'
    },
    {
      title: 'Expecting global ordering across all Kafka partitions',
      wrong: `// Assuming all events across all partitions are globally ordered
// ORD-001 events and ORD-002 events may interleave in any order`,
      right: `// Kafka only guarantees ordering per partition
// Route all events for the same entity to the same partition via a consistent key`,
      explanation: 'Kafka guarantees ordering within a partition, not globally. For global ordering, you would need a single-partition topic — which eliminates parallelism. Design for per-entity (partial) ordering instead.'
    },
    {
      title: 'Ignoring sequence gaps in reordering buffers (processing incomplete state)',
      wrong: `// Processing out-of-order events immediately without buffering
consumer.run({ eachMessage: async ({ message }) => {
  const event = JSON.parse(message.value!.toString());
  await applyEvent(event); // may process seq=3 before seq=2
}});`,
      right: `// Buffer and wait for sequence to be contiguous
consumer.run({ eachMessage: async ({ message }) => {
  const event = JSON.parse(message.value!.toString());
  await handleEvent(event.entityId, event.seq, event);
  // handleEvent buffers out-of-order and processes when gap is filled
}});`,
      explanation: 'Processing event seq=3 before seq=2 can produce corrupt state. Buffer out-of-order events and only process when the expected sequence is contiguous.'
    },
  ];

  readonly challenge: Challenge = {
    title: 'Per-Entity Event Sorter',
    language: 'typescript',
    description: 'Build a consumer that receives shuffled order events from a Kafka topic. Each message has orderId, seq (sequence number 0-based), and type. Buffer events per orderId and process them in seq order. Once all events for an orderId are received in order, log the ordered sequence.',
    hints: [
      'Use Map<orderId, Map<seq, event>> as the buffer',
      'After each receive, try to drain the buffer for that orderId starting from nextExpectedSeq',
      'A simple test: publish events with seq 2, 0, 1 for the same orderId; expect 0, 1, 2 processing order',
    ],
    starterCode: `const buffer      = new Map<string, Map<number, unknown>>();
const nextExpected = new Map<string, number>();

function onEvent(orderId: string, seq: number, event: unknown) {
  // TODO: buffer + drain in order
}`,
    solution: `const buffer      = new Map<string, Map<number, unknown>>();
const nextExpected = new Map<string, number>();

function onEvent(orderId: string, seq: number, event: unknown) {
  // Buffer the incoming event
  const buf = buffer.get(orderId) ?? new Map<number, unknown>();
  buf.set(seq, event);
  buffer.set(orderId, buf);

  // Drain in order
  let next = nextExpected.get(orderId) ?? 0;
  while (buf.has(next)) {
    console.log(\`[\${orderId}] seq=\${next}:\`, buf.get(next));
    buf.delete(next);
    next++;
  }
  nextExpected.set(orderId, next);
}

// Test: publish out of order
onEvent('ORD-001', 2, { type: 'shipped' });  // buffered (gap at 0,1)
onEvent('ORD-001', 0, { type: 'created' });  // 0 processed, gap at 1
onEvent('ORD-001', 1, { type: 'paid'    });  // 1 + 2 drained → 0,1,2 in order
// Expected output: seq=0: created, seq=1: paid, seq=2: shipped`,
  };

  readonly quiz: QuizQuestion[] = [
    { q: 'How does Kafka guarantee ordering for events from the same entity?', options: ['By timestamp', 'Using the same partition key so all events land on the same partition', 'Via global sequence numbers', 'Using consumer group rebalancing'], answer: 1, explanation: 'Kafka routes messages with the same key to the same partition. Within a partition, order is preserved. Use the entity ID as the key.' },
    { q: 'What happens to Kafka ordering if more consumers than partitions join a group?', options: ['Extra consumers process in parallel', 'Extra consumers receive all messages', 'Extra consumers are idle; active consumer count = partition count', 'Ordering is improved'], answer: 2, explanation: 'Kafka assigns at most one consumer per partition per group. Extra consumers beyond partition count are idle and do no work.' },
    { q: 'SQS FIFO ordering is guaranteed within what scope?', options: ['The entire queue', 'A MessageGroupId', 'A single consumer', 'A 5-minute window'], answer: 1, explanation: 'FIFO ordering in SQS is per MessageGroupId. All messages in the same group are processed in FIFO order; groups are independent.' },
    { q: 'What is a reordering buffer used for in message consumers?', options: ['Compressing messages', 'Holding out-of-order events until the expected sequence is received', 'Batching acks', 'Filtering duplicates'], answer: 1, explanation: 'A reordering buffer holds events that arrived before their predecessors. Once the gap is filled, the buffer drains in order.' },
    { q: 'Which Kafka setting ensures messages with the same key always go to the same partition?', options: ['replication.factor', 'Key-based partitioning (default partitioner)', 'acks=all', 'max.in.flight.requests.per.connection=1'], answer: 1, explanation: 'The default Kafka partitioner uses murmur2 hash of the message key to deterministically assign to a partition — all messages with the same key land on the same partition, preserving order.' },
    { q: 'What happens to ordering in an SQS FIFO queue if a consumer fails to delete a message and it becomes visible again for redelivery?', options: ['Ordering is immediately broken for that group', 'SQS FIFO blocks delivery of subsequent messages in the SAME MessageGroupId until the failed message is deleted or its visibility timeout is handled, preserving order', 'The message is silently dropped', 'The message jumps to a different group to avoid blocking'], answer: 1, explanation: 'FIFO queues enforce strict per-group ordering even across redelivery: while a message from a given MessageGroupId is "in flight" (received but not yet deleted), SQS will not deliver the NEXT message from that same group to any consumer — this guarantees a consumer can never get message 2 before message 1 is confirmed handled, but also means a stuck/slow consumer for one group can stall that group\'s throughput (other groups continue processing independently).' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'Is global ordering across all Kafka partitions possible?', a: 'Yes, but only with a single-partition topic — which eliminates parallelism. In practice, design for per-entity (partial) ordering using a consistent partition key. True global ordering in distributed systems is expensive and rarely necessary.' },
    { q: 'What causes out-of-order delivery even with correct partition keys?', a: 'Multiple producer threads may publish without coordination, causing seq gaps. Network retries may reorder in-flight messages. Consumer rebalances may replay some messages. Always include a sequence number in the payload and implement consumer-side buffering for critical flows.' },
    { q: 'How do I handle ordering across multiple Kafka topics?', a: 'Cross-topic ordering is not provided by Kafka. Patterns: (1) merge into a single topic; (2) use a sequence number in each event and implement consumer-side ordering logic; (3) use Kafka Streams joins with time windows to correlate events from multiple topics in order.' },
    { q: 'How does Kafka handle out-of-order messages across partitions?', a: 'Kafka only guarantees order within a single partition. For cross-partition ordering, options are: (1) Use a single partition (sacrifices parallelism); (2) Use event timestamps and watermarks in Kafka Streams for time-based ordering; (3) Use the Outbox pattern to guarantee commit order before publishing. Design around partition-local ordering where possible.' },
    { q: 'What is max.in.flight.requests.per.connection and why does it affect ordering?', a: 'With the default value (5), a producer can have 5 in-flight requests before blocking. If one batch fails and retries while later batches succeed, messages can arrive out of order. Fix: set <code>max.in.flight.requests.per.connection=1</code> (strict order) or enable <code>enable.idempotence=true</code> (idempotent producer handles reordering up to 5 in-flight safely).' },
    { q: 'How does RabbitMQ handle message ordering?', a: 'Standard RabbitMQ queues deliver messages in publish order to a single consumer. With multiple consumers (competing consumers), order is NOT guaranteed — different consumers process at different speeds. For strict ordering: use a single consumer, or use RabbitMQ streams with consumer groups (similar to Kafka partitions). Classic queues with priority queues can invert natural order.' },
  ];

  readonly revision: RevisionSummary = {
    oneLiner: 'Ordering in Kafka = per-partition via message key; SQS = per-group via MessageGroupId; buffer out-of-order with sequence numbers.',
    mustKnow: [
      'Kafka: ordering within a partition only; use same entity key for all entity events',
      'Global ordering across partitions requires single-partition topic (kills parallelism)',
      'SQS FIFO: FIFO per MessageGroupId; standard queue = best-effort ordering only',
      'More consumers than partitions → idle consumers, no ordering benefit',
      'Include sequence numbers in event payload; implement reordering buffer for gap handling',
      'Consistent partition key: always use the same field for the same entity across all event types',
    ],
    interviewFocus: [
      'Kafka ordering guarantees: within partition, not global',
      'Partition key selection: why consistency across event types matters',
      'Consumer group + partition count: max active consumers = partition count',
      'Handling out-of-order arrival: sequence numbers and reordering buffers',
    ],
  };
}
