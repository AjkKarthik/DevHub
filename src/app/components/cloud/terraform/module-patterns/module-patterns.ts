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
  selector: 'app-tf-module-patterns',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './module-patterns.html',
  styleUrl: './module-patterns.scss',
})
export class TfModulePatterns {
  quickRef: QuickRefItem[] = [
    { name: 'Root module',           type: 'keyword', desc: 'Entry point — calls child modules and wires them together.' },
    { name: 'Child module',          type: 'keyword', desc: 'Reusable component module with focused responsibility.' },
    { name: 'Feature flag pattern',  type: 'keyword', desc: 'Optional sub-resource controlled by a boolean variable.' },
    { name: 'nullable = false',      type: 'keyword', desc: 'Prevents null being passed as a variable value.' },
    { name: 'optional(type, def)',   type: 'syntax',  desc: 'Optional object attribute with default (TF 1.3+).' },
    { name: 'terraform test',        type: 'keyword', desc: 'Native test framework for module validation (TF 1.6+).' },
    { name: 'examples/ directory',   type: 'keyword', desc: 'Example root module usage — also serves as integration test.' },
    { name: 'module composition',    type: 'keyword', desc: 'Modules passing outputs to other modules — loose coupling.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Root vs Child Modules',
      points: [
        'Root module: the entry-point config that orchestrates. It calls child modules and wires outputs to inputs.',
        'Child modules: focused, reusable components — network, compute, database — each with a clear responsibility.',
        'Root modules are environment-specific; child modules are generic and reused across environments.',
        'Avoid business logic in the root module — delegate to child modules and let the root just compose.',
        'Flat module hierarchies (root → child) are easier to understand than deep nesting (root → a → b → c).',
      ],
    },
    {
      heading: 'Feature Flags with Optional Variables',
      points: [
        'Boolean variables enable/disable optional sub-resources: enable_monitoring = false.',
        'Use count = var.enable_monitoring ? 1 : 0 on optional resources.',
        'optional(type, default) in object variables (TF 1.3+) lets callers omit keys with defaults.',
        'Avoid deeply conditional modules — if enable_X requires 10 new variables, it may deserve its own module.',
        'Default closed (disabled) — callers opt in, not opt out.',
      ],
    },
    {
      heading: 'Module Composition',
      points: [
        'Modules communicate through output → input passing, not direct resource references.',
        'The root module is the composition layer: it calls network module, passes its vpc_id to compute module.',
        'Never pass whole module objects — pass specific typed outputs (strings, lists) for looser coupling.',
        'Composition enables swapping implementations: replace the network module without changing compute.',
        'Keep module inputs small — only expose what callers genuinely need to control.',
      ],
    },
    {
      heading: 'Testing Modules',
      points: [
        'terraform validate checks syntax and type constraints — fast, no cloud calls.',
        'terraform test (TF 1.6+): native .tftest.hcl files with run blocks and assert conditions.',
        'examples/ directory serves dual purpose: documentation + integration tests via Terratest or CI.',
        'Terratest: Go-based testing framework — apply real infra, assert outputs, destroy on completion.',
        'Unit test pattern: mock providers or use localstack for isolated module testing.',
      ],
    },
    {
      heading: 'Composable Module Design Patterns',
      points: [
        'A well-designed module has a clear, minimal, purposeful interface (a small set of well-documented input variables and output values) — a module that exposes every internal detail as a variable becomes brittle and hard to evolve, since any internal implementation change risks breaking every consumer.',
        'The "root module composing child modules" pattern (a root configuration that calls several focused, single-purpose child modules — networking, compute, database — and wires their outputs to each other\'s inputs) scales better than one monolithic module trying to manage an entire application\'s infrastructure.',
        'Versioning modules (via Git tags referenced in the module source, or a proper module registry) lets consumers pin to a specific known-good module version and upgrade deliberately, rather than always consuming the latest (potentially breaking) changes to a shared module automatically.',
        'Avoid modules that are simply thin wrappers around a single resource with no added value — a module should encapsulate genuine reusable logic (sensible defaults, multiple related resources wired together, validation) rather than just adding an indirection layer around one resource block.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Root Composition',
      language: 'bash',
      code: `# root/main.tf — composition layer
module "network" {
  source      = "./modules/network"
  cidr_block  = var.vpc_cidr
  az_count    = var.az_count
  environment = var.environment
}

module "compute" {
  source         = "./modules/compute"
  vpc_id         = module.network.vpc_id         # output → input
  subnet_ids     = module.network.private_subnets
  instance_type  = var.instance_type
  environment    = var.environment
}

module "database" {
  source     = "./modules/database"
  vpc_id     = module.network.vpc_id
  subnet_ids = module.network.private_subnets
  app_sg_id  = module.compute.security_group_id  # chain: compute output
}

output "app_url" { value = module.compute.load_balancer_dns }`,
    },
    {
      label: 'Feature Flags',
      language: 'bash',
      code: `# modules/rds/variables.tf
variable "enable_read_replica" {
  type        = bool
  description = "Create a read replica in the secondary AZ"
  default     = false
}
variable "enable_enhanced_monitoring" {
  type    = bool
  default = false
}

# modules/rds/main.tf
resource "aws_db_instance" "primary" {
  identifier     = "primary-db"
  instance_class = var.instance_class
  # ... other settings
}

resource "aws_db_instance" "replica" {
  count = var.enable_read_replica ? 1 : 0   # optional resource

  identifier          = "replica-db"
  replicate_source_db = aws_db_instance.primary.identifier
  instance_class      = var.instance_class
}

resource "aws_db_instance_role_association" "monitoring" {
  count = var.enable_enhanced_monitoring ? 1 : 0
  db_instance_identifier = aws_db_instance.primary.id
  feature_name           = "MonitoringRole"
  role_arn               = aws_iam_role.rds_monitoring[0].arn
}`,
    },
    {
      label: 'Optional Object Attributes (TF 1.3+)',
      language: 'bash',
      code: `# Optional object attributes with defaults
variable "monitoring_config" {
  type = object({
    enabled           = optional(bool, false)
    retention_days    = optional(number, 7)
    alert_email       = optional(string, "")
  })
  default = {}   # all fields get their defaults
}

# Caller can pass partial object:
module "app" {
  source = "./modules/app"
  monitoring_config = {
    enabled        = true
    alert_email    = "ops@company.com"
    # retention_days omitted — uses default 7
  }
}

# ---- terraform test (TF 1.6+) ----
# tests/basic.tftest.hcl
run "basic_apply" {
  command = apply
  variables {
    environment = "test"
    az_count    = 1
  }
  assert {
    condition     = output.vpc_id != ""
    error_message = "VPC should be created with a non-empty ID"
  }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Putting everything in the root module',
      wrong: `# root/main.tf — 500 lines of resources
resource "aws_vpc" "main" { ... }
resource "aws_subnet" "private" { ... }
resource "aws_instance" "app" { ... }
resource "aws_db_instance" "main" { ... }
# Hard to test, reuse, or understand`,
      right: `module "network"  { source = "./modules/network" }
module "compute"  { source = "./modules/compute"  }
module "database" { source = "./modules/database" }
# Each module is focused, testable, reusable`,
      explanation: 'Monolithic root modules become unmanageable. Extract logical groups into child modules — network, compute, database — each with a single responsibility.',
    },
    {
      title: 'Exposing too many variables in a module',
      wrong: `# 40 variables in a "simple" VPC module
variable "vpc_cidr" {}
variable "enable_flow_logs" {}
variable "flow_log_retention" {}
variable "flow_log_kms_key" {}
# ... 36 more variables
# Callers need to understand every internal detail`,
      right: `# Minimal interface — expose only what must vary
variable "cidr_block"  { type = string }
variable "az_count"    { type = number; default = 2 }
variable "environment" { type = string }
# Feature flags for opt-in extras
variable "enable_flow_logs" { type = bool; default = false }`,
      explanation: 'A module with dozens of variables is hard to use and maintains a leaky abstraction. Expose only what callers genuinely need — default sensible values for everything else.',
    },
    {
      title: 'Direct resource references across module boundaries',
      wrong: `# In root — accessing module internals directly
resource "aws_route" "r" {
  route_table_id = module.network.aws_route_table.private.id  # WRONG
}`,
      right: `# modules/network/outputs.tf
output "private_route_table_id" { value = aws_route_table.private.id }
# Root:
resource "aws_route" "r" {
  route_table_id = module.network.private_route_table_id  # correct
}`,
      explanation: 'Accessing module internals directly couples your root to the module\'s implementation. Always go through declared outputs — this lets you refactor module internals freely.',
    },
  ];

  challenge: Challenge = {
    title: 'Feature-Flag Module',
    language: 'typescript',
    description: 'Create a database module with optional read replica (enable_read_replica bool, default false) and optional enhanced monitoring (enable_monitoring bool, default false). Write the main.tf using count on optional resources. Write a test assertion that count of aws_db_instance resources equals 2 when enable_read_replica = true.',
    hints: [
      'count = var.enable_read_replica ? 1 : 0 for the replica',
      'replicate_source_db = aws_db_instance.primary.identifier on replica',
      'count = var.enable_monitoring ? 1 : 0 for monitoring role',
      'terraform test: assert length(aws_db_instance.replica) == 1',
    ],
    starterCode: `# modules/database/variables.tf
variable "instance_class"        { type = string; default = "db.t3.micro" }
variable "enable_read_replica"   { type = bool;   default = false }
variable "enable_monitoring"     { type = bool;   default = false }

# modules/database/main.tf
resource "aws_db_instance" "primary" {
  identifier     = "primary"
  instance_class = var.instance_class
  engine         = "mysql"
}

# TODO: optional read replica

# TODO: optional monitoring

# modules/database/outputs.tf
# TODO: primary_id, replica_id (list), monitoring_enabled`,
    solution: `# modules/database/variables.tf
variable "instance_class"        { type = string; default = "db.t3.micro" }
variable "enable_read_replica"   { type = bool;   default = false }
variable "enable_monitoring"     { type = bool;   default = false }

# modules/database/main.tf
resource "aws_db_instance" "primary" {
  identifier     = "primary"
  instance_class = var.instance_class
  engine         = "mysql"
  engine_version = "8.0"
}

resource "aws_db_instance" "replica" {
  count               = var.enable_read_replica ? 1 : 0
  identifier          = "replica"
  instance_class      = var.instance_class
  replicate_source_db = aws_db_instance.primary.identifier
}

resource "aws_cloudwatch_metric_alarm" "db_cpu" {
  count               = var.enable_monitoring ? 1 : 0
  alarm_name          = "db-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  threshold           = 80
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
}

# modules/database/outputs.tf
output "primary_id"        { value = aws_db_instance.primary.id }
output "replica_ids"       { value = aws_db_instance.replica[*].id }
output "monitoring_enabled"{ value = var.enable_monitoring }

# tests/replica.tftest.hcl
run "with_replica" {
  variables { enable_read_replica = true }
  assert {
    condition     = length(aws_db_instance.replica) == 1
    error_message = "Expected exactly one read replica"
  }
}`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the role of the root module?', options: ['To define all resources directly', 'To orchestrate child modules — calling them and wiring outputs to inputs', 'To store state remotely', 'To define providers only'], answer: 1, explanation: 'The root module is the composition layer. It calls child modules and wires their outputs to each other\'s inputs. Business logic lives in child modules; root just composes.' },
    { q: 'How do you create an optional resource in a module?', options: ['Use optional() keyword on the resource', 'Use count = var.enable_x ? 1 : 0', 'Use lifecycle { ignore_changes = all }', 'Wrap in a dynamic block'], answer: 1, explanation: 'count = condition ? 1 : 0 creates one resource when enabled, zero when disabled. Access the optional resource with resource.name[0] when it may not exist.' },
    { q: 'What does optional(type, default) do in a variable object?', options: ['Makes the entire variable optional', 'Allows specific object attributes to be omitted, using the default value', 'Deprecates the attribute', 'Only works with string types'], answer: 1, explanation: 'optional(type, default) in an object type (TF 1.3+) lets callers omit that key — Terraform substitutes the default. Callers can pass partial objects.' },
    { q: 'What is the purpose of an examples/ directory in a module?', options: ['To store SCSS styles', 'To show real usage and serve as integration test cases', 'To document provider versions', 'To store lock files'], answer: 1, explanation: 'examples/ shows how the module should be called with real configuration. These examples also serve as integration tests — CI applies them, validates outputs, then destroys.' },
  { q: 'What is the recommended pattern for structuring Terraform modules for reusability?', options: ['One giant module per environment that includes all resources', 'Small focused modules with well-defined inputs and outputs, composed together in a root module', 'Modules should never be nested; use only flat configurations', 'Each engineer maintains their own private module copy'], answer: 1, explanation: 'Best practice is small, focused modules such as a VPC module, an EKS cluster module, or an RDS module, each with clear input variables and output values. A root module composes these together for a specific environment. This separation of concerns allows modules to be versioned, tested, and reused across teams and environments. Avoid creating mega-modules that do everything; they become hard to maintain and prevent reuse of individual components.' },
  { q: 'What is the difference between a root module and a child module in Terraform?', options: ['Root modules cannot use child modules', 'The root module is the top-level configuration Terraform executes; child modules are reusable units called by root or other modules', 'Child modules always deploy to a different environment than root modules', 'Root modules are stored in registries; child modules are local only'], answer: 1, explanation: 'The root module is the directory where you run Terraform commands. It calls child modules via module blocks. Child modules can be local paths or remote sources from the Terraform Registry, Git, or S3. Child modules receive input variables and expose output values. The root module orchestrates child modules, passing outputs from one as inputs to another, and Terraform resolves dependencies automatically based on these references.' },
  ];

  qna: QnaItem[] = [
    { q: 'How deep should module nesting go?', a: 'Maximum 2-3 levels. Root → child is ideal. Root → child → grandchild becomes hard to trace. If a module needs to call many child modules itself, consider flattening the design.' },
    { q: 'What is terraform test?', a: 'terraform test (TF 1.6+) is a native testing framework. You write .tftest.hcl files with run blocks, variable overrides, and assert conditions. It applies real infra (or uses mock providers for unit testing) and validates outputs.' },
    { q: 'How do you handle a module that is used in 10 places but needs a one-off change in one place?', a: 'Add an optional variable (with a default that preserves the existing behavior) for the one-off change. Callers who need the special behavior pass the variable; others use the default and are unaffected.' },
    { q: 'Can a module define its own backend?', a: 'No. Only the root module can define a backend block. Child modules use the root\'s backend. This is intentional — backends are deployment concerns, not module concerns.' },
  { q: 'How do you version Terraform modules in the Terraform Registry?', a: 'Terraform Registry uses semantic versioning with Git tags. To publish: create a public GitHub repo named terraform-PROVIDER-NAME following the naming convention, add a LICENSE file, write the module code with variables.tf, main.tf, and outputs.tf at the root, and push a tag like v1.0.0. Terraform Registry auto-discovers tagged releases. Consumers pin versions with a version constraint in the module source block. The tilde-greater constraint like 1.0 allows patch and minor updates but not major versions. For private modules, use a private registry in Terraform Cloud or host modules in S3 or a Git server.' },
  { q: 'What is the module registry protocol and what are alternatives for hosting private modules?', a: 'The Terraform Module Registry Protocol is an HTTP API that Terraform uses to discover, download, and version modules. Terraform Cloud and HCP Terraform implement this protocol for private registries. Alternatives for private module hosting: Git repositories where you reference the URL with a ref pointing to a tag for stability, S3 buckets with an archived zip of the module, local paths for modules within the same repository, and HTTP archives. Git is most common for teams without Terraform Cloud and supports SSH or HTTPS authentication.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Module patterns — composition, feature flags, minimal interfaces, and testing — make Terraform infrastructure maintainable at scale.',
    mustKnow: [
      'Root module = composition layer; child modules = focused reusable components',
      'Feature flags: count = var.enable ? 1 : 0 on optional resources',
      'optional(type, default) for partial object inputs (TF 1.3+)',
      'Module interface: expose only what must vary; default everything else',
      'Never access module internals directly — always go through declared outputs',
      'terraform test (.tftest.hcl) for native module validation (TF 1.6+)',
    ],
    interviewFocus: [
      'How do you design a module with optional sub-components?',
      'What makes a good module interface?',
      'How do you test Terraform modules?',
    ],
  };
}
