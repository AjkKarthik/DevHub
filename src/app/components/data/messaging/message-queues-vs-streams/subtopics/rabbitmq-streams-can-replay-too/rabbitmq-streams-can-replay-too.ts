import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-mqs-rmq-streams',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './rabbitmq-streams-can-replay-too.html',
  styleUrl: './rabbitmq-streams-can-replay-too.scss'
})
export class RabbitmqStreamsCanReplayTooSubtopic {
  topicLabel = 'Queues vs Event Streams';
  topicRoute = '/messaging/message-queues-vs-streams';

  theory: TheoryPoint[] = [
    {
      heading: 'RabbitMQ is not only a queue broker any more',
      points: [
        'The main page files RabbitMQ under classic queues and a quiz question offered plain "RabbitMQ" as a system that cannot replay. That was true of classic queues. RabbitMQ 3.9 (2021) added streams, which the RabbitMQ docs describe as an append-only log with non-destructive consumer semantics.',
        'On a stream, consumers read the same messages as many times as they want until the messages expire, and any number of consumers can read the same data independently. That is the same model the page attributes to Kafka topics.',
        'So the queue versus stream split is a property of the data structure, not of the product. One RabbitMQ broker can host both.'
      ]
    },
    {
      heading: 'How a stream is declared and consumed over AMQP 0.9.1',
      points: [
        'Declare it with the <code>x-queue-type</code> argument set to <code>stream</code>. Streams must be durable. Retention is set with <code>x-max-age</code> (for example 7D) and <code>x-max-length-bytes</code>; when neither is set, no retention limit applies.',
        'Consuming requires a QoS prefetch to be set and manual acknowledgements. The starting point comes from the <code>x-stream-offset</code> consumer argument: <code>first</code>, <code>last</code>, <code>next</code>, a numeric offset, a timestamp, or an interval string.',
        'Acking a stream message does not delete it. The offset is only the reader\'s position, which is why one reader finishing has no effect on another.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Declare and replay a stream',
      language: 'typescript',
      code: `import amqp from 'amqplib';

const conn = await amqp.connect('amqp://localhost');
const ch = await conn.createChannel();

// Declare: durable is required for streams; retention is optional.
await ch.assertQueue('orders.stream', {
  durable: true,
  arguments: { 'x-queue-type': 'stream', 'x-max-age': '7D' },
});

// Consume: prefetch and manual ack are required for streams.
await ch.prefetch(100);
await ch.consume(
  'orders.stream',
  (msg) => {
    if (!msg) return;
    console.log(msg.content.toString());
    ch.ack(msg);   // moves this reader forward; the message is NOT deleted
  },
  { noAck: false, arguments: { 'x-stream-offset': 'first' } }  // replay from the start
);`
    },
    {
      label: 'Model: queue vs stream, two readers',
      language: 'typescript',
      code: `class ClassicQueue {
  private items: string[] = [];
  publish(m: string) { this.items.push(m); }
  consume() { return this.items.shift(); }          // destructive
}

class StreamLog {
  private log: string[] = [];
  publish(m: string) { this.log.push(m); }
  read(fromOffset: number) { return this.log.slice(fromOffset); }   // non-destructive
}

const q = new ClassicQueue();
const s = new StreamLog();
['a', 'b', 'c'].forEach(m => { q.publish(m); s.publish(m); });

console.log(q.consume(), q.consume(), q.consume());   // a b c
console.log(q.consume());                              // undefined  <- a late reader gets nothing
console.log(s.read(0));                                // [ 'a', 'b', 'c' ]
console.log(s.read(0));                                // [ 'a', 'b', 'c' ]  <- a late reader replays everything
console.log(s.read(2));                                // [ 'c' ]            <- or starts from any offset`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Your team already runs RabbitMQ for task queues and now needs an audit consumer that can re-read the last seven days of order events. Someone proposes adding Kafka just for this. Name the option that keeps the same broker, and the two arguments you would set.',
    hint: 'One argument is on the queue declaration (type and retention), the other on the consumer (where to start reading).',
    solution: 'Use a RabbitMQ stream (RabbitMQ 3.9 or later). Declare the queue with x-queue-type set to stream and x-max-age set to 7D for the retention window, then have the audit consumer set x-stream-offset (for example first, or an interval string such as 7D) and use a QoS prefetch with manual acks. Whether a second system is worth it depends on the throughput and ecosystem needs, but replay alone does not require Kafka.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'RabbitMQ cannot replay messages, so replay means using Kafka.',
      reality: 'Classic queues cannot, but RabbitMQ streams (3.9+) are an append-only log that consumers can attach to at any offset or timestamp and read repeatedly.'
    },
    {
      thought: 'Acking a message on a stream deletes it, like on a queue.',
      reality: 'Acking only advances that reader. Stream messages leave the log when retention (x-max-age or x-max-length-bytes) expires, if a limit is set at all.'
    },
    {
      thought: 'A stream consumer works the same as a classic queue consumer.',
      reality: 'Over AMQP 0.9.1 a stream consumer must set a QoS prefetch and use manual acknowledgements, and chooses its start position with the x-stream-offset argument.'
    }
  ];
}
