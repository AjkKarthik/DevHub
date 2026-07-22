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
  templateUrl: './cosmos-logical-partition-caps-at-20gb-not-50gb.html',
  styleUrl: './cosmos-logical-partition-caps-at-20gb-not-50gb.scss'
})
export class CosmosLogicalPartitionCapsAt20gbNot50gbSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine mix-up on the main page: the 50 GB figure describes a limit you don\'t control, not the one your partition key choice actually hits',
      points: [
        'The main page\'s own theory originally described the storage cap tied to a partition key\'s own data as "physical partition = up to 50 GB, ~10,000 RU/s" — attaching the 50 GB figure directly to "all items with the same partition key," as if that were the ceiling a partition key choice bumps into.',
        'This blurs two genuinely different, separately-capped concepts. Per Microsoft\'s own Cosmos DB partitioning documentation: "There\'s no limit to the number of logical partitions in a container. Each logical partition can store up to 20 GB of data" — the LOGICAL partition (the thing your partition key value directly determines) is capped at 20 GB, not 50 GB.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own reference: logical and physical partitions have separate, different caps, and only one of them is something you choose',
      points: [
        'The 50 GB figure belongs to an entirely different, internally-managed concept — physical partitions: "each individual physical partition can store up to 50 gigabytes of data" and "each individual physical partition can provide a throughput of up to 10,000 request units per second." Per Microsoft\'s own docs, one or more logical partitions map onto a single physical partition, and "physical partitions are an internal system implementation, fully managed by Azure Cosmos DB" — you don\'t choose or directly control them at all.',
        'Because a logical partition can never exceed 20 GB, and multiple logical partitions can share one physical partition, the 20 GB logical cap is what a partition key choice actually runs into first — a single high-volume partition key value will hit its own 20 GB ceiling long before the physical partition it happens to share ever approaches 50 GB.',
        'Microsoft\'s own guidance reinforces this is the number worth watching operationally, not 50 GB: "Use Azure Monitor Alerts to monitor whether a logical partition\'s size is approaching 20 GB." There is no equivalent "watch your physical partition size" guidance aimed at application developers, since Cosmos DB handles physical partition splits automatically and transparently.',
      ]
    },
    {
      heading: 'Why the distinction matters for actual data modeling decisions',
      points: [
        'If a single partition key value\'s data volume is expected to exceed 20 GB (a very active tenant in a multi-tenant SaaS app, a single user\'s ever-growing event history), that key choice has a real, hard ceiling well before "50 GB" — a data model relying on the higher figure will hit errors in production that testing at smaller data volumes never surfaced.',
        'Microsoft\'s own documented mitigation for this exact scenario is hierarchical partition keys: "If you have scenarios in which partition keys can exceed 20 GB of data using hierarchical partition keys can help. If you use this feature, you can configure up to a three-level hierarchy for your partition keys to further optimize data distribution." This wasn\'t a design option worth reaching for under a 50 GB assumption — it becomes necessary much sooner, at 20 GB.',
        'The RU/s figure (10,000) genuinely does belong to the physical partition, and the main page\'s own "hot partition" mistake entry correctly ties throttling to that figure — that part of the main page was accurate; only the storage-limit pairing needed correcting.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What the two limits actually are, side by side',
      language: 'bash',
      code: `# LOGICAL partition (what your partition key value determines):
#   - Storage cap: 20 GB
#   - This is the number that matters for data modeling decisions
#   - Monitor it directly: Azure Monitor alert on logical partition
#     key storage size approaching 20 GB

# PHYSICAL partition (internal, Cosmos DB manages this automatically):
#   - Storage cap: 50 GB
#   - Throughput cap: 10,000 RU/s
#   - You never choose or directly interact with these -- Cosmos DB
#     splits physical partitions transparently as data/throughput grow
#   - Multiple logical partitions can share one physical partition

# A single partition key value's data is bounded by the LOGICAL cap
# (20 GB) long before the physical partition it happens to live on
# would ever approach its own 50 GB ceiling.`,
    },
    {
      label: 'Hierarchical partition keys: the fix once a single key can exceed 20 GB',
      language: 'bash',
      code: `# If a single partition key value's data volume is expected to grow
# past 20 GB (e.g. one very active tenant, or one user's full event
# history), a flat single-level partition key isn't enough -- per
# Microsoft's own docs, hierarchical partition keys (HPK) are the
# documented mitigation:
az cosmosdb sql container create \\
  --account-name my-cosmos --resource-group my-rg \\
  --database-name my-database \\
  --name events \\
  --partition-key-path "/tenantId" "/userId" \\
  --throughput 400
# Up to a 3-level hierarchy is supported. Each level narrows the
# effective logical partition further, letting a single top-level
# key value's data span multiple actual logical partitions instead
# of being capped at one 20 GB logical partition total.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You\'re designing a multi-tenant SaaS application in Cosmos DB and choose /tenantId as the partition key. One enterprise customer is projected to accumulate 35 GB of data within their first year — well under the "50 GB" figure the main page originally associated with a partition key\'s storage ceiling. Is this design safe, and if not, what\'s the actual constraint you need to plan around?',
    hint: 'Check which of Cosmos DB\'s two separately-capped partition concepts — logical or physical — a single partition key value\'s data actually maps to, and which one carries the 50 GB figure.',
    solution: 'This design is not safe as described — 35 GB exceeds the actual limit that applies. A single partition key value\'s data lives entirely within one LOGICAL partition, which per Microsoft\'s own documentation is capped at 20 GB, not 50 GB. The 50 GB figure belongs to the physical partition, an internally-managed unit that Cosmos DB controls automatically and that can hold multiple logical partitions — it isn\'t the ceiling a single partition key value\'s data runs into. A tenant projected to reach 35 GB will hit the 20 GB logical partition limit well before then. The documented fix is a hierarchical partition key (e.g. /tenantId then /userId or /eventDate) so a single top-level key value\'s data is spread across multiple logical partitions instead of being capped at one.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A single Cosmos DB partition key value can accumulate up to 50 GB of data before hitting a storage limit.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation caps a single partition key value\'s data at 20 GB — that\'s the LOGICAL partition limit. 50 GB is a completely separate figure describing the PHYSICAL partition, an internal, Cosmos-DB-managed unit that can hold multiple logical partitions and isn\'t something a partition key choice directly controls.'
    },
    {
      thought: 'Physical partitions in Cosmos DB are something you configure or choose, similar to how you choose a partition key.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states physical partitions "are an internal system implementation, fully managed by Azure Cosmos DB" — you choose a partition KEY; Cosmos DB decides how logical partitions map onto physical partitions and splits them automatically as needed.'
    },
    {
      thought: 'The 10,000 RU/s throughput limit and the 50 GB storage limit both apply to the same unit — whichever one a partition key value happens to be measured against.',
      reality: 'Per this subtopic\'s theory, both the 10,000 RU/s throughput cap AND the 50 GB storage cap belong to the physical partition specifically — the logical partition (what a partition key value maps to) has its own separate 20 GB storage cap, and effectively inherits the physical partition\'s 10,000 RU/s ceiling since each logical partition maps to exactly one physical partition.'
    }
  ];
}
