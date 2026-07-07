import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-on-delete-restrict-invalid-tsql-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-on-delete-restrict-is-invalid-t-sql-syntax.html',
  styleUrl: './testing-that-on-delete-restrict-is-invalid-t-sql-syntax.scss',
})
export class TestingThatOnDeleteRestrictIsInvalidTSqlSyntaxSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Very First Example Doesn\'t Run in SQL Server',
      points: [
        'The main page\'s opening "CREATE TABLE with constraints" code tab declares: CONSTRAINT fk_orders_customer REFERENCES customers(customer_id) ON DELETE RESTRICT ON UPDATE CASCADE. RESTRICT is part of the ANSI SQL standard and is valid in PostgreSQL, MySQL, and other engines — but T-SQL\'s CREATE TABLE / ALTER TABLE referential-action clause only accepts exactly four keywords: NO ACTION, CASCADE, SET NULL, SET DEFAULT. RESTRICT is not one of them.',
        'Running the page\'s own example verbatim against SQL Server raises "Incorrect syntax near \'RESTRICT\'." — a parse-time failure, not a runtime one. The theory section elsewhere on the same page correctly LISTS "RESTRICT/NO ACTION: reject the operation (default)" as if they were interchangeable synonyms available in both dialects, which is exactly the assumption that produces this broken code tab.',
      ],
    },
    {
      heading: 'Why SQL Server Dropped RESTRICT',
      points: [
        'RESTRICT and NO ACTION describe functionally similar behavior (reject the delete/update if child rows would be orphaned) but differ in WHEN the check happens relative to other triggers and cascading actions within the same statement — a distinction the ANSI standard preserves as two separate keywords. SQL Server\'s implementation only exposes the NO ACTION behavior as a referential action keyword; it has no keyword-level equivalent to RESTRICT\'s stricter, immediate-check semantics.',
        'In practice, T-SQL\'s NO ACTION is what a developer coming from PostgreSQL should reach for wherever they would otherwise write RESTRICT — the actual enforcement (reject the delete of a parent with existing children) is what SQL Server\'s NO ACTION provides, even though the keyword itself is different from PostgreSQL\'s RESTRICT.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own code, run against SQL Server',
      language: 'sql',
      code: `CREATE TABLE customers (customer_id INT PRIMARY KEY, name VARCHAR(100));

CREATE TABLE orders (
    order_id    INT           CONSTRAINT pk_orders PRIMARY KEY,
    customer_id INT           NOT NULL
                              CONSTRAINT fk_orders_customer
                                REFERENCES customers(customer_id)
                                ON DELETE RESTRICT
                                ON UPDATE CASCADE,
    status      VARCHAR(20)   NOT NULL DEFAULT 'Pending'
);

-- Msg 156, Level 15, State 1, Line 6
-- Incorrect syntax near 'RESTRICT'.
--
-- SQL Server's REFERENCES clause only accepts:
-- { NO ACTION | CASCADE | SET NULL | SET DEFAULT } -- RESTRICT is
-- simply not a recognized token in T-SQL's CREATE TABLE grammar.`,
    },
    {
      label: 'The T-SQL-correct fix',
      language: 'sql',
      code: `CREATE TABLE orders (
    order_id    INT           CONSTRAINT pk_orders PRIMARY KEY,
    customer_id INT           NOT NULL
                              CONSTRAINT fk_orders_customer
                                REFERENCES customers(customer_id)
                                ON DELETE NO ACTION   -- was: RESTRICT
                                ON UPDATE CASCADE,
    status      VARCHAR(20)   NOT NULL DEFAULT 'Pending'
);
-- Succeeds. NO ACTION provides the "reject the delete if child rows
-- exist" behavior the page's own theory describes for RESTRICT --
-- it's the correct T-SQL keyword for that intent, even though the
-- literal word "RESTRICT" itself isn't valid syntax here.`,
    },
    {
      label: 'Confirming PostgreSQL accepts RESTRICT (why the confusion happens)',
      language: 'sql',
      code: `-- The exact same ON DELETE RESTRICT syntax IS valid in PostgreSQL:
CREATE TABLE customers (customer_id INT PRIMARY KEY, name TEXT);
CREATE TABLE orders (
    order_id    INT PRIMARY KEY,
    customer_id INT NOT NULL
                REFERENCES customers(customer_id)
                ON DELETE RESTRICT
                ON UPDATE CASCADE
);
-- Succeeds without modification -- confirming RESTRICT is a genuine,
-- standard SQL keyword, just not one SQL Server chose to implement
-- for this clause. This is exactly the kind of assumption a
-- PostgreSQL-first developer would reasonably (but incorrectly)
-- carry over when writing T-SQL DDL for the first time.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer familiar with PostgreSQL copies the main page\'s exact "CREATE TABLE with constraints" example into SQL Server Management Studio and gets "Incorrect syntax near \'RESTRICT\'." Their first instinct is to check whether they mistyped something. What should they actually check instead, and what\'s the one-word fix?',
    hint: 'The main page\'s own theory section lists "RESTRICT/NO ACTION" together, as if either keyword works in either dialect — check whether that pairing holds for T-SQL specifically.',
    solution: `Rather than hunting for a typo, they should check whether RESTRICT is
actually a valid keyword in SQL Server's referential-action syntax at
all -- it isn't. T-SQL's ON DELETE / ON UPDATE clause only recognizes
NO ACTION, CASCADE, SET NULL, and SET DEFAULT. RESTRICT is valid ANSI
SQL and works fine in PostgreSQL (which is likely where the
developer's instinct to write it came from), but SQL Server simply
never implemented that specific keyword.

The one-word fix is replacing RESTRICT with NO ACTION -- which
provides the equivalent "reject the delete/update if child rows
exist" behavior the developer actually wants. This is a genuine
dialect gap, not a typo, and it's exactly the kind of assumption that
breaks when porting DDL scripts between PostgreSQL and SQL Server
without re-checking each dialect's actual supported keyword list.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ON DELETE RESTRICT is valid syntax in both MSSQL and PostgreSQL, since RESTRICT is a standard ANSI SQL keyword for foreign key referential actions.',
      reality: 'RESTRICT is valid in PostgreSQL and standard SQL, but SQL Server\'s T-SQL syntax for the REFERENCES clause only accepts NO ACTION, CASCADE, SET NULL, and SET DEFAULT — RESTRICT raises a parse-time syntax error in SQL Server.',
    },
    {
      thought: 'if the main page lists "RESTRICT/NO ACTION" together as if they were interchangeable synonyms usable in either dialect, that pairing is safe to copy directly into either database\'s DDL.',
      reality: 'the two keywords describe similar BEHAVIOR (reject the operation) but are not interchangeable at the SYNTAX level — SQL Server exposes only NO ACTION as a keyword, even though its behavior is what a PostgreSQL developer would expect from RESTRICT.',
    },
    {
      thought: 'a "syntax error near RESTRICT" in SQL Server most likely indicates a typo or a missing keyword elsewhere in the statement.',
      reality: 'in this specific case, the statement is otherwise correctly formed — the error is because RESTRICT itself is simply not a token SQL Server\'s grammar recognizes in this clause, not a typo anywhere else in the CREATE TABLE statement.',
    },
  ];
}
