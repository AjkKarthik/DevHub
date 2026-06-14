import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-sql-triggers',
  standalone: true,
  imports: [
    CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, PageCompleteComponent
  ],
  templateUrl: './triggers.html',
  styleUrls: ['./triggers.scss']
})
export class SqlTriggers {

  quickRef: QuickRefItem[] = [
    { name: 'AFTER / FOR trigger',   type: 'keyword', desc: 'Fires after the DML statement completes (both dialects)' },
    { name: 'INSTEAD OF trigger',    type: 'keyword', desc: 'Replaces the DML — only MSSQL and on views' },
    { name: 'BEFORE trigger (PG)',   type: 'keyword', desc: 'PostgreSQL: fires before the row is written; can modify NEW' },
    { name: 'inserted / deleted (MSSQL)', type: 'keyword', desc: 'Pseudo-tables holding the new and old row images' },
    { name: 'NEW / OLD (PG)',        type: 'keyword', desc: 'Special row variables in PL/pgSQL trigger functions' },
    { name: 'ROW vs STATEMENT',      type: 'keyword', desc: 'Row-level fires once per row; statement-level fires once per DML' },
    { name: 'DISABLE TRIGGER',       type: 'keyword', desc: 'MSSQL: temporarily suppress a trigger' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What are triggers?',
      points: [
        'A trigger is stored code that runs automatically when a DML event (INSERT, UPDATE, DELETE) occurs on a table.',
        'Good uses: audit logging, derived column maintenance, enforcing complex constraints that CHECK cannot express, cascading business rules.',
        'Avoid triggers for: application logic (put it in the app), performance-critical paths (triggers add hidden cost), and anything a foreign key constraint or CHECK can do instead.',
      ]
    },
    {
      heading: 'MSSQL triggers',
      points: [
        'Two types: AFTER (default) fires after the DML; INSTEAD OF replaces the DML entirely (used on views).',
        'MSSQL triggers operate on the entire batch, not individual rows. The pseudo-tables inserted and deleted may contain multiple rows — never assume a single row.',
        'A trigger that assumes single-row operation will produce wrong results on multi-row DML: UPDATE orders SET status=\'X\' WHERE region=\'EU\' updates many rows in one shot.',
      ]
    },
    {
      heading: 'PostgreSQL triggers',
      points: [
        'Trigger = trigger definition (CREATE TRIGGER) + trigger function (CREATE FUNCTION … RETURNS trigger).',
        'BEFORE ROW triggers can modify NEW before it is written — return NULL to cancel the row.',
        'AFTER ROW trigger: NEW / OLD available but row already written; raise an exception to abort.',
        'STATEMENT-level triggers fire once per DML statement regardless of rows affected.',
      ]
    },
    {
      heading: 'Audit logging pattern',
      points: [
        'Store before/after snapshots in an audit table: action (INSERT/UPDATE/DELETE), changed_by, changed_at, old values, new values.',
        'MSSQL: join deleted (old) and inserted (new) to capture both images in one INSERT into audit table.',
        'PostgreSQL: BEFORE UPDATE trigger on each row; insert into audit table with OLD.* and NEW.*.',
      ]
    },
    {
      heading: 'Trigger pitfalls',
      points: [
        'Recursive triggers: trigger A fires trigger B which fires A — set RECURSIVE_TRIGGERS OFF (MSSQL) or guard with a session variable (PG).',
        'Performance: row-level triggers on large bulk operations (INSERT … SELECT 1M rows) call the trigger 1M times. Consider disabling before bulk loads.',
        'Debugging is hard: trigger logic is invisible to application developers. Keep trigger bodies simple and well-documented.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL audit trigger',
      language: 'sql',
      code: `-- Audit table
CREATE TABLE orders_audit (
    audit_id    INT IDENTITY PRIMARY KEY,
    order_id    INT,
    action      VARCHAR(10),
    old_status  VARCHAR(20),
    new_status  VARCHAR(20),
    changed_by  NVARCHAR(128) DEFAULT SYSTEM_USER,
    changed_at  DATETIME DEFAULT GETDATE()
);

-- AFTER UPDATE trigger — works correctly for multi-row updates
CREATE OR ALTER TRIGGER trg_orders_audit
ON orders
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO orders_audit (order_id, action, old_status, new_status)
    SELECT
        i.order_id,
        'UPDATE',
        d.status,
        i.status
    FROM inserted i
    JOIN deleted  d ON d.order_id = i.order_id
    WHERE i.status <> d.status;   -- only when status actually changed
END;`
    },
    {
      label: 'MSSQL INSTEAD OF (view)',
      language: 'sql',
      code: `-- Make a join view updatable via INSTEAD OF trigger
CREATE VIEW v_order_details AS
SELECT o.order_id, o.status, c.name AS customer_name
FROM   orders o JOIN customers c ON c.customer_id = o.customer_id;

CREATE OR ALTER TRIGGER trg_v_order_details_update
ON v_order_details
INSTEAD OF UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    -- Route updates to the correct base table
    UPDATE orders
    SET    status = i.status
    FROM   orders o JOIN inserted i ON i.order_id = o.order_id;
END;

-- Now this works even though v_order_details joins two tables:
UPDATE v_order_details SET status = 'Shipped' WHERE order_id = 42;`
    },
    {
      label: 'PostgreSQL BEFORE ROW trigger',
      language: 'sql',
      code: `-- Trigger function (must return trigger)
CREATE OR REPLACE FUNCTION fn_orders_audit()
RETURNS trigger
LANGUAGE plpgsql
AS \$\$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO orders_audit (order_id, action, new_status, changed_at)
        VALUES (NEW.order_id, 'INSERT', NEW.status, now());

    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO orders_audit (order_id, action, old_status, new_status, changed_at)
        VALUES (OLD.order_id, 'UPDATE', OLD.status, NEW.status, now());

    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO orders_audit (order_id, action, old_status, changed_at)
        VALUES (OLD.order_id, 'DELETE', OLD.status, now());
    END IF;

    RETURN NEW;   -- return NULL in BEFORE to cancel the operation
END;
\$\$;

-- Attach trigger to table
CREATE TRIGGER trg_orders_audit
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION fn_orders_audit();`
    },
    {
      label: 'PostgreSQL BEFORE: modify NEW',
      language: 'sql',
      code: `-- Auto-set updated_at and normalise email before INSERT/UPDATE
CREATE OR REPLACE FUNCTION fn_normalise_customer()
RETURNS trigger
LANGUAGE plpgsql
AS \$\$
BEGIN
    -- Normalise email to lowercase
    NEW.email      := lower(trim(NEW.email));
    -- Auto-set timestamps
    NEW.updated_at := now();
    IF TG_OP = 'INSERT' THEN
        NEW.created_at := now();
    END IF;
    RETURN NEW;   -- must RETURN NEW (or modified NEW) to proceed with the write
END;
\$\$;

CREATE TRIGGER trg_normalise_customer
BEFORE INSERT OR UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION fn_normalise_customer();

-- Disable / enable trigger (PostgreSQL)
ALTER TABLE customers DISABLE TRIGGER trg_normalise_customer;
ALTER TABLE customers ENABLE  TRIGGER trg_normalise_customer;`
    },
  ];

  challenge: Challenge = {
    title: 'Low-stock notification trigger',
    language: 'sql',
    description: 'Create an AFTER UPDATE trigger on an order_items table that fires whenever qty changes. If the new qty would bring a product\'s total sold qty above its stock_qty (from a products table), insert a row into a low_stock_alerts table with (product_id, alert_type=\'LOW_STOCK\', triggered_at). Handle multi-row updates correctly — do not assume a single row.',
    hints: [
      'MSSQL: use inserted pseudo-table to get changed product_ids; join to products for stock_qty.',
      'PostgreSQL: use a STATEMENT-level AFTER trigger with a subquery to find all affected products.',
      'Use NOT EXISTS or LEFT JOIN to avoid duplicate alerts for the same product.',
    ],
    starterCode: `-- Tables: order_items(item_id, order_id, product_id, qty)
--         products(product_id, stock_qty)
--         low_stock_alerts(alert_id, product_id, alert_type, triggered_at)

-- MSSQL version:
CREATE OR ALTER TRIGGER trg_check_low_stock
ON order_items
AFTER UPDATE
AS
BEGIN
    -- insert into low_stock_alerts for products now over stock
END;`,
    solution: `-- MSSQL
CREATE OR ALTER TRIGGER trg_check_low_stock
ON order_items
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO low_stock_alerts (product_id, alert_type, triggered_at)
    SELECT DISTINCT i.product_id, 'LOW_STOCK', GETDATE()
    FROM inserted i
    JOIN products p ON p.product_id = i.product_id
    WHERE (
        SELECT SUM(qty) FROM order_items
        WHERE product_id = i.product_id
    ) > p.stock_qty
    AND NOT EXISTS (
        SELECT 1 FROM low_stock_alerts a
        WHERE a.product_id = i.product_id
          AND a.triggered_at >= DATEADD(HOUR, -1, GETDATE())
    );
END;

-- PostgreSQL
CREATE OR REPLACE FUNCTION fn_check_low_stock()
RETURNS trigger LANGUAGE plpgsql AS \$\$
BEGIN
    INSERT INTO low_stock_alerts (product_id, alert_type, triggered_at)
    SELECT i.product_id, 'LOW_STOCK', now()
    FROM (SELECT DISTINCT product_id FROM order_items WHERE order_id IN (
            SELECT DISTINCT order_id FROM order_items
         )) i
    JOIN products p USING (product_id)
    WHERE (SELECT SUM(qty) FROM order_items WHERE product_id = i.product_id) > p.stock_qty
    ON CONFLICT DO NOTHING;
    RETURN NULL;
END;
\$\$;
CREATE TRIGGER trg_check_low_stock
AFTER UPDATE ON order_items FOR EACH STATEMENT EXECUTE FUNCTION fn_check_low_stock();`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In MSSQL, what do the pseudo-tables inserted and deleted contain?',
      options: [
        'inserted = new values; deleted = rows to be removed by the trigger',
        'inserted = new/updated row images; deleted = old row images (for UPDATE, both exist)',
        'inserted = rows added this session; deleted = rows removed this session',
        'Both contain the same rows — the trigger action determines which to use'
      ],
      answer: 1,
      explanation: 'For INSERT: only inserted is populated. For DELETE: only deleted. For UPDATE: both — inserted has new values, deleted has old values. Always join on the PK to match old and new.'
    },
    {
      q: 'A PostgreSQL BEFORE ROW trigger returns NULL — what happens?',
      options: [
        'The trigger fires again with the original row',
        'The DML statement raises an error',
        'The current row operation is silently cancelled (skipped)',
        'NULL is inserted as the row value'
      ],
      answer: 2,
      explanation: 'Returning NULL from a BEFORE ROW trigger tells PostgreSQL to skip writing that row. The rest of the statement continues for other rows. This is how you conditionally suppress individual row operations.'
    },
    {
      q: 'Why must MSSQL triggers handle multi-row DML?',
      options: [
        'MSSQL only supports row-level triggers',
        'The inserted and deleted pseudo-tables contain all rows affected by the DML statement at once',
        'MSSQL triggers run once per connection, not per statement',
        'Multi-row DML is not allowed inside triggers'
      ],
      answer: 1,
      explanation: 'MSSQL triggers fire once per DML statement, not once per row. The inserted and deleted tables can contain many rows. A trigger that uses SELECT TOP 1 or scalar variables will silently process only one row when many are affected.'
    },
    {
      q: 'What is the key difference between AFTER and INSTEAD OF triggers in MSSQL?',
      options: [
        'AFTER fires before constraints are checked; INSTEAD OF fires after',
        'AFTER fires after the DML completes; INSTEAD OF replaces the DML entirely',
        'AFTER runs once per row; INSTEAD OF runs once per statement',
        'INSTEAD OF triggers can only be used on tables, not views'
      ],
      answer: 1,
      explanation: 'AFTER triggers fire after the DML succeeds (constraints already satisfied). INSTEAD OF triggers completely replace the triggering DML — the original statement is never executed. INSTEAD OF is the only type allowed on views.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can a trigger fire another trigger?',
      a: 'Yes — nested triggers are allowed. In MSSQL, nesting is controlled by the nested triggers server option (default ON, up to 32 levels). Recursive triggers (trigger A on table T fires DML on T again) require the RECURSIVE_TRIGGERS database option. In PostgreSQL triggers can chain freely; guard against infinite recursion with a session-level flag (SET LOCAL var).',
    },
    {
      q: 'How do I disable a trigger during a bulk load?',
      a: 'MSSQL: ALTER TABLE orders DISABLE TRIGGER trg_orders_audit; — then re-enable with ENABLE TRIGGER. PostgreSQL: ALTER TABLE orders DISABLE TRIGGER trg_orders_audit; — same syntax. Always re-enable and verify audit data integrity after the load.',
    },
    {
      q: 'Should I use triggers for application business logic?',
      a: 'Generally no. Triggers are invisible to application developers, make debugging hard, and can cause surprising side effects (hidden performance costs, recursive firing). Keep business logic in the application or in stored procedures that are explicitly called. Use triggers only for cross-cutting database-level concerns like audit logging, enforcing invariants that constraints cannot express, or maintaining denormalised columns.',
    },
  ];
}
