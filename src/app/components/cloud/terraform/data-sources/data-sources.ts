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
  selector: 'app-tf-data-sources',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './data-sources.html',
  styleUrl: './data-sources.scss',
})
export class TfDataSources {
  quickRef: QuickRefItem[] = [
    { name: 'data "TYPE" "NAME" {}',      type: 'syntax',  desc: 'Query existing infrastructure — read-only, no create/destroy.' },
    { name: 'data.TYPE.NAME.attr',        type: 'syntax',  desc: 'Reference a data source attribute.' },
    { name: 'filter {}',                  type: 'syntax',  desc: 'AWS-style filter block to narrow query results.' },
    { name: 'most_recent = true',         type: 'keyword', desc: 'Return the most recent matching result (e.g. latest AMI).' },
    { name: 'terraform_remote_state',     type: 'keyword', desc: 'Read outputs from another Terraform state file.' },
    { name: 'external data source',       type: 'keyword', desc: 'Run an external script and read its JSON output as data.' },
    { name: 'aws_caller_identity',        type: 'keyword', desc: 'Get current AWS account ID, user ARN without hardcoding.' },
    { name: 'aws_availability_zones',     type: 'keyword', desc: 'Dynamically list available AZs in a region.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What are Data Sources?',
      points: [
        'Data sources let Terraform read information from existing infrastructure without managing it.',
        'They are read-only — Terraform never creates, updates, or destroys data source results.',
        'Use cases: look up the latest AMI ID, find an existing VPC, read an existing secret, get current account info.',
        'Data sources are evaluated during terraform plan — values are available before apply completes.',
        'Reference with data.TYPE.NAME.attribute syntax.',
      ],
    },
    {
      heading: 'Common Data Source Patterns',
      points: [
        'aws_ami with filters: look up the latest Ubuntu 22.04 AMI dynamically instead of hardcoding.',
        'aws_vpc with filters or tags: find an existing VPC by name or tag.',
        'aws_secretsmanager_secret_version: pull secret values at plan time without storing them in state.',
        'aws_caller_identity: get the current AWS account ID and region dynamically.',
        'aws_availability_zones: list available AZs in the current region for subnet distribution.',
      ],
    },
    {
      heading: 'terraform_remote_state',
      points: [
        'A special data source that reads outputs from another Terraform state file.',
        'Enables cross-stack references: the network stack exports vpc_id; the compute stack reads it.',
        'Requires the remote state file to be accessible (same S3 bucket, Terraform Cloud, etc.).',
        'The referenced workspace must have output blocks declared for the values you need.',
        'Alternative: use SSM Parameter Store or similar to pass values without tight state coupling.',
      ],
    },
    {
      heading: 'Data Sources vs Resources: A Critical Distinction',
      points: [
        'A resource block tells Terraform to CREATE and manage infrastructure — Terraform owns the lifecycle of that resource and will modify or destroy it based on configuration changes. A data source block only READS existing information — Terraform never creates, modifies, or destroys anything referenced via a data source.',
        'Data sources are essential for referencing infrastructure NOT managed by the current Terraform configuration — looking up an existing VPC created manually or by a different Terraform state, referencing the latest AMI ID published by a cloud provider, or pulling values from a separate team\'s state file.',
        'Data source values are refreshed on every terraform plan (unless explicitly configured otherwise) — meaning a data source referencing "the latest AMI" can silently produce a different result on a later run if a new AMI was published, an important consideration for reproducibility.',
        'A common design mistake is using a data source to look up a resource that IS actually managed by the same Terraform configuration — this creates unnecessary implicit ordering complexity; if you manage a resource, reference it directly via its resource attributes, not through a data source lookup.',
      ],
    },
    {
      heading: 'Filtering and Querying with Data Sources',
      points: [
        'Many cloud provider data sources support filter blocks (like aws_ami with owners and filter for finding the latest matching AMI) — letting you query for infrastructure matching specific criteria rather than needing to know an exact resource ID in advance.',
        'A data source that returns no matching results (or multiple matches when exactly one was expected) produces an error during plan — this fail-fast behavior is generally preferable to silently proceeding with an unexpected or ambiguous result, catching configuration mistakes early.',
        'Combining data sources with for_each lets you iterate over dynamically discovered infrastructure — querying for all subnets matching a tag pattern via a data source, then using for_each on that result to create a resource in each discovered subnet.',
        'Data source reads count toward provider API rate limits just like resource operations — a configuration with many data source lookups (especially inside a for_each or count loop) can meaningfully slow down plan/apply due to the volume of API calls, worth considering when designing heavily data-source-driven configurations.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'AMI & VPC Lookup',
      language: 'bash',
      code: `# Latest Ubuntu 22.04 AMI in current region
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]   # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id   # dynamic — no hardcoded AMI ID
  instance_type = "t3.micro"
}

# Existing VPC by tag
data "aws_vpc" "main" {
  tags = { Name = "production-vpc" }
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  tags = { Tier = "private" }
}`,
    },
    {
      label: 'Account & Region',
      language: 'bash',
      code: `# Current account and caller
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

# Dynamic AZ selection
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet("10.0.0.0/16", 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
}

# Secret from Secrets Manager (not stored in state)
data "aws_secretsmanager_secret_version" "db_creds" {
  secret_id = "prod/myapp/db-credentials"
}

locals {
  db_creds = jsondecode(data.aws_secretsmanager_secret_version.db_creds.secret_string)
}`,
    },
    {
      label: 'Remote State',
      language: 'bash',
      code: `# Read outputs from another Terraform workspace
data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket = "my-terraform-state"
    key    = "envs/prod/network/terraform.tfstate"
    region = "us-east-1"
  }
}

# Use the remote state outputs
resource "aws_instance" "app" {
  subnet_id              = data.terraform_remote_state.network.outputs.private_subnet_ids[0]
  vpc_security_group_ids = [data.terraform_remote_state.network.outputs.app_sg_id]
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Hardcoding AMI IDs instead of using data sources',
      wrong: `resource "aws_instance" "web" {
  ami           = "ami-0c02fb55956c7d316"  # us-east-1 only, gets stale
  instance_type = "t3.micro"
}`,
      right: `data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter { name = "name", values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"] }
  filter { name = "virtualization-type", values = ["hvm"] }
}
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id   # always latest, any region
  instance_type = "t3.micro"
}`,
      explanation: 'Hardcoded AMI IDs are region-specific and become stale. Use data sources to always get the correct, latest AMI dynamically.',
    },
    {
      title: 'Reading secrets from data sources into outputs',
      wrong: `data "aws_secretsmanager_secret_version" "creds" {
  secret_id = "prod/db"
}
output "db_password" {
  value = jsondecode(data.aws_secretsmanager_secret_version.creds.secret_string)["password"]
  # This stores the secret in state AND prints it!
}`,
      right: `data "aws_secretsmanager_secret_version" "creds" {
  secret_id = "prod/db"
}
locals {
  db_password = jsondecode(data.aws_secretsmanager_secret_version.creds.secret_string)["password"]
}
# Use local.db_password in resource blocks, never output it`,
      explanation: 'Outputting secrets prints them in apply output and state. Use locals to hold secret values and pass them directly to resource arguments.',
    },
    {
      title: 'Forgetting most_recent = true in AMI lookup',
      wrong: `data "aws_ami" "ubuntu" {
  owners  = ["099720109477"]
  filter { name = "name", values = ["ubuntu-jammy-22.04-*"] }
  # Without most_recent, returns error if multiple AMIs match
}`,
      right: `data "aws_ami" "ubuntu" {
  most_recent = true   # select newest when multiple matches exist
  owners      = ["099720109477"]
  filter { name = "name", values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"] }
}`,
      explanation: 'Without most_recent = true, Terraform errors if the filter matches multiple AMIs. most_recent selects the newest matching image.',
    },
  ];

  challenge: Challenge = {
    title: 'Dynamic Infrastructure Discovery',
    language: 'typescript',
    description: 'Write a Terraform config that dynamically discovers: the latest Amazon Linux 2023 AMI (owner 137112412989), available AZs in the current region, and the current AWS account ID. Create one subnet per AZ using cidrsubnet(), and output the account ID and subnet IDs.',
    hints: [
      'AMI filter name: "al2023-ami-2023*-x86_64"',
      'data.aws_availability_zones.available.names gives the list',
      'cidrsubnet("10.0.0.0/16", 8, count.index) carves /24 subnets',
      'data.aws_caller_identity.current.account_id for account ID',
    ],
    starterCode: `# TODO: data source for latest AL2023 AMI
# TODO: data source for available AZs
# TODO: data source for caller identity

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

# TODO: subnets using count = number of AZs and cidrsubnet()

# TODO: output account_id and subnet_ids`,
    solution: `data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["137112412989"]
  filter { name = "name", values = ["al2023-ami-2023*-x86_64"] }
  filter { name = "virtualization-type", values = ["hvm"] }
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  count             = length(data.aws_availability_zones.available.names)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet("10.0.0.0/16", 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
}

output "account_id" { value = data.aws_caller_identity.current.account_id }
output "subnet_ids" { value = aws_subnet.public[*].id }`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the key difference between a resource and a data source?', options: ['Data sources are faster', 'Data sources are read-only — they query existing infrastructure but never manage it', 'Resources cannot be referenced in expressions', 'Data sources require authentication'], answer: 1, explanation: 'Data sources are read-only lookups. Terraform never creates, updates, or destroys data source results — it only reads information from existing infrastructure.' },
    { q: 'How do you reference the result of a data source?', options: ['resource.TYPE.NAME.attr', 'data.TYPE.NAME.attr', 'lookup.TYPE.NAME.attr', 'source.TYPE.NAME.attr'], answer: 1, explanation: 'Data source results are referenced with data.TYPE.NAME.attribute — the data prefix distinguishes them from resource references.' },
    { q: 'What does terraform_remote_state allow?', options: ['Encrypting the state file', 'Running Terraform in remote CI', 'Reading outputs from another Terraform state file', 'Merging two state files'], answer: 2, explanation: 'terraform_remote_state is a data source that reads output values from another Terraform state file, enabling cross-stack data sharing.' },
    { q: 'When is a data source evaluated?', options: ['Only after apply', 'During terraform init', 'During terraform plan', 'Only during terraform destroy'], answer: 2, explanation: 'Data sources are evaluated during terraform plan — Terraform queries the real API to get current values so the plan reflects real infrastructure state.' },
  { q: 'What is the difference between a Terraform data source and a resource?', options: ['Data sources create infrastructure; resources only read it', 'Resources create and manage infrastructure; data sources read existing infrastructure without managing it', 'Data sources are deprecated in favor of resource imports', 'Resources are immutable; data sources can be updated'], answer: 1, explanation: 'A resource block creates and manages infrastructure and Terraform owns its lifecycle. A data source block reads existing infrastructure that Terraform does not manage, or reads outputs from other state files. Data sources let you reference VPCs, AMIs, or secrets created outside your current config. They are evaluated during the plan phase and their values are available as data.type.name.attribute.' },
  { q: 'When are data source values resolved in Terraform?', options: ['During the init phase when providers are downloaded', 'During the plan phase by calling the provider API', 'Only during the apply phase when changes are made', 'At the time the config file is written'], answer: 1, explanation: 'Data source values are resolved during the plan phase by calling the provider API. If a data source depends on a resource that does not yet exist, Terraform defers its evaluation to apply time. This can cause plan to show unknown values for downstream resources that depend on the data source. Use depends_on on the data source to make the dependency explicit when needed to ensure correct ordering.' },
  ];

  qna: QnaItem[] = [
    { q: 'Can data sources cause plan failures?', a: 'Yes. If a data source filter matches no results (or more than one when one is expected), Terraform fails during plan. This is a feature — it surfaces config issues early before any resources are created.' },
    { q: 'Is it safe to pull secrets from Secrets Manager via data sources?', a: 'The secret value will appear in the Terraform state file (in plaintext). Ensure your state backend uses encryption at rest and access controls. Avoid outputting secret values.' },
    { q: 'What is the external data source?', a: 'data "external" {} runs a script or program and reads its stdout as JSON. Used for lookups Terraform does not natively support. The script must be idempotent and return a JSON object.' },
    { q: 'How are data sources different from locals?', a: 'Locals are computed from existing HCL values at plan time without API calls. Data sources query real APIs (cloud provider, external scripts) to fetch live information from outside the Terraform config.' },
  { q: 'How do you use a data source to find the latest AWS AMI?', a: 'Use the aws_ami data source with most_recent set to true and filter blocks specifying the AMI name pattern and owner account. Then reference it by its id attribute in your EC2 resource. The most_recent flag returns the newest matching AMI. This pattern ensures your infrastructure always uses the latest patched AMI without hardcoding AMI IDs that vary per region. Add the owner ID or owner alias like amazon to avoid picking up public community AMIs.' },
  { q: 'How do you share outputs between different Terraform state files using data sources?', a: 'Use the terraform_remote_state data source to read outputs from another configuration state file. Specify the backend type and its config block pointing to the state location. Reference outputs as data.terraform_remote_state.name.outputs.vpc_id. This creates loose coupling between configurations. An alternative is using a shared data store like AWS SSM Parameter Store or Consul to pass values between configurations, which avoids tight state coupling and works across tools beyond Terraform.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Data sources are read-only lookups — they query existing infrastructure so you can reference it without managing it.',
    mustKnow: [
      'data "TYPE" "NAME" {} — read-only, no create/update/destroy',
      'Reference with data.TYPE.NAME.attribute',
      'Common: aws_ami (latest image), aws_vpc (existing network), aws_caller_identity (account)',
      'most_recent = true required when filters may match multiple results',
      'terraform_remote_state reads outputs from another Terraform state file',
      'Secret data sources: value in state is plaintext — use encrypted remote backends',
    ],
    interviewFocus: [
      'Difference between a resource and a data source?',
      'How do you share data between two independent Terraform workspaces?',
      'Why is hardcoding AMI IDs an anti-pattern?',
    ],
  };
}
