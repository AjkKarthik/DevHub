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
  templateUrl: './default-eviction-policy-is-volatile-lru-not-noeviction.html',
  styleUrl: './default-eviction-policy-is-volatile-lru-not-noeviction.scss'
})
export class DefaultEvictionPolicyIsVolatileLruNotNoevictionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page never states what the actual default eviction policy is',
      points: [
        'The main page\'s own QnA lists all the maxmemory-policy options — noeviction, allkeys-lru, volatile-lru, allkeys-lfu — and explains what each one does, but never says which one a brand-new Azure Cache for Redis instance actually starts with. A reader could reasonably assume it defaults to noeviction (described first, and described as the choice "for session workloads") or simply not know at all.',
        'This matters because the main page\'s very first Common Mistake — "Not setting TTL on cache entries (cache grows indefinitely)" — makes a claim ("Azure Redis has a maxmemory-policy that evicts keys when memory is full — without TTLs, eviction is random and unpredictable") whose accuracy depends entirely on which policy is actually active, and the main page never confirms that policy for the reader.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own configuration documentation: the default is volatile-lru',
      points: [
        'Per Microsoft\'s own "Default Redis server configuration" reference table: "maxmemory-policy | volatile-lru | ... With Azure Cache for Redis, the default setting is volatile-lru. This setting removes the keys with an expiration set using an LRU algorithm." This is a platform-wide default applied to every new cache, not something that varies by tier or workload type.',
        'The critical word is "with an expiration set" — volatile-lru only ever considers keys that HAVE a TTL as eviction candidates. A key stored with no TTL at all is completely exempt from the default eviction algorithm, full stop, regardless of how old or unused it is.',
      ]
    },
    {
      heading: 'Why this makes the main page\'s own #1 mistake worse than "random and unpredictable" eviction',
      points: [
        'Under the ACTUAL default (volatile-lru), a key with no TTL isn\'t evicted "randomly and unpredictably" as the main page\'s mistake explanation states — it is deterministically NEVER a candidate for eviction under this policy. Eviction under volatile-lru only ever touches the pool of keys that DO have an expiration set.',
        'The real consequence: an application that forgets TTL on some entries doesn\'t get random churn — it gets a slowly, silently growing pool of permanently protected keys, while all the eviction pressure from maxmemory falls entirely on the (correctly TTL\'d) keys from OTHER parts of the app. Once every volatile (TTL-bearing) key has been evicted and the no-TTL keys alone exceed maxmemory, Redis has nothing left it\'s willing to evict under volatile-lru and write commands start failing outright — functionally the same failure mode as noeviction, reached by accident rather than by choice.',
        'This is also why allkeys-lru (evict ANY least-recently-used key, TTL or not) is the safer choice for a pure caching workload with no persistent keys mixed in — it removes the "protected forever" trap entirely, at the cost of being willing to evict something an operator might have assumed was permanent. Microsoft\'s own docs list this as a distinct, explicitly available policy precisely for this kind of workload.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The default no one on the main page ever names',
      language: 'bash',
      code: `# A brand-new cache, no configuration changed after creation:
az redis create --name my-redis --resource-group my-rg --sku Standard --vm-size c1

# Per Microsoft's own "Default Redis server configuration" table:
#   maxmemory-policy: volatile-lru   <-- the actual default, every tier
#
# NOT noeviction. NOT allkeys-lru. NOT something workload-dependent.
# Every new cache -- Basic, Standard, or Premium -- starts here.

# Confirm it directly:
az redis show \\
  --name my-redis --resource-group my-rg \\
  --query "redisConfiguration.\\"maxmemory-policy\\""
# => "volatile-lru"`,
    },
    {
      label: 'Why "no TTL" is worse than random under the REAL default',
      language: 'typescript',
      code: `// Two entries stored side by side under the ACTUAL default policy
// (volatile-lru), not an assumed one:

await redis.setEx('session:abc123', 3600, sessionData);
//                          ^^^^ has a TTL -- eligible for eviction
//                               under volatile-lru if memory fills up

await redis.set('config:featureFlags', JSON.stringify(flags));
//     ^^^^ NO TTL -- per volatile-lru's own definition ("removes
//          keys WITH an expiration set"), this key can NEVER be
//          chosen for eviction by the default policy, no matter how
//          stale or unused it becomes.

// The main page's own mistake explanation says missing TTL causes
// "random and unpredictable" eviction. Under the REAL default, it's
// the opposite of random -- it's a guarantee of protection. If
// enough no-TTL keys like this accumulate across a codebase, they
// silently consume more and more of maxmemory while every TTL'd
// session/cache key around them gets evicted first to make room --
// until there's nothing volatile left to evict, and writes start
// failing exactly as if the policy had been noeviction all along.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team enables Redis metrics alerting at 80% memory usage, expecting the default eviction policy to keep things under control automatically. Months later, used_memory alerts fire repeatedly and write commands start returning OOM errors — even though the vast majority of keys in the cache DO have TTLs set and are being evicted as expected. A smaller set of keys, all written by one legacy module that never set an expiration, keeps growing untouched. Why does volatile-lru let this happen?',
    hint: 'Check exactly which keys volatile-lru is willing to consider for eviction, based on the property Microsoft\'s own docs highlight in its name and definition.',
    solution: 'This is volatile-lru working exactly as documented, not malfunctioning. Per Microsoft\'s own configuration reference, the platform\'s actual default policy, volatile-lru, "removes the keys with an expiration set using an LRU algorithm" — it only ever evicts keys that already have a TTL. The legacy module\'s keys, having no TTL at all, are structurally excluded from consideration no matter how old or unused they are; they simply keep growing while every properly-TTL\'d key around them absorbs all the eviction pressure instead. Once the properly-behaved (TTL\'d) portion of the keyspace has been evicted down as far as it can go and the ever-growing no-TTL portion alone exceeds maxmemory, there is nothing left that volatile-lru is willing to touch, and further writes fail with an OOM error — the same end state as noeviction, arrived at by accident. The fix is either adding a TTL to the legacy module\'s keys, or switching the cache\'s maxmemory-policy to allkeys-lru if the workload is meant to be a pure cache with no permanently-protected keys at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A new Azure Cache for Redis instance defaults to noeviction, so writes fail with an error as soon as memory fills up unless you explicitly pick a different policy.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own configuration reference confirms the actual platform-wide default is volatile-lru, not noeviction — every new cache starts by evicting least-recently-used keys that have a TTL set, not by rejecting writes outright.'
    },
    {
      thought: 'Forgetting to set a TTL on a cache entry just means that entry might get evicted "randomly" along with everything else once memory fills up.',
      reality: 'Per this subtopic\'s theory, under the real default policy (volatile-lru), a key with no TTL is never a candidate for eviction at all — it is deterministically protected, which is a materially worse failure mode than "random," since it lets no-TTL keys silently accumulate while shifting all real eviction pressure onto the TTL\'d keys around them.'
    },
    {
      thought: 'Any maxmemory-policy will eventually evict old, unused keys once the cache fills up, regardless of whether those keys have a TTL.',
      reality: 'Per this subtopic\'s theory, this is only true for the allkeys-* family of policies (allkeys-lru, allkeys-lfu, allkeys-random) — the volatile-* family, including the platform default volatile-lru, only ever considers keys that already have an expiration set, no matter how stale a no-TTL key becomes.'
    }
  ];
}
