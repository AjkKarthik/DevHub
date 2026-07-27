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
  templateUrl: './terraform-test-defaults-to-apply-not-plan.html',
  styleUrl: './terraform-test-defaults-to-apply-not-plan.scss'
})
export class TerraformTestDefaultsToApplyNotPlanSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page introduces terraform test in one bullet, alongside "fast, no cloud calls" tooling',
      points: [
        'The main page\'s Testing Modules theory lists <code>terraform validate</code> as "fast, no cloud calls," then immediately: "<code>terraform test</code> (TF 1.6+): native .tftest.hcl files with run blocks and assert conditions." Read in that sequence, it is easy to assume the native test framework is similarly lightweight. It is not, by default.',
      ]
    },
    {
      heading: 'A run block with no command attribute performs a real apply',
      points: [
        'Each <code>run</code> block in a <code>.tftest.hcl</code> file takes an optional <code>command</code> attribute. If it is omitted, the default is <code>apply</code> — Terraform provisions REAL infrastructure against whatever provider credentials are in scope, runs the assertions against the actual applied state, then destroys it when the test file completes.',
        'Setting <code>command = plan</code> instead runs only a plan and evaluates the assertions against the PLANNED values — no resources are created, so it is dramatically faster and costs nothing, at the price of only being able to assert on what a plan can know.',
        'The practical consequence of the default: a <code>.tftest.hcl</code> file written without thinking about <code>command</code> at all will happily create and destroy live cloud resources on every test run — which is a legitimate integration-testing mode, but a surprising default to hit accidentally in a fast feedback loop or on a developer laptop.',
      ]
    },
    {
      heading: 'The conventional split, and why plan-mode assertions are limited',
      points: [
        'A common convention separates the two modes by filename: <code>*_unit_test.tftest.hcl</code> files using <code>command = plan</code> for fast checks that provision nothing, and <code>*_integration_test.tftest.hcl</code> files using the default <code>apply</code> for genuine end-to-end verification — letting CI run the cheap suite on every push and the expensive one more selectively.',
        'The tradeoff is real, not merely stylistic: plan-mode assertions can only reference values Terraform actually knows at plan time. Anything that resolves to "(known after apply)" — a generated ID, an assigned IP, a computed ARN — is simply unavailable to assert against, so claims about those genuinely require apply mode.',
        'This maps directly onto the main page\'s own adjacent advice about the <code>examples/</code> directory serving as "documentation + integration tests" — those examples are exactly the apply-mode territory, while the module\'s own input validation and conditional logic are what plan mode covers cheaply.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The default: a real apply',
      language: 'bash',
      code: `# tests/defaults.tftest.hcl
run "creates_bucket_with_expected_name" {
  # NO command attribute -- defaults to APPLY.
  # This provisions a REAL S3 bucket against whatever
  # credentials are in scope, asserts, then destroys it.

  variables {
    bucket_prefix = "myapp"
    environment   = "test"
  }

  assert {
    condition     = aws_s3_bucket.this.bucket == "myapp-test"
    error_message = "Bucket name did not match the expected pattern."
  }
}

# terraform test
# -> creates real infrastructure, runs assertions, destroys it.
# Legitimate as integration testing -- surprising if the file
# was written assuming "test" meant something lightweight.`,
    },
    {
      label: 'Plan mode, and the convention that separates the two',
      language: 'bash',
      code: `# tests/naming_unit_test.tftest.hcl
run "bucket_name_follows_convention" {
  command = plan          # no resources created at all

  variables {
    bucket_prefix = "myapp"
    environment   = "test"
  }

  assert {
    condition     = aws_s3_bucket.this.bucket == "myapp-test"
    error_message = "Bucket name did not match the expected pattern."
  }
}
# Fast, free, safe to run on every save.

# --- What plan mode CANNOT assert on ---
run "checks_generated_id" {
  command = plan

  assert {
    # aws_s3_bucket.this.arn is "(known after apply)" during
    # plan -- there is no value here to assert against.
    condition     = aws_s3_bucket.this.arn != ""
    error_message = "ARN should be set."
  }
}
# Claims about generated IDs, assigned IPs, or computed ARNs
# genuinely require apply mode.

# Conventional split by filename:
#   tests/*_unit_test.tftest.hcl        -> command = plan
#   tests/*_integration_test.tftest.hcl -> default apply
# CI runs the cheap suite on every push, the expensive one
# more selectively.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer reads the main page\'s Testing Modules section, writes their first `.tftest.hcl` with a few run blocks and assertions, and runs `terraform test` on their laptop expecting something like `terraform validate` — fast and local. Instead the command takes minutes and their cloud account shows resources being created and torn down. What did they hit, what single attribute changes it, and what would they lose by changing it everywhere?',
    hint: 'What does a run block do when it has no command attribute at all, and what can a plan-only assertion actually see?',
    solution: 'They hit the default: a `run` block with no `command` attribute performs a real `apply`, provisioning actual infrastructure against whatever credentials are in scope, asserting against the applied state, then destroying it. Adding `command = plan` to a run block changes it to plan-only — no resources created, dramatically faster, costs nothing. What they would lose by applying that everywhere: plan-mode assertions can only reference values known at plan time, so anything resolving to "(known after apply)" — generated IDs, assigned IPs, computed ARNs — is unavailable to assert against. The conventional resolution is splitting by filename (`*_unit_test.tftest.hcl` using `command = plan`, `*_integration_test.tftest.hcl` using the default apply) so CI runs the cheap suite on every push and the expensive one selectively.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'terraform test is a lightweight, local validation tool similar to terraform validate, since the main page introduces them together as module testing options.',
      reality: 'Per this subtopic\'s theory, a run block with no command attribute defaults to a real apply — provisioning live infrastructure, asserting against it, then destroying it. Only command = plan makes it lightweight.'
    },
    {
      thought: 'command = apply must be written explicitly for a test to provision real resources, so a file that never mentions command is inherently safe to run anywhere.',
      reality: 'Per this subtopic\'s theory, apply is the DEFAULT when command is omitted — a file that never mentions the attribute is precisely the one that will create and destroy real cloud resources on every run.'
    },
    {
      thought: 'Setting command = plan on every run block is strictly better, since it is faster and cheaper with no real downside.',
      reality: 'Per this subtopic\'s theory, plan-mode assertions can only reference plan-time-known values — anything "(known after apply)" like a generated ID or computed ARN cannot be asserted against at all, which is why the two modes are conventionally split across separate test files rather than one replacing the other.'
    }
  ];
}
