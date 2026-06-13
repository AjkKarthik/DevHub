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
    { name: 'CREATE PROCEDURE',      type: 'keyword', desc: 'Defines a reusable named block of T-SQL or PL/pgSQL', since: 'SQL:1999' },
    { name: 'ALTER PROCEDURE',       type: 'keyword', desc: 'Modifies an existing procedure without dropping it (preserves permissions)', since: 'SQL:1999' },
    { name: 'EXEC / EXECUTE',        type: 'keyword', desc: 'Calls a stored procedure; parameters by position or name (@p = value)', since: 'MSSQL' },
    { name: 'OUTPUT parameter',      type: 'syntax',  desc: 'Passes a value back from the procedure to the caller via @param OUTPUT', since: 'MSSQL' },
    { name: 'RETURN',                type: 'keyword', desc: 'Exits the procedure and optionally returns an integer status code', since: 'SQL:1999' },
    { name: 'Scalar UDF',            type: 'keyword', desc: 'User-defined function returning one value; kills query parallelism — avoid in WHERE/JOIN', since: 'MSSQL 2000' },
    { name: 'Inline TVF',            type: 'keyword', desc: 'Table-valued function with a single RETURN SELECT; behaves like a parameterised view', since: 'MSSQL 2000' },
    { name: 'Multi-stmt TVF',        type: 'keyword', desc: 'TVF with a table variable and multiple statements; not inlined — worse performance', since: 'MSSQL 2000' },
    { name: 'Parameter sniffing',    type: 'keyword', desc: 'Plan cached on first execution\'s parameter values; may perform poorly for atypical values', since: 'MSSQL' },
    { name: 'OPTION(RECOMPILE)',      type: 'keyword', desc: 'Forces plan recompile per execution — fixes sniffing at the cost of CPU', since: 'MSSQL' },
    { name: 'WITH(NOLOCK)',          type: 'keyword', desc: 'Read uncommitted hint at table level — dirty reads; prefer RCSI instead', since: 'MSSQL' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Stored procedures — purpose and structure',
      points: [
        'A stored procedure is a named, compiled block of SQL and control-flow logic stored in the database. Advantages: pre-compiled execution plan, encapsulated business logic, reduced network round-trips, and fine-grained permission grants.',
        'Use <code>CREATE OR ALTER PROCEDURE</code> (SQL Server 2016+) to create or update in one statement. Earlier versions require separate CREATE/ALTER.',
        'Parameters are typed: <code>@OrderID INT</code>. Input parameters are the default; output parameters use the <code>OUTPUT</code> keyword. Default values can be assigned: <code>@Status VARCHAR(20) = \'Active\'</code>.',
        'Always wrap multi-statement procedures in TRY/CATCH with ROLLBACK in the CATCH block. Use <code>THROW</code> to re-raise the error.',
      ],
    },
    {
      heading: 'Scalar UDFs vs inline TVFs',
      points: [
        '<strong>Scalar UDFs</strong> return a single value. They look clean in queries (<code>SELECT dbo.FormatName(FirstName, LastName)</code>) but have a critical flaw: they are executed row-by-row, prevent parallelism, and are not inlined by the optimiser in older SQL Server versions (pre-2019).',
        '<strong>Inline Table-Valued Functions (iTVF)</strong> contain a single <code>RETURN SELECT</code>. The optimiser inlines them into the calling query — they behave like parameterised views with full parallelism and index utilisation.',
        '<strong>Multi-statement TVFs</strong> use a declared table variable with multiple INSERT statements. They are not inlined and have poor cardinality estimates. Avoid them when an inline TVF can do the same job.',
        'SQL Server 2019 introduced scalar UDF inlining, which auto-inlines simple UDFs. Check <code>sys.sql_modules.is_inlineable</code> to see if a UDF qualifies.',
      ],
    },
    {
      heading: 'Parameter sniffing',
      points: [
        'SQL Server compiles a stored procedure\'s plan the first time it runs, using the parameter values passed at that point (parameter sniffing). The plan is cached and reused for subsequent calls with different values.',
        'If the first call uses a selective value (few rows) the plan gets a nested-loop join. A later call with a non-selective value (many rows) uses the same nested-loop plan — which is now inefficient.',
        'Solutions: <code>OPTION(RECOMPILE)</code> on the problematic query (new plan every call); <code>OPTION(OPTIMIZE FOR (@p UNKNOWN))</code> (uses average statistics); local variables (hide sniffing but also hide useful stats); or conditional logic for extreme cases.',
        'SQL Server 2022 introduces adaptive parameter sensitivity (APS) to automatically generate multiple plans for the same procedure.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CREATE PROCEDURE',
      language: 'sql',
      code: `-- Basic stored procedure with error handling
CREATE OR ALTER PROCEDURE usp_PlaceOrder
    @CustomerID INT,
    @ProductID  INT,
    @Quantity   INT,
    @OrderID    BIGINT OUTPUT          -- output parameter
AS
BEGIN
    SET NOCOUNT ON;                    -- suppresses row-count messages

    BEGIN TRY
        BEGIN TRANSACTION;

        IF (SELECT Stock FROM Products WHERE ProductID = @ProductID) < @Quantity
            RAISERROR('Insufficient stock', 16, 1);

        INSERT INTO Orders (CustomerID, OrderDate)
        VALUES (@CustomerID, SYSUTCDATETIME());

        SET @OrderID = SCOPE_IDENTITY();

        UPDATE Products
        SET Stock = Stock - @Quantity
        WHERE ProductID = @ProductID;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;

-- Calling it
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
      code: `-- Bad: scalar UDF — executed per row, kills parallelism
CREATE FUNCTION dbo.GetCategoryName (@CategoryID INT)
RETURNS NVARCHAR(100)
AS BEGIN
    RETURN (SELECT CategoryName FROM Categories WHERE CategoryID = @CategoryID);
END;

-- Better: inline TVF — inlined like a view
CREATE FUNCTION dbo.GetOrderSummary (@CustomerID INT)
RETURNS TABLE
AS
RETURN (
    SELECT
        o.OrderID,
        o.OrderDate,
        SUM(od.Quantity * od.UnitPrice) AS Total
    FROM Orders o
    JOIN [Order Details] od ON o.OrderID = od.OrderID
    WHERE o.CustomerID = @CustomerID
    GROUP BY o.OrderID, o.OrderDate
);

-- Usage — the optimiser inlines GetOrderSummary into the query
SELECT * FROM dbo.GetOrderSummary(42)
WHERE Total > 500;`,
    },
    {
      label: 'Parameter sniffing fixes',
      language: 'sql',
      code: `-- Problem procedure — plan cached for one param value
CREATE PROCEDURE usp_GetOrders @CustomerID INT
AS
SELECT * FROM Orders WHERE CustomerID = @CustomerID;

-- Fix 1: OPTION(RECOMPILE) — recompiles every call
SELECT * FROM Orders WHERE CustomerID = @CustomerID
OPTION(RECOMPILE);

-- Fix 2: OPTIMIZE FOR UNKNOWN — use avg stats
SELECT * FROM Orders WHERE CustomerID = @CustomerID
OPTION(OPTIMIZE FOR (@CustomerID UNKNOWN));

-- Fix 3: local variable (hides sniffing)
CREATE PROCEDURE usp_GetOrders_Local @CustomerID INT
AS
BEGIN
    DECLARE @LocalCustID INT = @CustomerID;
    SELECT * FROM Orders WHERE CustomerID = @LocalCustID;
END;`,
    },
  ];

  challenge: Challenge = {
    title: 'Paginated Product Search Procedure',
    language: 'sql',
    description: `Write a stored procedure usp_SearchProducts that:
- Accepts @SearchTerm NVARCHAR(100), @CategoryID INT (optional, default NULL), @PageNumber INT (default 1), @PageSize INT (default 20)
- Returns products matching the search term (in ProductName) and optionally filtered by category
- Implements OFFSET-FETCH pagination based on PageNumber and PageSize
- Returns the total row count as an OUTPUT parameter @TotalRows`,
    hints: [
      'Use SET NOCOUNT ON at the start',
      'For optional category: WHERE CategoryID = @CategoryID OR @CategoryID IS NULL',
      'Pagination: OFFSET (@PageNumber - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY',
      'Get total count with a separate SELECT COUNT(*) using the same WHERE conditions',
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

    -- Total matching rows
    SELECT @TotalRows = COUNT(*)
    FROM Products
    WHERE ProductName LIKE N'%' + @SearchTerm + N'%'
      AND (@CategoryID IS NULL OR CategoryID = @CategoryID)
      AND Discontinued = 0;

    -- Paged results
    SELECT ProductID, ProductName, CategoryID, UnitPrice
    FROM Products
    WHERE ProductName LIKE N'%' + @SearchTerm + N'%'
      AND (@CategoryID IS NULL OR CategoryID = @CategoryID)
      AND Discontinued = 0
    ORDER BY ProductName
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why do scalar UDFs harm performance in SQL Server (pre-2019)?',
      options: [
        'They are not compiled',
        'They execute row-by-row, prevent query parallelism, and the optimiser cannot inline them',
        'They do not support transactions',
        'They cannot access base tables',
      ],
      answer: 1,
      explanation: 'Scalar UDFs are executed once per row in a RBAR (Row-By-Agonizing-Row) fashion. They also force the query to run single-threaded. SQL Server 2019+ can inline simple UDFs, but relying on this is fragile.',
    },
    {
      q: 'What does SET NOCOUNT ON do in a stored procedure?',
      options: [
        'Prevents the procedure from returning result sets',
        'Suppresses the "N rows affected" messages sent after each DML statement',
        'Prevents row locking',
        'Disables error handling',
      ],
      answer: 1,
      explanation: 'SET NOCOUNT ON suppresses the "X row(s) affected" message. In ADO.NET / Entity Framework, those messages can trigger spurious "result set expected" errors. Always use it in procedures.',
    },
    {
      q: 'An inline TVF differs from a multi-statement TVF because:',
      options: [
        'An inline TVF can only return one column',
        'An inline TVF is inlined into the calling query by the optimiser — it behaves like a parameterised view',
        'A multi-statement TVF has better performance',
        'An inline TVF cannot use parameters',
      ],
      answer: 1,
      explanation: 'An inline TVF contains a single RETURN SELECT and is fully inlined. The optimiser sees through it and can use indexes, push predicates, and parallelize. A multi-statement TVF builds a table variable in multiple steps — it is opaque to the optimiser.',
    },
    {
      q: 'Parameter sniffing occurs when:',
      options: [
        'The procedure has too many parameters',
        'SQL Server caches a plan based on the first execution\'s parameter values and reuses it for different values that warrant a different plan',
        'The procedure accesses tables from multiple schemas',
        'Parameters are passed by position instead of name',
      ],
      answer: 1,
      explanation: 'SQL Server compiles and caches a plan on first execution using the passed parameter values. If those values are not representative of typical usage, subsequent executions reuse a suboptimal plan.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use stored procedures or ORMs for data access?',
      a: 'Both are valid. ORMs (Entity Framework, Dapper) work well for standard CRUD and generate efficient parameterised queries. Stored procedures are better for complex multi-step operations, batch processing, or when you need to minimise round-trips. Many teams use ORMs for most queries and stored procedures for complex logic.',
    },
    {
      q: 'What is SCOPE_IDENTITY() and when should I use it?',
      a: 'SCOPE_IDENTITY() returns the last identity value inserted in the current scope. Use it immediately after INSERT into a table with an IDENTITY column to get the new row\'s ID. Prefer it over @@IDENTITY (which returns the last identity in the session, including triggers) and IDENT_CURRENT (which returns the last value for a specific table across all sessions).',
    },
    {
      q: 'What is the difference between RETURN and OUTPUT parameters?',
      a: 'RETURN exits the procedure immediately and passes an integer status code (0 = success by convention). OUTPUT parameters are typed values passed back through a variable declared in the calling code — they can be any data type, not just integers. Use RETURN for success/failure status, and OUTPUT for data values.',
    },
    {
      q: 'Can I use dynamic SQL inside a stored procedure safely?',
      a: 'Yes, with parameterised dynamic SQL. Use sp_executesql with @params and bind user inputs as parameters — never concatenate user input directly into a SQL string. Example: EXEC sp_executesql N\'SELECT * FROM t WHERE col = @val\', N\'@val INT\', @val = @UserInput. This prevents SQL injection.',
    },
  ];
}
