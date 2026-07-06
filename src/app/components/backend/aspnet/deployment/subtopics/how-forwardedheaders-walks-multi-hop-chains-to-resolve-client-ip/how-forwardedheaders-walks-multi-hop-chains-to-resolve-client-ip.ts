import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-forwardedheaders-multihop-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-forwardedheaders-walks-multi-hop-chains-to-resolve-client-ip.html',
  styleUrl: './how-forwardedheaders-walks-multi-hop-chains-to-resolve-client-ip.scss',
})
export class HowForwardedheadersWalksMultiHopChainsToResolveClientIpSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s example assumes exactly ONE proxy hop (Nginx/ALB directly in front of the app) and shows one CIDR added to KnownNetworks — but production topologies frequently have MULTIPLE chained proxies (a CDN, then a load balancer, then an ingress controller), and X-Forwarded-For is a COMMA-SEPARATED LIST that accumulates one entry per hop, not a single value',
      points: [
        'Each proxy in a chain APPENDS its own view of "who did this request come from" to the <code>X-Forwarded-For</code> header rather than replacing it — a request passing through a CDN then a load balancer arrives at your app with something like <code>X-Forwarded-For: 203.0.113.42, 198.51.100.10</code>, where <code>203.0.113.42</code> is the ORIGINAL client and <code>198.51.100.10</code> is the CDN\'s own IP as seen by the load balancer.',
        '<code>ForwardedHeadersMiddleware</code> processes this list by walking it from the RIGHTMOST entry backward — the rightmost entry represents the hop CLOSEST to your server (the last proxy that touched the request before it reached you), which is exactly the one whose trustworthiness the middleware can actually verify against <code>KnownProxies</code>/<code>KnownNetworks</code>, since that\'s the IP of the actual TCP connection the middleware observes.',
      ],
    },
    {
      heading: 'The middleware only continues consuming entries as long as EACH one it examines is itself a KNOWN, trusted proxy — the moment it reaches an entry that is NOT in KnownNetworks/KnownProxies, it stops and treats THAT entry as the resolved client IP, discarding anything further left in the list as unverifiable',
      points: [
        'This means adding ONLY the load balancer\'s CIDR to <code>KnownNetworks</code> — forgetting the CDN\'s — produces a subtly WRONG result rather than an obviously broken one: the middleware correctly verifies the rightmost hop (the load balancer, now trusted) and consumes it, then examines the NEXT entry leftward (the CDN\'s IP) — which is NOT in <code>KnownNetworks</code> — and stops there, resolving <code>RemoteIpAddress</code> to the CDN\'s IP address rather than the actual end user\'s. The result LOOKS plausible (it\'s a real IP, not garbage) but is not the true client — every request appears to come from the CDN, silently breaking IP-based rate limiting, geolocation, or audit logging.',
        'The fix requires adding EVERY hop\'s CIDR range in the chain to <code>KnownNetworks</code>/<code>KnownProxies</code> — the CDN\'s published IP ranges AND the load balancer\'s — for the middleware to walk all the way back to the genuine originating client. Missing any INTERMEDIATE hop\'s trust entry breaks the chain at exactly that point, regardless of how many hops beyond it are correctly configured.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The incomplete-chain problem, reproduced',
      language: 'csharp',
      code: `// Real topology: CDN (Cloudflare-style edge) → Load Balancer → App
// Request arrives at the app with:
//   X-Forwarded-For: 203.0.113.42, 198.51.100.10
//   (203.0.113.42 = the real end user; 198.51.100.10 = CDN's IP,
//    as observed by the load balancer)
//
// The TCP connection the middleware actually SEES comes from the
// load balancer's own IP, e.g. 10.0.0.5.

builder.Services.Configure<ForwardedHeadersOptions>(opts =>
{
    opts.ForwardedHeaders = ForwardedHeaders.XForwardedFor;
    opts.KnownNetworks.Clear();
    opts.KnownProxies.Clear();

    // ONLY the load balancer's CIDR is added — CDN's range is MISSING:
    opts.KnownNetworks.Add(new IPNetwork(IPAddress.Parse("10.0.0.0"), 8));
});

// Walking the algorithm by hand:
//   1. Connecting IP is 10.0.0.5 — inside 10.0.0.0/8 → TRUSTED.
//      Consume the RIGHTMOST list entry (198.51.100.10, the CDN's IP,
//      as recorded by the load balancer) as the "next" candidate.
//   2. Is 198.51.100.10 (the CDN) itself inside KnownNetworks?
//      NO — the CDN's range was never added.
//   3. STOP. Resolve RemoteIpAddress = 198.51.100.10.
//
// WRONG RESULT: every request appears to originate from the CDN's IP,
// not the real end user (203.0.113.42) — silently breaking anything
// keyed on client IP (rate limiting, geolocation, audit logs), while
// LOOKING like a perfectly valid, unremarkable IP address in logs.`,
    },
    {
      label: 'The fix — trust EVERY hop in the chain, and a test proving the full walk-back',
      language: 'csharp',
      code: `builder.Services.Configure<ForwardedHeadersOptions>(opts =>
{
    opts.ForwardedHeaders = ForwardedHeaders.XForwardedFor;
    opts.KnownNetworks.Clear();
    opts.KnownProxies.Clear();

    // Trust BOTH hops — the load balancer AND the CDN's published range:
    opts.KnownNetworks.Add(new IPNetwork(IPAddress.Parse("10.0.0.0"), 8));       // LB
    opts.KnownNetworks.Add(new IPNetwork(IPAddress.Parse("198.51.100.0"), 24)); // CDN edge range

    // ForwardedHeadersOptions.ForwardLimit (default 1) also matters —
    // it caps how many list entries the middleware will consume AT ALL,
    // regardless of trust. A 2-hop chain needs ForwardLimit >= 2:
    opts.ForwardLimit = 2;
});

[Fact]
public async Task Resolves_True_Client_Through_Two_Trusted_Hops()
{
    await using var app = new TestWebApp(); // registers the config above
    var client = app.CreateClient();

    var request = new HttpRequestMessage(HttpMethod.Get, "/");
    request.Headers.Add("X-Simulated-Remote-Ip", "10.0.0.5");   // LB's IP — trusted
    request.Headers.Add("X-Forwarded-For", "203.0.113.42, 198.51.100.10");
    // Rightmost (198.51.100.10, the CDN) is checked FIRST against
    // KnownNetworks — now trusted, since the CDN range was added —
    // then the middleware continues to the NEXT entry (203.0.113.42),
    // which becomes the final resolved value since ForwardLimit allows it:

    var response = await client.SendAsync(request);
    var resolvedIp = await response.Content.ReadAsStringAsync();

    Assert.Equal("203.0.113.42", resolvedIp);   // the TRUE end user,
                                                  // not the CDN's IP
}

// Contrast: the SAME request against the INCOMPLETE configuration
// (only LB's CIDR trusted) resolves to "198.51.100.10" instead —
// this is the concrete, testable difference between a correctly and
// incompletely configured multi-hop trust chain.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team adds BOTH the CDN\'s and load balancer\'s CIDR ranges to KnownNetworks (matching this subtopic\'s fix) but leaves ForwardedHeadersOptions.ForwardLimit at its default value of 1. Predict what RemoteIpAddress resolves to for the exact two-hop request shown in this subtopic\'s code (X-Forwarded-For: 203.0.113.42, 198.51.100.10, connecting IP 10.0.0.5), and explain why trusting both hops in KnownNetworks was not, by itself, sufficient.',
    hint: 'ForwardLimit caps how many list entries the middleware will process AT ALL, independent of whether each one is individually trusted. With ForwardLimit = 1, how many entries does the middleware examine before stopping, regardless of what KnownNetworks contains?',
    solution: `With ForwardLimit left at its default of 1, RemoteIpAddress resolves
to "198.51.100.10" (the CDN's IP) — NOT the true end user
(203.0.113.42) — even though BOTH hops are correctly listed in
KnownNetworks. This is because ForwardLimit is an independent cap on
HOW MANY entries the middleware will process from the list, evaluated
BEFORE (or alongside) the trust check — it is not itself a trust
mechanism, but a hard ceiling on chain depth. With ForwardLimit = 1,
the middleware processes exactly ONE entry from the X-Forwarded-For
list (the rightmost, which correctly resolves to the CDN's trusted IP)
and then STOPS, regardless of whether more trusted entries remain
further left in the list.

This reveals that trusting every hop's CIDR range in KnownNetworks is
a NECESSARY but not SUFFICIENT condition for correctly resolving a
multi-hop chain — ForwardLimit must ALSO be raised to at least the
number of hops in the actual topology (2, for this CDN → LB → app
chain), or the middleware will stop early even when every remaining
entry it never gets to examine would have been correctly trusted.

The general lesson: KnownNetworks/KnownProxies answers "is THIS
specific hop trustworthy," while ForwardLimit answers a completely
different question, "how many hops am I willing to walk back through
at all" — both settings independently gate how far the middleware
resolves the true client IP, and a real multi-hop deployment needs
BOTH configured correctly together. Leaving ForwardLimit at its
conservative default of 1 (appropriate for the main page's own
single-proxy example) while adding multiple trusted CIDRs is a
common, easy-to-miss half-fix — the trust configuration alone is not
enough once more than one hop is actually in play.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'X-Forwarded-For always contains exactly one IP address representing the original client, regardless of how many reverse proxies the request passed through.',
      reality: 'each proxy in a chain APPENDS its own observed source IP to the header rather than replacing it — a request through a CDN and a load balancer arrives with a comma-separated list of multiple IPs, one per hop, ordered from the original client (leftmost) to the hop closest to the server (rightmost).',
    },
    {
      thought: 'adding a proxy\'s CIDR range to KnownNetworks makes ForwardedHeadersMiddleware trust and correctly resolve the true client IP through that proxy, for any chain depth.',
      reality: 'the middleware walks the X-Forwarded-For list from the rightmost entry backward, stopping the MOMENT it encounters an entry not covered by KnownNetworks/KnownProxies — missing even ONE intermediate hop\'s CIDR breaks the walk-back at exactly that point, resolving to that hop\'s IP rather than continuing to the true originating client.',
    },
    {
      thought: 'trusting every hop\'s CIDR range in a multi-hop proxy chain is sufficient to correctly resolve the true client IP all the way back.',
      reality: 'ForwardedHeadersOptions.ForwardLimit independently caps how many list entries the middleware processes at all, regardless of trust — its conservative default of 1 stops the walk-back after just one hop even when every remaining entry in KnownNetworks would have been correctly trusted, so a multi-hop chain needs ForwardLimit raised to match the actual number of hops, not just the CIDR ranges added.',
    },
  ];
}
