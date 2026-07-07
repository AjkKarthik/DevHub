import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-read-committed-rcsi-blocking-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-that-read-committed-blocking-behavior-depends-on-rcsi.html',
  styleUrl: './demonstrating-that-read-committed-blocking-behavior-depends-on-rcsi.scss',
})
export class DemonstratingThatReadCommittedBlockingBehaviorDependsOnRcsiSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Comment That\'s Only True for Half the Configurations',
      points: [
        'The main page\'s "Dirty read demo" code tab ends with: SET TRANSACTION ISOLATION LEVEL READ COMMITTED; SELECT balance FROM accounts WHERE account_id = 1;  -- waits for A to commit/rollback. This describes the DEFAULT (locking) READ COMMITTED behavior — a reader takes a shared lock and blocks if another transaction holds an exclusive lock on that row.',
        'But the SAME page\'s own "MSSQL snapshot isolation" theory section, just above it, separately describes READ COMMITTED SNAPSHOT (RCSI): "row-versioning at the statement level. Replaces the default locking READ COMMITTED — readers never block writers and writers never block readers." These two sections describe genuinely OPPOSITE behaviors for the exact same isolation level name ("READ COMMITTED") depending on a database-level setting, and the dirty-read demo\'s code never mentions which configuration its "waits for A" comment assumes.',
      ],
    },
    {
      heading: 'Why Both Claims Are True, Just Not Simultaneously',
      points: [
        'READ_COMMITTED_SNAPSHOT is a per-database ON/OFF setting. With it OFF (the traditional MSSQL default), READ COMMITTED uses shared locks that block on conflicting writes — exactly what the dirty-read demo\'s comment describes. With it ON (RCSI), the SAME isolation level name instead reads from a version store — readers see the last COMMITTED version instantly, without waiting for the writer to finish, and without ever seeing uncommitted (dirty) data either.',
        'This subtopic runs the identical SELECT from the main page\'s own dirty-read demo against both configurations, showing the query returns immediately under RCSI and genuinely blocks without it — for the exact same isolation level name, same code, same scenario.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming the database\'s RCSI setting',
      language: 'sql',
      code: `SELECT is_read_committed_snapshot_on FROM sys.databases WHERE name = DB_NAME();
-- 0 = default locking READ COMMITTED (the traditional MSSQL default)
-- 1 = RCSI enabled (row-versioning READ COMMITTED)`,
    },
    {
      label: 'Default locking READ COMMITTED — genuinely blocks',
      language: 'sql',
      code: `ALTER DATABASE CURRENT SET READ_COMMITTED_SNAPSHOT OFF;

-- Session A:
BEGIN TRAN;
UPDATE accounts SET balance = balance - 1000 WHERE account_id = 1;
-- NOT committed yet -- deliberately left open

-- Session B, run concurrently -- exactly the main page's own code:
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SELECT balance FROM accounts WHERE account_id = 1;
-- HANGS -- blocked waiting for Session A's exclusive lock to release.
-- Confirms the main page's comment "waits for A to commit/rollback"
-- IS accurate for this configuration.

-- Session A finally commits:
-- COMMIT;
-- Only NOW does Session B's SELECT return, with the updated balance.`,
    },
    {
      label: 'RCSI enabled — the SAME code does NOT block',
      language: 'sql',
      code: `ALTER DATABASE CURRENT SET READ_COMMITTED_SNAPSHOT ON;

-- Session A:
BEGIN TRAN;
UPDATE accounts SET balance = balance - 1000 WHERE account_id = 1;
-- NOT committed yet

-- Session B, run concurrently -- IDENTICAL code to the previous test:
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
SELECT balance FROM accounts WHERE account_id = 1;
-- Returns IMMEDIATELY -- no blocking at all. Reads the last
-- COMMITTED version from the row-versioning store (the pre-Session-A
-- balance), NOT the uncommitted -1000 change (so still no dirty
-- read), and NOT waiting for Session A to finish either.
--
-- The exact same "READ COMMITTED" isolation level name, the exact
-- same SELECT statement, and a completely different concurrency
-- behavior -- purely due to the database-level RCSI setting the
-- dirty-read demo's own comment never accounts for.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer reads the main page\'s dirty-read demo, sees the comment "waits for A to commit/rollback" next to a plain READ COMMITTED SELECT, and concludes "READ COMMITTED always blocks readers behind uncommitted writers — that\'s just how it works." They then observe their own production database\'s READ COMMITTED queries NOT blocking in an identical scenario. What\'s the most likely explanation?',
    hint: 'The main page discusses RCSI as a separate, optional configuration in its own theory section — check whether that setting could explain the discrepancy.',
    solution: `The most likely explanation is that the developer's production
database has READ_COMMITTED_SNAPSHOT (RCSI) enabled, while the main
page's dirty-read demo comment assumes the traditional default
(RCSI OFF, locking READ COMMITTED). As demonstrated above, the
IDENTICAL SELECT under READ COMMITTED behaves completely differently
depending on this single database-level setting: it blocks without
RCSI, and returns immediately (reading the last committed version)
with RCSI enabled.

The developer's generalization — "READ COMMITTED always blocks" —
was an overgeneralization from one code example that never stated
its assumed configuration. The fix for their confusion is exactly
what this subtopic demonstrates: check SELECT
is_read_committed_snapshot_on FROM sys.databases WHERE name =
DB_NAME(); to determine which of the two genuinely different
behaviors "READ COMMITTED" actually produces on a given database,
rather than assuming the isolation level name alone determines the
concurrency behavior.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'READ COMMITTED in SQL Server always makes a reader block until a concurrent writer\'s transaction commits or rolls back — that\'s a fixed property of the isolation level.',
      reality: 'this is only true when READ_COMMITTED_SNAPSHOT is OFF (the traditional default). With RCSI enabled — a database-level setting the main page discusses separately — the same isolation level name reads from a version store instead, with readers never blocking on writers.',
    },
    {
      thought: 'the main page\'s dirty-read demo comment "waits for A to commit/rollback" is a universal statement about READ COMMITTED that holds on any SQL Server database.',
      reality: 'it\'s accurate only for the specific (though traditionally default) configuration where RCSI is disabled — the same code, same isolation level, and same scenario produces non-blocking behavior once RCSI is turned on.',
    },
    {
      thought: 'if a database\'s READ COMMITTED queries don\'t block the way a reference page\'s example describes, something is misconfigured or broken.',
      reality: 'non-blocking READ COMMITTED behavior is the correct, expected, and often deliberately-chosen result of RCSI being enabled — not a sign of misconfiguration, and it still fully avoids dirty reads.',
    },
  ];
}
