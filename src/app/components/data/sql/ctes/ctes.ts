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
  selector: 'app-sql-ctes',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './ctes.html',
  styleUrl: './ctes.scss',
})
export class SqlCtes {

  quickRef: QuickRefItem[] = [
    { name: 'WITH cte AS (...)',   type: 'syntax',  desc: 'Defines a named CTE; referenced in the following SELECT/INSERT/UPDATE/DELETE', since: 'SQL:1999' },
    { name: 'Multiple CTEs',       type: 'syntax',  desc: 'Comma-separated: WITH a AS (...), b AS (...) SELECT ... — each can reference previous CTEs', since: 'SQL:1999' },
    { name: 'Recursive CTE',       type: 'syntax',  desc: 'WITH RECURSIVE (PostgreSQL) or plain WITH (MSSQL) — uses UNION ALL with a self-reference', since: 'SQL:1999' },
    { name: 'Anchor member',       type: 'syntax',  desc: 'First SELECT in a recursive CTE — the base case; runs once', since: 'SQL:1999' },
    { name: 'Recursive member',    type: 'syntax',  desc: 'Second SELECT references the CTE itself; runs repeatedly until no rows returned', since: 'SQL:1999' },
    { name: 'MAXRECURSION',        type: 'keyword', desc: 'MSSQL hint: OPTION (MAXRECURSION 100) — prevents infinite loops; default is 100', since: 'MSSQL 2005' },
    { name: 'NOT MATERIALIZED',    type: 'keyword', desc: 'PostgreSQL: hints the optimiser to inline the CTE rather than materialise it', since: 'PostgreSQL 12' },
    { name: 'CTE in DML',          type: 'syntax',  desc: 'CTEs can precede UPDATE/DELETE/INSERT for readable multi-step data changes', since: 'SQL:1999' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is a CTE and why use it',
      points: [
        'A <strong>Common Table Expression (CTE)</strong> is a named temporary result set defined at the top of a query with the <code>WITH</code> keyword. It exists only for the duration of the query and is not stored.',
        'CTEs replace deeply nested subqueries with readable, named building blocks. They make complex queries easier to understand, debug, and maintain — each CTE is a self-contained logical step.',
        'Multiple CTEs are separated by commas: <code>WITH a AS (…), b AS (…) SELECT …</code>. Later CTEs can reference earlier ones in the same WITH clause.',
        'CTEs can precede not just SELECT but also INSERT, UPDATE, and DELETE — enabling clean multi-step data-change operations.',
      ],
    },
    {
      heading: 'Recursive CTEs — walking hierarchies',
      points: [
        'A recursive CTE contains two parts separated by <code>UNION ALL</code>: the <strong>anchor member</strong> (base case) runs once; the <strong>recursive member</strong> references the CTE itself and runs until it returns no rows.',
        'Use recursive CTEs for: org charts (employee → manager chain), folder hierarchies, bill-of-materials, and graph traversals.',
        'In SQL Server, add <code>OPTION (MAXRECURSION N)</code> to cap the maximum depth. The default is 100; set to 0 for unlimited (use carefully).',
        'PostgreSQL requires the <code>RECURSIVE</code> keyword: <code>WITH RECURSIVE cte AS (…)</code>. SQL Server does not — plain <code>WITH</code> detects the self-reference.',
      ],
    },
    {
      heading: 'Materialisation and performance',
      points: [
        'In PostgreSQL (up to version 11), CTEs were always <strong>materialised</strong> — evaluated once and stored. From PostgreSQL 12, the optimiser can inline them. Use <code>NOT MATERIALIZED</code> to force inlining (allows predicate push-down); use plain to force caching when the CTE is expensive and referenced multiple times.',
        'In SQL Server, CTEs are generally inlined (not materialised). If a CTE is referenced multiple times in the same query, it may execute multiple times — unlike a temp table which executes once.',
        'For a CTE referenced many times in a large query, consider a <code>#temp</code> table (SQL Server) or <code>CREATE TEMP TABLE</code> (PostgreSQL) to materialise results and add an index.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic & Multi-CTE',
      language: 'sql',
      code: `-- Simple CTE to clean up a complex filter
WITH HighValueOrders AS (
    SELECT OrderID, CustomerID, SUM(od.UnitPrice * od.Quantity) AS Total
    FROM [Order Details] od
    JOIN Orders o ON od.OrderID = o.OrderID
    GROUP BY o.OrderID, o.CustomerID
    HAVING SUM(od.UnitPrice * od.Quantity) > 1000
)
SELECT c.CompanyName, h.Total
FROM HighValueOrders h
JOIN Customers c ON h.CustomerID = c.CustomerID
ORDER BY h.Total DESC;

-- Multiple CTEs
WITH
  MonthlySales AS (
      SELECT YEAR(OrderDate) AS Yr, MONTH(OrderDate) AS Mo, SUM(Freight) AS Rev
      FROM Orders GROUP BY YEAR(OrderDate), MONTH(OrderDate)
  ),
  Ranked AS (
      SELECT *, RANK() OVER (PARTITION BY Yr ORDER BY Rev DESC) AS MonthRank
      FROM MonthlySales
  )
SELECT * FROM Ranked WHERE MonthRank = 1;`,
    },
    {
      label: 'Recursive CTE',
      language: 'sql',
      code: `-- Employee org-chart: find all reports under EmployeeID 2
WITH EmployeeTree AS (
    -- Anchor: start from the root employee
    SELECT EmployeeID, LastName, ReportsTo, 0 AS Level
    FROM Employees
    WHERE EmployeeID = 2

    UNION ALL

    -- Recursive member: find direct reports of each row
    SELECT e.EmployeeID, e.LastName, e.ReportsTo, t.Level + 1
    FROM Employees e
    INNER JOIN EmployeeTree t ON e.ReportsTo = t.EmployeeID
)
SELECT EmployeeID, LastName, Level
FROM EmployeeTree
ORDER BY Level, LastName
OPTION (MAXRECURSION 10);  -- SQL Server

-- PostgreSQL version (WITH RECURSIVE keyword required)
-- WITH RECURSIVE EmployeeTree AS ( ... )`,
    },
    {
      label: 'CTE in UPDATE/DELETE',
      language: 'sql',
      code: `-- Delete duplicate rows, keep lowest ID
WITH Duplicates AS (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY Email
               ORDER BY CustomerID
           ) AS rn
    FROM Customers
)
DELETE FROM Duplicates WHERE rn > 1;

-- Update with staging CTE
WITH Adjustments AS (
    SELECT ProductID, UnitPrice * 1.10 AS NewPrice
    FROM Products
    WHERE CategoryID = 1
)
UPDATE p
SET p.UnitPrice = a.NewPrice
FROM Products p
JOIN Adjustments a ON p.ProductID = a.ProductID;`,
    },
  ];

  challenge: Challenge = {
    title: 'Category Revenue Ranking',
    language: 'sql',
    description: `Using Orders, Order Details, Products, and Categories:
- First CTE: calculate total revenue per category (Quantity × UnitPrice summed over order details)
- Second CTE: rank categories by revenue using RANK()
- Final query: return CategoryName, Revenue, and Rank — only top 3 ranked categories`,
    hints: [
      'First CTE joins Order Details → Products → Categories and sums revenue per CategoryID',
      'Second CTE applies RANK() OVER (ORDER BY Revenue DESC) to the first CTE',
      'Final SELECT filters WHERE Rank <= 3',
      'Join Categories on CategoryID to get the name',
    ],
    starterCode: `WITH
  CategoryRevenue AS (
      -- revenue per category
  ),
  RankedCategories AS (
      -- rank from CategoryRevenue
  )
SELECT CategoryName, Revenue, Rank
FROM RankedCategories
WHERE Rank <= 3
ORDER BY Rank;`,
    solution: `WITH
  CategoryRevenue AS (
      SELECT
          c.CategoryID,
          c.CategoryName,
          SUM(od.Quantity * od.UnitPrice) AS Revenue
      FROM [Order Details] od
      JOIN Products    p ON od.ProductID  = p.ProductID
      JOIN Categories  c ON p.CategoryID  = c.CategoryID
      GROUP BY c.CategoryID, c.CategoryName
  ),
  RankedCategories AS (
      SELECT *,
             RANK() OVER (ORDER BY Revenue DESC) AS Rank
      FROM CategoryRevenue
  )
SELECT CategoryName, Revenue, Rank
FROM RankedCategories
WHERE Rank <= 3
ORDER BY Rank;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the maximum number of CTEs you can define in a single WITH clause?',
      options: ['1', '5', 'Up to the query limit — no hard maximum', '10'],
      answer: 2,
      explanation: 'SQL allows as many CTEs as needed in a single WITH clause, separated by commas. Each can reference earlier-defined CTEs.',
    },
    {
      q: 'In a recursive CTE, what stops the recursion?',
      options: ['A LIMIT clause', 'The recursive member returning no rows', 'MAXRECURSION reaching 0', 'A STOP RECURSION keyword'],
      answer: 1,
      explanation: 'Recursion stops when the recursive member SELECT produces no rows. MAXRECURSION provides a safety cap to prevent runaway recursion.',
    },
    {
      q: 'In PostgreSQL, what is the behaviour of a plain CTE (without NOT MATERIALIZED) from version 12+?',
      options: ['Always materialised', 'Always inlined', 'The optimiser chooses — may materialise or inline based on cost', 'An error without the RECURSIVE keyword'],
      answer: 2,
      explanation: 'From PostgreSQL 12, the optimiser can choose whether to materialise or inline a CTE. Earlier versions always materialised.',
    },
    {
      q: 'Which SQL statement can a CTE NOT precede?',
      options: ['SELECT', 'INSERT', 'CREATE TABLE', 'DELETE'],
      answer: 2,
      explanation: 'CTEs can precede SELECT, INSERT, UPDATE, and DELETE. They cannot precede DDL statements like CREATE TABLE.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Is a CTE stored as a temp table?',
      a: 'No. A CTE exists only for the duration of the query and is not persisted. In SQL Server it is typically inlined. If you need to reference an intermediate result many times or add an index to it, use a real temp table (#temp) instead.',
    },
    {
      q: 'Can a CTE reference itself more than once in the recursive member?',
      a: 'No. A recursive CTE can only reference itself once in the recursive member. It also cannot use aggregate functions, GROUP BY, HAVING, TOP, or DISTINCT in the recursive member.',
    },
    {
      q: 'How do I prevent infinite recursion in a recursive CTE?',
      a: 'SQL Server: add OPTION (MAXRECURSION N) — default 100, set to 0 for unlimited. Also ensure the recursive member always advances toward a termination condition (e.g., a depth counter that increases each step with a WHERE Level < 10 guard).',
    },
    {
      q: 'Can I use a CTE in a view definition?',
      a: 'Yes. SQL Server and PostgreSQL both support CTEs inside view definitions. The CTE is simply part of the view\'s SELECT statement: CREATE VIEW v AS WITH cte AS (...) SELECT ... FROM cte.',
    },
  ];
}
