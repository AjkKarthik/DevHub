import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-set-local-pgbouncer-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './correcting-the-claim-that-set-local-requires-pgbouncer-session-mode.html',
  styleUrl: './correcting-the-claim-that-set-local-requires-pgbouncer-session-mode.scss',
})
export class CorrectingTheClaimThatSetLocalRequiresPgbouncerSessionModeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Claim',
      points: [
        'The "PostgreSQL: PgBouncer" theory section lists: "Session mode: one server connection per client session — safer for apps that use session-level features (SET LOCAL, advisory locks, prepared statements without re-binding)." SET LOCAL is grouped alongside advisory locks and prepared statements as something requiring session mode to be safe.',
        'But SET LOCAL is not a session-level feature — PostgreSQL\'s own documentation defines it as explicitly TRANSACTION-scoped: "SET LOCAL... the effects of that command will vanish at the end of the current transaction, whether committed or not." It behaves the OPPOSITE of a persistent session setting.',
      ],
    },
    {
      heading: 'Why That Makes It Safe Under Transaction Mode, Not Unsafe',
      points: [
        'PgBouncer\'s transaction mode releases the server connection back to the pool at the end of each transaction — a different client\'s next transaction may reuse that same server connection. A PLAIN SET (no LOCAL) would leak its setting into that next, unrelated client\'s transaction, since plain SET persists for the rest of the session (which transaction mode has no stable concept of).',
        'SET LOCAL automatically reverts at the transaction boundary — exactly the boundary at which PgBouncer transaction mode hands the connection to someone else. This makes SET LOCAL specifically the RECOMMENDED, pool-safe way to set a configuration value under transaction-mode PgBouncer, not a feature that requires abandoning transaction mode for session mode.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Demonstrating SET LOCAL\'s transaction scope',
      language: 'sql',
      code: `BEGIN;
SET LOCAL statement_timeout = '5s';
SHOW statement_timeout;
-- 5s

COMMIT;
SHOW statement_timeout;
-- (back to the session/server default, e.g. 0 -- SET LOCAL's
-- effect vanished automatically at COMMIT, exactly as PostgreSQL's
-- own documentation describes)`,
    },
    {
      label: 'Why plain SET (not SET LOCAL) is the actual pooling hazard',
      language: 'sql',
      code: `-- Client A, sharing a PgBouncer transaction-mode server connection:
BEGIN;
SET statement_timeout = '5s';   -- plain SET, no LOCAL
COMMIT;
-- PgBouncer releases this server connection back to the pool --
-- but statement_timeout = '5s' is STILL SET on it, because plain
-- SET persists for the rest of the underlying session, which
-- transaction mode has no per-client boundary for.

-- Client B, later reusing the SAME pooled server connection:
BEGIN;
SELECT pg_sleep(6);  -- a query Client B expected to succeed
-- ERROR: canceling statement due to statement timeout
COMMIT;
-- Client B's query fails because of a setting Client A applied --
-- this cross-client leakage is the REAL session-mode-requiring
-- hazard the theory section's SET LOCAL example should have named.`,
    },
    {
      label: 'The fix — use SET LOCAL for this exact scenario',
      language: 'sql',
      code: `-- Client A:
BEGIN;
SET LOCAL statement_timeout = '5s';   -- transaction-scoped
COMMIT;
-- Automatically reverts at COMMIT -- the setting never leaks to
-- whichever client's transaction reuses this server connection next.

-- Client B, reusing the same pooled connection afterward:
BEGIN;
SELECT pg_sleep(6);
-- Succeeds normally -- Client A's SET LOCAL never affected it.
COMMIT;`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer reads the main page\'s theory list and concludes their app must switch PgBouncer from transaction mode to session mode because it uses SET LOCAL statement_timeout at the start of certain transactions. Is that switch actually necessary?',
    hint: 'Check PostgreSQL\'s own documentation for exactly when a SET LOCAL value reverts, and compare that to when PgBouncer transaction mode releases the server connection.',
    solution: `No — the switch is unnecessary, and likely counter-productive
(session mode is less efficient, requiring one server connection
per client session instead of sharing a small pool across many
clients). SET LOCAL's value automatically reverts at the end of the
transaction — precisely the same point at which PgBouncer's
transaction mode releases the server connection back to the pool.
There is no window where SET LOCAL's effect could leak to a
different client sharing that connection.

The setting that genuinely requires session mode (or an explicit
reset) is plain SET without LOCAL — its effect persists past the
transaction boundary and DOES leak into whichever client's
transaction reuses the pooled server connection next, exactly as
demonstrated in the second code example above.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'SET LOCAL and plain SET are just two syntax variants of the same command, so both need to be treated with equal caution under PgBouncer transaction mode.',
      reality: 'they have fundamentally different scopes — SET LOCAL is transaction-scoped and automatically reverts at COMMIT/ROLLBACK, while plain SET persists for the rest of the underlying session, which is exactly what makes plain SET unsafe under connection-sharing transaction mode.',
    },
    {
      thought: 'any documentation list of "session-level features" that require PgBouncer session mode can be trusted item-by-item without independently checking each one\'s actual scope.',
      reality: 'SET LOCAL specifically was included in such a list on this page despite PostgreSQL\'s own documentation describing it as transaction-scoped — worth verifying each named feature\'s real behavior against official docs before restructuring a pooling configuration around the claim.',
    },
    {
      thought: 'switching from PgBouncer transaction mode to session mode is a low-cost, safe way to "be extra careful" about any session-adjacent PostgreSQL feature.',
      reality: 'session mode gives up transaction mode\'s core efficiency benefit (many clients sharing few server connections) — an unnecessary switch, triggered by a misclassified feature like SET LOCAL, has a real operational cost in connection capacity.',
    },
  ];
}
