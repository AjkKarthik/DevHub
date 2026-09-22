import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-rx-mandatory',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './mandatory-and-alternate-exchange.html',
  styleUrl: './mandatory-and-alternate-exchange.scss'
})
export class MandatoryAndAlternateExchangeSubtopic {
  topicLabel = 'RabbitMQ Exchanges';
  topicRoute = '/messaging/rabbitmq-exchanges';

  theory: TheoryPoint[] = [
    {
      heading: 'Two ways to deal with an unroutable message',
      points: [
        'When a message reaches an existing exchange but no queue matches, the default is that it is discarded. The quiz offered "Returned to producer" as a wrong answer, and by default it is: a return only happens when the publisher sets the <code>mandatory</code> flag.',
        'With <code>mandatory: true</code> the broker sends the message back and the publisher must have a return handler to receive it. In amqplib that is the channel <code>return</code> event, whose payload carries the message content, fields and properties.',
        'An alternate exchange takes a different route: the exchange hands messages it cannot route to another exchange, which can queue them for inspection. It is set when the exchange is declared (amqplib\'s <code>alternateExchange</code> option, the <code>x-alternate-exchange</code> argument).'
      ]
    },
    {
      heading: 'How the two interact',
      points: [
        'RabbitMQ\'s alternate exchange guide says a message routed via an alternate exchange still counts as routed for the purpose of the mandatory flag. So if the alternate exchange has a queue that takes the message, the publisher gets no return.',
        'Alternate exchanges can chain: if one cannot route the message it passes it to its own alternate exchange, until the message is routed or the chain ends.',
        'Do not read a return as a delivery report. It only tells you routing found no queue; whether a consumer ever handles a routed message is a separate question for publisher confirms and consumer acks.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: dropped, returned or caught',
      language: 'typescript',
      code: `type Ex = { bindings: { key: string; q: string }[]; ae?: string };
const ex: Record<string, Ex> = {
  orders:   { bindings: [{ key: 'order.created', q: 'orders-q' }], ae: 'unrouted' },
  plain:    { bindings: [{ key: 'order.created', q: 'orders-q' }] },
  unrouted: { bindings: [{ key: 'order.unknown', q: 'unrouted-q' }] },
};

function route(name: string, key: string, seen = new Set<string>()): string[] {
  if (seen.has(name)) return [];
  seen.add(name);
  const e = ex[name];
  const hits = e.bindings.filter(b => b.key === key).map(b => b.q);
  if (hits.length) return hits;
  return e.ae ? route(e.ae, key, seen) : [];    // alternate exchange gets a try
}

function publish(name: string, key: string, mandatory: boolean) {
  const queues = route(name, key);
  if (queues.length) return 'routed to ' + queues.join(',');
  return mandatory ? 'RETURNED via basic.return' : 'dropped silently';
}

console.log(publish('plain',  'order.updated', false)); // dropped silently
console.log(publish('plain',  'order.updated', true));  // RETURNED via basic.return
console.log(publish('orders', 'order.unknown', true));  // routed to unrouted-q   (AE caught it, no return)
console.log(publish('orders', 'order.updated', true));  // RETURNED via basic.return (AE could not route it either)`
    },
    {
      label: 'In amqplib',
      language: 'typescript',
      code: `import amqplib from 'amqplib';

const conn = await amqplib.connect('amqp://localhost');
const ch = await conn.createChannel();

// Catch-all for anything the main exchange cannot route.
await ch.assertExchange('unrouted', 'fanout', { durable: true });
await ch.assertQueue('unrouted-q', { durable: true });
await ch.bindQueue('unrouted-q', 'unrouted', '');

await ch.assertExchange('orders', 'direct', { durable: true, alternateExchange: 'unrouted' });

// mandatory: the broker returns anything that could not be routed at all.
ch.on('return', (msg) => console.warn('unroutable:', msg.fields.routingKey));
ch.publish('orders', 'order.unknown', Buffer.from('x'), { mandatory: true });`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'An <code>orders</code> exchange has an alternate exchange <code>unrouted</code> with a queue bound to it. A publisher sends a message with <code>mandatory: true</code> that matches no binding on <code>orders</code> but is accepted by the queue on <code>unrouted</code>. Does the publisher receive a return?',
    hint: 'Ask whether a message routed via an alternate exchange still counts as routed.',
    solution: 'No return. RabbitMQ counts a message routed via an alternate exchange as routed for the mandatory flag, so the message lands in the queue on unrouted and the return handler never fires. A return would only happen if nothing in the alternate exchange chain could route the message either.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Unroutable messages are returned to the producer.',
      reality: 'By default they are discarded, or sent to an alternate exchange if one is configured. The publisher only gets a return when it sets <code>mandatory</code> and has a return handler.'
    },
    {
      thought: 'Setting both <code>mandatory</code> and an alternate exchange means every unroutable message is both returned and diverted.',
      reality: 'A message the alternate exchange routes counts as routed, so it is not returned. The return only fires when nothing routes the message.'
    },
    {
      thought: 'If a message was not returned, a consumer must have handled it.',
      reality: 'Not being returned only means it reached at least one queue. Whether it was persisted, confirmed, or consumed is decided by publisher confirms, durability, and consumer acks.'
    }
  ];
}
