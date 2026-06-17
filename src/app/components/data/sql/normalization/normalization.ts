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
  selector: 'app-sql-normalization',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './normalization.html',
  styleUrl: './normalization.scss',
})
export class SqlNormalization {

  quickRef: QuickRefItem[] = [
    { name: '1NF',                    type: 'keyword', desc: 'First Normal Form: atomic values, no repeating groups, each row uniquely identified by a PK' },
    { name: '2NF',                    type: 'keyword', desc: 'Second Normal Form: in 1NF AND every non-key column depends on the WHOLE primary key (no partial dependencies)' },
    { name: '3NF',                    type: 'keyword', desc: 'Third Normal Form: in 2NF AND no transitive dependencies (non-key columns depend only on the PK, not on other non-key columns)' },
    { name: 'BCNF',                   type: 'keyword', desc: 'Boyce-Codd Normal Form: stricter than 3NF — every determinant must be a candidate key; handles overlapping composite keys' },
    { name: '4NF',                    type: 'keyword', desc: 'Fourth Normal Form: no multi-valued dependencies — independent facts about an entity must be in separate tables' },
    { name: 'Functional Dependency',  type: 'keyword', desc: 'A → B: knowing A uniquely determines B. e.g. CustomerID → CustomerName; CustomerID → City' },
    { name: 'Partial Dependency',     type: 'keyword', desc: 'A non-key column depends on only PART of a composite PK. Violates 2NF. Only relevant with composite PKs.' },
    { name: 'Transitive Dependency',  type: 'keyword', desc: 'PK → X → Y where X is a non-key column. Y is transitively dependent on the PK. Violates 3NF.' },
    { name: 'Multi-valued Dependency',type: 'keyword', desc: 'A → {B} AND A → {C} where B and C are independent. Violates 4NF — each set belongs in its own table.' },
    { name: 'Update Anomaly',         type: 'keyword', desc: 'A fact stored in multiple rows must be updated in all of them — inconsistency risk if any are missed' },
    { name: 'Insert Anomaly',         type: 'keyword', desc: 'Cannot record a fact about one entity without also having data for another (e.g. cannot add a course with no enrolled students)' },
    { name: 'Delete Anomaly',         type: 'keyword', desc: 'Deleting a row destroys unrelated data (e.g. the last enrollment row also deletes all course info)' },
    { name: 'Star Schema',            type: 'keyword', desc: 'Data warehouse pattern: central fact table surrounded by dimension tables — intentionally denormalised for fast aggregation queries' },
    { name: 'Denormalization',        type: 'keyword', desc: 'Intentionally introducing redundancy after normalising — valid only when a measured performance bottleneck exists in the normalised schema' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why normalise? Anomalies in unnormalized data',
      points: [
        'An unnormalized table stores multiple facts in one row — mixing entity types, repeating data, or using non-atomic values. This leads to three types of anomalies that make the data unreliable over time.',
        '<strong>Update anomaly</strong>: a fact is stored redundantly. To change a customer\'s city you must update every row that mentions that customer. Miss one row and the data is permanently inconsistent — there is no single source of truth.',
        '<strong>Insert anomaly</strong>: you cannot record a new fact without recording another. If CourseID is in the Enrollments table alongside course details (CourseName, Instructor), you cannot add a new course until at least one student enrolls in it.',
        '<strong>Delete anomaly</strong>: deleting a row destroys unrelated data. If the last student drops a course, deleting that Enrollment row also destroys the CourseName and InstructorName — the course data is permanently lost.',
        'Normalization eliminates these by ensuring each fact is stored exactly once and each table represents a single, clearly defined subject. The result is smaller tables, simpler updates, and data that remains consistent without application-layer enforcement.',
      ],
    },
    {
      heading: 'First Normal Form (1NF) — atomicity and identity',
      points: [
        '1NF requires three things: (1) each column contains <strong>atomic</strong> (indivisible) values — no comma-separated lists, no JSON arrays where a child table belongs; (2) <strong>no repeating column groups</strong> — no Phone1, Phone2, Phone3 pattern; (3) all rows are <strong>uniquely identified by a primary key</strong>.',
        'Violation — non-atomic value: a Tags column containing <code>"sql,performance,indexing"</code> as one cell. Fix: create a Tags(EntityID, Tag) child table with one row per tag value. Now each cell is a single, indexable, filterable value.',
        'Violation — repeating groups: columns Phone1, Phone2, Phone3 on a Customers table. Fix: create PersonPhones(PersonID, Phone, PhoneType) with one row per phone number. The number of phones per customer is now unlimited and each is individually accessible.',
        'Violation — no primary key: a table with duplicate rows and no unique identifier. Fix: add a surrogate IDENTITY (SQL Server) or SERIAL/GENERATED IDENTITY (PostgreSQL) column. Even if no natural key exists, every table needs a row identifier.',
        'In practice, both MSSQL and PostgreSQL allow storing comma-separated lists in VARCHAR columns and JSON arrays in TEXT columns — the engine will not prevent it. 1NF is a design rule you must enforce through discipline, code review, and database refactoring.',
      ],
    },
    {
      heading: 'Second Normal Form (2NF) — eliminate partial dependencies',
      points: [
        '2NF only applies when the primary key is <strong>composite</strong> (two or more columns). A table with a single-column PK that is in 1NF is automatically in 2NF — there is no "part of" to be partially dependent on.',
        '<strong>Partial dependency</strong>: a non-key column depends on only PART of the composite PK, not the whole key. Example: Enrollments(StudentID, CourseID, CourseName, Grade) — CourseName depends on CourseID alone, not the full (StudentID, CourseID) composite PK.',
        'If a student transfers between courses, CourseName must be updated in every Enrollment row for that course — a classic update anomaly caused by the partial dependency. And we cannot add a new course without at least one enrolled student — the insert anomaly.',
        'Fix: move CourseName (and all other columns that depend only on CourseID) into a Courses(CourseID, CourseName) table. The Enrollments table keeps only (StudentID, CourseID, Grade) — every non-key column now depends on the entire composite PK.',
        'After splitting: CourseName is stored once per course, not once per enrollment. Update anomalies for course names are eliminated. New courses can be added independently of enrollments. The Enrollments table is smaller and represents one fact: a student is enrolled in a course with a given grade.',
      ],
    },
    {
      heading: 'Third Normal Form (3NF) — eliminate transitive dependencies',
      points: [
        '<strong>Transitive dependency</strong>: a non-key column A depends on another non-key column B, which depends on the PK. Pattern: PK → B → A. The PK determines B, and B (not the PK) determines A. So A is only transitively — not directly — dependent on the PK.',
        'Example violation: Courses(CourseID, CourseName, InstructorID, InstructorName, InstructorDept). CourseID → InstructorID → InstructorName. InstructorName depends on InstructorID (a non-key column), not directly on CourseID. This is a transitive dependency.',
        'Fix: extract Instructors(InstructorID, InstructorName, InstructorDept) as its own table. Courses keeps only (CourseID, CourseName, InstructorID). Now InstructorName is stored once per instructor — if an instructor changes their name, update exactly one row.',
        'Classic mnemonic: <em>"Every non-key attribute must depend on the key, the whole key, and nothing but the key."</em> — "the key" = 1NF (every row has a PK), "the whole key" = 2NF (no partial dependencies), "nothing but the key" = 3NF (no transitive dependencies via non-key columns).',
        '3NF is the standard target for OLTP schemas. Most practical, well-designed schemas are naturally in 3NF once you identify all three anomaly types and eliminate them. After reaching 3NF, further normalization (BCNF, 4NF) is only needed in specific edge cases.',
      ],
    },
    {
      heading: 'BCNF and 4NF — higher normal forms',
      points: [
        '<strong>Boyce-Codd Normal Form (BCNF)</strong>: for every functional dependency X → Y, X must be a candidate key. This is a stricter version of 3NF — 3NF allows X → Y when Y is part of a candidate key and X is not; BCNF does not. BCNF violations only arise when a table has multiple overlapping composite candidate keys — a rare structure in practice.',
        'Classic BCNF violation (simplified): Assignments(StudentID, CourseID, AdvisorID) where each student-course pair has one advisor AND each advisor teaches only one course. Both (StudentID, CourseID) and (StudentID, AdvisorID) are candidate keys — but AdvisorID → CourseID is a dependency where AdvisorID is not a candidate key. BCNF says split into (StudentID, AdvisorID) and (AdvisorID, CourseID).',
        '<strong>4NF</strong> eliminates multi-valued dependencies: a table stores two <em>independent</em> sets of facts about an entity in one table. Example: Employee(EmpID, Skill, Language) — skills and languages are independent of each other. One (EmpID, Skill, Language) row incorrectly implies a skill-language relationship. Fix: separate into EmpSkills(EmpID, Skill) and EmpLanguages(EmpID, Language).',
        '4NF violations often look like M:N relationships with a third independent dimension jammed into the same table. The fix is always to decompose into multiple tables, each capturing one multi-valued dependency independently.',
        'In day-to-day work: design to 3NF as your standard target. Check for BCNF if your schema has multiple composite unique/candidate keys. 4NF applies when you spot an entity with two independently varying lists both joined in one table. 5NF and beyond are academic exercises for most practitioners.',
      ],
    },
    {
      heading: 'Denormalization patterns — when and how',
      points: [
        '<strong>When to denormalise</strong>: only after profiling a production workload and measuring that JOIN overhead is a genuine performance bottleneck for a specific hot query path — not because JOINs "seem expensive" in theory. Premature denormalization adds update complexity and data anomaly risk for unproven benefit.',
        'Common valid denormalization patterns: (1) <strong>Redundant aggregate column</strong> — store <code>OrderTotal DECIMAL</code> on Orders alongside the OrderLines that compute it. Avoids a SUM() + JOIN on every order read. Must be kept in sync via triggers or application logic. (2) <strong>Duplicated lookup column</strong> — copy CustomerName onto Orders to avoid a JOIN to Customers on every order query. (3) <strong>Pre-aggregated summary table</strong> — a nightly-computed DailySalesSummary table for reporting queries.',
        'Every denormalization must be documented: what is redundant, where the authoritative source lives, and what mechanism keeps the redundant copy in sync. An undocumented denormalization will be incorrectly "normalized away" by the next developer who considers it a bug.',
        '<strong>Star schema</strong> (data warehouse / analytical schemas): deliberately denormalized. A central <em>fact table</em> stores quantitative events (sales, clicks, orders) with FK references to <em>dimension tables</em> (Date, Product, Customer, Store). Dimension tables contain pre-joined descriptive attributes — CustomerName, CityName, CountryName all on the Customer dimension — to minimise JOINs at query time. Analytical queries aggregate millions of fact rows and a few dimension lookups; normalised snowflake schemas add JOINs that hurt aggregation performance.',
        'The rule: <strong>normalise for OLTP</strong> (row-level updates, high concurrency, writes mixed with reads); <strong>denormalise for OLAP / reporting</strong> (bulk reads, aggregate queries, read-only or rarely updated). Most systems maintain both: a normalised operational database and a denormalised reporting/warehouse layer populated by ETL pipelines.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Unnormalized → 1NF',
      language: 'sql',
      code: `-- ── UNNORMALIZED (violates 1NF) ─────────────────────────────────────────
-- Problems: composite Tags column, repeating Phone1/Phone2, no clear PK
--
-- CustomerName | City    | Phone1       | Phone2       | Tags
-- Alice        | London  | 0207-000-001 | 0207-000-002 | sql,python
-- Bob          | Paris   | 0033-1-0001  | NULL         | java

-- ── 1NF: extract repeating/non-atomic groups into child tables ───────────
CREATE TABLE Customers (
    CustomerID   INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    CustomerName NVARCHAR(200) NOT NULL,
    City         NVARCHAR(100) NOT NULL
);

CREATE TABLE CustomerPhones (           -- repeating Phone1/Phone2 → child table
    CustomerID INT         NOT NULL REFERENCES Customers(CustomerID),
    PhoneType  VARCHAR(20) NOT NULL,    -- 'mobile','office','fax'
    Phone      VARCHAR(30) NOT NULL,
    CONSTRAINT PK_CustPhone PRIMARY KEY (CustomerID, Phone)
);

CREATE TABLE CustomerTags (             -- comma-separated Tags → child table
    CustomerID INT         NOT NULL REFERENCES Customers(CustomerID),
    Tag        VARCHAR(50) NOT NULL,
    CONSTRAINT PK_CustTag PRIMARY KEY (CustomerID, Tag)
);
-- Now each cell is atomic, no repeating groups, and every row has a PK.
-- Alice has 2 rows in CustomerPhones and 2 rows in CustomerTags.
-- Adding a 3rd phone requires no schema change.`,
    },
    {
      label: '1NF → 2NF',
      language: 'sql',
      code: `-- ── VIOLATES 2NF (partial dependency on composite PK) ───────────────────
-- Enrollments(StudentID, CourseID, CourseName, InstructorName, Grade)
-- CourseName depends on CourseID alone — not the full (StudentID, CourseID) PK.
-- Update anomaly: changing a course name requires updating ALL enrollment rows.
-- Insert anomaly: can't add a course until at least one student enrolls.

-- ── 2NF: remove partial dependencies ─────────────────────────────────────
CREATE TABLE Courses (
    CourseID       INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    CourseName     NVARCHAR(200) NOT NULL,
    InstructorName NVARCHAR(200) NOT NULL   -- still has a 3NF problem — see next tab
);

CREATE TABLE Students (
    StudentID  INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    FullName   NVARCHAR(200) NOT NULL,
    Email      NVARCHAR(254) NOT NULL UNIQUE
);

CREATE TABLE Enrollments (
    StudentID INT     NOT NULL REFERENCES Students(StudentID),
    CourseID  INT     NOT NULL REFERENCES Courses(CourseID),
    Grade     CHAR(1) NULL CHECK (Grade IN ('A','B','C','D','F')),
    CONSTRAINT PK_Enrollments PRIMARY KEY (StudentID, CourseID)
);
-- CourseName is now stored exactly once per course — in Courses.
-- Enrollments only models the student-course relationship and grade.
-- Renaming a course: 1 UPDATE on Courses, not N UPDATEs on Enrollments.`,
    },
    {
      label: '2NF → 3NF',
      language: 'sql',
      code: `-- ── VIOLATES 3NF (transitive dependency) ────────────────────────────────
-- Courses(CourseID, CourseName, InstructorID, InstructorName, InstructorDept)
-- InstructorName and InstructorDept depend on InstructorID (a non-key column).
-- CourseID → InstructorID → InstructorName   ← transitive chain
-- Changing an instructor's department: update every course they teach.

-- ── 3NF: extract transitively dependent columns into their own table ──────
CREATE TABLE Instructors (
    InstructorID   INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    InstructorName NVARCHAR(200) NOT NULL,
    Department     NVARCHAR(100) NOT NULL
);

CREATE TABLE Courses (
    CourseID     INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    CourseName   NVARCHAR(200) NOT NULL,
    InstructorID INT           NOT NULL REFERENCES Instructors(InstructorID)
    -- InstructorName removed — lives in Instructors only
);
CREATE INDEX IX_Courses_Instructor ON Courses (InstructorID);

-- ── Final 3NF schema summary ────────────────────────────────────────────
-- Enrollments(StudentID, CourseID, Grade)
--   Grade depends on the full composite PK (StudentID, CourseID) ✅
-- Courses(CourseID, CourseName, InstructorID)
--   CourseName, InstructorID both depend only on CourseID ✅
-- Instructors(InstructorID, InstructorName, Department)
--   Both columns depend only on InstructorID ✅
--
-- "Depends on the key (1NF), the whole key (2NF), nothing but the key (3NF)"`,
    },
    {
      label: 'Denormalization',
      language: 'sql',
      code: `-- ── PROBLEM: order total requires JOIN on every read ─────────────────────
SELECT o.OrderID, SUM(ol.Qty * ol.UnitPrice) AS Total
FROM Orders o JOIN OrderLines ol ON o.OrderID = ol.OrderID
WHERE o.OrderID = 12345;

-- ── DENORMALIZATION: store OrderTotal on Orders for fast retrieval ─────────
ALTER TABLE Orders ADD OrderTotal DECIMAL(12,2) NULL;

-- Keep in sync with a trigger (MSSQL):
CREATE OR ALTER TRIGGER trg_RecalcOrderTotal
ON OrderLines AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE o
    SET o.OrderTotal = (
        SELECT ISNULL(SUM(Qty * UnitPrice), 0)
        FROM OrderLines
        WHERE OrderID = o.OrderID
    )
    FROM Orders o
    WHERE o.OrderID IN (
        SELECT DISTINCT OrderID FROM inserted
        UNION
        SELECT DISTINCT OrderID FROM deleted
    );
END;

-- PostgreSQL equivalent trigger function:
CREATE OR REPLACE FUNCTION recalc_order_total() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE orders
    SET order_total = (SELECT COALESCE(SUM(qty * unit_price), 0)
                       FROM order_lines WHERE order_id = COALESCE(NEW.order_id, OLD.order_id))
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);
    RETURN NEW;
END;
$$;
CREATE TRIGGER trg_order_lines_total
    AFTER INSERT OR UPDATE OR DELETE ON order_lines
    FOR EACH ROW EXECUTE FUNCTION recalc_order_total();

-- Document the denormalization — this comment must survive code reviews:
-- OrderTotal is a denormalised cache of SUM(OrderLines.Qty * OrderLines.UnitPrice).
-- Never set OrderTotal directly — the triggers maintain it. Source of truth: OrderLines.`,
    },
    {
      label: '4NF — multi-valued dependencies',
      language: 'sql',
      code: `-- ── VIOLATES 4NF (multi-valued dependency) ────────────────────────────
-- An Employee can have MULTIPLE Skills AND MULTIPLE Languages.
-- Skills and Languages are INDEPENDENT of each other — one is not determined by the other.
--
-- Employee(EmpID, Skill, Language)
-- Rows:
-- (1, 'SQL',    'English')
-- (1, 'SQL',    'French')   ← must add 'SQL' again for each language
-- (1, 'Python', 'English')   ← must add 'English' again for each skill
-- (1, 'Python', 'French')
-- Adding a new language 'Spanish' requires inserting 2 new rows (one per skill).
-- The pairing (SQL, English) implies no real relationship — it's spurious.

-- ── 4NF: decompose each independent multi-valued fact ─────────────────
CREATE TABLE Employees (
    EmpID    INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(200) NOT NULL
);

CREATE TABLE EmpSkills (      -- EmpID →→ Skill (independent of languages)
    EmpID INT         NOT NULL REFERENCES Employees(EmpID),
    Skill VARCHAR(100) NOT NULL,
    CONSTRAINT PK_EmpSkills PRIMARY KEY (EmpID, Skill)
);

CREATE TABLE EmpLanguages (   -- EmpID →→ Language (independent of skills)
    EmpID    INT         NOT NULL REFERENCES Employees(EmpID),
    Language VARCHAR(100) NOT NULL,
    CONSTRAINT PK_EmpLangs PRIMARY KEY (EmpID, Language)
);
-- Adding 'Spanish' for Employee 1: 1 INSERT into EmpLanguages.
-- No spurious (skill, language) pairs — the tables model each fact independently.`,
    },
    {
      label: 'Star schema (warehouse)',
      language: 'sql',
      code: `-- ── Star schema: fact table + dimension tables ────────────────────────
-- Deliberately denormalised for fast analytical aggregation.
-- Dimension tables contain pre-joined descriptive attributes.

-- Dimension: Date (calendar hierarchy pre-joined into one table)
CREATE TABLE DimDate (
    DateKey      INT          NOT NULL PRIMARY KEY,   -- YYYYMMDD integer
    FullDate     DATE         NOT NULL,
    DayOfWeek    TINYINT      NOT NULL,
    WeekOfYear   TINYINT      NOT NULL,
    MonthNum     TINYINT      NOT NULL,
    MonthName    VARCHAR(20)  NOT NULL,
    Quarter      TINYINT      NOT NULL,
    YearNum      SMALLINT     NOT NULL,
    IsWeekend    BIT          NOT NULL,
    FiscalYear   SMALLINT     NOT NULL
);

-- Dimension: Customer (denormalised — City, Country embedded, not normalised out)
CREATE TABLE DimCustomer (
    CustomerKey  INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    CustomerID   INT          NOT NULL,    -- natural key from OLTP system
    FullName     NVARCHAR(200) NOT NULL,
    City         NVARCHAR(100) NOT NULL,
    Country      NVARCHAR(100) NOT NULL,   -- denormalised from a Locations table
    Segment      VARCHAR(50)  NOT NULL     -- 'Enterprise','SMB','Consumer'
);

-- Dimension: Product
CREATE TABLE DimProduct (
    ProductKey   INT          NOT NULL IDENTITY(1,1) PRIMARY KEY,
    ProductID    INT          NOT NULL,
    ProductName  NVARCHAR(200) NOT NULL,
    CategoryName NVARCHAR(100) NOT NULL,   -- denormalised from Categories
    UnitCost     DECIMAL(10,2) NOT NULL
);

-- Fact: Sales (additive measures + FK to dimensions)
CREATE TABLE FactSales (
    SalesKey     BIGINT        NOT NULL IDENTITY(1,1) PRIMARY KEY,
    DateKey      INT           NOT NULL REFERENCES DimDate(DateKey),
    CustomerKey  INT           NOT NULL REFERENCES DimCustomer(CustomerKey),
    ProductKey   INT           NOT NULL REFERENCES DimProduct(ProductKey),
    -- Additive measures:
    Quantity     INT           NOT NULL,
    Revenue      DECIMAL(12,2) NOT NULL,
    Cost         DECIMAL(12,2) NOT NULL,
    Profit       DECIMAL(12,2) NOT NULL   -- denormalised: Revenue - Cost
);
CREATE INDEX IX_FactSales_Date     ON FactSales (DateKey);
CREATE INDEX IX_FactSales_Customer ON FactSales (CustomerKey);
CREATE INDEX IX_FactSales_Product  ON FactSales (ProductKey);

-- Typical analytical query (no deep JOINs — all dims are 1 join away):
SELECT d.YearNum, d.MonthName, p.CategoryName,
       SUM(f.Revenue) AS TotalRevenue,
       SUM(f.Profit)  AS TotalProfit
FROM FactSales f
JOIN DimDate     d ON f.DateKey     = d.DateKey
JOIN DimProduct  p ON f.ProductKey  = p.ProductKey
WHERE d.YearNum = 2024
GROUP BY d.YearNum, d.MonthName, p.CategoryName
ORDER BY d.MonthNum;`,
    },
  ];

  challenge: Challenge = {
    title: 'Normalize an Order Form Table',
    language: 'sql',
    description: 'The following unnormalized table captures order data from a legacy form. Identify all normalization violations and produce a clean 3NF schema.',
    hints: [
      'Look for repeating groups (Item1, Item2...) — these violate 1NF',
      'CustomerCity depends on CustomerID, not on OrderID — transitive dependency (3NF violation)',
      'ProductName depends on ProductID, not the composite PK of the order line — partial dependency (2NF)',
      'End state: at least 4 tables (Customers, Products, Orders, OrderLines)',
    ],
    starterCode: `-- LEGACY UNNORMALIZED TABLE:
-- OrderID | OrderDate | CustomerID | CustomerName | CustomerCity
--         | Item1_ProductID | Item1_ProductName | Item1_Qty | Item1_Price
--         | Item2_ProductID | Item2_ProductName | Item2_Qty | Item2_Price
--         | Item3_ProductID | Item3_ProductName | Item3_Qty | Item3_Price

-- Step 1: identify violations
-- 1NF violations: _______________
-- 2NF violations: _______________
-- 3NF violations: _______________

-- Step 2: write the normalized schema
CREATE TABLE customers ( /* ... */ );
CREATE TABLE products   ( /* ... */ );
CREATE TABLE orders     ( /* ... */ );
CREATE TABLE order_lines( /* ... */ );`,
    solution: `-- VIOLATIONS IDENTIFIED:
-- 1NF: Item1_*, Item2_*, Item3_* are repeating groups — must become a child table
-- 2NF: ProductName depends only on ProductID (partial dep on the composite order-line PK)
-- 3NF: CustomerName, CustomerCity depend on CustomerID, not OrderID (transitive dep)

-- NORMALIZED 3NF SCHEMA (PostgreSQL):
CREATE TABLE customers (
    customer_id   INT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_name VARCHAR(200) NOT NULL,
    city          VARCHAR(100) NOT NULL,
    CONSTRAINT uq_customers_email UNIQUE (customer_name)  -- simplified
);
-- CustomerName and CustomerCity are stored once per customer.

CREATE TABLE products (
    product_id   INT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL
);
-- ProductName is stored once per product — not repeated per order line.

CREATE TABLE orders (
    order_id    INT  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id INT  NOT NULL REFERENCES customers(customer_id),
    order_date  DATE NOT NULL DEFAULT CURRENT_DATE
);
CREATE INDEX ix_orders_customer ON orders(customer_id);

CREATE TABLE order_lines (
    order_id   INT           NOT NULL REFERENCES orders(order_id),
    product_id INT           NOT NULL REFERENCES products(product_id),
    qty        INT           NOT NULL CHECK (qty > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
    CONSTRAINT pk_order_lines PRIMARY KEY (order_id, product_id)
);
CREATE INDEX ix_order_lines_product ON order_lines(product_id);

-- All anomalies eliminated:
-- Update customer city → 1 row in customers (not N order rows)
-- Add a product → 1 row in products (no enrollment required)
-- Remove an order → order_lines deleted via CASCADE; products table untouched`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'A table has a composite PK of (OrderID, ProductID). The column ProductName depends only on ProductID. Which normal form does this violate?',
      options: ['1NF', '2NF', '3NF', 'BCNF'],
      answer: 1,
      explanation: '2NF requires every non-key column to depend on the WHOLE primary key. ProductName depends on only ProductID (part of the composite PK) — this is a partial dependency, which violates 2NF. Fix: move ProductName to a Products table keyed by ProductID.',
    },
    {
      q: 'A table has columns: EmployeeID (PK), DeptID, DeptName. DeptName depends on DeptID, not directly on EmployeeID. Which normal form does this violate?',
      options: ['1NF', '2NF', '3NF', 'It does not violate any normal form'],
      answer: 2,
      explanation: '3NF prohibits transitive dependencies. EmployeeID → DeptID → DeptName: DeptName depends on DeptID (a non-key column), creating a transitive dependency via DeptID. Fix: move DeptName into a Departments(DeptID, DeptName) table.',
    },
    {
      q: 'A Tags column stores "sql,python,performance" as a single string. Which normal form does this violate?',
      options: ['1NF', '2NF', '3NF', 'BCNF'],
      answer: 0,
      explanation: '1NF requires atomic (indivisible) values in every column. A comma-separated list is not atomic — it contains multiple independent values in one cell. Fix: extract to a Tags child table with one row per tag.',
    },
    {
      q: 'The mnemonic "depends on the key, the whole key, and nothing but the key" describes which three normal forms?',
      options: [
        '1NF (the key), 2NF (the whole key), 3NF (nothing but the key)',
        '2NF (the key), 3NF (the whole key), BCNF (nothing but the key)',
        '1NF, 3NF, BCNF',
        '2NF, BCNF, 4NF',
      ],
      answer: 0,
      explanation: '"Depends on the key" = 1NF (every row has a primary key). "The whole key" = 2NF (no partial dependencies on part of a composite key). "Nothing but the key" = 3NF (no transitive dependencies via non-key columns). This is the classic Codd mnemonic.',
    },
    {
      q: 'Which statement about denormalization is correct?',
      options: [
        'Denormalization should always be applied to improve performance',
        'Denormalized schemas cannot have anomalies because they are purposeful',
        'Denormalization is valid only after measuring a real performance problem in a normalized schema',
        'Denormalization always involves adding JSON columns',
      ],
      answer: 2,
      explanation: 'Denormalization re-introduces redundancy and update anomalies. It is justified only when profiling reveals a specific, measurable query performance bottleneck in a normalized schema. Never denormalize speculatively — the anomaly risk is real and the performance gain may not be.',
    },
    {
      q: 'What is a multi-valued dependency, and which normal form eliminates it?',
      options: [
        'A column depends on two PKs; eliminated by 3NF',
        'An entity has two independent sets of multi-values stored in one table; eliminated by 4NF',
        'A non-key column depends on another non-key column; eliminated by BCNF',
        'Two columns share the same values; eliminated by 2NF',
      ],
      answer: 1,
      explanation: 'A multi-valued dependency: Employee →→ Skill AND Employee →→ Language, where Skills and Languages are independent. Storing both in Employee(EmpID, Skill, Language) creates spurious pairings and insertion anomalies. 4NF eliminates this by requiring each independent multi-value set to be in its own table (EmpSkills, EmpLanguages).',
    },
    {
      q: 'In a data warehouse star schema, dimension tables are intentionally denormalized. Why?',
      options: [
        'Because relational databases cannot enforce constraints on dimension tables',
        'To minimise JOINs in analytical aggregation queries — pre-joining descriptive attributes (City, Country, CategoryName) into one dimension table means one JOIN per dimension instead of a chain of normalised JOINs',
        'Because dimension tables do not contain primary keys',
        'To make ETL pipelines faster by reducing the number of tables to load',
      ],
      answer: 1,
      explanation: 'Analytical queries aggregate millions of fact rows and look up dimension descriptors. In a normalised schema, each lookup (Customer → City → Country) requires a chain of JOINs. Denormalising City and Country into the Customer dimension means one JOIN instead of three. The tradeoff (redundancy, larger dimension tables) is acceptable because dimensions are updated rarely and reads dominate analytical workloads.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Does 2NF only apply to tables with composite primary keys?',
      a: 'Yes. A partial dependency means a non-key column depends on only PART of the composite PK. If the PK is a single column, there is no "part of" to be partially dependent on — so a table in 1NF with a single-column PK is automatically in 2NF. This is one reason surrogate INT IDENTITY keys simplify normalization: they are always single-column, so you never have partial dependencies to worry about. However, you must still check for 3NF transitive dependencies regardless of PK structure.',
    },
    {
      q: 'In practice, do I always need to normalize to 3NF before shipping?',
      a: '3NF is the standard target for OLTP schemas — aim for it by default. Cases where you might stop short: (1) read-heavy reporting or analytical schemas where JOIN cost measurably outweighs anomaly risk (data warehouses often use star schemas with deliberate 1NF/2NF violations in dimension tables); (2) append-only or immutable tables (event logs, audit records) where update anomalies cannot occur because data never changes; (3) after profiling proves a specific JOIN is the bottleneck. Never skip 3NF because JOINs "seem slow" without measuring.',
    },
    {
      q: 'What is 4NF and do I need it?',
      a: '4NF eliminates multi-valued dependencies — an entity has two independent sets of multi-values stored in one table. Example: Employee(EmpID, Skill, Language) where skills and languages are independent of each other. Every (EmpID, Skill, Language) combination must be stored explicitly, creating spurious pairings and insertion anomalies. 4NF says split into EmpSkills(EmpID, Skill) and EmpLanguages(EmpID, Language). In practice, 3NF handles the vast majority of real-world schemas. You encounter 4NF when designing many-to-many relationships involving two independent multi-value attributes on the same entity.',
    },
    {
      q: 'What is BCNF and how does it differ from 3NF?',
      a: '3NF allows a non-key column to depend on another column if that other column is part of a candidate key. BCNF tightens this: every determinant (the left side of any functional dependency) must be a candidate key — no exceptions. BCNF violations only occur when a table has multiple overlapping composite candidate keys. Example: a table where (StudentID, CourseID) and (StudentID, AdvisorID) are both candidate keys, and AdvisorID → CourseID exists. This passes 3NF (AdvisorID is part of a candidate key) but fails BCNF (AdvisorID alone is not a candidate key). In everyday schema design, if you normalise to 3NF carefully, you will rarely encounter BCNF violations.',
    },
    {
      q: 'What is the difference between a star schema and a snowflake schema?',
      a: 'Both are data warehouse dimensional models. A <strong>star schema</strong> has a central fact table surrounded by fully denormalised dimension tables — CustomerCity and CustomerCountry are columns on the Customer dimension, not in separate tables. One JOIN per dimension, simple queries, excellent read performance. A <strong>snowflake schema</strong> further normalises dimension tables — City and Country are split into separate tables linked to Customer. This reduces storage redundancy but requires more JOINs per query. Most data warehouses prefer star schemas for query simplicity and performance; snowflakes are used when dimension size or update frequency makes redundancy costly.',
    },
    {
      q: 'Can I store multiple values in a JSON column without violating 1NF?',
      a: 'Technically, a JSON column does store multiple values in one cell — which would violate 1NF if those values represent a repeating set of related relational facts (names, IDs, numeric values you will query). However, 1NF was defined before JSON became a practical database feature. The pragmatic view: storing schema-flexible, document-oriented data in JSONB (PostgreSQL) or NVARCHAR JSON (SQL Server) is acceptable when: (a) the structure varies per row and relational modelling would require hundreds of columns or complex EAV tables; (b) querying is done at the document level rather than field-by-field; and (c) the JSON content is indexed appropriately. If you find yourself frequently extracting specific JSON fields in WHERE/JOIN clauses, that data belongs in a relational column.',
    },
    {
      q: 'How do I handle hierarchical data (e.g. an org chart or category tree) in a normalised relational schema?',
      a: 'Several patterns: (1) <strong>Adjacency list</strong>: each row stores its parent\'s ID (<code>ParentID INT REFERENCES self</code>). Simple to write; requires recursive CTEs to query the full hierarchy (<code>WITH RECURSIVE</code> in PG, <code>WITH … OPTION(MAXRECURSION)</code> in MSSQL). (2) <strong>Materialized path</strong>: store the full path string in a column (<code>\'/1/3/7/\'</code>) — enables prefix-search for subtrees but requires updates when a node moves. (3) <strong>Nested sets</strong>: each node stores left/right bounds across the pre-order traversal — very fast for subtree reads, expensive for writes. (4) <strong>Closure table</strong>: a separate table records all ancestor-descendant pairs — flexible, queryable without recursion, but grows O(n²) for deep trees. For most applications, the adjacency list with recursive CTEs is the simplest and most maintainable starting point.',
    },
  ];
}
