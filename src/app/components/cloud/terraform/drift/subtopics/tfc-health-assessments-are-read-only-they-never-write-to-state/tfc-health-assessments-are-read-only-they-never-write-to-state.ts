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
  templateUrl: './tfc-health-assessments-are-read-only-they-never-write-to-state.html',
  styleUrl: './tfc-health-assessments-are-read-only-they-never-write-to-state.scss'
})
export class TfcHealthAssessmentsAreReadOnlyTheyNeverWriteToStateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions Terraform Cloud drift detection in passing, without saying what it actually does to state',
      points: [
        'The main page\'s quick reference lists "Terraform Cloud drift: Built-in scheduled drift detection with notifications," and its theory bullet adds "Terraform Cloud: built-in drift detection with scheduled runs and health assessments." Both correctly describe that TFC finds drift on a schedule — but neither says whether that scheduled detection actually CHANGES anything, or just reports.',
      ]
    },
    {
      heading: 'The answer: health assessments are strictly read-only — they never modify state or infrastructure',
      points: [
        'A Terraform Cloud health assessment runs a <code>plan</code>-equivalent check against a workspace on a schedule, comparing real infrastructure to state — but it stops there. It does not apply anything, and critically, it does NOT update the state file to reflect whatever drift it found, unlike a manually-run <code>terraform apply -refresh-only</code> (the main page\'s own Option 2 remediation), which DOES write the current real values into state.',
        'This is a meaningful, easy-to-miss distinction from the local workflow: running <code>-refresh-only</code> locally is a two-step "detect, then optionally accept into state" flow where the second step is a deliberate action you take. A TFC health assessment only ever performs the equivalent of the FIRST step, automatically, on a schedule — it surfaces the finding (via the UI and notifications) but leaves the actual "accept into state" decision, and the action itself, entirely up to a human.',
      ]
    },
    {
      heading: 'The practical consequence: a health assessment alert is informational, not a fix — it does not self-resolve',
      points: [
        'Seeing a health assessment flag drift and waiting for it to "clear itself" on the next scheduled run is a mistake — since the assessment never wrote anything to state, the SAME drift will be reported again on the next scheduled run, indefinitely, until a human runs an actual remediation (an <code>apply -refresh-only</code> to accept it, or a normal <code>apply</code> to revert it).',
        'This mirrors the main page\'s own three-option framework for responding to drift (fix, accept, ignore) — a health assessment alert is simply the automated TRIGGER for that decision, not a substitute for making and executing it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What a health assessment DOES',
      language: 'bash',
      code: `# Terraform Cloud, workspace settings:
# Health > Drift Detection > Enabled, schedule: every 24h

# Every 24 hours, TFC automatically:
#   1. Runs a plan-equivalent refresh + comparison against the
#      real infrastructure for this workspace
#   2. If differences are found, marks the workspace UNHEALTHY
#      and surfaces the specific drifted resources in the UI
#   3. Sends a notification (Slack/email/webhook) if configured
#
# That's it. No apply happens. No state is written.`,
    },
    {
      label: 'What it does NOT do (contrast with the local flow)',
      language: 'bash',
      code: `# Locally, the main page's own Option 2 response is TWO steps:
terraform plan -refresh-only     # step 1: DETECT drift (read-only)
terraform apply -refresh-only    # step 2: ACCEPT it -- WRITES to state

# A TFC health assessment only ever performs the equivalent of
# step 1, automatically, on a schedule. It NEVER performs step 2
# on its own -- someone still has to:
#
#   - open the workspace in TFC, review the detected drift, and
#     manually queue a run (a real plan/apply, or a refresh-only
#     run) to actually resolve it
#
# Until that happens, the SAME drift is reported again on every
# subsequent scheduled assessment -- it does not self-resolve or
# stop alerting just because it was already seen once.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team enables health assessments on a critical production workspace, sees a drift notification fire, and decides "the schedule will keep checking anyway, we\'ll deal with it later." Two weeks and 14 scheduled assessments later, they\'re still getting the same drift notification every day. Why hasn\'t it gone away, and what needs to happen for it to stop?',
    hint: 'Does a health assessment run ever write the drifted value into state on its own, or does someone still need to take an action?',
    solution: 'The notification keeps recurring because a health assessment is strictly read-only — it detects drift and reports it, but never writes anything to state or applies any changes on its own, unlike a manually-run terraform apply -refresh-only. Since nothing about the underlying discrepancy between state and reality has changed, every subsequent scheduled assessment finds the exact same drift and reports it again, indefinitely. For the notifications to stop, a human needs to actually act on the finding: either run a real apply -refresh-only to accept the drift into state, or run a normal apply to revert the manual change and restore the HCL-defined configuration — the health assessment itself will never perform either of these automatically.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Terraform Cloud health assessment that detects drift automatically updates the workspace\'s state to match reality, the same way a manual terraform apply -refresh-only would.',
      reality: 'Per this subtopic\'s theory, health assessments are strictly read-only — they detect and report drift on a schedule but never write anything to state; only a manually-triggered apply -refresh-only (or a normal apply) actually changes state or infrastructure.'
    },
    {
      thought: 'Once a health assessment has flagged a particular drift once, that same drift will not be reported again on future scheduled runs, since Terraform Cloud already knows about it.',
      reality: 'Per this subtopic\'s theory, a health assessment alert does not self-resolve — since nothing about state or infrastructure changes as a result of the assessment itself, the same drift is reported again on every subsequent scheduled run until a human takes a real remediation action.'
    },
    {
      thought: 'Enabling scheduled health assessments in Terraform Cloud is a complete drift-remediation solution on its own, replacing the need for anyone to manually run -refresh-only or apply.',
      reality: 'Per this subtopic\'s theory, health assessments are only the automated DETECTION half of the main page\'s fix/accept/ignore framework — the actual remediation action (running an apply of some kind) is still a manual step a human has to take.'
    }
  ];
}
