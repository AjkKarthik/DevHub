import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './fixed-window-rate-limiting-boundary-burst.html',
  styleUrl: './fixed-window-rate-limiting-boundary-burst.scss'
})
export class FixedWindowRateLimitingBoundaryBurstSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The algorithm the code actually implements, and the flaw it never names',
      points: [
        'The "Auth + Rate Limiting Middleware" code example implements what\'s specifically called a FIXED WINDOW counter: it tracks a count and a fixed reset timestamp, resetting the count to zero the moment the current time passes that timestamp. The page never names this algorithm or its well-known limitation.',
        'The flaw: a client can send up to the limit right before a window resets, and immediately send up to the limit again right after — two full bursts within a much shorter real time span than the stated window, purely because they landed on either side of the reset boundary.',
        'Concretely, with the page\'s own "100 req/min" example: a client could send 100 requests at 0:59.9, then another 100 requests at 1:00.1 — 200 requests inside a roughly 200-millisecond window, while technically staying "within the limit" of each individual fixed window. The stated "100 per minute" guarantee doesn\'t actually hold at the boundary.',
      ]
    },
    {
      heading: 'Why the page\'s own QnA mentions the alternative without ever explaining the tradeoff',
      points: [
        'The QnA\'s "How do you implement rate limiting at the API gateway?" answer opens by recommending "a sliding window counter" and later separately mentions "fixed window for simpler implementation" — both algorithms are named, but the actual DIFFERENCE (what problem sliding window solves that fixed window doesn\'t) is never explained, and the page\'s own code example uses the SIMPLER one without saying so.',
        'A sliding window approach (or its cheaper approximation, weighting the previous window\'s count based on how far into the current window you are) avoids the boundary-burst problem by never having a single instant where the whole counter resets to zero — the effective count is always based on a rolling recent-time span, not a fixed clock-aligned bucket.',
        'This is a genuine tradeoff, not a strict "always use sliding window" rule: fixed window is simpler to implement and reason about, and the boundary-burst risk is often acceptable for generous limits — but a rate limit meant to be a hard protective ceiling (protecting a fragile downstream service, not just fair-use throttling) should account for this gap explicitly rather than assume the stated limit is a hard guarantee.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The boundary-burst scenario, made concrete',
      language: 'typescript',
      code: `// The page's own rate limiter (simplified): a FIXED WINDOW counter
interface RateLimitEntry { count: number; reset: number; }
const rateLimiter = new Map<string, RateLimitEntry>();

function checkLimit(userId: string, now: number): boolean {
  const entry = rateLimiter.get(userId) ?? { count: 0, reset: now + 60_000 };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + 60_000; } // FULL reset
  if (entry.count >= 100) return false;
  entry.count++;
  rateLimiter.set(userId, entry);
  return true;
}

// Boundary burst: 100 requests just before the reset, 100 more just after --
// 200 requests in ~200ms, even though each individual window stayed "within 100"
const t0 = 59_900;   // 59.9 seconds into the window
for (let i = 0; i < 100; i++) checkLimit('user-1', t0); // all 100 allowed

const t1 = 60_100;   // 60.1 seconds -- window just reset
for (let i = 0; i < 100; i++) checkLimit('user-1', t1); // all 100 allowed AGAIN

// Sliding window avoids this by weighting the count against a moving time
// span instead of resetting fully at a fixed clock boundary -- there is no
// single instant where the effective count drops straight to zero.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A payment-processing downstream service can safely handle at most 150 requests in any 60-second span before its own connection pool saturates. The gateway enforces a "100 requests/minute" fixed-window limit in front of it, matching the page\'s own code example. Is the downstream service actually protected?',
    hint: 'Work out the WORST CASE number of requests that could arrive in a short span straddling a fixed-window reset boundary, not the average case.',
    solution: 'Not reliably. As this subtopic\'s theory shows, a fixed-window limiter can allow up to 100 requests right before a reset and another 100 right after -- 200 requests within a span far shorter than 60 seconds, purely from boundary timing, well past the downstream service\'s real 150-request safety margin. "100 requests/minute" describes each individual fixed window correctly, but does not bound the worst-case burst rate the way the name suggests. For a limit that exists specifically to protect a fragile downstream service (rather than just general fair-use throttling), a sliding window (or a lower fixed-window limit that leaves headroom for the worst case) is the safer choice.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"100 requests per minute" is a hard guarantee that no more than 100 requests will ever arrive within any 60-second span.',
      reality: 'Per this subtopic\'s theory, a FIXED WINDOW implementation only guarantees 100 requests per fixed, clock-aligned window — a burst straddling the reset boundary can produce up to double that within a much shorter real time span.'
    },
    {
      thought: 'Fixed window and sliding window rate limiting are just two names for the same underlying technique.',
      reality: 'Per this subtopic\'s theory, they behave genuinely differently at the reset boundary — fixed window resets its count to zero at a fixed instant, while sliding window never has a single moment where the effective count drops straight to zero.'
    },
    {
      thought: 'Since the boundary-burst problem exists, fixed-window rate limiting is a bug and should never be used.',
      reality: 'Per this subtopic\'s theory, fixed window is a legitimate, simpler choice when the boundary-burst risk is acceptable (general fair-use throttling) — the issue is using it silently for a limit meant to be a hard protective ceiling, without accounting for the gap.'
    }
  ];
}
