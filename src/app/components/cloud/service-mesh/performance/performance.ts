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
  selector: 'app-mesh-performance',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './performance.html',
  styleUrl: './performance.scss',
})
export class MeshPerformance {
  quickRef: QuickRefItem[] = [
    { name: 'concurrency', type: 'keyword', desc: 'meshConfig.defaultConfig.concurrency — number of Envoy worker threads per sidecar. Default: all CPUs.' },
    { name: 'proxyMemoryLimit', type: 'keyword', desc: 'Resource limit on the istio-proxy container. Too low → OOMKilled; too high → wastes node capacity.' },
    { name: 'discovery_selector', type: 'keyword', desc: 'meshConfig setting to limit which namespaces Istiod watches — reduces xDS push size and frequency.' },
    { name: 'sidecarScope', type: 'syntax', desc: 'Sidecar CRD limiting the set of services each proxy needs to know about — the biggest xDS scaling lever.' },
    { name: 'accessLog', type: 'keyword', desc: 'Envoy access logs add CPU cost. Disable or sample at 1-10% in high-traffic production environments.' },
    { name: 'holdApplicationUntilProxyStarts', type: 'keyword', desc: 'Prevents race conditions at pod start. Adds ~1-2s to pod startup time.' },
    { name: 'PILOT_PUSH_THROTTLE', type: 'keyword', desc: 'Istiod env var throttling concurrent xDS pushes — prevents overload during mass config changes.' },
    { name: 'Ambient Mesh', type: 'keyword', desc: 'Sidecar-free mesh mode — eliminates per-pod proxy overhead for the basic mTLS + observability use case.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Sidecar Overhead — Real Numbers',
      points: [
        'The Envoy sidecar adds latency per hop: typically 0.2-0.5ms for p50, 1-3ms for p99 in a well-configured mesh. This is additive across hops — 5 service hops = 5× the overhead.',
        'Memory overhead: each Envoy proxy uses 50-80MB RAM base + roughly ~1MB PER SERVICE it knows about (not per 1000 — a 500-service cluster without Sidecar scoping adds ~500MB on top of the base, matching real-world reports). In a large cluster (1000+ services), each proxy can use 1GB+ RAM if not scoped.',
        'CPU overhead: 0.5-2% CPU per 1000 RPS through a sidecar under normal conditions. Spikes during high-frequency config pushes (xDS). Worker thread count (concurrency) affects CPU usage.',
        'Control plane cost: each pod injection adds one more subscriber to Istiod xDS streams. At 10,000 pods, Istiod processes 10,000 concurrent xDS connections. Scale Istiod horizontally for large clusters.',
        'Actual production overhead is often 5-10% CPU and 50-100MB RAM per pod — acceptable for most services. For CPU-sensitive workloads (high-frequency trading, ML inference), consider Ambient Mesh or selective injection.',
        'Benchmark first: use Istio\'s official benchmark tool (https://github.com/istio/tools/tree/master/perf) to measure baseline vs mesh overhead in your specific environment before making architectural decisions.',
      ],
    },
    {
      heading: 'Sidecar CRD — The Biggest Scaling Lever',
      points: [
        'By default, every Envoy proxy knows about every service in the cluster. In a 500-service cluster, each proxy holds 500 EDS entries, 500 CDS entries, etc. — regardless of whether it ever talks to them.',
        'Sidecar CRD scopes the service registry visible to a workload: `egress.hosts` lists which services this proxy needs routing info for. Services outside the list are unknown to the proxy — attempts to reach them return 502.',
        'A well-scoped Sidecar CRD reduces xDS payload by 90%+ in large clusters: instead of 500 services, each proxy knows about only the 5-10 it actually calls.',
        'Sidecar scope at namespace level (no selector): applies to all workloads in the namespace. At workload level (with selector): applies to matched pods only.',
        '`egress.hosts: ["./"]` — include only services in the same namespace. `egress.hosts: ["istio-system/*"]` — add Istiod/telemetry services. Combine to minimise scope.',
        'Monitor xDS payload size: `istioctl proxy-config cluster <pod> | wc -l` — before and after Sidecar scope. A healthy scoped proxy should have <50 cluster entries.',
      ],
    },
    {
      heading: 'Istiod Performance',
      points: [
        'Istiod is the bottleneck in large meshes — it processes all xDS connections, validates all CRDs, and manages all certificate signing. Scale it out before it becomes a problem.',
        '`PILOT_PUSH_THROTTLE`: Istiod env var (default: 100) limits concurrent xDS pushes. During a mass config change (new VirtualService, pod restart storm), a low throttle prevents Istiod from being overwhelmed.',
        'Discovery selectors: `meshConfig.discoverySelectors` limits which namespaces Istiod watches. If you have 50 namespaces but only use the mesh in 10, add discovery selectors to stop Istiod from watching the other 40.',
        'Multiple Istiod replicas: Istiod supports horizontal scaling (active-active, not leader-elected). Each replica serves a subset of xDS connections. Use HPA on the Istiod Deployment.',
        'CRD count impact: each VirtualService and DestinationRule Istiod knows about increases xDS computation. Prune orphaned resources — `istioctl analyze` reports unused CRDs.',
        'Pilot dashboard: `istioctl dashboard pilot` opens Istiod\'s Prometheus metrics in a browser. Monitor `pilot_xds_pushes`, `pilot_xds_push_time`, and `pilot_services` to detect scaling issues early.',
      ],
    },
    {
      heading: 'Resource Tuning',
      points: [
        'Sidecar CPU request: start at `cpu: 10m` (request), `cpu: 200m` (limit). Tune up if you see CPU throttling (`container_cpu_cfs_throttled_periods_total / container_cpu_cfs_periods_total > 0.25`).',
        'Sidecar memory request: start at `memory: 40Mi` (request), `memory: 256Mi` (limit). Increase limit if you see OOMKilled events on the istio-proxy container.',
        'Concurrency tuning: `meshConfig.defaultConfig.concurrency: 2` limits Envoy to 2 worker threads per sidecar. For low-traffic services, this reduces idle CPU significantly. For high-traffic services, match concurrency to available CPUs.',
        'Access log cost: Envoy access logs (~100 bytes per request) add I/O overhead and increase memory pressure for log buffering. Disable with `meshConfig.accessLogFile: ""` in production or use the Telemetry API to sample at 1%.',
        'Protocol detection: if Istio cannot auto-detect the protocol (HTTP vs TCP), it defaults to TCP with no L7 features. Name ports explicitly: `http-myport`, `grpc-myport`, `tcp-myport` — Istio infers protocol from the port name prefix.',
        'Envoy warmup: fresh Envoy instances need time to establish upstream connection pools, resolve DNS, and populate caches before they perform as well as a warm proxy — NOT "JIT compilation" (Envoy\'s standard filter chain is natively-compiled C++ with no runtime JIT step at all; only optional WASM filters involve any JIT-like compilation). Account for this in your pod startup time SLOs — `warmupDurationSecs` helps by ramping traffic slowly to new pods.',
      ],
    },
    {
      heading: 'Traffic Routing Performance',
      points: [
        'Avoid wildcard hosts in VirtualService (`hosts: ["*"]`) — Istio applies the VirtualService to ALL services, increasing routing table size unnecessarily.',
        'DestinationRule TrafficPolicy changes invalidate EDS endpoints for that host — Istiod pushes a full EDS update to all clients. Batch DestinationRule changes to avoid cascading xDS storms.',
        'HTTP/2 multiplexing: H2C (HTTP/2 cleartext) reduces connection overhead for high-RPS services by letting one TCP connection serve many concurrent streams. Istio enables H2C by default between sidecars. (`useRemoteAddress` is unrelated to HTTP/2 performance — it controls whether Envoy trusts the X-Forwarded-For header or the actual downstream connection address for client-identity purposes.)',
        'Connection pool sizing: too small → frequent connection creation overhead. Too large → wasted memory. For HTTP/2 services, `http.http2MaxRequests: 1000` allows high concurrency over fewer TCP connections.',
        'mTLS handshake cost: TLS handshakes are CPU-intensive. Session resumption (TLS session tickets) amortises this cost. Istio Envoy does session resumption by default within a connection pool.',
        'Outlier detection scan interval: `interval: 10s` is the default. Setting it lower (1s) for faster health detection increases CPU usage on Istiod and sidecars. Balance detection speed vs overhead.',
      ],
    },
    {
      heading: 'Profiling and Benchmarking',
      points: [
        'Envoy admin API: `kubectl exec <pod> -c istio-proxy -- curl -s localhost:15000/stats` — comprehensive Envoy stats. Filter for `server.concurrency`, `worker_threads`, and `heap_allocated` for baseline health.',
        '`istioctl proxy-config cluster <pod> --fqdn <svc>` — shows the current cluster config for a specific upstream. Verify LB algorithm, circuit breaker settings, and endpoint count.',
        'Latency distribution: `kubectl exec <pod> -c istio-proxy -- curl -s localhost:15000/stats | grep histogram` — shows latency bucket distributions for upstream connections.',
        'Envoy memory: `kubectl exec <pod> -c istio-proxy -- curl -s localhost:15000/memory` — shows current heap usage vs limit. Alert if heap > 80% of memory limit.',
        'Load testing the mesh: use Fortio (Istio\'s own load generator): `istioctl dashboard fortio`. Measure latency at 100, 1000, 5000 RPS through the mesh and compare to baseline (no sidecar).',
        'Flame graphs: use `istioctl experimental authz check` and Envoy\'s `/cpuprofiler` endpoint (requires debug build) for deep CPU profiling of Envoy hot paths.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Sidecar Scope',
      language: 'bash',
      code: `# Scope sidecar visibility to only needed services
# Reduces xDS payload by 80-90% in large clusters
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: Sidecar
metadata:
  name: default
  namespace: production
spec:
  egress:
  - hosts:
    - "./*"              # All services in same namespace
    - "istio-system/*"  # Istiod + telemetry
    - "monitoring/*"    # Prometheus scraping
  ingress:
  - port:
      number: 8080
      protocol: HTTP
    defaultEndpoint: 0.0.0.0:8080
EOF

# Verify reduction in cluster count
echo "Before scope:"
kubectl exec deploy/api -c istio-proxy -- \\
  pilot-agent request GET clusters | wc -l

kubectl apply -f sidecar.yaml

echo "After scope:"
kubectl exec deploy/api -c istio-proxy -- \\
  pilot-agent request GET clusters | wc -l`,
    },
    {
      label: 'Resource Tuning',
      language: 'bash',
      code: `# Tune sidecar resources in IstioOperator
cat <<EOF | kubectl apply -f -
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  meshConfig:
    # Disable access logs (saves CPU + I/O at high RPS)
    accessLogFile: ""
    defaultConfig:
      # Limit Envoy to 2 worker threads (saves CPU on low-traffic pods)
      concurrency: 2
      # Hold app until proxy ready (prevents startup race)
      holdApplicationUntilProxyStarts: true
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
  components:
    pilot:
      k8s:
        env:
        # Throttle xDS pushes during config storm
        - name: PILOT_PUSH_THROTTLE
          value: "50"
        resources:
          requests:
            cpu: 500m
            memory: 2Gi
          limits:
            cpu: 1000m
            memory: 4Gi
EOF`,
    },
    {
      label: 'Discovery Selectors',
      language: 'bash',
      code: `# Limit Istiod to watch only mesh-participating namespaces
cat <<EOF | kubectl apply -f -
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  meshConfig:
    # Only watch namespaces with this label
    discoverySelectors:
    - matchLabels:
        istio-managed: "true"
EOF

# Label only the namespaces that need the mesh
kubectl label namespace production istio-managed=true
kubectl label namespace staging istio-managed=true

# Non-labelled namespaces (monitoring, infra, etc.)
# are NOT watched by Istiod → less xDS computation
# Verify: kubectl get configmap -n non-mesh-ns | grep istio → should be empty`,
    },
    {
      label: 'Benchmark with Fortio',
      language: 'bash',
      code: `# Install Fortio for load testing
kubectl apply -f https://raw.githubusercontent.com/istio/istio/master/samples/httpbin/httpbin.yaml -n production
istioctl dashboard fortio &

# Baseline: test WITHOUT sidecar (directly to pod IP)
fortio load -c 8 -qps 1000 -t 30s http://httpbin.production:8000/get

# With sidecar: test through the mesh
fortio load -c 8 -qps 1000 -t 30s \\
  -H "Host: httpbin.production" \\
  http://httpbin.production/get

# Parse latency results and compare:
# p50, p75, p90, p99, p999
# Overhead = mesh_latency - baseline_latency
# Acceptable: < 1ms p50 overhead, < 5ms p99 overhead

# Check Envoy stats after load test
kubectl exec deploy/httpbin -c istio-proxy -- \\
  pilot-agent request GET stats | grep "upstream_rq_total"`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not scoping the Sidecar CRD in large clusters',
      wrong: `# Default: every proxy knows about all 500 services
# Each proxy holds 500 × 4 xDS types = 2000 config entries
# Istiod must recompute and push to all 5000 proxies on any change`,
      right: `# Sidecar CRD: each proxy knows only the 10 services it calls
apiVersion: networking.istio.io/v1beta1
kind: Sidecar
metadata:
  name: default
  namespace: production
spec:
  egress:
  - hosts: ["./*", "istio-system/*"]`,
      explanation: 'In clusters with 100+ services, the default all-knowing proxy becomes the biggest performance problem. Each proxy holds the full service registry — eating 500MB+ RAM and causing massive xDS pushes on any config change. Sidecar CRD reduces proxy scope to only what each service actually calls.',
    },
    {
      title: 'Enabling access logs at 100% in high-traffic production',
      wrong: `meshConfig:
  accessLogFile: /dev/stdout   # Every request logs ~100 bytes
  # At 50,000 RPS: 5MB/s of log data per pod
  # Logs fill disk or I/O saturate → pod slowdown`,
      right: `# Option 1: disable access logs globally
meshConfig:
  accessLogFile: ""
# Option 2: sample via Telemetry API
spec:
  accessLogging:
  - providers:
    - name: envoy
    filter:
      expression: "response.code >= 400"  # Only log errors`,
      explanation: 'At 50,000 RPS, 100% access logging generates megabytes of log data per second per pod. This saturates I/O, fills log buffers, and adds CPU overhead. Disable access logs globally for high-traffic services or use the Telemetry API to sample at 1-10% or log only errors.',
    },
    {
      title: 'Setting Envoy concurrency too high on low-traffic pods',
      wrong: `# Envoy defaults to using ALL available CPUs (e.g., 8 threads)
# Low-traffic service: 10 RPS, 8 Envoy threads idle
# Each idle thread consumes memory and scheduling overhead`,
      right: `meshConfig:
  defaultConfig:
    concurrency: 2   # 2 Envoy workers sufficient for < 1000 RPS
# For very low traffic (health endpoints, batch): concurrency: 1`,
      explanation: 'Envoy\'s default is to create one worker thread per available CPU. On nodes with 8+ CPUs, idle sidecars create 8 threads each consuming memory. Setting `concurrency: 2` is sufficient for most services under 5000 RPS and significantly reduces per-pod overhead.',
    },
    {
      title: 'Ignoring protocol detection — defaulting to TCP for HTTP services',
      wrong: `# Kubernetes Service port named generically
ports:
- name: myport   # No protocol prefix → Istio can't auto-detect HTTP
  port: 8080
# Result: L7 routing, metrics, and tracing don't work`,
      right: `# Name ports with protocol prefix
ports:
- name: http-myport   # http- prefix → Istio treats as HTTP
  port: 8080
# Or: name: grpc-myport, name: tcp-myport`,
      explanation: 'Istio infers the protocol from the Kubernetes Service port name prefix (http-, grpc-, tcp-, https-, tls-). Without a recognised prefix, Istio defaults to TCP — disabling L7 features (VirtualService routing, mTLS for HTTP, access logging with method/path, distributed tracing). Always name Service ports with the correct prefix.',
    },
    {
      title: 'Scaling Istiod to only 1 replica for a large cluster',
      wrong: `# Default install: 1 Istiod replica
# At 5000 pods: Istiod manages 5000 xDS connections
# Istiod pod OOMs or becomes slow → all proxies get stale configs`,
      right: `# HPA for Istiod
components:
  pilot:
    k8s:
      hpaSpec:
        minReplicas: 2
        maxReplicas: 5
        metrics:
        - type: Resource
          resource:
            name: cpu
            target:
              type: Utilization
              averageUtilization: 60`,
      explanation: 'A single Istiod pod serving 5000+ xDS connections can become the bottleneck — slow pushes, high memory, and eventual OOM. Scale Istiod horizontally (it supports active-active multiple replicas). Monitor `pilot_xds_push_time_ms` — if p99 exceeds 1s, scale up.',
    },
  ];

  challenge: Challenge = {
    title: 'Design a Performance-Optimised Mesh Config',
    language: 'typescript',
    description: `Design an IstioOperator configuration for a 200-service cluster with these requirements:
- Sidecar CPU limit: 100m, memory limit: 128Mi
- Envoy concurrency: 2 threads per sidecar
- Disable access logs (high RPS cluster)
- Hold app until proxy starts
- PILOT_PUSH_THROTTLE: 30 (conservative throttling)
- Istiod: 2 replicas minimum

Return the IstioOperator YAML.`,
    hints: [
      'global.proxy.resources sets sidecar limits',
      'meshConfig.defaultConfig.concurrency controls Envoy workers',
      'meshConfig.accessLogFile: "" disables logs',
      'components.pilot.k8s for Istiod scaling',
    ],
    starterCode: `function getOptimisedConfig(): string {
  return '# IstioOperator YAML here';
}
console.log(getOptimisedConfig());`,
    solution: `function getOptimisedConfig(): string {
  return \`apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  meshConfig:
    accessLogFile: ""
    defaultConfig:
      concurrency: 2
      holdApplicationUntilProxyStarts: true
  values:
    global:
      proxy:
        resources:
          requests:
            cpu: 10m
            memory: 40Mi
          limits:
            cpu: 100m
            memory: 128Mi
  components:
    pilot:
      k8s:
        hpaSpec:
          minReplicas: 2
          maxReplicas: 5
        env:
        - name: PILOT_PUSH_THROTTLE
          value: "30"\`;
}
console.log(getOptimisedConfig());`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the biggest xDS scaling lever in large Istio deployments?',
      options: ['Increasing Istiod CPU limits', 'Sidecar CRD scoping — limiting which services each proxy needs to know about', 'Reducing the number of VirtualService resources', 'Enabling HTTP/2 for all services'],
      answer: 1,
      explanation: 'By default, every proxy holds the full service registry. In a 500-service cluster, each proxy maintains config for all 500 services. Sidecar CRD scoping reduces each proxy\'s view to only the 5-10 services it actually calls — reducing xDS payload by 80-90% and significantly reducing Istiod computation per push.',
    },
    {
      q: 'What does `meshConfig.defaultConfig.concurrency: 2` control?',
      options: ['Maximum concurrent requests the sidecar can handle', 'Number of Envoy worker threads per sidecar — limits to 2 regardless of available CPUs', 'Number of parallel xDS connections to Istiod', 'Maximum concurrent mTLS handshakes'],
      answer: 1,
      explanation: 'Envoy defaults to creating one worker thread per available CPU. On 8-CPU nodes, each sidecar creates 8 threads — wasteful for low-traffic services. `concurrency: 2` caps Envoy at 2 worker threads per sidecar, significantly reducing idle thread overhead for most services without impacting throughput below ~5000 RPS.',
    },
    {
      q: 'Why does Istio need Service port names prefixed with "http-", "grpc-", etc.?',
      options: ['Port names are required by the Kubernetes spec for Services', 'Istio infers the traffic protocol from the port name prefix — without it, Istio defaults to TCP, losing all L7 features', 'Port names are used for service discovery by Istiod', 'The prefix controls which load balancing algorithm Envoy uses'],
      answer: 1,
      explanation: 'Istio cannot always auto-detect protocols from traffic patterns. Port name prefixes (http-, grpc-, tcp-, tls-) explicitly tell Istio how to handle that port\'s traffic. Without a recognised prefix, Istio defaults to TCP — losing L7 routing (VirtualService), distributed tracing, per-request metrics, and HTTP-aware circuit breaking.',
    },
    {
      q: 'What does the discovery selector `meshConfig.discoverySelectors` control?',
      options: ['Which Prometheus metrics Istiod collects from Envoy', 'Which namespaces Istiod watches for Kubernetes resources — limits config processing to mesh-participating namespaces only', 'Which services are eligible for sidecar injection', 'Which xDS endpoint types Istiod sends to each proxy'],
      answer: 1,
      explanation: 'discoverySelectors limits which Kubernetes namespaces Istiod watches. In clusters with 50+ namespaces where only 10 participate in the mesh, adding discovery selectors prevents Istiod from watching 40 unnecessary namespaces — reducing CPU usage, Kubernetes API server load, and xDS computation.',
    },
    {
      q: 'What is the typical p50 latency overhead added per hop by a well-configured Istio sidecar?',
      options: ['0.001ms (negligible, purely software)', '0.2-0.5ms per hop under normal conditions', '5-10ms per hop — significant for latency-sensitive services', '50-100ms per hop — Istio is only suitable for high-latency tolerant services'],
      answer: 1,
      explanation: 'A well-configured Envoy sidecar adds approximately 0.2-0.5ms at p50 and 1-3ms at p99 per hop under normal conditions. This is additive — 5 service hops = 5× the overhead. For most microservices (latency budget of 100-500ms), this is acceptable. For ultra-low-latency use cases (< 5ms), consider Ambient Mesh.',
    },
    {
      q: 'How does PILOT_PUSH_THROTTLE help Istiod performance?',
      options: ['It limits the size of each xDS push payload', 'It throttles the number of concurrent xDS pushes to prevent Istiod from being overwhelmed during config storms', 'It delays xDS pushes during high-traffic periods to reduce proxy load', 'It prioritises certain xDS types (CDS before EDS) for consistency'],
      answer: 1,
      explanation: 'When many pods restart simultaneously or many Istio configs change at once, Istiod receives a flood of xDS push requests. Without throttling, Istiod may be overwhelmed — CPU spikes, high memory, and slow pushes causing stale proxy configs. PILOT_PUSH_THROTTLE limits concurrent xDS pushes to prevent this cascade.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What are the actual memory and CPU costs of the Istio sidecar in production?',
      a: 'Typical production overhead per pod: <ul><li><strong>Memory</strong>: 50-80MB base + roughly ~1MB PER SERVICE in scope (not per 1000). Without Sidecar CRD in a 500-service cluster: ~550MB per proxy. With Sidecar CRD scoped to 10 services: ~60MB.</li><li><strong>CPU</strong>: ~0.5-2% CPU per 1000 RPS at steady state. Spikes during xDS config pushes (adding a VirtualService triggers pushes to all proxies).</li></ul>Bottom line: in a well-scoped mesh (Sidecar CRD), the overhead is typically 50-100MB RAM and <5% CPU — acceptable for most services. The biggest surprise is memory in large clusters without Sidecar CRD scoping.',
    },
    {
      q: 'When should you consider Ambient Mesh instead of sidecar injection?',
      a: 'Consider Ambient Mesh when: <ul><li>You have high pod density (1000+ pods per node) and sidecar memory overhead is material</li><li>You need mesh features (mTLS, observability) but NOT L7 routing (no VirtualService) — Ambient\'s ztunnel handles L4 with near-zero overhead</li><li>You are running batch jobs or short-lived pods where sidecar injection adds significant startup latency</li><li>You want to reduce operational complexity (no injection webhook, no sidecar lifecycle management)</li></ul>Ambient Mesh\'s ztunnel handles mTLS and basic observability at L4 with ~5MB per node (vs 50-80MB per pod for sidecars). For L7 features, Ambient uses Waypoint proxies deployed per namespace — only for services that need L7.',
    },
    {
      q: 'How do you identify which services are causing the most xDS push overhead in Istiod?',
      a: 'Diagnostic steps: <ol><li><code>kubectl -n istio-system exec deploy/istiod -- curl -s localhost:15014/metrics | grep pilot_xds</code> — shows push counts, sizes, and errors</li><li><code>istioctl proxy-config cluster &lt;pod&gt; | wc -l</code> — counts cluster entries per proxy. High count → needs Sidecar scoping</li><li>Prometheus query: <code>pilot_xds_push_time_ms{quantile="0.99"}</code> — p99 push time. If &gt;500ms, Istiod is overloaded</li><li>Prometheus query: <code>rate(pilot_xds_pushes[5m])</code> grouped by type — identifies which xDS type (EDS/CDS/LDS/RDS) changes most frequently</li><li>Enable Istiod debug logging: <code>kubectl exec -n istio-system deploy/istiod -- curl -X POST localhost:15014/debug/endpointz</code></li></ol>',
    },
    {
      q: 'How does HTTP/2 multiplexing improve mesh performance?',
      a: 'HTTP/2 multiplexes multiple request/response streams over a single TCP connection. Benefits in a mesh: <ul><li><strong>Fewer TCP connections</strong>: with HTTP/2, one connection to a backend serves many concurrent requests — reducing TCP handshake overhead and connection pool memory</li><li><strong>No head-of-line blocking</strong>: streams are independent within one connection — one slow request doesn\'t block others (unlike HTTP/1.1 pipelining)</li><li><strong>Header compression (HPACK)</strong>: repeated headers (common in mesh traffic with X-B3 trace headers) are compressed — reducing bandwidth</li></ul>Istio enables H2C (HTTP/2 cleartext) between sidecars automatically for HTTP services. This is one reason Istio mesh latency overhead is often lower than expected — efficient connection reuse amortises TLS and TCP overhead.',
    },
    {
      q: 'What is the impact of frequent Istio CRD changes (VirtualService updates) on mesh performance?',
      a: 'Every change to an Istio CRD (VirtualService, DestinationRule, PeerAuthentication, etc.) triggers an xDS push to all proxies that need updated config. In a 5000-pod cluster: <ul><li>One VirtualService change → Istiod computes LDS/RDS diff → pushes to all 5000 proxies → 5000 concurrent xDS responses</li><li>Each push takes CPU (compute diff) and memory (serialize protobuf)</li><li>If pushes are frequent (rapid CI/CD, pod storm), Istiod CPU spikes and push latency increases</li></ul>Mitigations: <ul><li>Batch config changes (apply many at once rather than one-by-one)</li><li>Use Sidecar CRD to reduce which proxies receive which pushes</li><li>Set PILOT_PUSH_THROTTLE to limit concurrent pushes</li><li>Use discoverySelectors to limit Istiod\'s watch scope</li></ul>',
    },
  { q: 'How do you reduce Istio sidecar resource consumption in large clusters?', a: 'Several strategies reduce sidecar resource usage: (1) Use Sidecar resources to limit the scope of Envoy configuration to only services each workload actually communicates with, reducing the xDS config pushed to each proxy from potentially thousands of services to a small relevant subset. (2) Tune concurrency in the proxy: set the proxy.concurrency annotation to 2 on pods with low traffic instead of matching the number of CPU cores. (3) Disable unused telemetry features: if you do not use distributed tracing, set the tracing sampling rate to 0. (4) Use ambient mesh for non-critical workloads to eliminate sidecar overhead entirely.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Istio sidecar adds 50-80MB RAM and 0.2-0.5ms p50 latency per hop. The biggest scaling lever is Sidecar CRD scope — limiting proxy knowledge to services it actually calls. Tune concurrency, disable access logs at high RPS, and scale Istiod horizontally.',
    mustKnow: [
      'Sidecar CRD: egress.hosts limits the service registry per proxy — reduces xDS payload 80-90% in large clusters',
      'concurrency: 2 — limit Envoy worker threads on low-traffic pods to reduce idle overhead',
      'accessLogFile: "" — disable access logs at high RPS (saves CPU + I/O)',
      'discoverySelectors: limit Istiod to mesh-participating namespaces only',
      'PILOT_PUSH_THROTTLE: prevents xDS push storms during mass config changes',
      'Port name prefixes (http-, grpc-): enable L7 features — without them Istio defaults to TCP',
      'Typical overhead: 50-80MB RAM, 0.2-0.5ms p50 latency per hop (well-configured)',
    ],
    interviewFocus: [
      'What is the Sidecar CRD and why is it the biggest scaling lever in large meshes?',
      'Sidecar memory overhead: base vs with Sidecar scoping in large clusters',
      'Why port name prefixes matter for L7 features',
      'How PILOT_PUSH_THROTTLE prevents Istiod overload during config storms',
      'When to consider Ambient Mesh instead of sidecar injection',
    ],
  };
}
