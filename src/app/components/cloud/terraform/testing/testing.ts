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
  selector: 'app-tf-testing',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './testing.html',
  styleUrl: './testing.scss',
})
export class TfTesting {
  quickRef: QuickRefItem[] = [
    { name: 'terraform validate',    type: 'keyword', desc: 'Syntax and type check — no provider API calls.' },
    { name: 'terraform test',        type: 'keyword', desc: 'Native test framework with .tftest.hcl files (TF 1.6+).' },
    { name: 'run {} block',          type: 'syntax',  desc: 'A test run: command (plan/apply), variables, assertions.' },
    { name: 'assert {}',             type: 'syntax',  desc: 'Boolean condition + error_message inside a run block.' },
    { name: 'mock_provider {}',      type: 'syntax',  desc: 'Return fake data without real API calls (TF 1.7+).' },
    { name: 'Terratest',             type: 'keyword', desc: 'Go-based integration testing library for real infra.' },
    { name: 'checkov',               type: 'keyword', desc: 'Static analysis: security and compliance misconfigurations.' },
    { name: 'tflint',                type: 'keyword', desc: 'Linter for provider-specific rule violations and style.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Testing Pyramid for Terraform',
      points: [
        'Static: terraform fmt -check, terraform validate, tflint, checkov — fast, no cloud needed.',
        'Unit (mock): terraform test with mock_provider {} — tests logic without real API calls.',
        'Integration: terraform test with real providers or Terratest — applies real infra, asserts, destroys.',
        'Start with static checks in CI (seconds), add integration tests for critical modules (minutes).',
        'The test goal: catch regressions in modules before they break environments.',
      ],
    },
    {
      heading: 'terraform test (TF 1.6+)',
      points: [
        '.tftest.hcl files live in the tests/ directory (or alongside the module).',
        'run {} block: command = plan or apply, optional variables override, one or more assert {} blocks.',
        'assert condition is a Terraform expression evaluating to bool — use length(), startswith(), etc.',
        'Multiple run blocks execute sequentially — state from a previous apply run carries into the next.',
        'terraform test -filter=tests/basic.tftest.hcl runs a specific test file.',
      ],
    },
    {
      heading: 'Mock Providers (TF 1.7+)',
      points: [
        'mock_provider {} in a .tftest.hcl file intercepts provider API calls and returns synthetic data.',
        'mock_resource {} overrides what a specific resource returns — e.g. fake VPC id, fake subnet ids.',
        'Useful for: testing module logic without cloud costs, unit testing conditionals and for_each.',
        'Does not validate whether the resource would actually succeed — use integration tests for that.',
        'provider_mock_data {} in mocked_data {} sets return values for data sources.',
      ],
    },
    {
      heading: 'Terratest & Static Analysis',
      points: [
        'Terratest (Go): apply real infra, use Go test assertions on outputs, destroy on cleanup.',
        'defer terraform.Destroy() + terraform.InitAndApply() — standard Terratest pattern.',
        'checkov: Python static analysis — checks for public S3 buckets, unencrypted volumes, open SGs, etc.',
        'tflint: provider-specific linter — catches invalid instance types, deprecated arguments, etc.',
        'Run checkov and tflint in CI on every PR for free security coverage without real cloud calls.',
      ],
    },
    {
      heading: 'Terraform\'s Native Testing Framework',
      points: [
        'Terraform\'s built-in test framework (terraform test, using .tftest.hcl files, introduced in Terraform 1.6) lets you write assertions against plan and apply output directly in HCL — validating that a module produces expected resource configurations without needing an external testing tool.',
        'Tests can run against a real plan (validating expected values without actually creating infrastructure) or a real apply (creating actual infrastructure temporarily, verifying it, then destroying it) — plan-based tests are faster and safer for CI, while apply-based tests catch issues that only manifest with real provider behavior.',
        'Before native testing existed, Terratest (a Go-based testing library) was the community standard for testing Terraform modules — writing Go tests that apply a module, verify its actual infrastructure behavior, then destroy it, still valuable for more complex testing scenarios beyond what native tests currently support.',
        'Testing modules (not just root configurations) is particularly valuable for shared, reusable modules consumed by multiple teams — automated tests catch a breaking change to a widely-used module before it is published and breaks every consumer, rather than discovering the break only after downstream teams run terraform plan themselves.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'terraform test (.tftest.hcl)',
      language: 'bash',
      code: `# tests/network.tftest.hcl
variables {
  cidr_block  = "10.0.0.0/16"
  environment = "test"
  az_count    = 2
}

# Plan-only test (fast — no real resources)
run "validate_cidr" {
  command = plan
  assert {
    condition     = var.cidr_block == "10.0.0.0/16"
    error_message = "CIDR must be 10.0.0.0/16 in tests"
  }
}

# Integration test (creates real resources)
run "creates_vpc" {
  command = apply
  assert {
    condition     = output.vpc_id != ""
    error_message = "VPC ID should be non-empty after apply"
  }
  assert {
    condition     = length(output.private_subnet_ids) == 2
    error_message = "Expected 2 private subnets, got \${length(output.private_subnet_ids)}"
  }
}

# Run: terraform test -filter=tests/network.tftest.hcl
# Resources created by apply runs are DESTROYED automatically after all run blocks`,
    },
    {
      label: 'Mock Providers (TF 1.7+)',
      language: 'bash',
      code: `# tests/mocked.tftest.hcl
mock_provider "aws" {
  mock_resource "aws_vpc" {
    defaults = {
      id         = "vpc-mock-12345"
      cidr_block = "10.0.0.0/16"
    }
  }
  mock_resource "aws_subnet" {
    defaults = {
      id                = "subnet-mock-12345"
      availability_zone = "us-east-1a"
    }
  }
  mock_data "aws_availability_zones" {
    defaults = {
      names = ["us-east-1a", "us-east-1b"]
    }
  }
}

run "mock_test" {
  command = apply   # no real AWS calls

  assert {
    condition     = output.vpc_id == "vpc-mock-12345"
    error_message = "Expected mock VPC id"
  }
  assert {
    condition     = length(output.subnet_ids) == 2
    error_message = "Expected 2 subnets from mock"
  }
}`,
    },
    {
      label: 'Static Analysis (CI)',
      language: 'bash',
      code: `# Run these in CI before plan/apply:

# 1. Format check
terraform fmt -check -recursive

# 2. Syntax/type validation
terraform validate

# 3. tflint — provider-specific rules
docker run --rm -v "\$(pwd):/data" ghcr.io/terraform-linters/tflint \\
  --chdir=/data \\
  --enable-rule=terraform_required_version \\
  --enable-rule=aws_instance_invalid_type

# 4. checkov — security/compliance
pip install checkov
checkov -d . --framework terraform \\
  --check CKV_AWS_6,CKV_AWS_18,CKV_AWS_20

# Common checkov findings:
# CKV_AWS_6  — no S3 bucket versioning
# CKV_AWS_18 — S3 access logging disabled
# CKV_AWS_20 — S3 bucket publicly accessible
# CKV_AWS_57 — S3 bucket encryption not enabled`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Writing only plan-command tests — no integration tests',
      wrong: `# tests/vpc.tftest.hcl — all plan, no apply
run "test_vpc" {
  command = plan   # only validates syntax, not actual cloud behavior
  assert {
    condition     = output.vpc_id != ""
    error_message = "expected vpc id"
  }
  # output.vpc_id is empty in plan mode — this assertion always fails!
}`,
      right: `run "test_vpc" {
  command = apply  # creates real VPC
  assert {
    condition     = output.vpc_id != ""
    error_message = "expected vpc id after apply"
  }
}
# terraform test destroys the VPC after all run blocks finish`,
      explanation: 'Output values are empty during plan — outputs are only populated after apply. Use command = plan for variable/structure tests; command = apply for output-based assertions.',
    },
    {
      title: 'Not cleaning up test resources on failure',
      wrong: `# Terratest without defer
func TestVPC(t *testing.T) {
  opts := terraform.Options{ TerraformDir: "../" }
  terraform.InitAndApply(t, &opts)
  // If assertion panics, destroy never runs → leaked resources!
  vpcId := terraform.Output(t, &opts, "vpc_id")
  assert.NotEmpty(t, vpcId)
  terraform.Destroy(t, &opts)
}`,
      right: `func TestVPC(t *testing.T) {
  opts := terraform.Options{ TerraformDir: "../" }
  terraform.InitAndApply(t, &opts)
  defer terraform.Destroy(t, &opts)  // always runs, even on panic
  vpcId := terraform.Output(t, &opts, "vpc_id")
  assert.NotEmpty(t, vpcId)
}`,
      explanation: 'Use defer terraform.Destroy() immediately after InitAndApply in Terratest. defer runs even when the test panics — without it, a failing assertion leaves real cloud resources running.',
    },
    {
      title: 'Ignoring checkov findings without justification',
      wrong: `# checkov.yaml
skip-checks:
  - CKV_AWS_20   # public S3
  - CKV_AWS_57   # no encryption
  - CKV_AWS_18   # no logging
# Entire security layer disabled — false sense of coverage`,
      right: `# Suppress specific resource with reason, not globally
resource "aws_s3_bucket" "public_assets" {
  bucket = "my-public-assets"
  # checkov:skip=CKV_AWS_20:Public CDN assets bucket — intentionally public
}
# Or fix the root cause:
resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.public_assets.id
  rule { apply_server_side_encryption_by_default { sse_algorithm = "AES256" } }
}`,
      explanation: 'Globally skipping checkov rules defeats their purpose. Either fix the finding (add encryption, logging, etc.) or suppress with a resource-level comment that justifies the exception.',
    },
  ];

  challenge: Challenge = {
    title: 'Write a terraform test for a VPC Module',
    language: 'typescript',
    description: 'Write a .tftest.hcl test file for a VPC module that: (1) Uses a plan-only run to verify the cidr_block variable equals "10.0.0.0/16", (2) Uses an apply run to verify vpc_id output is non-empty and subnet_ids output has length equal to var.az_count. Set az_count=2 in the variables block.',
    hints: [
      'variables {} block sets defaults for all run blocks',
      'run { command = plan } for variable checks',
      'run { command = apply } for output checks',
      'length(output.subnet_ids) == var.az_count in assert condition',
    ],
    starterCode: `# tests/vpc.tftest.hcl
variables {
  # TODO: cidr_block and az_count
}

run "validate_variables" {
  command = plan
  # TODO: assert cidr_block == "10.0.0.0/16"
}

run "creates_resources" {
  command = apply
  # TODO: assert vpc_id non-empty
  # TODO: assert subnet count equals az_count
}`,
    solution: `# tests/vpc.tftest.hcl
variables {
  cidr_block  = "10.0.0.0/16"
  az_count    = 2
  environment = "test"
}

run "validate_variables" {
  command = plan
  assert {
    condition     = var.cidr_block == "10.0.0.0/16"
    error_message = "CIDR must be 10.0.0.0/16"
  }
}

run "creates_resources" {
  command = apply
  assert {
    condition     = output.vpc_id != ""
    error_message = "VPC ID must be non-empty after apply"
  }
  assert {
    condition     = length(output.subnet_ids) == var.az_count
    error_message = "Expected \${var.az_count} subnets, got \${length(output.subnet_ids)}"
  }
}`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What does terraform validate check?', options: ['Real provider API connectivity', 'HCL syntax correctness and type constraints without provider calls', 'State file integrity', 'Whether plan would succeed'], answer: 1, explanation: 'terraform validate checks syntax correctness and type constraints locally — it does not make any provider API calls and does not require credentials.' },
    { q: 'In terraform test, when are output values available?', options: ['During plan runs', 'During apply runs only', 'Always, regardless of command', 'After destroy'], answer: 1, explanation: 'Outputs are populated only after resources are created (apply). In plan runs, outputs are unknown/empty. Use command = apply for output-based assertions.' },
    { q: 'What do mock_provider {} blocks do in terraform test?', options: ['Skip provider initialization', 'Return synthetic data without real API calls (TF 1.7+)', 'Mock state file', 'Replace provider version'], answer: 1, explanation: 'mock_provider intercepts provider API calls and returns configured fake data. This enables unit testing of module logic without cloud credentials or costs.' },
    { q: 'What does checkov analyze?', options: ['Runtime performance', 'Security and compliance misconfigurations in Terraform code statically', 'Provider compatibility', 'State drift'], answer: 1, explanation: 'checkov is a static analysis tool that scans Terraform HCL for security and compliance issues (unencrypted resources, public buckets, open security groups) without requiring cloud credentials.' },
  { q: 'What is the Terraform native test framework introduced in version 1.6?', options: ['A third-party tool that integrates with Terraform CLI', 'Built-in testing using test files with run blocks that can use mock providers to test module logic without real infrastructure', 'A way to validate provider API responses during apply', 'An integration test runner that always deploys real infrastructure'], answer: 1, explanation: 'Terraform 1.6 introduced the native test framework: write test files with run blocks that call the module under test with specific inputs and make assertions. Terraform 1.7 added mock providers, allowing you to define mock resource attributes without connecting to real cloud APIs. Run tests with terraform test. This enables fast unit testing of complex module logic such as variable defaults, local computations, and conditional expressions without incurring cloud costs.' },
  { q: 'What does Terratest provide that the native test framework does not?', options: ['Terratest is older and provides fewer features', 'Terratest is a Go library that deploys real infrastructure, runs assertions against live endpoints, and tears it down for integration testing', 'Terratest provides mock providers while native tests require real deployments', 'Terratest is built into Terraform CLI while the native framework requires installation'], answer: 1, explanation: 'Terratest from Gruntwork is a Go testing library that deploys real cloud infrastructure, makes HTTP requests and SSH connections to verify actual behavior, then destroys everything on test completion. Best for integration tests that verify real behavior such as an NGINX server returning 200 or an RDS cluster accepting connections. The Terraform native test framework with mock providers is better for fast unit testing of HCL logic. Use both in combination for comprehensive coverage.' },
  ];

  qna: QnaItem[] = [
    { q: 'Where should .tftest.hcl files live?', a: 'In a tests/ subdirectory of the module, or in a tests/ directory alongside the root module. terraform test discovers all .tftest.hcl files in the module directory and its tests/ subdirectory automatically.' },
    { q: 'Does terraform test destroy resources after running?', a: 'Yes — terraform test automatically destroys all resources created by apply runs in .tftest.hcl files after all run blocks complete. If a test fails mid-run, it still attempts cleanup.' },
    { q: 'When should I use Terratest vs terraform test?', a: 'terraform test (native, HCL) is simpler and requires no Go setup — use it for module unit/integration tests. Terratest (Go) is better for complex multi-module integration tests, parallel execution, or when you need full Go test expressiveness and HTTP/API assertions.' },
    { q: 'How do I run only specific test files?', a: 'terraform test -filter=tests/vpc.tftest.hcl runs a specific file. terraform test -verbose shows full output including passed assertions. terraform test runs all .tftest.hcl files in scope.' },
  { q: 'What is the recommended testing strategy for Terraform configurations?', a: 'Apply a testing pyramid adapted for infrastructure as code: at the base, use static analysis tools like tfsec, Checkov, and terraform validate that run instantly with no cloud access. In the middle, use Terraform native tests with mock providers for unit testing module logic including variable defaults, local computations, and conditional expressions. At the top, use integration tests with Terratest or terraform test apply command that deploy real infrastructure to a dedicated test account to verify actual behavior. Run static analysis on every commit, unit tests on every PR, and integration tests on merges to main branches or nightly.' },
  { q: 'What is a test double in the context of Terraform testing?', a: 'In Terraform 1.7 and later, mock providers act as test doubles: they simulate provider behavior without making real API calls. You define mock resources that return predetermined attribute values when the provider would normally call a cloud API. This enables testing module logic that depends on provider-computed attributes like resource IDs or ARNs that are only known after apply. Mock providers make tests fast and free since no real infrastructure is provisioned. They are ideal for testing complex conditional logic, output computations, and module compositions without cloud credentials or costs.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Test Terraform at three levels: static (validate/tflint/checkov), unit (mock_provider), integration (terraform test apply / Terratest).',
    mustKnow: [
      'terraform validate: syntax/type check, no API calls',
      'terraform test (.tftest.hcl): run {} blocks with command = plan/apply + assert {}',
      'Outputs only available in command = apply runs, not plan',
      'mock_provider {} (TF 1.7+): fake provider data for unit tests without cloud costs',
      'terraform test auto-destroys resources after all run blocks complete',
      'checkov / tflint: static security/compliance and style checks — run in CI on every PR',
    ],
    interviewFocus: [
      'How do you test Terraform modules before merging?',
      'Difference between plan and apply in terraform test run blocks',
      'What static analysis tools do you use for Terraform and why?',
    ],
  };
}
