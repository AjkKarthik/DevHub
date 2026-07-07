import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-row-multiplication-fix-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-row-multiplication-fix-actually-prevents-double-counting.html',
  styleUrl: './testing-that-the-row-multiplication-fix-actually-prevents-double-counting.scss',
})
export class TestingThatTheRowMultiplicationFixActuallyPreventsDoubleCountingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Plausible-Looking Wrong Number Is the Real Risk',
      points: [
        'The main page\'s own row-multiplication section explains, at length, why joining two independent one-to-many tables (orders and addresses) to the same customer inflates row counts and double-counts SUM(total) — and offers two fixes (pre-aggregate in a CTE, or use correlated subqueries). But nothing on the page PROVES either fix actually returns the correct total on a concrete example. Someone could apply "Fix A" from the page, introduce a subtle typo in the CTE\'s GROUP BY, or a future refactor could accidentally re-introduce the direct three-table join — and the query would still run without error, returning a plausible-looking number that is simply wrong.',
        'A test built on a tiny, fully controlled fixture makes the correct answer computable by hand: one customer, two orders with a KNOWN sum, and two addresses. The expected total is unambiguous, so any deviation — including a silent regression back to the buggy direct-join pattern — is caught by a single assertion, rather than requiring someone to notice "the numbers look a little off" in a large production report months later.',
      ],
    },
    {
      heading: 'The Test Also Proves the Bug, Not Just the Fix',
      points: [
        'A useful regression test does both halves: assert the CORRECT (CTE-based) query returns the known total, AND assert that the BUGGY direct-join pattern the main page warns against returns exactly double that total on the same fixture. Proving the bug\'s exact failure mode on a small, controlled dataset makes the test\'s purpose self-documenting — anyone reading it later immediately understands what regression it exists to prevent, not just what value it expects.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL — tSQLt test proving the fix and the bug',
      language: 'sql',
      code: `EXEC tSQLt.NewTestClass 'RowMultiplicationTests';
GO

CREATE PROCEDURE RowMultiplicationTests.[test CTE fix returns correct total, not doubled]
AS
BEGIN
    -- Fixture: customer 1 has 2 orders (total 300) and 2 addresses
    INSERT INTO customers (customer_id) VALUES (1);
    INSERT INTO orders (order_id, customer_id, total) VALUES (10, 1, 100), (11, 1, 200);
    INSERT INTO addresses (address_id, customer_id) VALUES (100, 1), (101, 1);

    -- The BUGGY direct three-table join the main page warns against:
    DECLARE @buggy DECIMAL(10,2);
    SELECT @buggy = SUM(o.total)
    FROM customers c
    JOIN orders    o ON o.customer_id = c.customer_id
    JOIN addresses a ON a.customer_id = c.customer_id;
    -- 2 orders x 2 addresses = 4 joined rows -> SUM = 300 x 2 = 600 (WRONG)
    EXEC tSQLt.AssertEquals @Expected = 600, @Actual = @buggy;  -- documents the bug

    -- The main page's own "Fix A" (pre-aggregate before joining):
    DECLARE @fixed DECIMAL(10,2);
    WITH order_totals AS (
        SELECT customer_id, SUM(total) AS total_revenue FROM orders GROUP BY customer_id
    )
    SELECT @fixed = ot.total_revenue
    FROM customers c JOIN order_totals ot ON ot.customer_id = c.customer_id
    WHERE c.customer_id = 1;
    EXEC tSQLt.AssertEquals @Expected = 300, @Actual = @fixed;  -- proves the fix is correct
END;
GO

EXEC tSQLt.Run 'RowMultiplicationTests';`,
    },
    {
      label: 'PostgreSQL — pgTAP equivalent',
      language: 'sql',
      code: `BEGIN;
SELECT plan(2);

INSERT INTO customers (customer_id) VALUES (1);
INSERT INTO orders (order_id, customer_id, total) VALUES (10, 1, 100), (11, 1, 200);
INSERT INTO addresses (address_id, customer_id) VALUES (100, 1), (101, 1);

-- Buggy direct join: documents the exact doubling the main page describes
SELECT is(
  (SELECT SUM(o.total) FROM customers c
     JOIN orders o ON o.customer_id = c.customer_id
     JOIN addresses a ON a.customer_id = c.customer_id)::numeric,
  600.00,
  'buggy direct 3-table join double-counts to 600, not 300'
);

-- Fixed version: pre-aggregate orders before joining
SELECT is(
  (WITH order_totals AS (
     SELECT customer_id, SUM(total) AS total_revenue FROM orders GROUP BY customer_id
   )
   SELECT ot.total_revenue FROM customers c
     JOIN order_totals ot ON ot.customer_id = c.customer_id
   WHERE c.customer_id = 1)::numeric,
  300.00,
  'CTE pre-aggregation fix returns the correct, un-doubled total'
);

SELECT * FROM finish();
ROLLBACK;`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate refactors the category revenue report from the main page\'s own "Fix A" pattern, replacing the pre-aggregated <code>order_totals</code> CTE with a direct join back to <code>orders</code> "to simplify the query" — while leaving the <code>addresses</code> join in place for an unrelated address-count column. The query still runs without error. Using the test pattern above, how would you catch this regression, and what would the assertion actually reveal?',
    hint: 'Think about what happens to the SUM(total) result the moment the pre-aggregation CTE is removed but a second one-to-many join is still present in the same query.',
    solution: `Removing the pre-aggregation CTE re-introduces the exact row-multiplication
bug the main page describes: with orders and addresses both joined
directly to customers again, each order row pairs with each address
row, and SUM(total) is inflated by a factor equal to the address count
for each customer. On the fixture above (2 orders, 2 addresses), the
regression test's assertion of 300 would fail — the query would now
return 600, immediately flagging the regression with a clear, exact
mismatch rather than a vague "revenue looks a bit high" symptom
someone would otherwise have to notice manually in a live report.

This is exactly why the test fixture is deliberately small and the
expected values are hand-computable: a 2x inflation on a known total
of 300 is an unmistakable, unambiguous signal of the bug — a real
production dataset with irregular order/address counts per customer
would make the same bug's symptom much harder to spot by eye.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'once you understand WHY row multiplication happens (from reading the main page\'s theory), you don\'t need an automated test — you\'ll just remember to avoid the buggy pattern in future queries.',
      reality: 'understanding the mechanism does not prevent a future teammate (or your own future self) from reintroducing the exact same pattern during a "simplification" refactor — an automated regression test catches it regardless of who touches the query or why.',
    },
    {
      thought: 'a query using the row-multiplication bug pattern will look obviously wrong or produce an error, making a dedicated test unnecessary.',
      reality: 'the buggy query runs successfully and returns a plausible-looking number (just too large) — there is no error and no obvious visual signal that anything is wrong, which is exactly what makes it dangerous and worth testing for explicitly.',
    },
    {
      thought: 'testing an aggregate query like this only requires checking that it runs without a SQL error.',
      reality: 'both the buggy and the fixed version of this query run without any SQL error — only an assertion against a known, hand-computed expected VALUE (not just "did it execute") can distinguish correct behavior from the row-multiplication bug.',
    },
  ];
}
