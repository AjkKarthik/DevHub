import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-tf-state',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './state.html',
  styleUrl: './state.scss',
})
export class TfState {
  quickRef: QuickRefItem[] = [
    { name: 'terraform.tfstate',        type: 'keyword', desc: 'Local state file — maps HCL resources to real infra.' },
    { name: 'terraform state list',     type: 'keyword', desc: 'List all tracked resources in state.' },
    { name: 'terraform state show',     type: 'keyword', desc: 'Show attributes of a specific resource in state.' },
    { name: 'terraform state mv',       type: 'keyword', desc: 'Rename or move a resource in state without recreating.' },
    { name: 'terraform state rm',       type: 'keyword', desc: 'Remove resource from state (stops tracking, does not destroy).' },
    { name: 'terraform state pull',     type: 'keyword', desc: 'Download remote state and print to stdout.' },
    { name: 'terraform state push',     type: 'keyword', desc: 'Upload local state to remote backend (use with caution).' },
    { name: 'terraform force-unlock',   type: 'keyword', desc: 'Release a stuck state lock (after confirming no concurrent run).' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is Terraform State?',
      points: [
        'State is a JSON file that maps your HCL configuration to real-world infrastructure resources.',
        'It stores resource IDs, attributes, and metadata — the authoritative record of what Terraform manages.',
        'Without state, Terraform cannot determine what already exists and would try to create everything fresh.',
        'Terraform compares state against the current configuration to compute the diff shown in terraform plan.',
        'Never manually edit the state file — use terraform state subcommands instead.',
      ],
    },
    {
      heading: 'State Locking',
      points: [
        'When terraform apply runs, it locks the state to prevent concurrent modifications.',
        'Local state has no locking — two simultaneous applies would corrupt it.',
        'Remote backends provide locking: S3+DynamoDB, Azure Blob (native lock), Terraform Cloud.',
        'A crashed apply may leave a stale lock — use terraform force-unlock <LOCK_ID> after verifying no other apply is running.',
        'State locking is one of the main reasons to use a remote backend for team use.',
      ],
    },
    {
      heading: 'Sensitive Data in State',
      points: [
        'State files store ALL resource attributes in plaintext — including passwords, keys, and certificates.',
        'Even resources created with sensitive = true variables store their values in state.',
        'Always use a remote backend with encryption at rest (S3 server-side encryption, Azure SSE).',
        'Restrict access to the state file strictly — it is equivalent to production credentials.',
        'Consider HashiCorp Vault or cloud secret managers instead of storing secrets as Terraform-managed resources.',
      ],
    },
    {
      heading: 'State Commands',
      points: [
        'terraform state list — show all resource addresses in state.',
        'terraform state show aws_instance.web — show all attributes of a specific resource.',
        'terraform state mv old.address new.address — rename/move resources (after refactoring) without destroy/recreate.',
        'terraform state rm resource.name — remove from state tracking (does not destroy the real resource).',
        'terraform refresh (deprecated in 1.5+) — sync state with real infrastructure. Use terraform plan -refresh-only instead.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'State Inspection',
      language: 'bash',
      code: `# List all resources in state
terraform state list

# Show a specific resource
terraform state show aws_instance.web

# Show all state as JSON
terraform show -json | jq .

# Pull remote state locally
terraform state pull > state-backup.json

# Refresh state from real infrastructure (read-only plan)
terraform plan -refresh-only`,
    },
    {
      label: 'State Operations',
      language: 'bash',
      code: `# Move resource (after renaming in HCL)
# Before: resource "aws_s3_bucket" "old" {}
# After:  resource "aws_s3_bucket" "new" {}
terraform state mv aws_s3_bucket.old aws_s3_bucket.new

# Remove from state (untrack without destroying)
# Use case: resource was created manually, don't want TF to destroy it
terraform state rm aws_instance.legacy

# Move resource into a module (refactoring)
# Before: resource "aws_vpc" "main" {}
# After:  module "network" { ... } with aws_vpc.main inside
terraform state mv aws_vpc.main module.network.aws_vpc.main

# Force release a stuck lock
terraform force-unlock <LOCK_ID>
# Get LOCK_ID from the error message or DynamoDB table`,
    },
    {
      label: 'Moved Block (TF 1.1+)',
      language: 'bash',
      code: `# Better alternative to terraform state mv for tracked refactors:
# After renaming from aws_s3_bucket.old to aws_s3_bucket.new in HCL

moved {
  from = aws_s3_bucket.old
  to   = aws_s3_bucket.new
}

# Terraform handles the state move automatically on next apply.
# Once applied, remove the moved block.

# Move into a module
moved {
  from = aws_vpc.main
  to   = module.network.aws_vpc.main
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Storing state locally for team use',
      wrong: `# No backend configured — state stored in local terraform.tfstate
# Two engineers run apply simultaneously — state corruption!`,
      right: `terraform {
  backend "s3" {
    bucket         = "my-tf-state-bucket"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}`,
      explanation: 'Local state has no locking. Multiple team members or CI runs will corrupt it. Always use a remote backend with locking for any shared environment.',
    },
    {
      title: 'Manually editing the state file',
      wrong: `# Do NOT do this:
vim terraform.tfstate
# Manually changing resource IDs or removing entries
# → corrupts state, causes plan errors or accidental recreation`,
      right: `# Use state subcommands instead:
terraform state mv old_resource new_resource
terraform state rm resource_to_untrack
# Or use moved {} blocks for tracked refactoring`,
      explanation: 'The state file is a structured JSON with checksums and metadata. Manual edits easily corrupt it. Always use terraform state commands.',
    },
    {
      title: 'Not encrypting remote state',
      wrong: `terraform {
  backend "s3" {
    bucket = "my-tf-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
    # encrypt not set — plaintext state with secrets!
  }
}`,
      right: `terraform {
  backend "s3" {
    bucket         = "my-tf-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true                       # AES-256 SSE
    dynamodb_table = "terraform-locks"
    kms_key_id     = "arn:aws:kms:..."          # optional CMK
  }
}`,
      explanation: 'State files contain plaintext secrets. Always enable encrypt = true on S3 backends and use a KMS key for sensitive workloads.',
    },
    {
      title: 'Using terraform refresh instead of plan -refresh-only',
      wrong: `terraform refresh
# Deprecated in 1.5+ and modifies state without a plan review`,
      right: `terraform plan -refresh-only
# Shows what state changes would be made, then:
terraform apply -refresh-only  # apply the state sync with review`,
      explanation: 'terraform refresh is deprecated. Use terraform plan -refresh-only to preview state sync before applying it — gives you visibility and an opportunity to review.',
    },
  ];

  challenge: Challenge = {
    title: 'State Refactoring with moved {}',
    language: 'typescript',
    description: 'You have an existing EC2 instance declared as resource "aws_instance" "app" {} and an S3 bucket as resource "aws_s3_bucket" "data" {}. Refactor by moving both into a module named "infra". Write the moved {} blocks and the module block. Then simulate removing the S3 bucket from Terraform management (without destroying it) using terraform state rm.',
    hints: [
      'moved { from = aws_instance.app; to = module.infra.aws_instance.app }',
      'moved { from = aws_s3_bucket.data; to = module.infra.aws_s3_bucket.data }',
      'module "infra" { source = "./modules/infra" }',
      'terraform state rm aws_s3_bucket.data (before moving, if untracking)',
    ],
    starterCode: `# Current state has:
# aws_instance.app
# aws_s3_bucket.data

# New structure: both inside module "infra"
module "infra" {
  source = "./modules/infra"
}

# TODO: moved blocks to migrate state

# To untrack data bucket without destroying:
# terraform state rm aws_s3_bucket.data`,
    solution: `module "infra" {
  source = "./modules/infra"
}

# Moved blocks — tell Terraform about the refactor
moved {
  from = aws_instance.app
  to   = module.infra.aws_instance.app
}

moved {
  from = aws_s3_bucket.data
  to   = module.infra.aws_s3_bucket.data
}

# After terraform apply succeeds, remove moved blocks.

# To untrack the S3 bucket (if you want to stop managing it):
# terraform state rm aws_s3_bucket.data
# (Run this BEFORE moving — once removed from state, moved block is not needed for it)`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What does terraform state rm do?', options: ['Destroys the real resource', 'Removes the resource from state tracking without destroying it', 'Deletes the state file', 'Removes a lock'], answer: 1, explanation: 'terraform state rm removes the resource from Terraform state tracking. The actual cloud resource is left intact — Terraform simply stops managing it.' },
    { q: 'Why is state locking important?', options: ['It speeds up plan', 'It prevents concurrent applies from corrupting state', 'It encrypts the state file', 'It prevents resource deletion'], answer: 1, explanation: 'Without locking, two concurrent apply operations could write conflicting state simultaneously, corrupting it. Remote backends like S3+DynamoDB provide locking.' },
    { q: 'What is the recommended way to rename a resource in state?', options: ['Delete and recreate', 'terraform state mv', 'Edit terraform.tfstate directly', 'terraform import'], answer: 1, explanation: 'terraform state mv (or moved {} blocks in TF 1.1+) renames the resource in state without destroying and recreating the actual infrastructure.' },
    { q: 'Where are secrets stored in a Terraform state file?', options: ['Encrypted separately', 'Not stored at all', 'In plaintext alongside all other attributes', 'Only in remote backends'], answer: 2, explanation: 'ALL resource attributes — including passwords, keys, and certificates — are stored in plaintext in the state file regardless of sensitive = true on variables.' },
  { q: 'What does terraform state list do?', options: ['It shows the history of all previous state files', 'It displays all resource addresses currently tracked in the Terraform state', 'It lists all available remote backends', 'It shows pending changes that have not been applied yet'], answer: 1, explanation: 'terraform state list shows all resource addresses in the current state file such as aws_instance.web or module.vpc.aws_subnet.public[0]. Use it to understand what Terraform is tracking. Combine with terraform state show followed by a resource address to see all stored attributes for a specific resource. Use terraform state pull to download the current remote state as JSON for inspection. These commands are read-only and safe to run at any time without risk of modifying state.' },
  { q: 'When would you use terraform state rm and what are the risks?', options: ['Use it to delete cloud resources that are no longer needed', 'Use it to remove a resource from state management so Terraform stops tracking it without deleting the real resource', 'Use it to reset the state file to a previous version', 'Use it to remove a provider from the state file'], answer: 1, explanation: 'terraform state rm removes a resource from the state file without destroying the actual cloud resource. Use it when you want Terraform to stop managing a resource, for example when moving management to another tool or another configuration. Risk: after state rm, terraform plan shows the resource as a new resource to create, which will fail because it already exists in the cloud. Always follow state rm with updating the configuration to remove the resource block, or use it deliberately when transferring resource management.' },
  ];

  qna: QnaItem[] = [
    { q: 'Can I have multiple state files for one project?', a: 'Yes — using workspaces or separate directory-based configurations. Each workspace or directory has its own state file, allowing environment isolation (dev vs prod).' },
    { q: 'What happens if two applies run simultaneously?', a: 'With a remote backend, the second apply waits for the first to release the lock. With local state, both run concurrently and corrupt the state file — this is why local state must never be used in teams.' },
    { q: 'What is the moved {} block advantage over terraform state mv?', a: 'moved {} is declarative — it lives in version-controlled HCL and is applied automatically. terraform state mv is an imperative CLI command that requires manual execution by each team member.' },
    { q: 'Can I recover from a corrupted state file?', a: 'If you have a backup (terraform state pull before the corruption), you can restore it with terraform state push. Remote backends like Terraform Cloud keep version history. Always back up state before risky operations.' },
  { q: 'How do you recover from a corrupted or lost Terraform state file?', a: 'If using remote backends with versioning enabled such as S3 versioning or Terraform Cloud run history, restore a previous version of the state file from the backend console or API. For complete state loss with no backup: re-import all managed resources using terraform import or import blocks in Terraform 1.5 and later. This is time-consuming for large configurations but is the only option without a backup. Prevention: always use remote backends with versioning enabled, enable locking to prevent corruption from concurrent runs, and periodically save snapshots with terraform state pull redirected to a file.' },
  { q: 'What is state locking in Terraform and what happens if a lock gets stuck?', a: 'State locking prevents concurrent modifications that could corrupt state. When terraform plan or apply runs, it acquires a lock on the state file. Other runs wait until the lock is released. With S3 and DynamoDB, a lock entry is written to the DynamoDB table. A stuck lock occurs when a Terraform process is killed mid-run leaving the lock entry in place. Other runs then hang waiting for the lock. Resolution: terraform force-unlock followed by the lock ID shown in the error message. Only use force-unlock when you are certain no other Terraform process is actively running, as forcing an unlock during an active run can corrupt state.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'State is the source of truth mapping HCL to real infra — keep it remote, locked, encrypted, and never manually edit it.',
    mustKnow: [
      'State maps resource blocks to real cloud resources by storing IDs and attributes',
      'Never edit terraform.tfstate manually — use terraform state mv/rm commands',
      'State contains plaintext secrets — use encrypted remote backends with access controls',
      'State locking (DynamoDB, Azure Blob native) prevents concurrent-apply corruption',
      'moved {} blocks (TF 1.1+) are the declarative alternative to terraform state mv',
      'terraform plan -refresh-only replaces deprecated terraform refresh',
    ],
    interviewFocus: [
      'Why must sensitive data still be protected even with sensitive = true?',
      'How does state locking work and what happens without it?',
      'How do you safely rename a Terraform resource without destroying it?',
    ],
  };
}
