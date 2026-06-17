import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-sql-stored-procedures',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './stored-procedures.html',
  styleUrl: './stored-procedures.scss',
})
export class SqlStoredProcedures {

  quickRef: QuickRefItem[] = [
    { name: 'CREATE OR ALTER PROCEDURE', type: 'keyword', desc: 'Creates or replaces a procedure atomically (SQL Server 2016+); preserves permissions unlike DROP+CREATE', since: 'SQL Server 2016' },
    { name: 'EXEC / EXECUTE',            type: 'keyword', desc: 'Calls a stored procedure; pass params by name (@p = value) to avoid order dependency', since: 'MSSQL' },
    { name: 'OUTPUT parameter',          type: 'syntax',  desc: 'Returns a typed value from the procedure to the caller; caller declares matching variable + OUTPUT keyword', since: 'MSSQL' },
    { name: 'RETURN',                    type: 'keyword', desc: 'Exits immediately with an optional integer status code; 0 = success by convention', since: 'SQL:1999' },
    { name: 'SET NOCOUNT ON',            type: 'keyword', desc: 'Suppresses "N rows affected" messages after each DML statement — prevents spurious client errors', since: 'MSSQL' },
    { name: 'SCOPE_IDENTITY()',          type: 'function', desc: 'Returns the last IDENTITY value inserted in the current scope — prefer over @@IDENTITY or IDENT_CURRENT', since: 'MSSQL' },
    { name: 'Scalar UDF',               type: 'keyword', desc: 'Returns one value; RBAR execution (row-by-row), prevents parallelism; avoid in WHERE/JOIN pre-2019', since: 'MSSQL 2000' },
    { name: 'Inline TVF',               type: 'keyword', desc: 'RETURN SELECT only; fully inlined by optimiser — behaves like a parameterised view with full parallelism', since: 'MSSQL 2000' },
    { name: 'sp_executesql',            type: 'method',  desc: 'Execute parameterised dynamic SQL safely; always bind user inputs as parameters, never concatenate', since: 'MSSQL' },
    { name: 'Parameter sniffing',       type: 'keyword', desc: 'Plan cached on first execution\'s params; can be suboptimal for atypical later calls', since: 'MSSQL' },
    { name: 'OPTION(RECOMPILE)',        type: 'keyword', desc: 'Recompile query plan per execution — fixes sniffing at the cost of compile CPU', since: 'MSSQL' },
    { name: 'EXECUTE AS',               type: 'keyword', desc: 'Run the procedure under a specific security context; CALLER (default), OWNER, or USER name', since: 'SQL Server 2005' },
    { name: 'PL/pgSQL',                 type: 'keyword', desc: 'PostgreSQL procedural language for functions and procedures — supports loops, IF/ELSIF, EXCEPTION blocks', since: 'PostgreSQL 6.4' },
    { name: 'RETURNS TABLE',            type: 'keyword', desc: 'PG: function returns a result set; use RETURN QUERY or RETURN QUERY EXECUTE for dynamic SQL', since: 'PostgreSQL 8.4' },
    { name: 'VOLATILE / STABLE / IMMUTABLE', type: 'keyword', desc: 'PG function volatility: VOLATILE (default, any side-effect), STABLE (constant per transaction), IMMUTABLE (constant always)', since: 'PostgreSQL' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Stored procedures — purpose, structure, and error handling',
      points: [
        'A stored procedure is a named, compiled block of SQL and procedural logic stored in the database server. Key advantages: the execution plan is compiled once and reused; business logic lives close to data; round-trips are minimised (one EXEC call replaces many individual SQL statements); and permissions can be granted on the procedure without granting direct table access.',
        'Use <code>CREATE OR ALTER PROCEDURE</code> (SQL Server 2016+) to create or update in one atomic statement. Earlier versions require <code>CREATE PROCEDURE</code> on first creation, then <code>ALTER PROCEDURE</code> for subsequent edits. DROP + CREATE is problematic because it briefly removes the object and discards any granted permissions.',
        'Parameters are typed: <code>@OrderID INT</code>. Input parameters are the default; output parameters require the <code>OUTPUT</code> keyword on both the declaration and the EXEC call. Default values work like function defaults: <code>@Status VARCHAR(20) = \'Active\'</code>. When calling, pass by name (<code>@p = value</code>) rather than position to avoid breaking when parameters are added.',
        'Always open with <code>SET NOCOUNT ON</code> to suppress the "N row(s) affected" messages after each DML statement. Without it, ADO.NET\'s <code>ExecuteReader</code>/<code>ExecuteNonQuery</code> can interpret those messages as extra result sets and raise errors in some drivers.',
        'Wrap multi-statement procedures in <code>BEGIN TRY … BEGIN CATCH</code>. In the CATCH block, check <code>XACT_STATE()</code>: if -1 the transaction is doomed — you MUST rollback, never commit. Re-raise the error with <code>THROW</code> (SQL Server 2012+) to preserve original error number, message, and severity. Avoid <code>RAISERROR</code> for re-raising — it resets severity.',
      ],
    },
    {
      heading: 'Scalar UDFs vs inline TVFs vs multi-statement TVFs',
      points: [
        '<strong>Scalar UDFs</strong> return a single value. Their flaw: in SQL Server before 2019, they execute <em>row by row</em> (RBAR — Row By Agonizing Row), prevent the query from running in parallel, and appear as a black box to the optimiser. A scalar UDF in a WHERE clause or JOIN condition silently forces a single-threaded, full-table evaluation regardless of indexes.',
        '<strong>Inline Table-Valued Functions (iTVF)</strong> contain a single <code>RETURN SELECT</code> statement — no table variable, no multiple assignments. The optimiser <em>inlines</em> them into the calling query at compile time, exactly like expanding a view. The calling query can push predicates into the iTVF, use indexes from the referenced tables, and execute in parallel. They are parameterised views and should be preferred over scalar UDFs for any multi-column or set-based result.',
        '<strong>Multi-statement TVFs (MSTVFs)</strong> populate a declared table variable through multiple INSERT/UPDATE steps. They are not inlined — the optimiser treats the result as a black box with a fixed cardinality estimate of 1 row (pre-2014) or a small fixed guess. Prefer iTVFs whenever the logic can be expressed as a single SELECT; use MSTVFs only when iterative logic is genuinely required.',
        'SQL Server 2019 introduced <strong>Scalar UDF Inlining</strong> — the engine automatically rewrites eligible simple scalar UDFs into inline expressions at parse time. Check <code>sys.sql_modules.is_inlineable = 1</code> to see if a UDF qualifies. Disqualifying factors include side effects (RAND(), NEWID()), recursion, multi-statement bodies, or WITH EXECUTE AS. Inlining is not guaranteed — verify with an actual execution plan.',
        'PostgreSQL has no scalar UDF / TVF distinction in the same sense. All functions can be <code>RETURNS SETOF type</code> or <code>RETURNS TABLE(col type, …)</code> for set-returning behaviour. SQL-language functions (single SELECT body) are inlined by the planner like MSSQL iTVFs. PL/pgSQL functions are opaque to the planner (like MSTVFs). For simple one-query functions, prefer SQL-language over PL/pgSQL for better planning.',
      ],
    },
    {
      heading: 'Parameter sniffing — diagnosis and fixes',
      points: [
        'SQL Server compiles a stored procedure\'s execution plan the <em>first time it runs</em>, using the parameter values passed in that call (parameter sniffing). The plan is cached in the plan cache and reused for all subsequent calls with different parameter values — even if those values warrant a completely different plan (different index, different join strategy, different memory grant).',
        'Classic symptom: a procedure runs in 10ms when called manually (EXEC usp_GetOrders @CustomerID = 1) but takes 30s from the application — because the application always calls it with a different, high-volume customer ID whose plan was already cached from the manual test. Or vice versa.',
        'Diagnosis: query <code>sys.dm_exec_cached_plans</code> joined with <code>sys.dm_exec_query_plan</code> and <code>sys.dm_exec_sql_text</code> to retrieve the cached plan XML. Look for "ParameterCompiledValue" (the sniffed value) vs the current runtime value. Also check <code>sys.dm_exec_procedure_stats</code> for plans with very high <code>max_worker_time</code> vs <code>min_worker_time</code> — a wide gap indicates sniffing.',
        'Fix options: (a) <code>OPTION(RECOMPILE)</code> on the specific query — generates a fresh plan per call, ignores the cache. Best when calls have highly variable data distributions. (b) <code>OPTION(OPTIMIZE FOR (@p UNKNOWN))</code> — plans against average statistics rather than the sniffed value. Good when distributions are relatively even. (c) <strong>Local variable trick</strong>: copy the parameter to a local variable — SQL Server cannot sniff local variable values, so it uses average statistics. Side effect: may not be optimal for any particular value.',
        'SQL Server 2022 introduced <strong>Adaptive Parameter Sensitivity (APS / Parameter Sensitive Plan Optimization)</strong>: the engine automatically creates a dispatcher plan that selects among multiple sub-plans based on runtime parameter values. This handles the classic "few rows vs many rows" sniffing case without manual workarounds. Check compatibility level >= 160 (SQL Server 2022).',
      ],
    },
    {
      heading: 'Dynamic SQL — sp_executesql and SQL injection prevention',
      points: [
        'Dynamic SQL builds a SQL statement as a string at runtime — necessary when the table name, column name, or sort direction must change dynamically (values that cannot be parameterised). The critical rule: <strong>never concatenate user input directly into a dynamic SQL string</strong>. Use <code>sp_executesql</code> with parameterised inputs for any user-supplied values.',
        '<code>EXEC sp_executesql @sql, @paramDefs, @param1 = @value1, …</code> — the parameter definitions string declares the types, and bindings pass values safely. SQL Server treats bound parameters as data, never code — this is the equivalent of prepared statements in application code. The resulting plan is also more cacheable than ad-hoc concatenated strings.',
        'For dynamic object names (table/column names) — which <em>cannot</em> be parameterised — use <code>QUOTENAME()</code> to safely bracket the name and escape any embedded brackets: <code>N\'SELECT * FROM \' + QUOTENAME(@TableName)</code>. Validate the name against system catalog tables (<code>sys.tables</code>, <code>sys.columns</code>) before use. Never use user-supplied object names without whitelisting against the catalog.',
        'Dynamic sort direction (<code>ORDER BY</code> column name or ASC/DESC) must also be handled carefully. Use <code>CASE WHEN @SortCol = \'Name\' THEN Name END</code> inside ORDER BY, or validate <code>@SortCol</code> against a whitelist before injecting into the string. Both approaches prevent injection while keeping the sort dynamic.',
        'Be aware of scope: inside <code>sp_executesql</code> the dynamic batch runs in its own scope. <code>SCOPE_IDENTITY()</code> after a dynamic INSERT inside sp_executesql is scoped to the dynamic batch — you must either capture the identity inside the dynamic string and return it via an OUTPUT parameter, or use <code>OUTPUT INTO</code> with a temp table.',
      ],
    },
    {
      heading: 'Procedure security — EXECUTE AS and permission chains',
      points: [
        '<code>EXECUTE AS</code> changes the security context in which the procedure runs. Options: <code>EXECUTE AS CALLER</code> (default — the caller\'s permissions are used, least privilege escalation); <code>EXECUTE AS OWNER</code> (runs as the procedure\'s owner — enables ownership chaining for table access without granting direct table permissions); <code>EXECUTE AS \'username\'</code> (impersonate a specific user).',
        '<strong>Ownership chaining</strong> is the standard pattern for access control through stored procedures. Grant EXECUTE on the procedure to the application role, but no direct SELECT/INSERT/UPDATE/DELETE on the underlying tables. When the procedure owner also owns the tables (same schema), SQL Server skips permission checks on the tables — the caller only needs EXECUTE. This enforces least-privilege: users cannot run ad-hoc queries against sensitive tables.',
        'Breaking ownership chain: if the procedure references an object in a different schema or database with a different owner, the chain breaks and the caller\'s permissions are checked against that object. This is a common source of permission errors when refactoring schemas — ensure all objects in a procedure\'s chain share the same owner (usually the schema owner).',
        'Use <code>WITH ENCRYPTION</code> on stored procedures to obfuscate the definition text in <code>sys.sql_modules</code>. This hides proprietary business logic from users with VIEW DEFINITION permission. Note: the encryption is symmetric and can be reversed with sufficient access — treat it as obfuscation, not true security.',
        'For procedures that perform DML: grant only <code>EXECUTE</code> on the procedure to application logins, never <code>INSERT</code>/<code>UPDATE</code>/<code>DELETE</code> on base tables directly. This prevents application code from bypassing business rules enforced inside the procedure (validation, audit logging, cascades) by running raw DML outside of it.',
      ],
    },
    {
      heading: 'PostgreSQL functions and procedures — PL/pgSQL and SQL-language',
      points: [
        'PostgreSQL distinguishes <strong>functions</strong> (return a value or result set, called in a SELECT) from <strong>procedures</strong> (no return value, called with CALL, can COMMIT/ROLLBACK mid-body — added in PG 11). For most tasks, functions are used; procedures are for long-running batch operations that need mid-transaction commits.',
        'SQL-language functions (body is a single SQL statement) are <em>inlined</em> by the planner — the optimiser can push predicates through them and use indexes from the referenced tables. PL/pgSQL functions ($$…$$ with DECLARE/BEGIN/EXCEPTION blocks) are opaque — the planner sees them as a black box. For simple queries, prefer SQL-language for better execution plans.',
        'PL/pgSQL function body syntax: <code>$$</code> or <code>$body$</code> dollar-quoting avoids the need to escape single quotes. Declare variables in the <code>DECLARE</code> block, write logic in <code>BEGIN … END</code>, and handle exceptions in <code>EXCEPTION WHEN … THEN</code>. Use <code>RAISE NOTICE</code> for debug output, <code>RAISE EXCEPTION</code> to abort.',
        'Function <strong>volatility</strong> affects planner caching and parallelism: <code>VOLATILE</code> (default) — may have side effects, called once per row, not cached; <code>STABLE</code> — reads the database but does not modify it, constant within a transaction (e.g., NOW()); <code>IMMUTABLE</code> — truly deterministic for given inputs, can be pre-evaluated, used in expression indexes. Declaring the wrong volatility causes correctness bugs — use STABLE/IMMUTABLE only when genuinely applicable.',
        '<code>RETURNS TABLE(col1 type1, col2 type2)</code> functions return a result set and can be used in a FROM clause like a table. <code>RETURN QUERY SELECT …</code> appends a query\'s result to the function\'s output. For dynamic SQL in PL/pgSQL, use <code>EXECUTE \'SELECT …\' USING $1, $2</code> (parameterised binding — prevents injection). <code>EXECUTE format(\'… %I …\', col_name)</code> safely quotes dynamic identifiers.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CREATE PROCEDURE',
      language: 'sql',
      code: `-- Full procedure with OUTPUT param, TRY/CATCH, and XACT_STATE check
CREATE OR ALTER PROCEDURE usp_PlaceOrder
    @CustomerID INT,
    @ProductID  INT,
    @Quantity   INT,
    @OrderID    BIGINT OUTPUT          -- returns new row ID to caller
AS
BEGIN
    SET NOCOUNT ON;                    -- suppress "N rows affected" messages

    BEGIN TRY
        BEGIN TRANSACTION;

        IF (SELECT Stock FROM Products WHERE ProductID = @ProductID) < @Quantity
            THROW 50001, 'Insufficient stock', 1;

        INSERT INTO Orders (CustomerID, OrderDate)
        VALUES (@CustomerID, SYSUTCDATETIME());

        SET @OrderID = SCOPE_IDENTITY(); -- scoped to current insert, safe

        UPDATE Products
        SET Stock = Stock - @Quantity
        WHERE ProductID = @ProductID;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0           -- -1 = doomed, +1 = open; both must ROLLBACK
            ROLLBACK TRANSACTION;
        THROW;                         -- re-raise with original error number/message
    END CATCH;
END;

-- Calling with OUTPUT parameter
DECLARE @NewOrderID BIGINT;
EXEC usp_PlaceOrder
    @CustomerID = 42,
    @ProductID  = 7,
    @Quantity   = 3,
    @OrderID    = @NewOrderID OUTPUT;

SELECT @NewOrderID AS NewOrderID;`,
    },
    {
      label: 'Inline TVF vs scalar UDF',
      language: 'sql',
      code: `-- ❌ Bad: scalar UDF — row-by-row, no parallelism, optimiser black box
CREATE FUNCTION dbo.GetCustomerCity (@CustomerID INT)
RETURNS NVARCHAR(100)
AS BEGIN
    RETURN (SELECT City FROM Customers WHERE CustomerID = @CustomerID);
END;

-- Using it silently executes per row — full scan even with an index on CustomerID:
SELECT OrderID, dbo.GetCustomerCity(CustomerID) AS City   -- called N times
FROM Orders
WHERE OrderYear = 2024;

-- ✅ Good: inline TVF — single RETURN SELECT; optimiser inlines it like a view
CREATE FUNCTION dbo.GetOrderSummary (@CustomerID INT)
RETURNS TABLE
AS
RETURN (
    SELECT
        o.OrderID,
        o.OrderDate,
        SUM(od.Quantity * od.UnitPrice) AS Total
    FROM Orders o
    JOIN OrderDetails od ON o.OrderID = od.OrderID
    WHERE o.CustomerID = @CustomerID
    GROUP BY o.OrderID, o.OrderDate
);

-- The optimiser sees through GetOrderSummary, pushes the WHERE into it,
-- and uses the index on Orders.CustomerID:
SELECT * FROM dbo.GetOrderSummary(42) WHERE Total > 500;

-- ✅ Check if a scalar UDF is auto-inlineable (SQL Server 2019+):
SELECT name, is_inlineable
FROM sys.sql_modules m
JOIN sys.objects o ON m.object_id = o.object_id
WHERE o.type = 'FN';   -- 1 = inlineable, 0 = opaque`,
    },
    {
      label: 'Parameter sniffing fixes',
      language: 'sql',
      code: `-- Vulnerable procedure: plan is cached for the first @CustomerID value
CREATE OR ALTER PROCEDURE usp_GetOrders @CustomerID INT
AS
SELECT OrderID, OrderDate, Total
FROM Orders
WHERE CustomerID = @CustomerID;
-- If first call is @CustomerID = 1 (few orders) → nested-loop plan cached
-- Next call with @CustomerID = 999 (millions of orders) → nested-loop plan reused → slow

-- Fix 1: OPTION(RECOMPILE) — fresh plan every call, ignores cache
CREATE OR ALTER PROCEDURE usp_GetOrders_Recompile @CustomerID INT
AS
SELECT OrderID, OrderDate, Total
FROM Orders
WHERE CustomerID = @CustomerID
OPTION(RECOMPILE);   -- CPU cost per call; worth it for highly variable distributions

-- Fix 2: OPTIMIZE FOR UNKNOWN — plan against average statistics
CREATE OR ALTER PROCEDURE usp_GetOrders_OptUnknown @CustomerID INT
AS
SELECT OrderID, OrderDate, Total
FROM Orders
WHERE CustomerID = @CustomerID
OPTION(OPTIMIZE FOR (@CustomerID UNKNOWN));

-- Fix 3: Local variable trick — hides the parameter from sniffing
-- Uses average stats; reasonable when no extreme outliers exist
CREATE OR ALTER PROCEDURE usp_GetOrders_Local @CustomerID INT
AS
BEGIN
    DECLARE @LocalCustID INT = @CustomerID;    -- compiler cannot sniff local vars
    SELECT OrderID, OrderDate, Total
    FROM Orders
    WHERE CustomerID = @LocalCustID;
END;

-- Diagnose cached plan and sniffed value:
SELECT
    qp.query_plan,
    qs.execution_count,
    qs.total_worker_time / qs.execution_count AS avg_cpu_ms,
    qs.max_worker_time                        AS max_cpu_ms
FROM sys.dm_exec_procedure_stats ps
JOIN sys.dm_exec_query_plan(ps.plan_handle) qp ON 1=1
JOIN sys.dm_exec_sql_text(ps.sql_handle)    qs ON 1=1
WHERE OBJECT_NAME(ps.object_id) = 'usp_GetOrders';`,
    },
    {
      label: 'Dynamic SQL',
      language: 'sql',
      code: `-- ❌ NEVER: SQL injection via concatenation
CREATE PROCEDURE usp_Unsafe @TableName NVARCHAR(100)
AS
EXEC ('SELECT * FROM ' + @TableName);   -- user passes "Users; DROP TABLE Users--"

-- ✅ Safe dynamic SQL: sp_executesql with parameters for VALUES
DECLARE @sql       NVARCHAR(500);
DECLARE @paramDefs NVARCHAR(200);
DECLARE @custID    INT = 42;

SET @sql = N'SELECT OrderID, OrderDate FROM Orders WHERE CustomerID = @cid';
SET @paramDefs = N'@cid INT';

EXEC sp_executesql @sql, @paramDefs, @cid = @custID;  -- @custID is data, not code

-- ✅ Dynamic object names: validate against catalog + QUOTENAME()
CREATE PROCEDURE usp_QueryTable
    @SchemaName NVARCHAR(128),
    @TableName  NVARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;
    -- Whitelist: ensure table exists in the database
    IF NOT EXISTS (
        SELECT 1 FROM sys.tables t
        JOIN sys.schemas s ON t.schema_id = s.schema_id
        WHERE s.name = @SchemaName AND t.name = @TableName
    )
        THROW 50404, 'Table not found', 1;

    DECLARE @sql NVARCHAR(500);
    SET @sql = N'SELECT TOP 100 * FROM '
             + QUOTENAME(@SchemaName) + N'.'   -- brackets + escapes embedded brackets
             + QUOTENAME(@TableName);

    EXEC sp_executesql @sql;
END;

-- ✅ Dynamic ORDER BY: CASE expression avoids injection
CREATE PROCEDURE usp_GetProducts
    @SortCol  NVARCHAR(50),
    @SortDir  NVARCHAR(4)    -- 'ASC' or 'DESC'
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ProductID, ProductName, UnitPrice
    FROM Products
    ORDER BY
        CASE WHEN @SortCol = 'Name'  AND @SortDir = 'ASC'  THEN ProductName  END ASC,
        CASE WHEN @SortCol = 'Name'  AND @SortDir = 'DESC' THEN ProductName  END DESC,
        CASE WHEN @SortCol = 'Price' AND @SortDir = 'ASC'  THEN UnitPrice    END ASC,
        CASE WHEN @SortCol = 'Price' AND @SortDir = 'DESC' THEN UnitPrice    END DESC;
END;`,
    },
    {
      label: 'EXECUTE AS / security',
      language: 'sql',
      code: `-- ── Ownership chaining: grant EXEC, not table permissions ─────────────
-- Application role has only EXECUTE on the procedure:
GRANT EXECUTE ON usp_PlaceOrder TO AppRole;
-- No direct INSERT/UPDATE on Orders or Products — usp_PlaceOrder owner = dbo
-- SQL Server chains: caller has EXEC → dbo.usp_PlaceOrder runs → dbo.Orders accessed
-- Table checks are skipped because procedure owner = table owner (dbo)

-- ── EXECUTE AS OWNER: procedure runs as its owner context ─────────────
CREATE OR ALTER PROCEDURE usp_AuditReport
WITH EXECUTE AS OWNER           -- procedure owner sees the AuditLog table;
AS                              -- caller does not need SELECT on AuditLog directly
BEGIN
    SELECT * FROM dbo.AuditLog ORDER BY LogDate DESC;
END;

-- ── EXECUTE AS specific user ────────────────────────────────────────────
CREATE OR ALTER PROCEDURE usp_ReportProc
WITH EXECUTE AS 'ReportUser'    -- impersonate a fixed DB user with limited perms
AS
BEGIN
    SELECT * FROM dbo.SalesReport;
END;

-- ── WITH ENCRYPTION: obfuscate procedure body ──────────────────────────
-- Definition hidden from sys.sql_modules / VIEW DEFINITION permission
CREATE OR ALTER PROCEDURE usp_ProprietaryLogic
WITH ENCRYPTION
AS
BEGIN
    -- Business logic not visible to users with VIEW DEFINITION
    SELECT * FROM dbo.SecretTable;
END;

-- ── Checking XACT_STATE in CATCH ──────────────────────────────────────
BEGIN CATCH
    DECLARE @state INT = XACT_STATE();
    IF @state = -1                       -- transaction is doomed (uncommittable)
        ROLLBACK TRANSACTION;            -- MUST rollback; COMMIT would error
    ELSE IF @state = 1                   -- transaction is active and committable
        ROLLBACK TRANSACTION;            -- rollback on error (or commit if intentional)
    THROW;                               -- re-raise original error
END CATCH;`,
    },
    {
      label: 'PostgreSQL functions',
      language: 'sql',
      code: `-- ── SQL-language function (inlined by planner) ────────────────────────
CREATE FUNCTION get_customer_orders(p_customer_id INT)
RETURNS TABLE(order_id INT, order_date DATE, total NUMERIC)
LANGUAGE sql
STABLE                          -- reads DB, doesn't modify; plan can cache per transaction
AS $$
    SELECT o.order_id, o.order_date::DATE, SUM(oi.qty * oi.price)
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.customer_id = p_customer_id
    GROUP BY o.order_id, o.order_date;
$$;

-- Use like a table in a query:
SELECT * FROM get_customer_orders(42) WHERE total > 500;

-- ── PL/pgSQL function with exception handling ──────────────────────────
CREATE OR REPLACE FUNCTION place_order(
    p_customer_id INT,
    p_product_id  INT,
    p_quantity    INT
) RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_stock   INT;
    v_order_id BIGINT;
BEGIN
    SELECT stock INTO v_stock FROM products WHERE product_id = p_product_id FOR UPDATE;

    IF v_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock: % available, % requested', v_stock, p_quantity;
    END IF;

    INSERT INTO orders (customer_id, order_date)
    VALUES (p_customer_id, CURRENT_DATE)
    RETURNING order_id INTO v_order_id;

    UPDATE products SET stock = stock - p_quantity WHERE product_id = p_product_id;

    RETURN v_order_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;   -- re-raise; caller's transaction will be rolled back
END;
$$;

-- Call it:
SELECT place_order(42, 7, 3);

-- ── Dynamic SQL in PL/pgSQL (safe, parameterised) ─────────────────────
CREATE FUNCTION count_rows(p_table_name TEXT) RETURNS BIGINT
LANGUAGE plpgsql AS $$
DECLARE v_count BIGINT;
BEGIN
    EXECUTE format('SELECT COUNT(*) FROM %I', p_table_name)  -- %I quotes identifier
    INTO v_count;
    RETURN v_count;
END;
$$;

-- PG procedure (PG 11+): can COMMIT mid-body
CREATE PROCEDURE migrate_batch(p_batch_size INT)
LANGUAGE plpgsql AS $$
DECLARE v_id INT;
BEGIN
    FOR v_id IN SELECT id FROM staging ORDER BY id LIMIT p_batch_size LOOP
        INSERT INTO production SELECT * FROM staging WHERE id = v_id;
        DELETE FROM staging WHERE id = v_id;
        COMMIT;      -- commit after each row — not possible in a function
    END LOOP;
END;
$$;

CALL migrate_batch(1000);`,
    },
  ];

  challenge: Challenge = {
    title: 'Paginated Product Search Procedure',
    language: 'sql',
    description: `Write a stored procedure <code>usp_SearchProducts</code> that:
<ul>
<li>Accepts <code>@SearchTerm NVARCHAR(100)</code>, <code>@CategoryID INT</code> (optional, default NULL), <code>@PageNumber INT</code> (default 1), <code>@PageSize INT</code> (default 20)</li>
<li>Returns products matching the search term in ProductName, optionally filtered by CategoryID</li>
<li>Uses OFFSET-FETCH pagination</li>
<li>Returns total matching row count via <code>@TotalRows INT OUTPUT</code></li>
<li>Includes TRY/CATCH error handling</li>
</ul>`,
    hints: [
      'SET NOCOUNT ON at the start of every procedure',
      'Optional filter: WHERE CategoryID = @CategoryID OR @CategoryID IS NULL',
      'Pagination: OFFSET (@PageNumber - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY',
      'Get total count with a separate SELECT COUNT(*) using the same WHERE — do it before the paged SELECT',
      'Add TRY/CATCH around the body; re-raise with THROW',
    ],
    starterCode: `CREATE OR ALTER PROCEDURE usp_SearchProducts
    @SearchTerm NVARCHAR(100),
    @CategoryID INT        = NULL,
    @PageNumber INT        = 1,
    @PageSize   INT        = 20,
    @TotalRows  INT        OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    -- your code here
END;`,
    solution: `CREATE OR ALTER PROCEDURE usp_SearchProducts
    @SearchTerm NVARCHAR(100),
    @CategoryID INT        = NULL,
    @PageNumber INT        = 1,
    @PageSize   INT        = 20,
    @TotalRows  INT        OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- Total matching rows (same WHERE, no pagination)
        SELECT @TotalRows = COUNT(*)
        FROM Products
        WHERE ProductName LIKE N'%' + @SearchTerm + N'%'
          AND (@CategoryID IS NULL OR CategoryID = @CategoryID)
          AND Discontinued = 0;

        -- Paged result set
        SELECT ProductID, ProductName, CategoryID, UnitPrice
        FROM Products
        WHERE ProductName LIKE N'%' + @SearchTerm + N'%'
          AND (@CategoryID IS NULL OR CategoryID = @CategoryID)
          AND Discontinued = 0
        ORDER BY ProductName
        OFFSET (@PageNumber - 1) * @PageSize ROWS
        FETCH NEXT @PageSize ROWS ONLY;
    END TRY
    BEGIN CATCH
        THROW;   -- re-raise; no transaction to rollback here (read-only)
    END CATCH;
END;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does SET NOCOUNT ON do in a stored procedure?',
      options: [
        'Prevents the procedure from returning result sets',
        'Suppresses "N rows affected" messages after each DML statement, preventing spurious client errors',
        'Prevents row-level locking during the procedure',
        'Disables error handling with TRY/CATCH',
      ],
      answer: 1,
      explanation: 'SET NOCOUNT ON stops the engine from sending "X row(s) affected" messages to the client after each DML statement. Some client libraries interpret these messages as extra result sets, causing "reader already open" or "no results expected" errors. Always use it in stored procedures.',
    },
    {
      q: 'Why do scalar UDFs harm performance in SQL Server (before 2019)?',
      options: [
        'They are not compiled and have no execution plan',
        'They execute row-by-row (RBAR), prevent query parallelism, and are opaque to the optimiser',
        'They do not support transactions',
        'They cannot access base tables',
      ],
      answer: 1,
      explanation: 'Scalar UDFs execute once per qualifying row — RBAR (Row By Agonizing Row). They also force the query to run single-threaded (no parallelism) and appear as a black box to the optimiser, preventing index use or predicate pushdown. SQL Server 2019+ can auto-inline simple scalar UDFs, but this is not guaranteed.',
    },
    {
      q: 'An inline TVF differs from a multi-statement TVF because:',
      options: [
        'An inline TVF can only return one column',
        'An inline TVF is inlined into the calling query — it behaves like a parameterised view with full optimiser support and parallelism',
        'A multi-statement TVF has better performance for aggregations',
        'An inline TVF cannot use parameters',
      ],
      answer: 1,
      explanation: 'An inline TVF contains a single RETURN SELECT — the optimiser expands it at compile time like a view, enabling index use, predicate pushdown, and parallelism. A multi-statement TVF uses a declared table variable with multiple statements; it is opaque to the optimiser (fixed cardinality estimate) and much slower for set-based queries.',
    },
    {
      q: 'Parameter sniffing occurs when:',
      options: [
        'The procedure has more than 10 parameters',
        'SQL Server caches a plan compiled for the first execution\'s parameter values and reuses it for later calls that would benefit from a different plan',
        'The procedure accesses tables in multiple schemas',
        'Parameters are passed by position rather than by name',
      ],
      answer: 1,
      explanation: 'SQL Server compiles a stored procedure\'s plan on first execution using the actual parameter values passed (sniffing them). The plan is cached and reused for subsequent calls with different values. If the first call\'s data distribution is atypical, the cached plan is suboptimal for all later calls.',
    },
    {
      q: 'What is the safest way to use dynamic SQL with user input in SQL Server?',
      options: [
        'Concatenate the input directly into the SQL string — SQL Server sanitises it automatically',
        'Use EXEC() with the concatenated string wrapped in QUOTENAME()',
        'Use sp_executesql with the user input bound as a typed parameter — never concatenated into the string',
        'Use CONVERT() to cast the input to NVARCHAR before concatenation',
      ],
      answer: 2,
      explanation: 'sp_executesql with parameterised inputs treats user-supplied values as data, never as code — preventing SQL injection. QUOTENAME() is only for object names (table/column), not for value parameters. EXEC() with a concatenated string is vulnerable to injection regardless of CONVERT or QUOTENAME.',
    },
    {
      q: 'What happens in XACT_STATE() = -1 inside a CATCH block?',
      options: [
        'The transaction is committed automatically',
        'The transaction is open and committable — you may choose to commit or rollback',
        'The transaction is doomed (uncommittable) — you MUST ROLLBACK; a COMMIT will fail',
        'No transaction is active — do nothing',
      ],
      answer: 2,
      explanation: 'XACT_STATE() = -1 means the transaction is in an uncommittable state (a severe error occurred). Attempting COMMIT raises error 3930. You must ROLLBACK the transaction before the CATCH block exits — then optionally re-raise with THROW or return an error code.',
    },
    {
      q: 'In PostgreSQL, what is the difference between a function declared STABLE and one declared VOLATILE?',
      options: [
        'STABLE functions can modify data; VOLATILE functions cannot',
        'STABLE functions return the same result for the same inputs within a transaction (no side effects); VOLATILE functions may return different results or have side effects per call',
        'STABLE functions are compiled once per session; VOLATILE functions recompile per call',
        'VOLATILE functions can be used in expression indexes; STABLE functions cannot',
      ],
      answer: 1,
      explanation: 'STABLE means the function reads the database but does not modify it, and returns the same result for the same inputs within a single transaction. This lets the planner cache calls within a query. VOLATILE (default) means the function may have side effects or return different values per call — it cannot be optimised away or cached. IMMUTABLE (even stricter) enables use in expression indexes.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use stored procedures or an ORM for data access?',
      a: 'Both are valid; the choice depends on team skills and query complexity. ORMs (Entity Framework, Dapper) generate safe parameterised queries and reduce boilerplate for standard CRUD — good for most application queries. Stored procedures excel at: complex multi-step operations that would require multiple round-trips otherwise; batch processing; enforcing business rules that bypass the application layer is a security concern; and minimising network traffic for high-frequency operations. Many production systems use ORMs for most queries and stored procedures for complex logic.',
    },
    {
      q: 'What is SCOPE_IDENTITY() and when should I use it?',
      a: '<code>SCOPE_IDENTITY()</code> returns the last IDENTITY value inserted in the <em>current scope</em> (current statement/procedure). Use it immediately after an INSERT into a table with an IDENTITY column to get the new row\'s ID. Prefer it over: <code>@@IDENTITY</code> (returns the last identity in the session, including identity values generated by triggers — can be wrong if a trigger inserts into another table); and <code>IDENT_CURRENT(\'TableName\')</code> (returns the last identity for a specific table across all sessions — unsafe under concurrent inserts). Alternatively, use the <code>OUTPUT INTO</code> clause to capture the new ID.',
    },
    {
      q: 'What is the difference between RETURN and OUTPUT parameters?',
      a: '<code>RETURN</code> immediately exits the procedure and passes a single <em>integer</em> status code to the caller. By convention, 0 = success, negative values = failure. The caller retrieves it via the return value of EXEC. <strong>OUTPUT parameters</strong> are typed variables that pass data back — they can be any data type (INT, VARCHAR, DATETIME, etc.) and multiple can be declared. Use RETURN for yes/no success signalling; use OUTPUT for passing computed values (like a new ID or a count) back to the caller.',
    },
    {
      q: 'Can I use dynamic SQL inside a stored procedure safely?',
      a: 'Yes — with parameterised dynamic SQL via <code>sp_executesql</code>. Bind all user-supplied values as parameters: <code>EXEC sp_executesql N\'SELECT * FROM t WHERE col = @val\', N\'@val INT\', @val = @UserInput</code>. For dynamic object names (table/column), which cannot be parameterised, use <code>QUOTENAME()</code> and validate the name against <code>sys.tables</code>/<code>sys.columns</code> before use. Never concatenate user input directly into a SQL string — even wrapped in CONVERT or ISNUMERIC checks, injection is possible.',
    },
    {
      q: 'How does ownership chaining work for stored procedure security?',
      a: 'When a stored procedure and the tables it references are owned by the same database principal (e.g., both owned by <code>dbo</code>), SQL Server skips permission checks on the tables for users who have EXECUTE on the procedure. This is the standard least-privilege pattern: grant the application role only EXECUTE on the procedure, no direct INSERT/UPDATE/DELETE on the tables. Users cannot bypass business rules enforced inside the procedure by running raw DML. If the procedure references objects with a different owner (broken chain), the caller\'s permissions are checked against those objects — a common source of permission errors.',
    },
    {
      q: 'When should I use OPTION(RECOMPILE) vs OPTION(OPTIMIZE FOR UNKNOWN) for parameter sniffing?',
      a: '<code>OPTION(RECOMPILE)</code>: generates a fresh execution plan on every call — optimal for the current parameter values but incurs compile CPU cost each time. Choose it when: data distributions are highly skewed (one customer has 1M orders, others have 10); calls are infrequent; or the compile cost is small relative to execution cost. <code>OPTION(OPTIMIZE FOR UNKNOWN)</code>: plans against average statistics rather than the sniffed value — the plan is cached and reused. Choose it when: distributions are relatively even; calls are very frequent (minimise compile overhead); or you want a "good enough for most cases" stable plan without per-call recompile cost.',
    },
    {
      q: 'What is the difference between a PostgreSQL function and a procedure?',
      a: 'PostgreSQL <strong>functions</strong> return a value (or a set of rows via RETURNS TABLE), are called in a SELECT or FROM clause, and run inside the caller\'s transaction — they cannot COMMIT or ROLLBACK mid-body. <strong>Procedures</strong> (added in PG 11) have no return value, are called with CALL, and can issue COMMIT/ROLLBACK mid-body — enabling long-running batch operations that need to commit partial work. For most data retrieval and transformation logic, use functions. Use procedures only when mid-transaction commits are genuinely needed (e.g., batch row migration, progress checkpointing).',
    },
  ];
}
