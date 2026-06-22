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
  selector: 'app-tf-outputs',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './outputs.html',
  styleUrl: './outputs.scss',
})
export class TfOutputs {
  quickRef: QuickRefItem[] = [
    { name: 'output "name" {}',   type: 'syntax',  desc: 'Declare an output value exposed after apply.' },
    { name: 'value = ...',        type: 'keyword', desc: 'The expression whose result becomes the output.' },
    { name: 'sensitive = true',   type: 'keyword', desc: 'Mask output value in CLI output (not in state).' },
    { name: 'description = ""',   type: 'keyword', desc: 'Human-readable description of the output.' },
    { name: 'terraform output',   type: 'keyword', desc: 'Print all outputs after apply.' },
    { name: 'terraform output -json', type: 'keyword', desc: 'Print outputs as JSON for scripting.' },
    { name: 'module.name.output', type: 'syntax',  desc: 'Reference a child module output in parent.' },
    { name: 'depends_on',         type: 'keyword', desc: 'Force output to wait for a resource to be ready.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What are Outputs?',
      points: [
        'Output values expose information about resources after terraform apply — IPs, ARNs, endpoints, connection strings.',
        'They are printed at the end of apply and retrievable with terraform output.',
        'In module composition, outputs are the public API of a child module — how the parent accesses results.',
        'Remote state data sources read outputs from other Terraform configurations using terraform_remote_state.',
      ],
    },
    {
      heading: 'Output Attributes',
      points: [
        'value (required): the expression to expose — usually a resource attribute like aws_instance.web.public_ip.',
        'description: documents what the output contains — important for module consumers.',
        'sensitive = true: redacts the value from CLI output. Still stored in state file.',
        'depends_on: rarely needed for outputs but ensures ordering when the value is not computed from a resource attribute.',
        'precondition (Terraform 1.2+): custom checks that run before the output is evaluated.',
      ],
    },
    {
      heading: 'Using Outputs in Modules',
      points: [
        'A child module must declare output blocks for any values the parent needs.',
        'The parent references them with module.module_name.output_name.',
        'Chain multiple modules: module.network.vpc_id feeds into module.compute.',
        'Outputs enable loose coupling — modules communicate through declared contracts, not internal resource references.',
        'terraform output -json | jq ".vpc_id.value" extracts specific outputs in CI scripts.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Outputs',
      language: 'bash',
      code: `# outputs.tf
output "instance_public_ip" {
  description = "Public IP of the web server"
  value       = aws_instance.web.public_ip
}

output "s3_bucket_arn" {
  description = "ARN of the data bucket"
  value       = aws_s3_bucket.data.arn
}

output "db_connection_string" {
  description = "RDS connection endpoint"
  value       = "postgresql://\${aws_db_instance.main.endpoint}/mydb"
  sensitive   = true    # masked in terminal output
}

# Retrieve after apply:
# terraform output
# terraform output instance_public_ip
# terraform output -json`,
    },
    {
      label: 'Module Outputs',
      language: 'bash',
      code: `# modules/network/outputs.tf
output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

# --- root main.tf ---
module "network" {
  source      = "./modules/network"
  cidr_block  = "10.0.0.0/16"
  az_count    = 2
}

# Reference child module outputs
resource "aws_eks_cluster" "main" {
  vpc_config {
    subnet_ids = module.network.private_subnet_ids  # module output
  }
}

output "vpc_id" {
  value = module.network.vpc_id   # re-export module output
}`,
    },
    {
      label: 'Remote State Outputs',
      language: 'bash',
      code: `# In the "network" workspace — outputs.tf
output "vpc_id"          { value = aws_vpc.main.id }
output "private_subnets" { value = aws_subnet.private[*].id }

# --- In the "compute" workspace ---
# Read outputs from another state
data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket = "my-tf-state"
    key    = "network/terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_instance" "app" {
  subnet_id = data.terraform_remote_state.network.outputs.private_subnets[0]
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Exposing sensitive outputs without sensitive = true',
      wrong: `output "db_password" {
  value = var.db_password
  # Printed in plain text during apply!
}`,
      right: `output "db_password" {
  value     = var.db_password
  sensitive = true   # redacted in terminal, still in state file
}`,
      explanation: 'Sensitive values printed to terminal can be captured in CI logs. Mark them sensitive to suppress display.',
    },
    {
      title: 'Not exporting module outputs the parent needs',
      wrong: `# modules/network/main.tf
resource "aws_vpc" "main" { cidr_block = var.cidr }
# No outputs.tf — parent cannot access vpc_id!`,
      right: `# modules/network/outputs.tf
output "vpc_id" {
  description = "VPC ID for use by compute modules"
  value       = aws_vpc.main.id
}`,
      explanation: 'Child modules have no automatic public API. Every value the parent needs must be explicitly declared as an output.',
    },
    {
      title: 'Referencing module outputs before the module exists',
      wrong: `# Wrong order — module block is defined after use
resource "aws_route_table_association" "a" {
  subnet_id      = module.network.private_subnet_ids[0]  # used before declared
}
module "network" { source = "./modules/network" }`,
      right: `# Terraform handles ordering automatically via dependency graph
module "network" { source = "./modules/network" }
resource "aws_route_table_association" "a" {
  subnet_id = module.network.private_subnet_ids[0]
}
# File order doesn't matter; reference creates implicit dependency`,
      explanation: 'Terraform builds a dependency graph and orders execution automatically. File and block order within .tf files does not matter.',
    },
    {
      title: 'Using terraform output before apply',
      wrong: `# After init/plan but before apply
terraform output instance_ip
# Error: No outputs defined or resources not yet created`,
      right: `# Outputs are only available after successful apply
terraform apply
terraform output instance_ip
# Or: terraform output -json | jq '.instance_ip.value'`,
      explanation: 'Outputs are computed from resource attributes that exist only after apply. They cannot be retrieved from a plan or before resources are created.',
    },
  ];

  challenge: Challenge = {
    title: 'Design Module Output Contracts',
    language: 'typescript',
    description: 'Write a network module that creates a VPC and two subnets. Expose outputs for vpc_id, subnet_ids (list), and a connection map with both vpc_id and subnet_ids combined. In the root module, consume these outputs and pass them to a compute module.',
    hints: [
      'Use aws_vpc.main.id and aws_subnet.main[*].id for outputs',
      'object output: { vpc_id = string, subnet_ids = list(string) }',
      'Root module references child with module.network.vpc_id',
      'Pass outputs to another module via its input variables',
    ],
    starterCode: `# modules/network/outputs.tf
output "vpc_id" {
  # TODO
}
output "subnet_ids" {
  # TODO: list of subnet IDs
}
output "network_config" {
  # TODO: object combining vpc_id and subnet_ids
}

# root/main.tf
module "network" {
  source = "./modules/network"
}

module "compute" {
  source     = "./modules/compute"
  # TODO: pass vpc_id and subnet_ids from network module
}`,
    solution: `# modules/network/outputs.tf
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "subnet_ids" {
  description = "List of subnet IDs"
  value       = aws_subnet.main[*].id
}

output "network_config" {
  description = "Combined network configuration object"
  value = {
    vpc_id     = aws_vpc.main.id
    subnet_ids = aws_subnet.main[*].id
  }
}

# root/main.tf
module "network" {
  source     = "./modules/network"
  cidr_block = "10.0.0.0/16"
  az_count   = 2
}

module "compute" {
  source     = "./modules/compute"
  vpc_id     = module.network.vpc_id
  subnet_ids = module.network.subnet_ids
}

output "network_summary" {
  value = module.network.network_config
}`,
  };

  quiz: QuizQuestion[] = [
    { q: 'How do you reference an output from a child module named "network"?', options: ['network.vpc_id', 'output.network.vpc_id', 'module.network.vpc_id', 'var.network.vpc_id'], answer: 2, explanation: 'Child module outputs are accessed with module.<module_name>.<output_name>.' },
    { q: 'What does sensitive = true on an output do?', options: ['Encrypts the value in the state file', 'Redacts the value from terminal output', 'Prevents the output from being read by other modules', 'Removes it from terraform output command'], answer: 1, explanation: 'sensitive = true suppresses the value in CLI output. The value is still stored in plaintext in the state file.' },
    { q: 'When are output values computed?', options: ['During terraform plan', 'During terraform init', 'After terraform apply completes', 'Before resource creation'], answer: 2, explanation: 'Outputs are evaluated after apply — they reference resource attributes that only exist after the resource is created.' },
    { q: 'Which command reads a specific output named "vpc_id" in JSON?', options: ['terraform get vpc_id', 'terraform output -json vpc_id', 'terraform state output vpc_id', 'terraform show -json'], answer: 1, explanation: 'terraform output -json <name> prints the specific output as JSON. Without a name, all outputs are shown.' },
  ];

  qna: QnaItem[] = [
    { q: 'Can I output a computed value not directly from a resource?', a: 'Yes. output value can be any expression — merge(local.tags, {extra = "val"}), formatlist(), or any function result.' },
    { q: 'How do outputs work with terraform_remote_state?', a: 'Another workspace uses data "terraform_remote_state" to read the outputs of a different state file. The referenced workspace must have output blocks declared for the values to be accessible.' },
    { q: 'Are outputs available during plan?', a: 'Some outputs may show "known after apply" during plan if they depend on attributes not yet computed (like IDs assigned by cloud APIs). The actual values are only available after apply.' },
    { q: 'How do I suppress an output from terraform output without deleting it?', a: 'There is no built-in "hide" — you can add sensitive = true to redact the value, or precondition to conditionally fail. Removing the block is the only way to stop showing it.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Outputs expose resource attributes after apply — they are the public API of modules and the bridge between state files.',
    mustKnow: [
      'output block: value (required), description, sensitive, depends_on',
      'Reference child module outputs: module.name.output_name',
      'sensitive = true redacts from terminal but NOT from state file',
      'terraform output / terraform output -json for retrieval',
      'terraform_remote_state data source reads outputs from other states',
      'Outputs computed after apply — not available during plan for dynamic values',
    ],
    interviewFocus: [
      'How do modules communicate with each other through outputs?',
      'What is the difference between sensitive outputs and encrypted state?',
      'How would you share infrastructure outputs across multiple Terraform workspaces?',
    ],
  };
}
