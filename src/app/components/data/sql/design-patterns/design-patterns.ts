import { Component } from '@angular/core';

interface SqlPattern { icon: string; name: string; desc: string; code: string; }

@Component({
  selector: 'app-sql-design-patterns',
  standalone: true,
  imports: [],
  templateUrl: './design-patterns.html',
  styleUrl: './design-patterns.scss',
})
export class SqlDesignPatterns {
  expanded = new Set<number>();
  toggle(i: number) { this.expanded.has(i) ? this.expanded.delete(i) : this.expanded.add(i); }
  isOpen(i: number) { return this.expanded.has(i); }

  patterns: SqlPattern[] = [
    {
      icon: '🗑️', name: 'Soft Delete',
      desc: 'Mark rows as deleted without physically removing them. Preserves history and allows recovery. Add an IsDeleted flag and filter it in every query (or use a view/RLS).',
      code: `ALTER TABLE Orders ADD IsDeleted BIT NOT NULL DEFAULT 0;
ALTER TABLE Orders ADD DeletedAt DATETIME2 NULL;
ALTER TABLE Orders ADD DeletedBy INT NULL;

-- Soft delete
UPDATE Orders SET IsDeleted = 1, DeletedAt = SYSUTCDATETIME(), DeletedBy = @UserID
WHERE OrderID = @OrderID;

-- Filtered view — exclude deleted rows
CREATE VIEW ActiveOrders AS
SELECT * FROM Orders WHERE IsDeleted = 0;

-- Filtered index — keeps the index lean
CREATE INDEX IX_Orders_Active ON Orders (CustomerID, OrderDate)
WHERE IsDeleted = 0;`,
    },
    {
      icon: '📋', name: 'Audit Trail',
      desc: 'Track every INSERT, UPDATE, and DELETE on a table. Store old values, new values, who changed what, and when. Use a trigger or application-layer writes to an audit table.',
      code: `CREATE TABLE OrdersAudit (
    AuditID    BIGINT       NOT NULL IDENTITY(1,1) PRIMARY KEY,
    OrderID    BIGINT       NOT NULL,
    Action     VARCHAR(10)  NOT NULL,  -- INSERT / UPDATE / DELETE
    ChangedAt  DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    ChangedBy  INT          NULL,
    OldStatus  VARCHAR(20)  NULL,
    NewStatus  VARCHAR(20)  NULL
);

-- Trigger on Orders
CREATE TRIGGER trg_Orders_Audit ON Orders
AFTER UPDATE AS
BEGIN
    INSERT INTO OrdersAudit (OrderID, Action, OldStatus, NewStatus)
    SELECT i.OrderID, 'UPDATE', d.Status, i.Status
    FROM inserted i JOIN deleted d ON i.OrderID = d.OrderID
    WHERE i.Status <> d.Status;
END;`,
    },
    {
      icon: '🕐', name: 'Temporal / Versioning',
      desc: 'Store the full history of row changes with valid-from and valid-to dates. Query the state at any point in time. SQL Server 2016+ has built-in system-versioned temporal tables.',
      code: `-- SQL Server system-versioned temporal table
CREATE TABLE Products (
    ProductID   INT          NOT NULL PRIMARY KEY,
    ProductName NVARCHAR(200) NOT NULL,
    UnitPrice   DECIMAL(10,2) NOT NULL,
    ValidFrom   DATETIME2 GENERATED ALWAYS AS ROW START,
    ValidTo     DATETIME2 GENERATED ALWAYS AS ROW END,
    PERIOD FOR SYSTEM_TIME (ValidFrom, ValidTo)
) WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.ProductsHistory));

-- Query current state
SELECT * FROM Products;

-- Query state at a point in time
SELECT * FROM Products
FOR SYSTEM_TIME AS OF '2023-06-01 12:00:00';

-- Query all versions of a product
SELECT * FROM Products
FOR SYSTEM_TIME ALL
WHERE ProductID = 5
ORDER BY ValidFrom;`,
    },
    {
      icon: '🌳', name: 'Adjacency List (Hierarchy)',
      desc: 'Store parent-child relationships with a self-referencing foreign key. Simple to write; requires a recursive CTE to traverse. Best for trees where depth is unpredictable.',
      code: `CREATE TABLE Categories (
    CategoryID   INT          NOT NULL PRIMARY KEY,
    CategoryName NVARCHAR(200) NOT NULL,
    ParentID     INT          NULL REFERENCES Categories (CategoryID)
);

-- Recursive CTE: full sub-tree under CategoryID 3
WITH Tree AS (
    SELECT CategoryID, CategoryName, ParentID, 0 AS Depth
    FROM Categories WHERE CategoryID = 3
    UNION ALL
    SELECT c.CategoryID, c.CategoryName, c.ParentID, t.Depth + 1
    FROM Categories c JOIN Tree t ON c.ParentID = t.CategoryID
)
SELECT * FROM Tree ORDER BY Depth, CategoryName
OPTION (MAXRECURSION 50);`,
    },
    {
      icon: '🔗', name: 'Many-to-Many Junction Table',
      desc: 'Model a many-to-many relationship between two entities using a junction (bridge) table. The junction table holds foreign keys to both sides and may carry additional attributes.',
      code: `-- Students ↔ Courses (many-to-many)
CREATE TABLE Enrollments (
    StudentID  INT          NOT NULL,
    CourseID   INT          NOT NULL,
    EnrolledAt DATE         NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    Grade      DECIMAL(4,1) NULL,
    CONSTRAINT PK_Enroll    PRIMARY KEY (StudentID, CourseID),
    CONSTRAINT FK_Enroll_S  FOREIGN KEY (StudentID) REFERENCES Students (StudentID),
    CONSTRAINT FK_Enroll_C  FOREIGN KEY (CourseID)  REFERENCES Courses  (CourseID)
);
-- Additional index on the second FK for reverse lookups
CREATE INDEX IX_Enroll_CourseID ON Enrollments (CourseID);`,
    },
    {
      icon: '📊', name: 'Lookup / Reference Table',
      desc: 'Replace magic values with a keyed lookup table. Provides referential integrity, a readable description, and a single place to add or change values.',
      code: `CREATE TABLE OrderStatuses (
    StatusCode  VARCHAR(20)   NOT NULL PRIMARY KEY,
    Description NVARCHAR(100) NOT NULL,
    IsTerminal  BIT           NOT NULL DEFAULT 0
);
INSERT INTO OrderStatuses VALUES
('Pending',   'Order received, not yet shipped', 0),
('Shipped',   'Package in transit',               0),
('Delivered', 'Package delivered',                1),
('Cancelled', 'Cancelled by customer or admin',  1);

-- FK reference ensures only valid statuses can be used
ALTER TABLE Orders ADD CONSTRAINT FK_Ord_Status
    FOREIGN KEY (Status) REFERENCES OrderStatuses (StatusCode);`,
    },
    {
      icon: '📄', name: 'Pagination with Total Count',
      desc: 'Return a page of results and the total matching row count in a single round-trip using a CTE or window function. Avoids a second COUNT(*) query.',
      code: `-- CTE-based pagination with total count
WITH Paged AS (
    SELECT
        ProductID, ProductName, UnitPrice,
        COUNT(*) OVER () AS TotalRows
    FROM Products
    WHERE CategoryID = @CategoryID
)
SELECT *
FROM Paged
ORDER BY UnitPrice DESC
OFFSET (@Page - 1) * @PageSize ROWS
FETCH NEXT @PageSize ROWS ONLY;
-- TotalRows column is included in every row of the result`,
    },
    {
      icon: '🔢', name: 'Sequence / HiLo ID Generation',
      desc: 'Use a database sequence for IDs instead of IDENTITY when you need to pre-allocate IDs in batches (HiLo pattern in ORMs) or share a sequence across multiple tables.',
      code: `-- SQL Server sequence
CREATE SEQUENCE dbo.OrderSeq
    START WITH 1
    INCREMENT BY 1
    CACHE 50;            -- pre-allocate 50 values for performance

-- Use in INSERT
INSERT INTO Orders (OrderID, CustomerID)
VALUES (NEXT VALUE FOR dbo.OrderSeq, @CustomerID);

-- PostgreSQL: SERIAL or BIGSERIAL (implicit sequence)
-- Or explicit:
CREATE SEQUENCE order_seq START WITH 1 INCREMENT BY 1;
INSERT INTO orders (order_id, customer_id)
VALUES (NEXTVAL('order_seq'), $1);`,
    },
    {
      icon: '🏷️', name: 'Tag / Label System (EAV lite)',
      desc: 'Add flexible tagging to any entity without schema changes. Use a normalised Tags table and a junction table instead of storing comma-separated tags in a column.',
      code: `CREATE TABLE Tags (
    TagID   INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    TagName NVARCHAR(100) NOT NULL,
    CONSTRAINT UQ_Tags_Name UNIQUE (TagName)
);

CREATE TABLE ProductTags (
    ProductID INT NOT NULL,
    TagID     INT NOT NULL,
    CONSTRAINT PK_ProductTags PRIMARY KEY (ProductID, TagID),
    CONSTRAINT FK_PT_Product  FOREIGN KEY (ProductID) REFERENCES Products (ProductID) ON DELETE CASCADE,
    CONSTRAINT FK_PT_Tag      FOREIGN KEY (TagID)     REFERENCES Tags (TagID)
);

-- Find all products tagged 'on-sale'
SELECT p.ProductName
FROM Products p
JOIN ProductTags pt ON p.ProductID = pt.ProductID
JOIN Tags        t  ON pt.TagID    = t.TagID
WHERE t.TagName = 'on-sale';`,
    },
    {
      icon: '🔒', name: 'Row-Level Security (RLS)',
      desc: 'Restrict which rows a user can see or modify based on a security predicate, enforced at the database engine level — transparent to the application.',
      code: `-- PostgreSQL Row-Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: each user sees only their own orders
CREATE POLICY orders_owner_policy ON orders
    USING (customer_id = current_setting('app.current_user_id')::INT);

-- SQL Server RLS
CREATE FUNCTION dbo.fn_OrderFilter(@CustomerID INT)
RETURNS TABLE WITH SCHEMABINDING AS
RETURN SELECT 1 AS result
WHERE @CustomerID = CAST(SESSION_CONTEXT(N'CustomerID') AS INT);

CREATE SECURITY POLICY dbo.OrderPolicy
    ADD FILTER PREDICATE dbo.fn_OrderFilter(CustomerID) ON dbo.Orders
    WITH (STATE = ON);`,
    },
    {
      icon: '📦', name: 'Upsert (MERGE / INSERT ON CONFLICT)',
      desc: 'Insert a row if it does not exist; update it if it does. Avoids separate SELECT + INSERT/UPDATE round-trips and race conditions.',
      code: `-- SQL Server MERGE (upsert)
MERGE Products AS target
USING (VALUES (@SKU, @Name, @Price)) AS source (SKU, Name, Price)
    ON target.SKU = source.SKU
WHEN MATCHED THEN
    UPDATE SET target.UnitPrice = source.Price
WHEN NOT MATCHED THEN
    INSERT (SKU, ProductName, UnitPrice) VALUES (source.SKU, source.Name, source.Price);

-- PostgreSQL INSERT … ON CONFLICT
INSERT INTO products (sku, product_name, unit_price)
VALUES ($1, $2, $3)
ON CONFLICT (sku)
DO UPDATE SET
    product_name = EXCLUDED.product_name,
    unit_price   = EXCLUDED.unit_price;`,
    },
    {
      icon: '🪣', name: 'Partitioning by Date Range',
      desc: 'Split a large table into smaller partitions by date. Older partitions can be archived or stored on cheaper storage; queries filtered by date touch only relevant partitions.',
      code: `-- SQL Server table partitioning (simplified)
-- Step 1: partition function
CREATE PARTITION FUNCTION pfOrderDate (DATE)
AS RANGE RIGHT FOR VALUES ('2022-01-01','2023-01-01','2024-01-01');

-- Step 2: partition scheme
CREATE PARTITION SCHEME psOrderDate
AS PARTITION pfOrderDate ALL TO ([PRIMARY]);

-- Step 3: partitioned table
CREATE TABLE Orders (
    OrderID   BIGINT NOT NULL,
    OrderDate DATE   NOT NULL,
    ...
) ON psOrderDate (OrderDate);

-- PostgreSQL declarative partitioning
CREATE TABLE orders (order_id BIGINT, order_date DATE, ...) PARTITION BY RANGE (order_date);
CREATE TABLE orders_2024 PARTITION OF orders FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');`,
    },
  ];
}
