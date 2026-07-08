import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-idle-tx-aborted-state-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-idle-in-transaction-queries-miss-the-aborted-state.html',
  styleUrl: './testing-that-the-idle-in-transaction-queries-miss-the-aborted-state.scss',
})
export class TestingThatTheIdleInTransactionQueriesMissTheAbortedStateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Every Query on the Page Filters on an Exact Match',
      points: [
        'Three separate places on the main page filter pg_stat_activity for idle-in-transaction sessions, and all three use an exact-equality filter: WHERE state = \'idle in transaction\' — the "Idle-in-transaction detection" code tab (twice) and the challenge\'s own PostgreSQL solution for part (2).',
        'PostgreSQL tracks a SECOND, related state: \'idle in transaction (aborted)\' — this occurs when a statement inside the transaction fails (a constraint violation, a syntax error, a deadlock victim, etc.) and the client neither issues ROLLBACK nor a fresh COMMIT/ROLLBACK — the transaction is left in a failed, unusable state, but the session is still open and, crucially, still holding whatever locks it acquired before the failure.',
      ],
    },
    {
      heading: 'Why This Is Not Just a Cosmetic Miss',
      points: [
        'An exact match on state = \'idle in transaction\' returns ZERO rows for a session in the \'idle in transaction (aborted)\' state — every query on the page systematically excludes it, meaning it never appears in any of the monitoring, alerting, or auto-kill logic the page describes.',
        'A transaction in the aborted state holds the SAME kind of locks as a normal idle-in-transaction session (row/page locks from statements that succeeded BEFORE the failing one) — it is arguably a WORSE case, since it often indicates an application bug that swallowed an error and never issued the required ROLLBACK, leaving the session stuck in a state where it cannot even run new statements without first rolling back.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing a session in the aborted state',
      language: 'sql',
      code: `-- Session A
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;  -- succeeds, holds a lock
INSERT INTO accounts (id, balance) VALUES (1, 500);         -- fails: duplicate key
-- ERROR:  duplicate key value violates unique constraint "accounts_pkey"
-- The transaction is now ABORTED -- any further statement in it
-- (except ROLLBACK) will also fail, but the session stays open and
-- the earlier UPDATE's lock on account id=1 is still held.

-- From a different session, check pg_stat_activity:
SELECT pid, state, query
FROM pg_stat_activity
WHERE state LIKE 'idle in transaction%';
-- state: 'idle in transaction (aborted)'  <- note the suffix

SELECT pid, state, query
FROM pg_stat_activity
WHERE state = 'idle in transaction';   -- the page's exact filter
-- 0 rows -- the aborted session is completely invisible to this
-- exact-match query, despite still holding a lock on account id=1.`,
    },
    {
      label: 'The fix — match both idle-in-transaction states',
      language: 'sql',
      code: `SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    EXTRACT(EPOCH FROM (now() - state_change)) AS idle_in_txn_seconds,
    LEFT(query, 100) AS last_query
FROM pg_stat_activity
WHERE state LIKE 'idle in transaction%'   -- catches both variants
ORDER BY idle_in_txn_seconds DESC;

-- Auto-kill logic should also cover both:
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state LIKE 'idle in transaction%'
  AND state_change < now() - INTERVAL '5 minutes';

-- idle_in_transaction_session_timeout in postgresql.conf DOES
-- already cover both states automatically (it is a server-side
-- setting, not a query filter) -- it's specifically the page's
-- hand-written monitoring/diagnostic QUERIES that need the LIKE
-- pattern to match what the server-side timeout already handles.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You run the main page\'s exact "Idle-in-transaction detection" query and it reports zero problem sessions. Meanwhile, a support ticket describes a hung UPDATE that has been blocked for 10 minutes. You check pg_locks and find the blocking session\'s pid — but your idle-in-transaction query never showed it. What state is the blocking session actually in?',
    hint: 'Check pg_stat_activity directly for that specific pid\'s state column, rather than trusting the exact-match query\'s empty result.',
    solution: `It's very likely in the 'idle in transaction (aborted)' state, not
'idle in transaction'. The page's query uses an exact-equality
filter (state = 'idle in transaction') that only matches the
non-aborted variant, so a session sitting there after a failed
statement -- one that never got the required ROLLBACK -- is
invisible to it, despite holding exactly the kind of lock that's
blocking the reported UPDATE.

Switching the filter to state LIKE 'idle in transaction%' (or
state IN ('idle in transaction', 'idle in transaction (aborted)'))
catches both variants. This is a common real-world cause of "phantom"
blocking sessions that standard idle-in-transaction monitoring
misses — an application that catches an exception from a failed
statement but forgets to also call ROLLBACK before returning the
connection to its pool.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a failed statement inside a PostgreSQL transaction automatically rolls back that transaction, so there is nothing left to hold locks or need cleanup.',
      reality: 'PostgreSQL marks the transaction as ABORTED and blocks any further statements in it, but does NOT automatically issue a ROLLBACK — the client must explicitly send ROLLBACK, and until it does, the session stays open holding whatever locks it acquired before the failure.',
    },
    {
      thought: 'state = \'idle in transaction\' is a complete, exhaustive filter for "sessions holding a transaction open without doing anything" in pg_stat_activity.',
      reality: 'PostgreSQL tracks a second, closely related state — \'idle in transaction (aborted)\' — that an exact-equality filter silently excludes, even though it represents the same category of lock-holding, connection-hogging problem.',
    },
    {
      thought: 'if a monitoring query built specifically to find idle-in-transaction sessions returns zero results, there are genuinely no idle-in-transaction sessions to worry about.',
      reality: 'an exact-match filter that misses the aborted variant can return zero results while a genuinely problematic, lock-holding aborted session sits unreported — always verify a monitoring query\'s coverage against the full list of relevant state values, not just the one most commonly documented.',
    },
  ];
}
