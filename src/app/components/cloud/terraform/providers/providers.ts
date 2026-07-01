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
  selector: 'app-tf-providers',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './providers.html',
  styleUrl: './providers.scss',
})
export class TfProviders {
  quickRef: QuickRefItem[] = [
    { name: 'required_providers',   type: 'syntax',  desc: 'Declare provider sources and version constraints.' },
    { name: 'provider "aws" {}',    type: 'syntax',  desc: 'Configure a provider (region, auth, endpoints).' },
    { name: 'source',               type: 'keyword', desc: 'Registry address: "hashicorp/aws" or "namespace/name".' },
    { name: 'version = "~> 5.0"',  type: 'syntax',  desc: 'Pessimistic constraint: >= 5.0, < 6.0.' },
    { name: 'alias',                type: 'keyword', desc: 'Named provider config — use for multi-region or multi-account.' },
    { name: 'provider = aws.west',  type: 'syntax',  desc: 'Reference an aliased provider in a resource block.' },
    { name: '.terraform.lock.hcl', type: 'keyword', desc: 'Dependency lock file — commit this to version control.' },
    { name: 'terraform providers',  type: 'keyword', desc: 'Show required providers and their versions.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is a Provider?',
      points: [
        'A provider is a plugin that knows how to interact with a specific API — AWS, Azure, GCP, Kubernetes, GitHub, etc.',
        'Providers are not bundled with Terraform — they are downloaded from the Terraform Registry on terraform init.',
        'Each provider exposes resource types (aws_s3_bucket) and data sources (data.aws_ami) that you use in HCL.',
        'The Terraform Registry (registry.terraform.io) hosts thousands of providers from HashiCorp, partners, and the community.',
      ],
    },
    {
      heading: 'required_providers and Version Constraints',
      points: [
        'Declare providers in the terraform block under required_providers with source and version.',
        'source = "hashicorp/aws" — namespace/type format. Official HashiCorp providers use the hashicorp namespace.',
        'Version constraints: = "5.0.0" (exact), ">= 5.0" (minimum), "~> 5.0" (pessimistic — >= 5.0 and < 6.0), "!= 5.1.0" (exclude).',
        '~> is the most common constraint — it allows patch and minor upgrades but not major breaking changes.',
        'terraform init creates .terraform.lock.hcl with exact provider versions — commit this file to lock the team to the same versions.',
      ],
    },
    {
      heading: 'Provider Configuration',
      points: [
        'provider "aws" {} configures a provider — sets the region, credentials, endpoint overrides, etc.',
        'Never hardcode credentials in provider blocks. Use environment variables (AWS_ACCESS_KEY_ID) or IAM roles.',
        'Multiple provider configurations for the same type use alias — required for multi-region or multi-account setups.',
        'Resources reference an aliased provider with provider = aws.us_west_2.',
        'Child modules receive providers from the parent — use provider = { aws = aws.west } in the module block.',
      ],
    },
    {
      heading: 'Provider Lock File',
      points: [
        '.terraform.lock.hcl records the exact provider versions and checksums selected during terraform init.',
        'Commit .terraform.lock.hcl to version control — it ensures all team members and CI use identical provider versions.',
        'terraform init -upgrade ignores the lock file and selects the newest matching versions.',
        'The lock file prevents "works on my machine" issues caused by different provider patch versions.',
      ],
    },
    {
      heading: 'Provider Version Constraints and Configuration Aliases',
      points: [
        'Provider version constraints (required_providers block with a version constraint like "~> 5.0") pin which provider plugin versions are acceptable — omitting version constraints risks a provider update introducing breaking changes that silently alter plan behavior on a future run.',
        'Provider configuration aliases (provider "aws" { alias = "us-east-1" }) let a single Terraform configuration manage resources across multiple regions or accounts using the same provider — each resource explicitly references which provider configuration (via the provider meta-argument) it should use.',
        'The provider lock file (.terraform.lock.hcl) records the exact provider versions and cryptographic checksums used, ensuring the same provider version is used consistently across different machines and CI runs — this file should be committed to version control, not gitignored.',
        'Provider authentication should generally be handled outside the Terraform configuration itself (environment variables, instance IAM roles, or a credentials file) rather than hardcoding credentials directly in provider blocks, which would risk committing sensitive credentials to version control.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'required_providers',
      language: 'bash',
      code: `terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"         # >= 5.0.0, < 6.0.0
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.0, < 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}`,
    },
    {
      label: 'Provider Config',
      language: 'bash',
      code: `# Simple provider — auth via env vars
provider "aws" {
  region = var.aws_region
}

# Multi-region: aliased providers
provider "aws" {
  alias  = "us_east"
  region = "us-east-1"
}

provider "aws" {
  alias  = "eu_west"
  region = "eu-west-1"
}

# Resource using a specific alias
resource "aws_s3_bucket" "eu_bucket" {
  provider = aws.eu_west
  bucket   = "my-eu-bucket"
}

# Azure provider
provider "azurerm" {
  features {}   # required empty features block
  subscription_id = var.subscription_id
}`,
    },
    {
      label: 'Multi-Account AWS',
      language: 'bash',
      code: `# Assume cross-account role for production
provider "aws" {
  alias  = "prod"
  region = "us-east-1"

  assume_role {
    role_arn     = "arn:aws:iam::123456789012:role/TerraformRole"
    session_name = "TerraformSession"
  }
}

resource "aws_s3_bucket" "prod_data" {
  provider = aws.prod
  bucket   = "prod-data-bucket"
}

# Pass aliased provider to a module
module "prod_network" {
  source = "./modules/network"

  providers = {
    aws = aws.prod   # module's aws provider = our prod alias
  }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not pinning provider versions',
      wrong: `required_providers {
  aws = { source = "hashicorp/aws" }
}
# No version — next team member gets a different version`,
      right: `required_providers {
  aws = {
    source  = "hashicorp/aws"
    version = "~> 5.0"
  }
}
# Commit .terraform.lock.hcl to lock exact versions`,
      explanation: 'Unpinned providers will silently upgrade and may introduce breaking changes. Always pin with ~> and commit the lock file.',
    },
    {
      title: 'Ignoring the lock file',
      wrong: `# .gitignore
.terraform.lock.hcl   # DON'T do this
.terraform/`,
      right: `# .gitignore
.terraform/           # ignore downloaded binaries
# DO commit .terraform.lock.hcl — it locks exact versions`,
      explanation: '.terraform.lock.hcl ensures reproducibility. Excluding it means different environments may use different provider patch versions.',
    },
    {
      title: 'Hardcoding credentials in provider block',
      wrong: `provider "aws" {
  access_key = "AKIAIOSFODNN7EXAMPLE"
  secret_key = "wJalrXUtnFEMI/K7MDENG..."
}`,
      right: `provider "aws" {
  region = "us-east-1"
}
# Set env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
# Or use IAM instance profiles, OIDC, or AWS SSO`,
      explanation: 'Credentials in .tf files leak to version control and the state file. Use environment variables, IAM roles, or OIDC for CI.',
    },
    {
      title: 'Forgetting features {} in azurerm',
      wrong: `provider "azurerm" {
  subscription_id = var.subscription_id
}
# Error: The "features" argument is required`,
      right: `provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}`,
      explanation: 'The AzureRM provider requires an empty features {} block even when you do not need to set any feature flags.',
    },
  ];

  challenge: Challenge = {
    title: 'Configure Multi-Region AWS Providers',
    language: 'typescript',
    description: 'Write a Terraform configuration with two aliased AWS providers (us-east-1 and eu-west-1). Create an S3 bucket in each region. Define a variable for a name prefix and output both bucket ARNs.',
    hints: [
      'Use alias = "us_east" and alias = "eu_west" in two provider "aws" blocks',
      'Reference with provider = aws.us_east in resource blocks',
      'Bucket names must be globally unique — use the name prefix variable',
      'Output both bucket ARNs',
    ],
    starterCode: `terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

variable "prefix" {
  type    = string
  default = "devhub"
}

# TODO: two aliased provider blocks

# TODO: us-east bucket

# TODO: eu-west bucket

# TODO: two outputs`,
    solution: `terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

variable "prefix" {
  type    = string
  default = "devhub"
}

provider "aws" {
  alias  = "us_east"
  region = "us-east-1"
}

provider "aws" {
  alias  = "eu_west"
  region = "eu-west-1"
}

resource "aws_s3_bucket" "us" {
  provider = aws.us_east
  bucket   = "\${var.prefix}-us-east-data"
}

resource "aws_s3_bucket" "eu" {
  provider = aws.eu_west
  bucket   = "\${var.prefix}-eu-west-data"
}

output "us_bucket_arn" { value = aws_s3_bucket.us.arn }
output "eu_bucket_arn" { value = aws_s3_bucket.eu.arn }`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What does ~> 5.0 mean as a version constraint?', options: ['Exactly 5.0.0', '>= 5.0.0 and < 6.0.0', '>= 5.0.0 with no upper bound', 'Only 5.x patch releases'], answer: 1, explanation: '~> is the pessimistic constraint operator. ~> 5.0 means >= 5.0 and < 6.0. ~> 5.0.1 would mean >= 5.0.1 and < 5.1.0.' },
    { q: 'Which file should be committed to version control to lock provider versions?', options: ['terraform.tfstate', '.terraform/providers/', '.terraform.lock.hcl', 'terraform.tfvars'], answer: 2, explanation: '.terraform.lock.hcl records exact provider versions and checksums. Committing it ensures all environments use identical providers.' },
    { q: 'How do you configure a resource to use an aliased provider?', options: ['By name convention', 'provider = aws.alias_name in the resource block', 'Using depends_on', 'By placing the resource in the same file as the provider'], answer: 1, explanation: 'Resource blocks have a meta-argument provider = <type>.<alias> that routes to the specified aliased provider configuration.' },
    { q: 'When is provider configuration in a child module overridden?', options: ['Never', 'When the root module passes providers = { aws = aws.alias }', 'When using count > 1', 'Automatically based on region'], answer: 1, explanation: 'Child modules inherit providers from the root by default. Use the providers argument on the module block to pass specific aliased providers.' },
  { q: 'What is a Terraform provider and what does it do?', options: ['A provider is a Terraform configuration template for a cloud service', 'A provider is a plugin that translates Terraform resource blocks into API calls for a specific platform', 'A provider is a hosted service that runs Terraform on your behalf', 'A provider is a set of modules for a specific cloud vendor'], answer: 1, explanation: 'A Terraform provider is a plugin binary that implements the resource types for a specific platform such as AWS, Azure, GCP, Kubernetes, or GitHub. Each provider translates resource and data source blocks into API calls. Providers are downloaded during terraform init from the Terraform Registry. Providers are versioned independently from Terraform and must be pinned in required_providers to ensure reproducible builds across team members and CI pipelines.' },
  { q: 'How do you configure multiple AWS provider instances for different regions in Terraform?', options: ['Use environment variables to switch regions between resource blocks', 'Use provider aliases: define multiple provider blocks with an alias and reference them in resources using provider attribute', 'Define separate tfvars files per region and run multiple plans', 'Multiple regions require multiple separate Terraform configurations'], answer: 1, explanation: 'Use provider aliases: define two aws provider blocks each with a different alias and region attribute. Reference them per resource using the provider attribute set to the aliased provider. Modules that need a non-default provider receive it via the providers argument in the module block, which maps the provider configuration alias to what the module expects. The default provider block without an alias is used by resources without an explicit provider reference.' },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between the provider block and required_providers?', a: 'required_providers declares what providers are needed and their version constraints. The provider block configures how a provider behaves (region, auth, etc.). You can have required_providers without a provider block if defaults suffice, but the declaration is needed for downloading.' },
    { q: 'How does Terraform authenticate to cloud providers?', a: 'Terraform uses the provider SDK which follows the same auth chain as the cloud CLI. For AWS: environment variables → shared credentials file → IAM instance profile → OIDC. Never put credentials in .tf files.' },
    { q: 'Can I use community providers not from HashiCorp?', a: 'Yes. Set source = "namespace/provider-name" for community providers on the Terraform Registry. For private providers, use a private registry or local filesystem path as source.' },
    { q: 'What does terraform init -upgrade do?', a: 'It re-selects providers ignoring the lock file constraints and chooses the newest version matching your version constraints. It also updates .terraform.lock.hcl with new checksums. Use carefully — upgrades may include breaking changes.' },
  { q: 'What is the provider lock file and why is it important?', a: 'The .terraform.lock.hcl file records the exact provider versions and their checksums that were selected during terraform init. It should be committed to source control. When teammates or CI runs terraform init with the lock file present, they get the exact same provider binaries, ensuring reproducible behavior. terraform init -upgrade updates providers to the latest allowed version and updates the lock file accordingly. Without the lock file, init always selects the latest allowed version which can cause unexpected behavior if a new provider version has breaking changes between team members runs.' },
  { q: 'How do you test a custom or development Terraform provider?', a: 'For development overrides, add a dev_overrides block in the CLI config file at the user terraformrc path. This tells Terraform to use the locally built binary instead of downloading from the registry, bypassing version and checksum checks. For integration testing, the Terraform Plugin Testing Framework provides helpers for writing acceptance tests that run against a real or mock API. For mock providers in Terraform 1.7 and later, define mock resources in test files to test module logic without deploying real infrastructure or requiring live API credentials.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Providers are plugins that Terraform downloads to interact with cloud APIs — configure them with source, version, and auth.',
    mustKnow: [
      'required_providers declares source and version constraints in the terraform block',
      '~> 5.0 means >= 5.0 and < 6.0 — the standard pessimistic constraint',
      'provider blocks configure the plugin: region, auth settings, feature flags',
      'alias enables multiple configs of the same provider (multi-region/multi-account)',
      'Commit .terraform.lock.hcl to lock exact provider versions for the team',
      'Never hardcode credentials — use env vars, IAM roles, or OIDC',
    ],
    interviewFocus: [
      'What is the .terraform.lock.hcl file and should it be committed?',
      'How do you manage multi-region deployments with providers?',
      'Difference between required_providers and the provider block',
      'How does Terraform authenticate to AWS/Azure in CI pipelines?',
    ],
  };
}
