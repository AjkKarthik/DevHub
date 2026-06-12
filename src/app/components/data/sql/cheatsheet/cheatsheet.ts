import { Component, signal, computed } from '@angular/core';

type SqSection = 'queries' | 'joins' | 'aggregates' | 'window' | 'ddl' | 'dml' | 'cli';
interface CheatEntry { name: string; desc: string; example: string; tag?: string; }

@Component({
  selector: 'app-sql-cheatsheet',
  standalone: true,
  imports: [],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class SqlCheatsheet {
  active     = signal<SqSection>('queries');
  searchTerm = signal('');

  sections: { key: SqSection; label: string; icon: string }[] = [
    { key: 'queries',    label: 'SELECT / WHERE', icon: '🔍' },
    { key: 'joins',      label: 'Joins',           icon: '🔗' },
    { key: 'aggregates', label: 'Aggregates',      icon: '📊' },
    { key: 'window',     label: 'Window Fns',      icon: '🪟' },
    { key: 'ddl',        label: 'DDL',             icon: '🏗️' },
    { key: 'dml',        label: 'DML',             icon: '✏️' },
    { key: 'cli',        label: 'CLI / Tools',     icon: '💻' },
  ];

  queryEntries: CheatEntry[] = [
    { name: 'SELECT col1, col2', desc: 'Returns specified columns; * selects all', example: "SELECT ProductName, UnitPrice FROM Products;" },
    { name: 'SELECT DISTINCT',   desc: 'Removes duplicate rows across all selected columns', example: "SELECT DISTINCT CategoryID FROM Products;" },
    { name: 'WHERE',             desc: 'Filters rows; evaluated before GROUP BY and SELECT', example: "SELECT * FROM Products WHERE UnitPrice > 10 AND Discontinued = 0;" },
    { name: 'BETWEEN … AND',     desc: 'Inclusive range — equivalent to >= AND <=', example: "WHERE OrderDate BETWEEN '2024-01-01' AND '2024-12-31'" },
    { name: 'IN (…)',            desc: 'Matches any value in a list or subquery', example: "WHERE CategoryID IN (1, 2, 4)" },
    { name: 'NOT IN (…)',        desc: 'Watch out: returns no rows if the list contains NULL', example: "WHERE ProductID NOT IN (SELECT ProductID FROM Discontinued WHERE DiscDate IS NOT NULL)" },
    { name: 'LIKE',              desc: '% = any chars, _ = one char; leading % prevents index seek', example: "WHERE CompanyName LIKE 'A%'" },
    { name: 'IS NULL / IS NOT NULL', desc: 'NULL cannot be compared with = or <>; always use IS NULL', example: "WHERE ShippedDate IS NULL" },
    { name: 'ORDER BY … ASC|DESC', desc: 'Sorts final result; multiple columns separated by commas', example: "ORDER BY UnitPrice DESC, ProductName ASC" },
    { name: 'TOP N (MSSQL)',     desc: 'Returns first N rows; must use ORDER BY to be deterministic', example: "SELECT TOP 10 * FROM Products ORDER BY UnitPrice DESC;" },
    { name: 'LIMIT N OFFSET M (PG)', desc: 'PostgreSQL / MySQL pagination', example: "SELECT * FROM Products ORDER BY ProductID LIMIT 10 OFFSET 20;" },
    { name: 'OFFSET-FETCH (MSSQL)', desc: 'Standard SQL pagination syntax (MSSQL 2012+)', example: "ORDER BY ProductID OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY" },
    { name: 'COALESCE(a, b)',    desc: 'Returns first non-NULL argument; ANSI standard', example: "SELECT COALESCE(ShipCity, 'Unknown') FROM Orders;" },
    { name: 'NULLIF(a, b)',      desc: 'Returns NULL when a = b; use to avoid division-by-zero', example: "SELECT Total / NULLIF(Count, 0) AS Avg FROM Stats;" },
    { name: 'CASE WHEN … THEN … ELSE … END', desc: 'Conditional expression; use inline for derived columns', example: "SELECT CASE WHEN UnitPrice > 50 THEN 'Premium' ELSE 'Standard' END AS Tier FROM Products;" },
    { name: 'CAST(val AS type)', desc: 'ANSI type conversion; prefer over CONVERT for portability', example: "SELECT CAST('2024-01-01' AS DATE), CAST(UnitPrice AS VARCHAR(20)) FROM Products;" },
  ];

  joinEntries: CheatEntry[] = [
    { name: 'INNER JOIN … ON …', desc: 'Returns only rows matching in both tables', example: "SELECT o.OrderID, c.CompanyName\nFROM Orders o\nINNER JOIN Customers c ON o.CustomerID = c.CustomerID;" },
    { name: 'LEFT JOIN',         desc: 'All rows from left table; NULLs for unmatched right rows', example: "SELECT c.CompanyName, o.OrderID\nFROM Customers c\nLEFT JOIN Orders o ON c.CustomerID = o.CustomerID;" },
    { name: 'Anti-join pattern', desc: 'Find left rows with no match in right table', example: "SELECT c.* FROM Customers c\nLEFT JOIN Orders o ON c.CustomerID = o.CustomerID\nWHERE o.OrderID IS NULL;" },
    { name: 'FULL OUTER JOIN',   desc: 'All rows from both tables; NULLs where no match', example: "SELECT c.CustomerID, o.OrderID\nFROM Customers c\nFULL OUTER JOIN Orders o ON c.CustomerID = o.CustomerID;" },
    { name: 'CROSS JOIN',        desc: 'Cartesian product — every row of A × every row of B', example: "SELECT s.Size, c.Color\nFROM Sizes s\nCROSS JOIN Colors c;" },
    { name: 'Self-join',         desc: 'Join table to itself with different aliases', example: "SELECT e.LastName AS Employee, m.LastName AS Manager\nFROM Employees e\nLEFT JOIN Employees m ON e.ReportsTo = m.EmployeeID;" },
    { name: 'ON vs WHERE in LEFT JOIN', desc: 'ON conditions keep left rows; WHERE on right col turns LEFT into INNER', example: "-- Correct: filter LEFT JOIN result\nLEFT JOIN Orders o ON c.CustomerID = o.CustomerID\nWHERE c.Country = 'Germany'  -- filters left table, OK" },
    { name: 'Composite join key', desc: 'Join on multiple columns using AND', example: "ON a.OrderID = b.OrderID AND a.ProductID = b.ProductID" },
  ];

  aggregateEntries: CheatEntry[] = [
    { name: 'COUNT(*)',          desc: 'Counts all rows including NULLs', example: "SELECT CategoryID, COUNT(*) AS Total FROM Products GROUP BY CategoryID;" },
    { name: 'COUNT(col)',        desc: 'Counts non-NULL values in column', example: "SELECT COUNT(ShippedDate) AS ShippedOrders FROM Orders;" },
    { name: 'SUM / AVG / MIN / MAX', desc: 'Aggregate over non-NULL values; ignore NULLs', example: "SELECT CategoryID, SUM(UnitPrice) AS Total, AVG(UnitPrice) AS Avg FROM Products GROUP BY CategoryID;" },
    { name: 'GROUP BY',          desc: 'Every non-aggregate SELECT col must be in GROUP BY (standard SQL)', example: "SELECT CategoryID, COUNT(*) FROM Products GROUP BY CategoryID;" },
    { name: 'HAVING',            desc: 'Filters groups after aggregation; WHERE cannot use aggregates', example: "SELECT CustomerID, COUNT(*) AS Orders\nFROM Orders\nGROUP BY CustomerID\nHAVING COUNT(*) > 5;" },
    { name: 'GROUP BY ROLLUP',   desc: 'Adds subtotal rows per group + grand total', example: "SELECT Country, City, COUNT(*) FROM Customers GROUP BY ROLLUP(Country, City);" },
    { name: 'GROUPING(col)',      desc: 'Returns 1 for ROLLUP/CUBE subtotal NULLs vs real data NULLs', example: "SELECT CASE WHEN GROUPING(City)=1 THEN 'All Cities' ELSE City END AS City FROM ..." },
    { name: 'Conditional aggregate', desc: 'CASE inside aggregate for pivot-style totals', example: "SELECT COUNT(CASE WHEN Status='Active' THEN 1 END) AS ActiveCount FROM Employees;" },
    { name: 'FILTER (PG)',       desc: 'PostgreSQL conditional aggregate syntax', example: "SELECT COUNT(*) FILTER (WHERE Status = 'Active') AS Active FROM Employees;" },
  ];

  windowEntries: CheatEntry[] = [
    { name: 'func OVER ()',       desc: 'Window over all rows; no PARTITION or ORDER', example: "SELECT ProductName, UnitPrice, AVG(UnitPrice) OVER () AS OverallAvg FROM Products;" },
    { name: 'PARTITION BY',      desc: 'Divides rows into groups; function resets per partition', example: "SUM(Revenue) OVER (PARTITION BY DeptID)" },
    { name: 'ROW_NUMBER()',       desc: 'Unique sequential integer; no ties', example: "ROW_NUMBER() OVER (PARTITION BY Email ORDER BY CustomerID)" },
    { name: 'RANK()',             desc: 'Ties get same rank; gaps after ties (1,2,2,4)', example: "RANK() OVER (ORDER BY Salary DESC)" },
    { name: 'DENSE_RANK()',       desc: 'Ties get same rank; no gaps (1,2,2,3)', example: "DENSE_RANK() OVER (PARTITION BY DeptID ORDER BY Salary DESC)" },
    { name: 'NTILE(n)',          desc: 'Distributes rows into n equal-ish buckets', example: "NTILE(4) OVER (ORDER BY Salary) AS Quartile" },
    { name: 'LAG(col, n, def)',  desc: 'Value n rows before current row; def if no prior row', example: "LAG(Revenue, 1, 0) OVER (ORDER BY Month) AS PrevRevenue" },
    { name: 'LEAD(col, n, def)', desc: 'Value n rows after current row', example: "LEAD(OrderDate) OVER (PARTITION BY CustomerID ORDER BY OrderDate) AS NextOrder" },
    { name: 'FIRST_VALUE(col)',  desc: 'First value in current window frame', example: "FIRST_VALUE(Salary) OVER (PARTITION BY DeptID ORDER BY HireDate)" },
    { name: 'LAST_VALUE(col)',   desc: 'Last value — add ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING for correct results', example: "LAST_VALUE(Salary) OVER (PARTITION BY DeptID ORDER BY HireDate ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)" },
    { name: 'Running total',     desc: 'SUM with ORDER BY in OVER() — cumulative aggregate', example: "SUM(Revenue) OVER (PARTITION BY Year ORDER BY Month ROWS UNBOUNDED PRECEDING)" },
  ];

  ddlEntries: CheatEntry[] = [
    { name: 'CREATE TABLE',      desc: 'Define a new table with columns and constraints', example: "CREATE TABLE Products (\n    ProductID   INT           NOT NULL IDENTITY(1,1),\n    ProductName NVARCHAR(200) NOT NULL,\n    UnitPrice   DECIMAL(10,2) NOT NULL CHECK (UnitPrice > 0),\n    CONSTRAINT PK_Products PRIMARY KEY (ProductID)\n);" },
    { name: 'ALTER TABLE ADD COLUMN', desc: 'Add a new column to an existing table', example: "ALTER TABLE Products ADD IsActive BIT NOT NULL DEFAULT 1;" },
    { name: 'ALTER TABLE ADD CONSTRAINT', desc: 'Add FK, UNIQUE, or CHECK after table creation', example: "ALTER TABLE Orders ADD CONSTRAINT FK_Ord_Cust\n    FOREIGN KEY (CustomerID) REFERENCES Customers (CustomerID);" },
    { name: 'ALTER TABLE DROP CONSTRAINT', desc: 'Remove a named constraint', example: "ALTER TABLE Products DROP CONSTRAINT CHK_Price;" },
    { name: 'CREATE INDEX',      desc: 'Create non-clustered index; INCLUDE for covering', example: "CREATE INDEX IX_Orders_Cust ON Orders (CustomerID)\n    INCLUDE (OrderDate, Freight);" },
    { name: 'Filtered index',    desc: 'Index only a subset of rows using WHERE', example: "CREATE INDEX IX_Active ON Products (CategoryID)\n    WHERE Discontinued = 0;" },
    { name: 'DROP TABLE',        desc: 'Permanently removes table and all data', example: "DROP TABLE IF EXISTS TempOrders;" },
    { name: 'TRUNCATE TABLE',    desc: 'Removes all rows faster than DELETE; resets identity; not logged per-row', example: "TRUNCATE TABLE ImportStaging;" },
  ];

  dmlEntries: CheatEntry[] = [
    { name: 'INSERT INTO … VALUES', desc: 'Insert one or more rows with explicit values', example: "INSERT INTO Orders (CustomerID, OrderDate)\nVALUES (42, SYSUTCDATETIME());" },
    { name: 'INSERT INTO … SELECT', desc: 'Insert rows from a query result', example: "INSERT INTO ArchiveOrders\nSELECT * FROM Orders WHERE OrderDate < '2020-01-01';" },
    { name: 'UPDATE … SET … WHERE', desc: 'Modify existing rows matching the WHERE condition', example: "UPDATE Products\nSET UnitPrice = UnitPrice * 1.10\nWHERE CategoryID = 1;" },
    { name: 'DELETE … WHERE',    desc: 'Remove rows matching the condition; omit WHERE = delete all rows (still logged)', example: "DELETE FROM Orders WHERE OrderDate < '2020-01-01';" },
    { name: 'MERGE (UPSERT)',    desc: 'Insert if not matched, update if matched, delete if not matched in source', example: "MERGE Products AS target\nUSING NewProducts AS source ON target.SKU = source.SKU\nWHEN MATCHED THEN UPDATE SET target.UnitPrice = source.UnitPrice\nWHEN NOT MATCHED THEN INSERT (SKU, UnitPrice) VALUES (source.SKU, source.UnitPrice);" },
    { name: 'OUTPUT clause',     desc: 'Capture inserted/updated/deleted rows in a DML statement', example: "DELETE FROM Orders\nOUTPUT deleted.OrderID, deleted.CustomerID\nWHERE OrderDate < '2020-01-01';" },
    { name: 'CTE in UPDATE/DELETE', desc: 'Use a CTE to make UPDATE/DELETE more readable', example: "WITH Dups AS (\n    SELECT *, ROW_NUMBER() OVER (PARTITION BY Email ORDER BY ID) AS rn\n    FROM Customers\n)\nDELETE FROM Dups WHERE rn > 1;" },
    { name: 'SCOPE_IDENTITY()',  desc: 'Returns last identity value inserted in current scope', example: "INSERT INTO Orders (CustomerID) VALUES (42);\nSELECT SCOPE_IDENTITY() AS NewOrderID;" },
  ];

  cliEntries: CheatEntry[] = [
    { name: 'sqlcmd -S server -d db -U user -P pwd', desc: 'Connect to SQL Server via CLI', example: "sqlcmd -S localhost -d Northwind -U sa -P 'Password123'" },
    { name: 'sqlcmd -i script.sql',   desc: 'Run a SQL script file', example: "sqlcmd -S localhost -d Northwind -i create_schema.sql" },
    { name: 'psql -h host -U user -d db', desc: 'Connect to PostgreSQL via psql CLI', example: "psql -h localhost -U postgres -d northwind" },
    { name: '\\dt (psql)',            desc: 'List all tables in current schema', example: "\\dt" },
    { name: '\\d tablename (psql)',   desc: 'Describe table structure (columns, constraints, indexes)', example: "\\d orders" },
    { name: '\\i script.sql (psql)', desc: 'Execute a SQL file', example: "\\i /path/to/schema.sql" },
    { name: 'EXPLAIN (psql)',        desc: 'Show query plan', example: "EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 1;" },
    { name: 'SET STATISTICS IO ON (MSSQL)', desc: 'Show logical read counts per table after query', example: "SET STATISTICS IO, TIME ON;\nSELECT * FROM Orders WHERE CustomerID = 42;\nSET STATISTICS IO, TIME OFF;" },
  ];

  allEntries = computed(() => ({
    queries: this.queryEntries,
    joins:   this.joinEntries,
    aggregates: this.aggregateEntries,
    window:  this.windowEntries,
    ddl:     this.ddlEntries,
    dml:     this.dmlEntries,
    cli:     this.cliEntries,
  }));

  activeEntries = computed(() => {
    const raw = this.allEntries()[this.active()];
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return raw;
    return raw.filter(e =>
      e.name.toLowerCase().includes(term) ||
      e.desc.toLowerCase().includes(term) ||
      e.example.toLowerCase().includes(term)
    );
  });
}
