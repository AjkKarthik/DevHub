import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-pivot-implicit-group-by-trap-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-that-pivots-implicit-group-by-silently-multiplies-rows.html',
  styleUrl: './demonstrating-that-pivots-implicit-group-by-silently-multiplies-rows.scss',
})
export class DemonstratingThatPivotsImplicitGroupBySilentlyMultipliesRowsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Detail the Main Page\'s Working Example Quietly Depends On',
      points: [
        'The main page\'s "MSSQL PIVOT" code tab works correctly: SELECT product, month, amount FROM sales as the source subquery, PIVOTed FOR month IN ([Jan],[Feb],[Mar]). This produces exactly one row per product. What the page never explains is WHY it produces one row per product — and that omission is precisely the trap most people hit the first time they write their own PIVOT.',
        'PIVOT automatically GROUPs BY every column in the source that is NOT referenced by the aggregate function\'s argument (amount) and NOT the FOR column (month). In the page\'s example, that leaves exactly product — so PIVOT implicitly groups by product, matching what the reader expects. But this grouping is automatic and invisible; there is no explicit GROUP BY clause anywhere in PIVOT syntax to signal it.',
      ],
    },
    {
      heading: 'What Breaks When an Extra Column Sneaks Into the Source',
      points: [
        'If the source subquery selects even ONE additional column beyond what\'s needed — for example order_id, included by copy-pasting a broader SELECT * or forgetting to trim the column list — PIVOT silently starts grouping by (product, order_id) instead of just product. The query doesn\'t error. It just produces far more rows than expected: one row per DISTINCT (product, order_id) combination, rather than one row per product.',
        'This is one of the most common real-world PIVOT bugs, and it\'s dangerous specifically because it fails silently — the query runs, returns a result set, and everything LOOKS fine unless you specifically notice the row count is wrong.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own working example, annotated',
      language: 'sql',
      code: `SELECT product, [Jan], [Feb], [Mar]
FROM (
    SELECT product, month, amount   -- exactly 3 columns: the grouping
                                     -- column (product), the FOR column
                                     -- (month), and the aggregated
                                     -- value (amount)
    FROM sales
) AS src
PIVOT (
    SUM(amount)
    FOR month IN ([Jan], [Feb], [Mar])
) AS pvt;

-- One row per product. This works ONLY because "product" is the
-- single remaining column after removing "month" (consumed by FOR)
-- and "amount" (consumed by SUM). PIVOT groups by whatever is LEFT.`,
    },
    {
      label: 'Adding one innocent-looking extra column',
      language: 'sql',
      code: `-- A developer extends the source subquery, e.g. to also show which
-- order_id contributed -- a completely reasonable-looking addition:
SELECT product, [Jan], [Feb], [Mar]
FROM (
    SELECT product, order_id, month, amount   -- order_id added
    FROM sales
) AS src
PIVOT (
    SUM(amount)
    FOR month IN ([Jan], [Feb], [Mar])
) AS pvt;

-- NO ERROR. But now PIVOT implicitly groups by (product, order_id)
-- instead of just product -- because order_id is neither the FOR
-- column nor the aggregated value, it becomes part of the grouping
-- key by default. If "Widget" has 40 different order_ids, the result
-- now has 40 rows for "Widget" instead of 1, each showing that
-- single order's month totals rather than the product's total.`,
    },
    {
      label: 'The fix — keep the source subquery minimal',
      language: 'sql',
      code: `-- Only include EXACTLY the columns PIVOT needs: the grouping
-- column(s), the FOR column, and the value column. If order_id is
-- needed for a DIFFERENT purpose, aggregate or filter it BEFORE the
-- PIVOT, not alongside it:
SELECT product, [Jan], [Feb], [Mar]
FROM (
    SELECT product, month, amount   -- back to exactly 3 columns
    FROM sales
    -- any WHERE filtering involving order_id belongs HERE,
    -- not as a SELECTed column carried into the PIVOT
) AS src
PIVOT (
    SUM(amount)
    FOR month IN ([Jan], [Feb], [Mar])
) AS pvt;

-- Same correct one-row-per-product result the main page shows --
-- the fix is entirely about what the SOURCE subquery selects, not
-- anything in the PIVOT clause itself.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A report built on a query modeled after the main page\'s PIVOT example suddenly starts returning far more rows than there are products, right after a developer added a customer_region column to the source subquery "just in case it\'s useful later." No error was raised. What actually happened, and what\'s the fix?',
    hint: 'PIVOT groups by every column in the source that isn\'t the FOR column or the aggregated value — trace what customer_region becomes once it\'s added to that source subquery.',
    solution: `Adding customer_region to the source subquery silently changed
PIVOT's implicit grouping key from just "product" to "(product,
customer_region)" -- since customer_region is neither the FOR column
(month) nor the aggregated value (amount), PIVOT automatically folds
it into the grouping. Every product now gets one row PER DISTINCT
region it sold in, instead of one row total -- and because PIVOT
never raises an error for this, the query "just worked" from a syntax
standpoint while silently producing the wrong shape of result.

The fix is to remove customer_region from the PIVOT's source
subquery entirely (it isn't needed for this particular pivot) --
or, if it genuinely needs to be part of the output, add it as an
explicit second grouping column deliberately (SELECT product,
customer_region, [Jan], [Feb], [Mar] ...), understanding that this
changes the report's grain from "per product" to "per product per
region." The bug isn't a PIVOT syntax error -- it's an unnoticed
change to what the source subquery selects.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'MSSQL\'s PIVOT operator groups results by whatever column you clearly intend it to — like "product" in a product-vs-month report — based on the shape of the desired output.',
      reality: 'PIVOT has no explicit GROUP BY clause — it automatically groups by every column in the source subquery that is neither the FOR column nor the aggregated value, silently including any extra column that happens to be selected.',
    },
    {
      thought: 'if a PIVOT query has a bug in its source subquery\'s column list, it will raise a syntax or runtime error, the same way most SQL mistakes do.',
      reality: 'an extra, unintended column in PIVOT\'s source subquery causes no error at all — it silently changes the implicit grouping key, producing more rows than expected with no warning.',
    },
    {
      thought: 'it\'s safe to SELECT * or a broad column list in the source subquery feeding a PIVOT, since PIVOT will "figure out" which columns matter.',
      reality: 'PIVOT treats every non-aggregated, non-FOR column as part of the grouping key without exception — the source subquery should select ONLY the exact columns needed: the grouping column(s), the FOR column, and the value column.',
    },
  ];
}
