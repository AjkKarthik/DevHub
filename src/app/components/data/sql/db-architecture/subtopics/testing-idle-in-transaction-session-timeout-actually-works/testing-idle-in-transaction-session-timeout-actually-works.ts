import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-idle-transaction-timeout-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-idle-in-transaction-session-timeout-actually-works.html',
  styleUrl: './testing-idle-in-transaction-session-timeout-actually-works.scss',
})
export class TestingIdleInTransactionSessionTimeoutActuallyWorksSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Recommended Setting Is Never Proven to Work',
      points: [
        'The main page\'s own Q&A recommends setting idle_in_transaction_session_timeout to auto-terminate idle-in-transaction sessions, but never proves the setting actually works as configured — a value that\'s misconfigured (wrong units, set at the wrong scope, or overridden by a role-level setting) could silently fail to protect the database, and nobody would notice until a REAL stuck session causes an incident. A deliberate test — open a transaction, leave it idle past the configured timeout, then verify the session is actually gone — proves the setting is live and working.',
        'This matters because idle_in_transaction_session_timeout can be set at multiple scopes (postgresql.conf globally, per-database via ALTER DATABASE, per-role via ALTER ROLE, or per-session via SET) — a value set at one scope can be silently overridden by a more specific one, and the only way to know what\'s ACTUALLY in effect for a given connection is to check the setting for that specific session, or to actually test the termination behavior end-to-end.',
      ],
    },
    {
      heading: 'Verify From the Outside, Not Just From the Terminated Session Itself',
      points: [
        'Seeing the terminated session\'s own error message ("terminating connection due to idle-in-transaction timeout") only proves it worked for THAT one connection, at that one moment. A second, independent monitoring query against pg_stat_activity — checking that no session has been idle in transaction longer than the configured threshold — is what actually proves the protection is systemically in place, not just observed once by chance.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Forcing the timeout to fire and observing it',
      language: 'sql',
      code: `-- Set a SHORT timeout for this test session only — does not affect
-- other connections or the server-wide default.
SET idle_in_transaction_session_timeout = '2s';

BEGIN;
SELECT 1;   -- transaction is now open, then goes idle...
-- Wait past the 2-second timeout:
SELECT pg_sleep(3);
-- ERROR: terminating connection due to idle-in-transaction timeout
-- This very connection was killed by the server.`,
    },
    {
      label: 'Verifying from a separate monitoring connection',
      language: 'sql',
      code: `-- From a SEPARATE session, verify no idle-in-transaction session
-- lingers past the configured timeout for ANY connection using it:
SELECT pid, application_name, state, now() - state_change AS idle_duration
FROM pg_stat_activity
WHERE state = 'idle in transaction'
  AND now() - state_change > INTERVAL '10 seconds';
-- Should return ZERO rows if idle_in_transaction_session_timeout is
-- correctly configured and enforced for every connecting role/database.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team sets <code>idle_in_transaction_session_timeout = \'5min\'</code> in postgresql.conf (the global default), confirms it works with a manual test like the one above, and considers the problem solved. Six months later, a specific reporting service\'s connections are found idling in transaction for over an hour with no auto-termination. What is the most likely explanation, given that the global setting was proven to work?',
    hint: 'The global postgresql.conf value is the DEFAULT — think about what other, more specific scopes could override it for just one particular role or database, and why a manual test using your OWN interactive session might not reveal a role-specific override.',
    solution: `The most likely explanation is that the reporting service connects
using a DATABASE ROLE that has its own more specific override —
something like ALTER ROLE reporting_user SET
idle_in_transaction_session_timeout = 0 (or a very large value) would
silently disable the timeout for connections made as that role
specifically, regardless of what the global postgresql.conf default
says. Per-role and per-database settings take precedence over the
global default.

This is exactly why the manual test in the code tabs above is
INCOMPLETE if only run once, using the tester's OWN role/session — it
proves the setting works for THAT role, not necessarily for every role
that actually connects to the database. A more thorough verification
checks the effective setting while connected AS the specific role in
question, rather than assuming a global postgresql.conf value applies
uniformly to every connection.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'setting idle_in_transaction_session_timeout once in postgresql.conf guarantees it applies to every connection to every database, regardless of which role connects.',
      reality: 'the setting can be overridden per-database (ALTER DATABASE) or per-role (ALTER ROLE) — a more specific scope silently takes precedence over the global postgresql.conf default for connections using that database or role.',
    },
    {
      thought: 'manually testing that idle_in_transaction_session_timeout terminates YOUR OWN test session proves the protection is active for the whole database.',
      reality: 'it only proves the setting is in effect for the role and database you tested AS — a different role with its own override could behave completely differently, undetected by a test run under a different identity.',
    },
    {
      thought: 'if idle_in_transaction_session_timeout is configured, idle-in-transaction sessions can never accumulate and cause the problems the main page\'s own Q&A describes (lock contention, VACUUM horizon pinning).',
      reality: 'the setting only terminates sessions that have been IDLE for longer than the configured duration — a session making occasional, infrequent activity (even just a trivial query every few minutes) never triggers the timeout, while still holding an open transaction and its locks the entire time.',
    },
  ];
}
