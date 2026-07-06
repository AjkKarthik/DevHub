import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-imemorycache-lazy-expiry-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-imemorycache-expiry-actually-enforced-lazy-not-timers.html',
  styleUrl: './how-imemorycache-expiry-actually-enforced-lazy-not-timers.scss',
})
export class HowImemorycacheExpiryActuallyEnforcedLazyNotTimersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes WHAT the expiration options mean (absolute, sliding, priority) — but never says WHEN an expired entry is actually removed, and the answer is "later than you think"',
      points: [
        'The main Caching page explains <code>SetAbsoluteExpiration</code>, <code>SetSlidingExpiration</code>, and eviction priority in detail, and its own Q&amp;A even contrasts this with Redis, where "Redis itself tracks the expiry and physically deletes the key." What it never states for <code>IMemoryCache</code>: there is NO per-entry timer counting down to the expiration moment. An entry whose TTL has passed is not proactively removed at that instant — it continues to OCCUPY MEMORY until something causes the cache to notice it is expired.',
      ],
    },
    {
      heading: 'Expiry is enforced at two lazy points: (1) on ACCESS — TryGetValue checks the entry\'s expiration and treats an expired entry as a miss, triggering its eviction — and (2) on a periodic SCAN that only runs piggy-backed on other cache activity, at most once per ExpirationScanFrequency',
      points: [
        'When you call <code>TryGetValue</code> (or <code>GetOrCreateAsync</code>) for a key whose entry has expired, the cache checks the timestamp AT THAT MOMENT, reports a miss, and schedules the stale entry for removal — so from the CALLER\'S perspective, expiry always LOOKS exact: you can never READ an expired value. What is NOT exact is the physical removal of entries nobody is reading: those are only cleaned up by a background scan that <code>MemoryCache</code> triggers opportunistically during OTHER cache operations, throttled to at most once per <code>ExpirationScanFrequency</code> (default 1 minute). A cache that receives NO traffic at all after a burst of writes can hold expired entries — and their memory — indefinitely, because nothing ever triggers the scan.',
        'This has two practical consequences the main page\'s guidance depends on but doesn\'t spell out. First, <code>RegisterPostEvictionCallback</code> fires when the entry is EVICTED, not when its TTL nominally elapses — for an untouched entry, the callback can run minutes after expiry (or effectively never in a quiet cache), so it cannot be used as a scheduling mechanism ("do X five minutes from now"). Second, the memory-pressure warning ("unbounded caches grow until OOM") is true EVEN WITH TTLs set, in the specific case of a write-heavy, read-rare cache: expired entries pile up between scans, so <code>SizeLimit</code> remains the real backstop, not expiry alone.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proving both halves: reads never see expired values, but untouched expired entries linger in memory',
      language: 'csharp',
      code: `[Fact]
public async Task ExpiredEntry_IsNeverReadable_ButLingersUntilSomethingNoticesIt()
{
    var cache = new MemoryCache(new MemoryCacheOptions
    {
        // Widen the scan throttle so the test can observe the lazy
        // window deterministically instead of racing a 1-minute default:
        ExpirationScanFrequency = TimeSpan.FromHours(1),
    });

    var evictionFired = false;
    using (var entry = cache.CreateEntry("key"))
    {
        entry.Value = "value";
        entry.SetAbsoluteExpiration(TimeSpan.FromMilliseconds(50));
        entry.RegisterPostEvictionCallback((_, _, reason, _) => evictionFired = true);
    }

    await Task.Delay(200);   // TTL (50ms) has long passed

    // HALF 1 — the CALLER-VISIBLE contract is exact: an expired entry
    // is a miss the moment it is accessed, never a stale read:
    Assert.False(cache.TryGetValue("key", out string? _));

    // HALF 2 — but BEFORE that TryGetValue call, had we inspected the
    // cache, the entry was still physically present. Count proves it
    // has now been removed BECAUSE the access noticed the expiry —
    // not because a timer fired at the 50ms mark:
    Assert.Equal(0, cache.Count);
    Assert.True(evictionFired);   // callback ran ON ACCESS-TRIGGERED
                                    // eviction — ~200ms after nominal
                                    // expiry, NOT at the 50ms mark
}

[Fact]
public async Task UntouchedExpiredEntry_StillOccupiesTheCache()
{
    var cache = new MemoryCache(new MemoryCacheOptions
    {
        ExpirationScanFrequency = TimeSpan.FromHours(1),
    });

    cache.Set("silent-key", "value",
        new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromMilliseconds(50)));

    await Task.Delay(500);   // TTL passed 10x over — and NOTHING has
                              // touched the cache since

    // THE KEY OBSERVATION: with no access to trigger the check and the
    // scan throttled away, the expired entry is STILL physically in the
    // cache, occupying memory. There is no timer working through
    // entries at their expiration moments:
    Assert.Equal(1, cache.Count);
}`,
    },
    {
      label: 'What this means in practice — the two habits that follow from lazy expiry',
      language: 'csharp',
      code: `// HABIT 1: never use RegisterPostEvictionCallback as a scheduler.
// A tempting-but-broken pattern:
cache.Set("session-warning", sessionId, new MemoryCacheEntryOptions()
    .SetAbsoluteExpiration(TimeSpan.FromMinutes(5))
    .RegisterPostEvictionCallback((_, value, _, _) =>
        NotifyUserSessionExpiring((string)value!)));   // BROKEN INTENT:
// The developer wants "notify the user 5 minutes from now." But the
// callback only fires when the entry is EVICTED — which happens when
// (a) someone happens to access this exact key after expiry, or (b) a
// scan happens to run, itself triggered only by OTHER cache activity.
// On a quiet cache, the notification arrives arbitrarily late or
// never. For time-based scheduling, use a real timer mechanism
// (PeriodicTimer in a BackgroundService) — the cache's eviction
// pipeline makes no timeliness promise at all.

// HABIT 2: for write-heavy caches, treat SizeLimit as the memory
// backstop — TTL alone does not bound memory between scans:
builder.Services.AddMemoryCache(opts =>
{
    opts.SizeLimit = 10_000;                          // the REAL bound
    opts.ExpirationScanFrequency = TimeSpan.FromSeconds(30);  // tighten the
                                                       // scan if expired-entry
                                                       // lag matters
});
// Every entry must then call entry.SetSize(n) — the main page's own
// "SizeLimit without SetSize is silently disabled" mistake applies.

// THE REDIS CONTRAST, now precise: the main page's Q&A says Redis
// "physically deletes the key" after TTL. Redis uses a hybrid of the
// same two ideas — lazy deletion on access PLUS an active random-
// sampling expiry cycle that runs continuously server-side — so
// expired Redis keys are reclaimed within a bounded, short window even
// with zero client traffic. IMemoryCache has the lazy half but its
// "active" half (the scan) only runs when the cache itself is being
// used, which is exactly the gap the quiet-cache test demonstrates.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that IMemoryCache scans are only triggered by cache activity, describe a realistic production traffic pattern where a service\'s memory usage keeps climbing for hours DESPITE every cache entry having a short 60-second TTL — and explain what single configuration or code change would bound it.',
    hint: 'Consider a cache that is written on one code path (e.g. per-request response memoization with unique-per-request keys) but whose keys are essentially never READ again — what triggers either of the two lazy expiry mechanisms for those entries?',
    solution: `The pattern: a cache used as a write-mostly store with LOW KEY REUSE —
for example, memoizing per-request computation under keys that include
a request-specific component (a correlation ID, a full query string
with high-cardinality parameters, a user+timestamp combination). Each
request WRITES a new entry with a 60-second TTL, but no later request
ever READS that same key again, because the key never repeats.

Walk through the two lazy mechanisms for such an entry:
1. Access-triggered expiry never fires — the key is never accessed
   again after its single write.
2. The periodic scan CAN clean these up — but the scan is throttled to
   once per ExpirationScanFrequency AND each scan does bounded work.
   Under a heavy write rate, entries are added faster than the
   occasional scans reclaim them, so the population of already-expired
   but not-yet-removed entries grows steadily. Memory climbs for hours
   even though no entry is ever logically live for more than 60
   seconds.

The single change that bounds it: configure SizeLimit (with SetSize on
every entry). SizeLimit is enforced SYNCHRONOUSLY on writes — when a
new entry would exceed the limit, the cache compacts immediately,
evicting expired and low-priority entries to make room. That converts
memory from "bounded only by scan luck" to "bounded by an explicit
budget," which is exactly why the main page's advice to always pair
SizeLimit with SetSize is the real OOM protection, not TTLs.

(Secondary options that help but do not bound: shortening
ExpirationScanFrequency increases reclaim frequency at some CPU cost;
fixing the key design so keys actually repeat turns the cache back
into a cache instead of a write-only log — arguably the true root
cause here.)`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'when an IMemoryCache entry\'s TTL elapses, a timer removes it from memory at that moment, the same way Redis deletes expired keys server-side.',
      reality: 'there is no per-entry timer — an expired entry is only physically removed when an access to that key notices the expiry, or when a periodic scan (itself triggered only by other cache activity, at most once per ExpirationScanFrequency) sweeps it; on a quiet cache, expired entries can linger indefinitely.',
    },
    {
      thought: 'because removal is lazy, a caller might occasionally read a stale value from an entry whose TTL has already passed.',
      reality: 'the caller-visible contract IS exact — TryGetValue checks the expiration timestamp on every access and treats an expired entry as a miss, so a stale READ is impossible; only the physical memory reclamation is lazy, not the logical expiry.',
    },
    {
      thought: 'RegisterPostEvictionCallback fires when the entry\'s TTL elapses, making it a convenient way to schedule work "N minutes from now."',
      reality: 'the callback fires when the entry is actually EVICTED — which for an untouched entry can be minutes after nominal expiry, or effectively never on a quiet cache — so it makes no timeliness promise and must not be used as a scheduling mechanism; use a real timer (PeriodicTimer in a BackgroundService) instead.',
    },
  ];
}
