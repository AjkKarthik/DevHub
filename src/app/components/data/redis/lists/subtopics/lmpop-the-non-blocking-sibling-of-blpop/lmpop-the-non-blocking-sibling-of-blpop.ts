import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-lmpop-the-non-blocking-sibling-of-blpop',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './lmpop-the-non-blocking-sibling-of-blpop.html',
  styleUrl: './lmpop-the-non-blocking-sibling-of-blpop.scss',
})
export class LmpopTheNonBlockingSiblingOfBlpopSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the main page names but never shows',
      points: [
        'The main page\'s own theory names <code>LMPOP</code> in one sentence ("In Redis 7.0+, LMPOP pops from the first non-empty list in a set without blocking") — verified accurate against the command\'s own docs (<code>"since": "7.0.0"</code>) — but no codeTab on the page ever calls it.',
        'The main page\'s own Priority Job Queue Challenge already demonstrates the multi-key BLOCKING idea with <code>BLPOP queue:high queue:low 5</code>. LMPOP is the exact non-blocking counterpart: same "check multiple keys, use the first non-empty one" logic, but returns immediately instead of waiting.',
        '<code>LMPOP numkeys key [key...] LEFT|RIGHT [COUNT count]</code> returns a two-element array — the NAME of the key it actually popped from, plus an array of the popped elements — or nil if every listed key was empty.',
      ],
    },
    {
      heading: 'The behavior that is easy to assume wrong',
      points: [
        'A natural but wrong assumption: "COUNT 5 across 2 keys means Redis will pop up to 5 elements total, pulling from whichever keys have them." Verified directly against Redis\'s own documented example: LMPOP only ever pops from the FIRST non-empty key in the list you pass — if that key has fewer elements than COUNT, you get fewer results, and Redis never continues into the second key to make up the difference.',
        'This makes LMPOP genuinely different from a naive "drain up to N items from this pool of queues" operation — it\'s "give me up to N items from the highest-priority queue that has ANY," full stop, one key per call.',
        'To actually drain multiple queues in one worker loop, you still need repeated LMPOP calls (or LMOVE per item) — LMPOP itself never merges results across more than one key in a single response.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'LMPOP never spills across keys',
      language: 'typescript',
      code: `// Reproduces LMPOP's own documented example precisely: asking for more
// elements than the first non-empty key has does NOT pull the remainder
// from a second key.
class FakeRedisLists {
  private lists = new Map<string, string[]>();

  rpush(key: string, ...vals: string[]): void {
    if (!this.lists.has(key)) this.lists.set(key, []);
    this.lists.get(key)!.push(...vals);
  }
  lrange(key: string): string[] {
    return [...(this.lists.get(key) ?? [])];
  }
  lmpop(keys: string[], direction: 'LEFT' | 'RIGHT', count = 1): [string, string[]] | null {
    for (const key of keys) {
      const list = this.lists.get(key);
      if (list && list.length > 0) {
        const n = Math.min(count, list.length);
        const popped = direction === 'LEFT'
          ? list.splice(0, n)
          : list.splice(list.length - n, n).reverse();
        if (list.length === 0) this.lists.delete(key);
        return [key, popped];
      }
    }
    return null;
  }
}

const redis = new FakeRedisLists();
redis.rpush('mylist', 'one', 'two'); // only 2 elements
redis.rpush('mylist2', 'a', 'b', 'c', 'd', 'e');

console.log('LMPOP asking for count=5 across mylist,mylist2:', redis.lmpop(['mylist', 'mylist2'], 'RIGHT', 5));
console.log('mylist remaining:', redis.lrange('mylist'));
console.log('mylist2 remaining (untouched):', redis.lrange('mylist2'));
// LMPOP asking for count=5 across mylist,mylist2: [ 'mylist', [ 'two', 'one' ] ]
// mylist remaining: []
// mylist2 remaining (untouched): [ 'a', 'b', 'c', 'd', 'e' ]`,
    },
    {
      label: 'Non-blocking priority drain',
      language: 'typescript',
      code: `// Priority job queue, using LMPOP as the non-blocking sibling of the
// main page's own BLPOP-based Challenge -- returns immediately with
// null instead of waiting when everything is empty.
class FakeRedisLists {
  private lists = new Map<string, string[]>();

  rpush(key: string, val: string): void {
    if (!this.lists.has(key)) this.lists.set(key, []);
    this.lists.get(key)!.push(val);
  }
  lmpop(keys: string[]): [string, string[]] | null {
    for (const key of keys) {
      const list = this.lists.get(key);
      if (list && list.length > 0) {
        const popped = [list.shift()!];
        if (list.length === 0) this.lists.delete(key);
        return [key, popped];
      }
    }
    return null;
  }
}

function nextJobNonBlocking(redis: FakeRedisLists): object | null {
  const result = redis.lmpop(['queue:high', 'queue:low']);
  if (!result) return null; // returns immediately -- never waits
  const [, [raw]] = result;
  return JSON.parse(raw);
}

const redis = new FakeRedisLists();
redis.rpush('queue:low', JSON.stringify({ task: 'send-newsletter' }));

// queue:high is empty -- LMPOP falls through to queue:low immediately.
console.log('first call:', nextJobNonBlocking(redis));
// second call: nothing left anywhere -- returns null right away, no wait.
console.log('second call:', nextJobNonBlocking(redis));
// first call: { task: 'send-newsletter' }
// second call: null`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A worker loop calls <code>LMPOP 2 queue:high queue:low LEFT COUNT 10</code> once per iteration, expecting up to 10 total jobs back per call, drawn from whichever queue has them. <code>queue:high</code> currently has 3 jobs, <code>queue:low</code> has 20. How many jobs does ONE such call actually return, and from which queue?',
    hint: 'Re-read the "behavior that is easy to assume wrong" theory point above — does LMPOP ever continue into a second key within the same call?',
    solution: `Exactly 3 jobs, all from queue:high, and queue:low is left completely untouched by this call. LMPOP only ever pops from the FIRST non-empty key in the list it's given -- since queue:high has at least one job, it's the one LMPOP uses for the entire call, capped at min(count, that key's own length) = min(10, 3) = 3.

To actually reach queue:low's 20 jobs, the worker loop needs a SEPARATE LMPOP call after queue:high is fully drained (i.e., after enough iterations that queue:high no longer has any jobs left) -- it will never happen within the same call that already found jobs in queue:high, no matter how large COUNT is set.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"LMPOP with COUNT N across several keys pulls up to N items total, drawing from as many of those keys as needed to reach N."',
      reality: 'Verified directly against Redis\'s own documented example: LMPOP commits to exactly ONE key per call -- the first non-empty one in the list you pass -- and returns at most min(count, that key\'s own length) elements from it alone. It never continues into a second key within the same call, however large COUNT is.',
    },
    {
      thought: '"LMPOP is basically LMOVE without a destination — since both deal with popping from the first available list."',
      reality: 'LMOVE always operates on exactly ONE known source and ONE known destination list, both named explicitly. LMPOP\'s whole purpose is different: choosing WHICH of several candidate source keys to pop from at call time, based on which one happens to be non-empty -- a capability LMOVE does not have at all.',
    },
  ];

  topicLabel = 'Lists';
  topicRoute = '/redis/lists';
  prev: SubtopicLink | null = {
    label: 'list-max-listpack-size Is a Byte-Size Cap, Not an Entry Count',
    route: '/redis/lists/list-max-listpack-size-is-a-byte-size-cap',
  };
  next: SubtopicLink | null = {
    label: 'LPOS: RANK, COUNT, and the Nil vs. Empty Array Distinction',
    route: '/redis/lists/lpos-rank-count-and-the-nil-vs-empty-array',
  };
}
