import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'The Atomicity the QnA Explains, Never Shown as Code',
    points: [
      'A QnA on this page explains precisely WHY a distributed token bucket needs to run inside a Redis Lua script rather than separate application-side commands: a check-and-decrement is a read-modify-write sequence, and issuing it as separate round trips opens a TOCTOU race where two concurrent requests could both read "enough tokens available" and both proceed, silently exceeding the bucket’s own limit.',
      'The page’s own "Token Bucket" codeTab, though, is a plain in-memory JavaScript class with a single-process <code>Map</code> — its own comment even says "Per-consumer buckets stored in Redis (simplified in-memory version)," acknowledging a real Redis-backed version exists conceptually, but it’s never actually shown.',
      'Redis executes a Lua script as ONE atomic unit — no other client’s commands can interleave partway through it, which is exactly the guarantee needed here: read the bucket’s current token count, refill it based on elapsed time, check against the requested cost, and (if allowed) write the new state back, all without any other request’s script able to run in between.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Redis Lua Script + Verification',
    language: 'typescript',
    code: `-- token_bucket.lua -- runs atomically inside Redis (single-threaded
-- execution model), so no other client's script can interleave partway
-- through this one.
--
-- KEYS[1] = bucket key
-- ARGV[1] = now (ms)
-- ARGV[2] = capacity
-- ARGV[3] = refillPerSec
-- ARGV[4] = cost (tokens this request consumes)
--
-- local state = redis.call('HMGET', KEYS[1], 'tokens', 'lastRefillMs')
-- local tokens = tonumber(state[1])
-- local lastRefillMs = tonumber(state[2])
-- local now, capacity, refillPerSec, cost =
--   tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3]), tonumber(ARGV[4])
--
-- if tokens == nil then
--   tokens = capacity
--   lastRefillMs = now
-- end
--
-- local elapsedSec = (now - lastRefillMs) / 1000
-- tokens = math.min(capacity, tokens + elapsedSec * refillPerSec)
--
-- local allowed = 0
-- if tokens >= cost then
--   tokens = tokens - cost
--   allowed = 1
-- end
--
-- redis.call('HSET', KEYS[1], 'tokens', tokens, 'lastRefillMs', now)
-- redis.call('EXPIRE', KEYS[1], math.ceil(capacity / refillPerSec) * 2)
-- return { allowed, tokens }

// A plain-TS function computing EXACTLY what the Lua script above computes --
// used here to verify the algorithm's behavior directly, since there's no
// live Redis instance in this environment. Applied to a Redis client, the
// same logic runs via redis.eval(script, { keys: [key], arguments: [...] }).
interface BucketState { tokens: number; lastRefillMs: number; }

function tokenBucketScript(
  state: BucketState | null,
  nowMs: number,
  capacity: number,
  refillPerSec: number,
  cost: number,
): { allowed: boolean; newState: BucketState } {
  if (!state) state = { tokens: capacity, lastRefillMs: nowMs };
  const elapsedSec = (nowMs - state.lastRefillMs) / 1000;
  const refilled = Math.min(capacity, state.tokens + elapsedSec * refillPerSec);

  if (refilled >= cost) {
    return { allowed: true, newState: { tokens: refilled - cost, lastRefillMs: nowMs } };
  }
  return { allowed: false, newState: { tokens: refilled, lastRefillMs: nowMs } };
}

// Verified: capacity=3, refillPerSec=1, cost=1 -- 4 requests fired at the
// exact same instant (0 elapsed time between them, simulating truly
// concurrent requests a Lua script would serialize one after another).
let state: BucketState | null = null;
const now = 1_700_000_000_000;

const r1 = tokenBucketScript(state, now, 3, 1, 1); state = r1.newState;
const r2 = tokenBucketScript(state, now, 3, 1, 1); state = r2.newState;
const r3 = tokenBucketScript(state, now, 3, 1, 1); state = r3.newState;
const r4 = tokenBucketScript(state, now, 3, 1, 1); state = r4.newState;

console.log('r1:', r1.allowed, 'r2:', r2.allowed, 'r3:', r3.allowed, 'r4:', r4.allowed);
// -> true, true, true, false -- exactly 3 (the capacity) allowed, the 4th
//    correctly rejected, matching a real Lua script's serialized execution.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Two "concurrent" requests, each costing 2 tokens, arrive at a bucket with 3 tokens currently available (capacity=5, but currently sitting at 3 after some earlier use, refillPerSec=0 for this instant — no time has elapsed). Using <code>tokenBucketScript()</code>, are BOTH requests allowed?',
  hint: 'A Lua script guarantees one request’s entire read-modify-write runs to completion before the next one starts — apply the function to the FIRST request, take its <code>newState</code>, then apply it to the SECOND request using that updated state, not the original.',
  solution: `let state = { tokens: 3, lastRefillMs: now };

const first = tokenBucketScript(state, now, 5, 0, 2);
state = first.newState;
console.log('first request (cost 2, had 3):', first.allowed, 'tokens left:', state.tokens);
// -> allowed: true, tokens left: 1

const second = tokenBucketScript(state, now, 5, 0, 2);
console.log('second request (cost 2, had 1):', second.allowed);
// -> allowed: false -- only 1 token remains, cost is 2

// This is the exact guarantee a Lua script provides that two separate
// application-side Redis commands (a GET followed by a SET) would NOT:
// the second request's check runs against the FIRST request's already-
// updated state, never against the stale pre-decrement value both
// requests would otherwise read if they ran as separate round trips.
// A naive two-command version could have BOTH requests read "3 tokens
// available, cost is 2, allowed" and both succeed -- exceeding the
// bucket's real capacity by exactly the same TOCTOU race the sliding-
// window subtopic's fix deliberately reopened for a smaller cost.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A Lua script inside Redis is just a convenient way to bundle several commands together — it doesn’t provide any stronger guarantee than issuing the same commands as a plain pipeline.',
    reality: 'Redis executes a Lua script as a single atomic unit against its own single-threaded command processor — no other client\'s command, script, or transaction can run in the middle of it. A pipeline batches multiple ROUND TRIPS but still lets other clients\' commands interleave between the pipeline\'s own individual operations; a Lua script genuinely does not.',
  },
  {
    thought: 'Since the main page’s in-memory <code>TokenBucket</code> class works correctly in its own codeTab example, the "simplified in-memory version" comment is just a minor implementation detail, not a meaningful gap.',
    reality: 'The in-memory version only works correctly for a SINGLE process — the exact same "not shared across instances" problem the page\'s own separate mistake block ("Using in-memory rate limiting in a multi-instance deployment") explicitly warns against for a DIFFERENT algorithm. The gap is real: the Token Bucket codeTab demonstrates the algorithm\'s logic but not the distributed-safety half the page\'s theory already promises.',
  },
  {
    thought: 'The Try It’s two-request race scenario only matters for a token bucket specifically — the sliding window algorithm from the previous subtopic doesn’t have an equivalent concurrent-request risk.',
    reality: 'The fixed sliding-window implementation from the previous subtopic has the EXACT same category of race (two truly concurrent requests could both read a count below the limit and both add themselves, briefly exceeding it) — it was a deliberate, explicitly-labeled trade-off made there specifically to fix a much more severe bug (permanent lockout), not evidence that only token bucket has this risk.',
  },
];

@Component({
  selector: 'app-api-rate-limiting-lua-token-bucket',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-lua-script-atomic-token-bucket.html',
  styleUrl: './a-lua-script-atomic-token-bucket.scss',
})
export class ALuaScriptAtomicTokenBucketSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
