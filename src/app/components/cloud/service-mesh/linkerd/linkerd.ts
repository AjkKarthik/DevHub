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
  selector: 'app-mesh-linkerd',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './linkerd.html',
  styleUrl: './linkerd.scss',
})
export class MeshLinkerd {
  quickRef: QuickRefItem[] = [
    { name: 'linkerd install', type: 'keyword', desc: 'Installs Linkerd control plane using CLI — generates Kubernetes manifests and applies them.' },
    { name: 'linkerd check', type: 'keyword', desc: 'Pre/post-install health check — validates cert validity, data plane injection, and control plane status.' },
    { name: 'linkerd viz', type: 'keyword', desc: 'Dashboard extension adding Prometheus, Grafana, and the web dashboard to a Linkerd install.' },
    { name: 'linkerd inject', type: 'keyword', desc: 'Injects the Linkerd proxy sidecar into a Kubernetes YAML manifest — pipe through kubectl apply.' },
    { name: 'linkerd-proxy', type: 'keyword', desc: 'Rust-based micro-proxy — ultra-low latency, low memory, written by Buoyant. Alternative to Envoy.' },
    { name: 'ServerAuthorization', type: 'syntax', desc: 'Linkerd CRD for policy — specifies which clients (by ServiceAccount) may access a Server.' },
    { name: 'TrafficSplit', type: 'syntax', desc: 'SMI-compatible CRD for weighted traffic shifting between Kubernetes services.' },
    { name: 'linkerd multicluster', type: 'keyword', desc: 'Extension for cross-cluster service mirroring — makes remote services addressable locally.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Linkerd vs Istio — Philosophy and Architecture',
      points: [
        'Linkerd was the first service mesh (2016, CNCF graduated). Its core philosophy is radical simplicity: do less, do it reliably, and avoid operational complexity.',
        'Where Istio uses Envoy (a general-purpose C++ proxy), Linkerd uses linkerd-proxy — a purpose-built Rust micro-proxy. Linkerd-proxy has no general-purpose config surface, which eliminates an entire class of misconfiguration errors.',
        'Istio control plane: Istiod (unified) + xDS API + ~15 CRDs. Linkerd control plane: destination (service discovery), identity (mTLS cert authority), proxy-injector (webhook) + ~5 CRDs.',
        'Memory footprint: linkerd-proxy uses ~10MB per sidecar vs Envoy\'s ~50-80MB. For clusters with hundreds of pods, this difference is material.',
        'Linkerd does NOT support traffic management at Istio\'s granularity (no DestinationRule-level load-balancing algorithms, no Lua filters). If you need complex routing, Istio or a dedicated ingress is required.',
        'Linkerd is CNCF-graduated (same level as Kubernetes, Prometheus). Istio is also CNCF-graduated. Both are production-grade; Linkerd is simpler to operate; Istio is more feature-rich.',
      ],
    },
    {
      heading: 'Installation and Prerequisites',
      points: [
        'Linkerd requires Kubernetes 1.22+ and a cluster admin kubeconfig. No Helm required — the Linkerd CLI handles install and generates pure Kubernetes manifests.',
        'Pre-install check: `linkerd check --pre` — validates Kubernetes version, available CRDs, cert validity, and RBAC permissions before making any changes.',
        'Install CRDs first: `linkerd install --crds | kubectl apply -f -`. Then install control plane: `linkerd install | kubectl apply -f -`.',
        'Linkerd uses a trust anchor (root CA) + issuer certificate pair for mTLS. In production, use external cert management (cert-manager) to manage the issuer cert — avoid letting Linkerd generate and manage its own root CA.',
        'Extensions are separate: `linkerd viz install | kubectl apply -f -` (dashboard), `linkerd jaeger install | kubectl apply -f -` (tracing), `linkerd multicluster install | kubectl apply -f -` (multi-cluster).',
        'Post-install: `linkerd check` — validates that all control plane pods are running, cert authority is accessible, and the webhook is registered.',
      ],
    },
    {
      heading: 'Workload Injection',
      points: [
        'Automatic injection: annotate the namespace with `linkerd.io/inject: enabled`. All new pods in that namespace receive linkerd-proxy automatically.',
        'Manual injection: `linkerd inject deployment.yaml | kubectl apply -f -` — adds the proxy init container and linkerd-proxy sidecar to the manifest before applying.',
        'Per-pod opt-out: `linkerd.io/inject: disabled` on the Pod spec — excludes individual pods from an injection-enabled namespace.',
        'The proxy injector webhook (admission controller) intercepts pod creation. Unlike Istio, there is no separate `istio-init` iptables container — Linkerd uses a `linkerd-init` container for iptables rules.',
        'After injection, pods show 2 containers: the app and `linkerd-proxy`. Check with `kubectl get pods` — look for `2/2 READY`.',
        '`linkerd check --proxy -n <namespace>` validates that all proxies in a namespace are running the latest version and are healthy.',
      ],
    },
    {
      heading: 'mTLS and Identity',
      points: [
        'Linkerd enables mTLS automatically for all meshed pod-to-pod TCP communication — no configuration required after injection.',
        'Identity is based on Kubernetes ServiceAccount. Each workload gets a SPIFFE SVID (x.509 certificate) issued by the Linkerd identity service, scoped to its ServiceAccount.',
        'Certificate rotation is automatic — proxies request short-lived certificates and rotate them proactively. The cert TTL defaults to 24 hours.',
        'Verify mTLS: `linkerd viz edges -n <ns>` shows per-connection security status. `linkerd viz tap deploy/<name>` shows live traffic with TLS indicators.',
        'In Linkerd, mTLS is on by default for meshed-to-meshed traffic. Non-meshed clients can still connect — Linkerd degrades gracefully without breaking traffic.',
        'Server policy (ServerAuthorization CRD) lets you enforce that ONLY meshed clients with specific ServiceAccounts can reach a service — implementing zero-trust authorization.',
      ],
    },
    {
      heading: 'Traffic Management and SMI',
      points: [
        'Linkerd\'s traffic management is SMI (Service Mesh Interface) compatible — uses TrafficSplit, TrafficMetrics, and HTTPRouteGroup CRDs that are interoperable across mesh implementations.',
        'Weighted traffic splitting (canary): create a TrafficSplit pointing to a stable service and a canary service with weights (e.g., 90/10). Change weights for gradual rollout.',
        'Linkerd integrates with Flagger for automated canary analysis — Flagger drives TrafficSplit weights based on Prometheus success rate metrics.',
        'Retries: per-route annotation `retry-on` on HTTPRoute CRDs. Timeouts: `timeout-ms` annotation. These are simpler than Istio\'s VirtualService but sufficient for most use cases.',
        'For advanced routing (header matching, URI rewrites, JWT-based routing), Linkerd uses the Kubernetes Gateway API HTTPRoute rather than its own CRDs.',
        'Circuit breaking is not built into Linkerd by default — it relies on retries + timeouts + health-based load balancing (EWMA latency-aware) to handle failures instead.',
      ],
    },
    {
      heading: 'Observability and the Dashboard',
      points: [
        '`linkerd viz` extension installs Prometheus, Grafana, and the Linkerd dashboard (all in the `linkerd-viz` namespace). These are bundled for convenience — in production, connect to your existing Prometheus instead.',
        '`linkerd viz dashboard` opens a browser to the Linkerd web UI — shows success rates, latency percentiles (p50/p95/p99), and request volumes per deployment and route.',
        '`linkerd viz stat deploy` — CLI view of golden metrics (success rate, RPS, p99 latency) for all deployments. Very fast and useful for debugging.',
        '`linkerd viz tap deploy/<name>` — live stream of requests and responses, including TLS state, source/destination, and HTTP headers. Essential for debugging without modifying code.',
        'Distributed tracing: `linkerd jaeger` extension adds OpenTelemetry collector and Jaeger. Requires apps to propagate `b3` or `w3c-traceparent` headers — unlike Istio, Linkerd does not generate traces itself.',
        'Prometheus integration: Linkerd-proxy exposes metrics on port 4191. In production, configure your existing Prometheus to scrape these endpoints instead of running Linkerd\'s bundled Prometheus.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Install & Inject',
      language: 'bash',
      code: `# Install Linkerd CLI
curl --proto '=https' --tlsv1.2 -sSfL https://run.linkerd.io/install | sh
export PATH=$HOME/.linkerd2/bin:$PATH

# Pre-install cluster check
linkerd check --pre

# Install CRDs, then control plane
linkerd install --crds | kubectl apply -f -
linkerd install | kubectl apply -f -

# Wait and verify
linkerd check

# Install viz extension (dashboard + Prometheus)
linkerd viz install | kubectl apply -f -
linkerd viz check

# Enable injection for a namespace
kubectl label namespace production linkerd.io/inject=enabled

# Restart deployments to inject proxies
kubectl rollout restart deployment -n production

# Open dashboard
linkerd viz dashboard &`,
    },
    {
      label: 'Traffic Split (Canary)',
      language: 'bash',
      code: `# Two services: myapp (stable v1) and myapp-canary (v2)
# Create a TrafficSplit to route 10% to canary
cat <<EOF | kubectl apply -f -
apiVersion: split.smi-spec.io/v1alpha1
kind: TrafficSplit
metadata:
  name: myapp-split
  namespace: production
spec:
  service: myapp          # The root service clients call
  backends:
  - service: myapp        # Stable backend
    weight: 900m          # 90% (milliunits, total must = 1000m)
  - service: myapp-canary # Canary backend
    weight: 100m          # 10%
EOF

# Check live success rates
linkerd viz stat deploy -n production

# Tap live traffic to see what's hitting canary
linkerd viz tap deploy/myapp-canary -n production

# Shift to 50/50
kubectl patch trafficsplit myapp-split -n production \\
  --type=merge \\
  -p '{"spec":{"backends":[{"service":"myapp","weight":"500m"},{"service":"myapp-canary","weight":"500m"}]}}'`,
    },
    {
      label: 'Authorization Policy',
      language: 'bash',
      code: `# Define what the "web" server exposes
cat <<EOF | kubectl apply -f -
apiVersion: policy.linkerd.io/v1beta1
kind: Server
metadata:
  name: web-server
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: web
  port: 8080
  proxyProtocol: HTTP/2
---
# Only allow traffic from the "api" ServiceAccount
apiVersion: policy.linkerd.io/v1beta1
kind: ServerAuthorization
metadata:
  name: web-allow-api
  namespace: production
spec:
  server:
    name: web-server
  client:
    meshTLS:
      serviceAccounts:
      - name: api-service
        namespace: production
EOF

# Verify mTLS edges
linkerd viz edges deploy -n production

# Tap to confirm TLS is in use
linkerd viz tap deploy/web -n production --namespace production`,
    },
    {
      label: 'Observability CLI',
      language: 'bash',
      code: `# Golden metrics for all deployments
linkerd viz stat deploy -n production

# Output:
# NAME       MESHED   SUCCESS   RPS   LATENCY_P50   LATENCY_P95   LATENCY_P99
# api          1/1   100.00%   3.5rps   1ms           3ms           7ms
# web          2/2    99.82%   8.2rps   2ms           5ms          12ms

# Live tap of a service (shows TLS, method, path, status)
linkerd viz tap deploy/api -n production \\
  --method GET \\
  --path /health

# Per-route metrics (requires HTTPRoute resources)
linkerd viz stat httproute -n production

# Check proxy health in a namespace
linkerd check --proxy -n production

# See the actual certificates in use
linkerd viz edges deploy -n production

# Distributed trace setup (after linkerd jaeger install)
linkerd jaeger check`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting to restart pods after enabling namespace injection',
      wrong: `kubectl annotate namespace production linkerd.io/inject=enabled
# Existing pods keep running without proxies → no mTLS, no metrics`,
      right: `kubectl annotate namespace production linkerd.io/inject=enabled
kubectl rollout restart deployment -n production
# Now all pods have linkerd-proxy → full mTLS and observability`,
      explanation: 'The linkerd-proxy-injector admission webhook fires only at pod creation. Existing pods are not affected by the namespace annotation — you must restart them to inject the proxy.',
    },
    {
      title: 'Using Linkerd\'s bundled Prometheus in production',
      wrong: `linkerd viz install | kubectl apply -f -
# Bundled Prometheus has no persistence — all metrics lost on pod restart`,
      right: `# Use existing Prometheus with Linkerd scrape config
linkerd viz install --set prometheus.enabled=false \\
  --set prometheusUrl=http://prometheus.monitoring.svc:9090 | kubectl apply -f -`,
      explanation: 'Linkerd viz\'s bundled Prometheus is for evaluation only — no persistent storage, no HA, no alerting rules. In production, connect Linkerd to your existing Prometheus by pointing viz at it with `--set prometheusUrl`.',
    },
    {
      title: 'Not using external cert-manager for the Linkerd trust anchor',
      wrong: `linkerd install | kubectl apply -f -
# Linkerd auto-generates its own root CA — no rotation policy, expires after 87600h`,
      right: `# Use cert-manager to manage trust anchor and issuer
# 1. Create trust anchor with cert-manager Certificate CRD
# 2. linkerd install --identity-external-issuer | kubectl apply -f -
# Cert-manager handles rotation automatically`,
      explanation: 'Linkerd\'s auto-generated CA has a very long TTL (10 years) and no automated rotation. When it expires, all mTLS in the cluster breaks. Using cert-manager with a short-lived issuer cert (24h) provides automated rotation and integrates with your PKI.',
    },
    {
      title: 'Expecting Istio-level traffic features from Linkerd',
      wrong: `# Trying to do header-based routing with Linkerd TrafficSplit
spec:
  backends:
  - service: v2
    headers:
      x-user-type: premium  # TrafficSplit does NOT support header matching`,
      right: `# Use Kubernetes Gateway API HTTPRoute for header matching
apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: premium-route
spec:
  rules:
  - matches:
    - headers:
      - name: x-user-type
        value: premium
    backendRefs:
    - name: v2
      port: 8080`,
      explanation: 'SMI TrafficSplit only supports weighted traffic splitting — no header matching, URI matching, or method matching. For sophisticated routing, use Linkerd\'s support for the Kubernetes Gateway API HTTPRoute, which provides header/path/method matching.',
    },
    {
      title: 'Comparing Linkerd and Istio without considering the use case',
      wrong: `# Always choosing Istio because it's "more powerful"
# Result: 8x higher sidecar memory, complex CRDs, harder to debug`,
      right: `# Linkerd for: simple mTLS, observability, low overhead, fast ops
# Istio for: complex routing, JWT auth, WebAssembly filters, multi-cluster
# Choose based on what you actually need`,
      explanation: 'Istio and Linkerd solve the same core problems but with different trade-offs. Linkerd is dramatically simpler to install, operate, and debug, with lower resource overhead. If you don\'t need Istio\'s advanced routing and policy features, Linkerd\'s operational simplicity is a major advantage.',
    },
  ];

  challenge: Challenge = {
    title: 'Design a Linkerd Traffic Split Rollout',
    language: 'typescript',
    description: `You need to safely deploy a new version of the "checkout" service using Linkerd TrafficSplit.

Requirements:
- Start with 5% canary traffic to "checkout-v2"
- Include the root service name "checkout"
- Use milliunits (total must equal 1000m)
- After validation, shift to 50% then to 100%

Return the initial TrafficSplit YAML and describe the rollout steps.`,
    hints: [
      'TrafficSplit weights use milliunits (m) — 50m = 5%, 950m = 95%',
      'Total weights must sum to 1000m',
      'The spec.service is the root service that clients call',
      'backends list the actual services with weights',
    ],
    starterCode: `function getTrafficSplit(canaryPercent: number): string {
  const canaryWeight = canaryPercent * 10;  // convert % to milliunits
  const stableWeight = 1000 - canaryWeight;
  return \`# Your TrafficSplit YAML here\`;
}

console.log('Phase 1 (5% canary):');
console.log(getTrafficSplit(5));`,
    solution: `function getTrafficSplit(canaryPercent: number): string {
  const canaryWeight = canaryPercent * 10;
  const stableWeight = 1000 - canaryWeight;
  return \`apiVersion: split.smi-spec.io/v1alpha1
kind: TrafficSplit
metadata:
  name: checkout-split
  namespace: production
spec:
  service: checkout
  backends:
  - service: checkout
    weight: \${stableWeight}m
  - service: checkout-v2
    weight: \${canaryWeight}m\`;
}

console.log('Phase 1 (5% canary):');
console.log(getTrafficSplit(5));
console.log('\\nPhase 2 (50% split):');
console.log(getTrafficSplit(50));
console.log('\\nPhase 3 (100% to v2):');
console.log(getTrafficSplit(100));`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What proxy does Linkerd use and what language is it written in?',
      options: ['Envoy, C++', 'NGINX, C', 'linkerd-proxy, Rust', 'HAProxy, C'],
      answer: 2,
      explanation: 'Linkerd uses its own micro-proxy called linkerd-proxy, written in Rust by Buoyant. It is purpose-built for Linkerd — not a general-purpose proxy like Envoy. This makes it smaller (~10MB) and faster than Envoy (~50-80MB) but less configurable.',
    },
    {
      q: 'How does Linkerd enable mTLS between services?',
      options: ['You must configure PeerAuthentication CRDs for each service pair', 'mTLS is automatic for all meshed pod-to-pod traffic with no configuration', 'mTLS requires a TLSPolicy to be applied per namespace', 'You must generate certificates and mount them into each pod'],
      answer: 1,
      explanation: 'Linkerd\'s biggest UX advantage is automatic mTLS — all communication between injected pods is secured with mTLS by default, with no CRDs to configure. The identity service issues SPIFFE SVIDs based on Kubernetes ServiceAccounts.',
    },
    {
      q: 'What does `linkerd viz tap` show?',
      options: ['Metrics about resource usage of Linkerd proxies', 'A live stream of HTTP requests through a deployment, including TLS status', 'Certificate expiry times for all services', 'The current TrafficSplit weights for canary deployments'],
      answer: 1,
      explanation: '`linkerd viz tap` is a real-time traffic inspector — it shows live HTTP/gRPC requests and responses flowing through a deployment or pod, including TLS state, HTTP method, path, status code, and latency. It is the fastest way to debug traffic issues without code changes.',
    },
    {
      q: 'What is the unit used for TrafficSplit weights in Linkerd?',
      options: ['Percentage (0-100)', 'Milliunits (total must equal 1000m)', 'Fractional weight (0.0-1.0)', 'Integer ratio (e.g., 9 and 1 for 90/10)'],
      answer: 1,
      explanation: 'Linkerd TrafficSplit uses milliunits (m) where 1000m = 100%. A 90/10 split is `900m` and `100m`. All backend weights must sum to 1000m. This makes it easy to express percentages with one decimal (e.g., 55m = 5.5%).',
    },
    {
      q: 'What is the primary advantage of Linkerd over Istio?',
      options: ['More CRDs for advanced configuration', 'Supports WebAssembly filters for custom protocol processing', 'Dramatically lower operational complexity and resource overhead', 'Better multi-cluster support out of the box'],
      answer: 2,
      explanation: 'Linkerd\'s core advantage is simplicity — fewer CRDs, a smaller proxy footprint, automatic mTLS with no configuration, and easier debugging. For teams that need mTLS, observability, and basic traffic splitting without Istio\'s complexity, Linkerd is significantly easier to operate.',
    },
    {
      q: 'Which Linkerd CRD is used for zero-trust authorization (restricting which clients can reach a service)?',
      options: ['TrafficSplit', 'AuthorizationPolicy', 'ServerAuthorization', 'NetworkPolicy'],
      answer: 2,
      explanation: '`ServerAuthorization` (policy.linkerd.io) specifies which mesh clients (by ServiceAccount) can reach a `Server` (a port on a pod selector). Together, Server + ServerAuthorization implement zero-trust service-to-service authorization in Linkerd.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I choose Linkerd over Istio?',
      a: 'Choose <strong>Linkerd</strong> when: <ul><li>Operational simplicity is a priority — Linkerd has fewer moving parts and is faster to install and debug</li><li>Resource overhead matters — linkerd-proxy uses ~10MB vs Envoy\'s ~50-80MB per sidecar</li><li>You need automatic mTLS, observability, and basic traffic splitting without complex routing</li><li>Your team is smaller or less experienced with service mesh operations</li></ul>Choose <strong>Istio</strong> when: <ul><li>You need advanced traffic routing (header/URI matching, JWT auth, Lua filters)</li><li>You need WebAssembly filter extensions</li><li>You need fine-grained egress control with REGISTRY_ONLY mode</li><li>Your team has existing Istio expertise</li></ul>',
    },
    {
      q: 'How does Linkerd handle certificate rotation?',
      a: 'Linkerd\'s identity service issues <strong>short-lived SPIFFE SVIDs</strong> (x.509 certificates) to each proxy, defaulting to a 24-hour TTL. Proxies proactively request renewals before expiry — rotation is automatic and transparent with no downtime. The trust anchor (root CA) has a longer TTL. In production, use <strong>cert-manager</strong> to manage the issuer certificate — cert-manager automates rotation of the issuer cert that Linkerd\'s identity service uses to sign proxy certificates, providing automated PKI management.',
    },
    {
      q: 'How does Linkerd\'s observability compare to Istio\'s?',
      a: '<strong>Linkerd</strong>: <ul><li>The viz extension provides a polished dashboard, CLI (<code>linkerd viz stat</code>, <code>tap</code>, <code>edges</code>), and bundled Prometheus/Grafana</li><li>Metrics are at the deployment/route level — success rate, RPS, latency percentiles</li><li>Tracing requires app-level header propagation (<code>linkerd jaeger</code> extension)</li><li>The <code>tap</code> command for live traffic inspection is exceptionally useful</li></ul><strong>Istio</strong>: <ul><li>More mature integration with Kiali for topology visualization</li><li>Envoy generates detailed per-filter metrics and access logs</li><li>Better multi-cluster observability</li></ul>For most teams, Linkerd\'s observability is sufficient and easier to use.',
    },
    {
      q: 'What is SMI (Service Mesh Interface) and does Linkerd support it?',
      a: 'SMI is a specification for common service mesh APIs on Kubernetes — a set of CRDs (TrafficSplit, TrafficMetrics, HTTPRouteGroup, TrafficTarget) that work across Istio, Linkerd, Consul Connect, and other meshes. Linkerd has strong SMI support: <ul><li><code>TrafficSplit</code> — canary/weighted routing (fully supported)</li><li><code>TrafficMetrics</code> — standardized golden metrics (supported via viz extension)</li><li><code>HTTPRouteGroup</code> + <code>TrafficTarget</code> — authorization policy (supported)</li></ul>SMI compatibility means tools like Flagger work with Linkerd without modification.',
    },
    {
      q: 'Can Linkerd and Istio coexist in the same cluster?',
      a: 'Technically yes, but it is strongly discouraged. Both install MutatingAdmissionWebhooks for pod injection, and both claim the iptables proxy port (15001 for Istio, 4143 for Linkerd). Pods would have conflicting sidecars if labelled for both meshes. In practice: <ul><li>Some teams run Linkerd for most workloads and Istio for specific namespaces needing advanced routing</li><li>You must carefully control which namespaces are labelled for which mesh</li><li>Debugging cross-mesh communication issues is very complex</li></ul>The safer approach is to pick one mesh for the cluster and use the Kubernetes Gateway API for advanced routing features if choosing Linkerd.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Linkerd is a CNCF-graduated service mesh with a Rust micro-proxy, automatic mTLS, and minimal configuration. It is simpler and lower-overhead than Istio — choose it for mTLS, observability, and traffic splitting without complex routing requirements.',
    mustKnow: [
      'linkerd-proxy: Rust-based micro-proxy, ~10MB vs Envoy ~50-80MB; automatic mTLS, no config needed',
      'Control plane components: destination (service discovery), identity (mTLS CA), proxy-injector (webhook)',
      'Install: install --crds | kubectl apply, then install | kubectl apply, then check',
      'Injection: namespace annotation linkerd.io/inject=enabled + pod restart',
      'Traffic splitting: SMI TrafficSplit with milliunits (total 1000m); no header matching',
      'Observability: linkerd viz stat, tap, edges — live metrics and traffic inspection CLI',
      'ServerAuthorization + Server: zero-trust authorization by ServiceAccount',
    ],
    interviewFocus: [
      'Linkerd vs Istio trade-offs — when to choose each',
      'How Linkerd achieves automatic mTLS (identity service + SPIFFE SVIDs)',
      'linkerd viz tap — what it shows and when you\'d use it',
      'SMI TrafficSplit milliunits — how weighted splitting works',
      'Why cert-manager matters for production Linkerd deployments',
    ],
  };
}
