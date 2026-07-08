import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-switch-target-not-partitioned-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-switch-to-orders-archive-partition-1-is-invalid-syntax.html',
  styleUrl: './testing-that-switch-to-orders-archive-partition-1-is-invalid-syntax.scss',
})
export class TestingThatSwitchToOrdersArchivePartition1IsInvalidSyntaxSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s SWITCH Statement',
      points: [
        'The "MSSQL partition switch (archival)" code tab creates orders_archive as a plain, NON-partitioned table (CREATE TABLE orders_archive (...) ON [PRIMARY]; — no PARTITION SCHEME clause anywhere), then runs: ALTER TABLE orders_partitioned SWITCH PARTITION 1 TO orders_archive PARTITION 1;',
        'That statement names a "PARTITION 1" on the TARGET side of the switch (orders_archive PARTITION 1). But SQL Server only accepts a target-side PARTITION clause when the target table is itself partitioned — orders_archive never was.',
      ],
    },
    {
      heading: 'The Correct Syntax for a Non-Partitioned Target',
      points: [
        'Per SQL Server\'s ALTER TABLE ... SWITCH grammar, switching a partition OUT of a partitioned table INTO a plain (non-partitioned) table omits the target-side PARTITION clause entirely: ALTER TABLE orders_partitioned SWITCH PARTITION 1 TO orders_archive; — no "PARTITION 1" after the target table name.',
        'The target-side "PARTITION n" form is only valid for a partition-to-partition switch between two tables that share the SAME partition function — which orders_archive, created with no ON scheme(...) clause, does not have.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the main page\'s exact statement',
      language: 'sql',
      code: `CREATE TABLE orders_archive (
    order_id   INT NOT NULL,
    order_date DATE NOT NULL,
    customer_id INT NOT NULL,
    amount     DECIMAL(10,2) NOT NULL
) ON [PRIMARY];   -- plain table, no partition scheme

CREATE CLUSTERED INDEX cx_archive ON orders_archive (order_date, order_id);

ALTER TABLE orders_partitioned
SWITCH PARTITION 1
TO orders_archive PARTITION 1;

-- Msg 4982, Level 16, State 1
-- ALTER TABLE SWITCH statement failed. Target table 'orders_archive'
-- is not partitioned, but the statement specified a target partition.`,
    },
    {
      label: 'The fix — omit the target-side PARTITION clause',
      language: 'sql',
      code: `ALTER TABLE orders_partitioned
SWITCH PARTITION 1
TO orders_archive;
-- No "PARTITION 1" after the target table name -- succeeds.
-- Command(s) completed successfully.

SELECT COUNT(*) FROM orders_archive;   -- January 2024 rows now here
SELECT COUNT(*) FROM orders_partitioned
WHERE $PARTITION.pf_orders_monthly(order_date) = 1;  -- 0`,
    },
    {
      label: 'When target-side PARTITION n IS valid — both sides partitioned',
      language: 'sql',
      code: `-- Only valid if orders_archive were ALSO built ON a partition scheme,
-- e.g. reusing the same function/scheme for a staging copy:
CREATE TABLE orders_archive_partitioned (
    order_id   INT NOT NULL,
    order_date DATE NOT NULL,
    customer_id INT NOT NULL,
    amount     DECIMAL(10,2) NOT NULL
) ON ps_orders_monthly(order_date);   -- same partition scheme

CREATE CLUSTERED INDEX cx_archive_p
ON orders_archive_partitioned (order_date, order_id);

-- NOW a target-side "PARTITION 1" is meaningful and valid:
ALTER TABLE orders_partitioned
SWITCH PARTITION 1
TO orders_archive_partitioned PARTITION 1;`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You copy the main page\'s exact "MSSQL partition switch (archival)" code tab into SSMS, including the orders_archive CREATE TABLE statement, and run it end to end. What happens at the final SWITCH statement?',
    hint: 'Check whether orders_archive\'s own CREATE TABLE statement includes an ON partition_scheme(...) clause anywhere in the code tab.',
    solution: `It fails with error 4982: "ALTER TABLE SWITCH statement failed.
Target table 'orders_archive' is not partitioned, but the statement
specified a target partition." orders_archive was created as a
plain table with no ON partition_scheme(...) clause, so it has no
partition 1 (or any partition) to switch into -- specifying "TO
orders_archive PARTITION 1" is invalid syntax for a non-partitioned
target.

The fix is to drop the target-side PARTITION clause: ALTER TABLE
orders_partitioned SWITCH PARTITION 1 TO orders_archive; -- this
succeeds and moves the January 2024 rows into orders_archive as a
metadata-only operation, exactly as the surrounding comments
describe, just without the invalid "PARTITION 1" suffix on the
non-partitioned target.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the target table name in a SWITCH statement can always be followed by "PARTITION n" to be explicit about where the data is going, regardless of whether the target itself is partitioned.',
      reality: 'the target-side PARTITION clause is only valid syntax when the target table is itself built on a partition scheme. Switching into a plain, non-partitioned table omits it entirely.',
    },
    {
      thought: 'copying a reference page\'s SQL code tab verbatim into a test database is a safe way to confirm the concept works before adapting it to a real schema.',
      reality: 'this exact code tab fails on the very last statement with a clear, specific error — always run reference code end to end (not just read it) before relying on it as a template.',
    },
    {
      thought: 'a SWITCH failure due to a non-partitioned target is the same category of problem as a schema mismatch (different columns or clustered index) between source and target.',
      reality: 'schema mismatches and missing/incompatible clustered indexes produce different error numbers than error 4982 — this specific error is about the PARTITION clause itself referring to a partition that does not exist on that table.',
    },
  ];
}
