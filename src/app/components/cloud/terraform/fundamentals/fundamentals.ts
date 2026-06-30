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
  selector: 'app-tf-fundamentals',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './fundamentals.html',
  styleUrl: './fundamentals.scss',
})
export class TfFundamentals {
  quickRef: QuickRefItem[] = [
    { name: 'terraform init',     type: 'keyword', desc: 'Download providers and initialize working directory.' },
    { name: 'terraform plan',     type: 'keyword', desc: 'Preview changes Terraform will make without applying.' },
    { name: 'terraform apply',    type: 'keyword', desc: 'Create, update, or destroy resources to match config.' },
    { name: 'terraform destroy',  type: 'keyword', desc: 'Remove all resources managed by the configuration.' },
    { name: 'terraform validate', type: 'keyword', desc: 'Check HCL syntax and internal consistency.' },
    { name: 'terraform fmt',      type: 'keyword', desc: 'Auto-format .tf files to canonical style.' },
    { name: 'resource block',     type: 'syntax',  desc: 'Declare a cloud resource: resource "TYPE" "NAME" {}.' },
    { name: 'provider block',     type: 'syntax',  desc: 'Configure a provider plugin (AWS, Azure, GCP, etc.).' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is Terraform?',
      points: [
        'Terraform is an open-source Infrastructure as Code (IaC) tool by HashiCorp that lets you define cloud resources in HCL (HashiCorp Configuration Language) and provision them declaratively.',
        'You describe the desired end state — "I want an EC2 instance with these settings" — and Terraform figures out how to get there.',
        'Terraform supports hundreds of providers: AWS, Azure, GCP, Kubernetes, GitHub, Datadog, and more.',
        'The core workflow is: write HCL → terraform init → terraform plan → terraform apply.',
      ],
    },
    {
      heading: 'HCL Syntax Basics',
      points: [
        'HCL uses blocks (resource, provider, variable, output, locals), arguments (key = value), and expressions.',
        'String interpolation: "prefix-\${var.name}-suffix" — inject variable values into strings.',
        'Comments: # single line, // single line, /* multi-line */.',
        'Files end in .tf; Terraform reads all .tf files in the working directory as one configuration.',
        'terraform fmt auto-formats HCL to canonical indentation (2 spaces).',
      ],
    },
    {
      heading: 'The Plan/Apply Lifecycle',
      points: [
        'terraform plan compares desired state (HCL) against current state (state file) and shows what will be created (+), updated (~), or destroyed (-).',
        'terraform apply executes the plan — calls cloud APIs to create/modify/delete resources.',
        'Terraform tracks all managed resources in a state file (terraform.tfstate) to detect drift.',
        'The state file is the source of truth — never manually edit it.',
        'terraform destroy is equivalent to removing all resources from config and running apply.',
      ],
    },
    {
      heading: 'Resource Addressing',
      points: [
        'Every resource is identified by: resource_type.resource_name (e.g. aws_instance.web).',
        'Reference attributes in other blocks: aws_instance.web.public_ip.',
        'Terraform builds a dependency graph from references and provisions resources in the correct order.',
        'Implicit dependencies are created automatically from attribute references.',
        'Use depends_on for explicit dependencies when Terraform cannot detect them automatically.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'main.tf — First Config',
      language: 'bash',
      code: `# Configure the AWS provider
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.5"
}

provider "aws" {
  region = "us-east-1"
}

# Declare a resource
resource "aws_s3_bucket" "my_bucket" {
  bucket = "my-unique-bucket-name-2024"

  tags = {
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

# Output an attribute
output "bucket_arn" {
  value = aws_s3_bucket.my_bucket.arn
}`,
    },
    {
      label: 'Init → Plan → Apply',
      language: 'bash',
      code: `# Step 1: Initialize — download providers
terraform init

# Step 2: Validate syntax
terraform validate

# Step 3: Format files
terraform fmt

# Step 4: Preview changes
terraform plan

# Step 5: Apply (with auto-approve for CI)
terraform apply
terraform apply -auto-approve   # skip confirmation prompt

# Step 6: Show current state
terraform show
terraform state list

# Step 7: Destroy (careful!)
terraform destroy`,
    },
    {
      label: 'HCL Syntax',
      language: 'bash',
      code: `# String interpolation
resource "aws_instance" "web" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"
  tags = {
    Name = "web-\${var.environment}-01"   # variable interpolation
  }
}

# Reference another resource's attribute
resource "aws_eip" "ip" {
  instance = aws_instance.web.id          # implicit dependency
}

# Locals for reusable expressions
locals {
  common_tags = {
    Project     = "MyApp"
    Environment = var.environment
  }
}

resource "aws_s3_bucket" "data" {
  bucket = "data-\${var.environment}"
  tags   = local.common_tags
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Committing terraform.tfstate to git',
      wrong: `# .gitignore missing state files
git add .
git commit -m "add terraform config"
# terraform.tfstate now in repo — contains secrets!`,
      right: `# .gitignore
*.tfstate
*.tfstate.*
.terraform/
*.tfvars       # may contain secrets`,
      explanation: 'State files contain plaintext secrets and resource IDs. Always gitignore them and use remote backends for team state.',
    },
    {
      title: 'Hardcoding region/credentials in provider',
      wrong: `provider "aws" {
  region     = "us-east-1"
  access_key = "AKIAIOSFODNN7EXAMPLE"
  secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}`,
      right: `provider "aws" {
  region = var.aws_region   # or AWS_DEFAULT_REGION env var
}
# Use env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
# Or IAM roles / OIDC for CI — never hardcode credentials`,
      explanation: 'Credentials in .tf files will leak to version control and state files. Use environment variables, IAM roles, or OIDC federation.',
    },
    {
      title: 'Running terraform apply without plan review',
      wrong: `terraform apply -auto-approve
# Blindly applies — no review of what changes are made`,
      right: `terraform plan -out=tfplan    # save the plan
terraform apply tfplan        # apply exactly that plan
# In CI: store plan as artifact, apply after review/approval`,
      explanation: 'Always review the plan before applying, especially in production. Save plans with -out to ensure apply matches exactly what was reviewed.',
    },
    {
      title: 'Using count instead of for_each for maps',
      wrong: `variable "buckets" {
  default = ["data", "logs", "backups"]
}
resource "aws_s3_bucket" "b" {
  count  = length(var.buckets)
  bucket = var.buckets[count.index]
}
# Removing "logs" renumbers indices → destroys and recreates "backups"`,
      right: `variable "buckets" {
  default = { data = "data-bucket", logs = "logs-bucket" }
}
resource "aws_s3_bucket" "b" {
  for_each = var.buckets
  bucket   = each.value
}
# Removing "logs" only removes logs — other resources untouched`,
      explanation: 'count uses numeric indices — removing a middle element shifts subsequent indices and triggers unnecessary recreations. for_each uses stable string keys.',
    },
    {
      title: 'Forgetting required_version constraint',
      wrong: `terraform {
  required_providers {
    aws = { source = "hashicorp/aws" }
  }
  # No required_version — runs on any Terraform version
}`,
      right: `terraform {
  required_version = ">= 1.5, < 2.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"   # ~> means >= 5.0, < 6.0
    }
  }
}`,
      explanation: 'Pin both the Terraform CLI version and provider versions. This prevents unexpected breakage when team members or CI use different versions.',
    },
  ];

  challenge: Challenge = {
    title: 'Write Your First Terraform Config',
    language: 'typescript',
    description: 'Create a Terraform configuration that defines an AWS S3 bucket with versioning enabled and an output for the bucket name. Include required_providers, a variable for the bucket name suffix, and a local for common tags.',
    hints: [
      'Use required_providers with hashicorp/aws ~> 5.0',
      'Define a variable "suffix" with a string type and default value',
      'Use locals to define common_tags with Environment = "dev"',
      'Enable versioning with aws_s3_bucket_versioning resource',
      'Output the bucket id and arn',
    ],
    starterCode: `# main.tf
terraform {
  required_providers {
    # TODO: add aws provider
  }
}

provider "aws" {
  region = "us-east-1"
}

variable "suffix" {
  # TODO: type and default
}

locals {
  # TODO: common_tags
}

resource "aws_s3_bucket" "main" {
  # TODO: bucket name using var.suffix
}

resource "aws_s3_bucket_versioning" "main" {
  # TODO: enable versioning
}

output "bucket_id" {
  # TODO
}`,
    solution: `terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

variable "suffix" {
  type    = string
  default = "my-app"
}

locals {
  common_tags = {
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}

resource "aws_s3_bucket" "main" {
  bucket = "devhub-demo-\${var.suffix}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

output "bucket_id" {
  value = aws_s3_bucket.main.id
}

output "bucket_arn" {
  value = aws_s3_bucket.main.arn
}`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What does terraform plan do?', options: ['Applies changes immediately', 'Downloads provider plugins', 'Shows what changes will be made without applying', 'Validates HCL syntax only'], answer: 2, explanation: 'terraform plan compares desired state (HCL) to current state (state file) and previews additions, modifications, and deletions.' },
    { q: 'What file tracks the real-world state of managed resources?', options: ['main.tf', 'terraform.tfstate', '.terraform/providers.json', 'outputs.tf'], answer: 1, explanation: 'terraform.tfstate is the state file Terraform uses to map resource blocks to real infrastructure.' },
    { q: 'Why is for_each preferred over count for named resources?', options: ['for_each is faster', 'for_each uses stable string keys, preventing index-shift recreation', 'count only works with lists of numbers', 'for_each supports more resource types'], answer: 1, explanation: 'count assigns numeric indices — removing an element shifts subsequent indices. for_each uses stable map keys, so removing one entry does not affect others.' },
    { q: 'Which command initializes a Terraform working directory?', options: ['terraform start', 'terraform setup', 'terraform init', 'terraform configure'], answer: 2, explanation: 'terraform init downloads provider plugins, sets up the backend, and installs modules — must be run first.' },
  { q: 'What is the Terraform state file and why is it important?', options: ['A log file that records all Terraform commands executed', 'A JSON file that maps configuration to real infrastructure resources and stores metadata', 'A backup of the HCL configuration files', 'A file that stores provider authentication credentials'], answer: 1, explanation: 'The state file is Terraform source of truth for what infrastructure it manages. It maps each resource block to the real cloud resource ID and stores last-known attribute values. Terraform uses state to calculate diffs during plan, track dependencies, and know which resources to destroy. Without state, Terraform cannot correlate config to real resources. Protect state files because they contain sensitive values and must not be committed to git.' },
  { q: 'What does terraform init do?', options: ['It creates all resources defined in the configuration', 'It downloads providers and modules, initializes the backend, and prepares the working directory', 'It validates the syntax of all HCL files', 'It imports existing cloud resources into the state file'], answer: 1, explanation: 'terraform init prepares the working directory: downloads provider plugins to the providers cache, downloads remote modules, initializes the configured backend for remote state, and creates the lock file. Run init after cloning a repo, adding a new provider, or changing the backend configuration. The -upgrade flag updates providers and modules to newer versions within the constraints specified in the configuration.' },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between terraform plan and terraform apply?', a: 'plan is read-only — it compares HCL config to state and shows what would change. apply executes those changes by calling cloud provider APIs. Always review plan output before apply.' },
    { q: 'Is HCL a programming language?', a: 'HCL is a declarative configuration language, not a general-purpose programming language. It supports variables, expressions, functions, and loops (for expressions) but lacks true imperative control flow like while loops or try/catch.' },
    { q: 'Can Terraform manage resources across multiple cloud providers?', a: 'Yes — you can use multiple provider blocks in one configuration. For example, provision AWS EC2 instances and Azure DNS records in the same plan.' },
    { q: 'What happens if I manually change a resource outside Terraform?', a: 'The next terraform plan detects drift — it compares the real resource state against the state file and shows the discrepancy. Running apply will reconcile the resource back to the declared HCL configuration.' },
  { q: 'What is the Terraform workflow and what does each step do?', a: 'The core workflow has three steps: terraform init downloads providers and modules and configures the backend. terraform plan calls provider APIs to read current state, diffs against desired configuration, and shows what will change without making any modifications to real infrastructure. terraform apply executes the plan, calls provider APIs to create, update, or delete resources, and updates the state file. Additional commands: terraform destroy tears down all managed resources. terraform validate checks configuration syntax without contacting APIs. terraform fmt reformats files to canonical HCL style.' },
  { q: 'What is idempotency in Terraform and why does it matter?', a: 'Idempotency means running terraform apply multiple times with the same configuration produces the same result without unintended side effects. If infrastructure already matches the desired state, apply makes no changes. This property is fundamental to infrastructure as code: you can safely re-run apply to recover from partial failures, reconcile drift, or confirm nothing changed. Terraform achieves idempotency by reading actual resource state via the provider API during plan and only making changes when the current state differs from the desired state.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Terraform is declarative IaC — you define desired state in HCL and init/plan/apply provisions it.',
    mustKnow: [
      'Core workflow: init → validate → fmt → plan → apply → destroy',
      'State file (terraform.tfstate) maps HCL resources to real infrastructure',
      'resource blocks declare cloud resources; provider blocks configure the plugin',
      'for_each with stable keys > count with numeric indices for named resources',
      'Never commit state files or credentials to version control',
      'terraform plan -out=tfplan saves plan; terraform apply tfplan applies exactly that plan',
    ],
    interviewFocus: [
      'What is Terraform state and why is it important?',
      'Difference between count and for_each — when to use each',
      'What happens during terraform plan vs terraform apply?',
      'How do you prevent credentials from ending up in Terraform configs?',
    ],
  };
}
