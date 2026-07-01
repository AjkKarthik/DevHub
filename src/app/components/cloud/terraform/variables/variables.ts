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
  selector: 'app-tf-variables',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './variables.html',
  styleUrl: './variables.scss',
})
export class TfVariables {
  quickRef: QuickRefItem[] = [
    { name: 'variable "name" {}',    type: 'syntax',  desc: 'Declare an input variable with type, default, description.' },
    { name: 'var.name',              type: 'syntax',  desc: 'Reference a variable value inside HCL expressions.' },
    { name: 'locals {}',             type: 'syntax',  desc: 'Declare local computed values (not externally settable).' },
    { name: 'local.name',            type: 'syntax',  desc: 'Reference a local value.' },
    { name: 'type = string',         type: 'keyword', desc: 'Type constraint: string, number, bool, list, map, set, object, tuple.' },
    { name: 'sensitive = true',      type: 'keyword', desc: 'Suppress value in plan/apply output (still in state file).' },
    { name: 'validation {}',         type: 'syntax',  desc: 'Custom validation rule with condition and error_message.' },
    { name: 'terraform.tfvars',      type: 'keyword', desc: 'Auto-loaded variable values file (or *.auto.tfvars).' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Input Variables',
      points: [
        'Variables parameterise Terraform configurations — they are the inputs to your infrastructure modules.',
        'Declare with variable "name" {} block. Attributes: type, default, description, sensitive, nullable, validation.',
        'If no default is provided, Terraform prompts the user or requires the value via CLI/env/tfvars.',
        'Reference with var.name in any expression.',
        'Variables allow the same Terraform config to be reused across dev, staging, and prod environments.',
      ],
    },
    {
      heading: 'Type Constraints',
      points: [
        'Primitive types: string, number, bool.',
        'Collection types: list(string), map(string), set(string) — homogeneous collections.',
        'Structural types: object({ name = string, count = number }), tuple([string, number]) — heterogeneous.',
        'any disables type checking — avoid except for truly dynamic data.',
        'Type constraints are enforced at plan time — mismatches fail early with clear errors.',
      ],
    },
    {
      heading: 'Variable Precedence (highest to lowest)',
      points: [
        '1. -var and -var-file CLI flags (highest priority).',
        '2. *.auto.tfvars and *.auto.tfvars.json files (loaded alphabetically).',
        '3. terraform.tfvars and terraform.tfvars.json.',
        '4. TF_VAR_name environment variables.',
        '5. default value in the variable block (lowest priority).',
      ],
    },
    {
      heading: 'Locals',
      points: [
        'locals {} block defines computed values that are reusable within the module but not exposed as inputs.',
        'Ideal for expressions you need in multiple places — DRY principle.',
        'locals can reference variables, other locals, resource attributes, and built-in functions.',
        'Unlike variables, locals cannot be overridden from outside — they are internal to the module.',
        'Reference with local.name (note: local not locals).',
      ],
    },
    {
      heading: 'Variable Validation and Type Constraints',
      points: [
        'Type constraints on variables (type = string, type = number, or complex types like type = list(object({...}))) catch type mismatches at plan time with a clear error, rather than letting an incorrectly-typed value propagate deep into resource configuration and produce a confusing provider-level error.',
        'Custom validation blocks (validation { condition = ... error_message = "..." }) enforce business rules beyond basic type checking — validating that an instance size variable is one of an allowed set of values, or that a CIDR block variable is actually a valid CIDR notation string.',
        'Default values should be used thoughtfully — a variable with a sensible default (like a common instance size) reduces required input for most callers, while a variable with genuinely no safe default (like an environment name) should have no default, forcing every caller to explicitly provide it.',
        'Variable descriptions serve as inline documentation, displayed by terraform plan and used by documentation-generation tools (terraform-docs) — writing clear descriptions for every variable significantly improves a module\'s usability for anyone other than the original author.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Variables',
      language: 'bash',
      code: `# Simple string variable
variable "environment" {
  type        = string
  description = "Deployment environment (dev, staging, prod)"
  default     = "dev"
}

# Number with validation
variable "instance_count" {
  type        = number
  description = "Number of EC2 instances"
  default     = 1
  validation {
    condition     = var.instance_count >= 1 && var.instance_count <= 10
    error_message = "instance_count must be between 1 and 10."
  }
}

# Sensitive variable (masked in output)
variable "db_password" {
  type      = string
  sensitive = true
}

# Object type
variable "vpc_config" {
  type = object({
    cidr_block = string
    az_count   = number
  })
  default = {
    cidr_block = "10.0.0.0/16"
    az_count   = 2
  }
}`,
    },
    {
      label: 'Locals',
      language: 'bash',
      code: `locals {
  # Computed from variables
  env_prefix  = "\${var.project}-\${var.environment}"
  is_prod     = var.environment == "prod"

  # Reusable tag map
  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "Terraform"
  }

  # Conditional sizing
  instance_type = local.is_prod ? "t3.medium" : "t3.micro"
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = local.instance_type          # use local
  tags          = merge(local.common_tags, {
    Name = "\${local.env_prefix}-web"
  })
}`,
    },
    {
      label: 'tfvars',
      language: 'bash',
      code: `# terraform.tfvars — auto-loaded
project     = "myapp"
environment = "dev"
instance_count = 2

# prod.tfvars — loaded with -var-file
project        = "myapp"
environment    = "prod"
instance_count = 5

# Use:  terraform apply -var-file=prod.tfvars

# Environment variable override
# TF_VAR_environment=prod terraform apply

# CLI override (highest priority)
# terraform apply -var="environment=staging"`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using any type instead of explicit types',
      wrong: `variable "config" {
  type = any   # no type safety
}`,
      right: `variable "config" {
  type = object({
    region     = string
    az_count   = number
    enable_vpn = bool
  })
}`,
      explanation: 'any disables type checking and produces confusing errors downstream. Always declare explicit types to catch mistakes at plan time.',
    },
    {
      title: 'Committing sensitive tfvars to git',
      wrong: `# terraform.tfvars committed to git
db_password = "super-secret-123"
api_key     = "sk_live_abcdef"`,
      right: `# .gitignore
*.tfvars
# Set secrets via env vars: TF_VAR_db_password=...
# Or use Vault / AWS SSM data sources`,
      explanation: 'Never commit files containing secrets. Use env vars, a secret store, or gitignored files for sensitive values.',
    },
    {
      title: 'Referencing locals with "locals" not "local"',
      wrong: `resource "aws_instance" "web" {
  tags = locals.common_tags   # TS error: locals is the block name
}`,
      right: `resource "aws_instance" "web" {
  tags = local.common_tags    # "local" (singular) for references
}`,
      explanation: 'The block keyword is locals {} but references use local.name (singular). This is a common typo that Terraform catches at validate time.',
    },
    {
      title: 'No validation on critical variables',
      wrong: `variable "environment" {
  type = string
  # No validation — "prodduction" typo accepted
}`,
      right: `variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}`,
      explanation: 'Validation blocks catch invalid values early at plan time with friendly messages, before any API calls are made.',
    },
  ];

  challenge: Challenge = {
    title: 'Parameterise a VPC Config',
    language: 'typescript',
    description: 'Write variables for a VPC configuration: an environment string (with validation for dev/staging/prod), a VPC CIDR object variable, and a list(string) of availability zones. Use locals to compute a name prefix and whether high-availability mode is enabled (az count > 1).',
    hints: [
      'Use validation {} with contains() to restrict environment values',
      'Use object({ cidr = string }) for vpc_config',
      'Use local.ha_mode = length(var.availability_zones) > 1',
      'Compute local.name_prefix from project and environment variables',
    ],
    starterCode: `variable "project" {
  type    = string
  default = "myapp"
}

variable "environment" {
  type = string
  # TODO: validation for dev/staging/prod
}

variable "vpc_config" {
  # TODO: object type with cidr_block string
}

variable "availability_zones" {
  # TODO: list(string) with default
}

locals {
  # TODO: name_prefix and ha_mode
}`,
    solution: `variable "project" {
  type    = string
  default = "myapp"
}

variable "environment" {
  type        = string
  description = "Deployment environment"
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Must be dev, staging, or prod."
  }
}

variable "vpc_config" {
  type = object({
    cidr_block = string
  })
  default = { cidr_block = "10.0.0.0/16" }
}

variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b"]
}

locals {
  name_prefix = "\${var.project}-\${var.environment}"
  ha_mode     = length(var.availability_zones) > 1
}`,
  };

  quiz: QuizQuestion[] = [
    { q: 'Which variable source has the highest precedence?', options: ['terraform.tfvars', 'TF_VAR_ environment variables', 'default in variable block', '-var CLI flag'], answer: 3, explanation: '-var and -var-file CLI flags have the highest precedence, overriding all other sources including tfvars files and environment variables.' },
    { q: 'How do you reference a local value named "prefix"?', options: ['locals.prefix', 'var.prefix', 'local.prefix', 'self.prefix'], answer: 2, explanation: 'Local values are declared in a locals {} block (plural) but referenced with local.name (singular).' },
    { q: 'What does sensitive = true do to a variable?', options: ['Encrypts it in the state file', 'Prevents it from being set via CLI', 'Suppresses its value in plan/apply terminal output', 'Deletes it after apply'], answer: 2, explanation: 'sensitive = true redacts the value in plan and apply output. The value is still stored plaintext in the state file — use a remote backend with encryption at rest.' },
    { q: 'Which type constraint ensures a variable is a map of strings?', options: ['map', 'object({})', 'map(string)', 'dict(string)'], answer: 2, explanation: 'map(string) is a homogeneous map with string values. map alone without a type argument is valid in older Terraform but map(string) is the explicit form.' },
  { q: 'What are the different ways to provide values for Terraform input variables?', options: ['Only through tfvars files committed to the repository', 'Through tfvars files, TF_VAR_ environment variables, -var flags, or interactive prompts in a specific precedence order', 'Only through environment variables for security reasons', 'Through the lock file for reproducibility'], answer: 1, explanation: 'Variable values are resolved in this precedence order with highest winning: -var flags and -var-file flags on the command line, then auto.tfvars files alphabetically, then terraform.tfvars, then TF_VAR_name environment variables, then the default in the variable block. Use terraform.tfvars for non-secret defaults, TF_VAR_ in CI for environment-specific values, and -var for one-off overrides. Never commit sensitive values; use environment variables or secrets manager injection in CI.' },
  { q: 'What is the difference between nullable = false and having a default value in a Terraform variable?', options: ['They are equivalent and both prevent null values', 'nullable = false prevents null even when callers explicitly pass null by substituting the default; a plain default is bypassed when callers pass null', 'nullable = false is the new syntax; default is deprecated', 'Defaults only work for string types; nullable works for all types'], answer: 1, explanation: 'A variable with a default is optional and callers can omit it to get the default. But if a caller explicitly passes null, the variable is null even with a default. nullable = false prevents the variable from ever being null: if a caller passes null, Terraform substitutes the default value instead. Use nullable = false when your module logic cannot handle a null value and you want the default to always serve as the guaranteed fallback.' },
  ];

  qna: QnaItem[] = [
    { q: 'When should I use locals vs variables?', a: 'Use variables for values that callers provide (inputs). Use locals for intermediate computed values that are derived from other data and used in multiple places — think of locals as private constants or computed properties.' },
    { q: 'Can a local reference another local?', a: 'Yes. locals can reference other locals as long as there are no circular dependencies. Terraform resolves them in dependency order automatically.' },
    { q: 'How do I pass a list variable from the command line?', a: 'Use JSON syntax: terraform apply -var="zones=[\\"us-east-1a\\",\\"us-east-1b\\"]". For complex types it is easier to use a .tfvars file.' },
    { q: 'What is the difference between nullable = false and having a default?', a: 'nullable = false means callers cannot pass null for the variable even explicitly. Having no default means the variable is required. You can combine them: required AND non-nullable.' },
  { q: 'How do you validate input variable values in Terraform?', a: 'Use validation blocks inside the variable block: specify a condition expression that must evaluate to true for valid input and an error_message displayed when validation fails. The condition can use any Terraform expression referencing the variable value. Use contains() to restrict to an allowed list of values, regex() for pattern matching such as requiring a name to match a convention, can() to test if an expression would succeed, and comparison operators for numeric bounds. Multiple validation blocks are allowed per variable. Validations run before planning and provide early feedback without requiring a full plan.' },
  { q: 'What is the optional() function in Terraform object type constraints?', a: 'The optional() function in type constraints in Terraform 1.3 and later marks attributes in object variables as optional with an optional default value. Declare an object variable type with some attributes wrapped in optional() specifying the default value if the caller omits that attribute. Callers can omit optional attributes and they receive the specified defaults. Without optional(), all object attributes are required and omitting any causes a type error. This allows evolving module interfaces without breaking existing callers when you add new configuration attributes with sensible defaults.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Variables are configuration inputs; locals are private computed values — both make HCL reusable and DRY.',
    mustKnow: [
      'variable blocks: type, default, description, sensitive, nullable, validation',
      'locals {} for computed/reusable expressions — reference with local.name',
      'Precedence: -var flag > *.auto.tfvars > terraform.tfvars > TF_VAR_ env > default',
      'Type system: string, number, bool, list(T), map(T), set(T), object({}), tuple([])',
      'validation {} with condition and error_message for early input checking',
      'sensitive = true suppresses output but does NOT encrypt state — use remote backends',
    ],
    interviewFocus: [
      'Variable precedence order — which wins when multiple sources set the same variable?',
      'Difference between locals and variables — when to use each?',
      'How does sensitive = true protect secrets (and what are its limits)?',
      'How do you pass complex types (lists, objects) to Terraform?',
    ],
  };
}
