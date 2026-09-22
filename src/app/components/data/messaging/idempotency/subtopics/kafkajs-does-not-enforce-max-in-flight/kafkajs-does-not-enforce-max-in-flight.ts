import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-idem-inflight',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './kafkajs-does-not-enforce-max-in-flight.html',
  styleUrl: './kafkajs-does-not-enforce-max-in-flight.scss'
})
export class KafkajsDoesNotEnforceMaxInFlightSubtopic {
  topicLabel = 'Idempotency & Dedup';
  topicRoute = '/messaging/idempotency';

  theory: TheoryPoint[] = [
    {
      heading: 'What kafkajs Actually Checks When idempotent: true',
      points: [
        'Reading the real, installed kafkajs source (producer/messageProducer.js): the ONLY validation kafkajs performs for an idempotent producer is on acks -- if idempotent is true and acks is not -1, it throws a KafkaJSNonRetriableError immediately.',
        'There is no equivalent check anywhere for maxInFlightRequests. It is handled as a plain, generic connection-level throttle (defaulting to unlimited, null) that kafkajs treats identically whether idempotent is true or false.',
        'This means the "required with idempotent" comment on the main page\'s own code sample describes something kafkajs simply does not enforce -- unlike acks, which genuinely does throw if you get it wrong.'
      ]
    },
    {
      heading: 'Why the Kafka Protocol Still Needs It Capped at 5',
      points: [
        'The requirement is real -- it just lives at the Kafka broker/protocol level, not inside kafkajs. The broker only caches producer-state metadata (the last written sequence number) for a limited number of recent batches per producer-partition -- 5, by Kafka\'s own design.',
        'When a producer has more than 5 requests in flight at once, an older in-flight batch\'s sequence number can be evicted from that tracked window before its retry arrives -- the broker then treats the retried batch as brand new instead of recognizing it as a duplicate.',
        'Because kafkajs never validates this for you, setting idempotent: true with maxInFlightRequests left at its default (unlimited) or raised above 5 will run without any error at all -- it just silently stops guaranteeing exactly-once delivery per partition.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: the broker\'s 5-entry dedup window',
      language: 'typescript',
      code: `// Simplified model of what the Kafka broker actually tracks per producer-partition:
// only the last N sequence numbers it has written, where N = 5.

class BrokerPartitionState {
  private seen: number[] = [];
  constructor(private trackWindow: number) {}

  write(seq: number): { accepted: boolean; reason?: string } {
    if (this.seen.includes(seq)) {
      return { accepted: false, reason: 'deduplicated -- seq already in tracked window' };
    }
    this.seen.push(seq);
    if (this.seen.length > this.trackWindow) this.seen.shift(); // evict oldest
    return { accepted: true };
  }
}

function simulate(maxInFlightRequests: number) {
  const broker = new BrokerPartitionState(5); // Kafka's real dedup window size
  for (let seq = 0; seq < maxInFlightRequests; seq++) {
    broker.write(seq); // send all in-flight batches without waiting for acks
  }
  // Retry the FIRST in-flight batch (seq 0) -- its ack was lost on the wire,
  // even though the broker already durably wrote it.
  return broker.write(0);
}

console.log('maxInFlightRequests = 5:', simulate(5));
// { accepted: false, reason: 'deduplicated -- seq already in tracked window' }
// -- correctly caught as a duplicate, exactly-once holds.

console.log('maxInFlightRequests = 6:', simulate(6));
// { accepted: true }
// -- seq 0 was evicted from the window by seq 5; the retry is wrongly
//    accepted as new. A real duplicate write, with idempotent: true still set.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A kafkajs producer is created with idempotent: true and no maxInFlightRequests set at all (so it defaults to unlimited). During a network blip, 12 batches end up in flight simultaneously before any acks come back. Does kafkajs stop this from happening, and is the exactly-once guarantee still intact?',
    hint: 'Check what kafkajs actually validates for an idempotent producer versus what only the Kafka broker\'s own tracking window limits.',
    solution: 'kafkajs does not stop it -- there is no validation tying maxInFlightRequests to idempotent anywhere in its source, so 12 in-flight requests run without any error. The exactly-once guarantee is NOT intact: the broker only tracks the last 5 sequence numbers per partition, so once more than 5 requests are truly in flight, an early batch\'s sequence number can be evicted from that window before its retry lands, and the retry gets accepted as a brand-new write instead of being deduplicated.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>maxInFlightRequests: 5</code> next to <code>idempotent: true</code> in a kafkajs producer means kafkajs is enforcing that limit for you, the same way it enforces <code>acks: -1</code>.',
      reality: 'kafkajs\'s only idempotent-related validation is on <code>acks</code> -- it throws if <code>acks !== -1</code>. <code>maxInFlightRequests</code> is never checked against <code>idempotent</code> at all; leaving it unset or raising it above 5 runs with zero errors.'
    },
    {
      thought: 'The "5" in <code>maxInFlightRequests: 5</code> is an arbitrary safe default someone picked.',
      reality: 'It is the exact size of the Kafka broker\'s own producer-state dedup window -- the broker literally only remembers the last 5 sequence numbers per producer-partition. Going above 5 lets a retried batch fall outside that memory.'
    },
    {
      thought: 'If exactly-once delivery silently breaks because of a misconfigured maxInFlightRequests, kafkajs or the broker will surface some kind of warning.',
      reality: 'Neither does. The write that should have been deduplicated is accepted as ordinary new data -- there is no error, warning, or log line distinguishing it from a legitimate message.'
    }
  ];
}
