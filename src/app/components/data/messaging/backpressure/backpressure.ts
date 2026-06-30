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
  selector: 'app-backpressure',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './backpressure.html',
  styleUrl: './backpressure.scss'
})
export class Backpressure {
  readonly quickRef: QuickRefItem[] = [
    { name: 'Backpressure', type: 'keyword', desc: 'Mechanism to slow producers when consumers cannot keep up' },
    { name: 'prefetch', type: 'keyword', desc: 'RabbitMQ: max in-flight messages per consumer; prevents overload' },
    { name: 'fetch.max.bytes', type: 'keyword', desc: 'Kafka consumer: max bytes fetched per poll call' },
    { name: 'max.poll.records', type: 'keyword', desc: 'Kafka: max records returned per poll; limits per-batch work' },
    { name: 'Rate limiting', type: 'keyword', desc: 'Throttle producer send rate; token bucket or leaky bucket algorithm' },
    { name: 'Circuit breaker', type: 'keyword', desc: 'Stops processing when downstream is unavailable; prevents cascade failure' },
    { name: 'Consumer lag', type: 'keyword', desc: 'Difference between latest produced offset and last consumed offset' },
    { name: 'Pause/Resume', type: 'keyword', desc: 'Kafka consumer: dynamically pause a partition to reduce inflow temporarily' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'What is Backpressure?',
      points: [
        'Backpressure is a signal from a slow consumer that tells the producer (or broker) to slow down.',
        'Without backpressure, fast producers overwhelm slow consumers: queues grow, memory spikes, latency explodes.',
        'In messaging systems, backpressure is applied via: prefetch limits (RabbitMQ), poll rate control (Kafka), or scaling consumers horizontally.',
        'Reactive Streams standardises backpressure: publishers emit only as many items as the subscriber requests.',
      ]
    },
    {
      heading: 'Backpressure in Kafka',
      points: [
        'Kafka consumers pull messages — they naturally control their own rate by polling when ready.',
        'max.poll.records limits how many records are returned per poll, controlling per-batch processing time.',
        'consumer.pause(topicPartitions) stops a partition from returning records in subsequent polls — apply when downstream is busy.',
        'consumer.resume() re-enables the partition when the consumer has capacity again.',
      ]
    },
    {
      heading: 'Backpressure in RabbitMQ',
      points: [
        'prefetch(N) limits the broker to N unacked messages per consumer channel at a time.',
        'When all N slots are occupied (unacked), the broker stops pushing until the consumer acks at least one.',
        'prefetch(1) is the strictest fairness setting: one at a time. Higher values increase throughput but reduce fairness.',
        'Without prefetch, a slow consumer can accumulate thousands of messages, exhaust memory, and degrade the entire broker.',
      ]
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'Kafka Pause/Resume',
      language: 'typescript',
      code: `import { Kafka, TopicPartition } from 'kafkajs';

const kafka    = new Kafka({ brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'controlled-consumer' });

await consumer.connect();
await consumer.subscribe({ topic: 'high-volume-events' });

let paused = false;
const MAX_QUEUE_SIZE = 100;
const pendingWork: unknown[] = [];

await consumer.run({
  // Limit records per poll to control batch size
  eachBatch: async ({ batch, resolveOffset, heartbeat, pause }) => {
    for (const message of batch.messages) {
      const event = JSON.parse(message.value!.toString());
      pendingWork.push(event);
      resolveOffset(message.offset);

      // Pause if queue is getting too large
      if (pendingWork.length >= MAX_QUEUE_SIZE && !paused) {
        console.log('Queue full — pausing partition');
        pause();  // returns resume function; call to unpause
        paused = true;
      }

      await heartbeat();
    }
  },
});

// Background worker drains the queue
setInterval(async () => {
  const batch = pendingWork.splice(0, 10); // drain 10 at a time
  for (const event of batch) {
    await processEvent(event);
  }
  if (paused && pendingWork.length < 50) {
    paused = false;
    console.log('Queue draining — resuming');
    // Kafka will automatically resume when the consumer polls again after pause()
  }
}, 100);

async function processEvent(e: unknown) { /* ... */ }`,
    },
    {
      label: 'RabbitMQ Prefetch',
      language: 'typescript',
      code: `import amqplib from 'amqplib';

const conn = await amqplib.connect('amqp://localhost');
const ch   = await conn.createChannel();

// prefetch(5): process max 5 messages concurrently
ch.prefetch(5);

await ch.assertQueue('heavy-tasks', { durable: true });

ch.consume('heavy-tasks', async (msg) => {
  if (!msg) return;
  const task = JSON.parse(msg.content.toString());
  console.log('Processing task:', task.id, '(slot used)');

  try {
    await runHeavyTask(task); // async — slot held until ack
    ch.ack(msg);              // release slot
  } catch {
    ch.nack(msg, false, false); // failure → DLQ
  }
});

async function runHeavyTask(task: { id: string }) {
  // Simulate variable-duration work
  const ms = Math.random() * 2000 + 500;
  await new Promise(r => setTimeout(r, ms));
  console.log(\`Task \${task.id} done in \${ms.toFixed(0)}ms\`);
}`,
    },
    {
      label: 'Rate-Limited Producer',
      language: 'typescript',
      code: `import { Kafka } from 'kafkajs';

const kafka    = new Kafka({ brokers: ['localhost:9092'] });
const producer = kafka.producer({ idempotent: true });
await producer.connect();

// Token bucket rate limiter
class TokenBucket {
  private tokens: number;
  constructor(private capacity: number, private refillPerSec: number) {
    this.tokens = capacity;
    setInterval(() => {
      this.tokens = Math.min(this.capacity, this.tokens + refillPerSec);
    }, 1000);
  }

  async acquire(): Promise<void> {
    while (this.tokens < 1) {
      await new Promise(r => setTimeout(r, 50));
    }
    this.tokens--;
  }
}

const limiter = new TokenBucket(100, 50); // 100 burst, 50/sec sustained

async function sendWithRateLimit(events: object[]) {
  for (const event of events) {
    await limiter.acquire(); // blocks if over rate limit
    await producer.send({
      topic: 'events',
      messages: [{ value: JSON.stringify(event) }],
      acks: -1,
    });
  }
  console.log(\`Sent \${events.length} events at max 50/sec\`);
}

await sendWithRateLimit(Array.from({ length: 200 }, (_, i) => ({ id: i })));`,
    },
  ];

  readonly mistakes: CommonMistake[] = [
    {
      title: 'Not setting prefetch in RabbitMQ, causing broker memory exhaustion',
      wrong: `// No prefetch — broker pushes all 100,000 queue messages to first consumer
ch.consume('tasks', async (msg) => {
  await slowTask(msg); // 2s each — memory explodes with 100k in-flight
  ch.ack(msg);
});`,
      right: `ch.prefetch(10);  // max 10 in-flight; broker pauses after 10 unacked
ch.consume('tasks', async (msg) => {
  await slowTask(msg);
  ch.ack(msg); // releases a slot for the broker to send another
});`,
      explanation: 'Without prefetch, the broker pre-buffers as many messages as the TCP window allows. A slow consumer can hold thousands of in-flight messages, exhausting both consumer and broker memory.'
    },
    {
      title: 'Setting max.poll.records too high, causing session timeout',
      wrong: `// max.poll.records=500 but each record takes 200ms → 100s per poll
// session.timeout.ms=10000 → broker triggers rebalance mid-batch`,
      right: `// Set max.poll.records so total processing time < session.timeout.ms
// If each record takes 200ms and session.timeout=30s: max ~100 records/poll
// Better: increase session.timeout.ms or decrease max.poll.records`,
      explanation: 'Kafka consumers must call poll() within session.timeout.ms. A large max.poll.records batch that takes longer than the timeout causes a session timeout and rebalance.'
    },
    {
      title: 'Not monitoring consumer lag as a backpressure signal',
      wrong: `// No lag monitoring — consumer falls behind silently
// Messages pile up for hours before anyone notices`,
      right: `// Monitor consumer lag via Kafka Admin or prometheus
// Alert when lag > threshold (e.g., 10,000 records)
// Trigger auto-scaling or pause non-critical producers`,
      explanation: 'Consumer lag is the primary signal that backpressure is needed. Alert on lag thresholds, and use autoscaling or producer rate limiting to respond before queues grow unbounded.'
    },
    {
      title: 'Using a single consumer for high-throughput topics without prefetch tuning',
      wrong: `// Single consumer, no prefetch control
// Cannot keep up with 10,000 msg/s topic; lag grows indefinitely`,
      right: `// Scale consumers to match partition count
// Tune max.poll.records and prefetch to match consumer processing rate
// Monitor lag and scale horizontally on alert threshold`,
      explanation: 'A single consumer has a fixed processing rate. Match consumer count to partition count, tune batch sizes, and scale horizontally when lag signals the consumer is overwhelmed.'
    },
  ];

  readonly challenge: Challenge = {
    title: 'Adaptive Consumer with Lag-Based Pause',
    language: 'typescript',
    description: 'Build a Kafka consumer for "events" topic. Track the number of messages in a local processing queue. If the queue depth exceeds 200 messages, pause consuming (using eachBatch pause()). Resume when the queue drains below 50. Log "PAUSED" and "RESUMED" transitions.',
    hints: [
      'Use a shared let queue: unknown[] and a paused: boolean flag',
      'In eachBatch, after adding to queue, call pause() if queue.length > 200',
      'A setInterval drains the queue; call consumer.resume(topics) when queue < 50',
    ],
    starterCode: `import { Kafka } from 'kafkajs';

let queue: unknown[] = [];
let paused = false;

async function startAdaptiveConsumer() {
  const kafka    = new Kafka({ brokers: ['localhost:9092'] });
  const consumer = kafka.consumer({ groupId: 'adaptive' });
  // TODO: lag-based pause/resume
}`,
    solution: `import { Kafka, TopicPartitions } from 'kafkajs';

let queue: unknown[] = [];
let paused  = false;
let resumeFn: (() => void) | null = null;

async function startAdaptiveConsumer() {
  const kafka    = new Kafka({ brokers: ['localhost:9092'] });
  const consumer = kafka.consumer({ groupId: 'adaptive' });

  await consumer.connect();
  await consumer.subscribe({ topic: 'events' });

  // Drain queue in background
  setInterval(async () => {
    const batch = queue.splice(0, 20);
    for (const event of batch) {
      await new Promise(r => setTimeout(r, 10)); // simulate work
    }
    if (paused && queue.length < 50) {
      paused = false;
      resumeFn?.();
      resumeFn = null;
      console.log('RESUMED — queue:', queue.length);
    }
  }, 100);

  await consumer.run({
    eachBatch: async ({ batch, resolveOffset, heartbeat, pause }) => {
      for (const message of batch.messages) {
        queue.push(JSON.parse(message.value!.toString()));
        resolveOffset(message.offset);
        await heartbeat();

        if (!paused && queue.length > 200) {
          paused  = true;
          resumeFn = pause();
          console.log('PAUSED — queue:', queue.length);
        }
      }
    },
  });
}`,
  };

  readonly quiz: QuizQuestion[] = [
    { q: 'What does RabbitMQ prefetch(N) control?', options: ['Max messages in the queue', 'Max unacked in-flight messages per consumer', 'Max consumers per queue', 'Max retry count'], answer: 1, explanation: 'prefetch(N) limits the broker to sending N messages to a consumer before waiting for acknowledgements. This prevents overwhelming slow consumers.' },
    { q: 'What is consumer lag in Kafka?', options: ['Time between publish and consume', 'Difference between latest produced and last consumed offset', 'Network latency to broker', 'Number of idle consumers'], answer: 1, explanation: 'Consumer lag = latest offset - committed offset per partition. High lag means the consumer is falling behind and backpressure is needed.' },
    { q: 'What happens when max.poll.records is set too high?', options: ['Message ordering breaks', 'Consumer commits too early', 'Processing takes too long → session.timeout.ms expires → rebalance', 'Producer is throttled'], answer: 2, explanation: 'Large batches may take longer than session.timeout.ms to process. The broker triggers a rebalance thinking the consumer is dead.' },
    { q: 'How does the Kafka consumer pause() method provide backpressure?', options: ['Disconnects from broker', 'Stops the poll loop entirely', 'Prevents messages from that partition being returned in subsequent polls', 'Increases session timeout'], answer: 2, explanation: 'pause() marks partitions as paused; subsequent poll() calls return no messages from those partitions until resume() is called.' },
    { q: 'What is backpressure in messaging systems?', options: ['Pressure from large message payloads on network', 'A flow-control mechanism for consumers to signal producers to slow down', 'Retrying failed messages upstream', 'Compressing messages under peak load'], answer: 1, explanation: 'Backpressure allows consumers to signal upstream producers that capacity is exhausted, causing producers to throttle. Without it, fast producers overwhelm slow consumers causing queue buildup or OOM.' },
    { q: 'Which overflow strategy keeps only the most recent item?', options: ['BUFFER (queues all)', 'DROP (discards new items)', 'LATEST (drops oldest, keeps newest)', 'ERROR (signals error)'], answer: 2, explanation: 'LATEST keeps the most recent item when the buffer is full, discarding older items. BUFFER risks OOM by queuing everything. DROP discards new items. ERROR propagates an error to the subscriber.' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'How does backpressure differ between RabbitMQ (push) and Kafka (pull)?', a: 'RabbitMQ pushes messages to consumers — prefetch is the brake that limits how much the broker pushes. Kafka consumers pull — they naturally control inflow rate by polling only when ready. Kafka\'s pause()/resume() and max.poll.records provide additional fine-grained control.' },
    { q: 'What should trigger automatic consumer scaling?', a: 'Consumer lag is the primary signal. Set a CloudWatch/Prometheus alert at a lag threshold (e.g., 10,000 records or 5 minutes). Auto-scaling groups (ECS, Kubernetes HPA) can use lag metrics from Kafka Exporter or Confluent Control Center to scale out consumers.' },
    { q: 'Can a rate-limited producer help with backpressure?', a: 'Yes, but it\'s a last resort. Scaling consumers is usually better. Rate-limiting producers means business events are delayed at the source. It\'s appropriate when the downstream system has a strict SLA capacity (e.g., an external API with rate limits) and you cannot scale consumers further.' },
    { q: 'How does Kafka implement backpressure on the producer side?', a: 'Kafka producer backpressure: <code>max.block.ms</code> blocks the producer when the send buffer is full (waiting for broker acks or local buffer space). <code>buffer.memory</code> sets total buffering capacity. Externally, Kafka broker quotas (<code>producer_byte_rate</code>) throttle producers per client. Reactive Kafka (Reactor Kafka) provides true demand-based backpressure via Project Reactor.' },
    { q: 'How do you implement backpressure in a Node.js stream pipeline?', a: 'Node.js streams backpressure via <code>write()</code> return value: if it returns <code>false</code>, the buffer is full — stop writing and wait for the <code>drain</code> event. In <code>stream.pipeline(readable, transform, writable)</code>, backpressure is automatic — the pipeline pauses upstream when downstream is full.' },
    { q: 'What is the difference between backpressure and rate limiting?', a: '<strong>Backpressure</strong>: demand-driven — consumer signals actual capacity; adjusts dynamically. <strong>Rate limiting</strong>: time-based — producer capped at a fixed rate regardless of consumer state. Backpressure is more efficient (matches actual throughput); rate limiting is simpler. Best practice: combine both — rate limiting as a safety ceiling, backpressure for efficient flow within the cap.' },
  ];

  readonly revision: RevisionSummary = {
    oneLiner: 'Backpressure = slow consumer signals broker to slow down; prefetch in RabbitMQ, pause/max.poll.records in Kafka.',
    mustKnow: [
      'RabbitMQ: prefetch(N) limits in-flight unacked messages; broker pauses after N until ack',
      'Kafka: pull-based, naturally controlled; pause()/resume() for dynamic flow control',
      'max.poll.records: limit per-poll batch so processing stays within session.timeout.ms',
      'Consumer lag: primary backpressure signal; alert and autoscale on threshold breach',
      'Rate-limited producer: token bucket for sustained rate control when consumer capacity is fixed',
      'Without backpressure: queue growth, memory exhaustion, cascade failure',
    ],
    interviewFocus: [
      'Push vs pull: how each model handles backpressure differently',
      'RabbitMQ prefetch: what value to use and why',
      'Kafka consumer lag: monitoring, alerting, and autoscaling',
      'pause()/resume(): dynamic backpressure in eachBatch consumers',
    ],
  };
}
