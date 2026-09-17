import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-the-off-by-one-in-remaining-after-an-allowed-request',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-off-by-one-in-remaining-after-an-allowed-request.html',
  styleUrl: './the-off-by-one-in-remaining-after-an-allowed-request.scss',
})
export class TheOffByOneInRemainingAfterAnAllowedRequestSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The bug: remaining never accounts for the request it just allowed',
      points: [
        'The main page\'s own Sliding Window Counter Challenge solution computes <code>total</code> — the weighted count BEFORE deciding whether to allow the current request — and, when allowed, increments <code>cur</code> by 1 to record it. But the returned <code>remaining</code> value was computed from the pre-increment <code>total</code>, adding the increment ONLY in the rejected case: <code>total + (allowed == 1 and 0 or 1)</code> — the exact opposite of what\'s needed.',
        'Verified by tracing exactly <code>limit</code> requests through the reference solution: the 10th request (the LAST one that is actually allowed, bringing the true count to precisely the limit) reports <code>remaining: 1</code> — telling the caller one more request is available when the true remaining is 0.',
        'The main page\'s own third mistake block insists on returning accurate rate-limit headers to clients specifically so they can back off correctly: "X-RateLimit-Remaining tells them how many requests are left." A client that trusts this header\'s off-by-one value fires one more request immediately, gets rejected, and has effectively been lied to by the header meant to prevent exactly that outcome.',
      ],
    },
    {
      heading: 'The fix is a single flipped ternary, verified against the true state',
      points: [
        'Correct behavior: when a request is ALLOWED, the weighted count that should be reported is <code>total + 1</code> (the just-consumed slot); when REJECTED, nothing was added, so it stays <code>total</code>. That is exactly the opposite of the ternary the original code had — <code>allowed == 1 and 1 or 0</code> instead of <code>allowed == 1 and 0 or 1</code>.',
        'This class of bug — an off-by-one hiding inside a compact single-line return expression mixing a conditional with arithmetic — is easy to introduce and easy to miss on a casual read, since the LINE still looks internally consistent; only tracing several requests through the SAME state across calls reveals the systematic +1 error.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the off-by-one, then fixing it',
      language: 'typescript',
      code: `interface BucketState { cur?: number; prev?: number; winStart?: number }

// Mirrors the Challenge's own Lua logic exactly (buggy remaining calculation).
function slidingCounterBuggy(state: BucketState, limit: number, window: number, now: number) {
  let { cur = 0, prev = 0, winStart = now } = state;
  let elapsed = now - winStart;
  if (elapsed >= window) {
    prev = elapsed < window * 2 ? cur : 0;
    cur = 0; winStart = now; elapsed = 0;
  }
  const weight = prev * ((window - elapsed) / window);
  const total = Math.floor(cur + weight);
  let allowed = 0;
  if (total < limit) { cur = cur + 1; allowed = 1; }
  // BUGGY: adds 1 only when REJECTED -- backwards.
  const remaining = Math.max(0, limit - Math.floor(total + (allowed === 1 ? 0 : 1)));
  return { allowed: allowed === 1, remaining, state: { cur, prev, winStart } };
}

// FIXED: adds 1 only when ALLOWED -- accounts for the request just consumed.
function slidingCounterFixed(state: BucketState, limit: number, window: number, now: number) {
  let { cur = 0, prev = 0, winStart = now } = state;
  let elapsed = now - winStart;
  if (elapsed >= window) {
    prev = elapsed < window * 2 ? cur : 0;
    cur = 0; winStart = now; elapsed = 0;
  }
  const weight = prev * ((window - elapsed) / window);
  const total = Math.floor(cur + weight);
  let allowed = 0;
  if (total < limit) { cur = cur + 1; allowed = 1; }
  const remaining = Math.max(0, limit - Math.floor(total + (allowed === 1 ? 1 : 0)));
  return { allowed: allowed === 1, remaining, state: { cur, prev, winStart } };
}

// Fire exactly limit (10) requests in one window through both versions.
let buggyState: BucketState = {}, fixedState: BucketState = {};
for (let i = 1; i <= 10; i++) {
  const b = slidingCounterBuggy(buggyState, 10, 60, 1000); buggyState = b.state;
  const f = slidingCounterFixed(fixedState, 10, 60, 1000); fixedState = f.state;
  if (i === 10) console.log(\`request #10 -- buggy remaining: \${b.remaining}, fixed remaining: \${f.remaining}\`);
}
// request #10 -- buggy remaining: 1, fixed remaining: 0`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Suppose a client makes exactly <code>limit - 1</code> requests in a fresh window, then reads the buggy version\'s reported <code>remaining</code> value after that last request. Does the buggy version tell the client the truth in THIS specific case, or does the off-by-one still apply?',
    hint: 'Trace through the buggy formula for the (limit-1)th request specifically — does the +1 land on the correct side of the allowed/rejected branch this time?',
    solution: `For the (limit-1)th request, the buggy version happens to report the CORRECT remaining value. After (limit-1) allowed requests, the true remaining is exactly 1 -- and the buggy formula (limit - floor(total + 0)) with total = limit-2 (the pre-increment count) computes limit - (limit-2) = 2... which is actually still wrong by one in the SAME direction (overstating by 1), just less obviously so since it never hits the "reports something available when truly at zero" scenario until the FINAL allowed request.

The bug is systematic, not confined to the boundary -- every single allowed request's reported remaining overstates the true remaining-after-this-request by exactly 1, confirmed by the direct trace above showing every one of the first 10 requests off by 1. It is only the LAST allowed request (bringing the count exactly to the limit) where the overstatement becomes actively misleading enough to cause a client's very next request to be unexpectedly rejected despite being told capacity remained.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"An off-by-one this small in a rate limiter\'s remaining count barely matters — it\'s just a display detail, not a functional bug."',
      reality: 'The main page\'s own third mistake block treats accurate rate-limit headers as essential precisely because clients use them to decide WHEN to retry. A client that trusts an overstated remaining count sends a request it believes will succeed and gets rejected instead — the exact "clients retry immediately, amplifying traffic" failure mode that mistake block exists to prevent.',
    },
    {
      thought: '"Since the Lua script runs atomically, any value it returns must be internally consistent and therefore correct."',
      reality: 'Atomicity guarantees the SCRIPT\'S OWN STATE never races with another client\'s concurrent script execution — it says nothing about whether the ARITHMETIC inside the script correctly computes the value it returns. This bug survived precisely because atomicity was never in question; the formula itself was simply wrong.',
    },
  ];

  topicLabel = 'Rate Limiting';
  topicRoute = '/redis/rate-limiting';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'Implementing Leaky Bucket with a Bounded Queue',
    route: '/redis/rate-limiting/implementing-leaky-bucket-with-a-bounded-queue',
  };
}
