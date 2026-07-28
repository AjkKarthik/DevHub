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
  templateUrl: './sidecar-crd-scoping-egress-does-not-block-unmatched-inbound-traffic.html',
  styleUrl: './sidecar-crd-scoping-egress-does-not-block-unmatched-inbound-traffic.scss'
})
export class SidecarCrdScopingEgressDoesNotBlockUnmatchedInboundTrafficSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s framing — "restricts what a sidecar can see" — invites reading Sidecar CRD as an access-control mechanism',
      points: [
        'The main page describes the Sidecar CRD as something that "restricts what an Envoy sidecar can see" and shows an example with BOTH an <code>egress</code> block AND an <code>ingress</code> block. Read together, this can suggest the CRD is a general traffic-control tool — scope it down and unmatched traffic in either direction gets blocked, similar to a NetworkPolicy.',
      ]
    },
    {
      heading: 'What Sidecar actually does: it is a config-size optimization, not a firewall',
      points: [
        'Sidecar CRD scoping is fundamentally about reducing how much xDS configuration a proxy loads into memory — restricting <code>egress.hosts</code> to a smaller list means the proxy builds a smaller, more efficient routing table, which matters a lot in large clusters (hundreds of services). It was never designed as a security boundary.',
        'Traffic to a destination NOT included in the egress scope is not blocked — it is treated as "unmatched" traffic, which Istio still allows through by default (typically passed through as plain TCP without mesh policy applied, rather than rejected). Scoping reduces what the proxy actively tracks and applies L7 policy to; it does not add a deny rule for anything left out.',
      ]
    },
    {
      heading: 'The ingress side follows the identical logic — and Sidecar has no bearing on it if omitted',
      points: [
        'By default, without any Sidecar CRD at all, Envoy already accepts traffic on every port the workload exposes — this is Istio\'s baseline behavior, established well before Sidecar CRDs enter the picture at all.',
        'Adding a Sidecar CRD with ONLY an <code>egress</code> block (no <code>ingress</code> block, as many real-world configs do purely for the memory-optimization reason above) leaves this default inbound behavior completely untouched — inbound traffic keeps flowing to every workload port exactly as it did before the Sidecar CRD existed. An <code>ingress</code> block is a genuinely separate, optional feature for fine-tuning which ports/protocols a proxy accepts — not something implied or required by scoping egress.',
        'For actual traffic BLOCKING (not just scoping proxy memory usage), the correct tools are AuthorizationPolicy (deny rules) or an egress Gateway forcing all outbound traffic through a controlled chokepoint — Sidecar CRD alone provides neither.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Egress-only Sidecar CRD: memory scoping, not a firewall',
      language: 'bash',
      code: `apiVersion: networking.istio.io/v1beta1
kind: Sidecar
metadata:
  name: default
  namespace: payment
spec:
  egress:
  - hosts:
    - "./*"
    - "production/order-svc.production.svc.cluster.local"
  # NO ingress block -- intentional, most real configs omit it

# What this actually does:
#   - Reduces the proxy's OWN xDS config to only these hosts
#     (smaller memory footprint, faster config processing)
# What this does NOT do:
#   - Block calls to any OTHER service not in this list -- those
#     calls still go through, just WITHOUT mesh L7 policy applied
#     (no retries, no mTLS enforcement via this mechanism, no
#     metrics/tracing for that specific unmatched destination)
#   - Restrict what can call INTO this pod's own service --
#     that's governed entirely separately (see below)`,
    },
    {
      label: 'Inbound is unaffected by egress scoping -- and by default is fully open',
      language: 'bash',
      code: `# Before ANY Sidecar CRD exists: Envoy already accepts traffic
# on every port the payment-svc pod exposes. This is baseline
# Istio behavior, unrelated to Sidecar CRDs entirely.

# The Sidecar CRD above (egress-only) changes NOTHING about this.
# payment-svc's inbound traffic is exactly as open as it always was.

# To ACTUALLY restrict who can call payment-svc, use AuthorizationPolicy:
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: payment-svc-allow
  namespace: payment
spec:
  selector:
    matchLabels: { app: payment-svc }
  action: ALLOW
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/production/sa/checkout-svc"]
# THIS is the mechanism that actually blocks/allows inbound calls --
# a Sidecar CRD's egress scoping has no effect on this at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team applies a Sidecar CRD to their payment namespace, scoping egress.hosts to only two services, intending this as a security measure to prevent the payment service from being reached by anything outside that allow-list. A week later, a security audit finds that services NOT in the egress list can still successfully call the payment service. Was the Sidecar CRD misconfigured, or is there a more fundamental misunderstanding here?',
    hint: 'Does a Sidecar CRD\'s egress block control what can call INTO a service, or what that service\'s OWN proxy can see when calling OUT?',
    solution: 'This is a fundamental misunderstanding, not a misconfiguration. A Sidecar CRD\'s egress block controls what the scoped service\'s OWN proxy can see and route to when making OUTBOUND calls — it has no effect whatsoever on INBOUND traffic reaching that service. The egress list being small does not create any allow-list for callers; unrelated services outside the egress scope can still call the payment service normally, since inbound traffic acceptance is governed separately (and is fully open by default, Sidecar CRD or not). To actually restrict which services can call payment-svc, the team needs an AuthorizationPolicy with explicit ALLOW rules naming the permitted caller principals — that is the real access-control mechanism; Sidecar CRD scoping is purely a proxy memory/config-size optimization.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Sidecar CRD\'s egress.hosts list functions as an allow-list — services or destinations not included are blocked from communicating with the scoped workload.',
      reality: 'Per this subtopic\'s theory, egress scoping only reduces the proxy\'s OWN xDS config size for memory/performance reasons — a destination outside the list is treated as "unmatched" traffic and is still allowed through by default, not blocked.'
    },
    {
      thought: 'Omitting the ingress block from a Sidecar CRD (while including an egress block) restricts inbound traffic to the scoped workload as a side effect, since the CRD is generally about controlling what the proxy can see.',
      reality: 'Per this subtopic\'s theory, an egress-only Sidecar CRD leaves inbound behavior completely untouched — Envoy\'s default (accepting traffic on every exposed port) applies exactly as it did before the Sidecar CRD existed; ingress is a separate, optional feature.'
    },
    {
      thought: 'Sidecar CRD scoping is the correct Istio mechanism to use when the goal is actually restricting which services can call a given workload.',
      reality: 'Per this subtopic\'s theory, actual traffic access control is AuthorizationPolicy\'s job (or an egress Gateway for outbound chokepoints) — Sidecar CRD scoping addresses proxy memory/config efficiency at scale, an entirely different problem from access control.'
    }
  ];
}
