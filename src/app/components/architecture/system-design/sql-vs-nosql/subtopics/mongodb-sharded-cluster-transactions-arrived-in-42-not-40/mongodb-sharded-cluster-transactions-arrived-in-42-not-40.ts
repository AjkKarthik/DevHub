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
  templateUrl: './mongodb-sharded-cluster-transactions-arrived-in-42-not-40.html',
  styleUrl: './mongodb-sharded-cluster-transactions-arrived-in-42-not-40.scss'
})
export class MongodbShardedClusterTransactionsArrivedIn42Not40Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A true-but-incomplete version claim in the QnA, now corrected',
      points: [
        'The main page\'s QnA on NoSQL ACID support originally said "MongoDB supports multi-document ACID transactions since v4.0." That is accurate for one specific deployment shape — a replica set — but MongoDB\'s own release history shows a second, later milestone the sentence omitted. The page has been corrected.',
        'The gap matters because most people reading "MongoDB has supported ACID transactions since 4.0" would reasonably assume it applies to MongoDB generally — including the SHARDED deployments that real, high-scale MongoDB systems actually use (the same "at real scale, you shard" logic the main page\'s own sharding-related content applies to every other database).',
      ]
    },
    {
      heading: 'What actually shipped in each version',
      points: [
        'MongoDB 4.0 (2018) introduced multi-document ACID transactions, but scoped to a single REPLICA SET — a group of MongoDB servers holding the SAME copy of the data (for high availability), not multiple shards each holding a DIFFERENT slice of the data.',
        'MongoDB 4.2 (2019) is the release that extended multi-document ACID transactions to SHARDED clusters — the deployment shape where a transaction may need to touch documents that live on entirely different physical shards, which is a meaningfully harder distributed-coordination problem than coordinating within one replica set.',
        'The gap between the two releases is not a rounding error or a minor point-release nuance — it is roughly a year and a genuinely different (and harder) engineering problem: replica-set transactions coordinate copies of the SAME data; sharded-cluster transactions coordinate DIFFERENT data living on independent shards.',
      ]
    },
    {
      heading: 'Why this version distinction is worth knowing for architecture decisions, not just trivia',
      points: [
        'A team evaluating "does MongoDB support the ACID transaction we need" has to ask a second question the un-qualified "since 4.0" claim skips entirely: is our deployment a single replica set, or is it sharded? The answer to the first question is only complete once the second is also answered.',
        'This mirrors a pattern seen elsewhere on this same page — the QnA on DynamoDB scaling is careful to name specific per-partition limits rather than a blanket "scales infinitely" claim. The MongoDB transactions claim benefits from the same kind of precision: naming the exact deployment shape a capability applies to, not just the version number.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What each MongoDB version milestone actually covers',
      language: 'typescript',
      code: `interface MongoTransactionMilestone {
  version: string;
  year: number;
  deploymentShape: string;
  whatItCoordinates: string;
}

const milestones: MongoTransactionMilestone[] = [
  {
    version: '4.0',
    year: 2018,
    deploymentShape: 'Single replica set',
    whatItCoordinates:
      'Multiple SERVERS holding the SAME copy of the data ' +
      '(for high availability) -- transactions across documents ' +
      'that all live on the same logical dataset.',
  },
  {
    version: '4.2',
    year: 2019,
    deploymentShape: 'Sharded cluster',
    whatItCoordinates:
      'Multiple SHARDS each holding a DIFFERENT slice of the data ' +
      '-- transactions across documents that may live on entirely ' +
      'independent physical shards, a harder distributed problem.',
  },
];

// "MongoDB supports transactions since 4.0" is accurate for the
// first row only -- a sharded deployment needed to wait a further
// year (4.2) for the same capability.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team running a SHARDED MongoDB cluster on version 4.0 reads "MongoDB supports multi-document ACID transactions since 4.0" and plans to rely on multi-document transactions across their shards. What is wrong with this plan, and what is the actual minimum version they need?',
    hint: 'Does "since 4.0" refer to transactions on a replica set, a sharded cluster, or both — and did both deployment shapes get the capability at the same time?',
    solution: 'MongoDB 4.0 only added multi-document ACID transactions for a single REPLICA SET (multiple servers holding the same copy of the data) — it did NOT yet support transactions spanning a SHARDED cluster (multiple shards each holding a different slice of the data). A team on a sharded cluster relying on cross-shard multi-document transactions at version 4.0 would find the capability does not work as expected. The actual minimum version for sharded-cluster transactions is MongoDB 4.2, released roughly a year later specifically to extend transaction support to that harder distributed-coordination scenario. The fix is either upgrading to 4.2+ or restructuring the transaction to stay within a single shard/replica set if upgrading is not immediately possible.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'MongoDB has supported multi-document ACID transactions in every deployment shape (replica sets AND sharded clusters) since version 4.0.',
      reality: 'Per this subtopic\'s theory, MongoDB 4.0 only added transactions for a single replica set. Sharded-cluster transaction support arrived a version later, in 4.2 (2019) — roughly a year after the 4.0 milestone.'
    },
    {
      thought: 'Since both replica-set and sharded-cluster transactions are called "multi-document ACID transactions," they solve essentially the same engineering problem, just released a bit apart.',
      reality: 'Per this subtopic\'s theory, the two are meaningfully different problems — replica-set transactions coordinate copies of the SAME data across servers; sharded-cluster transactions coordinate DIFFERENT data living on independent shards, a harder distributed-coordination challenge that took additional engineering time to ship.'
    },
    {
      thought: 'A capability described as "supported since version X" always applies uniformly across every way that database can be deployed.',
      reality: 'Per this subtopic\'s theory, "since 4.0" was true only for one specific deployment shape (a single replica set) — the same version-support claim can genuinely differ by deployment topology, which is worth checking explicitly rather than assuming.'
    }
  ];
}
