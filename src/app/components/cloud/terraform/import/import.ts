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
  selector: 'app-tf-import',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './import.html',
  styleUrl: './import.scss',
})
export class TfImport {
  quickRef: QuickRefItem[] = [
    { name: 'terraform import',              type: 'keyword', desc: 'Legacy CLI command: import resource.name <id>.' },
    { name: 'import {} block',               type: 'syntax',  desc: 'Declarative import (TF 1.5+) in HCL.' },
    { name: '-generate-config-out=file.tf',  type: 'keyword', desc: 'Generate HCL config from imported resource (TF 1.5+).' },
    { name: 'terraform plan -generate-config-out', type: 'keyword', desc: 'Run plan and write generated config to file.' },
    { name: 'terraform state show',          type: 'keyword', desc: 'Inspect attributes after import to write correct HCL.' },
    { name: 'id_prefix:resource_id',         type: 'syntax',  desc: 'Some resources have composite IDs for import.' },
    { name: 'terraform state rm',            type: 'keyword', desc: 'Untrack a resource before re-importing to a new address.' },
    { name: 'tagging convention',            type: 'keyword', desc: 'Tag resources with ManagedBy=Terraform before import.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Import?',
      points: [
        'Import brings existing cloud resources under Terraform management without destroying and recreating them.',
        'Use cases: legacy infra created manually, resources created by another tool, or migrating from another IaC tool.',
        'Import only adds the resource to state — it does not write HCL configuration automatically (until TF 1.5).',
        'After import, running terraform plan should show no changes (zero drift) once HCL matches state.',
        'Resources that cannot be imported must be recreated — most AWS/Azure/GCP resources support import.',
      ],
    },
    {
      heading: 'Legacy CLI Import vs Import Block (TF 1.5+)',
      points: [
        'Legacy: terraform import resource.name <id> — imperative, must be run manually by each person.',
        'Import block (TF 1.5+): declarative import {} in HCL — version-controlled, reviewable, reproducible.',
        'Import block with -generate-config-out: Terraform reads the real resource and generates the HCL config.',
        'Import block workflow: add import {}, run plan -generate-config-out, review generated HCL, apply.',
        'After successful import, remove the import block (it is automatically consumed on apply).',
      ],
    },
    {
      heading: 'Import Workflow',
      points: [
        '1. Identify the resource ID (AWS Console, CLI, existing tags).',
        '2. Write a stub resource block in HCL (or use -generate-config-out).',
        '3. Run terraform import or add an import {} block.',
        '4. Run terraform state show to see all imported attributes.',
        '5. Update your HCL to match state — aim for zero drift in terraform plan.',
        '6. Address any ignore_changes or lifecycle differences needed for drift suppression.',
      ],
    },
    {
      heading: 'Generated Config (TF 1.5+)',
      points: [
        '-generate-config-out=generated.tf reads the real resource via the provider API and writes valid HCL.',
        'The generated config is a starting point — it often includes read-only attributes that must be removed.',
        'Generated configs set every attribute explicitly — simplify by removing defaults and computed values.',
        'Always review generated config carefully before committing — it may expose secrets or provider-specific quirks.',
        'Iterative: import → generate → review → plan → fix drift → plan shows no changes → done.',
      ],
    },
    {
      heading: 'Importing Existing Infrastructure Safely',
      points: [
        'terraform import (or the declarative import block introduced in Terraform 1.5+) brings an existing, manually-created resource under Terraform management by associating it with a resource address in state — without this step, Terraform has no knowledge of resources that already exist outside its management.',
        'Importing only adds the resource to state — it does NOT generate the corresponding HCL configuration automatically (for the older CLI-based import); you must write matching configuration yourself, and a mismatch between the imported state and your configuration will show as a diff on the next plan.',
        'The newer declarative import block (paired with terraform plan -generate-config-out) can generate a starting HCL configuration automatically from the imported resource\'s actual attributes — significantly reducing the manual effort of writing configuration to match an already-existing resource precisely.',
        'Importing resources in bulk (many existing resources at once) benefits from careful planning — importing incrementally and verifying each terraform plan shows no unexpected changes after each import avoids accidentally importing a resource with configuration that would immediately trigger a destructive change on the next apply.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Legacy CLI Import',
      language: 'bash',
      code: `# Step 1: Write a stub resource in HCL
# main.tf
resource "aws_s3_bucket" "existing" {
  # Attributes will be filled after import
}

# Step 2: Find the resource ID (bucket name for S3)
aws s3 ls   # find bucket name

# Step 3: Import
terraform import aws_s3_bucket.existing my-existing-bucket-name

# Step 4: Check what was imported
terraform state show aws_s3_bucket.existing

# Step 5: Update HCL to match state
resource "aws_s3_bucket" "existing" {
  bucket = "my-existing-bucket-name"
  tags   = { Environment = "prod" }
}

# Step 6: Plan should show no changes
terraform plan   # → No changes. Infrastructure is up-to-date.`,
    },
    {
      label: 'Import Block (TF 1.5+)',
      language: 'bash',
      code: `# main.tf — add import block
import {
  to = aws_s3_bucket.existing
  id = "my-existing-bucket-name"
}

# Optional: generate the HCL config automatically
# Run: terraform plan -generate-config-out=generated.tf
# Terraform reads the real bucket and writes the config to generated.tf

# After reviewing generated.tf, move its content to main.tf
# Then run: terraform apply
# The import block is consumed — remove it after apply

# Multiple imports at once
import {
  to = aws_instance.legacy_web
  id = "i-0abc123def456789"
}
import {
  to = aws_security_group.legacy_sg
  id = "sg-0abc123def456789"
}`,
    },
    {
      label: 'Common Import IDs',
      language: 'bash',
      code: `# AWS resource import ID formats
terraform import aws_s3_bucket.b          "bucket-name"
terraform import aws_instance.i           "i-1234567890abcdef0"
terraform import aws_vpc.v                "vpc-12345678"
terraform import aws_subnet.s             "subnet-12345678"
terraform import aws_security_group.sg    "sg-12345678"
terraform import aws_iam_role.r           "role-name"
terraform import aws_iam_policy.p         "arn:aws:iam::123456789012:policy/MyPolicy"
terraform import aws_rds_cluster.db       "cluster-identifier"

# Composite IDs (multiple parts)
terraform import aws_iam_role_policy.rp   "role-name:policy-name"
terraform import aws_route_table_association.a "subnet-id/route-table-id"

# Azure
terraform import azurerm_resource_group.rg "/subscriptions/{sub-id}/resourceGroups/{name}"`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Running plan before HCL matches state after import',
      wrong: `# After import, HCL is a stub:
resource "aws_instance" "web" { ami = "ami-old" }
# terraform plan shows HUGE diff — Terraform wants to change everything!`,
      right: `# After import, use terraform state show to see all attributes:
terraform state show aws_instance.web
# Then update HCL to match:
resource "aws_instance" "web" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"
  # ... all other attributes from state show
}
# Plan should show no changes`,
      explanation: 'After import, run terraform state show to see the real resource attributes. Update HCL to match until terraform plan shows no changes.',
    },
    {
      title: 'Not removing computed attributes from generated config',
      wrong: `# Generated config includes read-only computed attributes:
resource "aws_instance" "web" {
  id                    = "i-1234567890"   # computed — remove!
  public_ip             = "54.1.2.3"       # computed — remove!
  private_dns           = "ip-10-0-1-5..."  # computed — remove!
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"
}`,
      right: `resource "aws_instance" "web" {
  # Only include arguments you control — remove all computed/read-only attrs
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"
  subnet_id     = "subnet-12345"
  tags          = { Name = "web" }
}`,
      explanation: 'Generated config includes computed attributes (id, public_ip, etc.) that Terraform manages internally. Including them in HCL causes plan errors. Remove all computed attrs.',
    },
    {
      title: 'Forgetting to import dependent resources',
      wrong: `# Importing just the EC2 instance, forgetting the security group
terraform import aws_instance.web "i-1234567890"
# Plan now wants to replace the security group assignment!`,
      right: `# Import all related resources that exist in the cloud
terraform import aws_security_group.web "sg-12345678"
terraform import aws_instance.web       "i-1234567890"
# Import all resources that reference each other`,
      explanation: 'When importing existing infra, import all related resources. If one is in state and the other is not, Terraform may try to create or destroy the missing piece.',
    },
  ];

  challenge: Challenge = {
    title: 'Import an Existing S3 Bucket',
    language: 'typescript',
    description: 'Write the import block syntax (TF 1.5+) to import an existing S3 bucket named "prod-data-lake-2024" to resource "aws_s3_bucket" "data_lake". Then write the complete HCL resource block that would produce no drift — including bucket name, tags (Environment=prod, ManagedBy=Terraform), and versioning enabled via aws_s3_bucket_versioning.',
    hints: [
      'import { to = aws_s3_bucket.data_lake; id = "prod-data-lake-2024" }',
      'Also need to import aws_s3_bucket_versioning separately',
      'Versioning resource id = "bucket-name" for import',
      'Run terraform state show after import to confirm attributes',
    ],
    starterCode: `# Add import blocks
import {
  # TODO: import the S3 bucket
}

import {
  # TODO: import versioning (id = bucket name)
}

# Write HCL that matches the real resource
resource "aws_s3_bucket" "data_lake" {
  # TODO
}

resource "aws_s3_bucket_versioning" "data_lake" {
  # TODO
}`,
    solution: `import {
  to = aws_s3_bucket.data_lake
  id = "prod-data-lake-2024"
}

import {
  to = aws_s3_bucket_versioning.data_lake
  id = "prod-data-lake-2024"
}

resource "aws_s3_bucket" "data_lake" {
  bucket = "prod-data-lake-2024"
  tags = {
    Environment = "prod"
    ManagedBy   = "Terraform"
  }
  lifecycle { prevent_destroy = true }
}

resource "aws_s3_bucket_versioning" "data_lake" {
  bucket = aws_s3_bucket.data_lake.id
  versioning_configuration {
    status = "Enabled"
  }
}`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What does terraform import do to HCL configuration?', options: ['Writes HCL config automatically', 'Does nothing to HCL — only adds the resource to state', 'Deletes the existing resource', 'Validates HCL against the real resource'], answer: 1, explanation: 'Legacy terraform import only updates state — it does not write HCL. You must manually write or generate the HCL configuration to match the imported resource.' },
    { q: 'What is the -generate-config-out flag for?', options: ['Exporting state to a file', 'Generating HCL configuration from an imported resource automatically', 'Generating provider docs', 'Producing a plan JSON file'], answer: 1, explanation: '-generate-config-out=file.tf (TF 1.5+) causes Terraform to read the real resource via the provider and write a valid HCL resource block to the specified file.' },
    { q: 'After import, what should terraform plan show if HCL is correct?', options: ['A large diff with all attributes', '"Plan: 1 to add"', '"No changes. Infrastructure is up-to-date."', 'A destroy-and-recreate plan'], answer: 2, explanation: 'When HCL exactly matches the imported resource\'s actual state, terraform plan shows no changes — the desired state equals the current state.' },
    { q: 'What is the advantage of import {} blocks over terraform import CLI?', options: ['Blocks are faster', 'Blocks are declarative, version-controlled, and reviewable in PRs', 'Blocks skip state locking', 'Blocks work without providers'], answer: 1, explanation: 'Import blocks live in HCL files that are committed to git. They are reviewable in PRs, reproducible, and automatically consumed on apply — unlike the imperative CLI command.' },
  { q: 'What is the purpose of terraform import?', options: ['It downloads a Terraform configuration from a remote registry', 'It brings existing infrastructure under Terraform management by linking it to a resource in state', 'It imports variables from a tfvars file', 'It copies a module from one configuration to another'], answer: 1, explanation: 'terraform import resource.address id associates an existing cloud resource with a resource block in your configuration without creating or modifying the real resource. After import, the resource appears in state and Terraform manages its lifecycle. You must still write the resource block manually to match the imported resource configuration. In Terraform 1.5+, the import block in HCL allows declaring imports as code and generating config automatically.' },
  { q: 'What does the import block in Terraform 1.5+ enable compared to the older import command?', options: ['It is identical to the import command but with a different syntax', 'It allows declaring imports as code reviewable in PRs, and enables automatic config generation', 'It imports multiple resources in parallel using concurrency', 'It validates that the imported resource matches the existing configuration'], answer: 1, explanation: 'The import block is a declarative way to bring resources into Terraform management: specify the target resource address and the real resource ID. Benefits: import declarations can be code-reviewed in PRs before applying, they are repeatable and self-documenting. Running terraform plan with the -generate-config-out flag auto-generates the resource block from actual cloud resource attributes. This makes bulk imports of existing infrastructure much easier than the CLI command.' },
  ];

  qna: QnaItem[] = [
    { q: 'Can all resources be imported?', a: 'Most can, but some cannot — particularly resources with secrets that are write-only (the provider does not expose them on read). Check each resource\'s Terraform Registry documentation for "Import" section.' },
    { q: 'What is the import ID for complex resources?', a: 'Some resources use composite IDs: IAM role policies use "role-name:policy-name", route table associations use "subnet-id/route-table-id". The provider docs always document the exact import ID format.' },
    { q: 'How do I import many resources at once?', a: 'TF 1.5+ import blocks support multiple blocks in one file. For very large migrations (hundreds of resources), tools like terraformer or aztfy generate both HCL and state from existing cloud accounts automatically.' },
    { q: 'What should I do after generating config with -generate-config-out?', a: 'Review the generated file carefully: remove computed attributes (id, arn, private_ip), simplify to only arguments you control, remove redundant defaults, check for sensitive values. Then move the clean config to your main.tf.' },
  { q: 'What is the process for importing a large number of existing resources into Terraform?', a: 'For bulk imports in Terraform 1.5+: write import blocks for all resources or generate them from a script using the cloud provider API, then run terraform plan with the -generate-config-out flag to auto-generate resource blocks. Review and clean up the generated config, removing read-only attributes that Terraform should not manage. Run terraform plan again to verify the import will produce no changes to existing resources. Then run terraform apply to execute the imports and update state. For older Terraform versions, use the import CLI command in a shell loop while manually writing resource blocks.' },
  { q: 'How do you handle a resource that shows differences after import?', a: 'After import, running terraform plan often shows differences between the imported state and your configuration because the auto-generated or manually written config may not perfectly match all resource attributes. Examine each planned change and decide whether to accept it by running apply to update the real resource to match config, or to update the config to match the actual resource by copying the attribute value shown in state. Use terraform state show to see all attributes that were imported. Avoid running apply immediately after import until you understand each planned change and its impact.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Import brings existing resources under Terraform management — declarative import blocks (TF 1.5+) with -generate-config-out replace the manual CLI workflow.',
    mustKnow: [
      'import {} block (TF 1.5+): to = resource.name, id = "resource-id"',
      '-generate-config-out=file.tf writes HCL from the real resource',
      'After import: remove computed attrs from generated HCL, run plan until no changes',
      'Legacy: terraform import resource.name id — imperative, no HCL written',
      'Import only adds to state — does NOT modify real infrastructure',
      'Import all related resources together to avoid drift on dependencies',
    ],
    interviewFocus: [
      'How would you migrate 50 manually created resources into Terraform?',
      'Difference between import blocks and terraform import CLI',
      'What do you do after import to ensure no drift?',
    ],
  };
}
