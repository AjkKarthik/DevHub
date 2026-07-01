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
  selector: 'app-tf-remote-backends',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './remote-backends.html',
  styleUrl: './remote-backends.scss',
})
export class TfRemoteBackends {
  quickRef: QuickRefItem[] = [
    { name: 'backend "s3" {}',         type: 'syntax',  desc: 'AWS S3 + DynamoDB backend with locking.' },
    { name: 'backend "azurerm" {}',    type: 'syntax',  desc: 'Azure Blob Storage backend with native locking.' },
    { name: 'backend "gcs" {}',        type: 'syntax',  desc: 'Google Cloud Storage backend.' },
    { name: 'backend "remote" {}',     type: 'syntax',  desc: 'Terraform Cloud / HCP Terraform backend.' },
    { name: 'dynamodb_table',          type: 'keyword', desc: 'DynamoDB table name for S3 backend state locking.' },
    { name: 'encrypt = true',          type: 'keyword', desc: 'Enable SSE encryption on S3 state.' },
    { name: 'terraform init -migrate-state', type: 'keyword', desc: 'Move existing state to a new backend.' },
    { name: 'partial configuration',   type: 'keyword', desc: 'Supply backend config via -backend-config at init time.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Remote Backends?',
      points: [
        'Local state (terraform.tfstate) has no locking and cannot be shared — dangerous for team use.',
        'Remote backends store state in cloud storage with versioning, access control, and locking.',
        'Remote backends decouple the state file from the developer\'s machine.',
        'All official backends support locking to prevent concurrent apply corruption.',
        'Team members and CI systems all read/write the same state file through the backend.',
      ],
    },
    {
      heading: 'S3 + DynamoDB Backend (AWS)',
      points: [
        'Most common AWS setup: S3 stores state, DynamoDB provides distributed locking.',
        'Create the S3 bucket and DynamoDB table before using them as backend (they cannot be Terraform-managed in the same config).',
        'S3 bucket: enable versioning for rollback capability, encrypt = true for AES-256 SSE.',
        'DynamoDB table: partition key must be LockID (String).',
        'Use a separate "bootstrap" Terraform config to create the state bucket itself.',
      ],
    },
    {
      heading: 'Azure & GCS Backends',
      points: [
        'Azure Blob Storage: backend "azurerm" — provides native state locking via blob leases, no extra resource needed.',
        'GCS: backend "gcs" — Google Cloud Storage with native state locking.',
        'Azure backend requires storage_account_name, container_name, and key.',
        'GCS backend requires bucket and prefix.',
        'Both support encryption at rest via their default cloud storage encryption.',
      ],
    },
    {
      heading: 'Partial Configuration & Migration',
      points: [
        'Partial configuration keeps sensitive backend values (access keys, tokens) out of version control.',
        'Supply remaining config at init time: terraform init -backend-config=backend.conf.',
        'backend.conf file contains the secrets — gitignore it.',
        'Migrating state: change the backend block, run terraform init — it offers to copy existing state.',
        'terraform init -migrate-state forces state migration without prompting.',
      ],
    },
    {
      heading: 'Backend Choice and State Locking',
      points: [
        'A remote backend (S3, Azure Storage, Terraform Cloud) stores state outside the local filesystem, enabling team collaboration — without it, state lives only on whichever individual\'s machine last ran Terraform, making concurrent team usage impossible and risking permanent state loss if that machine is lost.',
        'State locking (via DynamoDB for S3 backends, or built into Terraform Cloud) prevents two people or CI processes from running terraform apply simultaneously against the same state — without locking, concurrent applies can corrupt state through simultaneous writes, a serious and hard-to-recover-from failure mode.',
        'Backend configuration cannot use variables (it must be static, resolved before any variable evaluation happens) — this is a common point of confusion for new Terraform users trying to parameterize the backend configuration itself, which requires partial configuration and the -backend-config CLI flag instead.',
        'Migrating between backends (terraform init -migrate-state) requires careful execution — always back up existing state before a backend migration, since a failed or interrupted migration can leave state in an inconsistent or partially-migrated condition that is difficult to recover from.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'S3 Backend',
      language: 'bash',
      code: `terraform {
  backend "s3" {
    bucket         = "my-company-tf-state"
    key            = "envs/prod/app/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true                    # AES-256 SSE
    dynamodb_table = "terraform-state-locks" # locking table
    # LockID is the partition key type (String)
  }
}

# --- Bootstrap: create the state bucket (separate config) ---
resource "aws_s3_bucket" "tf_state" {
  bucket = "my-company-tf-state"
  lifecycle { prevent_destroy = true }
}
resource "aws_s3_bucket_versioning" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id
  versioning_configuration { status = "Enabled" }
}
resource "aws_dynamodb_table" "tf_locks" {
  name         = "terraform-state-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  attribute { name = "LockID"; type = "S" }
}`,
    },
    {
      label: 'Azure & GCS',
      language: 'bash',
      code: `# Azure Blob Storage backend
terraform {
  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "companytfstate"
    container_name       = "tfstate"
    key                  = "prod/app.tfstate"
    # Locking is native — no extra resource needed
  }
}

# GCS backend
terraform {
  backend "gcs" {
    bucket = "my-company-tf-state"
    prefix = "prod/app"
    # Locking is native to GCS
  }
}`,
    },
    {
      label: 'Partial Config',
      language: 'bash',
      code: `# backend.tf — committed to git (no secrets)
terraform {
  backend "s3" {
    key    = "envs/prod/terraform.tfstate"
    region = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
    # bucket is supplied at init time
  }
}

# backend-prod.conf — gitignored (contains account-specific values)
bucket = "my-prod-tf-state-bucket"

# Usage:
# terraform init -backend-config=backend-prod.conf

# --- State migration ---
# 1. Change the backend block
# 2. Run:
terraform init -migrate-state
# Terraform detects existing state and offers to copy it`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Creating the state bucket in the same config that uses it',
      wrong: `# main.tf — same config
resource "aws_s3_bucket" "state" { bucket = "tf-state" }
terraform {
  backend "s3" { bucket = "tf-state" }  # chicken-and-egg!
}`,
      right: `# bootstrap/ — separate config, apply first
resource "aws_s3_bucket" "state" { bucket = "tf-state" }

# app/ — uses the bucket created by bootstrap
terraform {
  backend "s3" { bucket = "tf-state", key = "app/terraform.tfstate" }
}`,
      explanation: 'The state bucket must exist before it can be used as a backend. Create it in a separate bootstrap configuration with local state, then migrate.',
    },
    {
      title: 'Missing DynamoDB table for S3 locking',
      wrong: `terraform {
  backend "s3" {
    bucket = "tf-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
    # No dynamodb_table — no locking!
  }
}`,
      right: `terraform {
  backend "s3" {
    bucket         = "tf-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}`,
      explanation: 'S3 does not provide native locking. Without a DynamoDB table, concurrent applies will run without lock protection and can corrupt state.',
    },
    {
      title: 'Hardcoding backend secrets in version control',
      wrong: `terraform {
  backend "s3" {
    bucket     = "tf-state"
    access_key = "AKIA..."      # in git!
    secret_key = "secret..."    # in git!
  }
}`,
      right: `# Use env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
# Or IAM instance profile / OIDC in CI
# Or partial config with gitignored backend.conf`,
      explanation: 'Backend credentials in HCL end up in git history. Use environment variables, IAM roles, or partial configuration with gitignored secret files.',
    },
  ];

  challenge: Challenge = {
    title: 'Bootstrap an S3 Backend',
    language: 'typescript',
    description: 'Write a Terraform bootstrap configuration that creates an S3 state bucket (with versioning and SSE), a DynamoDB lock table, and an IAM policy granting required permissions. Then write the backend block for a consumer workspace that uses these resources.',
    hints: [
      'S3 bucket needs versioning_configuration { status = "Enabled" }',
      'DynamoDB: billing_mode = "PAY_PER_REQUEST", hash_key = "LockID" (String)',
      'Add prevent_destroy = true lifecycle on both resources',
      'Consumer backend block: bucket, key, region, encrypt = true, dynamodb_table',
    ],
    starterCode: `# bootstrap/main.tf — apply this first with local state

resource "aws_s3_bucket" "state" {
  # TODO: bucket name, prevent_destroy
}

resource "aws_s3_bucket_versioning" "state" {
  # TODO: enable versioning
}

resource "aws_dynamodb_table" "locks" {
  # TODO: LockID table
}

# --- consumer/backend.tf ---
terraform {
  backend "s3" {
    # TODO: reference the bootstrap resources
  }
}`,
    solution: `# bootstrap/main.tf
resource "aws_s3_bucket" "state" {
  bucket = "my-company-tf-state-2024"
  lifecycle { prevent_destroy = true }
  tags = { Purpose = "TerraformState" }
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_dynamodb_table" "locks" {
  name         = "terraform-state-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  attribute { name = "LockID"; type = "S" }
  lifecycle { prevent_destroy = true }
}

# --- consumer/backend.tf ---
terraform {
  backend "s3" {
    bucket         = "my-company-tf-state-2024"
    key            = "prod/app/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-locks"
  }
}`,
  };

  quiz: QuizQuestion[] = [
    { q: 'Why is a DynamoDB table needed with the S3 backend?', options: ['To store provider plugins', 'S3 does not support native locking — DynamoDB provides distributed locking', 'For state versioning', 'For encrypting state'], answer: 1, explanation: 'S3 is object storage without native locking. DynamoDB provides a distributed lock (LockID key) that prevents concurrent Terraform applies from corrupting state.' },
    { q: 'What is partial backend configuration?', options: ['A backend with missing required fields', 'Supplying sensitive backend values at init time with -backend-config instead of in HCL', 'A backend used only for some resources', 'A read-only backend mode'], answer: 1, explanation: 'Partial configuration lets you commit non-sensitive backend settings to git and supply secrets (bucket names, tokens) via -backend-config files or CLI flags at init time.' },
    { q: 'What command migrates state to a new backend?', options: ['terraform state push', 'terraform backend migrate', 'terraform init -migrate-state', 'terraform apply -backend'], answer: 2, explanation: 'After changing the backend block, run terraform init -migrate-state. Terraform detects the existing state and offers to copy it to the new backend.' },
    { q: 'Which Azure resource provides locking for the azurerm backend?', options: ['A separate Azure Table Storage', 'Azure Key Vault', 'Native blob lease mechanism in Azure Blob Storage', 'Azure Service Bus'], answer: 2, explanation: 'The azurerm backend uses Azure Blob Storage native blob leases for state locking — no additional resource is needed unlike AWS S3 which requires DynamoDB.' },
  { q: 'What is the purpose of a Terraform remote backend?', options: ['A remote backend runs Terraform plans on a remote server instead of locally', 'A remote backend stores state files in a shared location with locking to enable team collaboration', 'A remote backend downloads provider plugins faster than local storage', 'A remote backend encrypts the Terraform configuration files'], answer: 1, explanation: 'A remote backend stores the Terraform state file in a shared location such as S3, Azure Blob Storage, GCS, or Terraform Cloud so that team members and CI/CD pipelines all work with the same state. Remote backends also provide state locking via DynamoDB for S3 or native locking for Terraform Cloud to prevent concurrent applies that would corrupt state. Without a remote backend, each developer has their own local state file and they conflict.' },
  { q: 'How do you configure an S3 remote backend with DynamoDB locking?', options: ['Set backend = s3 in a provider block', 'Add a terraform backend s3 block with bucket, key, region, and dynamodb_table attributes', 'Use an environment variable to specify the backend type', 'Create a backend.json file in the working directory'], answer: 1, explanation: 'In the terraform block, add a backend s3 block specifying the bucket name, the state file key path, the region, the DynamoDB table name for locking, and enable encryption. The DynamoDB table must have a hash key named LockID of type String. Run terraform init after adding or changing a backend to migrate state. Use -backend-config flags or a backend.hcl file to pass sensitive values like bucket names without committing them to source control.' },
  ];

  qna: QnaItem[] = [
    { q: 'Can the state bucket itself be managed by Terraform?', a: 'Not in the same configuration — this is the bootstrap problem. The state bucket must exist before it can be used as the backend. Create it with a separate bootstrap Terraform config using local state.' },
    { q: 'What happens if I change the backend key/bucket after apply?', a: 'Terraform treats it as a new backend. On the next init it will find no state at the new location and prompt to migrate. Always use terraform init -migrate-state when changing backend config to move the existing state.' },
    { q: 'How do I use different backends for dev vs prod?', a: 'Use different state file keys: dev/terraform.tfstate and prod/terraform.tfstate in the same bucket. Or use separate buckets for strong isolation. Workspaces automatically namespace state files under env:/<workspace>/key.' },
    { q: 'Does Terraform Cloud require a backend block?', a: 'Terraform Cloud uses a cloud block instead of a backend block (since TF 1.1). It provides remote plan/apply execution, state storage, and locking all in one.' },
  { q: 'How do you migrate Terraform state from local to a remote backend?', a: 'Steps: add the backend block to the Terraform configuration specifying the remote backend type and its configuration. Run terraform init. Terraform detects that state exists locally but the backend is now configured as remote and prompts whether to copy existing state to the new backend. Answer yes. Terraform copies the local state file to the remote backend. Delete the local terraform.tfstate file and commit the updated configuration. The state is now shared among all team members and CI pipelines. If migrating between remote backends such as from S3 to Terraform Cloud, terraform init handles the migration the same way.' },
  { q: 'What is partial backend configuration and when do you use it?', a: 'Partial backend configuration allows defining only some backend attributes in the HCL file and passing the rest at init time via -backend-config flags or a separate backend.hcl file. This is useful when sensitive values like bucket names or access keys should not be committed to the repository. The HCL file might specify only the region while bucket and state key path are passed as flags during init. This pattern is common in CI/CD where different environments use different state buckets, allowing the same configuration code to target dev, staging, or production state files based on the init-time configuration.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Remote backends store state in cloud storage with versioning and locking — essential for team use.',
    mustKnow: [
      'S3 backend: bucket for storage + DynamoDB (LockID key) for locking + encrypt = true',
      'Azure Blob: native locking via blob leases — no extra resource needed',
      'Bootstrap problem: create the state bucket with a separate config before using it as backend',
      'Partial config: commit non-sensitive backend config, supply secrets via -backend-config',
      'Migrate state: change backend block then run terraform init -migrate-state',
      'Versioning on the state bucket enables rollback to previous state versions',
    ],
    interviewFocus: [
      'Why does S3 backend need DynamoDB but Azure Blob does not?',
      'How do you bootstrap a Terraform state backend?',
      'Explain partial backend configuration and why it matters for security',
    ],
  };
}
