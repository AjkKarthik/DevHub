import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-demonstrating-execution-plan-regression-test-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-the-execution-plan-regression-test-the-page-only-describes.html',
  styleUrl: './demonstrating-the-execution-plan-regression-test-the-page-only-describes.scss',
})
export class DemonstratingTheExecutionPlanRegressionTestThePageOnlyDescribesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Technique Named, Not Shown',
      points: [
        'The main page\'s own "Practical tuning workflow" Step 5 states: "add execution plan assertions to integration tests — re-run EXPLAIN and assert \'should use Index Seek, not Seq Scan\' to catch regressions in CI." This is the only place on the page that mentions automated plan-regression testing, and it never shows what such a test actually looks like in code.',
        'The technique is directly implementable: capture the plan (as JSON in PostgreSQL, as XML in MSSQL), search it programmatically for the presence of a specific operator (Seq Scan / Table Scan), and fail the test if found — turning a silent performance regression (an index being dropped, a query being rewritten in a way that defeats an index, statistics going stale enough to flip the plan) into an explicit, CI-catchable failure.',
      ],
    },
    {
      heading: 'The Test Only Has Value If It Can Actually Catch a Regression',
      points: [
        'A plan-assertion test is only meaningful if demonstrated against a genuine regression — passing when the index exists, and failing when it doesn\'t (e.g., after the supporting index is dropped, simulating an accidental migration that removes it). Confirming both directions is what proves the test is actually load-bearing, not just always-green scaffolding.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'PostgreSQL — asserting no Seq Scan appears in the plan',
      language: 'sql',
      code: `-- Capture the plan as JSON and check for any "Seq Scan" node:
DO $$
DECLARE
    plan_json JSONB;
    has_seq_scan BOOLEAN;
BEGIN
    EXECUTE 'EXPLAIN (FORMAT JSON) SELECT * FROM orders WHERE customer_id = 42'
    INTO plan_json;

    -- Recursively search the plan tree for any "Node Type": "Seq Scan"
    SELECT EXISTS (
        SELECT 1 FROM jsonb_path_query(plan_json, '$.**."Node Type"') AS node_type
        WHERE node_type::text = '"Seq Scan"'
    ) INTO has_seq_scan;

    IF has_seq_scan THEN
        RAISE EXCEPTION 'Regression: query now uses Seq Scan instead of Index Scan on orders.customer_id';
    END IF;
END $$;
-- Passes silently when the plan uses Index Scan; raises an explicit,
-- CI-catchable exception the moment a regression drops it to a Seq Scan.`,
    },
    {
      label: 'MSSQL — asserting no Table Scan / Index Scan via plan XML',
      language: 'sql',
      code: `DECLARE @planXml XML;

SET SHOWPLAN_XML ON;
GO
SELECT * FROM Orders WHERE CustomerID = 42;
GO
SET SHOWPLAN_XML OFF;
-- (capture the returned plan XML into @planXml via your test harness /
-- SSMS "Save Plan As" / sys.dm_exec_query_plan for a scripted version)

;WITH XMLNAMESPACES (DEFAULT 'http://schemas.microsoft.com/sqlserver/2004/07/showplan')
SELECT COUNT(*) AS BadOperatorCount
FROM @planXml.nodes('//RelOp[@PhysicalOp = "Table Scan" or @PhysicalOp = "Index Scan"]') AS t(op);
-- Assert this returns 0 -- any Table Scan or Index Scan (as opposed to
-- Index Seek) on the Orders table signals a regression away from the
-- expected seek-based plan.`,
    },
    {
      label: 'Confirming the test actually catches a regression',
      language: 'sql',
      code: `-- With the supporting index present, the assertion passes silently:
CREATE INDEX IX_Orders_CustomerID ON Orders (CustomerID);
-- Run the PostgreSQL/MSSQL assertion above -- no exception raised.

-- Simulate a regression: an accidental migration drops the index
DROP INDEX IX_Orders_CustomerID ON Orders;   -- MSSQL
-- DROP INDEX ix_orders_customer_id;         -- PostgreSQL equivalent

-- Re-run the SAME assertion -- it now correctly FAILS:
-- PostgreSQL: "Regression: query now uses Seq Scan instead of Index Scan..."
-- MSSQL: BadOperatorCount returns 1, failing the test's expected-zero check

-- This confirms the test genuinely catches the class of regression it
-- claims to -- not just scaffolding that always passes regardless of
-- whether the index actually exists.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team adopts the main page\'s own Step 5 advice and writes an execution-plan assertion test for a critical, high-traffic query. Six months later, a routine index-maintenance script accidentally drops the exact index this query depends on, but production doesn\'t notice for two days because the CI plan-assertion test wasn\'t run against that specific query. What does this scenario reveal about the LIMITS of this testing technique, even when correctly implemented?',
    hint: 'The test itself is correctly implemented per the code tabs above — think about what has to happen for the test to even RUN, versus what it catches once it does run.',
    solution: `This scenario reveals that a plan-assertion test is only as protective
as its COVERAGE -- it can be perfectly implemented (correctly catching
a Seq Scan/Table Scan regression when it runs, exactly as demonstrated
in the third code tab) and still fail to prevent a production incident
if it is never actually EXECUTED against the specific query and index
combination that regressed. The technique protects the queries it is
written for; it says nothing about queries or indexes that don't have
a corresponding test.

This points to two practical implications beyond the main page's own
advice: (1) plan-assertion tests need to be written for every
genuinely critical, high-traffic query -- not just a representative
sample -- since coverage gaps are invisible until they cause an
incident; (2) index-maintenance scripts that can drop indexes should
themselves run against a pre-production environment where the full
suite of plan-assertion tests executes automatically, catching the
regression before it reaches production rather than relying solely on
per-query test authorship to anticipate every future maintenance
action.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own advice to "add execution plan assertions to integration tests" is a fully specified technique once you understand the general idea — the exact implementation is a minor detail.',
      reality: 'the page never shows a working implementation at all — actually building one requires knowing specifically how to programmatically extract and search plan JSON (PostgreSQL) or plan XML (MSSQL) for a specific operator, which is a real coding task, not a trivial detail.',
    },
    {
      thought: 'writing a plan-assertion test that currently passes is sufficient evidence that the test correctly catches the regression it is meant to guard against.',
      reality: 'a test that has never been run against an actual regression (e.g., with the index temporarily dropped) could be passing for the wrong reason — such as a bug in the plan-parsing logic that never finds a match regardless of the actual plan shape. Deliberately triggering the regression once, as shown in the third code tab, is what proves the test is load-bearing.',
    },
    {
      thought: 'once a critical query has a passing plan-assertion test in CI, that query is permanently protected against index-related performance regressions.',
      reality: 'the test only protects against regressions that occur in code paths where the test actually runs — an index dropped by an out-of-band maintenance script, or a query added later without its own test, remains completely unprotected regardless of how well the existing tests are written.',
    },
  ];
}
