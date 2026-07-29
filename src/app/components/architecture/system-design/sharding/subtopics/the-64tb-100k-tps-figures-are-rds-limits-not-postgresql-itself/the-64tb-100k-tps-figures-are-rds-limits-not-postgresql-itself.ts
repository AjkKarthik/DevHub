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
  templateUrl: './the-64tb-100k-tps-figures-are-rds-limits-not-postgresql-itself.html',
  styleUrl: './the-64tb-100k-tps-figures-are-rds-limits-not-postgresql-itself.scss'
})
export class The64tb100kTpsFiguresAreRdsLimitsNotPostgresqlItselfSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A "vertical scaling ceiling" claim that mixed up two very different kinds of limit',
      points: [
        'The main page opened its "Why shard?" section with a specific pair of numbers: "a single PostgreSQL instance tops out around 100k TPS and 64 TB." Checking each figure against its actual source reveals both are real numbers — just not the numbers the sentence implies they are. The page has been corrected.',
        'The pattern here is a common one: a real, specific figure (which makes a claim feel authoritative) gets detached from the exact thing it originally measured, and reattached to a broader, vaguer claim it was never quite describing.',
      ]
    },
    {
      heading: '"64 TB" is a managed-hosting storage ceiling, not a PostgreSQL software limit',
      points: [
        'AWS RDS for PostgreSQL does cap allocated storage at 64 TiB per DB instance — that number is real and directly verifiable against AWS\'s own RDS documentation. But it is a limit of the RDS PRODUCT, not of PostgreSQL the database software.',
        'Self-hosted PostgreSQL has no comparable instance-wide storage ceiling at all — total database size is bound only by available disk space, which is why production Postgres deployments well beyond 64 TB exist outside of RDS\'s specific ceiling.',
        'The PostgreSQL-SPECIFIC limit that actually exists is narrower and different in kind: a single TABLE (relation) tops out at 32 TB under the default 8 KB page size — a limit on one table\'s size, not on a whole instance\'s total storage across all its tables. Confusingly, even this 32 TB figure is exactly half of the "64 TB" the main page quoted, reinforcing how easy it is for two genuinely different numbers to blur into one memorized figure.',
      ]
    },
    {
      heading: '"100k TPS" undersells single-node PostgreSQL by orders of magnitude — for the right workload',
      points: [
        'A widely-reported 2024 benchmark (Postgres 16.3, read-heavy workload, data fitting in memory) reached nearly 4 million transactions per second on a SINGLE node — roughly 40x the main page\'s "100k TPS ceiling" figure.',
        'The honest caveat, which the benchmark\'s own authors are explicit about, is that this figure is workload-specific: read-only, in-memory data. A real production OLTP workload — mixed reads and writes, data larger than RAM, disk I/O, lock contention, connection overhead — realistically lands far below 4 million and roughly in the 100k range many teams actually plan around.',
        'So "100k TPS" survives as a reasonable RULE OF THUMB for realistic mixed OLTP capacity planning — the main page\'s error was presenting it as PostgreSQL\'s hard ceiling, when the software itself has been shown to go dramatically higher under a different (but real) workload shape.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What each figure actually measures',
      language: 'typescript',
      code: `interface QuotedLimit {
  figure: string;
  whatItActuallyMeasures: string;
  postgresqlSoftwareLimit: string | null;
}

const limits: QuotedLimit[] = [
  {
    figure: '64 TB storage',
    whatItActuallyMeasures:
      "AWS RDS for PostgreSQL's managed-storage ceiling per DB " +
      'instance -- an RDS product limit, not a Postgres one.',
    postgresqlSoftwareLimit:
      '32 TB per single TABLE (relation) -- a different figure, ' +
      'a different scope (one table, not the whole instance).',
  },
  {
    figure: '100k TPS',
    whatItActuallyMeasures:
      'A reasonable rule-of-thumb ceiling for a realistic MIXED ' +
      'read/write OLTP workload on one node.',
    postgresqlSoftwareLimit:
      'None documented -- a 2024 benchmark reached ~4 million TPS ' +
      'on a single node under a read-heavy, in-memory workload.',
  },
];

// Lesson: before repeating a specific "X tops out at N" figure,
// check whether N describes the SOFTWARE, a specific MANAGED
// HOSTING PRODUCT, or a WORKLOAD-SPECIFIC benchmark result --
// these are three different kinds of ceiling.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A colleague says: "We can\'t use vanilla self-hosted PostgreSQL past 64 TB — that\'s a hard limit of the database itself, so we need to shard before then." What is wrong with this reasoning?',
    hint: 'Is 64 TB a limit of PostgreSQL the software, or a limit of a specific way of RUNNING PostgreSQL (a particular managed hosting product)?',
    solution: '64 TB is AWS RDS\'s managed-storage ceiling for PostgreSQL — a limit of that specific hosting product, not of PostgreSQL software itself. Self-hosted PostgreSQL has no equivalent instance-wide storage cap; total size is bound only by available disk space. The real PostgreSQL-specific limit is narrower: a single TABLE tops out at 32 TB under the default page size — which might still force partitioning or sharding for one enormous table long before total instance storage becomes the constraint, but that is a different (and lower) number describing a different thing (one table, not the whole instance). The colleague\'s "hard limit of the database itself" claim conflates a managed-hosting product ceiling with a software limit — worth untangling before it drives an architecture decision.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'PostgreSQL, as software, has a hard storage ceiling around 64 TB — that is why the main page cites it as the vertical-scaling limit.',
      reality: 'Per this subtopic\'s theory, 64 TB is AWS RDS\'s managed-storage ceiling for PostgreSQL specifically — a limit of that hosting product. Self-hosted PostgreSQL has no comparable instance-wide storage cap at all.'
    },
    {
      thought: 'Since a 2024 benchmark reached almost 4 million TPS on a single Postgres node, "100k TPS" as a practical ceiling was simply wrong.',
      reality: 'Per this subtopic\'s theory, the ~4 million TPS figure was for a read-heavy, in-memory workload — a different (also real) scenario. "100k TPS" remains a reasonable rule of thumb for realistic MIXED read/write OLTP capacity planning; the main page\'s error was presenting it as a hard software ceiling rather than a workload-dependent estimate.'
    },
    {
      thought: 'The PostgreSQL-specific 32 TB table-size limit and the RDS 64 TB instance-storage ceiling are the same figure just described two different ways.',
      reality: 'Per this subtopic\'s theory, these are genuinely different numbers describing different scopes — 32 TB caps ONE table (relation); 64 TB caps RDS\'s total allocated storage across an entire instance, which can hold many tables.'
    }
  ];
}
