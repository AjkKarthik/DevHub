import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-mssql-unique-one-null-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-mssql-unique-allows-only-one-null-not-multiple.html',
  styleUrl: './testing-that-mssql-unique-allows-only-one-null-not-multiple.scss',
})
export class TestingThatMssqlUniqueAllowsOnlyOneNullNotMultipleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Confident Claim That Gets MSSQL Backwards',
      points: [
        'The main page\'s Q&A states: "In standard SQL and PostgreSQL, NULL is considered distinct from all other values including itself — multiple NULLs are allowed in a UNIQUE column. MSSQL behaves the same by default (NULLs are not considered duplicates)." The PostgreSQL half of this claim is correct. The MSSQL half is not — it is, in fact, one of the most well-known divergences between SQL Server and the ANSI standard.',
        'SQL Server\'s UNIQUE constraint (and the unique index that backs it) treats ALL NULLs as equal to each other for uniqueness-checking purposes — meaning a UNIQUE column in SQL Server can hold AT MOST ONE NULL value, not "as many as you want" the way PostgreSQL and the standard permit. A second INSERT of NULL into that column raises a duplicate-key violation, exactly as if you\'d inserted the same non-NULL value twice.',
      ],
    },
    {
      heading: 'Why This Divergence Exists',
      points: [
        'Microsoft has documented this as intentional, longstanding SQL Server behavior — the unique index implementation does not special-case NULL the way the ANSI standard\'s three-valued-logic model does for row comparison in this specific context. This predates modern SQL Server versions and has never been changed, likely for backward-compatibility reasons.',
        'The main page\'s own filtered-unique-index workaround — "CREATE UNIQUE INDEX ON table (col) WHERE col IS NOT NULL" — is presented in the SAME Q&A as a fix for PostgreSQL\'s "too many NULLs allowed" scenario. Ironically, that exact same technique is also the standard SQL Server workaround, just solving the OPPOSITE problem: allowing MULTIPLE NULLs in SQL Server, where the default UNIQUE constraint would otherwise cap you at one.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'PostgreSQL — the main page\'s claim holds',
      language: 'sql',
      code: `CREATE TABLE contacts (id INT PRIMARY KEY, email TEXT UNIQUE);

INSERT INTO contacts VALUES (1, NULL);
INSERT INTO contacts VALUES (2, NULL);
-- Both succeed. PostgreSQL treats each NULL as distinct from every
-- other NULL for UNIQUE purposes -- exactly as the main page states.

SELECT COUNT(*) FROM contacts WHERE email IS NULL;
-- 2`,
    },
    {
      label: 'SQL Server — the exact same test fails on the second row',
      language: 'sql',
      code: `CREATE TABLE contacts (id INT PRIMARY KEY, email VARCHAR(200) UNIQUE);

INSERT INTO contacts VALUES (1, NULL);
-- Succeeds.

INSERT INTO contacts VALUES (2, NULL);
-- Violation of UNIQUE KEY constraint 'UQ__contacts__...'. Cannot
-- insert duplicate key in object 'dbo.contacts'. The duplicate key
-- value is (<NULL>).
--
-- SQL Server treats this second NULL as a DUPLICATE of the first --
-- directly contradicting the main page's "MSSQL behaves the same by
-- default (NULLs are not considered duplicates)" claim.`,
    },
    {
      label: 'The SQL Server workaround — allowing multiple NULLs on purpose',
      language: 'sql',
      code: `-- To get PostgreSQL's "multiple NULLs allowed" behavior in SQL
-- Server, drop the plain UNIQUE constraint and use a FILTERED
-- unique index that excludes NULLs from the uniqueness check entirely:
CREATE TABLE contacts (id INT PRIMARY KEY, email VARCHAR(200));

CREATE UNIQUE INDEX uq_contacts_email
    ON contacts (email)
    WHERE email IS NOT NULL;

INSERT INTO contacts VALUES (1, NULL);
INSERT INTO contacts VALUES (2, NULL);
-- Both succeed now -- the filtered index only enforces uniqueness
-- among NON-NULL values, so any number of NULLs can coexist.
--
-- This is the SAME filtered-index technique the main page's Q&A
-- recommends for the opposite scenario (limiting PostgreSQL to a
-- single NULL) -- here it solves SQL Server's default one-NULL cap
-- instead.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team migrating a contacts table from PostgreSQL to SQL Server keeps the email column as UNIQUE (not NULL-restricted, since some contacts genuinely have no email on file) and the migration works fine in testing with a handful of rows. In production, inserts start failing with duplicate-key violations on NULL emails once there are two or more contacts with no email. What\'s actually happening, and what\'s the fix?',
    hint: 'The bug wasn\'t present in early testing because testing likely only had ONE contact without an email — trace what changes once a SECOND NULL email is inserted.',
    solution: `SQL Server's plain UNIQUE constraint treats all NULLs as duplicates
of each other, capping the email column at exactly ONE NULL value
total. The bug was invisible in early testing purely because testing
happened to have only one no-email contact -- the moment a second
contact with no email is inserted, SQL Server raises a duplicate-key
violation, since (from SQL Server's perspective) two NULLs are the
same "value" being inserted twice.

The fix is to replace the plain UNIQUE constraint with a FILTERED
unique index that excludes NULLs: CREATE UNIQUE INDEX ... ON contacts
(email) WHERE email IS NOT NULL. This preserves uniqueness among
contacts that DO have an email while allowing any number of contacts
with NULL email to coexist -- restoring the exact behavior the
original PostgreSQL UNIQUE constraint provided by default, which the
team's migration assumed (incorrectly) SQL Server's plain UNIQUE
constraint would also provide.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'SQL Server\'s UNIQUE constraint behaves identically to PostgreSQL\'s — both allow any number of NULL values in a unique column, since NULL is never equal to NULL.',
      reality: 'this is true for PostgreSQL but backwards for SQL Server — SQL Server\'s UNIQUE constraint treats all NULLs as duplicates of each other, allowing AT MOST ONE NULL in a unique column by default.',
    },
    {
      thought: 'a UNIQUE constraint that works correctly in testing (allowing one NULL row) will continue to work correctly once a second NULL row is inserted, since the constraint\'s behavior doesn\'t change.',
      reality: 'in SQL Server specifically, a UNIQUE constraint\'s NULL-handling bug (capping at one NULL) is only visible once a SECOND NULL is inserted — testing with a single NULL row will pass even though the constraint is not providing the behavior a PostgreSQL-trained developer expects.',
    },
    {
      thought: 'the filtered-unique-index technique (WHERE col IS NOT NULL) is a PostgreSQL-specific workaround for a PostgreSQL-specific problem (too many NULLs allowed).',
      reality: 'the identical technique is ALSO the standard SQL Server workaround, but for the opposite problem — SQL Server needs it to ALLOW multiple NULLs, since its default UNIQUE constraint caps NULLs at one.',
    },
  ];
}
