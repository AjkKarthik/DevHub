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
    { name: 'PRIMARY KEY',   type: 'constraint', desc: 'Uniquely identifies each row; automatically creates a clustered index in MSSQL', since: 'SQL-92' },
    { name: 'FOREIGN KEY',   type: 'constraint', desc: 'Enforces referential integrity — child value must exist in the parent table', since: 'SQL-92' },
    { name: 'UNIQUE',        type: 'constraint', desc: 'Ensures all values in the column(s) are distinct; allows one NULL (MSSQL)', since: 'SQL-92' },
    { name: 'CHECK',         type: 'constraint', desc: 'Validates column values against a Boolean expression at write time', since: 'SQL-92' },
    { name: 'NOT NULL',      type: 'constraint', desc: 'Prevents NULL values in the column; declare explicitly for clarity', since: 'SQL-92' },
    { name: 'DEFAULT',       type: 'constraint', desc: 'Supplies a value when INSERT omits the column', since: 'SQL-92' },
    { name: 'INT / BIGINT',  type: 'type',       desc: 'BIGINT for large tables (> 2 billion rows); INT is 4 bytes, BIGINT is 8 bytes', since: 'SQL-92' },
    { name: 'VARCHAR(n)',    type: 'type',       desc: 'Variable-length character string; NVARCHAR for Unicode; max 8000 bytes (VARCHAR), 4000 chars (NVARCHAR)', since: 'SQL-92' },
    { name: 'DECIMAL(p,s)',  type: 'type',       desc: 'Exact numeric for money/quantities; avoid FLOAT for financial values', since: 'SQL-92' },
    { name: 'DATETIME2',     type: 'type',       desc: 'MSSQL: prefer DATETIME2 over DATETIME (wider range, 100ns precision)', since: 'MSSQL 2008' },
    { name: '1NF',           type: 'keyword',    desc: 'First normal form: atomic values, no repeating groups, a primary key', since: 'Codd 1970' },
    { name: '3NF',           type: 'keyword',    desc: 'Third normal form: no transitive dependencies on non-key columns', since: 'Codd 1971' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Normalisation — 1NF through 3NF',
      points: [
        '<strong>1NF</strong>: each column holds a single atomic value (no comma-separated lists), there are no repeating column groups (no Phone1, Phone2…), and the table has a primary key.',
        '<strong>2NF</strong>: the table is in 1NF and every non-key column is fully dependent on the <em>whole</em> primary key. Violations only occur with composite PKs — if a column depends only on part of the key, split it into its own table.',
        '<strong>3NF</strong>: the table is in 2NF and no non-key column determines another non-key column (no transitive dependencies). Example: if a table has ZipCode and City, and City depends on ZipCode (not the PK), split City into a Zip table.',
        'Target 3NF for OLTP schemas. Denormalise selectively for read-heavy reporting tables — only after measuring that the JOIN cost is a real bottleneck.',
      ],
    },
    {
      heading: 'Constraints — integrity at the database level',
      points: [
        '<strong>PRIMARY KEY</strong>: every table should have one. Prefer a surrogate key (auto-increment INT/BIGINT or GUID) over natural keys that may change. Narrow keys keep index sizes small.',
        '<strong>FOREIGN KEY</strong>: enforces that child rows reference existing parent rows. Also add an index on the FK column to avoid full child-table scans when deleting/updating a parent.',
        '<strong>CHECK</strong>: enforce domain rules at the DB layer: <code>CHECK (Price > 0)</code>, <code>CHECK (Status IN (\'Active\', \'Inactive\'))</code>. These run on every INSERT/UPDATE — they are cheaper than application-layer validation for simple rules.',
        '<strong>UNIQUE</strong>: use for business keys (email, SSN) that must be unique but are not the PK. In SQL Server, a UNIQUE constraint allows a single NULL (multiple NULLs in PostgreSQL); in PostgreSQL, UNIQUE also creates an index.',
      ],
    },
    {
      heading: 'Data type selection',
      points: [
        'Use the <strong>smallest correct type</strong>. A TINYINT (1 byte, 0–255) wastes less space than INT (4 bytes) for status codes. Narrower types fit more rows per page, reducing I/O.',
        'Money/price: use <code>DECIMAL(p, s)</code> (or NUMERIC) — exact. Never use FLOAT/REAL for financial values — they have rounding errors.',
        'Dates: SQL Server — prefer <code>DATETIME2(7)</code> over DATETIME (wider range, configurable precision, smaller storage for lower precision). PostgreSQL — <code>TIMESTAMPTZ</code> stores UTC and converts on retrieval.',
        'Strings: <code>VARCHAR(n)</code> for ASCII; <code>NVARCHAR(n)</code> for Unicode. Avoid <code>VARCHAR(MAX)</code> / <code>NVARCHAR(MAX)</code> unless truly needed — they cannot be indexed normally and have different I/O characteristics.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Table DDL',
      language: 'sql',
      code: `-- Normalised e-commerce schema (3NF)

CREATE TABLE Customers (
    CustomerID  INT           NOT NULL IDENTITY(1,1),
    Email       NVARCHAR(254) NOT NULL,
    FullName    NVARCHAR(200) NOT NULL,
    CreatedAt   DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Customers  PRIMARY KEY (CustomerID),
    CONSTRAINT UQ_Customers_Email UNIQUE (Email)
);

CREATE TABLE Products (
    ProductID   INT            NOT NULL IDENTITY(1,1),
    CategoryID  INT            NOT NULL,
    ProductName NVARCHAR(200)  NOT NULL,
    UnitPrice   DECIMAL(10,2)  NOT NULL CHECK (UnitPrice > 0),
    Stock       INT            NOT NULL DEFAULT 0 CHECK (Stock >= 0),
    CONSTRAINT PK_Products    PRIMARY KEY (ProductID),
    CONSTRAINT FK_Products_Category FOREIGN KEY (CategoryID)
        REFERENCES Categories (CategoryID)
);

CREATE TABLE Orders (
    OrderID    BIGINT       NOT NULL IDENTITY(1,1),
    CustomerID INT          NOT NULL,
    OrderDate  DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    Status     VARCHAR(20)  NOT NULL DEFAULT 'Pending'
               CHECK (Status IN ('Pending','Shipped','Cancelled')),
    CONSTRAINT PK_Orders      PRIMARY KEY (OrderID),
    CONSTRAINT FK_Orders_Cust FOREIGN KEY (CustomerID)
        REFERENCES Customers (CustomerID)
);

-- FK index — prevents full scan on parent delete
CREATE INDEX IX_Orders_CustomerID ON Orders (CustomerID);`,
    },
    {
      label: 'ALTER TABLE',
      language: 'sql',
      code: `-- Add a column with a default
ALTER TABLE Customers
    ADD IsActive BIT NOT NULL DEFAULT 1;

-- Add a CHECK constraint
ALTER TABLE Products
    ADD CONSTRAINT CHK_MaxPrice CHECK (UnitPrice < 100000);

-- Drop a constraint
ALTER TABLE Products
    DROP CONSTRAINT CHK_MaxPrice;

-- Rename a column (MSSQL)
EXEC sp_rename 'Products.ProductName', 'Name', 'COLUMN';

-- Rename a column (PostgreSQL)
ALTER TABLE products RENAME COLUMN product_name TO name;

-- Change data type (careful with existing data)
ALTER TABLE Customers
    ALTER COLUMN FullName NVARCHAR(400) NOT NULL;`,
    },
    {
      label: 'Junction & Lookup tables',
      language: 'sql',
      code: `-- Many-to-many: Products ↔ Tags
CREATE TABLE ProductTags (
    ProductID INT NOT NULL,
    TagID     INT NOT NULL,
    CONSTRAINT PK_ProductTags PRIMARY KEY (ProductID, TagID),
    CONSTRAINT FK_PT_Product  FOREIGN KEY (ProductID) REFERENCES Products (ProductID) ON DELETE CASCADE,
    CONSTRAINT FK_PT_Tag      FOREIGN KEY (TagID)     REFERENCES Tags (TagID)
);

-- Lookup / reference table (type-safe status codes)
CREATE TABLE OrderStatuses (
    StatusCode  VARCHAR(20) NOT NULL,
    Description NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_OrderStatuses PRIMARY KEY (StatusCode)
);
INSERT INTO OrderStatuses VALUES ('Pending','Order placed, not yet shipped');
INSERT INTO OrderStatuses VALUES ('Shipped','In transit');
INSERT INTO OrderStatuses VALUES ('Cancelled','Cancelled by customer or admin');`,
    },
  ];

  challenge: Challenge = {
    title: 'Design a Library Schema',
    language: 'sql',
    description: `Design a normalised schema for a library system with these requirements:
- Books have a title, ISBN (unique), publication year, and can have multiple authors
- Authors have a name and country
- Members have a name, email (unique), and join date
- Loans track which member borrowed which book, on what date, and the due/return dates

Write the CREATE TABLE statements with appropriate constraints and data types.`,
    hints: [
      'Books ↔ Authors is many-to-many — you need a junction table (BookAuthors)',
      'ISBN should be VARCHAR(13) and UNIQUE — it is a business key, not the PK',
      'Loan return date should be NULLable — the book may not be returned yet',
      'Add FK indexes on all foreign key columns',
    ],
    starterCode: `-- Books table
CREATE TABLE Books ( ... );

-- Authors table
CREATE TABLE Authors ( ... );

-- Junction table
CREATE TABLE BookAuthors ( ... );

-- Members table
CREATE TABLE Members ( ... );

-- Loans table
CREATE TABLE Loans ( ... );`,
    solution: `CREATE TABLE Authors (
    AuthorID  INT          NOT NULL IDENTITY(1,1),
    FullName  NVARCHAR(200) NOT NULL,
    Country   NVARCHAR(100) NULL,
    CONSTRAINT PK_Authors PRIMARY KEY (AuthorID)
);

CREATE TABLE Books (
    BookID      INT           NOT NULL IDENTITY(1,1),
    ISBN        VARCHAR(13)   NOT NULL,
    Title       NVARCHAR(400) NOT NULL,
    PubYear     SMALLINT      NULL CHECK (PubYear BETWEEN 1000 AND 2100),
    CONSTRAINT PK_Books     PRIMARY KEY (BookID),
    CONSTRAINT UQ_Books_ISBN UNIQUE (ISBN)
);

CREATE TABLE BookAuthors (
    BookID   INT NOT NULL,
    AuthorID INT NOT NULL,
    CONSTRAINT PK_BookAuthors PRIMARY KEY (BookID, AuthorID),
    CONSTRAINT FK_BA_Book   FOREIGN KEY (BookID)   REFERENCES Books (BookID),
    CONSTRAINT FK_BA_Author FOREIGN KEY (AuthorID) REFERENCES Authors (AuthorID)
);

CREATE TABLE Members (
    MemberID  INT           NOT NULL IDENTITY(1,1),
    FullName  NVARCHAR(200) NOT NULL,
    Email     NVARCHAR(254) NOT NULL,
    JoinDate  DATE          NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    CONSTRAINT PK_Members     PRIMARY KEY (MemberID),
    CONSTRAINT UQ_Members_Email UNIQUE (Email)
);

CREATE TABLE Loans (
    LoanID     BIGINT       NOT NULL IDENTITY(1,1),
    BookID     INT          NOT NULL,
    MemberID   INT          NOT NULL,
    BorrowDate DATE         NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    DueDate    DATE         NOT NULL,
    ReturnDate DATE         NULL,      -- NULL until returned
    CONSTRAINT PK_Loans      PRIMARY KEY (LoanID),
    CONSTRAINT FK_Loans_Book FOREIGN KEY (BookID)   REFERENCES Books (BookID),
    CONSTRAINT FK_Loans_Mbr  FOREIGN KEY (MemberID) REFERENCES Members (MemberID)
);
CREATE INDEX IX_Loans_BookID   ON Loans (BookID);
CREATE INDEX IX_Loans_MemberID ON Loans (MemberID);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'A Products table has columns: ProductID, CategoryID, CategoryName, Price. CategoryName depends on CategoryID, not on ProductID. Which normal form is violated?',
      options: ['1NF', '2NF', '3NF', 'BCNF'],
      answer: 2,
      explanation: '3NF: CategoryName is a non-key column that depends on CategoryID (another non-key column), creating a transitive dependency. Fix: move CategoryName to a Categories table.',
    },
    {
      q: 'Why should foreign key columns be indexed separately?',
      options: [
        'SQL Server creates an index automatically on FK columns',
        'To allow efficient seeks when checking referential integrity during parent delete/update, and for JOIN performance',
        'For enforcing the FK constraint at write time',
        'They do not need separate indexes',
      ],
      answer: 1,
      explanation: 'FK constraints do NOT automatically create indexes in SQL Server. Without an index, deleting/updating a parent row causes a full scan of the child table to check for referencing rows.',
    },
    {
      q: 'Which data type should you use for monetary values?',
      options: ['FLOAT', 'REAL', 'DECIMAL(p,s) or NUMERIC(p,s)', 'MONEY'],
      answer: 2,
      explanation: 'FLOAT and REAL use binary floating-point and have rounding errors (e.g. 0.1 + 0.2 ≠ 0.3 exactly). DECIMAL/NUMERIC are exact. MONEY is MSSQL-specific and has only 4 decimal places — DECIMAL(19,4) is more portable.',
    },
    {
      q: 'When should you denormalise a schema?',
      options: [
        'Always — denormalised schemas are always faster',
        'After measuring that JOIN overhead is a proven bottleneck in a production workload',
        'When the table has more than 1 million rows',
        'Before indexing',
      ],
      answer: 1,
      explanation: 'Normalise first; denormalise only when profiling shows a measurable performance problem that denormalisation solves. Premature denormalisation adds data redundancy and update anomalies for unproven gains.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use a surrogate key or a natural key as the primary key?',
      a: 'Prefer surrogate keys (auto-increment INT/BIGINT or UUID) for most tables. Natural keys (email, ISBN) change over time and cascade to all FK columns. Surrogate keys are immutable and narrow. Use natural keys as UNIQUE constraints alongside the surrogate PK.',
    },
    {
      q: 'When should I use UUID/GUID as a primary key?',
      a: 'UUIDs are useful when rows are generated in multiple places (distributed systems, client-generated IDs). The downside: they are 16 bytes vs 4 for INT — wider clustered index keys, more fragmentation with random GUIDs. In SQL Server use NEWSEQUENTIALID() to generate GUIDs that are roughly monotonically increasing. In PostgreSQL consider UUIDv7 or an integer sequence.',
    },
    {
      q: 'What is the difference between a UNIQUE constraint and a UNIQUE index?',
      a: 'In SQL Server and PostgreSQL, a UNIQUE constraint is implemented as a unique index internally — they are effectively the same thing. The constraint is the logical declaration; the index is the physical implementation. Prefer the constraint syntax in DDL for clarity.',
    },
    {
      q: 'Is it always bad to store comma-separated values in a column?',
      a: 'Yes for relational data. CSV columns violate 1NF, cannot be indexed efficiently, make JOIN and filtering awkward, and allow inconsistent data. Use a junction table instead. The only exceptions are schema-less JSONB/XML columns where the structure is intentionally variable and queried as a document.',
    },
  ];
}
