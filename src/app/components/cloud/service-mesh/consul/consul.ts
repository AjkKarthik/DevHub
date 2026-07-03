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
  selector: 'app-mesh-consul',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './consul.html',
  styleUrl: './consul.scss',
})
export class MeshConsul {
  quickRef: QuickRefItem[] = [
    { name: 'Consul Connect', type: 'keyword', desc: 'Consul\'s service mesh feature — mTLS, intentions (ACL), and traffic management built into the Consul agent.' },
    { name: 'Intentions', type: 'keyword', desc: 'Consul\'s access control for service mesh — allow/deny rules between source and destination services. Coarser than Istio AuthorizationPolicy.' },
    { name: 'Envoy in Consul', type: 'keyword', desc: 'Consul uses Envoy as its data plane (same as Istio) but programs it via consul-dataplane or the Consul xDS server — not Istiod.' },
    { name: 'consul-dataplane', type: 'keyword', desc: 'Modern sidecar mode for Consul on K8s: a single binary (Consul + proxy) per pod, replacing the older consul-client DaemonSet.' },
    { name: 'Service defaults', type: 'keyword', desc: 'Consul CRD: ServiceDefaults — sets protocol (http/grpc/tcp) for a service, required for L7 features.' },
    { name: 'ServiceResolver', type: 'keyword', desc: 'Consul CRD: defines subsets and health filters for a service — equivalent to Istio DestinationRule subsets.' },
    { name: 'ServiceSplitter', type: 'keyword', desc: 'Consul CRD: weighted traffic splitting between service subsets — equivalent to Istio VirtualService weights.' },
    { name: 'ServiceRouter', type: 'keyword', desc: 'Consul CRD: L7 header/path routing to subsets — equivalent to Istio VirtualService HTTP match rules.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Consul Service Mesh Overview',
      points: [
        'Consul (by HashiCorp) is a multi-purpose tool combining service discovery, health checking, key-value store, and service mesh (Consul Connect) in one binary. Unlike Istio which is mesh-only, Consul serves many roles in the HashiCorp ecosystem (often used alongside Vault and Nomad).',
        'Consul Connect is the service mesh layer within Consul. It uses Envoy as its data plane proxy (same proxy binary as Istio) but programs it via Consul\'s own xDS server, not Istiod. This means Consul and Istio are not interoperable at the control plane level — they\'re separate mesh implementations.',
        'Consul\'s identity model uses Consul ACL tokens and service identities defined in the Consul catalog — not SPIFFE SVIDs (though Consul does issue TLS certs to proxies). This is a key difference from Istio\'s SPIFFE/SVID model.',
        'For Kubernetes, Consul is deployed via the official Helm chart. The modern architecture uses `consul-dataplane` (a sidecar binary that includes both Consul client functions and the Envoy proxy manager). Older Consul-on-K8s used a consul-client DaemonSet per node plus Envoy sidecars.',
        'Consul\'s traffic management uses a distinct CRD set: ServiceDefaults (protocol), ServiceResolver (subsets/failover), ServiceSplitter (weighted splits), ServiceRouter (L7 routing), ServiceIntentions (access control). These map roughly to Istio\'s DestinationRule + VirtualService but with different semantics.',
        'Consul multi-datacenter: Consul has native multi-datacenter support via WAN federation (WANFederation) or Consul Mesh Gateways — predating Istio\'s multi-cluster support and with a more mature operational track record in heterogeneous environments (K8s + VMs + bare metal).',
      ],
    },
    {
      heading: 'Consul vs Istio — Key Differences',
      points: [
        'Control plane: Istio uses Istiod (Go) + xDS API to configure Envoy. Consul uses its own Consul server cluster + Consul xDS server to configure Envoy. Neither can manage the other\'s data plane — they are separate mesh implementations.',
        'Identity: Istio uses SPIFFE SVIDs (X.509 certs with `spiffe://` URI SANs, issued by Istiod\'s built-in CA). Consul uses Consul\'s own CA (or Vault-backed CA) issuing certs with `spiffe://` URIs as well — so both are SPIFFE-compatible in format, but issued by different CAs that don\'t trust each other by default.',
        'Service discovery: Istio leverages Kubernetes native service discovery (watches K8s Services/Endpoints). Consul has its own service catalog (services registered via Consul agent or auto-registered by consul-k8s). On Kubernetes, consul-k8s syncs K8s Services to Consul catalog automatically.',
        'Observability: both support Envoy stats → Prometheus → Grafana. Istio has Kiali as a dedicated mesh visualisation tool. Consul has the Consul UI (service graph view) and integrations with Grafana/Jaeger. Kiali is more feature-rich for mesh-specific visualisation.',
        'Complexity: Istio is more complex initially (Istiod, injection webhook, istioctl, many CRDs) but has a larger ecosystem and community. Consul is simpler to start (single binary, fewer CRDs) but brings operational complexity if you\'re already using K8s native tooling (two service registries, Consul + K8s).',
        'Hybrid/VM support: Consul was designed for multi-platform (K8s + VMs + bare metal) from the start. VMs register as Consul services directly. Istio added VM support later (WorkloadEntry) and it\'s still more complex than Consul\'s native VM support.',
      ],
    },
    {
      heading: 'Consul Traffic Management CRDs',
      points: [
        'ServiceDefaults: the first CRD to define for any service. Sets `protocol: http` (or grpc, tcp). Without this, Consul treats all traffic as TCP and L7 features (routing, splitting) are unavailable. Equivalent to Istio\'s port naming convention.',
        'ServiceResolver: defines service subsets (by health check, metadata, or datacenter) and failover rules. Subsets allow you to reference different versions of a service in routing rules. Equivalent to Istio\'s DestinationRule subsets.',
        'ServiceSplitter: percentage-based traffic splitting between service subsets. `weight: 90` to v1, `weight: 10` to v2. Equivalent to Istio\'s VirtualService weighted routing. Requires `ServiceDefaults.protocol: http` and a ServiceResolver with the referenced subsets.',
        'ServiceRouter: L7 routing based on path prefix, headers, HTTP method. Each route specifies a destination service (or subset). Can also set request headers, retry policies, and timeout per route. Equivalent to Istio\'s VirtualService HTTP match rules.',
        'ServiceIntentions: Consul\'s coarser access control. Define allow/deny between source service and destination service, optionally filtered by HTTP path/method. Consul agents enforce these before forwarding traffic. Equivalent to Istio\'s combination of AuthorizationPolicy (for allow/deny) but less granular on JWT/source principal level.',
        'IngressGateway / TerminatingGateway / MeshGateway: Consul\'s gateway CRDs. IngressGateway = north-south (external → mesh). TerminatingGateway = mesh → external services (like Istio ServiceEntry). MeshGateway = cross-datacenter (like Istio east-west gateway).',
      ],
    },
    {
      heading: 'Consul on Kubernetes — Installation and Wiring',
      points: [
        'Install via official Helm chart: `helm install consul hashicorp/consul --set global.name=consul --set connectInject.enabled=true`. The chart installs: Consul servers (StatefulSet), consul-dataplane (injection webhook), sync-catalog (K8s↔Consul sync).',
        'Sidecar injection: add annotation `consul.hashicorp.com/connect-inject: "true"` to pod or set `connectInject.default: true` to auto-inject all pods in labelled namespaces. The injected sidecar is an Envoy proxy managed by consul-dataplane.',
        'Service registration: consul-k8s auto-registers K8s Services in the Consul catalog. The service name in Consul = K8s Service name. Pods behind a Service become Consul service instances.',
        'Health checks: Consul uses K8s liveness/readiness probes or custom Consul health checks. Unhealthy instances are removed from the catalog and stop receiving traffic.',
        'ACL bootstrap: Consul ACLs must be enabled for production (`global.acls.manageSystemACLs: true`). The Helm chart handles ACL bootstrapping. Service-to-service communication requires Intentions (explicit allow or default-allow policy).',
        'Consul UI: the Consul server exposes a web UI at port 8500 (HTTP) or 8501 (HTTPS). Exposes the service catalog, intention editor, key-value store, and a basic service topology graph. Access via `kubectl port-forward svc/consul-ui 8500:80`.',
      ],
    },
    {
      heading: 'Consul Multi-Datacenter and VM Workloads',
      points: [
        'WAN federation: Consul datacenters join via WAN gossip. Services in dc1 can be discovered and routed to from dc2. Uses Mesh Gateways for secure cross-datacenter traffic (SNI-based routing, similar to Istio east-west gateways).',
        'VM registration: VMs install the Consul agent and register services via `consul services register`. The agent joins the Consul cluster via gossip. VM services participate in the mesh exactly like K8s services — Intentions apply, traffic management works, mTLS is provided.',
        'This VM integration is Consul\'s strongest differentiator vs Istio: Consul was built for heterogeneous environments. Registering a VM service is a single CLI command; in Istio it requires WorkloadEntry + WorkloadGroup CRDs plus special VM enrollment (more complex).',
        'Consul Cluster Peering: modern replacement for WAN federation. Two independent Consul clusters (different trust domains) establish a peering connection. Services in each cluster can be exported/imported. The exported services appear in the peer\'s service catalog as `<svc>.svc.peer.consul` DNS names.',
        'Exported services: in cluster peering, services must be explicitly exported (`ExportedServices` CRD) to be visible to peer clusters. This is more intentional (no accidental cross-cluster access) but requires more configuration than Istio\'s transparent multi-cluster discovery.',
        'Consul API Gateway: a modern Kubernetes-native ingress for Consul mesh, using the Kubernetes Gateway API. Replaces the older IngressGateway CRD. Supports HTTP/TCP routing, TLS termination, and JWT authentication at the edge.',
      ],
    },
    {
      heading: 'Choosing Between Consul and Istio',
      points: [
        'Choose Consul when: you have a HashiCorp stack (Vault, Nomad, Terraform) and want native integration; you have VM or bare-metal workloads that need to join the mesh; you want a single tool for service discovery + health checking + KV store + mesh; you prefer simpler initial setup with fewer Kubernetes-specific components.',
        'Choose Istio when: you\'re Kubernetes-native and want the richest L7 policy ecosystem; you need advanced observability (Kiali, distributed tracing with header propagation, Grafana dashboards); you require SPIFFE-native identity; your team is already familiar with the Kubernetes Gateway API; you want access to the largest service mesh community and ecosystem.',
        'Key technical differences at a glance: Istio has stronger L7 policy (more granular AuthorizationPolicy with JWT), better Kubernetes integration (native CRDs, Gateway API from day 1), Ambient Mesh for low-overhead deployments. Consul has better VM support, native multi-datacenter (not just Kubernetes clusters), and is a multi-purpose operations platform.',
        'Migration from Consul to Istio (or vice versa) is non-trivial: different CRDs, different identity models, different control plane APIs. Plan for a parallel-run migration period rather than a cutover.',
        'Hybrid: run both in the same cluster is technically possible but operationally complex. Prefer one mesh per cluster. If you need interoperability between a Consul-managed DC and an Istio-managed cluster, use federation gateways at the edge.',
        'Market reality: Istio is more commonly used in Kubernetes-native organisations; Consul is more common in organisations with heterogeneous infrastructure. Both have commercial support (Google/cloud providers for Istio; HashiCorp/IBM for Consul).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Install Consul Connect',
      language: 'bash',
      code: `# Add HashiCorp Helm repo
helm repo add hashicorp https://helm.releases.hashicorp.com

# Install Consul with Connect (service mesh) enabled
cat <<EOF > consul-values.yaml
global:
  name: consul
  datacenter: dc1
  acls:
    manageSystemACLs: true
  tls:
    enabled: true
    enableAutoEncrypt: true
connectInject:
  enabled: true
  default: false   # Manual injection via annotation
controller:
  enabled: true    # Enable CRD controller (ServiceDefaults, etc.)
ui:
  enabled: true
  service:
    type: ClusterIP
EOF

helm install consul hashicorp/consul \\
  --namespace consul \\
  --create-namespace \\
  -f consul-values.yaml

# Enable mesh injection on a namespace
kubectl label namespace production \\
  consul.hashicorp.com/connect-inject=true

# Inject sidecar on a pod (annotation-based)
# Add to pod spec:
# annotations:
#   consul.hashicorp.com/connect-inject: "true"`,
    },
    {
      label: 'Traffic Management CRDs',
      language: 'bash',
      code: `# Step 1: Set protocol (REQUIRED for L7 features)
cat <<EOF | kubectl apply -f -
apiVersion: consul.hashicorp.com/v1alpha1
kind: ServiceDefaults
metadata:
  name: payment
  namespace: production
spec:
  protocol: http
EOF

# Step 2: Define subsets with ServiceResolver
cat <<EOF | kubectl apply -f -
apiVersion: consul.hashicorp.com/v1alpha1
kind: ServiceResolver
metadata:
  name: payment
  namespace: production
spec:
  subsets:
    v1:
      filter: "Service.Meta.version == v1"
    v2:
      filter: "Service.Meta.version == v2"
  defaultSubset: v1
EOF

# Step 3: Canary split with ServiceSplitter
cat <<EOF | kubectl apply -f -
apiVersion: consul.hashicorp.com/v1alpha1
kind: ServiceSplitter
metadata:
  name: payment
  namespace: production
spec:
  splits:
  - weight: 90
    serviceSubset: v1
  - weight: 10
    serviceSubset: v2
EOF

# Step 4: Header-based routing with ServiceRouter
cat <<EOF | kubectl apply -f -
apiVersion: consul.hashicorp.com/v1alpha1
kind: ServiceRouter
metadata:
  name: payment
  namespace: production
spec:
  routes:
  - match:
      http:
        header:
        - name: x-version
          exact: v2
    destination:
      service: payment
      serviceSubset: v2
  - destination:
      service: payment
      serviceSubset: v1
EOF`,
    },
    {
      label: 'Intentions (Access Control)',
      language: 'bash',
      code: `# Consul Intentions — service-to-service access control
# Default deny: block all traffic unless explicitly allowed
cat <<EOF | kubectl apply -f -
apiVersion: consul.hashicorp.com/v1alpha1
kind: ServiceIntentions
metadata:
  name: payment-intentions
  namespace: production
spec:
  destination:
    name: payment
  sources:
  - name: frontend
    action: allow
    description: "Frontend can call payment"
  - name: "*"
    action: deny
    description: "All other services denied"
EOF

# L7 intention: allow only POST to /api/payment
cat <<EOF | kubectl apply -f -
apiVersion: consul.hashicorp.com/v1alpha1
kind: ServiceIntentions
metadata:
  name: payment-l7-intentions
spec:
  destination:
    name: payment
  sources:
  - name: frontend
    permissions:
    - action: allow
      http:
        methods: ["POST"]
        pathPrefix: /api/payment
    - action: deny   # Deny everything else from frontend
EOF

# Check intention status
consul intention list
kubectl get serviceintentions -n production`,
    },
    {
      label: 'Consul vs Istio Config Comparison',
      language: 'bash',
      code: `# Consul traffic split (ServiceSplitter)
# vs
# Istio traffic split (VirtualService)

# --- CONSUL ---
apiVersion: consul.hashicorp.com/v1alpha1
kind: ServiceSplitter
metadata:
  name: payment
spec:
  splits:
  - weight: 90
    serviceSubset: v1
  - weight: 10
    serviceSubset: v2

# --- ISTIO EQUIVALENT ---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: payment
spec:
  hosts:
  - payment
  http:
  - route:
    - destination:
        host: payment
        subset: v1
      weight: 90
    - destination:
        host: payment
        subset: v2
      weight: 10

# --- CONSUL access control (Intentions) ---
apiVersion: consul.hashicorp.com/v1alpha1
kind: ServiceIntentions
spec:
  destination:
    name: payment
  sources:
  - name: frontend
    action: allow

# --- ISTIO EQUIVALENT (AuthorizationPolicy) ---
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
spec:
  selector:
    matchLabels:
      app: payment
  action: ALLOW
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/production/sa/frontend"]`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting ServiceDefaults.protocol before using L7 routing',
      wrong: `# Apply ServiceSplitter without ServiceDefaults
apiVersion: consul.hashicorp.com/v1alpha1
kind: ServiceSplitter
metadata:
  name: payment
spec:
  splits:
  - weight: 90
    serviceSubset: v1
  - weight: 10
    serviceSubset: v2
# Result: "Error: service protocol must be http for L7 config"`,
      right: `# First set protocol in ServiceDefaults
apiVersion: consul.hashicorp.com/v1alpha1
kind: ServiceDefaults
metadata:
  name: payment
spec:
  protocol: http   # Required before ANY L7 CRD

# Then apply ServiceSplitter`,
      explanation: 'Consul treats all traffic as TCP by default. L7 features (ServiceSplitter, ServiceRouter, L7 Intentions) require the service protocol to be set to http or grpc in ServiceDefaults. Applying L7 CRDs without this produces an error or the rules are silently ignored. Always define ServiceDefaults first.',
    },
    {
      title: 'Confusing Consul Intentions with Kubernetes NetworkPolicy',
      wrong: `# Team assumes Intentions work at the IP/port level like NetworkPolicy
# Creates Intention: frontend → payment ALLOW
# But also has a NetworkPolicy blocking frontend → payment on port 8080
# Result: Intention allows at L7, NetworkPolicy blocks at L3/L4
# Traffic still blocked — NetworkPolicy wins`,
      right: `# Consul Intentions operate at the service mesh layer (L7 via Envoy)
# NetworkPolicy operates at the network layer (L3/L4)
# Both must allow traffic for it to flow
# Either use Intentions only (remove conflicting NetworkPolicy)
# Or align NetworkPolicy to allow mesh-level traffic (port 15006 for Consul sidecar)`,
      explanation: 'Consul Intentions are enforced by the Envoy sidecar proxy at the application layer. Kubernetes NetworkPolicy operates at the network layer (IP/port). Both are independent — a NetworkPolicy blocking traffic at the pod network level will prevent traffic even if an Intention allows it. Ensure NetworkPolicy and Intentions are aligned.',
    },
    {
      title: 'Not enabling ACLs in production Consul deployments',
      wrong: `# Default Consul install (no ACLs)
global:
  acls:
    manageSystemACLs: false   # Default
# Any service can call any other service
# No Intentions enforcement (Intentions exist but are advisory only)
# Compromise of one pod → access to entire mesh`,
      right: `# Enable ACLs from the start
global:
  acls:
    manageSystemACLs: true
# With ACLs: Intentions are enforced
# Default: deny-all when first ALLOW Intention is created
# Services need explicit allow Intentions to communicate`,
      explanation: 'Without Consul ACLs, ServiceIntentions are not enforced — any service can call any other service regardless of Intentions configured. ACLs must be enabled at install time (`manageSystemACLs: true`). Enabling ACLs after the fact on a running cluster requires careful sequencing to avoid service disruption.',
    },
    {
      title: 'Using Consul and Istio mesh features simultaneously on the same pod',
      wrong: `# Pod has both consul.hashicorp.com/connect-inject: "true"
# AND istio-injection enabled on the namespace
# Two proxy sidecars injected: Consul Envoy + Istio Envoy
# iptables rules conflict — double proxy causes loops
# Traffic is broken or double-encrypted`,
      right: `# Use ONE mesh per cluster — not both
# If migrating: disable injection in one, enable in other
# Per-namespace: label namespaces for only ONE mesh
# Consul namespaces:
kubectl label ns consul-ns consul.hashicorp.com/connect-inject=true
# Istio namespaces:
kubectl label ns istio-ns istio-injection=enabled`,
      explanation: 'Running both Consul Connect and Istio sidecar injection on the same pod injects two Envoy proxies with conflicting iptables rules. Both proxies try to intercept all traffic — causing routing loops, double encryption, and unpredictable failures. Choose one mesh per workload (and ideally per cluster).',
    },
    {
      title: 'Treating consul-dataplane like a Consul server',
      wrong: `# Scaling consul-dataplane DaemonSet manually expecting HA
kubectl scale daemonset consul-dataplane --replicas=3
# Error: DaemonSets don't have a replica count
# Or: manually configuring gossip ports thinking it's a Consul server
# consul-dataplane is a sidecar process, not a Consul server`,
      right: `# consul-dataplane is injected PER POD as a sidecar
# Consul SERVERS are the StatefulSet (typically 3 or 5 replicas)
kubectl get statefulset -n consul   # Shows consul servers
kubectl get pods -n consul -l component=server

# Scale Consul servers (not dataplane):
helm upgrade consul hashicorp/consul --set server.replicas=5`,
      explanation: 'consul-dataplane is a sidecar injected into application pods (like Istio\'s istio-proxy). The Consul servers are a separate StatefulSet (typically 3 or 5 replicas for HA). Confusing the two leads to misunderstanding the architecture — consul-dataplane processes don\'t form a Consul cluster; they connect to the Consul server cluster.',
    },
  ];

  challenge: Challenge = {
    title: 'Generate Consul Traffic Config',
    language: 'typescript',
    description: `Write a function that generates all three Consul traffic management CRDs (ServiceDefaults, ServiceSplitter, ServiceRouter) for a canary deployment. Parameters: serviceName, namespace, stableWeight, canaryWeight, canaryHeader.`,
    hints: [
      'ServiceDefaults must set protocol: http',
      'ServiceSplitter uses weight fields summing to 100',
      'ServiceRouter for header-based routing comes BEFORE the default split',
    ],
    starterCode: `interface ConsulTrafficConfig {
  serviceDefaults: string;
  serviceSplitter: string;
  serviceRouter: string;
}

function generateConsulCanary(
  serviceName: string,
  namespace: string,
  stableWeight: number,
  canaryWeight: number,
  canaryHeader: string
): ConsulTrafficConfig {
  return { serviceDefaults: '', serviceSplitter: '', serviceRouter: '' };
}

const config = generateConsulCanary('payment', 'production', 90, 10, 'x-canary');
console.log(config.serviceDefaults);`,
    solution: `interface ConsulTrafficConfig {
  serviceDefaults: string;
  serviceSplitter: string;
  serviceRouter: string;
}

function generateConsulCanary(
  serviceName: string,
  namespace: string,
  stableWeight: number,
  canaryWeight: number,
  canaryHeader: string
): ConsulTrafficConfig {
  const serviceDefaults = \`apiVersion: consul.hashicorp.com/v1alpha1
kind: ServiceDefaults
metadata:
  name: \${serviceName}
  namespace: \${namespace}
spec:
  protocol: http\`;

  const serviceSplitter = \`apiVersion: consul.hashicorp.com/v1alpha1
kind: ServiceSplitter
metadata:
  name: \${serviceName}
  namespace: \${namespace}
spec:
  splits:
  - weight: \${stableWeight}
    serviceSubset: stable
  - weight: \${canaryWeight}
    serviceSubset: canary\`;

  const serviceRouter = \`apiVersion: consul.hashicorp.com/v1alpha1
kind: ServiceRouter
metadata:
  name: \${serviceName}
  namespace: \${namespace}
spec:
  routes:
  - match:
      http:
        header:
        - name: \${canaryHeader}
          exact: "true"
    destination:
      service: \${serviceName}
      serviceSubset: canary
  - destination:
      service: \${serviceName}
      serviceSubset: stable\`;

  return { serviceDefaults, serviceSplitter, serviceRouter };
}

const config = generateConsulCanary('payment', 'production', 90, 10, 'x-canary');
console.log(config.serviceDefaults);
console.log('---');
console.log(config.serviceSplitter);
console.log('---');
console.log(config.serviceRouter);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is Consul Intentions and how does it compare to Istio AuthorizationPolicy?',
      options: ['Intentions are Consul\'s CA certificates; AuthorizationPolicy handles JWT', 'Intentions are Consul\'s service-to-service access control (allow/deny); AuthorizationPolicy is Istio\'s equivalent but with more granular source principal and JWT support', 'They are identical — both use SPIFFE principal matching', 'Intentions are applied at L3 (network); AuthorizationPolicy at L7 (HTTP)'],
      answer: 1,
      explanation: 'Both enforce service-to-service access control in the mesh. Consul Intentions define allow/deny between source and destination service names, optionally filtered by HTTP path/method. Istio AuthorizationPolicy supports richer source matching (SPIFFE principals, namespaces, JWT claims) and more policy actions (ALLOW/DENY/AUDIT). Consul Intentions are simpler but less granular for JWT-based auth.',
    },
    {
      q: 'What does ServiceDefaults do in Consul Connect and why is it required before L7 CRDs?',
      options: ['ServiceDefaults sets the default replica count for a service', 'ServiceDefaults declares the service protocol (http/grpc/tcp) — without it, Consul treats traffic as TCP and L7 routing/splitting CRDs are invalid or ignored', 'ServiceDefaults configures the Consul ACL policy for a service', 'ServiceDefaults sets health check endpoints for the service'],
      answer: 1,
      explanation: 'Consul defaults all service traffic to TCP protocol. L7 features (ServiceSplitter, ServiceRouter, L7 Intentions) require the service to be declared as `protocol: http` or `protocol: grpc` in ServiceDefaults. Without this declaration, applying L7 CRDs either fails with a validation error or the rules are silently ineffective.',
    },
    {
      q: 'What is the primary advantage of Consul over Istio for VM workloads?',
      options: ['Consul uses eBPF for lower overhead on VMs', 'Consul was designed for heterogeneous environments from the start — registering a VM service is a single CLI command; Istio requires WorkloadEntry + WorkloadGroup CRDs plus complex VM enrollment', 'Consul provides better L7 routing for VM services', 'Consul integrates with VM-level hardware security modules by default'],
      answer: 1,
      explanation: 'Consul\'s native multi-platform support (K8s + VMs + bare metal) is its strongest differentiator. Installing the Consul agent on a VM and running `consul services register` joins it to the mesh. Istio requires WorkloadEntry (to define the VM as a mesh endpoint), WorkloadGroup (template), and the `istio-agent` binary with a bootstrap script — significantly more complex.',
    },
    {
      q: 'What is the difference between Consul WAN Federation and Consul Cluster Peering?',
      options: ['WAN Federation is for same-datacenter; Cluster Peering is for cross-region', 'WAN Federation joins clusters at the gossip level (shared catalog); Cluster Peering is a newer model where clusters remain independent and share services explicitly via ExportedServices', 'They are identical — Cluster Peering replaced WAN Federation semantically', 'WAN Federation supports K8s only; Cluster Peering supports VMs only'],
      answer: 1,
      explanation: 'WAN Federation joins multiple datacenters into one shared Consul catalog — services from dc1 are visible in dc2 automatically. Cluster Peering is a newer, more explicit model: clusters remain independent, and services must be explicitly exported (`ExportedServices` CRD) to be visible to peer clusters. Peering is preferred for organisational boundaries (different teams, different trust domains); WAN Federation for tightly coupled datacenters.',
    },
    {
      q: 'Can you run both Consul Connect and Istio on the same Kubernetes pod?',
      options: ['Yes — they use different ports so they don\'t conflict', 'No — both inject Envoy sidecars with conflicting iptables rules, causing routing loops and double encryption', 'Yes — Consul handles L4, Istio handles L7, they complement each other', 'Yes, but only if Consul is in transparent proxy mode'],
      answer: 1,
      explanation: 'Running both meshes on the same pod injects two Envoy proxies. Both set up iptables redirect rules to intercept all pod traffic. The rules from two different injection webhooks conflict — traffic loops between proxies, connections fail, and if both establish mTLS the traffic gets double-encrypted. Choose exactly one mesh per pod/namespace.',
    },
    {
      q: 'How does Consul\'s ServiceSplitter differ from Istio\'s VirtualService for traffic splitting?',
      options: ['ServiceSplitter uses percentage integers (must sum to 100); VirtualService uses arbitrary integers (Istio normalises them)', 'They are functionally identical — just different YAML schemas', 'ServiceSplitter only supports header-based splitting; VirtualService supports weighted splitting', 'ServiceSplitter requires the Gateway API; VirtualService uses Istio CRDs'],
      answer: 0,
      explanation: 'Consul ServiceSplitter uses `weight` values that must sum to 100 (representing percentages). Istio VirtualService uses arbitrary `weight` integers that Istio normalises relative to the total — e.g., weight 1 and 9 means 10% / 90%. Both achieve weighted traffic splitting but have different syntax conventions. Functionally equivalent for basic canary deployments.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I choose Consul over Istio?',
      a: 'Choose Consul when: <ul><li><strong>HashiCorp ecosystem</strong>: already using Vault (for secrets), Nomad (for orchestration), or Terraform — Consul integrates natively with all three</li><li><strong>Heterogeneous infrastructure</strong>: running services on Kubernetes + VMs + bare metal in the same mesh</li><li><strong>Service discovery is a priority</strong>: Consul\'s health-checked service catalog is more mature and widely used outside the mesh context</li><li><strong>Simpler initial setup</strong>: fewer Kubernetes-specific components, single binary for many functions</li><li><strong>Multi-datacenter (non-K8s)</strong>: Consul WAN federation for traditional datacenter federation is more mature than Istio multi-cluster for VM-heavy environments</li></ul>Choose Istio when: <ul><li>Kubernetes-native, no VM workloads</li><li>Rich L7 policy (JWT, SPIFFE, granular AuthorizationPolicy) is required</li><li>You want Ambient Mesh for low-overhead deployments</li><li>Kiali/distributed tracing integration is important</li></ul>',
    },
    {
      q: 'Does Consul also use Envoy as its data plane?',
      a: 'Yes — Consul uses Envoy as its data plane proxy, the same binary as Istio. However, Consul programs Envoy via its own xDS server (the Consul Connect CA and xDS API), not via Istiod. The Envoy configurations are different: <ul><li>Consul generates Envoy config for its own service discovery, Intentions enforcement, and Connect CA-issued certificates</li><li>Istio generates Envoy config for Kubernetes service discovery, AuthorizationPolicy, and Istiod-issued SVIDs</li></ul>The shared use of Envoy is an implementation detail — the two control planes are not interoperable. An Envoy configured by Consul cannot be switched to Istio management without wiping its config.',
    },
    {
      q: 'How does Consul handle certificate rotation for mTLS?',
      a: 'Consul\'s CA (built-in or Vault-backed) issues TLS certificates to each service proxy. The certificate lifecycle: <ol><li>consul-dataplane (or legacy consul-client) requests a certificate from the Consul Connect CA for its service identity</li><li>The CA issues a cert with a short TTL (default: 72 hours for leaf certs)</li><li>consul-dataplane automatically rotates the cert before expiry (at 60% of TTL)</li><li>The new cert is hot-swapped in Envoy via SDS (Secret Discovery Service) — no Envoy restart</li></ol>For Vault-backed CA: Consul sends CSRs to Vault PKI; Vault issues and signs certs. Rotation follows the same lifecycle. Configure `connect.caConfig.LeafCertTTL` in Consul to adjust TTL. The built-in CA root cert has a 10-year TTL by default — rotate proactively every 2-3 years.',
    },
    {
      q: 'What is transparent proxy mode in Consul and how does it compare to Istio\'s iptables approach?',
      a: 'Consul\'s transparent proxy mode (enabled by `consul.hashicorp.com/transparent-proxy: "true"` annotation) automatically intercepts all inbound and outbound traffic from a pod using iptables — similar to Istio\'s iptables redirect approach. Without transparent proxy: <ul><li>Services must explicitly use `localhost:port` (the proxy port) to route through the mesh</li><li>No automatic traffic interception — services must be "Consul-aware"</li></ul>With transparent proxy: <ul><li>All traffic is automatically intercepted, just like Istio</li><li>Services route via DNS or K8s Service name as normal — no code changes needed</li><li>Consul uses the same iptables REDIRECT approach as Istio (port 15001/15006 by default)</li></ul>Transparent proxy mode is recommended for new Consul-on-K8s deployments — it\'s the equivalent of Istio\'s default injection behavior.',
    },
  { q: 'Consul stores its service catalog, health checks, and intentions in its own distributed key-value store rather than as Kubernetes CRDs. What operational consequence does this have for a team used to managing Istio config purely via `kubectl apply` and GitOps?', a: 'Since Consul\'s state lives in its own KV store (backed by the Raft consensus protocol across Consul server nodes) rather than the Kubernetes API server, standard Kubernetes-native tooling that watches/diffs CRDs — kubectl diff, ArgoCD/Flux GitOps sync, kubectl get across namespaces — does not directly see Consul\'s service mesh configuration the way it sees Istio VirtualServices and DestinationRules. Teams running Consul on Kubernetes typically need Consul-specific tooling (the Consul CLI, Consul\'s own UI, or the Consul K8s CRDs that exist as a Kubernetes-native front-end but ultimately sync into Consul\'s own store) to inspect and manage that state, and GitOps workflows need to specifically account for this indirection rather than assuming "everything is just a Kubernetes object" the way a pure-Istio setup would allow.' },
  { q: 'A team migrating from Consul to Istio has a large set of simple service-to-service allow/deny Intentions. Do these translate to Istio AuthorizationPolicy 1:1, or does something get lost or need rethinking in the migration?', a: 'Simple identity-based Intentions (allow api → db) translate reasonably cleanly to an equally simple AuthorizationPolicy matching on source.principals — the core "which service can talk to which" model maps over well. What does NOT translate 1:1 is anything relying on Consul-specific behavior: Consul evaluates intentions with a precedence model based on specificity and precedence value that differs from Istio\'s DENY-then-ALLOW evaluation order, so a set of Consul intentions with subtle precedence interactions can produce a DIFFERENT effective access control outcome if translated naively rule-by-rule into Istio policies without re-verifying the combined behavior. Teams migrating at scale typically re-derive the intended access matrix from first principles and re-express it in Istio\'s model, rather than doing a mechanical 1:1 translation of each intention.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Consul Connect is a multi-purpose service mesh (same Envoy data plane as Istio, different control plane). Traffic managed via ServiceDefaults (protocol) → ServiceResolver (subsets) → ServiceSplitter (weights) → ServiceRouter (L7 match). Intentions = access control. Strong VM support differentiates it from Istio.',
    mustKnow: [
      'Consul uses Envoy data plane but its own xDS server — NOT Istiod. Not interoperable with Istio control plane.',
      'ServiceDefaults.protocol: http required before ANY L7 CRD (ServiceSplitter, ServiceRouter, L7 Intentions)',
      'ServiceIntentions: allow/deny between services — enforced by Envoy sidecar when ACLs enabled',
      'consul-dataplane = sidecar proxy per pod; Consul servers = StatefulSet (3-5 replicas)',
      'VM support: install consul agent + services register — much simpler than Istio WorkloadEntry',
      'Do NOT run both Consul Connect and Istio on the same pod — conflicting iptables injection',
      'Cluster Peering: explicit ExportedServices required; WAN Federation: shared catalog across datacenters',
    ],
    interviewFocus: [
      'Consul vs Istio: same data plane (Envoy), different control planes — when to choose each',
      'Consul CRD chain: ServiceDefaults → ServiceResolver → ServiceSplitter/ServiceRouter',
      'What are Consul Intentions and how do they compare to Istio AuthorizationPolicy?',
      'Why is Consul better for VM workloads than Istio?',
      'What is transparent proxy mode in Consul?',
    ],
  };
}
