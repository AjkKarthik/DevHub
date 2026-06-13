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
        'Rule 6 — Weak entities → the junction table uses the parent PK as part of its own composite PK (identifying relationship).',
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
  ];
}
