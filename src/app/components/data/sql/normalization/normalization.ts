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
    { name: '1NF',                    type: 'keyword', desc: 'First Normal Form: atomic values, no repeating groups, each row uniquely identified by a PK.' },
    { name: '2NF',                    type: 'keyword', desc: 'Second Normal Form: in 1NF AND every non-key column depends on the WHOLE primary key (no partial dependencies).' },
    { name: '3NF',                    type: 'keyword', desc: 'Third Normal Form: in 2NF AND no transitive dependencies (non-key columns depend only on the PK).' },
    { name: 'BCNF',                   type: 'keyword', desc: 'Boyce-Codd Normal Form: stricter than 3NF — every determinant is a candidate key.' },
    { name: 'Functional Dependency',  type: 'keyword', desc: 'A → B: knowing the value of A determines the value of B. e.g. CustomerID → CustomerName.' },
    { name: 'Partial Dependency',     type: 'keyword', desc: 'A non-key column depends on only PART of a composite PK. Violates 2NF.' },
    { name: 'Transitive Dependency',  type: 'keyword', desc: 'A non-key column depends on another non-key column. Violates 3NF. (PK → X → Y where X is non-key).' },
    { name: 'Update Anomaly',         type: 'keyword', desc: 'Changing a value requires updating multiple rows — risk of inconsistency if some rows are missed.' },
    { name: 'Insert Anomaly',         type: 'keyword', desc: 'Cannot insert data about one entity without also having data for another (e.g. can\'t add a course without a student).' },
    { name: 'Delete Anomaly',         type: 'keyword', desc: 'Deleting a row destroys data about an unrelated entity (e.g. deleting the last enrollment removes the course info).' },
    { name: 'Denormalization',        type: 'keyword', desc: 'Intentionally introducing redundancy for performance. Only valid after measuring a real bottleneck.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Normalize? Anomalies in Unnormalized Data',
      points: [
        'An unnormalized table stores multiple facts in one row — mixing entity types, repeating data, or using non-atomic values. This leads to three types of anomalies.',
        'Update anomaly: a fact is stored redundantly. To change a customer\'s city you must update every row that mentions that customer. Miss one and the data is inconsistent.',
        'Insert anomaly: you cannot record a new fact without recording another. If CourseID is stored in the Enrollments table alongside course details, you cannot add a course until at least one student enrolls.',
        'Delete anomaly: deleting a row destroys unrelated data. If the last student drops a course, deleting that enrollment row also destroys the course name and instructor details.',
        'Normalization eliminates these by ensuring each fact is stored exactly once and each table has a single, clear subject.',
      ],
    },
    {
      heading: 'First Normal Form (1NF)',
      points: [
        '1NF requires: (1) each column contains atomic (indivisible) values, (2) no repeating groups (no Phone1, Phone2, Phone3 columns), (3) all rows are uniquely identified by a primary key.',
        'Violation — non-atomic: a Tags column containing "sql,performance,indexing" in one cell. Fix: create a separate Tags table.',
        'Violation — repeating groups: columns Phone1, Phone2, Phone3. Fix: create a PersonPhones(PersonID, Phone) child table.',
        'Violation — no PK: a table with no unique identifier. Fix: add a surrogate IDENTITY / SERIAL column.',
        'In both MSSQL and PostgreSQL, using VARCHAR for comma-separated lists or JSON for what should be relational columns violates 1NF intent — though the engine won\'t prevent it.',
      ],
    },
    {
      heading: 'Second Normal Form (2NF) — Eliminates Partial Dependencies',
      points: [
        '2NF only applies when the primary key is composite (more than one column). A table with a single-column PK in 1NF is automatically in 2NF.',
        'Partial dependency: a non-key column depends on only PART of the composite PK, not the whole thing.',
        'Example violation: Enrollments(StudentID, CourseID, CourseName, Grade). CourseName depends only on CourseID, not on the full composite PK (StudentID, CourseID).',
        'Fix: move CourseName out into a Courses(CourseID, CourseName) table. The Enrollments table keeps only (StudentID, CourseID, Grade).',
        'Result: CourseName is stored once, not repeated for every student enrolled in that course. Update anomalies for course names are eliminated.',
      ],
    },
    {
      heading: 'Third Normal Form (3NF) — Eliminates Transitive Dependencies',
      points: [
        'Transitive dependency: a non-key column A depends on another non-key column B, which depends on the PK. Pattern: PK → B → A.',
        'Example violation: Employees(EmployeeID, DeptID, DeptName, DeptCity). DeptName depends on DeptID, not directly on EmployeeID. DeptID → DeptName is a transitive dependency.',
        'Fix: extract Departments(DeptID, DeptName, DeptCity). Employees keeps only (EmployeeID, DeptID, …). Now DeptName is stored once per department.',
        'Classic mnemonic: "Every non-key attribute must depend on the key, the whole key, and nothing but the key (so help me Codd)." — 1NF, 2NF, 3NF in one sentence.',
        'After reaching 3NF, most practical schemas are free of the major anomalies. BCNF is stricter but rarely needed outside academia.',
      ],
    },
    {
      heading: 'BCNF and Denormalization',
      points: [
        'Boyce-Codd Normal Form (BCNF): for every functional dependency X → Y, X must be a candidate key. Stricter than 3NF — handles edge cases with overlapping candidate keys.',
        'Most 3NF schemas are also in BCNF. Violations only arise when a table has multiple overlapping candidate keys — rare in practice.',
        'Denormalization: intentionally adding redundancy back after normalizing, to avoid expensive JOINs or aggregations in hot query paths.',
        'Valid denormalization examples: caching a computed column (e.g. order_total stored alongside order lines for fast retrieval), duplicating a frequently joined column to avoid a JOIN, pre-aggregated summary tables.',
        'Rule: normalize first, then denormalize only where a measured query performance problem exists. Never denormalize speculatively. Document every denormalization with a comment explaining why and what must stay in sync.',
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
    CustomerID INT          NOT NULL REFERENCES Customers(CustomerID),
    Phone      VARCHAR(30)  NOT NULL,
    CONSTRAINT PK_CustPhone PRIMARY KEY (CustomerID, Phone)
);

CREATE TABLE CustomerTags (             -- comma-separated Tags → child table
    CustomerID INT          NOT NULL REFERENCES Customers(CustomerID),
    Tag        VARCHAR(50)  NOT NULL,
    CONSTRAINT PK_CustTag PRIMARY KEY (CustomerID, Tag)
);
-- Now each cell is atomic, no repeating groups, and every row has a PK.`,
    },
    {
      label: '1NF → 2NF',
      language: 'sql',
      code: `-- ── VIOLATES 2NF (partial dependency on composite PK) ───────────────────
-- Enrollments(StudentID, CourseID, CourseName, InstructorName, Grade)
-- CourseName depends on CourseID alone, not the full (StudentID, CourseID) PK.
-- If the course name changes, every enrollment row must be updated.

-- ── 2NF: remove partial dependencies ─────────────────────────────────────
CREATE TABLE Courses (
    CourseID      INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    CourseName    NVARCHAR(200) NOT NULL,
    InstructorName NVARCHAR(200) NOT NULL  -- note: still has a 3NF problem (see next tab)
);

CREATE TABLE Enrollments (
    StudentID INT     NOT NULL,
    CourseID  INT     NOT NULL REFERENCES Courses(CourseID),
    Grade     CHAR(1) NULL CHECK (Grade IN ('A','B','C','D','F')),
    CONSTRAINT PK_Enrollments PRIMARY KEY (StudentID, CourseID)
);
-- CourseName and InstructorName are now stored once in Courses.
-- Enrollments only stores the student-course relationship + grade.`,
    },
    {
      label: '2NF → 3NF',
      language: 'sql',
      code: `-- ── VIOLATES 3NF (transitive dependency) ────────────────────────────────
-- Courses(CourseID, CourseName, InstructorID, InstructorName, InstructorDept)
-- InstructorName and InstructorDept depend on InstructorID (not CourseID directly).
-- CourseID → InstructorID → InstructorName  (transitive)

-- ── 3NF: extract transitively dependent columns ───────────────────────────
CREATE TABLE Instructors (
    InstructorID   INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    InstructorName NVARCHAR(200) NOT NULL,
    Department     NVARCHAR(100) NOT NULL
);

CREATE TABLE Courses (
    CourseID     INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    CourseName   NVARCHAR(200) NOT NULL,
    InstructorID INT           NOT NULL REFERENCES Instructors(InstructorID)
    -- InstructorName removed — now lives in Instructors only
);
CREATE INDEX IX_Courses_Instructor ON Courses(InstructorID);

-- Final schema is in 3NF:
-- Enrollments(StudentID, CourseID, Grade)
-- Courses(CourseID, CourseName, InstructorID)
-- Instructors(InstructorID, InstructorName, Department)
-- Each non-key column depends on the PK, the whole PK, and nothing but the PK.`,
    },
    {
      label: 'Denormalization example',
      language: 'sql',
      code: `-- ── PROBLEM: calculating order total requires joining OrderLines every time ─
SELECT o.OrderID, SUM(ol.Qty * ol.UnitPrice) AS Total
FROM Orders o JOIN OrderLines ol ON o.OrderID = ol.OrderID
WHERE o.OrderID = 12345;

-- ── DENORMALIZATION: store OrderTotal on Orders for fast retrieval ─────────
ALTER TABLE Orders ADD OrderTotal DECIMAL(12,2) NULL;

-- Keep OrderTotal in sync with a trigger (MSSQL):
CREATE TRIGGER trg_RecalcOrderTotal
ON OrderLines AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    UPDATE o
    SET o.OrderTotal = (
        SELECT SUM(Qty * UnitPrice)
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

-- PostgreSQL equivalent would use a similar trigger function.
-- Document the denormalization: OrderTotal is derived from OrderLines.
-- Always update via triggers or application logic — never set it directly.`,
    },
  ];

  challenge: Challenge = {
    title: 'Normalize an Order Form Table',
    language: 'sql',
    description: 'The following unnormalized table captures order data from a legacy form. Identify all normalization violations and produce a clean 3NF schema.',
    hints: [
      'Look for repeating groups (Item1, Item2...) — these violate 1NF',
      'CustomerCity depends on CustomerID, not on OrderID — transitive dependency',
      'ProductName depends on ProductID, not the composite PK of the order line',
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

-- Step 2: write the normalized schema (PostgreSQL or MSSQL)
CREATE TABLE customers ( /* ... */ );
CREATE TABLE products   ( /* ... */ );
CREATE TABLE orders     ( /* ... */ );
CREATE TABLE order_lines( /* ... */ );`,
    solution: `-- VIOLATIONS:
-- 1NF: Item1_*, Item2_*, Item3_* are repeating groups — must become a child table
-- 2NF: ProductName depends only on ProductID (partial dep in the line composite PK)
-- 3NF: CustomerName, CustomerCity depend on CustomerID, not OrderID (transitive dep)

-- NORMALIZED SCHEMA (PostgreSQL):
CREATE TABLE customers (
    customer_id   SERIAL       NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    city          VARCHAR(100) NOT NULL,
    CONSTRAINT pk_customers PRIMARY KEY (customer_id)
);

CREATE TABLE products (
    product_id   SERIAL        NOT NULL,
    product_name VARCHAR(200)  NOT NULL,
    CONSTRAINT pk_products PRIMARY KEY (product_id)
);

CREATE TABLE orders (
    order_id    SERIAL      NOT NULL,
    customer_id INT         NOT NULL,
    order_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT pk_orders         PRIMARY KEY (order_id),
    CONSTRAINT fk_orders_cust    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);
CREATE INDEX ix_orders_customer ON orders(customer_id);

CREATE TABLE order_lines (
    order_id    INT            NOT NULL,
    product_id  INT            NOT NULL,
    qty         INT            NOT NULL CHECK (qty > 0),
    unit_price  DECIMAL(10,2)  NOT NULL CHECK (unit_price > 0),
    CONSTRAINT pk_order_lines        PRIMARY KEY (order_id, product_id),
    CONSTRAINT fk_ol_order           FOREIGN KEY (order_id)   REFERENCES orders(order_id),
    CONSTRAINT fk_ol_product         FOREIGN KEY (product_id) REFERENCES products(product_id)
);
CREATE INDEX ix_order_lines_product ON order_lines(product_id);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'A table has a composite PK of (OrderID, ProductID). The column ProductName depends only on ProductID. Which normal form does this violate?',
      options: ['1NF', '2NF', '3NF', 'BCNF'],
      answer: 1,
      explanation: '2NF requires every non-key column to depend on the WHOLE primary key. ProductName depends on only ProductID (part of the composite PK) — this is a partial dependency, which violates 2NF.',
    },
    {
      q: 'A table has columns: EmployeeID (PK), DeptID, DeptName. DeptName depends on DeptID, not directly on EmployeeID. Which normal form does this violate?',
      options: ['1NF', '2NF', '3NF', 'It does not violate any normal form'],
      answer: 2,
      explanation: '3NF prohibits transitive dependencies. EmployeeID → DeptID → DeptName: DeptName depends on DeptID (a non-key column), not on the PK directly. Fix: move DeptName into a Departments table.',
    },
    {
      q: 'A Tags column stores "sql,python,performance" as a single string. Which normal form does this violate?',
      options: ['1NF', '2NF', '3NF', 'BCNF'],
      answer: 0,
      explanation: '1NF requires atomic (indivisible) values. A comma-separated list in one cell is not atomic. Fix: extract to a child table (Tags) with one row per tag.',
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
      explanation: 'Denormalization re-introduces redundancy and update anomalies. It is only justified when a specific, measured query performance problem exists in a normalized schema. Never denormalize speculatively.',
    },
    {
      q: 'The mnemonic "depends on the key, the whole key, and nothing but the key" describes which three normal forms respectively?',
      options: [
        '1NF (the key), 2NF (the whole key), 3NF (nothing but the key)',
        '2NF (the key), 3NF (the whole key), BCNF (nothing but the key)',
        '1NF, 3NF, BCNF',
        '2NF, BCNF, 4NF',
      ],
      answer: 0,
      explanation: '"Depends on the key" = 1NF (every row has a PK). "The whole key" = 2NF (no partial dependencies). "Nothing but the key" = 3NF (no transitive dependencies). This is the classic Codd mnemonic.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Does 2NF only apply to tables with composite primary keys?',
      a: 'Yes. A partial dependency means a non-key column depends on only PART of the composite PK. If the PK is a single column, every non-key column either depends on it or it doesn\'t — there is no "part of" to have a partial dependency on. So a table with a single-column PK that is in 1NF is automatically in 2NF. This is why using surrogate integer PKs (IDENTITY / SERIAL) often sidesteps 2NF violations — but you must still check for 3NF transitive dependencies.',
    },
    {
      q: 'In practice, do I always need to normalize to 3NF before shipping?',
      a: '3NF is the standard target for OLTP (transactional) schemas. Aim for 3NF by default. The cases where you might stop at 2NF or intentionally denormalize: (1) read-heavy reporting/analytical schemas where the cost of JOINs outweighs the anomaly risk (data warehouses often use star/snowflake schemas with deliberate redundancy), (2) when the data is append-only or immutable (event logs, audit tables), (3) after profiling shows a real JOIN overhead in a hot query path. Never denormalize because JOINs "seem slow" without measuring.',
    },
    {
      q: 'What is 4NF and do I need it?',
      a: '4NF eliminates multi-valued dependencies — cases where a table stores two independent multi-valued facts about an entity. Example: an Employee table with columns (EmpID, Skill, Language) where skills and languages are independent — one combination can incorrectly imply a relationship. 4NF says each multi-valued dependency should be in its own table (EmpSkills, EmpLanguages). In practice, 3NF is sufficient for most schemas. 4NF and 5NF arise in specialized scenarios and are more relevant in academic normalization theory than day-to-day work.',
    },
  ];
}
