import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-mssql-tenant-view-missing-check-option-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-mssql-challenge-solution-is-missing-with-check-option.html',
  styleUrl: './testing-that-the-mssql-challenge-solution-is-missing-with-check-option.scss',
})
export class TestingThatTheMssqlChallengeSolutionIsMissingWithCheckOptionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Security Requirement Dropped in Half the Solution',
      points: [
        'The "Secure customer view with row filter" challenge explicitly requires: "Add WITH CHECK OPTION so inserts through the view are also scoped." The PostgreSQL solution correctly includes it. The MSSQL solution — CREATE OR ALTER VIEW dbo.v_tenant_orders WITH SCHEMABINDING AS SELECT ... WHERE tenant_id = CAST(SESSION_CONTEXT(N\'tenant_id\') AS INT); — has NO WITH CHECK OPTION clause at all.',
        'This isn\'t a dialect limitation forcing the omission — T-SQL fully supports combining WITH SCHEMABINDING and WITH CHECK OPTION on the same view. The gap is a straightforward oversight in the sample solution, and it has real security consequences: exactly the "insert a row for a different tenant through this view" scenario the challenge is designed to prevent.',
      ],
    },
    {
      heading: 'What the Missing Clause Actually Costs',
      points: [
        'Without WITH CHECK OPTION, a view\'s WHERE clause only filters what comes BACK out on SELECT — it does nothing to validate what goes IN on INSERT or UPDATE. A session scoped to tenant_id = 1 could INSERT a row with tenant_id = 2 directly through v_tenant_orders, and MSSQL would silently accept it (the row simply wouldn\'t appear in subsequent SELECTs from that same view, since it no longer matches the WHERE filter) — a cross-tenant data leak, exactly the class of bug WITH CHECK OPTION exists to prevent.',
        'This subtopic demonstrates the leak on the MSSQL solution exactly as published, then shows that adding WITH CHECK OPTION (with no other syntax changes) closes it — confirming the gap was a pure oversight, not an unavoidable trade-off.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the cross-tenant leak in the MSSQL solution as published',
      language: 'sql',
      code: `CREATE TABLE orders (order_id INT, customer_id INT, tenant_id INT, amount DECIMAL(10,2), status VARCHAR(20));
GO

-- The challenge's own MSSQL solution, unmodified:
CREATE OR ALTER VIEW dbo.v_tenant_orders
WITH SCHEMABINDING
AS
SELECT order_id, customer_id, tenant_id, amount, status
FROM   dbo.orders
WHERE  tenant_id = CAST(SESSION_CONTEXT(N'tenant_id') AS INT);
GO

EXEC sp_set_session_context @key = N'tenant_id', @value = 1;

-- Insert a row for tenant 1 -- correctly scoped, expected to succeed:
INSERT INTO dbo.v_tenant_orders (order_id, customer_id, tenant_id, amount, status)
VALUES (1, 100, 1, 50.00, 'Pending');

-- Insert a row for tenant 2, while still scoped to tenant 1's session:
INSERT INTO dbo.v_tenant_orders (order_id, customer_id, tenant_id, amount, status)
VALUES (2, 200, 2, 75.00, 'Pending');
-- SUCCEEDS -- no error at all. Without WITH CHECK OPTION, the view's
-- WHERE clause never validates what tenant_id an INSERT is allowed
-- to write -- it only filters what a subsequent SELECT returns.

SELECT * FROM dbo.orders WHERE tenant_id = 2;
-- The tenant-2 row IS in the base table, inserted through a session
-- that should only have been able to touch tenant-1 data.`,
    },
    {
      label: 'The fix — adding the clause the challenge actually asked for',
      language: 'sql',
      code: `CREATE OR ALTER VIEW dbo.v_tenant_orders
WITH SCHEMABINDING
AS
SELECT order_id, customer_id, tenant_id, amount, status
FROM   dbo.orders
WHERE  tenant_id = CAST(SESSION_CONTEXT(N'tenant_id') AS INT)
WITH CHECK OPTION;   -- the missing piece -- fully valid alongside SCHEMABINDING
GO

EXEC sp_set_session_context @key = N'tenant_id', @value = 1;

INSERT INTO dbo.v_tenant_orders (order_id, customer_id, tenant_id, amount, status)
VALUES (3, 300, 2, 20.00, 'Pending');

-- Msg 550, Level 16, State 1
-- The attempted insert or update failed because the target view
-- either specifies WITH CHECK OPTION or spans a view that specifies
-- WITH CHECK OPTION and one or more rows resulting from the
-- operation did not qualify under the CHECK OPTION constraint.
--
-- Now the exact same cross-tenant insert is rejected -- matching the
-- PostgreSQL half of the challenge's own solution, and matching what
-- the challenge description explicitly asked for.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A security review flags that the MSSQL v_tenant_orders view "might allow cross-tenant writes" but the developer who built it points to the PostgreSQL version of the same challenge solution, which has WITH CHECK OPTION, and says "we followed the documented pattern." Are they right to consider this closed, and what should the review actually check?',
    hint: 'Compare the two dialect-specific solutions to the SAME challenge line by line — does "WITH CHECK OPTION" appear in both, or just one?',
    solution: `The developer is not correct to consider this closed. The two
solutions to the same challenge are NOT equivalent: the PostgreSQL
version includes WITH CHECK OPTION, but the MSSQL version does not,
despite the challenge's own requirement applying to both ("Add WITH
CHECK OPTION so inserts through the view are also scoped"). Pointing
to the PostgreSQL half doesn't close a gap that exists specifically
in the MSSQL half.

The review should check the actual MSSQL view definition for the
WITH CHECK OPTION clause, and — more importantly — actually TEST it:
attempt an INSERT through the view for a tenant_id different from the
current session's, exactly as demonstrated above. Without WITH CHECK
OPTION, that insert silently succeeds, meaning any session with
INSERT access to v_tenant_orders can write rows for ANY tenant, not
just its own — a real security gap the "we followed the documented
pattern" defense doesn't actually address, since the documented
pattern for MSSQL specifically was missing the clause.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a view\'s WHERE clause automatically prevents INSERT/UPDATE statements from writing rows that don\'t match that WHERE condition, the same way it filters SELECT results.',
      reality: 'a plain view\'s WHERE clause ONLY filters what SELECT returns — it does nothing to validate or restrict what INSERT/UPDATE writes through the view, unless WITH CHECK OPTION is explicitly added.',
    },
    {
      thought: 'WITH SCHEMABINDING and WITH CHECK OPTION are mutually exclusive or hard to combine in MSSQL, which is why the challenge\'s MSSQL solution only used SCHEMABINDING.',
      reality: 'both clauses are fully independent and can be combined on the same CREATE VIEW statement — the missing WITH CHECK OPTION in the sample solution was an oversight, not a syntax limitation.',
    },
    {
      thought: 'if a security pattern is correctly implemented in one dialect\'s version of a solution (e.g., PostgreSQL), it\'s reasonable to assume the equivalent dialect (MSSQL) implements the same protection.',
      reality: 'each dialect\'s implementation needs to be checked and tested independently — a security-critical clause present in one dialect\'s code sample is not evidence that the other dialect\'s sample includes the equivalent protection.',
    },
  ];
}
