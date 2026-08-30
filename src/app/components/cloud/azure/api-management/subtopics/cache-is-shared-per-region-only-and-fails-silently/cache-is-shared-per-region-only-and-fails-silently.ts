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
  templateUrl: './cache-is-shared-per-region-only-and-fails-silently.html',
  styleUrl: './cache-is-shared-per-region-only-and-fails-silently.scss'
})
export class CacheIsSharedPerRegionOnlyAndFailsSilentlySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes cache-lookup/cache-store as a simple, unqualified performance win',
      points: [
        'The main page\'s own theory states: "cache-lookup + cache-store: cache GET responses in APIM\'s built-in cache (internal) or an external Azure Cache for Redis (external cache provider)." Nothing here scopes WHAT the internal cache is shared across, or what happens when a cache operation can\'t complete.',
        'The main page also lists Premium as "multi-region" without connecting that fact to caching at all — a reader combining the two features (multi-region deployment + built-in cache) has no way to know from the main page whether a cached response in one region is visible in another.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own caching documentation: shared per region only, and available tier-dependent',
      points: [
        'Per Microsoft\'s own documentation: "Built-in cache is volatile and is shared by all units in the same region in the same API Management instance." The key qualifier is "in the same region" — a multi-region Premium deployment does NOT share its built-in cache across regions. Each region\'s units share a cache among themselves, but two different regions maintain two entirely separate caches for the exact same API and cache key.',
        'Also confirmed: "Internal caching isn\'t available in the Consumption tier of Azure API Management." This is the concrete detail behind the main page\'s own vague "limited features" description of the Consumption tier — cache-lookup/cache-store policies configured on a Consumption-tier instance have no internal cache backing them at all; only an external Redis-compatible cache works there.',
      ]
    },
    {
      heading: 'The genuinely surprising part: cache failures never raise an error, in either cache type',
      points: [
        'Confirmed via the same documentation: "Regardless of the cache type used (internal or external), if cache-related operations fail to connect to the cache because of the volatility of the cache or for any other reason, the API call that uses the cache-related operation doesn\'t raise an error, and the cache operation completes successfully. In the case of a read operation, a null value is returned to the calling policy expression."',
        'This means a cache-lookup that fails because the cache is unreachable is INDISTINGUISHABLE, from the policy\'s own point of view, from a normal cache miss — both simply return null and let the request fall through to the backend. There is no exception to catch, no distinct status to branch on, and no built-in signal that the cache itself is unhealthy versus simply cold.',
        'Microsoft\'s own guidance response to this is explicit: "Your policy code should be designed to ensure that there\'s a fallback mechanism to retrieve data that\'s not found in the cache" — treating every cache miss, silent-failure or genuine, as something the backend must always be able to serve correctly on its own, since the policy pipeline gives no way to tell the two apart.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What "shared" actually means in a multi-region Premium deployment',
      language: 'bash',
      code: `<!-- Main page's own cache-lookup/cache-store example, unchanged: -->
<policies>
  <inbound>
    <base />
    <cache-lookup vary-by-developer="false" vary-by-developer-groups="false">
      <vary-by-query-parameter>category</vary-by-query-parameter>
    </cache-lookup>
  </inbound>
  <backend><base /></backend>
  <outbound>
    <base />
    <cache-store duration="300" />
  </outbound>
</policies>

<!-- Per Microsoft's own docs: "Built-in cache is volatile and is
     shared by all units in the same REGION in the same API
     Management instance." On a Premium tier instance deployed to
     East US + West Europe:

     Request 1: hits the East US regional gateway -> cache MISS
                -> calls backend -> stores in EAST US's cache only
     Request 2 (same cache key): hits the West Europe regional
                gateway -> cache MISS AGAIN -> calls backend AGAIN
                -> stores in WEST EUROPE's cache, separately

     The two regions never share this cached response -- "shared"
     only ever means shared among the UNITS within one region. -->

<!-- Also confirmed: internal cache-lookup/cache-store has NO effect
     at all on the Consumption tier -- only an external Redis-
     compatible cache works there. -->`,
    },
    {
      label: 'A cache-lookup failure looks exactly like a normal cache miss',
      language: 'typescript',
      code: `// Per Microsoft's own docs: "if cache-related operations fail to
// connect to the cache... the API call... doesn't raise an error,
// and the cache operation completes successfully. In the case of a
// read operation, a null value is returned to the calling policy
// expression."

// This applies EQUALLY to internal and external (Redis) caches.
// From inside a policy expression, there is no way to distinguish:

//   Scenario A: genuine cache miss (key never cached, or expired)
//   Scenario B: cache is completely unreachable right now
//                (network partition, external Redis instance down,
//                 internal cache volatility)

// Both scenarios: cache-lookup silently proceeds as a miss, the
// request falls through to the backend, and no exception, error
// header, or distinct status code is ever raised by the policy
// pipeline itself.

// Microsoft's own recommendation: never assume "cache miss" always
// means "cold cache" -- the backend must be able to correctly serve
// EVERY request on its own, since a persistently unreachable cache
// produces the exact same symptom as a perfectly healthy, empty one.

// If you need to actually DETECT cache unavailability (not just
// tolerate it), you must add your own explicit monitoring outside
// the policy pipeline -- e.g. alerting on backend call volume
// unexpectedly spiking to near-100% of total requests for an
// operation that's supposed to have a high cache hit rate.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team deploys their APIM instance on Premium tier across two regions (East US and West Europe) for low-latency global access. They add cache-lookup/cache-store policies expecting a single, global cache — so a request served from East US that populates the cache should mean the identical request hitting West Europe minutes later is a cache hit too. In testing, they observe the West Europe region ALWAYS calls the backend, never getting a hit from data cached in East US. Is this a bug?',
    hint: 'Check exactly what scope Microsoft\'s own documentation says the built-in cache is "shared" across, and whether that scope includes multiple regions in the same instance.',
    solution: 'This is expected behavior, not a bug — per Microsoft\'s own documentation, "built-in cache is volatile and is shared by all units in the same region in the same API Management instance." The word "region" is the key scope limiter: units within East US share a cache with each other, and units within West Europe share a SEPARATE cache with each other, but the two regions never share cache data between them. A response cached in East US is completely invisible to the West Europe gateway, and vice versa — each region independently calls the backend on its own first request for a given cache key. If the team genuinely needs a cache shared across regions, the fix is switching to an external Redis-compatible cache (a single external cache instance both regional gateways connect to) rather than relying on the built-in internal cache, which is architecturally scoped to a single region by design.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'APIM\'s built-in cache is a single, global cache shared across every region in a multi-region Premium deployment.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms the built-in cache is shared only "by all units in the same region in the same API Management instance" — two different regions in the same multi-region deployment maintain entirely separate caches for the same API and cache key.'
    },
    {
      thought: 'A cache-lookup miss in APIM always means the requested response genuinely isn\'t in the cache yet (or expired).',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own docs confirm a cache connectivity failure produces the exact same outcome as a genuine miss — a silent null return with no error raised — meaning a persistently unreachable cache is indistinguishable from an empty one purely from the policy pipeline\'s behavior.'
    },
    {
      thought: 'The Consumption tier\'s "limited features" still includes the same built-in cache-lookup/cache-store behavior as every other tier, just with lower throughput.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own docs state plainly that internal caching isn\'t available in the Consumption tier at all — cache-lookup/cache-store policies there only work if backed by an external Redis-compatible cache instead.'
    }
  ];
}
