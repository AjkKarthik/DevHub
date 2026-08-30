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
  selector: 'app-mesh-kiali',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './kiali.html',
  styleUrl: './kiali.scss',
})
export class MeshKiali {
  quickRef: QuickRefItem[] = [
    { name: 'Kiali', type: 'keyword', desc: 'Observability console for Istio — service graph, config validation, mTLS status, and traffic animation.' },
    { name: 'Service Graph', type: 'keyword', desc: 'Real-time topology map showing services, traffic flows, success rates, and latency between nodes.' },
    { name: 'Validation', type: 'keyword', desc: 'Kiali validates VirtualService, DestinationRule, and other Istio CRDs for misconfigurations and warns about issues.' },
    { name: 'Workload Graph', type: 'keyword', desc: 'Pod-level topology view showing individual workload instances and their traffic relationships.' },
    { name: 'istioctl dashboard kiali', type: 'keyword', desc: 'Opens Kiali dashboard via port-forward — quick access without exposing it externally.' },
    { name: 'kiali-operator', type: 'keyword', desc: 'Kubernetes operator for installing and managing Kiali via the Kiali CR.' },
    { name: 'Namespace graph', type: 'keyword', desc: 'Kiali\'s graph filtered to one or more namespaces — shows inter-service communication within scope.' },
    { name: 'Traffic Animation', type: 'keyword', desc: 'Kiali animates request flows on the graph using dots moving along edges — speed indicates RPS.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What Kiali Provides',
      points: [
        'Kiali is the official observability console for Istio — developed by Red Hat alongside the Istio project. It translates Prometheus metrics and Istio CRD state into visual service graphs and configuration insights.',
        'Three core capabilities: (1) Service graph with live traffic, health indicators, and security status. (2) Configuration management — view, edit, and validate Istio CRDs from the UI. (3) Validation — proactively detect misconfigurations in VirtualService/DestinationRule/Gateway before they cause production issues.',
        'Kiali requires: Prometheus (for metrics), and optionally Jaeger/Tempo (for tracing integration) and Grafana (for metric dashboards). The service graph itself does NOT directly query Envoy — it reads from Prometheus (the Envoy Config Viewer is a separate feature with its own, different data path — see below).',
        'Service health is computed from Prometheus metrics: `istio_requests_total` success rates. Kiali shows red (degraded), orange (warning), or green (healthy) indicators on each service node in the graph.',
        'Kiali does NOT replace Prometheus Alertmanager or PagerDuty — it is a visual exploration tool, not an alerting system. Use it for diagnosis and exploration; build alerts in Prometheus separately.',
        'RBAC support: Kiali reads Kubernetes RBAC to limit which namespaces each user can see. Users with namespace-level access see only their namespaces in the graph — useful in multi-tenant clusters.',
      ],
    },
    {
      heading: 'Service Graph',
      points: [
        'The service graph is Kiali\'s signature feature — a real-time topology map where nodes represent services and edges represent traffic flows. Node colour indicates health; edge width indicates traffic volume.',
        'Graph types: Service graph (service-level), Workload graph (pod-level), Application graph (app label-level). Switch between them based on the level of granularity needed.',
        'Graph filters: filter by namespace, app label, protocol, or health status. In a large cluster with 100+ services, focus on specific namespaces or apps to keep the graph readable.',
        'Traffic animation: animated dots move along edges at a speed proportional to RESPONSE TIME (faster animation = faster responses), while dot DENSITY (how tightly packed they are) indicates RPS. Green circles = successful requests, red diamonds = errors. At a glance, you see which paths are high-traffic (dense dots), slow (slow-moving dots), and where errors propagate (red diamonds).',
        'Edge labels: click "Show Edge Labels" to overlay RPS, error rate, and response time on each traffic edge. Essential for identifying slow links and high-error paths without writing PromQL.',
        'Security badges: padlock icons on edges show mTLS status. Green lock = ISTIO_MUTUAL mTLS, open lock = plaintext. Click on the lock to jump to the PeerAuthentication config. Instantly see which connections are unencrypted.',
      ],
    },
    {
      heading: 'Configuration Validation',
      points: [
        'Kiali validates all Istio CRDs in the cluster and reports errors and warnings in the UI. This catches many common misconfigurations before they surface as production traffic issues.',
        'VirtualService validations: references non-existent subsets (no matching DestinationRule), weights not summing to 100, unreachable routes (a catch-all before specific matches), missing host entries.',
        'DestinationRule validations: subset label selectors that match no pods, inconsistent TLS settings, duplicate subset names.',
        'Gateway validations: port conflicts, missing credential secrets for TLS, unreferenced Gateways (no VirtualService uses it).',
        'The Istio config view in Kiali shows all CRDs in a namespace with inline validation markers (red X, yellow warning). Click any resource to see the YAML and the specific validation error with an explanation.',
        'Use Kiali validation as a pre-production gate: after applying Istio config changes, open Kiali and check for red validation errors before testing traffic. Faster than debugging 503s caused by a typo in a subset name.',
      ],
    },
    {
      heading: 'Traffic Management from Kiali UI',
      points: [
        'Kiali can create and modify VirtualService and DestinationRule resources through its "Traffic Shifting" wizard — no YAML editing required.',
        'Traffic Shifting wizard: select a service, choose "Traffic Shifting", set weights for each subset. Kiali generates and applies the VirtualService and DestinationRule. Useful for ops teams that need to do canary adjustments without Kubernetes CLI access.',
        'Request Routing wizard: configure header-based routing, URI matching, and fault injection via forms. Kiali generates the correct VirtualService YAML.',
        'Suspend Traffic: wizard that creates a VirtualService sending 100% of traffic to a specific subset — quick way to freeze traffic during incidents.',
        'Traffic Policy wizard: set load balancing algorithm, connection pool settings, and outlier detection from the UI. Generates DestinationRule YAML.',
        'Caution: changes made via Kiali UI create CRD resources in the cluster — they need to be committed to your GitOps repo to persist across cluster recreation. Treat Kiali UI changes as temporary emergency interventions, not the primary config management path.',
      ],
    },
    {
      heading: 'Tracing Integration',
      points: [
        'Kiali integrates with Jaeger (and Grafana Tempo) to show distributed traces alongside the service graph. Click on a service node → view traces for that service without leaving Kiali.',
        'Trace correlation: in the service graph, click on a high-latency edge → Kiali shows traces from that time window ordered by duration → click a trace → see the full span tree in Jaeger.',
        'Kiali Dashboard spans: the "Metrics" tab on a service shows Prometheus metrics; the "Traces" tab shows Jaeger traces. Both auto-filter by the selected time window and service.',
        'To configure Jaeger integration: set `spec.external_services.tracing.url` in the Kiali CR or Helm values to the Jaeger query service URL.',
        'Error trace highlighting: Kiali can filter traces to show only those with errors. Combined with the service graph health indicators, this creates a fast "alert → graph → failing service → error traces → individual trace" debugging workflow.',
        'Span metrics: Kiali derives its per-service, per-route RED metrics from both Prometheus and trace data. This gives higher resolution for long-tail latency analysis.',
      ],
    },
    {
      heading: 'Production Deployment',
      points: [
        'Use the kiali-operator for production deployment: `helm install kiali-operator kiali/kiali-operator -n kiali-operator --create-namespace`. Then create a Kiali CR to configure the instance.',
        'Kiali CR key settings: `spec.auth.strategy` (anonymous, openshift, openid, header) — use OpenID Connect for single sign-on. `spec.external_services.prometheus.url` — point to your production Prometheus.',
        'Namespace access control: `spec.deployment.accessible_namespaces: ["production", "staging"]` limits which namespaces Kiali shows. In multi-tenant clusters, use Kubernetes RBAC + accessible_namespaces for tenant isolation.',
        'Resource requirements: Kiali itself is lightweight (~100-200MB RAM). The bottleneck is Prometheus query performance — ensure your Prometheus has sufficient resources to handle Kiali\'s metric queries.',
        'External access: expose Kiali via an Istio VirtualService + Gateway behind your SSO provider. Never expose it unauthenticated — Kiali can modify Istio configs and view all service traffic.',
        'High availability: Kiali supports multiple replicas with `spec.deployment.replicas: 2`. State is stored in Prometheus and Kubernetes — Kiali pods are stateless.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Install Kiali',
      language: 'bash',
      code: `# Option 1: quick install via istioctl (not for production)
istioctl dashboard kiali  # Opens port-forward to bundled Kiali

# Option 2: kiali-operator (recommended for production)
helm repo add kiali https://kiali.org/helm-charts
helm install kiali-operator kiali/kiali-operator \\
  -n kiali-operator --create-namespace

# Create Kiali instance
cat <<EOF | kubectl apply -f -
apiVersion: kiali.io/v1alpha1
kind: Kiali
metadata:
  name: kiali
  namespace: istio-system
spec:
  auth:
    strategy: openid        # SSO via OIDC
    openid:
      issuer_uri: https://your-sso.example.com
      client_id: kiali
  external_services:
    prometheus:
      url: http://prometheus.monitoring.svc:9090
    tracing:
      enabled: true
      url: http://jaeger-query.istio-system.svc:16686
    grafana:
      enabled: true
      url: http://grafana.monitoring.svc:3000
  deployment:
    replicas: 2
    accessible_namespaces: ["production", "staging"]
EOF`,
    },
    {
      label: 'Access & Debug',
      language: 'bash',
      code: `# Quick access via port-forward
istioctl dashboard kiali
# Opens http://localhost:20001/kiali

# Check Kiali health
kubectl -n istio-system get pods -l app=kiali
kubectl -n istio-system logs deploy/kiali | grep -i error

# Verify Kiali can reach Prometheus
kubectl exec -n istio-system deploy/kiali -- \\
  wget -qO- http://prometheus.monitoring.svc:9090/api/v1/query?query=up

# Check validation errors across all namespaces
# Kiali API (with port-forward active):
curl http://localhost:20001/kiali/api/namespaces/production/validations

# Check which services have mTLS issues
curl http://localhost:20001/kiali/api/namespaces/production/istio/peerauthentications`,
    },
    {
      label: 'Expose via Gateway',
      language: 'bash',
      code: `# Expose Kiali externally via Istio Gateway (with auth)
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: kiali
  namespace: istio-system
spec:
  hosts:
  - kiali.example.com
  gateways:
  - istio-system/main-gateway
  http:
  - route:
    - destination:
        host: kiali
        port:
          number: 20001
---
# Require authentication via JWT (from your SSO)
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: kiali-auth
  namespace: istio-system
spec:
  selector:
    matchLabels:
      app: kiali
  action: ALLOW
  rules:
  - from:
    - source:
        requestPrincipals: ["*"]  # Valid JWT required
    to:
    - operation:
        paths: ["/*"]
EOF`,
    },
    {
      label: 'Validation API',
      language: 'bash',
      code: `# Script to check for Istio config validation errors across namespaces
# Useful in CI/CD pipelines after applying Istio config

check_kiali_validations() {
  local namespace=$1
  local kiali_url=\${KIALI_URL:-"http://localhost:20001"}

  validations=$(curl -s \\
    "\${kiali_url}/kiali/api/namespaces/\${namespace}/validations" \\
    | python3 -c "
import sys, json
data = json.load(sys.stdin)
errors = [v for v in data.get('validations', []) if v.get('severity') == 'error']
for e in errors:
    print(f'ERROR: {e[\"objectType\"]}/{e[\"name\"]}: {e[\"message\"]}')
sys.exit(len(errors))
")

  if [ $? -ne 0 ]; then
    echo "Validation errors found in namespace '\${namespace}':"
    echo "\${validations}"
    return 1
  fi
  echo "No validation errors in namespace '\${namespace}'"
}

check_kiali_validations production`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using Kiali UI to manage Istio config without committing to GitOps',
      wrong: `# Ops engineer creates a VirtualService via Kiali Traffic Shifting wizard
# during an incident — adds canary route for v2
# Next day: GitOps reconciliation overwrites it → canary route gone
# Service reverts to 100% v1 unexpectedly`,
      right: `# Kiali UI changes are emergency interventions only
# After the incident: export the Kiali-generated YAML
kubectl get virtualservice my-service -o yaml > my-service-vs.yaml
# Commit to Git, create PR, let GitOps reconcile
# This way the change persists and is auditable`,
      explanation: 'Kiali writes Istio CRD resources directly to the cluster. In a GitOps environment (ArgoCD/Flux), reconciliation will overwrite these changes unless they are committed to the Git repository. Treat Kiali UI changes as temporary emergency measures and always commit them to Git afterward.',
    },
    {
      title: 'Exposing Kiali without authentication in production',
      wrong: `# Kiali installed with: spec.auth.strategy: anonymous
# Exposed via LoadBalancer service — anyone can access it
# Kiali can modify VirtualServices and view all service traffic`,
      right: `# Always secure Kiali in production
spec:
  auth:
    strategy: openid   # OIDC SSO
# And expose only via VirtualService with AuthorizationPolicy requiring JWT
# Never expose Kiali directly as a LoadBalancer service`,
      explanation: 'Kiali has write access to Istio CRDs (can create/modify VirtualService, DestinationRule, etc.) and read access to all service traffic metadata. An unauthenticated Kiali instance is a critical security risk — anyone can reconfigure your mesh. Always secure with OIDC, header, or OpenShift auth strategy.',
    },
    {
      title: 'Ignoring Kiali validation warnings before deploying config',
      wrong: `kubectl apply -f virtual-service.yaml
# Kiali shows: "KIA1107 - Subset not found"
# Warning ignored → 503 errors in production
# Root cause: subset referenced doesn't exist in DestinationRule`,
      right: `kubectl apply -f virtual-service.yaml
# Check Kiali validations immediately after applying
curl http://kiali/api/namespaces/production/validations
# Fix any errors before testing traffic
# Or: integrate Kiali API into CI/CD pipeline as a post-deploy gate`,
      explanation: 'Kiali\'s validation engine catches real configuration bugs — missing subsets, incorrect weights, unreachable routes. A few minutes checking Kiali after applying Istio config changes can prevent hours of debugging mysterious 503 errors. Integrate the Kiali validation API into your CI/CD pipeline as a post-deploy check.',
    },
    {
      title: 'Pointing Kiali at the bundled Prometheus instead of production Prometheus',
      wrong: `# Default Kiali install points to bundled Prometheus in istio-system
# Bundled Prometheus has no persistent storage
# Data older than 24h is gone — cannot investigate yesterday's incident`,
      right: `spec:
  external_services:
    prometheus:
      url: http://prometheus.monitoring.svc:9090   # Production Prometheus
      # Full historical data, alerting rules, and long retention`,
      explanation: 'The bundled Prometheus in Istio\'s demo profile stores data in memory with no persistence. When investigating production incidents (which often happen hours after the initial alert), you need historical data. Point Kiali at your production Prometheus with proper storage and retention policies.',
    },
    {
      title: 'Assuming Kiali graph shows all traffic in real-time',
      wrong: `# Kiali graph shows no traffic for a service
# Developer assumes the service is unreachable
# Actually: the service has very low RPS and the 1-minute aggregation window shows no data`,
      right: `# Kiali graph uses Prometheus rate() over a time window
# Adjust the graph duration: increase from 1m to 10m or 30m
# For low-traffic services: check metrics tab directly
# For real-time: use istioctl proxy-config or kubectl logs -c istio-proxy`,
      explanation: 'Kiali\'s service graph derives traffic from Prometheus metric rates. Very low-traffic services may show as "no traffic" within a 1-minute window. Increase the graph\'s time duration, or check the "Metrics" tab which shows exact counts. Use `istioctl proxy-config` for real-time sidecar state.',
    },
  ];

  challenge: Challenge = {
    title: 'Design a Kiali-Based Incident Response Workflow',
    language: 'typescript',
    description: `Define the step-by-step workflow for investigating a "checkout service 503 error spike" using Kiali, Prometheus, and Jaeger.

Return an array of steps, each with:
- step: step number
- tool: tool to use
- action: what to do
- expected: what you expect to find or decide`,
    hints: [
      'Start with the service graph to locate the failure',
      'Check response_flags in Prometheus to identify root cause type',
      'Use Kiali validation to check for config issues',
      'Use Jaeger traces to find specific failing requests',
    ],
    starterCode: `interface InvestigationStep {
  step: number;
  tool: string;
  action: string;
  expected: string;
}

function getIncidentWorkflow(): InvestigationStep[] {
  return [];
}
console.log(JSON.stringify(getIncidentWorkflow(), null, 2));`,
    solution: `interface InvestigationStep {
  step: number;
  tool: string;
  action: string;
  expected: string;
}

function getIncidentWorkflow(): InvestigationStep[] {
  return [
    {
      step: 1,
      tool: 'Kiali Service Graph',
      action: 'Open Kiali, navigate to the production namespace graph, look for red nodes or edges',
      expected: 'Checkout service node is red; upstream dependency edges may also show errors',
    },
    {
      step: 2,
      tool: 'Kiali Edge Metrics',
      action: 'Click on the failing edge from checkout to its dependency; view error rate and response time',
      expected: 'High error rate (>5%) on the checkout→payment or checkout→inventory edge',
    },
    {
      step: 3,
      tool: 'Prometheus / PromQL',
      action: 'Query response_flags: sum by (response_flags) (rate(istio_requests_total{destination_service_name="payment",response_code="503"}[5m]))',
      expected: 'UO = circuit breaker tripping; UH = no healthy pods; NR = routing misconfiguration',
    },
    {
      step: 4,
      tool: 'Kiali Validation',
      action: 'Check Istio config tab in Kiali for red validation errors on VirtualService/DestinationRule',
      expected: 'If NR: missing subset definition in DestinationRule; if UH: all pods ejected by outlier detection',
    },
    {
      step: 5,
      tool: 'Jaeger / Kiali Traces',
      action: 'Click "Traces" tab on the checkout service in Kiali, filter by error traces',
      expected: 'Find the failing span showing the exact error message and latency breakdown',
    },
    {
      step: 6,
      tool: 'kubectl / istioctl',
      action: 'Run: istioctl proxy-config endpoints deploy/checkout | grep payment to check endpoint health',
      expected: 'Degraded endpoints confirm outlier detection ejected pods; fix the unhealthy pods or tune detection',
    },
  ];
}
console.log(JSON.stringify(getIncidentWorkflow(), null, 2));`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What data source does Kiali use to build its service graph?',
      options: ['Istio CRDs (VirtualService, DestinationRule) directly', 'Prometheus metrics derived from Envoy sidecars', 'Kubernetes Endpoints resources', 'Direct queries to Envoy admin API'],
      answer: 1,
      explanation: 'Kiali queries Prometheus for `istio_requests_total` and related metrics to determine traffic flows, error rates, and latency. It also reads Istio CRDs from the Kubernetes API for validation and config display. It does NOT query Envoy directly — Prometheus is the intermediary.',
    },
    {
      q: 'What does a padlock icon on a service graph edge in Kiali indicate?',
      options: ['The service requires authentication to access', 'mTLS status — green lock = ISTIO_MUTUAL mTLS, open lock = plaintext connection', 'The service uses JWT authentication for users', 'The edge is encrypted at the application layer'],
      answer: 1,
      explanation: 'Kiali overlays security status on service graph edges. A closed padlock indicates mTLS is active (ISTIO_MUTUAL). An open padlock indicates plaintext. This gives an instant visual inventory of which service-to-service connections are encrypted vs plaintext — critical for validating before enforcing STRICT PeerAuthentication.',
    },
    {
      q: 'What Kiali validation error indicates a VirtualService is routing to a non-existent subset?',
      options: ['KIA0101 - VirtualService host not found in cluster', 'KIA1107 - Subset not found: the subset referenced in a VirtualService route is not defined in any matching DestinationRule', 'KIA0201 - More than one DestinationRule for the same host/subset combination', 'KIA0401 - Gateway has no matching VirtualService'],
      answer: 1,
      explanation: 'KIA1107 fires when a VirtualService\'s destination references a subset name that is not defined in any DestinationRule for that host. This is the most common Istio misconfiguration — it causes Envoy to return 503 for all traffic to that destination. Kiali catches it at config apply time before traffic is affected. (KIA0201 is a different check entirely — it warns about multiple DestinationRules covering the same host/subset combination, not a missing subset.)',
    },
    {
      q: 'Why should Kiali UI changes be immediately committed to your GitOps repository?',
      options: ['Kiali changes are not persisted in Kubernetes — they exist only in memory', 'GitOps reconciliation (ArgoCD/Flux) will overwrite Kiali changes with the Git-tracked state', 'Kiali changes require a cluster restart to take effect', 'Kiali uses a separate config store that GitOps cannot read'],
      answer: 1,
      explanation: 'Kiali writes changes directly to Kubernetes CRDs. In a GitOps environment, ArgoCD or Flux continuously reconciles cluster state to match the Git repository. Any out-of-band change (including Kiali UI edits) will be overwritten by the next reconciliation. Always export Kiali-generated YAML and commit it to Git.',
    },
    {
      q: 'Which Kiali feature provides proactive detection of Istio misconfigurations?',
      options: ['Traffic Animation — shows request flows in real-time', 'Configuration Validation — checks VirtualService, DestinationRule, and Gateway CRDs for errors', 'Service Graph — highlights services with high error rates', 'Workload Graph — shows pod-level traffic patterns'],
      answer: 1,
      explanation: 'Kiali\'s configuration validation engine proactively analyzes all Istio CRDs in the cluster and reports errors and warnings (missing subsets, weight sum ≠ 100, unreferenced resources, etc.) before they cause traffic issues. It is a static analysis tool for Istio config — not just a runtime observability tool.',
    },
    {
      q: 'What authentication strategy should you use for Kiali in a production Kubernetes cluster?',
      options: ['anonymous — simplest, no configuration needed', 'token — uses Kubernetes service account tokens', 'openid — OIDC-based SSO integration with your identity provider', 'basic — username/password stored in a Kubernetes Secret'],
      answer: 2,
      explanation: 'OpenID Connect (OIDC) is recommended for production — it integrates Kiali with your existing SSO provider (Okta, Azure AD, Google), supporting multi-user access, RBAC, and audit logging. `anonymous` is never suitable for production (no access control). `token` requires users to manage Kubernetes tokens directly.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does Kiali\'s service graph differ from a Kubernetes service topology map?',
      a: 'A Kubernetes service topology map (from tools like k9s or kubectl) shows what Kubernetes KNOWS about — Services, Deployments, Endpoints. It is static: it shows declared relationships from YAML. <strong>Kiali\'s service graph</strong> shows what is ACTUALLY happening based on live Prometheus metric data: <ul><li>Which services are actually calling each other (discovered from `source_workload`/`destination_workload` labels)</li><li>Success rates, RPS, and latency per edge (live metrics)</li><li>mTLS status per connection (Istio security state)</li><li>Undocumented dependencies: if service A calls service B without a VirtualService, Kiali still shows the edge from metric data</li></ul>Kiali discovers real traffic patterns — including undocumented cross-namespace calls that no YAML declares.',
    },
    {
      q: 'How do you integrate Kiali with Grafana for metric drill-down?',
      a: 'Set <code>spec.external_services.grafana.url</code> in the Kiali CR. Then in the Kiali service graph, clicking a service node\'s "Metrics" tab shows a Grafana link. Clicking it opens the Grafana dashboard for that service pre-filtered to the same time window. <br><br>For this to work well: <ul><li>Grafana must have Prometheus configured as a data source</li><li>Install the official Istio Grafana dashboards (IDs 7636, 7630, 7645) in your Grafana instance</li><li>Kiali constructs the Grafana URL with the service name and time range as query parameters</li></ul>This creates a "click to Grafana" workflow — useful for going from the high-level graph view to detailed time-series metric exploration.',
    },
    {
      q: 'Can Kiali detect undocumented service-to-service calls that have no VirtualService?',
      a: 'Yes — Kiali\'s service graph is derived from Prometheus metric labels, not from Istio CRDs. Envoy records the <code>source_workload</code> and <code>destination_service_name</code> labels on every request it proxies, regardless of whether a VirtualService exists. So Kiali shows ALL actual traffic flows: <ul><li>Documented flows (with VirtualService/DestinationRule): shown with full routing config</li><li>Undocumented flows (direct Kubernetes Service calls without Istio config): also shown, with a "passthrough" label</li></ul>This makes Kiali valuable for discovering shadow dependencies — calls your services make that are not in any documentation or diagram.',
    },
    {
      q: 'How do you use Kiali in a CI/CD pipeline to validate Istio config changes?',
      a: 'Use the Kiali REST API as a post-deploy validation step: <ol><li>After <code>kubectl apply -f istio-configs/</code>, call the Kiali validations API: <code>GET /kiali/api/namespaces/{ns}/validations</code></li><li>Parse the response for <code>severity: "error"</code> entries</li><li>If any errors are found, fail the pipeline and output the error messages</li><li>If clean, proceed to traffic testing</li></ol>This catches misconfigured subsets, invalid weights, or host typos within seconds of applying config — before traffic tests would catch the 503s. Kiali validation is faster and more specific than waiting for traffic tests to fail.',
    },
    {
      q: 'What is the difference between the Service Graph, Workload Graph, and Application Graph in Kiali?',
      a: '<strong>Service Graph</strong>: nodes represent Kubernetes Services. One node per Service. Best for understanding service-level traffic patterns and health. <br><br><strong>Workload Graph</strong>: nodes represent individual Deployments/pods. Shows multiple nodes for a scaled service (one per replica). Best for identifying which specific pod is causing errors or receiving disproportionate traffic. <br><br><strong>Application Graph</strong>: nodes are grouped by the <code>app</code> label. All pods with the same app label appear as one node, regardless of version. Best for business-level topology views. <br><br>Switch between them using the "Graph Type" selector in Kiali — start with Service Graph for incident response, drill down to Workload Graph if you need pod-level detail.',
    },
  { q: 'How do you use Kiali to troubleshoot service mesh issues?', a: 'Kiali provides several troubleshooting workflows: the service graph shows real-time traffic flow with error rate indicators, making it easy to spot which service is generating errors or latency. The Validations feature checks Istio configuration for common mistakes like conflicting VirtualService hosts or missing DestinationRule subsets. Workload detail pages show request rate, error rate, and latency metrics per workload. The Envoy config viewer shows the actual Envoy proxy configuration for a pod. Distributed traces are linked from spans in Kiali to Jaeger for deep investigation of individual requests that show high latency.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Kiali is Istio\'s visual observability console — service graph from Prometheus metrics, config validation for CRD errors, mTLS status badges, and Jaeger trace integration. Use it for incident investigation and pre-deploy config checks.',
    mustKnow: [
      'Kiali uses Prometheus (not Envoy directly) for service graph traffic data',
      'Service graph shows actual traffic flows — including undocumented dependencies',
      'Validation: catches VirtualService/DestinationRule misconfigs (missing subsets, wrong weights)',
      'mTLS badges: padlock per edge shows ISTIO_MUTUAL vs plaintext at a glance',
      'Kiali UI changes write to K8s CRDs — commit to GitOps repo or they get overwritten',
      'Always use OIDC auth (never anonymous) in production',
      'Kiali validation API can be used in CI/CD pipelines as a post-deploy gate',
    ],
    interviewFocus: [
      'What Kiali shows that kubectl/k9s does not — live traffic with health + mTLS status',
      'How Kiali validates config and what it catches (KIA0201 subset not found)',
      'Why Kiali UI changes need to be committed to Git in GitOps environments',
      'Kiali + Jaeger integration for trace drill-down from the service graph',
      'How to use Kiali in CI/CD as a validation gate after applying Istio configs',
    ],
  };
}
