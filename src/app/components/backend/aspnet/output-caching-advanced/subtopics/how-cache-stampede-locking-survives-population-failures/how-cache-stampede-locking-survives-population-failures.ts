import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-cache-stampede-locking-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-cache-stampede-locking-survives-population-failures.html',
  styleUrl: './how-cache-stampede-locking-survives-population-failures.scss',
})
export class HowCacheStampedeLockingSurvivesPopulationFailuresSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'What "Locking" Actually Prevents (And Doesn\'t)',
      points: [
        'The main page states that on a cache miss "the first request populates the cache and the others wait for it" — but doesn\'t say what the waiters get once population finishes, or what happens if that first request fails. Behaviorally, output caching uses a per-cache-key lock: whichever request acquires it re-checks the cache first (double-checked locking) before doing real work, runs the handler only if still empty, stores the result, then releases the lock. Requests that were queued behind it then find the cache already populated and use that value directly — this is the actual mechanism that prevents a thundering herd on SUCCESS.',
        'On FAILURE the story is different: a thrown exception is never stored in the cache, so releasing the lock simply lets the NEXT queued request make its own fresh attempt at the handler — it is not served a cached failure, and it does not skip the backend call. Under a sustained outage, every currently-queued request eventually gets its own turn to retry against the still-broken backend, one at a time — never abandoned, never served a shortcut failure.',
      ],
    },
    {
      heading: 'This Is Coalescing, Not a Circuit Breaker',
      points: [
        'Because a failed attempt is never cached, this mechanism gives zero protection against a SUSTAINED backend outage — it only prevents duplicate CONCURRENT work at a single instant. A true circuit breaker (e.g. Polly\'s circuit breaker strategy) opens after N consecutive failures and fast-fails NEW requests without calling the backend at all. Output caching\'s population lock has no such memory — it will happily let every queued request take its own full-price shot at a backend that has been down for an hour. Pair output caching with a real resilience policy around the backend call itself for that protection; the two solve different problems and are not substitutes for each other.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A behaviorally-equivalent model of per-key population locking',
      language: 'csharp',
      code: `// A simplified model of what output caching does per cache key —
// NOT the framework's actual internal implementation, but behaviorally
// equivalent, and small enough to reason about and test directly.
public class KeyedPopulationLock
{
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();
    private readonly ConcurrentDictionary<string, string> _cache = new();

    public async Task<string> PopulateOnceAsync(string cacheKey, Func<Task<string>> populate)
    {
        // Fast path: already cached, no lock needed at all.
        if (_cache.TryGetValue(cacheKey, out var cached)) return cached;

        var gate = _locks.GetOrAdd(cacheKey, _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync();
        try
        {
            // Re-check AFTER acquiring the lock — another request may have
            // populated it while this one was queued (double-checked locking).
            if (_cache.TryGetValue(cacheKey, out cached)) return cached;

            var result = await populate();
            _cache[cacheKey] = result;   // only a SUCCESSFUL result gets stored
            return result;
        }
        finally
        {
            gate.Release();   // released whether populate() succeeded OR threw
        }
    }
}`,
    },
    {
      label: 'Success path — one real backend call serves every waiter',
      language: 'csharp',
      code: `[Fact]
public async Task Successful_Population_Is_Reused_By_Waiters_Without_Re_Invoking_Handler()
{
    var attempts = 0;
    var populationLock = new KeyedPopulationLock();

    async Task<string> SlowBackendCall()
    {
        Interlocked.Increment(ref attempts);
        await Task.Delay(50);   // simulate real work — gives waiters time to queue up
        return "real-data";
    }

    var first  = populationLock.PopulateOnceAsync("products", SlowBackendCall);
    var second = populationLock.PopulateOnceAsync("products", SlowBackendCall);
    var third  = populationLock.PopulateOnceAsync("products", SlowBackendCall);

    var results = await Task.WhenAll(first, second, third);

    Assert.All(results, r => Assert.Equal("real-data", r));
    Assert.Equal(1, attempts);   // only ONE real backend call — the other two reused it
}`,
    },
    {
      label: 'Failure path — each waiter gets its own retry, nothing is cached',
      language: 'csharp',
      code: `[Fact]
public async Task Failed_Population_Releases_Lock_For_Next_Waiter_To_Retry()
{
    var attempts = 0;
    var populationLock = new KeyedPopulationLock();

    async Task<string> FlakyBackendCall()
    {
        var attempt = Interlocked.Increment(ref attempts);
        if (attempt <= 2) throw new HttpRequestException("backend unavailable");
        return "real-data";
    }

    // Three "requests" arrive back-to-back for the same cold key —
    // this models the exact stampede scenario the main page describes.
    var first  = populationLock.PopulateOnceAsync("products", FlakyBackendCall);
    var second = populationLock.PopulateOnceAsync("products", FlakyBackendCall);
    var third  = populationLock.PopulateOnceAsync("products", FlakyBackendCall);

    await Assert.ThrowsAsync<HttpRequestException>(() => first);
    await Assert.ThrowsAsync<HttpRequestException>(() => second);
    Assert.Equal("real-data", await third);

    Assert.Equal(3, attempts);   // NOT cached-and-replayed — genuinely retried 3 times
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given the <code>KeyedPopulationLock</code> model above, what happens if FOUR requests arrive for the same expired key while the backend is completely down (every attempt throws, forever)? Does the fourth request ever get a fast-fail response, or does it wait through three sequential real backend calls first?',
    hint: 'Trace through: each waiter only starts its OWN backend call once it acquires the semaphore — there is no "someone already tried and failed, skip retrying" shortcut anywhere in this model.',
    solution: `It waits through all three prior (failing) attempts before it gets its
own turn. Request 4 only acquires the semaphore after request 3 releases
it — and request 3 only got the semaphore after request 2 released it,
and so on. Once request 4 finally acquires the lock, it makes ITS OWN
attempt against the still-down backend, which also fails — no request
skips ahead based on a prior waiter's failure.

This is exactly why the mechanism is NOT a circuit breaker: a circuit
breaker would open after N consecutive failures and start fast-failing
new requests immediately, without touching the backend at all. The
output cache's population lock provides zero fast-fail protection
against a sustained outage — it only prevents CONCURRENT duplicate
attempts at any single instant. For real resilience against a sustained
outage, pair this with an actual circuit breaker (e.g. Polly) around
the backend call itself, layered underneath — not instead of — the
output cache.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'output caching\'s stampede prevention means a failing backend is "remembered" as down, so subsequent requests fail fast without hitting it again.',
      reality: 'the population lock only serializes CONCURRENT attempts at one instant — it is not a circuit breaker or a negative cache. Each new request that acquires the released lock makes its own fresh attempt against the backend, succeeding or failing entirely independently of prior attempts.',
    },
    {
      thought: 'if the request currently populating a cache entry throws an exception, that failure gets cached so all waiting requests immediately receive the same error without retrying.',
      reality: 'a thrown exception (or any non-cacheable outcome) is never stored. The lock is simply released, and the next waiting request attempts the handler again from scratch, exactly like the first request did.',
    },
    {
      thought: 'all requests that were queued while a key was being populated re-run the handler themselves once population completes, since they were all "waiting" at the same time.',
      reality: 'only one request at a time ever holds the per-key lock and calls the handler. On success, subsequent waiters re-check the now-populated cache and reuse that value directly instead of re-running the handler — that reuse is precisely what prevents the thundering herd.',
    },
  ];
}
