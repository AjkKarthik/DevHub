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
  templateUrl: './lock-ttl-can-expire-while-the-holder-is-still-working.html',
  styleUrl: './lock-ttl-can-expire-while-the-holder-is-still-working.scss'
})
export class LockTtlCanExpireWhileTheHolderIsStillWorkingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mutex-lock pattern uses redis.set(lockKey, "1", { NX: true, EX: 10 }) — a fixed 10-second TTL, chosen (per the QnA) specifically so a crashed holder doesn\'t block the lock forever — but that same fixed TTL creates a DIFFERENT problem if fetchFn() legitimately takes longer than 10 seconds',
      points: [
        'Redis\'s own official documentation on distributed locks states this limitation directly: mutual exclusion "is guaranteed only as long as the client holding the lock terminates its work within the lock validity time" (minus a small margin for clock drift). If the actual work takes LONGER than the lock\'s TTL, the lock expires while the original holder is still mid-fetch — and Redis has no way to know the holder is still working, since the TTL is just a timer, not a heartbeat.',
        'Once that TTL expires, a completely different process can acquire what looks like a fresh, available lock (the NX check succeeds again, since the old key is gone) and starts a SECOND, fully concurrent fetchFn() call — precisely the duplicate-work scenario the mutex was built to prevent, just delayed until the TTL boundary instead of happening immediately.',
        'The main page\'s own fixed 10-second TTL is a genuine tradeoff, not a bug: too short, and legitimately slow fetches risk this double-acquisition; too long, and a genuinely crashed holder blocks the lock for that entire duration (the exact problem the TTL exists to bound in the first place). There is no TTL value that is simultaneously "long enough for the slowest realistic fetch" and "short enough to recover quickly from a crash" — those two goals pull in opposite directions.',
      ]
    },
    {
      heading: 'The documented mitigation, and Redis\'s own honest caveat about it',
      points: [
        'Redis\'s own documentation describes the standard mitigation: extending the lock\'s TTL periodically WHILE the work is still genuinely in progress (sometimes implemented as a background "watchdog" that renews the lock every few seconds, as long as the process holding it is still alive) — rather than committing to one fixed TTL chosen up front and hoping it\'s long enough.',
        'Notably, Redis\'s own docs do NOT present this as a complete fix — they go further and recommend a genuinely different safety mechanism for critical operations: FENCING TOKENS, a monotonically increasing number issued alongside the lock that downstream systems can use to reject a stale write from a lock-holder that has actually already lost its lock (even if it doesn\'t know it yet). The docs\' own framing is blunt: "don\'t assume that a lock is retained... as long as the process that had acquired it is alive" — extension reduces the WINDOW for this race, it does not eliminate it.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own pattern: fixed TTL, no extension',
      language: 'typescript',
      code: `async function withMutexCache(key, ttl, fetchFn) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const lockKey  = \`lock:\${key}\`;
  const acquired = await redis.set(lockKey, '1', { NX: true, EX: 10 }); // fixed 10s

  if (acquired) {
    try {
      // If fetchFn() legitimately takes LONGER than 10 seconds (a
      // slow downstream API, a heavy aggregation query), the lock
      // expires mid-work — Redis has no idea this process is still
      // busy, since EX is just a timer, not tied to actual progress.
      const data = await fetchFn();
      await redis.set(key, JSON.stringify(data), { EX: ttl });
      return data;
    } finally {
      await redis.del(lockKey);
    }
  }
  // ... losers poll and wait, as in the main page's own version
}`,
    },
    {
      label: 'Mitigation: periodic lock extension while work is genuinely ongoing',
      language: 'typescript',
      code: `async function withMutexCacheExtending(key, ttl, fetchFn) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const lockKey  = \`lock:\${key}\`;
  const lockTtl  = 10; // seconds
  const acquired = await redis.set(lockKey, '1', { NX: true, EX: lockTtl });

  if (acquired) {
    // Renew the lock every few seconds WHILE fetchFn() is still
    // running — this is the "watchdog" pattern Redis's own docs
    // describe, extending the TTL only as long as work is actually
    // still in progress, instead of committing to one fixed window.
    const renewal = setInterval(() => {
      redis.expire(lockKey, lockTtl).catch(() => {});
    }, (lockTtl * 1000) / 2); // renew at the halfway point

    try {
      const data = await fetchFn(); // can now safely take longer
      await redis.set(key, JSON.stringify(data), { EX: ttl });
      return data;
    } finally {
      clearInterval(renewal);
      await redis.del(lockKey);
    }
  }
  // ... losers poll and wait

  // NOTE: per Redis's own docs, this still isn't a full guarantee —
  // for operations where a stale, "already-lost" lock-holder writing
  // anyway would cause real damage, a fencing token is the
  // recommended additional safeguard, not just a longer/renewed TTL.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s cache-aside mutex lock, using the main page\'s own fixed EX: 10 pattern, was working reliably for months. After a downstream analytics API they depend on inside fetchFn() starts occasionally taking 15+ seconds to respond (due to unrelated load on that external service), the team notices their database occasionally receives TWO near-simultaneous identical queries for the same cache key — exactly the stampede behavior the mutex was supposed to prevent. Explain why this started happening, using the documented limitation of a fixed-TTL lock.',
    hint: 'What happens to the lock key at exactly 10 seconds, regardless of whether fetchFn() has actually finished by then? If a second request checks the lock right after that 10-second mark, what does it see?',
    solution: 'This is a direct instance of the fixed-TTL-vs-work-duration mismatch — once the downstream analytics API started occasionally taking 15+ seconds, some fetchFn() calls now genuinely outlive the lock\'s fixed 10-second TTL. At exactly 10 seconds, Redis expires the lock key automatically, regardless of whether the original holder\'s fetchFn() has actually finished — Redis has no visibility into whether real work is still in progress, since EX is purely a timer. If a second concurrent request checks the lock shortly after that 10-second mark (which, under load, is a very plausible timing for a popular cache key), it finds no lock present, successfully acquires a "fresh" one via the same NX check, and starts its OWN fetchFn() call — resulting in two genuinely concurrent calls to the slow analytics API for the same logical cache-population work, exactly the duplicate-query pattern the team is observing. The fix, per Redis\'s own documented mitigation, is extending the lock\'s TTL periodically while fetchFn() is still genuinely running (a watchdog-style renewal), rather than committing to one fixed TTL chosen without accounting for the now-slower downstream dependency\'s occasional worst case.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own mutex lock pattern (redis.set(lockKey, "1", { NX: true, EX: 10 })) is a complete, permanent solution to cache stampede — once implemented correctly, duplicate concurrent fetches simply cannot happen.',
      reality: 'This subtopic\'s theory and code example both show a real, documented limitation — a fixed TTL only guarantees exclusive access "as long as the client holding the lock terminates its work within the lock validity time," per Redis\'s own docs; work that genuinely exceeds that TTL can still result in duplicate concurrent fetches.'
    },
    {
      thought: 'The fix for a lock that sometimes expires before work finishes is simply choosing a longer, more generous TTL value up front (e.g. 60 seconds instead of 10).',
      reality: 'This subtopic\'s theory clarifies this trades one problem for another — a longer fixed TTL reduces the chance of premature expiry during slow work, but also means a genuinely CRASHED lock-holder blocks the lock for that much longer, since the TTL is what recovers from a crash in the first place; the documented mitigation is periodic extension, not simply a bigger fixed number.'
    },
    {
      thought: 'Extending a lock\'s TTL periodically while work is in progress (the watchdog pattern) is presented by Redis\'s own documentation as a complete fix, fully closing the gap this subtopic describes.',
      reality: 'This subtopic\'s theory notes Redis\'s own docs are explicit that extension only reduces the risk window — they separately recommend fencing tokens as the real safeguard for operations where a lock-holder that has actually already lost its lock, without realizing it, writing anyway would cause genuine damage.'
    }
  ];
}
