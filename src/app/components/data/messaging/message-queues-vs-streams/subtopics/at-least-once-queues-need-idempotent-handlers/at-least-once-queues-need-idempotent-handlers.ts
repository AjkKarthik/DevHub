import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-mqs-idempotent',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './at-least-once-queues-need-idempotent-handlers.html',
  styleUrl: './at-least-once-queues-need-idempotent-handlers.scss'
})
export class AtLeastOnceQueuesNeedIdempotentHandlersSubtopic {
  topicLabel = 'Queues vs Event Streams';
  topicRoute = '/messaging/message-queues-vs-streams';

  theory: TheoryPoint[] = [
    {
      heading: 'One worker per task is not the same as once per task',
      points: [
        'The main page recommended queues for "guaranteed single-processing" and said queue workers "need exactly-once processing semantics". What a queue guarantees is that each message goes to one consumer at a time. Delivery itself is at-least-once.',
        'The AWS docs say it plainly for SQS standard queues: delivery is at-least-once, and more than one copy of a message might be delivered. RabbitMQ behaves the same way, because a message that was processed but not yet acked when the channel closed is requeued and handled again.',
        'So a queue worker can run the same task twice. Charging a card, sending an email or decrementing stock twice is a bug even though the queue behaved correctly.'
      ]
    },
    {
      heading: 'The fix lives in the handler',
      points: [
        'Give every message a stable id (a business key such as an order id works well) and record processed ids in the same transaction as the side effect. A repeat delivery then finds the id and does nothing.',
        'SQS FIFO adds deduplication on the send side, but the dedup window is five minutes, so it does not replace an idempotent handler for redeliveries after that or for consumer-side retries.',
        'Ack only after the work and the id record are both committed. Acking first turns a crash into a lost message instead of a duplicate.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Naive handler: a redelivery double-charges',
      language: 'typescript',
      code: `interface Payment { id: string; amount: number; }

let charged = 0;

function handle(msg: Payment): void {
  charged += msg.amount;   // the side effect
}

// The broker redelivers m1: the first attempt was processed but the ack never arrived.
[{ id: 'm1', amount: 50 }, { id: 'm1', amount: 50 }].forEach(handle);

console.log(charged);   // 100  <- charged twice for one order`
    },
    {
      label: 'Idempotent handler: dedupe on message id',
      language: 'typescript',
      code: `interface Payment { id: string; amount: number; }

const seen = new Set<string>();   // in production: a table, updated in the same transaction
let charged = 0;

function handle(msg: Payment): string {
  if (seen.has(msg.id)) return 'skipped duplicate';
  charged += msg.amount;
  seen.add(msg.id);
  return 'charged';
}

console.log(handle({ id: 'm1', amount: 50 }));   // charged
console.log(handle({ id: 'm1', amount: 50 }));   // skipped duplicate
console.log(charged);                            // 50`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A worker reads a message, charges the card, writes the message id to a processed table, and only then acks. It crashes after charging but before writing the id. What happens on redelivery, and what small change to the ordering prevents it?',
    hint: 'The dedupe check can only recognise a message whose id was already recorded. What must be true of the charge and the id write?',
    solution: 'The message is redelivered, the id is not in the processed table, so the card is charged a second time. The charge and the id write must succeed or fail together, for example by inserting the id in the same database transaction as the local side effect, or by passing the message id to the payment provider as an idempotency key so the provider deduplicates the charge itself. Ack only after that.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A queue guarantees each message is processed exactly once.',
      reality: 'A queue gives each message to one consumer at a time, but delivery is at-least-once. SQS standard queues can even deliver more than one copy of a message.'
    },
    {
      thought: 'SQS FIFO deduplication makes my handler safe from duplicates.',
      reality: 'FIFO deduplication acts on the send side within a five-minute window. Redeliveries of an unacked or undeleted message and consumer-side retries still need an idempotent handler.'
    },
    {
      thought: 'Acking before processing avoids duplicates.',
      reality: 'It trades duplicates for lost messages: a crash after the ack means the message is gone and the work never happened.'
    }
  ];
}
