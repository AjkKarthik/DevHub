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
  selector: 'app-mesh-ambient',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './ambient-mesh.html',
  styleUrl: './ambient-mesh.scss',
})
export class MeshAmbient {
  quickRef: QuickRefItem[] = [
    { name: 'ztunnel', type: 'keyword', desc: 'Zero-trust tunnel — per-node DaemonSet proxy handling L4 mTLS and telemetry for Ambient mode. No sidecar injection needed.' },
    { name: 'Waypoint proxy', type: 'keyword', desc: 'Per-namespace (or per-service) Envoy proxy for L7 features in Ambient mode. Deployed only where L7 is needed.' },
    { name: 'HBONE', type: 'keyword', desc: 'HTTP-Based Overlay Network Encapsulation — HTTP/2 CONNECT tunnel used by ztunnel for secure, multiplexed pod-to-pod traffic.' },
    { name: 'L4 vs L7 split', type: 'keyword', desc: 'Ambient splits mesh functionality: ztunnel handles L4 (mTLS, basic authz, telemetry) — Waypoint proxy handles L7 (VirtualService, JWT, RBAC on headers).' },
    { name: 'istio.io/dataplane-mode', type: 'keyword', desc: 'Namespace label "ambient" opts all pods in the namespace into Ambient mode.' },
    { name: 'Gateway API Waypoint', type: 'keyword', desc: 'Waypoint proxies are provisioned via the Kubernetes Gateway API — `kind: Gateway` with `gatewayClassName: istio-waypoint`.' },
    { name: 'SPIFFE', type: 'keyword', desc: 'ztunnel uses SPIFFE SVIDs for workload identity — same identity model as sidecar mode, no re-architecture needed for policies.' },
    { name: 'Sidecar migration', type: 'keyword', desc: 'You can mix sidecar and ambient namespaces in the same cluster. Migrate namespace-by-namespace with no downtime.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is Ambient Mesh and Why It Exists',
      points: [
        'Ambient Mesh is Istio\'s sidecar-free data plane mode, introduced as stable in Istio 1.22 (May 2024). Instead of injecting a proxy container into every pod, Ambient uses shared per-node proxies (ztunnel) and optional per-namespace L7 proxies (Waypoints).',
        'The core problem Ambient solves: sidecar injection adds 50-80MB RAM and 0.2-0.5ms latency per pod, requires init containers (with elevated privileges) for iptables setup, complicates pod lifecycle (proxy must start before app, drain before kill), and adds operational overhead (injection webhook, version skew).',
        'Ambient Mesh decouples "mesh connectivity" from "workload pods" — the mesh infrastructure (ztunnel) runs at the node level, separate from application pods. Pods need no modification, no injection webhook, no special annotations.',
        'The trade-off: Ambient provides less granular per-pod isolation than sidecars (a compromised ztunnel affects all pods on a node), and L7 features require deploying Waypoint proxies (extra resources, extra hop). For pure mTLS + observability without L7 routing, Ambient is ideal.',
        'Ambient is now the recommended Istio deployment mode for new installations (Istio 1.24+). The sidecar mode is not deprecated but Ambient is the direction of the project.',
        'Kubernetes version requirement: Ambient requires Kubernetes 1.26+ and iptables-nft or eBPF (for node-level traffic capture). The CNI plugin must support Ambient — Cilium and Calico both have Ambient support.',
      ],
    },
    {
      heading: 'ztunnel — The L4 Foundation',
      points: [
        'ztunnel (zero-trust tunnel) is a lightweight Rust-based proxy deployed as a DaemonSet — one ztunnel pod per node. It handles all L4 mesh concerns for every pod on that node.',
        'ztunnel\'s responsibilities: establish mTLS connections between pods (using SPIFFE SVIDs issued by Istiod), enforce L4 AuthorizationPolicies (source namespace, source principal), collect L4 telemetry (TCP bytes, connections), and tunnel traffic via HBONE.',
        'HBONE (HTTP-Based Overlay Network Encapsulation): ztunnel tunnels pod-to-pod traffic inside HTTP/2 CONNECT requests. The inner payload is the original TCP stream. HBONE adds metadata (source workload identity) in HTTP headers that ztunnel verifies. This is how mTLS identity is conveyed without touching the pod.',
        'Traffic capture: Ambient uses the Istio CNI plugin (not init containers) to redirect pod traffic to ztunnel on the same node. The CNI plugin runs as a DaemonSet and modifies node-level iptables/eBPF rules — no elevated capabilities needed in pods.',
        'ztunnel resource cost: ~20MB RAM per node (vs 50-80MB per pod). For a 100-pod/10-node cluster, sidecar total = 100×70MB = 7GB; Ambient ztunnel total = 10×20MB = 200MB. Significant at scale.',
        'ztunnel L4 AuthorizationPolicy: you can write AuthorizationPolicies that apply at L4 (source principal, source namespace) and ztunnel enforces them. For L7 policy (path, method, headers, JWT), you need a Waypoint proxy.',
      ],
    },
    {
      heading: 'Waypoint Proxy — L7 on Demand',
      points: [
        'A Waypoint proxy is a standard Envoy proxy (same binary as sidecars) deployed per namespace (or per service) when L7 features are needed: VirtualService routing, JWT validation, header-based AuthorizationPolicy, fault injection, retries, circuit breaking.',
        'Waypoints are provisioned via the Kubernetes Gateway API: create a `Gateway` resource with `gatewayClassName: istio-waypoint` and Istiod creates an Envoy Deployment for it. This is a deliberate design choice — reusing the Gateway API for Waypoint lifecycle.',
        'Waypoint traffic path: ztunnel (source node) → HBONE to ztunnel (destination node) → Waypoint proxy (if L7 needed) → destination pod. Without a Waypoint, ztunnel connects directly to the destination pod.',
        'Waypoint is per-namespace by default (handles all L7 for services in the namespace). You can deploy per-service Waypoints for fine-grained isolation using the `istio.io/use-waypoint` label on individual Services.',
        'Waypoint resource cost: 1 Envoy process per namespace (vs sidecar: 1 per pod). For 50 services in a namespace: Ambient Waypoint = 1 Envoy; sidecars = 50 Envoys. 50× reduction in L7 proxy instances.',
        'L7 AuthorizationPolicy in Ambient: attach the policy to the Waypoint (via `targetRef: kind: Service`) not to the pod. Waypoint enforces the policy before forwarding to the destination pod.',
      ],
    },
    {
      heading: 'Enabling Ambient Mode',
      points: [
        'Install Istio with Ambient support: `istioctl install --set profile=ambient`. This installs Istiod, the istio-cni DaemonSet (for traffic capture), and the ztunnel DaemonSet.',
        'Opt a namespace into Ambient: `kubectl label namespace production istio.io/dataplane-mode=ambient`. All pods in the namespace are immediately enrolled — no restarts, no injection. Traffic is transparently captured by ztunnel.',
        'Ambient is opt-in per namespace. You can have some namespaces in sidecar mode and others in Ambient mode in the same cluster. Cross-mode communication works — ztunnel and sidecars both speak SPIFFE and can verify each other\'s identity.',
        'Add a Waypoint for L7 features: `istioctl waypoint apply --namespace production`. This creates the Gateway resource which Istiod converts into a Waypoint Deployment. Verify: `kubectl get gateway -n production`.',
        'Enable L7 for a specific service: `kubectl label service payment istio.io/use-waypoint=waypoint`. Now only traffic to the payment service goes through the Waypoint; other traffic in the namespace stays L4 only.',
        'Verify Ambient enrollment: `istioctl ztunnel-config workload -n production` — lists all pods enrolled in Ambient mode with their ztunnel assignment. Green status = L4 mTLS active.',
      ],
    },
    {
      heading: 'Ambient vs Sidecar — Choosing the Right Mode',
      points: [
        'Choose Ambient when: pod density is high (memory cost of sidecars is significant), you want mesh features (mTLS, observability) without L7 routing, you run batch jobs or short-lived pods, you want simpler operations (no injection webhook, no init container privileges), or you are doing a greenfield deployment.',
        'Choose Sidecar when: you need per-pod L7 isolation (each pod has independent L7 policy enforcement, not shared by namespace), you run workloads on kernels < 5.10 (Ambient eBPF requires newer kernels), or you have existing sidecar-based tooling (Wasm plugins, EnvoyFilters) that aren\'t Ambient-compatible yet.',
        'Mixed mode: run sidecar namespaces and Ambient namespaces in the same cluster. Istio routes traffic correctly across mode boundaries — a sidecar pod can communicate with an Ambient pod with full mTLS. Migration path: label namespace-by-namespace, verify, proceed.',
        'Ambient limitations (as of Istio 1.24): some advanced EnvoyFilter patterns don\'t apply to ztunnel (which is Rust, not Envoy). Per-pod Wasm plugins are not supported in Ambient mode (Wasm on Waypoints is supported). Multi-cluster Ambient requires specific gateway configuration.',
        'ztunnel node failure: if a node\'s ztunnel crashes, all pods on that node lose mesh connectivity (mTLS, observability) until ztunnel restarts. With sidecars, a proxy crash affects only its pod. This is the key isolation trade-off.',
        'Future direction: Istio\'s roadmap is Ambient-first. Sidecar mode will remain supported but Ambient will receive more investment. New features (Ambient-native multi-cluster, Ambient WasmPlugin) are being added incrementally.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Enable Ambient Mode',
      language: 'bash',
      code: `# Install Istio with Ambient profile
istioctl install --set profile=ambient -y

# Verify components installed
kubectl get pods -n istio-system
# Expected: istiod, istio-cni (DaemonSet), ztunnel (DaemonSet)

# Opt a namespace into Ambient (no pod restarts needed)
kubectl label namespace production istio.io/dataplane-mode=ambient

# Verify pods are enrolled
istioctl ztunnel-config workload -n production
# Shows: pod name, node, ztunnel, status (HEALTHY/UNHEALTHY)

# Test mTLS is working (L4)
kubectl exec deploy/frontend -n production -- \\
  curl -s http://backend:8080/health
# Works! mTLS is transparent — no changes to app code`,
    },
    {
      label: 'Waypoint Proxy (L7)',
      language: 'bash',
      code: `# Add a Waypoint proxy for L7 features in the namespace
istioctl waypoint apply --namespace production
# Creates: Gateway resource → Istiod → Waypoint Deployment

# Verify Waypoint is running
kubectl get gateway -n production
kubectl get pods -n production -l gateway.istio.io/managed=istio.io-mesh-controller

# Apply L7 VirtualService — Waypoint enforces it
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: payment-routing
  namespace: production
spec:
  hosts:
  - payment
  http:
  - match:
    - headers:
        x-version:
          exact: v2
    route:
    - destination:
        host: payment
        subset: v2
  - route:
    - destination:
        host: payment
        subset: v1
EOF

# Waypoint-attached AuthorizationPolicy (L7)
cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: payment-authz
  namespace: production
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: Gateway
    name: waypoint        # Attach to the Waypoint, not the pod
  action: ALLOW
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/production/sa/frontend"]
    to:
    - operation:
        methods: ["POST"]
        paths: ["/api/payment/*"]
EOF`,
    },
    {
      label: 'L4 AuthorizationPolicy',
      language: 'bash',
      code: `# L4 policy enforced by ztunnel (no Waypoint needed)
# Source namespace / principal checks only
cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-cross-namespace
  namespace: production
spec:
  action: DENY
  rules:
  - from:
    - source:
        notNamespaces: ["production", "istio-system"]
EOF

# Verify ztunnel enforces the policy
kubectl exec deploy/attacker -n staging -- \\
  curl -sv http://backend.production:8080/  # Should return 403

kubectl exec deploy/frontend -n production -- \\
  curl -sv http://backend.production:8080/  # Should succeed

# Check ztunnel logs for policy decisions
kubectl logs -n istio-system -l app=ztunnel --follow \\
  | grep "authz"`,
    },
    {
      label: 'Migration from Sidecar',
      language: 'bash',
      code: `# Step 1: Install Istio CNI plugin alongside existing sidecar install
istioctl install --set values.cni.enabled=true -y

# Step 2: Test Ambient on one non-critical namespace first
kubectl label namespace staging istio.io/dataplane-mode=ambient

# Remove sidecar injection label from staging
kubectl label namespace staging istio-injection-

# Restart pods in staging to remove sidecar containers
kubectl rollout restart deployment -n staging

# Step 3: Verify traffic still works
kubectl exec deploy/test -n staging -- curl -s http://backend:8080/health

# Step 4: If L7 needed, add Waypoint
istioctl waypoint apply --namespace staging

# Step 5: Migrate production namespaces one by one
kubectl label namespace production istio.io/dataplane-mode=ambient

# Check ztunnel workload status
istioctl ztunnel-config workload --all-namespaces | grep -v HEALTHY`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Expecting L7 features without a Waypoint proxy',
      wrong: `# Ambient namespace, no Waypoint deployed
# Apply VirtualService expecting traffic splitting
kind: VirtualService
spec:
  http:
  - weight: 80 ... v1
  - weight: 20 ... v2
# Result: VirtualService is IGNORED — ztunnel is L4 only
# All traffic goes to both v1 and v2 with default LB`,
      right: `# First deploy the Waypoint
istioctl waypoint apply --namespace production

# Then apply VirtualService — Waypoint enforces it
kubectl apply -f virtual-service.yaml`,
      explanation: 'ztunnel handles only L4 (TCP/mTLS/basic authz). L7 features (VirtualService routing, JWT validation, header-based policies, retries, fault injection) require a Waypoint proxy in the namespace. Without a Waypoint, L7 Istio resources are silently ignored in Ambient mode.',
    },
    {
      title: 'Applying AuthorizationPolicy to pod selector instead of Waypoint',
      wrong: `# In Ambient mode, policy targeting pod labels
spec:
  selector:
    matchLabels:
      app: payment   # ← targets the pod
  action: ALLOW
  rules:
  - to:
    - operation:
        methods: ["POST"]  # L7 rule
# In Ambient mode, this doesn't work — pods have no sidecar to enforce it`,
      right: `# Attach L7 policy to the Waypoint
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: Gateway
    name: waypoint   # ← targets the Waypoint proxy
  action: ALLOW
  rules:
  - to:
    - operation:
        methods: ["POST"]`,
      explanation: 'In Ambient mode, pods have no sidecar proxy. L7 AuthorizationPolicies must be attached to the Waypoint proxy using `targetRef: kind: Gateway`. Policies using pod `selector` are treated as L4 and enforced by ztunnel (only source principal/namespace checks are supported at L4).',
    },
    {
      title: 'Forgetting the Istio CNI plugin when migrating from sidecar',
      wrong: `# Install Ambient profile directly without CNI consideration
istioctl install --set profile=ambient -y
# If the cluster previously had non-CNI sidecar install:
# ztunnel can't capture traffic → pods lose mesh connectivity`,
      right: `# Install CNI plugin first (if not already present)
istioctl install --set values.cni.enabled=true -y
# Verify CNI DaemonSet is ready
kubectl rollout status daemonset/istio-cni-node -n istio-system
# Then proceed with Ambient enrollment`,
      explanation: 'Ambient mode uses the Istio CNI plugin for traffic capture (vs the iptables init container in sidecar mode). If CNI is not installed, ztunnel cannot capture pod traffic and the namespace appears enrolled but mTLS is not active. Always install and verify the CNI DaemonSet before enrolling namespaces.',
    },
    {
      title: 'Not testing cross-namespace communication after Ambient migration',
      wrong: `# Migrate production to Ambient, assume it works
kubectl label namespace production istio.io/dataplane-mode=ambient
# Don't test cross-namespace traffic from staging (still sidecar mode)
# Discover in production that staging → production traffic is broken`,
      right: `# After labelling, immediately verify cross-mode traffic
kubectl exec deploy/staging-frontend -n staging -- \\
  curl -sv http://payment.production:8080/health

# Also verify Ambient → Ambient
kubectl exec deploy/frontend -n production -- \\
  curl -sv http://payment.production:8080/health`,
      explanation: 'Ambient and sidecar modes can coexist and interoperate, but it\'s not automatic for all network policies. After enrolling a namespace, immediately test both: traffic from sidecar namespaces to the Ambient namespace AND within-Ambient traffic. Test before proceeding to migrate more namespaces.',
    },
    {
      title: 'Comparing ztunnel per-pod isolation to sidecar isolation incorrectly',
      wrong: `# "Ambient gives the same isolation as sidecars"
# Security review approves Ambient assuming each pod has
# independent policy enforcement, like sidecars
# Reality: ztunnel is per-node — a compromised ztunnel
# can see/modify all pod traffic on that node`,
      right: `# Understand the isolation model difference:
# Sidecar: each pod has its OWN proxy — compromise = 1 pod affected
# ztunnel: per-node shared proxy — compromise = all pods on node
# For highest security: use Waypoint (per-namespace Envoy) for L7 enforcement
# ztunnel remains the L4 baseline; Waypoint adds defense in depth`,
      explanation: 'ztunnel is shared across all pods on a node — not per-pod like sidecars. A vulnerability in ztunnel would affect all pods on that node. This is a documented trade-off. For security-sensitive workloads, deploy Waypoint proxies which provide per-namespace enforcement boundaries similar to (but not identical to) per-pod sidecars.',
    },
  ];

  challenge: Challenge = {
    title: 'Design an Ambient Mesh Migration Plan',
    language: 'typescript',
    description: `Write a function that returns a step-by-step migration plan for converting a namespace from sidecar mode to Ambient mode. Include: pre-checks, migration steps, verification, and rollback steps.`,
    hints: [
      'Check if Istio CNI DaemonSet is running first',
      'Label the namespace, remove sidecar injection label',
      'Restart pods to remove sidecar containers',
      'Deploy Waypoint if L7 features are needed',
    ],
    starterCode: `interface MigrationStep {
  step: number;
  action: string;
  command: string;
  verification?: string;
}

function getMigrationPlan(namespace: string, needsL7: boolean): MigrationStep[] {
  return [];
}

console.log(JSON.stringify(getMigrationPlan('production', true), null, 2));`,
    solution: `interface MigrationStep {
  step: number;
  action: string;
  command: string;
  verification?: string;
}

function getMigrationPlan(namespace: string, needsL7: boolean): MigrationStep[] {
  const steps: MigrationStep[] = [
    {
      step: 1,
      action: 'Verify Istio CNI DaemonSet is running',
      command: 'kubectl rollout status daemonset/istio-cni-node -n istio-system',
      verification: 'All pods should be Running',
    },
    {
      step: 2,
      action: 'Verify ztunnel DaemonSet is running',
      command: 'kubectl rollout status daemonset/ztunnel -n istio-system',
      verification: 'One ztunnel pod per node',
    },
    {
      step: 3,
      action: 'Label namespace for Ambient mode',
      command: \`kubectl label namespace \${namespace} istio.io/dataplane-mode=ambient\`,
    },
    {
      step: 4,
      action: 'Remove sidecar injection label',
      command: \`kubectl label namespace \${namespace} istio-injection-\`,
    },
    {
      step: 5,
      action: 'Restart pods to remove sidecar containers',
      command: \`kubectl rollout restart deployment -n \${namespace}\`,
      verification: 'Pods should have 1 container (not 2)',
    },
    {
      step: 6,
      action: 'Verify Ambient enrollment',
      command: \`istioctl ztunnel-config workload -n \${namespace}\`,
      verification: 'All pods should show HEALTHY status',
    },
  ];

  if (needsL7) {
    steps.push({
      step: 7,
      action: 'Deploy Waypoint proxy for L7 features',
      command: \`istioctl waypoint apply --namespace \${namespace}\`,
      verification: 'kubectl get gateway -n ' + namespace,
    });
  }

  steps.push({
    step: needsL7 ? 8 : 7,
    action: 'Rollback if issues: remove Ambient label and re-add sidecar injection',
    command: \`kubectl label namespace \${namespace} istio.io/dataplane-mode- && kubectl label namespace \${namespace} istio-injection=enabled && kubectl rollout restart deployment -n \${namespace}\`,
  });

  return steps;
}

console.log(JSON.stringify(getMigrationPlan('production', true), null, 2));`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary resource difference between Ambient Mesh and sidecar mode for a 100-pod cluster?',
      options: ['Ambient uses more memory — ztunnel adds overhead on top of existing sidecars', 'Ambient uses significantly less memory — ztunnel is ~20MB per node vs ~70MB per pod for sidecars (7× less in this scenario)', 'Memory usage is identical — Ambient trades pod memory for node memory at the same rate', 'Ambient uses more CPU but less memory than sidecar mode'],
      answer: 1,
      explanation: 'In a 100-pod/10-node cluster: sidecars = 100 × 70MB = 7,000MB; ztunnel = 10 × 20MB = 200MB. Ambient is ~35× more memory-efficient for this configuration. The savings compound at scale and when pods are short-lived (no warm-up overhead).',
    },
    {
      q: 'Which component handles L7 features (VirtualService, JWT, header-based policies) in Ambient Mesh?',
      options: ['ztunnel — it handles both L4 and L7', 'The Waypoint proxy — an Envoy process deployed per namespace when L7 is needed', 'Istiod directly — it intercepts and routes HTTP traffic', 'The Istio CNI plugin — it handles all traffic at the kernel level'],
      answer: 1,
      explanation: 'ztunnel handles only L4 (mTLS, basic source-based AuthorizationPolicy, TCP telemetry). L7 features require a Waypoint proxy — a standard Envoy deployment provisioned via the Kubernetes Gateway API. Traffic path with L7: ztunnel → Waypoint → destination pod.',
    },
    {
      q: 'How do you opt a namespace into Ambient mode?',
      options: ['Add annotation `ambient.istio.io/enabled: "true"` to each pod', 'Label the namespace: `kubectl label namespace X istio.io/dataplane-mode=ambient`', 'Install the istio-ambient-agent DaemonSet and it auto-enrolls all namespaces', 'Set `profile=ambient` in the IstioOperator and restart all pods'],
      answer: 1,
      explanation: 'Ambient enrollment is namespace-level: `kubectl label namespace <name> istio.io/dataplane-mode=ambient`. No pod restarts are needed for the initial enrollment — ztunnel starts capturing traffic immediately. You do need to restart pods if you want to REMOVE sidecar containers from previously sidecar-injected pods.',
    },
    {
      q: 'What is HBONE in the context of Ambient Mesh?',
      options: ['A Kubernetes node feature gate for eBPF traffic capture', 'HTTP-Based Overlay Network Encapsulation — the HTTP/2 CONNECT tunnel ztunnel uses for secure pod-to-pod traffic', 'A new Envoy filter type for high-bandwidth connections', 'The Ambient Mesh health check protocol'],
      answer: 1,
      explanation: 'HBONE tunnels pod-to-pod traffic inside HTTP/2 CONNECT requests. The inner payload is the original TCP stream wrapped in mTLS. HBONE headers carry the source workload\'s SPIFFE identity, which the destination ztunnel verifies. This is how Ambient achieves transparent mTLS without sidecars.',
    },
    {
      q: 'What is the key isolation trade-off between ztunnel and per-pod sidecars?',
      options: ['ztunnel provides stronger isolation — it runs in a privileged kernel context', 'ztunnel is per-node (shared) — a compromised ztunnel affects all pods on that node; sidecars are per-pod so a compromise affects only that pod', 'Isolation is identical — both use SPIFFE SVIDs for workload identity', 'Sidecars are less isolated because they share the pod network namespace'],
      answer: 1,
      explanation: 'Per-pod sidecars mean a proxy compromise or misconfiguration affects only that pod\'s traffic. ztunnel is shared across all pods on a node — a ztunnel vulnerability could affect all pods on that node. This is the documented security trade-off. Waypoint proxies (per-namespace Envoy) provide an additional enforcement boundary for sensitive workloads.',
    },
    {
      q: 'Can sidecar mode and Ambient mode coexist in the same Kubernetes cluster?',
      options: ['No — Ambient mode replaces sidecar mode cluster-wide', 'Yes — namespaces can be independently in sidecar or Ambient mode, and cross-mode mTLS works', 'Yes, but sidecar pods cannot communicate with Ambient pods', 'Only during migration — you must complete migration before normal operation'],
      answer: 1,
      explanation: 'Sidecar and Ambient modes coexist peacefully. Each namespace can independently be in sidecar or Ambient mode. Cross-mode communication works because both use SPIFFE SVIDs for identity — ztunnel can establish mTLS with a sidecar proxy and vice versa. This enables incremental, namespace-by-namespace migration with no downtime.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Is Ambient Mesh production-ready? When should I use it vs sidecars?',
      a: 'Ambient Mesh reached stable in Istio 1.22 (May 2024) and is production-ready for most use cases. Use Ambient when: <ul><li>You want mTLS + observability with minimal overhead (no sidecar memory/CPU cost)</li><li>You run batch jobs, ML workloads, or high-density services where sidecar overhead is significant</li><li>You want simpler operations (no injection webhook, no init container privileges)</li><li>You\'re doing a greenfield deployment on Kubernetes 1.26+</li></ul>Consider sidecar when: <ul><li>You need per-pod L7 isolation boundaries (not per-namespace)</li><li>You have existing EnvoyFilter or per-pod Wasm plugins that aren\'t Waypoint-compatible yet</li><li>Your kernel is < 5.10 (Ambient CNI requires modern iptables-nft)</li></ul>Istio\'s official recommendation as of 1.24: prefer Ambient for new installations.',
    },
    {
      q: 'How does ztunnel know the identity of a pod without a sidecar?',
      a: 'ztunnel obtains SPIFFE SVIDs for pods on its node from Istiod via SDS (Secret Discovery Service), same as sidecars. The process: <ol><li>When a pod is enrolled in Ambient, ztunnel requests an SVID for that pod\'s service account from Istiod</li><li>Istiod issues an SVID (X.509 certificate with SPIFFE URI: <code>spiffe://cluster.local/ns/&lt;ns&gt;/sa/&lt;sa&gt;</code>)</li><li>When the pod initiates an outbound connection, ztunnel uses that SVID to establish mTLS to the destination ztunnel</li><li>The destination ztunnel verifies the source SVID, extracts the SPIFFE identity, and uses it for AuthorizationPolicy evaluation</li></ol>The identity model is identical to sidecar mode — same SPIFFE URIs, same certificate format, same policy expressions. Existing AuthorizationPolicies work unchanged.',
    },
    {
      q: 'What happens to a pod\'s traffic if ztunnel crashes or is restarted on its node?',
      a: 'If ztunnel crashes: <ul><li><strong>Immediate effect</strong>: new connections from/to pods on that node lose mesh connectivity (mTLS, observability, L4 policy enforcement)</li><li><strong>Existing connections</strong>: already-established TCP connections may continue briefly (ztunnel manages new-connection setup, not ongoing streams) — depends on CNI implementation</li><li><strong>DaemonSet restart</strong>: Kubernetes restarts the ztunnel pod automatically (DaemonSet controller); typically restarts in < 5s</li><li><strong>During restart gap</strong>: depending on your AuthorizationPolicy strictness, traffic may be blocked (STRICT) or pass through plaintext (PERMISSIVE)</li></ul>Mitigation: set ztunnel\'s resource limits generously and monitor ztunnel pod restarts with an alert. This is the key availability trade-off vs sidecars (where a crash affects only one pod).',
    },
    {
      q: 'How does Waypoint proxy differ from the istio-ingressgateway?',
      a: 'Both are Envoy deployments, but they serve different purposes: <ul><li><strong>istio-ingressgateway</strong>: north-south traffic (external → cluster). Handles TLS termination, JWT auth at the edge, multi-host virtual hosting. Typically 1-2 instances per cluster.</li><li><strong>Waypoint proxy</strong>: east-west traffic within the cluster (service → service). Handles L7 policy enforcement for intra-mesh traffic. 1 per namespace (or per service).</li></ul>Key differences: <ul><li>Waypoints are provisioned via Gateway API (`kind: Gateway`), ingressgateway via IstioOperator</li><li>Waypoints receive traffic from ztunnel (HBONE); ingressgateway receives from external load balancer</li><li>Waypoints enforce mesh-internal L7 policy; ingressgateway enforces edge policy</li><li>Both can run VirtualService routing — but for different traffic flows</li></ul>',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Ambient Mesh removes per-pod sidecars: ztunnel (per-node DaemonSet, Rust) handles L4 mTLS via HBONE tunnels; Waypoint proxy (per-namespace Envoy) handles L7 features when needed. ~35× less memory than sidecars at scale. Stable since Istio 1.22.',
    mustKnow: [
      'ztunnel: per-node DaemonSet, L4 only (mTLS, basic authz, telemetry). ~20MB per node.',
      'Waypoint: per-namespace Envoy (Gateway API), L7 only when needed (VirtualService, JWT, header policies)',
      'HBONE: HTTP/2 CONNECT tunnel carrying mTLS-secured pod traffic with SPIFFE identity headers',
      'Namespace enrollment: kubectl label namespace X istio.io/dataplane-mode=ambient',
      'L7 AuthorizationPolicy: attach to Waypoint via targetRef (not pod selector)',
      'Isolation trade-off: ztunnel is shared per-node (vs per-pod for sidecars)',
      'Sidecar + Ambient can coexist in the same cluster — cross-mode mTLS works',
    ],
    interviewFocus: [
      'What problem does Ambient Mesh solve compared to sidecar injection?',
      'Explain the ztunnel vs Waypoint split — what does each handle?',
      'What is HBONE and why does Ambient need it?',
      'Key trade-off: ztunnel isolation vs sidecar isolation',
      'How do you get L7 features in Ambient mode?',
    ],
  };
}
