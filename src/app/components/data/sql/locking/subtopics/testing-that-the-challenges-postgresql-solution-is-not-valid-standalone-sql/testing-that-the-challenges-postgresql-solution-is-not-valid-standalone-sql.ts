import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-challenge-postgresql-invalid-sql-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-challenges-postgresql-solution-is-not-valid-standalone-sql.html',
  styleUrl: './testing-that-the-challenges-postgresql-solution-is-not-valid-standalone-sql.scss',
})
export class TestingThatTheChallengesPostgresqlSolutionIsNotValidStandaloneSqlSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Copying the "Solution" and Running It Fails Immediately',
      points: [
        'The challenge\'s published PostgreSQL solution is: BEGIN; DECLARE v_stock INT; SELECT stock INTO v_stock FROM products WHERE product_id = 1 FOR UPDATE; IF v_stock >= 5 THEN ... END IF; COMMIT;. Read as plain SQL (what a reader would paste into psql or any SQL client), this fails immediately — DECLARE v_stock INT, SELECT ... INTO a variable, and IF ... THEN ... END IF are all PL/pgSQL constructs. None of them are valid outside a function body or a DO $$ ... $$ block.',
        'The main page\'s OWN separate isolation-levels topic gets this exactly right elsewhere — its "SERIALIZABLE & retry (PostgreSQL)" example correctly wraps its DECLARE/BEGIN/IF logic inside DO $$ ... $$;. The locking challenge\'s solution never received that same wrapper.',
      ],
    },
    {
      heading: 'What Actually Happens When You Run It',
      points: [
        'PostgreSQL\'s top-level DECLARE statement is reserved exclusively for CURSOR declarations (DECLARE cursor_name CURSOR FOR ...) — DECLARE v_stock INT with no CURSOR keyword doesn\'t match that grammar at all, and PostgreSQL raises a syntax error at the DECLARE line itself, before ever reaching the SELECT.',
        'Even if that line were somehow skipped, SELECT ... INTO a plain variable and a bare IF ... THEN ... END IF block are also PL/pgSQL-only — neither has a standalone-SQL equivalent. The entire block, copied and run exactly as published, cannot execute at all.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Running the challenge\'s exact published solution',
      language: 'sql',
      code: `CREATE TABLE products (product_id INT PRIMARY KEY, stock INT);
CREATE TABLE order_items (product_id INT, qty INT);
INSERT INTO products VALUES (1, 10);

-- The challenge's own PostgreSQL "solution," copied verbatim:
BEGIN;
DECLARE v_stock INT;
SELECT stock INTO v_stock
FROM   products
WHERE  product_id = 1
FOR UPDATE;

IF v_stock >= 5 THEN
    UPDATE products SET stock = stock - 5 WHERE product_id = 1;
    INSERT INTO order_items (product_id, qty) VALUES (1, 5);
ELSE
    RAISE NOTICE 'Insufficient stock';
END IF;
COMMIT;

-- ERROR:  syntax error at or near "v_stock"
-- LINE 3: DECLARE v_stock INT;
--                 ^
--
-- Fails at the very first non-transaction-control statement --
-- DECLARE outside PL/pgSQL only accepts cursor declarations, and
-- "v_stock INT" doesn't match that grammar.`,
    },
    {
      label: 'The correct fix — wrap it in a DO block, matching the page\'s own pattern elsewhere',
      language: 'sql',
      code: `DO $$
DECLARE
    v_stock INT;
BEGIN
    SELECT stock INTO v_stock
    FROM   products
    WHERE  product_id = 1
    FOR UPDATE;

    IF v_stock >= 5 THEN
        UPDATE products SET stock = stock - 5 WHERE product_id = 1;
        INSERT INTO order_items (product_id, qty) VALUES (1, 5);
    ELSE
        RAISE NOTICE 'Insufficient stock';
    END IF;
END;
$$;
-- Runs successfully. The DO $$ ... $$ block gives PostgreSQL a
-- PL/pgSQL execution context, making DECLARE, SELECT ... INTO, and
-- IF ... THEN ... END IF all valid -- exactly the wrapper the main
-- page's own isolation-levels "SERIALIZABLE & retry" example already
-- uses correctly for a structurally identical scenario.`,
    },
    {
      label: 'An alternative: as a real, reusable function',
      language: 'sql',
      code: `CREATE OR REPLACE FUNCTION deduct_stock(p_product_id INT, p_qty INT)
RETURNS BOOLEAN
LANGUAGE plpgsql AS $$
DECLARE
    v_stock INT;
BEGIN
    SELECT stock INTO v_stock
    FROM   products
    WHERE  product_id = p_product_id
    FOR UPDATE;

    IF v_stock >= p_qty THEN
        UPDATE products SET stock = stock - p_qty WHERE product_id = p_product_id;
        INSERT INTO order_items (product_id, qty) VALUES (p_product_id, p_qty);
        RETURN TRUE;
    END IF;
    RETURN FALSE;
END;
$$;

-- Callable directly, and reusable across the application:
SELECT deduct_stock(1, 5);
-- t (true) -- deducted successfully, exactly the intended locking
-- behavior, wrapped in a form that's actually valid to run.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer copies the challenge\'s exact PostgreSQL "solution" into a migration script and it fails in CI with a syntax error. They assume they must have introduced a typo while copying, and spend time diffing their script against the page character by character. Was there a typo to find, and what should they have concluded instead?',
    hint: 'Check whether the exact, unmodified text from the page — copied with zero changes — would ALSO produce this error.',
    solution: `There was no typo to find — the challenge's PostgreSQL solution, copied
character-for-character with zero modifications, fails with the exact
same syntax error, because DECLARE, SELECT ... INTO, and IF ... THEN
... END IF are PL/pgSQL constructs that are never valid as standalone
SQL statements, regardless of how carefully they're transcribed.

The developer's diffing effort was pointed at the wrong problem —
the bug isn't in their copy, it's in the source they copied from. The
correct conclusion, and the actual fix, is to wrap the entire block
in DO $$ ... $$; (or move it into a proper PL/pgSQL function, as
shown above) to give PostgreSQL the execution context these
constructs require — exactly the wrapper the main page's own
isolation-levels topic already demonstrates correctly for a
structurally identical scenario, just never applied here.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the challenge\'s PostgreSQL solution — BEGIN; DECLARE v_stock INT; SELECT ... INTO v_stock ...; IF ... END IF; COMMIT; — is valid, runnable SQL that a reader can copy and execute directly.',
      reality: 'DECLARE (for a scalar variable), SELECT ... INTO a variable, and IF ... THEN ... END IF are all PL/pgSQL-only constructs — none of them are valid outside a function body or a DO $$ ... $$ block, and the published solution never wraps them in one.',
    },
    {
      thought: 'a syntax error when copying a "solution" from a reference page always indicates a transcription mistake on the copier\'s part.',
      reality: 'in this case the error reproduces identically with a character-for-character copy — the bug is in the published solution itself, not in how it was transcribed.',
    },
    {
      thought: 'PostgreSQL\'s DECLARE statement works the same way inside and outside of PL/pgSQL, just declaring a variable either way.',
      reality: 'PostgreSQL\'s TOP-LEVEL DECLARE statement is reserved exclusively for cursor declarations (DECLARE cursor_name CURSOR FOR ...) — declaring a scalar variable like v_stock INT is only valid inside a PL/pgSQL block.',
    },
  ];
}
