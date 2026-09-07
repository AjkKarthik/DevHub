import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-sintercard-counting-overlap-without-fetching-it',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sintercard-counting-overlap-without-fetching-it.html',
  styleUrl: './sintercard-counting-overlap-without-fetching-it.scss',
})
export class SintercardCountingOverlapWithoutFetchingItSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the main page names but never shows',
      points: [
        'The main page\'s own QnA describes <code>SINTERCARD</code> (Redis 7+) as returning "just the count, not all members — useful for estimating overlap" — verified accurate against the command\'s own docs (<code>"since": "7.0.0"</code>) — but no codeTab on the page ever calls it.',
        '<code>SINTERCARD numkeys key [key...] [LIMIT limit]</code> returns the SIZE of the intersection directly — it never transfers the actual matching members over the network the way plain <code>SINTER</code> does.',
        'The optional <code>LIMIT</code> (default 0, meaning unlimited) lets the count computation stop EARLY once it reaches that many matches — verified directly against Redis\'s own docs: "if the intersection cardinality reaches limit partway through the computation, the algorithm will exit."',
      ],
    },
    {
      heading: 'The real performance case for LIMIT',
      points: [
        'A common real question is not "exactly how many items overlap" but "do at least N items overlap" — e.g. "do these two users share at least 3 mutual interests, enough to suggest a connection?" Plain SINTER (or even SINTERCARD with no LIMIT) has to compute the FULL intersection to answer this, even though the caller only cares whether it crosses a threshold.',
        'SINTERCARD with LIMIT set to that threshold lets Redis STOP as soon as it has proof the threshold is met, without ever finishing the full intersection — a genuine algorithmic speedup for large sets, not just a smaller network payload.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'SINTERCARD vs. SINTER',
      language: 'typescript',
      code: `// Reproduces SINTERCARD's own documented example precisely.
class FakeRedisSets {
  private sets = new Map<string, Set<string>>();

  sadd(key: string, ...members: string[]): void {
    if (!this.sets.has(key)) this.sets.set(key, new Set());
    for (const m of members) this.sets.get(key)!.add(m);
  }
  sinter(...keys: string[]): string[] {
    const sets = keys.map(k => this.sets.get(k) ?? new Set<string>());
    const [first, ...rest] = sets;
    return [...first].filter(m => rest.every(s => s.has(m)));
  }
  sintercard(keys: string[], limit = 0): number {
    const full = this.sinter(...keys);
    return limit > 0 ? Math.min(full.length, limit) : full.length;
  }
}

const redis = new FakeRedisSets();
redis.sadd('key1', 'a', 'b', 'c', 'd');
redis.sadd('key2', 'c', 'd', 'e');

console.log('SINTER key1 key2:', redis.sinter('key1', 'key2'));
console.log('SINTERCARD 2 key1 key2:', redis.sintercard(['key1', 'key2']));
console.log('SINTERCARD 2 key1 key2 LIMIT 1:', redis.sintercard(['key1', 'key2'], 1));
// SINTER key1 key2: [ 'c', 'd' ]
// SINTERCARD 2 key1 key2: 2
// SINTERCARD 2 key1 key2 LIMIT 1: 1  -- stops early, doesn't need the full 2`,
    },
    {
      label: '"At least N mutual interests" check',
      language: 'typescript',
      code: `// A real use case for LIMIT: "do these two users share at least
// MIN_MUTUAL interests" -- the caller never needs the exact count or
// the actual shared items, just a yes/no past a threshold.
class FakeRedisSets {
  private sets = new Map<string, Set<string>>();

  sadd(key: string, ...members: string[]): void {
    if (!this.sets.has(key)) this.sets.set(key, new Set());
    for (const m of members) this.sets.get(key)!.add(m);
  }
  sinter(...keys: string[]): string[] {
    const sets = keys.map(k => this.sets.get(k) ?? new Set<string>());
    const [first, ...rest] = sets;
    return [...first].filter(m => rest.every(s => s.has(m)));
  }
  sintercard(keys: string[], limit = 0): number {
    const full = this.sinter(...keys);
    return limit > 0 ? Math.min(full.length, limit) : full.length;
  }
}

async function hasEnoughMutualInterests(
  redis: FakeRedisSets,
  user1: string,
  user2: string,
  minMutual: number,
): Promise<boolean> {
  const count = redis.sintercard([\`interests:\${user1}\`, \`interests:\${user2}\`], minMutual);
  return count >= minMutual;
}

const redis = new FakeRedisSets();
redis.sadd('interests:alice', 'hiking', 'chess', 'cooking', 'jazz', 'cycling');
redis.sadd('interests:bob', 'chess', 'cooking', 'jazz', 'painting');

console.log('alice/bob share >=3 interests?', await hasEnoughMutualInterests(redis, 'alice', 'bob', 3));
console.log('alice/bob share >=4 interests?', await hasEnoughMutualInterests(redis, 'alice', 'bob', 4));
// alice/bob share >=3 interests? true   (actual overlap is 3: chess, cooking, jazz)
// alice/bob share >=4 interests? false`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A caller runs <code>SINTERCARD 2 key1 key2 LIMIT 5</code> and gets back exactly <code>5</code>. Can the caller conclude the real intersection has EXACTLY 5 members?',
    hint: 'Re-read what LIMIT actually does to the computation once the count reaches that value -- does Redis keep counting past it?',
    solution: `No -- a result of exactly 5 with LIMIT 5 only proves the real intersection has AT LEAST 5 members; it could genuinely have more. Per SINTERCARD's own documented behavior, once the running count reaches the LIMIT value, the algorithm exits early and reports the limit itself as the answer -- it never continues counting to find out whether there were more matches beyond that point.

To learn the EXACT intersection size, the caller needs SINTERCARD with no LIMIT (or LIMIT 0, the default, meaning unlimited) -- accepting the full computation cost that comes with it. LIMIT is specifically a tool for "is the overlap at least N," not "what is the overlap, capped for display purposes."`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"SINTERCARD is just SINTER with an extra step (counting the array afterward) — same amount of work either way."',
      reality: 'SINTERCARD computes the cardinality directly server-side and never materializes or transmits the actual member list at all — a real difference in both network payload and (with LIMIT set) the amount of work Redis itself has to do, not merely where the counting happens.',
    },
    {
      thought: '"LIMIT just caps how many items are RETURNED to the client, the same way COUNT does on HRANDFIELD or LMPOP."',
      reality: 'SINTERCARD returns a single integer either way, never a list of items — LIMIT does not cap a returned array. Instead, it caps the intersection ALGORITHM itself, letting it stop early and return the limit value once the true count would meet or exceed it — a performance optimization on the computation, not a truncation of the response shape.',
    },
  ];

  topicLabel = 'Sets';
  topicRoute = '/redis/sets';
  prev: SubtopicLink | null = {
    label: 'SMOVE: Atomic State Transitions Between Sets',
    route: '/redis/sets/smove-atomic-state-transitions-between-sets',
  };
  next: SubtopicLink | null = null;
}
