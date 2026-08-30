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
  templateUrl: './consecutivelocaloriginfailures-needs-splitexternallocaloriginerrors-to-work.html',
  styleUrl: './consecutivelocaloriginfailures-needs-splitexternallocaloriginerrors-to-work.scss'
})
export class ConsecutivelocaloriginfailuresNeedsSplitexternallocaloriginerrorsToWorkSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names consecutiveLocalOriginFailures as a standalone setting, without its required companion flag',
      points: [
        'The main page\'s theory bullet says: "<code>consecutiveGatewayErrors</code>: eject a pod after N consecutive 5xx responses. <code>consecutiveLocalOriginFailures</code>: eject after N local origin failures (connection refused, reset, timeout)." Both are described the same way — as independently-configurable ejection triggers. One of them is not actually independent.',
      ]
    },
    {
      heading: 'The real requirement: consecutiveLocalOriginFailures has NO EFFECT unless splitExternalLocalOriginErrors is also set to true',
      points: [
        'By default, Envoy does NOT distinguish between "local origin" failures (connection refused, connection reset, timeout — the client-side proxy never got a real response) and "external origin" errors (an actual 5xx HTTP response FROM the upstream). Both count toward the SAME shared failure counter unless told otherwise.',
        'Setting <code>outlierDetection.consecutiveGatewayErrors</code> alone (without <code>splitExternalLocalOriginErrors: true</code>) means local-origin failures like connection resets DO still count — just lumped in with gateway errors under one combined counter. Adding a <code>consecutiveLocalOriginFailures</code> value on top of this, WITHOUT the split flag, changes nothing — that specific field is silently ignored.',
      ]
    },
    {
      heading: 'The consequence: a DestinationRule with consecutiveLocalOriginFailures set can look complete while doing nothing extra',
      points: [
        'A team writing <code>outlierDetection: { consecutiveGatewayErrors: 5, consecutiveLocalOriginFailures: 3 }</code> and expecting connection-level failures to trigger ejection after only 3 (a lower, more sensitive threshold than the 5 for actual 5xx responses) will find this doesn\'t happen — without the split flag, everything is still governed by the single combined counter, and the "3" value for local-origin failures is simply never consulted.',
        'To get genuinely separate, independently-tunable thresholds for "the upstream returned an error" versus "we couldn\'t even reach the upstream," <code>splitExternalLocalOriginErrors: true</code> must be added explicitly — only then does <code>consecutiveLocalOriginFailures</code> start being evaluated as its own distinct trigger, separate from <code>consecutiveGatewayErrors</code>.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Broken: consecutiveLocalOriginFailures set, but ignored',
      language: 'bash',
      code: `apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: inventory
spec:
  host: inventory
  trafficPolicy:
    outlierDetection:
      consecutiveGatewayErrors: 5        # 5xx response threshold
      consecutiveLocalOriginFailures: 3  # connection-failure threshold --
                                           # LOOKS configured, but is
                                           # actually a no-op here --
                                           # splitExternalLocalOriginErrors
                                           # was never set

# What actually happens: EVERY failure (5xx responses AND
# connection-level failures) counts toward the SAME shared
# counter, governed by consecutiveGatewayErrors alone. A pod
# with 3 connection resets does NOT get ejected early --
# it needs 5 total failures of EITHER kind, same as before.`,
    },
    {
      label: 'Correct: split flag actually separates the two counters',
      language: 'bash',
      code: `apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: inventory
spec:
  host: inventory
  trafficPolicy:
    outlierDetection:
      splitExternalLocalOriginErrors: true  # <-- REQUIRED for
                                              #     consecutiveLocalOriginFailures
                                              #     to do anything at all
      consecutiveGatewayErrors: 5           # separate counter: 5xx responses
      consecutiveLocalOriginFailures: 3     # separate counter: connection
                                              # refused / reset / timeout

# NOW a pod is ejected after EITHER:
#   - 5 consecutive 5xx responses (an actual upstream error), OR
#   - 3 consecutive connection-level failures (couldn't even
#     reach the pod) -- a genuinely lower, more sensitive
#     threshold specifically for "this pod seems unreachable"`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team configures outlierDetection with consecutiveGatewayErrors: 5 and consecutiveLocalOriginFailures: 2, intending connection-level failures (which they consider a stronger signal of a truly broken pod) to trigger ejection faster than ordinary 5xx errors. In production, a pod experiencing repeated connection resets is NOT ejected until 5 total failures accumulate, not 2. What\'s missing from the configuration?',
    hint: 'Does Envoy distinguish "couldn\'t connect to the pod at all" from "the pod responded with an error" as separate failure counters by default, or does that require an explicit flag?',
    solution: 'The configuration is missing splitExternalLocalOriginErrors: true. By default, Envoy does not distinguish local-origin failures (connection refused, reset, timeout) from external-origin errors (actual 5xx responses) — both count toward the single consecutiveGatewayErrors counter. Setting consecutiveLocalOriginFailures without also setting splitExternalLocalOriginErrors: true has no effect at all; that field is simply not consulted. Adding splitExternalLocalOriginErrors: true makes Envoy track the two failure types as genuinely separate counters, at which point consecutiveLocalOriginFailures: 2 will actually trigger ejection after 2 connection-level failures, independent of the 5xx-based threshold.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Setting consecutiveLocalOriginFailures in an outlierDetection block is sufficient on its own to create a separate, lower ejection threshold for connection-level failures versus HTTP 5xx errors.',
      reality: 'Per this subtopic\'s theory, consecutiveLocalOriginFailures has no effect at all unless splitExternalLocalOriginErrors: true is also explicitly set — without it, local-origin and external-origin failures share a single combined counter governed by consecutiveGatewayErrors.'
    },
    {
      thought: 'By default, Envoy treats a connection reset/refused/timeout as fundamentally different from an actual 5xx HTTP response when deciding whether to eject a pod, since they represent very different failure modes.',
      reality: 'Per this subtopic\'s theory, by default Envoy lumps both failure types into the SAME counter — the distinction only exists once splitExternalLocalOriginErrors: true is explicitly configured to separate them.'
    },
    {
      thought: 'If consecutiveLocalOriginFailures is configured with an unusually low value (like 2 or 3) and the setting has no visible effect, this indicates a misconfigured value, not a missing companion setting.',
      reality: 'Per this subtopic\'s theory, the field being silently ignored is the expected behavior when splitExternalLocalOriginErrors is not set — no error or warning is produced, so the actual value chosen for consecutiveLocalOriginFailures is irrelevant until the split flag is added.'
    }
  ];
}
