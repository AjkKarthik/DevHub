import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic { title: string; route: string; badge: string; description: string; keyPoints: string[]; available: boolean; }

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'HCL': 'hcl', 'State': 'state',
  'Modules': 'modules', 'Providers': 'providers', 'Workflows': 'workflows',
  'Testing': 'testing', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'HCL', 'State', 'Modules', 'Providers', 'Workflows', 'Testing', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'Terraform Fundamentals', route: '/terraform', badge: 'Foundations', description: 'What Terraform is — declarative IaC, the plan/apply cycle, and how it manages cloud resources.', keyPoints: ['Declarative desired state', 'terraform init/plan/apply/destroy', 'Provider plugin architecture', 'Resource and data sources', 'HCL configuration language'], available: false },
  { title: 'HCL Syntax', route: '/terraform', badge: 'HCL', description: 'Blocks, arguments, expressions, string templates, locals, and Terraform HCL language features.', keyPoints: ['resource, variable, output blocks', 'String interpolation \${var.x}', 'Local values (locals {})', 'Conditional expressions', 'for expressions'], available: false },
  { title: 'Variables & Outputs', route: '/terraform', badge: 'HCL', description: 'Input variables with type constraints, validation rules, defaults, sensitive flag, and output values.', keyPoints: ['variable type constraints', 'validation blocks', 'sensitive = true for secrets', 'output values', 'tfvars and environment vars'], available: false },
  { title: 'Resource & Data Sources', route: '/terraform', badge: 'HCL', description: 'Declare cloud resources, use data sources to read existing infrastructure, and resource arguments.', keyPoints: ['resource "aws_instance" "web"', 'data "aws_vpc" "existing"', 'Meta-arguments (count, for_each)', 'depends_on explicit dependency', 'lifecycle rules'], available: false },
  { title: 'Terraform State', route: '/terraform', badge: 'State', description: 'State file purpose, remote backends (S3, Azure Blob, Terraform Cloud), and state locking.', keyPoints: ['terraform.tfstate file', 'Remote backend configuration', 'State locking with DynamoDB', 'terraform state mv/rm', 'State import'], available: false },
  { title: 'Remote Backends', route: '/terraform', badge: 'State', description: 'Configure S3+DynamoDB, Azure Blob, or Terraform Cloud backends for team-safe remote state.', keyPoints: ['S3 backend with DynamoDB lock', 'Azure Blob backend', 'Terraform Cloud workspace', 'Partial configuration with -backend-config', 'State encryption'], available: false },
  { title: 'Terraform Modules', route: '/terraform', badge: 'Modules', description: 'Reusable modules — local, Git-sourced, and registry modules, versioning, and module composition.', keyPoints: ['module "network" { source = }', 'Input and output variables', 'Terraform Registry modules', 'Module versioning', 'Nested module composition'], available: false },
  { title: 'Module Best Practices', route: '/terraform', badge: 'Modules', description: 'Module design principles — single responsibility, published interface, and root vs child modules.', keyPoints: ['Root module vs child modules', 'Minimal public interface', 'README and examples', 'version = ">= 5.0" constraints', 'Avoid hard-coded values'], available: false },
  { title: 'AWS Provider', route: '/terraform', badge: 'Providers', description: 'Provision AWS resources — EC2, VPC, S3, IAM, RDS, and Lambda with the official AWS provider.', keyPoints: ['provider "aws" region', 'aws_vpc and subnets', 'aws_instance EC2', 'aws_iam_role and policies', 'aws_s3_bucket versioning'], available: false },
  { title: 'Azure Provider', route: '/terraform', badge: 'Providers', description: 'Provision Azure resources — resource groups, VNets, VMs, AKS, and App Service with AzureRM.', keyPoints: ['provider "azurerm" features', 'azurerm_resource_group', 'azurerm_virtual_network', 'azurerm_kubernetes_cluster', 'azurerm_app_service'], available: false },
  { title: 'Terraform Workflows & CI/CD', route: '/terraform', badge: 'Workflows', description: 'Automate Terraform in pipelines — plan PR comments, apply on merge, and drift detection.', keyPoints: ['terraform plan in PR', 'Plan output as PR comment', 'terraform apply on merge', 'Atlantis pull request workflow', 'Drift detection with CRON'], available: false },
  { title: 'Workspaces', route: '/terraform', badge: 'Workflows', description: 'Manage multiple environments (dev/staging/prod) with Terraform workspaces or directory-per-env.', keyPoints: ['terraform workspace new dev', 'terraform.workspace in HCL', 'Workspace per environment', 'Directory-based alternative', 'Workspace limitations'], available: false },
  { title: 'Terratest', route: '/terraform', badge: 'Testing', description: 'Test Terraform modules with Terratest — deploy real infrastructure, assert outputs, destroy.', keyPoints: ['Go-based Terratest', 'terraform.InitAndApply', 'Assert resource outputs', 'Defer terraform.Destroy', 'Test in isolated accounts'], available: false },
  { title: 'Terraform Security', route: '/terraform', badge: 'Reference', description: 'tfsec, Checkov, Snyk IaC scanning, preventing secrets in state, and least-privilege providers.', keyPoints: ['tfsec static analysis', 'Checkov policy as code', 'Sensitive outputs redaction', 'Never store secrets in tfvars', 'OIDC federation for providers'], available: false },
  { title: 'Terraform Cloud & Enterprise', route: '/terraform', badge: 'Reference', description: 'Terraform Cloud runs, policy as code with Sentinel, private registry, and team permissions.', keyPoints: ['Remote plan/apply runs', 'Sentinel policy enforcement', 'Private module registry', 'Variable sets across workspaces', 'Audit log and SAML SSO'], available: false },
  { title: 'GCP Provider', route: '/terraform', badge: 'Providers', description: 'Provision GCP resources — VPCs, GKE, Cloud Run, Cloud SQL, and IAM with the google provider.', keyPoints: ['provider "google" project and region', 'google_container_cluster for GKE', 'google_cloud_run_service serverless', 'google_sql_database_instance', 'IAM binding and member resources'], available: false },
  { title: 'Terraform Functions & Built-ins', route: '/terraform', badge: 'HCL', description: 'String, collection, numeric, and encoding functions — toset, flatten, lookup, merge, yamldecode.', keyPoints: ['toset(), tolist(), tomap() type conversions', 'flatten(): flatten nested lists into one list', 'lookup(map, key, default): safe map access', 'merge(a, b): combine maps, b overrides a', 'yamldecode / jsondecode for config files'], available: false },
  { title: 'Import Existing Resources', route: '/terraform', badge: 'Workflows', description: 'Bring existing cloud infrastructure under Terraform management — terraform import, import blocks.', keyPoints: ['terraform import resource.id: legacy CLI import', 'import {} block (TF 1.5+): declarative import', 'Generate config with terraform plan -generate-config-out', 'Review state after import for drift', 'Use tagging conventions to track managed resources'], available: false },
  { title: 'Pulumi Comparison', route: '/terraform', badge: 'Reference', description: 'When to choose Pulumi over Terraform — imperative programming vs HCL, and migration paths.', keyPoints: ['Pulumi: TypeScript/Python/Go programs vs HCL DSL', 'Pulumi has native loops and conditionals vs HCL for_each', 'Same providers under the hood (Terraform bridge)', 'Pulumi state in Pulumi Cloud or S3 backend', 'Migration: Terraform state can be imported to Pulumi'], available: false },
  { title: 'Terraform Cheat Sheet', route: '/terraform', badge: 'Reference', description: 'Essential terraform commands, HCL syntax reference, variable types, and meta-arguments at a glance.', keyPoints: ['Workflow: init → validate → plan → apply → destroy', 'Meta-arguments: count, for_each, depends_on, lifecycle', 'Variable types: string, number, bool, list, map, set, object, tuple'], available: false },
  { title: 'Terraform Interview Prep', route: '/terraform', badge: 'Reference', description: '30+ Terraform interview questions — state, modules, providers, workspaces, and CI/CD.', keyPoints: ['What is Terraform state and why does it need to be remote?', 'Explain the difference between count and for_each', 'How do you manage secrets in Terraform without leaking them?'], available: false },
];

@Component({ selector: 'app-terraform-home', standalone: true, imports: [RouterLink], templateUrl: './home.html', styleUrl: './home.scss' })
export class TerraformHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
