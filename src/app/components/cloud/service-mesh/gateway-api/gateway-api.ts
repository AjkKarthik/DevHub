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
  selector: 'app-mesh-gateway-api',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './gateway-api.html',
  styleUrl: './gateway-api.scss',
})
export class MeshGatewayApi {
  quickRef: QuickRefItem[] = [
    { name: 'GatewayClass', type: 'syntax', desc: 'Cluster-scoped resource that defines the type of Gateway infrastructure — implemented by Istio, Nginx, Envoy Gateway, etc.' },
    { name: 'Gateway', type: 'syntax', desc: 'Configures a specific listener (port, protocol, TLS) — namespace-scoped. References a GatewayClass.' },
    { name: 'HTTPRoute', type: 'syntax', desc: 'Attaches routing rules (path, header, method matching and backend refs) to a Gateway or directly to a Service.' },
    { name: 'parentRefs', type: 'keyword', desc: 'Field on HTTPRoute specifying which Gateway(s) or Services this route attaches to.' },
    { name: 'backendRefs', type: 'keyword', desc: 'List of backend services in an HTTPRoute rule — supports weights for traffic splitting.' },
    { name: 'ReferenceGrant', type: 'syntax', desc: 'Cross-namespace permission — allows a Gateway in namespace A to reference a Service in namespace B.' },
    { name: 'TCPRoute', type: 'syntax', desc: 'Routes raw TCP traffic through a Gateway — used for non-HTTP protocols (databases, MQTT).' },
    { name: 'mesh parentRef', type: 'keyword', desc: 'Attaching an HTTPRoute to the special "mesh" parentRef enables east-west (service-to-service) routing without a Gateway.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Kubernetes Gateway API Replaces Ingress',
      points: [
        'Kubernetes Ingress is the original API for HTTP routing — but it only supports basic path/host routing and relies on implementation-specific annotations for anything advanced (TLS, redirects, traffic splitting).',
        'Kubernetes Gateway API is the official replacement — a set of standard CRDs that provide a rich, portable routing model: GatewayClass, Gateway, HTTPRoute, TCPRoute, TLSRoute, GRPCRoute.',
        'Key improvements over Ingress: role-based model (infrastructure team manages GatewayClass/Gateway; app teams manage HTTPRoute), portable configuration across implementations, native traffic splitting support, and expression-based matching.',
        'Istio implements the Gateway API via its `istio` GatewayClass. Istio-managed Gateways provision Envoy-based load balancers; HTTPRoutes replace VirtualServices for ingress traffic.',
        'GAMMA (Gateway API for Mesh Management and Administration): extends Gateway API for east-west mesh traffic — HTTPRoutes attached to a Service (not a Gateway) control service-to-service routing within the mesh.',
        'Migration path: Istio supports both its own Gateway/VirtualService CRDs AND the Kubernetes Gateway API simultaneously. You can migrate incrementally — existing VirtualService/Gateway configs continue working.',
      ],
    },
    {
      heading: 'Core Resources',
      points: [
        'GatewayClass: cluster-scoped, defines the implementation. For Istio: `controllerName: istio.io/gateway-controller`. Created by the platform team — one per implementation type.',
        'Gateway: namespace-scoped listener configuration. Specifies `gatewayClassName: istio`, listeners (port + protocol + TLS), and allowed routes (which namespaces can attach HTTPRoutes to this Gateway).',
        'HTTPRoute: specifies routing rules. `parentRefs` attaches it to a Gateway (ingress) or a Service (mesh). `rules` list match conditions and `backendRefs` destinations.',
        'ReferenceGrant: cross-namespace permission. If an HTTPRoute in namespace `apps` references a Service in namespace `backends`, a ReferenceGrant in `backends` must explicitly permit it.',
        'GRPCRoute: like HTTPRoute but for gRPC — supports gRPC-specific matching (service name, method name). Available in Gateway API v0.8+.',
        'TCPRoute: routes raw TCP connections — used for databases, MQTT, or any non-HTTP protocol through a Gateway listener.',
      ],
    },
    {
      heading: 'HTTPRoute Routing Rules',
      points: [
        'HTTPRoute supports the same matching capabilities as Istio VirtualService: path (exact/prefix/regex), headers (exact/regex), method, query params, and port.',
        'Multiple rules in one HTTPRoute are OR\'d — first matching rule wins. Within a rule, all match conditions are AND\'d.',
        'Traffic splitting: `backendRefs` with weights. Example: 90% to `svc-v1:80` and 10% to `svc-v2:80`. Weights sum to 100 (or use any integers — Gateway API normalises them).',
        'Header manipulation: `filters` on the route or backend level. `RequestHeaderModifier` adds/sets/removes headers. `ResponseHeaderModifier` modifies response headers.',
        'URL rewrite: `URLRewrite` filter changes the path or hostname before forwarding — replaces Istio VirtualService `rewrite` field.',
        'Redirect: `RequestRedirect` filter sends HTTP 301/302. Useful for HTTPS redirect: match HTTP on port 80 → redirect to HTTPS on port 443.',
      ],
    },
    {
      heading: 'GAMMA: Gateway API for Mesh Traffic',
      points: [
        'GAMMA enables east-west traffic management using Gateway API resources instead of Istio VirtualService. HTTPRoute attaches to a Kubernetes Service via `parentRefs[0].kind: Service`.',
        'This is a major shift: instead of learning Istio-specific VirtualService/DestinationRule, teams can use the same Gateway API primitives for BOTH ingress and mesh traffic.',
        'Supported GAMMA features in Istio 1.16+: traffic splitting by weight, header-based routing, URL rewriting, retry policies (via Gateway API experimental features), and timeout policies.',
        'Service selection: the HTTPRoute targets a parent Service. All traffic destined for that Service is subject to the HTTPRoute rules — functionally equivalent to a VirtualService.',
        'GAMMA does not yet support all Istio VirtualService features: outlierDetection, connectionPool, and subset-based consistent hashing still require DestinationRule. GAMMA coverage is expanding with each Gateway API version.',
        'Coexistence: GAMMA HTTPRoutes and Istio VirtualServices can coexist for the same Service. Istio applies both — be careful not to create conflicting rules.',
      ],
    },
    {
      heading: 'Role-Based Delegation Model',
      points: [
        'Gateway API introduces role separation: infrastructure owners manage GatewayClass and Gateway resources; application teams manage HTTPRoutes. This maps cleanly to real org structures.',
        'Gateway `spec.listeners[0].allowedRoutes.namespaces`: controls which namespaces\' HTTPRoutes can attach. `All` (any namespace), `Same` (only same namespace), `Selector` (namespaces matching labels).',
        'This prevents namespace boundary violations — a Gateway in `production` can limit attachments to routes in the `production` namespace, stopping `staging` routes from accidentally routing through the production Gateway.',
        'ReferenceGrant enables cross-namespace Service references: an HTTPRoute in `app-ns` can reference a backend in `infra-ns` only if a ReferenceGrant in `infra-ns` permits it.',
        'Status conditions: Gateway API provides rich status on all resources. `GatewayStatus.conditions`, `RouteStatus.parents[].conditions` show whether the route is accepted, attached, and resolving correctly.',
        'Conflict resolution: if two HTTPRoutes attach to the same Gateway and have overlapping matches, the one with the lower creation timestamp wins. This is deterministic but can be surprising — design routes to avoid overlaps.',
      ],
    },
    {
      heading: 'Istio Gateway API vs Istio-native Gateway CRDs',
      points: [
        'Istio-native: `networking.istio.io/v1beta1` Gateway + VirtualService. Stable, feature-complete, supported indefinitely. The "old" way that still works.',
        'Kubernetes Gateway API: `gateway.networking.k8s.io` GatewayClass/Gateway/HTTPRoute. The forward-looking standard — Istio is investing here for new features.',
        'Feature parity: for ingress use cases, Gateway API is feature-equivalent. For advanced mesh features (outlierDetection, connectionPool, consistent hash), Istio CRDs are still needed.',
        'Choose Gateway API when: you want portable configs that work across Istio versions and other implementations, you have platform/app role separation, or you are starting a new project.',
        'Choose Istio CRDs when: you need full Istio feature set (all DestinationRule policies), your team is already proficient with them, or you are in the middle of a migration.',
        'Istio 1.20+ recommendation: use Gateway API for new projects. Istio will continue supporting both but Gateway API is the direction for future development.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic HTTPRoute',
      language: 'bash',
      code: `# GatewayClass (created by platform team)
cat <<EOF | kubectl apply -f -
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: istio
spec:
  controllerName: istio.io/gateway-controller
---
# Gateway: listens on port 80 (HTTP)
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: main-gateway
  namespace: istio-system
spec:
  gatewayClassName: istio
  listeners:
  - name: http
    port: 80
    protocol: HTTP
    allowedRoutes:
      namespaces:
        from: All   # Any namespace can attach routes
---
# HTTPRoute: route /api/* to api-service
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api-route
  namespace: production
spec:
  parentRefs:
  - name: main-gateway
    namespace: istio-system
  hostnames:
  - "api.example.com"
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api
    backendRefs:
    - name: api-service
      port: 8080
EOF`,
    },
    {
      label: 'Traffic Splitting & Headers',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: checkout-canary
  namespace: production
spec:
  parentRefs:
  - name: main-gateway
    namespace: istio-system
  rules:
  # Header-based canary routing
  - matches:
    - headers:
      - name: x-canary
        value: "true"
    backendRefs:
    - name: checkout-v2
      port: 8080
      weight: 100
  # Weighted traffic split: 90% v1, 10% v2
  - backendRefs:
    - name: checkout-v1
      port: 8080
      weight: 90
    - name: checkout-v2
      port: 8080
      weight: 10
EOF`,
    },
    {
      label: 'GAMMA: Mesh Traffic (East-West)',
      language: 'bash',
      code: `# HTTPRoute attached to a Service (not a Gateway) — GAMMA pattern
cat <<EOF | kubectl apply -f -
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: payment-mesh
  namespace: production
spec:
  parentRefs:
  - group: ""
    kind: Service         # Attach to Service, not Gateway
    name: payment
    port: 8080
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /payment
    filters:
    - type: RequestHeaderModifier
      requestHeaderModifier:
        add:
        - name: x-internal
          value: "true"
    backendRefs:
    - name: payment-v1
      port: 8080
      weight: 95
    - name: payment-v2
      port: 8080
      weight: 5
EOF`,
    },
    {
      label: 'TLS Gateway & ReferenceGrant',
      language: 'bash',
      code: `# TLS-terminating Gateway with cross-namespace cert secret
cat <<EOF | kubectl apply -f -
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: secure-gateway
  namespace: istio-system
spec:
  gatewayClassName: istio
  listeners:
  - name: https
    port: 443
    protocol: HTTPS
    tls:
      mode: Terminate
      certificateRefs:
      - kind: Secret
        name: tls-cert
        namespace: certs    # Cross-namespace reference
---
# ReferenceGrant: allow gateway in istio-system to use secret in certs
apiVersion: gateway.networking.k8s.io/v1beta1
kind: ReferenceGrant
metadata:
  name: allow-gateway-cert
  namespace: certs
spec:
  from:
  - group: gateway.networking.k8s.io
    kind: Gateway
    namespace: istio-system
  to:
  - group: ""
    kind: Secret
    name: tls-cert
EOF`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting ReferenceGrant for cross-namespace references',
      wrong: `# HTTPRoute in "apps" namespace references Service in "backends" namespace
backendRefs:
- name: payment-service
  namespace: backends   # Cross-namespace → blocked without ReferenceGrant`,
      right: `# Create ReferenceGrant in "backends" namespace
apiVersion: gateway.networking.k8s.io/v1beta1
kind: ReferenceGrant
metadata:
  name: allow-from-apps
  namespace: backends
spec:
  from:
  - group: gateway.networking.k8s.io
    kind: HTTPRoute
    namespace: apps
  to:
  - group: ""
    kind: Service
    name: payment-service`,
      explanation: 'Gateway API enforces namespace isolation by default — cross-namespace references (HTTPRoute referencing a Service in another namespace, or a Gateway referencing a Secret in another namespace) are blocked unless a ReferenceGrant in the TARGET namespace explicitly permits them. Without it, the Route status shows "RefNotPermitted".',
    },
    {
      title: 'Attaching HTTPRoute to both a Gateway and a Service simultaneously',
      wrong: `parentRefs:
- name: main-gateway        # Gateway (ingress)
  namespace: istio-system
- group: ""
  kind: Service             # Service (mesh) - same route
  name: payment`,
      right: `# Separate HTTPRoutes for ingress and mesh concerns
# Route 1: for ingress (attached to Gateway)
# Route 2: for mesh traffic (attached to Service via GAMMA)
# Mixing both in one HTTPRoute creates ambiguous routing behaviour`,
      explanation: 'While technically possible, attaching an HTTPRoute to both a Gateway and a Service in the same resource creates confusion. The rules apply to both traffic paths with potentially different semantics. Keep ingress and mesh HTTPRoutes separate for clarity.',
    },
    {
      title: 'Expecting Gateway API to replace all Istio DestinationRule features',
      wrong: `# Using only HTTPRoute with backendRefs weights for traffic splitting
# No DestinationRule configured
# Circuit breaker (connectionPool) and outlierDetection not applied`,
      right: `# HTTPRoute handles routing + traffic splitting
# DestinationRule still needed for:
# - Connection pool limits (circuit breaker)
# - Outlier detection (health-based ejection)
# - Consistent hash load balancing
# - TLS mode overrides`,
      explanation: 'Kubernetes Gateway API covers routing and traffic splitting. Istio-specific resilience features (outlierDetection, connectionPool, consistent hash) are still configured via DestinationRule. Gateway API and Istio CRDs are complementary, not mutually exclusive — use both.',
    },
    {
      title: 'Conflicting HTTPRoutes on the same Gateway path',
      wrong: `# Route A: PathPrefix /api (created at 10:00)
# Route B: PathPrefix /api/v2 (created at 09:00)
# Route B was created first → it wins for /api/v2 despite being less specific`,
      right: `# Use specific path types to avoid ambiguity
# Exact match > PathPrefix match
# Earlier-created routes win ties — design routes to avoid overlaps
# Better: one HTTPRoute with multiple rules in order of specificity`,
      explanation: 'Gateway API resolves conflicts between HTTPRoutes by creation timestamp — older routes win. Unlike VirtualService where rules within a resource are evaluated in order, conflict between separate HTTPRoute resources is resolved by timestamp. Avoid overlapping matches by using one HTTPRoute with ordered rules.',
    },
    {
      title: 'Not checking HTTPRoute status after applying',
      wrong: `kubectl apply -f httproute.yaml
# Assume it worked → test → 404 → spend an hour debugging`,
      right: `kubectl apply -f httproute.yaml
kubectl get httproute api-route -n production -o yaml
# Check .status.parents[].conditions for:
# - Accepted: True → Route was accepted by the Gateway
# - ResolvedRefs: True → All backend Services exist and are reachable`,
      explanation: 'Gateway API provides detailed status on HTTPRoute resources. If the route is not working, check `.status.parents[].conditions`. "Accepted: False" means the Gateway rejected the route (namespace not allowed, bad GatewayClass). "ResolvedRefs: False" means a backend Service was not found. These status conditions diagnose issues in seconds.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Complete Gateway API Setup',
    language: 'typescript',
    description: `Design a Gateway API configuration for the "shop" application:
- GatewayClass using istio controller
- HTTPS Gateway on port 443 with TLS termination, cert secret "shop-tls" in namespace "certs"
- HTTPRoute for "shop.example.com":
  - /products/* → product-service:8080 (100%)
  - /cart/* → cart-v1:8080 (80%) and cart-v2:8080 (20%)
- ReferenceGrant allowing the Gateway to use the TLS secret

Return all four YAML resources joined by "---".`,
    hints: [
      'GatewayClass controllerName: istio.io/gateway-controller',
      'Gateway listener protocol: HTTPS, tls.mode: Terminate',
      'certificateRefs need name and namespace (cross-namespace)',
      'ReferenceGrant goes in the "certs" namespace',
      'HTTPRoute rules: first matches /products, second splits /cart',
    ],
    starterCode: `function getShopConfig(): string {
  return '# Your 4 YAML resources here joined by ---';
}
console.log(getShopConfig());`,
    solution: `function getShopConfig(): string {
  const resources = [
    \`apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: istio
spec:
  controllerName: istio.io/gateway-controller\`,
    \`apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: shop-gateway
  namespace: istio-system
spec:
  gatewayClassName: istio
  listeners:
  - name: https
    port: 443
    protocol: HTTPS
    tls:
      mode: Terminate
      certificateRefs:
      - kind: Secret
        name: shop-tls
        namespace: certs\`,
    \`apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: shop-routes
  namespace: production
spec:
  parentRefs:
  - name: shop-gateway
    namespace: istio-system
  hostnames:
  - shop.example.com
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /products
    backendRefs:
    - name: product-service
      port: 8080
      weight: 100
  - matches:
    - path:
        type: PathPrefix
        value: /cart
    backendRefs:
    - name: cart-v1
      port: 8080
      weight: 80
    - name: cart-v2
      port: 8080
      weight: 20\`,
    \`apiVersion: gateway.networking.k8s.io/v1beta1
kind: ReferenceGrant
metadata:
  name: allow-shop-gateway
  namespace: certs
spec:
  from:
  - group: gateway.networking.k8s.io
    kind: Gateway
    namespace: istio-system
  to:
  - group: ""
    kind: Secret
    name: shop-tls\`,
  ];
  return resources.join('\\n---\\n');
}
console.log(getShopConfig());`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the role of GatewayClass in the Kubernetes Gateway API?',
      options: ['Defines the routing rules for HTTP traffic', 'Defines the type of Gateway infrastructure and which controller implements it', 'Configures TLS certificates for HTTPS termination', 'Controls which namespaces can attach HTTPRoutes'],
      answer: 1,
      explanation: 'GatewayClass is a cluster-scoped resource that defines the implementation type. For Istio, the GatewayClass has `controllerName: istio.io/gateway-controller`. Platform teams create one GatewayClass per implementation. It decouples the "what type of gateway" (GatewayClass) from "how it is configured" (Gateway).',
    },
    {
      q: 'What is the purpose of ReferenceGrant in Gateway API?',
      options: ['Grants permission for HTTPRoutes to reference Services in OTHER namespaces', 'Grants cluster admin access to create Gateway resources', 'Allows Gateways to reference GatewayClasses in other clusters', 'Permits traffic to cross namespace boundaries in the mesh'],
      answer: 0,
      explanation: 'ReferenceGrant enables cross-namespace references in Gateway API. Without it, an HTTPRoute cannot reference a Service in another namespace, and a Gateway cannot reference a Secret (TLS cert) in another namespace. A ReferenceGrant in the TARGET namespace explicitly permits the reference — enforcing namespace isolation by default.',
    },
    {
      q: 'What does the GAMMA initiative enable in Gateway API?',
      options: ['Multi-cluster Gateway federation', 'Using HTTPRoute (attached to a Service) for east-west mesh traffic routing', 'GPU-accelerated mesh performance', 'GraphQL routing support in HTTPRoute'],
      answer: 1,
      explanation: 'GAMMA (Gateway API for Mesh Management and Administration) extends Gateway API for service mesh traffic. By attaching an HTTPRoute to a Kubernetes Service (not a Gateway), you control east-west service-to-service traffic using the same HTTPRoute primitives used for north-south ingress traffic. This unifies mesh and ingress routing under one API.',
    },
    {
      q: 'How does Gateway API resolve conflicts between two HTTPRoutes with overlapping path matches?',
      options: ['The more specific path match always wins', 'The HTTPRoute with higher weight wins', 'The HTTPRoute created first (lower creation timestamp) wins', 'Conflicts are rejected at apply time'],
      answer: 2,
      explanation: 'When two separate HTTPRoute resources have overlapping matches on the same Gateway listener, Gateway API uses creation timestamp to resolve the conflict — the older resource wins. This is different from VirtualService where rules within one resource are evaluated in order. Avoid overlapping matches by designing routes carefully.',
    },
    {
      q: 'How do you check if an HTTPRoute was successfully attached to a Gateway?',
      options: ['kubectl describe gateway and look for attached routes', 'Check httproute .status.parents[].conditions for "Accepted: True" and "ResolvedRefs: True"', 'curl the Gateway IP and see if traffic routes correctly', 'Check istioctl proxy-config routes for the HTTPRoute name'],
      answer: 1,
      explanation: 'Gateway API provides rich status on HTTPRoute resources. `.status.parents[].conditions` shows whether the route is accepted by the Gateway and whether all backend references resolve. "Accepted: False" indicates the Gateway rejected the route; "ResolvedRefs: False" indicates a missing backend Service. Check status immediately after applying.',
    },
    {
      q: 'Which Istio features still require DestinationRule even when using Gateway API HTTPRoute?',
      options: ['Traffic splitting by weight and header-based routing', 'TLS mode overrides and connection pool limits (circuit breaker)', 'Path matching and URL rewriting', 'Request header manipulation and URL redirects'],
      answer: 1,
      explanation: 'Gateway API HTTPRoute handles routing, traffic splitting, header manipulation, URL rewrite, and redirects. Istio DestinationRule is still needed for features not in the Gateway API spec: connection pool limits (circuit breaker), outlier detection (health-based ejection), consistent hash load balancing, and explicit TLS mode overrides.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the main advantage of Gateway API over Kubernetes Ingress?',
      a: 'Kubernetes Ingress has several limitations: <ul><li>No native traffic splitting (requires implementation-specific annotations)</li><li>No header-based routing in the spec (annotations only)</li><li>Flat model — no role separation between infra and app teams</li><li>No cross-namespace route attachment control</li></ul><strong>Gateway API fixes all of these</strong>: native traffic splitting via backendRefs weights, rich matching (header/method/query), role-based delegation (GatewayClass for infra, HTTPRoute for apps), and allowedRoutes namespace control. Additionally, Gateway API is portable — the same HTTPRoute works across Istio, Nginx Gateway Fabric, Envoy Gateway, and other implementations.',
    },
    {
      q: 'Can I use both Istio VirtualService/Gateway and Kubernetes Gateway API HTTPRoute/Gateway in the same cluster?',
      a: 'Yes — Istio supports both simultaneously. They are independent controllers: <ul><li>Istio Gateway + VirtualService: managed by the <code>networking.istio.io</code> controllers</li><li>Kubernetes Gateway API: managed by the <code>istio.io/gateway-controller</code></li></ul>You can have some services using the old Istio Gateway/VirtualService for ingress while others use HTTPRoute — useful for incremental migration. Be careful not to create conflicting rules for the same hostname/path combination across both systems. Istio\'s recommendation for 1.20+: use Gateway API for new deployments and gradually migrate existing ones.',
    },
    {
      q: 'How does Gateway API handle TLS termination differently from Istio Gateway CRD?',
      a: 'Both support TLS termination at the Gateway level: <strong>Istio Gateway CRD</strong>: <pre><code>spec.servers[0].tls.mode: SIMPLE\nspec.servers[0].tls.credentialName: my-secret</code></pre><strong>Gateway API</strong>: <pre><code>spec.listeners[0].protocol: HTTPS\nspec.listeners[0].tls.mode: Terminate\nspec.listeners[0].tls.certificateRefs[0].name: my-secret</code></pre>Key difference: Gateway API requires a <strong>ReferenceGrant</strong> if the TLS secret is in a different namespace from the Gateway. Istio Gateway CRD uses <code>credentialName</code> and the secret must be in the <code>istio-system</code> namespace (or same namespace as the Gateway).',
    },
    {
      q: 'What is the allowedRoutes field on a Gateway listener and why does it matter?',
      a: '<code>spec.listeners[].allowedRoutes.namespaces</code> controls which namespaces can attach HTTPRoutes to this Gateway listener. Values: <ul><li><strong>All</strong>: any namespace can attach — open platform model</li><li><strong>Same</strong>: only routes in the same namespace as the Gateway can attach — maximum isolation</li><li><strong>Selector</strong>: namespaces matching specified labels can attach — fine-grained control</li></ul>This is the key security boundary in Gateway API. Without it, any team could attach routes to the shared production Gateway — exposing their services through the main ingress without review. Use <code>Selector</code> with namespace labels to give specific teams access to specific Gateways.',
    },
    {
      q: 'How do HTTPRoute timeouts and retry policies work in Gateway API?',
      a: 'Retry and timeout support in HTTPRoute is in the "experimental" Gateway API channel (not yet in standard): <pre><code>spec.rules[0].timeouts:\n  request: 5s\n  backendRequest: 3s</code></pre>For retries, the experimental <code>HTTPRouteFilter</code> with <code>type: ExtensionRef</code> is used — implementation-specific. In Istio, the preferred approach for retries with Gateway API is to use a DestinationRule alongside the HTTPRoute for resilience policies (connection pool, outlier detection) while using HTTPRoute for routing. The Gateway API standard is catching up — check the API version for the latest feature availability.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Kubernetes Gateway API (GatewayClass/Gateway/HTTPRoute) is the portable successor to Ingress and Istio\'s own Gateway/VirtualService CRDs. HTTPRoute supports traffic splitting, header routing, and URL rewriting. GAMMA extends it for east-west mesh traffic.',
    mustKnow: [
      'GatewayClass: cluster-scoped, defines implementation (controllerName: istio.io/gateway-controller)',
      'Gateway: namespace-scoped listener config (port, protocol, TLS); allowedRoutes controls namespace access',
      'HTTPRoute: routing rules with path/header match + backendRefs weights for splitting',
      'GAMMA: HTTPRoute attached to Service (parentRefs[0].kind: Service) for mesh traffic',
      'ReferenceGrant: required for cross-namespace references (HTTPRoute→Service, Gateway→Secret)',
      'Conflict resolution: older HTTPRoute (lower timestamp) wins overlapping path matches',
      'DestinationRule still needed for connectionPool, outlierDetection, consistent hash',
    ],
    interviewFocus: [
      'Gateway API vs Ingress — what problems it solves (role separation, native splitting, portability)',
      'What GAMMA is and how it unifies ingress and mesh routing under one API',
      'When you need ReferenceGrant (cross-namespace reference)',
      'How to debug a non-working HTTPRoute (check .status.parents[].conditions)',
      'What still requires Istio DestinationRule even with Gateway API',
    ],
  };
}
