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
  selector: 'app-rabbitmq-core',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './rabbitmq-core.html',
  styleUrl: './rabbitmq-core.scss'
})
export class RabbitMqCore {
  readonly quickRef: QuickRefItem[] = [
    { name: 'Exchange', type: 'keyword', desc: 'Receives messages from producers and routes to queues' },
    { name: 'Queue', type: 'keyword', desc: 'Stores messages until consumed; survives if durable=true' },
    { name: 'Binding', type: 'keyword', desc: 'Rule linking an exchange to a queue with an optional routing key' },
    { name: 'Channel', type: 'keyword', desc: 'Lightweight virtual connection within a TCP connection' },
    { name: 'prefetch', type: 'method', desc: 'Limits in-flight unacked messages per consumer; prevents overload' },
    { name: 'ack / nack', type: 'method', desc: 'Confirm or reject a delivery; nack can requeue or discard' },
    { name: 'durable', type: 'keyword', desc: 'Queue/exchange survives broker restart if true' },
    { name: 'persistent', type: 'keyword', desc: 'Message survives broker restart if delivery mode=2' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'AMQP Model: Producer → Exchange → Queue → Consumer',
      points: [
        'RabbitMQ implements AMQP. Producers never publish directly to a queue — they publish to an exchange.',
        'The exchange applies routing logic (type-dependent) and delivers matching messages to bound queues.',
        'Consumers subscribe to queues and receive messages pushed by the broker.',
        'Channels multiplex messages over a single TCP connection — create one channel per thread.',
      ]
    },
    {
      heading: 'Durability and Persistence',
      points: [
        'A durable queue is re-created after broker restart. Without it, queue metadata is lost on restart.',
        'A persistent message (deliveryMode=2) is written to disk. Without it, the message is lost on restart.',
        'Both must be set to guarantee no message loss across broker restarts.',
        'Performance trade-off: persistent messages have higher write latency than transient ones.',
      ]
    },
    {
      heading: 'Acknowledgements and Prefetch',
      points: [
        'Manual ack (noAck=false) lets the consumer control when a message is removed from the queue.',
        'If the consumer crashes before acking, the broker redelivers to another consumer.',
        'prefetch(N) tells the broker not to send more than N unacked messages to a consumer at once.',
        'Without prefetch, one slow consumer can receive the entire queue backlog and stall.',
      ]
    },
    {
      heading: 'Publisher Confirms and Consumer Acknowledgments',
      points: [
        'Publisher confirms let a producer know the broker has actually accepted and persisted a message, providing a delivery guarantee beyond simply calling publish() and assuming success — without confirms, a network issue could silently drop a published message.',
        'Manual consumer acknowledgment (ack) tells RabbitMQ a message was successfully processed and can be removed from the queue — auto-ack (acknowledging immediately on delivery, before processing) risks losing messages if the consumer crashes mid-processing.',
        'Negative acknowledgment (nack) with requeue=false routes a message to a dead-letter exchange instead of endlessly redelivering a message the consumer cannot successfully process — without this, a permanently failing message can loop indefinitely between redelivery and failure.',
        'Prefetch count (QoS) limits how many unacknowledged messages a consumer can have outstanding at once, preventing a single slow consumer from being overwhelmed with more in-flight messages than it can reasonably track and process.',
      ],
    },
    {
      heading: 'Durability: Persistent Messages and Durable Queues',
      points: [
        'A queue must be declared durable (surviving a broker restart) AND messages must be marked persistent (delivery_mode=2) for messages to survive a RabbitMQ broker restart — missing either half of this pairing means messages can still be lost on restart despite appearing "durable."',
        'Persistent messages are written to disk before being acknowledged to the publisher, trading some throughput for durability — this is a deliberate tradeoff that should be made per-queue based on whether that queue\'s messages can tolerate loss on broker restart.',
        'Mirrored/quorum queues replicate queue contents across multiple broker nodes, protecting against a single node failure in addition to protecting against a full-cluster restart — durability alone does not protect against a node crash if that queue is not also replicated.',
        'Transient (non-durable) queues and non-persistent messages are appropriate for genuinely disposable data (like real-time metrics where losing a few recent updates on a broker restart is acceptable) where the throughput gain outweighs the durability cost.',
      ],
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'Producer',
      language: 'typescript',
      code: `import amqplib from 'amqplib';

async function publish(message: object) {
  const conn = await amqplib.connect('amqp://localhost');
  const ch   = await conn.createChannel();

  // Declare exchange and queue
  await ch.assertExchange('orders', 'direct', { durable: true });
  await ch.assertQueue('order-processing', { durable: true });
  await ch.bindQueue('order-processing', 'orders', 'new');

  ch.publish('orders', 'new',
    Buffer.from(JSON.stringify(message)),
    { persistent: true }   // write to disk
  );
  console.log('Published:', message);
  await ch.close();
  await conn.close();
}

publish({ orderId: 'ORD-001', total: 99.99 });`,
    },
    {
      label: 'Consumer',
      language: 'typescript',
      code: `import amqplib from 'amqplib';

async function startWorker() {
  const conn = await amqplib.connect('amqp://localhost');
  const ch   = await conn.createChannel();

  await ch.assertQueue('order-processing', { durable: true });
  ch.prefetch(5);   // max 5 in-flight messages

  console.log('Waiting for orders…');

  ch.consume('order-processing', async (msg) => {
    if (!msg) return;
    try {
      const order = JSON.parse(msg.content.toString());
      await processOrder(order);
      ch.ack(msg);              // success → remove from queue
    } catch (err) {
      ch.nack(msg, false, false); // fail → send to DLQ
    }
  }, { noAck: false });
}

async function processOrder(order: { orderId: string; total: number }) {
  console.log('Processing order:', order.orderId);
}

startWorker();`,
    },
  ];

  readonly mistakes: CommonMistake[] = [
    {
      title: 'Creating channels per message instead of per thread',
      wrong: `// Opening a new connection for every message
for (const msg of messages) {
  const conn = await amqplib.connect('amqp://localhost');
  const ch = await conn.createChannel();
  ch.sendToQueue('q', Buffer.from(msg));
  await conn.close();
}`,
      right: `// Reuse one connection and one channel
const conn = await amqplib.connect('amqp://localhost');
const ch   = await conn.createChannel();
for (const msg of messages) {
  ch.sendToQueue('q', Buffer.from(msg), { persistent: true });
}`,
      explanation: 'TCP connections are expensive. Share one connection; use channels for concurrency within it.'
    },
    {
      title: 'Forgetting to set both durable queue and persistent messages',
      wrong: `// Queue is durable but message is not persistent
await ch.assertQueue('tasks', { durable: true });
ch.sendToQueue('tasks', Buffer.from(data)); // default: non-persistent`,
      right: `await ch.assertQueue('tasks', { durable: true });
ch.sendToQueue('tasks', Buffer.from(data), { persistent: true });`,
      explanation: 'Durability covers queue metadata; persistence covers message data on disk. Both are needed for crash safety.'
    },
    {
      title: 'Not setting prefetch, causing one consumer to receive all messages',
      wrong: `// No prefetch — broker pushes everything to the first consumer
ch.consume('tasks', async (msg) => { await slowTask(msg); ch.ack(msg); });`,
      right: `ch.prefetch(10);   // fairness: max 10 unacked per consumer
ch.consume('tasks', async (msg) => { await slowTask(msg); ch.ack(msg); });`,
      explanation: 'Without prefetch, a slow consumer accumulates the entire queue. Prefetch enables fair load distribution.'
    },
    {
      title: 'Nacking with requeue=true on a processing error (infinite loop)',
      wrong: `ch.consume('q', (msg) => {
  if (!msg) return;
  try { process(msg); ch.ack(msg); }
  catch { ch.nack(msg, false, true); } // requeues → retried forever
});`,
      right: `ch.consume('q', (msg) => {
  if (!msg) return;
  try { process(msg); ch.ack(msg); }
  catch { ch.nack(msg, false, false); } // send to DLQ
});`,
      explanation: 'Requeuing on persistent errors causes infinite retry loops. Use DLQ (requeue=false) with retry counts tracked in message headers.'
    },
  ];

  readonly challenge: Challenge = {
    title: 'Durable Work Queue with Dead Letter Queue',
    language: 'typescript',
    description: 'Create a durable RabbitMQ setup where failed messages (after 3 retries tracked in headers) are routed to a dead-letter queue. Use amqplib. The consumer should increment a retryCount header and nack without requeue when retryCount > 3.',
    hints: [
      'Use x-dead-letter-exchange when asserting the main queue',
      'Read headers from msg.properties.headers',
      'Republish with updated headers before nacking if retryCount <= 3',
    ],
    starterCode: `import amqplib from 'amqplib';

async function setupAndConsume() {
  const conn = await amqplib.connect('amqp://localhost');
  const ch   = await conn.createChannel();
  // TODO: set up main queue with DLX, DLQ, consume with retry logic
}`,
    solution: `import amqplib from 'amqplib';

async function setupAndConsume() {
  const conn = await amqplib.connect('amqp://localhost');
  const ch   = await conn.createChannel();

  // Dead letter queue
  await ch.assertQueue('tasks.dlq', { durable: true });

  // Main queue points failed messages to DLX
  await ch.assertQueue('tasks', {
    durable: true,
    arguments: { 'x-dead-letter-exchange': '', 'x-dead-letter-routing-key': 'tasks.dlq' },
  });

  ch.prefetch(5);
  ch.consume('tasks', async (msg) => {
    if (!msg) return;
    const retryCount = (msg.properties.headers?.['x-retry'] ?? 0) as number;
    try {
      await processTask(JSON.parse(msg.content.toString()));
      ch.ack(msg);
    } catch {
      if (retryCount >= 3) {
        ch.nack(msg, false, false); // → DLQ
      } else {
        // Republish with incremented retry count
        ch.sendToQueue('tasks', msg.content, {
          persistent: true,
          headers: { 'x-retry': retryCount + 1 },
        });
        ch.ack(msg); // ack original to avoid double processing
      }
    }
  });
}

async function processTask(task: unknown) { throw new Error('simulated failure'); }`,
  };

  readonly quiz: QuizQuestion[] = [
    { q: 'What is the role of an exchange in RabbitMQ?', options: ['Stores messages persistently', 'Routes messages to queues based on type and binding', 'Acknowledges delivery to the producer', 'Limits consumer prefetch'], answer: 1, explanation: 'Exchanges receive messages from producers and route them to bound queues using routing logic.' },
    { q: 'What does prefetch(1) guarantee?', options: ['Queue holds only 1 message', 'Consumer receives only 1 message at a time', 'Messages are delivered exactly once', 'Connection limited to 1 channel'], answer: 1, explanation: 'prefetch(1) means the broker sends the next message only after the consumer acks the current one.' },
    { q: 'Which combination ensures messages survive a broker restart?', options: ['durable queue only', 'persistent message only', 'durable queue + persistent message', 'noAck=true'], answer: 2, explanation: 'Both the queue (metadata) and message (data) must be persisted to survive a restart.' },
    { q: 'What happens when nack is called with requeue=false?', options: ['Message is immediately redelivered', 'Message is deleted silently', 'Message is routed to the dead-letter exchange if configured', 'Connection is closed'], answer: 2, explanation: 'With requeue=false, the broker routes the message to the DLX/DLQ if configured, or drops it.' },
    { q: 'What is the difference between a durable and transient queue in RabbitMQ?', options: ['Durable queues are faster', 'Durable queues survive broker restart; transient queues are lost on restart', 'Durable queues support more consumers', 'Transient queues are cloud-only'], answer: 1, explanation: 'A durable queue persists its metadata to disk and survives broker restarts. For messages to survive too, they must also be marked persistent (delivery_mode=2). Transient queues and non-persistent messages are faster but not crash-safe.' },
    { q: 'What is the RabbitMQ prefetch count and why should you set it?', options: ['Number of queues per connection', 'Max unacknowledged messages delivered to a consumer before it must ACK', 'Number of consumers per queue', 'Max message size in bytes'], answer: 1, explanation: 'Prefetch (basic.qos) limits unacknowledged messages per consumer. Without it, RabbitMQ delivers all messages to the fastest consumer, starving others. Set to 1 for even distribution; higher for throughput.' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'How many channels should I open per application?', a: 'One channel per thread is the recommended pattern. Channels are cheap; connections are expensive. Sharing one TCP connection with multiple channels is the intended AMQP design.' },
    { q: 'What is the difference between a fanout exchange and a direct exchange?', a: 'A fanout exchange ignores routing keys and delivers to all bound queues. A direct exchange matches the routing key exactly. Topic exchanges use wildcard patterns (* and #).' },
    { q: 'When should I use a dead-letter queue?', a: 'Any time you have messages that may fail processing (invalid data, downstream errors). The DLQ lets you inspect, alert on, and replay failed messages without blocking the main queue.' },
    { q: 'How do you implement a work queue (task queue) with RabbitMQ?', a: 'Pattern: (1) Producer publishes to a durable queue with delivery_mode=2 (persistent); (2) Multiple consumers with prefetch=1 (even distribution); (3) Consumers ACK only after processing completes — message redelivered if consumer crashes mid-process. This distributes tasks across consumers with reliability and automatic retry on failure.' },
    { q: 'What is the RabbitMQ management UI used for?', a: 'The RabbitMQ management plugin (<code>rabbitmq-plugins enable rabbitmq_management</code>) provides a web UI (port 15672) and HTTP API for: monitoring queue depths, consumer counts, message rates; managing exchanges, queues, bindings; publishing/getting test messages; viewing connection and channel stats; exporting/importing definitions.' },
    { q: 'How does RabbitMQ handle message acknowledgment and nacks?', a: '<code>basic.ack(deliveryTag)</code>: removes message from queue. <code>basic.nack(deliveryTag, requeue=true)</code>: re-queues message for retry. <code>basic.nack(requeue=false)</code>: discards or dead-letters. <code>basic.reject</code>: same as nack for single message. Always acknowledge — unacknowledged messages stay in memory and count against prefetch limit.' },
  ];

  readonly revision: RevisionSummary = {
    oneLiner: 'RabbitMQ routes via exchanges: durable queues + persistent messages + prefetch + manual ack = reliable work queue.',
    mustKnow: [
      'Producers publish to exchanges, not queues; bindings route messages to queues',
      'Durable queue survives restart; persistent message survives restart — need both',
      'Channel is a multiplexed virtual connection — one per thread, reuse connection',
      'prefetch(N) prevents one consumer from monopolising the queue',
      'Manual ack: ack on success, nack(requeue=false) on terminal failure → DLQ',
      'Dead-letter exchange receives nacked messages for inspection and retry',
    ],
    interviewFocus: [
      'Exchange types: direct, fanout, topic, headers — when to use each',
      'Durable vs persistent: what each protects and why both are needed',
      'prefetch impact on load distribution across competing consumers',
      'DLQ pattern: avoiding infinite retry loops with retry-count headers',
    ],
  };
}
