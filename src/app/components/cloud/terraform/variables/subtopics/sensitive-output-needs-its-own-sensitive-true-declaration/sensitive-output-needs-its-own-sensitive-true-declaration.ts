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
  templateUrl: './sensitive-output-needs-its-own-sensitive-true-declaration.html',
  styleUrl: './sensitive-output-needs-its-own-sensitive-true-declaration.scss'
})
export class SensitiveOutputNeedsItsOwnSensitiveTrueDeclarationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page correctly flags the state-file limit, but never mentions outputs at all',
      points: [
        'The main page\'s quiz explanation and revision summary both correctly state that <code>sensitive = true</code> on a variable "suppresses its value in plan/apply terminal output" but "the value is still stored plaintext in the state file." True and important — but the main page never mentions what happens when a sensitive VARIABLE\'s value flows into an OUTPUT block, which has its own, separate sensitivity rule.',
      ]
    },
    {
      heading: 'Sensitivity is contagious — but an output must still opt in explicitly',
      points: [
        'A value derived from a sensitive variable or resource attribute is itself treated as sensitive by Terraform\'s own tracking — if an <code>output</code> block\'s <code>value</code> expression references anything sensitive, Terraform refuses to plan with an error ("Output refers to sensitive values") UNLESS that output block also has its own <code>sensitive = true</code>.',
        'This is a deliberate, separate opt-in — marking the ORIGINATING variable sensitive does not automatically make every output referencing it sensitive too; each output that surfaces a sensitive value needs its own explicit <code>sensitive = true</code>, or the plan simply fails with the error above rather than silently leaking the value.',
      ]
    },
    {
      heading: 'sensitive = true on an output still only controls DISPLAY, not storage — same limit as on variables',
      points: [
        'Exactly like the main page\'s own point about variables, marking an output <code>sensitive = true</code> only redacts it from the normal <code>terraform plan</code>/<code>apply</code>/<code>output</code> display — the value is still written in full, plaintext, to the state file, and to any other output that references it (unless that one is ALSO marked sensitive).',
        'The value remains retrievable on purpose, not by accident: <code>terraform output -raw output_name</code> deliberately prints a sensitive output\'s real value, for legitimate use in scripts and CI pipelines that need to consume it — this is the sanctioned way to reach a sensitive value programmatically, not a bypass or a bug.',
        'The <code>nonsensitive()</code> function can explicitly strip the sensitive marking from a value inside an expression, when a value needs to be treated as non-sensitive on purpose — using it accidentally where a value was meant to stay marked sensitive re-introduces the same display-leak risk the flag was meant to prevent.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The error: passing a sensitive value through unmarked',
      language: 'bash',
      code: `variable "db_password" {
  type      = string
  sensitive = true   # matches the main page's own example
}

resource "aws_db_instance" "main" {
  password = var.db_password
}

# Trying to surface it via a plain output:
output "db_password" {
  value = aws_db_instance.main.password
}
# Error: Output refers to sensitive values
#   To reduce the risk of accidentally exposing sensitive data
#   in this output, Terraform requires that the output be
#   explicitly marked as sensitive.
# Sensitivity is contagious from the variable to anything
# derived from it -- but the output itself must still opt in.`,
    },
    {
      label: 'The fix, and its own remaining limit',
      language: 'bash',
      code: `output "db_password" {
  value      = aws_db_instance.main.password
  sensitive  = true   # the explicit, required opt-in
}

# Normal display now redacted:
# terraform apply
#   Outputs:
#   db_password = <sensitive>

# Deliberately retrieve the real value for scripts/CI --
# sanctioned, not a bypass:
# terraform output -raw db_password

# Same underlying limit as sensitive variables: this output's
# real value is still stored PLAINTEXT in the state file --
# sensitive = true only ever controls terminal/UI display,
# on both variables AND outputs.

# nonsensitive() explicitly strips the marking on purpose --
# using it by accident undoes the protection:
output "db_password_exposed_by_mistake" {
  value = nonsensitive(aws_db_instance.main.password)
  # No error now -- but the value is fully visible in plain
  # 'terraform apply' output, defeating the original intent.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own db_password variable example (declared with sensitive = true), a teammate adds `output "db_password" { value = aws_db_instance.main.password }` to surface the generated password for a downstream script. terraform plan immediately fails with "Output refers to sensitive values." The teammate is confused, since the variable itself is already marked sensitive. What is actually required here, and once fixed, what command retrieves the real value for the downstream script (as opposed to the normal apply output, which will show it redacted)?',
    hint: 'Sensitivity propagates from a sensitive variable to anything derived from it, but an output block has its own separate opt-in requirement — marking the source sensitive is not the same as marking the output sensitive.',
    solution: 'The output block itself needs its own `sensitive = true`: `output "db_password" { value = aws_db_instance.main.password, sensitive = true }`. Marking the originating variable sensitive is not enough — Terraform requires every output that surfaces a sensitive-derived value to explicitly opt in too, or it refuses to plan at all with the "Output refers to sensitive values" error, precisely to prevent an accidental leak. Once fixed, normal `terraform apply`/`terraform output` display the value redacted as `<sensitive>`, but `terraform output -raw db_password` deliberately prints the real, plaintext value — the sanctioned way for a script or CI pipeline to consume it programmatically.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Once a variable is marked sensitive = true, every output that references it (directly or indirectly) is automatically treated as sensitive too, with no further action needed.',
      reality: 'Per this subtopic\'s theory, sensitivity does propagate to values derived from a sensitive source, but each OUTPUT block that surfaces such a value must still explicitly declare its own sensitive = true — otherwise Terraform refuses to plan at all, rather than silently exposing it.'
    },
    {
      thought: 'terraform output -raw on a sensitive output is a workaround or loophole for bypassing the sensitive protection.',
      reality: 'Per this subtopic\'s theory, -raw is the sanctioned, intended way to retrieve a sensitive output\'s real value for scripts and CI pipelines that legitimately need to consume it — not a bypass of anything, since sensitive = true was always only about terminal/UI display, never about blocking programmatic access entirely.'
    },
    {
      thought: 'Marking both a variable and its corresponding output sensitive = true means the value is now encrypted or otherwise protected in the state file.',
      reality: 'Per this subtopic\'s theory, sensitive = true — on either a variable or an output — only ever controls display in plan/apply/output text. The value is still written in full plaintext to the state file regardless, matching the exact same limitation the main page already documents for sensitive variables.'
    }
  ];
}
