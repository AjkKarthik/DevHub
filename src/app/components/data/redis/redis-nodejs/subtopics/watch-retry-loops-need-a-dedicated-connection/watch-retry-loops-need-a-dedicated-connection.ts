import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-watch-retry-loops-need-a-dedicated-connection',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './watch-retry-loops-need-a-dedicated-connection.html',
  styleUrl: './watch-retry-loops-need-a-dedicated-connection.scss',
})
export class WatchRetryLoopsNeedADedicatedConnectionSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA leaves out a critical detail',
      points: [
        'The main page\'s own QnA on transactions describes the WATCH pattern in one sentence: "use <code>redis.watch(key)</code>, then MULTI/EXEC in a retry loop — if exec returns null (optimistic lock failed), retry." It never says WHICH connection <code>redis</code> should be.',
        'This hub\'s own Transactions & Optimistic Locking topic already found and fixed a real bug caused by exactly this gap: WATCH state lives on the CONNECTION, not the client instance conceptually — if the sketch above is followed literally against the module-level shared <code>redis</code> client used everywhere else on this page, concurrent WATCH-based operations interfere with each other.',
      ],
    },
    {
      heading: 'What "per-connection" actually means in practice',
      points: [
        'Calling <code>watch()</code> a second time on the SAME connection does not replace the watched-key set — Redis documents this as additive: "additional calls to WATCH have an additive effect." Two logical operations sharing one connection end up sharing ONE combined watched-key set.',
        'Both EXEC and DISCARD clear the connection\'s entire watch state as a side effect, regardless of whether the exec succeeded, failed, or was for a completely different logical operation. On a shared connection this means one request\'s EXEC can silently clear the watch another, unrelated request was still relying on.',
        'The fix is the same one already established on this hub\'s Transactions topic: call <code>redis.duplicate()</code> to get a fresh connection scoped to just that one WATCH/MULTI/EXEC cycle, not the module-level shared client.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Simulation: shared connection (buggy)',
      language: 'typescript',
      code: `// A minimal model of Redis's own per-connection WATCH semantics --
// no real Redis needed to see the interference.
class FakeConnection {
  dirty = false;
  watchedKeys = new Set<string>();
  watch(key: string) { this.watchedKeys.add(key); }
  externalChange(key: string) {
    if (this.watchedKeys.has(key)) this.dirty = true;
  }
  execIfClean(apply: () => void): 'OK' | null {
    if (this.dirty) { this.watchedKeys.clear(); this.dirty = false; return null; }
    apply();
    this.watchedKeys.clear();
    this.dirty = false;
    return 'OK';
  }
}

const data = new Map([['orderA', 100], ['orderB', 200]]);

// BUGGY: two concurrent operations sharing ONE connection --
// mirrors watch()/exec() called against the module-level shared redis client.
const shared = new FakeConnection();
shared.watch('orderA');           // Request A begins
shared.watch('orderB');           // Request B begins, same connection
shared.externalChange('orderA');  // a third party genuinely changes orderA

const bResult = shared.execIfClean(() => data.set('orderB', 250));
console.log('B exec (unrelated to orderA):', bResult);
// -> null -- B is WRONGLY aborted, poisoned by A's watched key

const aResult = shared.execIfClean(() => data.set('orderA', 150));
console.log('A exec (orderA really did change):', aResult, data.get('orderA'));
// -> 'OK', 150 -- A WRONGLY succeeds: B's exec already cleared the
//    connection's watch state, so A's own real conflict is invisible now`,
    },
    {
      label: 'Fixed: dedicated connection per operation',
      language: 'typescript',
      code: `import Redis from 'ioredis';

async function incrementWithLimit(
  redis: Redis,
  key: string,
  limit: number,
  maxRetries = 5,
): Promise<number | null> {
  // redis.duplicate() -- same config, a fresh socket scoped to this call only.
  const conn = redis.duplicate();
  try {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      await conn.watch(key);
      const current = parseInt((await conn.get(key)) ?? '0', 10);
      if (current >= limit) {
        await conn.unwatch();
        return null; // limit reached, not a conflict
      }
      const result = await conn.multi().incr(key).exec();
      if (result !== null) return current + 1; // EXEC succeeded, no interference possible
      // result === null -- a genuine conflict on THIS key, safe to retry
    }
    throw new Error('incrementWithLimit: exceeded max retries');
  } finally {
    conn.disconnect();
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In the buggy simulation, Request A\'s conflicting write (<code>orderA</code> going from 100 to 150 despite the external change) is the DANGEROUS failure — it silently corrupts data with no error anywhere. Request B\'s false abort is comparatively safe. Why is that asymmetry true in general, not just for this specific example?',
    hint: 'What does the caller of a null EXEC result typically do, versus the caller of a non-null "OK" result?',
    solution: `A null EXEC result is the EXPECTED, handled outcome of optimistic locking -- the whole retry-loop pattern this page's own QnA describes exists specifically to catch it and try again. Request B's false abort just means one extra harmless retry cycle.

A non-null "OK" result, by contrast, is treated as unconditional success -- the caller has no reason to double-check anything after it. When that "OK" is actually wrong (as with Request A), there is no code path left that would ever notice or correct it. The bug is silent precisely because it disguises itself as the happy path, not the error path -- which is why sharing a connection across concurrent WATCH-based operations is a correctness bug, not just a performance one.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"As long as I call watch() before multi(), the operation is safe — it does not matter which connection object I call them on."',
      reality: 'WATCH safety depends entirely on the connection being exclusively used by ONE logical operation for its whole watch-to-exec lifetime. Calling watch()/multi()/exec() in the right order on a connection OTHER code is also actively using at the same time provides no protection at all — the shared watch state and the shared dirty flag are exactly what breaks.',
    },
    {
      thought: '"redis.duplicate() opens an expensive new TCP connection every time, so it should be avoided for anything performance-sensitive."',
      reality: 'A duplicated connection is genuinely a new socket, but opening one is on the order of a millisecond, not a meaningful cost next to the actual database round trips a WATCH/MULTI/EXEC cycle already makes. The real fix scope is "one connection per concurrently-active WATCH cycle" -- reusing one connection across the lifetime of an HTTP request (rather than literally one per call) is a legitimate, cheaper middle ground as long as that request never runs two WATCH-based operations on it at once.',
    },
  ];

  topicLabel = 'Redis with Node.js';
  topicRoute = '/redis/redis-nodejs';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'Typed defineCommand(), Without the as any Cast',
    route: '/redis/redis-nodejs/typed-definecommand-without-as-any',
  };
}
