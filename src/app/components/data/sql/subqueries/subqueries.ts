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
  selector: 'app-sql-subqueries',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './subqueries.html',
  styleUrl: './subqueries.scss',
})
export class SqlSubqueries {

  quickRef: QuickRefItem[] = [
    { name: 'Scalar subquery',   type: 'syntax', desc: 'Returns exactly one row, one column; used as a column expression or in WHERE', since: 'SQL-92' },
    { name: 'Row subquery',      type: 'syntax', desc: 'Returns one row with multiple columns; compared with a row constructor', since: 'SQL-92' },
    { name: 'Derived table',     type: 'syntax', desc: 'Subquery in FROM clause; must be aliased; evaluated once', since: 'SQL-92' },
    { name: 'IN / NOT IN',       type: 'operator', desc: 'Tests if a value is in the subquery result; NOT IN breaks with NULLs', since: 'SQL-92' },
    { name: 'EXISTS',            type: 'operator', desc: 'Returns true if the subquery returns at least one row; short-circuits on first match', since: 'SQL-92' },
    { name: 'NOT EXISTS',        type: 'operator', desc: 'Returns true if the subquery returns no rows; safer than NOT IN with NULLs', since: 'SQL-92' },
    { name: 'ANY / SOME',        type: 'operator', desc: 'True if the comparison holds for at least one value in the subquery', since: 'SQL-92' },
    { name: 'ALL',               type: 'operator', desc: 'True if the comparison holds for every value in the subquery', since: 'SQL-92' },
    { name: 'Correlated',        type: 'syntax',  desc: 'References an outer query column; re-evaluated once per outer row', since: 'SQL-92' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Types of subqueries',
      points: [
        'A <strong>scalar subquery</strong> returns exactly one row and one column. It can appear anywhere a single value is expected: in SELECT, WHERE, or even ORDER BY. A scalar subquery that returns more than one row causes a runtime error.',
        'A <strong>derived table</strong> (inline view) lives in the FROM clause, must be aliased, and behaves like a regular table for the rest of the query. The engine materialises it once and reuses it.',
        'A <strong>correlated subquery</strong> references a column from the outer query. The subquery is re-evaluated once per outer row, making it O(n) — potentially slow on large tables. The optimiser often converts them to joins automatically.',
        '<strong>EXISTS / NOT EXISTS</strong> subqueries are correlated by design and short-circuit as soon as one row is found — making them efficient for existence checks.',
      ],
    },
    {
      heading: 'IN vs EXISTS — performance and correctness',
      points: [
        '<code>col IN (SELECT …)</code> builds the full subquery result set first, then checks membership. On large result sets this can be expensive.',
        '<code>EXISTS (SELECT 1 FROM … WHERE …)</code> stops scanning as soon as any row matches. It is generally faster for large outer tables and large subquery results.',
        '<strong>Critical:</strong> <code>col NOT IN (SELECT …)</code> returns no rows if the subquery result contains any NULL. This is the most common NOT IN bug. Always use <code>NOT EXISTS</code> or add <code>WHERE col IS NOT NULL</code> to the subquery.',
        'Modern optimisers often rewrite IN as a semi-join, so the actual difference depends on statistics and index coverage.',
      ],
    },
    {
      heading: 'Correlated subqueries',
      points: [
        'A correlated subquery references a column from the outer query in its WHERE clause. It runs once per row of the outer query, so for a 10,000-row outer table the subquery runs 10,000 times.',
        'The classic use case: find rows where a value exceeds the group average. The subquery computes the average for the group defined by the current outer row\'s key.',
        'The optimiser usually transforms correlated subqueries into joins internally. If you find the query plan shows many lookups, try rewriting explicitly as a JOIN or CTE.',
        'Correlated subqueries in SELECT are called <strong>scalar aggregate subqueries</strong>. They are clean to write but can be slow — consider switching to a window function (OVER) instead.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Scalar & Derived',
      language: 'sql',
      code: `-- Scalar subquery in SELECT: average price alongside each product
SELECT
    ProductName,
    UnitPrice,
    (SELECT AVG(UnitPrice) FROM Products) AS AvgPrice
FROM Products;

-- Derived table: top 3 customers by order count
SELECT *
FROM (
    SELECT CustomerID, COUNT(*) AS Orders
    FROM Orders
    GROUP BY CustomerID
) AS CustomerOrders
WHERE Orders >= 10
ORDER BY Orders DESC;`,
    },
    {
      label: 'IN vs EXISTS',
      language: 'sql',
      code: `-- IN: products that have ever been ordered
SELECT ProductName
FROM Products
WHERE ProductID IN (
    SELECT DISTINCT ProductID
    FROM [Order Details]
);

-- EXISTS: equivalent, usually faster
SELECT ProductName
FROM Products p
WHERE EXISTS (
    SELECT 1
    FROM [Order Details] od
    WHERE od.ProductID = p.ProductID
);

-- NOT EXISTS (safer than NOT IN with NULLs)
SELECT ProductName
FROM Products p
WHERE NOT EXISTS (
    SELECT 1
    FROM [Order Details] od
    WHERE od.ProductID = p.ProductID
);`,
    },
    {
      label: 'Correlated subquery',
      language: 'sql',
      code: `-- Products priced above their category average
SELECT
    p.ProductName,
    p.UnitPrice,
    p.CategoryID
FROM Products p
WHERE p.UnitPrice > (
    SELECT AVG(p2.UnitPrice)
    FROM Products p2
    WHERE p2.CategoryID = p.CategoryID  -- outer reference
);

-- Row with the highest salary per department
SELECT EmployeeID, DeptID, Salary
FROM Employees e
WHERE Salary = (
    SELECT MAX(Salary)
    FROM Employees e2
    WHERE e2.DeptID = e.DeptID
);`,
    },
  ];

  challenge: Challenge = {
    title: 'Above-Average Products by Category',
    language: 'sql',
    description: `Using the Products table (ProductID, ProductName, CategoryID, UnitPrice, Discontinued):
- Find all active products (Discontinued = 0) whose UnitPrice is strictly above the average price of their own category
- Return ProductName, CategoryID, and UnitPrice
- Order by CategoryID, then UnitPrice descending`,
    hints: [
      'Use a correlated subquery in WHERE that selects AVG(UnitPrice) for the same CategoryID',
      'The subquery references p.CategoryID from the outer query',
      'Filter Discontinued = 0 in the outer WHERE',
    ],
    starterCode: `SELECT
    ProductName,
    CategoryID,
    UnitPrice
FROM Products p
WHERE Discontinued = 0
  AND UnitPrice > (
    -- correlated subquery here
  )
ORDER BY CategoryID, UnitPrice DESC;`,
    solution: `SELECT
    ProductName,
    CategoryID,
    UnitPrice
FROM Products p
WHERE Discontinued = 0
  AND UnitPrice > (
      SELECT AVG(UnitPrice)
      FROM Products p2
      WHERE p2.CategoryID = p.CategoryID
        AND p2.Discontinued = 0
  )
ORDER BY CategoryID, UnitPrice DESC;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What happens if a scalar subquery returns more than one row?',
      options: ['It returns the first row silently', 'A runtime error occurs', 'It returns NULL', 'It is treated as an IN subquery'],
      answer: 1,
      explanation: 'A scalar subquery is expected to return exactly one row and one column. If it returns multiple rows, the database raises a runtime error (subquery returns more than one row).',
    },
    {
      q: 'Why does `col NOT IN (SELECT col FROM T)` return no rows when T contains a NULL?',
      options: ['NULL means the subquery is empty', 'NOT IN compares col with every value including NULL; col <> NULL = UNKNOWN, so the AND chain never evaluates to TRUE', 'It is a syntax error', 'NULL is treated as 0'],
      answer: 1,
      explanation: 'NOT IN reduces to col <> val for each value. col <> NULL yields UNKNOWN. AND with UNKNOWN never produces TRUE, so every outer row is filtered out.',
    },
    {
      q: 'A correlated subquery in the WHERE clause of a 50,000-row outer query runs:',
      options: ['Once', '50,000 times (once per outer row) in the worst case', 'Twice — once for NULLs and once for values', 'Depends on the SELECT list'],
      answer: 1,
      explanation: 'A correlated subquery re-executes for each row of the outer query in its naive form, making it O(n). The optimiser often converts it to a join, but you cannot rely on this.',
    },
    {
      q: 'Which is the safest way to check that no rows exist in another table?',
      options: ['col NOT IN (SELECT col FROM T)', 'NOT EXISTS (SELECT 1 FROM T WHERE ...)', 'COUNT(*) = 0 in WHERE', 'LEFT JOIN WHERE col IS NULL'],
      answer: 1,
      explanation: 'NOT EXISTS is correct even when the subquery column contains NULLs. LEFT JOIN ... WHERE IS NULL also works but requires a join. NOT IN breaks with NULLs.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I prefer a subquery over a JOIN?',
      a: 'Subqueries in WHERE (EXISTS / NOT EXISTS / IN) are natural for existence checks. Scalar subqueries in SELECT are readable for single lookups. For returning data from related tables or aggregating across joins, explicit JOINs are usually cleaner and often faster. The optimiser frequently rewrites both to the same plan, so readability should guide the choice.',
    },
    {
      q: 'What is the difference between a derived table and a CTE?',
      a: 'A derived table is an inline subquery in FROM — it cannot be referenced more than once. A CTE (WITH clause) is named and can be referenced multiple times in the same query. CTEs also support recursion. Both are evaluated at query time; neither persists data.',
    },
    {
      q: 'Can a subquery appear in the FROM clause and the SELECT clause simultaneously?',
      a: 'Yes. You can have a derived table in FROM for joining, and separate scalar subqueries in SELECT for lookups. The key constraint is that scalar subqueries in SELECT must return exactly one row.',
    },
    {
      q: 'What is a "non-correlated" subquery?',
      a: 'A non-correlated (or independent) subquery does not reference any column from the outer query. It is evaluated once and the result is cached for use in the outer query. Example: WHERE price > (SELECT AVG(price) FROM Products) — the subquery runs once, producing a single average, which is then compared against every row.',
    },
  ];
}
