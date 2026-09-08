import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-smove-atomic-state-transitions-between-sets',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './smove-atomic-state-transitions-between-sets.html',
  styleUrl: './smove-atomic-state-transitions-between-sets.scss',
})
export class SmoveAtomicStateTransitionsBetweenSetsSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the main page names but never shows',
      points: [
        'The main page\'s own QnA describes <code>SMOVE source dest member</code> as an atomic state-transition primitive ("pending to processed sets") in one paragraph — verified accurate against the command\'s own docs — but no codeTab on the page ever calls it.',
        'Verified directly against Redis\'s own docs: SMOVE\'s atomicity guarantee is specific — "in every given moment the element will appear to be a member of source OR destination for other clients." No other client can ever observe the member as belonging to BOTH sets, or to NEITHER, mid-operation.',
        'If the source set does not exist, or does not contain the member at all, SMOVE performs NO operation and returns 0 — it never partially succeeds (e.g. removing from source without a matching add to destination).',
      ],
    },
    {
      heading: 'The edge case that is easy to get wrong by hand',
      points: [
        'A hand-rolled version of "move" — a separate SREM followed by a separate SADD — has an obvious problem: it is not atomic across the two calls, the exact crash-window risk this hub has documented for other command pairs (SET+EXPIRE, INCR+EXPIRE).',
        'A LESS obvious edge case, verified directly against Redis\'s own docs: if the member ALREADY exists in the destination set, SMOVE still returns 1 (success) and only removes it from source — it never attempts to re-add an already-present member, and Redis sets are naturally idempotent about duplicate adds anyway, so this never risks any inconsistency.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Job-queue state transitions',
      language: 'typescript',
      code: `// The main page's own QnA example -- "pending to processed sets" --
// built out as a real job-queue state machine.
class FakeRedisSets {
  private sets = new Map<string, Set<string>>();

  sadd(key: string, member: string): void {
    if (!this.sets.has(key)) this.sets.set(key, new Set());
    this.sets.get(key)!.add(member);
  }
  smembers(key: string): string[] {
    return [...(this.sets.get(key) ?? [])];
  }
  smove(source: string, dest: string, member: string): 0 | 1 {
    const src = this.sets.get(source);
    if (!src || !src.has(member)) return 0;
    src.delete(member);
    if (!this.sets.has(dest)) this.sets.set(dest, new Set());
    this.sets.get(dest)!.add(member);
    return 1;
  }
}

const redis = new FakeRedisSets();
redis.sadd('jobs:pending', 'job1');
redis.sadd('jobs:pending', 'job2');

// A worker picks up job1 -- move it atomically to jobs:processing.
console.log('smove result:', redis.smove('jobs:pending', 'jobs:processing', 'job1'));
console.log('pending:', redis.smembers('jobs:pending'));
console.log('processing:', redis.smembers('jobs:processing'));

// Trying to move a job that was never in pending at all:
console.log('smove non-member result:', redis.smove('jobs:pending', 'jobs:processing', 'ghost-job'));
// smove result: 1
// pending: [ 'job2' ]
// processing: [ 'job1' ]
// smove non-member result: 0`,
    },
    {
      label: 'The already-in-destination edge case',
      language: 'typescript',
      code: `class FakeRedisSets {
  private sets = new Map<string, Set<string>>();

  sadd(key: string, member: string): void {
    if (!this.sets.has(key)) this.sets.set(key, new Set());
    this.sets.get(key)!.add(member);
  }
  smembers(key: string): string[] {
    return [...(this.sets.get(key) ?? [])];
  }
  smove(source: string, dest: string, member: string): 0 | 1 {
    const src = this.sets.get(source);
    if (!src || !src.has(member)) return 0;
    src.delete(member);
    if (!this.sets.has(dest)) this.sets.set(dest, new Set());
    this.sets.get(dest)!.add(member); // Set.add is naturally idempotent
    return 1;
  }
}

const redis = new FakeRedisSets();
redis.sadd('pending', 'job1');
redis.sadd('pending', 'job2');
redis.sadd('processing', 'job2'); // job2 is somehow ALREADY in processing

console.log('before:', { pending: redis.smembers('pending'), processing: redis.smembers('processing') });
const result = redis.smove('pending', 'processing', 'job2');
console.log('smove result (member already in destination):', result);
console.log('after:', { pending: redis.smembers('pending'), processing: redis.smembers('processing') });
// before: { pending: [ 'job1', 'job2' ], processing: [ 'job2' ] }
// smove result (member already in destination): 1
// after: { pending: [ 'job1' ], processing: [ 'job2' ] }  -- no duplicate, still just one entry`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two workers both try to move the same job from <code>jobs:pending</code> to <code>jobs:processing</code> at nearly the same instant. Given SMOVE\'s own documented atomicity guarantee, can both calls return 1, causing the job to be "picked up" twice?',
    hint: 'Re-read the exact atomicity guarantee quoted in the theory above — what does it say about the member\'s visibility to OTHER clients mid-operation?',
    solution: `No. Only ONE of the two SMOVE calls can return 1 -- whichever one Redis actually processes first. The moment that call runs, the member is atomically removed from jobs:pending. The SECOND call then finds the member no longer present in the source set at all, and per SMOVE's own documented behavior ("if the source set does not contain the specified element, no operation is performed and 0 is returned"), it returns 0 and does nothing.

This is exactly the guarantee the theory point describes: the member is always visible to other clients as belonging to source OR destination, never both -- which is precisely what prevents the "picked up twice" race a naive SREM-then-SADD pair (two separate round trips) would be vulnerable to.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"SMOVE is just a convenience wrapper around SREM + SADD — using the two separate commands yourself gives the same result, just with one extra round trip."',
      reality: 'The two are NOT equivalent in the presence of concurrent clients. SREM followed by a separate SADD has a genuine crash/race window between the two calls where the member exists in neither set (or, under concurrent access, could be observed missing from both). SMOVE\'s single-command atomicity is precisely what closes that window — it is a correctness guarantee, not just a latency optimization.',
    },
    {
      thought: '"If the member is already present in the destination set, SMOVE either errors out or duplicates it."',
      reality: 'Verified directly against Redis\'s own docs and demonstrated above: SMOVE still succeeds (returns 1) and simply removes the member from source — sets cannot hold duplicates by definition, so there is no error case or duplication risk here at all.',
    },
  ];

  topicLabel = 'Sets';
  topicRoute = '/redis/sets';
  prev: SubtopicLink | null = {
    label: 'Sets Have a Third Encoding: listpack (Redis 7.2+)',
    route: '/redis/sets/sets-have-a-third-encoding-listpack-since-redis-7-2',
  };
  next: SubtopicLink | null = {
    label: 'SINTERCARD: Counting Overlap Without Fetching It',
    route: '/redis/sets/sintercard-counting-overlap-without-fetching-it',
  };
}
