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
  selector: 'app-mesh-fundamentals',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './fundamentals.html',
  styleUrl: './fundamentals.scss',
})
export class MeshFundamentals {
  quickRef: QuickRefItem[] = [
    { name: 'Service Mesh', type: 'keyword', desc: 'Dedicated infrastructure layer managing service-to-service communication — traffic, security, and observability.' },
    { name: 'Sidecar Proxy', type: 'keyword', desc: 'Per-pod Envoy container that intercepts all inbound/outbound traffic without changing application code.' },
    { name: 'Control Plane', type: 'keyword', desc: 'Brain of the mesh (Istiod) — distributes configuration and certificates to data plane proxies.' },
    { name: 'Data Plane', type: 'keyword', desc: 'Network of sidecar proxies that enforce policies and collect telemetry on each request.' },
    { name: 'mTLS', type: 'keyword', desc: 'Mutual TLS — both sides present certificates, encrypting traffic and proving identity automatically.' },
    { name: 'VirtualService', type: 'syntax', desc: 'Istio CRD defining traffic routing rules (retries, timeouts, weight splits) for a service.' },
    { name: 'DestinationRule', type: 'syntax', desc: 'Istio CRD configuring load balancing, connection pool, and subsets for a destination service.' },
    { name: 'PeerAuthentication', type: 'syntax', desc: 'CRD enforcing mTLS policy: PERMISSIVE (accept plain), STRICT (mTLS only), or DISABLE.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Service Meshes Exist',
      points: [
        'Microservices shift complexity from monolith internals to the network between services — retries, timeouts, circuit breaking, and encryption must happen for every pair of callers.',
        'Implementing this logic in every service library duplicates code across languages and frameworks, creating drift over time as teams update one service but not another.',
        'A service mesh moves this cross-cutting concern into the infrastructure layer — a sidecar proxy runs next to every service and handles the network on its behalf.',
        'The application sees a plain loopback connection; the mesh intercepts traffic transparently via iptables rules injected during pod startup.',
        'Benefits include zero-code-change mTLS encryption, consistent retry/timeout policies, distributed tracing, RED metrics (Rate, Error, Duration) for every endpoint, and traffic shaping for canary deployments.',
        'The trade-off is added complexity, latency overhead (~1–5 ms per hop), and memory cost (~50–100 MB per sidecar) — evaluate these costs before adopting.',
      ],
    },
    {
      heading: 'Control Plane vs Data Plane',
      points: [
        'The data plane is the set of sidecar proxies (typically Envoy) running alongside each service instance — they handle the actual packets.',
        'The control plane is the central component (Istiod in Istio) that tells the data plane what to do — it distributes certificates, route configurations, and policies.',
        'Control plane decisions are pushed to proxies via the xDS API (Listener Discovery Service, Route DS, Cluster DS, Endpoint DS) — proxies reconnect and receive updates dynamically without restarts.',
        'This separation means you can update routing rules or policies in seconds without touching pods — just apply a new CRD and the control plane propagates the change.',
        'The control plane itself is not in the request path — a failure of Istiod does not drop live traffic; existing proxies continue with their last known configuration.',
        'In ambient mesh mode (Istio 1.18+), the data plane moves from per-pod sidecars to per-node ztunnel daemons and optional waypoint proxies, eliminating the per-pod memory cost.',
      ],
    },
    {
      heading: 'Sidecar Proxy Pattern',
      points: [
        'Kubernetes injects the Envoy sidecar via a MutatingAdmissionWebhook — namespaces labelled `istio-injection=enabled` get the container automatically.',
        'Init containers modify iptables rules to redirect all TCP traffic through the sidecar (port 15001 outbound, 15006 inbound) before the app container starts.',
        'The application binds its ports normally; all traffic silently flows through Envoy without requiring any library or code changes.',
        'The sidecar enforces mTLS by presenting a SPIFFE X.509 certificate (issued by Istiod CA) to every peer, verifying the peer\'s certificate in return.',
        'Envoy reports metrics (request count, duration histograms, error codes) and trace spans to a collector; the application emits nothing extra.',
        'Selective injection: annotate a pod with `sidecar.istio.io/inject: "false"` to exclude it (e.g., batch jobs, DaemonSets, or services that must not have traffic intercepted).',
      ],
    },
    {
      heading: 'Core Mesh Capabilities',
      points: [
        'Traffic management: weight-based routing (canary 10%/90%), header-based routing (A/B test), fault injection (add latency or HTTP errors to test resilience), and mirroring (shadow traffic to a staging service).',
        'Security: automatic mTLS between all mesh services, AuthorizationPolicy controlling which service can call which endpoint, JWT claim conditions for end-user auth.',
        'Observability: every request generates metrics, logs, and trace spans — the "golden four" signals (latency, traffic, errors, saturation) appear on Grafana dashboards without any instrumentation.',
        'Service discovery: the mesh integrates with Kubernetes Service objects — no separate service registry needed; Envoy discovers endpoints via EDS from Istiod.',
        'Resiliency: per-route retry configuration (3 attempts, 25 ms per-try timeout, on 5xx/reset), circuit breaker via outlierDetection (eject unhealthy hosts), and timeout enforcement.',
        'Extensibility: Envoy WASM filters and EnvoyFilter CRDs allow custom logic (rate limiting, header manipulation, custom auth) without forking Envoy.',
      ],
    },
    {
      heading: 'When NOT to Use a Service Mesh',
      points: [
        'For small teams or monoliths, the operational overhead outweighs the benefits — a well-configured API gateway and library-based circuit breakers are simpler.',
        'If your services are not containerised or not on Kubernetes, installing a mesh is significantly harder — consider starting with libraries (Hystrix, Polly) instead.',
        'For high-throughput, latency-sensitive workloads (sub-millisecond p99 budgets), the additional 1–5 ms per hop can be unacceptable — benchmark before committing.',
        'If your team lacks Kubernetes expertise, adding a mesh increases blast radius — master Kubernetes networking (Services, Ingress, Network Policies) before layering on a mesh.',
        'Managed service meshes (AWS App Mesh, Google Traffic Director) reduce operational burden if you are already in a single cloud provider and do not need cross-cloud federation.',
        'Consider service mesh when: you have 5+ services, multiple teams, need zero-trust security between services, or need consistent telemetry across polyglot services.',
      ],
    },
    {
      heading: 'Service Mesh Landscape',
      points: [
        'Istio: most feature-rich, CNCF graduated, backed by Google/IBM/Solo.io. Complex to operate but handles every advanced use case. Version 1.22+ defaults to ambient mode.',
        'Linkerd: simpler, lighter, fully CNCF-incubated. Rust-based micro-proxy uses significantly less CPU/memory than Envoy but fewer advanced features. Best for teams wanting simplicity.',
        'Consul Connect: HashiCorp\'s mesh — works beyond Kubernetes (VMs, bare metal) and integrates deeply with Consul service registry. Good for hybrid environments.',
        'AWS App Mesh: AWS-managed, uses Envoy under the hood. Reduces operational overhead for AWS-native workloads but limited portability.',
        'Cilium Service Mesh: eBPF-based, replaces sidecars with kernel-level enforcement. Very low overhead but requires kernel 5.10+ and deeper Linux expertise.',
        'CNCF MAPI / Gateway API: the standard API layer emerging above individual mesh implementations — write HTTPRoute CRDs that work across Istio, Linkerd, Envoy Gateway.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Namespace Injection',
      language: 'bash',
      code: `# Enable automatic sidecar injection for a namespace
kubectl label namespace production istio-injection=enabled

# Verify injection label
kubectl get namespace production --show-labels

# Restart existing pods to pick up the sidecar
kubectl rollout restart deployment -n production

# Check that sidecars are injected (2/2 ready means app + envoy)
kubectl get pods -n production
# NAME                       READY   STATUS    RESTARTS
# payment-svc-7d9f8-xp2k7   2/2     Running   0

# Exclude a specific pod from injection
# (add annotation to Pod spec)
kubectl annotate pod <pod-name> sidecar.istio.io/inject=false`,
    },
    {
      label: 'PeerAuthentication',
      language: 'bash',
      code: `# Enforce mTLS across the entire mesh (namespace scope)
cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT        # Only accept mTLS connections
EOF

# Verify mTLS status between two services
istioctl authn tls-check payment-svc.production.svc.cluster.local

# Check if a specific pod has mTLS enabled
istioctl proxy-config listener <pod-name>.<namespace> \\
  --port 8080 -o json | grep '"mode"'`,
    },
    {
      label: 'Basic VirtualService',
      language: 'bash',
      code: `# Traffic split: 90% stable, 10% canary
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: payment-svc
  namespace: production
spec:
  hosts:
  - payment-svc
  http:
  - route:
    - destination:
        host: payment-svc
        subset: stable
      weight: 90
    - destination:
        host: payment-svc
        subset: canary
      weight: 10
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: payment-svc
  namespace: production
spec:
  host: payment-svc
  subsets:
  - name: stable
    labels:
      version: v1
  - name: canary
    labels:
      version: v2
EOF`,
    },
    {
      label: 'Retries & Timeout',
      language: 'bash',
      code: `# Add retries and per-request timeout
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-svc
  namespace: production
spec:
  hosts:
  - order-svc
  http:
  - route:
    - destination:
        host: order-svc
    timeout: 5s           # Total timeout per request
    retries:
      attempts: 3
      perTryTimeout: 2s   # Each attempt must complete in 2s
      retryOn: "5xx,reset,connect-failure"
EOF

# Fault injection: add 2s delay to 25% of requests (chaos testing)
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: catalog-svc
  namespace: production
spec:
  hosts:
  - catalog-svc
  http:
  - fault:
      delay:
        percentage:
          value: 25
        fixedDelay: 2s
    route:
    - destination:
        host: catalog-svc
EOF`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Missing propagation headers breaks tracing',
      wrong: `// Not forwarding B3/W3C trace headers
const response = await fetch('http://order-svc/orders');`,
      right: `// Forward incoming trace headers to downstream calls
const traceHeaders = ['x-request-id','x-b3-traceid','x-b3-spanid',
  'x-b3-parentspanid','x-b3-sampled','traceparent','tracestate'];
const headers: Record<string,string> = {};
for (const h of traceHeaders) {
  if (req.headers[h]) headers[h] = req.headers[h] as string;
}
const response = await fetch('http://order-svc/orders', { headers });`,
      explanation: 'The mesh creates spans but cannot link them without propagated trace context headers. Each service must forward the incoming B3/W3C headers to downstream calls. The mesh intercepts them but the application must relay them.',
    },
    {
      title: 'PERMISSIVE mode left in production',
      wrong: `# Namespace-level PeerAuthentication using PERMISSIVE
spec:
  mtls:
    mode: PERMISSIVE  # Accepts both plain and mTLS`,
      right: `# Use PERMISSIVE only during migration, then switch to STRICT
spec:
  mtls:
    mode: STRICT  # All traffic must be mTLS`,
      explanation: 'PERMISSIVE mode accepts plain text connections, defeating the purpose of mTLS. It is useful during gradual migration (non-mesh services can still connect) but must be flipped to STRICT once all callers are inside the mesh.',
    },
    {
      title: 'Port naming breaks protocol detection',
      wrong: `# Service port named without protocol prefix
ports:
  - port: 8080
    name: web   # Istio cannot detect HTTP`,
      right: `# Prefix port name with protocol
ports:
  - port: 8080
    name: http-web   # Istio treats as HTTP
  - port: 9090
    name: grpc-rpc   # Istio treats as gRPC`,
      explanation: 'Istio inspects the port name to determine protocol (http, grpc, tcp, tls). Without the prefix, it defaults to TCP and HTTP-specific features (retries, header routing, metrics) do not work correctly.',
    },
    {
      title: 'VirtualService host not matching the Kubernetes Service name',
      wrong: `spec:
  hosts:
  - payment  # Short name without namespace`,
      right: `spec:
  hosts:
  - payment-svc.production.svc.cluster.local  # FQDN
  # OR short name if VS is in the same namespace
  - payment-svc`,
      explanation: 'VirtualService hosts must exactly match the Kubernetes Service name used by callers. Using a different name (alias, partial name) means the VS is never applied to that traffic and routing rules are silently ignored.',
    },
    {
      title: 'AuthorizationPolicy DENY-all without an allow rule locks out health checks',
      wrong: `# Default deny-all with no allow for health endpoints
spec:
  action: DENY
  rules: []`,
      right: `# Deny all but explicitly allow health check paths
spec:
  action: ALLOW
  rules:
  - to:
    - operation:
        paths: ["/healthz", "/ready", "/metrics"]
  - from:
    - source:
        principals: ["cluster.local/ns/production/sa/api-gateway"]`,
      explanation: 'A deny-all policy blocks Kubernetes liveness/readiness probes (from the node, not from within the mesh), causing pods to restart in a crash loop. Always explicitly allow probe paths or use a separate allow policy for them.',
    },
  ];

  challenge: Challenge = {
    title: 'Canary Deploy with Traffic Split',
    language: 'typescript',
    description: `You have a \`checkout-svc\` Kubernetes service with two pod versions:
- v1 pods labelled \`version: stable\`
- v2 pods labelled \`version: canary\`

Write the Istio DestinationRule and VirtualService YAML (as a multi-line string) that:
1. Defines two subsets: \`stable\` and \`canary\` using the version labels
2. Routes 95% of traffic to \`stable\` and 5% to \`canary\`
3. Sets a 3s total timeout and 2 retry attempts on 5xx errors

Return the YAML configuration.`,
    hints: [
      'DestinationRule defines subsets using label selectors',
      'VirtualService route entries use weight: field (must sum to 100)',
      'retries block goes inside the http route entry alongside route',
      'timeout field is at the same level as retries and route',
    ],
    starterCode: `// Return the YAML as a string
function getIstioConfig(): string {
  return \`
# Your DestinationRule + VirtualService YAML here
  \`;
}

console.log(getIstioConfig());`,
    solution: `function getIstioConfig(): string {
  return \`
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: checkout-svc
spec:
  host: checkout-svc
  subsets:
  - name: stable
    labels:
      version: stable
  - name: canary
    labels:
      version: canary
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: checkout-svc
spec:
  hosts:
  - checkout-svc
  http:
  - route:
    - destination:
        host: checkout-svc
        subset: stable
      weight: 95
    - destination:
        host: checkout-svc
        subset: canary
      weight: 5
    timeout: 3s
    retries:
      attempts: 2
      perTryTimeout: 1s
      retryOn: "5xx"
  \`;
}

console.log(getIstioConfig());`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What intercepts traffic between the application and the network in a sidecar-based service mesh?',
      options: ['A Kubernetes NetworkPolicy', 'iptables rules injected by an init container', 'A custom CNI plugin', 'The application\'s HTTP client library'],
      answer: 1,
      explanation: 'An init container modifies iptables rules to redirect all TCP traffic through the Envoy sidecar before the main application container starts. The application does not know traffic is being intercepted.',
    },
    {
      q: 'Which component does NOT sit in the live request path during normal operation?',
      options: ['Envoy sidecar', 'Istiod control plane', 'Prometheus scraper', 'ztunnel (ambient mode)'],
      answer: 1,
      explanation: 'Istiod distributes configuration to proxies but is not in the request path. If Istiod crashes, in-flight requests continue with the last known configuration. Only the data plane (Envoy/ztunnel) processes live traffic.',
    },
    {
      q: 'What does PeerAuthentication with mode: STRICT enforce?',
      options: ['All traffic must use HTTP/2', 'All traffic must use mTLS — plain text connections are rejected', 'Services must authenticate with JWT tokens', 'Only traffic from the same namespace is accepted'],
      answer: 1,
      explanation: 'STRICT mode rejects any connection that does not present a valid mTLS certificate. PERMISSIVE mode accepts both plain and mTLS. DISABLE turns off mTLS entirely for that service.',
    },
    {
      q: 'Why must Kubernetes Service port names be prefixed with the protocol (e.g., "http-web")?',
      options: ['Istio uses the name to route to the correct backend pod', 'Istio inspects port names to determine the application protocol for HTTP-aware features', 'Kubernetes requires protocol prefixes for all named ports', 'It enables TLS termination at the Service level'],
      answer: 1,
      explanation: 'Without a protocol prefix (http-, grpc-, tcp-, tls-), Istio treats the port as raw TCP and HTTP-specific features — retries, header routing, fault injection, and L7 metrics — do not function.',
    },
    {
      q: 'What is the primary advantage of ambient mesh over traditional sidecar mode?',
      options: ['Better mTLS support', 'Eliminates the need for Kubernetes entirely', 'Removes per-pod sidecar containers, dramatically reducing memory overhead', 'Provides L7 routing without needing VirtualService CRDs'],
      answer: 2,
      explanation: 'Ambient mode uses per-node ztunnel daemons (L4 mTLS) instead of per-pod Envoy sidecars, reducing memory overhead by 60–90%. Waypoint proxies provide optional L7 policy for specific services without injecting into every pod.',
    },
    {
      q: 'A service mesh does NOT automatically handle which of the following?',
      options: ['Encrypting traffic between services', 'Collecting request rate and error rate metrics', 'Propagating distributed trace headers between services in application code', 'Retrying failed requests based on HTTP status codes'],
      answer: 2,
      explanation: 'The mesh creates trace spans and reports them but cannot automatically propagate the B3/W3C context headers in the application\'s outgoing HTTP calls. Each service must forward the incoming trace headers to downstream requests — this is the only "code change" required.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between a service mesh and an API gateway?',
      a: 'An <strong>API gateway</strong> handles <strong>north-south</strong> traffic — requests entering from outside the cluster (clients → services). A <strong>service mesh</strong> handles <strong>east-west</strong> traffic — service-to-service communication inside the cluster. They are complementary: the API gateway controls ingress (auth, rate limiting, routing from outside), while the mesh controls internal communication (mTLS, retries, telemetry between services). Many architectures use both.',
    },
    {
      q: 'How does mTLS in a service mesh differ from standard TLS?',
      a: '<strong>Standard TLS</strong>: only the server presents a certificate; the client is anonymous. <strong>mTLS (mutual TLS)</strong>: both client and server present certificates, proving identity in both directions. In a service mesh, identities are SPIFFE SVIDs — X.509 certificates encoding the service\'s Kubernetes service account (e.g., <code>spiffe://cluster.local/ns/production/sa/payment-svc</code>). The mesh issues and rotates these automatically via Istiod\'s CA, so no manual certificate management is needed.',
    },
    {
      q: 'How does a service mesh generate metrics without any application code changes?',
      a: 'The Envoy sidecar intercepts every request and records: <code>istio_requests_total</code> (counter by response code, source, destination, method), <code>istio_request_duration_milliseconds</code> (histogram), and connection metrics. It exposes them on port 15090 <code>/stats/prometheus</code> in Prometheus format. A Prometheus server scrapes each pod\'s sidecar. The application emits nothing — the mesh observes at the proxy layer. Grafana dashboards then visualise these as RED metrics per service.',
    },
    {
      q: 'What is the xDS API and why does it matter?',
      a: 'xDS (x Discovery Service) is the set of gRPC APIs used by Istiod to push configuration to Envoy proxies: <ul><li><strong>LDS</strong> (Listener DS) — TCP listeners and filter chains</li><li><strong>RDS</strong> (Route DS) — HTTP routing rules</li><li><strong>CDS</strong> (Cluster DS) — upstream service definitions</li><li><strong>EDS</strong> (Endpoint DS) — healthy pod IP addresses per cluster</li></ul>Proxies subscribe to changes; Istiod pushes updates within seconds. This means configuration changes (new VirtualService, policy update) propagate to the mesh without pod restarts.',
    },
    {
      q: 'How do you safely migrate to STRICT mTLS without downtime?',
      a: 'Use a phased approach: <ol><li>Apply <code>PeerAuthentication: PERMISSIVE</code> namespace-wide — existing plain-text connections still work.</li><li>Verify all services are injected with sidecars and are communicating over mTLS (use <code>istioctl authn tls-check</code> or Kiali\'s security view).</li><li>Switch to <code>STRICT</code> per namespace, starting with less critical namespaces first. Watch error rates in Grafana.</li><li>After full migration, enforce a cluster-wide STRICT PeerAuthentication in the <code>istio-system</code> namespace.</li></ol>Never jump straight to STRICT without verifying all callers are inside the mesh.',
    },
    {
      q: 'When should you NOT use a service mesh?',
      a: 'Avoid a service mesh when: <ul><li><strong>Small teams / few services</strong>: operational cost outweighs benefits; use library-level circuit breakers instead.</li><li><strong>Very low latency requirements</strong>: each proxy hop adds ~1–5 ms; benchmark first.</li><li><strong>Non-Kubernetes workloads</strong>: most meshes are Kubernetes-native; VM support is complex to configure.</li><li><strong>Team lacks Kubernetes expertise</strong>: a mesh multiplies operational complexity — master the platform before adding a mesh.</li><li><strong>Single-cloud managed services</strong>: AWS App Mesh or Google Traffic Director can be simpler if you don\'t need portability.</li></ul>',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'A service mesh is an infrastructure layer of sidecar proxies (data plane) controlled by a central component (control plane) that manages traffic, security, and observability between microservices without application code changes.',
    mustKnow: [
      'Sidecar proxy pattern: Envoy injected via MutatingAdmissionWebhook, traffic redirected via iptables init container',
      'Control plane (Istiod) vs data plane (Envoy sidecars) — control plane is NOT in the request path',
      'xDS API: LDS → RDS → CDS → EDS — how Istiod pushes configuration to proxies',
      'PeerAuthentication modes: PERMISSIVE (accepts plain + mTLS), STRICT (mTLS only), DISABLE',
      'Kubernetes Service port names must be prefixed with protocol (http-, grpc-, tcp-) for L7 features',
      'Applications must manually forward B3/W3C trace headers in outgoing calls — the only required code change',
      'Ambient mesh: ztunnel (node-level L4) replaces per-pod sidecars, reducing memory 60–90%',
    ],
    interviewFocus: [
      'Control plane vs data plane separation — what happens if Istiod crashes?',
      'How mTLS works in a mesh — SPIFFE identities, automatic cert rotation, PERMISSIVE vs STRICT migration',
      'Why port naming matters — protocol detection for HTTP-aware features',
      'Service mesh vs API gateway — east-west vs north-south, complementary not competing',
      'When NOT to use a mesh — latency, complexity, team maturity, small service count',
    ],
  };
}
