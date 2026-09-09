import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-implementing-read-through-in-application-code',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './implementing-read-through-in-application-code.html',
  styleUrl: './implementing-read-through-in-application-code.scss',
})
export class ImplementingReadThroughInApplicationCodeSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'A named gap: Read-Through appears in the Quick Reference but never in a codeTab',
      points: [
        'The main page\'s own Quick Reference lists "Read-Through" as a distinct pattern, and its own QnA defines it precisely: "the cache sits in front of the DB and handles misses automatically... The app always reads from cache." Neither codeTab on the page ever builds one — both codeTabs are Cache-Aside, where the APPLICATION explicitly checks the cache, decides on a miss, and writes back.',
        'The QnA is also explicit that "Redis does not natively implement read-through; you need a caching library or proxy layer" — Redis itself has no read-through mode. What that "library or proxy layer" actually looks like, in application code, is a thin wrapper class the rest of the app calls through — never touching <code>redis.get</code>/<code>redis.set</code> directly.',
      ],
    },
    {
      heading: 'Cache-Aside vs Read-Through: the same three steps, different owner',
      points: [
        'Both patterns perform the identical three steps on a miss (check cache, load from source, populate cache) — the difference is WHO is responsible for that sequence. In Cache-Aside, every call site that needs cached data repeats the check-miss-load-populate logic itself. In Read-Through, that logic lives in exactly one place — the cache wrapper — and every call site just calls <code>cache.get(key, loader)</code>.',
        'This matters in practice once a codebase has more than one place reading the same cached entity: with Cache-Aside, a call site that forgets to check the cache first (or forgets to populate it after a miss) silently bypasses caching entirely with no error. A Read-Through wrapper makes that mistake structurally impossible — there is no code path that reaches the data source without going through the wrapper\'s own check-miss-populate sequence.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A Read-Through wrapper',
      language: 'typescript',
      code: `import Redis from 'ioredis';

class ReadThroughCache {
  constructor(private redis: Redis) {}

  // Every call site uses this ONE method -- it never touches redis.get/set directly.
  async get<T>(key: string, ttlSec: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached !== null) return JSON.parse(cached) as T;

    const value = await loader();
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSec);
    return value;
  }
}

// --- Usage: the app "always reads from cache," exactly as the read-through
// definition requires -- no call site ever branches on hit vs. miss itself.
const redis = new Redis();
const cache = new ReadThroughCache(redis);

async function getUser(userId: string) {
  return cache.get(\`v1:user:\${userId}:profile\`, 300, () => db.users.findById(userId));
}

async function getOrderCount(userId: string) {
  return cache.get(\`v1:user:\${userId}:order-count\`, 60, () => db.orders.countByUser(userId));
}

declare const db: any;`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate adds a THIRD call site, <code>getInvoiceTotal(userId)</code>, but writes it as <code>db.invoices.sumByUser(userId)</code> directly — forgetting to route it through <code>ReadThroughCache</code>. Under Cache-Aside, would this same mistake behave any differently than it does here?',
    hint: 'Ask what actually enforces "every read goes through the cache" in each pattern — a convention the team follows, or something the code itself makes true.',
    solution: `No -- the mistake behaves identically under either pattern, because in BOTH cases "always go through the cache" is a convention the developer has to remember, not something either pattern enforces at the type-system or architecture level. ReadThroughCache makes the check-miss-populate SEQUENCE impossible to get wrong once you do call cache.get(...) -- but nothing stops a call site from skipping the wrapper entirely, exactly as nothing stops a Cache-Aside call site from skipping its own inline cache check.

The real gain from Read-Through isn't preventing this specific mistake -- it's that the correct sequence (check, miss, load, populate, with consistent key/TTL handling) only needs to be written and reviewed ONCE, in the wrapper, rather than once per call site. A bypassed cache is still a bug either way; a WRONG cache-aside implementation at one of several call sites is a bug that Read-Through's single implementation genuinely eliminates.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Read-Through and Cache-Aside must behave differently at the database level — one of them must skip the load step on some code path."',
      reality: 'Both patterns run the identical DB load and cache-populate steps on a miss. The difference is purely structural: WHERE that logic lives (repeated at every call site vs. centralized in one wrapper), not what Redis or the database actually does.',
    },
    {
      thought: '"Since Redis doesn\'t natively support read-through, you need a separate caching product or proxy — you can\'t really do it with plain Redis."',
      reality: 'The main page\'s own QnA says a "library or proxy layer" is needed, which is exactly what the wrapper class above is — a small, self-written layer, not a separate product. Redis itself never needs to know the pattern exists; the ergonomics come entirely from disciplined application code.',
    },
  ];

  topicLabel = 'Caching Patterns';
  topicRoute = '/redis/caching-patterns';
  prev: SubtopicLink | null = {
    label: 'Locking the Stale-While-Revalidate Refresh',
    route: '/redis/caching-patterns/stale-while-revalidate-refresh-needs-its-own-lock',
  };
  next: SubtopicLink | null = {
    label: 'Tag-Based Invalidation with Redis Sets',
    route: '/redis/caching-patterns/tag-based-invalidation-with-redis-sets',
  };
}
