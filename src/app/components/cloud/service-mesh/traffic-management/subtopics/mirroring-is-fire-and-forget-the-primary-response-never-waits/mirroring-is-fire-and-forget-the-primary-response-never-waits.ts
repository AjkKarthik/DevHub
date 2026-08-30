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
  templateUrl: './mirroring-is-fire-and-forget-the-primary-response-never-waits.html',
  styleUrl: './mirroring-is-fire-and-forget-the-primary-response-never-waits.scss'
})
export class MirroringIsFireAndForgetThePrimaryResponseNeverWaitsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes what mirroring does, without stating its actual timing/latency guarantee',
      points: [
        'The main page says: "Envoy sends the primary response to the client normally and asynchronously fires a copy of the request to the shadow. The shadow response is discarded." The word "asynchronously" is doing real work here, but the page never states the specific, practical guarantee this gives you: does the primary request-response cycle wait on the mirror AT ALL, even briefly?',
      ]
    },
    {
      heading: 'The guarantee: the primary response never waits for the mirror, in any capacity',
      points: [
        'Traffic mirroring is genuinely fire-and-forget — Envoy does not wait for the mirrored request to complete (or even to start meaningfully processing) before returning the real response to the actual client. The mirrored copy is dispatched out-of-band, entirely outside the critical path of the request the real user is waiting on.',
        'This means mirroring adds NEGLIGIBLE latency to production traffic — not "usually fast" or "typically low-overhead," but architecturally decoupled from the response timing the client experiences. A slow, hanging, or completely broken shadow service has no ability to slow down or fail the real response, by design.',
      ]
    },
    {
      heading: 'What this does NOT mean: mirroring is still real resource cost, just not latency cost',
      points: [
        'Fire-and-forget with respect to LATENCY does not mean fire-and-forget with respect to RESOURCE USAGE — the mirrored requests still consume real CPU, network, and connection-pool capacity on both the sending proxy and the shadow destination. A shadow service under-provisioned for the mirrored volume can still fall over or degrade, even though doing so has zero effect on the primary response\'s latency.',
        'This is the precise, useful mental model: mirroring decouples the shadow\'s HEALTH from the primary path\'s LATENCY, but does not decouple it from the mesh\'s overall RESOURCE consumption — sizing the shadow deployment for the mirrored percentage of traffic still matters operationally, even if a struggling shadow can never show up as a slow real-user response.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Mirroring a percentage of production traffic',
      language: 'bash',
      code: `apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: checkout
spec:
  hosts:
  - checkout
  http:
  - route:
    - destination:
        host: checkout   # primary destination -- real response
                          # comes from here, always
    mirror:
      host: checkout-v2-shadow
    mirrorPercentage:
      value: 25           # 25% of requests also get mirrored

# Even if checkout-v2-shadow is completely down, unreachable,
# or takes 30 seconds to respond -- the client calling
# "checkout" observes NO difference in latency whatsoever.
# The mirror's fate is entirely irrelevant to the primary path.`,
    },
    {
      label: 'Verifying: mirror latency vs primary latency',
      language: 'bash',
      code: `# Confirm this empirically: compare p99 latency on the primary
# route with mirroring enabled vs disabled

# Baseline (no mirroring):
linkerd viz stat deploy/checkout -n production
# (or istioctl / Prometheus equivalent for Istio)

# After enabling 25% mirroring to a deliberately SLOW shadow
# (e.g. one with an artificial delay injected via fault
# injection on ITS OWN inbound VirtualService):
linkerd viz stat deploy/checkout -n production
# p99 latency on "checkout" itself should show NO measurable
# increase, regardless of how slow checkout-v2-shadow is --
# confirming the fire-and-forget guarantee directly, rather
# than just trusting the documentation's description.

# What DOES matter operationally: resource usage on the
# shadow deployment itself, and on egress capacity for the
# proxies sending the mirrored copies -- size accordingly.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team is nervous about enabling traffic mirroring to a brand-new, unproven shadow service, worried that if the shadow is slow or crashes under load, it could degrade the real production response times for actual users. Is this concern justified given how Istio\'s mirroring actually works, and what should they still plan for regardless?',
    hint: 'Does the primary response wait for the mirrored request to complete, in any capacity, before being returned to the real client?',
    solution: 'The specific concern (a slow or crashing shadow degrading real user latency) is not justified — mirroring is genuinely fire-and-forget, and the primary response is returned to the client without waiting on the mirrored request in any capacity, so a struggling shadow service cannot slow down or fail the real response, by architectural design. What the team SHOULD still plan for is resource usage: the mirrored requests are real traffic consuming real CPU, network, and connection-pool capacity on both the sending proxy and the shadow destination itself — an under-provisioned shadow can still fall over from the mirrored load, and that mirrored traffic still competes for capacity in the mesh even though it can never manifest as added latency on the primary path.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Traffic mirroring in Istio is "asynchronous" in the sense that it usually doesn\'t add noticeable latency, but a sufficiently slow or unresponsive shadow service could still delay the primary response in edge cases.',
      reality: 'Per this subtopic\'s theory, the primary response never waits for the mirrored request in ANY capacity, by architectural design — this is not a "usually fast" performance characteristic but an absolute decoupling; a completely unresponsive shadow has zero effect on primary latency.'
    },
    {
      thought: 'Since mirroring adds no latency to the primary response, a shadow service under heavy mirrored load poses no real operational risk at all.',
      reality: 'Per this subtopic\'s theory, mirroring decouples the shadow\'s health from the PRIMARY PATH\'S LATENCY specifically — it does not eliminate real resource consumption; an under-provisioned shadow can still fail or degrade under mirrored load, which remains a genuine operational concern to size for.'
    },
    {
      thought: 'The safest way to verify mirroring\'s latency guarantee is to trust the documentation\'s description of it being "asynchronous," without needing to measure it directly.',
      reality: 'Per this subtopic\'s theory, the guarantee can and should be verified empirically — comparing primary-route p99 latency with mirroring enabled against a deliberately slow shadow versus disabled confirms the fire-and-forget behavior directly, the same verification discipline applied to other measurable claims.'
    }
  ];
}
