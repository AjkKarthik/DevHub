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
  templateUrl: './redis-zset-memory-estimate-ignored-skiplist-overhead.html',
  styleUrl: './redis-zset-memory-estimate-ignored-skiplist-overhead.scss'
})
export class RedisZsetMemoryEstimateIgnoredSkiplistOverheadSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A memory estimate that only counted the payload, not the data structure',
      points: [
        'The main page\'s "Scale & Storage" section originally estimated: "Feed Redis memory: 500M users × 1000 posts × 8 bytes = 4 TB" — treating each feed entry as costing only the 8 bytes needed to store a post ID. Checking this against how Redis sorted sets actually store data reveals the real cost is roughly 15-20x higher. The page has been corrected.',
        'The "8 bytes" is a real number — it is the size of the post_id VALUE being stored. What the estimate omitted entirely is the STRUCTURAL overhead Redis pays to make that value queryable by both member and score, which dwarfs the payload size at this list length.',
      ]
    },
    {
      heading: 'Why a Redis ZSET member costs far more than its own byte count',
      points: [
        'A Redis sorted set is internally TWO data structures working together: a hash table (for O(1) lookup of a member\'s score) and a skip list (for O(log N) ordered range queries like the page\'s own ZREVRANGEBYSCORE reads). Every member is stored in BOTH structures simultaneously.',
        'For small sorted sets, Redis uses a compact "listpack" encoding with modest overhead (roughly 28-36 bytes per entry). But Redis switches to the full hash-table-plus-skiplist representation once a sorted set exceeds a configurable threshold — 128 entries by default. The page\'s own feed lists are explicitly trimmed to 1,000 entries per user, nearly 8x past that threshold, so every feed list in this system uses the expensive, full-overhead encoding, not the compact one.',
        'At that size, the real per-entry cost is commonly estimated around 100-136+ bytes (skip list node + hash table entry + object overhead), before even adding the member\'s own byte count. Using a conservative ~130 bytes/entry instead of the original 8, the real total becomes roughly 500M × 1,000 × 130 bytes ≈ 65 TB — not 4 TB.',
      ]
    },
    {
      heading: 'Why this matters for the capacity plan the page is actually making',
      points: [
        'The main page\'s own conclusion from its storage estimate is "Use Redis Cluster + evict feeds of inactive users (TTL 30 days)" — a real architectural decision (how many Redis Cluster nodes, what hardware) that depends directly on the storage figure feeding it. Under-provisioning by roughly 16x based on the original 4 TB estimate would produce a cluster that runs out of memory long before reaching the system\'s actual designed scale.',
        'This is a good general habit for any capacity estimate involving a specific data structure: check whether the chosen structure has PER-ENTRY overhead beyond the raw payload size, not just multiply "count × payload bytes" — the gap can be an order of magnitude or more for structures like Redis ZSETs, hash tables, or B-tree indexes.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Naive estimate vs. real ZSET overhead',
      language: 'typescript',
      code: `interface MemoryEstimate {
  approach: string;
  bytesPerEntry: number;
  totalUsers: number;
  entriesPerUser: number;
  totalBytes: number;
}

function estimate(bytesPerEntry: number): MemoryEstimate {
  const totalUsers = 500_000_000;
  const entriesPerUser = 1000;
  return {
    approach: bytesPerEntry === 8 ? 'Naive (payload only)' : 'Realistic (skiplist + hashtable overhead)',
    bytesPerEntry,
    totalUsers,
    entriesPerUser,
    totalBytes: totalUsers * entriesPerUser * bytesPerEntry,
  };
}

const naive = estimate(8);      // payload-only: post_id byte count
const realistic = estimate(130); // + skiplist node + hashtable entry overhead

console.log(naive.totalBytes / 1e12, 'TB');       // ~4 TB
console.log(realistic.totalBytes / 1e12, 'TB');   // ~65 TB

// Why the full overhead applies here: Redis ZSETs use compact
// "listpack" encoding only below ~128 entries by default. This
// system trims feeds to 1,000 entries per user -- 8x past that
// threshold -- so every feed list uses the expensive full
// skiplist + hashtable representation, not the compact one.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team provisions a Redis Cluster sized for "4 TB of feed data" based on a "500M users × 1000 posts × 8 bytes" calculation, and later observes the cluster running out of memory at roughly 1/16th of the expected user base onboarded. What did the original estimate miss?',
    hint: 'Does a Redis sorted set store each member using only the bytes of the value itself, or does it maintain additional structures to support both O(1) lookup-by-member and O(log N) range queries?',
    solution: 'The original estimate counted only the payload (the 8-byte post_id), ignoring the structural overhead Redis pays to make a sorted set queryable both by member and by score-ordered range. Because each user\'s feed list is trimmed to 1,000 entries — well past the ~128-entry threshold where Redis switches from compact "listpack" encoding to the full hash-table-plus-skiplist representation — every entry actually costs roughly 100-136+ bytes of structural overhead, not 8. Using a more realistic ~130 bytes/entry, the true memory requirement is closer to 65 TB, not 4 TB — a ~16x difference, which lines up closely with the team observing the cluster exhausting memory at roughly 1/16th of the intended scale.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The memory cost of storing a value in a Redis sorted set is just the byte size of that value (e.g. an 8-byte post ID costs 8 bytes of Redis memory).',
      reality: 'Per this subtopic\'s theory, a Redis ZSET stores each member in BOTH a hash table and a skip list simultaneously — the structural overhead of these dual structures, roughly 100-136+ bytes per entry at this list size, dwarfs the payload byte count.'
    },
    {
      thought: 'Redis\'s compact "listpack" encoding applies to sorted sets of any size, so per-entry overhead stays low regardless of how many members a set holds.',
      reality: 'Per this subtopic\'s theory, listpack encoding only applies below a configurable threshold (128 entries by default) — a feed list trimmed to 1,000 entries, as this system\'s own design specifies, is well past that threshold and uses the far more expensive full skiplist+hashtable representation.'
    },
    {
      thought: 'A 16x gap between an estimated and actual memory requirement is an unusually large error that would only occur from a major methodology mistake.',
      reality: 'Per this subtopic\'s theory, this specific gap has a precise, identifiable cause (omitting Redis\'s own documented per-entry structural overhead for large sorted sets) — it is not an arbitrary or unusual size of error once the underlying data-structure cost model is understood correctly.'
    }
  ];
}
