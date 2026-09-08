import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-setex-vs-set-ex-nx-composability',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './setex-vs-set-ex-nx-composability.html',
  styleUrl: './setex-vs-set-ex-nx-composability.scss',
})
export class SetexVsSetExNxComposabilitySubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'SETEX is not deprecated — it is just less capable',
      points: [
        'Checked directly against SETEX\'s own official docs: there is no deprecation notice anywhere on the page — unlike SETNX, GETSET, and HMSET, which all carry an explicit "Deprecated" line. SETEX has been part of Redis since version 2.0.0 and remains a fully-supported command today.',
        '<code>SETEX key seconds value</code> does exactly one thing: set the value and an expiry, unconditionally. It has no NX (only if absent) or XX (only if present) variant at all — there is no "SETEX ... NX" syntax to reach for.',
        '<code>SET key value EX seconds</code> is preferred not because SETEX is broken or deprecated, but because SET composes with NX, XX, GET, and KEEPTTL in the same call — a strictly larger set of capabilities using one unified command form.',
      ],
    },
    {
      heading: 'Where the missing NX option actually bites',
      points: [
        'A distributed lock needs "set this key to my ID, with an expiry, but ONLY if nobody already holds it." SETEX has no way to express the "only if absent" half of that requirement at all — it always overwrites.',
        'Using SETEX for a lock means two workers racing for the same lock can BOTH succeed: whichever call runs last simply overwrites whoever held the lock first, with no error, no rejection, nothing to detect the collision at all.',
        '<code>SET key value EX seconds NX</code> returns <code>OK</code> for the winner and <code>null</code> (nil) for every other caller — the conditional check and the expiry both happen atomically, in the same server-side operation, so there is no race window to worry about.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'SETEX cannot express a lock (bug)',
      language: 'typescript',
      code: `class FakeRedis {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  setex(key: string, ttlSec: number, value: string): 'OK' {
    // SETEX has no NX/XX variant -- it ALWAYS overwrites, unconditionally.
    this.store.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
    return 'OK';
  }
  get(key: string): string | null {
    return this.store.get(key)?.value ?? null;
  }
}

const redis = new FakeRedis();

// Worker A acquires the lock for job42.
console.log('Worker A via SETEX:', redis.setex('lock:job42', 30, 'workerA'));

// Worker B tries a moment later -- SETEX has no way to say "only if nobody holds it".
console.log('Worker B via SETEX (WRONG -- silently steals the lock):', redis.setex('lock:job42', 30, 'workerB'));

console.log('Lock holder after BOTH calls:', redis.get('lock:job42'));
// Worker A via SETEX: OK
// Worker B via SETEX (WRONG -- silently steals the lock): OK
// Lock holder after BOTH calls: workerB   <-- both workers now believe they hold the lock`,
    },
    {
      label: 'SET ... EX ... NX (correct)',
      language: 'typescript',
      code: `class FakeRedis {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  set(key: string, value: string, opts: { EX?: number; NX?: boolean }): 'OK' | null {
    const exists = this.store.has(key);
    if (opts.NX && exists) return null; // atomic check-and-set, one server-side call
    this.store.set(key, { value, expiresAt: opts.EX ? Date.now() + opts.EX * 1000 : null });
    return 'OK';
  }
  get(key: string): string | null {
    return this.store.get(key)?.value ?? null;
  }
}

const redis = new FakeRedis();

console.log('Worker A via SET EX NX:', redis.set('lock:job42', 'workerA', { EX: 30, NX: true }));
console.log('Worker B via SET EX NX (correctly rejected):', redis.set('lock:job42', 'workerB', { EX: 30, NX: true }));

console.log('Lock holder after both calls:', redis.get('lock:job42'));
// Worker A via SET EX NX: OK
// Worker B via SET EX NX (correctly rejected): null
// Lock holder after both calls: workerA   <-- exactly one winner, exactly as expected`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says: "We can keep using SETEX everywhere and just add a manual <code>EXISTS</code> check before it, to get the same NX behavior." Is a separate <code>EXISTS</code> check followed by <code>SETEX</code> equivalent to <code>SET key value EX seconds NX</code>?',
    hint: 'How many round trips to Redis does each approach take? What happens if another client\'s SETEX runs in the gap between the two round trips?',
    solution: `No -- they are not equivalent, for the same reason this hub keeps coming back to: two separate commands are not one atomic operation. EXISTS and SETEX are two distinct round trips to Redis, and nothing stops a SECOND client's own EXISTS-then-SETEX sequence from interleaving in the gap between them.

Concretely: Worker A calls EXISTS('lock:job42') and gets false (no lock exists yet). Before Worker A's own SETEX call actually runs, Worker B ALSO calls EXISTS and ALSO gets false -- the lock still doesn't exist from Worker B's point of view. Both workers then proceed to call SETEX, and (per the bug demonstrated above) both succeed, with whichever call runs last winning.

SET key value EX seconds NX closes this gap because the existence check and the write happen as ONE atomic operation inside Redis, with no round trip in between where a second client could observe stale state. This is the exact same "two commands vs. one atomic command" pattern this hub has already covered for SET+EXPIRE and INCR+EXPIRE -- SETEX-preceded-by-EXISTS is just a third instance of the identical mistake.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"SETEX is deprecated, so I should replace every use of it with SET ... EX for that reason alone."',
      reality: 'Verified directly against SETEX\'s own official docs: there is no deprecation notice at all. SETEX still works exactly as documented and is not scheduled for removal. The real reason to prefer <code>SET key value EX seconds</code> is that it composes with NX/XX/GET/KEEPTTL in the same call -- a capability upgrade, not a deprecation warning.',
    },
    {
      thought: '"If I need conditional behavior, I can just check with EXISTS first, then call SETEX."',
      reality: 'That reintroduces exactly the crash/race window a single atomic command exists to close -- demonstrated above with two concurrent workers. Use <code>SET key value EX seconds NX</code> (or XX) instead of any two-step check-then-write sequence.',
    },
  ];

  topicLabel = 'Key Commands & Expiry';
  topicRoute = '/redis/key-commands';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: '--memkeys Is Redis 6.0, Not 7 — and What It Actually Does',
    route: '/redis/key-commands/memkeys-is-redis-6-not-7-and-what-it-does',
  };
}
