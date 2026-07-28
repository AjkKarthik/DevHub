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
  templateUrl: './retryon-5xx-can-amplify-load-into-an-already-overloaded-upstream.html',
  styleUrl: './retryon-5xx-can-amplify-load-into-an-already-overloaded-upstream.scss'
})
export class Retryon5xxCanAmplifyLoadIntoAnAlreadyOverloadedUpstreamSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page lists retryOn: 5xx as a common condition without connecting it to a specific risk the same page\'s own QnA describes elsewhere',
      points: [
        'The main page\'s theory bullet lists <code>5xx</code> (any 5xx response) as one of the common <code>retryOn</code> values, and separately warns generally about "retry amplification risk" if upstream already retries. A DIFFERENT QnA on the same page explains that DestinationRule connection-pool limits, when exceeded, make Envoy return "503 upstream overflow" as a circuit-breaker fast-fail. These two facts are never connected — but they interact in a genuinely important way.',
      ]
    },
    {
      heading: 'The interaction: retrying a circuit-breaker 503 sends MORE load at exactly the wrong moment',
      points: [
        'If an upstream is returning 503 because it has hit its OWN connection-pool limit (an overloaded, struggling service protecting itself via circuit breaking), a client-side VirtualService configured with <code>retryOn: 5xx</code> will retry that exact 503 — sending another connection attempt at the very upstream that just signaled it cannot handle more load right now.',
        'Each retry attempt itself counts as another connection against that same limited pool — meaning <code>retryOn: 5xx</code> combined with an upstream circuit breaker can create a feedback loop: overload triggers 503s, 503s trigger retries, retries add MORE load, which keeps the upstream tripped longer rather than letting it recover.',
      ]
    },
    {
      heading: 'Why this matters at scale: retry amplification compounds across a call chain',
      points: [
        'This effect compounds through a multi-hop call chain — if Service A calls Service B which calls Service C, and all three layers independently retry on 5xx with 3 attempts each, a single failing request at C can generate up to 9 actual requests reaching C (3 retries from B\'s own call, repeated across B\'s own 3 attempts from A) — a genuine, documented retry-storm pattern, not just a theoretical concern.',
        'The mitigations: DestinationRule\'s connection pool setting <code>http.maxRetries</code> caps the maximum CONCURRENT retries against a given upstream cluster regardless of how many individual clients are each independently retrying, acting as a global retry budget; more selectively, scoping <code>retryOn</code> to conditions that are NOT typically caused by overload (like <code>connect-failure</code> or <code>reset</code>) rather than blanket <code>5xx</code> avoids retrying directly into a circuit-breaker-induced failure in the first place.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The feedback loop: retryOn: 5xx meets an overloaded upstream',
      language: 'bash',
      code: `# DestinationRule: upstream has a tight connection pool
# (deliberately, to protect it from being overwhelmed)
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: inventory
spec:
  host: inventory
  trafficPolicy:
    connectionPool:
      tcp: { maxConnections: 50 }
      http: { http1MaxPendingRequests: 20 }

# VirtualService: client-side retry on ANY 5xx
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: inventory-client
spec:
  hosts: [inventory]
  http:
  - retries:
      attempts: 3
      retryOn: 5xx        # <-- includes the upstream's OWN
                            #     circuit-breaker 503s
    route:
    - destination: { host: inventory }

# Under real load: inventory hits its 50-connection limit,
# starts returning 503 "upstream overflow" -- each of THOSE
# 503s gets retried up to 3 more times, adding MORE connection
# attempts against the exact same already-saturated pool.`,
    },
    {
      label: 'Mitigations: maxRetries budget and narrower retryOn',
      language: 'bash',
      code: `# Mitigation 1: cap CONCURRENT retries against this upstream
# cluster, regardless of how many clients are each retrying
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: inventory
spec:
  host: inventory
  trafficPolicy:
    connectionPool:
      tcp: { maxConnections: 50 }
      http:
        http1MaxPendingRequests: 20
        maxRetries: 10      # <-- global retry budget: once 10
                              #     concurrent retries are
                              #     in flight, additional
                              #     retry attempts are refused

# Mitigation 2: scope retryOn away from overload-caused 5xx --
# retry only conditions that are NOT typically self-inflicted
# by the upstream protecting itself
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: inventory-client
spec:
  hosts: [inventory]
  http:
  - retries:
      attempts: 3
      retryOn: connect-failure,reset   # NOT blanket 5xx --
                                          # a circuit-breaker
                                          # 503 won't be retried
    route:
    - destination: { host: inventory }`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A service starts returning 503 errors under heavy load — its DestinationRule has a connection pool limit that is now being exceeded, triggering Envoy\'s own circuit-breaker "upstream overflow" response. Client VirtualServices calling it all have retryOn: 5xx configured with 3 attempts. An SRE observes that once the 503s start, the service seems to take LONGER to recover than expected, rather than shedding load and stabilizing. What\'s the most likely contributing factor, given the retry configuration?',
    hint: 'Does a client-side retryOn: 5xx distinguish between "the upstream had a real application bug" and "the upstream is deliberately refusing connections via its own circuit breaker to protect itself"?',
    solution: 'The most likely contributing factor is that retryOn: 5xx does not distinguish between an application-level error and the upstream\'s own circuit-breaker 503 (connection pool overflow) — every 503 the circuit breaker produces to shed load gets retried up to 3 more times by each client, sending MORE connection attempts at the exact upstream that just signaled it\'s overloaded. This creates a feedback loop: the circuit breaker exists specifically to shed load and recover, but the retries counteract that by continuously refilling the connection pool with new attempts, extending the time the upstream stays saturated rather than letting it drain and recover. Mitigations include setting a maxRetries connection-pool budget (capping concurrent retries against that upstream regardless of client count) and/or scoping retryOn to conditions less likely to be self-inflicted by the upstream\'s own protection mechanisms, rather than blanket 5xx.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A client-side retryOn: 5xx policy is purely beneficial — retrying any 5xx response can only help a request eventually succeed, with no downside.',
      reality: 'Per this subtopic\'s theory, retrying a 5xx that was produced by the upstream\'s OWN circuit breaker (connection-pool overflow) sends additional load at the exact moment the upstream signaled it needs LESS load — a genuine, documented feedback loop that can prolong an overload rather than help recover from it.'
    },
    {
      thought: 'DestinationRule connection-pool limits (maxConnections, http1MaxPendingRequests) and client-side retryOn policies are independent settings that don\'t meaningfully interact with each other.',
      reality: 'Per this subtopic\'s theory, they interact directly — a circuit breaker\'s own 503 responses are exactly the kind of 5xx a blanket retryOn: 5xx policy will retry, meaning the retry configuration can directly work against what the connection-pool limit was trying to achieve.'
    },
    {
      thought: 'The main page\'s general "retry amplification risk" warning (about upstream services already retrying) is the only retry-amplification concern worth knowing — retryOn: 5xx alone, without any upstream-side retries, carries no comparable risk.',
      reality: 'Per this subtopic\'s theory, retryOn: 5xx alone (with no upstream retries at all) already carries a real amplification risk specifically against an upstream protecting itself with connection-pool circuit breaking — a distinct mechanism from the multi-layer retry-amplification the main page describes.'
    }
  ];
}
