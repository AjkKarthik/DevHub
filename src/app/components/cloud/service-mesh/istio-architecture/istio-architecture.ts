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
  selector: 'app-mesh-istio-architecture',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './istio-architecture.html',
  styleUrl: './istio-architecture.scss',
})
export class MeshIstioArchitecture {
  quickRef: QuickRefItem[] = [
    { name: 'Istiod', type: 'keyword', desc: 'Unified control plane process — combines Pilot, Citadel, and Galley into a single binary.' },
    { name: 'Pilot', type: 'keyword', desc: 'Service discovery and traffic management — translates Istio CRDs into xDS config for Envoy.' },
    { name: 'Citadel', type: 'keyword', desc: 'Certificate authority — issues SPIFFE SVIDs to sidecars and rotates certs automatically.' },
    { name: 'Envoy', type: 'keyword', desc: 'High-performance C++ proxy that runs as the sidecar. Implements all data-plane policy.' },
    { name: 'xDS API', type: 'keyword', desc: 'gRPC streaming API (LDS/RDS/CDS/EDS) used by Istiod to push config to Envoy proxies.' },
    { name: 'ServiceEntry', type: 'syntax', desc: 'Istio CRD registering an external service (outside the mesh) so Envoy can route to it.' },
    { name: 'WorkloadEntry', type: 'syntax', desc: 'Registers a non-Kubernetes workload (VM, bare-metal) as a mesh endpoint.' },
    { name: 'istioctl', type: 'keyword', desc: 'Istio CLI — analyze configs, debug proxy state, install/upgrade Istio, and open dashboards.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Istiod — Unified Control Plane',
      points: [
        'Before Istio 1.5, the control plane had three separate components: Pilot (traffic), Citadel (certs), and Galley (config validation). Istiod merges them into one binary, simplifying operations.',
        'Istiod runs as a standard Deployment in the `istio-system` namespace — it is highly available by running multiple replicas with leader election.',
        'Pilot watches Kubernetes API server (Services, Endpoints, namespaces, Istio CRDs) and translates changes into xDS configuration for all registered Envoy proxies.',
        'Citadel (embedded in Istiod) acts as a CA — it issues X.509 certificates to each sidecar using the pod\'s Kubernetes service account identity (SPIFFE SVID format).',
        'Galley (config validation) runs as a ValidatingAdmissionWebhook — it rejects malformed CRDs at apply-time before they reach Pilot, preventing config errors from propagating.',
        'Istiod exposes port 15010 (xDS, unencrypted for bootstrapping), 15012 (xDS, mTLS), and 15014 (control plane metrics).',
      ],
    },
    {
      heading: 'xDS Discovery Protocol',
      points: [
        'xDS (Extensible Discovery Service) is a family of gRPC streaming APIs that Istiod uses to push configuration to Envoy proxies dynamically without restarts.',
        'LDS (Listener Discovery Service) — defines TCP/UDP listeners and filter chains. When Istiod pushes a new LDS response, Envoy starts accepting connections on the described ports.',
        'RDS (Route Discovery Service) — HTTP routing rules (path matching, header conditions, weight splits, retries, timeouts). Referenced by HTTP connection manager filters in listeners.',
        'CDS (Cluster Discovery Service) — upstream service definitions (the set of healthy hosts for a service). Envoy uses this to know where to send traffic.',
        'EDS (Endpoint Discovery Service) — the actual IP:port endpoints within a cluster. Istiod watches Kubernetes Endpoints and pushes updates in milliseconds.',
        'Proxies use Aggregated Discovery Service (ADS) — a single bidirectional stream multiplexing all xDS types, ensuring consistent ordering of updates.',
      ],
    },
    {
      heading: 'Envoy Sidecar Injection Lifecycle',
      points: [
        'A MutatingAdmissionWebhook registered by Istiod intercepts pod creation in labelled namespaces and modifies the pod spec before it is written to etcd.',
        'Two containers are added: the `istio-init` init container (sets iptables rules) and the `istio-proxy` container (the Envoy sidecar).',
        'The init container runs `iptables -t nat -A PREROUTING ...` to redirect all inbound traffic to port 15006 (Envoy) and all outbound traffic to port 15001 (Envoy) except traffic from the Envoy user itself (to avoid loops).',
        'Envoy starts and contacts Istiod on port 15012 using the pod\'s mounted service account JWT as identity. Istiod issues a cert and starts streaming xDS configuration.',
        'Port 15090 serves Prometheus metrics, 15000 is the Envoy admin API (debugging), and 15001/15006 are the transparent proxy ports.',
        'The application binds its normal ports (e.g., 8080) and never knows traffic is proxied — the kernel redirects packets before the application\'s `accept()` call.',
      ],
    },
    {
      heading: 'Service Discovery Integration',
      points: [
        'Istio does not replace Kubernetes service discovery — it builds on top of it. Pilot watches kube-apiserver for Service and Endpoint objects and translates them into Envoy CDS/EDS.',
        'Each Kubernetes Service becomes an Envoy cluster. Endpoints (healthy pod IPs) map to cluster endpoints pushed via EDS.',
        'ServiceEntry CRD extends discovery to external services — define a `spec.hosts` entry for `api.stripe.com` and Envoy will apply Istio policies (retries, mTLS, circuit breaking) to outbound calls to that host.',
        'WorkloadEntry CRD registers VM or bare-metal workloads into the mesh — they receive the same policies as pod-based services without running on Kubernetes.',
        'Sidecar CRD restricts what an Envoy sidecar can see — by default each proxy loads the full mesh topology. In large clusters, scope with `egress.hosts` to reduce config size and memory usage.',
        '`istioctl proxy-config` commands let you inspect what a specific sidecar knows: `proxy-config listener`, `proxy-config route`, `proxy-config cluster`, `proxy-config endpoint`.',
      ],
    },
    {
      heading: 'Istio CRD Hierarchy',
      points: [
        'VirtualService: traffic routing rules targeting a `spec.hosts` entry. Contains http/tcp/tls route blocks with destination, weight, headers, retries, timeout, and fault injection.',
        'DestinationRule: post-routing policy for a destination — load balancing algorithm, connection pool settings, outlierDetection (circuit breaker), and subset definitions by pod labels.',
        'Gateway: configures a standalone gateway pod (istio-ingressgateway) to accept external traffic on specific ports and TLS modes — separate from VirtualService.',
        'AuthorizationPolicy: allow/deny rules evaluated by each sidecar — specifies source (principal, namespace, IP), operation (method, path, port), and condition (JWT claim, header value).',
        'PeerAuthentication: mTLS mode for inbound connections — applies per namespace or workload selector, with port-level overrides.',
        'RequestAuthentication: declares JWT issuer/JWKS for end-user authentication — validates bearer tokens but does not enforce access (that is AuthorizationPolicy\'s job).',
      ],
    },
    {
      heading: 'Debugging Istio with istioctl',
      points: [
        '`istioctl analyze` — runs static analysis of your cluster\'s Istio configuration and reports misconfigurations (e.g., missing DestinationRule, VirtualService targeting a non-existent service).',
        '`istioctl proxy-status` — shows the sync status of every sidecar (whether its LDS/RDS/CDS/EDS is in sync with Istiod). SYNCED = good, NOT SENT = Istiod hasn\'t pushed yet, STALE = proxy has old config.',
        '`istioctl proxy-config <type> <pod>` — inspect the actual xDS config in a running sidecar (listeners, routes, clusters, endpoints, secrets). Essential for understanding what the proxy sees.',
        '`istioctl dashboard kiali` — opens Kiali UI for traffic topology. `istioctl dashboard grafana` opens Grafana. `istioctl dashboard jaeger` opens trace UI.',
        '`istioctl authn tls-check <host>` — reports mTLS mode between the local sidecar and a specific destination service (DR mode + PA mode = effective mode).',
        '`istioctl experimental describe pod <pod>` — human-readable summary of which Istio resources apply to a pod (VirtualServices, AuthorizationPolicies, PeerAuthentication).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'istioctl Debugging',
      language: 'bash',
      code: `# Show sync status of all sidecars
istioctl proxy-status

# Inspect listeners on a specific pod
istioctl proxy-config listener payment-svc-7d9f-xp2k7.production

# Inspect routes (HTTP routing table)
istioctl proxy-config route payment-svc-7d9f-xp2k7.production --name 8080

# Inspect clusters (upstream services)
istioctl proxy-config cluster payment-svc-7d9f-xp2k7.production

# Inspect actual endpoints (pod IPs) for a cluster
istioctl proxy-config endpoint payment-svc-7d9f-xp2k7.production \\
  --cluster "outbound|8080||order-svc.production.svc.cluster.local"

# Run static config analysis
istioctl analyze -n production

# Describe what Istio resources affect a pod
istioctl experimental describe pod payment-svc-7d9f-xp2k7.production`,
    },
    {
      label: 'ServiceEntry',
      language: 'bash',
      code: `# Register an external API so Istio policies apply to it
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: stripe-api
  namespace: production
spec:
  hosts:
  - api.stripe.com
  ports:
  - number: 443
    name: https
    protocol: HTTPS
  location: MESH_EXTERNAL
  resolution: DNS
---
# Now apply a VirtualService with retries for external calls
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: stripe-api
  namespace: production
spec:
  hosts:
  - api.stripe.com
  http:
  - route:
    - destination:
        host: api.stripe.com
        port:
          number: 443
    retries:
      attempts: 3
      perTryTimeout: 5s
      retryOn: "5xx,reset"
    timeout: 15s
EOF`,
    },
    {
      label: 'Sidecar Scoping',
      language: 'bash',
      code: `# Scope what a sidecar can see — reduces memory and config size
# in large clusters (hundreds of services)
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: Sidecar
metadata:
  name: default
  namespace: payment
spec:
  egress:
  - hosts:
    - "./*"            # All services in own namespace
    - "istio-system/*" # Istio system services
    - "production/order-svc.production.svc.cluster.local"
    - "production/catalog-svc.production.svc.cluster.local"
  ingress:
  - port:
      number: 8080
      protocol: HTTP
      name: http
    defaultEndpoint: 0.0.0.0:8080
EOF

# Without scoping, each sidecar loads the full mesh topology
# (thousands of clusters/endpoints in large clusters = OOM risk)`,
    },
    {
      label: 'mTLS TLS Check',
      language: 'bash',
      code: `# Check effective mTLS mode between services
istioctl authn tls-check payment-svc.production.svc.cluster.local

# Output example:
# HOST:PORT                                        STATUS     SERVER     CLIENT
# payment-svc.production.svc.cluster.local:8080   OK         STRICT     ISTIO_MUTUAL

# STATUS OK = both sides agree on mTLS mode
# STATUS CONFLICT = PeerAuthentication and DestinationRule disagree
# This is the #1 mTLS misconfiguration — fix by aligning DR trafficPolicy.tls.mode
# with the PeerAuthentication mode

# Debug certificate details
istioctl proxy-config secret payment-svc-7d9f-xp2k7.production -o json | \\
  jq '.dynamicActiveSecrets[0].secret.tlsCertificate.certificateChain.inlineBytes' | \\
  base64 -d | openssl x509 -text -noout | grep "Subject\\|SAN\\|Validity"`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'VirtualService and DestinationRule in different namespaces',
      wrong: `# VirtualService in "production", DestinationRule in "default"
# — subset "canary" is never found`,
      right: `# Both in the same namespace as the service
kubectl get virtualservice payment-svc -n production
kubectl get destinationrule payment-svc -n production`,
      explanation: 'VirtualService references subsets from DestinationRule by name. If they are in different namespaces, the subset lookup fails silently and Envoy falls back to routing without subsets. Always co-locate VS and DR in the same namespace as the target service.',
    },
    {
      title: 'Forgetting to restart pods after enabling namespace injection',
      wrong: `kubectl label namespace production istio-injection=enabled
# Existing pods are NOT injected — they were already running`,
      right: `kubectl label namespace production istio-injection=enabled
kubectl rollout restart deployment -n production
# New pods get the sidecar injected via the webhook`,
      explanation: 'The MutatingAdmissionWebhook only fires on pod creation. Existing pods keep running without sidecars. You must restart them after labelling the namespace. Use `kubectl rollout restart` for zero-downtime rolling restarts.',
    },
    {
      title: 'Using wildcard hosts in VirtualService without a Gateway',
      wrong: `spec:
  hosts:
  - "*"   # matches everything — causes routing loops`,
      right: `spec:
  hosts:
  - "payment-svc"   # specific service name
  # OR for ingress VirtualService bound to a Gateway:
  gateways:
  - istio-system/ingressgateway
  hosts:
  - "payments.example.com"`,
      explanation: 'A VirtualService with `hosts: ["*"]` in the mesh (without a gateway binding) intercepts ALL outbound traffic, causing routing loops or blocking unrelated services. Only use `"*"` inside a VirtualService that specifies a `gateways:` field for ingress.',
    },
    {
      title: 'Not scoping Sidecar CRD in large clusters causes OOM',
      wrong: `# No Sidecar CRD — each Envoy loads every service in the cluster
# 500+ services × many endpoints = GB of config per sidecar`,
      right: `# Sidecar CRD limiting egress to needed services only
spec:
  egress:
  - hosts:
    - "./*"
    - "production/order-svc.production.svc.cluster.local"`,
      explanation: 'Without a Sidecar CRD, each proxy downloads the entire mesh topology. In clusters with 200+ services, this can use hundreds of MB per sidecar and cause proxy OOM kills. Add a default Sidecar CRD per namespace limiting egress to actually-called services.',
    },
    {
      title: 'Checking mTLS status without checking both PA and DR',
      wrong: `# Only checking PeerAuthentication
kubectl get peerauthentication -n production
# Shows STRICT — but the caller uses DISABLE mode in DR`,
      right: `# Always check BOTH PeerAuthentication AND DestinationRule
istioctl authn tls-check <service>.<namespace>.svc.cluster.local
# STATUS CONFLICT = PA and DR disagree = traffic fails`,
      explanation: 'The effective mTLS mode is the intersection of PeerAuthentication (server side) and DestinationRule trafficPolicy.tls.mode (client side). A CONFLICT means one side expects mTLS and the other sends plain text — all connections fail with handshake errors.',
    },
  ];

  challenge: Challenge = {
    title: 'Debug a Broken VirtualService',
    language: 'typescript',
    description: `A developer applied this VirtualService but traffic still goes to both versions equally (not 90/10):

\`\`\`yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: checkout
  namespace: production
spec:
  hosts:
  - checkout-svc
  http:
  - route:
    - destination:
        host: checkout-svc
        subset: stable
      weight: 90
    - destination:
        host: checkout-svc
        subset: canary
      weight: 10
\`\`\`

List the three most likely causes of this misconfiguration and the istioctl commands to diagnose each one.`,
    hints: [
      'Are the subsets defined anywhere? VirtualService references them but does not define them',
      'Check if the VS and DR are in the same namespace',
      'Use istioctl proxy-config route to see what Envoy actually has',
    ],
    starterCode: `// Return an array of { cause, diagnosis } objects
function debugVirtualService(): Array<{cause: string; diagnosis: string}> {
  return [];
}

console.log(JSON.stringify(debugVirtualService(), null, 2));`,
    solution: `function debugVirtualService(): Array<{cause: string; diagnosis: string}> {
  return [
    {
      cause: "No DestinationRule defining the 'stable' and 'canary' subsets",
      diagnosis: \`kubectl get destinationrule checkout -n production
# If missing, Envoy can't resolve the subsets — traffic goes to all pods equally
# Fix: kubectl apply -f destinationrule-checkout.yaml\`
    },
    {
      cause: "DestinationRule in a different namespace than VirtualService",
      diagnosis: \`# Check where the DR lives
kubectl get destinationrule -A | grep checkout
# Fix: move DR to 'production' namespace (same as VS and Service)\`
    },
    {
      cause: "Pod labels don't match subset selectors in DestinationRule",
      diagnosis: \`# Verify pods have correct version labels
kubectl get pods -n production -l app=checkout-svc --show-labels
# Inspect what Envoy actually sees
istioctl proxy-config cluster <any-pod>.production \\\\
  --fqdn checkout-svc.production.svc.cluster.local
# Fix: ensure pods have version: stable / version: canary labels\`
    },
  ];
}

console.log(JSON.stringify(debugVirtualService(), null, 2));`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which xDS API type delivers the actual pod IP:port endpoints to Envoy?',
      options: ['LDS (Listener Discovery Service)', 'RDS (Route Discovery Service)', 'CDS (Cluster Discovery Service)', 'EDS (Endpoint Discovery Service)'],
      answer: 3,
      explanation: 'EDS delivers the healthy IP:port endpoints within a cluster. CDS defines the cluster (what upstream exists), while EDS populates it with actual pod addresses watched from Kubernetes Endpoints objects.',
    },
    {
      q: 'What is the purpose of the `istio-init` init container?',
      options: ['Download the Envoy binary', 'Set iptables rules to redirect all pod traffic through Envoy', 'Issue the SPIFFE certificate', 'Register the pod with Istiod'],
      answer: 1,
      explanation: 'The init container runs before the app and sidecar containers, setting iptables NAT rules that redirect all TCP traffic through the Envoy sidecar (port 15001 for outbound, 15006 for inbound), except traffic originating from Envoy itself.',
    },
    {
      q: 'What happens if Istiod goes down while the mesh is running?',
      options: ['All service-to-service traffic stops immediately', 'Proxies continue with their last known configuration', 'mTLS certificates expire and connections fail', 'New pods cannot start'],
      answer: 1,
      explanation: 'Envoy proxies cache their last received xDS configuration. If Istiod is unavailable, existing proxies continue routing with stale-but-valid config. New pods cannot be injected or receive initial config, so new deployments are blocked — but live traffic continues.',
    },
    {
      q: 'What is the function of a ServiceEntry CRD?',
      options: ['Defines which namespaces can communicate', 'Registers external services (outside the mesh) so Istio policies apply to them', 'Limits what services a sidecar can route to', 'Defines mTLS requirements for a service'],
      answer: 1,
      explanation: 'ServiceEntry extends the mesh\'s service registry with external endpoints (e.g., a third-party API, a database outside Kubernetes). Without it, Envoy passes traffic to external hosts without applying Istio policies (retries, mTLS, circuit breaking).',
    },
    {
      q: 'What does `istioctl proxy-status` report?',
      options: ['CPU/memory usage of each sidecar', 'Whether each proxy\'s xDS config is in sync with Istiod', 'The mTLS mode for each service', 'HTTP error rates per service'],
      answer: 1,
      explanation: '`proxy-status` shows for each sidecar whether LDS, RDS, CDS, and EDS are SYNCED, NOT SENT, or STALE. STALE means the proxy has config that Istiod has since superseded — useful for spotting proxies that missed an update.',
    },
    {
      q: 'Why should you add a Sidecar CRD in large Istio clusters?',
      options: ['To prevent pods from being injected with sidecars', 'To limit the xDS config each proxy loads, reducing memory usage', 'To enforce mTLS for a specific workload', 'To define egress rules at the cluster network level'],
      answer: 1,
      explanation: 'Without a Sidecar CRD, each Envoy proxy downloads the full mesh topology (clusters/endpoints for every service). In clusters with hundreds of services, this can use GBs of memory across all proxies. Scoping with egress.hosts limits what each proxy loads.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What replaced Pilot, Citadel, and Galley in modern Istio?',
      a: '<strong>Istiod</strong> — introduced in Istio 1.5 (2020). It is a single binary that embeds all three control plane components: Pilot (service discovery and xDS), Citadel (certificate authority, SPIFFE identity), and Galley (config validation via ValidatingAdmissionWebhook). Running a single process simplifies deployment, reduces inter-process communication latency, and makes upgrades easier.',
    },
    {
      q: 'How does Istio handle certificate rotation automatically?',
      a: 'Each sidecar holds a SPIFFE X.509 certificate issued by Istiod\'s built-in CA. Istiod proactively rotates certs before they expire — the default cert TTL is 24 hours and rotation happens at 80% of TTL. The sidecar fetches the new cert via the SDS (Secret Discovery Service) xDS type without restarting. This means: <ul><li>No manual cert management</li><li>Short-lived certs reduce blast radius if a cert is compromised</li><li>Trust bundle (root CA) rotation is also supported for zero-downtime CA migration</li></ul>',
    },
    {
      q: 'What is the difference between CDS and EDS?',
      a: '<strong>CDS (Cluster DS)</strong> defines the <em>logical group</em> of upstream hosts — essentially the Kubernetes Service (name, load balancing policy, connection pool settings). Think of it as "here is a bucket called payment-svc on port 8080." <strong>EDS (Endpoint DS)</strong> fills that bucket with actual <em>pod IP:port addresses</em> currently healthy. Istiod watches Kubernetes Endpoints objects and pushes EDS updates within milliseconds when pods are added or removed. CDS gives structure; EDS gives the live membership.',
    },
    {
      q: 'How does Istio integrate with Kubernetes\'s own service discovery?',
      a: 'Istio\'s Pilot watches the Kubernetes API server for Service, Endpoints, and Namespace objects. It does <em>not</em> replace Kubernetes service discovery — it translates kube objects into Envoy xDS config. Every <code>Service</code> becomes an Envoy cluster, and its <code>Endpoints</code> become the cluster\'s load balancing pool. Istio adds a layer on top: VirtualService/DestinationRule CRDs override how Envoy routes within that cluster (weights, subsets, retries). For external services, <code>ServiceEntry</code> fills in what kube doesn\'t know.',
    },
    {
      q: 'What does STATUS=CONFLICT mean in `istioctl authn tls-check` output?',
      a: 'CONFLICT means the server-side <strong>PeerAuthentication</strong> and the client-side <strong>DestinationRule</strong> <code>trafficPolicy.tls.mode</code> are misaligned. For example, PeerAuthentication says STRICT (server requires mTLS) but the DR says DISABLE (client sends plain text) — every connection fails with a TLS handshake error. Fix by ensuring the DR <code>trafficPolicy.tls.mode: ISTIO_MUTUAL</code> when PeerAuthentication is STRICT.',
    },
    {
      q: 'What port does Envoy listen on for the admin API and what can you do with it?',
      a: 'Envoy\'s admin API runs on <strong>port 15000</strong> (loopback only). Useful endpoints: <ul><li><code>/stats</code> — raw Prometheus-format metrics</li><li><code>/config_dump</code> — full xDS configuration (all listeners, routes, clusters, endpoints) in JSON</li><li><code>/clusters</code> — health status of each upstream cluster</li><li><code>/logging</code> — change Envoy log level at runtime for debugging</li><li><code>/reset_counters</code> — zero stats for a clean measurement</li></ul>Access it via <code>kubectl exec &lt;pod&gt; -c istio-proxy -- curl localhost:15000/stats</code>.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Istiod is the unified Istio control plane (Pilot + Citadel + Galley) that pushes xDS config to Envoy sidecars via streaming gRPC. The data plane is network of Envoy proxies transparently intercepting all pod traffic via iptables.',
    mustKnow: [
      'Istiod = Pilot (xDS/traffic) + Citadel (CA/certs) + Galley (validation) in one binary',
      'xDS API family: LDS (listeners) → RDS (routes) → CDS (clusters) → EDS (endpoints) — pushed via ADS stream',
      'Envoy injection: MutatingAdmissionWebhook + istio-init (iptables) + istio-proxy (Envoy) containers',
      'Istiod failure: live traffic continues with last cached config; new pods cannot receive config',
      'ServiceEntry: extends discovery to external hosts; Sidecar CRD: limits what proxies load (critical for large clusters)',
      'istioctl proxy-status: sync status; proxy-config route/cluster/endpoint: inspect sidecar state',
      'STATUS=CONFLICT in tls-check: PeerAuthentication vs DestinationRule trafficPolicy.tls.mode mismatch',
    ],
    interviewFocus: [
      'Explain xDS — what each type delivers and why ADS ordering matters',
      'What happens when Istiod goes down — why live traffic is unaffected but new deployments stall',
      'CDS vs EDS distinction — logical cluster definition vs live endpoint membership',
      'How to diagnose a broken VirtualService — istioctl analyze, proxy-config route, tls-check',
      'Why Sidecar CRD is essential at scale — proxy memory and config size explosion',
    ],
  };
}
