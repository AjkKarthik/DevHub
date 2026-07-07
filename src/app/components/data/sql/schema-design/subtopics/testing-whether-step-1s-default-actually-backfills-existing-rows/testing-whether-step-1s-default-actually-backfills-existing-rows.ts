import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-step-1-default-backfill-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-whether-step-1s-default-actually-backfills-existing-rows.html',
  styleUrl: './testing-whether-step-1s-default-actually-backfills-existing-rows.scss',
})
export class TestingWhetherStep1sDefaultActuallyBackfillsExistingRowsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Why Step 2 Exists Is Never Actually Confirmed',
      points: [
        'The main page\'s own 3-step NOT NULL migration recipe includes an explicit Step 2 — "backfill existing rows in batches" — right after Step 1 adds the column with a DEFAULT. This only makes sense if Step 1\'s DEFAULT does NOT retroactively populate pre-existing rows. That assumption is correct for MSSQL but never actually tested, and — critically — it is NOT uniformly true across both dialects the page covers.',
        'In MSSQL, ALTER TABLE ADD column DEFAULT value is a metadata-only operation for a nullable column: existing rows are left genuinely NULL, and the DEFAULT only applies going forward, to future INSERTs that omit the column. Step 2\'s batch UPDATE loop is genuinely required to backfill them.',
      ],
    },
    {
      heading: 'PostgreSQL 11+ Makes Step 2 Unnecessary — and Actively Wasteful',
      points: [
        'PostgreSQL 11 introduced an optimization for ADD COLUMN ... DEFAULT constant: instead of rewriting the table, the engine records the default value in the catalog as a per-attribute "missing value," and any read of an existing row that has no physical value for that column returns the recorded default — not NULL. This means Step 1 ALONE already logically backfills every existing row in PostgreSQL 11+, with zero additional writes.',
        'Running the main page\'s own Step 2 batch-UPDATE loop in PostgreSQL doesn\'t just waste effort — it actively defeats the entire point of the PG 11 optimization, which specifically exists to avoid a table rewrite. The batch UPDATE forces exactly the write I/O and WAL growth the optimization was designed to eliminate.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL — confirming existing rows stay NULL after Step 1 alone',
      language: 'sql',
      code: `-- Pre-existing rows before the migration:
INSERT INTO Orders (OrderID, CustomerID) VALUES (1, 100), (2, 101), (3, 102);

-- Step 1 ONLY -- do NOT run Step 2 yet:
ALTER TABLE Orders ADD ShipRegion VARCHAR(50) NULL DEFAULT 'NA';

-- Confirm: are the pre-existing rows already 'NA', or still NULL?
SELECT COUNT(*) AS StillNullCount
FROM Orders WHERE ShipRegion IS NULL;
-- Returns 3 -- ALL pre-existing rows are still NULL. The DEFAULT only
-- applies to future INSERTs that omit ShipRegion, confirming Step 2's
-- batch backfill is genuinely necessary in MSSQL.`,
    },
    {
      label: 'PostgreSQL 11+ — confirming Step 1 alone is already sufficient',
      language: 'sql',
      code: `-- Same pre-existing rows:
INSERT INTO orders (order_id, customer_id) VALUES (1, 100), (2, 101), (3, 102);

-- Step 1 ONLY -- the PostgreSQL equivalent:
ALTER TABLE orders ADD COLUMN ship_region VARCHAR(50) DEFAULT 'NA';

-- Confirm: are the pre-existing rows already 'NA'?
SELECT COUNT(*) AS StillNullCount
FROM orders WHERE ship_region IS NULL;
-- Returns 0 -- EVERY pre-existing row already reads back 'NA',
-- with NO UPDATE statement ever having run. PostgreSQL 11's catalog
-- based "missing default" optimization means Step 1 alone is
-- sufficient here -- running the main page's own Step 2 batch-UPDATE
-- loop against this table would only add unnecessary write I/O.

-- Verify no physical rewrite happened: page count stays unchanged
-- immediately after Step 1 alone (checked via pg_relation_size()),
-- confirming this really is a metadata-only operation in PostgreSQL.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team follows the main page\'s own 3-step migration recipe exactly, including the batch-UPDATE Step 2, against a 50-million-row PostgreSQL 14 table. The migration takes 40 minutes and generates a large WAL spike, surprising the team since they expected it to be "instant" per PostgreSQL\'s reputation for fast column additions. What went wrong, and what should the migration script have done differently for this specific dialect?',
    hint: 'Check whether Step 1 alone, in PostgreSQL 11+, already achieves what Step 2 is trying to do — and what Step 2\'s batch UPDATE actually costs if it turns out to be unnecessary.',
    solution: `The team ran an unnecessary Step 2 against PostgreSQL 11+, which
already backfills existing rows LOGICALLY via its catalog-based
"missing default" optimization the moment Step 1 completes -- with
zero physical writes. Running Step 2's batch UPDATE loop anyway forces
PostgreSQL to physically rewrite all 50 million rows' worth of
ship_region values, generating exactly the WAL volume and write I/O
the PG 11 optimization exists to avoid -- the 40-minute runtime and
WAL spike are the direct cost of that unnecessary rewrite.

The migration script should have skipped Step 2 entirely for
PostgreSQL 11+: Step 1 (ADD COLUMN ... DEFAULT 'NA') alone is
sufficient, verified by checking that ship_region IS NULL returns 0
rows immediately after Step 1, with no UPDATE ever having run. Step 2
remains necessary only for the MSSQL side of a cross-dialect migration
script, where ADD COLUMN ... DEFAULT genuinely does leave existing
rows NULL.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own 3-step "safely add NOT NULL" migration recipe applies identically to MSSQL and PostgreSQL, since both are covered generically in the same Q&A entry.',
      reality: 'Step 2 (batch backfill) is genuinely required in MSSQL but is redundant, wasted work in PostgreSQL 11+, where Step 1 alone already logically backfills every row via a catalog-based optimization — the page never distinguishes this dialect-specific difference.',
    },
    {
      thought: 'adding a column with a DEFAULT value in any modern SQL database automatically populates existing rows with that value.',
      reality: 'this depends entirely on the specific engine and version — MSSQL genuinely leaves existing rows NULL (metadata-only operation, default applies only going forward), while PostgreSQL 11+ makes existing rows LOGICALLY read back the default without any physical write, via a fundamentally different mechanism.',
    },
    {
      thought: 'running extra, unnecessary steps in a database migration script is harmless — at worst it just wastes a little time.',
      reality: 'running PostgreSQL\'s Step 2 batch-UPDATE loop unnecessarily actively triggers a full table rewrite, generating real WAL growth, disk I/O, and lock contention that the PG 11 optimization specifically exists to avoid — it is not a harmless no-op.',
    },
  ];
}
