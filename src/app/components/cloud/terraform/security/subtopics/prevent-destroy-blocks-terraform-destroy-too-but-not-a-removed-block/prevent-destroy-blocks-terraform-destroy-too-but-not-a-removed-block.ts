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
  templateUrl: './prevent-destroy-blocks-terraform-destroy-too-but-not-a-removed-block.html',
  styleUrl: './prevent-destroy-blocks-terraform-destroy-too-but-not-a-removed-block.scss'
})
export class PreventDestroyBlocksTerraformDestroyTooButNotARemovedBlockSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names prevent_destroy as a guard without stating its actual protection boundary',
      points: [
        'The main page\'s quick reference describes <code>prevent_destroy = true</code> only as a "Lifecycle guard against accidental resource destruction," and its revision summary calls it a guard "for production databases and state buckets" — true, but vague enough to leave two important questions unanswered: does it block an EXPLICIT <code>terraform destroy</code> command, or only accidental destroys caused by a config change? And is there any way around it?',
      ]
    },
    {
      heading: 'What it actually blocks: any plan that would destroy the resource — including a full terraform destroy',
      points: [
        'When <code>prevent_destroy = true</code> is set on a resource, Terraform rejects ANY plan that would destroy that resource\'s infrastructure object — this includes a config change requiring replacement, AND running <code>terraform destroy</code> directly against the whole configuration. The error is explicit: "Instance cannot be destroyed... Resource ... has lifecycle.prevent_destroy set, but the plan calls for this resource to be destroyed." This is a genuinely broader guard than "accidental" alone suggests — it protects against a deliberate, explicit destroy command too, not just an unintended side effect of some other change.',
      ]
    },
    {
      heading: 'What fully bypasses it: removing the resource block (or the lifecycle block) from configuration first',
      points: [
        'prevent_destroy only protects a resource while its resource block — including the lifecycle block itself — remains in the configuration Terraform is actually reading. If the entire resource block is deleted from the .tf files, Terraform no longer sees any lifecycle rule for it at all, and the next apply is free to destroy it exactly as if the guard had never existed.',
        'This makes the real workflow to intentionally destroy a protected resource explicitly two-step: first remove (or set to false) the <code>prevent_destroy</code> rule and apply that change, THEN run the destroy — the guard cannot be bypassed in a single step, which is precisely the point (it makes destroying the resource deliberate, not something that happens as an accidental side effect of one command).',
        'A second, more manual bypass exists outside the plan/apply path entirely: directly manipulating state (<code>terraform state rm</code>, or hand-editing the state file) removes Terraform\'s own tracking of the resource without ever generating a plan that <code>prevent_destroy</code> would evaluate — the guard only intercepts plan-based destroys, not state surgery that sidesteps planning altogether.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'prevent_destroy blocks an explicit destroy too',
      language: 'bash',
      code: `resource "aws_db_instance" "prod" {
  identifier = "prod-db"
  # ...
  lifecycle {
    prevent_destroy = true
  }
}

$ terraform destroy
# Error: Instance cannot be destroyed
#
#   on main.tf line 12:
#   12: resource "aws_db_instance" "prod" {
#
# Resource aws_db_instance.prod has lifecycle.prevent_destroy
# set, but the plan calls for this resource to be destroyed.
# To avoid this error and continue with the destroy, you must
# either remove the resource from the configuration, or reduce
# the scope of the destroy using the -target flag.

# terraform destroy is BLOCKED, exactly like an accidental
# destroy from a config change would be -- prevent_destroy does
# not distinguish "explicit destroy command" from "accidental
# side effect", it blocks the underlying destroy PLAN either way.`,
    },
    {
      label: 'The two-step (intentional) way around it',
      language: 'bash',
      code: `# Step 1: remove (or set false) the guard, and APPLY that change first
resource "aws_db_instance" "prod" {
  identifier = "prod-db"
  # lifecycle block removed entirely
}
$ terraform apply
# Applies cleanly -- no destroy is planned, just the lifecycle
# rule itself being removed from the resource's tracked config.

# Step 2: NOW destroy is actually possible
$ terraform destroy
# Succeeds -- prevent_destroy no longer applies, since Terraform
# no longer sees ANY lifecycle rule for this resource.

# The unsafe shortcut that bypasses the guard WITHOUT going
# through a plan at all:
$ terraform state rm aws_db_instance.prod
# Removes Terraform's tracking of the resource -- no plan is
# generated, so prevent_destroy never gets a chance to evaluate
# anything. The real infrastructure still exists but is now
# completely untracked.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A production database has lifecycle { prevent_destroy = true } set. An engineer, under time pressure, runs terraform destroy -target=aws_db_instance.prod expecting the -target flag to bypass the lifecycle guard for just that one resource. Does this work? Separately, what IS a valid way to actually destroy this resource through Terraform?',
    hint: 'Does -target change what prevent_destroy evaluates, or just which resources are included in the plan prevent_destroy still checks?',
    solution: 'No, -target does not bypass prevent_destroy — the flag only narrows which resources are included in the plan\'s scope; prevent_destroy still evaluates and blocks the destroy plan for that targeted resource exactly as it would without -target, producing the same "Instance cannot be destroyed" error. The valid way to actually destroy the resource through Terraform is the two-step process: first remove (or set to false) the prevent_destroy rule in the resource\'s lifecycle block and apply that change on its own (this succeeds since no destroy is planned, only a config change to the lifecycle rule itself), and only then run terraform destroy — at that point Terraform no longer sees any lifecycle guard for the resource and the destroy proceeds normally.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s description of prevent_destroy as a guard against "accidental" resource destruction means it only blocks unintended side effects of other changes, not an explicit terraform destroy command run deliberately.',
      reality: 'Per this subtopic\'s theory, prevent_destroy blocks ANY plan that would destroy the resource, including an explicit terraform destroy run directly against the whole configuration — it makes no distinction between "accidental" and "deliberate," it blocks the underlying destroy plan either way.'
    },
    {
      thought: 'The -target flag on terraform destroy can be used to bypass a prevent_destroy guard for one specific resource while leaving the guard in place for everything else.',
      reality: 'Per this subtopic\'s theory, -target only changes which resources are included in a plan\'s scope — it does not disable or skip prevent_destroy\'s evaluation for any resource still governed by that lifecycle rule.'
    },
    {
      thought: 'Once prevent_destroy = true is set on a resource, there is no way to ever destroy that resource through Terraform again without editing the state file by hand.',
      reality: 'Per this subtopic\'s theory, prevent_destroy can be removed deliberately through a normal two-step process — apply a config change removing the lifecycle rule first, then run destroy — no state file editing needed for the standard, intentional path.'
    }
  ];
}
