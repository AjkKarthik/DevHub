import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-devops-iac',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './iac.html',
  styleUrl: './iac.scss'
})
export class DevopsIac {

  quickRef: QuickRefItem[] = [
    { name: 'terraform init', type: 'syntax', desc: 'Download providers and initialise backend; run once per workspace or provider change' },
    { name: 'terraform plan', type: 'syntax', desc: 'Show what will change without applying; save with -out=plan.tfplan for apply' },
    { name: 'terraform apply', type: 'syntax', desc: 'Apply changes to real infrastructure; requires confirmation or -auto-approve in CI' },
    { name: 'terraform destroy', type: 'syntax', desc: 'Remove all resources managed by the configuration — irreversible in production' },
    { name: 'terraform import', type: 'syntax', desc: 'Bring an existing resource under Terraform management without recreating it' },
    { name: 'Terraform state', type: 'keyword', desc: 'JSON file tracking real-world resource IDs; must be stored remotely in teams (S3, Azure Blob, Terraform Cloud)' },
    { name: 'terraform workspace', type: 'syntax', desc: 'Isolated state namespaces for multi-environment support within one config' },
    { name: 'Bicep', type: 'keyword', desc: 'Azure-native declarative IaC DSL; compiles to ARM JSON; cleaner syntax than raw ARM' },
    { name: 'az deployment group create', type: 'syntax', desc: 'Deploy a Bicep/ARM template to an Azure resource group' },
    { name: 'Pulumi', type: 'keyword', desc: 'IaC using real programming languages (TypeScript, Python, Go, C#) with full SDK ecosystems' },
    { name: 'Drift detection', type: 'keyword', desc: 'Identifying when real infrastructure diverges from the IaC definition; terraform plan catches this' },
    { name: 'Remote backend', type: 'keyword', desc: 'Centralised state storage with locking; prevents concurrent applies corrupting state' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is Infrastructure as Code',
      points: [
        'IaC manages and provisions infrastructure through machine-readable definition files rather than manual processes or interactive UIs.',
        'Benefits: reproducibility (same config → same infrastructure every time), auditability (changes tracked in Git), automation (CI/CD pipelines apply changes), disaster recovery (rebuild from code).',
        'Declarative IaC (Terraform, Bicep, CloudFormation): you describe the desired end state; the tool figures out how to get there. Idempotent — re-applying a stable config does nothing.',
        'Imperative IaC (Pulumi with code, Ansible tasks): you describe the steps to execute. More flexible but requires explicit idempotency checks.',
        'Infrastructure drift: when someone manually changes a resource in the cloud console, the live state diverges from the IaC definition. Run terraform plan regularly to detect and remediate drift.',
      ]
    },
    {
      heading: 'Terraform — the multi-cloud standard',
      points: [
        'Terraform uses HCL (HashiCorp Configuration Language) to describe resources across AWS, Azure, GCP, Kubernetes, and hundreds of providers.',
        'Provider plugins translate HCL resource blocks into API calls. The provider ecosystem is vast: databases, DNS, GitHub, Datadog, PagerDuty.',
        'The state file is critical — it maps HCL resources to real cloud resource IDs. Lose or corrupt it and Terraform cannot manage existing resources. Always use remote backends with locking.',
        'Modules encapsulate reusable infrastructure patterns: a "vpc" module, a "kubernetes-cluster" module. Reduces repetition and enforces standards across teams.',
        'Workspaces provide isolated state namespaces within one configuration — useful for staging/production separation without duplicating code.',
      ]
    },
    {
      heading: 'State management and remote backends',
      points: [
        'Local state (terraform.tfstate) works for learning but is dangerous in teams: no locking means concurrent applies can corrupt state; state contains sensitive values in plaintext.',
        'Remote backends (S3 + DynamoDB lock, Azure Blob + lease, GCS, Terraform Cloud) store state centrally and enforce locking — only one apply runs at a time.',
        'Terraform Cloud / HCP Terraform: managed remote backend + run history + policy enforcement (Sentinel/OPA). Free tier is generous for small teams.',
        'Never commit terraform.tfstate to Git. Add *.tfstate and *.tfstate.backup to .gitignore.',
        'Sensitive outputs (passwords, keys) appear in state in plaintext. Use terraform_remote_state to share outputs between configurations rather than passing them manually.',
      ]
    },
    {
      heading: 'Bicep — Azure-native IaC',
      points: [
        'Bicep is Microsoft\'s domain-specific language for Azure Resource Manager (ARM). It compiles to ARM JSON — Bicep is syntactic sugar, not a separate engine.',
        'Cleaner than raw ARM: no verbose JSON, type-safe parameters, modules, symbolic resource references (instead of [resourceId(...)]).',
        'Bicep deployments are idempotent by default — deploying an unchanged template is a no-op. Incremental mode (default) only touches changed resources.',
        'Bicep modules let you share reusable infrastructure patterns published to template specs or Azure Container Registry.',
        'Azure CLI: az deployment group create --resource-group rg --template-file main.bicep --parameters @prod.bicepparam.',
      ]
    },
    {
      heading: 'IaC in CI/CD pipelines',
      points: [
        'Pipeline pattern: terraform fmt --check → terraform validate → terraform plan -out=plan.tfplan → (gate/approval) → terraform apply plan.tfplan.',
        'Show the plan as a PR comment so reviewers can approve infrastructure changes before they land — no surprises in production.',
        'Use -target sparingly in pipelines (applies only specific resources); it can leave the state partially inconsistent. Prefer full applies.',
        'Separate CI (validate + plan on every PR) from CD (apply on merge to main). Never apply from a feature branch.',
        'Policy as Code: Sentinel (Terraform Enterprise), OPA/Conftest, or Checkov can evaluate plans against policies before apply — e.g. "no public S3 buckets", "all resources must have cost-centre tags".',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Terraform — AKS Cluster',
      language: 'bash',
      code: `# ─── main.tf — Azure Kubernetes Service cluster ──────────────────────────────

# terraform {
#   required_providers {
#     azurerm = { source = "hashicorp/azurerm", version = "~> 3.0" }
#   }
#   backend "azurerm" {
#     resource_group_name  = "tfstate-rg"
#     storage_account_name = "tfstateaccount"
#     container_name       = "tfstate"
#     key                  = "prod.terraform.tfstate"
#   }
# }
#
# provider "azurerm" { features {} }
#
# variable "location"       { default = "uksouth" }
# variable "resource_group" { default = "myapp-rg" }
# variable "node_count"     { default = 3 }
#
# resource "azurerm_resource_group" "rg" {
#   name     = var.resource_group
#   location = var.location
#   tags     = { environment = "production", team = "platform" }
# }
#
# resource "azurerm_kubernetes_cluster" "aks" {
#   name                = "myapp-aks"
#   location            = azurerm_resource_group.rg.location
#   resource_group_name = azurerm_resource_group.rg.name
#   dns_prefix          = "myapp"
#   kubernetes_version  = "1.30"
#
#   default_node_pool {
#     name       = "system"
#     node_count = var.node_count
#     vm_size    = "Standard_DS2_v2"
#     upgrade_settings { max_surge = "10%" }
#   }
#
#   identity { type = "SystemAssigned" }
#
#   network_profile {
#     network_plugin = "azure"
#     network_policy = "calico"
#   }
# }
#
# output "kube_config" {
#   value     = azurerm_kubernetes_cluster.aks.kube_config_raw
#   sensitive = true
# }

# ─── Terraform CI/CD pipeline (GitHub Actions) ───────────────────────────────

# name: Terraform Plan & Apply
# on:
#   pull_request:
#     paths: ['infra/**']
#   push:
#     branches: [main]
#     paths: ['infra/**']
#
# jobs:
#   plan:
#     runs-on: ubuntu-latest
#     defaults: { run: { working-directory: infra } }
#     steps:
#       - uses: actions/checkout@v4
#       - uses: hashicorp/setup-terraform@v3
#       - uses: azure/login@v2
#         with:
#           client-id: \$\{\{ secrets.AZURE_CLIENT_ID }}
#           tenant-id: \$\{\{ secrets.AZURE_TENANT_ID }}
#           subscription-id: \$\{\{ secrets.AZURE_SUBSCRIPTION_ID }}
#
#       - run: terraform init
#       - run: terraform validate
#       - run: terraform plan -out=tfplan -no-color 2>&1 | tee plan.txt
#       - name: Post plan as PR comment
#         uses: actions/github-script@v7
#         with:
#           script: |
#             const plan = require('fs').readFileSync('infra/plan.txt', 'utf8')
#             github.rest.issues.createComment({
#               ...context.repo,
#               issue_number: context.issue.number,
#               body: '### Terraform Plan\n' + plan
#             })
#
#   apply:
#     needs: plan
#     if: github.ref == 'refs/heads/main'
#     runs-on: ubuntu-latest
#     environment: production     # requires manual approval
#     defaults: { run: { working-directory: infra } }
#     steps:
#       - uses: actions/checkout@v4
#       - uses: hashicorp/setup-terraform@v3
#       - uses: azure/login@v2
#         with:
#           client-id: \$\{\{ secrets.AZURE_CLIENT_ID }}
#           tenant-id: \$\{\{ secrets.AZURE_TENANT_ID }}
#           subscription-id: \$\{\{ secrets.AZURE_SUBSCRIPTION_ID }}
#       - run: terraform init
#       - run: terraform apply -auto-approve tfplan`,
    },
    {
      label: 'Bicep — App Service + SQL',
      language: 'bash',
      code: `# ─── main.bicep ───────────────────────────────────────────────────────────────

# param location string = resourceGroup().location
# param appName string
# param sqlAdminPassword string {
#   @secure()
#   minLength: 12
# }
# param sku string = 'B1'
#
# // App Service Plan
# resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
#   name: '\${appName}-plan'
#   location: location
#   sku: {
#     name: sku
#     tier: 'Basic'
#   }
# }
#
# // Web App
# resource webApp 'Microsoft.Web/sites@2023-01-01' = {
#   name: appName
#   location: location
#   properties: {
#     serverFarmId: appServicePlan.id
#     siteConfig: {
#       netFrameworkVersion: 'v8.0'
#       connectionStrings: [
#         {
#           name: 'DefaultConnection'
#           connectionString: 'Server=\${sqlServer.properties.fullyQualifiedDomainName};Database=\${appName}db;...'
#           type: 'SQLAzure'
#         }
#       ]
#     }
#   }
# }
#
# // SQL Server
# resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
#   name: '\${appName}-sql'
#   location: location
#   properties: {
#     administratorLogin: 'sqladmin'
#     administratorLoginPassword: sqlAdminPassword
#     version: '12.0'
#   }
# }
#
# resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
#   parent: sqlServer
#   name: '\${appName}db'
#   location: location
#   sku: { name: 'Basic', tier: 'Basic' }
# }
#
# output webAppUrl string = 'https://\${webApp.properties.defaultHostName}'

# ─── prod.bicepparam ──────────────────────────────────────────────────────────
# using './main.bicep'
# param appName = 'myapp-prod'
# param sku = 'S1'

# ─── Azure DevOps pipeline step ───────────────────────────────────────────────
# - task: AzureCLI@2
#   displayName: 'Bicep — What-If (plan equivalent)'
#   inputs:
#     azureSubscription: 'my-service-connection'
#     scriptType: bash
#     scriptLocation: inlineScript
#     inlineScript: |
#       az deployment group what-if \\
#         --resource-group myapp-rg \\
#         --template-file infra/main.bicep \\
#         --parameters @infra/prod.bicepparam \\
#         --parameters sqlAdminPassword=\$(SQL_PASSWORD)
#
# - task: AzureCLI@2
#   displayName: 'Bicep — Deploy'
#   inputs:
#     azureSubscription: 'my-service-connection'
#     scriptType: bash
#     scriptLocation: inlineScript
#     inlineScript: |
#       az deployment group create \\
#         --resource-group myapp-rg \\
#         --template-file infra/main.bicep \\
#         --parameters @infra/prod.bicepparam \\
#         --parameters sqlAdminPassword=\$(SQL_PASSWORD) \\
#         --mode Incremental`,
    },
    {
      label: 'Drift Detection & Policy as Code',
      language: 'bash',
      code: `# ─── Drift detection with Terraform ──────────────────────────────────────────

# terraform plan exits non-zero if drift is found
# Use in a scheduled pipeline to alert on out-of-band changes

# GitHub Actions — nightly drift detection
# name: Detect Infrastructure Drift
# on:
#   schedule:
#     - cron: '0 2 * * *'     # 02:00 UTC every night
#
# jobs:
#   drift:
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v4
#       - uses: hashicorp/setup-terraform@v3
#       - uses: azure/login@v2 ...
#       - run: terraform init
#       - name: Detect drift
#         id: plan
#         run: |
#           terraform plan -detailed-exitcode -no-color 2>&1 | tee drift.txt
#           # exit code 2 = changes detected (drift)
#           echo "exitcode=\$?" >> \$GITHUB_OUTPUT
#       - name: Alert on drift
#         if: steps.plan.outputs.exitcode == '2'
#         uses: actions/github-script@v7
#         with:
#           script: |
#             const body = require('fs').readFileSync('drift.txt', 'utf8')
#             github.rest.issues.create({
#               ...context.repo,
#               title: 'Infrastructure drift detected',
#               body: '### Drift Report\n\`\`\`\n' + body + '\n\`\`\`',
#               labels: ['infrastructure', 'drift']
#             })

# ─── Policy as Code with Checkov ─────────────────────────────────────────────

# Checkov: static analysis for Terraform, Bicep, CloudFormation, Kubernetes
# pip install checkov  (or use the GitHub Action)
checkov -d infra/ --framework terraform --check CKV_AZURE_1,CKV_AZURE_35
# CKV_AZURE_1  = storage account requires HTTPS
# CKV_AZURE_35 = storage account public blob access disabled

# Fail on any HIGH or CRITICAL finding
checkov -d infra/ --soft-fail-on LOW,MEDIUM

# GitHub Actions step
# - name: Policy check with Checkov
#   uses: bridgecrewio/checkov-action@v12
#   with:
#     directory: infra/
#     framework: terraform
#     soft_fail: true
#     output_format: sarif
#     output_file_path: checkov.sarif

# ─── Conftest / OPA policy (Terraform plan JSON) ─────────────────────────────

# conftest.rego policy file — deny public S3 buckets
# package main
# deny[msg] {
#   r := input.resource_changes[_]
#   r.type == "aws_s3_bucket"
#   r.change.after.acl == "public-read"
#   msg := sprintf("S3 bucket '%v' must not be public-read", [r.address])
# }

# CI steps
# terraform plan -out=tfplan
# terraform show -json tfplan > plan.json
# conftest test plan.json --policy policies/
# (non-zero exit if any deny rules fire)`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Storing state locally or in Git',
      wrong: `# .gitignore missing *.tfstate
# terraform.tfstate committed to the repo`,
      right: `# .gitignore
*.tfstate
*.tfstate.backup
.terraform/

# backend.tf — remote state
terraform {
  backend "azurerm" {
    resource_group_name  = "tfstate-rg"
    storage_account_name = "tfstateaccount"
    container_name       = "tfstate"
    key                  = "prod.terraform.tfstate"
  }
}`,
      explanation: 'State contains sensitive values (passwords, connection strings) in plaintext, and without remote locking two engineers can corrupt it with concurrent applies. Always use a remote backend with locking and never commit state files to Git.',
    },
    {
      title: 'Applying without a saved plan',
      wrong: `# Applies live changes without a saved plan
terraform apply -auto-approve`,
      right: `# Save the plan, review it, then apply the exact same plan
terraform plan -out=tfplan
# (review / PR comment)
terraform apply tfplan`,
      explanation: 'terraform apply without a plan file re-plans at apply time — the infrastructure may have changed since you ran plan, and you could apply different changes than you reviewed. Save the plan with -out, post it for review, then apply the saved plan.',
    },
    {
      title: 'Hardcoding secrets in Terraform variables',
      wrong: `# terraform.tfvars (committed to Git!)
db_password = "mysecretpassword123"`,
      right: `# Reference from Key Vault / environment variable
variable "db_password" {
  type      = string
  sensitive = true
}
# Pass at runtime:
# TF_VAR_db_password=$(az keyvault secret show \\
#   --vault-name myvault --name db-password --query value -o tsv) \\
#   terraform apply`,
      explanation: 'Terraform variable files are often committed to Git. Mark sensitive variables with sensitive = true and inject their values from a secrets manager (Key Vault, AWS Secrets Manager, HashiCorp Vault) at pipeline runtime — never hardcode them in files.',
    },
    {
      title: 'Applying IaC from feature branches',
      wrong: `# CI pipeline: apply on every push to any branch
on:
  push:
    branches: ['**']
jobs:
  apply:
    steps:
      - run: terraform apply -auto-approve`,
      right: `# Plan on PR; apply only on merge to main
on:
  pull_request:
    jobs: [plan]   # show plan, no apply
  push:
    branches: [main]
    jobs: [apply]  # apply with manual approval gate`,
      explanation: 'Applying infrastructure from feature branches creates resource conflicts between branches and bypasses code review. Only the main branch should trigger applies, and production applies should require a manual approval gate.',
    },
    {
      title: 'No resource tags on cloud resources',
      wrong: `resource "azurerm_kubernetes_cluster" "aks" {
  name     = "myapp-aks"
  location = var.location
  # No tags
}`,
      right: `locals {
  common_tags = {
    environment = var.environment
    team        = "platform"
    cost_centre = "eng-prod"
    managed_by  = "terraform"
  }
}
resource "azurerm_kubernetes_cluster" "aks" {
  name     = "myapp-aks"
  location = var.location
  tags     = local.common_tags
}`,
      explanation: 'Untagged cloud resources become impossible to attribute in cost reports, audit findings, or automated cleanup jobs. Define common_tags in a local block and apply them to every resource. Many organisations enforce this with Checkov or Sentinel policies that fail the pipeline if tags are missing.',
    },
  ];

  challenge: Challenge = {
    title: 'Terraform Plan Summariser',
    language: 'typescript',
    description: `Parse a Terraform plan summary string and return a structured change report.

Terraform plan output ends with lines like:
  "Plan: 3 to add, 1 to change, 0 to destroy."
  "No changes. Infrastructure is up-to-date."

Given a plan output string, return:
{ toAdd: number; toChange: number; toDestroy: number; hasChanges: boolean; riskLevel: 'none' | 'low' | 'medium' | 'high' }

Risk level rules:
- 'none': no changes
- 'low': only additions (toDestroy === 0 && toChange === 0)
- 'medium': additions + changes but no destructions
- 'high': any destructions (toDestroy > 0)`,
    hints: [
      'Use regex to match "Plan: N to add, N to change, N to destroy." pattern.',
      'Check for "No changes" as a separate case — return all zeros.',
      'Determine riskLevel with a chain of if/else based on toDestroy and toChange.',
      'parseInt() converts captured regex groups to numbers.',
    ],
    starterCode: `interface PlanReport {
  toAdd: number;
  toChange: number;
  toDestroy: number;
  hasChanges: boolean;
  riskLevel: 'none' | 'low' | 'medium' | 'high';
}

function parseTerraformPlan(planOutput: string): PlanReport {
  // TODO: parse the plan output and return the report
  return { toAdd: 0, toChange: 0, toDestroy: 0, hasChanges: false, riskLevel: 'none' };
}

// Tests
console.log(parseTerraformPlan("Plan: 3 to add, 1 to change, 0 to destroy."));
// { toAdd: 3, toChange: 1, toDestroy: 0, hasChanges: true, riskLevel: 'medium' }

console.log(parseTerraformPlan("Plan: 5 to add, 0 to change, 0 to destroy."));
// { toAdd: 5, toChange: 0, toDestroy: 0, hasChanges: true, riskLevel: 'low' }

console.log(parseTerraformPlan("Plan: 2 to add, 1 to change, 1 to destroy."));
// { toAdd: 2, toChange: 1, toDestroy: 1, hasChanges: true, riskLevel: 'high' }

console.log(parseTerraformPlan("No changes. Infrastructure is up-to-date."));
// { toAdd: 0, toChange: 0, toDestroy: 0, hasChanges: false, riskLevel: 'none' }`,
    solution: `interface PlanReport {
  toAdd: number;
  toChange: number;
  toDestroy: number;
  hasChanges: boolean;
  riskLevel: 'none' | 'low' | 'medium' | 'high';
}

function parseTerraformPlan(planOutput: string): PlanReport {
  if (/No changes/i.test(planOutput)) {
    return { toAdd: 0, toChange: 0, toDestroy: 0, hasChanges: false, riskLevel: 'none' };
  }

  const match = planOutput.match(/Plan:\\s*(\\d+) to add,\\s*(\\d+) to change,\\s*(\\d+) to destroy/);
  if (!match) {
    return { toAdd: 0, toChange: 0, toDestroy: 0, hasChanges: false, riskLevel: 'none' };
  }

  const toAdd = parseInt(match[1], 10);
  const toChange = parseInt(match[2], 10);
  const toDestroy = parseInt(match[3], 10);
  const hasChanges = toAdd + toChange + toDestroy > 0;

  let riskLevel: PlanReport['riskLevel'];
  if (!hasChanges) riskLevel = 'none';
  else if (toDestroy > 0) riskLevel = 'high';
  else if (toChange > 0) riskLevel = 'medium';
  else riskLevel = 'low';

  return { toAdd, toChange, toDestroy, hasChanges, riskLevel };
}

console.log(parseTerraformPlan("Plan: 3 to add, 1 to change, 0 to destroy."));
// { toAdd: 3, toChange: 1, toDestroy: 0, hasChanges: true, riskLevel: 'medium' }

console.log(parseTerraformPlan("Plan: 5 to add, 0 to change, 0 to destroy."));
// { toAdd: 5, toChange: 0, toDestroy: 0, hasChanges: true, riskLevel: 'low' }

console.log(parseTerraformPlan("Plan: 2 to add, 1 to change, 1 to destroy."));
// { toAdd: 2, toChange: 1, toDestroy: 1, hasChanges: true, riskLevel: 'high' }

console.log(parseTerraformPlan("No changes. Infrastructure is up-to-date."));
// { toAdd: 0, toChange: 0, toDestroy: 0, hasChanges: false, riskLevel: 'none' }`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary purpose of the Terraform state file?',
      options: [
        'It stores the HCL source code for backup',
        'It maps Terraform resource addresses to real cloud resource IDs so Terraform can manage existing infrastructure',
        'It caches provider API responses to speed up plans',
        'It stores encrypted secrets used by providers',
      ],
      answer: 1,
      explanation: 'The state file is Terraform\'s database of what it manages. It maps each resource address (e.g. azurerm_kubernetes_cluster.aks) to the real cloud resource ID. Without state, Terraform cannot detect drift, update, or destroy existing resources — it would try to recreate everything.',
    },
    {
      q: 'Why should terraform apply always use a saved plan file in production?',
      options: [
        'Plan files compress infrastructure state to save storage',
        'Without a plan file, apply requires an internet connection',
        'The plan file locks the exact changes to apply — a re-plan at apply time may produce different changes if infrastructure changed since review',
        'Plan files enable concurrent applies across multiple pipelines',
      ],
      answer: 2,
      explanation: 'terraform plan -out=tfplan captures the changes at a point in time. terraform apply tfplan applies exactly those changes without re-planning. If you run terraform apply without a plan file, it re-plans immediately before applying — the infrastructure may have changed in between, producing a different (unreviewed) set of changes.',
    },
    {
      q: 'What does terraform plan -detailed-exitcode return when drift is detected?',
      options: [
        'Exit code 0 — it always succeeds even with changes',
        'Exit code 1 — general error',
        'Exit code 2 — there are changes to apply (drift detected)',
        'Exit code 3 — the state is corrupted',
      ],
      answer: 2,
      explanation: 'With -detailed-exitcode: exit 0 = no changes; exit 1 = error; exit 2 = changes present. Scheduled pipelines use this to detect drift — if the exit code is 2, someone manually changed infrastructure outside of Terraform and an alert or automatic remediation should fire.',
    },
    {
      q: 'What is the key architectural difference between Terraform and Bicep?',
      options: [
        'Terraform uses YAML; Bicep uses JSON',
        'Terraform is multi-cloud and uses providers; Bicep is Azure-only and compiles to ARM JSON',
        'Bicep requires a Kubernetes cluster to run; Terraform does not',
        'Terraform manages state; Bicep manages configuration only',
      ],
      answer: 1,
      explanation: 'Terraform is cloud-agnostic — its provider ecosystem covers AWS, Azure, GCP, and hundreds of SaaS tools. Bicep is Azure-specific, compiling to ARM JSON for native Azure Resource Manager deployment. Bicep has no state file; ARM tracks deployment history internally. Choose Terraform for multi-cloud; Bicep for Azure-first teams who prefer native tooling.',
    },
    {
      q: 'What does `terraform import` do?',
      options: [
        'Downloads a module from the Terraform Registry',
        'Migrates state from one backend to another',
        'Brings an existing cloud resource under Terraform management by writing its ID into the state file',
        'Imports variable values from a .tfvars file',
      ],
      answer: 2,
      explanation: 'terraform import <resource_address> <resource_id> associates an existing cloud resource with a Terraform resource block without destroying and recreating it. After import, you must write the matching HCL resource block so that future plans produce no changes. It\'s used to adopt resources that were created manually or by other tools.',
    },
    {
      q: 'What is configuration drift in IaC and why is it a problem?',
      options: [
        'When Terraform state files become out of sync with provider APIs',
        'When the actual infrastructure state diverges from the IaC definition — usually from manual console changes or failed partial applies',
        'When different team members use different IaC tools',
        'When cloud provider APIs change without notice'],
      answer: 1,
      explanation: 'Configuration drift occurs when infrastructure is modified outside the IaC tool (manual console changes, direct CLI commands, failed partial applies). The IaC tool then has a stale view of reality. Consequences: future applies may fail or produce unexpected changes; you cannot trust the IaC to reflect real state. Prevention: enforce all changes through IaC (IAM SCPs blocking console writes), regular drift detection (`terraform plan` in CI showing unexpected changes), and immutable infrastructure (replace vs modify).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between terraform taint and terraform destroy -target?',
      a: 'terraform taint (deprecated since v0.15, replaced by terraform apply -replace) marks a resource for recreation on the next apply — useful when a resource is broken but Terraform sees it as healthy. terraform destroy -target removes a specific resource completely. Use -replace for in-place recreation (same resource address, new physical resource); use destroy -target only when you want the resource gone. Both should be used sparingly in production.',
    },
    {
      q: 'How do Terraform workspaces work and when should you use them?',
      a: 'Workspaces create isolated state namespaces within one Terraform configuration. terraform workspace new staging creates a new state file at env:/staging/terraform.tfstate. They\'re useful for spinning up identical environments (dev/staging/prod) without duplicating code. However, for production-grade multi-environment setups many teams prefer separate directories per environment (or separate repos/modules) to avoid accidental cross-environment applies. Workspaces are best for ephemeral environments (PRs, experiments).',
    },
    {
      q: 'What is the Bicep equivalent of terraform plan?',
      a: 'az deployment group what-if --resource-group rg --template-file main.bicep shows what ARM would create, modify, or delete without applying changes. It uses ARM\'s change analysis API and produces colour-coded output (green = create, yellow = modify, red = delete). Unlike terraform plan, what-if is not saved as a binary plan — you re-run it at deploy time. The equivalent of -detailed-exitcode is --result-format FullResourcePayloads for structured output.',
    },
    {
      q: 'How do you share outputs between two Terraform configurations?',
      a: 'Use terraform_remote_state: configure it as a data source pointing to another configuration\'s remote backend. Then access outputs via data.terraform_remote_state.networking.outputs.subnet_id. This avoids hardcoding resource IDs across configurations. Alternatively, publish outputs to a centralised secret store (AWS SSM Parameter Store, Azure Key Vault, Vault) and read them as data sources — this decouples configurations without state file access.',
    },
    {
      q: 'What is Pulumi and how does it differ from Terraform?',
      a: 'Pulumi is an IaC tool where infrastructure is defined using real programming languages (TypeScript, Python, Go, C#, Java) rather than a DSL. You get full language features: loops, conditionals, functions, type checking, IDE autocomplete. Pulumi uses a state backend similar to Terraform. It\'s a strong choice when your team is already proficient in a language and the infrastructure logic is complex. Terraform\'s HCL has a gentler learning curve for simple configurations; Pulumi shines when you need real abstraction and code reuse.',
    },
    {
      q: 'When should you use Terraform modules and how do you version them?',
      a: 'Use Terraform modules when: (1) You repeat the same infrastructure pattern across environments or services (VPC, EKS cluster, RDS instance). A module encapsulates the pattern with variables. (2) You want to enforce standards — a "blessed" module for your organisation\'s networking pattern ensures consistent security group rules, tags, and naming conventions. (3) You want to abstract complexity — consumers call module "vpc" with simple inputs (cidr, region) without knowing the implementation details. Module versioning: host modules in a separate Git repo, tag with SemVer (v1.2.0). Reference with source = "git::https://github.com/org/modules.git//vpc?ref=v1.2.0". Pin to specific versions — never use ?ref=main which is a moving target. Use Terraform Registry for public modules (registry.terraform.io).',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Define infrastructure as versioned, reviewable code — Terraform for multi-cloud, Bicep for Azure — with remote state, plan gates, and drift detection.',
    mustKnow: [
      'Terraform workflow: init → validate → plan -out=tfplan → (review) → apply tfplan — never apply without a saved plan in production',
      'Remote backend (S3+DynamoDB, Azure Blob, Terraform Cloud): centralised state with locking — mandatory in teams',
      'terraform plan -detailed-exitcode: exit 2 = drift detected; use in scheduled pipelines to alert on out-of-band changes',
      'Sensitive variables: mark sensitive=true, inject from secrets manager at runtime — never commit to .tfvars files',
      'Bicep: az deployment group what-if (plan) → az deployment group create (apply); idempotent incremental deploys',
      'Apply only on merge to main; plan on every PR; post plan diff as PR comment before approval',
      'Policy as Code: Checkov, Sentinel, Conftest/OPA enforce rules (no public buckets, required tags) before apply',
    ],
    interviewFocus: [
      'What is Terraform state and why must it be stored remotely with locking?',
      'Walk through a safe IaC CI/CD pipeline: when to plan, when to apply, where are the gates?',
      'How do you detect infrastructure drift? What happens after you detect it?',
      'What are the trade-offs between Terraform (multi-cloud DSL) and Bicep (Azure-native DSL)?',
    ],
  };
}
