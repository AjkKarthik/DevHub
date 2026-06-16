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
  selector: 'app-sql-schema-design',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './schema-design.html',
  styleUrl: './schema-design.scss',
})
export class SqlSchemaDesign {

  quickRef: QuickRefItem[] = [
    { name: 'PRIMARY KEY',        type: 'constraint', desc: 'Uniquely identifies each row; MSSQL auto-creates a clustered index; PG creates a unique B-tree', since: 'SQL-92' },
    { name: 'FOREIGN KEY',        type: 'constraint', desc: 'Enforces referential integrity; does NOT create an index automatically — add one explicitly', since: 'SQL-92' },
    { name: 'UNIQUE',             type: 'constraint', desc: 'All values distinct; allows one NULL in MSSQL (multiple NULLs in PG); creates an index implicitly', since: 'SQL-92' },
    { name: 'CHECK',              type: 'constraint', desc: 'Boolean predicate enforced on every INSERT/UPDATE; evaluated before any trigger fires', since: 'SQL-92' },
    { name: 'NOT NULL',           type: 'constraint', desc: 'Prevents NULL values; declare explicitly for columns that must always have a value', since: 'SQL-92' },
    { name: 'DEFAULT',            type: 'constraint', desc: 'Supplies a value when the INSERT omits the column; evaluated at insert time', since: 'SQL-92' },
    { name: 'IDENTITY(seed,step)', type: 'keyword',   desc: 'MSSQL auto-increment; seed = first value, step = increment. Use SEQUENCE for more control', since: 'MSSQL' },
    { name: 'SERIAL / SEQUENCE',  type: 'keyword',    desc: 'PG auto-increment shorthand (SERIAL) or explicit SEQUENCE object; GENERATED ALWAYS AS IDENTITY preferred in PG 10+', since: 'PostgreSQL' },
    { name: 'ON DELETE CASCADE',  type: 'keyword',    desc: 'Auto-deletes child rows when parent is deleted; use cautiously — can cause unintended mass deletes', since: 'SQL-92' },
    { name: 'ON DELETE SET NULL', type: 'keyword',    desc: 'Sets FK column to NULL when parent is deleted; column must be NULLable', since: 'SQL-92' },
    { name: 'DECIMAL(p,s)',       type: 'type',       desc: 'Exact numeric; p = total digits, s = decimal places; use for money/quantities, never FLOAT', since: 'SQL-92' },
    { name: 'DATETIME2(n)',       type: 'type',       desc: 'MSSQL: 100ns precision, wider range than DATETIME; prefer over DATETIME in all new schemas', since: 'MSSQL 2008' },
    { name: 'TIMESTAMPTZ',        type: 'type',       desc: 'PG: stores UTC timestamp + time zone offset; always use over plain TIMESTAMP for event times', since: 'PostgreSQL' },
    { name: 'IsDeleted / deleted_at', type: 'keyword', desc: 'Soft delete pattern: flag row as deleted without physically removing it (retains audit trail)', since: 'Pattern' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Normalisation — 1NF through BCNF',
      points: [
        '<strong>1NF</strong>: each column holds a single atomic value (no comma-separated lists, no JSON arrays in a VARCHAR column), there are no repeating column groups (no Phone1/Phone2/Phone3 — use a related table), and the table has a primary key that uniquely identifies each row.',
        '<strong>2NF</strong>: the table is in 1NF and every non-key column is fully dependent on the <em>entire</em> primary key. Only relevant when the PK is composite — if a non-key column depends on only <em>part</em> of the composite key, it belongs in a separate table. Example: an OrderDetails table with PK (OrderID, ProductID) must not store ProductName — it depends only on ProductID, not the full composite key.',
        '<strong>3NF</strong>: the table is in 2NF and no non-key column determines another non-key column (no transitive dependencies). Classic example: storing ZipCode and City in the same table — City is determined by ZipCode, not the PK. Fix: move (ZipCode → City) into a ZipCodes lookup table.',
        '<strong>BCNF (Boyce-Codd NF)</strong>: a stricter form of 3NF — every determinant must be a candidate key. BCNF violations occur when there are overlapping composite candidate keys. In practice, 3NF is the target for OLTP schemas; BCNF matters for complex schemas with multiple composite unique constraints.',
        'Denormalise selectively and deliberately: after measuring that JOIN overhead is a genuine bottleneck in production (not theory). Common denormalisation patterns: pre-computed aggregate columns (OrderTotal on Orders), redundant columns to avoid frequent joins (CustomerName on Orders for read-heavy reports), or summary tables for analytics. Denormalisation trades write complexity and data redundancy risk for read speed.',
      ],
    },
    {
      heading: 'Constraints — database-level integrity enforcement',
      points: [
        '<strong>PRIMARY KEY</strong>: every table must have one. A surrogate PK (INT IDENTITY / BIGINT IDENTITY, or SEQUENCE in PostgreSQL) is narrower and immutable vs a natural key that can change. Narrow PKs keep the clustered index and all non-clustered row locators small. The PK also serves as the unique identifier for FK references from child tables.',
        '<strong>FOREIGN KEY</strong>: enforces referential integrity — a child row cannot reference a parent row that does not exist. SQL Server and PostgreSQL do NOT automatically create an index on the FK column — add one explicitly (critical for JOIN performance and cascade operation performance). Cascade options: <code>ON DELETE CASCADE</code> (auto-delete children), <code>ON DELETE SET NULL</code> (nullify FK), <code>ON DELETE RESTRICT</code> / <code>NO ACTION</code> (default — block parent delete if children exist).',
        '<strong>CHECK</strong>: Boolean predicates enforced on every INSERT and UPDATE at the column level or table level: <code>CHECK (Price > 0)</code>, <code>CHECK (Status IN (\'Pending\',\'Shipped\',\'Cancelled\'))</code>, <code>CHECK (StartDate < EndDate)</code> (multi-column table-level constraint). Checked before any DML trigger fires. In SQL Server, use <code>WITH NOCHECK</code> when adding a constraint to a table with existing data to skip retroactive checking (but flag it — existing data may violate).',
        '<strong>UNIQUE + DEFAULT + NOT NULL</strong>: UNIQUE ensures no two rows share the same value in the column(s) — suitable for business keys (email, SSN, ISBN) that must be unique but are not the PK. SQL Server allows one NULL per UNIQUE index column; PostgreSQL allows multiple NULLs (NULL ≠ NULL). DEFAULT provides a value when the INSERT omits the column — evaluated at insert time (can use functions: <code>DEFAULT SYSUTCDATETIME()</code>). NOT NULL must be declared explicitly; nullable is the default in SQL.',
        'Constraints have names — always name them explicitly using <code>CONSTRAINT PK_tableName</code>, <code>CONSTRAINT FK_table_ref</code>, <code>CONSTRAINT UQ_table_col</code>, <code>CONSTRAINT CHK_table_rule</code>. Named constraints can be dropped by name (<code>ALTER TABLE … DROP CONSTRAINT name</code>); unnamed constraints get system-generated names that differ between environments, making migration scripts fragile.',
      ],
    },
    {
      heading: 'Data type selection — precision, storage, and correctness',
      points: [
        'Use the <strong>smallest correct type</strong>. TINYINT (1 byte, 0–255) wastes less space than INT (4 bytes) for status codes or age. Narrower types fit more rows per 8KB page — less I/O per query. Do not over-size strings: <code>NVARCHAR(50)</code> for names is usually enough; <code>NVARCHAR(MAX)</code> for descriptions when needed. Over-sizing wastes both table pages and index pages.',
        'Money and quantities: always use <code>DECIMAL(p, s)</code> or <code>NUMERIC(p, s)</code> — exact arithmetic. Never use <code>FLOAT</code> or <code>REAL</code> for financial values — they use binary floating-point and introduce rounding errors (0.1 + 0.2 may equal 0.30000000000000004). SQL Server\'s proprietary <code>MONEY</code> type is exact but only 4 decimal places and is not portable — prefer <code>DECIMAL(19, 4)</code>.',
        'Dates and times: SQL Server — prefer <code>DATETIME2(n)</code> (100ns precision, larger date range, variable storage) over the legacy <code>DATETIME</code> (3.33ms precision, limited range). Store timestamps in UTC: <code>DEFAULT SYSUTCDATETIME()</code> or <code>DEFAULT GETUTCDATE()</code>. PostgreSQL — use <code>TIMESTAMPTZ</code> for event times (stores as UTC, converts to session time zone on output) and <code>DATE</code> for date-only values. Never store timestamps as VARCHAR.',
        'Strings: <code>VARCHAR(n)</code> for ASCII-only content (English text, codes, slugs); <code>NVARCHAR(n)</code> for Unicode (names, addresses, content users might type in any language). In PostgreSQL, <code>TEXT</code> and <code>VARCHAR(n)</code> are stored identically — use TEXT for unbounded strings and VARCHAR(n) for enforced length constraints. Avoid <code>CHAR(n)</code> except for truly fixed-length codes (country codes) — it pads with spaces.',
        'Boolean and bit flags: SQL Server uses <code>BIT</code> (0/1/NULL — cannot use TRUE/FALSE literals); PostgreSQL uses <code>BOOLEAN</code> (TRUE/FALSE/NULL). For complex state machines with many valid states, prefer a VARCHAR/ENUM with a CHECK constraint or a lookup table over multiple BIT columns — multiple BIT flags become unmaintainable as the schema evolves.',
      ],
    },
    {
      heading: 'Surrogate keys, natural keys, and UUID design',
      points: [
        'A <strong>surrogate key</strong> is an artificial identifier with no business meaning — typically INT IDENTITY, BIGINT IDENTITY (MSSQL), or a SEQUENCE-backed column (PostgreSQL / MSSQL 2012+). Surrogate keys are immutable (business meaning doesn\'t change), narrow (4–8 bytes), ever-increasing (no fragmentation on insert), and never need to cascade when business data changes. They are the default choice for most tables.',
        'A <strong>natural key</strong> is a real-world identifier (email, ISBN, SSN, username, telephone). Use natural keys as <code>UNIQUE</code> constraints alongside a surrogate PK — they enforce business uniqueness and can be referenced by the application without exposing the surrogate ID. Never use a natural key alone as the PK if it can change (email changes, ISBNs have corrections).',
        '<strong>UUID / GUID keys</strong>: 16 bytes vs 4 for INT — every non-clustered index carries the clustered key as its row locator, so a UUID-clustered table has wider non-clustered indexes and larger row locators. Random UUIDs (V4) cause severe clustered index fragmentation (random insert positions → page splits). Mitigations: use <code>NEWSEQUENTIALID()</code> in SQL Server for roughly monotonic GUIDs; use <code>UUIDv7</code> in PostgreSQL (time-ordered, available via extension). Store UUIDs as <code>UNIQUEIDENTIFIER</code> (MSSQL) or native <code>UUID</code> (PG) — never as VARCHAR(36).',
        '<strong>When to choose UUID over INT</strong>: distributed systems where IDs are generated client-side or across multiple nodes without a central sequence; microservice architectures where rows from different services are merged; publicly exposed IDs where sequential integers expose business volume. For a single-database application with no distributed ID generation requirement, INT/BIGINT IDENTITY is almost always the better choice.',
        '<strong>SEQUENCE objects</strong> (MSSQL 2012+ / PostgreSQL): similar to IDENTITY but more flexible — shared across multiple tables, with a controllable start/step/cycle, and the next value can be fetched without an insert (<code>NEXT VALUE FOR seqName</code>). Useful for pre-allocating ID blocks, shared sequences across related tables, or generating business-visible order numbers.',
      ],
    },
    {
      heading: 'Soft delete, audit columns, and schema evolution',
      points: [
        '<strong>Soft delete</strong> marks a row as deleted without physically removing it. Two patterns: <code>IsDeleted BIT NOT NULL DEFAULT 0</code> (boolean flag) or <code>DeletedAt DATETIME2 NULL</code> (timestamp — also records when). All queries must add <code>WHERE IsDeleted = 0</code> / <code>WHERE DeletedAt IS NULL</code> — use a view or filtered index to make this automatic and prevent accidental inclusion.',
        'Filtered indexes for soft delete: <code>CREATE INDEX IX_Orders_Active ON Orders (CustomerID, OrderDate) WHERE IsDeleted = 0</code>. This keeps the active index small and fast while retaining the full history. Pair with a view: <code>CREATE VIEW vw_ActiveOrders AS SELECT * FROM Orders WHERE IsDeleted = 0</code> — application code uses the view for transparent filtering.',
        '<strong>Audit columns</strong>: add <code>CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()</code>, <code>UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()</code>, and optionally <code>CreatedBy / UpdatedBy</code> to every table. UpdatedAt must be maintained by the application or a trigger — it does not update automatically. These columns enable "changed since" sync queries and lightweight audit trails.',
        '<strong>Temporal tables</strong> (MSSQL 2016+ / PostgreSQL with extension): system-versioned tables automatically record every row version with a valid-from and valid-to timestamp. <code>ALTER TABLE Orders ADD … PERIOD FOR SYSTEM_TIME … WITH (SYSTEM_VERSIONING = ON)</code>. Query history with <code>FOR SYSTEM_TIME AS OF \'2024-01-01\'</code>. Full audit trail with zero application code — the engine handles all versioning.',
        '<strong>Schema evolution</strong>: prefer additive changes (adding nullable columns, new tables, new indexes) over destructive ones (dropping columns, changing types). Adding a NOT NULL column to a large table is a blocking operation in MSSQL — add nullable first, backfill with defaults, add the NOT NULL constraint separately. PostgreSQL 11+ makes adding a column with a constant default near-instant (no table rewrite); columns with volatile defaults still require a rewrite.',
      ],
    },
    {
      heading: 'Naming conventions and schema organisation',
      points: [
        'Pick a consistent casing convention and stick to it across the entire database: <strong>PascalCase</strong> for tables/columns (MSSQL common: <code>Orders</code>, <code>CustomerID</code>) or <strong>snake_case</strong> (PostgreSQL common: <code>orders</code>, <code>customer_id</code>). Mixed conventions are the main cause of schema readability issues in long-lived databases.',
        'Table names should be <strong>singular nouns</strong> (Order, Product, Customer) or <strong>plural nouns</strong> (Orders, Products) — pick one and never mix. Many ORMs default to plural table names; many DBA-authored schemas use singular. The convention matters less than consistency. Prefix lookup/reference tables: <code>ref_OrderStatuses</code>, <code>lkp_Countries</code>.',
        'FK column naming: <code>TableName + PK column name</code> — <code>CustomerID</code> on the Orders table references <code>CustomerID</code> on the Customers table. This makes FK relationships self-documenting. Avoid generic names like <code>ID</code> or <code>ParentID</code> — they require a schema diagram to understand.',
        'Use <strong>schemas</strong> (SQL Server) / <strong>schemas</strong> (PostgreSQL) to group related tables: <code>dbo.Orders</code>, <code>sales.Invoices</code>, <code>hr.Employees</code>. Schemas provide a namespace, enable permission grants at the schema level, and allow multiple logical domains to coexist in one database without name collisions. In MSSQL, the <code>dbo</code> schema is the default; create domain schemas explicitly.',
        'Avoid reserved words as column or table names: <code>Date</code>, <code>Name</code>, <code>Status</code>, <code>Order</code>, <code>User</code> are SQL keywords in one or more dialects. Either avoid them (<code>OrderStatus</code>, <code>FullName</code>) or always bracket/quote them. Unquoted reserved-word names cause parse errors in some SQL dialects and break cross-platform portability.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Table DDL',
      language: 'sql',
      code: `-- Normalised e-commerce schema (3NF) with named constraints

CREATE TABLE Customers (
    CustomerID  INT           NOT NULL IDENTITY(1,1),
    Email       NVARCHAR(254) NOT NULL,
    FullName    NVARCHAR(200) NOT NULL,
    IsActive    BIT           NOT NULL DEFAULT 1,
    CreatedAt   DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt   DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Customers        PRIMARY KEY (CustomerID),
    CONSTRAINT UQ_Customers_Email  UNIQUE (Email)
);

CREATE TABLE Categories (
    CategoryID   INT           NOT NULL IDENTITY(1,1),
    CategoryName NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_Categories PRIMARY KEY (CategoryID)
);

CREATE TABLE Products (
    ProductID   INT            NOT NULL IDENTITY(1,1),
    CategoryID  INT            NOT NULL,
    ProductName NVARCHAR(200)  NOT NULL,
    UnitPrice   DECIMAL(10,2)  NOT NULL,
    Stock       INT            NOT NULL DEFAULT 0,
    IsDeleted   BIT            NOT NULL DEFAULT 0,
    CONSTRAINT PK_Products         PRIMARY KEY (ProductID),
    CONSTRAINT FK_Products_Category FOREIGN KEY (CategoryID)
        REFERENCES Categories (CategoryID),
    CONSTRAINT CHK_Products_Price  CHECK (UnitPrice > 0),
    CONSTRAINT CHK_Products_Stock  CHECK (Stock >= 0)
);
-- FK index — prevents full child-table scan on parent delete
CREATE INDEX IX_Products_CategoryID ON Products (CategoryID);

CREATE TABLE Orders (
    OrderID    BIGINT        NOT NULL IDENTITY(1,1),
    CustomerID INT           NOT NULL,
    OrderDate  DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    Status     VARCHAR(20)   NOT NULL DEFAULT 'Pending',
    Total      DECIMAL(12,2) NOT NULL DEFAULT 0,
    CONSTRAINT PK_Orders      PRIMARY KEY (OrderID),
    CONSTRAINT FK_Orders_Cust FOREIGN KEY (CustomerID)
        REFERENCES Customers (CustomerID),
    CONSTRAINT CHK_Orders_Status CHECK (Status IN ('Pending','Shipped','Completed','Cancelled'))
);
CREATE INDEX IX_Orders_CustomerID ON Orders (CustomerID);`,
    },
    {
      label: 'Soft delete & audit',
      language: 'sql',
      code: `-- ── Soft delete pattern ───────────────────────────────────────────────
-- Option A: boolean flag
ALTER TABLE Orders ADD IsDeleted BIT NOT NULL DEFAULT 0;

-- Option B: timestamp (also records when)
ALTER TABLE Orders ADD DeletedAt DATETIME2 NULL;   -- NULL = not deleted

-- "Delete" a row (soft)
UPDATE Orders SET IsDeleted = 1 WHERE OrderID = 999;
UPDATE Orders SET DeletedAt = SYSUTCDATETIME() WHERE OrderID = 999;

-- Filtered index for active rows: smaller, faster seeks
CREATE INDEX IX_Orders_Active
    ON Orders (CustomerID, OrderDate DESC)
    WHERE IsDeleted = 0;

-- View that hides deleted rows — app code queries the view
CREATE VIEW vw_ActiveOrders AS
    SELECT * FROM Orders WHERE IsDeleted = 0;

-- ── Audit columns ──────────────────────────────────────────────────────
-- Add to every table during initial DDL:
ALTER TABLE Products
    ADD CreatedAt  DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt  DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
        CreatedBy  NVARCHAR(100) NULL,
        UpdatedBy  NVARCHAR(100) NULL;

-- UpdatedAt trigger (MSSQL): auto-maintain UpdatedAt on every UPDATE
CREATE OR ALTER TRIGGER trg_Products_UpdatedAt
ON Products AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Products
    SET UpdatedAt = SYSUTCDATETIME()
    WHERE ProductID IN (SELECT ProductID FROM Inserted);
END;

-- ── Temporal table (MSSQL 2016+): full row history automatically ───────
ALTER TABLE Orders
    ADD ValidFrom DATETIME2 GENERATED ALWAYS AS ROW START NOT NULL DEFAULT '0001-01-01',
        ValidTo   DATETIME2 GENERATED ALWAYS AS ROW END   NOT NULL DEFAULT '9999-12-31',
        PERIOD FOR SYSTEM_TIME (ValidFrom, ValidTo);

ALTER TABLE Orders
    SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.OrdersHistory));

-- Query as-of a past point in time:
SELECT * FROM Orders FOR SYSTEM_TIME AS OF '2024-06-01 00:00:00';`,
    },
    {
      label: 'ALTER TABLE / migration',
      language: 'sql',
      code: `-- ── Additive changes (safe, non-blocking on small tables) ────────────
ALTER TABLE Customers ADD PhoneNumber NVARCHAR(20) NULL;   -- nullable = instant
ALTER TABLE Products  ADD SKU VARCHAR(50) NULL;

-- Add a named CHECK constraint
ALTER TABLE Products
    ADD CONSTRAINT CHK_Products_SKU CHECK (SKU IS NULL OR LEN(SKU) >= 3);

-- ── Adding NOT NULL to a large table (safe multi-step pattern) ────────
-- Step 1: add nullable with a default (instant — no data rewrite)
ALTER TABLE Orders ADD ShipRegion VARCHAR(50) NULL DEFAULT 'NA';

-- Step 2: backfill existing rows (in batches to avoid long locks)
UPDATE TOP (5000) Orders SET ShipRegion = 'NA' WHERE ShipRegion IS NULL;
-- Repeat until 0 rows updated...

-- Step 3: add the NOT NULL constraint (now all rows have a value)
ALTER TABLE Orders ALTER COLUMN ShipRegion VARCHAR(50) NOT NULL;

-- ── Rename objects (MSSQL) ─────────────────────────────────────────────
EXEC sp_rename 'Products.ProductName', 'Name', 'COLUMN';
EXEC sp_rename 'Products', 'Catalogue', 'OBJECT';

-- ── Rename (PostgreSQL) ────────────────────────────────────────────────
ALTER TABLE products RENAME COLUMN product_name TO name;
ALTER TABLE products RENAME TO catalogue;

-- ── Drop + recreate constraint ─────────────────────────────────────────
-- Named constraints are dropped by name — no schema-discovery needed
ALTER TABLE Products DROP CONSTRAINT CHK_Products_Price;
ALTER TABLE Products ADD CONSTRAINT CHK_Products_Price CHECK (UnitPrice >= 0);`,
    },
    {
      label: 'Junction & lookup tables',
      language: 'sql',
      code: `-- ── Many-to-many: Products ↔ Tags ─────────────────────────────────────
CREATE TABLE Tags (
    TagID   INT           NOT NULL IDENTITY(1,1),
    TagName NVARCHAR(50)  NOT NULL,
    CONSTRAINT PK_Tags      PRIMARY KEY (TagID),
    CONSTRAINT UQ_Tags_Name UNIQUE (TagName)
);

CREATE TABLE ProductTags (
    ProductID INT NOT NULL,
    TagID     INT NOT NULL,
    AddedAt   DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_ProductTags PRIMARY KEY (ProductID, TagID),
    CONSTRAINT FK_PT_Product  FOREIGN KEY (ProductID) REFERENCES Products (ProductID) ON DELETE CASCADE,
    CONSTRAINT FK_PT_Tag      FOREIGN KEY (TagID)     REFERENCES Tags (TagID)
);
-- Second FK needs its own index (first FK is covered by the composite PK leading with ProductID):
CREATE INDEX IX_ProductTags_TagID ON ProductTags (TagID);

-- ── Lookup / reference table (type-safe controlled vocabulary) ─────────
-- Prefer over CHECK (status IN (...)) for large/changeable value sets
CREATE TABLE OrderStatuses (
    StatusCode  VARCHAR(20)   NOT NULL,
    Description NVARCHAR(100) NOT NULL,
    IsActive    BIT           NOT NULL DEFAULT 1,
    SortOrder   TINYINT       NOT NULL DEFAULT 99,
    CONSTRAINT PK_OrderStatuses PRIMARY KEY (StatusCode)
);

-- FK to lookup table: enforces validity without hardcoded CHECK constraint
ALTER TABLE Orders ADD
    CONSTRAINT FK_Orders_Status FOREIGN KEY (Status) REFERENCES OrderStatuses (StatusCode);

-- ── Hierarchical self-referencing table (category tree) ───────────────
CREATE TABLE Categories (
    CategoryID   INT           NOT NULL IDENTITY(1,1),
    ParentID     INT           NULL,     -- NULL = root category
    CategoryName NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_Categories      PRIMARY KEY (CategoryID),
    CONSTRAINT FK_Cat_Parent       FOREIGN KEY (ParentID) REFERENCES Categories (CategoryID)
);
CREATE INDEX IX_Categories_ParentID ON Categories (ParentID);`,
    },
    {
      label: 'PostgreSQL schema design',
      language: 'sql',
      code: `-- ── snake_case, TEXT, TIMESTAMPTZ, GENERATED IDENTITY ─────────────────
CREATE TABLE customers (
    customer_id  INT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email        TEXT         NOT NULL,
    full_name    TEXT         NOT NULL,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),   -- stored as UTC
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_customers_email UNIQUE (email)
);

CREATE TABLE products (
    product_id   INT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id  INT          NOT NULL REFERENCES categories(category_id),
    product_name TEXT         NOT NULL,
    unit_price   NUMERIC(10,2) NOT NULL CHECK (unit_price > 0),
    stock        INT          NOT NULL DEFAULT 0 CHECK (stock >= 0),
    deleted_at   TIMESTAMPTZ  NULL     -- NULL = active; timestamp = soft-deleted
);
CREATE INDEX ix_products_category ON products (category_id);
CREATE INDEX ix_products_active   ON products (category_id, unit_price)
    WHERE deleted_at IS NULL;          -- partial index — only active products

-- ── UUID primary key (PG 13+: built-in gen_random_uuid()) ─────────────
CREATE TABLE events (
    event_id   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT         NOT NULL,
    payload    JSONB        NOT NULL DEFAULT '{}',
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── updated_at trigger (PostgreSQL) ────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Check constraint for enum-like validity ────────────────────────────
ALTER TABLE orders
    ADD CONSTRAINT chk_orders_status
    CHECK (status IN ('pending','shipped','completed','cancelled'));

-- Or use a PostgreSQL native ENUM type:
CREATE TYPE order_status AS ENUM ('pending','shipped','completed','cancelled');
ALTER TABLE orders ALTER COLUMN status TYPE order_status USING status::order_status;`,
    },
    {
      label: 'Naming conventions',
      language: 'sql',
      code: `-- ── MSSQL: PascalCase convention ──────────────────────────────────────
-- Tables:      PascalCase, singular noun (Order, Product, Customer)
-- Columns:     PascalCase (CustomerID, FullName, CreatedAt)
-- PKs:         PK_TableName
-- FKs:         FK_ChildTable_ParentTable (or FK_ChildTable_ColumnRef)
-- UQ:          UQ_TableName_ColumnName
-- CHECK:       CHK_TableName_RuleName
-- Indexes:     IX_TableName_Column1_Column2
-- Schemas:     dbo (default), sales, hr, ref (lookup tables)

-- ── PostgreSQL: snake_case convention ─────────────────────────────────
-- Tables:      snake_case, plural (orders, products, customers)
-- Columns:     snake_case (customer_id, full_name, created_at)
-- PKs:         pk_table_name  or just rely on DEFAULT naming
-- FKs:         fk_child_parent
-- UQ:          uq_table_column
-- Indexes:     ix_table_column1_column2

-- ── Reserved-word avoidance examples ──────────────────────────────────
-- ❌ Avoid these as identifiers — they are SQL reserved words:
--    date, name, order, user, group, table, key, value, type, schema

-- ✅ Safe alternatives:
CREATE TABLE users_account (      -- not "user" — reserved in MSSQL
    account_id INT PRIMARY KEY,
    full_name  TEXT NOT NULL,     -- not "name"
    order_count INT DEFAULT 0,    -- not a column named "order"
    account_type TEXT NOT NULL    -- not "type"
);

-- ── Schema-level organisation (SQL Server) ────────────────────────────
CREATE SCHEMA sales;
CREATE SCHEMA hr;
CREATE SCHEMA ref;

CREATE TABLE ref.OrderStatuses ( StatusCode VARCHAR(20) PRIMARY KEY, ... );
CREATE TABLE sales.Orders      ( OrderID BIGINT PRIMARY KEY, ... );
CREATE TABLE hr.Employees      ( EmployeeID INT PRIMARY KEY, ... );

-- Grant EXECUTE on stored procedures by schema:
GRANT EXECUTE ON SCHEMA::sales TO AppRole;`,
    },
  ];

  challenge: Challenge = {
    title: 'Design a Library Schema',
    language: 'sql',
    description: `Design a normalised (3NF) schema for a library system:
<ul>
<li>Books have a title, ISBN (unique business key), and publication year</li>
<li>Books can have multiple authors; Authors have a name and country</li>
<li>Members have a name, email (unique), and join date</li>
<li>Loans track which member borrowed which book, borrow date, due date, and optional return date</li>
<li>Add soft delete support on Loans (deleted_at)</li>
</ul>`,
    hints: [
      'Books ↔ Authors is many-to-many — add a BookAuthors junction table with a composite PK',
      'ISBN should be VARCHAR(13) UNIQUE — business key alongside a surrogate INT PK',
      'ReturnDate/deleted_at should be NULLable — the row may not be returned/deleted yet',
      'Add FK indexes on all foreign key columns in Loans and BookAuthors',
      'Name all constraints with the PK_/FK_/UQ_/CHK_ prefix convention',
    ],
    starterCode: `CREATE TABLE Books    ( ... );
CREATE TABLE Authors  ( ... );
CREATE TABLE BookAuthors ( ... );   -- junction
CREATE TABLE Members  ( ... );
CREATE TABLE Loans    ( ... );      -- include soft delete`,
    solution: `CREATE TABLE Authors (
    AuthorID  INT           NOT NULL IDENTITY(1,1),
    FullName  NVARCHAR(200) NOT NULL,
    Country   NVARCHAR(100) NULL,
    CONSTRAINT PK_Authors PRIMARY KEY (AuthorID)
);

CREATE TABLE Books (
    BookID   INT           NOT NULL IDENTITY(1,1),
    ISBN     VARCHAR(13)   NOT NULL,   -- business key; not the PK
    Title    NVARCHAR(400) NOT NULL,
    PubYear  SMALLINT      NULL,
    CONSTRAINT PK_Books     PRIMARY KEY (BookID),
    CONSTRAINT UQ_Books_ISBN UNIQUE (ISBN),
    CONSTRAINT CHK_Books_Year CHECK (PubYear BETWEEN 1000 AND 2100)
);

CREATE TABLE BookAuthors (
    BookID   INT NOT NULL,
    AuthorID INT NOT NULL,
    CONSTRAINT PK_BookAuthors PRIMARY KEY (BookID, AuthorID),
    CONSTRAINT FK_BA_Book    FOREIGN KEY (BookID)   REFERENCES Books   (BookID),
    CONSTRAINT FK_BA_Author  FOREIGN KEY (AuthorID) REFERENCES Authors (AuthorID)
);
CREATE INDEX IX_BookAuthors_AuthorID ON BookAuthors (AuthorID);  -- second FK

CREATE TABLE Members (
    MemberID INT           NOT NULL IDENTITY(1,1),
    FullName NVARCHAR(200) NOT NULL,
    Email    NVARCHAR(254) NOT NULL,
    JoinDate DATE          NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    CONSTRAINT PK_Members        PRIMARY KEY (MemberID),
    CONSTRAINT UQ_Members_Email  UNIQUE (Email)
);

CREATE TABLE Loans (
    LoanID     BIGINT       NOT NULL IDENTITY(1,1),
    BookID     INT          NOT NULL,
    MemberID   INT          NOT NULL,
    BorrowDate DATE         NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    DueDate    DATE         NOT NULL,
    ReturnDate DATE         NULL,       -- NULL until returned
    DeletedAt  DATETIME2    NULL,       -- soft delete; NULL = active
    CONSTRAINT PK_Loans      PRIMARY KEY (LoanID),
    CONSTRAINT FK_Loans_Book FOREIGN KEY (BookID)   REFERENCES Books   (BookID),
    CONSTRAINT FK_Loans_Mbr  FOREIGN KEY (MemberID) REFERENCES Members (MemberID),
    CONSTRAINT CHK_Loans_Due CHECK (DueDate > BorrowDate)
);
CREATE INDEX IX_Loans_BookID   ON Loans (BookID);
CREATE INDEX IX_Loans_MemberID ON Loans (MemberID);
-- Filtered index for active loans:
CREATE INDEX IX_Loans_Active ON Loans (MemberID, DueDate) WHERE DeletedAt IS NULL;`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'A table has columns: OrderID (PK), ProductID (PK), ProductName, Price. ProductName depends only on ProductID, not on (OrderID, ProductID). Which normal form is violated?',
      options: ['1NF — atomic values', '2NF — partial dependency on the composite PK', '3NF — transitive dependency', 'BCNF — determinant is not a candidate key'],
      answer: 1,
      explanation: '2NF: every non-key column must depend on the entire primary key. ProductName depends only on ProductID (part of the composite key), not the full (OrderID, ProductID) key. Fix: move ProductName to a Products table keyed by ProductID.',
    },
    {
      q: 'Why should you add an index on foreign key columns?',
      options: [
        'SQL Server creates FK indexes automatically',
        'FK columns must be indexed to enforce the constraint',
        'Without an index, deleting a parent row causes a full table scan of the child table to check referential integrity, and JOINs are slow',
        'Indexes on FK columns are only needed for performance, not correctness',
      ],
      answer: 2,
      explanation: 'SQL Server does NOT automatically create indexes on FK columns. Without an index, any DELETE or UPDATE on the parent triggers a full scan of the child table to check for referencing rows. JOINs on FK relationships also need the index for efficient seeks. Always add a non-clustered index on every FK column.',
    },
    {
      q: 'Which data type should you use for monetary values?',
      options: ['FLOAT — high precision floating point', 'REAL — 4-byte float', 'DECIMAL(p,s) or NUMERIC(p,s) — exact arithmetic', 'MONEY — SQL Server proprietary exact type'],
      answer: 2,
      explanation: 'FLOAT and REAL use binary floating-point representation and introduce rounding errors (0.1 + 0.2 may not exactly equal 0.3). DECIMAL/NUMERIC are exact and cross-platform. SQL Server\'s MONEY type is also exact but only has 4 decimal places and is not portable — DECIMAL(19,4) is the better choice.',
    },
    {
      q: 'What is the main downside of using random UUID (V4) as a clustered primary key?',
      options: [
        'UUIDs cannot be used as primary keys',
        'Random UUIDs cause severe clustered index fragmentation because inserts scatter across all existing pages instead of appending to the end',
        'UUID keys are slower for JOINs because they are text',
        'SQL Server does not support UUID types',
      ],
      answer: 1,
      explanation: 'Random UUID inserts hit arbitrary positions in the B-tree, causing page splits throughout the entire index. Every split leaves two half-empty pages and generates I/O. INT IDENTITY or NEWSEQUENTIALID() (SQL Server) / UUIDv7 (PostgreSQL) generate roughly monotonic values that append near the end, eliminating fragmentation from inserts.',
    },
    {
      q: 'What is the soft delete pattern and what is its main tradeoff?',
      options: [
        'Soft delete uses CASCADE DELETE; the tradeoff is losing child rows',
        'Soft delete marks rows with a flag (IsDeleted/DeletedAt) instead of removing them; the tradeoff is that all queries must filter out deleted rows or they appear in results',
        'Soft delete archives rows to a history table; the tradeoff is storage cost',
        'Soft delete disables the PK constraint temporarily; the tradeoff is integrity risk',
      ],
      answer: 1,
      explanation: 'Soft delete retains the row with IsDeleted = 1 or DeletedAt = timestamp, preserving audit history, FK references, and recoverability. The tradeoff: every query that should return only active data must explicitly filter deleted rows — missing the filter returns "deleted" data silently. Use views and filtered indexes to enforce the filter automatically.',
    },
    {
      q: 'Why should constraints be named explicitly (e.g., CONSTRAINT PK_Orders PRIMARY KEY)?',
      options: [
        'Named constraints are required by the SQL standard — unnamed constraints cause errors',
        'Named constraints can be dropped by name with ALTER TABLE … DROP CONSTRAINT name; unnamed constraints get system-generated names that differ between environments, making migration scripts unreliable',
        'Named constraints have better performance',
        'Unnamed constraints do not enforce their rules',
      ],
      answer: 1,
      explanation: 'SQL Server and PostgreSQL generate names like FK__Orders__CustomerID__3D5E1FD2 for unnamed constraints — different each time the schema is created. ALTER TABLE … DROP CONSTRAINT with a generated name breaks in other environments (dev, staging, prod). Named constraints (PK_Orders, FK_Orders_Cust) make DROP/ALTER scripts portable and readable.',
    },
    {
      q: 'When should you denormalise a schema?',
      options: [
        'Always — denormalised schemas are always faster than normalised ones',
        'During initial design — normalising first wastes time you\'ll spend denormalising later',
        'After profiling shows that JOIN overhead is a proven bottleneck in the production workload',
        'When the table has more than 1 million rows',
      ],
      answer: 2,
      explanation: 'Normalise first — normalised schemas have fewer data anomalies, easier updates, and smaller storage. Denormalise only when profiling an actual production workload proves that JOIN cost (not just estimated join cost) is a measurable bottleneck, and only in the specific area that needs it. Premature denormalisation adds data redundancy and update anomalies for unproven gains.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use a surrogate key or a natural key as the primary key?',
      a: 'Prefer surrogate keys (INT IDENTITY, BIGINT IDENTITY, or SEQUENCE) for most tables. Natural keys (email, ISBN, SSN) often change over time — an email address change cascades to every FK that references it. Surrogate keys are immutable and narrow (4–8 bytes), and the ever-increasing insert pattern avoids clustered index fragmentation. Use natural keys as UNIQUE constraints alongside the surrogate PK to enforce business uniqueness — they can be used by the application without exposing the internal ID.',
    },
    {
      q: 'When should I use UUID/GUID as a primary key?',
      a: 'UUIDs are useful when IDs must be generated client-side (offline-capable apps), across multiple distributed nodes without a central sequence, or when rows from multiple services are merged into one table. The downside: 16 bytes vs 4 for INT — every non-clustered index must carry the clustered key as a row locator, so UUID-keyed tables have wider indexes. Random UUID (V4) also causes severe clustered index fragmentation. Mitigations: use <code>NEWSEQUENTIALID()</code> in SQL Server or UUIDv7 in PostgreSQL (time-ordered). For single-database, single-region applications, INT/BIGINT IDENTITY is almost always preferable.',
    },
    {
      q: 'What is the difference between a UNIQUE constraint and a UNIQUE index?',
      a: 'In both SQL Server and PostgreSQL, a UNIQUE constraint is implemented as a unique B-tree index internally — they are the same physical structure. The constraint is the logical declaration; the index is the storage mechanism. Prefer the constraint syntax (<code>CONSTRAINT UQ_table_col UNIQUE (col)</code>) in CREATE TABLE DDL — it is more explicit, can be named, and can be dropped by name. Creating a unique index directly (<code>CREATE UNIQUE INDEX</code>) is equivalent but is idiomatic for indexes added outside the initial table definition.',
    },
    {
      q: 'Is it always bad to store comma-separated values in a column?',
      a: 'Yes for relational data. CSV columns violate 1NF: the value is not atomic, the column cannot be indexed for individual values, filtering requires LIKE \'%value%\' (non-sargable), and counting/joining on list members requires string parsing. Use a junction table instead. The exception: schema-flexible JSONB columns (PostgreSQL) or XML columns when the structure is intentionally variable, queried as a document, and indexed via GIN — these are not storing "relational" data in a CSV, they are storing structured documents with their own query semantics.',
    },
    {
      q: 'How do I safely add a NOT NULL column to a large production table without downtime?',
      a: 'In SQL Server: (1) Add the column nullable with a DEFAULT: <code>ALTER TABLE t ADD col VARCHAR(50) NULL DEFAULT \'value\'</code> — instant, no table rewrite. (2) Backfill existing NULLs in small batches to avoid long locks: <code>UPDATE TOP(5000) t SET col = \'value\' WHERE col IS NULL</code> — repeat until complete. (3) Add the NOT NULL constraint: <code>ALTER TABLE t ALTER COLUMN col VARCHAR(50) NOT NULL</code> — validates all rows. Step 3 may still lock briefly. In PostgreSQL 11+, adding a column with a constant DEFAULT is instantaneous (no table rewrite — the default is stored in the catalog). Adding NOT NULL still requires a CHECK pass in PG; use <code>NOT VALID</code> + <code>VALIDATE CONSTRAINT</code> to defer it.',
    },
    {
      q: 'Why should I use DATETIME2 instead of DATETIME in SQL Server?',
      a: '<code>DATETIME2</code> is strictly better than the legacy <code>DATETIME</code> type: wider date range (0001-01-01 to 9999-12-31 vs 1753-01-01 to 9999-12-31), higher precision (100 nanoseconds vs ~3.33 milliseconds), variable storage (6–8 bytes depending on precision vs always 8 bytes), and ANSI/ISO SQL compliance. The only reason to use DATETIME is compatibility with legacy code or drivers that cannot handle DATETIME2. For new tables, always use DATETIME2(n) — <code>DATETIME2(0)</code> for second-level precision (6 bytes) or <code>DATETIME2(7)</code> for full 100ns precision (8 bytes).',
    },
    {
      q: 'What is a temporal table and when should I use it?',
      a: 'A system-versioned temporal table (SQL Server 2016+ / PostgreSQL with pg_temporal extension) automatically records every row version with a system-maintained valid-from/valid-to timestamp pair. Every INSERT/UPDATE/DELETE writes the previous row version to a history table. Query it with <code>FOR SYSTEM_TIME AS OF \'2024-01-01\'</code> to see the state at any past point. Use it for: regulatory audit requirements, "undo" functionality, slowly-changing-dimension history, and debugging production data issues after the fact. Zero application code needed — the engine handles all versioning. Downside: history table grows without bound — plan a retention/archival strategy.',
    },
  ];
}
