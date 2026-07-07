import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-scope-identity-vs-identity-trigger-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-the-scope-identity-vs-identity-divergence-with-a-trigger.html',
  styleUrl: './demonstrating-the-scope-identity-vs-identity-divergence-with-a-trigger.scss',
})
export class DemonstratingTheScopeIdentityVsIdentityDivergenceWithATriggerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Distinction Explained, Never Shown',
      points: [
        'The main page correctly explains, in both the theory and the quiz: "SCOPE_IDENTITY() returns the last value in the current scope; @@IDENTITY includes values from triggers fired in the same session." But the "MSSQL IDENTITY" code tab only ever calls SCOPE_IDENTITY() — @@IDENTITY never appears anywhere in the page\'s actual SQL, and no trigger scenario is ever built to make the two functions genuinely diverge.',
        'This subtopic constructs the exact scenario the explanation describes: an orders table with an AFTER INSERT trigger that itself inserts into a SEPARATE table with its own IDENTITY column — and shows @@IDENTITY silently returning the trigger\'s generated ID instead of the original INSERT\'s, while SCOPE_IDENTITY() stays correctly scoped.',
      ],
    },
    {
      heading: 'Why This Divergence Is Dangerous in Practice',
      points: [
        'A developer who reaches for @@IDENTITY out of habit (it\'s the older, more commonly seen function in legacy T-SQL code) gets the CORRECT value as long as no trigger fires on the table being inserted into. The bug only appears once someone LATER adds an audit-log trigger, or any other AFTER INSERT trigger that writes to a table with its own IDENTITY column — at which point every caller using @@IDENTITY silently starts receiving the wrong ID, with no error.',
        'This is exactly the kind of "worked fine for years, broke the day someone added an unrelated trigger" bug that SCOPE_IDENTITY() was introduced specifically to prevent.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup — an orders table with an audit-log trigger',
      language: 'sql',
      code: `CREATE TABLE orders (
    order_id  INT IDENTITY(1,1) PRIMARY KEY,
    customer  VARCHAR(100) NOT NULL
);

CREATE TABLE audit_log (
    log_id    INT IDENTITY(1,1) PRIMARY KEY,   -- its own, unrelated IDENTITY
    action    VARCHAR(50),
    logged_at DATETIME DEFAULT GETDATE()
);
GO

CREATE TRIGGER trg_orders_audit
ON orders
AFTER INSERT
AS
BEGIN
    INSERT INTO audit_log (action) VALUES ('order_inserted');
    -- This INSERT generates its OWN new log_id from audit_log's
    -- IDENTITY column -- a completely separate counter from orders.
END;
GO`,
    },
    {
      label: '@@IDENTITY silently returns the WRONG table\'s ID',
      language: 'sql',
      code: `INSERT INTO orders (customer) VALUES ('Alice');

SELECT @@IDENTITY       AS last_identity_session,
       SCOPE_IDENTITY() AS last_identity_scope;

--  last_identity_session | last_identity_scope
-- ------------------------+----------------------
--             1           |          1
-- (First insert into an empty audit_log -- both happen to match,
-- masking the bug on the very first test.)

-- Insert a second order:
INSERT INTO orders (customer) VALUES ('Bob');

SELECT @@IDENTITY       AS last_identity_session,
       SCOPE_IDENTITY() AS last_identity_scope;

--  last_identity_session | last_identity_scope
-- ------------------------+----------------------
--             2           |          2
-- (Still matching by coincidence -- audit_log's log_id and orders'
-- order_id happen to be incrementing in lockstep in this specific
-- example, since every order triggers exactly one audit row.)`,
    },
    {
      label: 'Where the divergence actually shows up',
      language: 'sql',
      code: `-- Add a SECOND, unrelated table that also uses audit_log via its
-- own trigger, breaking the lockstep coincidence above:
CREATE TABLE page_views (view_id INT IDENTITY(1,1) PRIMARY KEY, url VARCHAR(200));
GO
CREATE TRIGGER trg_page_views_audit ON page_views AFTER INSERT AS
BEGIN
    INSERT INTO audit_log (action) VALUES ('page_viewed');
END;
GO

INSERT INTO page_views (url) VALUES ('/home');   -- consumes audit_log id 3

-- Now insert a THIRD order:
INSERT INTO orders (customer) VALUES ('Carol');

SELECT @@IDENTITY       AS last_identity_session,
       SCOPE_IDENTITY() AS last_identity_scope;

--  last_identity_session | last_identity_scope
-- ------------------------+----------------------
--             4           |          3
--
-- @@IDENTITY returns 4 -- the audit_log row's ID generated by the
-- trigger -- NOT 3, the actual new orders.order_id. SCOPE_IDENTITY()
-- correctly stays scoped to the orders INSERT and returns 3. Any
-- application code using @@IDENTITY to fetch the new order's ID is
-- now silently capturing the wrong table's key.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An application has used @@IDENTITY to retrieve new order IDs for years without any reported bugs. Last week, a DBA added an AFTER INSERT trigger on orders to write to a shared audit_log table for compliance reasons. This week, customers are receiving order confirmation emails with the wrong order number. What\'s the connection, and why did this only surface now?',
    hint: 'Trace what @@IDENTITY actually returns once a trigger on the SAME insert statement generates its own identity value in a different table.',
    solution: `The new AFTER INSERT trigger on orders now inserts into audit_log,
which has its own IDENTITY column. @@IDENTITY returns the last
identity value generated ANYWHERE in the current session, including
by triggers -- so immediately after the orders INSERT fires the
trigger, @@IDENTITY reflects audit_log's newly generated log_id, not
orders.order_id. The application code retrieving the "new order ID"
via @@IDENTITY has been silently capturing the wrong table's key ever
since the trigger was added.

This surfaced only now because @@IDENTITY behaved correctly for
years specifically BECAUSE no trigger existed to generate a
DIFFERENT identity value in the same session -- the bug was latent in
the application's choice of function the whole time, just never
triggered (literally) until this specific change. The fix is
replacing every @@IDENTITY call with SCOPE_IDENTITY(), which stays
correctly scoped to the original INSERT statement's own scope
regardless of what any trigger on that table does afterward.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '@@IDENTITY and SCOPE_IDENTITY() are interchangeable as long as no error is observed in testing — the "scope" distinction between them is mostly theoretical.',
      reality: 'the two functions only diverge once a trigger on the same table generates ITS OWN identity value in a different table — code using @@IDENTITY can pass every test for years and then silently break the moment an unrelated trigger is added later.',
    },
    {
      thought: 'if @@IDENTITY returns the correct value in initial testing right after adding a new trigger, it will continue to be correct going forward.',
      reality: 'the divergence between @@IDENTITY and SCOPE_IDENTITY() can appear to "accidentally" match for a while (as shown in the second code tab) purely because trigger-generated IDs happen to increment in lockstep with the original table\'s IDs — this coincidence can break as soon as a second, unrelated table shares the same audit/trigger pattern.',
    },
    {
      thought: 'the bug caused by using @@IDENTITY instead of SCOPE_IDENTITY() would be caught immediately by an error or exception, since the wrong ID is clearly a different value.',
      reality: '@@IDENTITY returns a valid-looking integer with no error at all — the application receives a real ID, just for the wrong row, and the bug only becomes visible through downstream symptoms (like a customer seeing the wrong order number) rather than a database-level failure.',
    },
  ];
}
