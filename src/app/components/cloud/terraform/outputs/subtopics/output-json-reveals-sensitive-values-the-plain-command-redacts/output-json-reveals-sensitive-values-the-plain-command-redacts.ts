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
  templateUrl: './output-json-reveals-sensitive-values-the-plain-command-redacts.html',
  styleUrl: './output-json-reveals-sensitive-values-the-plain-command-redacts.scss'
})
export class OutputJsonRevealsSensitiveValuesThePlainCommandRedactsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states this in one clause, buried inside a longer QnA answer',
      points: [
        'The main page\'s QnA on viewing outputs says, almost in passing: "To see sensitive values: the -json flag includes them in the response." That is the entire treatment — one clause inside a longer answer about CLI flags, with no worked example and no mention of what this means for a CI pipeline that treats -json output as safe to log.',
      ]
    },
    {
      heading: 'sensitive = true only redacts the PLAIN terraform output display — never -json',
      points: [
        'Running plain <code>terraform output</code> (or <code>terraform output db_password</code> for a single value) shows a sensitive output as the literal placeholder text <code>&lt;sensitive&gt;</code> — this is the redaction the main page\'s own mistake entry and quiz correctly describe elsewhere on the page.',
        'Running <code>terraform output -json</code> instead prints the REAL, unredacted value for every output, sensitive or not — the JSON structure includes a <code>"sensitive": true</code> metadata flag alongside the value, but the actual secret string is right there in the <code>"value"</code> field, in plain text.',
      ]
    },
    {
      heading: 'Why this is a real, easy-to-hit trap in CI pipelines specifically',
      points: [
        'A very common CI pattern is piping <code>terraform output -json</code> into a script or a log file to extract multiple values programmatically (exactly matching the main page\'s own QnA suggestion: "capture output values with terraform output -raw and pass them to downstream deployment steps" — <code>-json</code> is the natural choice when MULTIPLE outputs are needed at once, rather than one <code>-raw</code> call per output).',
        'A team that has correctly marked a variable/output <code>sensitive = true</code> can reasonably believe this alone protects them — after all, the plain CLI display IS redacted — without realizing that switching to <code>-json</code> for scripting convenience silently drops that protection, and that CI logs capturing stdout will now contain the real secret in plain text.',
        'The mitigation is not "avoid -json" (it is often genuinely the right tool for extracting multiple outputs), but being deliberate about where its output goes — piping directly into environment variables or a secrets-handling step, never into a build log or a step whose full stdout gets archived.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Plain output: redacted, as the main page already shows',
      language: 'bash',
      code: `output "db_password" {
  value     = random_password.db.result
  sensitive = true
}

$ terraform output
db_password = <sensitive>

$ terraform output db_password
"<sensitive>"
# This is the redaction the main page's own mistake entry
# and quiz question correctly describe.`,
    },
    {
      label: '-json: the same output, fully exposed',
      language: 'bash',
      code: `$ terraform output -json
{
  "db_password": {
    "sensitive": true,
    "type": "string",
    "value": "Sup3r-S3cret-Actual-Password!"
  }
}
# The "sensitive": true flag is metadata ONLY -- it does NOT
# redact the "value" field. The real password is right there
# in plain text, despite the output being correctly marked
# sensitive and despite the plain 'terraform output' command
# redacting it moments earlier.

# A CI step doing this innocently leaks the real secret into
# whatever captures its stdout:
# terraform output -json > build-outputs.json
# cat build-outputs.json | tee -a $CI_LOG_FILE   # now in logs

# Safer: extract only what's needed and pipe directly into
# the next step's environment, not into anything logged/archived:
# export DB_PASSWORD=$(terraform output -raw db_password)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own example, a team declares `output "db_password" { value = random_password.db.result, sensitive = true }` and confirms plain `terraform output` correctly redacts it as `<sensitive>`. To extract several outputs at once for a deployment script, they switch to `terraform output -json > outputs.json`, then archive outputs.json as a CI build artifact for debugging convenience. A security review later finds the real database password in that archived artifact. What went wrong, given that the output WAS correctly marked sensitive?',
    hint: 'sensitive = true redacts one specific CLI display path. Does every way of reading outputs go through that same redaction?',
    solution: 'sensitive = true only redacts the PLAIN `terraform output` display — it does not apply to `terraform output -json`, which prints every output\'s real, unredacted value (alongside a `"sensitive": true` metadata flag that does not itself hide anything). Marking the output sensitive was correct and necessary, but it does not protect a workflow that switches to `-json` for scripting convenience. The fix is not avoiding `-json` — it is being deliberate about where its output goes: extracting only the specific values needed (e.g. via `terraform output -raw db_password` piped directly into an environment variable) rather than dumping the full `-json` output into a file that then gets archived or logged.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Once an output is marked sensitive = true, every command that reads it — plain terraform output, terraform output -json, terraform show — redacts the value consistently.',
      reality: 'Per this subtopic\'s theory, sensitive = true only redacts the PLAIN terraform output display. terraform output -json prints the real, unredacted value for every output regardless of its sensitivity, with the sensitivity flag present only as metadata.'
    },
    {
      thought: 'The "sensitive": true field that appears in terraform output -json\'s JSON structure means the actual value has been hidden or masked in that same response.',
      reality: 'Per this subtopic\'s theory, that field is metadata describing the output\'s declared sensitivity — it does not redact anything. The real value is still present, in plain text, in the same JSON object\'s "value" field.'
    },
    {
      thought: 'terraform output -json is inherently unsafe to use and should be avoided entirely in favor of the plain terraform output command.',
      reality: 'Per this subtopic\'s theory, -json is often the right tool, particularly for extracting multiple outputs at once — the actual risk is in where its output ends up (a logged or archived file), not in using the flag itself; a more targeted -raw extraction into an environment variable avoids the exposure without giving up -json entirely for other use cases.'
    }
  ];
}
