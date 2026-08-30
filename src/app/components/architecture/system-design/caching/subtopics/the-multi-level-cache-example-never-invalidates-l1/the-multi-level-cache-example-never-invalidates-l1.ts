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
  templateUrl: './the-multi-level-cache-example-never-invalidates-l1.html',
  styleUrl: './the-multi-level-cache-example-never-invalidates-l1.scss'
})
export class TheMultiLevelCacheExampleNeverInvalidatesL1Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A gap catchable purely by cross-checking the page\'s own two code samples',
      points: [
        'The main page shows two separate code examples: a "Cache-aside Pattern" sample whose `updateUser` function invalidates the cache with `redis.del(...)` (deleting the L2/Redis key), and a separate "Multi-Level Cache" sample introducing an L1 in-process `Map` cache with its own independent 30-second TTL. Neither sample, nor the surrounding text, ever addresses what happens to L1 when a write occurs. This subtopic closes that gap.',
      ]
    },
    {
      heading: 'The gap: L1 has no invalidation path at all in the page\'s own example',
      points: [
        'The `updateUser` function only calls `redis.del(cacheKey)` — this correctly clears the L2 (Redis) entry, but says nothing about the L1 in-process `Map` cache shown in the separate multi-level example. If both patterns were combined (as the page presents them, back to back, as complementary techniques), any OTHER instance holding a stale L1 entry for that same key would keep serving it for up to its full 30-second TTL, completely unaware that the underlying data changed and Redis was already correctly invalidated.',
        'This is a structural gap in the DESIGN shown, not a runtime bug in the code as written (the two examples are presented separately) — but a reader combining them, as the page\'s own "multi-level caching" framing invites, would inherit this gap without any warning.',
      ]
    },
    {
      heading: 'Why L1 (in-process) invalidation is a fundamentally harder problem than L2 invalidation',
      points: [
        'Invalidating L2 (Redis) is straightforward because it\'s a SINGLE shared store — one `DEL` command reaches every instance\'s next read. Invalidating L1 is harder specifically because it is NOT shared — each application instance has its own independent, local `Map`, so a single `DEL` call has no way to reach the in-process memory of every OTHER running instance.',
        'The standard real-world fix is a pub/sub invalidation channel: on write, publish an "invalidate key X" message (via Redis Pub/Sub, Kafka, or similar); every instance subscribes and deletes the key from its OWN local L1 cache upon receiving that message. Without this extra mechanism, L1\'s TTL is the ONLY thing bounding staleness — which is exactly why the main page\'s example, as shown, silently relies on a 30-second staleness window it never states out loud.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Adding the missing L1 invalidation path via pub/sub',
      language: 'typescript',
      code: `// The main page's updateUser() only invalidates L2 (Redis):
async function updateUser(userId: string, data: Partial<User>) {
  await db.update('users', { id: userId }, data);
  await redis.del(\`user:\${userId}\`);  // L2 cleared -- L1 NOT cleared
}

// Fix: publish an invalidation event; every instance's L1
// subscribes and clears its OWN local entry on receipt.
async function updateUserWithL1Invalidation(userId: string, data: Partial<User>) {
  await db.update('users', { id: userId }, data);
  const key = \`user:\${userId}\`;
  await redis.del(key);                    // L2: shared, one DEL suffices
  await redis.publish('cache-invalidate', key); // L1: must fan out to every instance
}

// Every instance subscribes and clears its OWN local L1 Map:
const sub = redis.duplicate();
await sub.subscribe('cache-invalidate', (key) => {
  l1Cache.delete(key); // only affects THIS instance's local cache
});

// Without this subscription, L1's 30s TTL is the ONLY thing
// bounding staleness after a write -- exactly the gap in the
// main page's own combined example.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team combines the main page\'s two examples: cache-aside for writes (calling `redis.del()` on update) plus the multi-level L1+L2 cache for reads. A user updates their profile on instance A. Two seconds later, a request for that same user\'s profile lands on instance B, which has that user cached in its local L1 with 28 seconds left on its TTL. What does instance B return?',
    hint: 'Did instance A\'s `redis.del()` call reach instance B\'s in-process L1 `Map` at all?',
    solution: 'Instance B returns the STALE, pre-update data from its own local L1 cache — `redis.del()` only clears the shared L2 (Redis) entry, and has no effect whatsoever on instance B\'s independent, in-process L1 `Map`. Instance B will keep serving the stale profile for up to its remaining L1 TTL (up to 28 more seconds in this scenario), completely unaware that instance A already invalidated L2. This is exactly the gap this subtopic identifies — fixing it requires an explicit fan-out mechanism (like Redis Pub/Sub) so every instance\'s L1 cache is told to invalidate, not just the shared L2 store.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Calling redis.del() on a cache key, as shown in the main page\'s cache-aside example, invalidates that key everywhere it might be cached, including any in-process (L1) caches.',
      reality: 'Per this subtopic\'s theory (a gap identified across the main page\'s own two code samples during this batch), `redis.del()` only clears the SHARED Redis (L2) entry — it has no reach into any OTHER instance\'s independent, in-process L1 cache.'
    },
    {
      thought: 'A multi-level (L1 + L2) cache is invalidated the same way as a single-level cache — one delete call at write time is sufficient.',
      reality: 'Per this subtopic\'s theory, L1 invalidation is a fundamentally different, harder problem, since each instance\'s L1 is NOT shared — it requires an explicit fan-out mechanism (like pub/sub) to reach every instance, not just a single delete call.'
    },
    {
      thought: 'If a multi-level cache example doesn\'t explicitly warn about a staleness window, it\'s safe to assume the design doesn\'t have one.',
      reality: 'Per this subtopic\'s theory, this is exactly the kind of gap that\'s only caught by cross-checking two separately-presented code samples against each other — the main page\'s own examples had an unstated up-to-30-second L1 staleness window when combined, discoverable purely by reading the two samples together.'
    }
  ];
}
