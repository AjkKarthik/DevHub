import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-detach-concurrently-transaction-block-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-that-detach-concurrently-cannot-run-in-a-transaction-block.html',
  styleUrl: './demonstrating-that-detach-concurrently-cannot-run-in-a-transaction-block.scss',
})
export class DemonstratingThatDetachConcurrentlyCannotRunInATransactionBlockSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two Places the Page Uses DETACH … CONCURRENTLY',
      points: [
        'The main page uses ALTER TABLE ... DETACH PARTITION ... CONCURRENTLY twice: once in the "PostgreSQL LIST & HASH + ATTACH/DETACH" code tab, and again in the challenge\'s own solution (DETACH PARTITION sensor_readings_2025_01 CONCURRENTLY). Neither location mentions that this specific form of DETACH has a documented restriction the plain (non-CONCURRENTLY) form does not.',
        'PostgreSQL\'s own documentation for ALTER TABLE states that DETACH PARTITION ... CONCURRENTLY cannot be run inside a transaction block. It internally performs its work as two separate transactions (an initial change plus a background wait, then a second short transaction to finalize) specifically so it can avoid blocking concurrent queries — a design that is incompatible with being wrapped inside the caller\'s own BEGIN…COMMIT.',
      ],
    },
    {
      heading: 'Why This Matters for the Challenge\'s Own Solution',
      points: [
        'The challenge\'s solution presents CREATE TABLE (parent + 3 children), 3 CREATE INDEX statements, and the final DETACH PARTITION … CONCURRENTLY as one unbroken block of SQL — the kind of script a developer might reasonably wrap in a single BEGIN … COMMIT for atomicity, exactly as they likely already do for the CREATE TABLE/CREATE INDEX portion in a migration tool.',
        'Doing that for the whole block fails specifically at the DETACH …CONCURRENTLY line: PostgreSQL raises an error stating the command cannot run inside a transaction block, while the plain DETACH PARTITION sensor_readings_2025_01; (without CONCURRENTLY) has no such restriction and runs fine inside a transaction — at the cost of briefly taking a stronger lock that blocks concurrent access, which is exactly what CONCURRENTLY exists to avoid.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the failure inside a transaction block',
      language: 'sql',
      code: `BEGIN;

CREATE TABLE sensor_readings (
    sensor_id   INT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    value       NUMERIC NOT NULL
) PARTITION BY RANGE (recorded_at);

CREATE TABLE sensor_readings_2025_01
PARTITION OF sensor_readings
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- ... remaining CREATE TABLE / CREATE INDEX statements from the
-- challenge's solution, all fine inside BEGIN ... COMMIT ...

ALTER TABLE sensor_readings
DETACH PARTITION sensor_readings_2025_01 CONCURRENTLY;

-- ERROR:  ALTER TABLE ... DETACH PARTITION ... CONCURRENTLY
--         cannot run inside a transaction block

COMMIT;`,
    },
    {
      label: 'The fix — run DETACH … CONCURRENTLY outside any transaction',
      language: 'sql',
      code: `BEGIN;
CREATE TABLE sensor_readings ( ... ) PARTITION BY RANGE (recorded_at);
CREATE TABLE sensor_readings_2025_01 PARTITION OF sensor_readings
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
-- ... remaining setup statements ...
COMMIT;

-- Run separately, with autocommit / no surrounding BEGIN:
ALTER TABLE sensor_readings
DETACH PARTITION sensor_readings_2025_01 CONCURRENTLY;
-- Succeeds -- runs as its own implicit transaction, exactly as
-- CONCURRENTLY's two-phase, non-blocking design requires.`,
    },
    {
      label: 'Alternative — drop CONCURRENTLY if atomicity matters more',
      language: 'sql',
      code: `BEGIN;
-- ... all setup statements ...

-- Plain DETACH (no CONCURRENTLY) has NO transaction-block
-- restriction -- it can be the last statement of the same
-- transaction as the CREATE TABLE/CREATE INDEX setup:
ALTER TABLE sensor_readings
DETACH PARTITION sensor_readings_2025_01;

COMMIT;
-- Trade-off: a plain DETACH takes a stronger lock for its (brief)
-- duration, so concurrent queries on sensor_readings can be blocked
-- during the detach -- exactly the cost CONCURRENTLY exists to
-- avoid. Choose plain DETACH only when brief blocking is acceptable
-- and single-transaction atomicity with the setup steps matters more.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A migration tool wraps every script in a single BEGIN … COMMIT for atomicity by default. A developer pastes the challenge\'s full solution — CREATE TABLE, three partitions, three indexes, and the final DETACH PARTITION … CONCURRENTLY — into that tool unmodified. What happens?',
    hint: 'Check which specific statement in the block has a documented restriction against running inside a transaction, and whether the migration tool\'s default wrapping would trigger it.',
    solution: `The migration fails at the DETACH PARTITION ... CONCURRENTLY
statement with an error that it cannot run inside a transaction
block -- even though every preceding statement (the CREATE TABLE,
partition definitions, and CREATE INDEX statements) runs
successfully inside the same transaction.

Two fixes are available: (1) split the script so DETACH ...
CONCURRENTLY runs as its own separate statement/transaction outside
the migration tool's automatic wrapping (if the tool supports
per-statement execution), or (2) drop CONCURRENTLY and accept the
plain DETACH PARTITION\'s brief stronger lock, which has no
transaction-block restriction and can stay inside the same atomic
migration. The right choice depends on whether the atomicity of a
single migration transaction or CONCURRENTLY's non-blocking
guarantee matters more for that deployment.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ALTER TABLE ... DETACH PARTITION ... CONCURRENTLY behaves like any other DDL statement and can always be wrapped in a BEGIN ... COMMIT alongside setup statements for atomicity.',
      reality: 'CONCURRENTLY specifically cannot run inside a transaction block — it needs to manage its own two-phase, non-blocking process internally, which is incompatible with the caller controlling the transaction boundary.',
    },
    {
      thought: 'the word CONCURRENTLY just means "runs a bit slower but otherwise behaves identically" to the plain form of the command.',
      reality: 'CONCURRENTLY changes the statement\'s transactional behavior, not just its performance characteristics — it trades single-transaction atomicity (and compatibility with an enclosing BEGIN block) for avoiding blocking locks.',
    },
    {
      thought: 'a challenge or reference solution that runs correctly when tested as separate, individually-executed statements will behave identically when a deployment tool wraps the whole script in one transaction.',
      reality: 'wrapping behavior is exactly the kind of environmental difference that surfaces CONCURRENTLY\'s transaction-block restriction — code that works statement-by-statement in a SQL client can still fail inside an automated migration runner\'s default transaction wrapping.',
    },
  ];
}
