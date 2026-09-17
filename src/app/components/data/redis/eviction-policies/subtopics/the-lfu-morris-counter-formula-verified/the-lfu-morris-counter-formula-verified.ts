import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-the-lfu-morris-counter-formula-verified',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-lfu-morris-counter-formula-verified.html',
  styleUrl: './the-lfu-morris-counter-formula-verified.scss',
})
export class TheLfuMorrisCounterFormulaVerifiedSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Named but never shown: the actual increment formula',
      points: [
        'The main page names the mechanism precisely ("Morris counter (8-bit logarithmic counter)... The decay rate is configurable: lfu-decay-time 1") but never shows the formula that actually decides when the counter goes up. Fetched directly from Redis\'s own <code>evict.c</code> source: <code>p = 1.0 / (baseval * lfu_log_factor + 1)</code>, where <code>baseval = counter - LFU_INIT_VAL</code> (floored at 0) — the counter increments only if a random draw falls below <code>p</code>.',
        'A new key does not start its counter at 0 — Redis\'s own source hardcodes <code>LFU_INIT_VAL = 5</code>. A brand-new key already looks like it has had a handful of accesses, specifically so it is not the very first thing evicted the instant memory pressure hits, before it has had any chance to prove itself popular.',
        'The formula makes each successive increment LESS likely as the counter grows — at <code>lfu-log-factor 10</code>, the FIRST few increments happen almost every hit, but by the time the counter nears 255 (the 8-bit maximum) an increment becomes vanishingly rare. This is precisely why it can approximate millions of real hits using only 8 bits per key.',
      ],
    },
    {
      heading: '`lfu-log-factor` is a dial, not a fixed constant',
      points: [
        'Redis\'s own documentation table shows the counter reached after a given number of hits varies sharply with <code>lfu-log-factor</code>: at factor 10, 100 hits produces a counter around 10; at factor 100, the SAME 100 hits produces a counter around 8 — a higher factor makes the counter LESS sensitive to a small number of hits, requiring proportionally more real access volume to reach the same reading.',
        'The main page\'s default codeTab never sets <code>lfu-log-factor</code> explicitly, so a real deployment runs on Redis\'s own documented default of 10 — a value the docs describe as tested experimentally to be "reasonable" across typical workloads, not a value most deployments need to tune.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The real LFULogIncr formula, verified',
      language: 'typescript',
      code: `// Mirrors Redis's own evict.c LFULogIncr() exactly, including the LFU_INIT_VAL
// starting point -- fetched directly from redis/redis's unstable branch source.
const LFU_INIT_VAL = 5;

function lfuLogIncr(counter: number, lfuLogFactor: number): number {
  if (counter === 255) return 255; // 8-bit ceiling
  const r = Math.random();
  let baseval = counter - LFU_INIT_VAL;
  if (baseval < 0) baseval = 0;
  const p = 1.0 / (baseval * lfuLogFactor + 1);
  if (r < p) counter++;
  return counter;
}

function simulateHits(hits: number, lfuLogFactor: number): number {
  let counter = LFU_INIT_VAL; // every real key starts here, not at 0
  for (let i = 0; i < hits; i++) counter = lfuLogIncr(counter, lfuLogFactor);
  return counter;
}

// Compare against Redis's OWN documented table for lfu-log-factor 10:
// 100 hits -> ~10, 1000 hits -> ~18, 100K hits -> ~142, 1M hits -> 255 (saturated)
for (const hits of [100, 1000, 100_000, 1_000_000]) {
  console.log(\`factor=10, \${hits.toLocaleString()} hits -> counter \${simulateHits(hits, 10)}\`);
}
// factor=10, 100 hits -> counter ~10
// factor=10, 1,000 hits -> counter ~18
// factor=10, 100,000 hits -> counter ~142
// factor=10, 1,000,000 hits -> counter 255 (saturated)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two keys both get exactly 100 real hits after being created. Key A runs under the default <code>lfu-log-factor 10</code>. Key B runs on a Redis instance configured with <code>lfu-log-factor 0</code>. Which key\'s counter ends up higher, and roughly how much higher?',
    hint: 'At lfu-log-factor 0, look at what the increment probability formula reduces to — specifically, what baseval * 0 equals for any counter value.',
    solution: `Key B (lfu-log-factor 0) ends up dramatically higher. When lfuLogFactor is 0, the formula's denominator becomes baseval * 0 + 1 = 1 for every counter value, so p = 1.0 / 1 = 1 always -- every single hit increments the counter unconditionally, with no logarithmic slowdown at all. Starting from LFU_INIT_VAL (5), 100 unconditional increments land the counter around 105.

Key A, running the documented default of factor 10, ends up around 10 for the same 100 hits -- roughly a 10x difference for the identical access pattern. This is exactly why lfu-log-factor exists as a tunable: setting it to 0 effectively turns LFU into something closer to a raw (but still 8-bit-capped) hit counter, saturating almost immediately for any moderately-accessed key and losing the ability to distinguish "somewhat popular" from "extremely popular" once hits climb into the thousands.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"The LFU counter starts at 0 for a brand new key, the same way a plain hit-count would."',
      reality: 'Verified directly against Redis\'s own source: it starts at LFU_INIT_VAL, which is 5, not 0. This is a deliberate choice — a genuinely brand-new key with zero real accesses still looks mildly "warm" to the eviction algorithm, protecting it from being the very first thing evicted before it has had any chance to accumulate real access history.',
    },
    {
      thought: '"A higher lfu-log-factor makes the counter MORE sensitive, tracking popularity more precisely."',
      reality: 'The opposite — verified above via direct simulation: a HIGHER factor makes each increment LESS likely, so the counter grows more slowly and needs MORE real hits to reach the same reading. A lower factor (down to 0, unconditional increment) is what makes the counter maximally sensitive to a small number of early hits, at the cost of saturating (hitting 255) much sooner for genuinely popular keys.',
    },
  ];

  topicLabel = 'Eviction Policies';
  topicRoute = '/redis/eviction-policies';
  prev: SubtopicLink | null = {
    label: 'LRM Evicts by Write, Not by Read',
    route: '/redis/eviction-policies/lrm-evicts-by-write-not-by-read',
  };
  next: SubtopicLink | null = {
    label: 'current_eviction_exceeded_time and Other INFO Fields',
    route: '/redis/eviction-policies/current-eviction-exceeded-time-and-other-info-fields',
  };
}
