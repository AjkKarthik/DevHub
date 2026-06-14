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
  selector: 'app-sql-set-operations',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './set-operations.html',
  styleUrl: './set-operations.scss',
})
export class SqlSetOperations {

  quickRef: QuickRefItem[] = [
    { name: 'UNION',        type: 'keyword', desc: 'Combines two result sets and removes duplicate rows. Column count and types must match.' },
    { name: 'UNION ALL',    type: 'keyword', desc: 'Combines result sets keeping all rows including duplicates. Faster than UNION.' },
    { name: 'INTERSECT',    type: 'keyword', desc: 'Returns only rows that appear in BOTH result sets. Deduplicated.' },
    { name: 'EXCEPT',       type: 'keyword', desc: 'Returns rows from the first set that do NOT appear in the second. MSSQL and PostgreSQL.' },
    { name: 'MINUS',        type: 'keyword', desc: 'Oracle equivalent of EXCEPT. Not available in MSSQL or PostgreSQL.' },
    { name: 'ORDER BY',     type: 'keyword', desc: 'Applies to the final combined result — placed after the last SELECT, not within branches.' },
    { name: 'Column alias', type: 'syntax',  desc: 'Column names come from the first SELECT branch. Alias there to control output column names.' },
    { name: 'INTERSECT ALL / EXCEPT ALL', type: 'syntax', desc: 'PostgreSQL supports ALL variants that preserve duplicates. MSSQL does not.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Set operations combine result sets vertically',
      points: [
        'Set operations (UNION, INTERSECT, EXCEPT) stack rows from two SELECT statements into a single result, unlike JOINs which combine columns horizontally.',
        'Both branches must have the same number of columns, and corresponding columns must have compatible types. The column names in the output come from the first SELECT.',
        'Set operations treat each row as a unit — two rows are "equal" if all their column values are equal, including NULLs (NULL = NULL for this comparison).',
      ],
    },
    {
      heading: 'UNION vs UNION ALL',
      points: [
        'UNION eliminates duplicate rows by sorting and comparing the full result — it is equivalent to adding DISTINCT to the combined output.',
        'UNION ALL keeps every row from both queries, including duplicates. It is almost always faster because no deduplication step is needed.',
        'Prefer UNION ALL when you know the data cannot contain duplicates (e.g., combining disjoint date ranges or separate partition tables). Use UNION only when deduplication is semantically required.',
      ],
    },
    {
      heading: 'INTERSECT — rows in both sets',
      points: [
        'INTERSECT returns only rows that appear in BOTH result sets. It is equivalent to an INNER JOIN on all columns, but expressed as a set operation.',
        'It deduplicates by default — use INTERSECT ALL (PostgreSQL only) to preserve duplicates.',
        'Common use: finding customers who placed orders in two different time periods, or products that appear in two separate category lists.',
      ],
    },
    {
      heading: 'EXCEPT / MINUS — rows in first but not second',
      points: [
        'EXCEPT (MSSQL and PostgreSQL) returns rows from the first SELECT that are absent from the second SELECT. Oracle calls this MINUS.',
        'It is equivalent to a LEFT ANTI JOIN — rows where no match exists on the right side.',
        'Useful for finding gaps: products not yet ordered, employees not assigned to a project, expected records missing from an import.',
      ],
    },
    {
      heading: 'Ordering and chaining',
      points: [
        'ORDER BY applies to the final combined result. It goes after the last SELECT branch — you cannot ORDER BY inside individual branches (unless wrapped in a subquery or CTE).',
        'You can chain multiple set operations: A UNION B INTERSECT C. Precedence: INTERSECT binds tighter than UNION/EXCEPT — use parentheses to control evaluation order.',
        'Individual branches can use CTEs, JOINs, and WHERE clauses. Wrap complex branches in parentheses for readability.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'UNION / UNION ALL',
      language: 'sql',
      code: `-- UNION: combine active and archived customers, deduplicated
SELECT customer_id, name, email FROM customers WHERE active = 1
UNION
SELECT customer_id, name, email FROM customers_archive WHERE active = 1;

-- UNION ALL: faster when duplicates are not possible
SELECT product_id, 'Q1' AS quarter, revenue FROM sales_q1
UNION ALL
SELECT product_id, 'Q2' AS quarter, revenue FROM sales_q2
UNION ALL
SELECT product_id, 'Q3' AS quarter, revenue FROM sales_q3
ORDER BY product_id, quarter;`,
    },
    {
      label: 'INTERSECT',
      language: 'sql',
      code: `-- Customers who ordered in BOTH January AND February
SELECT customer_id FROM orders WHERE order_date >= '2024-01-01' AND order_date < '2024-02-01'
INTERSECT
SELECT customer_id FROM orders WHERE order_date >= '2024-02-01' AND order_date < '2024-03-01';

-- PostgreSQL INTERSECT ALL preserves duplicates
SELECT product_id FROM wishlist_user_1
INTERSECT ALL
SELECT product_id FROM wishlist_user_2;`,
    },
    {
      label: 'EXCEPT',
      language: 'sql',
      code: `-- Products that have NEVER been ordered
SELECT product_id FROM products
EXCEPT
SELECT DISTINCT product_id FROM order_items;

-- Employees NOT assigned to any project (both dialects)
SELECT employee_id FROM employees
EXCEPT
SELECT DISTINCT employee_id FROM project_assignments;

-- PostgreSQL EXCEPT ALL
-- Returns rows in A that don't have a matching row in B (preserving frequency)
SELECT product_id FROM inventory
EXCEPT ALL
SELECT product_id FROM sold_today;`,
    },
    {
      label: 'Chaining & ORDER BY',
      language: 'sql',
      code: `-- ORDER BY applies to the final result only
SELECT id, name, 'active'   AS status FROM customers WHERE active = 1
UNION ALL
SELECT id, name, 'inactive' AS status FROM customers WHERE active = 0
ORDER BY name;            -- order applies to the union result

-- Precedence: INTERSECT before UNION
-- Without parens: A UNION (B INTERSECT C)
SELECT id FROM A
UNION
SELECT id FROM B
INTERSECT
SELECT id FROM C;

-- Force left-to-right: (A UNION B) INTERSECT C
SELECT id FROM (
    SELECT id FROM A
    UNION
    SELECT id FROM B
) combined
INTERSECT
SELECT id FROM C;`,
    },
    {
      label: 'Practical: schema comparison',
      language: 'sql',
      code: `-- Find columns present in source table but missing from target table
-- Useful for schema drift detection
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'source_table' AND table_schema = 'dbo'
EXCEPT
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'target_table' AND table_schema = 'dbo';

-- PostgreSQL equivalent
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'source_table'
EXCEPT
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'target_table';`,
    },
  ];

  challenge: Challenge = {
    title: 'Gap finder with EXCEPT',
    language: 'sql',
    description: `Given two tables:
- expected_products(product_id INT)
- received_products(product_id INT)

Write a query that returns product_ids expected but NOT yet received.
Also write the inverse: products received that were NOT expected.`,
    hints: [
      'EXCEPT returns rows in the first set not in the second',
      'Swap the order to get the inverse',
      'UNION ALL the two queries to show both gaps in one result with a label column',
    ],
    starterCode: `-- Find products expected but not received
-- Then find products received but not expected`,
    solution: `-- Products expected but not received
SELECT product_id, 'Missing' AS status
FROM expected_products
EXCEPT
SELECT product_id, 'Missing' FROM received_products

UNION ALL

-- Products received but not expected (surprises)
SELECT product_id, 'Unexpected' AS status
FROM received_products
EXCEPT
SELECT product_id, 'Unexpected' FROM expected_products
ORDER BY status, product_id;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between UNION and UNION ALL?',
      options: [
        'UNION supports more than two queries; UNION ALL only two',
        'UNION removes duplicate rows; UNION ALL keeps all rows including duplicates',
        'UNION ALL requires matching column types; UNION does not',
        'UNION is faster than UNION ALL',
      ],
      answer: 1,
      explanation: 'UNION performs a DISTINCT operation on the combined result. UNION ALL skips this deduplication step, making it faster.',
    },
    {
      q: 'Where must ORDER BY be placed when using set operations?',
      options: [
        'After each SELECT branch',
        'Before the first SELECT',
        'After the final SELECT branch',
        'Inside each branch in parentheses',
      ],
      answer: 2,
      explanation: 'ORDER BY applies to the combined result and must appear after the last SELECT. Placing it inside a branch causes a syntax error.',
    },
    {
      q: 'Which set operation returns only rows present in BOTH result sets?',
      options: ['UNION ALL', 'EXCEPT', 'INTERSECT', 'MINUS'],
      answer: 2,
      explanation: 'INTERSECT returns rows that appear in both the first and second result sets. MINUS is Oracle\'s name for EXCEPT.',
    },
    {
      q: 'How does EXCEPT differ from NOT IN?',
      options: [
        'EXCEPT is NULL-safe for full-row comparison; NOT IN can return empty results if the subquery contains NULL',
        'NOT IN compares all columns; EXCEPT compares only the first column',
        'EXCEPT is an Oracle-only operator',
        'They are identical in all dialects',
      ],
      answer: 0,
      explanation: 'EXCEPT compares entire rows and handles NULLs consistently. NOT IN returns empty results when the subquery includes a NULL value — a common bug.',
    },
    {
      q: 'In a UNION query with three branches, where do the output column names come from?',
      options: [
        'The last SELECT branch',
        'The branch with the longest column names',
        'The first SELECT branch',
        'Must be specified in an alias at the end',
      ],
      answer: 2,
      explanation: 'SQL takes column names from the first SELECT branch. To control output names, alias the columns in the first branch.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use EXCEPT instead of NOT IN / NOT EXISTS?',
      a: 'EXCEPT compares whole rows and handles NULLs correctly. NOT IN fails silently when the subquery contains NULLs (returns empty set). For simple single-column comparisons, NOT EXISTS is usually the clearest option. EXCEPT is ideal when comparing multi-column rows or when you want to avoid writing a join.',
    },
    {
      q: 'Does INTERSECT ALL exist in both MSSQL and PostgreSQL?',
      a: 'No. PostgreSQL supports INTERSECT ALL and EXCEPT ALL which preserve duplicate rows. MSSQL only supports INTERSECT and EXCEPT (which always deduplicate). For MSSQL, simulate INTERSECT ALL with a counted CTE approach or INNER JOIN.',
    },
    {
      q: 'Can set operations be used with INSERT or UPDATE?',
      a: 'A set operation query can be used as the source for INSERT ... SELECT or in a CTE that feeds an UPDATE/DELETE. For example: INSERT INTO archive SELECT ... EXCEPT SELECT ... is a valid pattern for inserting only non-duplicate rows.',
    },
    {
      q: 'What is the performance difference between UNION and UNION ALL?',
      a: 'UNION sorts and deduplicates the combined result, adding O(n log n) overhead. UNION ALL simply concatenates the results, making it O(n). If your data is guaranteed unique across branches — e.g., year-partitioned tables — always use UNION ALL.',
    },
  ];
}
