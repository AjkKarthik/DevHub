import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './basic-logs-supports-full-kql-tradeoff-is-per-query-pricing.html',
  styleUrl: './basic-logs-supports-full-kql-tradeoff-is-per-query-pricing.scss'
})
export class BasicLogsSupportsFullKqlTradeoffIsPerQueryPricingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine inaccuracy on the main page: Basic tier tables are described as having no query capability at all',
      points: [
        'The main page\'s own QnA on Log Analytics cost originally stated: "ingestion cost (per GB of data ingested — Basic tier is cheaper, no query capability; Analytics tier is queryable)." Read plainly, this says a Basic-plan table simply cannot be queried with KQL at all — you\'d have to switch it to Analytics first.',
        'That isn\'t accurate. Basic Logs tables support real KQL querying today — the actual tradeoff is about how that querying is billed and what surrounding features are available, not whether querying works at all.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own table plans reference: full KQL works on Basic Logs — the real difference is billing, not capability',
      points: [
        'Per Microsoft\'s own comparison table across table plans, the "Query capabilities" row for Basic Logs reads: "Full Kusto Query Language (KQL) on a single table, which you can extend with data from an Analytics table using lookup." This is explicitly labeled "Full" KQL — not a restricted subset.',
        'The actual distinguishing row is "Query price included": Analytics shows ✅, Basic shows ❌. Basic Logs queries are billed per GB of data scanned at query time, while Analytics tier queries are included in the ingestion cost you already paid. This is a pay-per-use tradeoff for infrequently-queried data, not an absence of query capability.',
        'Basic Logs also supports Simple Log Alerts (though not full Log Search alerts), dashboards (with per-query-refresh cost), data export rules, and Microsoft Sentinel — the main page\'s framing of Basic as essentially a dead-end for anything but cheap storage undersells what it can actually do.',
      ]
    },
    {
      heading: 'Real constraints worth knowing when actually switching a table\'s plan',
      points: [
        'Switching between Analytics and Basic isn\'t unlimited: "You can switch a table\'s plan once a week." A table accidentally left on the wrong plan can\'t simply be flipped back immediately — plan this into any automation or governance process rather than assuming it\'s instantaneous and repeatable.',
        'Switching Analytics → Basic doesn\'t discard older data or shrink total retention automatically: "When you change a table\'s plan from Analytics to Basic, Azure Monitor treats any data that\'s older than 30 days as long-term retention data based on the total retention period set for the table. In other words, the total retention period of the table remains unchanged, unless you explicitly modify the long-term retention period." The switch changes how NEW and recent data is billed and queried, not the retention clock already ticking on existing data.',
        'Total retention for both Basic and Analytics tables can reach up to 12 years (extendable long-term retention), a far larger ceiling than the "30–730 days" figure the main page\'s own quickRef cites as if it were the practical maximum — that figure describes the default/typical Analytics retention window, not the true upper bound once long-term retention is configured.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Querying a Basic Logs table — the same KQL syntax',
      language: 'bash',
      code: `# Basic Logs tables use IDENTICAL KQL syntax to Analytics tables --
# there is no restricted query language to learn separately:
az monitor log-analytics query \\
  --workspace $LAWS_ID \\
  --analytics-query '
ContainerLogV2
| where TimeGenerated > ago(1h)
| where LogLevel == "Error"
| summarize count() by ContainerName, bin(TimeGenerated, 5m)
'
# This works identically whether ContainerLogV2 is on the Basic or
# Analytics plan. What differs is billing: on Basic, this query is
# charged per GB scanned; on Analytics, it's included in the
# ingestion cost already paid.

# The one real query limitation: joining directly across two SEPARATE
# Basic-plan tables isn't supported the way joining two Analytics
# tables is -- per Microsoft's own docs, you extend a Basic table
# with Analytics data via the "lookup" operator instead of "join".`,
    },
    {
      label: 'Switching a table\'s plan, and its real constraints',
      language: 'bash',
      code: `# Switch a table to Basic (reduced ingestion cost, pay-per-query):
az monitor log-analytics workspace table update \\
  --subscription <subId> --resource-group my-rg \\
  --workspace-name my-laws --name ContainerLogV2 \\
  --plan Basic

# Per Microsoft's own docs: "You can switch a table's plan once a
# week." Attempting a second switch on the same table within 7 days
# will fail -- plan any automated table-plan governance around this.

# Switching back to Analytics later:
az monitor log-analytics workspace table update \\
  --subscription <subId> --resource-group my-rg \\
  --workspace-name my-laws --name ContainerLogV2 \\
  --plan Analytics

# Data older than 30 days at the time of an Analytics -> Basic
# switch automatically becomes long-term retention data -- the
# table's TOTAL retention period is unchanged by the switch itself.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate wants to move a high-volume, rarely-queried diagnostic log table to the Basic plan to save on ingestion cost, but is worried that doing so will mean losing the ability to run KQL queries against it during a future incident investigation. Is that concern accurate?',
    hint: 'Check Microsoft\'s own documented "Query capabilities" comparison between the Basic and Analytics table plans specifically — not just the ingestion cost difference.',
    solution: 'The concern is not accurate — Basic Logs tables support "Full Kusto Query Language (KQL) on a single table," per Microsoft\'s own documentation, the same query language used on Analytics tables. The real tradeoff of switching to Basic is that query price is no longer included (it\'s billed per GB scanned at query time, versus included in Analytics tier ingestion cost) — a cost consideration for teams that query the table frequently, but not a loss of query capability. For a rarely-queried diagnostic table, this pay-per-query model is often the more cost-effective choice specifically because queries against it are infrequent.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Log Analytics table on the Basic plan cannot be queried with KQL at all — you have to switch it back to Analytics first to run any query.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation lists Basic Logs\' query capability as "Full Kusto Query Language (KQL) on a single table" — the same KQL syntax works directly against Basic-plan tables with no restriction on the language itself.'
    },
    {
      thought: 'The difference between Basic and Analytics table plans is purely about ingestion cost — querying works the same way and costs the same either way.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own comparison table shows "Query price included" as ✅ for Analytics and ❌ for Basic — Basic Logs queries are billed per GB scanned at query time, a real, separate cost dimension from ingestion.'
    },
    {
      thought: 'A table\'s plan can be switched between Basic and Analytics as often as needed, with no restriction, since it\'s just a billing configuration change.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states plainly: "You can switch a table\'s plan once a week" — a real rate limit worth accounting for in any automated governance or cost-optimization process.'
    }
  ];
}
