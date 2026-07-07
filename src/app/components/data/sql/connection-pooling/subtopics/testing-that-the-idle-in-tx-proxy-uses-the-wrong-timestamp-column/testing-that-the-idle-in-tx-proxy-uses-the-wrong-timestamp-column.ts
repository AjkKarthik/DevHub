import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-mssql-idle-tx-wrong-timestamp-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-idle-in-tx-proxy-uses-the-wrong-timestamp-column.html',
  styleUrl: './testing-that-the-idle-in-tx-proxy-uses-the-wrong-timestamp-column.scss',
})
export class TestingThatTheIdleInTxProxyUsesTheWrongTimestampColumnSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Challenge\'s MSSQL Idle-Duration Calculation',
      points: [
        'MSSQL has no direct "idle in transaction" state, so the challenge\'s solution builds a proxy: sessions with open_transaction_count > 0 and no row in sys.dm_exec_requests (no active request) are treated as idle-in-transaction. The idle DURATION is computed as: DATEDIFF(SECOND, s.last_request_start_time, GETDATE()) AS idle_s.',
        'sys.dm_exec_sessions has two relevant timestamp columns: last_request_start_time (when the session\'s most recent request STARTED) and last_request_end_time (when it FINISHED). The solution uses last_request_start_time, not last_request_end_time.',
      ],
    },
    {
      heading: 'Why That Overstates Idle Time',
      points: [
        'For a session whose last request was itself long-running (say, a 4-minute report query) and which has been sitting idle-in-transaction for only 5 seconds since that query finished, DATEDIFF(SECOND, last_request_start_time, GETDATE()) computes roughly 4 minutes and 5 seconds — because it measures from when the LONG QUERY BEGAN, not from when the session actually went idle.',
        'This systematically overstates true idle duration by the length of whatever the last request happened to take, and the distortion is worst for exactly the sessions most likely to trigger a false "idle in transaction for 60+ seconds" alert — ones whose last statement was itself slow.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the overstatement with a long query',
      language: 'sql',
      code: `-- Session A: begins a transaction, runs a 3-minute report query,
-- then goes idle immediately after (no COMMIT yet)
BEGIN TRAN;
WAITFOR DELAY '00:03:00';  -- simulating a slow query
-- ... query finishes here, session is now genuinely idle ...
-- (no COMMIT -- simulating an app that forgot to commit)

-- 5 seconds after the WAITFOR finishes, run the challenge's exact
-- proxy query from a DIFFERENT session:
SELECT s.session_id, s.login_name, s.status,
       s.open_transaction_count,
       s.last_request_start_time,
       s.last_request_end_time,
       DATEDIFF(SECOND, s.last_request_start_time, GETDATE()) AS idle_s_BUGGY,
       DATEDIFF(SECOND, s.last_request_end_time,   GETDATE()) AS idle_s_CORRECT
FROM sys.dm_exec_sessions s
WHERE s.is_user_process = 1
  AND s.open_transaction_count > 0
  AND NOT EXISTS (SELECT 1 FROM sys.dm_exec_requests r WHERE r.session_id = s.session_id);
-- idle_s_BUGGY   ≈ 185  (3 min WAITFOR + 5 sec -- measures from the
--                         START of the long-running WAITFOR)
-- idle_s_CORRECT ≈ 5    (the session has genuinely only been idle
--                         for 5 seconds since the WAITFOR completed)`,
    },
    {
      label: 'The fix — use last_request_end_time',
      language: 'sql',
      code: `SELECT s.session_id, s.login_name, s.status,
       s.open_transaction_count,
       s.last_request_end_time,
       DATEDIFF(SECOND, s.last_request_end_time, GETDATE()) AS idle_s
FROM sys.dm_exec_sessions s
WHERE s.is_user_process = 1
  AND s.open_transaction_count > 0
  AND NOT EXISTS (SELECT 1 FROM sys.dm_exec_requests r WHERE r.session_id = s.session_id)
  AND DATEDIFF(SECOND, s.last_request_end_time, GETDATE()) > 60
ORDER BY idle_s DESC;
-- Now the session from the previous example (genuinely idle for
-- only 5 seconds) correctly falls BELOW the 60-second alert
-- threshold, instead of falsely triggering it at ~185 seconds.`,
    },
    {
      label: 'For contrast — the PostgreSQL half already gets this right',
      language: 'sql',
      code: `-- The SAME challenge's PostgreSQL solution uses state_change --
-- the timestamp of the session's last STATE transition, which for
-- 'idle in transaction' correctly means "when it became idle":
SELECT pid, usename, application_name, client_addr,
       EXTRACT(EPOCH FROM (now() - state_change)) AS idle_s,
       LEFT(query, 100) AS last_query
FROM pg_stat_activity
WHERE state = 'idle in transaction'
  AND state_change < now() - INTERVAL '60 seconds'
ORDER BY idle_s DESC;
-- state_change updates the moment the session's STATE changes to
-- 'idle in transaction' -- it is the direct PostgreSQL analogue of
-- MSSQL's last_request_end_time, not last_request_start_time.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An ops team runs the challenge\'s exact MSSQL solution to find sessions "idle in transaction for 60+ seconds" and gets paged for a session showing idle_s = 185. They kill it, assuming the application hung. Later they discover that session had just finished a legitimate 3-minute report query 5 seconds earlier. What went wrong with the diagnostic?',
    hint: 'Check which timestamp column the query subtracts from GETDATE() — one marking when the last request STARTED versus one marking when it ENDED.',
    solution: `The diagnostic query used last_request_start_time instead of
last_request_end_time. For a session whose last request took 3
minutes to run, DATEDIFF(SECOND, last_request_start_time, GETDATE())
measures from when that 3-minute query BEGAN, not from when it
finished and the session actually went idle -- inflating the
reported idle time by the query's own duration.

The session in this scenario was genuinely idle for only about 5
seconds (a completely normal, brief pause), not the 185 seconds the
buggy query reported. Switching to last_request_end_time in both
the SELECT and the WHERE threshold filter (as shown in the fix
above) reports the session's true idle duration and would have
correctly left it below the 60-second alert threshold.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'last_request_start_time and last_request_end_time in sys.dm_exec_sessions are interchangeable for measuring how long a session has been idle.',
      reality: 'last_request_start_time marks when the session\'s most recent request BEGAN — for a slow-running last request, this can be minutes before the session actually went idle. last_request_end_time marks when it actually finished, which is the correct basis for an idle-duration calculation.',
    },
    {
      thought: 'a diagnostic query that runs without error and returns a plausible-looking number (like "185 seconds idle") can be trusted at face value.',
      reality: 'the query here runs perfectly and returns a real, computable number — it is just measuring the wrong interval. Verifying a diagnostic\'s output against independently-known ground truth (in this test, a session with a known, controlled idle duration) is the only way to catch this kind of bug.',
    },
    {
      thought: 'the impact of using the wrong timestamp column is roughly the same for every session, so it is a minor, mostly-cosmetic inaccuracy.',
      reality: 'the distortion is proportional to how long each session\'s LAST request took — sessions with fast last queries are barely affected, while sessions whose last query was itself slow (often the ones most worth investigating) are the ones most severely overstated.',
    },
  ];
}
