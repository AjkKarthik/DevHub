import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-kp-linger',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './kafkajs-has-no-linger-or-batch-size.html',
  styleUrl: './kafkajs-has-no-linger-or-batch-size.scss'
})
export class KafkajsHasNoLingerOrBatchSizeSubtopic {
  topicLabel = 'Kafka Producers & Consumers';
  topicRoute = '/messaging/kafka-producers-consumers';

  theory: TheoryPoint[] = [
    {
      heading: 'Settings the page named that kafkajs does not have',
      points: [
        'The page explained <code>linger.ms</code> and <code>batch.size</code> as the way to trade latency for throughput, then showed kafkajs code with a comment "Batch tuning (via underlying config)". kafkajs has no underlying config to tune: its producer options are <code>createPartitioner</code>, <code>retry</code>, <code>metadataMaxAge</code>, <code>allowAutoTopicCreation</code>, <code>transactionTimeout</code>, <code>idempotent</code> and <code>maxInFlightRequests</code>. The kafkajs docs expose no <code>linger.ms</code>, <code>batch.size</code> or client-side buffering option.',
        'Those two settings belong to the Java producer and to librdkafka-based clients. In kafkajs, batching is whatever you hand it: many messages in one <code>send</code>, or several topics in one <code>sendBatch</code>.',
        'The same page also commented <code>maxInFlightRequests: 5</code> as "required with idempotent". The kafkajs idempotent producer documentation says something different: acks must be -1 and retries default to a very large number. It states no maxInFlightRequests requirement.'
      ]
    },
    {
      heading: 'Getting linger-style batching in kafkajs',
      points: [
        'If you produce one message at a time from many small events, collect them yourself and flush on whichever comes first: a maximum batch size or a short timer. That is exactly what <code>linger.ms</code> plus <code>batch.size</code> do inside other clients.',
        'The trade-off is the same as documented for those settings: a longer wait means bigger batches and higher throughput, but each message waits longer before it is sent.',
        'A userland batcher owns the failure handling too. If the flush rejects, the messages in that batch are your responsibility to retry or report, which the built-in batching of other clients would otherwise handle.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A linger-style batcher for kafkajs',
      language: 'typescript',
      code: `// Flush when maxBatch messages are waiting, or lingerMs after the first one arrived.
class LingerBatcher<T> {
  private buf: T[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private flushFn: (batch: T[]) => Promise<void> | void,
    private lingerMs: number,
    private maxBatch: number,
  ) {}

  add(msg: T) {
    this.buf.push(msg);
    if (this.buf.length >= this.maxBatch) return this.flush();
    if (!this.timer) this.timer = setTimeout(() => this.flush(), this.lingerMs);
  }

  flush() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (!this.buf.length) return;
    const batch = this.buf;
    this.buf = [];
    return this.flushFn(batch);
  }
}

// Model: record batch sizes instead of calling the broker.
const sent: number[] = [];
const batcher = new LingerBatcher<{ value: string }>(batch => { sent.push(batch.length); }, 20, 3);
for (let i = 0; i < 5; i++) batcher.add({ value: 'm' + i });
console.log(sent);                       // [ 3 ]        the size limit flushed the first three at once
setTimeout(() => console.log(sent), 50); // [ 3, 2 ]     the linger timer flushed the remaining two`
    },
    {
      label: 'Wiring it to producer.send',
      language: 'typescript',
      code: `import { Kafka, CompressionTypes } from 'kafkajs';

const kafka = new Kafka({ clientId: 'events', brokers: ['localhost:9092'] });
const producer = kafka.producer({ idempotent: true });   // idempotent needs acks -1 (the default)
await producer.connect();

const batcher = new LingerBatcher<{ key: string; value: string }>(
  async (messages) => {
    await producer.send({
      topic: 'user-events',
      messages,                          // one request carries the whole batch
      compression: CompressionTypes.LZ4,
    });
  },
  50,   // linger up to 50 ms
  500,  // or flush at 500 messages
);

batcher.add({ key: 'u1', value: JSON.stringify({ event: 'login' }) });`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'You want each kafkajs request to carry at most 100 messages or wait at most 50 ms, whichever comes first. Which producer options do you set, and where does that behaviour come from if they do not exist?',
    hint: 'Look at the list of kafkajs producer options above.',
    solution: 'None: kafkajs has no linger.ms or batch.size option. You get the behaviour by batching in your own code: collect messages and flush when 100 are waiting or when a 50 ms timer fires, then call producer.send once with the array (as the LingerBatcher does). If you need the built-in settings, use a client that has them, such as the Java producer or a librdkafka-based client.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'I can tune <code>linger.ms</code> and <code>batch.size</code> on a kafkajs producer.',
      reality: 'kafkajs does not expose them. Those are Java-client and librdkafka settings; in kafkajs you batch by sending arrays of messages.'
    },
    {
      thought: '<code>maxInFlightRequests: 5</code> is required for the idempotent producer.',
      reality: 'The kafkajs docs require acks -1 for the idempotent producer and set retries to a very large default. They document no maxInFlightRequests requirement.'
    },
    {
      thought: 'Batching in my own code is free.',
      reality: 'It adds latency up to the wait time, and you now own retries for a failed flush, which a built-in client batcher would otherwise handle.'
    }
  ];
}
