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
  templateUrl: './stale-while-revalidate-exists-to-stop-cache-stampedes.html',
  styleUrl: './stale-while-revalidate-exists-to-stop-cache-stampedes.scss'
})
export class StaleWhileRevalidateExistsToStopCacheStampedesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A feature named on the main page, without explaining the problem it solves',
      points: [
        'The main page\'s CDN Architecture section mentions "stale-while-revalidate serves stale while fetching fresh" as one line in a list of Cache-Control directives, alongside max-age and s-maxage — stated as a feature, with no explanation of WHY it exists or what specific failure it prevents. This subtopic fills in that missing context.',
      ]
    },
    {
      heading: 'The problem stale-while-revalidate solves: the cache stampede (thundering herd)',
      points: [
        'When a popular cached object\'s TTL expires, EVERY request arriving in that instant sees a cache miss simultaneously — without protection, all of them independently forward to the origin server at once. For a genuinely popular object, this can mean hundreds or thousands of near-simultaneous origin requests arriving in milliseconds, spiking origin load right at the moment the cache was supposed to be protecting it.',
        'This failure mode has several names in different communities — cache stampede, thundering herd, or the "dogpile effect" — but it\'s the same underlying problem: synchronized cache-miss traffic overwhelming the very backend the cache exists to shield.',
      ]
    },
    {
      heading: 'How stale-while-revalidate (and related techniques) actually prevent it',
      points: [
        'stale-while-revalidate tells the cache: when this entry expires, keep serving the STALE (expired) copy to incoming requests immediately, while asynchronously fetching a fresh copy from origin IN THE BACKGROUND — only ONE origin request needs to happen, not one per incoming request, and users never wait on that origin round trip at all.',
        'A closely related technique, REQUEST COALESCING (or "collapsed forwarding"), takes a different angle on the same problem: when multiple simultaneous cache misses for the SAME key arrive at an edge node, the CDN collapses them into a single in-flight origin request, then serves all the waiting requests from that one response once it returns — commonly cutting stampede-driven origin traffic by 90%+ compared to no protection at all.',
        'A third, complementary technique — jittered/randomized TTLs — avoids the SYNCHRONIZED expiry that creates a stampede in the first place, by adding a small random offset to each cached object\'s TTL so that many objects cached at the same time don\'t all expire at the exact same instant.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Cache-Control headers that prevent (or fail to prevent) a stampede',
      language: 'bash',
      code: `# WITHOUT stampede protection -- a popular object's TTL expiry
# creates a thundering herd of simultaneous origin requests:
Cache-Control: public, max-age=60
# At second 60, every one of 10,000 concurrent requests for
# this object independently misses the cache and hits origin.

# WITH stale-while-revalidate -- one background refresh,
# everyone else served the (briefly) stale copy instantly:
Cache-Control: public, max-age=60, stale-while-revalidate=30
# For 30 seconds after expiry, serve the stale copy immediately
# while ONE background request refreshes it from origin.

# Request coalescing (CDN-side config, not a header) collapses
# concurrent cache-fill requests for the SAME key into one
# origin request -- check your specific CDN's docs for how this
# is enabled (often on by default at the edge tier).`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A product page cached with <code>Cache-Control: public, max-age=300</code> (no stale-while-revalidate) gets 5,000 requests/second at peak, evenly spread across users. What happens at the exact moment the cached entry\'s 300-second TTL expires, and how would adding stale-while-revalidate change that?',
    hint: 'Without stampede protection, how many of those 5,000 requests-per-second see a cache MISS in the instant the TTL expires?',
    solution: 'Without stampede protection, potentially ALL requests arriving in that instant (a meaningful fraction of the 5,000/sec rate) see a simultaneous cache miss and independently forward to origin — a thundering herd that can spike origin load far beyond its normal (cached) baseline, exactly when the cache was supposed to be protecting it. Adding `stale-while-revalidate` changes this completely: the cache keeps serving the (briefly stale) cached copy to all 5,000 requests-per-second immediately, while exactly ONE background request quietly refreshes the object from origin — origin sees one request instead of thousands, and no user-facing request waits on that origin round trip at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'stale-while-revalidate is just a minor caching optimization — a Cache-Control directive worth knowing the syntax for, without a specific failure mode behind it.',
      reality: 'Per this subtopic\'s theory (context added to the main page during this batch), it specifically exists to prevent the cache stampede / thundering herd problem — synchronized cache-miss traffic overwhelming origin the instant a popular object\'s TTL expires.'
    },
    {
      thought: 'Without stale-while-revalidate, a cache miss on a popular object results in exactly one origin request, same as any other cache miss.',
      reality: 'Per this subtopic\'s theory, a popular object\'s SYNCHRONIZED TTL expiry can produce hundreds or thousands of simultaneous cache misses across concurrent requests, each independently hitting origin without stampede protection — a fundamentally different, much worse scenario than an isolated single-request cache miss.'
    },
    {
      thought: 'Request coalescing and stale-while-revalidate solve the same problem in the same way, so only one is needed.',
      reality: 'Per this subtopic\'s theory, they attack it from different angles — stale-while-revalidate serves stale content while refreshing in the background, while request coalescing collapses genuinely-concurrent cache-fill requests into one origin call — and jittered TTLs prevent the synchronized expiry that triggers a stampede in the first place; a robust CDN strategy often combines more than one.'
    }
  ];
}
