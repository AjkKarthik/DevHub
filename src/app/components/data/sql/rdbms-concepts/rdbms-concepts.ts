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
    { name: 'Relation',              type: 'keyword', desc: 'A table — a set of tuples (rows) sharing the same attributes (columns). No duplicate rows; no inherent ordering.' },
    { name: 'Tuple',                 type: 'keyword', desc: 'A single row in a relation. Corresponds to one entity instance.' },
    { name: 'Attribute',             type: 'keyword', desc: 'A column — the smallest named unit of data. Each attribute has a domain (set of valid values).' },
    { name: 'Primary Key',           type: 'constraint', desc: 'The minimal set of attributes that uniquely identifies every row. Cannot be NULL.' },
    { name: 'Foreign Key',           type: 'constraint', desc: 'One or more columns whose values must match a PK in another table (or be NULL). Enforces referential integrity.' },
    { name: 'Referential Integrity', type: 'constraint', desc: 'FK values must exist in the referenced table. Prevents orphaned child rows.' },
    { name: 'Domain',                type: 'keyword', desc: 'The set of permitted values for an attribute — enforced by data type, NOT NULL, and CHECK constraints.' },
    { name: 'Superkey',              type: 'keyword', desc: 'Any set of attributes that uniquely identifies a row (may have redundant attributes).' },
    { name: 'Candidate Key',         type: 'keyword', desc: 'A minimal superkey — no attribute can be removed and still guarantee uniqueness.' },
    { name: 'Surrogate Key',         type: 'keyword', desc: 'A system-generated PK (e.g. IDENTITY / SERIAL) with no business meaning. Stable and simple for JOINs.' },
    { name: 'Natural Key',           type: 'keyword', desc: 'A PK made of real-world attributes (e.g. email, ISBN). Meaningful but can change.' },
    { name: 'Cardinality',           type: 'keyword', desc: 'Dual meaning: (1) number of rows in a table; (2) relationship multiplicity (1:1, 1:N, M:N).' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The Relational Model',
      points: [
        'Proposed by E.F. Codd in 1970: represent all data as relations (tables), query them with a declarative language (SQL).',
        'A relation is a mathematical SET of tuples — no duplicate rows, no inherent ordering. SQL allows duplicates in practice (use DISTINCT to enforce set semantics).',
        'Columns are named, not positional. Referring to columns by name in queries is required; relying on column position is fragile.',
        'RDBMS engines (SQL Server, PostgreSQL, Oracle, MySQL) implement this model with ACID transaction guarantees and declarative querying via SQL.',
        'Two dialects dominate enterprise and open-source: Microsoft SQL Server (T-SQL) and PostgreSQL (PL/pgSQL). Both implement ANSI SQL with their own extensions.',
      ],
    },
    {
      heading: 'Keys: Superkey, Candidate Key, Primary Key',
      points: [
        'Superkey: ANY set of columns that uniquely identifies a row. {CustomerID}, {CustomerID, Email}, and {Email} may all be superkeys — there can be many.',
        'Candidate key: a MINIMAL superkey — remove any column and it no longer guarantees uniqueness. A table can have multiple candidate keys (e.g. CustomerID and Email both uniquely identify customers).',
        'Primary key: the one candidate key chosen as the official row identifier. Cannot contain NULL. Automatically creates a unique index.',
        'Surrogate key: system-generated integer or UUID (IDENTITY in MSSQL / SERIAL or GENERATED ALWAYS AS IDENTITY in PostgreSQL). Stable, compact, and great for JOINs.',
        'Natural key: a real-world attribute (email, ISBN, VAT number). Use a UNIQUE constraint on the natural key even when using a surrogate PK — so both guarantees are enforced.',
      ],
    },
    {
      heading: 'Foreign Keys and Referential Integrity',
      points: [
        'A foreign key is a column (or set of columns) in a child table whose values must match a PK in the parent table, or be NULL.',
        'Referential integrity means the database will reject INSERT/UPDATE on the child if the referenced parent row does not exist, and reject DELETE/UPDATE on the parent if child rows reference it.',
        'ON DELETE / ON UPDATE actions: RESTRICT (error, default), CASCADE (propagate change), SET NULL, SET DEFAULT. Choose carefully — CASCADE deletes can ripple unexpectedly.',
        'Always create an index on FK columns. Neither MSSQL nor PostgreSQL does this automatically, yet FK lookups without an index cause full table scans.',
        'MSSQL: FK validation can be disabled with NOCHECK CONSTRAINT (use only during bulk loads, re-enable immediately). PostgreSQL: DEFERRABLE INITIALLY DEFERRED postpones checks to commit time.',
      ],
    },
    {
      heading: 'Integrity Constraints',
      points: [
        'Entity integrity: the primary key must be NOT NULL. Every row must be uniquely and fully identifiable.',
        'Referential integrity: all FK values must exist in the referenced table (or be NULL). Enforced by FOREIGN KEY constraints.',
        'Domain integrity: column values must be within the allowed domain — enforced by the data type, NOT NULL, and CHECK constraints.',
        'User-defined integrity: business rules beyond standard constraints (e.g. salary > 0, end_date >= start_date) — enforced with CHECK constraints or trigger logic.',
        'Constraints should live in the database, not only in the application layer. The database is the last line of defence against bad data.',
      ],
    },
    {
      heading: 'RDBMS vs NoSQL — When to Use Each',
      points: [
        'Choose RDBMS when: data has complex relationships, ACID transactions are required (financial systems, inventory), data integrity is critical, and ad-hoc reporting/analytics are needed.',
        'Choose NoSQL (document/key-value) when: schema is highly flexible or evolving rapidly, writes are extremely high volume with simple key-based access, and horizontal sharding at the data tier is required.',
        'Graph databases (Neo4j) for highly connected data (social graphs, recommendation engines). Columnar stores (Redshift, BigQuery) for analytical workloads over billions of rows.',
        'In practice, most systems use RDBMS as the source of truth and add other stores (cache, search index, message queue) around it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'T-SQL (MSSQL)',
      language: 'sql',
      code: `-- MSSQL: Create tables with PK, FK, and constraints
CREATE TABLE Customers (
    CustomerID   INT           NOT NULL IDENTITY(1,1),  -- surrogate PK, auto-increment
    Email        NVARCHAR(254) NOT NULL,                 -- natural key — enforce uniqueness below
    FullName     NVARCHAR(200) NOT NULL,
    Country      NVARCHAR(100) NULL,
    CreatedAt    DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Customers        PRIMARY KEY (CustomerID),
    CONSTRAINT UQ_Customers_Email  UNIQUE      (Email)
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
        ON DELETE RESTRICT           -- reject orphaning orders (default)
        ON UPDATE CASCADE            -- if CustomerID changes, propagate
);

-- Always index FK columns — MSSQL does NOT do this automatically
CREATE INDEX IX_Orders_CustomerID ON Orders(CustomerID);

-- Verify referential integrity is enforced:
-- This will fail with FK violation if CustomerID 999 does not exist
INSERT INTO Orders (CustomerID) VALUES (999);  -- ERROR`,
    },
    {
      label: 'PostgreSQL',
      language: 'sql',
      code: `-- PostgreSQL: Create tables with PK, FK, and constraints
CREATE TABLE customers (
    customer_id  SERIAL        NOT NULL,           -- surrogate PK, auto-increment
    email        VARCHAR(254)  NOT NULL,            -- all PG strings are Unicode (UTF-8)
    full_name    VARCHAR(200)  NOT NULL,
    country      VARCHAR(100),
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_customers        PRIMARY KEY (customer_id),
    CONSTRAINT uq_customers_email  UNIQUE      (email)
);

CREATE TABLE orders (
    order_id    BIGSERIAL    NOT NULL,
    customer_id INT          NOT NULL,
    order_date  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    status      VARCHAR(20)  NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending','Processing','Shipped','Cancelled')),
    CONSTRAINT pk_orders          PRIMARY KEY (order_id),
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- Always index FK columns — PostgreSQL does NOT do this automatically
CREATE INDEX ix_orders_customer_id ON orders(customer_id);

-- DEFERRABLE FK: useful for bulk inserts where parent/child order is mixed
ALTER TABLE orders
  DROP CONSTRAINT fk_orders_customer,
  ADD CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id)
      REFERENCES customers(customer_id)
      DEFERRABLE INITIALLY DEFERRED;  -- checked at COMMIT, not per-statement`,
    },
    {
      label: 'Integrity Violations',
      language: 'sql',
      code: `-- ── Entity integrity: PK cannot be NULL ──────────────────────────────────
-- Both dialects reject this:
INSERT INTO customers (customer_id, email) VALUES (NULL, 'a@b.com');
-- ERROR: null value in column "customer_id" violates not-null constraint

-- ── Referential integrity: FK must reference existing PK ────────────────
INSERT INTO orders (customer_id) VALUES (999);
-- ERROR: insert or update on table "orders" violates foreign key constraint
--        Key (customer_id)=(999) is not present in table "customers".

-- ── Domain integrity: CHECK constraint violation ─────────────────────────
INSERT INTO orders (customer_id, status) VALUES (1, 'Unknown');
-- ERROR: new row for relation "orders" violates check constraint
--        failing row contains status: Unknown

-- ── Cascade delete example ────────────────────────────────────────────────
-- If FK is ON DELETE CASCADE:
DELETE FROM customers WHERE customer_id = 1;
-- All orders with customer_id = 1 are also deleted automatically.

-- If FK is ON DELETE RESTRICT (default):
DELETE FROM customers WHERE customer_id = 1;
-- ERROR: update or delete on table "customers" violates foreign key constraint
--        Key (customer_id)=(1) is still referenced from table "orders".`,
    },
  ];

  challenge: Challenge = {
    title: 'University Database Schema',
    language: 'sql',
    description: 'Design a schema for a university: students, courses, instructors, and enrollments. Apply correct PK, FK, UNIQUE, and CHECK constraints. Index all FK columns.',
    hints: [
      'Students and instructors are both people — consider a shared People table or separate tables',
      'A student can enrol in many courses; a course has many students — this is M:N: needs a junction table',
      'Each course section should have exactly one instructor',
      'Use a CHECK constraint to restrict the enrollment grade to A–F or NULL (not yet graded)',
    ],
    starterCode: `-- Design tables for: Students, Courses, Instructors, Enrollments
-- Requirements:
--   - Students identified by student_number (e.g. 'S2024001') — unique
--   - Courses have a code (e.g. 'CS101') and a name
--   - Each course is assigned one instructor
--   - A student can enrol in many courses; grade is A/B/C/D/F or NULL
--   - Dates: enrolment_date and (optional) completion_date

CREATE TABLE students (
    -- your definition here
);

CREATE TABLE instructors (
    -- your definition here
);

CREATE TABLE courses (
    -- your definition here
);

CREATE TABLE enrollments (
    -- junction table for students <-> courses
);`,
    solution: `CREATE TABLE students (
    student_id     SERIAL        NOT NULL,
    student_number VARCHAR(20)   NOT NULL,
    full_name      VARCHAR(200)  NOT NULL,
    email          VARCHAR(254)  NOT NULL,
    enrolled_on    DATE          NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT pk_students               PRIMARY KEY (student_id),
    CONSTRAINT uq_students_number        UNIQUE (student_number),
    CONSTRAINT uq_students_email         UNIQUE (email)
);

CREATE TABLE instructors (
    instructor_id  SERIAL       NOT NULL,
    full_name      VARCHAR(200) NOT NULL,
    email          VARCHAR(254) NOT NULL,
    CONSTRAINT pk_instructors        PRIMARY KEY (instructor_id),
    CONSTRAINT uq_instructors_email  UNIQUE (email)
);

CREATE TABLE courses (
    course_id     SERIAL       NOT NULL,
    course_code   VARCHAR(20)  NOT NULL,
    course_name   VARCHAR(200) NOT NULL,
    instructor_id INT          NOT NULL,
    credits       SMALLINT     NOT NULL CHECK (credits BETWEEN 1 AND 6),
    CONSTRAINT pk_courses          PRIMARY KEY (course_id),
    CONSTRAINT uq_courses_code     UNIQUE (course_code),
    CONSTRAINT fk_courses_instr    FOREIGN KEY (instructor_id)
        REFERENCES instructors(instructor_id)
);
CREATE INDEX ix_courses_instructor ON courses(instructor_id);

CREATE TABLE enrollments (
    student_id      INT     NOT NULL,
    course_id       INT     NOT NULL,
    enrolment_date  DATE    NOT NULL DEFAULT CURRENT_DATE,
    completion_date DATE    NULL,
    grade           CHAR(1) NULL CHECK (grade IN ('A','B','C','D','F')),
    CONSTRAINT pk_enrollments          PRIMARY KEY (student_id, course_id),
    CONSTRAINT fk_enrol_student        FOREIGN KEY (student_id) REFERENCES students(student_id),
    CONSTRAINT fk_enrol_course         FOREIGN KEY (course_id)  REFERENCES courses(course_id),
    CONSTRAINT chk_completion_after_enrolment
        CHECK (completion_date IS NULL OR completion_date >= enrolment_date)
);
CREATE INDEX ix_enrollments_course ON enrollments(course_id);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which of the following best describes a candidate key?',
      options: [
        'Any set of columns that uniquely identifies a row',
        'A minimal set of columns that uniquely identifies a row',
        'The primary key chosen by the DBA',
        'A foreign key that references a unique column',
      ],
      answer: 1,
      explanation: 'A candidate key is a MINIMAL superkey — it uniquely identifies rows and removing any of its columns would break that uniqueness. A superkey (option A) may have redundant columns.',
    },
    {
      q: 'A foreign key column contains a value that does not exist in the referenced primary key column. What does the database do by default?',
      options: [
        'Inserts the row with a NULL in place of the invalid FK value',
        'Rejects the INSERT with a referential integrity violation error',
        'Inserts the value and logs a warning',
        'Automatically creates the missing parent row',
      ],
      answer: 1,
      explanation: 'Referential integrity means FK values must exist in the referenced table. By default (RESTRICT), the database rejects the insert entirely with an error.',
    },
    {
      q: 'Which integrity constraint type does "salary > 0" fall under?',
      options: ['Entity integrity', 'Referential integrity', 'Domain integrity', 'Primary key constraint'],
      answer: 2,
      explanation: 'Domain integrity enforces that values fall within the allowed domain for a column. "salary > 0" is a CHECK constraint — a form of domain integrity.',
    },
    {
      q: 'You have a Customers table with CustomerID (surrogate PK) and Email (unique). A friend says "Email is a superkey but not necessarily a candidate key." Are they correct?',
      options: [
        'No — Email is a candidate key because it uniquely identifies rows with a single column',
        'Yes — Email cannot be a candidate key because it is not the primary key',
        'Yes — Email is a superkey only if combined with CustomerID',
        'No — Email cannot be a superkey because it is not the PK',
      ],
      answer: 0,
      explanation: 'Email uniquely identifies rows (it has a UNIQUE constraint), so it IS a candidate key (a minimal superkey). The friend is wrong. A table can have multiple candidate keys; only one is designated the primary key.',
    },
    {
      q: 'Why should you always create an index on a foreign key column in both MSSQL and PostgreSQL?',
      options: [
        'Both engines create FK indexes automatically',
        'Without an index, FK validation during DELETE on the parent table requires a full scan of the child table',
        'FK columns must be indexed to allow NULL values',
        'Indexes on FK columns prevent CASCADE deletes',
      ],
      answer: 1,
      explanation: 'Neither MSSQL nor PostgreSQL creates indexes on FK columns automatically. Without an index, checking for referencing rows on DELETE/UPDATE of the parent requires a full table scan of the child — which can be very slow on large tables.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between a surrogate key and a natural key, and which should I use?',
      a: 'A surrogate key is a system-generated value (IDENTITY / SERIAL integer, UUID) with no business meaning. A natural key is a real-world attribute (email, ISBN, tax ID). Use a surrogate key as the PK for simplicity and stability (business attributes can change), but ALSO add a UNIQUE constraint on the natural key to enforce its uniqueness at the database level. Never rely on the application layer alone to prevent duplicate emails or SSNs.',
    },
    {
      q: 'Why does SQL have NULL? Can I just store empty strings or 0 instead?',
      a: 'NULL represents "unknown" or "not applicable" — a third value in addition to TRUE and FALSE. Empty string ("") means the value IS known and it is blank; 0 means the value is known and it is zero. NULL for a phone number means "we do not have this person\'s phone." Using 0 or "" in place of NULL breaks aggregates (COUNT(col) ignores NULLs; SUM ignores NULLs) and comparisons (NULL != 0). Use NULL for genuinely missing/optional data and NOT NULL for required columns.',
    },
    {
      q: 'MSSQL uses schemas like "dbo" and PostgreSQL has "public" — what is a schema in this context?',
      a: 'A schema is a namespace inside a database. Objects (tables, views, procedures) live in a schema: dbo.Customers, hr.Employees. In MSSQL, the default schema is "dbo"; in PostgreSQL it is "public". Use schemas to: organise objects by domain (hr, finance, api), control permissions at a group level (GRANT SELECT ON SCHEMA hr TO reporting_role), and avoid name collisions between teams. Set a user\'s default schema (MSSQL: ALTER USER … WITH DEFAULT_SCHEMA; PG: ALTER ROLE … SET search_path) so they do not need to qualify every name.',
    },
  ];
}
