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
  selector: 'app-tf-workspaces',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './workspaces.html',
  styleUrl: './workspaces.scss',
})
export class TfWorkspaces {
  quickRef: QuickRefItem[] = [
    { name: 'terraform workspace list',   type: 'keyword', desc: 'List all workspaces (default always exists).' },
    { name: 'terraform workspace new',    type: 'keyword', desc: 'Create a new workspace.' },
    { name: 'terraform workspace select', type: 'keyword', desc: 'Switch to a different workspace.' },
    { name: 'terraform workspace show',   type: 'keyword', desc: 'Print the current workspace name.' },
    { name: 'terraform workspace delete', type: 'keyword', desc: 'Delete a workspace (must be empty).' },
    { name: 'terraform.workspace',        type: 'keyword', desc: 'HCL expression returning the current workspace name.' },
    { name: 'env:/<workspace>/key',       type: 'syntax',  desc: 'S3 backend key path for non-default workspaces.' },
    { name: 'default workspace',          type: 'keyword', desc: 'The initial workspace — state at the configured key path.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What are Workspaces?',
      points: [
        'Workspaces provide multiple state files from a single Terraform configuration directory.',
        'The default workspace always exists — its state is at the configured backend key path.',
        'Additional workspaces store state at env:/<name>/<key> under S3, or separate paths in other backends.',
        'Use terraform.workspace in expressions to make configuration vary per environment.',
        'Workspaces share the same provider configuration and variable definitions.',
      ],
    },
    {
      heading: 'Workspaces vs Directory-per-Environment',
      points: [
        'Workspaces: one config directory, multiple state files — simpler setup but less isolation.',
        'Directory-per-env: separate config directories for dev/staging/prod — more isolation, more duplication.',
        'Workspaces work well for nearly-identical environments with minor sizing differences.',
        'Directory approach is better when environments need fundamentally different configurations or providers.',
        'Many teams use workspaces for transient ephemeral environments (PR environments) and directories for long-lived envs.',
      ],
    },
    {
      heading: 'Workspace Limitations',
      points: [
        'All workspaces share the same code — you cannot have structurally different configs per workspace.',
        'No built-in access control — a user who can apply to default can apply to prod.',
        'Workspace names are not validated — typos create new workspaces silently.',
        'Terraform Cloud / HCP workspaces are a different concept with per-workspace variables, VCS triggers, and RBAC.',
        'For complex multi-account setups, Terragrunt or separate directories provide better isolation.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Workspace Commands',
      language: 'bash',
      code: `# List all workspaces
terraform workspace list
# * default    <- current workspace marked with *
#   dev
#   staging
#   prod

# Create and switch to a new workspace
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod

# Switch workspace
terraform workspace select prod

# Show current workspace
terraform workspace show   # → prod

# Apply in the current workspace
terraform apply

# Delete workspace (must switch away first)
terraform workspace select default
terraform workspace delete dev`,
    },
    {
      label: 'terraform.workspace in HCL',
      language: 'bash',
      code: `# Use workspace name in expressions
locals {
  is_prod = terraform.workspace == "prod"
  env     = terraform.workspace

  # Sizing per workspace
  instance_type = lookup({
    dev     = "t3.micro"
    staging = "t3.small"
    prod    = "t3.medium"
  }, terraform.workspace, "t3.micro")
}

resource "aws_instance" "app" {
  instance_type = local.instance_type
  tags = {
    Environment = terraform.workspace
    Name        = "app-\${terraform.workspace}"
  }
}

# Workspace-scoped name prefix prevents collisions
resource "aws_s3_bucket" "data" {
  bucket = "myapp-\${terraform.workspace}-data"
}`,
    },
    {
      label: 'Variable Overrides per Workspace',
      language: 'bash',
      code: `# Use workspace-based .tfvars files
# dev.tfvars, staging.tfvars, prod.tfvars

# In CI/CD pipeline:
WORKSPACE=$(terraform workspace show)
terraform apply -var-file="\${WORKSPACE}.tfvars"

# Or use a map variable in terraform
variable "env_config" {
  type = map(object({ instance_count = number, instance_type = string }))
  default = {
    dev     = { instance_count = 1,  instance_type = "t3.micro" }
    staging = { instance_count = 2,  instance_type = "t3.small" }
    prod    = { instance_count = 5,  instance_type = "t3.medium" }
  }
}

locals {
  config = var.env_config[terraform.workspace]
}

resource "aws_instance" "app" {
  count         = local.config.instance_count
  instance_type = local.config.instance_type
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using workspaces when environments differ significantly',
      wrong: `# prod needs WAT, dev uses localstack, staging has different VPCs
# Trying to handle all in one config with workspace conditionals
instance_type = terraform.workspace == "prod" ? (
  var.region == "us-east-1" ? "m5.4xlarge" : "m5.2xlarge"
) : terraform.workspace == "staging" ? "t3.medium" : "t3.micro"`,
      right: `# Use directory-per-environment for major config differences
envs/
  dev/main.tf     # simplified, uses localstack
  staging/main.tf # standard AWS
  prod/main.tf    # multi-region, different providers`,
      explanation: 'Deep conditional logic based on workspace names becomes unmanageable. When environments are structurally different, use separate directories.',
    },
    {
      title: 'Not verifying workspace before apply',
      wrong: `# Apply without checking workspace
terraform apply
# Oops — was in "prod" workspace!`,
      right: `# Always verify workspace first
terraform workspace show
# Or add to CI: ensure WORKSPACE env var matches branch name
terraform workspace select "\${BRANCH_NAME}"
terraform apply`,
      explanation: 'Running apply in the wrong workspace can modify production when you intended to change dev. Always verify the current workspace before apply.',
    },
    {
      title: 'Confusing Terraform CLI workspaces with Terraform Cloud workspaces',
      wrong: `# CLI workspace and TF Cloud workspace are different things
# CLI: multiple state files in one backend
# TF Cloud workspace: a full environment with its own variables, VCS, runs`,
      right: `# Terraform Cloud workspaces are separate environments with:
# - Per-workspace variables (not shared)
# - Per-workspace VCS triggers
# - Per-workspace access controls
# Don't conflate with CLI workspaces`,
      explanation: 'Terraform CLI workspaces and Terraform Cloud workspaces are different concepts. Cloud workspaces are much more powerful — separate configs, variables, RBAC, and runs.',
    },
  ];

  challenge: Challenge = {
    title: 'Workspace-Aware Infrastructure',
    language: 'typescript',
    description: 'Create a Terraform configuration where instance_type and instance_count are determined by the current workspace (dev=t3.micro/1, staging=t3.small/2, prod=t3.medium/5). Name the S3 bucket with the workspace as a suffix. Add a validation that errors if terraform.workspace is not in the expected set.',
    hints: [
      'Use a map variable with workspace → config object',
      'local.config = var.env_config[terraform.workspace]',
      'S3 bucket: "myapp-\${terraform.workspace}-data"',
      'Validation via a precondition or local assertion using contains()',
    ],
    starterCode: `variable "env_config" {
  type = map(object({ instance_count = number, instance_type = string }))
  default = {
    dev     = { instance_count = 1,  instance_type = "t3.micro" }
    staging = { instance_count = 2,  instance_type = "t3.small" }
    prod    = { instance_count = 5,  instance_type = "t3.medium" }
  }
}

locals {
  # TODO: look up config for current workspace
  # TODO: validate workspace is known
}

# TODO: EC2 instances using local.config

# TODO: S3 bucket with workspace suffix`,
    solution: `variable "env_config" {
  type = map(object({ instance_count = number, instance_type = string }))
  default = {
    dev     = { instance_count = 1,  instance_type = "t3.micro" }
    staging = { instance_count = 2,  instance_type = "t3.small" }
    prod    = { instance_count = 5,  instance_type = "t3.medium" }
  }
}

locals {
  valid_workspaces = keys(var.env_config)
  workspace_valid  = contains(local.valid_workspaces, terraform.workspace)
  config           = local.workspace_valid ? var.env_config[terraform.workspace] : var.env_config["dev"]
}

resource "null_resource" "workspace_check" {
  lifecycle {
    precondition {
      condition     = local.workspace_valid
      error_message = "Workspace must be one of: \${join(", ", local.valid_workspaces)}. Got: \${terraform.workspace}"
    }
  }
}

resource "aws_instance" "app" {
  count         = local.config.instance_count
  ami           = data.aws_ami.ubuntu.id
  instance_type = local.config.instance_type
  tags = { Name = "app-\${terraform.workspace}-\${count.index}", Env = terraform.workspace }
}

resource "aws_s3_bucket" "data" {
  bucket = "myapp-\${terraform.workspace}-data"
}`,
  };

  quiz: QuizQuestion[] = [
    { q: 'Where does a non-default workspace store state in S3?', options: ['At the same key as default', 'At env:/<workspace>/<configured-key>', 'In a separate DynamoDB table', 'In a different S3 bucket'], answer: 1, explanation: 'Non-default workspace state is stored at env:/<workspace_name>/<key> under the backend. The default workspace uses the configured key path directly.' },
    { q: 'How do you reference the current workspace name in HCL?', options: ['var.workspace', 'local.workspace', 'terraform.workspace', 'env.workspace'], answer: 2, explanation: 'terraform.workspace is a built-in expression that returns the name of the current workspace as a string.' },
    { q: 'When is a directory-per-environment approach preferred over workspaces?', options: ['When using S3 backends', 'When environments have fundamentally different configurations or access controls', 'When team size exceeds 5 people', 'Always'], answer: 1, explanation: 'Workspaces work well for near-identical configs. When environments differ structurally (different providers, major config differences, RBAC requirements), directories provide better isolation.' },
    { q: 'What is the "default" workspace?', options: ['A special read-only workspace', 'The first workspace that always exists and uses the base backend key path', 'A workspace only for plan, not apply', 'A backup workspace'], answer: 1, explanation: 'The default workspace always exists and its state is stored at the configured backend key path. It cannot be deleted.' },
  { q: 'What is a Terraform workspace and when should you use one?', options: ['A workspace is a separate cloud account for each environment', 'A workspace is an isolated state file within the same backend, useful for managing multiple instances of the same configuration', 'A workspace is a module registry namespace', 'Workspaces are the same as Terraform Cloud organizations'], answer: 1, explanation: 'A workspace is an isolated state within the same backend configuration. Creating a new workspace creates a new state file. You can reference the current workspace name in expressions to vary config per workspace. Workspaces are best for ephemeral environments like feature branches or testing with the same configuration. For permanent environments like prod, staging, and dev, separate directories with separate state backends provide clearer boundaries and safer isolation.' },
  { q: 'What is the default workspace in Terraform?', options: ['There is no default workspace; you must create one before use', 'The default workspace is named default and is used when no other workspace is selected', 'The default workspace is named main and cannot be renamed', 'The workspace created first is automatically named default'], answer: 1, explanation: 'Every Terraform configuration starts with a workspace named default. This is the workspace used when you run terraform commands without explicitly creating or selecting another workspace. The default workspace cannot be deleted. When using multiple workspaces, other workspace state files are stored under environment-prefixed paths within the same backend. Use terraform workspace list to see all workspaces and terraform workspace show to see the currently selected one.' },
  ];

  qna: QnaItem[] = [
    { q: 'Can workspaces have different variables?', a: 'Not natively in CLI workspaces. You can select different .tfvars files per workspace in CI, or use a map variable with workspace name as key. Terraform Cloud workspaces support per-workspace variable sets.' },
    { q: 'How do PR/ephemeral environments work with workspaces?', a: 'CI creates a workspace per PR (terraform workspace new pr-123), applies it, runs tests, then destroys and deletes the workspace when the PR closes. This provides isolated test environments cheaply.' },
    { q: 'Can I accidentally delete the default workspace?', a: 'No — you cannot delete the default workspace. You can only delete non-default workspaces, and only after switching away from them.' },
    { q: 'What is Terragrunt and how does it compare to workspaces?', a: 'Terragrunt is a thin wrapper around Terraform that adds DRY configuration, environment-specific variable files, and dependency management. It uses the directory-per-environment pattern and is popular for large multi-account setups where workspaces fall short.' },
  { q: 'What are the limitations of Terraform workspaces for managing multiple environments?', a: 'Workspace limitations: all workspaces share the same backend configuration and provider setup, making it hard to use different credentials per environment. Workspace-conditional logic scattered throughout the config makes it hard to reason about differences between environments. Deleting a workspace does not destroy the resources tracked in its state file. Workspace state files can diverge significantly if different configs were applied in each. Many teams prefer the directory-per-environment pattern with separate backend configs for better isolation, clearer code review of environment-specific changes, and separate IAM permission boundaries per environment.' },
  { q: 'How does Terraform Cloud handle workspaces differently from the CLI?', a: 'In Terraform Cloud, workspaces are first-class objects with additional features beyond just state isolation: each workspace has its own variable set, run history, and access controls defining who can plan, apply, or administer the workspace. Workspaces can be linked to specific VCS branches so changes to that branch automatically trigger plans and await approval. Teams can be granted different permissions per workspace, enabling developers to plan production but not apply it while having full access to dev. Variable sets allow sharing common variables across multiple workspaces without duplicating configuration.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Workspaces give you multiple named state files from one config — great for ephemeral envs, limited for structurally different envs.',
    mustKnow: [
      'terraform workspace new/select/list/show/delete commands',
      'terraform.workspace expression returns the current workspace name',
      'Non-default workspace state stored at env:/<name>/<key> in backends',
      'Workspaces share code — conditionals grow complex for very different environments',
      'Directory-per-environment for better isolation; workspaces for near-identical configs',
      'Terraform Cloud workspaces ≠ CLI workspaces — Cloud has per-workspace variables, RBAC, VCS',
    ],
    interviewFocus: [
      'When would you choose workspaces over directory-per-environment?',
      'How does workspace state isolation work in S3?',
      'What are the limitations of Terraform CLI workspaces?',
    ],
  };
}
