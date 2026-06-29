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
  selector: 'app-sql-null-handling',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './null-handling.html',
  styleUrl: './null-handling.scss',
})
export class SqlNullHandling {

  quickRef: QuickRefItem[] = [
    { name: 'IS NULL',       type: 'syntax',  desc: 'Tests whether a value is NULL. Never use = NULL — always IS NULL.' },
    { name: 'IS NOT NULL',   type: 'syntax',  desc: 'Tests whether a value is present (not missing). Works in WHERE, HAVING, JOIN ON.' },
    { name: 'COALESCE(a,b,…)', type: 'function', desc: 'Returns the first non-NULL argument. ANSI SQL, works in both dialects.' },
    { name: 'ISNULL(a, b)',  type: 'function', desc: 'MSSQL: returns b when a IS NULL. Two arguments only.' },
    { name: 'IFNULL(a, b)',  type: 'function', desc: 'MySQL/SQLite equivalent of ISNULL. Not in MSSQL or PostgreSQL.' },
    { name: 'NULLIF(a, b)',  type: 'function', desc: 'Returns NULL when a = b, otherwise returns a. Useful to prevent division by zero.' },
    { name: 'NVL(a, b)',     type: 'function', desc: 'Oracle only. Prefer COALESCE for portability.' },
    { name: 'NOT IN + NULL', type: 'syntax',  desc: 'NOT IN returns empty when the subquery contains ANY NULL — use NOT EXISTS instead.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Three-valued logic: TRUE, FALSE, UNKNOWN',
      points: [
        'In SQL, NULL represents a missing or unknown value. Any comparison involving NULL produces UNKNOWN, not TRUE or FALSE.',
        'This gives SQL three-valued logic: TRUE, FALSE, UNKNOWN. WHERE clauses only pass rows where the condition evaluates to TRUE — UNKNOWN rows are silently excluded.',
        '`NULL = NULL` evaluates to UNKNOWN, not TRUE. To check for NULL, you must use `IS NULL` or `IS NOT NULL`.',
        'Arithmetic and string operations with NULL also produce NULL: `1 + NULL = NULL`, `\'hello\' || NULL = NULL`.',
      ],
    },
    {
      heading: 'COALESCE and NULLIF',
      points: [
        'COALESCE(expr1, expr2, …) returns the first non-NULL argument. It is ANSI SQL and works identically in MSSQL and PostgreSQL.',
        'NULLIF(a, b) returns NULL when a equals b, and returns a otherwise. The canonical use is preventing division by zero: `a / NULLIF(denominator, 0)` — dividing by NULL returns NULL rather than an error.',
        'ISNULL(a, b) is MSSQL-only and accepts exactly two arguments. Prefer COALESCE for portability.',
      ],
    },
    {
      heading: 'NULL in aggregate functions',
      points: [
        'All aggregate functions (COUNT, SUM, AVG, MIN, MAX) ignore NULLs in their column argument. `SUM(column)` sums only the non-NULL rows.',
        'Exception: `COUNT(*)` counts all rows regardless of NULLs. `COUNT(column)` counts only non-NULL values in that column.',
        'AVG ignores NULLs, which means it computes average over fewer rows than the total — this can be surprising and is different from treating NULL as zero.',
      ],
    },
    {
      heading: 'NULL in JOINs and set operations',
      points: [
        'In a JOIN ON clause, `a.col = b.col` does NOT match when both sides are NULL. Two NULL values are UNKNOWN to each other in a JOIN.',
        'To join on nullable columns, use `a.col = b.col OR (a.col IS NULL AND b.col IS NULL)` or use a surrogate key.',
        'In UNION / INTERSECT / EXCEPT, NULLs are treated as equal to each other — `UNION` deduplicates rows where both sides are NULL in the same column.',
      ],
    },
    {
      heading: 'The NOT IN NULL trap',
      points: [
        '`col NOT IN (SELECT other_col FROM t)` returns zero rows if any row in the subquery returns NULL. This is because `col != NULL` evaluates to UNKNOWN, and NOT (UNKNOWN) = UNKNOWN.',
        'Always use `NOT EXISTS` instead of `NOT IN` when the subquery might contain NULLs: `WHERE NOT EXISTS (SELECT 1 FROM t WHERE t.col = outer.col)`.',
        'To be safe, add `WHERE other_col IS NOT NULL` to the subquery if you must use NOT IN.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'IS NULL basics',
      language: 'sql',
      code: `-- Correct: IS NULL
SELECT * FROM orders WHERE shipped_date IS NULL;

-- Wrong: = NULL always returns zero rows
SELECT * FROM orders WHERE shipped_date = NULL;  -- returns nothing

-- IS NOT NULL
SELECT * FROM customers WHERE email IS NOT NULL;

-- NULL in expressions
SELECT
    price,
    discount,
    price - discount            AS discounted,  -- NULL when discount is NULL
    price - COALESCE(discount, 0) AS safe_price  -- treats NULL as 0
FROM products;`,
    },
    {
      label: 'COALESCE & NULLIF',
      language: 'sql',
      code: `-- COALESCE: first non-NULL wins
SELECT
    COALESCE(nickname, first_name, 'Anonymous') AS display_name
FROM users;

-- NULLIF: return NULL when values match (prevent division by zero)
SELECT
    total_revenue / NULLIF(total_orders, 0) AS avg_order_value
FROM sales_summary;

-- Combining COALESCE + NULLIF
SELECT
    COALESCE(NULLIF(TRIM(phone), ''), 'N/A') AS phone_display
FROM contacts;`,
    },
    {
      label: 'ISNULL (MSSQL)',
      language: 'sql',
      code: `-- MSSQL: ISNULL — exactly two arguments
SELECT ISNULL(middle_name, '')          AS middle_name FROM employees;
SELECT ISNULL(score, 0)                 AS score      FROM results;

-- PostgreSQL: no ISNULL — use COALESCE
SELECT COALESCE(middle_name, '')        AS middle_name FROM employees;

-- MSSQL: IS DISTINCT FROM alternative (SQL Server 2022+)
-- Treats NULL = NULL as TRUE (like EXCEPT)
SELECT * FROM a
WHERE a.col IS NOT DISTINCT FROM b.col;  -- matches when both are NULL`,
    },
    {
      label: 'NULL in aggregates',
      language: 'sql',
      code: `-- COUNT(*) vs COUNT(column)
SELECT
    COUNT(*)            AS total_rows,       -- all rows including NULLs
    COUNT(rating)       AS rows_with_rating, -- only non-NULL ratings
    AVG(rating)         AS avg_rating,       -- averages only non-NULL values
    AVG(COALESCE(rating, 0)) AS avg_incl_zero -- treat NULL as 0 in average
FROM reviews;

-- SUM ignores NULLs
SELECT SUM(amount) FROM payments;  -- NULLs not counted
-- vs.
SELECT SUM(COALESCE(amount, 0)) FROM payments;  -- NULLs treated as 0`,
    },
    {
      label: 'NOT IN NULL trap',
      language: 'sql',
      code: `-- DANGER: returns ZERO rows if any manager_id is NULL
SELECT * FROM employees
WHERE department_id NOT IN (SELECT manager_id FROM departments);

-- SAFE: NOT EXISTS handles NULLs correctly
SELECT * FROM employees e
WHERE NOT EXISTS (
    SELECT 1 FROM departments d
    WHERE d.manager_id = e.department_id
);

-- Alternative: filter NULLs in subquery
SELECT * FROM employees
WHERE department_id NOT IN (
    SELECT manager_id FROM departments
    WHERE manager_id IS NOT NULL  -- explicit NULL guard
);`,
    },
  ];

  challenge: Challenge = {
    title: 'Fix the NULL trap',
    language: 'sql',
    description: `Given:
- employees(id, name, department_id)
- departments(id, name, budget)

1. Find all employees whose department has NO budget (budget IS NULL).
2. Find all employees whose department_id does NOT appear in the departments table. Avoid the NOT IN NULL trap.
3. Show each employee with their salary bonus: 10% of salary. If salary is NULL, show 0 as bonus.`,
    hints: [
      'For (1): JOIN to departments and check budget IS NULL',
      'For (2): use NOT EXISTS instead of NOT IN',
      'For (3): COALESCE(salary, 0) * 0.1',
    ],
    starterCode: `-- 1. Employees in departments with NULL budget
-- 2. Employees with no matching department (NULL-safe)
-- 3. Employees with bonus column`,
    solution: `-- 1. Employees whose department has NULL budget
SELECT e.id, e.name
FROM employees e
JOIN departments d ON d.id = e.department_id
WHERE d.budget IS NULL;

-- 2. Employees with no matching department (NOT EXISTS is NULL-safe)
SELECT e.id, e.name
FROM employees e
WHERE NOT EXISTS (
    SELECT 1 FROM departments d WHERE d.id = e.department_id
);

-- 3. Bonus — treat NULL salary as 0
SELECT
    id,
    name,
    salary,
    COALESCE(salary, 0) * 0.10 AS bonus
FROM employees;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does NULL = NULL evaluate to in SQL?',
      options: ['TRUE', 'FALSE', 'UNKNOWN', 'NULL'],
      answer: 2,
      explanation: 'NULL represents an unknown value. Comparing unknown to unknown yields UNKNOWN, not TRUE. Use IS NULL to test for NULL.',
    },
    {
      q: 'Which function returns the first non-NULL argument and works in both MSSQL and PostgreSQL?',
      options: ['ISNULL()', 'NVL()', 'COALESCE()', 'IFNULL()'],
      answer: 2,
      explanation: 'COALESCE is ANSI SQL and works in all major databases. ISNULL is MSSQL-only (two args), NVL is Oracle, IFNULL is MySQL.',
    },
    {
      q: 'Why does NOT IN return zero rows when the subquery contains NULL?',
      options: [
        'NULL values are not allowed in IN lists',
        'Any comparison with NULL yields UNKNOWN; NOT (UNKNOWN) = UNKNOWN which fails the WHERE filter',
        'NOT IN automatically excludes NULL values',
        'The optimizer rewrites NOT IN to EXCEPT which excludes NULLs',
      ],
      answer: 1,
      explanation: 'col NOT IN (..., NULL, ...) expands to col != NULL which is UNKNOWN. NOT (UNKNOWN) = UNKNOWN. WHERE passes only TRUE, so zero rows pass.',
    },
    {
      q: 'What does COUNT(*) return vs COUNT(column) when some rows have NULL in that column?',
      options: [
        'Both return the same count',
        'COUNT(*) counts all rows; COUNT(column) counts only rows where column is NOT NULL',
        'COUNT(*) counts NULL rows; COUNT(column) ignores NULL rows',
        'COUNT(column) returns NULL if any value is NULL',
      ],
      answer: 1,
      explanation: 'COUNT(*) counts every row regardless of NULLs. COUNT(column) counts only non-NULL values in that specific column.',
    },
    {
      q: 'What does NULLIF(denominator, 0) return when denominator = 0?',
      options: ['0', '1', 'NULL', 'An error'],
      answer: 2,
      explanation: 'NULLIF returns NULL when both arguments are equal. Dividing by NULL returns NULL instead of a division-by-zero error.',
    },
    {
      q: 'How does NULL propagate through string concatenation in MSSQL and PostgreSQL?',
      options: [
        'NULL is treated as an empty string in all string functions',
        'In MSSQL + operator: NULL + anything = NULL; CONCAT() treats NULL as empty string. In PostgreSQL || operator: NULL || anything = NULL; CONCAT() treats NULL as empty string.',
        'Both dialects always treat NULL as empty string in concatenation',
        'NULL propagation only affects numeric operations, not strings'
      ],
      answer: 1,
      explanation: 'The behaviour differs by operator and function. The + operator in MSSQL and the || operator in PostgreSQL both propagate NULL. But CONCAT() in both dialects silently converts NULL arguments to empty string. Choose the operator or function deliberately based on whether you want NULL propagation.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use NULL or a default value (empty string, 0) for missing data?',
      a: 'Prefer NULL for genuinely missing data — it clearly signals "unknown" and aggregates ignore it naturally. Use defaults only when you have a meaningful default (e.g., discount = 0 when no discount applies). Mixing semantics (NULL meaning both "unknown" and "zero discount") causes bugs.',
    },
    {
      q: 'How does NULL behave in ORDER BY?',
      a: 'NULLs sort as the smallest value in MSSQL (appear first in ASC). In PostgreSQL, NULLs sort as the largest (appear last in ASC). Use NULLS FIRST or NULLS LAST (PostgreSQL) or CASE WHEN col IS NULL THEN 1 ELSE 0 END (MSSQL) to control placement.',
    },
    {
      q: 'Can I join two tables on NULL values?',
      a: 'No — `a.col = b.col` does not match when both sides are NULL (evaluates to UNKNOWN). Use `a.col = b.col OR (a.col IS NULL AND b.col IS NULL)`. In SQL Server 2022+ you can use `a.col IS NOT DISTINCT FROM b.col`. Always prefer surrogate non-nullable keys for join columns.',
    },
    {
      q: 'What is the ANSI_NULLS setting in MSSQL and why does it matter?',
      a: 'ANSI_NULLS ON (the default) makes NULL comparisons follow the SQL standard: NULL = NULL → UNKNOWN. ANSI_NULLS OFF makes NULL = NULL → TRUE and NULL <> NULL → FALSE. The OFF setting is deprecated and should never be used — it breaks portability and can cause subtle query differences between connections. Always ensure SET ANSI_NULLS ON.',
    },
    {
      q: 'How do aggregate functions handle NULL values?',
      a: 'COUNT(*) counts all rows. COUNT(col) ignores NULL values. SUM, AVG, MIN, MAX all ignore NULLs entirely — they aggregate only non-NULL values. If ALL values are NULL, these aggregates return NULL (not 0). Use COALESCE(SUM(col), 0) to return 0 when the sum is over all-NULL inputs.',
    },
    {
      q: 'What is the difference between NULL and an empty string in PostgreSQL?',
      a: 'PostgreSQL distinguishes NULL (unknown/absent) from \'\'  (empty string) at the type level. A NOT NULL constraint blocks NULL but allows empty strings. LENGTH(NULL) = NULL; LENGTH(\'\') = 0. Use NULLIF(col, \'\') to convert empty strings to NULL for consistent treatment. In MSSQL, both exist independently as well — never assume an empty string and NULL are equivalent.',
    },
  ];
}
