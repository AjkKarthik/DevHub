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
  templateUrl: './precondition-blocks-catch-a-bad-output-value-before-export.html',
  styleUrl: './precondition-blocks-catch-a-bad-output-value-before-export.scss'
})
export class PreconditionBlocksCatchABadOutputValueBeforeExportSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page lists precondition as one bullet — and never shows it again',
      points: [
        'The main page\'s Output Attributes theory lists: "precondition (Terraform 1.2+): custom checks that run before the output is evaluated." That is the ONLY mention on the entire page — no codeTab, no mistake entry, no quiz question ever shows what a precondition actually looks like or what problem it solves.',
      ]
    },
    {
      heading: 'What a precondition actually guards against: exporting a value from a resource that isn\'t really ready',
      points: [
        'A <code>precondition</code> block nested inside an <code>output</code> block runs a custom check BEFORE that output\'s value is computed and exposed — if the condition evaluates to false, Terraform halts with the given <code>error_message</code> instead of silently exporting a value that might be misleading or unusable.',
        'A concrete case: a database endpoint output that references <code>aws_db_instance.main.endpoint</code> — the attribute itself always has SOME string value once the resource exists in state, but that doesn\'t mean the actual database is ready to accept connections. A precondition checking <code>aws_db_instance.main.status == "available"</code> catches the case where the endpoint is technically known but the instance is still provisioning, still backing up, or in a failed state — situations where exporting the endpoint anyway would let a downstream consumer (a CI script, another module) try to connect to something not actually ready.',
      ]
    },
    {
      heading: 'Why this belongs on the output, not just the resource',
      points: [
        'The check lives on the OUTPUT specifically because the concern is about what gets EXPORTED and consumed elsewhere — a resource can exist correctly in Terraform\'s own model while still being operationally unready by the standard the output\'s consumers actually care about; the precondition expresses that consumer-facing readiness bar directly at the export boundary.',
        'This is the same "prevent it before it happens" philosophy as the main page\'s own <code>validation</code> blocks on variables (catching bad INPUT early) — a <code>precondition</code> on an output is the mirror-image check on the way OUT, catching a value that technically computes but shouldn\'t be trusted downstream.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Without a precondition: a not-ready endpoint exports silently',
      language: 'bash',
      code: `resource "aws_db_instance" "main" {
  # ... engine, instance_class, etc.
}

output "database_endpoint" {
  description = "The database connection endpoint"
  value       = aws_db_instance.main.endpoint
  # No precondition -- exports the endpoint string the moment
  # it's known, regardless of whether the instance is actually
  # available yet. A downstream CI step consuming this output
  # to run a migration script might connect before the DB is
  # truly ready, producing a confusing, unrelated connection
  # error far from the actual root cause.
}`,
    },
    {
      label: 'With a precondition: readiness is enforced at the export boundary',
      language: 'bash',
      code: `resource "aws_db_instance" "main" {
  # ... engine, instance_class, etc.
}

output "database_endpoint" {
  description = "The database connection endpoint"
  value       = aws_db_instance.main.endpoint

  precondition {
    condition     = aws_db_instance.main.status == "available"
    error_message = "Database is not in 'available' state -- endpoint should not be consumed yet."
  }
}

# If the condition is false, apply halts right here with the
# clear error_message -- instead of quietly exporting an
# endpoint a downstream consumer will fail against, with a
# confusing, disconnected error message of its own.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A root module exports `output "database_endpoint" { value = aws_db_instance.main.endpoint }` with no precondition, matching the main page\'s own minimal Basic Outputs example. A CI pipeline reads this output immediately after apply and runs a database migration script against it — the migration occasionally fails with a generic connection-refused error, even though `terraform apply` itself reported success. What is the likely gap, and what addition to the output block would surface a clearer, earlier failure instead?',
    hint: 'The endpoint attribute existing in state is not the same guarantee as the database actually being ready to accept connections. What tool checks a condition specifically at the point an output is exported?',
    solution: 'The gap is that `aws_db_instance.main.endpoint` becomes a known string the moment Terraform can compute it, which is not the same as the database instance being fully available to accept connections — apply can succeed while the instance is still finishing provisioning. Adding a `precondition` block to the output closes this gap: `precondition { condition = aws_db_instance.main.status == "available", error_message = "Database is not in \'available\' state." }`. If the instance isn\'t actually ready, apply halts right there with a clear, specific error message pointing at the real cause — instead of letting the CI pipeline\'s migration script hit a generic, confusing connection-refused error disconnected from the actual root cause.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a resource attribute like an endpoint or ARN has a known value in Terraform\'s state, it is safe to assume the underlying resource is fully operational and ready to use.',
      reality: 'Per this subtopic\'s theory, an attribute can be known (present in state, computed) while the actual resource is still provisioning or not yet operationally ready — a precondition block checking the resource\'s own status attribute is what actually verifies operational readiness before export.'
    },
    {
      thought: 'precondition blocks on outputs are mainly a stylistic alternative to validation blocks on variables — either one works for most input/output checks.',
      reality: 'Per this subtopic\'s theory, they serve different, complementary roles: validation blocks catch bad INPUT early on variables; precondition blocks on outputs catch a value that technically computes but should not be trusted for export, at the moment it is about to leave the module.'
    },
    {
      thought: 'A failed precondition on an output produces a warning but still allows the apply to complete and the (possibly bad) value to be exported.',
      reality: 'Per this subtopic\'s theory, a failed precondition HALTS the operation with the given error_message — it does not merely warn while still exporting the value; the whole point is to prevent the questionable value from ever reaching consumers.'
    }
  ];
}
