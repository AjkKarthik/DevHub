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
  templateUrl: './consul-certs-are-genuinely-spiffe-format-not-a-separate-identity-model.html',
  styleUrl: './consul-certs-are-genuinely-spiffe-format-not-a-separate-identity-model.scss'
})
export class ConsulCertsAreGenuinelySpiffeFormatNotASeparateIdentityModelSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A self-contradiction caught during this batch, on one of the page\'s own core comparison points',
      points: [
        'The main page originally stated, in its own overview section, that Consul\'s identity model uses "Consul ACL tokens and service identities defined in the Consul catalog — not SPIFFE SVIDs... a key difference from Istio\'s SPIFFE/SVID model." Later on the SAME page, its own "Consul vs Istio — Key Differences" section says the opposite: Consul certs use <code>spiffe://</code> URIs too, "so both are SPIFFE-compatible in format." These two statements cannot both be true. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: Consul\'s per-service certificates ARE genuinely SPIFFE-format',
      points: [
        'Per Consul\'s own built-in CA documentation, service identity is encoded as a URI Subject Alternative Name (SAN) in each proxy\'s mTLS certificate, and that URI follows the <code>spiffe://</code> scheme — e.g. <code>spiffe://&lt;cluster-id&gt;.consul/ns/default/dc/dc1/svc/web</code>, encoding the cluster identifier, namespace, datacenter, and service name.',
        'What actually differs from Istio is NOT the certificate format — it\'s the ISSUER. Consul certs are signed by Consul\'s own built-in (or Vault-backed) CA; Istio SVIDs are signed by Istiod\'s built-in CA. Since these are different, mutually-untrusted root CAs, a Consul-issued cert and an Istio-issued cert won\'t verify against each other by default — but that\'s a trust-domain problem, not a format incompatibility.',
        'ACL tokens are a real, separate part of Consul\'s identity story too — but they govern API/agent-level access control (who can read/write Consul\'s catalog and config), not the per-request mTLS identity carried in the service mesh data plane. Conflating the two was the root of the page\'s original error.',
      ]
    },
    {
      heading: 'Why the distinction (format vs. issuer/trust) matters for a Consul-to-Istio interop conversation',
      points: [
        'If Consul genuinely used a non-SPIFFE identity model (as the page\'s first, incorrect claim implied), federating trust between a Consul mesh and an Istio mesh would require translating between two structurally different identity SCHEMES — a much harder problem.',
        'Since both actually use the same SPIFFE URI SAN format, the real (still nontrivial, but more tractable) interop problem is CA trust: getting Consul\'s root and Istio\'s root to cross-sign or otherwise establish mutual trust, the same category of problem as federating two separately-rooted Istio meshes.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Inspecting a Consul service cert\'s actual SPIFFE URI SAN',
      language: 'bash',
      code: `# Consul issues a per-service mTLS cert whose URI SAN follows
# the spiffe:// scheme -- confirm it directly:
consul connect ca get-config

# Inspect a running proxy's leaf certificate:
openssl x509 -in <(consul tls cert read) -noout -text \\
  | grep -A2 "Subject Alternative Name"

# Expected URI SAN shape:
# URI:spiffe://<cluster-id>.consul/ns/default/dc/dc1/svc/web
#     ^ cluster identifier   ^ namespace  ^ dc   ^ service name

# Compare to an Istio SVID (different issuer, same URI scheme):
istioctl proxy-config secret <pod> -o json \\
  | grep -o 'spiffe://[^"]*'
# URI:spiffe://cluster.local/ns/default/sa/web
#     ^ trust domain          ^ namespace  ^ service account`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A security architect, citing the main page\'s original (now-corrected) claim that "Consul uses ACL tokens, not SPIFFE SVIDs — a key difference from Istio," argues that federating a Consul mesh with an Istio mesh would require rebuilding Consul\'s entire identity model from scratch. Is this the right scoping for the effort?',
    hint: 'Is the actual difference between Consul and Istio identity a difference in FORMAT (the URI scheme used in the certificate), or a difference in ISSUER (which CA signs the certificate)?',
    solution: 'This overstates the effort significantly. Consul\'s per-service mTLS certificates already use the same spiffe:// URI SAN format as Istio\'s SVIDs — there is no identity-model rebuild needed on the FORMAT side. The real, narrower problem is that the two systems use different, mutually-untrusted CAs (Consul\'s built-in/Vault-backed CA vs. Istiod\'s built-in CA) — the actual federation work is establishing CA trust (cross-signing, or a shared upstream root), the same category of problem as federating two independently-rooted Istio meshes, not a from-scratch identity model redesign.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Consul uses ACL tokens and catalog-based service identities instead of SPIFFE SVIDs — a fundamentally different identity model from Istio.',
      reality: 'Per this subtopic\'s theory (a self-contradiction corrected on the main page during this batch), Consul\'s per-service mTLS certificates genuinely use SPIFFE-format URI SANs, the same scheme Istio uses — ACL tokens are a separate, API/agent-level access mechanism, not the mesh identity format.'
    },
    {
      thought: 'Since Consul and Istio use different CAs that don\'t trust each other, their underlying identity FORMATS must also be different.',
      reality: 'Per this subtopic\'s theory, the format (SPIFFE URI SANs) is actually the same on both sides — what differs is the issuer/trust root, a narrower and more tractable problem than a format mismatch.'
    },
    {
      thought: 'Federating a Consul mesh with an Istio mesh would require redesigning Consul\'s identity model to match Istio\'s.',
      reality: 'Per this subtopic\'s theory, both already speak the same SPIFFE URI format — federation is a CA-trust problem (cross-signing or a shared root), not an identity-model redesign.'
    }
  ];
}
