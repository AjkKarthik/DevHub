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
  templateUrl: './scan-does-not-guarantee-a-consistent-snapshot.html',
  styleUrl: './scan-does-not-guarantee-a-consistent-snapshot.scss'
})
export class ScanDoesNotGuaranteeAConsistentSnapshotSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake entry frames SCAN as the safe fix for KEYS\'s blocking behavior — accurate, but "safe" there means "non-blocking," not "returns a consistent point-in-time snapshot," which SCAN was never designed to guarantee',
      points: [
        'Redis\'s own SCAN documentation defines exactly one strong guarantee: "A full iteration always retrieves all the elements that were present in the collection from the start to the end of a full iteration." In other words, a key that exists continuously for the ENTIRE duration of your scan loop is guaranteed to be returned at least once by the time the cursor returns to 0.',
        'For anything that changes DURING the scan, Redis\'s documentation is explicit that there is simply no guarantee either way: "Elements that were not constantly present in the collection during a full iteration, may be returned or not: it is undefined." A key added mid-scan might show up in your results, or might not — both are correct, spec-compliant behavior.',
        'A third documented behavior, easy to miss: "A given element may be returned multiple times. It is up to the application to handle the case of duplicated elements." SCAN can hand back the SAME key more than once across the batches of one full iteration — this is not a bug in your code or in Redis, it is documented, expected behavior that calling code is responsible for tolerating.',
      ]
    },
    {
      heading: 'Why this matters for the main page\'s own SCAN + del batch-invalidation pattern',
      points: [
        'The main page\'s own invalidateProductLists() function scans for products:list:* keys and deletes each batch as it goes. If a NEW matching key is written to Redis by a concurrent request WHILE this invalidation scan is still in progress, that new key has no guarantee of being included — it might get deleted as part of this pass, or it might survive it entirely, continuing to serve stale data until the next invalidation run.',
        'For most cache-invalidation use cases this is an acceptable, low-stakes gap — a narrow race window around ongoing writes during a bulk invalidation pass, bounded by TTL as a backstop either way. But it is worth being precise that SCAN is not a substitute for a true atomic snapshot when correctness genuinely depends on seeing an exact, consistent view of the keyspace at one instant — for that, Redis provides no built-in primitive at all, and the application needs a different strategy (e.g., a version-tagged key scheme where "current" keys are unambiguous regardless of scan timing).',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The documented guarantee gap, made concrete',
      language: 'typescript',
      code: `// Extends the main page's own invalidateProductLists() pattern.
async function invalidateProductLists() {
  let cursor = 0;
  const seen = new Set(); // needed because SCAN can return duplicates

  do {
    const { cursor: next, keys } = await redis.scan(cursor, {
      MATCH: 'products:list:*',
      COUNT: 100,
    });

    // Per Redis's own docs: "A given element may be returned
    // multiple times" — deleting the same key twice is harmless
    // here, but code that COUNTS or PROCESSES each key (not just
    // deletes it) needs explicit dedup, or it will double-count.
    const newKeys = keys.filter(k => !seen.has(k));
    newKeys.forEach(k => seen.add(k));

    if (newKeys.length) await redis.del(newKeys);
    cursor = next;
  } while (cursor !== 0);

  // A products:list:* key WRITTEN by a concurrent request while
  // this scan is still in progress has NO guarantee of being seen
  // — per Redis's own docs, that key's presence during the scan is
  // "undefined": it may or may not be included in this invalidation
  // pass. It could survive, still serving stale data, until the
  // next time this function runs.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s bulk cache-invalidation job, using the main page\'s own SCAN-based pattern, occasionally seems to "miss" invalidating a products:list:* key that was created by a product-catalog update happening at roughly the same time the invalidation job was running. The team assumes this must be a bug in their SCAN loop\'s cursor handling. Using Redis\'s documented SCAN guarantees, is that the right diagnosis?',
    hint: 'Does Redis\'s SCAN documentation guarantee that a key written DURING an in-progress scan will definitely be included in that scan\'s results, or does it explicitly leave that case undefined?',
    solution: 'This is very likely NOT a bug in the team\'s cursor-handling logic — it is entirely consistent with Redis\'s own documented SCAN guarantees. Redis\'s SCAN documentation only guarantees that a key present for the ENTIRE duration of a full scan will be returned at least once; for a key that is newly written DURING an in-progress scan (exactly the timing described — a product-catalog update happening around the same time as the invalidation job), the documentation states plainly that its inclusion "may be returned or not: it is undefined." Rather than a cursor-handling defect, this is the expected, spec-compliant behavior of SCAN under concurrent writes — SCAN was never designed to provide a consistent point-in-time snapshot. If this occasional gap is causing real staleness problems, the fix isn\'t debugging the SCAN loop itself, but addressing the underlying assumption — either accepting the gap as bounded by the cache\'s existing TTL (a low-cost backstop), or moving to a different invalidation strategy (like a version-tagged key scheme) that doesn\'t depend on a scan seeing every concurrently-written key.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page\'s own mistake entry recommends SCAN specifically as the "safe" alternative to KEYS, SCAN provides a fully consistent, point-in-time view of the keyspace, just delivered in a non-blocking way.',
      reality: 'This subtopic\'s theory shows "safe" specifically refers to SCAN being non-blocking, not to any snapshot consistency guarantee — Redis\'s own docs explicitly leave undefined whether a key added or removed during an in-progress scan will be included in the results.'
    },
    {
      thought: 'A SCAN loop that correctly follows the cursor until it returns to 0 is guaranteed to return each matching key exactly once, with no duplicates.',
      reality: 'This subtopic\'s theory and code example both show the opposite — Redis\'s own docs state a given element "may be returned multiple times," and application code (especially anything counting or processing each key, not just deleting it) is responsible for handling potential duplicates itself.'
    },
    {
      thought: 'A key that exists in Redis before a SCAN loop begins and is never modified during the scan might still be skipped, since SCAN\'s guarantees are generally weak.',
      reality: 'This subtopic\'s theory clarifies SCAN\'s one STRONG guarantee is exactly this case — a key present continuously for the entire duration of a full iteration is guaranteed to be returned at least once; the lack of guarantee specifically applies to keys added or removed DURING the scan, not to stable, unchanging keys.'
    }
  ];
}
