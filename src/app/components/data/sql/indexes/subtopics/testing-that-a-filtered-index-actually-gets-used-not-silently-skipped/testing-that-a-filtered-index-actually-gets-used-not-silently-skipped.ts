import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-filtered-index-usage-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-a-filtered-index-actually-gets-used-not-silently-skipped.html',
  styleUrl: './testing-that-a-filtered-index-actually-gets-used-not-silently-skipped.scss',
})
export class TestingThatAFilteredIndexActuallyGetsUsedNotSilentlySkippedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '"The Optimiser Will Use It" Is a Claim, Not a Guarantee for Every Query',
      points: [
        'The main page\'s own theory states that a filtered index is used "only when it can prove the filter is always satisfied for the rows returned" — but never demonstrates a query that FAILS this proof. When the optimiser cannot prove it, the index is silently ignored: no error, no warning, just a plan that falls back to the base table or another index, typically slower than expected with no obvious cause.',
        'Two realistic ways this happens with the main page\'s own IX_Orders_ActiveByCustomer example (WHERE Status = \'Active\'): (1) a query using WHERE Status IN (\'Active\', \'Pending\') cannot use the filtered index at all, since the index does not contain \'Pending\' rows — the predicate does not imply the filter; (2) a query using a PARAMETERIZED predicate, WHERE Status = @status, often cannot use the filtered index either, because the optimiser typically cannot prove at compile time that @status will always equal \'Active\' for every execution of that cached plan.',
      ],
    },
    {
      heading: 'Confirming Usage Directly, Rather Than Assuming It',
      points: [
        'sys.dm_db_index_usage_stats (MSSQL) tracks seek/scan counts per index since the last restart. Running a literal-matching query and an IN-list or parameterized query back to back, then checking the delta in user_seeks for the filtered index, directly confirms which queries actually use it and which silently fall back — rather than assuming from the CREATE INDEX statement alone.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL — confirming the filtered index is used for a matching literal query',
      language: 'sql',
      code: `-- Snapshot seeks before running anything:
SELECT i.name, COALESCE(us.user_seeks, 0) AS SeeksBefore
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats us
    ON i.object_id = us.object_id AND i.index_id = us.index_id AND us.database_id = DB_ID()
WHERE i.name = 'IX_Orders_ActiveByCustomer';

-- Query with a LITERAL predicate matching the filter exactly:
SELECT CustomerID, OrderDate FROM Orders
WHERE CustomerID = 'ALFKI' AND Status = 'Active'
ORDER BY OrderDate DESC;

-- Snapshot seeks after -- user_seeks should have incremented by 1:
SELECT i.name, COALESCE(us.user_seeks, 0) AS SeeksAfter
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats us
    ON i.object_id = us.object_id AND i.index_id = us.index_id AND us.database_id = DB_ID()
WHERE i.name = 'IX_Orders_ActiveByCustomer';
-- Confirms: this exact query pattern genuinely uses the filtered index.`,
    },
    {
      label: 'MSSQL — the two realistic ways it silently falls back',
      language: 'sql',
      code: `-- Case 1: IN-list broadens beyond what the filter covers
SELECT CustomerID, OrderDate FROM Orders
WHERE CustomerID = 'ALFKI' AND Status IN ('Active', 'Pending')
ORDER BY OrderDate DESC;
-- IX_Orders_ActiveByCustomer cannot be used -- it contains only
-- Status = 'Active' rows, so it cannot satisfy a predicate that
-- ALSO needs 'Pending' rows. No error -- the plan silently falls
-- back to a different index or a full scan.

-- Case 2: a parameterized predicate the optimiser can't prove
DECLARE @status VARCHAR(20) = 'Active';
SELECT CustomerID, OrderDate FROM Orders
WHERE CustomerID = 'ALFKI' AND Status = @status
ORDER BY OrderDate DESC;
-- Even though @status happens to be 'Active' THIS time, the compiled
-- plan is often cached and reused for OTHER values of @status too --
-- the optimiser frequently cannot prove the filtered index's
-- predicate always holds for a parameter, and may not choose it at all.

-- Confirm via the same DMV check: user_seeks on IX_Orders_ActiveByCustomer
-- does NOT increment for either of these two queries, despite both
-- LOOKING like they should benefit from the filtered index.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team builds the main page\'s own filtered index (<code>WHERE Status = \'Active\'</code>) expecting it to speed up their "active orders" report, but the report — which uses a parameterized <code>WHERE Status = @status</code> predicate in a stored procedure — shows no improvement. Using the DMV technique above, how would you confirm whether the filtered index is actually being used, and what\'s the most likely fix if it isn\'t?',
    hint: 'Check sys.dm_db_index_usage_stats before and after running the stored procedure — does user_seeks for the filtered index move at all?',
    solution: `Run the stored procedure, then check sys.dm_db_index_usage_stats for
IX_Orders_ActiveByCustomer's user_seeks (and user_scans) before and
after. If neither counter moves, the filtered index is confirmed to be
unused by this specific query pattern -- most likely because the
optimiser cannot prove, from a parameter alone, that @status will
always equal 'Active' for every execution of the cached plan.

The most likely fix is to stop relying on the filtered index matching
a parameterized predicate at all: either use OPTION (RECOMPILE) on the
specific query so the optimiser can evaluate the literal parameter
value at each execution (at the cost of recompiling every time), or --
more robustly -- restructure the stored procedure to use dynamic SQL
with the status value inlined as a literal when it is known to always
be 'Active' for this particular code path, so the optimiser can prove
the filter predicate is satisfied and choose the filtered index.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'once a filtered index is created matching a common query\'s WHERE clause, every future query with a similar-looking WHERE clause will automatically benefit from it.',
      reality: 'the optimiser only uses a filtered index when it can PROVE the query\'s predicate is always satisfied by the filter — a broader predicate (IN-list) or a parameterized predicate the optimiser can\'t evaluate at compile time will often be silently ignored, with the plan falling back to a different index or a full scan.',
    },
    {
      thought: 'if a filtered index isn\'t being used as expected, the query would show an error or an obviously degraded plan that makes the problem easy to spot.',
      reality: 'a query that silently fails to use a filtered index runs successfully and often still returns correct results, just via a less efficient plan — there is no error, and the only way to confirm what actually happened is checking the DMVs or the execution plan directly.',
    },
    {
      thought: 'parameterized queries and filtered/partial indexes work together the same way literal-value queries do, since both express the same logical condition.',
      reality: 'the optimiser evaluates literal predicates against the filter\'s definition at compile time, but a parameter\'s value is often unknown until execution — for a cached, reused plan, the optimiser frequently cannot prove the filter is satisfied for every possible parameter value, and may skip the filtered index entirely.',
    },
  ];
}
