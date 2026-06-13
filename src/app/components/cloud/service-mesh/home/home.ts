import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic { title: string; route: string; badge: string; description: string; keyPoints: string[]; available: boolean; }

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'Istio': 'istio', 'Linkerd': 'linkerd',
  'Traffic': 'traffic', 'Security': 'security', 'Observability': 'observability',
  'Gateway API': 'gateway', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'Istio', 'Linkerd', 'Traffic', 'Security', 'Observability', 'Gateway API', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'Service Mesh Fundamentals', route: '/service-mesh', badge: 'Foundations', description: 'What a service mesh is — sidecar proxies, control plane vs data plane, and why you need one.', keyPoints: ['Sidecar proxy pattern', 'Control plane vs data plane', 'mTLS automatic encryption', 'Observability without code changes', 'Service mesh trade-offs'], available: false },
  { title: 'Istio Architecture', route: '/service-mesh', badge: 'Istio', description: 'Istiod control plane, Envoy sidecar data plane, and how Istio manages service-to-service communication.', keyPoints: ['Istiod: Pilot, Citadel, Galley', 'Envoy sidecar injection', 'xDS discovery APIs', 'Service entry for external services', 'istioctl CLI'], available: false },
  { title: 'Istio Installation & Configuration', route: '/service-mesh', badge: 'Istio', description: 'Install Istio with istioctl or Helm, IstioOperator CRD, and namespace injection configuration.', keyPoints: ['istioctl install profile', 'IstioOperator configuration', 'Namespace label injection', 'Istio revision tagging', 'Minimal vs demo profile'], available: false },
  { title: 'Linkerd', route: '/service-mesh', badge: 'Linkerd', description: 'Lightweight CNCF service mesh — simpler than Istio, Rust-based micro-proxy, and CLI workflows.', keyPoints: ['linkerd install / check', 'Automatic mTLS', 'Rust micro-proxy (less overhead)', 'linkerd viz dashboard', 'Linkerd vs Istio trade-offs'], available: false },
  { title: 'Traffic Management', route: '/service-mesh', badge: 'Traffic', description: 'VirtualService, DestinationRule, weighted routing, canary releases, and A/B testing with Istio.', keyPoints: ['VirtualService routing rules', 'DestinationRule subsets', 'Weight-based canary routing', 'Header-based routing', 'Fault injection for testing'], available: false },
  { title: 'Retries, Timeouts & Circuit Breaking', route: '/service-mesh', badge: 'Traffic', description: 'Configure retries, request timeouts, and circuit breaking in DestinationRule to improve resilience.', keyPoints: ['retries attempts and perTryTimeout', 'VirtualService timeout field', 'outlierDetection circuit breaker', 'consecutiveErrors threshold', 'Passive health checking'], available: false },
  { title: 'Load Balancing Algorithms', route: '/service-mesh', badge: 'Traffic', description: 'Round-robin, least request, random, and consistent hashing load balancing in a service mesh.', keyPoints: ['ROUND_ROBIN (default)', 'LEAST_CONN for latency', 'Random algorithm', 'Consistent hash with cookie/header', 'Locality load balancing'], available: false },
  { title: 'mTLS & Service Identity', route: '/service-mesh', badge: 'Security', description: 'Mutual TLS between services — SPIFFE/SVID identities, PeerAuthentication, and certificate rotation.', keyPoints: ['SPIFFE identities (SVID)', 'PeerAuthentication STRICT mode', 'Automatic cert rotation', 'Trust domain configuration', 'mTLS debugging with istioctl'], available: false },
  { title: 'Authorization Policies', route: '/service-mesh', badge: 'Security', description: 'Istio AuthorizationPolicy — allow/deny rules by source, destination, HTTP method, and JWT claims.', keyPoints: ['AuthorizationPolicy ALLOW/DENY', 'source.principals (SPIFFE)', 'HTTP methods and paths', 'JWT claims conditions', 'Namespace-wide deny-all policy'], available: false },
  { title: 'Metrics & Telemetry', route: '/service-mesh', badge: 'Observability', description: 'Istio-generated Prometheus metrics — request rate, error rate, and latency (RED metrics).', keyPoints: ['istio_requests_total metric', 'request_duration histogram', 'Prometheus scrape config', 'Grafana Istio dashboards', 'Custom Telemetry API'], available: false },
  { title: 'Distributed Tracing', route: '/service-mesh', badge: 'Observability', description: 'Trace requests across services with Zipkin/Jaeger and B3/W3C propagation headers.', keyPoints: ['B3 / W3C TraceContext headers', 'Zipkin and Jaeger backends', 'Trace sampling rate', 'Propagate headers in code', 'Kiali service graph'], available: false },
  { title: 'Kiali & Dashboards', route: '/service-mesh', badge: 'Observability', description: 'Kiali topology graph, Grafana Istio dashboards, and Jaeger trace UI for visualising mesh health.', keyPoints: ['Kiali graph topology', 'Traffic flow animation', 'Grafana service dashboards', 'Jaeger trace timeline', 'Alerting on error rate'], available: false },
  { title: 'Kubernetes Gateway API', route: '/service-mesh', badge: 'Gateway API', description: 'The successor to Ingress — Gateway, HTTPRoute, GRPCRoute, and TCPRoute CRDs.', keyPoints: ['GatewayClass and Gateway', 'HTTPRoute routing rules', 'Role-based route ownership', 'Supports weighted routing', 'Istio and Envoy Gateway support'], available: false },
  { title: 'Ingress Gateway', route: '/service-mesh', badge: 'Gateway API', description: 'Istio Gateway and VirtualService for north-south traffic, TLS termination, and SNI routing.', keyPoints: ['Istio Gateway resource', 'VirtualService with gateway binding', 'TLS termination configuration', 'SNI-based routing', 'Expose via LoadBalancer'], available: false },
  { title: 'Service Mesh Performance', route: '/service-mesh', badge: 'Reference', description: 'Latency overhead, memory cost per sidecar, tuning Envoy, and deciding when to skip the mesh.', keyPoints: ['Sidecar latency overhead', 'Memory per Envoy process', 'Envoy concurrency tuning', 'Selective injection', 'Ambient mesh sidecar-less option'], available: false },
];

@Component({ selector: 'app-service-mesh-home', standalone: true, imports: [RouterLink], templateUrl: './home.html', styleUrl: './home.scss' })
export class ServiceMeshHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
