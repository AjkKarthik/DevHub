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
  templateUrl: './imemorycache-getorcreateasync-can-run-its-factory-concurrently.html',
  styleUrl: './imemorycache-getorcreateasync-can-run-its-factory-concurrently.scss'
})
export class ImemorycacheGetorcreateasyncCanRunItsFactoryConcurrentlySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s IMemoryCache example is correct for the common case, but doesn\'t mention a real risk under concurrent load: the factory delegate is not automatically serialized per key',
      points: [
        'IMemoryCache.GetOrCreateAsync checks whether a key already has a cached value and, if not, runs the supplied factory delegate to produce and store one. Under a Blazor Server app serving multiple concurrent circuits (or a Blazor Web App handling multiple simultaneous HTTP requests), if several requests for the SAME missing cache key arrive at nearly the same moment, IMemoryCache does not automatically block later callers while an earlier one\'s factory is still running — each concurrent caller can independently observe "not cached yet" and start its own copy of the (possibly expensive) factory delegate.',
        'This is the classic "cache stampede" or "dog-piling" problem: instead of one expensive database query or API call running once and every other concurrent request waiting for and reusing that single result, N concurrent requests for a newly-expired or never-populated key can each trigger their own independent, redundant execution of the expensive work — multiplying load on the backing resource exactly when it\'s least wanted (right as a popular cache entry expires under heavy traffic).',
      ]
    },
    {
      heading: 'The fix: a per-key lock (typically via SemaphoreSlim) ensures only one caller\'s factory actually runs',
      points: [
        'A common, well-established pattern wraps the cache-miss path in a per-key SemaphoreSlim (or an equivalent async-safe lock), acquired before checking/populating the cache entry — the first caller to acquire the lock runs the factory and populates the cache; any other concurrent callers that arrive while the lock is held wait, then find the value already cached once they acquire it, avoiding a redundant factory execution entirely.',
        'This pattern matters most specifically for cache keys backing genuinely expensive operations (a slow database aggregate query, a rate-limited external API call) under realistic concurrent traffic — for cheap, fast factory delegates or low-concurrency scenarios, the redundant-execution risk is real but its practical cost may be negligible, so this is a targeted fix for hot, expensive cache keys rather than a blanket requirement for every GetOrCreateAsync call in an app.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s example, under concurrent load',
      language: 'csharp',
      code: `@inject IMemoryCache Cache
@inject IProductService Products

@code {
    protected override async Task OnInitializedAsync()
    {
        featured = await Cache.GetOrCreateAsync("featured-products", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
            // If this call is genuinely expensive (a heavy database
            // aggregate, a slow external API), and the 5-minute
            // cache entry just expired under real traffic, MULTIPLE
            // concurrent circuits/requests can all observe a cache
            // miss for "featured-products" at nearly the same
            // moment — each one independently runs THIS factory,
            // multiplying load on Products.GetFeaturedAsync()
            // exactly when the cache was supposed to protect it.
            return await Products.GetFeaturedAsync();
        }) ?? [];
    }
}`,
    },
    {
      label: 'The fix — a per-key SemaphoreSlim serializes the factory',
      language: 'csharp',
      code: `public class FeaturedProductsService(IMemoryCache cache, IProductService products)
{
    private static readonly SemaphoreSlim _lock = new(1, 1);

    public async Task<List<Product>> GetFeaturedAsync()
    {
        if (cache.TryGetValue("featured-products", out List<Product>? cached))
            return cached!;

        await _lock.WaitAsync();
        try
        {
            // Re-check AFTER acquiring the lock — another caller
            // may have already populated the cache while this one
            // was waiting for the semaphore.
            if (cache.TryGetValue("featured-products", out cached))
                return cached!;

            var result = await products.GetFeaturedAsync();
            cache.Set("featured-products", result, TimeSpan.FromMinutes(5));
            return result;
        }
        finally
        {
            _lock.Release();
        }
    }
}

// Now only ONE concurrent caller actually runs GetFeaturedAsync()
// on a cache miss — every other concurrent caller waits for the
// lock, then finds the value already cached.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A Blazor Server app caches the results of an expensive database aggregate query with a 5-minute IMemoryCache.GetOrCreateAsync call, exactly matching the main page\'s own example. Under normal light traffic it works well. During a traffic spike, the team notices the database briefly gets hit with a burst of near-identical, redundant queries every time the cache entry expires, even though the cache is configured correctly. Explain why the cache configuration alone doesn\'t prevent this, and what\'s needed to fix it.',
    hint: 'When multiple requests arrive at nearly the same moment and ALL find the cache key missing, does IMemoryCache automatically make later requests wait for an earlier one\'s factory delegate to finish — or does each one independently proceed to run its own copy of the factory?',
    solution: 'IMemoryCache.GetOrCreateAsync does not automatically serialize concurrent callers for the same key — when the cache entry expires under real traffic, multiple near-simultaneous requests can each independently observe a cache miss and each start their own execution of the factory delegate, since there\'s no built-in per-key locking. This is the classic cache-stampede problem: instead of one expensive query running once while other requests wait for and reuse that result, N concurrent requests each redundantly run the same expensive query at the worst possible moment (right as a popular entry expires under load). The cache\'s expiration configuration is working exactly as intended — the problem isn\'t misconfiguration, it\'s a genuine gap in what IMemoryCache guarantees on its own. The fix is adding an explicit per-key lock (typically a SemaphoreSlim) around the cache-miss path: acquire the lock, re-check the cache (since another caller may have just populated it while waiting), and only run the factory if it\'s still genuinely missing — ensuring only one caller\'s factory actually executes per stampede, with every other concurrent caller waiting and then reusing that single result.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'IMemoryCache.GetOrCreateAsync automatically ensures only one caller\'s factory delegate runs per key, with other concurrent callers waiting for that result rather than redundantly re-running the factory themselves.',
      reality: 'This subtopic\'s theory clarifies IMemoryCache has no built-in per-key locking — multiple concurrent callers observing a cache miss for the same key can each independently run their own copy of the factory delegate, a real and well-known gap known as a cache stampede.'
    },
    {
      thought: 'If a cache-related performance problem occurs under load despite a correctly-configured expiration time, the cache configuration itself must be wrong (too short an expiry, wrong key).',
      reality: 'This subtopic\'s exercise shows this exact symptom can occur with a perfectly correct cache configuration — the actual gap is the absence of a per-key lock around the cache-miss path, not anything about the expiration settings themselves.'
    },
    {
      thought: 'A per-key SemaphoreSlim lock should be added around every single IMemoryCache.GetOrCreateAsync call in an app as a general best practice, regardless of how expensive the factory delegate is.',
      reality: 'This subtopic\'s theory shows this fix specifically targets hot, EXPENSIVE cache keys under realistic concurrent load — for cheap, fast factory delegates or low-traffic scenarios, the redundant-execution risk is real but often not worth the added locking complexity, making this a targeted fix rather than a blanket requirement.'
    }
  ];
}
