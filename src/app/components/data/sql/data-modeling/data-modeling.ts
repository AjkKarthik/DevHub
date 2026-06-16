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
  selector: 'app-sql-data-modeling',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './data-modeling.html',
  styleUrl: './data-modeling.scss',
})
export class SqlDataModeling {

  quickRef: QuickRefItem[] = [
    { name: 'Entity',            type: 'keyword', desc: 'A real-world object or concept with data worth storing (Customer, Product, Order). Becomes a table.' },
    { name: 'Attribute',         type: 'keyword', desc: 'A property of an entity. Becomes a column. Can be simple, composite, multivalued, or derived.' },
    { name: 'Relationship',      type: 'keyword', desc: 'An association between two or more entities. Becomes a FK column (1:N) or a junction table (M:N).' },
    { name: 'Cardinality',       type: 'keyword', desc: 'Relationship multiplicity — how many instances of each entity can participate: 1:1, 1:N (one-to-many), M:N (many-to-many).' },
    { name: 'ERD',               type: 'keyword', desc: 'Entity-Relationship Diagram — visual map of entities, attributes, and relationships before writing DDL.' },
    { name: 'Crow\'s Foot',      type: 'keyword', desc: 'ERD notation: lines with symbols — |— (one), >— (many), O— (zero-or-one). Shows min/max participation.' },
    { name: 'Weak Entity',       type: 'keyword', desc: 'An entity that cannot be uniquely identified without its parent entity (e.g. OrderLine depends on Order).' },
    { name: 'Junction Table',    type: 'keyword', desc: 'A table that resolves a M:N relationship. Contains FK columns to both parent tables; their combination is the PK.' },
    { name: 'Surrogate Key',     type: 'keyword', desc: 'A system-generated PK with no business meaning (IDENTITY/SERIAL int, UUID). Stable, index-friendly.' },
    { name: 'Natural Key',       type: 'keyword', desc: 'A PK whose value has business meaning (email, ISBN, SSN). Can change and be long — prefer as unique constraint, not PK.' },
    { name: 'EAV',               type: 'keyword', desc: 'Entity-Attribute-Value pattern: (id, attr_name, attr_value). Flexible but type-unsafe, unindexable, hard to query.' },
    { name: 'Identifying Rel.',  type: 'keyword', desc: 'A relationship where the child\'s PK includes the parent\'s PK (weak entity). OrderLine(OrderID, LineNum).' },
    { name: 'Participation',     type: 'keyword', desc: 'Total: every entity instance must participate in the relationship. Partial: participation is optional (0 or more).' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Entities and Attributes',
      points: [
        'An entity represents a distinct, identifiable "thing" in the domain: Customer, Product, Invoice, Employee. Each entity type becomes a table.',
        'Attributes are properties of an entity: Customer has email, full_name, country. Each attribute becomes a column.',
        'Attribute types: simple (atomic, e.g. price), composite (decomposable, e.g. full_name → first + last), multivalued (phone numbers — extract to a child table), derived (age from birth_date — usually compute in queries, not store).',
        'A strong entity has its own unique identifier (PK). A weak entity (e.g. OrderLine) depends on a parent entity for its identity — its PK includes the parent\'s PK.',
        'Before writing a single line of DDL, sketch the entities as boxes and draw relationships between them. This prevents major schema refactors later.',
      ],
    },
    {
      heading: 'Relationship Types and Cardinality',
      points: [
        'One-to-One (1:1): rare in practice. Example: Employee — EmployeeDetail (rarely accessed columns split to a separate table for performance). Implement with a UNIQUE FK.',
        'One-to-Many (1:N): the most common type. One parent row has many child rows. Example: one Customer has many Orders. Implement with a FK column on the "many" side (Orders.CustomerID).',
        'Many-to-Many (M:N): cannot be stored directly. One Student can enrol in many Courses; one Course has many Students. Requires a junction table (Enrolments) with FKs to both parents.',
        'Crow\'s foot notation: a single vertical bar | means exactly one; a crow\'s foot > means many; a circle O means zero (optional). So O>— means "zero or more".',
        'Mandatory (total) participation: every Customer MUST have at least one Order? Usually not — a customer can exist before placing an order. Model optional participation with NULL-able or absent FK.',
      ],
    },
    {
      heading: 'Translating an ER Diagram to Tables',
      points: [
        'Rule 1 — Each strong entity → one table with its attributes as columns and its identifier as PK.',
        'Rule 2 — Each 1:N relationship → add a FK column on the "many" side pointing to the PK of the "one" side. Index the FK column.',
        'Rule 3 — Each M:N relationship → create a junction table. Its PK is the composite of both parent FKs. Add extra attributes of the relationship (e.g. enrolment_date, grade) as columns in the junction table.',
        'Rule 4 — Each 1:1 relationship → place the FK on the table that has PARTIAL participation (the optional side), or merge them if the relationship is always total on both sides.',
        'Rule 5 — Multivalued attributes → extract to a separate child table with a FK back to the parent and the value as part of the PK.',
      ],
    },
    {
      heading: 'Practical Modeling Tips',
      points: [
        'Model what you need to QUERY, not just what you want to store. If you need to filter orders by customer country, the country must be in the Customers table (or joined), not buried in a JSON blob.',
        'Avoid the "one giant table" anti-pattern (EAV — Entity-Attribute-Value). Tables like (entity_id, attribute_name, attribute_value) are hard to query, type-unsafe, and cannot enforce constraints.',
        'Many-to-many with extra attributes: as soon as the junction table gains meaningful attributes (grade, price_at_purchase, created_by), it becomes a full entity in its own right. Name it something meaningful (Enrolment, OrderLine, ProjectMembership).',
        'Think about the write side too: insert/update/delete patterns should be as simple as possible. Heavily denormalized schemas that are fast to read can be nightmares to keep consistent on writes.',
        'Start normalised (3NF). Denormalise only after measuring a real performance problem. See the Normalization page for the full rules.',
      ],
    },
    {
      heading: 'Surrogate vs natural keys — choosing a primary key strategy',
      points: [
        '<strong>Surrogate keys</strong> are system-generated identifiers with no business meaning: <code>INT IDENTITY</code> (MSSQL), <code>SERIAL</code> / <code>GENERATED ALWAYS AS IDENTITY</code> (PostgreSQL), or UUID. They never change, are compact, and make FK relationships simple. The recommended default for most tables.',
        '<strong>Natural keys</strong> have business meaning: email address, ISBN, national ID number, product SKU. Tempting as PKs because they are already unique and meaningful. But they change (users change emails), can be long strings (slow index comparisons), and couples business rules to the schema structure.',
        'Best practice: use a surrogate integer PK, and apply a UNIQUE constraint on the natural key column. This gives you both fast FK joins on the integer PK and the business-rule uniqueness guarantee on the natural key. Example: <code>PRIMARY KEY (customer_id)</code> + <code>UNIQUE (email)</code>.',
        '<strong>UUID as PK</strong>: globally unique across systems — useful for distributed architectures or when clients generate IDs before writing. Downside: random UUIDs (<code>NEWID()</code> / <code>gen_random_uuid()</code>) fragment the clustered index badly (random inserts cause page splits). Use sequential UUIDs (<code>NEWSEQUENTIALID()</code> in MSSQL, UUIDv7 in PostgreSQL 17+) if you must use UUID as a clustered PK, or use UUID as a secondary unique column and keep an integer as the clustered PK.',
        '<strong>Composite PKs</strong> are appropriate for junction tables (Student + Course in Enrollments) and weak entities (OrderID + LineNumber in OrderLines). Avoid composite PKs on main entity tables — they make FK columns verbose and join conditions longer. When in doubt, add a surrogate PK and a UNIQUE constraint on the natural composite.',
      ],
    },
    {
      heading: 'EAV anti-pattern and alternatives — polymorphic associations and flexible schemas',
      points: [
        '<strong>Entity-Attribute-Value (EAV)</strong>: a "universal table" pattern with columns <code>(entity_id, attribute_name, attribute_value VARCHAR)</code>. Attractive for "flexible" schemas with varying attributes per row. Problems: all values stored as strings (no type safety, no CHECK constraints), filtering requires pivoting (<code>CASE WHEN attr = \'price\' THEN value END</code>), indexes cannot be used effectively, and required attributes cannot be enforced.',
        'EAV alternatives: (1) <strong>typed columns with NULLs</strong> — add optional columns to the main table; fine for a small, stable set of optional fields. (2) <strong>JSON/JSONB column</strong> — store flexible attributes as a JSON blob alongside fixed columns; allows schema flexibility without abandoning type-safe columns for core fields. (3) <strong>class-table inheritance</strong> — a base table with common columns plus a subtype table per variant; foreign keys link them.',
        '<strong>Polymorphic associations</strong>: a Comment can belong to either a Post or a Photo. Anti-pattern: <code>(commentable_type VARCHAR, commentable_id INT)</code> — cannot enforce FK integrity. Better options: (1) two nullable FKs (<code>post_id INT NULL, photo_id INT NULL</code>) with a CHECK that exactly one is non-NULL; (2) a separate CommentOnPost and CommentOnPhoto table; (3) an abstract parent table (Content) that both Post and Photo reference.',
        '<strong>Sparse columns in MSSQL</strong>: a specific alternative to EAV for tables with many NULL columns. Declare sparse columns with <code>column_name TYPE SPARSE NULL</code>; they use no storage for NULL values. Suits EAV-like schemas where each row has very different sets of populated columns. Not available in PostgreSQL — use JSON/JSONB instead.',
        'When a product catalog needs unlimited custom attributes (color: "red", material: "steel", size: "XL" — different attributes per category), a hybrid approach works well: typed columns for attributes shared across all products (price, sku, weight) + a JSONB / JSON column for category-specific custom attributes. Query fixed columns normally; use JSON operators for flexible attributes. Index specific JSONB paths with PostgreSQL expression indexes when query performance requires it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'T-SQL (MSSQL)',
      language: 'sql',
      code: `-- ER diagram: Student -<enrolls in>- Course
-- Student (1) ←— M:N —→ (1) Course  via Enrollments junction
-- Course (N) ←— 1:N —→ (1) Instructor

CREATE TABLE Instructors (
    InstructorID  INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    FullName      NVARCHAR(200) NOT NULL,
    Email         NVARCHAR(254) NOT NULL,
    CONSTRAINT UQ_Instructors_Email UNIQUE (Email)
);

CREATE TABLE Courses (
    CourseID      INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    CourseCode    VARCHAR(20)   NOT NULL,
    CourseName    NVARCHAR(200) NOT NULL,
    InstructorID  INT           NOT NULL,  -- 1:N FK → Instructors
    Credits       TINYINT       NOT NULL CHECK (Credits BETWEEN 1 AND 6),
    CONSTRAINT UQ_Courses_Code       UNIQUE (CourseCode),
    CONSTRAINT FK_Courses_Instructor FOREIGN KEY (InstructorID)
        REFERENCES Instructors(InstructorID)
);
CREATE INDEX IX_Courses_Instructor ON Courses(InstructorID);  -- always index FKs

CREATE TABLE Students (
    StudentID     INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    StudentNumber VARCHAR(20)   NOT NULL,
    FullName      NVARCHAR(200) NOT NULL,
    Email         NVARCHAR(254) NOT NULL,
    CONSTRAINT UQ_Students_Number UNIQUE (StudentNumber),
    CONSTRAINT UQ_Students_Email  UNIQUE (Email)
);

-- M:N junction table: Student <-> Course
CREATE TABLE Enrollments (
    StudentID       INT     NOT NULL,
    CourseID        INT     NOT NULL,
    EnrollmentDate  DATE    NOT NULL DEFAULT CAST(GETUTCDATE() AS DATE),
    Grade           CHAR(1) NULL CHECK (Grade IN ('A','B','C','D','F')),
    CONSTRAINT PK_Enrollments     PRIMARY KEY (StudentID, CourseID),  -- composite PK
    CONSTRAINT FK_Enroll_Student  FOREIGN KEY (StudentID) REFERENCES Students(StudentID),
    CONSTRAINT FK_Enroll_Course   FOREIGN KEY (CourseID)  REFERENCES Courses(CourseID)
);
CREATE INDEX IX_Enrollments_Course ON Enrollments(CourseID);`,
    },
    {
      label: 'PostgreSQL',
      language: 'sql',
      code: `-- Same model in PostgreSQL (snake_case convention)
CREATE TABLE instructors (
    instructor_id  SERIAL        NOT NULL,
    full_name      VARCHAR(200)  NOT NULL,
    email          VARCHAR(254)  NOT NULL,
    CONSTRAINT pk_instructors       PRIMARY KEY (instructor_id),
    CONSTRAINT uq_instructors_email UNIQUE (email)
);

CREATE TABLE courses (
    course_id     SERIAL      NOT NULL,
    course_code   VARCHAR(20) NOT NULL,
    course_name   VARCHAR(200) NOT NULL,
    instructor_id INT         NOT NULL,
    credits       SMALLINT    NOT NULL CHECK (credits BETWEEN 1 AND 6),
    CONSTRAINT pk_courses          PRIMARY KEY (course_id),
    CONSTRAINT uq_courses_code     UNIQUE (course_code),
    CONSTRAINT fk_courses_instructor FOREIGN KEY (instructor_id)
        REFERENCES instructors(instructor_id)
);
CREATE INDEX ix_courses_instructor ON courses(instructor_id);

CREATE TABLE students (
    student_id     SERIAL       NOT NULL,
    student_number VARCHAR(20)  NOT NULL,
    full_name      VARCHAR(200) NOT NULL,
    email          VARCHAR(254) NOT NULL,
    CONSTRAINT pk_students         PRIMARY KEY (student_id),
    CONSTRAINT uq_students_number  UNIQUE (student_number),
    CONSTRAINT uq_students_email   UNIQUE (email)
);

-- M:N junction table
CREATE TABLE enrollments (
    student_id      INT     NOT NULL,
    course_id       INT     NOT NULL,
    enrollment_date DATE    NOT NULL DEFAULT CURRENT_DATE,
    grade           CHAR(1) NULL CHECK (grade IN ('A','B','C','D','F')),
    CONSTRAINT pk_enrollments      PRIMARY KEY (student_id, course_id),
    CONSTRAINT fk_enroll_student   FOREIGN KEY (student_id) REFERENCES students(student_id),
    CONSTRAINT fk_enroll_course    FOREIGN KEY (course_id)  REFERENCES courses(course_id)
);
CREATE INDEX ix_enrollments_course ON enrollments(course_id);`,
    },
    {
      label: 'Queries across relationships',
      language: 'sql',
      code: `-- List all courses a student is enrolled in (1:N and M:N join)
-- Works in both MSSQL and PostgreSQL
SELECT
    s.full_name      AS student,
    c.course_code,
    c.course_name,
    i.full_name      AS instructor,
    e.grade
FROM enrollments  e
JOIN students    s  ON e.student_id   = s.student_id
JOIN courses     c  ON e.course_id    = c.course_id
JOIN instructors i  ON c.instructor_id = i.instructor_id
WHERE s.student_id = 42
ORDER BY c.course_code;

-- Count enrolments per course (aggregate across M:N junction)
SELECT
    c.course_code,
    c.course_name,
    COUNT(e.student_id)  AS enrolled,
    COUNT(e.grade)       AS graded,   -- COUNT ignores NULLs
    AVG(CASE e.grade
          WHEN 'A' THEN 4.0 WHEN 'B' THEN 3.0 WHEN 'C' THEN 2.0
          WHEN 'D' THEN 1.0 WHEN 'F' THEN 0.0 END) AS avg_gpa
FROM courses     c
LEFT JOIN enrollments e ON c.course_id = e.course_id  -- LEFT keeps courses with 0 enrolments
GROUP BY c.course_id, c.course_code, c.course_name
ORDER BY enrolled DESC;`,
    },
    {
      label: 'Key strategies (surrogate, natural, UUID)',
      language: 'sql',
      code: `-- ── Pattern 1: surrogate INT PK + natural key as UNIQUE constraint ─────
-- MSSQL
CREATE TABLE customers_mssql (
    customer_id  INT           NOT NULL IDENTITY(1,1),  -- surrogate PK
    email        NVARCHAR(254) NOT NULL,                -- natural key → UNIQUE only
    full_name    NVARCHAR(200) NOT NULL,
    CONSTRAINT PK_Customers  PRIMARY KEY (customer_id),
    CONSTRAINT UQ_Cust_Email UNIQUE      (email)        -- business-rule uniqueness
);

-- PostgreSQL (GENERATED ALWAYS AS IDENTITY = preferred over SERIAL)
CREATE TABLE customers_pg (
    customer_id  INT          GENERATED ALWAYS AS IDENTITY,
    email        VARCHAR(254) NOT NULL,
    full_name    VARCHAR(200) NOT NULL,
    CONSTRAINT pk_customers  PRIMARY KEY (customer_id),
    CONSTRAINT uq_cust_email UNIQUE      (email)
);

-- ── Pattern 2: sequential UUID PK (for distributed systems) ─────────────
-- MSSQL: NEWSEQUENTIALID() avoids random-insert fragmentation
CREATE TABLE events_mssql (
    event_id    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    event_type  VARCHAR(50)      NOT NULL,
    occurred_at DATETIME2(7)     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Events PRIMARY KEY (event_id)
);

-- PostgreSQL 17+: UUIDv7 is time-ordered (no fragmentation)
CREATE TABLE events_pg (
    event_id    UUID         NOT NULL DEFAULT gen_random_uuid(),  -- v4; replace with uuidv7() on PG17
    event_type  VARCHAR(50)  NOT NULL,
    occurred_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_events PRIMARY KEY (event_id)
);

-- ── Pattern 3: composite PK on junction table ────────────────────────────
CREATE TABLE project_members (
    project_id  INT  NOT NULL,
    employee_id INT  NOT NULL,
    role        VARCHAR(50) NOT NULL DEFAULT 'Contributor',
    joined_date DATE        NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT pk_project_members PRIMARY KEY (project_id, employee_id),
    CONSTRAINT fk_pm_project  FOREIGN KEY (project_id)  REFERENCES projects(project_id),
    CONSTRAINT fk_pm_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);
CREATE INDEX ix_pm_employee ON project_members(employee_id);`,
    },
    {
      label: 'EAV alternatives & polymorphic FK',
      language: 'sql',
      code: `-- ── EAV anti-pattern (avoid) ─────────────────────────────────────────
CREATE TABLE product_attributes_eav (
    product_id      INT,
    attribute_name  VARCHAR(100),
    attribute_value VARCHAR(500)   -- all types as string: no type safety, no indexes on values
);
-- To get price: SELECT attribute_value FROM … WHERE attribute_name = 'price'
-- Aggregating: pivot query required — fragile and slow

-- ── Typed columns + JSON hybrid (recommended) ──────────────────────────
-- Fixed columns for shared, filterable attributes; JSON for category-specific extras
CREATE TABLE products (
    product_id    SERIAL      NOT NULL,
    sku           VARCHAR(50) NOT NULL,
    product_name  VARCHAR(300) NOT NULL,
    price         NUMERIC(12,2) NOT NULL,         -- typed: filterable, indexable
    weight_kg     NUMERIC(8,3)  NULL,              -- typed: shared across categories
    custom_attrs  JSONB         NULL,              -- flexible: category-specific
    CONSTRAINT pk_products   PRIMARY KEY (product_id),
    CONSTRAINT uq_products_sku UNIQUE (sku)
);

-- Index a specific JSONB path for efficient querying (PostgreSQL):
CREATE INDEX ix_products_color ON products((custom_attrs->>'color'));

-- Query: find all red t-shirts under $30
SELECT sku, product_name, price
FROM   products
WHERE  price < 30
  AND  custom_attrs->>'color' = 'red'
  AND  custom_attrs->>'category' = 'tshirt';

-- ── Polymorphic association — two nullable FKs with CHECK ─────────────
-- A comment can belong to EITHER a post OR a video (not both)
CREATE TABLE comments (
    comment_id INT  GENERATED ALWAYS AS IDENTITY,
    post_id    INT  NULL REFERENCES posts(post_id),
    video_id   INT  NULL REFERENCES videos(video_id),
    body       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_comments PRIMARY KEY (comment_id),
    CONSTRAINT ck_comments_one_parent CHECK (
        (post_id IS NOT NULL AND video_id IS NULL) OR
        (post_id IS NULL    AND video_id IS NOT NULL)
    )
);`,
    },
    {
      label: 'Self-referencing hierarchy (recursive CTE)',
      language: 'sql',
      code: `-- Adjacency list: each category has an optional parent (self-referencing FK)
CREATE TABLE categories (
    category_id        INT          GENERATED ALWAYS AS IDENTITY,
    category_name      VARCHAR(200) NOT NULL,
    parent_category_id INT          NULL REFERENCES categories(category_id),
    CONSTRAINT pk_categories PRIMARY KEY (category_id)
);
CREATE INDEX ix_categories_parent ON categories(parent_category_id);

-- Sample data: Electronics > Phones > Smartphones
INSERT INTO categories (category_name, parent_category_id)
VALUES ('Electronics', NULL),            -- root
       ('Phones',      1),               -- child of Electronics
       ('Smartphones', 2),               -- child of Phones
       ('Laptops',     1);               -- child of Electronics

-- ── Recursive CTE: traverse the full hierarchy ─────────────────────────
-- Works in both MSSQL and PostgreSQL
WITH RECURSIVE cat_tree AS (          -- MSSQL: omit RECURSIVE keyword
    -- Anchor: start at root categories
    SELECT category_id, category_name, parent_category_id, 0 AS depth,
           CAST(category_name AS VARCHAR(1000)) AS path
    FROM   categories
    WHERE  parent_category_id IS NULL

    UNION ALL

    -- Recursive member: join children to their parent
    SELECT c.category_id, c.category_name, c.parent_category_id,
           ct.depth + 1,
           CAST(ct.path || ' > ' || c.category_name AS VARCHAR(1000)) AS path
    FROM   categories c
    JOIN   cat_tree ct ON c.parent_category_id = ct.category_id
)
SELECT depth, LPAD('  ', depth * 2, ' ') || category_name AS indented_name, path
FROM   cat_tree
ORDER BY path;
-- Result:
-- 0  Electronics
-- 1    Laptops        → Electronics > Laptops
-- 1    Phones         → Electronics > Phones
-- 2      Smartphones  → Electronics > Phones > Smartphones`,
    },
  ];

  challenge: Challenge = {
    title: 'Model a Blog Platform',
    language: 'sql',
    description: 'A blog platform has: Authors (users who write posts), Posts (each has one author, one category), Categories, Tags (a post can have many tags), and Comments (on posts, by any user). Identify the entity types, their relationships and cardinalities, then write the DDL.',
    hints: [
      'Post → Author is 1:N (one author, many posts). Post → Category is 1:N.',
      'Post ↔ Tag is M:N — needs a junction table (PostTags)',
      'Comment → Post is 1:N; Comment → Author is 1:N',
      'Use SERIAL (PG) or IDENTITY (MSSQL) for all PKs',
    ],
    starterCode: `-- Identify entities: Authors, Posts, Categories, Tags, Comments
-- Draw the relationships before writing SQL:
--   Author 1 ──< N Post
--   Category 1 ──< N Post
--   Post M >──< N Tag  (junction: PostTags)
--   Post 1 ──< N Comment
--   Author 1 ──< N Comment

-- Write the DDL (PostgreSQL or MSSQL):
CREATE TABLE authors (
    -- your columns and constraints here
);

-- ... continue for all entities`,
    solution: `CREATE TABLE authors (
    author_id   SERIAL        NOT NULL,
    username    VARCHAR(50)   NOT NULL,
    email       VARCHAR(254)  NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_authors          PRIMARY KEY (author_id),
    CONSTRAINT uq_authors_username UNIQUE (username),
    CONSTRAINT uq_authors_email    UNIQUE (email)
);

CREATE TABLE categories (
    category_id   SERIAL      NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    CONSTRAINT pk_categories          PRIMARY KEY (category_id),
    CONSTRAINT uq_categories_name     UNIQUE (category_name)
);

CREATE TABLE posts (
    post_id      SERIAL        NOT NULL,
    author_id    INT           NOT NULL,
    category_id  INT           NOT NULL,
    title        VARCHAR(300)  NOT NULL,
    body         TEXT          NOT NULL,
    published_at TIMESTAMPTZ   NULL,
    CONSTRAINT pk_posts             PRIMARY KEY (post_id),
    CONSTRAINT fk_posts_author      FOREIGN KEY (author_id)   REFERENCES authors(author_id),
    CONSTRAINT fk_posts_category    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);
CREATE INDEX ix_posts_author   ON posts(author_id);
CREATE INDEX ix_posts_category ON posts(category_id);

CREATE TABLE tags (
    tag_id   SERIAL      NOT NULL,
    tag_name VARCHAR(50) NOT NULL,
    CONSTRAINT pk_tags        PRIMARY KEY (tag_id),
    CONSTRAINT uq_tags_name   UNIQUE (tag_name)
);

CREATE TABLE post_tags (
    post_id INT NOT NULL,
    tag_id  INT NOT NULL,
    CONSTRAINT pk_post_tags       PRIMARY KEY (post_id, tag_id),
    CONSTRAINT fk_pt_post         FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
    CONSTRAINT fk_pt_tag          FOREIGN KEY (tag_id)  REFERENCES tags(tag_id)
);
CREATE INDEX ix_post_tags_tag ON post_tags(tag_id);

CREATE TABLE comments (
    comment_id  SERIAL       NOT NULL,
    post_id     INT          NOT NULL,
    author_id   INT          NOT NULL,
    body        TEXT         NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_comments        PRIMARY KEY (comment_id),
    CONSTRAINT fk_comments_post   FOREIGN KEY (post_id)   REFERENCES posts(post_id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES authors(author_id)
);
CREATE INDEX ix_comments_post   ON comments(post_id);
CREATE INDEX ix_comments_author ON comments(author_id);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'A Student can enrol in many Courses, and a Course can have many Students enrolled. What relationship type is this, and how is it implemented in SQL?',
      options: [
        '1:N — add a FK column on the Students table',
        'M:N — create a junction table with FKs to both Students and Courses',
        '1:1 — add a UNIQUE FK on the Courses table',
        'M:N — add FK columns to both Students and Courses',
      ],
      answer: 1,
      explanation: 'Many-to-many relationships cannot be stored with just FK columns (one row can only hold one value). A junction table (Enrollments) with FKs to both parent tables — and a composite PK of both FKs — is the standard solution.',
    },
    {
      q: 'An OrderLine entity has the columns (OrderID, LineNumber, ProductID, Quantity). OrderLine cannot exist without an Order. What type of entity is OrderLine?',
      options: ['Strong entity', 'Weak entity', 'Associative entity', 'Derived entity'],
      answer: 1,
      explanation: 'A weak entity depends on a parent entity for its identity. OrderLine cannot exist without an Order, and its PK (OrderID, LineNumber) includes the parent\'s PK (OrderID). This is called an identifying relationship.',
    },
    {
      q: 'Where should the FK column go in a 1:N relationship between Departments (1) and Employees (N)?',
      options: [
        'On the Departments table: Departments.EmployeeID',
        'On the Employees table: Employees.DepartmentID',
        'In a junction table: DeptEmployee(DeptID, EmpID)',
        'On both tables: Departments.EmployeeID and Employees.DepartmentID',
      ],
      answer: 1,
      explanation: 'In a 1:N relationship, the FK goes on the "many" side (Employees), pointing to the PK of the "one" side (Departments). A junction table is only needed for M:N.',
    },
    {
      q: 'You have a Person entity with a PhoneNumbers attribute that can hold multiple phone numbers. How should this be modeled?',
      options: [
        'Add columns Phone1, Phone2, Phone3 to the Person table',
        'Store all phone numbers as a comma-separated string in one column',
        'Create a separate PersonPhones table with a FK to Person',
        'Add a JSON column to Person to store all phone numbers',
      ],
      answer: 2,
      explanation: 'A multivalued attribute (zero or more values per entity) must be extracted to a child table. Phone1/Phone2/Phone3 columns are the "repeating groups" anti-pattern that violates 1NF. A child table allows any number of phones and enables efficient filtering/indexing.',
    },
    {
      q: 'A junction table for Post ↔ Tag has columns (PostID, TagID). What should be its primary key?',
      options: [
        'A surrogate IDENTITY column (JunctionID)',
        'PostID alone',
        'The composite key (PostID, TagID)',
        'TagID alone',
      ],
      answer: 2,
      explanation: 'The composite primary key (PostID, TagID) ensures that each post-tag combination is unique and eliminates duplicates at the database level. A surrogate key on a junction table adds no value and removes the uniqueness guarantee.',
    },
    {
      q: 'You want to use a UUID as the primary key for an events table in MSSQL. Which function avoids clustered index fragmentation?',
      options: [
        'NEWID() — generates a random UUID (v4)',
        'NEWSEQUENTIALID() — generates a time-ordered UUID that increments with each insert',
        'GETDATE() — timestamps are sequential',
        'HASHBYTES(\'SHA1\', GETDATE()) — hashes are stable',
      ],
      answer: 1,
      explanation: 'NEWID() generates random UUIDs whose unpredictable order causes every insert to land at a random page in the clustered B-tree index — the root cause of index fragmentation and page splits. NEWSEQUENTIALID() generates UUIDs that always increase, so inserts go to the end of the index just like an IDENTITY column.',
    },
    {
      q: 'What is the primary problem with the EAV (Entity-Attribute-Value) pattern?',
      options: [
        'EAV tables are always slower to write than normalized tables',
        'All values are stored as strings — no type safety, no FK constraints, and aggregation requires complex pivoting',
        'EAV tables cannot have primary keys',
        'EAV is not supported in PostgreSQL',
      ],
      answer: 1,
      explanation: 'EAV stores all attribute values as VARCHAR/TEXT, so numeric, date, and boolean semantics are lost. You cannot add a CHECK constraint, enforce NOT NULL for specific attributes, or write simple WHERE clauses. Aggregating requires a PIVOT or a chain of CASE expressions. The recommended alternatives are typed columns for fixed attributes and a JSON/JSONB column for flexible extras.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use a junction table vs. just adding a FK column?',
      a: 'Use a FK column for 1:N relationships (the FK goes on the "many" side). Use a junction table whenever the relationship is M:N — any situation where one row from table A can relate to many rows from table B AND vice versa. If the junction table starts accumulating its own attributes (price_at_time_of_purchase, granted_on, role), it has become a first-class entity and should be named accordingly (OrderLine, Membership, Permission).',
    },
    {
      q: 'Should I model derived attributes (e.g. age from birth_date) as columns?',
      a: 'Generally no. Storing derived values creates update anomalies — if birth_date changes, age must also be updated. Compute age in the query (DATEDIFF(year, birth_date, GETDATE()) in MSSQL; EXTRACT(year FROM age(birth_date)) in PostgreSQL). Only materialise derived values when query performance demands it, and document clearly that the column is computed from another source.',
    },
    {
      q: 'I have a Category entity, and categories can have sub-categories (parent-child hierarchy). How do I model that?',
      a: 'Use an adjacency list: add a nullable self-referencing FK column parent_category_id back to the same table. A root category has parent_category_id = NULL. To query the hierarchy, use a recursive CTE. This pattern works in both MSSQL and PostgreSQL. For very deep hierarchies or frequent subtree queries, consider the nested-set model or a path-enumeration column instead.',
    },
    {
      q: 'Should I use a surrogate integer key or a natural key as my primary key?',
      a: 'Use a surrogate integer PK (IDENTITY/SERIAL) for most tables, and apply a UNIQUE constraint on the natural key separately. Surrogate PKs are compact (4 bytes vs. a long string), never change (emails and product codes do change), and make FK columns simple single integers. Natural keys are fine for lookup/reference tables where the code IS the meaningful identifier (country codes, currency codes, status values) — but even there, watch out for length and mutability. Bottom line: <strong>PK = surrogate INT, UNIQUE = natural key</strong>.',
    },
    {
      q: 'How do I model a 1:1 relationship in SQL?',
      a: 'Add a FK column on one table that references the PK of the other, then apply a UNIQUE constraint on that FK column (so each parent row maps to at most one child row). Place the FK on the "optional" side — the table whose record might not exist for every parent. Example: an Employee might have a DriverLicense record or not. The FK <code>employee_id</code> goes on DriverLicenses, not on Employees. UNIQUE(employee_id) ensures one license per employee. If the 1:1 is always total on both sides (every Employee always has exactly one Profile), consider merging the tables to avoid a join.',
    },
    {
      q: 'What are the alternatives to the EAV anti-pattern for flexible schemas?',
      a: 'Three main alternatives, in order of preference: (1) <strong>Typed nullable columns</strong> — add optional columns for attributes that are known in advance. Best when the set of attributes is small and stable; zero query complexity overhead. (2) <strong>JSON/JSONB column</strong> — store unknown or category-specific attributes as a JSON blob alongside typed columns for shared, filterable fields. PostgreSQL JSONB supports GIN indexes on specific keys for query performance. Works well for product catalogs or settings objects. (3) <strong>Class-table inheritance</strong> — a base table with common columns (id, created_at, type) and separate subtype tables (ProductClothing, ProductElectronics) each with their specific columns. Most type-safe, but requires an extra join per subtype.',
    },
    {
      q: 'How do I model a polymorphic association — where a comment can belong to either a Post or a Video?',
      a: 'Three approaches, in order of recommendation: (1) <strong>Two nullable FKs + CHECK constraint</strong>: <code>post_id INT NULL REFERENCES posts, video_id INT NULL REFERENCES videos</code> with <code>CHECK ((post_id IS NOT NULL AND video_id IS NULL) OR (post_id IS NULL AND video_id IS NOT NULL))</code>. Enforces FK integrity; requires adding a new FK column per new parent type. (2) <strong>Separate tables</strong>: PostComments and VideoComments — the cleanest design with full FK integrity and no NULLs, at the cost of more tables. (3) <strong>Abstract parent (Content table)</strong>: create a Content table that both Post and Video reference with a 1:1 FK, then Comment references Content. Avoids per-type FK columns at the cost of an extra join. Avoid the common (commentable_type VARCHAR, commentable_id INT) pattern — it cannot enforce FK integrity.',
    },
  ];
}
