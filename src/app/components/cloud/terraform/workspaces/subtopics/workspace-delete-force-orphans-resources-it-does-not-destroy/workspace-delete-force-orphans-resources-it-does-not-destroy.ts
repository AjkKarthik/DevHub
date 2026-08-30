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
  templateUrl: './workspace-delete-force-orphans-resources-it-does-not-destroy.html',
  styleUrl: './workspace-delete-force-orphans-resources-it-does-not-destroy.scss'
})
export class WorkspaceDeleteForceOrphansResourcesItDoesNotDestroySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the fact in one QnA clause, and never mentions the flag that makes it dangerous',
      points: [
        'The main page\'s QnA on workspace limitations includes the clause "Deleting a workspace does not destroy the resources tracked in its state file" — accurate, but buried mid-list among five other limitations. Its quick reference separately says <code>terraform workspace delete</code> requires the workspace to be "empty," which reads as though Terraform simply prevents this situation entirely. Neither mention covers the flag that removes that protection.',
      ]
    },
    {
      heading: 'The empty-workspace check is a real safety guard — and -force disables it',
      points: [
        'By default, <code>terraform workspace delete</code> genuinely refuses to delete a workspace whose state still tracks resources. This is the protection the main page\'s "must be empty" quick-reference note is describing, and it works: an accidental delete of a workspace with live infrastructure is blocked outright.',
        '<code>terraform workspace delete -force</code> bypasses that check. The workspace and its state are deleted, but the REAL cloud resources that state was tracking are not touched at all — they continue to exist and cost money, now with nothing recording that they exist or which configuration created them. These are commonly called "dangling" or orphaned resources.',
        'Recovering orphaned resources means finding them manually (cloud console, CloudTrail/audit logs, tag searches) and re-importing each one into a state file with <code>terraform import</code> — the same recovery path as any other state-loss scenario, but self-inflicted and easy to avoid.',
      ]
    },
    {
      heading: 'The correct order, and the one legitimate use for -force',
      points: [
        'The safe sequence is destroy-then-delete: switch INTO the workspace, run <code>terraform destroy</code>, confirm the state is genuinely empty with <code>terraform state list</code>, switch AWAY to another workspace, and only then delete the now-empty workspace — at which point the default empty-check passes on its own and <code>-force</code> is never needed.',
        '<code>-force</code> does have one legitimate use: deliberately handing resources off to be managed by something else (another Terraform configuration, another tool, or manually) while intentionally stopping Terraform from tracking them. That is a real scenario — the problem is that the flag looks like a routine "just get past this annoying error" escape hatch, and is most often reached for in exactly the situation where it causes silent orphaning.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The default protection working as intended',
      language: 'bash',
      code: `terraform workspace select default
terraform workspace delete pr-123

# Error: Workspace "pr-123" is not empty.
#
# Deleting "pr-123" can result in dangling resources: resources
# that exist but are no longer manageable by Terraform. Please
# destroy these resources first. If you want to delete this
# workspace anyway and risk dangling resources, run this command
# with the '-force' flag.

# This is the protection the main page's "must be empty" note
# describes -- and it genuinely works.`,
    },
    {
      label: '-force: the workspace goes, the infrastructure stays',
      language: 'bash',
      code: `terraform workspace delete -force pr-123
# Deleted workspace "pr-123"!

# What actually happened:
# - The workspace and its state file: GONE
# - The EC2 instances, load balancer, RDS instance that state
#   was tracking: STILL RUNNING, still billing, now with
#   nothing recording that they exist or what created them.

# Recovery requires finding them by hand and re-importing:
# 1. Locate them (cloud console, CloudTrail, tag search)
# 2. Re-create a workspace/state and import each one:
#    terraform import aws_instance.app i-0abc123def456

# --- The safe sequence instead ---
terraform workspace select pr-123
terraform destroy                 # actually remove the infra
terraform state list              # confirm genuinely empty
terraform workspace select default
terraform workspace delete pr-123 # default check now passes,
                                   # no -force needed at all`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A CI pipeline tears down per-PR ephemeral environments by running `terraform workspace select default` then `terraform workspace delete pr-${PR_NUMBER}`. The job started failing with "Workspace is not empty," so a developer "fixed" it by adding `-force` to the delete command. Weeks later the AWS bill has climbed steadily with no obvious cause. What happened, and what should the pipeline do instead?',
    hint: 'What does the empty-workspace check actually protect against, and does bypassing it change anything about the real cloud resources?',
    solution: 'The "not empty" error was the safety guard correctly reporting that each PR workspace\'s state still tracked live resources — the pipeline was deleting workspaces without ever destroying their infrastructure first. Adding `-force` bypassed the check but did nothing to the actual resources: every PR environment\'s EC2 instances, load balancers, and databases kept running, now orphaned with no state recording them, which is exactly the steadily-climbing bill. The pipeline should instead destroy first: `terraform workspace select pr-$PR_NUMBER`, `terraform destroy -auto-approve`, then switch away and delete the now-genuinely-empty workspace — at which point the default check passes on its own and `-force` is never needed. The already-orphaned resources have to be found manually (console, CloudTrail, tag search) and either deleted directly or re-imported into state to be destroyed properly.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since terraform workspace delete requires the workspace to be empty (per the main page\'s own quick reference), Terraform structurally prevents ever deleting a workspace that still has live resources.',
      reality: 'Per this subtopic\'s theory, the empty-check is a default guard, not a structural impossibility — the -force flag disables it entirely, deleting the workspace and its state while leaving the real infrastructure running and untracked.'
    },
    {
      thought: 'terraform workspace delete -force destroys the resources tracked by that workspace as part of removing it, since it is the more forceful version of the command.',
      reality: 'Per this subtopic\'s theory, -force only forces past the empty-workspace CHECK — it never touches the actual cloud resources, which continue existing and billing with nothing left recording them.'
    },
    {
      thought: 'The -force flag exists purely as an escape hatch for the "not empty" error and has no legitimate intended use.',
      reality: 'Per this subtopic\'s theory, -force has a real intended use: deliberately handing resources off to another configuration or tool while intentionally stopping Terraform from tracking them — the danger is that it reads like a routine error-bypass and gets used in exactly the cases where orphaning is unintended.'
    }
  ];
}
