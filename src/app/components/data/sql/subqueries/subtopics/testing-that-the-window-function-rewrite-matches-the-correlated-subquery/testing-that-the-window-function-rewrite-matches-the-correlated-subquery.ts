import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-window-function-rewrite-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-window-function-rewrite-matches-the-correlated-subquery.html',
  styleUrl: './testing-that-the-window-function-rewrite-matches-the-correlated-subquery.scss',
})
export class TestingThatTheWindowFunctionRewriteMatchesTheCorrelatedSubquerySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Recommended Rewrite Is Not Automatically a Correct One',
      points: [
        'The main page\'s own theory strongly recommends rewriting the per-category "above-average products" correlated subquery as a window function for large tables — "far more efficient than per-row correlated subquery" — and shows both versions side by side in its own "Correlated subquery" code tab. It never proves the rewritten version returns the SAME rows as the original correlated subquery it replaces.',
        'A subtle mistake during the rewrite is easy to introduce and easy to miss: using the wrong PARTITION BY column, comparing against the wrong window alias, or accidentally using a non-strict inequality where the original used a strict one. Any of these silently changes which products qualify as "above average" — the query still runs without error and returns a plausible-looking result set.',
      ],
    },
    {
      heading: 'A Small, Hand-Verifiable Fixture Makes the Comparison Trivial',
      points: [
        'A fixture with one category and three products of known prices (e.g. 100, 150, 300) makes the correct "above average" set computable by hand: the average is 183.33, so only the 300-priced product qualifies. Running both the correlated-subquery version and the window-function rewrite against this fixture and asserting they return the exact same set (via EXCEPT/set difference, which is empty only when the two result sets are identical) catches any divergence introduced by the rewrite immediately.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'PostgreSQL — pgTAP proving the rewrite is equivalent',
      language: 'sql',
      code: `BEGIN;
SELECT plan(1);

-- Fixture: one category, three known prices
INSERT INTO products (product_id, category_id, unit_price) VALUES
  (1, 1, 100), (2, 1, 150), (3, 1, 300);

-- The two result sets must be IDENTICAL -- EXCEPT returns rows present
-- in one side but not the other; an empty result proves equivalence:
SELECT is(
  (SELECT COUNT(*) FROM (
    -- correlated subquery version
    (SELECT product_id FROM products p
     WHERE p.unit_price > (
       SELECT AVG(p2.unit_price) FROM products p2 WHERE p2.category_id = p.category_id
     ))
    EXCEPT
    -- window function rewrite
    (SELECT product_id FROM (
       SELECT product_id, unit_price,
              AVG(unit_price) OVER (PARTITION BY category_id) AS cat_avg
       FROM products
     ) t WHERE unit_price > cat_avg)
  ) diff)::int,
  0,
  'correlated subquery and window function rewrite return identical product sets'
);

SELECT * FROM finish();
ROLLBACK;`,
    },
    {
      label: 'MSSQL — tSQLt equivalent using EXCEPT',
      language: 'sql',
      code: `EXEC tSQLt.NewTestClass 'SubqueryRewriteTests';
GO

CREATE PROCEDURE SubqueryRewriteTests.[test window function rewrite matches correlated subquery]
AS
BEGIN
    INSERT INTO Products (ProductID, CategoryID, UnitPrice) VALUES
      (1, 1, 100), (2, 1, 150), (3, 1, 300);

    DECLARE @DiffCount INT;
    SELECT @DiffCount = COUNT(*) FROM (
        (SELECT ProductID FROM Products p
         WHERE p.UnitPrice > (
           SELECT AVG(p2.UnitPrice) FROM Products p2 WHERE p2.CategoryID = p.CategoryID
         ))
        EXCEPT
        (SELECT ProductID FROM (
           SELECT ProductID, UnitPrice,
                  AVG(UnitPrice) OVER (PARTITION BY CategoryID) AS CatAvg
           FROM Products
         ) t WHERE UnitPrice > CatAvg)
    ) AS diff;

    EXEC tSQLt.AssertEquals @Expected = 0, @Actual = @DiffCount;
END;
GO

EXEC tSQLt.Run 'SubqueryRewriteTests';`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate rewrites the correlated subquery from the main page as a window function, but accidentally partitions by <code>ProductID</code> instead of <code>CategoryID</code> — a plausible copy-paste slip when adapting the pattern to a new table. The query runs successfully and returns some rows. Using the test pattern above, how would this mistake be caught, and what would the failing assertion look like?',
    hint: 'Think about what PARTITION BY ProductID actually computes — how many rows end up in each "partition," and what that does to the resulting average.',
    solution: `Partitioning by ProductID instead of CategoryID means each partition
contains exactly ONE row (since ProductID is unique per product) — so
AVG(UnitPrice) OVER (PARTITION BY ProductID) simply returns each
product's own price as "the average," and UnitPrice > CatAvg becomes
UnitPrice > UnitPrice, which is never true. The window-function version
would return ZERO rows, while the correlated subquery version
correctly returns the 300-priced product.

The EXCEPT-based test would immediately reveal this: the correlated
subquery's result set (containing product_id 3) minus the window
function's result set (empty) leaves product_id 3 in the difference,
making the assertion's expected count of 0 fail with an actual count
of 1 — pinpointing exactly one row lost to the rewrite, rather than
requiring someone to notice a live report is quietly missing an
expected row.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a window-function rewrite that the main page explicitly recommends for performance is safe to apply without re-verifying correctness, since the page already vouches for the pattern.',
      reality: 'the main page vouches for the PATTERN in general — it does not verify any SPECIFIC application of it. A wrong PARTITION BY column, comparison operator, or alias during a real rewrite is a mistake the general pattern\'s correctness does not protect against.',
    },
    {
      thought: 'if a rewritten query runs without error and returns some plausible-looking rows, the rewrite preserved the original query\'s meaning.',
      reality: 'a rewrite can silently drop rows (as in the PARTITION BY ProductID example) or include extra ones while still executing successfully — only a direct comparison against the original query\'s result set (e.g. via EXCEPT) proves equivalence.',
    },
    {
      thought: 'EXCEPT-based equivalence testing only matters for large, complex queries — a small rewrite like this one is simple enough to verify by inspection.',
      reality: 'the PARTITION BY ProductID mistake is a one-word typo that is easy to miss during code review, and its effect (returning zero rows instead of one) is exactly the kind of small, plausible-looking discrepancy that inspection alone tends to miss.',
    },
  ];
}
