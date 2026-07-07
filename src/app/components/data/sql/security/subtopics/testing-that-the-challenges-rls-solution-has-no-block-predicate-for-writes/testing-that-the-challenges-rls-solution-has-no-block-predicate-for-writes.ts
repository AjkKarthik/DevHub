import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-rls-no-block-predicate-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-challenges-rls-solution-has-no-block-predicate-for-writes.html',
  styleUrl: './testing-that-the-challenges-rls-solution-has-no-block-predicate-for-writes.scss',
})
export class TestingThatTheChallengesRlsSolutionHasNoBlockPredicateForWritesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'What the Challenge\'s MSSQL Solution Actually Restricts',
      points: [
        'Step 1 of the challenge\'s MSSQL solution grants app_user SELECT, INSERT, and UPDATE on dbo.orders. Step 2 adds a security policy with a single FILTER PREDICATE bound to security.fn_tenant_filter(tenant_id) — no BLOCK PREDICATE anywhere in the solution.',
        'The quiz\'s own "In MSSQL Row-Level Security, what does a filter predicate do?" answer explains the distinction directly: a filter predicate "transparently adds a WHERE condition to SELECT queries," while "block predicates can additionally prevent INSERT/UPDATE/DELETE of rows that fail the predicate" — two genuinely different mechanisms, and the challenge\'s solution only implements the first.',
      ],
    },
    {
      heading: 'The Consequence: a FILTER-Only Policy Doesn\'t Stop the Write',
      points: [
        'Because app_user has INSERT and UPDATE rights and only a FILTER predicate exists, app_user CAN successfully insert or update a row with a tenant_id belonging to a different tenant than their own session context. The row simply becomes invisible to app_user afterward — the write itself is never blocked.',
        'This is a real, practical risk for a multi-tenant SaaS challenge specifically about tenant isolation: an application bug that computes the wrong tenant_id for an INSERT (e.g., a stale session variable, a copy-paste error in a batch job) would silently write cross-tenant data with no error and no visible symptom to app_user — until a sysadmin or a different tenant\'s session eventually surfaces the row.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the gap with the challenge\'s exact MSSQL solution',
      language: 'sql',
      code: `-- Set up exactly as the challenge's solution specifies
EXEC sp_set_session_context N'TenantId', 42;   -- app_user is tenant 42

-- app_user inserts a row for tenant 42 -- fine, matches session
INSERT INTO dbo.orders (tenant_id, customer_id, amount)
VALUES (42, 100, 59.99);

-- app_user "accidentally" inserts a row for tenant 999 -- a
-- different tenant entirely -- nothing in the RLS setup blocks this:
INSERT INTO dbo.orders (tenant_id, customer_id, amount)
VALUES (999, 200, 149.99);
-- Succeeds. No error, no warning -- the FILTER predicate only
-- affects what SELECT returns, not what INSERT allows.

SELECT * FROM dbo.orders;
-- Returns only the tenant_id = 42 row -- app_user's own filter
-- predicate hides the tenant 999 row FROM THEM, but it is now
-- permanently stored in the table, visible to tenant 999's own
-- session or to any admin/sysadmin account.`,
    },
    {
      label: 'The fix — add a BLOCK PREDICATE for writes',
      language: 'sql',
      code: `ALTER SECURITY POLICY TenantPolicy
ADD BLOCK PREDICATE security.fn_tenant_filter(tenant_id)
ON dbo.orders AFTER INSERT,
ADD BLOCK PREDICATE security.fn_tenant_filter(tenant_id)
ON dbo.orders AFTER UPDATE;

-- Retry the cross-tenant insert:
EXEC sp_set_session_context N'TenantId', 42;
INSERT INTO dbo.orders (tenant_id, customer_id, amount)
VALUES (999, 200, 149.99);
-- Msg 33504: The attempted insert or update failed because the
-- target view either does not meet the WITH CHECK OPTION constraint
-- or contains a derived or constant field.
-- (SQL Server surfaces block predicate violations with this message)
--
-- The cross-tenant write is now genuinely rejected, not just hidden.`,
    },
    {
      label: 'PostgreSQL comparison — its default already covers this',
      language: 'sql',
      code: `-- The PostgreSQL side of the SAME challenge's solution:
CREATE POLICY tenant_policy ON orders
    USING (tenant_id = current_setting('app.tenant_id')::INT);
-- No explicit WITH CHECK clause -- but PostgreSQL's documented
-- default behavior for a FOR ALL (unqualified) policy with no
-- WITH CHECK is to reuse the USING expression for WITH CHECK too:

SET app.tenant_id = '42';
INSERT INTO orders (tenant_id, customer_id, amount)
VALUES (999, 200, 149.99);
-- ERROR: new row violates row-level security policy for table "orders"
--
-- Unlike the MSSQL solution above, PostgreSQL's default policy
-- behavior already blocks this cross-tenant insert, purely because
-- the USING clause doubles as WITH CHECK when none is specified --
-- the two dialects' solutions in the SAME challenge end up with
-- genuinely different security guarantees.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You implement the challenge\'s MSSQL solution exactly as published. A QA tester, logged in as app_user with tenant_id 42 in their session context, runs an INSERT with tenant_id = 17 (a different tenant) by mistake — a typo in their test script. Does the insert fail?',
    hint: 'Check whether the security policy created in the challenge\'s solution includes anything besides ADD FILTER PREDICATE.',
    solution: `No — the insert succeeds without error. The challenge's MSSQL
solution only adds a FILTER PREDICATE, which controls what SELECT
returns, not what INSERT or UPDATE allow. Since app_user has
INSERT rights on dbo.orders and no BLOCK PREDICATE exists, the
mistaken row for tenant 17 is written successfully — it just
becomes invisible to app_user's own subsequent SELECT queries
(since their session context is still tenant 42), silently
"disappearing" from their perspective while remaining in the table
for tenant 17 (or an admin) to discover later.

Adding ADD BLOCK PREDICATE ... AFTER INSERT and AFTER UPDATE to the
same security policy, using the same filter function, closes this
gap — SQL Server then rejects the cross-tenant write outright with
error 33504, instead of silently accepting and hiding it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'MSSQL Row-Level Security is a single, unified feature — once a security policy with a predicate is applied to a table, it protects that table from cross-tenant reads AND writes.',
      reality: 'MSSQL RLS has two genuinely separate predicate types: FILTER predicates (control what SELECT returns) and BLOCK predicates (control what INSERT/UPDATE/DELETE allow). A policy needs BOTH to fully isolate tenants for read and write.',
    },
    {
      thought: 'if a row becomes invisible to a user immediately after they insert it, that means the insert must have been blocked or rolled back.',
      reality: 'a FILTER-only RLS policy can make a row invisible to its own inserting session while the row is permanently and successfully stored in the table — invisibility and rejection are not the same outcome.',
    },
    {
      thought: 'the same challenge\'s MSSQL and PostgreSQL solutions provide equivalent security guarantees, since they implement "the same" row-level security concept.',
      reality: 'here they genuinely diverge — PostgreSQL\'s default policy behavior (USING doubling as WITH CHECK when unspecified) blocks the cross-tenant insert that MSSQL\'s filter-only policy allows through.',
    },
  ];
}
