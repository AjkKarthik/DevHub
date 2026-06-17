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
  selector: 'app-sql-rdbms-concepts',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './rdbms-concepts.html',
  styleUrl: './rdbms-concepts.scss',
})
export class SqlRdbmsConcepts {

  quickRef: QuickRefItem[] = [
    { name: 'Relation',              type: 'keyword',    desc: 'A table — a set of tuples (rows) sharing the same attributes (columns). No duplicate rows; no inherent ordering.' },
    { name: 'Tuple',                 type: 'keyword',    desc: 'A single row in a relation. Corresponds to one entity instance.' },
    { name: 'Attribute',             type: 'keyword',    desc: 'A column — the smallest named unit of data. Each attribute has a domain (set of valid values).' },
    { name: 'Primary Key',           type: 'constraint', desc: 'The chosen candidate key that uniquely identifies every row. Cannot be NULL; auto-creates a unique index.' },
    { name: 'Foreign Key',           type: 'constraint', desc: 'Column(s) whose values must match a PK in the parent table (or be NULL). Enforces referential integrity.' },
    { name: 'Referential Integrity', type: 'constraint', desc: 'FK values must exist in the referenced table. Prevents orphaned child rows.' },
    { name: 'Superkey',              type: 'keyword',    desc: 'Any set of attributes that uniquely identifies a row — may have redundant attributes.' },
    { name: 'Candidate Key',         type: 'keyword',    desc: 'A minimal superkey — no attribute can be removed and still guarantee uniqueness.' },
    { name: 'Domain',                type: 'keyword',    desc: 'The set of permitted values for an attribute — enforced by data type, NOT NULL, and CHECK constraints.' },
    { name: 'Surrogate Key',         type: 'keyword',    desc: 'System-generated PK (IDENTITY / SERIAL / UUID) with no business meaning. Immutable and compact.' },
    { name: 'Natural Key',           type: 'keyword',    desc: 'PK made of real-world attributes (email, ISBN). Meaningful but can change — better as a UNIQUE constraint alongside a surrogate PK.' },
    { name: 'Cardinality',           type: 'keyword',    desc: 'Dual meaning: (1) number of rows in a table; (2) relationship multiplicity (1:1, 1:N, M:N).' },
    { name: 'UNION / INTERSECT / EXCEPT', type: 'keyword', desc: 'Set operators on result sets: UNION (all rows from both), INTERSECT (rows in both), EXCEPT (rows in left but not right)' },
    { name: 'ACID',                  type: 'keyword',    desc: 'Atomicity, Consistency, Isolation, Durability — the four transaction guarantees provided by RDBMS engines' },
    { name: 'CAP theorem',           type: 'keyword',    desc: 'Distributed systems can guarantee at most 2 of 3: Consistency, Availability, Partition tolerance' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The relational model — sets, tuples, and SQL',
      points: [
        'Proposed by E.F. Codd in 1970: represent all data as relations (tables), manipulate them with relational algebra (SELECT, PROJECT, JOIN, UNION…), and query them with a declarative language. SQL is the standardised realisation of that language — you describe <em>what</em> data you want, not <em>how</em> to retrieve it.',
        'A relation is a mathematical <strong>set</strong> of tuples — sets have no duplicate members and no inherent ordering. SQL allows duplicates in practice (a bag, not a set) because eliminating duplicates requires an expensive sort/hash. Use <code>DISTINCT</code> to enforce strict set semantics.',
        'Columns are <strong>named, not positional</strong>. In relational theory, attributes are identified by name, not by their position in the column list. In SQL, <code>SELECT *</code> is an exception that relies on ordering — always name columns explicitly in production queries, as column order can change when a table is altered.',
        'RDBMS engines (SQL Server, PostgreSQL, Oracle, MySQL/MariaDB) implement the relational model with ACID transaction guarantees and a cost-based query optimiser that chooses join algorithms, access paths, and sort strategies automatically. Two dialects dominate: Microsoft T-SQL (SQL Server / Azure SQL) and PL/pgSQL (PostgreSQL / Amazon Aurora PG).',
        'ANSI SQL is the standard — most syntax (SELECT, JOIN, GROUP BY, window functions, CTEs) is cross-compatible between major engines. Dialect differences arise in: string/date functions, identity/sequence syntax, locking hints, stored procedure language, and analytical features. Write ANSI SQL where possible and isolate dialect-specific code.',
      ],
    },
    {
      heading: 'Keys — superkey, candidate key, primary key',
      points: [
        'A <strong>superkey</strong> is any set of columns that uniquely identifies every row in the table. {CustomerID}, {CustomerID, Email}, {Email}, and {CustomerID, Email, FullName} may all be superkeys — there can be many superkeys for one table. A superkey can have redundant attributes.',
        'A <strong>candidate key</strong> is a <em>minimal</em> superkey — removing any attribute from it would break the uniqueness guarantee. A table can have multiple candidate keys: e.g. both CustomerID (surrogate) and Email (natural) individually uniquely identify customers — both are candidate keys.',
        'The <strong>primary key</strong> is the one candidate key chosen as the official row identifier. SQL enforces: NOT NULL on all PK columns and unique values across all rows. It automatically creates a clustered index in MSSQL (or a unique B-tree index in PostgreSQL). The choice of PK affects physical storage, JOIN performance, and replication behaviour.',
        '<strong>Surrogate key</strong>: system-generated integer or UUID (IDENTITY in MSSQL, SERIAL / GENERATED ALWAYS AS IDENTITY in PostgreSQL). Immutable, compact, and great for JOINs — the business meaning of a customer does not affect the key. Best default choice for most tables.',
        '<strong>Natural key</strong>: a real-world attribute (email, ISBN, VAT number). Use a <code>UNIQUE</code> constraint on the natural key alongside a surrogate PK — this enforces business uniqueness at the database level while keeping the PK stable. Never use a natural key alone as PK if it can ever change or is assigned by an external authority.',
      ],
    },
    {
      heading: 'Foreign keys and referential integrity',
      points: [
        'A foreign key is a column (or columns) in a child table whose values must match a PK in the parent table, or be NULL. The FK constraint declaration (<code>REFERENCES ParentTable(PK)</code>) tells the engine to enforce this relationship on every INSERT, UPDATE, and DELETE.',
        '<strong>Referential integrity</strong>: the database rejects any INSERT/UPDATE on the child table if the referenced parent row does not exist. Conversely, it rejects any DELETE/UPDATE on the parent if child rows currently reference it — unless a cascade action is defined.',
        'ON DELETE / ON UPDATE actions define what happens to child rows when the referenced parent row changes: <code>RESTRICT</code> / <code>NO ACTION</code> (default — error, reject the parent change); <code>CASCADE</code> (propagate the delete or update to all child rows — use cautiously, can cause unintended mass deletes); <code>SET NULL</code> (null out the FK column — column must be NULLable); <code>SET DEFAULT</code> (assign the column\'s default value).',
        'Always create an index on FK columns. Neither MSSQL nor PostgreSQL creates FK indexes automatically. Without one, deleting or updating a parent row requires a full child-table scan to find referencing rows — catastrophic on large tables. JOINs on FK relationships also need the index for efficient seeks.',
        'MSSQL: FK validation can be disabled with <code>ALTER TABLE t NOCHECK CONSTRAINT fk_name</code> — useful during bulk data migrations. Re-enable immediately after: <code>ALTER TABLE t WITH CHECK CHECK CONSTRAINT fk_name</code>. PostgreSQL: use <code>DEFERRABLE INITIALLY DEFERRED</code> on the FK constraint to postpone checks to commit time — useful when inserting parent and child rows in mixed order in the same transaction.',
      ],
    },
    {
      heading: 'Integrity constraints — entity, referential, domain, user-defined',
      points: [
        '<strong>Entity integrity</strong>: the primary key must be NOT NULL and unique. Every row must be fully and unambiguously identifiable. The database engine enforces this automatically when you declare a PRIMARY KEY — no application code required.',
        '<strong>Referential integrity</strong>: all FK values must exist in the referenced table (or be NULL). Enforced by FOREIGN KEY constraints. Without referential integrity, you can have orphaned child rows — order lines with no parent order, enrollments with no parent student.',
        '<strong>Domain integrity</strong>: column values must fall within the allowed domain — enforced by the data type (INT rejects "apple"), NOT NULL (rejects NULL for required fields), and CHECK constraints (<code>CHECK (salary > 0)</code>, <code>CHECK (status IN (\'A\',\'I\'))</code>). This is the database enforcing what values <em>mean</em>.',
        '<strong>User-defined / business integrity</strong>: rules beyond the standard types — <code>CHECK (end_date >= start_date)</code>, <code>CHECK (discount BETWEEN 0 AND 1)</code>, triggers that enforce cross-table rules (e.g. an order cannot be shipped if stock is zero). These can also live in stored procedures that serve as the only write path to the table.',
        'The guiding principle: <strong>constraints belong in the database</strong>, not only in the application layer. Applications can be bypassed — direct SQL access, scripts, other services. The database is the last and only guaranteed line of defence against data that violates business rules.',
      ],
    },
    {
      heading: 'RDBMS vs NoSQL — when to use each',
      points: [
        'Choose <strong>RDBMS</strong> when: data has well-defined relationships (customers, orders, products); ACID transactions are required (financial transfers, inventory updates); data integrity is critical and must be enforced at the database layer; ad-hoc querying and reporting are needed; and the schema is known and relatively stable.',
        'Choose <strong>Document stores</strong> (MongoDB, Couchbase) when: the schema is highly variable or evolving rapidly per entity; data is naturally hierarchical (JSON documents); read patterns fetch the whole document; and horizontal scaling with schema flexibility is prioritised over cross-document consistency.',
        'Choose <strong>Key-value stores</strong> (Redis, DynamoDB) when: access is always by a known key (no ad-hoc queries); speed is the primary concern (Redis = in-memory, sub-millisecond); or the use case is caching, session state, rate limiting, or pub/sub messaging.',
        'Choose <strong>Columnar / analytical stores</strong> (Redshift, BigQuery, Snowflake, ClickHouse) for analytical workloads over billions of rows where a few columns are scanned across many rows — the columnar storage format and massive parallelism are optimised for aggregation, not transactional updates.',
        'In practice, most production systems use an RDBMS as the <em>source of truth</em> and layer other stores around it: a Redis cache for hot reads, an Elasticsearch/OpenSearch index for full-text search, a message queue (Kafka, SQS) for async writes, and a warehouse for analytics. The RDBMS remains the authoritative record for business-critical data.',
      ],
    },
    {
      heading: 'SQL execution pipeline and the query planner',
      points: [
        'When you submit a SQL query, the engine processes it through four stages: <strong>parse</strong> (tokenise the SQL string and build an abstract syntax tree; syntax errors are caught here), <strong>bind</strong> (resolve object names — tables, columns, data types; permission checks; name errors caught here), <strong>optimise</strong> (enumerate possible execution plans, estimate costs using statistics, choose the plan with the lowest estimated cost), and <strong>execute</strong> (run the chosen plan and return rows).',
        'The <strong>query optimiser</strong> is the engine\'s most important component. It considers: which indexes are available, what join algorithm to use (nested loop, hash join, merge join), in what order to join tables, whether to use parallel execution, and how to handle sort/aggregation. It does not always choose the best plan — it chooses the plan with the lowest <em>estimated</em> cost based on statistics, which may be stale.',
        '<strong>Plan caching</strong>: after optimisation, the plan is cached in the plan cache (procedure cache) and reused for subsequent identical queries. Parameterised queries and stored procedures share cached plans. Ad-hoc queries with literal values often produce a different cache entry per value (plan cache pollution). Use <code>sp_executesql</code> (MSSQL) or prepared statements to cache parametrically.',
        'View a query\'s execution plan: in SQL Server, <code>SET STATISTICS IO ON; SET STATISTICS TIME ON;</code> + SSMS "Include Actual Execution Plan". In PostgreSQL, <code>EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)</code>. Key metrics to read: logical reads (MSSQL) / shared buffers hit (PG), estimated vs actual row counts, join algorithms used, whether sorts appear unexpectedly.',
        '<strong>Statistics</strong> are histograms the optimiser uses to estimate how many rows a predicate will return (cardinality estimation). Stale or missing statistics cause the optimiser to choose wrong join orders, wrong indexes, or insufficient memory grants. Both engines collect statistics automatically, but large bulk loads or major data changes can make them stale — run <code>UPDATE STATISTICS</code> (MSSQL) or <code>ANALYZE</code> (PG) after large bulk operations.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'T-SQL (MSSQL)',
      language: 'sql',
      code: `-- MSSQL: Create tables with PK, FK, named constraints, and FK index
CREATE TABLE Customers (
    CustomerID   INT           NOT NULL IDENTITY(1,1),
    Email        NVARCHAR(254) NOT NULL,
    FullName     NVARCHAR(200) NOT NULL,
    Country      NVARCHAR(100) NULL,
    CreatedAt    DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Customers        PRIMARY KEY (CustomerID),
    CONSTRAINT UQ_Customers_Email  UNIQUE (Email)
);

CREATE TABLE Orders (
    OrderID    BIGINT       NOT NULL IDENTITY(1,1),
    CustomerID INT          NOT NULL,
    OrderDate  DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    Status     VARCHAR(20)  NOT NULL DEFAULT 'Pending'
        CHECK (Status IN ('Pending','Processing','Shipped','Cancelled')),
    CONSTRAINT PK_Orders          PRIMARY KEY (OrderID),
    CONSTRAINT FK_Orders_Customer FOREIGN KEY (CustomerID)
        REFERENCES Customers(CustomerID)
        ON DELETE NO ACTION    -- reject orphaning orders (explicit default)
        ON UPDATE CASCADE      -- if CustomerID changes, propagate
);
-- Always index FK columns — MSSQL does NOT create them automatically
CREATE INDEX IX_Orders_CustomerID ON Orders (CustomerID);

-- Verify referential integrity:
INSERT INTO Orders (CustomerID) VALUES (999);
-- ERROR: The INSERT statement conflicted with the FOREIGN KEY constraint.`,
    },
    {
      label: 'PostgreSQL',
      language: 'sql',
      code: `-- PostgreSQL: GENERATED IDENTITY (PG 10+ preferred over SERIAL)
CREATE TABLE customers (
    customer_id  INT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email        TEXT         NOT NULL,
    full_name    TEXT         NOT NULL,
    country      TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_customers_email UNIQUE (email)
);

CREATE TABLE orders (
    order_id    BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id INT         NOT NULL,
    order_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status      TEXT        NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending','Processing','Shipped','Cancelled')),
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
-- Always index FK columns — PostgreSQL does NOT create them automatically
CREATE INDEX ix_orders_customer_id ON orders (customer_id);

-- DEFERRABLE FK: useful for bulk inserts where parent/child order is mixed
ALTER TABLE orders
  DROP CONSTRAINT fk_orders_customer,
  ADD CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id)
      REFERENCES customers(customer_id)
      DEFERRABLE INITIALLY DEFERRED;  -- checked at COMMIT, not per statement

-- Verify integrity:
INSERT INTO orders (customer_id) VALUES (999);
-- ERROR: insert or update on table "orders" violates foreign key constraint`,
    },
    {
      label: 'Integrity violations',
      language: 'sql',
      code: `-- ── Entity integrity: PK cannot be NULL ──────────────────────────────────
-- MSSQL:
INSERT INTO Customers (CustomerID, Email, FullName) VALUES (NULL, 'a@b.com', 'Alice');
-- ERROR: Cannot insert the value NULL into column 'CustomerID'.

-- ── Referential integrity: FK value must exist ────────────────────────────
INSERT INTO Orders (CustomerID, Status) VALUES (999, 'Pending');
-- MSSQL ERROR: The INSERT statement conflicted with the FOREIGN KEY constraint
-- PG    ERROR: insert or update violates foreign key constraint

-- ── Domain integrity: CHECK violation ─────────────────────────────────────
INSERT INTO Orders (CustomerID, Status) VALUES (1, 'UnknownStatus');
-- MSSQL ERROR: The INSERT statement conflicted with the CHECK constraint.
-- PG    ERROR: new row for relation "orders" violates check constraint

-- ── Cascade delete: children auto-deleted with parent ─────────────────────
-- (Only if the FK was defined ON DELETE CASCADE)
DELETE FROM Customers WHERE CustomerID = 1;
-- All Orders with CustomerID = 1 are also deleted silently — intended but dangerous

-- ── ON DELETE RESTRICT (default): parent delete blocked ───────────────────
DELETE FROM Customers WHERE CustomerID = 1;
-- ERROR: Could not delete/update parent row: a foreign key constraint fails

-- ── Disable and re-enable FK check during bulk migration (MSSQL) ─────────
ALTER TABLE Orders NOCHECK CONSTRAINT FK_Orders_Customer;
-- ... bulk insert ...
ALTER TABLE Orders WITH CHECK CHECK CONSTRAINT FK_Orders_Customer;
-- Validates all existing rows against the FK — will fail if any are orphaned`,
    },
    {
      label: 'SET operations',
      language: 'sql',
      code: `-- SET operations combine two result sets. Column counts and data types must match.

-- ── UNION: all rows from both; removes duplicates ─────────────────────────
SELECT CustomerID AS PersonID, FullName FROM Customers
UNION
SELECT EmployeeID, FullName FROM Employees;
-- Duplicate rows across both result sets are eliminated.

-- UNION ALL: all rows including duplicates (faster — no dedup step)
SELECT CustomerID, FullName FROM Customers
UNION ALL
SELECT EmployeeID, FullName FROM Employees;

-- ── INTERSECT: rows that appear in BOTH result sets ───────────────────────
-- People who are both customers AND employees:
SELECT Email FROM Customers
INTERSECT
SELECT Email FROM Employees;

-- ── EXCEPT (MSSQL) / EXCEPT (PG): rows in left but NOT in right ──────────
-- Customers who have never placed an order:
SELECT CustomerID FROM Customers
EXCEPT
SELECT DISTINCT CustomerID FROM Orders;

-- PostgreSQL uses the same syntax; MSSQL also supports MINUS as an alias

-- ── Practical: active products NOT in any recent order ────────────────────
SELECT ProductID, ProductName FROM Products WHERE IsActive = 1
EXCEPT
SELECT DISTINCT p.ProductID, p.ProductName
FROM Products p
JOIN OrderLines ol ON p.ProductID = ol.ProductID
JOIN Orders o ON ol.OrderID = o.OrderID
WHERE o.OrderDate >= DATEADD(MONTH, -3, GETDATE());
-- Returns products that have been active but had zero sales in last 3 months`,
    },
    {
      label: 'System catalog queries',
      language: 'sql',
      code: `-- ══ SQL Server (sys.* catalog views) ═════════════════════════════════════

-- All tables with row counts:
SELECT t.name AS TableName, p.rows AS RowCount
FROM sys.tables t
JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id <= 1
ORDER BY p.rows DESC;

-- All FK relationships with referenced column:
SELECT
    fk.name                           AS ConstraintName,
    OBJECT_NAME(fk.parent_object_id)  AS ChildTable,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ChildColumn,
    OBJECT_NAME(fk.referenced_object_id)  AS ParentTable,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS ParentColumn
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id;

-- Indexes missing FK coverage:
SELECT
    OBJECT_NAME(fk.parent_object_id) AS ChildTable,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS FKColumn
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
WHERE NOT EXISTS (
    SELECT 1 FROM sys.index_columns ic
    WHERE ic.object_id = fkc.parent_object_id
      AND ic.column_id = fkc.parent_column_id
      AND ic.index_column_id = 1   -- FK column is the leading index column
);

-- ══ PostgreSQL (information_schema + pg_catalog) ═══════════════════════════

-- All FK relationships:
SELECT
    tc.table_name    AS child_table,
    kcu.column_name  AS fk_column,
    ccu.table_name   AS parent_table,
    ccu.column_name  AS pk_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- Table sizes with index sizes:
SELECT relname AS table_name,
    pg_size_pretty(pg_total_relation_size(oid)) AS total_size,
    pg_size_pretty(pg_relation_size(oid))       AS table_size,
    pg_size_pretty(pg_indexes_size(oid))        AS indexes_size
FROM pg_class
WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace
ORDER BY pg_total_relation_size(oid) DESC;`,
    },
    {
      label: 'Execution plan basics',
      language: 'sql',
      code: `-- ── SQL Server: enable I/O and time stats ────────────────────────────────
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

SELECT c.CompanyName, o.OrderDate, SUM(od.Quantity * od.UnitPrice) AS Revenue
FROM Customers c
JOIN Orders o       ON c.CustomerID = o.CustomerID
JOIN OrderDetails od ON o.OrderID    = od.OrderID
WHERE o.OrderDate >= '2024-01-01'
GROUP BY c.CompanyName, o.OrderDate;

-- Messages pane shows:
-- "Table 'Orders'. Scan count 1, logical reads 8" — 8 buffer-pool page reads
-- SQL Server CPU time, elapsed time

-- Also: Ctrl+M in SSMS enables "Include Actual Execution Plan"
-- Look for: Index Seek (good), Index Scan (acceptable), Table Scan (investigate)
-- Look for: Key Lookup (consider INCLUDE columns), Sort (consider index ORDER)

-- ── PostgreSQL: EXPLAIN ANALYZE ────────────────────────────────────────────
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT c.company_name, o.order_date, SUM(od.quantity * od.unit_price) AS revenue
FROM customers c
JOIN orders o        ON c.customer_id = o.customer_id
JOIN order_details od ON o.order_id   = od.order_id
WHERE o.order_date >= '2024-01-01'
GROUP BY c.company_name, o.order_date;

-- Key lines to read:
-- "Index Scan using ix_orders_date on orders" → index used ✅
-- "Seq Scan on customers (cost=0..120 rows=1000)" → full scan; add index if large table
-- "Hash Join" vs "Nested Loop" — planner chose based on estimated row counts
-- "Buffers: shared hit=N read=M" → N from cache, M from disk
-- "Actual Rows=5 Loops=1" vs "Rows=500 (estimated)" → stale statistics
-- Fix: ANALYZE tablename; or UPDATE STATISTICS tablename (MSSQL)`,
    },
  ];

  challenge: Challenge = {
    title: 'University Database Schema',
    language: 'sql',
    description: 'Design a schema for a university: students, courses, instructors, and enrollments. Apply correct PK, FK, UNIQUE, and CHECK constraints. Index all FK columns.',
    hints: [
      'Students and instructors are both people — consider separate tables with a shared structure',
      'A student can enrol in many courses; a course has many students — M:N needs a junction table',
      'Each course section has exactly one instructor — a FK from courses to instructors',
      'Use a CHECK constraint to restrict grade to A–F or NULL (not yet graded)',
      'Add a multi-column CHECK: completion_date must be >= enrolment_date when not NULL',
    ],
    starterCode: `-- Design tables for: Students, Courses, Instructors, Enrollments
-- Requirements:
--   - Students identified by student_number ('S2024001') — unique business key
--   - Courses have a code ('CS101') and a name
--   - Each course is assigned one instructor
--   - A student can enrol in many courses; grade is A/B/C/D/F or NULL
--   - Dates: enrolment_date and (optional) completion_date

CREATE TABLE students    ( /* ... */ );
CREATE TABLE instructors ( /* ... */ );
CREATE TABLE courses     ( /* ... */ );
CREATE TABLE enrollments ( /* junction table */ );`,
    solution: `CREATE TABLE students (
    student_id     INT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_number VARCHAR(20)  NOT NULL,
    full_name      VARCHAR(200) NOT NULL,
    email          VARCHAR(254) NOT NULL,
    enrolled_on    DATE         NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT uq_students_number UNIQUE (student_number),
    CONSTRAINT uq_students_email  UNIQUE (email)
);

CREATE TABLE instructors (
    instructor_id INT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name     VARCHAR(200) NOT NULL,
    email         VARCHAR(254) NOT NULL,
    CONSTRAINT uq_instructors_email UNIQUE (email)
);

CREATE TABLE courses (
    course_id     INT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    course_code   VARCHAR(20)  NOT NULL,
    course_name   VARCHAR(200) NOT NULL,
    instructor_id INT          NOT NULL,
    credits       SMALLINT     NOT NULL CHECK (credits BETWEEN 1 AND 6),
    CONSTRAINT uq_courses_code  UNIQUE (course_code),
    CONSTRAINT fk_courses_instr FOREIGN KEY (instructor_id)
        REFERENCES instructors(instructor_id)
);
CREATE INDEX ix_courses_instructor ON courses (instructor_id);

CREATE TABLE enrollments (
    student_id      INT     NOT NULL,
    course_id       INT     NOT NULL,
    enrolment_date  DATE    NOT NULL DEFAULT CURRENT_DATE,
    completion_date DATE    NULL,
    grade           CHAR(1) NULL CHECK (grade IN ('A','B','C','D','F')),
    CONSTRAINT pk_enrollments        PRIMARY KEY (student_id, course_id),
    CONSTRAINT fk_enrol_student      FOREIGN KEY (student_id) REFERENCES students(student_id),
    CONSTRAINT fk_enrol_course       FOREIGN KEY (course_id)  REFERENCES courses(course_id),
    CONSTRAINT chk_completion_order
        CHECK (completion_date IS NULL OR completion_date >= enrolment_date)
);
CREATE INDEX ix_enrollments_course ON enrollments (course_id);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which of the following best describes a candidate key?',
      options: [
        'Any set of columns that uniquely identifies a row',
        'A minimal set of columns that uniquely identifies a row — removing any column breaks uniqueness',
        'The primary key chosen by the DBA',
        'A foreign key that references a unique column',
      ],
      answer: 1,
      explanation: 'A candidate key is a MINIMAL superkey — it uniquely identifies every row, and no attribute can be removed without losing that guarantee. A superkey (option A) may contain redundant attributes. A table can have multiple candidate keys; only one is designated the primary key.',
    },
    {
      q: 'A foreign key column contains a value that does not exist in the referenced primary key column. What happens by default?',
      options: [
        'The row is inserted with NULL in place of the invalid FK value',
        'The database rejects the INSERT with a referential integrity violation error',
        'The value is inserted and a warning is logged',
        'The database automatically creates the missing parent row',
      ],
      answer: 1,
      explanation: 'Referential integrity means FK values must exist in the referenced table (or be NULL). By default (ON DELETE RESTRICT / NO ACTION), the database rejects the INSERT entirely. There is no silent auto-correction — the write fails.',
    },
    {
      q: 'Which integrity constraint type does "CHECK (salary > 0)" fall under?',
      options: ['Entity integrity', 'Referential integrity', 'Domain integrity', 'User-defined integrity'],
      answer: 2,
      explanation: 'Domain integrity enforces that column values fall within the allowed domain for the attribute. CHECK constraints are the primary mechanism for domain integrity, alongside data types and NOT NULL. Entity integrity = PK NOT NULL uniqueness; referential integrity = FK validity.',
    },
    {
      q: 'A Customers table has CustomerID (surrogate PK) and Email (UNIQUE). Is Email a candidate key?',
      options: [
        'No — Email cannot be a candidate key because it is not the primary key',
        'No — Email is a superkey only when combined with CustomerID',
        'Yes — Email uniquely identifies rows with a single column, making it a minimal superkey (candidate key)',
        'No — candidate keys cannot contain string columns',
      ],
      answer: 2,
      explanation: 'Email has a UNIQUE constraint, so it uniquely identifies every row with a single column. A single column that uniquely identifies rows is by definition a minimal superkey — therefore a candidate key. A table can have multiple candidate keys; CustomerID was chosen as the primary key, but Email is also a valid candidate key.',
    },
    {
      q: 'Why should you always create an index on a foreign key column?',
      options: [
        'Both MSSQL and PostgreSQL create FK indexes automatically',
        'Without an index, deleting or updating a parent row requires a full scan of the child table to find referencing rows',
        'FK columns must be indexed to allow NULL values',
        'Indexes on FK columns prevent CASCADE deletes from executing',
      ],
      answer: 1,
      explanation: 'Neither MSSQL nor PostgreSQL creates indexes on FK columns automatically. Without an index, the engine must scan the entire child table to check for referencing rows on every parent DELETE or UPDATE — catastrophic on large tables. JOINs on FK relationships also need the index for efficient seeks.',
    },
    {
      q: 'What does UNION ALL return compared to UNION?',
      options: [
        'UNION ALL returns only duplicate rows; UNION returns distinct rows',
        'UNION ALL returns all rows from both result sets including duplicates; UNION removes duplicate rows',
        'UNION ALL requires matching column names; UNION only requires matching column counts',
        'They are identical — ALL is just an alias for the default behavior',
      ],
      answer: 1,
      explanation: 'UNION removes duplicate rows across the combined result set (requires an additional sort/hash dedup step). UNION ALL returns all rows from both result sets including duplicates — faster because no deduplication occurs. Use UNION ALL unless you specifically need duplicate elimination.',
    },
    {
      q: 'During SQL execution, in which stage does the database choose which index to use?',
      options: [
        'Parse — the SQL string is tokenised and column names are resolved',
        'Bind — object names are resolved against the catalog',
        'Optimise — the cost-based optimiser evaluates candidate execution plans using statistics',
        'Execute — the chosen plan runs and may switch indexes dynamically',
      ],
      answer: 2,
      explanation: 'The query optimiser runs after parse (syntax check) and bind (name resolution). It enumerates candidate plans (which indexes to use, which join algorithm, what order to join tables), estimates the cost of each using statistics, and chooses the plan with the lowest estimated cost. The execute stage then runs the pre-selected plan — it does not make index decisions at runtime.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between a surrogate key and a natural key, and which should I use?',
      a: 'A surrogate key is a system-generated value (IDENTITY integer, UUID) with no business meaning. A natural key is a real-world attribute (email, ISBN, VAT number). Use a surrogate key as the PK for stability — business attributes change (email addresses, names, codes), and a change cascades through every FK that references it. Also add a UNIQUE constraint on the natural key to enforce business uniqueness at the database level. Never rely on the application layer alone to prevent duplicate emails or SSNs — the database must be the final enforcer.',
    },
    {
      q: 'Why does SQL have NULL? Can I store empty strings or 0 instead?',
      a: 'NULL represents "unknown" or "not applicable" — a third value distinct from TRUE and FALSE. Empty string ("") means the value is known and blank; 0 means the value is known and zero. NULL for a phone number means "we do not have this person\'s phone number." Using 0 or "" in place of NULL corrupts aggregates: <code>COUNT(col)</code> ignores NULLs; <code>SUM</code> ignores NULLs; comparisons with NULL always return UNKNOWN (not TRUE or FALSE). Use NULL for genuinely absent optional data. Declare columns NOT NULL when a value is always required — missing NULLs is cheaper than correcting for spurious zeros.',
    },
    {
      q: 'What is a schema in MSSQL and PostgreSQL?',
      a: 'A schema is a namespace inside a database. Objects (tables, views, functions) are qualified with a schema name: <code>dbo.Customers</code>, <code>hr.Employees</code>. In MSSQL, the default schema is <code>dbo</code>; in PostgreSQL it is <code>public</code> (the default search path). Use schemas to: organise objects by functional domain (<code>hr</code>, <code>finance</code>, <code>api</code>); grant permissions at the schema level (<code>GRANT SELECT ON SCHEMA hr TO reporting_role</code>); and avoid name collisions when multiple teams work in the same database. Avoid keeping everything in <code>dbo</code> / <code>public</code> for large or multi-team schemas.',
    },
    {
      q: 'When should I use ON DELETE CASCADE vs ON DELETE RESTRICT?',
      a: '<strong>ON DELETE CASCADE</strong>: child rows are automatically deleted when the parent is deleted. Use only when child rows have no meaning without the parent and you want the database to enforce clean-up automatically — e.g. OrderLines when an Order is deleted, or ProductTags when a Product is deleted. Be cautious: cascades can ripple unexpectedly across multiple FK levels and silently delete large volumes of data. <strong>ON DELETE RESTRICT</strong> (the default): the parent delete is blocked if any child rows exist — forces the application to explicitly handle children first. Use this as the default and only add CASCADE when the "cascade delete" behaviour is genuinely intended and understood.',
    },
    {
      q: 'What is the difference between UNION and UNION ALL?',
      a: '<code>UNION</code> combines two result sets and removes duplicate rows — it sorts or hashes the combined output to identify and eliminate duplicates. <code>UNION ALL</code> returns all rows from both result sets including duplicates — no deduplication step, so it is significantly faster. Use <code>UNION ALL</code> as the default when you know the sets are distinct or you want all rows. Use <code>UNION</code> only when you specifically need to eliminate cross-set duplicates. <code>INTERSECT</code> returns rows present in both result sets; <code>EXCEPT</code> (or <code>MINUS</code> in Oracle) returns rows in the left set that are not in the right set.',
    },
    {
      q: 'What does "the optimiser chose the wrong plan" mean, and how do I fix it?',
      a: 'The cost-based optimiser estimates the number of rows each predicate will return (cardinality estimation) using column statistics histograms. If statistics are stale (not updated after a large data change), the estimated row count can be wildly wrong — leading to a bad join order, a nested loop where a hash join would be faster, or too little memory granted for a sort. Fixes: (1) run <code>UPDATE STATISTICS tablename WITH FULLSCAN</code> (MSSQL) or <code>ANALYZE tablename</code> (PG) to refresh statistics; (2) use <code>OPTION(RECOMPILE)</code> on the specific query to force a fresh plan; (3) use <code>OPTION(HASH JOIN)</code> / <code>OPTION(LOOP JOIN)</code> hints as a last resort; (4) add missing indexes that the optimiser would prefer; (5) in PostgreSQL, check <code>pg_stats</code> for column histogram quality.',
    },
    {
      q: 'What is the CAP theorem and how does it relate to choosing RDBMS vs NoSQL?',
      a: 'The CAP theorem states that a distributed system can guarantee at most 2 of 3 properties: <strong>Consistency</strong> (every read sees the most recent write), <strong>Availability</strong> (every request gets a response, even during node failures), and <strong>Partition tolerance</strong> (the system continues operating even when network partitions occur). Traditional RDBMS on a single node sidestep CAP by not being distributed — they provide full ACID guarantees. When you need to distribute data across nodes (for scale or geo-redundancy), you must trade off: CP systems (stay consistent, may become unavailable during partitions — most RDBMS clustering); AP systems (stay available during partitions, may serve stale data — Cassandra, DynamoDB). Understanding CAP helps explain why "just use PostgreSQL" works at most scales, and when a distributed NoSQL store is genuinely necessary.',
    },
  ];
}
