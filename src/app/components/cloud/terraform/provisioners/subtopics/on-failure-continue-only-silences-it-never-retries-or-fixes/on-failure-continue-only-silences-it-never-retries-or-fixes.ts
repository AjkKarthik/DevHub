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
  templateUrl: './on-failure-continue-only-silences-it-never-retries-or-fixes.html',
  styleUrl: './on-failure-continue-only-silences-it-never-retries-or-fixes.scss'
})
export class OnFailureContinueOnlySilencesItNeverRetriesOrFixesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names the flag as the override, without describing what "continue" actually does',
      points: [
        'The main page\'s theory says: "Provisioner failures by default fail the entire apply — use <code>on_failure = continue</code> to override." That correctly identifies the flag, but "override" is vague about what specifically changes — someone could reasonably read it as "Terraform retries the command" or "Terraform tries an alternative," neither of which is what happens.',
      ]
    },
    {
      heading: 'continue does exactly one thing: stop treating the failure as an error',
      points: [
        'With <code>on_failure = continue</code>, a failed provisioner is logged as a warning, and Terraform proceeds through the rest of apply AS IF the provisioner had succeeded. The resource is not tainted (contrasting with the default <code>fail</code> behavior\'s taint-and-recreate cycle covered in the companion subtopic on this same topic).',
        'There is no retry logic anywhere in this — Terraform does not re-run the failed command, does not wait and try again, and does not attempt any fallback. Whatever the provisioner\'s command was supposed to do, if it failed, it simply did not happen, and nothing about <code>continue</code> changes that outcome. Any retry behavior has to be built into the provisioner\'s own command (a shell loop, a tool with built-in retry) — it is not something the <code>on_failure</code> argument provides.',
      ]
    },
    {
      heading: 'The result: apply reports success while the provisioned side effect silently did not happen',
      points: [
        'This is the sharpest practical risk: <code>terraform apply</code> completes and reports success, the resource is not tainted, and nothing in the standard output loudly announces that the provisioner\'s work is missing — only a warning, easy to miss in a long CI log, marks that anything went wrong at all.',
        'This is exactly why <code>on_failure = continue</code> is the RIGHT default specifically for genuinely optional side effects (a Slack notification that failing to send should not block infrastructure changes) and the companion subtopic\'s destroy-time-cleanup case (where getting stuck is worse than a missed cleanup step) — but the WRONG default for anything the rest of the configuration actually depends on being true, where a silent gap is worse than a blocked apply.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What continue actually changes',
      language: 'bash',
      code: `resource "null_resource" "notify_slack" {
  provisioner "local-exec" {
    command    = "curl -X POST \${var.slack_webhook} -d 'deploy done'"
    on_failure = continue   # Slack being down shouldn't block infra
  }
}

# If the curl command fails (webhook down, network blip):
terraform apply
# ...
# Warning: local-exec provisioner error
#   command "curl -X POST ..." exited with a non-zero status.
#   Continuing because "on_failure" is set to "continue".
#
# Apply complete! Resources: 1 added, 0 changed, 0 destroyed.
#
# terraform apply REPORTS SUCCESS. The Slack notification never
# sent. Nothing else in the output loudly says so -- just the
# one warning line, easy to miss in a long CI log.`,
    },
    {
      label: 'What continue does NOT do',
      language: 'bash',
      code: `resource "null_resource" "notify_slack" {
  provisioner "local-exec" {
    command    = "curl -X POST \${var.slack_webhook} -d 'deploy done'"
    on_failure = continue
  }
}
# on_failure = continue does NOT:
# - retry the curl command
# - wait and try again after a delay
# - fall back to an alternative notification method
# - mark anything for a human to follow up on beyond one
#   warning line in the apply log
#
# If retry logic is actually wanted, it has to be built into
# the command itself:
resource "null_resource" "notify_slack_retrying" {
  provisioner "local-exec" {
    command = <<-EOT
      for i in 1 2 3; do
        curl -f -X POST \${var.slack_webhook} -d 'deploy done' && exit 0
        sleep 5
      done
      exit 1
    EOT
    on_failure = continue   # still don't block apply even after retries
  }
}

# Right default for THIS case (optional side effect) --
# wrong default for anything the rest of the config depends
# on actually being true.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team adds `on_failure = continue` to a local-exec provisioner that calls an internal API to register a newly created server in a service registry — reasoning "if it fails, we don\'t want it blocking the whole deploy." A week later, an on-call engineer discovers a server that was created successfully but was never actually registered, and nothing in the deploy logs flagged it as a real problem. What did on_failure = continue actually do here, and why was it the wrong default for this specific provisioner even though the team\'s stated reasoning (don\'t block deploys) sounds reasonable?',
    hint: 'Ask what continue changes about the FAILURE itself, versus what it changes about how loudly that failure is surfaced — and whether the registration step is genuinely optional or something later config assumes happened.',
    solution: 'on_failure = continue only stopped Terraform from treating the registration failure as an apply-blocking error — it logged one warning and proceeded as if the provisioner had succeeded, without retrying the API call or doing anything to actually complete the registration. The resource was not tainted, and apply reported success, so the missing registration produced no loud signal beyond a single easy-to-miss warning line. It was the wrong default here specifically because service registration is not a genuinely optional side effect the way a Slack notification is — other parts of the system (load balancer health checks, service discovery) presumably depend on that registration having actually happened, so a silent gap is worse than a blocked apply. The right default for this provisioner is the default fail behavior (taint-and-recreate on failure), reserving on_failure = continue for cases where a missed side effect is genuinely tolerable.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'on_failure = continue causes Terraform to retry the failed provisioner command a few times before giving up.',
      reality: 'Per this subtopic\'s theory, continue does not retry anything at all — it simply stops treating a single failure as an error and proceeds as if the provisioner succeeded. Any retry logic has to be built into the provisioner\'s own command.'
    },
    {
      thought: 'When on_failure = continue causes a provisioner to fail silently, terraform apply reflects that in its final summary, distinguishing it from a fully clean run.',
      reality: 'Per this subtopic\'s theory, apply reports success — resources added/changed/destroyed counts look identical to a run where the provisioner genuinely succeeded, with only an easy-to-miss warning line marking that anything went wrong.'
    },
    {
      thought: 'on_failure = continue is generally the safer, more cautious choice for any provisioner, since it prevents apply from being blocked by an unrelated failure.',
      reality: 'Per this subtopic\'s theory, it is only the right choice for genuinely optional side effects — for anything the rest of the configuration or system depends on actually having happened, the default fail behavior (which at least surfaces the problem loudly and taints the resource for recreation) is the safer choice.'
    }
  ];
}
