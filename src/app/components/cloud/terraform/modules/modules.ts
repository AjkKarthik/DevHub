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
  selector: 'app-tf-modules',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './modules.html',
  styleUrl: './modules.scss',
})
export class TfModules {
  quickRef: QuickRefItem[] = [
    { name: 'module "name" {}',          type: 'syntax',  desc: 'Call a module, passing inputs and receiving outputs.' },
    { name: 'source = "./path"',         type: 'keyword', desc: 'Local path module source.' },
    { name: 'source = "namespace/name"', type: 'keyword', desc: 'Terraform Registry module source.' },
    { name: 'source = "git::https://..."',type: 'keyword',desc: 'Git URL module source.' },
    { name: 'version = "~> 3.0"',        type: 'keyword', desc: 'Version constraint for registry modules.' },
    { name: 'module.name.output_name',   type: 'syntax',  desc: 'Reference a child module output.' },
    { name: 'providers = {}',            type: 'keyword', desc: 'Pass aliased providers to a module.' },
    { name: 'terraform get',             type: 'keyword', desc: 'Download modules without full init.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What are Modules?',
      points: [
        'A module is a reusable package of Terraform configuration — a directory with .tf files.',
        'Every Terraform config is a module: the "root module" is your working directory.',
        'Child modules are called from the root (or other modules) using a module block.',
        'Modules encapsulate complexity: callers see only inputs and outputs, not internal resources.',
        'Modules enable DRY infrastructure — define a VPC module once, call it for dev, staging, and prod.',
      ],
    },
    {
      heading: 'Module Sources',
      points: [
        'Local path: source = "./modules/network" — relative path to a directory on disk.',
        'Terraform Registry: source = "terraform-aws-modules/vpc/aws" — from registry.terraform.io.',
        'Git URL: source = "git::https://github.com/org/repo.git//modules/vpc?ref=v3.0".',
        'GitHub shorthand: source = "github.com/org/repo//modules/vpc".',
        'version constraint only applies to registry modules — use ?ref= for Git sources.',
      ],
    },
    {
      heading: 'Module Structure',
      points: [
        'A module directory contains: main.tf (resources), variables.tf (inputs), outputs.tf (outputs).',
        'modules/ subdirectory is the conventional location for local modules.',
        'README.md documents the module API — inputs, outputs, and example usage.',
        'examples/ directory shows real usage of the module (also run in CI tests).',
        'Module inputs are declared as variable blocks; outputs as output blocks.',
      ],
    },
    {
      heading: 'Module Versioning',
      points: [
        'Always pin registry modules with version = "~> X.Y" to avoid unexpected upgrades.',
        'Use ?ref=v3.0 or ?ref=main for Git modules to pin to a tag or branch.',
        'Run terraform init to download new module versions after updating version constraints.',
        'Run terraform get to only download modules without reinitializing the backend.',
        'Commit .terraform.lock.hcl to lock exact versions for the team.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Calling a Module',
      language: 'bash',
      code: `# Call a local module
module "network" {
  source = "./modules/network"

  # Pass inputs (match variable names in the module)
  cidr_block   = "10.0.0.0/16"
  az_count     = 3
  environment  = var.environment
}

# Call a Terraform Registry module
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "my-vpc"
  cidr = "10.0.0.0/16"
  azs  = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  enable_nat_gateway = true
}

# Use module outputs
resource "aws_eks_cluster" "main" {
  vpc_config {
    subnet_ids = module.vpc.private_subnets
  }
}`,
    },
    {
      label: 'Module Structure',
      language: 'bash',
      code: `# modules/network/
# ├── main.tf
# ├── variables.tf
# ├── outputs.tf
# └── README.md

# variables.tf
variable "cidr_block" {
  type        = string
  description = "VPC CIDR block"
}
variable "az_count" {
  type    = number
  default = 2
}

# main.tf
resource "aws_vpc" "main" {
  cidr_block = var.cidr_block
  tags       = { Name = "vpc-\${var.environment}" }
}
resource "aws_subnet" "private" {
  count      = var.az_count
  vpc_id     = aws_vpc.main.id
  cidr_block = cidrsubnet(var.cidr_block, 8, count.index)
}

# outputs.tf
output "vpc_id"     { value = aws_vpc.main.id }
output "subnet_ids" { value = aws_subnet.private[*].id }`,
    },
    {
      label: 'Git & Provider Passing',
      language: 'bash',
      code: `# Git-sourced module with version tag
module "security_group" {
  source = "git::https://github.com/myorg/tf-modules.git//security-group?ref=v2.1.0"
  # or shorthand:
  # source = "github.com/myorg/tf-modules//security-group?ref=v2.1.0"

  name   = "app-sg"
  vpc_id = module.network.vpc_id
}

# Pass aliased provider to module
provider "aws" {
  alias  = "eu"
  region = "eu-west-1"
}

module "eu_network" {
  source = "./modules/network"
  providers = {
    aws = aws.eu   # module uses our EU-aliased provider
  }
  cidr_block = "10.1.0.0/16"
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not pinning registry module versions',
      wrong: `module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  # No version — next terraform init upgrades the module!
}`,
      right: `module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"   # >= 5.0.0, < 6.0.0
}`,
      explanation: 'Unpinned registry modules auto-upgrade on init and may introduce breaking changes. Always pin with version.',
    },
    {
      title: 'Accessing module-internal resources directly',
      wrong: `module "network" { source = "./modules/network" }
# Directly accessing internal resource — bypasses module API
resource "aws_route" "r" {
  vpc_id = module.network.aws_vpc.main.id  # WRONG
}`,
      right: `# modules/network/outputs.tf
output "vpc_id" { value = aws_vpc.main.id }
# Parent:
resource "aws_route" "r" {
  vpc_id = module.network.vpc_id  # correct: via declared output
}`,
      explanation: 'Modules encapsulate internals. Access their results only through declared output blocks — this preserves the module boundary and allows internal refactoring.',
    },
    {
      title: 'Using absolute paths in module source',
      wrong: `module "network" {
  source = "/home/alice/projects/tf-modules/network"  # absolute path
}`,
      right: `module "network" {
  source = "./modules/network"   # relative to current config directory
  # or: "../shared-modules/network" for adjacent directories
}`,
      explanation: 'Absolute paths break for other team members and CI systems. Always use relative paths for local modules.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Reusable EC2 Module',
    language: 'typescript',
    description: 'Create a module at ./modules/webserver that accepts variables for instance_type, subnet_id, and environment. It creates an EC2 instance and a security group allowing port 80/443. It outputs instance_id and security_group_id. Call the module from root for dev and prod using for_each.',
    hints: [
      'Module: variables.tf with instance_type, subnet_id, environment',
      'Module: outputs.tf with instance_id and security_group_id',
      'Root: for_each = { dev = {...}, prod = {...} } on the module block',
      'modules/webserver must reference aws provider — gets it from root by default',
    ],
    starterCode: `# modules/webserver/variables.tf
variable "instance_type" { type = string }
variable "subnet_id"     { type = string }
variable "environment"   { type = string }

# modules/webserver/main.tf
# TODO: security group (ports 80, 443) and EC2 instance

# modules/webserver/outputs.tf
# TODO: instance_id and security_group_id outputs

# root/main.tf
variable "env_config" {
  default = {
    dev  = { subnet_id = "subnet-111", instance_type = "t3.micro" }
    prod = { subnet_id = "subnet-222", instance_type = "t3.small" }
  }
}

# TODO: call module for each environment`,
    solution: `# modules/webserver/variables.tf
variable "instance_type" { type = string }
variable "subnet_id"     { type = string }
variable "environment"   { type = string }

# modules/webserver/main.tf
resource "aws_security_group" "web" {
  name   = "webserver-\${var.environment}"
  subnet_id = var.subnet_id
  ingress { from_port = 80;  to_port = 80;  protocol = "tcp"; cidr_blocks = ["0.0.0.0/0"] }
  ingress { from_port = 443; to_port = 443; protocol = "tcp"; cidr_blocks = ["0.0.0.0/0"] }
  egress  { from_port = 0;   to_port = 0;   protocol = "-1";  cidr_blocks = ["0.0.0.0/0"] }
}
resource "aws_instance" "web" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [aws_security_group.web.id]
  tags = { Name = "webserver-\${var.environment}" }
}

# modules/webserver/outputs.tf
output "instance_id"       { value = aws_instance.web.id }
output "security_group_id" { value = aws_security_group.web.id }

# root/main.tf
variable "env_config" {
  default = {
    dev  = { subnet_id = "subnet-111", instance_type = "t3.micro" }
    prod = { subnet_id = "subnet-222", instance_type = "t3.small" }
  }
}
module "webserver" {
  for_each      = var.env_config
  source        = "./modules/webserver"
  environment   = each.key
  subnet_id     = each.value.subnet_id
  instance_type = each.value.instance_type
}
output "instance_ids" { value = { for k, v in module.webserver : k => v.instance_id } }`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the "root module" in Terraform?', options: ['The main.tf file', 'The working directory you run terraform commands from', 'The first module called', 'A special built-in module'], answer: 1, explanation: 'The root module is the directory where you run terraform commands. Every Terraform configuration is a module — the working directory is the root module.' },
    { q: 'How do you version-pin a Terraform Registry module?', options: ['Using version = in the module block', 'Using ?version= in the source URL', 'Adding version in provider block', 'Using terraform.lock.hcl'], answer: 0, explanation: 'Registry modules support version = "~> X.Y" in the module block. This is the only source type that supports version pinning this way — Git uses ?ref=.' },
    { q: 'How do you reference an output named "vpc_id" from a module called "network"?', options: ['network.vpc_id', 'module.network.vpc_id', 'output.network.vpc_id', 'module.vpc_id.network'], answer: 1, explanation: 'Child module outputs are accessed as module.<module_name>.<output_name>.' },
    { q: 'What is the conventional directory name for local modules?', options: ['lib/', 'shared/', 'modules/', 'components/'], answer: 2, explanation: 'The modules/ subdirectory is the community convention for local reusable modules. Each module gets its own subdirectory with main.tf, variables.tf, and outputs.tf.' },
  { q: 'How do you pass outputs from one Terraform module to another?', options: ['Modules cannot share data; each must query the cloud API independently', 'Define output blocks in the source module and reference them as module.name.output_name in the calling module', 'Use global variables defined in a shared tfvars file', 'Export outputs to an environment variable between module calls'], answer: 1, explanation: 'Define output blocks in the child module exposing the values you want to share. In the root module, reference them as module.networking.vpc_id for example. The root module passes this to another child module as an input variable. Terraform automatically resolves dependencies between modules based on these references, ensuring modules are created in the correct order without needing explicit depends_on.' },
  { q: 'What happens when you update a module source version in Terraform?', options: ['The old module version stays running until manually deleted', 'Terraform downloads the new version on the next init and shows changes in the next plan', 'Module version changes require destroying and recreating all module resources', 'Version changes are applied immediately without requiring init or plan'], answer: 1, explanation: 'Changing the version constraint in a module source requires running terraform init -upgrade to download the new module version. Then terraform plan shows the diff between what the old and new module versions produce. Resource addresses remain the same if the module author maintained backward compatibility. If resources are renamed in the new module version, they appear as destroy and create pairs in the plan. Always review the module changelog before upgrading.' },
  ];

  qna: QnaItem[] = [
    { q: 'Can modules call other modules?', a: 'Yes. Modules can call child modules, creating a tree of module calls. However, keep nesting shallow (2-3 levels max) to maintain readability and avoid complex dependency graphs.' },
    { q: 'What is the difference between a module and a provider?', a: 'A provider is a plugin that communicates with an API. A module is a reusable configuration package made of resource and data source blocks. Modules use providers — providers are not modules.' },
    { q: 'Can I use for_each on a module block?', a: 'Yes (since Terraform 0.13). module "webserver" { for_each = var.environments ... } creates one module instance per entry. Reference with module.webserver["dev"].' },
    { q: 'How do modules help with DRY infrastructure?', a: 'You define the module once and call it multiple times with different inputs. The same VPC module can create dev, staging, and prod VPCs without duplicating code. Changes to the module propagate everywhere it is called.' },
  { q: 'How do you test Terraform modules before publishing them?', a: 'Several testing approaches work well together: terraform validate checks HCL syntax and internal consistency without calling APIs. terraform plan with realistic inputs shows what the module would create. Terratest is a Go library that deploys the module to a real cloud account, runs assertions on the deployed resources, then destroys them for integration testing. Checkov and tfsec are static analysis tools that scan modules for security misconfigurations without deploying. The Terraform native test framework in version 1.6 and later allows writing test files with mock providers for unit testing module logic without real cloud resources.' },
  { q: 'What is the moved block in Terraform and when do you use it?', a: 'The moved block (Terraform 1.1+) tells Terraform that a resource was renamed or moved to a module, preventing the destroy and recreate that would otherwise occur. Specify the old address in the from field and the new address in the to field. Without moved, renaming a resource in HCL causes Terraform to destroy the old resource and create a new one. Use moved when refactoring resource names for clarity, moving resources into or out of modules, and changing for_each keys. After all deployments have applied the moved block, remove it from the configuration to keep things clean.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Modules are reusable HCL packages — local, registry, or Git-sourced — that encapsulate resources behind an input/output API.',
    mustKnow: [
      'module block: source, version (registry only), inputs matching child variable blocks',
      'Child module outputs accessed via module.name.output_name',
      'Local: ./path, Registry: namespace/name with version, Git: git::url?ref=tag',
      'Standard structure: variables.tf, main.tf, outputs.tf',
      'Pin registry modules with version = "~> X.Y"',
      'for_each on module blocks (TF 0.13+) for multiple module instances',
    ],
    interviewFocus: [
      'How do modules encapsulate infrastructure and what problem do they solve?',
      'Difference between local, registry, and Git module sources',
      'How do you pass outputs from one module to another?',
    ],
  };
}
