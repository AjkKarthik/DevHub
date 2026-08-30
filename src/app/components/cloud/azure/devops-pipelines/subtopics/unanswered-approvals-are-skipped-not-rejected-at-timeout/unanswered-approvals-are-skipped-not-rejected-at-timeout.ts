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
  templateUrl: './unanswered-approvals-are-skipped-not-rejected-at-timeout.html',
  styleUrl: './unanswered-approvals-are-skipped-not-rejected-at-timeout.scss'
})
export class UnansweredApprovalsAreSkippedNotRejectedAtTimeoutSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes approval gates as a pause-and-wait mechanism without saying what happens if nobody responds',
      points: [
        'The main page\'s own theory states: "When a stage targets an environment with approvals, the pipeline pauses and waits for a named approver to approve (or reject) before proceeding." This frames the outcome as binary — approve or reject — as though the pipeline will simply wait indefinitely, or as though a non-response eventually counts as one of those two outcomes.',
        'Neither framing is quite right. An approval check has its own configured Timeout, and what happens when that timeout is reached is a specific, third outcome — distinct from both an explicit approval and an explicit rejection.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own approvals reference: an unanswered approval times out to "skipped," not "rejected" or "still pending"',
      points: [
        'Per Microsoft\'s own documentation on configuring an approval check: "specify your desired Timeout. If approvals aren\'t completed within the specified Timeout, the stage is marked as skipped." A stage marked skipped is a distinct pipeline outcome from both a successful deployment and a failed/rejected one — worth knowing if downstream automation or reporting treats "skipped" differently than "failed."',
        'This matters for anything that depends on the stage\'s outcome — a monitoring dashboard, a notification rule, or a subsequent stage\'s own condition (succeeded(), failed()) may not fire the way a team expects if they assumed a timeout behaves like an explicit rejection.',
        'A separate, easy-to-miss nuance: "The list of users who can review an Approval is fixed at the time approvals & checks start running... changes to the list of users and groups of an approval check done after checks start executing aren\'t picked up." Adding an approver to the check\'s configuration WHILE a run is already waiting doesn\'t let that newly-added person approve the run currently in progress — only future runs see the updated approver list.',
      ]
    },
    {
      heading: 'Related approval mechanics worth knowing alongside the timeout behavior',
      points: [
        'Approvals are one of five categories of "checks" evaluated in a fixed order (static checks, pre-check approvals, dynamic checks, post-check approvals, exclusive lock) — all checks across all resources used by a stage must pass before that stage begins, and the timeout applies per-check, so a stage with multiple checks can time out on any one of them independently.',
        'A group can be configured as the approver — in that case, per Microsoft\'s own docs, "only one user within the group needs to approve for the run to proceed," meaning the approval doesn\'t require unanimous consent from every group member, just one.',
        'Deferred approvals let an approver approve now but schedule the effective time for later (e.g. approve during the day, but have the deployment gate open at a low-traffic evening window) — a mechanism for decoupling "when someone reviewed this" from "when the deployment is actually allowed to start" that the main page\'s framing doesn\'t capture at all.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What actually happens if nobody approves in time',
      language: 'bash',
      code: `# Environment: production
# Approval check configured with Timeout: 30 days (a common default choice)
#
# Pipeline reaches the DeployProd stage, pauses, and waits.
# If NO approver acts within the configured Timeout:
#
#   Per Microsoft's own docs: "If approvals aren't completed within
#   the specified Timeout, the stage is marked as skipped."
#
# This is NOT the same as:
#   - An explicit rejection (an approver actively clicking "Reject")
#   - The run staying "in progress" indefinitely
#
# A downstream condition like this behaves differently than many
# teams expect for a timed-out stage:
- stage: PostDeployNotify
  dependsOn: DeployProd
  condition: failed()   # does NOT fire for a SKIPPED stage
  jobs: [...]

- stage: PostDeployNotify2
  dependsOn: DeployProd
  condition: in(dependencies.DeployProd.result, 'Skipped')  # DOES catch it
  jobs: [...]`,
    },
    {
      label: 'Approver list is snapshotted when the check starts — a real gotcha',
      language: 'bash',
      code: `# Scenario: DeployProd stage is currently paused, waiting on
# approval from the "release-managers" group.
#
# Someone realizes the on-call release manager isn't in that group
# yet, and adds them via:
az devops security group membership add \\
  --group-id <release-managers-group-id> \\
  --member-id <new-approver-object-id>
#
# Per Microsoft's own docs: "The list of users who can review an
# Approval is fixed at the time approvals & checks start running...
# changes... done after checks start executing aren't picked up."
#
# The newly-added approver CANNOT approve the run that's already
# waiting -- only a NEW run started after the membership change will
# see them as an eligible approver. The currently-paused run still
# needs an existing eligible approver, or it will eventually hit its
# Timeout and be marked Skipped.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A production deployment stage with an approval gate has been sitting unanswered for the full duration of its configured Timeout — nobody clicked approve or reject. A teammate assumes the stage will show up in the pipeline history as "Failed," the same as if a test had broken. Is that assumption correct, and why might it matter for a notification rule set up to alert on failed(), production deployment?',
    hint: 'Check what specific outcome Microsoft\'s own documentation describes for an approval that times out unanswered, and whether that outcome is the same pipeline result as an explicit failure.',
    solution: 'The assumption is not correct — per Microsoft\'s own documentation, "if approvals aren\'t completed within the specified Timeout, the stage is marked as skipped," not failed. This matters directly for a notification rule keyed on failed(): a condition like condition: failed() on a downstream stage or an alert rule watching for pipeline failures will NOT fire for a timed-out approval, since Skipped is a distinct outcome from Failed. A team relying on failure alerts to catch "nobody approved the production deployment in time" would need a condition that also checks for the Skipped result specifically, e.g. in(dependencies.DeployProd.result, \'Skipped\'), or they\'ll have a silent gap where unanswered approvals go completely unnoticed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If nobody approves or rejects an environment approval check within its configured Timeout, the stage is automatically marked as Failed, the same as any other pipeline failure.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states an unanswered approval times out to a stage marked Skipped, not Failed — a distinct outcome that a condition like failed() will not catch.'
    },
    {
      thought: 'Adding a new approver to an environment\'s approval check configuration immediately lets that person approve any run currently paused and waiting on that same check.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states the eligible-approver list is "fixed at the time approvals & checks start running" — a newly-added approver can only act on future runs, not one already in progress.'
    },
    {
      thought: 'When a group (rather than an individual) is configured as the approver on an environment, every member of that group must approve before the run can proceed.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states plainly that "only one user within the group needs to approve for the run to proceed" — group approval requires just one member\'s action, not unanimous consent.'
    }
  ];
}
