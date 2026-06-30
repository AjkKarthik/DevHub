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
  selector: 'app-mesh-envoy',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './envoy.html',
  styleUrl: './envoy.scss',
})
export class MeshEnvoy {
  quickRef: QuickRefItem[] = [
    { name: 'Listener', type: 'keyword', desc: 'Envoy\'s network entry point: binds to a port, matches connections, chains to filter chains. 15006 (inbound), 15001 (outbound).' },
    { name: 'Filter Chain', type: 'keyword', desc: 'Ordered set of network and HTTP filters applied to a connection. Each chain has match criteria (port, SNI, ALPN).' },
    { name: 'Cluster', type: 'keyword', desc: 'Envoy\'s representation of an upstream service: LB algorithm, health checks, circuit breakers, and the endpoint set (EDS).' },
    { name: 'Route', type: 'keyword', desc: 'HTTP-level routing rules: match headers/path/method → pick cluster. Multiple routes per VirtualHost, multiple VirtualHosts per RouteConfiguration.' },
    { name: 'xDS API', type: 'keyword', desc: 'Control-plane protocol: LDS (listeners), RDS (routes), CDS (clusters), EDS (endpoints). Istiod speaks xDS over gRPC.' },
    { name: 'Endpoint Discovery (EDS)', type: 'keyword', desc: 'Dynamic endpoint delivery: Istiod pushes healthy pod IPs to proxies instead of proxies querying DNS.' },
    { name: 'Admin API', type: 'keyword', desc: 'Envoy local admin at localhost:15000 — /stats, /config_dump, /clusters, /listeners, /logging. Never expose externally.' },
    { name: 'EnvoyFilter', type: 'keyword', desc: 'Istio CRD to patch raw Envoy config: add/remove filters, modify cluster settings. Last-resort — prefer VirtualService/DestinationRule.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Envoy Architecture — Listeners → Filters → Clusters',
      points: [
        'Envoy is a Layer 4/7 proxy with a modular filter pipeline. The core data path: connection arrives at a Listener → matched to a Filter Chain → network filters process bytes → (for HTTP) HTTP filters process requests → Router filter selects a Cluster → request forwarded to an endpoint.',
        'Listeners bind to a specific IP:port. Istio programs two virtual listeners: 0.0.0.0:15006 (inbound — traffic TO the pod) and 0.0.0.0:15001 (outbound — traffic FROM the pod). iptables rules redirect all pod traffic through these ports.',
        'Filter chains within a listener distinguish traffic by TLS SNI (for HTTPS) or ALPN (for H2 vs H1). Each filter chain runs an independent ordered set of filters — a connection matching multiple chains picks the most specific one.',
        'Network filters operate on raw bytes: `http_connection_manager` upgrades TCP streams to HTTP; `tcp_proxy` tunnels raw TCP. Most Istio magic is inside the `http_connection_manager` (HCM).',
        'The HCM hosts HTTP filters in a chain: jwt_authn → rbac → lua (optional) → router. The router is always last — it performs cluster selection and upstream request forwarding.',
        'Clusters represent upstream services. Each cluster has: LB policy, health check settings, circuit breaker thresholds, TLS config for upstream connections, and a reference to an EDS endpoint set. Cluster names in Istio follow the pattern `outbound|<port>|<subset>|<fqdn>`.',
      ],
    },
    {
      heading: 'xDS Protocol — How Istiod Programs Envoy',
      points: [
        'xDS (Extensible Discovery Service) is the gRPC-based protocol Istio uses to configure Envoy at runtime without restarts. The four core APIs: LDS (Listener Discovery), RDS (Route Discovery), CDS (Cluster Discovery), EDS (Endpoint Discovery).',
        'Envoy connects to Istiod on port 15012 (TLS, mutual) or 15010 (plaintext, dev only). Istiod acts as the management server — it watches Kubernetes resources (Services, Pods, Istio CRDs) and translates them into xDS config.',
        'Delta xDS vs state-of-the-world (SotW): newer Envoy uses Delta xDS — only changed resources are sent per push. SotW sends the complete resource set. Istio defaults to Delta xDS for efficiency in large clusters.',
        'Push order matters: Istiod pushes CDS → EDS → LDS → RDS. This order ensures that when a listener is updated with a new cluster reference, that cluster already exists in Envoy\'s config. Out-of-order pushes cause 503s.',
        'NACK (Negative ACK): if Envoy rejects a pushed resource (e.g., invalid config), it sends a NACK back to Istiod. Istiod logs the NACK and retries. Check `istioctl proxy-status` — if a proxy shows "STALE", it has pending changes that haven\'t been acknowledged.',
        'Pilot agent (process 1 in the sidecar container): manages the Envoy process lifecycle, handles certificate rotation (talks to Istiod on port 15012 for SVID), and proxies xDS from Istiod to Envoy. It\'s the bootstrap — Envoy starts with a minimal config pointing to pilot-agent, then pilot-agent feeds it the full xDS.',
      ],
    },
    {
      heading: 'Envoy Admin API — Debugging Toolkit',
      points: [
        'The admin API at localhost:15000 is Envoy\'s most powerful debugging interface. It exposes current config, runtime stats, and control endpoints. Access it via `kubectl exec <pod> -c istio-proxy -- curl -s localhost:15000/<endpoint>`.',
        '/config_dump: returns the full current Envoy config as JSON — every listener, filter chain, cluster, route, and endpoint. This is the ground truth of what Envoy is actually doing right now.',
        '/stats: Prometheus-compatible metrics from Envoy. Contains thousands of counters, gauges, and histograms. Filter with grep: `curl localhost:15000/stats | grep "upstream_rq_total"`. This is the raw source for Istio metrics (Istiod scrapes this via Prometheus).',
        '/clusters: shows each upstream cluster with its current endpoint health status, LB policy, and connection stats. Quick way to see which backend pods are healthy from this proxy\'s perspective.',
        '/listeners: lists active listeners with their filter chains. Useful for verifying that mTLS filter chains are present (ALPN: istio-peer-exchange) vs plaintext chains.',
        '/logging: dynamically change log levels without restarting Envoy. `curl -X POST localhost:15000/logging?level=debug` — use sparingly; debug logging is extremely verbose at high RPS.',
      ],
    },
    {
      heading: 'EnvoyFilter — Direct Config Patching',
      points: [
        'EnvoyFilter is an escape hatch for config Istio doesn\'t expose through its higher-level APIs (VirtualService, DestinationRule). It directly patches Envoy\'s xDS config using the Protobuf patch operations: MERGE, ADD, REMOVE, INSERT_BEFORE, INSERT_AFTER.',
        'Operations target specific Envoy objects: `LISTENER`, `FILTER_CHAIN`, `NETWORK_FILTER`, `HTTP_FILTER`, `CLUSTER`, `ROUTE_CONFIGURATION`, `VIRTUAL_HOST`, `HTTP_ROUTE`.',
        'Common use cases: add a custom Lua filter for header manipulation; configure the Wasm extension filter; set advanced Envoy cluster settings not exposed in DestinationRule; modify the JWT authn filter options.',
        'EnvoyFilter risks: it operates below Istio\'s abstraction layer — Istio updates may break EnvoyFilter patches if the underlying config structure changes. Always pin to the Istio version in the `proxyVersion` field.',
        'Priority: EnvoyFilters in `istio-system` namespace apply globally. Namespace-scoped EnvoyFilters override global ones for pods in that namespace. Workload-selector EnvoyFilters are most specific.',
        'Debugging: after applying an EnvoyFilter, compare `kubectl exec -c istio-proxy -- pilot-agent request GET config_dump` before and after. The patch should appear in the relevant section. If it doesn\'t, `istioctl analyze` may reveal a validation error.',
      ],
    },
    {
      heading: 'Traffic Interception — iptables and Transparent Proxy',
      points: [
        'Istio\'s init container (`istio-init`) runs before the app container and sets up iptables rules that redirect all inbound and outbound TCP traffic through Envoy\'s ports (15006 inbound, 15001 outbound).',
        'The redirect uses iptables REDIRECT target in the OUTPUT and PREROUTING chains. All traffic leaving or entering the pod\'s network namespace is intercepted — the app doesn\'t know it\'s going through a proxy.',
        'Exclusions: traffic to/from the Envoy admin port (15000), the pilot-agent metrics port (15020), and traffic from the `istio-proxy` user UID (1337) is excluded from redirection — otherwise Envoy\'s own egress traffic would loop back to itself.',
        'HBONE (HTTP-Based Overlay Network Encapsulation): in Ambient Mesh mode, Envoy uses HBONE tunnels (HTTP CONNECT upgraded) instead of iptables redirect. This eliminates the init container requirement.',
        'Alternative interception: with eBPF (Istio experimental, Cilium integration), iptables is replaced with eBPF programs — lower overhead, better observability, but requires kernel 5.10+.',
        'Inspect iptables rules: `kubectl exec <pod> -c istio-proxy -- iptables -t nat -L`. The ISTIO_REDIRECT, ISTIO_INBOUND, ISTIO_OUTPUT chains show the exact redirect rules installed by the init container.',
      ],
    },
    {
      heading: 'Wasm Extensions and Lua Filters',
      points: [
        'Istio supports extending Envoy with WebAssembly (Wasm) modules via the WasmPlugin CRD. Wasm modules run in a sandboxed VM inside Envoy — safe, portable, and deployable without Envoy restarts.',
        'WasmPlugin spec: `url` (OCI image or remote URL for the .wasm binary), `phase` (AUTHN/AUTHZ/STATS/UNSPECIFIED), `match` (workload selector), `pluginConfig` (arbitrary YAML passed to the plugin). The plugin is distributed via the Envoy module cache.',
        'Lua filters (EnvoyFilter): simpler than Wasm for lightweight header manipulation. Use the `lua` HTTP filter type. Lua runs synchronously in the filter chain — avoid blocking operations.',
        'WasmPlugin use cases: custom auth (API key validation), custom metrics (business-level counters), header enrichment (add correlation IDs), response manipulation (strip headers).',
        'Wasm performance: Wasm adds ~0.1-0.5ms per request depending on plugin complexity. Profile before deploying to high-traffic services.',
        'Distribution: Wasm modules can be hosted as OCI images (push to any container registry). Envoy fetches them at startup. Use `imagePullPolicy: IfNotPresent` to avoid fetching on every restart.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Admin API Debugging',
      language: 'bash',
      code: `# Full config dump — everything Envoy knows
kubectl exec deploy/myapp -c istio-proxy -- \\
  curl -s localhost:15000/config_dump | python3 -m json.tool | head -100

# Cluster status — upstream health from this proxy's perspective
kubectl exec deploy/myapp -c istio-proxy -- \\
  curl -s localhost:15000/clusters | grep "payment-service"

# Listener dump — verify mTLS filter chains
kubectl exec deploy/myapp -c istio-proxy -- \\
  curl -s localhost:15000/listeners

# Key metrics
kubectl exec deploy/myapp -c istio-proxy -- \\
  curl -s localhost:15000/stats | grep -E "upstream_rq_(total|5xx|retry)"

# Istioctl wrappers (easier than raw curl)
istioctl proxy-config cluster deploy/myapp
istioctl proxy-config listener deploy/myapp
istioctl proxy-config route deploy/myapp --name http.8080
istioctl proxy-config endpoint deploy/myapp --cluster "outbound|8080||payment-service.production.svc.cluster.local"

# Check proxy sync status (SYNCED = up to date with Istiod)
istioctl proxy-status`,
    },
    {
      label: 'EnvoyFilter — Add Lua Header',
      language: 'bash',
      code: `# Add a Lua HTTP filter to inject a custom header on every response
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: add-response-header
  namespace: production
spec:
  workloadSelector:
    labels:
      app: api-gateway
  configPatches:
  - applyTo: HTTP_FILTER
    match:
      context: SIDECAR_INBOUND
      listener:
        filterChain:
          filter:
            name: "envoy.filters.network.http_connection_manager"
            subFilter:
              name: "envoy.filters.http.router"
    patch:
      operation: INSERT_BEFORE
      value:
        name: envoy.filters.http.lua
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.http.lua.v3.LuaPerRoute
          inline_code: |
            function envoy_on_response(response_handle)
              response_handle:headers():add("X-Powered-By", "ServiceMesh")
            end
EOF`,
    },
    {
      label: 'WasmPlugin',
      language: 'bash',
      code: `# Deploy a Wasm extension for API key validation
cat <<EOF | kubectl apply -f -
apiVersion: extensions.istio.io/v1alpha1
kind: WasmPlugin
metadata:
  name: api-key-auth
  namespace: production
spec:
  selector:
    matchLabels:
      app: api-gateway
  url: oci://my-registry.io/wasm/api-key-validator:v1.2.0
  phase: AUTHN
  imagePullPolicy: IfNotPresent
  pluginConfig:
    header_name: X-API-Key
    secret_ref: api-keys-secret
    cache_ttl: 300
EOF

# Verify WasmPlugin is loaded in Envoy config
istioctl proxy-config listener deploy/api-gateway -o json \\
  | python3 -c "import sys,json; d=json.load(sys.stdin); \\
    [print(f['name']) for l in d for fc in l.get('filterChains',[]) \\
     for f in fc.get('filters',[])]"`,
    },
    {
      label: 'xDS Debugging',
      language: 'bash',
      code: `# Check which xDS resources a proxy has received
istioctl proxy-config all deploy/myapp -o json > full_config.json

# Watch xDS push events from Istiod (verbose)
kubectl logs -n istio-system deploy/istiod -c discovery --follow \\
  | grep "push"

# Check for NACK'd resources (proxy rejected a config push)
istioctl proxy-status | grep -v "SYNCED"

# Istiod push metrics
kubectl exec -n istio-system deploy/istiod -- \\
  curl -s localhost:15014/metrics | grep -E "pilot_xds_push(es|_time)"

# Decode a specific route config for a listener
istioctl proxy-config route deploy/myapp \\
  --name "http.8080" -o json | python3 -m json.tool

# Verify endpoint health from a specific sidecar's view
istioctl proxy-config endpoint deploy/myapp \\
  --cluster "outbound|8080||backend.production.svc.cluster.local"
# Expected output: IP:port, health=HEALTHY, weight=1`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using EnvoyFilter when VirtualService/DestinationRule is sufficient',
      wrong: `# EnvoyFilter to set a 30s timeout
# Brittle: breaks if Istio changes internal filter names
applyTo: HTTP_FILTER
patch:
  value:
    typed_config:
      route_config:
        virtual_hosts:
          - routes:
              - route:
                  timeout: 30s`,
      right: `# VirtualService: clean, version-stable, validated by Istiod
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
spec:
  http:
  - timeout: 30s
    route:
    - destination:
        host: backend`,
      explanation: 'EnvoyFilter patches raw Envoy protobuf config — the structure can change between Istio versions, breaking your patch silently. VirtualService and DestinationRule are stable, version-safe abstractions that Istio validates. Only use EnvoyFilter for capabilities not exposed through the higher-level APIs.',
    },
    {
      title: 'Exposing the Envoy admin port externally',
      wrong: `# Kubernetes Service exposing port 15000
ports:
- name: envoy-admin
  port: 15000     # Full admin access — dangerous!
  # Anyone can: change log levels, modify runtime config,
  # access /config_dump (full internal state), drain connections`,
      right: `# Admin API is localhost-only by design
# Access via kubectl exec — never expose as a Service
kubectl exec deploy/myapp -c istio-proxy -- \\
  curl -s localhost:15000/stats`,
      explanation: 'The Envoy admin API (port 15000) exposes full internal state (config_dump, all stats, connected endpoints) and control endpoints (log level changes, drain). Exposing it externally is a security vulnerability — attackers can read your entire service topology and disrupt connections. Always access via kubectl exec.',
    },
    {
      title: 'Not pinning EnvoyFilter to a proxy version',
      wrong: `# EnvoyFilter without proxyVersion
# Istio upgrade changes internal filter names
# Old patch targets a filter that no longer exists → silently ignored
# OR targets wrong position → traffic corrupted`,
      right: `spec:
  configPatches:
  - match:
      proxy:
        proxyVersion: "^1\\.20.*"  # Only apply to Istio 1.20.x
      context: SIDECAR_OUTBOUND
  ...`,
      explanation: 'EnvoyFilter patches are tied to Istio\'s internal config structure, which changes between versions. Without `proxyVersion`, an upgrade can silently break your patch. Pin to the major.minor version range and plan to update the filter when upgrading Istio.',
    },
    {
      title: 'Confusing Envoy cluster names when debugging',
      wrong: `# Looking for service by Kubernetes name
istioctl proxy-config cluster deploy/myapp --fqdn "payment-service"
# Returns nothing — Envoy uses fully-qualified names`,
      right: `# Use the full FQDN or the Istio cluster name pattern
istioctl proxy-config cluster deploy/myapp \\
  --fqdn "payment-service.production.svc.cluster.local"

# Or search by partial name
istioctl proxy-config cluster deploy/myapp | grep payment`,
      explanation: 'Envoy cluster names in Istio follow the pattern `outbound|<port>|<subset>|<fqdn>` where fqdn is the full Kubernetes FQDN (e.g., `payment-service.production.svc.cluster.local`). Searching by Kubernetes short name returns nothing. Use `istioctl proxy-config cluster | grep <partial>` to find the correct name.',
    },
    {
      title: 'Applying EnvoyFilter in the wrong namespace for global effect',
      wrong: `# EnvoyFilter in the app namespace — only affects that namespace
metadata:
  namespace: production
  # Intended to be global — but only applies to production pods`,
      right: `# Global EnvoyFilter: place in istio-system
metadata:
  namespace: istio-system
  # No workloadSelector → applies to ALL sidecars in the mesh

# Or scope precisely with workloadSelector
spec:
  workloadSelector:
    labels:
      app: api-gateway`,
      explanation: 'EnvoyFilters in `istio-system` without a workloadSelector apply globally to all proxies. EnvoyFilters in application namespaces only apply to pods in that namespace. If you need a global filter (e.g., a security header for all traffic), place it in `istio-system`. If you need targeted application, use `workloadSelector`.',
    },
  ];

  challenge: Challenge = {
    title: 'Parse Envoy Config Dump',
    language: 'typescript',
    description: `Given a simplified Envoy config_dump structure, write a function that extracts all outbound cluster names that have circuit breaker settings (connectionPool with maxConnections > 0).`,
    hints: [
      'Envoy clusters are in the "static_resources.clusters" or "dynamic_active_clusters" section',
      'Circuit breaker thresholds are in cluster.circuit_breakers.thresholds',
      'Istio cluster names follow pattern: outbound|port|subset|fqdn',
    ],
    starterCode: `interface EnvoyCluster {
  name: string;
  circuit_breakers?: {
    thresholds?: Array<{ max_connections?: number }>;
  };
}

interface ConfigDump {
  configs: Array<{
    '@type': string;
    dynamic_active_clusters?: Array<{ cluster: EnvoyCluster }>;
  }>;
}

function getClustersWithCircuitBreaker(dump: ConfigDump): string[] {
  // Extract outbound cluster names with maxConnections > 0
  return [];
}`,
    solution: `interface EnvoyCluster {
  name: string;
  circuit_breakers?: {
    thresholds?: Array<{ max_connections?: number }>;
  };
}

interface ConfigDump {
  configs: Array<{
    '@type': string;
    dynamic_active_clusters?: Array<{ cluster: EnvoyCluster }>;
  }>;
}

function getClustersWithCircuitBreaker(dump: ConfigDump): string[] {
  const clusters: string[] = [];
  for (const config of dump.configs) {
    if (!config.dynamic_active_clusters) continue;
    for (const { cluster } of config.dynamic_active_clusters) {
      if (!cluster.name.startsWith('outbound|')) continue;
      const thresholds = cluster.circuit_breakers?.thresholds ?? [];
      const hasBreaker = thresholds.some(t => (t.max_connections ?? 0) > 0);
      if (hasBreaker) clusters.push(cluster.name);
    }
  }
  return clusters;
}

// Test
const dump: ConfigDump = {
  configs: [{
    '@type': 'type.googleapis.com/envoy.admin.v3.ClustersConfigDump',
    dynamic_active_clusters: [
      { cluster: { name: 'outbound|8080||payment.prod.svc.cluster.local', circuit_breakers: { thresholds: [{ max_connections: 100 }] } } },
      { cluster: { name: 'outbound|8080||user.prod.svc.cluster.local' } },
      { cluster: { name: 'inbound|8080||', circuit_breakers: { thresholds: [{ max_connections: 50 }] } } },
    ]
  }]
};
console.log(getClustersWithCircuitBreaker(dump));
// ['outbound|8080||payment.prod.svc.cluster.local']`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the correct xDS push order from Istiod to ensure no 503s during config updates?',
      options: ['LDS → RDS → CDS → EDS', 'EDS → CDS → LDS → RDS', 'CDS → EDS → LDS → RDS', 'RDS → LDS → EDS → CDS'],
      answer: 2,
      explanation: 'Istiod pushes CDS → EDS → LDS → RDS. This order ensures that when a listener (LDS) references a new cluster, that cluster (CDS) and its endpoints (EDS) already exist. Pushing LDS first would cause Envoy to reference a cluster that doesn\'t exist yet, resulting in 503s until CDS arrives.',
    },
    {
      q: 'What does `istioctl proxy-status` showing "STALE" for a proxy indicate?',
      options: ['The proxy is running an old version of Envoy', 'The proxy has received a config push from Istiod but not yet acknowledged it (pending NACK or slow processing)', 'The proxy\'s TLS certificate has expired', 'The proxy cannot reach its upstream services'],
      answer: 1,
      explanation: '"STALE" means Istiod has pushed updated config to the proxy but the proxy hasn\'t acknowledged receiving it yet. This is usually transient (in-flight push) but if it persists, it indicates the proxy NACKed the config (invalid resource) or the xDS connection is broken. Check `istioctl proxy-status` output and Istiod logs for NACK messages.',
    },
    {
      q: 'What port does Envoy listen on for inbound traffic (to the pod) in an Istio sidecar?',
      options: ['8080 (same as the app)', '15001 (outbound virtual listener)', '15006 (inbound virtual listener)', '15012 (pilot-agent xDS connection)'],
      answer: 2,
      explanation: 'iptables rules redirect all inbound pod traffic to port 15006, where Envoy listens as the inbound virtual listener. Envoy then forwards to the actual app port (e.g., 8080) via a loopback connection. Port 15001 is the outbound virtual listener (traffic FROM the app). Port 15012 is for xDS from pilot-agent to Istiod.',
    },
    {
      q: 'What is the primary purpose of the `pilot-agent` process in the Istio sidecar?',
      options: ['It IS Envoy — pilot-agent is just an alias for the Envoy binary', 'It manages the Envoy process lifecycle, bootstraps xDS, and handles certificate rotation via SDS', 'It intercepts traffic and forwards to Envoy for processing', 'It scrapes Envoy metrics and forwards them to Prometheus'],
      answer: 1,
      explanation: 'pilot-agent is a separate Go process (PID 1 in the sidecar container) that manages the Envoy binary. It: bootstraps Envoy with initial config pointing to Istiod, manages the Envoy process (restart on crash), handles certificate rotation by fetching new SVIDs from Istiod via SDS, and exposes health endpoints. It\'s the glue between Kubernetes lifecycle and Envoy.',
    },
    {
      q: 'When should you use EnvoyFilter vs VirtualService/DestinationRule?',
      options: ['EnvoyFilter for all config — it\'s more powerful and direct', 'VirtualService/DestinationRule for standard traffic management; EnvoyFilter only for capabilities not exposed through higher-level APIs (custom filters, advanced cluster settings)', 'EnvoyFilter for production, VirtualService/DestinationRule for development only', 'They are interchangeable — use whichever is more familiar'],
      answer: 1,
      explanation: 'VirtualService and DestinationRule are stable, Istio-validated abstractions that survive Istio upgrades. EnvoyFilter patches raw Envoy protobuf — the internal structure can change between Istio versions, breaking your patch silently. Use EnvoyFilter only for capabilities the higher-level APIs don\'t expose (custom Wasm filters, advanced Envoy settings). Always prefer the abstraction layer.',
    },
    {
      q: 'What does the Envoy /clusters endpoint show?',
      options: ['Kubernetes cluster membership (node/pod topology)', 'Each upstream service cluster with current endpoint health, LB policy, and connection stats from this proxy\'s perspective', 'The Istio control plane cluster topology', 'DNS resolution results for service names'],
      answer: 1,
      explanation: 'The Envoy /clusters admin endpoint shows every upstream cluster Envoy knows about, with per-endpoint health status, connection counts, and circuit breaker state. It shows the mesh from this specific proxy\'s perspective — useful for debugging "why is traffic not reaching service X?" questions. Access via `kubectl exec <pod> -c istio-proxy -- curl localhost:15000/clusters`.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does iptables traffic interception work in Istio, and what are the exclusions?',
      a: 'The `istio-init` init container runs `iptables` commands to set up traffic redirection in the pod\'s network namespace before the app or sidecar start: <ul><li><strong>Outbound</strong>: OUTPUT chain → ISTIO_OUTPUT → REDIRECT to port 15001 (Envoy outbound listener)</li><li><strong>Inbound</strong>: PREROUTING chain → ISTIO_INBOUND → REDIRECT to port 15006 (Envoy inbound listener)</li></ul>Exclusions from redirection: <ul><li>Traffic from UID 1337 (istio-proxy user) — prevents Envoy\'s own traffic from looping back</li><li>Port 15000 (admin), 15020 (pilot-agent metrics), 15021 (health probe), 15090 (Envoy Prometheus scrape)</li><li>Explicitly excluded ports via `traffic.sidecar.istio.io/excludeOutboundPorts` annotation</li></ul>',
    },
    {
      q: 'What does an Envoy cluster name like "outbound|8080|v2|payment.prod.svc.cluster.local" mean?',
      a: 'Istio\'s cluster name format: <code>direction|port|subset|fqdn</code>. <ul><li><strong>direction</strong>: outbound (traffic from the pod) or inbound (traffic to the pod)</li><li><strong>port</strong>: the Kubernetes Service port number (8080)</li><li><strong>subset</strong>: the DestinationRule subset name (v2, empty string if no subset)</li><li><strong>fqdn</strong>: the full Kubernetes Service DNS name (payment.prod.svc.cluster.local)</li></ul>You\'ll see this in `istioctl proxy-config cluster`, `/config_dump`, and Envoy logs. Empty subset means the default cluster (no DestinationRule subset). For clusters with multiple subsets (v1, v2), Istiod creates a separate EDS cluster per subset.',
    },
    {
      q: 'What is the difference between LDS, RDS, CDS, and EDS in the xDS protocol?',
      a: '<ul><li><strong>LDS (Listener Discovery Service)</strong>: delivers Listener resources — what ports Envoy binds to and which filter chains match incoming connections. Top-level entry point for traffic.</li><li><strong>RDS (Route Discovery Service)</strong>: delivers RouteConfiguration resources — HTTP-level routing rules (match path/header → pick cluster). Referenced by the HCM filter inside a listener.</li><li><strong>CDS (Cluster Discovery Service)</strong>: delivers Cluster resources — upstream service definitions with LB algorithm, circuit breakers, TLS config, and EDS reference.</li><li><strong>EDS (Endpoint Discovery Service)</strong>: delivers ClusterLoadAssignment resources — the actual healthy pod IP:port pairs for each cluster. Updated dynamically as pods start/stop.</li></ul>Push order: CDS → EDS → LDS → RDS. Each layer depends on the previous: routes reference clusters, clusters reference endpoints.',
    },
    {
      q: 'How do you debug a 503 error in an Istio mesh using Envoy tools?',
      a: 'Systematic 503 debugging: <ol><li><strong>Check response flags</strong>: `istioctl proxy-config log deploy/myapp --level debug` then curl and check access logs for response_flags (UF=upstream connection failed, UH=no healthy upstream, NR=no route)</li><li><strong>Check endpoint health</strong>: `istioctl proxy-config endpoint deploy/myapp --cluster "outbound|8080||backend.prod.svc.cluster.local"` — are any endpoints HEALTHY?</li><li><strong>Check circuit breaker</strong>: `kubectl exec deploy/myapp -c istio-proxy -- curl localhost:15000/stats | grep "overflow"` — are circuit breakers tripping?</li><li><strong>Check routing</strong>: `istioctl proxy-config route deploy/myapp --name http.8080 -o json` — is there a matching route?</li><li><strong>Check mTLS</strong>: `istioctl authn tls-check deploy/myapp backend.prod.svc.cluster.local` — is TLS mode compatible?</li></ol>',
    },
    {
      q: 'What is the difference between an inbound and outbound EnvoyFilter context?',
      a: '<ul><li><strong>SIDECAR_INBOUND</strong>: applies to the Envoy filter pipeline processing traffic arriving AT the pod (from other services or ingress). Use for: validating incoming requests, enforcing per-pod rate limits, adding auth filters for inbound traffic.</li><li><strong>SIDECAR_OUTBOUND</strong>: applies to the filter pipeline processing traffic leaving the pod (to other services). Use for: modifying outgoing request headers, adding tracing headers, enforcing egress policies.</li><li><strong>GATEWAY</strong>: applies to Istio Gateway proxies (not sidecars). Use for: customising TLS termination behavior, adding custom filters at the edge.</li></ul>Match context with `match.context` in the EnvoyFilter spec. Missing or wrong context means the patch targets the wrong pipeline and has no effect.',
    },
  { q: 'How do you debug Envoy proxy configuration in Istio?', a: 'Use istioctl proxy-config to inspect the Envoy config for a specific pod. The subcommands let you view listeners, clusters, routes, and endpoints. istioctl proxy-config listeners pod/name shows all listener ports and their filter chains. istioctl proxy-config clusters pod/name shows upstream cluster definitions. The Envoy admin interface is accessible on port 15000 inside the pod for live configuration dumps. istioctl dashboard envoy pod/name opens the admin UI in a browser for a visual exploration of routes, clusters, and active connections.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Envoy is a modular L4/L7 proxy with Listener → FilterChain → Cluster data path. Istiod programs it via xDS (LDS/RDS/CDS/EDS in push order). Debug via the admin API at localhost:15000 or istioctl proxy-config. Use EnvoyFilter only when VirtualService/DestinationRule can\'t do the job.',
    mustKnow: [
      'Data path: Listener → Filter Chain → HTTP Filters (jwt_authn, rbac, router) → Cluster → Endpoint',
      'xDS push order: CDS → EDS → LDS → RDS (cluster must exist before listener references it)',
      'port 15006 = inbound to pod; 15001 = outbound from pod; 15012 = pilot-agent ↔ Istiod xDS',
      'Admin API: /config_dump (full config), /clusters (endpoint health), /stats (metrics), /listeners',
      'EnvoyFilter: raw protobuf patch — brittle, version-sensitive. Last resort after VirtualService/DestinationRule',
      'NACK: proxy rejected a config push → check istioctl proxy-status for STALE proxies',
      'Cluster name format: outbound|port|subset|fqdn',
    ],
    interviewFocus: [
      'Describe Envoy\'s data path from incoming request to upstream response',
      'What is xDS and what are its four core APIs?',
      'Why does xDS push order matter (CDS → EDS → LDS → RDS)?',
      'When would you use EnvoyFilter vs VirtualService?',
      'How does iptables traffic interception work in an Istio sidecar?',
    ],
  };
}
