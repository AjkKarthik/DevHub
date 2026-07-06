import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-hybridcache-stampede-protection-per-process-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './hybridcache-stampede-protection-only-coalesces-within-one-process.html',
  styleUrl: './hybridcache-stampede-protection-only-coalesces-within-one-process.scss',
})
export class HybridcacheStampedeProtectionOnlyCoalescesWithinOneProcessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes stampede protection without specifying its SCOPE — "multiple requests... coalesce into one back-end call" leaves open the question: multiple requests WHERE?',
      points: [
        'The main .NET 9/10 &amp; C# 13/14 page states <code>HybridCache</code> "has built-in stampede protection: multiple requests for the same cold key coalesce into one back-end call." In a SINGLE-INSTANCE application, this is the whole story. But most production ASP.NET Core deployments run MULTIPLE INSTANCES of the same app simultaneously (multiple pods in Kubernetes, multiple Azure App Service instances) — and stampede protection\'s coalescing happens WITHIN one running process\'s memory, not across the entire deployment.',
      ],
    },
    {
      heading: 'Concurrent requests hitting the SAME app instance for the SAME cold key genuinely coalesce — this is what the main page correctly describes',
      points: [
        'Within a SINGLE process, when multiple concurrent <code>GetOrCreateAsync</code> calls for the SAME key all miss BOTH the L1 (in-memory) and L2 (distributed) cache simultaneously, <code>HybridCache</code> tracks an IN-PROCESS, IN-MEMORY marker that a factory call for that specific key is ALREADY in flight — every OTHER concurrent caller on that SAME instance awaits the SAME in-flight factory task instead of independently invoking their own, and all of them receive the SAME result once it completes. This genuinely prevents "10,000 concurrent requests on ONE server instance all hitting the database at once for the same cold key."',
      ],
    },
    {
      heading: 'Multiple DIFFERENT app instances, each independently missing the L2 cache at the same moment, have NO shared coordination at all — each one runs its own factory call',
      points: [
        'If the SAME key becomes cold (expires, or is evicted) at roughly the SAME moment across a scaled-out deployment (e.g., a fixed TTL causing synchronized expiration across all instances, or a cold start after a deployment), EACH separate process\'s <code>HybridCache</code> instance independently discovers "L1 miss, L2 miss" and independently begins its OWN factory call — the in-process "already in flight" tracking that prevents duplicate work WITHIN one instance has NO visibility into what OTHER instances are doing, since it is purely in-memory, per-process state.',
        'This means the ACTUAL number of concurrent back-end calls a stampede can produce is bounded by "one per app instance experiencing the miss simultaneously," NOT "exactly one, cluster-wide," which is a materially different (and more expensive) worst case than the main page\'s description alone might suggest — for a deployment with 20 instances, a synchronized cache-cold moment can still produce up to 20 simultaneous factory calls against the backend, not just one.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What genuinely gets coalesced — concurrent requests on ONE instance',
      language: 'csharp',
      code: `public class ProductService(HybridCache cache, IProductRepository repo)
{
    public async Task<Product?> GetProductAsync(int id, CancellationToken ct)
    {
        return await cache.GetOrCreateAsync(
            key: \$"product-{id}",
            factory: async cancel =>
            {
                // Simulate an expensive backend call:
                await Task.Delay(500, cancel);
                return await repo.GetByIdAsync(id, cancel);
            },
            options: new() { Expiration = TimeSpan.FromMinutes(5) },
            cancellationToken: ct);
    }
}

// 1,000 CONCURRENT requests to the SAME running instance, for the
// SAME cold "product-42" key:
var tasks = Enumerable.Range(0, 1000)
    .Select(_ => productService.GetProductAsync(42, default));
await Task.WhenAll(tasks);

// STAMPEDE PROTECTION WORKS CORRECTLY HERE — repo.GetByIdAsync(42, ...)
// is called EXACTLY ONCE for all 1,000 concurrent requests on THIS
// process; the other 999 await the SAME in-flight Task and receive
// the SAME result once the first factory call completes.`,
    },
    {
      label: 'What does NOT get coalesced — the same cold key across MULTIPLE instances',
      language: 'csharp',
      code: `// A Kubernetes deployment with 20 replicas of the SAME ASP.NET Core
// app, each with its OWN independent HybridCache instance (sharing the
// SAME L2 distributed cache, e.g. Redis, but each with its OWN L1
// in-memory layer and its OWN in-process "in-flight" tracking):
//
//   Pod 1  -- HybridCache instance 1 (own L1, own in-flight tracking)
//   Pod 2  -- HybridCache instance 2 (own L1, own in-flight tracking)
//   ...
//   Pod 20 -- HybridCache instance 20 (own L1, own in-flight tracking)
//
// If "product-42" expires from L2 (Redis) at roughly the SAME moment
// (a common scenario: a fixed absolute expiration set when the key
// was first populated, or a deployment restart that cold-starts every
// pod's L1 simultaneously), and requests for "product-42" arrive at
// ALL 20 pods within the same brief window:

// Pod 1's HybridCache:  L1 miss, L2 miss -> calls repo.GetByIdAsync(42, ...)
// Pod 2's HybridCache:  L1 miss, L2 miss -> ALSO calls repo.GetByIdAsync(42, ...)
// ...
// Pod 20's HybridCache: L1 miss, L2 miss -> ALSO calls repo.GetByIdAsync(42, ...)

// Each pod's in-process stampede protection successfully coalesces its
// OWN concurrent requests down to ONE factory call — but there is NO
// mechanism coordinating BETWEEN pods, so the BACKEND still sees UP TO
// 20 simultaneous calls for the exact same key, not one.
//
// This is NOT a bug in HybridCache — it is a genuine architectural
// boundary: HybridCache's in-flight tracking is in-memory, per-process
// state, and extending it across a cluster would require a DIFFERENT,
// distributed coordination mechanism (e.g., a distributed lock via
// Redis itself) with its own cost and complexity tradeoffs.`,
    },
    {
      label: 'Mitigations — reducing the cluster-wide stampede window',
      language: 'csharp',
      code: `// OPTION 1: stagger expiration with jitter, so all instances don't
// go cold on the SAME key at the exact same moment:
options: new HybridCacheEntryOptions
{
    Expiration = TimeSpan.FromMinutes(5) + TimeSpan.FromSeconds(Random.Shared.Next(0, 30)),
    // Each instance's L1 (and the shared L2 entry itself) now expires
    // at a slightly different moment relative to when different
    // requests happen to populate it, reducing — but not eliminating —
    // the chance ALL instances miss at exactly the same instant.
}

// OPTION 2: proactively refresh the cache BEFORE expiration (a
// background job or a "refresh-ahead" pattern), so the key rarely
// actually goes cold from any instance's perspective under normal load:
public class ProductCacheRefresher(HybridCache cache, IProductRepository repo)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            await cache.GetOrCreateAsync("product-42",
                async cancel => await repo.GetByIdAsync(42, cancel),
                new() { Expiration = TimeSpan.FromMinutes(5) },
                cancellationToken: ct);

            await Task.Delay(TimeSpan.FromMinutes(4), ct); // refresh BEFORE expiry
        }
    }
}

// OPTION 3: for genuinely expensive, cluster-wide-hot keys, use an
// EXPLICIT distributed lock (e.g. RedLock via StackExchange.Redis)
// around the factory call itself — trading additional latency and
// complexity for a TRUE cluster-wide single-caller guarantee, only
// where the backend cost of a multi-instance stampede is severe
// enough to justify it.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team deploys their ASP.NET Core API across 15 pods, all sharing HybridCache with Redis as L2. During a deployment rollout, all 15 new pods start simultaneously with cold L1 caches (L2/Redis is warm and unaffected). Explain whether this rollout scenario triggers the multi-instance stampede risk this subtopic describes, and why it might be LESS severe than the synchronized-expiration scenario in the code examples.',
    hint: 'Consider what "L1 miss" alone actually requires HybridCache to do — does a MISS at L1 alone (with L2 still populated) require calling the expensive factory at all, or does HybridCache have another, faster path available in that specific case?',
    solution: `// The scenario: 15 pods start with COLD L1 (fresh in-process memory,
// nothing cached yet) but WARM L2 (Redis still has "product-42" from
// before the deployment, unaffected by pod restarts):

public async Task<Product?> GetProductAsync(int id, CancellationToken ct)
{
    return await cache.GetOrCreateAsync(
        key: $"product-{id}",
        factory: async cancel => await repo.GetByIdAsync(id, cancel),
        options: new() { Expiration = TimeSpan.FromMinutes(5) },
        cancellationToken: ct);
}

// WHY THIS IS LESS SEVERE than the synchronized-EXPIRATION scenario:
// GetOrCreateAsync's actual lookup order is L1 THEN L2 THEN factory —
// NOT "L1 miss immediately triggers the factory." When all 15 pods
// experience an L1 miss (because they just started with empty
// in-process memory), EACH one checks L2 (Redis) NEXT, BEFORE ever
// considering the factory callback at all. Since L2/Redis is WARM
// (it still has "product-42" from before the rollout, since Redis is
// a SEPARATE, shared service unaffected by individual pod restarts),
// EVERY pod's L1 miss resolves via an L2 HIT — populating that pod's
// own local L1 cache from Redis directly, with ZERO factory calls
// against the actual backend repository AT ALL.
//
// This is a GENUINELY DIFFERENT situation from the earlier
// synchronized-expiration example, where L2 ITSELF was cold (the key
// had expired from Redis, not just from each pod's local L1) — THAT
// scenario forces every pod straight to the expensive factory call,
// since there is no warm L2 entry to fall back to. A rolling
// deployment with cold L1-only (warm L2) is actually one of the
// SAFER patterns HybridCache handles well by design — the shared L2
// layer specifically absorbs exactly this "many instances starting
// with empty local caches" scenario, converting what would otherwise
// be N independent factory calls into N cheap Redis reads instead.
//
// The GENUINE multi-instance stampede risk this subtopic covers is
// specifically when L2 ITSELF goes cold simultaneously across the
// cluster's view (true expiration, explicit cluster-wide invalidation
// via RemoveByTagAsync, or Redis itself restarting) — not simply
// individual pods restarting while Redis stays up and populated.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'HybridCache\'s stampede protection guarantees only ONE call to the factory callback across an entire scaled-out deployment, for any given cache key.',
      reality: 'the in-flight-request coalescing is in-process, in-memory state — it prevents duplicate factory calls from concurrent requests hitting the SAME instance, but has no coordination across different app instances, each of which can independently invoke its own factory call.',
    },
    {
      thought: 'a rolling deployment restarting all app instances (and therefore clearing every instance\'s local L1 cache) always triggers a full cluster-wide stampede against the backend.',
      reality: 'if the shared L2 (distributed) cache remains warm during the restart, every instance\'s L1 miss resolves via an L2 hit instead of the factory — the backend sees zero extra load in this specific case, since the expensive factory callback is only invoked when BOTH L1 and L2 miss.',
    },
    {
      thought: 'the multi-instance stampede risk only matters for genuinely rare, unusual failure scenarios not worth planning for.',
      reality: 'it is a routine consequence of using a fixed absolute expiration on a popular key in any horizontally-scaled deployment — jittered expiration, proactive refresh-ahead patterns, or an explicit distributed lock are all standard, commonly-needed mitigations, not edge-case hardening.',
    },
  ];
}
