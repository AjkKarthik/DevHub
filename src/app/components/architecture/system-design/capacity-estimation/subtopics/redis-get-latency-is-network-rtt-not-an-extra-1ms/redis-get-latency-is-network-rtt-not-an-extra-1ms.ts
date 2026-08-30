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
  templateUrl: './redis-get-latency-is-network-rtt-not-an-extra-1ms.html',
  styleUrl: './redis-get-latency-is-network-rtt-not-an-extra-1ms.scss'
})
export class RedisGetLatencyIsNetworkRttNotAnExtra1msSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A number that looked reasonable in isolation but didn\'t match the row above it',
      points: [
        'The main page\'s latency table originally listed "Network same data center: 0.5 ms" immediately followed by "Memcached get (same DC): 1 ms" and "Redis get (same DC): 1 ms" — implying a cache GET costs an EXTRA 0.5ms on top of the network round trip itself, as if the cache server\'s own processing time roughly doubled the total latency. Checking this against how Redis and Memcached actually perform, that extra overhead is far too large. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: cache server processing is sub-microsecond — the round trip IS the latency',
      points: [
        'Both Redis and Memcached are single-threaded (per core) in-memory key-value stores whose own command-processing time for a simple GET is in the sub-microsecond range — effectively negligible compared to network latency. Real-world benchmarks of same-datacenter Redis GET commands commonly show MEDIAN latencies in the ~0.1-0.5ms range, not meaningfully above the underlying network round-trip time.',
        'This means a GET to a same-datacenter Redis or Memcached instance should be estimated as roughly EQUAL to the network round-trip figure already on the page (~0.5ms), not as an additional, separate ~1ms line item stacked on top of it.',
      ]
    },
    {
      heading: 'Why this specific gap matters for a capacity estimate',
      points: [
        'When justifying a caching layer\'s latency benefit in an interview ("adding a cache turns a 10ms DB query into a sub-millisecond cache hit"), overstating the cache\'s OWN overhead (1ms vs the real ~0.5ms) makes the cache look less beneficial than it really is — understating your own solution\'s value is the opposite of the intended effect.',
        'It also matters when stacking multiple cache/network hops in a request\'s critical path (e.g. app server → Redis → app server → downstream service) — each hop\'s assumed latency compounds, so a 2x overstatement per hop meaningfully inflates the total estimated latency budget.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why a Redis GET doesn\'t cost meaningfully more than the network RTT alone',
      language: 'bash',
      code: `# Redis/Memcached command processing itself: sub-microsecond
# (single-threaded, in-memory, O(1) key lookup for a plain GET)

# Same-datacenter network round trip: ~0.5ms (already on the page)

# Total expected Redis/Memcached GET latency, same DC:
#   ~0.5ms (network RTT) + ~0.0001ms (processing) =~ 0.5ms
# NOT ~1ms as a separate, doubled line item

# Real benchmark example (redis-benchmark, same-DC deployment):
redis-benchmark -h <redis-host> -t GET -n 100000 -c 50 -q
# Typical reported result: GET latency p50 ~0.15-0.5ms,
# consistent with "roughly the network RTT," not double it.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You\'re justifying a caching layer in an interview: "Currently a DB query takes 10ms. Adding a Redis cache in the same datacenter would bring that down to about 1ms for cache hits, since Redis costs about 1ms per GET." Using the corrected figures from this subtopic, is "about 1ms" the most accurate way to frame this?',
    hint: 'Is a Redis GET\'s latency mostly the network round trip, or mostly Redis\'s own processing time on top of the round trip?',
    solution: 'The 10x-versus-DB comparison direction is right, but "about 1ms" overstates Redis\'s actual cost — a more accurate framing is "about 0.5ms, since Redis\'s own processing is sub-microsecond and the latency is almost entirely the same-datacenter network round trip." This actually makes the cache layer\'s case STRONGER, not weaker (a 20x improvement over the 10ms DB query, not merely 10x) — correcting an overstated cost in your own favor is still worth doing precisely, since an interviewer who knows the real numbers will notice either way.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A same-datacenter Redis or Memcached GET typically costs about 1ms — roughly double the network round-trip time alone.',
      reality: 'Per this subtopic\'s theory (a figure corrected on the main page during this batch), Redis/Memcached command processing itself is sub-microsecond, so a GET\'s real latency is close to the network round trip itself (~0.5ms), not an extra ~0.5ms stacked on top.'
    },
    {
      thought: 'Since Redis and Memcached do real work (hashing keys, memory lookups), it\'s reasonable to assume their own processing roughly matches network latency in cost.',
      reality: 'Per this subtopic\'s theory, that "real work" for a simple GET is sub-microsecond in practice — negligible next to network round-trip time, not comparable to it.'
    },
    {
      thought: 'Overstating a caching layer\'s own latency cost is a "safe," conservative estimate to use in an interview.',
      reality: 'Per this subtopic\'s theory, an overstated cache cost actually understates how much benefit the caching layer provides — the more accurate number makes the case for caching stronger, not weaker.'
    }
  ];
}
