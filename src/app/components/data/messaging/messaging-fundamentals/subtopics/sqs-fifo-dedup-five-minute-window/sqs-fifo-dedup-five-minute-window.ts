import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-fund-sqs-fifo-dedup',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sqs-fifo-dedup-five-minute-window.html',
  styleUrl: './sqs-fifo-dedup-five-minute-window.scss'
})
export class SqsFifoDedupFiveMinuteWindowSubtopic {
  topicLabel = 'Messaging Fundamentals';
  topicRoute = '/messaging/messaging-fundamentals';

  theory: TheoryPoint[] = [
    {
      heading: 'What SQS FIFO deduplication really covers',
      points: [
        'Verified against the SQS developer guide: FIFO queues do not introduce duplicate messages and help you avoid <em>sending</em> duplicates to a queue. If you retry <code>SendMessage</code> within the 5-minute deduplication interval, SQS does not add a duplicate.',
        'That is a send-side guarantee over a bounded window. A retry that arrives after the 5 minutes have passed is not recognized as a duplicate; it is a new message.',
        'The main page listed SQS FIFO alongside Kafka transactions as offering exactly-once "at extra cost", with no scope. The qualified version is what the docs promise: deduplicated sends inside a 5-minute window.'
      ]
    },
    {
      heading: 'Details that change the outcome',
      points: [
        'With content-based deduplication, SQS derives the deduplication ID from a SHA-256 hash of the message body. The docs state that message attributes are not part of that hash, so two sends with identical bodies but different attributes get the same deduplication ID.',
        'Explicit deduplication IDs give you control: use a stable business identifier such as the order ID, so every retry of the same logical event carries the same ID.',
        'Deduplicating the send does not make the consumer safe. If a consumer processes a message but fails before deleting it, the message becomes visible again and is redelivered, so consumers still need to be idempotent.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Send with a stable dedup ID',
      language: 'typescript',
      code: `import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({});

await sqs.send(new SendMessageCommand({
  QueueUrl: ORDERS_FIFO_URL,          // the queue name must end in .fifo
  MessageBody: JSON.stringify(order),
  MessageGroupId: order.customerId,   // ordering scope
  MessageDeduplicationId: order.id,   // same id on every retry -> dropped inside the 5-minute window
}));`
    },
    {
      label: 'Simplified window model',
      language: 'typescript',
      code: `// A simplified model of the 5-minute rule (not SQS internals).
const WINDOW_MS = 5 * 60 * 1000;
const seen = new Map<string, number>();   // dedup id -> time it was accepted

function send(dedupId: string, now: number): 'accepted' | 'dropped-as-duplicate' {
  const first = seen.get(dedupId);
  if (first !== undefined && now - first < WINDOW_MS) return 'dropped-as-duplicate';
  seen.set(dedupId, now);
  return 'accepted';
}

send('order-1', 0);            // 'accepted'
send('order-1', 4 * 60_000);   // 'dropped-as-duplicate'  (retry inside the window)
send('order-1', 6 * 60_000);   // 'accepted'              (window elapsed: the duplicate gets through)`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A payment worker sends <code>MessageDeduplicationId: order.id</code> to a FIFO queue. After a network outage the producer retries the same order 20 minutes after the first send. Does SQS drop the retry, and what protects the payment from being applied twice?',
    hint: 'How long does the deduplication interval last, and what does the queue do with an ID it no longer remembers?',
    solution: 'No. The 5-minute deduplication interval has passed, so the retry is accepted as a new message. Protection has to come from an idempotent consumer, for example a unique constraint or a dedup store keyed by the order id that is checked before the payment is applied.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'SQS FIFO guarantees exactly-once processing end to end.',
      reality: 'Its deduplication covers duplicate sends within a 5-minute interval. Retries after that, and redeliveries caused by a consumer failing before it deletes the message, are not covered.'
    },
    {
      thought: 'Content-based deduplication takes message attributes into account.',
      reality: 'The deduplication ID is a SHA-256 hash of the message body only, so identical bodies with different attributes are treated as duplicates.'
    },
    {
      thought: 'Using a FIFO queue means my consumer no longer needs to be idempotent.',
      reality: 'A message can still be delivered again after a consumer failure or a late producer retry, so idempotent consumers remain the safe design.'
    }
  ];

  prev: SubtopicLink | null = { label: 'RabbitMQ Consumers Are Pushed To, Not Polled', route: '/messaging/messaging-fundamentals/rabbitmq-consumers-are-pushed' };
}
