import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-challenge-never-flags-overdue-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-challenges-solution-never-flags-which-stats-are-overdue.html',
  styleUrl: './testing-that-the-challenges-solution-never-flags-which-stats-are-overdue.scss',
})
export class TestingThatTheChallengesSolutionNeverFlagsWhichStatsAreOverdueSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Challenge\'s Own Hint vs. Its Own Solution',
      points: [
        'The challenge\'s hint states: "A modification_counter > 500 + sqrt(rows)*0.2 means auto-update is likely overdue." That is a precise, actionable comparison — a specific threshold to check modification_counter against.',
        'The challenge\'s MSSQL solution query computes exactly that threshold as a column: 500 + SQRT(sp.rows) * 0.2 AS dynamic_threshold — but places it side by side with modification_counter in a plain SELECT, with no WHERE, HAVING, or CASE expression that actually compares the two. The reader still has to manually eyeball two separate numbers per row to determine which statistics objects are overdue.',
      ],
    },
    {
      heading: 'Why This Matters at Scale',
      points: [
        'For a single table with a handful of statistics objects (as in the challenge\'s own \'orders\' example), manually comparing two columns per row is a minor inconvenience. For a database-wide audit — dropping the WHERE OBJECT_NAME(...) = \'orders\' filter to check every table — manually scanning dozens or hundreds of rows for whichever ones happen to have modification_counter > dynamic_threshold is impractical and error-prone.',
        'The fix requires only a small addition: a computed CASE expression column (or a WHERE clause, if only overdue rows are wanted) that performs the actual comparison the hint describes — turning a query that merely REPORTS both numbers into one that actually ANSWERS the question the challenge poses ("check ... whether auto-update is likely overdue").',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the challenge\'s exact solution output',
      language: 'sql',
      code: `SELECT
    s.name                      AS stat_name,
    sp.last_updated,
    sp.rows,
    sp.rows_sampled,
    sp.modification_counter,
    500 + SQRT(sp.rows) * 0.2   AS dynamic_threshold
FROM sys.stats s
CROSS APPLY sys.dm_db_stats_properties(s.object_id, s.stats_id) AS sp
WHERE OBJECT_NAME(s.object_id) = 'orders';

-- Example output (3 stats objects on 'orders', 2M rows each):
-- stat_name              modification_counter   dynamic_threshold
-- ix_orders_customer      750                    782.8   -- under threshold
-- ix_orders_status_date   900                    782.8   -- OVER threshold
-- ix_orders_date          400                    782.8   -- under threshold
--
-- Nothing in the output itself flags that ix_orders_status_date is
-- the one actually overdue -- a reader must manually compare each
-- row's modification_counter against dynamic_threshold by eye.`,
    },
    {
      label: 'The fix — an explicit OVERDUE flag',
      language: 'sql',
      code: `SELECT
    s.name                      AS stat_name,
    sp.last_updated,
    sp.rows,
    sp.rows_sampled,
    sp.modification_counter,
    500 + SQRT(sp.rows) * 0.2   AS dynamic_threshold,
    CASE
        WHEN sp.modification_counter > 500 + SQRT(sp.rows) * 0.2
        THEN 'OVERDUE'
        ELSE 'OK'
    END                          AS staleness_status
FROM sys.stats s
CROSS APPLY sys.dm_db_stats_properties(s.object_id, s.stats_id) AS sp
WHERE OBJECT_NAME(s.object_id) = 'orders'
ORDER BY staleness_status DESC, sp.modification_counter DESC;
-- ix_orders_status_date now sorts to the top with staleness_status
-- = 'OVERDUE' -- directly answering the challenge's own question
-- instead of leaving the comparison to the reader.`,
    },
    {
      label: 'Scaling it to a database-wide audit',
      language: 'sql',
      code: `SELECT
    OBJECT_NAME(s.object_id)    AS table_name,
    s.name                      AS stat_name,
    sp.modification_counter,
    500 + SQRT(sp.rows) * 0.2   AS dynamic_threshold,
    CASE
        WHEN sp.modification_counter > 500 + SQRT(sp.rows) * 0.2
        THEN 'OVERDUE' ELSE 'OK'
    END                          AS staleness_status
FROM sys.stats s
CROSS APPLY sys.dm_db_stats_properties(s.object_id, s.stats_id) AS sp
WHERE OBJECTPROPERTY(s.object_id, 'IsUserTable') = 1
  AND sp.modification_counter > 0
ORDER BY staleness_status DESC, sp.modification_counter DESC;
-- Without the CASE expression, this database-wide version would
-- return every modified statistics object with no way to sort
-- overdue ones to the top short of a manual per-row calculation.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You run the challenge\'s exact MSSQL solution query against a database with 40 statistics objects that have been modified since their last update. Can you tell, just by looking at the result set, which ones are actually overdue for a refresh per the dynamic threshold formula the hint describes?',
    hint: 'Check whether the SELECT list includes any expression that actually compares modification_counter to dynamic_threshold, or just lists both as separate columns.',
    solution: `Not directly — you would have to manually compare
modification_counter against dynamic_threshold for each of the 40
rows yourself, since the query only SELECTs both values side by
side without any WHERE, HAVING, or CASE expression that performs
the comparison the hint itself describes.

Adding a CASE WHEN modification_counter > dynamic_threshold THEN
'OVERDUE' ELSE 'OK' END column (or a WHERE filter, if only overdue
objects are needed) turns the query from a report of raw numbers
into a direct answer to the question the challenge poses. This
becomes essential, not just convenient, once the query is
generalized beyond a single named table to a database-wide
statistics audit with potentially hundreds of rows to review.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a query\'s SELECT list includes both a threshold value and the metric being measured against it, the query is already answering "is this overdue?"',
      reality: 'computing a threshold and displaying it next to the raw metric is not the same as comparing them — an explicit CASE expression, WHERE clause, or HAVING clause is what actually performs that comparison.',
    },
    {
      thought: 'the challenge\'s hint and its own published solution query must be testing the same thing, since they appear together on the same page.',
      reality: 'the hint describes a comparison in words ("modification_counter > 500 + sqrt(rows)*0.2 means... overdue") that the solution query never actually implements as SQL — always verify a solution genuinely does what its own accompanying hint or description claims.',
    },
    {
      thought: 'manually eyeballing a small result set to spot overdue statistics objects is a reasonable substitute for an explicit flag column.',
      reality: 'it works for a handful of rows on one named table, but the same query pattern is a natural candidate for a database-wide audit — where a missing comparison expression turns a quick glance into an impractical manual review.',
    },
  ];
}
