import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-historic-average-self-reference-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-historic-average-includes-the-regressed-interval.html',
  styleUrl: './testing-that-the-historic-average-includes-the-regressed-interval.scss',
})
export class TestingThatTheHistoricAverageIncludesTheRegressedIntervalSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Challenge\'s Own Regression Query',
      points: [
        'The challenge\'s MSSQL solution builds a CTE with one row per (query_id, runtime_stats_interval_id), tags the MAX(runtime_stats_interval_id) per query as latest_interval, then compares: MAX(CASE WHEN ... = latest_interval THEN avg_duration END) AS recent_ms against AVG(s.avg_duration) AS historic_avg_ms — flagging a regression when recent_ms > historic_avg_ms * 3.',
        'The AVG(s.avg_duration) is computed over every row in the stats CTE for that query_id — and the CTE was never filtered to exclude the latest interval. The "historic average" therefore includes the very same regressed interval it is being compared against.',
      ],
    },
    {
      heading: 'Why Self-Inclusion Understates the Regression',
      points: [
        'If a query ran consistently at ~50ms across 9 prior intervals and then spiked to 500ms in the 10th (latest) interval, a genuine historic baseline (the 9 prior intervals only) averages 50ms — the spike is 10x that baseline, clearing the challenge\'s own 3x threshold easily.',
        'But AVG(s.avg_duration) over all 10 rows (9 × 50ms + 1 × 500ms) works out to 95ms — the outlier interval pulls its own comparison baseline upward. recent_ms (500) is now only ~5.3x this contaminated "historic" average, not the true ~10x — for a milder regression, or shorter history, this self-inclusion can be enough to drop a real regression below the 3x cutoff and miss it entirely.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Demonstrating the self-inclusion with concrete numbers',
      language: 'sql',
      code: `-- Simulated runtime_stats_interval rows for one query_id
-- (9 healthy intervals at ~50ms, then a regressed 10th at 500ms)
DECLARE @intervals TABLE (interval_id INT, avg_duration_us INT);
INSERT INTO @intervals VALUES
  (1,50000),(2,48000),(3,52000),(4,49000),(5,51000),
  (6,50000),(7,49000),(8,53000),(9,50000),(10,500000);

-- The challenge's exact formula, applied to this data:
SELECT
    MAX(CASE WHEN interval_id = 10 THEN avg_duration_us END) / 1000.0 AS recent_ms,
    AVG(avg_duration_us) / 1000.0                            AS historic_avg_ms_CONTAMINATED,
    MAX(CASE WHEN interval_id = 10 THEN avg_duration_us END)
      / NULLIF(AVG(avg_duration_us), 0)                      AS ratio_CONTAMINATED
FROM @intervals;
-- recent_ms = 500, historic_avg_ms_CONTAMINATED ≈ 95.2, ratio ≈ 5.25x
-- Still clears 3x here -- but a milder spike (e.g. 200ms instead of
-- 500ms) makes the contaminated ratio drop under 3x while the TRUE
-- ratio against a clean baseline would not.`,
    },
    {
      label: 'The fix — exclude the latest interval from the baseline',
      language: 'sql',
      code: `SELECT
    MAX(CASE WHEN interval_id = 10 THEN avg_duration_us END) / 1000.0 AS recent_ms,
    AVG(CASE WHEN interval_id <> 10 THEN avg_duration_us END) / 1000.0 AS historic_avg_ms_CLEAN,
    MAX(CASE WHEN interval_id = 10 THEN avg_duration_us END)
      / NULLIF(AVG(CASE WHEN interval_id <> 10 THEN avg_duration_us END), 0) AS ratio_CLEAN
FROM @intervals;
-- historic_avg_ms_CLEAN = 50.0 (average of the 9 prior intervals only)
-- ratio_CLEAN = 10.0x -- the true regression severity, not diluted
-- by folding the outlier into its own comparison baseline.

-- Applied to the challenge's real Query Store CTE:
SELECT
    qt.query_sql_text,
    s.query_id,
    MAX(CASE WHEN s.runtime_stats_interval_id = s.latest_interval THEN s.avg_duration END) / 1000.0 AS recent_ms,
    AVG(CASE WHEN s.runtime_stats_interval_id <> s.latest_interval THEN s.avg_duration END) / 1000.0 AS historic_avg_ms
FROM stats s
JOIN sys.query_store_query q ON q.query_id = s.query_id
JOIN sys.query_store_query_text qt ON qt.query_text_id = q.query_text_id
GROUP BY qt.query_sql_text, s.query_id
HAVING MAX(CASE WHEN s.runtime_stats_interval_id = s.latest_interval THEN s.avg_duration END)
     > AVG(CASE WHEN s.runtime_stats_interval_id <> s.latest_interval THEN s.avg_duration END) * 3
ORDER BY recent_ms DESC;`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A DBA runs the challenge\'s exact regression-detection query nightly. A query that was consistently fast for 30 days spikes to 2x its normal duration in the latest interval — a real, meaningful regression a human would want to investigate. Does the challenge\'s query reliably flag it?',
    hint: 'Work out what AVG(s.avg_duration) actually averages over — does it include or exclude the spiked latest interval\'s own value?',
    solution: `Not reliably. Because AVG(s.avg_duration) includes the latest
(spiked) interval in its own baseline, a genuine 2x regression
against the TRUE historic average gets diluted -- with 30 healthy
prior intervals and one spiked one, the contaminated average barely
moves, so the ratio against it stays close to the TRUE 2x and still
correctly misses the 3x threshold either way. But for regressions in
the 2.5x-4x range against a clean baseline with a SHORT history
(few prior intervals, so the outlier has more weight on the
average), the self-inclusion can push a query that should trigger
the 3x threshold to fall just under it -- or vice versa, since the
threshold comparison itself becomes less predictable once the
"historic" side is contaminated by the exact value it's being
measured against.

The fix is straightforward: exclude the latest interval from the
AVG() computing the historic baseline, exactly as shown in the
second code example — this makes "historic" mean what the query's
own column alias (historic_avg_ms) already claims it means.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a "historic average" column that spans every row in a CTE naturally excludes whatever "recent" value is being compared against it, since they are computed with different CASE expressions.',
      reality: 'AVG(s.avg_duration) with no filter aggregates every row in scope, including the one already isolated by the recent_ms CASE expression — using a CASE expression for one metric does not automatically exclude that row from a plain, unfiltered aggregate computed alongside it.',
    },
    {
      thought: 'a regression-detection query either works or does not — if it runs without error and returns a ratio, that ratio is trustworthy.',
      reality: 'a query can run without error and still measure the wrong thing — here, the ratio is mathematically valid but computed against a baseline that is subtly contaminated by the value it is supposed to serve as a clean reference point for.',
    },
    {
      thought: 'this kind of self-inclusion bug barely matters in practice, since a genuine regression is usually severe enough to clear the threshold regardless.',
      reality: 'the size of the distortion depends on the number of prior intervals and the severity of the spike — a short history (few prior intervals) or a borderline regression is exactly where the contamination can flip a query from flagged to unflagged.',
    },
  ];
}
