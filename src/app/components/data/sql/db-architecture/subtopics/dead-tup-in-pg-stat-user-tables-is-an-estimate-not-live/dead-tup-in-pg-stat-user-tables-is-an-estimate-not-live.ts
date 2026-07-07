import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-dead-tup-estimate-staleness-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './dead-tup-in-pg-stat-user-tables-is-an-estimate-not-live.html',
  styleUrl: './dead-tup-in-pg-stat-user-tables-is-an-estimate-not-live.scss',
})
export class DeadTupInPgStatUserTablesIsAnEstimateNotLiveSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'n_dead_tup in pg_stat_user_tables Is an Estimate, Not a Live Physical Count',
      points: [
        'The main page\'s own "Table bloat" query reads n_live_tup and n_dead_tup directly from pg_stat_user_tables and presents the resulting dead_pct as if it were an authoritative, current measurement — but these columns are STATISTICS ESTIMATES maintained incrementally by PostgreSQL\'s stats collector as INSERT/UPDATE/DELETE operations happen, not a live physical count of the table\'s actual heap file. They can drift from reality — most notably, a server restart (or certain crash/recovery scenarios) resets the stats collector\'s counters, and PostgreSQL doesn\'t retroactively recompute them from the actual file until the next VACUUM or ANALYZE touches the table.',
        'This means a table that hasn\'t been touched by VACUUM/ANALYZE since a recent restart can show n_dead_tup = 0 or a wildly understated number in pg_stat_user_tables — not because it has no bloat, but because the STATISTIC tracking that bloat was reset and hasn\'t been refreshed yet. The main page\'s own diagnostic query would silently under-report a genuinely bloated table in exactly this scenario.',
      ],
    },
    {
      heading: 'pgstattuple Gives the Authoritative (But Expensive) Answer',
      points: [
        'The pgstattuple extension\'s pgstattuple(\'tablename\') function performs an ACTUAL physical scan of the table\'s heap file and returns the true, current dead-tuple percentage — no estimate, no staleness risk. The tradeoff is cost: unlike the cheap catalog lookup in pg_stat_user_tables, pgstattuple reads the entire table from disk (or buffer cache), which can be expensive on a large table. The practical pattern: use pg_stat_user_tables for routine, cheap monitoring across many tables, and reach for pgstattuple to get an authoritative answer on ONE specific table when the estimate-based number looks suspicious or the table was recently through an event that could reset stats.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own estimate-based query',
      language: 'sql',
      code: `-- The main page's own query — an ESTIMATE, not a live physical count:
SELECT
    schemaname, relname AS table_name,
    n_live_tup, n_dead_tup,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 1) AS dead_pct,
    last_autovacuum, last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY dead_pct DESC;
-- After a server restart, n_live_tup/n_dead_tup for a table that hasn't
-- been VACUUMed or ANALYZEd SINCE the restart can be 0 or stale —
-- this query would show it as having NO bloat, even if it genuinely does.`,
    },
    {
      label: 'The authoritative check via pgstattuple',
      language: 'sql',
      code: `CREATE EXTENSION IF NOT EXISTS pgstattuple;

-- Authoritative, physical-scan-based check for ONE specific table:
SELECT * FROM pgstattuple('orders');
-- Returns: table_len, tuple_count, tuple_len, tuple_percent,
--          dead_tuple_count, dead_tuple_len, dead_tuple_percent,
--          free_space, free_percent
-- dead_tuple_percent here is computed from the REAL heap file right now
-- — no estimate, no staleness, but a real I/O cost to compute it.

-- Compare against the estimate:
SELECT n_live_tup, n_dead_tup,
       ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 1) AS estimated_dead_pct
FROM pg_stat_user_tables WHERE relname = 'orders';
-- If these two numbers diverge significantly, the ESTIMATE has drifted
-- from reality — trust pgstattuple's result over pg_stat_user_tables.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'After a PostgreSQL server crash and restart, a DBA runs the main page\'s own "Table bloat" query and sees dead_pct = 0.0 for every single table in the database — suspiciously clean. Should this be trusted at face value, and what would confirm or refute it?',
    hint: 'Think about what event just happened to the server, and what the main page\'s own query\'s data source (pg_stat_user_tables) actually depends on to stay accurate.',
    solution: `This should NOT be trusted at face value. A server crash and restart
resets the PostgreSQL stats collector — n_live_tup and n_dead_tup for
every table revert to a baseline (effectively unknown or zero) until
the NEXT autovacuum or ANALYZE run touches each table and repopulates
real estimates. Seeing dead_pct = 0.0 across the board immediately
after a restart is far more likely to mean "the stats haven't been
recomputed yet" than "every single table genuinely has zero bloat" —
the latter would be an extraordinary coincidence across an entire
database.

To confirm or refute this, run pgstattuple('tablename') on a few tables
known to have had heavy write activity before the crash. Since
pgstattuple performs a REAL physical scan rather than reading the
(just-reset) stats collector estimate, it will reveal the TRUE current
dead-tuple percentage regardless of whether autovacuum has run yet
since the restart — if pgstattuple shows real bloat on tables the
cheap query claims are clean, that confirms the estimate is stale, not
that the tables are actually healthy.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'n_live_tup and n_dead_tup in pg_stat_user_tables always reflect the table\'s real, current state, since PostgreSQL updates them as changes happen.',
      reality: 'they are statistics-collector ESTIMATES that can be reset (e.g. by a server crash/restart) and remain stale or zero until the next VACUUM/ANALYZE run repopulates them — they are not a live physical count of the heap file.',
    },
    {
      thought: 'a dead_pct of 0.0 across every table right after a database restart means the database genuinely has no bloat anywhere.',
      reality: 'it far more likely means the stats collector\'s counters were reset by the restart and haven\'t been recomputed yet — an extraordinary coincidence would be required for every table to genuinely have zero bloat simultaneously.',
    },
    {
      thought: 'pgstattuple and pg_stat_user_tables are interchangeable ways to check table bloat, so there\'s no reason to prefer one over the other.',
      reality: 'pg_stat_user_tables is a cheap, estimate-based catalog lookup suitable for routine monitoring across many tables; pgstattuple performs an authoritative physical scan of one table at real I/O cost — reach for pgstattuple specifically when the cheap estimate looks suspicious or stale.',
    },
  ];
}
