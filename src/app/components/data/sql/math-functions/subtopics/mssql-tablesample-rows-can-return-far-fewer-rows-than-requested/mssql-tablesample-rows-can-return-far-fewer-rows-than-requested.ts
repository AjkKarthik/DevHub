import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-mssql-tablesample-row-count-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './mssql-tablesample-rows-can-return-far-fewer-rows-than-requested.html',
  styleUrl: './mssql-tablesample-rows-can-return-far-fewer-rows-than-requested.scss',
})
export class MssqlTablesampleRowsCanReturnFarFewerRowsThanRequestedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Row Count That Isn\'t Really a Row Count',
      points: [
        'The main page shows: "SELECT * FROM orders TABLESAMPLE (1000 ROWS);" with no caveat, right alongside the accurate note that PostgreSQL\'s TABLESAMPLE SYSTEM "samples ~N% of data pages (fast, approximate)." The wording implies PostgreSQL\'s version is the approximate one and MSSQL\'s ROWS syntax gives you something closer to an exact count.',
        'MSSQL\'s TABLESAMPLE is ALSO page-based under the hood, regardless of whether you specify ROWS or PERCENT. The (1000 ROWS) clause is converted internally into an equivalent PERCENT value based on the table\'s current row-count statistics, and then SQL Server samples data PAGES using that percentage — not individual rows. The actual number of rows returned can differ substantially from 1000, and for small or unevenly distributed tables, it can return dramatically fewer rows than requested, including zero.',
      ],
    },
    {
      heading: 'Why Small Tables Are Especially Affected',
      points: [
        'TABLESAMPLE operates at the granularity of 8 KB data pages, not rows. If a table has very few pages (a common case for lookup tables, staging tables, or any table under a few thousand rows), the sampling algorithm may not select ANY of those pages at all — Microsoft\'s own documentation for TABLESAMPLE explicitly warns that it can return zero rows for tables with fewer than a certain number of pages.',
        'This subtopic demonstrates the gap directly: running TABLESAMPLE (1000 ROWS) against a table that has far fewer actual data pages than the algorithm expects, and observing a row count that is nowhere near 1000 — sometimes 0.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own example, checked with COUNT(*)',
      language: 'sql',
      code: `-- Table with realistic size but not huge -- e.g. 20,000 rows,
-- narrow columns (roughly 40 rows per 8KB page -- ~500 pages total)
SELECT COUNT(*) FROM orders;
-- 20000

SELECT COUNT(*) AS actual_sampled_rows
FROM (SELECT * FROM orders TABLESAMPLE (1000 ROWS)) AS sample;

-- Run this several times -- the result is NOT a stable 1000. It
-- might return 850, or 1240, or on a table with fewer pages than
-- expected, far fewer. TABLESAMPLE's ROWS syntax is an ESTIMATE
-- SQL Server converts into an equivalent PERCENT of PAGES, not a
-- guaranteed exact row count.`,
    },
    {
      label: 'A small table — TABLESAMPLE can return zero rows',
      language: 'sql',
      code: `CREATE TABLE lookup_codes (code CHAR(3), description VARCHAR(50));
-- Only 40 rows -- fits comfortably on a single 8KB data page.
INSERT INTO lookup_codes VALUES ('USD','US Dollar'), ('EUR','Euro'), ('GBP','British Pound');
-- (plus 37 more rows, all on the same page)

SELECT COUNT(*) FROM lookup_codes;
-- 40

SELECT COUNT(*) AS sampled
FROM (SELECT * FROM lookup_codes TABLESAMPLE (10 ROWS)) AS sample;

-- Can return 0 -- the sampling algorithm operates on whole PAGES,
-- and with the entire table fitting on one or a handful of pages,
-- the probabilistic page-selection can skip the table's page(s)
-- entirely. This is documented MSSQL behavior for TABLESAMPLE on
-- small tables, not a bug -- but it is genuinely surprising if you
-- expect "10 ROWS" to mean "return approximately 10 rows."`,
    },
    {
      label: 'The reliable alternative for small/exact sampling needs',
      language: 'sql',
      code: `-- When you need a GUARANTEED, exact row count (not an approximate,
-- page-based sample), use TOP with ORDER BY NEWID() instead:
SELECT TOP 10 * FROM lookup_codes ORDER BY NEWID();
-- Always returns exactly 10 rows (or all rows if the table has fewer)
-- -- at the cost of a full scan and sort, which TABLESAMPLE avoids.
--
-- Reserve TABLESAMPLE for LARGE tables where an approximate,
-- fast sample is acceptable and the page-count is high enough that
-- the requested ROWS/PERCENT reasonably approximates the actual
-- result -- exactly the "large tables" framing the main page's own
-- PostgreSQL TABLESAMPLE SYSTEM comment already uses, which should
-- apply equally to the MSSQL ROWS syntax.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A QA engineer writes a test that expects SELECT * FROM lookup_codes TABLESAMPLE (10 ROWS) to always return "about 10 rows" from a 40-row lookup table, and the test intermittently fails with 0 rows returned. Is this a flaky test environment issue, or is the query itself unreliable for this purpose — and what should replace it?',
    hint: 'Consider how many 8KB data pages a 40-row lookup table with narrow columns is likely to occupy, and what TABLESAMPLE actually samples at that granularity.',
    solution: `This is not a flaky environment — it's the query itself being
unreliable for this purpose. A 40-row table with narrow columns
almost certainly fits on a single 8KB data page (or very few pages).
TABLESAMPLE operates by probabilistically selecting whole PAGES, not
rows, so on a table this small, the sampling algorithm can easily
select zero pages, returning zero rows -- this is documented MSSQL
behavior specifically called out for small tables, not a fluke.

The fix is to replace TABLESAMPLE with SELECT TOP 10 ... ORDER BY
NEWID(), which performs an exact, guaranteed row-count sample (at the
cost of a full scan and sort). TABLESAMPLE should be reserved for
large tables where the performance benefit of page-based sampling is
worth the loss of an exact, guaranteed row count -- exactly the kind
of table the main page's PostgreSQL TABLESAMPLE SYSTEM example
correctly frames it for, a framing that should have been applied to
the MSSQL ROWS example just as consistently.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'MSSQL\'s TABLESAMPLE (1000 ROWS) syntax guarantees approximately 1000 rows are returned, unlike PostgreSQL\'s TABLESAMPLE SYSTEM which the main page already describes as "approximate."',
      reality: 'MSSQL\'s TABLESAMPLE is ALSO page-based internally regardless of the ROWS or PERCENT syntax used — the requested row count is converted to an estimated percentage of data pages to sample, and the actual returned row count can differ substantially from what was requested.',
    },
    {
      thought: 'TABLESAMPLE always returns roughly the requested number of rows, just with some statistical variance around that number.',
      reality: 'on small tables (few data pages), TABLESAMPLE can return ZERO rows entirely — this is documented MSSQL behavior, not a rare statistical edge case, because the algorithm can fail to select any of the table\'s handful of pages.',
    },
    {
      thought: 'TABLESAMPLE is always the right tool whenever you need a "sample" of N rows from a table, regardless of table size.',
      reality: 'TABLESAMPLE is specifically designed for fast, approximate sampling of LARGE tables — for small tables or when an exact row count is required, TOP N ... ORDER BY NEWID() (MSSQL) or ORDER BY RANDOM() LIMIT N (PostgreSQL) is the reliable choice, despite being slower.',
    },
  ];
}
