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
  templateUrl: './dynamodb-isnt-tunable-like-cassandra-its-a-binary-choice.html',
  styleUrl: './dynamodb-isnt-tunable-like-cassandra-its-a-binary-choice.scss'
})
export class DynamodbIsntTunableLikeCassandraItsABinaryChoiceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A grouping that quietly conflated two different consistency models',
      points: [
        'The main page originally listed leaderless replication examples as "Cassandra, Riak, DynamoDB (by default eventual, tunable to quorum)" — grouping all three under the same "tunable to quorum" description. Checking DynamoDB\'s actual consistency model against Cassandra\'s reveals they work meaningfully differently, even though both trace back to the original Dynamo paper. The page has been corrected.',
        'This is a subtler kind of imprecision than a wrong number — it is presenting two genuinely different DESIGNS as if they were the same design with different default settings, when one offers a continuous tuning knob and the other offers a fixed binary switch.',
      ]
    },
    {
      heading: 'What Cassandra\'s "tunable" actually means vs. what DynamoDB offers',
      points: [
        'Cassandra genuinely exposes a continuous W/R tuning knob per operation: a client can request consistency ONE, QUORUM, ALL, or several other named levels, and the effective number of replicas contacted for that specific read or write changes accordingly — this is where the "tunable" description is fully accurate.',
        'DynamoDB, by contrast, offers exactly TWO read options: eventually consistent reads (the default — may be served by any replica, including one that has not yet caught up) or strongly consistent reads (set via a ConsistentRead=true parameter — served only by a node guaranteed to have the latest committed write). There is no third option, no numeric W/R parameter, and no way to request "2 out of 3 replicas" the way Cassandra\'s QUORUM does.',
        'Writes in DynamoDB are always internally coordinated for durability regardless of the read-side choice — the tunability that DOES exist in DynamoDB is entirely on the READ side (two options), whereas Cassandra\'s tunability spans BOTH reads and writes independently (you can mix, e.g., a QUORUM write with a ONE read).',
      ]
    },
    {
      heading: 'Why this distinction is worth knowing beyond terminology precision',
      points: [
        'A team designing around "DynamoDB is tunable to quorum like Cassandra" might assume they can dial in an intermediate consistency/performance tradeoff (e.g. "read from 2 of 3 replicas") the way a Cassandra QUORUM read does — DynamoDB simply does not expose that knob. The actual choice is binary: pay for strongly consistent reads (higher latency, roughly double the read capacity cost, and unavailable for Global Secondary Indexes and cross-region Global Tables) or accept eventually consistent reads.',
        'This matters directly for the cost/latency planning the main page\'s own "Decision framework" section encourages — DynamoDB\'s consistency choice is a simpler decision (two options) with different cost implications than Cassandra\'s continuous tuning space, and conflating the two models can lead to an architecture plan that assumes flexibility DynamoDB does not actually provide.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Cassandra\'s tunable knob vs. DynamoDB\'s binary switch',
      language: 'typescript',
      code: `interface ConsistencyModel {
  system: string;
  readOptions: string[];
  writeOptions: string[];
  canMixIndependently: boolean;
}

const models: ConsistencyModel[] = [
  {
    system: 'Cassandra',
    readOptions: ['ONE', 'QUORUM', 'ALL', 'LOCAL_QUORUM', '...'],
    writeOptions: ['ONE', 'QUORUM', 'ALL', 'LOCAL_QUORUM', '...'],
    canMixIndependently: true, // e.g. QUORUM write + ONE read is valid
  },
  {
    system: 'DynamoDB',
    readOptions: ['eventually consistent (default)', 'strongly consistent'],
    writeOptions: ['always durably coordinated -- not user-tunable'],
    canMixIndependently: false, // only the READ side has a choice at all
  },
];

// "DynamoDB, tunable to quorum" conflates these two rows --
// DynamoDB's actual choice is a binary read-side switch, not a
// continuous W/R knob spanning both reads and writes.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team designing a DynamoDB-backed feature says: "We\'ll use QUORUM consistency, like a Cassandra QUORUM read/write, to get a balance between Cassandra\'s ONE and ALL." What is wrong with this plan?',
    hint: 'Does DynamoDB expose a QUORUM option, or any numeric W/R parameter, at all?',
    solution: 'DynamoDB has no QUORUM consistency level and no numeric W/R parameter — its consistency choice is binary: eventually consistent reads (the default) or strongly consistent reads (via ConsistentRead=true). There is no intermediate "read from 2 of 3 replicas" option to select, unlike Cassandra where QUORUM is a real, distinct setting between ONE and ALL. The team\'s plan needs to be reframed around the actual choice DynamoDB offers: either accept eventual consistency (lower cost, lower latency, default) or pay for strongly consistent reads where staleness cannot be tolerated — there is no middle tuning point to reach for.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'DynamoDB offers the same tunable W/R quorum consistency model as Cassandra, just with different default settings.',
      reality: 'Per this subtopic\'s theory, DynamoDB offers a binary read-side choice (eventually consistent vs. strongly consistent) with no numeric W/R parameter at all — a genuinely different, simpler model from Cassandra\'s continuous tuning knob.'
    },
    {
      thought: 'Since both DynamoDB and Cassandra trace back to the original Dynamo paper, their consistency APIs must expose the same options.',
      reality: 'Per this subtopic\'s theory, sharing a common design lineage does not mean identical exposed tuning surfaces — DynamoDB deliberately simplified the original Dynamo-style tunable quorum into a fixed binary read-side switch.'
    },
    {
      thought: 'DynamoDB\'s consistency tunability applies to both reads and writes independently, the same way Cassandra\'s does.',
      reality: 'Per this subtopic\'s theory, DynamoDB\'s only user-facing consistency choice is on the READ side — writes are always durably coordinated internally regardless of that choice, unlike Cassandra where write consistency (ONE, QUORUM, ALL) is a separate, independently tunable setting from read consistency.'
    }
  ];
}
