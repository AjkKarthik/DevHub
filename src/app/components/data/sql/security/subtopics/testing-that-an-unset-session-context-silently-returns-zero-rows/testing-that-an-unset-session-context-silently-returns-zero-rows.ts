import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-unset-session-context-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-an-unset-session-context-silently-returns-zero-rows.html',
  styleUrl: './testing-that-an-unset-session-context-silently-returns-zero-rows.scss',
})
export class TestingThatAnUnsetSessionContextSilentlyReturnsZeroRowsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Filter Predicate Depends on a Value the Application Must Set',
      points: [
        'The main page\'s RLS code tab is explicit that the application "sets context before each query": EXEC sp_set_session_context N\'TenantId\', @currentTenantId; — the security.fn_tenant_filter predicate function then compares tenant_id to CAST(SESSION_CONTEXT(N\'TenantId\') AS INT).',
        'SESSION_CONTEXT returns NULL for any key that was never set for the current session — sp_set_session_context is never called automatically; it is entirely the calling application\'s responsibility to invoke it, and nothing enforces that it happens before every query.',
      ],
    },
    {
      heading: 'What Happens When That Call Is Skipped',
      points: [
        'If a session never calls sp_set_session_context N\'TenantId\', ..., SESSION_CONTEXT(N\'TenantId\') evaluates to NULL. The predicate\'s comparison becomes @tenant_id = CAST(NULL AS INT), which is @tenant_id = NULL — and per standard SQL three-valued logic, any comparison to NULL evaluates to NULL (neither TRUE nor FALSE), which a WHERE clause treats as excluding the row.',
        'The practical result: EVERY row in dbo.orders fails the filter predicate, and a query against it returns ZERO rows — not an error, not a warning, not all rows (which would be the dangerous fail-open case) — just a silently empty result set that looks identical to "this tenant genuinely has no orders."',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the missing sp_set_session_context call',
      language: 'sql',
      code: `-- Fresh connection/session -- sp_set_session_context is NEVER called
-- (e.g. a background job, a migration script, or a pooled connection
-- reused without re-setting context)

SELECT SESSION_CONTEXT(N'TenantId');
-- NULL

SELECT COUNT(*) FROM dbo.orders;
-- 0
--
-- Even though dbo.orders genuinely has hundreds of rows across
-- multiple tenants, this session sees zero -- with no error and no
-- indication that anything is misconfigured. The query looks
-- exactly like "this tenant has no orders yet."`,
    },
    {
      label: 'Confirming it is fail-CLOSED, not fail-OPEN',
      language: 'sql',
      code: `-- Confirm the table genuinely has data, from a session that
-- correctly sets context:
EXEC sp_set_session_context N'TenantId', 42;
SELECT COUNT(*) FROM dbo.orders;
-- 87  -- tenant 42's own rows, correctly filtered

-- Confirm a session with a DIFFERENT tenant sees only ITS rows:
EXEC sp_set_session_context N'TenantId', 17;
SELECT COUNT(*) FROM dbo.orders;
-- 34  -- tenant 17's own rows

-- The NULL-context session above returning 0 is consistent with
-- fail-closed behavior: NULL never equals any real tenant_id value,
-- so a missing context excludes ALL rows rather than exposing them
-- across every tenant. This is the SAFE failure mode for a security
-- feature -- but it is silent, which is the actual gotcha here.`,
    },
    {
      label: 'Making the failure loud instead of silent',
      language: 'sql',
      code: `-- Option: have the application-facing stored procedure verify
-- context is set before running any tenant-scoped query
CREATE OR ALTER PROCEDURE dbo.GetOrders
AS
BEGIN
    IF SESSION_CONTEXT(N'TenantId') IS NULL
        THROW 51000, 'TenantId session context was never set for this session.', 1;

    SELECT * FROM dbo.orders;  -- RLS filter still applies underneath
END;

-- Now a caller that forgot sp_set_session_context gets an explicit,
-- diagnosable error instead of a silently empty result set:
EXEC dbo.GetOrders;
-- Msg 51000: TenantId session context was never set for this session.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A new background job queries dbo.orders directly (bypassing the application\'s usual code path that calls sp_set_session_context) to generate a nightly report. The report comes back completely empty. The developer assumes the orders table is empty in this environment. Is that a safe assumption?',
    hint: 'Check what SESSION_CONTEXT(N\'TenantId\') evaluates to for a session that never calls sp_set_session_context, and what the filter predicate does with that value.',
    solution: `No — it is not a safe assumption. Because the background job never
calls sp_set_session_context, SESSION_CONTEXT(N'TenantId') is NULL
for that session, and the filter predicate's comparison
(tenant_id = NULL) excludes every row via three-valued logic. The
table can be full of data across many tenants, and this session
would still see a completely empty result — indistinguishable from
a genuinely empty table without additional investigation.

This IS the safe failure mode for the security feature itself (it
fails closed, not open — no tenant's data leaks to a
context-less session) but it is silent, which misleads whoever is
debugging the "empty report." Guarding tenant-scoped entry points
with an explicit NULL-context check (as shown in the third code
example) turns this into a diagnosable error instead of a confusing
false negative.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a query against an RLS-protected table returns zero rows, the underlying table must genuinely be empty (or empty for that tenant).',
      reality: 'a session that never set the required session context value returns zero rows too, for a completely different reason — the filter predicate excludes every row when the context value is NULL, which looks identical to genuine emptiness from the query result alone.',
    },
    {
      thought: 'a security feature failing "quietly" (returning no data) is always safe and never needs additional handling.',
      reality: 'fail-closed IS the safe behavior from a security standpoint (no cross-tenant leakage) — but silent failure still causes real operational confusion, wasted debugging time, and false conclusions about data state, which is worth guarding against explicitly.',
    },
    {
      thought: 'sp_set_session_context is automatically called by SQL Server or the connection pool as part of establishing a session.',
      reality: 'it is entirely the calling application\'s responsibility to invoke it explicitly, typically at the start of each request — a pooled connection reused across different logical sessions, a background job, or a forgotten code path can all skip it silently.',
    },
  ];
}
