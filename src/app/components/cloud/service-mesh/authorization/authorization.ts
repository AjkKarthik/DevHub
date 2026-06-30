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
  selector: 'app-mesh-authorization',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './authorization.html',
  styleUrl: './authorization.scss',
})
export class MeshAuthorization {
  quickRef: QuickRefItem[] = [
    { name: 'AuthorizationPolicy', type: 'syntax', desc: 'Controls who can call what — ALLOW, DENY, or AUDIT rules based on source, operation, and conditions.' },
    { name: 'action: ALLOW', type: 'keyword', desc: 'Explicitly grants access. Only matching requests pass; all others are denied if any ALLOW policy exists for that workload.' },
    { name: 'action: DENY', type: 'keyword', desc: 'Explicitly denies matching requests. DENY is evaluated before ALLOW — always wins.' },
    { name: 'action: AUDIT', type: 'keyword', desc: 'Logs matching requests without blocking. Useful for monitoring before enforcing DENY.' },
    { name: 'source.principals', type: 'keyword', desc: 'Matches SPIFFE URI of the calling workload — e.g., cluster.local/ns/prod/sa/api-service.' },
    { name: 'source.namespaces', type: 'keyword', desc: 'Matches the namespace of the calling pod — coarser-grained than principals.' },
    { name: 'RequestAuthentication', type: 'syntax', desc: 'Validates JWT tokens on incoming requests. Failed validation → 401. Missing token treated as anonymous.' },
    { name: 'JWTRule', type: 'syntax', desc: 'Specifies the issuer and JWKS URI for validating a JWT — used inside RequestAuthentication.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'AuthorizationPolicy Evaluation Model',
      points: [
        'AuthorizationPolicy enforces WHAT is allowed after mTLS authenticates WHO is calling. It is Istio\'s layer-7 firewall — operating on HTTP method, path, headers, and source identity.',
        'Evaluation order: DENY policies are evaluated first. If any DENY policy matches, the request is rejected with 403. Then ALLOW policies are evaluated — if at least one ALLOW policy exists for the workload and matches, the request proceeds. If no ALLOW matches, the request is denied.',
        'Default behaviour: a workload with NO AuthorizationPolicy receives ALL traffic (allow-all). A workload with at least ONE ALLOW policy denies everything else that doesn\'t match. This makes adding the first ALLOW policy a breaking change — add it carefully.',
        'Scope: AuthorizationPolicy applies to the workload specified in `spec.selector`. Namespace-level (no selector) applies to all workloads in the namespace. Mesh-level: deploy in `istio-system` with no selector.',
        'Rule structure: each policy has `rules` (list of from/to/when conditions). Multiple rules within a policy are OR\'d — a request matching any rule triggers the action. Conditions within a rule are AND\'d.',
        'AuthorizationPolicy is enforced by the SERVER-SIDE Envoy (the destination workload\'s sidecar), not the client side. This is different from PeerAuthentication which is also server-side but controls TLS mode.',
      ],
    },
    {
      heading: 'ALLOW Policies — Allowlisting',
      points: [
        'An ALLOW policy grants access to matching requests. The `from` field specifies the source (principal, namespace, IP), `to` specifies the operation (methods, paths, ports), and `when` specifies additional conditions (request headers, JWT claims).',
        'Omitting `from`: the rule applies to requests from ANY source (but still only matching the `to` and `when` conditions). Use to allow unauthenticated traffic to public endpoints.',
        'Omitting `to`: the rule applies to ALL operations from the matching source — use carefully for service-to-service trust without path restrictions.',
        'Omitting `when`: no additional condition matching. Most rules omit this unless JWT claim checks are needed.',
        'Principal matching: `source.principals: ["cluster.local/ns/production/sa/frontend"]` — only the frontend ServiceAccount in the production namespace can call. This is zero-trust service-to-service authorization.',
        'Wildcard matching: `source.namespaces: ["production", "staging"]` — allow callers from these namespaces. `to.paths: ["/api/*"]` — allow all paths under /api/. Wildcards use `*` prefix/suffix matching.',
      ],
    },
    {
      heading: 'DENY Policies — Denylisting',
      points: [
        'DENY policies are evaluated before ALLOW and always win. Use DENY to block specific traffic patterns regardless of what ALLOW policies exist.',
        'Use case: deny all traffic from outside the production namespace to a sensitive admin endpoint, even if an ALLOW policy would otherwise permit it from an internal caller.',
        '`action: DENY` with an empty rule list denies NOTHING (semantics: deny if any rule matches, and no rule matches everything). DENY-all is achieved with an empty rules list only if you intentionally use it.',
        'Effective DENY-all: create an ALLOW policy with selector for the workload and no rules that match — nothing gets through. Or: create a DENY with `from: [source: {}]` — denies everything.',
        'DENY + ALLOW combination: deny external namespace traffic first (DENY policy), then allow internal service traffic (ALLOW policy). The DENY runs first — external traffic blocked, internal traffic evaluated against ALLOW.',
        'Debugging DENY: if a request is unexpectedly blocked, `kubectl logs <pod> -c istio-proxy | grep "RBAC"` shows the deny reason. Or enable access logging: `meshConfig.accessLogFile: /dev/stdout` and check Envoy logs.',
      ],
    },
    {
      heading: 'JWT Authentication with RequestAuthentication',
      points: [
        'RequestAuthentication validates JWT tokens on incoming HTTP requests. It is a separate resource from AuthorizationPolicy — RA validates the token; AP decides what validated (or unauthenticated) callers can do.',
        'A request with an INVALID JWT (bad signature, expired, wrong issuer) is rejected with 401 regardless of AuthorizationPolicy.',
        'A request with NO JWT is treated as an anonymous (unauthenticated) caller — it passes RequestAuthentication but may be blocked by AuthorizationPolicy if the policy requires a valid JWT claim.',
        'JWTRule: specify `issuer` (e.g., `https://accounts.google.com`) and `jwksUri` (public keys for signature verification). Optionally specify `audiences` to restrict which tokens are accepted.',
        'JWT forwarding: Envoy can forward the validated JWT to the upstream app via the `outputPayloadToHeader` field — the app receives the decoded payload without needing to re-validate.',
        'Combining RA + AP: RA validates the JWT format and signature; then AP can check JWT claims (e.g., `request.auth.claims[role] = admin`) to make authorization decisions based on user identity in the token.',
      ],
    },
    {
      heading: 'Layered Security Model',
      points: [
        'Best practice: apply AuthorizationPolicy in layers — mesh-level defaults, namespace-level policies, then workload-level overrides.',
        'Mesh-level deny-all: create an ALLOW policy in `istio-system` with an empty `rules` block and no selector — this denies all traffic mesh-wide. Then add explicit ALLOW policies per service.',
        'Namespace isolation: a namespace-level DENY policy blocking cross-namespace traffic ensures services in different namespaces cannot call each other unless explicitly allowed.',
        'Service-level allowlist: each sensitive service has its own AuthorizationPolicy listing the exact ServiceAccounts allowed to call it, the allowed methods (GET, POST), and the allowed paths.',
        'JWT-gated API: RequestAuthentication on the ingress Gateway validates user JWTs. AuthorizationPolicy on internal services checks service-to-service SPIFFE identity. Two-layer authorization for both user and service identity.',
        'Audit before enforce: use `action: AUDIT` to log what WOULD be denied before creating a DENY policy. Review the access logs, then convert to DENY with confidence that legitimate traffic is not blocked.',
      ],
    },
    {
      heading: 'Common Patterns',
      points: [
        'Pattern 1 — Service allowlist: each microservice has an AuthorizationPolicy with `action: ALLOW` listing only the ServiceAccounts that legitimately call it. All other traffic is denied by default.',
        'Pattern 2 — Namespace isolation: DENY cross-namespace traffic at the namespace level. All inter-service communication within a namespace is allowed; cross-namespace requires explicit ALLOW.',
        'Pattern 3 — Path-level access: the admin service allows `/admin/*` only from the `ops-service` ServiceAccount, and `/api/*` from `frontend-service`. Different levels of access for different callers.',
        'Pattern 4 — JWT + service identity: RequestAuthentication validates user JWTs from the ingress. AuthorizationPolicy on the API gateway checks `request.auth.claims[role] == user`. Internal services use SPIFFE principal checks.',
        'Pattern 5 — Egress control: use AuthorizationPolicy on the egress gateway to control which internal services can make calls to the external network (combined with ServiceEntry + REGISTRY_ONLY).',
        'Pattern 6 — Gradual zero-trust: start with AUDIT mode, review logs, identify unexpected callers, update to DENY. Prevents blocking legitimate traffic when first enabling authorization.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Service Allowlist',
      language: 'bash',
      code: `# Allow only "frontend" and "api" ServiceAccounts to call "payment"
cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: payment-allow
  namespace: production
spec:
  selector:
    matchLabels:
      app: payment
  action: ALLOW
  rules:
  - from:
    - source:
        principals:
        - cluster.local/ns/production/sa/frontend
        - cluster.local/ns/production/sa/api-service
    to:
    - operation:
        methods: ["POST", "GET"]
        paths: ["/payment/*"]
EOF`,
    },
    {
      label: 'DENY + JWT Claims',
      language: 'bash',
      code: `# DENY admin endpoints from outside ops namespace
cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-external-admin
  namespace: production
spec:
  selector:
    matchLabels:
      app: admin-api
  action: DENY
  rules:
  - from:
    - source:
        notNamespaces: ["ops"]
    to:
    - operation:
        paths: ["/admin/*"]
---
# JWT claim check: only "admin" role can access /admin
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: admin-jwt-check
  namespace: production
spec:
  selector:
    matchLabels:
      app: admin-api
  action: ALLOW
  rules:
  - when:
    - key: request.auth.claims[role]
      values: ["admin"]
    to:
    - operation:
        paths: ["/admin/*"]
EOF`,
    },
    {
      label: 'RequestAuthentication (JWT)',
      language: 'bash',
      code: `# Validate JWTs from Auth0 on all requests to the API gateway
cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1beta1
kind: RequestAuthentication
metadata:
  name: jwt-auth
  namespace: production
spec:
  selector:
    matchLabels:
      app: api-gateway
  jwtRules:
  - issuer: "https://myapp.auth0.com/"
    jwksUri: "https://myapp.auth0.com/.well-known/jwks.json"
    audiences:
    - "myapp-api"
    outputPayloadToHeader: x-jwt-payload  # Forward decoded payload to upstream
---
# Require valid JWT for all /api/* paths
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: require-jwt
  namespace: production
spec:
  selector:
    matchLabels:
      app: api-gateway
  action: ALLOW
  rules:
  - from:
    - source:
        requestPrincipals: ["*"]  # Any validated JWT principal
    to:
    - operation:
        paths: ["/api/*"]
EOF`,
    },
    {
      label: 'Namespace Isolation',
      language: 'bash',
      code: `# Deny all cross-namespace traffic TO production namespace
cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: deny-cross-namespace
  namespace: production
spec:
  action: DENY
  rules:
  - from:
    - source:
        notNamespaces: ["production", "istio-system"]
---
# Allow monitoring namespace to scrape metrics
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-monitoring-scrape
  namespace: production
spec:
  action: ALLOW
  rules:
  - from:
    - source:
        namespaces: ["monitoring"]
    to:
    - operation:
        paths: ["/metrics"]
        methods: ["GET"]
EOF`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Adding the first ALLOW policy without considering the deny-by-default effect',
      wrong: `# Team adds ALLOW policy for the new billing service to call payment
# Suddenly ALL other existing callers (frontend, api) are blocked
# Because: once ANY ALLOW policy exists, everything not matched is denied`,
      right: `# When adding the first ALLOW policy, include ALL legitimate callers
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
spec:
  action: ALLOW
  rules:
  - from:
    - source:
        principals:
        - cluster.local/ns/prod/sa/billing   # new caller
        - cluster.local/ns/prod/sa/frontend  # existing caller
        - cluster.local/ns/prod/sa/api       # existing caller`,
      explanation: 'The moment any ALLOW AuthorizationPolicy exists for a workload, all traffic that does NOT match any ALLOW rule is denied. Adding the first policy without listing all current callers breaks existing traffic. Always audit who currently calls the service before adding the first ALLOW.',
    },
    {
      title: 'Confusing DENY-all with an empty ALLOW policy',
      wrong: `# Trying to deny all traffic with an empty ALLOW policy
spec:
  action: ALLOW
  rules: []   # No rules = allows nothing? NO — this is invalid and behaves unexpectedly`,
      right: `# To deny all traffic: create a DENY with a universal source match
spec:
  action: DENY
  rules:
  - from:
    - source: {}   # Empty source matches ALL sources → deny everything`,
      explanation: 'An ALLOW policy with empty rules does not deny all traffic — it is effectively meaningless. To explicitly deny all traffic to a workload, use `action: DENY` with a rule that matches all sources. This is the "default deny" posture used as the starting point for zero-trust.',
    },
    {
      title: 'Forgetting that AuthorizationPolicy requires mTLS for principal checks',
      wrong: `# AuthorizationPolicy checking source.principals
# But namespace has PeerAuthentication: PERMISSIVE + some pods uninj ected
# Plaintext callers have no SPIFFE identity → principal check fails → 403`,
      right: `# source.principals only works when mTLS is active (injected + STRICT)
# For uninj ected callers: use source.namespaces instead (coarser)
# Or: inject all callers before enabling principal-based AuthorizationPolicy`,
      explanation: '`source.principals` matches the SPIFFE identity from the mTLS certificate. If the caller has no sidecar (not injected) or the connection is plaintext, there is no certificate — the principal is empty and the ALLOW rule does not match. Principal-based policies only work after all callers are injected and mTLS is established.',
    },
    {
      title: 'RequestAuthentication rejecting requests with no JWT instead of allowing anonymous',
      wrong: `# RequestAuthentication configured for JWT validation
# Unauthenticated health check from load balancer has no JWT → blocked with 401`,
      right: `# RequestAuthentication rejects INVALID JWTs with 401
# Requests with NO JWT pass RA but may be blocked by AuthorizationPolicy
# Allow anonymous access to health endpoint via AuthorizationPolicy:
spec:
  action: ALLOW
  rules:
  - to:
    - operation:
        paths: ["/health", "/readyz"]
        methods: ["GET"]
  # No "from" restriction = allow from any source (incl. unauthenticated)`,
      explanation: 'RequestAuthentication only rejects requests with an invalid/expired JWT (401). A request with NO JWT is treated as anonymous — it passes RA but is subject to AuthorizationPolicy. Add an explicit ALLOW rule for health check paths without a `from.source.requestPrincipals` requirement.',
    },
    {
      title: 'Using AUDIT mode in production without reviewing the logs',
      wrong: `# Set action: AUDIT thinking it is a safe no-op
# Audit logs fill up with traffic that WOULD be denied
# Team ignores logs, converts to DENY → legitimate traffic blocked`,
      right: `# AUDIT workflow:
# 1. Apply action: AUDIT
# 2. Run for 24h+, review access logs
# 3. Identify unexpected callers from the logs
# 4. Update AuthorizationPolicy to include legitimate callers
# 5. Convert action: DENY or action: ALLOW
# Never skip the log review step`,
      explanation: 'AUDIT mode is a planning tool, not a permanent setting. Its value is in the logs it generates BEFORE you enforce a DENY. Skipping the log review and blindly converting to DENY risks blocking legitimate callers you haven\'t accounted for.',
    },
  ];

  challenge: Challenge = {
    title: 'Implement Zero-Trust Authorization',
    language: 'typescript',
    description: `Design AuthorizationPolicy for a "billing" service with these requirements:
1. DENY all traffic from outside the "production" namespace (regardless of ALLOW policies)
2. ALLOW the "checkout" ServiceAccount (ns: production) to POST to /billing/charge
3. ALLOW the "reporting" ServiceAccount (ns: production) to GET /billing/report/*
4. No other traffic should reach the billing service

Return all three policies joined by "---".`,
    hints: [
      'DENY is evaluated before ALLOW — add the cross-namespace DENY first',
      'Use notNamespaces for the DENY to block everything not from production',
      'Two separate ALLOW rules or one ALLOW with two rules (OR\'d)',
      'source.principals includes the namespace path: cluster.local/ns/production/sa/...',
    ],
    starterCode: `function getBillingPolicies(): string {
  const deny = \`# Cross-namespace DENY\`;
  const allow1 = \`# checkout ALLOW\`;
  const allow2 = \`# reporting ALLOW\`;
  return [deny, allow1, allow2].join('\\n---\\n');
}
console.log(getBillingPolicies());`,
    solution: `function getBillingPolicies(): string {
  const deny = \`apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: billing-deny-external
  namespace: production
spec:
  selector:
    matchLabels:
      app: billing
  action: DENY
  rules:
  - from:
    - source:
        notNamespaces: ["production", "istio-system"]\`;

  const allow = \`apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: billing-allow
  namespace: production
spec:
  selector:
    matchLabels:
      app: billing
  action: ALLOW
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/production/sa/checkout"]
    to:
    - operation:
        methods: ["POST"]
        paths: ["/billing/charge"]
  - from:
    - source:
        principals: ["cluster.local/ns/production/sa/reporting"]
    to:
    - operation:
        methods: ["GET"]
        paths: ["/billing/report/*"]\`;

  return [deny, allow].join('\\n---\\n');
}
console.log(getBillingPolicies());`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In what order does Istio evaluate AuthorizationPolicy actions?',
      options: ['ALLOW → AUDIT → DENY', 'DENY → ALLOW → AUDIT', 'AUDIT → DENY → ALLOW', 'Policies are evaluated in creation order'],
      answer: 1,
      explanation: 'DENY is evaluated first and always wins — if any DENY policy matches the request, it is blocked with 403 regardless of ALLOW policies. Then ALLOW policies are evaluated. AUDIT logs matches without blocking and is applied in parallel with DENY/ALLOW. This ordering ensures explicit denies are never bypassed.',
    },
    {
      q: 'What happens when a workload has ONE AuthorizationPolicy with action: ALLOW, and a request does not match any rule?',
      options: ['The request is allowed by default (allow-all is the fallback)', 'The request is denied with 403', 'The request is forwarded to the next matching policy', 'Istio returns 404 to indicate no policy matched'],
      answer: 1,
      explanation: 'Once any ALLOW AuthorizationPolicy exists for a workload, Istio switches from "allow-all" to "deny unless explicitly allowed". Any request that does NOT match at least one ALLOW rule is denied with 403. This is why adding the first ALLOW policy is a breaking change if it doesn\'t include all legitimate callers.',
    },
    {
      q: 'What does `source.principals: ["cluster.local/ns/prod/sa/frontend"]` match?',
      options: ['Any pod with the label app=frontend in the prod namespace', 'The Kubernetes ServiceAccount named "frontend" in namespace "prod" — verified via mTLS SPIFFE identity', 'Any pod in the production namespace with frontend in its name', 'The ingress gateway service account named frontend'],
      answer: 1,
      explanation: 'source.principals matches the SPIFFE URI embedded in the caller\'s mTLS certificate: `spiffe://cluster.local/ns/prod/sa/frontend`. This maps to pods running with the `frontend` Kubernetes ServiceAccount in the `prod` namespace. This is cryptographic identity verification — not just label matching.',
    },
    {
      q: 'What does RequestAuthentication do when a request has an INVALID JWT?',
      options: ['Forwards the request to the upstream and lets the app handle it', 'Returns 401 Unauthorized immediately — the request never reaches the app', 'Strips the JWT and forwards the request as anonymous', 'Triggers the AuthorizationPolicy DENY action'],
      answer: 1,
      explanation: 'RequestAuthentication validates JWT signatures and claims (expiry, issuer, audience). An invalid JWT (bad signature, expired, wrong issuer) causes Envoy to return 401 immediately without forwarding to the upstream. A missing JWT is NOT rejected by RA — it passes through as an anonymous request subject to AuthorizationPolicy.',
    },
    {
      q: 'Why does `source.principals` matching fail for uninj ected (no sidecar) callers?',
      options: ['Uninj ected pods use a different SPIFFE trust domain', 'Uninj ected pods have no mTLS certificate — their principal is empty and cannot match', 'AuthorizationPolicy only applies to injected workloads as destinations', 'Kubernetes ServiceAccounts are only visible to Envoy proxies'],
      answer: 1,
      explanation: 'SPIFFE principals come from the x.509 certificate in the mTLS handshake. Uninj ected pods have no Envoy sidecar and send plaintext — there is no certificate, so their principal is empty (or anonymous). `source.principals` rules cannot match an empty principal, so the request is denied. Inject all callers before enabling principal-based authorization.',
    },
    {
      q: 'What is the purpose of `action: AUDIT` in AuthorizationPolicy?',
      options: ['Blocks matching requests and logs the denial reason', 'Logs matching requests without blocking — used to preview the effect of a future DENY policy', 'Audits the AuthorizationPolicy configuration for errors', 'Requires Kiali to be installed to process audit results'],
      answer: 1,
      explanation: '`action: AUDIT` logs matching requests to the access log without blocking them. This lets you preview what traffic WOULD be blocked if you converted it to a DENY policy. Review the logs over 24+ hours to identify all callers that match the rule, then decide whether to allow or deny them before enforcing.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do AuthorizationPolicy and PeerAuthentication work together?',
      a: 'They operate at different layers: <ul><li><strong>PeerAuthentication</strong> (layer 4/TLS): controls whether mTLS is required for the TCP connection. It is the "can you prove your identity?" check — STRICT requires a valid SPIFFE cert; PERMISSIVE accepts both.</li><li><strong>AuthorizationPolicy</strong> (layer 7/HTTP): controls what authenticated identities are allowed to do — which ServiceAccounts can call which paths with which methods.</li></ul>Typical flow: PeerAuthentication STRICT ensures the connection has a valid mTLS cert (identity established) → AuthorizationPolicy checks if THAT identity is allowed to perform THAT operation (access control). PeerAuthentication happens first; AuthorizationPolicy is evaluated after TLS is established.',
    },
    {
      q: 'Can AuthorizationPolicy check custom request headers?',
      a: 'Yes, using the <code>when</code> condition with the <code>request.headers</code> key: <pre><code>when:\n- key: request.headers[x-custom-role]\n  values: ["ops", "admin"]</code></pre>This matches requests where the <code>x-custom-role</code> header is "ops" or "admin". Combined with <code>source.principals</code> (AND semantics within a rule), you can create fine-grained policies: "only the api-service ServiceAccount, AND only when the request has x-custom-role: admin, can access /admin/*". <br>Note: headers can be spoofed by clients — for trusted claims use JWT (`request.auth.claims[role]`) which is cryptographically signed.',
    },
    {
      q: 'How do you allow health checks from Kubernetes but block all other external traffic?',
      a: 'Kubernetes kubelet probes bypass Envoy sidecar mTLS, but AuthorizationPolicy is also enforced by Envoy — so probe paths need to be explicitly allowed if you have a restrictive ALLOW policy: <ol><li>Add a rule for the health check path with no <code>from</code> restriction (allows any source)</li><li>Use <code>to.paths: ["/health", "/readyz", "/livez"]</code></li><li>Keep other rules restrictive by principal/namespace</li></ol>Example: <pre><code>rules:\n- to:\n  - operation:\n      paths: ["/health"]\n      methods: ["GET"]\n# No "from" = allow any source (including kubelet)</code></pre>',
    },
    {
      q: 'What is the difference between source.namespaces and source.principals for access control?',
      a: '<strong>source.namespaces</strong>: matches the namespace of the calling pod, determined from the SPIFFE URI in the mTLS certificate. Coarser-grained — allows any service in that namespace to call. Lower effort to maintain but less precise (any compromised service in the namespace gets access). <br><br><strong>source.principals</strong>: matches the exact SPIFFE URI including the ServiceAccount name. Fine-grained — grants access only to specific services. More secure but requires more maintenance as services are added/renamed. <br><br><strong>Recommendation</strong>: use <code>source.principals</code> for sensitive services (payment, auth, user data). Use <code>source.namespaces</code> for lower-sensitivity services or as a first step before tightening to principal-level.',
    },
    {
      q: 'How can you implement a global default-deny policy across the entire mesh?',
      a: 'Create a mesh-wide ALLOW policy in the <code>istio-system</code> namespace with no selector and empty rules — this results in default-deny for all workloads: <pre><code>apiVersion: security.istio.io/v1beta1\nkind: AuthorizationPolicy\nmetadata:\n  name: deny-all\n  namespace: istio-system\nspec: {}  # No selector, no action, no rules = mesh-wide deny</code></pre>After this, each service needs its own explicit ALLOW policy. This is the strictest zero-trust posture — start here only in new clusters or when you have full visibility into all traffic patterns. In existing clusters, use AUDIT mode first to discover what needs to be explicitly allowed.',
    },
  { q: 'How do you debug authorization policy rejections in Istio?', a: 'Enable access logging on the sidecar to see denied requests: add the EnvoyFilter or set accessLogFile in the mesh config. Check the Envoy admin interface at port 15000 on the pod for the effective filter chain. Use istioctl analyze to check for misconfigured policies. The Authorization log level can be raised on a specific pod with istioctl proxy-config log pod/name --level rbac:debug. Kiali visualizes authorization policies and shows which traffic is allowed or denied between services in the service graph.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'AuthorizationPolicy is Istio\'s L7 firewall: DENY evaluated first, then ALLOW. Adding the first ALLOW switches the workload to deny-by-default. Source principals require mTLS (SPIFFE identity). RequestAuthentication validates JWTs; AP enforces claims.',
    mustKnow: [
      'Evaluation order: DENY wins, then ALLOW, then default (allow-all if no ALLOW policy exists)',
      'First ALLOW policy makes the workload deny-all for unmatched traffic — add ALL callers at once',
      'source.principals = SPIFFE URI = requires mTLS (injected pods only)',
      'source.namespaces = coarser grain; source.principals = exact ServiceAccount',
      'RequestAuthentication: invalid JWT → 401; no JWT → anonymous (passes RA, AP decides)',
      'AUDIT mode: logs without blocking — use before DENY to discover all callers',
      'AuthorizationPolicy is server-side (destination Envoy enforces it)',
    ],
    interviewFocus: [
      'DENY vs ALLOW evaluation order and why DENY always wins',
      'What happens when the first ALLOW policy is added to a workload?',
      'Why source.principals fails for uninj ected callers',
      'RequestAuthentication: invalid JWT vs missing JWT behaviour',
      'How to implement global default-deny for the entire mesh',
    ],
  };
}
