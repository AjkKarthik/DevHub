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
  templateUrl: './cache-never-refreshed-in-background.html',
  styleUrl: './cache-never-refreshed-in-background.scss'
})
export class CacheNeverRefreshedInBackgroundSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'What the mistakes block promises versus what the codeTab actually does',
      points: [
        'The "Not caching registry lookups" mistake block\'s fix says: "Cache registry responses for 5–30 seconds; refresh in the background." That specific phrase — "refresh in the background" — describes a distinct caching strategy from what the "Client-Side Discovery" codeTab actually implements.',
        'The codeTab\'s <code>ServiceRegistry.getInstances()</code> uses <code>setTimeout(() => this.cache.delete(serviceName), 5000)</code> — this DELETES the cache entry after 5 seconds. It does not fetch fresh data ahead of time; it just clears the slot. The NEXT call after that point pays the full, synchronous Consul lookup latency before returning anything.',
        'That\'s a real caching pattern — commonly called cache-aside with TTL expiry — but it is a DIFFERENT pattern from "refresh in the background," which would proactively fetch new data BEFORE the old entry expires, so callers never have to wait on a slow lookup at all.',
      ]
    },
    {
      heading: 'Why the difference actually matters, not just as terminology',
      points: [
        'Under the codeTab\'s actual cache-aside pattern, every 5th second (whenever the TTL lapses), the NEXT caller to <code>getUrl()</code> for that service pays the full registry round-trip latency synchronously, as part of their own request — a small, but real and recurring, latency spike inflicted on whichever caller happens to be unlucky enough to arrive right after expiry.',
        'A genuine background-refresh (refresh-ahead) cache instead schedules the NEXT fetch proactively, updating the cached value silently before the old one expires — every caller, including the one right after a refresh completes, is served from the already-warm cache with no synchronous registry round-trip on their own request path.',
        'The gap between the two isn\'t catastrophic here (Consul lookups are typically fast, and 5 seconds is short), but it is a real, checkable gap between what the page\'s mistakes block promised the fix would do and what its own accompanying code sample actually implements — and it grows more significant for a discovery source with higher lookup latency or under high request concurrency where several callers can pile up waiting on the same synchronous refetch.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Cache-aside (what the page shows) vs. refresh-ahead',
      language: 'typescript',
      code: `// CACHE-ASIDE WITH TTL -- what the page's own codeTab implements
class CacheAsideRegistry {
  private cache = new Map<string, { address: string; port: number }[]>();

  async getInstances(serviceName: string) {
    if (!this.cache.has(serviceName)) {
      const services = await consul.health.service({ service: serviceName, passing: true });
      this.cache.set(serviceName, services.map(toInstance));
      setTimeout(() => this.cache.delete(serviceName), 5000); // just DELETES -- no refetch
    }
    return this.cache.get(serviceName)!;
    // Whoever calls this right after the 5s mark pays the full Consul
    // lookup latency synchronously, as part of THEIR OWN request.
  }
}

// REFRESH-AHEAD -- what "refresh in the background" actually means
class RefreshAheadRegistry {
  private cache = new Map<string, { address: string; port: number }[]>();

  constructor() {
    // Nothing calls this reactively -- it's already running independently.
  }

  private async refresh(serviceName: string) {
    const services = await consul.health.service({ service: serviceName, passing: true });
    this.cache.set(serviceName, services.map(toInstance));
    setTimeout(() => this.refresh(serviceName), 5000); // schedule the NEXT refresh proactively
  }

  startWatching(serviceName: string) {
    this.refresh(serviceName); // kicks off the self-scheduling loop
  }

  getInstances(serviceName: string) {
    return this.cache.get(serviceName) ?? [];
    // Always returns whatever is currently cached, synchronously --
    // no caller ever waits on a live Consul round trip.
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Under the page\'s own cache-aside codeTab, a service receives a steady 200 requests/second calling getUrl(\'catalog-service\'). The Consul lookup itself takes 40ms. Roughly how many of those requests, per 5-second cache cycle, end up waiting on a live Consul round trip rather than hitting the warm cache?',
    hint: 'The cache is deleted (not refreshed) every 5 seconds. Consider what happens to requests that arrive while the FIRST post-expiry request is still awaiting its 40ms Consul lookup.',
    solution: 'At minimum 1 request per cycle pays the full 40ms directly -- but if the codeTab\'s getInstances() is called concurrently by multiple in-flight requests during that 40ms window (a realistic scenario at 200 req/sec, since roughly 8 requests would arrive in a 40ms span), EVERY one of those concurrent callers sees `this.cache.has(serviceName)` as false and independently kicks off its own Consul lookup, multiplying the registry load for that brief window rather than just one caller absorbing the latency. A refresh-ahead cache avoids both problems: the cache is never empty long enough for `has()` to return false, so no caller -- concurrent or not -- ever waits on a live lookup or triggers a redundant one.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Cache with a TTL" and "refresh in the background" describe the same caching behavior, just worded differently.',
      reality: 'Per this subtopic\'s theory, they\'re genuinely different strategies — TTL-expiry (cache-aside) clears the cache and waits for the next caller to trigger a refetch, while background/refresh-ahead proactively re-fetches before expiry so no caller ever waits on a live lookup.'
    },
    {
      thought: 'Since the page\'s codeTab caches results for 5 seconds, it must be doing exactly what its own mistakes block\'s "refresh in the background" fix describes.',
      reality: 'Per this subtopic\'s theory, the codeTab\'s setTimeout only DELETES the cache entry — it never re-fetches anything until the next caller happens to arrive and finds the cache empty, which is a different (simpler, but not "background") pattern.'
    },
    {
      thought: 'The gap between cache-aside and refresh-ahead is purely academic and never actually matters in a real system.',
      reality: 'Per this subtopic\'s theory, under concurrent load, cache-aside can cause MULTIPLE callers to independently trigger redundant lookups in the same brief window right after expiry — a real, measurable effect that grows with request concurrency and lookup latency.'
    }
  ];
}
