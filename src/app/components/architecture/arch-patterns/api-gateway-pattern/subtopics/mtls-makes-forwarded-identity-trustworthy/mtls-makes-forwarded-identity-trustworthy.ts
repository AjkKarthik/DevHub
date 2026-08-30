import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './mtls-makes-forwarded-identity-trustworthy.html',
  styleUrl: './mtls-makes-forwarded-identity-trustworthy.scss'
})
export class MtlsMakesForwardedIdentityTrustworthySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The page names the risk and the fix but not the mechanism',
      points: [
        'The QnA\'s gateway-auth answer says: "if a service is reachable without going through the gateway, it trusts the header with no authentication, requiring network policy enforcement." That names the risk (a bypassed gateway lets anyone forge X-User-Id) and gestures at a fix ("network policy enforcement") without explaining what actually enforces it.',
        'The underlying problem: <code>X-User-Id</code> is JUST an HTTP header — any client that can reach a service directly (bypassing the gateway) can set that header to whatever value it wants, impersonating any user, unless something PREVENTS direct, unauthenticated access to the service in the first place.',
        'Mutual TLS (mTLS) is the concrete mechanism that closes this gap: instead of relying on network topology alone (firewall rules, being "inside the cluster"), mTLS requires BOTH sides of a connection to present a valid certificate proving their identity — a service can require that only connections presenting the gateway\'s own certificate are accepted, rejecting a call from anything else regardless of network position.',
      ]
    },
    {
      heading: 'How this connects to the Sidecar & Service Mesh topic elsewhere in this hub',
      points: [
        'This page\'s own "Gateway Pitfalls" doesn\'t mention service mesh at all — but the Sidecar & Service Mesh topic elsewhere in this same hub explains that a service mesh\'s sidecar proxies can enforce mTLS automatically for every service-to-service connection, without each service implementing certificate handling itself.',
        'In a mesh-enforced setup, a service literally CANNOT be called by anything that doesn\'t present a valid mesh-issued certificate — this is what actually makes "trust the X-User-Id header without re-validating" a safe design choice, rather than a hopeful assumption resting on network configuration alone.',
        'Without mTLS (or an equivalent enforced mechanism), "network policy enforcement" usually means firewall/security-group rules restricting which hosts can reach a service — workable, but more fragile than cryptographic identity verification, since a misconfigured rule or a compromised host already inside the network perimeter can silently defeat it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Without mTLS: the header is just a claim, unenforced',
      language: 'typescript',
      code: `// A downstream service trusting the gateway's forwarded header --
// this is EXACTLY the pattern this page's own mistakes block recommends
// (extract claims at the gateway, forward as a trusted header):
app.get('/api/orders', (req, res) => {
  const userId = req.headers['x-user-id'] as string;   // trusted, no re-check
  return res.json(orderRepo.findByUser(userId));
});

// The gap: WITHOUT something enforcing that this request could only have
// come from the real gateway, a direct call bypassing it works identically:
//
//   curl http://order-service:8080/api/orders \\
//     -H "x-user-id: any-victim-user-id-at-all"
//
// The service has no way to tell this apart from a legitimate,
// gateway-validated request -- the header alone proves nothing.

// mTLS closes this: the service's own TLS config requires the CALLING
// connection to present a certificate signed by the internal CA and
// scoped to the gateway's own service identity -- a direct curl from
// outside that identity is rejected at the TLS handshake, before the
// request handler (and its trusting header read) ever runs.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team implements the gateway-forwards-X-User-Id pattern exactly as this page describes, and relies on a Kubernetes NetworkPolicy restricting which pods can reach the order-service on port 8080. A new debugging sidecar gets added to the SAME pod as a compromised internal admin tool, which is inside the allowed network policy scope. Does the NetworkPolicy alone stop that tool from forging the X-User-Id header?',
    hint: 'A NetworkPolicy restricts which PODS can reach a service over the network -- does it verify WHICH PROCESS inside an already-allowed pod is making the call, or what headers that call contains?',
    solution: 'No. A NetworkPolicy operates at the network/pod level -- once a pod is inside the allowed scope, anything running inside that pod (including a compromised or malicious process placed there) can make requests exactly like any other legitimate client in that scope, including setting an arbitrary X-User-Id header. This is precisely the gap mTLS closes that a NetworkPolicy alone does not: mTLS verifies the CRYPTOGRAPHIC IDENTITY of the calling service on every individual connection, not just "is this request coming from an allowed network location" -- a compromised process without the gateway\'s own certificate would still be rejected at the TLS handshake, even from an otherwise network-policy-permitted location.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Network policy enforcement" and mTLS are two names for the same protection.',
      reality: 'Per this subtopic\'s theory, they operate at different layers — network policies restrict WHICH network locations can reach a service, while mTLS verifies the cryptographic IDENTITY of the specific caller on each connection, a stronger guarantee that doesn\'t depend on network topology alone.'
    },
    {
      thought: 'If a service is only reachable from inside the cluster/network perimeter, forwarded-header trust is automatically safe.',
      reality: 'Per this subtopic\'s theory, "inside the perimeter" is not the same as "verified identity" — anything already inside that perimeter (a compromised host, a misplaced debugging tool) can forge the same header a legitimate gateway would send, unless something checks identity specifically.'
    },
    {
      thought: 'Setting up mTLS means every individual service has to implement certificate validation logic itself.',
      reality: 'Per this subtopic\'s theory, a service mesh\'s sidecar proxies (covered in this hub\'s own Sidecar & Service Mesh topic) can enforce mTLS automatically for every service-to-service connection at the infrastructure level, without application code changes in each service.'
    }
  ];
}
