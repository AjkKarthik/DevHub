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
  templateUrl: './moved-blocks-not-manual-edits-fix-a-renamed-resource.html',
  styleUrl: './moved-blocks-not-manual-edits-fix-a-renamed-resource.scss'
})
export class MovedBlocksNotManualEditsFixARenamedResourceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page says "never manually edit it" but never says what to do instead',
      points: [
        'The main page\'s Plan/Apply Lifecycle section states: "The state file is the source of truth — never manually edit it." True, but it stops there — it never addresses the extremely common situation that tempts someone to reach for a manual edit in the first place: renaming a resource block in the .tf file.',
      ]
    },
    {
      heading: 'Why a plain rename in the HCL looks like a destroy-and-recreate to Terraform',
      points: [
        'Every resource is addressed by <code>resource_type.resource_name</code> (matching the main page\'s own Resource Addressing section) — the state file maps that exact address to the real infrastructure ID.',
        'If a resource block is simply renamed in the .tf file — <code>aws_s3_bucket.data</code> becomes <code>aws_s3_bucket.app_data</code>, with the arguments otherwise unchanged — Terraform has no inherent way to know this is the SAME resource under a new name. From the state file\'s perspective, the old address just disappeared and a new, unrelated address appeared.',
        'The result: <code>terraform plan</code> shows a destroy of <code>aws_s3_bucket.data</code> and a create of <code>aws_s3_bucket.app_data</code> — for many resource types this is not just noisy, it is genuinely destructive (a real S3 bucket deleted and a new empty one created under a different name).',
      ]
    },
    {
      heading: 'moved blocks: the current, declarative, code-reviewable fix',
      points: [
        'A <code>moved</code> block (Terraform 1.1+) declares the rename directly in configuration: <code>moved { from = aws_s3_bucket.data\\n to = aws_s3_bucket.app_data }</code>. On the next <code>plan</code>, Terraform checks state for the <code>from</code> address, and if found, updates it to the <code>to</code> address instead of planning a destroy/create.',
        'Because it lives in a .tf file, a <code>moved</code> block goes through the same code review as any other configuration change, is tracked in version control alongside the rename it documents, and applies automatically for every teammate\'s next plan — no one needs to remember to run a separate manual command.',
        'This is the recommended default for renaming/refactoring within the same state file, per HashiCorp\'s own current guidance.',
      ]
    },
    {
      heading: 'terraform state mv: the older, imperative alternative, and when it is still the right tool',
      points: [
        '<code>terraform state mv aws_s3_bucket.data aws_s3_bucket.app_data</code> achieves the same underlying result directly against the state file, immediately, from the command line — but it is a manual, one-time action that lives in nobody\'s shell history by default, not in version control, and does not automatically apply itself for other teammates or in CI.',
        '<code>moved</code> blocks only work for addresses within the SAME state file. Moving a resource to a genuinely different state file (splitting a monolith config into multiple state files, for example) is outside what a <code>moved</code> block can express — <code>terraform state mv</code> (with its cross-state <code>-state-out</code> flag) remains the right tool for that specific case, alongside newer configuration-driven <code>import</code>/<code>removed</code> block combinations for the same scenario.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The problem: a plain rename looks like destroy + create',
      language: 'bash',
      code: `# Before: main.tf
resource "aws_s3_bucket" "data" {
  bucket = "my-app-data"
}

# After: someone just renames the block for clarity
resource "aws_s3_bucket" "app_data" {
  bucket = "my-app-data"
}

# terraform plan output -- NOT a no-op rename:
#   # aws_s3_bucket.data will be destroyed
#   # aws_s3_bucket.app_data will be created
# Terraform has no idea these are "the same" resource --
# it only sees an address that vanished and one that appeared.`,
    },
    {
      label: 'The fix: a moved block, code-reviewed like any other change',
      language: 'bash',
      code: `resource "aws_s3_bucket" "app_data" {
  bucket = "my-app-data"
}

moved {
  from = aws_s3_bucket.data
  to   = aws_s3_bucket.app_data
}

# terraform plan output now:
#   # aws_s3_bucket.data has moved to aws_s3_bucket.app_data
#   # (no changes)
# No destroy, no create -- just an address update in state,
# and the moved block itself is a normal, reviewable line in
# version control documenting exactly what happened and why.

# The older, imperative equivalent -- works, but is a manual
# one-off command that leaves no trace in the .tf files:
# terraform state mv aws_s3_bucket.data aws_s3_bucket.app_data

# state mv is still the right tool for moving a resource to a
# genuinely DIFFERENT state file -- moved blocks only cover
# renames within the same state:
# terraform state mv -state-out=other.tfstate \\
#   aws_s3_bucket.app_data aws_s3_bucket.app_data`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate renames `resource "aws_instance" "web"` to `resource "aws_instance" "app_server"` purely for naming clarity — no other change. They run `terraform plan` and see the instance listed for destroy AND a new one listed for create, which alarms them since this is a production instance. Following only the main page\'s own "never manually edit the state file" rule, what should they NOT do, and what is the correct, code-reviewable way to make this rename a no-op in the plan?',
    hint: 'The main page tells you what not to do (hand-edit the state file\'s JSON directly) but not what the current recommended alternative actually is for exactly this situation.',
    solution: 'They should NOT hand-edit the state file\'s JSON directly to change the resource address (which the main page already warns against generally, and which is especially risky for a hand-edited JSON structure). The correct fix is adding a `moved` block to the configuration: `moved { from = aws_instance.web\\n to = aws_instance.app_server }`. On the next `terraform plan`, Terraform checks state for the `from` address, finds it, and updates it to the `to` address instead of planning a destroy/create — the plan now shows the resource as moved with no changes, and the `moved` block itself is a normal, version-controlled, code-reviewable line documenting exactly what happened, unlike a one-off `terraform state mv` command run locally with no trace in the repository.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Renaming a resource block in the .tf file (keeping all its arguments the same) is a purely cosmetic change with no effect on the plan.',
      reality: 'Per this subtopic\'s theory, Terraform addresses resources by resource_type.resource_name, and state maps that exact address to real infrastructure — a plain rename with no moved block looks like the old address was deleted and a new, unrelated one was created, showing up as a destroy + create in the plan.'
    },
    {
      thought: 'terraform state mv is the deprecated, wrong way to handle a rename now that moved blocks exist — it should never be used anymore.',
      reality: 'Per this subtopic\'s theory, moved blocks are the recommended DEFAULT for renames within the same state file, but state mv remains the correct tool for moving a resource across separate state files, which a moved block cannot express at all.'
    },
    {
      thought: 'The main page\'s "never manually edit the state file" warning is only about not opening the raw JSON in a text editor — running terraform state mv from the CLI is a completely different, always-safe category of action with no downsides.',
      reality: 'Per this subtopic\'s theory, terraform state mv is safer than hand-editing raw JSON, but it is still a manual, imperative, one-time action that is not tracked in version control and does not automatically apply for teammates or CI runs — a moved block\'s declarative, code-reviewed nature is a real advantage state mv does not share.'
    }
  ];
}
