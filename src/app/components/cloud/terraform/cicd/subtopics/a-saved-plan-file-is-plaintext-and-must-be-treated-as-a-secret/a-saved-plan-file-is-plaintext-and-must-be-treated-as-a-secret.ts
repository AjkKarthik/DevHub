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
  templateUrl: './a-saved-plan-file-is-plaintext-and-must-be-treated-as-a-secret.html',
  styleUrl: './a-saved-plan-file-is-plaintext-and-must-be-treated-as-a-secret.scss'
})
export class ASavedPlanFileIsPlaintextAndMustBeTreatedAsASecretSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page recommends posting the plan output on the PR, without the security caveat that makes this risky',
      points: [
        'The main page\'s own GitHub Actions section says: "Comment the plan output on the PR using hashicorp/setup-terraform outputs." Genuinely useful for review — but it says nothing about what the plan output, or the saved plan FILE it came from, actually contains.',
      ]
    },
    {
      heading: '"sensitive = true" only redacts DISPLAY — it does not encrypt or remove the value from the saved plan file',
      points: [
        'Marking a variable or output <code>sensitive = true</code> makes Terraform print <code>(sensitive value)</code> in CLI plan/apply output — but that is a DISPLAY-layer redaction only. The actual value is still written, in plain text, into the saved plan file itself (and into state) — <code>sensitive = true</code> never encrypts anything.',
        'Running <code>terraform show -json tfplan</code> against a saved plan file reveals every value the CLI redacted on screen, including ones marked sensitive — proving the redaction was cosmetic, scoped to the terminal/log output, not the artifact.',
      ]
    },
    {
      heading: 'The practical consequence: a plan file is a secret-bearing artifact and must be handled like one in CI',
      points: [
        'A saved plan file (the <code>-out=tfplan</code> artifact the main page\'s plan-then-apply rule depends on) can contain database passwords, API keys, and any other secret value the configuration touches — in full plain text, regardless of any <code>sensitive</code> markings applied in the configuration.',
        'This means: never commit a plan file to version control, never post its raw content verbatim in a PR comment (only the CLI-redacted STDOUT text, which is safe because the redaction happens at display time — the underlying file uploaded as a CI artifact is not), and treat any CI artifact upload of the plan file with the same access controls and retention limits as any other secret — short retention, restricted to the workflow, deleted after apply.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'sensitive = true redacts display only',
      language: 'bash',
      code: `# main.tf
variable "db_password" {
  type      = string
  sensitive = true
}

resource "aws_db_instance" "main" {
  password = var.db_password
}

# terraform plan -out=tfplan
#   # aws_db_instance.main will be created
#   + password = (sensitive value)
# ...CLI output looks safely redacted...

# But the underlying saved file tells a different story:
terraform show -json tfplan | jq '.resource_changes[0].change.after.password'
# "hunter2-actual-plaintext-password"
# The value was NEVER hidden from the artifact itself --
# only from the terminal/log text a human reads directly.`,
    },
    {
      label: 'Handling the plan artifact safely in CI',
      language: 'bash',
      code: `# WRONG: posting the raw plan file (or its JSON) as a PR comment
- run: terraform show -json tfplan > plan.json
- run: gh pr comment --body-file plan.json
  # Leaks every sensitive value in plain text into the PR thread,
  # a permanent, widely-readable location.

# RIGHT: post only the CLI's own redacted STDOUT text
- run: terraform plan -out=tfplan | tee plan_output.txt
- run: gh pr comment --body-file plan_output.txt
  # Safe -- this is the display-redacted text, sensitive values
  # already show as (sensitive value) here.

# RIGHT: treat the plan FILE itself as a secret-bearing artifact
- uses: actions/upload-artifact@v4
  with:
    name: tfplan
    path: tfplan
    retention-days: 1        # short retention, not the default 90
  # Plus: restrict which jobs/workflows can download this artifact,
  # and delete it explicitly once apply has consumed it.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team marks every secret-bearing variable sensitive = true, confirms the CLI plan output shows (sensitive value) everywhere it should, and concludes their saved plan artifact is now safe to upload with a 90-day retention window and no extra access restriction. Is that conclusion correct, and why or why not?',
    hint: 'What layer does sensitive = true actually redact — the terminal output a human reads, or the file Terraform writes to disk?',
    solution: 'The conclusion is incorrect. sensitive = true only redacts values in the CLI\'s own display output (plan/apply text printed to the terminal or logs) — it does not encrypt or remove the value from the saved plan file on disk. Running terraform show -json against that same plan file reveals every value in plain text, including ones the CLI redacted on screen, because the redaction is cosmetic and scoped to display, not the underlying artifact. A 90-day-retention, unrestricted CI artifact upload of that file is therefore a real plaintext-secret exposure regardless of how many variables were marked sensitive — the plan file needs the same handling as any other secret: short retention, restricted access, deletion after use.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Marking a variable sensitive = true means Terraform encrypts or strips that value everywhere it appears, including in a saved plan file.',
      reality: 'Per this subtopic\'s theory, sensitive = true only redacts the value in CLI display output (the text printed to a terminal or log) — the saved plan file itself still contains the value in full plain text, provable via terraform show -json against that same file.'
    },
    {
      thought: 'Since the main page shows posting the plan output as a PR comment as a normal, recommended review practice, doing so is always safe regardless of what the configuration contains.',
      reality: 'Per this subtopic\'s theory, posting the CLI\'s own redacted STDOUT text is safe, but posting the raw plan file\'s content (e.g. via terraform show -json) is not — that reveals every sensitive value in plain text into a permanent, widely-readable PR thread.'
    },
    {
      thought: 'A saved Terraform plan file only contains a description of infrastructure CHANGES (resource types, attribute diffs), not actual secret values pulled from variables or data sources.',
      reality: 'Per this subtopic\'s theory, a saved plan file contains the full resolved values Terraform computed for the apply — including database passwords, API keys, and any other secret the configuration touches — making it a genuine secret-bearing artifact that needs the same CI handling as any other credential.'
    }
  ];
}
