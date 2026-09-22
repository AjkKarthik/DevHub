import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-fund-nack-dlx',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './nack-without-dlx-discards.html',
  styleUrl: './nack-without-dlx-discards.scss'
})
export class NackWithoutDlxDiscardsSubtopic {
  topicLabel = 'Messaging Fundamentals';
  topicRoute = '/messaging/messaging-fundamentals';

  theory: TheoryPoint[] = [
    {
      heading: 'Where a rejected message actually goes',
      points: [
        'Verified against the RabbitMQ acknowledgements guide: when a consumer rejects a message with <code>basic.reject</code> or <code>basic.nack</code> and requeue set to false, the message is routed to a dead letter exchange if one is configured, and otherwise it is discarded.',
        'The main page\'s codeTab declared the orders queue as <code>{ durable: true }</code> with no <code>x-dead-letter-exchange</code> argument, yet its comment said <code>nack(msg, false, false)</code> "sends to DLQ". As originally written, a failing order was silently thrown away.',
        'The mistake block also said that without a DLQ poison messages "block the queue forever". That describes requeue set to true, where the message is redelivered again and again. With requeue set to false and no dead letter exchange the message is simply gone.'
      ]
    },
    {
      heading: 'Both halves of the fix',
      points: [
        'A dead letter exchange and a queue bound to it must exist, and the source queue must name that exchange with the <code>x-dead-letter-exchange</code> argument (a policy can supply it instead).',
        'Every place that declares the source queue must use the same arguments. RabbitMQ rejects a re-declaration whose arguments differ from the existing queue, which is why the corrected codeTab shares one arguments constant between producer and consumer.',
        'Three outcomes to keep straight for a failed message: requeue true (redelivered, loop risk), requeue false with a dead letter exchange (kept for inspection), requeue false without one (discarded).'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Three nack outcomes',
      language: 'typescript',
      code: `// ch.nack(message, allUpTo, requeue)
ch.nack(msg, false, true);   // requeue = true             -> back on the queue, redelivered (loop risk)
ch.nack(msg, false, false);  // requeue = false + DLX set  -> routed to the dead letter exchange
ch.nack(msg, false, false);  // requeue = false, NO DLX    -> discarded`
    },
    {
      label: 'Declaring the queue with a DLX',
      language: 'typescript',
      code: `import amqp from 'amqplib';

const conn = await amqp.connect('amqp://localhost');
const ch = await conn.createChannel();

// 1. The dead letter exchange and a queue bound to it.
//    fanout ignores the routing key, so rejected messages always land in orders.dead
await ch.assertExchange('dlx', 'fanout', { durable: true });
await ch.assertQueue('orders.dead', { durable: true });
await ch.bindQueue('orders.dead', 'dlx', '');

// 2. The source queue names the DLX. Use these exact arguments everywhere
//    the queue is declared (producer and consumer).
await ch.assertQueue('orders', {
  durable: true,
  arguments: { 'x-dead-letter-exchange': 'dlx' },
});`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A worker calls <code>ch.nack(msg, false, false)</code> for orders that fail validation. Weeks later the team notices failed orders are simply missing, and the dead-letter queue is empty. What is the most likely cause?',
    hint: 'What does RabbitMQ do with a message rejected with requeue set to false when nothing is configured to receive it?',
    solution: 'The source queue was declared without an x-dead-letter-exchange argument (or a policy providing one), so nothing was set up to receive rejected messages. RabbitMQ discards a message rejected with requeue false when no dead letter exchange applies. Fix: declare a dead letter exchange and a bound queue, and declare the source queue with the x-dead-letter-exchange argument, identically everywhere it is declared.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>nack(msg, false, false)</code> always sends the message to a dead-letter queue.',
      reality: 'It only does so when a dead letter exchange is configured for the queue. Otherwise RabbitMQ discards the message.'
    },
    {
      thought: 'Without a DLQ, a rejected poison message blocks the queue forever.',
      reality: 'That is what happens with requeue set to true, where the message keeps coming back. With requeue false and no dead letter exchange it is discarded, so it vanishes instead of looping.'
    },
    {
      thought: 'Adding the dead-letter argument in the consumer\'s queue declaration is enough on its own.',
      reality: 'The exchange and a bound queue must exist too, and RabbitMQ rejects a re-declaration whose arguments differ from the existing queue, so producer and consumer must declare it identically.'
    }
  ];

  next: SubtopicLink | null = { label: 'RabbitMQ Consumers Are Pushed To, Not Polled', route: '/messaging/messaging-fundamentals/rabbitmq-consumers-are-pushed' };
}
