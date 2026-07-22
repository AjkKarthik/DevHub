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
  templateUrl: './selectpolicy-defaults-to-max-multiple-policies-pick-the-fastest-not-safest.html',
  styleUrl: './selectpolicy-defaults-to-max-multiple-policies-pick-the-fastest-not-safest.scss'
})
export class SelectpolicyDefaultsToMaxMultiplePoliciesPickTheFastestNotSafestSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own code tab only ever shows ONE policy per direction',
      points: [
        'The main page\'s own "HPA v2 (CPU + memory)" code tab defines exactly one `scaleDown` policy ("remove at most 10% per minute") and exactly one `scaleUp` policy ("can double replicas every 15s"). Every worked example on the page follows this same one-policy-per-direction pattern.',
        'The `policies:` field is plural for a reason the main page never demonstrates or explains — Kubernetes\' own HPA behavior spec supports MULTIPLE policies within a single direction, each expressing a different kind of rate limit (e.g. "at most 10% per minute" AND "at most 5 pods per minute"), and a separate field, `selectPolicy`, determines which one actually applies when they disagree.',
      ]
    },
    {
      heading: 'What actually happens with multiple policies: selectPolicy defaults to Max — the FASTEST-scaling policy wins, not the safest',
      points: [
        'Per Kubernetes\' own documented HPA behavior spec, when a direction (scaleUp or scaleDown) has more than one policy defined, `selectPolicy` chooses between them — and it defaults to `Max`, meaning Kubernetes evaluates EVERY policy and applies whichever one allows the LARGEST replica-count change for that scaling event.',
        'This is a genuinely easy assumption to get backwards: someone adding a SECOND, more restrictive policy to a direction — intending it as an additional safety cap — actually has NO effect by default, since `selectPolicy: Max` always picks the LEAST restrictive (fastest) of the two, silently ignoring the tighter one whenever the two policies disagree.',
        'The explicit fix is setting `selectPolicy: Min` for whichever direction should honor the MOST conservative of multiple defined policies instead — this single field flips the entire behavior from "fastest policy wins" to "slowest/safest policy wins," and is the only way multiple policies genuinely combine as a layered safety net rather than each one independently being able to authorize a faster change.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Adding a second, "safer" policy that silently does nothing',
      language: 'bash',
      code: `# A team wants scale-down to be doubly conservative -- combining
# the main page's own "10% per minute" cap with an ADDITIONAL,
# stricter absolute cap of "at most 2 pods per minute" -- assuming
# BOTH limits would apply together (the more restrictive one wins):
# behavior:
#   scaleDown:
#     stabilizationWindowSeconds: 300
#     policies:
#       - type: Percent
#         value: 10
#         periodSeconds: 60
#       - type: Pods
#         value: 2          # <- added, intended as a tighter safety cap
#         periodSeconds: 60
#     # selectPolicy not set -- defaults to Max

# Scaling down from 40 replicas:
#   Percent policy allows: 10% of 40 = 4 pods removed per minute
#   Pods policy allows:     2 pods removed per minute

kubectl get hpa api-hpa -w
# NAME      REFERENCE        REPLICAS
# api-hpa   Deployment/api   40
# api-hpa   Deployment/api   36   # <- removed 4, NOT 2
# -- selectPolicy: Max (the default) picked the Percent policy,
#    since it allows the LARGER change (4 > 2) -- the "safer" Pods
#    policy the team added had zero actual restraining effect.`,
    },
    {
      label: 'The fix: selectPolicy: Min makes the tighter cap actually bind',
      language: 'bash',
      code: `# The SAME two policies, with the one field the main page's own
# code tab never shows added explicitly:
# behavior:
#   scaleDown:
#     stabilizationWindowSeconds: 300
#     selectPolicy: Min       # <- the fix: honor the MOST restrictive
#     policies:
#       - type: Percent
#         value: 10
#         periodSeconds: 60
#       - type: Pods
#         value: 2
#         periodSeconds: 60

# Scaling down from 40 replicas, same two policies as before:
kubectl get hpa api-hpa -w
# NAME      REFERENCE        REPLICAS
# api-hpa   Deployment/api   40
# api-hpa   Deployment/api   38   # <- removed 2, the tighter cap now wins
# -- selectPolicy: Min correctly picks whichever policy allows the
#    SMALLER change (2 < 4) -- now the two policies genuinely combine
#    as a layered safety net, exactly as the team originally intended
#    when adding the second, stricter policy.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team defines two scale-down policies on their HPA — the main page\'s own "10% per minute" and an additional, stricter "2 pods per minute" cap — intending the tighter of the two to always apply as a safety net. They do not set <code>selectPolicy</code> explicitly. During a large scale-down event, replicas drop faster than the "2 pods per minute" cap should allow. Using this subtopic\'s theory, why didn\'t the stricter policy hold?',
    hint: 'What does <code>selectPolicy</code> default to when it is left unset, and does that default favor the policy allowing the LARGEST change or the SMALLEST change?',
    solution: 'Per this subtopic\'s theory, the stricter policy never actually took effect because selectPolicy defaults to Max when left unset — meaning Kubernetes evaluates every defined policy for that direction and applies whichever one allows the LARGEST replica-count change, not the smallest. With a "10% per minute" policy and a "2 pods per minute" policy both active, Max picks whichever number is bigger for the current replica count — for any count above 20 replicas, 10% exceeds 2 pods, so the Percent policy silently wins every time, and the "2 pods per minute" cap the team added as a safety net has no actual restraining effect at all. The fix is setting selectPolicy: Min explicitly on that direction\'s behavior block — this flips the selection to always honor whichever policy allows the SMALLEST change, which is what makes multiple policies genuinely combine as a layered safety net instead of each one independently being able to authorize a faster scaling rate than intended.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Defining multiple scaling policies for the same direction (e.g. both a Percent and a Pods policy for scaleDown) means Kubernetes applies the MOST RESTRICTIVE one automatically, since that\'s the intuitive "safety net" interpretation of adding more than one limit.',
      reality: 'Per this subtopic\'s theory, selectPolicy defaults to Max, meaning Kubernetes applies whichever policy allows the LARGEST change — the opposite of the "most restrictive wins" assumption — unless selectPolicy: Min is set explicitly.'
    },
    {
      thought: 'The main page\'s own code tab always showing exactly one policy per direction means multiple policies are a rare, advanced feature most HPA configurations never need to think about.',
      reality: 'Per this subtopic\'s exercise, the moment a second policy is added to a direction — a common, reasonable instinct when tuning scaling behavior — selectPolicy\'s default behavior becomes immediately relevant and can silently defeat the intended effect of adding that second policy.'
    },
    {
      thought: 'selectPolicy: Max and selectPolicy: Min only affect HOW FAST scaling happens overall — they don\'t change which specific policy\'s numeric value ends up governing a given scaling decision.',
      reality: 'Per this subtopic\'s theory, selectPolicy directly determines WHICH policy\'s number is used for each scaling decision, evaluated fresh every time — it is not a general speed dial, it is a per-event selection rule between the concrete policies defined for that direction.'
    }
  ];
}
