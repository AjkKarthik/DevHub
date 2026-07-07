import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-density-rows-per-value-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './correcting-the-density-quizs-rows-per-distinct-value-claim.html',
  styleUrl: './correcting-the-density-quizs-rows-per-distinct-value-claim.scss',
})
export class CorrectingTheDensityQuizsRowsPerDistinctValueClaimSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Quiz\'s Claim',
      points: [
        'The "density vector" quiz question\'s explanation states: "Density = 1 / (distinct_values). A density of 0.001 means the optimizer expects about 1 000 rows per distinct value when estimating join cardinality." This presents "1,000 rows per distinct value" as a direct, fixed consequence of density alone.',
        'Density by itself only tells you the RECIPROCAL of the distinct value count: density = 1/distinct_values, so a density of 0.001 means distinct_values = 1,000. It says nothing about how many total ROWS the table has — and rows-per-distinct-value depends on both distinct_values AND total row count.',
      ],
    },
    {
      heading: 'The Actual Formula',
      points: [
        'The optimizer\'s cardinality estimate for an equality predicate is: estimated_rows = density × total_rows_in_table. Density alone (0.001) does not produce "1,000 rows" — that number only emerges if total_rows_in_table happens to be 1,000,000, since 0.001 × 1,000,000 = 1,000.',
        'For any OTHER total row count, the same density of 0.001 produces a completely different rows-per-value estimate — the quiz\'s explanation silently assumes a specific table size (1 million rows) it never states, presenting the result as if it followed from density alone.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The same density, three different table sizes',
      language: 'sql',
      code: `-- Density = 0.001 in all three cases (distinct_values = 1,000 each time)
-- estimated_rows_per_value = density * total_rows

-- Table A: 1,000,000 rows -- matches the quiz's implied assumption
--   estimated_rows_per_value = 0.001 * 1,000,000 = 1,000
--   -- this is the ONLY case where the quiz's "1,000 rows" holds

-- Table B: 10,000 rows -- same density, same distinct value count
--   estimated_rows_per_value = 0.001 * 10,000 = 10
--   -- NOT 1,000 -- an order of magnitude different, despite
--   -- identical density

-- Table C: 100,000,000 rows -- same density again
--   estimated_rows_per_value = 0.001 * 100,000,000 = 100,000
--   -- NOT 1,000 -- two orders of magnitude different

-- All three tables report the exact same density (0.001) in
-- DBCC SHOW_STATISTICS's density vector, yet the actual estimated
-- rows-per-value the optimizer computes varies by 10,000x across
-- them, purely due to differing total row counts.`,
    },
    {
      label: 'Confirming with DBCC SHOW_STATISTICS on a real table',
      language: 'sql',
      code: `DBCC SHOW_STATISTICS ('dbo.orders', 'ix_orders_customer_date') WITH DENSITY_VECTOR;
-- All density                    Average Length  Columns
-- ---------------------------- --------------- ----------
-- 0.001                          4               customer_id

SELECT COUNT(*) AS total_rows FROM dbo.orders;
-- e.g. 45,000

-- Estimated rows per distinct customer_id value:
SELECT 0.001 * 45000 AS estimated_rows_per_value;
-- 45 -- NOT 1,000 -- the actual estimate depends on this table's
-- real row count (45,000), which the quiz's flat "0.001 density =
-- 1,000 rows" claim never accounts for.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two different tables both show a density of 0.002 for a customer_id column in DBCC SHOW_STATISTICS. Table X has 500,000 rows; Table Y has 5,000,000 rows. Does the optimizer estimate the same number of rows per distinct customer_id value for both tables?',
    hint: 'Write out the actual formula the optimizer uses — does it depend on density alone, or on density combined with something else?',
    solution: `No — the estimates are different, even though the density is
identical. estimated_rows_per_value = density * total_rows:

Table X: 0.002 * 500,000 = 1,000 estimated rows per distinct value
Table Y: 0.002 * 5,000,000 = 10,000 estimated rows per distinct value

A 10x difference in total row count produces a 10x difference in
the estimated rows per value, despite both tables reporting the
identical density of 0.002. Density alone only tells you the
reciprocal of the distinct value count (1/0.002 = 500 distinct
values for both tables) — it says nothing about how many rows share
each of those 500 values without also knowing the table's total row
count.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a statistics object\'s density value alone tells you how many rows the optimizer expects to match a given value.',
      reality: 'density alone only tells you the reciprocal of the distinct value count — the optimizer\'s actual rows-per-value estimate is density multiplied by the table\'s total row count, a number density does not encode by itself.',
    },
    {
      thought: 'a specific numeric example in a quiz explanation ("density of 0.001 means about 1,000 rows per value") is a general rule that holds for any table with that density.',
      reality: 'that specific example silently assumes a 1,000,000-row table (0.001 × 1,000,000 = 1,000) — the same density on a differently-sized table produces a proportionally different rows-per-value estimate.',
    },
    {
      thought: 'two tables reporting the identical density value for a column will have the optimizer estimate the identical row count for an equality predicate on that column.',
      reality: 'identical density only guarantees identical distinct-value counts (1/density) — the actual row-count estimate additionally depends on each table\'s own total row count, which can differ arbitrarily between two tables with the same density.',
    },
  ];
}
