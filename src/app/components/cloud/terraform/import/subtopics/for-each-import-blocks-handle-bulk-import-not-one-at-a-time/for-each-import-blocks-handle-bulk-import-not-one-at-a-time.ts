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
  templateUrl: './for-each-import-blocks-handle-bulk-import-not-one-at-a-time.html',
  styleUrl: './for-each-import-blocks-handle-bulk-import-not-one-at-a-time.scss'
})
export class ForEachImportBlocksHandleBulkImportNotOneAtATimeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own import block example imports exactly one resource',
      points: [
        'The main page\'s Import Workflow theory and its Import block codeTab both show a single <code>import {}</code> block bringing in one resource. Its own "bulk import" advice is limited to "importing incrementally and verifying each terraform plan" — sound process advice, but it implies one hand-written <code>import</code> block per resource, which becomes unworkable fast for dozens or hundreds of pre-existing resources.',
      ]
    },
    {
      heading: 'Terraform 1.7+ added for_each support directly on the import block',
      points: [
        'An <code>import</code> block can carry its own <code>for_each</code>, exactly like a resource or module block — iterating over a map or set and generating one import operation per entry, all from a single block in the configuration.',
        'The <code>to</code> argument then addresses a specific instance of an already <code>for_each</code>-declared resource — <code>to = aws_s3_bucket.app_data[each.key]</code> — pairing the bulk import with a resource block that is itself written with <code>for_each</code>, so each imported ID lands on the matching keyed instance.',
      ]
    },
    {
      heading: 'This solves the same "many resources, no hand-written blocks" problem count-based resources cannot solve safely',
      points: [
        'Because <code>for_each</code>-based resources are already keyed by stable string identifiers rather than numeric position, bulk-importing into them with a <code>for_each</code> import block keeps each resource\'s identity tied to its actual key — matching the same count-vs-for_each stability argument the Resources topic already makes, just applied to the import step specifically.',
        'The practical source for the map driving <code>for_each</code> is usually a <code>locals</code> block built from something external to the configuration — a list pulled from a script, a CSV of existing resource IDs, or a data source query — turned into <code>{ key => id }</code> pairs the import block can iterate.',
        'This is a genuinely newer capability than the main page\'s own "TF 1.5+" framing for import blocks in general — <code>for_each</code> on <code>import</code> specifically requires 1.7+, worth checking against the Terraform version actually in use before relying on it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s pattern: one block per resource',
      language: 'bash',
      code: `# Matches the main page's own import block example --
# works fine for ONE resource, becomes unmanageable for many:
import {
  to = aws_s3_bucket.app_data
  id = "my-existing-bucket-2019"
}

import {
  to = aws_s3_bucket.app_logs
  id = "my-existing-bucket-logs-2019"
}
# ...repeated by hand for every one of dozens of pre-existing
# buckets that need to come under management.`,
    },
    {
      label: 'for_each on the import block itself (Terraform 1.7+)',
      language: 'bash',
      code: `# The source data -- e.g. built from a script's output or a
# CSV of existing bucket names:
locals {
  existing_buckets = {
    app_data = "my-existing-bucket-2019"
    app_logs = "my-existing-bucket-logs-2019"
    backups  = "my-existing-bucket-backups-2019"
  }
}

# ONE import block handles all of them:
import {
  for_each = local.existing_buckets
  to       = aws_s3_bucket.app_data[each.key]
  id       = each.value
}

# The resource itself must ALSO be declared with for_each,
# keyed the same way, so each imported ID lands on the
# matching instance:
resource "aws_s3_bucket" "app_data" {
  for_each = local.existing_buckets
  bucket   = each.value
}

# terraform plan -generate-config-out=generated.tf
# generates starting HCL for all three buckets from one
# import block -- no per-resource hand-written blocks needed.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team needs to bring 40 pre-existing S3 buckets under Terraform management. Following the main page\'s own import block example literally, they start hand-writing one `import { to = ..., id = ... }` block per bucket and quickly realize this does not scale. What Terraform feature (and minimum version) lets a single import block handle all 40 at once, and what does the corresponding resource block need to look like for it to work?',
    hint: 'What meta-argument works on resource and module blocks to create multiple instances from one block — and does the import block support the same thing?',
    solution: 'Terraform 1.7+ supports `for_each` directly on the `import` block, iterating over a map (here, bucket key → existing bucket name) and generating one import operation per entry from a single block: `import { for_each = local.existing_buckets, to = aws_s3_bucket.app_data[each.key], id = each.value }`. For this to work, the resource itself must also be declared with a matching `for_each` — `resource "aws_s3_bucket" "app_data" { for_each = local.existing_buckets, bucket = each.value }` — so each imported ID lands on the correctly keyed instance rather than needing 40 separate hand-written import blocks.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Import blocks always require one hand-written block per resource, the way the main page\'s own single-resource example shows — there is no way to bulk-import through the import block mechanism itself.',
      reality: 'Per this subtopic\'s theory, Terraform 1.7+ supports for_each directly on the import block, letting one block generate an import operation per entry in a map or set — no per-resource hand-written blocks needed.'
    },
    {
      thought: 'A for_each import block works with any resource declaration, regardless of whether that resource itself uses for_each or a plain single instance.',
      reality: 'Per this subtopic\'s theory, the resource being imported into must ALSO be declared with a matching for_each — the import block\'s to argument addresses a specific for_each-keyed instance, which only exists if the resource block itself is written that way.'
    },
    {
      thought: 'for_each on the import block has been available since import blocks themselves were introduced in Terraform 1.5.',
      reality: 'Per this subtopic\'s theory, for_each support on import blocks specifically requires Terraform 1.7+ — a later addition than import blocks themselves, worth checking against the actual Terraform version in use.'
    }
  ];
}
