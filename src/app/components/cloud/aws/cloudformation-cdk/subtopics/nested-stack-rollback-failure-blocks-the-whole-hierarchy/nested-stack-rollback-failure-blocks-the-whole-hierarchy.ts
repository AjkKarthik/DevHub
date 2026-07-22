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
  templateUrl: './nested-stack-rollback-failure-blocks-the-whole-hierarchy.html',
  styleUrl: './nested-stack-rollback-failure-blocks-the-whole-hierarchy.scss'
})
export class NestedStackRollbackFailureBlocksTheWholeHierarchySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page covers nested stacks and automatic rollback separately — never their intersection',
      points: [
        'The main page\'s own theory states: "Nested stacks: modularize large templates by referencing child stacks via AWS::CloudFormation::Stack." Separately, elsewhere: "Stack rollback: on failure, CloudFormation rolls back to the previous known-good state automatically."',
        'Nothing on the main page addresses what happens when rollback itself is the thing that fails, specifically inside ONE nested stack among several siblings in the same hierarchy — an important gap, since the main page\'s own "one stack per logical unit" best practice actively encourages splitting infrastructure into exactly this kind of multi-stack hierarchy.',
      ]
    },
    {
      heading: 'AWS\'s own documented behavior: one nested stack\'s failed rollback halts the ENTIRE hierarchy — and the official fix is "contact AWS Support"',
      points: [
        'Per AWS\'s own troubleshooting documentation: "Because of potential resource dependencies between nested stacks, CloudFormation doesn\'t start cleaning up nested stack resources until all nested stacks have been updated or have rolled back. When a nested stack fails to roll back, CloudFormation cancels all operations, regardless of the state that the other nested stacks are in."',
        'This means even SIBLING nested stacks that updated or rolled back successfully get stuck in a cleanup-pending limbo — stack statuses AWS documents as UPDATE_COMPLETE_CLEANUP_IN_PROGRESS or UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS — purely because one OTHER nested stack elsewhere in the same hierarchy failed to roll back. A single bad nested stack holds the entire parent/root stack hostage, regardless of how well every other nested stack behaved.',
        'AWS documents two concrete causes: "A nested stack might fail to roll back because of changes that were made outside of CloudFormation, when the stack template doesn\'t accurately reflect the state of the stack. A nested stack might also fail if an Auto Scaling group in a nested stack had an insufficient resource signal timeout period when the group was created or updated."',
        'The striking contrast: for an ordinary (non-nested-stuck) UPDATE_ROLLBACK_FAILED stack, AWS\'s own adjacent documentation lists five concrete, self-service remedies — manually sending resource signals, syncing out-of-band changes, fixing IAM permissions, refreshing credentials, or skipping unrecoverable resources via ContinueUpdateRollback\'s ResourcesToSkip parameter. For THIS specific "nested stacks are stuck" scenario, AWS\'s own documented resolution is a single sentence: "To fix the stack, contact AWS Support." No self-service CLI or console path is documented at all.',
        'This directly sharpens the main page\'s own "one stack per logical unit" best practice and its "not one giant stack" mistake entry: splitting into nested stacks genuinely does reduce blast radius and update time for NORMAL, successful updates — but this specific failure mode (one nested stack\'s rollback itself failing) can still bring down the ENTIRE hierarchy at once, with no documented self-service recovery, unlike the isolated-failure story the main page\'s own stack-separation advice might otherwise imply.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the scenario the main page\'s own advice sets up',
      language: 'bash',
      code: `# A root stack with two nested stacks, matching the main page's own
# lifecycle-based separation advice (Network / Data / App) -- but
# nested rather than top-level sibling stacks:
# Resources:
#   NetworkStack: { Type: AWS::CloudFormation::Stack, ... }
#   DataStack:    { Type: AWS::CloudFormation::Stack, ... }

# A security group referenced by DataStack's own template is
# manually deleted OUTSIDE of CloudFormation (matching AWS's own
# documented cause: "changes that were made outside of
# CloudFormation, when the stack template doesn't accurately
# reflect the state of the stack"):
aws ec2 delete-security-group --group-id sg-manually-removed

# A routine update to the root stack fails during DataStack's own
# update, and DataStack's automatic rollback ALSO fails, because
# CloudFormation tries to roll back to a security group that no
# longer exists:
aws cloudformation update-stack --stack-name RootStack \\
  --template-body file://root-template.yaml
# ... some time later ...

aws cloudformation describe-stacks --stack-name RootStack \\
  --query 'Stacks[0].StackStatus'
# "UPDATE_ROLLBACK_FAILED"

# Check EVERY nested stack's own status -- NetworkStack updated and
# rolled back cleanly on its own, but is stuck waiting on DataStack:
aws cloudformation describe-stacks --stack-name NetworkStack \\
  --query 'Stacks[0].StackStatus'
# "UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS" -- NOT
# UPDATE_ROLLBACK_COMPLETE -- stuck exactly as AWS's own docs
# describe: "regardless of the state that the other nested stacks
# are in."`,
    },
    {
      label: 'What actually works here — and what doesn\'t',
      language: 'bash',
      code: `# The self-service path that WOULD work for an ORDINARY (non-nested,
# non-stuck) UPDATE_ROLLBACK_FAILED stack -- per AWS's own separate
# "Update rollback failed" troubleshooting section:
aws cloudformation continue-update-rollback \\
  --stack-name DataStack \\
  --resources-to-skip LogicalIdOfMissingSecurityGroup

# For THIS specific "nested stacks are stuck" scenario, AWS's own
# documented resolution is different -- there is no self-service CLI
# fix documented at all, only: "To fix the stack, contact AWS
# Support." Before opening the case, gather exactly what AWS's own
# support-contact guidance asks for:

# 1. The stack ID (not just the name):
aws cloudformation describe-stacks --stack-name RootStack \\
  --query 'Stacks[0].StackId'

# 2. The exact stuck status of EVERY nested stack in the hierarchy:
aws cloudformation describe-stacks --stack-name NetworkStack \\
  --query 'Stacks[0].StackStatus'
aws cloudformation describe-stacks --stack-name DataStack \\
  --query 'Stacks[0].StackStatus'

# 3. StackEvents for the specific nested stack that failed to roll
#    back, showing the root-cause resource failure:
aws cloudformation describe-stack-events --stack-name DataStack \\
  --query 'StackEvents[?ResourceStatus==\`UPDATE_ROLLBACK_FAILED\`]'

# Important: per AWS's own explicit warning elsewhere in the same
# troubleshooting guide, do NOT make further changes to resources in
# the stack outside of CloudFormation while waiting on support --
# "Making changes to the resources in your stack outside of
# CloudFormation might put your stack in an unrecoverable state."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own "separate stacks by lifecycle" best practice, a team splits a monolithic template into nested NetworkStack, DataStack, and ApiStack resources under one root stack. A routine deployment fails inside DataStack, and DataStack\'s own automatic rollback ALSO fails (a security group it depends on was deleted outside CloudFormation weeks earlier by an unrelated cleanup script). NetworkStack and ApiStack both completed their own parts of the update successfully in the same deployment. The team wants to keep operating — specifically, they want to run an unrelated, urgent update to ApiStack alone while they investigate DataStack separately. Using this subtopic\'s theory, explain whether that\'s possible, and what AWS\'s own documented path forward actually is.',
    hint: 'Per AWS\'s own troubleshooting documentation, does a SUCCESSFULLY updated/rolled-back nested stack in the SAME hierarchy remain independently operable while a SIBLING nested stack is stuck?',
    solution: 'Per this subtopic\'s theory, the team\'s plan to update ApiStack independently is not possible while DataStack remains stuck. AWS\'s own documentation is explicit that this is hierarchy-wide, not per-nested-stack: "CloudFormation doesn\'t start cleaning up nested stack resources until all nested stacks have been updated or have rolled back. When a nested stack fails to roll back, CloudFormation cancels all operations, regardless of the state that the other nested stacks are in." Even though ApiStack (and NetworkStack) completed their own portions of the update successfully, they remain in a cleanup-pending limbo state tied to the ROOT stack\'s own overall status, which is blocked by DataStack alone — there is no operation the team can run against ApiStack in isolation until the root stack itself is unblocked. Per this subtopic\'s theory, the actual documented path forward is narrower than the team hopes: AWS\'s own guidance for this specific "nested stacks are stuck" scenario states only "To fix the stack, contact AWS Support" — unlike an ordinary UPDATE_ROLLBACK_FAILED stack (which has five documented self-service remedies, including ContinueUpdateRollback\'s ResourcesToSkip parameter), there is no equivalent self-service CLI or console fix documented for a nested stack failing to roll back specifically because of out-of-band changes. The team should gather the stack ID, every nested stack\'s exact status, and the relevant StackEvents before opening an AWS Support case, and should avoid making any further manual changes to the affected resources in the meantime, per AWS\'s own separate warning about resources modified outside CloudFormation.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Splitting a large template into nested stacks (matching the main page\'s own recommended NetworkStack/DataStack/ApiStack pattern) means a failure in one nested stack is fully isolated from the others, the same way separate top-level SIBLING stacks would be.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states the opposite for a failed rollback specifically — nested stacks share a single hierarchy-wide cleanup gate, so one nested stack failing to roll back blocks operations across the ENTIRE hierarchy, regardless of how the others performed.'
    },
    {
      thought: 'Any stack stuck in a rollback-failure-adjacent state can always be recovered via ContinueUpdateRollback and its ResourcesToSkip parameter, the same self-service path documented for an ordinary UPDATE_ROLLBACK_FAILED stack.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation draws a real distinction — the specific "nested stacks are stuck" scenario has its own troubleshooting section, and its only documented resolution is contacting AWS Support, unlike the five self-service remedies listed for an ordinary rollback failure.'
    },
    {
      thought: 'A nested stack that itself updated or rolled back successfully is unaffected by a SIBLING nested stack\'s rollback failure elsewhere in the same hierarchy.',
      reality: 'Per this subtopic\'s exercise, a successfully-updated or successfully-rolled-back nested stack still gets stuck in a cleanup-pending state (UPDATE_COMPLETE_CLEANUP_IN_PROGRESS or UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS) and remains non-independently-operable until every nested stack in the hierarchy resolves.'
    }
  ];
}
