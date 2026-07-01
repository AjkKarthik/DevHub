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
  selector: 'app-azure-cost-management',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './cost-management.html',
  styleUrl: './cost-management.scss'
})
export class AzureCostManagement {

  quickRef: QuickRefItem[] = [
    { name: 'Cost Analysis', type: 'type', desc: 'Azure portal view showing spending by service, resource group, tag, or time period. Drill down into charges and export to CSV. Available under each subscription or management group.' },
    { name: 'Budget', type: 'type', desc: 'A spending threshold (monthly/quarterly/annual) that triggers email or action-group alerts when actual or forecasted cost crosses defined percentages (e.g., 80%, 100%, 120%).' },
    { name: 'Reserved Instances (RI)', type: 'type', desc: '1- or 3-year commitment to a specific VM size/family in a region. Discount: up to 72% vs pay-as-you-go. Flexibility options: Instance Size Flexibility lets RIs cover similar sizes within the same VM series.' },
    { name: 'Azure Savings Plans', type: 'type', desc: 'Hourly spend commitment (e.g., $5/hr) rather than capacity commitment. Applies across regions, VM families, and eligible services. Simpler than RIs but slightly lower discount (~65%).' },
    { name: 'Azure Advisor', type: 'type', desc: 'Cloud advisor that analyses usage patterns and recommends right-sizing, RI purchases, idle resource shutdown, and cost anomaly alerts. Free service — check it regularly.' },
    { name: 'Cost Allocation Tags', type: 'type', desc: 'Key-value metadata on resources (e.g., Environment: prod, Team: platform). Required for cost attribution by team/project. Tags must be applied consistently at resource creation.' },
    { name: 'Azure Pricing Calculator', type: 'type', desc: 'Public tool (azure.microsoft.com/pricing/calculator) to estimate monthly costs before deploying. Configure services, regions, and tiers to compare options.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Azure Cost Management Architecture',
      points: [
        'Azure Cost Management + Billing is the native cost observability tool. It provides: Cost Analysis (spending dashboards), Budgets (spend alerts), Cost Exports (scheduled CSV to Storage), Recommendations (Advisor integration), and Access control (RBAC — cost readers, billing readers).',
        'Scope hierarchy for cost data: Billing Account → Management Group → Subscription → Resource Group → Resource. Cost Management data is available at every scope — choose the highest scope where you have access for the broadest view. Management groups aggregate all subscriptions below them.',
        'Cost data latency: Azure usage data appears in Cost Management with a delay of 8–24 hours for most services. Some services (e.g., DNS, bandwidth) can take up to 72 hours. Do not rely on same-day data for real-time billing alerts — use budgets with alert thresholds instead.',
        'Cost vs Actual Billing: Cost Management shows "amortised" cost (RI/Savings Plan prepayments spread evenly over the term) or "actual" cost (charges as they appear on your invoice, including one-time RI upfront payment). Use amortised for budget planning; actual for invoice reconciliation.',
        'Azure Hybrid Benefit: apply existing Windows Server or SQL Server on-premises licences (with Software Assurance) to Azure VMs — up to 40% savings on Windows VMs and up to 55% savings on SQL Database. Configure per-VM or at scale via Azure Policy.',
      ]
    },
    {
      heading: 'Budgets & Alerts',
      points: [
        'Budgets define a spending target and alert at configurable thresholds: Budget thresholds are percentages of the budget amount (e.g., 80% actual, 100% actual, 120% forecasted). Forecasted thresholds trigger when Azure\'s ML-based spend forecast predicts you will exceed the threshold by month end.',
        'Budget scope: create budgets at subscription, resource group, or management group scope. Filter budgets by service name, resource group, tag, or meter subcategory — focus a budget on a specific team\'s resources using tags.',
        'Action groups on budgets: trigger email notifications, SMS, or Azure Functions/Logic Apps when a threshold is reached. Use Logic Apps to automatically: stop non-production VMs, scale down AKS node pools, or post to Slack/Teams. Budgets do NOT automatically stop resources — they only alert or trigger action groups.',
        'Cost anomaly alerts: newer feature that uses ML to detect unexpected spending spikes (e.g., someone deployed 100 VMs by accident). Configure anomaly detection alerts in Cost Management → Alerts. Sends daily digest emails of unusual patterns.',
        'Export cost data: schedule daily/weekly/monthly exports of raw usage data to an Azure Blob Storage account as CSV or Parquet. Use this for: custom Power BI dashboards, long-term retention beyond the 90-day portal retention, and feeding data into internal chargeback systems.',
      ]
    },
    {
      heading: 'Reserved Instances & Savings Plans',
      points: [
        'Reserved Instances (RI): commit to a specific VM size, region, and term (1 or 3 years). Payment options: All Upfront (best price), Partial Upfront, or No Upfront (monthly installments). The RI discount automatically applies to matching running VMs — no configuration on the VM itself.',
        'RI flexibility: Instance Size Flexibility (ISF) allows an RI to cover multiple VM sizes within the same VM series and region. Example: a D4s_v3 RI can cover 2× D2s_v3 or 0.5× D8s_v3. ISF applies by default for Linux VMs; Windows VMs require separate Windows RI.',
        'RI scope: Shared scope (applies to all subscriptions in the billing account/EA — most flexible), Single subscription (applies only to that subscription), or Resource Group scope (most restrictive — applies only within that RG). Use Shared scope for maximum utilisation across teams.',
        'Azure Savings Plans: commit to an hourly spend (e.g., $10/hr) rather than a specific VM size. Savings Plans cover: VMs, App Service, Container Instances, Azure Functions Premium, and Azure Dedicated Hosts. More flexible than RIs — works across regions and VM families — but slightly lower discount (~65% vs ~72% for RIs).',
        'Right-sizing with Azure Advisor: Advisor analyses 7–30 days of CPU/memory metrics and recommends: downsizing underutilised VMs (< 5% CPU average), shutting down idle resources, and purchasing RIs for consistently running resources. Review Advisor monthly in production environments.',
      ]
    },
    {
      heading: 'Tagging Strategy & Cost Attribution',
      points: [
        'Tags are key-value metadata applied to Azure resources and resource groups. Azure supports up to 50 tag pairs per resource. Tags do not inherit automatically from resource groups to resources — each resource must be tagged independently (or via Azure Policy).',
        'Required tags strategy: use Azure Policy with "deny" effect to prevent resource creation without mandatory tags (e.g., Environment, Owner, CostCenter, Project). Use "append" effect to auto-add default tags when not specified. Policy assignment at management group level enforces tags across all subscriptions.',
        'Cost allocation: in Cost Management, group costs by tag value to see spending per team/project/environment. Example: filter by Environment=prod to see production-only spending. Create budget alerts scoped to a tag filter to alert specific teams when their spending exceeds a threshold.',
        'Shared resource costs: some resources (VNet, Log Analytics workspaces, firewalls) are shared across teams. Use Cost Allocation rules in Cost Management to split shared costs by a percentage, compute usage, or subscription ratio — then attribute them to specific subscriptions or tags for chargeback/showback.',
        'Untagged resources: run periodic audits via Azure Resource Graph Queries to find resources missing required tags. Use `az tag create` to apply tags retroactively. Set up Defender for Cloud recommendations or Policy non-compliance reports to track tagging coverage.',
      ]
    },
    {
      heading: 'Cost Attribution Through Tagging and Resource Organization',
      points: [
        'Consistent resource tagging (by team, project, environment, cost center) is what makes Cost Analysis actually useful for chargeback or showback reporting — without tags, costs can only be broken down by resource type or resource group, not by the organizational dimensions that actually matter for accountability.',
        'Resource groups provide a natural cost-boundary for related resources, but a single team\'s resources spanning multiple resource groups (or a resource group containing multiple teams\' resources) makes tag-based cost attribution more reliable than relying on resource group boundaries alone.',
        'Budgets with action-group-triggered alerts (not just passive notification) can automatically trigger a response (like disabling a service principal or sending a Teams message) when spending approaches a threshold, turning cost monitoring from reactive reporting into proactive control.',
        'Azure Advisor\'s cost recommendations (identifying underutilized VMs, orphaned disks, or opportunities for reserved instance purchases) surface savings opportunities that manual cost review would likely miss across a large, sprawling subscription.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Cost Management CLI',
      language: 'bash',
      code: `# View current subscription cost (last 30 days)
az costmanagement query \\
  --type ActualCost \\
  --scope "/subscriptions/{subscription-id}" \\
  --timeframe MonthToDate \\
  --dataset-aggregation '{"totalCost":{"name":"Cost","function":"Sum"}}' \\
  --dataset-grouping '[{"type":"Dimension","name":"ServiceName"}]'

# Create a monthly budget with email alert at 80% and 100%
az consumption budget create \\
  --budget-name "monthly-prod-budget" \\
  --amount 5000 \\
  --category Cost \\
  --time-grain Monthly \\
  --start-date 2025-01-01 \\
  --end-date 2026-12-31 \\
  --notification '{"enabled":true,"operator":"GreaterThan","threshold":80,"contactEmails":["team@company.com"]}'

# Tag a resource group with cost attribution tags
az group update \\
  --name my-production-rg \\
  --tags Environment=prod Owner=platform-team CostCenter=CC-1234 Project=DevHub

# Tag a resource directly
az resource tag \\
  --ids /subscriptions/{sub-id}/resourceGroups/my-rg/providers/Microsoft.Compute/virtualMachines/my-vm \\
  --tags Environment=prod Owner=platform-team

# Schedule cost export to blob storage (monthly)
az costmanagement export create \\
  --name monthly-export \\
  --scope "/subscriptions/{subscription-id}" \\
  --schedule-status Active \\
  --schedule-recurrence Monthly \\
  --recurrence-period from="2025-01-01" to="2026-12-31" \\
  --storage-account-id /subscriptions/{sub}/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/costsa \\
  --storage-container costs \\
  --storage-directory exports`
    },
    {
      label: 'Azure Policy — Enforce Tags',
      language: 'bash',
      code: `# Built-in policy: "Require a tag on resources" — deny if missing
az policy assignment create \\
  --name require-env-tag \\
  --policy "96670d01-0a4d-4649-9c89-2d3abc0a5025" \\
  --scope "/subscriptions/{subscription-id}" \\
  --params '{"tagName":{"value":"Environment"}}'

# Custom policy definition: require Environment AND CostCenter tags
cat <<'EOF' > require-tags-policy.json
{
  "properties": {
    "displayName": "Require Environment and CostCenter tags",
    "policyType": "Custom",
    "mode": "Indexed",
    "policyRule": {
      "if": {
        "allOf": [
          { "field": "tags['Environment']", "exists": "false" },
          { "field": "tags['CostCenter']", "exists": "false" }
        ]
      },
      "then": { "effect": "deny" }
    }
  }
}
EOF

az policy definition create \\
  --name require-cost-tags \\
  --rules require-tags-policy.json

# Remediation task: auto-tag existing non-compliant resources
az policy remediation create \\
  --name tag-remediation \\
  --policy-assignment require-env-tag \\
  --resource-discovery-mode ReEvaluateCompliance`
    },
    {
      label: 'Right-Sizing & Advisor',
      language: 'bash',
      code: `# List Azure Advisor cost recommendations
az advisor recommendation list \\
  --category Cost \\
  --output table

# Filter: only VM right-sizing recommendations
az advisor recommendation list \\
  --category Cost \\
  --query "[?impactedField=='Microsoft.Compute/virtualMachines']" \\
  --output table

# Purchase a Reserved Instance (example: D4s_v3, 1 year, East US)
az reservations reservation-order purchase \\
  --sku "Standard_D4s_v3" \\
  --location eastus \\
  --reserved-resource-type VirtualMachines \\
  --billing-scope "/subscriptions/{subscription-id}" \\
  --term P1Y \\
  --billing-plan Upfront \\
  --quantity 2 \\
  --display-name "prod-d4s-eastus-ri"

# Resource Graph query: find VMs with no tags
az graph query -q "
  Resources
  | where type == 'microsoft.compute/virtualmachines'
  | where isnull(tags) or array_length(bag_keys(tags)) == 0
  | project name, resourceGroup, location
  | limit 50
"`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Thinking budgets automatically stop resources when the limit is reached',
      wrong: `# Set a $1000 budget expecting Azure to stop VMs at $1000
az consumption budget create --amount 1000 ...
# Reality: Azure keeps running resources and just sends an alert`,
      right: `# Use budget action groups to trigger automation (e.g., Logic App that stops VMs)
# Configure notification with contactGroups pointing to an action group
# The action group triggers a Logic App / Azure Function to stop non-prod VMs`,
      explanation: 'Azure budgets are alert-only — they never automatically stop or delete resources. They send notifications (email, SMS, push) and can trigger action groups, but the automation to actually stop resources must be built separately (Logic App, Azure Function, Automation Runbook). Teams often assume budgets will cap spending, then are surprised by overruns.'
    },
    {
      title: 'Applying Reserved Instance scope as Single Subscription instead of Shared',
      wrong: `# RI scope: Single Subscription — only covers VMs in one subscription
# If the target subscription\'s VMs scale down, the RI is wasted`,
      right: `# RI scope: Shared — covers VMs across all subscriptions in the billing account/EA
# Maximises RI utilisation; if one subscription scales down, another picks it up`,
      explanation: 'With Single Subscription scope, an RI only applies to VMs in that specific subscription. If those VMs scale down or are deleted, the RI goes unused and you still pay for the commitment. Shared scope allows the RI to cover matching VMs across all subscriptions in your enterprise agreement — maximising utilisation. Use Shared unless you have a specific reason to restrict the RI to one subscription.'
    },
    {
      title: 'Not tagging resources at creation — retroactive tagging is incomplete and costly',
      wrong: `# Deploy resources without tags, plan to tag them "later"
az vm create --name my-vm --resource-group my-rg ...
# Months later: Cost Management shows unattributed spend with no team ownership`,
      right: `# Enforce mandatory tags via Azure Policy (deny effect) at subscription level
# Tag at resource creation: --tags Environment=prod Owner=team CostCenter=CC-123
az vm create --name my-vm --resource-group my-rg --tags Environment=prod Owner=platform`,
      explanation: 'Tags not applied at resource creation are rarely applied retroactively — teams forget or the resource ownership is unclear. Without tags, Cost Management cannot attribute spending to teams or projects, making chargeback impossible and hiding waste. Use Azure Policy with a "deny" effect to prevent any resource creation without required tags. This enforcement is far cheaper than auditing and remediating after the fact.'
    },
    {
      title: 'Purchasing Reserved Instances before establishing steady-state usage patterns',
      wrong: `# Buy a 3-year RI for a new workload on day 1
# 6 months later: architecture changed to containers, RI is wasted`,
      right: `# Run pay-as-you-go for 30-90 days, analyse usage patterns with Azure Advisor
# Then purchase RIs for consistently running resources with predictable size/region
az advisor recommendation list --category Cost --query "[?category=='Cost']"`,
      explanation: 'RIs require a 1- or 3-year commitment to a specific VM size, series, and region. Purchasing RIs before a workload is stable risks paying for reserved capacity that doesn\'t match actual usage. Run workloads on pay-as-you-go first, use Azure Advisor\'s RI recommendations (which analyse 7–30 days of usage), and only commit once the workload is stable and sized correctly.'
    },
  ];

  challenge: Challenge = {
    title: 'Monthly cost reporter',
    language: 'typescript',
    description: 'Write a function that analyses a list of Azure resource cost records and produces a monthly summary report.\n\nGiven:\n```typescript\ninterface CostRecord {\n  resourceGroup: string;\n  service: string;\n  amount: number;\n  tags: Record<string, string>;\n}\n```\n\nWrite `analyseCosts(records: CostRecord[])`\nReturn:\n- `totalCost`: number (sum of all amounts)\n- `byResourceGroup`: Record<string, number> (cost per RG, sorted desc)\n- `byService`: Record<string, number> (cost per service, sorted desc)\n- `untaggedCost`: number (total cost of records missing an "Environment" tag)\n- `topSpender`: string (RG with the highest cost)',
    hints: [
      'Use reduce to group costs into records keyed by resourceGroup and service',
      'Sort by value using Object.entries().sort((a, b) => b[1] - a[1])',
      'Convert sorted entries back to object with Object.fromEntries()',
      'Untagged = records where tags["Environment"] is undefined or empty',
    ],
    starterCode: `interface CostRecord {
  resourceGroup: string;
  service: string;
  amount: number;
  tags: Record<string, string>;
}

export function analyseCosts(records: CostRecord[]) {
  return {
    totalCost: 0,
    byResourceGroup: {} as Record<string, number>,
    byService: {} as Record<string, number>,
    untaggedCost: 0,
    topSpender: '',
  };
}`,
    solution: `interface CostRecord {
  resourceGroup: string;
  service: string;
  amount: number;
  tags: Record<string, string>;
}

export function analyseCosts(records: CostRecord[]) {
  const totalCost = records.reduce((sum, r) => sum + r.amount, 0);

  const groupByRG = records.reduce((acc, r) => {
    acc[r.resourceGroup] = (acc[r.resourceGroup] ?? 0) + r.amount;
    return acc;
  }, {} as Record<string, number>);

  const groupBySvc = records.reduce((acc, r) => {
    acc[r.service] = (acc[r.service] ?? 0) + r.amount;
    return acc;
  }, {} as Record<string, number>);

  const byResourceGroup = Object.fromEntries(
    Object.entries(groupByRG).sort((a, b) => b[1] - a[1])
  );
  const byService = Object.fromEntries(
    Object.entries(groupBySvc).sort((a, b) => b[1] - a[1])
  );

  const untaggedCost = records
    .filter(r => !r.tags['Environment'])
    .reduce((sum, r) => sum + r.amount, 0);

  const topSpender = Object.keys(byResourceGroup)[0] ?? '';

  return { totalCost, byResourceGroup, byService, untaggedCost, topSpender };
}`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What happens when an Azure Budget threshold is reached?',
      options: [
        'Azure automatically stops all resources in the budget\'s scope to prevent further spending',
        'Azure sends alerts (email/SMS/action group) but does NOT stop resources — automation must be built separately',
        'Azure pauses new resource deployments until the next billing cycle',
        'Azure sends a credit request to the account administrator'
      ],
      answer: 1,
      explanation: 'Azure Budgets are alert-only — they never automatically stop or delete resources. When a threshold is crossed, Azure sends notifications and can trigger an action group (which can invoke a Logic App, Azure Function, or Automation Runbook to stop resources). The automation to actually limit spending must be built by you. Teams often assume budgets act as hard caps, which is incorrect.'
    },
    {
      q: 'What is the difference between a Reserved Instance and an Azure Savings Plan?',
      options: [
        'Reserved Instances are 1-year only; Savings Plans can be 1 or 3 years',
        'Reserved Instances commit to a specific VM size/region (up to 72% discount); Savings Plans commit to an hourly spend amount, applying across services and regions (up to 65% discount)',
        'Reserved Instances apply to Compute only; Savings Plans apply to all Azure services including Storage and Networking',
        'They are functionally identical — the terminology changed when Azure Savings Plans launched'
      ],
      answer: 1,
      explanation: 'Reserved Instances (RI): commit to a specific VM size, family, and region for 1 or 3 years — highest discount (up to 72%) but least flexible. Azure Savings Plans: commit to an hourly spend (e.g., $10/hr) — discount up to 65%, covers VMs across any region/family plus App Service, Container Instances, and Azure Functions Premium. Savings Plans are simpler and more flexible; RIs give a deeper discount for predictable, stable workloads.'
    },
    {
      q: 'Which Azure feature recommends right-sizing for underutilised VMs?',
      options: [
        'Azure Monitor Alert Rules',
        'Azure Cost Analysis dashboards',
        'Azure Advisor (Cost category)',
        'Azure Security Center'
      ],
      answer: 2,
      explanation: 'Azure Advisor analyses resource utilisation (CPU, memory, network) over 7–30 days and provides personalised recommendations in four categories: Cost, Security, Reliability, and Performance. The Cost category recommends: right-sizing underutilised VMs, shutting down idle resources, purchasing Reserved Instances for consistently running resources, and deleting unattached managed disks. Advisor is free and should be reviewed monthly.'
    },
    {
      q: 'Why do tags on a resource group not automatically propagate to the resources inside it?',
      options: [
        'Azure applies tag inheritance by default but only for billing purposes, not for Cost Management filtering',
        'Tags on resource groups and tags on individual resources are independent — Azure does not inherit tags by default',
        'Tag inheritance requires a Premium Azure subscription tier',
        'Tags inherit automatically but only if the resource was created after the tag was applied to the resource group'
      ],
      answer: 1,
      explanation: 'Azure tag inheritance is NOT automatic — tagging a resource group does not apply those tags to the resources inside it. Each resource must be tagged independently. Use Azure Policy (with "inherit a tag from the resource group" built-in policy, or a custom "append" effect policy) to automatically copy tags from the resource group to resources at creation time. Without this, cost attribution by tag will be incomplete.'
    },
    {
      q: 'What is the correct scope to choose for a Reserved Instance to maximise utilisation across multiple teams?',
      options: [
        'Resource Group — apply the RI only to VMs in one resource group for precise attribution',
        'Single Subscription — apply the RI only to VMs in one subscription',
        'Shared — apply the RI across all subscriptions in the billing account or EA enrolment',
        'Global — apply the RI to all Azure regions simultaneously'
      ],
      answer: 2,
      explanation: 'Shared scope allows the RI discount to apply to matching VMs across all subscriptions in your enterprise agreement or billing account. If one team\'s VMs are scaled down, the RI automatically covers another team\'s matching VMs — maximising utilisation. Single Subscription scope restricts the RI to one subscription; if those VMs scale down, the RI goes unused. There is no "Global" scope for RIs — they are region-specific.'
    },
    {
      q: 'What does Azure Advisor provide in the context of cost management?',
      options: [
        'Real-time billing alerts only',
        'Automated resource deletion for unused resources',
        'Personalised recommendations to reduce cost, improve performance, and increase reliability',
        'A fixed discount on reserved instances',
      ],
      answer: 2,
      explanation: 'Azure Advisor analyses your usage and configuration to provide personalised recommendations across cost, performance, reliability, security, and operational excellence.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do you implement chargeback vs showback for cloud costs in Azure?',
      a: '<strong>Showback</strong>: report on costs per team/project without actually billing them — informational transparency. Use Cost Management filtered by tags (Team, CostCenter) and export reports or build Power BI dashboards. Teams see their costs but are not charged directly. <strong>Chargeback</strong>: actually transfer cloud costs to business unit budgets. Requires tagging discipline + a financial process. Azure Cost Management supports <strong>Cost Allocation Rules</strong> to split shared resource costs (firewalls, Log Analytics) by percentage, compute ratio, or usage. Export cost data to a Storage Account, process it (Azure Data Factory or Power Automate), and integrate with your internal finance/ERP system for actual cost transfer. Most enterprises start with showback and evolve to chargeback as tagging matures.'
    },
    {
      q: 'What is Azure Hybrid Benefit and how does it reduce costs?',
      a: '<strong>Azure Hybrid Benefit (AHB)</strong> lets you apply existing on-premises Windows Server and SQL Server licences (with active Software Assurance or subscription licences) to Azure resources at no additional licence cost: <br/><ul><li><strong>Windows VMs</strong>: save ~40% vs pay-as-you-go (avoid paying for the Windows OS licence in Azure)</li><li><strong>SQL Database/Managed Instance</strong>: save up to 55% vs pay-as-you-go on the licence portion</li><li><strong>Azure Dedicated Hosts</strong>: apply Windows Server licences to physical hosts</li></ul>Enable via Azure Portal (VM → Configuration → Azure Hybrid Benefit) or at scale using Azure Policy ("Configure Hybrid Benefit"). Combine AHB with Reserved Instances for maximum savings — they stack independently.'
    },
    {
      q: 'How do you detect and remediate cost anomalies in Azure?',
      a: '<strong>Anomaly detection</strong>: Cost Management (preview) uses ML to detect unusual spending patterns and sends a daily digest email. Configure under Cost Management → Alerts → Anomaly Alerts. <strong>Budget forecasted thresholds</strong>: set a budget alert at 120% forecasted — Azure\'s forecast model flags when current spending pace will exceed the budget by month end. <strong>Proactive monitoring</strong>: (1) Azure Advisor recommendations checked monthly; (2) Resource Graph queries to find new large VM deployments; (3) Power BI Cost Management connector for custom dashboards with daily cost delta columns. <strong>Remediation</strong>: once a spike is found, use Cost Analysis to drill down by resource, check recent deployments in Activity Log (`az monitor activity-log list`), and contact the resource owner via the Owner tag.'
    },
    {
      q: 'What is the difference between Actual cost and Amortised cost views in Cost Management?',
      a: '<strong>Actual cost</strong>: shows charges as they appear on your invoice. For Reserved Instances, the entire upfront cost appears in the month of purchase as a large one-time charge — makes that month\'s cost spike visually. Good for invoice reconciliation. <strong>Amortised cost</strong>: spreads RI/Savings Plan prepayments evenly over the commitment term (e.g., a $12,000/year RI appears as $1,000/month). This gives a smoother, more accurate view of true monthly spending and makes it easier to compare month-over-month trends. <strong>Recommendation</strong>: use Amortised cost for budgeting, planning, and trend analysis; use Actual cost for finance reconciliation against invoices.'
    },
    {
      q: 'How does Azure Spot pricing work and when should you use it?',
      a: '<strong>Azure Spot VMs</strong> use excess Azure capacity at discounts up to 90% vs pay-as-you-go. The trade-off: Azure can evict Spot VMs with only a 2-minute eviction notice when it needs the capacity back. <strong>When to use</strong>: batch processing jobs (ML training, rendering, data processing), stateless workloads, CI/CD build agents, dev/test environments that tolerate interruption. <strong>When NOT to use</strong>: production stateful workloads, databases, real-time user-facing services, or anything requiring an SLA. <strong>Best practices</strong>: use VMSS with Spot + on-demand mix (e.g., 80% Spot, 20% on-demand as baseline); save work frequently; handle eviction gracefully; use Azure Container Apps or AKS node pools with Spot for containerised batch jobs.'
    },
    {
      q: 'What is the difference between Azure Cost Alerts and Budgets?',
      a: 'A <strong>Budget</strong> defines a spending threshold for a scope (subscription, resource group). Azure sends alerts when actual or forecasted spend reaches configured percentages (e.g., 80%, 100%). Budgets can also trigger <strong>action groups</strong> (runbooks, Logic Apps) to automatically react to overspend — not just notify.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Azure Cost Management provides cost visibility, budget alerts, RI/Savings Plan purchasing, and tagging-based attribution — but budgets are alert-only, never automatic resource stoppage.',
    mustKnow: [
      'Budgets trigger alerts and action groups — they do NOT stop resources automatically',
      'Reserved Instances: specific VM size/region commitment, up to 72% discount; Savings Plans: hourly spend commitment, up to 65%, more flexible',
      'RI Shared scope: covers VMs across all subscriptions in billing account — maximises utilisation',
      'Tags must be applied at resource creation; Azure Policy "deny" effect enforces mandatory tags',
      'Azure Advisor Cost category: recommends right-sizing, RI purchases, idle resource cleanup',
      'Amortised cost: spread RI/SP payments evenly (for budgets); Actual cost: as on invoice (for reconciliation)',
    ],
    interviewFocus: [
      'What is the difference between a Reserved Instance and an Azure Savings Plan?',
      'Why do Azure budgets not automatically stop resources, and how would you implement automatic cost control?',
      'How does tag-based cost attribution work in Azure Cost Management?',
      'When would you choose Amortised vs Actual cost view?',
    ],
  };
}
