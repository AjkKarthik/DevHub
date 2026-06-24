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
  selector: 'app-mesh-resilience',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './resilience.html',
  styleUrl: './resilience.scss',
})
export class MeshResilience {
  quickRef: QuickRefItem[] = [
    { name: 'outlierDetection', type: 'syntax', desc: 'DestinationRule policy that ejects unhealthy pods from the load balancer pool based on consecutive errors.' },
    { name: 'consecutiveGatewayErrors', type: 'keyword', desc: 'Number of consecutive 5xx responses before a pod is ejected (outlierDetection).' },
    { name: 'ejectionSweepInterval', type: 'keyword', desc: 'How often Envoy scans for pods to eject or restore. Default 10s.' },
    { name: 'baseEjectionTime', type: 'keyword', desc: 'Minimum ejection duration — doubles with each ejection up to maxEjectionPercent.' },
    { name: 'connectionPool', type: 'syntax', desc: 'DestinationRule setting that caps pending requests, concurrent requests, and TCP connections (circuit breaker).' },
    { name: 'retries', type: 'syntax', desc: 'VirtualService retry policy — attempts, perTryTimeout, retryOn conditions.' },
    { name: 'fault.delay', type: 'keyword', desc: 'VirtualService fault injection: adds artificial latency to test timeout/retry policies.' },
    { name: 'PeerAuthentication', type: 'syntax', desc: 'Controls mTLS mode per namespace or workload: PERMISSIVE, STRICT, or DISABLE.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Resilience Patterns in a Service Mesh',
      points: [
        'A service mesh provides resilience at the infrastructure layer — independently of application code. This means retries, timeouts, and circuit breakers apply to ALL services without each team implementing them.',
        'The four core resilience patterns in Istio: (1) Retries — automatically re-attempt failed requests. (2) Timeouts — bound the worst-case wait time. (3) Circuit breaking — stop sending to unhealthy upstreams. (4) Outlier detection — eject bad pods from the load balancer pool.',
        'Retries and timeouts are configured in VirtualService (per route). Circuit breaker settings (connection pool limits) and outlier detection are configured in DestinationRule (per host).',
        'The mesh handles partial failures — if one pod in a 10-pod service is returning 500s, outlier detection ejects it and Envoy stops sending traffic to it. The application code is completely unaware.',
        'Important: mesh-level resilience does NOT replace application-level resilience. The mesh handles network-level failures. Application-level failures (bad data, business logic errors, timeouts in downstream queues) still need application-side handling.',
        'Resilience patterns must be coordinated end-to-end — if both the app and the mesh retry, a single client request can generate n×m upstream calls. Agree on one retry layer per call boundary.',
      ],
    },
    {
      heading: 'Circuit Breaking with connectionPool',
      points: [
        'Circuit breaking in Istio is threshold-based: when a pod\'s pending requests or connections exceed a configured limit, new requests are immediately rejected with 503 (Overflow) instead of queuing.',
        '`connectionPool.http.http1MaxPendingRequests`: max HTTP/1.1 requests waiting in the queue. If this is exceeded, Envoy returns 503 immediately — fast-fail instead of slow pile-up.',
        '`connectionPool.http.http2MaxRequests`: max concurrent in-flight HTTP/2 streams. Exceeded → 503 Upstream Overflow.',
        '`connectionPool.tcp.maxConnections`: maximum TCP connections to the upstream host. Exceeded → connection refused.',
        '`connectionPool.http.maxRequestsPerConnection`: limits connection reuse. Set to 1 to disable keep-alive (useful for services with hot-path connection reuse issues).',
        'The upstream_rq_pending_overflow metric in Envoy tracks how often circuit breaking trips — monitor this in Prometheus to tune your thresholds or identify overwhelmed services.',
      ],
    },
    {
      heading: 'Outlier Detection — Health-Based Ejection',
      points: [
        'Outlier detection is Envoy\'s passive health check — it monitors actual traffic responses from each pod and ejects pods that are returning too many errors.',
        '`consecutiveGatewayErrors`: eject a pod after N consecutive 5xx responses. `consecutiveLocalOriginFailures`: eject after N local origin failures (connection refused, reset, timeout).',
        '`interval`: how often Envoy analyses each host for ejection candidates. `baseEjectionTime`: minimum time a pod stays ejected. After the ejection duration, Envoy probes the pod with a single request — if healthy, it is restored.',
        '`maxEjectionPercent`: safety valve — even if many pods are unhealthy, never eject more than this percentage. Default 10%. Prevents complete pool drainage.',
        'Ejection duration increases exponentially with each ejection: first ejection = baseEjectionTime, second = 2×, third = 3×, etc. Pods that keep misbehaving stay ejected longer.',
        'Combine outlier detection with connection pool limits for full circuit-breaker behaviour: connection pool limits handle overload (fast-fail at capacity), outlier detection handles quality (eject bad actors).',
      ],
    },
    {
      heading: 'Retry Strategies',
      points: [
        'Retries in VirtualService are applied by the CLIENT sidecar (the one sending the request). When a retry is needed, the client Envoy retries to a different endpoint selected by the load balancer.',
        'Common `retryOn` conditions: `5xx` (any 5xx response), `gateway-error` (502/503/504 specifically), `connect-failure` (failed to connect), `retriable-4xx` (408 Request Timeout), `reset` (TCP RST).',
        'idempotent requests (GET, DELETE with no side effects, PUT) are generally safe to retry. POST or PATCH requests that create or modify state must be carefully evaluated — retrying them can create duplicates.',
        'Hedged requests: Istio does not natively support hedging (sending to multiple backends simultaneously and using the fastest response), but the retry mechanism achieves a similar effect for failed requests.',
        '`retryRemoteLocalities`: if your mesh spans multiple zones, enables Envoy to retry on a pod in a different locality (zone/region). Useful for zone-level partial failures.',
        'Global retry policies via EnvoyFilter: if you want the same retry policy on every service, you can apply it globally via an EnvoyFilter rather than per-VirtualService. Use carefully — global retries amplify load.',
      ],
    },
    {
      heading: 'Timeout Hierarchies',
      points: [
        'Timeouts in Istio have a hierarchy: VirtualService route timeout (enforced by Envoy) overrides the Envoy default (no timeout, or whatever the upstream sets).',
        'The default Envoy request timeout is 15 seconds for HTTP. Without a VirtualService timeout, requests can hang for up to 15 seconds before timing out.',
        'End-to-end timeout chain: the client has a timeout, which must be LARGER than the server\'s VirtualService timeout, which must be LARGER than (retries × perTryTimeout). Violations cause confusing "connection reset" errors.',
        'gRPC has its own deadline mechanism (passed as `grpc-timeout` header). Istio respects this: if the gRPC deadline is shorter than the VirtualService timeout, the request times out at the gRPC deadline.',
        '`request.timeout` in PeerAuthentication and DestinationRule do NOT configure request timeouts — only VirtualService route-level `timeout` does for HTTP. This is a common point of confusion.',
        'Timeout debugging: `istioctl proxy-config listener <pod>` shows the active timeout for each listener. `istioctl proxy-config route <pod>` shows route-level timeouts. Use these to verify your VirtualService timeout is being applied.',
      ],
    },
    {
      heading: 'Testing Resilience with Fault Injection',
      points: [
        'Fault injection is the controlled way to test resilience — inject failures into specific routes without modifying application code or deploying broken services.',
        'Delay injection: `fault.delay.percentage.value: 100; fault.delay.fixedDelay: 5s` — every request to this route experiences a 5-second delay. Test: does your timeout fire? Does the calling service handle the degradation gracefully?',
        'Abort injection: `fault.abort.percentage.value: 50; fault.abort.httpStatus: 503` — 50% of requests receive a 503. Test: does your retry policy kick in? Does the circuit breaker trip after enough failures?',
        'Staged testing: inject on a single downstream dependency of the service under test (not on the service itself). This isolates the failure mode — "what happens when payment-service is slow?"',
        'Fault injection is orthogonal to retries — if you inject an abort on the same VirtualService that has a retry policy, the retry fires against the fault-injected route. Set `retryOn: 5xx` and inject 503s to test retry end-to-end.',
        'Remove fault injection before going to production (CI validation step). Use namespace-scoped VirtualService so staging faults do not leak to production if misconfigured.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Circuit Breaker',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: payment-cb
spec:
  host: payment
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100           # Max TCP connections total
      http:
        http1MaxPendingRequests: 50   # Max queued HTTP/1.1 requests
        http2MaxRequests: 200         # Max concurrent HTTP/2 streams
        maxRequestsPerConnection: 10  # Reuse each connection max 10 times
    outlierDetection:
      consecutiveGatewayErrors: 5    # Eject after 5 consecutive 5xx
      interval: 10s                  # Check every 10 seconds
      baseEjectionTime: 30s          # Eject for 30s minimum
      maxEjectionPercent: 50         # Never eject more than 50% of pods
      minHealthPercent: 30           # Stop ejecting if < 30% pods healthy
EOF`,
    },
    {
      label: 'Retries & Timeouts',
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
  - timeout: 10s            # Total budget including retries
    retries:
      attempts: 3
      perTryTimeout: 3s     # Each attempt has 3s
      retryOn: gateway-error,connect-failure,5xx,retriable-4xx
    route:
    - destination:
        host: inventory
        subset: stable
EOF`,
    },
    {
      label: 'Fault Injection Testing',
      language: 'bash',
      code: `# Test 1: Delay injection — test timeout handling
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: db-service
spec:
  hosts:
  - db-service
  http:
  - fault:
      delay:
        percentage:
          value: 100      # 100% of requests
        fixedDelay: 8s    # 8-second delay
    route:
    - destination:
        host: db-service
EOF

# Test 2: Abort injection — test error handling
kubectl patch virtualservice db-service --type=merge -p '{
  "spec": {
    "http": [{
      "fault": {
        "abort": {
          "percentage": { "value": 30 },
          "httpStatus": 503
        }
      },
      "route": [{ "destination": { "host": "db-service" } }]
    }]
  }
}'

# Remove fault injection when done
kubectl delete virtualservice db-service`,
    },
    {
      label: 'Observing Circuit Breaker',
      language: 'bash',
      code: `# Check Envoy circuit breaker stats for a pod
kubectl exec deploy/api -c istio-proxy -- \\
  pilot-agent request GET stats | grep -E "upstream_rq_pending_overflow|upstream_cx_overflow"

# Output when circuit breaker is tripping:
# cluster.outbound|8080||payment.production.svc.cluster.local.upstream_rq_pending_overflow: 42
# cluster.outbound|8080||payment.production.svc.cluster.local.upstream_cx_overflow: 7

# Check outlier detection ejections
kubectl exec deploy/api -c istio-proxy -- \\
  pilot-agent request GET stats | grep ejections

# Check which pods are currently ejected
istioctl proxy-config endpoints deploy/api | grep "payment" | grep -v HEALTHY

# Dashboard: run istioctl dashboard envoy to inspect circuit breaker visually
istioctl dashboard envoy deploy/api`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Retrying non-idempotent requests (POST/PATCH)',
      wrong: `# POST endpoint creates an order — retrying on 503 creates duplicate orders
retries:
  attempts: 3
  retryOn: 5xx   # Retries all 5xx including 500 on a POST endpoint`,
      right: `# Only retry on network-level failures for POST, not application 5xx
retries:
  attempts: 3
  retryOn: connect-failure,retriable-4xx   # Never retry on 5xx for non-idempotent ops
# Or: implement idempotency keys in the API and then retrying on 5xx is safe`,
      explanation: 'Retrying POST or PATCH requests on 5xx responses can create duplicates if the server processed the request but crashed before responding. For non-idempotent operations, only retry on `connect-failure` (never reached the server) or add idempotency keys to the API to make retries safe.',
    },
    {
      title: 'Setting maxEjectionPercent too low — draining the pool',
      wrong: `outlierDetection:
  consecutiveGatewayErrors: 3
  maxEjectionPercent: 100   # All pods can be ejected → complete service outage`,
      right: `outlierDetection:
  consecutiveGatewayErrors: 5
  maxEjectionPercent: 50    # Never eject more than half the pool
  minHealthPercent: 30      # Stop ejecting if fewer than 30% pods healthy`,
      explanation: 'With `maxEjectionPercent: 100`, a cascading failure can eject every pod — turning a partial failure into a complete service outage. Always set `maxEjectionPercent` to a safe fraction (50% is common) and add `minHealthPercent` as a final safety valve.',
    },
    {
      title: 'Layered retries amplifying load',
      wrong: `# App: 3 retries on failure
# Istio VirtualService: 3 retries on failure
# Result: 1 client request → up to 9 upstream requests (3 app × 3 Istio)`,
      right: `# Agree on ONE retry layer per call boundary
# Option A: Istio handles retries, app does not retry
# Option B: App handles retries, set VirtualService retries.attempts: 1
# Document the retry ownership in your runbook`,
      explanation: 'Each retry layer multiplies the load on the upstream. Three layers of 3 retries = 27 upstream requests per client request. Coordinate retry ownership: pick one layer per service boundary and disable retries in the other. Application retries and mesh retries should not both be active for the same call.',
    },
    {
      title: 'Applying outlierDetection without connection pool limits',
      wrong: `# Only outlierDetection — ejects unhealthy pods but allows unbounded load
outlierDetection:
  consecutiveGatewayErrors: 5
# Missing connectionPool limits → ejecting pods makes surviving pods worse`,
      right: `trafficPolicy:
  connectionPool:
    http:
      http1MaxPendingRequests: 50    # Fast-fail before overloading remaining pods
  outlierDetection:
    consecutiveGatewayErrors: 5     # Eject after confirmed failures`,
      explanation: 'Outlier detection ejects bad pods, which concentrates load on the remaining healthy pods. Without connection pool limits, this can overload the healthy pods and trigger more ejections. Always pair outlierDetection with connectionPool to cap the load on surviving pods.',
    },
    {
      title: 'Leaving fault injection active in production',
      wrong: `# Forgot to remove fault injection after testing
fault:
  abort:
    percentage:
      value: 100
    httpStatus: 503   # 100% of production traffic returning 503`,
      right: `# Always use a namespace-scoped VirtualService for fault injection
# and clean up immediately after testing
kubectl delete virtualservice fault-test-vs -n staging
# Or: use labels to mark test resources for automated cleanup`,
      explanation: 'Fault injection is only valid during testing. If left in place, it actively breaks production traffic. Always scope fault injection VirtualServices to non-production namespaces, name them clearly as test resources, and have a cleanup step in your testing runbook or CI pipeline.',
    },
  ];

  challenge: Challenge = {
    title: 'Configure Comprehensive Resilience',
    language: 'typescript',
    description: `Configure resilience for the "catalog" service with these requirements:
- Circuit breaker: max 30 pending requests, max 100 concurrent requests, max 50 TCP connections
- Outlier detection: eject after 3 consecutive gateway errors, 15s interval, 30s base ejection, max 40% ejected
- VirtualService: 2 retry attempts, 2s per-try timeout, total 5s timeout, retry on gateway-error and connect-failure

Return both the DestinationRule and VirtualService YAML joined with "---".`,
    hints: [
      'DestinationRule holds connectionPool and outlierDetection',
      'VirtualService holds timeout and retries',
      'connectionPool.http.http1MaxPendingRequests for pending requests',
      'outlierDetection.consecutiveGatewayErrors for the ejection trigger',
    ],
    starterCode: `function getResilienceConfig(): string {
  const dr = \`# DestinationRule here\`;
  const vs = \`# VirtualService here\`;
  return dr + '\\n---\\n' + vs;
}
console.log(getResilienceConfig());`,
    solution: `function getResilienceConfig(): string {
  const dr = \`apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: catalog
spec:
  host: catalog
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 50
      http:
        http1MaxPendingRequests: 30
        http2MaxRequests: 100
    outlierDetection:
      consecutiveGatewayErrors: 3
      interval: 15s
      baseEjectionTime: 30s
      maxEjectionPercent: 40\`;

  const vs = \`apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: catalog
spec:
  hosts:
  - catalog
  http:
  - timeout: 5s
    retries:
      attempts: 2
      perTryTimeout: 2s
      retryOn: gateway-error,connect-failure
    route:
    - destination:
        host: catalog\`;

  return dr + '\\n---\\n' + vs;
}
console.log(getResilienceConfig());`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does `consecutiveGatewayErrors: 5` in outlierDetection mean?',
      options: ['Eject a pod after 5 total errors across the whole service', 'Eject a pod after 5 consecutive 5xx responses from that specific pod', 'Enable circuit breaking after 5% error rate', 'Retry failed requests 5 times before ejecting'],
      answer: 1,
      explanation: '`consecutiveGatewayErrors` tracks errors per individual endpoint (pod). When a specific pod returns 5xx responses on 5 consecutive requests, that pod is ejected from the load balancer pool. The count resets when a successful response is received from that pod.',
    },
    {
      q: 'What is the risk of setting `maxEjectionPercent: 100` in outlierDetection?',
      options: ['It causes Istio to delete unhealthy pods permanently', 'All pods can be ejected simultaneously, causing a complete service outage', 'It makes circuit breaking too aggressive, causing false positives', 'It overrides connection pool settings'],
      answer: 1,
      explanation: 'With maxEjectionPercent: 100, a cascading failure can eject all pods from the pool — turning a partial failure (some pods returning 5xx) into a complete service blackout. Always set this to a safe fraction (e.g., 50%) and combine with minHealthPercent.',
    },
    {
      q: 'What happens when `http1MaxPendingRequests` is exceeded in connectionPool?',
      options: ['Requests are queued indefinitely until capacity frees up', 'Envoy returns 503 upstream overflow immediately without connecting to the upstream', 'Envoy closes the TCP connection to the upstream service', 'The VirtualService retry policy kicks in automatically'],
      answer: 1,
      explanation: 'When the pending request queue is full (exceeds http1MaxPendingRequests), Envoy rejects new requests immediately with 503 "upstream overflow" — the fast-fail circuit breaker behaviour. This prevents the queue from growing without bound and cascading failures.',
    },
    {
      q: 'Why is it dangerous to retry POST requests on all 5xx responses?',
      options: ['POST retries are not supported by Istio', 'The server might have processed the request before crashing, causing duplicates on retry', 'POST retries increase latency beyond the timeout budget', 'POST requests use HTTP/2 which doesn\'t support retries'],
      answer: 1,
      explanation: 'If a server processes a POST request (e.g., creates a database record) but crashes before sending the response, the client\'s Envoy receives a 503. Retrying this request creates a duplicate record. Only retry on `connect-failure` for non-idempotent operations, or implement idempotency keys.',
    },
    {
      q: 'What does `fault.delay` in a VirtualService do to actual upstream traffic?',
      options: ['Slows down the upstream service process itself', 'Adds latency at the Envoy layer before forwarding to the upstream — upstream still responds at normal speed', 'Delays retries by the specified amount', 'Queues requests in memory for the specified duration'],
      answer: 1,
      explanation: 'Fault injection is applied at the Envoy proxy layer. With a delay, Envoy waits the specified duration before forwarding the request — the upstream service processes it normally at its own speed. This simulates network latency or slow dependencies without modifying any code.',
    },
    {
      q: 'How does `baseEjectionTime` change with repeated ejections of the same pod?',
      options: ['It stays constant at the configured value', 'It doubles with each ejection: 30s → 60s → 90s…', 'It multiplies by the ejection count: 30s × N ejections', 'It resets to 0 after each successful probe'],
      answer: 2,
      explanation: 'The actual ejection duration = `baseEjectionTime × (number of times this host has been ejected)`. A pod ejected for the third time stays out for 3×baseEjectionTime. This exponential backoff ensures chronically misbehaving pods stay ejected longer, preventing rapid oscillation.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between circuit breaking (connectionPool) and outlier detection?',
      a: '<strong>Connection pool limits</strong> (circuit breaking): protect against <em>overload</em>. When the number of pending requests or connections to an upstream exceeds the configured limit, Envoy immediately rejects NEW requests with 503. It\'s a capacity gate — "this upstream is full, do not send more." <br><br><strong>Outlier detection</strong>: protects against <em>quality</em> degradation. Envoy monitors response codes from each individual pod and ejects pods that are returning too many errors. It\'s a health-based eviction — "this specific pod is broken, route around it." <br><br>Use both together: connection pool stops overload; outlier detection removes bad actors.',
    },
    {
      q: 'How do you verify that a circuit breaker is actually tripping?',
      a: 'Check Envoy\'s statistics directly from the sidecar proxy: <ol><li><code>kubectl exec deploy/&lt;app&gt; -c istio-proxy -- pilot-agent request GET stats | grep upstream_rq_pending_overflow</code> — non-zero means the pending queue circuit breaker tripped</li><li><code>kubectl exec deploy/&lt;app&gt; -c istio-proxy -- pilot-agent request GET stats | grep ejections</code> — shows outlier detection ejections</li><li><code>istioctl proxy-config endpoints deploy/&lt;app&gt;</code> — shows health state of each upstream endpoint; DEGRADED or TIMEOUT means outlier detection ejected it</li><li>Prometheus metric: <code>envoy_cluster_upstream_rq_pending_overflow</code> counter — alert on this in production</li></ol>',
    },
    {
      q: 'What is the relationship between Istio retries and the upstream service\'s timeout?',
      a: 'Consider a 3-tier timeout chain: <ul><li><strong>Client app</strong> has a 30-second socket timeout</li><li><strong>Istio VirtualService</strong> has <code>timeout: 10s</code> and <code>retries: { attempts: 3, perTryTimeout: 3s }</code></li><li><strong>Upstream service</strong> has a request handler that takes up to 8 seconds</li></ul>What happens: Istio times out each attempt at 3 seconds, even though the upstream might have completed at 8 seconds. After 3 attempts (9 seconds total), Istio returns 504 to the client. The client\'s 30-second timeout is never reached. The upstream may have been processing for 3×8s=24s across all retries. Set timeouts to match actual service SLOs, not arbitrary values.',
    },
    {
      q: 'Can you configure global retry policies without a VirtualService per service?',
      a: 'Yes, via <strong>EnvoyFilter</strong> — a powerful but advanced Istio resource that patches Envoy\'s raw config. You can apply a default retry policy to all HTTP routes cluster-wide: <ul><li>Create an EnvoyFilter targeting the <code>outbound</code> listener type with a <code>route_configuration</code> patch</li><li>Set <code>num_retries</code> and <code>retry_on</code> in the virtual host\'s retry policy</li></ul>Caveat: EnvoyFilter requires deep Envoy config knowledge, is fragile across Istio upgrades, and overrides are cumulative — a VirtualService retry policy overrides the EnvoyFilter global. Use EnvoyFilter for global defaults only; per-service overrides in VirtualService.',
    },
    {
      q: 'How does minHealthPercent in outlierDetection work as a safety valve?',
      a: '<code>minHealthPercent</code> (default 50%) is an emergency brake: when the percentage of healthy hosts in the load balancer pool drops below this threshold, Istio <em>stops ejecting</em> any more hosts — regardless of their error rate. This prevents outlier detection from draining the entire pool during a widespread failure. Example: with <code>maxEjectionPercent: 70</code> and <code>minHealthPercent: 30</code>, Istio will eject up to 70% of pods, but if ejecting the next pod would put healthy pods below 30%, it stops ejecting. The cluster degrades gracefully rather than being completely blacked out.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Resilience in Istio combines VirtualService retries/timeouts (per-route) with DestinationRule connectionPool (circuit breaker) and outlierDetection (health-based ejection). Fault injection tests these patterns without code changes.',
    mustKnow: [
      'connectionPool: limits pending requests/connections → 503 on overflow (circuit breaker)',
      'outlierDetection: ejects pods after consecutiveGatewayErrors; duration = baseEjectionTime × ejection count',
      'maxEjectionPercent: safety cap — never eject more than this % of the pool',
      'VirtualService retries: attempts, perTryTimeout, retryOn; total timeout = overall budget',
      'Never retry non-idempotent ops (POST) on 5xx — use connect-failure only or add idempotency keys',
      'Fault injection: delay (latency testing) and abort (error handling) in VirtualService',
      'Layered retries amplify load — coordinate retry ownership across mesh and app layers',
    ],
    interviewFocus: [
      'connectionPool vs outlierDetection — what each protects against',
      'Why is maxEjectionPercent: 100 dangerous?',
      'How to safely retry non-idempotent operations',
      'How do you verify a circuit breaker is tripping? (Envoy stats, proxy-config endpoints)',
      'What is fault injection and when should you use it?',
    ],
  };
}
