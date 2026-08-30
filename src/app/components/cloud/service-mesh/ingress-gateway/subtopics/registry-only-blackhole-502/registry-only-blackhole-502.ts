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
  templateUrl: './registry-only-blackhole-502.html',
  styleUrl: './registry-only-blackhole-502.scss'
})
export class RegistryOnlyBlocksTrafficViaABlackHoleCluster502NotByRemovingRoutesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions REGISTRY_ONLY\'s effect but never its mechanism',
      points: [
        'The main page\'s QnA on the egress gateway mentions, in passing: "combined with `REGISTRY_ONLY` and ServiceEntry, ensure only approved external hosts are reachable." It never explains HOW Envoy actually enforces this — understanding the real mechanism clarifies exactly what error a blocked request produces, and why.',
      ]
    },
    {
      heading: 'The reality: a dedicated BlackHoleCluster returns 502 for anything without a matching route',
      points: [
        'When `global.outboundTrafficPolicy.mode` is set to <code>REGISTRY_ONLY</code>, Istio configures a special, always-present Envoy cluster called the <strong>BlackHoleCluster</strong> on every sidecar. Envoy\'s route configuration is augmented so that every virtual host falls through to a direct response pointing at this BlackHoleCluster if no OTHER route (i.e. no ServiceEntry-backed destination) matches.',
        'This is the OPPOSITE default from <code>ALLOW_ANY</code> mode (Istio\'s actual default), which instead configures a <strong>PassthroughCluster</strong> — a catch-all that forwards unmatched traffic to its original destination unmodified, allowing any external call to succeed.',
        'The practical, observable result of REGISTRY_ONLY blocking a call: the calling application receives an HTTP <strong>502</strong> response, generated locally by its OWN sidecar (it never even leaves the pod\'s network namespace) — not a connection timeout, not a DNS failure, and not any response from the real external destination at all, since the request never actually reaches it.',
      ]
    },
    {
      heading: 'Why this precise mechanism matters for debugging and monitoring',
      points: [
        'Since the block happens entirely client-side (in the CALLING service\'s own sidecar) rather than anywhere in the network path to the real destination, the standard debugging instinct of "check the destination service\'s logs" is a dead end — the destination never received anything to log. The right place to look is the CALLER\'s own Envoy access logs and metrics.',
        'Because the BlackHoleCluster is a distinct, named Envoy cluster, its traffic is separately observable: `sum(rate(envoy_cluster_upstream_rq{cluster_name="BlackHoleCluster"}[5m]))` is a real, actionable Prometheus query for tracking how often workloads are attempting egress calls that REGISTRY_ONLY is blocking — exactly the kind of signal worth alerting on to catch a service that needs a new ServiceEntry it doesn\'t have yet, distinct from a genuine external outage.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Enabling REGISTRY_ONLY mesh-wide',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  meshConfig:
    outboundTrafficPolicy:
      mode: REGISTRY_ONLY   # default is ALLOW_ANY
EOF

# Any outbound call with NO matching ServiceEntry now gets
# a local 502 from the CALLER's own sidecar -- it never
# reaches the real external destination at all.`,
    },
    {
      label: 'Observing BlackHoleCluster hits directly',
      language: 'bash',
      code: `# Confirm the BlackHoleCluster exists on a sidecar under
# REGISTRY_ONLY mode:
istioctl proxy-config cluster deploy/api -n production | grep BlackHole

# Track how often it's actually being hit (a real signal
# for "this service needs a ServiceEntry it doesn't have"):
sum(rate(envoy_cluster_upstream_rq{cluster_name="BlackHoleCluster"}[5m]))
  by (source_workload)

# Compare: under the DEFAULT ALLOW_ANY mode, the equivalent
# catch-all cluster is PassthroughCluster instead -- and its
# traffic represents calls that succeeded to real external
# destinations, the opposite signal.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'After enabling REGISTRY_ONLY mesh-wide, a team reports their service can\'t reach a third-party payment API and assumes the payment provider is having an outage. They check the payment provider\'s public status page (all green) and their own service\'s error logs, which just show "502 Bad Gateway" with no further detail from the payment provider\'s side at all. Where should they actually look to confirm the real cause, and why won\'t checking the payment provider\'s side ever explain this?',
    hint: 'Under REGISTRY_ONLY, where does a blocked request\'s 502 response actually get generated — somewhere in the network path to the destination, or somewhere else entirely?',
    solution: 'The 502 is being generated by the CALLING service\'s own sidecar via the BlackHoleCluster mechanism — the request never actually left the pod\'s network namespace, let alone reached the payment provider. This is exactly why the payment provider\'s status page shows all green: they never received anything to have an outage on. The team should check their OWN sidecar\'s configuration for a missing ServiceEntry covering the payment API\'s hostname (confirmable via istioctl proxy-config cluster, or by checking BlackHoleCluster hit metrics scoped to their own workload) rather than continuing to investigate the external provider — the fix is adding a ServiceEntry for the payment API\'s external hostname, not waiting for an outage to resolve.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'When REGISTRY_ONLY mode blocks an outbound call, the request reaches the external destination but gets rejected or times out there.',
      reality: 'Per this subtopic\'s theory, the request never leaves the calling pod\'s own sidecar at all — Envoy\'s BlackHoleCluster generates a local 502 response entirely client-side, before any network call to the real destination is even attempted.'
    },
    {
      thought: 'To debug a REGISTRY_ONLY-blocked call, checking the DESTINATION service\'s own logs and status is a reasonable starting point, since that\'s where the failure would show up.',
      reality: 'Per this subtopic\'s theory, the destination never receives the request at all under REGISTRY_ONLY blocking — it has nothing to log. The correct place to look is the CALLING service\'s own sidecar (BlackHoleCluster metrics, missing ServiceEntry), not the destination.'
    },
    {
      thought: 'REGISTRY_ONLY and ALLOW_ANY modes both use the same underlying Envoy mechanism for unmatched traffic, just with the outcome (block vs. allow) flipped by a simple boolean.',
      reality: 'Per this subtopic\'s theory, the two modes configure genuinely DIFFERENT Envoy clusters for unmatched traffic — BlackHoleCluster (REGISTRY_ONLY, returns a local 502) versus PassthroughCluster (ALLOW_ANY, forwards to the original destination) — distinct, separately-observable mechanisms, not one mechanism with a flag.'
    }
  ];
}
