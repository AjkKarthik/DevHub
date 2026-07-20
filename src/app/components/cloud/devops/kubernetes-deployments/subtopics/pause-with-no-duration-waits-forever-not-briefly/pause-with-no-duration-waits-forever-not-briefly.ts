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
  templateUrl: './pause-with-no-duration-waits-forever-not-briefly.html',
  styleUrl: './pause-with-no-duration-waits-forever-not-briefly.scss'
})
export class PauseWithNoDurationWaitsForeverNotBrieflySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own canary strategy only ever shows pause WITH a duration, never explaining what omitting it would do',
      points: [
        'The main page\'s own Argo Rollouts canary steps use `pause: { duration: 2m }` and `pause: { duration: 5m }` — both times with an explicit duration. Since every example on the page includes a duration, a reader has no way to learn from the page alone what a bare `pause: {}` (no duration field at all) would actually do, or whether it\'s even valid syntax.',
        'Argo Rollouts\' own documentation describes both cases directly: "If the duration field within the pause struct is set, the rollout will not progress to the next step until it has waited for the value of the duration field... Otherwise, the rollout will wait indefinitely until that Pause condition is removed." Omitting duration isn\'t an error or a default-to-zero — it\'s a categorically different behavior: an indefinite pause.',
      ]
    },
    {
      heading: 'Why this distinction is worth knowing even though the main page never uses it',
      points: [
        'An indefinite pause (`pause: {}`) requires manual intervention to proceed — per Argo Rollouts\' own docs, resuming it means running the `promote` command via the argo kubectl plugin. This is a fundamentally different guarantee than a timed pause: a timed pause automatically continues once the clock runs out, regardless of whether anyone is watching; an indefinite pause genuinely cannot proceed without a human (or an external automation) explicitly promoting it.',
        'The main page\'s own canary strategy, using only timed pauses, is fully automated end-to-end — it will reach 100% traffic on its own as long as the AnalysisTemplate keeps passing, with no human in the loop at all. Many real production canary setups deliberately want a DIFFERENT shape: automatic timed pauses for the early, low-risk traffic percentages, followed by one final indefinite pause before the last big jump (e.g. 50% to 100%) — giving a human a genuine checkpoint to review metrics and explicitly approve before the rollout can complete.',
        'Mixing both is exactly how Argo Rollouts\' own examples demonstrate this pattern working together in one strategy: a timed pause for an early automatic wait, followed later by an untimed `pause: {}` step specifically as the human gate — the same `pause` field, two different configurations, two genuinely different guarantees within a single canary strategy.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own canary -- fully automatic, no human gate at all',
      language: 'bash',
      code: `# The main page's own strategy, exactly as written:
# strategy:
#   canary:
#     steps:
#     - setWeight: 10
#     - pause: { duration: 2m }     # <-- automatically resumes
#                                   #     after 2 minutes
#     - analysis:
#         templates:
#         - templateName: success-rate
#     - setWeight: 50
#     - pause: { duration: 5m }     # <-- automatically resumes
#                                   #     after 5 minutes
#     - setWeight: 100

# Every pause step here has a duration -- per Argo Rollouts' own
# docs, this means the rollout "will not progress to the next step
# until it has waited for the value of the duration field," and
# then it DOES progress automatically. No human ever needs to
# intervene for this specific strategy to reach 100% traffic --
# assuming the AnalysisTemplate keeps passing, this rollout
# completes entirely on its own.`,
    },
    {
      label: 'Adding a genuine human checkpoint before the final jump to 100%',
      language: 'bash',
      code: `# strategy:
#   canary:
#     steps:
#     - setWeight: 10
#     - pause: { duration: 2m }
#     - analysis:
#         templates:
#         - templateName: success-rate
#     - setWeight: 50
#     - pause: {}          # <-- NO duration field at all
#                          # Per Argo Rollouts' own docs: "the
#                          # rollout will wait indefinitely until
#                          # that Pause condition is removed"
#     - setWeight: 100

# At the 50% step, this rollout now STOPS and stays stopped,
# indefinitely, no matter how long anyone waits -- there is no
# clock counting down. Per Argo Rollouts' own docs, someone has to
# explicitly run:
kubectl argo rollouts promote myapp -n production

# ...to move past this specific step. This is the same "promote"
# command the main page's own "Manual Rollout commands" section
# already lists -- but the main page never connects it to the idea
# that a pause step can be DESIGNED to require exactly this
# command, rather than promote just being an optional early-exit
# for an otherwise-automatic rollout.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team copies the main page\'s own canary strategy but changes the final `pause: { duration: 5m }` to `pause: {}`, specifically wanting a mandatory human approval gate before the last jump to 100% traffic. A week later, they notice a rollout has been sitting at 50% traffic for three days with nobody having done anything to it, and are confused why it never "timed out" and continued on its own. Using this subtopic\'s theory, explain whether this is a bug.',
    hint: 'Per this subtopic\'s theory, does an Argo Rollouts pause step with no duration field EVER resume on its own, no matter how much time passes?',
    solution: 'This is not a bug — it is exactly the behavior the team asked for by changing `pause: { duration: 5m }` to `pause: {}`. Per this subtopic\'s theory, Argo Rollouts\' own docs are explicit that omitting the duration field means "the rollout will wait indefinitely until that Pause condition is removed" — there is no implicit timeout, no fallback duration, and no scenario where an indefinite pause resumes purely from elapsed time, regardless of whether that\'s 5 minutes or 5 days. The rollout sitting at 50% for three days simply means nobody has run `kubectl argo rollouts promote myapp -n production` yet — exactly the manual gate the team said they wanted. The fix isn\'t a bug fix at all; it\'s a process fix — someone on the team needs to actually review the canary\'s metrics and run the promote command, since per this subtopic\'s theory, that\'s the ONLY way this specific step was ever going to move forward.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'An Argo Rollouts `pause` step without an explicit duration just uses some default wait time (like the platform\'s own default timeout) rather than genuinely waiting forever.',
      reality: 'Per this subtopic\'s theory, Argo Rollouts\' own docs are explicit that omitting duration means the rollout "will wait indefinitely until that Pause condition is removed" — there is no implicit default duration or timeout. It genuinely waits until a human (or automation) explicitly promotes it, however long that takes.'
    },
    {
      thought: 'Since the main page\'s own canary strategy only demonstrates timed pauses, an indefinite pause (pause: {}) must be unusual or non-standard Argo Rollouts syntax.',
      reality: 'This subtopic\'s theory shows it\'s a fully documented, standard part of the pause step\'s own behavior — the main page simply never demonstrates it because its own strategy happens to be fully automated end-to-end. Argo Rollouts\' own docs show timed and indefinite pauses combined in the same strategy as a common, intentional pattern.'
    },
    {
      thought: 'Adding a mandatory human-approval gate to a canary rollout requires a different mechanism entirely from the pause steps already used for automatic timed waits — some separate "approval" feature.',
      reality: 'Per this subtopic\'s theory, it\'s the exact same `pause` field the main page\'s own timed steps already use — just with the duration field omitted. No separate approval mechanism is needed; the human gate and the automatic timed waits are two configurations of the identical step type.'
    }
  ];
}
