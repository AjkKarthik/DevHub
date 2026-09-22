import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-rp-hol',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './per-message-ttl-head-of-line-blocking.html',
  styleUrl: './per-message-ttl-head-of-line-blocking.scss'
})
export class PerMessageTtlHeadOfLineBlockingSubtopic {
  topicLabel = 'RabbitMQ Patterns';
  topicRoute = '/messaging/rabbitmq-patterns';

  theory: TheoryPoint[] = [
    {
      heading: 'Per-message expiration is not a precise timer',
      points: [
        'The page said TTL plus dead-lettering applies one delay to the whole holding queue and that per-message delays need the plugin. There is a middle option: publish each message with the <code>expiration</code> property, a string of milliseconds, and RabbitMQ will expire it individually.',
        'RabbitMQ\'s TTL documentation states the catch for classic queues: an expired message is only discarded (and so dead-lettered) once it reaches the head of the queue. A message behind one with a longer TTL waits for the head to clear first.',
        'That makes a per-message delay a lower bound, not a schedule. A 10 second reminder queued behind a 2 minute one does not fire at 10 seconds.'
      ]
    },
    {
      heading: 'Choosing between the options',
      points: [
        'One holding queue per delay tier (queue-level <code>x-message-ttl</code>) keeps every message in a queue on the same delay, so first in is always first to expire and nothing is held back.',
        'When you set both a queue TTL and a per-message TTL, RabbitMQ uses the lower of the two.',
        'The delayed-message exchange plugin gives a true per-message <code>x-delay</code>, at a price: the delayed messages sit in a Mnesia table on one node, the maximum delay is about 49 days, and the design is not meant for hundreds of thousands of delayed messages.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: when does each message fire?',
      language: 'typescript',
      code: `// Classic queue, no consumer. A message is dead-lettered once it has expired
// AND has reached the head, so it can never leave before the message ahead of it.
type Msg = { id: string; at: number; ttl: number };   // enqueue time and ttl, in seconds

function deadLetterTimes(msgs: Msg[]) {                // msgs in FIFO order
  let prev = 0;
  const out: Record<string, number> = {};
  for (const m of msgs) {
    const t = Math.max(m.at + m.ttl, prev);
    out[m.id] = t;
    prev = t;
  }
  return out;
}

console.log(deadLetterTimes([{ id: 'A', at: 0, ttl: 60 }, { id: 'B', at: 0, ttl: 5 }]));
// { A: 60, B: 60 }   <- B wanted 5s but waited behind A

console.log(deadLetterTimes([{ id: 'B', at: 0, ttl: 5 }, { id: 'A', at: 0, ttl: 60 }]));
// { B: 5, A: 60 }    <- same messages, other order: both on time

console.log(deadLetterTimes([
  { id: 'A', at: 0, ttl: 30 }, { id: 'B', at: 1, ttl: 30 }, { id: 'C', at: 2, ttl: 30 },
]));
// { A: 30, B: 31, C: 32 }   <- same TTL for everyone: expiry order matches queue order`
    },
    {
      label: 'Per-message expiration in amqplib',
      language: 'typescript',
      code: `import amqplib from 'amqplib';

const conn = await amqplib.connect('amqp://localhost');
const ch = await conn.createChannel();
await ch.assertQueue('email.send', { durable: true });

// Holding queue with NO x-message-ttl: each message brings its own expiration.
await ch.assertQueue('email.delay.mixed', {
  durable: true,
  arguments: { 'x-dead-letter-exchange': '', 'x-dead-letter-routing-key': 'email.send' },
});

// expiration is a STRING of milliseconds.
ch.sendToQueue('email.delay.mixed', Buffer.from('long'),  { expiration: '120000' });
ch.sendToQueue('email.delay.mixed', Buffer.from('short'), { expiration: '10000' });
// 'short' is only dead-lettered after 'long' leaves the head: about 120s, not 10s.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A holding queue with no queue-level TTL receives message X with <code>expiration: "120000"</code> and, immediately after, message Y with <code>expiration: "10000"</code>. On a classic queue, roughly when is Y dead-lettered, and how would you get Y out at about 10 seconds?',
    hint: 'Only messages at the head of a classic queue are expired and dead-lettered.',
    solution: 'Y is dead-lettered at about 120 seconds, when X expires and leaves the head, not at 10 seconds. To get Y out on time, put messages with different delays in different holding queues (one queue per delay tier with a queue-level TTL), or use the delayed-message exchange plugin, accepting its limits.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A message with a 5 second expiration is dead-lettered after 5 seconds wherever it sits in the queue.',
      reality: 'On classic queues an expired message is only discarded when it reaches the head, so a longer-lived message ahead of it holds it back.'
    },
    {
      thought: 'Queue-level TTL has the same problem, because expiry is checked only at the head.',
      reality: 'When every message shares one TTL and the queue is FIFO, the message at the head is always the oldest and the next to expire, so no message is held back by a slower one.'
    },
    {
      thought: 'If I set both a queue TTL and a per-message expiration, the queue TTL wins.',
      reality: 'RabbitMQ picks the lower of the two values.'
    }
  ];
}
