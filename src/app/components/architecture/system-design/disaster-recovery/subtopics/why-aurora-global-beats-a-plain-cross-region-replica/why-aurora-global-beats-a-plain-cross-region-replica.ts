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
  templateUrl: './why-aurora-global-beats-a-plain-cross-region-replica.html',
  styleUrl: './why-aurora-global-beats-a-plain-cross-region-replica.scss'
})
export class WhyAuroraGlobalBeatsAPlainCrossRegionReplicaSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two RPO figures on the same page, never explained as different technologies',
      points: [
        'The main page states two different cross-region RPO figures without ever contrasting WHY they differ: a mistake block\'s "right" fix says "AWS Aurora Global: RPO typically < 1s (async)," while the Challenge solution\'s "Regional failure" scenario — describing a plain RDS cross-region read replica — states "< 1 minute (async cross-region replication lag; monitor alert if lag > 30s)." Both are accurate for what they describe, but the page never explains the mechanical reason a 60x-plus difference exists between them.',
        'This gap-closing addition names that reason: the two features use fundamentally different replication MECHANISMS, not just different tuning of the same underlying technology.',
      ]
    },
    {
      heading: 'How each technology actually replicates data across regions',
      points: [
        'A standard RDS cross-region READ REPLICA uses logical, engine-level replication — essentially the same mechanism as same-region async replication (streaming the database engine\'s own write-ahead log to the replica, which replays it), just carried over a longer-distance, higher-latency network link between regions. This is why its lag is measured in seconds and can spike further under load or network congestion.',
        'Aurora Global Database, per AWS\'s own documentation, replicates using DEDICATED physical infrastructure specifically built for this purpose, with storage-based replication that operates below the database engine layer entirely — it is not replaying SQL-level WAL/binlog entries the way a standard replica does, which is precisely what lets it sustain a fundamentally lower, more consistent typical lag (under 1 second) than logical replication can achieve over the same distance.',
        'This is the same category of distinction as the earlier "replication mechanism, not just replication SPEED setting" pattern seen elsewhere in this hub\'s own material — the two features are not simply "the same thing tuned differently," they are architecturally different systems solving cross-region replication in different ways.',
      ]
    },
    {
      heading: 'Why this matters for choosing between them in a real DR plan',
      points: [
        'A team designing a DR plan for a genuinely RPO-sensitive system (the main page\'s own fintech Challenge, requiring RPO < 1 minute) gets meaningfully more headroom against that budget by using Aurora Global Database instead of a plain cross-region read replica — sub-1-second typical lag versus the plain replica\'s seconds-to-tens-of-seconds range under real conditions.',
        'The tradeoff is that Aurora Global Database requires being on the Aurora engine specifically (MySQL- or PostgreSQL-compatible Aurora, not plain RDS PostgreSQL/MySQL) — a standard RDS deployment cannot simply "turn on" the dedicated replication infrastructure Aurora Global Database uses; migrating to Aurora is a real, separate engineering decision, not a configuration flag on an existing RDS instance.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two cross-region replication mechanisms, contrasted',
      language: 'typescript',
      code: `interface CrossRegionReplication {
  technology: string;
  mechanism: string;
  typicalLag: string;
  worksOnPlainRds: boolean;
}

const options: CrossRegionReplication[] = [
  {
    technology: 'Standard RDS cross-region read replica',
    mechanism:
      'Logical, engine-level replication -- streams and replays ' +
      'the database engine\'s own WAL/binlog over a long-distance link.',
    typicalLag: 'Seconds, can spike further under load or congestion',
    worksOnPlainRds: true,
  },
  {
    technology: 'Aurora Global Database',
    mechanism:
      'Dedicated physical replication infrastructure, storage-based -- ' +
      'operates BELOW the database engine layer, not replaying SQL WAL.',
    typicalLag: 'Typically under 1 second',
    worksOnPlainRds: false, // requires the Aurora engine specifically
  },
];

// The 60x-plus lag difference isn't a "turn a dial" setting --
// it reflects two structurally different replication mechanisms.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team running plain RDS PostgreSQL (not Aurora) wants to reduce their cross-region read replica\'s lag from a typical 3-5 seconds down to Aurora Global Database\'s documented sub-1-second figure, purely by tuning their existing replication configuration. Is that achievable without changing anything else?',
    hint: 'Is Aurora Global Database\'s low lag a configuration setting available on any RDS engine, or is it tied to a specific replication mechanism only Aurora provides?',
    solution: 'Not achievable through configuration alone. Aurora Global Database\'s sub-1-second typical lag comes from AWS\'s dedicated, storage-based replication infrastructure built specifically for the Aurora engine — a fundamentally different mechanism from the logical, engine-level WAL replication a standard RDS cross-region read replica uses (which is what plain RDS PostgreSQL is limited to, regardless of tuning). To get anywhere near Aurora Global Database\'s lag characteristics, the team would need to migrate their database to the Aurora engine (PostgreSQL-compatible or MySQL-compatible Aurora) and adopt Aurora Global Database specifically — a real migration project, not a configuration change on their existing plain RDS instance.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Aurora Global Database\'s sub-1-second replication lag and a plain RDS cross-region replica\'s multi-second lag are the same underlying technology, just configured or tuned differently.',
      reality: 'Per this subtopic\'s theory, they use fundamentally different mechanisms — Aurora Global Database uses dedicated, storage-based physical replication infrastructure below the database engine layer; a plain RDS replica uses logical, engine-level WAL replication over a standard network link.'
    },
    {
      thought: 'Any RDS database engine can adopt Aurora Global Database\'s low-latency replication by enabling the right setting.',
      reality: 'Per this subtopic\'s theory, Aurora Global Database is specific to the Aurora engine — a team on plain RDS PostgreSQL or MySQL would need to migrate to Aurora entirely to access this replication mechanism, not just change a configuration value.'
    },
    {
      thought: 'The choice between a plain cross-region read replica and Aurora Global Database is purely about cost, with no meaningful technical difference in what each actually provides.',
      reality: 'Per this subtopic\'s theory, the real difference is the replication mechanism itself, which directly determines achievable RPO — a genuinely RPO-sensitive system (like the main page\'s own fintech Challenge) gets meaningfully more headroom from Aurora Global Database\'s sub-second lag than a plain replica\'s seconds-scale lag can provide.'
    }
  ];
}
