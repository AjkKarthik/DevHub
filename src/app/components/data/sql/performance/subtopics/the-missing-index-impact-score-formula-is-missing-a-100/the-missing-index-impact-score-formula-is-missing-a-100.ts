import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-missing-index-impact-score-formula-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './the-missing-index-impact-score-formula-is-missing-a-100.html',
  styleUrl: './the-missing-index-impact-score-formula-is-missing-a-100.scss',
})
export class TheMissingIndexImpactScoreFormulaIsMissingA100Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'avg_user_impact Is a Percentage, Not a Fraction',
      points: [
        'The main page\'s own "Missing index DMVs" code tab computes ImpactScore as ROUND(migs.avg_total_user_cost * migs.avg_user_impact * (migs.user_seeks + migs.user_scans), 0). sys.dm_db_missing_index_group_stats.avg_user_impact is documented as the average PERCENTAGE benefit the missing index would provide — a value on a 0-100 scale (e.g., 95.5 meaning an estimated 95.5% cost reduction), not a 0-1 fraction.',
        'Microsoft\'s own official guidance for this exact, widely-referenced query pattern divides avg_user_impact by 100: avg_total_user_cost * (avg_user_impact / 100.0) * (user_seeks + user_scans). The main page\'s formula omits this normalization step entirely.',
      ],
    },
    {
      heading: 'The Ranking Survives — the Absolute Numbers Don\'t',
      points: [
        'Because the missing /100 divisor is a UNIFORM constant multiplier applied to every row\'s ImpactScore, the relative ORDER BY ImpactScore DESC ranking (the TOP 20 list itself) is unaffected — a constant scalar factor doesn\'t change which rows sort higher or lower than others.',
        'What breaks is the absolute numeric value shown in the ImpactScore column: it reads 100x larger than the standard, documented formula would produce. This matters the moment anyone compares these numbers against a published threshold, a historical baseline captured with the correct formula, or another tool\'s missing-index report that uses the properly-normalized calculation — the numbers simply won\'t be comparable.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Side-by-side comparison on a concrete row',
      language: 'sql',
      code: `-- A representative missing-index candidate row:
-- avg_total_user_cost = 50.0
-- avg_user_impact      = 95.5   (documented as a PERCENTAGE, 0-100 scale)
-- user_seeks + user_scans = 1000

-- The main page's own formula (no /100):
SELECT 50.0 * 95.5 * 1000 AS PageFormulaScore;
-- Returns 4,775,000

-- Microsoft's own documented formula (with /100.0):
SELECT 50.0 * (95.5 / 100.0) * 1000 AS CorrectedFormulaScore;
-- Returns 47,750 -- exactly 100x smaller

-- The main page's value is 100x larger than the documented,
-- standard calculation -- not wrong in a way that changes the TOP 20
-- ordering, but disconnected from the formula anyone else comparing
-- against Microsoft's own guidance would expect.`,
    },
    {
      label: 'Confirming the ranking itself is unaffected',
      language: 'sql',
      code: `-- Three candidate rows with different costs/impacts/usage:
-- Row A: cost=50,  impact=95.5, seeks+scans=1000
-- Row B: cost=200, impact=40.0, seeks+scans=500
-- Row C: cost=10,  impact=99.0, seeks+scans=5000

-- Page's formula (no /100) -- ranking:
SELECT 'A' AS Row, 50.0  * 95.5 * 1000 AS Score UNION ALL
SELECT 'B',        200.0 * 40.0 * 500          UNION ALL
SELECT 'C',        10.0  * 99.0 * 5000
ORDER BY Score DESC;
-- A: 4,775,000  |  C: 4,950,000  |  B: 4,000,000
-- Order: C, A, B

-- Corrected formula (with /100.0) -- SAME relative order, 100x smaller values:
SELECT 'A' AS Row, 50.0  * (95.5 / 100.0) * 1000 AS Score UNION ALL
SELECT 'B',        200.0 * (40.0 / 100.0) * 500           UNION ALL
SELECT 'C',        10.0  * (99.0 / 100.0) * 5000
ORDER BY Score DESC;
-- A: 47,750  |  C: 49,500  |  B: 40,000
-- Order: C, A, B -- identical ranking, confirming the TOP 20 list
-- itself is unaffected by the missing /100 -- only the absolute
-- numbers displayed change.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A DBA runs the main page\'s own missing-index query on two different servers and is confused that ImpactScore values from this query don\'t line up with a Microsoft documentation example showing "typical" ImpactScore ranges for a similar workload — the DBA\'s numbers are consistently about 100x higher. Using the analysis above, explain what\'s actually happening, and whether the DBA should be concerned about the query\'s TOP 20 ranking being wrong.',
    hint: 'Check the data type and documented range for avg_user_impact, and whether the main page\'s query applies any normalization to it before using it in the multiplication.',
    solution: `The DBA's numbers are 100x higher because the main page's own query
omits the /100.0 normalization that Microsoft's documented formula
applies to avg_user_impact, which is stored as a percentage (0-100
scale) rather than a 0-1 fraction. Multiplying by the raw 0-100 value
instead of the 0-1 fraction produces ImpactScore values exactly 100
times larger than the documented formula would, which is why they
don't match published example ranges.

The DBA should NOT be concerned about the ranking itself being wrong
-- since the missing /100 is a uniform constant multiplier applied to
every candidate row, it has no effect on the RELATIVE ordering (which
row ranks highest, second-highest, and so on). The TOP 20 list
produced by the query is exactly as valid as it would be with the
corrected formula. The fix is purely cosmetic for anyone who wants the
absolute numbers to match Microsoft's documented scale -- add the
/100.0 divisor to avg_user_impact in the formula.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own Missing Index DMV query, since it produces a reasonable-looking TOP 20 ranked list, must be using the same formula Microsoft\'s own documentation describes.',
      reality: 'the page\'s formula omits the /100.0 normalization of avg_user_impact that Microsoft\'s documented formula includes, producing ImpactScore values 100x larger than the standard calculation, even though the resulting ranking happens to be identical.',
    },
    {
      thought: 'if a DMV-based ranking query produces numbers that don\'t match a documented example or another tool\'s output, the ranking itself (which rows come first) is probably also wrong.',
      reality: 'a uniform scaling difference (like a missing /100 divisor) changes only the absolute values displayed — it does not affect the RELATIVE ranking, since every row is scaled by the same constant factor.',
    },
    {
      thought: 'avg_user_impact in sys.dm_db_missing_index_group_stats is a 0-1 fraction, consistent with how many other "impact" or "ratio" columns are represented in SQL Server DMVs.',
      reality: 'avg_user_impact is specifically documented as a percentage on a 0-100 scale — a detail that must be checked per-column rather than assumed from a general convention, since DMV columns are not uniformly scaled across the catalog.',
    },
  ];
}
