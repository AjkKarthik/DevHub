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
  selector: 'app-mesh-multi-cluster',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './multi-cluster.html',
  styleUrl: './multi-cluster.scss',
})
export class MeshMultiCluster {
  quickRef: QuickRefItem[] = [
    { name: 'Primary-Remote', type: 'keyword', desc: 'Multi-cluster model: primary cluster runs Istiod, remote cluster shares that control plane. Simpler but single control plane SPOF.' },
    { name: 'Multi-Primary', type: 'keyword', desc: 'Both clusters run their own Istiod but share a root CA. Resilient to control plane failure in either cluster.' },
    { name: 'Trust Domain', type: 'keyword', desc: 'Shared root CA across clusters enables cross-cluster mTLS. Without shared trust, clusters can\'t verify each other\'s SVIDs.' },
    { name: 'East-West Gateway', type: 'keyword', desc: 'LoadBalancer Service exposing mesh traffic (port 15443) between clusters. Cross-cluster calls exit/enter via east-west gateways.' },
    { name: 'ServiceEntry', type: 'keyword', desc: 'Used in multi-cluster to register remote services — makes them available in the local service registry for routing and LB.' },
    { name: 'clusterId', type: 'keyword', desc: 'Unique cluster identifier in IstioOperator. Istiod uses this to differentiate endpoints across clusters in EDS.' },
    { name: 'meshNetworks', type: 'keyword', desc: 'IstioOperator config declaring network topology — which clusters are in which network and gateway endpoints for cross-network routing.' },
    { name: 'WorkloadEntry', type: 'keyword', desc: 'Represents non-Kubernetes workloads (VMs, bare metal) as mesh endpoints — used in VM-to-mesh and multi-cluster scenarios.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Multi-Cluster Mesh',
      points: [
        'Multi-cluster mesh extends service mesh connectivity across two or more Kubernetes clusters. Common drivers: multi-region deployment for disaster recovery and latency, regulatory data residency (data must stay in EU cluster), cluster isolation for blast radius reduction, gradual cluster migration, or federation of independently-managed clusters.',
        'Istio multi-cluster provides: unified service discovery (services in cluster-B are routable from cluster-A), cross-cluster mTLS with the same identity model as within a cluster, cross-cluster traffic management (VirtualService routing between clusters), and unified observability.',
        'The core challenge: Kubernetes is single-cluster. To extend mesh across clusters, Istio needs to: (1) share a common root CA for cross-cluster identity trust, (2) expose endpoints from one cluster to another, (3) route traffic securely between clusters over a public or private network.',
        'Istio supports two primary multi-cluster models: Primary-Remote (one cluster runs Istiod, others are remotes) and Multi-Primary (each cluster runs its own Istiod sharing a root CA). Most production deployments use Multi-Primary for resilience.',
        'Network topology adds another dimension: single-network (clusters share a VPC and pods have direct IP reachability) vs multi-network (pods in different clusters can\'t reach each other directly — require east-west gateways). Most cloud multi-region deployments are multi-network.',
        'Alternative: federated mesh (distinct meshes that share certificates but not control planes, connected via egress/ingress gateways). Less integrated but simpler to operate independently. Suitable for joining meshes from different organisations.',
      ],
    },
    {
      heading: 'Multi-Primary on Different Networks',
      points: [
        'Each cluster runs its own Istiod with a distinct cluster ID. Both Istiod instances share a common root CA (intermediate certs or plug-in CA). This allows SPIFFE SVIDs from either cluster to be verified by the other.',
        'East-west gateways: each cluster deploys an `istio-eastwestgateway` Service (LoadBalancer, port 15443) exposed to the other cluster\'s CIDR. Cross-cluster traffic exits through the source cluster\'s east-west gateway and enters through the destination cluster\'s east-west gateway.',
        'Service discovery: each Istiod is configured with API server credentials for the other cluster (via kubeconfig secret). Istiod then watches the remote cluster\'s pods and services and creates synthetic EDS entries pointing to the remote east-west gateway IP.',
        'Cross-cluster call flow: Pod-A (cluster-1) → Envoy (cluster-1) → east-west gateway (cluster-1) → east-west gateway (cluster-2) → Envoy (cluster-2) → Pod-B. Each hop is mTLS-authenticated.',
        'PILOT_PEERS: in multi-primary, each Istiod needs to know the other cluster\'s Istiod endpoint to exchange the remote cluster\'s config (services, endpoints). This is configured via the `remotePilotAddress` or via secret-based peer discovery.',
        'Health and failover: if cluster-2 becomes unreachable, cluster-1\'s Istiod keeps the last-known state but stops receiving endpoint updates. With proper outlier detection, traffic fails over to healthy cluster-1 endpoints automatically.',
      ],
    },
    {
      heading: 'Shared Root CA — The Identity Foundation',
      points: [
        'Cross-cluster mTLS requires both clusters to trust the same root CA. Without this, an Envoy in cluster-1 cannot verify an SVID issued by cluster-2\'s Istiod (different root → untrusted cert → TLS handshake failure).',
        'Option 1: Istio self-signed root (simple, dev/staging). Generate once, distribute to both clusters as the `cacerts` secret in `istio-system`. Both Istiod instances use this as their signing root.',
        'Option 2: Intermediate CA per cluster, shared root (production best practice). Each cluster gets its own intermediate CA (so compromise of one cluster\'s CA doesn\'t affect the other\'s private key). Both intermediates chain to the same corporate root CA.',
        'Option 3: cert-manager with an external CA (Vault, AWS Private CA). cert-manager issues intermediate CAs for each cluster\'s Istiod. Centrally managed, automated rotation. Best for regulated environments.',
        'CA rotation: if you need to rotate the root CA, Istio supports a dual-root trust period — both the old and new root are trusted simultaneously, allowing a rolling update across the mesh before removing the old root.',
        'Verify cross-cluster mTLS: `istioctl authn tls-check <pod-in-cluster-1> <service-in-cluster-2>` should show `OK mTLS`. If it shows `CONFLICT` or `HTTP`, the trust domain or CA configuration is wrong.',
      ],
    },
    {
      heading: 'Traffic Management Across Clusters',
      points: [
        'VirtualService routing in multi-cluster: the same VirtualService syntax works, but `destination.host` must match the service FQDN. In multi-primary, each Istiod has the full service registry from all clusters — routing is transparent.',
        'Locality-aware load balancing across clusters: configure `meshConfig.localityLbSetting` with `distribute` or `failover` rules. Traffic prefers same-region endpoints; fails over to another cluster only when local endpoints are unhealthy.',
        'Canary across clusters: deploy v2 only in cluster-2, then use a VirtualService with weighted routing (e.g., 90% cluster-1/v1, 10% cluster-2/v2). This requires the remote service to appear in the local registry (works automatically with multi-primary secret-based discovery).',
        'ServiceEntry for manual cross-cluster routing: if automatic discovery is not configured, use a ServiceEntry to register the remote service explicitly, pointing to the east-west gateway IP. More manual but gives full control over endpoint addresses.',
        'Ingress in multi-cluster: each cluster typically has its own ingress gateway. DNS-based GSLB (Route 53 latency routing, GCP Global LB) distributes external traffic across clusters. The mesh handles internal cross-cluster routing.',
        'DestinationRule for cross-cluster TLS: when routing cross-cluster via east-west gateway, the TLS mode between the local Envoy and the east-west gateway must be `ISTIO_MUTUAL` (AUTO_PASSTHROUGH mode on the gateway). The gateway then forwards to the destination cluster\'s proxy with the original mTLS intact.',
      ],
    },
    {
      heading: 'Observability in Multi-Cluster',
      points: [
        'Metrics: each cluster\'s Prometheus scrapes local Envoy sidecars. For a unified view, use Prometheus federation (each cluster\'s Prometheus is scraped by a central Prometheus) or Thanos/Cortex (metrics remote-write to a shared backend).',
        'Tracing: distributed traces span across clusters if propagation headers (B3/W3C) are forwarded. The trace ID is the same regardless of which cluster the span was generated in. A single Jaeger or Grafana Tempo instance can correlate multi-cluster traces if all clusters ship spans to it.',
        'Kiali multi-cluster: Kiali 1.73+ supports multi-cluster service graphs when configured with multiple cluster API server connections. The service graph shows inter-cluster edges with latency and error rate.',
        'Logs: each cluster\'s access logs are independent. Use a centralised log aggregator (Elastic, Loki) to correlate logs across clusters. Include the cluster name in log metadata (Envoy can add a header via a Lua filter).',
        'Control plane health: monitor Istiod in each cluster independently. Alert on `pilot_xds_push_errors`, certificate expiry (`citadel_server_cert_chain_expiry_timestamp`), and API server connectivity (`pilot_k8s_cfg_events`).',
        '`istioctl remote-secret`: generates a kubeconfig secret that allows one Istiod to watch another cluster\'s API server. This is the key wiring step for multi-primary service discovery. If this secret is wrong or expired, cross-cluster endpoint discovery breaks silently.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Multi-Primary Setup',
      language: 'bash',
      code: `# === CLUSTER 1 (us-east) ===
# Set kubeconfig contexts
export CTX_CLUSTER1=us-east
export CTX_CLUSTER2=eu-west

# Create shared root CA (one-time)
mkdir -p certs && cd certs
make -f ../tools/certs/Makefile.selfsigned.mk root-ca
make -f ../tools/certs/Makefile.selfsigned.mk cluster1-cacerts
make -f ../tools/certs/Makefile.selfsigned.mk cluster2-cacerts

# Install CA certs in cluster 1
kubectl --context=\${CTX_CLUSTER1} create namespace istio-system
kubectl --context=\${CTX_CLUSTER1} create secret generic cacerts \\
  -n istio-system \\
  --from-file=cluster1/ca-cert.pem \\
  --from-file=cluster1/ca-key.pem \\
  --from-file=root-cert.pem \\
  --from-file=cluster1/cert-chain.pem

# Install Istio on cluster 1
cat <<EOF | istioctl install --context=\${CTX_CLUSTER1} -f -
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  values:
    global:
      meshID: shared-mesh
      multiCluster:
        clusterName: cluster1
      network: network1
EOF

# Expose cluster 1 east-west gateway
kubectl --context=\${CTX_CLUSTER1} apply -f \\
  samples/multicluster/expose-services.yaml`,
    },
    {
      label: 'Cross-Cluster Discovery',
      language: 'bash',
      code: `# Enable cross-cluster endpoint discovery
# Cluster 1 needs to watch Cluster 2's API server and vice versa

# Generate remote secrets (kubeconfig for cross-cluster watching)
istioctl create-remote-secret \\
  --context=\${CTX_CLUSTER1} \\
  --name=cluster1 | \\
  kubectl apply --context=\${CTX_CLUSTER2} -f -

istioctl create-remote-secret \\
  --context=\${CTX_CLUSTER2} \\
  --name=cluster2 | \\
  kubectl apply --context=\${CTX_CLUSTER1} -f -

# Verify cross-cluster service discovery
# Run a service only in cluster 2 and call it from cluster 1
kubectl --context=\${CTX_CLUSTER2} apply -f samples/helloworld/helloworld.yaml \\
  -l version=v2

# From cluster 1 pod, call the service
kubectl --context=\${CTX_CLUSTER1} exec -it deploy/sleep \\
  -- curl http://helloworld.sample:5000/hello
# Should return v2 response (from cluster 2)

# Verify endpoint discovery
istioctl --context=\${CTX_CLUSTER1} proxy-config endpoint \\
  deploy/sleep.sample \\
  --cluster "outbound|5000||helloworld.sample.svc.cluster.local"
# Should show endpoints from BOTH clusters`,
    },
    {
      label: 'East-West Gateway',
      language: 'bash',
      code: `# Deploy east-west gateway in each cluster
# This exposes mesh traffic for cross-cluster routing
cat <<EOF | kubectl --context=\${CTX_CLUSTER1} apply -f -
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  name: eastwest
spec:
  revision: ""
  profile: empty
  components:
    ingressGateways:
    - name: istio-eastwestgateway
      label:
        istio: eastwestgateway
        app: istio-eastwestgateway
        topology.istio.io/network: network1
      enabled: true
      k8s:
        env:
        - name: ISTIO_META_REQUESTED_NETWORK_VIEW
          value: network1
        service:
          ports:
          - name: status-port
            port: 15021
            targetPort: 15021
          - name: tls
            port: 15443
            targetPort: 15443
          - name: tls-istiod
            port: 15012
            targetPort: 15012
          - name: tls-webhook
            port: 15017
            targetPort: 15017
EOF

# Expose all services via the east-west gateway (AUTO_PASSTHROUGH)
cat <<EOF | kubectl --context=\${CTX_CLUSTER1} apply -n istio-system -f -
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: cross-network-gateway
spec:
  selector:
    istio: eastwestgateway
  servers:
  - port:
      number: 15443
      name: tls
      protocol: TLS
    tls:
      mode: AUTO_PASSTHROUGH  # Forward mTLS as-is to destination
    hosts:
    - "*.local"
EOF`,
    },
    {
      label: 'Locality Failover',
      language: 'bash',
      code: `# Configure locality-aware failover across clusters
# Prefer local cluster, fail over to remote on unhealthy
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: payment-cross-cluster
  namespace: production
spec:
  host: payment.production.svc.cluster.local
  trafficPolicy:
    connectionPool:
      http:
        http2MaxRequests: 1000
    outlierDetection:
      consecutiveGatewayErrors: 3
      interval: 10s
      baseEjectionTime: 30s
    loadBalancer:
      localityLbSetting:
        enabled: true
        failover:
        - from: us-east1     # If us-east1 endpoints are all unhealthy
          to: eu-west1       # fail over to eu-west1 (cluster 2)
EOF

# Verify locality labels on endpoints
kubectl get pods -n production -o json \\
  | python3 -c "import sys,json; \\
    [print(p['metadata']['name'], p['spec']['nodeName']) \\
     for p in json.load(sys.stdin)['items']]"`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using different root CAs in each cluster',
      wrong: `# Cluster 1: Istio self-signed CA (default install)
# Cluster 2: Separate Istio self-signed CA
# Both clusters sign SVIDs from different roots
# Cross-cluster mTLS TLS handshake fails:
# "certificate verify failed: unable to get local issuer certificate"`,
      right: `# Generate ONE shared root CA, distribute to both clusters
kubectl create secret generic cacerts -n istio-system \\
  --from-file=ca-cert.pem \\
  --from-file=ca-key.pem \\
  --from-file=root-cert.pem \\
  --from-file=cert-chain.pem
# Apply same command in BOTH clusters (different intermediate certs,
# same root-cert.pem)`,
      explanation: 'Cross-cluster mTLS requires both Istiod instances to share the same root CA so that SVIDs from one cluster are trusted by the other. Using separate default self-signed CAs (Istio\'s default) means neither cluster trusts the other\'s certificates — all cross-cluster connections fail with TLS errors.',
    },
    {
      title: 'Forgetting to expose the east-west gateway services',
      wrong: `# East-west gateway deployed with LoadBalancer
# But no Gateway CRD to expose services
# Cross-cluster traffic hits the gateway and gets rejected
# "no matching service" or TCP RST from the gateway`,
      right: `# Deploy the expose-services Gateway (AUTO_PASSTHROUGH mode)
kubectl apply -n istio-system -f - <<EOF
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: cross-network-gateway
spec:
  selector:
    istio: eastwestgateway
  servers:
  - port:
      number: 15443
      name: tls
      protocol: TLS
    tls:
      mode: AUTO_PASSTHROUGH
    hosts:
    - "*.local"
EOF`,
      explanation: 'The east-west gateway needs a Gateway CRD configured with `tls.mode: AUTO_PASSTHROUGH` to forward mTLS traffic transparently to destination pods. Without this, the gateway accepts TCP connections but has no routing rule — traffic is dropped or reset. This is one of the most common multi-cluster setup mistakes.',
    },
    {
      title: 'Not configuring meshNetworks for multi-network clusters',
      wrong: `# Two clusters in different VPCs (pod IPs not reachable across clusters)
# Install multi-primary without meshNetworks config
# Istiod registers remote pod IPs as endpoints
# Local Envoy tries to connect directly to remote pod IPs → fails (not routable)`,
      right: `# In IstioOperator for cluster 1: declare network topology
values:
  global:
    meshID: shared-mesh
    multiCluster:
      clusterName: cluster1
    network: network1   # Network name for this cluster`,
      explanation: 'When clusters are on different networks (pods not directly reachable), Istio must route cross-cluster traffic via east-west gateways. The `network` field tells Istiod which network each cluster is on — when a source is on `network1` and the destination is on `network2`, Istiod substitutes the east-west gateway IP for the destination pod IP in EDS. Without this, proxies try to connect directly to unreachable pod IPs.',
    },
    {
      title: 'Expired remote secrets breaking cross-cluster discovery',
      wrong: `# Remote secret created once, never rotated
# kubeconfig token inside the secret expires (ServiceAccount token TTL)
# Istiod loses ability to watch remote cluster API server
# Remote endpoints disappear from local registry silently
# Cross-cluster traffic returns 503 (no endpoints)`,
      right: `# Monitor remote secret health
kubectl get secret -n istio-system -l istio/multiCluster=true
# Check if Istiod can watch remote cluster
kubectl logs -n istio-system deploy/istiod | grep "remote cluster"
# Regenerate remote secrets periodically
istioctl create-remote-secret --context=remote-ctx --name=remote | \\
  kubectl apply -f -`,
      explanation: 'Remote secrets contain kubeconfig tokens with a TTL. When they expire, Istiod silently loses cross-cluster endpoint discovery — remote services appear to have no endpoints, causing 503s on cross-cluster calls. Monitor for this with Istiod log alerts on "failed to watch remote cluster" and implement secret rotation.',
    },
    {
      title: 'Using the same cluster name for multiple clusters',
      wrong: `# Both clusters configured with clusterName: cluster1
# Istiod can't differentiate endpoints from cluster 1 vs cluster 2
# EDS returns duplicate endpoints with the same cluster ID
# Routing and locality LB don't work correctly`,
      right: `# Cluster 1 IstioOperator
multiCluster:
  clusterName: cluster1

# Cluster 2 IstioOperator
multiCluster:
  clusterName: cluster2   # Must be UNIQUE across all clusters`,
      explanation: 'Each cluster in a multi-cluster mesh must have a unique `clusterName`. Istiod uses the cluster ID to tag endpoints in EDS so that proxies and the control plane can distinguish same-named services from different clusters. Duplicate cluster names cause incorrect routing, broken locality LB, and confusing metrics.',
    },
  ];

  challenge: Challenge = {
    title: 'Multi-Cluster Locality Failover Config',
    language: 'typescript',
    description: `Write a function that generates a DestinationRule YAML for a service with locality-aware load balancing and failover between two regions. Parameters: serviceName, namespace, primaryRegion, failoverRegion, maxConnections.`,
    hints: [
      'localityLbSetting.failover maps from → to regions',
      'outlierDetection is required for failover to trigger',
      'connectionPool.http.http2MaxRequests sets max connections',
    ],
    starterCode: `function generateMultiClusterDR(
  serviceName: string,
  namespace: string,
  primaryRegion: string,
  failoverRegion: string,
  maxConnections: number
): string {
  return '';
}

console.log(generateMultiClusterDR('payment', 'production', 'us-east1', 'eu-west1', 500));`,
    solution: `function generateMultiClusterDR(
  serviceName: string,
  namespace: string,
  primaryRegion: string,
  failoverRegion: string,
  maxConnections: number
): string {
  return \`apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: \${serviceName}-multicluster
  namespace: \${namespace}
spec:
  host: \${serviceName}.\${namespace}.svc.cluster.local
  trafficPolicy:
    connectionPool:
      http:
        http2MaxRequests: \${maxConnections}
    outlierDetection:
      consecutiveGatewayErrors: 3
      interval: 10s
      baseEjectionTime: 30s
    loadBalancer:
      localityLbSetting:
        enabled: true
        failover:
        - from: \${primaryRegion}
          to: \${failoverRegion}\`;
}

console.log(generateMultiClusterDR('payment', 'production', 'us-east1', 'eu-west1', 500));`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary purpose of the east-west gateway in multi-cluster Istio?',
      options: ['Load balancing external traffic across clusters', 'Exposing mesh services between clusters over a shared network — pods in different clusters use east-west gateways as routing intermediaries', 'Providing a single ingress point for all multi-cluster traffic', 'Synchronising Istio configuration between clusters'],
      answer: 1,
      explanation: 'East-west gateways (port 15443) expose all mesh services from one cluster to another. When clusters are on different networks (pods not directly reachable), cross-cluster traffic exits through the source cluster\'s east-west gateway and enters through the destination\'s. Configured with `tls.mode: AUTO_PASSTHROUGH` to forward mTLS transparently.',
    },
    {
      q: 'Why must all clusters in a multi-primary mesh share the same root CA?',
      options: ['To synchronise Istio CRDs across clusters', 'Cross-cluster mTLS requires both clusters to trust each other\'s SVIDs — different roots mean TLS handshake failures on cross-cluster connections', 'The root CA is used for Kubernetes ServiceAccount token signing across clusters', 'Shared root CA reduces certificate rotation complexity'],
      answer: 1,
      explanation: 'When an Envoy in cluster-1 receives an mTLS connection from cluster-2, it verifies the peer\'s SVID against the trusted root CA. If cluster-2\'s Istiod signed that SVID with a different root, the verification fails — TLS handshake error, connection refused. Sharing the root CA (while each cluster may have its own intermediate) allows cross-cluster verification.',
    },
    {
      q: 'What is the difference between Primary-Remote and Multi-Primary multi-cluster models?',
      options: ['Primary-Remote: active-active; Multi-Primary: active-passive', 'Primary-Remote: one Istiod serves all clusters (SPOF); Multi-Primary: each cluster runs its own Istiod sharing a root CA (resilient)', 'Primary-Remote: for same-region clusters; Multi-Primary: for multi-region only', 'Multi-Primary requires more clusters — minimum 3'],
      answer: 1,
      explanation: 'In Primary-Remote, only one cluster runs Istiod — all remote clusters are configured by this single control plane. If the primary cluster fails, the entire mesh loses config updates. In Multi-Primary, each cluster runs its own Istiod sharing a root CA. Each cluster\'s control plane is independent — a primary failure in one cluster doesn\'t affect others.',
    },
    {
      q: 'What does `istioctl create-remote-secret` do and why is it needed?',
      options: ['Creates mTLS certificates for cross-cluster connections', 'Generates a kubeconfig secret that allows one Istiod to watch another cluster\'s API server for service and endpoint discovery', 'Creates Kubernetes Secrets for cross-cluster database connections', 'Generates a shared root CA secret for distribution across clusters'],
      answer: 1,
      explanation: '`istioctl create-remote-secret` generates a Kubernetes Secret containing a kubeconfig with credentials to access the target cluster\'s API server. When applied to the other cluster\'s Istiod, it allows that Istiod to watch the remote cluster\'s Services, Pods, and Endpoints — enabling cross-cluster service discovery and EDS updates.',
    },
    {
      q: 'How does locality-aware load balancing help in multi-cluster deployments?',
      options: ['It prevents cross-cluster traffic entirely — requests only go to local cluster endpoints', 'It prefers same-region/same-cluster endpoints for latency, and automatically fails over to remote cluster endpoints when local endpoints are unhealthy', 'It distributes traffic evenly across all clusters regardless of location', 'It routes traffic based on the client\'s IP geolocation'],
      answer: 1,
      explanation: 'Locality LB prioritises endpoints in the same region/zone as the client pod. This reduces cross-region latency and cost for normal traffic. When local endpoints become unhealthy (detected by outlierDetection), traffic automatically fails over to the configured remote region. Requires `outlierDetection` to be configured — without it, failover never triggers even when all local endpoints are down.',
    },
    {
      q: 'What happens to cross-cluster traffic if the east-west gateway in the destination cluster is unreachable?',
      options: ['Traffic automatically routes directly to destination pods (bypassing the gateway)', 'Cross-cluster calls return 503 — Envoy has no alternative route to remote endpoints when the east-west gateway is down', 'Traffic falls back to in-cluster endpoints if any exist', 'Istiod automatically reroutes traffic via another gateway'],
      answer: 1,
      explanation: 'Remote endpoints are represented in Envoy\'s EDS as the east-west gateway IP (not direct pod IPs, since pods are on a different network). If the east-west gateway is unreachable, Envoy marks all remote endpoints as unhealthy and returns 503 for any request that has no local healthy alternative. Outlier detection triggers the removal; locality failover to local endpoints occurs if configured.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does Istiod in cluster-1 learn about services and pods in cluster-2?',
      a: 'Via the remote secret mechanism: <ol><li><code>istioctl create-remote-secret --context=cluster2-ctx --name=cluster2</code> generates a Kubernetes Secret containing a kubeconfig for cluster-2\'s API server</li><li>Apply this secret to cluster-1\'s istio-system namespace</li><li>Cluster-1\'s Istiod reads the secret, establishes a watch on cluster-2\'s API server using those credentials</li><li>Cluster-2 Services and Pod IPs appear in cluster-1\'s Istiod as remote endpoints, tagged with cluster-2\'s cluster ID and network</li><li>For multi-network (different VPCs), Istiod substitutes remote pod IPs with the cluster-2 east-west gateway IP in EDS updates</li></ol>This watch is continuous — Istiod receives events as cluster-2 pods scale up/down and updates local EDS accordingly.',
    },
    {
      q: 'How should you handle certificate rotation in a multi-cluster shared-CA mesh?',
      a: 'Certificate rotation in multi-cluster requires coordination: <ul><li><strong>Sidecar certs</strong>: automatically rotated by Istiod before expiry (default 24h certs, rotated at 80% lifetime). No action needed.</li><li><strong>Intermediate CA rotation</strong>: each cluster\'s Istiod has its own intermediate cert. Rotate per-cluster by updating the <code>cacerts</code> secret. Istiod picks up the new cert within minutes. Cross-cluster trust is maintained because both still chain to the same root.</li><li><strong>Root CA rotation</strong>: most complex — requires a dual-root trust period. Steps: (1) add new root to both cluster trust bundles, (2) issue new intermediate CAs signed by new root, (3) roll over all sidecar certs, (4) remove old root from trust bundles. Istio has tooling for this but it\'s a multi-hour operation in large meshes.</li><li>Use cert-manager with an external root (Vault/AWS Private CA) for automated intermediate rotation — removes the operational burden.</li></ul>',
    },
    {
      q: 'Can you do a zero-downtime migration from single-cluster to multi-cluster Istio?',
      a: 'Yes, with careful planning: <ol><li><strong>Prepare the second cluster</strong>: install Istio with the same root CA and a different cluster ID. Don\'t enroll services yet.</li><li><strong>Exchange remote secrets</strong>: each Istiod watches the other cluster. At this point, no traffic crosses clusters but both control planes have the full service registry.</li><li><strong>Set up east-west gateways</strong> in both clusters and configure the cross-network Gateway CRD.</li><li><strong>Deploy services to cluster-2</strong>: initially at 0% traffic. Verify they appear in cluster-1\'s endpoint list.</li><li><strong>Gradually shift traffic</strong>: locality LB + DestinationRule weighted routing to send 10%, 25%, 50% to cluster-2 services. Monitor error rate and latency.</li><li><strong>DNS cutover</strong>: update external DNS to route to both clusters\' ingress gateways.</li></ol>The mesh handles cross-cluster routing transparently during the entire process — no application changes needed.',
    },
    {
      q: 'What monitoring should you set up specifically for multi-cluster Istio?',
      a: 'Multi-cluster-specific monitoring: <ul><li><strong>Cross-cluster error rate</strong>: Prometheus query filtered on source cluster ≠ destination cluster: <code>rate(istio_requests_total{source_cluster!="cluster1", destination_cluster="cluster1", response_code=~"5.."}[5m])</code></li><li><strong>East-west gateway health</strong>: monitor the east-west gateway pod and its LoadBalancer IP reachability from both clusters</li><li><strong>Remote secret expiry</strong>: alert on kubeconfig token TTL — set before expiry to trigger rotation</li><li><strong>Istiod remote cluster watch errors</strong>: <code>kubectl logs -n istio-system deploy/istiod | grep "failed to watch remote"</code> — this indicates broken cross-cluster discovery</li><li><strong>Cross-cluster latency</strong>: separate SLO for cross-cluster calls vs intra-cluster. Expect 5-20ms additional latency for inter-region.</li><li><strong>Certificate expiry</strong>: monitor <code>citadel_server_cert_chain_expiry_timestamp</code> in both clusters</li></ul>',
    },
  { q: 'A team running primary-remote mode wants to reduce their single-point-of-failure risk without doing a full migration to multi-primary (which requires each cluster to run its own full Istiod). Is there a middle-ground mitigation?', a: 'Running multiple Istiod replicas within the SAME primary cluster (across multiple nodes/AZs) mitigates pod-level or node-level failures of the control plane without eliminating the more fundamental risk: if the entire PRIMARY CLUSTER becomes unreachable (a regional outage, a cluster-wide networking failure), remote clusters still lose their connection to the only control plane serving them, since replica count within a cluster does not protect against losing the cluster itself. The only mitigation that addresses cluster-level failure is genuinely running an independent control plane per cluster (multi-primary) — replicating Istiod within the primary cluster is a legitimate incremental improvement for the more common node/pod-level failure modes, but it does not close the cluster-level SPOF gap that is the core structural difference between the two models.' },
  { q: 'How do you configure cross-cluster service discovery in Istio?', a: 'For multi-primary mode: each cluster must have access to the other cluster API server to read service and endpoint information. Create a kubeconfig secret in each cluster pointing to the other cluster API server. Istio uses this to discover endpoints from remote clusters and include them in the load balancing pool. For primary-remote mode: remote clusters register with the primary control plane using an east-west gateway. Services in remote clusters are exposed through this gateway and the primary control plane programs sidecars across all clusters. Label services with the topology.istio.io/cluster annotation for proper locality-aware routing.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Multi-cluster Istio extends mesh across clusters via shared root CA for identity trust, east-west gateways for cross-network routing, and remote secrets for cross-cluster service discovery. Multi-Primary (each cluster runs Istiod) is preferred over Primary-Remote for resilience.',
    mustKnow: [
      'Shared root CA: required for cross-cluster mTLS — SVIDs from different clusters must chain to the same root',
      'East-west gateway: LoadBalancer on port 15443, AUTO_PASSTHROUGH mode, forwards mTLS to destination cluster',
      'istioctl create-remote-secret: generates kubeconfig for cross-cluster API server watching',
      'Multi-Primary vs Primary-Remote: Multi-Primary has independent control planes, resilient to per-cluster failure',
      'meshNetworks + network label: tells Istiod to route cross-cluster traffic via east-west gateways (not direct pod IPs)',
      'Locality LB + failover: prefers same-region endpoints, auto-fails over to remote cluster when local is unhealthy',
      'Remote secrets expire: monitor and rotate kubeconfig tokens to prevent silent endpoint discovery failures',
    ],
    interviewFocus: [
      'Why do all clusters in a multi-cluster mesh need to share the same root CA?',
      'What is the east-west gateway and what mode does it use?',
      'Primary-Remote vs Multi-Primary trade-offs',
      'How does Istiod in cluster-1 know about services in cluster-2?',
      'How does locality-aware load balancing work across clusters?',
    ],
  };
}
