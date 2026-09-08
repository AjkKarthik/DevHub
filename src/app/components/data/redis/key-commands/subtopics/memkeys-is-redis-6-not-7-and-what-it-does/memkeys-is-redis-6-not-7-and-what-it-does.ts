import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-memkeys-is-redis-6-not-7-and-what-it-does',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './memkeys-is-redis-6-not-7-and-what-it-does.html',
  styleUrl: './memkeys-is-redis-6-not-7-and-what-it-does.scss',
})
export class MemkeysIsRedis6Not7AndWhatItActuallyDoesSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The real history, checked against the merging PR',
      points: [
        'The main page\'s own QnA originally attributed <code>redis-cli --memkeys</code> to "Redis 7+" — checked directly against the pull request that introduced it (redis/redis#5856), which merged into the unstable branch in February 2019, well before Redis 7.0 (2022) and even before Redis 6.0 (April 2020) shipped. The feature landed in the Redis 6.0 release, roughly two major versions earlier than the page claimed.',
        'This is worth remembering as a general lesson, not just a one-off correction: a plausible-sounding version number attached to a real, correctly-described feature is still worth checking — the mechanism being described (rank keys by memory usage) was accurate the whole time; only the version attribution was wrong.',
        '<code>--memkeys</code> is built directly on top of <code>MEMORY USAGE key</code> (Redis 4.0+) — it is not a new server-side command at all, just a client-side CLI convenience that SCANs the keyspace and calls MEMORY USAGE on every key it finds.',
      ],
    },
    {
      heading: 'What --memkeys is actually doing under the hood',
      points: [
        'Conceptually: SCAN the entire keyspace in batches (never KEYS — the same non-blocking discipline this hub has covered throughout this topic), call MEMORY USAGE on each key found, and keep a running top-N list sorted by size.',
        'This is the same "any tool that inspects a live keyspace safely" shape as the main page\'s own Key Inspector Challenge — the only difference is which per-key metric gets collected (MEMORY USAGE bytes here, instead of TYPE and TTL there).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Building --memkeys-style ranking',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// The mechanism --memkeys wraps: SCAN + MEMORY USAGE, ranked by size.
async function rankKeysByMemory(topN = 10): Promise<{ key: string; bytes: number }[]> {
  const sized: { key: string; bytes: number }[] = [];
  let cursor = '0';
  do {
    const [next, batch] = await redis.scan(cursor, 'COUNT', 200);
    for (const key of batch) {
      const bytes = await redis.call('MEMORY', 'USAGE', key) as number | null;
      if (bytes !== null) sized.push({ key, bytes });
    }
    cursor = next;
  } while (cursor !== '0');

  sized.sort((a, b) => b.bytes - a.bytes);
  return sized.slice(0, topN);
}`,
    },
    {
      label: 'Verified against a modeled keyspace',
      language: 'typescript',
      code: `class FakeRedis {
  private store = new Map<string, string>([
    ['user:1', 'a'.repeat(50)],
    ['user:2', 'a'.repeat(5000)],
    ['session:abc', 'a'.repeat(200)],
    ['cache:big-report', 'a'.repeat(20000)],
  ]);

  keys(): string[] { return [...this.store.keys()]; }
  memoryUsage(key: string): number | null {
    const val = this.store.get(key);
    if (val === undefined) return null;
    return 56 + Buffer.byteLength(val, 'utf8'); // per-key overhead + value bytes
  }
}

function rankKeysByMemory(redis: FakeRedis, topN = 3) {
  const sized = redis.keys().map(key => ({ key, bytes: redis.memoryUsage(key)! }));
  sized.sort((a, b) => b.bytes - a.bytes);
  return sized.slice(0, topN);
}

console.log(rankKeysByMemory(new FakeRedis(), 3));
// [
//   { key: 'cache:big-report', bytes: 20056 },
//   { key: 'user:2', bytes: 5056 },
//   { key: 'session:abc', bytes: 256 }
// ]`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The main page\'s "How do you check the remaining TTL" QnA states MEMORY USAGE shipped in Redis 4.0+. If a team is running Redis 5.2 (a real, if unusual, patch of the 5.x line — before 6.0), can they run <code>redis-cli --memkeys</code> at all?',
    hint: 'The CLI flag itself is a client-side feature of a specific redis-cli BUILD, not a server-side capability — which version actually needs to be new enough: the server, or the CLI binary?',
    solution: `No -- not with a redis-cli binary older than 6.0, even though the SERVER (5.2) already supports the underlying MEMORY USAGE command it depends on (available since 4.0). --memkeys is a feature of the redis-cli TOOL itself, not the server: it is the CLI binary that needs to be built from Redis 6.0+ source for the flag to exist at all.

This is a subtle but real distinction worth remembering for any CLI-flag version claim: "the server supports the underlying command" and "the CLI tool you're running has the flag that uses it" are two independent version requirements. A team running a recent Redis 6.0+ server through an OLD, unupgraded redis-cli binary would hit the exact same problem in reverse -- a capable server with an incapable client.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"--memkeys must be new since it only recently became a commonly-recommended tool in blog posts and tutorials."',
      reality: 'Checked directly against the pull request that introduced it: the feature merged in February 2019 and shipped in Redis 6.0 (April 2020) — over five years before this correction was written. Growing popularity in tutorials says nothing about when a feature actually landed; only the source/changelog does.',
    },
    {
      thought: '"--memkeys is a special server-side Redis command, like SCAN or MEMORY USAGE."',
      reality: 'It is a client-side redis-cli convenience built entirely out of two commands that already existed: SCAN (to walk the keyspace) and MEMORY USAGE (to size each key). There is no new server-side protocol command behind it at all.',
    },
  ];

  topicLabel = 'Key Commands & Expiry';
  topicRoute = '/redis/key-commands';
  prev: SubtopicLink | null = {
    label: 'SETEX vs. SET ... EX ... NX Composability',
    route: '/redis/key-commands/setex-vs-set-ex-nx-composability',
  };
  next: SubtopicLink | null = {
    label: 'DUMP Does Not Include the TTL',
    route: '/redis/key-commands/dump-does-not-include-the-ttl',
  };
}
