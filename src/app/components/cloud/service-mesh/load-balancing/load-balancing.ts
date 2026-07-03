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
  selector: 'app-mesh-load-balancing',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './load-balancing.html',
  styleUrl: './load-balancing.scss',
})
export class MeshLoadBalancing {
  quickRef: QuickRefItem[] = [
    { name: 'ROUND_ROBIN', type: 'keyword', desc: 'Default algorithm — distributes requests sequentially across endpoints, cycling through all.' },
    { name: 'LEAST_CONN', type: 'keyword', desc: 'Routes to the endpoint with fewest active connections. Ideal for long-lived or variable-cost requests.' },
    { name: 'RANDOM', type: 'keyword', desc: 'Selects a random healthy endpoint. Performs better than round-robin when no connection state is needed.' },
    { name: 'PASSTHROUGH', type: 'keyword', desc: 'No load balancing — forwards to the address requested by the client (for protocols that manage their own LB).' },
    { name: 'localityLbSetting', type: 'syntax', desc: 'DestinationRule setting for zone/region-aware load balancing and failover.' },
    { name: 'distribute', type: 'keyword', desc: 'localityLbSetting.distribute: weighted distribution across zones (e.g., 70% local, 30% remote).' },
    { name: 'failover', type: 'keyword', desc: 'localityLbSetting.failover: defines ordered list of zones to try when local zone is degraded.' },
    { name: 'consistentHash', type: 'syntax', desc: 'Session affinity by header, cookie, or source IP — routes the same client to the same endpoint.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'How Istio Load Balancing Works',
      points: [
        'Istio\'s load balancing is performed by the CLIENT-SIDE Envoy sidecar, not a central load balancer. The client Envoy maintains a list of healthy upstream endpoints (pods) and distributes requests among them.',
        'This is fundamentally different from Kubernetes Service routing: kube-proxy uses iptables/IPVS round-robin, selecting a random endpoint per connection. Istio\'s Envoy selects per REQUEST and tracks connection state.',
        'Endpoint discovery: Istiod translates Kubernetes Endpoints resources into Envoy EDS (Endpoint Discovery Service) updates. When a pod is added/removed, Istiod pushes an EDS update to all sidecars within seconds.',
        'Load balancing is configured in DestinationRule\'s `trafficPolicy.loadBalancer` section — either at the host level (applies to all subsets) or at the subset level (overrides for a specific version).',
        'The default algorithm is ROUND_ROBIN. This works well for stateless services with uniform request costs. For services with variable-duration requests, LEAST_CONN reduces tail latency by avoiding hot endpoints.',
        'Istio load balancing is unaffected by Kubernetes HPA scaling — when new pods are added, Istiod discovers them via EDS and pushes endpoint updates to all client sidecars within seconds, distributing traffic to them immediately.',
      ],
    },
    {
      heading: 'Load Balancing Algorithms',
      points: [
        'ROUND_ROBIN: each new request goes to the next endpoint in a cycle. Simple, low overhead. Best when request cost is uniform and connections are short-lived.',
        'LEAST_CONN: routes to the endpoint with the fewest ACTIVE connections (open streams). Better than round-robin for gRPC streaming, WebSockets, or any requests with variable processing time.',
        'RANDOM: picks a uniformly random endpoint per request. In large clusters, random outperforms round-robin because it avoids synchronisation overhead and achieves similar distribution. Envoy\'s internal recommendation for large fleets.',
        'PASSTHROUGH: bypasses Istio\'s load balancing. Requests are sent directly to the IP:port specified by the caller. Used with ORIGINAL_DST cluster type — useful for protocols that implement their own load balancing (e.g., Kafka clients, Cassandra drivers).',
        'CONSISTENT_HASH: session affinity based on a request attribute. Routes the same header value, cookie, or source IP to the same endpoint every time. Useful for caching (same shard always hits the same cache node) and stateful protocols.',
        'Algorithm comparison: LEAST_CONN is best for database connection pools or gRPC streams. ROUND_ROBIN for short-lived uniform REST calls. CONSISTENT_HASH for cache affinity. RANDOM for very large homogeneous fleets.',
      ],
    },
    {
      heading: 'Consistent Hashing (Session Affinity)',
      points: [
        'Consistent hash load balancing routes requests from the same "hash key" to the same endpoint. This creates soft affinity — a specific client/session always reaches the same backend pod.',
        'Hash key sources: `httpHeaderName` (a specific request header), `httpCookie` (set a cookie and route by it), `useSourceIp` (client IP — source NAT can break this in Kubernetes).',
        'HTTP cookie hashing: Envoy can both READ a cookie from incoming requests and SET a new cookie on the response if absent, making it self-initialising. The cookie ties a browser session to a backend pod.',
        'Consistent hashing is NOT a guarantee of stickiness — if the endpoint count changes (pod restart, scaling), ~1/N of sessions are remapped. This is much better than all sessions remapping (which hash-mod-N would do), but not 100% sticky.',
        'Use case: distributed cache where data is partitioned by user ID. With consistent hashing on the user ID header, requests always reach the shard storing that user\'s data — cache hit rates are maximised.',
        'Consistent hashing does NOT work well with circuit breaking and outlier detection — ejected endpoints break the hash ring, causing remapping. Design for eventual consistency if using both together.',
      ],
    },
    {
      heading: 'Locality-Aware Load Balancing',
      points: [
        'Locality-aware LB (a.k.a. zone-aware routing) prefers endpoints in the same zone or region as the client pod. This reduces cross-zone data transfer costs (in cloud providers, cross-AZ traffic is billed) and latency.',
        'Locality is determined by the `topology.kubernetes.io/region` and `topology.kubernetes.io/zone` labels on Kubernetes nodes. Istio reads these to classify endpoints by locality.',
        '`localityLbSetting.distribute`: explicitly define the percentage of traffic each locality receives. Example: 70% to same zone, 20% to same region different zone, 10% to different region.',
        '`localityLbSetting.failover`: defines which locality to use when the local one is degraded. Example: prefer `us-east1-b`, failover to `us-east1-c`, then to `us-east1`.',
        'Trigger for failover: Envoy uses Outlier Detection to determine when a locality is "degraded" — when enough endpoints in the local zone are ejected, traffic automatically flows to the failover locality.',
        'Locality LB is most valuable for multi-AZ deployments where you want local-first traffic but automatic failover when a zone has issues. It is transparent to both clients and servers.',
      ],
    },
    {
      heading: 'Load Balancing and Health Checking',
      points: [
        'Istio supports two types of health checks: PASSIVE (outlier detection — monitors real traffic) and ACTIVE (Envoy periodic health checks — sends probe requests to each endpoint).',
        'Active health checks in Istio: configured via DestinationRule\'s `trafficPolicy.healthCheck` (or via an EnvoyFilter for advanced config). Envoy sends HTTP GET or TCP probes to each endpoint at a configurable interval.',
        'Without active health checks, Istio relies on Kubernetes readiness probes to determine endpoint health. A pod removed from Endpoints (due to failing readiness) stops receiving traffic from Envoy immediately.',
        'Active health checks complement readiness probes: they can detect backend health at the Envoy layer independently of Kubernetes, catching cases where a pod passes readiness but is actually unhealthy for some specific traffic.',
        'Slow start mode (`warmupDurationSecs`): when a new pod joins the pool, Istio gradually increases the traffic it receives over the warmup period instead of immediately sending it full load. Prevents new pods from being overwhelmed before they\'re warm.',
        'Endpoint weighting: Istio supports assigning different weights to endpoints (via WorkloadEntry `weight` field for external services). This allows manual hot/cold standby configurations.',
      ],
    },
    {
      heading: 'Differences from Kubernetes Service Load Balancing',
      points: [
        'Kubernetes Service: kube-proxy randomly selects an endpoint per NEW TCP connection. All requests in that connection go to the same pod. No awareness of request-level state (gRPC streams, HTTP/2 multiplexed requests).',
        'Istio: load balances per REQUEST, not per connection. For HTTP/2 and gRPC, a single TCP connection can carry many concurrent streams — Istio distributes these streams across different pods, unlike kube-proxy.',
        'This makes Istio\'s load balancing critical for gRPC services: without Istio, all gRPC calls over a single connection go to one pod (since gRPC uses persistent HTTP/2 connections). With Istio, each gRPC call is balanced independently.',
        'Health awareness: kube-proxy only removes endpoints when Kubernetes marks them NotReady. Istio\'s outlier detection removes endpoints within seconds of observing consecutive errors — faster reaction to partial failures.',
        'Geographic awareness: kube-proxy has no concept of zones or regions — it treats all endpoints equally. Istio\'s localityLbSetting enables zone-aware routing with automatic cross-zone failover.',
        'Session affinity in kube-proxy: `sessionAffinity: ClientIP` on the Service provides IP-based stickiness but works at the connection level. Istio\'s consistentHash works at the request level with header/cookie options.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'LB Algorithms',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: catalog
spec:
  host: catalog
  trafficPolicy:
    loadBalancer:
      simple: LEAST_CONN   # Best for gRPC streaming & variable-cost requests
  subsets:
  - name: v1
    labels:
      version: v1
    trafficPolicy:
      loadBalancer:
        simple: ROUND_ROBIN   # Override for v1: uniform short requests
  - name: v2
    labels:
      version: v2
    trafficPolicy:
      loadBalancer:
        simple: LEAST_CONN    # Override for v2: variable-cost requests
EOF`,
    },
    {
      label: 'Consistent Hash (Session Affinity)',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: user-cache
spec:
  host: user-cache
  trafficPolicy:
    loadBalancer:
      consistentHash:
        # Option 1: hash on a request header
        httpHeaderName: x-user-id

        # Option 2: hash on a cookie (auto-set if absent)
        # httpCookie:
        #   name: session-affinity
        #   ttl: 3600s

        # Option 3: hash on source IP (may break behind SNAT)
        # useSourceIp: true
EOF`,
    },
    {
      label: 'Locality-Aware LB',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: api
spec:
  host: api
  trafficPolicy:
    loadBalancer:
      localityLbSetting:
        enabled: true
        # Weighted distribution: 80% local zone, 20% to adjacent zone
        distribute:
        - from: us-east1/us-east1-b/*
          to:
            "us-east1/us-east1-b/*": 80
            "us-east1/us-east1-c/*": 20
        # Failover order when local zone is degraded
        failover:
        - from: us-east1
          to: us-west1
    # Outlier detection triggers failover
    outlierDetection:
      consecutiveGatewayErrors: 3
      interval: 10s
      baseEjectionTime: 30s
EOF`,
    },
    {
      label: 'Slow Start / Warmup',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: ml-inference
spec:
  host: ml-inference
  trafficPolicy:
    loadBalancer:
      simple: LEAST_CONN
      warmupDurationSecs: 30   # New pods receive gradually increasing traffic
                                # over 30 seconds after joining the pool
    connectionPool:
      http:
        http2MaxRequests: 100
        http1MaxPendingRequests: 20
    outlierDetection:
      consecutiveGatewayErrors: 5
      interval: 10s
      baseEjectionTime: 60s
      maxEjectionPercent: 40
EOF`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using ROUND_ROBIN for gRPC services',
      wrong: `# gRPC uses HTTP/2 persistent connections
# With ROUND_ROBIN, all gRPC calls on the same connection go to the SAME pod
# because kube-proxy or PASSTHROUGH routes per-connection, not per-request`,
      right: `trafficPolicy:
  loadBalancer:
    simple: LEAST_CONN   # Per-request load balancing for gRPC streams
# Or inject sidecars — Istio makes gRPC load balancing per-stream automatically`,
      explanation: 'gRPC uses long-lived HTTP/2 connections. Without Istio, a single connection routes all streams to one pod. Istio\'s per-request load balancing (LEAST_CONN or ROUND_ROBIN) correctly distributes individual gRPC calls across the pool — this is one of Istio\'s biggest wins for gRPC services.',
    },
    {
      title: 'Using sourceIp consistent hash behind a NAT or load balancer',
      wrong: `consistentHash:
  useSourceIp: true
# All requests from behind the same NAT gateway appear as the same source IP
# → all traffic routes to ONE backend pod`,
      right: `consistentHash:
  httpHeaderName: x-user-id  # Use a request-level identifier, not source IP
# Works correctly regardless of network topology`,
      explanation: 'In Kubernetes, pods often share a NAT gateway for outbound traffic. `useSourceIp` hashes on the NAT IP, not the individual pod IP — routing all traffic from the same NAT source to one endpoint. Use a request header (user ID, session token) for reliable consistent hashing.',
    },
    {
      title: 'Enabling locality LB without outlierDetection',
      wrong: `localityLbSetting:
  enabled: true
  failover:
  - from: us-east1
    to: us-west1
# Without outlierDetection, Istio never knows a locality is degraded
# → failover never triggers, local zone stays overloaded`,
      right: `trafficPolicy:
  loadBalancer:
    localityLbSetting:
      enabled: true
      failover:
      - from: us-east1
        to: us-west1
  outlierDetection:        # Required to trigger failover!
    consecutiveGatewayErrors: 3
    interval: 10s`,
      explanation: 'Locality-based failover is triggered by outlierDetection — when enough endpoints in the local zone are ejected, Istio automatically shifts traffic to the failover locality. Without outlierDetection configured, the failover mechanism has no signal to trigger on and locality failover never activates.',
    },
    {
      title: 'Assuming Istio LB replaces the Kubernetes Service',
      wrong: `# Deleted the Kubernetes Service for "catalog" since Istio handles routing
# → Envoy has no endpoint list to load balance across`,
      right: `# Istio builds on TOP of Kubernetes Services
# The Service's selector → Endpoints → Istio EDS updates → Envoy knows pod IPs
# Never delete the Service — it is the source of endpoint discovery`,
      explanation: 'Istio\'s endpoint discovery relies on Kubernetes Endpoints resources, which are managed by Kubernetes Services. Istio does not replace Services — it intercepts and enhances the traffic flows that Services define. Delete the Service and Istiod loses the endpoint list, breaking all routing.',
    },
    {
      title: 'Applying consistent hash without all clients using it',
      wrong: `# DestinationRule with consistentHash for user-cache
# But service A doesn't send x-user-id header → falls to default round-robin
# → cache misses because different pods handle same user`,
      right: `# Ensure ALL callers propagate the hash header
# Add a VirtualService that enforces the header or reject requests without it
# Document the required header in your API contract`,
      explanation: 'Consistent hashing only provides affinity when the hash key is present and consistent. If some callers don\'t send the expected header, Envoy falls back to ROUND_ROBIN for those requests — breaking the cache affinity. Enforce header propagation at the API gateway level or in shared middleware.',
    },
  ];

  challenge: Challenge = {
    title: 'Configure Multi-Strategy Load Balancing',
    language: 'typescript',
    description: `Configure load balancing for a "recommendations" service with these requirements:
- Default (host-level): LEAST_CONN for the main service
- "fast" subset (simple GET requests): ROUND_ROBIN
- "ml" subset (heavy ML inference): LEAST_CONN with 30s warmup
- Session affinity: hash on "x-session-id" header for the "ml" subset

Return the DestinationRule YAML.`,
    hints: [
      'trafficPolicy at host level applies to all subsets by default',
      'Subset-level trafficPolicy overrides the host-level',
      'warmupDurationSecs is under loadBalancer settings',
      'consistentHash.httpHeaderName for header-based hashing',
    ],
    starterCode: `function getDestinationRule(): string {
  return \`# DestinationRule YAML here\`;
}
console.log(getDestinationRule());`,
    solution: `function getDestinationRule(): string {
  return \`apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: recommendations
spec:
  host: recommendations
  trafficPolicy:
    loadBalancer:
      simple: LEAST_CONN
  subsets:
  - name: fast
    labels:
      variant: fast
    trafficPolicy:
      loadBalancer:
        simple: ROUND_ROBIN
  - name: ml
    labels:
      variant: ml
    trafficPolicy:
      loadBalancer:
        consistentHash:
          httpHeaderName: x-session-id
        warmupDurationSecs: 30\`;
}
console.log(getDestinationRule());`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which load balancing algorithm is best for gRPC streaming services?',
      options: ['ROUND_ROBIN — it distributes connections evenly', 'LEAST_CONN — it distributes active streams across endpoints', 'RANDOM — it is the most efficient for large fleets', 'PASSTHROUGH — it lets gRPC manage its own load balancing'],
      answer: 1,
      explanation: 'LEAST_CONN routes new requests/streams to the endpoint with the fewest active connections. For gRPC streaming (long-lived streams of variable duration), this ensures no single pod accumulates all the streams while others sit idle — which is exactly what ROUND_ROBIN can cause with long-lived connections.',
    },
    {
      q: 'Why does Istio\'s load balancing improve gRPC over plain Kubernetes Services?',
      options: ['Istio adds a dedicated gRPC proxy with native protocol support', 'Istio load balances per-REQUEST/stream; Kubernetes Services load balance per-connection', 'Istio adds automatic health checks that kube-proxy lacks', 'Istio compresses gRPC payloads to reduce latency'],
      answer: 1,
      explanation: 'Kubernetes Services (kube-proxy) route per-TCP connection — all gRPC streams on one connection go to one pod. Istio\'s Envoy sidecar intercepts at the HTTP/2 layer and load balances individual gRPC streams across the pod pool. This is fundamental for gRPC load balancing correctness.',
    },
    {
      q: 'What must be configured alongside `localityLbSetting.failover` for failover to actually trigger?',
      options: ['A VirtualService with fault injection', 'OutlierDetection in the same DestinationRule trafficPolicy', 'A PeerAuthentication policy in STRICT mode', 'A Kubernetes NetworkPolicy allowing cross-zone traffic'],
      answer: 1,
      explanation: 'localityLbSetting.failover defines WHERE to fail over to. outlierDetection decides WHEN a locality is considered degraded and failover should trigger. Without outlierDetection, Istio never removes enough local endpoints to meet the failover threshold — the failover rules are effectively dead code.',
    },
    {
      q: 'What is `warmupDurationSecs` in DestinationRule used for?',
      options: ['Delays traffic to a service until it passes N health checks', 'Gradually ramps up traffic to new endpoints instead of sending full load immediately', 'Warms the Envoy connection pool by pre-establishing connections on startup', 'Delays circuit breaker activation for new pod deployments'],
      answer: 1,
      explanation: 'warmupDurationSecs implements "slow start" — new pods joining the load balancer pool receive a linearly increasing fraction of traffic over the warmup period (from ~0% to their fair share). This prevents new pods (e.g., ML models that need JVM warm-up or caches to fill) from being overwhelmed immediately.',
    },
    {
      q: 'Why does `useSourceIp` consistent hashing fail behind a NAT gateway?',
      options: ['NAT changes the port but not the IP, breaking the hash', 'All pods behind the same NAT appear to have the same source IP, routing all to one endpoint', 'NAT prevents Envoy from reading L3 headers', 'Source IP hashing is deprecated in Istio 1.20+'],
      answer: 1,
      explanation: 'In Kubernetes, pods often share an outbound NAT IP (node IP or cluster NAT gateway). With useSourceIp, all pods behind the same NAT hash to the same value and route to the same upstream endpoint — defeating load balancing. Use a request header (user ID, session token) for reliable consistent hashing.',
    },
    {
      q: 'Which load balancing mode should you use when the upstream protocol manages its own load balancing?',
      options: ['RANDOM', 'PASSTHROUGH', 'LEAST_CONN', 'CONSISTENT_HASH'],
      answer: 1,
      explanation: 'PASSTHROUGH disables Istio\'s load balancing and forwards requests directly to the destination address specified by the caller. Use this for protocols like Kafka (client-side partition awareness), Cassandra (token-aware drivers), or any client that must control which specific endpoint it connects to.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does Istio know which pods are available for load balancing?',
      a: 'Istio uses the <strong>Endpoint Discovery Service (EDS)</strong> within the xDS protocol. Istiod watches Kubernetes Endpoints resources (which are maintained by Kubernetes based on pod readiness probes). When a pod becomes Ready, its IP is added to the Endpoints resource; when it fails readiness, it is removed. Istiod translates these Endpoints into EDS updates and pushes them to all client-side Envoy sidecars within seconds. This means Envoy always has a near-real-time list of healthy pod IPs to load balance across — no central load balancer needed.',
    },
    {
      q: 'Can you use different load balancing algorithms for different subsets of the same service?',
      a: 'Yes. DestinationRule allows both a host-level <code>trafficPolicy</code> (applies to all subsets as default) and per-subset <code>trafficPolicy</code> overrides. Example: <ul><li>Host level: LEAST_CONN (default for all subsets)</li><li>Subset "v1" (simple REST handlers): ROUND_ROBIN override</li><li>Subset "v2" (ML inference, variable cost): LEAST_CONN with warmupDurationSecs</li></ul>The subset-level trafficPolicy completely overrides the host-level for pods matching that subset\'s labels.',
    },
    {
      q: 'What is the difference between active and passive health checking in Istio?',
      a: '<strong>Passive health checking (outlierDetection)</strong>: monitors real production traffic. Envoy tracks response codes from each endpoint and ejects pods that return too many errors. No overhead on healthy pods — it just watches existing traffic. <br><br><strong>Active health checking</strong>: Envoy periodically sends probe requests to each endpoint (HTTP GET or TCP connect). Detects unhealthy endpoints even if they receive no real traffic. Configured via DestinationRule\'s <code>trafficPolicy.healthCheck</code> or EnvoyFilter for advanced config. <br><br>Use both together for comprehensive health detection: active probes catch silent failures; passive probes catch quality degradation under real load.',
    },
    {
      q: 'How does locality-aware load balancing handle multi-AZ cloud deployments?',
      a: 'Locality LB reads <code>topology.kubernetes.io/zone</code> labels from Kubernetes nodes to determine which zone each pod belongs to. With <code>localityLbSetting.distribute</code>, you define the traffic percentage for each zone: e.g., 80% to same-zone pods, 20% to adjacent-zone pods. This reduces cross-AZ data transfer costs (billed per GB in AWS/GCP/Azure). <br><br>When combined with <code>outlierDetection</code>, Istio automatically detects when the local zone is degraded (enough pods ejected) and shifts traffic to the <code>failover</code> zone. The entire process is transparent to both the client app and the server — no code changes needed for zone-aware, zone-failover routing.',
    },
    {
      q: 'How does Istio\'s per-request load balancing benefit HTTP/2 multiplexed connections?',
      a: 'HTTP/2 multiplexes multiple request/response streams over a single TCP connection. Without Istio (using kube-proxy), that single connection is routed to ONE pod — all multiplexed requests go to the same backend, regardless of load. This creates hot spots when certain requests are expensive. <br><br>With Istio, the client-side Envoy operates at the HTTP/2 stream layer. Each stream (individual request) is assigned to an endpoint based on the load balancing algorithm. Over a single TCP connection to Envoy, 20 concurrent gRPC streams can be distributed across 20 different backend pods. This is the key reason service meshes are recommended for gRPC-heavy architectures.',
    },
  { q: 'A service has 90 pods in zone-a and only 2 pods in zone-b, with locality-weighted LB configured for an 80/20 same-zone/adjacent-zone split. A client in zone-b sends requests. Do the 2 zone-b pods risk being overwhelmed even though the client is correctly favoring "local" traffic?', a: 'Yes — locality weighting operates on the PERCENTAGE of traffic sent to each zone from a given caller\'s perspective, not on absolute pod capacity, so if most of the mesh\'s callers happen to be co-located in zone-b (or if zone-b simply has far fewer replicas than the traffic volume it receives locally warrants), those 2 pods can be driven well past their fair share of load even while "correctly" receiving 80% of zone-b-originated traffic. Locality-aware routing optimizes for latency and cross-zone cost, not for load fairness relative to replica count — teams need to separately ensure replica counts per zone are roughly proportional to the traffic volume originating from that zone (via HPA per zone or manual sizing), or combine locality weighting with monitoring that would catch a zone\'s pods being overloaded despite "correct" locality routing.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Istio performs per-request load balancing via the client-side Envoy sidecar. Algorithms include ROUND_ROBIN (default), LEAST_CONN (gRPC/variable cost), RANDOM, PASSTHROUGH, and CONSISTENT_HASH (header/cookie affinity). Locality LB adds zone-aware routing with automatic failover.',
    mustKnow: [
      'Client-side Envoy does per-REQUEST load balancing — unlike kube-proxy which does per-connection',
      'LEAST_CONN: for gRPC, streaming, variable-cost requests; ROUND_ROBIN: for uniform short-lived REST',
      'consistentHash: header/cookie/IP-based affinity; avoid useSourceIp behind NAT',
      'localityLbSetting: zone-aware routing; requires outlierDetection to trigger failover',
      'warmupDurationSecs: slow-start for new pods — prevents cold pods from being overwhelmed',
      'PASSTHROUGH: bypasses Istio LB for protocols that self-manage routing',
      'Istio fixes gRPC LB by load balancing per-stream, not per-connection',
    ],
    interviewFocus: [
      'Why Istio improves gRPC load balancing over kube-proxy (per-stream vs per-connection)',
      'LEAST_CONN vs ROUND_ROBIN — when each is appropriate',
      'Why locality failover requires outlierDetection to be configured',
      'Consistent hash pitfalls: missing header → round-robin; useSourceIp behind NAT → single endpoint',
      'How Istio discovers endpoints (EDS from Istiod watching Kubernetes Endpoints)',
    ],
  };
}
