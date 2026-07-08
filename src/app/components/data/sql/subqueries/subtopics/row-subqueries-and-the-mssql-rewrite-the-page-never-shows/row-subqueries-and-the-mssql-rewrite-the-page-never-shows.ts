import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-row-subqueries-mssql-rewrite-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './row-subqueries-and-the-mssql-rewrite-the-page-never-shows.html',
  styleUrl: './row-subqueries-and-the-mssql-rewrite-the-page-never-shows.scss',
})
export class RowSubqueriesAndTheMssqlRewriteThePageNeverShowsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Capability Mentioned Once, Demonstrated Nowhere',
      points: [
        'The main page\'s own Quick Reference for "Row subquery" states plainly: "Supported in PostgreSQL and MySQL; MSSQL requires rewriting as AND conditions." But none of the page\'s six code tabs contain a single row-subquery example, in either syntax — a reader who wants to actually use this feature, or understand what "rewriting as AND conditions" concretely looks like, has nothing to go on beyond that one sentence.',
        'A row subquery compares a ROW CONSTRUCTOR — a parenthesized list of expressions like (col1, col2) — against another row-valued expression, requiring EVERY position to match simultaneously: WHERE (col1, col2) = (SELECT a, b FROM T WHERE …). This is most useful when a composite key or composite value should be tested together as a single unit, especially in correlated queries that need to match on more than one column at once.',
      ],
    },
    {
      heading: 'The MSSQL Rewrite — What "AND Conditions" Actually Means',
      points: [
        'MSSQL raises a syntax error on row-constructor comparison syntax entirely — there is no direct equivalent. The rewrite requires testing each column individually with AND, using nested correlated subqueries to reproduce the "match on both columns simultaneously" semantics: instead of one row comparison, you get one scalar subquery per column, with later columns\' subqueries further correlated on the earlier columns already matched.',
        'This is functionally identical to the row subquery but loses the single-expression conciseness — the same underlying logic (find the row whose composite value matches a specific pair) now spans several nested comparisons instead of one clean row-constructor equality.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'PostgreSQL — a row subquery, finally demonstrated',
      language: 'sql',
      code: `-- Find, for each customer, the ONE order row that matches this
-- customer's own latest (order_date, order_id) pair -- using order_id
-- as a deterministic tie-breaker when two orders share a date:
SELECT o.*
FROM orders o
WHERE (o.order_date, o.order_id) = (
    SELECT order_date, order_id
    FROM orders o2
    WHERE o2.customer_id = o.customer_id
    ORDER BY order_date DESC, order_id DESC
    LIMIT 1
);
-- The row constructor (o.order_date, o.order_id) is compared against
-- the row-valued subquery result IN ONE EXPRESSION -- both columns
-- must match simultaneously for the row to qualify.`,
    },
    {
      label: 'MSSQL — the "AND conditions" rewrite the Quick Ref only mentions',
      language: 'sql',
      code: `-- MSSQL has no row-constructor comparison syntax -- this rewrite
-- reproduces the same "match both columns together" semantics using
-- nested scalar subqueries joined with AND:
SELECT o.*
FROM Orders o
WHERE o.OrderDate = (
    SELECT MAX(o2.OrderDate)
    FROM Orders o2
    WHERE o2.CustomerID = o.CustomerID
)
AND o.OrderID = (
    SELECT MAX(o3.OrderID)
    FROM Orders o3
    WHERE o3.CustomerID = o.CustomerID
      AND o3.OrderDate = (
          SELECT MAX(o4.OrderDate) FROM Orders o4 WHERE o4.CustomerID = o.CustomerID
      )
);
-- Same result as the PostgreSQL row subquery -- but the single row
-- comparison became two AND-ed scalar subqueries, with the second one
-- further correlated on the first column's already-matched value.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer copies the PostgreSQL row subquery from the first code tab directly into an MSSQL query and it fails with a syntax error near the opening parenthesis of <code>(o.order_date, o.order_id)</code>. Using the main page\'s own Quick Reference note and the rewrite above, explain what needs to change and why the rewrite requires nesting the second subquery inside the first\'s correlation.',
    hint: 'Think about what information the row subquery gets "for free" by comparing two columns in one expression, and what has to be reconstructed manually when that expression is split into two separate AND-ed conditions.',
    solution: `MSSQL simply does not support row-constructor comparison syntax
(col1, col2) = (subquery) at all -- the parenthesized list on the left
side of the equality is a parse error in MSSQL, regardless of what the
subquery returns. The fix, per the main page's own Quick Reference note,
is to rewrite it as AND-ed individual column comparisons.

The nesting matters because the row subquery's single comparison
implicitly ties the two columns together: it finds the row whose
(order_date, order_id) pair AS A UNIT matches the correlated
customer's latest pair. Splitting this into two independent AND-ed
scalar subqueries would incorrectly match a row whose OrderDate
happens to equal the customer's max date AND whose OrderID happens to
equal the customer's max ID, even if those two maxima come from
DIFFERENT rows (e.g. one order has the latest date, a different order
happens to have the highest ID). Nesting the OrderID subquery's
correlation on the already-resolved OrderDate value correctly
reproduces "the row matching the SAME latest date's own max ID," not
two independently-computed maxima that might belong to different rows.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s Quick Reference statement that row subqueries are "supported in PostgreSQL and MySQL" with an MSSQL rewrite is enough on its own to actually use the feature — the concept is simple enough not to need an example.',
      reality: 'without a concrete example, it is easy to assume the MSSQL "AND conditions" rewrite is just two independent scalar subqueries — when in fact the second subquery must be correlated on the first column\'s already-matched value to preserve the row subquery\'s "match as a unit" semantics.',
    },
    {
      thought: 'rewriting (col1, col2) = (subquery) as col1 = (subquery1) AND col2 = (subquery2), with two SEPARATE, uncorrelated subqueries, is equivalent to the original row subquery.',
      reality: 'if the two independent subqueries can each return their own maximum from DIFFERENT underlying rows, the AND-ed version can match a combination that does not correspond to any single real row — the second subquery must be correlated on the first column\'s value to reproduce the row subquery\'s all-columns-together matching.',
    },
    {
      thought: 'row subqueries are a MySQL/PostgreSQL-only feature with no real equivalent in MSSQL, making them unusable in cross-dialect code entirely.',
      reality: 'MSSQL has no direct syntax for row-constructor comparisons, but the same logical result is fully achievable with nested, correlated scalar subqueries — more verbose, but functionally complete.',
    },
  ];
}
