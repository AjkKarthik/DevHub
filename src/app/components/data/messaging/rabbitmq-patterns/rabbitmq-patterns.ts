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
  selector: 'app-rabbitmq-patterns',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './rabbitmq-patterns.html',
  styleUrl: './rabbitmq-patterns.scss'
})
export class RabbitMqPatterns {
  readonly quickRef: QuickRefItem[] = [
    { name: 'Work Queue', type: 'keyword', desc: 'Multiple competing consumers share a queue for load distribution' },
    { name: 'RPC over AMQP', type: 'keyword', desc: 'Request/reply via replyTo queue and correlationId header' },
    { name: 'Delayed Queue', type: 'keyword', desc: 'Use TTL + DLX to implement scheduled/delayed delivery' },
    { name: 'Priority Queue', type: 'keyword', desc: 'x-max-priority argument enables per-message priority levels' },
    { name: 'correlationId', type: 'keyword', desc: 'UUID linking RPC reply to its original request' },
    { name: 'replyTo', type: 'keyword', desc: 'Queue name where the server sends its RPC response' },
    { name: 'TTL', type: 'keyword', desc: 'Time-to-live: message expiry in ms; expired → DLX' },
    { name: 'x-delayed-message', type: 'keyword', desc: 'Plugin exchange type for native message scheduling' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'Work Queue Pattern',
      points: [
        'Multiple consumers bind to the same queue and share the work load via competing consumers.',
        'prefetch(1) ensures fair dispatch: no consumer gets a second task until it acks the first.',
        'Ideal for CPU-bound tasks (image processing, video encoding) that need horizontal scaling.',
        'Add more consumers at runtime to scale out; remove them to scale in.',
      ]
    },
    {
      heading: 'Request/Reply (RPC over AMQP)',
      points: [
        'The client sends a message with a replyTo queue name and a correlationId UUID.',
        'The server processes the request and publishes the result to the replyTo queue with the same correlationId.',
        'The client consumes from the replyTo queue and matches responses using correlationId.',
        'Use exclusive, auto-delete reply queues per client to avoid cross-contamination.',
      ]
    },
    {
      heading: 'Delayed / Scheduled Messages',
      points: [
        'Native AMQP has no scheduler, but you can fake delays with a "holding" queue that has a TTL and a DLX.',
        'Messages sit in the holding queue until they expire, then the DLX delivers them to the real processing queue.',
        'The rabbitmq-delayed-message-exchange plugin provides a native x-delay header approach.',
        'Use delays for retry backoff, scheduled jobs, and timed notifications.',
      ]
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'Work Queue',
      language: 'typescript',
      code: `import amqplib from 'amqplib';

// Worker — start multiple instances for scale
async function startWorker(id: number) {
  const conn = await amqplib.connect('amqp://localhost');
  const ch   = await conn.createChannel();

  await ch.assertQueue('jobs', { durable: true });
  ch.prefetch(1);  // fair dispatch

  console.log(\`Worker \${id} waiting…\`);
  ch.consume('jobs', async (msg) => {
    if (!msg) return;
    const job = JSON.parse(msg.content.toString());
    console.log(\`Worker \${id} processing:\`, job);
    await doWork(job);
    ch.ack(msg);
    console.log(\`Worker \${id} done\`);
  });
}

async function doWork(job: { id: number }) {
  await new Promise(r => setTimeout(r, job.id * 100));
}

// Start 3 competing workers
startWorker(1); startWorker(2); startWorker(3);`,
    },
    {
      label: 'RPC Pattern',
      language: 'typescript',
      code: `import amqplib from 'amqplib';
import { randomUUID } from 'crypto';

// RPC Client
async function rpcCall(input: number): Promise<number> {
  const conn = await amqplib.connect('amqp://localhost');
  const ch   = await conn.createChannel();

  const { queue: replyQ } = await ch.assertQueue('', { exclusive: true });
  const corrId = randomUUID();

  return new Promise((resolve) => {
    ch.consume(replyQ, (msg) => {
      if (msg?.properties.correlationId === corrId) {
        resolve(parseInt(msg.content.toString()));
        conn.close();
      }
    }, { noAck: true });

    ch.sendToQueue('rpc_queue',
      Buffer.from(String(input)),
      { correlationId: corrId, replyTo: replyQ }
    );
  });
}

// RPC Server
async function startServer() {
  const conn = await amqplib.connect('amqp://localhost');
  const ch   = await conn.createChannel();
  await ch.assertQueue('rpc_queue', { durable: false });
  ch.prefetch(1);

  ch.consume('rpc_queue', (msg) => {
    if (!msg) return;
    const n = parseInt(msg.content.toString());
    const result = fibonacci(n);
    ch.sendToQueue(msg.properties.replyTo,
      Buffer.from(String(result)),
      { correlationId: msg.properties.correlationId }
    );
    ch.ack(msg);
  });
}

function fibonacci(n: number): number {
  return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);
}`,
    },
    {
      label: 'Delayed Queue (TTL + DLX)',
      language: 'typescript',
      code: `import amqplib from 'amqplib';

async function setupDelayedQueue(delayMs: number) {
  const conn = await amqplib.connect('amqp://localhost');
  const ch   = await conn.createChannel();

  // Target queue — receives messages after delay expires
  await ch.assertQueue('email.send', { durable: true });

  // Holding queue: messages expire here and route to email.send via DLX
  await ch.assertQueue('email.delay', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange':    '',       // default exchange
      'x-dead-letter-routing-key': 'email.send',
      'x-message-ttl':             delayMs,  // e.g. 60000 = 1 minute
    },
  });

  return ch;
}

async function scheduleEmail(to: string, delayMs: number) {
  const ch = await setupDelayedQueue(delayMs);
  ch.sendToQueue('email.delay',
    Buffer.from(JSON.stringify({ to, subject: 'Reminder' })),
    { persistent: true }
  );
  console.log(\`Email to \${to} scheduled in \${delayMs}ms\`);
}

scheduleEmail('user@example.com', 60_000);`,
    },
  ];

  readonly mistakes: CommonMistake[] = [
    {
      title: 'Missing prefetch in work queue causing uneven load',
      wrong: `// No prefetch — first consumer gets all messages
ch.consume('jobs', async (msg) => {
  await slowJob(msg);
  ch.ack(msg);
});`,
      right: `ch.prefetch(1);  // fair dispatch per consumer
ch.consume('jobs', async (msg) => {
  await slowJob(msg);
  ch.ack(msg);
});`,
      explanation: 'Without prefetch, the broker pre-buffers many messages to the first connected consumer, starving others.'
    },
    {
      title: 'Sharing replyTo queue across RPC clients',
      wrong: `// Single global reply queue — replies from different requests get mixed
await ch.assertQueue('global-reply', { durable: false });
ch.sendToQueue('rpc_queue', payload, { replyTo: 'global-reply' });`,
      right: `// Exclusive auto-delete queue per request
const { queue: replyQ } = await ch.assertQueue('', { exclusive: true });
ch.sendToQueue('rpc_queue', payload, { replyTo: replyQ, correlationId: uuid() });`,
      explanation: 'A shared reply queue causes replies to be consumed by the wrong client. Use exclusive auto-delete queues per call.'
    },
    {
      title: 'Not correlating RPC replies by correlationId',
      wrong: `// Taking any reply from the queue without verifying correlationId
ch.consume(replyQ, (msg) => {
  if (msg) resolve(msg.content.toString()); // could be someone else's reply
});`,
      right: `ch.consume(replyQ, (msg) => {
  if (msg?.properties.correlationId === corrId) {
    resolve(msg.content.toString());
  }
});`,
      explanation: 'In concurrent RPC scenarios, replies may arrive out of order. Always filter by correlationId.'
    },
    {
      title: 'Using TTL delay queue without setting DLX routing key',
      wrong: `await ch.assertQueue('delay', {
  durable: true,
  arguments: { 'x-dead-letter-exchange': 'myexchange', 'x-message-ttl': 5000 },
  // forgot x-dead-letter-routing-key — original key reused
});`,
      right: `await ch.assertQueue('delay', {
  durable: true,
  arguments: {
    'x-dead-letter-exchange':    'myexchange',
    'x-dead-letter-routing-key': 'target-queue', // explicit DLX key
    'x-message-ttl':             5000,
  },
});`,
      explanation: 'Without x-dead-letter-routing-key, the original routing key is used on the DLX, which may not route to the intended target queue.'
    },
  ];

  readonly challenge: Challenge = {
    title: 'Priority Work Queue',
    language: 'typescript',
    description: 'Create a priority queue ("priority-jobs") that supports priorities 1–10 using x-max-priority. Publish 5 jobs with priorities 1, 3, 5, 7, 10. Start one consumer with prefetch(1) and verify that job priority 10 is processed first.',
    hints: [
      'Set x-max-priority in assertQueue arguments',
      'Set priority in message properties when publishing',
      'The consumer should log the job id and priority to verify order',
    ],
    starterCode: `import amqplib from 'amqplib';

async function run() {
  const conn = await amqplib.connect('amqp://localhost');
  const ch   = await conn.createChannel();
  // TODO: priority queue setup, publish, consume
}`,
    solution: `import amqplib from 'amqplib';

async function run() {
  const conn = await amqplib.connect('amqp://localhost');
  const ch   = await conn.createChannel();

  await ch.assertQueue('priority-jobs', {
    durable: true,
    arguments: { 'x-max-priority': 10 },
  });

  // Publish in low→high order; broker should deliver high priority first
  for (const p of [1, 3, 5, 7, 10]) {
    ch.sendToQueue('priority-jobs',
      Buffer.from(JSON.stringify({ id: p, priority: p })),
      { persistent: true, priority: p }
    );
  }
  console.log('Published 5 jobs');

  ch.prefetch(1);
  ch.consume('priority-jobs', (msg) => {
    if (!msg) return;
    const job = JSON.parse(msg.content.toString());
    console.log('Processing priority', job.priority); // expect: 10, 7, 5, 3, 1
    ch.ack(msg);
  });
}
run();`,
  };

  readonly quiz: QuizQuestion[] = [
    { q: 'What prevents a work queue consumer from hoarding all messages?', options: ['exclusive queue', 'prefetch(1)', 'durable=true', 'persistent messages'], answer: 1, explanation: 'prefetch(1) limits the broker to one unacked in-flight message per consumer, enabling fair distribution.' },
    { q: 'In an RPC pattern, what ties a reply to its request?', options: ['replyTo queue name', 'correlationId', 'routing key', 'exchange name'], answer: 1, explanation: 'correlationId is set by the client and echoed by the server in its response; the client matches on it.' },
    { q: 'How does the TTL + DLX pattern implement message scheduling?', options: ['Messages wait in the exchange', 'Messages expire in a holding queue then route via DLX to the real queue', 'A timer republishes the message', 'RabbitMQ stores messages in-memory until ready'], answer: 1, explanation: 'The holding queue has x-message-ttl; expired messages are forwarded to the real queue via the dead-letter exchange.' },
    { q: 'What argument enables per-message priority in RabbitMQ?', options: ['x-priority-max', 'x-max-priority', 'x-message-priority', 'x-priority'], answer: 1, explanation: 'x-max-priority (e.g. 10) must be set on the queue; then each message sets its priority in properties.' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'What is the difference between work queues and pub/sub in RabbitMQ?', a: 'Work queues (competing consumers on one queue) process each message exactly once. Pub/sub (fanout exchange, one queue per consumer) delivers each message to all subscribers.' },
    { q: 'When should I use the rabbitmq-delayed-message-exchange plugin vs. TTL+DLX?', a: 'The plugin is simpler and more accurate for per-message delays via x-delay header. TTL+DLX works without plugins but applies the same delay to all messages in the holding queue, which is a limitation when delays vary per message.' },
    { q: 'Is RPC over AMQP suitable for high-throughput services?', a: 'For moderate throughput, yes. For high-throughput, synchronous request-reply adds latency and connection overhead. Consider async responses via topic events or HTTP/gRPC for latency-sensitive paths.' },
  ];

  readonly revision: RevisionSummary = {
    oneLiner: 'RabbitMQ patterns: work queues for load distribution, RPC for sync reply, TTL+DLX for scheduling.',
    mustKnow: [
      'Work queue: multiple consumers on one queue + prefetch(1) for fair dispatch',
      'RPC: exclusive replyTo queue + correlationId matching for async reply',
      'Delayed message: TTL holding queue + DLX → real processing queue',
      'Priority queue: x-max-priority on queue; priority property on message',
      'correlationId prevents cross-contamination in concurrent RPC calls',
      'TTL+DLX delay is queue-wide; for per-message delays use the delayed-message plugin',
    ],
    interviewFocus: [
      'Work queue pattern: prefetch, fair dispatch, horizontal scaling',
      'RPC over AMQP: replyTo, correlationId, exclusive queue lifecycle',
      'Scheduling without external tools: TTL + dead-letter exchange chain',
      'Priority queues: trade-offs vs. multiple priority queues approach',
    ],
  };
}
