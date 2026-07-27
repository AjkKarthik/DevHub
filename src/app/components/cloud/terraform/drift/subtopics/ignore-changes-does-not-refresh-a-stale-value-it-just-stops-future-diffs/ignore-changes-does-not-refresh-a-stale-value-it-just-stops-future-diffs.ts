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
  templateUrl: './ignore-changes-does-not-refresh-a-stale-value-it-just-stops-future-diffs.html',
  styleUrl: './ignore-changes-does-not-refresh-a-stale-value-it-just-stops-future-diffs.scss'
})
export class IgnoreChangesDoesNotRefreshAStaleValueItJustStopsFutureDiffsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page recommends ignore_changes to suppress drift noise, without saying what happens to drift that already existed',
      points: [
        'The main page\'s "Responding to Drift" section lists Option 3 as: "Ignore in plan: lifecycle { ignore_changes = [tags] } to suppress tag drift noise." This correctly describes what ignore_changes does GOING FORWARD — but it says nothing about a resource that had ALREADY drifted on that attribute before ignore_changes was added.',
      ]
    },
    {
      heading: 'What actually happens: ignore_changes only silences future diffs — it never captures the current real value into state',
      points: [
        'Adding <code>ignore_changes = [some_attribute]</code> to a resource\'s lifecycle block tells Terraform to stop proposing plan changes for that specific attribute from that point forward. It does NOT trigger a refresh, and it does NOT update state to reflect whatever the attribute\'s real, current value actually is right now.',
        'This means: if the attribute had ALREADY drifted (real infrastructure shows a different value than what state records) at the moment ignore_changes was added, that stale, pre-drift value simply stays in state indefinitely — ignore_changes did nothing to correct or refresh it, it only stopped Terraform from ever mentioning the discrepancy in a plan again.',
      ]
    },
    {
      heading: 'The fix: refresh BEFORE (or immediately after) adding ignore_changes, not instead of it',
      points: [
        'To get an accurate, current value into state before silencing future diffs on that attribute, run <code>terraform apply -refresh-only</code> first (or right after adding the lifecycle rule) — this is the exact "accept drift into state" workflow the main page\'s own Option 2 describes, just applied specifically as a prerequisite step before Option 3 rather than as an alternative to it.',
        'Skipping this step means any code, tooling, or teammate that reads the "current" state value for that attribute (via <code>terraform show</code>, a remote state data source, or an output) continues to see the OLD, pre-drift value — silently wrong, with no warning, since <code>ignore_changes</code> has specifically suppressed the one mechanism (the plan diff) that would otherwise have flagged it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Adding ignore_changes on top of EXISTING drift (wrong)',
      language: 'bash',
      code: `# Reality: desired_capacity was manually bumped from 3 to 8
# a week ago, directly in the AWS console. State still says 3.

resource "aws_autoscaling_group" "app" {
  desired_capacity = 3   # what HCL/state believe -- STALE, real is 8
  lifecycle {
    ignore_changes = [desired_capacity]   # added TODAY, after the drift
  }
}

$ terraform plan
# No changes. -- but state STILL says desired_capacity = 3.
# ignore_changes never refreshed anything -- it just stopped
# Terraform from ever telling you state disagrees with reality.

$ terraform show | grep desired_capacity
# desired_capacity = 3   # WRONG -- real value is 8, state never updated`,
    },
    {
      label: 'Refresh FIRST, then rely on ignore_changes going forward',
      language: 'bash',
      code: `# Step 1: capture the CURRENT real value into state
terraform apply -refresh-only
# Reviews and accepts: desired_capacity: 3 -> 8 (state updated,
# no real infra changes made)

# Step 2: NOW add ignore_changes -- state already reflects reality,
# so silencing future diffs on this attribute is safe going forward
resource "aws_autoscaling_group" "app" {
  desired_capacity = 3   # HCL can stay as-is -- ignored anyway
  lifecycle {
    ignore_changes = [desired_capacity]
  }
}

$ terraform show | grep desired_capacity
# desired_capacity = 8   # CORRECT -- state matches reality now`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team notices an aws_instance\'s instance_type has been manually changed in the console from t3.micro to t3.large. Instead of reconciling it, they immediately add lifecycle { ignore_changes = [instance_type] } to silence the noise in future plans, and consider the issue closed. Six months later, a script that reads terraform show -json to audit instance sizes reports every instance as t3.micro, even though this one is really t3.large. What went wrong?',
    hint: 'Does adding ignore_changes refresh state to capture the CURRENT real value, or does it just stop Terraform from mentioning the difference going forward?',
    solution: 'ignore_changes never refreshed the resource\'s state — it only stops Terraform from proposing a plan change for instance_type going forward. Since the drift (t3.micro in state vs. t3.large in reality) already existed BEFORE ignore_changes was added, and the team never ran terraform apply -refresh-only to capture the current real value into state first, the state file has permanently kept the stale t3.micro value. The audit script reading terraform show -json is reading exactly what state says, which is now silently wrong with no plan diff ever surfacing the discrepancy again (since ignore_changes suppressed that mechanism). The fix would have been running terraform apply -refresh-only to update state to t3.large BEFORE (or immediately after) adding the ignore_changes rule.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Adding ignore_changes = [attribute] to a resource\'s lifecycle block captures whatever the attribute\'s current real value is at that moment into state, then ignores it going forward.',
      reality: 'Per this subtopic\'s theory, ignore_changes does not trigger a refresh or capture anything into state — it only stops Terraform from proposing plan changes for that attribute from that point forward, leaving whatever value was already in state (even if stale) untouched.'
    },
    {
      thought: 'If a resource has already drifted on some attribute, adding ignore_changes for that attribute is a complete fix — the drift problem is now "handled."',
      reality: 'Per this subtopic\'s theory, ignore_changes only silences the SYMPTOM (the plan diff) — the underlying state value stays stale unless a terraform apply -refresh-only is run first to actually capture the current real value.'
    },
    {
      thought: 'terraform show or a remote state data source always reflects the current real value of every resource attribute, since Terraform continuously tracks infrastructure.',
      reality: 'Per this subtopic\'s theory, state only reflects reality as of the last refresh — an attribute under ignore_changes that drifted before its state was ever refreshed can show a permanently stale value in terraform show or any downstream state reader, with no automatic correction.'
    }
  ];
}
