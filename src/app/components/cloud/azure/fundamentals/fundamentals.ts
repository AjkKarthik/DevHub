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
  selector: 'app-azure-fundamentals',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './fundamentals.html',
  styleUrl: './fundamentals.scss'
})
export class AzureFundamentals {

  quickRef: QuickRefItem[] = [
    { name: 'Region', type: 'type', desc: 'A geographical area containing one or more Azure datacenters — resources are deployed to a specific region.' },
    { name: 'Availability Zone', type: 'type', desc: 'Physically separate locations within a region with independent power, cooling and networking for HA.' },
    { name: 'Subscription', type: 'type', desc: 'A logical account that defines the billing boundary and access control scope for Azure resources.' },
    { name: 'Resource Group', type: 'type', desc: 'A container that holds related resources sharing the same lifecycle, permissions and tags.' },
    { name: 'Azure Portal', type: 'syntax', desc: 'The web-based console at portal.azure.com for managing Azure services visually.' },
    { name: 'Azure CLI', type: 'syntax', desc: 'Cross-platform command-line interface (az) for scripting and automating Azure operations.' },
    { name: 'Cloud Shell', type: 'syntax', desc: 'Browser-based shell (Bash or PowerShell) with Azure CLI pre-installed, persisted in a storage account.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Global Infrastructure',
      points: [
        'Azure operates 60+ regions worldwide grouped into geographies that respect data-residency and compliance boundaries.',
        'Each region is a set of datacenters connected by a low-latency network. Paired regions (e.g. East US / West US) replicate data for disaster recovery.',
        'Availability Zones (AZs) are physically separate buildings within a region — each has its own power, cooling and networking. Services spread across 3 AZs tolerate a single datacenter failure.',
        'Not all regions have AZs; check the Azure docs for the latest list. Zone-redundant services automatically replicate across all AZs in a region.',
      ]
    },
    {
      heading: 'Subscription & Management Hierarchy',
      points: [
        'Management Groups → Subscriptions → Resource Groups → Resources — each level inherits RBAC policies and Azure Policy from the level above.',
        'A Tenant is the Microsoft Entra ID directory. A single tenant can contain multiple subscriptions (e.g. Dev, Staging, Production).',
        'Subscriptions define the billing boundary — costs roll up per subscription. They also define quota limits (vCPU counts, etc.).',
        'Management Groups sit above subscriptions: apply a policy at the Management Group level and it cascades to every subscription beneath it.',
      ]
    },
    {
      heading: 'Resource Groups',
      points: [
        'Every resource must belong to exactly one Resource Group in one specific region (the group\'s metadata region).',
        'Resources inside a group can span different regions — the RG location stores metadata only.',
        'Tags applied to a Resource Group do NOT automatically propagate to child resources; use Azure Policy to enforce inheritance.',
        'Deleting a Resource Group deletes all contained resources — use locks (CanNotDelete / ReadOnly) to prevent accidental removal.',
        'RBAC granted at the RG level applies to all resources inside it — the principal of least privilege.',
      ]
    },
    {
      heading: 'Pricing & Cost Management',
      points: [
        'Pay-as-you-go: pay only for what you use, billed per second/minute/hour. Best for variable workloads.',
        'Reserved Instances (1 or 3 year): up to 72% discount on compute in exchange for commitment. Applied automatically to matching VMs.',
        'Azure Savings Plans: commit to a $ amount per hour of compute and get discounts across regions/instance types — more flexible than RIs.',
        'Free Tier: 12 months of popular free services + $200 credit for 30 days to explore any service.',
        'Cost Management + Billing (portal.azure.com): set budgets, create alerts, and use Cost Analysis to break down spending by resource, tag or service.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Account & Subscription',
      language: 'bash',
      code: `# Login
az login

# List subscriptions
az account list --output table

# Set active subscription
az account set --subscription "My Subscription"

# Show current subscription details
az account show`
    },
    {
      label: 'Resource Groups',
      language: 'bash',
      code: `# Create a resource group
az group create --name my-rg --location eastus

# List all resource groups
az group list --output table

# Show details of a specific group
az group show --name my-rg

# Delete a resource group (and ALL resources inside)
az group delete --name my-rg --yes --no-wait`
    },
    {
      label: 'Cloud Shell Setup',
      language: 'bash',
      code: `# Cloud Shell auto-authenticates — no az login needed
# Check current CLI version
az version

# List all Azure regions
az account list-locations --output table

# Check which resources are in a group
az resource list --resource-group my-rg --output table`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Missing --resource-group on create commands',
      wrong: 'az vm create --name MyVM --image Ubuntu2204',
      right: 'az vm create --resource-group my-rg --name MyVM --image Ubuntu2204',
      explanation: 'Nearly every az create command requires --resource-group. Omitting it throws an error or uses an unexpected default group.'
    },
    {
      title: 'Confusing region (where resources live) with RG location (metadata only)',
      wrong: 'az group create --name my-rg --location eastus  # assumes all resources deploy to East US',
      right: 'az vm create --resource-group my-rg --location westus2  # resource picks its own region',
      explanation: 'The resource group location stores ARM metadata. Each resource declares its own location independently — they do not have to match the RG location.'
    },
    {
      title: 'Hardcoding credentials in scripts',
      wrong: "const connStr = 'Server=mydb.database.windows.net;Password=P@ss123';",
      right: "const connStr = process.env.AZURE_SQL_CONNECTION_STRING;",
      explanation: 'Credentials in code get checked into source control. Always use environment variables, Azure Key Vault, or Managed Identity.'
    },
    {
      title: 'Deleting a Resource Group without a lock and losing everything',
      wrong: 'az group delete --name prod-rg --yes',
      right: 'az lock create --name no-delete --lock-type CanNotDelete --resource-group prod-rg',
      explanation: 'One stray delete command wipes all resources in the group. Put a CanNotDelete lock on production resource groups to prevent accidental deletion.'
    },
  ];

  challenge: Challenge = {
    title: 'Parse Azure Resource ID',
    language: 'typescript',
    description: 'Azure resources have a canonical ID like:\n/subscriptions/{subId}/resourceGroups/{rgName}/providers/Microsoft.Compute/virtualMachines/{vmName}\n\nWrite a function parseResourceId(id: string) that returns an object with subscriptionId, resourceGroup, provider, resourceType and resourceName.',
    hints: [
      "Split the ID string by '/' and filter out empty segments",
      'subscriptions is at index 0, the subId at index 1 after filtering',
      'resourceGroups is at index 2, rgName at index 3',
      'providers is at index 4, provider namespace at index 5, resource type at 6, resource name at 7',
    ],
    starterCode: `export function parseResourceId(id: string) {
  // split and filter empty strings from leading '/'
  const parts = id.split('/').filter(Boolean);
  // parts: ['subscriptions', subId, 'resourceGroups', rgName,
  //         'providers', provider, resourceType, resourceName]
  return {
    subscriptionId: '',
    resourceGroup: '',
    provider: '',
    resourceType: '',
    resourceName: '',
  };
}`,
    solution: `export function parseResourceId(id: string) {
  const parts = id.split('/').filter(Boolean);
  return {
    subscriptionId: parts[1],
    resourceGroup: parts[3],
    provider: parts[5],
    resourceType: parts[6],
    resourceName: parts[7],
  };
}

// Test
const id = '/subscriptions/abc-123/resourceGroups/my-rg/providers/Microsoft.Compute/virtualMachines/my-vm';
console.log(parseResourceId(id));
// { subscriptionId: 'abc-123', resourceGroup: 'my-rg', provider: 'Microsoft.Compute',
//   resourceType: 'virtualMachines', resourceName: 'my-vm' }`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does an Azure Availability Zone provide?',
      options: ['Geographic separation across continents', 'Physical isolation within a region with independent power and networking', 'Separate billing boundaries', 'A global CDN endpoint'],
      answer: 1,
      explanation: 'Availability Zones are physically separate buildings within one region, each with independent power, cooling and networking. Spreading a workload across 3 AZs protects against single-datacenter failure.'
    },
    {
      q: 'Which command sets the active Azure subscription in the CLI?',
      options: ['az account list', 'az account set --subscription "Name"', 'az login --subscription "Name"', 'az subscription activate'],
      answer: 1,
      explanation: '"az account set --subscription" switches the current CLI context to the specified subscription. After this, all subsequent commands target that subscription.'
    },
    {
      q: 'If you delete a Resource Group, what happens to the resources inside it?',
      options: ['They move to the default Resource Group', 'They are permanently deleted', 'They become orphaned but still run', 'They are archived for 30 days'],
      answer: 1,
      explanation: 'Deleting a Resource Group is a cascading delete — every resource it contains is permanently removed. Always set a CanNotDelete lock on production groups.'
    },
    {
      q: 'A Resource Group is created in East US. Can a VM inside that group be deployed to West Europe?',
      options: ['No — resources must match the RG region', 'Yes — resources can be in any region regardless of RG location', 'Only with a special cross-region subscription', 'Only Blob Storage can span regions'],
      answer: 1,
      explanation: 'The Resource Group location stores ARM metadata only. Each resource inside the group declares its own location independently and can be in any region.'
    },
    {
      q: 'Which Azure pricing model offers up to 72% savings by committing to 1 or 3 years of specific VM usage?',
      options: ['Pay-as-you-go', 'Reserved Instances', 'Azure Savings Plans', 'Spot Instances'],
      answer: 1,
      explanation: 'Reserved Instances (RIs) give up to 72% off pay-as-you-go prices in exchange for a 1 or 3-year commitment on specific VM families in a specific region.'
    },
    {
      q: 'How do Azure Availability Zones differ from Azure Regions?',
      options: [
        'Regions are logical groupings; Availability Zones are separate Azure accounts',
        'Availability Zones are physically separate datacentres within a single region, providing intra-region fault isolation',
        'Availability Zones span multiple regions for geo-redundancy',
        'A region contains one Availability Zone; zones span regions',
      ],
      answer: 1,
      explanation: 'An Azure Region is a geographic area with multiple datacentres. Availability Zones are physically separate locations within a region with independent power, cooling, and networking enabling 99.99% VM SLA.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between an Azure Region and an Availability Zone?',
      a: 'A Region is a geographic area (e.g. "East US") that contains one or more datacenters. An Availability Zone is a physically separate building within that region — with its own power, cooling and network — used to protect against single-datacenter failure. Not all regions have AZs.'
    },
    {
      q: 'Can a resource belong to multiple Resource Groups?',
      a: 'No. Every Azure resource belongs to exactly one Resource Group at a time. You can move resources between groups using az resource move, but a resource can never simultaneously be in two groups.'
    },
    {
      q: 'What is the difference between a Subscription and a Tenant?',
      a: 'A Tenant is the Microsoft Entra ID (formerly Azure AD) directory that represents your organisation — it handles identity. A Subscription is a billing and resource-management container inside a tenant. One tenant can have many subscriptions (e.g. Dev, Test, Prod), each with separate billing and quotas.'
    },
    {
      q: 'When should you use Azure Cloud Shell vs a local Azure CLI install?',
      a: 'Cloud Shell is ideal for quick tasks, demos, and environments where you cannot install software — it auto-authenticates, has no setup, and persists files in a storage account. A local CLI install is better for scripting in CI/CD pipelines, working offline, or integrating with local tools (git, IDEs). Both run the same az commands.'
    },
    {
      q: 'What is a Management Group and when do you need one?',
      a: 'Management Groups sit above subscriptions in the hierarchy. They let you apply Azure Policy, RBAC and compliance rules across multiple subscriptions in one operation. You need them in enterprise setups with many subscriptions — for example, applying a "no public IPs" policy across all 20 production subscriptions at once instead of configuring each subscription individually.'
    },
    {
      q: 'What is the Azure Resource Manager (ARM) and why is it important?',
      a: 'ARM is the deployment and management layer for Azure — every Azure portal click, CLI command, or SDK call goes through ARM. It provides consistent auth via Entra ID, RBAC, resource groups, tagging, locks, and idempotent declarative deployments (ARM templates/Bicep). Understanding ARM is fundamental to IaC and automation.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Azure organises resources in a hierarchy: Tenants → Management Groups → Subscriptions → Resource Groups → Resources, all deployed into Regions with optional Availability Zone redundancy.',
    mustKnow: [
      'Regions are geographic locations; Availability Zones are physically separate buildings within a region for HA',
      'Tenant = Entra ID directory (identity); Subscription = billing & quota boundary inside a tenant',
      'Every resource belongs to exactly one Resource Group — deleting the group deletes everything inside',
      'RG location stores metadata only — resources inside can be in any region',
      'az account set --subscription to switch CLI context; az group create to provision a group',
      'Pay-as-you-go vs Reserved Instances (72% off, 1-3yr commit) vs Savings Plans (flexible, hourly commit)',
    ],
    interviewFocus: [
      'Explain Availability Zones and how they differ from Region Pairs',
      'Describe the full Azure resource hierarchy and where each level applies governance',
      'When would you use a lock on a Resource Group and what types exist?',
      'Compare Reserved Instances vs Azure Savings Plans for cost optimisation',
    ],
  };
}
