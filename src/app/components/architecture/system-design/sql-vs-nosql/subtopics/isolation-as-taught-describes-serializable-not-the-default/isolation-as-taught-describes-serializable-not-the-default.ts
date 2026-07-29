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
  templateUrl: './isolation-as-taught-describes-serializable-not-the-default.html',
  styleUrl: './isolation-as-taught-describes-serializable-not-the-default.scss'
})
export class IsolationAsTaughtDescribesSerializableNotTheDefaultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A textbook-perfect definition that quietly overstated what "Isolation" guarantees by default',
      points: [
        'Both of the main page\'s ACID quiz explanations originally defined the "I" in ACID in absolute terms — "concurrent transactions execute as if they were serial; intermediate states are not visible to other transactions." This is a precise, textbook-correct description — of ONE SPECIFIC isolation level (Serializable), not of what "Isolation" guarantees across every real database by default. The page has been corrected to note this.',
        'The four ACID letters are each usually taught as fixed, all-or-nothing guarantees. Isolation is the one letter that is actually a SPECTRUM — SQL defines multiple isolation levels (Read Uncommitted, Read Committed, Repeatable Read, Serializable), and a database "supporting ACID transactions" does not by itself tell you which level it runs at.',
      ]
    },
    {
      heading: 'What the major relational databases actually default to',
      points: [
        'PostgreSQL\'s documented default transaction isolation level is READ COMMITTED — under this level, each individual statement within a transaction sees data committed before THAT STATEMENT began, not before the whole transaction began. This allows "non-repeatable reads": reading the same row twice in one transaction can return different values if another transaction committed a change in between.',
        'MySQL (InnoDB)\'s documented default is REPEATABLE READ — stronger than Postgres\'s default (a row read twice returns the same value within one transaction), but still weaker than full Serializable, which additionally prevents certain anomalies involving RANGES of rows (phantom reads) that Repeatable Read alone does not guarantee against in every case.',
        'Neither of the two most widely used open-source relational databases defaults to Serializable — the isolation level the "concurrent transactions execute as if they were serial" description actually characterizes. Reaching that guarantee requires explicitly requesting it (e.g. `SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`), which most applications never do, usually because Serializable carries real throughput/contention costs the weaker defaults avoid.',
      ]
    },
    {
      heading: 'Why this distinction matters beyond trivia',
      points: [
        'A team that assumes "our database is ACID, so Isolation means my transactions are automatically safe from all concurrency anomalies" can be surprised in production: under the common default isolation levels, certain race conditions (e.g. two concurrent transactions both reading a stale balance before either commits a withdrawal) remain genuinely possible unless the application uses explicit row locking, optimistic concurrency checks, or opts into a stronger isolation level for that specific operation.',
        'This is precisely why the main page\'s own "Complex queries... Strong consistency required" framing for choosing SQL is necessary but not sufficient — picking a relational database gets you ACID CAPABILITY, but the actual isolation guarantee in effect for any given transaction depends on the isolation level configured (or left at its default), a decision that is easy to overlook.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Default isolation levels and what they actually prevent',
      language: 'typescript',
      code: `interface IsolationLevel {
  name: string;
  preventsNonRepeatableRead: boolean;
  preventsPhantomRead: boolean;
  whoDefaultsHere: string;
}

const levels: IsolationLevel[] = [
  {
    name: 'Read Committed',
    preventsNonRepeatableRead: false,
    preventsPhantomRead: false,
    whoDefaultsHere: 'PostgreSQL, Oracle, SQL Server',
  },
  {
    name: 'Repeatable Read',
    preventsNonRepeatableRead: true,
    preventsPhantomRead: false, // in the strict SQL-standard sense
    whoDefaultsHere: 'MySQL / InnoDB',
  },
  {
    name: 'Serializable',
    preventsNonRepeatableRead: true,
    preventsPhantomRead: true,
    whoDefaultsHere: 'No major RDBMS by default -- must opt in explicitly',
  },
];

// "Concurrent transactions execute as if they were serial" is an
// accurate description of ONLY the last row of this table -- the
// row that none of the widely used defaults actually sit on.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says: "Our system uses PostgreSQL, which is ACID-compliant, so we don\'t need to worry about two concurrent transactions both reading the same account balance before either one commits a withdrawal — Isolation prevents that automatically." Is this correct?',
    hint: 'What is PostgreSQL\'s DEFAULT isolation level, and does that specific level guarantee "transactions execute as if they were serial"?',
    solution: 'Not necessarily correct as stated. PostgreSQL\'s default isolation level is Read Committed, not Serializable — under Read Committed, two concurrent transactions CAN both read the same (stale) balance before either commits its withdrawal, because each transaction only sees a fresh snapshot at the start of EACH STATEMENT, not a guarantee that the whole transaction behaves as if it ran alone. Avoiding this specific race requires either explicit locking (e.g. SELECT ... FOR UPDATE), an application-level optimistic concurrency check (a WHERE clause verifying the balance has not changed), or explicitly running that transaction at the Serializable isolation level (which is what "transactions execute as if they were serial" actually describes) — none of which happen automatically just because the database is broadly "ACID-compliant."'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since PostgreSQL and MySQL are both described as "ACID-compliant," their Isolation guarantee means concurrent transactions always behave as if they ran one after another.',
      reality: 'Per this subtopic\'s theory, "transactions execute as if serial" describes the Serializable isolation level specifically. PostgreSQL defaults to Read Committed and MySQL/InnoDB defaults to Repeatable Read — neither is Serializable by default.'
    },
    {
      thought: 'Isolation, like the other three ACID letters, is a single fixed guarantee every ACID-compliant database provides identically.',
      reality: 'Per this subtopic\'s theory, Isolation is uniquely a SPECTRUM among the four ACID properties — SQL defines multiple named isolation levels with different anomaly guarantees, and "ACID-compliant" does not by itself specify which level a database runs at.'
    },
    {
      thought: 'Reaching Serializable isolation is free — there is no reason a team would ever choose a weaker default.',
      reality: 'Per this subtopic\'s theory, the weaker defaults (Read Committed, Repeatable Read) exist because Serializable carries real throughput/contention costs — most applications default to a weaker level and add targeted locking or explicit Serializable only where a specific operation genuinely needs it.'
    }
  ];
}
