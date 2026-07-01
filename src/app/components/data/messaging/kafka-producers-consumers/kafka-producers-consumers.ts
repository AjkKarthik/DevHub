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
  selector: 'app-kafka-producers-consumers',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './kafka-producers-consumers.html',
  styleUrl: './kafka-producers-consumers.scss'
})
export class KafkaProducersConsumers {
  readonly quickRef: QuickRefItem[] = [
    { name: 'acks', type: 'keyword', desc: '0=fire-forget, 1=leader-only, -1=all ISR; controls durability vs latency' },
    { name: 'idempotent producer', type: 'keyword', desc: 'Prevents duplicate records on producer retry (enable with idempotent:true)' },
    { name: 'batch.size', type: 'keyword', desc: 'Max bytes to buffer per partition before sending' },
    { name: 'linger.ms', type: 'keyword', desc: 'Wait time to accumulate a batch before sending' },
    { name: 'eachMessage', type: 'method', desc: 'Process one message at a time; sequential within partition' },
    { name: 'eachBatch', type: 'method', desc: 'Process a batch of messages; higher throughput, manual offset commits' },
    { name: 'autoCommit', type: 'keyword', desc: 'Automatically commit offsets after eachMessage resolves (default: true)' },
    { name: 'seekToBeginning', type: 'method', desc: 'Reset a consumer to replay from offset 0' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'Producer Configuration and Batching',
      points: [
        'Producers buffer messages locally per partition and send in batches for efficiency.',
        'linger.ms adds a deliberate wait to accumulate more records into a batch, increasing throughput at the cost of latency.',
        'batch.size sets the max bytes per batch. Together with linger.ms, they control the throughput-latency tradeoff.',
        'Compression (GZIP, Snappy, LZ4) reduces network and disk usage at the cost of CPU. LZ4 is a good default.',
      ]
    },
    {
      heading: 'Consumer Modes: eachMessage vs eachBatch',
      points: [
        'eachMessage: Kafka commits the offset after each successful call. Simple but slower for high-throughput workloads.',
        'eachBatch: receives a batch object; you call resolveOffset() and heartbeat() manually. Allows micro-batching.',
        'autoCommit (default true with eachMessage) commits after each message resolves — safe for most use cases.',
        'Manual commits with eachBatch give fine-grained control: commit only after all records in the batch are processed.',
      ]
    },
    {
      heading: 'Offset Management and Replay',
      points: [
        'Offsets are stored in the __consumer_offsets topic. On restart, the consumer resumes from the last committed offset.',
        'fromBeginning:true + a fresh groupId replays all events from the start of retention.',
        'consumer.seek({ topic, partition, offset }) jumps to a specific offset programmatically.',
        'Committed offset is the next message to process (last processed + 1), not the last processed.',
      ]
    },
    {
      heading: 'Producer Acknowledgment Levels (acks) and Durability Tradeoffs',
      points: [
        'acks=0 sends messages without waiting for any broker acknowledgment — highest throughput, but messages can be silently lost if the broker fails before actually persisting them, making this appropriate only for genuinely loss-tolerant data like metrics.',
        'acks=1 waits for the partition leader to acknowledge the write, but not for follower replicas — a leader failure immediately after acknowledgment but before replication can still lose the message, a middle-ground tradeoff between throughput and durability.',
        'acks=all (or acks=-1) waits for all in-sync replicas to acknowledge, providing the strongest durability guarantee at the cost of higher latency — the correct choice when message loss is unacceptable, such as financial transaction events.',
        'Choosing an acks level should be driven by the actual cost of losing a message for that specific topic\'s use case — defaulting to acks=all everywhere sacrifices throughput unnecessarily for data where loss tolerance is genuinely acceptable.',
      ],
    },
    {
      heading: 'Consumer Offset Management Strategies',
      points: [
        'Auto-commit (enable.auto.commit=true) periodically commits the latest consumed offset automatically — simple to use, but risks committing an offset for a message that was received but not yet fully processed, causing silent data loss if the consumer crashes mid-processing.',
        'Manual commit after successful processing (enable.auto.commit=false, explicit commitSync/commitAsync) guarantees an offset is only committed once its corresponding message has actually been fully processed, trading some code complexity for a stronger processing guarantee.',
        'commitSync blocks until the broker confirms the commit, providing certainty at the cost of latency, while commitAsync does not block but requires a callback to handle commit failures — the choice depends on whether throughput or commit-failure visibility matters more for a given consumer.',
        'Committing too frequently adds broker load and latency overhead, while committing too infrequently increases the amount of reprocessing work required after a consumer restart — batch commit frequency should be tuned to the actual reprocessing cost tolerance of the specific application.',
      ],
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'High-throughput Producer',
      language: 'typescript',
      code: `import { Kafka, CompressionTypes } from 'kafkajs';

const kafka = new Kafka({ clientId: 'producer', brokers: ['localhost:9092'] });

const producer = kafka.producer({
  idempotent: true,       // prevents duplicate records on retry
  maxInFlightRequests: 5, // required with idempotent
  // Batch tuning (via underlying config)
});

await producer.connect();

// Send a batch of messages at once (efficient)
await producer.sendBatch({
  topicMessages: [
    {
      topic: 'user-events',
      messages: [
        { key: 'u1', value: JSON.stringify({ userId: 'u1', event: 'login' }) },
        { key: 'u2', value: JSON.stringify({ userId: 'u2', event: 'purchase' }) },
        { key: 'u1', value: JSON.stringify({ userId: 'u1', event: 'logout' }) },
      ],
    },
  ],
  acks: -1,                          // all ISR
  compression: CompressionTypes.LZ4, // fast compression
});

await producer.disconnect();`,
    },
    {
      label: 'eachMessage Consumer',
      language: 'typescript',
      code: `import { Kafka } from 'kafkajs';

const kafka    = new Kafka({ clientId: 'consumer', brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'user-event-processor' });

await consumer.connect();
await consumer.subscribe({ topic: 'user-events', fromBeginning: false });

await consumer.run({
  autoCommit: true,            // offset committed after each message
  eachMessage: async ({ topic, partition, message }) => {
    const event = JSON.parse(message.value!.toString());
    console.log(\`[P\${partition}] offset \${message.offset}: \${event.event}\`);
    await handleEvent(event);  // must be idempotent
  },
});

async function handleEvent(e: { userId: string; event: string }) {
  console.log('Handling', e.event, 'for user', e.userId);
}`,
    },
    {
      label: 'eachBatch Consumer',
      language: 'typescript',
      code: `import { Kafka, EachBatchPayload } from 'kafkajs';

const kafka    = new Kafka({ clientId: 'batch', brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'batch-processor' });

await consumer.connect();
await consumer.subscribe({ topic: 'user-events' });

await consumer.run({
  autoCommit: false,  // manual offset control
  eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning }: EachBatchPayload) => {
    for (const message of batch.messages) {
      if (!isRunning()) break;  // honour stop signal

      const event = JSON.parse(message.value!.toString());
      await handleEvent(event);

      resolveOffset(message.offset);  // mark this offset as processed
      await heartbeat();              // keep the session alive in long batches
    }
    // Offset committed for all resolveOffset calls when eachBatch resolves
  },
});

async function handleEvent(e: unknown) { /* ... */ }`,
    },
    {
      label: 'Seek / Replay',
      language: 'typescript',
      code: `import { Kafka } from 'kafkajs';

const kafka    = new Kafka({ clientId: 'replay', brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'replay-group' });

await consumer.connect();
await consumer.subscribe({ topic: 'orders', fromBeginning: true });

// Seek to offset 0 on each partition after assignment
consumer.on(consumer.events.GROUP_JOIN, async () => {
  const topic = 'orders';
  const partitions = [0, 1, 2];
  for (const partition of partitions) {
    consumer.seek({ topic, partition, offset: '0' });
  }
});

await consumer.run({
  eachMessage: async ({ partition, message }) => {
    console.log(\`Replaying partition \${partition} offset \${message.offset}\`);
  },
});`,
    },
  ];

  readonly mistakes: CommonMistake[] = [
    {
      title: 'Not awaiting producer.disconnect(), causing lost messages',
      wrong: `await producer.send({ topic: 'events', messages: [{ value: 'data' }] });
process.exit(0); // connection closed before message flushed`,
      right: `await producer.send({ topic: 'events', messages: [{ value: 'data' }] });
await producer.disconnect(); // flush and close gracefully
process.exit(0);`,
      explanation: 'Kafka producers buffer messages. Exiting without disconnect can lose buffered messages not yet sent to the broker.'
    },
    {
      title: 'Using fromBeginning with an existing consumer group offset',
      wrong: `// Group 'my-group' already has committed offsets
// fromBeginning is ignored — consumer resumes from committed offset
await consumer.subscribe({ topic: 'events', fromBeginning: true });`,
      right: `// Use a new groupId to replay from the beginning
const consumer = kafka.consumer({ groupId: 'replay-2024-01-15' });
await consumer.subscribe({ topic: 'events', fromBeginning: true });`,
      explanation: 'fromBeginning only applies when the consumer group has no committed offset. Use a fresh groupId or consumer.seek() to force replay.'
    },
    {
      title: 'Calling heartbeat() too infrequently in eachBatch',
      wrong: `eachBatch: async ({ batch, resolveOffset }) => {
  for (const msg of batch.messages) {
    await verySlowProcessing(msg); // 30s per message
    resolveOffset(msg.offset);     // no heartbeat → session timeout
  }
}`,
      right: `eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
  for (const msg of batch.messages) {
    await verySlowProcessing(msg);
    resolveOffset(msg.offset);
    await heartbeat();  // prevent session.timeout.ms expiry
  }
}`,
      explanation: 'Kafka consumers send heartbeats to signal liveness. If session.timeout.ms elapses without a heartbeat, the broker triggers a rebalance.'
    },
    {
      title: 'Auto-committing before processing completes',
      wrong: `// autoCommit with async work that can fail mid-message
eachMessage: async ({ message }) => {
  // If this throws after autoCommit, the offset is already committed
  await riskyWork(message);
}`,
      right: `// Disable autoCommit and commit only after successful processing
consumer.run({
  autoCommit: false,
  eachMessage: async ({ message, commitOffsets }) => {
    await riskyWork(message);
    // commit manually only on success
  },
});`,
      explanation: 'autoCommit can mark an offset consumed before the work succeeds. For at-least-once processing, commit only after confirmed success.'
    },
  ];

  readonly challenge: Challenge = {
    title: 'Dead Letter Topic Producer',
    language: 'typescript',
    description: 'Build a Kafka consumer that processes messages from "orders". If processing fails (simulate with a random 30% failure rate), publish the failed message to "orders.dlq" with an x-error header containing the error message. Successfully processed messages should log "OK".',
    hints: [
      'Use try/catch around processing logic',
      'producer.send to the DLQ topic on catch',
      'Include original message headers plus x-error in DLQ message',
    ],
    starterCode: `import { Kafka } from 'kafkajs';

async function startConsumer() {
  const kafka    = new Kafka({ brokers: ['localhost:9092'] });
  const consumer = kafka.consumer({ groupId: 'order-processor' });
  const producer = kafka.producer();
  // TODO: consume 'orders', on failure send to 'orders.dlq'
}`,
    solution: `import { Kafka } from 'kafkajs';

async function startConsumer() {
  const kafka    = new Kafka({ brokers: ['localhost:9092'] });
  const consumer = kafka.consumer({ groupId: 'order-processor' });
  const producer = kafka.producer({ idempotent: true });

  await consumer.connect();
  await producer.connect();
  await consumer.subscribe({ topic: 'orders' });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        await processOrder(message);
        console.log('OK offset', message.offset);
      } catch (err: any) {
        await producer.send({
          topic: 'orders.dlq',
          messages: [{
            key:   message.key,
            value: message.value,
            headers: {
              ...message.headers,
              'x-error':          err.message,
              'x-source-topic':   'orders',
              'x-source-offset':  message.offset,
            },
          }],
          acks: -1,
        });
        console.warn('Sent to DLQ offset', message.offset);
      }
    },
  });
}

async function processOrder(msg: { offset: string; value: Buffer | null }) {
  if (Math.random() < 0.3) throw new Error('Random processing failure');
  console.log('Processed order at offset', msg.offset);
}`,
  };

  readonly quiz: QuizQuestion[] = [
    { q: 'What does linger.ms control in a Kafka producer?', options: ['Max message size', 'Wait time to batch messages before sending', 'Session timeout', 'Retry interval'], answer: 1, explanation: 'linger.ms introduces a deliberate delay to accumulate messages into a larger batch, improving throughput.' },
    { q: 'Which consumer mode gives you manual offset control over a batch?', options: ['eachMessage with autoCommit=true', 'eachBatch with autoCommit=false', 'eachMessage with autoCommit=false', 'seekToBeginning'], answer: 1, explanation: 'eachBatch with autoCommit=false lets you call resolveOffset() per message and commit the batch only after all succeed.' },
    { q: 'What happens if a Kafka consumer misses its heartbeat deadline?', options: ['Consumer is closed by the admin', 'Broker triggers a rebalance and reassigns partitions', 'Offsets are reset to beginning', 'Messages are dropped'], answer: 1, explanation: 'The broker considers the consumer dead after session.timeout.ms and triggers a group rebalance.' },
    { q: 'With idempotent=true, what does Kafka prevent?', options: ['Duplicate messages from consumers', 'Duplicate records from producer retries', 'Out-of-order messages', 'Consumer group rebalances'], answer: 1, explanation: 'Idempotent producers get a PID and per-partition sequence numbers; the broker deduplicates retries.' },
    { q: 'What does acks=all (acks=-1) guarantee for Kafka producers?', options: ['Message written to disk only on leader', 'Message acknowledged by all ISR (in-sync replicas) before producer gets success', 'Exactly-once delivery to consumers', 'Message ordering across partitions'], answer: 1, explanation: 'acks=all requires all in-sync replicas to acknowledge the write before the producer gets a success response — strongest durability guarantee. Combined with min.insync.replicas, prevents data loss on broker failure.' },
    { q: 'What is consumer group rebalancing and what causes it?', options: ['Compacting old log segments', 'Redistributing partition ownership when group membership changes', 'Resetting consumer offsets to earliest', 'Re-electing a partition leader'], answer: 1, explanation: 'Rebalancing reassigns partitions among consumers when: a consumer joins or leaves, heartbeat times out, or topic partitions change. During rebalance, all consumers pause processing (stop-the-world for classic protocol).' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'Why is "exactly-once" a misleading term for what Kafka\'s idempotent + transactional producer actually guarantees?', a: 'What Kafka actually guarantees is "exactly-once processing within the Kafka ecosystem" — a message written by an idempotent/transactional producer is stored exactly once and a transaction\'s writes across multiple partitions are atomic, but this says nothing about side effects OUTSIDE Kafka. If your consumer processes a message by calling an external payment API, Kafka\'s guarantee does not prevent that external call from happening twice if the consumer crashes and reprocesses after a rebalance — true end-to-end exactly-once for external side effects still requires the consumer\'s own idempotency logic (e.g. an idempotency key check) regardless of what Kafka guarantees internally.' },
    { q: 'What is the difference between commitOffsets() and resolveOffset() in eachBatch?', a: 'resolveOffset(offset) tracks which messages in the current batch have been processed, building up the offset to commit when the batch handler resolves. commitOffsets() is an explicit manual flush of committed offsets to the broker mid-batch.' },
    { q: 'When should I use eachBatch instead of eachMessage?', a: 'Use eachBatch when you need micro-batching (bulk inserts to a database), want manual heartbeat control for slow processing, or need to commit offsets only after a group of messages all succeed together.' },
    { q: 'How do you implement exactly-once semantics (EOS) end-to-end in Kafka?', a: 'EOS requires: (1) <strong>Idempotent producer</strong>: enable.idempotence=true — deduplicates retried records per partition; (2) <strong>Transactional producer</strong>: transactional.id + beginTransaction/commitTransaction — atomic multi-partition writes; (3) <strong>Consumer isolation</strong>: isolation.level=read_committed — consumers only see committed transaction records. Full EOS: Kafka Streams or manual transactional producer + consumer loop.' },
    { q: 'What is the consumer fetch.min.bytes and max.poll.records tuning?', a: '<code>fetch.min.bytes</code>: minimum data to return per fetch request — broker waits until this is available, reducing empty fetches. <code>fetch.max.wait.ms</code>: max time to wait for fetch.min.bytes. <code>max.poll.records</code>: max records per poll() call — tune to match your processing capacity per poll interval to avoid session timeouts (max.poll.interval.ms).' },
    { q: 'How does Kafka handle consumer lag and how do you monitor it?', a: 'Consumer lag = (latest offset in partition) - (committed consumer offset). High lag means consumers are falling behind. Monitor: <code>kafka-consumer-groups.sh --describe</code> or <strong>Burrow</strong> / Confluent Control Center. Alert on sustained lag growth. Solutions: add consumers to the group (up to partition count), increase processing throughput, or reduce processing complexity.' },
  ];

  readonly revision: RevisionSummary = {
    oneLiner: 'Producers: idempotent + acks=-1 for safety; consumers: eachMessage for simplicity, eachBatch for throughput and control.',
    mustKnow: [
      'acks=-1 (all ISR) for durability; idempotent=true prevents duplicate sends on retry',
      'linger.ms + batch.size trade latency for throughput via batching',
      'eachMessage: simple, auto-committed offsets; eachBatch: manual resolveOffset + heartbeat',
      'fromBeginning only works with a fresh groupId that has no committed offset',
      'heartbeat() in eachBatch prevents session.timeout.ms rebalance triggers',
      'DLQ pattern: on processing failure, publish to a dead-letter topic with error headers',
    ],
    interviewFocus: [
      'acks values and their durability vs latency trade-offs',
      'eachMessage vs eachBatch: when to use each',
      'Idempotent producer: how sequence numbers prevent duplicates',
      'Consumer offset management: fromBeginning, seek, manual commit',
    ],
  };
}
