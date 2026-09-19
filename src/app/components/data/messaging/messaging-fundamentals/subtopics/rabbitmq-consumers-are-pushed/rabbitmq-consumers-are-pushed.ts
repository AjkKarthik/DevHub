import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-fund-rabbitmq-push',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './rabbitmq-consumers-are-pushed.html',
  styleUrl: './rabbitmq-consumers-are-pushed.scss'
})
export class RabbitmqConsumersArePushedSubtopic {
  topicLabel = 'Messaging Fundamentals';
  topicRoute = '/messaging/messaging-fundamentals';

  theory: TheoryPoint[] = [
    {
      heading: 'RabbitMQ pushes, and polling is the discouraged exception',
      points: [
        'Verified against the RabbitMQ consumers guide: consumers are push-based. An application subscribes with <code>basic.consume</code> and the broker pushes deliveries to it, invoking your handler for each one.',
        '<code>basic.get</code> is the polling alternative. The same guide calls fetching messages one by one highly inefficient and recommends against it outside integration tests, favoring long-lived consumers.',
        'The main page\'s QnA listed "RabbitMQ poll" under pull delivery, next to SQS and Kafka. That was wrong, and it contradicted the page\'s own codeTab, which correctly uses <code>ch.consume</code> with <code>ch.prefetch(1)</code>.'
      ]
    },
    {
      heading: 'Push with built-in flow control',
      points: [
        'The QnA said push delivery means the subscriber "must handle burst load". For RabbitMQ that overlooks prefetch: it limits how many unacknowledged deliveries can be in flight to a push consumer using manual acknowledgements.',
        'Once the limit is reached the broker holds further deliveries until the consumer acks some, so a slow consumer is not flooded. Prefetch is a non-issue for <code>basic.get</code>, where the client fetches each message itself.',
        'Push brokers that send to an external endpoint (SNS, EventBridge, webhooks) do not have this per-consumer in-flight cap, which is why the original bullet is right about them.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'consume (push) vs get (poll)',
      language: 'typescript',
      code: `// PUSH (recommended): subscribe once, the broker delivers
ch.prefetch(10);                    // at most 10 unacked deliveries in flight
await ch.consume('orders', async (msg) => {
  if (!msg) return;
  await handle(msg);
  ch.ack(msg);                      // acking frees a slot -> the broker sends the next one
});

// PULL (discouraged): one request per message
const polled = await ch.get('orders', { noAck: false });
if (polled) {                       // false when the queue is empty
  await handle(polled);
  ch.ack(polled);
}`
    },
    {
      label: 'Who initiates delivery',
      language: 'typescript',
      code: `// Who starts each delivery?
//   RabbitMQ  basic.consume        -> broker PUSHES  (prefetch caps in-flight deliveries)
//   RabbitMQ  basic.get            -> client PULLS   (one request per message, discouraged)
//   Kafka     consumer poll        -> client PULLS   (fetches at its own pace)
//   SQS       ReceiveMessage       -> client PULLS   (long polling optional)
//   SNS / EventBridge / webhooks   -> broker PUSHES to the subscriber endpoint`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues: "RabbitMQ is pull-based, so a slow consumer can never be flooded." Using what you know about basic.consume, what is wrong with that claim, and which setting protects a slow consumer?',
    hint: 'Who starts each delivery when a consumer is registered with basic.consume, and what caps how many can be outstanding?',
    solution: 'Consumers registered with basic.consume are push-based, so the broker keeps delivering on its own. A slow consumer is protected by the prefetch limit, which caps unacknowledged deliveries in flight; the broker stops sending until the consumer acks some of them.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'RabbitMQ consumers poll the broker for messages, like SQS.',
      reality: 'Consumers registered with <code>basic.consume</code> are pushed deliveries by the broker. Polling with <code>basic.get</code> exists but is strongly discouraged.'
    },
    {
      thought: 'Push delivery means a slow consumer will always be flooded with messages.',
      reality: 'With manual acknowledgements, <code>prefetch</code> caps the unacknowledged deliveries in flight, so the broker pauses delivery until the consumer acks.'
    },
    {
      thought: '<code>basic.get</code> is just the low-level version of consume and works equally well.',
      reality: 'The RabbitMQ docs call polling with basic.get highly inefficient and recommend it only for integration tests, preferring long-lived consumers.'
    }
  ];

  prev: SubtopicLink | null = { label: 'nack With requeue=false Discards Messages Unless a DLX Exists', route: '/messaging/messaging-fundamentals/nack-without-dlx-discards' };
  next: SubtopicLink | null = { label: 'SQS FIFO Deduplication Only Covers a Five-Minute Send Window', route: '/messaging/messaging-fundamentals/sqs-fifo-dedup-five-minute-window' };
}
