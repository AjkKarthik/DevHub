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
  selector: 'app-mesh-istio-install',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './istio-install.html',
  styleUrl: './istio-install.scss',
})
export class MeshIstioInstall {
  quickRef: QuickRefItem[] = [
    { name: 'istioctl install', type: 'keyword', desc: 'Primary installation command — installs Istio using a profile (minimal, default, demo).' },
    { name: 'IstioOperator', type: 'syntax', desc: 'CRD for declarative Istio configuration — use instead of raw istioctl flags in production.' },
    { name: 'Profile', type: 'keyword', desc: 'Preset configuration bundle: minimal (control plane only), default (recommended prod), demo (all features).' },
    { name: 'Revision', type: 'keyword', desc: 'Named Istio install (e.g., 1-22-0) enabling canary upgrades without downtime.' },
    { name: 'istio-injection=enabled', type: 'keyword', desc: 'Namespace label that activates automatic sidecar injection for all pods in that namespace.' },
    { name: 'istioctl verify-install', type: 'keyword', desc: 'Post-install health check — verifies all control plane components are running correctly.' },
    { name: 'Helm values', type: 'keyword', desc: 'Alternative install method using official Istio Helm charts (istio-base, istiod, gateway).' },
    { name: 'istioctl upgrade', type: 'keyword', desc: 'In-place upgrade command that gracefully migrates config and restarts control plane.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Installation Methods',
      points: [
        '`istioctl install` is the recommended method for getting started — it validates your cluster, applies manifests, and runs a health check after completion.',
        'Helm charts (`istio-base`, `istiod`, `gateway`) are preferred in GitOps/CD pipelines because they are declarative, versionable, and compatible with ArgoCD/Flux.',
        'IstioOperator CRD is the most powerful option — you describe the desired Istio state in YAML and istioctl reconciles to match it. Best for custom configurations in production.',
        'Managed service options: Google Cloud GKE Istio (now Anthos Service Mesh), AWS App Mesh (Envoy-based but separate ecosystem), and Azure Service Fabric Mesh.',
        'Always check cluster prerequisites before installing: Kubernetes 1.27+, sufficient RBAC permissions, no conflicting CNI plugins (Calico/Cilium need special config), and PodDisruptionBudgets.',
        'The `demo` profile installs everything (including telemetry add-ons) and is useful for learning but wastes resources in production — use `default` or `minimal` with explicit add-ons.',
      ],
    },
    {
      heading: 'Installation Profiles',
      points: [
        '`minimal`: Installs only the Istiod control plane — no gateways, no add-ons. Use when you manage gateways separately or only need mesh features.',
        '`default`: Recommended for production. Installs Istiod and istio-ingressgateway. No telemetry add-ons — install Prometheus/Grafana/Kiali separately.',
        '`demo`: Everything — Istiod, gateways, Kiali, Jaeger, Grafana, Prometheus. Suitable for evaluation and tutorials, not production (high resource usage, no HA).',
        '`remote`: Used in multi-cluster setups where this cluster connects to an external control plane in another cluster.',
        'Custom profiles are created by extending a base profile in an IstioOperator file — override only what you need (`components`, `values`, `meshConfig`).',
        'Compare profiles: `istioctl profile diff default demo` — shows exactly what the demo profile adds over default, helping you understand what you are enabling.',
      ],
    },
    {
      heading: 'Namespace and Workload Injection',
      points: [
        'Namespace-level injection: `kubectl label namespace <ns> istio-injection=enabled`. All pods created after labelling receive the sidecar automatically.',
        'Pod-level opt-in: if the namespace is not labelled, add `sidecar.istio.io/inject: "true"` annotation to the Pod spec to inject individual pods.',
        'Pod-level opt-out: add `sidecar.istio.io/inject: "false"` to exclude specific pods from an injection-enabled namespace (batch jobs, monitoring agents).',
        'Revision-based injection: when using canary upgrades, label the namespace with `istio.io/rev=1-22-0` instead of `istio-injection=enabled` to target a specific Istio revision.',
        'Verify injection: `kubectl get pods -n <ns>` — pods should show `2/2 READY` (app + istio-proxy). Only `1/1` means injection did not happen.',
        'Manual injection (debugging): `istioctl kube-inject -f deployment.yaml | kubectl apply -f -` — applies sidecar injection without the webhook, useful for testing templates.',
      ],
    },
    {
      heading: 'Canary Upgrades with Revisions',
      points: [
        'Production upgrades should use revisions to avoid a big-bang cutover. Install the new Istio version alongside the old one under a different revision name.',
        'Install the new version: `istioctl install --set revision=1-22-0`. This runs a second Istiod alongside the existing one — both control planes are live simultaneously.',
        'Migrate namespaces incrementally: change the label from `istio.io/rev=1-21-0` to `istio.io/rev=1-22-0` on one namespace at a time. Restart pods to pick up the new sidecar.',
        'Validate each namespace after migration using `istioctl proxy-status` and check application error rates. Roll back a namespace by reverting the label if issues appear.',
        'Once all namespaces are migrated, uninstall the old revision: `istioctl uninstall --revision 1-21-0`.',
        'In-place upgrade (`istioctl upgrade`) is simpler but has higher risk — all namespaces switch simultaneously with no rollback path for partially-migrated state.',
      ],
    },
    {
      heading: 'IstioOperator Configuration',
      points: [
        'IstioOperator is the recommended way to manage complex Istio configurations — it is a declarative CRD that istioctl reconciles, similar to how Helm manages releases.',
        'Key sections: `spec.profile` (base), `spec.components` (enable/disable/configure Istiod, gateways), `spec.values` (Helm-style values for fine-tuning), `spec.meshConfig` (global mesh settings).',
        '`meshConfig.accessLogFile: /dev/stdout` enables Envoy access logs — essential for debugging traffic issues but adds CPU cost in high-traffic environments.',
        '`meshConfig.defaultConfig.holdApplicationUntilProxyStarts: true` prevents the application container from starting before Envoy is ready, fixing race condition startup failures.',
        '`meshConfig.outboundTrafficPolicy.mode: REGISTRY_ONLY` blocks all egress to unregistered external hosts — security hardening requiring explicit ServiceEntry for every external call.',
        'Export the current IstioOperator state: `istioctl manifest generate > current.yaml` to see exactly what manifests Istio is managing — useful for GitOps.',
      ],
    },
    {
      heading: 'Post-Install Verification',
      points: [
        '`istioctl verify-install` — checks that all expected Kubernetes resources (Deployments, Services, ConfigMaps, CRDs) exist and are healthy.',
        '`istioctl proxy-status` — shows the xDS sync state of every injected sidecar. All should be SYNCED immediately after install.',
        'Deploy the bookinfo sample app (`kubectl apply -f samples/bookinfo/platform/kube/bookinfo.yaml`) to validate end-to-end traffic management, mTLS, and telemetry.',
        'Check that CRDs are installed: `kubectl get crd | grep istio` — should list 15+ Istio CRDs (VirtualService, DestinationRule, Gateway, etc.).',
        'Verify Istiod health: `kubectl -n istio-system get pods` — all should be Running. Check logs with `kubectl -n istio-system logs deploy/istiod`.',
        'Check MutatingAdmissionWebhook: `kubectl get mutatingwebhookconfiguration istio-sidecar-injector` — must exist for automatic injection to work.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'istioctl Install',
      language: 'bash',
      code: `# Download istioctl
curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.22.0 sh -
cd istio-1.22.0
export PATH=$PWD/bin:$PATH

# Install with default profile (recommended for production)
istioctl install --set profile=default -y

# Verify installation
istioctl verify-install

# Enable injection on your namespace
kubectl label namespace production istio-injection=enabled

# Deploy and restart your workloads
kubectl rollout restart deployment -n production

# Confirm sidecars are injected (look for 2/2 READY)
kubectl get pods -n production`,
    },
    {
      label: 'IstioOperator YAML',
      language: 'bash',
      code: `# Production-grade IstioOperator configuration
cat <<EOF > istio-config.yaml
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  name: production-istio
  namespace: istio-system
spec:
  profile: default
  meshConfig:
    accessLogFile: /dev/stdout          # Enable access logs
    holdApplicationUntilProxyStarts: true
    outboundTrafficPolicy:
      mode: REGISTRY_ONLY               # Block unknown egress
    defaultConfig:
      concurrency: 2                    # Envoy worker threads per pod
  components:
    ingressGateways:
    - name: istio-ingressgateway
      enabled: true
      k8s:
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        hpaSpec:
          minReplicas: 2
          maxReplicas: 5
  values:
    global:
      proxy:
        resources:
          requests:
            cpu: 10m
            memory: 40Mi
          limits:
            cpu: 200m
            memory: 256Mi
EOF

istioctl install -f istio-config.yaml -y`,
    },
    {
      label: 'Canary Upgrade',
      language: 'bash',
      code: `# Step 1: Install new Istio version alongside old (revision-based)
istioctl install --set revision=1-22-0 --set profile=default -y

# Step 2: Verify both control planes are running
kubectl -n istio-system get pods | grep istiod
# istiod-1-21-0-xxx   1/1   Running
# istiod-1-22-0-xxx   1/1   Running

# Step 3: Migrate one namespace at a time
# Remove old label, add new revision label
kubectl label namespace staging \\
  istio-injection-   \\
  istio.io/rev=1-22-0

# Restart pods in that namespace
kubectl rollout restart deployment -n staging

# Step 4: Verify proxies are synced to new control plane
istioctl proxy-status | grep staging

# Step 5: After validating all namespaces, remove old revision
istioctl uninstall --revision 1-21-0 -y
kubectl delete ns istio-system-1-21-0  # If separate`,
    },
    {
      label: 'Helm Install',
      language: 'bash',
      code: `# Alternative: install via official Helm charts (GitOps-friendly)
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update

# 1. Install base CRDs and cluster resources
helm install istio-base istio/base \\
  -n istio-system --create-namespace \\
  --set defaultRevision=default

# 2. Install Istiod control plane
helm install istiod istio/istiod \\
  -n istio-system \\
  --set telemetry.enabled=true \\
  --set meshConfig.accessLogFile=/dev/stdout \\
  --wait

# 3. Install ingress gateway (separate chart)
helm install istio-ingressgateway istio/gateway \\
  -n istio-ingress --create-namespace

# Verify
helm list -n istio-system
istioctl verify-install`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using demo profile in production',
      wrong: `istioctl install --set profile=demo -y
# Installs telemetry add-ons with no HA — crashes under load`,
      right: `istioctl install --set profile=default -y
# Then install Prometheus/Grafana/Kiali separately with proper HA`,
      explanation: 'The demo profile is for learning — it installs Jaeger, Kiali, Grafana with single replicas and no resource limits. In production, use the default profile and deploy observability add-ons from their official Helm charts with proper resource requests and HA configuration.',
    },
    {
      title: 'Not restarting pods after enabling injection',
      wrong: `kubectl label namespace production istio-injection=enabled
# Existing pods keep running without sidecars → mixed mTLS state`,
      right: `kubectl label namespace production istio-injection=enabled
kubectl rollout restart deployment -n production
# All pods now have sidecars — consistent mTLS state`,
      explanation: 'The MutatingAdmissionWebhook only fires at pod creation. Labelling the namespace does not inject existing pods. Running a mix of injected and non-injected pods causes mTLS conflicts if PeerAuthentication is STRICT.',
    },
    {
      title: 'In-place upgrade without testing on a canary namespace first',
      wrong: `istioctl upgrade
# All namespaces switch simultaneously — no rollback if things break`,
      right: `# Use revision-based canary upgrade
istioctl install --set revision=1-22-0 --set profile=default
kubectl label namespace staging istio.io/rev=1-22-0
# Test staging → then migrate production namespaces one by one`,
      explanation: 'In-place upgrade (`istioctl upgrade`) replaces the control plane atomically. If the new version has a breaking change or performance regression, all namespaces are affected simultaneously. Revision-based canary upgrades allow per-namespace rollback.',
    },
    {
      title: 'REGISTRY_ONLY mode without ServiceEntry for external services',
      wrong: `# meshConfig.outboundTrafficPolicy.mode: REGISTRY_ONLY
# → all calls to api.stripe.com, s3.amazonaws.com fail with 502`,
      right: `# Add ServiceEntry for each external host
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: aws-s3
spec:
  hosts: ["s3.amazonaws.com"]
  ports: [{ number: 443, name: https, protocol: HTTPS }]
  location: MESH_EXTERNAL
  resolution: DNS`,
      explanation: 'REGISTRY_ONLY blocks all outbound traffic to unregistered hosts — an effective security posture but requires explicit ServiceEntry for every third-party service your pods call. Missing a ServiceEntry causes silent 502 errors that look like application bugs.',
    },
    {
      title: 'Race condition: app starts before Envoy is ready',
      wrong: `# App container starts immediately, before Envoy is ready
# → first outbound calls fail with connection refused`,
      right: `# IstioOperator meshConfig
meshConfig:
  defaultConfig:
    holdApplicationUntilProxyStarts: true
# App container waits for Envoy to report ready before starting`,
      explanation: 'Without `holdApplicationUntilProxyStarts: true`, the app and Envoy start concurrently. If the app makes outbound calls in its startup routine (DB connection, service discovery) before Envoy has the iptables rules active, those calls fail. This flag adds a readiness gate.',
    },
  ];

  challenge: Challenge = {
    title: 'Write a Production IstioOperator Config',
    language: 'typescript',
    description: `You need to configure Istio for a production cluster with these requirements:
- Use the \`default\` profile
- Enable access logs to stdout
- Prevent app containers starting before Envoy is ready
- Ingress gateway: min 2 replicas, max 5 replicas, 100m/128Mi requests
- Block all egress to external services not explicitly registered
- Sidecar memory limit: 256Mi

Return the IstioOperator YAML as a string.`,
    hints: [
      'meshConfig.accessLogFile controls access logs',
      'holdApplicationUntilProxyStarts prevents race conditions',
      'outboundTrafficPolicy.mode: REGISTRY_ONLY blocks unknown egress',
      'k8s.hpaSpec on ingressGateway controls HPA settings',
      'global.proxy.resources sets sidecar resource limits',
    ],
    starterCode: `function getIstioOperatorConfig(): string {
  return \`# Your IstioOperator YAML here\`;
}
console.log(getIstioOperatorConfig());`,
    solution: `function getIstioOperatorConfig(): string {
  return \`apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  name: production
  namespace: istio-system
spec:
  profile: default
  meshConfig:
    accessLogFile: /dev/stdout
    holdApplicationUntilProxyStarts: true
    outboundTrafficPolicy:
      mode: REGISTRY_ONLY
  components:
    ingressGateways:
    - name: istio-ingressgateway
      enabled: true
      k8s:
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
        hpaSpec:
          minReplicas: 2
          maxReplicas: 5
  values:
    global:
      proxy:
        resources:
          limits:
            memory: 256Mi\`;
}
console.log(getIstioOperatorConfig());`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which Istio installation profile is recommended for production?',
      options: ['minimal', 'default', 'demo', 'remote'],
      answer: 1,
      explanation: 'The `default` profile installs Istiod and the ingress gateway without telemetry add-ons. The `demo` profile is for learning, `minimal` skips gateways, and `remote` is for multi-cluster setups.',
    },
    {
      q: 'What does `holdApplicationUntilProxyStarts: true` prevent?',
      options: ['Prevents Envoy from consuming CPU before the app is ready', 'Prevents the app container from starting before Envoy is fully initialised', 'Prevents new pods from being scheduled during upgrades', 'Prevents unauthorized outbound traffic'],
      answer: 1,
      explanation: 'Without this flag, the app and Envoy containers start concurrently. If the app makes network calls before Envoy has set up the proxy rules, those calls fail. This setting adds a readiness gate that holds the app until Envoy reports ready.',
    },
    {
      q: 'What is the purpose of `outboundTrafficPolicy.mode: REGISTRY_ONLY`?',
      options: ['Only registered namespaces can use the mesh', 'All outbound calls to hosts not registered via ServiceEntry are blocked', 'Only the ingress gateway can send traffic outside the cluster', 'Only registered users can access the Istio dashboard'],
      answer: 1,
      explanation: 'REGISTRY_ONLY enforces that Envoy only allows outbound traffic to hosts registered in the mesh service registry (Kubernetes Services + ServiceEntry CRDs). Unregistered external hosts are blocked — a zero-trust egress posture.',
    },
    {
      q: 'In a canary upgrade, what does the namespace label `istio.io/rev=1-22-0` do?',
      options: ['Upgrades all pods in the namespace immediately', 'Directs new pods to inject from the 1-22-0 revision control plane', 'Rolls back the namespace to version 1.22.0', 'Tags the namespace for monitoring in Kiali'],
      answer: 1,
      explanation: 'Revision labels direct the MutatingAdmissionWebhook to use a specific Istio revision\'s injector. After restarting pods, they get sidecars pointing to the 1-22-0 control plane, while other namespaces still use the old revision — enabling per-namespace migration.',
    },
    {
      q: 'What does `istioctl verify-install` check?',
      options: ['That all sidecars are in sync with Istiod', 'That expected Kubernetes resources exist and are healthy post-install', 'That mTLS is working between all services', 'That no configuration errors exist in CRDs'],
      answer: 1,
      explanation: '`verify-install` checks that all expected Kubernetes resources (CRDs, Deployments, Services, RBAC) created by Istio are present and healthy. It reports any missing or unhealthy components after an install or upgrade.',
    },
    {
      q: 'Which command shows exactly what manifests a given IstioOperator will generate?',
      options: ['istioctl install --dry-run', 'istioctl manifest generate', 'istioctl analyze', 'istioctl profile dump'],
      answer: 1,
      explanation: '`istioctl manifest generate -f operator.yaml` outputs all Kubernetes manifests that the IstioOperator would apply, without making any cluster changes. Essential for GitOps: pipe the output into a git repo and apply it via ArgoCD/Flux.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between IstioOperator and installing with raw istioctl flags?',
      a: 'Raw <code>istioctl install --set profile=X --set key=value</code> flags are convenient for quick installs but become unwieldy for complex configurations and are not easily versionable in git. <strong>IstioOperator</strong> is a YAML CRD that declaratively describes the desired Istio state — it lives in git, passes code review, and can be applied via <code>istioctl install -f operator.yaml</code>. Istioctl reconciles the cluster to match the operator spec, making it suitable for GitOps pipelines.',
    },
    {
      q: 'How do you safely uninstall Istio from a cluster?',
      a: '<ol><li>Remove sidecar injection labels from all namespaces: <code>kubectl label ns &lt;ns&gt; istio-injection-</code></li><li>Restart all workloads so pods lose their sidecars</li><li>Delete all Istio CRD instances: <code>kubectl delete virtualservices,destinationrules,gateways -A</code></li><li>Run <code>istioctl uninstall --purge</code> to remove all Istio control plane resources and CRDs</li><li>Delete the <code>istio-system</code> namespace</li></ol>Skipping step 1-2 leaves pods with broken sidecars pointing at a deleted control plane — traffic will fail.',
    },
    {
      q: 'What is the difference between Helm install and istioctl install?',
      a: '<strong>istioctl install</strong> has validation, pre/post-install checks, and handles Istio-specific upgrade logic. It is simpler and safer for manual installs. <strong>Helm</strong> is preferred in GitOps pipelines (ArgoCD, Flux) because ArgoCD natively understands Helm chart state, can diff revisions, and manages the release lifecycle declaratively. The Istio Helm charts (<code>istio-base</code>, <code>istiod</code>, <code>gateway</code>) are official and feature-complete — they mirror the IstioOperator capabilities.',
    },
    {
      q: 'How does revision-based upgrade differ from in-place upgrade?',
      a: '<ul><li><strong>In-place upgrade</strong> (<code>istioctl upgrade</code>): replaces the existing Istiod in-place. Fast but high-risk — all namespaces affected simultaneously, no per-namespace rollback.</li><li><strong>Revision-based upgrade</strong>: installs a <em>second</em> Istiod with a new revision tag alongside the existing one. Namespaces migrate one by one by changing their <code>istio.io/rev</code> label. If a namespace has issues, revert its label and restart — other namespaces are unaffected. After full migration, uninstall the old revision.</li></ul>For production, always use revision-based upgrades.',
    },
    {
      q: 'What does the `minimal` profile install and when should you use it?',
      a: 'The <code>minimal</code> profile installs <em>only Istiod</em> — no ingress gateway, no telemetry add-ons, no egress gateway. Use it when: <ul><li>You manage gateways independently using the Kubernetes Gateway API or a dedicated Helm chart</li><li>You use an external load balancer/CDN for ingress instead of istio-ingressgateway</li><li>You only need mesh features (mTLS, retries, observability) and handle ingress elsewhere</li></ul>This is the leanest option — add only what you need to avoid resource waste.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Istio is installed via istioctl or Helm using profiles (minimal/default/demo). Production installs use IstioOperator for declarative config, canary upgrades use revisions to migrate namespaces one-by-one without downtime.',
    mustKnow: [
      'Profiles: minimal (Istiod only), default (+ gateway, recommended prod), demo (everything + add-ons, not prod)',
      'IstioOperator: declarative CRD for Istio config — use in GitOps, apply with istioctl install -f',
      'Namespace injection: label namespace with istio-injection=enabled, then restart pods',
      'Canary upgrades: install new revision alongside old, migrate namespaces via istio.io/rev label',
      'holdApplicationUntilProxyStarts: true — prevents startup race conditions',
      'outboundTrafficPolicy: REGISTRY_ONLY — blocks unregistered egress (zero-trust)',
      'istioctl verify-install: post-install health check; manifest generate: GitOps diff',
    ],
    interviewFocus: [
      'Why use revision-based upgrade over in-place upgrade in production?',
      'What does REGISTRY_ONLY mode do and what must you do before enabling it?',
      'IstioOperator vs Helm vs raw flags — when to use each',
      'How to diagnose injection not working (verify webhook, label, pod restart)',
      'holdApplicationUntilProxyStarts — what problem does it solve and when does it matter?',
    ],
  };
}
