import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-getorcreateasync-concurrent-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-getorcreateasync-concurrent-misses-factory-runs-twice.html',
  styleUrl: './testing-getorcreateasync-concurrent-misses-factory-runs-twice.scss',
})
export class TestingGetorcreateasyncConcurrentMissesFactoryRunsTwiceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s quiz claims GetOrCreateAsync "serializes the factory for the same key — only one call populates the entry, others wait for the result" — a concurrency test reveals this is more optimistic than what the API actually guarantees',
      points: [
        'The main Caching page repeatedly credits <code>GetOrCreateAsync()</code> with preventing cache stampede — its quiz explanation says concurrent callers "wait for the result" while only one invokes the factory. But the actual implementation of the <code>GetOrCreateAsync</code> EXTENSION METHOD in <code>Microsoft.Extensions.Caching.Memory</code> is essentially: <code>if (!cache.TryGetValue(key, out result)) { result = await factory(entry); }</code> — with NO lock, NO semaphore, and NO single-flight coordination of any kind. Two requests that BOTH miss (both call <code>TryGetValue</code> before either has finished populating) BOTH invoke the factory, concurrently.',
      ],
    },
    {
      heading: 'A test that releases N concurrent callers against a cold cache simultaneously — using a gate so they genuinely race — and counts factory invocations directly measures the real guarantee: last-writer-wins on the ENTRY, but NO protection for the FACTORY',
      points: [
        'What <code>GetOrCreateAsync</code> DOES guarantee is narrower than stampede protection: each concurrent caller gets A valid result (its own factory\'s output), and the cache ends up holding ONE of them (whichever <code>CreateEntry</code> disposal committed last). What it does NOT guarantee is that the expensive factory — the database query the main page\'s own examples wrap in it — runs only once. Under a genuinely cold cache with N simultaneous requests, the factory can run up to N times, which for an expensive query is precisely the thundering-herd scenario the page describes. The REAL fixes are a per-key <code>SemaphoreSlim</code>, a Redis <code>SETNX</code> lock (which the page covers for <code>IDistributedCache</code>), or .NET 9\'s <code>HybridCache</code> — whose stampede protection genuinely IS built in, exactly as the page\'s own HybridCache bullet states.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The test — N concurrent cold-cache callers, counting how many times the factory actually ran',
      language: 'csharp',
      code: `public class GetOrCreateAsyncStampedeTests
{
    [Fact]
    public async Task ConcurrentColdMisses_CanInvokeTheFactoryMoreThanOnce()
    {
        var cache = new MemoryCache(new MemoryCacheOptions());
        var factoryInvocations = 0;
        var gate = new TaskCompletionSource();   // holds all callers at the
                                                   // same starting line so they
                                                   // GENUINELY race

        async Task<string> CachedLookup()
            => (await cache.GetOrCreateAsync("product:1", async entry =>
            {
                entry.SetAbsoluteExpiration(TimeSpan.FromMinutes(5));
                Interlocked.Increment(ref factoryInvocations);
                await gate.Task;              // every concurrent miss parks
                                                // HERE, inside the factory —
                                                // simulating a slow DB query
                                                // that has not completed yet
                return "expensive-result";
            }))!;

        // Fire 20 callers concurrently against the COLD cache. Each one
        // calls TryGetValue BEFORE any factory has completed — so each
        // one misses and starts its OWN factory:
        var tasks = Enumerable.Range(0, 20).Select(_ => CachedLookup()).ToArray();
        await Task.Delay(200);                 // let all 20 reach the gate
        gate.SetResult();                      // release them all at once
        var results = await Task.WhenAll(tasks);

        // Every caller got a valid result — that part of the contract holds:
        Assert.All(results, r => Assert.Equal("expensive-result", r));

        // THE KEY ASSERTION — and the surprise: the factory ran MANY
        // times, not once. This directly contradicts a "only one call
        // populates the entry, others wait" mental model:
        Assert.True(factoryInvocations > 1,
            $"Expected multiple factory invocations under concurrent cold " +
            $"misses, got {factoryInvocations} — if this is 1, either the " +
            "callers did not genuinely race, or the cache implementation " +
            "changed to provide real single-flight behavior.");
    }
}

// WHY THIS HAPPENS: the GetOrCreateAsync extension method is,
// conceptually, just:
//
//   if (!cache.TryGetValue(key, out var result))
//   {
//       using var entry = cache.CreateEntry(key);
//       result = await factory(entry);       // <-- NO lock around this
//       entry.Value = result;
//   }
//   return result;
//
// All 20 callers pass the TryGetValue check before any factory
// completes — so all 20 run the factory. The ENTRY ends up holding
// whichever caller's CreateEntry committed last; every OTHER caller's
// work was silently redundant.`,
    },
    {
      label: 'The genuine single-flight fix — a per-key SemaphoreSlim, and where HybridCache makes this unnecessary',
      language: 'csharp',
      code: `// A cache wrapper providing REAL stampede protection for IMemoryCache —
// only ONE caller per key runs the factory; the rest await and then
// re-read the freshly populated entry:
public class SingleFlightCache(IMemoryCache cache)
{
    private static readonly ConcurrentDictionary<object, SemaphoreSlim> _locks = new();

    public async Task<T?> GetOrCreateAsync<T>(
        object key, Func<ICacheEntry, Task<T>> factory)
    {
        if (cache.TryGetValue(key, out T? cached))
            return cached;                    // fast path — no locking on hits

        var keyLock = _locks.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));
        await keyLock.WaitAsync();
        try
        {
            // DOUBLE-CHECK after acquiring the lock: a caller that was
            // waiting here while ANOTHER caller populated the entry must
            // NOT run the factory again — it just reads the fresh value:
            if (cache.TryGetValue(key, out cached))
                return cached;

            using var entry = cache.CreateEntry(key);
            var value = await factory(entry);   // runs EXACTLY ONCE per
            entry.Value = value;                  // cold key, guaranteed
            return value;
        }
        finally
        {
            keyLock.Release();
        }
    }
}

// Re-running the SAME 20-concurrent-callers test from the previous tab
// against SingleFlightCache: factoryInvocations == 1, every time —
// the double-checked locking is what turns "each miss runs its own
// factory" into genuine single-flight behavior.

// THE .NET 9 ALTERNATIVE the main page already names: HybridCache's
// GetOrCreateAsync genuinely HAS this protection built in — concurrent
// callers for the same key share one factory execution. If HybridCache
// is available, prefer it over hand-rolling the semaphore wrapper:
//
//   var product = await hybridCache.GetOrCreateAsync(
//       $"product:{id}",
//       async ct => await db.Products.FindAsync([id], ct),
//       cancellationToken: ct);
//
// The main page's HybridCache bullet ("Stampede protection is built
// in") is the ACCURATE version of the claim its GetOrCreateAsync quiz
// answer overstates for plain IMemoryCache.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The SingleFlightCache wrapper in this subtopic stores its per-key SemaphoreSlim instances in a static ConcurrentDictionary that is never cleaned up. Explain what long-term problem this creates for a cache whose KEYS are unbounded (e.g. one key per product ID across a catalog of millions), and sketch a fix.',
    hint: 'Consider that cache ENTRIES expire and get evicted, but the dictionary of semaphores only ever grows — one SemaphoreSlim per distinct key ever requested, held forever by the static dictionary.',
    solution: `The problem: the ConcurrentDictionary<object, SemaphoreSlim> grows
monotonically — every DISTINCT key ever requested adds a SemaphoreSlim
that is never removed, even after the corresponding cache entry has
long since expired and been evicted. For a bounded key space (a few
hundred config keys) this is harmless. For an UNBOUNDED key space —
one key per product ID across millions of products, or worse, keys
containing user IDs or search terms — the dictionary becomes a slow,
permanent memory leak completely separate from the cache itself, which
at least enforces expiry and size limits.

A fix needs to remove the semaphore once no caller is using it. One
robust approach is reference counting:

private static readonly ConcurrentDictionary<object, (SemaphoreSlim Lock, int RefCount)> _locks = new();

Acquire: atomically increment RefCount while getting-or-adding the
entry. Release: decrement RefCount, and if it reaches zero, remove the
dictionary entry (using the TryRemove overload that only removes when
the value still matches, to avoid racing a concurrent re-acquisition)
and dispose the SemaphoreSlim.

A simpler pragmatic alternative: use a FIXED-SIZE array of N semaphores
(say 512) and pick one by key hash — 'striped locking':

private static readonly SemaphoreSlim[] _stripes =
    Enumerable.Range(0, 512).Select(_ => new SemaphoreSlim(1, 1)).ToArray();
private static SemaphoreSlim For(object key) =>
    _stripes[(key.GetHashCode() & int.MaxValue) % _stripes.Length];

Memory is now strictly bounded regardless of key cardinality. The
trade-off: two DIFFERENT keys that hash to the same stripe contend on
the same lock — harmless for correctness (worst case, one key's caller
briefly waits for an unrelated key's factory), and with enough stripes
the collision probability under realistic concurrency is low. This is
the same trade HybridCache-style libraries make internally, and it is
usually the right default: bounded memory with slightly coarser
locking beats an unbounded dictionary with perfect per-key granularity.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'IMemoryCache.GetOrCreateAsync guarantees the factory runs only once per key — concurrent callers that miss simply wait for the first caller\'s factory to finish and share its result.',
      reality: 'the GetOrCreateAsync extension method has no locking whatsoever — every caller that passes the TryGetValue check before any factory completes runs its OWN factory concurrently; the cache merely ends up holding whichever result committed last, with all other factory work silently discarded.',
    },
    {
      thought: 'since GetOrCreateAsync offers no stampede protection, it is broken or useless and should always be replaced with a locking wrapper.',
      reality: 'for cheap factories or low-concurrency keys, redundant factory runs are harmless and the lock-free fast path is a feature, not a bug — the single-flight wrapper (or HybridCache) is worth its complexity specifically when the factory is expensive AND the key is hot enough for concurrent cold misses to actually occur.',
    },
    {
      thought: 'a per-key lock dictionary is a complete, production-ready solution to the stampede problem with no costs of its own.',
      reality: 'a never-cleaned static dictionary of per-key semaphores is an unbounded memory leak for unbounded key spaces — production implementations need reference-counted cleanup or striped (hash-bucketed) locking, or should simply use HybridCache, whose built-in stampede protection already handles this correctly.',
    },
  ];
}
