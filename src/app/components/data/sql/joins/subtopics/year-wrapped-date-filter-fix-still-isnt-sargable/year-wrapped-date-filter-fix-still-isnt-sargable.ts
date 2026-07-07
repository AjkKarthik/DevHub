import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-year-wrapped-date-filter-not-sargable-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './year-wrapped-date-filter-fix-still-isnt-sargable.html',
  styleUrl: './year-wrapped-date-filter-fix-still-isnt-sargable.scss',
})
export class YearWrappedDateFilterFixStillIsntSargableSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page Fixes One Problem in This Line and Leaves a Second, Different One',
      points: [
        'The main page\'s own multi-table join example correctly fixes a real semantic bug: moving the year filter into the ON clause — AND YEAR(o.order_date) = 2024 (MSSQL) / AND EXTRACT(YEAR FROM o.order_date) = 2024 (PostgreSQL) — so a LEFT JOIN does not silently degrade into an INNER JOIN, exactly as the page\'s own "LEFT JOIN trap" theory explains elsewhere. That fix is correct and necessary.',
        'But the SAME line introduces a completely separate, unaddressed problem: wrapping a column in a function — YEAR(...) or EXTRACT(...) — makes that predicate non-sargable. The engine cannot use a B-tree index on order_date to seek directly to 2024\'s rows; it must evaluate YEAR(order_date) (or EXTRACT(YEAR FROM order_date)) for every single row reaching that join step before it can filter, turning what could be an index seek into a full scan of the joined rows.',
      ],
    },
    {
      heading: 'The Two Fixes Are Orthogonal — Both Are Required',
      points: [
        'A sargable range predicate replaces the function wrap without changing which clause it lives in: o.order_date >= \'2024-01-01\' AND o.order_date < \'2025-01-01\', expressed as a half-open range on the raw column. This can use an index seek directly, and it slots into the exact same ON-clause position the main page already correctly identified as the right place for the filter.',
        'Fixing only the WHERE-vs-ON semantic issue (as the main page\'s example does) without also fixing sargability still leaves a slow query on a large orders table. Fixing only the sargability issue without moving the filter into the ON clause still leaves the LEFT-JOIN-becomes-INNER-JOIN bug. The main page\'s own code has solved exactly one of the two problems in this line — both are needed together.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL — the main page\'s own fix, still non-sargable',
      language: 'sql',
      code: `-- The main page's own code (correctly avoids the LEFT JOIN trap,
-- but YEAR(o.order_date) still wraps the column in a function):
SELECT cat.category_name, p.product_name,
       COALESCE(SUM(ol.qty * ol.unit_price), 0) AS revenue_2024
FROM   categories  cat
LEFT JOIN products    p  ON p.category_id  = cat.category_id
LEFT JOIN order_lines ol ON ol.product_id  = p.product_id
LEFT JOIN orders      o  ON o.order_id     = ol.order_id
                         AND YEAR(o.order_date) = 2024   -- non-sargable: wraps the column
GROUP BY cat.category_id, cat.category_name, p.product_id, p.product_name;
-- Execution plan: an Index Scan on orders (evaluating YEAR() per row),
-- not an Index Seek -- even though order_date itself is indexed.`,
    },
    {
      label: 'PostgreSQL — same issue with EXTRACT()',
      language: 'sql',
      code: `SELECT cat.category_name, p.product_name,
       COALESCE(SUM(ol.qty * ol.unit_price), 0) AS revenue_2024
FROM   categories  cat
LEFT JOIN products    p  ON p.category_id  = cat.category_id
LEFT JOIN order_lines ol ON ol.product_id  = p.product_id
LEFT JOIN orders      o  ON o.order_id     = ol.order_id
                         AND EXTRACT(YEAR FROM o.order_date) = 2024  -- non-sargable
GROUP BY cat.category_id, cat.category_name, p.product_id, p.product_name;
-- EXPLAIN shows a Seq Scan (or a non-Index-Only Bitmap scan reading
-- every row) on orders instead of an Index Scan keyed on order_date.`,
    },
    {
      label: 'The fully correct version — sargable AND in the right clause',
      language: 'sql',
      code: `-- Both dialects: a half-open range on the RAW column, still in ON
-- (keeps the LEFT JOIN row-preservation fix from the main page):
SELECT cat.category_name, p.product_name,
       COALESCE(SUM(ol.qty * ol.unit_price), 0) AS revenue_2024
FROM   categories  cat
LEFT JOIN products    p  ON p.category_id  = cat.category_id
LEFT JOIN order_lines ol ON ol.product_id  = p.product_id
LEFT JOIN orders      o  ON o.order_id     = ol.order_id
                         AND o.order_date >= '2024-01-01'   -- sargable
                         AND o.order_date <  '2025-01-01'   -- half-open range
GROUP BY cat.category_id, cat.category_name, p.product_id, p.product_name;
-- Now an Index Seek on order_date is possible in both dialects, while
-- still correctly preserving zero-sales categories via LEFT JOIN.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A category revenue report built on the main page\'s own <code>YEAR(o.order_date) = 2024</code> pattern correctly includes zero-sales categories (the LEFT JOIN semantics are right), but is reported as "slow" once the orders table passes a few million rows, even though order_date has an index. What is the most likely cause, and what is the one-line fix?',
    hint: 'The LEFT JOIN behavior is already correct here — think about what the YEAR() function wrapped around the column does to the engine\'s ability to use that index.',
    solution: `The most likely cause is that YEAR(o.order_date) = 2024 wraps the
indexed column in a function, making the predicate non-sargable. The
engine cannot seek directly to 2024's rows using the order_date index
-- it must compute YEAR(order_date) for every row reaching that join
step before it can evaluate the filter, effectively scanning far more
rows than necessary despite the index existing.

The fix is to replace the function-wrapped equality with a sargable
half-open range on the raw column, in the SAME ON-clause position:
AND o.order_date >= '2024-01-01' AND o.order_date < '2025-01-01'.
This preserves the LEFT JOIN row-preservation behavior the main page
already got right, while ALSO allowing an index seek on order_date --
the two problems are independent, and this fixes the one the main
page's own example left unaddressed.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'because the main page\'s own multi-table join example correctly moved the year filter into the ON clause to avoid the LEFT JOIN trap, that same line of code has no remaining performance problems.',
      reality: 'the ON-clause placement fixes the semantic LEFT-JOIN-becomes-INNER-JOIN bug, but the YEAR(o.order_date) / EXTRACT(YEAR FROM o.order_date) function wrap is a completely separate, still-unaddressed sargability problem in the exact same predicate.',
    },
    {
      thought: 'sargability only matters for WHERE clause predicates — a filter placed in the ON clause of a JOIN is exempt from the function-wrapping performance concern.',
      reality: 'sargability is about whether the column itself (unwrapped) can be used for an index seek, regardless of which clause the predicate lives in — a function wrapped around a column is equally non-sargable whether it appears in WHERE or in a JOIN\'s ON clause.',
    },
    {
      thought: 'if an execution plan shows the table\'s index is present in the plan at all (e.g. an Index Scan), the query is using that index efficiently.',
      reality: 'an Index Scan that must evaluate a function like YEAR(order_date) for every row still reads the entire index (or table) sequentially — it is not the same as an Index Seek, which jumps directly to the qualifying rows without examining the rest.',
    },
  ];
}
