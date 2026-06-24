import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface InterviewQuestion {
  difficulty: 'junior' | 'mid' | 'senior';
  topic: string;
  q: string;
  a: string;
}

@Component({
  selector: 'app-mesh-interview-prep',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
})
export class MeshInterviewPrep {
  activeDifficulty = signal<string>('All');
  activeTopic = signal<string>('All');
  openIndex = signal<number | null>(null);

  difficulties = ['All', 'junior', 'mid', 'senior'];
  topics = ['All', 'Fundamentals', 'Istio', 'Traffic', 'Security', 'Observability', 'Ambient', 'Multi-Cluster', 'Envoy', 'Consul'];

  questions: InterviewQuestion[] = [
    // Fundamentals
    {
      difficulty: 'junior', topic: 'Fundamentals',
      q: 'What problem does a service mesh solve that a load balancer doesn\'t?',
      a: 'A load balancer handles external north-south traffic (client → cluster) and distributes requests across instances. A service mesh handles internal east-west traffic (service → service) and provides: (1) automatic mTLS between all services without code changes, (2) per-request observability (metrics, traces, logs) for every service call, (3) fine-grained traffic control (canary splits, fault injection, retries), and (4) policy enforcement (who can call whom, JWT validation). Load balancers work at the edge; service meshes work inside the cluster for all service-to-service calls.',
    },
    {
      difficulty: 'junior', topic: 'Fundamentals',
      q: 'What is a sidecar proxy in the context of a service mesh?',
      a: 'A sidecar proxy is a container injected alongside the application container in every pod. It intercepts all inbound and outbound network traffic using iptables rules (redirecting traffic through ports 15006 inbound and 15001 outbound). The app thinks it\'s communicating directly with other services, but all traffic actually flows through the sidecar proxy. In Istio, the sidecar is Envoy. The proxy handles mTLS, observability, retries, timeouts, and routing — without any changes to application code.',
    },
    {
      difficulty: 'junior', topic: 'Fundamentals',
      q: 'What are the two planes of a service mesh?',
      a: 'A service mesh has two planes: (1) Control plane: the brain — configures all proxies, manages certificates, translates high-level policy (VirtualService, AuthorizationPolicy) into proxy config (xDS). In Istio, the control plane is Istiod. (2) Data plane: the network — the actual proxies (Envoy sidecars) that intercept and forward traffic, enforce policies, and collect metrics. The control plane tells the data plane what to do; the data plane does the work at traffic time.',
    },
    {
      difficulty: 'junior', topic: 'Fundamentals',
      q: 'What is mTLS and why does a service mesh use it?',
      a: 'mTLS (mutual TLS) is TLS where BOTH parties present certificates — unlike standard HTTPS where only the server is verified. In a service mesh: (1) the service mesh issues each service a certificate containing its SPIFFE identity (e.g., spiffe://cluster.local/ns/production/sa/frontend); (2) when frontend calls payment, both present their certs; (3) each verifies the other\'s cert against the mesh root CA. This ensures every connection is authenticated (you know who is calling) and encrypted in transit. Service mesh makes mTLS automatic and transparent — no code changes needed.',
    },
    {
      difficulty: 'junior', topic: 'Fundamentals',
      q: 'What is SPIFFE and why does Istio use it?',
      a: 'SPIFFE (Secure Production Identity Framework for Everyone) is a standard for workload identity. SPIFFE defines: (1) a URI format for workload identities: spiffe://trust-domain/path (e.g., spiffe://cluster.local/ns/production/sa/frontend); (2) a standard for the X.509 certificate encoding this identity (SVID — SPIFFE Verifiable Identity Document); (3) a Workload API for workloads to fetch their identity. Istio implements SPIFFE: Istiod is the CA, it issues SVIDs to each sidecar, and those SVIDs are used for mTLS. Using SPIFFE means Istio identity is interoperable with other SPIFFE-aware systems (Vault, SPIRE, Consul).',
    },

    // Istio
    {
      difficulty: 'junior', topic: 'Istio',
      q: 'What is Istiod and what does it do?',
      a: 'Istiod is Istio\'s unified control plane binary. It combines: (1) Pilot — watches Kubernetes resources (Services, Endpoints, Istio CRDs) and translates them into Envoy config, pushed to proxies via the xDS API; (2) Citadel (now integrated) — the CA that issues SPIFFE SVIDs to all sidecars; (3) Galley (now integrated) — validates Istio CRDs before they\'re applied. Istiod maintains persistent xDS gRPC connections to every Envoy sidecar in the mesh and pushes config updates whenever Kubernetes state changes.',
    },
    {
      difficulty: 'mid', topic: 'Istio',
      q: 'What is the xDS protocol and why does Istio use it?',
      a: 'xDS (Extensible Discovery Service) is a gRPC-based protocol that allows a management server (Istiod) to dynamically configure Envoy proxies at runtime without restarts. The four core APIs: LDS (Listener Discovery — what ports to bind to), RDS (Route Discovery — HTTP routing rules), CDS (Cluster Discovery — upstream service definitions), EDS (Endpoint Discovery — healthy pod IPs). Istio uses xDS because it\'s the native Envoy configuration protocol — config changes (new VirtualService, pod restart) are pushed to proxies in seconds without any proxy restart or rolling update. Push order: CDS → EDS → LDS → RDS (ensures clusters exist before listeners reference them).',
    },
    {
      difficulty: 'mid', topic: 'Istio',
      q: 'What does IstioOperator do and when would you use it vs Helm?',
      a: 'IstioOperator is an Istio-specific CRD for declarative Istio installation and configuration. It lets you customise: Istiod resource limits, sidecar defaults (concurrency, CPU/memory limits), component enablement (ingress gateways, egress gateways), and mesh-wide settings (accessLogFile, holdApplicationUntilProxyStarts). Apply with `istioctl install -f my-operator.yaml`. Helm is an alternative — `helm install istio-base`, `helm install istiod`. Trade-offs: IstioOperator is simpler for Istio-specific settings and has `istioctl verify-install` validation. Helm integrates with existing Helm-based GitOps workflows and supports values files. Both are production-viable.',
    },
    {
      difficulty: 'senior', topic: 'Istio',
      q: 'How does Istio handle Envoy proxy upgrades across a large cluster?',
      a: 'Envoy proxies are injected as sidecar containers at pod creation time. Upgrading Envoy requires restarting pods to pick up the new sidecar image. Strategies: (1) Rolling deployment restart: `kubectl rollout restart deployment -n namespace` — pods restart one-by-one, each gets the new Envoy image from the new injection webhook. Safe but takes time for large deployments. (2) Revision-based canary: deploy new Istiod with a revision label (istio.io/rev=1-21), migrate namespaces one-by-one by changing the injection label, old Istiod stays for old pods. (3) Upgrade all at once with `istioctl upgrade` — applies the new IstioOperator and triggers rolling restarts. Key risk: version skew — Envoy can be N-1 or N+1 of Istiod version. The xDS API has a compatibility guarantee; the sidecar image version is separate from the control plane version.',
    },

    // Traffic
    {
      difficulty: 'junior', topic: 'Traffic',
      q: 'What is the difference between VirtualService and DestinationRule?',
      a: 'VirtualService defines routing rules — HOW requests are routed: match on headers/path/method, set timeout and retry, split traffic by weight, inject faults. It\'s the "routing table" for a service. DestinationRule defines destination-side policy — WHAT happens when traffic reaches a service: which LB algorithm, which circuit breaker settings, TLS mode for upstream connections, and how to group pods into named subsets (by label). Together they form the complete traffic policy: VirtualService says "send 10% to v2", DestinationRule says "v2 = pods with label version:v2, use LEAST_CONN LB".',
    },
    {
      difficulty: 'mid', topic: 'Traffic',
      q: 'How does Istio circuit breaking work?',
      a: 'Istio circuit breaking is configured in DestinationRule under `trafficPolicy`. Two mechanisms: (1) Connection pool limits (`connectionPool`): cap the number of concurrent connections and pending requests. When the limit is exceeded, new requests are immediately rejected with 503 (response_flag: UO = upstream overflow). (2) Outlier detection (`outlierDetection`): monitors upstream health — if an endpoint returns N consecutive errors, it\'s ejected from the load balancing pool for `baseEjectionTime` (exponentially backed off on each ejection). Circuit breaking protects downstream services from cascading failure when an upstream is degraded.',
    },
    {
      difficulty: 'mid', topic: 'Traffic',
      q: 'What is traffic mirroring (shadowing) in Istio and when would you use it?',
      a: 'Traffic mirroring sends a copy of live production requests to a second destination (the "shadow") while the original request goes to the primary destination. The client only waits for the primary response — the shadow response is discarded. Use cases: (1) test a new service version with real production traffic before routing any users to it; (2) validate new infrastructure (new database, new region) under real load; (3) verify logging/tracing changes capture real traffic patterns. Configure in VirtualService: `mirror: host: svc, subset: v2` with `mirrorPercentage: value: 100`. The shadow request has the same headers but gets a "shadow" suffix in the source reported in metrics.',
    },
    {
      difficulty: 'senior', topic: 'Traffic',
      q: 'How would you implement a zero-downtime blue-green deployment with Istio?',
      a: 'Blue-green with Istio: (1) Deploy green (v2) service — same K8s Service, new Deployment with `version: v2` label. Ensure green is healthy (readiness probes passing). (2) Create DestinationRule with subsets: `blue: {version: v1}`, `green: {version: v2}`. (3) VirtualService: route 100% to blue. (4) Switch: update VirtualService to route 100% to green. The switch is atomic from Envoy\'s perspective — all in-flight requests complete against blue, new connections go to green. No downtime. (5) Monitor error rate and latency for 5-10 minutes. (6) If issues: revert VirtualService to 100% blue (instant rollback). (7) Delete blue Deployment once green is confirmed stable. Advantage over K8s rolling update: instant switching, instant rollback, no pod restarts.',
    },

    // Security
    {
      difficulty: 'junior', topic: 'Security',
      q: 'What is the difference between PeerAuthentication and AuthorizationPolicy?',
      a: 'PeerAuthentication controls mTLS mode — whether connections must use TLS (STRICT), may use TLS or plaintext (PERMISSIVE), or must be plaintext (DISABLE). It\'s about transport security. AuthorizationPolicy controls access — which services can call which other services, what HTTP methods/paths are allowed, and who is allowed based on JWT claims. They work together: PeerAuthentication ensures connections are mTLS-authenticated (so you know the caller\'s identity), and AuthorizationPolicy uses that verified identity to make allow/deny decisions.',
    },
    {
      difficulty: 'mid', topic: 'Security',
      q: 'What happens in Istio when a DENY AuthorizationPolicy and an ALLOW AuthorizationPolicy both match a request?',
      a: 'Istio\'s evaluation order: DENY policies are evaluated first, before ALLOW policies. If any DENY policy matches the request, the request is immediately rejected (403 Forbidden) — regardless of what any ALLOW policy says. ALLOW policies are only evaluated if no DENY policy matched. Additionally: if any ALLOW policy exists for a workload, the default becomes "deny-all" for requests that match no ALLOW rule. If no ALLOW policy exists at all, the default is "allow-all" (only DENY policies restrict). This is why you should apply a catch-all DENY before defining specific ALLOWs when building zero-trust.',
    },
    {
      difficulty: 'mid', topic: 'Security',
      q: 'How does Istio implement JWT validation and what happens when the JWT is missing?',
      a: 'JWT validation is configured via RequestAuthentication CRD: specifies issuer URL and JWKS URI (where to fetch public keys). Istio caches the JWKS and validates JWT signatures on each request. Behavior: (1) Valid JWT present → JWT claims are extracted and available in AuthorizationPolicy conditions (e.g., `request.auth.claims["roles"]`). (2) Invalid JWT (wrong signature, expired, wrong issuer) → 401 Unauthorized (Envoy rejects before reaching the app). (3) No JWT present → RequestAuthentication alone does NOT reject the request. To enforce JWT presence, you must add an AuthorizationPolicy with a rule requiring `request.auth.principal` to be set. RequestAuthentication only validates JWTs that ARE present; it doesn\'t require them.',
    },
    {
      difficulty: 'senior', topic: 'Security',
      q: 'How would you implement a zero-trust network posture in an Istio mesh?',
      a: 'Zero-trust in Istio: (1) Enforce STRICT mTLS cluster-wide: apply PeerAuthentication in `istio-system` namespace with `mtls.mode: STRICT`. Every connection must be mTLS-authenticated. (2) Default deny-all: apply an AuthorizationPolicy to each sensitive namespace with `action: DENY` and no rules (or `action: ALLOW` with an empty rule set). This denies all traffic by default. (3) Explicit allow: for each service, create AuthorizationPolicy allowing only known callers with specific methods/paths. (4) JWT at edge: RequestAuthentication on ingress gateway + AuthorizationPolicy requiring valid JWT for all external traffic. (5) Namespace isolation: PeerAuthentication per-namespace and AuthorizationPolicy using `notNamespaces` to prevent cross-namespace calls. (6) Regular review: use `istioctl analyze` to find permissive policies and `istioctl authn tls-check` to verify mTLS is active everywhere.',
    },

    // Observability
    {
      difficulty: 'junior', topic: 'Observability',
      q: 'What are the four golden signals and how does Istio help measure them?',
      a: 'The four golden signals for service health: (1) Latency: `istio_request_duration_milliseconds_bucket` — Istio provides p50/p99/p999 histograms for all service calls. (2) Traffic (rate): `rate(istio_requests_total[5m])` — Istio counts every request per service/source/destination. (3) Errors: `rate(istio_requests_total{response_code=~"5.."}[5m])` — 5xx error count. (4) Saturation: connection pool utilisation from `envoy_cluster_upstream_cx_active` / max connections. Istio provides all four automatically via Envoy stats without any application instrumentation — just inject the sidecar.',
    },
    {
      difficulty: 'mid', topic: 'Observability',
      q: 'What is the `reporter` label in Istio metrics and why does it matter?',
      a: 'The `reporter` label on `istio_requests_total` indicates which proxy reported the metric: `source` = the client-side proxy (the caller\'s sidecar) reported it; `destination` = the server-side proxy (the callee\'s sidecar) reported it. Why it matters: (1) Use `reporter="source"` for outgoing request rate from a service — this is what that service "sees" it\'s sending. (2) Use `reporter="destination"` for incoming request rate to a service — this is what the receiving service "sees" arriving. (3) Discrepancies between source and destination counts indicate dropped packets, network issues, or missing sidecar. For SLOs, use `reporter="destination"` for the serving side view.',
    },
    {
      difficulty: 'mid', topic: 'Observability',
      q: 'What is a response flag in Istio/Envoy and what do UO, UH, and NR mean?',
      a: 'Response flags are Envoy\'s classification of why a request failed, reported in the `response_flags` label on Istio metrics and access logs. Key flags: (1) UO (Upstream Overflow) — circuit breaker tripped; connection pool or pending request limit exceeded. Indicates the upstream is overloaded or the circuit breaker thresholds are too tight. (2) UH (Upstream Unhealthy) — no healthy endpoints in the upstream cluster. Could mean all pods are failing health checks, outlier detection ejected all endpoints, or there are no pods at all. (3) NR (No Route) — Envoy has no route matching the request. Usually a VirtualService misconfiguration, wrong host name, or missing DestinationRule subset. These flags are the first place to look when debugging 503 errors in the mesh.',
    },
    {
      difficulty: 'senior', topic: 'Observability',
      q: 'How do you build a reliable SLO using Istio metrics in Prometheus?',
      a: 'Service Level Objective (SLO) implementation with Istio: (1) Define availability SLO: e.g., "99.9% of requests return non-5xx". Recording rule: `record: job:istio_request_success_rate:ratio_rate5m; expr: 1 - (rate(istio_requests_total{reporter="destination",response_code=~"5.."}[5m]) / rate(istio_requests_total{reporter="destination"}[5m]))`. (2) Define latency SLO: e.g., "95% of requests complete in < 500ms". Recording rule using histogram: `histogram_quantile(0.95, rate(istio_request_duration_milliseconds_bucket{reporter="destination"}[5m]))`. (3) Multi-window alerts (alertmanager): alert on both short burn rate (1h window) for fast detection AND long burn rate (6h window) for sustained degradation. (4) Use `reporter="destination"` — counts from the server side are more reliable (client side may not report if the connection never reached the server). (5) Add `destination_service_name` and `destination_service_namespace` labels to scope per-service SLOs.',
    },

    // Ambient
    {
      difficulty: 'mid', topic: 'Ambient',
      q: 'What is ztunnel and how is it different from a sidecar proxy?',
      a: 'ztunnel (zero-trust tunnel) is a per-node DaemonSet proxy (written in Rust) that handles L4 mesh functionality for all pods on a node in Ambient mode. Differences from sidecars: (1) Scope: ztunnel serves ALL pods on a node; sidecar serves ONE pod. (2) Language: ztunnel is Rust (not Envoy/C++). (3) Capabilities: L4 only — mTLS, basic AuthorizationPolicy (source namespace/principal), TCP telemetry. No VirtualService routing, no JWT. (4) Deployment: DaemonSet (one per node); sidecars are injected per-pod. (5) Traffic capture: ztunnel uses the Istio CNI plugin (not the iptables init container). For L7 features, Ambient adds a Waypoint proxy (Envoy) per namespace.',
    },
    {
      difficulty: 'mid', topic: 'Ambient',
      q: 'What is HBONE and why does Ambient Mesh use it instead of iptables redirect?',
      a: 'HBONE (HTTP-Based Overlay Network Encapsulation) is a tunnelling protocol using HTTP/2 CONNECT. ztunnel wraps pod-to-pod traffic inside HBONE tunnels: the original TCP stream becomes the body of an HTTP/2 CONNECT request, and HBONE headers carry the source workload\'s SPIFFE identity. Why HBONE vs iptables redirect: (1) iptables redirect (sidecar mode) requires an init container with elevated privileges to set up per-pod rules. Ambient uses the CNI plugin for node-level capture — no per-pod privilege escalation. (2) HBONE tunnels carry workload identity in headers, enabling ztunnel to verify the caller\'s SPIFFE identity without per-pod TLS termination. (3) HBONE enables CONNECT-based tunnelling through existing HTTP/2 infrastructure without per-pod iptables management.',
    },
    {
      difficulty: 'senior', topic: 'Ambient',
      q: 'What are the security trade-offs between Ambient Mesh and sidecar mode?',
      a: 'Key security trade-offs: (1) Blast radius: sidecar mode — a proxy compromise affects ONE pod. ztunnel — a ztunnel compromise affects ALL pods on that node (all their traffic flows through one ztunnel). (2) Policy granularity: sidecars enforce policy per-pod (finest granularity). ztunnel enforces L4 policy per-node; Waypoint enforces L7 policy per-namespace. (3) Privilege: sidecar init containers require NET_ADMIN capability per-pod. Ambient CNI runs privileged at the node level (one privileged process vs many). (4) Defense in depth: Ambient + Waypoint provides TWO enforcement points (ztunnel L4 + Waypoint L7) — comparable to sidecar. (5) Isolation guarantees: for workloads requiring highest isolation (PCI, HIPAA), sidecar per-pod isolation may be preferred. For typical microservices, ztunnel + Waypoint is sufficient. Recommendation: assess your threat model — if node-level compromise is in scope, sidecar mode provides stronger isolation; if pod-level attack is the primary concern, both modes are comparable.',
    },

    // Multi-Cluster
    {
      difficulty: 'mid', topic: 'Multi-Cluster',
      q: 'What are the two main multi-cluster models in Istio and when would you use each?',
      a: '(1) Primary-Remote: one cluster runs Istiod and configures all other (remote) clusters. Simple — one control plane to manage. But it\'s a single point of failure: if the primary cluster loses Istiod, remote clusters can\'t receive config updates (existing traffic continues with stale config). Use for: dev/staging environments, clusters tightly coupled to one primary. (2) Multi-Primary: each cluster runs its own Istiod, sharing a common root CA. Each Istiod watches the other cluster\'s API server via remote secrets. Resilient — control plane failure in one cluster doesn\'t affect others. Use for: production multi-region, different teams owning different clusters, clusters that must remain operational independently. Multi-Primary is the recommended production pattern.',
    },
    {
      difficulty: 'senior', topic: 'Multi-Cluster',
      q: 'How does locality-aware load balancing work in a multi-cluster Istio deployment?',
      a: 'Locality-aware LB (LALB) prefers endpoints in the same geographic region/zone as the requesting pod, falling back to other regions only when local endpoints are unhealthy. Implementation: (1) Kubernetes nodes have locality labels (topology.kubernetes.io/region, topology.kubernetes.io/zone). Istio reads these labels and tags EDS endpoints with locality info. (2) Configure in DestinationRule: `localityLbSetting.enabled: true` + `failover: [{from: us-east1, to: eu-west1}]`. (3) CRITICAL: outlierDetection must also be configured — without it, failover NEVER triggers even if all local endpoints return 500s. Istiod only marks a locality as "unavailable" when outlier detection ejects all endpoints in that locality. (4) In multi-cluster: endpoints from cluster-1 (us-east1) and cluster-2 (eu-west1) both appear in EDS; LALB routes same-region first, fails over cross-region when outlier detection triggers ejection.',
    },

    // Envoy
    {
      difficulty: 'mid', topic: 'Envoy',
      q: 'Describe the Envoy data path from an incoming request to the upstream response.',
      a: 'For an inbound request to a pod: (1) iptables redirects the TCP connection to Envoy port 15006. (2) Envoy\'s listener at 15006 accepts the connection and matches a filter chain (by TLS SNI or ALPN). (3) The matched filter chain runs network filters: for mTLS traffic, the TLS filter terminates TLS and extracts the peer certificate (SPIFFE SVID). (4) The `http_connection_manager` (HCM) upgrades the TCP stream to HTTP. (5) HTTP filters in the HCM chain execute in order: `jwt_authn` validates JWT if present; `rbac` (from AuthorizationPolicy) checks allow/deny; `router` performs cluster selection and forwards to the upstream. (6) The router selects a cluster based on the route table (from VirtualService), picks a healthy endpoint from EDS via the LB algorithm, establishes a connection (mTLS for mesh-internal), and forwards the request. (7) The response follows the reverse path. Each step in the filter chain can short-circuit (return 401, 403, etc.) or modify the request/response.',
    },
    {
      difficulty: 'senior', topic: 'Envoy',
      q: 'What is an EnvoyFilter and what are the risks of using it?',
      a: 'EnvoyFilter is an Istio CRD that directly patches Envoy\'s xDS configuration using Protobuf patch operations (MERGE, ADD, REMOVE, INSERT_BEFORE, INSERT_AFTER). It targets specific Envoy objects: LISTENER, FILTER_CHAIN, NETWORK_FILTER, HTTP_FILTER, CLUSTER, VIRTUAL_HOST, HTTP_ROUTE. Use cases: adding Lua/Wasm filters, modifying cluster settings not exposed in DestinationRule, advanced rate limiting. Risks: (1) Version coupling — EnvoyFilter patches raw Envoy protobuf structure which changes between Istio versions. A patch that works on Istio 1.20 may silently fail or break on 1.21. Always pin with `proxyVersion`. (2) Validation gap — Istiod doesn\'t validate EnvoyFilter patch values; invalid patches can corrupt Envoy config silently. (3) Debug difficulty — broken EnvoyFilters are hard to diagnose; compare `/config_dump` before and after. Rule: always prefer VirtualService/DestinationRule; use EnvoyFilter only as last resort for capabilities not otherwise exposed.',
    },

    // Consul
    {
      difficulty: 'mid', topic: 'Consul',
      q: 'Compare Consul Intentions to Istio AuthorizationPolicy. What can each do that the other cannot?',
      a: 'Consul Intentions: allow/deny between source service name and destination service name. L7 filtering by HTTP path/method (when protocol: http is set). Simple and straightforward. Limitations: no JWT claim matching, no source namespace isolation (Consul doesn\'t use K8s namespaces for identity by default), no AUDIT action. Istio AuthorizationPolicy: allow/deny/audit based on: SPIFFE principal (full service account path), source namespace, JWT claims (arbitrary JWT fields from RequestAuthentication), request headers, HTTP method/path. Supports custom conditions. Limitations: more complex, requires understanding SPIFFE identity model. Summary: Consul Intentions are simpler to understand; Istio AuthorizationPolicy is more powerful for JWT-based, namespace-aware, and claim-aware access control.',
    },
    {
      difficulty: 'senior', topic: 'Consul',
      q: 'An organisation runs services on both Kubernetes and bare-metal VMs. How would you approach building a unified service mesh?',
      a: 'For a K8s + bare-metal hybrid mesh, options: (1) Consul Connect: strongest native support — install consul-agent on VMs, register services with `consul services register`. VMs join the same Consul catalog as K8s services. Transparent proxy mode on VMs enables automatic mTLS. Intentions work uniformly across K8s and VM services. Best for HashiCorp-ecosystem organizations. (2) Istio + WorkloadEntry: define WorkloadGroup (template) and WorkloadEntry (per VM instance) CRDs. Install istio-agent on VMs, bootstrap with a K8s token. VMs get SPIFFE SVIDs and join the mesh. More complex setup than Consul for VMs, but provides full Istio L7 features on VM workloads. (3) Hybrid: Consul for VM workloads, Istio for K8s, connected via mesh gateways. Each mesh handles its platform natively; gateways bridge them. Complex to operate but preserves best-in-class per platform. Recommendation: if already using HashiCorp stack → Consul. If Kubernetes-native with occasional VM needs → Istio WorkloadEntry. If large VM estate → evaluate Consul or hybrid.',
    },
  ];

  filteredQuestions = computed(() => {
    const diff = this.activeDifficulty();
    const topic = this.activeTopic();
    return this.questions.filter(q =>
      (diff === 'All' || q.difficulty === diff) &&
      (topic === 'All' || q.topic === topic)
    );
  });

  toggle(i: number) {
    this.openIndex.set(this.openIndex() === i ? null : i);
  }

  setDifficulty(d: string) { this.activeDifficulty.set(d); this.openIndex.set(null); }
  setTopic(t: string) { this.activeTopic.set(t); this.openIndex.set(null); }
}
