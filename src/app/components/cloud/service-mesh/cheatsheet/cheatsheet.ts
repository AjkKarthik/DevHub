import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CheatEntry {
  category: string;
  term: string;
  syntax: string;
  desc: string;
}

@Component({
  selector: 'app-mesh-cheatsheet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class MeshCheatsheet {
  searchQuery = signal('');
  activeCategory = signal('All');

  categories = [
    'All', 'istioctl', 'Traffic', 'Security', 'Observability', 'Ambient', 'Multi-Cluster', 'Envoy', 'Consul',
  ];

  entries: CheatEntry[] = [
    // istioctl
    { category: 'istioctl', term: 'Install Istio (default profile)', syntax: 'istioctl install --set profile=default -y', desc: 'Install Istio control plane with production-ready defaults (Istiod + ingress gateway).' },
    { category: 'istioctl', term: 'Install Ambient profile', syntax: 'istioctl install --set profile=ambient -y', desc: 'Install Istio in Ambient (sidecar-free) mode with ztunnel DaemonSet.' },
    { category: 'istioctl', term: 'Proxy status', syntax: 'istioctl proxy-status', desc: 'Show xDS sync status of all proxies. SYNCED = up to date. STALE = pending push.' },
    { category: 'istioctl', term: 'Proxy cluster config', syntax: 'istioctl proxy-config cluster deploy/<name>', desc: 'Show upstream clusters known to this proxy — verify subsets, LB algorithm, circuit breakers.' },
    { category: 'istioctl', term: 'Proxy listener config', syntax: 'istioctl proxy-config listener deploy/<name>', desc: 'Show all listeners configured on this proxy — check inbound (15006) and outbound (15001) filter chains.' },
    { category: 'istioctl', term: 'Proxy route config', syntax: 'istioctl proxy-config route deploy/<name> --name http.8080', desc: 'Show HTTP routing rules for a specific route config by name.' },
    { category: 'istioctl', term: 'Proxy endpoint config', syntax: 'istioctl proxy-config endpoint deploy/<name> --cluster "outbound|8080||svc.ns.svc.cluster.local"', desc: 'Show healthy endpoints for a specific upstream cluster.' },
    { category: 'istioctl', term: 'Analyze config', syntax: 'istioctl analyze', desc: 'Validate Istio config in cluster — finds misconfigured VirtualServices, orphaned Gateways, etc.' },
    { category: 'istioctl', term: 'Verify install', syntax: 'istioctl verify-install', desc: 'Verify Istio installation is healthy and matches the installed IstioOperator spec.' },
    { category: 'istioctl', term: 'mTLS check', syntax: 'istioctl authn tls-check deploy/<pod> <svc.ns.svc.cluster.local>', desc: 'Check mTLS status between a pod and service — shows OK, CONFLICT, or HTTP.' },
    { category: 'istioctl', term: 'Dashboard Kiali', syntax: 'istioctl dashboard kiali', desc: 'Open Kiali service mesh console in browser (port-forward).' },
    { category: 'istioctl', term: 'Dashboard Grafana', syntax: 'istioctl dashboard grafana', desc: 'Open Grafana mesh dashboards in browser.' },
    { category: 'istioctl', term: 'Dashboard Jaeger', syntax: 'istioctl dashboard jaeger', desc: 'Open Jaeger distributed tracing UI in browser.' },
    { category: 'istioctl', term: 'Create remote secret', syntax: 'istioctl create-remote-secret --context=<ctx> --name=<name> | kubectl apply -f -', desc: 'Generate kubeconfig secret for multi-cluster cross-cluster API server watching.' },
    { category: 'istioctl', term: 'Waypoint apply', syntax: 'istioctl waypoint apply --namespace <ns>', desc: 'Deploy a Waypoint proxy for L7 features in an Ambient-mode namespace.' },
    { category: 'istioctl', term: 'ztunnel workloads', syntax: 'istioctl ztunnel-config workload -n <ns>', desc: 'List pods enrolled in Ambient mode and their ztunnel assignment.' },

    // Traffic
    { category: 'Traffic', term: 'VirtualService — timeout', syntax: 'http:\n- timeout: 10s\n  route:\n  - destination:\n      host: svc', desc: 'Set a 10s request timeout for all HTTP routes.' },
    { category: 'Traffic', term: 'VirtualService — retry', syntax: 'http:\n- retries:\n    attempts: 3\n    perTryTimeout: 3s\n    retryOn: "503,gateway-error"', desc: 'Retry on 503 or gateway error, up to 3 times with 3s per-try timeout.' },
    { category: 'Traffic', term: 'VirtualService — canary split', syntax: 'http:\n- route:\n  - destination:\n      host: svc\n      subset: v1\n    weight: 90\n  - destination:\n      host: svc\n      subset: v2\n    weight: 10', desc: '90/10 canary traffic split between two DestinationRule subsets.' },
    { category: 'Traffic', term: 'VirtualService — fault inject (abort)', syntax: 'http:\n- fault:\n    abort:\n      percentage:\n        value: 5\n      httpStatus: 503\n  route:\n  - destination:\n      host: svc', desc: 'Inject 503 abort faults on 5% of requests for chaos testing.' },
    { category: 'Traffic', term: 'VirtualService — fault inject (delay)', syntax: 'http:\n- fault:\n    delay:\n      percentage:\n        value: 10\n      fixedDelay: 5s\n  route:\n  - destination:\n      host: svc', desc: 'Add 5s delay to 10% of requests to test timeout behaviour.' },
    { category: 'Traffic', term: 'VirtualService — mirror', syntax: 'http:\n- route:\n  - destination:\n      host: svc\n      subset: v1\n  mirror:\n    host: svc\n    subset: v2\n  mirrorPercentage:\n    value: 100', desc: 'Mirror 100% of production traffic to v2 for dark testing.' },
    { category: 'Traffic', term: 'DestinationRule — subsets', syntax: 'spec:\n  host: svc\n  subsets:\n  - name: v1\n    labels:\n      version: v1\n  - name: v2\n    labels:\n      version: v2', desc: 'Define subsets by pod label for use in VirtualService destinations.' },
    { category: 'Traffic', term: 'DestinationRule — circuit breaker', syntax: 'trafficPolicy:\n  connectionPool:\n    tcp:\n      maxConnections: 100\n    http:\n      http2MaxRequests: 1000\n  outlierDetection:\n    consecutiveGatewayErrors: 5\n    interval: 10s\n    baseEjectionTime: 30s', desc: 'Circuit breaker: eject endpoint after 5 consecutive errors, 30s base ejection.' },
    { category: 'Traffic', term: 'DestinationRule — LEAST_CONN LB', syntax: 'trafficPolicy:\n  loadBalancer:\n    simple: LEAST_CONN', desc: 'Route each request to the upstream with fewest active connections.' },
    { category: 'Traffic', term: 'DestinationRule — consistent hash (header)', syntax: 'trafficPolicy:\n  loadBalancer:\n    consistentHash:\n      httpHeaderName: x-user-id', desc: 'Sticky sessions based on request header value — same header → same upstream.' },
    { category: 'Traffic', term: 'Sidecar CRD scope', syntax: 'spec:\n  egress:\n  - hosts:\n    - "./*"\n    - "istio-system/*"', desc: 'Limit proxy to only know about services in same namespace + istio-system. Reduces xDS payload.' },

    // Security
    { category: 'Security', term: 'PeerAuthentication — STRICT mTLS', syntax: 'spec:\n  mtls:\n    mode: STRICT', desc: 'Enforce mTLS for all inbound traffic to the namespace/workload. Plaintext rejected.' },
    { category: 'Security', term: 'PeerAuthentication — PERMISSIVE', syntax: 'spec:\n  mtls:\n    mode: PERMISSIVE', desc: 'Accept both mTLS and plaintext. Use during migration; switch to STRICT when all proxies are injected.' },
    { category: 'Security', term: 'AuthorizationPolicy — ALLOW', syntax: 'spec:\n  action: ALLOW\n  rules:\n  - from:\n    - source:\n        principals: ["cluster.local/ns/ns/sa/sa"]\n    to:\n    - operation:\n        methods: ["GET"]', desc: 'Allow GET requests from a specific service account only.' },
    { category: 'Security', term: 'AuthorizationPolicy — DENY', syntax: 'spec:\n  action: DENY\n  rules:\n  - from:\n    - source:\n        notNamespaces: ["production"]', desc: 'Deny all traffic not from the production namespace.' },
    { category: 'Security', term: 'RequestAuthentication — JWT', syntax: 'spec:\n  jwtRules:\n  - issuer: "https://accounts.google.com"\n    jwksUri: "https://www.googleapis.com/oauth2/v3/certs"', desc: 'Validate JWTs from Google. Invalid/missing JWT → 401. Combine with AuthorizationPolicy for 403.' },
    { category: 'Security', term: 'Namespace isolation pattern', syntax: '# PeerAuthentication: STRICT (namespace)\n# AuthorizationPolicy: DENY all by default\n# AuthorizationPolicy: ALLOW only needed services', desc: 'Zero-trust namespace: STRICT mTLS + deny-all default + explicit allow per service.' },

    // Observability
    { category: 'Observability', term: 'Total request rate (PromQL)', syntax: 'rate(istio_requests_total{reporter="source"}[5m])', desc: 'Requests per second from source-side proxy reporting.' },
    { category: 'Observability', term: 'Error rate (PromQL)', syntax: 'rate(istio_requests_total{response_code=~"5.."}[5m]) / rate(istio_requests_total[5m])', desc: '5xx error rate as a fraction — multiply by 100 for percentage.' },
    { category: 'Observability', term: 'P99 latency (PromQL)', syntax: 'histogram_quantile(0.99, rate(istio_request_duration_milliseconds_bucket[5m]))', desc: 'p99 request latency in milliseconds from Istio histogram metrics.' },
    { category: 'Observability', term: 'response_flag UO', syntax: 'istio_requests_total{response_flags="UO"}', desc: 'UO = upstream overflow — circuit breaker tripped, request rejected.' },
    { category: 'Observability', term: 'response_flag UH', syntax: 'istio_requests_total{response_flags="UH"}', desc: 'UH = upstream unhealthy — no healthy upstream endpoints available.' },
    { category: 'Observability', term: 'response_flag NR', syntax: 'istio_requests_total{response_flags="NR"}', desc: 'NR = no route — Envoy has no route matching the request (misconfigured VirtualService).' },
    { category: 'Observability', term: 'Telemetry API — disable access log', syntax: 'spec:\n  accessLogging:\n  - disabled: true', desc: 'Disable access logs for all workloads in scope — reduces CPU/I-O at high RPS.' },
    { category: 'Observability', term: 'Envoy stats dump', syntax: 'kubectl exec <pod> -c istio-proxy -- curl -s localhost:15000/stats | grep upstream_rq', desc: 'Raw Envoy counters for upstream requests — filter by service name for targeted debugging.' },

    // Ambient
    { category: 'Ambient', term: 'Enable Ambient namespace', syntax: 'kubectl label namespace <ns> istio.io/dataplane-mode=ambient', desc: 'Opt all pods in the namespace into Ambient mode — no restarts needed.' },
    { category: 'Ambient', term: 'Deploy Waypoint (L7)', syntax: 'istioctl waypoint apply --namespace <ns>', desc: 'Deploy Waypoint proxy for L7 features (VirtualService, JWT, header policies) in an Ambient namespace.' },
    { category: 'Ambient', term: 'L7 AuthorizationPolicy (Waypoint)', syntax: 'spec:\n  targetRef:\n    group: gateway.networking.k8s.io\n    kind: Gateway\n    name: waypoint\n  action: ALLOW', desc: 'Attach L7 policy to Waypoint proxy — not pod selector. Required in Ambient mode.' },
    { category: 'Ambient', term: 'ztunnel workload status', syntax: 'istioctl ztunnel-config workload -n <ns>', desc: 'Verify Ambient enrollment — all pods should show HEALTHY ztunnel assignment.' },
    { category: 'Ambient', term: 'ztunnel logs (authz)', syntax: 'kubectl logs -n istio-system -l app=ztunnel | grep authz', desc: 'Check ztunnel authorization decisions for L4 policy debugging.' },

    // Multi-Cluster
    { category: 'Multi-Cluster', term: 'Create remote secret', syntax: 'istioctl create-remote-secret --context=<cluster-ctx> --name=<cluster-name>', desc: 'Generate kubeconfig secret enabling Istiod to watch a remote cluster API server.' },
    { category: 'Multi-Cluster', term: 'Verify cross-cluster endpoints', syntax: 'istioctl proxy-config endpoint deploy/<pod> --cluster "outbound|8080||svc.ns.svc.cluster.local"', desc: 'Confirm endpoints from both clusters appear in the EDS list for this service.' },
    { category: 'Multi-Cluster', term: 'Locality failover DestinationRule', syntax: 'loadBalancer:\n  localityLbSetting:\n    enabled: true\n    failover:\n    - from: us-east1\n      to: eu-west1', desc: 'Prefer local region endpoints; fail over to eu-west1 when local endpoints are unhealthy.' },
    { category: 'Multi-Cluster', term: 'East-west gateway expose', syntax: 'kind: Gateway\nspec:\n  selector:\n    istio: eastwestgateway\n  servers:\n  - port:\n      number: 15443\n      protocol: TLS\n    tls:\n      mode: AUTO_PASSTHROUGH\n    hosts:\n    - "*.local"', desc: 'Expose all mesh services for cross-cluster routing via AUTO_PASSTHROUGH.' },

    // Envoy
    { category: 'Envoy', term: 'Full config dump', syntax: 'kubectl exec <pod> -c istio-proxy -- curl -s localhost:15000/config_dump', desc: 'Dump complete Envoy config — listeners, routes, clusters, endpoints.' },
    { category: 'Envoy', term: 'Cluster health', syntax: 'kubectl exec <pod> -c istio-proxy -- curl -s localhost:15000/clusters | grep <svc>', desc: 'Show cluster health and endpoint status for a specific upstream.' },
    { category: 'Envoy', term: 'Change log level', syntax: 'kubectl exec <pod> -c istio-proxy -- curl -X POST localhost:15000/logging?level=debug', desc: 'Set Envoy log level to debug (verbose) — reset to warning after debugging.' },
    { category: 'Envoy', term: 'Envoy memory usage', syntax: 'kubectl exec <pod> -c istio-proxy -- curl -s localhost:15000/memory', desc: 'Show current Envoy heap usage vs limit — alert if > 80% of memory limit.' },
    { category: 'Envoy', term: 'Inbound port', syntax: '15006', desc: 'iptables redirects all inbound pod traffic (to the app) to Envoy port 15006.' },
    { category: 'Envoy', term: 'Outbound port', syntax: '15001', desc: 'iptables redirects all outbound pod traffic (from the app) to Envoy port 15001.' },
    { category: 'Envoy', term: 'xDS push order', syntax: 'CDS → EDS → LDS → RDS', desc: 'Istiod push order ensures clusters exist before listeners reference them — prevents 503 during updates.' },

    // Consul
    { category: 'Consul', term: 'Install Consul (Helm)', syntax: 'helm install consul hashicorp/consul --set global.name=consul --set connectInject.enabled=true -n consul', desc: 'Install Consul with service mesh (Connect) injection enabled.' },
    { category: 'Consul', term: 'ServiceDefaults — protocol', syntax: 'kind: ServiceDefaults\nspec:\n  protocol: http', desc: 'Required before any L7 Consul CRD — declares service traffic is HTTP.' },
    { category: 'Consul', term: 'ServiceSplitter — canary', syntax: 'kind: ServiceSplitter\nspec:\n  splits:\n  - weight: 90\n    serviceSubset: stable\n  - weight: 10\n    serviceSubset: canary', desc: '90/10 canary split. Weights must sum to 100.' },
    { category: 'Consul', term: 'ServiceIntentions — allow', syntax: 'kind: ServiceIntentions\nspec:\n  destination:\n    name: payment\n  sources:\n  - name: frontend\n    action: allow', desc: 'Allow frontend → payment traffic. All other sources denied (with ACLs enabled).' },
    { category: 'Consul', term: 'Consul mTLS check', syntax: 'consul connect proxy -sidecar-for <service> -log-level debug', desc: 'Debug Consul Connect proxy for a service — shows mTLS negotiation logs.' },
  ];

  filteredEntries = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const cat = this.activeCategory();
    return this.entries.filter(e => {
      const matchCat = cat === 'All' || e.category === cat;
      const matchQ = !q || e.term.toLowerCase().includes(q) || e.syntax.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  });

  setCategory(cat: string) { this.activeCategory.set(cat); }
  onSearch(val: string) { this.searchQuery.set(val); }
}
