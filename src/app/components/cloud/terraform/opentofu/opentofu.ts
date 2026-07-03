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
  selector: 'app-tf-opentofu',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './opentofu.html',
  styleUrl: './opentofu.scss',
})
export class TfOpenTofu {
  quickRef: QuickRefItem[] = [
    { name: 'OpenTofu',                     type: 'keyword', desc: 'Open-source Terraform fork under the Linux Foundation (CNCF).' },
    { name: 'tofu CLI',                     type: 'keyword', desc: 'Drop-in replacement for terraform CLI — same commands.' },
    { name: 'State encryption',             type: 'keyword', desc: 'Native state + plan file encryption (OpenTofu 1.7+).' },
    { name: 'Provider-defined functions',   type: 'keyword', desc: 'Providers can expose custom functions callable in HCL (OT 1.7+).' },
    { name: 'var.name (in module_meta)',    type: 'keyword', desc: 'Variable reference in module sources (not in Terraform).' },
    { name: 'BSL License',                 type: 'keyword', desc: 'HashiCorp re-licensed Terraform from MPL-2.0 to BSL 1.1 in Aug 2023.' },
    { name: 'MPL-2.0',                     type: 'keyword', desc: 'OpenTofu remains under the original open-source MPL-2.0 license.' },
    { name: 'registry.opentofu.org',       type: 'keyword', desc: 'OpenTofu\'s provider/module registry — mirrors Terraform Registry.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why OpenTofu Exists',
      points: [
        'In August 2023, HashiCorp changed Terraform\'s license from MPL-2.0 (open source) to BSL 1.1 (source-available).',
        'BSL 1.1 restricts use in competing products — a concern for managed Terraform service providers.',
        'The community forked Terraform at v1.5.6 (the last MPL-2.0 release) and created OpenTofu under the Linux Foundation.',
        'OpenTofu joined the CNCF (Cloud Native Computing Foundation) as a sandbox project.',
        'OpenTofu aims to stay compatible with Terraform while developing openly — governed by the community.',
      ],
    },
    {
      heading: 'OpenTofu CLI',
      points: [
        'tofu is a drop-in replacement for terraform — the same HCL, providers, and state format.',
        'All terraform commands work: tofu init, tofu plan, tofu apply, tofu destroy.',
        'Providers and modules from registry.opentofu.org mirror the Terraform Registry.',
        'Existing Terraform projects migrate by replacing the terraform binary with tofu — no HCL changes needed.',
        'CI: replace hashicorp/setup-terraform with opentofu/setup-opentofu GitHub Action.',
      ],
    },
    {
      heading: 'Native State Encryption (OpenTofu 1.7+)',
      points: [
        'OpenTofu can encrypt state files and plan files at rest natively — no external tooling needed.',
        'Encryption is configured in the terraform {} block with an encryption {} sub-block.',
        'Key providers: pbkdf2 (passphrase-based), AWS KMS, GCP KMS, Azure Key Vault.',
        'Both state files (local and remote) and plan files can be encrypted.',
        'Terraform (HashiCorp) does not have this feature — it requires S3 SSE at the backend level.',
      ],
    },
    {
      heading: 'Provider-Defined Functions (OpenTofu 1.7+)',
      points: [
        'Providers can now export custom functions callable directly in HCL expressions.',
        'Example: provider::aws::arn_parse("arn:aws:...") — parse ARN attributes without regex.',
        'Functions are namespaced: provider::<provider_name>::<function_name>.',
        'Reduces need for complex Terraform expressions or external data sources for common transformations.',
        'HashiCorp backported provider functions to Terraform 1.8 — one of several features that flowed upstream.',
      ],
    },
    {
      heading: 'OpenTofu as a Community-Governed Terraform Fork',
      points: [
        'OpenTofu emerged as a fork of Terraform after HashiCorp changed Terraform\'s license from the open-source MPL to the more restrictive BSL (Business Source License) in 2023 — OpenTofu is maintained under the Linux Foundation specifically to preserve a genuinely open-source, community-governed alternative.',
        'OpenTofu maintains near-complete compatibility with existing Terraform configuration syntax and provider ecosystem — most existing .tf files and provider plugins work with OpenTofu with little to no modification, easing migration for teams choosing to switch.',
        'The governance difference is the primary distinction — OpenTofu decisions are made through an open, community-driven process under the Linux Foundation, while Terraform remains controlled by HashiCorp (now part of IBM), which matters for organizations with licensing or vendor-lock-in concerns.',
        'Choosing between Terraform and OpenTofu is largely a licensing and governance decision rather than a technical one at this point — teams should evaluate their specific licensing requirements and risk tolerance for potential future divergence between the two projects as they continue to evolve independently.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Installing & Migrating',
      language: 'bash',
      code: `# Install OpenTofu
# macOS:
brew install opentofu

# Linux:
curl --proto '=https' --tlsv1.2 -fsSL https://get.opentofu.org/install-opentofu.sh | sh

# Windows:
winget install OpenTofu.OpenTofu

# Verify
tofu version   # OpenTofu v1.8.x on linux_amd64

# ---- Migrate existing Terraform project ----
# 1. Nothing to change in HCL — same syntax
# 2. Run tofu init (downloads providers from registry.opentofu.org)
tofu init

# 3. Verify state is compatible
tofu plan   # should match terraform plan output

# 4. Optionally add required_version
terraform {
  required_version = ">= 1.7"   # OpenTofu uses same semver
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}`,
    },
    {
      label: 'State Encryption (OT 1.7+)',
      language: 'bash',
      code: `# Native state encryption — no S3 SSE dependency
# main.tf
terraform {
  encryption {
    # Passphrase-based key (for local state)
    key_provider "pbkdf2" "local_key" {
      passphrase = var.state_passphrase
    }

    method "aes_gcm" "default_method" {
      keys = key_provider.pbkdf2.local_key
    }

    state {
      method = method.aes_gcm.default_method
    }

    plan {
      method = method.aes_gcm.default_method
    }
  }

  backend "s3" {
    bucket = "my-tofu-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
    # State is encrypted BEFORE upload to S3
  }
}

# AWS KMS key provider (production recommended)
key_provider "aws_kms" "prod_key" {
  kms_key_id = "arn:aws:kms:us-east-1:123456789012:key/mrk-..."
  region     = "us-east-1"
}`,
    },
    {
      label: 'Provider Functions & GitHub Actions',
      language: 'bash',
      code: `# Provider-defined functions (OpenTofu 1.7+ / Terraform 1.8+)
# aws provider exposes ARN parsing:
locals {
  db_arn     = aws_db_instance.main.arn
  db_account = provider::aws::arn_parse(local.db_arn).account_id
  db_region  = provider::aws::arn_parse(local.db_arn).region
}

output "db_region" { value = local.db_region }

# ---- GitHub Actions with OpenTofu ----
# .github/workflows/tofu-plan.yml
name: OpenTofu Plan
on:
  pull_request:
    branches: [main]

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubRole
          aws-region: us-east-1

      - uses: opentofu/setup-opentofu@v1
        with:
          tofu_version: "1.8.0"   # replaces hashicorp/setup-terraform

      - run: tofu init
      - run: tofu fmt -check
      - run: tofu validate
      - run: tofu plan -out=plan.tfplan`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Mixing terraform and tofu binaries in the same project',
      wrong: `# Team uses terraform for plan in CI but tofu for local apply
# terraform plan → .terraform.lock.hcl has hashes from Terraform registry
# tofu apply      → Lock file hash mismatch — init fails or uses wrong provider

# Also: different .terraform.lock.hcl hash algorithms between versions`,
      right: `# Standardize on ONE binary across team and CI
# Either all use terraform OR all use tofu
# Commit .terraform.lock.hcl after tofu init
# In CI: use opentofu/setup-opentofu, not hashicorp/setup-terraform
# Add to .terraform.lock.hcl to git to lock provider hashes`,
      explanation: 'terraform and tofu maintain separate provider hash registries. Mixing them causes lock file hash mismatches. Choose one binary and use it consistently across all local dev and CI environments.',
    },
    {
      title: 'Assuming OpenTofu always tracks Terraform features immediately',
      wrong: `# Using Terraform 1.9 feature (e.g. ephemeral values) in code
# that targets OpenTofu 1.7
ephemeral "aws_secretsmanager_secret_version" "db" {  # TF 1.10+ only
  secret_id = "prod/db"
}
# tofu plan → Unknown block type "ephemeral"`,
      right: `# Check OpenTofu release notes for feature parity
# OpenTofu and Terraform are diverging — some features appear in one first
# For cross-compatible code: use only features in BOTH at target versions
# OpenTofu has STATE ENCRYPTION — Terraform does not (unique OT feature)
# Check: https://opentofu.org/docs/intro/migration/`,
      explanation: 'OpenTofu and Terraform are separate projects with different feature roadmaps. Some features (state encryption, provider functions) appeared in OpenTofu first; others (ephemeral values) in Terraform. Check compatibility before using new features.',
    },
    {
      title: 'Not pinning OpenTofu version in CI',
      wrong: `- uses: opentofu/setup-opentofu@v1
  # No version pinned — uses latest OpenTofu
  # Plan output format may change between minor versions`,
      right: `- uses: opentofu/setup-opentofu@v1
  with:
    tofu_version: "1.8.0"   # exact version
# Add required_version = "~> 1.8" in terraform {} block
# .opentofu-version or .terraform-version files also work with tofuenv/tfenv`,
      explanation: 'Unpinned OpenTofu versions cause non-deterministic CI. Minor version updates can change plan output format or add new warnings. Pin the version in setup-opentofu and required_version.',
    },
  ];

  challenge: Challenge = {
    title: 'Migrate a Terraform Project to OpenTofu',
    language: 'typescript',
    description: 'Write the steps and configuration to migrate a simple Terraform project to OpenTofu: (1) Add required_version for OpenTofu, (2) Write the GitHub Actions step to use opentofu/setup-opentofu pinned to 1.8.0, (3) Add state encryption using pbkdf2 key provider in the terraform {} block, (4) Show the tofu commands to verify the migration.',
    hints: [
      'tofu init replaces terraform init',
      'opentofu/setup-opentofu@v1 with tofu_version: "1.8.0"',
      'encryption { key_provider "pbkdf2" "key" { passphrase = var.x } }',
      'tofu plan must match previous terraform plan output',
    ],
    starterCode: `# terraform/main.tf
terraform {
  # TODO: required_version for opentofu >= 1.7
  required_providers {
    aws = { source = "hashicorp/aws"; version = "~> 5.0" }
  }
  # TODO: add state encryption block
}

# .github/workflows/plan.yml excerpt
steps:
  # TODO: opentofu/setup-opentofu step pinned to 1.8.0
  # TODO: tofu init, fmt-check, validate, plan`,
    solution: `# terraform/main.tf
terraform {
  required_version = ">= 1.7"
  required_providers {
    aws = { source = "hashicorp/aws"; version = "~> 5.0" }
  }
  encryption {
    key_provider "pbkdf2" "passphrase" {
      passphrase = var.state_passphrase
    }
    method "aes_gcm" "default" {
      keys = key_provider.pbkdf2.passphrase
    }
    state { method = method.aes_gcm.default }
    plan  { method = method.aes_gcm.default }
  }
}

variable "state_passphrase" { type = string; sensitive = true }

# .github/workflows/plan.yml
steps:
  - uses: opentofu/setup-opentofu@v1
    with:
      tofu_version: "1.8.0"

  - run: tofu init
    env: { TF_IN_AUTOMATION: "true" }
  - run: tofu fmt -check
  - run: tofu validate
  - run: tofu plan -out=plan.tfplan

# Verify migration locally:
# tofu init         # re-downloads providers
# tofu plan         # must show no changes vs terraform state
# tofu apply        # only after plan verification`,
  };

  quiz: QuizQuestion[] = [
    { q: 'Why was OpenTofu created?', options: ['To add a GUI to Terraform', 'HashiCorp changed Terraform\'s license from MPL-2.0 to BSL 1.1, prompting a community fork', 'To support a new HCL version', 'To compete with Pulumi'], answer: 1, explanation: 'In August 2023, HashiCorp re-licensed Terraform from the open-source MPL-2.0 to BSL 1.1, which restricts use in competing products. The community forked the last MPL-2.0 version (1.5.6) and created OpenTofu under the Linux Foundation.' },
    { q: 'Is the tofu CLI compatible with Terraform HCL files?', options: ['No — requires HCL v3', 'Yes — same HCL syntax, same providers, same state format', 'Partially — only Terraform 1.5 features work', 'No — providers must be recompiled'], answer: 1, explanation: 'tofu is a drop-in replacement. The same HCL files, provider configurations, modules, and state files work unchanged. You replace the binary; you do not change the code.' },
    { q: 'What unique security feature does OpenTofu 1.7+ have that Terraform lacks?', options: ['Automatic secret rotation', 'Native state and plan file encryption', 'IAM-based state locking', 'Provider signature verification'], answer: 1, explanation: 'OpenTofu 1.7+ includes native state and plan encryption via the encryption {} block, supporting pbkdf2, AWS KMS, GCP KMS, and Azure Key Vault. Terraform relies on backend-level encryption (e.g. S3 SSE) instead.' },
    { q: 'Which GitHub Actions step replaces hashicorp/setup-terraform for OpenTofu?', options: ['tofu/setup-tofu', 'opentofu/setup-opentofu', 'cncf/setup-opentofu', 'linux-foundation/terraform-setup'], answer: 1, explanation: 'opentofu/setup-opentofu is the official GitHub Action for installing the tofu CLI. Use it as a direct replacement for hashicorp/setup-terraform in CI workflows.' },
  { q: 'How does OpenTofu\'s governance model differ from Terraform\'s, and why does that matter for the long-term feature roadmap of each?', options: ['They are governed identically since OpenTofu is just a rebuild of Terraform', 'OpenTofu is governed by the Linux Foundation through community RFCs with no single controlling company, while Terraform\'s roadmap is decided unilaterally by HashiCorp as a commercial product — meaning OpenTofu features require community consensus while Terraform features can be prioritized around HashiCorp\'s business goals (including paid Terraform Cloud/Enterprise features)', 'OpenTofu requires a paid CNCF membership to influence its roadmap', 'Terraform has moved to community governance while OpenTofu is now the closed-source version'], answer: 1, explanation: 'The governance difference is the structural reason the two projects\' feature sets have started to diverge rather than staying in lockstep: OpenTofu\'s CNCF/Linux-Foundation model means any contributor can propose an RFC and features ship based on community maintainer consensus, while Terraform\'s features are prioritized internally by HashiCorp with an eye toward its commercial Terraform Cloud/Enterprise offerings. This is why state encryption landed in OpenTofu before an equivalent shipped in Terraform, and why the two tools\' capabilities are expected to keep drifting apart over time rather than staying interchangeable indefinitely.' },
  { q: 'What new features has OpenTofu added beyond Terraform 1.6?', options: ['OpenTofu is frozen at Terraform 1.6 with no new features', 'OpenTofu has added state encryption, provider-defined functions, and loopable import blocks', 'OpenTofu only adds commercial features like SAML SSO', 'OpenTofu removed modules and workspaces to simplify the tool'], answer: 1, explanation: 'OpenTofu has added features not present in Terraform: native state encryption to protect state at rest without third-party tools, provider-defined functions allowing providers to expose functions callable in HCL expressions, loopable import blocks with for_each to import multiple resources at once, and improved testing capabilities. The OpenTofu roadmap is driven by community RFCs rather than a single company, allowing faster community feature delivery.' },
  ];

  qna: QnaItem[] = [
    { q: 'Can I use Terraform providers with OpenTofu?', a: 'Yes — OpenTofu uses the same provider plugin protocol. Providers published on registry.terraform.io work with OpenTofu. The OpenTofu registry (registry.opentofu.org) mirrors HashiCorp\'s registry and adds community providers.' },
    { q: 'How do OpenTofu and Terraform versions track each other?', a: 'OpenTofu started at 1.6 (forked from 1.5.6) and has been developing independently. They share the same semver scheme for compatibility, but features diverge — state encryption appeared in OpenTofu 1.7, provider functions in both 1.7/1.8. Periodically check release notes of each for feature parity.' },
    { q: 'What is the CNCF and why does it matter for OpenTofu?', a: 'CNCF (Cloud Native Computing Foundation) is a vendor-neutral home for open-source cloud-native projects (Kubernetes, Prometheus, etc.). OpenTofu joining CNCF ensures neutral governance — no single vendor can re-license it. It provides long-term stability and community trust.' },
    { q: 'Should I migrate my company from Terraform to OpenTofu?', a: 'If you use Terraform Cloud/Enterprise, the BSL license does not restrict you. If you provide a SaaS product that competes with HashiCorp, BSL restricts you — OpenTofu is the safe alternative. For internal use, both are viable; evaluate based on feature needs (state encryption, governance model) and vendor risk tolerance.' },
  { q: 'How do you migrate from Terraform to OpenTofu?', a: 'Migration is straightforward because OpenTofu maintains HCL and state file compatibility with Terraform 1.6. Steps: install OpenTofu using a package manager or by downloading the binary. Replace terraform commands with tofu: tofu init, tofu plan, tofu apply. OpenTofu reads the same lock file and state files without conversion. Update CI/CD pipelines to use the tofu binary instead of terraform. Review any provider version constraints since OpenTofu and Terraform may have diverged in provider support. Most configurations migrate with zero changes to HCL files because the syntax and state format are identical.' },
  { q: 'A company just uses Terraform internally to manage its own AWS infrastructure — it does not build or sell an IaC product. Does the BSL license change that prompted OpenTofu\'s creation actually restrict anything for a team in that situation?', a: 'No — the BSL 1.1 restriction specifically targets building a COMPETING commercial product or service on top of Terraform (e.g. a hosted Terraform-as-a-service platform, or a proprietary tool that embeds and resells Terraform\'s functionality); ordinary internal use of Terraform to manage your own company\'s infrastructure is explicitly unaffected and remains free to use exactly as before. This nuance is often lost in the "Terraform went closed-source" narrative — the vast majority of Terraform users doing standard IaC work were never legally restricted by the license change at all, and the move to OpenTofu for such teams is more about philosophical alignment with open governance (and hedging against future license changes) than about an actual legal blocker they were hitting.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'OpenTofu is the community-governed open-source fork of Terraform (MPL-2.0), with drop-in CLI compatibility and unique features like native state encryption.',
    mustKnow: [
      'OpenTofu forked Terraform at v1.5.6 after HashiCorp\'s BSL re-licensing in Aug 2023',
      'tofu CLI = drop-in replacement for terraform — same HCL, providers, state format',
      'State encryption (OT 1.7+): native encryption {} block with KMS/pbkdf2 support',
      'Provider-defined functions (OT 1.7+): provider::aws::arn_parse() etc.',
      'CI: replace hashicorp/setup-terraform with opentofu/setup-opentofu',
      'OpenTofu is under CNCF — vendor-neutral governance, permanently MPL-2.0',
    ],
    interviewFocus: [
      'Why did OpenTofu fork from Terraform?',
      'What is the main difference between the BSL and MPL-2.0 licenses?',
      'What features does OpenTofu have that Terraform lacks?',
    ],
  };
}
