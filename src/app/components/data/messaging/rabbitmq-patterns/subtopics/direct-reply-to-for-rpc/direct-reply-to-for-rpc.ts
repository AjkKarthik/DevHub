import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-rp-direct',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './direct-reply-to-for-rpc.html',
  styleUrl: './direct-reply-to-for-rpc.scss'
})
export class DirectReplyToForRpcSubtopic {
  topicLabel = 'RabbitMQ Patterns';
  topicRoute = '/messaging/rabbitmq-patterns';

  theory: TheoryPoint[] = [
    {
      heading: 'RPC without declaring a reply queue',
      points: [
        'The RPC code example declares a server-named exclusive queue for replies on every call, and a mistake block warns about sharing one reply queue. RabbitMQ has a built-in alternative, direct reply-to, that removes the queue declaration entirely.',
        'The requester consumes from the pseudo-queue <code>amq.rabbitmq.reply-to</code> in no-ack mode, then publishes the request with its <code>replyTo</code> set to <code>amq.rabbitmq.reply-to</code>. RabbitMQ rewrites <code>replyTo</code> to a unique name ending in an opaque suffix before the responder sees it.',
        'The responder needs no change: it publishes the reply to the default exchange using that <code>replyTo</code> value as the routing key, exactly what <code>sendToQueue(msg.properties.replyTo, ...)</code> already does. Keep matching replies with <code>correlationId</code>.'
      ]
    },
    {
      heading: 'The rules and the trade-off',
      points: [
        'According to the RabbitMQ docs, the requester must consume in automatic acknowledgement mode, and it must use the same connection and channel to both consume from the pseudo-queue and publish the request.',
        'The trade-off is durability: replies sent this way are not fault-tolerant and are dropped if the client that published the request disconnects. The requester is expected to reconnect and resubmit the request, which fits RPC because a caller with a timeout has to handle a lost reply anyway.',
        'Use the classic per-call exclusive queue when you need the reply to survive on a queue independent of the requester\'s channel; use direct reply-to when you want fewer moving parts and lower per-call overhead.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Requester with direct reply-to',
      language: 'typescript',
      code: `import amqplib from 'amqplib';
import { randomUUID } from 'crypto';

const conn = await amqplib.connect('amqp://localhost');
const ch = await conn.createChannel();       // the SAME channel consumes and publishes
const corrId = randomUUID();

// 1. Consume the pseudo-queue first, in no-ack mode (required).
await ch.consume('amq.rabbitmq.reply-to', (msg) => {
  if (msg?.properties.correlationId === corrId) {
    console.log('reply:', msg.content.toString());
  }
}, { noAck: true });

// 2. Publish the request with replyTo set to the pseudo-queue.
ch.sendToQueue('rpc_queue', Buffer.from('10'), {
  correlationId: corrId,
  replyTo: 'amq.rabbitmq.reply-to',
});

// The responder is unchanged:
// ch.sendToQueue(msg.properties.replyTo, Buffer.from(String(result)), { correlationId: ... })`
    },
    {
      label: 'Model: how the reply finds its way back',
      language: 'typescript',
      code: `class Rabbit {
  channels = new Map<string, { open: boolean; got: string[] }>();

  publishRequest(chId: string, replyTo: string, body: string) {
    const suffix = 'g1h2AAA' + chId;                       // opaque in reality
    const rewritten = replyTo === 'amq.rabbitmq.reply-to' ? 'amq.rabbitmq.reply-to.' + suffix : replyTo;
    return { body, replyTo: rewritten };
  }
  publishToDefault(key: string, body: string) {             // what the responder does
    const chId = key.replace('amq.rabbitmq.reply-to.g1h2AAA', '');
    const ch = this.channels.get(chId);
    return ch && ch.open ? (ch.got.push(body), 'delivered to channel ' + chId) : 'dropped: requester gone';
  }
}

const r = new Rabbit();
r.channels.set('7', { open: true, got: [] });
const req = r.publishRequest('7', 'amq.rabbitmq.reply-to', '10');
console.log(req);                                // { body: '10', replyTo: 'amq.rabbitmq.reply-to.g1h2AAA7' }
console.log(r.publishToDefault(req.replyTo, '55'));   // delivered to channel 7
r.channels.get('7')!.open = false;                    // requester disconnects
console.log(r.publishToDefault(req.replyTo, '55'));   // dropped: requester gone`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A requester consumes <code>amq.rabbitmq.reply-to</code> on channel 1 with <code>noAck: false</code> and publishes its requests on channel 2. Which of the direct reply-to rules does this break, and what do you change?',
    hint: 'Two rules: how the pseudo-queue is consumed, and which channel does the consuming and publishing.',
    solution: 'It breaks both rules. Consuming must be in no-ack (automatic acknowledgement) mode, so set noAck to true. And the same connection and channel must be used to consume from the pseudo-queue and to publish the request, so publish on channel 1 (or consume on channel 2). Consume first, then publish.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Direct reply-to is a normal queue named <code>amq.rabbitmq.reply-to</code> that I declare.',
      reality: 'It is a pseudo-queue you consume from. RabbitMQ rewrites the <code>replyTo</code> property to a unique name, and the responder replies to that name through the default exchange.'
    },
    {
      thought: 'Replies over direct reply-to are as durable as any queued message.',
      reality: 'They are dropped if the requester that published the request disconnects. The requester is expected to reconnect and resubmit.'
    },
    {
      thought: 'I can consume the reply with manual acks like any other consumer.',
      reality: 'The requester must consume in no-ack mode, and must use the same channel for consuming and for publishing the request.'
    }
  ];
}
