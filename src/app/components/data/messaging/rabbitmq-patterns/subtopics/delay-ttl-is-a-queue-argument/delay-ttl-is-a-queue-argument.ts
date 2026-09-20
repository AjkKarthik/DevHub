import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-rp-ttlarg',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './delay-ttl-is-a-queue-argument.html',
  styleUrl: './delay-ttl-is-a-queue-argument.scss'
})
export class DelayTtlIsAQueueArgumentSubtopic {
  topicLabel = 'RabbitMQ Patterns';
  topicRoute = '/messaging/rabbitmq-patterns';

  theory: TheoryPoint[] = [
    {
      heading: 'The bug in the original delayed-queue sample',
      points: [
        'The Delayed Queue example took a <code>delayMs</code> parameter, passed it as <code>x-message-ttl</code> to a queue with a fixed name, and called that setup on every <code>scheduleEmail</code> call. The first call works. A second call with a different delay declares the same queue with a different argument.',
        'RabbitMQ\'s queue documentation says redeclaring a queue with different optional arguments raises a channel-level exception with code 406 (<code>PRECONDITION_FAILED</code>). So the sample worked for one delay and broke for the second, which contradicted the page\'s own claim that you can schedule delays this way.',
        'The fix is to treat the delay as part of the queue\'s identity: name the holding queue after its delay, for example <code>email.delay.60000</code>, so each delay tier declares its own queue once and re-declaring it with the same arguments is harmless.'
      ]
    },
    {
      heading: 'What this means for the pattern',
      points: [
        'A queue-level <code>x-message-ttl</code> gives every message in that queue the same delay. Several delays therefore mean several holding queues, all dead-lettering into the same target queue.',
        'The queue documentation also says the message TTL can be changed after declaration through a policy instead of application code. That changes the TTL of the whole queue, so it suits tuning one delay tier, not giving individual messages different delays.',
        'To let each message carry its own delay you need per-message expiration, which has its own catch on classic queues: see the next subtopic.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: the second delay fails',
      language: 'typescript',
      code: `class Broker {
  queues = new Map<string, object>();
  assertQueue(name: string, args: object) {
    const existing = this.queues.get(name);
    if (existing && JSON.stringify(existing) !== JSON.stringify(args))
      throw new Error("PRECONDITION_FAILED - inequivalent arg 'x-message-ttl' for queue '" + name + "'");
    this.queues.set(name, args);
  }
}

// Original sample: one fixed queue name, TTL passed in per call.
const b = new Broker();
const oldSchedule = (delayMs: number) => b.assertQueue('email.delay', { 'x-message-ttl': delayMs });
oldSchedule(60000);
try { oldSchedule(5000); } catch (e) { console.log((e as Error).message); }
// PRECONDITION_FAILED - inequivalent arg 'x-message-ttl' for queue 'email.delay'

// Fixed: the queue name carries the delay.
const b2 = new Broker();
const newSchedule = (delayMs: number) => {
  const q = 'email.delay.' + delayMs;
  b2.assertQueue(q, { 'x-message-ttl': delayMs });
  return q;
};
console.log(newSchedule(60000), newSchedule(5000), newSchedule(60000));
// email.delay.60000 email.delay.5000 email.delay.60000   (repeat declarations are fine)`
    },
    {
      label: 'One holding queue per delay tier',
      language: 'typescript',
      code: `import amqplib from 'amqplib';

const conn = await amqplib.connect('amqp://localhost');
const ch = await conn.createChannel();
await ch.assertQueue('email.send', { durable: true });

const TIERS = [60_000, 600_000, 3_600_000];      // 1 min, 10 min, 1 hour

for (const ms of TIERS) {
  await ch.assertQueue('email.delay.' + ms, {
    durable: true,
    arguments: {
      'x-message-ttl':             ms,
      'x-dead-letter-exchange':    '',            // default exchange
      'x-dead-letter-routing-key': 'email.send',  // into the real work queue
    },
  });
}

function scheduleEmail(to: string, tierMs: number) {
  ch.sendToQueue('email.delay.' + tierMs, Buffer.from(JSON.stringify({ to })), { persistent: true });
}
scheduleEmail('user@example.com', 600_000);`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Reminders must fire after 1 minute, 10 minutes or 1 hour. Using only queue-level TTL and dead-lettering, how many holding queues do you declare, what differs between them, and what do they share?',
    hint: 'The TTL is a queue argument, and re-declaring a queue name with a different argument is an error.',
    solution: 'Declare three holding queues, for example email.delay.60000, email.delay.600000 and email.delay.3600000. They differ only in x-message-ttl (and therefore their names). All three share the same x-dead-letter-exchange and x-dead-letter-routing-key pointing at the real email.send queue. The producer chooses the holding queue that matches the delay it wants.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'I can pass a different <code>x-message-ttl</code> each time I declare the same queue name.',
      reality: 'Redeclaring an existing queue with different optional arguments raises a channel exception (406 <code>PRECONDITION_FAILED</code>). The delay has to be part of the queue name, one queue per delay.'
    },
    {
      thought: 'A queue-level TTL can be different for each message in that queue.',
      reality: 'It applies to every message in the queue. Different delays per message need either several queues or the per-message expiration property.'
    },
    {
      thought: 'Changing a queue TTL means deleting and re-declaring the queue.',
      reality: 'RabbitMQ documents that message TTL can be changed through a policy after declaration, which retunes that whole queue without touching application code.'
    }
  ];
}
