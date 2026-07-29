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
  templateUrl: './redis-defaults-to-noeviction-not-lru.html',
  styleUrl: './redis-defaults-to-noeviction-not-lru.scss'
})
export class RedisDefaultsToNoevictionNotLruSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A one-word "default" claim with a real operational consequence if wrong',
      points: [
        'The main page\'s Quick Reference originally stated LRU is "Default Redis eviction" — flatly, as a fact about Redis\'s out-of-the-box behavior. Checking this against Redis\'s own documented configuration default, this is incorrect. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: Redis\'s actual default is noeviction — it doesn\'t evict anything by default',
      points: [
        'Redis\'s `maxmemory-policy` configuration directive — the setting that controls eviction behavior — defaults to `noeviction`. Under this policy, when Redis hits its configured `maxmemory` limit, it does NOT evict any keys at all; instead, it starts returning ERRORS on commands that would add more data (writes), while reads continue to work normally.',
        'LRU (specifically `allkeys-lru` or `volatile-lru`) is a genuinely common, often-recommended CHOICE — Redis\'s own docs call `allkeys-lru` "a good default option if you have no reason to prefer any others" — but "a good option to choose" and "what Redis does automatically without any configuration" are two different claims, and the main page conflated them.',
        'This distinction only matters at all once `maxmemory` is actually configured — an unconfigured Redis instance (the default `maxmemory 0`, meaning unlimited) never triggers any eviction policy in the first place, since there\'s no limit to exceed.',
      ]
    },
    {
      heading: 'Why assuming "Redis evicts by LRU automatically" is a genuinely risky assumption',
      points: [
        'A team that sets `maxmemory` (to cap Redis\'s RAM usage) without ALSO explicitly setting `maxmemory-policy`, assuming LRU eviction "just happens" by default, will instead see their application start throwing write errors once the memory limit is hit — a much more disruptive failure mode than quietly evicting old keys.',
        'This is a real, documented production gotcha: capping `maxmemory` alone, without an explicit eviction policy, effectively turns Redis into a fixed-capacity store that REJECTS new writes at capacity, rather than a self-managing cache that ages out old data — the opposite of what most teams assume "setting a memory limit on a cache" would do.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Checking (and correctly setting) the real default',
      language: 'bash',
      code: `# Check the ACTUAL current eviction policy -- don't assume:
redis-cli CONFIG GET maxmemory-policy
# Unconfigured output: "maxmemory-policy" "noeviction"  <-- the real default

# Setting ONLY maxmemory, without an eviction policy, means
# Redis will start REJECTING WRITES at the limit, not evicting:
redis-cli CONFIG SET maxmemory 100mb
# maxmemory-policy is STILL noeviction here -- writes will
# start failing with OOM errors once 100mb is reached.

# To get the LRU-eviction behavior many people ASSUME is
# automatic, you must explicitly opt in:
redis-cli CONFIG SET maxmemory-policy allkeys-lru`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team sets `maxmemory 500mb` on their Redis cache to cap its RAM usage, assuming Redis will automatically start evicting old keys (LRU) once it hits that limit — the main page\'s original (now-corrected) claim. They never set `maxmemory-policy`. What actually happens once the cache reaches 500mb?',
    hint: 'Setting `maxmemory` alone does not change `maxmemory-policy` — what is `maxmemory-policy`\'s actual default value?',
    solution: 'Since they never explicitly set `maxmemory-policy`, it remains at Redis\'s real default, `noeviction` — NOT LRU. Once the cache reaches 500mb, Redis stops evicting nothing (there is nothing to evict automatically) and instead starts REJECTING new write commands with an out-of-memory error, while reads continue to work normally. This is likely the opposite of what the team wanted from "capping memory usage on a cache" — they would need to explicitly run `CONFIG SET maxmemory-policy allkeys-lru` (or another eviction policy) to get the self-managing, evict-old-data behavior they assumed was automatic.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Redis automatically evicts the least-recently-used keys (LRU) once it runs out of memory, without any explicit configuration.',
      reality: 'Per this subtopic\'s theory (a claim corrected on the main page during this batch), Redis\'s actual default `maxmemory-policy` is `noeviction` — it rejects new writes with an error at the memory limit rather than evicting anything, unless an eviction policy is explicitly configured.'
    },
    {
      thought: 'Since `allkeys-lru` is Redis\'s own recommended "good default option," it must also be the actual out-of-the-box configuration default.',
      reality: 'Per this subtopic\'s theory, "a good option to choose" and "what happens automatically with no configuration" are different claims — Redis\'s docs recommend `allkeys-lru` as a sensible CHOICE, but the real factory default remains `noeviction` until you explicitly set it.'
    },
    {
      thought: 'Setting `maxmemory` on a Redis cache is enough, by itself, to make it a self-managing, auto-evicting cache.',
      reality: 'Per this subtopic\'s theory, `maxmemory` alone (with the default `noeviction` policy still in effect) turns Redis into a fixed-capacity store that rejects new writes at the limit — an explicit `maxmemory-policy` setting is required to get automatic eviction behavior.'
    }
  ];
}
