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
  templateUrl: './dynamodb-scales-automatically-but-one-partition-still-has-a-ceiling.html',
  styleUrl: './dynamodb-scales-automatically-but-one-partition-still-has-a-ceiling.scss'
})
export class DynamodbScalesAutomaticallyButOnePartitionStillHasACeilingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A page that is more careful about this in one section than another',
      points: [
        'The main page\'s "Key-value stores" theory bullet described DynamoDB as scaling "automatically to any throughput." Its own QnA elsewhere, answering "How does DynamoDB achieve its scalability guarantees?", is far more precise: it names an exact per-partition ceiling (up to 10 GB, up to 3,000 RCU and 1,000 WCU) and explicitly warns that a poorly-chosen partition key creates hot partitions. The theory bullet has been tightened to match.',
        'This is a case where the page did not get anything factually WRONG so much as inconsistent in how carefully it stated the same underlying fact in two different places — worth closing so a reader skimming just the theory section does not walk away with the less precise version.',
      ]
    },
    {
      heading: 'What "scales automatically" is actually true of — and what it is not',
      points: [
        'DynamoDB genuinely does scale TABLE-LEVEL throughput and storage automatically, by splitting data across MORE partitions as a table grows — this part of "scales automatically" is accurate and is DynamoDB\'s real, documented advantage over manually-sharded systems.',
        'What does not scale automatically past a hard ceiling is a SINGLE partition: each partition is capped at roughly 10 GB of storage and roughly 3,000 read capacity units / 1,000 write capacity units of throughput. AWS\'s own documentation is explicit that if a workload needs more than that from one partition KEY, there is no amount of extra provisioned capacity that raises that specific partition\'s ceiling — the fix has to be spreading that key\'s traffic across more partitions, not provisioning more.',
        'This is precisely why the main page\'s own partition-key advice ("choosing a high-cardinality partition key is critical to avoid hot partitions") is not a minor best practice — it is the mechanism that determines whether a table\'s aggregate provisioned throughput is actually reachable, or whether one overloaded partition key silently throttles requests no matter how much total capacity the table has.',
      ]
    },
    {
      heading: 'A concrete failure mode this distinction explains',
      points: [
        'A table provisioned for 50,000 WCU in aggregate, but where 90% of writes target a single "hot" partition key (e.g. one extremely popular product ID, or a poorly chosen low-cardinality key like a status field), can still throttle those hot-key writes at the ~1,000 WCU-per-partition ceiling — even though the table\'s TOTAL provisioned capacity is nowhere near exhausted.',
        'This is a real, commonly-hit production surprise: "we provisioned plenty of capacity, but we\'re still getting throttled" is very often a hot-partition problem, not an under-provisioning problem — and the fix is redesigning the partition key (or adding a random suffix to spread a hot key across multiple physical partitions), not raising the table\'s overall throughput setting.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Table-level scaling vs. per-partition ceiling',
      language: 'typescript',
      code: `interface DynamoDbScalingFact {
  claim: string;
  isAutomatic: boolean;
  hasAHardCeiling: boolean;
}

const facts: DynamoDbScalingFact[] = [
  {
    claim: 'Table-level storage and throughput scale by adding partitions',
    isAutomatic: true,
    hasAHardCeiling: false, // as the table grows, more partitions get added
  },
  {
    claim: "A SINGLE partition's storage and throughput",
    isAutomatic: false,
    hasAHardCeiling: true, // ~10 GB, ~3,000 RCU, ~1,000 WCU -- fixed
  },
];

// A table's TOTAL provisioned throughput being far from exhausted
// does not mean a specific hot partition KEY isn't already
// throttling -- the two numbers (table-level headroom vs.
// per-partition ceiling) are independent.

// Mitigating a hot partition key: spread its traffic
function writeKeyWithSuffix(baseKey: string, shardCount: number) {
  const suffix = Math.floor(Math.random() * shardCount);
  return \`\${baseKey}#\${suffix}\`; // e.g. "product-42#3"
  // Reads must then fan out across all N suffixes and merge --
  // a real cost this technique trades against avoiding throttling.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team provisions a DynamoDB table for 40,000 total write capacity units, but writes are keyed by "product_category" (a low-cardinality field with only 12 possible values). Under heavy load, they see throttling errors even though CloudWatch shows the table is using only 15% of its total provisioned WCU. What is going on?',
    hint: 'Total provisioned capacity is a table-level number. What determines the ceiling for writes hitting one specific value of the partition key?',
    solution: 'With only 12 distinct partition key values, at most 12 physical partitions can ever be in play — likely fewer, since DynamoDB may combine low-traffic keys onto shared partitions, but even in the best case, popular category values are each capped at that single partition\'s ~1,000 WCU ceiling, regardless of how much of the table\'s TOTAL 40,000 WCU is unused elsewhere. The 15% overall utilization figure is a red herring: it is an aggregate across all partitions, and a hot partition key can throttle long before the table-wide total is anywhere near exhausted. The fix is not raising provisioned capacity further (that would not help, since the bottleneck is per-partition, not table-wide) — it requires either choosing a higher-cardinality partition key (e.g. adding a secondary attribute to the key) or adding a random suffix to spread each category\'s writes across multiple physical partitions.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a DynamoDB table shows low overall CloudWatch utilization (e.g. 15% of provisioned WCU), throttling errors cannot be a capacity problem.',
      reality: 'Per this subtopic\'s theory, table-wide utilization is an AGGREGATE across all partitions — a single hot partition key can be throttling at its own ~1,000 WCU ceiling long before the table\'s total provisioned capacity is anywhere near exhausted.'
    },
    {
      thought: 'DynamoDB "scales automatically to any throughput" means there is no meaningful throughput ceiling to design around.',
      reality: 'Per this subtopic\'s theory, table-level throughput scales automatically by adding partitions, but each INDIVIDUAL partition still has a fixed ceiling (~10 GB, ~3,000 RCU, ~1,000 WCU) that no amount of additional table-level provisioning can raise for a single hot key.'
    },
    {
      thought: 'The fix for DynamoDB write throttling is always to provision more write capacity units on the table.',
      reality: 'Per this subtopic\'s theory, when the root cause is a hot partition key, adding more table-level capacity does not help at all — the fix is redesigning the partition key for higher cardinality or spreading the hot key\'s writes across multiple partitions with a suffix.'
    }
  ];
}
