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
  templateUrl: './prevent-destroy-is-bypassed-by-removing-the-whole-resource-block.html',
  styleUrl: './prevent-destroy-is-bypassed-by-removing-the-whole-resource-block.scss'
})
export class PreventDestroyIsBypassedByRemovingTheWholeResourceBlockSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page correctly says prevent_destroy blocks apply, but implies it\'s a durable, resource-level guarantee',
      points: [
        'The main page\'s own quiz explanation is careful and correct as far as it goes: "prevent_destroy causes terraform apply to error if the execution plan includes destruction of that resource. It does not prevent manual deletion via cloud console." What it never mentions is a much easier, all-Terraform way the SAME protection quietly stops applying.',
      ]
    },
    {
      heading: 'prevent_destroy is not recorded anywhere except the CURRENT configuration text',
      points: [
        'Unlike some lifecycle behavior, Terraform does not persist a "this resource is protected" flag into the state file — <code>prevent_destroy = true</code> is only ever checked by re-reading the CURRENT <code>.tf</code> configuration at plan time. If a future plan is generated against configuration that no longer contains that lifecycle setting, there is nothing left anywhere to enforce it.',
      ]
    },
    {
      heading: 'The specific trap: removing the WHOLE resource block deletes its own protection along with it',
      points: [
        'The intuitive assumption is that <code>prevent_destroy = true</code> is a durable safety property attached to the resource, similar to a cloud-provider-level deletion lock — something that would need to be explicitly turned off before the resource could ever be removed.',
        'The reality is closer to the opposite: if someone removes the ENTIRE resource block from the configuration (not just the lifecycle setting inside it — the whole block, resource and all) — perhaps during a refactor, or by deleting what looks like unused code — the next plan sees no resource block at all for that address, and therefore no lifecycle rule to enforce. The plan proceeds to destroy the real infrastructure normally, with no error, since the protection was defined INSIDE the very block that just vanished.',
        'The only reliable way to intentionally retire a <code>prevent_destroy</code>-protected resource is a deliberate two-step change: first edit the lifecycle block to <code>prevent_destroy = false</code> and apply that (a plan with no other changes, purely toggling the flag), THEN remove the resource block entirely in a separate, later change — never delete the whole block in one step while still relying on the flag to catch a mistake.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What actually stays protected',
      language: 'bash',
      code: `resource "aws_rds_cluster" "main" {
  cluster_identifier = "prod-db"
  lifecycle {
    prevent_destroy = true
  }
}

# A plan that would destroy THIS resource, with the lifecycle
# block still present in config, correctly errors:
# Error: Instance cannot be destroyed
#   Resource aws_rds_cluster.main has lifecycle.prevent_destroy
#   set, but the plan calls for this resource to be destroyed.`,
    },
    {
      label: 'The trap: deleting the whole block skips the check entirely',
      language: 'bash',
      code: `# A refactor removes what looks like an unused resource --
# the ENTIRE block, lifecycle setting included, is deleted:
# (nothing left in the .tf file for aws_rds_cluster.main at all)

# terraform plan now sees NO resource block for this address --
# there is no lifecycle rule left anywhere to enforce, because
# the rule lived INSIDE the block that just disappeared.
# Plan proceeds normally:
#   # aws_rds_cluster.main will be destroyed
# No error. No warning about the lost protection. Apply
# succeeds and the production database is gone.

# The safe way to intentionally retire a protected resource --
# two SEPARATE applies, never one:
# Step 1: flip the flag, apply, confirm no other changes:
resource "aws_rds_cluster" "main" {
  cluster_identifier = "prod-db"
  lifecycle {
    prevent_destroy = false   # deliberate, reviewable, isolated
  }
}
# terraform apply  -- only the lifecycle setting changes

# Step 2 (separate change, later): NOW remove the block
# entirely -- the protection was already consciously lifted.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A production RDS cluster resource has `lifecycle { prevent_destroy = true }`, matching the main page\'s own example. During a large refactor, a developer deletes what they believe is dead code — including the entire aws_rds_cluster resource block, lifecycle setting and all — in one commit. terraform plan shows the cluster will be destroyed, with no error or warning about prevent_destroy. Why did the protection not trigger, and what two-step process would have caught this mistake instead?',
    hint: 'prevent_destroy is checked against the CURRENT configuration at plan time — ask what happens to that check when the block defining it is the thing that got deleted.',
    solution: 'prevent_destroy is not stored anywhere except inside the resource block\'s own current configuration text — Terraform re-reads it fresh from the .tf files at plan time, with nothing persisted to state. Since the entire resource block (lifecycle setting included) was deleted in the same commit, the next plan has no lifecycle rule left to check at all — there is no protection to trigger because the thing that defined the protection is gone. The safer two-step process: first apply a change that ONLY flips `prevent_destroy` to `false` (an isolated, reviewable plan showing no other changes), confirming the team has deliberately decided to lift the protection — THEN, in a separate later change, remove the resource block entirely. Deleting the whole block in one step, while still relying on prevent_destroy to catch a mistake, never gives the flag a chance to fire.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'prevent_destroy = true is a durable safety property recorded in the state file, similar to a cloud-provider deletion lock, that would need to be explicitly disabled before the resource could ever be removed.',
      reality: 'Per this subtopic\'s theory, prevent_destroy is checked only against the CURRENT .tf configuration at plan time and is never persisted to state — if the resource block defining it is deleted entirely, there is nothing left anywhere to enforce the protection.'
    },
    {
      thought: 'Deleting a resource block that has prevent_destroy = true set inside it will fail the same way an explicit destroy of that resource would.',
      reality: 'Per this subtopic\'s theory, this is the exact trap: deleting the WHOLE block removes the lifecycle rule along with the resource declaration, so the next plan sees no protection to check at all and proceeds to destroy the real infrastructure with no error.'
    },
    {
      thought: 'The only way prevent_destroy can be bypassed is through a manual deletion in the cloud console, entirely outside of Terraform, as the main page\'s own quiz explanation states.',
      reality: 'Per this subtopic\'s theory, that is one real bypass, but there is a second, entirely-within-Terraform one: removing the resource block from configuration also removes its lifecycle protection, since prevent_destroy is not durable independent of the block that declares it.'
    }
  ];
}
