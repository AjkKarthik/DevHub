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
  selector: 'app-sql-views',
  standalone: true,
  imports: [
    CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, PageCompleteComponent
  ],
  templateUrl: './views.html',
  styleUrls: ['./views.scss']
})
export class SqlViews {

  quickRef: QuickRefItem[] = [
    { name: 'CREATE VIEW',          type: 'keyword', desc: 'Define a named query as a reusable virtual table' },
    { name: 'CREATE OR REPLACE VIEW', type: 'keyword', desc: 'Create or redefine without dropping first' },
    { name: 'WITH CHECK OPTION',    type: 'keyword', desc: 'Prevent DML that would hide the row from the view' },
    { name: 'MATERIALIZED VIEW',    type: 'keyword', desc: 'Persisted, refreshable view snapshot (PostgreSQL / MSSQL indexed view)' },
    { name: 'REFRESH MATERIALIZED VIEW', type: 'keyword', desc: 'PostgreSQL: repopulate a materialized view' },
    { name: 'WITH SCHEMABINDING',   type: 'keyword', desc: 'MSSQL: prevent underlying table changes that break the view' },
    { name: 'INSTEAD OF trigger',   type: 'keyword', desc: 'Makes views updatable even when they join multiple tables' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is a view?',
      points: [
        'A view is a stored SELECT statement that behaves like a table. No data is duplicated — the query runs each time the view is queried.',
        'Views simplify complex queries, enforce access control (grant SELECT on view, not tables), and can hide sensitive columns.',
        'Any SELECT valid in the database can be a view: joins, aggregations, CTEs, window functions.',
      ]
    },
    {
      heading: 'Updatable views',
      points: [
        'A simple view over a single table with no DISTINCT, GROUP BY, aggregates, or UNION can usually receive INSERT/UPDATE/DELETE.',
        'WITH CHECK OPTION rejects DML that would cause the modified row to disappear from the view (e.g. inserting a row that the view\'s WHERE clause would filter out).',
        'For complex views (joins, unions), use an INSTEAD OF trigger to define custom DML logic.',
      ]
    },
    {
      heading: 'Materialized views (PostgreSQL)',
      points: [
        'MATERIALIZED VIEW stores the query result on disk. Reads are fast but data is stale until explicitly refreshed.',
        'REFRESH MATERIALIZED VIEW <name>; — blocks reads. REFRESH MATERIALIZED VIEW CONCURRENTLY <name>; — allows reads but needs a unique index.',
        'Useful for expensive aggregations or reports where slight staleness is acceptable.',
      ]
    },
    {
      heading: 'MSSQL indexed views',
      points: [
        'MSSQL calls materialized views "indexed views". Create a clustered index on a view to persist data.',
        'Requires WITH SCHEMABINDING and deterministic functions. The optimizer can automatically use an indexed view even if you query the base table.',
        'Enterprise-only feature for automatic optimizer matching; all editions can query via the NOEXPAND hint.',
      ]
    },
    {
      heading: 'View security patterns',
      points: [
        'Grant SELECT on a view but not the base tables — users see only the projected columns and filtered rows.',
        'Column masking: omit sensitive columns (SSN, card numbers) from the view definition.',
        'Row-level security lite: add WHERE user_id = CURRENT_USER or tenant_id = SESSION_CONTEXT() to the view.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Create & use views',
      language: 'sql',
      code: `-- Simple view: hide sensitive columns
CREATE OR REPLACE VIEW v_customers_public AS
SELECT customer_id, first_name, last_name, city, country
FROM   customers;   -- email, phone, credit_limit omitted

-- Aggregation view
CREATE OR REPLACE VIEW v_monthly_sales AS
SELECT
    DATE_TRUNC('month', order_date) AS month,   -- PostgreSQL
    -- DATEFROMPARTS(YEAR(order_date), MONTH(order_date), 1) AS month  -- MSSQL
    SUM(amount)  AS total_revenue,
    COUNT(*)     AS order_count
FROM orders
WHERE status = 'Shipped'
GROUP BY DATE_TRUNC('month', order_date);

-- Query the view just like a table
SELECT month, total_revenue
FROM   v_monthly_sales
WHERE  month >= '2024-01-01'
ORDER  BY month;`
    },
    {
      label: 'Updatable + CHECK OPTION',
      language: 'sql',
      code: `-- Updatable view: single table, no aggregate
CREATE OR REPLACE VIEW v_active_products AS
SELECT product_id, name, price, category_id
FROM   products
WHERE  status = 'Active'
WITH CHECK OPTION;  -- prevents INSERT/UPDATE that sets status <> 'Active'

-- This succeeds (row stays visible in view)
UPDATE v_active_products SET price = 29.99 WHERE product_id = 5;

-- This fails: WITH CHECK OPTION catches the hidden row
-- UPDATE v_active_products SET status = 'Discontinued' WHERE product_id = 5;

-- INSERT through view (status defaults to 'Active')
INSERT INTO v_active_products (product_id, name, price, category_id)
VALUES (99, 'New Widget', 14.99, 3);`
    },
    {
      label: 'Materialized View (PostgreSQL)',
      language: 'sql',
      code: `-- Create materialized view
CREATE MATERIALIZED VIEW mv_sales_summary AS
SELECT
    p.category_id,
    c.name   AS category,
    SUM(oi.qty * oi.unit_price) AS revenue,
    COUNT(DISTINCT o.order_id)  AS orders
FROM order_items oi
JOIN orders   o ON o.order_id   = oi.order_id
JOIN products p ON p.product_id = oi.product_id
JOIN categories c ON c.id = p.category_id
WHERE o.status = 'Shipped'
GROUP BY p.category_id, c.name;

-- Index for concurrent refresh
CREATE UNIQUE INDEX ON mv_sales_summary (category_id);

-- Refresh without blocking reads
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_summary;

-- Drop it
DROP MATERIALIZED VIEW mv_sales_summary;`
    },
    {
      label: 'MSSQL Indexed View',
      language: 'sql',
      code: `-- MSSQL: indexed (materialized) view
-- Requires SCHEMABINDING and deterministic functions
CREATE VIEW dbo.v_product_sales
WITH SCHEMABINDING
AS
SELECT
    p.category_id,
    COUNT_BIG(*) AS order_count,
    SUM(oi.qty)  AS total_qty
FROM dbo.order_items oi
JOIN dbo.products    p  ON p.product_id = oi.product_id
GROUP BY p.category_id;
GO

-- Materialise it with a clustered index
CREATE UNIQUE CLUSTERED INDEX ix_v_product_sales
ON dbo.v_product_sales (category_id);
GO

-- Optimizer can use the indexed view automatically (Enterprise).
-- Force it on any edition with NOEXPAND:
SELECT category_id, total_qty
FROM   dbo.v_product_sales WITH (NOEXPAND)
WHERE  category_id = 3;`
    },
  ];

  challenge: Challenge = {
    title: 'Secure customer view with row filter',
    language: 'sql',
    description: 'Create a view v_tenant_orders that shows only orders for the current tenant. The orders table has a tenant_id column. Use a WHERE clause that compares tenant_id to a session variable: in MSSQL use SESSION_CONTEXT(N\'tenant_id\'), in PostgreSQL use current_setting(\'app.tenant_id\')::INT. Add WITH CHECK OPTION so inserts through the view are also scoped.',
    hints: [
      'Cast the session variable to the correct type to match tenant_id (INT).',
      'WITH CHECK OPTION prevents inserting rows for a different tenant through this view.',
      'MSSQL SESSION_CONTEXT must be set earlier in the session with sp_set_session_context.',
    ],
    starterCode: `-- orders(order_id INT, customer_id INT, tenant_id INT, amount DECIMAL, status VARCHAR)
CREATE OR REPLACE VIEW v_tenant_orders AS
SELECT order_id, customer_id, tenant_id, amount, status
FROM   orders
WHERE  -- your row filter here
-- add check option`,
    solution: `-- PostgreSQL version
CREATE OR REPLACE VIEW v_tenant_orders AS
SELECT order_id, customer_id, tenant_id, amount, status
FROM   orders
WHERE  tenant_id = current_setting('app.tenant_id')::INT
WITH CHECK OPTION;

-- MSSQL version
CREATE OR ALTER VIEW dbo.v_tenant_orders
WITH SCHEMABINDING
AS
SELECT order_id, customer_id, tenant_id, amount, status
FROM   dbo.orders
WHERE  tenant_id = CAST(SESSION_CONTEXT(N'tenant_id') AS INT);`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does WITH CHECK OPTION do on a view?',
      options: [
        'Prevents DROP VIEW without a special privilege',
        'Rejects DML that would make the affected row invisible to the view',
        'Forces all queries through the view to use an index',
        'Validates the view definition against current schema'
      ],
      answer: 1,
      explanation: 'WITH CHECK OPTION ensures INSERT and UPDATE through the view only affect rows that the view\'s WHERE clause would still return — preventing "disappearing" rows.'
    },
    {
      q: 'Which command refreshes a materialized view in PostgreSQL without blocking reads?',
      options: [
        'REFRESH MATERIALIZED VIEW name',
        'UPDATE MATERIALIZED VIEW name',
        'REFRESH MATERIALIZED VIEW CONCURRENTLY name',
        'REBUILD MATERIALIZED VIEW name'
      ],
      answer: 2,
      explanation: 'REFRESH MATERIALIZED VIEW CONCURRENTLY lets readers continue while the view is rebuilt. It requires a unique index on the materialized view.'
    },
    {
      q: 'A view over a JOIN of two tables — when is it directly updatable?',
      options: [
        'Never — views over joins are never updatable',
        'Only when the view has WITH CHECK OPTION',
        'When the database can determine a unique key-preserved table in the join',
        'Always, as long as both tables have primary keys'
      ],
      answer: 2,
      explanation: 'A join view is updatable if the database can identify a "key-preserved" table — one whose primary key uniquely identifies every row in the result. In practice, this is engine-specific and complex; INSTEAD OF triggers are the reliable solution for join views.'
    },
    {
      q: 'What does WITH SCHEMABINDING do in MSSQL?',
      options: [
        'Prevents the view from being dropped',
        'Locks the view to a specific schema owner',
        'Prevents ALTER TABLE on underlying tables that would break the view',
        'Enables automatic index creation on the view'
      ],
      answer: 2,
      explanation: 'WITH SCHEMABINDING binds the view to the schema of referenced objects. You cannot drop or alter those tables in a way that affects the view without first removing the binding.'
    },
    {
      q: 'What makes a view non-updatable and how do you work around it?',
      options: [
        'Any view that has more than one table is non-updatable',
        'Views with GROUP BY, DISTINCT, aggregates, UNION, subqueries in SELECT, or no key-preserved table cannot be updated directly — use INSTEAD OF triggers to handle DML on them',
        'Non-updatable views have WITH READ ONLY specified',
        'All views are non-updatable unless created with WITH CHECK OPTION'
      ],
      answer: 1,
      explanation: 'SQL cannot determine how to translate an INSERT/UPDATE on an aggregated or UNION view back to the base tables. INSTEAD OF triggers intercept the DML and let you write T-SQL that performs the actual base-table updates, giving full control over the translation.'
    },
    {
      q: 'What does an INSTEAD OF trigger on a view enable that would otherwise be impossible?',
      options: [
        'Faster SELECT queries on the view',
        'DML operations (INSERT/UPDATE/DELETE) on views that are not directly updatable, such as views over JOINs or aggregates',
        'Automatic schema binding for the view',
        'Concurrent refresh of materialized views'
      ],
      answer: 1,
      explanation: 'An INSTEAD OF trigger intercepts DML on the view and lets you manually propagate the change to the underlying tables. This is the standard pattern for making complex views writable — for example, a view joining customers and addresses can have an INSTEAD OF INSERT that populates both tables correctly.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use a materialized view instead of a regular view?',
      a: 'Use a materialized view when the underlying query is expensive (complex joins, large aggregations) and the data does not need to be real-time. Typical use cases: reporting dashboards, pre-aggregated analytics, search indexes. Regular views are better when data must always be current.',
    },
    {
      q: 'Can I index a regular (non-materialized) view?',
      a: 'In MSSQL, creating a unique clustered index on a view with SCHEMABINDING automatically materializes it — this is how indexed views work. In PostgreSQL, you cannot directly index a regular view; create a materialized view instead.',
    },
    {
      q: 'How do I grant access to a view but not the underlying tables?',
      a: 'GRANT SELECT ON v_customers_public TO reporting_role; — then ensure reporting_role has no direct SELECT on the customers table. This is a standard pattern for data security layers: users query the view, the view definition owner has table access, and permission chains through ownership.',
    },
    {
      q: 'How can I use a view for data masking and column-level security?',
      a: 'Create a view that returns NULL or a masked value for sensitive columns for unprivileged users: SELECT id, LEFT(ssn, 0) + \'***-**-\' + RIGHT(ssn, 4) AS ssn FROM customers. Grant SELECT on the view, not the table. In MSSQL, Dynamic Data Masking (ALTER TABLE … ADD MASKED WITH (FUNCTION = \'partial()\')) is an alternative that applies at query time without a view.',
    },
    {
      q: 'What is the difference between indexed views in MSSQL and materialized views in PostgreSQL?',
      a: 'Both pre-compute and store the query result. MSSQL indexed views are automatically maintained on every INSERT/UPDATE/DELETE to the base tables — the database keeps them current. PostgreSQL materialized views require explicit REFRESH MATERIALIZED VIEW [CONCURRENTLY] — they can become stale. Use MSSQL indexed views for real-time accuracy; PostgreSQL materialized views for large aggregations that are acceptable with periodic refresh.',
    },
    {
      q: 'Can a view reference another view and does it hurt performance?',
      a: 'Yes, views can nest. The optimizer typically expands nested views into a single query plan — nesting does not inherently cause multiple scans. However, deeply nested views can make query plans complex and hard to read, and if an inner view is a multi-statement TVF (MSSQL), the optimizer treats it as a black box. For performance-critical paths, flatten nested views into a single SQL statement and verify the execution plan.',
    },
  ];
}
