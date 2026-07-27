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
  templateUrl: './ambient-mode-ztunnel-is-l4-only-l7-routing-needs-a-waypoint.html',
  styleUrl: './ambient-mode-ztunnel-is-l4-only-l7-routing-needs-a-waypoint.scss'
})
export class AmbientModeZtunnelIsL4OnlyL7RoutingNeedsAWaypointSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page frames ambient mode as a clean memory-cost win, without the capability trade-off that comes with it',
      points: [
        'The main page\'s theory bullet says: "In ambient mesh mode (Istio 1.18+), the data plane moves from per-pod sidecars to per-node ztunnel daemons and optional waypoint proxies, eliminating the per-pod memory cost." The word "optional" here is doing a lot of unstated work — it reads as if waypoints are a nice-to-have, not something most real deployments already using L7 features (VirtualService routing, retries, header-based rules) will actually need.',
      ]
    },
    {
      heading: 'What ztunnel alone actually provides: L4 only — mTLS and basic authorization',
      points: [
        'ztunnel handles mTLS and basic L4 policy — encrypting and authenticating connections, and enforcing simple allow/deny rules based on identity or port. If a workload genuinely has no need for anything beyond that, ztunnel alone is sufficient, with no waypoint required at all.',
        'What ztunnel does NOT do: HTTP-aware routing, header-based rules, path-based rules, retries, or any feature that requires understanding the application protocol above raw TCP. All of the main page\'s own "Core Mesh Capabilities" traffic-management bullet (weight-based routing, header-based routing, fault injection) is L7 — none of it works through ztunnel alone.',
      ]
    },
    {
      heading: 'The consequence: a straight sidecar-to-ambient migration can silently lose L7 features',
      points: [
        'A team migrating from sidecar mode (where every pod has a full Envoy handling both L4 and L7) directly to ambient mode WITHOUT deploying waypoint proxies keeps mTLS working, but any VirtualService-based routing, retry policy, or header rule that pod\'s traffic depended on simply stops applying — with no obvious error, since the traffic still flows, just without the L7 policy.',
        'The fix is deploying a waypoint proxy for any workload (or namespace) that needs L7 features — ztunnel then tunnels that traffic to the waypoint for L7 processing before it continues to its destination, rather than trying to apply L7 rules itself. Note also that Istio currently treats VirtualService support under ambient as alpha, with Gateway API HTTPRoute positioned as the primary routing API for waypoints going forward.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ztunnel alone: mTLS works, L7 routing silently does not',
      language: 'bash',
      code: `# Migrating a namespace from sidecar to ambient mode
kubectl label namespace production istio.io/dataplane-mode=ambient
kubectl label namespace production istio-injection- \\
  --overwrite  # remove sidecar injection label

# mTLS: still fully enforced -- ztunnel handles L4 identity/encryption
istioctl authn tls-check payment-svc.production.svc.cluster.local
# STATUS: OK

# But this VirtualService, which worked under sidecar mode,
# now has NO EFFECT on traffic -- ztunnel cannot evaluate it:
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: payment-svc
spec:
  hosts: [payment-svc]
  http:
  - route:
    - destination: { host: payment-svc, subset: stable }
      weight: 90
    - destination: { host: payment-svc, subset: canary }
      weight: 10
# Traffic flows -- but the 90/10 split silently does not apply.
# No error is raised; requests just aren't routed as configured.`,
    },
    {
      label: 'Fix: deploy a waypoint proxy for L7 workloads',
      language: 'bash',
      code: `# Deploy a waypoint proxy for the namespace (or a specific
# service account) that needs L7 features
istioctl waypoint apply --namespace production \\
  --name production-waypoint --enroll-namespace

# Traffic path now: client -> ztunnel (source) -> HBONE tunnel
# -> waypoint (L7 processing: routing, retries, headers)
# -> HBONE tunnel -> ztunnel (destination) -> pod

# Verify the waypoint is handling this service
kubectl get gateway production-waypoint -n production
istioctl proxy-status | grep waypoint

# NOW the VirtualService's 90/10 split is actually evaluated --
# by the waypoint, not by ztunnel directly.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team migrates their production namespace from Istio sidecar mode to ambient mode, removing the injection label and enabling ambient mode. They deploy no waypoint proxies, reasoning "waypoints are optional, and our services don\'t need anything fancy." A week later, they discover their canary deployment\'s 90/10 VirtualService traffic split has stopped working — all traffic goes to one subset. mTLS status checks show everything is still encrypted correctly. What happened, and what\'s missing?',
    hint: 'Does ztunnel alone evaluate VirtualService routing rules, or only handle L4 identity and encryption?',
    solution: 'The canary traffic split stopped working because VirtualService-based weighted routing is an L7 feature, and ztunnel alone only handles L4 concerns (mTLS, basic authorization) — it cannot evaluate HTTP-aware routing rules like weight-based subset splits. The mTLS status check passing confirms ztunnel is working correctly for what it\'s actually responsible for; it says nothing about L7 policy, which simply has no effect without a waypoint proxy to process it. The fix is deploying a waypoint proxy for that namespace or service — this gives ztunnel somewhere to tunnel L7-requiring traffic to for the VirtualService\'s routing rules to actually be evaluated and applied.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page describes waypoint proxies as "optional" in ambient mode, most services can skip them entirely with no functional loss compared to sidecar mode.',
      reality: 'Per this subtopic\'s theory, any service relying on L7 features already in use under sidecar mode — VirtualService routing, header-based rules, retries — silently loses that functionality in ambient mode without a waypoint proxy; "optional" only holds for workloads that genuinely need nothing beyond L4.'
    },
    {
      thought: 'A VirtualService with an invalid or unreachable configuration under ambient mode without a waypoint would produce a visible error or warning, the same way misconfigurations typically surface elsewhere in Istio.',
      reality: 'Per this subtopic\'s theory, an L7 VirtualService rule with no waypoint to evaluate it produces no error at all — traffic simply continues flowing without the routing rule applied, which is a silent failure mode rather than an obvious one.'
    },
    {
      thought: 'Migrating from sidecar to ambient mode is purely an infrastructure/memory optimization with identical functional behavior — mTLS, routing, and all other mesh features work exactly the same, just cheaper.',
      reality: 'Per this subtopic\'s theory, ambient mode splits L4 (ztunnel, always active) from L7 (waypoint, must be explicitly deployed) — any L7-dependent behavior needs that explicit waypoint deployment to keep working, making this a genuine architectural change, not just a cost optimization.'
    }
  ];
}
