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
  selector: 'app-mesh-ingress-gateway',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './ingress-gateway.html',
  styleUrl: './ingress-gateway.scss',
})
export class MeshIngressGateway {
  quickRef: QuickRefItem[] = [
    { name: 'istio-ingressgateway', type: 'keyword', desc: 'Default Envoy-based ingress pod in the istio-system namespace — handles north-south traffic into the cluster.' },
    { name: 'Gateway CRD', type: 'syntax', desc: 'Configures the istio-ingressgateway listener: port, protocol, TLS mode, and allowed hosts.' },
    { name: 'VirtualService (Gateway)', type: 'syntax', desc: 'Routing rules for traffic entering via the Gateway — uses gateways: field to link to a Gateway CRD.' },
    { name: 'credentialName', type: 'keyword', desc: 'Name of the Kubernetes Secret (in istio-system) holding the TLS cert/key for HTTPS termination.' },
    { name: 'SIMPLE TLS', type: 'keyword', desc: 'One-way TLS at the Gateway — server presents certificate, client does not. Standard HTTPS.' },
    { name: 'PASSTHROUGH TLS', type: 'keyword', desc: 'Gateway passes TLS through unchanged to the backend — backend terminates TLS.' },
    { name: 'MUTUAL TLS', type: 'keyword', desc: 'Both client and server present certificates at the Gateway — used for client certificate authentication.' },
    { name: 'cert-manager', type: 'keyword', desc: 'Kubernetes add-on that automates TLS certificate provisioning from Let\'s Encrypt or private CAs.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Ingress Gateway Architecture',
      points: [
        'The Istio ingress gateway (istio-ingressgateway) is an Envoy proxy pod in `istio-system` exposed via a Kubernetes LoadBalancer Service. It handles all north-south (external → cluster) traffic.',
        'Unlike typical Kubernetes Ingress controllers, the Istio ingress gateway is fully Envoy-based — it benefits from all Envoy capabilities: L7 routing, TLS termination, rate limiting, JWT validation, and custom Lua/WASM filters.',
        'Configuration is split across two resources: (1) Gateway CRD configures the LISTENER (ports, protocols, TLS settings, allowed hosts). (2) VirtualService with `gateways:` field configures the ROUTING RULES for traffic entering that listener.',
        'The Gateway + VirtualService pair is the Istio-native way. Kubernetes Gateway API (GatewayClass + HTTPRoute) is the newer portable approach — both are supported by Istio simultaneously.',
        'Multiple virtual hosts (SNI routing): one ingress gateway can route traffic for multiple hostnames (api.example.com, app.example.com) by configuring multiple hosts in the Gateway CRD and multiple VirtualServices referencing that Gateway.',
        'Egress gateway (istio-egressgateway): a second gateway pod for controlling outbound traffic FROM the cluster to external services. Provides a chokepoint for egress auditing, TLS origination, and egress policy enforcement.',
      ],
    },
    {
      heading: 'TLS Configuration',
      points: [
        'TLS mode SIMPLE: standard HTTPS. The Gateway presents a server certificate to clients. Store the cert/key in a Kubernetes Secret in `istio-system`; reference it with `credentialName`.',
        'TLS mode PASSTHROUGH: the Gateway does not terminate TLS — it reads the SNI header from the ClientHello and routes the connection to the backend that handles TLS itself. Backend pods must be TLS-capable.',
        'TLS mode MUTUAL: client certificate authentication (mTLS at the edge). Clients must present a certificate signed by the `caCertificates` CA. Used for machine-to-machine auth at the ingress layer.',
        'TLS mode ISTIO_MUTUAL: only for gateway-to-sidecar internal connections. Not applicable for edge TLS.',
        'HTTPS redirect: use two Gateway listeners (HTTP on 80, HTTPS on 443). VirtualService for port 80 uses `HTTPRedirect` filter to redirect clients to HTTPS.',
        'cert-manager integration: create a Certificate resource targeting a Secret in `istio-system`. cert-manager provisions the cert (from Let\'s Encrypt or internal CA) and renews it automatically. The Gateway `credentialName` references the Secret cert-manager manages.',
      ],
    },
    {
      heading: 'Multi-Tenant and Multi-Host Gateways',
      points: [
        'One ingress gateway can serve multiple hostnames via SNI-based routing: each hostname has its own TLS certificate (multiple `tls.credentialName` entries per listener, or per-listener hostname filtering).',
        'Shared Gateway model: platform team owns the Gateway CRD. App teams create VirtualServices that reference the shared Gateway. Works well when all apps use the same hostname space.',
        'Dedicated Gateway per team: each team owns their Gateway CRD and manages their own TLS certs. More isolation — a misconfiguration in one team\'s Gateway doesn\'t affect others.',
        'Gateway selector: the `selector` field on the Gateway CRD determines which Envoy pods the config is pushed to. Default: `{istio: ingressgateway}`. Create a second gateway deployment with different labels for a dedicated gateway.',
        'External IP: when Istio is installed with the `default` profile, an AWS/GCP/Azure LoadBalancer is provisioned automatically. Get the external IP: `kubectl -n istio-system get svc istio-ingressgateway -o jsonpath=\'{.status.loadBalancer.ingress[0].ip}\'`.',
        'Dedicated egress gateway: deploy a second Envoy pod (`istio-egressgateway`) for outbound traffic. Route specific egress via a VirtualService targeting the egress gateway. Log and audit all external calls at this chokepoint.',
      ],
    },
    {
      heading: 'JWT Authentication at the Gateway',
      points: [
        'RequestAuthentication + AuthorizationPolicy on the ingress gateway validates user JWTs before traffic reaches any backend service. This centralises auth — individual services don\'t need to validate tokens.',
        'JWT validation at the gateway: create a RequestAuthentication targeting the `istio-ingressgateway` pod with the JWKS URI. Istio fetches the public keys and caches them.',
        'After validation, Envoy adds the decoded JWT payload to the `x-jwt-payload` header (if `outputPayloadToHeader` is configured). Backend services can trust this header — Envoy validated the JWT.',
        'CORS at the gateway: VirtualService `corsPolicy` handles CORS preflight requests at the gateway level. This is more efficient than per-service CORS handling — one central config.',
        'Rate limiting at the gateway: Istio supports rate limiting via the Envoy local rate limiter (simple bucket per gateway pod) or global rate limiting via the Ratelimit service (shared state across gateway pods).',
        'WAF integration: place a Web Application Firewall (Cloudflare, AWS WAF, or ModSecurity WASM filter) in front of or within the Istio ingress gateway for SQL injection, XSS, and OWASP protection.',
      ],
    },
    {
      heading: 'HA and Scaling',
      points: [
        'Ingress gateway HA: the default IstioOperator deploys the ingress gateway with `minReplicas: 1`. For production, set `hpaSpec.minReplicas: 2` and `maxReplicas: 5` (or appropriate values for your traffic).',
        'Pod Disruption Budget: create a PDB for `istio-ingressgateway` to ensure at least 1 replica is available during node drains: `kubectl create pdb igw-pdb --selector=app=istio-ingressgateway --min-available=1 -n istio-system`.',
        'Resource requests: the default ingress gateway has minimal CPU/memory requests. In production, set appropriate requests based on your traffic: start with `cpu: 100m, memory: 128Mi` and tune from metrics.',
        'Connection draining: when a gateway pod is terminating, configure `terminationDrainDuration` in `meshConfig.defaultConfig` to allow in-flight requests to complete before the pod exits.',
        'Health checks: the gateway exposes `/healthz/ready` on port 15021. Configure the LoadBalancer health check to target this port — ensures only healthy gateway pods receive traffic from the external load balancer.',
        'Cross-zone HA: deploy `topologySpreadConstraints` on the gateway Deployment to ensure replicas are distributed across availability zones — preventing a zone failure from taking down all gateway pods simultaneously.',
      ],
    },
    {
      heading: 'Debugging Ingress Issues',
      points: [
        '`istioctl proxy-config routes deploy/istio-ingressgateway -n istio-system` — shows all virtual hosts and routes the gateway currently serves. Verify your VirtualService is present.',
        '`istioctl proxy-config listeners deploy/istio-ingressgateway -n istio-system` — shows all listeners (ports). Verify the Gateway CRD\'s ports are active.',
        '`kubectl logs -n istio-system -l istio=ingressgateway` — access logs from the gateway. Look for `response_flags` and HTTP status codes.',
        'Common 404: VirtualService `hosts` field doesn\'t match the request Host header. Ensure the Host you\'re sending matches the VirtualService `hosts` list (including wildcard handling).',
        'Common 503: VirtualService references a backend that doesn\'t exist (wrong service name/port) or all backend pods are failing health checks.',
        '`istioctl analyze -n istio-system` — runs validation on all Istio configs in the namespace. Reports misconfigured Gateway CRDs, orphaned VirtualServices, and missing backend references.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'HTTPS Ingress Setup',
      language: 'bash',
      code: `# Store TLS cert in istio-system
kubectl create secret tls myapp-tls \\
  --cert=path/to/tls.crt \\
  --key=path/to/tls.key \\
  -n istio-system

# Gateway: HTTPS listener
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: myapp-gateway
  namespace: istio-system
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 443
      name: https
      protocol: HTTPS
    hosts:
    - "api.example.com"
    tls:
      mode: SIMPLE
      credentialName: myapp-tls   # Secret name in istio-system
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "api.example.com"
    tls:
      httpsRedirect: true   # Redirect HTTP → HTTPS
---
# VirtualService: route traffic entering via this Gateway
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: myapp
  namespace: production
spec:
  hosts:
  - "api.example.com"
  gateways:
  - istio-system/myapp-gateway  # Reference the Gateway
  http:
  - match:
    - uri:
        prefix: /api
    route:
    - destination:
        host: api-service.production.svc.cluster.local
        port:
          number: 8080
EOF`,
    },
    {
      label: 'JWT Auth at Gateway',
      language: 'bash',
      code: `# Validate JWTs from Auth0 at the ingress gateway
cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1beta1
kind: RequestAuthentication
metadata:
  name: jwt-at-gateway
  namespace: istio-system
spec:
  selector:
    matchLabels:
      istio: ingressgateway
  jwtRules:
  - issuer: "https://myapp.auth0.com/"
    jwksUri: "https://myapp.auth0.com/.well-known/jwks.json"
    outputPayloadToHeader: x-jwt-payload
---
# Require JWT for all /api/* traffic
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: require-jwt-at-gateway
  namespace: istio-system
spec:
  selector:
    matchLabels:
      istio: ingressgateway
  action: ALLOW
  rules:
  - from:
    - source:
        requestPrincipals: ["*"]
    to:
    - operation:
        paths: ["/api/*"]
  # Allow health checks without JWT
  - to:
    - operation:
        paths: ["/health", "/readyz"]
        methods: ["GET"]
EOF`,
    },
    {
      label: 'cert-manager Integration',
      language: 'bash',
      code: `# Auto-provision TLS cert from Let's Encrypt via cert-manager
# 1. Install cert-manager (if not already)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml

# 2. Create a ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
    - http01:
        ingress:
          class: istio
---
# 3. Request a certificate (stored in istio-system)
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: api-example-com
  namespace: istio-system
spec:
  secretName: api-example-com-tls  # Gateway credentialName
  dnsNames:
  - api.example.com
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
EOF`,
    },
    {
      label: 'Debug Ingress',
      language: 'bash',
      code: `# Check gateway listeners
istioctl proxy-config listeners deploy/istio-ingressgateway \\
  -n istio-system --port 443

# Check virtual hosts and routes
istioctl proxy-config routes deploy/istio-ingressgateway \\
  -n istio-system

# Check gateway access logs
kubectl logs -n istio-system \\
  -l istio=ingressgateway \\
  --since=5m | grep -v "200"

# Get external IP of the gateway
export INGRESS_IP=$(kubectl -n istio-system get svc istio-ingressgateway \\
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Test routing
curl -H "Host: api.example.com" "http://\${INGRESS_IP}/api/health"

# Run config analysis
istioctl analyze -n istio-system
istioctl analyze -n production`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'VirtualService host does not match request Host header',
      wrong: `# VirtualService hosts: ["api.example.com"]
# Request: curl -H "Host: www.example.com" http://<gateway-ip>/api
# Result: 404 — no VirtualService matches "www.example.com"`,
      right: `# Either add all hostnames to VirtualService:
hosts:
- "api.example.com"
- "www.example.com"
# Or use wildcard for the domain:
hosts:
- "*.example.com"`,
      explanation: 'The `hosts` field in VirtualService must exactly match (or wildcard-match) the `Host` header in the client request. A mismatch results in a 404 from the gateway — the gateway cannot find a route for that host.',
    },
    {
      title: 'TLS secret in wrong namespace (not istio-system)',
      wrong: `# Secret created in production namespace
kubectl create secret tls myapp-tls --cert=tls.crt --key=tls.key -n production
# Gateway credentialName: myapp-tls → 503 — secret not found`,
      right: `# TLS secrets for Istio Gateway MUST be in istio-system
kubectl create secret tls myapp-tls --cert=tls.crt --key=tls.key -n istio-system
# Gateway credentialName: myapp-tls → works`,
      explanation: 'Istio\'s ingress gateway reads TLS certificates from Kubernetes Secrets in the `istio-system` namespace. Secrets in other namespaces are invisible to the gateway. Always create TLS secrets in `istio-system` for use with the Istio Gateway `credentialName` field.',
    },
    {
      title: 'Missing gateways field in VirtualService — traffic enters mesh but bypasses routing',
      wrong: `spec:
  hosts:
  - "api.example.com"
  # No gateways field → VirtualService applies to mesh traffic only
  http:
  - route:
    - destination:
        host: api-service`,
      right: `spec:
  hosts:
  - "api.example.com"
  gateways:
  - istio-system/myapp-gateway   # Reference the Gateway
  - mesh                         # Also apply to mesh (optional)
  http:
  - route:
    - destination:
        host: api-service`,
      explanation: 'A VirtualService without a `gateways` field defaults to `gateways: [mesh]` — it applies to east-west sidecar traffic only, not ingress traffic. To route traffic entering via an Istio Gateway CRD, you must explicitly reference the Gateway in the `gateways` field.',
    },
    {
      title: 'Single ingress gateway replica — no HA',
      wrong: `# Default install: minReplicas: 1
# Node with gateway pod fails → all external traffic drops
# RTO = time for K8s to reschedule pod (30-60s)`,
      right: `# IstioOperator HPA for gateway
k8s:
  hpaSpec:
    minReplicas: 2
    maxReplicas: 5
  resources:
    requests:
      cpu: 100m
      memory: 128Mi`,
      explanation: 'A single ingress gateway pod is a single point of failure. Node failure, eviction, or upgrade will cause external traffic to drop until Kubernetes reschedules the pod (30-60s). Always run at least 2 replicas and add topologySpreadConstraints to distribute them across AZs.',
    },
    {
      title: 'Forgetting httpsRedirect for HTTP listener',
      wrong: `# Only HTTPS listener defined
# Browser requests http:// → Connection refused (port 80 not open)
# Users see a browser error, not a redirect`,
      right: `# Add HTTP listener with httpsRedirect: true
servers:
- port:
    number: 80
    name: http
    protocol: HTTP
  hosts:
  - "api.example.com"
  tls:
    httpsRedirect: true   # 301 redirect to HTTPS`,
      explanation: 'If you only open port 443, browsers sending plain HTTP to port 80 get a connection refused instead of a redirect. Always add an HTTP listener with `httpsRedirect: true` — this sends a 301 to HTTPS for all HTTP requests, which browsers cache and follow on subsequent visits.',
    },
  ];

  challenge: Challenge = {
    title: 'Configure Multi-Host HTTPS Ingress',
    language: 'typescript',
    description: `Configure Istio ingress for two services on different hostnames:
- api.myapp.com → api-service:8080 (TLS cert: api-tls)
- admin.myapp.com → admin-service:9090 (TLS cert: admin-tls, MUTUAL TLS required)
- Both with HTTP→HTTPS redirect on port 80

Return a single Gateway resource and two VirtualService resources joined by "---".`,
    hints: [
      'One Gateway can have multiple server entries (one per hostname/TLS config)',
      'MUTUAL TLS requires mode: MUTUAL and caCertificates in the tls block',
      'Each VirtualService references the same Gateway but different hosts',
      'HTTP redirect needs a separate server entry with httpsRedirect: true',
    ],
    starterCode: `function getIngressConfig(): string {
  return '# Gateway + 2 VirtualServices';
}
console.log(getIngressConfig());`,
    solution: `function getIngressConfig(): string {
  const gw = \`apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: multihost-gw
  namespace: istio-system
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "api.myapp.com"
    - "admin.myapp.com"
    tls:
      httpsRedirect: true
  - port:
      number: 443
      name: https-api
      protocol: HTTPS
    hosts:
    - "api.myapp.com"
    tls:
      mode: SIMPLE
      credentialName: api-tls
  - port:
      number: 443
      name: https-admin
      protocol: HTTPS
    hosts:
    - "admin.myapp.com"
    tls:
      mode: MUTUAL
      credentialName: admin-tls\`;

  const vsApi = \`apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: api-vs
  namespace: production
spec:
  hosts:
  - "api.myapp.com"
  gateways:
  - istio-system/multihost-gw
  http:
  - route:
    - destination:
        host: api-service
        port:
          number: 8080\`;

  const vsAdmin = \`apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: admin-vs
  namespace: production
spec:
  hosts:
  - "admin.myapp.com"
  gateways:
  - istio-system/multihost-gw
  http:
  - route:
    - destination:
        host: admin-service
        port:
          number: 9090\`;

  return [gw, vsApi, vsAdmin].join('\\n---\\n');
}
console.log(getIngressConfig());`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Where must TLS Secrets be stored for use with the Istio Gateway credentialName field?',
      options: ['In the same namespace as the VirtualService', 'In the istio-system namespace', 'In the namespace where the backend Service lives', 'In any namespace — credentialName can reference cross-namespace secrets'],
      answer: 1,
      explanation: 'Istio\'s ingress gateway reads TLS certificates from Kubernetes Secrets in the `istio-system` namespace only. The `credentialName` field in the Gateway CRD references a Secret by name in `istio-system`. Secrets in other namespaces are not visible to the gateway.',
    },
    {
      q: 'What does TLS mode PASSTHROUGH do on the Istio ingress gateway?',
      options: ['Passes HTTP traffic through without adding TLS', 'Reads the SNI and routes the encrypted connection to the backend — the backend terminates TLS', 'Passes the client certificate to the backend without validation', 'Disables TLS inspection for performance'],
      answer: 1,
      explanation: 'TLS PASSTHROUGH means the gateway does NOT decrypt the connection. It reads the SNI header from the TLS ClientHello to determine routing, then forwards the encrypted TCP stream to the backend. The backend pod itself must terminate TLS. Used when backend services need direct TLS control or use non-standard TLS.',
    },
    {
      q: 'Why does a VirtualService need the `gateways` field to handle ingress traffic?',
      options: ['Without gateways field, the VirtualService is invalid', 'Without gateways field, the VirtualService defaults to mesh — it applies only to sidecar traffic, not ingress', 'The gateways field specifies which backend service to route to', 'The gateways field is needed to enable TLS on the VirtualService'],
      answer: 1,
      explanation: 'A VirtualService without a `gateways` field implicitly applies to `[mesh]` — east-west sidecar traffic only. External traffic entering through an Istio Gateway CRD is ignored. To route ingress traffic, you must explicitly reference the Gateway CRD in the `gateways` field of the VirtualService.',
    },
    {
      q: 'How do you verify that the Istio ingress gateway has accepted your VirtualService routing rules?',
      options: ['kubectl get virtualservice -o yaml and check status', 'istioctl proxy-config routes deploy/istio-ingressgateway -n istio-system', 'kubectl describe gateway and look for VirtualService references', 'Check Kiali service graph for the gateway node'],
      answer: 1,
      explanation: '`istioctl proxy-config routes deploy/istio-ingressgateway -n istio-system` shows all virtual hosts and routes that the gateway Envoy has received and is using. If your VirtualService\'s host and paths appear here, the routing is active. If they are missing, there is a misconfiguration in the Gateway/VirtualService pairing.',
    },
    {
      q: 'What is the minimum number of ingress gateway replicas for production HA?',
      options: ['1 — Kubernetes will reschedule if the pod fails', '2 — ensures at least one gateway is available during pod failure or node drain', '3 — required for quorum-based consistency', '5 — matches the default Istio HPA maxReplicas'],
      answer: 1,
      explanation: 'A minimum of 2 replicas ensures that if one gateway pod fails or is evicted (node drain, upgrade), external traffic continues through the remaining replica with no downtime. With 1 replica, node failure causes a 30-60 second outage while Kubernetes reschedules the pod.',
    },
    {
      q: 'What is the difference between the Istio ingress gateway and a Kubernetes Ingress controller?',
      options: ['Istio gateway only supports gRPC; Ingress supports HTTP only', 'Istio gateway is Envoy-based and supports L7 features (JWT auth, rate limiting, WASM filters); standard Ingress has minimal feature set with vendor annotations', 'Istio gateway requires mTLS; Ingress supports plain HTTP', 'Istio gateway operates at L4 (TCP); Ingress operates at L7 (HTTP)'],
      answer: 1,
      explanation: 'The Istio ingress gateway is an Envoy proxy with the full Envoy feature set: L7 routing, JWT validation, rate limiting, CORS, header manipulation, WebAssembly filters, and access logging. Standard Kubernetes Ingress has a minimal spec and relies on implementation-specific annotations for advanced features — each controller (Nginx, Traefik, HAProxy) differs.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does the Istio egress gateway work and when should you use it?',
      a: 'The egress gateway is a second Envoy proxy pod (`istio-egressgateway`) for controlling outbound traffic. Use it when: <ul><li><strong>Egress auditing</strong>: centralise all external calls through one chokepoint — access logs show every external service call</li><li><strong>TLS origination</strong>: internal services call HTTP; the egress gateway upgrades to HTTPS before leaving the cluster</li><li><strong>Egress policy</strong>: combined with `REGISTRY_ONLY` and ServiceEntry, ensure only approved external hosts are reachable</li></ul>Without an egress gateway, pods with sidecars can still reach external services (Envoy allows it). The egress gateway adds a controlled chokepoint for security teams that need visibility into and control over outbound traffic.',
    },
    {
      q: 'How do you implement zero-downtime upgrades of the ingress gateway?',
      a: 'Key steps: <ol><li><strong>HPA min replicas ≥ 2</strong>: ensures traffic continues during rolling update</li><li><strong>Pod Disruption Budget</strong>: <code>minAvailable: 1</code> prevents Kubernetes from evicting all gateway pods simultaneously during node drains</li><li><strong>Connection draining</strong>: set <code>meshConfig.defaultConfig.terminationDrainDuration: 30s</code> — when a pod receives SIGTERM, Envoy drains connections over 30s before shutting down</li><li><strong>topologySpreadConstraints</strong>: distribute replicas across AZs — an AZ failure doesn\'t affect all replicas</li><li><strong>PodAntiAffinity</strong>: prevent two gateway pods from running on the same node</li></ol>With these in place, rolling updates (Kubernetes replaces pods one at a time) are zero-downtime.',
    },
    {
      q: 'What is SNI-based routing at the Istio ingress gateway?',
      a: 'SNI (Server Name Indication) is a TLS extension where the client announces which hostname it wants to connect to during the TLS handshake (before the server presents its certificate). The Istio ingress gateway uses SNI to: <ul><li><strong>Select the correct TLS certificate</strong>: if api.example.com and admin.example.com share the same IP/port, the gateway presents the correct cert for each</li><li><strong>PASSTHROUGH routing</strong>: for TLS PASSTHROUGH mode, the gateway reads the SNI and routes the encrypted connection to the backend without decrypting — the backend serves the cert matching the SNI</li></ul>Configure SNI routing: in Gateway spec, each `server` entry with a unique `hosts` value handles its own SNI. Istio automatically routes connections to the matching server entry based on the SNI value.',
    },
    {
      q: 'Can I have multiple ingress gateways for different teams or environments?',
      a: 'Yes. Each ingress gateway is an independent Deployment+Service in any namespace. Key steps: <ol><li>Deploy a new gateway with a unique label: <code>istio: my-gateway</code> (in addition to, or instead of, the default <code>istio: ingressgateway</code>)</li><li>Create a Gateway CRD with <code>selector: { istio: my-gateway }</code> — Istiod pushes config only to that gateway</li><li>Provision a separate LoadBalancer Service for this gateway with its own IP</li></ol>Use cases: <ul><li>Public vs internal gateways (different network access control)</li><li>Per-team gateways with different TLS policies</li><li>Canary gateway for testing new Istio versions (revision-based)</li></ul>',
    },
    {
      q: 'How do you configure CORS at the Istio ingress gateway?',
      a: 'CORS is configured in VirtualService using the `corsPolicy` field on HTTP routes: <pre><code>spec:\n  http:\n  - corsPolicy:\n      allowOrigins:\n      - exact: https://myapp.com\n      allowMethods: [GET, POST, PUT, DELETE, OPTIONS]\n      allowHeaders: [authorization, content-type, x-custom-header]\n      allowCredentials: true\n      maxAge: "24h"\n    route:\n    - destination:\n        host: api-service</code></pre>Istio handles the OPTIONS preflight response automatically — your backend services don\'t need CORS headers. Configure CORS at the gateway-facing VirtualService (with <code>gateways:</code> field) to centralise it for all traffic entering via that gateway.',
    },
  { q: 'How do you expose multiple services through an Istio Ingress Gateway?', a: 'Use a single Gateway resource specifying the port and TLS configuration, then create separate VirtualService resources for each service, each referencing the same Gateway. Route traffic to different services using the match conditions: host matching routes traffic based on the SNI hostname, and URI prefix matching routes to different backends based on the URL path. Each VirtualService specifies its hosts field matching the incoming hostname and its gateways field listing the Gateway to bind to. This allows a single load balancer IP to serve multiple domains and paths.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Istio ingress gateway is an Envoy pod (istio-ingressgateway) configured via Gateway CRD (ports/TLS) + VirtualService (routing). TLS secrets go in istio-system. Always run 2+ replicas. Use httpsRedirect for HTTP→HTTPS.',
    mustKnow: [
      'Gateway CRD: configures LISTENER (port, protocol, TLS, hosts). VirtualService: configures ROUTING (must have gateways: field)',
      'TLS secrets must be in istio-system namespace — credentialName references them by name',
      'TLS modes: SIMPLE (one-way HTTPS), PASSTHROUGH (backend handles TLS), MUTUAL (client cert required)',
      'HTTP redirect: add port 80 server entry with tls.httpsRedirect: true',
      'Without gateways field in VirtualService: applies to mesh only, not ingress',
      'istioctl proxy-config routes deploy/istio-ingressgateway: verify gateway routes',
      'HA: min 2 replicas, PDB, topologySpreadConstraints across AZs',
    ],
    interviewFocus: [
      'Gateway CRD vs VirtualService role — listener vs routing rules',
      'Why TLS secrets must be in istio-system',
      'TLS PASSTHROUGH vs SIMPLE — when to use each',
      'How to debug 404 at the gateway (Host mismatch, missing gateways field)',
      'Egress gateway — what it provides beyond just ServiceEntry',
    ],
  };
}
