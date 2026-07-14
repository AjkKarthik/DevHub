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
  templateUrl: './domain-sharding-defeats-http2-connection-coalescing.html',
  styleUrl: './domain-sharding-defeats-http2-connection-coalescing.scss'
})
export class DomainShardingDefeatsHttp2ConnectionCoalescingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Domain sharding was a workaround for a limit that HTTP/2 removes entirely — keeping it after upgrading actively fights the new protocol',
      points: [
        'HTTP/1.1 browsers cap concurrent connections at roughly 6 per origin. Splitting assets across img1.example.com, img2.example.com, and img3.example.com was a legitimate trick to get up to 18+ parallel connections instead of 6.',
        'HTTP/2 removes the reason for this entirely: a single connection multiplexes effectively unlimited concurrent streams. There is no 6-connection ceiling to work around anymore.',
        'Keeping the old sharded hostnames after moving to HTTP/2 does not just fail to help — it actively costs more, because each distinct hostname needs its OWN separate connection (its own DNS lookup, TCP handshake, and TLS negotiation), even if all three ultimately resolve to the same server.',
      ]
    },
    {
      heading: 'Connection coalescing is the specific HTTP/2 mechanism this breaks',
      points: [
        'When two hostnames resolve to the same IP address AND share a TLS certificate that is valid for both names (a wildcard or multi-domain cert covering both), HTTP/2-capable browsers can reuse ONE existing connection for both hostnames instead of opening a second one — this is connection coalescing.',
        'Sharded hostnames on different subdomains (img1.example.com vs img2.example.com) usually fail this coalescing check anyway if each subdomain uses its own narrowly-scoped certificate, or the browser is conservative about coalescing across distinct DNS names — the practical result is 3 separate connections doing the work 1 could have done.',
        'The fix is not "shard smarter" — it is removing the sharding entirely on an HTTP/2 (or HTTP/3) origin and serving everything from a single hostname, letting multiplexing do what sharding used to do, for free.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Before — HTTP/1.1-era sharding (harmful on HTTP/2)',
      language: 'html',
      code: `<!-- Three separate hostnames, each requiring its own DNS + TCP + TLS -->
<img src="https://img1.example.com/hero.avif" alt="Hero">
<img src="https://img2.example.com/thumbnail-1.avif" alt="Thumb 1">
<img src="https://img2.example.com/thumbnail-2.avif" alt="Thumb 2">
<img src="https://img3.example.com/logo.svg" alt="Logo">

<!--
  On HTTP/1.1: up to 18 concurrent connections (6 per hostname x 3 hostnames)
  On HTTP/2:   THREE separate connections, each limited to its own multiplexing —
               instead of ONE connection multiplexing all four requests
-->`,
    },
    {
      label: 'After — single origin, HTTP/2 multiplexing',
      language: 'html',
      code: `<!-- One hostname — HTTP/2 multiplexes all requests over one connection -->
<img src="https://cdn.example.com/hero.avif" alt="Hero">
<img src="https://cdn.example.com/thumbnail-1.avif" alt="Thumb 1">
<img src="https://cdn.example.com/thumbnail-2.avif" alt="Thumb 2">
<img src="https://cdn.example.com/logo.svg" alt="Logo">

<!--
  On HTTP/2: ONE connection, ONE TLS handshake, all four requests
  multiplexed as independent streams — no artificial concurrency ceiling
  to work around, so there is nothing sharding would have improved.
-->`,
    },
    {
      label: 'Checking whether coalescing actually happened',
      language: 'bash',
      code: `# Chrome DevTools -> Network panel -> click a request -> "Connection ID" column
# (right-click any column header to enable it)
#
# If two different hostnames show the SAME Connection ID, the browser
# successfully coalesced them onto one connection.
# If they show DIFFERENT Connection IDs, each opened its own connection --
# the coalescing conditions (same IP + a certificate valid for both names)
# were not met, and sharding is costing you extra handshakes for nothing.

# curl can also confirm which IP each hostname resolves to:
curl -sI https://img1.example.com | head -1
curl -sI https://img2.example.com | head -1
# If both hostnames resolve to different IPs, coalescing cannot happen at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team migrated their server from HTTP/1.1 to HTTP/2 last year but kept the original img1/img2/img3.cdn.com domain sharding "just in case it still helps a little". A new performance audit flags this as a regression risk. Is the audit right to be concerned, even though nothing appears broken?',
    hint: 'Ask what domain sharding is actually FOR, and whether that reason still exists once HTTP/2 removes the connection-per-origin ceiling it was working around.',
    solution: 'The audit is right to flag it. Domain sharding solved exactly one problem — the HTTP/1.1 6-connections-per-origin limit — which HTTP/2 multiplexing eliminates entirely. Keeping the sharded hostnames after the HTTP/2 migration does not provide "a little" extra benefit; it actively costs extra DNS lookups, TCP handshakes, and TLS negotiations for connections that no longer need to exist, splitting what could be one efficient multiplexed connection into several redundant ones. The fix is consolidating back to a single hostname and letting HTTP/2 multiplexing handle concurrency.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Domain sharding is a "safe" legacy optimisation to leave in place after upgrading to HTTP/2 — it might not help anymore, but it should not actively hurt anything either.',
      reality: 'It actively hurts performance on HTTP/2 — each sharded hostname forces its own separate connection setup (DNS + TCP + TLS) instead of letting one connection multiplex everything, turning a former optimisation into a real regression.'
    },
    {
      thought: 'Connection coalescing happens automatically for any set of subdomains under the same parent domain (e.g. anything.example.com), regardless of certificate or IP setup.',
      reality: 'Coalescing requires BOTH the hostnames to resolve to the same IP address AND share a TLS certificate valid for both names — sharded subdomains with their own separate, narrowly-scoped certificates or different IPs will NOT coalesce, even though they look related.'
    },
    {
      thought: 'Whether coalescing actually happened is not something you can verify — you just have to trust that HTTP/2 is "handling it" in the background.',
      reality: 'It is directly checkable in Chrome DevTools via the Connection ID column — requests sharing the same ID used one coalesced connection; different IDs mean separate connections were opened, exactly the failure mode sharding causes.'
    }
  ];
}
