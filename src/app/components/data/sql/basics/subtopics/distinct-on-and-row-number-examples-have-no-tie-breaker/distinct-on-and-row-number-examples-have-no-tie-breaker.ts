import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-distinct-on-row-number-tie-breaker-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './distinct-on-and-row-number-examples-have-no-tie-breaker.html',
  styleUrl: './distinct-on-and-row-number-examples-have-no-tie-breaker.scss',
})
export class DistinctOnAndRowNumberExamplesHaveNoTieBreakerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Test With a Deliberate Tie Exposes the Gap',
      points: [
        'The main page\'s own "most recent order per customer" examples order by ORDER BY customer_id, order_date DESC (PostgreSQL DISTINCT ON) and PARTITION BY customer_id ORDER BY order_date DESC (MSSQL ROW_NUMBER()) — neither has a further tie-breaking column. When two orders for the same customer share the exact same order_date, "most recent" becomes ambiguous: the engine is free to return either row, and a query plan change (a new index, an updated statistics run, a version upgrade) can silently flip which one it picks — with no error and no warning.',
        'A test built around a deliberate tie proves this concretely: insert two orders for the same customer with an IDENTICAL order_date but different order_id and total_amount, run the main page\'s own query, and check which row comes back. Run it again after forcing a different plan (e.g. via a hint, or after rebuilding statistics) and the result can change — proving the "most recent" pick was never actually deterministic to begin with.',
      ],
    },
    {
      heading: 'The Fix Is a Deterministic Tie-Breaker Column',
      points: [
        'Adding a stable, unique tie-breaker to the ORDER BY — typically order_id, since it is unique and monotonically increasing — removes the ambiguity entirely: ORDER BY customer_id, order_date DESC, order_id DESC (PostgreSQL) or PARTITION BY customer_id ORDER BY order_date DESC, order_id DESC (MSSQL). Now, even when two orders share an identical order_date, the tie-breaker guarantees the same row is chosen every time, regardless of query plan.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'PostgreSQL — reproducing the tie with DISTINCT ON',
      language: 'sql',
      code: `-- Two orders for the same customer, same order_date (a genuine tie):
INSERT INTO orders (order_id, customer_id, order_date, total_amount) VALUES
  (501, 42, '2026-03-01 00:00:00', 19.99),
  (502, 42, '2026-03-01 00:00:00', 249.99);

-- The main page's own query -- no tie-breaker after order_date:
SELECT DISTINCT ON (customer_id)
    customer_id, order_id, order_date, total_amount
FROM orders
ORDER BY customer_id, order_date DESC;
-- Which row (501 or 502) comes back for customer 42 is UNSPECIFIED --
-- the engine is free to pick either, and a plan change can flip it.`,
    },
    {
      label: 'MSSQL — the same ambiguity with ROW_NUMBER()',
      language: 'sql',
      code: `INSERT INTO orders (order_id, customer_id, order_date, total_amount) VALUES
  (501, 42, '2026-03-01', 19.99),
  (502, 42, '2026-03-01', 249.99);

-- The main page's own MSSQL equivalent -- same missing tie-breaker:
SELECT customer_id, order_id, order_date, total_amount
FROM (
    SELECT customer_id, order_id, order_date, total_amount,
           ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) AS rn
    FROM orders
) t
WHERE rn = 1;
-- Same problem: order_id 501 or 502 for customer 42 is unspecified.`,
    },
    {
      label: 'The fix — add a deterministic tie-breaker',
      language: 'sql',
      code: `-- PostgreSQL: order_id DESC breaks the tie deterministically
SELECT DISTINCT ON (customer_id)
    customer_id, order_id, order_date, total_amount
FROM orders
ORDER BY customer_id, order_date DESC, order_id DESC;
-- Always returns order_id 502 for customer 42 -- same result every run.

-- MSSQL: same fix in the PARTITION BY's ORDER BY
SELECT customer_id, order_id, order_date, total_amount
FROM (
    SELECT customer_id, order_id, order_date, total_amount,
           ROW_NUMBER() OVER (
             PARTITION BY customer_id
             ORDER BY order_date DESC, order_id DESC
           ) AS rn
    FROM orders
) t
WHERE rn = 1;
-- Always returns order_id 502 -- deterministic regardless of plan.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A "most recent order per customer" report built on the main page\'s own DISTINCT ON query passes every manual QA check, then starts returning a different order for one customer after an unrelated index was added to the orders table. No data changed. What\'s the most likely explanation, and what\'s the one-line fix?',
    hint: 'Think about what happens to "most recent" when two rows are exactly tied on the ORDER BY column, and how a new index could change which one the engine happens to return.',
    solution: `The most likely explanation is that the customer in question has two (or
more) orders sharing the exact same order_date -- a genuine tie on the
only column in the ORDER BY. Without a further tie-breaker, DISTINCT
ON's choice of "first row per group" is unspecified whenever there's a
tie; a new index changed the engine's chosen access path/plan, and the
new plan happened to visit the tied rows in a different order than
before, flipping which one DISTINCT ON kept.

The fix is to add a deterministic tie-breaker column to the ORDER BY --
typically the unique order_id: ORDER BY customer_id, order_date DESC,
order_id DESC. This guarantees the same row is chosen for a given tie
every time, regardless of which physical order the engine happens to
read rows in.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own <code>DISTINCT ON (customer_id) ... ORDER BY customer_id, order_date DESC</code> query always returns the exact same "most recent" row for a given customer, run after run.',
      reality: 'if two orders for that customer share the exact same order_date, there is no tie-breaker in the ORDER BY -- which specific row is returned is unspecified, and a query plan change (new index, updated statistics, engine version) can silently flip the result.',
    },
    {
      thought: 'ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) always assigns rn = 1 to a well-defined, unique "most recent" row.',
      reality: 'when two rows in the same partition tie on order_date, ROW_NUMBER() still assigns 1 and 2 to them in some order -- but which physical row gets 1 is unspecified without a deterministic tie-breaker, exactly the same ambiguity as DISTINCT ON.',
    },
    {
      thought: 'this kind of non-determinism only matters for exotic edge cases that would never show up in a real orders table.',
      reality: 'timestamp columns are far more prone to exact duplicates than they look -- bulk imports, batch jobs, and any order_date stored with low precision (e.g. DATE instead of DATETIME2/TIMESTAMPTZ) make same-instant ties common, not rare.',
    },
  ];
}
