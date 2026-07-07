import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-step4-missing-duplicate-guard-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-the-challenges-step-4-insert-is-missing-the-duplicate-guard.html',
  styleUrl: './testing-that-the-challenges-step-4-insert-is-missing-the-duplicate-guard.scss',
})
export class TestingThatTheChallengesStep4InsertIsMissingTheDuplicateGuardSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'What Step 3 Checks vs. What Step 4 Filters',
      points: [
        'The challenge\'s solution Step 3 ("find invalid rows") explicitly flags FOUR kinds of bad data, one of which is: OR product_id IN (SELECT product_id FROM products_staging GROUP BY product_id HAVING COUNT(*) > 1) — duplicate product_id values within the staging file are treated as invalid.',
        'Step 4 ("insert valid rows into products") is framed as the complement of Step 3 — rows that are NOT invalid. But Step 4\'s actual WHERE clause only re-checks price validity, category_id validity, and category existence: WHERE TRY_CAST(price ...) IS NOT NULL AND TRY_CAST(category_id ...) IS NOT NULL AND EXISTS (... categories ...). The duplicate-product_id condition from Step 3 is never repeated in Step 4\'s filter.',
      ],
    },
    {
      heading: 'What Actually Happens on a File With Duplicate IDs',
      points: [
        'If products.csv has the same product_id appearing twice (with otherwise valid price/category data on both rows — exactly the "duplicate in file" case Step 3\'s own comment describes), BOTH rows pass every condition in Step 4\'s WHERE clause, since neither condition inspects row-count-per-product_id.',
        'Assuming products.product_id is a PRIMARY KEY or UNIQUE constraint (the normal, expected design for a product catalog\'s natural business key), the first duplicate row inserts successfully and the second one raises a primary-key/unique-constraint violation — the entire INSERT … SELECT statement fails (and, without special error handling, none of the batch\'s rows are committed), even though Step 3 already correctly identified this exact scenario as "invalid."',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the challenge\'s exact Step 3 + Step 4',
      language: 'sql',
      code: `CREATE TABLE products_staging (
    product_id  TEXT, name TEXT, price TEXT, category_id TEXT
);
CREATE TABLE products (
    product_id  INT PRIMARY KEY,
    name        TEXT,
    price       DECIMAL(10,2),
    category_id INT REFERENCES categories(id)
);

-- Simulate a staging load with a duplicate product_id (both otherwise valid)
INSERT INTO products_staging VALUES
  ('101', 'Widget',      '9.99',  '1'),
  ('101', 'Widget (v2)', '11.99', '1');   -- same product_id, valid data

-- Step 3 (from the challenge's own solution) correctly flags this:
SELECT * FROM products_staging
WHERE TRY_CAST(price AS DECIMAL(10,2)) IS NULL
   OR TRY_CAST(category_id AS INT) IS NULL
   OR NOT EXISTS (SELECT 1 FROM categories WHERE id = TRY_CAST(category_id AS INT))
   OR product_id IN (
        SELECT product_id FROM products_staging
        GROUP BY product_id HAVING COUNT(*) > 1
      );
-- Returns BOTH rows -- Step 3 correctly identifies them as invalid.

-- Step 4 (from the challenge's own solution) -- no duplicate check:
INSERT INTO products (product_id, name, price, category_id)
SELECT TRY_CAST(product_id AS INT), name,
       TRY_CAST(price AS DECIMAL(10,2)), TRY_CAST(category_id AS INT)
FROM products_staging
WHERE TRY_CAST(price AS DECIMAL(10,2)) IS NOT NULL
  AND TRY_CAST(category_id AS INT) IS NOT NULL
  AND EXISTS (SELECT 1 FROM categories WHERE id = TRY_CAST(category_id AS INT));

-- Msg 2627, Level 14, State 1
-- Violation of PRIMARY KEY constraint 'PK_products'.
-- Cannot insert duplicate key in object 'dbo.products'.
-- The duplicate key value is (101).
-- The statement has been terminated.`,
    },
    {
      label: 'The fix — repeat Step 3\'s duplicate check in Step 4\'s filter',
      language: 'sql',
      code: `INSERT INTO products (product_id, name, price, category_id)
SELECT TRY_CAST(product_id AS INT), name,
       TRY_CAST(price AS DECIMAL(10,2)), TRY_CAST(category_id AS INT)
FROM products_staging
WHERE TRY_CAST(price AS DECIMAL(10,2)) IS NOT NULL
  AND TRY_CAST(category_id AS INT) IS NOT NULL
  AND EXISTS (SELECT 1 FROM categories WHERE id = TRY_CAST(category_id AS INT))
  AND product_id NOT IN (
        SELECT product_id FROM products_staging
        GROUP BY product_id HAVING COUNT(*) > 1
      );
-- Now genuinely excludes every row Step 3 flagged as invalid --
-- succeeds even when products_staging contains duplicate product_ids.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You run the challenge\'s solution exactly as published against a products.csv that happens to have zero duplicate product_ids. It works fine. A colleague later reuses the same Step 4 query against a different month\'s file that DOES contain one duplicate. What happens, and does Step 3\'s validation query give any warning beforehand?',
    hint: 'Compare exactly which conditions appear in Step 3\'s WHERE clause versus Step 4\'s WHERE clause — are they the same four checks, or fewer?',
    solution: `Step 3's query, if run first, WOULD correctly show the duplicate
rows as invalid -- so if your colleague inspects Step 3's output
before running Step 4, they would see a warning sign. But nothing
in the challenge's own flow forces that inspection to happen, and
Step 4 does not re-check for duplicates on its own. If Step 4 is
run directly (or if Step 3's results are glanced at but the
duplicate condition isn't specifically noticed among four different
kinds of flagged rows), the INSERT fails partway through with a
primary-key violation on the second duplicate row -- the whole
statement is terminated, and NONE of that batch's valid rows get
inserted either (a single failing INSERT ... SELECT is one
statement, one implicit transaction).

The fix is for Step 4's WHERE clause to independently repeat all
FOUR conditions Step 3 checks for -- including the duplicate
product_id check -- so it doesn't depend on someone manually
cross-referencing Step 3's output before running Step 4.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a challenge\'s Step 3 shows how to detect invalid rows, its Step 4 "insert valid rows" step must be filtering out everything Step 3 flagged.',
      reality: 'here Step 4\'s WHERE clause only reimplements three of Step 3\'s four checks — the duplicate-product_id condition from Step 3 is never repeated, so Step 4 does not actually filter out everything Step 3 identifies as invalid.',
    },
    {
      thought: 'a staged CSV import pipeline is inherently protected against duplicate keys as long as a validation query exists somewhere in the process.',
      reality: 'a validation query only protects the data if its EXACT conditions are also enforced (or re-checked) at the actual INSERT step — writing a detection query and forgetting to wire all of it into the insert filter leaves the gap this subtopic demonstrates.',
    },
    {
      thought: 'a PRIMARY KEY violation on an INSERT ... SELECT just skips the offending row and inserts the rest.',
      reality: 'a single INSERT ... SELECT statement is one atomic operation — hitting a constraint violation partway through terminates the whole statement, and (without row-by-row error handling) none of that batch\'s rows are committed, not just the duplicate one.',
    },
  ];
}
