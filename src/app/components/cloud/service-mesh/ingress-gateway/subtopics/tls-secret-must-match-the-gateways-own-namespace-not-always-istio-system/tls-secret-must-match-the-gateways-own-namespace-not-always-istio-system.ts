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
  templateUrl: './tls-secret-must-match-the-gateways-own-namespace-not-always-istio-system.html',
  styleUrl: './tls-secret-must-match-the-gateways-own-namespace-not-always-istio-system.scss'
})
export class TlsSecretMustMatchTheGatewaysOwnNamespaceNotAlwaysIstioSystemSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine overgeneralization caught during this batch — repeated across theory, mistakes, and quiz',
      points: [
        'The main page repeatedly stated the requirement as a hardcoded, universal rule: "TLS secrets for Istio Gateway MUST be in istio-system." Verified against real Istio behavior, this is an overgeneralization — it happens to be TRUE for the DEFAULT ingress gateway specifically, but is not actually a rule tied to the literal string "istio-system." The main page has been corrected in all three places.',
      ]
    },
    {
      heading: 'The reality: the secret must live in the SAME NAMESPACE as the Gateway workload itself',
      points: [
        'The real constraint is namespace-relative, not namespace-absolute: whatever namespace the Envoy pod presenting the Gateway\'s listeners actually runs in is the namespace istiod\'s secret-discovery controller watches for that Gateway\'s TLS secrets. For the DEFAULT <code>istio-ingressgateway</code> deployment, that namespace happens to be <code>istio-system</code> — which is exactly why every example using the default gateway needs secrets there.',
        'This directly contradicts an absolute reading of the rule the moment a DEDICATED gateway enters the picture — something the main page\'s OWN "Dedicated Gateway per team" theory bullet describes as a real, encouraged pattern ("each team owns their Gateway CRD... deploy a second gateway deployment with different labels"). A dedicated gateway running in, say, the <code>team-checkout</code> namespace needs its TLS secrets created in <code>team-checkout</code>, NOT <code>istio-system</code> — the "istio-system" framing was only ever an accident of which namespace the DEFAULT gateway happens to occupy.',
      ]
    },
    {
      heading: 'Why this distinction matters for multi-tenant / dedicated-gateway setups specifically',
      points: [
        'A platform team following the (incorrect) absolute rule might grant every application team\'s CI/CD pipeline write access to Secrets in <code>istio-system</code> — a shared, sensitive, cluster-critical namespace — purely to satisfy a rule that was never actually about that specific namespace. This is a real, avoidable security/permissions over-grant.',
        'The corrected model supports better namespace isolation: each team\'s dedicated gateway and its TLS secrets can live together in that team\'s OWN namespace, with RBAC scoped accordingly — no need to touch <code>istio-system</code> at all for anything beyond the shared default gateway.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Default gateway: secret in istio-system (because THAT\'S where it runs)',
      language: 'bash',
      code: `# The default istio-ingressgateway workload runs in istio-system,
# so its TLS secrets must be created there too:
kubectl create secret tls myapp-tls \\
  --cert=path/to/tls.crt --key=path/to/tls.key \\
  -n istio-system

apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: myapp-gateway
  namespace: istio-system   # <- matches istio-ingressgateway's own namespace
spec:
  selector:
    istio: ingressgateway   # <- targets the DEFAULT gateway workload
  servers:
  - port: { number: 443, name: https, protocol: HTTPS }
    hosts: ["api.example.com"]
    tls:
      mode: SIMPLE
      credentialName: myapp-tls   # resolved from istio-system`,
    },
    {
      label: 'Dedicated team gateway: secret goes in THAT gateway\'s namespace instead',
      language: 'bash',
      code: `# A dedicated gateway deployment running in "team-checkout",
# NOT istio-system -- its TLS secret must live there too:
kubectl create secret tls checkout-tls \\
  --cert=path/to/tls.crt --key=path/to/tls.key \\
  -n team-checkout   # <- matches the dedicated gateway's own namespace

apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: checkout-gateway
  namespace: team-checkout   # <- NOT istio-system
spec:
  selector:
    istio: checkout-gateway   # <- targets the DEDICATED gateway workload,
                                #    which is deployed in team-checkout
  servers:
  - port: { number: 443, name: https, protocol: HTTPS }
    hosts: ["checkout.example.com"]
    tls:
      mode: SIMPLE
      credentialName: checkout-tls   # resolved from team-checkout,
                                        # NOT istio-system`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team follows the "TLS secrets must be in istio-system" rule literally. When a new "team-checkout" deploys a dedicated gateway (per the main page\'s own recommended pattern) running in the team-checkout namespace, the platform team creates the TLS secret in istio-system anyway, believing that\'s always required. The dedicated gateway returns 503 for HTTPS requests. What went wrong, and what should the secret\'s namespace actually be?',
    hint: 'Does the TLS-secret-namespace requirement track a fixed namespace name, or does it track wherever the specific Gateway workload happens to be deployed?',
    solution: 'The requirement tracks the namespace of the GATEWAY WORKLOAD itself, not a fixed "istio-system" rule — since the dedicated checkout gateway runs in team-checkout, not istio-system, its TLS secret needed to be created in team-checkout too. Creating it in istio-system put it in the wrong namespace for THIS specific gateway (even though istio-system would have been correct for the DEFAULT gateway), so the dedicated gateway\'s credentialName reference resolved to nothing, producing the 503. The fix is deleting the mistakenly-placed secret and recreating it in team-checkout, matching the dedicated gateway\'s own namespace.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'TLS secrets for any Istio Gateway must always be created in the istio-system namespace specifically, as a hardcoded platform rule.',
      reality: 'Per this subtopic\'s theory (a genuine overgeneralization caught and corrected on the main page during this batch), the real rule is that the secret must match the Gateway WORKLOAD\'s own namespace — istio-system only because that\'s where the DEFAULT gateway happens to run.'
    },
    {
      thought: 'A dedicated, team-owned gateway deployment (as the main page itself recommends for multi-tenant setups) still needs its TLS secrets created in istio-system, like the default gateway does.',
      reality: 'Per this subtopic\'s theory, a dedicated gateway running in its own namespace needs its TLS secrets created in THAT namespace instead — istio-system is not involved at all for a gateway deployed elsewhere.'
    },
    {
      thought: 'Since TLS secrets must be in istio-system, granting broad Secret-creation access in istio-system to every application team\'s CI/CD pipeline is a reasonable, necessary consequence of using Istio Gateways with custom TLS certs.',
      reality: 'Per this subtopic\'s theory, this is an avoidable over-grant — once the real namespace-relative rule is understood, each team\'s dedicated gateway and its TLS secrets can live together in that team\'s own namespace, with RBAC scoped accordingly and no need to touch istio-system at all.'
    }
  ];
}
