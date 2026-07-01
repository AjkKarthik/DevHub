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
  selector: 'app-tf-security',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './security.html',
  styleUrl: './security.scss',
})
export class TfSecurity {
  quickRef: QuickRefItem[] = [
    { name: 'sensitive = true',         type: 'keyword', desc: 'Marks variable/output as sensitive — redacted in logs.' },
    { name: 'checkov',                  type: 'keyword', desc: 'Open-source static security analysis for Terraform HCL.' },
    { name: 'tfsec',                    type: 'keyword', desc: 'Fast static security scanner for Terraform configs.' },
    { name: 'Sentinel',                 type: 'keyword', desc: 'HashiCorp policy-as-code framework (Terraform Cloud/Enterprise).' },
    { name: 'data "vault_generic_secret"', type: 'keyword', desc: 'Read secrets from HashiCorp Vault at plan/apply time.' },
    { name: 'prevent_destroy = true',   type: 'keyword', desc: 'Lifecycle guard against accidental resource destruction.' },
    { name: 'terraform.tfstate encryption', type: 'keyword', desc: 'S3 SSE / Azure Blob encryption for state at rest.' },
    { name: 'OPA (Open Policy Agent)',  type: 'keyword', desc: 'General policy engine — can enforce Terraform plan JSON.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Secrets in Terraform State',
      points: [
        'Terraform state stores all resource attributes — including passwords, private keys, and connection strings.',
        'State is plaintext JSON — anyone with read access to the state backend can see all secrets.',
        'Mitigations: encrypt state at rest (S3 SSE, Azure Blob encryption), restrict backend IAM access.',
        'Never commit .tfstate files to git — add to .gitignore and use a remote backend.',
        'sensitive = true on outputs/variables redacts values in logs but does NOT encrypt them in state.',
      ],
    },
    {
      heading: 'Static Security Analysis',
      points: [
        'tfsec: scans HCL for misconfigurations — public S3 buckets, unencrypted volumes, open security groups.',
        'checkov: broader ruleset (CIS Benchmarks, AWS/Azure/GCP security best practices).',
        'Both run without cloud credentials — pure static analysis against HCL files.',
        'Integrate in CI as a pre-plan gate: tfsec . or checkov -d . --framework terraform.',
        'Custom rules: tfsec supports .tfsec/custom_checks.json; checkov supports custom Python checks.',
      ],
    },
    {
      heading: 'Policy as Code',
      points: [
        'Sentinel (Terraform Cloud/Enterprise): policies written in Sentinel language, run between plan and apply.',
        'Sentinel modes: advisory (warn only), soft-mandatory (overridable with permission), hard-mandatory (block).',
        'OPA (Open Policy Agent): open-source, enforces policies against terraform plan JSON output.',
        'conftest: wraps OPA with simpler CLI — conftest test plan.json enforces .rego policies.',
        'Use policies for: mandatory tagging, allowed regions, approved instance types, cost thresholds.',
      ],
    },
    {
      heading: 'Secrets Management Integration',
      points: [
        'Vault provider: data "vault_generic_secret" reads secrets at plan/apply time — secret never in HCL.',
        'AWS Secrets Manager: data "aws_secretsmanager_secret_version" retrieves secrets dynamically.',
        'Pattern: Terraform reads DB password from Vault, passes to RDS resource — not hardcoded in vars.',
        'Environment variables (TF_VAR_db_password) avoid secrets in files but appear in process list.',
        'Never use default = "password" on sensitive variables — use no default to force explicit supply.',
      ],
    },
    {
      heading: 'Managing Secrets Safely in Terraform Configuration',
      points: [
        'Sensitive values (database passwords, API keys) should never be hardcoded directly in .tf files, since these files are typically committed to version control — use variables marked sensitive = true, sourced from a secrets manager or environment variables at runtime instead.',
        'Marking a variable or output as sensitive prevents its value from appearing in CLI output during plan/apply, but does NOT encrypt it within the state file itself — state files can contain sensitive values in plain text, making state file access control and encryption at rest equally important security measures.',
        'Integrating with a dedicated secrets manager (AWS Secrets Manager, HashiCorp Vault) via a data source to fetch secrets at apply time (rather than passing them as Terraform variables from CI environment variables) keeps secrets out of both the Terraform configuration and CI system entirely, reducing the number of places a secret could potentially leak.',
        'Static analysis security tools (tfsec, Checkov) can scan Terraform configuration for common security misconfigurations (an S3 bucket without encryption, a security group open to 0.0.0.0/0) before apply — integrating these into CI catches security issues at review time rather than after infrastructure has already been provisioned insecurely.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Sensitive Variables & Outputs',
      language: 'bash',
      code: `# variables.tf
variable "db_password" {
  type        = string
  description = "RDS master password"
  sensitive   = true   # redacted in terraform plan/apply output
  # no default = forces caller to supply it
}

variable "api_key" {
  type      = string
  sensitive = true
}

# outputs.tf
output "db_connection_string" {
  value     = "postgresql://admin:\${var.db_password}@\${aws_db_instance.main.endpoint}/app"
  sensitive = true   # redacted in output — but still in state!
}

# Supply via env var (recommended):
# export TF_VAR_db_password="<from-secret-manager>"
# Or via tfvars file that is gitignored:
# terraform.tfvars (in .gitignore):
# db_password = "secret-from-vault"`,
    },
    {
      label: 'Vault & AWS Secrets Manager',
      language: 'bash',
      code: `# Read from HashiCorp Vault
provider "vault" {
  address = "https://vault.company.com"
  # Auth via env: VAULT_TOKEN or VAULT_ROLE_ID/VAULT_SECRET_ID
}

data "vault_generic_secret" "db" {
  path = "secret/production/database"
}

resource "aws_db_instance" "main" {
  identifier     = "prod-db"
  engine         = "postgres"
  instance_class = "db.t3.medium"
  username       = data.vault_generic_secret.db.data["username"]
  password       = data.vault_generic_secret.db.data["password"]
  # Password never appears in HCL — fetched at apply time
}

# --- OR: AWS Secrets Manager ---
data "aws_secretsmanager_secret_version" "db" {
  secret_id = "prod/database/credentials"
}

locals {
  db_creds = jsondecode(data.aws_secretsmanager_secret_version.db.secret_string)
}

resource "aws_db_instance" "main" {
  username = local.db_creds["username"]
  password = local.db_creds["password"]
}`,
    },
    {
      label: 'tfsec & Sentinel Policy',
      language: 'bash',
      code: `# Run tfsec in CI
docker run --rm -v "\$(pwd):/src" aquasec/tfsec /src
# Or: brew install tfsec && tfsec .

# Example tfsec findings:
# [aws-s3-no-public-access-with-acl] Bucket has public read access
# [aws-ec2-no-public-ingress-sgr] Security group allows 0.0.0.0/0 on port 22

# --- Sentinel policy (Terraform Cloud) ---
# policies/require-tags.sentinel
import "tfplan/v2" as tfplan

mandatory_tags = ["Environment", "Owner", "CostCenter"]

# Check all resources have required tags
all_resources_tagged = rule {
  all tfplan.resource_changes as _, changes {
    all mandatory_tags as tag {
      changes.change.after.tags[tag] is not null
    }
  }
}

main = rule { all_resources_tagged }

# sentinel.hcl
policy "require-tags" {
  source            = "./policies/require-tags.sentinel"
  enforcement_level = "hard-mandatory"
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Assuming sensitive = true encrypts the value in state',
      wrong: `output "db_password" {
  value     = var.db_password
  sensitive = true   # "safe now" — WRONG assumption
}
# terraform state show will still show the plaintext password!`,
      right: `# sensitive = true only REDACTS display in terminal output
# The value is still PLAINTEXT in the state file JSON
# Protect state itself:
# 1. S3 with SSE + KMS encryption
# 2. Restrict IAM: only CI role can read state bucket
# 3. Enable S3 versioning + CloudTrail on state bucket
# 4. Never store state in git`,
      explanation: 'sensitive = true prevents the value from being shown in plan/apply terminal output. It does NOT encrypt the value in state. Secure the state backend itself (encryption + IAM) to protect secret values.',
    },
    {
      title: 'Hardcoding credentials in HCL or provider blocks',
      wrong: `provider "aws" {
  access_key = "AKIAIOSFODNN7EXAMPLE"   # leaked to git!
  secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}

variable "db_password" {
  default = "Passw0rd123!"  # visible in state and plan!
}`,
      right: `# Use environment variables — no credentials in HCL
# export AWS_ACCESS_KEY_ID=...
# export AWS_SECRET_ACCESS_KEY=...
provider "aws" {
  region = "us-east-1"
  # credentials from environment or instance profile
}

variable "db_password" {
  type      = string
  sensitive = true
  # NO default — forces explicit supply from env/vault
}`,
      explanation: 'Never put credentials in HCL — they will appear in git history, plan output, and state. Use environment variables, IAM roles, or Vault. Always set no default on sensitive variables.',
    },
    {
      title: 'Skipping state backend encryption',
      wrong: `terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
    # No encryption — state is stored plaintext!
  }
}`,
      right: `terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true              # AES-256 server-side encryption
    kms_key_id     = "arn:aws:kms:..."  # optional: CMK for stronger control
    dynamodb_table = "terraform-locks"
  }
}`,
      explanation: 'S3 state files are plaintext JSON by default. Always set encrypt = true. For production, use a KMS customer-managed key (CMK) for auditable encryption. Also restrict the S3 bucket policy to CI role only.',
    },
  ];

  challenge: Challenge = {
    title: 'Secure an RDS Module',
    language: 'typescript',
    description: 'Secure an RDS module: (1) Add a sensitive db_password variable with no default, (2) Read the password from AWS Secrets Manager instead using a data source, (3) Add prevent_destroy lifecycle, (4) Add a sensitive output for the connection string, (5) Ensure the S3 backend has encrypt=true.',
    hints: [
      'data "aws_secretsmanager_secret_version" with secret_id',
      'jsondecode(data.xxx.secret_string)["password"]',
      'sensitive = true on both variable and output',
      'lifecycle { prevent_destroy = true } on aws_db_instance',
    ],
    starterCode: `# variables.tf
variable "db_password" {
  # TODO: make sensitive, no default
}

# data.tf
# TODO: read from AWS Secrets Manager "prod/db"

# main.tf
resource "aws_db_instance" "main" {
  identifier     = "prod-db"
  instance_class = "db.t3.medium"
  engine         = "postgres"
  username       = "admin"
  password       = var.db_password  # TODO: use secrets manager instead
  # TODO: add prevent_destroy lifecycle
}

# outputs.tf
output "endpoint" {
  value = aws_db_instance.main.endpoint
  # TODO: make sensitive
}`,
    solution: `# variables.tf
variable "environment" { type = string; default = "prod" }

# data.tf
data "aws_secretsmanager_secret_version" "db" {
  secret_id = "\${var.environment}/db"
}

locals {
  db_creds = jsondecode(data.aws_secretsmanager_secret_version.db.secret_string)
}

# main.tf
resource "aws_db_instance" "main" {
  identifier     = "prod-db"
  instance_class = "db.t3.medium"
  engine         = "postgres"
  engine_version = "15"
  username       = local.db_creds["username"]
  password       = local.db_creds["password"]

  lifecycle {
    prevent_destroy = true
  }
}

# outputs.tf
output "connection_string" {
  value     = "postgresql://\${local.db_creds["username"]}@\${aws_db_instance.main.endpoint}/app"
  sensitive = true
}`,
  };

  quiz: QuizQuestion[] = [
    { q: 'Does sensitive = true on an output encrypt the value in state?', options: ['Yes — it encrypts with AES-256', 'No — it only redacts the value in terminal output', 'Yes — if state backend is S3', 'No effect at all'], answer: 1, explanation: 'sensitive = true only prevents the value from being displayed in terminal plan/apply output. The value is still stored as plaintext JSON in the state file. Secure state with backend encryption and IAM controls.' },
    { q: 'What is the best way to supply sensitive variable values?', options: ['Set default = "password"', 'Use TF_VAR_ env variable or a Vault data source', 'Put in terraform.tfvars and commit to git', 'Use -var flag in CI with the value hardcoded'], answer: 1, explanation: 'TF_VAR_ environment variables from a secrets manager, or Vault/Secrets Manager data sources, keep credentials out of HCL, state, and git history. Always use no default on sensitive variables.' },
    { q: 'What does tfsec do?', options: ['Tests Terraform providers', 'Scans HCL for security misconfigurations statically', 'Encrypts state files', 'Validates provider API calls'], answer: 1, explanation: 'tfsec is a static security scanner — it reads HCL and detects misconfigurations (public S3 buckets, open SSH, unencrypted volumes) without any cloud credentials or API calls.' },
    { q: 'What is Sentinel in Terraform?', options: ['A monitoring tool', 'HashiCorp\'s policy-as-code framework for Terraform Cloud/Enterprise', 'A state backup mechanism', 'A provider plugin'], answer: 1, explanation: 'Sentinel is HashiCorp\'s policy-as-code framework, available in Terraform Cloud and Enterprise. Policies run between plan and apply to enforce compliance (tagging, allowed regions, etc.) before resources are changed.' },
  { q: 'What is the recommended way to provide cloud credentials to Terraform without hardcoding them?', options: ['Store credentials directly in the terraform.tfvars file', 'Use instance roles, workload identity, or environment variables; never put credentials in HCL or tfvars files', 'Encrypt credentials using a Terraform function before adding them to config', 'Use the credentials argument in the provider block with a base64-encoded value'], answer: 1, explanation: 'Best practices for credentials: use OIDC workload identity for CI/CD such as GitHub Actions to AWS via the official AWS credentials action, which issues temporary credentials with no long-lived keys stored. For local development, use named profiles or IAM Identity Center SSO. For VMs in cloud, use instance roles or managed identities. Environment variables are acceptable for temporary credentials but should never be committed to any file in source control.' },
  { q: 'How do you manage secrets like database passwords in Terraform without exposing them in plain state?', options: ['Store passwords in terraform.tfvars and add it to .gitignore', 'Generate secrets with a secrets manager resource and reference them by ID rather than storing the value in Terraform', 'Mark all sensitive variables and they will be excluded from state storage', 'Use encrypted tfvars files with GPG keys'], answer: 1, explanation: 'Terraform state stores all resource attributes including sensitive ones in its JSON format. Strategies to minimize exposure: generate passwords with a secrets manager and reference the secret by ARN or ID rather than by value. Use the random_password resource to generate passwords and store only in the secret manager, not as plain outputs. Mark sensitive variables and outputs to prevent display in logs. Enable state encryption in OpenTofu or use Terraform Cloud which encrypts state at rest.' },
  ];

  qna: QnaItem[] = [
    { q: 'How do I prevent a sensitive variable from appearing in CI logs?', a: 'Use TF_VAR_ env vars set from your CI secret store (GitHub Actions secrets, GitLab CI variables). Set sensitive = true in the variable definition. Use TF_IN_AUTOMATION=true to suppress prompts. Avoid -var="password=..." in shell commands (visible in process list).' },
    { q: 'Should I use Vault or Secrets Manager for Terraform secrets?', a: 'Both work well. Vault is cloud-agnostic and ideal if you already run it. AWS Secrets Manager / Azure Key Vault are simpler if you are single-cloud. The pattern is the same: use a data source to read the secret at apply time, never hardcode in HCL.' },
    { q: 'What is the difference between tfsec and checkov?', a: 'Both are static analysis tools. tfsec is focused purely on Terraform, is written in Go, and is very fast. checkov is Python-based, broader (supports CloudFormation, ARM, Dockerfile too), and has a larger ruleset aligned to CIS Benchmarks. Many teams run both.' },
    { q: 'Can Sentinel prevent a deploy to wrong regions?', a: 'Yes. A Sentinel policy can check tfplan for all resources and verify region == "us-east-1" (or approved list). Set enforcement_level = hard-mandatory to block applies that violate the policy. This is a common governance use case.' },
  { q: 'What Terraform security scanning tools should you use and what do they check?', a: 'tfsec, now integrated into Trivy, scans Terraform configs for security misconfigurations against a large rule library covering AWS, Azure, and GCP. Checkov is a broader static analysis tool covering Terraform, CloudFormation, Kubernetes, and Dockerfile security. Both check for overly permissive IAM policies, unencrypted storage volumes, publicly accessible S3 buckets, security groups with open ingress on sensitive ports, and missing logging and monitoring configurations. Integrate these in CI to block merges with security issues. Terraform Sentinel in Terraform Cloud allows writing custom policy-as-code rules for compliance enforcement.' },
  { q: 'How do you implement least-privilege IAM for Terraform in AWS?', a: 'Create a dedicated IAM role or user for Terraform with only the permissions needed for the resources it manages. Start with broader permissions in development, then use IAM Access Analyzer to generate a least-privilege policy from actual CloudTrail events after a period of normal usage. Separate the Terraform IAM principal from application IAM principals: Terraform creates the application role but does not use it at runtime. Use IAM permission boundaries to limit the maximum permissions Terraform can grant to resources it creates. In CI/CD, use GitHub Actions OIDC instead of long-lived access keys for temporary assume-role credentials scoped to each workflow run.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Secure Terraform: encrypt state at rest, use sensitive variables without defaults, pull secrets from Vault/Secrets Manager, and enforce policies with Sentinel/checkov/tfsec.',
    mustKnow: [
      'sensitive = true: redacts terminal display — does NOT encrypt in state',
      'State is plaintext JSON — encrypt backend (S3 SSE/KMS) and restrict IAM access',
      'Never put credentials in HCL; use TF_VAR_ env or Vault/Secrets Manager data sources',
      'tfsec / checkov: static security scanning in CI before plan',
      'Sentinel (Terraform Cloud): policy-as-code between plan and apply',
      'prevent_destroy = true: lifecycle guard for production databases and state buckets',
    ],
    interviewFocus: [
      'How do you handle secrets in Terraform without committing them to git?',
      'What does sensitive = true actually protect?',
      'How do you enforce organizational policies across all Terraform applies?',
    ],
  };
}
