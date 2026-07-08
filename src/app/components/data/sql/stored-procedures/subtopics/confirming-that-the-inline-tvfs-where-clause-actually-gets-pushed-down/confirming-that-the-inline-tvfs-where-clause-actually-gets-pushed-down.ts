import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-confirming-itvf-pushdown-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './confirming-that-the-inline-tvfs-where-clause-actually-gets-pushed-down.html',
  styleUrl: './confirming-that-the-inline-tvfs-where-clause-actually-gets-pushed-down.scss',
})
export class ConfirmingThatTheInlineTvfsWhereClauseActuallyGetsPushedDownSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Precise Claim, Stated Without Evidence',
      points: [
        'The main page\'s own comment on GetOrderSummary states plainly: "The optimiser sees through GetOrderSummary, pushes the WHERE into it, and uses the index on Orders.CustomerID" — a precise, checkable claim about optimizer behavior, presented with no execution plan to back it up.',
        'The claim is checkable directly: if SELECT * FROM dbo.GetOrderSummary(42) WHERE Total > 500 is truly inlined, its execution plan should look IDENTICAL to writing the JOIN/GROUP BY/HAVING logic directly inline in the calling query — no separate "table-valued function" operator boundary anywhere in the plan.',
      ],
    },
    {
      heading: 'The Contrast With a Multi-Statement TVF Makes the Difference Visible',
      points: [
        'A multi-statement TVF (MSTVF) performing the identical logic, but populating a declared table variable through separate INSERT steps, is genuinely NOT inlined. Its plan shows a distinct, opaque "Table Valued Function" operator with a fixed cardinality estimate (a historical constant like 1 or 100 rows, independent of the actual data) — the optimizer cannot see inside it to push the WHERE Total > 500 predicate down, or use any index on the underlying Orders table for this specific query.',
        'Comparing the two plans side by side — one with no TVF boundary at all, one with a clearly opaque black-box operator — is what actually confirms the main page\'s inlining claim, rather than trusting the comment on faith.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming inlining — the iTVF\'s plan has no function boundary',
      language: 'sql',
      code: `SET SHOWPLAN_XML ON;
GO
SELECT * FROM dbo.GetOrderSummary(42) WHERE Total > 500;
GO
SET SHOWPLAN_XML OFF;

-- Search the plan XML for any element named "TvfCall" or a distinct
-- RelOp with an inner "TableValuedFunction" operator -- there is NONE.
-- The plan instead shows an ordinary Hash Match (Join) between Orders
-- and OrderDetails, an Index Seek on IX_Orders_CustomerID (@CustomerID
-- = 42 pushed all the way into the seek predicate), a Stream Aggregate
-- for the GROUP BY, and a Filter for Total > 500 applied to the
-- aggregated rows -- exactly the plan you'd get writing the JOIN/
-- GROUP BY/HAVING directly inline, with no trace of a function call
-- boundary anywhere.`,
    },
    {
      label: 'Contrast — a multi-statement TVF is genuinely opaque',
      language: 'sql',
      code: `CREATE FUNCTION dbo.GetOrderSummary_MSTVF (@CustomerID INT)
RETURNS @Result TABLE (OrderID INT, OrderDate DATETIME2, Total DECIMAL(12,2))
AS
BEGIN
    INSERT INTO @Result
    SELECT o.OrderID, o.OrderDate, SUM(od.Quantity * od.UnitPrice)
    FROM Orders o
    JOIN OrderDetails od ON o.OrderID = od.OrderID
    WHERE o.CustomerID = @CustomerID
    GROUP BY o.OrderID, o.OrderDate;
    RETURN;
END;

SET SHOWPLAN_XML ON;
GO
SELECT * FROM dbo.GetOrderSummary_MSTVF(42) WHERE Total > 500;
GO
SET SHOWPLAN_XML OFF;

-- This plan DOES show a distinct "Table Valued Function" operator --
-- an opaque node the optimizer cannot see through. Its estimated row
-- count is a fixed constant (100 rows on modern SQL Server, regardless
-- of how many orders customer 42 actually has), and WHERE Total > 500
-- is applied as a Filter AFTER the function returns -- Orders.CustomerID
-- index is never used for THIS query at all, since the function body
-- runs independently of the outer query's predicate.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate benchmarks <code>SELECT * FROM dbo.GetOrderSummary(42) WHERE Total > 500</code> against the equivalent MSTVF version and is surprised the iTVF version is dramatically faster on a table with millions of orders, despite both functions containing "the same query." Using the plan evidence above, explain the actual mechanism behind the speed difference — not just "one is faster," but specifically WHERE the extra work happens in the MSTVF version.',
    hint: 'Think about what the MSTVF version has to compute BEFORE it can even apply the WHERE Total > 500 filter, versus what the iTVF version can skip entirely.',
    solution: `The MSTVF version must first execute its ENTIRE body -- the full JOIN
and GROUP BY across every order belonging to customer 42, with no
predicate pushdown -- populating the table variable completely before
the outer query's WHERE Total > 500 filter is ever applied. If
customer 42 has thousands of orders, the MSTVF computes summaries for
ALL of them internally, then discards most of them in a final Filter
step. Because the function body is opaque to the optimizer, it cannot
use the index on Orders.CustomerID to seek directly to this
customer's rows either -- the join plan inside the MSTVF is planned in
isolation from the calling query's actual data volume.

The iTVF version, by contrast, is expanded inline at compile time --
the optimizer treats the WHERE CustomerID = @CustomerID and the outer
WHERE Total > 500 as part of ONE query it can plan holistically,
enabling the Index Seek on Orders.CustomerID and applying the
aggregation Filter as part of a single, unified execution plan. The
speed difference comes specifically from predicate pushdown and index
usage being possible in one case and structurally impossible in the
other -- not from any difference in the SQL logic itself, which is
identical between the two functions.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own comment "the optimiser sees through GetOrderSummary, pushes the WHERE into it" is a general architectural description that doesn\'t need to be checked against a specific execution plan — it\'s just how inline TVFs work by definition.',
      reality: 'while inlining is a real, documented SQL Server behavior for inline TVFs specifically, confirming it for THIS query against a real execution plan is what actually verifies the claim, rather than assuming the general rule applies without exception to every case.',
    },
    {
      thought: 'an inline TVF and a multi-statement TVF containing "the same SQL query" should have roughly the same performance characteristics, since they compute the same result.',
      reality: 'the two are fundamentally different from the optimizer\'s perspective — the inline TVF is expanded into the calling query and planned holistically, while the multi-statement TVF is an opaque, separately-planned black box, even when their SELECT logic is textually identical.',
    },
    {
      thought: 'a multi-statement TVF\'s cardinality estimate reflects the actual expected row count for the specific customer being queried.',
      reality: 'a multi-statement TVF\'s cardinality estimate is a fixed constant baked into the optimizer\'s handling of opaque table-valued functions, independent of the actual data — it does not adjust based on which customer ID is passed in.',
    },
  ];
}
