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
  templateUrl: './s3-backend-no-longer-needs-dynamodb-use-lockfile-is-current.html',
  styleUrl: './s3-backend-no-longer-needs-dynamodb-use-lockfile-is-current.scss'
})
export class S3BackendNoLongerNeedsDynamodbUseLockfileIsCurrentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states DynamoDB as a requirement, not an option — this has since changed',
      points: [
        'The main page\'s own theory and mistake entry are unambiguous: "S3 does not provide native locking... Without a DynamoDB table, concurrent applies will run without lock protection." Every codeTab, the challenge, and the quiz all treat <code>dynamodb_table</code> as the standard, expected way to lock an S3 backend — accurate for a long time, but no longer the only (or even the currently recommended default) approach.',
      ]
    },
    {
      heading: 'S3 gained native conditional writes — and Terraform built locking directly on top of them',
      points: [
        'In August 2024, AWS added conditional writes to S3 itself (an <code>If-None-Match</code> HTTP header that uploads an object only if it does not already exist). Terraform 1.10 (November 2024) added a new S3 backend argument, <code>use_lockfile</code>, that uses exactly this mechanism to manage a lock file directly inside the SAME S3 bucket the state already lives in — no DynamoDB table required at all.',
        'With <code>use_lockfile = true</code>, <code>terraform apply</code> creates a small lock file alongside the state object using that conditional-write trick; if the lock file already exists, S3 itself rejects the write, which is what prevents a second concurrent apply from acquiring the lock — functionally the same protection DynamoDB provided, just implemented entirely within S3.',
      ]
    },
    {
      heading: 'DynamoDB-based locking still works, but is now the legacy path',
      points: [
        'Terraform 1.11 marked <code>dynamodb_table</code> (and its related <code>dynamodb_endpoint</code> arguments) as DEPRECATED — they remain functional for existing configurations, but new S3 backends no longer need the separate DynamoDB table, its own IAM permissions, or its own cost line item that the main page\'s own bootstrap example provisions.',
        'For an EXISTING configuration already using <code>dynamodb_table</code>, migrating to <code>use_lockfile</code> is a backend-configuration change like any other — update the backend block and run <code>terraform init -migrate-state</code>, matching the exact same migration workflow the main page\'s own Partial Configuration section already describes for other backend changes.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s pattern: DynamoDB required',
      language: 'bash',
      code: `# Matches the main page's own S3 Backend example exactly
terraform {
  backend "s3" {
    bucket         = "my-company-tf-state"
    key            = "envs/prod/app/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-locks"   # separate table
                                                 # required for locking
  }
}
# Bootstrap also needs its own DynamoDB resource, its own IAM
# permissions, and its own ongoing cost -- exactly what the
# main page's own bootstrap example provisions.`,
    },
    {
      label: 'The current approach: use_lockfile, no DynamoDB at all',
      language: 'bash',
      code: `# Terraform 1.10+ -- locking lives inside the SAME S3 bucket,
# using S3's own conditional-write (If-None-Match) support:
terraform {
  backend "s3" {
    bucket       = "my-company-tf-state"
    key          = "envs/prod/app/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true   # native S3 locking -- no DynamoDB
  }
}
# No separate table, no separate IAM permissions for a
# DynamoDB resource, no separate cost line item -- state and
# lock both live in the one bucket already being used.

# Migrating an EXISTING DynamoDB-locked backend: change the
# backend block, then run the same migration command the main
# page's own Partial Configuration section already covers:
# terraform init -migrate-state

# dynamodb_table remains functional (deprecated in 1.11, not
# removed) -- existing configs are not forced to migrate.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own bootstrap example exactly, a team provisions an S3 bucket AND a DynamoDB table for a new Terraform backend, assuming DynamoDB is a required piece for S3-backend locking. A teammate on a recent Terraform version points out the DynamoDB table (and its own IAM permissions and cost) may not be necessary at all. What backend argument replaces DynamoDB\'s role, what underlying S3 capability does it rely on, and is dynamodb_table still usable for an existing configuration?',
    hint: 'AWS added a specific write capability to S3 itself in 2024 that Terraform later built a locking mechanism directly on top of, inside the same bucket already storing state.',
    solution: 'The `use_lockfile = true` argument (Terraform 1.10+) replaces DynamoDB\'s role — it relies on S3\'s own conditional-write capability (an If-None-Match HTTP header, added by AWS in August 2024) to create a lock file directly inside the same S3 bucket already storing state, with S3 itself rejecting a second write if the lock file already exists. This means no separate DynamoDB table, its IAM permissions, or its ongoing cost are needed at all. dynamodb_table remains fully usable for an existing configuration — it was marked deprecated in Terraform 1.11, not removed, so nothing forces an existing setup to migrate, though use_lockfile is the simpler, currently recommended approach for anything new.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A DynamoDB table is a required, unavoidable component of any S3-backed Terraform state configuration, exactly as the main page\'s own bootstrap example and mistake entry describe.',
      reality: 'Per this subtopic\'s theory, this was accurate for a long time but has since changed — Terraform 1.10+ supports use_lockfile, which provides the same locking guarantee using S3\'s own native conditional-write capability, with no DynamoDB table needed at all.'
    },
    {
      thought: 'dynamodb_table stopped working once use_lockfile was introduced, forcing every existing S3-backed configuration to migrate immediately.',
      reality: 'Per this subtopic\'s theory, dynamodb_table was marked deprecated (not removed) in Terraform 1.11 — it remains fully functional for existing configurations, and migrating to use_lockfile is an optional, deliberate backend-configuration change, not a forced one.'
    },
    {
      thought: 'use_lockfile provides a weaker or different kind of locking guarantee than DynamoDB, since it does not use a separate dedicated locking service.',
      reality: 'Per this subtopic\'s theory, use_lockfile provides functionally the same protection — S3 itself rejects a concurrent write attempt via the same conditional-write mechanism AWS added specifically to support this use case, not a lesser substitute.'
    }
  ];
}
