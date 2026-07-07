import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-name-normaliser-null-bug-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-name-normaliser-returns-null-for-a-null-last-name.html',
  styleUrl: './testing-that-name-normaliser-returns-null-for-a-null-last-name.scss',
})
export class TestingThatNameNormaliserReturnsNullForANullLastNameSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Solution Never Run Against Messy Data',
      points: [
        'The main page\'s challenge solution builds full_name using string concatenation with the || operator: UPPER(SUBSTRING(...)) || LOWER(SUBSTRING(...)) || \', \' || UPPER(...) || LOWER(...). It is presented as the correct answer, but it is never actually run against a customers table that has any NULL values — exactly the kind of "messy data" the challenge\'s own premise implies the query needs to handle.',
        'PostgreSQL\'s || concatenation operator returns NULL if ANY operand is NULL — there is no NULL-as-empty-string forgiveness the way MSSQL\'s CONCAT() has (a fact the main page itself documents elsewhere, in the CONCAT() quiz question). This subtopic runs the solution against a row with a NULL last_name and shows exactly what breaks.',
      ],
    },
    {
      heading: 'Why It Breaks: NULL Propagation Through ||',
      points: [
        'SUBSTRING(NULL, 1, 1) evaluates to NULL. UPPER(NULL) is NULL. From there, every subsequent || concatenation involving that NULL also becomes NULL, because || (like most SQL operators) propagates NULL rather than skipping it.',
        'The practical effect: a single customer with a missing last_name doesn\'t just get a blank or partial full_name — the ENTIRE full_name column value becomes NULL for that row, silently, with no error and no warning. email_domain and clean_phone for the same row are unaffected, since they don\'t depend on last_name — only full_name breaks, which can look confusing in a result set where some columns for a row are populated and one specific column is inexplicably blank.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the bug',
      language: 'sql',
      code: `CREATE TABLE customers (
    id INT, first_name TEXT, last_name TEXT, email TEXT, phone TEXT
);
INSERT INTO customers VALUES
    (1, 'Alice', 'Smith', 'ALICE@Example.com', '555-123-4567'),
    (2, 'Bob',   NULL,    'bob@example.com',   '555-987-6543');   -- no last name on file

-- The main page's own solution, run as-is:
SELECT
    UPPER(SUBSTRING(TRIM(last_name), 1, 1))  || LOWER(SUBSTRING(TRIM(last_name), 2))
    || ', '
    || UPPER(SUBSTRING(TRIM(first_name), 1, 1)) || LOWER(SUBSTRING(TRIM(first_name), 2))
        AS full_name,
    SPLIT_PART(LOWER(TRIM(email)), '@', 2)      AS email_domain,
    REGEXP_REPLACE(phone, '[^0-9]', '', 'g')    AS clean_phone,
    LENGTH(TRIM(first_name)) + LENGTH(TRIM(last_name)) + 2
        AS name_length
FROM customers;

-- id=1: full_name = 'Smith, Alice'                -- correct
-- id=2: full_name = NULL                          -- entire column silently NULL
--       name_length = NULL too, for the same reason (LENGTH(NULL) = NULL,
--       and NULL + anything = NULL)
--       email_domain and clean_phone for id=2 ARE populated correctly --
--       only the two expressions that touch last_name break.`,
    },
    {
      label: 'The fix — COALESCE around the NULL-able input',
      language: 'sql',
      code: `SELECT
    UPPER(SUBSTRING(COALESCE(TRIM(last_name), ''), 1, 1))
    || LOWER(SUBSTRING(COALESCE(TRIM(last_name), ''), 2))
    || CASE WHEN last_name IS NOT NULL THEN ', ' ELSE '' END
    || UPPER(SUBSTRING(TRIM(first_name), 1, 1)) || LOWER(SUBSTRING(TRIM(first_name), 2))
        AS full_name,
    SPLIT_PART(LOWER(TRIM(email)), '@', 2)      AS email_domain,
    REGEXP_REPLACE(phone, '[^0-9]', '', 'g')    AS clean_phone,
    LENGTH(TRIM(first_name)) + COALESCE(LENGTH(TRIM(last_name)), 0)
        AS name_length
FROM customers;

-- id=2: full_name = 'Bob'  -- degrades gracefully to just the first name
--       instead of silently vanishing entirely.
-- COALESCE(x, '') substitutes an empty string only for the purpose of
-- the concatenation -- the CASE WHEN avoids leaving a stray ", " prefix
-- when there's no last name to pair it with.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A support ticket reports "some customers show a blank name in the export, but their email and phone are fine." Based on the bug demonstrated above, what specific column condition is almost certainly true for every affected row, and why would email/phone be unaffected on the very same rows?',
    hint: 'Trace which SQL expressions in the solution actually reference last_name, versus which ones are entirely independent of it.',
    solution: `The affected rows almost certainly have last_name IS NULL. The ||
concatenation operator propagates NULL through the entire chained
expression that builds full_name -- so any row with a NULL last_name
gets a NULL full_name, with no partial result and no error.

email_domain and clean_phone are unaffected on the same rows because
neither expression references last_name at all -- SPLIT_PART(email, ...)
and REGEXP_REPLACE(phone, ...) only depend on the email and phone
columns, which are independently NULL or non-NULL. This is exactly
why the bug is confusing to a support agent looking at the export:
it looks like an inconsistent, row-specific failure, when it's
actually a completely predictable, deterministic consequence of one
column (last_name) being NULL and one specific expression (the
one building full_name) not guarding against it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s "Name normaliser query" challenge solution is a fully correct, production-ready answer since it was presented as the solution to the challenge.',
      reality: 'the solution was never tested against a row with a NULL last_name -- when run against one, the || concatenation silently propagates NULL through the entire full_name expression, producing NULL instead of a usable name.',
    },
    {
      thought: 'if a query returns NULL for one column on a row, the other columns computed by the same query must also be affected, since something is clearly "broken" for that row.',
      reality: 'NULL propagation in SQL is expression-scoped, not row-scoped -- only the specific expressions that reference the NULL-producing column are affected; unrelated expressions in the same SELECT list compute normally.',
    },
    {
      thought: 'PostgreSQL\'s || concatenation operator and MSSQL\'s CONCAT() function handle NULL inputs the same way.',
      reality: 'they are opposites for this exact case -- MSSQL\'s CONCAT() treats a NULL argument as an empty string (as the main page\'s own quiz question states), while PostgreSQL\'s || returns NULL for the entire expression the moment any operand is NULL.',
    },
  ];
}
