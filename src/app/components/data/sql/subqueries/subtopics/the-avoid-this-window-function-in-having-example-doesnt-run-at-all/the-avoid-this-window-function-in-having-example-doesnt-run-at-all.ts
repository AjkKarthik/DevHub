import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-window-function-in-having-invalid-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './the-avoid-this-window-function-in-having-example-doesnt-run-at-all.html',
  styleUrl: './the-avoid-this-window-function-in-having-example-doesnt-run-at-all.scss',
})
export class TheAvoidThisWindowFunctionInHavingExampleDoesntRunAtAllSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Comment Says "Avoid" — the Reality Is "This Doesn\'t Run"',
      points: [
        'The main page\'s own final example in "Subquery vs CTE vs JOIN" places a window function directly inside a HAVING clause: HAVING SUM(o.Freight) OVER (PARTITION BY o.CustomerID) > 10000, with the comment "Avoid: use derived table/CTE with HAVING for cleaner aggregation filter." That phrasing implies this version is valid SQL that merely reads worse than the alternatives.',
        'In fact, window functions are logically evaluated AFTER the WHERE, GROUP BY, and HAVING phases in both dialects — they belong to a distinct "window" evaluation step that happens later — and are explicitly disallowed inside WHERE, GROUP BY, and HAVING clauses. This query does not run less efficiently than the alternatives; it does not run at all, raising a parse/semantic error in both PostgreSQL ("window functions are not allowed in HAVING") and MSSQL ("Windowed functions can only appear in the SELECT or ORDER BY clauses").',
      ],
    },
    {
      heading: 'The Fix Is Not a Style Choice — It Requires an Outer Query',
      points: [
        'Because a window function\'s result cannot be referenced in the SAME query\'s WHERE or HAVING clause, the only valid fix is to compute the window function in the SELECT list of an inner query or CTE, then filter on it in an OUTER query\'s WHERE clause (window functions are always usable in an outer WHERE once already materialised as an ordinary column by the inner query).',
        'This is exactly the same shape as the main page\'s own earlier "Window function rewrite" example under "Correlated subquery" — SELECT ... FROM (SELECT ..., AVG(...) OVER (...) AS CategoryAvg FROM Products) t WHERE UnitPrice > CategoryAvg — which correctly wraps the window function in a derived table before filtering. The final "Subquery vs CTE vs JOIN" example simply forgot to apply that same wrapping.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the error — the main page\'s own query, exactly as written',
      language: 'sql',
      code: `-- Exactly as written in the main page's "Subquery vs CTE vs JOIN" tab:
SELECT DISTINCT c.CompanyName,
       SUM(o.Freight) OVER (PARTITION BY o.CustomerID) AS Total
FROM Customers c
JOIN Orders o ON o.CustomerID = c.CustomerID
HAVING SUM(o.Freight) OVER (PARTITION BY o.CustomerID) > 10000;

-- PostgreSQL:
-- ERROR:  window functions are not allowed in HAVING

-- MSSQL:
-- Msg 4108, Level 15, State 1
-- Windowed functions can only appear in the SELECT or ORDER BY clauses.
-- Neither dialect executes this query -- it fails at parse/bind time,
-- before any rows are ever scanned.`,
    },
    {
      label: 'The actual fix — filter in an OUTER query, not the same-level HAVING',
      language: 'sql',
      code: `-- Wrap the window function in a derived table (or CTE), exactly like
-- the main page's OWN earlier "Window function rewrite" example does:
SELECT CompanyName, Total FROM (
    SELECT DISTINCT c.CompanyName,
           SUM(o.Freight) OVER (PARTITION BY o.CustomerID) AS Total
    FROM Customers c
    JOIN Orders o ON o.CustomerID = c.CustomerID
) t
WHERE Total > 10000;
-- Runs correctly in both dialects: the window function is fully
-- computed and materialised as an ordinary column ("Total") by the
-- inner query, and the OUTER query's WHERE clause can filter on it
-- freely, since WHERE on an already-computed column has no such
-- restriction.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate copies the main page\'s own <code>HAVING SUM(...) OVER (...) > 10000</code> example into a new report query and it fails to run in their MSSQL environment with "Windowed functions can only appear in the SELECT or ORDER BY clauses." They assume they made a typo somewhere. What\'s the actual explanation, and how do you fix their query using the pattern above?',
    hint: 'The error message names the ONLY two clauses window functions are allowed in — check whether HAVING is one of them.',
    solution: `The actual explanation is that the query itself is invalid as written
-- window functions cannot appear in a HAVING clause at all, in any
correctly-formed query, in either MSSQL or PostgreSQL. It has nothing
to do with a typo; the main page's own comment on this example
("Avoid: use derived table/CTE...") undersells the issue by implying
it is merely a style problem rather than something that fails to
parse.

The fix is to wrap the SELECT (including the window function) as a
derived table or CTE, then move the filter into an OUTER query's
WHERE clause, referencing the window function's result by its alias
as an ordinary column: SELECT CompanyName, Total FROM (SELECT ...,
SUM(o.Freight) OVER (PARTITION BY o.CustomerID) AS Total FROM ...) t
WHERE Total > 10000. This is the same wrapping technique the main
page's own earlier "Correlated subquery" section already demonstrates
correctly for a different query.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own comment "Avoid: use derived table/CTE with HAVING for cleaner aggregation filter" means the window-function-in-HAVING version is valid SQL that is simply less clean or less efficient than the alternatives.',
      reality: 'the query does not run at all in either MSSQL or PostgreSQL — it raises a parse/semantic error, because window functions are explicitly disallowed inside HAVING clauses in both dialects, not merely discouraged there.',
    },
    {
      thought: 'window functions can be used anywhere an aggregate function can be used, since they are conceptually similar (both compute values across a set of rows).',
      reality: 'window functions are restricted to the SELECT and ORDER BY clauses precisely because they are evaluated in a distinct, later phase than WHERE/GROUP BY/HAVING — aggregate functions like SUM() and COUNT() have no such restriction and are valid directly inside HAVING.',
    },
    {
      thought: 'if a query pattern with a window function needs to be filtered, adding the filter condition to HAVING (right where the window function is computed) is the natural, most direct place to put it.',
      reality: 'the filter must go in an OUTER query\'s WHERE clause, after the window function has already been computed and materialised as a column by an inner query or CTE — there is no way to filter on a window function\'s result in the same SELECT that computes it.',
    },
  ];
}
