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
    heading: 'A Rate Limiter That Locks Out Exactly the Client It’s Meant to Protect Against',
    points: [
      'The main page’s own primary "Sliding Window (Redis)" codeTab runs <code>zAdd</code> (recording the current request in the sorted set) UNCONDITIONALLY, inside the same pipeline as the count check — before the code has decided whether the request will be allowed or rejected. This means a REJECTED (429) request still permanently occupies a slot in the sliding window it was just denied entry to.',
      'Simulated directly against the exact pipeline order the codeTab uses (evict old entries, count, add current, expire): a burst of 10 requests against a limit of 5 leaves 10 entries in the sorted set — not 5 — since every one of the 5 rejected requests got added too.',
      'The consequence compounds under the EXACT scenario the page’s own theory section names first as the whole reason rate limiting exists — "runaway clients that accidentally hammer your servers with retry loops." Simulated: a client that retries once per second after its first rejection never gets an allowed request again, for the entire 70-second test window, because every retry attempt re-adds a fresh, un-aged entry to its own sliding window. The client’s own retry behavior is what keeps it locked out.',
      'This has now been fixed on the main page: the sorted-set write only happens AFTER the check confirms the request is allowed — the small cost is that the check-then-write is now two Redis round trips instead of one, reopening a narrow race window between two truly concurrent requests (the same TOCTOU trade-off this page’s own QnA on token-bucket Lua scripts already discusses for a different algorithm) — a real cost, but a far smaller one than a 100%-reproducible permanent lockout.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Reproducing the Lockout, and the Fix',
    language: 'typescript',
    code: `// A plain-JS stand-in for a Redis sorted set -- same semantics as
// zRemRangeByScore / zCard / zAdd, used to verify the exact bug and fix
// without needing a live Redis instance.
class SortedSetSim {
  private entries: { score: number }[] = [];
  zRemRangeByScore(minExclusiveScore: number) {
    this.entries = this.entries.filter(e => e.score >= minExclusiveScore);
  }
  zCard() { return this.entries.length; }
  zAdd(score: number) { this.entries.push({ score }); }
}

// BUGGY -- matches the ORIGINAL codeTab exactly: zAdd runs unconditionally,
// before the allow/reject decision is made.
function simulateBuggy(store: SortedSetSim, now: number, windowMs: number, maxRequests: number) {
  store.zRemRangeByScore(now - windowMs);
  const requestCount = store.zCard();
  store.zAdd(now); // <-- the bug: adds even when this request will be rejected
  return { allowed: requestCount < maxRequests };
}

// FIXED -- only add the entry once the request is confirmed allowed.
function simulateFixed(store: SortedSetSim, now: number, windowMs: number, maxRequests: number) {
  store.zRemRangeByScore(now - windowMs);
  const requestCount = store.zCard();
  const allowed = requestCount < maxRequests;
  if (allowed) store.zAdd(now);
  return { allowed };
}

const windowMs = 60_000, maxRequests = 5;
const now = 1_700_000_000_000;

// Burst of 10 requests at t=0 (5 should be allowed, 5 rejected), then the
// client retries once a second for the next 70 seconds -- a naive but very
// common client behavior, and the exact "runaway retry loop" scenario the
// main page's own theory section opens with.
const buggyStore = new SortedSetSim();
for (let i = 0; i < 10; i++) simulateBuggy(buggyStore, now, windowMs, maxRequests);
let buggyRecoveredAt: number | null = null;
for (let s = 1; s <= 70; s++) {
  if (simulateBuggy(buggyStore, now + s * 1000, windowMs, maxRequests).allowed) { buggyRecoveredAt = s; break; }
}
console.log('BUGGY -- recovered at t+', buggyRecoveredAt, 'seconds (null = never within 70s)');
// -> null: the client is NEVER allowed again while it keeps retrying.

const fixedStore = new SortedSetSim();
for (let i = 0; i < 10; i++) simulateFixed(fixedStore, now, windowMs, maxRequests);
let fixedRecoveredAt: number | null = null;
for (let s = 1; s <= 70; s++) {
  if (simulateFixed(fixedStore, now + s * 1000, windowMs, maxRequests).allowed) { fixedRecoveredAt = s; break; }
}
console.log('FIXED -- recovered at t+', fixedRecoveredAt, 'seconds');
// -> 61: exactly windowMs (60s) after the last of the 5 ALLOWED requests aged out.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Under the FIXED version, a client sends a burst of exactly <code>maxRequests</code> (5) requests at t=0, all allowed, then goes completely silent (no more requests at all). At what point in time does the client next have full capacity (5 available requests) again?',
  hint: 'Every entry the fixed version adds is added ONLY on allow — so all 5 entries share the exact same timestamp (t=0). <code>zRemRangeByScore</code> evicts anything strictly older than <code>now - windowMs</code>.',
  solution: `// All 5 allowed requests were added at t=0 with an IDENTICAL score.
// A later request at time T evicts anything with score < T - windowMs.
//
// For all 5 entries (score = 0) to be evicted, we need:
//   0 < T - windowMs
//   T > windowMs
//   T > 60,000ms (60 seconds)
//
// So the client has full capacity again the instant a NEW request arrives
// at t > 60s (t=60,001ms or later) -- at that moment, zRemRangeByScore
// evicts all 5 old entries in one step (since they share the same
// timestamp), zCard reads 0, and the client is immediately allowed its
// full burst of 5 again.
//
// This is the correct, INTENDED sliding-window property the bug defeated:
// requests age out based on THEIR OWN timestamp, not a client's retry
// behavior after being rejected -- which is exactly why the fix (never
// recording a rejected request at all) restores it.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A sliding-window rate limiter that rejects a request has, by definition, no lasting effect beyond that one rejected request.',
    reality: 'The codeTab’s original implementation demonstrates the opposite: because the rejected request’s timestamp still got permanently added to the sorted set, a SINGLE burst of rejected requests could keep a client locked out far longer than the configured window — and a retrying client could be locked out indefinitely, since every new rejected retry re-added a fresh entry.',
  },
  {
    thought: 'The bug only matters for clients that are already misbehaving (bursting way over the limit), so it’s a self-correcting problem — those clients "deserve" the extra penalty.',
    reality: 'The bug specifically penalizes the exact behavior a well-designed 429 response is supposed to encourage: retrying. A client following textbook advice (read <code>Retry-After</code>, wait, retry once) would ALSO keep re-polluting its own window under the buggy version, turning correct, well-behaved retry logic into a self-perpetuating lockout — not just punishing genuinely abusive clients.',
  },
  {
    thought: 'Fixing this bug by splitting one pipeline into a read-then-conditionally-write two-step sequence introduces the exact same kind of race condition problem the bug was supposed to prevent, so it’s not really a fix.',
    reality: 'It trades a 100%-reproducible, severe bug (permanent lockout under any retry pattern) for a narrow, much less severe race window that only matters between two GENUINELY CONCURRENT requests arriving in the same tiny interval — and even then, the worst outcome is a small, bounded overshoot of the limit, not a client being permanently unable to make requests at all.',
  },
];

@Component({
  selector: 'app-api-rate-limiting-sliding-window-lockout',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-sliding-windows-rejected-request-lockout-bug.html',
  styleUrl: './the-sliding-windows-rejected-request-lockout-bug.scss',
})
export class TheSlidingWindowsRejectedRequestLockoutBugSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
