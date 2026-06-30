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
  selector: 'app-sql-dynamic-sql',
  standalone: true,
  imports: [
    CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, PageCompleteComponent
  ],
  templateUrl: './dynamic-sql.html',
  styleUrls: ['./dynamic-sql.scss']
})
export class SqlDynamicSql {

  quickRef: QuickRefItem[] = [
    { name: 'sp_executesql (MSSQL)',    type: 'function', desc: 'Execute parameterised dynamic SQL safely — preferred over EXEC' },
    { name: 'EXEC (MSSQL)',             type: 'keyword',  desc: 'Execute a string; no parameterisation — use sp_executesql instead' },
    { name: 'EXECUTE (PG)',             type: 'keyword',  desc: 'PL/pgSQL: run a dynamically built SQL string' },
    { name: 'FORMAT() (PG)',            type: 'function', desc: 'Build SQL strings with %I (identifier) and %L (literal) placeholders' },
    { name: 'QUOTENAME (MSSQL)',        type: 'function', desc: 'Wrap an identifier in square brackets to prevent injection' },
    { name: 'quote_ident (PG)',         type: 'function', desc: 'PostgreSQL equivalent of QUOTENAME for identifiers' },
    { name: 'quote_literal (PG)',       type: 'function', desc: 'Safely quote a value as a SQL literal' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'When to use dynamic SQL',
      points: [
        'Dynamic SQL builds query strings at runtime — useful when table names, column names, or WHERE clause structure vary at runtime.',
        'Common use cases: dynamic pivot column lists, flexible search with optional filters, schema migration scripts, multi-tenant per-schema routing.',
        'Always prefer static parameterised queries — dynamic SQL is harder to test, debug, and secure.',
      ]
    },
    {
      heading: 'sp_executesql vs EXEC in MSSQL',
      points: [
        'EXEC (sp_name / \'string\') concatenates strings with no parameterisation — SQL injection risk if any user input is included.',
        'sp_executesql accepts a parameterised statement and a parameter declaration, keeping user data out of the SQL string — always prefer it.',
        'sp_executesql also allows plan reuse: repeated calls with different parameter values reuse the same cached plan.',
      ]
    },
    {
      heading: 'PostgreSQL EXECUTE',
      points: [
        'Inside PL/pgSQL: EXECUTE sql_string [USING arg1, arg2, …] — USING passes values as bind parameters, never concatenated.',
        'FORMAT(\'SELECT … FROM %I WHERE id = %L\', table_name, id_value) — %I safely quotes an identifier; %L safely quotes a literal.',
        'Never use || to concatenate user input directly into a FORMAT string; use %L for values and %I for identifiers.',
      ]
    },
    {
      heading: 'SQL injection prevention',
      points: [
        'MSSQL: use sp_executesql with @params; use QUOTENAME() for identifiers from application input.',
        'PostgreSQL: use EXECUTE … USING for values; use FORMAT with %I/%L or quote_ident()/quote_literal() for identifiers/values.',
        'Never concatenate raw user-supplied strings directly into a SQL statement — even if "sanitised" by the application.',
      ]
    },
    {
      heading: 'Plan caching and performance',
      points: [
        'EXEC with a string literal can cache a plan, but each unique string is a separate cache entry.',
        'sp_executesql with parameters produces a single parameterised plan shared across all calls — better memory use.',
        'Dynamic SQL inside a stored procedure breaks the outer procedure\'s plan reuse; the inner statement gets its own plan.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL sp_executesql',
      language: 'sql',
      code: `-- BAD: concatenation — SQL injection risk
DECLARE @table NVARCHAR(128) = 'orders';
DECLARE @sql   NVARCHAR(MAX) = 'SELECT * FROM ' + @table; -- never user input
EXEC (@sql);

-- GOOD: sp_executesql with parameters
DECLARE @sql    NVARCHAR(MAX);
DECLARE @params NVARCHAR(MAX);
DECLARE @status NVARCHAR(50) = 'Shipped';
DECLARE @since  DATE          = '2024-01-01';

SET @sql = N'
    SELECT order_id, customer_id, amount
    FROM   orders
    WHERE  status     = @p_status
      AND  order_date >= @p_since';

SET @params = N'@p_status NVARCHAR(50), @p_since DATE';

EXEC sp_executesql @sql, @params,
    @p_status = @status,
    @p_since  = @since;`
    },
    {
      label: 'MSSQL dynamic PIVOT',
      language: 'sql',
      code: `-- Build a dynamic pivot where column list comes from data
DECLARE @cols NVARCHAR(MAX);
DECLARE @sql  NVARCHAR(MAX);

-- Collect distinct months from data, safely quoted with QUOTENAME
SELECT @cols = STRING_AGG(QUOTENAME(month), ', ')
               WITHIN GROUP (ORDER BY MIN(order_date))
FROM (SELECT DISTINCT
        FORMAT(order_date, 'yyyy-MM') AS month,
        MIN(order_date)               AS order_date
      FROM orders) d;

SET @sql = N'
    SELECT product_id, ' + @cols + N'
    FROM (
        SELECT product_id,
               FORMAT(order_date, ''yyyy-MM'') AS month,
               amount
        FROM orders
    ) AS src
    PIVOT (SUM(amount) FOR month IN (' + @cols + N')) AS pvt;';

-- Only safe because @cols is built from QUOTENAME — not raw user input
EXEC sp_executesql @sql;`
    },
    {
      label: 'PostgreSQL EXECUTE + FORMAT',
      language: 'sql',
      code: `-- Dynamic query with FORMAT and EXECUTE … USING
CREATE OR REPLACE FUNCTION search_table(
    p_table  TEXT,
    p_column TEXT,
    p_value  TEXT
)
RETURNS TABLE(id INT, result TEXT)
LANGUAGE plpgsql
AS \$\$
DECLARE
    sql TEXT;
BEGIN
    -- %I = identifier (quoted safely); %L = literal (quoted safely)
    sql := FORMAT(
        'SELECT id, %I::TEXT FROM %I WHERE %I = %L',
        p_column, p_table, p_column, p_value
    );
    RETURN QUERY EXECUTE sql;
END;
\$\$;

-- Equivalent using USING (bind parameters — preferred for values)
CREATE OR REPLACE FUNCTION get_orders_by_status(p_status TEXT)
RETURNS SETOF orders
LANGUAGE plpgsql
AS \$\$
BEGIN
    RETURN QUERY
    EXECUTE 'SELECT * FROM orders WHERE status = $1'
    USING p_status;   -- $1 is a bind parameter, never concatenated
END;
\$\$;`
    },
    {
      label: 'Optional filter pattern (MSSQL)',
      language: 'sql',
      code: `-- Build WHERE clause dynamically based on which filters are supplied
CREATE OR ALTER PROCEDURE dbo.usp_SearchOrders
    @customer_id INT  = NULL,
    @status      NVARCHAR(50) = NULL,
    @since       DATE = NULL
AS
BEGIN
    DECLARE @sql    NVARCHAR(MAX) = N'SELECT order_id, amount, status FROM orders WHERE 1=1';
    DECLARE @params NVARCHAR(MAX) = N'@p_cust INT, @p_status NVARCHAR(50), @p_since DATE';

    IF @customer_id IS NOT NULL  SET @sql += N' AND customer_id = @p_cust';
    IF @status      IS NOT NULL  SET @sql += N' AND status = @p_status';
    IF @since       IS NOT NULL  SET @sql += N' AND order_date >= @p_since';

    SET @sql += N' ORDER BY order_date DESC';

    EXEC sp_executesql @sql, @params,
        @p_cust   = @customer_id,
        @p_status = @status,
        @p_since  = @since;
END;`
    },
  ];

  challenge: Challenge = {
    title: 'Safe dynamic table statistics query',
    language: 'sql',
    description: 'Write a stored procedure / PL/pgSQL function that accepts a schema name and table name as parameters and returns the row count and approximate size of that table. Use QUOTENAME (MSSQL) or FORMAT with %I (PostgreSQL) to safely quote the identifiers. Validate that the table actually exists before building the query — raise an error if not.',
    hints: [
      'MSSQL: check sys.tables / INFORMATION_SCHEMA.TABLES before executing. Use sp_executesql with OUTPUT parameter for the row count.',
      'PostgreSQL: check pg_tables or information_schema.tables. Use EXECUTE … INTO to capture the result.',
      'Never concatenate p_schema or p_table directly into the SQL string — always pass through QUOTENAME / FORMAT %I.',
    ],
    starterCode: `-- MSSQL version
CREATE OR ALTER PROCEDURE dbo.usp_TableStats
    @schema NVARCHAR(128),
    @table  NVARCHAR(128)
AS
BEGIN
    -- 1. Validate table exists
    -- 2. Build safe SQL
    -- 3. Execute and return results
END;`,
    solution: `-- MSSQL
CREATE OR ALTER PROCEDURE dbo.usp_TableStats
    @schema NVARCHAR(128),
    @table  NVARCHAR(128)
AS
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = @table
    )
        THROW 50001, 'Table not found.', 1;

    DECLARE @sql NVARCHAR(MAX) =
        N'SELECT COUNT_BIG(*) AS row_count FROM '
        + QUOTENAME(@schema) + N'.' + QUOTENAME(@table);

    EXEC sp_executesql @sql;
END;

-- PostgreSQL
CREATE OR REPLACE FUNCTION table_stats(p_schema TEXT, p_table TEXT)
RETURNS TABLE(row_count BIGINT)
LANGUAGE plpgsql AS \$\$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = p_schema AND table_name = p_table
    ) THEN
        RAISE EXCEPTION 'Table %.% not found', p_schema, p_table;
    END IF;

    RETURN QUERY EXECUTE FORMAT(
        'SELECT COUNT(*)::BIGINT FROM %I.%I', p_schema, p_table
    );
END;
\$\$;`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why is sp_executesql preferred over EXEC(string) in MSSQL?',
      options: [
        'sp_executesql is faster because it bypasses the query parser',
        'sp_executesql supports parameterisation — values passed via @params never become part of the SQL string, preventing injection',
        'EXEC cannot run SELECT statements',
        'sp_executesql returns more columns'
      ],
      answer: 1,
      explanation: 'sp_executesql keeps parameter values separate from the SQL string so they are never interpreted as SQL. It also enables plan caching — the same parameterised statement is reused across calls with different values.'
    },
    {
      q: 'In PostgreSQL FORMAT(), what do %I and %L do?',
      options: [
        '%I inserts an integer; %L inserts a literal string',
        '%I safely double-quotes an identifier; %L safely single-quotes a literal value',
        '%I is case-insensitive match; %L is a regex literal',
        'Both are equivalent placeholders for any value'
      ],
      answer: 1,
      explanation: '%I wraps the value in double quotes (for table/column names), escaping any double quotes inside. %L wraps in single quotes (for values), escaping single quotes. Using them prevents SQL injection in dynamic identifiers and literals.'
    },
    {
      q: 'What does QUOTENAME() do in MSSQL?',
      options: [
        'Converts a string to uppercase',
        'Wraps an identifier in square brackets, escaping any ] inside',
        'Validates that an object exists in the database',
        'Quotes a string as a SQL literal (single-quoted)'
      ],
      answer: 1,
      explanation: 'QUOTENAME(\'my table\') returns [my table]. It wraps the name in square brackets and escapes any closing bracket inside the name, making the identifier safe for use in dynamic SQL.'
    },
    {
      q: 'Which pattern correctly prevents SQL injection for a dynamic table name in PostgreSQL?',
      options: [
        "EXECUTE 'SELECT * FROM ' || p_table;",
        "EXECUTE FORMAT('SELECT * FROM %I', p_table);",
        "EXECUTE 'SELECT * FROM $1' USING p_table;",
        "EXECUTE 'SELECT * FROM ' || quote_literal(p_table);"
      ],
      answer: 1,
      explanation: 'FORMAT with %I uses quote_ident() internally to safely quote the identifier. Option A is a raw concatenation (injection risk). Option C is wrong — $1 placeholders work for values, not identifiers. Option D uses quote_literal which adds single quotes (value quoting), not double quotes (identifier quoting).'
    },
    {
      q: 'How can you debug dynamic SQL before executing it in MSSQL?',
      options: [
        'There is no way to inspect dynamic SQL before it runs',
        'PRINT or SELECT the @sql string before executing it so you can review the generated SQL',
        'Use TRY … CATCH around sp_executesql to capture the query',
        'Enable Query Store to capture the dynamic text automatically'
      ],
      answer: 1,
      explanation: 'Before calling EXEC or sp_executesql, add PRINT @sql; (or SELECT @sql; for longer strings). This lets you copy the generated SQL into a query window, verify it is correct, and test it independently before running it live.'
    },
    {
      q: 'How do you return an OUTPUT parameter value from dynamic SQL in MSSQL?',
      options: [
        'Dynamic SQL cannot return output — use a temp table instead',
        'Declare the variable as OUTPUT in @params and pass it with OUTPUT in the sp_executesql call',
        'Use RETURN inside the dynamic SQL string',
        'Only SELECT can return values from dynamic SQL'
      ],
      answer: 1,
      explanation: 'sp_executesql supports OUTPUT parameters: declare @result INT; EXEC sp_executesql @sql, N\'@r INT OUTPUT\', @r = @result OUTPUT; The value is written back to @result after execution — no temp table needed.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I use dynamic SQL to build a parameterised query with a variable number of IN list items?',
      a: 'Yes — build the IN list string dynamically and pass it as part of the SQL text. For MSSQL, use STRING_AGG to build the list with QUOTENAME for identifier safety. For values, use a table-valued parameter or a temp table with a JOIN instead of IN — this is safer and performs better than a large IN string.',
    },
    {
      q: 'Does dynamic SQL inside a stored procedure affect plan caching?',
      a: 'The outer procedure has its own plan, but sp_executesql statements inside it get their own separate cached plans, keyed on the parameterised SQL string. If the dynamic string changes every call (e.g. different column names), each unique string gets its own plan — this can bloat the plan cache. Use OPTION(RECOMPILE) sparingly if this is a problem.',
    },
    {
      q: 'What is the risk of the "optional filter" dynamic WHERE pattern?',
      a: 'When all filters are NULL, the query degenerates to SELECT * FROM table — potentially scanning millions of rows with no WHERE clause. Always add a TOP / LIMIT safety guard, or require at least one filter to be non-NULL. Also, each combination of active filters may need a different index, so test the execution plans for common filter combinations.',
    },
    {
      q: 'How do I use dynamic SQL for multi-tenant schema switching?',
      a: 'In a schema-per-tenant model, build the table reference dynamically: EXECUTE FORMAT(\'SELECT * FROM %I.orders WHERE …\', p_schema). Use %I to safely quote the schema name and prevent injection. Validate the schema name against a whitelist (tenant table) before using it in the query — never trust a raw caller-supplied schema string.',
    },
    {
      q: 'What is plan cache bloat and how does dynamic SQL cause it?',
      a: 'The plan cache stores a compiled plan for each unique SQL string. If dynamic SQL generates slightly different text per call (e.g., literal values embedded instead of parameters), each call creates a new cache entry. Thousands of near-identical plans waste memory and slow down cache lookups. Fix: always use sp_executesql with @params so the parameterised SQL string is identical across calls.',
    },
    {
      q: 'Can I use EXECUTE in a transaction and roll it back on failure?',
      a: 'Yes — dynamic SQL executed via sp_executesql or EXEC runs in the same transaction as the caller. If the dynamic SQL raises an error (or you roll back the outer transaction), the changes made by the dynamic statement are also rolled back. Wrap the call in BEGIN TRAN / COMMIT / ROLLBACK as you would any other DML.',
    },
  ];
}
