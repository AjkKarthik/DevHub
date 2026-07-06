import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-write-invalidate-stale-race-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './write-invalidate-stale-repopulation-race-ttl-backstop.html',
  styleUrl: './write-invalidate-stale-repopulation-race-ttl-backstop.scss',
})
export class WriteInvalidateStaleRepopulationRaceTtlBackstopSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s write-invalidate section names ONE risk — the "mini-stampede" after the delete — but there is a second, quieter race in its own CatalogService example: a concurrent reader can repopulate the cache with the OLD value AFTER the invalidation ran',
      points: [
        'The main Caching page\'s "Cache-Aside Pattern" tab shows the canonical write path: <code>await repo.UpdateAsync(product, ct); cache.Remove(key);</code> — and its invalidation-strategies section warns only about the miss window causing extra DB load. The subtler problem: <code>Remove()</code> only helps readers who arrive AFTER it. A reader that was ALREADY mid-flight — one that read the OLD value from the database moments before the writer\'s update committed — can finish its cache-aside sequence by WRITING that old value into the cache AFTER the writer\'s <code>Remove()</code> has already executed. The invalidation is then silently undone: the cache holds stale data, and nothing will correct it until the TTL expires.',
      ],
    },
    {
      heading: 'The interleaving needs no exotic timing — just a slow read overlapping a fast write — and once it lands, every subsequent reader is served the stale value for the full TTL, which is why the TTL is not an optimization but the correctness backstop',
      points: [
        'The sequence: (1) Reader R misses the cache and issues its DB query, receiving the OLD row. (2) Writer W updates the row in the DB. (3) W calls <code>cache.Remove(key)</code> — which is a no-op or removes nothing relevant, since R has not written yet. (4) R, finally finishing its cache-aside flow, calls <code>cache.Set(key, oldValue)</code>. The cache now confidently serves the pre-update value even though both the DB write AND the invalidation completed successfully, in the intended order, without any error. Under a load spike (many concurrent readers, slow DB), step 1-to-4 gaps of tens of milliseconds are routine, making this a real production occurrence, not a theoretical curiosity.',
        'This is why the main page\'s own pragmatic rule — "prefer short TTLs... over complex invalidation" — carries more weight than it lets on: for a write-invalidate cache, the TTL is the MAXIMUM STALENESS BOUND when this race lands. An entry cached with no expiration (the page\'s own "no expiration" mistake) combined with write-invalidate is not just a memory leak — it means a single lost race serves stale data FOREVER. Stronger fixes exist (delayed double-delete, versioned keys, single-flight population that re-checks a version after the read), but every one of them still keeps a TTL as the last line of defense.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The race, made deterministic in a test — a paused reader repopulates stale data after the invalidation',
      language: 'csharp',
      code: `[Fact]
public async Task SlowReader_CanRepopulateStaleValue_AfterWriteInvalidateCompleted()
{
    var cache = new MemoryCache(new MemoryCacheOptions());
    var db = new FakeProductStore(initialPrice: 10m);   // in-memory stand-in
    var readerHasQueriedDb = new TaskCompletionSource();
    var writerHasInvalidated = new TaskCompletionSource();

    // READER — the cache-aside read path from the main page's own
    // CatalogService, with a pause injected between "read from DB" and
    // "write to cache" so the test can interleave the writer there:
    var readerTask = Task.Run(async () =>
    {
        // (1) cold cache → miss → query the DB, seeing the OLD price:
        var fromDb = db.Get(1);                    // price = 10m
        readerHasQueriedDb.SetResult();
        await writerHasInvalidated.Task;           // writer runs fully here
        // (4) reader finishes its cache-aside flow, unaware anything
        // changed — writing the now-STALE value into the cache:
        cache.Set("product:1", fromDb,
            new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromMinutes(5)));
    });

    // WRITER — the main page's own write-invalidate sequence, executed
    // ENTIRELY inside the reader's gap:
    await readerHasQueriedDb.Task;
    db.Update(1, newPrice: 99m);                    // (2) DB now says 99m
    cache.Remove("product:1");                      // (3) invalidate — removes
                                                     //     nothing; reader has
                                                     //     not written yet
    writerHasInvalidated.SetResult();
    await readerTask;

    // THE DAMAGE: the DB says 99m; the write-invalidate ran to
    // completion without error — and the cache STILL serves 10m,
    // and will for the full 5-minute TTL:
    Assert.True(cache.TryGetValue("product:1", out Product? cached));
    Assert.Equal(10m, cached!.Price);               // stale
    Assert.Equal(99m, db.Get(1).Price);             // truth
}

// Every step here is the EXACT code the main page recommends — the bug
// is purely in the INTERLEAVING, which is why it never shows up in
// sequential tests and only bites under concurrent production load.`,
    },
    {
      label: 'Mitigations, in increasing order of effort — and why the TTL stays even after the fix',
      language: 'csharp',
      code: `// MITIGATION 1 — short TTL as the staleness bound (the baseline):
// Do nothing structural; accept that a lost race serves stale data for
// at most the TTL. For a 30-60s TTL on tolerant data, this is often
// genuinely the right call — it is the main page's own "prefer short
// TTLs over complex invalidation" rule, now with its precise
// justification: the TTL is what bounds THIS race's damage.

// MITIGATION 2 — delayed double-delete:
public async Task UpdateAsync(Product product, CancellationToken ct)
{
    await repo.UpdateAsync(product, ct);
    cache.Remove($"product:{product.Id}");          // delete #1: for readers
                                                     // arriving after now
    _ = Task.Delay(TimeSpan.FromMilliseconds(500), ct)
        .ContinueWith(_ => cache.Remove($"product:{product.Id}"), ct);
    // delete #2, after a delay chosen to exceed a slow reader's
    // DB-read-to-cache-write gap: it sweeps away any stale value a
    // mid-flight reader deposited in the window. Not airtight (a
    // reader slower than the delay still loses), but it shrinks the
    // stale window from "full TTL" to "delay duration" cheaply.
}

// MITIGATION 3 — version-checked population (airtight, more machinery):
// Keep a monotonically increasing version per key (e.g. in the DB row
// or a Redis INCR counter). The reader captures the version BEFORE its
// DB query and only writes to the cache if the version is UNCHANGED at
// write time; the writer bumps the version before invalidating.
var versionBefore = await versions.GetAsync(key);   // reader, step 0
var fromDb = await repo.GetAsync(id, ct);
if (await versions.GetAsync(key) == versionBefore)  // unchanged → safe
    cache.Set(key, fromDb, opts);
// If the writer bumped the version mid-read, the reader simply skips
// the cache write — the next reader repopulates from fresh data. This
// closes the race completely, at the cost of a version store and an
// extra check per population.

// IN EVERY CASE: keep the TTL. Even the versioned scheme has failure
// modes (a crashed writer that updated the DB but died before bumping
// the version) — the TTL converts every unforeseen consistency bug
// from "stale forever" into "stale for at most N seconds," which is
// the property that lets you sleep at night.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The delayed double-delete in this subtopic uses a fire-and-forget Task.Delay continuation to issue the second delete. Given what the sibling EF Performance subtopic established about capturing scoped/pooled objects in fire-and-forget work, evaluate whether THIS particular fire-and-forget is safe — and identify the one capture that would make it unsafe.',
    hint: 'Look at exactly what the continuation captures: the cache reference and a key string. Compare their lifetimes to a scoped DbContext\'s. Then consider what changes if a developer "improves" the continuation to also log via a scoped service or re-read the entity through the request\'s DbContext.',
    solution: `This particular fire-and-forget is safe as written — and the reason
is instructive when set against the pooled-DbContext leak from the EF
Performance subtopics.

What the continuation captures:
1. The IMemoryCache reference — registered as a SINGLETON. Its
   lifetime is the whole process, so a reference outliving the request
   scope is exactly what the DI container promises anyway. No pool, no
   reset-and-reuse, no scope to violate.
2. A string key built from product.Id — an immutable primitive value,
   copied into the closure. Nothing about it can be reused or mutated
   by a later request.

So the two dangerous ingredients from the pooled-DbContext case —
(a) a captured object whose lifetime is scoped/pooled rather than
process-long, and (b) shared mutable state that a future owner will
reuse — are both absent. The delayed Remove() call operates on a
process-lifetime singleton with an immutable argument: safe.

The one capture that would make it unsafe: reaching for anything
SCOPED inside the continuation. The most likely "improvement" that
introduces it:

_ = Task.Delay(500, ct).ContinueWith(async _ =>
{
    cache.Remove(key);
    var fresh = await db.Products.FindAsync(product.Id);   // ← 'db' is the
    cache.Set(key, fresh, opts);                            //   REQUEST's scoped
});                                                          //   (possibly pooled)
                                                             //   DbContext!

Turning the double-DELETE into a delete-and-REPOPULATE captures the
request's DbContext into work that runs after the request scope ends —
recreating the exact cross-request leak the EF Performance subtopic
demonstrated (silently operating on an instance the pool has handed to
an unrelated request). If repopulation in background work is genuinely
wanted, the fix is the same one as there: capture only the primitive
id, and create an independent context inside the continuation via
IDbContextFactory. Also worth noting: passing the request's 'ct' into
Task.Delay means a client disconnect cancels the second delete — for
an invalidation that should survive the request, use
CancellationToken.None deliberately.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if the database update and the cache Remove() both complete successfully and in the right order, the cache cannot end up holding the pre-update value.',
      reality: 'a reader already mid-flight — having read the old value from the database before the write committed — can write that old value into the cache AFTER the Remove() executed, silently undoing the invalidation; both operations succeeding in order guarantees nothing about interleaved readers.',
    },
    {
      thought: 'the TTL on a write-invalidated cache entry is just a memory-management detail, since active invalidation keeps the data fresh.',
      reality: 'the TTL is the correctness backstop: when the stale-repopulation race lands, the TTL is the ONLY mechanism that bounds how long the stale value is served — write-invalidate with no expiration converts a single lost race into permanently stale data.',
    },
    {
      thought: 'this race is a rare, theoretical interleaving that requires adversarial timing to trigger.',
      reality: 'it needs nothing more than a read that is slower than a concurrent write — routine during load spikes, slow queries, or GC pauses — and because every individual step succeeds without error, it produces no log entry or exception, only quietly wrong data until expiry.',
    },
  ];
}
