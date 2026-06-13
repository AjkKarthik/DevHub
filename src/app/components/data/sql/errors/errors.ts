import { Component, signal, computed } from '@angular/core';

interface SqlError {
  code: string;
  title: string;
  cause: string;
  fix: string;
  example: string;
  solution: string;
  tag: 'nulls' | 'indexes' | 'joins' | 'aggregates' | 'transactions' | 'types' | 'ddl';
}

@Component({
  selector: 'app-sql-errors',
  standalone: true,
  imports: [],
  templateUrl: './errors.html',
  styleUrl: './errors.scss',
})
export class SqlErrors {
  activeTag = signal<string>('all');
  tags = ['all', 'nulls', 'indexes', 'joins', 'aggregates', 'transactions', 'types', 'ddl'];

  errors: SqlError[] = [
    {
      code: 'NULL01',
      title: 'NOT IN returns no rows when list contains NULL',
      cause: 'col NOT IN (SELECT … WHERE …) returns empty when the subquery has any NULL. NOT IN expands to col <> val for each value; col <> NULL = UNKNOWN, so AND chain never evaluates to TRUE.',
      fix: 'Use NOT EXISTS, or add IS NOT NULL to the subquery WHERE clause.',
      example: `-- BUG: if Discontinued contains any NULL row this returns nothing
SELECT ProductName FROM Products
WHERE ProductID NOT IN (SELECT ProductID FROM Discontinued);`,
      solution: `-- SAFE: NOT EXISTS
SELECT ProductName FROM Products p
WHERE NOT EXISTS (
    SELECT 1 FROM Discontinued d WHERE d.ProductID = p.ProductID
);

-- OR: exclude NULLs from subquery
SELECT ProductName FROM Products
WHERE ProductID NOT IN (
    SELECT ProductID FROM Discontinued WHERE ProductID IS NOT NULL
);`,
      tag: 'nulls',
    },
    {
      code: 'NULL02',
      title: 'Comparing NULL with = always returns false',
      cause: 'Any comparison using = or <> against NULL returns NULL (unknown), not TRUE. This silently excludes rows.',
      fix: 'Use IS NULL or IS NOT NULL for NULL checks.',
      example: `-- BUG: returns no rows even when ShippedDate is NULL
SELECT * FROM Orders WHERE ShippedDate = NULL;`,
      solution: `-- CORRECT
SELECT * FROM Orders WHERE ShippedDate IS NULL;

-- CORRECT for both NULL and a specific value
SELECT * FROM Orders WHERE ShippedDate IS NULL OR ShippedDate < '2024-01-01';`,
      tag: 'nulls',
    },
    {
      code: 'IDX01',
      title: 'Function on indexed column prevents index seek',
      cause: 'Wrapping an indexed column in a function (YEAR(), UPPER(), CONVERT(), etc.) forces a full table scan — the index cannot be used for seeks.',
      fix: 'Rewrite the predicate to apply the function to the literal, not the column.',
      example: `-- BUG: full scan on large Orders table
SELECT * FROM Orders WHERE YEAR(OrderDate) = 2024;
SELECT * FROM Customers WHERE UPPER(Email) = 'TEST@EXAMPLE.COM';`,
      solution: `-- FAST: range predicate on column
SELECT * FROM Orders
WHERE OrderDate >= '2024-01-01' AND OrderDate < '2025-01-01';

-- FAST: use a case-insensitive collation
-- or a computed column index on UPPER(Email)`,
      tag: 'indexes',
    },
    {
      code: 'IDX02',
      title: 'Implicit type conversion causes table scan',
      cause: 'When a column and its comparison literal have different types, the DB casts the column on every row. This breaks index seeks.',
      fix: 'Match data types: use N prefix for NVARCHAR, correct literal format for dates.',
      example: `-- BUG: Email is NVARCHAR but literal is VARCHAR
SELECT * FROM Customers WHERE Email = 'test@example.com';

-- BUG: OrderID is INT but param is passed as string
SELECT * FROM Orders WHERE OrderID = '12345';`,
      solution: `-- CORRECT: N'' prefix for NVARCHAR columns
SELECT * FROM Customers WHERE Email = N'test@example.com';

-- CORRECT: pass int literal directly
SELECT * FROM Orders WHERE OrderID = 12345;`,
      tag: 'indexes',
    },
    {
      code: 'JOIN01',
      title: 'WHERE on right table turns LEFT JOIN into INNER JOIN',
      cause: 'A LEFT JOIN preserves all left rows. Adding a WHERE condition on a right-table column filters out NULL rows, making it effectively an INNER JOIN.',
      fix: 'Move right-table filters into the ON clause, or accept that you want an INNER JOIN.',
      example: `-- BUG: looks like LEFT JOIN but behaves like INNER JOIN
SELECT c.CompanyName, o.OrderID
FROM Customers c
LEFT JOIN Orders o ON c.CustomerID = o.CustomerID
WHERE o.Status = 'Shipped';  -- filters out customers with no orders`,
      solution: `-- To keep all customers, move right-table filter to ON:
SELECT c.CompanyName, o.OrderID
FROM Customers c
LEFT JOIN Orders o ON c.CustomerID = o.CustomerID
              AND o.Status = 'Shipped';

-- Or accept INNER JOIN if that is the intent
SELECT c.CompanyName, o.OrderID
FROM Customers c
INNER JOIN Orders o ON c.CustomerID = o.CustomerID
WHERE o.Status = 'Shipped';`,
      tag: 'joins',
    },
    {
      code: 'AGG01',
      title: 'Non-aggregate column in SELECT not in GROUP BY',
      cause: 'Standard SQL (and SQL Server / PostgreSQL) requires every non-aggregate SELECT column to appear in GROUP BY. MySQL allows this but returns an arbitrary value.',
      fix: 'Add the missing column to GROUP BY, or wrap it in an aggregate (MIN, MAX, etc.).',
      example: `-- ERROR in SQL Server / PostgreSQL
SELECT CustomerID, CompanyName, COUNT(*) AS Orders
FROM Orders o JOIN Customers c ON o.CustomerID = c.CustomerID
GROUP BY CustomerID;  -- CompanyName not in GROUP BY`,
      solution: `-- Fix: add CompanyName to GROUP BY
SELECT o.CustomerID, c.CompanyName, COUNT(*) AS Orders
FROM Orders o JOIN Customers c ON o.CustomerID = c.CustomerID
GROUP BY o.CustomerID, c.CompanyName;`,
      tag: 'aggregates',
    },
    {
      code: 'AGG02',
      title: 'Using aggregate function in WHERE clause',
      cause: 'WHERE is evaluated before GROUP BY; aggregate results don\'t exist yet. This causes a "invalid use of aggregate" error.',
      fix: 'Move aggregate conditions to HAVING.',
      example: `-- ERROR: aggregate in WHERE
SELECT CustomerID, COUNT(*) AS Orders
FROM Orders
WHERE COUNT(*) > 5
GROUP BY CustomerID;`,
      solution: `-- CORRECT: filter after aggregation with HAVING
SELECT CustomerID, COUNT(*) AS Orders
FROM Orders
GROUP BY CustomerID
HAVING COUNT(*) > 5;`,
      tag: 'aggregates',
    },
    {
      code: 'TXN01',
      title: 'Deadlock victim — error 1205 not handled',
      cause: 'Two transactions hold locks the other needs. SQL Server terminates one (error 1205). If not caught and retried, the operation silently fails.',
      fix: 'Catch error 1205 in the application layer and retry the transaction. Keep transactions short and acquire locks in consistent order.',
      example: `-- Application code with no retry logic
-- If deadlock occurs, the INSERT is silently lost`,
      solution: `// C# retry pattern for deadlocks
int retries = 3;
while (retries-- > 0) {
    try {
        await ExecuteTransactionAsync();
        break;
    } catch (SqlException ex) when (ex.Number == 1205) {
        if (retries == 0) throw;
        await Task.Delay(100);
    }
}`,
      tag: 'transactions',
    },
    {
      code: 'DDL01',
      title: 'Forgetting to index foreign key columns',
      cause: 'SQL Server does not automatically create indexes on FK columns. Without an index, deleting a parent row triggers a full child-table scan, causing blocking on large tables.',
      fix: 'Always create an index on FK columns separately after adding the FK constraint.',
      example: `-- FK without index — delete from Customers triggers full scan of Orders
ALTER TABLE Orders ADD CONSTRAINT FK_Ord_Cust
    FOREIGN KEY (CustomerID) REFERENCES Customers (CustomerID);
-- No index created!`,
      solution: `ALTER TABLE Orders ADD CONSTRAINT FK_Ord_Cust
    FOREIGN KEY (CustomerID) REFERENCES Customers (CustomerID);

-- Always add the index separately
CREATE INDEX IX_Orders_CustomerID ON Orders (CustomerID);`,
      tag: 'ddl',
    },
    {
      code: 'TYP01',
      title: 'Using FLOAT for monetary values causes rounding errors',
      cause: 'FLOAT uses binary floating-point representation. Base-10 fractions like 0.1 cannot be represented exactly, causing subtle rounding errors in financial calculations.',
      fix: 'Use DECIMAL(p, s) or NUMERIC(p, s) for monetary values.',
      example: `-- BUG: FLOAT rounding
DECLARE @price FLOAT = 0.1 + 0.2;
SELECT @price;  -- may return 0.30000000000000004`,
      solution: `-- CORRECT: DECIMAL is exact
DECLARE @price DECIMAL(10, 4) = 0.1 + 0.2;
SELECT @price;  -- returns 0.3000

-- Table column
CREATE TABLE Products (
    UnitPrice DECIMAL(10, 2) NOT NULL  -- not FLOAT or REAL
);`,
      tag: 'types',
    },
    {
      code: 'NULL03',
      title: 'AVG ignores NULLs — result is misleading for sparse columns',
      cause: 'AVG divides the sum by the count of non-NULL values. If most rows are NULL, the average reflects only the non-NULL minority — often not what is intended.',
      fix: 'Use COALESCE to treat NULLs as zero before averaging, or document the NULL-exclusion behaviour.',
      example: `-- Employees table: 8 rows have NULL bonus, 2 rows have bonus = 1000
SELECT AVG(Bonus) AS AvgBonus FROM Employees;
-- Returns 1000, not 200 — NULLs excluded from the count`,
      solution: `-- Average treating NULL as zero
SELECT AVG(COALESCE(Bonus, 0)) AS AvgBonus FROM Employees;  -- returns 200

-- Or explicitly document intent
SELECT
    COUNT(Bonus) AS EmployeesWithBonus,
    AVG(Bonus)   AS AvgAmongThoseWithBonus
FROM Employees;`,
      tag: 'nulls',
    },
    {
      code: 'IDX03',
      title: 'Key Lookup in execution plan — non-covering index',
      cause: 'The query uses a non-clustered index for the seek but needs additional columns not included in the index. The engine performs a Key Lookup for each matching row — expensive on large result sets.',
      fix: 'Add the needed columns to the index using the INCLUDE clause.',
      example: `-- Index only on CustomerID; SELECT also needs Freight and ShipCity
CREATE INDEX IX_Orders_Cust ON Orders (CustomerID);

SELECT CustomerID, Freight, ShipCity
FROM Orders WHERE CustomerID = 42;
-- Plan shows: Index Seek + Key Lookup (expensive)`,
      solution: `-- Covering index: INCLUDE the extra SELECT columns
CREATE INDEX IX_Orders_Cust ON Orders (CustomerID)
    INCLUDE (Freight, ShipCity);

-- Plan now shows: Index Seek only — no Key Lookup`,
      tag: 'indexes',
    },
  ];

  filtered = computed(() => {
    const tag = this.activeTag();
    return tag === 'all' ? this.errors : this.errors.filter(e => e.tag === tag);
  });

  expanded = new Set<string>();
  toggle(code: string) {
    this.expanded.has(code) ? this.expanded.delete(code) : this.expanded.add(code);
  }
  isOpen(code: string) { return this.expanded.has(code); }
}
