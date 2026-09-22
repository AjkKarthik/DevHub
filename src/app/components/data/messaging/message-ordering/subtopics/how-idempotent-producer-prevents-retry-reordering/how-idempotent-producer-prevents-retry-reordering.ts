import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-order-idem-mech',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './how-idempotent-producer-prevents-retry-reordering.html',
  styleUrl: './how-idempotent-producer-prevents-retry-reordering.scss'
})
export class HowIdempotentProducerPreventsRetryReorderingSubtopic {
  topicLabel = 'Message Ordering';
  topicRoute = '/messaging/message-ordering';

  theory: TheoryPoint[] = [
    {
      heading: 'It Is Not "Messages Swap Places" -- It Is "A Message Duplicates Back In"',
      points: [
        'The main page\'s own QnA states: "if one batch fails and retries while later batches succeed, messages can arrive out of order." The common mental picture this suggests -- a later batch B ending up BEFORE an earlier batch A in the log -- is not actually what happens.',
        'What really happens without idempotence: batch A is durably written first, batch B is written second, but A\'s acknowledgment is lost on the way back to the producer. The producer retries A. That retry lands AFTER B, appending A a SECOND time into a log that already correctly had A before B.',
        'A downstream consumer reading that log sequentially sees A, B, A again -- not a swapped order, but an unexpected duplicate reappearing out of position. This distinction matters because "swapped order" and "duplicate reappearing" call for different mental models when debugging.'
      ]
    },
    {
      heading: 'How the Broker\'s Sequence Tracking Fixes It',
      points: [
        'With idempotent: true, the broker tracks the last sequence number it has durably written for each producer-partition pair.',
        'When A\'s retry arrives with the same sequence number it used the first time, the broker recognizes that sequence as already covered by its tracked state and responds with success WITHOUT appending it again -- the log itself is never touched by the retry.',
        'This is the same tracked-sequence mechanism this hub\'s Idempotency & Dedup topic covers for pure duplicate detection -- here it has the side effect of also preserving ordering, since a duplicate that is never appended can never disturb the log\'s existing order.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Non-idempotent vs. idempotent partition log under retry',
      language: 'typescript',
      code: `// Simplified model of a single Kafka partition's log, contrasting a
// non-idempotent producer (no sequence tracking) against an idempotent one
// (broker tracks the last durably-written sequence number).

interface LogEntry { seq: number; value: string; }

class NonIdempotentPartitionLog {
  log: LogEntry[] = [];
  append(seq: number, value: string) {
    this.log.push({ seq, value }); // always appends -- no tracking at all
  }
}

class IdempotentPartitionLog {
  log: LogEntry[] = [];
  private lastWrittenSeq = -1;
  append(seq: number, value: string): { appended: boolean; reason?: string } {
    if (seq <= this.lastWrittenSeq) {
      return { appended: false, reason: \`duplicate of already-written seq \${seq}\` };
    }
    this.log.push({ seq, value });
    this.lastWrittenSeq = seq;
    return { appended: true };
  }
}

function simulate<T extends { append(seq: number, value: string): unknown }>(
  Log: new () => T
) {
  const partition = new Log();
  partition.append(0, 'batch-A');   // A's original write durably succeeds
  partition.append(1, 'batch-B');   // B is sent right after, also succeeds
  // A's ack never reached the producer (lost on the way back), so the
  // producer retries A -- the retry arrives at the broker AFTER B landed.
  const retryResult = partition.append(0, 'batch-A (retry)');
  return { log: partition.log, retryResult };
}

console.log('Non-idempotent:', JSON.stringify(simulate(NonIdempotentPartitionLog)));
// log: [A, B, A-retry] -- A reappears out of position after B.

console.log('Idempotent:', JSON.stringify(simulate(IdempotentPartitionLog)));
// log: [A, B] -- the retry is recognized and never appended; order untouched.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A producer with idempotent: true has maxInFlightRequests left at its default (unlimited), and 8 batches genuinely end up in flight before any acks return. Batch seq=0\'s ack is lost, and by the time its retry arrives, the broker has already durably written batches seq=1 through seq=7. Does the idempotent producer\'s sequence tracking still catch the retry as a duplicate?',
    hint: 'This hub\'s own Idempotency & Dedup topic covers exactly how large that tracked window actually is.',
    solution: 'No -- this is the same limitation covered on the Idempotency & Dedup topic\'s own maxInFlightRequests subtopic: the broker only tracks the last 5 sequence numbers per producer-partition. By the time seq=0\'s retry arrives, seq 3 through 7 have pushed seq=0 out of that tracked window entirely. The broker no longer recognizes it as "already written" and accepts the retry as new data -- seq=0 gets appended a second time, exactly like the non-idempotent case. This is precisely why maxInFlightRequests must stay at or below 5 for the ordering-preservation property demonstrated here to actually hold.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Without idempotence, a retry-induced ordering problem means a later message literally appears BEFORE an earlier one in the log.',
      reality: 'What actually happens is closer to the opposite: the earlier message is DUPLICATED and reappears AFTER the later one, because its own retry lands late -- not a true swap, but a duplicate reappearing out of its original position.'
    },
    {
      thought: 'Idempotent producers preserve ordering by making the broker buffer and re-sort incoming batches into the correct sequence.',
      reality: 'The broker never re-sorts anything. It only tracks the last written sequence number and rejects (or, for already-seen sequences, silently no-ops) anything that would duplicate or violate that tracked state -- order is preserved as a SIDE EFFECT of never re-appending a duplicate, not through active reordering.'
    },
    {
      thought: 'Enabling idempotent: true guarantees ordering is preserved no matter how the producer is otherwise configured.',
      reality: 'It depends on maxInFlightRequests staying within the broker\'s own tracked window (5). Exceeding it silently disables the exact mechanism this page demonstrates, even with idempotent: true still set.'
    }
  ];
}
