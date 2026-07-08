import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-grouping-sets-missing-disambiguation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './grouping-sets-omits-the-disambiguation-its-own-theory-warns-about.html',
  styleUrl: './grouping-sets-omits-the-disambiguation-its-own-theory-warns-about.scss',
})
export class GroupingSetsOmitsTheDisambiguationItsOwnTheoryWarnsAboutSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Theory Explains Exactly Why This Matters — Then Its Own Example Skips It',
      points: [
        'The main page\'s own theory on GROUPING(col) is explicit: it "returns 1 when that column is part of a subtotal row ... 0 when it is an actual group value. Use it to reliably distinguish subtotal rows from rows where the actual data value happens to be NULL." The ROLLUP code tab correctly follows this advice, including GROUPING(YEAR(order_date)) and GROUPING(DATEPART(QUARTER, order_date)) columns in its output.',
        'The GROUPING SETS code tab, immediately below it in the same "ROLLUP / CUBE / GROUPING SETS" section, does not: SELECT region, product_name, SUM(revenue) FROM sales GROUP BY GROUPING SETS((region, product_name), (region), ()) has no GROUPING() columns at all. If product_name can genuinely be NULL for some row (an uncategorized product, a data-entry gap), the "(region)" subtotal row and a real "region + NULL product_name" data row become indistinguishable in the query\'s actual output — exactly the ambiguity the main page\'s own theory section warns about, just left unaddressed in this specific example.',
      ],
    },
    {
      heading: 'The Fix Is the Same Technique the ROLLUP Tab Already Demonstrates',
      points: [
        'Adding GROUPING(product_name) (and GROUPING(region) for completeness) to the SELECT list resolves the ambiguity exactly the way the ROLLUP tab already shows: GROUPING(product_name) = 1 identifies a genuine subtotal row (rolled-up NULL from the "(region)" or "()" grouping set), while GROUPING(product_name) = 0 with product_name IS NULL identifies a real, if unfortunate, NULL data value.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the ambiguity — the main page\'s own GROUPING SETS query',
      language: 'sql',
      code: `-- A genuinely NULL product_name in the source data (uncategorized product):
INSERT INTO sales (region, product_name, revenue) VALUES
  ('West', NULL, 500),      -- real data row: product_name IS NULL
  ('West', 'Widget', 1200);

-- The main page's own GROUPING SETS query, exactly as written:
SELECT region, product_name, SUM(revenue) AS revenue
FROM   sales
GROUP BY GROUPING SETS(
    (region, product_name),   -- subtotal per region+product
    (region),                  -- subtotal per region only
    ()                         -- grand total
);
-- Result includes TWO rows where region='West', product_name IS NULL:
--   1) the real data row for the uncategorized product (revenue 500)
--   2) the "(region)" subtotal row for West (revenue 1700 = 500+1200)
-- Both show product_name = NULL -- indistinguishable without GROUPING().`,
    },
    {
      label: 'The fix — add GROUPING() exactly as the ROLLUP tab already does',
      language: 'sql',
      code: `SELECT
    region,
    product_name,
    GROUPING(region)       AS is_region_total,
    GROUPING(product_name) AS is_product_subtotal,
    SUM(revenue) AS revenue
FROM   sales
GROUP BY GROUPING SETS(
    (region, product_name),
    (region),
    ()
);
-- Now the two previously-indistinguishable rows are easy to tell apart:
--   real data row:      product_name IS NULL, is_product_subtotal = 0
--   region subtotal row: product_name IS NULL, is_product_subtotal = 1
-- Exactly the technique the main page's own ROLLUP tab already uses for
-- GROUPING(YEAR(order_date)) -- just never carried over to this example.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A sales report built on the main page\'s own GROUPING SETS query (without GROUPING() columns) shows two rows for West region with a blank product name — one showing revenue 500, one showing 1700. A stakeholder asks which row is "the real uncategorized product" and which is "the region subtotal." How would you answer using only the query as originally written, and how does adding GROUPING() resolve this going forward?',
    hint: 'Without GROUPING(), is there ANY column in the result that distinguishes these two rows from each other?',
    solution: `As originally written, there is no way to answer the question from the
query's own output — both rows have identical region and product_name
values (West, NULL), and nothing else in the result set distinguishes
a genuine NULL product_name data row from a rolled-up NULL subtotal
row. The stakeholder would have to go back to the source data and
manually reconcile which revenue figure corresponds to which meaning,
which does not scale and is error-prone.

Adding GROUPING(product_name) to the SELECT list resolves this
permanently: the real data row (an uncategorized product with revenue
500) gets is_product_subtotal = 0, while the "(region)" subtotal row
(revenue 1700, the sum across every product in West) gets
is_product_subtotal = 1. This is the exact technique the main page's
own ROLLUP code tab already demonstrates for its year/quarter
example — it just was not carried over to the GROUPING SETS example
in the same section.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'GROUPING() is only needed for ROLLUP and CUBE queries, since GROUPING SETS gives you explicit control over which combinations appear.',
      reality: 'GROUPING SETS produces rolled-up NULLs for omitted columns in each grouping set exactly like ROLLUP and CUBE do — the same ambiguity between a rolled-up NULL and a genuine NULL data value applies equally, and the main page\'s own theory on GROUPING() never actually limits its advice to ROLLUP/CUBE specifically.',
    },
    {
      thought: 'if a grouping column is very unlikely to contain genuine NULL values in practice, omitting GROUPING() from a GROUPING SETS query is a low-risk simplification.',
      reality: 'a column like product_name for an "uncategorized" or "unassigned" product is a realistic, common source of genuine NULLs — the risk is not hypothetical, and the main page\'s own theory explicitly calls this scenario out as the reason GROUPING() exists.',
    },
    {
      thought: 'the main page\'s own GROUPING SETS code tab and its ROLLUP code tab, both under the same theory section, necessarily follow the same conventions since they cover closely related features.',
      reality: 'the ROLLUP tab includes GROUPING() columns and the GROUPING SETS tab, immediately below it, does not — the two examples are inconsistent with each other despite sharing the same underlying ambiguity risk and the same theory section explaining why GROUPING() matters.',
    },
  ];
}
