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
  selector: 'app-mesh-mtls',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './mtls.html',
  styleUrl: './mtls.scss',
})
export class MeshMtls {
  quickRef: QuickRefItem[] = [
    { name: 'PeerAuthentication', type: 'syntax', desc: 'Controls mTLS mode for inbound connections to a workload: PERMISSIVE, STRICT, or DISABLE.' },
    { name: 'PERMISSIVE', type: 'keyword', desc: 'Accepts both plaintext and mTLS — used during migration. Default mode.' },
    { name: 'STRICT', type: 'keyword', desc: 'Requires mTLS for all inbound connections. Rejects plaintext — zero-trust enforcement.' },
    { name: 'SPIFFE', type: 'keyword', desc: 'Secure Production Identity Framework for Everyone — the identity standard Istio uses for workload certificates.' },
    { name: 'SVID', type: 'keyword', desc: 'SPIFFE Verifiable Identity Document — an x.509 certificate embedding a SPIFFE URI (spiffe://cluster/ns/pod/sa/name).' },
    { name: 'DestinationRule TLS', type: 'syntax', desc: 'Outbound TLS mode on DestinationRule: ISTIO_MUTUAL (use Istio certs), SIMPLE, MUTUAL, or DISABLE.' },
    { name: 'cacerts', type: 'keyword', desc: 'Kubernetes Secret in istio-system holding the root CA certificate used to sign all SVID certificates.' },
    { name: 'istioctl authn tls-check', type: 'keyword', desc: 'Verifies that mTLS is correctly configured and active between two workloads.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'How Istio mTLS Works',
      points: [
        'Mutual TLS (mTLS) authenticates both client AND server using x.509 certificates. Unlike regular TLS (HTTPS), the client also presents a certificate — proving its identity to the server.',
        'Istio automates mTLS: the identity service (part of Istiod) acts as a Certificate Authority (CA). Each injected pod\'s Envoy proxy automatically obtains a SPIFFE SVID certificate scoped to its Kubernetes ServiceAccount.',
        'Certificate lifecycle: when a pod starts, its Envoy sends a Certificate Signing Request (CSR) to Istiod. Istiod validates the pod\'s ServiceAccount JWT (via the Kubernetes Token Review API) and issues a short-lived x.509 certificate. The cert is renewed before expiry — typically every 24 hours.',
        'The SPIFFE URI embedded in each certificate identifies the workload: `spiffe://<trust-domain>/ns/<namespace>/sa/<serviceaccount>`. AuthorizationPolicy and PeerAuthentication rules can match on this identity.',
        'mTLS is transparent to the application: Envoy handles TLS termination on both sides. The app sends and receives plaintext on localhost; Envoy encrypts/decrypts for the network. Applications need zero TLS code changes.',
        'Traffic path: app → loopback → Envoy (encrypts) → encrypted network → Envoy (decrypts) → loopback → destination app. Both Envoys authenticate each other\'s certificates against the shared CA root.',
      ],
    },
    {
      heading: 'PeerAuthentication Modes',
      points: [
        'PeerAuthentication is a policy resource that controls the mTLS mode for INBOUND connections to a workload (or all workloads in a namespace/mesh).',
        'PERMISSIVE: accepts both mTLS and plaintext connections. This is the default — allows gradual migration. Metrics show which connections are using mTLS (`istioctl viz edges` or Kiali).',
        'STRICT: rejects any plaintext inbound connection with a TLS error. Use this after all clients in the mesh are injected and verified to be sending mTLS. The golden security posture for zero-trust.',
        'DISABLE: turns off mTLS for inbound connections. Use only for specific legacy workloads that cannot handle TLS at the Envoy layer (rare).',
        'PeerAuthentication scope: namespace-level policy applies to all workloads in the namespace. Workload-level policy (using `selector`) overrides the namespace policy for matched pods. Mesh-wide default: create in `istio-system` namespace with no selector.',
        'Safe migration path: start PERMISSIVE → inject all namespaces → verify via Kiali/edges → flip to STRICT. Never flip to STRICT before all clients are injected — it breaks communication from uninj ected workloads.',
      ],
    },
    {
      heading: 'DestinationRule TLS and ISTIO_MUTUAL',
      points: [
        'PeerAuthentication controls INBOUND (server side). DestinationRule TLS mode controls OUTBOUND (client side) — what TLS the client Envoy presents when sending traffic to a destination.',
        'ISTIO_MUTUAL: Envoy uses the automatically provisioned SPIFFE certificate to authenticate to the destination. This is the correct mode when both client and server are in the mesh.',
        'SIMPLE: one-way TLS — Envoy verifies the server\'s cert but does not present a client cert. Use for TLS to external services (e.g., an external API over HTTPS).',
        'MUTUAL: mTLS with explicitly provided client certificates (not Istio-managed). Use for external services that require client cert authentication with your own CA.',
        'DISABLE: no TLS on the outbound connection. Use when the downstream handles TLS independently or for localhost calls.',
        'Auto mTLS: Istio 1.5+ automatically detects if the destination has a sidecar and switches to ISTIO_MUTUAL without requiring a DestinationRule. You only need an explicit DestinationRule when overriding the auto-detected mode.',
      ],
    },
    {
      heading: 'Certificate Management in Production',
      points: [
        'Istio\'s default CA (Istiod acting as CA) is a self-signed root. For production, plug in your own CA: external CA integration via cert-manager, AWS Private CA, HashiCorp Vault PKI, or Google Certificate Authority Service.',
        'cert-manager integration: cert-manager manages the Istio CA certificate (the one Istiod uses to sign SVIDs). It automatically renews the CA cert before expiry using Kubernetes Certificate resources.',
        'Multi-root trust: when using multi-cluster meshes, each cluster may have its own intermediate CA under a shared root. Pods in cluster A trust cluster B\'s certs because they share the root CA.',
        'Certificate rotation is automatic at the proxy level — Envoy requests renewal before the cert expires. The default cert TTL is 24 hours; the renewal threshold is 80% of TTL (i.e., renewal happens at 19.2 hours).',
        'Emergency cert rotation: `kubectl -n istio-system delete secret cacerts` triggers Istiod to generate a new self-signed CA (the same secret name used for a plugged-in custom CA, per the cert-manager example above — modern Istio unified what used to be two separate secret names into one). All proxy certs are invalid until the new CA is distributed — causes brief disruption. Do this in planned maintenance windows only.',
        'Monitor cert expiry: `istioctl proxy-config secret <pod>` shows the current certificate and its expiry time. Alert on certs expiring within 24 hours.',
      ],
    },
    {
      heading: 'Debugging mTLS Issues',
      points: [
        '`istioctl authn tls-check <pod> <service>` — shows the effective mTLS policy between a specific client pod and destination service. Diagnoses "should be mTLS but isn\'t" and "blocked by STRICT mode" issues.',
        '`istioctl proxy-config secret <pod>` — shows the SPIFFE certificate currently loaded in the proxy: subject, issuer, and expiry date.',
        '`istioctl viz edges -n <ns>` — shows per-connection security status (mTLS vs plaintext). Essential for verifying that all connections in a namespace are encrypted before enforcing STRICT.',
        'Common symptom: 503 errors after enabling STRICT mode. Cause: at least one client is still sending plaintext (not yet injected). Fix: identify uninj ected clients with `kubectl get pods -n <ns>` (look for `1/1 READY`), inject the namespace, restart pods.',
        '`kubectl exec <pod> -c istio-proxy -- curl -s localhost:15000/certs` — directly queries Envoy\'s admin API for the active certificates. Lower-level but more complete than istioctl.',
        'X-Forwarded-Client-Cert header: Envoy adds this header to requests, containing the SPIFFE URI of the client. Applications can read this header to determine which service is calling them — useful for logging and debugging without AuthorizationPolicy.',
      ],
    },
    {
      heading: 'mTLS and Non-Mesh Clients',
      points: [
        'When an uninj ected pod (no Envoy sidecar) calls a service with STRICT PeerAuthentication, the call fails with a TLS handshake error because the plaintext client cannot satisfy the mTLS requirement.',
        'PERMISSIVE mode is the solution for mixed environments: injected clients use mTLS, uninj ected clients use plaintext. Both work simultaneously — useful during migration.',
        'External clients (outside the cluster): they cannot use Istio-managed mTLS certs. Use SIMPLE TLS (one-way) for the Gateway, or use mutual TLS with external certs loaded via a Secret on the Gateway.',
        'External services calling INTO the mesh: terminate mTLS at the istio-ingressgateway. The gateway handles TLS with external clients; internal mesh traffic uses Istio mTLS.',
        'Kubernetes Jobs and CronJobs: ensure they are injected if they call STRICT services. Job pods are often overlooked in injection enablement and break after STRICT is enforced.',
        'Health check probes: the sidecar injector REWRITES each HTTP/gRPC probe in the pod spec to target the istio-agent\'s own status port instead of the app\'s real port — this is what actually keeps probes out of Envoy\'s mTLS-enforcing inbound listener, not merely "coming from the kubelet."',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'PeerAuthentication',
      language: 'bash',
      code: `# Namespace-wide STRICT mTLS (all workloads in "production")
cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT
EOF

# Workload-level override (exempt a specific legacy pod)
cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: legacy-db-agent
  namespace: production
spec:
  selector:
    matchLabels:
      app: legacy-db-agent
  mtls:
    mode: PERMISSIVE   # This pod can receive plaintext
EOF`,
    },
    {
      label: 'Verify mTLS',
      language: 'bash',
      code: `# Check effective mTLS policy between pods
istioctl authn tls-check deploy/api.production deploy/payment.production

# Output:
# HOST:PORT                              STATUS    SERVER     CLIENT    AUTHN POLICY
# payment.production:8080                OK        STRICT     mTLS      /default

# Check certificates in a proxy
istioctl proxy-config secret deploy/api -n production

# Output shows:
# NAME       TYPE    STATUS   VALID CERT  SERIAL NUMBER  NOT AFTER
# default    Cert    OK       true        <hex>          2024-12-15T...

# Check which connections are mTLS vs plaintext
istioctl viz edges deploy -n production

# Check a pod is 2/2 (sidecar present)
kubectl get pods -n production | awk '{print $1, $2}' | grep -v "2/2"`,
    },
    {
      label: 'Custom CA via cert-manager',
      language: 'bash',
      code: `# Use cert-manager to manage the Istio CA certificate
# 1. Create a self-signed ClusterIssuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: selfsigned-root
spec:
  selfSigned: {}
---
# 2. Create the Istio CA certificate
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: cacerts
  namespace: istio-system
spec:
  isCA: true
  duration: 87600h        # 10 years for root CA
  renewBefore: 720h       # Renew 30 days before expiry
  secretName: cacerts     # Istio reads this secret name
  commonName: istio-ca
  subject:
    organizations:
    - "My Org"
  privateKey:
    algorithm: ECDSA
    size: 256
  issuerRef:
    name: selfsigned-root
    kind: ClusterIssuer
EOF

# Restart Istiod to pick up the new CA
kubectl rollout restart deploy/istiod -n istio-system`,
    },
    {
      label: 'TLS to External Service',
      language: 'bash',
      code: `# Route HTTPS to an external API with server-side TLS verification
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: external-api
spec:
  hosts:
  - api.stripe.com
  ports:
  - number: 443
    name: https
    protocol: HTTPS
  location: MESH_EXTERNAL
  resolution: DNS
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: external-api-tls
spec:
  host: api.stripe.com
  trafficPolicy:
    tls:
      mode: SIMPLE          # One-way TLS (verify server cert)
      sni: api.stripe.com   # Set SNI for virtual hosting
EOF`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Enabling STRICT mode before all clients are injected',
      wrong: `# Flip namespace to STRICT mTLS
kubectl apply -f strict-peer-auth.yaml
# Un-injected monitoring agent starts receiving TLS errors → 503 → alerts fire`,
      right: `# Safe migration path:
# 1. Enable PERMISSIVE (default)
# 2. Inject all namespaces: kubectl label ns <name> istio-injection=enabled
# 3. Restart all pods
# 4. Verify: istioctl viz edges shows all mTLS
# 5. ONLY THEN enable STRICT`,
      explanation: 'Enabling STRICT mTLS requires ALL clients reaching that service to have Envoy sidecars. Any uninj ected client (monitoring agents, legacy jobs, external callers not going through the Gateway) will receive TLS errors. Always verify with `istioctl viz edges` before enforcing STRICT.',
    },
    {
      title: 'Forgetting that Kubernetes health probes bypass mTLS',
      wrong: `# Developer adds STRICT PeerAuthentication expecting probes to fail
# Probes still work — this isn't a bug but causes confusion
# Developers assume STRICT mode isn't working because probes pass`,
      right: `# Kubernetes kubelet probes bypass Envoy's mTLS enforcement
# This is intentional: Istio automatically exempts probe paths
# Verify actual traffic mTLS with: istioctl viz edges
# Probes passing with STRICT ≠ plaintext traffic being allowed`,
      explanation: 'Kubernetes liveness and readiness probes come from the kubelet, not through the Envoy proxy. Istio automatically allows these probes even in STRICT mode — otherwise all pods would fail health checks. This is by design and should not be confused with a STRICT mode misconfiguration.',
    },
    {
      title: 'Mixing STRICT PeerAuthentication with DISABLE on DestinationRule',
      wrong: `# Server: PeerAuthentication STRICT (requires mTLS)
# Client DestinationRule: tls.mode DISABLE (sends plaintext)
# Result: connection refused — TLS handshake failure`,
      right: `# Server STRICT → client must use ISTIO_MUTUAL
# Let Auto mTLS handle it (remove the DestinationRule tls override)
# OR explicitly set: trafficPolicy.tls.mode: ISTIO_MUTUAL`,
      explanation: 'PeerAuthentication STRICT means the server requires mTLS. If the client\'s DestinationRule has `tls.mode: DISABLE`, the client sends plaintext — causing a TLS handshake failure. With Auto mTLS, Istio detects the server is mesh-injected and automatically uses ISTIO_MUTUAL. Only override DestinationRule TLS mode when you have a specific reason.',
    },
    {
      title: 'Using port-level PeerAuthentication without understanding precedence',
      wrong: `# Port-level override on port 8080 to DISABLE
spec:
  mtls:
    mode: STRICT
  portLevelMtls:
    8080:
      mode: DISABLE
# Now health checks on port 8080 DON'T pass through mTLS
# But STRICT is still enforced on all OTHER ports`,
      right: `# Port-level mTLS is for specific legacy protocols on specific ports
# Example: gRPC on 9090 needs STRICT, legacy HTTP on 8080 needs PERMISSIVE
# Use sparingly — document WHY a port needs a different mode`,
      explanation: 'Port-level PeerAuthentication overrides the workload-level mode for that specific port. This is powerful but creates subtle security gaps if misunderstood. DISABLE on a port means plaintext is accepted there even if the workload is otherwise STRICT. Use port-level overrides only when necessary and document the reason.',
    },
    {
      title: 'Not monitoring certificate expiry',
      wrong: `# Istio CA cert expires after the default TTL
# All proxy certificate renewals start failing
# Services lose mTLS → TLS handshake errors across the cluster`,
      right: `# Alert on expiring certs
istioctl proxy-config secret -n production deploy/api \\
  | grep "VALID CERT" | awk '{print $NF}'
# Prometheus metric: citadel_server_csr_count
# Alert: < 7 days to expiry on the CA cert`,
      explanation: 'If the Istio CA certificate expires, Istiod cannot sign new proxy certificates. As proxy certs reach their TTL and fail renewal, services lose mTLS and connections fail. Monitor the CA cert expiry and proxy cert renewal success rate in Prometheus. Use cert-manager for automated CA cert rotation.',
    },
  ];

  challenge: Challenge = {
    title: 'Design a Safe mTLS Migration',
    language: 'typescript',
    description: `You are migrating the "payments" namespace from PERMISSIVE to STRICT mTLS.

The namespace has:
- 5 microservices (all injected)
- 1 legacy monitoring agent (NOT injected, uses plaintext)
- External health checker pinging /health on port 8080

Write:
1. A namespace-level STRICT PeerAuthentication
2. A workload-level PERMISSIVE override for the monitoring agent (label: app=legacy-monitor)

Return both YAML resources joined by "---".`,
    hints: [
      'PeerAuthentication in namespace "payments" with no selector = namespace-wide',
      'Workload-level policy uses spec.selector.matchLabels',
      'Kubernetes health probes are automatically exempted from mTLS - no special config needed',
      'PERMISSIVE on the monitoring agent allows plaintext from that specific pod',
    ],
    starterCode: `function getMtlsConfig(): string {
  const namespacePa = \`# Namespace STRICT policy\`;
  const workloadPa = \`# Workload PERMISSIVE override\`;
  return namespacePa + '\\n---\\n' + workloadPa;
}
console.log(getMtlsConfig());`,
    solution: `function getMtlsConfig(): string {
  const namespacePa = \`apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: payments
spec:
  mtls:
    mode: STRICT\`;

  const workloadPa = \`apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: legacy-monitor-permissive
  namespace: payments
spec:
  selector:
    matchLabels:
      app: legacy-monitor
  mtls:
    mode: PERMISSIVE\`;

  return namespacePa + '\\n---\\n' + workloadPa;
}
console.log(getMtlsConfig());`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What identity standard does Istio use for mTLS certificates?',
      options: ['X.509 with Common Name (CN) for service identity', 'SPIFFE SVID — x.509 certificates with a SPIFFE URI in the SAN field', 'JWT tokens passed as TLS client certificates', 'Kubernetes ServiceAccount tokens embedded in certificates'],
      answer: 1,
      explanation: 'Istio uses SPIFFE (Secure Production Identity Framework for Everyone). Each workload gets a SPIFFE Verifiable Identity Document (SVID) — an x.509 certificate with a SPIFFE URI (spiffe://cluster.local/ns/<namespace>/sa/<serviceaccount>) in the Subject Alternative Name field. This URI is the workload\'s identity for AuthorizationPolicy and PeerAuthentication.',
    },
    {
      q: 'What does PeerAuthentication PERMISSIVE mode do?',
      options: ['Requires mTLS from all clients but ignores certificate errors', 'Accepts both mTLS and plaintext connections — used during migration', 'Allows plaintext only, disabling TLS for the workload', 'Permits unauthenticated access from outside the cluster'],
      answer: 1,
      explanation: 'PERMISSIVE accepts both mTLS (from injected mesh clients) and plaintext (from uninj ected legacy clients). This enables gradual migration: inject and verify all namespaces in PERMISSIVE, then switch to STRICT after confirming all connections use mTLS via `istioctl viz edges`.',
    },
    {
      q: 'Which command verifies the effective mTLS mode between two workloads?',
      options: ['kubectl describe peerauthentication', 'istioctl authn tls-check', 'istioctl proxy-config listener', 'kubectl get secrets -n istio-system'],
      answer: 1,
      explanation: '`istioctl authn tls-check <source-pod> <destination-service>` shows the effective TLS policy between two endpoints, including whether both sides agree on mTLS vs plaintext. It is the fastest way to diagnose "should be mTLS but isn\'t" and "STRICT broke traffic" issues.',
    },
    {
      q: 'Why do Kubernetes liveness probes work even with STRICT PeerAuthentication?',
      options: ['Probes are routed through the Envoy sidecar which handles mTLS automatically', 'Istio automatically exempts kubelet probe traffic from mTLS enforcement', 'Liveness probes use a separate mTLS certificate issued by Kubernetes', 'STRICT mode only applies to east-west mesh traffic, not probes'],
      answer: 1,
      explanation: 'The sidecar injector rewrites each HTTP/gRPC probe in the pod spec to target the istio-agent\'s own status port instead of the app\'s real port — that rewritten port is what actually keeps probe traffic out of Envoy\'s mTLS-enforcing inbound listener (without the rewrite, iptables would redirect probe traffic to Envoy just like any other inbound request, and it would fail STRICT mTLS). Istio does this automatically — otherwise all pods would fail health checks immediately after enabling STRICT mode.',
    },
    {
      q: 'What is Auto mTLS in Istio and what problem does it solve?',
      options: ['Automatically rotates mTLS certificates on a schedule', 'Detects whether the destination has a sidecar and automatically uses ISTIO_MUTUAL when it does', 'Automatically enables STRICT mode after 24 hours of PERMISSIVE operation', 'Creates DestinationRule resources automatically for all Kubernetes Services'],
      answer: 1,
      explanation: 'Auto mTLS (enabled by default since Istio 1.5) eliminates the need to manually create DestinationRule resources for outbound TLS. Istiod tracks which services have sidecars and pushes this info to client Envoys. Client Envoys automatically use ISTIO_MUTUAL when the destination is meshed, and plaintext when it is not. You only need an explicit DestinationRule to override this behaviour.',
    },
    {
      q: 'What is the correct migration order for enabling STRICT mTLS in a namespace?',
      options: ['Enable STRICT, then inject all workloads, then restart pods', 'Enable PERMISSIVE, inject all workloads, restart pods, verify all connections are mTLS, THEN enable STRICT', 'Set STRICT at the mesh level first, then migrate namespaces', 'Inject one pod at a time while STRICT is active to limit the blast radius'],
      answer: 1,
      explanation: 'The safe order is PERMISSIVE first → inject all workloads → restart pods → verify with `istioctl viz edges` or Kiali (all connections should show as mTLS) → then switch to STRICT. Enabling STRICT before all clients are injected breaks connectivity from uninj ected clients immediately.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does Istio\'s identity system differ from using Kubernetes Secrets for service-to-service auth?',
      a: 'Kubernetes Secrets for service-to-service auth typically use static API keys or tokens stored in Secrets — long-lived, manually rotated, not tied to the pod\'s runtime identity. <strong>Istio SPIFFE SVIDs</strong> are: <ul><li><strong>Short-lived</strong>: 24h TTL, auto-renewed — no static credentials that can be exfiltrated and reused</li><li><strong>Identity-bound</strong>: tied to the pod\'s Kubernetes ServiceAccount — the cert expires when the pod stops</li><li><strong>Automatic</strong>: no secret management, no manual rotation, no credential distribution</li><li><strong>Mutual</strong>: both client and server prove identity — unlike API keys where only the caller authenticates</li></ul>SPIFFE SVIDs give you cryptographic proof of identity with zero manual credential management.',
    },
    {
      q: 'What happens to in-flight connections when PeerAuthentication is changed from PERMISSIVE to STRICT?',
      a: 'Existing established TLS connections are NOT affected immediately — they continue until they close normally. New connection attempts from uninj ected clients (plaintext) will be rejected. This means: <ul><li>Long-lived persistent connections (gRPC streams, WebSockets) from uninj ected clients continue for their lifetime</li><li>New short-lived HTTP connections from uninj ected clients fail immediately</li><li>There is no "drain" period for plaintext connections — plan for a brief disruption from uninj ected clients</li></ul>Best practice: have no uninj ected clients before switching to STRICT, so the policy change has no observable impact.',
    },
    {
      q: 'How do you integrate an external Certificate Authority with Istio?',
      a: 'Replace the Istio self-signed CA with your own: <ol><li><strong>cert-manager + private CA</strong>: create a cert-manager Certificate resource targeting the <code>cacerts</code> Secret in istio-system. cert-manager signs it with your root CA and handles rotation.</li><li><strong>AWS Private CA</strong>: use the aws-privateca-issuer cert-manager plugin to sign the Istio CA cert via AWS ACM PCA.</li><li><strong>HashiCorp Vault PKI</strong>: use the vault-issuer cert-manager plugin, or configure Istiod directly with Vault integration via <code>EXTERNAL_CA</code> and <code>CA_PROVIDER</code> env vars.</li></ol>All approaches provide the same <code>cacerts</code> Secret containing <code>ca-cert.pem</code>, <code>ca-key.pem</code>, <code>root-cert.pem</code>, and <code>cert-chain.pem</code>. Istiod reads this Secret at startup.',
    },
    {
      q: 'Can services outside the cluster use Istio mTLS to communicate with mesh services?',
      a: 'External clients cannot use Istio-managed mTLS certificates (they have no access to Istiod). Options: <ul><li><strong>Gateway with SIMPLE TLS</strong>: external clients use standard HTTPS, the Gateway terminates TLS, and forwards plaintext (or Istio-mTLS) to internal services</li><li><strong>Gateway with mutual TLS</strong>: load the external client\'s cert and CA into the Gateway via a Kubernetes Secret. The external client presents its cert; the Gateway validates it. This is mutual TLS with external certs, not Istio SPIFFE certs.</li><li><strong>VPN/Wireguard + mesh injection</strong>: for machine clients (e.g., CI/CD agents), run them in a node with Istio injection and connect them to the cluster network — they become first-class mesh citizens with SPIFFE identities.</li></ul>',
    },
    {
      q: 'What is the X-Forwarded-Client-Cert header and how is it useful?',
      a: 'When Envoy terminates mTLS on behalf of a destination service, it adds the <code>X-Forwarded-Client-Cert</code> (XFCC) header to the request forwarded to the app. This header contains the client\'s SPIFFE URI (<code>By=spiffe://...;Hash=...;URI=spiffe://cluster.local/ns/prod/sa/api</code>). Applications can read this header to: <ul><li>Log which service made a request (audit trail without modifying the calling service)</li><li>Implement application-level service identity checks as a secondary authorization layer</li><li>Debug "who called me?" without deploying additional tooling</li></ul>Note: XFCC is controlled by Istio\'s <code>meshConfig.h2UpgradePolicy</code> and can be stripped or forwarded per route.',
    },
  { q: 'How does Istio rotate mTLS certificates automatically?', a: 'Istio uses a built-in certificate authority called istiod (or an external CA like HashiCorp Vault or cert-manager). When a sidecar proxy starts, it generates a private key and sends a certificate signing request to istiod via the Secret Discovery Service (SDS). istiod signs the certificate using the mesh root CA and returns it. Certificates have a short default lifetime of 24 hours and are rotated automatically before expiry without any pod restart. The Envoy SDS API allows hot-reloading of certificates. To use an external CA, configure the meshConfig.ca settings and provide the CA endpoint and credentials.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Istio mTLS uses SPIFFE SVIDs (x.509 with SPIFFE URI) issued by Istiod CA. PeerAuthentication controls inbound mode (PERMISSIVE/STRICT). Auto mTLS handles outbound. Migration: PERMISSIVE → inject all → verify edges → STRICT.',
    mustKnow: [
      'SPIFFE SVID: x.509 with spiffe://cluster/ns/<ns>/sa/<sa> URI — bound to Kubernetes ServiceAccount',
      'PeerAuthentication: PERMISSIVE (mTLS + plaintext), STRICT (mTLS only), DISABLE',
      'Auto mTLS: Istio auto-selects ISTIO_MUTUAL when destination is injected — no DestinationRule needed',
      'Cert lifecycle: Istiod CA → CSR from Envoy → 24h SVID → auto-renewed at 80% TTL',
      'Safe migration: PERMISSIVE → inject → restart → verify edges → STRICT',
      'istioctl authn tls-check: verifies effective mTLS between two workloads',
      'Kubelet probes are automatically exempted from STRICT mTLS enforcement',
    ],
    interviewFocus: [
      'How Istio mTLS works end-to-end (CSR, Istiod CA, SVID, Envoy termination)',
      'PERMISSIVE vs STRICT — migration order and verification',
      'Why SPIFFE SVIDs are better than static API keys for service auth',
      'What Auto mTLS does and when you need an explicit DestinationRule TLS mode',
      'How to debug broken mTLS (authn tls-check, proxy-config secret, viz edges)',
    ],
  };
}
