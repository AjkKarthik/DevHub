import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-rc-quorum',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './quorum-queues-replace-mirrored-queues.html',
  styleUrl: './quorum-queues-replace-mirrored-queues.scss'
})
export class QuorumQueuesReplaceMirroredQueuesSubtopic {
  topicLabel = 'RabbitMQ Core Concepts';
  topicRoute = '/messaging/rabbitmq-core';

  theory: TheoryPoint[] = [
    {
      heading: 'Which queues are replicated today',
      points: [
        'The main page grouped "mirrored/quorum queues" as the way to survive a node crash. Per the RabbitMQ quorum queues guide, classic queue mirroring was removed starting with RabbitMQ 4.0, and quorum queues and streams are the two replicated data structures available.',
        'On a current broker, replicating a work queue therefore means declaring it with <code>x-queue-type: quorum</code>, not configuring a mirroring policy.',
        'The same guide states that messages published to a quorum queue are persisted on disk regardless of their delivery mode, so marking them persistent is harmless but no longer what keeps them across a restart.'
      ]
    },
    {
      heading: 'A built-in retry ceiling',
      points: [
        'Quorum queues track unsuccessful delivery attempts and expose the count in the <code>x-delivery-count</code> header on any redelivered message. The Challenge in the main page tracks its own <code>x-retry</code> header by republishing instead.',
        'The <code>x-delivery-limit</code> queue argument sets how many redeliveries are allowed. Starting with RabbitMQ 4.0 the default is 20, and <code>-1</code> disables the limit. When a message has been redelivered more times than the limit it is dropped, or dead-lettered if a dead letter exchange is configured.',
        'Because the limit counts redeliveries and the first delivery is not one, a limit of N allows up to N + 1 deliveries in total. Disabling the limit brings back the endless requeue loop described in the fourth mistake block.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Declare a quorum queue with a delivery limit',
      language: 'typescript',
      code: `import amqplib from 'amqplib';

const conn = await amqplib.connect('amqp://localhost');
const ch = await conn.createChannel();

await ch.assertExchange('orders.dlx', 'fanout', { durable: true });
await ch.assertQueue('orders.dead', { durable: true });
await ch.bindQueue('orders.dead', 'orders.dlx', '');

await ch.assertQueue('orders', {
  durable: true,
  arguments: {
    'x-queue-type': 'quorum',              // replicated across nodes
    'x-delivery-limit': 5,                 // at most 5 redeliveries, then dead-lettered
    'x-dead-letter-exchange': 'orders.dlx',
  },
});

ch.consume('orders', (msg) => {
  if (!msg) return;
  const count = msg.properties.headers?.['x-delivery-count'] ?? 0;   // set by the broker on redelivery
  console.log('delivery count so far:', count);
  ch.nack(msg, false, true);               // requeue: the broker, not our code, ends the loop
}, { noAck: false });`
    },
    {
      label: 'Model: the delivery limit',
      language: 'typescript',
      code: `// The consumer nacks with requeue=true every time.
function quorumDeliveries(limit: number) {
  let deliveries = 0;
  let redeliveries = 0;
  for (;;) {
    deliveries++;
    redeliveries++;                          // this nack requeues, so the next delivery is a redelivery
    if (redeliveries > limit) return { deliveries, outcome: 'dead-lettered or dropped' };
  }
}

console.log(quorumDeliveries(20));  // { deliveries: 21, outcome: 'dead-lettered or dropped' }  (4.0 default)
console.log(quorumDeliveries(3));   // { deliveries: 4,  outcome: 'dead-lettered or dropped' }`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team runs RabbitMQ 4.1 and keeps a classic queue with a mirroring policy for its order queue. They also hand-roll a retry counter. What should they change on a current broker, and which built-in feature could replace the hand-rolled counter?',
    hint: 'Which replicated queue type exists in 4.x, and which queue argument bounds redeliveries?',
    solution: 'Classic queue mirroring was removed in RabbitMQ 4.0, so the order queue should be a quorum queue (or a stream, if replay is wanted), declared with x-queue-type quorum. Its x-delivery-limit argument (default 20 in 4.0; the value -1 disables it) combined with an x-dead-letter-exchange gives a broker-enforced retry ceiling, and the x-delivery-count header exposes the attempt count, so the hand-rolled counter is no longer needed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Mirrored queues are still the standard way to replicate a RabbitMQ queue.',
      reality: 'Classic queue mirroring was removed starting with RabbitMQ 4.0. Quorum queues and streams are the replicated data structures.'
    },
    {
      thought: 'A quorum queue needs <code>persistent: true</code> on each message to survive a restart.',
      reality: 'Messages published to a quorum queue are persisted on disk regardless of delivery mode, so the flag is not what protects them.'
    },
    {
      thought: 'A delivery limit of N means a message is delivered exactly N times.',
      reality: 'The limit counts redeliveries, and the first delivery is not a redelivery, so a message can be delivered up to N + 1 times. Setting the limit to -1 disables it entirely.'
    }
  ];
}
