import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-idem-redis-nx',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './redis-set-nx-needs-two-phases.html',
  styleUrl: './redis-set-nx-needs-two-phases.scss'
})
export class RedisSetNxNeedsTwoPhasesSubtopic {
  topicLabel = 'Idempotency & Dedup';
  topicRoute = '/messaging/idempotency';

  theory: TheoryPoint[] = [
    {
      heading: 'Why "SET key result NX" Before Processing Does Not Work',
      points: [
        'The main page\'s own QnA describes the sequence as: SET the idempotency key to result with NX EX ttl -- BEFORE processing. Read literally, that is impossible: the result does not exist yet at that point, since the request has not been processed.',
        'What that SET call actually needs to store first is a placeholder ("claim" or "lock" value) -- not the eventual result. The real result only gets written in a SECOND, separate write, after the work is done.',
        'This makes idempotency-via-Redis genuinely a two-phase pattern: phase 1 atomically claims the key with a placeholder; phase 2 (only reached by whichever caller won the claim) does the real work and overwrites the placeholder with the real, serialized result.'
      ]
    },
    {
      heading: 'The Crash-Mid-Processing Edge Case the Two-Phase Description Skips',
      points: [
        'If the process crashes after phase 1 (the key is claimed with the placeholder) but before phase 2 (the real result is written), the key is stuck holding the placeholder forever -- unless something separately handles that state.',
        'A caller retrying after the crash sees the placeholder, not a real result -- naively treating "key exists" as "duplicate, return cached result" would return the placeholder value itself, which is wrong.',
        'The TTL on the key is what eventually recovers from this: once it expires, a fresh retry can re-claim the key and actually do the work -- the EX ttl in the original SET call is not just about cleanup, it is the crash-recovery mechanism.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The real two-phase Redis idempotency pattern',
      language: 'typescript',
      code: `// A minimal in-memory stand-in for Redis's SET key value NX semantics,
// used here purely to demonstrate the two-phase pattern -- a real Redis
// client's set(key, value, 'NX', 'EX', ttl) behaves identically.

class FakeRedis {
  private store = new Map<string, string>();
  set(key: string, value: string, opts: { NX?: boolean } = {}): 'OK' | null {
    if (opts.NX && this.store.has(key)) return null;
    this.store.set(key, value);
    return 'OK';
  }
  get(key: string): string | undefined {
    return this.store.get(key);
  }
}

const redis = new FakeRedis();

interface PaymentResult { charged: number; txId: string; }

function processPayment(idempotencyKey: string, amount: number) {
  const cacheKey = \`idem:\${idempotencyKey}\`;

  // Phase 1: atomically CLAIM the key with a placeholder, not the real result
  const claimed = redis.set(cacheKey, 'IN_PROGRESS', { NX: true });

  if (claimed === null) {
    const current = redis.get(cacheKey)!;
    if (current === 'IN_PROGRESS') {
      return { status: 'conflict', message: 'Original request still processing' };
    }
    // current holds the REAL result from phase 2 of the original call
    return { status: 'duplicate', result: JSON.parse(current) as PaymentResult };
  }

  // Phase 2: do the real work
  const result: PaymentResult = { charged: amount, txId: 'tx-example' };

  // Phase 3: overwrite the placeholder with the real, serialized result
  redis.set(cacheKey, JSON.stringify(result));

  return { status: 'processed', result };
}

console.log(processPayment('key-1', 100));
// { status: 'processed', result: { charged: 100, txId: 'tx-example' } }

console.log(processPayment('key-1', 100));
// { status: 'duplicate', result: { charged: 100, txId: 'tx-example' } }
// -- the SECOND call correctly gets back the ORIGINAL result, not a re-charge.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A payment API claims an idempotency key with SET key "IN_PROGRESS" NX EX 300 (a 5-minute TTL), then crashes before it can write the real result. A retry with the same key arrives 6 minutes later. What happens?',
    hint: 'Think about what the TTL is actually protecting against, not just what it looks like it does at a glance.',
    solution: 'The key has already expired by the time the retry arrives (6 minutes > the 5-minute TTL), so the retry\'s SET ... NX call succeeds -- it is treated as a fresh claim, not a duplicate. The retry then genuinely reprocesses the payment. This is exactly what the TTL is for: it is not primarily about saving memory, it is the mechanism that lets a stuck "IN_PROGRESS" placeholder eventually be reclaimed after a crash. Had the retry arrived at 4 minutes instead, it would have seen the still-live "IN_PROGRESS" placeholder and correctly returned a conflict instead of double-charging.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The Redis pattern is one atomic <code>SET key result NX</code> call, since that is literally how it is described.',
      reality: 'That single call cannot work as described -- the <code>result</code> does not exist before the work runs. The real pattern needs two separate writes: a placeholder claim first, then the actual result once processing finishes.'
    },
    {
      thought: 'A key existing in Redis always means the request already finished and a result is available.',
      reality: 'A key can exist in the "IN_PROGRESS" placeholder state -- meaning the ORIGINAL request is still being processed (or crashed mid-processing), not that a result is ready to return.'
    },
    {
      thought: 'The <code>EX ttl</code> in the SET call is mainly there to keep the Redis key space from growing unbounded.',
      reality: 'Its more important job is crash recovery: it is the ONLY mechanism that unsticks a key left stuck at the "IN_PROGRESS" placeholder forever after a process crash between the two phases.'
    }
  ];
}
