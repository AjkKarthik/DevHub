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
  templateUrl: './scale-up-and-scale-down-stabilization-windows-aggregate-oppositely.html',
  styleUrl: './scale-up-and-scale-down-stabilization-windows-aggregate-oppositely.scss'
})
export class ScaleUpAndScaleDownStabilizationWindowsAggregateOppositelySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own quiz explains only the scale-down half of stabilization',
      points: [
        'The main page\'s own quiz explanation for the stabilization-window question says: "The stabilization window... tells HPA: look at all replica counts calculated in this window and use the maximum." This is a correct, precise description — but it only describes the SCALE-DOWN direction, since that\'s the direction the main page\'s own default (300s) and every worked example applies the window to.',
        'The main page\'s own theory bullet does mention scale-up CAN have a stabilization window too ("behavior.scaleUp.policies: limit scale-up rate for workloads where rapid scaling is harmful") — but never states what happens INSIDE that window if one is configured, leaving a reader to assume it works the same "use the maximum" way scale-down does.',
      ]
    },
    {
      heading: 'What actually happens: the two directions aggregate stabilized recommendations OPPOSITELY',
      points: [
        'Per Kubernetes\' own documented HPA stabilization behavior, a stabilization window doesn\'t just delay a decision — it changes WHICH of the recent recommendations HPA picks from the whole window. For SCALE-DOWN, HPA takes the MAXIMUM replica count recommended across the window — the most conservative choice, since keeping MORE pods running is the safe default when scaling down.',
        'For SCALE-UP, if a window is configured, HPA takes the MINIMUM replica count recommended across that window — this is ALSO the conservative choice for that direction, since adding FEWER pods is the cautious default when scaling up. The two directions are not just "delayed the same way" — they pick opposite ends of the recommendation range within their respective windows, because "conservative" means something different depending on which direction you\'re moving.',
        'This is precisely why the main page\'s own default configuration pairs `scaleUp.stabilizationWindowSeconds: 0` (no window at all, so there\'s nothing to take a minimum OF — every fresh recommendation applies immediately) with `scaleDown.stabilizationWindowSeconds: 300` (a real window, taking the maximum) — the asymmetry in DEFAULTS is really an asymmetry in which failure mode Kubernetes\' own designers judged more costly (under-provisioning during a spike vs. thrashing during a lull), not a difference in the underlying aggregation MECHANISM, which is symmetric in structure (max for down, min for up) even though the defaults make it look asymmetric.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Scale-down: the window picks the MAXIMUM recommendation',
      language: 'bash',
      code: `# The main page's own scaleDown config:
# behavior:
#   scaleDown:
#     stabilizationWindowSeconds: 300
#     policies:
#       - type: Percent
#         value: 10
#         periodSeconds: 60

# HPA's own recommendation history over the last 5 minutes (what the
# control loop calculated EACH time it ran, every 15s):
#   t=0s:   20 replicas needed (traffic spike peak)
#   t=60s:  14 replicas needed (spike easing)
#   t=120s: 8 replicas needed  (mostly settled)
#   t=180s: 6 replicas needed
#   t=240s: 5 replicas needed
#   t=300s: 5 replicas needed  (now, at the end of the window)

# Scale-down uses the MAXIMUM across this whole window -- NOT the
# most recent (5) -- so the actual decision right now is still 20:
kubectl get hpa api-hpa
# NAME      REFERENCE        TARGETS   REPLICAS
# api-hpa   Deployment/api   40%/60%   20
# -- even though the CURRENT recommendation is just 5, the window's
#    own maximum (20, from t=0s) is what's actually applied -- this
#    is the main page's own quiz explanation, confirmed.`,
    },
    {
      label: 'Scale-up with a window: the OPPOSITE aggregation -- MINIMUM',
      language: 'bash',
      code: `# A team, following the main page's own "limit scale-up rate for
# workloads where rapid scaling is harmful" advice, adds a scale-up
# stabilization window -- ASSUMING (incorrectly, by symmetry with
# scale-down) that it also takes the maximum recommendation:
# behavior:
#   scaleUp:
#     stabilizationWindowSeconds: 60    # <- now actually has a window
#     policies:
#       - type: Percent
#         value: 100
#         periodSeconds: 15

# Recommendation history over the last 60 seconds:
#   t=0s:  3 replicas needed  (small initial bump)
#   t=15s: 9 replicas needed  (traffic ramping fast)
#   t=30s: 15 replicas needed (still ramping)
#   t=45s: 18 replicas needed
#   t=60s: 18 replicas needed (now)

# If this worked like scale-down (maximum), the decision would be 18.
# It does NOT -- scale-up with a window uses the MINIMUM across the
# window instead:
kubectl get hpa api-hpa
# NAME      REFERENCE        TARGETS   REPLICAS
# api-hpa   Deployment/api   85%/60%   3
# -- 3, not 18. The window's own MINIMUM (from t=0s) is what applied,
#    deliberately holding back scale-up even as load keeps climbing --
#    a real, surprising consequence of adding ANY scale-up window at
#    all, not something the main page's own single "use the maximum"
#    quiz explanation would predict for this direction.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Having read the main page\'s own quiz explanation that stabilization "uses the maximum" recommendation across the window, a team adds <code>scaleUp.stabilizationWindowSeconds: 60</code> to smooth out a bursty scale-up pattern, expecting HPA to keep using the highest replica count recommended in the last 60 seconds — the same logic that applies to scale-down. During a real traffic ramp, HPA instead scales up much more slowly than expected, using LOW replica counts from early in the window even as load keeps climbing. Using this subtopic\'s theory, why did adding this window produce the opposite effect from what the scale-down analogy predicted?',
    hint: 'Does a stabilization window aggregate recommendations the SAME way for both scale-up and scale-down, or does the choice of maximum-vs-minimum depend on which direction is being stabilized?',
    solution: 'Per this subtopic\'s theory, the main page\'s own "use the maximum" explanation is correct specifically for scale-down, but scale-up stabilization uses the OPPOSITE aggregation: the MINIMUM replica count recommended across the window, not the maximum. This is by design — "conservative" means something different depending on direction: for scale-down, conservative means keeping MORE pods (the maximum); for scale-up, conservative means adding FEWER pods (the minimum). By adding a 60-second scale-up window without realizing this asymmetry, the team caused HPA to hold back on scaling up to whatever the LOWEST recommendation was within that rolling window — during a genuine, sustained traffic ramp where recommendations keep climbing, that minimum is usually the earliest (and smallest) value in the window, producing exactly the sluggish, under-provisioned scale-up behavior observed. The fix is either removing the scale-up window entirely (matching the main page\'s own documented default of stabilizationWindowSeconds: 0, so every fresh recommendation applies immediately) or explicitly accounting for the minimum-based aggregation when choosing a non-zero scale-up window value.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A stabilization window works the same way for both scale-up and scale-down — it delays the decision and applies the MAXIMUM replica count recommended during that window, regardless of direction.',
      reality: 'Per this subtopic\'s theory, the aggregation is direction-specific: scale-down uses the maximum recommendation in the window (conservative = keep more pods), while scale-up uses the MINIMUM (conservative = add fewer pods) — the two directions pick opposite ends of the recommendation range.'
    },
    {
      thought: 'The main page\'s own default configuration (scaleUp: 0s window, scaleDown: 300s window) reflects a difference in the underlying stabilization MECHANISM between the two directions, not just a difference in chosen defaults.',
      reality: 'Per this subtopic\'s theory, the underlying mechanism is structurally symmetric (max for down, min for up) — the DEFAULTS differ because Kubernetes\' own designers judged under-provisioning during a spike more costly than briefly over-provisioning during a lull, not because the mechanism itself only exists in one direction.'
    },
    {
      thought: 'Adding a non-zero scaleUp.stabilizationWindowSeconds is a safe, purely-smoothing change that can only make scale-up slightly less twitchy, never meaningfully slower overall.',
      reality: 'Per this subtopic\'s exercise, adding ANY scale-up window changes the aggregation from "every fresh recommendation applies immediately" to "the minimum recommendation across the whole window applies" — during a sustained ramp, this can meaningfully delay scale-up well beyond what the window\'s own duration alone would suggest.'
    }
  ];
}
