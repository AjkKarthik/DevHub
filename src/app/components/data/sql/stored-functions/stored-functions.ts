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
  selector: 'app-sql-stored-functions',
  standalone: true,
  imports: [
    CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, PageCompleteComponent
  ],
  templateUrl: './stored-functions.html',
  styleUrls: ['./stored-functions.scss']
})
export class SqlStoredFunctions {

  quickRef: QuickRefItem[] = [
    { name: 'CREATE FUNCTION (MSSQL)',      type: 'keyword', desc: 'Scalar, inline table-valued, or multi-statement TVF' },
    { name: 'CREATE OR REPLACE FUNCTION (PG)', type: 'keyword', desc: 'Create or redefine a PostgreSQL function' },
    { name: 'RETURNS TABLE (PG)',           type: 'keyword', desc: 'Function that returns a set of rows' },
    { name: 'RETURNS SETOF (PG)',           type: 'keyword', desc: 'Function that returns multiple rows of a type' },
    { name: 'LANGUAGE plpgsql',            type: 'keyword', desc: 'PostgreSQL procedural language for functions' },
    { name: 'LANGUAGE sql',               type: 'keyword', desc: 'Pure SQL function (no procedural constructs)' },
    { name: 'STRICT / CALLED ON NULL INPUT', type: 'keyword', desc: 'NULL propagation behaviour' },
    { name: 'SECURITY DEFINER',            type: 'keyword', desc: 'Function runs with the owner\'s privileges' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Functions vs stored procedures',
      points: [
        'Functions must return a value (scalar or table) and can be used inline in SELECT, WHERE, and JOIN clauses.',
        'Stored procedures can have multiple result sets, use output parameters, and manage transactions — but cannot be used in expressions.',
        'PostgreSQL uses functions for both roles; MSSQL has distinct CREATE FUNCTION and CREATE PROCEDURE.',
      ]
    },
    {
      heading: 'MSSQL function types',
      points: [
        'Scalar function: returns a single value. Can be used anywhere an expression is valid but is called once per row — can be slow on large sets.',
        'Inline table-valued function (iTVF): returns TABLE, body is a single SELECT. Treated by the optimizer as a parameterised view — always prefer over multi-statement TVF.',
        'Multi-statement TVF (mTVF): returns a declared @table; populated with explicit INSERT. Optimizer treats it as a black box with estimated 1 row — usually slower.',
      ]
    },
    {
      heading: 'PostgreSQL function types',
      points: [
        'LANGUAGE sql: pure SQL body, simplest form, fully inlined by the planner.',
        'LANGUAGE plpgsql: PL/pgSQL procedural language with DECLARE, BEGIN/END, IF, LOOP, RAISE.',
        'RETURNS TABLE(col type, …): set-returning function callable in FROM like a table.',
        'RETURNS SETOF type: returns multiple rows of a composite or base type.',
      ]
    },
    {
      heading: 'NULL handling',
      points: [
        'STRICT (PostgreSQL): if any argument is NULL, the function returns NULL immediately without executing the body.',
        'CALLED ON NULL INPUT (default): the function is called even when arguments are NULL — your body must handle them.',
        'MSSQL scalar functions receive NULLs and must use ISNULL/COALESCE internally.',
      ]
    },
    {
      heading: 'Security and ownership',
      points: [
        'SECURITY INVOKER (default): function runs with the caller\'s permissions.',
        'SECURITY DEFINER: function runs with the owner\'s permissions — useful for controlled elevated access (e.g. a function that reads a table the caller cannot directly access).',
        'Always grant EXECUTE on the function, not SELECT on underlying tables, when using SECURITY DEFINER.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL scalar & iTVF',
      language: 'sql',
      code: `-- Scalar function: business-day count between two dates
CREATE OR ALTER FUNCTION dbo.fn_business_days(
    @start DATE,
    @end   DATE
)
RETURNS INT
AS
BEGIN
    RETURN (
        DATEDIFF(DAY, @start, @end)
        - (DATEDIFF(WEEK, @start, @end) * 2)
        - CASE WHEN DATEPART(WEEKDAY, @start) = 1 THEN 1 ELSE 0 END
        - CASE WHEN DATEPART(WEEKDAY, @end)   = 7 THEN 1 ELSE 0 END
    );
END;

SELECT dbo.fn_business_days('2024-01-01', '2024-01-31');  -- 23

-- Inline TVF: parameterised view (preferred over scalar for sets)
CREATE OR ALTER FUNCTION dbo.fn_customer_orders(
    @customer_id INT,
    @since       DATE
)
RETURNS TABLE
AS RETURN (
    SELECT o.order_id, o.order_date, o.amount
    FROM   orders o
    WHERE  o.customer_id = @customer_id
      AND  o.order_date  >= @since
);

-- Use in FROM like a table
SELECT * FROM dbo.fn_customer_orders(42, '2024-01-01');`
    },
    {
      label: 'PostgreSQL SQL function',
      language: 'sql',
      code: `-- Simple SQL scalar function
CREATE OR REPLACE FUNCTION full_name(first TEXT, last TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE STRICT
AS \$\$
    SELECT first || ' ' || last;
\$\$;

SELECT full_name('Alice', 'Smith');  -- 'Alice Smith'
SELECT full_name(NULL, 'Smith');     -- NULL (STRICT)

-- Set-returning SQL function
CREATE OR REPLACE FUNCTION customer_orders(p_customer_id INT, p_since DATE)
RETURNS TABLE(order_id INT, order_date DATE, amount NUMERIC)
LANGUAGE sql
STABLE
AS \$\$
    SELECT o.order_id, o.order_date::DATE, o.amount
    FROM   orders o
    WHERE  o.customer_id = p_customer_id
      AND  o.order_date  >= p_since;
\$\$;

SELECT * FROM customer_orders(42, '2024-01-01');`
    },
    {
      label: 'PostgreSQL PL/pgSQL',
      language: 'sql',
      code: `-- PL/pgSQL function with conditional logic
CREATE OR REPLACE FUNCTION classify_order(p_amount NUMERIC)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS \$\$
DECLARE
    v_class TEXT;
BEGIN
    v_class := CASE
        WHEN p_amount >= 10000 THEN 'Enterprise'
        WHEN p_amount >= 1000  THEN 'Business'
        WHEN p_amount >= 100   THEN 'Standard'
        ELSE 'Micro'
    END;
    RETURN v_class;
END;
\$\$;

SELECT order_id, amount, classify_order(amount)
FROM   orders
LIMIT  10;

-- Function with exception handling
CREATE OR REPLACE FUNCTION safe_divide(a NUMERIC, b NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
AS \$\$
BEGIN
    IF b = 0 THEN
        RETURN NULL;
    END IF;
    RETURN a / b;
EXCEPTION WHEN division_by_zero THEN
    RETURN NULL;
END;
\$\$;`
    },
    {
      label: 'SECURITY DEFINER pattern',
      language: 'sql',
      code: `-- PostgreSQL: restricted table access via SECURITY DEFINER
-- The reporting_role can run this function but cannot SELECT audit_log directly.

CREATE OR REPLACE FUNCTION get_user_audit(p_user_id INT)
RETURNS TABLE(action TEXT, logged_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public   -- pin search_path to prevent hijacking
AS \$\$
    SELECT action, logged_at
    FROM   audit_log
    WHERE  user_id = p_user_id;
\$\$;

-- Grant execute only — no direct table access needed
GRANT EXECUTE ON FUNCTION get_user_audit(INT) TO reporting_role;

-- MSSQL equivalent: EXECUTE AS OWNER in a stored procedure
CREATE OR ALTER PROCEDURE dbo.usp_GetUserAudit @UserId INT
WITH EXECUTE AS OWNER
AS
    SELECT action, logged_at FROM dbo.audit_log WHERE user_id = @UserId;
GO
GRANT EXECUTE ON dbo.usp_GetUserAudit TO reporting_role;`
    },
  ];

  challenge: Challenge = {
    title: 'Tiered discount function',
    language: 'sql',
    description: 'Write a scalar function get_discount_pct(customer_id INT) that returns a DECIMAL discount percentage based on the customer\'s lifetime order count: 0–4 orders → 0%, 5–9 orders → 5%, 10–24 orders → 10%, 25+ orders → 15%. Use a subquery to count orders from the orders table.',
    hints: [
      'In PostgreSQL use LANGUAGE plpgsql with DECLARE and a CASE expression.',
      'In MSSQL use a scalar function; SELECT COUNT(*) FROM orders WHERE customer_id = @customer_id.',
      'Return type: DECIMAL(5,2) or NUMERIC(5,2).',
    ],
    starterCode: `-- PostgreSQL version
CREATE OR REPLACE FUNCTION get_discount_pct(p_customer_id INT)
RETURNS NUMERIC(5,2)
LANGUAGE plpgsql
AS \$\$
DECLARE
    v_orders INT;
BEGIN
    -- count orders
    -- return discount based on tier
END;
\$\$;`,
    solution: `-- PostgreSQL
CREATE OR REPLACE FUNCTION get_discount_pct(p_customer_id INT)
RETURNS NUMERIC(5,2)
LANGUAGE plpgsql
STABLE
AS \$\$
DECLARE
    v_orders INT;
BEGIN
    SELECT COUNT(*) INTO v_orders
    FROM   orders
    WHERE  customer_id = p_customer_id;

    RETURN CASE
        WHEN v_orders >= 25 THEN 15.00
        WHEN v_orders >= 10 THEN 10.00
        WHEN v_orders >=  5 THEN  5.00
        ELSE 0.00
    END;
END;
\$\$;

-- Usage
SELECT customer_id, get_discount_pct(customer_id) AS discount
FROM   customers
ORDER  BY customer_id;`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why should you prefer an inline TVF over a multi-statement TVF in MSSQL?',
      options: [
        'Inline TVFs support more SQL features',
        'The optimizer can look inside an inline TVF and build efficient plans; multi-statement TVFs are black boxes estimated at 1 row',
        'Multi-statement TVFs cannot return more than 1 000 rows',
        'Inline TVFs support transactions; multi-statement TVFs do not'
      ],
      answer: 1,
      explanation: 'The MSSQL optimizer treats a multi-statement TVF as a black box, always estimating 1 output row. This leads to bad join and filter plans on large result sets. An inline TVF is a parameterised view — the optimizer can push predicates inside it.'
    },
    {
      q: 'What does STRICT mean on a PostgreSQL function?',
      options: [
        'The function enforces NOT NULL on all parameters via a constraint',
        'The function returns NULL immediately if any argument is NULL, without executing the body',
        'The function cannot modify any tables',
        'The function is compiled to native code for performance'
      ],
      answer: 1,
      explanation: 'STRICT (alias RETURNS NULL ON NULL INPUT) makes the function short-circuit and return NULL without executing the body when any argument is NULL. This avoids NULL handling boilerplate inside the body.'
    },
    {
      q: 'What is SECURITY DEFINER used for?',
      options: [
        'Preventing users from dropping the function',
        'Running the function with the function owner\'s privileges instead of the caller\'s',
        'Encrypting the function body',
        'Requiring password authentication to call the function'
      ],
      answer: 1,
      explanation: 'SECURITY DEFINER runs the function body with the privileges of the owner (definer), not the caller. This allows controlled access to objects the caller does not have direct permission on.'
    },
    {
      q: 'Can a PostgreSQL LANGUAGE sql function be used as a computed column default?',
      options: [
        'Yes, if it is declared IMMUTABLE',
        'No — only built-in functions can be column defaults',
        'Yes, but only for GENERATED ALWAYS AS columns',
        'No — column defaults require LANGUAGE plpgsql'
      ],
      answer: 0,
      explanation: 'An IMMUTABLE SQL or PL/pgSQL function can be used in a column DEFAULT expression. IMMUTABLE tells the planner the function always returns the same output for the same input — required for use in indexes and some generated contexts.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between IMMUTABLE, STABLE, and VOLATILE in PostgreSQL?',
      a: 'IMMUTABLE: same inputs always give the same output and the function does not access the database (e.g. string concatenation). STABLE: result is constant within a single query (can read the database but won\'t change between rows in one SELECT). VOLATILE: can change on every call (e.g. now(), random()). The planner caches IMMUTABLE results and may inline them; VOLATILE forces a call per row.',
    },
    {
      q: 'When should I use a function vs a view?',
      a: 'Use a view when the query is fixed and parameterisation is not needed — views are simpler to manage and the optimizer can always look inside. Use a function when you need parameters (e.g. filter by customer_id) or procedural logic. In PostgreSQL an inline RETURNS TABLE function with LANGUAGE sql is essentially a parameterised view and performs similarly.',
    },
    {
      q: 'Can MSSQL scalar functions cause performance problems?',
      a: 'Yes — a scalar UDF in MSSQL is called once per row (or even per predicate evaluation) and is not parallelised by the optimizer before SQL Server 2019. On large tables this adds millions of function calls. SQL Server 2019 introduced scalar UDF inlining to mitigate this, but it only applies to eligible simple functions. Prefer inline TVFs or computed columns for set-based scenarios.',
    },
  ];
}
