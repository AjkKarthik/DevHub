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
  selector: 'app-arch-sidecar-service-mesh',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './sidecar-service-mesh.html',
  styleUrl: './sidecar-service-mesh.scss',
})
export class ArchSidecarServiceMesh {

  quickRef: QuickRefItem[] = [
    { name: 'Sidecar', type: 'keyword', desc: 'A proxy container co-deployed alongside each service pod — intercepts all network traffic' },
    { name: 'Service Mesh', type: 'keyword', desc: 'Infrastructure layer managing service-to-service communication via sidecar proxies' },
    { name: 'Data Plane', type: 'keyword', desc: 'The sidecar proxies (Envoy) that actually move traffic between services' },
    { name: 'Control Plane', type: 'keyword', desc: 'Central config manager (Istiod, Linkerd controller) that pushes policy to data plane proxies' },
    { name: 'mTLS', type: 'keyword', desc: 'Mutual TLS — both sides authenticate; mesh does this automatically between all services' },
    { name: 'Envoy', type: 'keyword', desc: 'High-performance proxy used as the data plane by Istio and many service meshes' },
    { name: 'Istio', type: 'keyword', desc: 'Full-featured service mesh: traffic management, observability, mTLS, policy enforcement' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The Sidecar Pattern',
      points: [
        'A sidecar is a separate process (container) deployed alongside each service instance, sharing its network namespace.',
        'All inbound and outbound traffic is intercepted by the sidecar proxy — the service itself is unaware.',
        'Cross-cutting concerns (mTLS, retries, circuit breaking, tracing, metrics) are handled by the sidecar, not the service code.',
        'Any language, any framework — the sidecar makes all services observable and secure without code changes.',
      ],
    },
    {
      heading: 'Service Mesh Architecture',
      points: [
        'Data Plane: the sidecar proxies (Envoy) that actually forward traffic. One per pod.',
        'Control Plane: the central management layer (Istiod, Linkerd controller) that configures all proxies.',
        'Operators define policies (traffic rules, retries, mTLS requirements) in the control plane; the control plane pushes them to all sidecars automatically.',
        'Traffic between services never leaves the mesh in plaintext — mTLS is enforced mesh-wide with zero code changes.',
      ],
    },
    {
      heading: 'What the Mesh Gives You',
      points: [
        'Observability: automatic distributed traces, per-service latency histograms, and error rate dashboards — no instrumentation code.',
        'Traffic management: canary releases (send 5% of traffic to v2), weighted routing, fault injection for chaos testing.',
        'Security: mTLS between all services, RBAC policies (only checkout-service may call payment-service).',
        'Resilience: retries, timeouts, circuit breaking configured centrally — no per-service Polly setup required.',
        'The trade-off: operational complexity of the mesh control plane and ~10ms latency overhead per hop.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Istio VirtualService (canary)',
      language: 'bash',
      code: `# Istio VirtualService — route 95% to v1, 5% to v2 canary
# Applied with: kubectl apply -f canary.yaml

apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: catalog-vs
spec:
  hosts:
    - catalog-service
  http:
    - match:
        - headers:
            x-canary:
              exact: "true"    # force canary for testers
      route:
        - destination:
            host: catalog-service
            subset: v2
    - route:                   # everyone else: 95/5 split
        - destination:
            host: catalog-service
            subset: v1
          weight: 95
        - destination:
            host: catalog-service
            subset: v2
          weight: 5
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: catalog-dr
spec:
  host: catalog-service
  subsets:
    - name: v1
      labels: { version: v1 }
    - name: v2
      labels: { version: v2 }`
    },
    {
      label: 'mTLS Policy',
      language: 'bash',
      code: `# Require mTLS for all services in the production namespace
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT   # reject plaintext; require mutual TLS

---
# AuthorizationPolicy — only checkout-service may call payment-service
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: payment-authz
  namespace: production
spec:
  selector:
    matchLabels:
      app: payment-service
  rules:
    - from:
        - source:
            principals:
              - "cluster.local/ns/production/sa/checkout-service"
      to:
        - operation:
            methods: ["POST"]
            paths: ["/api/payments"]`
    },
    {
      label: 'Retry & Timeout via Mesh',
      language: 'bash',
      code: `# Istio VirtualService — retries and timeout without code changes
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-vs
spec:
  hosts:
    - order-service
  http:
    - timeout: 5s              # per-request timeout
      retries:
        attempts: 3
        perTryTimeout: 1.5s
        retryOn: 5xx,reset,connect-failure,retriable-4xx
      route:
        - destination:
            host: order-service
            port:
              number: 8080

# No Polly, no HttpClient retry config in service code needed.
# The sidecar proxy handles retries transparently.`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Double-implementing retries in both the mesh and service code',
      wrong: `// Istio retries 3×, AND Polly retries 3× — downstream gets hammered 9×`,
      right: `// Choose one: either mesh-level retries OR application-level (Polly) — not both`,
      explanation: 'Layered retries multiply the load on failing downstream services. Pick the mesh for infrastructure retries or the application for business-aware retries — not both.',
    },
    {
      title: 'Enabling the mesh without understanding latency impact',
      wrong: `// Installing Istio without measuring baseline latency — surprised by 10–30ms overhead`,
      right: `// Benchmark before/after; use ambient mesh (Istio ambient) for lower overhead in new deployments`,
      explanation: 'Sidecar proxies add ~10–30ms per hop. This is acceptable for most services but must be measured and factored into SLO budgets.',
    },
    {
      title: 'Relying solely on mesh mTLS without application-level auth',
      wrong: `// Any service in the mesh can call any endpoint — mTLS only proves identity, not authorisation`,
      right: `// Use AuthorizationPolicy (RBAC) to restrict which services can call which endpoints`,
      explanation: 'mTLS authenticates the service identity. AuthorizationPolicy enforces what that identity is allowed to do. Both are needed for defence-in-depth.',
    },
    {
      title: 'Treating sidecar injection as zero-effort',
      wrong: `// Auto-inject sidecars on all namespaces including dev/test — mesh control plane overwhelmed`,
      right: `// Inject selectively: production namespace only, or use namespace labels to opt in`,
      explanation: 'Each sidecar registers with the control plane. Injecting everywhere in large clusters strains the control plane and adds unnecessary overhead in dev environments.',
    },
  ];

  challenge: Challenge = {
    title: 'Design a Service Mesh Policy for a Payment Service',
    language: 'typescript',
    description: `Define the Istio policies (in pseudocode or YAML comments) for a payment-service:
1. mTLS: STRICT mode for the payment namespace.
2. Authorization: only checkout-service and refund-service may POST to /api/payments.
3. Retry: 2 attempts, 2s timeout per attempt, on 5xx errors.
4. Traffic: send 10% of traffic to payment-service v2 for canary testing.

Write the four policy designs clearly labelled.`,
    hints: [
      'PeerAuthentication → STRICT mTLS',
      'AuthorizationPolicy → source principals for checkout/refund',
      'VirtualService retries block',
      'VirtualService weights: 90/10 split between v1 and v2',
    ],
    starterCode: `// 1. mTLS Policy
const mtlsPolicy = {
  namespace: 'payments',
  mode: /* TODO */,
};

// 2. Authorization Policy
const authPolicy = {
  target: 'payment-service',
  allowedCallers: /* TODO */,
  allowedMethods: /* TODO */,
};

// 3. Retry Policy
const retryPolicy = {
  attempts: /* TODO */,
  timeout: /* TODO */,
  retryOn: /* TODO */,
};

// 4. Canary Traffic Split
const trafficSplit = {
  v1Weight: /* TODO */,
  v2Weight: /* TODO */,
};`,
    solution: `// 1. mTLS Policy
const mtlsPolicy = {
  namespace: 'payments',
  mode: 'STRICT', // reject all plaintext; require mutual TLS certificates
};

// 2. Authorization Policy
const authPolicy = {
  target: 'payment-service',
  allowedCallers: [
    'cluster.local/ns/payments/sa/checkout-service',
    'cluster.local/ns/payments/sa/refund-service',
  ],
  allowedMethods: ['POST'],
  allowedPaths: ['/api/payments'],
  // All other callers → 403 Forbidden
};

// 3. Retry Policy (via VirtualService)
const retryPolicy = {
  attempts: 2,
  perTryTimeout: '2s',
  retryOn: '5xx,reset,connect-failure',
  // Total max latency: 2 × 2s = 4s
};

// 4. Canary Traffic Split (via VirtualService + DestinationRule)
const trafficSplit = {
  v1Weight: 90, // 90% of traffic → stable v1
  v2Weight: 10, // 10% canary → v2 being tested
  // Testers can force v2 via x-canary: "true" header
};`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the role of the data plane in a service mesh?',
      options: [
        'Stores service configuration in a central database',
        'Sidecar proxies (Envoy) that actually intercept and forward all service traffic',
        'Manages Kubernetes deployments',
        'Provides the developer UI for traffic monitoring',
      ],
      answer: 1,
      explanation: 'The data plane consists of the sidecar proxies (one per pod) that intercept, inspect, and forward all inbound/outbound traffic.',
    },
    {
      q: 'What does mTLS in a service mesh provide?',
      options: [
        'Encrypts data at rest in the database',
        'Mutual authentication between services — both sides prove their identity with certificates',
        'Compresses HTTP payloads',
        'Limits the number of concurrent requests',
      ],
      answer: 1,
      explanation: 'mTLS authenticates both the caller and the callee using certificates managed by the mesh — no hardcoded secrets or API keys needed.',
    },
    {
      q: 'Why should you avoid adding retries in both the mesh AND application code?',
      options: [
        'Retries are not supported in service meshes',
        'Layered retries multiply load — 3 mesh retries × 3 app retries = 9 calls per request',
        'Application retries are always faster',
        'mTLS blocks retry calls',
      ],
      answer: 1,
      explanation: 'When both layers retry, a single user request can generate N×M downstream calls, severely amplifying load on an already-stressed service.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is "ambient mesh" and why does it matter?',
      a: 'Istio Ambient Mesh removes the per-pod sidecar in favour of a per-node proxy (ztunnel) and optional per-service waypoint proxy. Pros: lower memory/CPU overhead (no sidecar per pod), easier adoption. Cons: less granular per-pod policy. GA in Istio 1.22+.',
    },
    {
      q: 'When is a service mesh overkill?',
      a: 'Small deployments (< 10–20 services), teams without Kubernetes expertise, or when the latency overhead is unacceptable for the SLO. A simpler alternative: Polly for resilience, OpenTelemetry for tracing, and mTLS certificates managed per-service.',
    },
    {
      q: 'Does Linkerd differ from Istio?',
      a: 'Linkerd is lighter, uses a Rust-based microproxy (lower resource footprint), and is simpler to operate. Istio is more feature-rich (advanced traffic management, Wasm extensibility) but more complex. Both use Envoy-compatible concepts. Choose Linkerd for simplicity, Istio for advanced policy needs.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'A service mesh deploys sidecar proxies alongside every service to provide mTLS, retries, tracing, and traffic management without any application code changes.',
    mustKnow: [
      'Sidecar: co-deployed proxy that intercepts all service traffic transparently',
      'Data plane: Envoy proxies that move traffic; Control plane: Istiod that configures them',
      'mTLS: mutual authentication, zero plaintext between services — mesh-wide, automatic',
      'AuthorizationPolicy: who is allowed to call what — not just mTLS identity',
      'Canary routing, retries, timeouts: configured in VirtualService, zero code changes',
    ],
    interviewFocus: [
      'Explain the sidecar pattern and what problems it solves',
      'What is the difference between data plane and control plane?',
      'Why might you avoid adding retries in both the mesh and application code?',
    ],
  };
}
