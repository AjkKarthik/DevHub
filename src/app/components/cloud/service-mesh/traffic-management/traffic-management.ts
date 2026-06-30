import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-mesh-traffic-management',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './traffic-management.html',
  styleUrl: './traffic-management.scss',
})
export class MeshTrafficManagement {
  quickRef: QuickRefItem[] = [
    { name: 'VirtualService', type: 'syntax', desc: 'Routes HTTP/gRPC traffic using match rules (URI, headers, method) to subsets or weights.' },
    { name: 'DestinationRule', type: 'syntax', desc: 'Defines subsets (label-based pod groups) and traffic policies (load balancing, TLS, connection pool).' },
    { name: 'subset', type: 'keyword', desc: 'Named group of pods within a service, defined by labels (e.g., version: v2). Used for canary routing.' },
    { name: 'HTTPMatchRequest', type: 'syntax', desc: 'Condition block within a VirtualService route — match on URI, headers, method, port, or query params.' },
    { name: 'weight', type: 'keyword', desc: 'Integer 0-100 in VirtualService route destinations — splits traffic proportionally across subsets.' },
    { name: 'timeout', type: 'keyword', desc: 'Request timeout on a VirtualService route — e.g., "5s". Overrides the default 15s Envoy timeout.' },
    { name: 'retries', type: 'keyword', desc: 'Automatic retry policy on a VirtualService route — attempts, perTryTimeout, and retryOn conditions.' },
    { name: 'HTTPRewrite', type: 'syntax', desc: 'Rewrites the URI or host before forwarding to the destination — useful for path normalisation.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'VirtualService: Routing Rules',
      points: [
        'A VirtualService is Istio\'s routing configuration resource. It applies to traffic addressed to a Kubernetes Service (or ServiceEntry for external hosts) and lets you define fine-grained routing rules.',
        'VirtualService `hosts` field: the service name(s) the rules apply to. Can be a Kubernetes service name, a DNS name, or `*` for a catch-all in a Gateway context.',
        'VirtualService `http` field: ordered list of HTTPRoute entries. The first matching rule wins — order matters. If no rule matches, Envoy falls through to the default behaviour.',
        'Match conditions in a route include: `uri` (prefix/exact/regex), `headers` (exact/prefix/regex), `method`, `queryParams`, `port`, `sourceLabels`, and `gateways`. Combine multiple conditions in one match (AND), or list multiple match blocks (OR).',
        'A VirtualService MUST be paired with a DestinationRule if you reference subsets — without the DestinationRule defining the subset, Envoy silently drops traffic (returns 503 to the client).',
        'VirtualService can be bound to a Gateway (for north-south traffic) or left gateway-less (for east-west mesh traffic). The `gateways` field defaults to `mesh` (applies to all sidecar proxies).',
      ],
    },
    {
      heading: 'DestinationRule: Subsets and Policies',
      points: [
        'DestinationRule defines traffic policies for a specific destination service: subsets, load balancing algorithm, connection pool settings, and TLS mode.',
        'Subsets map labels on Pods to named groups. Example: subset `v1` selects `{ version: v1 }` pods, subset `v2` selects `{ version: v2 }`. VirtualService routes traffic to these names.',
        'TrafficPolicy at the host level applies to all subsets unless overridden. TrafficPolicy at the subset level overrides for that subset only — useful for A/B testing different connection pool settings.',
        'Load balancing algorithms: `ROUND_ROBIN` (default), `LEAST_CONN` (fewest active requests — better for long-lived connections), `RANDOM`, `PASSTHROUGH` (no load balancing, pass to Kubernetes endpoint directly).',
        'Connection pool settings: `http.http1MaxPendingRequests`, `http.http2MaxRequests`, `tcp.connectTimeout`, `tcp.maxConnections`. These are circuit breaker inputs — exceeded limits trigger 503 upstream overflow.',
        'TLS mode in DestinationRule: `DISABLE`, `SIMPLE` (one-way TLS), `MUTUAL` (mTLS with client cert), `ISTIO_MUTUAL` (use Istio\'s automatically provisioned certs). `ISTIO_MUTUAL` is the default for mesh traffic when PeerAuthentication is STRICT.',
      ],
    },
    {
      heading: 'Canary Deployments with Traffic Splitting',
      points: [
        'Canary pattern: deploy v2 alongside v1, then shift traffic incrementally. VirtualService weighted routing is Istio\'s mechanism — `weight: 90` to v1 subset + `weight: 10` to v2 subset.',
        'Weights in a VirtualService destination list must sum to 100. If they do not, Istio rejects the configuration at apply time.',
        'Header-based routing for testing: route 100% of traffic where `x-canary: true` header is set to the v2 subset, and everything else to v1 — lets QA test in production without affecting real users.',
        'Blue-green switchover: one VirtualService route, change `weight: 100` from `v1` to `v2`. Instant cut-over with easy rollback (change the weight back).',
        'Flagger integrates with Istio VirtualService weights to automate canary promotion — it shifts weight based on success rate and latency metrics from Prometheus.',
        'Traffic splitting at the mesh level is independent of replica count — you can shift 10% traffic to v2 even if v2 has only one replica. This is more precise than Kubernetes Deployment rollouts.',
      ],
    },
    {
      heading: 'Timeouts and Retries',
      points: [
        'Timeouts in VirtualService: `timeout: 5s` on an HTTPRoute applies to the entire request-response cycle. If the upstream does not respond within 5s, Envoy returns 504 to the client.',
        'Retries: `retries.attempts` (how many times to retry), `retries.perTryTimeout` (timeout per individual attempt — must be shorter than the overall timeout), `retries.retryOn` (comma-separated Envoy retry conditions).',
        'Common `retryOn` values: `gateway-error` (502/503/504), `5xx` (any 5xx response), `retriable-4xx` (408 request timeout), `connect-failure` (upstream connection failed), `reset` (TCP reset).',
        'Retry amplification risk: if upstream already handles retries and you add Istio retries, a single client request can generate (n×m) upstream requests. Coordinate retry policies end-to-end.',
        'Timeout + retry interaction: `timeout` is the TOTAL budget for all attempts. With `timeout: 10s`, `retries.attempts: 3`, `perTryTimeout: 3s` — you get 3 attempts of 3s each, but the whole operation must complete within 10s.',
        'Fault injection (testing): VirtualService can inject artificial delays (`delay.fixedDelay`) or abort responses (`abort.httpStatus`) to test resilience — essential for chaos engineering without deploying broken code.',
      ],
    },
    {
      heading: 'Header Manipulation and Rewrites',
      points: [
        'VirtualService `headers` field (at the route level or destination level) adds, removes, or sets request/response headers before forwarding.',
        'Add request header: `request.add["x-forwarded-region"] = us-east-1`. Useful for passing context to services that need to know which region handled the request.',
        'HTTPRewrite: `uri.prefix: /api/v2` replaces the matched URI prefix before forwarding. If the client sends `/api/v1/users`, and the match is `/api/v1`, the rewrite to `/api/v2` transforms it to `/api/v2/users`.',
        'HTTPRedirect: instead of rewriting, send a 301/302 to the client. Useful for migrating API paths without code changes: `redirect.uri: /new-path`, `redirect.redirectCode: 301`.',
        'Authority rewrite (`rewrite.authority`): changes the Host header sent to the upstream — useful when the upstream expects a different hostname than the client used.',
        'Mirror: `mirror` field sends a copy of all traffic to a secondary destination. The mirror response is discarded — used for shadowing production traffic to a test cluster without affecting users.',
      ],
    },
    {
      heading: 'Traffic Mirroring and Fault Injection',
      points: [
        'Traffic mirroring (shadowing): a VirtualService route sends a copy of each request to the mirror destination. The primary route responds normally; the mirror response is ignored.',
        'Use mirroring to test new service versions with real production traffic without any risk — the shadow receives real requests, processes them, but the results are discarded. `mirrorPercent` controls what fraction to shadow (0-100).',
        'Fault injection: VirtualService can inject `delay` (fixed or percentage-based latency) or `abort` (return specific HTTP status codes) — used for resilience testing (chaos engineering).',
        'Delay example: inject a 5-second delay on 50% of requests to simulate a slow downstream service. Verify that your timeout policy correctly times out and retries.',
        'Abort example: inject `httpStatus: 503` on 100% of requests to a dependency to test your fallback behaviour — does the upstream service degrade gracefully?',
        'Fault injection is namespace-scoped via VirtualService — you can inject faults in staging without affecting production, or target specific user groups via header-based match conditions.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Canary Routing',
      language: 'bash',
      code: `# DestinationRule: define v1 and v2 subsets
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: checkout
spec:
  host: checkout
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
---
# VirtualService: route 90% to v1, 10% to v2
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: checkout
spec:
  hosts:
  - checkout
  http:
  - route:
    - destination:
        host: checkout
        subset: v1
      weight: 90
    - destination:
        host: checkout
        subset: v2
      weight: 10
EOF`,
    },
    {
      label: 'Header Routing & Rewrite',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: api-routing
spec:
  hosts:
  - api
  http:
  # Route internal QA traffic to v2
  - match:
    - headers:
        x-env:
          exact: canary
    route:
    - destination:
        host: api
        subset: v2
    headers:
      request:
        add:
          x-routed-by: istio-canary
  # Rewrite /api/v1 to /api/v2 for legacy clients
  - match:
    - uri:
        prefix: /api/v1
    rewrite:
      uri: /api/v2
    route:
    - destination:
        host: api
        subset: v2
  # Default: v1
  - route:
    - destination:
        host: api
        subset: v1
EOF`,
    },
    {
      label: 'Timeouts & Retries',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: payment
spec:
  hosts:
  - payment
  http:
  - timeout: 10s          # Total budget across all retry attempts
    retries:
      attempts: 3
      perTryTimeout: 3s   # Each attempt must complete in 3s
      retryOn: gateway-error,connect-failure,5xx
    route:
    - destination:
        host: payment
        subset: stable
EOF`,
    },
    {
      label: 'Fault Injection & Mirror',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: inventory
spec:
  hosts:
  - inventory
  http:
  # Inject 5s delay on 25% of requests (chaos testing)
  - fault:
      delay:
        percentage:
          value: 25
        fixedDelay: 5s
    route:
    - destination:
        host: inventory
  # Mirror 10% of traffic to shadow service
  - route:
    - destination:
        host: inventory
    mirror:
      host: inventory-shadow
    mirrorPercentage:
      value: 10
EOF`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'VirtualService subset with no matching DestinationRule',
      wrong: `# VirtualService references "v2" subset
destination:
  host: checkout
  subset: v2   # But no DestinationRule defines this subset → 503`,
      right: `# Always define a DestinationRule with matching subset labels
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: checkout
spec:
  host: checkout
  subsets:
  - name: v2
    labels:
      version: v2   # Pods must have this label!`,
      explanation: 'If a VirtualService routes to a subset that is not defined in a DestinationRule, Envoy silently returns 503 to the client. The error is not obvious — always create the DestinationRule before or at the same time as the VirtualService.',
    },
    {
      title: 'VirtualService weights that do not sum to 100',
      wrong: `route:
- destination:
    host: api
    subset: v1
  weight: 90
- destination:
    host: api
    subset: v2
  weight: 15   # 90 + 15 = 105 → rejected by Istio`,
      right: `route:
- destination:
    host: api
    subset: v1
  weight: 85
- destination:
    host: api
    subset: v2
  weight: 15   # 85 + 15 = 100 → valid`,
      explanation: 'Istio validates that destination weights in a route sum to exactly 100. If they do not, the VirtualService is rejected with a validation error. Always double-check that your weights add up before applying.',
    },
    {
      title: 'Setting timeout without accounting for retry perTryTimeout',
      wrong: `timeout: 5s
retries:
  attempts: 3
  perTryTimeout: 3s  # 3 attempts × 3s = 9s → exceeds 5s timeout
  # First 2 retries use their full 3s; 3rd attempt is cut off at 5s`,
      right: `timeout: 10s          # Must be > (attempts × perTryTimeout)
retries:
  attempts: 3
  perTryTimeout: 3s   # 3 × 3 = 9s fits within 10s total`,
      explanation: 'The `timeout` field is the total budget for all retry attempts. If `timeout < attempts × perTryTimeout`, later retry attempts get cut off early. Set `timeout` to comfortably exceed the maximum time all retry attempts could take.',
    },
    {
      title: 'Using match conditions in wrong order (specific before general)',
      wrong: `http:
- route:           # Catch-all first — this always matches!
  - destination:
      host: api
      subset: v1
- match:           # This rule is NEVER evaluated
  - headers:
      x-canary: { exact: "true" }
  route:
  - destination:
      host: api
      subset: v2`,
      right: `http:
- match:           # Specific match first
  - headers:
      x-canary: { exact: "true" }
  route:
  - destination:
      host: api
      subset: v2
- route:           # Default catch-all last
  - destination:
      host: api
      subset: v1`,
      explanation: 'VirtualService HTTP routes are evaluated in order — first match wins. A catch-all route (no match conditions) at the top of the list will prevent all subsequent specific matches from ever being evaluated. Always put specific matches before the default route.',
    },
    {
      title: 'Forgetting that VirtualService only applies to meshed traffic',
      wrong: `# VirtualService with retry rules but service has no sidecars
# → retries are never applied because there is no Envoy to enforce them`,
      right: `# Verify injection before expecting VirtualService to take effect
kubectl get pods -n production
# All pods must show 2/2 READY (app + istio-proxy)
# Then VirtualService timeout/retry/routing rules are enforced by sidecars`,
      explanation: 'VirtualService rules are enforced by the Envoy sidecar. If the client pod (making the request) does not have a sidecar, the VirtualService rules are invisible — the traffic goes directly to the service without retries, timeouts, or routing logic.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Multi-Match VirtualService',
    language: 'typescript',
    description: `Design a VirtualService for the "orders" service with these routing rules:
1. Requests with header "x-user-tier: premium" → route to "orders" subset "premium" (100%)
2. Requests to URI prefix "/orders/beta" → route to "orders" subset "beta" (100%), rewrite URI to "/orders"
3. All other requests → route 80% to "orders" subset "stable", 20% to "orders" subset "canary"

Add a 5-second timeout and 2 retries (retryOn: 5xx) on all routes.

Return the VirtualService YAML as a string.`,
    hints: [
      'HTTP routes are evaluated in order — specific matches before the default',
      'Timeout and retries can be at the route level',
      'rewrite.uri replaces the matched prefix in the URI',
      'Weights must sum to 100 in the default route',
    ],
    starterCode: `function getVirtualService(): string {
  return \`# Your VirtualService YAML here\`;
}
console.log(getVirtualService());`,
    solution: `function getVirtualService(): string {
  return \`apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: orders
spec:
  hosts:
  - orders
  http:
  - match:
    - headers:
        x-user-tier:
          exact: premium
    timeout: 5s
    retries:
      attempts: 2
      retryOn: 5xx
    route:
    - destination:
        host: orders
        subset: premium
      weight: 100
  - match:
    - uri:
        prefix: /orders/beta
    rewrite:
      uri: /orders
    timeout: 5s
    retries:
      attempts: 2
      retryOn: 5xx
    route:
    - destination:
        host: orders
        subset: beta
      weight: 100
  - timeout: 5s
    retries:
      attempts: 2
      retryOn: 5xx
    route:
    - destination:
        host: orders
        subset: stable
      weight: 80
    - destination:
        host: orders
        subset: canary
      weight: 20\`;
}
console.log(getVirtualService());`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What happens if a VirtualService references a subset not defined in a DestinationRule?',
      options: ['Traffic falls back to the Kubernetes Service default routing', 'Istio returns a 404 to the client', 'Envoy returns 503 to the client', 'Istio rejects the VirtualService at apply time'],
      answer: 2,
      explanation: 'If a VirtualService routes to a subset that has no matching DestinationRule definition, Envoy cannot resolve the subset and returns 503 (Service Unavailable) to the client. The VirtualService itself is accepted by Istio — the error only surfaces at request time.',
    },
    {
      q: 'What must be true about VirtualService route weights in a single route block?',
      options: ['Weights must be between 0 and 1', 'Weights must sum to exactly 100', 'Weights are optional if only one destination is specified', 'Weights are relative and auto-normalised by Istio'],
      answer: 1,
      explanation: 'When multiple destinations are specified in a single route, their weights must sum to exactly 100. Istio validates this at apply time and rejects the VirtualService if weights do not sum to 100.',
    },
    {
      q: 'In VirtualService HTTP routes, which rule is evaluated first?',
      options: ['The most specific match (longest URI prefix)', 'Routes with the highest weight', 'The first route in the list', 'Routes without a match condition (catch-all)'],
      answer: 2,
      explanation: 'VirtualService HTTP routes are evaluated in list order — the first matching rule wins. This means catch-all routes (no match conditions) must always be placed last in the list, otherwise they prevent all subsequent specific rules from being evaluated.',
    },
    {
      q: 'What does `mirrorPercentage: { value: 10 }` in a VirtualService do?',
      options: ['Routes 10% of traffic to the mirror and 90% to the primary destination', 'Sends a copy of 10% of requests to the mirror; primary route handles 100% normally', 'Limits the mirror destination to 10% of its normal capacity', 'Retries 10% of failed requests against the mirror service'],
      answer: 1,
      explanation: 'Traffic mirroring (shadowing) copies a percentage of requests to a mirror destination while the primary route handles 100% of traffic normally. The mirror response is discarded. This allows safe testing with real production traffic — clients are never aware of the shadow.',
    },
    {
      q: 'How does `perTryTimeout` relate to the top-level `timeout` in a VirtualService retry policy?',
      options: ['perTryTimeout is the total timeout; the top-level timeout is ignored when retries are configured', 'The top-level timeout is the budget per attempt; perTryTimeout is the total across all attempts', 'perTryTimeout limits each individual retry attempt; the top-level timeout is the total budget across all attempts', 'They are identical settings; only one is needed'],
      answer: 2,
      explanation: '`perTryTimeout` caps each individual retry attempt. The top-level `timeout` is the total budget for the entire operation including all retry attempts. If `timeout < attempts × perTryTimeout`, later retries will be cut off. Set `timeout` to comfortably accommodate all possible retries.',
    },
    {
      q: 'What does fault injection with `abort.httpStatus: 503` in a VirtualService do?',
      options: ['Blocks traffic to the destination service entirely', 'Returns a 503 response to clients without ever reaching the upstream service', 'Marks the destination service as unhealthy in Envoy\'s load balancer', 'Triggers the retry policy to kick in immediately'],
      answer: 1,
      explanation: 'Fault injection with `abort` makes Envoy return the specified HTTP status code directly to the client, without forwarding the request to the upstream service. This is used for chaos engineering — testing how your application behaves when a dependency returns errors.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between VirtualService and Kubernetes Service routing?',
      a: 'Kubernetes Service routing is simple round-robin over healthy Endpoints, based on kube-proxy. It has no concept of header matching, weights between subsets, retries, timeouts, or fault injection. <strong>VirtualService</strong> is applied at the Envoy sidecar layer and provides: <ul><li>Weighted traffic splitting between labeled pod subsets</li><li>Header/URI/method-based routing</li><li>Automatic retries and timeouts per route</li><li>Fault injection for chaos testing</li><li>Traffic mirroring</li></ul>VirtualService coexists with Kubernetes Services — it intercepts traffic addressed to a Service and applies its rules before forwarding to the actual pod endpoints.',
    },
    {
      q: 'Can a VirtualService apply to both north-south (ingress) and east-west (mesh) traffic?',
      a: 'Yes. The <code>gateways</code> field in a VirtualService controls scope: <ul><li><strong>Omitted or set to <code>mesh</code></strong>: applies to all sidecar proxies (east-west mesh traffic)</li><li><strong>Set to a Gateway name</strong>: applies to traffic entering through that Gateway (north-south ingress)</li><li><strong>Both listed</strong>: applies to both — the same routing rules handle both external and internal traffic</li></ul>Typically, you separate ingress and mesh VirtualServices — ingress VS handles path routing from Gateway, mesh VS handles service-to-service routing with subsets and retries.',
    },
    {
      q: 'How do you implement a dark launch / traffic shadowing with Istio?',
      a: 'Use the <code>mirror</code> and <code>mirrorPercentage</code> fields in a VirtualService: <ol><li>Deploy the new version as a separate Kubernetes Service (e.g., <code>api-shadow</code>)</li><li>Add a <code>mirror</code> block pointing to the shadow service</li><li>Set <code>mirrorPercentage.value</code> to the fraction to shadow (e.g., 10)</li></ol>Envoy sends the primary response to the client normally and asynchronously fires a copy of the request to the shadow. The shadow response is discarded. This lets you validate the new version processes real production traffic correctly before routing real users to it — with zero risk.',
    },
    {
      q: 'What is the `sourceLabels` match condition in VirtualService used for?',
      a: '<code>sourceLabels</code> matches requests based on labels on the <em>source pod</em> (the client making the request). This enables routing decisions based on who is calling, not just what they are requesting. Examples: <ul><li>Route traffic from <code>{ app: mobile-api }</code> pods to a mobile-optimised backend subset</li><li>Route traffic from <code>{ env: staging }</code> pods to a staging subset of the destination</li><li>Apply different retry/timeout policies based on which service is the caller</li></ul>sourceLabels is particularly powerful for internal service-to-service routing where you control all callers.',
    },
    {
      q: 'How do DestinationRule traffic policies interact with connection pooling and circuit breaking?',
      a: 'DestinationRule\'s <code>trafficPolicy.connectionPool</code> settings directly control Envoy\'s circuit breaker behaviour: <ul><li><code>http.http1MaxPendingRequests</code>: max queued HTTP/1.1 requests — exceeded → 503 "upstream overflow"</li><li><code>http.http2MaxRequests</code>: max concurrent HTTP/2 requests — exceeded → 503</li><li><code>tcp.maxConnections</code>: max TCP connections to the upstream — exceeded → new connections are rejected</li></ul>When a circuit breaker trips, Envoy returns 503 immediately without connecting to the upstream — this is the fast-fail mechanism that prevents cascading failures. The <code>outlierDetection</code> policy is a companion — it ejects pods that return consecutive 5xx errors from the load balancer pool.',
    },
  { q: 'How do you implement canary deployments using Istio traffic management?', a: 'Deploy the canary version as a separate Kubernetes Deployment with a distinct version label alongside the stable deployment. Create a DestinationRule defining two subsets: stable matching the stable version label and canary matching the canary version label. Create a VirtualService that splits traffic between subsets using weight fields: for example, 90 to stable and 10 to canary. Gradually shift traffic by updating the weights: 80/20, then 50/50, then 100/0. This allows precise traffic shifting without scaling pod counts, unlike Kubernetes native deployments that tie traffic proportion to replica count.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'VirtualService defines routing rules (header match, weights, retries, timeouts). DestinationRule defines subsets and traffic policies. Together they enable canary releases, header-based routing, fault injection, and traffic mirroring.',
    mustKnow: [
      'VirtualService: routes traffic by host, HTTP match (header/URI/method/weight), evaluated in list order',
      'DestinationRule: defines subsets by pod labels; sets LB algorithm, connection pool, TLS mode',
      'Weights must sum to 100 in a route; subset must exist in DestinationRule or Envoy returns 503',
      'timeout: total budget; perTryTimeout: per attempt; retryOn: 5xx, gateway-error, connect-failure',
      'fault.delay: inject artificial latency; fault.abort: inject HTTP error responses for chaos testing',
      'mirror + mirrorPercentage: shadow traffic to a second service; primary response is unaffected',
      'gateways field: mesh (default, east-west) vs Gateway name (north-south ingress)',
    ],
    interviewFocus: [
      'What happens when a VirtualService subset has no matching DestinationRule? (503, silent failure)',
      'How does traffic mirroring work and why is it safe for production? (shadow, primary unaffected)',
      'Canary vs blue-green with VirtualService — weights vs 0/100 flip',
      'Timeout + retries interaction — total budget vs perTryTimeout',
      'How do you test resilience without deploying broken code? (fault injection)',
    ],
  };
}
