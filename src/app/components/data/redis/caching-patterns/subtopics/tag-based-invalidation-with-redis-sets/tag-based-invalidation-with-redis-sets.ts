import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-tag-based-invalidation-with-redis-sets',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './tag-based-invalidation-with-redis-sets.html',
  styleUrl: './tag-based-invalidation-with-redis-sets.scss',
})
export class TagBasedInvalidationWithRedisSetsSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Named in one theory bullet, never shown as code',
      points: [
        'The main page\'s own "Cache Key Design" theory bullet names the technique precisely: "store a set of keys per tag (e.g. <code>tag:user:42 → [key1, key2, ...]</code>) and UNLINK all keys in the set on data change." No codeTab on the page ever builds this — both codeTabs only ever invalidate ONE key at a time, via <code>redis.unlink(cacheKey)</code>.',
        'The problem tag-based invalidation solves: a single entity (a user) often backs SEVERAL independent cache entries — a profile cache, an orders-list cache, a permissions cache — each with its own key. When that user\'s underlying data changes, every one of those keys needs invalidating together, but the write path may not know all of their exact key names in advance.',
      ],
    },
    {
      heading: 'The mechanism: a Redis Set as an index, not as the data itself',
      points: [
        'A tag set (<code>tag:user:42</code>) never stores cached DATA — it stores the NAMES of every cache key currently tagged with it, added via <code>SADD</code> whenever a tagged key is written. Invalidating the tag means <code>SMEMBERS</code> to read every key name, then <code>UNLINK</code> all of them in one call.',
        'The tag set itself must ALSO be deleted after invalidation — otherwise it keeps referencing key names that no longer exist, and a future <code>SMEMBERS</code> would return stale entries pointing at nothing. The main page\'s own theory calls this technique "expensive to maintain but flexible" for exactly this reason: every write that populates a tagged key also has to remember to <code>SADD</code> it, and every invalidation has to clean up both the data keys AND the tag set.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tag-based invalidation',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// Cache a value AND register it under every tag it belongs to.
async function cacheWithTags(key: string, value: unknown, ttlSec: number, tags: string[]) {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSec);
  for (const tag of tags) await redis.sadd(\`tag:\${tag}\`, key);
}

// Invalidate every key registered under one tag, then clear the tag set itself.
async function invalidateByTag(tag: string): Promise<string[]> {
  const tagKey = \`tag:\${tag}\`;
  const keys = await redis.smembers(tagKey);
  if (keys.length) await redis.unlink(...keys);
  await redis.unlink(tagKey); // remove the index too, or it accumulates stale refs
  return keys;
}

// Usage: user 42 backs TWO independent cache entries, both tagged 'user:42'.
await cacheWithTags('v1:user:42:profile', { name: 'Ada' }, 300, ['user:42']);
await cacheWithTags('v1:user:42:orders', [{ id: 1 }], 300, ['user:42']);
await cacheWithTags('v1:user:99:profile', { name: 'Bob' }, 300, ['user:99']);

// One data change to user 42 -- both of THEIR keys go, user 99's is untouched.
const invalidated = await invalidateByTag('user:42');
console.log(invalidated);
// [ 'v1:user:42:profile', 'v1:user:42:orders' ]`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A write path calls <code>cacheWithTags(key, value, ttl, tags)</code> to populate a cache entry, but the process crashes AFTER the <code>SET</code> succeeds and BEFORE the <code>SADD</code> calls run. What does <code>invalidateByTag</code> do the next time that tag is invalidated, and is the crashed entry still correctly cleaned up eventually?',
    hint: 'Ask specifically what SMEMBERS returns for that tag, and what happens to the un-registered key on its own.',
    solution: `invalidateByTag would simply never see the crashed entry -- SMEMBERS on the tag set only returns keys that made it into the SADD step, so a key that was SET but never SADDed is invisible to tag-based invalidation entirely. It is NOT actively cleaned up by this mechanism.

It is still eventually cleaned up, but by a completely different mechanism: the key's own TTL (set in the same cacheWithTags call, before the crash) still expires normally on schedule, since TTL is set on the SET call itself, independent of whether SADD ever ran. The practical consequence is a short window where that one entry can serve STALE data (invisible to explicit tag-based invalidation) until its TTL naturally expires -- exactly why the main page's own theory insists on always setting a TTL, even when a pattern also supports explicit invalidation: TTL is the fallback correctness guarantee when explicit invalidation itself has a gap.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"The tag set (tag:user:42) is itself a cached value that needs a TTL, the same as the keys it tracks."',
      reality: 'The tag set is an INDEX, not cached data — it has no natural staleness of its own the way a cached profile does. Giving it a TTL would risk the index expiring while its member keys are still alive and valid, silently breaking future tag-based invalidation for those keys with no error anywhere.',
    },
    {
      thought: '"Once you UNLINK the keys returned by SMEMBERS, the tag set is empty and can be left alone — no need to also UNLINK the tag set itself."',
      reality: 'SMEMBERS + UNLINK on the member keys does not touch the SET itself at all — the tag set (tag:user:42) still exists afterward, now referencing key names that no longer exist. The next SADD for a newly-cached key would add to an already-populated set of stale references unless the tag set is explicitly UNLINKed too, exactly as shown above.',
    },
  ];

  topicLabel = 'Caching Patterns';
  topicRoute = '/redis/caching-patterns';
  prev: SubtopicLink | null = {
    label: 'Implementing Read-Through in Application Code',
    route: '/redis/caching-patterns/implementing-read-through-in-application-code',
  };
  next: SubtopicLink | null = null;
}
