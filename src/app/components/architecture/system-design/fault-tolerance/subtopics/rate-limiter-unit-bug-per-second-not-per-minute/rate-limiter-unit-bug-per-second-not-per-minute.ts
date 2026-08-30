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
  templateUrl: './rate-limiter-unit-bug-per-second-not-per-minute.html',
  styleUrl: './rate-limiter-unit-bug-per-second-not-per-minute.scss'
})
export class RateLimiterUnitBugPerSecondNotPerMinuteSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A unit mismatch, catchable by comparing the code to the class it calls',
      points: [
        'The main page\'s Challenge solution instantiated its rate limiter as new TokenBucketLimiter(redis, 10, 20) with the comment "10/min per user" — matching the Challenge\'s own hint, "Rate limiter: 10 payments/min per user." But the TokenBucketLimiter class defined earlier on the SAME page has a constructor signature of (redis, ratePerSec, burst) — its second parameter is explicitly a PER-SECOND rate, not per-minute. The code has been corrected.',
        'This is exactly the kind of bug that survives a read-through because the COMMENT and the INTENT (from the hints) agree with each other — it is only checking the actual VALUE against the CLASS DEFINITION\'S OWN PARAMETER NAME that reveals the mismatch.',
      ]
    },
    {
      heading: 'What the buggy value actually configured',
      points: [
        'Passing 10 as ratePerSec configures the bucket to refill 10 tokens EVERY SECOND — sustained over a minute, that is 10 x 60 = 600 tokens available per minute, not 10.',
        'That is a 60x more permissive rate limit than the stated design intent. For a payment endpoint specifically, this is a meaningful gap: a rate limit meant to catch runaway retry loops or abusive automation at "10 payments/min" would, as actually configured, allow up to 600 payment attempts per minute per user before triggering — functionally close to no protection at all for the abuse patterns the limiter was meant to catch.',
      ]
    },
    {
      heading: 'The fix: convert the stated per-minute rate into the class\'s expected per-second unit',
      points: [
        'TokenBucketLimiter expects ratePerSec — to express "10 per minute" in that unit, divide by 60: 10 / 60 ≈ 0.1667 tokens refilled per second, which sustains an average of 10 allowed requests per 60-second window.',
        'The burst parameter can stay reasonably close to the per-minute figure (e.g. 10) to allow a user to make their full minute\'s allotment in a quick sequence if needed, while the slow refill rate (0.1667/sec) enforces the sustained 10/min ceiling afterward.',
        'This is a good general lesson for any rate-limiter integration: always check what UNIT a library or class\'s constructor parameter actually expects — a correctly-typed number in the right ballpark (10 is a very plausible-looking argument for "10/min") can still be wrong by an order of magnitude if the unit assumption is off.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug and the fix',
      language: 'typescript',
      code: `class TokenBucketLimiter {
  constructor(
    private redis: RedisClient,
    private readonly ratePerSec: number = 100,  // <- PER SECOND, not per minute
    private readonly burst: number = 200
  ) {}
  // ...
}

// BUGGY: comment says "10/min" but the value passed IS the per-second rate
const rateLimiterBuggy = new TokenBucketLimiter(redis, 10, 20); // 10/min per user
// Actual effect: 10 tokens/sec refill = up to 600 tokens/min -- 60x too permissive

// FIXED: convert the intended 10/min into the class's expected per-second unit
const rateLimiterFixed = new TokenBucketLimiter(redis, 10 / 60, 10); // 10/min per user
// 10 / 60 ~= 0.1667 tokens/sec refill -- sustains ~10 allowed requests per 60s window`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A payment service is supposed to rate-limit each user to 10 payment attempts per minute. The engineer writes new TokenBucketLimiter(redis, 10, 20), reasoning "10 requests, so I\'ll pass 10." A week later, a bug in the client causes a user\'s browser to retry a failed payment in a tight loop for 30 seconds — and the rate limiter never kicks in. Why not?',
    hint: 'What unit does TokenBucketLimiter\'s second constructor argument actually represent, and how many requests would 30 seconds of continuous retries generate against that unit?',
    solution: 'TokenBucketLimiter\'s second argument is ratePerSec, not a per-minute figure — passing 10 configures the bucket to refill 10 tokens EVERY SECOND, sustaining up to 600 requests per minute, not 10. A 30-second retry loop generates far fewer than 300 requests (10/sec x 30s = 300 possible tokens available), so the buggy configuration never triggers the rate limit at all for this scenario — the limiter was effectively 60x too permissive to catch it. The fix is passing 10 / 60 (~0.1667) as the ratePerSec argument, which correctly sustains an average of 10 allowed requests per 60-second window and would have throttled the runaway retry loop as intended.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the code comment says "10/min per user" and matches the Challenge\'s own stated requirement, the rate limiter is configured correctly.',
      reality: 'Per this subtopic\'s theory, the comment describes the INTENT, not what the code actually does — the TokenBucketLimiter class\'s own constructor signature defines its second parameter as ratePerSec, and passing 10 there configures 10/sec (600/min), not 10/min.'
    },
    {
      thought: 'Passing "10" as a rate-limiter argument is a reasonable, safe-looking value regardless of which time unit the class expects.',
      reality: 'Per this subtopic\'s theory, the exact same numeric value (10) represents wildly different actual rate limits depending on the unit — 10/sec is 60x more permissive than 10/min — so the value alone says nothing about correctness without checking the parameter\'s actual unit.'
    },
    {
      thought: 'This kind of unit-mismatch bug would show up quickly in testing, since a broken rate limiter is easy to notice.',
      reality: 'Per this subtopic\'s theory, an OVER-permissive rate limiter (allowing too much traffic) is a "quiet" failure mode — normal usage patterns still work fine, and the gap is only exposed under abuse or a runaway retry scenario, which may not be covered by routine testing.'
    }
  ];
}
