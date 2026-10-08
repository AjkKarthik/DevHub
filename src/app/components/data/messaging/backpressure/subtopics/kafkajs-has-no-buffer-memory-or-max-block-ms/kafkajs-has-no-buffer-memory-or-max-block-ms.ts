import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-bp-no-buffer-config',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './kafkajs-has-no-buffer-memory-or-max-block-ms.html',
  styleUrl: './kafkajs-has-no-buffer-memory-or-max-block-ms.scss'
})
export class KafkajsHasNoBufferMemoryOrMaxBlockMsSubtopic {
  topicLabel = 'Backpressure & Flow Control';
  topicRoute = '/messaging/backpressure';

  theory: TheoryPoint[] = [
    {
      heading: 'kafkajs\'s Entire ProducerConfig, Checked Directly',
      points: [
        'kafkajs\'s own installed TypeScript types declare exactly eight ProducerConfig fields: createPartitioner, retry, metadataMaxAge, allowAutoTopicCreation, idempotent, transactionalId, transactionTimeout, and maxInFlightRequests.',
        'Neither buffer.memory (a total buffering-capacity setting) nor max.block.ms (how long send() blocks once that buffer fills) exists anywhere in that list -- or anywhere else in kafkajs\'s source.',
        'These two configs are specific to the Java producer client, which maintains its own in-memory record accumulator with a hard capacity limit -- an architecture kafkajs simply does not implement.'
      ]
    },
    {
      heading: 'What kafkajs Actually Bounds send() By',
      points: [
        'kafkajs\'s only producer-side concurrency knob is maxInFlightRequests -- the number of unacknowledged requests allowed on the connection at once. There is no separate memory-capacity ceiling that send() blocks against.',
        'This means a kafkajs producer calling send() in a tight loop has no built-in mechanism protecting it from overwhelming the broker beyond that in-flight-request limit -- unlike the Java client, which would eventually block the caller once its accumulator fills.',
        'The practical consequence: a kafkajs application that needs producer-side backpressure has to build it itself -- which is exactly what the main page\'s own Rate-Limited Producer codeTab does with a hand-rolled token bucket.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming ProducerConfig has no buffer options',
      language: 'typescript',
      code: `// Reproducing kafkajs's real, installed ProducerConfig shape (from its
// own TypeScript declaration file) to check which fields actually exist.

interface RealKafkajsProducerConfig {
  createPartitioner?: unknown;
  retry?: unknown;
  metadataMaxAge?: number;
  allowAutoTopicCreation?: boolean;
  idempotent?: boolean;
  transactionalId?: string;
  transactionTimeout?: number;
  maxInFlightRequests?: number;
  // No bufferMemory. No maxBlockMs. They are not part of this type at all --
  // supplying either would be a TypeScript compile error, not just unused.
}

function hasBufferBasedBackpressure(config: RealKafkajsProducerConfig): boolean {
  const fields = Object.keys(config);
  const bufferRelatedFields = ['bufferMemory', 'maxBlockMs'];
  return bufferRelatedFields.some(f => fields.includes(f));
}

const producerConfig: RealKafkajsProducerConfig = {
  idempotent: true,
  maxInFlightRequests: 5,
};

console.log('Does this config expose buffer-memory backpressure?', hasBufferBasedBackpressure(producerConfig));
// false -- there is no such field to check for in the first place.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team migrating from the Java Kafka producer to kafkajs assumes they can port their existing buffer.memory=64MB / max.block.ms=5000 tuning directly into their new kafkajs producer() call. What actually happens when they try?',
    hint: 'Check kafkajs\'s own ProducerConfig type against what the Java client\'s config uses.',
    solution: 'Neither option exists on kafkajs\'s ProducerConfig at all, so passing bufferMemory or maxBlockMs (or the snake_case originals) has no effect whatsoever -- kafkajs simply ignores unrecognized config keys rather than throwing. The team\'s tuning silently does nothing; their new producer has no buffer-capacity ceiling or blocking-timeout behavior at all, bounded only by maxInFlightRequests. If they actually need bounded throughput, they need to build it themselves -- for example, the token-bucket rate limiter this hub\'s own main page demonstrates.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>max.block.ms</code> and <code>buffer.memory</code> are universal Kafka producer concepts that apply to any client library, including kafkajs.',
      reality: 'They are specific to the Java producer\'s own in-memory record-accumulator architecture. kafkajs\'s installed ProducerConfig type has no equivalent field -- confirmed directly by checking its own TypeScript declarations.'
    },
    {
      thought: 'If a kafkajs producer is sending faster than the broker can keep up, send() will eventually block until there is room, the same way the Java client does.',
      reality: 'kafkajs has no buffer-capacity concept to block against. The only thing that bounds concurrent requests is maxInFlightRequests -- there is no memory-based backpressure at all without building it yourself.'
    },
    {
      thought: 'Passing an unsupported config option like bufferMemory to kafka.producer() would throw an error, making the mismatch obvious immediately.',
      reality: 'kafkajs does not validate against a strict allowlist -- an unrecognized option is silently ignored rather than rejected, so the mistake produces no error at all, just a producer that never applies the intended tuning.'
    }
  ];
}
