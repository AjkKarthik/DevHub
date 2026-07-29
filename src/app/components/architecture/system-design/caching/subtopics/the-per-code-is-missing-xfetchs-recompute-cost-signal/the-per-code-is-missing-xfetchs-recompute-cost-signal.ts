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
  templateUrl: './the-per-code-is-missing-xfetchs-recompute-cost-signal.html',
  styleUrl: './the-per-code-is-missing-xfetchs-recompute-cost-signal.scss'
})
export class ThePerCodeIsMissingXfetchsRecomputeCostSignalSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A named algorithm whose actual formula got simplified away',
      points: [
        'The main page\'s "Stampede Prevention" code sample labels one solution "Probabilistic early expiration (PER)" — this is the well-known XFetch algorithm (Vattani, Chierichetti, Lowenstein, 2015) — but the formula it implements leaves out the single input that makes XFetch actually work well: how expensive the recompute itself is.',
      ]
    },
    {
      heading: 'The real XFetch formula, and what the page\'s version is missing',
      points: [
        'XFetch\'s actual trigger condition is: recompute early if `now - (delta × beta × ln(random())) >= expiry`, where `delta` is the RECENTLY-OBSERVED TIME IT TOOK TO RECOMPUTE the value, and `beta` is a tunable factor (β > 1 favors earlier recomputation, β < 1 favors later).',
        'The main page\'s code instead uses `Math.random() > 1 - Math.exp(-timeLeft / ttl)` — a formula built only from `timeLeft` and `ttl`, with no `delta` (recompute cost) term anywhere in it. This isn\'t just a stylistic simplification; `delta` is the specific input that lets XFetch distinguish between a cheap 5ms lookup and an expensive 30-second aggregation query when deciding how early to start recomputing.',
        'The whole point of including recompute cost in the real algorithm: an expensive-to-recompute key needs to START its early refresh well before expiry (so the slow recomputation finishes before the OLD value actually goes stale), while a cheap key can safely wait until much closer to expiry — a distinction the page\'s simplified formula has no way to make, since it never observes how long any given key actually takes to recompute.',
      ]
    },
    {
      heading: 'Why this specific omission matters in practice',
      points: [
        'Using the page\'s simplified formula on a mix of cheap and expensive-to-compute cached values would apply the SAME early-refresh timing curve to both — meaning an expensive key could easily start its background recomputation too LATE, missing the point of stampede prevention entirely (the old value still expires and triggers a genuine miss before the slow recompute finishes).',
        'The fix is straightforward once you know what\'s missing: track how long each key\'s OWN last recompute actually took (a simple timer around the `computeFn()` call), and feed that observed `delta` into the real formula — rather than assuming a one-size-fits-all timing curve based only on the TTL.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The real XFetch formula, with the missing delta (recompute cost) term',
      language: 'typescript',
      code: `// The main page's PER code -- missing 'delta' (recompute cost):
async function getWithPER_original(key: string, computeFn: () => Promise<string>, ttl: number) {
  // ... uses only timeLeft and ttl, no signal for HOW EXPENSIVE
  // this specific key's recompute actually is.
}

// The real XFetch algorithm -- tracks recompute cost (delta)
// per key, and feeds it into the trigger formula:
async function getWithXFetch(key: string, computeFn: () => Promise<string>, ttl: number, beta = 1.0) {
  const raw = await redis.get(key + ':meta');
  if (raw) {
    const { value, expiry, delta } = JSON.parse(raw);
    const now = Date.now() / 1000;
    // Real XFetch trigger: now - (delta * beta * ln(random())) >= expiry
    if (now - (delta * beta * Math.log(Math.random())) < expiry) {
      return value; // not yet time to recompute early
    }
  }
  const start = Date.now() / 1000;
  const value = await computeFn();
  const delta = Date.now() / 1000 - start; // <-- the missing signal:
                                            //     how long THIS recompute took
  await redis.setEx(key + ':meta', ttl, JSON.stringify({
    value, expiry: Date.now() / 1000 + ttl, delta,
  }));
  return value;
}
// An expensive key (large delta) now starts its early refresh
// well before expiry; a cheap key (small delta) waits closer
// to expiry -- exactly the distinction the original code couldn't make.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Using the main page\'s original (now-corrected) PER formula — which only looks at `timeLeft` and `ttl` — would a cache key that takes 30 seconds to recompute (an expensive aggregation query) and a cache key that takes 5 milliseconds to recompute (a simple lookup) get different early-refresh timing, or the same?',
    hint: 'Does the original formula\'s inputs (`timeLeft`, `ttl`) contain any information about how long a specific key\'s recompute actually takes?',
    solution: 'They would get the EXACT SAME early-refresh timing curve, purely as a function of how much time is left before expiry relative to the TTL — the original formula has no input at all that reflects recompute cost. This is precisely the gap: the real XFetch algorithm exists specifically to let EXPENSIVE keys (large `delta`) start their background refresh earlier than CHEAP keys (small `delta`), so a slow recompute has enough of a head start to finish before the old value actually expires. Without tracking and using `delta`, an expensive 30-second aggregation gets treated identically to a 5-millisecond lookup, which can mean the expensive key\'s recompute doesn\'t finish in time and a genuine cache miss (the exact stampede-triggering event this code is supposed to prevent) happens anyway.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s "Probabilistic Early Expiration" code correctly implements the well-known XFetch algorithm.',
      reality: 'Per this subtopic\'s theory (a gap corrected during this batch), the real XFetch formula includes a `delta` (recompute cost) term the page\'s code never tracks or uses — the implementation is missing the specific input that makes the real algorithm effective.'
    },
    {
      thought: 'A probabilistic early-expiration formula only needs to know how much time is left before a key expires (timeLeft) relative to its TTL to make good early-refresh decisions.',
      reality: 'Per this subtopic\'s theory, the real XFetch algorithm ALSO needs to know how expensive that specific key\'s recompute actually is (`delta`) — without it, expensive and cheap keys get treated identically, which can cause expensive recomputes to start too late.'
    },
    {
      thought: 'Since the page\'s PER code is "probabilistic" and references the general concept correctly, the exact formula details don\'t matter much in practice.',
      reality: 'Per this subtopic\'s theory, the missing `delta` term isn\'t a minor detail — it\'s the specific mechanism that lets the real algorithm prevent stampedes on genuinely expensive-to-recompute keys, which is the exact scenario stampede prevention exists to handle.'
    }
  ];
}
