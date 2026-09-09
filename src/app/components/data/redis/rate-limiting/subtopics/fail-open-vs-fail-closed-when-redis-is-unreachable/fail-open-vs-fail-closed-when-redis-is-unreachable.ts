import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-fail-open-vs-fail-closed-when-redis-is-unreachable',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './fail-open-vs-fail-closed-when-redis-is-unreachable.html',
  styleUrl: './fail-open-vs-fail-closed-when-redis-is-unreachable.scss',
})
export class FailOpenVsFailClosedWhenRedisIsUnreachableSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Named as an aside, never actually wired up',
      points: [
        'The main page\'s own QnA on distributed rate limiting mentions the choice in one clause: "Consider circuit breakers: if Redis is unavailable, fail open (no rate limit) or fail closed (reject all)." No codeTab anywhere on the page actually wraps a rate-limit check with either behavior — every codeTab assumes Redis is always reachable and simply awaits the result.',
        'Every rate limiter on this page — Fixed Window, Sliding Window, Token Bucket — depends on a live Redis connection for every single check. When that connection is down (a network partition, Redis restarting, a timeout), the rate-limit call itself throws, and NOTHING in any of the main page\'s own functions says what should happen next.',
      ],
    },
    {
      heading: 'Fail-open and fail-closed protect against opposite failure modes',
      points: [
        'Fail-OPEN treats a Redis outage as "let every request through, unlimited" — the API stays fully available, but for as long as Redis is down, there is effectively no rate limiting at all, which can be dangerous for a limiter that exists specifically to prevent abuse or protect a fragile downstream (a payment processor, a third-party API with its own strict limits).',
        'Fail-CLOSED treats a Redis outage as "reject every request" — abuse protection stays intact even during an outage, but the entire API becomes unavailable to EVERY caller, including completely legitimate ones, the moment Redis has any trouble at all — turning a Redis blip into a full outage of whatever the rate limiter was protecting.',
        'Neither choice is universally correct — it is a decision about which failure mode is more acceptable for the SPECIFIC endpoint being protected, and different endpoints on the same API can reasonably choose differently (a login endpoint might fail closed to protect against brute-force; a low-risk read endpoint might fail open to stay available).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Wrapping a rate-limit check with both modes',
      language: 'typescript',
      code: `import Redis from 'ioredis';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  degraded?: boolean; // true when this result came from the fallback path, not Redis
}

type FailureMode = 'fail-open' | 'fail-closed';

async function checkRateLimitSafely(
  checkFn: () => Promise<RateLimitResult>,
  mode: FailureMode,
): Promise<RateLimitResult> {
  try {
    return await checkFn();
  } catch (err) {
    // Redis is unreachable -- checkFn threw before ever returning a real result.
    if (mode === 'fail-open') {
      return { allowed: true, remaining: -1, degraded: true }; // let it through
    }
    return { allowed: false, remaining: 0, degraded: true }; // reject when uncertain
  }
}

// Simulating Redis being unreachable for this call:
const redisDown = () => { throw new Error('ECONNREFUSED: Redis unavailable'); };

async function demo() {
  const openResult = await checkRateLimitSafely(async () => redisDown(), 'fail-open');
  const closedResult = await checkRateLimitSafely(async () => redisDown(), 'fail-closed');
  console.log('fail-open during outage:', openResult);
  console.log('fail-closed during outage:', closedResult);
}
// fail-open during outage:   { allowed: true,  remaining: -1, degraded: true }
// fail-closed during outage: { allowed: false, remaining: 0,  degraded: true }`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A login endpoint uses rate limiting specifically to slow down brute-force password guessing. During a brief Redis outage, would fail-open or fail-closed be the safer default for THIS endpoint, and what does the opposite choice risk?',
    hint: 'Ask what an attacker gains, specifically, if rate limiting silently disappears for the exact endpoint whose entire purpose is limiting repeated attempts.',
    solution: `Fail-CLOSED is the safer default for a login endpoint. If rate limiting silently disappears during an outage (fail-open), an attacker running a brute-force attack gets completely unthrottled access to the login endpoint for the ENTIRE duration of the outage -- precisely the scenario the rate limiter exists to prevent, and the outage window is exactly when an attacker running an automated attack is least likely to notice or care about a temporary Redis blip.

Fail-closed's own risk is different: EVERY legitimate user is locked out of logging in until Redis recovers, turning a Redis outage into a full login outage. This is a real cost, but it is a cost borne EQUALLY by attackers and legitimate users alike, whereas fail-open's cost (unthrottled brute-forcing) is borne asymmetrically -- it specifically helps the attacker the rate limiter was built to stop. This is exactly why the main page's own QnA frames the choice as endpoint-specific rather than a single global default: a low-stakes, high-availability-priority endpoint might reasonably choose the opposite trade-off.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"A well-configured Redis cluster with replicas essentially never goes down, so choosing fail-open vs. fail-closed is a purely theoretical exercise that rarely matters in practice."',
      reality: 'Redis being reachable and Redis RESPONDING IN TIME are two separate failure modes — a network partition, a slow failover, or a client-side timeout can all make a rate-limit check throw even when the Redis cluster itself is technically healthy. The main page\'s own QnA raises this concern specifically for MULTI-REGION distributed setups, where network partitions between regions are a realistic, recurring operational event, not a rare edge case.',
    },
    {
      thought: '"Fail-open and fail-closed are properties of the rate limiter algorithm itself (Token Bucket vs. Sliding Window) — you pick one when you pick the algorithm."',
      reality: 'They are completely orthogonal to which rate-limiting ALGORITHM is used — verified above by wrapping a generic checkFn with either behavior, with no assumption about what the underlying algorithm actually does. Any of the main page\'s own Fixed Window, Sliding Window, or Token Bucket implementations could be wrapped with either fail-open or fail-closed behavior identically.',
    },
  ];

  topicLabel = 'Rate Limiting';
  topicRoute = '/redis/rate-limiting';
  prev: SubtopicLink | null = {
    label: 'Implementing Leaky Bucket with a Bounded Queue',
    route: '/redis/rate-limiting/implementing-leaky-bucket-with-a-bounded-queue',
  };
  next: SubtopicLink | null = null;
}
