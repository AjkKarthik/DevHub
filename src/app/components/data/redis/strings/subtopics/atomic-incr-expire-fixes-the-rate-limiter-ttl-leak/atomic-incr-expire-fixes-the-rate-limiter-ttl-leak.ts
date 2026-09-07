import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-atomic-incr-expire-fixes-the-rate-limiter-ttl-leak',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './atomic-incr-expire-fixes-the-rate-limiter-ttl-leak.html',
  styleUrl: './atomic-incr-expire-fixes-the-rate-limiter-ttl-leak.scss',
})
export class AtomicIncrExpireFixesTheRateLimiterTtlLeakSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The bug in the main page\'s own Challenge',
      points: [
        'The main page\'s own first mistake block teaches, in general terms: "Using SET + EXPIRE separately instead of SET EX... if the process crashes between SET and EXPIRE, the key persists forever with no TTL." That lesson is correct and important.',
        'The Rate Limiter Challenge\'s original reference solution committed the EXACT same mistake with a different pair of commands: <code>const count = await redis.incr(key); if (count === 1) await redis.expire(key, windowSeconds);</code> — two separate round trips, with a real crash window between them.',
        'If the process (or the whole pod, in a container restart) dies after INCR but before EXPIRE, the counter key is left in the store forever with no TTL — that specific user is then rate-limited (or worse, silently miscounted) for that window key permanently, since the key never expires and never resets.',
      ],
    },
    {
      heading: 'Why this is a well-documented, real risk, not a hypothetical',
      points: [
        'Verified via multiple independent sources describing this exact pattern for Redis-based rate limiters: "if for some reason the client performs the INCR command but does not perform the EXPIRE, the key will be leaked" — the standard, repeatedly-recommended fix is a Lua script that does both in one round trip.',
        'A Lua script Redis executes is guaranteed to run as a single indivisible unit — no other client\'s command, and no crash mid-script, can leave it half-applied the way two separate client-side calls can.',
        'The fixed reference solution uses exactly this: <code>local count = redis.call("INCR", KEYS[1]); if count == 1 then redis.call("EXPIRE", KEYS[1], ARGV[1]) end; return count</code> as one <code>EVAL</code> call.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the leak',
      language: 'typescript',
      code: `// A minimal in-memory stand-in for Redis, just enough to reproduce
// the exact crash-window behaviour of the original reference solution.
class FakeRedis {
  private store = new Map<string, number>();
  private ttls = new Set<string>();

  incr(key: string): number {
    const v = (this.store.get(key) ?? 0) + 1;
    this.store.set(key, v);
    return v;
  }
  expire(key: string, _seconds: number): void {
    this.ttls.add(key);
  }
  hasTtl(key: string): boolean {
    return this.ttls.has(key);
  }
}

// The ORIGINAL two-round-trip reference solution, with the crash point
// made explicit so the leak is directly demonstrable.
async function isAllowedBuggy(
  redis: FakeRedis,
  key: string,
  crashAfterIncr: boolean,
): Promise<number> {
  const count = redis.incr(key);
  if (crashAfterIncr) {
    throw new Error('process crashed here -- before EXPIRE ever runs');
  }
  if (count === 1) redis.expire(key, 60);
  return count;
}

const redis = new FakeRedis();
try {
  await isAllowedBuggy(redis, 'ratelimit:u1', true);
} catch (e) {
  console.log('crashed:', (e as Error).message);
}
console.log('key has a TTL after the crash?', redis.hasTtl('ratelimit:u1'));
// crashed: process crashed here -- before EXPIRE ever runs
// key has a TTL after the crash? false  <-- leaked forever, no TTL`,
    },
    {
      label: 'The atomic fix',
      language: 'typescript',
      code: `// The SAME crash point, but with the increment and the conditional
// TTL now inside one atomic operation -- there is no gap left for a
// crash to land in.
class FakeRedis {
  private store = new Map<string, number>();
  private ttls = new Set<string>();

  // Simulates a single EVAL call: real Redis guarantees a Lua script
  // runs as one indivisible unit, with nothing else interleaved.
  atomicIncrAndExpire(key: string, windowSeconds: number): number {
    const v = (this.store.get(key) ?? 0) + 1;
    this.store.set(key, v);
    if (v === 1) this.ttls.add(key);
    return v;
  }
  hasTtl(key: string): boolean {
    return this.ttls.has(key);
  }
}

async function isAllowedFixed(redis: FakeRedis, key: string): Promise<number> {
  // one call -- no possible crash point between increment and TTL
  return redis.atomicIncrAndExpire(key, 60);
}

const redis = new FakeRedis();
const count = await isAllowedFixed(redis, 'ratelimit:u1');
console.log('count:', count, '-- TTL set in the same call:', redis.hasTtl('ratelimit:u1'));
// count: 1 -- TTL set in the same call: true`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The main page\'s own mistake block only ever demonstrated the crash-window risk for <code>SET</code> + <code>EXPIRE</code>. Does the same risk apply to a raw <code>MULTI</code>/<code>EXEC</code> transaction wrapping <code>INCR</code> and <code>EXPIRE</code> instead of a Lua script?',
    hint: 'Think about WHEN Redis actually queues vs. executes MULTI/EXEC commands, and whether a client-side crash can happen mid-transaction the same way it can between two independent commands.',
    solution: `Yes, the risk is genuinely different for MULTI/EXEC, and mostly in a GOOD way, but with one real caveat worth naming.

MULTI queues INCR and EXPIRE on the client side; nothing is sent to the server until EXEC runs. EXEC itself, once it reaches Redis, executes every queued command as one atomic block -- Redis never interleaves another client's command in the middle of it. So once EXEC is actually sent and Redis starts processing it, there is no crash window left INSIDE Redis's own execution: either the whole transaction runs, or (if the connection drops before Redis replies) the client cannot be SURE it ran, but Redis itself never leaves it half-applied.

The real caveat: if the process crashes on the CLIENT side after calling MULTI but before ever sending EXEC, nothing happened at all (INCR was only ever queued locally, never sent) -- so there is no leaked key in that case, which is actually safer than the Lua-script version's "script already ran, but EXEC's own network reply was lost" ambiguity. The Lua/EVAL approach is still generally preferred for a rate limiter specifically because it is ONE round trip (MULTI/EXEC still needs two: one to queue, one to EXEC) -- fewer round trips means lower latency under load, not a stronger correctness guarantee.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"The main page\'s mistake block is only about SET + EXPIRE specifically — INCR + EXPIRE is a different pair of commands, so the same warning doesn\'t apply."',
      reality: 'The lesson generalizes to ANY two-round-trip "do a thing, then set its TTL" pattern, regardless of which first command is used. INCR + EXPIRE has the identical crash-window shape as SET + EXPIRE — a process death between the two calls leaves a key with no TTL, forever.',
    },
    {
      thought: '"Only a full process crash can trigger this — a normal restart or redeploy is safe."',
      reality: 'A container orchestrator killing a pod mid-request (a rolling deploy, an OOM kill, a liveness-probe failure) is exactly the same failure shape as a crash from the running code\'s own perspective — there is no guarantee the second command ever runs, and this happens routinely in production, not just in rare crash scenarios.',
    },
  ];

  topicLabel = 'Strings';
  topicRoute = '/redis/strings';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'MSETNX Is All-or-Nothing; a Loop of SETNX Calls Is Not',
    route: '/redis/strings/msetnx-all-or-nothing-vs-a-loop-of-setnx-calls',
  };
}
