import { Component } from '@angular/core';

interface ProjectSection { title: string; code: string; }
interface MiniProject { badge: string; title: string; desc: string; steps: string[]; sections: ProjectSection[]; }

@Component({
  selector: 'app-sql-mini-projects',
  standalone: true,
  imports: [],
  templateUrl: './mini-projects.html',
  styleUrl: './mini-projects.scss',
})
export class SqlMiniProjects {
  projects: MiniProject[] = [
    {
      badge: 'E-Commerce',
      title: 'Order Management Schema',
      desc: 'Build a normalised schema for an online store — customers, products, categories, orders, and order lines.',
      steps: ['Create Customers and Categories tables', 'Create Products with FK to Categories', 'Create Orders with FK to Customers', 'Create OrderLines junction table', 'Add indexes on all FK columns', 'Write a revenue-by-category report query'],
      sections: [
        {
          title: 'Schema',
          code: `CREATE TABLE Customers (
    CustomerID  INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    Email       NVARCHAR(254) NOT NULL,
    FullName    NVARCHAR(200) NOT NULL,
    Country     NVARCHAR(100) NULL,
    CreatedAt   DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_Cust_Email UNIQUE (Email)
);

CREATE TABLE Categories (
    CategoryID   INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL
);

CREATE TABLE Products (
    ProductID   INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    CategoryID  INT            NOT NULL REFERENCES Categories(CategoryID),
    ProductName NVARCHAR(200)  NOT NULL,
    UnitPrice   DECIMAL(10,2)  NOT NULL CHECK (UnitPrice > 0),
    Stock       INT            NOT NULL DEFAULT 0 CHECK (Stock >= 0)
);
CREATE INDEX IX_Products_Cat ON Products(CategoryID);

CREATE TABLE Orders (
    OrderID    BIGINT       NOT NULL IDENTITY(1,1) PRIMARY KEY,
    CustomerID INT          NOT NULL REFERENCES Customers(CustomerID),
    OrderDate  DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    Status     VARCHAR(20)  NOT NULL DEFAULT 'Pending'
);
CREATE INDEX IX_Orders_Cust ON Orders(CustomerID);

CREATE TABLE OrderLines (
    OrderID   BIGINT         NOT NULL REFERENCES Orders(OrderID),
    ProductID INT            NOT NULL REFERENCES Products(ProductID),
    Qty       INT            NOT NULL CHECK (Qty > 0),
    Price     DECIMAL(10,2)  NOT NULL,
    CONSTRAINT PK_OL PRIMARY KEY (OrderID, ProductID)
);`,
        },
        {
          title: 'Report queries',
          code: `-- Revenue by category this year
SELECT
    c.CategoryName,
    COUNT(DISTINCT o.OrderID)                  AS Orders,
    SUM(ol.Qty * ol.Price)                     AS Revenue,
    RANK() OVER (ORDER BY SUM(ol.Qty*ol.Price) DESC) AS RevenueRank
FROM OrderLines ol
JOIN Orders   o  ON ol.OrderID   = o.OrderID
JOIN Products p  ON ol.ProductID = p.ProductID
JOIN Categories c ON p.CategoryID = c.CategoryID
WHERE o.OrderDate >= DATEFROMPARTS(YEAR(GETDATE()), 1, 1)
GROUP BY c.CategoryID, c.CategoryName
ORDER BY Revenue DESC;`,
        },
      ],
    },
    {
      badge: 'Analytics',
      title: 'Web Analytics Event Log',
      desc: 'Store clickstream events in a partitioned event log and write daily/weekly aggregation queries.',
      steps: ['Create Pages lookup table', 'Create Events table with JSON payload column', 'Index event_type and page_id', 'Write daily active user query', 'Write session funnel query', 'Write top pages report with window functions'],
      sections: [
        {
          title: 'Schema',
          code: `CREATE TABLE Pages (
    PageID   INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    PagePath NVARCHAR(500) NOT NULL,
    CONSTRAINT UQ_Pages_Path UNIQUE (PagePath)
);

CREATE TABLE Events (
    EventID    BIGINT       NOT NULL IDENTITY(1,1) PRIMARY KEY,
    UserID     INT          NOT NULL,
    PageID     INT          NULL REFERENCES Pages(PageID),
    EventType  VARCHAR(50)  NOT NULL,  -- pageview, click, signup, purchase
    OccurredAt DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    Properties NVARCHAR(MAX) NULL CHECK (Properties IS NULL OR ISJSON(Properties) = 1)
);
CREATE INDEX IX_Events_User    ON Events(UserID, OccurredAt);
CREATE INDEX IX_Events_Type    ON Events(EventType, OccurredAt);
CREATE INDEX IX_Events_Page    ON Events(PageID, OccurredAt);`,
        },
        {
          title: 'Analysis queries',
          code: `-- Daily active users (last 30 days)
SELECT
    CAST(OccurredAt AS DATE) AS Day,
    COUNT(DISTINCT UserID)   AS DAU
FROM Events
WHERE OccurredAt >= DATEADD(DAY, -30, GETDATE())
  AND EventType = 'pageview'
GROUP BY CAST(OccurredAt AS DATE)
ORDER BY Day;

-- Top 10 pages this week with WoW comparison
WITH ThisWeek AS (
    SELECT PageID, COUNT(*) AS Views
    FROM Events
    WHERE OccurredAt >= DATEADD(DAY, -7, GETDATE()) AND EventType = 'pageview'
    GROUP BY PageID
),
LastWeek AS (
    SELECT PageID, COUNT(*) AS Views
    FROM Events
    WHERE OccurredAt >= DATEADD(DAY, -14, GETDATE())
      AND OccurredAt  < DATEADD(DAY, -7, GETDATE())
      AND EventType = 'pageview'
    GROUP BY PageID
)
SELECT TOP 10
    p.PagePath,
    t.Views   AS ThisWeek,
    l.Views   AS LastWeek,
    ROUND(100.0 * (t.Views - ISNULL(l.Views,0)) / NULLIF(l.Views,0), 1) AS PctChange
FROM ThisWeek t
JOIN Pages p ON t.PageID = p.PageID
LEFT JOIN LastWeek l ON t.PageID = l.PageID
ORDER BY t.Views DESC;`,
        },
      ],
    },
    {
      badge: 'HR System',
      title: 'Employee & Payroll Schema',
      desc: 'Model an employee directory with departments, job roles, salary history, and payroll runs.',
      steps: ['Create Departments and JobRoles tables', 'Create Employees with FK to both', 'Create SalaryHistory for versioned salaries', 'Create PayrollRuns and PayrollLines', 'Write org chart recursive CTE', 'Write payroll summary report'],
      sections: [
        {
          title: 'Schema',
          code: `CREATE TABLE Departments (
    DeptID   INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    DeptName NVARCHAR(100) NOT NULL
);

CREATE TABLE JobRoles (
    RoleID   INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(100) NOT NULL,
    MinSalary DECIMAL(10,2) NOT NULL,
    MaxSalary DECIMAL(10,2) NOT NULL
);

CREATE TABLE Employees (
    EmployeeID INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    DeptID     INT          NOT NULL REFERENCES Departments(DeptID),
    RoleID     INT          NOT NULL REFERENCES JobRoles(RoleID),
    ManagerID  INT          NULL     REFERENCES Employees(EmployeeID),
    FullName   NVARCHAR(200) NOT NULL,
    HireDate   DATE         NOT NULL
);
CREATE INDEX IX_Emp_Dept    ON Employees(DeptID);
CREATE INDEX IX_Emp_Manager ON Employees(ManagerID);

CREATE TABLE SalaryHistory (
    HistoryID  INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    EmployeeID INT          NOT NULL REFERENCES Employees(EmployeeID),
    Salary     DECIMAL(10,2) NOT NULL,
    EffectiveFrom DATE       NOT NULL,
    EffectiveTo   DATE       NULL
);`,
        },
        {
          title: 'Org chart + payroll',
          code: `-- Full org chart under manager EmployeeID 1
WITH OrgChart AS (
    SELECT EmployeeID, FullName, ManagerID, 0 AS Level
    FROM Employees WHERE ManagerID IS NULL
    UNION ALL
    SELECT e.EmployeeID, e.FullName, e.ManagerID, oc.Level + 1
    FROM Employees e JOIN OrgChart oc ON e.ManagerID = oc.EmployeeID
)
SELECT REPLICATE('  ', Level) + FullName AS OrgLine, Level
FROM OrgChart ORDER BY Level, FullName
OPTION (MAXRECURSION 20);

-- Current salary vs role band
SELECT
    e.FullName,
    jr.RoleName,
    sh.Salary,
    jr.MinSalary,
    jr.MaxSalary,
    CASE
        WHEN sh.Salary < jr.MinSalary THEN 'Below band'
        WHEN sh.Salary > jr.MaxSalary THEN 'Above band'
        ELSE 'In band'
    END AS BandStatus
FROM Employees e
JOIN JobRoles      jr ON e.RoleID = jr.RoleID
JOIN SalaryHistory sh ON e.EmployeeID = sh.EmployeeID AND sh.EffectiveTo IS NULL;`,
        },
      ],
    },
    {
      badge: 'Inventory',
      title: 'Warehouse Inventory System',
      desc: 'Track products across multiple warehouses with stock movements, low-stock alerts, and reorder reports.',
      steps: ['Create Warehouses and Products tables', 'Create Inventory (product × warehouse stock levels)', 'Create StockMovements audit log', 'Write low-stock alert query', 'Write stock movement history with running balance', 'Write reorder recommendation report'],
      sections: [
        {
          title: 'Schema',
          code: `CREATE TABLE Warehouses (
    WarehouseID  INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    WarehouseName NVARCHAR(100) NOT NULL,
    Location     NVARCHAR(200) NULL
);

CREATE TABLE Products (
    ProductID     INT            NOT NULL IDENTITY(1,1) PRIMARY KEY,
    SKU           VARCHAR(50)    NOT NULL,
    ProductName   NVARCHAR(200)  NOT NULL,
    ReorderLevel  INT            NOT NULL DEFAULT 10,
    CONSTRAINT UQ_Products_SKU UNIQUE (SKU)
);

CREATE TABLE Inventory (
    ProductID   INT NOT NULL REFERENCES Products(ProductID),
    WarehouseID INT NOT NULL REFERENCES Warehouses(WarehouseID),
    Quantity    INT NOT NULL DEFAULT 0 CHECK (Quantity >= 0),
    CONSTRAINT PK_Inv PRIMARY KEY (ProductID, WarehouseID)
);

CREATE TABLE StockMovements (
    MovementID  BIGINT       NOT NULL IDENTITY(1,1) PRIMARY KEY,
    ProductID   INT          NOT NULL REFERENCES Products(ProductID),
    WarehouseID INT          NOT NULL REFERENCES Warehouses(WarehouseID),
    Quantity    INT          NOT NULL,  -- positive = in, negative = out
    MovedAt     DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    Reason      VARCHAR(50)  NOT NULL
);`,
        },
        {
          title: 'Operational queries',
          code: `-- Low stock alert: products below reorder level in any warehouse
SELECT
    p.SKU, p.ProductName,
    w.WarehouseName,
    i.Quantity          AS CurrentStock,
    p.ReorderLevel      AS ReorderAt,
    p.ReorderLevel - i.Quantity AS ShortfallUnits
FROM Inventory i
JOIN Products   p ON i.ProductID   = p.ProductID
JOIN Warehouses w ON i.WarehouseID = w.WarehouseID
WHERE i.Quantity < p.ReorderLevel
ORDER BY ShortfallUnits DESC;

-- Running stock balance for ProductID 5, Warehouse 1
SELECT
    MovedAt,
    Quantity AS Movement,
    SUM(Quantity) OVER (
        ORDER BY MovedAt, MovementID
        ROWS UNBOUNDED PRECEDING
    ) AS RunningBalance,
    Reason
FROM StockMovements
WHERE ProductID = 5 AND WarehouseID = 1
ORDER BY MovedAt, MovementID;`,
        },
      ],
    },
  ];
}
