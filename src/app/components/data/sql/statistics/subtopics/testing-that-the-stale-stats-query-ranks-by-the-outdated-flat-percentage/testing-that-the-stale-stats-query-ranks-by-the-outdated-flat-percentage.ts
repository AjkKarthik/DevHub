import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-stale-stats-flat-pct-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-stale-stats-query-ranks-by-the-outdated-flat-percentage.html',
  styleUrl: './testing-that-the-stale-stats-query-ranks-by-the-outdated-flat-percentage.scss',
})
export class TestingThatTheStaleStatsQueryRanksByTheOutdatedFlatPercentageSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'What the Page Teaches vs. What Its Query Ranks By',
      points: [
        'The "MSSQL statistics" theory section is explicit: "Auto-update threshold (traditional): 20% of rows changed... SQL Server 2016+: dynamic threshold — 500 + sqrt(rows) * 0.2 for large tables." The quiz reinforces this: the old flat 20% threshold "meant a 100M-row table needed 20M changes before auto-update triggered — far too high," which the dynamic formula fixes.',
        'Despite that, the "Find tables with stale statistics" query in the "Inspect histogram" code tab ranks purely by pct_modified — a flat percentage (modification_counter * 100.0 / rows) — with ORDER BY pct_modified DESC. It never references the dynamic threshold formula the same page teaches as the modern, more accurate way to judge staleness.',
      ],
    },
    {
      heading: 'Why This Produces a Misleading Ranking',
      points: [
        'On a large table (say, 50 million rows), the dynamic threshold (500 + sqrt(50,000,000) * 0.2 ≈ 1,914 rows) is reached after a TINY fraction of a percent of rows change — far below any percentage a human would eyeball as "significant." A large table can already be well past its real auto-update trigger point while still showing a low, unremarkable pct_modified.',
        'Meanwhile a small table (say, 5,000 rows) has a dynamic threshold of 500 + sqrt(5,000) * 0.2 ≈ 514 rows — over 10% of its total rows — meaning it can show a much higher pct_modified while still being comfortably under its real threshold. Sorting by pct_modified DESC can rank the small table above the large one, exactly backwards from which one is actually more overdue by the modern criterion.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the ranking inversion with two tables',
      language: 'sql',
      code: `-- Table A: 50,000,000 rows, modification_counter = 60,000
--   pct_modified = 60,000 / 50,000,000 * 100 = 0.12%
--   dynamic_threshold = 500 + SQRT(50000000) * 0.2 ≈ 1,914
--   60,000 > 1,914 -- ALREADY well past the dynamic threshold

-- Table B: 5,000 rows, modification_counter = 600
--   pct_modified = 600 / 5,000 * 100 = 12.0%
--   dynamic_threshold = 500 + SQRT(5000) * 0.2 ≈ 514
--   600 > 514 -- also past its dynamic threshold, but much closer

-- The main page's own "Find tables with stale statistics" query,
-- run against both:
SELECT
    OBJECT_NAME(s.object_id)   AS table_name,
    sp.rows,
    sp.modification_counter,
    CAST(sp.modification_counter * 100.0 / NULLIF(sp.rows,0) AS DECIMAL(5,1)) AS pct_modified
FROM sys.stats s
CROSS APPLY sys.dm_db_stats_properties(s.object_id, s.stats_id) AS sp
WHERE sp.modification_counter > 0
  AND OBJECTPROPERTY(s.object_id, 'IsUserTable') = 1
ORDER BY pct_modified DESC;
-- Table B (12.0%) ranks ABOVE Table A (0.12%) -- even though Table A
-- exceeded its (much lower, size-adjusted) dynamic threshold by
-- 30x more than Table B exceeded its own.`,
    },
    {
      label: 'The fix — rank by the dynamic threshold ratio instead',
      language: 'sql',
      code: `SELECT
    OBJECT_NAME(s.object_id)   AS table_name,
    s.name                      AS stat_name,
    sp.rows,
    sp.modification_counter,
    500 + SQRT(sp.rows) * 0.2   AS dynamic_threshold,
    CAST(sp.modification_counter / NULLIF(500 + SQRT(sp.rows) * 0.2, 0) AS DECIMAL(6,2))
                                 AS threshold_multiple
FROM sys.stats s
CROSS APPLY sys.dm_db_stats_properties(s.object_id, s.stats_id) AS sp
WHERE sp.modification_counter > 0
  AND OBJECTPROPERTY(s.object_id, 'IsUserTable') = 1
ORDER BY threshold_multiple DESC;
-- Table A now ranks first (threshold_multiple ≈ 31.3x its dynamic
-- threshold) ahead of Table B (≈ 1.17x) -- correctly surfacing the
-- table that is furthest past ITS OWN size-adjusted auto-update
-- trigger point, matching the modern threshold the page's own
-- theory and quiz describe.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You run the main page\'s exact "Find tables with stale statistics" query (sorted by pct_modified DESC) against a database with one 50-million-row table and one 5,000-row table, both overdue for a statistics update. Which table appears first in the results, and is that actually the more urgent one to fix?',
    hint: 'Compute pct_modified for both tables, then separately compute how many times over each table\'s own dynamic threshold (500 + sqrt(rows)*0.2) its modification_counter actually is.',
    solution: `The 5,000-row table appears first — its raw modification
percentage (e.g. 12%) is numerically larger than the 50-million-row
table's (e.g. 0.12%), and the query sorts purely by that flat
percentage. But by the dynamic threshold criterion the SAME page
teaches as the modern, accurate way to judge staleness, the large
table is actually far more overdue — its modification_counter can
be dozens of times past its own (much lower, size-adjusted)
threshold, while the small table might be only slightly past its
own.

The query's ranking is backwards relative to the page's own stated
best practice. Replacing ORDER BY pct_modified DESC with a ranking
based on modification_counter divided by the dynamic threshold
(500 + sqrt(rows)*0.2) — a "how many multiples past threshold"
ratio — produces a ranking that actually matches the modern
criterion the theory and quiz sections describe.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a "stale statistics" finder query that ranks by raw modification percentage is a reasonable, up-to-date way to prioritize which tables need attention first.',
      reality: 'raw percentage was the relevant signal under the OLD flat 20% threshold — under the modern size-adjusted dynamic threshold, percentage and true staleness urgency can rank tables in opposite order, as demonstrated above.',
    },
    {
      thought: 'a query\'s title ("Find tables with stale statistics") guarantees its ORDER BY clause reflects the most accurate available staleness signal.',
      reality: 'a query\'s name describes its intent, not necessarily its implementation — the same page\'s own theory and quiz sections describe a more accurate criterion (the dynamic threshold) than what this particular query\'s ORDER BY actually uses.',
    },
    {
      thought: 'large tables and small tables can be meaningfully compared on the same flat percentage scale for statistics staleness.',
      reality: 'the entire point of the dynamic threshold formula (500 + sqrt(rows) * 0.2) is that the SAME percentage of change means something very different for a small table versus a large one — flat percentage comparisons across differently-sized tables are exactly what the dynamic formula was introduced to fix.',
    },
  ];
}
